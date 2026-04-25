import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users
    const users = await base44.asServiceRole.entities.User.list('-created_date', 1000);

    const reminderTitle = 'Keep Your Streak Alive!';
    const reminderMessage = "Don't forget to log your workout today to keep your streak alive! 💪";

    let notified = 0;

    // Send reminder to each user
    for (const user of users) {
      try {
        await base44.functions.invoke('SendOneSignalNotification', {
          external_id: user.id,
          title: reminderTitle,
          message: reminderMessage
        });
        notified++;
      } catch (error) {
        console.warn(`Failed to notify user ${user.id}:`, error.message);
      }
    }

    console.log(`Sent Sunday check-in reminders to ${notified} users`);
    return Response.json({ success: true, notified });
  } catch (error) {
    console.error('sendSundayCheckInReminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});