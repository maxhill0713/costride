import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const membershipData = {
      user_id: body.user_id || user.id,
      user_name: body.user_name || user.full_name,
      user_email: body.user_email || user.email,
      gym_id: body.gym_id,
      gym_name: body.gym_name,
      status: body.status || 'active',
      join_date: body.join_date,
      membership_type: body.membership_type || 'monthly'
    };

    const result = await base44.entities.GymMembership.create(membershipData);

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Create membership error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});