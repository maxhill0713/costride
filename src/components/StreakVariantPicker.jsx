import React from 'react';
import { Flame, Check } from 'lucide-react';

export default function StreakVariantPicker({ isOpen, onClose, onSelect, selectedVariant }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-40 flex items-start justify-center pt-12 px-4"
      onClick={handleBackdropClick}
      style={{ background: 'rgba(0, 0, 0, 0.3)' }}
    >
      <div className="bg-slate-800/50 rounded-3xl p-8 max-w-4xl w-full border border-slate-700/30 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-8">
          {/* Default Flame */}
           <button
             onClick={() => onSelect('default')}
             className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${
               selectedVariant === 'default'
                 ? 'ring-2 ring-green-500'
                 : 'hover:opacity-80'
             }`}
           >
             <div className="relative w-10 h-10 flex items-center justify-center">
                 <Flame className="w-10 h-10 text-orange-500 fill-current" />
               </div>
            {selectedVariant === 'default' && (
              <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>

          {/* Sunglasses Flame */}
          <button
            onClick={() => onSelect('sunglasses')}
            className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${
              selectedVariant === 'sunglasses'
                ? 'ring-2 ring-green-500'
                : 'hover:opacity-80'
            }`}
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              <Flame className="w-10 h-10 text-orange-500 fill-current" />
              {/* Sunglasses positioned on flame */}
              <svg 
                className="absolute w-8 h-4 pointer-events-none"
                viewBox="0 0 64 32"
                style={{ top: '2px' }}
              >
                {/* Left lens */}
                <circle cx="16" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="2" className="text-black" />
                {/* Right lens */}
                <circle cx="48" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="2" className="text-black" />
                {/* Bridge */}
                <line x1="23" y1="16" x2="41" y2="16" stroke="currentColor" strokeWidth="2" className="text-black" />
              </svg>
            </div>
            {selectedVariant === 'sunglasses' && (
              <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>

          {/* Cowboy Hat Flame */}
          <button
            onClick={() => onSelect('cowboy')}
            className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${
              selectedVariant === 'cowboy'
                ? 'ring-2 ring-green-500'
                : 'hover:opacity-80'
            }`}
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              <Flame className="w-10 h-10 text-orange-500 fill-current" />
              {/* Cowboy hat positioned on top of flame */}
              <svg 
                className="absolute w-10 h-6 pointer-events-none"
                viewBox="0 0 64 48"
                style={{ top: '-8px' }}
              >
                {/* Hat crown */}
                <path 
                  d="M 16 36 L 12 20 Q 12 8 32 4 Q 52 8 52 20 L 48 36" 
                  fill="currentColor" 
                  className="text-amber-800"
                />
                {/* Hat brim */}
                <ellipse cx="32" cy="36" rx="28" ry="8" fill="currentColor" className="text-amber-700" />
                {/* Hat band detail */}
                <rect x="14" y="33" width="36" height="2" fill="currentColor" className="text-amber-900" />
              </svg>
            </div>
            {selectedVariant === 'cowboy' && (
              <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>

          {/* Empty spaces for future icons */}
           <div className="flex flex-col items-center gap-3 p-4" />
          <div className="flex flex-col items-center gap-3 p-4" />
          <div className="flex flex-col items-center gap-3 p-4" />
          <div className="flex flex-col items-center gap-3 p-4" />
          <div className="flex flex-col items-center gap-3 p-4" />
        </div>
      </div>
    </div>
  );
}