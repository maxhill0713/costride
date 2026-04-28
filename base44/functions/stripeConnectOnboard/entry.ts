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

    if (!stripeAccountId) {
      // Create a new Express account for this gym owner
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          gym_id: gymId,
          gym_name: gym.name,
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
        },
      });
      stripeAccountId = account.id;
      // Save the account ID immediately
      await base44.asServiceRole.entities.Gym.update(gymId, { stripe_account_id: stripeAccountId });
      console.log('Created Stripe Express account:', stripeAccountId, 'for gym:', gymId);
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    console.log('Sending gym owner to Stripe onboarding:', gymId);
    return Response.json({ url: accountLink.url, stripeAccountId });
  } catch (error) {
    console.error('stripeConnectOnboard error:', error.message);
    // Detect Stripe Connect not being enabled on this account
    if (error.message && error.message.includes('signed up for Connect')) {
      return Response.json({ error: 'connect_not_enabled', message: error.message }, { status: 200 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});