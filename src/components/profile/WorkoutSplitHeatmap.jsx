import React, { useMemo, useState } from 'react';
import {
  format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, getMonth, getYear,
} from 'date-fns';
import { ChevronDown } from 'lucide-react';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Maps the colour key stored on each workout to actual CSS gradient stops
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

// ─── Day tooltip shown on press ──────────────────────────────────────────────
function DayTooltip({ label, colorKey, onClose }) {
  const stops = COLOR_GRADIENTS[colorKey] || COLOR_GRADIENTS.blue;
  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div style={{
        position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 70, pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}>
        <div style={{
          background: 'rgba(8,12,28,0.97)',
          border: `1px solid ${stops[0]}66`,
          borderRadius: 8, padding: '5px 9px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: stops[0], flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>{label}</span>
        </div>
        {/* Arrow */}
        <div style={{
          width: 8, height: 5, margin: '0 auto',
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: `5px solid rgba(8,12,28,0.97)`,
        }} />
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WorkoutSplitHeatmap({
  checkIns = [], workoutSplit, weeklyGoal = 3, trainingDays = [], customWorkoutTypes = {}, joinDate = null
}) {
  const today = new Date();
  const joinDay = joinDate ? new Date(joinDate) : null;
  const [selectedYear, setSelectedYear]   = useState(getYear(today));
  const [selectedMonth, setSelectedMonth] = useState(getMonth(today));
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [yearPickerOpen,  setYearPickerOpen]  = useState(false);
  const [tappedDay, setTappedDay] = useState(null); // date string 'YYYY-MM-DD'

  const splitSchedules = {
    ppl:         { schedule: ['Push','Pull','Legs','Push','Pull','Legs','Rest'] },
    upper_lower: { schedule: ['Upper','Lower','Rest','Upper','Lower','Rest','Rest'] },
    full_body:   { schedule: ['Full Body','Rest','Full Body','Rest','Full Body','Rest','Rest'] },
    bro_split:   { schedule: ['Chest','Back','Shoulders','Arms','Legs','Rest','Rest'] },
  };

  // Build a map: day-of-week (1=Mon…7=Sun) → { name, colorKey }
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
      // Preset splits — assign colours by workout type name
      const presetColors = {
        Push: 'red', Pull: 'blue', Legs: 'green',
        Upper: 'purple', Lower: 'orange',
        'Full Body': 'cyan',
        Chest: 'red', Back: 'blue', Shoulders: 'yellow', Arms: 'pink',
      };
      const schedule = splitSchedules[workoutSplit]?.schedule || [];
      schedule.forEach((name, idx) => {
        const dow = idx + 1; // Mon=1
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

  // Unique trained workout types for the legend
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

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(15,20,45,0.88) 0%, rgba(8,11,26,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
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
              <button onClick={() => { setMonthPickerOpen(o => !o); setYearPickerOpen(false); }} style={pillBtn(monthPickerOpen)}>
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
              <button onClick={() => { setYearPickerOpen(o => !o); setMonthPickerOpen(false); }} style={pillBtn(yearPickerOpen)}>
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
        <div className="space-y-1.5" onClick={() => setTappedDay(null)}>
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
                const isMissed    = inMonth && isPast && !isCheckedIn && !isRestDay;
                const workoutMeta = getWorkoutMeta(day);
                const dayKey      = format(day, 'yyyy-MM-dd');
                const isTooltipOpen = tappedDay === dayKey;

                // ── Colour ──
                let bg, border, opacity = inMonth ? 1 : 0.12;

                if (isCheckedIn && workoutMeta) {
                  // Use the workout's own colour
                  bg     = workoutGradient(workoutMeta.colorKey);
                  border = workoutBorder(workoutMeta.colorKey);
                } else if (isCheckedIn) {
                  // Fallback if no meta (shouldn't normally happen)
                  bg     = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                  border = '1px solid rgba(96,165,250,0.3)';
                } else if (isRestDay && !isFuture && inMonth && !(joinDay && day < joinDay)) {
                  bg     = 'linear-gradient(135deg, #10b981 0%, #065f46 100%)';
                  border = '1px solid rgba(52,211,153,0.25)';
                } else if (isMissed && !(joinDay && day < joinDay)) {
                  bg      = 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)';
                  border  = '1px solid rgba(239,68,68,0.35)';
                  opacity = inMonth ? 0.8 : 0.12;
                } else {
                  bg     = 'rgba(30,37,56,0.7)';
                  border = '1px solid rgba(71,85,105,0.3)';
                }

                return (
                  <div
                    key={di}
                    style={{ position: 'relative', aspectRatio: '1' }}
                  >
                    <div
                      onClick={(e) => {
                        if (!isCheckedIn || !inMonth) return;
                        e.stopPropagation();
                        setTappedDay(isTooltipOpen ? null : dayKey);
                      }}
                      style={{
                        width: '100%', height: '100%',
                        borderRadius: 6,
                        position: 'relative',
                        overflow: 'hidden',
                        background: bg,
                        border,
                        opacity,
                        cursor: isCheckedIn && inMonth ? 'pointer' : 'default',
                        transition: 'opacity 0.2s ease, transform 0.1s ease',
                        transform: isTooltipOpen ? 'scale(1.08)' : 'scale(1)',
                        outline: isToday ? '2px solid rgba(255,255,255,0.5)' : 'none',
                        outlineOffset: isToday ? '1px' : '0',
                      }}
                    >
                      {/* Tick */}
                      {isCheckedIn && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                            <path d="M4 10.5l4.5 4.5 7.5-9" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}

                      {/* Today pulse */}
                      {isToday && !isCheckedIn && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#60a5fa', animation: 'pulse 2s ease-in-out infinite' }} />
                        </div>
                      )}
                    </div>

                    {/* Workout name tooltip — appears above the cell on tap */}
                    {isTooltipOpen && workoutMeta && (
                      <DayTooltip
                        label={workoutMeta.name}
                        colorKey={workoutMeta.colorKey}
                        onClose={() => setTappedDay(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Legend — workout colours + rest + missed ── */}
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
  );
}