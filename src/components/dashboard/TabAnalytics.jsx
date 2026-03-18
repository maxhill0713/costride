import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { subDays, format, isWithinInterval, differenceInDays } from 'date-fns';
import {
  Activity, TrendingUp, TrendingDown, Users, Zap, ArrowUpRight,
  Calendar, Clock, Flame, CheckCircle, AlertTriangle, Shield,
  Target, Award, Star, Eye, UserPlus, Sparkles, BarChart2,
  RefreshCw, Heart, MessageCircle, Trophy,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, BarChart, Bar, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, LineChart, Line,
} from 'recharts';

// ── Design tokens — identical to Overview ─────────────────────────────────────
const T = {
  blue:    '#0ea5e9',
  green:   '#10b981',
  red:     '#ef4444',
  amber:   '#f59e0b',
  purple:  '#8b5cf6',
  cyan:    '#06b6d4',
  text1:   '#f0f4f8',
  text2:   '#94a3b8',
  text3:   '#475569',
  border:  'rgba(255,255,255,0.07)',
  borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1120',
  divider: 'rgba(255,255,255,0.05)',
};

const tickStyle = { fill: T.text3, fontSize: 10, fontFamily: 'DM Sans, system-ui' };

// ── Shared card shell — matches Overview exactly ───────────────────────────────
function SCard({ children, style = {}, accent }) {
  const c = accent || T.blue;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, position: 'relative', overflow: 'hidden', ...style }}>
      {/* 1px shimmer line — same as every Overview KPI card */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${c}28,transparent)`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

// Card header — title + optional sub + right slot
function CardHeader({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: sub ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// Divider list row
function SRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.divider}` }}>
      <span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: color || T.text1 }}>{value}</span>
    </div>
  );
}

// Stat value pill — matches Overview snapshot rows
function StatPill({ value, color }) {
  return (
    <span style={{ fontSize: 13, fontWeight: 800, color, background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 7, padding: '2px 9px' }}>{value}</span>
  );
}

const Empty = ({ icon: Icon, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
    <Icon style={{ width: 24, height: 24, color: T.text3, opacity: 0.5 }} />
    <span style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>{label}</span>
  </div>
);

// ── Chart tooltips ─────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#070e1c', border: `1px solid ${T.borderM}`, borderRadius: 8, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p style={{ color: T.text2, fontSize: 10, fontWeight: 600, margin: '0 0 3px', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ color: T.text1, fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value}</p>
    </div>
  );
};

const RadarTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#070e1c', border: `1px solid ${T.borderM}`, borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: T.text2, fontSize: 11, fontWeight: 700, margin: '0 0 3px' }}>{payload[0].payload.subject}</p>
      <p style={{ color: T.purple, fontWeight: 800, fontSize: 14, margin: 0 }}>{Math.round(payload[0].value)}%</p>
    </div>
  );
};

