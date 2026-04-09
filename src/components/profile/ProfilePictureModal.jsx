import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePictureModal({ isOpen, onClose, imageUrl, userName, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div
      key="pp-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-start overflow-y-auto"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)', paddingBottom: 48, paddingLeft: 16, paddingRight: 16 }}
      onClick={onClose}
    >
      <motion.div
        key="pp-content"
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 1 }}
        className="flex flex-col items-center gap-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Picture */}
        <div className="w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={userName}
              className="w-full h-full object-cover rounded-full shadow-2xl ring-4 ring-white/20"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/20">
              <span className="text-8xl font-bold text-white">
                {userName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Cards below */}
        {children && (
          <div className="w-full">
            {children}
          </div>
        )}
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}