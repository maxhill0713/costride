import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY')
    );

    const body = await req.json();
    const { 
      content, 
      image_url, 
      video_url, 
      post_type = 'normal', 
      exercise, 
      weight,
      gym_id 
    } = body;

    // Save to Supabase posts table
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        member_name: user.full_name,
        member_avatar: user.avatar_url,
        content,
        image_url,
        video_url,
        post_type,
        exercise,
        weight,
        gym_id
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Save post error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});