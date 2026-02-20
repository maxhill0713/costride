import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      layout
      className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden select-none"
      style={{ height: expanded ? 'auto' : '224px' }}
    >
      {/* Dots */}
      <div className="flex justify-center gap-2 pt-4 pb-2">
        {quotes.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-blue-400 w-4' : 'bg-slate-600'}`}
          />
        ))}
      </div>

      {/* Swipeable Quote */}
      <div className="flex-1 relative overflow-hidden px-6 flex items-center justify-center">
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
            className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <p className="text-white/90 text-base font-medium text-center leading-relaxed italic">
              {quotes[current].text}
            </p>
            <p className="mt-4 text-slate-400 text-sm font-semibold tracking-wide">
              — {quotes[current].author}
            </p>
            {expanded && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 text-slate-300 text-xs text-center leading-relaxed"
              >
                {quotes[current].context}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* More button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute bottom-3 right-6 flex items-center gap-1 text-slate-400 hover:text-white text-xs font-medium transition-colors"
        >
          more
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </motion.div>
  );
}