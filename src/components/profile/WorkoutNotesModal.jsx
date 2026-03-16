import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function WorkoutNotesModal({ isOpen, onClose, workoutName }) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) loadNotes();
  }, [isOpen, workoutName]);

  const loadNotes = async () => {
    try {
      const user = await base44.auth.me();
      const workout_notes = user?.workout_notes || {};
      setNotes(workout_notes[workoutName] || '');
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      const workout_notes = user?.workout_notes || {};
      workout_notes[workoutName] = notes;
      await base44.auth.updateMe({ workout_notes });
      onClose();
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: '-100px',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10005,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10006] text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(28,34,60,0.95) 0%, rgba(8,10,20,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}>

            {/* Top shine */}
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none rounded-t-3xl"
              style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />

            <div className="px-5 pt-5 pb-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-black text-white tracking-tight">Workout Notes</h2>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">{workoutName}</p>

              {/* Notes textarea */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Form tips, goals, things to remember…"
                rows={6}
                className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 resize-none focus:outline-none focus:border-white/25 transition-colors leading-relaxed"
              />

              {/* Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl font-black text-sm text-white bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu disabled:opacity-50">
                  {isSaving ? 'Saving…' : 'Save Notes'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-300 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border border-transparent shadow-[0_3px_0_0_#0f172a,0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}