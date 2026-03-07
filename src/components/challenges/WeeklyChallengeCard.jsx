import React from 'react';
import { Users, Clock, Zap, CheckCircle, Trophy } from 'lucide-react';
import UniqueBadge from './UniqueBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Maps challenge type keywords to a colour accent
function getAccent(challenge) {
  const title = (challenge.title || '').toLowerCase();
  const type  = (challenge.type  || '').toLowerCase();
  if (title.includes('streak') || type.includes('streak'))
    return { c: '#f97316', glow: 'rgba(249,115,22,0.18)', bar: 'linear-gradient(90deg,#f97316,#fb923c)', top: 'linear-gradient(90deg,#f97316,#f9731600)' };
  if (title.includes('warrior') || type.includes('check'))
    return { c: '#3b82f6', glow: 'rgba(59,130,246,0.18)', bar: 'linear-gradient(90deg,#3b82f6,#60a5fa)', top: 'linear-gradient(90deg,#3b82f6,#3b82f600)' };
  if (title.includes('protein') || title.includes('free') || title.includes('shake'))
    return { c: '#22d3ee', glow: 'rgba(34,211,238,0.18)', bar: 'linear-gradient(90deg,#22d3ee,#67e8f9)', top: 'linear-gradient(90deg,#22d3ee,#22d3ee00)' };
  if (title.includes('community') || title.includes('social'))
    return { c: '#a78bfa', glow: 'rgba(167,139,250,0.18)', bar: 'linear-gradient(90deg,#a78bfa,#c4b5fd)', top: 'linear-gradient(90deg,#a78bfa,#a78bfa00)' };
  if (title.includes('weight') || title.includes('lift') || title.includes('pr'))
    return { c: '#34d399', glow: 'rgba(52,211,153,0.18)', bar: 'linear-gradient(90deg,#34d399,#6ee7b7)', top: 'linear-gradient(90deg,#34d399,#34d39900)' };
  // default cyan
  return { c: '#22d3ee', glow: 'rgba(34,211,238,0.18)', bar: 'linear-gradient(90deg,#22d3ee,#3b82f6)', top: 'linear-gradient(90deg,#22d3ee,#22d3ee00)' };
}

