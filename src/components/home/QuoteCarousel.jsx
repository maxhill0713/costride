import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const quotes = [
  {
    text: "We can't become what we need to be by remaining what we are.",
    author: "Oprah Winfrey",
    context: "Growth requires change. We must evolve, challenge ourselves, and adopt new perspectives to reach our full potential and transform into our best selves."
  },
  {
    text: "Be not afraid of growing slowly; be afraid only of standing still.",
    author: "Chinese Proverb",
    context: "Progress matters more than pace. Stagnation is the real danger. Continuous, steady improvement—no matter how gradual—creates meaningful growth and prevents regression."
  },
  {
    text: "Do the best you can until you know better. Then when you know better, do better.",
    author: "Maya Angelou",
    context: "Self-improvement is a journey, not judgment. We act with our current knowledge, but once we gain new insight, we evolve and improve accordingly."
  }
];

export default function QuoteCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const paginate = (newDirection) => {
    const next = current + newDirection;
    if (next < 0 || next >= quotes.length) return;
    setDirection(newDirection);
    setCurrent(next);
  };

  const handleDragEnd = (e, info) => {
    if (info.offset.x < -50) paginate(1);
    else if (info.offset.x > 50) paginate(-1);
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 })
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-slate-950/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-slate-950/50 flex flex-col overflow-hidden select-none relative"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 50%, rgba(6, 17, 34, 0.85) 100%)'
      }}
      animate={{ minHeight: expanded ? '324px' : '224px' }}
      transition={{ duration: 0.3 }}
    >
      {/* Decorative gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Dots */}
      <div className="flex justify-center gap-2 pt-5 pb-1 relative z-10">
        <LayoutGroup>
          {quotes.map((_, i) => (
            <motion.button
              key={i}
              layoutId={i === current ? 'active-dot' : undefined}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              animate={{
                width: i === current ? '14px' : '8px',
              }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
              className={`h-2 rounded-full transition-colors duration-300 ${i === current ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-slate-600/60 hover:bg-slate-500'}`}
            />
          ))}
        </LayoutGroup>
      </div>

      {/* Swipeable Quote */}
      <div className="flex-1 relative overflow-hidden px-8 flex items-center justify-center pt-6 z-10">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing -mt-4"
          >
            <p className="text-white text-lg font-light text-center leading-relaxed italic tracking-tight">
              "{quotes[current].text}"
            </p>
            <p className="mt-5 text-slate-300 text-sm font-medium tracking-widest opacity-90">
              — {quotes[current].author}
            </p>
            {expanded && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 text-slate-400 text-sm text-center leading-relaxed font-light"
              >
                {quotes[current].context}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* More button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute bottom-4 right-8 flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-medium transition-all duration-200 uppercase tracking-wider"
        >
          {expanded ? 'less' : 'more'}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </motion.div>
  );
}