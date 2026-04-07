import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped to 0.8.21
// 2. Content length cap + XSS strip (image/video URLs validated)
// 3. Raw error.message no longer leaked to client

function sanitise(str, maxLen = 2000) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

function isValidUrl(url) {
  if (!url) return true; // optional
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, image_url, video_url, allow_gym_repost, share_with_community, workout_name } = await req.json();

    const safeContent = sanitise(content, 2000);
    if (!safeContent) {
      return Response.json({ error: 'Content is required' }, { status: 400 });
    }
    if (safeContent.length < 3) {
      return Response.json({ error: 'Post content too short (minimum 3 characters)' }, { status: 400 });
    }

    // Fraud detection: check rapid posting (max 10 posts per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentPosts = await base44.entities.Post.filter({ member_id: user.id, created_date: { $gte: oneHourAgo } });
    if (recentPosts.length >= 10) {
      console.warn(`RATE_LIMIT: User ${user.id} posted ${recentPosts.length} times in the last hour`);
      return Response.json({ error: 'Posting too frequently. Please wait before posting again.' }, { status: 429 });
    }

    if (image_url && !isValidUrl(image_url)) {
      return Response.json({ error: 'Invalid image URL (must be HTTPS)' }, { status: 400 });
    }
    if (video_url && !isValidUrl(video_url)) {
      return Response.json({ error: 'Invalid video URL (must be HTTPS)' }, { status: 400 });
    }

    console.log(JSON.stringify({ event: 'AUDIT', action: 'post_created', user_id: user.id, user_email: user.email, resource_type: 'post', status: 'success', timestamp: new Date().toISOString() }));

    const post = await base44.entities.Post.create({
      member_id:         user.id,
      member_name:       user.full_name,
      member_avatar:     user.avatar_url || null,
      content:           safeContent,
      image_url:         image_url || null,
      video_url:         video_url || null,
      likes:             0,
      comments:          [],
      reactions:         {},
      allow_gym_repost:  allow_gym_repost === true,
    });

    // Track "Witness My Gains" challenge progress — sharing a workout post
    const isWorkoutShare = !!(workout_name || share_with_community || image_url || video_url);
    if (isWorkoutShare) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prevProgress = user.monthly_challenge_progress || {};
      const isNewMonth = prevProgress.month !== currentMonth;
      const currentCount = isNewMonth ? 0 : (prevProgress.witness_my_gains || 0);
      if (currentCount < 4) {
        await base44.auth.updateMe({
          monthly_challenge_progress: {
            ...prevProgress,
            month: currentMonth,
            witness_my_gains: currentCount + 1,
          },
        });
      }
    }

    return Response.json({ post });
  } catch (error) {
    console.error('Error creating post:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});