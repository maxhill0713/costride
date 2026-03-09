import React from 'react';
import { Trophy, Clock, Users, Target, CheckCircle, Zap, Gift, Award, Sparkles, ChevronRight } from 'lucide-react';
import UniqueBadge from './UniqueBadge';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function WeeklyChallengeCard({ challenge, currentUser }) {
  const [showStats, setShowStats] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const queryClient = useQueryClient();

  const isParticipant = challenge.participants?.includes(currentUser?.id);
  const participantCount = challenge.participants?.length || 0;
  const targetValue = challenge.target_value || 50;
  const progress = Math.min(100, Math.floor((participantCount / targetValue) * 100));
  const remaining = Math.max(0, targetValue - participantCount);
  const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;

  const pressEvents = {
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false),
    onTouchStart: () => setPressed(true),
    onTouchEnd: () => setPressed(false),
    onTouchCancel: () => setPressed(false),
  };

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

  // Determine accent colour based on participation / expiry state
  const accentColor  = isParticipant ? '#34d399' : '#22d3ee';
  const accentBorder = isParticipant ? 'rgba(16,185,129,0.45)' : 'rgba(6,182,212,0.45)';
  const glowColor    = isParticipant ? 'rgba(16,185,129,0.3)' : 'rgba(6,182,212,0.28)';
  const iconColor    = isParticipant ? '#34d399' : '#22d3ee';
  const iconBg       = isParticipant ? 'rgba(16,185,129,0.18)' : 'rgba(6,182,212,0.18)';

  return (
    <div
      className="relative overflow-hidden rounded-2xl w-full text-left"
      style={{
        background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
        border: `1px solid ${pressed ? accentBorder : 'rgba(255,255,255,0.07)'}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transform: pressed ? 'scale(0.977) translateY(2px)' : 'scale(1)',
        boxShadow: pressed
          ? `0 2px 8px rgba(0,0,0,0.5), 0 0 22px 2px ${glowColor}`
          : `0 4px 24px rgba(0,0,0,0.4)`,
        transition: pressed
          ? 'transform 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease'
          : 'transform 0.22s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.22s ease, border-color 0.22s ease',
      }}
      {...pressEvents}
    >
      {/* Top shine */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }}
      />

      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 25% 35%, ${glowColor} 0%, transparent 60%)`,
          opacity: pressed ? 0.28 : 0.12,
          transition: 'opacity 0.1s ease',
        }}
      />

      {/* Challenge image — top-right corner */}
      <div
        className="absolute top-0 right-0 pointer-events-none overflow-hidden"
        style={{ borderTopRightRadius: 16, width: 96, height: 96 }}
      >
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/5a4c7be8b_Untitleddesign-7.jpg"
          alt="Challenge"
          className="w-full h-full object-cover"
          style={{ opacity: 0.55, mixBlendMode: 'luminosity' }}
        />
        {/* Fade overlay so text stays readable */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(8,10,20,0.55) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 p-4 space-y-3">

        {/* Header row */}
        <div className="flex items-start gap-3" style={{ maxWidth: '65%' }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: iconBg, border: `1px solid ${accentBorder}` }}
          >
            <Trophy className="w-4 h-4" style={{ color: iconColor }} />
          </div>
          <div className="min-w-0">
            <h4 className="text-[15px] font-black text-white tracking-tight leading-tight truncate">
              {challenge.title}
            </h4>
            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.62)' }}>
              {challenge.description}
            </p>
          </div>
        </div>

        {/* Progress bar — tappable */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full active:scale-95 transition-transform"
        >
          <div
            className="relative h-3 rounded-full overflow-hidden"
            style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${accentColor}, ${isParticipant ? '#6ee7b7' : '#67e8f9'})`,
                boxShadow: `0 0 10px ${glowColor}`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {participantCount} joined
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Goal: {targetValue}
            </span>
          </div>
        </button>

        {/* Expanded stats */}
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl px-3 py-2 text-center"
            style={{
              background: 'rgba(13,35,96,0.35)',
              border: `1px solid ${accentBorder}`,
            }}
          >
            {challenge.goal_type === 'longest_streak' ? (
              <>
                <p className="text-sm font-black" style={{ color: accentColor }}>
                  {currentUser?.streak || 0}/{targetValue}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>days in streak</p>
              </>
            ) : (
              <>
                <p className="text-sm font-black" style={{ color: accentColor }}>
                  {participantCount}/{targetValue}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {remaining} more needed
                </p>
              </>
            )}
          </motion.div>
        )}

        {/* Reward strip */}
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{
            background: 'rgba(13,35,96,0.28)',
            border: `1px solid ${accentBorder}`,
          }}
        >
          <div className="flex-shrink-0">
            <UniqueBadge reward={challenge.reward} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Challenge Reward
            </p>
            <p className="text-sm font-black truncate" style={{ color: accentColor }}>
              {challenge.reward || 'Weekly Challenge Badge'}
            </p>
          </div>
        </div>

        {/* Join / joined button */}
        {!isExpired && (
          <button
            onClick={(e) => { e.stopPropagation(); joinMutation.mutate(); }}
            disabled={joinMutation.isPending || isParticipant}
            className="w-full h-10 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            style={
              isParticipant
                ? {
                    background: 'rgba(16,185,129,0.14)',
                    color: '#34d399',
                    border: '1px solid rgba(16,185,129,0.35)',
                    cursor: 'default',
                  }
                : {
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.22), rgba(6,182,212,0.12))',
                    color: '#22d3ee',
                    border: '1px solid rgba(6,182,212,0.4)',
                  }
            }
          >
            {isParticipant ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Joined
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                {joinMutation.isPending ? 'Joining…' : 'Join Challenge'}
              </>
            )}
          </button>
        )}

        {/* Days left chip — bottom right */}
        {!isExpired && (
          <div className="flex justify-end">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <Clock className="w-2.5 h-2.5" />
              {daysLeft}d left
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
