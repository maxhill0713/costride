import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const memberId = body.memberId || user.id;
    const limit = Math.min(body.limit || 50, 100);

    // Use service role to bypass RLS
    const posts = await base44.asServiceRole.entities.Post.filter(
      { member_id: memberId, is_hidden: { $ne: true } },
      '-created_date',
      limit
    );

    return Response.json({ posts });
  } catch (error) {
    console.error('getUserPosts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});