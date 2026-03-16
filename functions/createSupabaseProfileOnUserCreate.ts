import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// This function is triggered when a new user is created.
// All user data is stored natively in Base44's User entity - no external sync needed.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    if (payload.event?.type !== 'create') {
      return Response.json({ success: true, message: 'Not a create event' });
    }

    const userData = payload.data;
    const userId = payload.event?.entity_id;

    if (!userId || !userData) {
      return Response.json({ error: 'Missing user data' }, { status: 400 });
    }

    // Initialize default user fields on Base44 if not already set
    try {
      await base44.asServiceRole.entities.User.update(userId, {
        onboarding_completed: userData.onboarding_completed ?? false,
        account_type: userData.account_type ?? 'user',
      });
    } catch (e) {
      console.warn('Could not set default user fields:', e.message);
    }

    console.log(`User ${userId} initialized in Base44`);
    return Response.json({ success: true, message: 'User initialized in Base44' });
  } catch (error) {
    console.error('User init error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});