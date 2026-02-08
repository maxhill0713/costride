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
      <div className="bg-slate-800/90 rounded-3xl p-8 max-w-4xl w-full border border-slate-700/50 shadow-2xl backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-8">
          {/* Default Flame */}
          <button
            onClick={() => onSelect('default')}
            className={`flex flex-col items-center gap-3 p-6 rounded-lg transition-all ${
              selectedVariant === 'default'
                ? 'border-3 border-green-500'
                : 'hover:opacity-80'
            }`}
          >
            <Flame className="w-12 h-12 text-orange-500 fill-current" />
          </button>

          {/* Sunglasses Flame */}
          <button
            onClick={() => onSelect('sunglasses')}
            className={`flex flex-col items-center gap-3 p-6 rounded-lg transition-all ${
              selectedVariant === 'sunglasses'
                ? 'border-3 border-green-500'
                : 'hover:opacity-80'
            }`}
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              <Flame className="w-12 h-12 text-orange-500 fill-current" />
              {/* Sunglasses positioned on flame */}
              <svg 
                className="absolute w-9.6 h-4.8 pointer-events-none"
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
          </button>

          {/* Empty spaces for future icons */}
          <div className="flex flex-col items-center gap-3 p-4" />
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