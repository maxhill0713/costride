import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Flame, Crown } from 'lucide-react';

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';

function SpotlightCard({ member, rank, memberAvatarMap }) {
  const [pressed, setPressed] = useState(false);
  const medals = ['🥇', '🥈', '🥉'];
  const medal = medals[rank] || null;
  const avatar = memberAvatarMap?.[member.userId];
  const ini = (n = '') => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: rank * 0.06, duration: 0.28, ease: [0.34, 1.2, 0.64, 1] }}>
      <div
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          borderRadius: 16,
          background: rank === 0 ?
          'linear-gradient(135deg, rgba(30,24,8,0.98) 0%, rgba(12,8,2,0.99) 100%)' :
          CARD_BG,
          border: rank === 0 ? '1px solid rgba(250,204,21,0.35)' : CARD_BORDER,
          boxShadow: rank === 0 ? '0 0 20px rgba(250,204,21,0.1), 0 4px 16px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.3)',
          transform: pressed ? 'scale(0.973) translateY(2px)' : 'scale(1)',
          transition: pressed ? 'transform 0.06s ease' : 'transform 0.25s cubic-bezier(0.34,1.3,0.64,1)',
          padding: '11px 13px',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}>
        {rank === 0 &&
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 30%, rgba(250,204,21,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
        }
        <div className="relative flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div style={{
              width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
              border: rank === 0 ? '2px solid rgba(250,204,21,0.5)' : '2px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)',
              fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.6)'
            }}>
              {avatar ?
              <img src={avatar} alt={member.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
              ini(member.userName)}
            </div>
            {medal &&
            <div style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 13, lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
                {medal}
              </div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.userName}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
              {member.checkInCount > 0 &&
              <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa' }}>{member.checkInCount} check-ins</span>
              }
            </div>
          </div>
          {rank === 0 && <Crown style={{ width: 16, height: 16, flexShrink: 0, color: '#fbbf24' }} />}
        </div>
      </div>
    </motion.div>);

}

export default function MemberSpotlight({ checkIns, memberAvatarMap }) {
  const [collapsed, setCollapsed] = useState(false);

  const topMembers = useMemo(() => {
    const counts = {};
    const names = {};
    checkIns.forEach((c) => {
      if (!c.user_id) return;
      counts[c.user_id] = (counts[c.user_id] || 0) + 1;
      if (c.user_name) names[c.user_id] = c.user_name;
    });
    return Object.entries(counts).
    map(([userId, checkInCount]) => ({ userId, userName: names[userId] || 'Member', checkInCount })).
    sort((a, b) => b.checkInCount - a.checkInCount).
    slice(0, 3);
  }, [checkIns]);

  if (topMembers.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        onClick={() => setCollapsed((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px', background: 'none', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg, rgba(250,204,21,0.2), rgba(251,146,60,0.1))', border: '1px solid rgba(250,204,21,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} className=" hidden hidden">
            <Award style={{ width: 13, height: 13, color: '#fbbf24' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>Member Spotlight</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.28)' }}>{collapsed ? 'show' : 'hide'}</span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed &&
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topMembers.map((member, i) =>
            <SpotlightCard key={member.userId} member={member} rank={i} memberAvatarMap={memberAvatarMap} />
            )}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}