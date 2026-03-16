import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
        <motion.div
          key="notes-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 10005,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
          }}>
          <motion.div
            key="notes-card"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '384px',
              background: 'linear-gradient(135deg, rgba(28,34,60,0.97) 0%, rgba(8,10,20,0.99) 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}>

            {/* Top shine */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)',
              pointerEvents: 'none',
            }} />

            <div style={{ padding: '20px' }}>
              {/* Header — no X button */}
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', margin: '0 0 2px 0' }}>
                Workout Notes
              </h2>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', marginTop: '2px' }}>
                {workoutName}
              </p>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Form tips, goals, things to remember…"
                rows={6}
                style={{
                  width: '100%', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                  padding: '10px 12px', color: 'white', fontSize: '14px',
                  resize: 'none', outline: 'none', lineHeight: '1.6',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {/* Save — blue press-down button */}
                <motion.button
                  onClick={handleSave}
                  disabled={isSaving}
                  whileTap={{ scale: 0.95, y: 3 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '12px',
                    fontWeight: 900, fontSize: '14px', color: 'white', border: 'none',
                    background: 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)',
                    boxShadow: '0 3px 0 0 #1a3fa8, 0 8px 20px rgba(0,0,100,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.5 : 1,
                  }}>
                  {isSaving ? 'Saving…' : 'Save Notes'}
                </motion.button>

                {/* Cancel — slate press-down button */}
                <motion.button
                  onClick={onClose}
                  whileTap={{ scale: 0.95, y: 3 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '12px',
                    fontWeight: 700, fontSize: '14px', color: '#cbd5e1', border: 'none',
                    background: 'linear-gradient(to bottom, #475569, #334155, #1e293b)',
                    boxShadow: '0 3px 0 0 #0f172a, inset 0 1px 0 rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                  }}>
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}