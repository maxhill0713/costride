import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { input } = await req.json();

    if (!input) {
      return Response.json({ error: 'Search input is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!apiKey) {
      console.error('Google Places API key not found');
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Use new Places API (Text Search)
    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos'
      },
      body: JSON.stringify({
        textQuery: input + ' gym',
        maxResultCount: 10
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Places API error:', data);
      return Response.json({ error: data.error?.status, message: data.error?.message }, { status: 500 });
    }

    // Format results from new API
    const results = (data.places || []).map(place => {
      let photoUrl = null;
      
      // Get first photo if available
      if (place.photos && place.photos.length > 0) {
        const photoName = place.photos[0].name;
        // Construct photo URL (max width 800px for good quality)
        photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=800`;
      }
      
      return {
        place_id: place.id,
        name: place.displayName?.text || place.displayName,
        address: place.formattedAddress,
        latitude: place.location?.latitude,
        longitude: place.location?.longitude,
        rating: place.rating,
        photo_url: photoUrl
      };
    });

    return Response.json({ results });
  } catch (error) {
    console.error('Error searching gyms:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});