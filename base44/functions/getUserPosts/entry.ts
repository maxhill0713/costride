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

    // If requesting another user's posts, enforce privacy settings
    if (memberId !== user.id) {
      // Check if the target user has a public profile
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: memberId });
      const profile = profiles[0];
      const isPublic = !profile || profile.privacy_setting === 'public' || !profile.privacy_setting;

      if (!isPublic) {
        // Check if they are friends
        const friendships = await base44.asServiceRole.entities.Friend.filter({
          user_id: user.id,
          friend_id: memberId,
          status: 'accepted'
        });
        const areFriends = friendships.length > 0;
        if (!areFriends) {
          return Response.json({ posts: [] }); // Private profile, not friends
        }
      }
    }

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