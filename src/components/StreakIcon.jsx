import React from 'react';
import { Flame } from 'lucide-react';

export default function StreakIcon({ variant = 'default', className = 'w-9 h-9' }) {
  if (variant === 'sunglasses') {
    return (
      <div className={`relative ${className}`}>
        <Flame className={`${className} text-orange-500 fill-current`} />
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 64 64"
        >
          <circle cx="20" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black" />
          <circle cx="44" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black" />
          <line x1="26" y1="24" x2="38" y2="24" stroke="currentColor" strokeWidth="1.5" className="text-black" />
        </svg>
      </div>
    );
  }

  if (variant === 'cowboy') {
    return (
      <div className={`relative ${className}`}>
        <Flame className={`${className} text-orange-500 fill-current`} />
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 64 64"
        >
          <path 
            d="M 12 28 L 10 18 Q 10 8 32 5 Q 54 8 54 18 L 52 28" 
            fill="currentColor" 
            className="text-amber-800"
          />
          <ellipse cx="32" cy="28" rx="24" ry="6" fill="currentColor" className="text-amber-700" />
          <rect x="14" y="26" width="36" height="1.5" fill="currentColor" className="text-amber-900" />
        </svg>
      </div>
    );
  }

  return <Flame className={`${className} text-orange-500 fill-current`} />;
}