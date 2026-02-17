import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // TODO: Implement Supabase query to fetch challenge participants
    // For now, return empty array to prevent crashes
    return Response.json([]);
  } catch (error) {
    console.error('Error in getSupabaseChallengeParticipants:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});