import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, input } = await req.json();
    const searchQuery = query || input;

    if (!searchQuery) {
      return Response.json({ error: 'Search query is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!apiKey) {
      console.error('Google Places API key not found');
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos'
      },
      body: JSON.stringify({
        textQuery: searchQuery + ' gym',
        maxResultCount: 10
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Places API error:', response.status, errorText);
      return Response.json({ error: 'Places API failed', details: errorText }, { status: response.status });
    }

    const data = await response.json();

    const places = (data.places || []).map(place => {
      let photoUrl = null;
      
      if (place.photos && place.photos.length > 0) {
        const photoName = place.photos[0].name;
        photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=800`;
      }

      const addressParts = place.formattedAddress?.split(', ') || [];
      const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '';
      const postcode = addressParts.length >= 1 ? addressParts[addressParts.length - 1] : '';
      
      return {
        place_id: place.id,
        name: place.displayName?.text || place.displayName,
        address: place.formattedAddress,
        city: city,
        postcode: postcode,
        latitude: place.location?.latitude,
        longitude: place.location?.longitude,
        rating: place.rating,
        photo_url: photoUrl
      };
    });

    return Response.json({ results: places });
  } catch (error) {
    console.error('Error searching gyms:', error);
    return Response.json({ results: [] });
  }
});