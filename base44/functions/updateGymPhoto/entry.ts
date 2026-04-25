import { createClientFromRequest } from 'npm:@base44/sdk@0.8.26';

async function fetchAndUploadPhoto(base44, googlePlaceId) {
  try {
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not set');
      return null;
    }

    // Fetch place details to get photo
    const detailsUrl = `https://places.googleapis.com/v1/places/${googlePlaceId}`;
    const detailsRes = await fetch(detailsUrl, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'photos',
      },
    });

    if (!detailsRes.ok) {
      console.warn(`Failed to fetch place details: ${detailsRes.status}`);
      return null;
    }

    const details = await detailsRes.json();
    if (!details.photos?.length) {
      console.log('No photos found for place');
      return null;
    }

    const photoName = details.photos[0].name;
    const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=800`;

    // Download the image
    const imgRes = await fetch(photoUrl);
    if (!imgRes.ok) {
      console.warn(`Failed to download photo: ${imgRes.status}`);
      return null;
    }

    const imgBuffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const blob = new Blob([imgBuffer], { type: contentType });
    const file = new File([blob], `gym_photo.${ext}`, { type: contentType });

    // Upload to permanent Base44 storage
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    return uploadResult?.file_url || null;
  } catch (e) {
    console.error('Photo upload error:', e.message);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { gym_id, googlePlaceId } = await req.json();

    if (!gym_id || !googlePlaceId) {
      return Response.json({ error: 'gym_id and googlePlaceId are required' }, { status: 400 });
    }

    // Fetch and upload photo
    const permanentUrl = await fetchAndUploadPhoto(base44, googlePlaceId);

    if (!permanentUrl) {
      return Response.json({ error: 'Failed to fetch or upload photo' }, { status: 500 });
    }

    // Update gym with new image URL
    await base44.asServiceRole.entities.Gym.update(gym_id, { image_url: permanentUrl });

    console.log(`Updated gym ${gym_id} with image URL: ${permanentUrl}`);
    return Response.json({ success: true, image_url: permanentUrl });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});