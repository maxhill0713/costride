import React from 'react';
import { Check } from 'lucide-react';

const STREAK_ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';

export default function StreakVariantPicker({ isOpen, onClose, onSelect, selectedVariant, streakFreezes = 0 }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center pt-12 px-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={handleBackdropClick}>

      <div className="bg-slate-800/50 rounded-3xl p-6 max-w-sm w-full border border-slate-700/30 shadow-2xl backdrop-blur-xl relative z-[9999]">
        {/* Streak Freezes - top right */}
        <div className="absolute top-2 right-4 flex items-center gap-1.5">
          <img src="https://media.base44.com/images/public/694b637358644e1c22c8ec6b/4b125b24a_ICEP1_V2.png" alt="freeze" className="w-[50px] h-[50px] object-contain" />
          <span className="text-white font-bold text-[1.665rem] leading-none -ml-0.5">{streakFreezes}</span>
        </div>

        {/* 4-column grid — only 1 real icon, 3 empty placeholders */}
        <div className="grid grid-cols-4 gap-2 mt-12">
          {/* Default Icon */}
          <button
            onClick={() => onSelect('default')}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${selectedVariant === 'default' ? 'ring-2 ring-green-500' : 'hover:opacity-80'}`}>
            <div className="w-[106px] h-[106px] flex items-center justify-center">
              <img src={STREAK_ICON_URL} alt="streak" className="w-[106px] h-[106px]" style={{ objectFit: 'contain' }} />
            </div>
            {selectedVariant === 'default' && (
              <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>

          {/* 3 empty placeholder slots */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-14 h-14" />
          ))}
        </div>
      </div>
    </div>
  );
}