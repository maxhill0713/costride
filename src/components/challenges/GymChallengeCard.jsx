import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dumbbell, Users, Target, Building2, Trash2, Trophy, Flame, Zap, Award, Clock, TrendingUp, Gift } from 'lucide-react';
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-slate-900/70 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 hover:border-amber-400/50 transition-all overflow-hidden group relative">
        {/* Sparkle effect on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
        </div>
        
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white mb-2 text-sm md:text-base truncate">{challenge.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] md:text-xs inline-block">
                  {challenge.category || 'challenge'}
                </Badge>
                {daysLeft <= 3 && (
                  <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] md:text-xs inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {daysLeft}d left
                  </Badge>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 shadow-lg shadow-amber-500/30">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-3">{challenge.description}</p>

          {challenge.reward && (
            <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400">Reward</p>
                <p className="text-xs font-bold text-green-400 truncate">{challenge.reward}</p>
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-700/50 flex gap-2">
            <motion.div 
              whileHover={!userHasJoined && !isOwner ? { scale: 1.02 } : {}}
              whileTap={!userHasJoined && !isOwner ? { scale: 0.98 } : {}}
              className="flex-1"
            >
              <Button
                onClick={handleJoinClick}
                disabled={userHasJoined || isOwner}
                className={`w-full font-bold text-xs md:text-sm h-8 md:h-10 transition-all ${
                  userHasJoined 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border border-green-400/50' 
                    : isOwner
                    ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-300 cursor-not-allowed border border-slate-600'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border border-amber-400/50'
                }`}
              >
                {userHasJoined ? '✓ Joined' : isOwner ? '👑 Your Challenge' : 'Join Challenge'}
              </Button>
            </motion.div>
            {isOwner && onDelete && (
              <Button
                onClick={() => onDelete(challenge.id)}
                variant="outline"
                size="icon"
                className="border border-red-500/50 hover:bg-red-500/10 hover:border-red-500 h-8 md:h-10 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}