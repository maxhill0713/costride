import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const hexToUuid = (hex) => {
  if (!hex || typeof hex !== 'string') return hex;
  if (hex.includes('-') && hex.length === 36) return hex;
  const cleanHex = hex.replace(/-/g, '');
  const paddedHex = cleanHex.padEnd(32, '0');
  return `${paddedHex.slice(0, 8)}-${paddedHex.slice(8, 12)}-${paddedHex.slice(12, 16)}-${paddedHex.slice(16, 20)}-${paddedHex.slice(20, 32)}`.toLowerCase();
};

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    const body = await req.json();
    const { event, data, entity_id } = body;

    const supabaseData = {
      id: hexToUuid(entity_id),
      user_id: hexToUuid(data.user_id),
      user_name: data.user_name,
      gym_id: hexToUuid(data.gym_id),
      gym_name: data.gym_name,
      check_in_date: data.check_in_date,
      first_visit: data.first_visit || false,
      is_rest_day: data.is_rest_day || false,
      created_by: data.created_by,
      created_date: data.created_date,
      updated_date: data.updated_date
    };

    let result;
    if (event.type === 'create') {
      result = await supabase.from('check_ins').insert(supabaseData).select().single();
    } else if (event.type === 'update') {
      result = await supabase.from('check_ins').update(supabaseData).eq('id', hexToUuid(entity_id)).select().single();
    } else if (event.type === 'delete') {
      result = await supabase.from('check_ins').delete().eq('id', hexToUuid(entity_id));
    }

    if (result.error) {
      console.error('Supabase sync error:', result.error);
      throw result.error;
    }

    return Response.json({ 
      success: true, 
      data: result.data,
      entity_id,
      operation: event.type
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ 
      error: error.message,
      entity_id: body?.entity_id,
      operation: body?.event?.type
    }, { status: 500 });
  }
});