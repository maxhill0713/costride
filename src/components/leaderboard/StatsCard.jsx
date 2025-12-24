import React from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ icon: Icon, label, value, color = 'lime' }) {
  const colorClasses = {
    lime: 'from-green-400 to-green-500 text-green-600',
    orange: 'from-orange-400 to-orange-500 text-orange-600',
    purple: 'from-purple-400 to-purple-500 text-purple-600',
    blue: 'from-blue-400 to-blue-500 text-blue-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative overflow-hidden rounded-3xl p-5 bg-white shadow-md border-2 border-gray-100
      `}
    >
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-3 shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl font-black text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500 font-medium">{label}</div>
    </motion.div>
  );
}