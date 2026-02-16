import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content, image_url, video_url, exercise, weight, gym_id } = body;

    const postData = {
      member_id: user.id,
      member_name: user.full_name,
      member_avatar: user.avatar_url,
      content,
      image_url,
      video_url,
      exercise,
      weight,
      gym_id,
      likes: 0,
      comments: [],
      reactions: {}
    };

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/posts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(postData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save post');
    }

    const data = await response.json();
    return Response.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    console.error('Save post error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});