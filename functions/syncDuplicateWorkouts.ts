import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workoutTypes = user.custom_workout_types || {};
        
        // Group days by workout name
        const workoutGroups = {};
        Object.keys(workoutTypes).forEach(dayKey => {
            const workout = workoutTypes[dayKey];
            const workoutName = workout.name;
            
            if (!workoutGroups[workoutName]) {
                workoutGroups[workoutName] = [];
            }
            workoutGroups[workoutName].push({ dayKey, workout });
        });

        // For each group with duplicates, find the day with most exercises and sync others
        const updatedWorkoutTypes = { ...workoutTypes };
        
        Object.values(workoutGroups).forEach(group => {
            if (group.length > 1) {
                // Find the workout with the most exercises
                const mostComplete = group.reduce((prev, current) => {
                    const prevCount = prev.workout.exercises?.length || 0;
                    const currentCount = current.workout.exercises?.length || 0;
                    return currentCount > prevCount ? current : prev;
                });

                // Sync all other days in this group to match the most complete one
                group.forEach(({ dayKey }) => {
                    updatedWorkoutTypes[dayKey] = {
                        ...mostComplete.workout
                    };
                });
            }
        });

        // Save the updated workout types
        await base44.auth.updateMe({ custom_workout_types: updatedWorkoutTypes });

        return Response.json({ 
            success: true,
            synced: Object.keys(workoutGroups).filter(name => workoutGroups[name].length > 1)
        });
    } catch (error) {
        console.error('Sync error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});