import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pollId, options, voters } = await req.json();

    if (!pollId || !options || !voters) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use service role to bypass RLS restrictions
    await base44.asServiceRole.entities.Poll.update(pollId, { options, voters });

    return Response.json({ success: true });
  } catch (error) {
    console.error('votePoll error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});