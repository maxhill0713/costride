import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Fetch all posts missing gym_id
    const posts = await base44.asServiceRole.entities.Post.filter({ gym_id: null });
    console.log(`Found ${posts.length} posts missing gym_id`);

    let fixed = 0;
    let skipped = 0;

    for (const post of posts) {
      // Find the author's active gym membership
      const memberships = await base44.asServiceRole.entities.GymMembership.filter({
        user_id: post.member_id,
        status: 'active'
      });

      if (memberships.length === 0) {
        console.log(`No active membership for post ${post.id} (author ${post.member_id})`);
        skipped++;
        continue;
      }

      const gymId = memberships[0].gym_id;
      await base44.asServiceRole.entities.Post.update(post.id, { gym_id: gymId });
      console.log(`Fixed post ${post.id} -> gym_id: ${gymId}`);
      fixed++;
    }

    return Response.json({ total: posts.length, fixed, skipped });
  } catch (error) {
    console.error('backfillPostGymIds error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});