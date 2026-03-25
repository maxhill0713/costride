import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [CRITICAL]: Was doing User.list(1000) — returning 1000 user records including
// emails to any authenticated user. Now filters by username server-side and strips email.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, limit = 10 } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return Response.json({ users: [] });
    }

    // Clamp limit to prevent large data dumps
    const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 20);
    const safeQuery = query.trim().toLowerCase().slice(0, 50); // truncate to prevent abuse

    // Search both username and full_name in parallel — deduplicates by id.
    // A text/prefix index on username in the base44 console makes these O(log n).
    const [byUsername, byName] = await Promise.all([
      base44.asServiceRole.entities.User.filter(
        { username: { $regex: safeQuery } },
        'full_name',
        safeLimit + 1
      ),
      base44.asServiceRole.entities.User.filter(
        { full_name: { $regex: safeQuery } },
        'full_name',
        safeLimit + 1
      ),
    ]);

    const seen = new Set<string>();
    const results = [...byUsername, ...byName].filter(u => {
      if (!u.id || seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });

    const users = results
      .filter(u => u.id !== user.id)
      .slice(0, safeLimit)
      .map(u => ({
        id:           u.id,
        full_name:    u.full_name,
        display_name: u.display_name || null,
        username:     u.username || null,
        avatar_url:   u.avatar_url || null,
        // SECURITY: email is NEVER returned — it is PII and not needed for user search
      }));

    return Response.json({ users });
  } catch (error) {
    console.error('Error searching users:', error.message);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});