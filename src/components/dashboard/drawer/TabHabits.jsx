import React, { useState } from 'react';
import { Flame, Droplets, Moon, Footprints, Plus } from 'lucide-react';
import { C, FONT, Card, SectionLabel, ProgressBar } from './DrawerShared';

const HABITS_DATA = [
  {
    id: 'steps', icon: Footprints, label: 'Steps', target: 10000, unit: 'steps',
    color: C.cyan, today: 8420,
    week: [8200, 9100, 7600, 10200, 8420, 0, 0], // 0 = future
    streak: 5,
  },
  {
    id: 'water', icon: Droplets, label: 'Water', target: 8, unit: 'glasses',
    color: '#38bdf8', today: 6,
    week: [8, 7, 8, 6, 6, 0, 0],
    streak: 3,
  },
  {
    id: 'sleep', icon: Moon, label: 'Sleep', target: 8, unit: 'hrs',
    color: C.violet, today: 7.2,
    week: [7.5, 6.8, 8.1, 7.2, 7.2, 0, 0],
    streak: 7,
  },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CHECKIN_HISTORY = [
  { date: '22 Apr', energy: 4, motivation: 5, stress: 2, wins: 'Hit new squat PR. Felt strong all session.', challenges: 'Nutrition was off on Sunday.' },
  { date: '15 Apr', energy: 3, motivation: 3, stress: 4, wins: 'Consistent with gym 4×.', challenges: 'High stress at work — missed sleep targets.' },
  { date: '8 Apr',  energy: 5, motivation: 5, stress: 1, wins: 'Best week yet. All habits hit.', challenges: 'None.' },
];

function ScoreDots({ val, max = 5, color }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < val ? color : C.brd }} />
      ))}
    </div>
  );
}

export default function TabHabits() {
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [form, setForm] = useState({ energy: 3, motivation: 3, stress: 3, wins: '', challenges: '' });
  const [history, setHistory] = useState(CHECKIN_HISTORY);

  const submitCheckin = () => {
    if (!form.wins.trim() && !form.challenges.trim()) return;
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    setHistory(p => [{ date, ...form }, ...p]);
    setForm({ energy: 3, motivation: 3, stress: 3, wins: '', challenges: '' });
    setCheckinOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Habit trackers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {HABITS_DATA.map((h) => {
          const Icon = h.icon;
          const pct = Math.round((h.today / h.target) * 100);
          const col = pct >= 100 ? C.green : pct >= 70 ? h.color : C.amber;
          return (
            <Card key={h.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: h.color + '14', border: `1px solid ${h.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 14, height: 14, color: h.color }} />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>{h.label}</span>
                </div>
                {h.streak > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: C.amber, fontWeight: 700 }}>
                    <Flame style={{ width: 10, height: 10 }} />{h.streak}d
                  </div>
                )}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: col, letterSpacing: '-0.04em', marginBottom: 4 }}>
                {h.today}<span style={{ fontSize: 11, fontWeight: 500, color: C.t3, marginLeft: 3 }}>{h.unit}</span>
              </div>
              <div style={{ fontSize: 10.5, color: C.t3, marginBottom: 10 }}>Target: {h.target} {h.unit}</div>
              <ProgressBar pct={pct} color={col} height={5} />
              {/* Week dots */}
              <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                {h.week.map((v, i) => {
                  const dayPct = h.target > 0 ? v / h.target : 0;
                  const isFuture = v === 0 && i >= 4;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: '100%', height: 4, borderRadius: 2, background: isFuture ? C.brd : dayPct >= 1 ? h.color : dayPct >= 0.7 ? C.amber : C.red, opacity: isFuture ? 0.25 : 0.75 }} />
                      <span style={{ fontSize: 8, color: C.t3 }}>{WEEK_DAYS[i].slice(0, 1)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Weekly check-in */}
      <Card highlight={checkinOpen ? 'blue' : undefined}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: checkinOpen ? 20 : 0 }}>
          <SectionLabel style={{ marginBottom: 0 }}>Weekly Check-in</SectionLabel>
          <button onClick={() => setCheckinOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: checkinOpen ? C.cyan : C.cyanD, border: `1px solid ${C.cyanB}`, color: checkinOpen ? '#fff' : C.cyan, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, transition: 'all .15s' }}>
            <Plus style={{ width: 11, height: 11 }} />{checkinOpen ? 'Cancel' : 'Add Check-in'}
          </button>
        </div>

        {checkinOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 4 }}>
            {[
              { label: 'Energy Level', key: 'energy', color: C.amber },
              { label: 'Motivation', key: 'motivation', color: C.cyan },
              { label: 'Stress (lower = better)', key: 'stress', color: C.red },
            ].map(field => (
              <div key={field.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12.5, color: C.t2, fontWeight: 600 }}>{field.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: field.color }}>{form[field.key]}/5</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} onClick={() => setForm(p => ({ ...p, [field.key]: v }))}
                      style={{ flex: 1, height: 32, borderRadius: 8, background: form[field.key] >= v ? field.color + '22' : C.card2, border: `1px solid ${form[field.key] >= v ? field.color + '44' : C.brd}`, cursor: 'pointer', transition: 'all .12s', fontSize: 12, fontWeight: 700, color: form[field.key] >= v ? field.color : C.t3 }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 10.5, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8 }}>Wins this week</div>
              <textarea value={form.wins} onChange={e => setForm(p => ({ ...p, wins: e.target.value }))} rows={2}
                placeholder="What went well?"
                style={{ width: '100%', boxSizing: 'border-box', background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 9, padding: '10px 12px', fontSize: 13, color: C.t1, resize: 'none', outline: 'none', fontFamily: FONT, lineHeight: 1.6 }} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8 }}>Challenges</div>
              <textarea value={form.challenges} onChange={e => setForm(p => ({ ...p, challenges: e.target.value }))} rows={2}
                placeholder="What was hard?"
                style={{ width: '100%', boxSizing: 'border-box', background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 9, padding: '10px 12px', fontSize: 13, color: C.t1, resize: 'none', outline: 'none', fontFamily: FONT, lineHeight: 1.6 }} />
            </div>
            <button onClick={submitCheckin}
              style={{ padding: '12px', borderRadius: 10, background: C.cyan, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: `0 4px 18px ${C.cyan}33` }}>
              Save Check-in
            </button>
          </div>
        )}
      </Card>

      {/* Check-in history */}
      <Card>
        <SectionLabel>Check-in History</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {history.map((c, i) => (
            <div key={i} style={{ paddingTop: 18, paddingBottom: 18, borderBottom: i < history.length - 1 ? `1px solid ${C.brd}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: C.t3, fontWeight: 600 }}>{c.date}</span>
                <div style={{ display: 'flex', gap: 14, fontSize: 10.5, color: C.t3 }}>
                  <span>Energy <ScoreDots val={c.energy} color={C.amber} /></span>
                  <span>Motivation <ScoreDots val={c.motivation} color={C.cyan} /></span>
                  <span>Stress <ScoreDots val={c.stress} color={C.red} /></span>
                </div>
              </div>
              {c.wins && <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.65 }}>✅ {c.wins}</div>}
              {c.challenges && <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.65, marginTop: 5 }}>⚡ {c.challenges}</div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}