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

const INAPPROPRIATE_PATTERNS = [
  /(?:hate|kill|die)[^a-z]|[^a-z](?:hate|kill|die)/gi,
  /(?:slur|offensive\s+term)/gi,
];

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

    const post = data;
    if (!post || !post.id) {
      return Response.json({ error: 'invalid post' }, { status: 400 });
    }

    const content = post.content || '';

    if (isBlatantSpam(content) || isInappropriate(content)) {
      await base44.asServiceRole.entities.Post.update(post.id, { is_hidden: true });
      return Response.json({
        action:  'hidden',
        post_id: post.id,
        reason:  isBlatantSpam(content) ? 'spam' : 'inappropriate',
      });
    }

    return Response.json({ action: 'approved', post_id: post.id });
  } catch (error) {
    console.error('Auto-moderation error:', error.message);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});