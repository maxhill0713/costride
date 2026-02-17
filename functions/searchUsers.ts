import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, limit = 10 } = await req.json();

    if (!query || query.length < 2) {
      return Response.json({ users: [] });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    
    const results = allUsers.filter(u => 
      u.id !== user.id &&
      (u.full_name?.toLowerCase().includes(query.toLowerCase()) ||
       u.email?.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, limit);

    return Response.json({ users: results });
  } catch (error) {
    console.error('Error searching users:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});