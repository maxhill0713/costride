import React from 'react';

const STREAK_ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';

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