import React from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ icon: Icon, label, value, color = 'lime' }) {
  const colorClasses = {
    lime: 'from-lime-400/20 to-lime-400/5 text-lime-400',
    orange: 'from-orange-400/20 to-orange-400/5 text-orange-400',
    purple: 'from-purple-400/20 to-purple-400/5 text-purple-400',
    blue: 'from-blue-400/20 to-blue-400/5 text-blue-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-2xl p-5
        bg-gradient-to-br ${colorClasses[color]}
        border border-zinc-800/50
      `}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <Icon className="w-6 h-6 mb-3" />
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-sm text-zinc-400">{label}</div>
    </motion.div>
  );
}