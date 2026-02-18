import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    const notifications = [];

    for (const user of allUsers) {
      // Get user's check-ins
      const checkIns = await base44.asServiceRole.entities.CheckIn.filter(
        { user_id: user.id },
        '-check_in_date',
        1
      );

      if (checkIns.length === 0) continue;

      const lastCheckIn = checkIns[0];
      const daysSince = Math.floor(
        (Date.now() - new Date(lastCheckIn.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send reminder if inactive 3+ days
      if (daysSince >= 3) {
        // Check if we already sent a recent reminder
        const recentReminder = await base44.asServiceRole.entities.Notification.filter(
          { user_id: user.id, type: 'reminder' },
          '-created_date',
          1
        );

        const shouldSendReminder = recentReminder.length === 0 || 
          new Date(recentReminder[0].created_date) < threeDaysAgo;

        if (shouldSendReminder) {
          notifications.push({
            user_id: user.id,
            type: 'reminder',
            title: 'Time for your next workout! 💪',
            message: `You haven't checked in for ${daysSince} days. Don't forget to check in today!`,
            icon: '⏰',
            action_url: '/Gyms',
            read: false
          });
        }
      }
    }

    if (notifications.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
    }

    return Response.json({ 
      success: true, 
      reminders_sent: notifications.length 
    });
  } catch (error) {
    console.error('Error sending inactivity reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});