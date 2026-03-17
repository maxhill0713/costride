import React from 'react';
import { Clock } from 'lucide-react';
import UniqueBadge from './UniqueBadge';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function WeeklyChallengeCard({ challenge, currentUser }) {
  const [showStats, setShowStats] = React.useState(false);
  const queryClient = useQueryClient();

  const isParticipant = challenge.participants?.includes(currentUser?.id);
  const participantCount = challenge.participants?.length || 0;
  const targetValue = challenge.target_value || 50;
  const progress = Math.min(100, Math.floor((participantCount / targetValue) * 100));
  const remaining = Math.max(0, targetValue - participantCount);
  const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;

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
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, rgba(16,19,40,0.96) 0%, rgba(6,8,18,0.99) 100%)',
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
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/5a4c7be8b_Untitleddesign-7.jpg"
                alt="Challenge"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-black text-white leading-tight truncate">{challenge.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">{challenge.description}</p>
            </div>

            {/* Days left pill — only shown when not expired, Ended pill removed */}
            {!isExpired && (
              <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] font-bold text-slate-400">{daysLeft}d</span>
              </div>
            )}
          </div>

          {/* ── Progress bar — percentage only, joined count removed ── */}
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
                  style={{ background: 'linear-gradient(90deg, #38bdf8, #60a5fa)' }}
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
              <p className="text-[13px] font-black text-white truncate">{challenge.reward || 'Weekly Challenge Badge'}</p>
            </div>
          </div>

          {/* ── Join button — only shown when not expired ── */}
          {!isExpired && (
            <motion.div whileTap={!isParticipant ? { scale: 0.97 } : {}}>
              <button
                onClick={() => !isParticipant && joinMutation.mutate()}
                disabled={joinMutation.isPending || isParticipant}
                className="w-full h-9 rounded-xl font-black text-[13px] transition-all"
                style={isParticipant ? {
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
                {joinMutation.isPending ? '...' : isParticipant ? '✓ Joined' : 'Join Challenge'}
              </button>
            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  );
}