import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dumbbell, Users, Target, Building2, Trash2, Trophy, Flame, Zap, Award, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import confetti from 'canvas-confetti';

export default function GymChallengeCard({ challenge, onJoin, isJoined = false, currentUser, onDelete = null, isOwner = false }) {
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const totalDays = differenceInDays(new Date(challenge.end_date), new Date(challenge.start_date));
  const daysElapsed = totalDays - daysLeft;
  const progressPercentage = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
  const participantCount = challenge.participants?.length || 0;
  
  // Check if user has joined by checking if their ID is in participants array
  const userHasJoined = currentUser ? (challenge.participants || []).includes(currentUser.id) : false;
  
  // Gamification elements
  const getDifficultyLevel = () => {
    if (challenge.target_value <= 5) return { label: 'Easy', color: 'from-green-400 to-emerald-500', icon: '🌟', points: 100 };
    if (challenge.target_value <= 15) return { label: 'Medium', color: 'from-yellow-400 to-orange-500', icon: '⚡', points: 250 };
    if (challenge.target_value <= 30) return { label: 'Hard', color: 'from-orange-400 to-red-500', icon: '🔥', points: 500 };
    return { label: 'Legendary', color: 'from-purple-400 to-pink-500', icon: '👑', points: 1000 };
  };
  
  const difficulty = getDifficultyLevel();
  
  const getUrgencyStatus = () => {
    if (daysLeft <= 1) return { label: 'ENDS SOON!', color: 'from-red-500 to-orange-500', pulse: true };
    if (daysLeft <= 3) return { label: 'Hurry!', color: 'from-orange-400 to-yellow-500', pulse: true };
    if (daysLeft <= 7) return { label: 'Act Fast', color: 'from-yellow-400 to-amber-500', pulse: false };
    return null;
  };
  
  const urgency = getUrgencyStatus();
  
  const handleJoinClick = () => {
    if (onJoin) {
      onJoin(challenge);
      // Confetti effect
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative p-4 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-2 border-blue-500/40 hover:border-blue-400/60 transition-all duration-300 shadow-2xl hover:shadow-blue-500/20 overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Urgency banner */}
        <AnimatePresence>
          {urgency && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute top-0 left-0 right-0 bg-gradient-to-r ${urgency.color} py-1 px-3 text-center ${urgency.pulse ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Clock className="w-3 h-3 text-white animate-bounce" />
                <p className="text-[10px] font-black text-white uppercase tracking-wider">{urgency.label} • {daysLeft}d remaining</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className={urgency ? 'mt-6' : ''}>
          {/* Header with Title and Reward */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-2 border-blue-400/50 flex items-center justify-center shadow-lg">
                  <Trophy className="w-5 h-5 text-blue-300" />
                </div>
                <Badge className={`bg-gradient-to-r ${difficulty.color} border-0 text-white text-[10px] font-black px-2.5 py-1 shadow-md`}>
                  {difficulty.icon} {difficulty.label.toUpperCase()}
                </Badge>
                <Badge className="bg-blue-500/25 border border-blue-400/50 text-blue-200 text-[10px] font-bold px-2 flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5" />
                  GYM
                </Badge>
              </div>
              <h3 className="font-black text-white text-lg mb-1.5 line-clamp-1">{challenge.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-2">{challenge.description}</p>
              
              {/* XP Points Display */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-400/40 rounded-lg px-2.5 py-1">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-black text-purple-300">{difficulty.points} XP</span>
                </div>
                {userHasJoined && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 bg-green-500/20 border border-green-400/40 rounded-lg px-2.5 py-1"
                  >
                    <Award className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs font-black text-green-300">ACTIVE</span>
                  </motion.div>
                )}
              </div>
            </div>
            {challenge.reward && (
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-2 border-yellow-400/50 rounded-xl px-3 py-2 text-center shadow-xl"
              >
                <p className="text-2xl mb-1">🏆</p>
                <p className="text-[9px] font-bold text-yellow-300 uppercase">Prize</p>
                <p className="text-xs font-black text-white mt-0.5">{challenge.reward}</p>
              </motion.div>
            )}
          </div>
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

        {/* Join Button / Delete Button */}
        <div className="flex gap-2">
          <Button
            onClick={() => onJoin && onJoin(challenge)}
            disabled={userHasJoined || isOwner}
            className={`flex-1 font-bold transition-all duration-200 ${
              userHasJoined 
                ? 'bg-slate-700 text-slate-300 cursor-not-allowed' 
                : isOwner
                ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 text-white shadow-lg hover:shadow-green-500/20'
            }`}
          >
            {userHasJoined ? '✓ Joined' : isOwner ? '👑 Your Challenge' : 'Join Challenge'}
          </Button>
          {isOwner && onDelete && (
            <Button
              onClick={() => onDelete(challenge.id)}
              variant="outline"
              size="icon"
              className="border-red-500/50 hover:bg-red-500/10 hover:border-red-500"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}