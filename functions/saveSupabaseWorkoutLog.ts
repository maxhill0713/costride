import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const hexToUuid = (hex) => {
  if (!hex || typeof hex !== 'string') return hex;
  if (hex.includes('-') && hex.length === 36) return hex;
  if (hex.length === 24) {
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`.toLowerCase();
  }
  return hex;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_KEY')
    );

    const body = await req.json();

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        ...body,
        user_id: hexToUuid(user.id),
        created_by: user.email,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase workout log insert error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Save workout log error:', error);
    const errorMessage = error?.message || error?.toString?.() || 'Unknown error';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
});