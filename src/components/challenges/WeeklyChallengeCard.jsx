import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Users, Target, CheckCircle } from 'lucide-react';
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
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md border border-purple-500/30 rounded-2xl p-4 hover:border-purple-400/50 transition-all overflow-hidden relative">
        {/* Timer Badge */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {isExpired ? 'Expired' : `${daysLeft}d left`}
          </Badge>
        </div>

        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-base mb-1 pr-20">{challenge.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">{challenge.description}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Community Progress
            </span>
            <span className="text-xs font-bold text-purple-300">
              {participantCount}/{targetValue}
            </span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            />
          </div>
        </div>

        {/* Badge Reward */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 mb-3 flex items-center gap-2">
          <div className="text-2xl">🏅</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400">Complete to earn</p>
            <p className="text-xs font-bold text-purple-300">{challenge.reward || 'Weekly Warrior Badge'}</p>
          </div>
        </div>

        {/* Action Button */}
        {isParticipant ? (
          <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-semibold py-2">
            <CheckCircle className="w-4 h-4" />
            Joined
          </div>
        ) : (
          <Button
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending || isExpired}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold rounded-lg h-9"
          >
            {joinMutation.isPending ? 'Joining...' : isExpired ? 'Expired' : 'Join Challenge'}
          </Button>
        )}
      </Card>
    </motion.div>
  );
}