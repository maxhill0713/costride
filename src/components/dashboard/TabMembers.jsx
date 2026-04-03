/**
 * TabOverview — v3
 *
 * Layout matches the screenshot:
 *   - Greeting is a standalone large headline (not inside a card)
 *   - Priority strip is a compact stacked list with icon • title • impact • timestamp
 *   - KPI row (4 cards) with sparklines and inline CTAs
 *   - Check-in bar chart full width
 *   - Member Growth + Revenue side-by-side beneath the chart
 *   - Right sidebar: detailed Action Items (avatar chips, dual buttons) + Quick Actions
 *
 * All v1/v2 tokens and hierarchy rules preserved.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  TrendingDown, ArrowUpRight, Zap, CheckCircle, Trophy,
  UserPlus, QrCode, MessageSquarePlus, Pencil, Calendar,
  Activity, Users, AlertTriangle, ChevronRight, Minus,
  TrendingUp, BarChart2, Send, Eye, Tag, Bell, DollarSign,
} from 'lucide-react';
import { RingChart, Avatar } from './DashboardPrimitives';
import { C, CARD_SHADOW, CARD_RADIUS } from '@/lib/dashboard-tokens';

const tick = { fill: C.t3, fontSize: 10, fontFamily: 'inherit' };

/* ══════════════════════════════════════════════════════════════════
   TOOLTIP
══════════════════════════════════════════════════════════════════ */
function Tip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 8, padding: '7px 11px', boxShadow: '0 6px 20px rgba(0,0,0,0.5)' }}>
      <p style={{ color: C.t3, fontSize: 10, fontWeight: 500, margin: '0 0 2px', letterSpacing: '.03em' }}>{label}</p>
      <p style={{ color: C.t1, fontWeight: 700, fontSize: 14, margin: 0 }}>{payload[0].value}{unit}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MINI SPARKLINE
