import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { exercise, weight_lbs, reps, gym_id, notes, video_url } = await req.json();

    if (!exercise || !weight_lbs) {
      return Response.json({ error: 'Exercise and weight are required' }, { status: 400 });
    }

    // Check if user has checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCheckIn = await base44.entities.CheckIn.filter({
      user_id: user.id,
      check_in_date: { $gte: today.toISOString() }
    });

    if (todayCheckIn.length === 0) {
      return Response.json({ error: 'You must check in to the gym before logging a workout' }, { status: 400 });
    }

    // Check if this is a PR (personal record)
    const previousLifts = await base44.entities.Lift.filter({
      member_id: user.id,
      exercise: exercise
    }, '-created_date', 1);

    const isPR = !previousLifts.length || weight_lbs > (previousLifts[0].weight_lbs || 0);

    const lift = await base44.entities.Lift.create({
      member_id: user.id,
      member_name: user.full_name,
      exercise,
      weight_lbs,
      reps: reps || 1,
      is_pr: isPR,
      lift_date: new Date().toISOString().split('T')[0],
      notes: notes || '',
      video_url: video_url || null,
      gym_id: gym_id || null
    });

    // Increment user streak
    const newStreak = (user.streak || 0) + 1;
    await base44.auth.updateMe({ streak: newStreak });

    // Create system post if PR
    if (isPR) {
      await base44.entities.Post.create({
        member_id: user.id,
        member_name: user.full_name,
        member_avatar: user.avatar_url,
        content: `🎉 New Personal Record! ${weight_lbs}lbs on ${exercise}`,
        is_system_generated: true,
        likes: 0,
        comments: [],
        reactions: {}
      });
    }

    return Response.json({ lift, isPR, newStreak });
  } catch (error) {
    console.error('Error creating lift:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});