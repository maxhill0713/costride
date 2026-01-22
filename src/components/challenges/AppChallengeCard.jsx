import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles, Users, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';

export default function AppChallengeCard({ challenge, onJoin, isJoined = false, currentUser }) {
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const participantCount = challenge.participants?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/60 p-3 relative overflow-hidden shadow-sm">
        {/* App Challenge Badge */}
        <Badge className="absolute top-2 right-2 bg-amber-900/50 border border-amber-700/50 text-amber-200 text-[10px] font-bold">
          <Sparkles className="w-2.5 h-2.5 mr-0.5" />
          APP
        </Badge>

        <div className="relative z-10">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center mb-2 shadow-sm">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>

          {/* Content */}
          <h3 className="font-bold text-slate-100 mb-1 text-sm pr-12">{challenge.title}</h3>
          <p className="text-xs text-slate-400 mb-2 line-clamp-2">{challenge.description}</p>

          {/* Stats */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {challenge.reward && (
              <Badge className="bg-amber-900/40 border border-amber-700/40 text-amber-300 text-[10px] font-bold">
                {challenge.reward}
              </Badge>
            )}
            <Badge className="bg-slate-700/40 border border-slate-600/40 text-slate-300 text-[10px] font-semibold">
              <Users className="w-2.5 h-2.5 mr-0.5" />
              {participantCount}
            </Badge>
            <Badge className="bg-slate-700/40 border border-slate-600/40 text-slate-300 text-[10px] font-semibold">
              {daysLeft}d
            </Badge>
          </div>

          {/* Goal Info */}
          <div className="bg-slate-700/30 rounded-lg p-2 mb-2 border border-slate-700/50">
            <p className="text-[10px] font-bold text-slate-300 uppercase mb-0.5">Goal</p>
            <p className="text-xs text-slate-400">
              {challenge.goal_type === 'most_check_ins' && `${challenge.target_value} check-ins`}
              {challenge.goal_type === 'longest_streak' && `${challenge.target_value}-day streak`}
              {challenge.goal_type === 'total_weight' && `${challenge.target_value} lbs`}
              {challenge.goal_type === 'participation' && 'Most active wins'}
            </p>
          </div>

          {/* Action Button */}
          <Button 
            onClick={() => onJoin && onJoin(challenge)}
            disabled={isJoined}
            size="sm"
            className={`w-full ${
              isJoined 
                ? 'bg-green-500 hover:bg-green-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600'
            } text-white rounded-xl h-8 text-xs font-bold`}
          >
            {isJoined ? '✓ Joined' : 'Join'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}