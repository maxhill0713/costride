import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const quotes = [
{
  text: "I am no longer accepting the things I cannot change. We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  author: "Aristotle",
  context: "Aristotle was an ancient Greek philosopher and student of Plato, known for his work in logic, metaphysics, and ethics. True excellence comes from consistent action and habit formation—we must take control of what we can change and build excellence through repeated practice and discipline."
},
{
  text: "I am changing the things I cannot accept.",
  author: "Angela Davis",
  context: "Angela Davis is an American political activist, author, and scholar who has dedicated her life to fighting systemic oppression and inequality. Take action against injustice and inequity—we have the power to shape our world and challenge systems that need transformation."
},
{
  text: "The only thing we have to fear is fear itself.",
  author: "Franklin D. Roosevelt",
  context: "Franklin D. Roosevelt was the 32nd President of the United States, leading the nation through the Great Depression and World War II with resilience and determination. Fear is often the only real obstacle between us and our goals—when we overcome fear, we unlock our potential and find the strength to persevere."
}];


export default function QuoteCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const paginate = (newDirection) => {
    const next = (current + newDirection + quotes.length) % quotes.length;
    setDirection(newDirection);
    setCurrent(next);
  };

  const handleDragEnd = (e, info) => {
    if (info.offset.x < -50) paginate(1);else
    if (info.offset.x > 50) paginate(-1);
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 })
  };

  return (
    <motion.div className="rounded-2xl overflow-hidden select-none relative py-2 shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
    style={{
      background: 'linear-gradient(135deg, rgba(88,28,135,0.10) 0%, rgba(8,10,20,0.88) 100%)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(139,92,246,0.15)',
    }}
    animate={{ minHeight: expanded ? '400px' : '224px' }}
    transition={{ duration: 0.3 }}>

      {/* Decorative gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Dots */}
      <div className="flex justify-center gap-2 pt-2 pb-1 relative z-10">
        <LayoutGroup>
          {quotes.map((_, i) =>
          <motion.button
            key={i}
            layoutId={i === current ? 'active-dot' : undefined}
            onClick={() => {setDirection(i > current ? 1 : -1);setCurrent(i);}}
            animate={{
              width: i === current ? '14px' : '8px'
            }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className={`h-2 rounded-full transition-colors duration-300 ${i === current ? 'bg-gradient-to-r from-blue-700 to-blue-800' : 'bg-slate-600/60 hover:bg-slate-500'}`} />

          )}
        </LayoutGroup>
      </div>

      {/* Swipeable Quote */}
      <div className="flex-1 relative overflow-hidden px-6 flex items-center justify-center pt-5 z-10">
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
            className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing -mt-6">

            <p className="text-white text-lg font-light text-center leading-relaxed italic tracking-tight -mt-7">
              "{quotes[current].text}"
            </p>
            <p className="mt-4 text-slate-300 text-sm font-medium tracking-widest opacity-90">
              — {quotes[current].author}
            </p>
            {expanded &&
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 text-slate-400 text-sm text-center leading-relaxed font-light">

                {quotes[current].context}
              </motion.p>
            }
          </motion.div>
        </AnimatePresence>

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all duration-200">

          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </motion.div>);

}