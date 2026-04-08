/**
 * TabAnalytics — Gym Operating System (Calm Edition)
 *
 * HIERARCHY RULES:
 *  1. Today's Focus — max 3 cards. ONE can be red. Others are neutral/blue.
 *  2. Core KPIs — clean, scan-friendly. No CTAs. No color on values unless threshold.
 *  3. Churn & Revenue Risk — single combined panel. ONE strong CTA.
 *  4. Trends & Analytics — pure insight. Zero alerts.
 *  5. Behaviour & Performance — subtle. No aggressive badges.
 *  6. Action Queue — ONLY 2–3 items. Each with £ impact.
 *
 * COLOR DISCIPLINE:
 *  - Red (danger) → used at most ONCE per viewport. True urgency only.
 *  - Warn (amber) → at most once per section. "Needs attention" not "at risk".
 *  - Accent (blue) → interactive, CTAs, active states only.
 *  - Green (success) → only when a threshold is crossed positively.
 *  - t1/t2/t3 → everything else. Silence = safety.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, differenceInDays, subDays, isWithinInterval } from 'date-fns';
import {
  Activity, TrendingUp, TrendingDown, Users, Zap, ArrowUpRight,
  Calendar, Clock, AlertTriangle, Shield, Target, Award,
  UserPlus, BarChart2, RefreshCw, CheckCircle,
  Send, ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, BarChart, Bar, Cell,
} from 'recharts';
import { AppButton } from '@/components/ui/AppButton';
import { AppBadge } from '@/components/ui/AppBadge';
import { cn } from '@/lib/utils';

const MVM = 40;
const CARD = 'bg-[#0a0f1e] border border-white/[0.04] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.012)] overflow-hidden relative';
const tick = { fill: '#4b5578', fontSize: 10, fontFamily: 'system-ui, sans-serif' };

/* ─── CHART PRIMITIVES ─── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#060c18] border border-white/[0.07] rounded-[8px] px-[11px] py-[7px] shadow-[0_6px_20px_rgba(0,0,0,0.5)]">
      <p className="text-[#4b5578] text-[10px] m-0 mb-0.5">{label}</p>
      <p className="text-[#eef2ff] font-bold text-sm m-0">{payload[0].value}</p>
    </div>
  );
};

const barTip = ({ active, payload, label }) => active && payload?.length
  ? <div className="bg-[#060c18] border border-white/[0.07] rounded-[8px] px-[11px] py-[7px]">
      <p className="text-[#4b5578] text-[10px] m-0 mb-0.5">{label}</p>
      <p className="text-[#eef2ff] font-bold text-[13px] m-0">{payload[0].value}</p>
    </div>
  : null;

const AreaGrad = ({ id }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.18} />
      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
    </linearGradient>
  </defs>
);

function Spark({ data = [], w = 58, h = 24 }) {
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} />;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 3 - ((v - min) / range) * (h - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const firstX = pts.split(' ')[0].split(',')[0];
  const lastX  = pts.split(' ').slice(-1)[0].split(',')[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block shrink-0" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3b82f6" stopOpacity=".15" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"   />
        </linearGradient>
      </defs>
      <polygon points={`${firstX},${h} ${pts} ${lastX},${h}`} fill="url(#spk)" />
      <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionHead({ title, sub, right }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', sub && 'items-start')}>
      <div>
        <div className="text-xs font-semibold text-[#8b95b3]">{title}</div>
        {sub && <div className="text-[11px] text-[#4b5578] mt-0.5">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/* ─── TODAY'S FOCUS ─── */
