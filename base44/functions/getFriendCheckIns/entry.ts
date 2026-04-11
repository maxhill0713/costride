import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Returns recent check-ins for a list of friend IDs using service role.
// Regular users cannot read other users' check-ins directly via RLS.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendIds, since } = await req.json();

    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return Response.json({ checkIns: [] });
    }

    // Validate since is a real date string
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (isNaN(sinceDate.getTime())) {
      return Response.json({ error: 'Invalid since date' }, { status: 400 });
    }

    // Limit friend IDs to prevent abuse
    const limitedFriendIds = friendIds.slice(0, 100);

    // Verify these are actually friends of the requesting user before returning data
    const friendships = await base44.entities.Friend.filter({
      user_id: user.id,
      status: 'accepted',
    });
    const validFriendIds = new Set(friendships.map(f => f.friend_id));
    const authorisedIds = limitedFriendIds.filter(id => validFriendIds.has(id));

    if (authorisedIds.length === 0) {
      return Response.json({ checkIns: [] });
    }

    const checkIns = await base44.asServiceRole.entities.CheckIn.filter(
      { user_id: { $in: authorisedIds }, check_in_date: { $gte: sinceDate.toISOString() } },
      '-check_in_date',
      200
    );

    return Response.json({ checkIns });
  } catch (error) {
    console.error('getFriendCheckIns error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});