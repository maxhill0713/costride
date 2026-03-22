import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await base44.auth.me();

    const { notifications } = await req.json();

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return Response.json({ error: 'Notifications array required' }, { status: 400 });
    }

    const created = await base44.asServiceRole.entities.Notification.bulkCreate(notifications);

    return Response.json({ notifications: created, count: created.length });
  } catch (error) {
    console.error('Error batch creating notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});