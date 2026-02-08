import React from 'react';
import { Flame, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function StreakVariantPicker({ isOpen, onClose, onSelect, selectedVariant }) {
  const variants = [
    { id: 'default', label: 'Classic' },
    { id: 'sunglasses', label: 'Cool' }
  ];

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 rounded-3xl p-8 max-w-sm w-full border border-slate-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">Choose Your Streak Icon</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => onSelect(variant.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                selectedVariant === variant.id
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              <span className="text-white font-medium">{variant.label}</span>
              <div className="flex items-center gap-3">
                <div className="relative">
                  {variant.id === 'default' ? (
                    <Flame className="w-10 h-10 text-orange-500 fill-current" />
                  ) : (
                    <div className="relative">
                      <Flame className="w-10 h-10 text-orange-500 fill-current" />
                      <div className="absolute -top-1 right-0 flex gap-0.5">
                        <div className="w-2 h-1.5 bg-black rounded-full" />
                        <div className="w-2 h-1.5 bg-black rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
                {selectedVariant === variant.id && (
                  <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}