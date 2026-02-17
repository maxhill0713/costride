import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gym_id, gym_name, price_cents } = await req.json();

    if (!gym_id || !gym_name) {
      return Response.json({ error: 'Missing gym_id or gym_name' }, { status: 400 });
    }

    // Default to £9.99/month if no price provided
    const amount = price_cents || 999;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${gym_name} - Monthly Membership`,
              description: `Gym membership for ${gym_name}`,
            },
            unit_amount: amount,
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/pages/Gyms?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pages/Gyms`,
      customer_email: user.email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user.id,
        gym_id: gym_id,
        gym_name: gym_name,
      },
    });

    return Response.json({ 
      success: true, 
      session_id: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Checkout creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});