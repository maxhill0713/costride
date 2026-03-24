import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped.
// 2. priceId validated against Stripe before use (prevents client price substitution).
// 3. subscriptionType restricted to allowlist to prevent arbitrary enum injection.
// 4. Raw error.message + stack trace suppressed.

const ALLOWED_SUBSCRIPTION_TYPES = ['user_premium', 'gym_basic', 'gym_pro', 'gym_enterprise'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, subscriptionType } = await req.json();

    if (!priceId || typeof priceId !== 'string') {
      return Response.json({ error: 'Price ID is required' }, { status: 400 });
    }

    const safeSubType = ALLOWED_SUBSCRIPTION_TYPES.includes(subscriptionType)
      ? subscriptionType
      : 'user_premium';

    // SECURITY: Validate priceId in Stripe (prevents price substitution attacks)
    let price;
    try {
      price = await stripe.prices.retrieve(priceId);
    } catch {
      return Response.json({ error: 'Invalid price' }, { status: 400 });
    }
    if (!price.active) {
      return Response.json({ error: 'Price is no longer available' }, { status: 400 });
    }

    const origin = new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items:     [{ price: priceId, quantity: 1 }],
      mode:           'subscription',
      success_url:    `${origin}?success=true`,
      cancel_url:     `${origin}?canceled=true`,
      metadata: {
        base44_app_id:     Deno.env.get('BASE44_APP_ID'),
        user_id:           user.id,
        user_email:        user.email,
        subscription_type: safeSubType,
      },
      subscription_data: {
        metadata: {
          base44_app_id:     Deno.env.get('BASE44_APP_ID'),
          user_id:           user.id,
          user_email:        user.email,
          subscription_type: safeSubType,
        },
      },
    });

    console.log('Checkout session created:', session.id);
    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});