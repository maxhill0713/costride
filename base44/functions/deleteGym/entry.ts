import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gymId } = await req.json();
    if (!gymId) {
      return Response.json({ error: 'gymId required' }, { status: 400 });
    }

    // Verify ownership before deleting
    const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    if (!gyms.length) {
      return Response.json({ error: 'Gym not found' }, { status: 404 });
    }

    const gym = gyms[0];
    const isOwner = gym.owner_email === user.email || gym.admin_id === user.id;

    if (!isOwner) {
      console.warn(`SECURITY: User ${user.email} attempted to delete gym ${gymId} they don't own`);
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await base44.asServiceRole.entities.Gym.delete(gymId);

    console.log(`Gym ${gymId} deleted by owner ${user.email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('deleteGym error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});