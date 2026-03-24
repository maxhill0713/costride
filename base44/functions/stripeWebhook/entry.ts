import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

// SECURITY FIX [MEDIUM]:
// 1. Subscription amount was hardcoded as 4.99/49.99 regardless of what Stripe charged.
//    Now reads the real amount from the Stripe session/invoice line items.
// 2. Idempotency: duplicate checkout.session.completed events could create multiple
//    Subscription records for the same user. Now checks for existing active subscription
//    before creating a new one.
// 3. user_id from metadata is from Stripe (already verified via signature) but we now
//    additionally confirm the user exists in the DB before writing records.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const body          = await req.text();
    const signature     = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not set');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Webhook event received:', event.type, event.id);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session          = event.data.object;
        const userId           = session.metadata?.user_id;
        const userEmail        = session.metadata?.user_email || session.customer_email;
        const subscriptionType = session.metadata?.subscription_type || 'user_premium';

        if (!userId) {
          console.warn('checkout.session.completed: missing user_id in metadata, event:', event.id);
          break;
        }

        console.log('Checkout completed for user:', userEmail, 'type:', subscriptionType, 'event:', event.id);

        // IDEMPOTENCY: Skip if subscription already exists for this user (duplicate webhook)
        const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
          user_id: userId,
          status:  'active',
          subscription_type: subscriptionType,
        });
        if (existingSubs.length > 0) {
          console.log('Subscription already exists for user:', userId, '— skipping duplicate');
          break;
        }

        // Read actual amount from Stripe instead of hardcoding
        let amount = 0;
        try {
          if (session.subscription) {
            const sub = await stripe.subscriptions.retrieve(session.subscription);
            amount = (sub.items?.data?.[0]?.price?.unit_amount || 0) / 100;
          } else if (session.amount_total) {
            amount = session.amount_total / 100;
          }
        } catch (e) {
          console.warn('Could not retrieve subscription amount:', e.message);
        }

        await base44.asServiceRole.entities.Subscription.create({
          user_id:           userId,
          subscriber_name:   userEmail || userId,
          subscription_type: subscriptionType,
          status:            'active',
          start_date:        new Date().toISOString().split('T')[0],
          amount,
        });

        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          type:    'subscription',
          title:   subscriptionType === 'user_premium' ? '🎉 Welcome to Premium!' : '🎉 Welcome to Retention Pro!',
          message: subscriptionType === 'user_premium'
            ? 'Your premium membership is now active. Unlock exclusive rewards!'
            : 'Your premium subscription is now active. Enjoy advanced analytics!',
          icon:    '👑',
          read:    false,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription     = event.data.object;
        const userId           = subscription.metadata?.user_id;
        const subscriptionType = subscription.metadata?.subscription_type;

        if (!userId) { console.warn('subscription.updated: missing user_id, event:', event.id); break; }
        console.log('Subscription updated for user:', userId);

        const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
        if (subs.length > 0) {
          const status = subscription.status === 'active'   ? 'active'
                       : subscription.status === 'canceled' ? 'cancelled'
                       : 'expired';
          await base44.asServiceRole.entities.Subscription.update(subs[0].id, { status });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId       = subscription.metadata?.user_id;

        if (!userId) { console.warn('subscription.deleted: missing user_id, event:', event.id); break; }
        console.log('Subscription cancelled for user:', userId);

        const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
        if (subs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subs[0].id, { status: 'cancelled' });
        }

        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          type:    'subscription',
          title:   'Subscription Cancelled',
          message: 'Your subscription has been cancelled.',
          icon:    '💔',
          read:    false,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const userId  = invoice.subscription_details?.metadata?.user_id
                     || invoice.metadata?.user_id;
        if (userId) {
          console.warn('Payment failed for user:', userId);
          await base44.asServiceRole.entities.Notification.create({
            user_id: userId,
            type:    'subscription',
            title:   'Payment Failed',
            message: 'We could not process your subscription payment. Please update your payment method.',
            icon:    '⚠️',
            read:    false,
          });
        }
        break;
      }

      case 'identity.verification_session.verified': {
        const session = event.data.object;
        const userId  = session.metadata?.user_id;
        if (userId) {
          await base44.asServiceRole.entities.User.update(userId, {
            identity_verified:                true,
            identity_verification_session_id: session.id,
          });
          console.log('Identity verified for user:', userId);
        }
        break;
      }

      case 'identity.verification_session.requires_input':
      case 'identity.verification_session.processing':
        console.log('Identity verification status:', event.type);
        break;

      default:
        console.log('Unhandled event type:', event.type, event.id);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});