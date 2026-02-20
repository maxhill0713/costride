import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gymId } = await req.json();

    if (!gymId) {
      return Response.json({ error: 'gymId required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('BESTTIME_KEY');
    if (!apiKey) {
      return Response.json({ error: 'BESTTIME_KEY not configured' }, { status: 500 });
    }

    // Fetch gym details
    const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    if (!gyms || gyms.length === 0) {
      return Response.json({ error: 'Gym not found' }, { status: 404 });
    }

    const gym = gyms[0];
    const venueName = gym.name;
    const venueAddress = [gym.address, gym.city, gym.postcode].filter(Boolean).join(', ');

    if (!venueAddress && !gym.google_place_id) {
      return Response.json({ error: 'Gym has no address or place ID to look up foot traffic' }, { status: 400 });
    }

    // Prefer Google Place ID for precise branch lookup (solves chains like Everlast with same name)
    const params = new URLSearchParams({ api_key_private: apiKey });

    if (gym.google_place_id) {
      // BestTime accepts venue_address as a Google Place ID directly when prefixed with "place_id:"
      params.set('venue_name', venueName);
      params.set('venue_address', `place_id:${gym.google_place_id}`);
      console.log(`Fetching BestTime foot traffic via Place ID: ${gym.google_place_id} (${venueName})`);
    } else {
      params.set('venue_name', venueName);
      params.set('venue_address', venueAddress);
      console.log(`Fetching BestTime foot traffic via address: ${venueName}, ${venueAddress}`);
    }

    const response = await fetch(`https://besttime.app/api/v1/forecasts?${params}`, {
      method: 'POST'
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('BestTime API error:', response.status, errText);
      return Response.json({ error: `BestTime API error: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('BestTime returned non-OK status:', data);
      return Response.json({ error: data.message || 'BestTime could not find foot traffic data for this venue' }, { status: 422 });
    }

    // Extract the analysis array - each item is a day with hourly data
    // analysis[i].day_info.day_int: 0=Mon, 6=Sun
    // analysis[i].hour_analysis: array of 24 hours with intensity_nr (0-100)
    const analysis = data.analysis;

    // Build a structured week of hourly intensities
    // BestTime day_int: 0=Mon ... 6=Sun
    // intensity_nr: 0-100 = real busyness, -1 = no data (closed), 999 = outside opening hours per BestTime model
    // We pass closed (-1) as -1 so frontend can show "Closed", and 999 as null so 24hr gyms aren't falsely marked closed
    const weekData = analysis.map(day => ({
      day_int: day.day_info.day_int,
      day_text: day.day_info.day_text,
      hours: day.hour_analysis.map(h => ({
        hour: h.hour,
        intensity: h.intensity_nr === -1 ? -1 : h.intensity_nr === 999 ? null : h.intensity_nr
      }))
    }));

    return Response.json({
      venue_id: data.venue_info?.venue_id,
      venue_name: data.venue_info?.venue_name,
      venue_address: data.venue_info?.venue_address,
      weekData
    });
  } catch (error) {
    console.error('getBestTimeFootTraffic error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});