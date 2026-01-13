import React from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MiniLeaderboard({ topParticipants = [] }) {
  const medals = [
    { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-100', label: '🥇' },
    { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-100', label: '🥈' },
    { icon: Award, color: 'text-orange-600', bg: 'bg-orange-100', label: '🥉' }
  ];

  if (!topParticipants || topParticipants.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-gray-900 text-sm">Top Performers</h3>
      </div>
      <div className="space-y-2">
        {topParticipants.slice(0, 3).map((participant, index) => {
          const medal = medals[index];
          return (
            <motion.div
              key={participant.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 bg-white/60 rounded-xl p-2"
            >
              <div className="text-xl">{medal.label}</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">{participant.name}</p>
                <p className="text-xs text-gray-600">{participant.progress} complete</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-indigo-600 text-sm">{participant.score}</p>
                <p className="text-xs text-gray-500">pts</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}