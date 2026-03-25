import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Reads and writes coach annotation data (member notes/tags/goals/health,
// session attendance/notes/cancelled classes) to the Coach entity.
//
// The following JSON fields must exist on the Coach entity in base44:
//   client_notes, client_tags, client_goals, client_health  (member annotations)
//   session_notes, attendance_sheets, cancelled_classes       (schedule data)
//
// All operations are scoped to the authenticated coach's own Coach record
// for the given gym — a coach can only read/write their own data.

const ALLOWED_FIELDS = [
  'client_notes', 'client_tags', 'client_goals', 'client_health',
  'session_notes', 'attendance_sheets', 'cancelled_classes',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, gymId, field, data } = await req.json();

    if (!gymId || typeof gymId !== 'string') {
      return Response.json({ error: 'gymId required' }, { status: 400 });
    }

    // Resolve the coach record for this user+gym
    const coaches = await base44.asServiceRole.entities.Coach.filter({
      gym_id:     gymId,
      user_email: user.email,
    });

    if (!coaches.length) {
      return Response.json({ error: 'Coach record not found for this gym' }, { status: 404 });
    }

    const coach = coaches[0];

    if (action === 'read') {
      return Response.json({
        coachId:          coach.id,
        client_notes:     coach.client_notes     || {},
        client_tags:      coach.client_tags      || {},
        client_goals:     coach.client_goals     || {},
        client_health:    coach.client_health    || {},
        session_notes:    coach.session_notes    || {},
        attendance_sheets: coach.attendance_sheets || {},
        cancelled_classes: coach.cancelled_classes || [],
      });
    }

    if (action === 'write') {
      if (!field || !ALLOWED_FIELDS.includes(field)) {
        return Response.json({ error: 'Invalid field' }, { status: 400 });
      }
      if (data === undefined || data === null) {
        return Response.json({ error: 'data required' }, { status: 400 });
      }

      await base44.asServiceRole.entities.Coach.update(coach.id, { [field]: data });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('coachData error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});
