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
      challenge_id: hexToUuid(data.challenge_id),
      user_id: hexToUuid(data.user_id),
      user_name: data.user_name,
      progress_value: data.progress_value || 0,
      completed: data.completed || false,
      joined_date: data.joined_date || new Date().toISOString(),
      created_by: data.created_by,
      created_date: data.created_date || new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    if (eventType === 'create') {
      const { error } = await supabase
        .from('challenge_participants')
        .insert(supabaseData);

      if (error) throw error;
    } else if (eventType === 'update') {
      const { error } = await supabase
        .from('challenge_participants')
        .update(supabaseData)
        .eq('id', hexToUuid(entityId));

      if (error) throw error;
    } else if (eventType === 'delete') {
      const { error } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('id', hexToUuid(entityId));

      if (error) throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Sync challenge participant error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});