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
      <Card className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-2 border-yellow-300 p-5 relative overflow-hidden shadow-xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-400 to-red-400 rounded-full blur-3xl" />
        </div>

        {/* App Challenge Badge */}
        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold shadow-lg">
          <Sparkles className="w-3 h-3 mr-1" />
          APP CHALLENGE
        </Badge>

        <div className="relative z-10">
          {/* Icon */}
          <motion.div 
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 flex items-center justify-center mb-4 shadow-xl shadow-orange-500/40"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>

          {/* Content */}
          <h3 className="font-black text-gray-900 mb-2 text-xl">{challenge.title}</h3>
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">{challenge.description}</p>

          {/* Stats */}
          <div className="flex items-center gap-3 mb-4">
            {challenge.reward && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold">
                <Award className="w-3 h-3 mr-1" />
                {challenge.reward}
              </Badge>
            )}
            <Badge className="bg-white/80 text-gray-800 text-xs font-semibold">
              <Users className="w-3 h-3 mr-1" />
              {participantCount} joined
            </Badge>
            <Badge className="bg-white/80 text-gray-800 text-xs font-semibold">
              {daysLeft}d left
            </Badge>
          </div>

          {/* Goal Info */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 mb-4 border border-orange-200">
            <p className="text-xs font-bold text-orange-900 uppercase mb-1">Challenge Goal</p>
            <p className="text-sm text-gray-800">
              {challenge.goal_type === 'most_check_ins' && `Complete ${challenge.target_value} check-ins`}
              {challenge.goal_type === 'longest_streak' && `Maintain a ${challenge.target_value}-day streak`}
              {challenge.goal_type === 'total_weight' && `Lift ${challenge.target_value} lbs total`}
              {challenge.goal_type === 'participation' && 'Most active participant wins'}
            </p>
          </div>

          {/* Action Button */}
          <Button 
            onClick={() => onJoin && onJoin(challenge)}
            disabled={isJoined}
            className={`w-full ${
              isJoined 
                ? 'bg-green-500 hover:bg-green-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600'
            } text-white rounded-2xl h-11 text-sm font-bold shadow-lg`}
          >
            {isJoined ? (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                You're In! 🎉
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Join Challenge
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}