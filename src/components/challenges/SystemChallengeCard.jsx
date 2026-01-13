import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, Target, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SystemChallengeCard({ challenge, onJoin, isJoined = false }) {
  const getChallengeIcon = () => {
    switch(challenge.type) {
      case 'weekend': return Zap;
      case 'weekly': return Target;
      case 'streak': return Trophy;
      default: return Award;
    }
  };

  const Icon = getChallengeIcon();

  const gradients = {
    weekend: 'from-yellow-500 to-orange-500',
    weekly: 'from-blue-500 to-cyan-500',
    streak: 'from-purple-500 to-pink-500',
    default: 'from-green-500 to-teal-500'
  };

  const bgGradients = {
    weekend: 'from-yellow-50 to-orange-50 border-yellow-200',
    weekly: 'from-blue-50 to-cyan-50 border-blue-200',
    streak: 'from-purple-50 to-pink-50 border-purple-200',
    default: 'from-green-50 to-teal-50 border-green-200'
  };

  const gradient = gradients[challenge.type] || gradients.default;
  const bgGradient = bgGradients[challenge.type] || bgGradients.default;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`bg-gradient-to-br ${bgGradient} border-2 p-4 relative overflow-hidden`}>
        <motion.div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <Badge className="absolute top-3 right-3 bg-white/90 text-gray-700 text-xs font-bold">
          {challenge.timeframe}
        </Badge>

        <div className="flex items-start gap-3 relative z-10">
          <motion.div 
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
            animate={{ 
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            <Icon className="w-7 h-7 text-white" />
          </motion.div>
          <div className="flex-1">
            <h3 className="font-black text-gray-900 mb-1 text-lg">{challenge.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`bg-gradient-to-r ${gradient} text-white text-xs`}>
                {challenge.reward}
              </Badge>
            </div>
            <Button 
              onClick={() => onJoin && onJoin(challenge)}
              disabled={isJoined}
              className={`w-full ${
                isJoined 
                  ? 'bg-green-500 hover:bg-green-500 cursor-not-allowed' 
                  : `bg-gradient-to-r ${gradient} hover:opacity-90`
              } text-white rounded-2xl h-9 text-sm font-bold shadow-md`}
            >
              {isJoined ? '✓ Joined' : '⚡ Join Challenge'}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}