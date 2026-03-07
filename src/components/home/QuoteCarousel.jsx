import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const quotes = [
{
  text: "I am no longer accepting the things I cannot change. We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  author: "Aristotle",
},
{
  text: "I am changing the things I cannot accept.",
  author: "Angela Davis",
},
{
  text: "The only thing we have to fear is fear itself.",
  author: "Franklin D. Roosevelt",
}];


export default function QuoteCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const paginate = (newDirection) => {
    const next = (current + newDirection + quotes.length) % quotes.length;
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

  // 5% shorter: was 224px collapsed → ~213px
  const collapsedHeight = '213px';

  return (
    <motion.div
      className="rounded-2xl overflow-hidden select-none relative shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
      style={{
        background: 'linear-gradient(135deg, rgba(88,28,135,0.10) 0%, rgba(8,10,20,0.88) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(139,92,246,0.15)',
        display: 'flex',
        flexDirection: 'column',
      }}
      animate={{ minHeight: expanded ? '340px' : collapsedHeight }}
      transition={{ duration: 0.3 }}>

      {/* Decorative gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Dots */}
      <div className="flex justify-center gap-2 pt-3 pb-1 relative z-10 flex-shrink-0">
        <LayoutGroup>
          {quotes.map((_, i) =>
            <motion.button
              key={i}
              layoutId={i === current ? 'active-dot' : undefined}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              animate={{ width: i === current ? '14px' : '8px' }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
              className={`h-2 rounded-full transition-colors duration-300 ${i === current ? 'bg-gradient-to-r from-blue-700 to-blue-800' : 'bg-slate-600/60 hover:bg-slate-500'}`}
            />
          )}
        </LayoutGroup>
      </div>

      {/* Swipeable Quote — flex-1 so it fills remaining space and centres content */}
      <div className="flex-1 relative overflow-hidden px-6 z-10" style={{ display: 'flex', flexDirection: 'column' }}>
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
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              paddingBottom: 32, // room for chevron below author
            }}>

            <p className="text-white text-lg font-light text-center leading-relaxed italic tracking-tight">
              "{quotes[current].text}"
            </p>
            <p className="mt-4 text-slate-300 text-sm font-medium tracking-widest opacity-90">
              — {quotes[current].author}
            </p>

            {/* Expand chevron — sits directly below author, slow transition */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors duration-200">
              <ChevronDown
                className="w-5 h-5"
                style={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.55s ease',
                }}
              />
            </button>

            {/* Expanded context removed — no author description shown */}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}