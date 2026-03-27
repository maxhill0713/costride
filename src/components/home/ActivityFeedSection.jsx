import React, { useEffect, useRef, useState, useCallback } from 'react';
import PostCard from '../feed/PostCard';

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEY = 'feedSeenOrder_v2';

function loadSeenIds() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(seenSet) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...seenSet]));
  } catch {}
}

// ─── Sort posts newest-first ──────────────────────────────────────────────────
function sortByNewest(posts) {
  return [...posts].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date)
  );
}

// ─── Build ordered list: unseen (newest-first) then seen (newest-first) ───────
function buildOrderedPosts(posts, seenIds) {
  const sorted = sortByNewest(posts);
  const unseen = sorted.filter(p => !seenIds.has(p.id));
  const seen   = sorted.filter(p =>  seenIds.has(p.id));
  return [...unseen, ...seen];
}

// ─── Component ────────────────────────────────────────────────────────────────
function ActivityFeedSection({ friends, socialFeedPosts, currentUser, queryClient }) {
  if (friends.length === 0) return null;

  // postMap for fast id → post lookup
  const postMapRef = useRef({});
  socialFeedPosts.forEach(p => { postMapRef.current[p.id] = p; });

  const seenIdsRef   = useRef(loadSeenIds());
  const movedRef     = useRef(new Set());
  const observersRef = useRef({});

  // visibleIds is the single source of render truth.
  // We only ever APPEND to the end when a post is cycled — never reorder
  // what's already on screen — so scroll position never jumps.
  const [visibleIds, setVisibleIds] = useState(() =>
    buildOrderedPosts(socialFeedPosts, seenIdsRef.current).map(p => p.id)
  );

  // Rebuild when the server gives us fresh posts (pull-to-refresh / refetch).
  // Only prepend genuinely new posts; don't disturb the existing order.
  useEffect(() => {
    socialFeedPosts.forEach(p => { postMapRef.current[p.id] = p; });

    setVisibleIds(prev => {
      const prevSet = new Set(prev);
      const freshSorted = sortByNewest(socialFeedPosts);

      // Brand-new posts not yet in the list → prepend at top (newest first)
      const brandNew = freshSorted
        .filter(p => !prevSet.has(p.id))
        .map(p => p.id);

      // Posts that were in prev but have now disappeared from server → remove
      const serverIds = new Set(socialFeedPosts.map(p => p.id));
      const kept = prev.filter(id => serverIds.has(id));

      return [...brandNew, ...kept];
    });
  }, [socialFeedPosts]);

  // Called when a post fully scrolls above the viewport.
  // Moves it to the BOTTOM of visibleIds without touching anything above it.
  const markSeen = useCallback((postId) => {
    if (movedRef.current.has(postId)) return;
    movedRef.current.add(postId);

    seenIdsRef.current.add(postId);
    saveSeenIds(seenIdsRef.current);

    setVisibleIds(prev => {
      const without = prev.filter(id => id !== postId);
      return [...without, postId];
    });
  }, []);

  // Attach an IntersectionObserver per card.
  // Triggers when the card's bottom edge goes above the top of the viewport.
  const attachObserver = useCallback((el, postId) => {
    if (!el || observersRef.current[postId]) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting && entry.boundingClientRect.bottom < 0) {
            markSeen(postId);
            observer.disconnect();
            delete observersRef.current[postId];
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(el);
    observersRef.current[postId] = observer;
  }, [markSeen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(observersRef.current).forEach(obs => obs.disconnect());
      observersRef.current = {};
    };
  }, []);

  const postsToRender = visibleIds
    .map(id => postMapRef.current[id])
    .filter(Boolean);

  if (postsToRender.length === 0) return null;

  return (
    <div className="space-y-3 mt-12">
      {postsToRender.map(post => (
        <div key={post.id} ref={el => attachObserver(el, post.id)}>
          <PostCard
            post={post}
            fullWidth={true}
            currentUser={currentUser}
            isOwnProfile={post.member_id === currentUser?.id}
            onLike={() => {}}
            onComment={() => {}}
            onSave={() => {}}
            onDelete={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
          />
        </div>
      ))}
    </div>
  );
}

export default React.memo(ActivityFeedSection);