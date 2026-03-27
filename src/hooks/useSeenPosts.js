import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'seenPostsTracker';
const EXPIRY_DAYS = 3;

export function useSeenPosts() {
  const [seenPosts, setSeenPosts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return {};
      
      const parsed = JSON.parse(stored);
      const now = Date.now();
      
      // Clean expired posts (older than 3 days)
      Object.keys(parsed).forEach(postId => {
        const firstSeen = parsed[postId].first_seen_date;
        if (now - firstSeen > EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
          delete parsed[postId];
        }
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    } catch {
      return {};
    }
  });

  const postElementsRef = useRef(new Map());

  // Track when posts scroll out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const postId = entry.target.dataset.postId;
          if (!postId) return;

          if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
            // Post has scrolled completely out of view above
            markPostAsSeen(postId);
          }
        });
      },
      { threshold: 0 }
    );

    return () => observer.disconnect();
  }, []);

  const markPostAsSeen = (postId) => {
    setSeenPosts((prev) => {
      const updated = { ...prev };
      const now = Date.now();

      if (updated[postId]) {
        // Already seen, update last_seen_date
        updated[postId].last_seen_date = now;
      } else {
        // First time seeing this post
        updated[postId] = {
          first_seen_date: now,
          last_seen_date: now,
        };
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const registerPostElement = (postId, element) => {
    if (element) {
      postElementsRef.current.set(postId, element);
    }
  };

  const isSeen = (postId) => !!seenPosts[postId];

  return { seenPosts, markPostAsSeen, registerPostElement, isSeen };
}