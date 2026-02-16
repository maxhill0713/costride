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
    const { table, id, updates } = body;

    if (!table || !id || !updates) {
      return Response.json({ error: 'Table, ID, and updates required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Update record error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});