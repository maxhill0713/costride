import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const appId = Deno.env.get('ONESIGNAL_APP_ID');
    const restKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!appId || !restKey) {
      return Response.json({ error: 'OneSignal credentials not configured' }, { status: 500 });
    }

    // Send notification via OneSignal REST API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${restKey}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        app_id: appId,
        filters: [
          { field: 'email', value: email }
        ],
        headings: { en: '💪 CoStride' },
        contents: { en: 'You\'ve been sent a test notification!' },
        big_picture: 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg',
        chrome_icon: 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal error:', result);
      return Response.json({ error: result }, { status: response.status });
    }

    console.log('Push notification sent successfully:', result);
    return Response.json({
      success: true,
      message: 'Push notification sent',
      notificationId: result.body?.notification_id,
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});