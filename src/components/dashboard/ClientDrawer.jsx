/**
 * ClientDrawer — Elite Redesign
 * Matches Content Hub sleekness: consistent tokens, stat grids,
 * clean cards, micro-interactions, professional hierarchy.
 */
import React, { useState, useEffect } from 'react';
import {
  X, Send, Check, Flame, Zap, Plus, ChevronRight, ExternalLink,
  BarChart2, Activity, FileText, MessageSquare, Target, Layers,
  Calendar, Clock, Shield, TrendingDown, Users, Dumbbell,
  AlertTriangle, Search, Pencil, RefreshCw, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

import { C, FONT, ChartTip } from './drawer/DrawerShared';
import TabAdherence from './drawer/TabAdherence';
import TabProgram   from './drawer/TabProgram';

/* ─── INJECT CSS ─────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('cdr3-css')) {
  const s = document.createElement('style');
  s.id = 'cdr3-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
    @keyframes cdr3SlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes cdr3FadeIn  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    @keyframes cdr3Pulse   { 0%,100%{opacity:.4} 50%{opacity:1} }
    .cdr3-scr::-webkit-scrollbar { width: 3px; }
    .cdr3-scr::-webkit-scrollbar-thumb { background: #222226; border-radius: 3px; }
    .cdr3-card { transition: border-color .15s, box-shadow .15s; }
    .cdr3-card:hover { border-color: rgba(77,127,255,0.22) !important; }
    .cdr3-row  { transition: background .12s; }
    .cdr3-row:hover { background: rgba(255,255,255,0.03) !important; }
    .cdr3-btn  { transition: all .15s cubic-bezier(.16,1,.3,1); }
    .cdr3-stat-cell { transition: background .12s; }
    .cdr3-stat-cell:hover { background: rgba(77,127,255,0.06) !important; }
    .cdr3-tab  { transition: color .15s, border-color .15s; }
    .cdr3-fu   { animation: cdr3FadeIn .3s cubic-bezier(.16,1,.3,1) both; }
    .cdr3-input {
      width: 100%; background: rgba(255,255,255,0.03);
      border: 1px solid #222226; color: #fff;
      font-size: 13px; font-family: 'DM Sans','Segoe UI',sans-serif;
      outline: none; border-radius: 8px; padding: 10px 14px;
      transition: border-color .15s, background .15s; box-sizing: border-box;
    }
    .cdr3-input:focus { border-color: rgba(77,127,255,0.4); background: rgba(77,127,255,0.04); }
    .cdr3-input::placeholder { color: #444450; }
  `;
  document.head.appendChild(s);
}

/* ─── CONSTANTS ──────────────────────────────────────────────── */
const AV_COLORS = ['#4d7fff','#22c55e','#f59e0b','#f43f5e','#a78bfa','#06b6d4','#f97316','#14b8a6'];
const COACH_ACTIONS = [
  'Check in','Book session','Send message','Celebrate progress',
  'Missed sessions','Custom plan offer','Upgrade plan','Welcome back',
];
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
  { w:'8wk',v:76.2},{w:'7wk',v:75.8},{w:'6wk',v:75.1},
  {w:'5wk',v:74.5},{w:'4wk',v:74.0},{w:'3wk',v:73.4},
  {w:'2wk',v:72.9},{w:'Now',v:72.4},
];
const MOCK_SESSIONS = [
  {date:'23 May',type:'Upper Strength',dur:55,attended:true},
  {date:'20 May',type:'HIIT Cardio',   dur:45,attended:true},
  {date:'17 May',type:'Lower Body',    dur:60,attended:false},
  {date:'14 May',type:'Full Body',     dur:50,attended:false},
  {date:'10 May',type:'Upper Strength',dur:55,attended:true},
];
const TABS = [
  {id:'overview',  label:'Overview',  icon:BarChart2},
  {id:'activity',  label:'Activity',  icon:Activity},
  {id:'adherence', label:'Adherence', icon:Target},
  {id:'notes',     label:'Notes',     icon:FileText},
  {id:'program',   label:'Program',   icon:Layers},
  {id:'messages',  label:'Messages',  icon:MessageSquare},
];

/* ─── HELPERS ────────────────────────────────────────────────── */
const avColor = who =>
  AV_COLORS[(who||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % AV_COLORS.length];

function scoreColor(s) {
  if (s >= 80) return C.green;
  if (s >= 60) return C.t2;
  if (s >= 40) return C.amber;
  return C.red;
}
function scoreTier(s) {
  if (s >= 80) return {label:'Healthy', color:C.green,  bg:'rgba(34,197,94,0.09)',   bdr:'rgba(34,197,94,0.22)'};
  if (s >= 60) return {label:'Stable',  color:'#8a8a94', bg:'rgba(138,138,148,0.08)', bdr:'rgba(138,138,148,0.2)'};
  if (s >= 40) return {label:'Caution', color:C.amber,  bg:'rgba(245,158,11,0.1)',   bdr:'rgba(245,158,11,0.25)'};
  return              {label:'At Risk', color:C.red,    bg:'rgba(255,77,109,0.1)',   bdr:'rgba(255,77,109,0.25)'};
}
function riskReasons(client) {
  const r = [];
  if (client.lastVisit >= 21) r.push('No gym visit in 3+ weeks');
  else if (client.lastVisit >= 14) r.push('No gym visit in 2+ weeks');
  if (client.sessionsThisMonth === 0 && client.sessionsLastMonth === 0)
    r.push('Zero sessions in 2 months');
  else if (client.sessionsThisMonth < client.sessionsLastMonth)
    r.push('Sessions declining month-on-month');
  if (client.consecutiveMissed >= 2)
    r.push(`${client.consecutiveMissed} consecutive no-shows`);
  if (!r.length && client.retentionScore < 40)
    r.push('Low overall engagement score');
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
  const col = avColor(client.id || client.name || '');
  const src = avatarMap[client.id] || client.avatar || null;
  const ini = (client.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  if (src) return (
    <img src={src} alt={client.name}
      style={{width:size,height:size,borderRadius:'50%',flexShrink:0,objectFit:'cover',
              border:`2px solid ${col}44`}} />
  );
  return (
    <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,
                 background:`${col}18`,color:col,
                 fontSize:size*0.33,fontWeight:800,
                 display:'flex',alignItems:'center',justifyContent:'center',
                 border:`2px solid ${col}28`,fontFamily:'monospace'}}>
      {ini}
    </div>
  );
}

