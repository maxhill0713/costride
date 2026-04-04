import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, getMonth, getYear,
} from 'date-fns';
import { ChevronDown } from 'lucide-react';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const COLOR_GRADIENTS = {
  purple: ['#a855f7', '#7c3aed'],
  blue:   ['#3b82f6', '#1d4ed8'],
  green:  ['#22c55e', '#15803d'],
  red:    ['#ef4444', '#b91c1c'],
  orange: ['#f97316', '#c2410c'],
  pink:   ['#ec4899', '#be185d'],
  yellow: ['#eab308', '#a16207'],
  cyan:   ['#06b6d4', '#0e7490'],
};

function workoutGradient(colorKey) {
  const stops = COLOR_GRADIENTS[colorKey] || COLOR_GRADIENTS.blue;
  return `linear-gradient(135deg, ${stops[0]} 0%, ${stops[1]} 100%)`;
}

function workoutBorder(colorKey) {
  const stops = COLOR_GRADIENTS[colorKey] || COLOR_GRADIENTS.blue;
  return `1px solid ${stops[0]}55`;
}

// ─── Shared dropdown ─────────────────────────────────────────────────────────
function DropdownPicker({ onClose, children }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute right-0 top-[calc(100%+6px)] z-50 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(10,14,30,0.98)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          backdropFilter: 'blur(20px)',
          minWidth: 130, maxHeight: 260, overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </>
  );
}

function PickerItem({ label, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left',
        background: isSelected ? 'rgba(99,102,241,0.15)' : 'transparent',
        border: 'none', cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        fontSize: 13, fontWeight: isSelected ? 700 : 500,
        color: isSelected ? '#a5b4fc' : '#94a3b8',
      }}
    >
      {label}
    </button>
  );
}

