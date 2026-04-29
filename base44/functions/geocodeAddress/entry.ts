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

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Geocoding not configured' }, { status: 500 });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      console.log(`Geocoded "${query}" → ${lat}, ${lng}`);
      return Response.json({ latitude: lat, longitude: lng });
    }

    console.warn(`Geocoding failed for "${query}": ${data.status}`);
    return Response.json({ error: `Geocoding failed: ${data.status}` }, { status: 422 });
  } catch (error) {
    console.error('Geocode error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});