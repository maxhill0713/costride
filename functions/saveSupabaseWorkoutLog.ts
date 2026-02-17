import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const hexToUuid = (hex) => {
  if (!hex || typeof hex !== 'string') return hex;
  if (hex.includes('-') && hex.length === 36) return hex;
  
  // Remove any existing dashes
  const cleanHex = hex.replace(/-/g, '');
  
  // Pad to 32 characters if shorter
  const paddedHex = cleanHex.padEnd(32, '0');
  
  // Format as UUID: 8-4-4-4-12
  return `${paddedHex.slice(0, 8)}-${paddedHex.slice(8, 12)}-${paddedHex.slice(12, 16)}-${paddedHex.slice(16, 20)}-${paddedHex.slice(20, 32)}`.toLowerCase();
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
        user_id: hexToUuid(user.id),
        workout_name: body.workout_name,
        day_of_week: body.day_of_week,
        exercises: body.exercises,
        notes: body.notes,
        workout_date: body.completed_date || new Date().toISOString().split('T')[0],
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