import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [LOW]:
// 1. SDK version bumped.
// 2. Raw error.message suppressed.

const SPAM_PATTERNS = [
  /(?:click\s+here|buy\s+now|limited\s+time|act\s+now|urgent|hurry)/gi,
  /(?:bitcoin|crypto|nft|forex|trading|guaranteed\s+profit)/gi,
  /(?:viagra|cialis|pharmacy|weight\s+loss|miracle\s+cure)/gi,
  /(?:http|www)[^\s]+/gi,
];

const INAPPROPRIATE_PATTERNS = [];

function isBlatantSpam(content = '') {
  const urlCount = (content.match(/https?:\/\/|www\./gi) || []).length;
  if (urlCount > 1) return true;
  return SPAM_PATTERNS.some(pattern => { pattern.lastIndex = 0; return pattern.test(content); });
}

function isInappropriate(content = '') {
  return INAPPROPRIATE_PATTERNS.some(pattern => { pattern.lastIndex = 0; return pattern.test(content); });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    if (event?.type !== 'create') {
      return Response.json({ skipped: 'not a create event' });
    }

    const postId = data?.id || event?.entity_id;
    if (!postId || typeof postId !== 'string') {
      return Response.json({ error: 'invalid post' }, { status: 400 });
    }

    // SECURITY FIX: Previously used content from the request body — an attacker could
    // supply any post_id + spam content to hide any post. Now we fetch the authoritative
    // content from the database. The moderation runs on what's actually stored.
    const posts = await base44.asServiceRole.entities.Post.filter({ id: postId });
    if (!posts.length) {
      return Response.json({ skipped: 'post not found' });
    }
    const post = posts[0];

    // Don't re-moderate already-hidden posts
    if (post.is_hidden) {
      return Response.json({ skipped: 'already hidden', post_id: postId });
    }

    const content = post.content || '';

    if (isBlatantSpam(content)) {
      await base44.asServiceRole.entities.Post.update(postId, { is_hidden: true });
      console.log(JSON.stringify({ event: 'AUDIT', action: 'post_auto_hidden', resource_type: 'post', resource_id: postId, reason: isBlatantSpam(content) ? 'spam' : 'inappropriate', timestamp: new Date().toISOString() }));
      return Response.json({
        action:  'hidden',
        post_id: postId,
        reason:  'spam',
      });
    }

    return Response.json({ action: 'approved', post_id: postId });
  } catch (error) {
    console.error('Auto-moderation error:', error.message);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});