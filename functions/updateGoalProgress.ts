import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId, newValue } = await req.json();

    if (!goalId || newValue === undefined) {
      return Response.json({ error: 'Goal ID and value required' }, { status: 400 });
    }

    const goals = await base44.entities.Goal.filter({ id: goalId, user_id: user.id });
    if (goals.length === 0) {
      return Response.json({ error: 'Goal not found' }, { status: 404 });
    }

    const goal = goals[0];
    let status = goal.status;

    // Check if goal is completed
    if (newValue >= goal.target_value) {
      status = 'completed';
      await base44.entities.Achievement.create({
        user_id: user.id,
        user_name: user.full_name,
        achievement_type: 'goal_completed',
        title: `Goal Completed: ${goal.title}`,
        description: `Achieved ${goal.target_value}${goal.unit}`,
        icon: '🎯',
        points: 100
      });
    }

    const updated = await base44.entities.Goal.update(goalId, {
      current_value: newValue,
      status
    });

    return Response.json({ goal: updated });
  } catch (error) {
    console.error('Error updating goal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});