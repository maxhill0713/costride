/**
 * ClientProfile — Full coaching operating system for a single client.
 * Drop-in replacement for the existing slide-in ClientPreview panel.
 * Fully self-contained with mock data. Zero external deps beyond recharts + lucide-react.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X, Send, Dumbbell, Utensils, ChevronRight, AlertTriangle,
  CheckCircle, Flame, Clock, Calendar, TrendingUp, TrendingDown,
  Minus, Camera, FileText, Plus, ShieldAlert, Target, Activity,
  MessageSquare, Star, Award, Zap, ArrowUpRight, ArrowDownRight,
  Heart, Scale, Ruler, Timer, Edit, Check, MoreHorizontal,
  Bell, Users, BarChart2, BookOpen, Leaf, Siren, RefreshCw,
  ChevronDown, Layers, ClipboardList, Image, PlusCircle,
  Trash2, ThumbsUp, Phone, Mail, ChevronsRight,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';

/* ─── TOKENS (matching TabCoachMembers) ────────────────────── */
const C = {
  bg:    '#0b0b0d', sidebar:'#0f0f12', card:'#141416', card2:'#18181b',
  brd:   '#222226', brd2:'#2a2a30',
  t1:    '#ffffff', t2:'#8a8a94', t3:'#444450',
  cyan:  '#4d7fff', cyanD:'rgba(77,127,255,0.08)', cyanB:'rgba(77,127,255,0.25)',
  red:   '#ff4d6d', redD:'rgba(255,77,109,0.1)',    redB:'rgba(255,77,109,0.25)',
  amber: '#f59e0b', amberD:'rgba(245,158,11,0.1)',  amberB:'rgba(245,158,11,0.25)',
  green: '#22c55e', greenD:'rgba(34,197,94,0.1)',   greenB:'rgba(34,197,94,0.25)',
  blue:  '#3b82f6', blueD:'rgba(59,130,246,0.1)',   blueB:'rgba(59,130,246,0.25)',
  violet:'#a78bfa', violetD:'rgba(167,139,250,0.1)',
};
const FONT = "'DM Sans','Segoe UI',sans-serif";
const AV_COLORS = ['#4d7fff','#22c55e','#f59e0b','#ff4d6d','#a78bfa','#06b6d4'];

/* ─── GLOBAL CSS ─────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('cp-css')) {
  const s = document.createElement('style');
  s.id = 'cp-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
    .cp * { box-sizing:border-box; }
    .cp { font-family:'DM Sans','Segoe UI',sans-serif; -webkit-font-smoothing:antialiased; }
    @keyframes cpSlideUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
    @keyframes cpFadeIn    { from{opacity:0} to{opacity:1} }
    @keyframes cpPulse     { 0%,100%{opacity:.5} 50%{opacity:1} }
    .cp-scr::-webkit-scrollbar { width:3px; }
    .cp-scr::-webkit-scrollbar-thumb { background:#222226; border-radius:3px; }
    .cp-nav-btn { transition:all .15s; cursor:pointer; outline:none; border:none; }
    .cp-nav-btn:hover { background:rgba(255,255,255,0.04) !important; }
    .cp-card { transition:box-shadow .15s; }
    .cp-btn { transition:all .18s cubic-bezier(.16,1,.3,1); cursor:pointer; outline:none; border:none; display:inline-flex; align-items:center; gap:6px; }
    .cp-btn:hover  { transform:translateY(-1px); filter:brightness(1.08); }
    .cp-btn:active { transform:scale(.97); }
    .cp-tag-input { background:rgba(255,255,255,0.03); border:1px solid #222226; color:#fff; font-family:'DM Sans','Segoe UI',sans-serif; outline:none; border-radius:8px; padding:9px 12px; font-size:13px; transition:border-color .15s; width:100%; }
    .cp-tag-input:focus { border-color:rgba(77,127,255,0.4); }
    .cp-tag-input::placeholder { color:#444450; }
    .cp-row-hover:hover { background:#1a1a1e !important; }
    .cp-slide { animation:cpSlideUp .32s cubic-bezier(.16,1,.3,1) both; }
    .cp-fade  { animation:cpFadeIn .2s ease both; }
  `;
  document.head.appendChild(s);
}

/* ─── MOCK DATA ──────────────────────────────────────────────── */
const MOCK_CLIENT = {
  id: 'u_001', name: 'Sarah Mitchell', goal: 'Fat Loss & Toning',
  avatar: null, status: 'at_risk', isNew: false,
  retentionScore: 34, joinDate: 'Jan 2024',
  lastVisit: 18, streak: 0, consecutiveMissed: 2,
  sessionsThisMonth: 2, sessionsLastMonth: 7,
  nextSession: null, injuries: [],
  _action: "Send 'We miss you'",
  retentionHistory: [72, 68, 65, 60, 55, 48, 40, 34],
  phone: '+44 7911 123456', email: 'sarah.m@email.com',
  dob: '14 Mar 1991', memberSince: 'Jan 2024',
};

