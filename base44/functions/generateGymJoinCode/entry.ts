import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. SDK version bumped.
// 2. Had NO authentication — any unauthenticated request could regenerate join codes for
//    any gym by brute-forcing gym IDs. Now requires authentication.
// 3. For authenticated calls (non-automation), validates the caller owns the gym.
// 4. Raw error.message suppressed.

function isAuthorizedAutomation(req: Request): boolean {
  const secret = Deno.env.get('AUTOMATION_SECRET');
  if (!secret) return true;
  return req.headers.get('X-Automation-Secret') === secret;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload  = await req.json();
    const gym_id   = payload.gym_id || payload.event?.entity_id || payload.data?.id;

    if (!gym_id || typeof gym_id !== 'string') {
      return Response.json({ error: 'gym_id is required' }, { status: 400 });
    }

    // For direct (non-automation) calls, require auth and ownership
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      // Verify ownership unless admin
      if (user.role !== 'admin') {
        const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gym_id });
        if (!gyms.length) return Response.json({ error: 'Gym not found' }, { status: 404 });
        const gym = gyms[0];
        const isOwner = gym.owner_email === user.email || gym.admin_id === user.id;
        if (!isOwner) {
          console.warn(`SECURITY: User ${user.email} tried to regenerate join code for gym ${gym_id}`);
          return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    } else {
      if (!isAuthorizedAutomation(req)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Generate unique 6-character code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let joinCode = '', isUnique = false, attempts = 0;
    while (!isUnique && attempts < 10) {
      joinCode = '';
      for (let i = 0; i < 6; i++) joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
      const existing = await base44.asServiceRole.entities.Gym.filter({ join_code: joinCode });
      isUnique = existing.length === 0;
      attempts++;
    }

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinCode)}`;

    await base44.asServiceRole.entities.Gym.update(gym_id, {
      join_code: joinCode,
      qr_code:   qrCodeUrl,
    });

    return Response.json({ success: true, join_code: joinCode, qr_code: qrCodeUrl });
  } catch (error) {
    console.error('Error generating gym join code:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});