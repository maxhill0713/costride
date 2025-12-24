import React from 'react';
import { motion } from 'framer-motion';

const exercises = [
  { id: 'all', label: 'All Lifts', emoji: '🏋️' },
  { id: 'bench_press', label: 'Bench', emoji: '💪' },
  { id: 'squat', label: 'Squat', emoji: '🦵' },
  { id: 'deadlift', label: 'Deadlift', emoji: '🔥' },
  { id: 'overhead_press', label: 'OHP', emoji: '⬆️' },
  { id: 'barbell_row', label: 'Row', emoji: '🚣' },
  { id: 'power_clean', label: 'Clean', emoji: '⚡' },
];

export default function ExerciseFilter({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {exercises.map((exercise) => (
        <motion.button
          key={exercise.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(exercise.id)}
          className={`
            flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap
            transition-all duration-200 shadow-sm
            ${selected === exercise.id
              ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-md scale-105'
              : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-100'}
          `}
        >
          <span className="text-lg">{exercise.emoji}</span>
          <span>{exercise.label}</span>
        </motion.button>
      ))}
    </div>
  );
}