import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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
  const lower = content.toLowerCase();
  const urlCount = (content.match(/https?:\/\/|www\./gi) || []).length;
  if (urlCount > 1) return true;
  
  return SPAM_PATTERNS.some(pattern => pattern.test(content));
}

function isInappropriate(content = '') {
  return INAPPROPRIATE_PATTERNS.some(pattern => pattern.test(content));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allPosts = await base44.asServiceRole.entities.Post.list();
    let hiddenCount = 0;
    const hiddenPosts = [];

    for (const post of allPosts) {
      if (post.is_hidden) continue;

      const content = post.content || '';
      const reason = isBlatantSpam(content) ? 'spam' : isInappropriate(content) ? 'inappropriate' : null;

      if (reason) {
        await base44.asServiceRole.entities.Post.update(post.id, { is_hidden: true });
        hiddenCount++;
        hiddenPosts.push({ id: post.id, reason, member_id: post.member_id });
      }
    }

    return Response.json({
      success: true,
      total_posts_scanned: allPosts.length,
      posts_hidden: hiddenCount,
      hidden_posts: hiddenPosts,
    });
  } catch (error) {
    console.error('Post scan error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});