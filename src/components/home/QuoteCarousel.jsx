import React, { useState, useEffect } from 'react';
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
  }
];

export default function QuoteCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    const fullText = `"${quotes[current].text}"`;
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(fullText.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 65);
    return () => clearInterval(interval);
  }, [current]);

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
    <>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .cursor { animation: blink 0.7s step-end infinite; }
      `}</style>

      <motion.div
        className="bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-slate-950/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-slate-950/50 flex flex-col overflow-hidden select-none relative py-2"
        style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 50%, rgba(6, 17, 34, 0.85) 100%)' }}
        animate={{ minHeight: expanded ? '400px' : '224px' }}
        transition={{ duration: 0.3 }}>

        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        <div className="flex justify-center gap-2 pt-2 pb-1 relative z-10">
          <LayoutGroup>
            {quotes.map((_, i) =>
              <motion.button
                key={i}
                layoutId={i === current ? 'active-dot' : undefined}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                animate={{ width: i === current ? '14px' : '8px' }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
                className={`h-2 rounded-full transition-colors duration-300 ${i === current ? 'bg-gradient-to-r from-blue-700 to-blue-800' : 'bg-slate-600/60 hover:bg-slate-500'}`} />
            )}
          </LayoutGroup>
        </div>

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
              className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing -mt-6 w-full">

              <p className="text-white text-lg font-light text-center leading-relaxed italic tracking-tight -mt-7 w-full">
                {displayedText}
                {isTyping && <span className="cursor text-white">|</span>}
              </p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: isTyping ? 0 : 0.9 }}
                transition={{ duration: 1 }}
                className="mt-4 text-slate-300 text-sm font-medium tracking-widest">
                — {quotes[current].author}
              </motion.p>

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

          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all duration-200">
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </motion.div>
    </>
  );
}