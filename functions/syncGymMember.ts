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
      nickname: data.nickname,
      avatar_url: data.avatar_url,
      join_date: data.join_date,
      weight_class: data.weight_class,
      gym_id: hexToUuid(data.gym_id),
      created_by: data.created_by,
      created_date: data.created_date || new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    if (eventType === 'create') {
      const { error } = await supabase
        .from('gym_members')
        .insert(supabaseData);

      if (error) throw error;
    } else if (eventType === 'update') {
      const { error } = await supabase
        .from('gym_members')
        .update(supabaseData)
        .eq('id', hexToUuid(entityId));

      if (error) throw error;
    } else if (eventType === 'delete') {
      const { error } = await supabase
        .from('gym_members')
        .delete()
        .eq('id', hexToUuid(entityId));

      if (error) throw error;
    }

    return Response.json({ 
      success: true,
      entity_id: entityId,
      operation: eventType
    });
  } catch (error) {
    console.error('Sync gym member error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});