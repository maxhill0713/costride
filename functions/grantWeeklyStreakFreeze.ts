import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();

    let grantedCount = 0;

    for (const user of users) {
      // Get current freeze count, default to 0 if not set
      const currentFreezes = user.streak_freezes || 0;

      // Grant 1 freeze, capped at 5 per week to prevent hoarding
      const newFreezes = Math.min(currentFreezes + 1, 5);

      await base44.asServiceRole.entities.User.update(user.id, {
        streak_freezes: newFreezes,
        last_freeze_grant: new Date().toISOString().split('T')[0]
      });

      grantedCount++;
    }

    return Response.json({ 
      success: true, 
      message: `Granted streak freezes to ${grantedCount} users`,
      usersUpdated: grantedCount
    });
  } catch (error) {
    console.error('Error granting streak freezes:', error);
    return Response.json({ 
      error: error.message, 
      success: false 
    }, { status: 500 });
  }
});