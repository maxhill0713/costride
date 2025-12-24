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
            flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap
            transition-all duration-200
            ${selected === exercise.id
              ? 'bg-lime-400 text-zinc-900'
              : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}
          `}
        >
          <span>{exercise.emoji}</span>
          <span>{exercise.label}</span>
        </motion.button>
      ))}
    </div>
  );
}