// ── KPI card — matches Overview KpiCard visually ───────────────────────────────
function KpiCard({ icon: Icon, label, value, valueSuffix, unit, color, trend, footerBar }) {
  return (
    <div style={{ borderRadius: 12, padding: '16px 18px 14px', background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Shimmer */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}28,transparent)`, pointerEvents: 'none' }} />
      {/* Soft corner glow */}
      <div style={{ position: 'absolute', bottom: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: color, opacity: 0.07, filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}14`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 12, height: 12, color }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: T.text1, lineHeight: 1, letterSpacing: '-0.05em' }}>{value}</span>
        {valueSuffix && <span style={{ fontSize: 14, fontWeight: 500, color: T.text3 }}>{valueSuffix}</span>}
      </div>
      {unit && <div style={{ fontSize: 11, color: T.text2, fontWeight: 500, marginBottom: 6 }}>{unit}</div>}
      {trend !== null && trend !== undefined && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: trend >= 0 ? `${T.green}12` : `${T.red}12`, width: 'fit-content', marginBottom: 8 }}>
          {trend >= 0 ? <ArrowUpRight style={{ width: 10, height: 10, color: T.green }} /> : <TrendingDown style={{ width: 10, height: 10, color: T.red }} />}
          <span style={{ fontSize: 10, fontWeight: 700, color: trend >= 0 ? T.green : T.red }}>{Math.abs(trend)}%</span>
        </div>
      )}
      {footerBar != null && (
        <div style={{ height: 2, borderRadius: 99, background: T.divider, overflow: 'hidden', marginTop: 'auto' }}>
          <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(100, footerBar)}%`, background: color, transition: 'width 0.8s ease' }} />
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
    if (isPeak) return { bg: `linear-gradient(135deg,${T.amber}cc,${T.red}aa)`, border: `${T.amber}99`, shadow: `0 0 10px ${T.amber}30` };
    if (val === 0) return { bg: T.divider, border: T.border, shadow: 'none' };
    if (pct < 0.2) return { bg: `${T.blue}18`, border: `${T.blue}28`, shadow: 'none' };
    if (pct < 0.4) return { bg: `${T.blue}38`, border: `${T.blue}45`, shadow: 'none' };
    if (pct < 0.6) return { bg: `${T.blue}58`, border: `${T.blue}70`, shadow: `0 0 6px ${T.blue}20` };
    if (pct < 0.8) return { bg: `${T.blue}80`, border: `${T.blue}95`, shadow: `0 0 8px ${T.blue}28` };
    return { bg: T.blue, border: T.blue, shadow: `0 0 10px ${T.blue}40` };
  };
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[{ label: '4W', val: 4 }, { label: '12W', val: 12 }, { label: 'All', val: 0 }].map(opt => (
          <button key={opt.val} onClick={() => setWeeks(opt.val)}
            style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit', background: weeks === opt.val ? `${T.blue}18` : T.divider, color: weeks === opt.val ? T.blue : T.text3, border: `1px solid ${weeks === opt.val ? T.blue + '40' : T.border}`, transition: 'all 0.15s' }}>
            {opt.label}
          </button>
        ))}
        <span style={{ fontSize: 10, color: T.text3, fontWeight: 500, alignSelf: 'center', marginLeft: 4 }}>{heatmapCheckIns.length} check-ins</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `50px repeat(${slotConfig.length}, 1fr)`, gap: 4, marginBottom: 6 }}>
        <div />
        {slotConfig.map(s => <div key={s.label} style={{ fontSize: 9, fontWeight: 700, color: T.text3, textAlign: 'center' }}>{s.label}</div>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {days.map((day, di) => (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: `50px repeat(${slotConfig.length}, 1fr)`, gap: 4, alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text2 }}>{day}</div>
            {grid[di].map((val, si) => {
              const { bg, border, shadow } = getCellStyle(val, di, si);
              const isPeak = di === peakDay && si === peakSlot && val > 0;
              return (
                <div key={si} title={val > 0 ? `${day} ${slotConfig[si].label}: ${val} check-ins` : undefined}
                  style={{ height: 34, borderRadius: 7, background: bg, border: `1px solid ${border}`, boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {val > 0 && (
                    <span style={{ fontSize: val >= 100 ? 8 : 9, fontWeight: 800, color: isPeak ? 'rgba(255,255,255,0.95)' : val / maxVal > 0.45 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)', letterSpacing: '-0.02em' }}>{val}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.divider}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: `${T.amber}0f`, border: `1px solid ${T.amber}28` }}>
          <Flame style={{ width: 11, height: 11, color: T.amber }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: T.amber }}>Peak: {days[peakDay]} {slotConfig[peakSlot]?.label}</span>
          <span style={{ fontSize: 9, color: `${T.amber}99`, fontWeight: 600 }}>· {grid[peakDay][peakSlot]} visits</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, color: T.text3, fontWeight: 600 }}>Low</span>
          {[T.divider, `${T.blue}18`, `${T.blue}38`, `${T.blue}58`, `${T.blue}80`, T.blue].map((bg, i) => (
            <div key={i} style={{ width: 16, height: 9, borderRadius: 3, background: bg, border: `1px solid ${T.border}` }} />
          ))}
          <span style={{ fontSize: 9, color: T.text3, fontWeight: 600 }}>High</span>
        </div>
      </div>
    </div>
  );
}

// ── Retention Funnel — visual stepper with arrows + conversion ────────────────
function RetentionFunnelWidget({ allMemberships, checkIns, now }) {
  const funnel = useMemo(() => {
    const total = allMemberships.length;
    const w1Return = allMemberships.filter(m => {
      const d = differenceInDays(now, new Date(m.created_at || m.join_date || now));
      if (d < 7) return false;
      return checkIns.filter(c => c.user_id === m.user_id).length >= 2;
    }).length;
    const month1Active = allMemberships.filter(m => {
      const d = differenceInDays(now, new Date(m.created_at || m.join_date || now));
      if (d < 30) return false;
      return checkIns.filter(c => {
        const cd = new Date(c.check_in_date), jd = new Date(m.created_at || m.join_date || now);
        return c.user_id === m.user_id && cd >= jd && differenceInDays(cd, jd) <= 30;
      }).length >= 4;
    }).length;
    const month3Retained = allMemberships.filter(m => {
      const d = differenceInDays(now, new Date(m.created_at || m.join_date || now));
      if (d < 90) return false;
      const last = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      return last && differenceInDays(now, new Date(last.check_in_date)) <= 21;
    }).length;
    return [
      { label: 'Joined',           val: total,          color: T.blue,   icon: UserPlus,    desc: 'Total members' },
      { label: 'Week-1 return',    val: w1Return,       color: T.green,  icon: RefreshCw,   desc: 'Came back in first week' },
      { label: 'Month-1 active',   val: month1Active,   color: T.purple, icon: Activity,    desc: '4+ visits in first month' },
      { label: 'Month-3 retained', val: month3Retained, color: T.amber,  icon: CheckCircle, desc: 'Still active at 3 months' },
    ];
  }, [allMemberships, checkIns, now]);

  const hasData = allMemberships.length > 0;

  return (
    <SCard accent={T.blue} style={{ padding: 20 }}>
      <CardHeader title="Retention Funnel" sub="Member lifecycle — where people drop off"
        right={
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `${T.blue}14`, border: `1px solid ${T.blue}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target style={{ width: 13, height: 13, color: T.blue }} />
          </div>
        }
      />

      {!hasData ? (
        <div style={{ padding: '14px', borderRadius: 9, background: `${T.blue}06`, border: `1px solid ${T.blue}18`, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.5 }}>Funnel populates once members have joined and checked in. Add members to get started.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {funnel.map((stage, i) => {
            const pctOfTotal  = funnel[0].val > 0 ? Math.round((stage.val / funnel[0].val) * 100) : 0;
            const convFromPrev = i > 0 && funnel[i-1].val > 0 ? Math.round((stage.val / funnel[i-1].val) * 100) : null;
            const dropPct      = convFromPrev !== null ? 100 - convFromPrev : 0;
            const barWidth     = pctOfTotal;

            return (
              <div key={i}>
                {/* Step row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                  {/* Step number + icon */}
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${stage.color}14`, border: `1px solid ${stage.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <stage.icon style={{ width: 14, height: 14, color: stage.color }} />
                    </div>
                  </div>
                  {/* Label + bar */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{stage.label}</span>
                        <span style={{ fontSize: 10, color: T.text3, marginLeft: 7 }}>{stage.desc}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: stage.color, letterSpacing: '-0.03em' }}>{stage.val}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: T.text3, minWidth: 28, textAlign: 'right' }}>{pctOfTotal}%</span>
                      </div>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barWidth}%`, borderRadius: 99, background: `linear-gradient(90deg,${stage.color},${stage.color}80)`, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                </div>

                {/* Conversion arrow between steps */}
                {i < funnel.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16, marginBottom: 2 }}>
                    {/* Vertical line */}
                    <div style={{ width: 1, height: 18, background: T.border, marginLeft: 15, flexShrink: 0 }} />
                    {/* Conversion badge */}
                    {convFromPrev !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: -4 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: dropPct > 40 ? T.red : dropPct > 20 ? T.amber : T.green, background: dropPct > 40 ? `${T.red}10` : dropPct > 20 ? `${T.amber}10` : `${T.green}10`, border: `1px solid ${dropPct > 40 ? T.red + '25' : dropPct > 20 ? T.amber + '25' : T.green + '25'}`, borderRadius: 5, padding: '1px 6px' }}>
                          {convFromPrev}% converted
                        </span>
                        {dropPct > 0 && (
                          <span style={{ fontSize: 9, color: T.text3 }}>({dropPct}% lost)</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SCard>
  );
}

// ── Drop-off Analysis ─────────────────────────────────────────────────────────
function DropOffAnalysis({ allMemberships, checkIns, now }) {
  const data = useMemo(() => {
    const buckets = [
      { label: 'Week 1',    min: 0,  max: 14,   daysInactive: 7,  color: T.red   },
      { label: 'Month 1',  min: 14, max: 30,   daysInactive: 7,  color: T.amber },
      { label: 'Month 2',  min: 30, max: 60,   daysInactive: 14, color: '#fb923c' },
      { label: 'Month 3',  min: 60, max: 90,   daysInactive: 14, color: '#fbbf24' },
      { label: '3+ months',min: 90, max: 9999, daysInactive: 21, color: T.text3  },
    ];
    return buckets.map(b => {
      const count = allMemberships.filter(m => {
        const age = differenceInDays(now, new Date(m.created_at || m.join_date || now));
        if (age < b.min || age >= b.max) return false;
        const last = checkIns.filter(c => c.user_id === m.user_id).sort((a, x) => new Date(x.check_in_date) - new Date(a.check_in_date))[0];
        return (last ? differenceInDays(now, new Date(last.check_in_date)) : 999) >= b.daysInactive;
      }).length;
      return { ...b, count };
    });
  }, [allMemberships, checkIns, now]);
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <SCard accent={T.red} style={{ padding: 20 }}>
      <CardHeader title="Drop-off Analysis" sub="Where members go quiet by lifecycle stage"
        right={
          <span style={{ fontSize: 11, fontWeight: 700, color: total > 0 ? T.red : T.green, background: total > 0 ? `${T.red}12` : `${T.green}12`, border: `1px solid ${total > 0 ? T.red + '22' : T.green + '22'}`, borderRadius: 7, padding: '3px 9px' }}>
            {total} at risk
          </span>
        }
      />
      {total === 0 ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: `${T.green}08`, border: `1px solid ${T.green}18` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.green }}>✓ No significant drop-off patterns detected</div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
              <XAxis dataKey="label" tick={tickStyle} axisLine={{ stroke: T.border }} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={22} allowDecimals={false} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length
                ? <div style={{ background: '#070e1c', border: `1px solid ${T.borderM}`, borderRadius: 8, padding: '8px 12px' }}>
                    <p style={{ color: T.text2, fontSize: 10, fontWeight: 600, margin: '0 0 3px' }}>{label}</p>
                    <p style={{ color: T.red, fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value} members</p>
                  </div> : null}
                cursor={{ fill: `${T.red}06` }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 9, background: `${T.amber}08`, border: `1px solid ${T.amber}18` }}>
            <div style={{ fontSize: 10, color: T.amber, fontWeight: 700, marginBottom: 2 }}>
              ⚡ Highest risk: {[...data].sort((a, b) => b.count - a.count)[0]?.label} stage
            </div>
            <div style={{ fontSize: 10, color: T.text3 }}>
              {[...data].sort((a, b) => b.count - a.count)[0]?.count || 0} members dropping off at this lifecycle point
            </div>
          </div>
        </>
      )}
    </SCard>
  );
}

// ── Churn Signal Tracker ──────────────────────────────────────────────────────
function ChurnSignalWidget({ allMemberships, checkIns, now }) {
  const signals = useMemo(() => allMemberships.map(m => {
    const mci = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
    const daysSince = mci.length > 0 ? differenceInDays(now, new Date(mci[0].check_in_date)) : 999;
    const last30 = mci.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 30).length;
    const prev30 = mci.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return d > 30 && d <= 60; }).length;
    const freqDrop = prev30 >= 4 && last30 < prev30 * 0.5;
    let score = 0;
    if (daysSince >= 7)  score += 20;
    if (daysSince >= 14) score += 30;
    if (daysSince >= 21) score += 30;
    if (freqDrop)        score += 20;
    return { ...m, name: m.user_name || m.name || 'Member', daysSince, freqDrop, score, last30, prev30 };
  }).filter(m => m.score >= 40).sort((a, b) => b.score - a.score).slice(0, 5), [allMemberships, checkIns, now]);

  return (
    <SCard accent={T.red} style={{ padding: 20 }}>
      <CardHeader title="Churn Signals" sub="Members showing early warning signs"
        right={<span style={{ fontSize: 10, fontWeight: 700, color: T.red, background: `${T.red}12`, border: `1px solid ${T.red}22`, borderRadius: 6, padding: '2px 7px' }}>{signals.length}</span>}
      />
      {signals.length === 0 ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: `${T.green}08`, border: `1px solid ${T.green}18` }}>
          <div style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ No churn signals detected</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {signals.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, background: m.score >= 80 ? `${T.red}08` : `${T.amber}08`, border: `1px solid ${m.score >= 80 ? T.red + '20' : T.amber + '20'}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>
                  {m.daysSince < 999 ? `${m.daysSince}d absent` : 'Never visited'}
                  {m.freqDrop && <span style={{ color: T.amber, marginLeft: 6 }}>· frequency dropping</span>}
                </div>
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: m.score >= 80 ? `${T.red}14` : `${T.amber}14`, border: `1px solid ${m.score >= 80 ? T.red + '28' : T.amber + '28'}` }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: m.score >= 80 ? T.red : T.amber, letterSpacing: '-0.02em' }}>{m.score}</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: T.text3, textTransform: 'uppercase' }}>risk</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SCard>
  );
}

