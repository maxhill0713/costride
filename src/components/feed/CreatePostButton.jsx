import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreatePostButton({ onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center z-40 hover:shadow-xl transition-shadow"
    >
      <Plus className="w-6 h-6 text-white" />
    </motion.button>
  );
}