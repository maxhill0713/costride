import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('Unauthorized: No user found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, subscriptionType } = await req.json();

    if (!priceId) {
      console.error('Missing priceId in request');
      return Response.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Get the app's URL for success/cancel redirects
    const origin = new URL(req.url).origin;

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}?success=true`,
      cancel_url: `${origin}?canceled=true`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user.id,
        user_email: user.email,
        subscription_type: subscriptionType || 'user_premium',
      },
      subscription_data: {
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          user_id: user.id,
          user_email: user.email,
          subscription_type: subscriptionType || 'user_premium',
        },
      },
    });

    console.log('Checkout session created:', session.id);

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
});