Deno.serve(async (req) => {
  // Only handle GET requests to this endpoint
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const content = "importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');";

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
    },
  });
});