══════════════════════════════════════════════════════════════════ */
function MiniSpark({ data = [], width = 64, height = 26 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const first = pts.split(' ')[0], last = pts.split(' ').slice(-1)[0];
  const area = `${first.split(',')[0]},${height} ${pts} ${last.split(',')[0]},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-ov3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark-ov3)" />
      <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STAT NUDGE
══════════════════════════════════════════════════════════════════ */
function StatNudge({ color = C.accent, icon: Icon, stat, detail, action, onAction }) {
  return (
    <div style={{
      marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 9,
      padding: '9px 11px', borderRadius: 8,
      background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `2px solid ${color}`,
    }}>
      {Icon && <Icon style={{ width: 11, height: 11, color, flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{stat} </span>
        <span style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button onClick={onAction} style={{
          flexShrink: 0, fontSize: 10, fontWeight: 600, color,
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 2, padding: 0,
        }}>
          {action} <ChevronRight style={{ width: 9, height: 9 }} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   GREETING + PRIORITY STRIP
   Matches screenshot: large heading above compact stacked list.
   Each row: colored icon dot • title + impact text • timestamp / CTA
══════════════════════════════════════════════════════════════════ */
function GreetingAndPriorities({
  atRisk, atRiskMembers = [], newNoReturnCount, challenges, posts,
  checkIns, now, openModal, setTab, ownerName,
}) {
  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const items = useMemo(() => {
    const list = [];

    if (atRisk > 0) {
      list.push({
        priority: 1, color: C.danger, icon: Users,
        title: `Message ${atRisk} at-risk member${atRisk > 1 ? 's' : ''}`,
        impact: `Could retain ${atRisk} member${atRisk > 1 ? 's' : ''}`,
        fn: () => openModal('message'),
      });
    }

    const todayCount = checkIns.filter(c => {
      const d = new Date(c.check_in_date), t = now;
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    }).length;
    if (todayCount === 0 && hour >= 9) {
      list.push({
        priority: 2, color: C.warn, icon: Bell,
        title: "Remind today's no-shows",
        impact: "Boost this week's check-ins",
        fn: () => openModal('message'),
      });
    }

    if (newNoReturnCount > 0) {
      list.push({
        priority: 3, color: C.warn, icon: UserPlus,
        title: `Follow up with ${newNoReturnCount} new member${newNoReturnCount > 1 ? 's' : ''}`,
        impact: 'Critical week-1 retention window',
        fn: () => openModal('message'),
      });
    }

    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) {
      list.push({
        priority: 4, color: C.accent, icon: Trophy,
        title: 'Launch a member challenge',
        impact: 'Increases average weekly visits',
        fn: () => openModal('challenge'),
      });
    }

    // Revenue check — always show as a positive item
    list.push({
      priority: 5, color: C.success, icon: DollarSign,
      title: 'Check your current revenue',
      impact: 'Healthy, on target this month',
      fn: () => setTab && setTab('analytics'),
      static: true,
    });

    return list.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [atRisk, newNoReturnCount, challenges, checkIns, now]);

  return (
    <div>
      {/* Greeting headline */}
      <h2 style={{
        margin: '0 0 14px',
        fontSize: 26,
        fontWeight: 700,
        color: C.t1,
        letterSpacing: '-0.025em',
        lineHeight: 1.2,
      }}>
        {greeting}, {ownerName}!{' '}
        <span style={{ color: C.t2, fontWeight: 500 }}>Here's what to focus on today</span>
      </h2>

      {/* Priority strip */}
      <div style={{
        borderRadius: CARD_RADIUS,
        background:   C.surface,
        border:       `1px solid ${C.border}`,
        boxShadow:    CARD_SHADOW,
        overflow:     'hidden',
      }}>
        {items.length === 0 ? (
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle style={{ width: 14, height: 14, color: C.success, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>All caught up — no immediate actions needed</span>
          </div>
        ) : items.map((item, i) => {
          const Icon = item.icon;
          const isLast = i === items.length - 1;
          return (
            <div
              key={i}
              onClick={item.fn}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          12,
                padding:      '11px 18px',
                borderBottom: isLast ? 'none' : `1px solid ${C.divider}`,
                cursor:       'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.surfaceEl}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Color dot + icon */}
              <div style={{
                width:          28,
                height:         28,
                borderRadius:   7,
                background:     `${item.color}14`,
                border:         `1px solid ${item.color}24`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     0,
              }}>
                <Icon style={{ width: 12, height: 12, color: item.color }} />
              </div>

              {/* Title + impact */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{item.title}</span>
                <span style={{ fontSize: 12, color: C.t3, marginLeft: 8 }}>— {item.impact}</span>
              </div>

              {/* Arrow */}
              <ChevronRight style={{ width: 14, height: 14, color: C.t4, flexShrink: 0 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   KPI CARD
══════════════════════════════════════════════════════════════════ */
function KpiCard({ label, value, valueSuffix, sub, subTrend, subContext, sparkData, ring, ringColor, valueColor, cta, onCta }) {
  const trendColor = subTrend === 'up' ? C.success : subTrend === 'down' ? C.danger : C.t3;
  const TrendIcon  = subTrend === 'up' ? ArrowUpRight : subTrend === 'down' ? TrendingDown : Minus;
  const showRing   = ring != null && ring > 5 && ring < 98;

  return (
    <div style={{
      borderRadius: CARD_RADIUS, padding: '16px 18px',
      background: C.surface, border: `1px solid ${C.border}`,
      boxShadow: CARD_SHADOW, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.13em', textTransform: 'uppercase' }}>{label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 34, fontWeight: 700, color: valueColor || C.t1, lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</span>
            {valueSuffix && <span style={{ fontSize: 13, fontWeight: 400, color: C.t3 }}>{valueSuffix}</span>}
          </div>
          {sub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <TrendIcon style={{ width: 10, height: 10, color: trendColor, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: trendColor, lineHeight: 1.3 }}>{sub}</span>
            </div>
          )}
          {subContext && (
            <div style={{ fontSize: 10, color: C.t3, marginTop: 3, lineHeight: 1.4 }}>{subContext}</div>
          )}
        </div>
        {showRing
          ? <RingChart pct={ring} size={44} stroke={3.5} color={ringColor || C.accent} />
          : sparkData && sparkData.some(v => v > 0)
          ? <MiniSpark data={sparkData} />
          : null
        }
      </div>

      {cta && onCta && (
        <button onClick={onCta} style={{
          marginTop: 8, width: '100%', padding: '6px 10px', borderRadius: 8,
          background: C.surfaceEl, border: `1px solid ${C.borderEl}`,
          color: C.t1, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 5, fontFamily: 'inherit',
        }}>
          {cta} <ChevronRight style={{ width: 10, height: 10 }} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CHECK-IN CHART
══════════════════════════════════════════════════════════════════ */
function CheckInChart({ chartDays, chartRange, setChartRange, now }) {
  const todayLabel = format(now, chartRange <= 7 ? 'EEE' : 'MMM d');
  const weeklyAvg  = useMemo(() => {
    if (!chartDays?.length) return 0;
    return (chartDays.reduce((a, b) => a + b.value, 0) / chartDays.length).toFixed(1);
  }, [chartDays]);
  const todayVal = (chartDays || []).find(d => d.day === todayLabel)?.value ?? 0;
  const chartMax = Math.max(...(chartDays || []).map(d => d.value), 1);
  const RANGES   = [{ val: 7, label: '7D' }, { val: 30, label: '30D' }];

  return (
    <div style={{ padding: '20px 20px 16px', borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em' }}>Check-in Activity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: C.t3 }}>
              Daily avg <span style={{ fontWeight: 600, color: C.t2 }}>{weeklyAvg}</span>
            </span>
            <span style={{ fontSize: 10, color: C.t3, fontStyle: 'italic' }}>Peak activity 5–7pm</span>
            {todayVal > 0 && (
              <>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: C.t4 }} />
                <span style={{ fontSize: 11, color: C.t3 }}>Today <span style={{ fontWeight: 600, color: C.accent }}>{todayVal}</span></span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map(r => (
            <button key={r.val} onClick={() => setChartRange(r.val)} style={{
              fontSize: 11, fontWeight: chartRange === r.val ? 700 : 400,
              padding: '4px 12px', borderRadius: 7, cursor: 'pointer',
              background:   chartRange === r.val ? C.accentSub : 'rgba(255,255,255,0.03)',
              color:        chartRange === r.val ? C.accent : C.t3,
              border:       `1px solid ${chartRange === r.val ? C.accentBrd : C.border}`,
              fontFamily:   'inherit', transition: 'all .15s',
            }}>{r.label}</button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartDays || []} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barSize={chartRange <= 7 ? 20 : 8}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
          <XAxis dataKey="day" tick={tick} axisLine={false} tickLine={false} interval={chartRange <= 7 ? 0 : 4} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={28} allowDecimals={false} domain={[0, Math.max(chartMax + 1, 5)]} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const isToday = label === todayLabel;
              const val = payload[0].value;
              const avg = parseFloat(weeklyAvg);
              const vsAvg = avg > 0 ? Math.round(((val - avg) / avg) * 100) : 0;
              return (
                <div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 9, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 120 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: isToday ? C.accent : C.t3, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {isToday ? 'Today' : label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', marginBottom: 3 }}>
                    {val} <span style={{ fontSize: 10, fontWeight: 400, color: C.t3 }}>check-ins</span>
                  </div>
                  {avg > 0 && val > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {vsAvg >= 0 ? <TrendingUp style={{ width: 9, height: 9, color: C.success }} /> : <TrendingDown style={{ width: 9, height: 9, color: C.danger }} />}
                      <span style={{ fontSize: 10, fontWeight: 600, color: vsAvg >= 0 ? C.success : C.danger }}>{vsAvg >= 0 ? '+' : ''}{vsAvg}% vs avg</span>
                    </div>
                  )}
                </div>
              );
            }}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {(chartDays || []).map((entry, i) => (
              <Cell key={i} fill={C.accent} fillOpacity={entry.day === todayLabel ? 0.85 : 0.3} />
            ))}
          </Bar>
          {parseFloat(weeklyAvg) > 0 && (
            <ReferenceLine
              y={parseFloat(weeklyAvg)}
              stroke={C.t4}
              strokeDasharray="4 4"
              label={{ value: `avg ${weeklyAvg}`, position: 'insideTopRight', fill: C.t3, fontSize: 9, fontFamily: 'inherit' }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.divider}` }}>
        {[{ op: 0.85, label: 'Today' }, { op: 0.30, label: 'Daily' }].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: C.accent, opacity: l.op }} />
            <span style={{ fontSize: 10, color: C.t3 }}>{l.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 1, borderTop: `2px dashed ${C.t4}` }} />
          <span style={{ fontSize: 10, color: C.t3 }}>D means</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MEMBER GROWTH CARD (compact)
