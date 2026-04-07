import React, { useRef } from 'react';

import UniqueBadge from './UniqueBadge';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Module-level set — tracks which challenge cards have already animated this session
const animatedCards = new Set();

export default function WeeklyChallengeCard({ challenge, currentUser, userProgress, isMonthly = false }) {
  const [showStats, setShowStats] = React.useState(false);
  const queryClient = useQueryClient();

  // Only animate on first render per challenge per session
  const cardKey = `challenge-${challenge.id}`;
  const isFirstRender = !animatedCards.has(cardKey);
  React.useEffect(() => { animatedCards.add(cardKey); }, [cardKey]);

  const isParticipant = challenge.participants?.includes(currentUser?.id);
  const participantCount = challenge.participants?.length || 0;
  const targetValue = challenge.target_value || 50;

  // For monthly challenges use personal progress, otherwise use participant count
  const currentValue = isMonthly ? userProgress || 0 : participantCount;
  const progress = Math.min(100, Math.floor(currentValue / targetValue * 100));
  const remaining = Math.max(0, targetValue - currentValue);
  const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  const isCompleted = isMonthly && currentValue >= targetValue;

  const joinMutation = useMutation({
    mutationFn: async () => {
      const updatedParticipants = [...(challenge.participants || []), currentUser.id];
      await base44.entities.Challenge.update(challenge.id, { participants: updatedParticipants });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['weeklyChallenges'] });
      const previous = queryClient.getQueryData(['weeklyChallenges']);
      queryClient.setQueryData(['weeklyChallenges'], (old = []) =>
      old.map((c) => c.id === challenge.id ?
      { ...c, participants: [...(c.participants || []), currentUser.id] } :
      c
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
      initial={isFirstRender ? { opacity: 0, scale: 0.97 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}>
      
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, rgba(16,19,40,0.96) 0%, rgba(6,8,18,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.35)'
        }}>
        
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
                className="w-full h-full object-cover" />
              
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-black text-white leading-tight truncate">{challenge.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">{challenge.description}</p>
            </div>


          </div>

          {/* ── Progress bar ── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-400">{currentValue} / {targetValue}</span>
              <span className="text-[11px] font-bold" style={{ color: isCompleted ? '#34d399' : '#64748b' }}>
                {isCompleted ? '✓ Complete' : `${progress}%`}
              </span>
            </div>
            <div className="h-4 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <motion.div
                initial={isFirstRender ? { width: 0 } : false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: isCompleted ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #38bdf8, #60a5fa)' }} />
              
            </div>
          </div>

          {/* ── Reward ── */}
          <div className="flex items-center gap-3 rounded-xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {challenge.reward?.toLowerCase().includes('streak freeze') ? (
              <img src="https://media.base44.com/images/public/694b637358644e1c22c8ec6b/4b125b24a_ICEP1_V2.png" alt="Streak Freeze" className="w-12 h-12 object-contain flex-shrink-0" />
            ) : challenge.id === 'witness_my_gains' ? (
              <img src="https://media.base44.com/images/public/694b637358644e1c22c8ec6b/04f579c72_spartanbadge.png" alt="Spartan Badge" className="w-12 h-12 object-contain flex-shrink-0" />
            ) : (
              <UniqueBadge reward={challenge.reward} size="sm" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Reward</p>
              <p className="text-[13px] font-black text-white truncate">{challenge.reward || 'Weekly Challenge Badge'}</p>
            </div>
          </div>

          {/* ── Status for monthly / join button for weekly ── */}
          




























          

        </div>
      </div>
    </motion.div>);

}