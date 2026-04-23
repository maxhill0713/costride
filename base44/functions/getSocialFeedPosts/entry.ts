import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendIds = [], primaryGymId = null, limit = 200, fetchPolls = false } = await req.json();

    // Verify friendIds against actual accepted Friend records
    let verifiedFriendIds = [];
    if (friendIds.length > 0) {
      const friendRecords = await base44.asServiceRole.entities.Friend.filter({
        user_id: user.id,
        status: 'accepted'
      }, null, 500);
      const trustedIds = new Set(friendRecords.map(f => f.friend_id).filter(Boolean));
      verifiedFriendIds = friendIds.filter(id => trustedIds.has(id));
    }

    const authorIds = [...new Set([...verifiedFriendIds, user.id])].filter(Boolean);
    const postPromises = [];

    // Fetch posts from friends and current user
    if (authorIds.length > 0) {
      postPromises.push(
        base44.asServiceRole.entities.Post.filter(
          {
            member_id: { $in: authorIds },
            is_system_generated: { $ne: true },
            is_hidden: { $ne: true },
          },
          '-created_date',
          limit
        ).then(posts => posts.map(p => ({ ...p, _source: 'friend' })))
      );
    }

    // Fetch community posts from the user's primary gym
    // Includes both member posts shared with community AND gym-authored posts (post_type set)
    if (primaryGymId) {
      postPromises.push(
        base44.asServiceRole.entities.Post.filter(
          {
            gym_id: primaryGymId,
            share_with_community: true,
            is_hidden: { $ne: true },
            is_system_generated: { $ne: true },
          },
          '-created_date',
          limit
        ).then(posts => posts.map(p => ({ ...p, _source: 'community' })))
      );

    }

    const results = await Promise.all(postPromises);
    const allPosts = results.flat();

    // Deduplicate: friend/self posts take priority over community posts
    const uniquePostsMap = new Map();
    // First pass: add community posts
    allPosts.filter(p => p._source === 'community').forEach(post => {
      uniquePostsMap.set(post.id, post);
    });
    // Second pass: friend/self posts override community posts
    allPosts.filter(p => p._source === 'friend').forEach(post => {
      uniquePostsMap.set(post.id, post);
    });

    const combinedPosts = Array.from(uniquePostsMap.values())
      .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
      .slice(0, limit);

    // Fetch polls for primary gym via service role (bypasses RLS issues for regular members)
    let polls = [];
    if (primaryGymId && fetchPolls) {
      polls = await base44.asServiceRole.entities.Poll.filter(
        { gym_id: primaryGymId, status: 'active' },
        '-created_date',
        20
      );
    }

    return Response.json({ posts: combinedPosts, polls });
  } catch (error) {
    console.error('getSocialFeedPosts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});