// ─── Day bubble popup (matches Home page style) ───────────────────────────────
function DayBubble({ bubbleInfo, onViewSummary, onViewWorkout, onClose }) {
  if (!bubbleInfo) return null;

  const {
    anchorRect,
    popupLabel,
    dateLabel,
    solidColor,
    dayType,      // 'done' | 'rest' | 'missed' | 'upcoming'
    workoutLog,
    containerRef,
  } = bubbleInfo;

  const ARROW_H = 7;
  const ARROW_W = 13;
  const RADIUS = 14;
  const BUBBLE_W = 274;

  const hasSummaryBtn = dayType === 'done' && workoutLog;
  const hasWorkoutBtn = dayType === 'upcoming';
  const BUBBLE_H = (hasSummaryBtn || hasWorkoutBtn) ? 118 : 78;
  const SVG_H = BUBBLE_H + ARROW_H;

  // Position relative to the scroll container
  const containerRect = containerRef?.current?.getBoundingClientRect() || { left: 0, top: 0 };
  const buttonCenterX = anchorRect.left + anchorRect.width / 2;
  const buttonBottom = anchorRect.bottom;

  const screenW = window.innerWidth;
  const rawLeft = buttonCenterX - BUBBLE_W / 2;
  const clampedLeft = Math.max(8, Math.min(rawLeft, screenW - BUBBLE_W - 8));
  const arrowTip = Math.max(RADIUS + ARROW_W / 2 + 2, Math.min(buttonCenterX - clampedLeft, BUBBLE_W - RADIUS - ARROW_W / 2 - 2));
  const arrowL = arrowTip - ARROW_W / 2;
  const arrowR = arrowTip + ARROW_W / 2;
  const bubbleTopFixed = buttonBottom + 6;

  const path = [
    `M ${RADIUS} ${ARROW_H}`, `L ${arrowL} ${ARROW_H}`, `L ${arrowTip} 0`,
    `L ${arrowR} ${ARROW_H}`, `L ${BUBBLE_W - RADIUS} ${ARROW_H}`,
    `Q ${BUBBLE_W} ${ARROW_H} ${BUBBLE_W} ${ARROW_H + RADIUS}`,
    `L ${BUBBLE_W} ${SVG_H - RADIUS}`, `Q ${BUBBLE_W} ${SVG_H} ${BUBBLE_W - RADIUS} ${SVG_H}`,
    `L ${RADIUS} ${SVG_H}`, `Q 0 ${SVG_H} 0 ${SVG_H - RADIUS}`,
    `L 0 ${ARROW_H + RADIUS}`, `Q 0 ${ARROW_H} ${RADIUS} ${ARROW_H}`, `Z`,
  ].join(' ');

  const viewSummaryBtnStyle = {
    marginTop: 10, width: '100%',
    padding: '7px 0',
    borderRadius: 9,
    background: 'linear-gradient(to bottom, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)',
    border: 'none', borderBottom: '3px solid #1e40af',
    color: '#ffffff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
    letterSpacing: '0.03em', textAlign: 'center',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const viewWorkoutBtnStyle = {
    marginTop: 10, width: '100%',
    padding: '8px 0',
    borderRadius: 9,
    background: 'linear-gradient(to bottom, #1e2430 0%, #141820 60%, #0d1017 100%)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderBottom: '3px solid rgba(0,0,0,0.5)',
    color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
    letterSpacing: '0.04em', textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  return (
    <>
      <div className="fixed inset-0 z-[9990]" onClick={onClose} />
      <div
        style={{
          position: 'fixed',
          top: bubbleTopFixed,
          left: clampedLeft,
          width: BUBBLE_W,
          height: SVG_H,
          zIndex: 9999,
          pointerEvents: 'auto',
          transformOrigin: `${arrowTip}px top`,
          animation: 'heatmapBubbleIn 0.28s cubic-bezier(0.34,1.3,0.64,1) forwards',
        }}
      >
        <svg width={BUBBLE_W} height={SVG_H} style={{ position: 'absolute', top: 0, left: 0 }}>
          <path d={path} fill={solidColor} />
        </svg>
        <div style={{
          position: 'absolute',
          top: ARROW_H + 8, left: 14, right: 14, bottom: 8,
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          <span style={{
            fontSize: 19, fontWeight: 800, color: '#ffffff',
            letterSpacing: '0.01em', lineHeight: 1.25,
            textShadow: '0 1px 3px rgba(0,0,0,0.35)',
            textAlign: 'center', display: 'block',
          }}>
            {popupLabel}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)',
            letterSpacing: '0.03em', lineHeight: 1,
            textAlign: 'center', marginTop: 6, display: 'block',
          }}>
            {dateLabel}
          </span>

          {hasSummaryBtn && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewSummary(workoutLog); }}
              style={viewSummaryBtnStyle}
            >
              View Summary
            </button>
          )}

          {hasWorkoutBtn && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewWorkout(bubbleInfo); }}
              style={viewWorkoutBtnStyle}
            >
              View Workout
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Workout detail modal (same style as Home page view workout modal) ────────
function WorkoutDetailModal({ workoutInfo, onClose }) {
  if (!workoutInfo) return null;

  const { workoutMeta, dateLabel, customWorkoutTypes, dayOfWeek } = workoutInfo;
  const workoutConfig = customWorkoutTypes?.[dayOfWeek];
  const exercises = workoutConfig?.exercises || [];
  const workoutName = workoutMeta?.name || workoutConfig?.name || 'Training Day';

  const modalPanelStyle = {
    width: '100%', maxWidth: 384,
    background: 'rgba(15,18,40,0.97)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 24,
    boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
    color: '#ffffff',
    padding: 24,
    maxHeight: '80vh',
    overflowY: 'auto',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={modalPanelStyle}
      >
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <h3 style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', margin: 0 }}>{workoutName}</h3>
          <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, marginTop: 6, marginBottom: 0 }}>{dateLabel}</p>
        </div>

        {exercises.length > 0 ? (() => {
          // Group by exercise name (same logic as Home)
          const groups = [];
          const nameToGroupIdx = {};
          exercises.forEach((ex, index) => {
            const key = (ex.exercise || ex.name || '').trim().toLowerCase();
            if (!key) {
              groups.push({ key: `__empty_${index}`, name: ex.exercise || ex.name || '', items: [{ ex, index }] });
              return;
            }
            if (nameToGroupIdx[key] === undefined) {
              nameToGroupIdx[key] = groups.length;
              groups.push({ key, name: ex.exercise || ex.name, items: [{ ex, index }] });
            } else {
              groups[nameToGroupIdx[key]].items.push({ ex, index });
            }
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 36px 12px 36px auto',
                gap: 4, marginBottom: 6, padding: '0 8px',
              }}>
                {['Exercise', 'Sets', '', 'Reps', 'Weight'].map((h, i) => (
                  <div key={i} style={{
                    fontSize: 9, fontWeight: 700, color: '#475569',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    textAlign: i === 0 ? 'left' : i === 4 ? 'left' : 'center',
                    marginLeft: i === 1 ? -16 : i === 3 ? -20 : 0,
                  }}>{h}</div>
                ))}
              </div>

              {groups.map((group) => {
                const isGrouped = group.items.length > 1;
                if (!isGrouped) {
                  const { ex, index } = group.items[0];
                  const exName = ex.exercise || ex.name || ex.title || `Exercise ${index + 1}`;
                  const setsRepsStr = String(ex.setsReps || ex.sets_reps || '');
                  const srParts = /[xX]/.test(setsRepsStr) ? setsRepsStr.split(/[xX]/).map(s => s.trim()) : [];
                  const rawSets = ex.sets ?? ex.set_count ?? ex.num_sets;
                  const sets = (rawSets !== undefined && rawSets !== null && String(rawSets) !== '') ? String(rawSets) : srParts[0] || '-';
                  const rawReps = ex.reps ?? ex.rep_count ?? ex.num_reps;
                  const reps = (rawReps !== undefined && rawReps !== null && String(rawReps) !== '') ? String(rawReps) : srParts[1] || '-';
                  const rawWeight = ex.weight_kg ?? ex.weight_lbs ?? ex.weight;
                  const weight = (rawWeight !== undefined && rawWeight !== null && String(rawWeight) !== '') ? String(rawWeight) : '-';

                  return (
                    <div key={group.key} style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                      padding: '8px 8px 8px 10px',
                      display: 'grid', gridTemplateColumns: '1fr 36px 12px 36px auto',
                      gap: 4, alignItems: 'center',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', lineHeight: 1.3, marginLeft: 4 }}>{exName}</div>
                      <div style={{ background: 'rgba(255,255,255,0.10)', color: '#cbd5e1', padding: '4px 0', fontSize: 13, fontWeight: 600, textAlign: 'center', borderRadius: 8, marginLeft: 12, width: 36 }}>{sets}</div>
                      <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textAlign: 'center', marginLeft: 16 }}>×</div>
                      <div style={{ background: 'rgba(255,255,255,0.10)', color: '#cbd5e1', padding: '4px 0', fontSize: 13, fontWeight: 600, textAlign: 'center', borderRadius: 8, marginLeft: 8, width: 36 }}>{reps}</div>
                      <div style={{ marginLeft: 12, paddingRight: 4 }}>
                        <div style={{ background: 'linear-gradient(to right, rgba(29,78,216,0.9), rgba(30,58,138,0.9))', color: '#ffffff', padding: '4px 6px', fontSize: 13, fontWeight: 900, textAlign: 'center', borderRadius: 16, minWidth: 55, boxShadow: '0 2px 8px rgba(30,58,138,0.3)' }}>
                          {weight}<span style={{ fontSize: 10, fontWeight: 700 }}>kg</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                const sorted = [...group.items].sort(
                  (a, b) => (parseFloat(b.ex.weight_kg ?? b.ex.weight_lbs ?? b.ex.weight) || 0) - (parseFloat(a.ex.weight_kg ?? a.ex.weight_lbs ?? a.ex.weight) || 0)
                );
                return (
                  <div key={group.key} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: '8px 8px 8px 10px' }}>
                    {sorted.map(({ ex, index }, setIdx) => {
                      const setLabel = `Set ${setIdx + 1}`;
                      const rawReps = ex.reps ?? ex.rep_count ?? ex.num_reps;
                      const setsRepsStr = String(ex.setsReps || '');
                      const srParts = /[xX]/.test(setsRepsStr) ? setsRepsStr.split(/[xX]/).map(s => s.trim()) : [];
                      const reps = (rawReps !== undefined && rawReps !== null && String(rawReps) !== '') ? String(rawReps) : srParts[1] || '-';
                      const rawWeight = ex.weight_kg ?? ex.weight_lbs ?? ex.weight;
                      const weight = (rawWeight !== undefined && rawWeight !== null && String(rawWeight) !== '') ? String(rawWeight) : '-';
                      return (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 12px 36px auto', gap: 4, alignItems: 'center', marginBottom: setIdx < sorted.length - 1 ? 6 : 0 }}>
                          <div style={{ marginLeft: 4 }}>
                            {setIdx === 0
                              ? <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>{group.name}</div>
                              : <div />}
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.10)', color: '#cbd5e1', padding: '4px 0', fontSize: 11, fontWeight: 700, textAlign: 'center', borderRadius: 8, marginLeft: 12, width: 36 }}>{setLabel}</div>
                          <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textAlign: 'center', marginLeft: 16 }}>×</div>
                          <div style={{ background: 'rgba(255,255,255,0.10)', color: '#cbd5e1', padding: '4px 0', fontSize: 13, fontWeight: 600, textAlign: 'center', borderRadius: 8, marginLeft: 8, width: 36 }}>{reps}</div>
                          <div style={{ marginLeft: 12, paddingRight: 4 }}>
                            <div style={{ background: 'linear-gradient(to right, rgba(29,78,216,0.9), rgba(30,58,138,0.9))', color: '#ffffff', padding: '4px 6px', fontSize: 13, fontWeight: 900, textAlign: 'center', borderRadius: 16, minWidth: 55 }}>
                              {weight}<span style={{ fontSize: 10, fontWeight: 700 }}>kg</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })() : (
          <p style={{ fontSize: 13, color: '#475569', textAlign: 'center', marginTop: 16 }}>No exercises configured for this day.</p>
        )}
      </div>
    </div>
  );
}

// ─── Inject keyframes once ────────────────────────────────────────────────────
function injectHeatmapStyles() {
  if (document.getElementById('heatmap-bubble-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'heatmap-bubble-keyframes';
  style.textContent = `
    @keyframes heatmapBubbleIn {
      0%   { opacity: 0; transform: scaleY(0) scaleX(0.75); }
      100% { opacity: 1; transform: scaleY(1) scaleX(1); }
    }
  `;
  document.head.appendChild(style);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WorkoutSplitHeatmap({
  checkIns = [], workoutSplit, weeklyGoal = 3, trainingDays = [], customWorkoutTypes = {}, joinDate = null,
  // Optional: pass workoutLogs (array of WorkoutLog objects) to enable "View Summary"
  workoutLogs = [],
  // Optional: callback when user taps "View Summary" — receives the workoutLog object
  onViewSummary,
}) {
  const today = new Date();
  const joinDay = joinDate ? new Date(joinDate) : null;
  const [selectedYear, setSelectedYear]   = useState(getYear(today));
  const [selectedMonth, setSelectedMonth] = useState(getMonth(today));
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [yearPickerOpen,  setYearPickerOpen]  = useState(false);

  // Bubble state
  const [bubbleInfo, setBubbleInfo] = useState(null);
  const [viewWorkoutInfo, setViewWorkoutInfo] = useState(null);
  const containerRef = useRef(null);

  injectHeatmapStyles();

  const splitSchedules = {
    ppl:         { schedule: ['Push','Pull','Legs','Push','Pull','Legs','Rest'] },
    upper_lower: { schedule: ['Upper','Lower','Rest','Upper','Lower','Rest','Rest'] },
    full_body:   { schedule: ['Full Body','Rest','Full Body','Rest','Full Body','Rest','Rest'] },
    bro_split:   { schedule: ['Chest','Back','Shoulders','Arms','Legs','Rest','Rest'] },
  };

  const dayWorkoutMap = useMemo(() => {
    const map = {};
    if (workoutSplit === 'custom' || !splitSchedules[workoutSplit]) {
      for (let i = 1; i <= 7; i++) {
        if (trainingDays.includes(i) && customWorkoutTypes[i]) {
          map[i] = {
            name:     customWorkoutTypes[i].name  || 'Train',
            colorKey: customWorkoutTypes[i].color || 'blue',
          };
        }
      }
    } else {
      const presetColors = {
        Push: 'red', Pull: 'blue', Legs: 'green',
        Upper: 'purple', Lower: 'orange',
        'Full Body': 'cyan',
        Chest: 'red', Back: 'blue', Shoulders: 'yellow', Arms: 'pink',
      };
      const schedule = splitSchedules[workoutSplit]?.schedule || [];
      schedule.forEach((name, idx) => {
        const dow = idx + 1;
        if (name !== 'Rest') {
          map[dow] = { name, colorKey: presetColors[name] || 'blue' };
        }
      });
    }
    return map;
  }, [workoutSplit, trainingDays, customWorkoutTypes]);

  const { weeks, hasCheckIn } = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const monthEnd   = endOfMonth(monthStart);
    const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const allDays    = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7));
    const hasCheckIn = (day) => checkIns.some(c => isSameDay(new Date(c.check_in_date), day));
    return { weeks, hasCheckIn };
  }, [checkIns, selectedYear, selectedMonth]);

  const getExpectedWorkout = (day) => {
    const dow = day.getDay() === 0 ? 7 : day.getDay();
    return dayWorkoutMap[dow] ? dayWorkoutMap[dow].name : 'Rest';
  };

  const getWorkoutMeta = (day) => {
    const dow = day.getDay() === 0 ? 7 : day.getDay();
    return dayWorkoutMap[dow] || null;
  };

  const getWorkoutLogForDay = (day) => {
    return workoutLogs.find(log => {
      const logDate = new Date(log.completed_date || log.created_date);
      return isSameDay(logDate, day);
    }) || null;
  };

  const getConsistencyRate = () => {
    const pastTraining = weeks.flat().filter(d => {
      if (d > today) return false;
      return getExpectedWorkout(d) !== 'Rest';
    });
    if (!pastTraining.length) return 0;
    return Math.round((pastTraining.filter(d => hasCheckIn(d)).length / pastTraining.length) * 100);
  };

  const today_year = getYear(today);
  const yearOptions = [today_year, today_year - 1, today_year - 2];

  const pillBtn = (isOpen) => ({
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '5px 10px', borderRadius: 8,
    background: isOpen ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: '#cbd5e1', fontSize: 11, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
    WebkitTapHighlightColor: 'transparent',
    transition: 'background 0.12s ease', outline: 'none',
  });

  const consistencyRate = getConsistencyRate();

  const legendItems = useMemo(() => {
    const seen = new Set();
    const items = [];
    Object.values(dayWorkoutMap).forEach(({ name, colorKey }) => {
      if (!seen.has(name)) {
        seen.add(name);
        items.push({ name, colorKey });
      }
    });
    return items;
  }, [dayWorkoutMap]);

  // ─── Handle day cell tap ───────────────────────────────────────────────────
  const handleDayTap = useCallback((e, day, inMonth) => {
    if (!inMonth) return;

    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();

    const isCheckedIn = hasCheckIn(day);
    const isToday     = isSameDay(day, today);
    const isFuture    = day > today && !isToday;
    const isPast      = day < today && !isToday;
    const expected    = getExpectedWorkout(day);
    const isRestDay   = expected === 'Rest';
    const isMissed    = isPast && !isCheckedIn && !isRestDay && !(joinDay && day < joinDay);
    const workoutMeta = getWorkoutMeta(day);
    const workoutLog  = isCheckedIn ? getWorkoutLogForDay(day) : null;
    const dow         = day.getDay() === 0 ? 7 : day.getDay();
    const isPastOrTodayRestDay = isRestDay && (isPast || isToday);

    // Determine day type for bubble
    let dayType = 'upcoming';
    if (isRestDay)    dayType = 'rest';
    else if (isMissed) dayType = 'missed';
    else if (isCheckedIn) dayType = 'done';
    else if (isFuture || isToday) dayType = 'upcoming';

    // Popup label
    let popupLabel = 'Training Day';
    if (isRestDay)       popupLabel = 'Rest Day';
    else if (isMissed)   popupLabel = 'No Workout';
    else if (isCheckedIn && workoutMeta) popupLabel = workoutMeta.name;
    else if (isCheckedIn) popupLabel = 'Workout';
    else if (workoutMeta) popupLabel = workoutMeta.name;

    // Date label
    const dateLabel = day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

    // Bubble background colour matching the cell
    let solidColor = '#1e2535';
    if (isCheckedIn && workoutMeta) {
      const stops = COLOR_GRADIENTS[workoutMeta.colorKey] || COLOR_GRADIENTS.blue;
      solidColor = stops[1]; // use darker stop
    } else if (isRestDay && isPastOrTodayRestDay) {
      solidColor = '#065f46';
    } else if (isRestDay) {
      solidColor = '#1e2535';
    } else if (isMissed) {
      solidColor = '#7f1d1d';
    } else {
      // upcoming training day — use workout colour if available
      const stops = workoutMeta ? (COLOR_GRADIENTS[workoutMeta.colorKey] || COLOR_GRADIENTS.blue) : null;
      solidColor = stops ? stops[1] : '#263244';
    }

    // Toggle: close if same day tapped again
    if (bubbleInfo && format(day, 'yyyy-MM-dd') === bubbleInfo.dayKey) {
      setBubbleInfo(null);
      return;
    }

    setBubbleInfo({
      dayKey: format(day, 'yyyy-MM-dd'),
      anchorRect: rect,
      popupLabel,
      dateLabel,
      solidColor,
      dayType,
      workoutLog,
      workoutMeta,
      dayOfWeek: dow,
      containerRef,
    });
  }, [bubbleInfo, hasCheckIn, today, joinDay, dayWorkoutMap, workoutLogs]);

  const handleViewSummary = useCallback((log) => {
    setBubbleInfo(null);
    if (onViewSummary) onViewSummary(log);
  }, [onViewSummary]);

  const handleViewWorkout = useCallback((info) => {
    setBubbleInfo(null);
    setViewWorkoutInfo({
      workoutMeta: info.workoutMeta,
      dateLabel: info.dateLabel,
      customWorkoutTypes,
      dayOfWeek: info.dayOfWeek,
    });
  }, [customWorkoutTypes]);

  const closeBubble = useCallback(() => setBubbleInfo(null), []);

  return (
    <>
      <div
        ref={containerRef}
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(15,20,45,0.88) 0%, rgba(8,11,26,0.96) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        onClick={() => setBubbleInfo(null)}
      >
        <div className="p-3 space-y-3">

          {/* ── Top row ── */}
          <div className="flex items-center justify-between">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#34d399', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {consistencyRate}<span style={{ fontSize: 12, fontWeight: 600, color: '#4ade80' }}>%</span>
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Consistency
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setMonthPickerOpen(o => !o); setYearPickerOpen(false); }} style={pillBtn(monthPickerOpen)}>
                  {MONTH_NAMES[selectedMonth].slice(0, 3)}
                  <ChevronDown size={10} color="#64748b" style={{ transform: monthPickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {monthPickerOpen && (
                  <DropdownPicker onClose={() => setMonthPickerOpen(false)}>
                    {MONTH_NAMES.map((name, idx) => (
                      <PickerItem key={idx} label={name} isSelected={idx === selectedMonth}
                        onClick={() => { setSelectedMonth(idx); setMonthPickerOpen(false); }} />
                    ))}
                  </DropdownPicker>
                )}
              </div>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setYearPickerOpen(o => !o); setMonthPickerOpen(false); }} style={pillBtn(yearPickerOpen)}>
                  {selectedYear}
                  <ChevronDown size={10} color="#64748b" style={{ transform: yearPickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {yearPickerOpen && (
                  <DropdownPicker onClose={() => setYearPickerOpen(false)}>
                    {yearOptions.map(yr => (
                      <PickerItem key={yr} label={String(yr)} isSelected={yr === selectedYear}
                        onClick={() => { setSelectedYear(yr); setYearPickerOpen(false); }} />
                    ))}
                  </DropdownPicker>
                )}
              </div>
            </div>
          </div>

          {/* ── Day headers ── */}
          <div className="grid grid-cols-7 gap-1.5">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, color: '#475569', letterSpacing: '0.04em' }}>{d}</div>
            ))}
          </div>

          {/* ── Calendar grid ── */}
          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5">
                {week.map((day, di) => {
                  const inMonth     = getMonth(day) === selectedMonth && getYear(day) === selectedYear;
                  const isCheckedIn = hasCheckIn(day);
                  const isToday     = isSameDay(day, today);
                  const isFuture    = day > today && !isToday;
                  const isPast      = day < today && !isToday;
                  const expected    = getExpectedWorkout(day);
                  const isRestDay   = expected === 'Rest';
                  const isMissed    = inMonth && isPast && !isCheckedIn && !isRestDay && !(joinDay && day < joinDay);
                  const workoutMeta = getWorkoutMeta(day);
                  const dayKey      = format(day, 'yyyy-MM-dd');
                  const isBubbleOpen = bubbleInfo?.dayKey === dayKey;
                  const isPastOrTodayRestDay = isRestDay && (isPast || isToday);

                  let bg, border, opacity = inMonth ? 1 : 0.12;

                  if (isCheckedIn && workoutMeta) {
                    bg     = workoutGradient(workoutMeta.colorKey);
                    border = workoutBorder(workoutMeta.colorKey);
                  } else if (isCheckedIn) {
                    bg     = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                    border = '1px solid rgba(96,165,250,0.3)';
                  } else if (isRestDay && !isFuture && inMonth && !(joinDay && day < joinDay)) {
                    bg     = 'linear-gradient(135deg, #10b981 0%, #065f46 100%)';
                    border = '1px solid rgba(52,211,153,0.25)';
                  } else if (isMissed) {
                    bg      = 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)';
                    border  = '1px solid rgba(239,68,68,0.35)';
                    opacity = inMonth ? 0.8 : 0.12;
                  } else {
                    bg     = 'rgba(30,37,56,0.7)';
                    border = '1px solid rgba(71,85,105,0.3)';
                  }

                  // All in-month days are tappable (not just checked-in ones)
                  const isTappable = inMonth;

                  return (
                    <div key={di} style={{ position: 'relative', aspectRatio: '1' }}>
                      <div
                        onClick={(e) => isTappable && handleDayTap(e, day, inMonth)}
                        style={{
                          width: '100%', height: '100%',
                          borderRadius: 6,
                          position: 'relative',
                          overflow: 'hidden',
                          background: bg,
                          border,
                          opacity,
                          cursor: isTappable ? 'pointer' : 'default',
                          transition: 'opacity 0.2s ease, transform 0.1s ease',
                          transform: isBubbleOpen ? 'scale(1.08)' : 'scale(1)',
                          outline: isToday ? '2px solid rgba(255,255,255,0.5)' : 'none',
                          outlineOffset: isToday ? '1px' : '0',
                        }}
                      >
                        {isCheckedIn && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                              <path d="M4 10.5l4.5 4.5 7.5-9" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                        {isToday && !isCheckedIn && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#60a5fa', animation: 'pulse 2s ease-in-out infinite' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ── Legend ── */}
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 10px',
            paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            {legendItems.map(({ name, colorKey }) => {
              const stops = COLOR_GRADIENTS[colorKey] || COLOR_GRADIENTS.blue;
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 9, height: 9, borderRadius: 2,
                    background: `linear-gradient(135deg, ${stops[0]} 0%, ${stops[1]} 100%)`,
                    border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 500, color: '#475569' }}>{name}</span>
                </div>
              );
            })}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 500, color: '#475569' }}>Rest</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)', border: '1px solid rgba(239,68,68,0.35)', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 500, color: '#475569' }}>Missed</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bubble portal (fixed, outside card) ── */}
      {bubbleInfo && (
        <DayBubble
          bubbleInfo={bubbleInfo}
          onViewSummary={handleViewSummary}
          onViewWorkout={handleViewWorkout}
          onClose={closeBubble}
        />
      )}

      {/* ── Workout detail modal ── */}
      {viewWorkoutInfo && (
        <WorkoutDetailModal
          workoutInfo={viewWorkoutInfo}
          onClose={() => setViewWorkoutInfo(null)}
        />
      )}
    </>
  );
}