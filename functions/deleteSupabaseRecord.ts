import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { table, id } = body;

    if (!table || !id) {
      console.error('Missing parameters - Table:', table, 'ID:', id, 'Full body:', JSON.stringify(body));
      return Response.json({ 
        error: 'Table and ID required',
        received: { table, id, body }
      }, { status: 400 });
    }

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/${table}?id=eq.${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete record');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete record error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});