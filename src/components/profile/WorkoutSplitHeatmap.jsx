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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WorkoutSplitHeatmap({
  checkIns = [], workoutSplit, weeklyGoal = 3, trainingDays = [], customWorkoutTypes = {}
}) {
  const today = new Date();
  const [selectedYear, setSelectedYear]   = useState(getYear(today));
  const [selectedMonth, setSelectedMonth] = useState(getMonth(today));
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [yearPickerOpen,  setYearPickerOpen]  = useState(false);

  const splitSchedules = {
    ppl: {
      name: 'Push/Pull/Legs',
      schedule: ['Push','Pull','Legs','Push','Pull','Legs','Rest'],
    },
    upper_lower: {
      name: 'Upper/Lower',
      schedule: ['Upper','Lower','Rest','Upper','Lower','Rest','Rest'],
    },
    full_body: {
      name: 'Full Body',
      schedule: ['Full Body','Rest','Full Body','Rest','Full Body','Rest','Rest'],
    },
    bro_split: {
      name: 'Bro Split',
      schedule: ['Chest','Back','Shoulders','Arms','Legs','Rest','Rest'],
    },
  };

  const { weeks, splitInfo, hasCheckIn } = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const monthEnd   = endOfMonth(monthStart);
    const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const allDays    = eachDayOfInterval({ start: gridStart, end: gridEnd });

    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7));

    const hasCheckIn = (day) => checkIns.some(c => isSameDay(new Date(c.check_in_date), day));

    let splitInfo = workoutSplit && splitSchedules[workoutSplit]
      ? splitSchedules[workoutSplit]
      : null;

    if (workoutSplit === 'custom') {
      const schedule = [];
      if (trainingDays.length > 0) {
        for (let i = 1; i <= 7; i++) {
          schedule.push(trainingDays.includes(i) ? (customWorkoutTypes[i]?.name || 'Train') : 'Rest');
        }
      } else {
        schedule.push('Train','Train','Rest','Train','Train','Rest','Rest');
      }
      splitInfo = { name: 'Custom Split', schedule };
    }

    return { weeks, splitInfo, hasCheckIn };
  }, [checkIns, workoutSplit, selectedYear, selectedMonth, trainingDays, customWorkoutTypes]);

  const getExpectedWorkout = (day) => {
    if (!splitInfo) return null;

    if (workoutSplit === 'custom' && trainingDays.length > 0) {
      const dayOfWeek   = day.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      if (trainingDays.includes(adjustedDay)) {
        return customWorkoutTypes[adjustedDay]?.name || 'Train';
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
    const daysDiff    = Math.floor((day - firstCheckIn) / 86400000);
    const scheduleIdx = ((daysDiff % 7) + 7) % 7;
    return splitInfo.schedule[scheduleIdx];
  };

  // Consistency: only count training days (not rest days) in denominator
  const getConsistencyRate = () => {
    const pastTrainingDays = weeks.flat().filter(d => {
      if (d > today) return false;
      const expected = getExpectedWorkout(d);
      return expected !== 'Rest' && expected !== null;
    });
    if (!pastTrainingDays.length) return 0;
    return Math.round(
      (pastTrainingDays.filter(d => hasCheckIn(d)).length / pastTrainingDays.length) * 100
    );
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
    transition: 'background 0.12s ease',
    outline: 'none',
  });

  const consistencyRate = getConsistencyRate();

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(15,20,45,0.88) 0%, rgba(8,11,26,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="p-3 space-y-3">

        {/* ── Top row: consistency + pickers ── */}
        <div className="flex items-center justify-between">

          {/* Consistency — balanced weight between number and label */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{
              fontSize: 18, fontWeight: 700, color: '#34d399',
              lineHeight: 1, letterSpacing: '-0.02em',
            }}>
              {consistencyRate}
              <span style={{ fontSize: 12, fontWeight: 600, color: '#4ade80' }}>%</span>
            </span>
            <span style={{
              fontSize: 11, fontWeight: 500, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Consistency
            </span>
          </div>

          {/* Month + Year pickers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div className="relative">
              <button
                onClick={() => { setMonthPickerOpen(o => !o); setYearPickerOpen(false); }}
                style={pillBtn(monthPickerOpen)}
              >
                {MONTH_NAMES[selectedMonth].slice(0, 3)}
                <ChevronDown size={10} color="#64748b"
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
                <ChevronDown size={10} color="#64748b"
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

        {/* ── Day-of-week headers ── */}
        <div className="grid grid-cols-7 gap-1.5">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} style={{
              textAlign: 'center', fontSize: 10, fontWeight: 500,
              color: '#475569', letterSpacing: '0.04em',
            }}>{d}</div>
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
                const isMissed    = inMonth && isPast && !isCheckedIn && !isRestDay;

                // ── Colour logic ──
                // Checked in → blue
                // Past/today rest day → emerald (earned rest)
                // Future (training or rest) → uniform dark grey
                // Missed training → very dark, no cross icon — opacity does the work
                // Out-of-month padding → near invisible

                let bg = '';
                let border = '';
                let opacity = inMonth ? 1 : 0.12;

                if (isCheckedIn) {
                  bg = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                  border = '1px solid rgba(96,165,250,0.3)';
                } else if (isRestDay && !isFuture && inMonth) {
                  bg = 'linear-gradient(135deg, #10b981 0%, #065f46 100%)';
                  border = '1px solid rgba(52,211,153,0.25)';
                } else if (isMissed) {
                  // Missed: slightly darker than future, no icon — clean
                  bg = 'rgba(15,18,30,0.9)';
                  border = '1px solid rgba(71,85,105,0.4)';
                  opacity = inMonth ? 0.55 : 0.12;
                } else {
                  // Future days, unlogged training days, padding
                  bg = 'rgba(30,37,56,0.7)';
                  border = '1px solid rgba(71,85,105,0.3)';
                }

                return (
                  <div
                    key={di}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 6,
                      position: 'relative',
                      overflow: 'hidden',
                      background: bg,
                      border,
                      opacity,
                      transition: 'opacity 0.2s ease',
                      outline: isToday ? '2px solid rgba(96,165,250,0.6)' : 'none',
                      outlineOffset: isToday ? '1px' : '0',
                    }}
                  >
                    {/* Check-in tick — white, centred, no date number */}
                    {isCheckedIn && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                          <path d="M4 10.5l4.5 4.5 7.5-9" stroke="rgba(255,255,255,0.9)"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}

                    {/* Today pulse dot — only if not yet checked in */}
                    {isToday && !isCheckedIn && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: '#60a5fa',
                          animation: 'pulse 2s ease-in-out infinite',
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Legend row ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          paddingTop: 4,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {[
            { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', label: 'Trained' },
            { bg: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)', label: 'Rest' },
            { bg: 'rgba(15,18,30,0.9)', label: 'Missed', dim: true },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 9, height: 9, borderRadius: 2,
                background: item.bg,
                opacity: item.dim ? 0.55 : 1,
                border: '1px solid rgba(255,255,255,0.1)',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 10, fontWeight: 500, color: '#475569' }}>{item.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}