/* ─── PILL ───────────────────────────────────────────────────── */
function Pill({ children, color, bg, bdr, size = 10 }) {
  return (
    <span style={{display:'inline-flex',alignItems:'center',
                  fontSize:size,fontWeight:700,
                  color:color||C.t2,background:bg||'rgba(138,138,148,0.08)',
                  border:`1px solid ${bdr||'rgba(138,138,148,0.2)'}`,
                  borderRadius:20,padding:'2.5px 9px',
                  letterSpacing:'.05em',textTransform:'uppercase',
                  whiteSpace:'nowrap',fontFamily:FONT}}>
      {children}
    </span>
  );
}

/* ─── STAT CARD ──────────────────────────────────────────────── */
function StatCard({ label, value, color, sub }) {
  return (
    <div style={{padding:'18px 20px',borderRadius:12,
                 background:C.card||'#141416',
                 border:`1px solid ${C.brd||'#222226'}`}}>
      <div style={{fontSize:10,fontWeight:700,color:C.t3,
                   textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>
        {label}
      </div>
      <div style={{fontSize:26,fontWeight:900,color:color||C.t1,
                   letterSpacing:'-0.04em',lineHeight:1,marginBottom:sub?4:0}}>
        {value}
      </div>
      {sub && <div style={{fontSize:11,color:C.t3,marginTop:4}}>{sub}</div>}
    </div>
  );
}

/* ─── SECTION LABEL ──────────────────────────────────────────── */
function Label({ children, action }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                 marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:700,color:C.t3,
                   textTransform:'uppercase',letterSpacing:'0.09em'}}>
        {children}
      </div>
      {action}
    </div>
  );
}

/* ─── DIVIDER ────────────────────────────────────────────────── */
const Div = () => (
  <div style={{height:1,background:C.brd||'#222226',margin:'0 0 20px'}} />
);

/* ─── SCORE RING ─────────────────────────────────────────────── */
function ScoreRing({ score, size = 112, stroke = 9 }) {
  const color = scoreColor(score);
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{filter:`drop-shadow(0 0 8px ${color}55)`,
                  transition:'stroke-dashoffset .7s ease'}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',
                   flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2}}>
        <div style={{fontSize:size*0.24,fontWeight:900,color,
                     letterSpacing:'-0.05em',lineHeight:1}}>{score}</div>
        <div style={{fontSize:size*0.08,color:C.t3,
                     textTransform:'uppercase',letterSpacing:'0.08em'}}>score</div>
      </div>
    </div>
  );
}

/* ─── MINI SPARKBAR ──────────────────────────────────────────── */
function SparkBar({ history = [], color }) {
  const data = history.length ? history : Array.from({length:8},()=>50);
  const max  = Math.max(...data, 1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:3,height:32}}>
      {data.map((v,i) => (
        <div key={i}
          style={{flex:1,borderRadius:'3px 3px 0 0',
                  background: i === data.length-1 ? color : `${C.brd2||'#2a2a30'}`,
                  height:`${Math.max(12,(v/max)*100)}%`,transition:'height .4s ease'}}/>
      ))}
    </div>
  );
}

