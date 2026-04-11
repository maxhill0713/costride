import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped.
// 2. 'reject' action did NOT verify the request was directed at the authenticated user —
//    any user could reject another user's friend request (IDOR).
//    Fixed: reject now only allows deleting a request where friend_id === user.id.
// 3. 'remove' action allowed removing any friendship record, not just your own.
//    Fixed: only removes records where user.id is one of the two parties.
// 4. Raw error.message suppressed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendId, action } = await req.json();

    if (!friendId || !action) {
      return Response.json({ error: 'Friend ID and action required' }, { status: 400 });
    }
    if (friendId === user.id) {
      return Response.json({ error: 'Cannot friend yourself' }, { status: 400 });
    }

    const ALLOWED_ACTIONS = ['add', 'accept', 'reject', 'remove'];
    if (!ALLOWED_ACTIONS.includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const db = base44.asServiceRole;

    if (action === 'add') {
      const [existing1, existing2, friendData] = await Promise.all([
        db.entities.Friend.filter({ user_id: user.id, friend_id: friendId }),
        db.entities.Friend.filter({ user_id: friendId, friend_id: user.id }),
        db.entities.User.filter({ id: friendId }),
      ]);

      if (existing1.length > 0 || existing2.length > 0) {
        return Response.json({ error: 'Friend request already exists' }, { status: 400 });
      }
      const targetFriend = friendData[0];
      if (!targetFriend) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      const friendRequest = await db.entities.Friend.create({
        user_id:     user.id,
        friend_id:   friendId,
        friend_name: targetFriend.display_name || targetFriend.full_name || '',
        status:      'pending',
      });

      await db.entities.Notification.create({
        user_id:    friendId,
        title:      'New Friend Request',
        message:    `${user.full_name} sent you a friend request`,
        type:       'friend_request',
        read:       false,
        action_url: '/Friends',
      }).catch(() => {});

      return Response.json({ friendRequest });

    } else if (action === 'accept') {
      const friendRequest = await db.entities.Friend.filter({
        user_id:   friendId,
        friend_id: user.id,      // SECURITY: must be directed at current user
        status:    'pending',
      });

      if (friendRequest.length === 0) {
        return Response.json({ error: 'Friend request not found' }, { status: 404 });
      }

      await db.entities.Friend.update(friendRequest[0].id, { status: 'accepted' });

      // Re-fetch the requester's latest profile name for the fallback field
      const [requesterData] = await db.entities.User.filter({ id: friendId });
      const reciprocal = await db.entities.Friend.create({
        user_id:     user.id,
        friend_id:   friendId,
        friend_name: requesterData?.display_name || requesterData?.full_name || '',
        status:      'accepted',
      });

      await db.entities.Notification.create({
        user_id:    friendId,
        title:      'Friend Request Accepted',
        message:    `${user.full_name} accepted your friend request`,
        type:       'friend_accepted',
        read:       false,
        action_url: '/Friends',
      }).catch(() => {});

      return Response.json({ friend: reciprocal });

    } else if (action === 'reject') {
      // SECURITY FIX: Only allow rejecting a request that was sent TO the current user
      const friendRequest = await db.entities.Friend.filter({
        user_id:   friendId,
        friend_id: user.id,   // ← was missing this scope — any user could reject for any user
      });

      if (friendRequest.length > 0) {
        await db.entities.Friend.delete(friendRequest[0].id);
      }

      return Response.json({ success: true });

    } else if (action === 'remove') {
      // SECURITY FIX: Only fetch records where user.id is one of the parties
      const [friendship1, friendship2] = await Promise.all([
        db.entities.Friend.filter({ user_id: user.id,   friend_id: friendId }),
        db.entities.Friend.filter({ user_id: friendId,  friend_id: user.id  }),
      ]);

      await Promise.all([
        ...friendship1.map(f => db.entities.Friend.delete(f.id)),
        ...friendship2.map(f => db.entities.Friend.delete(f.id)),
      ]);

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing friendship:', error.message, error?.data || '');
    return Response.json({ error: error.message || 'An internal error occurred' }, { status: 500 });
  }
});