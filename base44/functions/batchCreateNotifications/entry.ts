import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [CRITICAL]:
// 1. SDK version bumped.
// 2. base44.auth.me() result was IGNORED — the function checked auth but never verified
//    the result. Any unauthenticated request could create arbitrary notifications for any
//    user_id in the notifications array (mass notification injection).
// 3. Now requires admin role — this is a system-level batch operation.
// 4. notifications array is capped to prevent abuse.
// 5. Each notification is validated to ensure it has a user_id.
// 6. Raw error.message suppressed.

const MAX_BATCH = 500;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Admin only — this creates notifications for arbitrary user IDs
    if (user.role !== 'admin') {
      console.warn(`SECURITY: Non-admin ${user.email} tried to batch-create notifications`);
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const { notifications } = await req.json();

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return Response.json({ error: 'Notifications array required' }, { status: 400 });
    }
    if (notifications.length > MAX_BATCH) {
      return Response.json({ error: `Batch limited to ${MAX_BATCH} notifications` }, { status: 400 });
    }

    // Validate each notification has a user_id
    for (const n of notifications) {
      if (!n.user_id) {
        return Response.json({ error: 'Each notification must have a user_id' }, { status: 400 });
      }
    }

    const created = await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
    return Response.json({ notifications: created, count: created.length });
  } catch (error) {
    console.error('Error batch creating notifications:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});