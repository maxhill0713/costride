import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * refreshGymPhotos
 *
 * Runs weekly (via scheduled automation) to:
 * 1. Find all approved gyms that have a google_place_id
 * 2. Fetch a fresh photo from the Google Places API
 * 3. Download the image and upload it to permanent Base44 storage
 * 4. Save the permanent URL back to Gym.image_url
 *
 * This prevents gym images from disappearing as Google Places photo URLs expire.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled automations (no user) OR admin users
    let user = null;
    try { user = await base44.auth.me(); } catch (_) { /* scheduled call — no user */ }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not set');
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Fetch all approved gyms with a google_place_id
    const gyms = await base44.asServiceRole.entities.Gym.filter({ status: 'approved' }, 'name', 200);
    const gymsWithPlaceId = gyms.filter(g => g.google_place_id);

    console.log(`Found ${gymsWithPlaceId.length} gyms with Google Place IDs to refresh`);

    let updated = 0;
    let failed  = 0;

    for (const gym of gymsWithPlaceId) {
      try {
        // Fetch place details to get a fresh photo reference
        const detailsUrl = `https://places.googleapis.com/v1/places/${gym.google_place_id}`;
        const detailsRes = await fetch(detailsUrl, {
          headers: {
            'X-Goog-Api-Key':   apiKey,
            'X-Goog-FieldMask': 'photos',
          },
        });

        if (!detailsRes.ok) {
          console.warn(`Failed to fetch place details for gym ${gym.id} (${gym.name}): ${detailsRes.status}`);
          failed++;
          continue;
        }

        const details = await detailsRes.json();
        if (!details.photos?.length) {
          console.log(`No photos found for gym ${gym.id} (${gym.name}), skipping`);
          continue;
        }

        const photoName = details.photos[0].name;
        const photoUrl  = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=800`;

        // Download the image
        const imgRes = await fetch(photoUrl);
        if (!imgRes.ok) {
          console.warn(`Failed to download photo for gym ${gym.id} (${gym.name}): ${imgRes.status}`);
          failed++;
          continue;
        }

        const imgBuffer   = await imgRes.arrayBuffer();
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        const ext         = contentType.includes('png') ? 'png' : 'jpg';
        const blob        = new Blob([imgBuffer], { type: contentType });
        const file        = new File([blob], `gym_${gym.id}.${ext}`, { type: contentType });

        // Upload to permanent Base44 storage via SDK integration
        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        const permanentUrl = uploadResult?.file_url;

        if (!permanentUrl) {
          console.warn(`Upload returned no file_url for gym ${gym.id} (${gym.name}):`, JSON.stringify(uploadResult));
          failed++;
          continue;
        }

        // Save the permanent URL back to the Gym entity
        await base44.asServiceRole.entities.Gym.update(gym.id, { image_url: permanentUrl });
        console.log(`Updated gym ${gym.id} (${gym.name}) with permanent image URL`);
        updated++;

        // Small delay to avoid hammering APIs
        await new Promise(r => setTimeout(r, 400));

      } catch (gymErr) {
        console.error(`Error processing gym ${gym.id} (${gym.name}):`, gymErr.message);
        failed++;
      }
    }

    console.log(`refreshGymPhotos complete: ${updated} updated, ${failed} failed out of ${gymsWithPlaceId.length} gyms`);
    return Response.json({ success: true, updated, failed, total: gymsWithPlaceId.length });

  } catch (error) {
    console.error('refreshGymPhotos fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});