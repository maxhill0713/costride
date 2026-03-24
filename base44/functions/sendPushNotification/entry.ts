import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gym_id, gym_name, target, message, member_ids } = await req.json();

    if (!gym_id || !message || !member_ids) {
      return Response.json({ error: 'gym_id, message, and member_ids are required' }, { status: 400 });
    }

    // Validate message
    if (typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ error: 'Message must be a non-empty string' }, { status: 400 });
    }
    if (message.length > 500) {
      return Response.json({ error: 'Message must be 500 characters or less' }, { status: 400 });
    }
    const safeMessage = message.replace(/<[^>]*>/g, '').trim();

    // Cap batch size
    const MAX_BATCH = 500;
    if (!Array.isArray(member_ids) || member_ids.length === 0) {
      return Response.json({ error: 'No members to notify' }, { status: 400 });
    }
    if (member_ids.length > MAX_BATCH) {
      return Response.json({ error: `Cannot notify more than ${MAX_BATCH} members per request` }, { status: 400 });
    }

    // ── Ownership check: verify the caller owns this gym ──────────────────
    const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gym_id });
    if (!gyms || gyms.length === 0) {
      return Response.json({ error: 'Gym not found' }, { status: 404 });
    }

    const gym = gyms[0];
    const isOwner = gym.owner_email === user.email || gym.admin_id === user.id;

    if (!isOwner) {
      console.warn(`Unauthorized notification attempt by user ${user.id} for gym ${gym_id}`);
      return Response.json({ error: 'Forbidden: You do not own this gym' }, { status: 403 });
    }

    // ── Create in-app notifications for each member ───────────────────────
    let sent = 0;
    const errors = [];

    for (const memberId of member_ids) {
      // Don't notify the owner themselves
      if (memberId === user.id) continue;

      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: memberId,
          type: 'gym_message',
          title: `📣 Message from ${gym_name || gym.name}`,
          message: safeMessage,
          icon: '🏋️',
          read: false,
        });
        sent++;
      } catch (e) {
        console.error(`Failed to notify member ${memberId}:`, e.message);
        errors.push(memberId);
      }
    }

    console.log(`Notifications sent: ${sent}, failed: ${errors.length}, gym: ${gym_id}, by: ${user.email}`);

    return Response.json({ success: true, sent, failed: errors.length });
  } catch (error) {
    console.error('sendPushNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});