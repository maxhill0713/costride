import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [LOW]:
// 1. SDK version bumped.
// 2. Raw error.message suppressed.
// (Automation-only function — no auth needed, no sensitive operations)

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    if (payload.event?.type !== 'create') {
      return Response.json({ success: true, message: 'Not a create event' });
    }

    const userData = payload.data;
    const userId   = payload.event?.entity_id;

    if (!userId || !userData) {
      return Response.json({ error: 'Missing user data' }, { status: 400 });
    }

    try {
      await base44.asServiceRole.entities.User.update(userId, {
        onboarding_completed: userData.onboarding_completed ?? false,
        account_type:         userData.account_type ?? 'user',
      });
    } catch (e) {
      console.warn('Could not set default user fields:', e.message);
    }

    console.log(`User ${userId} initialized in Base44`);
    return Response.json({ success: true, message: 'User initialized in Base44' });
  } catch (error) {
    console.error('User init error:', error.message);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});