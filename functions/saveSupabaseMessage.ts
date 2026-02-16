import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    const body = await req.json();

    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...body,
        sender_id: body.sender_id || user.id,
        sender_name: body.sender_name || user.full_name
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase message insert error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Save message error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});