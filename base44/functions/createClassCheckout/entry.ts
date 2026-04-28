import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { classId, successUrl, cancelUrl } = await req.json();

    if (!classId) return Response.json({ error: 'classId required' }, { status: 400 });

    // Use service role to fetch class data (no auth required)
    const classes = await base44.asServiceRole.entities.GymClass.filter({ id: classId });
    const gymClass = classes[0];
    if (!gymClass) return Response.json({ error: 'Class not found' }, { status: 404 });

    const price = parseFloat(gymClass.price);
    if (!price || price <= 0) return Response.json({ error: 'This class is free' }, { status: 400 });

    // Try to get current user for prefilling email (optional)
    let customerEmail;
    try {
      const user = await base44.auth.me();
      customerEmail = user?.email;
    } catch (_) {}

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      line_items: [{
        price_data: {
          currency: 'gbp',
          unit_amount: Math.round(price * 100),
          product_data: {
            name: gymClass.name,
            description: gymClass.instructor ? `with ${gymClass.instructor}` : gymClass.description || undefined,
          },
        },
        quantity: 1,
      }],
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        class_id: classId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log('Checkout session created:', session.id, 'for class:', classId);
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createClassCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});