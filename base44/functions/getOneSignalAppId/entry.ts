import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const appId = Deno.env.get('ONESIGNAL_APP_ID');
    if (!appId) {
      return Response.json({ error: 'ONESIGNAL_APP_ID not configured' }, { status: 500 });
    }
    return Response.json({ appId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});