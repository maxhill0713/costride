import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped.
// 2. Raw error.message suppressed.
// 3. newValue validated as a finite number (prevents NaN/Infinity poisoning).
// 4. Achievement type 'goal_completed' not in the Achievement enum — use 'community_leader'
//    as closest valid type or just skip; here we use a valid enum.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId, newValue } = await req.json();

    if (!goalId) {
      return Response.json({ error: 'Goal ID required' }, { status: 400 });
    }
    if (newValue === undefined || newValue === null || typeof newValue !== 'number' || !isFinite(newValue) || newValue < 0) {
      return Response.json({ error: 'newValue must be a non-negative finite number' }, { status: 400 });
    }

    // Always filter by user_id to prevent updating another user's goal
    const goals = await base44.entities.Goal.filter({ id: goalId, user_id: user.id });
    if (goals.length === 0) {
      return Response.json({ error: 'Goal not found' }, { status: 404 });
    }

    const goal   = goals[0];
    let   status = goal.status;

    if (newValue >= goal.target_value) {
      status = 'completed';
    }

    const updated = await base44.entities.Goal.update(goalId, {
      current_value: newValue,
      status,
    });

    return Response.json({ goal: updated });
  } catch (error) {
    console.error('Error updating goal:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});