import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.6.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2024-12-18.acacia'
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a verification session
    const origin = req.headers.get('origin') || 'https://gymunityapp.base44.app';
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: user.id,
        user_email: user.email,
        base44_app_id: Deno.env.get("BASE44_APP_ID")
      },
      return_url: `${origin}/GymSignup`
    });

    return Response.json({
      client_secret: verificationSession.client_secret,
      session_id: verificationSession.id,
      url: verificationSession.url
    });
  } catch (error) {
    console.error('Identity verification creation error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create verification session' 
    }, { status: 500 });
  }
});