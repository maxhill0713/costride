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
      await base44.entities.Challenge.update(challenge.id, {
        participants: updatedParticipants
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyChallenges'] });
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-slate-900/70 backdrop-blur-sm border border-purple-500/30 rounded-xl p-5 hover:border-purple-500/50 hover:bg-slate-900/80 transition-all overflow-hidden relative group">
        {/* Timer Badge */}
        <div className="absolute top-4 right-4 z-10">
          <Badge className={`text-xs font-semibold ${isExpired ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-green-500/20 text-green-300 border border-green-500/40'}`}>
            <Clock className="w-3 h-3 mr-1" />
            {isExpired ? 'Ended' : `${daysLeft}d left`}
          </Badge>
        </div>

        <div className="flex items-start gap-4 mb-4 relative z-10">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${isExpired ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-100 text-base mb-1 pr-20">{challenge.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">{challenge.description}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">
              Community Progress
            </span>
            <span className="text-sm font-bold text-slate-200">
              {participantCount}/{targetValue}
            </span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${isExpired ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}
            />
          </div>
        </div>

        {/* Reward */}
        <div className="bg-slate-700/30 border border-slate-600/40 rounded-lg p-3 mb-4 flex items-center gap-3 relative z-10">
          <div className="text-2xl">🏆</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Reward</p>
            <p className="text-sm font-semibold text-slate-200">{challenge.reward || 'Weekly Warrior Badge'}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="relative z-10">
          {isParticipant ? (
            <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-semibold py-2.5 bg-green-900/20 border border-green-600/30 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              Participating
            </div>
          ) : (
            <Button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending || isExpired}
              className={`w-full text-white font-semibold rounded-lg h-10 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isExpired ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'}`}
            >
              {joinMutation.isPending ? 'Joining...' : isExpired ? 'Challenge Ended' : 'Join Challenge'}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}