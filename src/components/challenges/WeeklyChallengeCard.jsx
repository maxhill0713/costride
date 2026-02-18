import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Users, Target, CheckCircle, Zap, Gift } from 'lucide-react';
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-cyan-400/30 transition-all overflow-hidden group relative shadow-2xl shadow-black/20">
         <div className="relative">
           <div className="flex items-start justify-between mb-3">
             <div className="flex-1 min-w-0">
               <h4 className="font-bold text-white mb-2 text-sm text-slate-300">{challenge.title}</h4>
              <p className="text-xs text-slate-400 mb-2">{challenge.description}</p>
              <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] inline-block">
                {challenge.target_value} check-ins
              </Badge>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 shadow-lg shadow-cyan-500/30">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-3 flex items-center gap-2 mt-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400">Reward</p>
              <p className="text-xs font-bold text-green-400">{challenge.reward || 'Weekly Warrior Badge'}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-bold text-slate-400">Progress</p>
              <p className="text-[10px] font-bold text-cyan-400">{Math.round(progress)}%</p>
            </div>
            <div className="relative h-2 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600"
              />
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <motion.div 
              whileHover={!isParticipant && !isExpired ? { scale: 1.02 } : {}}
              whileTap={!isParticipant && !isExpired ? { scale: 0.98 } : {}}
              className="flex-1"
            >
              <Button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending || isExpired || isParticipant}
                className={`w-full font-bold text-xs md:text-sm h-8 md:h-10 transition-all ${
                  isParticipant 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border border-green-400/50' 
                    : isExpired
                    ? 'hidden'
                    : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border border-cyan-400/50'
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