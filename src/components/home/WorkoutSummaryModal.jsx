import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const fmtTime = (raw) => {
  const d = (raw || '').replace(/\D/g, '').slice(0, 4);
  if (!d) return '—';
  const p = d.padStart(3, '0');
  return `${parseInt(p.slice(0, p.length - 2), 10)}:${p.slice(-2)}`;
};

// Parse sets/reps robustly from any exercise object
function parseEx(ex) {
  const setsRepsStr = String(ex.setsReps || ex.sets_reps || '');
  const srParts = /[xX×]/.test(setsRepsStr) ? setsRepsStr.split(/[xX×]/).map(s => s.trim()) : [];
  const sets = String(ex.sets || srParts[0] || '') || '-';
  const reps = String(ex.reps || srParts[1] || '') || '-';
  const weight = String(ex.weight || '') || '-';
  return { sets, reps, weight };
}

// Group exercises by name — same logic as TodayWorkout's buildExerciseGroups
function buildGroups(exercises) {
  const groups = [];
  const nameToIdx = {};
  (exercises || []).forEach((ex, index) => {
    const key = (ex.exercise || '').trim().toLowerCase();
    if (!key) {
      groups.push({ key: `__${index}`, name: ex.exercise || '', items: [{ ex, index }] });
      return;
    }
    if (nameToIdx[key] === undefined) {
      nameToIdx[key] = groups.length;
      groups.push({ key, name: ex.exercise, items: [{ ex, index }] });
    } else {
      groups[nameToIdx[key]].items.push({ ex, index });
    }
  });
  return groups;
}

export default function WorkoutSummaryModal({ summaryLog, onClose }) {
  if (!summaryLog) return null;

  const exercises = summaryLog.exercises || [];
  const cardio = summaryLog.cardio || [];

  const duration = summaryLog.duration_minutes ? `${summaryLog.duration_minutes}m` : '—';

  const volume = (() => {
    if (summaryLog.total_volume) return `${Math.round(summaryLog.total_volume).toLocaleString()}kg`;
    const v = exercises.reduce((sum, ex) => {
      const { sets, reps, weight } = parseEx(ex);
      return sum + (parseFloat(sets) || 0) * (parseFloat(reps) || 0) * (parseFloat(weight) || 0);
    }, 0);
    return v > 0 ? `${Math.round(v).toLocaleString()}kg` : '—';
  })();

  const exerciseCount = (() => {
    const names = new Set(exercises.map(e => (e.exercise || '').trim().toLowerCase()).filter(Boolean));
    return names.size || exercises.length || '—';
  })();

  const groups = buildGroups(exercises);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10005,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'max(env(safe-area-inset-top), 20px) 16px max(env(safe-area-inset-bottom), 32px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white p-6 max-h-[80vh] overflow-y-auto"
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

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: 'Exercises', value: exerciseCount },
              { label: 'Duration', value: duration },
              { label: 'Volume', value: volume },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                <p className="text-sm font-black text-blue-300">{stat.value}</p>
                <p className="text-xs text-slate-500 font-bold mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Exercises — mirrors TodayWorkout card exactly */}
          {exercises.length > 0 && (
            <div className="space-y-2 mb-4">
              {/* Column headers */}
              <div className="grid gap-1 mb-1.5 items-end px-2" style={{ gridTemplateColumns: '1fr 36px 12px 36px auto' }}>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Exercise</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-3">Sets</div>
                <div />
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-3">Reps</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2">Weight</div>
              </div>

              <div className="space-y-2 -mx-2">
                {groups.map((group) => {
                  const isGrouped = group.items.length > 1;

                  // ── Single exercise row ──
                  if (!isGrouped) {
                    const { ex, index } = group.items[0];
                    const exName = ex.exercise || ex.name || `Exercise ${index + 1}`;
                    const { sets, reps, weight } = parseEx(ex);
                    return (
                      <div key={group.key} className="bg-white/5 pt-1 pb-1 pl-2 rounded-xl border border-white/10 grid gap-1 items-center" style={{ gridTemplateColumns: '1fr 36px 12px 36px auto' }}>
                        <div className="text-sm font-bold text-white leading-tight ml-1">{exName}</div>
                        <div className="bg-white/10 text-slate-300 py-0.5 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>{sets}</div>
                        <div className="text-slate-400 text-xs font-bold flex items-center justify-center -ml-2">×</div>
                        <div className="bg-white/10 text-slate-300 py-0.5 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>{reps}</div>
                        <div className="ml-1 mr-2">
                          <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white pb-0.5 pl-1 pt-0.5 text-sm font-black text-center rounded-2xl shadow-md shadow-blue-900/20 min-w-[55px]">
                            {weight}<span className="text-[10px] font-bold">kg</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // ── Grouped (multi-set) card — matches TodayWorkout grid exactly ──
                  const sorted = [...group.items].sort((a, b) => (parseFloat(b.ex.weight) || 0) - (parseFloat(a.ex.weight) || 0));
                  return (
                    <div key={group.key} className="bg-white/5 pt-1 pb-1 pl-2 rounded-xl border border-white/10">
                      {sorted.map(({ ex, index }, setIdx) => {
                        const setLabel = `Set ${setIdx + 1}`;
                        const { reps, weight } = parseEx(ex);
                        return (
                          <div key={index} className="grid gap-1 items-center pr-2 mb-1" style={{ gridTemplateColumns: '1fr 36px 12px 36px auto' }}>
                            <div className="ml-1">
                              {setIdx === 0 ? (
                                <div className="text-sm font-bold text-white leading-tight">{group.name}</div>
                              ) : (
                                <div />
                              )}
                            </div>
                            <div className="bg-white/10 text-slate-300 py-0.5 text-[11px] font-bold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                              {setLabel}
                            </div>
                            <div className="text-slate-400 text-xs font-bold flex items-center justify-center -ml-2">×</div>
                            <div className="bg-white/10 text-slate-300 py-0.5 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                              {reps}
                            </div>
                            <div className="ml-1 mr-2">
                              <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white pb-0.5 pl-1 pt-0.5 text-sm font-black text-center rounded-2xl shadow-md shadow-blue-900/20 min-w-[55px]">
                                {weight}<span className="text-[10px] font-bold">kg</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cardio — mirrors TodayWorkout card layout exactly */}
          {cardio.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Cardio</p>

              {/* Column headers */}
              <div className="grid gap-1 mb-1.5 items-end px-1" style={{ gridTemplateColumns: '1fr 44px 12px 44px 44px' }}>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Exercise</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Rounds</div>
                <div />
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Time</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Rest</div>
              </div>

              <div className="space-y-2 -mx-2">
                {cardio.map((c, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 pt-2 py-2 pl-2 rounded-xl border border-white/10 grid items-center"
                    style={{ gridTemplateColumns: '1fr 44px 12px 44px 44px', gap: '4px' }}
                  >
                    <div className="text-sm font-bold text-white leading-tight ml-1">{c.exercise || '—'}</div>
                    <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                      {c.rounds || '—'}
                    </div>
                    <div />
                    <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white py-2 text-xs font-black text-center rounded-2xl flex items-center justify-center shadow-md shadow-blue-900/20">
                      {c.time ? fmtTime(c.time) : '—'}
                    </div>
                    <div className="bg-white/10 text-slate-300 py-1.5 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                      {parseInt(c.rounds) > 1 && c.rest ? fmtTime(c.rest) : '—'}
                    </div>
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

          {!exercises.length && !cardio.length && !summaryLog.notes && (
            <p className="text-xs text-slate-500 text-center mt-4">No additional details recorded.</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}