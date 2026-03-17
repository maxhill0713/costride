import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { subDays, format, isWithinInterval, differenceInDays } from 'date-fns';
import {
  Activity, TrendingUp, TrendingDown, Users, Zap, ArrowUpRight,
  Calendar, Clock, Flame, CheckCircle, AlertTriangle, Shield,
  Target, Award, Star, Eye, UserPlus, Sparkles, BarChart2,
  RefreshCw, Heart, MessageCircle, Trophy
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, BarChart, Bar, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, LineChart, Line
} from 'recharts';

// ── Shared card shell ──────────────────────────────────────────────────────────
const Card = ({ children, style = {}, accentColor }) => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, position: 'relative', overflow: 'hidden', ...style }}>
    {accentColor && (
      <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)`, pointerEvents: 'none' }}/>
    )}
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: 4 }}>{children}</div>
);

const Empty = ({ icon: Icon, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
    <Icon style={{ width: 26, height: 26, color: '#475569', opacity: 0.5 }}/>
    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{label}</span>
  </div>
);

const tickStyle = { fill: '#64748b', fontSize: 10, fontFamily: 'DM Sans, system-ui' };

// ── Custom tooltips ───────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: '9px 13px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p style={{ color: '#8ba0b8', marginBottom: 3, fontSize: 10, fontWeight: 600 }}>{label}</p>
      <p style={{ color: '#38bdf8', fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value}</p>
    </div>
  );
};

const RadarTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, padding: '9px 13px' }}>
      <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, margin: '0 0 3px' }}>{payload[0].payload.subject}</p>
      <p style={{ color: '#a78bfa', fontWeight: 800, fontSize: 14, margin: 0 }}>{Math.round(payload[0].value)}%</p>
    </div>
  );
};

// ── KPI card ───────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, valueSuffix, unit, color, trend, ring, sparkData, footerBar }) {
  return (
    <div style={{ borderRadius: 16, padding: '18px 20px 16px', background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 0, boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}>
      <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.07, filter: 'blur(28px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: `linear-gradient(90deg, transparent, ${color}55, transparent)`, pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color }}/>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#f0f4f8', lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</span>
            {valueSuffix && <span style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', letterSpacing: '-0.02em' }}>{valueSuffix}</span>}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginTop: 6 }}>{unit}</div>
          {trend !== null && trend !== undefined && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 6, padding: '2px 7px', borderRadius: 99, background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
              {trend >= 0 ? <ArrowUpRight style={{ width: 10, height: 10, color: '#10b981' }}/> : <TrendingDown style={{ width: 10, height: 10, color: '#ef4444' }}/>}
              <span style={{ fontSize: 10, fontWeight: 700, color: trend >= 0 ? '#34d399' : '#f87171' }}>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
      {footerBar != null && (
        <div style={{ height: 3, borderRadius: 99, background: `${color}18`, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(100, footerBar)}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
        </div>
      )}
    </div>
  );
}

// ── Heatmap ────────────────────────────────────────────────────────────────────
function HeatmapChart({ gymId }) {
  const [weeks, setWeeks] = React.useState(4);
  const { data: heatmapCheckIns = [] } = useQuery({
    queryKey: ['heatmapCheckIns', gymId, weeks],
    queryFn: () => {
      if (weeks === 0) return base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 5000);
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - weeks * 7);
      return base44.entities.CheckIn.filter({ gym_id: gymId, check_in_date: { $gte: cutoff.toISOString() } }, '-check_in_date', 5000);
    },
    enabled: !!gymId, staleTime: 5 * 60 * 1000,
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slotConfig = [
    { label: '6–8a',  hours: [6, 7]   }, { label: '8–10a', hours: [8, 9]   },
    { label: '10–12', hours: [10, 11] }, { label: '12–2p', hours: [12, 13] },
    { label: '2–4p',  hours: [14, 15] }, { label: '4–6p',  hours: [16, 17] },
    { label: '6–8p',  hours: [18, 19] }, { label: '8–10p', hours: [20, 21] },
  ];

  const grid = useMemo(() => {
    const mat = Array.from({ length: 7 }, () => Array(slotConfig.length).fill(0));
    heatmapCheckIns.forEach(c => {
      const d = new Date(c.check_in_date); const dow = (d.getDay() + 6) % 7; const h = d.getHours();
      const si = slotConfig.findIndex(s => s.hours.includes(h));
      if (si >= 0) mat[dow][si]++;
    });
    return mat;
  }, [heatmapCheckIns]);

  const maxVal = Math.max(...grid.flat(), 1);
  let peakDay = 0, peakSlot = 0;
  grid.forEach((row, di) => row.forEach((val, si) => { if (val > grid[peakDay][peakSlot]) { peakDay = di; peakSlot = si; } }));

  const getCellStyle = (val, di, si) => {
    const pct = val / maxVal; const isPeak = di === peakDay && si === peakSlot && val > 0;
    if (isPeak) return { bg: 'linear-gradient(135deg,rgba(245,158,11,0.85),rgba(239,68,68,0.65))', border: 'rgba(245,158,11,0.6)', shadow: '0 0 12px rgba(245,158,11,0.25)' };
    if (val === 0) return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.05)', shadow: 'none' };
    if (pct < 0.2) return { bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.2)',  shadow: 'none' };
    if (pct < 0.4) return { bg: 'rgba(14,165,233,0.28)', border: 'rgba(14,165,233,0.32)', shadow: 'none' };
    if (pct < 0.6) return { bg: 'rgba(14,165,233,0.48)', border: 'rgba(14,165,233,0.52)', shadow: '0 0 6px rgba(14,165,233,0.15)' };
    if (pct < 0.8) return { bg: 'rgba(14,165,233,0.68)', border: 'rgba(14,165,233,0.72)', shadow: '0 0 8px rgba(14,165,233,0.2)' };
    return { bg: 'rgba(14,165,233,0.9)', border: 'rgba(14,165,233,0.95)', shadow: '0 0 10px rgba(14,165,233,0.3)' };
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[{ label: '4W', val: 4 }, { label: '12W', val: 12 }, { label: 'All', val: 0 }].map(opt => (
          <button key={opt.val} onClick={() => setWeeks(opt.val)} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, cursor: 'pointer', background: weeks === opt.val ? 'rgba(6,182,212,0.18)' : 'rgba(255,255,255,0.05)', color: weeks === opt.val ? '#22d3ee' : '#64748b', border: `1px solid ${weeks === opt.val ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.15s' }}>{opt.label}</button>
        ))}
        <span style={{ fontSize: 10, color: '#475569', fontWeight: 500, alignSelf: 'center', marginLeft: 4 }}>{heatmapCheckIns.length} check-ins</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `50px repeat(${slotConfig.length}, 1fr)`, gap: 4, marginBottom: 6 }}>
        <div/>
        {slotConfig.map(s => <div key={s.label} style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textAlign: 'center', letterSpacing: '0.02em' }}>{s.label}</div>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {days.map((day, di) => (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: `50px repeat(${slotConfig.length}, 1fr)`, gap: 4, alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{day}</div>
            {grid[di].map((val, si) => {
              const { bg, border, shadow } = getCellStyle(val, di, si);
              const isPeak = di === peakDay && si === peakSlot && val > 0;
              return (
                <div key={si} title={val > 0 ? `${day} ${slotConfig[si].label}: ${val} check-ins` : undefined}
                  style={{ height: 36, borderRadius: 8, background: bg, border: `1px solid ${border}`, boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}>
                  {val > 0 && <span style={{ fontSize: val >= 100 ? 8 : val >= 10 ? 9 : 10, fontWeight: 800, color: isPeak ? 'rgba(255,255,255,0.95)' : val / maxVal > 0.45 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)', letterSpacing: '-0.02em' }}>{val}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Flame style={{ width: 11, height: 11, color: '#fbbf24' }}/>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24' }}>Peak: {days[peakDay]} {slotConfig[peakSlot]?.label}</span>
          <span style={{ fontSize: 9, color: 'rgba(245,158,11,0.7)', fontWeight: 600 }}>· {grid[peakDay][peakSlot]} visits</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>Low</span>
          {[0.03, 0.12, 0.28, 0.48, 0.68, 0.9].map((op, i) => (
            <div key={i} style={{ width: 18, height: 10, borderRadius: 3, background: op === 0.03 ? 'rgba(255,255,255,0.03)' : `rgba(14,165,233,${op})`, border: '1px solid rgba(255,255,255,0.05)' }}/>
          ))}
          <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>High</span>
        </div>
      </div>
    </div>
  );
}

// ── NEW: Retention Funnel ─────────────────────────────────────────────────────
// Shows the lifecycle conversion: joined → week 1 return → month 1 active → month 3 retained
function RetentionFunnelWidget({ allMemberships, checkIns, now }) {
  const funnel = useMemo(() => {
    const total   = allMemberships.length;
    const w1Return = allMemberships.filter(m => {
      const daysAgo = differenceInDays(now, new Date(m.created_at || m.join_date || now));
      if (daysAgo < 7) return false;
      const visits = checkIns.filter(c => c.user_id === m.user_id);
      return visits.length >= 2;
    }).length;
    const month1Active = allMemberships.filter(m => {
      const daysAgo = differenceInDays(now, new Date(m.created_at || m.join_date || now));
      if (daysAgo < 30) return false;
      const visits30 = checkIns.filter(c => {
        const cd = new Date(c.check_in_date); const jd = new Date(m.created_at || m.join_date || now);
        return c.user_id === m.user_id && cd >= jd && differenceInDays(cd, jd) <= 30;
      }).length;
      return visits30 >= 4;
    }).length;
    const month3Retained = allMemberships.filter(m => {
      const daysAgo = differenceInDays(now, new Date(m.created_at || m.join_date || now));
      if (daysAgo < 90) return false;
      const lastCI = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      return lastCI && differenceInDays(now, new Date(lastCI.check_in_date)) <= 21;
    }).length;

    return [
      { label: 'Joined',          val: total,          color: '#38bdf8', icon: UserPlus   },
      { label: 'Week-1 return',   val: w1Return,       color: '#10b981', icon: RefreshCw  },
      { label: 'Month-1 active',  val: month1Active,   color: '#a78bfa', icon: Activity   },
      { label: 'Month-3 retained',val: month3Retained, color: '#f59e0b', icon: CheckCircle},
    ];
  }, [allMemberships, checkIns, now]);

  return (
    <Card accentColor="#38bdf8" style={{ padding: '20px 20px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em' }}>Retention Funnel</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Member lifecycle conversion</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Target style={{ width: 14, height: 14, color: '#38bdf8' }}/>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {funnel.map((stage, i) => {
          const pct = funnel[0].val > 0 ? Math.round((stage.val / funnel[0].val) * 100) : 0;
          const dropPct = i > 0 && funnel[i-1].val > 0 ? Math.round(((funnel[i-1].val - stage.val) / funnel[i-1].val) * 100) : 0;
          return (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: `${stage.color}15`, border: `1px solid ${stage.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <stage.icon style={{ width: 11, height: 11, color: stage.color }}/>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#d4e4f4' }}>{stage.label}</span>
                  {i > 0 && dropPct > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: dropPct > 30 ? '#f87171' : '#f59e0b', background: dropPct > 30 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', padding: '1px 5px', borderRadius: 4 }}>
                      -{dropPct}% drop
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: stage.color, letterSpacing: '-0.03em' }}>{stage.val}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', minWidth: 28, textAlign: 'right' }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: `linear-gradient(90deg, ${stage.color}, ${stage.color}80)`, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── NEW: Drop-off Pattern Deep Dive ───────────────────────────────────────────
function DropOffAnalysis({ allMemberships, checkIns, now }) {
  const data = useMemo(() => {
    const buckets = [
      { label: 'Week 1',   min: 0,  max: 14,  daysInactive: 7,  color: '#ef4444' },
      { label: 'Month 1',  min: 14, max: 30,  daysInactive: 7,  color: '#f59e0b' },
      { label: 'Month 2',  min: 30, max: 60,  daysInactive: 14, color: '#fb923c' },
      { label: 'Month 3',  min: 60, max: 90,  daysInactive: 14, color: '#fbbf24' },
      { label: '3+ months',min: 90, max: 9999,daysInactive: 21, color: '#64748b' },
    ];
    return buckets.map(b => {
      const count = allMemberships.filter(m => {
        const joinAge = differenceInDays(now, new Date(m.created_at || m.join_date || now));
        if (joinAge < b.min || joinAge >= b.max) return false;
        const lastCI = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
        const daysSince = lastCI ? differenceInDays(now, new Date(lastCI.check_in_date)) : 999;
        return daysSince >= b.daysInactive;
      }).length;
      return { ...b, count };
    });
  }, [allMemberships, checkIns, now]);

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card accentColor="#ef4444" style={{ padding: '20px 20px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em' }}>Drop-off Analysis</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Where members go quiet by lifecycle stage</div>
        </div>
        <div style={{ padding: '4px 10px', borderRadius: 8, background: total > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${total > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: total > 0 ? '#f87171' : '#34d399' }}>{total} at risk</span>
        </div>
      </div>

      {total === 0 ? (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>✓ No significant drop-off patterns detected</div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="label" tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false}/>
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={22} allowDecimals={false}/>
              <Tooltip content={({ active, payload, label }) => active && payload?.length
                ? <div style={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '8px 12px' }}>
                    <p style={{ color: '#8ba0b8', fontSize: 10, fontWeight: 600, margin: '0 0 3px' }}>{label}</p>
                    <p style={{ color: '#f87171', fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value} members</p>
                  </div>
                : null}
                cursor={{ fill: 'rgba(239,68,68,0.06)' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.8}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 9, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700, marginBottom: 2 }}>
              ⚡ Highest risk: {data.sort((a, b) => b.count - a.count)[0]?.label} stage
            </div>
            <div style={{ fontSize: 10, color: '#64748b' }}>
              {data.sort((a, b) => b.count - a.count)[0]?.count || 0} members dropping off at this lifecycle point
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

// ── NEW: Churn Signal Tracker ─────────────────────────────────────────────────
function ChurnSignalWidget({ allMemberships, checkIns, now }) {
  const signals = useMemo(() => {
    return allMemberships.map(m => {
      const mci = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
      const daysSince = mci.length > 0 ? differenceInDays(now, new Date(mci[0].check_in_date)) : 999;

      // Frequency drop: used to visit frequently, now slowing
      const last30 = mci.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 30).length;
      const prev30 = mci.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return d > 30 && d <= 60; }).length;
      const freqDrop = prev30 >= 4 && last30 < prev30 * 0.5;

      let score = 0;
      if (daysSince >= 7)  score += 20;
      if (daysSince >= 14) score += 30;
      if (daysSince >= 21) score += 30;
      if (freqDrop)        score += 20;

      return { ...m, name: m.user_name || m.name || 'Member', daysSince, freqDrop, score, last30, prev30 };
    })
    .filter(m => m.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  }, [allMemberships, checkIns, now]);

  return (
    <Card accentColor="#ef4444" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>Churn Signals</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Members showing early warning signs</div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '2px 8px' }}>{signals.length}</div>
      </div>
      {signals.length === 0 ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>✓ No churn signals detected</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {signals.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 9, background: m.score >= 80 ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.07)', border: `1px solid ${m.score >= 80 ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)'}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#d4e4f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
                  {m.daysSince < 999 ? `${m.daysSince}d absent` : 'Never visited'}
                  {m.freqDrop && <span style={{ color: '#f59e0b', marginLeft: 6 }}>· frequency dropping</span>}
                </div>
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: m.score >= 80 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${m.score >= 80 ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: m.score >= 80 ? '#f87171' : '#fbbf24', letterSpacing: '-0.02em' }}>{m.score}</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>risk</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── NEW: Week-1 Return Rate Trend ─────────────────────────────────────────────
function Week1ReturnTrendWidget({ allMemberships, checkIns, now }) {
  const data = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = subDays(now, (7 - i) * 14);
      const weekEnd   = subDays(now, (6 - i) * 14);
      const cohort = allMemberships.filter(m => {
        const jd = new Date(m.created_at || m.join_date || now);
        return jd >= weekStart && jd < weekEnd;
      });
      if (cohort.length === 0) return { label: format(weekStart, 'MMM d'), pct: 0, total: 0 };
      const returned = cohort.filter(m =>
        checkIns.filter(c => c.user_id === m.user_id).length >= 2
      ).length;
      return { label: format(weekStart, 'MMM d'), pct: Math.round((returned / cohort.length) * 100), total: cohort.length };
    });
  }, [allMemberships, checkIns, now]);

  const latest = data[data.length - 1]?.pct || 0;
  const prev   = data[data.length - 2]?.pct || 0;
  const trend  = latest - prev;

  return (
    <Card accentColor="#10b981" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>Week-1 Return Rate</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>New member cohort trend</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: latest >= 60 ? '#10b981' : latest >= 40 ? '#f59e0b' : '#ef4444', letterSpacing: '-0.04em' }}>{latest}%</span>
          {trend !== 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {trend > 0 ? <TrendingUp style={{ width: 11, height: 11, color: '#10b981' }}/> : <TrendingDown style={{ width: 11, height: 11, color: '#ef4444' }}/>}
              <span style={{ fontSize: 10, fontWeight: 700, color: trend > 0 ? '#34d399' : '#f87171' }}>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="w1Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip content={({ active, payload, label }) => active && payload?.length
            ? <div style={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '6px 10px' }}>
                <p style={{ color: '#8ba0b8', fontSize: 9, margin: '0 0 2px' }}>{label}</p>
                <p style={{ color: '#10b981', fontWeight: 800, fontSize: 13, margin: 0 }}>{payload[0].value}% return rate</p>
              </div>
            : null}
            cursor={false}
          />
          <Area type="monotone" dataKey="pct" stroke="#10b981" strokeWidth={2} fill="url(#w1Grad)" dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 7, background: latest < 40 ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.06)', border: `1px solid ${latest < 40 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)'}` }}>
        <div style={{ fontSize: 10, color: latest < 40 ? '#f87171' : latest < 60 ? '#f59e0b' : '#34d399', fontWeight: 600 }}>
          {latest < 40 ? '⚠️ Below target — follow up with new members in week 1' : latest < 60 ? 'Room to improve — a personal welcome message helps' : '✓ Strong week-1 return rate'}
        </div>
      </div>
    </Card>
  );
}

// ── NEW: Smart Analytics Insights Panel ───────────────────────────────────────
function SmartInsightsPanel({ checkIns, ci30, allMemberships, atRisk, retentionRate, monthChangePct, totalMembers, now }) {
  const insights = useMemo(() => {
    const items = [];

    // Retention direction
    if (retentionRate < 60) {
      items.push({ color: '#ef4444', icon: AlertTriangle, label: `Retention at ${retentionRate}% — below healthy threshold of 70%`, detail: 'Focus on week-1 follow-ups and streak recovery', priority: 1 });
    } else if (retentionRate >= 80) {
      items.push({ color: '#10b981', icon: CheckCircle, label: `Retention is strong at ${retentionRate}%`, detail: 'Keep maintaining your current engagement rhythm', priority: 5 });
    }

    // At-risk concentration
    const atRiskPct = totalMembers > 0 ? Math.round((atRisk / totalMembers) * 100) : 0;
    if (atRiskPct >= 20) {
      items.push({ color: '#ef4444', icon: Zap, label: `${atRiskPct}% of members are at risk — act now`, detail: 'Send a re-engagement push to everyone 14+ days inactive', priority: 1 });
    }

    // Growth trend
    if (monthChangePct < -10) {
      items.push({ color: '#f59e0b', icon: TrendingDown, label: `Check-ins down ${Math.abs(monthChangePct)}% vs last month`, detail: 'Consider a new challenge or event to re-activate attendance', priority: 2 });
    } else if (monthChangePct > 15) {
      items.push({ color: '#10b981', icon: TrendingUp, label: `Strong growth — check-ins up ${monthChangePct}% this month`, detail: 'Great momentum, make sure your schedule can handle demand', priority: 4 });
    }

    // Daily average vs member count
    const dailyAvg = ci30.length / 30;
    const visitRatio = totalMembers > 0 ? dailyAvg / totalMembers : 0;
    if (visitRatio < 0.05 && totalMembers > 10) {
      items.push({ color: '#f59e0b', icon: Activity, label: 'Visit frequency is low — less than 5% of members per day', detail: 'Try promoting morning classes or adding peak-time incentives', priority: 2 });
    }

    // Weekend vs weekday
    const weekendCI = checkIns.filter(c => [0, 6].includes(new Date(c.check_in_date).getDay())).length;
    const weekdayCI = checkIns.length - weekendCI;
    if (weekendCI / Math.max(checkIns.length, 1) < 0.15 && checkIns.length > 50) {
      items.push({ color: '#38bdf8', icon: Calendar, label: 'Weekend attendance is low (<15% of visits)', detail: 'A weekend challenge or Saturday event could drive more footfall', priority: 3 });
    }

    return items.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [checkIns, ci30, allMemberships, atRisk, retentionRate, monthChangePct, totalMembers, now]);

  return (
    <Card accentColor="#0ea5e9" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Sparkles style={{ width: 14, height: 14, color: '#38bdf8' }}/>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>Smart Insights</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {insights.length === 0 ? (
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>✓ Your gym looks healthy — no critical signals</div>
          </div>
        ) : insights.map((s, i) => (
          <div key={i} style={{ padding: '9px 12px', borderRadius: 9, background: `${s.color}07`, border: `1px solid ${s.color}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <s.icon style={{ width: 11, height: 11, color: s.color, flexShrink: 0 }}/>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#d4e4f4' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', paddingLeft: 18 }}>{s.detail}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── NEW: Class Performance Table ──────────────────────────────────────────────
function ClassPerformanceWidget({ classes, checkIns, ci30, now }) {
  const classData = useMemo(() => {
    return (classes || []).map(cls => {
      const clsCI = ci30.filter(c => c.class_id === cls.id || c.class_name === cls.name);
      const cap   = cls.max_capacity || cls.capacity || 20;
      // Scheduled sessions in last 30 days (approximate from check-ins or fixed)
      const sessions = Math.max(4, Math.ceil(clsCI.length / Math.max(cap * 0.5, 1)));
      const avgAttendance = sessions > 0 ? Math.round(clsCI.length / sessions) : 0;
      const fillRate = Math.min(100, Math.round((avgAttendance / cap) * 100));

      // Trend: compare first half vs second half of 30 days
      const first15 = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return (c.class_id === cls.id || c.class_name === cls.name) && d > 15; }).length;
      const last15  = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return (c.class_id === cls.id || c.class_name === cls.name) && d <= 15; }).length;
      const trending = first15 === 0 ? 0 : Math.round(((last15 - first15) / first15) * 100);

      return { ...cls, clsCI: clsCI.length, avgAttendance, fillRate, trending, cap };
    }).sort((a, b) => b.fillRate - a.fillRate);
  }, [classes, ci30, now]);

  if (classData.length === 0) return null;

  return (
    <Card accentColor="#a78bfa" style={{ padding: '20px 20px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em' }}>Class Performance</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Fill rates & attendance trends (30 days)</div>
        </div>
        <Trophy style={{ width: 16, height: 16, color: '#a78bfa' }}/>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {classData.map((cls, i) => (
          <div key={cls.id || i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: cls.fillRate >= 75 ? '#10b981' : cls.fillRate >= 40 ? '#f59e0b' : '#ef4444', flexShrink: 0 }}/>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>{cls.name}</span>
                {cls.trending !== 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {cls.trending > 0
                      ? <TrendingUp style={{ width: 10, height: 10, color: '#10b981' }}/>
                      : <TrendingDown style={{ width: 10, height: 10, color: '#ef4444' }}/>
                    }
                    <span style={{ fontSize: 9, fontWeight: 700, color: cls.trending > 0 ? '#34d399' : '#f87171' }}>
                      {cls.trending > 0 ? '+' : ''}{cls.trending}%
                    </span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', align: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: cls.fillRate >= 75 ? '#34d399' : cls.fillRate >= 40 ? '#fbbf24' : '#f87171' }}>
                  {cls.fillRate}%
                </span>
                <span style={{ fontSize: 10, color: '#64748b', paddingTop: 2 }}>fill</span>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${cls.fillRate}%`, borderRadius: 99, background: cls.fillRate >= 75 ? 'linear-gradient(90deg,#10b981,#34d399)' : cls.fillRate >= 40 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)', transition: 'width 0.8s ease' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>~{cls.avgAttendance} avg / session</span>
              <span style={{ fontSize: 9, color: '#64748b' }}>cap {cls.cap}</span>
            </div>
            {cls.fillRate < 30 && (
              <div style={{ marginTop: 4, fontSize: 9, fontWeight: 700, color: '#f87171' }}>⚠ Low attendance — consider rescheduling or promoting</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── NEW: Coach Impact Scorecard ───────────────────────────────────────────────
function CoachImpactWidget({ coaches, checkIns, ci30, allMemberships, now }) {
  const data = useMemo(() => {
    return (coaches || []).map(coach => {
      const coachCI = ci30.filter(c => c.coach_id === coach.id || c.coach_name === coach.name);
      const cap = 20;
      const fillRate = Math.min(100, Math.round((coachCI.length / Math.max(cap * 4, 1)) * 100));

      // Unique members coached
      const uniqueMembers = new Set(coachCI.map(c => c.user_id)).size;

      // Retention signal: members who attended this coach's classes — are they still active?
      const coachedMemberIds = new Set(coachCI.map(c => c.user_id));
      const retained = [...coachedMemberIds].filter(id => {
        const lastCI = checkIns.filter(c => c.user_id === id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
        return lastCI && differenceInDays(now, new Date(lastCI.check_in_date)) <= 14;
      }).length;
      const retentionImpact = coachedMemberIds.size > 0 ? Math.round((retained / coachedMemberIds.size) * 100) : 0;

      return { ...coach, coachCI: coachCI.length, uniqueMembers, retentionImpact, fillRate };
    }).sort((a, b) => b.retentionImpact - a.retentionImpact);
  }, [coaches, checkIns, ci30, allMemberships, now]);

  if (data.length === 0) return null;

  return (
    <Card accentColor="#34d399" style={{ padding: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 4 }}>Coach Impact</div>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 14 }}>Retention rate of members coached (30 days)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.slice(0, 5).map((coach, i) => (
          <div key={coach.id || i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: i === 0 ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: i === 0 ? '#34d399' : '#64748b' }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#d4e4f4' }}>{coach.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#64748b' }}>{coach.uniqueMembers} members</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: coach.retentionImpact >= 70 ? '#34d399' : coach.retentionImpact >= 50 ? '#f59e0b' : '#f87171', letterSpacing: '-0.02em' }}>{coach.retentionImpact}%</span>
              </div>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${coach.retentionImpact}%`, borderRadius: 99, background: coach.retentionImpact >= 70 ? 'linear-gradient(90deg,#10b981,#34d399)' : coach.retentionImpact >= 50 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)', transition: 'width 0.8s ease' }}/>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── NEW: Substitute Class Impact ──────────────────────────────────────────────
function SubstituteImpactWidget({ classes, checkIns, ci30, now }) {
  const flagged = useMemo(() => {
    return (classes || [])
      .filter(cls => cls.substitute_coach || cls.sub_coach)
      .map(cls => {
        const normalCI = ci30.filter(c => (c.class_id === cls.id) && !c.was_substitute).length;
        const subCI    = ci30.filter(c => (c.class_id === cls.id) && c.was_substitute).length;
        const drop     = normalCI > 0 ? Math.round(((normalCI - subCI) / normalCI) * 100) : 0;
        return { ...cls, normalCI, subCI, drop };
      })
      .filter(c => c.drop > 15)
      .slice(0, 3);
  }, [classes, ci30]);

  if (flagged.length === 0) return null;

  return (
    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.2)', marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Shield style={{ width: 11, height: 11, color: '#fb923c' }}/>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#fb923c' }}>Substitute Impact Alert</span>
      </div>
      {flagged.map((c, i) => (
        <div key={i} style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: '#d4e4f4' }}>{c.name}</span>: attendance drops ~{c.drop}% with substitute coach
        </div>
      ))}
      <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>These classes have high coach dependency</div>
    </div>
  );
}

// ── NEW: Milestone Progress Widget ────────────────────────────────────────────
function MilestoneProgressWidget({ checkIns, ci30, avatarMap }) {
  const milestones = useMemo(() => {
    const acc = {}, userIdByName = {};
    checkIns.forEach(c => {
      if (!acc[c.user_name]) acc[c.user_name] = 0;
      acc[c.user_name]++;
      if (c.user_id) userIdByName[c.user_name] = c.user_id;
    });
    return Object.entries(acc)
      .map(([name, total]) => {
        const next   = [10, 25, 50, 100, 200, 500].find(n => n > total) || null;
        const toNext = next ? next - total : 0;
        return { name, total, next, toNext, user_id: userIdByName[name] };
      })
      .filter(m => m.next && m.toNext <= 5)
      .sort((a, b) => a.toNext - b.toNext)
      .slice(0, 5);
  }, [checkIns]);

  if (milestones.length === 0) return null;

  return (
    <Card accentColor="#f59e0b" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Award style={{ width: 14, height: 14, color: '#f59e0b' }}/>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>Upcoming Milestones</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {milestones.map((m, i) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < milestones.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: m.toNext === 1 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${m.toNext === 1 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: m.toNext === 1 ? '#fbbf24' : '#64748b' }}>{m.total}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#d4e4f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
              <div style={{ fontSize: 10, color: m.toNext === 1 ? '#34d399' : '#64748b', marginTop: 1 }}>
                {m.toNext === 1 ? '🎉 1 visit to milestone!' : `${m.toNext} visits to ${m.next}`}
              </div>
            </div>
            <div style={{ height: 28, width: 28, borderRadius: 99, background: 'conic-gradient(#f59e0b ' + Math.round((m.total / m.next) * 360) + 'deg, rgba(255,255,255,0.07) 0deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: 99, background: 'var(--card)' }}/>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TabAnalytics({
  checkIns, ci30, totalMembers, monthCiPer, monthChangePct,
  monthGrowthData, retentionRate, activeThisMonth, newSignUps, atRisk, gymId,
  allMemberships = [], classes = [], coaches = [], avatarMap = {},
  isCoach = false, myClasses = [],
}) {
  const now = new Date();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const weekTrend = Array.from({ length: 12 }, (_, i) => {
    const s = subDays(now, (11 - i) * 7); const e = subDays(now, (10 - i) * 7);
    return { label: format(s, 'MMM d'), value: checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: s, end: e })).length };
  });

  const hourAcc = {};
  checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); hourAcc[h] = (hourAcc[h] || 0) + 1; });
  const hourMax   = Math.max(...Object.values(hourAcc), 1);
  const peakHours = Object.entries(hourAcc).sort(([, a], [, b]) => b - a).slice(0, 8).map(([hour, count]) => {
    const h = parseInt(hour);
    return { label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`, count, pct: (count / hourMax) * 100 };
  });

  const dayAcc   = {};
  checkIns.forEach(c => { const d = new Date(c.check_in_date).getDay(); dayAcc[d] = (dayAcc[d] || 0) + 1; });
  const dayMax   = Math.max(...Object.values(dayAcc), 1);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const busiestDays = dayNames.map((name, idx) => ({ name, count: dayAcc[idx] || 0 })).sort((a, b) => b.count - a.count);

  const dailyAvg   = Math.round(ci30.length / 30);
  const avgPerMem  = totalMembers > 0 ? (ci30.length / totalMembers).toFixed(1) : '—';
  const returnRate = checkIns.length > 0 ? Math.round((checkIns.filter(c => !c.first_visit).length / checkIns.length) * 100) : 0;

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

  const trendColor = monthChangePct > 0 ? '#10b981' : monthChangePct < 0 ? '#ef4444' : '#64748b';

  // ── Coach analytics ──────────────────────────────────────────────────────────
  const classAttendance = useMemo(() => {
    if (!isCoach || !myClasses.length) return [];
    return myClasses.map(cls => {
      const classCheckIns = ci30.filter(c => {
        if (!cls.schedule) return false;
        const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
        if (!match) return false;
        let h = parseInt(match[1]); if (match[2].toLowerCase() === 'pm' && h !== 12) h += 12;
        const ch = new Date(c.check_in_date).getHours(); return ch === h || ch === h + 1;
      }).length;
      return { name: cls.name, schedule: cls.schedule, capacity: cls.max_capacity || 20, attended: classCheckIns, fill: Math.min(100, Math.round((classCheckIns / (cls.max_capacity || 20)) * 100)) };
    });
  }, [isCoach, myClasses, ci30]);

  const classWeeklyTrend = useMemo(() => {
    if (!isCoach) return [];
    return Array.from({ length: 8 }, (_, i) => {
      const s = subDays(now, (7 - i) * 7); const e = subDays(now, (6 - i) * 7);
      return { label: format(s, 'MMM d'), value: checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: s, end: e })).length };
    });
  }, [isCoach, checkIns, now]);

  const memberFrequency = useMemo(() => {
    if (!isCoach) return { frequent: 0, occasional: 0, rare: 0, inactive: 0 };
    const freq = {};
    ci30.forEach(c => { freq[c.user_id] = (freq[c.user_id] || 0) + 1; });
    const vals = Object.values(freq);
    return { frequent: vals.filter(v => v >= 12).length, occasional: vals.filter(v => v >= 4 && v < 12).length, rare: vals.filter(v => v >= 1 && v < 4).length, inactive: Math.max(0, totalMembers - vals.length) };
  }, [isCoach, ci30, totalMembers]);

  // ── Coach view ───────────────────────────────────────────────────────────────
  if (isCoach) return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 18, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard icon={Activity}   label="Monthly Check-ins"  value={ci30.length}       unit="this month"       color="#0ea5e9" trend={monthChangePct} footerBar={totalMembers > 0 ? (ci30.length / (totalMembers * 4)) * 100 : 0}/>
          <KpiCard icon={Users}      label="Active Members"     value={activeThisMonth}   unit={`of ${totalMembers} total`} color="#10b981" trend={null} footerBar={totalMembers > 0 ? (activeThisMonth / totalMembers) * 100 : 0}/>
          <KpiCard icon={TrendingUp} label="Avg Visits/Member"  value={avgPerMem}          unit="this month"       color="#a78bfa" trend={null}/>
          <KpiCard icon={Zap}        label="At Risk"            value={atRisk}             unit="14+ days absent"  color={atRisk > 0 ? '#ef4444' : '#10b981'} trend={null}/>
        </div>
        {classAttendance.length > 0 && (
          <Card accentColor="#a78bfa" style={{ padding: '20px 20px 16px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em', marginBottom: 4 }}>My Class Attendance (30 days)</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>Estimated from check-in time slots</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {classAttendance.map((cls, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div><span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>{cls.name}</span>{cls.schedule && <span style={{ fontSize: 10, color: '#64748b', marginLeft: 8 }}>{cls.schedule}</span>}</div>
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
          </Card>
        )}
        <Card accentColor="#3b82f6" style={{ padding: '20px 20px 14px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em', marginBottom: 4 }}>Class Attendance Trend</div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>8-week rolling view</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={classWeeklyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs><linearGradient id="coachTrendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4}/><stop offset="100%" stopColor="#a78bfa" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
              <XAxis dataKey="label" tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} interval={1}/>
              <YAxis tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} width={28} allowDecimals={false}/>
              <Tooltip content={<ChartTip/>} cursor={{ stroke: 'rgba(167,139,250,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}/>
              <Area type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2.5} fill="url(#coachTrendGrad)" dot={false} activeDot={{ r: 5, fill: '#a78bfa', stroke: '#fff', strokeWidth: 2 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card accentColor="#06b6d4" style={{ padding: '20px 20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div><div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em' }}>Member Traffic Heatmap</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Check-in density by day and time</div></div>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Flame style={{ width: 14, height: 14, color: '#22d3ee' }}/></div>
          </div>
          <HeatmapChart gymId={gymId}/>
        </Card>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card accentColor="#0ea5e9" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 14 }}>30-Day Snapshot</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Total check-ins',   value: ci30.length,                                        color: '#38bdf8' },
              { label: 'Active members',    value: activeThisMonth,                                    color: '#34d399' },
              { label: 'At-risk members',   value: atRisk,                                             color: atRisk > 0 ? '#f87171' : '#34d399' },
              { label: 'My classes',        value: myClasses.length,                                   color: '#a78bfa' },
              { label: 'Avg visits/member', value: totalMembers > 0 ? (ci30.length / totalMembers).toFixed(1) : '—', color: '#fbbf24' },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}25`, borderRadius: 7, padding: '2px 9px' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card accentColor="#8b5cf6" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 14 }}>Member Frequency</div>
          <div style={{ height: 7, borderRadius: 99, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 14 }}>
            {[{ val: memberFrequency.frequent, color: '#10b981' }, { val: memberFrequency.occasional, color: '#0ea5e9' }, { val: memberFrequency.rare, color: '#a78bfa' }, { val: memberFrequency.inactive, color: '#f59e0b' }].filter(s => s.val > 0).map((s, i, arr) => (
              <div key={i} style={{ flex: s.val, height: '100%', background: s.color, opacity: 0.85, borderRadius: i === 0 ? '99px 0 0 99px' : i === arr.length - 1 ? '0 99px 99px 0' : 0 }}/>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Frequent',   sub: '12+/mo', val: memberFrequency.frequent,   color: '#10b981' },
              { label: 'Occasional', sub: '4–11',   val: memberFrequency.occasional, color: '#0ea5e9' },
              { label: 'Rare',       sub: '1–3',    val: memberFrequency.rare,       color: '#a78bfa' },
              { label: 'Inactive',   sub: '0',      val: memberFrequency.inactive,   color: '#f59e0b' },
            ].map((s, i) => {
              const pct = totalMembers > 0 ? Math.round((s.val / totalMembers) * 100) : 0;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }}/><span style={{ fontSize: 11, fontWeight: 700, color: '#d4e4f4' }}>{s.label}</span><span style={{ fontSize: 9, color: '#64748b' }}>{s.sub}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.val}</span><span style={{ fontSize: 9, color: '#64748b', minWidth: 26, textAlign: 'right' }}>{pct}%</span></div>
                  </div>
                  <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${s.color},${s.color}99)`, borderRadius: 99, transition: 'width 0.8s ease' }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card accentColor="#f59e0b" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 14 }}>Busiest Days</div>
          {busiestDays.every(d => d.count === 0) ? <Empty icon={Calendar} label="No data yet"/> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {busiestDays.map(({ name, count }, rank) => {
                const pct = (count / dayMax) * 100; const isTop = rank === 0;
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: isTop ? '#fbbf24' : '#64748b', width: 18, textAlign: 'right', flexShrink: 0 }}>#{rank + 1}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', width: 30, flexShrink: 0 }}>{name}</span>
                    <div style={{ flex: 1, height: 5, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: isTop ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#0ea5e9,#06b6d4)', transition: 'width 0.7s ease' }}/>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: isTop ? '#fbbf24' : '#94a3b8', width: 22, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card accentColor="#f59e0b" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 14 }}>Peak Hours</div>
          {peakHours.length === 0 ? <Empty icon={Clock} label="No check-in data yet"/> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {peakHours.slice(0, 5).map((h, i) => (
                <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', width: 36, flexShrink: 0 }}>{h.label}</span>
                  <div style={{ flex: 1, height: 5, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: '100%', width: `${h.pct}%`, borderRadius: 99, background: i === 0 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.7s ease' }}/>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? '#fbbf24' : '#94a3b8', width: 22, textAlign: 'right', flexShrink: 0 }}>{h.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  // ── Gym owner view ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 292px', gap: 18, alignItems: 'start' }}>

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard icon={Activity}   label="Daily Avg"        value={dailyAvg}    unit="check-ins / day"  color="#0ea5e9" trend={monthChangePct} footerBar={totalMembers > 0 ? (dailyAvg / totalMembers) * 100 : 0}/>
          <KpiCard icon={TrendingUp} label="Monthly Change"   value={`${monthChangePct >= 0 ? '+' : ''}${monthChangePct}%`} unit="vs last month" color={trendColor} trend={monthChangePct}/>
          <KpiCard icon={Users}      label="Avg / Member"     value={avgPerMem}   unit="visits this month" color="#a78bfa" trend={null} footerBar={totalMembers > 0 ? Math.min(100, (parseFloat(avgPerMem) / 20) * 100) : 0}/>
          <KpiCard icon={Zap}        label="Return Rate"      value={`${returnRate}%`} unit="of all check-ins" color="#f59e0b" trend={null} footerBar={returnRate}/>
        </div>

        {/* Smart Insights */}
        <SmartInsightsPanel checkIns={checkIns} ci30={ci30} allMemberships={allMemberships} atRisk={atRisk} retentionRate={retentionRate} monthChangePct={monthChangePct} totalMembers={totalMembers} now={now}/>

        {/* Retention Funnel */}
        <RetentionFunnelWidget allMemberships={allMemberships} checkIns={checkIns} now={now}/>

        {/* Drop-off Analysis */}
        <DropOffAnalysis allMemberships={allMemberships} checkIns={checkIns} now={now}/>

        {/* Weekly Trend */}
        <Card accentColor="#3b82f6" style={{ padding: '20px 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div><div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em' }}>Weekly Check-in Trend</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>12-week rolling view</div></div>
            <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 10, fontWeight: 700, color: '#60a5fa' }}>
              {weekTrend.reduce((s, d) => s + d.value, 0)} total
            </div>
          </div>
          <ResponsiveContainer width="100%" height={205}>
            <AreaChart data={weekTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs><linearGradient id="wtGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
              <XAxis dataKey="label" tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} interval={2}/>
              <YAxis tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} width={28} allowDecimals={false}/>
              <Tooltip content={<ChartTip/>} cursor={{ stroke: 'rgba(59,130,246,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}/>
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#wtGrad)" dot={false} activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Class Performance */}
        <ClassPerformanceWidget classes={classes} checkIns={checkIns} ci30={ci30} now={now}/>

        {/* Member Growth */}
        <Card accentColor="#10b981" style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div><div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em' }}>Member Growth</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Monthly new sign-up trend</div></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 10, fontWeight: 700, color: '#34d399' }}>+{newSignUps} this month</div>
              <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 10, fontWeight: 700, color: '#f87171' }}>{retentionRate}% retention</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthGrowthData} barSize={22} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs><linearGradient id="mgBarMain" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/><stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="label" tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false}/>
              <YAxis tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} width={28} allowDecimals={false}/>
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? <div style={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '9px 13px' }}><p style={{ color: '#8ba0b8', marginBottom: 3, fontSize: 10, fontWeight: 600 }}>{label}</p><p style={{ color: '#10b981', fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value} active</p></div> : null} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
              <Bar dataKey="value" fill="url(#mgBarMain)" radius={[5, 5, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Traffic Heatmap */}
        <Card accentColor="#06b6d4" style={{ padding: '20px 20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div><div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em' }}>Traffic Heatmap</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Check-in density by day and time</div></div>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Flame style={{ width: 14, height: 14, color: '#22d3ee' }}/></div>
          </div>
          <HeatmapChart gymId={gymId}/>
        </Card>

        {/* Peak Hours */}
        <Card accentColor="#f59e0b" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div><div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em' }}>Peak Hours</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Top 8 busiest time slots</div></div>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock style={{ width: 14, height: 14, color: '#fbbf24' }}/></div>
          </div>
          {peakHours.length === 0 ? <Empty icon={Clock} label="No check-in data yet"/> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {peakHours.map((h, i) => (
                <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', color: i === 0 ? '#fbbf24' : '#64748b', width: 18, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', width: 36, flexShrink: 0 }}>{h.label}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: '100%', width: `${h.pct}%`, borderRadius: 99, background: i === 0 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)' }}/>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? '#fbbf24' : '#94a3b8', width: 22, textAlign: 'right', flexShrink: 0 }}>{h.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* 30-Day Snapshot */}
        <Card accentColor="#0ea5e9" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 14 }}>30-Day Snapshot</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Total check-ins', value: ci30.length,         color: '#38bdf8' },
              { label: 'New sign-ups',    value: newSignUps,          color: '#c4b5fd' },
              { label: 'At-risk members', value: atRisk,              color: atRisk > 0 ? '#f87171' : '#34d399' },
              { label: 'Retention rate',  value: `${retentionRate}%`, color: retentionRate >= 70 ? '#34d399' : '#fbbf24' },
              { label: 'Active classes',  value: (classes || []).length, color: '#a78bfa' },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}25`, borderRadius: 7, padding: '2px 9px' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Week-1 Return Rate Trend */}
        <Week1ReturnTrendWidget allMemberships={allMemberships} checkIns={checkIns} now={now}/>

        {/* Churn Signals */}
        <ChurnSignalWidget allMemberships={allMemberships} checkIns={checkIns} now={now}/>

        {/* Gym Health Radar */}
        <Card accentColor="#a78bfa" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 2 }}>Gym Health Radar</div>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>6-metric performance overview</div>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={radarData} margin={{ top: 4, right: 10, bottom: 4, left: 10 }}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" radialLines={false}/>
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'DM Sans, system-ui', fontWeight: 700 }}/>
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false}/>
              <Radar dataKey="A" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} strokeWidth={2}/>
              <Tooltip content={<RadarTip/>}/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Coach Impact */}
        <CoachImpactWidget coaches={coaches} checkIns={checkIns} ci30={ci30} allMemberships={allMemberships} now={now}/>

        {/* Busiest Days */}
        <Card accentColor="#f59e0b" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 14 }}>Busiest Days</div>
          {busiestDays.every(d => d.count === 0) ? <Empty icon={Calendar} label="No data yet"/> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {busiestDays.map(({ name, count }, rank) => {
                const pct = (count / dayMax) * 100; const isTop = rank === 0;
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: isTop ? '#fbbf24' : '#64748b', width: 18, textAlign: 'right', flexShrink: 0 }}>#{rank + 1}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', width: 30, flexShrink: 0 }}>{name}</span>
                    <div style={{ flex: 1, height: 5, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: isTop ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#0ea5e9,#06b6d4)', transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)' }}/>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: isTop ? '#fbbf24' : '#94a3b8', width: 22, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Engagement Breakdown */}
        <Card accentColor="#8b5cf6" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 14 }}>Engagement Breakdown</div>
          {totalMembers > 0 && (
            <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 14 }}>
              {[{ val: superActive, color: '#10b981' }, { val: active, color: '#0ea5e9' }, { val: casual, color: '#a78bfa' }, { val: inactive, color: '#f59e0b' }].filter(s => s.val > 0).map((s, i, arr) => (
                <div key={i} style={{ flex: s.val, height: '100%', background: s.color, opacity: 0.85, borderRadius: i === 0 ? '99px 0 0 99px' : i === arr.length - 1 ? '0 99px 99px 0' : 0 }}/>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }}/><span style={{ fontSize: 11, fontWeight: 700, color: '#d4e4f4' }}>{s.label}</span><span style={{ fontSize: 9, color: '#64748b', fontWeight: 500 }}>{s.sub}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.val}</span><span style={{ fontSize: 9, color: '#64748b', fontWeight: 600, minWidth: 26, textAlign: 'right' }}>{Math.round(pct)}%</span></div>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}99)`, borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Milestone Progress */}
        <MilestoneProgressWidget checkIns={checkIns} ci30={ci30} avatarMap={avatarMap}/>
      </div>
    </div>
  );
}
