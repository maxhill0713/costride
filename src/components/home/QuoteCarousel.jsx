import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const quotes = [
{
  text: "I am no longer accepting the things I cannot change. We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  author: "Aristotle",
  context: "True excellence comes from consistent action and habit formation. We must take control of what we can change and build excellence through repeated practice and discipline.",
},
{
  text: "I am changing the things I cannot accept.",
  author: "Angela Davis",
  context: "Take action against injustice and inequity — we have the power to shape our world and challenge systems that need transformation.",
},
{
  text: "The only thing we have to fear is fear itself.",
  author: "Franklin D. Roosevelt",
  context: "Fear is often the only real obstacle between us and our goals. When we overcome fear, we unlock our potential and find the strength to persevere.",
}];

// Fixed collapsed height — sized for Aristotle (longest quote)
const COLLAPSED_H  = 212;
const DOTS_H       = 28;
const CHEVRON_H    = 32;
const QUOTE_AREA_H = COLLAPSED_H - DOTS_H - CHEVRON_H;

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

  return (
    <div
      className="rounded-2xl select-none relative shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
      style={{
        background: 'linear-gradient(135deg, rgba(55,48,163,0.10) 0%, rgba(8,10,20,0.88) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(99,102,241,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

      {/* Decorative gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Dots — fixed height */}
      <div className="flex justify-center gap-2 pt-3 pb-1 relative z-10 flex-shrink-0" style={{ height: DOTS_H }}>
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

      {/* Quote + author — FIXED height, never moves or resizes */}
      <div
        className="relative px-6 z-10 flex-shrink-0"
        style={{ height: QUOTE_AREA_H, overflow: 'hidden' }}>
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
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
            }}>
            <p className="text-white text-lg font-light text-center leading-relaxed italic tracking-tight">
              "{quotes[current].text}"
            </p>
            <p className="mt-2 text-slate-300 text-sm font-medium tracking-widest opacity-90">
              — {quotes[current].author}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Context — expands dynamically to fit however long the text is */}
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
            <p className="text-slate-400 text-sm text-center leading-relaxed font-light py-3">
              {quotes[current].context}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chevron — bounces down when collapsed, bounces up when expanded */}
      <div className="flex justify-center pb-2 pt-1 flex-shrink-0 z-10 relative" style={{ height: CHEVRON_H }}>
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