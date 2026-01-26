import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gymName } = await req.json();

    if (!gymName) {
      return Response.json({ error: 'Gym name is required' }, { status: 400 });
    }

    // Find the gym by name
    const gyms = await base44.entities.Gym.list();
    const gym = gyms.find(g => g.name === gymName);

    if (!gym) {
      return Response.json({ error: 'Gym not found' }, { status: 404 });
    }

    // Update gym owner email
    await base44.entities.Gym.update(gym.id, { owner_email: user.email });

    // Create gym membership if it doesn't exist
    const memberships = await base44.entities.GymMembership.filter({ 
      gym_id: gym.id, 
      user_id: user.id 
    });

    if (memberships.length === 0) {
      await base44.entities.GymMembership.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        gym_id: gym.id,
        gym_name: gym.name,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        membership_type: 'lifetime'
      });
    }

    return Response.json({ success: true, gym });
  } catch (error) {
    console.error('Error reassigning gym:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});