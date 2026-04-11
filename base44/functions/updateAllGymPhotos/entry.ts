import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [LOW]:
// 1. SDK version bumped.
// 2. Raw error.message suppressed.
// (Admin guard already correct, Gym.list() is appropriate here for admin bulk ops)

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const gyms         = await base44.asServiceRole.entities.Gym.list();
    const gymsToUpdate = gyms.filter(g => g.google_place_id);
    const results      = { total: gymsToUpdate.length, updated: 0, failed: 0, no_photos: 0, skipped: 0 };

    console.log(`Found ${gymsToUpdate.length} gyms to update`);

    for (const gym of gymsToUpdate) {
      try {
        const placeId  = gym.google_place_id.replace('places/', '');
        const url      = `https://places.googleapis.com/v1/places/${placeId}`;
        const response = await fetch(url, {
          headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'photos' },
        });

        if (!response.ok) {
          console.error(`API error for ${gym.name}: ${response.status}`);
          results.failed++;
          continue;
        }

        const data = await response.json();
        if (data.photos?.length > 0) {
          const photoName = data.photos[0].name;
          const photoUrl  = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=800`;
          // Only update if it's a new gym (no existing image) or if we have a new photo
          if (!gym.image_url) {
            await base44.asServiceRole.entities.Gym.update(gym.id, { image_url: photoUrl });
            results.updated++;
            console.log(`✓ Updated photo for ${gym.name}`);
          } else {
            results.skipped++; // Already has a photo
          }
        } else {
          if (!gym.image_url) {
            results.no_photos++; // No photo from Google Places, gym has no image
          } else {
            results.skipped++; // Keep existing photo, Google Places has none
          }
        }

        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.failed++;
        console.error(`Failed to update ${gym.name}:`, error.message);
      }
    }

    return Response.json(results);
  } catch (error) {
    console.error('Error updating gym photos:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});