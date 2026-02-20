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
    let venueAddress = gym.address;

    // If we have a google_place_id, resolve the canonical formatted_address via Google Places API.
    // This is critical for chain gyms (e.g. Everlast) with the same name but different branches —
    // Google's formatted_address includes the full street address that BestTime can uniquely match.
    if (gym.google_place_id) {
      const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
      if (googleApiKey) {
        const placeRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${gym.google_place_id}&fields=formatted_address,name&key=${googleApiKey}`
        );
        if (placeRes.ok) {
          const placeData = await placeRes.json();
          if (placeData.status === 'OK' && placeData.result?.formatted_address) {
            venueAddress = placeData.result.formatted_address;
            console.log(`Resolved address via Google Places: ${venueAddress}`);
          }
        }
      }
    }

    if (!venueAddress) {
      return Response.json({ error: 'Gym has no address to look up foot traffic' }, { status: 400 });
    }

    console.log(`Fetching BestTime for: "${venueName}" at "${venueAddress}"`);

    const params = new URLSearchParams({
      api_key_private: apiKey,
      venue_name: venueName,
      venue_address: venueAddress
    });

    // First try the fast "venue week" endpoint (cached data, returns instantly if venue is known)
    let data = null;
    const searchParams = new URLSearchParams({
      api_key_private: apiKey,
      venue_name: venueName,
      venue_address: venueAddress
    });
    const searchRes = await fetch(`https://besttime.app/api/v1/venues/search?${searchParams}`);
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.status === 'OK' && searchData.venues?.length > 0) {
        const venueId = searchData.venues[0].venue_id;
        console.log(`Found cached venue: ${venueId}, fetching week data...`);
        const weekRes = await fetch(`https://besttime.app/api/v1/forecasts/week/raw?api_key_private=${apiKey}&venue_id=${venueId}`);
        if (weekRes.ok) {
          const weekData = await weekRes.json();
          if (weekData.status === 'OK') {
            data = weekData;
          }
        }
      }
    }

    // Fall back to full forecast (slower, generates new forecast)
    if (!data) {
      console.log(`No cached data found, running full forecast...`);
      const response = await fetch(`https://besttime.app/api/v1/forecasts?${params}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('BestTime API error:', response.status, errText);
        return Response.json({ error: `BestTime API error: ${response.status}` }, { status: 502 });
      }

      data = await response.json();
    }

    if (!data || data.status !== 'OK') {
      console.error('BestTime returned non-OK status:', data);
      return Response.json({ error: data?.message || 'BestTime could not find foot traffic data for this venue' }, { status: 422 });
    }

    // Extract the analysis array - each item is a day with hourly data
    // analysis[i].day_info.day_int: 0=Mon, 6=Sun
    // analysis[i].hour_analysis: array of 24 hours with intensity_nr (0-100)
    const analysis = data.analysis;

    // Build a structured week of hourly data using day_raw (0-100 real percentages)
    // intensity_nr: -1 = closed/no data, 999 = outside opening hours (not truly closed for 24hr gyms)
    // day_raw: actual 0-100 busyness percentage per hour
    const weekData = analysis.map(day => {
      const rawValues = day.day_raw || []; // array of 24 values indexed by hour (0=midnight)
      return {
        day_int: day.day_info.day_int,
        day_text: day.day_info.day_text,
        hours: day.hour_analysis.map((h, i) => {
          const rawPct = rawValues[i] !== undefined ? rawValues[i] : null;
          const isClosed = h.intensity_nr === -1;
          return {
            hour: h.hour,
            percentage: isClosed ? -1 : (rawPct !== null ? rawPct : null)
          };
        })
      };
    });

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