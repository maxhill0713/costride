/**
 * ClientDrawer — elite CRM client detail panel.
 * Full-height 82% drawer with tabbed layout, score ring,
 * activity heatmap, goal rings, and rich message composer.
 */
import React, { useState, useEffect } from 'react';
import {
  X, Send, Check, Flame, ShieldAlert, AlertTriangle,
  BarChart2, Activity, FileText, Dumbbell, MessageSquare,
  TrendingUp, TrendingDown, Minus, Plus, Camera,
  ChevronRight, Utensils, Target,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:     '#0b0b0d',
  card:   '#141416',
  card2:  '#18181b',
  brd:    '#222226',
  brd2:   '#2a2a30',
  t1:     '#ffffff',
  t2:     '#8a8a94',
  t3:     '#444450',
  cyan:   '#4d7fff',
  cyanD:  'rgba(77,127,255,0.08)',
  cyanB:  'rgba(77,127,255,0.25)',
  red:    '#ff4d6d',
  redD:   'rgba(255,77,109,0.1)',
  redB:   'rgba(255,77,109,0.25)',
  amber:  '#f59e0b',
  amberD: 'rgba(245,158,11,0.1)',
  amberB: 'rgba(245,158,11,0.25)',
  green:  '#22c55e',
  greenD: 'rgba(34,197,94,0.1)',
  greenB: 'rgba(34,197,94,0.25)',
  blue:   '#3b82f6',
  blueD:  'rgba(59,130,246,0.1)',
  blueB:  'rgba(59,130,246,0.25)',
};
const FONT = "'DM Sans','Segoe UI',sans-serif";
const AV_COLORS = ['#4d7fff','#22c55e','#f59e0b','#ff4d6d','#a78bfa','#06b6d4','#f97316','#14b8a6'];

const COACH_ACTIONS = [
  'Check in','Book session','Send message',
  'Celebrate progress','Missed sessions',
  'Custom plan offer','Upgrade plan','Welcome back',
];
const MSG_PRESET = {
  'Check in':           fn => `Hey ${fn}, just checking in — how are things going? Let me know if you need anything.`,
  'Book session':       fn => `Hi ${fn}, I have some slots available this week. Want to book in for a session?`,
  'Send message':       fn => `Hi ${fn}, hope you're well! Wanted to touch base and see how training's going.`,
  'Celebrate progress': fn => `${fn} — you've been absolutely crushing it lately! Your consistency is seriously impressive.`,
  'Missed sessions':    fn => `Hi ${fn}, we noticed you haven't been in for a bit. Just checking everything's okay.`,
  'Custom plan offer':  fn => `Hey ${fn}, I've been thinking about your goals and have ideas for a custom plan. Interested?`,
  'Upgrade plan':       fn => `Hey ${fn}, given how consistent you've been, I think you'd benefit from stepping up your plan.`,
  'Welcome back':       fn => `Hi ${fn}, great to have you back! We've got exciting sessions lined up — let's pick up where you left off.`,
};

/* ─── HELPERS ────────────────────────────────────────────────── */
function scoreColor(s) {
  if (s >= 80) return C.green;
  if (s >= 60) return C.t2;
  if (s >= 40) return C.amber;
  return C.red;
}
function scoreTier(s) {
  if (s >= 80) return { label:'Healthy', color:C.green, bg:C.greenD, bdr:C.greenB };
  if (s >= 60) return { label:'Stable',  color:C.t2,   bg:'rgba(138,138,148,0.08)', bdr:'rgba(138,138,148,0.2)' };
  if (s >= 40) return { label:'Caution', color:C.amber, bg:C.amberD, bdr:C.amberB };
  return             { label:'At Risk', color:C.red,   bg:C.redD,   bdr:C.redB };
}
function riskReasons(client) {
  const r = [];
  if (client.lastVisit >= 21)  r.push('No visit in 3+ weeks');
  else if (client.lastVisit >= 14) r.push('No visit in 2+ weeks');
  if (client.sessionsThisMonth === 0 && client.sessionsLastMonth === 0) r.push('Zero sessions in 2 months');
  else if (client.sessionsThisMonth < client.sessionsLastMonth) r.push('Sessions declining');
  if (client.consecutiveMissed >= 2) r.push(`${client.consecutiveMissed} no-shows`);
  if (!r.length && client.retentionScore < 40) r.push('Low engagement');
  return r;
}
function successRate(client) {
  return Math.max(20, Math.min(95, Math.round(100 - (100 - client.retentionScore) * 0.6)));
}

/* ─── MOCK DATA ──────────────────────────────────────────────── */
const MOCK_WEIGHT = [
  { w:'8wk', v:76.2 }, { w:'7wk', v:75.8 }, { w:'6wk', v:75.1 },
  { w:'5wk', v:74.5 }, { w:'4wk', v:74.0 }, { w:'3wk', v:73.4 },
  { w:'2wk', v:72.9 }, { w:'Now', v:72.4 },
];
const MOCK_PERF = [
  { name:'Squat 1RM', current:62, target:80, unit:'kg' },
  { name:'5km Run',   current:28, target:25, unit:'min', lower:true },
];
const MOCK_SESSIONS = [
  { date:'23 May', type:'Upper Strength', dur:55, attended:true  },
  { date:'20 May', type:'HIIT Cardio',    dur:45, attended:true  },
  { date:'17 May', type:'Lower Body',     dur:60, attended:false },
  { date:'14 May', type:'Full Body',      dur:50, attended:false },
  { date:'10 May', type:'Upper Strength', dur:55, attended:true  },
];

