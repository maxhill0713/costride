import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dumbbell, Users, Target, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';

export default function GymChallengeCard({ challenge, onJoin, isJoined = false, currentUser }) {
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
      <Card className="p-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border-2 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 shadow-xl hover:shadow-blue-500/10">
        {/* Header with Title and Reward */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/40 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-blue-400" />
              </div>
              <Badge className="bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-bold px-2 flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5" />
                GYM CHALLENGE
              </Badge>
            </div>
            <h3 className="font-bold text-white mb-1 line-clamp-1">{challenge.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">{challenge.description}</p>
          </div>
          {challenge.reward && (
            <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/15 border border-green-400/30 rounded-lg px-2.5 py-1.5 text-center shadow-sm">
              <p className="text-[9px] font-bold text-green-300 uppercase">Prize</p>
              <p className="text-xs font-bold text-white mt-0.5">{challenge.reward}</p>
            </div>
          )}
        </div>

        {/* Goal Card */}
        <div className="bg-gradient-to-r from-blue-500/12 to-cyan-500/12 rounded-lg p-3 mb-3 border border-blue-400/25">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-blue-300 uppercase mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Goal
              </p>
              <p className="text-sm text-white font-bold">
                {challenge.goal_type === 'most_check_ins' && `${challenge.target_value} check-ins`}
                {challenge.goal_type === 'longest_streak' && `${challenge.target_value}-day streak`}
                {challenge.goal_type === 'total_weight' && `${challenge.target_value} lbs`}
                {challenge.goal_type === 'participation' && 'Most active wins'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-center">
                <p className="text-sm font-bold text-cyan-300">{participantCount}</p>
                <p className="text-[9px] text-slate-400">Players</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-purple-300">{daysLeft}d</p>
                <p className="text-[9px] text-slate-400">Left</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs font-bold text-slate-300">Time Progress</p>
            <p className="text-xs text-slate-400 font-medium">{Math.round(progressPercentage)}%</p>
          </div>
          <div className="h-2.5 bg-slate-700/60 rounded-full overflow-hidden border border-slate-600/50">
            <div 
              className="h-full bg-gradient-to-r from-blue-300 via-cyan-300 to-sky-300 transition-all duration-500 shadow-lg"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Join Button */}
        <Button
          onClick={() => onJoin && onJoin(challenge)}
          disabled={isJoined}
          className={`w-full font-bold transition-all duration-200 ${
            isJoined 
              ? 'bg-slate-700 text-slate-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 text-white shadow-lg hover:shadow-green-500/20'
          }`}
        >
          {isJoined ? '✓ Already Joined' : 'Join Challenge'}
        </Button>
      </Card>
    </motion.div>
  );
}