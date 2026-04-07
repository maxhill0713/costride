import React, { useState } from 'react';
import { Clock, Trophy, Trash2 } from 'lucide-react';
import UniqueBadge from './UniqueBadge';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

// Small cluster of participant avatars + "Join X and Y others" text
function ParticipantCluster({ participants = [], memberAvatarMap = {}, memberNameMap = {} }) {
  if (participants.length === 0) return null;

  const displayAvatars = participants.slice(0, 3);
  const extraCount = Math.max(0, participants.length - 3);

  const AV_COLORS = [
    { bg: '#1a2a4a', color: '#93c5fd' },
    { bg: '#2a1a3a', color: '#c4b5fd' },
    { bg: '#1a2e20', color: '#86efac' },
    { bg: '#2e1a1a', color: '#fca5a5' },
  ];
  const colorFor = (id) => AV_COLORS[(id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Build the label: "Join Alex and 12 others" or "Join 5 members"
  const firstName = memberNameMap[participants[0]] || null;
  const othersCount = participants.length - 1;
  let label;
  if (firstName && othersCount > 0) {
    label = `Join ${firstName} and ${othersCount} other${othersCount === 1 ? '' : 's'}`;
  } else if (firstName) {
    label = `${firstName} is in`;
  } else {
    label = `${participants.length} member${participants.length === 1 ? '' : 's'} joined`;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Avatar cluster */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {displayAvatars.map((userId, i) => {
          const col = colorFor(userId);
          const avatar = memberAvatarMap[userId];
          const name = memberNameMap[userId] || '';
          return (
            <div key={userId} title={name} style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: col.bg, border: '1.5px solid rgba(6,8,18,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 800, color: col.color,
              overflow: 'hidden', marginLeft: i > 0 ? -6 : 0, zIndex: 10 - i,
            }}>
              {avatar
                ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : ini(name)}
            </div>
          );
        })}
        {extraCount > 0 && (
          <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(6,8,18,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 7, fontWeight: 900, color: 'rgba(255,255,255,0.45)',
            marginLeft: -6,
          }}>
            +{extraCount}
          </div>
        )}
      </div>
      {/* Text */}
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.7)', lineHeight: 1.3 }}>
        {label}
      </span>
    </div>
  );
}

function GymChallengeCard({ challenge, onJoin, isJoined = false, currentUser, onDelete = null, isOwner = false, gymImageUrl = null, memberAvatarMap = {}, memberNameMap = {} }) {
  const [showStats, setShowStats] = useState(false);

  const participantCount = challenge.participants?.length || 0;
  const targetValue = challenge.target_value || 50;
  const progress = Math.min(100, Math.floor((participantCount / targetValue) * 100));
  const remaining = Math.max(0, targetValue - participantCount);
  const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  const userHasJoined = currentUser ? (challenge.participants || []).includes(currentUser.id) : false;

  const handleJoinClick = () => {
    if (onJoin) {
      onJoin(challenge);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
        }}
      >
        {/* Top shine */}
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.08) 50%, transparent 90%)' }} />

        <div className="relative p-4 space-y-3">

          {/* ── Header ── */}
          <div className="flex items-start gap-3 mb-1">
            {/* Gym image thumbnail */}
            <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden relative"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {gymImageUrl || challenge.image_url || challenge.gym_image_url ? (
                <img src={gymImageUrl || challenge.image_url || challenge.gym_image_url} alt={challenge.gym_name || 'Gym'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)' }}>
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-black text-white leading-tight truncate">{challenge.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">{challenge.description}</p>
            </div>

            {/* Days left pill */}
            {!isExpired ? (
              <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] font-bold text-slate-400">{daysLeft}d</span>
              </div>
            ) : (
              isOwner && onDelete && (
                <button onClick={() => onDelete(challenge.id)}
                  className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )
            )}

            {/* Delete button (non-expired owner) */}
            {!isExpired && isOwner && onDelete && (
              <button onClick={() => onDelete(challenge.id)}
                className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            )}
          </div>

          {/* ── Progress bar ── */}
          <div>
            <div className="flex items-center justify-end mb-1">
              <span className="text-[11px] font-bold text-slate-500">{progress}%</span>
            </div>
            <button onClick={() => setShowStats(!showStats)} className="w-full">
              <div className="h-4 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #f97316)' }}
                />
              </div>
            </button>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 rounded-xl px-3 py-2 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {challenge.goal_type === 'longest_streak' ? (
                  <>
                    <p className="text-sm font-black text-white">{currentUser?.streak || 0} / {targetValue}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">days in streak</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-black text-white">{participantCount} / {targetValue}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{remaining} more needed</p>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* ── Reward ── */}
          <div className="flex items-center gap-3 rounded-xl px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <UniqueBadge reward={challenge.reward} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Reward</p>
              <p className="text-[13px] font-black text-white truncate">{challenge.reward || 'Challenge Badge'}</p>
            </div>
          </div>

          {/* ── Participant cluster (only for available/not-yet-joined) ── */}
          {!isOwner && !userHasJoined && participantCount > 0 && (
            <ParticipantCluster
              participants={challenge.participants || []}
              memberAvatarMap={memberAvatarMap}
              memberNameMap={memberNameMap}
            />
          )}

          {/* ── Join button ── */}
          {!isExpired && !isOwner && (
            <motion.div whileTap={!userHasJoined ? { scale: 0.97 } : {}}>
              <button
                onClick={handleJoinClick}
                disabled={userHasJoined}
                className="w-full h-9 rounded-xl font-black text-[13px] transition-all"
                style={userHasJoined ? {
                  background: 'rgba(52,211,153,0.1)',
                  border: '1px solid rgba(52,211,153,0.2)',
                  color: '#34d399',
                  cursor: 'default',
                } : {
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                {userHasJoined ? '✓ Joined' : 'Join Challenge'}
              </button>
            </motion.div>
          )}

          {isOwner && (
            <div className="w-full h-9 rounded-xl font-black text-[13px] flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
              👑 Your Challenge
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}

export default React.memo(GymChallengeCard);