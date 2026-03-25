import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. "comment" action called req.json() a second time — body already consumed, always null text.
// 2. No XSS sanitisation on comment text or reaction type.
// 3. Raw error.message leaked to client.
// 4. Like/unlike not idempotent — anyone could spam likes to inflate counts.
//    FIXED: likes are now tracked as a Set keyed by user_id (liked_by array).
//    A user can only add one like; unlike removes them. Count derived from array length.

const ALLOWED_REACTIONS = ['fire', 'strong', 'clap', 'heart', 'wow'];
const ALLOWED_ACTIONS   = ['like', 'unlike', 'react', 'comment'];

function sanitise(str, maxLen = 1000) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body ONCE
    const body = await req.json();
    const { postId, action, reactionType, text } = body;

    if (!postId || !action) {
      return Response.json({ error: 'Post ID and action required' }, { status: 400 });
    }
    if (!ALLOWED_ACTIONS.includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const posts = await base44.asServiceRole.entities.Post.filter({ id: postId });
    if (posts.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }
    const post = posts[0];

    // Check post is not hidden
    if (post.is_hidden) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    let updated;

    if (action === 'like') {
      // SECURITY: Track per-user likes to prevent like-count inflation.
      // liked_by is an array of user IDs. likes is kept in sync as its length.
      const likedBy = Array.isArray(post.liked_by) ? [...post.liked_by] : [];
      if (likedBy.includes(user.id)) {
        // Already liked — idempotent, return current post without write
        return Response.json({ post });
      }
      likedBy.push(user.id);
      updated = await base44.asServiceRole.entities.Post.update(postId, {
        liked_by: likedBy,
        likes:    likedBy.length,
      });
    } else if (action === 'unlike') {
      const likedBy = (Array.isArray(post.liked_by) ? post.liked_by : []).filter((id: string) => id !== user.id);
      updated = await base44.asServiceRole.entities.Post.update(postId, {
        liked_by: likedBy,
        likes:    likedBy.length,
      });
    } else if (action === 'react') {
      if (!reactionType || !ALLOWED_REACTIONS.includes(reactionType)) {
        return Response.json({ error: 'Invalid reaction type' }, { status: 400 });
      }
      const reactions = { ...(post.reactions || {}) };
      reactions[user.id] = reactionType;
      updated = await base44.asServiceRole.entities.Post.update(postId, { reactions });
    } else if (action === 'comment') {
      const safeText = sanitise(text, 500);
      if (!safeText) {
        return Response.json({ error: 'Comment text required' }, { status: 400 });
      }
      const comments = [...(post.comments || [])];
      // Cap comments to prevent unbounded array growth
      if (comments.length >= 500) {
        return Response.json({ error: 'Comment limit reached' }, { status: 400 });
      }
      comments.push({
        user:      user.full_name,
        user_id:   user.id,
        text:      safeText,
        timestamp: new Date().toISOString(),
      });
      updated = await base44.asServiceRole.entities.Post.update(postId, { comments });
    }

    return Response.json({ post: updated });
  } catch (error) {
    console.error('Error post interaction:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});