const MOCK_WEIGHT = [
  { w:'10wk', v:76.2 }, { w:'9wk', v:75.8 }, { w:'8wk', v:75.1 },
  { w:'7wk', v:74.8 }, { w:'6wk', v:74.5 }, { w:'5wk', v:74.0 },
  { w:'4wk', v:73.6 }, { w:'3wk', v:73.2 }, { w:'2wk', v:72.8 }, { w:'Now', v:72.4 },
];
const MOCK_PERF = [
  { name: 'Squat 1RM', unit:'kg', current:62,  target:80,  history:[45,50,52,56,58,60,62] },
  { name: 'Deadlift 1RM', unit:'kg', current:75, target:100, history:[60,64,68,70,72,74,75] },
  { name: '5km Run', unit:'min', current:28.5, target:25, history:[32,31,30,29.5,29,28.5,28.5], lower:true },
  { name: 'Push-ups', unit:'reps', current:24, target:40, history:[12,15,17,19,21,22,24] },
];
const MOCK_MEASUREMENTS = [
  { label:'Waist', value:'72cm', delta:'-4cm', positive:true },
  { label:'Chest', value:'88cm', delta:'-1cm', positive:true },
  { label:'Hips',  value:'95cm', delta:'-3cm', positive:true },
  { label:'Arms',  value:'29cm', delta:'+1cm', positive:true },
  { label:'Thighs',value:'55cm', delta:'-2cm', positive:true },
  { label:'Body Fat %', value:'26%', delta:'-2%', positive:true },
];
const MOCK_SESSIONS = [
  { date:'23 May', type:'Upper Body Strength', dur:55, attended:true  },
  { date:'20 May', type:'HIIT Cardio',         dur:45, attended:true  },
  { date:'17 May', type:'Lower Body',          dur:60, attended:false },
  { date:'14 May', type:'Full Body Circuit',   dur:50, attended:false },
  { date:'10 May', type:'Upper Body Strength', dur:55, attended:true  },
  { date:'7 May',  type:'Yoga & Mobility',     dur:45, attended:true  },
  { date:'3 May',  type:'HIIT Cardio',         dur:45, attended:true  },
  { date:'30 Apr', type:'Lower Body',          dur:60, attended:true  },
  { date:'27 Apr', type:'Full Body Circuit',   dur:50, attended:true  },
  { date:'24 Apr', type:'Upper Body Strength', dur:55, attended:false },
];
const MOCK_INJURIES = [
  { id:1, area:'Right Knee', type:'Tendinitis', severity:'Moderate', date:'Mar 2024', notes:'Avoid heavy squatting. Leg press OK to 80kg.' },
  { id:2, area:'Lower Back', type:'Muscle strain', severity:'Cleared', date:'Jan 2024', notes:'Fully recovered. No restrictions.' },
];
const MOCK_NOTES = [
  { id:1, date:'23 May 2024', text:'Good energy today. Mentioned she has been stressed at work — this likely explains recent drop-off. Suggested scheduling sessions on Tuesday/Thursday.' },
  { id:2, date:'10 May 2024', text:'Client hit a new squat PB at 62kg! Very motivated. Discussed increasing frequency to 3x per week.' },
  { id:3, date:'3 May 2024',  text:'Knee feeling better. Allowed light squatting — monitored form closely. No issues reported.' },
];
const MOCK_WORKOUT_PLAN = {
  name: 'Fat Loss Phase 2', weeks: 8, currentWeek: 4,
  sessions: 3, lastUpdated: '15 May 2024',
  days: ['Monday: Upper Strength','Wednesday: HIIT','Friday: Lower Power'],
};
const MOCK_NUTRITION = {
  name: 'Moderate Deficit', calories: 1720, protein: 140,
  carbs: 160, fat: 55, lastUpdated: '15 May 2024',
  notes: 'Refeed day on Saturdays.',
};
const MOCK_GOALS = [
  { id:1, label:'Reach 70kg bodyweight', current:72.4, target:70, unit:'kg', type:'weight', pct:73, deadline:'Aug 2024', lower:true },
  { id:2, label:'Run 5km in under 25min', current:28.5, target:25, unit:'min', type:'cardio', pct:47, deadline:'Sep 2024', lower:true },
  { id:3, label:'Squat 80kg', current:62, target:80, unit:'kg', type:'strength', pct:60, deadline:'Dec 2024' },
];
const MOCK_MILESTONES = [
  { date:'Jan 2024', label:'Joined the gym', done:true },
  { date:'Feb 2024', label:'First month completed', done:true },
  { date:'Mar 2024', label:'Lost first 2kg', done:true },
  { date:'May 2024', label:'Squat 60kg PB', done:true },
  { date:'Jun 2024', label:'Hit 72kg bodyweight', done:false },
  { date:'Aug 2024', label:'Goal weight: 70kg', done:false },
];
const MSG_TEMPLATES = [
  { label:'We Miss You',    icon:Heart,       text: fn => `Hey ${fn}, we haven't seen you in a while and wanted to check in. Hope everything's okay! When you're ready, we're here to support you. 💪` },
  { label:'Check-In',      icon:Bell,        text: fn => `Hi ${fn}! Just checking in on how you're feeling. Any wins this week? Even small ones count! Let me know if there's anything I can do to support you.` },
  { label:'Motivation',    icon:Zap,         text: fn => `${fn} — remember why you started. Every session, no matter how small, is a step closer to your goal. You've got this. See you soon! 🔥` },
  { label:'Book Session',  icon:Calendar,    text: fn => `Hi ${fn}, I have some great availability this week. Want to lock in a session? Let's keep the momentum going!` },
  { label:'PB Celebration',icon:Award,       text: fn => `${fn}!! You absolutely smashed it today — that was a personal best and you made it look easy. So proud of your consistency! 🎉` },
  { label:'Programme Update',icon:Dumbbell,  text: fn => `Hi ${fn}! I've updated your training plan for the next phase. It's tailored to where you're at right now — let me know if you have any questions!` },
];

/* ─── HELPERS ────────────────────────────────────────────────── */
const scoreColor = s => s >= 80 ? C.green : s >= 60 ? C.t2 : s >= 40 ? C.amber : C.red;
const scoreTier  = s => s >= 80
  ? { label:'High Value', color:C.green, bg:C.greenD, bdr:C.greenB }
  : s >= 60
  ? { label:'Stable',     color:C.t2,   bg:'rgba(138,138,148,0.08)', bdr:'rgba(138,138,148,0.2)' }
  : s >= 40
  ? { label:'Caution',    color:C.amber, bg:C.amberD, bdr:C.amberB }
  : { label:'At Risk',    color:C.red,   bg:C.redD,   bdr:C.redB };

function Av({ name='?', size=36, avatarSrc=null, id='' }) {
  const col = AV_COLORS[(id || name).split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
  const ini = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  if (avatarSrc) return <img src={avatarSrc} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', border:`2px solid ${col}44`, flexShrink:0 }} />;
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, background:col+'1a', color:col, fontSize:size*0.3, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${col}33`, fontFamily:'monospace' }}>
      {ini}
    </div>
  );
}

function ChartTip({ active, payload, suffix='' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#111c2a', border:`1px solid ${C.cyanB}`, borderRadius:7, padding:'4px 9px', fontSize:11.5, color:C.t1 }}>
      <span style={{ color:C.cyan, fontWeight:700 }}>{payload[0].value}{suffix}</span>
    </div>
  );
}

function StatChip({ label, value, sub, color, icon: Icon, wide=false }) {
  return (
    <div style={{ padding:'12px 14px', borderRadius:10, background:C.card, border:`1px solid ${C.brd}`, flex: wide ? '1 1 100%' : '1 1 0' }}>
      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
        {Icon && <Icon style={{ width:11, height:11, color:C.t3 }} />}
        <span style={{ fontSize:9.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize:18, fontWeight:700, color:color||C.t1, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:10.5, color:C.t3, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ icon: Icon, label, action, onAction }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {Icon && <div style={{ width:24, height:24, borderRadius:7, background:C.cyanD, border:`1px solid ${C.cyanB}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon style={{ width:11, height:11, color:C.cyan }} />
        </div>}
        <span style={{ fontSize:13, fontWeight:700, color:C.t1 }}>{label}</span>
      </div>
      {action && (
        <button onClick={onAction} className="cp-btn" style={{ padding:'5px 10px', borderRadius:7, background:C.cyanD, border:`1px solid ${C.cyanB}`, color:C.cyan, fontSize:11, fontWeight:600, fontFamily:FONT }}>
          <Plus style={{ width:9 }} />{action}
        </button>
      )}
    </div>
  );
}

