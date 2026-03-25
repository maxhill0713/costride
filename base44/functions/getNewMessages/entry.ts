import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Incremental message fetch — returns only messages NEWER than `since` for a specific
// conversation. Called every 5 s by the chat window instead of reloading all 100 messages.
// At zero new messages this is a tiny indexed range-scan; at 1–3 new messages it returns
// a handful of rows. Replaces the 15 s full-conversation poll.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { partnerId, since } = await req.json();

    if (!partnerId || typeof partnerId !== 'string') {
      return Response.json({ error: 'partnerId required' }, { status: 400 });
    }
    if (!since || typeof since !== 'string') {
      return Response.json({ error: 'since (ISO timestamp) required' }, { status: 400 });
    }

    // Validate `since` is a plausible ISO date — prevents injection via the filter value.
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return Response.json({ error: 'since must be a valid ISO timestamp' }, { status: 400 });
    }
    // Don't accept timestamps more than 7 days old — full reload handles that.
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const effectiveSince = sinceDate < sevenDaysAgo ? sevenDaysAgo.toISOString() : since;

    // Two directional queries — base44 $or with nested date filters is unreliable.
    // Both are tiny indexed range-scans once a text index exists on created_date.
    const [sent, received] = await Promise.all([
      base44.entities.Message.filter(
        { sender_id: user.id, receiver_id: partnerId, created_date: { $gt: effectiveSince } },
        '-created_date',
        50
      ),
      base44.entities.Message.filter(
        { sender_id: partnerId, receiver_id: user.id, created_date: { $gt: effectiveSince } },
        '-created_date',
        50
      ),
    ]);

    const messages = [...sent, ...received]
      .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
      .slice(0, 50);

    return Response.json({ messages });
  } catch (error) {
    console.error('getNewMessages error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});
