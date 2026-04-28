import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { gymId, returnUrl } = await req.json();
    if (!gymId) return Response.json({ error: 'gymId required' }, { status: 400 });

    // Fetch the gym
    const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    const gym = gyms[0];
    if (!gym) return Response.json({ error: 'Gym not found' }, { status: 404 });

    // Verify the user is the gym owner
    if (gym.owner_email !== user.email && gym.admin_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let stripeAccountId = gym.stripe_account_id;

    // Create a new Connect account if one doesn't exist
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          gym_id: gymId,
          gym_name: gym.name,
        },
      });
      stripeAccountId = account.id;

      // Save the account ID to the gym
      await base44.asServiceRole.entities.Gym.update(gymId, { stripe_account_id: stripeAccountId });
      console.log('Created Stripe Connect account:', stripeAccountId, 'for gym:', gymId);
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return Response.json({ url: accountLink.url, stripeAccountId });
  } catch (error) {
    console.error('stripeConnectOnboard error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});