import React, { useMemo, useState } from 'react';
import {
  format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, getMonth, getYear,
} from 'date-fns';
import { ChevronDown } from 'lucide-react';

// ─── Shared dropdown shell ───────────────────────────────────────────────────
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

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
          minWidth: 130,
          maxHeight: 260,
          overflowY: 'auto',
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
        display: 'block', width: '100%', padding: '9px 14px',
        textAlign: 'left',
        background: isSelected ? 'rgba(99,102,241,0.18)' : 'transparent',
        border: 'none', cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        fontSize: 13, fontWeight: isSelected ? 800 : 600,
        color: isSelected ? '#a5b4fc' : '#94a3b8',
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WorkoutSplitHeatmap({
  checkIns = [], workoutSplit, weeklyGoal = 3, trainingDays = [], customWorkoutTypes = {}
}) {
  const today = new Date();
  const [selectedYear, setSelectedYear]   = useState(getYear(today));
  const [selectedMonth, setSelectedMonth] = useState(getMonth(today));
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [yearPickerOpen,  setYearPickerOpen]  = useState(false);

  // ── Split colour definitions ──────────────────────────────────────────────
  const splitSchedules = {
    ppl: {
      name: 'Push/Pull/Legs',
      schedule: ['Push','Pull','Legs','Push','Pull','Legs','Rest'],
      colors: {
        'Push': 'bg-gradient-to-br from-red-500 to-red-600 shadow-sm',
        'Pull': 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm',
        'Legs': 'bg-gradient-to-br from-green-500 to-green-600 shadow-sm',
        'Rest': 'bg-white/90 shadow-sm',
      },
    },
    upper_lower: {
      name: 'Upper/Lower',
      schedule: ['Upper','Lower','Rest','Upper','Lower','Rest','Rest'],
      colors: {
        'Upper': 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm',
        'Lower': 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm',
        'Rest': 'bg-white/90 shadow-sm',
      },
    },
    full_body: {
      name: 'Full Body',
      schedule: ['Full Body','Rest','Full Body','Rest','Full Body','Rest','Rest'],
      colors: {
        'Full Body': 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-sm',
        'Rest': 'bg-white/90 shadow-sm',
      },
    },
    bro_split: {
      name: 'Bro Split',
      schedule: ['Chest','Back','Shoulders','Arms','Legs','Rest','Rest'],
      colors: {
        'Chest':     'bg-gradient-to-br from-red-500 to-red-600 shadow-sm',
        'Back':      'bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm',
        'Shoulders': 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-sm',
        'Arms':      'bg-gradient-to-br from-pink-500 to-pink-600 shadow-sm',
        'Legs':      'bg-gradient-to-br from-green-500 to-green-600 shadow-sm',
        'Rest':      'bg-white/90 shadow-sm',
      },
    },
  };

  // ── Build weeks for selected month ────────────────────────────────────────
  const { weeks, splitInfo, hasCheckIn } = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const monthEnd   = endOfMonth(monthStart);

    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd   = endOfWeek(monthEnd,   { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    const hasCheckIn = (day) =>
      checkIns.some(c => isSameDay(new Date(c.check_in_date), day));

    let splitInfo = workoutSplit && splitSchedules[workoutSplit]
      ? splitSchedules[workoutSplit]
      : null;

    if (workoutSplit === 'custom') {
      const colorGradients = {
        purple: 'from-purple-500 to-purple-600',
        blue:   'from-blue-500 to-blue-600',
        green:  'from-green-500 to-green-600',
        red:    'from-red-500 to-red-600',
        orange: 'from-orange-500 to-orange-600',
        pink:   'from-pink-500 to-pink-600',
        yellow: 'from-yellow-500 to-yellow-600',
        cyan:   'from-cyan-500 to-cyan-600',
      };
      const schedule = [];
      const colors   = { 'Rest': 'bg-white/90 shadow-sm' };

      if (trainingDays.length > 0 && Object.keys(customWorkoutTypes).length > 0) {
        for (let i = 1; i <= 7; i++) {
          if (trainingDays.includes(i) && customWorkoutTypes[i]) {
            const name  = customWorkoutTypes[i].name  || 'Train';
            const color = customWorkoutTypes[i].color || 'purple';
            schedule.push(name);
            colors[name] = `bg-gradient-to-br ${colorGradients[color]} shadow-sm`;
          } else if (trainingDays.includes(i)) {
            schedule.push('Train');
            colors['Train'] = 'bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-sm';
          } else {
            schedule.push('Rest');
          }
        }
      } else if (trainingDays.length > 0) {
        for (let i = 1; i <= 7; i++) {
          schedule.push(trainingDays.includes(i) ? 'Train' : 'Rest');
        }
        colors['Train'] = 'bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-sm';
      } else {
        schedule.push('Train','Train','Rest','Train','Train','Rest','Rest');
        colors['Train'] = 'bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-sm';
      }

      splitInfo = { name: 'Custom Split', schedule, colors };
    }

    return { weeks, splitInfo, hasCheckIn };
  }, [checkIns, workoutSplit, selectedYear, selectedMonth, trainingDays, customWorkoutTypes]);

  // ── Expected workout for a given day ─────────────────────────────────────
  const getExpectedWorkout = (day) => {
    if (!splitInfo) return null;

    if (
      workoutSplit === 'custom' &&
      trainingDays.length > 0 &&
      Object.keys(customWorkoutTypes).length > 0
    ) {
      const firstCheckIn = checkIns.length > 0
        ? new Date(checkIns[checkIns.length - 1].check_in_date)
        : startOfWeek(today, { weekStartsOn: 1 });

      const daysDiff = Math.floor((day - firstCheckIn) / 86400000);
      const orderedWorkouts = trainingDays
        .filter(d => customWorkoutTypes[d]?.name)
        .map(d => customWorkoutTypes[d].name);

      const dayOfWeek   = day.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (trainingDays.includes(adjustedDay)) {
        if (orderedWorkouts.length === 0) return 'Train';
        let trainingDaysPassed = 0;
        for (let i = 0; i < daysDiff; i++) {
          const d = new Date(firstCheckIn);
          d.setDate(d.getDate() + i);
          const dow = d.getDay() === 0 ? 7 : d.getDay();
          if (trainingDays.includes(dow)) trainingDaysPassed++;
        }
        return orderedWorkouts[trainingDaysPassed % orderedWorkouts.length];
      }
      return 'Rest';
    }

    if (trainingDays.length > 0) {
      const dayOfWeek   = day.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      if (trainingDays.includes(adjustedDay)) {
        const idx = trainingDays.indexOf(adjustedDay);
        const workoutTypes = splitInfo.schedule.filter(w => w !== 'Rest');
        return workoutTypes[idx % workoutTypes.length];
      }
      return 'Rest';
    }

    const firstCheckIn = checkIns.length > 0
      ? new Date(checkIns[checkIns.length - 1].check_in_date)
      : startOfWeek(today, { weekStartsOn: 1 });
    const daysDiff     = Math.floor((day - firstCheckIn) / 86400000);
    const scheduleIdx  = ((daysDiff % 7) + 7) % 7;
    return splitInfo.schedule[scheduleIdx];
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const getConsistencyRate = () => {
    const past = weeks.flat().filter(d => d <= today);
    if (!past.length) return 0;
    return Math.round((past.filter(d => hasCheckIn(d)).length / past.length) * 100);
  };

  const today_year = getYear(today);
  const yearOptions = [today_year, today_year - 1, today_year - 2];

  const pillBtn = (isOpen) => ({
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '5px 10px', borderRadius: 10,
    background: isOpen ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    color: '#e2e8f0', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
    WebkitTapHighlightColor: 'transparent',
    boxShadow: '0 2px 0 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
    transition: 'background 0.12s ease',
    outline: 'none',
  });

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#34d399', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {getConsistencyRate()}<span style={{ fontSize: 13, fontWeight: 700, color: '#6ee7b7' }}>%</span>
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Consistency
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="relative">
              <button
                onClick={() => { setMonthPickerOpen(o => !o); setYearPickerOpen(false); }}
                style={pillBtn(monthPickerOpen)}
              >
                {MONTH_NAMES[selectedMonth].slice(0, 3)}
                <ChevronDown size={11} color="#94a3b8"
                  style={{ transform: monthPickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
              <button
                onClick={() => { setYearPickerOpen(o => !o); setMonthPickerOpen(false); }}
                style={pillBtn(yearPickerOpen)}
              >
                {selectedYear}
                <ChevronDown size={11} color="#94a3b8"
                  style={{ transform: yearPickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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

        {/* ── Day-of-week letters ── */}
        <div className="grid grid-cols-7 gap-1.5">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-slate-500 font-bold">{d}</div>
          ))}
        </div>

        {/* ── Week rows ── */}
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
                const isMissed    = inMonth && isPast && !isCheckedIn && !isRestDay;

                // Colour logic:
                // - checked in → blue
                // - past rest day → green (already rested)
                // - future rest day → grey (not yet, don't colour)
                // - missed training → dark
                // - future/unvisited → default grey
                let bgClass = '';
                let borderClass = '';

                if (isCheckedIn) {
                  bgClass = 'bg-gradient-to-br from-blue-500 to-blue-700';
                  borderClass = 'border border-blue-400/30';
                } else if (isRestDay && inMonth && !isFuture) {
                  // Past or today rest day → green
                  bgClass = 'bg-gradient-to-br from-emerald-500 to-emerald-700';
                  borderClass = 'border border-emerald-400/30';
                } else if (isMissed) {
                  bgClass = 'bg-slate-950';
                  borderClass = 'border border-slate-700/60';
                } else {
                  // Future days (including future rest days) and padding days → grey
                  bgClass = 'bg-slate-800/60';
                  borderClass = 'border border-slate-700/40';
                }

                return (
                  <div
                    key={di}
                    className={`
                      aspect-square rounded-lg relative overflow-hidden
                      transition-all duration-200
                      ${!inMonth ? 'opacity-15' : ''}
                      ${bgClass} ${borderClass}
                      ${isToday ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900' : ''}
                    `}
                  >
                    <div className="absolute top-0.5 left-1 text-[8px] font-bold text-white/50">
                      {format(day, 'd')}
                    </div>

                    {/* Check-in tick */}
                    {isCheckedIn && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    {/* Missed workout cross */}
                    {isMissed && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" />
                        </svg>
                      </div>
                    )}

                    {/* Today pulse dot */}
                    {isToday && !isCheckedIn && !isRestDay && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}