import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { external_id, title, message } = await req.json();

    if (!external_id || !title || !message) {
      return Response.json(
        { error: 'Missing required fields: external_id, title, message' },
        { status: 400 }
      );
    }

    const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    const appId = Deno.env.get('ONESIGNAL_APP_ID');

    if (!apiKey || !appId) {
      console.error('OneSignal credentials not configured');
      return Response.json(
        { error: 'OneSignal credentials not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        include_external_user_ids: [external_id],
        headings: { en: title },
        contents: { en: message },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal API error:', result);
      return Response.json(
        { error: 'Failed to send notification', details: result },
        { status: response.status }
      );
    }

    console.log('Notification sent successfully', { external_id, notification_id: result.id });
    return Response.json({ success: true, notification_id: result.id });
  } catch (error) {
    console.error('SendOneSignalNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});