import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { subDays, format, isWithinInterval } from 'date-fns';
import {
  Activity, TrendingUp, Users, Zap, ArrowUpRight, TrendingDown,
  Calendar, Clock, Flame
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, BarChart, Bar, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// ── Shared primitives ────────────────────────────────────────────────────────

const Card = ({ children, style = {}, accentColor }) => (
  <div style={{
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    ...style,
  }}>
    {accentColor && (
      <div style={{
        position: 'absolute', top: 0, left: 20, right: 20, height: 1,
        background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)`,
        pointerEvents: 'none',
      }}/>
    )}
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4,
  }}>{children}</div>
);

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ color: 'var(--text3)', marginBottom: 2, fontSize: 10 }}>{label}</p>
      <p style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: 13 }}>{payload[0].value}</p>
    </div>
  );
};

const Empty = ({ icon: Icon, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
    <Icon style={{ width: 26, height: 26, color: 'var(--text3)', opacity: 0.35 }}/>
    <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{label}</span>
  </div>
);

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, unit, color, trend }) {
  return (
    <div style={{
      borderRadius: 16, padding: '18px 18px 16px',
      background: 'var(--card)', border: '1px solid var(--border)',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 16, right: 16, height: 1,
        background: `linear-gradient(90deg, transparent, ${color}55, transparent)`,
      }}/>
      <div style={{
        position: 'absolute', bottom: -18, right: -18, width: 72, height: 72,
        borderRadius: '50%', background: color, opacity: 0.07, filter: 'blur(22px)',
      }}/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionLabel>{label}</SectionLabel>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `${color}18`, border: `1px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: 13, height: 13, color }}/>
        </div>
      </div>
      <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, marginBottom: 8 }}>{unit}</div>
      {trend !== null && trend !== undefined && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          padding: '3px 8px', borderRadius: 99,
          background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        }}>
          {trend >= 0
            ? <ArrowUpRight style={{ width: 10, height: 10, color: '#10b981' }}/>
            : <TrendingDown style={{ width: 10, height: 10, color: '#ef4444' }}/>}
          <span style={{ fontSize: 10, fontWeight: 700, color: trend >= 0 ? '#34d399' : '#f87171' }}>
            {Math.abs(trend)}%
          </span>
        </div>
      )}
    </div>
  );
}

// ── Improved Heatmap ──────────────────────────────────────────────────────────

