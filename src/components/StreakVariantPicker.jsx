import React from 'react';

const STREAK_ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';
const SPARTAN_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/a72ee034d_spartan.png';
const BEACH_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/9766d8d41_BEACH.png';

export default function StreakVariantPicker({ isOpen, onClose, onSelect, selectedVariant, streakFreezes = 0, unlockedVariants = [] }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const availableIcons = [
    { id: 'default', src: STREAK_ICON_URL, alt: 'streak',  ring: 'ring-green-500' },
    ...(unlockedVariants.includes('spartan') ? [{ id: 'spartan', src: SPARTAN_ICON_URL, alt: 'spartan', ring: 'ring-amber-500' }] : []),
    ...(unlockedVariants.includes('beach')   ? [{ id: 'beach',   src: BEACH_ICON_URL,   alt: 'beach',   ring: 'ring-blue-500'  }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center pt-12 px-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={handleBackdropClick}>

      <div className="bg-slate-800/50 rounded-3xl p-6 max-w-sm w-full border border-slate-700/30 shadow-2xl backdrop-blur-xl relative z-[9999]">
        {/* Streak Freezes — top right */}
        <div className="absolute top-2 right-4 flex items-center gap-0.5">
          <img
            src="https://media.base44.com/images/public/694b637358644e1c22c8ec6b/4b125b24a_ICEP1_V2.png"
            alt="freeze"
            className="w-[50px] h-[50px] object-contain"
          />
          <span className="text-white font-bold text-[1.665rem] leading-none">{streakFreezes}</span>
        </div>

        {/* 4-column grid — pb adds space at bottom so overflowing icons aren't clipped */}
        <div className="grid grid-cols-4 gap-2 mt-12 pb-8">
          {availableIcons.map((icon) => (
            <button
              key={icon.id}
              onClick={() => onSelect(icon.id)}
              className={`relative flex items-center justify-center p-2 rounded-2xl transition-all aspect-square ${
                selectedVariant === icon.id ? `ring-2 ${icon.ring}` : 'hover:opacity-80'
              }`}>
              <img
                src={icon.src}
                alt={icon.alt}
                style={{
                  position: 'absolute',
                  width: '135%',
                  height: '135%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}