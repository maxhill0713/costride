import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Target, Trash2, Trophy, Gift, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';

export default function GymChallengeCard({ challenge, onJoin, isJoined = false, currentUser, onDelete = null, isOwner = false }) {
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const totalDays = differenceInDays(new Date(challenge.end_date), new Date(challenge.start_date));
  const daysElapsed = totalDays - daysLeft;
  const progressPercentage = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
  const participantCount = challenge.participants?.length || 0;
  const userHasJoined = currentUser ? (challenge.participants || []).includes(currentUser.id) : false;
  
  // Timer countdown
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(challenge.end_date).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [challenge.end_date]);
  
  const handleJoinClick = () => {
    if (onJoin) {
      onJoin(challenge);
    }
  };

  const targetValue = challenge.target_value || 10;
  const progress = Math.floor((participantCount / targetValue) * 100);

  // Get participant names for display
  const participantNames = ['Alex', 'Sarah', 'Mike', 'Emma', 'John'];
  const displayCount = Math.min(participantCount, 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-slate-900/70 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 hover:border-amber-400/50 transition-all overflow-hidden group relative">
        {/* Timer - Top Right */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-800/90 backdrop-blur rounded-lg px-2 py-1">
          <Clock className="w-3 h-3 text-amber-400" />
          <div className="flex gap-0.5 text-[10px] font-bold text-white">
            <span>{timeLeft.days}d</span>
            <span>:</span>
            <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
          </div>
        </div>

        {/* Sparkle effect */}
        {progress >= 75 && (
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Star className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
        )}
        
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-20">
              <h3 className="font-bold text-white mb-2 text-sm md:text-base truncate">{challenge.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] md:text-xs">
                  {challenge.category || challenge.goal_type}
                </Badge>
                {progress >= 75 && (
                  <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] md:text-xs inline-flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Hot
                  </Badge>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 shadow-lg shadow-amber-500/30">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Participants with profile pics */}
          {participantCount > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <div className="flex -space-x-2">
                {[...Array(Math.min(displayCount, 4))].map((_, i) => (
                  <div 
                    key={i}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white"
                  >
                    {participantNames[i]?.charAt(0) || 'U'}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-300">
                <span className="font-semibold text-white">{participantNames[0] || 'Members'}</span>
                {participantCount > 1 && (
                  <span> and {participantCount - 1} other{participantCount > 2 ? 's' : ''} joined</span>
                )}
              </p>
            </div>
          )}

          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Progress
              </span>
              <span className="text-sm font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {participantCount}/{targetValue}
              </span>
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 rounded-full shadow-lg shadow-cyan-500/50 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              </motion.div>
            </div>
          </div>

          {challenge.reward && (
            <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-3 flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 mb-0.5">Reward</p>
                <p className="text-xs font-bold text-green-400 truncate">{challenge.reward}</p>
              </div>
            </div>
          )}

          {/* Action */}
          <div className="flex gap-2">
            <Button
              onClick={handleJoinClick}
              disabled={userHasJoined || isOwner}
              className={`flex-1 font-bold text-sm h-10 ${
                userHasJoined 
                  ? 'bg-emerald-600 hover:bg-emerald-600 cursor-default' 
                  : isOwner
                  ? 'bg-slate-700 hover:bg-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
              }`}
            >
              {userHasJoined ? '✓ Joined' : isOwner ? 'Your Challenge' : 'Join Challenge'}
            </Button>
            {isOwner && onDelete && (
              <Button
                onClick={() => onDelete(challenge.id)}
                variant="outline"
                size="icon"
                className="border-red-500/50 hover:bg-red-500/10 h-10 w-10"
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