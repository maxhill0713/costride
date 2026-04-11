import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. No rate limiting — a user could rapidly call this to inflate check-in counts and
//    gain unfair challenge/leaderboard advantages. Now hard-rate-limited server-side.
// 2. No gym membership check — any user could check into any gym they're not a member of.
//    Now verifies an active GymMembership exists before allowing check-in.
// 3. userLat/userLon are fully client-supplied (GPS spoofing possible) — this is a
//    known limitation; we log the submitted coords but cannot prevent hardware spoofing.
//    At minimum, we now validate they are real numbers in plausible ranges.
// 4. Raw error.message already suppressed (kept).

// In-memory rate limit: 3 check-ins per user per 24h window (server restarts reset it,
// but the DB duplicate-check is the real guard — this adds a fast pre-check).
const checkinRateMap = new Map();

function rateAllow(userId) {
  const now  = Date.now();
  const DAY  = 24 * 60 * 60 * 1000;
  const entry = checkinRateMap.get(userId);
  // Allow 3 rapid calls in case of network retries; true daily limit is enforced by DB query
  if (!entry || now - entry.windowStart > DAY) {
    checkinRateMap.set(userId, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!rateAllow(user.id)) {
      console.warn(`Check-in rate limit hit for user ${user.id}`);
      return Response.json({ error: 'Too many check-in attempts. Please wait.' }, { status: 429 });
    }

    const { gymId, userLat, userLon } = await req.json();

    if (!gymId || typeof gymId !== 'string') {
      return Response.json({ error: 'Gym ID required' }, { status: 400 });
    }

    // Validate coordinates are plausible numbers if provided
    if (userLat !== null && userLat !== undefined) {
      if (typeof userLat !== 'number' || !isFinite(userLat) || userLat < -90 || userLat > 90) {
        return Response.json({ error: 'Invalid latitude' }, { status: 400 });
      }
    }
    if (userLon !== null && userLon !== undefined) {
      if (typeof userLon !== 'number' || !isFinite(userLon) || userLon < -180 || userLon > 180) {
        return Response.json({ error: 'Invalid longitude' }, { status: 400 });
      }
    }

    const gymData = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    if (!gymData || gymData.length === 0) {
      return Response.json({ error: 'Gym not found' }, { status: 404 });
    }
    const gym = gymData[0];

    // SECURITY: Verify the user is an active member of this gym
    const membership = await base44.asServiceRole.entities.GymMembership.filter({
      user_id: user.id,
      gym_id:  gymId,
      status:  'active',
    });
    if (membership.length === 0) {
      console.warn(`User ${user.id} tried to check in to gym ${gymId} without membership`);
      return Response.json({ error: 'You are not a member of this gym' }, { status: 403 });
    }

    // SECURITY: Check if user is banned from this gym
    if ((gym.banned_members || []).includes(user.id)) {
      return Response.json({ error: 'You are not permitted to check in to this gym' }, { status: 403 });
    }

    // Location check (GPS spoofing is a known limitation — we log coords for audit)
    if (gym.latitude && gym.longitude) {
      if (userLat == null || userLon == null) {
        return Response.json({ error: 'Location required to check in to this gym' }, { status: 400 });
      }
      const R    = 6371000;
      const dLat = (gym.latitude - userLat) * Math.PI / 180;
      const dLon = (gym.longitude - userLon) * Math.PI / 180;
      const a    = Math.sin(dLat/2) ** 2 +
        Math.cos(userLat * Math.PI / 180) * Math.cos(gym.latitude * Math.PI / 180) *
        Math.sin(dLon/2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      if (distance > 500) {
        return Response.json({
          error:    `You're ${Math.round(distance)}m away. Must be within 500m of the gym to check in.`,
          distance,
          required: 500,
        }, { status: 400 });
      }
      console.log(`Check-in geo-verified: user ${user.id} at ${Math.round(distance)}m from gym ${gymId}`);
    }

    // Duplicate daily check-in guard
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCheckIn = await base44.entities.CheckIn.filter({
      user_id:       user.id,
      gym_id:        gymId,
      check_in_date: { $gte: today.toISOString() },
    });
    if (todayCheckIn.length > 0) {
      return Response.json({ error: 'Already checked in today' }, { status: 400 });
    }

    // Limit 1 — only need to know whether any prior visit exists, not fetch all of them.
    const previousVisits = await base44.entities.CheckIn.filter({ user_id: user.id, gym_id: gymId }, '-check_in_date', 1);
    const isFirstVisit   = previousVisits.length === 0;

    const checkIn = await base44.entities.CheckIn.create({
      user_id:       user.id,
      user_name:     user.full_name,
      gym_id:        gymId,
      gym_name:      gym.name,
      check_in_date: new Date().toISOString(),
      first_visit:   isFirstVisit,
    });

    // Audit log successful check-in
    console.log(JSON.stringify({ event: 'AUDIT', action: isFirstVisit ? 'first_checkin' : 'checkin', user_id: user.id, user_email: user.email, resource_type: 'gym', resource_id: gymId, status: 'success', timestamp: new Date().toISOString() }));

    try {
      await base44.functions.invoke('updateChallengeProgress', {
        event: { type: 'create', entity_name: 'CheckIn', data: { user_id: user.id } },
      });
    } catch (e) {
      console.warn('Failed to update challenge progress:', e.message);
    }

    return Response.json({ checkIn });
  } catch (error) {
    console.error('Error performing check-in:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});