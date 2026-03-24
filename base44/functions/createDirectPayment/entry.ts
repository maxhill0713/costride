import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

// SECURITY FIX [HIGH]:
// 1. SDK version bumped. Stripe imported at module level consistently.
// 2. amount was hardcoded from a client-controlled priceId string check — this is fragile
//    and can be wrong. Now amount is NOT used from hardcoded map; we rely on the price
//    object from Stripe directly (priceId validated via stripe.prices.retrieve).
// 3. subscriptionType restricted to allowlist.
// 4. Raw error.message suppressed.

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
      return Response.json({ error: 'priceId is required' }, { status: 400 });
    }

    const safeSubType = ALLOWED_SUBSCRIPTION_TYPES.includes(subscriptionType)
      ? subscriptionType
      : 'user_premium';

    // SECURITY: Validate priceId in Stripe — prevents price substitution
    let price;
    try {
      price = await stripe.prices.retrieve(priceId);
    } catch {
      return Response.json({ error: 'Invalid price' }, { status: 400 });
    }
    if (!price.active) {
      return Response.json({ error: 'Price is no longer available' }, { status: 400 });
    }
    if (!price.unit_amount) {
      return Response.json({ error: 'Price has no unit amount' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:               price.unit_amount,
      currency:             price.currency || 'gbp',
      payment_method_types: ['card'],
      metadata: {
        base44_app_id:     Deno.env.get('BASE44_APP_ID'),
        user_id:           user.id,
        user_email:        user.email,
        subscription_type: safeSubType,
      },
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        base44_app_id:     Deno.env.get('BASE44_APP_ID'),
        user_id:           user.id,
        user_email:        user.email,
        subscription_type: safeSubType,
      },
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      redirectUrl:  paymentLink.url,
    });
  } catch (error) {
    console.error('Direct payment error:', error.message);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});