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
      <div className="bg-slate-800/90 rounded-3xl p-8 max-w-2xl w-full border border-slate-700/50 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-center gap-8">
          {/* Default Flame */}
          <button
            onClick={() => onSelect('default')}
            className={`flex flex-col items-center gap-4 p-6 rounded-2xl transition-all ${
              selectedVariant === 'default'
                ? 'ring-2 ring-green-500'
                : 'hover:opacity-80'
            }`}
          >
            <Flame className="w-20 h-20 text-orange-500 fill-current" />
            {selectedVariant === 'default' && (
              <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
          </button>

          {/* Sunglasses Flame */}
          <button
            onClick={() => onSelect('sunglasses')}
            className={`flex flex-col items-center gap-4 p-6 rounded-2xl transition-all ${
              selectedVariant === 'sunglasses'
                ? 'ring-2 ring-green-500'
                : 'hover:opacity-80'
            }`}
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              <Flame className="w-20 h-20 text-orange-500 fill-current" />
              {/* Sunglasses positioned on flame */}
              <svg 
                className="absolute w-16 h-8 pointer-events-none"
                viewBox="0 0 64 32"
                style={{ top: '4px' }}
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
              <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}