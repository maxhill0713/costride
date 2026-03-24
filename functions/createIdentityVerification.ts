import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

// SECURITY FIX [LOW]:
// 1. SDK version bumped.
// 2. Raw error.message suppressed.
// 3. Hardcoded fallback origin replaced with dynamic req header.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id:       user.id,
        user_email:    user.email,
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
      return_url: `${origin}/GymSignup`,
    });

    return Response.json({
      client_secret: verificationSession.client_secret,
      session_id:    verificationSession.id,
      url:           verificationSession.url,
    });
  } catch (error) {
    console.error('Identity verification creation error:', error.message);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});