/* ─── AVATAR ─────────────────────────────────────────────────── */
function Av({ client, size=30, avatarMap={} }) {
  const col = AV_COLORS[(client.id||client.name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % AV_COLORS.length];
  const src = avatarMap[client.id] || client.avatar || null;
  const ini = (client.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  if (src) return <img src={src} alt={client.name} style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, objectFit:'cover', border:`2px solid ${col}55` }} />;
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, background:col+'1a', color:col, fontSize:size*0.32, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${col}33`, fontFamily:'monospace' }}>
      {ini}
    </div>
  );
}

/* ─── CHART TOOLTIP ──────────────────────────────────────────── */
function ChartTip({ active, payload, suffix='' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#111c2a', border:`1px solid ${C.cyanB}`, borderRadius:7, padding:'5px 10px', fontSize:11.5, color:C.t1 }}>
      <span style={{ color:C.cyan, fontWeight:700 }}>{payload[0].value}{suffix}</span>
    </div>
  );
}

/* ─── SCORE RING ─────────────────────────────────────────────── */
function ScoreRing({ score, size=100, stroke=7 }) {
  const color = scoreColor(score);
  const r = (size - stroke*2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 8px ${color}88)` }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:size*0.24, fontWeight:800, color, letterSpacing:'-0.04em', lineHeight:1 }}>{score}</div>
        <div style={{ fontSize:size*0.1, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 }}>score</div>
      </div>
    </div>
  );
}

/* ─── GOAL RING ──────────────────────────────────────────────── */
function GoalRing({ pct, color, label, val, target, unit, size=72 }) {
  const stroke = 5;
  const r = (size - stroke*2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100,pct) / 100) * circ;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:13, fontWeight:800, color, lineHeight:1 }}>{pct}%</div>
        </div>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.t1, lineHeight:1.3 }}>{label}</div>
        <div style={{ fontSize:10, color:C.t3, marginTop:2 }}>{val} → {target} {unit}</div>
      </div>
    </div>
  );
}

