import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { startOfDay, subDays, isSameDay } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all users with training days configured
    const allUsers = await base44.asServiceRole.entities.User.list();
    const usersWithSplits = allUsers.filter(u => u.training_days && u.training_days.length > 0);
    
    const yesterday = subDays(new Date(), 1);
    const yesterdayDayOfWeek = yesterday.getDay();
    const adjustedYesterdayDay = yesterdayDayOfWeek === 0 ? 7 : yesterdayDayOfWeek;
    
    let restDaysLogged = 0;
    
    for (const user of usersWithSplits) {
      // Check if yesterday was a rest day (not in training days)
      const isRestDay = !user.training_days.includes(adjustedYesterdayDay);
      
      if (!isRestDay) continue;
      
      // Check if user already has a check-in for yesterday
      const checkIns = await base44.asServiceRole.entities.CheckIn.filter({
        user_id: user.id
      }, '-check_in_date', 10);
      
      const hasYesterdayCheckIn = checkIns.some(c => 
        isSameDay(new Date(c.check_in_date), yesterday)
      );
      
      if (hasYesterdayCheckIn) continue;
      
      // Get user's primary gym
      const memberships = await base44.asServiceRole.entities.GymMembership.filter({
        user_id: user.id,
        status: 'active'
      }, '-created_date', 1);
      
      if (memberships.length === 0) continue;
      
      const gymId = memberships[0].gym_id;
      const gymName = memberships[0].gym_name;
      
      // Auto-log rest day
      await base44.asServiceRole.entities.CheckIn.create({
        user_id: user.id,
        user_name: user.full_name,
        gym_id: gymId,
        gym_name: gymName,
        check_in_date: startOfDay(yesterday).toISOString(),
        first_visit: false,
        is_rest_day: true // Flag to identify auto-logged rest days
      });
      
      restDaysLogged++;
    }
    
    return Response.json({ 
      success: true,
      restDaysLogged,
      message: `Auto-logged ${restDaysLogged} rest days`
    });
  } catch (error) {
    console.error('Error auto-logging rest days:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});