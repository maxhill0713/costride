import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not set');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Webhook event received:', event.type);

    // Handle subscription events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        const userEmail = session.metadata.user_email;
        const subscriptionType = session.metadata.subscription_type || 'user_premium';

        console.log('Checkout completed for user:', userEmail, 'type:', subscriptionType);

        // Create subscription record
        await base44.asServiceRole.entities.Subscription.create({
          user_id: userId,
          subscriber_name: userEmail,
          subscription_type: subscriptionType,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          amount: subscriptionType === 'user_premium' ? 4.99 : 49.99,
        });

        // Send notification
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          type: 'subscription',
          title: subscriptionType === 'user_premium' ? '🎉 Welcome to Premium!' : '🎉 Welcome to Retention Pro!',
          message: subscriptionType === 'user_premium' 
            ? 'Your premium membership is now active. Unlock exclusive rewards!'
            : 'Your premium subscription is now active. Enjoy advanced analytics!',
          icon: '👑',
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata.user_id;
        const subscriptionType = subscription.metadata.subscription_type;

        console.log('Subscription updated for user:', userId);

        // Update subscription status
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
          user_id: userId,
        });

        if (subscriptions.length > 0) {
          const status = subscription.status === 'active' ? 'active' : 
                        subscription.status === 'canceled' ? 'cancelled' : 'expired';
          
          await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
            status,
          });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata.user_id;
        const subscriptionType = subscription.metadata.subscription_type;

        console.log('Subscription cancelled for user:', userId);

        // Update subscription to cancelled
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
          user_id: userId,
        });

        if (subscriptions.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
            status: 'cancelled',
          });
        }

        // Send notification
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          type: 'subscription',
          title: 'Subscription Cancelled',
          message: subscriptionType === 'user_premium'
            ? 'Your Premium membership has been cancelled.'
            : 'Your Retention Pro subscription has been cancelled.',
          icon: '💔',
        });

        break;
      }

      case 'identity.verification_session.verified': {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        
        if (userId) {
          await base44.asServiceRole.entities.User.update(userId, {
            identity_verified: true,
            identity_verification_session_id: session.id
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
        console.log('Unhandled event type:', event.type);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});