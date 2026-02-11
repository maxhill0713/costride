import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!apiKey) {
      console.error('Google Places API key not found');
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Get all gyms with google_place_id but no image
    const gyms = await base44.asServiceRole.entities.Gym.list();
    const gymsToUpdate = gyms.filter(g => g.google_place_id && !g.image_url);

    const results = {
      total: gymsToUpdate.length,
      updated: 0,
      failed: 0,
      no_photos: 0
    };

    for (const gym of gymsToUpdate) {
      try {
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

        if (response.ok && data.photos && data.photos.length > 0) {
          const photoName = data.photos[0].name;
          const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=800`;
          
          await base44.asServiceRole.entities.Gym.update(gym.id, { image_url: photoUrl });
          results.updated++;
          console.log(`Updated photo for ${gym.name}`);
        } else {
          results.no_photos++;
          console.log(`No photos available for ${gym.name}`);
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        console.error(`Failed to update ${gym.name}:`, error.message);
      }
    }

    return Response.json(results);
  } catch (error) {
    console.error('Error updating gym photos:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});