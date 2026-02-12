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

    // Use Google Places Autocomplete API (more reliable)
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchQuery + ' gym')}&key=${apiKey}&components=country:gb&type=establishment`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data);
      // Return empty results instead of error
      return Response.json({ places: [] });
    }

    // Get details for each prediction
    const places = [];
    for (const prediction of data.predictions.slice(0, 10)) {
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address,name,photos,rating&key=${apiKey}`;
        const detailResponse = await fetch(detailUrl);
        const detailData = await detailResponse.json();
        
        if (detailData.status === 'OK' && detailData.result) {
          const result = detailData.result;
          let photoUrl = null;
          
          if (result.photos && result.photos.length > 0) {
            photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${result.photos[0].photo_reference}&key=${apiKey}`;
          }
          
          const addressParts = result.formatted_address?.split(', ') || [];
          const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '';
          const postcode = addressParts.length >= 1 ? addressParts[addressParts.length - 1] : '';
          
          places.push({
            place_id: prediction.place_id,
            name: result.name || prediction.main_text,
            address: result.formatted_address || prediction.description,
            city: city,
            postcode: postcode,
            latitude: result.geometry?.location?.lat,
            longitude: result.geometry?.location?.lng,
            rating: result.rating,
            photo_url: photoUrl
          });
        }
      } catch (error) {
        console.error('Error getting place details:', error);
      }
    }

    return Response.json({ places });
  } catch (error) {
    console.error('Error searching gyms:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});