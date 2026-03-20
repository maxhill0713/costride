import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, getMonth, getYear, subMonths, addMonths
} from 'date-fns';
import { ChevronDown } from 'lucide-react';

// ─── Shared dropdown shell ───────────────────────────────────────────────────
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function DropdownPicker({ items, onClose, children }) {
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

    // Pad to full Mon–Sun rows
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd   = endOfWeek(monthEnd,   { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    const hasCheckIn = (day) =>
      checkIns.some(c => isSameDay(new Date(c.check_in_date), day));

    // Resolve split info
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

  const getWeeklyAverage = () => {
    const counts = weeks.map(w => w.filter(d => hasCheckIn(d) && d <= today).length);
    return (counts.reduce((s, c) => s + c, 0) / weeks.length).toFixed(1);
  };

  const today_year = getYear(today);
  const yearOptions = [today_year, today_year - 1, today_year - 2];

  return (
    <div className="space-y-3">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between">

        {/* Split legend */}
        {splitInfo && (
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">{splitInfo.name}</h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(splitInfo.colors).map(([name, color]) => (
                <div key={name} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/30 border border-slate-600/30">
                  <div className={`w-2.5 h-2.5 rounded ${color}`} />
                  <span className="text-[10px] text-slate-200 font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Calendar grid ── */}
      <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-700/40">
        {/* Top bar: day labels + month/year pickers in top-right */}
        <div className="flex items-center justify-between mb-2">
          <div className="grid grid-cols-7 gap-1.5 flex-1">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] text-slate-400 font-bold">{d}</div>
            ))}
          </div>

          {/* Month + Year pickers */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">

            {/* Month pill */}
            <div className="relative">
              <button
                onClick={() => { setMonthPickerOpen(o => !o); setYearPickerOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px', borderRadius: 8,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.35)',
                  color: '#a5b4fc', fontSize: 12, fontWeight: 800,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {MONTH_NAMES[selectedMonth].slice(0, 3)}
                <ChevronDown size={11} color="#a5b4fc"
                  style={{ transform: monthPickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {monthPickerOpen && (
                <DropdownPicker onClose={() => setMonthPickerOpen(false)}>
                  {MONTH_NAMES.map((name, idx) => (
                    <PickerItem
                      key={idx}
                      label={name}
                      isSelected={idx === selectedMonth}
                      onClick={() => { setSelectedMonth(idx); setMonthPickerOpen(false); }}
                    />
                  ))}
                </DropdownPicker>
              )}
            </div>

            {/* Year pill */}
            <div className="relative">
              <button
                onClick={() => { setYearPickerOpen(o => !o); setMonthPickerOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px', borderRadius: 8,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.35)',
                  color: '#a5b4fc', fontSize: 12, fontWeight: 800,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {selectedYear}
                <ChevronDown size={11} color="#a5b4fc"
                  style={{ transform: yearPickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {yearPickerOpen && (
                <DropdownPicker onClose={() => setYearPickerOpen(false)}>
                  {yearOptions.map(yr => (
                    <PickerItem
                      key={yr}
                      label={String(yr)}
                      isSelected={yr === selectedYear}
                      onClick={() => { setSelectedYear(yr); setYearPickerOpen(false); }}
                    />
                  ))}
                </DropdownPicker>
              )}
            </div>

          </div>
        </div>

        {/* Week rows */}
        <div className="space-y-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5">
              {week.map((day, di) => {
                const inMonth    = getMonth(day) === selectedMonth && getYear(day) === selectedYear;
                const isCheckedIn = hasCheckIn(day);
                const isToday     = isSameDay(day, today);
                const expected    = getExpectedWorkout(day);
                const expectedColor = splitInfo?.colors[expected] || 'bg-slate-700/50';

                return (
                  <div
                    key={di}
                    className={`
                      aspect-square rounded-lg relative overflow-hidden
                      transition-all duration-200 active:scale-95
                      ${!inMonth ? 'opacity-15' : ''}
                      ${isCheckedIn
                        ? splitInfo
                          ? `${expectedColor} border border-white/20 shadow-sm`
                          : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md border border-emerald-400/30'
                        : 'bg-slate-800/60 border border-slate-700/40'
                      }
                      ${isToday ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900/50' : ''}
                    `}
                  >
                    <div className="absolute top-0.5 left-1 text-[8px] font-bold text-white/60">
                      {format(day, 'd')}
                    </div>

                    {isCheckedIn && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    {isToday && !isCheckedIn && (
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

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl p-3 border border-emerald-500/20">
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <p className="text-xl font-bold text-emerald-400">{getConsistencyRate()}</p>
            <p className="text-xs text-emerald-300 font-semibold">%</p>
          </div>
          <p className="text-[10px] text-slate-300 font-medium">Consistency</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-3 border border-blue-500/20">
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <p className="text-xl font-bold text-blue-400">{getWeeklyAverage()}</p>
            <p className="text-xs text-blue-300 font-semibold">/ {weeklyGoal}</p>
          </div>
          <p className="text-[10px] text-slate-300 font-medium">Per Week</p>
        </div>
      </div>

    </div>
  );
}