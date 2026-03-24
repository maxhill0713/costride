import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. SDK version bumped.
// 2. Any authenticated user could create a notification for ANY userId — no ownership check.
//    A user could spam-notify any other user with arbitrary content.
//    Now: regular users can only notify themselves. Admins can notify any user.
// 3. title and message are length-capped and stripped of HTML.
// 4. Raw error.message suppressed.

function sanitize(str = '', max = 500) {
  return str.replace(/<[^>]*>/g, '').trim().slice(0, max);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, title, message, type, icon, action_url } = await req.json();

    if (!userId || !title || !message) {
      return Response.json({ error: 'userId, title, and message are required' }, { status: 400 });
    }

    // SECURITY: non-admins can only create notifications for themselves
    if (user.role !== 'admin' && userId !== user.id) {
      console.warn(`SECURITY: User ${user.email} tried to create notification for ${userId}`);
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id:    userId,
      title:      sanitize(title, 200),
      message:    sanitize(message, 500),
      type:       type || 'general',
      icon:       icon || '🔔',
      action_url: typeof action_url === 'string' ? action_url.slice(0, 500) : null,
      read:       false,
    });

    return Response.json({ notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});