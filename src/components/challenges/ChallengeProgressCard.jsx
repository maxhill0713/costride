import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

export default function ChallengeProgressCard({ challenge, userProgress = 0 }) {
  const progressPercentage = Math.min(100, Math.round(userProgress * 100));
  const isStarted = userProgress > 0;
  
  const getMilestoneMessage = () => {
    if (progressPercentage >= 100) return "🎉 Challenge Complete!";
    if (progressPercentage >= 75) return "💪 Almost there! 75% complete";
    if (progressPercentage >= 50) return "🔥 Halfway there! Keep pushing";
    if (progressPercentage >= 25) return "⚡ Great start! 25% done";
    if (isStarted) return "🎯 You've started! Keep going";
    return null;
  };

  const milestone = getMilestoneMessage();

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-4 overflow-hidden relative">
      {/* Confetti Effect for Milestones */}
      {milestone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2"
        >
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs animate-pulse">
            New!
          </Badge>
        </motion.div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">{challenge.title}</h3>
          {challenge.description && (
            <p className="text-xs text-gray-600 mb-2">{challenge.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Target className="w-3 h-3" />
            <span className="font-medium">{challenge.goal_type?.replace('_', ' ')}</span>
            <span>•</span>
            <span>{challenge.exercise?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar with Animation */}
      <div className="space-y-2 mb-3">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="origin-left"
        >
          <Progress 
            value={progressPercentage} 
            className="h-5 bg-gray-200"
          />
        </motion.div>
      </div>

      <div className="space-y-2">
        {/* Milestone Message */}
        {milestone && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur rounded-xl p-3 border-2 border-purple-300"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <p className="text-sm font-bold text-purple-900">{milestone}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Challenge Period */}
      <div className="mt-3 pt-3 border-t border-purple-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Start: {challenge.start_date ? new Date(challenge.start_date).toLocaleDateString() : '—'}</span>
          <span>End: {challenge.end_date ? new Date(challenge.end_date).toLocaleDateString() : '—'}</span>
        </div>
      </div>
    </Card>
  );
}