// ── Week-1 Return Rate Trend ──────────────────────────────────────────────────
function Week1ReturnTrendWidget({ allMemberships, checkIns, now }) {
  const data = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const s = subDays(now, (7 - i) * 14), e = subDays(now, (6 - i) * 14);
    const cohort = allMemberships.filter(m => { const jd = new Date(m.created_at || m.join_date || now); return jd >= s && jd < e; });
    if (!cohort.length) return { label: format(s, 'MMM d'), pct: 0, total: 0 };
    const returned = cohort.filter(m => checkIns.filter(c => c.user_id === m.user_id).length >= 2).length;
    return { label: format(s, 'MMM d'), pct: Math.round((returned / cohort.length) * 100), total: cohort.length };
  }), [allMemberships, checkIns, now]);
  const latest = data[data.length - 1]?.pct || 0;
  const prev   = data[data.length - 2]?.pct || 0;
  const trend  = latest - prev;
  const color  = latest >= 60 ? T.green : latest >= 40 ? T.amber : T.red;
  return (
    <SCard accent={T.green} style={{ padding: 20 }}>
      <CardHeader title="Week-1 Return Rate" sub="New member cohort trend"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.04em' }}>{latest}%</span>
            {trend !== 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {trend > 0 ? <TrendingUp style={{ width: 11, height: 11, color: T.green }} /> : <TrendingDown style={{ width: 11, height: 11, color: T.red }} />}
                <span style={{ fontSize: 10, fontWeight: 700, color: trend > 0 ? T.green : T.red }}>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
        }
      />
      <ResponsiveContainer width="100%" height={72}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="w1Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.green} stopOpacity={0.3} />
              <stop offset="100%" stopColor={T.green} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={({ active, payload, label }) => active && payload?.length
            ? <div style={{ background: '#070e1c', border: `1px solid ${T.borderM}`, borderRadius: 8, padding: '6px 10px' }}>
                <p style={{ color: T.text2, fontSize: 9, margin: '0 0 2px' }}>{label}</p>
                <p style={{ color: T.green, fontWeight: 800, fontSize: 13, margin: 0 }}>{payload[0].value}% return rate</p>
              </div> : null}
            cursor={false}
          />
          <Area type="monotone" dataKey="pct" stroke={T.green} strokeWidth={2} fill="url(#w1Grad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 8, background: latest < 40 ? `${T.red}08` : `${T.green}08`, border: `1px solid ${latest < 40 ? T.red + '18' : T.green + '15'}` }}>
        <div style={{ fontSize: 10, color: latest < 40 ? T.red : latest < 60 ? T.amber : T.green, fontWeight: 600 }}>
          {latest < 40 ? '⚠️ Below target — follow up with new members in week 1' : latest < 60 ? 'Room to improve — a personal welcome message helps' : '✓ Strong week-1 return rate'}
        </div>
      </div>
    </SCard>
  );
}

