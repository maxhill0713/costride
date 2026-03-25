import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [LOW]:
// 1. SDK version bumped.
// 2. Google Places API error details (including internal API messages) were returned to client.
//    Now suppressed.
// 3. searchQuery is now length-capped to prevent abuse.

// In-memory rate limiter: max 10 requests per user per minute
const rateLimitMap = new Map();

function checkRateLimit(userId) {
  const now      = Date.now();
  const windowMs = 60 * 1000;
  const max      = 10;
  const entry    = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(user.id)) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return Response.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    const { query, input } = await req.json();
    const searchQuery = ((query || input) || '').trim().slice(0, 100);

    if (!searchQuery || searchQuery.length < 2) {
      return Response.json({ error: 'Search query is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('Google Places API key not found');
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const url      = 'https://places.googleapis.com/v1/places:searchText';
    const response = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'X-Goog-Api-Key':  apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos',
      },
      body: JSON.stringify({ textQuery: searchQuery + ' gym', maxResultCount: 10 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Places API error:', response.status, errorText);
      return Response.json({ error: 'Places search failed' }, { status: 500 });
    }

    const data   = await response.json();
    // SECURITY: Do NOT embed the API key in photo URLs returned to the client — the key
    // would be visible in browser network logs and exploitable for unauthorized API calls.
    // Instead we return the photo resource name; the client should proxy requests through
    // the backend (or use a domain-restricted key in Google Cloud Console).
    // As an interim measure we return photoName only (no key embedded).
    const places = (data.places || []).map(place => {
      let photoUrl = null;
      if (place.photos?.length > 0) {
        const photoName = place.photos[0].name;
        // Safe: resource path only, no key. Frontend may call /api/gymPhoto?name=... proxy.
        photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=800`;
      }
      const parts    = place.formattedAddress?.split(', ') || [];
      const city     = parts.length >= 2 ? parts[parts.length - 2] : '';
      const postcode = parts.length >= 1 ? parts[parts.length - 1] : '';
      return {
        place_id:  place.id,
        name:      place.displayName?.text || place.displayName,
        address:   place.formattedAddress,
        city, postcode,
        latitude:  place.location?.latitude,
        longitude: place.location?.longitude,
        rating:    place.rating,
        photo_url: photoUrl,
      };
    });

    return Response.json({ results: places });
  } catch (error) {
    console.error('Error searching gyms:', error);
    return Response.json({ results: [] });
  }
});