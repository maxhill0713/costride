import React from 'react';
import { Trophy, Flame, Crown, Zap, Star, Medal, Target, Award } from 'lucide-react';

export default function UniqueBadge({ reward, size = 'md' }) {
  if (!reward) return null;

  const rewardLower = reward.toLowerCase();
  
  const getBadgeConfig = () => {
    if (rewardLower.includes('consistency')) {
      return {
        topText: 'CONSISTENCY',
        bottomText: 'CHAMPION',
        primary: '#FFA500',
        secondary: '#FF6B35',
        accent: '#1E3A8A',
        icon: Flame,
        glow: 'orange'
      };
    }
    if (rewardLower.includes('warrior') || rewardLower.includes('monday')) {
      return {
        topText: 'MONDAY',
        bottomText: 'WARRIOR',
        primary: '#60A5FA',
        secondary: '#3B82F6',
        accent: '#1E40AF',
        icon: Trophy,
        glow: 'blue'
      };
    }
    if (rewardLower.includes('master') || rewardLower.includes('king')) {
      return {
        topText: 'STRENGTH',
        bottomText: 'MASTER',
        primary: '#C084FC',
        secondary: '#A855F7',
        accent: '#6B21A8',
        icon: Crown,
        glow: 'purple'
      };
    }
    if (rewardLower.includes('power') || rewardLower.includes('strength')) {
      return {
        topText: 'POWER',
        bottomText: 'ELITE',
        primary: '#FBBF24',
        secondary: '#F59E0B',
        accent: '#B45309',
        icon: Zap,
        glow: 'amber'
      };
    }
    if (rewardLower.includes('excellence') || rewardLower.includes('elite')) {
      return {
        topText: 'EXCELLENCE',
        bottomText: 'TIER',
        primary: '#34D399',
        secondary: '#10B981',
        accent: '#047857',
        icon: Star,
        glow: 'emerald'
      };
    }
    if (rewardLower.includes('legend')) {
      return {
        topText: 'LEGENDARY',
        bottomText: 'ACHIEVER',
        primary: '#F472B6',
        secondary: '#EC4899',
        accent: '#BE185D',
        icon: Medal,
        glow: 'pink'
      };
    }
    return {
      topText: 'CHALLENGE',
      bottomText: 'MASTERY',
      primary: '#06B6D4',
      secondary: '#0891B2',
      accent: '#164E63',
      icon: Award,
      glow: 'cyan'
    };
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeValues = {
    sm: { width: 80, height: 100, scale: 0.6 },
    md: { width: 140, height: 170, scale: 1 },
    lg: { width: 200, height: 240, scale: 1.4 }
  };

  const dimensions = sizeValues[size];

  return (
    <div className="relative flex flex-col items-center" style={{ perspective: '1000px' }}>
      <style>{`
        @keyframes badgeGlow {
          0%, 100% { filter: drop-shadow(0 0 8px ${config.primary}80) drop-shadow(0 0 16px ${config.primary}40); }
          50% { filter: drop-shadow(0 0 16px ${config.primary}); }
        }
        .badge-glow-${config.glow} {
          animation: badgeGlow 3s ease-in-out infinite;
        }
        .badge-shine {
          background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%);
        }
      `}</style>

      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 140 170"
        className={`badge-glow-${config.glow}`}
        style={{ filter: `drop-shadow(0 0 20px ${config.primary}60)` }}
      >
        <defs>
          <radialGradient id={`grad-${config.glow}`} cx="50%" cy="30%">
            <stop offset="0%" stopColor={config.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={config.accent} stopOpacity="1" />
          </radialGradient>
          <filter id={`glow-${config.glow}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Shield Border - Gold/Primary */}
        <path
          d="M 70 10 L 95 30 L 95 75 Q 70 120 70 150 Q 70 120 45 75 L 45 30 Z"
          fill="none"
          stroke={config.primary}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${config.glow})`}
        />

        {/* Second Border - Darker */}
        <path
          d="M 70 10 L 95 30 L 95 75 Q 70 120 70 150 Q 70 120 45 75 L 45 30 Z"
          fill="none"
          stroke={config.secondary}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />

        {/* Shield Fill */}
        <path
          d="M 70 15 L 92 32 L 92 73 Q 70 115 70 145 Q 70 115 48 73 L 48 32 Z"
          fill={`url(#grad-${config.glow})`}
        />

        {/* Inner Highlight/Shine */}
        <ellipse
          cx="65"
          cy="50"
          rx="18"
          ry="22"
          fill="white"
          opacity="0.15"
        />

        {/* Decorative Top Arc */}
        <path
          d="M 48 32 Q 70 20 92 32"
          fill="none"
          stroke={config.primary}
          strokeWidth="2"
          opacity="0.6"
        />

        {/* Left Wing */}
        <path
          d="M 48 45 Q 25 40 20 50 Q 25 55 35 50"
          fill={config.primary}
          opacity="0.7"
          filter={`url(#glow-${config.glow})`}
        />

        {/* Right Wing */}
        <path
          d="M 92 45 Q 115 40 120 50 Q 115 55 105 50"
          fill={config.primary}
          opacity="0.7"
          filter={`url(#glow-${config.glow})`}
        />

        {/* Center Icon Background Circle */}
        <circle
          cx="70"
          cy="65"
          r="22"
          fill="rgba(255,255,255,0.1)"
          stroke={config.primary}
          strokeWidth="1"
          opacity="0.4"
        />

        {/* Center Star Accent */}
        <text
          x="70"
          y="118"
          textAnchor="middle"
          fontSize="14"
          fill={config.primary}
          opacity="0.8"
          fontWeight="bold"
        >
          ★
        </text>
      </svg>

      {/* Icon Overlay - Positioned over SVG */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: `${dimensions.height * 0.32}px`,
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        <Icon
          size={Math.max(24, dimensions.width * 0.25)}
          color="white"
          strokeWidth={1.5}
          fill="currentColor"
          className="drop-shadow-lg"
          style={{ opacity: 0.95 }}
        />
      </div>

      {/* Badge Text */}
      <div
        className="mt-2 text-center"
        style={{ transform: `scale(${dimensions.scale})`, transformOrigin: 'top center' }}
      >
        <p
          className="font-black tracking-wider leading-none"
          style={{
            color: config.primary,
            fontSize: '11px',
            textShadow: `0 0 8px ${config.primary}40`
          }}
        >
          {config.topText}
        </p>
        <p
          className="font-black tracking-wider"
          style={{
            color: config.primary,
            fontSize: '12px',
            textShadow: `0 0 8px ${config.primary}40`
          }}
        >
          {config.bottomText}
        </p>
      </div>
    </div>
  );
}