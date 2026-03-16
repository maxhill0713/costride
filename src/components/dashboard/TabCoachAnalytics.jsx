import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { subDays, format, isWithinInterval } from 'date-fns';
import { Activity, TrendingUp, Users, Zap, AlertCircle, Flame, Clock, Calendar } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar,
} from 'recharts';

// ── Shared styles ──────────────────────────────────────────────────────────────
const cardStyle = {
  background: '#0c1a2e',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
  position: 'relative',
  overflow: 'hidden',
};

const tickStyle = { fill: '#64748b', fontSize: 10, fontFamily: 'DM Sans, system-ui' };

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, padding: '9px 13px' }}>
      <p style={{ color: '#8ba0b8', marginBottom: 3, fontSize: 10, fontWeight: 600 }}>{label}</p>
      <p style={{ color: '#a78bfa', fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value}</p>
    </div>
  );
};

// ── KPI card ───────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, unit, color, trend, footerBar }) {
  return (
    <div style={{ ...cardStyle, padding: '18px 20px 16px' }}>
      <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.07, filter: 'blur(28px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: `linear-gradient(90deg,transparent,${color}55,transparent)`, pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color }}/>
        </div>
      </div>
      <div style={{ fontSize: 36, fontWeight: 900, color: '#f0f4f8', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 6 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: footerBar != null ? 10 : 0 }}>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{unit}</div>
        {trend != null && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: trend > 0 ? 'rgba(52,211,153,0.1)' : trend < 0 ? 'rgba(248,113,113,0.1)' : 'rgba(100,116,139,0.1)', color: trend > 0 ? '#34d399' : trend < 0 ? '#f87171' : '#64748b' }}>
            {trend > 0 ? `↑${trend}%` : trend < 0 ? `↓${Math.abs(trend)}%` : '→'}
          </span>
        )}
      </div>
      {footerBar != null && (
        <div style={{ height: 3, borderRadius: 99, background: `${color}18`, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, footerBar)}%`, background: `linear-gradient(90deg,${color},${color}cc)`, borderRadius: 99, transition: 'width 0.8s ease' }}/>
        </div>
      )}
    </div>
  );
}

// ── Heatmap ────────────────────────────────────────────────────────────────────
function HeatmapChart({ gymId }) {
  const [weeks, setWeeks] = useState(4);
  const { data: heatmapCIs = [] } = useQuery({
    queryKey: ['heatmapCheckIns', gymId, weeks],
    queryFn: () => base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 5000),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slotConfig = [
    { label: '6–8a',  hours: [6, 7]   },
    { label: '8–10a', hours: [8, 9]   },
    { label: '10–12', hours: [10, 11] },
    { label: '12–2p', hours: [12, 13] },
    { label: '4–6p',  hours: [16, 17] },
    { label: '6–8p',  hours: [18, 19] },
  ];

  const grid = useMemo(() => {
    const mat = Array.from({ length: 7 }, () => Array(slotConfig.length).fill(0));
    heatmapCIs.forEach(c => {
      const d   = new Date(c.check_in_date);
      const dow = (d.getDay() + 6) % 7;
      const h   = d.getHours();
      const si  = slotConfig.findIndex(s => s.hours.includes(h));
      if (si >= 0) mat[dow][si]++;
    });
    return mat;
  }, [heatmapCIs]);
  const maxVal = Math.max(...grid.flat(), 1);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[{ label: '4W', val: 4 }, { label: '12W', val: 12 }, { label: 'All', val: 0 }].map(opt => (
          <button key={opt.val} onClick={() => setWeeks(opt.val)} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, cursor: 'pointer', background: weeks === opt.val ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.05)', color: weeks === opt.val ? '#a78bfa' : '#64748b', border: `1px solid ${weeks === opt.val ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.15s' }}>{opt.label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `50px repeat(${slotConfig.length},1fr)`, gap: 4, marginBottom: 6 }}>
        <div/>
        {slotConfig.map(s => <div key={s.label} style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textAlign: 'center' }}>{s.label}</div>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {days.map((day, di) => (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: `50px repeat(${slotConfig.length},1fr)`, gap: 4, alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{day}</div>
            {grid[di].map((val, si) => {
              const pct = val / maxVal;
              const bg  = val === 0 ? 'rgba(255,255,255,0.03)' : pct < 0.25 ? 'rgba(167,139,250,0.18)' : pct < 0.5 ? 'rgba(167,139,250,0.38)' : pct < 0.75 ? 'rgba(167,139,250,0.6)' : 'rgba(167,139,250,0.88)';
              return (
                <div key={si} title={val > 0 ? `${day} ${slotConfig[si].label}: ${val}` : undefined} style={{ height: 34, borderRadius: 7, background: bg, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {val > 0 && <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>{val}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function TabCoachAnalytics({
  checkIns, ci30, totalMembers, myClasses = [],
  monthChangePct, retentionRate, activeThisMonth, atRisk, gymId,
}) {
  const now = new Date();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Weekly trend for my classes (last 8 weeks)
  const classWeeklyTrend = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const s = subDays(now, (7 - i) * 7);
    const e = subDays(now, (6 - i) * 7);
    return { label: format(s, 'MMM d'), value: checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: s, end: e })).length };
  }), [checkIns, now]);

  // Class attendance per class (30-day estimate from check-in time slots)
  const classAttendance = useMemo(() => myClasses.map(cls => {
    const attended = ci30.filter(c => {
      if (!cls.schedule) return false;
      const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
      if (!match) return false;
      let h = parseInt(match[1]);
      if (match[2].toLowerCase() === 'pm' && h !== 12) h += 12;
      const ch = new Date(c.check_in_date).getHours();
      return ch === h || ch === h + 1;
    }).length;
    const capacity = cls.max_capacity || 20;
    return { name: cls.name, schedule: cls.schedule, capacity, attended, fill: Math.min(100, Math.round((attended / capacity) * 100)) };
  }), [myClasses, ci30]);

  // Member frequency breakdown
  const memberFrequency = useMemo(() => {
    const freq = {};
    ci30.forEach(c => { freq[c.user_id] = (freq[c.user_id] || 0) + 1; });
    const vals = Object.values(freq);
    return {
      frequent:   vals.filter(v => v >= 12).length,
      occasional: vals.filter(v => v >= 4 && v < 12).length,
      rare:       vals.filter(v => v >= 1 && v < 4).length,
      inactive:   Math.max(0, totalMembers - vals.length),
    };
  }, [ci30, totalMembers]);

  // Peak hours
  const hourAcc = {};
  checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); hourAcc[h] = (hourAcc[h] || 0) + 1; });
  const hourMax   = Math.max(...Object.values(hourAcc), 1);
  const peakHours = Object.entries(hourAcc).sort(([,a],[,b]) => b - a).slice(0, 5).map(([hour, count]) => {
    const h = parseInt(hour);
    return { label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`, count, pct: (count / hourMax) * 100 };
  });

  // Busiest days
  const dayAcc  = {};
  checkIns.forEach(c => { const d = new Date(c.check_in_date).getDay(); dayAcc[d] = (dayAcc[d] || 0) + 1; });
  const dayMax  = Math.max(...Object.values(dayAcc), 1);
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const busiestDays = dayNames.map((name, idx) => ({ name, count: dayAcc[idx] || 0 })).sort((a,b) => b.count - a.count);

  const dailyAvg   = Math.round(ci30.length / 30);
  const returnRate = checkIns.length > 0 ? Math.round((checkIns.filter(c => !c.first_visit).length / checkIns.length) * 100) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 18, alignItems: 'start' }}>

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard icon={Activity}    label="Monthly Check-ins"  value={ci30.length}     unit="this month"       color="#0ea5e9" trend={monthChangePct} footerBar={totalMembers > 0 ? (ci30.length / (totalMembers * 4)) * 100 : 0}/>
          <KpiCard icon={Users}       label="Active Members"     value={activeThisMonth}  unit={`of ${totalMembers} total`} color="#10b981" footerBar={totalMembers > 0 ? (activeThisMonth / totalMembers) * 100 : 0}/>
          <KpiCard icon={TrendingUp}  label="Avg Visits/Member"  value={totalMembers > 0 ? (ci30.length / totalMembers).toFixed(1) : '—'} unit="this month" color="#a78bfa"/>
          <KpiCard icon={AlertCircle} label="At Risk"            value={atRisk}           unit="14+ days absent"  color={atRisk > 0 ? '#ef4444' : '#10b981'}/>
        </div>

        {/* Class Attendance Bars */}
        {classAttendance.length > 0 && (
          <div style={{ ...cardStyle, padding: '20px 20px 16px' }}>
            <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.35),transparent)', pointerEvents: 'none' }}/>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em', marginBottom: 4 }}>My Class Attendance (30 days)</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>Estimated from check-in time slots</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {classAttendance.map((cls, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>{cls.name}</span>
                      {cls.schedule && <span style={{ fontSize: 10, color: '#64748b', marginLeft: 8 }}>{cls.schedule}</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: cls.fill >= 75 ? '#34d399' : cls.fill >= 40 ? '#fbbf24' : '#f87171' }}>{cls.attended}</span>
                      <span style={{ fontSize: 9, color: '#64748b', marginLeft: 4 }}>/ {cls.capacity} cap</span>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cls.fill}%`, background: cls.fill >= 75 ? 'linear-gradient(90deg,#10b981,#34d399)' : cls.fill >= 40 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)', borderRadius: 99, transition: 'width 0.8s ease' }}/>
                  </div>
                  <div style={{ fontSize: 9, color: '#64748b', marginTop: 3, textAlign: 'right' }}>{cls.fill}% fill rate</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Trend */}
        <div style={{ ...cardStyle, padding: '20px 20px 14px' }}>
          <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg,transparent,rgba(56,189,248,0.35),transparent)', pointerEvents: 'none' }}/>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em', marginBottom: 4 }}>Client Attendance Trend</div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>8-week rolling view</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={classWeeklyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="coachAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#a78bfa" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
              <XAxis dataKey="label" tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} interval={1}/>
              <YAxis tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} width={28} allowDecimals={false}/>
              <Tooltip content={<ChartTip/>} cursor={{ stroke: 'rgba(167,139,250,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}/>
              <Area type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2.5} fill="url(#coachAreaGrad)" dot={false} activeDot={{ r: 5, fill: '#a78bfa', stroke: '#fff', strokeWidth: 2 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic Heatmap */}
        <div style={{ ...cardStyle, padding: '20px 20px 18px' }}>
          <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg,transparent,rgba(6,182,212,0.35),transparent)', pointerEvents: 'none' }}/>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em' }}>Client Traffic Heatmap</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Check-in density by day and time</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame style={{ width: 14, height: 14, color: '#a78bfa' }}/>
            </div>
          </div>
          <HeatmapChart gymId={gymId}/>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* 30-Day Snapshot */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 14 }}>30-Day Snapshot</div>
          {[
            { label: 'Total check-ins',    value: ci30.length,                                                 color: '#38bdf8' },
            { label: 'Active members',     value: activeThisMonth,                                             color: '#34d399' },
            { label: 'At-risk members',    value: atRisk,                                                      color: atRisk > 0 ? '#f87171' : '#34d399' },
            { label: 'My classes',         value: myClasses.length,                                            color: '#a78bfa' },
            { label: 'Avg visits/member',  value: totalMembers > 0 ? (ci30.length / totalMembers).toFixed(1) : '—', color: '#fbbf24' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>{s.label}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}25`, borderRadius: 7, padding: '2px 9px' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Member Frequency */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 14 }}>Client Frequency</div>
          <div style={{ height: 7, borderRadius: 99, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 14 }}>
            {[
              { val: memberFrequency.frequent,   color: '#10b981' },
              { val: memberFrequency.occasional, color: '#0ea5e9' },
              { val: memberFrequency.rare,       color: '#a78bfa' },
              { val: memberFrequency.inactive,   color: '#f59e0b' },
            ].filter(s => s.val > 0).map((s, i, arr) => (
              <div key={i} style={{ flex: s.val, height: '100%', background: s.color, opacity: 0.85, borderRadius: i === 0 ? '99px 0 0 99px' : i === arr.length-1 ? '0 99px 99px 0' : 0 }}/>
            ))}
          </div>
          {[
            { label: 'Frequent',   sub: '12+ visits/mo', val: memberFrequency.frequent,   color: '#10b981' },
            { label: 'Occasional', sub: '4–11/mo',        val: memberFrequency.occasional, color: '#0ea5e9' },
            { label: 'Rare',       sub: '1–3/mo',         val: memberFrequency.rare,       color: '#a78bfa' },
            { label: 'Inactive',   sub: '0 visits',       val: memberFrequency.inactive,   color: '#f59e0b' },
          ].map((s, i) => {
            const pct = totalMembers > 0 ? Math.round((s.val / totalMembers) * 100) : 0;
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }}/>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#d4e4f4' }}>{s.label}</span>
                    <span style={{ fontSize: 9, color: '#64748b' }}>{s.sub}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.val}</span>
                    <span style={{ fontSize: 9, color: '#64748b', minWidth: 26, textAlign: 'right' }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${s.color},${s.color}99)`, borderRadius: 99, transition: 'width 0.8s ease' }}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Peak Hours */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>Peak Hours</div>
            <Clock style={{ width: 13, height: 13, color: '#fbbf24' }}/>
          </div>
          {peakHours.length === 0 ? (
            <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '12px 0', margin: 0 }}>No data yet</p>
          ) : peakHours.map((h, i) => (
            <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', width: 36, flexShrink: 0 }}>{h.label}</span>
              <div style={{ flex: 1, height: 5, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: '100%', width: `${h.pct}%`, borderRadius: 99, background: i === 0 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.7s ease' }}/>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? '#fbbf24' : '#94a3b8', width: 22, textAlign: 'right', flexShrink: 0 }}>{h.count}</span>
            </div>
          ))}
        </div>

        {/* Busiest Days */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>Busiest Days</div>
            <Calendar style={{ width: 13, height: 13, color: '#34d399' }}/>
          </div>
          {busiestDays.map(({ name, count }, rank) => {
            const pct   = (count / dayMax) * 100;
            const isTop = rank === 0;
            return (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: isTop ? '#fbbf24' : '#64748b', width: 18, textAlign: 'right', flexShrink: 0 }}>#{rank+1}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', width: 30, flexShrink: 0 }}>{name}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: isTop ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#0ea5e9,#06b6d4)', transition: 'width 0.7s ease' }}/>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: isTop ? '#fbbf24' : '#94a3b8', width: 22, textAlign: 'right', flexShrink: 0 }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}