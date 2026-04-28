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

    // Create a new Express account if one doesn't exist yet
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: gym.name || undefined,
        },
      });
      stripeAccountId = account.id;

      // Save the new account ID to the gym immediately
      await base44.asServiceRole.entities.Gym.update(gymId, { stripe_account_id: stripeAccountId });
      console.log('Created Stripe Express account:', stripeAccountId, 'for gym:', gymId);
    }

    // Generate an Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    console.log('Generated onboarding link for account:', stripeAccountId);
    return Response.json({ url: accountLink.url, stripeAccountId });
  } catch (error) {
    console.error('stripeConnectOnboard error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});