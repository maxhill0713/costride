import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Dumbbell, Users, Target, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';

export default function GymChallengeCard({ challenge, onJoin, isJoined = false, currentUser }) {
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const participantCount = challenge.participants?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border-2 border-blue-200 p-5 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400 rounded-full blur-2xl" />
        </div>

        {/* Gym Badge */}
        <Badge className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-semibold">
          <Building2 className="w-3 h-3 mr-1" />
          {challenge.gym_name}
        </Badge>

        <div className="relative z-10">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3 shadow-lg">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>

          {/* Content */}
          <h3 className="font-black text-gray-900 mb-2 text-lg pr-24">{challenge.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>

          {/* Stats */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {challenge.reward && (
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs">
                {challenge.reward}
              </Badge>
            )}
            <Badge className="bg-white text-gray-700 text-xs font-semibold">
              <Users className="w-3 h-3 mr-1" />
              {participantCount}
            </Badge>
            <Badge className="bg-white text-gray-700 text-xs font-semibold">
              {daysLeft}d left
            </Badge>
          </div>

          {/* Goal Info */}
          <div className="bg-white/80 rounded-lg p-3 mb-4 border border-blue-200">
            <p className="text-xs font-bold text-blue-900 uppercase mb-1">
              <Target className="w-3 h-3 inline mr-1" />
              Goal
            </p>
            <p className="text-sm text-gray-800">
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
            className={`w-full ${
              isJoined 
                ? 'bg-green-500 hover:bg-green-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
            } text-white rounded-2xl h-10 text-sm font-bold shadow-md`}
          >
            {isJoined ? '✓ Joined' : 'Join Challenge'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}