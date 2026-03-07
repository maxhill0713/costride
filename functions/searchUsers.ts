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

    // Fetch users by name match and by email match separately, then merge
    const [byName, byEmail] = await Promise.all([
      base44.asServiceRole.entities.User.filter(
        { full_name: { $regex: query, $options: 'i' } },
        'full_name',
        50
      ).catch(() => []),
      base44.asServiceRole.entities.User.filter(
        { email: { $regex: query, $options: 'i' } },
        'full_name',
        50
      ).catch(() => [])
    ]);

    // Merge, deduplicate, exclude self
    const seen = new Set();
    const results = [];
    for (const u of [...byName, ...byEmail]) {
      if (!seen.has(u.id) && u.id !== user.id) {
        seen.add(u.id);
        results.push({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          avatar_url: u.avatar_url || null
        });
      }
      if (results.length >= limit) break;
    }

    return Response.json({ users: results });
  } catch (error) {
    console.error('Error searching users:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});