import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. No ownership check — any authenticated user could invite anyone as a gym owner
//    for any gym (gym_id they don't own). A bad actor could spam invites.
// 2. Now verifies the caller owns the gym they're inviting someone to.
// 3. Admin-only role also permitted.
// 4. Raw error.message suppressed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, gym_id, gym_name } = await req.json();

    if (!email || !gym_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // SECURITY: Verify the caller is the owner of this gym (or platform admin)
    if (user.role !== 'admin') {
      const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gym_id });
      if (!gyms.length) {
        return Response.json({ error: 'Gym not found' }, { status: 404 });
      }
      const gym = gyms[0];
      const isOwner = gym.owner_email === user.email || gym.admin_id === user.id;
      if (!isOwner) {
        console.warn(`SECURITY: User ${user.email} tried to invite owner for gym ${gym_id} they don't own`);
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    await base44.users.inviteUser(email, 'user');

    try {
      await base44.integrations.Core.SendEmail({
        to:      user.email,
        subject: `Owner invitation sent for ${gym_name}`,
        body:    `You've invited ${email} to become the owner of ${gym_name}. They'll receive an invitation email to join and claim the gym.`,
      });
    } catch (e) {
      console.error('Failed to send confirmation email:', e);
    }

    return Response.json({ success: true, message: `Invitation sent to ${email}` });
  } catch (error) {
    console.error('Error inviting gym owner:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});