/* ─── ACTIVITY HEATMAP ───────────────────────────────────────── */
function ActivityHeatmap({ history = [] }) {
  const weeks = history.length ? history : Array.from({length:8}, () => 50);
  const days = ['M','T','W','T','F','S','S'];
  const getColor = v => v > 75 ? C.green : v > 50 ? C.cyan : v > 25 ? C.amber : C.red;
  const getOpacity = v => Math.max(0.08, v / 100 * 0.85);
  // seed-based pseudo-random for deterministic display
  const hash = (wi, di) => ((wi * 7 + di) * 2654435761) >>> 0;
  const variance = (wi, di) => ((hash(wi, di) % 60) - 30);
  return (
    <div>
      <div style={{ display:'flex', gap:3, marginBottom:5 }}>
        {days.map((d,i) => <div key={i} style={{ flex:1, textAlign:'center', fontSize:9, color:C.t3, textTransform:'uppercase', letterSpacing:'0.04em' }}>{d}</div>)}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
        {weeks.map((wv, wi) => (
          <div key={wi} style={{ display:'flex', gap:3 }}>
            {days.map((_d, di) => {
              const v = Math.max(0, Math.min(100, wv + variance(wi, di)));
              const col = getColor(v);
              return (
                <div key={di} title={`${Math.round(v)}% engagement`}
                  style={{ flex:1, height:11, borderRadius:2, background:col, opacity:getOpacity(v), cursor:'default', transition:'opacity .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.opacity='1'}
                  onMouseLeave={e=>e.currentTarget.style.opacity=String(getOpacity(v))} />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, justifyContent:'flex-end' }}>
        {[['Low',C.red],['Mid',C.amber],['Good',C.cyan],['High',C.green]].map(([l,col],i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:3 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:col, opacity:0.7 }} />
            <span style={{ fontSize:9, color:C.t3 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── INJURIES ───────────────────────────────────────────────── */
function InjuryPanel({ client }) {
  const [injuries, setInjuries] = useState(
    client.injuries?.length ? client.injuries : [
      { id:1, area:'Right Knee', severity:'Moderate', notes:'Avoid heavy squats and deep lunges.' },
    ]
  );
  const [form, setForm] = useState({ area:'', severity:'Mild', notes:'' });
  const [adding, setAdding] = useState(false);
  const sevColor = s => s==='Cleared'?C.green:s==='Severe'?C.red:C.amber;
  const sevBg    = s => s==='Cleared'?C.greenD:s==='Severe'?C.redD:C.amberD;
  const sevBdr   = s => s==='Cleared'?C.greenB:s==='Severe'?C.redB:C.amberB;
  return (
    <div style={{ borderRadius:12, background:C.card, border:`1px solid ${C.brd}`, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <ShieldAlert style={{ width:14, height:14, color:C.amber }} />
          <span style={{ fontSize:13, fontWeight:700, color:C.t1 }}>Health & Restrictions</span>
        </div>
        <button onClick={()=>setAdding(v=>!v)} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, background:C.cyanD, border:`1px solid ${C.cyanB}`, color:C.cyan, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:FONT }}>
          <Plus style={{ width:10, height:10 }} /> Add
        </button>
      </div>
      <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:8 }}>
        {injuries.length === 0 && !adding && (
          <div style={{ fontSize:12, color:C.t3, textAlign:'center', padding:'16px 0' }}>No restrictions logged</div>
        )}
        {injuries.map((inj,i) => (
          <div key={inj.id||i} style={{ padding:'12px 14px', borderRadius:10, background:sevBg(inj.severity), border:`1px solid ${sevBdr(inj.severity)}`, borderLeft:`3px solid ${sevColor(inj.severity)}` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:13, fontWeight:700, color:sevColor(inj.severity) }}>{inj.area}</span>
              <span style={{ fontSize:11, color:sevColor(inj.severity), fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${sevColor(inj.severity)}15` }}>{inj.severity}</span>
            </div>
            {inj.notes && <div style={{ fontSize:12, color:C.t2, lineHeight:1.55 }}>{inj.notes}</div>}
          </div>
        ))}
        {adding && (
          <div style={{ padding:'14px', borderRadius:10, background:C.card2, border:`1px solid ${C.brd}` }}>
            <div style={{ fontSize:10.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Area</div>
            <input value={form.area} onChange={e=>setForm(p=>({...p,area:e.target.value}))} placeholder="e.g. Left Shoulder"
              style={{ width:'100%', boxSizing:'border-box', background:C.card, border:`1px solid ${C.brd}`, borderRadius:8, color:C.t1, fontSize:13, outline:'none', padding:'9px 12px', marginBottom:10, fontFamily:FONT }} />
            <div style={{ fontSize:10.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Severity</div>
            <select value={form.severity} onChange={e=>setForm(p=>({...p,severity:e.target.value}))}
              style={{ width:'100%', background:C.card, border:`1px solid ${C.brd}`, color:C.t2, fontSize:13, borderRadius:8, padding:'9px 12px', marginBottom:10, fontFamily:FONT, outline:'none' }}>
              {['Mild','Moderate','Severe','Cleared'].map(s=><option key={s}>{s}</option>)}
            </select>
            <input value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Notes (optional)"
              style={{ width:'100%', boxSizing:'border-box', background:C.card, border:`1px solid ${C.brd}`, borderRadius:8, color:C.t1, fontSize:13, outline:'none', padding:'9px 12px', marginBottom:12, fontFamily:FONT }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{ if(form.area.trim()){ setInjuries(p=>[...p,{id:Date.now(),...form}]); setForm({area:'',severity:'Mild',notes:''}); setAdding(false); } }}
                style={{ flex:1, padding:'9px', borderRadius:9, background:C.cyan, border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:FONT }}>Save</button>
              <button onClick={()=>setAdding(false)}
                style={{ flex:1, padding:'9px', borderRadius:9, background:C.card, border:`1px solid ${C.brd}`, color:C.t2, fontSize:12, cursor:'pointer', fontFamily:FONT }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── NOTES PANEL ────────────────────────────────────────────── */
function NotesPanel() {
  const [notes, setNotes] = useState([
    { id:1, date:'23 May 2024', text:'Great session today. Right knee improving significantly. Recommended 3x/week with modified squats.' },
    { id:2, date:'10 May 2024', text:'Hit a new squat PB at 62kg — client is extremely motivated. Increase load by 2.5kg next session.' },
    { id:3, date:'28 Apr 2024', text:'Missed last two sessions. Following up — client mentioned work stress. Suggested lighter recovery week.' },
  ]);
  const [text, setText] = useState('');
  const addNote = () => {
    if (!text.trim()) return;
    const date = new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
    setNotes(p=>[{id:Date.now(),date,text:text.trim()},...p]);
    setText('');
  };
  return (
    <div style={{ borderRadius:12, background:C.card, border:`1px solid ${C.brd}`, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', gap:8 }}>
        <FileText style={{ width:14, height:14, color:C.cyan }} />
        <span style={{ fontSize:13, fontWeight:700, color:C.t1 }}>Session Notes</span>
      </div>
      <div style={{ padding:'16px 18px' }}>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&e.metaKey) addNote(); }} placeholder="Add a session note… (⌘Enter to save)"
            rows={3} style={{ flex:1, background:C.card2, border:`1px solid ${C.brd}`, borderRadius:10, color:C.t1, fontSize:13, outline:'none', padding:'10px 13px', fontFamily:FONT, resize:'none', lineHeight:1.6, transition:'border-color .15s' }}
            onFocus={e=>e.currentTarget.style.borderColor=C.cyanB}
            onBlur={e=>e.currentTarget.style.borderColor=C.brd} />
          <button onClick={addNote} style={{ padding:'0 14px', borderRadius:10, background:C.cyanD, border:`1px solid ${C.cyanB}`, color:C.cyan, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, alignSelf:'stretch' }}>
            <Plus style={{ width:14, height:14 }} />
          </button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {notes.map((n,i) => (
            <div key={n.id} style={{ padding:'14px 0', borderBottom:i<notes.length-1?`1px solid ${C.brd}`:'none' }}>
              <div style={{ fontSize:10.5, color:C.t3, marginBottom:5, fontWeight:600 }}>{n.date}</div>
              <div style={{ fontSize:13, color:C.t2, lineHeight:1.65 }}>{n.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── MESSAGE COMPOSER ───────────────────────────────────────── */
function MessageComposer({ client, onMessage }) {
  const fn = (client?.name||'there').split(' ')[0];
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
    <div>
      <div style={{ fontSize:10.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:7 }}>Template</div>
      <select value={action} onChange={e=>{ setAction(e.target.value); setBody(MSG_PRESET[e.target.value]?.(fn)||`Hi ${fn}, just checking in!`); }}
        style={{ width:'100%', marginBottom:14, padding:'10px 13px', borderRadius:9, background:C.card2, border:`1px solid ${C.brd}`, color:C.t2, fontSize:13, fontFamily:FONT, outline:'none', cursor:'pointer' }}>
        {COACH_ACTIONS.map(a=><option key={a} value={a}>{a}</option>)}
      </select>
      <div style={{ fontSize:10.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:7 }}>Message</div>
      <textarea value={body} onChange={e=>setBody(e.target.value)} rows={5}
        style={{ width:'100%', boxSizing:'border-box', background:C.card2, border:`1px solid ${C.brd}`, borderRadius:10, padding:'13px 14px', fontSize:13, color:C.t1, resize:'none', outline:'none', lineHeight:1.7, fontFamily:FONT, marginBottom:12, transition:'border-color .15s' }}
        onFocus={e=>e.currentTarget.style.borderColor=C.cyanB}
        onBlur={e=>e.currentTarget.style.borderColor=C.brd} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontSize:11.5, color:C.t3 }}>
          <span style={{ color:C.cyan, fontWeight:700 }}>{sr}%</span> predicted response rate
        </span>
        <span style={{ fontSize:11, color:C.t3 }}>{body.length} chars</span>
      </div>
      <button onClick={handleSend}
        style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          background:sent?C.greenD:C.cyan, color:sent?C.green:'#fff',
          outline:sent?`1px solid ${C.greenB}`:'none',
          boxShadow:sent?'none':`0 4px 18px ${C.cyan}44`,
          transition:'all 0.25s cubic-bezier(.16,1,.3,1)', fontFamily:FONT }}>
        {sent ? <><Check style={{ width:14, height:14 }} /> Message sent!</> : <><Send style={{ width:14, height:14 }} /> Send to {fn}</>}
      </button>
    </div>
  );
}

/* ─── TAB DEFINITIONS ────────────────────────────────────────── */
const DRAWER_TABS = [
  { id:'overview',  label:'Overview',  icon:BarChart2     },
  { id:'activity',  label:'Activity',  icon:Activity      },
  { id:'notes',     label:'Notes',     icon:FileText      },
  { id:'content',   label:'Content',   icon:Dumbbell      },
  { id:'messages',  label:'Messages',  icon:MessageSquare },
];

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT — ClientDrawer
══════════════════════════════════════════════════════════════ */
export default function ClientDrawer({ client, onClose, onMessage, avatarMap = {} }) {
  const [drawerTab, setDrawerTab] = useState('overview');
  const sc      = scoreColor(client.retentionScore);
  const tier    = scoreTier(client.retentionScore);
  const reasons = riskReasons(client);
  const sr      = successRate(client);
  const visitLabel = client.lastVisit>=999?'Never':client.lastVisit===0?'Today':`${client.lastVisit}d ago`;
  const visitCol   = client.lastVisit>=14?C.red:client.lastVisit<=1?C.cyan:C.t1;
  const sessionDelta = client.sessionsThisMonth - client.sessionsLastMonth;
  const activeInj  = (client.injuries||[]).filter(i=>i.severity!=='Cleared').length;
  const avCol = AV_COLORS[(client.id||client.name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % AV_COLORS.length];

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', animation:'tcm2FadeUp .18s ease both' }} />

      {/* Drawer */}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0,
        width:'82%', maxWidth:1200,
        background:'#0a0a0c',
        borderLeft:`1px solid ${C.brd}`,
        zIndex:401, display:'flex', flexDirection:'column',
        boxShadow:'-32px 0 120px rgba(0,0,0,0.85)',
        fontFamily:FONT,
        animation:'tcm2SlideIn .3s cubic-bezier(.16,1,.3,1) both',
      }}>

        {/* ══ HERO HEADER ══ */}
        <div style={{ flexShrink:0, position:'relative', overflow:'hidden' }}>
          {/* Ambient glow backdrop */}
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg, ${avCol}14 0%, transparent 50%, ${sc}06 100%)`, pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent 0%, ${avCol}60 30%, ${avCol}60 70%, transparent 100%)`, pointerEvents:'none' }} />

          <div style={{ padding:'24px 32px 0', position:'relative' }}>
            {/* Identity row */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:22 }}>
              <div style={{ display:'flex', alignItems:'center', gap:18 }}>
                <div style={{ position:'relative' }}>
                  <Av client={client} size={62} avatarMap={avatarMap} />
                  {client.streak >= 5 && (
                    <div style={{ position:'absolute', bottom:-3, right:-3, width:22, height:22, borderRadius:'50%', background:'#0a0a0c', display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${C.brd}` }}>
                      <Flame style={{ width:12, height:12, color:C.amber }} />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                    <div style={{ fontSize:24, fontWeight:800, color:C.t1, letterSpacing:'-0.03em' }}>{client.name}</div>
                    <span style={{ padding:'4px 11px', borderRadius:20, background:tier.bg, border:`1px solid ${tier.bdr}`, fontSize:11, fontWeight:700, color:tier.color }}>{tier.label}</span>
                    {client.isNew && <span style={{ padding:'4px 11px', borderRadius:20, background:C.blueD, border:`1px solid ${C.blueB}`, fontSize:11, fontWeight:700, color:C.blue }}>New</span>}
                    {client.streak >= 14 && <span style={{ padding:'4px 11px', borderRadius:20, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.22)', fontSize:11, fontWeight:700, color:C.amber }}>🔥 {client.streak}d streak</span>}
                  </div>
                  <div style={{ fontSize:13, color:C.t3, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span>Since {client.joinDate}</span>
                    <span style={{ color:C.brd }}>·</span>
                    <span>{client.goal || 'General Fitness'}</span>
                    {client.nextSession && (
                      <>
                        <span style={{ color:C.brd }}>·</span>
                        <span style={{ color:C.cyan, fontWeight:600 }}>Next: {client.nextSession}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:9, flexShrink:0 }}>
                <button onClick={()=>onMessage(client)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 22px', borderRadius:11, background:C.cyan, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FONT, boxShadow:`0 4px 20px ${C.cyan}44`, transition:'opacity .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.opacity='0.88'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                  <Send style={{ width:13, height:13 }} /> {client._action}
                </button>
                <button onClick={onClose}
                  style={{ width:40, height:40, borderRadius:11, background:'rgba(255,255,255,0.04)', border:`1px solid ${C.brd}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor=C.brd2; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor=C.brd; }}>
                  <X style={{ width:16, height:16, color:C.t2 }} />
                </button>
              </div>
            </div>

            {/* KPI strip — 6 stat tiles */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:22 }}>
              {[
                { label:'Last Visit',     val:visitLabel,                                col:visitCol,                         sub: client.lastVisit>=14?'⚠ Needs attention':'Active' },
                { label:'Sessions/Mo',    val:client.sessionsThisMonth,                  col:C.t1,                             sub: sessionDelta===0?'No change':`${sessionDelta>0?'+':''}${sessionDelta} vs last mo.` },
                { label:'Streak',         val:client.streak>0?`${client.streak}d`:'—',   col:client.streak>=14?C.amber:C.t1,   sub: client.streak>=14?'On fire 🔥':'Keep going' },
                { label:'Retention',      val:`${client.retentionScore}`,                col:sc,                               sub: tier.label },
                { label:'Msg Success',    val:`${sr}%`,                                  col:C.cyan,                           sub: 'predicted response' },
                { label:'2-Mo Sessions',  val:client.sessionsThisMonth+client.sessionsLastMonth, col:C.t1,                    sub: 'cumulative total' },
              ].map((s,i) => (
                <div key={i} style={{ padding:'13px 15px', borderRadius:11, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.brd}`, transition:'border-color .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.brd2}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.brd}>
                  <div style={{ fontSize:9.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:s.col, letterSpacing:'-0.03em', lineHeight:1, marginBottom:4 }}>{s.val}</div>
                  <div style={{ fontSize:10, color:C.t3 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Tab bar */}
            <div style={{ display:'flex', marginBottom:-1 }}>
              {DRAWER_TABS.map(t => {
                const Icon = t.icon;
                const on = drawerTab === t.id;
                return (
                  <button key={t.id} onClick={()=>setDrawerTab(t.id)} style={{
                    display:'flex', alignItems:'center', gap:7, padding:'12px 22px',
                    background:'transparent', border:'none', outline:'none',
                    borderBottom:`2px solid ${on?C.cyan:'transparent'}`,
                    color:on?C.t1:C.t3, fontSize:13, fontWeight:on?700:400,
                    cursor:'pointer', fontFamily:FONT, transition:'color .15s, border-color .15s',
                    letterSpacing:'-0.01em',
                  }}
                    onMouseEnter={e=>{ if(!on) e.currentTarget.style.color=C.t2; }}
                    onMouseLeave={e=>{ if(!on) e.currentTarget.style.color=C.t3; }}>
                    <Icon style={{ width:13, height:13 }} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ height:1, background:C.brd }} />
        </div>

        {/* ══ SCROLLABLE CONTENT ══ */}
        <div className="tcm2-scr" style={{ flex:1, overflowY:'auto', padding:'28px 32px 52px', background:'#0a0a0c' }}>

          {/* ── OVERVIEW ── */}
          {drawerTab === 'overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, alignItems:'start' }}>

              {/* Col 1: Score ring + alerts */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ padding:'26px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}`, display:'flex', flexDirection:'column', alignItems:'center', gap:18 }}>
                  <ScoreRing score={client.retentionScore} size={108} />
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:17, fontWeight:800, color:tier.color, letterSpacing:'-0.02em' }}>{tier.label}</div>
                    <div style={{ fontSize:12, color:C.t3, marginTop:5 }}>Retention tier · {sr}% outreach success</div>
                  </div>
                  {/* Mini sparkline */}
                  <div style={{ width:'100%' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.t3, marginBottom:7 }}>
                      <span>Session trend</span>
                      <span style={{ color:sessionDelta>0?C.green:sessionDelta<0?C.red:C.t3, fontWeight:600 }}>
                        {sessionDelta>0?'↑ ':sessionDelta<0?'↓ ':'→ '}{Math.abs(sessionDelta)} vs last
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:38 }}>
                      {(client.retentionHistory||Array.from({length:8},()=>50)).map((v,i)=>(
                        <div key={i} style={{ flex:1, borderRadius:'3px 3px 0 0', background:i===7?C.cyan:C.cyanD, height:`${Math.max(10,v)}%`, border:i===7?`1px solid ${C.cyanB}`:'none' }} />
                      ))}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:C.t3, marginTop:3 }}>
                      <span>8wk ago</span><span style={{ color:C.cyan }}>Now</span>
                    </div>
                  </div>
                </div>

                {client.status === 'at_risk' && (
                  <div style={{ padding:'16px 18px', borderRadius:12, background:'rgba(255,77,109,0.07)', border:`1px solid ${C.redB}`, borderLeft:`3px solid ${C.red}` }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.red, marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                      <AlertTriangle style={{ width:12, height:12 }} /> High Churn Risk
                    </div>
                    <div style={{ fontSize:12, color:C.t2, lineHeight:1.65 }}>{reasons[0] || 'Low engagement detected'}</div>
                    {reasons.length > 1 && <div style={{ fontSize:11, color:C.t3, marginTop:4 }}>+{reasons.length-1} more signal{reasons.length>2?'s':''}</div>}
                  </div>
                )}
                {activeInj > 0 && (
                  <div style={{ padding:'16px 18px', borderRadius:12, background:C.amberD, border:`1px solid ${C.amberB}`, borderLeft:`3px solid ${C.amber}` }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.amber, marginBottom:5, display:'flex', alignItems:'center', gap:6 }}>
                      <ShieldAlert style={{ width:12, height:12 }} /> {activeInj} Active Restriction{activeInj>1?'s':''}
                    </div>
                    <div style={{ fontSize:12, color:C.t2 }}>Modify workouts before next heavy session.</div>
                  </div>
                )}
              </div>

              {/* Col 2: Recommended action + heatmap */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ padding:'22px', borderRadius:14, background:`linear-gradient(135deg, rgba(77,127,255,0.1), rgba(77,127,255,0.03))`, border:`1px solid ${C.cyanB}`, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-24, right:-24, width:90, height:90, borderRadius:'50%', background:`${C.cyan}06`, pointerEvents:'none' }} />
                  <div style={{ fontSize:10, color:C.cyan, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10, fontWeight:700 }}>✦ AI Recommendation</div>
                  <div style={{ fontSize:18, fontWeight:800, color:C.t1, marginBottom:14, letterSpacing:'-0.02em', lineHeight:1.3 }}>{client._action}</div>
                  <div style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.t3, marginBottom:6 }}>
                      <span>Predicted success rate</span><span style={{ color:C.cyan, fontWeight:700 }}>{sr}%</span>
                    </div>
                    <div style={{ height:5, background:'rgba(77,127,255,0.12)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ width:`${sr}%`, height:'100%', background:`linear-gradient(90deg, ${C.cyan}, #7ab8ff)`, borderRadius:3 }} />
                    </div>
                  </div>
                  <button onClick={()=>setDrawerTab('messages')}
                    style={{ width:'100%', padding:'10px', borderRadius:10, background:C.cyan, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                    <Send style={{ width:12, height:12 }} /> Send Now
                  </button>
                </div>

                <div style={{ padding:'20px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.t1 }}>Gym Activity</div>
                    <div style={{ fontSize:10, color:C.t3 }}>8-week heatmap</div>
                  </div>
                  <ActivityHeatmap history={client.retentionHistory} />
                </div>
              </div>

              {/* Col 3: Month comparison + profile */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ padding:'20px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:16 }}>Monthly Sessions</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                    {[
                      { label:'This Month', val:client.sessionsThisMonth, col:C.t1 },
                      { label:'Last Month', val:client.sessionsLastMonth, col:C.t3 },
                    ].map((s,i) => (
                      <div key={i} style={{ padding:'14px', borderRadius:10, background:C.card2, border:`1px solid ${C.brd}`, textAlign:'center' }}>
                        <div style={{ fontSize:30, fontWeight:900, color:s.col, lineHeight:1, letterSpacing:'-0.04em' }}>{s.val}</div>
                        <div style={{ fontSize:10, color:C.t3, marginTop:7, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 13px', borderRadius:9, background:sessionDelta>0?C.greenD:sessionDelta<0?C.redD:'rgba(255,255,255,0.03)', border:`1px solid ${sessionDelta>0?C.greenB:sessionDelta<0?C.redB:C.brd}` }}>
                    {sessionDelta>0 ? <TrendingUp style={{ width:13, height:13, color:C.green, flexShrink:0 }} /> : sessionDelta<0 ? <TrendingDown style={{ width:13, height:13, color:C.red, flexShrink:0 }} /> : <Minus style={{ width:13, height:13, color:C.t3, flexShrink:0 }} />}
                    <span style={{ fontSize:12, fontWeight:600, color:sessionDelta>0?C.green:sessionDelta<0?C.red:C.t3 }}>
                      {sessionDelta===0 ? 'No change from last month' : `${Math.abs(sessionDelta)} session${Math.abs(sessionDelta)>1?'s':''} ${sessionDelta>0?'more':'fewer'} this month`}
                    </span>
                  </div>
                </div>

                <div style={{ padding:'20px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:14 }}>Client Profile</div>
                  {[
                    { label:'Status',        val: client.status==='active'?'Active':`${client.status.replace('_',' ')}`, col: client.status==='active'?C.green:C.amber },
                    { label:'Member since',  val: client.joinDate, col: C.t2 },
                    { label:'Goal',          val: client.goal||'General Fitness', col: C.t2 },
                    { label:'No-shows',      val: client.consecutiveMissed>0?`${client.consecutiveMissed}`:'None', col: client.consecutiveMissed>0?C.red:C.green },
                    { label:'Is new client', val: client.isNew?'Yes':'No', col: client.isNew?C.blue:C.t3 },
                  ].map((row,i,arr) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<arr.length-1?`1px solid ${C.brd}`:'none' }}>
                      <span style={{ fontSize:12, color:C.t3 }}>{row.label}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:row.col, textTransform:'capitalize' }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {drawerTab === 'activity' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.t1, letterSpacing:'-0.01em' }}>Attendance & Sessions</div>
                {(() => {
                  const attended = MOCK_SESSIONS.filter(s=>s.attended).length;
                  const missed   = MOCK_SESSIONS.filter(s=>!s.attended).length;
                  const rate     = Math.round(attended/MOCK_SESSIONS.length*100);
                  return (
                    <>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                        {[
                          { label:'Attended', val:attended,   col:C.green, bg:C.greenD, bdr:C.greenB },
                          { label:'Missed',   val:missed,     col:C.red,   bg:C.redD,   bdr:C.redB   },
                          { label:'Rate',     val:`${rate}%`, col:rate>=70?C.green:rate>=50?C.amber:C.red, bg:rate>=70?C.greenD:rate>=50?C.amberD:C.redD, bdr:rate>=70?C.greenB:rate>=50?C.amberB:C.redB },
                        ].map((s,i) => (
                          <div key={i} style={{ padding:'18px', borderRadius:12, background:s.bg, border:`1px solid ${s.bdr}`, textAlign:'center' }}>
                            <div style={{ fontSize:28, fontWeight:800, color:s.col, lineHeight:1 }}>{s.val}</div>
                            <div style={{ fontSize:10, color:s.col, opacity:0.7, marginTop:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${C.brd}` }}>
                        {MOCK_SESSIONS.map((s,i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:i%2===0?C.card:C.card2, borderBottom:i<MOCK_SESSIONS.length-1?`1px solid ${C.brd}`:'none' }}>
                            <div style={{ width:30, height:30, borderRadius:9, background:s.attended?C.greenD:C.redD, border:`1px solid ${s.attended?C.greenB:C.redB}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              {s.attended ? <Check style={{ width:13, color:C.green }} /> : <X style={{ width:13, color:C.red }} />}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:13, fontWeight:600, color:C.t1 }}>{s.type}</div>
                              <div style={{ fontSize:11, color:C.t3, marginTop:2 }}>{s.date} · {s.dur} min</div>
                            </div>
                            <span style={{ flexShrink:0, padding:'3px 10px', borderRadius:20, fontSize:10.5, fontWeight:700, background:s.attended?C.greenD:C.redD, border:`1px solid ${s.attended?C.greenB:C.redB}`, color:s.attended?C.green:C.red }}>
                              {s.attended?'Attended':'No-show'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.t1, letterSpacing:'-0.01em' }}>Body & Performance</div>

                {/* Weight chart */}
                <div style={{ padding:'20px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.t1 }}>Bodyweight</div>
                    <div style={{ fontSize:12, fontWeight:700, color:C.green }}>▼ 3.8kg over 8 weeks</div>
                  </div>
                  <ResponsiveContainer width="100%" height={110}>
                    <AreaChart data={MOCK_WEIGHT} margin={{ top:4, right:4, bottom:0, left:-28 }}>
                      <defs>
                        <linearGradient id="wgrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.green} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={C.green} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="w" tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} domain={['auto','auto']} />
                      <Tooltip content={<ChartTip suffix=" kg" />} />
                      <Area type="monotone" dataKey="v" stroke={C.green} strokeWidth={2.5} fill="url(#wgrad2)" dot={false}
                        activeDot={{ r:4, fill:C.green, strokeWidth:2, stroke:'#0a0a0c' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance metrics */}
                <div style={{ padding:'20px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:16 }}>Performance Metrics</div>
                  {MOCK_PERF.map((p,i) => {
                    const pct = p.lower
                      ? Math.round(Math.max(0,Math.min(100,(p.target/p.current)*100)))
                      : Math.round(Math.max(0,Math.min(100,(p.current/p.target)*100)));
                    const col = pct>=80?C.green:pct>=50?C.cyan:C.amber;
                    return (
                      <div key={i} style={{ marginBottom:i<MOCK_PERF.length-1?18:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:C.t2 }}>{p.name}</span>
                          <span style={{ fontSize:13, fontWeight:700, color:col }}>{p.current} <span style={{ color:C.t3, fontWeight:400 }}>/ {p.target} {p.unit}</span></span>
                        </div>
                        <div style={{ height:6, background:C.brd, borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg, ${col}, ${col}99)`, borderRadius:3 }} />
                        </div>
                        <div style={{ fontSize:10.5, color:C.t3, marginTop:5 }}>{pct}% to goal</div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress photos */}
                <div style={{ padding:'20px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:14 }}>Progress Photos</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                    {['Jan','Mar','May'].map((m,i) => (
                      <div key={i} style={{ aspectRatio:'3/4', borderRadius:12, background:C.card2, border:`1px solid ${C.brd}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer', transition:'border-color .15s' }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=C.brd2}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=C.brd}>
                        <Camera style={{ width:18, height:18, color:C.t3 }} />
                        <span style={{ fontSize:11, color:C.t3, fontWeight:600 }}>{m} 2024</span>
                        <span style={{ fontSize:10, color:C.t3 }}>Add photo</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTES ── */}
          {drawerTab === 'notes' && (
            <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:20, alignItems:'start' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.t1, letterSpacing:'-0.01em' }}>Session Notes</div>
                <NotesPanel />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.t1, letterSpacing:'-0.01em' }}>Health & Restrictions</div>
                <InjuryPanel client={client} />
                {reasons.length > 0 && (
                  <div style={{ padding:'18px', borderRadius:12, background:C.card, border:`1px solid ${C.brd}` }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Risk Signals</div>
                    {reasons.map((r,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:9, marginBottom:i<reasons.length-1?10:0 }}>
                        <div style={{ width:5, height:5, borderRadius:'50%', background:C.amber, marginTop:6, flexShrink:0 }} />
                        <span style={{ fontSize:12.5, color:C.t2, lineHeight:1.6 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CONTENT ── */}
          {drawerTab === 'content' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.t1, letterSpacing:'-0.01em' }}>Assigned Plans</div>
                {[
                  { icon:Dumbbell,  label:'Workout Plan',   val:'Fat Loss Phase 2',  sub:'Week 4 of 8 · 3×/week',          col:C.cyan,  colD:C.cyanD,  colB:C.cyanB,  actionLabel:'Change Plan',       pct:50 },
                  { icon:Utensils,  label:'Nutrition Plan', val:'Moderate Deficit',  sub:'1,720 kcal · 140g protein/day',  col:C.green, colD:C.greenD, colB:C.greenB, actionLabel:'Update Nutrition',  pct:65 },
                ].map((item,i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} style={{ padding:'22px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                        <div style={{ width:44, height:44, borderRadius:12, background:item.colD, border:`1px solid ${item.colB}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Icon style={{ width:20, height:20, color:item.col }} />
                        </div>
                        <div>
                          <div style={{ fontSize:11, color:item.col, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{item.label}</div>
                          <div style={{ fontSize:16, fontWeight:800, color:C.t1, letterSpacing:'-0.02em' }}>{item.val}</div>
                          <div style={{ fontSize:12, color:C.t3, marginTop:2 }}>{item.sub}</div>
                        </div>
                      </div>
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.t3, marginBottom:6 }}>
                          <span>Programme progress</span><span style={{ color:item.col, fontWeight:600 }}>{item.pct}%</span>
                        </div>
                        <div style={{ height:6, background:C.brd, borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${item.pct}%`, height:'100%', background:item.col, borderRadius:3 }} />
                        </div>
                      </div>
                      <button onClick={()=>onMessage({...client,_action:item.actionLabel})}
                        style={{ width:'100%', padding:'10px', borderRadius:10, background:item.colD, border:`1px solid ${item.colB}`, color:item.col, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FONT }}>
                        {item.actionLabel}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.t1, letterSpacing:'-0.01em' }}>Goals & Milestones</div>
                <div style={{ padding:'26px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}` }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, justifyItems:'center', marginBottom:24 }}>
                    {[
                      { label:'Bodyweight', current:72.4, target:70, unit:'kg', pct:73, col:C.green },
                      { label:'5km Run',    current:28,   target:25, unit:'min', pct:47, col:C.cyan  },
                      { label:'Squat 1RM',  current:62,   target:80, unit:'kg', pct:60, col:C.amber  },
                    ].map((g,i) => (
                      <GoalRing key={i} pct={g.pct} color={g.col} label={g.label} val={g.current} target={g.target} unit={g.unit} />
                    ))}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {[
                      { label:'Reach 70kg bodyweight', current:72.4, target:70, unit:'kg', pct:73, deadline:'Aug 2024' },
                      { label:'Run 5km under 25min',   current:28,   target:25, unit:'min', pct:47, deadline:'Sep 2024' },
                      { label:'Squat 80kg',            current:62,   target:80, unit:'kg', pct:60, deadline:'Dec 2024' },
                    ].map((g,i) => {
                      const col = g.pct>=80?C.green:g.pct>=50?C.cyan:C.amber;
                      return (
                        <div key={i} style={{ padding:'14px 16px', borderRadius:11, background:C.card2, border:`1px solid ${C.brd}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                            <span style={{ fontSize:12.5, color:C.t2, fontWeight:600 }}>{g.label}</span>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <span style={{ fontSize:10.5, color:C.t3 }}>Due {g.deadline}</span>
                              <span style={{ fontSize:13, fontWeight:700, color:col }}>{g.pct}%</span>
                            </div>
                          </div>
                          <div style={{ height:5, background:C.brd, borderRadius:3, overflow:'hidden', marginBottom:5 }}>
                            <div style={{ width:`${g.pct}%`, height:'100%', background:col, borderRadius:3 }} />
                          </div>
                          <div style={{ fontSize:10.5, color:C.t3 }}>{g.current} {g.unit} → {g.target} {g.unit}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MESSAGES ── */}
          {drawerTab === 'messages' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
              {/* Template list */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.t1, letterSpacing:'-0.01em' }}>Message Templates</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {COACH_ACTIONS.map((a,i) => {
                    const fn = (client?.name||'there').split(' ')[0];
                    const preview = MSG_PRESET[a]?.(fn) || '';
                    return (
                      <button key={i} onClick={()=>onMessage({...client,_action:a})}
                        style={{ width:'100%', padding:'15px 18px', borderRadius:12, background:C.card, border:`1px solid ${C.brd}`, color:C.t2, cursor:'pointer', fontFamily:FONT, textAlign:'left', display:'flex', alignItems:'center', gap:14, transition:'all .15s' }}
                        onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.cyanB; e.currentTarget.style.background=C.cyanD; e.currentTarget.style.color=C.t1; }}
                        onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.brd; e.currentTarget.style.background=C.card; e.currentTarget.style.color=C.t2; }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'inherit', marginBottom:4 }}>{a}</div>
                          <div style={{ fontSize:11.5, color:C.t3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{preview.slice(0,65)}…</div>
                        </div>
                        <ChevronRight style={{ width:14, height:14, flexShrink:0, opacity:0.4 }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Composer */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.t1, letterSpacing:'-0.01em' }}>Custom Compose</div>
                <div style={{ padding:'24px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}` }}>
                  <MessageComposer client={client} onMessage={onMessage} />
                </div>
                <div style={{ padding:'18px 20px', borderRadius:12, background:C.cyanD, border:`1px solid ${C.cyanB}` }}>
                  <div style={{ fontSize:11, color:C.cyan, fontWeight:700, marginBottom:7, textTransform:'uppercase', letterSpacing:'0.07em' }}>Engagement Score</div>
                  <div style={{ fontSize:24, fontWeight:800, color:C.cyan, letterSpacing:'-0.03em', marginBottom:5 }}>{sr}%</div>
                  <div style={{ fontSize:12, color:C.t3, lineHeight:1.6 }}>
                    Predicted likelihood that {(client?.name||'this client').split(' ')[0]} responds positively to your next outreach based on their activity pattern.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}