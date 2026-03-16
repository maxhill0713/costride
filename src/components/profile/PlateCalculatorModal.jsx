import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlateCalculatorModal({ isOpen, onClose }) {
  const [targetWeight, setTargetWeight] = useState('');
  const [barWeight, setBarWeight] = useState('20');

  const plates = [20, 15, 10, 5, 2.5, 1.25];

  const calculatePlates = () => {
    const target = parseFloat(targetWeight) || 0;
    const bar = parseFloat(barWeight) || 20;
    let remaining = (target - bar) / 2;
    if (remaining < 0) return {};
    const result = {};
    plates.forEach(plate => {
      const count = Math.floor(remaining / plate);
      if (count > 0) {
        result[plate] = count;
        remaining = Math.round((remaining - count * plate) * 100) / 100;
      }
    });
    return result;
  };

  const plates_needed = calculatePlates();
  const barW = parseFloat(barWeight) || 20;
  const total_weight = Object.entries(plates_needed).reduce(
    (sum, [plate, count]) => sum + parseFloat(plate) * count * 2,
    barW
  );
  const hasResult = !!targetWeight && Object.keys(plates_needed).length > 0;

  const plateColor = (kg) => {
    const map = {
      20:   { from: '#2563eb', to: '#1d4ed8' },
      15:   { from: '#facc15', to: '#eab308' },
      10:   { from: '#16a34a', to: '#15803d' },
      5:    { from: '#e2e8f0', to: '#cbd5e1' },
      2.5:  { from: '#f97316', to: '#ea580c' },
      1.25: { from: '#a78bfa', to: '#7c3aed' },
    };
    return map[kg] || { from: '#64748b', to: '#475569' };
  };

  const inputStyle = {
    width: '100%', background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
    padding: '8px 12px', color: 'white', fontSize: '16px',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="calc-overlay"
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
            key="calc-card"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '384px',
              maxHeight: '88vh',
              overflowY: 'auto',
              background: 'linear-gradient(135deg, rgba(28,34,60,0.97) 0%, rgba(8,10,20,0.99) 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
              color: 'white',
              position: 'relative',
            }}>

            {/* Top shine */}
            <div style={{
              position: 'sticky', top: 0, height: '1px',
              background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)',
              pointerEvents: 'none',
            }} />
            {/* Glow */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '24px', pointerEvents: 'none',
              background: 'radial-gradient(ellipse at 25% 20%, rgba(99,102,241,0.12) 0%, transparent 60%)',
            }} />

            <div style={{ padding: '20px', position: 'relative' }}>
              {/* Header — no X button */}
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', margin: '0 0 2px 0' }}>
                  Plate Calculator
                </h2>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  Standard gym · max 20kg plates
                </p>
              </div>

              {/* Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                    Target (kg)
                  </label>
                  <input
                    type="number"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    placeholder="e.g. 100"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                    Bar (kg)
                  </label>
                  <input
                    type="number"
                    value={barWeight}
                    onChange={(e) => setBarWeight(e.target.value)}
                    placeholder="20"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>

              {/* Results */}
              {targetWeight && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}>

                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    Plates per side
                  </p>

                  {Object.keys(plates_needed).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      {Object.entries(plates_needed).map(([plate, count]) => {
                        const { from, to } = plateColor(parseFloat(plate));
                        return (
                          <div key={plate} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderRadius: '12px', padding: '10px 12px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                background: `linear-gradient(135deg, ${from}, ${to})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                              }}>
                                <span style={{ fontSize: '10px', fontWeight: 900, color: 'white' }}>{plate}</span>
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>{plate}kg</span>
                            </div>
                            <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>×{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{
                      borderRadius: '12px', padding: '16px', textAlign: 'center',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                      marginBottom: '12px',
                    }}>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Weight too low — must exceed bar weight</p>
                    </div>
                  )}

                  {/* Total weight */}
                  {hasResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.08 }}
                      style={{
                        borderRadius: '12px', padding: '12px 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.08) 100%)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        marginBottom: '12px',
                      }}>
                      <div>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px 0' }}>Total weight</p>
                        <p style={{ fontSize: '30px', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1 }}>
                          {total_weight.toFixed(1)}<span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: 700, marginLeft: '4px' }}>kg</span>
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 2px 0' }}>Bar: {barWeight}kg</p>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Plates: {(total_weight - barW).toFixed(1)}kg</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Close — slate press-down button */}
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.95, y: 3 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                style={{
                  width: '100%', padding: '10px', borderRadius: '12px',
                  fontWeight: 700, fontSize: '14px', color: '#cbd5e1', border: 'none',
                  background: 'linear-gradient(to bottom, #475569, #334155, #1e293b)',
                  boxShadow: '0 3px 0 0 #0f172a, inset 0 1px 0 rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                }}>
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}