// ── Smart Insights Panel — gym-size aware ─────────────────────────────────────
function SmartInsightsPanel({ checkIns, ci30, allMemberships, atRisk, retentionRate, monthChangePct, totalMembers, now }) {
  const insights = useMemo(() => {
    const items = [];

    // ── Too small for meaningful analytics ────────────────────────────────────
    if (totalMembers < 5) {
      items.push({ color: T.blue, icon: Users, label: `Only ${totalMembers} member${totalMembers === 1 ? '' : 's'} so far`, detail: `Analytics become meaningful at 10+ members. Add ${10 - totalMembers} more to unlock trend insights.`, priority: 0, isInfo: true });
      return items;
    }
    if (totalMembers < 10) {
      items.push({ color: T.blue, icon: Users, label: `${totalMembers} members — growing`, detail: `Retention data will be more reliable at 10+ members. Keep ${10 - totalMembers} more joining.`, priority: 0, isInfo: true });
    }

    // ── Retention ─────────────────────────────────────────────────────────────
    if (totalMembers >= 10) {
      if (retentionRate < 60) items.push({ color: T.red, icon: AlertTriangle, label: `Retention at ${retentionRate}% — below 70% healthy threshold`, detail: 'Focus on week-1 follow-ups and streak recovery messages.', priority: 1 });
      else if (retentionRate >= 80) items.push({ color: T.green, icon: CheckCircle, label: `Retention strong at ${retentionRate}%`, detail: 'You\'re in the top 20% of gyms — keep your current engagement rhythm.', priority: 5 });
    }

    // ── At-risk concentration ──────────────────────────────────────────────────
    const atRiskPct = totalMembers > 0 ? Math.round((atRisk / totalMembers) * 100) : 0;
    if (atRiskPct >= 20) items.push({ color: T.red, icon: Zap, label: `${atRiskPct}% of members are at risk`, detail: 'Send a re-engagement push to everyone 14+ days inactive.', priority: 1 });

    // ── Month change ──────────────────────────────────────────────────────────
    if (checkIns.length < 20) {
      items.push({ color: T.blue, icon: Activity, label: 'Not enough check-in data yet', detail: 'Month-over-month comparisons populate after 7+ days of check-ins.', priority: 2, isInfo: true });
    } else if (monthChangePct < -10) {
      items.push({ color: T.amber, icon: TrendingDown, label: `Check-ins down ${Math.abs(monthChangePct)}% vs last month`, detail: 'Consider a new challenge or event to re-activate attendance.', priority: 2 });
    } else if (monthChangePct > 15) {
      items.push({ color: T.green, icon: TrendingUp, label: `Strong growth — up ${monthChangePct}% this month`, detail: 'Great momentum. Make sure your schedule can handle demand.', priority: 4 });
    }

    // ── Visit frequency ───────────────────────────────────────────────────────
    const visitRatio = totalMembers > 0 ? (ci30.length / 30) / totalMembers : 0;
    if (visitRatio < 0.05 && totalMembers > 10) items.push({ color: T.amber, icon: Activity, label: 'Visit frequency is low', detail: 'Less than 5% of members check in per day. Try promoting morning classes.', priority: 2 });

    // ── Weekend attendance ─────────────────────────────────────────────────────
    const weekendCI = checkIns.filter(c => [0, 6].includes(new Date(c.check_in_date).getDay())).length;
    if (weekendCI / Math.max(checkIns.length, 1) < 0.15 && checkIns.length > 50) items.push({ color: T.blue, icon: Calendar, label: 'Weekend attendance is low (<15% of visits)', detail: 'A weekend challenge or Saturday event could drive more footfall.', priority: 3 });

    return items.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [checkIns, ci30, allMemberships, atRisk, retentionRate, monthChangePct, totalMembers, now]);

  return (
    <SCard accent={T.blue} style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Sparkles style={{ width: 13, height: 13, color: T.blue }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Smart Insights</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {insights.length === 0 ? (
          <div style={{ padding: '10px 12px', borderRadius: 8, background: `${T.green}08`, border: `1px solid ${T.green}18` }}>
            <div style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ Your gym looks healthy — no critical signals</div>
          </div>
        ) : insights.map((s, i) => (
          <div key={i} style={{ padding: '9px 12px', borderRadius: 9, background: `${s.color}${s.isInfo ? '06' : '08'}`, border: `1px solid ${s.color}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <s.icon style={{ width: 11, height: 11, color: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: s.isInfo ? T.text2 : T.text1 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 10, color: T.text3, paddingLeft: 18, lineHeight: 1.5 }}>{s.detail}</div>
          </div>
        ))}
      </div>
    </SCard>
  );
}

// ── Class Performance ─────────────────────────────────────────────────────────
function ClassPerformanceWidget({ classes, checkIns, ci30, now }) {
  const classData = useMemo(() => (classes || []).map(cls => {
    const clsCI = ci30.filter(c => c.class_id === cls.id || c.class_name === cls.name);
    const cap = cls.max_capacity || cls.capacity || 20;
    const sessions = Math.max(4, Math.ceil(clsCI.length / Math.max(cap * 0.5, 1)));
    const avgAtt = sessions > 0 ? Math.round(clsCI.length / sessions) : 0;
    const fillRate = Math.min(100, Math.round((avgAtt / cap) * 100));
    const first15 = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return (c.class_id === cls.id || c.class_name === cls.name) && d > 15; }).length;
    const last15  = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return (c.class_id === cls.id || c.class_name === cls.name) && d <= 15; }).length;
    const trending = first15 === 0 ? 0 : Math.round(((last15 - first15) / first15) * 100);
    return { ...cls, avgAtt, fillRate, trending, cap };
  }).sort((a, b) => b.fillRate - a.fillRate), [classes, ci30, now]);
  if (!classData.length) return null;
  return (
    <SCard accent={T.purple} style={{ padding: 20 }}>
      <CardHeader title="Class Performance" sub="Fill rates & attendance trends (30 days)"
        right={<Trophy style={{ width: 14, height: 14, color: T.purple }} />}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {classData.map((cls, i) => (
          <div key={cls.id || i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: cls.fillRate >= 75 ? T.green : cls.fillRate >= 40 ? T.amber : T.red, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{cls.name}</span>
                {cls.trending !== 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {cls.trending > 0 ? <TrendingUp style={{ width: 10, height: 10, color: T.green }} /> : <TrendingDown style={{ width: 10, height: 10, color: T.red }} />}
                    <span style={{ fontSize: 9, fontWeight: 700, color: cls.trending > 0 ? T.green : T.red }}>{cls.trending > 0 ? '+' : ''}{cls.trending}%</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: cls.fillRate >= 75 ? T.green : cls.fillRate >= 40 ? T.amber : T.red }}>{cls.fillRate}%</span>
                <span style={{ fontSize: 10, color: T.text3 }}>fill</span>
              </div>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${cls.fillRate}%`, borderRadius: 99, background: cls.fillRate >= 75 ? `linear-gradient(90deg,${T.green},#34d399)` : cls.fillRate >= 40 ? `linear-gradient(90deg,#d97706,${T.amber})` : `linear-gradient(90deg,${T.red},#f87171)`, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <span style={{ fontSize: 9, color: T.text3 }}>~{cls.avgAtt} avg / session</span>
              <span style={{ fontSize: 9, color: T.text3 }}>cap {cls.cap}</span>
            </div>
            {cls.fillRate < 30 && <div style={{ marginTop: 4, fontSize: 9, fontWeight: 700, color: T.red }}>⚠ Low attendance — consider rescheduling or promoting</div>}
          </div>
        ))}
      </div>
    </SCard>
  );
}

// ── Coach Impact ──────────────────────────────────────────────────────────────
function CoachImpactWidget({ coaches, checkIns, ci30, allMemberships, now }) {
  const data = useMemo(() => (coaches || []).map(coach => {
    const coachCI = ci30.filter(c => c.coach_id === coach.id || c.coach_name === coach.name);
    const uniqueMembers = new Set(coachCI.map(c => c.user_id)).size;
    const coachedIds = new Set(coachCI.map(c => c.user_id));
    const retained = [...coachedIds].filter(id => {
      const last = checkIns.filter(c => c.user_id === id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      return last && differenceInDays(now, new Date(last.check_in_date)) <= 14;
    }).length;
    const retentionImpact = coachedIds.size > 0 ? Math.round((retained / coachedIds.size) * 100) : 0;
    return { ...coach, uniqueMembers, retentionImpact };
  }).sort((a, b) => b.retentionImpact - a.retentionImpact), [coaches, checkIns, ci30, allMemberships, now]);
  if (!data.length) return null;
  return (
    <SCard accent={T.green} style={{ padding: 20 }}>
      <CardHeader title="Coach Impact" sub="Retention rate of members coached (30 days)" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.slice(0, 5).map((coach, i) => (
          <div key={coach.id || i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: i === 0 ? `${T.green}22` : T.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: i === 0 ? T.green : T.text3 }}>{i + 1}</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{coach.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: T.text3 }}>{coach.uniqueMembers} members</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: coach.retentionImpact >= 70 ? T.green : coach.retentionImpact >= 50 ? T.amber : T.red, letterSpacing: '-0.02em' }}>{coach.retentionImpact}%</span>
              </div>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${coach.retentionImpact}%`, borderRadius: 99, background: coach.retentionImpact >= 70 ? `linear-gradient(90deg,${T.green},#34d399)` : coach.retentionImpact >= 50 ? `linear-gradient(90deg,#d97706,${T.amber})` : `linear-gradient(90deg,${T.red},#f87171)`, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </SCard>
  );
}

// ── Milestone Progress ────────────────────────────────────────────────────────
function MilestoneProgressWidget({ checkIns }) {
  const milestones = useMemo(() => {
    const acc = {}, uid = {};
    checkIns.forEach(c => { if (!acc[c.user_name]) acc[c.user_name] = 0; acc[c.user_name]++; if (c.user_id) uid[c.user_name] = c.user_id; });
    return Object.entries(acc).map(([name, total]) => {
      const next = [10, 25, 50, 100, 200, 500].find(n => n > total) || null;
      return { name, total, next, toNext: next ? next - total : 0, user_id: uid[name] };
    }).filter(m => m.next && m.toNext <= 5).sort((a, b) => a.toNext - b.toNext).slice(0, 5);
  }, [checkIns]);
  if (!milestones.length) return null;
  return (
    <SCard accent={T.amber} style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Award style={{ width: 13, height: 13, color: T.amber }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Upcoming Milestones</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {milestones.map((m, i) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < milestones.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: m.toNext === 1 ? `${T.amber}22` : T.divider, border: `1px solid ${m.toNext === 1 ? T.amber + '30' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: m.toNext === 1 ? T.amber : T.text3 }}>{m.total}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
              <div style={{ fontSize: 10, color: m.toNext === 1 ? T.green : T.text3, marginTop: 1 }}>
                {m.toNext === 1 ? '🎉 1 visit to milestone!' : `${m.toNext} visits to ${m.next}`}
              </div>
            </div>
            {/* Mini ring */}
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `conic-gradient(${T.amber} ${Math.round((m.total / m.next) * 360)}deg, ${T.divider} 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: T.card }} />
            </div>
          </div>
        ))}
      </div>
    </SCard>
  );
}

// ── Engagement / Frequency breakdown (reusable) ───────────────────────────────
function SegmentBreakdown({ title, segments, total }) {
  return (
    <SCard accent={T.purple} style={{ padding: 20 }}>
      <CardHeader title={title} />
      {total > 0 && (
        <div style={{ height: 5, borderRadius: 99, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 14 }}>
          {segments.filter(s => s.val > 0).map((s, i, arr) => (
            <div key={i} style={{ flex: s.val, background: s.color, opacity: 0.85, borderRadius: i === 0 ? '99px 0 0 99px' : i === arr.length - 1 ? '0 99px 99px 0' : 0 }} />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {segments.map((s, i) => {
          const pct = total > 0 ? Math.round((s.val / total) * 100) : 0;
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text1 }}>{s.label}</span>
                  {s.sub && <span style={{ fontSize: 9, color: T.text3 }}>{s.sub}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.val}</span>
                  <span style={{ fontSize: 9, color: T.text3, minWidth: 26, textAlign: 'right' }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${s.color},${s.color}99)`, borderRadius: 99, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </SCard>
  );
}

// ── Busiest Days / Peak Hours — shared bar list ───────────────────────────────
function RankedBarList({ title, icon: Icon, accent, items, emptyIcon, emptyLabel }) {
  return (
    <SCard accent={accent} style={{ padding: 20 }}>
      <CardHeader title={title}
        right={<div style={{ width: 26, height: 26, borderRadius: 7, background: `${accent}14`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon style={{ width: 12, height: 12, color: accent }} /></div>}
      />
      {items.every(d => (d.count || d.pct || 0) === 0) ? <Empty icon={emptyIcon || Icon} label={emptyLabel || 'No data yet'} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {items.map((h, i) => (
            <div key={h.label || h.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: i === 0 ? T.amber : T.text3, width: 18, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text1, width: 38, flexShrink: 0 }}>{h.label || h.name}</span>
              <div style={{ flex: 1, height: 5, borderRadius: 99, overflow: 'hidden', background: T.divider }}>
                <div style={{ height: '100%', width: `${h.pct ?? ((h.count / items[0].count) * 100)}%`, borderRadius: 99, background: i === 0 ? `linear-gradient(90deg,${T.amber},${T.red})` : `linear-gradient(90deg,${T.blue},${T.cyan})`, transition: 'width 0.7s ease' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? T.amber : T.text2, width: 22, textAlign: 'right', flexShrink: 0 }}>{h.count}</span>
            </div>
          ))}
        </div>
      )}
    </SCard>
  );
}

// ── Vs-last-month comparison badge ────────────────────────────────────────────
function VsBadge({ current, prev, unit = '' }) {
  if (!prev || prev === 0) return null;
  const diff = current - prev;
  const pct  = Math.round((diff / prev) * 100);
  const up   = diff > 0;
  const flat = diff === 0;
  const color = flat ? T.text3 : up ? T.green : T.red;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: flat ? T.divider : up ? `${T.green}10` : `${T.red}10`, border: `1px solid ${flat ? T.border : up ? T.green + '25' : T.red + '25'}`, color }}>
      {flat ? '→' : up ? '↑' : '↓'} {Math.abs(pct)}% vs last month
    </span>
  );
}

// ── Trends Summary Card — right sidebar "deeper" panel ────────────────────────
function TrendsSummaryCard({ ci30, ciPrev30, allMemberships, retentionRate, atRisk, monthChangePct, totalMembers, now }) {
  const prevTotalCI = ciPrev30?.length || 0;
  const thisTotalCI = ci30.length;

  // Simulate prev-month retention (rough estimate from prev-month active set)
  const prevActive = useMemo(() => {
    if (!ciPrev30?.length) return null;
    return new Set(ciPrev30.map(c => c.user_id)).size;
  }, [ciPrev30]);
  const thisActive = useMemo(() => new Set(ci30.map(c => c.user_id)).size, [ci30]);
  const prevRetention = prevActive !== null && totalMembers > 0 ? Math.round((prevActive / totalMembers) * 100) : null;

  const rows = [
    { label: 'Check-ins',        curr: thisTotalCI,  prev: prevTotalCI,   fmt: v => v,          color: T.blue   },
    { label: 'Active members',   curr: thisActive,   prev: prevActive,    fmt: v => v,          color: T.green  },
    { label: 'Retention rate',   curr: retentionRate,prev: prevRetention, fmt: v => `${v}%`,    color: retentionRate >= 70 ? T.green : T.amber },
    { label: 'At-risk members',  curr: atRisk,       prev: null,          fmt: v => v,          color: atRisk > 0 ? T.red : T.green },
  ];

  return (
    <SCard accent={T.blue} style={{ padding: 20 }}>
      <CardHeader title="Month Comparison" sub="This month vs last month" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < rows.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
            <span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>{r.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {r.prev !== null && <VsBadge current={r.curr} prev={r.prev} />}
              <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.fmt(r.curr)}</span>
            </div>
          </div>
        ))}
      </div>
      {prevTotalCI === 0 && (
        <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 8, background: `${T.blue}06`, border: `1px solid ${T.blue}15` }}>
          <div style={{ fontSize: 10, color: T.text3, lineHeight: 1.5 }}>Comparison data populates after your first full month of check-ins.</div>
        </div>
      )}
    </SCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TabAnalytics({
  checkIns, ci30, ciPrev30 = [], totalMembers, monthCiPer, monthChangePct,
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
    const s = subDays(now, (11 - i) * 7), e = subDays(now, (10 - i) * 7);
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

  const trendColor = monthChangePct > 0 ? T.green : monthChangePct < 0 ? T.red : T.text3;

  // Coach analytics
  const classAttendance = useMemo(() => {
    if (!isCoach || !myClasses.length) return [];
    return myClasses.map(cls => {
      const attended = ci30.filter(c => {
        if (!cls.schedule) return false;
        const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
        if (!match) return false;
        let h = parseInt(match[1]); if (match[2].toLowerCase() === 'pm' && h !== 12) h += 12;
        const ch = new Date(c.check_in_date).getHours(); return ch === h || ch === h + 1;
      }).length;
      const cap  = cls.max_capacity || 20;
      const fill = Math.min(100, Math.round((attended / cap) * 100));
      return { name: cls.name, schedule: cls.schedule, capacity: cap, attended, fill };
    });
  }, [isCoach, myClasses, ci30]);

  const classWeeklyTrend = useMemo(() => {
    if (!isCoach) return [];
    return Array.from({ length: 8 }, (_, i) => {
      const s = subDays(now, (7 - i) * 7), e = subDays(now, (6 - i) * 7);
      return { label: format(s, 'MMM d'), value: checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: s, end: e })).length };
    });
  }, [isCoach, checkIns]);

  const memberFrequency = useMemo(() => {
    if (!isCoach) return { frequent: 0, occasional: 0, rare: 0, inactive: 0 };
    const freq = {};
    ci30.forEach(c => { freq[c.user_id] = (freq[c.user_id] || 0) + 1; });
    const vals = Object.values(freq);
    return { frequent: vals.filter(v => v >= 12).length, occasional: vals.filter(v => v >= 4 && v < 12).length, rare: vals.filter(v => v >= 1 && v < 4).length, inactive: Math.max(0, totalMembers - vals.length) };
  }, [isCoach, ci30, totalMembers]);

  const snapshotColor = (v, thresholds, colors) => {
    for (let i = 0; i < thresholds.length; i++) if (v <= thresholds[i]) return colors[i];
    return colors[colors.length - 1];
  };

  // ── Coach view ───────────────────────────────────────────────────────────────
  if (isCoach) return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 18, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard icon={Activity}   label="Monthly Check-ins"  value={ci30.length}     unit="this month"             color={T.blue}   trend={monthChangePct} footerBar={totalMembers > 0 ? (ci30.length / (totalMembers * 4)) * 100 : 0} />
          <KpiCard icon={Users}      label="Active Members"     value={activeThisMonth} unit={`of ${totalMembers}`}   color={T.green}  footerBar={totalMembers > 0 ? (activeThisMonth / totalMembers) * 100 : 0} />
          <KpiCard icon={TrendingUp} label="Avg Visits/Member"  value={avgPerMem}       unit="this month"             color={T.purple} />
          <KpiCard icon={Zap}        label="At Risk"            value={atRisk}          unit="14+ days absent"        color={atRisk > 0 ? T.red : T.green} />
        </div>

        {classAttendance.length > 0 && (
          <SCard accent={T.purple} style={{ padding: 20 }}>
            <CardHeader title="My Class Attendance (30 days)" sub="Estimated from check-in time slots" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {classAttendance.map((cls, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{cls.name}</span>
                      {cls.schedule && <span style={{ fontSize: 10, color: T.text3, marginLeft: 8 }}>{cls.schedule}</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: cls.fill >= 75 ? T.green : cls.fill >= 40 ? T.amber : T.red }}>{cls.attended}</span>
                      <span style={{ fontSize: 9, color: T.text3, marginLeft: 4 }}>/ {cls.capacity} cap</span>
                    </div>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cls.fill}%`, background: cls.fill >= 75 ? `linear-gradient(90deg,${T.green},#34d399)` : cls.fill >= 40 ? `linear-gradient(90deg,#d97706,${T.amber})` : `linear-gradient(90deg,${T.red},#f87171)`, borderRadius: 99, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: 9, color: T.text3, marginTop: 3, textAlign: 'right' }}>{cls.fill}% fill rate</div>
                </div>
              ))}
            </div>
          </SCard>
        )}

        <SCard accent={T.blue} style={{ padding: 20 }}>
          <CardHeader title="Class Attendance Trend" sub="8-week rolling view" />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={classWeeklyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="coachTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.purple} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={T.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
              <XAxis dataKey="label" tick={tickStyle} axisLine={{ stroke: T.border }} tickLine={false} interval={1} />
              <YAxis tick={tickStyle} axisLine={{ stroke: T.border }} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: `${T.purple}28`, strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="value" stroke={T.purple} strokeWidth={2} fill="url(#coachTrendGrad)" dot={false} activeDot={{ r: 4, fill: T.purple, stroke: T.text1, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </SCard>

        <SCard accent={T.cyan} style={{ padding: 20 }}>
          <CardHeader title="Member Traffic Heatmap" sub="Check-in density by day and time"
            right={<div style={{ width: 26, height: 26, borderRadius: 7, background: `${T.cyan}14`, border: `1px solid ${T.cyan}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Flame style={{ width: 12, height: 12, color: T.cyan }} /></div>}
          />
          <HeatmapChart gymId={gymId} />
        </SCard>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SCard accent={T.blue} style={{ padding: 20 }}>
          <CardHeader title="30-Day Snapshot" />
          <SRow label="Total check-ins"   value={ci30.length}                                              color={T.blue}   />
          <SRow label="Active members"    value={activeThisMonth}                                          color={T.green}  />
          <SRow label="At-risk members"   value={atRisk}                                                   color={atRisk > 0 ? T.red : T.green} />
          <SRow label="My classes"        value={myClasses.length}                                         color={T.purple} />
          <SRow label="Avg visits/member" value={totalMembers > 0 ? (ci30.length / totalMembers).toFixed(1) : '—'} color={T.amber}  />
        </SCard>

        <SegmentBreakdown title="Member Frequency" total={totalMembers} segments={[
          { label: 'Frequent',   sub: '12+/mo', val: memberFrequency.frequent,   color: T.green  },
          { label: 'Occasional', sub: '4–11',   val: memberFrequency.occasional, color: T.blue   },
          { label: 'Rare',       sub: '1–3',    val: memberFrequency.rare,       color: T.purple },
          { label: 'Inactive',   sub: '0',      val: memberFrequency.inactive,   color: T.amber  },
        ]} />

        <RankedBarList title="Busiest Days" icon={Calendar} accent={T.amber} items={busiestDays.map(d => ({ ...d, label: d.name, pct: (d.count / dayMax) * 100 }))} emptyLabel="No data yet" />
        <RankedBarList title="Peak Hours"   icon={Clock}    accent={T.amber} items={peakHours.slice(0, 5)} emptyLabel="No check-in data yet" />
      </div>
    </div>
  );

  // ── Gym owner view ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 292px', gap: 18, alignItems: 'start' }}>

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* KPIs — with vs-last-month context */}
        {checkIns.length < 3 ? (
          // Too little data — friendly placeholder instead of a row of zeros
          <SCard style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.blue}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Activity style={{ width: 16, height: 16, color: T.blue }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Analytics data loading</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 3, lineHeight: 1.5 }}>KPIs and trends populate after your first 7 days of check-ins. Start by scanning member QR codes.</div>
              </div>
            </div>
          </SCard>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
            <KpiCard icon={Activity}   label="Daily Avg"       value={dailyAvg}   unit="check-ins / day"   color={T.blue}   trend={monthChangePct} footerBar={totalMembers > 0 ? (dailyAvg / totalMembers) * 100 : 0} />
            <KpiCard icon={TrendingUp} label="Monthly Change"  value={`${monthChangePct >= 0 ? '+' : ''}${monthChangePct}%`} unit="vs last month"   color={trendColor} trend={monthChangePct} />
            <KpiCard icon={Users}      label="Avg / Member"    value={avgPerMem}  unit="visits this month"  color={T.purple} footerBar={totalMembers > 0 ? Math.min(100, (parseFloat(avgPerMem) / 20) * 100) : 0} />
            <KpiCard icon={Zap}        label="Return Rate"     value={`${returnRate}%`} unit="of all check-ins" color={T.amber} footerBar={returnRate} />
          </div>
        )}

        <SmartInsightsPanel checkIns={checkIns} ci30={ci30} allMemberships={allMemberships} atRisk={atRisk} retentionRate={retentionRate} monthChangePct={monthChangePct} totalMembers={totalMembers} now={now} />
        <RetentionFunnelWidget allMemberships={allMemberships} checkIns={checkIns} now={now} />
        <DropOffAnalysis allMemberships={allMemberships} checkIns={checkIns} now={now} />

        {/* Weekly Trend — only show once there's meaningful data */}
        {weekTrend.some(d => d.value > 0) ? (
        <SCard accent={T.blue} style={{ padding: 20 }}>
          <CardHeader title="Weekly Check-in Trend" sub="12-week rolling view"
            right={<span style={{ fontSize: 10, fontWeight: 700, color: T.blue, background: `${T.blue}12`, border: `1px solid ${T.blue}25`, borderRadius: 7, padding: '2px 9px' }}>{weekTrend.reduce((s, d) => s + d.value, 0)} total</span>}
          />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="wtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.blue} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={T.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
              <XAxis dataKey="label" tick={tickStyle} axisLine={{ stroke: T.border }} tickLine={false} interval={2} />
              <YAxis tick={tickStyle} axisLine={{ stroke: T.border }} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: `${T.blue}28`, strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="value" stroke={T.blue} strokeWidth={2} fill="url(#wtGrad)" dot={false} activeDot={{ r: 4, fill: T.blue, stroke: T.text1, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </SCard>
        ) : (
          <SCard style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Activity style={{ width: 14, height: 14, color: T.text3 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text2 }}>Weekly trend chart</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Populates after 7+ days of check-in data</div>
              </div>
            </div>
          </SCard>
        )}

        <ClassPerformanceWidget classes={classes} checkIns={checkIns} ci30={ci30} now={now} />

        {/* Member Growth */}
        <SCard accent={T.green} style={{ padding: 20 }}>
          <CardHeader title="Member Growth" sub="Monthly new sign-up trend"
            right={
              <div style={{ display: 'flex', gap: 7 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.green,  background: `${T.green}12`,  border: `1px solid ${T.green}22`,  borderRadius: 7, padding: '2px 9px' }}>+{newSignUps} this month</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.red,    background: `${T.red}0a`,    border: `1px solid ${T.red}20`,    borderRadius: 7, padding: '2px 9px' }}>{retentionRate}% retention</span>
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthGrowthData} barSize={20} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.green} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={T.green} stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
              <XAxis dataKey="label" tick={tickStyle} axisLine={{ stroke: T.border }} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={{ stroke: T.border }} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length
                ? <div style={{ background: '#070e1c', border: `1px solid ${T.borderM}`, borderRadius: 8, padding: '8px 12px' }}>
                    <p style={{ color: T.text2, fontSize: 10, fontWeight: 600, margin: '0 0 3px' }}>{label}</p>
                    <p style={{ color: T.green, fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value} active</p>
                  </div> : null}
                cursor={{ fill: `${T.green}06` }}
              />
              <Bar dataKey="value" fill="url(#mgGrad)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SCard>

        {/* Traffic Heatmap */}
        <SCard accent={T.cyan} style={{ padding: 20 }}>
          <CardHeader title="Traffic Heatmap" sub="Check-in density by day and time"
            right={<div style={{ width: 26, height: 26, borderRadius: 7, background: `${T.cyan}14`, border: `1px solid ${T.cyan}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Flame style={{ width: 12, height: 12, color: T.cyan }} /></div>}
          />
          <HeatmapChart gymId={gymId} />
        </SCard>

        {/* Peak Hours */}
        <RankedBarList title="Peak Hours" icon={Clock} accent={T.amber} items={peakHours} emptyLabel="No check-in data yet" />
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 30-Day Snapshot */}
        <SCard accent={T.blue} style={{ padding: 20 }}>
          <CardHeader title="30-Day Snapshot" />
          {[
            { label: 'Total check-ins', value: ci30.length,         color: T.blue   },
            { label: 'New sign-ups',    value: newSignUps,          color: T.purple  },
            { label: 'At-risk members', value: atRisk,              color: atRisk > 0 ? T.red : T.green },
            { label: 'Retention rate',  value: `${retentionRate}%`, color: retentionRate >= 70 ? T.green : T.amber },
            { label: 'Active classes',  value: (classes || []).length, color: T.purple },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
              <span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>{s.label}</span>
              <StatPill value={s.value} color={s.color} />
            </div>
          ))}
        </SCard>

        {/* Month Comparison — new deeper right panel */}
        <TrendsSummaryCard
          ci30={ci30} ciPrev30={ciPrev30} allMemberships={allMemberships}
          retentionRate={retentionRate} atRisk={atRisk}
          monthChangePct={monthChangePct} totalMembers={totalMembers} now={now}
        />

        <Week1ReturnTrendWidget allMemberships={allMemberships} checkIns={checkIns} now={now} />
        <ChurnSignalWidget allMemberships={allMemberships} checkIns={checkIns} now={now} />

        {/* Gym Health Radar */}
        <SCard accent={T.purple} style={{ padding: 20 }}>
          <CardHeader title="Gym Health Radar" sub="6-metric performance overview" />
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={radarData} margin={{ top: 4, right: 10, bottom: 4, left: 10 }}>
              <PolarGrid stroke={T.border} radialLines={false} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: T.text2, fontSize: 9, fontFamily: 'DM Sans, system-ui', fontWeight: 700 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="A" stroke={T.purple} fill={T.purple} fillOpacity={0.12} strokeWidth={2} />
              <Tooltip content={<RadarTip />} />
            </RadarChart>
          </ResponsiveContainer>
        </SCard>

        <CoachImpactWidget coaches={coaches} checkIns={checkIns} ci30={ci30} allMemberships={allMemberships} now={now} />
        <RankedBarList title="Busiest Days" icon={Calendar} accent={T.amber} items={busiestDays.map(d => ({ ...d, label: d.name, pct: (d.count / dayMax) * 100 }))} emptyLabel="No data yet" />

        <SegmentBreakdown title="Engagement Breakdown" total={totalMembers} segments={[
          { label: 'Super Active', sub: '15+ visits', val: superActive, color: T.green  },
          { label: 'Active',       sub: '8–14',       val: active,      color: T.blue   },
          { label: 'Casual',       sub: '1–7',        val: casual,      color: T.purple },
          { label: 'Inactive',     sub: '0 visits',   val: inactive,    color: T.amber  },
        ]} />

        <MilestoneProgressWidget checkIns={checkIns} />
      </div>
    </div>
  );
}
