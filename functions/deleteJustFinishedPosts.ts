import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all posts
    const allPosts = await base44.entities.Post.list();
    
    // Filter posts with "💪 Just finished" pattern
    const postsToDelete = allPosts.filter(post => 
      post.content && post.content.includes('💪 Just finished')
    );

    console.log(`Found ${postsToDelete.length} posts to delete`);

    // Delete each post
    let deleted = 0;
    for (const post of postsToDelete) {
      try {
        await base44.entities.Post.delete(post.id);
        deleted++;
      } catch (err) {
        console.error(`Failed to delete post ${post.id}:`, err.message);
      }
    }

    return Response.json({ 
      success: true, 
      total_found: postsToDelete.length, 
      deleted 
    });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});