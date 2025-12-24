import React from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const rankIcons = {
  1: { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  2: { icon: Medal, color: 'text-gray-600', bg: 'bg-gray-100' },
  3: { icon: Award, color: 'text-orange-600', bg: 'bg-orange-100' },
};

export default function LeaderboardCard({ rank, name, weight, exercise, isPR, avatarUrl }) {
  const RankIcon = rankIcons[rank]?.icon || null;
  const isTopThree = rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`
        relative flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 shadow-sm
        ${isTopThree 
          ? 'bg-white border-2 border-yellow-300 shadow-md' 
          : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-md'}
      `}
    >
      {/* Rank */}
      <div className={`
        w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm
        ${isTopThree ? rankIcons[rank]?.bg : 'bg-gray-50'}
        ${isTopThree ? rankIcons[rank]?.color : 'text-gray-500'}
      `}>
        {RankIcon ? <RankIcon className="w-6 h-6" /> : rank}
      </div>

      {/* Avatar */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center overflow-hidden shadow-md">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-white">
              {name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>
        {isPR && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <TrendingUp className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 truncate">{name}</h3>
        <p className="text-sm text-gray-500 capitalize">{exercise?.replace(/_/g, ' ')}</p>
      </div>

      {/* Weight */}
      <div className="text-right">
        <div className="text-2xl font-black bg-gradient-to-br from-green-500 to-blue-600 bg-clip-text text-transparent">{weight}</div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">lbs</div>
      </div>
    </motion.div>
  );
}