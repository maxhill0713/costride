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
      // Only set fields that are safe defaults — do NOT default account_type to 'user'.
      // account_type is set intentionally during onboarding (Onboarding.jsx / MemberSignup.jsx).
      // Defaulting it to 'user' here caused old accounts to have a different type than new ones ('personal').
      const initUpdates = {
        onboarding_completed: userData.onboarding_completed ?? false,
        current_streak:       userData.current_streak       ?? 0,
        previous_streak:      userData.previous_streak      ?? 0,
        streak_freezes:       userData.streak_freezes       ?? 3,
      };
      // Preserve account_type if it was already set (e.g. gym owner flow), otherwise leave unset.
      if (userData.account_type && userData.account_type !== 'user') {
        initUpdates.account_type = userData.account_type;
      }
      await base44.asServiceRole.entities.User.update(userId, initUpdates);
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