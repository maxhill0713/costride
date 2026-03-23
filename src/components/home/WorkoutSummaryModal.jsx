import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const modalPanelClass = "w-full max-w-sm bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white p-6 max-h-[80vh] overflow-y-auto";

export default function WorkoutSummaryModal({ summaryLog, onClose }) {
  if (!summaryLog) return null;

  const formatTime = (raw) => {
    const digits = (raw || '').replace(/\D/g, '').slice(0, 4);
    if (!digits) return '—';
    const padded = digits.padStart(3, '0');
    const mins = padded.slice(0, padded.length - 2);
    const secs = padded.slice(-2);
    return `${parseInt(mins, 10)}:${secs}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={modalPanelClass}
        >
          <div className="mb-5 text-center">
            <h3 className="text-2xl font-black text-white mb-1">
              {summaryLog.workout_name || summaryLog.title || summaryLog.workout_type || 'Workout'}
            </h3>
            <p className="text-sm text-slate-400 font-medium">
              {summaryLog.completed_date
                ? new Date(summaryLog.completed_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
                : ''}
            </p>
          </div>

          {summaryLog.check_in_time && summaryLog.completed_date && (
            <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <p className="text-xs text-orange-300/80 font-bold uppercase tracking-wide mb-1">Total Time at Gym</p>
              <p className="text-xl font-black text-orange-300">
                {(() => {
                  const checkIn = new Date(summaryLog.check_in_time);
                  const checkOut = new Date(summaryLog.completed_date);
                  const diffMs = checkOut - checkIn;
                  const hours = Math.floor(diffMs / (1000 * 60 * 60));
                  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                })()}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: 'Duration', value: summaryLog.duration_minutes ? `${summaryLog.duration_minutes}m` : '—' },
              { label: 'Exercises', value: summaryLog.exercises?.length || summaryLog.exercise_count || '—' },
              { label: 'Volume', value: summaryLog.total_volume ? `${summaryLog.total_volume}kg` : '—' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                <p className="text-sm font-black text-blue-300">{stat.value}</p>
                <p className="text-xs text-slate-500 font-bold mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {summaryLog.exercises?.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Exercises</p>
              <div className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 mb-1.5 items-end px-2 -mx-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-7">Sets</div>
                <div />
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-9">Reps</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2.5">Weight</div>
              </div>
              <div className="space-y-2 -mx-2">
                {summaryLog.exercises.map((ex, idx) => {
                  const exName = ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`;
                  const loggedSets = ex.logged_sets || ex.sets_data || [];
                  const hasLoggedData = loggedSets.length > 0;
                  const setsRepsStr = String(ex.setsReps || ex.sets_reps || ex.set_reps || '');
                  const srParts = /[xX]/.test(setsRepsStr) ? setsRepsStr.split(/[xX]/).map(s => s.trim()) : [];
                  const rawSets = ex.sets ?? ex.set_count ?? ex.num_sets;
                  const sets = hasLoggedData ? loggedSets.length : (rawSets !== undefined && rawSets !== null && String(rawSets) !== '') ? String(rawSets) : srParts[0] || '-';
                  const rawReps = ex.reps ?? ex.rep_count ?? ex.num_reps;
                  const reps = hasLoggedData ? (loggedSets[0]?.reps ?? loggedSets[0]?.rep ?? '-') : (rawReps !== undefined && rawReps !== null && String(rawReps) !== '') ? String(rawReps) : srParts[1] || '-';
                  const rawWeight = ex.weight_kg ?? ex.weight_lbs ?? ex.weight ?? (hasLoggedData && loggedSets[0]?.weight ? loggedSets[0].weight : undefined);
                  const weight = (rawWeight !== undefined && rawWeight !== null && String(rawWeight) !== '') ? String(rawWeight) : '-';

                  return (
                    <div key={idx} className="bg-white/5 pt-2 pb-2 pl-2 rounded-xl border border-white/10 grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 items-center">
                      <div className="text-sm font-bold text-white leading-tight ml-1">{exName}</div>
                      <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center ml-1" style={{ width: '36px' }}>{sets}</div>
                      <div className="text-slate-400 text-xs font-bold flex items-center justify-center">×</div>
                      <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>{reps}</div>
                      <div className="ml-3 pr-3">
                        <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white pb-1 pl-1 pt-1 text-sm font-black text-center rounded-2xl shadow-md shadow-blue-900/20 min-w-[55px]">
                          {weight}<span className="text-[10px] font-bold">kg</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {summaryLog.cardio?.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Cardio</p>
              <div className="grid grid-cols-[1fr_46px_72px_72px_auto] gap-1 mb-1.5 items-end px-2 -mx-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Rounds</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Time/Round</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Rest</div>
                <div className="w-6" />
              </div>
              <div className="space-y-2 -mx-2">
                {summaryLog.cardio.map((c, idx) => (
                  <div key={`cardio-${idx}`} className="bg-white/5 pt-2 pb-2 pl-2 rounded-xl border border-white/10 grid grid-cols-[1fr_46px_72px_72px_auto] gap-1 items-center">
                    <div className="text-sm font-bold text-white leading-tight ml-1">{c.exercise || '—'}</div>
                    <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '40px' }}>
                      {c.rounds || '—'}
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-300 py-1 text-xs font-semibold text-center rounded-lg flex items-center justify-center">
                      {c.time ? formatTime(c.time) : '—'}
                    </div>
                    <div className="bg-white/10 text-slate-300 py-1 text-xs font-semibold text-center rounded-lg flex items-center justify-center">
                      {parseInt(c.rounds) > 1 && c.rest ? formatTime(c.rest) : '—'}
                    </div>
                    <div className="w-6" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {summaryLog.notes && (
            <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Notes</p>
              <p className="text-sm text-slate-300 leading-relaxed">{summaryLog.notes}</p>
            </div>
          )}

          {!summaryLog.exercises?.length && !summaryLog.notes && (
            <p className="text-xs text-slate-500 text-center mt-4">No additional details recorded.</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}