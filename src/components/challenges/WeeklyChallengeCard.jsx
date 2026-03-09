import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Users, Target, CheckCircle, Zap, Gift, Award, Sparkles } from 'lucide-react';
import UniqueBadge from './UniqueBadge';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
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

  const isBadgeReward = challenge.reward && challenge.reward.toLowerCase().includes('badge');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="rounded-2xl p-5 overflow-hidden group relative" style={{
        background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        transition: 'all 0.22s ease'
      }}>

        {/* Top shine — matches Progress page cards */}
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none z-10"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />

        {/* Radial glow — matches Progress page cards */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ background: 'radial-gradient(ellipse at 25% 35%, rgba(6,182,212,0.2) 0%, transparent 60%)', opacity: 0.09 }} />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white mb-1 text-base">{challenge.title}</h4>
              <p className="text-xs text-slate-400 mb-2">{challenge.description}</p>

            </div>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 shadow-lg overflow-hidden">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/5a4c7be8b_Untitleddesign-7.jpg" alt="Challenge" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full hover:opacity-80 transition-opacity cursor-pointer active:scale-95"
            >
              <div className="relative h-4 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50"
                />
              </div>
            </button>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 bg-slate-800/60 rounded-lg p-2 text-center border border-cyan-500/30"
              >
                {challenge.goal_type === 'longest_streak' ? (
                  <>
                    <p className="text-sm font-bold text-cyan-300">{currentUser?.streak || 0}/{targetValue}</p>
                    <p className="text-xs text-slate-400">days in streak</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-cyan-300">{participantCount}/{targetValue}</p>
                    <p className="text-xs text-slate-400">{remaining} more needed</p>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Reward Section */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 border border-cyan-500/30 rounded-xl px-3 py-2.5 mt-4 flex items-center gap-3">
            <div className="flex-shrink-0">
              <UniqueBadge reward={challenge.reward} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Challenge Reward</p>
              <p className="text-base font-black text-cyan-200">{challenge.reward || 'Weekly Challenge Badge'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex gap-2">
            <motion.div 
              whileHover={!isParticipant && !isExpired ? { scale: 1.02 } : {}}
              whileTap={!isParticipant && !isExpired ? { scale: 0.98 } : {}}
              className="flex-1"
            >
              <Button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending || isExpired || isParticipant}
                className={`w-full font-bold text-sm h-10 transition-all rounded-lg ${
                  isParticipant 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border border-green-400/50 shadow-lg shadow-green-500/30' 
                    : isExpired
                    ? 'hidden'
                    : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border border-cyan-400/50 shadow-lg shadow-cyan-500/30'
                }`}
              >
                {isParticipant ? '✓ Joined' : 'Join Challenge'}
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
