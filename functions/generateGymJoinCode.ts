import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      return Response.json({ 
        error: 'Invalid JSON payload',
        message: 'Request body must be valid JSON with gym_id parameter'
      }, { status: 400 });
    }

    // Handle both direct calls and entity automation events
    let gym_id = payload.gym_id || payload.event?.entity_id || payload.data?.id;

    // If this is an automation with event type 'create', extract the ID
    if (!gym_id && payload.event?.type === 'create') {
      gym_id = payload.event.entity_id;
    }

    // Check if payload is empty
    if (!payload || Object.keys(payload).length === 0) {
      return Response.json({ 
        error: 'Empty payload',
        message: 'Function requires gym_id parameter. Example: {"gym_id": "your-gym-id"}'
      }, { status: 400 });
    }

    if (!gym_id) {
      console.error('No gym_id found in payload:', JSON.stringify(payload, null, 2));
      return Response.json({ 
        error: 'gym_id is required',
        message: 'Please provide gym_id in the request body',
        example: '{"gym_id": "your-gym-id"}',
        received: {
          payload_type: payload.event?.type,
          entity_name: payload.event?.entity_name,
          payload_keys: Object.keys(payload)
        }
      }, { status: 400 });
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