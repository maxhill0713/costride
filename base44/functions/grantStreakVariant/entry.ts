import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { userId, variant } = await req.json();
    if (!userId || !variant) {
      return Response.json({ error: 'userId and variant required' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (!users.length) return Response.json({ error: 'User not found' }, { status: 404 });

    const existing = users[0].unlocked_streak_variants || [];
    if (!existing.includes(variant)) {
      await base44.asServiceRole.entities.User.update(userId, {
        unlocked_streak_variants: [...existing, variant],
      });
      console.log(`Granted '${variant}' to user ${userId}`);
    }

    return Response.json({ success: true, unlocked_streak_variants: [...new Set([...existing, variant])] });
  } catch (error) {
    console.error('grantStreakVariant error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});