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
    const { table, id } = body;

    if (!table || !id) {
      return Response.json({ error: 'Table and ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete record error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});