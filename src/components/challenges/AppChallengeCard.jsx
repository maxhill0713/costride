import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Sparkles, Users, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';

export default function AppChallengeCard({ challenge, onJoin, isJoined = false, currentUser }) {
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const totalDays = differenceInDays(new Date(challenge.end_date), new Date(challenge.start_date));
  const daysElapsed = totalDays - daysLeft;
  const progressPercentage = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
  const participantCount = challenge.participants?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-slate-700 to-slate-800 backdrop-blur-sm border-2 border-amber-500/40 p-3 relative overflow-hidden shadow-lg shadow-amber-500/20">
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
              <Badge className="bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-emerald-400/50 text-emerald-200 text-[10px] font-bold shadow-sm shadow-emerald-500/20 animate-pulse">
                🎁 {challenge.reward}
              </Badge>
            )}
            <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/40 text-purple-200 text-[10px] font-bold">
              <Users className="w-2.5 h-2.5 mr-0.5" />
              {participantCount}
            </Badge>
            <Badge className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/40 text-orange-200 text-[10px] font-bold">
              ⏰ {daysLeft}d
            </Badge>
          </div>

          {/* Goal Info */}
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-2 mb-2 border-2 border-indigo-400/40 shadow-sm shadow-indigo-500/20">
            <p className="text-[10px] font-bold text-indigo-200 uppercase mb-0.5 flex items-center gap-1">
              🎯 Goal
            </p>
            <p className="text-xs text-indigo-100 font-bold">
              {challenge.goal_type === 'most_check_ins' && `${challenge.target_value} check-ins`}
              {challenge.goal_type === 'longest_streak' && `${challenge.target_value}-day streak`}
              {challenge.goal_type === 'total_weight' && `${challenge.target_value} lbs`}
              {challenge.goal_type === 'participation' && 'Most active wins'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                ⚡ Progress
              </p>
              <p className="text-[10px] text-slate-400 font-bold">{daysElapsed}/{totalDays} days</p>
            </div>
            <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden border border-slate-600/50">
              <div 
                className="h-full bg-gradient-to-r from-pink-400 via-rose-400 to-red-400 transition-all duration-300 shadow-lg shadow-pink-500/50"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={() => onJoin && onJoin(challenge)}
            disabled={isJoined}
            size="sm"
            className={`w-full ${
              isJoined 
                ? 'bg-green-600/60 hover:bg-green-600/60 cursor-not-allowed text-green-100' 
                : 'bg-amber-900/50 hover:bg-amber-900/70 border border-amber-700/50 text-amber-200'
            } rounded-xl h-8 text-xs font-bold transition-colors`}
          >
            {isJoined ? '✓ Joined' : 'Join'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}