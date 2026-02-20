import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const quotes = [
  {
    text: "We can't become what we need to be by remaining what we are.",
    author: "Oprah Winfrey"
  },
  {
    text: "Be not afraid of growing slowly; be afraid only of standing still.",
    author: "Chinese Proverb"
  },
  {
    text: "Do the best you can until you know better. Then when you know better, do better.",
    author: "Maya Angelou"
  }
];

export default function QuoteCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [dragStart, setDragStart] = useState(null);

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
    <div className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/20 h-[224px] flex flex-col overflow-hidden select-none">
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
      <div className="flex-1 relative overflow-hidden px-6">
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
            className="absolute inset-0 flex flex-col items-center justify-center px-6 cursor-grab active:cursor-grabbing"
          >
            {/* Quote mark */}
            <span className="text-5xl text-blue-400/40 font-serif leading-none mb-2">"</span>
            <p className="text-white/90 text-base font-medium text-center leading-relaxed italic">
              {quotes[current].text}
            </p>
            <p className="mt-4 text-slate-400 text-sm font-semibold tracking-wide">
              — {quotes[current].author}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe hint */}
      <p className="text-center text-slate-600 text-[10px] pb-3 tracking-wide">swipe to explore</p>
    </div>
  );
}