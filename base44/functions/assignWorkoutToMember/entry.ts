import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId, workoutData } = await req.json();

    if (!memberId || !workoutData) {
      return Response.json({ error: 'Missing memberId or workoutData' }, { status: 400 });
    }

    // Get coach info
    const coach = await base44.asServiceRole.entities.Coach.filter({ user_email: user.email }).then(r => r[0]);
    if (!coach) {
      return Response.json({ error: 'User is not a coach' }, { status: 403 });
    }

    // Get member's current workouts
    const member = await base44.asServiceRole.entities.User.filter({ id: memberId }).then(r => r[0]);
    if (!member) {
      return Response.json({ error: 'Member not found' }, { status: 404 });
    }

    // Create assigned workout with coach name
    const assignedWorkout = {
      ...workoutData,
      name: `${coach.name} assigned workout`,
      assigned_by_coach_id: coach.id,
      assigned_by_coach_name: coach.name,
      assigned_date: new Date().toISOString(),
      is_assigned: true,
    };

    // Add to member's assigned workouts (stored in user profile)
    const assignedWorkouts = member.assigned_workouts || [];
    assignedWorkouts.push(assignedWorkout);

    await base44.asServiceRole.auth.updateUser(memberId, {
      assigned_workouts: assignedWorkouts,
    });

    // Create notification for member
    await base44.asServiceRole.entities.Notification.create({
      user_id: memberId,
      type: 'assigned_workout',
      title: `${coach.name} assigned you a workout`,
      message: `Check "${assignedWorkout.name}" in your splits`,
      icon: '💪',
      read: false,
    });

    return Response.json({
      success: true,
      message: 'Workout assigned successfully',
      assigned_workout: assignedWorkout,
    });
  } catch (error) {
    console.error('Error assigning workout:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});