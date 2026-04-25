import React from 'react';

const STREAK_ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';
const SPARTAN_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/a72ee034d_spartan.png';
const BEACH_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/9766d8d41_BEACH.png';
const MERMAID_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/024cf0fc0_mermaidpose1.png';
const PIRATE_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/a66aac6ab_pirate.png';

export default function StreakVariantPicker({ isOpen, onClose, onSelect, selectedVariant, streakFreezes = 0, unlockedVariants = [] }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const availableIcons = [
    { id: 'default', src: STREAK_ICON_URL, alt: 'streak',  ring: 'ring-green-500' },
    ...(unlockedVariants.includes('spartan')  ? [{ id: 'spartan',  src: SPARTAN_ICON_URL,  alt: 'spartan',  ring: 'ring-amber-500' }] : []),
    ...(unlockedVariants.includes('beach')    ? [{ id: 'beach',    src: BEACH_ICON_URL,    alt: 'beach',    ring: 'ring-blue-500'  }] : []),
    ...(unlockedVariants.includes('mermaid')  ? [{ id: 'mermaid',  src: MERMAID_ICON_URL,  alt: 'mermaid',  ring: 'ring-teal-500'   }] : []),
    ...(unlockedVariants.includes('pirate')   ? [{ id: 'pirate',   src: PIRATE_ICON_URL,   alt: 'pirate',   ring: 'ring-orange-500' }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center pt-12 px-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={handleBackdropClick}>

      <div className="bg-slate-800/50 rounded-3xl p-6 max-w-sm w-full border border-slate-700/30 shadow-2xl backdrop-blur-xl relative z-[9999]">
        {/* Top row: description left, freezes right */}
        <div className="flex items-start justify-between gap-0.5 mb-4">
          <p className="text-slate-300 text-[11.5px] leading-relaxed flex-1" style={{ fontWeight: 500 }}>
            Workout once a week to maintain your streak . If you do miss a week don't worry, a streak freeze will save you, so look after them!
          </p>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <img
              src="https://media.base44.com/images/public/694b637358644e1c22c8ec6b/4b125b24a_ICEP1_V2.png"
              alt="freeze"
              className="w-[50px] h-[50px] object-contain"
            />
            <span className="text-white font-bold text-[1.665rem] leading-none">{streakFreezes}</span>
          </div>
        </div>

        {/* 4-column grid */}
        <div className="grid grid-cols-4 gap-2 pb-8">
          {availableIcons.map((icon) => (
            <button
              key={icon.id}
              onClick={() => onSelect(icon.id)}
              className={`relative flex items-center justify-center p-2 rounded-2xl transition-all ${
                selectedVariant === icon.id ? `ring-2 ${icon.ring}` : 'hover:opacity-80'
              }`}
              style={{ aspectRatio: '1 / 1.32' }}>
              <img
                src={icon.src}
                alt={icon.alt}
                style={{
                  position: 'absolute',
                  width: '142%',
                  height: '142%',
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