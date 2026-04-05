/**
 * TabAnalytics — with page header matching Members/Content pages.
 * External imports (base44, react-query) kept as-is for app wiring.
 * Header added to both coach and gym-owner views.
 */
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, differenceInDays, subDays, isWithinInterval } from 'date-fns';
import {
  Activity, TrendingUp, TrendingDown, Users, Zap, ArrowUpRight,
  Calendar, Clock, AlertTriangle, Shield, Target, Award,
  UserPlus, BarChart2, RefreshCw, CheckCircle,
  Send, ChevronRight, MoreHorizontal, Plus,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, BarChart, Bar, Cell,
} from 'recharts';

/* ── Design tokens ──────────────────────────────────────────────── */
const T = {
  bg:          '#08090e',
  surface:     '#0f1016',
  surfaceEl:   '#14151d',
  surfaceHov:  '#191a24',
  border:      '#1e2030',
  borderEl:    '#262840',
  divider:     '#141520',
  t1: '#ededf0', t2: '#9191a4', t3: '#525266', t4: '#2e2e42',
  accent:      '#4c6ef5',
  accentDim:   '#1a2048',
  accentBrd:   '#263070',
  red:         '#c0392b',
  redDim:      '#160f0d',
  redBrd:      '#2e1614',
  amber:       '#b07b30',
  amberDim:    '#161008',
  amberBrd:    '#2a2010',
  green:       '#2d8a62',
  greenDim:    '#091912',
  greenBrd:    '#132e20',
  r:   '8px',
  rsm: '6px',
  sh:  '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.025)',
};

const F   = "'Geist','DM Sans','Helvetica Neue',Arial,sans-serif";
const MVM = 40;

/* ── Count-up hook ──────────────────────────────────────────────── */
function useCountUp(target, delay = 0) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => {
      started.current = true;
      const dur = 900; let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return val;
}

/* ── Chart helpers ──────────────────────────────────────────────── */
const tick      = { fill: T.t3, fontSize: 10, fontFamily: F };
const ChartTip  = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.bg, border: `1px solid ${T.borderEl}`, borderRadius: T.rsm, padding: '7px 11px', boxShadow: '0 6px 20px rgba(0,0,0,.5)' }}>
      <p style={{ color: T.t3, fontSize: 10, margin: '0 0 2px' }}>{label}</p>
      <p style={{ color: T.t1, fontWeight: 700, fontSize: 13, margin: 0 }}>{payload[0].value}</p>
    </div>
  );
};
const AreaGrad = ({ id }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stopColor={T.accent} stopOpacity={0.14} />
      <stop offset="100%" stopColor={T.accent} stopOpacity={0}    />
    </linearGradient>
  </defs>
);

/* ── Shared primitives ──────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r, boxShadow: T.sh, overflow: 'hidden', position: 'relative', ...style }}>
      {children}
    </div>
  );
}
function CardHead({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: sub ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.t2 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}
function SectionLabel({ children }) {
  return <div style={{ fontSize: 9, fontWeight: 600, color: T.t3, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10, fontFamily: F }}>{children}</div>;
}
function ThinBar({ pct, color = T.t3, height = 2 }) {
  return (
    <div style={{ height, borderRadius: 99, background: T.divider, flex: 1 }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: 99, background: color, opacity: 0.75 }} />
    </div>
  );
}
function Empty({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
      <Icon size={15} color={T.t4} />
      <span style={{ fontSize: 11, color: T.t3 }}>{label}</span>
    </div>
  );
}

/* ── Buttons ────────────────────────────────────────────────────── */
function Cta({ label, icon: Icon, onClick, full = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 12px', borderRadius: T.rsm, background: T.accent, color: '#fff', border: '1px solid transparent', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: F, width: full ? '100%' : undefined, opacity: hov ? 0.88 : 1, transition: 'opacity .12s' }}>
      {Icon && <Icon size={10} />}{label}
    </button>
  );
}
function GhostBtn({ label, icon: Icon, onClick, style = {}, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: T.rsm, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: F, border: '1px solid', background: hov ? T.surfaceHov : T.surfaceEl, borderColor: hov ? T.borderEl : T.border, color: T.t2, transition: 'all .12s', ...style }}>
      {Icon && <Icon size={10} />}{label}{children}
    </button>
  );
}

