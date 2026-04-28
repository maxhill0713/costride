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

    const clientId = Deno.env.get('STRIPE_CONNECT_CLIENT_ID');
    if (!clientId) return Response.json({ error: 'STRIPE_CONNECT_CLIENT_ID not configured' }, { status: 500 });

    if (stripeAccountId) {
      // Account already exists — create a fresh account link to continue/update onboarding
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: returnUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
      return Response.json({ url: accountLink.url, stripeAccountId });
    }

    // No account yet — send owner through Stripe Connect OAuth flow
    const state = btoa(JSON.stringify({ gymId, userId: user.id }));
    const oauthUrl = `https://connect.stripe.com/express/oauth/authorize?` +
      `response_type=code` +
      `&client_id=${clientId}` +
      `&scope=read_write` +
      `&redirect_uri=${encodeURIComponent(returnUrl)}` +
      `&state=${encodeURIComponent(state)}` +
      `&stripe_user[email]=${encodeURIComponent(user.email)}`;

    console.log('Redirecting gym owner to Stripe Connect OAuth:', gymId);
    return Response.json({ url: oauthUrl });
  } catch (error) {
    console.error('stripeConnectOnboard error:', error.message);
    // Detect Stripe Connect not being enabled on this account
    if (error.message && error.message.includes('signed up for Connect')) {
      return Response.json({ error: 'connect_not_enabled', message: error.message }, { status: 200 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});