function TodaysFocus({ churnSignals = [], atRisk = 0, newSignUps = 0, ci30 = [], now, totalMembers = 0, isMobile = false }) {
  const cards = useMemo(() => {
    const list = [];

    if (churnSignals.length > 0) {
      const weeks3 = churnSignals.filter(m => m.daysSince >= 21).length;
      list.push({
        slot: 'danger', icon: AlertTriangle,
        title: `${churnSignals.length} quiet members`,
        insight: weeks3 > 0
          ? `${weeks3} haven't visited in 3+ weeks — worth a personal message`
          : 'Engagement has dropped — a check-in usually brings half back',
        cta: 'Message now', rev: churnSignals.length * MVM,
      });
    } else if (atRisk > 0) {
      list.push({
        slot: 'danger', icon: AlertTriangle,
        title: `${atRisk} members need attention`,
        insight: 'No check-in in 14+ days — drop-off risk increases after 3 weeks',
        cta: 'Review', rev: atRisk * MVM,
      });
    }

    const activeThisWeek = new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).map(c => c.user_id));
    const newInactive = Math.max(0, newSignUps - activeThisWeek.size);
    if (newInactive > 0) {
      list.push({
        slot: 'neutral', icon: UserPlus,
        title: `${newInactive} new members not active yet`,
        insight: 'First visit within 7 days doubles week-4 retention',
        cta: 'Send welcome',
      });
    }

    const retWeek  = ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).length;
    const prevWeek = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return d > 7 && d <= 14; }).length;
    if (prevWeek > 0 && retWeek >= prevWeek * 1.1) {
      list.push({ slot: 'positive', icon: TrendingUp, title: 'Check-ins up this week', insight: `${retWeek} visits vs ${prevWeek} last week — good momentum`, cta: null });
    } else {
      list.push({ slot: 'neutral', icon: Calendar, title: 'Evening slots have capacity', insight: '6–8pm is typically underused — a targeted post or promotion can fill it', cta: null });
    }

    return list.slice(0, 3);
  }, [churnSignals, atRisk, newSignUps, ci30, now, totalMembers]);

  const slotBorder = { danger: 'border-l-2 border-l-red-500', warn: 'border-l-2 border-l-amber-400', neutral: 'border-l-2 border-l-white/[0.07]', positive: 'border-l-2 border-l-emerald-500' };
  const slotIcon   = { danger: 'text-red-500', warn: 'text-amber-400', neutral: 'text-[#4b5578]', positive: 'text-emerald-500' };

  if (!cards.length) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-[10px]">
        <span className="text-[10.5px] font-bold text-[#4b5578] tracking-[0.12em] uppercase">Today's Focus</span>
        <span className="text-[10px] text-[#252d45]">· {format(new Date(), 'EEE d MMM')}</span>
      </div>
      <div
        className={cn('grid gap-[10px]', isMobile ? 'grid-cols-1' : '')}
        style={isMobile ? undefined : { gridTemplateColumns: `repeat(${cards.length}, 1fr)` }}
      >
        {cards.map((card, i) => (
          <div key={i} className={cn('bg-[#0d1225] rounded-2xl p-[14px_16px] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]', slotBorder[card.slot] || slotBorder.neutral)}>
            <div className={cn('flex items-start gap-[10px]', card.cta && 'mb-3')}>
              <card.icon className={cn('w-[13px] h-[13px] shrink-0 mt-0.5', slotIcon[card.slot] || slotIcon.neutral)} />
              <div>
                <div className="text-[12.5px] font-bold text-[#eef2ff] mb-1">{card.title}</div>
                <div className="text-[11px] text-[#4b5578] leading-relaxed">{card.insight}</div>
                {card.slot === 'danger' && card.rev > 0 && (
                  <div className="text-[10px] text-[#4b5578] mt-[5px]">~£{card.rev}/month if unaddressed</div>
                )}
              </div>
            </div>
            {card.cta && <AppButton variant="primary" size="sm" onClick={() => {}}>{card.cta}</AppButton>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── KPI STRIP ─── */
function KpiStrip({ totalMembers, activeThisMonth, atRisk, retentionRate, monthChangePct, ci30, now, weekTrend }) {
  const active7d = useMemo(() =>
    new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).map(c => c.user_id)).size
  , [ci30, now]);

  const engagePct = totalMembers > 0 ? Math.round((activeThisMonth / totalMembers) * 100) : 0;
  const sparkData = weekTrend.slice(-7).map(d => d.value);

  const kpis = [
    { icon: Users,         label: 'Active members (7d)', value: active7d,           unit: `of ${totalMembers} total`,  spark: sparkData, trend: null,          valueClass: 'text-[#eef2ff]', sub: active7d > 0 ? `${Math.round((active7d / Math.max(totalMembers, 1)) * 100)}% of members` : null },
    { icon: Activity,      label: 'Engagement rate',     value: `${engagePct}%`,    unit: 'active this month',          spark: null,      trend: monthChangePct, valueClass: 'text-[#eef2ff]', sub: monthChangePct > 0 ? 'Growing' : monthChangePct < 0 ? 'Declining' : 'Flat' },
    { icon: Shield,        label: 'Retention rate',      value: `${retentionRate}%`, unit: '30-day cohort',             spark: null,      trend: null,           valueClass: retentionRate >= 80 ? 'text-emerald-500' : retentionRate < 60 ? 'text-red-500' : 'text-[#eef2ff]', sub: retentionRate >= 80 ? 'Strong' : retentionRate < 60 ? 'Needs attention' : 'Average' },
    { icon: AlertTriangle, label: 'Inactive members',    value: atRisk,             unit: '14+ days absent',            spark: null,      trend: null,           valueClass: atRisk > totalMembers * 0.2 ? 'text-red-500' : 'text-[#eef2ff]', sub: atRisk > 0 ? `${Math.round((atRisk / Math.max(totalMembers, 1)) * 100)}% of members` : 'All clear' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px]">
      {kpis.map((k, i) => {
        const trendUp = k.trend > 0, trendDown = k.trend < 0;
        return (
          <div key={i} className={cn(CARD, 'p-[12px_14px] sm:p-[16px_18px] flex flex-col')}>
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1 min-w-0">
              <span className="text-[9.5px] sm:text-[10.5px] font-bold text-[#4b5578] tracking-[0.12em] uppercase truncate">{k.label}</span>
              <k.icon className="w-3 h-3 text-[#4b5578] shrink-0" />
            </div>
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className={cn('text-[22px] sm:text-[28px] font-bold leading-none tracking-[-0.04em]', k.valueClass)}>{k.value}</div>
                {k.unit && <div className="text-[9.5px] sm:text-[10.5px] text-[#4b5578] mt-1">{k.unit}</div>}
              </div>
              {k.spark && <Spark data={k.spark} />}
            </div>
            <div className="flex items-center gap-[7px]">
              {k.trend != null && (
                <span className={cn('inline-flex items-center gap-[3px] px-1.5 py-[2px] rounded-[5px] text-[9.5px] font-semibold border', trendUp ? 'text-emerald-500 bg-emerald-500/[0.08] border-emerald-500/[0.2]' : trendDown ? 'text-red-500 bg-red-500/[0.07] border-red-500/[0.2]' : 'text-[#4b5578] bg-white/[0.04] border-white/[0.04]')}>
                  {trendUp ? <ArrowUpRight className="w-2 h-2" /> : trendDown ? <TrendingDown className="w-2 h-2" /> : null}
                  {trendUp ? '+' : ''}{k.trend}%
                </span>
              )}
              {k.sub && <span className="text-[10px] text-[#4b5578]">{k.sub}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── CHURN & REVENUE PANEL ─── */
function ChurnRevenuePanel({ churnSignals = [], atRisk = 0, totalMembers = 0 }) {
  const churnCount = churnSignals.length;
  const totalRev   = churnCount * MVM;
  const riskLabel  = s => s >= 90 ? 'Critical' : s >= 70 ? 'High' : s >= 50 ? 'Medium' : 'Low';
  const hasData    = churnCount > 0;

  return (
    <div className={cn(CARD, 'p-5')}>
      <div className="flex items-start justify-between mb-[18px]">
        <div>
          <div className="text-xs font-semibold text-[#8b95b3]">Churn & Revenue Risk</div>
          <div className="text-[11px] text-[#4b5578] mt-0.5">Members showing low engagement patterns</div>
        </div>
        {hasData && (
          <div className="text-right">
            <div className="text-[18px] font-bold text-red-500 tracking-[-0.03em] leading-none">£{totalRev}</div>
            <div className="text-[9.5px] text-[#4b5578] mt-0.5">est. monthly exposure</div>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex items-center gap-[9px] px-3 py-[10px] rounded-[8px] bg-[#0d1225] border border-white/[0.04]">
          <CheckCircle className="w-[11px] h-[11px] text-emerald-500 shrink-0" />
          <div>
            <div className="text-xs font-medium text-[#eef2ff]">No churn signals detected</div>
            <div className="text-[10px] text-[#4b5578] mt-0.5">All tracked members showing healthy engagement</div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-[14px]">
            <div className="px-3 py-[10px] rounded-[8px] bg-[#0d1225] border border-white/[0.04]">
              <div className="text-[20px] font-bold text-red-500 tracking-[-0.03em]">{churnCount}</div>
              <div className="text-[10px] text-[#4b5578] mt-0.5">quiet members</div>
            </div>
            <div className="px-3 py-[10px] rounded-[8px] bg-[#0d1225] border border-white/[0.04]">
              <div className="text-[20px] font-bold text-[#eef2ff] tracking-[-0.03em]">
                {totalMembers > 0 ? `${Math.round((churnCount / totalMembers) * 100)}%` : '—'}
              </div>
              <div className="text-[10px] text-[#4b5578] mt-0.5">of membership</div>
            </div>
          </div>

          <div className="flex flex-col gap-px mb-4">
            {churnSignals.slice(0, 5).map((m, i) => (
              <div key={i} className={cn('flex items-center justify-between py-[7px]', i < Math.min(churnSignals.length, 5) - 1 && 'border-b border-white/[0.03]')}>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold text-[#252d45] w-10">{riskLabel(m.score)}</span>
                  <span className="text-xs font-semibold text-[#eef2ff]">{m.name}</span>
                </div>
                <span className="text-[10px] text-[#4b5578]">{m.daysSince < 999 ? `${m.daysSince}d ago` : 'No visits'}</span>
              </div>
            ))}
          </div>

          <AppButton variant="primary" size="sm" className="w-full justify-center" onClick={() => {}}>
            <ChevronRight className="w-[10px] h-[10px]" /> Review members
          </AppButton>
        </>
      )}
    </div>
  );
}

/* ─── HEATMAP ─── */
function HeatmapChart({ gymId }) {
  const [weeks, setWeeks] = React.useState(4);
  const { data: raw = [] } = useQuery({
    queryKey: ['heatmapCI', gymId, weeks],
    queryFn: () => {
      if (weeks === 0) return base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 5000);
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - weeks * 7);
      return base44.entities.CheckIn.filter({ gym_id: gymId, check_in_date: { $gte: cutoff.toISOString() } }, '-check_in_date', 5000);
    },
    enabled: !!gymId, staleTime: 5 * 60 * 1000,
  });

  const days  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slots = [
    { label: '6–8a',  hours: [6,7]   }, { label: '8–10a',  hours: [8,9]   },
    { label: '10–12', hours: [10,11] }, { label: '12–2p',  hours: [12,13] },
    { label: '2–4p',  hours: [14,15] }, { label: '4–6p',   hours: [16,17] },
    { label: '6–8p',  hours: [18,19] }, { label: '8–10p',  hours: [20,21] },
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

  // Cell colors are data-driven hex values — kept as inline styles (legitimate exception)
  const cell = (val, di, si) => {
    const pct = val / maxVal, isPeak = di === peakDay && si === peakSlot && val > 0;
    if (!val)       return { bg: 'rgba(255,255,255,0.03)', brd: 'rgba(255,255,255,0.04)', txt: 'transparent' };
    if (isPeak)     return { bg: '#3b82f6',                brd: '#3b82f6',                txt: '#fff' };
    if (pct < 0.25) return { bg: '#3b82f614',              brd: '#3b82f622',              txt: '#4b5578' };
    if (pct < 0.5)  return { bg: '#3b82f630',              brd: '#3b82f644',              txt: '#8b95b3' };
    if (pct < 0.75) return { bg: '#3b82f660',              brd: '#3b82f680',              txt: '#eef2ff' };
    return               { bg: '#3b82f6cc',              brd: '#3b82f6',                txt: '#fff' };
  };

  const eveningTotal = grid.reduce((s, row) => s + row[6] + row[7], 0);
  const morningTotal = grid.reduce((s, row) => s + row[0] + row[1], 0);
  const eveningNote  = raw.length > 20 && eveningTotal < morningTotal * 0.6;
  const COL = `44px repeat(${slots.length}, 1fr)`;

  return (
    <div>
      {raw.length > 20 && (
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10.5px] text-[#8b95b3]">
            Peak: <span className="text-[#eef2ff] font-semibold">{days[peakDay]} {slots[peakSlot]?.label}</span>
          </span>
          {eveningNote && <span className="text-[10px] text-[#4b5578]">· Evenings have capacity to fill</span>}
        </div>
      )}

      <div className="flex items-center gap-0.5 mb-3">
        {[{ l: '4W', v: 4 }, { l: '12W', v: 12 }, { l: 'All', v: 0 }].map(o => (
          <button key={o.v} onClick={() => setWeeks(o.v)} className={cn('text-[10.5px] px-[10px] py-1 rounded-[5px] cursor-pointer border transition-all', weeks === o.v ? 'font-semibold bg-[#0d1225] text-[#eef2ff] border-white/[0.07]' : 'font-normal bg-transparent text-[#4b5578] border-transparent')}>
            {o.l}
          </button>
        ))}
        <span className="text-[10px] text-[#4b5578] ml-1.5">{raw.length.toLocaleString()} check-ins</span>
      </div>

      <div className="grid gap-[3px] mb-[3px]" style={{ gridTemplateColumns: COL }}>
        <div />
        {slots.map(s => <div key={s.label} className="text-[9px] text-[#4b5578] text-center">{s.label}</div>)}
      </div>

      <div className="flex flex-col gap-[3px]">
        {days.map((day, di) => (
          <div key={day} className="grid gap-[3px] items-center" style={{ gridTemplateColumns: COL }}>
            <div className="text-[11px] text-[#8b95b3]">{day}</div>
            {grid[di].map((val, si) => {
              const { bg, brd, txt } = cell(val, di, si);
              return (
                <div key={si} title={val > 0 ? `${day} ${slots[si].label}: ${val}` : undefined}
                     className="h-7 rounded-[5px] flex items-center justify-center"
                     style={{ background: bg, border: `1px solid ${brd}` }}>
                  {val > 0 && <span className="text-[9px] font-semibold" style={{ color: txt }}>{val}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1 mt-[10px]">
        <span className="text-[9px] text-[#4b5578]">Low</span>
        {['rgba(255,255,255,0.03)', '#3b82f614', '#3b82f640', '#3b82f680', '#3b82f6'].map((bg, i) => (
          <div key={i} className="w-[11px] h-[6px] rounded-[2px]" style={{ background: bg }} />
        ))}
        <span className="text-[9px] text-[#4b5578]">High</span>
      </div>
    </div>
  );
}

/* ─── RETENTION FUNNEL ─── */
function RetentionFunnel({ retentionFunnel = [] }) {
  const icons   = [UserPlus, RefreshCw, Activity, CheckCircle];
  const hasData = retentionFunnel.length > 0 && retentionFunnel[0]?.val > 0;

  const worstDrop = useMemo(() => {
    if (!hasData) return null;
    let worst = null, worstPct = 0;
    retentionFunnel.forEach((stage, i) => {
      if (i === 0) return;
      const conv = retentionFunnel[i-1].val > 0 ? Math.round((stage.val / retentionFunnel[i-1].val) * 100) : 100;
      const drop = 100 - conv;
      if (drop > worstPct) { worstPct = drop; worst = { label: stage.label, drop }; }
    });
    return worst;
  }, [retentionFunnel, hasData]);

  return (
    <div className={cn(CARD, 'p-5')}>
      <SectionHead title="Retention Funnel" sub={worstDrop ? `Biggest drop-off: ${worstDrop.label} (${worstDrop.drop}% lost)` : 'Member lifecycle progression'} right={<Target className="w-3 h-3 text-[#4b5578]" />} />
      {!hasData ? (
        <div className="px-3 py-[10px] rounded-[8px] bg-[#0d1225] border border-white/[0.04]">
          <div className="text-[11px] text-[#4b5578]">Populates after members have joined and checked in.</div>
        </div>
      ) : (
        <div className="flex flex-col">
          {retentionFunnel.map((stage, i) => {
            const Icon    = icons[i] || CheckCircle;
            const pct     = retentionFunnel[0].val > 0 ? Math.round((stage.val / retentionFunnel[0].val) * 100) : 0;
            const conv    = i > 0 && retentionFunnel[i-1].val > 0 ? Math.round((stage.val / retentionFunnel[i-1].val) * 100) : null;
            const isWorst = conv !== null && worstDrop?.label === stage.label;
            return (
              <div key={i}>
                <div className="flex items-center gap-[10px] py-[9px]">
                  <div className="w-7 h-7 rounded-[7px] shrink-0 bg-[#0d1225] border border-white/[0.04] flex items-center justify-center">
                    <Icon className="w-[11px] h-[11px] text-[#4b5578]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#eef2ff]">{stage.label}</span>
                      <div className="flex items-baseline gap-[5px]">
                        <span className="text-[15px] font-bold text-[#eef2ff] tracking-[-0.03em]">{stage.val}</span>
                        <span className="text-[10px] text-[#4b5578]">{pct}%</span>
                      </div>
                    </div>
                    {stage.desc && <div className="text-[10px] text-[#4b5578] mt-0.5">{stage.desc}</div>}
                  </div>
                </div>
                {i < retentionFunnel.length - 1 && (
                  <div className="flex items-center gap-2 pl-[42px] mb-0.5">
                    <div className="w-px h-3 bg-white/[0.04]" />
                    {conv !== null && (
                      <span className={cn('text-[9px]', isWorst ? 'text-amber-400 font-semibold' : 'text-[#4b5578]')}>
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
    </div>
  );
}

/* ─── DROP-OFF CHART ─── */
function DropOffChart({ dropOffBuckets = [] }) {
  const total = dropOffBuckets.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;
  const worst = [...dropOffBuckets].sort((a, b) => b.count - a.count)[0];

  return (
    <div className={cn(CARD, 'p-5')}>
      <SectionHead title="Drop-off Pattern" sub={`Most members go quiet at ${worst?.label || '—'} — a well-timed message recovers ~30%`} />
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={dropOffBuckets} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barSize={22}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={22} allowDecimals={false} />
          <Tooltip content={barTip} cursor={{ fill: 'rgba(255,255,255,.02)' }} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {dropOffBuckets.map((d, i) => <Cell key={i} fill={d.label === worst?.label ? '#3b82f6' : '#3b82f650'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-[10px] flex flex-col gap-1">
        {dropOffBuckets.filter(d => d.count > 0).sort((a, b) => b.count - a.count).map((d, i, arr) => (
          <div key={i} className={cn('flex items-center gap-2 py-[5px]', i < arr.length - 1 && 'border-b border-white/[0.03]')}>
            <span className={cn('flex-1 text-[11px]', i === 0 ? 'text-[#eef2ff] font-semibold' : 'text-[#8b95b3]')}>{d.label}</span>
            <span className={cn('text-[11px] font-semibold', i === 0 ? 'text-blue-500' : 'text-[#4b5578]')}>{d.count}</span>
            <span className="text-[10px] text-[#4b5578] min-w-[28px] text-right">{Math.round((d.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── WEEKLY TREND ─── */
function WeeklyTrendChart({ weekTrend = [], monthChangePct = 0 }) {
  if (!weekTrend.some(d => d.value > 0)) return null;
  return (
    <div className={cn(CARD, 'p-5')}>
      <SectionHead title="Check-in Trend" sub="12-week rolling view" right={
        <div className="flex items-center gap-1.5">
          <AppBadge variant="neutral">{weekTrend.reduce((s,d) => s+d.value, 0)} total</AppBadge>
          {monthChangePct !== 0 && (
            <span className={cn('text-[10px] font-semibold', monthChangePct > 0 ? 'text-emerald-500' : 'text-red-500')}>
              {monthChangePct > 0 ? '+' : ''}{monthChangePct}% vs last month
            </span>
          )}
        </div>
      } />
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={weekTrend} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <AreaGrad id="wtg" />
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} interval={2} />
          <YAxis tick={tick} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} width={26} allowDecimals={false} />
          <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(59,130,246,0.18)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={1.5} fill="url(#wtg)" dot={false} activeDot={{ r: 3, fill: '#3b82f6', stroke: '#0a0f1e', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── MEMBER GROWTH ─── */
function MemberGrowthChart({ monthGrowthData = [], newSignUps = 0 }) {
  if (!monthGrowthData?.length) return null;
  return (
    <div className={cn(CARD, 'p-5')}>
      <SectionHead title="Member Growth" sub="Monthly sign-ups" right={<AppBadge variant="success">+{newSignUps} this month</AppBadge>} />
      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={monthGrowthData} barSize={14} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} />
          <YAxis tick={tick} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} width={26} allowDecimals={false} />
          <Tooltip content={barTip} cursor={{ fill: 'rgba(255,255,255,.02)' }} />
          <Bar dataKey="value" fill="#3b82f6" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── CLASS PERFORMANCE ─── */
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

  const fillText = r => r >= 75 ? 'text-emerald-500' : r < 35 ? 'text-red-500' : 'text-[#8b95b3]';
  const dotCls   = r => r >= 75 ? 'bg-emerald-500'   : r < 35 ? 'bg-red-500'   : 'bg-[#8b95b3]';

  return (
    <div className={cn(CARD, 'p-5')}>
      <SectionHead title="Class Performance" sub="Fill rates and attendance · last 30 days" />
      <div className="flex flex-col">
        {data.map((cls, i) => (
          <div key={cls.id || i} className={cn('flex items-center justify-between py-2', i < data.length - 1 && 'border-b border-white/[0.03]')}>
            <div className="flex items-center gap-2">
              <div className={cn('w-1 h-1 rounded-full shrink-0', dotCls(cls.fillRate))} />
              <span className="text-xs font-semibold text-[#eef2ff]">{cls.name}</span>
              {cls.trend !== 0 && <span className={cn('text-[9px] font-semibold', cls.trend > 0 ? 'text-emerald-500' : 'text-[#4b5578]')}>{cls.trend > 0 ? '+' : ''}{cls.trend}%</span>}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-[#4b5578]">~{cls.avgAtt}/{cls.cap}</span>
              <span className={cn('text-xs font-bold', fillText(cls.fillRate))}>{cls.fillRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── STAFF PERFORMANCE ─── */
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

  const ini      = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const retClass = s => s >= 70 ? 'text-emerald-500' : s < 45 ? 'text-red-500' : 'text-[#8b95b3]';

  return (
    <div className={cn(CARD, 'p-5')}>
      <SectionHead title="Staff Performance" sub="Engagement score, members coached and retention" />
      <div className="grid gap-2 pb-1.5 border-b border-white/[0.03] mb-1.5" style={{ gridTemplateColumns: '1fr 52px 52px 52px' }}>
        <div className="text-[9px] font-semibold text-[#4b5578] uppercase tracking-[0.08em]">Coach</div>
        {['Members','Classes','Retain'].map(h => <div key={h} className="text-[9px] font-semibold text-[#4b5578] uppercase tracking-[0.08em] text-center">{h}</div>)}
      </div>
      <div className="flex flex-col gap-0.5">
        {data.map((coach, i) => (
          <div key={coach.id || i} className={cn('px-[10px] py-[9px] rounded-[8px] border', i === 0 ? 'bg-[#0d1225] border-white/[0.07]' : 'bg-transparent border-transparent')}>
            <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 52px 52px 52px' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full shrink-0 bg-[#0d1225] border border-white/[0.04] flex items-center justify-center text-[9.5px] font-bold text-[#8b95b3] overflow-hidden">
                  {coach.avatar_url ? <img src={coach.avatar_url} alt="" className="w-full h-full object-cover" /> : ini(coach.name)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#eef2ff]">{coach.name}</div>
                  <div className="text-[9px] text-[#4b5578] mt-px">Score {coach.score}</div>
                </div>
              </div>
              {[coach.uniqueMembers, coach.myClasses.length].map((v, j) => (
                <div key={j} className="text-center text-[13px] font-bold text-[#eef2ff]">{v}</div>
              ))}
              <div className={cn('text-center text-[13px] font-bold', retClass(coach.retentionPct))}>{coach.retentionPct}%</div>
            </div>
            <div className="mt-[7px] flex items-center gap-1.5">
              <span className="text-[9px] text-[#4b5578]">Score</span>
              <div className="flex-1 h-[2px] rounded-[2px] bg-white/[0.03]">
                <div className={cn('h-full rounded-[2px] opacity-65', coach.score < 45 ? 'bg-red-500' : 'bg-blue-500')} style={{ width: `${coach.score}%` }} />
              </div>
              <span className={cn('text-[9.5px] font-semibold', coach.score < 45 ? 'text-red-500' : 'text-[#8b95b3]')}>{coach.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MEMBER SEGMENTS ─── */
function MemberSegments({ totalMembers, superActive, active, casual, inactive }) {
  const segs = [
    { label: 'Super active', sub: '15+/mo',   val: superActive, dotClass: 'bg-emerald-500' },
    { label: 'Active',       sub: '8–14',     val: active,      dotClass: 'bg-blue-500'    },
    { label: 'Casual',       sub: '1–7',      val: casual,      dotClass: 'bg-[#4b5578]'   },
    { label: 'Disengaged',   sub: '0 visits', val: inactive,    dotClass: inactive > totalMembers * 0.25 ? 'bg-red-500' : 'bg-[#4b5578]' },
  ];
  return (
    <div className={cn(CARD, 'p-5')}>
      <SectionHead title="Member Segments" />
      <div className="flex flex-col">
        {segs.map((s, i) => {
          const pct = totalMembers > 0 ? Math.round((s.val / totalMembers) * 100) : 0;
          return (
            <div key={i} className={cn('flex justify-between items-center py-[7px]', i < segs.length - 1 && 'border-b border-white/[0.03]')}>
              <div className="flex items-center gap-[7px]">
                <div className={cn('w-1 h-1 rounded-full shrink-0', s.dotClass)} />
                <span className="text-[11.5px] text-[#8b95b3]">{s.label}</span>
                <span className="text-[9.5px] text-[#4b5578]">{s.sub}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#eef2ff]">{s.val}</span>
                <span className="text-[9.5px] text-[#4b5578] min-w-[26px] text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── ACTION QUEUE ─── */
function ActionQueue({ churnSignals = [], atRisk = 0, newSignUps = 0, ci30 = [], now, retentionRate = 0 }) {
  const actions = useMemo(() => {
    const list = [];
    if (churnSignals.length > 0)   list.push({ icon: Send,     title: `Message ${churnSignals.length} quiet members`,  impact: `Save ~£${churnSignals.length * MVM}/month`,       cta: 'Message all'   });
    else if (atRisk > 0)           list.push({ icon: Send,     title: `Reach out to ${atRisk} inactive members`,       impact: 'Personal messages recover 30–40%',                cta: 'Message now'   });
    const newInactive = Math.max(0, newSignUps - new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).map(c => c.user_id)).size);
    if (newInactive > 0)           list.push({ icon: UserPlus, title: `Welcome ${newInactive} new members`,            impact: 'Week-1 contact doubles month-1 retention',        cta: 'Send welcome'  });
    if (retentionRate < 65)        list.push({ icon: Target,   title: 'Fix onboarding flow',                           impact: `Retention at ${retentionRate}% — target is 70%+`, cta: 'Review funnel' });
    return list.slice(0, 3);
  }, [churnSignals, atRisk, newSignUps, ci30, now, retentionRate]);

  if (!actions.length) return null;

  return (
    <div className={cn(CARD, 'p-5')}>
      <div className="flex items-center gap-[7px] mb-[14px]">
        <Zap className="w-[11px] h-[11px] text-[#4b5578]" />
        <span className="text-xs font-semibold text-[#8b95b3]">Action Queue</span>
        <span className="text-[10px] text-[#252d45] ml-auto">{actions.length} item{actions.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {actions.map((a, i) => (
          <div key={i} className={cn('px-[14px] py-3 rounded-[9px] bg-[#0d1225] border border-white/[0.04]', i === 0 && 'border-l-2 border-l-blue-500')}>
            <div className="flex items-start gap-[9px] mb-[10px]">
              <a.icon className={cn('w-[11px] h-[11px] shrink-0 mt-0.5', i === 0 ? 'text-blue-500' : 'text-[#4b5578]')} />
              <div>
                <div className="text-[11.5px] font-semibold text-[#eef2ff] mb-0.5">{a.title}</div>
                <div className="text-[10px] text-[#4b5578] leading-snug">{a.impact}</div>
              </div>
            </div>
            <AppButton variant="primary" size="sm" className="w-full justify-center" onClick={() => {}}>{a.cta}</AppButton>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── WEEK-1 RETURN CARD ─── */
function Week1ReturnCard({ week1ReturnTrend = [] }) {
  const data   = week1ReturnTrend;
  const latest = data[data.length - 1]?.pct || 0;
  const prev   = data[data.length - 2]?.pct  || 0;
  const delta  = latest - prev;
  const vClass = latest < 40 ? 'text-red-500' : latest >= 60 ? 'text-emerald-500' : 'text-[#eef2ff]';
  return (
    <div className={cn(CARD, 'p-5')}>
      <SectionHead title="Week-1 Return Rate" sub="New member cohort" right={
        <div className="flex items-baseline gap-[5px]">
          <span className={cn('text-[18px] font-bold tracking-[-0.03em]', vClass)}>{latest}%</span>
          {delta !== 0 && <span className={cn('text-[9.5px] font-semibold', delta > 0 ? 'text-emerald-500' : 'text-red-500')}>{delta > 0 ? '+' : ''}{delta}%</span>}
        </div>
      } />
      {data.length >= 2 && (
        <ResponsiveContainer width="100%" height={48}>
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs><linearGradient id="w1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
            <Area type="monotone" dataKey="pct" stroke="#3b82f6" strokeWidth={1.5} fill="url(#w1g)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
      <div className={cn('mt-2 text-[10px] leading-snug', vClass)}>
        {latest < 40 ? 'Below target — follow up with new members in week 1' : latest < 60 ? 'Room to improve — a personal welcome message helps' : 'Strong week-1 return'}
      </div>
    </div>
  );
}

/* ─── MILESTONE CARD ─── */
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
    <div className={cn(CARD, 'p-5')}>
      <div className="flex items-center gap-[7px] mb-[14px]">
        <Award className="w-[11px] h-[11px] text-[#4b5578]" />
        <span className="text-xs font-semibold text-[#8b95b3]">Upcoming Milestones</span>
      </div>
      <div className="flex flex-col">
        {milestones.map((m, i) => (
          <div key={m.name} className={cn('flex items-center gap-[9px] py-[7px]', i < milestones.length - 1 && 'border-b border-white/[0.03]')}>
            <div className="w-[26px] h-[26px] rounded-[6px] shrink-0 bg-[#0d1225] border border-white/[0.04] flex items-center justify-center text-[9.5px] font-bold text-[#8b95b3]">{m.total}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#eef2ff] overflow-hidden text-ellipsis whitespace-nowrap">{m.name}</div>
              <div className={cn('text-[9.5px] mt-px', m.toNext === 1 ? 'text-blue-500' : 'text-[#4b5578]')}>{m.toNext === 1 ? '1 visit away 🎯' : `${m.toNext} to ${m.next}`}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── RANKED LIST ─── */
function RankedList({ title, icon: Icon, items, emptyLabel }) {
  return (
    <div className={cn(CARD, 'p-5')}>
      <SectionHead title={title} right={<Icon className="w-[11px] h-[11px] text-[#4b5578]" />} />
      {items.every(d => !d.count) ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <Icon className="w-4 h-4 text-[#252d45]" />
          <span className="text-[11px] text-[#4b5578]">{emptyLabel || 'No data yet'}</span>
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map((h, i) => (
            <div key={h.label || h.name} className={cn('flex items-center justify-between py-1.5', i < items.length - 1 && 'border-b border-white/[0.03]')}>
              <div className="flex items-center gap-[7px]">
                <span className="text-[9px] font-semibold text-[#252d45] w-[13px] text-right shrink-0">#{i+1}</span>
                <span className="text-xs text-[#eef2ff]">{h.label || h.name}</span>
              </div>
              <span className="text-xs font-semibold text-[#8b95b3]">{h.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── MONTH COMPARE ─── */
function MonthCompare({ ci30, ciPrev30, retentionRate, atRisk }) {
  const thisActive = useMemo(() => new Set(ci30.map(c => c.user_id)).size, [ci30]);
  const prevActive = useMemo(() => ciPrev30?.length ? new Set(ciPrev30.map(c => c.user_id)).size : null, [ciPrev30]);
  const rows = [
    { label: 'Check-ins',      curr: ci30.length,         prev: ciPrev30?.length || 0, valueClass: 'text-[#eef2ff]' },
    { label: 'Active members', curr: thisActive,           prev: prevActive,            valueClass: 'text-[#eef2ff]' },
    { label: 'Retention',      curr: `${retentionRate}%`,  prev: null,                  valueClass: retentionRate < 60 ? 'text-red-500' : retentionRate >= 80 ? 'text-emerald-500' : 'text-[#eef2ff]' },
    { label: 'Low engagement', curr: atRisk,               prev: null,                  valueClass: atRisk > 0 ? 'text-amber-400' : 'text-[#eef2ff]' },
  ];
  return (
    <div className={cn(CARD, 'p-5')}>
      <SectionHead title="Month Comparison" sub="This vs last month" />
      {rows.map((r, i) => {
        const diff = r.prev !== null && typeof r.curr === 'number' ? r.curr - r.prev : null;
        const up = diff > 0;
        return (
          <div key={i} className={cn('flex items-center justify-between py-[7px]', i < rows.length - 1 && 'border-b border-white/[0.03]')}>
            <span className="text-xs text-[#8b95b3]">{r.label}</span>
            <div className="flex items-center gap-[7px]">
              {diff !== null && diff !== 0 && (
                <span className={cn('text-[9px] font-semibold px-[5px] py-[1px] rounded border', up ? 'text-emerald-500 bg-emerald-500/[0.08] border-emerald-500/[0.2]' : 'text-red-500 bg-red-500/[0.07] border-red-500/[0.2]')}>
                  {up ? '+' : ''}{diff}
                </span>
              )}
              <span className={cn('text-[13px] font-semibold', r.valueClass)}>{r.curr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── MAIN EXPORT ─── */
export default function TabAnalytics({
  checkIns, ci30, ciPrev30 = [], totalMembers, monthCiPer, monthChangePct,
  monthGrowthData, retentionRate, activeThisMonth, newSignUps, atRisk, gymId,
  allMemberships = [], classes = [], coaches = [], avatarMap = {},
  isCoach = false, myClasses = [],
  weekTrend: weekTrendProp = [], peakHours: peakHoursProp = [], busiestDays: busiestDaysProp = [],
  returnRate: returnRateProp = 0, dailyAvg: dailyAvgProp = 0, engagementSegments = {},
  retentionFunnel: retentionFunnelProp = [], dropOffBuckets: dropOffBucketsProp = [],
  churnSignals: churnSignalsProp = [], week1ReturnTrend: week1ReturnTrendProp = [],
  posts = [], polls = [],
}) {
  const now = new Date();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn);
  }, []);

  const weekTrend   = weekTrendProp.length  > 0 ? weekTrendProp   : [];
  const busiestDays = busiestDaysProp.length > 0 ? busiestDaysProp : [];
  const peakHours   = peakHoursProp.length  > 0 ? peakHoursProp   : [];

  const superActive = engagementSegments.superActive ?? (monthCiPer || []).filter(v => v >= 15).length;
  const active      = engagementSegments.active      ?? (monthCiPer || []).filter(v => v >= 8 && v < 15).length;
  const casual      = engagementSegments.casual      ?? (monthCiPer || []).filter(v => v >= 1 && v < 8).length;
  const inactive    = engagementSegments.inactive    ?? Math.max(0, totalMembers - (monthCiPer || []).length);

  if (isCoach) {
    const classWeeklyTrend = Array.from({ length: 8 }, (_, i) => {
      const s = subDays(now, (7 - i) * 7), e = subDays(now, (6 - i) * 7);
      return { label: format(s, 'MMM d'), value: checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: s, end: e })).length };
    });
    return (
      <div className="flex flex-col gap-[18px]">
        <TodaysFocus churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps} ci30={ci30} now={now} totalMembers={totalMembers} isMobile={isMobile} />
        <div className={cn('grid gap-[18px] items-start', isMobile ? 'grid-cols-1' : 'grid-cols-[1fr_264px]')}>
          <div className="flex flex-col gap-[14px]">
            <KpiStrip totalMembers={totalMembers} activeThisMonth={activeThisMonth} atRisk={atRisk} retentionRate={retentionRate} monthChangePct={monthChangePct} ci30={ci30} now={now} weekTrend={weekTrend} />
            <div className={cn(CARD, 'p-5')}>
              <SectionHead title="Class Attendance Trend" sub="8-week view" />
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={classWeeklyTrend} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <AreaGrad id="cag" />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="label" tick={tick} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} interval={1} />
                  <YAxis tick={tick} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} width={26} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={1.5} fill="url(#cag)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={cn(CARD, 'p-5')}>
              <SectionHead title="Traffic Heatmap" sub="Check-in density by time and day" />
              <HeatmapChart gymId={gymId} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <ActionQueue churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps} ci30={ci30} now={now} retentionRate={retentionRate} />
            <MemberSegments totalMembers={totalMembers} superActive={superActive} active={active} casual={casual} inactive={inactive} />
            <RankedList title="Busiest Days" icon={Calendar} items={busiestDays.map(d => ({ ...d, label: d.name }))} emptyLabel="No data yet" />
            <RankedList title="Peak Hours"   icon={Clock}    items={peakHours.slice(0, 5)} emptyLabel="No check-in data yet" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      <TodaysFocus churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps} ci30={ci30} now={now} totalMembers={totalMembers} />

      {isMobile && (
        <ActionQueue churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps} ci30={ci30} now={now} retentionRate={retentionRate} />
      )}

      <div className={cn('grid gap-[18px] items-start', isMobile ? 'grid-cols-1' : 'grid-cols-[1fr_272px]')}>

        <div className="flex flex-col gap-4">
          {checkIns.length >= 3 ? (
            <KpiStrip totalMembers={totalMembers} activeThisMonth={activeThisMonth} atRisk={atRisk} retentionRate={retentionRate} monthChangePct={monthChangePct} ci30={ci30} now={now} weekTrend={weekTrend} />
          ) : (
            <div className={cn(CARD, 'p-[18px]')}>
              <div className="flex items-center gap-[10px]">
                <Activity className="w-[13px] h-[13px] text-[#4b5578] shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-[#eef2ff]">KPIs loading</div>
                  <div className="text-[11px] text-[#4b5578] mt-0.5 leading-relaxed">Metrics populate after your first 7 days of check-ins.</div>
                </div>
              </div>
            </div>
          )}

          <ChurnRevenuePanel churnSignals={churnSignalsProp} atRisk={atRisk} totalMembers={totalMembers} />
          <WeeklyTrendChart weekTrend={weekTrend} monthChangePct={monthChangePct} />
          <MemberGrowthChart monthGrowthData={monthGrowthData} newSignUps={newSignUps} />
          <RetentionFunnel retentionFunnel={retentionFunnelProp} />
          <DropOffChart dropOffBuckets={dropOffBucketsProp} />

          <div className={cn(CARD, 'p-5')}>
            <SectionHead title="Traffic Heatmap" sub="Check-in density by day and time" />
            <HeatmapChart gymId={gymId} />
          </div>

          <ClassPerformance classes={classes} ci30={ci30} now={now} />
          <StaffPerformance coaches={coaches} checkIns={checkIns} ci30={ci30} classes={classes} now={now} />
        </div>

        <div className="flex flex-col gap-3">
          {!isMobile && <ActionQueue churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps} ci30={ci30} now={now} retentionRate={retentionRate} />}
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
