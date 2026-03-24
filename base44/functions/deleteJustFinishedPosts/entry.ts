import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped.
// 2. Used base44.entities.Post.list() (user-scoped) instead of asServiceRole — an admin
//    calling this would only see their own posts, not all posts. Now uses asServiceRole.
// 3. Raw error.message suppressed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const allPosts = await base44.asServiceRole.entities.Post.list();
    const postsToDelete = allPosts.filter(post =>
      post.content && post.content.includes('💪 Just finished')
    );

    console.log(`Found ${postsToDelete.length} posts to delete`);

    let deleted = 0;
    for (const post of postsToDelete) {
      try {
        await base44.asServiceRole.entities.Post.delete(post.id);
        deleted++;
      } catch (err) {
        console.error(`Failed to delete post ${post.id}:`, err.message);
      }
    }

    return Response.json({ success: true, total_found: postsToDelete.length, deleted });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});