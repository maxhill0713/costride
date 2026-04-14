import React, { useEffect, useRef } from 'react';

export default function MyGymsContent({ userGyms, GymCardInner }) {
  const touchStartY = useRef(null);

  // Prevent rubber-band overscroll at the top of the page
  useEffect(() => {
    const preventOverscroll = (e) => {
      if (window.scrollY <= 0 && touchStartY.current !== null) {
        const currentY = e.touches[0].clientY;
        if (currentY > touchStartY.current) {
          e.preventDefault();
        }
      }
    };
    const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
    const onTouchEnd = () => { touchStartY.current = null; };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', preventOverscroll, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', preventOverscroll);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {userGyms.length === 0
        ? <div className="text-center py-12"><p className="text-slate-400">No gym memberships yet</p></div>
        : <div className="grid md:grid-cols-2 gap-4">
            {userGyms.map(gym => (
              <div key={gym.id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <GymCardInner gym={gym} isMember={true} />
              </div>
            ))}
          </div>
      }
    </div>
  );
}