/* ── Page header (matches Members page) ─────────────────────────── */
function PageHeader({ title, sub, icon: Icon, buttons }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: T.rsm, background: T.accentDim, border: `1px solid ${T.accentBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={13} color={T.accent} />
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: T.t1, margin: 0, letterSpacing: '-0.03em' }}>{title}</h1>
        </div>
        <p style={{ fontSize: 12, color: T.t3, margin: 0, lineHeight: 1.6 }}>{sub}</p>
      </div>
      {buttons && (
        <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>{buttons}</div>
      )}
    </div>
  );
}

/* ── StatCard ───────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, prefix = '', suffix = '', delay = 0, highlight = false, danger = false, amber = false }) {
  const isNum   = typeof value === 'number';
  const counted = useCountUp(isNum ? value : 0, delay);
  const display = isNum ? `${prefix}${counted.toLocaleString()}${suffix}` : value;
  const valColor = danger ? T.red : amber ? T.amber : highlight ? T.accent : T.t1;
  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: T.rsm, flexShrink: 0, background: T.surfaceEl, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={highlight ? T.accent : danger ? T.red : T.t3} />
        </div>
        <ArrowUpRight size={11} color={T.t4} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: valColor, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>{display}</div>
      <div style={{ fontSize: 11, fontWeight: 500, color: T.t2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: T.t3, marginTop: 3 }}>{sub}</div>}
    </Card>
  );
}

/* ── Today's Focus ──────────────────────────────────────────────── */
function TodaysFocus({ churnSignals = [], atRisk = 0, newSignUps = 0, ci30 = [], now, totalMembers = 0 }) {
  const cards = useMemo(() => {
    const list = [];
    if (churnSignals.length > 0) {
      const weeks3 = churnSignals.filter(m => m.daysSince >= 21).length;
      list.push({ slot: 'danger', icon: AlertTriangle, title: `${churnSignals.length} quiet members`, insight: weeks3 > 0 ? `${weeks3} haven't visited in 3+ weeks — worth a personal message` : 'Engagement has dropped — a check-in usually brings half back', cta: 'Message now', rev: churnSignals.length * MVM });
    } else if (atRisk > 0) {
      list.push({ slot: 'danger', icon: AlertTriangle, title: `${atRisk} members need attention`, insight: 'No check-in in 14+ days — drop-off risk increases after 3 weeks', cta: 'Review', rev: atRisk * MVM });
    }
    const activeThisWeek = new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).map(c => c.user_id));
    const newInactive = Math.max(0, newSignUps - activeThisWeek.size);
    if (newInactive > 0) {
      list.push({ slot: 'neutral', icon: UserPlus, title: `${newInactive} new members not active yet`, insight: 'First visit within 7 days doubles week-4 retention', cta: 'Send welcome' });
    }
    const retWeek  = ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).length;
    const prevWeek = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return d > 7 && d <= 14; }).length;
    if (prevWeek > 0 && retWeek >= prevWeek * 1.1) {
      list.push({ slot: 'positive', icon: TrendingUp, title: 'Check-ins up this week', insight: `${retWeek} visits vs ${prevWeek} last week — good momentum`, cta: null });
    } else {
      list.push({ slot: 'neutral', icon: Calendar, title: 'Evening slots have capacity', insight: '6–8pm is typically underused — a targeted post can fill it', cta: null });
    }
    return list.slice(0, 3);
  }, [churnSignals, atRisk, newSignUps, ci30, now]);

  const accentColor = { danger: T.red, warn: T.amber, neutral: T.borderEl, positive: T.green };
  if (!cards.length) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: T.t3, letterSpacing: '.1em', textTransform: 'uppercase' }}>Today's Focus</span>
        <span style={{ fontSize: 10, color: T.t4 }}>· {format(new Date(), 'EEE d MMM')}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cards.length}, 1fr)`, gap: 10 }}>
        {cards.map((card, i) => (
          <div key={i} style={{ background: T.surfaceEl, borderRadius: T.r, padding: '14px 16px', border: `1px solid ${T.border}`, borderLeft: `2px solid ${accentColor[card.slot] || T.borderEl}`, boxShadow: T.sh }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: card.cta ? 12 : 0 }}>
              <card.icon size={12} color={accentColor[card.slot] || T.t3} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, marginBottom: 4 }}>{card.title}</div>
                <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.5 }}>{card.insight}</div>
                {card.slot === 'danger' && card.rev > 0 && (
                  <div style={{ fontSize: 10, color: T.t3, marginTop: 4 }}>~£{card.rev}/month if unaddressed</div>
                )}
              </div>
            </div>
            {card.cta && <Cta label={card.cta} onClick={() => {}} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── KPI Strip ──────────────────────────────────────────────────── */
function KpiStrip({ totalMembers, activeThisMonth, atRisk, retentionRate, monthChangePct, ci30, now }) {
  const active7d = useMemo(() =>
    new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).map(c => c.user_id)).size
  , [ci30, now]);
  const engagePct = totalMembers > 0 ? Math.round((activeThisMonth / totalMembers) * 100) : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      <StatCard icon={Users}         label="Active members (7d)" value={active7d}       suffix="" sub={`of ${totalMembers} total · ${Math.round((active7d / Math.max(totalMembers, 1)) * 100)}%`} delay={0}   highlight />
      <StatCard icon={Activity}      label="Engagement rate"      value={engagePct}      suffix="%" sub={monthChangePct > 0 ? `+${monthChangePct}% vs last month` : monthChangePct < 0 ? `${monthChangePct}% vs last month` : 'Flat vs last month'} delay={100} />
      <StatCard icon={Shield}        label="Retention rate"       value={retentionRate}  suffix="%" sub={retentionRate >= 80 ? 'Strong — above target' : retentionRate < 60 ? 'Below target — needs attention' : 'Average'} delay={200} amber={retentionRate < 60} />
      <StatCard icon={AlertTriangle} label="Inactive members"     value={atRisk}         sub={atRisk > 0 ? `${Math.round((atRisk / Math.max(totalMembers, 1)) * 100)}% of members` : 'All members active'} delay={300} danger={atRisk > totalMembers * 0.2} />
    </div>
  );
}

/* ── Churn & Revenue Panel ──────────────────────────────────────── */
function ChurnRevenuePanel({ churnSignals = [], atRisk = 0, totalMembers = 0 }) {
  const churnCount = churnSignals.length;
  const totalRev   = churnCount * MVM;
  const hasData    = churnCount > 0;
  const riskLabel  = s => s >= 90 ? 'Critical' : s >= 70 ? 'High' : s >= 50 ? 'Medium' : 'Low';
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.t2 }}>Churn & Revenue Risk</div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>Members showing low engagement patterns</div>
        </div>
        {hasData && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.red, letterSpacing: '-0.03em', lineHeight: 1 }}>£{totalRev}</div>
            <div style={{ fontSize: 9, color: T.t3, marginTop: 2 }}>est. monthly exposure</div>
          </div>
        )}
      </div>
      {!hasData ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
          <CheckCircle size={11} color={T.green} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: T.t1 }}>No churn signals detected</div>
            <div style={{ fontSize: 10, color: T.t3, marginTop: 1 }}>All tracked members showing healthy engagement</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { val: churnCount, label: 'quiet members', color: T.red },
              { val: totalMembers > 0 ? `${Math.round((churnCount / totalMembers) * 100)}%` : '—', label: 'of membership', color: T.t1 },
            ].map((s, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{s.val}</div>
                <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
            {churnSignals.slice(0, 5).map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < Math.min(churnSignals.length, 5) - 1 ? `1px solid ${T.divider}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 9, color: T.t4, width: 40, flexShrink: 0 }}>{riskLabel(m.score)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{m.name}</span>
                </div>
                <span style={{ fontSize: 10, color: T.t3 }}>{m.daysSince < 999 ? `${m.daysSince}d ago` : 'No visits'}</span>
              </div>
            ))}
          </div>
          <Cta label="Review members" icon={ChevronRight} full onClick={() => {}} />
        </>
      )}
    </Card>
  );
}

