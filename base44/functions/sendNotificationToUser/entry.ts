import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { userId, heading, contents, custom_data = {} } = await req.json();

    if (!userId || !heading || !contents) {
      return Response.json({ error: 'Missing required fields: userId, heading, contents' }, { status: 400 });
    }

    const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    const appId = Deno.env.get('ONESIGNAL_APP_ID');

    if (!apiKey || !appId) {
      console.error('OneSignal credentials not configured');
      return Response.json({ error: 'OneSignal not configured' }, { status: 500 });
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        app_id: appId,
        include_external_user_ids: [userId],
        headings: { en: heading },
        contents: { en: contents },
        data: custom_data,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal API error:', result);
      return Response.json({ error: 'Failed to send notification', details: result }, { status: response.status });
    }

    console.log('Notification sent to user:', userId, 'ID:', result.id);
    return Response.json({ success: true, id: result.id });
  } catch (error) {
    console.error('sendNotificationToUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});