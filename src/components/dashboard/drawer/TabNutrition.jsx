import React, { useState } from 'react';
import { Utensils, TrendingUp, Check, X, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { C, FONT, Card, SectionLabel, ProgressBar, ChartTip } from './DrawerShared';

const DAILY_DATA = [
  { d: 'Mon', cal: 1820, target: 1720, adh: 94 },
  { d: 'Tue', cal: 1650, target: 1720, adh: 96 },
  { d: 'Wed', cal: 1980, target: 1720, adh: 70 },
  { d: 'Thu', cal: 1700, target: 1720, adh: 99 },
  { d: 'Fri', cal: 1740, target: 1720, adh: 99 },
  { d: 'Sat', cal: 2200, target: 1720, adh: 55 },
  { d: 'Sun', cal: 1680, target: 1720, adh: 98 },
];
const MACROS = [
  { label: 'Protein', val: 138, target: 140, unit: 'g', color: C.cyan, pct: 99 },
  { label: 'Carbs',   val: 175, target: 200, unit: 'g', color: C.amber, pct: 88 },
  { label: 'Fat',     val: 55,  target: 60,  unit: 'g', color: C.violet, pct: 92 },
];
const avgAdh = Math.round(DAILY_DATA.reduce((s, d) => s + d.adh, 0) / DAILY_DATA.length);
const adhColor = avgAdh >= 85 ? C.green : avgAdh >= 65 ? C.amber : C.red;
const adhLabel = avgAdh >= 85 ? 'On Track' : avgAdh >= 65 ? 'Needs Attention' : 'Off Track';

const MEAL_LOG = [
  { meal: 'Breakfast', desc: 'Oats + whey protein', cal: 420, time: '07:30', ok: true },
  { meal: 'Lunch',     desc: 'Chicken + rice + veg', cal: 580, time: '12:30', ok: true },
  { meal: 'Snack',     desc: 'Greek yogurt + berries', cal: 180, time: '15:00', ok: true },
  { meal: 'Dinner',    desc: 'Salmon + sweet potato', cal: 620, time: '19:00', ok: true },
];

export default function TabNutrition() {
  const [view, setView] = useState('week');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Adherence overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[
          { label: 'Weekly Adherence', val: `${avgAdh}%`, col: adhColor, sub: adhLabel },
          { label: 'Avg Daily Cals',   val: `${Math.round(DAILY_DATA.reduce((s, d) => s + d.cal, 0) / 7)}`, col: C.t1, sub: 'Target: 1,720 kcal' },
          { label: 'Days On Target',   val: `${DAILY_DATA.filter(d => d.adh >= 85).length}/7`, col: C.green, sub: 'within 10% of target' },
        ].map((s, i) => (
          <Card key={i}>
            <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.col, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: C.t3 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Calorie chart */}
      <Card>
        <SectionLabel>Daily Calories — This Week</SectionLabel>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={DAILY_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="d" tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} domain={[1400, 2300]} />
            <Tooltip content={<ChartTip suffix=" kcal" />} />
            {/* target line rendered as second bar at 0 height with ref line effect */}
            <Bar dataKey="cal" radius={[4, 4, 0, 0]}>
              {DAILY_DATA.map((d, i) => (
                <Cell key={i} fill={d.adh >= 85 ? C.green : d.adh >= 65 ? C.amber : C.red} opacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'flex-end' }}>
          {[['On target', C.green], ['Close', C.amber], ['Off track', C.red]].map(([l, col]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: col, opacity: 0.75 }} />
              <span style={{ fontSize: 10, color: C.t3 }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Macros */}
      <Card>
        <SectionLabel>Macro Breakdown — Today</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {MACROS.map((m, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.t2 }}>{m.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: m.color }}>{m.val}</span>
                  <span style={{ fontSize: 11, color: C.t3 }}>/ {m.target}{m.unit}</span>
                  <span style={{ fontSize: 11, color: m.pct >= 90 ? C.green : C.amber, fontWeight: 600, marginLeft: 6 }}>{m.pct}%</span>
                </div>
              </div>
              <ProgressBar pct={m.pct} color={m.color} height={6} />
            </div>
          ))}
        </div>
      </Card>

      {/* Meal log */}
      <Card>
        <SectionLabel>Today's Meals</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {MEAL_LOG.map((meal, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 15, paddingBottom: 15, borderBottom: i < MEAL_LOG.length - 1 ? `1px solid ${C.brd}` : 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: meal.ok ? C.greenD : C.redD, border: `1px solid ${meal.ok ? C.greenB : C.redB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {meal.ok ? <Check style={{ width: 12, color: C.green }} /> : <X style={{ width: 12, color: C.red }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>{meal.meal}</div>
                <div style={{ fontSize: 11.5, color: C.t3, marginTop: 2 }}>{meal.desc}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{meal.cal} kcal</div>
                <div style={{ fontSize: 10.5, color: C.t3, marginTop: 2 }}>{meal.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.brd}` }}>
          <span style={{ fontSize: 12, color: C.t3, fontWeight: 600 }}>Total today</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: C.t1 }}>{MEAL_LOG.reduce((s, m) => s + m.cal, 0)} <span style={{ fontSize: 11, color: C.t3, fontWeight: 500 }}>/ 1,720 kcal</span></span>
        </div>
      </Card>
    </div>
  );
}