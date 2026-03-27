import React from 'react';

const STREAK_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png';

export default function StreakIcon({ variant = 'default', className = 'w-9 h-9', outline = false }) {
  return (
    <img
      src={STREAK_ICON_URL}
      alt="streak"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}