import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// NEW BACKEND FUNCTION:
// The frontend was creating ClaimedBonus records directly via the entity SDK with:
// 1. A weak Math.random() redemption code (predictable — not cryptographically secure).
// 2. No server-side eligibility verification — anyone could claim any reward without
//    meeting the requirement (check-ins, streak, challenge completion, etc.).
// 3. No duplicate-claim prevention beyond a client-side filter.
// 4. No quantity-limit enforcement — limited rewards could be over-claimed.
//
// This function centralises all reward claiming with server-side enforcement.

// AUDIT LOGGING UTILITY
async function logAuditEvent(base44, event) {
  const auditLog = {
    action: event.action,
    user_id: event.user_id,
    user_email: event.user_email,
    resource_type: event.resource_type,
    resource_id: event.resource_id,
    target_id: event.target_id || null,
    status: event.status,
    reason: event.reason || null,
    timestamp: new Date().toISOString()
  };
  console.log(JSON.stringify({ event: 'AUDIT', ...auditLog }));
}

function generateSecureCode(len = 8) {
  const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes  = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rewardId, challengeId } = await req.json();

    if (!rewardId && !challengeId) {
      return Response.json({ error: 'rewardId or challengeId required' }, { status: 400 });
    }

    // FRAUD DETECTION: max 5 reward claims per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentClaims = await base44.asServiceRole.entities.ClaimedBonus.filter({
      user_id: user.id,
      created_date: { $gte: oneHourAgo }
    });
    if (recentClaims.length >= 5) {
      await logAuditEvent(base44, {
        action: 'reward_claim_fraud_detected',
        user_id: user.id,
        user_email: user.email,
        resource_type: 'reward',
        resource_id: rewardId || challengeId,
        status: 'failure',
        reason: `rapid_claiming: ${recentClaims.length} claims in 1 hour`
      });
      return Response.json({ error: 'Too many reward claims. Please wait before claiming again.' }, { status: 429 });
    }

    // ── DUPLICATE CLAIM CHECK ─────────────────────────────────────────────────
    const query = rewardId
      ? { user_id: user.id, reward_id: rewardId }
      : { user_id: user.id, challenge_id: challengeId };

    const existing = await base44.asServiceRole.entities.ClaimedBonus.filter(query);
    if (existing.length > 0) {
      await logAuditEvent(base44, {
        action: 'reward_claim_attempt',
        user_id: user.id,
        user_email: user.email,
        resource_type: 'reward',
        resource_id: rewardId || challengeId,
        status: 'failure',
        reason: 'duplicate_claim'
      });
      return Response.json({ error: 'Already claimed' }, { status: 400 });
    }

    let offerDetails = '';
    let earnedText   = '';
    let gymId        = null;
    let bonusType    = 'gym_offer';

    if (rewardId) {
      // ── REWARD CLAIM ───────────────────────────────────────────────────────
      const rewards = await base44.asServiceRole.entities.Reward.filter({ id: rewardId });
      if (!rewards.length) return Response.json({ error: 'Reward not found' }, { status: 404 });
      const reward = rewards[0];

      if (!reward.active) {
        return Response.json({ error: 'This reward is no longer available' }, { status: 400 });
      }

      // Premium-only check
      if (reward.premium_only) {
        const subs = await base44.asServiceRole.entities.Subscription.filter({
          user_id: user.id, status: 'active',
        });
        if (!subs.length) {
          return Response.json({ error: 'This reward requires a premium subscription' }, { status: 403 });
        }
      }

      // Quantity-limit enforcement
      if (reward.quantity_limited && reward.max_quantity > 0) {
        const claimedSoFar = await base44.asServiceRole.entities.ClaimedBonus.filter({ reward_id: rewardId });
        if (claimedSoFar.length >= reward.max_quantity) {
          return Response.json({ error: 'This reward has sold out' }, { status: 400 });
        }
      }

      // Requirement enforcement
      const req_type = reward.requirement;
      if (req_type === 'check_ins_10') {
        const checkIns = await base44.asServiceRole.entities.CheckIn.filter({ user_id: user.id, gym_id: reward.gym_id }, '-check_in_date', 10);
        if (checkIns.length < 10) return Response.json({ error: 'You need 10 check-ins at this gym to claim this reward' }, { status: 403 });
      } else if (req_type === 'check_ins_50') {
        const checkIns = await base44.asServiceRole.entities.CheckIn.filter({ user_id: user.id, gym_id: reward.gym_id }, '-check_in_date', 50);
        if (checkIns.length < 50) return Response.json({ error: 'You need 50 check-ins at this gym to claim this reward' }, { status: 403 });
      } else if (req_type === 'streak_30') {
        const userRecord = await base44.asServiceRole.entities.User.filter({ id: user.id });
        const streak = userRecord[0]?.current_streak || 0;
        if (streak < 30) return Response.json({ error: 'You need a 30-day streak to claim this reward' }, { status: 403 });
      } else if (req_type === 'challenge_winner') {
        const won = await base44.asServiceRole.entities.Challenge.filter({ winner_id: user.id });
        if (!won.length) return Response.json({ error: 'You need to win a challenge to claim this reward' }, { status: 403 });
      }
      // 'referral', 'points', 'none' — no server-side check (manual/no requirement)

      gymId        = reward.gym_id || null;
      offerDetails = reward.title;
      earnedText   = reward.description || reward.title;
      bonusType    = reward.type === 'free_day_pass' ? 'free_day_pass' : 'gym_offer';

    } else {
       // ── CHALLENGE REWARD CLAIM ────────────────────────────────────────────
       // Handle monthly "Witness My Gains" challenge separately
       if (challengeId === 'witness_my_gains') {
         // Verify user completed the monthly challenge (4 shared workouts)
         const now = new Date();
         const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
         const userRecord = await base44.asServiceRole.entities.User.filter({ id: user.id });
         if (!userRecord.length) return Response.json({ error: 'User not found' }, { status: 404 });

         const monthlyProgress = userRecord[0].monthly_challenge_progress || {};
         const isCurrentMonth = monthlyProgress.month === currentMonth;
         const progress = isCurrentMonth ? (monthlyProgress.witness_my_gains || 0) : 0;

         if (progress < 4) {
           return Response.json({ error: 'You need to share 4 workouts this month to complete this challenge' }, { status: 403 });
         }

         offerDetails = 'Witness My Gains';
         earnedText   = 'Completed: Witness My Gains';
         bonusType    = 'streak_icon_unlock';

         // Unlock the Spartan streak icon for this user
         const unlockedVariants = userRecord[0].unlocked_streak_variants || [];
         if (!unlockedVariants.includes('spartan')) {
           await base44.asServiceRole.entities.User.update(user.id, {
             unlocked_streak_variants: [...unlockedVariants, 'spartan']
           });
         }
       } else if (challengeId === 'discipline_builder') {
         // Verify user completed the monthly challenge (15 workouts)
         const now = new Date();
         const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
         const userRecord = await base44.asServiceRole.entities.User.filter({ id: user.id });
         if (!userRecord.length) return Response.json({ error: 'User not found' }, { status: 404 });

         const monthlyProgress = userRecord[0].monthly_challenge_progress || {};
         const isCurrentMonth = monthlyProgress.month === currentMonth;
         const progress = isCurrentMonth ? (monthlyProgress.discipline_builder || 0) : 0;

         if (progress < 15) {
           return Response.json({ error: 'You need to log 15 workouts this month to complete this challenge' }, { status: 403 });
         }

         offerDetails = 'Discipline Builder';
         earnedText   = 'Completed: Discipline Builder';
         bonusType    = 'streak_icon_unlock';

         // Unlock the Beach streak icon for this user
         const unlockedVariants = userRecord[0].unlocked_streak_variants || [];
         if (!unlockedVariants.includes('beach')) {
           await base44.asServiceRole.entities.User.update(user.id, {
             unlocked_streak_variants: [...unlockedVariants, 'beach']
           });
         }
       } else {
         // Regular gym challenge
         const challenges = await base44.asServiceRole.entities.Challenge.filter({ id: challengeId });
         if (!challenges.length) return Response.json({ error: 'Challenge not found' }, { status: 404 });
         const challenge = challenges[0];

         if (challenge.status !== 'completed') {
           return Response.json({ error: 'Challenge is not yet completed' }, { status: 400 });
         }

         const isParticipant = (challenge.participants || []).includes(user.id);
         if (!isParticipant) {
           return Response.json({ error: 'You did not participate in this challenge' }, { status: 403 });
         }

         gymId        = challenge.gym_id || null;
         offerDetails = challenge.title;
         earnedText   = `Completed: ${challenge.title}`;
         bonusType    = 'gym_offer';
       }
     }

    // ── CREATE CLAIM with cryptographically secure code ───────────────────────
    const redemptionCode = generateSecureCode(8);

    const bonus = await base44.asServiceRole.entities.ClaimedBonus.create({
      user_id:         user.id,
      gym_id:          gymId,
      reward_id:       rewardId   || null,
      challenge_id:    challengeId || null,
      bonus_type:      bonusType,
      offer_details:   offerDetails,
      earned_text:     earnedText,
      redemption_code: redemptionCode,
      redeemed:        false,
    });

    // Log successful reward claim
    await logAuditEvent(base44, {
      action: 'reward_claimed',
      user_id: user.id,
      user_email: user.email,
      resource_type: 'reward',
      resource_id: rewardId || challengeId,
      status: 'success'
    });

    return Response.json({ bonus });
  } catch (error) {
    console.error('claimReward error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});