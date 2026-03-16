import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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

  // Plate colour map — realistic gym colours
  const plateColor = (kg) => {
    const map = {
      25: { from: '#dc2626', to: '#b91c1c' },   // red
      20: { from: '#2563eb', to: '#1d4ed8' },   // blue
      15: { from: '#facc15', to: '#eab308' },   // yellow
      10: { from: '#16a34a', to: '#15803d' },   // green
      5:  { from: '#e2e8f0', to: '#cbd5e1' },   // white/light
      2.5:{ from: '#f97316', to: '#ea580c' },   // orange
      1.25:{ from: '#a78bfa', to: '#7c3aed' },  // purple
    };
    return map[kg] || { from: '#64748b', to: '#475569' };
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
            className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10006] text-white overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(28,34,60,0.95) 0%, rgba(8,10,20,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              maxHeight: '88vh',
            }}>

            {/* Top shine */}
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
            {/* Glow blob */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 25% 20%, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />

            <div className="relative px-5 pt-5 pb-5 overflow-y-auto" style={{ maxHeight: '88vh' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Plate Calculator</h2>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Standard gym · max 20kg plates</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Target (kg)</label>
                  <input
                    type="number"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    placeholder="e.g. 100"
                    style={{ fontSize: '16px' }}
                    className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-white/25 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Bar (kg)</label>
                  <input
                    type="number"
                    value={barWeight}
                    onChange={(e) => setBarWeight(e.target.value)}
                    placeholder="20"
                    style={{ fontSize: '16px' }}
                    className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-white/25 transition-colors"
                  />
                </div>
              </div>

              {/* Results */}
              <AnimatePresence>
                {targetWeight && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-3">

                    {/* Plates per side */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Plates per side</p>
                      {Object.keys(plates_needed).length > 0 ? (
                        <div className="space-y-1.5">
                          {Object.entries(plates_needed).map(([plate, count]) => {
                            const { from, to } = plateColor(parseFloat(plate));
                            return (
                              <div
                                key={plate}
                                className="flex items-center justify-between rounded-xl px-3 py-2.5 border border-white/8"
                                style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <div className="flex items-center gap-2.5">
                                  {/* Plate disc */}
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                                    <span className="text-[10px] font-black text-white leading-none">{plate}</span>
                                  </div>
                                  <span className="text-sm font-semibold text-slate-200">{plate}kg</span>
                                </div>
                                <span className="text-lg font-black text-white">×{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/8 px-3 py-4 text-center"
                          style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <p className="text-xs text-slate-500">Weight too low — add more than the bar weight</p>
                        </div>
                      )}
                    </div>

                    {/* Total weight */}
                    {hasResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.08 }}
                        className="rounded-xl border px-4 py-3 flex items-center justify-between"
                        style={{
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.08) 100%)',
                          borderColor: 'rgba(99,102,241,0.25)',
                        }}>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total weight</p>
                          <p className="text-3xl font-black text-white leading-none">
                            {total_weight.toFixed(1)}<span className="text-base text-slate-400 font-bold ml-1">kg</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-500 font-medium">Bar: {barWeight}kg</p>
                          <p className="text-[11px] text-slate-500 font-medium">Plates: {(total_weight - barW).toFixed(1)}kg</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-full mt-4 py-2.5 rounded-xl font-bold text-sm text-slate-300 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border border-transparent shadow-[0_3px_0_0_#0f172a,inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}