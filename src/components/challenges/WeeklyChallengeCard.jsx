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
      <Card className="bg-gradient-to-br from-black/80 to-yellow-900/40 backdrop-blur-md border border-yellow-600/40 rounded-2xl p-4 hover:border-yellow-500/60 transition-all overflow-hidden relative">
        {/* Timer Badge */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-yellow-600/20 text-yellow-400 border border-yellow-600/40 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {isExpired ? 'Expired' : `${daysLeft}d left`}
          </Badge>
        </div>

        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-amber-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Trophy className="w-6 h-6 text-black" />
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
            <span className="text-xs font-bold text-yellow-400">
              {participantCount}/{targetValue}
            </span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-yellow-600 to-amber-500 rounded-full"
            />
          </div>
        </div>

        {/* Badge Reward */}
        <div className="bg-black/50 border border-yellow-700/50 rounded-lg p-2 mb-3 flex items-center gap-2">
          <div className="text-2xl">🏅</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400">Complete to earn</p>
            <p className="text-xs font-bold text-yellow-400">{challenge.reward || 'Weekly Warrior Badge'}</p>
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
            className="w-full bg-gradient-to-r from-black to-yellow-600 hover:from-black hover:to-yellow-700 text-yellow-400 font-bold rounded-lg h-9 border border-yellow-600/40"
          >
            {joinMutation.isPending ? 'Joining...' : isExpired ? 'Expired' : 'Join Challenge'}
          </Button>
        )}
      </Card>
    </motion.div>
  );
}