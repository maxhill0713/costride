export default function CustomFlameIcon() {
  return (
    <svg
      width="48"
      height="56"
      viewBox="0 0 48 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <defs>
        <radialGradient id="flameGradient" cx="50%" cy="50%">
          <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
        </radialGradient>
      </defs>

      {/* Main flame body with rounded bottom and peaks */}
      <path
        d="M24 2C20 8 14 15 14 24C14 32.8366 18.9373 40 24 40C29.0627 40 34 32.8366 34 24C34 15 28 8 24 2Z"
        fill="url(#flameGradient)"
      />

      {/* Left peak */}
      <path
        d="M10 22C8 18 4 22 6 28C8 32 12 32 14 28C15 25 12 20 10 22Z"
        fill="#FF6B35"
      />

      {/* Right peak */}
      <path
        d="M38 22C40 18 44 22 42 28C40 32 36 32 34 28C33 25 36 20 38 22Z"
        fill="#FF6B35"
      />

      {/* Inner lighter flame */}
      <path
        d="M24 8C21 13 17 19 17 24C17 30.6274 20.134 36 24 36C27.866 36 31 30.6274 31 24C31 19 27 13 24 8Z"
        fill="#FFD700"
      />

      {/* Left eye white */}
      <circle cx="18" cy="22" r="3.5" fill="white" />
      {/* Left eye pupil */}
      <circle cx="18" cy="22" r="2" fill="#8B4513" />

      {/* Right eye white */}
      <circle cx="30" cy="22" r="3.5" fill="white" />
      {/* Right eye pupil */}
      <circle cx="30" cy="22" r="2" fill="#8B4513" />

      {/* Smile */}
      <path
        d="M20 28C20 28 24 31 24 31C24 31 28 28 28 28"
        stroke="#8B4513"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}