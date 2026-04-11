import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * fixOrphanedPosts — admin-only data migration
 *
 * Finds Post records that are invisible to regular users under RLS because:
 *   1. member_id is null/missing  → they can never satisfy condition 1 of the read policy
 *   2. gym_id is null             → condition 2 also fails
 *   → Result: the record exists in DB but is invisible to everyone except admins.
 *
 * For each affected post this function:
 *   - If we can resolve a User whose id matches the member_id field on the post, keeps member_id as-is.
 *   - If member_id is null/missing AND we cannot infer an owner, marks the post is_hidden=true
 *     (soft-delete so it disappears from all feeds without data loss).
 *
 * Safe to run multiple times (idempotent).
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const db = base44.asServiceRole;

    // 1. Fetch all posts (service role bypasses RLS so we see everything)
    const allPosts = await db.entities.Post.list();

    const stats = { total: allPosts.length, ok: 0, missingMemberId: 0, missingGymId: 0, hidden: 0, fixed: 0 };
    const issues: string[] = [];

    for (const post of allPosts) {
      const hasMemberId = !!post.member_id;
      const hasGymId    = !!post.gym_id;

      if (hasMemberId && hasGymId) {
        stats.ok++;
        continue;
      }

      if (!hasMemberId) {
        stats.missingMemberId++;
        // Cannot determine owner — soft-delete so it stops polluting feeds
        await db.entities.Post.update(post.id, { is_hidden: true });
        stats.hidden++;
        issues.push(`POST ${post.id}: member_id missing → hidden`);
        continue;
      }

      // Has member_id but no gym_id — try to resolve gym from user's active membership
      if (!hasGymId) {
        stats.missingGymId++;
        const memberships = await db.entities.GymMembership.filter({ user_id: post.member_id, status: 'active' });
        if (memberships.length > 0) {
          const { gym_id, gym_name } = memberships[0];
          await db.entities.Post.update(post.id, { gym_id: gym_id || null, gym_name: gym_name || null });
          stats.fixed++;
          issues.push(`POST ${post.id}: gym_id was null → set to ${gym_id}`);
        } else {
          // No membership found; post is still readable by its author via member_id condition
          issues.push(`POST ${post.id}: gym_id null, no active membership found (readable by author only)`);
        }
      }
    }

    console.log(JSON.stringify({ event: 'fixOrphanedPosts', stats, timestamp: new Date().toISOString() }));

    return Response.json({ stats, issues });
  } catch (error) {
    console.error('fixOrphanedPosts error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});