/* ─── ACTIVITY HEATMAP ───────────────────────────────────────── */
function ActivityHeatmap({ history = [] }) {
  const weeks = history.length ? history : Array.from({length:8},()=>50);
  const days  = ['M','T','W','T','F','S','S'];
  const getColor = v => v>75?C.green:v>50?C.cyan:v>25?C.amber:C.red;
  const getOpacity = v => Math.max(0.08, v/100*0.75);
  const hash = (wi,di) => ((wi*7+di)*2654435761)>>>0;
  const variance = (wi,di) => ((hash(wi,di)%50)-25);
  return (
    <div>
      <div style={{display:'flex',gap:3,marginBottom:6}}>
        {days.map((d,i) => (
          <div key={i}
            style={{flex:1,textAlign:'center',fontSize:9,color:C.t3,
                    textTransform:'uppercase',letterSpacing:'0.05em'}}>
            {d}
          </div>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:3}}>
        {weeks.map((wv,wi) => (
          <div key={wi} style={{display:'flex',gap:3}}>
            {days.map((_,di) => {
              const v = Math.max(0,Math.min(100,wv+variance(wi,di)));
              return (
                <div key={di} title={`${Math.round(v)}%`}
                  style={{flex:1,height:11,borderRadius:3,
                          background:getColor(v),opacity:getOpacity(v),
                          cursor:'default',transition:'opacity .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.opacity='0.9'}
                  onMouseLeave={e=>e.currentTarget.style.opacity=String(getOpacity(v))}/>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:10,marginTop:10,justifyContent:'flex-end'}}>
        {[['Low',C.red],['Mid',C.amber],['Good',C.cyan],['High',C.green]].map(([l,col],i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:7,height:7,borderRadius:2,background:col,opacity:.65}}/>
            <span style={{fontSize:9.5,color:C.t3}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── NOTES PANEL ────────────────────────────────────────────── */
const TAGS = ['Injury','Low energy','PR','Breakthrough','Nutrition','Mindset'];

function NotesPanel() {
  const [notes, setNotes] = useState([
    {id:1,date:'23 May 2024',text:'Great session. Right knee improving. Recommended 3×/week with modified squats.',tags:['Injury']},
    {id:2,date:'10 May 2024',text:'New squat PB at 62kg — very motivated. Increase load 2.5kg next session.',tags:['PR']},
    {id:3,date:'28 Apr 2024',text:'Missed last two sessions. Client mentioned work stress. Suggested lighter recovery week.',tags:['Low energy','Mindset']},
  ]);
  const [text, setText]   = useState('');
  const [selTags, setSelTags] = useState([]);
  const [search, setSearch]   = useState('');

  const toggleTag = t => setSelTags(p => p.includes(t) ? p.filter(x=>x!==t) : [...p,t]);
  const addNote   = () => {
    if (!text.trim()) return;
    const date = new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
    setNotes(p => [{id:Date.now(),date,text:text.trim(),tags:selTags},...p]);
    setText(''); setSelTags([]);
  };
  const filtered = notes.filter(n => !search || n.text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* Compose */}
      <div style={{marginBottom:20,padding:'16px',borderRadius:12,
                   background:'rgba(255,255,255,0.02)',
                   border:`1px solid ${C.brd||'#222226'}`}}>
        <textarea value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&e.metaKey) addNote(); }}
          placeholder="Add a session note… (⌘↩ to save)"
          rows={3}
          className="cdr3-input"
          style={{resize:'none',lineHeight:1.65,marginBottom:12,
                  padding:'11px 13px',fontSize:12.5}}
          onFocus={e=>e.currentTarget.style.borderColor='rgba(77,127,255,0.4)'}
          onBlur={e=>e.currentTarget.style.borderColor=C.brd||'#222226'}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {TAGS.map(t=>(
              <button key={t} onClick={()=>toggleTag(t)}
                style={{padding:'3px 9px',borderRadius:6,fontSize:10,
                        fontWeight:700,cursor:'pointer',fontFamily:FONT,
                        background: selTags.includes(t)?'rgba(77,127,255,0.14)':'transparent',
                        border:`1px solid ${selTags.includes(t)?'rgba(77,127,255,0.35)':C.brd||'#222226'}`,
                        color: selTags.includes(t)?C.cyan:C.t3,
                        transition:'all .12s'}}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={addNote}
            style={{display:'flex',alignItems:'center',gap:6,
                    padding:'7px 15px',borderRadius:8,
                    background:'#2563eb',border:'none',
                    color:'#fff',fontSize:12,fontWeight:700,
                    cursor:'pointer',fontFamily:FONT}}>
            <Plus style={{width:11,height:11}}/> Save
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{position:'relative',marginBottom:16}}>
        <Search style={{position:'absolute',left:12,top:'50%',
                        transform:'translateY(-50%)',
                        width:13,height:13,color:C.t3,pointerEvents:'none'}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search notes…"
          className="cdr3-input" style={{paddingLeft:36}}/>
      </div>

      {/* List */}
      <div style={{display:'flex',flexDirection:'column'}}>
        {filtered.map((n,i) => (
          <div key={n.id} className="cdr3-row"
            style={{paddingTop:16,paddingBottom:16,
                    borderBottom: i<filtered.length-1
                      ? `1px solid ${C.brd||'#222226'}` : 'none',
                    borderRadius:4,padding:'16px 4px'}}>
            <div style={{display:'flex',justifyContent:'space-between',
                         alignItems:'center',marginBottom:7}}>
              <div style={{fontSize:10,color:C.t3,fontWeight:600,
                           letterSpacing:'0.04em'}}>{n.date}</div>
              <div style={{display:'flex',gap:4}}>
                {(n.tags||[]).map(t=>(
                  <span key={t}
                    style={{fontSize:9,fontWeight:700,padding:'2px 7px',
                            borderRadius:5,background:'rgba(77,127,255,0.1)',
                            border:'1px solid rgba(77,127,255,0.25)',
                            color:C.cyan,letterSpacing:'0.04em'}}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div style={{fontSize:12.5,color:C.t2,lineHeight:1.7}}>{n.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── INJURY PANEL ───────────────────────────────────────────── */
function InjuryPanel({ client }) {
  const [injuries, setInjuries] = useState(
    client.injuries?.length ? client.injuries : [
      {id:1,area:'Right Knee',severity:'Moderate',
       notes:'Avoid heavy squats and deep lunges.',flag:'Squat, Leg Press'},
    ]
  );
  const [form, setForm]     = useState({area:'',severity:'Mild',notes:'',flag:''});
  const [adding, setAdding] = useState(false);

  const sevColor = s => s==='Cleared'?C.green:s==='Severe'?C.red:C.amber;
  const sevBg    = s => s==='Cleared'?'rgba(34,197,94,0.09)':s==='Severe'?'rgba(255,77,109,0.1)':'rgba(245,158,11,0.1)';
  const sevBdr   = s => s==='Cleared'?'rgba(34,197,94,0.22)':s==='Severe'?'rgba(255,77,109,0.25)':'rgba(245,158,11,0.25)';

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {injuries.map((inj,i)=>(
        <div key={inj.id||i}
          style={{padding:'13px 15px',borderRadius:10,
                  background:sevBg(inj.severity),
                  border:`1px solid ${sevBdr(inj.severity)}`,
                  borderLeft:`3px solid ${sevColor(inj.severity)}`}}>
          <div style={{display:'flex',alignItems:'center',
                       justifyContent:'space-between',marginBottom:5}}>
            <span style={{fontSize:12.5,fontWeight:700,color:sevColor(inj.severity)}}>
              {inj.area}
            </span>
            <Pill color={sevColor(inj.severity)} bg={`${sevColor(inj.severity)}15`}
              bdr={`${sevColor(inj.severity)}30`}>{inj.severity}</Pill>
          </div>
          {inj.notes && (
            <div style={{fontSize:11.5,color:C.t2,lineHeight:1.6,
                         marginBottom:inj.flag?5:0}}>{inj.notes}</div>
          )}
          {inj.flag && (
            <div style={{fontSize:11,color:C.red,fontWeight:600,marginTop:4}}>
              🚩 Avoid: {inj.flag}
            </div>
          )}
        </div>
      ))}
      {injuries.length===0 && !adding && (
        <div style={{fontSize:12,color:C.t3,padding:'10px 0'}}>
          No restrictions logged.
        </div>
      )}
      {adding && (
        <div style={{padding:14,borderRadius:10,
                     background:'rgba(255,255,255,0.02)',
                     border:`1px solid ${C.brd||'#222226'}`,
                     display:'flex',flexDirection:'column',gap:9}}>
          {[
            {key:'area',   placeholder:'Area (e.g. Left Shoulder)'},
            {key:'flag',   placeholder:'Exercises to avoid (optional)'},
            {key:'notes',  placeholder:'Notes (optional)'},
          ].map(({key,placeholder})=>(
            <input key={key} value={form[key]}
              onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}
              placeholder={placeholder} className="cdr3-input"/>
          ))}
          <select value={form.severity}
            onChange={e=>setForm(p=>({...p,severity:e.target.value}))}
            style={{background:'#141416',border:`1px solid ${C.brd||'#222226'}`,
                    color:C.t2,fontSize:13,borderRadius:8,
                    padding:'9px 12px',fontFamily:FONT,outline:'none'}}>
            {['Mild','Moderate','Severe','Cleared'].map(s=><option key={s}>{s}</option>)}
          </select>
          <div style={{display:'flex',gap:8}}>
            <button
              onClick={()=>{
                if(form.area.trim()){
                  setInjuries(p=>[...p,{id:Date.now(),...form}]);
                  setForm({area:'',severity:'Mild',notes:'',flag:''});
                  setAdding(false);
                }
              }}
              style={{flex:1,padding:'9px',borderRadius:8,
                      background:'#2563eb',border:'none',
                      color:'#fff',fontSize:12,fontWeight:700,
                      cursor:'pointer',fontFamily:FONT}}>
              Save
            </button>
            <button onClick={()=>setAdding(false)}
              style={{flex:1,padding:'9px',borderRadius:8,
                      background:'transparent',border:`1px solid ${C.brd||'#222226'}`,
                      color:C.t2,fontSize:12,cursor:'pointer',fontFamily:FONT}}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <button onClick={()=>setAdding(v=>!v)}
        style={{display:'flex',alignItems:'center',gap:6,
                padding:'7px 11px',borderRadius:8,
                background:'transparent',
                border:`1px dashed ${C.brd2||'#2a2a30'}`,
                color:C.t3,fontSize:11.5,fontWeight:600,
                cursor:'pointer',fontFamily:FONT}}>
        <Plus style={{width:10,height:10}}/> Add restriction
      </button>
    </div>
  );
}

/* ─── MESSAGE COMPOSER ───────────────────────────────────────── */
function MessageComposer({ client, onMessage }) {
  const fn   = (client?.name||'there').split(' ')[0];
  const [sent,   setSent]   = useState(false);
  const [action, setAction] = useState(client._action||'Check in');
  const [body,   setBody]   = useState(
    MSG_PRESET[client?._action]?.(fn) || `Hi ${fn}, just checking in!`
  );
  const sr = successRate(client);

  const handleSend = () => {
    setSent(true);
    onMessage({...client,_action:action});
    setTimeout(()=>setSent(false),2500);
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <div>
        <Label>Template</Label>
        <select value={action}
          onChange={e=>{
            setAction(e.target.value);
            setBody(MSG_PRESET[e.target.value]?.(fn)||`Hi ${fn}, just checking in!`);
          }}
          style={{width:'100%',padding:'10px 13px',borderRadius:9,
                  background:'rgba(255,255,255,0.03)',
                  border:`1px solid ${C.brd||'#222226'}`,
                  color:C.t2,fontSize:13,fontFamily:FONT,outline:'none',cursor:'pointer'}}>
          {COACH_ACTIONS.map(a=><option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <Label>Message</Label>
        <textarea value={body} onChange={e=>setBody(e.target.value)} rows={5}
          className="cdr3-input"
          style={{resize:'none',lineHeight:1.7,padding:'12px 14px',fontSize:13}}
          onFocus={e=>e.currentTarget.style.borderColor='rgba(77,127,255,0.4)'}
          onBlur={e=>e.currentTarget.style.borderColor=C.brd||'#222226'}/>
      </div>

      {/* Rate bar */}
      <div style={{padding:'12px 14px',borderRadius:9,
                   background:'rgba(77,127,255,0.06)',
                   border:'1px solid rgba(77,127,255,0.15)'}}>
        <div style={{display:'flex',justifyContent:'space-between',
                     fontSize:11.5,marginBottom:7}}>
          <span style={{color:C.t3}}>Predicted response rate</span>
          <span style={{color:C.cyan,fontWeight:700}}>{sr}%</span>
        </div>
        <div style={{height:3,borderRadius:99,
                     background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
          <div style={{height:'100%',width:`${sr}%`,
                       background:C.cyan,borderRadius:99,
                       transition:'width .5s ease'}}/>
        </div>
      </div>

      <button onClick={handleSend}
        style={{padding:'13px',borderRadius:11,border:'none',
                fontSize:14,fontWeight:700,cursor:'pointer',
                display:'flex',alignItems:'center',
                justifyContent:'center',gap:8,fontFamily:FONT,
                background: sent?'rgba(34,197,94,0.12)':'#2563eb',
                color: sent?C.green:'#fff',
                outline: sent?`1px solid rgba(34,197,94,0.3)`:'none',
                boxShadow: sent?'none':'0 4px 20px rgba(37,99,235,0.35)',
                transition:'all 0.3s cubic-bezier(.16,1,.3,1)'}}>
        {sent
          ? <><Check style={{width:14,height:14}}/> Sent!</>
          : <><Send  style={{width:14,height:14}}/> Send to {fn}</>
        }
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export default function ClientDrawer({ client, onClose, onMessage, avatarMap = {} }) {
  const [tab, setTab] = useState('overview');

  const sc      = scoreColor(client.retentionScore);
  const tier    = scoreTier(client.retentionScore);
  const reasons = riskReasons(client);
  const sr      = successRate(client);
  const days    = churnDays(client);
  const fn      = (client.name||'Client').split(' ')[0];
  const avCol   = avColor(client.id||client.name||'');

  const visitLabel = client.lastVisit>=999
    ? 'No visits'
    : client.lastVisit===0
      ? 'Today'
      : `${client.lastVisit}d ago`;

  /* sessions stats */
  const attended = MOCK_SESSIONS.filter(s=>s.attended).length;
  const missed   = MOCK_SESSIONS.filter(s=>!s.attended).length;
  const attRate  = Math.round(attended/MOCK_SESSIONS.length*100);
  const ratCol   = attRate>=70?C.green:attRate>=50?C.amber:C.red;

  useEffect(()=>{
    const h = e => { if(e.key==='Escape') onClose(); };
    document.addEventListener('keydown',h);
    return ()=>document.removeEventListener('keydown',h);
  },[onClose]);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        style={{position:'fixed',inset:0,zIndex:400,
                background:'rgba(0,0,0,0.82)',
                backdropFilter:'blur(12px)',
                animation:'cdr3FadeIn .2s ease both'}}/>

      {/* Drawer */}
      <div style={{
        position:'fixed',top:0,right:0,bottom:0,
        width:'88%',maxWidth:1240,
        background:'#0a0a0c',
        borderLeft:`1px solid ${C.brd||'#222226'}`,
        zIndex:401,display:'flex',flexDirection:'column',
        boxShadow:'-60px 0 160px rgba(0,0,0,0.95)',
        fontFamily:FONT,
        animation:'cdr3SlideIn .3s cubic-bezier(.16,1,.3,1) both',
      }}>

        {/* ══ HEADER ══════════════════════════════════════════════ */}
        <div style={{flexShrink:0,
                     borderBottom:`1px solid ${C.brd||'#222226'}`,
                     position:'relative',overflow:'hidden'}}>

          {/* accent line */}
          <div style={{position:'absolute',top:0,left:0,right:0,height:1,
                       background:`linear-gradient(90deg,transparent 0%,${avCol}60 35%,${avCol}60 65%,transparent 100%)`,
                       pointerEvents:'none'}}/>

          {/* top identity row */}
          <div style={{padding:'20px 28px 0',
                       display:'flex',alignItems:'center',
                       justifyContent:'space-between'}}>

            {/* left: avatar + name */}
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <div style={{position:'relative'}}>
                <Av client={client} size={48} avatarMap={avatarMap}/>
                {client.streak>=7&&(
                  <div style={{position:'absolute',bottom:-2,right:-2,
                               width:18,height:18,borderRadius:'50%',
                               background:'#0a0a0c',
                               display:'flex',alignItems:'center',justifyContent:'center',
                               border:`1px solid ${C.brd||'#222226'}`}}>
                    <Flame style={{width:10,height:10,color:C.amber}}/>
                  </div>
                )}
              </div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                  <span style={{fontSize:18,fontWeight:800,color:'#fff',
                                letterSpacing:'-0.03em',lineHeight:1}}>
                    {client.name}
                  </span>
                  <Pill color={tier.color} bg={tier.bg} bdr={tier.bdr}>
                    {tier.label}
                  </Pill>
                  {client.isNew&&(
                    <Pill color="#60a5fa" bg="rgba(59,130,246,0.08)" bdr="rgba(59,130,246,0.2)">
                      New
                    </Pill>
                  )}
                </div>
                <div style={{fontSize:12,color:C.t3}}>
                  {client.goal||'General Fitness'}
                  {' · '}Member since {client.joinDate}
                  {client.nextSession&&(
                    <span style={{color:C.cyan,marginLeft:6}}>
                      · Next: {client.nextSession}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* right: actions */}
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={()=>setTab('messages')} className="cdr3-btn"
                style={{display:'flex',alignItems:'center',gap:7,
                        padding:'9px 18px',borderRadius:9,
                        background:'#2563eb',border:'none',
                        color:'#fff',fontSize:12.5,fontWeight:700,
                        cursor:'pointer',fontFamily:FONT,
                        boxShadow:'0 2px 14px rgba(37,99,235,0.3)'}}>
                <Send style={{width:13,height:13}}/> Send Message
              </button>
              <button onClick={onClose} className="cdr3-btn"
                style={{width:36,height:36,borderRadius:9,
                        background:'rgba(255,255,255,0.04)',
                        border:`1px solid ${C.brd||'#222226'}`,
                        cursor:'pointer',display:'flex',
                        alignItems:'center',justifyContent:'center'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';}}>
                <X style={{width:14,height:14,color:C.t2}}/>
              </button>
            </div>
          </div>

          {/* ── inline KPI strip ── */}
          <div style={{display:'grid',
                       gridTemplateColumns:'repeat(4,1fr)',
                       margin:'18px 28px 0',
                       borderRadius:10,overflow:'hidden',
                       border:`1px solid ${C.brd||'#222226'}`,
                       background:'#0f0f12'}}>
            {[
              {label:'Retention Score', val:client.retentionScore,     unit:'',     col:sc},
              {label:'Last Visit',      val:visitLabel,                 unit:'',     col:client.lastVisit>=14?C.red:client.lastVisit<=1?C.green:'#fff'},
              {label:'This Month',      val:client.sessionsThisMonth,  unit:' sess', col:'#fff'},
              {label:'Active Streak',   val:client.streak>0?client.streak:'—', unit:client.streak>0?' days':'', col:client.streak>=14?C.amber:'#fff'},
            ].map((m,i,arr)=>(
              <div key={i} className="cdr3-stat-cell"
                style={{padding:'14px 18px',
                        borderRight:i<arr.length-1?`1px solid ${C.brd||'#222226'}`:'none'}}>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                             textTransform:'uppercase',letterSpacing:'0.08em',
                             marginBottom:6}}>
                  {m.label}
                </div>
                <div style={{fontSize:20,fontWeight:900,color:m.col,
                             letterSpacing:'-0.04em',lineHeight:1}}>
                  {m.val}<span style={{fontSize:12,fontWeight:500,opacity:.7}}>{m.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── tab bar ── */}
          <div style={{display:'flex',overflowX:'auto',scrollbarWidth:'none',
                       padding:'0 28px',marginTop:4}}>
            {TABS.map(t=>{
              const Icon = t.icon;
              const on   = tab===t.id;
              return (
                <button key={t.id} onClick={()=>setTab(t.id)}
                  className="cdr3-tab"
                  style={{display:'flex',alignItems:'center',gap:6,
                          padding:'10px 16px',background:'transparent',
                          border:'none',outline:'none',
                          borderBottom:`2px solid ${on?C.cyan:'transparent'}`,
                          color:on?'#fff':C.t3,
                          fontSize:12,fontWeight:on?700:400,
                          cursor:'pointer',fontFamily:FONT,
                          whiteSpace:'nowrap',marginBottom:-1,flexShrink:0}}
                  onMouseEnter={e=>{if(!on)e.currentTarget.style.color=C.t2;}}
                  onMouseLeave={e=>{if(!on)e.currentTarget.style.color=C.t3;}}>
                  <Icon style={{width:12,height:12}}/>{t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ SCROLLABLE BODY ══════════════════════════════════════ */}
        <div className="cdr3-scr"
          style={{flex:1,overflowY:'auto',padding:'28px 28px 60px'}}>

          {/* ════════════ OVERVIEW ════════════ */}
          {tab==='overview'&&(
            <div className="cdr3-fu"
              style={{display:'grid',
                      gridTemplateColumns:'1fr 300px',
                      gap:24,alignItems:'start'}}>

              {/* LEFT */}
              <div style={{display:'flex',flexDirection:'column',gap:20}}>

                {/* Churn banner */}
                {days!==null&&(
                  <div style={{padding:'12px 18px',borderRadius:10,
                               background:'rgba(255,77,109,0.08)',
                               border:'1px solid rgba(255,77,109,0.22)',
                               display:'flex',alignItems:'center',gap:12}}>
                    <Zap style={{width:14,height:14,color:C.red,flexShrink:0}}/>
                    <span style={{fontSize:13,color:'#fff',lineHeight:1.5,fontWeight:500}}>
                      <strong style={{color:C.red}}>{fn}</strong> is likely to churn in{' '}
                      <strong style={{color:C.red}}>{days} days</strong> without intervention.
                    </span>
                  </div>
                )}

                {/* Score card */}
                <div style={{padding:'24px',borderRadius:14,
                             background:'#111114',
                             border:`1px solid ${C.brd||'#222226'}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:28,marginBottom:20}}>
                    <ScoreRing score={client.retentionScore} size={112}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                                   textTransform:'uppercase',letterSpacing:'0.1em',
                                   marginBottom:6}}>
                        Retention Risk Score
                      </div>
                      <div style={{fontSize:28,fontWeight:900,color:tier.color,
                                   letterSpacing:'-0.04em',lineHeight:1,marginBottom:8}}>
                        {tier.label}
                      </div>
                      <div style={{fontSize:13,color:C.t2,lineHeight:1.65}}>
                        {reasons.length>0?reasons[0]:'Client engagement looks healthy.'}
                      </div>
                    </div>
                  </div>
                  {/* sparkbar */}
                  <div>
                    <SparkBar
                      history={client.retentionHistory||Array.from({length:8},()=>50)}
                      color={sc}/>
                    <div style={{display:'flex',justifyContent:'space-between',
                                 fontSize:9.5,color:C.t3,marginTop:4}}>
                      <span>8 weeks ago</span>
                      <span style={{color:sc}}>Now</span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div style={{padding:'24px',borderRadius:14,
                             background:'rgba(37,99,235,0.07)',
                             border:'1px solid rgba(37,99,235,0.2)',
                             position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:0,right:0,
                               width:200,height:200,borderRadius:'50%',
                               background:'radial-gradient(circle,rgba(37,99,235,0.08) 0%,transparent 70%)',
                               transform:'translate(30%,-40%)',pointerEvents:'none'}}/>
                  <div style={{fontSize:9.5,color:C.cyan,
                               textTransform:'uppercase',letterSpacing:'0.1em',
                               fontWeight:700,marginBottom:8}}>
                    ✦ AI Recommendation
                  </div>
                  <div style={{fontSize:20,fontWeight:800,color:'#fff',
                               letterSpacing:'-0.03em',lineHeight:1.2,marginBottom:8}}>
                    {client._action}
                  </div>
                  <div style={{fontSize:12.5,color:C.t2,lineHeight:1.65,marginBottom:18}}>
                    {MSG_PRESET[client._action]?.(fn)||`Reach out to ${fn} now.`}
                  </div>

                  {/* success rate */}
                  <div style={{marginBottom:18}}>
                    <div style={{display:'flex',justifyContent:'space-between',
                                 fontSize:11,color:C.t3,marginBottom:6}}>
                      <span>Predicted success rate</span>
                      <span style={{color:C.cyan,fontWeight:700}}>{sr}%</span>
                    </div>
                    <div style={{height:3,borderRadius:99,
                                 background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${sr}%`,
                                   background:C.cyan,borderRadius:99}}/>
                    </div>
                  </div>

                  <button onClick={()=>setTab('messages')}
                    style={{width:'100%',padding:'12px',borderRadius:10,
                            background:'#2563eb',border:'none',
                            color:'#fff',fontSize:13,fontWeight:700,
                            cursor:'pointer',fontFamily:FONT,
                            display:'flex',alignItems:'center',
                            justifyContent:'center',gap:8,
                            boxShadow:'0 4px 20px rgba(37,99,235,0.35)'}}>
                    <Send style={{width:13,height:13}}/> Send Message
                  </button>
                </div>
              </div>

              {/* RIGHT SIDEBAR */}
              <div style={{display:'flex',flexDirection:'column',gap:0,
                           borderRadius:14,overflow:'hidden',
                           border:`1px solid ${C.brd||'#222226'}`,
                           background:'#111114'}}>

                {/* Key metrics */}
                <div style={{padding:'16px 18px',
                             borderBottom:`1px solid ${C.brd||'#222226'}`}}>
                  <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                               textTransform:'uppercase',letterSpacing:'0.09em',
                               marginBottom:14}}>
                    Key Metrics
                  </div>
                  {[
                    {label:'Sessions this month', val:client.sessionsThisMonth, col:'#fff'},
                    {label:'Sessions last month',  val:client.sessionsLastMonth, col:C.t3},
                    {label:'Consecutive no-shows', val:client.consecutiveMissed>0?client.consecutiveMissed:'None',
                     col:client.consecutiveMissed>0?C.red:C.green},
                  ].map((row,i,arr)=>(
                    <div key={i}
                      style={{display:'flex',justifyContent:'space-between',
                              alignItems:'center',paddingTop:12,paddingBottom:12,
                              borderBottom:i<arr.length-1
                                ?`1px solid ${C.brd||'#222226'}`:'none'}}>
                      <span style={{fontSize:12,color:C.t3}}>{row.label}</span>
                      <span style={{fontSize:14,fontWeight:700,color:row.col}}>{row.val}</span>
                    </div>
                  ))}
                </div>

                {/* Risk signals */}
                {reasons.length>0&&(
                  <div style={{padding:'16px 18px',
                               borderBottom:`1px solid ${C.brd||'#222226'}`}}>
                    <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                                 textTransform:'uppercase',letterSpacing:'0.09em',
                                 marginBottom:12}}>
                      Risk Signals
                    </div>
                    {reasons.map((r,i)=>(
                      <div key={i}
                        style={{display:'flex',gap:10,alignItems:'flex-start',
                                marginBottom:i<reasons.length-1?10:0}}>
                        <div style={{width:5,height:5,borderRadius:'50%',
                                     background:C.amber,marginTop:7,flexShrink:0}}/>
                        <span style={{fontSize:12,color:C.t2,lineHeight:1.65}}>{r}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Profile */}
                <div style={{padding:'16px 18px',
                             borderBottom:`1px solid ${C.brd||'#222226'}`}}>
                  <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                               textTransform:'uppercase',letterSpacing:'0.09em',
                               marginBottom:12}}>
                    Profile
                  </div>
                  {[
                    {label:'Goal',   val:client.goal||'General Fitness'},
                    {label:'Streak', val:client.streak>0?`${client.streak} days`:'—',
                     good:client.streak>=14},
                  ].map((row,i,arr)=>(
                    <div key={i}
                      style={{display:'flex',justifyContent:'space-between',
                              padding:'10px 0',
                              borderBottom:i<arr.length-1?`1px solid ${C.brd||'#222226'}`:'none'}}>
                      <span style={{fontSize:12,color:C.t3}}>{row.label}</span>
                      <span style={{fontSize:12,fontWeight:600,
                                    color:row.good?C.amber:C.t2}}>
                        {row.val}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Member app data */}
                <div style={{padding:'16px 18px'}}>
                  <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                               textTransform:'uppercase',letterSpacing:'0.09em',
                               marginBottom:12}}>
                    Member App Data
                  </div>
                  {[
                    {label:'Bodyweight', summary:'72.4 kg · ↓3.8 kg in 8 wks', col:C.green},
                    {label:'Nutrition',  summary:'84% adherence · 1,720 kcal/d', col:C.amber},
                    {label:'Habits',     summary:'Steps streak 5d · Sleep 7.2h', col:C.cyan},
                  ].map((item,i,arr)=>(
                    <div key={i}
                      style={{display:'flex',alignItems:'center',
                              justifyContent:'space-between',gap:10,
                              paddingTop:12,paddingBottom:12,
                              borderBottom:i<arr.length-1?`1px solid ${C.brd||'#222226'}`:'none'}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:'#fff',marginBottom:3}}>
                          {item.label}
                        </div>
                        <div style={{fontSize:11,color:C.t3,lineHeight:1.5}}>
                          {item.summary}
                        </div>
                      </div>
                      <a href="/Progress" target="_blank" rel="noopener noreferrer"
                        style={{display:'flex',alignItems:'center',gap:4,
                                padding:'4px 9px',borderRadius:7,
                                background:`${item.col}0c`,
                                border:`1px solid ${item.col}22`,
                                color:item.col,fontSize:10,fontWeight:700,
                                textDecoration:'none',whiteSpace:'nowrap',
                                flexShrink:0,transition:'background .14s'}}
                        onMouseEnter={e=>e.currentTarget.style.background=`${item.col}1e`}
                        onMouseLeave={e=>e.currentTarget.style.background=`${item.col}0c`}>
                        View <ExternalLink style={{width:9,height:9}}/>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════ ACTIVITY ════════════ */}
          {tab==='activity'&&(()=>{
            return (
              <div className="cdr3-fu"
                style={{display:'grid',
                        gridTemplateColumns:'1fr 280px',
                        gap:24,alignItems:'start'}}>

                {/* LEFT */}
                <div style={{display:'flex',flexDirection:'column',gap:20}}>

                  {/* Stats row */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                    {[
                      {label:'Attended',    val:attended,     col:C.green,
                       bg:'rgba(34,197,94,0.09)',  bdr:'rgba(34,197,94,0.22)'},
                      {label:'No-shows',    val:missed,       col:C.red,
                       bg:'rgba(255,77,109,0.08)',  bdr:'rgba(255,77,109,0.22)'},
                      {label:'Attend Rate', val:`${attRate}%`, col:ratCol,
                       bg:ratCol===C.green?'rgba(34,197,94,0.09)':ratCol===C.amber?'rgba(245,158,11,0.09)':'rgba(255,77,109,0.08)',
                       bdr:ratCol===C.green?'rgba(34,197,94,0.22)':ratCol===C.amber?'rgba(245,158,11,0.22)':'rgba(255,77,109,0.22)'},
                    ].map((s,i)=>(
                      <div key={i}
                        style={{padding:'20px',borderRadius:12,
                                background:s.bg,border:`1px solid ${s.bdr}`,
                                textAlign:'center'}}>
                        <div style={{fontSize:32,fontWeight:900,color:s.col,
                                     lineHeight:1,letterSpacing:'-0.04em'}}>
                          {s.val}
                        </div>
                        <div style={{fontSize:10,color:s.col,opacity:.65,
                                     marginTop:7,textTransform:'uppercase',
                                     letterSpacing:'0.07em'}}>
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Session list */}
                  <div style={{borderRadius:14,background:'#111114',
                               border:`1px solid ${C.brd||'#222226'}`,
                               overflow:'hidden'}}>
                    <div style={{padding:'16px 18px',
                                 borderBottom:`1px solid ${C.brd||'#222226'}`}}>
                      <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                                   textTransform:'uppercase',letterSpacing:'0.09em'}}>
                        Recent Sessions
                      </div>
                    </div>
                    {MOCK_SESSIONS.map((s,i)=>(
                      <div key={i} className="cdr3-row"
                        style={{display:'flex',alignItems:'center',gap:14,
                                padding:'14px 18px',
                                borderBottom:i<MOCK_SESSIONS.length-1
                                  ?`1px solid ${C.brd||'#222226'}`:'none'}}>
                        <div style={{width:32,height:32,borderRadius:9,flexShrink:0,
                                     background:s.attended?'rgba(34,197,94,0.1)':'rgba(255,77,109,0.1)',
                                     border:`1px solid ${s.attended?'rgba(34,197,94,0.25)':'rgba(255,77,109,0.25)'}`,
                                     display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {s.attended
                            ? <Check style={{width:13,color:C.green}}/>
                            : <X     style={{width:13,color:C.red}}/>
                          }
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:600,color:'#fff'}}>
                            {s.type}
                          </div>
                          <div style={{fontSize:11,color:C.t3,marginTop:2}}>
                            {s.date} · {s.dur} min
                          </div>
                        </div>
                        <Pill
                          color={s.attended?C.green:C.red}
                          bg={s.attended?'rgba(34,197,94,0.09)':'rgba(255,77,109,0.08)'}
                          bdr={s.attended?'rgba(34,197,94,0.22)':'rgba(255,77,109,0.22)'}>
                          {s.attended?'Attended':'No-show'}
                        </Pill>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT */}
                <div style={{display:'flex',flexDirection:'column',gap:16}}>
                  {/* Heatmap */}
                  <div style={{padding:'18px',borderRadius:14,
                               background:'#111114',
                               border:`1px solid ${C.brd||'#222226'}`}}>
                    <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                                 textTransform:'uppercase',letterSpacing:'0.09em',
                                 marginBottom:14}}>
                      8-Week Activity
                    </div>
                    <ActivityHeatmap history={client.retentionHistory}/>
                  </div>

                  {/* Weight chart */}
                  <div style={{padding:'18px',borderRadius:14,
                               background:'#111114',
                               border:`1px solid ${C.brd||'#222226'}`}}>
                    <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                                 textTransform:'uppercase',letterSpacing:'0.09em',
                                 marginBottom:6}}>
                      Bodyweight
                    </div>
                    <div style={{fontSize:12,color:C.green,fontWeight:600,marginBottom:14}}>
                      ↓ 3.8 kg over 8 weeks
                    </div>
                    <ResponsiveContainer width="100%" height={90}>
                      <AreaChart data={MOCK_WEIGHT}
                        margin={{top:4,right:4,bottom:0,left:-28}}>
                        <defs>
                          <linearGradient id="wGrad3" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={C.green} stopOpacity={0.22}/>
                            <stop offset="100%" stopColor={C.green} stopOpacity={0.02}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.04)" vertical={false}/>
                        <XAxis dataKey="w"
                          tick={{fill:C.t3,fontSize:9,fontFamily:FONT}}
                          axisLine={false} tickLine={false}/>
                        <YAxis
                          tick={{fill:C.t3,fontSize:9,fontFamily:FONT}}
                          axisLine={false} tickLine={false} domain={['auto','auto']}/>
                        <Tooltip content={({active,payload,label})=>{
                          if(!active||!payload?.length) return null;
                          return (
                            <div style={{background:'#111c2a',
                                         border:'1px solid rgba(34,197,94,0.3)',
                                         borderRadius:7,padding:'5px 10px',
                                         fontSize:11.5,color:'#fff'}}>
                              <div style={{fontSize:10,color:C.t3,marginBottom:2}}>{label}</div>
                              <span style={{color:C.green,fontWeight:700}}>
                                {payload[0].value} kg
                              </span>
                            </div>
                          );
                        }}/>
                        <Area type="monotone" dataKey="v"
                          stroke={C.green} strokeWidth={2}
                          fill="url(#wGrad3)" dot={false}
                          activeDot={{r:3,fill:C.green}}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ════════════ ADHERENCE ════════════ */}
          {tab==='adherence'&&(
            <div className="cdr3-fu">
              <TabAdherence/>
            </div>
          )}

          {/* ════════════ NOTES ════════════ */}
          {tab==='notes'&&(
            <div className="cdr3-fu"
              style={{display:'grid',
                      gridTemplateColumns:'1fr 300px',
                      gap:24,alignItems:'start'}}>

              {/* Session notes */}
              <div style={{borderRadius:14,background:'#111114',
                           border:`1px solid ${C.brd||'#222226'}`,
                           overflow:'hidden'}}>
                <div style={{padding:'16px 18px',
                             borderBottom:`1px solid ${C.brd||'#222226'}`}}>
                  <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                               textTransform:'uppercase',letterSpacing:'0.09em'}}>
                    Session Notes
                  </div>
                </div>
                <div style={{padding:'18px'}}>
                  <NotesPanel/>
                </div>
              </div>

              {/* Health & restrictions */}
              <div style={{borderRadius:14,background:'#111114',
                           border:`1px solid ${C.brd||'#222226'}`,
                           overflow:'hidden'}}>
                <div style={{padding:'16px 18px',
                             borderBottom:`1px solid ${C.brd||'#222226'}`}}>
                  <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                               textTransform:'uppercase',letterSpacing:'0.09em'}}>
                    Health &amp; Restrictions
                  </div>
                </div>
                <div style={{padding:'18px'}}>
                  <InjuryPanel client={client}/>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ PROGRAM ════════════ */}
          {tab==='program'&&(
            <div className="cdr3-fu">
              <TabProgram client={client} onMessage={onMessage}/>
            </div>
          )}

          {/* ════════════ MESSAGES ════════════ */}
          {tab==='messages'&&(
            <div className="cdr3-fu"
              style={{display:'grid',
                      gridTemplateColumns:'1fr 280px',
                      gap:24,alignItems:'start'}}>

              {/* Composer */}
              <div style={{borderRadius:14,background:'#111114',
                           border:`1px solid ${C.brd||'#222226'}`,
                           overflow:'hidden'}}>
                <div style={{padding:'16px 20px',
                             borderBottom:`1px solid ${C.brd||'#222226'}`}}>
                  <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                               textTransform:'uppercase',letterSpacing:'0.09em'}}>
                    Compose Message
                  </div>
                </div>
                <div style={{padding:'22px'}}>
                  <MessageComposer client={client} onMessage={onMessage}/>
                </div>
              </div>

              {/* Quick templates */}
              <div style={{borderRadius:14,background:'#111114',
                           border:`1px solid ${C.brd||'#222226'}`,
                           overflow:'hidden'}}>
                <div style={{padding:'16px 18px',
                             borderBottom:`1px solid ${C.brd||'#222226'}`}}>
                  <div style={{fontSize:9.5,fontWeight:700,color:C.t3,
                               textTransform:'uppercase',letterSpacing:'0.09em'}}>
                    Quick Templates
                  </div>
                </div>
                <div style={{padding:'8px'}}>
                  {COACH_ACTIONS.map((a,i)=>(
                    <button key={i}
                      onClick={()=>onMessage({...client,_action:a})}
                      className="cdr3-btn"
                      style={{width:'100%',padding:'11px 13px',
                              borderRadius:9,background:'transparent',
                              border:'none',color:C.t2,
                              cursor:'pointer',fontFamily:FONT,
                              textAlign:'left',display:'flex',
                              alignItems:'center',gap:10,
                              borderBottom:i<COACH_ACTIONS.length-1
                                ?`1px solid ${C.brd||'#222226'}`:'none'}}
                      onMouseEnter={e=>{
                        e.currentTarget.style.background='rgba(77,127,255,0.07)';
                        e.currentTarget.style.color='#fff';
                      }}
                      onMouseLeave={e=>{
                        e.currentTarget.style.background='transparent';
                        e.currentTarget.style.color=C.t2;
                      }}>
                      <span style={{flex:1,fontSize:12.5,fontWeight:500}}>{a}</span>
                      <ChevronRight style={{width:12,height:12,
                                           flexShrink:0,opacity:.3}}/>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
