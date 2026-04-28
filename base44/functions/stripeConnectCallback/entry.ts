import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { code, gymId } = await req.json();
    if (!code || !gymId) return Response.json({ error: 'code and gymId required' }, { status: 400 });

    // Verify gym ownership
    const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    const gym = gyms[0];
    if (!gym) return Response.json({ error: 'Gym not found' }, { status: 404 });
    if (gym.owner_email !== user.email && gym.admin_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Exchange authorization code for account ID
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    const stripeAccountId = response.stripe_user_id;
    if (!stripeAccountId) return Response.json({ error: 'No account ID returned from Stripe' }, { status: 500 });

    // Save to gym
    await base44.asServiceRole.entities.Gym.update(gymId, { stripe_account_id: stripeAccountId });
    console.log('Connected Stripe account:', stripeAccountId, 'for gym:', gymId);

    return Response.json({ success: true, stripeAccountId });
  } catch (error) {
    console.error('stripeConnectCallback error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});