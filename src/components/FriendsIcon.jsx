import React from 'react';

export default function FriendsIcon({ className = "w-7 h-7" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Left person head */}
      <circle cx="7" cy="6" r="2.5" />
      {/* Left person body */}
      <path d="M7 9v4" />
      {/* Left person left arm */}
      <path d="M4 11l-2 2" />
      {/* Left person right arm */}
      <path d="M10 11l2 2" />
      
      {/* Right person head */}
      <circle cx="17" cy="6" r="2.5" />
      {/* Right person body */}
      <path d="M17 9v4" />
      {/* Right person left arm */}
      <path d="M14 11l-2 2" />
      {/* Right person right arm */}
      <path d="M20 11l2 2" />
      
      {/* Center person (bigger) */}
      <circle cx="12" cy="13" r="3" />
      {/* Center person body */}
      <path d="M12 16v3" />
      {/* Center person arms */}
      <path d="M8 18l-1.5 2" />
      <path d="M16 18l1.5 2" />
    </svg>
  );
}