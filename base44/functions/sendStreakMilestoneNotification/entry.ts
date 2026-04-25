import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Sends congratulatory push notifications when users hit streak milestones.
 * Triggered by entity automation on CheckIn creation.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || !data.user_id) {
      console.log('No user_id in CheckIn data, skipping notification');
      return Response.json({ skipped: true });
    }

    // Fetch user's full profile to get current streak
    const user = await base44.asServiceRole.entities.User.filter({ id: data.user_id });
    if (!user || user.length === 0) {
      console.log(`User ${data.user_id} not found`);
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const currentStreak = user[0].current_streak || 0;

    // Define milestone streaks that trigger notifications
    const MILESTONES = [7, 14, 30, 60, 90, 100, 365];
    const isMilestone = MILESTONES.includes(currentStreak);

    if (!isMilestone) {
      console.log(`Streak ${currentStreak} is not a milestone, no notification sent`);
      return Response.json({ skipped: true, streak: currentStreak });
    }

    const milestoneMessages = {
      7: {
        title: "🔥 One Week Strong!",
        body: "You've hit a 7-day streak! Consistency is starting to stick.",
      },
      14: {
        title: "🚀 Two Weeks Crushing It!",
        body: "A 14-day streak shows real commitment. Keep this momentum going!",
      },
      30: {
        title: "🏆 One Month Champion!",
        body: "A full month of consistency — you're unstoppable!",
      },
      60: {
        title: "💪 Two Months of Legends!",
        body: "You've reached 60 days. Your dedication is inspiring.",
      },
      90: {
        title: "⭐ Three Months of Excellence!",
        body: "A 90-day streak is legendary. You're in the top 1%.",
      },
      100: {
        title: "👑 Century Club!",
        body: "100 days! You've reached an elite milestone.",
      },
      365: {
        title: "🌟 One Year of Consistency!",
        body: "A full year of never missing a day. You're an absolute champion!",
      },
    };

    const message = milestoneMessages[currentStreak];
    if (!message) {
      console.log(`No message defined for milestone ${currentStreak}`);
      return Response.json({ skipped: true });
    }

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: data.user_id,
      type: 'streak_milestone',
      title: message.title,
      message: message.body,
      read: false,
    });

    // Send push notification
    try {
      await base44.asServiceRole.functions.invoke('sendOneSignalPush', {
        userIds: [data.user_id],
        title: message.title,
        body: message.body,
        data: { type: 'streak_milestone', streak: currentStreak },
      });
      console.log(`Streak milestone notification sent to ${data.user_id}: ${currentStreak} days`);
    } catch (pushErr) {
      console.log(`Push notification failed for user ${data.user_id}: ${pushErr.message}`);
    }

    return Response.json({ success: true, streak: currentStreak, milestone: true });

  } catch (error) {
    console.error('sendStreakMilestoneNotification error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});