import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Target, Award, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';

export default function AppChallengeCard({ challenge, onJoin, isJoined = false, currentUser, gymImage }) {
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const totalDays = differenceInDays(new Date(challenge.end_date), new Date(challenge.start_date));
  const daysElapsed = totalDays - daysLeft;
  const progressPercentage = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
  const participantCount = challenge.participants?.length || 0;
  const isBadgeReward = challenge.reward && challenge.reward.toLowerCase().includes('badge');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-950/80 backdrop-blur-xl border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden relative group">
        {/* Gym Background Image */}
        {gymImage && (
          <div className="absolute inset-0 h-20 w-full overflow-hidden">
            <img src={gymImage} alt="Gym" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80" />
          </div>
        )}
        
        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all" />
        
        <div className="relative z-10 p-5">
        {/* Header with Title and Reward */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/40 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-orange-400" />
              </div>
              <Badge className="bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-bold px-2 uppercase tracking-wider">
                App Challenge
              </Badge>
            </div>
            <h3 className="font-bold text-white mb-1 line-clamp-1 text-base">{challenge.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">{challenge.description}</p>
          </div>
          {challenge.reward && isBadgeReward ? (
            <div className="relative w-14 h-14 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-full p-1 shadow-lg shadow-yellow-500/40">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center">
                  <Award className="w-7 h-7 text-white" />
                </div>
              </div>
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          ) : challenge.reward && (
            <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-400/30 rounded-lg px-3 py-2 text-center shadow-sm">
              <p className="text-[9px] font-bold text-emerald-300 uppercase">Reward</p>
              <p className="text-xs font-bold text-white mt-1">{challenge.reward}</p>
            </div>
          )}
        </div>

        {/* Goal Card */}
        <div className="bg-gradient-to-r from-indigo-500/12 to-purple-500/12 rounded-lg p-4 mb-4 border border-indigo-400/25">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1 tracking-wider flex items-center gap-1">
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
                <p className="text-sm font-bold text-purple-300">{participantCount}</p>
                <p className="text-[9px] text-slate-400">Players</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-orange-300">{daysLeft}d</p>
                <p className="text-[9px] text-slate-400">Left</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Time Progress</p>
            <p className="text-xs text-slate-400 font-medium">{Math.round(progressPercentage)}%</p>
          </div>
          <div className="h-2.5 bg-slate-700/60 rounded-full overflow-hidden border border-slate-600/50">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 transition-all duration-500 shadow-lg shadow-orange-500/40"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Join Button */}
        <Button
          onClick={() => onJoin && onJoin(challenge)}
          disabled={isJoined}
          className={`w-full font-bold transition-all duration-200 rounded-lg h-10 ${
            isJoined 
              ? 'bg-slate-700 text-slate-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30'
          }`}
        >
          {isJoined ? '✓ Already Joined' : 'Join Challenge'}
        </Button>
        </div>
      </Card>
    </motion.div>
  );
}