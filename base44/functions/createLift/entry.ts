import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped.
// 2. weight_lbs validated as a finite positive number — malformed input could store NaN/Infinity.
// 3. reps validated similarly.
// 4. notes and video_url sanitised.
// 5. Raw error.message suppressed.
// 6. PR auto-post: content is a fixed template, not user-supplied — safe.

const VALID_EXERCISES = ['bench_press', 'squat', 'deadlift', 'overhead_press', 'barbell_row', 'power_clean'];

function isValidUrl(url) {
  if (!url) return true;
  try { const u = new URL(url); return u.protocol === 'https:'; } catch { return false; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { exercise, weight_lbs, reps, gym_id, notes, video_url } = await req.json();

    if (!exercise || !VALID_EXERCISES.includes(exercise)) {
      return Response.json({ error: 'Invalid exercise type' }, { status: 400 });
    }
    if (weight_lbs === undefined || typeof weight_lbs !== 'number' || !isFinite(weight_lbs) || weight_lbs <= 0 || weight_lbs > 2000) {
      return Response.json({ error: 'weight_lbs must be a positive number ≤ 2000' }, { status: 400 });
    }
    const safeReps = typeof reps === 'number' && isFinite(reps) && reps > 0 ? Math.min(reps, 999) : 1;
    if (video_url && !isValidUrl(video_url)) {
      return Response.json({ error: 'Invalid video URL' }, { status: 400 });
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCheckIn = await base44.entities.CheckIn.filter({
      user_id:       user.id,
      check_in_date: { $gte: today.toISOString() },
    });
    if (todayCheckIn.length === 0) {
      return Response.json({ error: 'You must check in to the gym before logging a lift' }, { status: 400 });
    }

    const previousLifts = await base44.entities.Lift.filter({ member_id: user.id, exercise }, '-created_date', 1);
    const isPR = !previousLifts.length || weight_lbs > (previousLifts[0].weight_lbs || 0);

    const safeNotes = notes ? notes.replace(/<[^>]*>/g, '').trim().slice(0, 500) : '';

    const lift = await base44.entities.Lift.create({
      member_id:   user.id,
      member_name: user.full_name,
      exercise,
      weight_lbs,
      reps:        safeReps,
      is_pr:       isPR,
      lift_date:   new Date().toISOString().split('T')[0],
      notes:       safeNotes,
      video_url:   video_url || null,
      gym_id:      gym_id || null,
    });

    const newStreak = (user.streak || 0) + 1;
    await base44.auth.updateMe({ streak: newStreak });

    if (isPR) {
      // PR post content is entirely server-constructed — no user input in content
      await base44.entities.Post.create({
        member_id:          user.id,
        member_name:        user.full_name,
        member_avatar:      user.avatar_url || null,
        content:            `🎉 New Personal Record! ${weight_lbs}lbs on ${exercise.replace(/_/g, ' ')}`,
        is_system_generated: true,
        likes:              0,
        comments:           [],
        reactions:          {},
      });
    }

    return Response.json({ lift, isPR, newStreak });
  } catch (error) {
    console.error('Error creating lift:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});