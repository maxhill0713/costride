import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active gym memberships
    const memberships = await base44.asServiceRole.entities.GymMembership.filter({
      status: 'active'
    });

    const userIds = [...new Set(memberships.map(m => m.user_id))];
    
    // Create notifications for each user
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title: 'Enable Location for Check-ins',
      message: 'Enable location access to quickly check in at your gyms.',
      type: 'location_permission',
      read: false
    }));

    if (notifications.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
    }

    return Response.json({ 
      success: true, 
      notificationsSent: notifications.length 
    });
  } catch (error) {
    console.error('Location reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});