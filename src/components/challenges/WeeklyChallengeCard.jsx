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
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-black via-yellow-900/20 to-black backdrop-blur-md border-2 border-yellow-600/60 rounded-2xl p-5 hover:border-yellow-500 hover:shadow-2xl hover:shadow-yellow-500/30 transition-all overflow-hidden relative group">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Timer Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-yellow-600/30 text-yellow-300 border border-yellow-600/60 text-xs font-bold shadow-lg backdrop-blur-sm">
            <Clock className="w-3 h-3 mr-1" />
            {isExpired ? 'Expired' : `${daysLeft}d left`}
          </Badge>
        </div>

        <div className="flex items-start gap-4 mb-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl shadow-yellow-500/50 border-2 border-yellow-400/40">
            <Trophy className="w-7 h-7 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-yellow-400 text-base mb-1.5 pr-20 tracking-tight">{challenge.title}</h3>
            <p className="text-xs text-yellow-600/80 line-clamp-2 leading-relaxed">{challenge.description}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-yellow-500 flex items-center gap-1.5 font-semibold">
              <Target className="w-3.5 h-3.5" />
              Community Progress
            </span>
            <span className="text-sm font-black text-yellow-400 tabular-nums">
              {participantCount}/{targetValue}
            </span>
          </div>
          <div className="h-3 bg-black rounded-full overflow-hidden border-2 border-yellow-600/40 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full relative shadow-lg shadow-yellow-500/50"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent" />
            </motion.div>
          </div>
        </div>

        {/* Badge Reward */}
        <div className="bg-gradient-to-r from-black/80 via-yellow-900/20 to-black/80 border-2 border-yellow-700/50 rounded-xl p-3 mb-4 flex items-center gap-3 relative z-10 shadow-lg">
          <div className="text-3xl">🏅</div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-wide mb-0.5">Reward</p>
            <p className="text-sm font-black text-yellow-400 leading-tight">{challenge.reward || 'Weekly Warrior Badge'}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="relative z-10">
          {isParticipant ? (
            <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-bold py-3 bg-green-950/30 border-2 border-green-600/40 rounded-xl">
              <CheckCircle className="w-5 h-5" />
              Joined Challenge
            </div>
          ) : (
            <Button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending || isExpired}
              className="w-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-black font-black rounded-xl h-11 border-2 border-yellow-400/50 shadow-xl shadow-yellow-600/30 hover:shadow-yellow-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joinMutation.isPending ? 'Joining...' : isExpired ? 'Expired' : 'Join Challenge'}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}