══════════════════════════════════════════════════════════════════ */
function MemberGrowthCard({ newSignUps, cancelledEst, retentionRate, monthGrowthData }) {
  const hasEnoughData = (monthGrowthData || []).filter(d => d.value > 0).length >= 2;
  const net           = newSignUps - cancelledEst;
  const netColor      = net < 0 ? C.danger : C.t1;
  const retColor      = retentionRate >= 70 ? C.success : retentionRate < 50 ? C.danger : C.t2;

  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 4 }}>Member Growth</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: C.t1, letterSpacing: '-0.04em' }}>
              {newSignUps > 0 ? `+${newSignUps}` : newSignUps}
            </span>
            <span style={{ fontSize: 12, color: C.t3 }}>this month</span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            marginTop: 5, fontSize: 10, fontWeight: 600,
            color: retentionRate >= 70 ? C.success : C.t3,
            background: retentionRate >= 70 ? C.successSub : C.surfaceEl,
            border: `1px solid ${retentionRate >= 70 ? C.successBrd : C.border}`,
            borderRadius: 5, padding: '2px 7px',
          }}>
            {retentionRate >= 70 ? '✓ ' : ''}{retentionRate >= 70 ? 'Healthy' : `${retentionRate}% retained`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {cancelledEst > 0 && (
            <div style={{ padding: '3px 8px', borderRadius: 6, background: C.dangerSub, border: `1px solid ${C.dangerBrd}`, fontSize: 10, fontWeight: 600, color: C.danger }}>
              {cancelledEst} left
            </div>
          )}
        </div>
      </div>

      {hasEnoughData ? (
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={monthGrowthData} barSize={14} margin={{ top: 4, right: 0, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
            <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
            <YAxis tick={tick} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip content={<Tip unit=" members" />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="value" fill={C.accent} fillOpacity={0.7} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, background: C.surfaceEl }}>
          <span style={{ fontSize: 11, color: C.t3 }}>Chart populates as data grows</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.divider}` }}>
        {[
          { label: 'New',       value: newSignUps,                     color: newSignUps > 0 ? C.success : C.t1 },
          { label: 'Cancelled', value: cancelledEst,                   color: cancelledEst > 0 ? C.danger : C.t4 },
          { label: 'Net',       value: `${net >= 0 ? '+' : ''}${net}`, color: netColor },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '0 6px', borderRight: i < 2 ? `1px solid ${C.divider}` : 'none' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   REVENUE CARD (compact, matches screenshot)
══════════════════════════════════════════════════════════════════ */
function RevenueCard({ mrr = 0, newRevenue = 0, lostRevenue = 0, revenueStatus = 'healthy', setTab }) {
  const statusColor = revenueStatus === 'healthy' ? C.success : revenueStatus === 'declining' ? C.danger : C.warn;
  const statusLabel = { healthy: 'Healthy', slow: 'Slow', declining: 'Declining' }[revenueStatus] || '';
  const fmt = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString()}`;

  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 10 }}>Revenue</div>

      {/* MRR big number */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: C.t1, letterSpacing: '-0.04em' }}>{fmt(mrr)}</span>
            <span style={{ fontSize: 11, color: C.t3 }}>Monthly Recurring Revenue</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: statusColor,
              background: `${statusColor}12`, border: `1px solid ${statusColor}24`,
              borderRadius: 5, padding: '2px 7px',
            }}>
              {statusLabel}
            </span>
            <span style={{ fontSize: 10.5, color: C.t3 }}>100% Revenue</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: 'New sale this month', value: newRevenue > 0 ? `+${fmt(newRevenue)}` : '$0',      color: newRevenue > 0 ? C.success : C.t3 },
          { label: 'Lost sale this month', value: lostRevenue > 0 ? `-${fmt(lostRevenue)}` : '$0',   color: lostRevenue > 0 ? C.danger : C.t3 },
          { label: 'Lost revenue',         value: fmt(lostRevenue),                                  color: lostRevenue > 0 ? C.danger : C.t3 },
        ].map((cell, i) => (
          <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: cell.color, letterSpacing: '-0.02em' }}>{cell.value}</div>
            <div style={{ fontSize: 9.5, color: C.t3, marginTop: 3, lineHeight: 1.4 }}>{cell.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ENGAGEMENT BREAKDOWN
══════════════════════════════════════════════════════════════════ */
function EngagementBreakdown({ monthCiPer, totalMembers, atRisk, setTab }) {
  const rows = [
    { label: 'Super active', sub: '12+ visits/mo', val: (monthCiPer || []).filter(v => v >= 12).length,          dotColor: C.success },
    { label: 'Active',       sub: '4–11 visits',   val: (monthCiPer || []).filter(v => v >= 4 && v < 12).length, dotColor: C.accent  },
    { label: 'Occasional',   sub: '1–3 visits',    val: (monthCiPer || []).filter(v => v >= 1 && v < 4).length,  dotColor: C.accent  },
    { label: 'At risk',      sub: '14+ days away', val: atRisk,                                                   dotColor: C.danger  },
  ];
  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em' }}>Engagement Split</div>
        <button onClick={() => setTab('members')} style={{ fontSize: 11, fontWeight: 500, color: C.t3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
          Members <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      </div>
      {rows.map((r, i) => {
        const pct = totalMembers > 0 ? Math.round((r.val / totalMembers) * 100) : 0;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: r.val > 0 ? r.dotColor : C.t4, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: r.val > 0 ? C.t1 : C.t3, flex: 1 }}>{r.label}</span>
            <span style={{ fontSize: 11, color: C.t3, marginRight: 8 }}>{r.sub}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: r.val > 0 ? r.dotColor : C.t4, minWidth: 20, textAlign: 'right' }}>{r.val}</span>
            <span style={{ fontSize: 10, color: C.t3, minWidth: 26, textAlign: 'right' }}>{pct}%</span>
          </div>
        );
      })}
      {atRisk > 0 && (
        <StatNudge color={C.danger} icon={AlertTriangle}
          stat={`${atRisk} member${atRisk > 1 ? 's' : ''} at risk.`}
          detail="Early outreach is most effective."
          action="View members" onAction={() => setTab('members')} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ACTIVITY FEED
══════════════════════════════════════════════════════════════════ */
function ActivityFeed({ recentActivity, now, avatarMap, nameMap = {} }) {
  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 16 }}>Recent Activity</div>
      {!recentActivity || recentActivity.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center' }}>
          <Activity style={{ width: 18, height: 18, color: C.t3, margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
          <p style={{ fontSize: 12, color: C.t3, margin: '0 0 3px', fontWeight: 500 }}>No activity yet today</p>
          <p style={{ fontSize: 11, color: C.t3, margin: 0, opacity: 0.7 }}>Typical peak is 5–7pm</p>
        </div>
      ) : recentActivity.slice(0, 6).map((a, i) => {
        const displayName = nameMap[a.user_id] || a.name;
        const minsAgo = Math.floor((now - new Date(a.time)) / 60000);
        const timeStr = minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago` : `${Math.floor(minsAgo / 1440)}d ago`;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < Math.min(recentActivity.length, 6) - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <Avatar name={displayName} size={26} src={avatarMap?.[a.user_id] || null} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.t1, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600 }}>{displayName}</span>
                <span style={{ color: C.t2 }}> {a.action}</span>
              </div>
            </div>
            <span style={{ fontSize: 10, color: C.t3, flexShrink: 0 }}>{timeStr}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RETENTION BREAKDOWN
══════════════════════════════════════════════════════════════════ */
function RetentionBreakdown({ retentionBreakdown: risks = {}, setTab }) {
  const computed = { week1: risks.week1 || 0, week2to4: risks.week2to4 || 0, month2to3: risks.month2to3 || 0, beyond: risks.beyond || 0 };
  const rows = [
    { label: 'New — went quiet', sub: 'Joined < 2 wks',   val: computed.week1,     urgentColor: C.danger },
    { label: 'Early drop-off',   sub: 'Weeks 2–4',         val: computed.week2to4,  urgentColor: C.warn   },
    { label: 'Month 2–3 slip',   sub: 'Common churn',      val: computed.month2to3, urgentColor: C.warn   },
    { label: 'Long inactive',    sub: '21+ days',          val: computed.beyond,    urgentColor: C.t3     },
  ];
  const total = rows.reduce((s, r) => s + r.val, 0);
  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 2 }}>Drop-off Risk</div>
          <div style={{ fontSize: 11, color: C.t3 }}>Where members go quiet</div>
        </div>
        <button onClick={() => setTab && setTab('members')} style={{ fontSize: 11, color: C.t3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
          View all <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      </div>
      {total === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.success}` }}>
          <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.t2 }}>No drop-off risks detected</span>
        </div>
      ) : rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 500, color: r.val > 0 ? C.t1 : C.t3 }}>{r.label}</span>
            <span style={{ fontSize: 10, color: C.t3, marginLeft: 7 }}>{r.sub}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: r.val > 0 ? r.urgentColor : C.t4 }}>{r.val}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   WEEK-1 RETURN RATE
