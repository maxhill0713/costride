import React from 'react';
import { Trophy, Users, ChevronRight, CheckCircle } from 'lucide-react';
import UniqueBadge from './UniqueBadge';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// ─── Challenge illustration (top-right corner, matching Progress page style) ──
function ChallengeIllustration({ progress }) {
  const pct = Math.min(100, progress);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width="90" height="72" viewBox="0 0 120 96" fill="none">
      {/* Outer glow rings */}
      <circle cx="80" cy="28" r="36" stroke="rgba(6,182,212,0.08)" strokeWidth="1.5" fill="none" />
      <circle cx="80" cy="28" r="27" stroke="rgba(6,182,212,0.12)" strokeWidth="1.5" fill="none" />
      {/* Track ring */}
      <circle cx="80" cy="28" r={r} stroke="rgba(6,182,212,0.18)" strokeWidth="4" fill="none" />
      {/* Progress arc */}
      <circle
        cx="80" cy="28" r={r}
        stroke="url(#cg1)"
        strokeWidth="4"
        fill="none"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
      />
      {/* Trophy icon center */}
      <text x="80" y="34" textAnchor="middle" fontSize="16" fill="rgba(251,191,36,0.9)">🏆</text>
      {/* Sparkle dots */}
      <circle cx="40" cy="14" r="2.5" fill="rgba(6,182,212,0.6)" />
      <circle cx="32" cy="30" r="1.5" fill="rgba(6,182,212,0.4)" />
      <circle cx="50" cy="52" r="2"   fill="rgba(6,182,212,0.3)" />
      <defs>
        <linearGradient id="cg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Shared styles (mirrors Progress page) ────────────────────────────────────
const btnCyan =
  'bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 text-white font-bold rounded-full px-4 py-1.5 flex items-center gap-1.5 justify-center shadow-[0_3px_0_0_#0369a1,0_6px_16px_rgba(6,100,200,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu';

export default function WeeklyChallengeCard({ challenge, currentUser }) {
  const [showStats, setShowStats] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const queryClient = useQueryClient();

  const isParticipant    = challenge.participants?.includes(currentUser?.id);
  const participantCount = challenge.participants?.length || 0;
  const targetValue      = challenge.target_value || 50;
  const progress         = Math.min(100, Math.floor((participantCount / targetValue) * 100));
  const remaining        = Math.max(0, targetValue - participantCount);
  const daysLeft         = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpired        = daysLeft <= 0;

  const joinMutation = useMutation({
    mutationFn: async () => {
      const updatedParticipants = [...(challenge.participants || []), currentUser.id];
      await base44.entities.Challenge.update(challenge.id, { participants: updatedParticipants });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['weeklyChallenges'] });
      const previous = queryClient.getQueryData(['weeklyChallenges']);
      queryClient.setQueryData(['weeklyChallenges'], (old = []) =>
        old.map(c =>
          c.id === challenge.id
            ? { ...c, participants: [...(c.participants || []), currentUser.id] }
            : c
        )
      );
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['weeklyChallenges'], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyChallenges'] });
    },
  });

  const pressEvents = {
    onMouseDown:   () => setPressed(true),
    onMouseUp:     () => setPressed(false),
    onMouseLeave:  () => setPressed(false),
    onTouchStart:  () => setPressed(true),
    onTouchEnd:    () => setPressed(false),
    onTouchCancel: () => setPressed(false),
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 w-full text-left"
      style={{
        background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
        border: `1px solid ${pressed ? 'rgba(6,182,212,0.45)' : 'rgba(255,255,255,0.07)'}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: pressed
          ? '0 2px 8px rgba(0,0,0,0.5), 0 0 22px 2px rgba(6,182,212,0.25)'
          : '0 4px 24px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.22s ease, border-color 0.22s ease',
      }}
    >
      {/* Top shine */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)',
        }}
      />

      {/* Background glow blob */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: 'radial-gradient(ellipse at 25% 35%, rgba(6,182,212,0.25) 0%, transparent 60%)',
          opacity: 0.09,
        }}
      />

      {/* Illustration — top right */}
      <div className="absolute top-0 right-0 pointer-events-none overflow-hidden" style={{ borderTopRightRadius: 16 }}>
        <ChallengeIllustration progress={progress} />
      </div>

      {/* ── Content (max 62% width so it doesn't overlap illustration) ── */}
      <div className="relative flex flex-col gap-3" style={{ maxWidth: '62%' }}>

        {/* Header row: icon + title */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(6,182,212,0.18)' }}
          >
            <Trophy className="w-4 h-4" style={{ color: '#22d3ee' }} />
          </div>
          <span className="text-[15px] font-black text-white tracking-tight leading-tight">
            {challenge.title}
          </span>
        </div>

        {/* Description */}
        {challenge.description && (
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            {challenge.description}
          </p>
        )}

        {/* Progress bar — tap to reveal stats */}
        <div>
          <button
            onClick={() => setShowStats(s => !s)}
            className="w-full"
            {...pressEvents}
          >
            <div className="relative h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #22d3ee, #0ea5e9)',
                  boxShadow: '0 0 8px rgba(6,182,212,0.5)',
                }}
              />
            </div>
          </button>

          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 rounded-xl px-3 py-2 border text-center"
              style={{
                background: 'rgba(6,182,212,0.07)',
                borderColor: 'rgba(6,182,212,0.25)',
              }}
            >
              {challenge.goal_type === 'longest_streak' ? (
                <>
                  <p className="text-sm font-bold text-cyan-300">
                    {currentUser?.streak || 0}/{targetValue}
                  </p>
                  <p className="text-[10px] text-slate-400">days in streak</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-cyan-300">
                    {participantCount}/{targetValue}
                  </p>
                  <p className="text-[10px] text-slate-400">{remaining} more needed</p>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Meta chips: days left + participants */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isExpired && (
            <span
              className="text-[10px] font-bold rounded-full px-2.5 py-0.5 border"
              style={{
                color: daysLeft <= 2 ? '#f87171' : '#22d3ee',
                background: daysLeft <= 2 ? 'rgba(239,68,68,0.1)' : 'rgba(6,182,212,0.1)',
                borderColor: daysLeft <= 2 ? 'rgba(239,68,68,0.25)' : 'rgba(6,182,212,0.25)',
              }}
            >
              {daysLeft}d left
            </span>
          )}
          {isExpired && (
            <span className="text-[10px] font-bold rounded-full px-2.5 py-0.5 border border-slate-600/40 text-slate-500 bg-slate-800/40">
              Ended
            </span>
          )}
          <span
            className="text-[10px] font-bold rounded-full px-2.5 py-0.5 border"
            style={{
              color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Users className="w-2.5 h-2.5 inline-block mr-1 -mt-px" />
            {participantCount}
          </span>
        </div>

        {/* Reward pill */}
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 border"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(6,182,212,0.2)',
          }}
        >
          <div className="flex-shrink-0">
            <UniqueBadge reward={challenge.reward} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Reward</p>
            <p className="text-xs font-black text-cyan-200 truncate">
              {challenge.reward || 'Weekly Challenge Badge'}
            </p>
          </div>
        </div>

        {/* Join button */}
        {!isExpired && (
          isParticipant ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-bold text-green-400">Joined</span>
            </div>
          ) : (
            <button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className={btnCyan}
              style={{ width: 'fit-content' }}
            >
              Join Challenge
            </button>
          )
        )}
      </div>

      {/* Arrow chip — bottom right (mirrors TallCard) */}
      <div className="absolute bottom-3 right-3">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(6,182,212,0.18)',
            border: '1px solid rgba(6,182,212,0.45)',
          }}
        >
          <ChevronRight className="w-3.5 h-3.5" style={{ color: '#22d3ee' }} />
        </div>
      </div>
    </div>
  );
}