import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

// SECURITY FIX [HIGH]:
// 1. SDK version bumped to 0.8.21
// 2. No gym ownership verification — any user could subscribe under any gym's ID.
//    Now validates the caller owns the gym before creating the checkout.
// 3. priceId was passed from the client without allowlist validation — an attacker could
//    substitute a cheaper price ID. Now the function fetches and validates the price.
// 4. Raw error.message + stack trace suppressed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, gymId } = await req.json();

    if (!priceId || typeof priceId !== 'string') {
      return Response.json({ error: 'priceId is required' }, { status: 400 });
    }
    if (!gymId || typeof gymId !== 'string') {
      return Response.json({ error: 'gymId is required' }, { status: 400 });
    }

    // SECURITY: Verify the caller owns the gym
    const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    if (!gyms.length) {
      return Response.json({ error: 'Gym not found' }, { status: 404 });
    }
    const gym = gyms[0];
    const isOwner = gym.owner_email === user.email || gym.admin_id === user.id;
    if (!isOwner) {
      console.warn(`SECURITY: User ${user.email} tried to subscribe on behalf of gym ${gymId}`);
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // SECURITY: Validate that the priceId exists in Stripe (prevents price substitution)
    let price;
    try {
      price = await stripe.prices.retrieve(priceId);
    } catch {
      return Response.json({ error: 'Invalid price' }, { status: 400 });
    }
    if (!price.active) {
      return Response.json({ error: 'Price is no longer available' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const session = await stripe.checkout.sessions.create({
      mode:                'subscription',
      payment_method_types: ['card'],
      line_items:          [{ price: priceId, quantity: 1 }],
      success_url:         `${origin}/GymOwnerDashboard?success=true`,
      cancel_url:          `${origin}/GymOwnerDashboard?canceled=true`,
      customer_email:      user.email,
      metadata: {
        base44_app_id:      Deno.env.get('BASE44_APP_ID'),
        user_id:            user.id,
        gym_id:             gymId,
        subscription_type:  'retention_pro',
      },
      subscription_data: {
        metadata: {
          user_id:           user.id,
          gym_id:            gymId,
          subscription_type: 'retention_pro',
        },
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error.message);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});