/* ── Heatmap ────────────────────────────────────────────────────── */
function HeatmapChart({ gymId }) {
  const [weeks, setWeeks] = useState(4);
  // In production: replace with useQuery from base44
  const raw = [];

  const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const slots = [
    { label:'6–8a',  hours:[6,7] }, { label:'8–10a', hours:[8,9] },
    { label:'10–12', hours:[10,11] }, { label:'12–2p', hours:[12,13] },
    { label:'2–4p',  hours:[14,15] }, { label:'4–6p',  hours:[16,17] },
    { label:'6–8p',  hours:[18,19] }, { label:'8–10p', hours:[20,21] },
  ];
  const grid = useMemo(() => {
    const mat = Array.from({ length: 7 }, () => Array(slots.length).fill(0));
    raw.forEach(c => {
      const d = new Date(c.check_in_date), dow = (d.getDay() + 6) % 7, h = d.getHours();
      const si = slots.findIndex(s => s.hours.includes(h));
      if (si >= 0) mat[dow][si]++;
    });
    return mat;
  }, [raw]);

  const maxVal = Math.max(...grid.flat(), 1);
  let peakDay = 0, peakSlot = 0;
  grid.forEach((row, di) => row.forEach((val, si) => { if (val > grid[peakDay][peakSlot]) { peakDay = di; peakSlot = si; } }));

  const cell = (val, di, si) => {
    const pct = val / maxVal, isPeak = di === peakDay && si === peakSlot && val > 0;
    if (!val)   return { bg: T.divider, brd: T.border };
    if (isPeak) return { bg: T.accent,  brd: T.accent };
    if (pct < 0.25) return { bg: `${T.accent}14`, brd: `${T.accent}22` };
    if (pct < 0.5)  return { bg: `${T.accent}30`, brd: `${T.accent}44` };
    if (pct < 0.75) return { bg: `${T.accent}60`, brd: `${T.accent}80` };
    return                { bg: `${T.accent}cc`, brd: T.accent };
  };

  return (
    <div>
      {raw.length > 20 && (
        <div style={{ fontSize: 10, color: T.t2, marginBottom: 10 }}>
          Peak: <span style={{ color: T.t1, fontWeight: 600 }}>{days[peakDay]} {slots[peakSlot]?.label}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
        {[{ l:'4W',v:4 },{ l:'12W',v:12 },{ l:'All',v:0 }].map(o => (
          <button key={o.v} onClick={() => setWeeks(o.v)} style={{ fontSize: 10, fontWeight: weeks === o.v ? 600 : 400, padding: '3px 9px', borderRadius: T.rsm, cursor: 'pointer', fontFamily: F, background: weeks === o.v ? T.surfaceEl : 'transparent', color: weeks === o.v ? T.t1 : T.t3, border: `1px solid ${weeks === o.v ? T.borderEl : 'transparent'}` }}>{o.l}</button>
        ))}
        <span style={{ fontSize: 10, color: T.t3, marginLeft: 6, alignSelf: 'center' }}>{raw.length.toLocaleString()} check-ins</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length}, 1fr)`, gap: 3, marginBottom: 3 }}>
        <div />
        {slots.map(s => <div key={s.label} style={{ fontSize: 9, color: T.t3, textAlign: 'center' }}>{s.label}</div>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {days.map((day, di) => (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length}, 1fr)`, gap: 3, alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: T.t2 }}>{day}</div>
            {grid[di].map((val, si) => {
              const { bg, brd } = cell(val, di, si);
              return (
                <div key={si} title={val > 0 ? `${day} ${slots[si]?.label}: ${val}` : undefined} style={{ height: 26, borderRadius: T.rsm, background: bg, border: `1px solid ${brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {val > 0 && <span style={{ fontSize: 9, fontWeight: 600, color: bg === T.accent ? '#fff' : T.t2 }}>{val}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 10 }}>
        <span style={{ fontSize: 9, color: T.t3 }}>Low</span>
        {[T.divider, `${T.accent}14`, `${T.accent}40`, `${T.accent}80`, T.accent].map((bg, i) => (
          <div key={i} style={{ width: 10, height: 6, borderRadius: 2, background: bg }} />
        ))}
        <span style={{ fontSize: 9, color: T.t3 }}>High</span>
      </div>
    </div>
  );
}

/* ── Retention Funnel ───────────────────────────────────────────── */
function RetentionFunnel({ retentionFunnel = [] }) {
  const icons   = [UserPlus, RefreshCw, Activity, CheckCircle];
  const hasData = retentionFunnel.length > 0 && retentionFunnel[0]?.val > 0;
  const worstDrop = useMemo(() => {
    if (!hasData) return null;
    let worst = null, worstPct = 0;
    retentionFunnel.forEach((stage, i) => {
      if (i === 0) return;
      const drop = 100 - (retentionFunnel[i-1].val > 0 ? Math.round((stage.val / retentionFunnel[i-1].val) * 100) : 100);
      if (drop > worstPct) { worstPct = drop; worst = { label: stage.label, drop }; }
    });
    return worst;
  }, [retentionFunnel, hasData]);

  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Retention Funnel" sub={worstDrop ? `Biggest drop-off: ${worstDrop.label} (${worstDrop.drop}% lost)` : 'Member lifecycle progression'} right={<Target size={12} color={T.t3} />} />
      {!hasData ? (
        <div style={{ padding: '10px 12px', borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.t3 }}>Populates after members have joined and checked in.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {retentionFunnel.map((stage, i) => {
            const Icon  = icons[i] || CheckCircle;
            const pct   = retentionFunnel[0].val > 0 ? Math.round((stage.val / retentionFunnel[0].val) * 100) : 0;
            const conv  = i > 0 && retentionFunnel[i-1].val > 0 ? Math.round((stage.val / retentionFunnel[i-1].val) * 100) : null;
            const isWorst = conv !== null && worstDrop?.label === stage.label;
            return (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0' }}>
                  <div style={{ width: 28, height: 28, borderRadius: T.rsm, flexShrink: 0, background: T.surfaceEl, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={11} color={T.t3} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{stage.label}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.t1, letterSpacing: '-0.03em' }}>{stage.val}</span>
                        <span style={{ fontSize: 10, color: T.t3 }}>{pct}%</span>
                      </div>
                    </div>
                    {stage.desc && <div style={{ fontSize: 10, color: T.t3, marginTop: 1 }}>{stage.desc}</div>}
                  </div>
                </div>
                {i < retentionFunnel.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingLeft: 42, marginBottom: 2 }}>
                    <div style={{ width: 1, height: 11, background: T.border }} />
                    {conv !== null && (
                      <span style={{ fontSize: 9, color: isWorst ? T.amber : T.t3, fontWeight: isWorst ? 500 : 400 }}>
                        {conv}% continued · {100 - conv}% dropped{isWorst ? ' ← biggest gap' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ── Drop-off Chart ─────────────────────────────────────────────── */
function DropOffChart({ dropOffBuckets = [] }) {
  const total  = dropOffBuckets.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;
  const worst = [...dropOffBuckets].sort((a, b) => b.count - a.count)[0];
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Drop-off Pattern" sub={`Most members go quiet at ${worst?.label || '—'} — a well-timed message recovers ~30%`} />
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={dropOffBuckets} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barSize={22}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={{ stroke: T.border }} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={22} allowDecimals={false} />
          <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,.02)' }} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {dropOffBuckets.map((d, i) => (
              <Cell key={i} fill={d.label === worst?.label ? T.accent : `${T.accent}40`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' }}>
        {dropOffBuckets.filter(d => d.count > 0).sort((a, b) => b.count - a.count).map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < dropOffBuckets.filter(x => x.count > 0).length - 1 ? `1px solid ${T.divider}` : 'none' }}>
            <span style={{ flex: 1, fontSize: 11, color: i === 0 ? T.t1 : T.t2, fontWeight: i === 0 ? 600 : 400 }}>{d.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: i === 0 ? T.accent : T.t3 }}>{d.count}</span>
            <span style={{ fontSize: 10, color: T.t3, minWidth: 28, textAlign: 'right' }}>{Math.round((d.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Weekly Trend & Member Growth ───────────────────────────────── */
function WeeklyTrendChart({ weekTrend = [], monthChangePct = 0 }) {
  if (!weekTrend.some(d => d.value > 0)) return null;
  const total = weekTrend.reduce((s, d) => s + d.value, 0);
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Check-in Trend" sub="12-week rolling view" right={
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 10, color: T.t3 }}>{total} total</span>
          {monthChangePct !== 0 && (
            <span style={{ fontSize: 10, fontWeight: 500, color: monthChangePct > 0 ? T.green : T.red }}>
              {monthChangePct > 0 ? '+' : ''}{monthChangePct}%
            </span>
          )}
        </div>
      } />
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={weekTrend} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <AreaGrad id="wtg" />
          <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={{ stroke: T.border }} tickLine={false} interval={2} />
          <YAxis tick={tick} axisLine={{ stroke: T.border }} tickLine={false} width={26} allowDecimals={false} />
          <Tooltip content={<ChartTip />} cursor={{ stroke: `${T.accent}18`, strokeWidth: 1 }} />
          <Area type="monotone" dataKey="value" stroke={T.accent} strokeWidth={1.5} fill="url(#wtg)" dot={false} activeDot={{ r: 3, fill: T.accent, stroke: T.surface, strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function MemberGrowthChart({ monthGrowthData = [], newSignUps = 0 }) {
  if (!monthGrowthData?.length) return null;
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Member Growth" sub="Monthly sign-ups" right={
        newSignUps > 0 && (
          <span style={{ fontSize: 10, fontWeight: 500, color: T.green, background: T.greenDim, border: `1px solid ${T.greenBrd}`, borderRadius: T.rsm, padding: '2px 7px' }}>
            +{newSignUps} this month
          </span>
        )
      } />
      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={monthGrowthData} barSize={14} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={{ stroke: T.border }} tickLine={false} />
          <YAxis tick={tick} axisLine={{ stroke: T.border }} tickLine={false} width={26} allowDecimals={false} />
          <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,.02)' }} />
          <Bar dataKey="value" fill={T.accent} fillOpacity={0.65} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ── Class Performance ──────────────────────────────────────────── */
function ClassPerformance({ classes, ci30, now }) {
  const data = useMemo(() => (classes || []).map(cls => {
    const clsCI    = ci30.filter(c => c.class_id === cls.id || c.class_name === cls.name);
    const cap      = cls.max_capacity || cls.capacity || 20;
    const sessions = Math.max(4, Math.ceil(clsCI.length / Math.max(cap * 0.5, 1)));
    const avgAtt   = sessions > 0 ? Math.round(clsCI.length / sessions) : 0;
    const fillRate = Math.min(100, Math.round((avgAtt / cap) * 100));
    const first15  = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return (c.class_id === cls.id || c.class_name === cls.name) && d > 15; }).length;
    const last15   = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return (c.class_id === cls.id || c.class_name === cls.name) && d <= 15; }).length;
    const trend    = first15 === 0 ? 0 : Math.round(((last15 - first15) / first15) * 100);
    return { ...cls, avgAtt, fillRate, trend, cap };
  }).sort((a, b) => b.fillRate - a.fillRate), [classes, ci30, now]);

  if (!data.length) return null;
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Class Performance" sub="Fill rates · last 30 days" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {data.map((cls, i) => (
          <div key={cls.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < data.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: cls.fillRate < 35 ? T.red : T.t4, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{cls.name}</span>
              {cls.trend !== 0 && <span style={{ fontSize: 9, color: cls.trend > 0 ? T.green : T.t3 }}>{cls.trend > 0 ? '+' : ''}{cls.trend}%</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: T.t3 }}>~{cls.avgAtt}/{cls.cap}</span>
              <div style={{ width: 44, display: 'flex', alignItems: 'center' }}><ThinBar pct={cls.fillRate} color={cls.fillRate < 35 ? T.red : T.t3} /></div>
              <span style={{ fontSize: 12, fontWeight: 600, color: cls.fillRate < 35 ? T.red : T.t2, minWidth: 32, textAlign: 'right' }}>{cls.fillRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Staff Performance ──────────────────────────────────────────── */
function StaffPerformance({ coaches, checkIns, ci30, classes, now }) {
  const data = useMemo(() => (coaches || []).map(coach => {
    const coachCI       = ci30.filter(c => c.coach_id === coach.id || c.coach_name === coach.name);
    const uniqueMembers = new Set(coachCI.map(c => c.user_id)).size;
    const coachedIds    = new Set(coachCI.map(c => c.user_id));
    const retained      = [...coachedIds].filter(id => {
      const last = checkIns.filter(c => c.user_id === id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      return last && differenceInDays(now, new Date(last.check_in_date)) <= 14;
    }).length;
    const retentionPct = coachedIds.size > 0 ? Math.round((retained / coachedIds.size) * 100) : 0;
    const myClasses    = (classes || []).filter(c => c.instructor === coach.name || c.coach_id === coach.id);
    const score        = Math.min(100, Math.round((retentionPct * 0.5) + (Math.min(uniqueMembers / 20, 1) * 100 * 0.3) + (Math.min(myClasses.length / 5, 1) * 100 * 0.2)));
    return { ...coach, uniqueMembers, retentionPct, myClasses, score };
  }).sort((a, b) => b.score - a.score), [coaches, checkIns, ci30, classes, now]);

  if (!data.length) return null;
  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Staff Performance" sub="Members coached · retention · engagement score" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 52px 52px', gap: 8, padding: '0 0 7px', borderBottom: `1px solid ${T.divider}`, marginBottom: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: T.t3, textTransform: 'uppercase', letterSpacing: '.08em' }}>Coach</span>
        {['Members','Classes','Retain'].map(h => (
          <span key={h} style={{ fontSize: 9, fontWeight: 600, color: T.t3, textTransform: 'uppercase', letterSpacing: '.08em', textAlign: 'center' }}>{h}</span>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.map((coach, i) => (
          <div key={coach.id || i} style={{ padding: '9px 10px', borderRadius: T.rsm, background: i === 0 ? T.surfaceEl : 'transparent', border: `1px solid ${i === 0 ? T.borderEl : 'transparent'}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 52px 52px', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: T.surfaceEl, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: T.t2, overflow: 'hidden' }}>
                  {coach.avatar_url ? <img src={coach.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(coach.name)}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{coach.name}</div>
                  <div style={{ fontSize: 9, color: T.t3, marginTop: 1 }}>Score {coach.score}</div>
                </div>
              </div>
              {[coach.uniqueMembers, coach.myClasses.length].map((v, j) => (
                <div key={j} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.t1 }}>{v}</div>
              ))}
              <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: coach.retentionPct < 45 ? T.red : T.t1 }}>{coach.retentionPct}%</div>
            </div>
            <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: T.t3 }}>Score</span>
              <ThinBar pct={coach.score} color={T.accent} height={2} />
              <span style={{ fontSize: 9, fontWeight: 500, color: T.t2 }}>{coach.score}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Member Segments ────────────────────────────────────────────── */
function MemberSegments({ totalMembers, superActive, active, casual, inactive }) {
  const segs = [
    { label:'Super active', sub:'15+/mo', val:superActive, color:T.t2 },
    { label:'Active',       sub:'8–14',   val:active,      color:T.t2 },
    { label:'Casual',       sub:'1–7',    val:casual,      color:T.t3 },
    { label:'Disengaged',   sub:'0 visits',val:inactive,   color: inactive > totalMembers * 0.25 ? T.red : T.t4 },
  ];
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Member Segments" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {segs.map((s, i) => {
          const pct = totalMembers > 0 ? Math.round((s.val / totalMembers) * 100) : 0;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < segs.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: T.t2 }}>{s.label}</span>
                <span style={{ fontSize: 10, color: T.t3 }}>{s.sub}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>{s.val}</span>
                <span style={{ fontSize: 10, color: T.t3, minWidth: 26, textAlign: 'right' }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Action Queue ───────────────────────────────────────────────── */
function ActionQueue({ churnSignals = [], atRisk = 0, newSignUps = 0, ci30 = [], now, retentionRate = 0 }) {
  const actions = useMemo(() => {
    const list = [];
    if (churnSignals.length > 0) {
      list.push({ icon: Send, title: `Message ${churnSignals.length} quiet members`, impact: `Save ~£${churnSignals.length * MVM}/month`, cta: 'Message all' });
    } else if (atRisk > 0) {
      list.push({ icon: Send, title: `Reach out to ${atRisk} inactive members`, impact: 'Personal messages recover 30–40%', cta: 'Message now' });
    }
    const newInactive = Math.max(0, newSignUps - new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).map(c => c.user_id)).size);
    if (newInactive > 0) {
      list.push({ icon: UserPlus, title: `Welcome ${newInactive} new members`, impact: 'Week-1 contact doubles month-1 retention', cta: 'Send welcome' });
    }
    if (retentionRate < 65) {
      list.push({ icon: Target, title: 'Fix onboarding flow', impact: `Retention at ${retentionRate}% — target is 70%+`, cta: 'Review funnel' });
    }
    return list.slice(0, 3);
  }, [churnSignals, atRisk, newSignUps, ci30, now, retentionRate]);

  if (!actions.length) return null;
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Zap size={11} color={T.t3} />
        <span style={{ fontSize: 12, fontWeight: 600, color: T.t2 }}>Action Queue</span>
        <span style={{ fontSize: 10, color: T.t4, marginLeft: 'auto' }}>{actions.length} item{actions.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {actions.map((a, i) => (
          <div key={i} style={{ padding: '12px 14px', borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.border}`, borderLeft: i === 0 ? `2px solid ${T.accent}` : `2px solid transparent` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 10 }}>
              <a.icon size={11} color={i === 0 ? T.accent : T.t3} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.t1, marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontSize: 10, color: T.t3, lineHeight: 1.45 }}>{a.impact}</div>
              </div>
            </div>
            <Cta label={a.cta} full onClick={() => {}} />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Sidebar cards ──────────────────────────────────────────────── */
function Week1ReturnCard({ week1ReturnTrend = [] }) {
  const latest = week1ReturnTrend[week1ReturnTrend.length - 1]?.pct || 0;
  const prev   = week1ReturnTrend[week1ReturnTrend.length - 2]?.pct || 0;
  const delta  = latest - prev;
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Week-1 Return Rate" sub="New member cohort" right={
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: latest < 40 ? T.red : T.t1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{latest}%</span>
          {delta !== 0 && <span style={{ fontSize: 9, fontWeight: 500, color: delta > 0 ? T.green : T.red }}>{delta > 0 ? '+' : ''}{delta}%</span>}
        </div>
      } />
      {week1ReturnTrend.length >= 2 && (
        <ResponsiveContainer width="100%" height={44}>
          <AreaChart data={week1ReturnTrend} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="w1g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={T.accent} stopOpacity={0.12} />
                <stop offset="100%" stopColor={T.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="pct" stroke={T.accent} strokeWidth={1.5} fill="url(#w1g)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
      <div style={{ marginTop: 8, fontSize: 10, color: latest < 40 ? T.red : T.t3, lineHeight: 1.45 }}>
        {latest < 40 ? 'Below target — follow up with new members in week 1' : latest < 60 ? 'Room to improve — a personal welcome message helps' : 'Strong week-1 return'}
      </div>
    </Card>
  );
}

function MilestoneCard({ checkIns }) {
  const milestones = useMemo(() => {
    const acc = {};
    checkIns.forEach(c => { if (!acc[c.user_name]) acc[c.user_name] = 0; acc[c.user_name]++; });
    return Object.entries(acc).map(([name, total]) => {
      const next = [10, 25, 50, 100, 200, 500].find(n => n > total) || null;
      return { name, total, next, toNext: next ? next - total : 0 };
    }).filter(m => m.next && m.toNext <= 5).sort((a, b) => a.toNext - b.toNext).slice(0, 4);
  }, [checkIns]);

  if (!milestones.length) return null;
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Award size={11} color={T.t3} />
        <span style={{ fontSize: 12, fontWeight: 600, color: T.t2 }}>Upcoming Milestones</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {milestones.map((m, i) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < milestones.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: T.rsm, flexShrink: 0, background: T.surfaceEl, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: T.t2 }}>{m.total}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
              <div style={{ fontSize: 9, color: m.toNext === 1 ? T.accent : T.t3, marginTop: 1 }}>{m.toNext === 1 ? `1 visit to ${m.next}` : `${m.toNext} to ${m.next}`}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RankedList({ title, icon: Icon, items, emptyLabel }) {
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title={title} right={<Icon size={11} color={T.t3} />} />
      {items.every(d => !d.count)
        ? <Empty icon={Icon} label={emptyLabel || 'No data yet'} />
        : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((h, i) => (
              <div key={h.label || h.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < items.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 9, color: T.t4, width: 13, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
                  <span style={{ fontSize: 12, color: T.t1 }}>{h.label || h.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.t2 }}>{h.count}</span>
              </div>
            ))}
          </div>
        )
      }
    </Card>
  );
}

function MonthCompare({ ci30, ciPrev30, retentionRate, atRisk }) {
  const thisActive = useMemo(() => new Set(ci30.map(c => c.user_id)).size, [ci30]);
  const prevActive = useMemo(() => ciPrev30?.length ? new Set(ciPrev30.map(c => c.user_id)).size : null, [ciPrev30]);
  const rows = [
    { label: 'Check-ins',      curr: ci30.length, prev: ciPrev30?.length || 0 },
    { label: 'Active members', curr: thisActive,   prev: prevActive },
    { label: 'Retention',      curr: `${retentionRate}%`, prev: null, valueColor: retentionRate < 60 ? T.amber : T.t1 },
    { label: 'Low engagement', curr: atRisk, prev: null },
  ];
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Month Comparison" sub="This vs last month" />
      {rows.map((r, i) => {
        const diff = r.prev !== null && typeof r.curr === 'number' ? r.curr - r.prev : null;
        const up = diff > 0;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < rows.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
            <span style={{ fontSize: 12, color: T.t2 }}>{r.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {diff !== null && diff !== 0 && (
                <span style={{ fontSize: 9, fontWeight: 500, color: up ? T.green : T.red }}>{up ? '+' : ''}{diff}</span>
              )}
              <span style={{ fontSize: 13, fontWeight: 600, color: r.valueColor || T.t1 }}>{r.curr}</span>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════════════════════════════════ */
export default function TabAnalytics({
  checkIns = [], ci30 = [], ciPrev30 = [], totalMembers = 0, monthCiPer = [],
  monthChangePct = 0, monthGrowthData = [], retentionRate = 0, activeThisMonth = 0,
  newSignUps = 0, atRisk = 0, gymId,
  allMemberships = [], classes = [], coaches = [], avatarMap = {},
  isCoach = false,
  weekTrend: weekTrendProp = [], peakHours: peakHoursProp = [], busiestDays: busiestDaysProp = [],
  retentionFunnel: retentionFunnelProp = [], dropOffBuckets: dropOffBucketsProp = [],
  churnSignals: churnSignalsProp = [], week1ReturnTrend: week1ReturnTrendProp = [],
  engagementSegments = {},
  openModal = () => {},
}) {
  const now = new Date();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn);
  }, []);

  const weekTrend   = weekTrendProp.length   > 0 ? weekTrendProp   : [];
  const busiestDays = busiestDaysProp.length > 0 ? busiestDaysProp : [];
  const peakHours   = peakHoursProp.length   > 0 ? peakHoursProp   : [];

  const superActive = engagementSegments.superActive ?? (monthCiPer || []).filter(v => v >= 15).length;
  const active      = engagementSegments.active      ?? (monthCiPer || []).filter(v => v >= 8 && v < 15).length;
  const casual      = engagementSegments.casual      ?? (monthCiPer || []).filter(v => v >= 1 && v < 8).length;
  const inactive    = engagementSegments.inactive    ?? Math.max(0, totalMembers - (monthCiPer || []).length);

  const sharedStyles = (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; }
      @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
    `}</style>
  );

  /* ── Coach view ── */
  if (isCoach) {
    const classWeeklyTrend = Array.from({ length: 8 }, (_, i) => {
      const s = subDays(now, (7 - i) * 7), e = subDays(now, (6 - i) * 7);
      return { label: format(s, 'MMM d'), value: checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: s, end: e })).length };
    });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: F, color: T.t1 }}>
        {sharedStyles}

        {/* ── Page header ── */}
        <PageHeader
          title="Analytics"
          sub="Class attendance · member engagement · your performance at a glance"
          icon={BarChart2}
          buttons={<>
            <GhostBtn label="Export" icon={Activity} onClick={() => {}} />
            <Cta label="Message members" icon={Send} onClick={() => openModal('message')} />
          </>}
        />

        <TodaysFocus churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps} ci30={ci30} now={now} totalMembers={totalMembers} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 264px', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <KpiStrip totalMembers={totalMembers} activeThisMonth={activeThisMonth} atRisk={atRisk} retentionRate={retentionRate} monthChangePct={monthChangePct} ci30={ci30} now={now} />
            <Card style={{ padding: 20 }}>
              <CardHead title="Class Attendance Trend" sub="8-week view" />
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={classWeeklyTrend} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <AreaGrad id="cag" />
                  <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
                  <XAxis dataKey="label" tick={tick} axisLine={{ stroke: T.border }} tickLine={false} interval={1} />
                  <YAxis tick={tick} axisLine={{ stroke: T.border }} tickLine={false} width={26} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="value" stroke={T.accent} strokeWidth={1.5} fill="url(#cag)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{ padding: 20 }}>
              <CardHead title="Traffic Heatmap" sub="Check-in density by time and day" />
              <HeatmapChart gymId={gymId} />
            </Card>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 24 }}>
            <ActionQueue churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps} ci30={ci30} now={now} retentionRate={retentionRate} />
            <MemberSegments totalMembers={totalMembers} superActive={superActive} active={active} casual={casual} inactive={inactive} />
            <RankedList title="Busiest Days" icon={Calendar} items={busiestDays.map(d => ({ ...d, label: d.name }))} emptyLabel="No data yet" />
            <RankedList title="Peak Hours"   icon={Clock}    items={peakHours.slice(0, 5)} emptyLabel="No check-in data yet" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Gym owner view ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: F, color: T.t1 }}>
      {sharedStyles}

      {/* ── Page header ── */}
      <PageHeader
        title="Analytics"
        sub="Retention · engagement · revenue — your gym at a glance"
        icon={BarChart2}
        buttons={<>
          <GhostBtn label="Export" icon={Activity} onClick={() => {}} />
          <Cta label="Message at-risk" icon={Send} onClick={() => openModal('message')} />
        </>}
      />

      <TodaysFocus churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps} ci30={ci30} now={now} totalMembers={totalMembers} />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 272px', gap: 18, alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {checkIns.length >= 3 ? (
            <KpiStrip totalMembers={totalMembers} activeThisMonth={activeThisMonth} atRisk={atRisk} retentionRate={retentionRate} monthChangePct={monthChangePct} ci30={ci30} now={now} />
          ) : (
            <Card style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Activity size={13} color={T.t3} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>KPIs loading</div>
                  <div style={{ fontSize: 11, color: T.t3, marginTop: 2, lineHeight: 1.5 }}>Metrics populate after your first 7 days of check-ins.</div>
                </div>
              </div>
            </Card>
          )}
          <ChurnRevenuePanel churnSignals={churnSignalsProp} atRisk={atRisk} totalMembers={totalMembers} />
          <WeeklyTrendChart weekTrend={weekTrend} monthChangePct={monthChangePct} />
          <MemberGrowthChart monthGrowthData={monthGrowthData} newSignUps={newSignUps} />
          <RetentionFunnel retentionFunnel={retentionFunnelProp} />
          <DropOffChart dropOffBuckets={dropOffBucketsProp} />
          <Card style={{ padding: 20 }}>
            <CardHead title="Traffic Heatmap" sub="Check-in density by day and time" />
            <HeatmapChart gymId={gymId} />
          </Card>
          <ClassPerformance classes={classes} ci30={ci30} now={now} />
          <StaffPerformance coaches={coaches} checkIns={checkIns} ci30={ci30} classes={classes} now={now} />
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 24 }}>
          <ActionQueue churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps} ci30={ci30} now={now} retentionRate={retentionRate} />
          <Week1ReturnCard week1ReturnTrend={week1ReturnTrendProp} />
          <MilestoneCard checkIns={checkIns} />
          <MemberSegments totalMembers={totalMembers} superActive={superActive} active={active} casual={casual} inactive={inactive} />
          <MonthCompare ci30={ci30} ciPrev30={ciPrev30} retentionRate={retentionRate} atRisk={atRisk} />
          <RankedList title="Busiest Days" icon={Calendar} items={busiestDays.map(d => ({ ...d, label: d.name }))} emptyLabel="No data yet" />
          <RankedList title="Peak Hours"   icon={Clock}    items={peakHours.slice(0, 5)} emptyLabel="No check-in data" />
        </div>
      </div>
    </div>
  );
}
