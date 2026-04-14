import React, { useState, useRef } from 'react';

export default function ExplorePanel({ recentlyViewedGyms, nearbyGyms, GymCardInner }) {
  const [activePanel, setActivePanel] = useState('recent');
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setActivePanel('nearby');
      else setActivePanel('recent');
    }
    touchStartX.current = null;
  };

  return (
    <div className="mb-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header row */}
      <div className="flex items-center justify-center gap-10 mb-3">
        <button
          onClick={() => setActivePanel('recent')}
          className="text-xs font-bold uppercase tracking-widest transition-colors duration-200"
          style={{ color: activePanel === 'recent' ? '#94a3b8' : '#475569' }}
        >
          Recently Viewed
        </button>
        <button
          onClick={() => setActivePanel('nearby')}
          className="text-xs font-bold uppercase tracking-widest transition-colors duration-200"
          style={{ color: activePanel === 'nearby' ? '#94a3b8' : '#334155' }}
        >
          Popular Nearby
        </button>
      </div>



      {/* Recently Viewed */}
      {activePanel === 'recent' && (
        recentlyViewedGyms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentlyViewedGyms.map(gym => (
              <div key={gym.id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <GymCardInner gym={gym} isMember={false} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 text-sm py-6">No recently viewed gyms.</p>
        )
      )}

      {/* Popular Nearby */}
      {activePanel === 'nearby' && (
        nearbyGyms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nearbyGyms.map(gym => (
              <div key={gym.id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <GymCardInner gym={gym} isMember={false} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 text-sm py-6">
            There are currently no other CoStride gyms nearby.
          </p>
        )
      )}
    </div>
  );
}