import React from 'react';
import { Check, Snowflake } from 'lucide-react';

const STREAK_ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';

export default function StreakVariantPicker({ isOpen, onClose, onSelect, selectedVariant, streakFreezes = 0 }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center pt-12 px-4"
      onClick={handleBackdropClick}
      style={{ background: 'rgba(0, 0, 0, 0.3)' }}>

      <div className="bg-slate-800/50 rounded-3xl p-6 max-w-sm w-full border border-slate-700/30 shadow-2xl backdrop-blur-xl relative">
        {/* Streak Freezes - top right */}
        <div className="absolute top-4 right-5 flex items-center gap-1.5">
          <Snowflake className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-bold text-sm">{streakFreezes}</span>
        </div>

        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-6 text-center">Choose Streak Icon</p>

        <div className="flex justify-center gap-8">
          {/* Default Icon */}
          <button
            onClick={() => onSelect('default')}
            className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${selectedVariant === 'default' ? 'ring-2 ring-green-500' : 'hover:opacity-80'}`}>
            <div className="w-20 h-20 flex items-center justify-center">
              <img src={STREAK_ICON_URL} alt="streak" className="w-20 h-20" style={{ objectFit: 'contain' }} />
            </div>
            {selectedVariant === 'default' &&
              <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                <Check className="w-4 h-4 text-white" />
              </div>
            }
          </button>

          {/* Sunglasses Icon */}
          <button
            onClick={() => onSelect('sunglasses')}
            className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${selectedVariant === 'sunglasses' ? 'ring-2 ring-green-500' : 'hover:opacity-80'}`}>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <img src={STREAK_ICON_URL} alt="streak" className="w-20 h-20" style={{ objectFit: 'contain' }} />
              <svg
                className="absolute w-16 h-8 pointer-events-none"
                viewBox="0 0 64 32"
                style={{ top: '4px' }}>
                <circle cx="16" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="2" className="text-black" />
                <circle cx="48" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="2" className="text-black" />
                <line x1="23" y1="16" x2="41" y2="16" stroke="currentColor" strokeWidth="2" className="text-black" />
              </svg>
            </div>
            {selectedVariant === 'sunglasses' &&
              <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                <Check className="w-4 h-4 text-white" />
              </div>
            }
          </button>
        </div>
      </div>
    </div>
  );
}