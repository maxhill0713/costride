import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped.
// 2. BestTime API error body (including internal messages) was returned to the client.
//    Now suppressed.
// 3. No gym membership/ownership check — any authenticated user could query foot traffic
//    for any gym_id. Now verifies the caller is a member or owner.
// 4. Raw error.message suppressed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gymId } = await req.json();
    if (!gymId || typeof gymId !== 'string') {
      return Response.json({ error: 'gymId required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('BESTTIME_KEY');
    if (!apiKey) {
      return Response.json({ error: 'BESTTIME_KEY not configured' }, { status: 500 });
    }

    const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    if (!gyms.length) {
      return Response.json({ error: 'Gym not found' }, { status: 404 });
    }
    const gym = gyms[0];

    // SECURITY: Verify the caller is a gym member or owner
    const isOwner = gym.owner_email === user.email || gym.admin_id === user.id;
    if (!isOwner && user.role !== 'admin') {
      const membership = await base44.asServiceRole.entities.GymMembership.filter({
        gym_id: gymId, user_id: user.id, status: 'active',
      });
      if (membership.length === 0) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const venueName = gym.name;
    let venueAddress = gym.address;

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
          }
        }
      }
    }

    if (!venueAddress) {
      return Response.json({ error: 'Gym has no address to look up foot traffic' }, { status: 400 });
    }

    const searchParams = new URLSearchParams({
      api_key_private: apiKey,
      venue_name:      venueName,
      venue_address:   venueAddress,
    });

    let data = null;
    const searchRes = await fetch(`https://besttime.app/api/v1/venues/search?${searchParams}`);
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.status === 'OK' && searchData.venues?.length > 0) {
        const venueId = searchData.venues[0].venue_id;
        const weekRes = await fetch(`https://besttime.app/api/v1/forecasts/week/raw?api_key_private=${apiKey}&venue_id=${venueId}`);
        if (weekRes.ok) {
          const weekData = await weekRes.json();
          if (weekData.status === 'OK') data = weekData;
        }
      }
    }

    if (!data) {
      const params = new URLSearchParams({ api_key_private: apiKey, venue_name: venueName, venue_address: venueAddress });
      const response = await fetch(`https://besttime.app/api/v1/forecasts?${params}`, { method: 'POST' });
      if (!response.ok) {
        console.error('BestTime API error:', response.status);
        return Response.json({ error: 'Could not fetch foot traffic data' }, { status: 502 });
      }
      data = await response.json();
    }

    if (!data || data.status !== 'OK') {
      console.error('BestTime returned non-OK status:', data?.status);
      return Response.json({ error: 'Could not find foot traffic data for this venue' }, { status: 422 });
    }

    const weekData = data.analysis.map(day => {
      const rawValues = day.day_raw || [];
      return {
        day_int:  day.day_info.day_int,
        day_text: day.day_info.day_text,
        hours:    day.hour_analysis.map((h, i) => ({
          hour:       h.hour,
          percentage: h.intensity_nr === -1 ? -1 : (rawValues[i] ?? null),
        })),
      };
    });

    return Response.json({
      venue_id:      data.venue_info?.venue_id,
      venue_name:    data.venue_info?.venue_name,
      venue_address: data.venue_info?.venue_address,
      weekData,
    });
  } catch (error) {
    console.error('getBestTimeFootTraffic error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});