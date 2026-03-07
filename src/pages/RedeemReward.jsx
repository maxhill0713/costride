import React from 'react';
import { Trophy, Star, Flame, Zap, Shield, Crown, Target, Award, Dumbbell, Heart } from 'lucide-react';

// Maps reward text keywords to an icon + colour theme
function getBadgeTheme(reward = '') {
  const r = reward.toLowerCase();

  if (r.includes('streak') || r.includes('consistency') || r.includes('fire'))
    return { Icon: Flame,    bg: 'linear-gradient(135deg,#f97316,#ea580c)', shadow: 'rgba(249,115,22,0.45)', label: 'Streak'      };
  if (r.includes('warrior') || r.includes('shield') || r.includes('defend'))
    return { Icon: Shield,   bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', shadow: 'rgba(59,130,246,0.45)',  label: 'Warrior'     };
  if (r.includes('champion') || r.includes('crown') || r.includes('king'))
    return { Icon: Crown,    bg: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: 'rgba(245,158,11,0.45)', label: 'Champion'    };
  if (r.includes('trophy') || r.includes('winner') || r.includes('win'))
    return { Icon: Trophy,   bg: 'linear-gradient(135deg,#eab308,#ca8a04)', shadow: 'rgba(234,179,8,0.45)',  label: 'Trophy'      };
  if (r.includes('star') || r.includes('elite') || r.includes('gold'))
    return { Icon: Star,     bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)', shadow: 'rgba(251,191,36,0.45)', label: 'Star'        };
  if (r.includes('power') || r.includes('zap') || r.includes('energy') || r.includes('lightning'))
    return { Icon: Zap,      bg: 'linear-gradient(135deg,#a78bfa,#7c3aed)', shadow: 'rgba(167,139,250,0.45)',label: 'Power'       };
  if (r.includes('target') || r.includes('goal') || r.includes('achieve'))
    return { Icon: Target,   bg: 'linear-gradient(135deg,#22d3ee,#0891b2)', shadow: 'rgba(34,211,238,0.45)', label: 'Achievement' };
  if (r.includes('lift') || r.includes('strength') || r.includes('gym') || r.includes('dumbbell'))
    return { Icon: Dumbbell, bg: 'linear-gradient(135deg,#34d399,#059669)', shadow: 'rgba(52,211,153,0.45)', label: 'Strength'    };
  if (r.includes('heart') || r.includes('health') || r.includes('wellness'))
    return { Icon: Heart,    bg: 'linear-gradient(135deg,#f43f5e,#e11d48)', shadow: 'rgba(244,63,94,0.45)',  label: 'Wellness'    };
  if (r.includes('award') || r.includes('badge') || r.includes('medal'))
    return { Icon: Award,    bg: 'linear-gradient(135deg,#60a5fa,#3b82f6)', shadow: 'rgba(96,165,250,0.45)', label: 'Award'       };

  // default — cyan trophy
  return   { Icon: Trophy,   bg: 'linear-gradient(135deg,#22d3ee,#3b82f6)', shadow: 'rgba(34,211,238,0.45)', label: 'Badge'       };
}

const SIZES = {
  xs:  { outer: 28, icon: 13, fontSize: 7,  labelGap: 4  },
  sm:  { outer: 44, icon: 20, fontSize: 8,  labelGap: 5  },
  md:  { outer: 64, icon: 28, fontSize: 10, labelGap: 6  },
  lg:  { outer: 88, icon: 38, fontSize: 12, labelGap: 8  },
};

export default function UniqueBadge({ reward, size = 'sm', showLabel = true }) {
  const { Icon, bg, shadow, label } = getBadgeTheme(reward);
  const s = SIZES[size] || SIZES.sm;

  return (
    <div className="flex flex-col items-center" style={{ gap: s.labelGap }}>
      {/* Badge circle */}
      <div
        style={{
          width:        s.outer,
          height:       s.outer,
          borderRadius: '50%',
          background:   bg,
          boxShadow:    `0 4px 20px ${shadow}, 0 0 0 2px rgba(255,255,255,0.12)`,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          flexShrink:   0,
          position:     'relative',
          overflow:     'hidden',
        }}
      >
        {/* Inner shine */}
        <div
          style={{
            position:     'absolute',
            top:          0,
            left:         0,
            right:        0,
            height:       '45%',
            background:   'rgba(255,255,255,0.15)',
            borderRadius: '50% 50% 0 0 / 30% 30% 0 0',
          }}
        />
        <Icon
          style={{
            width:    s.icon,
            height:   s.icon,
            color:    '#fff',
            position: 'relative',
            zIndex:   1,
            filter:   'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
          }}
        />
      </div>

      {/* Label */}
      {showLabel && size !== 'xs' && (
        <span
          style={{
            fontSize:      s.fontSize,
            fontWeight:    700,
            color:         'rgba(255,255,255,0.55)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            lineHeight:    1,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
