import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { gymId } = await req.json();
    if (!gymId) return Response.json({ error: 'gymId required' }, { status: 400 });

    const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    const gym = gyms[0];
    if (!gym) return Response.json({ error: 'Gym not found' }, { status: 404 });

    if (!gym.stripe_account_id) {
      return Response.json({ connected: false, chargesEnabled: false, payoutsEnabled: false });
    }

    const account = await stripe.accounts.retrieve(gym.stripe_account_id);
    return Response.json({
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      stripeAccountId: gym.stripe_account_id,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error) {
    console.error('stripeConnectStatus error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});