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

    // ── Bulk fetch: replace N×2 sequential queries with 2 batch queries ──────
    // 1. Get most recent check-in per user in one request (fetch within inactivity window — anyone
    //    who checked in recently will be in this result and can be excluded).
    const recentCheckIns = await base44.asServiceRole.entities.CheckIn.filter(
      { user_id: { $in: userIds }, check_in_date: { $gte: inactivityCutoff } },
      '-check_in_date',
      2000
    );
    const activeUserIds = new Set(recentCheckIns.map(c => c.user_id));

    // Users who haven't checked in within the inactivity threshold
    const inactiveUserIds = userIds.filter(id => !activeUserIds.has(id));
    if (!inactiveUserIds.length) {
      console.log('sendInactivityReminders: no inactive users found');
      return Response.json({ success: true, reminders_sent: 0 });
    }

    // 2. Bulk fetch last check-in for each inactive user (to compute daysSince)
    const lastCheckIns = await base44.asServiceRole.entities.CheckIn.filter(
      { user_id: { $in: inactiveUserIds } },
      '-check_in_date',
      inactiveUserIds.length * 1 // one per user (sorted desc so first per user is last visit)
    );
    const lastCheckInByUser = {};
    lastCheckIns.forEach(c => {
      if (!lastCheckInByUser[c.user_id]) lastCheckInByUser[c.user_id] = c.check_in_date;
    });

    // 3. Bulk fetch cooldown: users who already got a reminder recently
    const recentReminders = await base44.asServiceRole.entities.Notification.filter(
      { user_id: { $in: inactiveUserIds }, type: 'inactivity_reminder', created_date: { $gte: cooldownCutoff } },
      '-created_date',
      inactiveUserIds.length
    );
    const alreadyReminded = new Set(recentReminders.map(n => n.user_id));

    // Build notification list
    const notifications = [];
    for (const userId of inactiveUserIds) {
      if (notifications.length >= MAX_REMINDERS_PER_RUN) break;
      if (alreadyReminded.has(userId)) continue;

      const lastVisit = lastCheckInByUser[userId];
      if (!lastVisit) continue; // never checked in — skip (no streak to protect)

      const daysSince = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
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