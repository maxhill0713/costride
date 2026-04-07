import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const quotes = [
  {
    text: "I am no longer accepting the things I cannot change. We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    context: "True excellence comes from consistent action and habit formation. We must take control of what we can change and build excellence through repeated practice and discipline.",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    context: "Neither success nor failure defines you permanently—what truly matters is having the resilience and determination to keep going despite outcomes.",
  },
  {
    text: "The only thing we have to fear is fear itself.",
    author: "Franklin D. Roosevelt",
    context: "Fear is often the only real obstacle between us and our goals. When we overcome fear, we unlock our potential and find the strength to persevere.",
  }
];

const COLLAPSED_H  = 175;
const DOTS_H       = 26;
const CHEVRON_H    = 30;
const QUOTE_AREA_H = COLLAPSED_H - DOTS_H - CHEVRON_H;

export default function QuoteCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const hasInteracted = useRef(false);

  const paginate = (newDirection) => {
    hasInteracted.current = true;
    const next = (current + newDirection + quotes.length) % quotes.length;
    setDirection(newDirection);
    setCurrent(next);
  };

  const handleDotClick = (i) => {
    hasInteracted.current = true;
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
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
    <div
      className="rounded-2xl select-none relative shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
      style={{
        background: 'linear-gradient(135deg, rgba(20,24,48,0.94) 0%, rgba(8,10,22,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

      <div className="absolute inset-x-0 top-0 h-px pointer-events-none z-10" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
      <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: 'radial-gradient(ellipse at 25% 35%, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />

      {/* Dots */}
      <div className="flex justify-center gap-2 pt-2.5 pb-1 relative z-10 flex-shrink-0" style={{ height: DOTS_H }}>
        <LayoutGroup>
          {quotes.map((_, i) =>
            <motion.button
              key={i}
              layoutId={i === current ? 'active-dot' : undefined}
              onClick={() => handleDotClick(i)}
              animate={{ width: i === current ? '14px' : '8px' }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
              className={`h-2 rounded-full transition-colors duration-300 ${i === current ? 'bg-gradient-to-r from-blue-700 to-blue-800' : 'bg-slate-600/60 hover:bg-slate-500'}`}
            />
          )}
        </LayoutGroup>
      </div>

      {/* Quote only — no author */}
      <div
        className="relative px-6 z-10 flex-shrink-0"
        style={{ height: QUOTE_AREA_H, overflow: 'hidden' }}>
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial={hasInteracted.current ? 'enter' : false}
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
            }}>
            <p className="text-white text-lg font-light text-center leading-relaxed italic tracking-tight" style={{ margin: 0 }}>
              "{quotes[current].text}"
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Expanded context with author at top */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key={current + '-context'}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 26, mass: 1.1 }}
            style={{ overflow: 'hidden' }}
            className="px-6 z-10 flex-shrink-0">
            <div style={{ paddingTop: '10px', paddingBottom: '12px', textAlign: 'center' }}>
              <p className="text-slate-300 text-xs font-medium tracking-widest" style={{ margin: '0 0 6px 0' }}>
                — {quotes[current].author}
              </p>
              <p className="text-slate-400 text-sm text-center leading-relaxed font-light" style={{ margin: 0 }}>
                {quotes[current].context}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chevron */}
      <div className="flex justify-center pb-1.5 pt-1 flex-shrink-0 z-10 relative" style={{ height: CHEVRON_H }}>
        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors duration-200 p-1"
          animate={{ y: expanded ? [0, -4, 0] : [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>
    </div>
  );
}