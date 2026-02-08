import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find all gyms that belong to this user
    const allGyms = await base44.asServiceRole.entities.Gym.list();
    const userGyms = allGyms.filter(g => g.owner_email === user.email || g.created_by === user.email);

    // Update each gym to have admin_id set correctly
    for (const gym of userGyms) {
      if (!gym.admin_id || gym.admin_id !== user.id) {
        await base44.asServiceRole.entities.Gym.update(gym.id, {
          admin_id: user.id,
          owner_email: user.email
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      gyms_updated: userGyms.length,
      message: `Linked ${userGyms.length} gym(s) to your account`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error linking gym owner:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});