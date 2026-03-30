import React from 'react';
import { Trophy, Medal, Award, TrendingUp, Video, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const rankIcons = {
  1: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/15' },
  2: { icon: Medal, color: 'text-slate-300', bg: 'bg-slate-400/15' },
  3: { icon: Award, color: 'text-orange-400', bg: 'bg-orange-400/15' },
};

function LeaderboardCard({ rank, member, lift }) {
  const RankIcon = rankIcons[rank]?.icon || null;
  const isTopThree = rank <= 3;
  const name = member?.name || lift?.member_name || 'Anonymous';
  const avatarUrl = member?.avatar_url;
  const weight = lift?.weight_lbs;
  const exercise = lift?.exercise;
  const isPR = lift?.is_pr;
  const videoUrl = lift?.video_url;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`
        relative flex items-center gap-4 p-4 rounded-3xl transition-all duration-300
        ${isTopThree
          ? 'bg-slate-800/80 border border-yellow-400/30 shadow-lg shadow-yellow-400/5'
          : 'bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/70'}
      `}
    >
      {/* Rank */}
      <div className={`
        w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm
        ${isTopThree ? rankIcons[rank]?.bg : 'bg-slate-700/50'}
        ${isTopThree ? rankIcons[rank]?.color : 'text-slate-400'}
      `}>
        {RankIcon ? <RankIcon className="w-6 h-6" /> : rank}
      </div>

      {/* Avatar */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center overflow-hidden shadow-md">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
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
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white truncate">{name}</h3>
          {videoUrl && (
            <Badge className="bg-red-500 text-white flex items-center gap-1 text-xs">
              <Video className="w-3 h-3" />
              Video
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-400 capitalize">{exercise?.replace(/_/g, ' ')}</p>
      </div>

      {/* Weight */}
      <div className="text-right">
        <div className="text-2xl font-black bg-gradient-to-br from-green-500 to-blue-600 bg-clip-text text-transparent">{weight}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wider">lbs</div>
        {videoUrl && (
          <a 
            href={videoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium mt-1"
          >
            <PlayCircle className="w-3 h-3" />
            Watch
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default React.memo(LeaderboardCard);