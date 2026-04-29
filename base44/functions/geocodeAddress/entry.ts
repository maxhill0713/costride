import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address, city, postcode } = await req.json();
    const query = [address, city, postcode].filter(Boolean).join(', ');

    if (!query.trim()) {
      return Response.json({ error: 'No address provided' }, { status: 400 });
    }

    // Use Nominatim (OpenStreetMap) — free, no key required
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CoStride-App/1.0' }
    });
    const data = await res.json();

    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      console.log(`Geocoded "${query}" → ${latitude}, ${longitude}`);
      return Response.json({ latitude, longitude });
    }

    console.warn(`Nominatim found no results for "${query}"`);
    return Response.json({ error: 'No results found for that address' }, { status: 422 });
  } catch (error) {
    console.error('Geocode error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});