export default function WeeklyChallengeCard({ challenge, currentUser }) {
  const [showStats, setShowStats] = React.useState(false);
  const queryClient = useQueryClient();

  const isParticipant   = challenge.participants?.includes(currentUser?.id);
  const participantCount = challenge.participants?.length || 0;
  const targetValue      = challenge.target_value || 50;
  const progress         = Math.min(100, Math.floor((participantCount / targetValue) * 100));
  const remaining        = Math.max(0, targetValue - participantCount);
  const daysLeft         = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpired        = daysLeft <= 0;
  const accent           = getAccent(challenge);

  const joinMutation = useMutation({
    mutationFn: async () => {
      const updatedParticipants = [...(challenge.participants || []), currentUser.id];
      await base44.entities.Challenge.update(challenge.id, { participants: updatedParticipants });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['weeklyChallenges'] });
      const previous = queryClient.getQueryData(['weeklyChallenges']);
      queryClient.setQueryData(['weeklyChallenges'], (old = []) =>
        old.map(c => c.id === challenge.id
          ? { ...c, participants: [...(c.participants || []), currentUser.id] }
          : c)
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22 }}
      style={{ height: '100%' }}
    >
      {/* Card shell — solid navy matching app palette */}
      <div
        className="relative flex flex-col overflow-hidden rounded-2xl h-full"
        style={{
          background: '#111d3a',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `0 4px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
        }}
      >
        {/* Coloured top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl z-10" style={{ background: accent.top }} />

        {/* Subtle corner glow */}
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none"
          style={{ background: accent.glow }}
        />

        {/* ── HEADER ── */}
        <div className="relative p-4 pb-3 flex items-start gap-3">
          {/* Icon/image */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg"
            style={{ background: `${accent.c}18`, border: `1px solid ${accent.c}30` }}
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/5a4c7be8b_Untitleddesign-7.jpg"
              alt="Challenge"
              className="w-full h-full object-cover opacity-90"
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Status pill */}
            <div className="flex items-center gap-1.5 mb-1.5">
              {isExpired ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }}>EXPIRED</span>
              ) : isParticipant ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.22)' }}>
                  <CheckCircle className="w-2.5 h-2.5" /> JOINED
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: `${accent.c}18`, color: accent.c, border: `1px solid ${accent.c}30` }}>
                  <Zap className="w-2.5 h-2.5" /> ACTIVE
                </span>
              )}
              {!isExpired && (
                <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Clock className="w-2.5 h-2.5" />{daysLeft}d left
                </span>
              )}
            </div>

            <h4 className="font-black text-white text-base leading-tight mb-1">{challenge.title}</h4>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{challenge.description}</p>
          </div>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowStats(s => !s)}
            className="w-full group/bar"
          >
            {/* Track */}
            <div
              className="relative h-3 rounded-full overflow-hidden w-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                className="h-full rounded-full relative"
                style={{ background: accent.bar, boxShadow: `0 0 12px ${accent.glow}` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 -left-full w-1/2 bg-white/20 skew-x-12 animate-[shimmer_2s_ease-in-out_infinite]" />
                </div>
              </motion.div>

              {/* Progress percentage label */}
              {progress > 0 && (
                <div
                  className="absolute inset-y-0 flex items-center text-[9px] font-black"
                  style={{
                    left: `${Math.min(progress - 2, 90)}%`,
                    color: progress > 15 ? 'rgba(255,255,255,0.9)' : accent.c,
                    transform: 'translateX(-100%)',
                  }}
                >
                  {progress}%
                </div>
              )}
            </div>

            {/* Stats row below bar */}
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <Users className="w-2.5 h-2.5" />{participantCount} joined
              </span>
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {challenge.goal_type === 'longest_streak' ? `${currentUser?.streak || 0}/${targetValue} days` : `${remaining} spots left`}
              </span>
            </div>
          </button>

          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="mt-2 rounded-xl p-3 flex items-center justify-around text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent.c}22` }}
                >
                  <div>
                    <p className="text-lg font-black" style={{ color: accent.c }}>{participantCount}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Participants</p>
                  </div>
                  <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div>
                    <p className="text-lg font-black" style={{ color: accent.c }}>{targetValue}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Target</p>
                  </div>
                  <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div>
                    <p className="text-lg font-black" style={{ color: accent.c }}>{daysLeft > 0 ? daysLeft : 0}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Days Left</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── REWARD SECTION ── */}
        <div
          className="mx-4 mb-4 rounded-xl p-3 flex items-center gap-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${accent.c}28`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
          }}
        >
          {/* Badge icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: `${accent.c}18`, border: `1px solid ${accent.c}30`, boxShadow: `0 0 16px ${accent.glow}` }}
          >
            <UniqueBadge reward={challenge.reward} size="sm" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Challenge Reward
            </p>
            <p className="text-sm font-black leading-tight" style={{ color: accent.c }}>
              {challenge.reward || 'Weekly Challenge Badge'}
            </p>
          </div>

          <Trophy className="w-4 h-4 flex-shrink-0 opacity-40" style={{ color: accent.c }} />
        </div>

        {/* ── ACTION BUTTON ── */}
        {!isExpired && (
          <div className="px-4 pb-4 mt-auto">
            <motion.button
              whileTap={!isParticipant ? { scale: 0.97 } : {}}
              onClick={() => !isParticipant && joinMutation.mutate()}
              disabled={joinMutation.isPending || isParticipant}
              className="w-full h-10 rounded-xl font-black text-sm transition-all relative overflow-hidden"
              style={
                isParticipant
                  ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', cursor: 'default' }
                  : { background: `linear-gradient(135deg, ${accent.c}cc, ${accent.c}88)`, color: '#fff', border: `1px solid ${accent.c}55`, boxShadow: `0 4px 20px ${accent.glow}`, cursor: 'pointer' }
              }
            >
              {/* shimmer on join button */}
              {!isParticipant && (
                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-y-0 -left-full w-1/3 bg-white/10 skew-x-12 group-hover:animate-[shimmer_1.5s_ease-in-out_infinite]" />
                </div>
              )}
              <span className="relative flex items-center justify-center gap-2">
                {isParticipant ? (
                  <><CheckCircle className="w-4 h-4" /> Joined!</>
                ) : joinMutation.isPending ? (
                  'Joining…'
                ) : (
                  <><Zap className="w-4 h-4" /> Join Challenge</>
                )}
              </span>
            </motion.button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(400%)  skewX(-12deg); }
        }
      `}</style>
    </motion.div>
  );
}
