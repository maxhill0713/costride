import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Activity, TrendingUp, Users, AlertCircle, Flame,
  Clock, Calendar, BarChart2, Star, Award, Zap,
  TrendingDown, CheckCircle, RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, BarChart, Bar, Cell,
} from 'recharts';

// ─── Shared styles ────────────────────────────────────────────────────────────
const card = {
  background: '#0c1a2e',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
  position: 'relative',
  overflow: 'hidden',
};
const tick = { fill: '#64748b', fontSize: 10, fontFamily: 'DM Sans, system-ui' };

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, padding: '9px 13px' }}>
      <p style={{ color: '#8ba0b8', marginBottom: 3, fontSize: 10, fontWeight: 600 }}>{label}</p>
      <p style={{ color: '#a78bfa', fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value}</p>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = '#a78bfa', icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      {Icon && (
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}18`, border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 13, height: 13, color: accent }}/>
        </div>
      )}
      {!Icon && <div style={{ width: 3, height: 14, borderRadius: 99, background: accent, flexShrink: 0 }}/>}
      <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>{children}</span>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color, trend, bar }) {
  return (
    <div style={{ ...card, padding: '16px 18px' }}>
      <div style={{ position: 'absolute', bottom: -18, right: -18, width: 72, height: 72, borderRadius: '50%', background: color, opacity: 0.07, filter: 'blur(24px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: `linear-gradient(90deg,transparent,${color}55,transparent)`, pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color }}/>
        </div>
        {trend != null && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: trend > 0 ? 'rgba(52,211,153,0.1)' : trend < 0 ? 'rgba(248,113,113,0.1)' : 'rgba(100,116,139,0.1)', color: trend > 0 ? '#34d399' : trend < 0 ? '#f87171' : '#64748b' }}>
            {trend > 0 ? `↑${trend}%` : trend < 0 ? `↓${Math.abs(trend)}%` : '→'}
          </span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#f0f4f8', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{sub}</div>
      {bar != null && (
        <div style={{ marginTop: 10, height: 3, borderRadius: 99, background: `${color}14`, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, bar)}%`, background: `linear-gradient(90deg,${color},${color}bb)`, borderRadius: 99, transition: 'width 0.8s ease' }}/>
        </div>
      )}
    </div>
  );
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────
function HeatmapChart({ gymId }) {
  const [weeks, setWeeks] = useState(4);
  const { data: hmCIs = [] } = useQuery({
    queryKey: ['heatmapCIs', gymId, weeks],
    queryFn: () => base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 5000),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });
  const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const slots = [
    { label: '6–8a',  hours: [6,7]    },
    { label: '8–10a', hours: [8,9]    },
    { label: '10–12', hours: [10,11]  },
    { label: '12–2p', hours: [12,13]  },
    { label: '4–6p',  hours: [16,17]  },
    { label: '6–8p',  hours: [18,19]  },
  ];
  const grid = useMemo(() => {
    const mat = Array.from({ length: 7 }, () => Array(slots.length).fill(0));
    hmCIs.forEach(c => {
      const d   = new Date(c.check_in_date);
      const dow = (d.getDay() + 6) % 7;
      const h   = d.getHours();
      const si  = slots.findIndex(s => s.hours.includes(h));
      if (si >= 0) mat[dow][si]++;
    });
    return mat;
  }, [hmCIs]);
  const maxVal = Math.max(...grid.flat(), 1);
  return (
    <div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
        {[{ label: '4W', val: 4 }, { label: '12W', val: 12 }, { label: 'All', val: 0 }].map(o => (
          <button key={o.val} onClick={() => setWeeks(o.val)} style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99, cursor: 'pointer', background: weeks === o.val ? 'rgba(167,139,250,0.16)' : 'rgba(255,255,255,0.04)', color: weeks === o.val ? '#a78bfa' : '#64748b', border: `1px solid ${weeks === o.val ? 'rgba(167,139,250,0.38)' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.15s' }}>{o.label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length},1fr)`, gap: 3, marginBottom: 5 }}>
        <div/>
        {slots.map(s => <div key={s.label} style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textAlign: 'center' }}>{s.label}</div>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {days.map((day, di) => (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length},1fr)`, gap: 3, alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{day}</div>
            {grid[di].map((val, si) => {
              const p  = val / maxVal;
              const bg = val === 0 ? 'rgba(255,255,255,0.03)' : p < 0.25 ? 'rgba(167,139,250,0.18)' : p < 0.5 ? 'rgba(167,139,250,0.38)' : p < 0.75 ? 'rgba(167,139,250,0.6)' : 'rgba(167,139,250,0.9)';
              return (
                <div key={si} title={val > 0 ? `${day} ${slots[si].label}: ${val}` : undefined}
                  style={{ height: 30, borderRadius: 6, background: bg, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {val > 0 && <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{val}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
        <span style={{ fontSize: 9, color: '#3a5070' }}>Low</span>
        {[0.03, 0.18, 0.38, 0.6, 0.9].map((o, i) => (
          <div key={i} style={{ width: 14, height: 8, borderRadius: 2, background: `rgba(167,139,250,${o})` }}/>
        ))}
        <span style={{ fontSize: 9, color: '#3a5070' }}>High</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TabCoachAnalytics({
  ci30Count = 0, totalMembers, myClasses = [],
  monthChangePct, retentionRate, activeThisMonth, atRisk, gymId,
  // Pre-computed from backend
  ci7Count = 0, ci7pCount = 0, weeklyTrendCoach = 0, monthlyTrendCoach = 0,
  returningCount = 0, newMembersThis30 = 0,
  weeklyChart = [], monthlyChart = [],
  engagementSegmentsCoach = {}, weekSpark = [],
  peakHours = [], busiestDays = [],
}) {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const weeklyTrend  = weeklyTrendCoach;
  const monthlyTrend = monthlyTrendCoach;
  const superActive  = engagementSegmentsCoach.superActive ?? 0;
  const active       = engagementSegmentsCoach.active      ?? 0;
  const casual       = engagementSegmentsCoach.casual      ?? 0;
  const inactive     = engagementSegmentsCoach.inactive    ?? 0;
  const engRate      = engagementSegmentsCoach.engRate     ?? 0;
  const churnRate    = totalMembers > 0 ? Math.round((atRisk / totalMembers) * 100) : 0;
  const dayMax       = Math.max(...busiestDays.map(d => d.count), 1);

  // ── Class performance (still uses myClasses + ci30Count heuristic) ─────────
  const classPerf = myClasses.map(cls => {
    const capacity = cls.max_capacity || cls.capacity || 20;
    // Use avg daily check-ins as proxy for class attendance (no raw checkIns available)
    const attended = cls.estimated_attendance || Math.round(ci30Count / Math.max(myClasses.length * 30, 1));
    return { name: cls.name, schedule: cls.schedule, capacity, attended, fill: Math.min(100, Math.round((attended / capacity) * 100)) };
  }).sort((a, b) => b.fill - a.fill);

  const avgFill         = classPerf.length > 0 ? Math.round(classPerf.reduce((s, c) => s + c.fill, 0) / classPerf.length) : 0;
  const classesThisWeek = myClasses.length;
  const avgAttendance   = classPerf.length > 0 ? Math.round(classPerf.reduce((s, c) => s + c.attended, 0) / classPerf.length) : 0;
  const engagementScore = Math.round((engRate + Math.min(100, avgFill) + Math.min(100, (returningCount / Math.max(totalMembers, 1)) * 100)) / 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ══ 1. COACH STATS ═══════════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent="#a78bfa" icon={Award}>Coach Stats</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard icon={Dumbbell_}    label="Classes This Week"    value={classesThisWeek}                    sub="assigned to you"                              color="#a78bfa"/>
          <KpiCard icon={Users}        label="Avg Attendance"        value={avgAttendance}                     sub="per class / 30d"                              color="#38bdf8" bar={avgFill}/>
          <KpiCard icon={Activity}     label="Avg Fill Rate"         value={`${avgFill}%`}                     sub="across all classes"                           color={avgFill >= 70 ? '#34d399' : avgFill >= 40 ? '#fbbf24' : '#f87171'} bar={avgFill}/>
          <KpiCard icon={Zap}          label="Engagement Score"      value={engagementScore}                   sub="coach performance index"                      color="#fbbf24" bar={engagementScore}/>
        </div>
      </section>

      {/* ══ 2. MEMBER ENGAGEMENT ═════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent="#10b981" icon={Users}>Member Engagement</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 14 }}>

          {/* 30-day engagement breakdown */}
          <div style={{ ...card, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', marginBottom: 4 }}>30-Day Engagement Breakdown</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>{engRate}% of members engaged</div>
            {/* Stacked bar */}
            <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 16 }}>
              {totalMembers > 0 && [
                { val: superActive, color: '#10b981' },
                { val: active,      color: '#38bdf8' },
                { val: casual,      color: '#a78bfa' },
                { val: inactive,    color: '#334155' },
              ].filter(t => t.val > 0).map((t, i, arr) => (
                <div key={i} style={{ flex: t.val, background: t.color, opacity: 0.85, borderRadius: i===0 ? '99px 0 0 99px' : i===arr.length-1 ? '0 99px 99px 0' : 0 }}/>
              ))}
            </div>
            {[
              { label: 'Super Active', sub: '12+ visits/mo', val: superActive, color: '#10b981' },
              { label: 'Active',       sub: '4–11/mo',        val: active,      color: '#38bdf8' },
              { label: 'Casual',       sub: '1–3/mo',         val: casual,      color: '#a78bfa' },
              { label: 'Inactive',     sub: '0 visits',       val: inactive,    color: '#475569' },
            ].map((t, i) => {
              const pct = totalMembers > 0 ? Math.round((t.val / totalMembers) * 100) : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#d4e4f4' }}>{t.label} <span style={{ fontSize: 9, color: '#64748b', fontWeight: 400 }}>{t.sub}</span></span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: t.color }}>{t.val}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${t.color},${t.color}88)`, borderRadius: 99, transition: 'width 0.8s ease' }}/>
                    </div>
                  </div>
                  <span style={{ fontSize: 9, color: '#64748b', width: 24, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Active vs Inactive */}
          <div style={{ ...card, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', marginBottom: 14 }}>Active vs Inactive Members</div>
            {/* Big ring visual */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10}/>
                  <circle cx={50} cy={50} r={40} fill="none" stroke="#10b981" strokeWidth={10}
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - (superActive + active) / Math.max(totalMembers, 1))}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }}/>
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#f0f4f8', lineHeight: 1 }}>{engRate}%</div>
                  <div style={{ fontSize: 8, color: '#3a5070', fontWeight: 600 }}>engaged</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {[
                  { label: 'Active',    value: superActive + active, color: '#10b981', pct: totalMembers > 0 ? Math.round(((superActive + active) / totalMembers) * 100) : 0 },
                  { label: 'Casual',   value: casual,                color: '#a78bfa', pct: totalMembers > 0 ? Math.round((casual / totalMembers) * 100) : 0 },
                  { label: 'Inactive', value: inactive,              color: '#475569', pct: totalMembers > 0 ? Math.round((inactive / totalMembers) * 100) : 0 },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }}/>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{s.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</span>
                      <span style={{ fontSize: 10, color: '#475569' }}>{s.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Average visits per member */}
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Avg visits / member (30d)</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#a78bfa' }}>{totalMembers > 0 ? (ci30Count / totalMembers).toFixed(1) : '—'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 3. ATTENDANCE TRENDS ═════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent="#38bdf8" icon={TrendingUp}>Attendance Trends</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 14 }}>

          {/* Weekly check-ins */}
          <div style={{ ...card, padding: '18px 20px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>Weekly Check-ins</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>8-week rolling view</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: weeklyTrend > 0 ? 'rgba(52,211,153,0.1)' : weeklyTrend < 0 ? 'rgba(248,113,113,0.1)' : 'rgba(100,116,139,0.1)', color: weeklyTrend > 0 ? '#34d399' : weeklyTrend < 0 ? '#f87171' : '#64748b', flexShrink: 0 }}>
                {weeklyTrend > 0 ? `↑${weeklyTrend}%` : weeklyTrend < 0 ? `↓${Math.abs(weeklyTrend)}%` : '→'} vs prior wk
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={weeklyChart} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#38bdf8" stopOpacity={0.35}/>
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="label" tick={tick} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} interval={1}/>
                  <YAxis tick={tick} axisLine={false} tickLine={false} width={24} allowDecimals={false}/>
                  <Tooltip content={<ChartTip/>} cursor={{ stroke: 'rgba(56,189,248,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}/>
                  <Area type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2.5} fill="url(#weekGrad)" dot={false} activeDot={{ r: 5, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Summary row */}
            <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 8 }}>
              {[
                { label: 'This week',  value: ci7Count,                               color: '#38bdf8' },
                { label: 'Last week',  value: ci7pCount,                              color: '#64748b' },
                { label: 'Avg/week',   value: Math.round(weeklyChart.reduce((s, d) => s + d.value, 0) / 8), color: '#a78bfa' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly check-ins */}
          <div style={{ ...card, padding: '18px 20px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>Monthly Check-ins</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Last 6 months</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: monthlyTrend > 0 ? 'rgba(52,211,153,0.1)' : monthlyTrend < 0 ? 'rgba(248,113,113,0.1)' : 'rgba(100,116,139,0.1)', color: monthlyTrend > 0 ? '#34d399' : monthlyTrend < 0 ? '#f87171' : '#64748b', flexShrink: 0 }}>
                {monthlyTrend > 0 ? `↑${monthlyTrend}%` : monthlyTrend < 0 ? `↓${Math.abs(monthlyTrend)}%` : '→'} vs prior mo
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyChart} margin={{ top: 6, right: 4, left: 0, bottom: 0 }} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="label" tick={tick} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false}/>
                  <YAxis tick={tick} axisLine={false} tickLine={false} width={24} allowDecimals={false}/>
                  <Tooltip content={<ChartTip/>} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="value" radius={[5,5,2,2]}>
                    {monthlyChart.map((_, i) => (
                      <Cell key={i} fill={i === monthlyChart.length-1 ? '#a78bfa' : 'rgba(167,139,250,0.4)'}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 8 }}>
              {[
                { label: 'This month', value: ci30Count,                        color: '#a78bfa' },
                { label: 'Last month', value: monthlyChart[monthlyChart.length - 2]?.value ?? 0, color: '#64748b' },
                { label: 'Avg/day',    value: Math.round(ci30Count / 30),    color: '#38bdf8' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Traffic heatmap */}
        <div style={{ ...card, padding: '18px 20px', marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>Client Traffic Heatmap</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Check-in density by day and time slot</div>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame style={{ width: 13, height: 13, color: '#a78bfa' }}/>
            </div>
          </div>
          <HeatmapChart gymId={gymId}/>
        </div>
      </section>

      {/* ══ 4. CLASS PERFORMANCE ═════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent="#fbbf24" icon={BarChart2}>Class Performance</SectionLabel>
        {classPerf.length === 0 ? (
          <div style={{ ...card, padding: '28px', textAlign: 'center' }}>
            <BarChart2 style={{ width: 24, height: 24, color: '#3a5070', margin: '0 auto 10px' }}/>
            <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: 0 }}>No classes to analyse yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {classPerf.map((cls, i) => {
              const fillColor = cls.fill >= 80 ? '#34d399' : cls.fill >= 60 ? '#fbbf24' : cls.fill >= 40 ? '#f97316' : '#f87171';
              const fillLabel = cls.fill >= 80 ? 'Excellent' : cls.fill >= 60 ? 'Good' : cls.fill >= 40 ? 'Fair' : 'Low';
              return (
                <div key={i} style={{ ...card, padding: '14px 18px' }}>
                  {/* Top colour stripe */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${fillColor},${fillColor}66)`, borderRadius: '16px 16px 0 0' }}/>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${fillColor}14`, border: `1px solid ${fillColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <Dumbbell_ style={{ width: 14, height: 14, color: fillColor }}/>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.01em' }}>{cls.name}</div>
                        {cls.schedule && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>🕐 {cls.schedule}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flex: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: fillColor, lineHeight: 1, letterSpacing: '-0.03em' }}>{cls.fill}%</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: fillColor, background: `${fillColor}12`, border: `1px solid ${fillColor}25`, borderRadius: 5, padding: '1px 7px', textAlign: 'right', marginTop: 3 }}>{fillLabel}</div>
                    </div>
                  </div>
                  {/* Fill bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${cls.fill}%`, background: `linear-gradient(90deg,${fillColor},${fillColor}88)`, borderRadius: 99, transition: 'width 0.8s ease' }}/>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>{cls.attended} / {cls.capacity} capacity</span>
                  </div>
                  {/* Rank badge */}
                  {i === 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.22)', borderRadius: 6, padding: '2px 9px' }}>
                      <Star style={{ width: 9, height: 9 }}/> Most Popular Class
                    </div>
                  )}
                </div>
              );
            })}

            {/* Fill rate summary bar chart */}
            <div style={{ ...card, padding: '16px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8', marginBottom: 14 }}>Fill Rate Comparison</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={classPerf} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false}/>
                  <YAxis tick={tick} axisLine={false} tickLine={false} width={24} domain={[0, 100]} unit="%"/>
                  <Tooltip formatter={(v) => [`${v}%`, 'Fill rate']} contentStyle={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#8ba0b8' }}/>
                  <Bar dataKey="fill" radius={[5,5,2,2]}>
                    {classPerf.map((cls, i) => (
                      <Cell key={i} fill={cls.fill >= 80 ? '#34d399' : cls.fill >= 60 ? '#fbbf24' : cls.fill >= 40 ? '#f97316' : '#f87171'}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {/* ══ 5. MEMBER RETENTION ══════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent="#f87171" icon={RefreshCw}>Member Retention</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
          <KpiCard icon={AlertCircle}  label="Members at Risk"   value={atRisk}           sub="14+ days absent"                                         color={atRisk > 0 ? '#ef4444' : '#10b981'} subColor={atRisk > 0 ? '#f87171' : '#34d399'}/>
          <KpiCard icon={TrendingDown} label="Est. Churn Rate"   value={`${churnRate}%`}  sub={`${atRisk} of ${totalMembers} members`}                  color={churnRate > 15 ? '#ef4444' : churnRate > 8 ? '#f97316' : '#10b981'}/>
          <KpiCard icon={CheckCircle}  label="Returning Members" value={returningCount}    sub="visited again in 30d"                                    color="#34d399" bar={totalMembers > 0 ? (returningCount / totalMembers) * 100 : 0}/>
        </div>

        {/* Retention detail card */}
        <div style={{ ...card, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', marginBottom: 16 }}>Retention Breakdown</div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16 }}>

            {/* Left: funnel-style bars */}
            <div>
              {[
                { label: 'Total Members',     value: totalMembers,               color: '#38bdf8', pct: 100 },
                { label: 'Active This Month', value: activeThisMonth,            color: '#34d399', pct: totalMembers > 0 ? Math.round((activeThisMonth / totalMembers) * 100) : 0 },
                { label: 'Returning Members', value: returningCount,             color: '#a78bfa', pct: totalMembers > 0 ? Math.round((returningCount / totalMembers) * 100) : 0 },
                { label: 'New Members',       value: newMembersThis30,           color: '#fbbf24', pct: totalMembers > 0 ? Math.round((newMembersThis30 / totalMembers) * 100) : 0 },
                { label: 'At Risk',           value: atRisk,                     color: '#f87171', pct: totalMembers > 0 ? Math.round((atRisk / totalMembers) * 100) : 0 },
              ].map((s, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{s.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</span>
                      <span style={{ fontSize: 10, color: '#475569' }}>{s.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: `linear-gradient(90deg,${s.color},${s.color}99)`, borderRadius: 99, transition: 'width 0.8s ease' }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: peak hours + busiest days */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#f0f4f8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock style={{ width: 11, height: 11, color: '#fbbf24' }}/> Peak Hours
                </div>
                {peakHours.length === 0
                  ? <p style={{ fontSize: 10, color: '#3a5070', margin: 0 }}>No data yet</p>
                  : peakHours.map((h, i) => (
                  <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#f0f4f8', width: 32, flexShrink: 0 }}>{h.label}</span>
                    <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${h.pct}%`, borderRadius: 99, background: i === 0 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.7s ease' }}/>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? '#fbbf24' : '#64748b', width: 20, textAlign: 'right', flexShrink: 0 }}>{h.count}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#f0f4f8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar style={{ width: 11, height: 11, color: '#34d399' }}/> Busiest Days
                </div>
                {busiestDays.slice(0, 5).map(({ name, count }, rank) => {
                  const pct = (count / dayMax) * 100;
                  return (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: rank === 0 ? '#fbbf24' : '#64748b', width: 16, textAlign: 'center', flexShrink: 0 }}>#{rank+1}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', width: 28, flexShrink: 0 }}>{name}</span>
                      <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: rank === 0 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#0ea5e9,#06b6d4)', transition: 'width 0.7s ease' }}/>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: rank === 0 ? '#fbbf24' : '#94a3b8', width: 20, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Fix: Dumbbell isn't exported from lucide-react as Dumbbell_ — alias it
function Dumbbell_({ style }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M6 5h2M16 5h2M4 7h2M18 7h2M7 5v14M17 5v14M5 7v10M19 7v10M7 9h10M7 15h10"/>
    </svg>
  );
}