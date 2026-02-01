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
      <Card className="relative p-3 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-2 border-blue-500/40 hover:border-blue-400/60 transition-all duration-300 shadow-2xl hover:shadow-blue-500/20 overflow-hidden">
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

        {/* Goal Card - Gamified */}
        <div className="bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-xl p-4 mb-3 border-2 border-blue-400/30 shadow-lg relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-[10px] font-black text-blue-300 uppercase mb-1.5 flex items-center gap-1.5 tracking-wider">
                <Target className="w-4 h-4" />
                Mission Objective
              </p>
              <p className="text-base text-white font-black flex items-center gap-2">
                <span className="text-2xl">{
                  challenge.goal_type === 'most_check_ins' ? '✓' :
                  challenge.goal_type === 'longest_streak' ? '🔥' :
                  challenge.goal_type === 'total_weight' ? '💪' : '🎯'
                }</span>
                {challenge.goal_type === 'most_check_ins' && `${challenge.target_value} check-ins`}
                {challenge.goal_type === 'longest_streak' && `${challenge.target_value}-day streak`}
                {challenge.goal_type === 'total_weight' && `${challenge.target_value} lbs`}
                {challenge.goal_type === 'participation' && 'Most active wins'}
              </p>
            </div>
            <div className="flex gap-4">
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="text-center bg-slate-800/60 border border-cyan-400/30 rounded-xl px-3 py-2 min-w-[60px]"
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <p className="text-base font-black text-cyan-300">{participantCount}</p>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Players</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="text-center bg-slate-800/60 border border-purple-400/30 rounded-xl px-3 py-2 min-w-[60px]"
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <p className="text-base font-black text-purple-300">{daysLeft}</p>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Days</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Progress Bar - Enhanced */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <p className="text-xs font-black text-slate-300 uppercase">Challenge Progress</p>
            </div>
            <motion.p 
              key={progressPercentage}
              initial={{ scale: 1.5, color: '#22d3ee' }}
              animate={{ scale: 1, color: '#94a3b8' }}
              className="text-sm text-slate-400 font-black"
            >
              {Math.round(progressPercentage)}%
            </motion.p>
          </div>
          <div className="relative h-3 bg-slate-800/80 rounded-full overflow-hidden border-2 border-slate-700/50 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 shadow-lg relative"
            >
              {/* Animated shine effect on progress bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
            {/* Milestone markers */}
            <div className="absolute inset-0 flex justify-between px-1">
              {[25, 50, 75].map(milestone => (
                <div 
                  key={milestone}
                  className="w-0.5 h-full bg-slate-600/50"
                  style={{ marginLeft: `${milestone}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-1.5 px-1">
            <p className="text-[9px] text-slate-500 font-bold">START</p>
            <p className="text-[9px] text-slate-500 font-bold">FINISH</p>
          </div>
        </div>

        {/* Join Button / Delete Button - Gamified */}
        <div className="flex gap-2">
          <motion.div 
            whileHover={!userHasJoined && !isOwner ? { scale: 1.02 } : {}}
            whileTap={!userHasJoined && !isOwner ? { scale: 0.98 } : {}}
            className="flex-1"
          >
            <Button
              onClick={handleJoinClick}
              disabled={userHasJoined || isOwner}
              className={`w-full font-black text-sm h-12 transition-all duration-200 ${
                userHasJoined 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white cursor-default shadow-lg shadow-green-500/30 border-2 border-green-400/50' 
                  : isOwner
                  ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-300 cursor-not-allowed border-2 border-slate-600'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-xl hover:shadow-green-500/40 border-2 border-green-400/50 animate-pulse'
              }`}
            >
              <span className="flex items-center gap-2">
                {userHasJoined ? (
                  <>
                    <Award className="w-5 h-5" />
                    <span>✓ JOINED • Earn {difficulty.points} XP</span>
                  </>
                ) : isOwner ? (
                  <>
                    <Trophy className="w-5 h-5" />
                    <span>👑 YOUR CHALLENGE</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-5 h-5 animate-bounce" />
                    <span>JOIN NOW • Win {difficulty.points} XP</span>
                  </>
                )}
              </span>
            </Button>
          </motion.div>
          {isOwner && onDelete && (
            <Button
              onClick={() => onDelete(challenge.id)}
              variant="outline"
              size="icon"
              className="border-2 border-red-500/50 hover:bg-red-500/20 hover:border-red-500 h-12 w-12"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}