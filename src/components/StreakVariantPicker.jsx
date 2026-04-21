import React from 'react';
import { Check } from 'lucide-react';

const STREAK_ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';
const SPARTAN_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/a72ee034d_spartan.png';
const BEACH_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/9766d8d41_BEACH.png';

export default function StreakVariantPicker({ isOpen, onClose, onSelect, selectedVariant, streakFreezes = 0, unlockedVariants = [] }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  // Build the list of available icons — always include default, then any unlocked ones.
  // Locked variants are simply omitted so there are no empty gaps.
  const availableIcons = [
    { id: 'default', src: STREAK_ICON_URL, alt: 'streak',  ring: 'ring-green-500', check: 'bg-green-500' },
    ...(unlockedVariants.includes('spartan') ? [{ id: 'spartan', src: SPARTAN_ICON_URL, alt: 'spartan', ring: 'ring-amber-500', check: 'bg-amber-500' }] : []),
    ...(unlockedVariants.includes('beach')   ? [{ id: 'beach',   src: BEACH_ICON_URL,   alt: 'beach',   ring: 'ring-blue-500',  check: 'bg-blue-500'  }] : []),
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

        {/* 4-column grid — icons pack left with no empty placeholder cells */}
        <div className="grid grid-cols-4 gap-2 mt-12">
          {availableIcons.map((icon) => (
            <button
              key={icon.id}
              onClick={() => onSelect(icon.id)}
              className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${
                selectedVariant === icon.id ? `ring-2 ${icon.ring}` : 'hover:opacity-80'
              }`}>
              <div className="w-full aspect-square flex items-center justify-center">
                <img
                  src={icon.src}
                  alt={icon.alt}
                  className="w-full h-full"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              {selectedVariant === icon.id && (
                <div className={`flex items-center justify-center w-5 h-5 ${icon.check} rounded-full`}>
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}