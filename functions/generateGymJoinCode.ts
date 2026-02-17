import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Handle both direct calls and entity automation events
    const gym_id = payload.gym_id || payload.event?.entity_id || payload.data?.id;

    if (!gym_id) {
      console.error('No gym_id found in payload:', payload);
      return Response.json({ error: 'gym_id is required' }, { status: 400 });
    }

    // Generate unique 6-character code
    const generateCode = async () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Check if code already exists
        const existing = await base44.asServiceRole.entities.Gym.filter({ join_code: code });
        isUnique = existing.length === 0;
        attempts++;
      }

      return code;
    };

    const joinCode = await generateCode();

    // Generate QR code URL using qr-server API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinCode)}`;

    // Update gym with join code and QR code
    await base44.asServiceRole.entities.Gym.update(gym_id, {
      join_code: joinCode,
      qr_code: qrCodeUrl
    });

    return Response.json({ 
      success: true, 
      join_code: joinCode,
      qr_code: qrCodeUrl
    });
  } catch (error) {
    console.error('Error generating gym join code:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});