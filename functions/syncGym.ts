import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const hexToUuid = (hex) => {
  if (!hex || typeof hex !== 'string') return hex;
  if (hex.includes('-') && hex.length === 36) return hex;
  const cleanHex = hex.replace(/-/g, '');
  const paddedHex = cleanHex.padEnd(32, '0');
  return `${paddedHex.slice(0, 8)}-${paddedHex.slice(8, 12)}-${paddedHex.slice(12, 16)}-${paddedHex.slice(16, 20)}-${paddedHex.slice(20, 32)}`.toLowerCase();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    if (!payload?.event?.type) {
      return Response.json({ success: true, message: 'No event type provided' });
    }

    const eventType = payload.event.type;
    const entityId = payload.event.entity_id;
    const data = payload.data;

    if (!entityId || !data) {
      return Response.json({ error: 'Missing entity data' }, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    const supabaseData = {
      id: hexToUuid(entityId),
      name: data.name,
      owner_email: data.owner_email,
      admin_id: hexToUuid(data.admin_id),
      google_place_id: data.google_place_id,
      latitude: data.latitude,
      longitude: data.longitude,
      join_code: data.join_code,
      qr_code: data.qr_code,
      address: data.address,
      city: data.city,
      postcode: data.postcode,
      type: data.type,
      language: data.language,
      rating: data.rating,
      members_count: data.members_count,
      amenities: data.amenities,
      equipment: data.equipment,
      image_url: data.image_url,
      logo_url: data.logo_url,
      gallery: data.gallery,
      price: data.price,
      reward_offer: data.reward_offer,
      distance_km: data.distance_km,
      verified: data.verified || false,
      specializes_in: data.specializes_in,
      banned_members: data.banned_members,
      status: data.status,
      claim_status: data.claim_status,
      created_by: data.created_by,
      created_date: data.created_date || new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    if (eventType === 'create') {
      const { error } = await supabase
        .from('gyms')
        .insert(supabaseData);

      if (error) throw error;
    } else if (eventType === 'update') {
      const { error } = await supabase
        .from('gyms')
        .update(supabaseData)
        .eq('id', hexToUuid(entityId));

      if (error) throw error;
    } else if (eventType === 'delete') {
      const { error } = await supabase
        .from('gyms')
        .delete()
        .eq('id', hexToUuid(entityId));

      if (error) throw error;
    }

    return Response.json({ 
      success: true, 
      gym_name: data.name,
      gym_id: entityId,
      supabase_id: hexToUuid(entityId)
    });
  } catch (error) {
    console.error('Sync gym error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});