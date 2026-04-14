import React, { useState, useRef, useEffect } from 'react';

export default function ExplorePanel({ recentlyViewedGyms, nearbyGyms, GymCardInner }) {
  const [activePanel, setActivePanel] = useState('recent'); // 'recent' | 'nearby'
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const containerRef = useRef(null);

  // Prevent overscroll (rubber-band) above the top of the page
  useEffect(() => {
    const preventOverscroll = (e) => {
      if (window.scrollY <= 0 && e.touches[0].clientY > 0) {
        // If at the top and pulling down, prevent it
        const touch = e.touches[0];
        if (touch.clientY > (touchStartY.current || 0)) {
          e.preventDefault();
        }
      }
    };
    document.addEventListener('touchmove', preventOverscroll, { passive: false });
    return () => document.removeEventListener('touchmove', preventOverscroll);
  }, []);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = Math.abs((touchStartY.current || 0) - e.changedTouches[0].clientY);
    // Only treat as horizontal swipe if more horizontal than vertical
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY) {
      if (diffX > 0) setActivePanel('nearby');  // swipe left → nearby
      else setActivePanel('recent');             // swipe right → recent
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const isNearby = activePanel === 'nearby';

  const renderGrid = (gyms, emptyMsg) =>
    gyms.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gyms.map(gym => (
          <div key={gym.id} className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <GymCardInner gym={gym} isMember={false} />
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-slate-500 text-sm py-6">{emptyMsg}</p>
    );

  return (
    <div className="mb-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header row */}
      <div className="flex items-center justify-center gap-10 mb-3">
        <button
          onClick={() => setActivePanel('recent')}
          className="text-xs font-bold uppercase tracking-widest transition-colors duration-200"
          style={{ color: !isNearby ? '#94a3b8' : '#475569' }}
        >
          Recently Viewed
        </button>
        <button
          onClick={() => setActivePanel('nearby')}
          className="text-xs font-bold uppercase tracking-widest transition-colors duration-200"
          style={{ color: isNearby ? '#94a3b8' : '#334155' }}
        >
          Popular Nearby
        </button>
      </div>

      {/* Sliding panels — overflow hidden wrapper */}
      <div ref={containerRef} style={{ overflow: 'hidden', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            width: '200%',
            transform: isNearby ? 'translateX(-50%)' : 'translateX(0%)',
            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Panel 1 — Recently Viewed */}
          <div style={{ width: '50%', flexShrink: 0, paddingRight: 8 }}>
            {renderGrid(recentlyViewedGyms, 'No recently viewed gyms.')}
          </div>
          {/* Panel 2 — Popular Nearby */}
          <div style={{ width: '50%', flexShrink: 0, paddingLeft: 8 }}>
            {renderGrid(nearbyGyms, 'There are currently no other CoStride gyms nearby.')}
          </div>
        </div>
      </div>
    </div>
  );
}