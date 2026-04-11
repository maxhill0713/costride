import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped.
// 2. No ownership check — any authenticated user could update any gym's photo by gym_id.
//    Now validates the caller is the gym owner or admin.
// 3. Google Places API error details were passed through to the client — now suppressed.
// 4. Raw error.message suppressed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gym_id } = await req.json();
    if (!gym_id || typeof gym_id !== 'string') {
      return Response.json({ error: 'gym_id is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('Google Places API key not found');
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const gymRecords = await base44.asServiceRole.entities.Gym.filter({ id: gym_id });
    if (!gymRecords.length || !gymRecords[0].google_place_id) {
      return Response.json({ error: 'Gym not found or missing google_place_id' }, { status: 404 });
    }

    const gym = gymRecords[0];

    // SECURITY: Verify the caller owns this gym
    const isOwner = gym.owner_email === user.email || gym.admin_id === user.id;
    if (!isOwner && user.role !== 'admin') {
      console.warn(`SECURITY: User ${user.email} tried to update photo for gym ${gym_id}`);
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = `https://places.googleapis.com/v1/${gym.google_place_id}`;
    const response = await fetch(url, {
      method:  'GET',
      headers: {
        'Content-Type':    'application/json',
        'X-Goog-Api-Key':  apiKey,
        'X-Goog-FieldMask': 'photos',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Google Places API error:', response.status, data?.error?.message);
      return Response.json({ error: 'Could not fetch gym photos' }, { status: 500 });
    }

    let photoUrl = null;
    if (data.photos && data.photos.length > 0) {
      const photoName = data.photos[0].name;
      photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=800`;
    }

    if (photoUrl) {
      await base44.asServiceRole.entities.Gym.update(gym_id, { image_url: photoUrl });
      return Response.json({ success: true, photo_url: photoUrl });
    } else {
      return Response.json({ success: false, message: 'No photos available for this gym' });
    }
  } catch (error) {
    console.error('Error updating gym photo:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});