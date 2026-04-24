import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all hidden posts that have a scheduled_date in the past and are not drafts
    const now = new Date().toISOString();
    const posts = await base44.asServiceRole.entities.Post.filter({
      is_hidden: true,
      is_draft: { $ne: true },
    }, null, 200);

    const toPublish = posts.filter(p => p.scheduled_date && new Date(p.scheduled_date).toISOString() <= now);

    let published = 0;
    for (const post of toPublish) {
      await base44.asServiceRole.entities.Post.update(post.id, {
        is_hidden: false,
        share_with_community: true,
      });
      published++;
    }

    console.log(`Published ${published} scheduled post(s)`);
    return Response.json({ published });
  } catch (error) {
    console.error('publishScheduledPosts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});