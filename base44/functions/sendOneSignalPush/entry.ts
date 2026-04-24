// Sends real push notifications via OneSignal REST API.
// Can target by OneSignal external_id (= base44 user ID) or a list of them.

Deno.serve(async (req) => {
  try {
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('OneSignal credentials not configured');
      return Response.json({ error: 'OneSignal not configured' }, { status: 500 });
    }

    const { userIds, title, body, data } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ error: 'userIds array is required' }, { status: 400 });
    }
    if (!title || !body) {
      return Response.json({ error: 'title and body are required' }, { status: 400 });
    }

    // OneSignal allows up to 2000 include_aliases per request
    const BATCH_SIZE = 2000;
    const batches = [];
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      batches.push(userIds.slice(i, i + BATCH_SIZE));
    }

    let totalRecipients = 0;
    let totalErrors = 0;

    for (const batch of batches) {
      const payload = {
        app_id: ONESIGNAL_APP_ID,
        // Target users by their external_id (we set this = base44 user ID on login)
        include_aliases: {
          external_id: batch,
        },
        target_channel: 'push',
        headings: { en: title },
        contents: { en: body },
        ...(data ? { data } : {}),
      };

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('OneSignal API error:', JSON.stringify(result));
        totalErrors += batch.length;
      } else {
        console.log(`OneSignal batch sent. Recipients: ${result.recipients}, errors: ${result.errors || 0}`);
        totalRecipients += result.recipients || 0;
        if (result.errors) totalErrors += result.errors;
      }
    }

    return Response.json({ success: true, recipients: totalRecipients, errors: totalErrors });
  } catch (error) {
    console.error('sendOneSignalPush error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});