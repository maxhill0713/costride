import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    const db = base44.asServiceRole;

    if (action === 'add') {
      // Check for existing request in either direction
      const [existing1, existing2, friendData] = await Promise.all([
        db.entities.Friend.filter({ user_id: user.id, friend_id: friendId }),
        db.entities.Friend.filter({ user_id: friendId, friend_id: user.id }),
        db.entities.User.filter({ id: friendId })
      ]);

      if (existing1.length > 0 || existing2.length > 0) {
        return Response.json({ error: 'Friend request already exists' }, { status: 400 });
      }

      const targetFriend = friendData[0];
      if (!targetFriend) {
        return Response.json({ error: 'Friend not found' }, { status: 404 });
      }

      const friendRequest = await db.entities.Friend.create({
        user_id: user.id,
        user_name: user.full_name,
        user_avatar: user.avatar_url || '',
        friend_id: friendId,
        friend_name: targetFriend.full_name || '',
        friend_avatar: targetFriend.avatar_url || '',
        status: 'pending'
      });

      // Send notification to the target user
      await db.entities.Notification.create({
        user_id: friendId,
        title: 'New Friend Request',
        message: `${user.full_name} sent you a friend request`,
        type: 'friend_request',
        read: false,
        action_url: '/Friends'
      }).catch(() => {}); // Don't fail if notification fails

      return Response.json({ friendRequest });

    } else if (action === 'accept') {
      // Find the pending request FROM the friend TO current user
      const friendRequest = await db.entities.Friend.filter({
        user_id: friendId,
        friend_id: user.id,
        status: 'pending'
      });

      if (friendRequest.length === 0) {
        return Response.json({ error: 'Friend request not found' }, { status: 404 });
      }

      // Update the original request to accepted
      await db.entities.Friend.update(friendRequest[0].id, { status: 'accepted' });

      // Create reciprocal accepted record (current user -> friend)
      const reciprocal = await db.entities.Friend.create({
        user_id: user.id,
        user_name: user.full_name,
        user_avatar: user.avatar_url || '',
        friend_id: friendId,
        friend_name: friendRequest[0].user_name || '',
        friend_avatar: friendRequest[0].user_avatar || '',
        status: 'accepted'
      });

      // Notify the original requester
      await db.entities.Notification.create({
        user_id: friendId,
        title: 'Friend Request Accepted',
        message: `${user.full_name} accepted your friend request`,
        type: 'friend_accepted',
        read: false,
        action_url: '/Friends'
      }).catch(() => {});

      return Response.json({ friend: reciprocal });

    } else if (action === 'reject') {
      const friendRequest = await db.entities.Friend.filter({
        user_id: friendId,
        friend_id: user.id
      });

      if (friendRequest.length > 0) {
        await db.entities.Friend.delete(friendRequest[0].id);
      }

      return Response.json({ success: true });

    } else if (action === 'remove') {
      // Remove both directions
      const [friendship1, friendship2] = await Promise.all([
        db.entities.Friend.filter({ user_id: user.id, friend_id: friendId }),
        db.entities.Friend.filter({ user_id: friendId, friend_id: user.id })
      ]);

      await Promise.all([
        ...friendship1.map(f => db.entities.Friend.delete(f.id)),
        ...friendship2.map(f => db.entities.Friend.delete(f.id))
      ]);

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing friendship:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});