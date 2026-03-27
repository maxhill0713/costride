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
    const coaches = await base44.asServiceRole.entities.Coach.filter({ user_email: user.email });
    const coach = coaches[0];
    if (!coach) {
      return Response.json({ error: 'User is not a coach' }, { status: 403 });
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

    // Store assigned workout in a new entity to track assignments
    const assignment = await base44.asServiceRole.entities.AssignedWorkout.create({
      member_id: memberId,
      coach_id: coach.id,
      coach_name: coach.name,
      workout_data: assignedWorkout,
      assigned_date: new Date().toISOString(),
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

    console.log('Workout assigned successfully:', { memberId, coachId: coach.id, assignmentId: assignment.id });

    return Response.json({
      success: true,
      message: 'Workout assigned successfully',
      assignment_id: assignment.id,
      assigned_workout: assignedWorkout,
    });
  } catch (error) {
    console.error('Error assigning workout:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});