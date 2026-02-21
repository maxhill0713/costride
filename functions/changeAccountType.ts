import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountType } = await req.json();

    if (!accountType || !['gym_owner', 'user'].includes(accountType)) {
      return Response.json({ error: 'Invalid account type' }, { status: 400 });
    }

    // Update user account type
    await base44.auth.updateMe({ account_type: accountType });

    return Response.json({ success: true, account_type: accountType });
  } catch (error) {
    console.error('Error changing account type:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});