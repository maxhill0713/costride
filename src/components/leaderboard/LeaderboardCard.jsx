import React from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const rankIcons = {
  1: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  2: { icon: Medal, color: 'text-slate-300', bg: 'bg-slate-300/10' },
  3: { icon: Award, color: 'text-amber-600', bg: 'bg-amber-600/10' },
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
        relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300
        ${isTopThree 
          ? 'bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700/50' 
          : 'bg-zinc-900/50 hover:bg-zinc-800/50'}
      `}
    >
      {/* Rank */}
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
        ${isTopThree ? rankIcons[rank]?.bg : 'bg-zinc-800'}
        ${isTopThree ? rankIcons[rank]?.color : 'text-zinc-400'}
      `}>
        {RankIcon ? <RankIcon className="w-6 h-6" /> : rank}
      </div>

      {/* Avatar */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 p-0.5">
          <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-lime-400">
                {name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        {isPR && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
            <TrendingUp className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">{name}</h3>
        <p className="text-sm text-zinc-500 capitalize">{exercise?.replace(/_/g, ' ')}</p>
      </div>

      {/* Weight */}
      <div className="text-right">
        <div className="text-2xl font-black text-lime-400">{weight}</div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider">lbs</div>
      </div>
    </motion.div>
  );
}