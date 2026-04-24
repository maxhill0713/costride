import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MESSAGES = [
  { title: "We miss you 💪", body: "It's been a while! Your streak is waiting — get back to the gym today." },
  { title: "Stay consistent 🔥", body: "Consistency is everything. One session today keeps the momentum going." },
  { title: "Your gym misses you 👋", body: "We haven't seen you in a while. Come back and crush a workout!" },
  { title: "Don't let the streak die ⚡", body: "It's been 7+ days. Get back in there — your future self will thank you." },
  { title: "Time to get back at it 🏋️", body: "A quick session is better than none. Your community is waiting for you." },
];

function randomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString();

    // Get all active memberships to find which users to consider
    const activeMemberships = await base44.asServiceRole.entities.GymMembership.filter({ status: 'active' });
    console.log(`Found ${activeMemberships.length} active memberships`);

    if (activeMemberships.length === 0) {
      return Response.json({ message: 'No active memberships found', notified: 0 });
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(activeMemberships.map(m => m.user_id).filter(Boolean))];
    console.log(`Unique users with active memberships: ${uniqueUserIds.length}`);

    // Get all check-ins from the last 7 days
    const recentCheckIns = await base44.asServiceRole.entities.CheckIn.filter({
      check_in_date: { $gte: cutoffDate }
    });

    // Build a set of user IDs who have checked in recently
    const activeUserIds = new Set(recentCheckIns.map(c => c.user_id).filter(Boolean));
    console.log(`Users who checked in in the last 7 days: ${activeUserIds.size}`);

    // Users who haven't checked in in 7+ days
    const inactiveUserIds = uniqueUserIds.filter(uid => !activeUserIds.has(uid));
    console.log(`Inactive users to notify: ${inactiveUserIds.length}`);

    if (inactiveUserIds.length === 0) {
      return Response.json({ message: 'All members are active — no reminders needed', notified: 0 });
    }

    // Get user records for email addresses (needed for notification creation)
    const users = await base44.asServiceRole.entities.User.filter({
      id: { $in: inactiveUserIds }
    });

    let notified = 0;
    let errors = 0;

    for (const user of users) {
      try {
        const { title, body } = randomMessage();

        // Create a Notification record in the app (shows in-app notification bell)
        await base44.asServiceRole.entities.Notification.create({
          user_id: user.id,
          type: 'inactivity_reminder',
          title,
          message: body,
          read: false,
        });

        // Send real push notification via OneSignal
        try {
          await base44.asServiceRole.functions.invoke('sendOneSignalPush', {
            userIds: [user.id],
            title,
            body,
          });
        } catch (pushErr) {
          console.log(`OneSignal push not sent for user ${user.id}: ${pushErr.message}`);
        }

        notified++;
        console.log(`Notified user ${user.id} (${user.email}): "${title}"`);
      } catch (err) {
        errors++;
        console.error(`Failed to notify user ${user.id}: ${err.message}`);
      }
    }

    console.log(`Done. Notified: ${notified}, Errors: ${errors}`);
    return Response.json({
      message: `Inactivity reminders sent`,
      notified,
      errors,
      total_inactive: inactiveUserIds.length,
    });

  } catch (error) {
    console.error('sendInactivityPushReminders error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});