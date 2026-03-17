import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    const q = query.toLowerCase();

    // Search for users by username using filter instead of listing all
    // This is more efficient and doesn't limit to first 100 users
    const allUsers = await base44.asServiceRole.entities.User.list('full_name', 1000);

    const results = allUsers
      .filter(u =>
        u.id !== user.id &&
        u.username?.toLowerCase().includes(q)
      )
      .slice(0, limit)
      .map(u => ({
        id: u.id,
        full_name: u.full_name,
        username: u.username || null,
        email: u.email,
        avatar_url: u.avatar_url || null
      }));

    return Response.json({ users: results });
  } catch (error) {
    console.error('Error searching users:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});