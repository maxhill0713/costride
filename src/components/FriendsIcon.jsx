import React from 'react';

export default function FriendsIcon({ className = "w-7 h-7" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor" className="text-cyan-400 w-9 h-9 active:scale-75 active:translate-y-[2px] transition-all duration-100 cursor-pointer">


      {/* Left person */}
      <circle cx="6" cy="7" r="2.5" opacity="0.8" />
      <path d="M 4 11 Q 4 10 6 10 Q 8 10 8 11 L 8 14 Q 8 15 6 15 Q 4 15 4 14 Z" opacity="0.8" />
      
      {/* Right person */}
      <circle cx="18" cy="7" r="2.5" opacity="0.8" />
      <path d="M 16 11 Q 16 10 18 10 Q 20 10 20 11 L 20 14 Q 20 15 18 15 Q 16 15 16 14 Z" opacity="0.8" />
      
      {/* Center person (featured) */}
      <circle cx="12" cy="9.5" r="3.5" />
      <path d="M 9 14.5 Q 9 13 12 13 Q 15 13 15 14.5 L 15 18 Q 15 19.5 12 19.5 Q 9 19.5 9 18 Z" />
    </svg>);

}