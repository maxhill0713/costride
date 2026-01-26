import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, subscriptionType } = await req.json();

    const stripe = await import('npm:stripe@17.0.0');
    const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY'));

    // Create payment intent for direct payment
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: subscriptionType === 'gym_pro' ? 
        (priceId.includes('yearly') ? 49900 : 4999) : 49900,
      currency: 'gbp',
      payment_method_types: ['card'],
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user.id,
        user_email: user.email,
        subscription_type: subscriptionType
      }
    });

    // Create a payment link for direct payment
    const paymentLink = await stripeClient.paymentLinks.create({
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user.id,
        user_email: user.email,
        subscription_type: subscriptionType
      }
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      redirectUrl: paymentLink.url
    });
  } catch (error) {
    console.error('Direct payment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});