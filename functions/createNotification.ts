import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, title, message, type, icon, action_url } = await req.json();

    if (!userId || !title || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      title,
      message,
      type: type || 'general',
      icon: icon || '🔔',
      action_url: action_url || null,
      read: false
    });

    return Response.json({ notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});