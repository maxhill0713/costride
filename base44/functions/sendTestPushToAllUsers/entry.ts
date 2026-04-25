import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all user IDs
    const allUsers = await base44.asServiceRole.entities.User.filter({}, 'created_date', 1000);
    const userIds = allUsers.map(u => u.id).filter(Boolean);

    console.log(`Found ${userIds.length} users to notify`);

    if (userIds.length === 0) {
      return Response.json({ message: 'No users found to notify', sent: 0 });
    }

    // Send test push via OneSignal
    const result = await base44.asServiceRole.functions.invoke('sendOneSignalPush', {
      userIds,
      title: '🧪 Test Notification',
      body: 'This is a test push notification from CoStride.',
      data: { test: true },
    });

    console.log(`Test push result:`, result);

    return Response.json({
      message: 'Test push sent to all users',
      recipients: result.data?.recipients || 0,
      errors: result.data?.errors || 0,
      total_users: userIds.length,
    });
  } catch (error) {
    console.error('sendTestPushToAllUsers error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});