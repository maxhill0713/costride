import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, Camera, Award } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { C, FONT, Card, SectionLabel, ProgressBar, ChartTip } from './DrawerShared';

const WEIGHT_DATA = [
  { w: '8wk', v: 76.2 }, { w: '7wk', v: 75.8 }, { w: '6wk', v: 75.1 },
  { w: '5wk', v: 74.5 }, { w: '4wk', v: 74.0 }, { w: '3wk', v: 73.4 },
  { w: '2wk', v: 72.9 }, { w: 'Now', v: 72.4 },
];
const BF_DATA = [
  { w: '8wk', v: 22.1 }, { w: '7wk', v: 21.8 }, { w: '6wk', v: 21.4 },
  { w: '5wk', v: 21.0 }, { w: '4wk', v: 20.6 }, { w: '3wk', v: 20.2 },
  { w: '2wk', v: 19.9 }, { w: 'Now', v: 19.5 },
];
const LIFTS = [
  { name: 'Squat', unit: 'kg', pbs: [
    { w: '8wk', v: 55 }, { w: '6wk', v: 57.5 }, { w: '4wk', v: 60 }, { w: '2wk', v: 62 }, { w: 'Now', v: 62 },
  ], pr: 62, target: 80, color: C.cyan },
  { name: 'Bench', unit: 'kg', pbs: [
    { w: '8wk', v: 45 }, { w: '6wk', v: 47.5 }, { w: '4wk', v: 50 }, { w: '2wk', v: 52.5 }, { w: 'Now', v: 55 },
  ], pr: 55, target: 70, color: C.violet },
  { name: 'Deadlift', unit: 'kg', pbs: [
    { w: '8wk', v: 80 }, { w: '6wk', v: 85 }, { w: '4wk', v: 87.5 }, { w: '2wk', v: 90 }, { w: 'Now', v: 92.5 },
  ], pr: 92.5, target: 120, color: C.amber },
];
const MEASUREMENTS = [
  { label: 'Waist', val: '82cm', change: '-3cm', good: true },
  { label: 'Chest', val: '98cm', change: '+2cm', good: true },
  { label: 'Hip',   val: '96cm', change: '-2cm', good: true },
  { label: 'Arm',   val: '34cm', change: '+1cm', good: true },
];

export default function TabProgress() {
  const [activeLift, setActiveLift] = useState(0);
  const lift = LIFTS[activeLift];
  const pct = Math.round((lift.pr / lift.target) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Body metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Weight */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <SectionLabel style={{ marginBottom: 4 }}>Bodyweight</SectionLabel>
            <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>▼ 3.8 kg</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.t1, letterSpacing: '-0.04em', marginBottom: 4 }}>72.4<span style={{ fontSize: 14, color: C.t3, fontWeight: 500 }}> kg</span></div>
          <div style={{ fontSize: 11, color: C.t3, marginBottom: 16 }}>Target: 70 kg · 8 weeks to go</div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={WEIGHT_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
              <defs>
                <linearGradient id="wg3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.green} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={C.green} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="w" tick={{ fill: C.t3, fontSize: 8, fontFamily: FONT }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.t3, fontSize: 8, fontFamily: FONT }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip content={<ChartTip suffix=" kg" />} />
              <Area type="monotone" dataKey="v" stroke={C.green} strokeWidth={2} fill="url(#wg3)" dot={false} activeDot={{ r: 3, fill: C.green }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Body fat */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <SectionLabel style={{ marginBottom: 4 }}>Body Fat %</SectionLabel>
            <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>▼ 2.6%</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.t1, letterSpacing: '-0.04em', marginBottom: 4 }}>19.5<span style={{ fontSize: 14, color: C.t3, fontWeight: 500 }}>%</span></div>
          <div style={{ fontSize: 11, color: C.t3, marginBottom: 16 }}>Target: 17% · Progress: good</div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={BF_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
              <defs>
                <linearGradient id="bfg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.cyan} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="w" tick={{ fill: C.t3, fontSize: 8, fontFamily: FONT }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.t3, fontSize: 8, fontFamily: FONT }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip content={<ChartTip suffix="%" />} />
              <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2} fill="url(#bfg)" dot={false} activeDot={{ r: 3, fill: C.cyan }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Measurements */}
      <Card>
        <SectionLabel>Measurements</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {MEASUREMENTS.map((m, i) => (
            <div key={i} style={{ padding: '14px 12px', borderRadius: 10, background: C.card2, border: `1px solid ${C.brd}`, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.t1, letterSpacing: '-0.03em' }}>{m.val}</div>
              <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>{m.label}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: m.good ? C.green : C.red, marginTop: 5 }}>{m.change}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Strength tracker */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <SectionLabel style={{ marginBottom: 0 }}>Strength Progress</SectionLabel>
          <div style={{ display: 'flex', gap: 6 }}>
            {LIFTS.map((l, i) => (
              <button key={i} onClick={() => setActiveLift(i)}
                style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, border: `1px solid ${i === activeLift ? l.color + '44' : C.brd}`, background: i === activeLift ? l.color + '10' : 'transparent', color: i === activeLift ? l.color : C.t3, transition: 'all .15s' }}>
                {l.name}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24, alignItems: 'center' }}>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={lift.pbs} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="w" tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip suffix={` ${lift.unit}`} />} />
              <Bar dataKey="v" fill={lift.color} radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: lift.color + '14', border: `1px solid ${lift.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award style={{ width: 16, height: 16, color: lift.color }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Current PR</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: lift.color, letterSpacing: '-0.04em' }}>{lift.pr} <span style={{ fontSize: 12, fontWeight: 500, color: C.t3 }}>{lift.unit}</span></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.t3, marginBottom: 6 }}>
                <span>To target ({lift.target}{lift.unit})</span>
                <span style={{ color: lift.color, fontWeight: 600 }}>{pct}%</span>
              </div>
              <ProgressBar pct={pct} color={lift.color} height={6} />
            </div>
          </div>
        </div>
      </Card>

      {/* Progress photos */}
      <Card>
        <SectionLabel>Progress Photos</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[{ label: 'Jan 2024', badge: 'Start' }, { label: 'Feb 2024' }, { label: 'Mar 2024' }, { label: 'Apr 2024', badge: 'Latest' }].map((p, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 12, background: C.card2, border: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', overflow: 'hidden', transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.brd2}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}>
              {p.badge && (
                <div style={{ position: 'absolute', top: 8, left: 8, padding: '2px 7px', borderRadius: 6, background: C.cyan, fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>{p.badge}</div>
              )}
              <Camera style={{ width: 20, height: 20, color: C.t3 }} />
              <span style={{ fontSize: 10.5, color: C.t3 }}>{p.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}