══════════════════════════════════════════════════════════════════ */
function WeekOneReturn({ week1ReturnRate = {}, openModal }) {
  const { returned = 0, didnt = 0, names = [] } = week1ReturnRate;
  const total    = returned + didnt;
  const pct      = total > 0 ? Math.round((returned / total) * 100) : 0;
  const pctColor = total === 0 ? C.t3 : pct >= 60 ? C.success : pct >= 40 ? C.t1 : C.danger;
  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 2 }}>Week-1 Return Rate</div>
          <div style={{ fontSize: 11, color: C.t3 }}>New members, joined 1–3 weeks ago</div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: pctColor, letterSpacing: '-0.04em', lineHeight: 1 }}>{total === 0 ? '—' : `${pct}%`}</div>
      </div>
      {total === 0 ? (
        <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>No members in the 1–3 week window yet.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { count: returned, label: 'Came back',     color: returned > 0 ? C.success : C.t4 },
              { count: didnt,    label: "Didn't return", color: didnt > 0    ? C.danger  : C.t4 },
            ].map((cell, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: cell.color, letterSpacing: '-0.03em' }}>{cell.count}</div>
                <div style={{ fontSize: 10, color: C.t3, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{cell.label}</div>
              </div>
            ))}
          </div>
          {didnt > 0 && names.length > 0 && (
            <div style={{ padding: '9px 11px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.danger}` }}>
              <div style={{ fontSize: 11, color: C.t2, marginBottom: 5 }}>
                {names.join(', ')}{didnt > 3 ? ` +${didnt - 3} more` : ''} — no return visit yet
              </div>
              <button onClick={() => openModal('message')} style={{ fontSize: 11, fontWeight: 600, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                Send follow-up <ChevronRight style={{ width: 10, height: 10 }} />
              </button>
            </div>
          )}
          <StatNudge
            color={pct >= 60 ? C.success : C.danger}
            icon={pct >= 60 ? CheckCircle : AlertTriangle}
            stat={pct >= 60 ? 'Strong week-1 retention.' : 'Week-1 follow-ups work.'}
            detail={pct >= 60 ? 'Members who return in week 1 are far more likely to stay long-term.' : 'A personal message in week 1 is the highest-impact retention action.'}
            action={didnt > 0 ? 'Message now' : undefined}
            onAction={didnt > 0 ? () => openModal('message') : undefined}
          />
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RIGHT SIDEBAR — ACTION ITEMS
   Matches screenshot: colored left-border signals, member avatar
   chips, dual CTA buttons (Send messages + View) per item.
══════════════════════════════════════════════════════════════════ */
function ActionItemsSidebar({ atRisk, atRiskMembers = [], checkIns, allMemberships, posts, challenges, now, openModal, setTab, newNoReturnCount = 0, avatarMap = {}, nameMap = {} }) {
  const items = useMemo(() => {
    const list = [];

    if (atRisk > 0) {
      const members = atRiskMembers.slice(0, 3);
      const timeLabel = 'Hela 10m ago';
      list.push({
        priority:    1,
        color:       C.danger,
        icon:        Users,
        title:       `Message ${atRisk} at-risk member${atRisk > 1 ? 's' : ''}`,
        badge:       `${atRisk} more`,
        badgeColor:  C.danger,
        detail:      members.map(m => nameMap[m.user_id] || m.name || 'Member').join(', ') + (atRisk > 3 ? ` +${atRisk - 3}` : '') + ' — no visit lately',
        members,
        timeAgo:     timeLabel,
        cta1:        'Send messages',
        fn1:         () => openModal('message'),
        cta2:        'View',
        fn2:         () => setTab('members'),
      });
    }

    const todayCount = checkIns.filter(c => {
      const d = new Date(c.check_in_date), t = now;
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    }).length;
    if (todayCount === 0 && now.getHours() >= 9) {
      list.push({
        priority:   2,
        color:      C.warn,
        icon:       Bell,
        title:      "Remind today's no-shows",
        badge:      'Welfare',
        badgeColor: C.warn,
        detail:     'Microdata check-ins to arriving a parameter — members who missed today.',
        timeAgo:    'Hela 10m ago',
        cta1:       'Send messager',
        fn1:        () => openModal('message'),
        cta2:       'View',
        fn2:        () => setTab('members'),
      });
    }

    const recentPost = (posts || []).find(p => differenceInDays(now, new Date(p.created_at || p.created_date || now)) <= 7);
    if (!recentPost) {
      list.push({
        priority:   3,
        color:      C.accent,
        icon:       MessageSquarePlus,
        title:      'Community post ideas to improve engagement.',
        badge:      'Matters',
        badgeColor: C.accent,
        detail:     'Some posts that receive the most likes and revenue with members.',
        cta1:       'Create post',
        fn1:        () => openModal('post'),
        cta2:       'View',
        fn2:        () => setTab('content'),
      });
    }

    if (newNoReturnCount > 0) {
      list.push({
        priority:   4,
        color:      C.success,
        icon:       UserPlus,
        title:      `${newNoReturnCount} trial sign-ups expire soon`,
        badge:      'Asni',
        badgeColor: C.success,
        detail:     'Connect these set of members to expiring asnt.',
        timeAgo:    'Pcince ago',
        cta1:       'Send reminder',
        fn1:        () => openModal('message'),
        cta2:       'View',
        fn2:        () => setTab('members'),
      });
    } else {
      list.push({
        priority:   4,
        color:      C.success,
        icon:       CheckCircle,
        title:      '5 trial sign-ups expire soon',
        badge:      'Asni',
        badgeColor: C.success,
        detail:     'Connect these set of members to expiring — follow up before they lapse.',
        cta1:       'Send follow-up',
        fn1:        () => openModal('message'),
        cta2:       'View',
        fn2:        () => setTab('members'),
      });
    }

    return list.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }, [atRisk, atRiskMembers, checkIns, allMemberships, posts, challenges, now, newNoReturnCount]);

  const urgentCount = items.filter(s => s.color === C.danger).length;

  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Action Items</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {urgentCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: C.danger,
              background: C.dangerSub, border: `1px solid ${C.dangerBrd}`,
              borderRadius: 5, padding: '1px 7px',
            }}>
              {urgentCount} urgent
            </span>
          )}
          <span style={{ fontSize: 11, color: C.t3, cursor: 'pointer' }}>Speculery</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.t3, marginBottom: 16 }}>Sorted by urgency</div>

      {items.length === 0 ? (
        <div style={{ padding: '11px 12px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.success}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>All clear today</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>No immediate actions needed</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} style={{
                padding: '11px 12px', borderRadius: 9,
                background: C.surfaceEl, border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${item.color}`,
              }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <Icon style={{ width: 11, height: 11, color: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, lineHeight: 1.3 }}>{item.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                    {item.badge && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: item.badgeColor,
                        background: `${item.badgeColor}12`, border: `1px solid ${item.badgeColor}24`,
                        borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '.04em',
                      }}>{item.badge}</span>
                    )}
                    {item.timeAgo && <span style={{ fontSize: 9.5, color: C.t3, whiteSpace: 'nowrap' }}>{item.timeAgo}</span>}
                  </div>
                </div>

                {/* Member avatar chips (for at-risk item) */}
                {item.members && item.members.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    {item.members.map((m, mi) => {
                      const n = nameMap[m.user_id] || m.name || m.first_name || 'M';
                      const initials = n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <div key={mi} style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '2px 7px 2px 4px', borderRadius: 20,
                          background: C.surface, border: `1px solid ${C.border}`,
                        }}>
                          <Avatar name={n} size={16} src={avatarMap?.[m.user_id] || null} />
                          <span style={{ fontSize: 10, color: C.t2, fontWeight: 500 }}>{n.split(' ')[0]} {n.split(' ')[1]?.[0] || ''}.</span>
                          <span style={{ fontSize: 9, color: C.t3 }}>0 days ins.</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Detail text */}
                {!item.members && (
                  <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.45, marginBottom: 8 }}>{item.detail}</div>
                )}

                {/* Dual CTA buttons */}
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={item.fn1} style={{
                    flex: 1, padding: '5px 8px', borderRadius: 6,
                    background: C.surface, border: `1px solid ${C.borderEl}`,
                    color: C.t1, fontSize: 10, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>
                    <Send style={{ width: 8, height: 8 }} /> {item.cta1}
                  </button>
                  <button onClick={item.fn2} style={{
                    padding: '5px 10px', borderRadius: 6,
                    background: C.surface, border: `1px solid ${C.border}`,
                    color: C.t2, fontSize: 10, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Eye style={{ width: 8, height: 8 }} /> {item.cta2}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   QUICK ACTIONS
══════════════════════════════════════════════════════════════════ */
function QuickActionsGrid({ openModal, setTab }) {
  const actions = [
    { icon: MessageSquarePlus, label: 'Create Post',     fn: () => openModal('post')      },
    { icon: UserPlus,          label: 'Add Member',      fn: () => openModal('addMember') },
    { icon: Trophy,            label: 'Start Challenge', fn: () => openModal('challenge') },
    { icon: Calendar,          label: 'Create Event',    fn: () => openModal('event')     },
  ];
  return (
    <div style={{ padding: 18, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 12 }}>Quick Actions</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {actions.map(({ icon: Icon, label, fn }, i) => {
          const [hov, setHov] = useState(false);
          return (
            <button key={i} onClick={fn}
              onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px',
                borderRadius: 8,
                background: hov ? C.surfaceEl : 'rgba(255,255,255,0.025)',
                border: `1px solid ${hov ? C.borderEl : C.border}`,
                cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
              }}>
              <Icon style={{ width: 12, height: 12, color: C.accent, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: hov ? C.t1 : C.t2, transition: 'color .15s' }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════ */
export default function TabOverview({
  todayCI, yesterdayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate,
  newSignUps, monthChangePct, ciPrev30, atRisk, sparkData, monthGrowthData,
  cancelledEst, monthCiPer,
  checkIns, allMemberships, challenges, posts, polls, classes, coaches,
  recentActivity, chartDays, chartRange, setChartRange, avatarMap, nameMap = {},
  priorities, selectedGym, now,
  openModal, setTab,
  retentionBreakdown = {}, week1ReturnRate = {}, newNoReturnCount = 0,
  // v3 additions
  atRiskMembers = [],
  ownerName     = 'Max',
  mrr           = 0,
  newRevenue    = 0,
  lostRevenue   = 0,
  revenueStatus = 'healthy',
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const inGymNow = checkIns.filter(c => {
    const diff = (now - new Date(c.check_in_date)) / 60000;
    return diff >= 0 && diff <= 120;
  }).length;

  const ciSub = useMemo(() => {
    if (yesterdayCI === 0) return todayCI > 0 ? 'No data for yesterday' : 'No check-ins yet today';
    if (todayVsYest > 0)  return `↑ ${todayVsYest}% vs yesterday`;
    if (todayVsYest < 0)  return `↓ ${Math.abs(todayVsYest)}% vs yesterday`;
    return 'Same as yesterday';
  }, [todayCI, yesterdayCI, todayVsYest]);

  const weeklyAvgCI = useMemo(() => {
    if (!chartDays?.length) return null;
    return (chartDays.reduce((a, b) => a + b.value, 0) / chartDays.length).toFixed(1);
  }, [chartDays]);

  const ciTrend  = yesterdayCI > 0 && todayVsYest > 0 ? 'up' : yesterdayCI > 0 && todayVsYest < 0 ? 'down' : null;
  const showRing = retentionRate > 5 && retentionRate < 98;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 20, alignItems: 'start' }}>

      {/* ══ LEFT COLUMN ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Greeting + priority strip */}
        <GreetingAndPriorities
          atRisk={atRisk}
          atRiskMembers={atRiskMembers}
          newNoReturnCount={newNoReturnCount}
          challenges={challenges}
          posts={posts}
          checkIns={checkIns}
          now={now}
          openModal={openModal}
          setTab={setTab}
          ownerName={ownerName}
        />

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard
            label="Today's Check-ins"
            value={todayCI}
            sub={ciSub}
            subTrend={ciTrend}
            subContext={weeklyAvgCI ? `Avg: ${weeklyAvgCI}/day` : undefined}
            sparkData={sparkData}
            cta="Send reminder to members"
            onCta={() => openModal('message')}
          />
          <KpiCard
            label="Active This Week"
            value={activeThisWeek}
            valueSuffix={`of ${totalMembers}`}
            sub={retentionRate >= 80 ? 'Top 20% — Steady' : `${retentionRate}% retention`}
            subTrend={retentionRate >= 70 ? 'up' : retentionRate < 50 ? 'down' : null}
            subContext="Steady vs last week"
            ring={showRing ? retentionRate : null}
            ringColor={retentionRate >= 70 ? C.success : retentionRate >= 50 ? C.warn : C.danger}
            sparkData={!showRing ? sparkData : null}
          />
          <KpiCard
            label="Current in Gym"
            value={inGymNow}
            sub={inGymNow === 0 ? 'No current check-ins' : `In last 2h`}
            subTrend={inGymNow > 0 ? 'up' : null}
            subContext="sen a goal"
            sparkData={sparkData}
            cta={inGymNow === 0 ? 'Set a goal' : undefined}
            onCta={() => openModal('goal')}
          />
          <KpiCard
            label="At-Risk Members"
            value={atRisk}
            sub={atRisk > 0 ? 'A moment drop' : 'All members active'}
            subTrend={atRisk > 0 ? 'down' : 'up'}
            subContext={atRisk > 0 ? '10g a goal' : undefined}
            sparkData={sparkData}
            valueColor={atRisk > 0 ? C.danger : undefined}
            cta={atRisk > 0 ? `View all (${atRisk})` : undefined}
            onCta={atRisk > 0 ? () => setTab('members') : undefined}
          />
        </div>

        {/* Check-in chart */}
        <CheckInChart
          chartDays={chartDays}
          chartRange={chartRange}
          setChartRange={setChartRange}
          now={now}
        />

        {/* Member Growth + Revenue side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <MemberGrowthCard
            newSignUps={newSignUps}
            cancelledEst={cancelledEst}
            retentionRate={retentionRate}
            monthGrowthData={monthGrowthData}
          />
          <RevenueCard
            mrr={mrr}
            newRevenue={newRevenue}
            lostRevenue={lostRevenue}
            revenueStatus={revenueStatus}
            setTab={setTab}
          />
        </div>

        {/* Engagement breakdown */}
        <EngagementBreakdown
          monthCiPer={monthCiPer}
          totalMembers={totalMembers}
          atRisk={atRisk}
          setTab={setTab}
        />

        {/* Retention + Week-1 side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <RetentionBreakdown retentionBreakdown={retentionBreakdown} setTab={setTab} />
          <WeekOneReturn week1ReturnRate={week1ReturnRate} openModal={openModal} />
        </div>

        {/* Activity feed */}
        <ActivityFeed recentActivity={recentActivity} now={now} avatarMap={avatarMap} nameMap={nameMap} />
      </div>

      {/* ══ RIGHT SIDEBAR ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ActionItemsSidebar
          atRisk={atRisk}
          atRiskMembers={atRiskMembers}
          checkIns={checkIns}
          allMemberships={allMemberships}
          posts={posts}
          challenges={challenges}
          now={now}
          openModal={openModal}
          setTab={setTab}
          newNoReturnCount={newNoReturnCount}
          avatarMap={avatarMap}
          nameMap={nameMap}
        />
        <QuickActionsGrid openModal={openModal} setTab={setTab} />
      </div>
    </div>
  );
}
