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
  const queryClient = useQueryClient();
  const isParticipant = challenge.participants?.includes(currentUser?.id);
  const participantCount = challenge.participants?.length || 0;
  const targetValue = challenge.target_value || 50;
  const progress = Math.min(100, Math.floor((participantCount / targetValue) * 100));
  
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
      <Card className="bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-950/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-5 hover:border-cyan-500/40 transition-all overflow-hidden group relative shadow-2xl shadow-black/40">
        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
        
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
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="relative h-4 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50"
              />
            </div>
          </div>

          {/* Reward Section */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 border border-cyan-500/30 rounded-xl px-3 py-2.5 mt-4 flex items-center gap-3">
            <div className="flex-shrink-0">
              <UniqueBadge reward={challenge.reward} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Challenge Reward</p>
              <p className="text-sm font-bold text-cyan-300">{challenge.reward || 'Weekly Challenge Badge'}</p>
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