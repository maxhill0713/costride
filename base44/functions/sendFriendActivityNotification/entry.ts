import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { event, data } = await req.json();

    if (event.type !== 'create') {
      return Response.json({ success: true, skipped: true });
    }

    const memberId = data.member_id;
    const memberName = data.member_name || 'Friend';

    if (!memberId) {
      return Response.json({ success: true, skipped: true });
    }

    const base44 = createClientFromRequest(req);

    // Get all friends of this member
    const friendships = await base44.asServiceRole.entities.Friend.filter({
      friend_id: memberId,
      status: 'accepted'
    });

    // Send notification to each friend
    for (const friendship of friendships) {
      const friendId = friendship.user_id;
      
      try {
        await base44.functions.invoke('SendOneSignalNotification', {
          external_id: friendId,
          title: 'Friend Activity',
          message: `${memberName} just logged a new workout. Check it out! 🤝`
        });
      } catch (error) {
        console.warn(`Failed to notify friend ${friendId}:`, error.message);
      }
    }

    console.log(`Sent friend activity notifications to ${friendships.length} users`);
    return Response.json({ success: true, notified: friendships.length });
  } catch (error) {
    console.error('sendFriendActivityNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});