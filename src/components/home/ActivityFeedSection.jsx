import React, { useEffect, useRef, useState, useCallback } from 'react';
import PostCard from '../feed/PostCard';
import { createPageUrl } from '../../utils';

// ─── localStorage helpers ────────────────────────────────────────────────────
const LS_KEY = 'feedSeenOrder';

function loadSeenOrder() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSeenOrder(order) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(order));
  } catch {}
}

// ─── Build the initial display order ─────────────────────────────────────────
// Posts the user has already scrolled past go to the back (in the order they
// were seen), unseen posts stay at the front sorted newest-first.
function buildOrderedPosts(posts, seenIds) {
  const seenSet = new Set(seenIds);
  const unseen = posts.filter(p => !seenSet.has(p.id));
  const seen   = seenIds
    .map(id => posts.find(p => p.id === id))
    .filter(Boolean);
  return [...unseen, ...seen];
}

// ─── Component ────────────────────────────────────────────────────────────────
function ActivityFeedSection({
  friends,
  socialFeedPosts,
  visiblePostCount,
  feedBottomRef,
  isLoadingMorePosts,
  currentUser,
  queryClient,
}) {
  if (friends.length === 0) return null;

  // orderedPosts is the live display list
  const [orderedPosts, setOrderedPosts] = useState(() => {
    const seenIds = loadSeenOrder();
    return buildOrderedPosts(socialFeedPosts, seenIds);
  });

  // Rebuild when the raw post list changes (new data from server, etc.)
  // but preserve seen ordering.
  useEffect(() => {
    const seenIds = loadSeenOrder();
    setOrderedPosts(buildOrderedPosts(socialFeedPosts, seenIds));
  }, [socialFeedPosts]);

  // Track which post ids are currently observed
  const observersRef = useRef({});   // postId → IntersectionObserver
  const movedRef    = useRef(new Set()); // ids already moved this session (debounce)

  const markSeen = useCallback((postId) => {
    if (movedRef.current.has(postId)) return;
    movedRef.current.add(postId);

    // Update localStorage seen order
    const seenIds = loadSeenOrder();
    const updated = seenIds.filter(id => id !== postId);
    updated.push(postId); // move/add to end
    saveSeenOrder(updated);

    // Move post to back of display list
    setOrderedPosts(prev => {
      const idx = prev.findIndex(p => p.id === postId);
      if (idx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.push(moved);
      return next;
    });
  }, []);

  // Attach / detach an IntersectionObserver for each rendered post card.
  // We detect "scrolled past" by checking that the bottom of the card is
  // above the top of the viewport (rootMargin pushes the top boundary down
  // so we only fire once the card is fully gone).
  const attachObserver = useCallback((el, postId) => {
    if (!el || observersRef.current[postId]) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // Card has left the viewport upwards
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

  // Cleanup all observers on unmount
  useEffect(() => {
    return () => {
      Object.values(observersRef.current).forEach(obs => obs.disconnect());
      observersRef.current = {};
    };
  }, []);

  const visiblePosts = orderedPosts.slice(0, visiblePostCount);

  if (orderedPosts.length === 0) return null;

  return (
    <div className="space-y-3 mt-12">
      <div className="space-y-3">
        {visiblePosts.map(post => (
          <div
            key={post.id}
            ref={el => attachObserver(el, post.id)}
          >
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

      {/* Infinite scroll sentinel */}
      <div ref={feedBottomRef} className="flex justify-center py-3">
        {isLoadingMorePosts && (
          <div style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '2.5px solid rgba(148,163,184,0.2)',
            borderTop: '2.5px solid #60a5fa',
            animation: 'spin 0.7s linear infinite',
          }} />
        )}
      </div>
    </div>
  );
}

export default React.memo(ActivityFeedSection);