import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is a scheduled/system function — verify admin or service call
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // ── Rate limit: only run once per 24h globally ────────────────────────
    // We track this by looking at how recently we last sent any reminder
    const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
    const recentRun = await base44.asServiceRole.entities.Notification.filter(
      { type: 'inactivity_reminder', created_date: { $gte: twentyThreeHoursAgo } },
      '-created_date', 1
    );
    if (recentRun.length > 0) {
      console.log('sendInactivityReminders: too soon since last run, skipping');
      return Response.json({ success: true, skipped: true, reason: 'ran too recently' });
    }

    // ── Per-member cooldown: 7 days between reminders ────────────────────
    const COOLDOWN_DAYS = 7;
    const INACTIVITY_THRESHOLD_DAYS = 7;
    const MAX_REMINDERS_PER_RUN = 200; // safety cap

    const cooldownCutoff = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Fetch active gym memberships to scope who we notify (not a platform-wide User.list())
    // Process in pages to avoid memory issues
    const allMemberships = await base44.asServiceRole.entities.GymMembership.filter(
      { status: 'active' }, '-created_date', 2000
    );

    if (!allMemberships.length) {
      return Response.json({ success: true, reminders_sent: 0 });
    }

    // Deduplicate by user_id
    const userMap = {};
    allMemberships.forEach(m => {
      if (m.user_id) userMap[m.user_id] = m;
    });
    const userIds = Object.keys(userMap);

    const inactivityCutoff = new Date(Date.now() - INACTIVITY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const notifications = [];

    for (const userId of userIds) {
      if (notifications.length >= MAX_REMINDERS_PER_RUN) break;

      // Get last check-in
      const checkIns = await base44.asServiceRole.entities.CheckIn.filter(
        { user_id: userId }, '-check_in_date', 1
      );
      if (!checkIns.length) continue;

      const lastCheckIn = new Date(checkIns[0].check_in_date);
      const daysSince = Math.floor((Date.now() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSince < INACTIVITY_THRESHOLD_DAYS) continue;

      // Check per-member cooldown: don't send if we already sent one recently
      const recentReminder = await base44.asServiceRole.entities.Notification.filter(
        { user_id: userId, type: 'inactivity_reminder', created_date: { $gte: cooldownCutoff } },
        '-created_date', 1
      );
      if (recentReminder.length > 0) continue;

      const gymName = userMap[userId]?.gym_name || 'your gym';
      notifications.push({
        user_id: userId,
        type: 'inactivity_reminder',
        title: 'Time for your next workout! 💪',
        message: `You haven't checked in for ${daysSince} days. Don't forget to check in at ${gymName} today!`,
        icon: '⏰',
        action_url: '/Gyms',
        read: false,
      });
    }

    if (notifications.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
    }

    console.log(`sendInactivityReminders: sent ${notifications.length} reminders to ${userIds.length} active members`);
    return Response.json({ success: true, reminders_sent: notifications.length });
  } catch (error) {
    console.error('Error sending inactivity reminders:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});