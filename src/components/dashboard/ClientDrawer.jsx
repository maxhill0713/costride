/**
 * ClientDrawer — Full Coaching Operating System
 * 9 tabs: Overview · Activity · Progress · Nutrition · Habits · Adherence · Notes · Program · Messages
 */
import React, { useState, useEffect } from 'react';
import {
  X, Send, Check, Flame, ShieldAlert, AlertTriangle,
  BarChart2, Activity, FileText, Dumbbell, MessageSquare,
  TrendingUp, TrendingDown, Minus, Plus, ChevronRight,
  Utensils, Zap, Target, Heart, ClipboardList, Layers,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { C, FONT, Card, SectionLabel, ProgressBar, ChartTip } from './drawer/DrawerShared';
import TabProgress   from './drawer/TabProgress';
import TabNutrition  from './drawer/TabNutrition';
import TabHabits     from './drawer/TabHabits';
import TabAdherence  from './drawer/TabAdherence';
import TabProgram    from './drawer/TabProgram';

/* ─── CONSTANTS ──────────────────────────────────────────────── */
const AV_COLORS = ['#4d7fff','#22c55e','#f59e0b','#f43f5e','#a78bfa','#06b6d4','#f97316','#14b8a6'];
const COACH_ACTIONS = ['Check in','Book session','Send message','Celebrate progress','Missed sessions','Custom plan offer','Upgrade plan','Welcome back'];
const MSG_PRESET = {
  'Check in':           fn => `Hey ${fn}, just checking in — how are things going? Let me know if you need anything.`,
  'Book session':       fn => `Hi ${fn}, I have some slots open this week. Want to book in for a session?`,
  'Send message':       fn => `Hi ${fn}, hope you're well! Wanted to touch base and see how training's going.`,
  'Celebrate progress': fn => `${fn} — you've been absolutely crushing it lately. Your consistency is seriously impressive.`,
  'Missed sessions':    fn => `Hi ${fn}, we noticed you haven't been in for a bit. Just checking everything's okay.`,
  'Custom plan offer':  fn => `Hey ${fn}, I've been thinking about your goals and I have some ideas for a custom plan. Interested?`,
  'Upgrade plan':       fn => `Hey ${fn}, given how consistent you've been, I think you'd benefit from stepping up your plan.`,
  'Welcome back':       fn => `Hi ${fn}, great to have you back! We've got great sessions lined up — let's pick up where we left off.`,
};

const MOCK_WEIGHT = [
  { w:'8wk', v:76.2 }, { w:'7wk', v:75.8 }, { w:'6wk', v:75.1 },
  { w:'5wk', v:74.5 }, { w:'4wk', v:74.0 }, { w:'3wk', v:73.4 },
  { w:'2wk', v:72.9 }, { w:'Now', v:72.4 },
];
const MOCK_SESSIONS = [
  { date:'23 May', type:'Upper Strength', dur:55, attended:true  },
  { date:'20 May', type:'HIIT Cardio',    dur:45, attended:true  },
  { date:'17 May', type:'Lower Body',     dur:60, attended:false },
  { date:'14 May', type:'Full Body',      dur:50, attended:false },
  { date:'10 May', type:'Upper Strength', dur:55, attended:true  },
];

/* ─── HELPERS ────────────────────────────────────────────────── */
function scoreColor(s) {
  if (s >= 80) return C.green;
  if (s >= 60) return C.t2;
  if (s >= 40) return C.amber;
  return C.red;
}
function scoreTier(s) {
  if (s >= 80) return { label:'Healthy', color:C.green, bg:C.greenD, bdr:C.greenB };
  if (s >= 60) return { label:'Stable',  color:C.t2,    bg:'rgba(113,113,122,0.08)', bdr:'rgba(113,113,122,0.2)' };
  if (s >= 40) return { label:'Caution', color:C.amber,  bg:C.amberD, bdr:C.amberB };
  return             { label:'At Risk', color:C.red,    bg:C.redD,   bdr:C.redB };
}
function riskReasons(client) {
  const r = [];
  if (client.lastVisit >= 21)  r.push('No gym visit in 3+ weeks');
  else if (client.lastVisit >= 14) r.push('No gym visit in 2+ weeks');
  if (client.sessionsThisMonth === 0 && client.sessionsLastMonth === 0) r.push('Zero sessions in 2 months');
  else if (client.sessionsThisMonth < client.sessionsLastMonth) r.push('Sessions declining month-on-month');
  if (client.consecutiveMissed >= 2) r.push(`${client.consecutiveMissed} consecutive no-shows`);
  if (!r.length && client.retentionScore < 40) r.push('Low overall engagement score');
  return r;
}
function successRate(client) {
  return Math.max(20, Math.min(95, Math.round(100 - (100 - client.retentionScore) * 0.6)));
}
function churnDays(client) {
  if (client.retentionScore >= 60) return null;
  const base = Math.round((client.retentionScore / 40) * 14);
  return Math.max(3, Math.min(21, 21 - base));
}

/* ─── AVATAR ─────────────────────────────────────────────────── */
function Av({ client, size = 36, avatarMap = {} }) {
  const col = AV_COLORS[(client.id || client.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
  const src = avatarMap[client.id] || client.avatar || null;
  const ini = (client.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  if (src) return <img src={src} alt={client.name} style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, objectFit: 'cover', border: `2px solid ${col}44` }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: col + '18', color: col, fontSize: size * 0.33, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${col}28`, fontFamily: 'monospace' }}>
      {ini}
    </div>
  );
}

/* ─── SCORE RING ─────────────────────────────────────────────── */
function ScoreRing({ score, size = 120, stroke = 8 }) {
  const color = scoreColor(score);
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 10px ${color}66)`, transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <div style={{ fontSize: size * 0.26, fontWeight: 900, color, letterSpacing: '-0.05em', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: size * 0.09, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>risk score</div>
      </div>
    </div>
  );
}

/* ─── ACTIVITY HEATMAP ───────────────────────────────────────── */
function ActivityHeatmap({ history = [] }) {
  const weeks = history.length ? history : Array.from({ length: 8 }, () => 50);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const getColor = v => v > 75 ? C.green : v > 50 ? C.cyan : v > 25 ? C.amber : C.red;
  const getOpacity = v => Math.max(0.07, v / 100 * 0.8);
  const hash = (wi, di) => ((wi * 7 + di) * 2654435761) >>> 0;
  const variance = (wi, di) => ((hash(wi, di) % 50) - 25);
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {days.map((d, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {weeks.map((wv, wi) => (
          <div key={wi} style={{ display: 'flex', gap: 4 }}>
            {days.map((_d, di) => {
              const v = Math.max(0, Math.min(100, wv + variance(wi, di)));
              return (
                <div key={di} title={`${Math.round(v)}%`}
                  style={{ flex: 1, height: 12, borderRadius: 3, background: getColor(v), opacity: getOpacity(v), cursor: 'default', transition: 'opacity .12s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = String(getOpacity(v))} />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10, justifyContent: 'flex-end' }}>
        {[['Low', C.red], ['Mid', C.amber], ['Good', C.cyan], ['High', C.green]].map(([l, col], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: col, opacity: 0.65 }} />
            <span style={{ fontSize: 9.5, color: C.t3 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── NOTES PANEL ────────────────────────────────────────────── */
function NotesPanel() {
  const TAGS = ['Injury', 'Low energy', 'PR', 'Breakthrough', 'Nutrition', 'Mindset'];
  const [notes, setNotes] = useState([
    { id: 1, date: '23 May 2024', text: 'Great session. Right knee improving. Recommended 3×/week with modified squats.', tags: ['Injury'] },
    { id: 2, date: '10 May 2024', text: 'New squat PB at 62kg — very motivated. Increase load 2.5kg next session.', tags: ['PR'] },
    { id: 3, date: '28 Apr 2024', text: 'Missed last two sessions. Client mentioned work stress. Suggested lighter recovery week.', tags: ['Low energy', 'Mindset'] },
  ]);
  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [search, setSearch] = useState('');
  const toggleTag = t => setSelectedTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const addNote = () => {
    if (!text.trim()) return;
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    setNotes(p => [{ id: Date.now(), date, text: text.trim(), tags: selectedTags }, ...p]);
    setText(''); setSelectedTags([]);
  };
  const filtered = notes.filter(n => {
    const matchSearch = !search || n.text.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });
  return (
    <div>
      {/* Compose */}
      <div style={{ marginBottom: 20 }}>
        <textarea value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addNote(); }}
          placeholder="Add a session note… (⌘↩ to save)"
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 10, color: C.t1, fontSize: 13, outline: 'none', padding: '12px 14px', fontFamily: FONT, resize: 'none', lineHeight: 1.65, transition: 'border-color .15s', marginBottom: 10 }}
          onFocus={e => e.currentTarget.style.borderColor = C.brd2}
          onBlur={e => e.currentTarget.style.borderColor = C.brd} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {TAGS.map(t => (
              <button key={t} onClick={() => toggleTag(t)}
                style={{ padding: '4px 9px', borderRadius: 6, fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, background: selectedTags.includes(t) ? C.cyanD : 'transparent', border: `1px solid ${selectedTags.includes(t) ? C.cyanB : C.brd}`, color: selectedTags.includes(t) ? C.cyan : C.t3, transition: 'all .12s' }}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={addNote}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            <Plus style={{ width: 11, height: 11 }} /> Save
          </button>
        </div>
      </div>
      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…"
        style={{ width: '100%', boxSizing: 'border-box', background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 9, color: C.t1, fontSize: 12.5, outline: 'none', padding: '9px 13px', fontFamily: FONT, marginBottom: 16 }} />
      {/* List */}
      {filtered.map((n, i) => (
        <div key={n.id} style={{ paddingTop: 18, paddingBottom: 18, borderBottom: i < filtered.length - 1 ? `1px solid ${C.brd}` : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 10.5, color: C.t3, fontWeight: 600 }}>{n.date}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(n.tags || []).map(t => (
                <span key={t} style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.7 }}>{n.text}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── INJURY PANEL ───────────────────────────────────────────── */
function InjuryPanel({ client }) {
  const [injuries, setInjuries] = useState(
    client.injuries?.length ? client.injuries : [
      { id: 1, area: 'Right Knee', severity: 'Moderate', notes: 'Avoid heavy squats and deep lunges.', flag: 'Squat, Leg Press' },
    ]
  );
  const [form, setForm] = useState({ area: '', severity: 'Mild', notes: '', flag: '' });
  const [adding, setAdding] = useState(false);
  const sevColor = s => s === 'Cleared' ? C.green : s === 'Severe' ? C.red : C.amber;
  const sevBg    = s => s === 'Cleared' ? C.greenD : s === 'Severe' ? C.redD : C.amberD;
  const sevBdr   = s => s === 'Cleared' ? C.greenB : s === 'Severe' ? C.redB : C.amberB;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {injuries.map((inj, i) => (
        <div key={inj.id || i} style={{ padding: '14px 16px', borderRadius: 10, background: sevBg(inj.severity), border: `1px solid ${sevBdr(inj.severity)}`, borderLeft: `3px solid ${sevColor(inj.severity)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: sevColor(inj.severity) }}>{inj.area}</span>
            <span style={{ fontSize: 10.5, color: sevColor(inj.severity), fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${sevColor(inj.severity)}15` }}>{inj.severity}</span>
          </div>
          {inj.notes && <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.6, marginBottom: inj.flag ? 6 : 0 }}>{inj.notes}</div>}
          {inj.flag && <div style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>🚩 Avoid: {inj.flag}</div>}
        </div>
      ))}
      {injuries.length === 0 && !adding && <div style={{ fontSize: 12, color: C.t3, padding: '12px 0' }}>No restrictions logged.</div>}
      {adding && (
        <div style={{ padding: '16px', borderRadius: 10, background: C.card2, border: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} placeholder="Area (e.g. Left Shoulder)"
            style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.brd}`, borderRadius: 8, color: C.t1, fontSize: 13, outline: 'none', padding: '9px 12px', fontFamily: FONT }} />
          <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
            style={{ background: C.card, border: `1px solid ${C.brd}`, color: C.t2, fontSize: 13, borderRadius: 8, padding: '9px 12px', fontFamily: FONT, outline: 'none' }}>
            {['Mild', 'Moderate', 'Severe', 'Cleared'].map(s => <option key={s}>{s}</option>)}
          </select>
          <input value={form.flag} onChange={e => setForm(p => ({ ...p, flag: e.target.value }))} placeholder="Flag exercises to avoid (optional)"
            style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.brd}`, borderRadius: 8, color: C.t1, fontSize: 13, outline: 'none', padding: '9px 12px', fontFamily: FONT }} />
          <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)"
            style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.brd}`, borderRadius: 8, color: C.t1, fontSize: 13, outline: 'none', padding: '9px 12px', fontFamily: FONT }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { if (form.area.trim()) { setInjuries(p => [...p, { id: Date.now(), ...form }]); setForm({ area: '', severity: 'Mild', notes: '', flag: '' }); setAdding(false); } }}
              style={{ flex: 1, padding: '9px', borderRadius: 9, background: C.cyan, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Save</button>
            <button onClick={() => setAdding(false)}
              style={{ flex: 1, padding: '9px', borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          </div>
        </div>
      )}
      <button onClick={() => setAdding(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'transparent', border: `1px dashed ${C.brd2}`, color: C.t3, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
        <Plus style={{ width: 11, height: 11 }} /> Add restriction
      </button>
    </div>
  );
}

/* ─── MESSAGE COMPOSER ───────────────────────────────────────── */
function MessageComposer({ client, onMessage }) {
  const fn = (client?.name || 'there').split(' ')[0];
  const [sent, setSent] = useState(false);
  const [action, setAction] = useState(client._action || 'Check in');
  const [body, setBody] = useState(MSG_PRESET[client?._action]?.(fn) || `Hi ${fn}, just checking in!`);
  const sr = successRate(client);
  const handleSend = () => {
    setSent(true);
    onMessage({ ...client, _action: action });
    setTimeout(() => setSent(false), 2500);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 10.5, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>Template</div>
        <select value={action} onChange={e => { setAction(e.target.value); setBody(MSG_PRESET[e.target.value]?.(fn) || `Hi ${fn}, just checking in!`); }}
          style={{ width: '100%', padding: '10px 13px', borderRadius: 9, background: C.card2, border: `1px solid ${C.brd}`, color: C.t2, fontSize: 13, fontFamily: FONT, outline: 'none', cursor: 'pointer' }}>
          {COACH_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <div style={{ fontSize: 10.5, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>Message</div>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
          style={{ width: '100%', boxSizing: 'border-box', background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '13px 14px', fontSize: 13, color: C.t1, resize: 'none', outline: 'none', lineHeight: 1.7, fontFamily: FONT, transition: 'border-color .15s' }}
          onFocus={e => e.currentTarget.style.borderColor = C.brd2}
          onBlur={e => e.currentTarget.style.borderColor = C.brd} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: C.t3 }}><span style={{ color: C.cyan, fontWeight: 700 }}>{sr}%</span> predicted response rate</span>
        <span style={{ fontSize: 11, color: C.t3 }}>{body.length} chars</span>
      </div>
      <button onClick={handleSend}
        style={{ padding: '13px', borderRadius: 11, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: FONT,
          background: sent ? C.greenD : C.cyan, color: sent ? C.green : '#fff',
          outline: sent ? `1px solid ${C.greenB}` : 'none',
          boxShadow: sent ? 'none' : `0 4px 24px ${C.cyan}38`,
          transition: 'all 0.3s cubic-bezier(.16,1,.3,1)' }}>
        {sent ? <><Check style={{ width: 15, height: 15 }} /> Sent!</> : <><Send style={{ width: 15, height: 15 }} /> Send to {fn}</>}
      </button>
    </div>
  );
}

/* ─── TABS CONFIG ────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',   label: 'Overview',   icon: BarChart2    },
  { id: 'activity',   label: 'Activity',   icon: Activity     },
  { id: 'progress',   label: 'Progress',   icon: TrendingUp   },
  { id: 'nutrition',  label: 'Nutrition',  icon: Utensils     },
  { id: 'habits',     label: 'Habits',     icon: Heart        },
  { id: 'adherence',  label: 'Adherence',  icon: Target       },
  { id: 'notes',      label: 'Notes',      icon: FileText     },
  { id: 'program',    label: 'Program',    icon: Layers       },
  { id: 'messages',   label: 'Messages',   icon: MessageSquare},
];

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════ */
export default function ClientDrawer({ client, onClose, onMessage, avatarMap = {} }) {
  const [tab, setTab] = useState('overview');

  const sc      = scoreColor(client.retentionScore);
  const tier    = scoreTier(client.retentionScore);
  const reasons = riskReasons(client);
  const sr      = successRate(client);
  const days    = churnDays(client);
  const fn      = (client.name || 'Client').split(' ')[0];
  const visitLabel = client.lastVisit >= 999 ? 'No visits recorded' : client.lastVisit === 0 ? 'Today' : `${client.lastVisit}d ago`;
  const avCol = AV_COLORS[(client.id || client.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)', animation: 'tcm2FadeUp .2s ease both' }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '86%', maxWidth: 1200,
        background: C.bg,
        borderLeft: `1px solid ${C.brd}`,
        zIndex: 401, display: 'flex', flexDirection: 'column',
        boxShadow: '-40px 0 120px rgba(0,0,0,0.9)',
        fontFamily: FONT,
        animation: 'tcm2SlideIn .28s cubic-bezier(.16,1,.3,1) both',
      }}>

        {/* ── HEADER ── */}
        <div style={{ flexShrink: 0, borderBottom: `1px solid ${C.brd}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent 0%, ${avCol}50 40%, ${avCol}50 60%, transparent 100%)`, pointerEvents: 'none' }} />

          <div style={{ padding: '18px 28px 0' }}>
            {/* Identity row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ position: 'relative' }}>
                  <Av client={client} size={46} avatarMap={avatarMap} />
                  {client.streak >= 7 && (
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.brd}` }}>
                      <Flame style={{ width: 10, height: 10, color: C.amber }} />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: C.t1, letterSpacing: '-0.03em' }}>{client.name}</span>
                    <span style={{ padding: '3px 9px', borderRadius: 20, background: tier.bg, border: `1px solid ${tier.bdr}`, fontSize: 10.5, fontWeight: 700, color: tier.color }}>{tier.label}</span>
                    {client.isNew && <span style={{ padding: '3px 9px', borderRadius: 20, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 10.5, fontWeight: 700, color: '#60a5fa' }}>New</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.t3 }}>
                    {client.goal || 'General Fitness'} · Since {client.joinDate}
                    {client.nextSession && <span style={{ color: C.cyan, marginLeft: 8 }}>· Next: {client.nextSession}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Quick send */}
                <button onClick={() => setTab('messages')}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, background: C.cyan, border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: `0 2px 12px ${C.cyan}30` }}>
                  <Send style={{ width: 12, height: 12 }} /> Send Message
                </button>
                <button onClick={onClose}
                  style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.brd}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = C.brd2; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = C.brd; }}>
                  <X style={{ width: 13, height: 13, color: C.t2 }} />
                </button>
              </div>
            </div>

            {/* Tab bar — scrollable */}
            <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', marginRight: -28, paddingRight: 28 }}>
              {TABS.map(t => {
                const Icon = t.icon;
                const on = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
                    background: 'transparent', border: 'none', outline: 'none', whiteSpace: 'nowrap',
                    borderBottom: `2px solid ${on ? C.cyan : 'transparent'}`,
                    color: on ? C.t1 : C.t3, fontSize: 12, fontWeight: on ? 700 : 400,
                    cursor: 'pointer', fontFamily: FONT, transition: 'color .15s, border-color .15s',
                    marginBottom: -1, flexShrink: 0,
                  }}
                    onMouseEnter={e => { if (!on) e.currentTarget.style.color = C.t2; }}
                    onMouseLeave={e => { if (!on) e.currentTarget.style.color = C.t3; }}>
                    <Icon style={{ width: 11, height: 11 }} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="tcm2-scr" style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 60px' }}>

          {/* ════ OVERVIEW ════ */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {days !== null && (
                  <div style={{ padding: '13px 18px', borderRadius: 11, background: C.redD, border: `1px solid ${C.redB}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Zap style={{ width: 14, height: 14, color: C.red, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: C.t1, lineHeight: 1.5, fontWeight: 500 }}>
                      <strong style={{ color: C.red }}>{fn}</strong> is likely to churn in <strong style={{ color: C.red }}>{days} days</strong> if no action is taken.
                    </span>
                  </div>
                )}
                <Card style={{ display: 'flex', alignItems: 'center', gap: 36, padding: '30px' }}>
                  <ScoreRing score={client.retentionScore} size={124} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, marginBottom: 10 }}>Retention Risk Score</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: tier.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>{tier.label}</div>
                    <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.7, marginBottom: 16 }}>
                      {reasons.length > 0 ? reasons[0] : 'Client engagement looks healthy.'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 30 }}>
                      {(client.retentionHistory || Array.from({ length: 8 }, () => 50)).map((v, i) => (
                        <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', background: i === 7 ? sc : C.brd2, height: `${Math.max(12, v)}%` }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: C.t3, marginTop: 4 }}>
                      <span>8 weeks ago</span><span style={{ color: sc }}>Now</span>
                    </div>
                  </div>
                </Card>
                <Card highlight="blue" style={{ padding: '26px 28px' }}>
                  <div style={{ fontSize: 10, color: C.cyan, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 12 }}>✦ AI Recommendation</div>
                  <div style={{ fontSize: 21, fontWeight: 800, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1.25, marginBottom: 10 }}>{client._action}</div>
                  <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.65, marginBottom: 20 }}>
                    {MSG_PRESET[client._action]?.(fn) || `Reach out to ${fn} now.`}
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.t3, marginBottom: 7 }}>
                      <span>Predicted success rate</span>
                      <span style={{ color: C.cyan, fontWeight: 700 }}>{sr}%</span>
                    </div>
                    <ProgressBar pct={sr} color={C.cyan} height={4} />
                  </div>
                  <button onClick={() => setTab('messages')}
                    style={{ width: '100%', padding: '13px', borderRadius: 11, background: C.cyan, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 22px ${C.cyan}38` }}>
                    <Send style={{ width: 13, height: 13 }} /> Send Message
                  </button>
                </Card>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <SectionLabel>Key Metrics</SectionLabel>
                {[
                  { label: 'Last gym visit',      val: visitLabel, col: client.lastVisit >= 14 ? C.red : client.lastVisit <= 1 ? C.green : C.t1 },
                  { label: 'Sessions this month', val: client.sessionsThisMonth, col: C.t1 },
                  { label: 'Sessions last month', val: client.sessionsLastMonth, col: C.t3 },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: `1px solid ${C.brd}` }}>
                    <span style={{ fontSize: 12.5, color: C.t3 }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: row.col }}>{row.val}</span>
                  </div>
                ))}
                {reasons.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <SectionLabel>Risk Signals</SectionLabel>
                    {reasons.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.amber, marginTop: 7, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.65 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  <SectionLabel>Profile</SectionLabel>
                  {[
                    { label: 'Goal',     val: client.goal || 'General Fitness' },
                    { label: 'No-shows', val: client.consecutiveMissed > 0 ? `${client.consecutiveMissed}` : 'None', danger: client.consecutiveMissed > 0 },
                    { label: 'Streak',   val: client.streak > 0 ? `${client.streak} days` : '—', good: client.streak >= 14 },
                  ].map((row, i, arr) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.brd}` : 'none' }}>
                      <span style={{ fontSize: 12.5, color: C.t3 }}>{row.label}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: row.danger ? C.red : row.good ? C.amber : C.t2 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
                {/* Quick nav shortcuts */}
                <div style={{ marginTop: 8 }}>
                  <SectionLabel>Jump To</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { tab: 'progress', label: 'Progress', col: C.green },
                      { tab: 'nutrition', label: 'Nutrition', col: C.amber },
                      { tab: 'habits', label: 'Habits', col: C.cyan },
                      { tab: 'adherence', label: 'Adherence', col: C.violet },
                    ].map(s => (
                      <button key={s.tab} onClick={() => setTab(s.tab)}
                        style={{ padding: '9px 10px', borderRadius: 9, background: `${s.col}0c`, border: `1px solid ${s.col}20`, color: s.col, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, transition: 'all .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = `${s.col}18`}
                        onMouseLeave={e => e.currentTarget.style.background = `${s.col}0c`}>
                        {s.label} →
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ ACTIVITY ════ */}
          {tab === 'activity' && (() => {
            const attended = MOCK_SESSIONS.filter(s => s.attended).length;
            const missed   = MOCK_SESSIONS.filter(s => !s.attended).length;
            const rate     = Math.round(attended / MOCK_SESSIONS.length * 100);
            const rateCol  = rate >= 70 ? C.green : rate >= 50 ? C.amber : C.red;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 28, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    {[
                      { label: 'Attended',    val: attended,   col: C.green, bg: C.greenD, bdr: C.greenB },
                      { label: 'No-shows',    val: missed,     col: C.red,   bg: C.redD,   bdr: C.redB   },
                      { label: 'Attend rate', val: `${rate}%`, col: rateCol, bg: rateCol === C.green ? C.greenD : rateCol === C.amber ? C.amberD : C.redD, bdr: rateCol === C.green ? C.greenB : rateCol === C.amber ? C.amberB : C.redB },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: '20px', borderRadius: 13, background: s.bg, border: `1px solid ${s.bdr}`, textAlign: 'center' }}>
                        <div style={{ fontSize: 32, fontWeight: 900, color: s.col, lineHeight: 1, letterSpacing: '-0.04em' }}>{s.val}</div>
                        <div style={{ fontSize: 10.5, color: s.col, opacity: 0.65, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <Card>
                    <SectionLabel>Recent Sessions</SectionLabel>
                    {MOCK_SESSIONS.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 15, paddingBottom: 15, borderBottom: i < MOCK_SESSIONS.length - 1 ? `1px solid ${C.brd}` : 'none' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: s.attended ? C.greenD : C.redD, border: `1px solid ${s.attended ? C.greenB : C.redB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {s.attended ? <Check style={{ width: 12, color: C.green }} /> : <X style={{ width: 12, color: C.red }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{s.type}</div>
                          <div style={{ fontSize: 11.5, color: C.t3, marginTop: 2 }}>{s.date} · {s.dur} min</div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, background: s.attended ? C.greenD : C.redD, border: `1px solid ${s.attended ? C.greenB : C.redB}`, color: s.attended ? C.green : C.red }}>
                          {s.attended ? 'Attended' : 'No-show'}
                        </span>
                      </div>
                    ))}
                  </Card>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Card>
                    <SectionLabel>8-Week Activity</SectionLabel>
                    <ActivityHeatmap history={client.retentionHistory} />
                  </Card>
                  <Card>
                    <SectionLabel>Bodyweight</SectionLabel>
                    <div style={{ fontSize: 11, color: C.green, fontWeight: 600, marginBottom: 12 }}>▼ 3.8 kg over 8 weeks</div>
                    <ResponsiveContainer width="100%" height={90}>
                      <AreaChart data={MOCK_WEIGHT} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                        <defs>
                          <linearGradient id="wg2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={C.green} stopOpacity={0.22} />
                            <stop offset="100%" stopColor={C.green} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="w" tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip content={<ChartTip suffix=" kg" />} />
                        <Area type="monotone" dataKey="v" stroke={C.green} strokeWidth={2} fill="url(#wg2)" dot={false} activeDot={{ r: 3, fill: C.green }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </div>
            );
          })()}

          {/* ════ PROGRESS ════ */}
          {tab === 'progress' && <TabProgress />}

          {/* ════ NUTRITION ════ */}
          {tab === 'nutrition' && <TabNutrition />}

          {/* ════ HABITS ════ */}
          {tab === 'habits' && <TabHabits />}

          {/* ════ ADHERENCE ════ */}
          {tab === 'adherence' && <TabAdherence />}

          {/* ════ NOTES ════ */}
          {tab === 'notes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 28, alignItems: 'start' }}>
              <Card>
                <SectionLabel>Session Notes</SectionLabel>
                <NotesPanel />
              </Card>
              <Card>
                <SectionLabel>Health & Restrictions</SectionLabel>
                <InjuryPanel client={client} />
              </Card>
            </div>
          )}

          {/* ════ PROGRAM ════ */}
          {tab === 'program' && <TabProgram client={client} onMessage={onMessage} />}

          {/* ════ MESSAGES ════ */}
          {tab === 'messages' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 28, alignItems: 'start' }}>
              <Card style={{ padding: '26px 28px' }}>
                <SectionLabel>Send Message</SectionLabel>
                <MessageComposer client={client} onMessage={onMessage} />
              </Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SectionLabel>Quick Templates</SectionLabel>
                {COACH_ACTIONS.map((a, i) => (
                  <button key={i} onClick={() => onMessage({ ...client, _action: a })}
                    style={{ width: '100%', padding: '12px 15px', borderRadius: 10, background: C.card, border: `1px solid ${C.brd}`, color: C.t2, cursor: 'pointer', fontFamily: FONT, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanB; e.currentTarget.style.background = C.cyanD; e.currentTarget.style.color = C.t1; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.t2; }}>
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{a}</span>
                    <ChevronRight style={{ width: 12, height: 12, flexShrink: 0, opacity: 0.35 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}