function HeatmapChart({ gymId }) {
  const { data: heatmapCheckIns = [] } = useQuery({
    queryKey: ['heatmapCheckIns', gymId],
    queryFn: () => base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 5000),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slotConfig = [
    { label: '6–8a',  hours: [6, 7] },
    { label: '8–10a', hours: [8, 9] },
    { label: '10–12', hours: [10, 11] },
    { label: '12–2p', hours: [12, 13] },
    { label: '2–4p',  hours: [14, 15] },
    { label: '4–6p',  hours: [16, 17] },
    { label: '6–8p',  hours: [18, 19] },
    { label: '8–10p', hours: [20, 21] },
  ];

  const grid = useMemo(() => {
    const mat = Array.from({ length: 7 }, () => Array(slotConfig.length).fill(0));
    heatmapCheckIns.forEach(c => {
      const d   = new Date(c.check_in_date);
      const dow = (d.getDay() + 6) % 7;
      const h   = d.getHours();
      const si  = slotConfig.findIndex(s => s.hours.includes(h));
      if (si >= 0) mat[dow][si]++;
    });
    return mat;
  }, [checkIns]);

  const maxVal = Math.max(...grid.flat(), 1);

  let peakDay = 0, peakSlot = 0;
  grid.forEach((row, di) => row.forEach((val, si) => {
    if (val > grid[peakDay][peakSlot]) { peakDay = di; peakSlot = si; }
  }));

  const getCellStyle = (val, di, si) => {
    const pct    = val / maxVal;
    const isPeak = di === peakDay && si === peakSlot && val > 0;
    if (isPeak) return { bg: 'linear-gradient(135deg,rgba(245,158,11,0.85),rgba(239,68,68,0.65))', border: 'rgba(245,158,11,0.6)', shadow: '0 0 12px rgba(245,158,11,0.25)' };
    if (val === 0) return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.05)', shadow: 'none' };
    if (pct < 0.2)  return { bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.2)',  shadow: 'none' };
    if (pct < 0.4)  return { bg: 'rgba(14,165,233,0.28)', border: 'rgba(14,165,233,0.32)', shadow: 'none' };
    if (pct < 0.6)  return { bg: 'rgba(14,165,233,0.48)', border: 'rgba(14,165,233,0.52)', shadow: '0 0 6px rgba(14,165,233,0.15)' };
    if (pct < 0.8)  return { bg: 'rgba(14,165,233,0.68)', border: 'rgba(14,165,233,0.72)', shadow: '0 0 8px rgba(14,165,233,0.2)' };
    return { bg: 'rgba(14,165,233,0.9)', border: 'rgba(14,165,233,0.95)', shadow: '0 0 10px rgba(14,165,233,0.3)' };
  };

  return (
    <div>
      {/* Slot headers */}
      <div style={{ display: 'grid', gridTemplateColumns: `50px repeat(${slotConfig.length}, 1fr)`, gap: 4, marginBottom: 6 }}>
        <div/>
        {slotConfig.map(s => (
          <div key={s.label} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textAlign: 'center', letterSpacing: '0.02em' }}>
            {s.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {days.map((day, di) => (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: `50px repeat(${slotConfig.length}, 1fr)`, gap: 4, alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>{day}</div>
            {grid[di].map((val, si) => {
              const { bg, border, shadow } = getCellStyle(val, di, si);
              const isPeak = di === peakDay && si === peakSlot && val > 0;
              return (
                <div key={si} title={val > 0 ? `${day} ${slotConfig[si].label}: ${val} check-ins` : undefined} style={{
                  height: 36, borderRadius: 8,
                  background: bg,
                  border: `1px solid ${border}`,
                  boxShadow: shadow,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'opacity 0.15s',
                }}>
                  {val > 0 && (
                    <span style={{
                      fontSize: val >= 100 ? 8 : val >= 10 ? 9 : 10,
                      fontWeight: 800,
                      color: isPeak
                        ? 'rgba(255,255,255,0.95)'
                        : val / maxVal > 0.45
                          ? 'rgba(255,255,255,0.9)'
                          : 'rgba(255,255,255,0.6)',
                      letterSpacing: '-0.02em',
                    }}>{val}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 8,
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <Flame style={{ width: 11, height: 11, color: '#fbbf24' }}/>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24' }}>
            Peak: {days[peakDay]} {slotConfig[peakSlot]?.label}
          </span>
          <span style={{ fontSize: 9, color: 'rgba(245,158,11,0.7)', fontWeight: 600 }}>
            · {grid[peakDay][peakSlot]} visits
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>Low</span>
          {[0.03, 0.12, 0.28, 0.48, 0.68, 0.9].map((op, i) => (
            <div key={i} style={{
              width: 18, height: 10, borderRadius: 3,
              background: op === 0.03 ? 'rgba(255,255,255,0.03)' : `rgba(14,165,233,${op})`,
              border: '1px solid rgba(255,255,255,0.05)',
            }}/>
          ))}
          <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>High</span>
        </div>
      </div>
    </div>
  );
}

// ── Radar tooltip ─────────────────────────────────────────────────────────────

function RadarTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ color: 'var(--text2)', fontSize: 11, fontWeight: 700 }}>{payload[0].payload.subject}</p>
      <p style={{ color: '#a78bfa', fontWeight: 800, fontSize: 13 }}>{Math.round(payload[0].value)}%</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TabAnalytics({
  checkIns, ci30, totalMembers, monthCiPer, monthChangePct,
  monthGrowthData, retentionRate, activeThisMonth, newSignUps, atRisk,
}) {
  const now = new Date();

  const weekTrend = Array.from({ length: 12 }, (_, i) => {
    const s = subDays(now, (11 - i) * 7);
    const e = subDays(now, (10 - i) * 7);
    return {
      label: format(s, 'MMM d'),
      value: checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: s, end: e })).length,
    };
  });

  const hourAcc = {};
  checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); hourAcc[h] = (hourAcc[h] || 0) + 1; });
  const hourMax   = Math.max(...Object.values(hourAcc), 1);
  const peakHours = Object.entries(hourAcc)
    .sort(([, a], [, b]) => b - a).slice(0, 8)
    .map(([hour, count]) => {
      const h = parseInt(hour);
      return { label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`, count, pct: (count / hourMax) * 100 };
    });

  const dayAcc     = {};
  checkIns.forEach(c => { const d = new Date(c.check_in_date).getDay(); dayAcc[d] = (dayAcc[d] || 0) + 1; });
  const dayMax     = Math.max(...Object.values(dayAcc), 1);
  const dayNames   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const busiestDays = dayNames.map((name, idx) => ({ name, count: dayAcc[idx] || 0 })).sort((a, b) => b.count - a.count);

  const dailyAvg   = Math.round(ci30.length / 30);
  const avgPerMem  = totalMembers > 0 ? (ci30.length / totalMembers).toFixed(1) : '—';
  const returnRate = checkIns.length > 0
    ? Math.round((checkIns.filter(c => !c.first_visit).length / checkIns.length) * 100)
    : 0;

  const superActive = monthCiPer.filter(v => v >= 15).length;
  const active      = monthCiPer.filter(v => v >= 8 && v < 15).length;
  const casual      = monthCiPer.filter(v => v >= 1 && v < 8).length;
  const inactive    = Math.max(0, totalMembers - monthCiPer.length);

  const radarData = [
    { subject: 'Retention',    A: retentionRate },
    { subject: 'Daily Avg',    A: Math.min(100, (dailyAvg / Math.max(totalMembers, 1)) * 100) },
    { subject: 'Super Active', A: totalMembers > 0 ? Math.round((superActive / totalMembers) * 100) : 0 },
    { subject: 'Return Rate',  A: returnRate },
    { subject: 'Growth',       A: Math.min(100, Math.max(0, 50 + monthChangePct)) },
    { subject: 'Engagement',   A: totalMembers > 0 ? Math.round(((superActive + active) / totalMembers) * 100) : 0 },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 292px', gap: 18, alignItems: 'start' }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard icon={Activity}   label="Daily Avg"      value={dailyAvg}  unit="check-ins / day"  color="#0ea5e9" trend={monthChangePct}/>
          <KpiCard icon={TrendingUp} label="Monthly Change" value={`${monthChangePct >= 0 ? '+' : ''}${monthChangePct}%`} unit="vs last month" color={monthChangePct >= 0 ? '#10b981' : '#ef4444'} trend={monthChangePct}/>
          <KpiCard icon={Users}      label="Avg / Member"   value={avgPerMem} unit="visits this month" color="#a78bfa" trend={null}/>
          <KpiCard icon={Zap}        label="Return Rate"    value={`${returnRate}%`} unit="of all check-ins" color="#f59e0b" trend={null}/>
        </div>

        {/* Weekly trend */}
        <Card accentColor="#3b82f6" style={{ padding: '20px 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em' }}>Weekly Check-in Trend</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>12-week rolling view</div>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 10, fontWeight: 700, color: '#60a5fa' }}>
              {weekTrend.reduce((s, d) => s + d.value, 0)} total
            </div>
          </div>
          <ResponsiveContainer width="100%" height={195}>
            <AreaChart data={weekTrend} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} interval={2}/>
              <YAxis tick={{ fill: '#475569', fontSize: 9, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} width={24}/>
              <Tooltip content={<ChartTip/>} cursor={{ stroke: 'rgba(59,130,246,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}/>
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#wtGrad)" dot={false} activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Member Growth — in main column */}
        <Card accentColor="#10b981" style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em' }}>Member Growth</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Monthly new sign-up trend</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 10, fontWeight: 700, color: '#34d399' }}>
                +{newSignUps} this month
              </div>
              <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 10, fontWeight: 700, color: '#f87171' }}>
                {retentionRate}% retention
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthGrowthData} barSize={22} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="mgBarMain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Outfit' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#475569', fontSize: 9, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} width={24}/>
              <Tooltip
                content={({ active, payload, label }) => active && payload?.length
                  ? <div className="custom-tooltip"><p style={{ color: 'var(--text2)', marginBottom: 2, fontSize: 10 }}>{label}</p><p style={{ color: '#10b981', fontWeight: 700 }}>{payload[0].value} active</p></div>
                  : null}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="value" fill="url(#mgBarMain)" radius={[5, 5, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Heatmap */}
        <Card accentColor="#06b6d4" style={{ padding: '20px 20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em' }}>Traffic Heatmap</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Check-in density by day and time</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame style={{ width: 14, height: 14, color: '#22d3ee' }}/>
            </div>
          </div>
          <HeatmapChart checkIns={checkIns}/>
        </Card>

        {/* Peak hours */}
        <Card accentColor="#f59e0b" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em' }}>Peak Hours</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Top 8 busiest time slots</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock style={{ width: 14, height: 14, color: '#fbbf24' }}/>
            </div>
          </div>
          {peakHours.length === 0 ? <Empty icon={Clock} label="No check-in data yet"/> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {peakHours.map((h, i) => (
                <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', color: i === 0 ? '#fbbf24' : 'var(--text3)', width: 18, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', width: 36, flexShrink: 0 }}>{h.label}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{
                      height: '100%', width: `${h.pct}%`, borderRadius: 99,
                      background: i === 0 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                      transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
                    }}/>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? '#fbbf24' : 'var(--text2)', width: 22, textAlign: 'right', flexShrink: 0 }}>{h.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* 30-Day Snapshot — no "active members" row, covered by engagement breakdown */}
        <Card accentColor="#0ea5e9" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', marginBottom: 14 }}>30-Day Snapshot</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Total check-ins', value: ci30.length,         color: '#38bdf8' },
              { label: 'New sign-ups',    value: newSignUps,          color: '#c4b5fd' },
              { label: 'At-risk members', value: atRisk,              color: atRisk > 0 ? '#f87171' : '#34d399' },
              { label: 'Retention rate',  value: `${retentionRate}%`, color: retentionRate >= 70 ? '#34d399' : '#fbbf24' },
            ].map((s, i, arr) => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text3)' }}>{s.label}</span>
                <span style={{
                  fontSize: 14, fontWeight: 800, color: s.color,
                  background: `${s.color}12`, border: `1px solid ${s.color}25`,
                  borderRadius: 7, padding: '2px 9px',
                }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Gym Health Radar */}
        <Card accentColor="#a78bfa" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', marginBottom: 2 }}>Gym Health Radar</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>6-metric performance overview</div>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={radarData} margin={{ top: 4, right: 10, bottom: 4, left: 10 }}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" radialLines={false}/>
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'Outfit', fontWeight: 700 }}/>
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false}/>
              <Radar dataKey="A" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} strokeWidth={2}/>
              <Tooltip content={<RadarTip/>}/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Busiest Days */}
        <Card accentColor="#f59e0b" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', marginBottom: 14 }}>Busiest Days</div>
          {busiestDays.every(d => d.count === 0) ? <Empty icon={Calendar} label="No data yet"/> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {busiestDays.map(({ name, count }, rank) => {
                const pct   = (count / dayMax) * 100;
                const isTop = rank === 0;
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: isTop ? '#fbbf24' : 'var(--text3)', width: 18, textAlign: 'right', flexShrink: 0 }}>#{rank + 1}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', width: 30, flexShrink: 0 }}>{name}</span>
                    <div style={{ flex: 1, height: 5, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`, borderRadius: 99,
                        background: isTop ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#0ea5e9,#06b6d4)',
                        transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
                      }}/>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: isTop ? '#fbbf24' : 'var(--text2)', width: 22, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Engagement breakdown — single source for member activity tiers */}
        <Card accentColor="#8b5cf6" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', marginBottom: 14 }}>Engagement Breakdown</div>
          {totalMembers > 0 && (
            <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 14 }}>
              {[
                { val: superActive, color: '#10b981' },
                { val: active,      color: '#0ea5e9' },
                { val: casual,      color: '#a78bfa' },
                { val: inactive,    color: '#f59e0b' },
              ].filter(s => s.val > 0).map((s, i, arr) => (
                <div key={i} style={{
                  flex: s.val, height: '100%', background: s.color, opacity: 0.85,
                  borderRadius: i === 0 ? '99px 0 0 99px' : i === arr.length - 1 ? '0 99px 99px 0' : 0,
                }}/>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Super Active', sub: '15+ visits', val: superActive, color: '#10b981' },
              { label: 'Active',       sub: '8–14',       val: active,      color: '#0ea5e9' },
              { label: 'Casual',       sub: '1–7',        val: casual,      color: '#a78bfa' },
              { label: 'Inactive',     sub: '0 visits',   val: inactive,    color: '#f59e0b' },
            ].map((s, i) => {
              const pct = totalMembers > 0 ? (s.val / totalMembers) * 100 : 0;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }}/>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{s.label}</span>
                      <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500 }}>{s.sub}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.val}</span>
                      <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, minWidth: 26, textAlign: 'right' }}>{Math.round(pct)}%</span>
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: `linear-gradient(90deg, ${s.color}, ${s.color}99)`,
                      borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

      </div>
    </div>
  );
}