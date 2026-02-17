import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    if (action === 'add') {
      const existingRequest = await base44.entities.Friend.filter({
        user_id: user.id,
        friend_id: friendId
      });

      if (existingRequest.length > 0) {
        return Response.json({ error: 'Request already exists' }, { status: 400 });
      }

      const friendRequest = await base44.entities.Friend.create({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      });

      return Response.json({ friendRequest });
    } else if (action === 'accept') {
      const friendRequest = await base44.entities.Friend.filter({
        user_id: friendId,
        friend_id: user.id,
        status: 'pending'
      });

      if (friendRequest.length === 0) {
        return Response.json({ error: 'Friend request not found' }, { status: 404 });
      }

      await base44.entities.Friend.update(friendRequest[0].id, { status: 'accepted' });

      const reciprocal = await base44.entities.Friend.create({
        user_id: user.id,
        friend_id: friendId,
        status: 'accepted'
      });

      return Response.json({ friend: reciprocal });
    } else if (action === 'reject') {
      const friendRequest = await base44.entities.Friend.filter({
        user_id: friendId,
        friend_id: user.id
      });

      if (friendRequest.length > 0) {
        await base44.entities.Friend.delete(friendRequest[0].id);
      }

      return Response.json({ success: true });
    } else if (action === 'remove') {
      const friendship = await base44.entities.Friend.filter({
        user_id: user.id,
        friend_id: friendId
      });

      if (friendship.length > 0) {
        await base44.entities.Friend.delete(friendship[0].id);
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing friendship:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});