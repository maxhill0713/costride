import React from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { C, FONT, Card, SectionLabel, ProgressBar, ChartTip } from './DrawerShared';

const SCORES = {
  workout:   { pct: 72, label: 'Workout Adherence',   color: C.cyan,  trend: +5 },
  nutrition: { pct: 84, label: 'Nutrition Adherence',  color: C.green, trend: +2 },
  habits:    { pct: 68, label: 'Habit Adherence',      color: C.amber, trend: -3 },
};
const OVERALL = Math.round(Object.values(SCORES).reduce((s, x) => s + x.pct, 0) / 3);
const overallColor = OVERALL >= 80 ? C.green : OVERALL >= 60 ? C.amber : C.red;

const RADAR_DATA = [
  { subject: 'Workout', val: SCORES.workout.pct },
  { subject: 'Nutrition', val: SCORES.nutrition.pct },
  { subject: 'Habits', val: SCORES.habits.pct },
  { subject: 'Check-ins', val: 90 },
  { subject: 'Consistency', val: 75 },
];

const TREND_DATA = [
  { w: '8wk', overall: 55, workout: 50, nutrition: 62, habits: 52 },
  { w: '7wk', overall: 58, workout: 54, nutrition: 65, habits: 54 },
  { w: '6wk', overall: 62, workout: 59, nutrition: 69, habits: 58 },
  { w: '5wk', overall: 65, workout: 63, nutrition: 72, habits: 60 },
  { w: '4wk', overall: 68, workout: 66, nutrition: 76, habits: 62 },
  { w: '3wk', overall: 72, workout: 70, nutrition: 80, habits: 65 },
  { w: '2wk', overall: 74, workout: 71, nutrition: 83, habits: 67 },
  { w: 'Now', overall: OVERALL, workout: 72, nutrition: 84, habits: 68 },
];

const INSIGHTS = [
  { icon: TrendingUp,    color: C.green,  text: 'Nutrition adherence up 2% — great week for macros.' },
  { icon: AlertTriangle, color: C.amber,  text: 'Habit tracking dropped this week. Steps target missed 3/7 days.' },
  { icon: TrendingDown,  color: C.red,    text: 'Workout adherence below target. Missed 2 sessions this month.' },
  { icon: Zap,           color: C.cyan,   text: 'Overall score trending up for 4 consecutive weeks. Momentum building.' },
];

function TrendIcon({ val }) {
  if (val > 0) return <TrendingUp style={{ width: 11, height: 11, color: C.green }} />;
  if (val < 0) return <TrendingDown style={{ width: 11, height: 11, color: C.red }} />;
  return <Minus style={{ width: 11, height: 11, color: C.t3 }} />;
}

export default function TabAdherence() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Overall score hero */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ padding: '28px 28px', display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Big ring */}
          <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
            <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={45} cy={45} r={36} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={7} />
              <circle cx={45} cy={45} r={36} fill="none" stroke={overallColor} strokeWidth={7}
                strokeDasharray={226} strokeDashoffset={226 - (OVERALL / 100) * 226} strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 8px ${overallColor}55)` }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: overallColor, letterSpacing: '-0.04em', lineHeight: 1 }}>{OVERALL}</div>
              <div style={{ fontSize: 8, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>overall</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, marginBottom: 8 }}>Overall Adherence</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: overallColor, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
              {OVERALL >= 80 ? 'Excellent' : OVERALL >= 65 ? 'Good' : 'Needs Work'}
            </div>
            <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.6 }}>Composite of workout, nutrition & habit scores</div>
          </div>
        </Card>

        {/* Radar */}
        <Card>
          <SectionLabel>Performance Radar</SectionLabel>
          <ResponsiveContainer width="100%" height={150}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke={C.brd} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} />
              <Radar name="Score" dataKey="val" stroke={C.cyan} fill={C.cyan} fillOpacity={0.12} strokeWidth={2} dot={{ r: 3, fill: C.cyan }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Score breakdown */}
      <Card>
        <SectionLabel>Score Breakdown</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.values(SCORES).map((s, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: C.t2, fontWeight: 600 }}>{s.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendIcon val={s.trend} />
                  <span style={{ fontSize: 11, color: s.trend > 0 ? C.green : s.trend < 0 ? C.red : C.t3, fontWeight: 600 }}>{s.trend > 0 ? '+' : ''}{s.trend}%</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', minWidth: 38, textAlign: 'right' }}>{s.pct}%</span>
                </div>
              </div>
              <ProgressBar pct={s.pct} color={s.color} height={6} />
            </div>
          ))}
        </div>
      </Card>

      {/* 8-week trend chart */}
      <Card>
        <SectionLabel>Adherence Trend — 8 Weeks</SectionLabel>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={TREND_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="ovg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={overallColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={overallColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="w" tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} domain={[40, 100]} />
            <Tooltip content={<ChartTip suffix="%" />} />
            <Area type="monotone" dataKey="overall" stroke={overallColor} strokeWidth={2.5} fill="url(#ovg)" dot={false} activeDot={{ r: 4, fill: overallColor }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* AI Insights */}
      <Card>
        <SectionLabel>AI Insights</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {INSIGHTS.map((ins, i) => {
            const Icon = ins.icon;
            return (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingTop: 16, paddingBottom: 16, borderBottom: i < INSIGHTS.length - 1 ? `1px solid ${C.brd}` : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: ins.color + '12', border: `1px solid ${ins.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 13, height: 13, color: ins.color }} />
                </div>
                <span style={{ fontSize: 13, color: C.t2, lineHeight: 1.65, paddingTop: 4 }}>{ins.text}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}