/* ─── TABS ────────────────────────────────────────────────────── */
const TABS = [
  { id:'overview',    label:'Overview',     Icon:BarChart2     },
  { id:'progress',   label:'Progress',     Icon:TrendingUp    },
  { id:'sessions',   label:'Sessions',     Icon:Calendar      },
  { id:'plans',      label:'Plans',        Icon:Dumbbell      },
  { id:'comms',      label:'Messages',     Icon:MessageSquare },
  { id:'goals',      label:'Goals',        Icon:Target        },
];

/* ─── TAB: OVERVIEW ─────────────────────────────────────────── */
function TabOverview({ client, onMessage, data }) {
  const trend = client.retentionHistory || [];
  const trendData = trend.map((v, i) => ({ w: ['-7w','-6w','-5w','-4w','-3w','-2w','-1w','Now'][i], v }));
  const attendRate = (() => {
    const total = data.sessions.length;
    const att = data.sessions.filter(s => s.attended).length;
    return total ? Math.round(att / total * 100) : 0;
  })();

  return (
    <div className="cp-slide" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Key stats */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <StatChip label="Last Visit"  value={client.lastVisit >= 999 ? 'Never' : client.lastVisit === 0 ? 'Today' : `${client.lastVisit}d ago`} color={client.lastVisit >= 14 ? C.red : client.lastVisit <= 1 ? C.cyan : C.t1} icon={Clock} />
        <StatChip label="Sessions/mo" value={client.sessionsThisMonth} sub={`was ${client.sessionsLastMonth} last month`} color={client.sessionsThisMonth < client.sessionsLastMonth ? C.red : C.t1} icon={Dumbbell} />
        <StatChip label="Attendance"  value={`${attendRate}%`} color={attendRate >= 70 ? C.green : attendRate >= 50 ? C.amber : C.red} icon={CheckCircle} />
        <StatChip label="Streak"      value={client.streak > 0 ? `${client.streak}d` : '—'} color={client.streak >= 14 ? C.amber : C.t1} icon={Flame} />
      </div>

      {/* Retention trend */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Retention Score</span>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:22, fontWeight:700, color:scoreColor(client.retentionScore) }}>{client.retentionScore}</span>
            <span style={{ padding:'3px 8px', borderRadius:20, background:scoreTier(client.retentionScore).bg, border:`1px solid ${scoreTier(client.retentionScore).bdr}`, fontSize:10, fontWeight:700, color:scoreTier(client.retentionScore).color }}>{scoreTier(client.retentionScore).label}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={trendData} margin={{ top:4, right:4, bottom:0, left:-28 }}>
            <defs>
              <linearGradient id="cprt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={scoreColor(client.retentionScore)} stopOpacity={0.3} />
                <stop offset="100%" stopColor={scoreColor(client.retentionScore)} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="w" tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} domain={[0,100]} />
            <Tooltip content={<ChartTip />} />
            <Area type="monotone" dataKey="v" stroke={scoreColor(client.retentionScore)} strokeWidth={2} fill="url(#cprt)" dot={false}
              activeDot={{ r:3, fill:scoreColor(client.retentionScore), strokeWidth:2, stroke:C.card }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent activity */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.brd}` }}>
          <span style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Recent Sessions</span>
        </div>
        {data.sessions.slice(0, 5).map((s, i) => (
          <div key={i} className="cp-row-hover" style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderBottom: i < 4 ? `1px solid ${C.brd}` : 'none' }}>
            <div style={{ width:28, height:28, borderRadius:8, background:s.attended ? C.greenD : C.redD, border:`1px solid ${s.attended ? C.greenB : C.redB}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {s.attended ? <Check style={{ width:11, height:11, color:C.green }} /> : <X style={{ width:11, height:11, color:C.red }} />}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:600, color:C.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.type}</div>
              <div style={{ fontSize:10.5, color:C.t3 }}>{s.date} · {s.dur}min</div>
            </div>
            <span style={{ fontSize:10.5, fontWeight:600, color:s.attended ? C.green : C.red }}>{s.attended ? 'Attended' : 'No-show'}</span>
          </div>
        ))}
      </div>

      {/* Contact info */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'12px 14px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t1, marginBottom:10 }}>Contact</div>
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {[
            { Icon:Mail,  val:client.email  || 'sarah.m@email.com' },
            { Icon:Phone, val:client.phone  || '+44 7911 123456'   },
            { Icon:Calendar, val:`DOB: ${client.dob || '14 Mar 1991'}` },
            { Icon:Users, val:`Member since ${client.joinDate}` },
          ].map(({ Icon:I, val }, idx) => (
            <div key={idx} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <I style={{ width:12, height:12, color:C.t3, flexShrink:0 }} />
              <span style={{ fontSize:12, color:C.t2 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── TAB: PROGRESS ─────────────────────────────────────────── */
function TabProgress({ data }) {
  const [selectedPerf, setSelectedPerf] = useState(0);
  const perf = data.perf[selectedPerf];
  const perfHistory = perf.history.map((v, i) => ({ w: `${i + 1}wk`, v }));

  return (
    <div className="cp-slide" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Weight chart */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <SectionTitle icon={Scale} label="Weight History" />
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
            <span style={{ fontSize:20, fontWeight:700, color:C.green }}>72.4 kg</span>
            <span style={{ fontSize:10.5, color:C.green }}>▼ 3.8kg this period</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={110}>
          <LineChart data={data.weight} margin={{ top:4, right:4, bottom:0, left:-28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="w" tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} domain={['dataMin - 1', 'dataMax + 0.5']} />
            <Tooltip content={<ChartTip suffix=" kg" />} />
            <ReferenceLine y={70} stroke={C.cyan} strokeDasharray="4 4" strokeWidth={1} label={{ value:'Goal: 70kg', fill:C.cyan, fontSize:9, fontFamily:FONT, position:'insideTopRight' }} />
            <Line type="monotone" dataKey="v" stroke={C.green} strokeWidth={2.5} dot={{ r:3, fill:C.green, strokeWidth:0 }} activeDot={{ r:4, fill:C.green }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Measurements */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px 16px' }}>
        <SectionTitle icon={Ruler} label="Body Measurements" action="Update" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {data.measurements.map((m, i) => (
            <div key={i} style={{ padding:'10px 12px', borderRadius:9, background:C.card2, border:`1px solid ${C.brd}` }}>
              <div style={{ fontSize:9.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.t1 }}>{m.value}</div>
              <div style={{ fontSize:10, color:m.positive ? C.green : C.red, marginTop:2, fontWeight:600 }}>{m.delta}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px 16px' }}>
        <SectionTitle icon={Dumbbell} label="Performance Metrics" />
        <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
          {data.perf.map((p, i) => (
            <button key={i} onClick={() => setSelectedPerf(i)} style={{ padding:'5px 10px', borderRadius:7, background:i===selectedPerf?C.cyanD:'transparent', border:`1px solid ${i===selectedPerf?C.cyanB:C.brd}`, color:i===selectedPerf?C.cyan:C.t2, fontSize:11, fontWeight:i===selectedPerf?700:400, cursor:'pointer', fontFamily:FONT }}>
              {p.name}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <div style={{ flex:1, padding:'12px', borderRadius:9, background:C.card2, border:`1px solid ${C.brd}` }}>
            <div style={{ fontSize:9.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Current</div>
            <div style={{ fontSize:20, fontWeight:700, color:C.cyan }}>{perf.current} <span style={{ fontSize:12, color:C.t3 }}>{perf.unit}</span></div>
          </div>
          <div style={{ flex:1, padding:'12px', borderRadius:9, background:C.card2, border:`1px solid ${C.brd}` }}>
            <div style={{ fontSize:9.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Target</div>
            <div style={{ fontSize:20, fontWeight:700, color:C.t2 }}>{perf.target} <span style={{ fontSize:12, color:C.t3 }}>{perf.unit}</span></div>
          </div>
          <div style={{ flex:1, padding:'12px', borderRadius:9, background:C.card2, border:`1px solid ${C.brd}` }}>
            <div style={{ fontSize:9.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Progress</div>
            <div style={{ fontSize:20, fontWeight:700, color:C.green }}>{Math.min(100, Math.round(perf.lower ? (perf.current/perf.target)*100 : (perf.current/perf.target)*100))}%</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={perfHistory} margin={{ top:4, right:4, bottom:0, left:-28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="w" tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip suffix={` ${perf.unit}`} />} />
            <Bar dataKey="v" fill={C.cyan} radius={[3,3,0,0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress photos placeholder */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px 16px' }}>
        <SectionTitle icon={Camera} label="Progress Photos" action="Upload" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {['Jan 2024','Mar 2024','May 2024'].map((d, i) => (
            <div key={i} style={{ aspectRatio:'3/4', borderRadius:9, background:C.card2, border:`1px solid ${C.brd}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer' }}>
              <Camera style={{ width:16, height:16, color:C.t3 }} />
              <span style={{ fontSize:10, color:C.t3 }}>{d}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:10, fontSize:11, color:C.t3, textAlign:'center' }}>3 photos · comparison view available</div>
      </div>
    </div>
  );
}

/* ─── TAB: SESSIONS ──────────────────────────────────────────── */
function TabSessions({ data }) {
  const att = data.sessions.filter(s => s.attended).length;
  const miss = data.sessions.filter(s => !s.attended).length;
  const rate = Math.round(att / data.sessions.length * 100);
  const calDays = useMemo(() => {
    const now = new Date();
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.getDate();
      const idx = Math.floor(i / 4);
      const status = i === 18 || i === 20 ? 'miss' : [0,3,7,9,10,13,17,20].includes(i) && i !== 18 && i !== 20 ? 'hit' : 'none';
      days.push({ label, status });
    }
    return days;
  }, []);

  return (
    <div className="cp-slide" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Summary */}
      <div style={{ display:'flex', gap:10 }}>
        <StatChip label="Attended"   value={att}    color={C.green}         />
        <StatChip label="No-shows"   value={miss}   color={miss > 2 ? C.red : C.amber} />
        <StatChip label="Rate"       value={`${rate}%`} color={rate>=70?C.green:rate>=50?C.amber:C.red} />
        <StatChip label="Trend"      value={rate < 60 ? '↓ Down' : '↑ Up'} color={rate < 60 ? C.red : C.green} />
      </div>

      {/* 30-day calendar */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px 16px' }}>
        <SectionTitle icon={Calendar} label="30-Day Attendance" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap:4 }}>
          {calDays.map((d, i) => (
            <div key={i} style={{ aspectRatio:'1', borderRadius:4, background:d.status==='hit'?C.greenD:d.status==='miss'?C.redD:C.card2, border:`1px solid ${d.status==='hit'?C.greenB:d.status==='miss'?C.redB:C.brd}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:8.5, color:d.status==='hit'?C.green:d.status==='miss'?C.red:C.t3, fontWeight:d.status!=='none'?700:400 }}>{d.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:12, marginTop:10 }}>
          {[{col:C.greenB, tc:C.green, label:'Attended'},{col:C.redB, tc:C.red, label:'Missed'},{col:C.brd, tc:C.t3, label:'No session'}].map((l,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:l.col, border:`1px solid ${l.col}` }} />
              <span style={{ fontSize:10, color:l.tc }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Session list */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Session History</span>
          <span style={{ fontSize:10.5, color:C.t3 }}>Last {data.sessions.length}</span>
        </div>
        {data.sessions.map((s, i) => (
          <div key={i} className="cp-row-hover" style={{ display:'grid', gridTemplateColumns:'28px 1fr auto auto', gap:10, alignItems:'center', padding:'10px 14px', borderBottom:i<data.sessions.length-1?`1px solid ${C.brd}`:'none' }}>
            <div style={{ width:28, height:28, borderRadius:8, background:s.attended?C.greenD:C.redD, border:`1px solid ${s.attended?C.greenB:C.redB}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {s.attended ? <Check style={{ width:10, color:C.green }} /> : <X style={{ width:10, color:C.red }} />}
            </div>
            <div>
              <div style={{ fontSize:12.5, fontWeight:600, color:C.t1 }}>{s.type}</div>
              <div style={{ fontSize:10.5, color:C.t3 }}>{s.date}</div>
            </div>
            <span style={{ fontSize:11, color:C.t2 }}>{s.dur}min</span>
            <span style={{ fontSize:10.5, fontWeight:600, color:s.attended?C.green:C.red, whiteSpace:'nowrap' }}>{s.attended?'✓ Attended':'✗ No-show'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── TAB: PLANS ────────────────────────────────────────────── */
function TabPlans({ data }) {
  return (
    <div className="cp-slide" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Workout plan */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px 16px' }}>
        <SectionTitle icon={Dumbbell} label="Active Workout Plan" action="Assign New" />
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:14 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:C.t1, marginBottom:4 }}>{data.workout.name}</div>
            <div style={{ fontSize:11.5, color:C.t3 }}>Last updated {data.workout.lastUpdated}</div>
          </div>
          <div style={{ padding:'5px 10px', borderRadius:20, background:C.cyanD, border:`1px solid ${C.cyanB}`, fontSize:10, fontWeight:700, color:C.cyan, whiteSpace:'nowrap' }}>
            Week {data.workout.currentWeek}/{data.workout.weeks}
          </div>
        </div>
        <div style={{ height:4, background:C.brd, borderRadius:2, overflow:'hidden', marginBottom:6 }}>
          <div style={{ width:`${Math.round(data.workout.currentWeek/data.workout.weeks*100)}%`, height:'100%', background:C.cyan, borderRadius:2 }} />
        </div>
        <div style={{ fontSize:10.5, color:C.t3, marginBottom:14 }}>{Math.round(data.workout.currentWeek/data.workout.weeks*100)}% complete · {data.workout.sessions}x/week</div>
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {data.workout.days.map((d, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, background:C.card2, border:`1px solid ${C.brd}` }}>
              <div style={{ width:20, height:20, borderRadius:6, background:C.cyanD, border:`1px solid ${C.cyanB}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Dumbbell style={{ width:9, height:9, color:C.cyan }} />
              </div>
              <span style={{ fontSize:12, color:C.t1 }}>{d}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button className="cp-btn" style={{ flex:1, padding:'8px', borderRadius:8, background:C.cyanD, border:`1px solid ${C.cyanB}`, color:C.cyan, fontSize:11.5, fontWeight:600, justifyContent:'center', fontFamily:FONT }}>
            <Edit style={{ width:10 }} /> Edit Plan
          </button>
          <button className="cp-btn" style={{ flex:1, padding:'8px', borderRadius:8, background:C.card2, border:`1px solid ${C.brd}`, color:C.t2, fontSize:11.5, fontWeight:600, justifyContent:'center', fontFamily:FONT }}>
            <RefreshCw style={{ width:10 }} /> Replace
          </button>
        </div>
      </div>

      {/* Nutrition plan */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px 16px' }}>
        <SectionTitle icon={Leaf} label="Nutrition Plan" action="Assign New" />
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:C.t1, marginBottom:4 }}>{data.nutrition.name}</div>
            <div style={{ fontSize:11.5, color:C.t3 }}>{data.nutrition.notes} · Updated {data.nutrition.lastUpdated}</div>
          </div>
          <div style={{ padding:'5px 10px', borderRadius:20, background:C.greenD, border:`1px solid ${C.greenB}`, fontSize:10, fontWeight:700, color:C.green }}>Active</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
          {[
            { label:'Calories', val:data.nutrition.calories, unit:'kcal', col:C.amber },
            { label:'Protein',  val:data.nutrition.protein,  unit:'g',    col:C.cyan  },
            { label:'Carbs',    val:data.nutrition.carbs,    unit:'g',    col:C.violet},
            { label:'Fat',      val:data.nutrition.fat,      unit:'g',    col:C.green },
          ].map((m, i) => (
            <div key={i} style={{ padding:'10px 10px', borderRadius:9, background:C.card2, border:`1px solid ${C.brd}`, textAlign:'center' }}>
              <div style={{ fontSize:9.5, color:C.t3, marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:16, fontWeight:700, color:m.col }}>{m.val}</div>
              <div style={{ fontSize:9, color:C.t3 }}>{m.unit}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button className="cp-btn" style={{ flex:1, padding:'8px', borderRadius:8, background:C.greenD, border:`1px solid ${C.greenB}`, color:C.green, fontSize:11.5, fontWeight:600, justifyContent:'center', fontFamily:FONT }}>
            <Edit style={{ width:10 }} /> Edit Plan
          </button>
          <button className="cp-btn" style={{ flex:1, padding:'8px', borderRadius:8, background:C.card2, border:`1px solid ${C.brd}`, color:C.t2, fontSize:11.5, fontWeight:600, justifyContent:'center', fontFamily:FONT }}>
            <RefreshCw style={{ width:10 }} /> Replace
          </button>
        </div>
      </div>

      {/* History */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.brd}` }}>
          <span style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Programme History</span>
        </div>
        {[
          { name:'Foundation Phase 1', type:'Workout', dates:'Jan–Mar 2024', done:true },
          { name:'Intro Calorie Deficit', type:'Nutrition', dates:'Jan–Feb 2024', done:true },
          { name:'Fat Loss Phase 1', type:'Workout', dates:'Mar–Apr 2024', done:true },
          { name:'Moderate Deficit v1', type:'Nutrition', dates:'Feb–May 2024', done:true },
        ].map((p, i, arr) => (
          <div key={i} className="cp-row-hover" style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderBottom:i<arr.length-1?`1px solid ${C.brd}`:'none', opacity:0.7 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:p.type==='Workout'?C.cyanD:C.greenD, border:`1px solid ${p.type==='Workout'?C.cyanB:C.greenB}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {p.type==='Workout' ? <Dumbbell style={{ width:10, color:C.cyan }} /> : <Leaf style={{ width:10, color:C.green }} />}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12.5, fontWeight:600, color:C.t1 }}>{p.name}</div>
              <div style={{ fontSize:10.5, color:C.t3 }}>{p.type} · {p.dates}</div>
            </div>
            <span style={{ fontSize:10.5, color:C.t3, background:C.card2, border:`1px solid ${C.brd}`, padding:'3px 8px', borderRadius:20 }}>Completed</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── TAB: COMMS ─────────────────────────────────────────────── */
function TabComms({ client }) {
  const [selectedTpl, setSelectedTpl] = useState(0);
  const [msgBody, setMsgBody] = useState('');
  const [sent, setSent] = useState(false);
  const fn = (client.name || 'there').split(' ')[0];

  useEffect(() => {
    setMsgBody(MSG_TEMPLATES[selectedTpl].text(fn));
    setSent(false);
  }, [selectedTpl, fn]);

  return (
    <div className="cp-slide" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Template picker */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px 16px' }}>
        <SectionTitle icon={MessageSquare} label="Message Templates" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginBottom:14 }}>
          {MSG_TEMPLATES.map((t, i) => {
            const on = i === selectedTpl;
            return (
              <button key={i} onClick={() => setSelectedTpl(i)} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 11px', borderRadius:9, background:on?C.cyanD:C.card2, border:`1px solid ${on?C.cyanB:C.brd}`, cursor:'pointer', fontFamily:FONT, textAlign:'left', transition:'all .13s' }}>
                <t.icon style={{ width:12, height:12, color:on?C.cyan:C.t3, flexShrink:0 }} />
                <span style={{ fontSize:11.5, fontWeight:on?700:400, color:on?C.cyan:C.t2 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
        <textarea
          value={msgBody}
          onChange={e => { setMsgBody(e.target.value); setSent(false); }}
          rows={5}
          className="cp-tag-input"
          style={{ resize:'none', lineHeight:1.65 }}
        />
        <div style={{ display:'flex', gap:8, marginTop:10 }}>
          <button onClick={() => { setSent(true); setTimeout(() => setSent(false), 2500); }} className="cp-btn" style={{ flex:1, padding:'10px', borderRadius:9, background:sent?C.greenD:C.cyan, border:`1px solid ${sent?C.greenB:'transparent'}`, color:sent?C.green:'#fff', fontSize:13, fontWeight:700, justifyContent:'center', fontFamily:FONT }}>
            {sent ? <><CheckCircle style={{ width:13 }} /> Sent!</> : <><Send style={{ width:13 }} /> Send to {fn}</>}
          </button>
        </div>
      </div>

      {/* Mock message history */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.brd}` }}>
          <span style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Recent Messages</span>
        </div>
        {[
          { from:'coach', text:'Hey Sarah, great work on that squat PB today! Really proud of how consistent you\'ve been.', time:'23 May, 18:12' },
          { from:'client', text:'Thank you!! I\'m so happy with it. The programme is working really well.', time:'23 May, 19:04' },
          { from:'coach', text:'Checking in — how\'s the knee feeling this week?', time:'10 May, 09:30' },
          { from:'client', text:'Much better thanks! No pain during squats now.', time:'10 May, 10:15' },
        ].map((m, i) => {
          const isCoach = m.from === 'coach';
          return (
            <div key={i} style={{ padding:'10px 14px', borderBottom:i<3?`1px solid ${C.brd}`:'none', display:'flex', flexDirection:'column', alignItems:isCoach?'flex-end':'flex-start' }}>
              <div style={{ fontSize:9.5, color:C.t3, marginBottom:4 }}>{isCoach?'You':'Sarah'} · {m.time}</div>
              <div style={{ maxWidth:'80%', padding:'9px 12px', borderRadius:isCoach?'11px 11px 4px 11px':'11px 11px 11px 4px', background:isCoach?C.cyanD:C.card2, border:`1px solid ${isCoach?C.cyanB:C.brd}` }}>
                <span style={{ fontSize:12.5, color:C.t1, lineHeight:1.55 }}>{m.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── TAB: GOALS ─────────────────────────────────────────────── */
function TabGoals({ data }) {
  return (
    <div className="cp-slide" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Goals */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px 16px' }}>
        <SectionTitle icon={Target} label="Active Goals" action="Add Goal" />
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {data.goals.map((g, i) => (
            <div key={g.id} style={{ padding:'12px 14px', borderRadius:10, background:C.card2, border:`1px solid ${C.brd}` }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:3 }}>{g.label}</div>
                  <div style={{ fontSize:11, color:C.t3 }}>Target: {g.target} {g.unit} · Deadline: {g.deadline}</div>
                </div>
                <span style={{ fontSize:16, fontWeight:700, color:scoreColor(g.pct), flexShrink:0 }}>{g.pct}%</span>
              </div>
              <div style={{ height:5, background:C.brd, borderRadius:3, overflow:'hidden', marginBottom:5 }}>
                <div style={{ width:`${g.pct}%`, height:'100%', background:scoreColor(g.pct), borderRadius:3, transition:'width .6s cubic-bezier(.16,1,.3,1)' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:C.t3 }}>
                <span>Current: <span style={{ color:C.t1, fontWeight:600 }}>{g.current} {g.unit}</span></span>
                <span>Goal: <span style={{ color:C.t1, fontWeight:600 }}>{g.target} {g.unit}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px 16px' }}>
        <SectionTitle icon={Award} label="Milestones" action="Add" />
        <div style={{ position:'relative', paddingLeft:20 }}>
          <div style={{ position:'absolute', left:7, top:8, bottom:8, width:1, background:C.brd }} />
          {data.milestones.map((m, i) => (
            <div key={i} style={{ position:'relative', marginBottom:i<data.milestones.length-1?14:0 }}>
              <div style={{ position:'absolute', left:-20, top:2, width:14, height:14, borderRadius:'50%', background:m.done?C.green:C.card2, border:`2px solid ${m.done?C.green:C.brd}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {m.done && <Check style={{ width:7, height:7, color:'#fff' }} />}
              </div>
              <div style={{ fontSize:10.5, color:C.t3, marginBottom:2 }}>{m.date}</div>
              <div style={{ fontSize:12.5, fontWeight:m.done?600:400, color:m.done?C.t1:C.t2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:'14px 16px' }}>
        <SectionTitle icon={Star} label="Achievements" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {[
            { Icon:Zap,     label:'First PB',       sub:'Squat 60kg',     earned:true  },
            { Icon:Flame,   label:'7-Day Streak',   sub:'March 2024',     earned:true  },
            { Icon:Scale,   label:'-3kg',           sub:'Weigh-in',       earned:true  },
            { Icon:Heart,   label:'30 Sessions',    sub:'Milestone',      earned:true  },
            { Icon:Award,   label:'Injury Recovery',sub:'Jan 2024',       earned:true  },
            { Icon:Target,  label:'-5kg',           sub:'In progress',    earned:false },
          ].map((a, i) => (
            <div key={i} style={{ padding:'11px 10px', borderRadius:10, background:a.earned?C.cyanD:C.card2, border:`1px solid ${a.earned?C.cyanB:C.brd}`, textAlign:'center', opacity:a.earned?1:0.5 }}>
              <a.Icon style={{ width:16, height:16, color:a.earned?C.cyan:C.t3, margin:'0 auto 5px', display:'block' }} />
              <div style={{ fontSize:10.5, fontWeight:700, color:a.earned?C.t1:C.t2, lineHeight:1.3, marginBottom:2 }}>{a.label}</div>
              <div style={{ fontSize:9, color:C.t3 }}>{a.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── RIGHT RAIL ─────────────────────────────────────────────── */
function RightRail({ client, data, onMessage }) {
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState(data.notes);
  const [injuries, setInjuries] = useState(data.injuries);
  const tier = scoreTier(client.retentionScore);
  const reasons = [];
  if (client.lastVisit >= 14) reasons.push(`No visit in ${client.lastVisit} days`);
  if (client.consecutiveMissed >= 2) reasons.push(`${client.consecutiveMissed} consecutive no-shows`);
  if (client.sessionsThisMonth < client.sessionsLastMonth) reasons.push('Sessions declining month-on-month');
  if (!reasons.length && client.retentionScore < 40) reasons.push('Low overall engagement score');

  const addNote = () => {
    if (!noteText.trim()) return;
    setNotes(prev => [{ id:Date.now(), date:'Today', text:noteText.trim() }, ...prev]);
    setNoteText('');
  };

  return (
    <div style={{ width:240, flexShrink:0, display:'flex', flexDirection:'column', borderLeft:`1px solid ${C.brd}`, background:C.sidebar, overflowY:'auto' }} className="tcm2-scr">
      {/* Risk */}
      <div style={{ padding:'14px 14px 12px', borderBottom:`1px solid ${C.brd}` }}>
        <div style={{ fontSize:10, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Retention</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:28, fontWeight:700, color:scoreColor(client.retentionScore), lineHeight:1 }}>{client.retentionScore}</span>
          <span style={{ padding:'4px 9px', borderRadius:20, background:tier.bg, border:`1px solid ${tier.bdr}`, fontSize:10, fontWeight:700, color:tier.color }}>{tier.label}</span>
        </div>
        {client.retentionScore < 60 && reasons.length > 0 && (
          <div style={{ padding:'9px 10px', borderRadius:8, background:C.redD, border:`1px solid ${C.redB}`, borderLeft:`3px solid ${C.red}`, marginTop:8 }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:C.red, marginBottom:3 }}>Risk Signals</div>
            {reasons.map((r, i) => (
              <div key={i} style={{ fontSize:10, color:C.t2, marginTop:2 }}>· {r}</div>
            ))}
          </div>
        )}
      </div>

      {/* AI Actions */}
      <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.brd}` }}>
        <div style={{ fontSize:10, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:9 }}>AI Actions</div>
        {[
          { label:client._action, primary:true },
          { label:'Book a session', primary:false },
          { label:'Assign new plan', primary:false },
        ].map((a, i) => (
          <button key={i} onClick={() => onMessage(client)} className="cp-btn" style={{ width:'100%', marginBottom:6, padding:'8px 10px', borderRadius:8, background:a.primary?C.cyan:C.cyanD, border:`1px solid ${a.primary?'transparent':C.cyanB}`, color:a.primary?'#fff':C.cyan, fontSize:11, fontWeight:700, justifyContent:'space-between', fontFamily:FONT }}>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'left', maxWidth:155 }}>{a.label}</span>
            <ChevronRight style={{ width:9, height:9, flexShrink:0 }} />
          </button>
        ))}
      </div>

      {/* Injuries */}
      <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.brd}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:9 }}>
          <span style={{ fontSize:10, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em' }}>Injuries</span>
          <button style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}>
            <PlusCircle style={{ width:13, height:13, color:C.t3 }} />
          </button>
        </div>
        {injuries.map(inj => (
          <div key={inj.id} style={{ padding:'9px 10px', borderRadius:8, background:inj.severity==='Cleared'?C.greenD:C.amberD, border:`1px solid ${inj.severity==='Cleared'?C.greenB:C.amberB}`, marginBottom:6 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
              <span style={{ fontSize:11, fontWeight:700, color:inj.severity==='Cleared'?C.green:C.amber }}>{inj.area}</span>
              <span style={{ fontSize:9.5, color:inj.severity==='Cleared'?C.green:C.amber }}>{inj.severity}</span>
            </div>
            <div style={{ fontSize:10, color:C.t2, lineHeight:1.45 }}>{inj.notes}</div>
          </div>
        ))}
        {injuries.length === 0 && <div style={{ fontSize:11, color:C.t3, textAlign:'center', padding:'10px 0' }}>No injuries logged</div>}
      </div>

      {/* Coach Notes */}
      <div style={{ padding:'12px 14px' }}>
        <div style={{ fontSize:10, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:9 }}>Coach Notes</div>
        <div style={{ display:'flex', gap:6, marginBottom:10 }}>
          <input value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key==='Enter' && addNote()} placeholder="Add a note…" className="cp-tag-input" style={{ fontSize:11.5, padding:'7px 10px' }} />
          <button onClick={addNote} className="cp-btn" style={{ padding:'7px 9px', borderRadius:8, background:C.cyanD, border:`1px solid ${C.cyanB}`, color:C.cyan, flexShrink:0 }}>
            <Plus style={{ width:11 }} />
          </button>
        </div>
        {notes.map(n => (
          <div key={n.id} style={{ marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${C.brd}` }}>
            <div style={{ fontSize:9.5, color:C.t3, marginBottom:4 }}>{n.date}</div>
            <div style={{ fontSize:11.5, color:C.t2, lineHeight:1.55 }}>{n.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MAIN EXPORT ────────────────────────────────────────────── */
export default function ClientProfile({
  client      = MOCK_CLIENT,
  onClose     = null,
  onMessage   = null,
  avatarMap   = {},
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [msgTarget, setMsgTarget]  = useState(null);

  const c      = { ...MOCK_CLIENT, ...client };
  const tier   = scoreTier(c.retentionScore);
  const fn     = (c.name || 'Client').split(' ')[0];

  /* Merge mock data so component works standalone */
  const data = useMemo(() => ({
    weight:       MOCK_WEIGHT,
    perf:         MOCK_PERF,
    measurements: MOCK_MEASUREMENTS,
    sessions:     MOCK_SESSIONS,
    injuries:     c.injuries?.length ? c.injuries : MOCK_INJURIES,
    notes:        MOCK_NOTES,
    workout:      MOCK_WORKOUT_PLAN,
    nutrition:    MOCK_NUTRITION,
    goals:        MOCK_GOALS,
    milestones:   MOCK_MILESTONES,
  }), [c.id]);

  const handleMessage = (cl) => {
    if (onMessage) onMessage(cl);
    else setMsgTarget(cl);
  };

  return (
    <div className="cp" style={{ position:'fixed', inset:0, zIndex:800, display:'flex', flexDirection:'column', background:C.bg, color:C.t1, fontFamily:FONT, animation:'cpFadeIn .18s ease both' }}>

      {/* ── TOP BAR ───────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 18px', borderBottom:`1px solid ${C.brd}`, flexShrink:0, background:C.sidebar }}>
        <button onClick={onClose} className="cp-btn" style={{ width:32, height:32, borderRadius:8, background:C.card, border:`1px solid ${C.brd}`, color:C.t2, justifyContent:'center', fontFamily:FONT }}>
          <X style={{ width:13 }} />
        </button>

        {/* Avatar + name */}
        <Av name={c.name} size={38} avatarSrc={avatarMap[c.id] || c.avatar} id={c.id} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <span style={{ fontSize:15, fontWeight:700, color:C.t1 }}>{c.name}</span>
            <span style={{ padding:'3px 9px', borderRadius:20, background:tier.bg, border:`1px solid ${tier.bdr}`, fontSize:10, fontWeight:700, color:tier.color }}>{tier.label}</span>
            {c.isNew && <span style={{ padding:'3px 9px', borderRadius:20, background:C.blueD, border:`1px solid ${C.blueB}`, fontSize:10, fontWeight:700, color:C.blue }}>New</span>}
          </div>
          <div style={{ fontSize:11, color:C.t3, marginTop:2 }}>{c.goal} · Since {c.joinDate}</div>
        </div>

        {/* Quick actions */}
        <div style={{ display:'flex', gap:7 }}>
          <button onClick={() => handleMessage(c)} className="cp-btn" style={{ padding:'7px 14px', borderRadius:8, background:C.cyan, border:'none', color:'#fff', fontSize:12, fontWeight:700, fontFamily:FONT }}>
            <Send style={{ width:11 }} /> Message
          </button>
          <button className="cp-btn" style={{ padding:'7px 12px', borderRadius:8, background:C.cyanD, border:`1px solid ${C.cyanB}`, color:C.cyan, fontSize:12, fontWeight:700, fontFamily:FONT }}>
            <Dumbbell style={{ width:11 }} /> Assign Workout
          </button>
          <button className="cp-btn" style={{ padding:'7px 12px', borderRadius:8, background:C.greenD, border:`1px solid ${C.greenB}`, color:C.green, fontSize:12, fontWeight:700, fontFamily:FONT }}>
            <Utensils style={{ width:11 }} /> Nutrition Plan
          </button>
        </div>
      </div>

      {/* ── TAB NAV ───────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', borderBottom:`1px solid ${C.brd}`, padding:'0 18px', background:C.card, flexShrink:0 }}>
        {TABS.map(t => {
          const on = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className="cp-nav-btn" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 12px', background:'transparent', color:on?C.t1:C.t2, fontSize:12, fontWeight:on?700:400, fontFamily:FONT, borderBottom:on?`2px solid ${C.cyan}`:'2px solid transparent', marginBottom:-1, whiteSpace:'nowrap' }}>
              <t.Icon style={{ width:12, height:12, color:on?C.cyan:C.t3 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── BODY ─────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Scrollable main content */}
        <div className="cp-scr" style={{ flex:1, overflowY:'auto', padding:'18px 20px', minWidth:0 }}>
          {activeTab === 'overview'  && <TabOverview  client={c} onMessage={handleMessage} data={data} />}
          {activeTab === 'progress'  && <TabProgress  data={data} />}
          {activeTab === 'sessions'  && <TabSessions  data={data} />}
          {activeTab === 'plans'     && <TabPlans     data={data} />}
          {activeTab === 'comms'     && <TabComms     client={c}  />}
          {activeTab === 'goals'     && <TabGoals     data={data} />}
          <div style={{ height:32 }} />
        </div>
        {/* Right rail */}
        <RightRail client={c} data={data} onMessage={handleMessage} />
      </div>

      {/* ── INLINE MESSAGE TOAST (when no onMessage prop) ─────── */}
      {msgTarget && !onMessage && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', width:340, background:C.sidebar, border:`1px solid ${C.brd2}`, borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.55)', zIndex:900, overflow:'hidden', fontFamily:FONT, animation:'cpSlideUp .25s cubic-bezier(.16,1,.3,1) both' }}>
          <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Bell style={{ width:11, height:11, color:C.t3 }} />
              <span style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Message</span>
              <span style={{ fontSize:10.5, color:C.t3 }}>→ {fn}</span>
            </div>
            <button onClick={() => setMsgTarget(null)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}>
              <X style={{ width:11, height:11, color:C.t3 }} />
            </button>
          </div>
          <div style={{ padding:'12px 14px' }}>
            <textarea defaultValue={MSG_TEMPLATES[0].text(fn)} rows={3} className="cp-tag-input" style={{ resize:'none', lineHeight:1.6 }} />
            <button className="cp-btn" onClick={() => setMsgTarget(null)} style={{ marginTop:9, width:'100%', padding:'9px', borderRadius:9, border:'none', fontSize:12.5, fontWeight:700, justifyContent:'center', background:C.cyan, color:'#fff', fontFamily:FONT }}>
              <Send style={{ width:11 }} /> Send to {fn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}