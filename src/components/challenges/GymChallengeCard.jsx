import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dumbbell, Users, Target, Building2, Trash2, Trophy, Flame, Zap, Award, Clock, TrendingUp, Gift, Sparkles } from 'lucide-react';
import UniqueBadge from './UniqueBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import confetti from 'canvas-confetti';

export default function GymChallengeCard({ challenge, onJoin, isJoined = false, currentUser, onDelete = null, isOwner = false }) {
  const [showStats, setShowStats] = React.useState(false);
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const isExpired = daysLeft <= 0;
  const participantCount = challenge.participants?.length || 0;
  const targetValue = challenge.target_value || 50;
  const progress = Math.min(100, Math.floor((participantCount / targetValue) * 100));
  const remaining = Math.max(0, targetValue - participantCount);
  
  // Check if user has joined
  const userHasJoined = currentUser ? (challenge.participants || []).includes(currentUser.id) : false;
  
  const handleJoinClick = () => {
    if (onJoin) {
      onJoin(challenge);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  const isBadgeReward = challenge.reward && challenge.reward.toLowerCase().includes('badge');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="rounded-2xl p-5 overflow-hidden group relative" style={{ background: 'linear-gradient(135deg, rgba(16,19,40,0.96) 0%, rgba(6,8,18,0.99) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 2px 12px rgba(0,0,0,0.35)' }}>
        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white mb-1 text-base">{challenge.title}</h4>
              <p className="text-xs text-slate-400 mb-3">{challenge.description}</p>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] inline-block">
                {challenge.target_value} {challenge.goal_type === 'participation' ? 'participants' : 'check-ins'}
              </Badge>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 shadow-lg shadow-amber-500/40">
              <Trophy className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full hover:opacity-80 transition-opacity cursor-pointer active:scale-95"
            >
              <div className="relative h-4 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-lg shadow-amber-500/50"
                />
              </div>
            </button>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 bg-slate-800/60 rounded-lg p-2 text-center border border-amber-500/30"
              >
                {challenge.goal_type === 'longest_streak' ? (
                  <>
                    <p className="text-sm font-bold text-amber-300">{currentUser?.streak || 0}/{targetValue}</p>
                    <p className="text-xs text-slate-400">days in streak</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-amber-300">{participantCount}/{targetValue}</p>
                    <p className="text-xs text-slate-400">{remaining} more needed</p>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Reward Section */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 border border-amber-500/30 rounded-xl p-5 mt-4 flex items-center gap-4">
            <div className="flex-shrink-0">
              <UniqueBadge reward={challenge.reward} size="md" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Challenge Reward</p>
              <p className="text-base font-black text-amber-200">{challenge.reward || 'Challenge Badge'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex gap-2">
            <motion.div 
              whileHover={!userHasJoined && !isExpired && !isOwner ? { scale: 1.02 } : {}}
              whileTap={!userHasJoined && !isExpired && !isOwner ? { scale: 0.98 } : {}}
              className="flex-1"
            >
              <Button
                onClick={handleJoinClick}
                disabled={userHasJoined || isExpired || isOwner}
                className={`w-full font-bold text-sm h-10 transition-all rounded-lg ${
                  userHasJoined 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border border-green-400/50 shadow-lg shadow-green-500/30' 
                    : isExpired
                    ? 'hidden'
                    : isOwner
                    ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-300 cursor-not-allowed border border-slate-600'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border border-amber-400/50 shadow-lg shadow-amber-500/30'
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
                className="border border-red-500/50 hover:bg-red-500/10 hover:border-red-500 h-10 flex-shrink-0 rounded-lg"
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