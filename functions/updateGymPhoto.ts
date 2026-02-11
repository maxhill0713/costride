import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gym_id } = await req.json();

    if (!gym_id) {
      return Response.json({ error: 'gym_id is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!apiKey) {
      console.error('Google Places API key not found');
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Get gym details
    const gym = await base44.asServiceRole.entities.Gym.get(gym_id);
    
    if (!gym || !gym.google_place_id) {
      return Response.json({ error: 'Gym not found or missing google_place_id' }, { status: 404 });
    }

    // Fetch place details with photos
    const url = `https://places.googleapis.com/v1/${gym.google_place_id}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'photos'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Places API error:', data);
      return Response.json({ error: data.error?.status, message: data.error?.message }, { status: 500 });
    }

    let photoUrl = null;
    
    // Get first photo if available
    if (data.photos && data.photos.length > 0) {
      const photoName = data.photos[0].name;
      photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=800`;
    }

    if (photoUrl) {
      // Update gym with photo
      await base44.asServiceRole.entities.Gym.update(gym_id, { image_url: photoUrl });
      return Response.json({ success: true, photo_url: photoUrl });
    } else {
      return Response.json({ success: false, message: 'No photos available for this gym' });
    }

  } catch (error) {
    console.error('Error updating gym photo:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});