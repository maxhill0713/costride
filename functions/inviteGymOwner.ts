import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Invite the user to the app
    await base44.users.inviteUser(email, 'user');

    // Send notification email to the inviter
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Owner invitation sent for ${gym_name}`,
        body: `You've invited ${email} to become the owner of ${gym_name}. They'll receive an invitation email to join and claim the gym.`
      });
    } catch (e) {
      console.error('Failed to send confirmation email:', e);
      // Don't fail the request if email fails
    }

    return Response.json({ 
      success: true,
      message: `Invitation sent to ${email}`
    });
  } catch (error) {
    console.error('Error inviting gym owner:', error);
    return Response.json({ 
      error: error.message || 'Failed to send invitation' 
    }, { status: 500 });
  }
});