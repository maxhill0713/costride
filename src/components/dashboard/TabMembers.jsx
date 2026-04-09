import { useState, useMemo, useCallback } from "react";
import {
  AlertTriangle, TrendingDown, TrendingUp, Users, UserPlus,
  Flame, Send, X, ChevronRight, ChevronDown, ChevronLeft, Search,
  Check, Bell, Activity, Star, MoreHorizontal, Plus, QrCode,
  Zap, Target, BarChart2, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Design tokens ──────────────────────────────────────────── */
const T = {
  bg:       '#060c18',
  surface:  '#0b1221',
  surfaceH: '#0f1830',
  border:   'rgba(255,255,255,0.06)',
  borderM:  'rgba(255,255,255,0.10)',
  text:     '#eef2ff',
  textSec:  '#7d8ea6',
  textMut:  '#3d4f66',
  blue:     '#3b82f6', blueDim: 'rgba(59,130,246,0.12)', blueBd: 'rgba(59,130,246,0.28)',
  red:      '#f04f4f', redDim:  'rgba(240,79,79,0.10)',  redBd:  'rgba(240,79,79,0.22)',
  amber:    '#f59e0b', amberDim:'rgba(245,158,11,0.10)', amberBd:'rgba(245,158,11,0.22)',
  green:    '#34d399', greenDim:'rgba(52,211,153,0.10)', greenBd:'rgba(52,211,153,0.22)',
};
const card = (ex={}) => ({ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, ...ex });

/* ── Mock Data ──────────────────────────────────────────────── */
const NOW = new Date();
const daysAgo = n => new Date(NOW.getTime() - n * 864e5);
const MOCK_MEMBERS = [
  { id:"1", name:"Marcus Webb",    initials:"MW", ci:0, plan:"Premium", val:120, lastVisit:daysAgo(22), daysSince:22,  v30:0,  pv30:8,  vTotal:47,  streak:0,  churn:84, jDays:180, retChance:38, reasons:["No visits in 22 days","Was averaging 8/mo → 0","Missed last 3 classes"],        action:"Send 'We miss you'",   status:"At risk",      seg:"atRisk"  },
  { id:"2", name:"Priya Sharma",   initials:"PS", ci:1, plan:"Monthly", val:60,  lastVisit:daysAgo(16), daysSince:16,  v30:1,  pv30:4,  vTotal:31,  streak:0,  churn:71, jDays:95,  retChance:44, reasons:["16 days since last visit","Frequency down 75%"],                              action:"Friendly check-in",    status:"Dropping off", seg:"atRisk"  },
  { id:"3", name:"Tyler Rhodes",   initials:"TR", ci:2, plan:"Monthly", val:60,  lastVisit:daysAgo(9),  daysSince:9,   v30:1,  pv30:5,  vTotal:12,  streak:0,  churn:55, jDays:28,  retChance:52, reasons:["New member not building habit","Only 1 visit this month"],                    action:"Habit-building nudge", status:"New",          seg:"new"     },
  { id:"4", name:"Chloe Nakamura", initials:"CN", ci:3, plan:"Annual",  val:90,  lastVisit:daysAgo(1),  daysSince:1,   v30:14, pv30:11, vTotal:203, streak:18, churn:4,  jDays:420, retChance:96, reasons:[],                                                                              action:"Challenge invite",     status:"Consistent",   seg:"active"  },
  { id:"5", name:"Devon Osei",     initials:"DO", ci:4, plan:"Monthly", val:60,  lastVisit:daysAgo(19), daysSince:19,  v30:0,  pv30:3,  vTotal:8,   streak:0,  churn:78, jDays:45,  retChance:35, reasons:["19 days absent","Early-stage member at risk"],                               action:"Personal outreach",    status:"At risk",      seg:"atRisk"  },
  { id:"6", name:"Anya Petrov",    initials:"AP", ci:5, plan:"Premium", val:120, lastVisit:daysAgo(0),  daysSince:0,   v30:9,  pv30:7,  vTotal:88,  streak:7,  churn:6,  jDays:210, retChance:94, reasons:[],                                                                              action:"Referral ask",         status:"Engaged",      seg:"active"  },
  { id:"7", name:"Jamie Collins",  initials:"JC", ci:6, plan:"Monthly", val:60,  lastVisit:daysAgo(5),  daysSince:5,   v30:2,  pv30:4,  vTotal:19,  streak:0,  churn:42, jDays:58,  retChance:58, reasons:[],                                                                              action:"Motivate",             status:"Dropping off", seg:"inactive"},
  { id:"8", name:"Sam Rivera",     initials:"SR", ci:7, plan:"Monthly", val:60,  lastVisit:null,        daysSince:999, v30:0,  pv30:0,  vTotal:1,   streak:0,  churn:91, jDays:6,   retChance:30, reasons:["Joined 6 days ago, 1 visit only","Critical first-week window"],               action:"Week-1 welcome",       status:"New",          seg:"new"     },
];
const PAL = [
  {bg:"rgba(59,130,246,0.14)",txt:"#6ea8fe"},{bg:"rgba(16,185,129,0.14)",txt:"#4ade80"},
  {bg:"rgba(139,92,246,0.14)",txt:"#c084fc"},{bg:"rgba(245,158,11,0.14)",txt:"#fbbf24"},
  {bg:"rgba(239,68,68,0.14)", txt:"#f87171"},{bg:"rgba(6,182,212,0.14)", txt:"#22d3ee"},
  {bg:"rgba(168,85,247,0.14)",txt:"#d946ef"},{bg:"rgba(249,115,22,0.14)",txt:"#fb923c"},
];

function churnColor(p) { return p>=70?T.red:p>=40?T.amber:T.green; }
function statusColor(s) { return {["At risk"]:T.red,["Dropping off"]:T.amber,["Consistent"]:T.green,["Engaged"]:T.green,["New"]:T.blue}[s]||T.textSec; }

/* ── Avatar ─────────────────────────────────────────────────── */
function Av({ m, size=30 }) {
  const c = PAL[m.ci % PAL.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, background:c.bg,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.32, fontWeight:700, color:c.txt, letterSpacing:'0.02em' }}>
      {m.initials}
    </div>
  );
}

/* ── Badge ──────────────────────────────────────────────────── */
function Bdg({ label, color='blue' }) {
  const m={blue:[T.blue,T.blueDim,T.blueBd],red:[T.red,T.redDim,T.redBd],amber:[T.amber,T.amberDim,T.amberBd],green:[T.green,T.greenDim,T.greenBd]};
  const [fg,bg,bd]=m[color]||m.blue;
  return <span style={{ padding:'2px 8px', borderRadius:5, background:bg, border:`1px solid ${bd}`, fontSize:10, fontWeight:800, color:fg, letterSpacing:'0.07em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{label}</span>;
}

/* ── Progress bar ───────────────────────────────────────────── */
function Bar({ value, color }) {
  return (
    <div style={{ height:3, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${Math.min(100,value)}%`, background:color, borderRadius:99 }}/>
    </div>
  );
}

/* ── Top header bar ─────────────────────────────────────────── */
function PageHeader({ atRisk, search, setSearch, onAddMember }) {
  const d = new Date();
  const ds = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const ms = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 24px',
      borderBottom:`1px solid ${T.border}`, background:T.surface, flexShrink:0 }}>
      <div style={{ display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
          <span style={{ fontSize:16, fontWeight:800, color:T.text, letterSpacing:'-0.02em' }}>Members</span>
          <span style={{ fontSize:14, color:T.textMut }}>/</span>
          <span style={{ fontSize:14, color:T.textSec }}>Hub</span>
        </div>
        <span style={{ fontSize:11, color:T.textMut, marginTop:1 }}>{ds[d.getDay()]} {d.getDate()} {ms[d.getMonth()]}</span>
      </div>
      <div style={{ flex:1 }}/>
      <div style={{ position:'relative' }}>
        <Search size={13} color={T.textMut} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search members..."
          style={{ padding:'7px 12px 7px 30px', background:T.surfaceH, border:`1px solid ${T.border}`,
            borderRadius:9, color:T.textSec, fontSize:12, outline:'none', width:220 }}/>
      </div>
      <button style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px',
        background:T.surfaceH, border:`1px solid ${T.borderM}`, borderRadius:9,
        color:T.textSec, fontSize:12, fontWeight:600, cursor:'pointer' }}>
        <QrCode size={13}/> Scan QR
      </button>
      <Av m={{initials:'MX',ci:0}} size={30}/>
      <span style={{ fontSize:12, fontWeight:600, color:T.text }}>Max</span>
      {atRisk>0 && (
        <span style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px',
          background:T.redDim, border:`1px solid ${T.redBd}`, borderRadius:20,
          fontSize:11, fontWeight:800, color:T.red }}>
          <span style={{ width:6,height:6,borderRadius:'50%',background:T.red }}/>
          {atRisk} At Risk
        </span>
      )}
    </div>
  );
}

/* ── Alert Banner ───────────────────────────────────────────── */
function AlertBanner({ atRisk, totalVal }) {
  if (atRisk === 0) return null;
  return (
    <div style={{ margin:'20px 24px 0', padding:'12px 18px',
      background:`linear-gradient(135deg,${T.surface} 60%,rgba(240,79,79,0.07) 100%)`,
      border:`1px solid ${T.redBd}`, borderLeft:`3px solid ${T.red}`, borderRadius:10,
      display:'flex', alignItems:'center', gap:12 }}>
      <AlertTriangle size={16} color={T.red}/>
      <span style={{ fontSize:13, fontWeight:700, color:T.text }}>Attention Required: Critical Churn Interventions</span>
      <span style={{ fontSize:12, color:T.textSec, marginLeft:4 }}>— {atRisk} members at risk · ${totalVal}/mo</span>
    </div>
  );
}

/* ── Journey Strip ──────────────────────────────────────────── */
function JourneyStrip({ members }) {
  const atRisk = members.filter(m=>m.churn>=60).length;
  const newM   = members.filter(m=>m.jDays<=14).length;
  const active = members.filter(m=>m.streak>=5).length;
  const steps = [
    { label:'Message At-Risk Members', done: atRisk===0, color:T.red },
    { label:'Welcome New Members',     done: newM===0,   color:T.amber },
    { label:'Reward Top Performers',   done: false,      color:T.green },
  ];
  return (
    <div style={{ margin:'14px 24px 0', padding:'12px 18px',
      background:T.surfaceH, border:`1px solid ${T.border}`, borderRadius:10,
      display:'flex', alignItems:'center', gap:6 }}>
      <span style={{ fontSize:11, fontWeight:700, color:T.textSec, marginRight:8, whiteSpace:'nowrap' }}>Member Success Journey</span>
      {steps.map((s,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
          {i>0 && <div style={{ height:2, flex:1, background:s.done?s.color:'rgba(255,255,255,0.07)', borderRadius:99, minWidth:20 }}/>}
          <span style={{ fontSize:11, fontWeight:s.done?700:500,
            color:s.done?s.color:T.textMut, whiteSpace:'nowrap',
            padding:'3px 9px', borderRadius:20,
            background:s.done?`rgba(${s.color===T.red?'240,79,79':s.color===T.amber?'245,158,11':'52,211,153'},0.1)`:'rgba(255,255,255,0.03)',
            border:`1px solid ${s.done?s.color+'44':'rgba(255,255,255,0.06)'}` }}>
            {s.done ? '✓ ' : `Step ${i+1}: `}{s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Filter Tabs ────────────────────────────────────────────── */
function FilterTabs({ filter, setFilter, counts }) {
  const tabs = [
    {id:'all',label:'All',count:counts.all},
    {id:'atRisk',label:'At Risk',count:counts.atRisk},
    {id:'dropping',label:'Dropping Off',count:counts.dropping},
    {id:'new',label:'New Members',count:counts.new},
    {id:'active',label:'On Streak',count:counts.active},
    {id:'inactive',label:'Inactive',count:counts.inactive},
  ];
  return (
    <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${T.border}`, padding:'0 24px', marginTop:16 }}>
      {tabs.map(t=>{
        const on=filter===t.id;
        return (
          <button key={t.id} onClick={()=>setFilter(t.id)}
            style={{ padding:'9px 14px', fontSize:12, fontWeight:on?700:500, cursor:'pointer',
              color:on?T.text:T.textMut, background:'none', border:'none',
              borderBottom:`2px solid ${on?T.blue:'transparent'}`,
              display:'flex', alignItems:'center', gap:5, marginBottom:-1, transition:'all 0.15s' }}>
            {t.label}
            {t.count>0&&<span style={{ fontSize:10, padding:'1px 6px', borderRadius:99, fontWeight:700,
              background:on?T.blueDim:'rgba(255,255,255,0.04)', color:on?T.blue:T.textMut }}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Members Table ──────────────────────────────────────────── */
const GCOLS = "28px 1.8fr 1.1fr 80px 90px 80px 110px";
function MembersTable({ members, filter, search, sort, setSort, selectedRows, toggleRow, toggleAll, onMessage, onSelect, selectedId }) {
  const filtered = useMemo(()=>{
    let l=members;
    if(filter==='atRisk')   l=l.filter(m=>m.churn>=60);
    if(filter==='dropping') l=l.filter(m=>m.pv30>0&&m.v30<=m.pv30*0.5);
    if(filter==='new')      l=l.filter(m=>m.jDays<=14);
    if(filter==='active')   l=l.filter(m=>m.streak>=5);
    if(filter==='inactive') l=l.filter(m=>m.daysSince>=14);
    if(search) l=l.filter(m=>m.name.toLowerCase().includes(search.toLowerCase()));
    return l;
  },[members,filter,search]);
  const sorted = useMemo(()=>[...filtered].sort((a,b)=>{
    if(sort==='churnDesc') return b.churn-a.churn;
    if(sort==='lastVisit') return a.daysSince-b.daysSince;
    if(sort==='value')     return b.val-a.val;
    if(sort==='name')      return a.name.localeCompare(b.name);
    return b.churn-a.churn;
  }),[filtered,sort]);

  const cols=[{label:'MEMBER',key:'name'},{label:'STATUS',key:null},{label:'CHURN',key:'churnDesc'},{label:'LAST SEEN',key:'lastVisit'},{label:'TREND',key:null},{label:'VALUE',key:'value'},{label:'ACTION',key:null}];

  return (
    <div style={{ overflowX:'auto' }}>
      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:GCOLS, gap:8, padding:'8px 20px',
        borderBottom:`1px solid ${T.border}`, background:'rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
          <input type="checkbox" checked={sorted.length>0&&selectedRows.size===sorted.length}
            onChange={()=>toggleAll(sorted)} style={{ cursor:'pointer', accentColor:T.blue, width:12, height:12 }}/>
        </div>
        {cols.map((c,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span onClick={()=>c.key&&setSort(c.key)} style={{ fontSize:9.5, fontWeight:700, letterSpacing:'0.12em',
              textTransform:'uppercase', color:sort===c.key?T.textSec:T.textMut, cursor:c.key?'pointer':'default' }}>
              {c.label}
            </span>
            {c.key&&<ChevronDown size={8} color={T.textMut}/>}
          </div>
        ))}
      </div>

      {sorted.length===0&&(
        <div style={{ padding:'48px 20px', textAlign:'center', color:T.textMut }}>
          <Users size={28} style={{ margin:'0 auto 12px', opacity:0.3, display:'block' }}/>
          <div style={{ fontSize:13, color:T.textSec }}>No members match</div>
        </div>
      )}

      {sorted.map((m,idx)=>{
        const isSel=selectedRows.has(m.id);
        const isPrev=selectedId===m.id;
        const trendPct=m.pv30>0?Math.round(((m.v30-m.pv30)/m.pv30)*100):0;
        const lastLabel=m.daysSince===999?'Never':m.daysSince===0?'Today':`${m.daysSince}d ago`;
        const lastColor=m.daysSince>=14?T.red:m.daysSince<=1?T.green:T.text;
        return (
          <div key={m.id} onClick={()=>onSelect(m)}
            style={{ display:'grid', gridTemplateColumns:GCOLS, gap:8, padding:'11px 20px',
              borderBottom:`1px solid rgba(255,255,255,0.03)`, cursor:'pointer', transition:'background 0.1s',
              borderLeft:`3px solid ${isPrev?T.blue:'transparent'}`,
              background:isPrev?'rgba(59,130,246,0.06)':isSel?'rgba(59,130,246,0.03)':'transparent' }}
            onMouseEnter={e=>{ if(!isPrev&&!isSel) e.currentTarget.style.background='rgba(255,255,255,0.02)'; }}
            onMouseLeave={e=>{ if(!isPrev&&!isSel) e.currentTarget.style.background='transparent'; }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}
              onClick={e=>{e.stopPropagation();toggleRow(m.id);}}>
              <input type="checkbox" checked={isSel} onChange={()=>toggleRow(m.id)}
                style={{ cursor:'pointer', accentColor:T.blue, width:12, height:12 }}/>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:0 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <Av m={m} size={28}/>
                {m.streak>=5&&<div style={{ position:'absolute', top:-2, right:-2, width:10, height:10, borderRadius:'50%', background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}><Flame size={6} color={T.amber}/></div>}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:isPrev?T.blue:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</div>
                <div style={{ fontSize:10, color:T.textMut, marginTop:1 }}>{m.plan} · {m.vTotal} visits</div>
              </div>
            </div>
            <div>
              <Bdg label={m.status} color={m.status==='At risk'||m.status==='Dropping off'?'red':m.status==='New'?'blue':'green'}/>
            </div>
            <div>
              <span style={{ fontSize:13, fontWeight:700, color:churnColor(m.churn) }}>{m.churn}%</span>
              <Bar value={m.churn} color={churnColor(m.churn)}/>
            </div>
            <div>
              <span style={{ fontSize:12, fontWeight:600, color:lastColor }}>{lastLabel}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              {trendPct>10?<><TrendingUp size={11} color={T.green}/><span style={{fontSize:10,color:T.green}}>+{trendPct}%</span></>:
               trendPct<-10?<><TrendingDown size={11} color={T.red}/><span style={{fontSize:10,color:T.red}}>{trendPct}%</span></>:
               <span style={{fontSize:10,color:T.textMut}}>—</span>}
            </div>
            <div>
              <span style={{ fontSize:12, fontWeight:600, color:T.text }}>${m.val}/mo</span>
            </div>
            <div onClick={e=>e.stopPropagation()}>
              <button onClick={()=>onMessage(m)} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px',
                background:T.blueDim, border:`1px solid ${T.blueBd}`, borderRadius:7,
                color:T.blue, fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                <Send size={9}/> {m.action.length>14?m.action.slice(0,14)+'…':m.action}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Right Panel ────────────────────────────────────────────── */
function RightPanel({ members, onMessage, onAddMember }) {
  const highRisk = members.filter(m=>m.churn>=70);
  const newQuiet = members.filter(m=>m.jDays<=10&&m.vTotal<2);

  const suggestions = [
    { label:'Message At-Risk Members', color:'red',   icon:Send },
    { label:'Welcome New Members',     color:'amber',  icon:UserPlus },
    { label:'Post Member Spotlight',   color:'blue',  icon:Star },
    { label:'Create Weekend Challenge',color:'green', icon:Zap },
  ];

  const dropoffs = [
    {label:'Week 1', pct:25, color:T.red},
    {label:'Week 2', pct:66, color:T.amber},
    {label:'Week 4', pct:41, color:T.textMut},
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* Action Suggestions */}
      <div style={card()}>
        <div style={{ padding:'13px 16px', borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:T.text }}>What To Do Today?</div>
          <div style={{ fontSize:10.5, color:T.textMut, marginTop:2 }}>Guided Actions</div>
        </div>
        <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
          {suggestions.map(({label,color,icon:Icon},i)=>{
            const m={red:[T.red,T.redDim,T.redBd],amber:[T.amber,T.amberDim,T.amberBd],blue:[T.blue,T.blueDim,T.blueBd],green:[T.green,T.greenDim,T.greenBd]};
            const [fg,bg,bd]=m[color];
            return (
              <button key={i} onClick={()=>color==='red'&&highRisk.length>0?onMessage(highRisk[0]):null}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:9,
                  background:bg, border:`1px solid ${bd}`, cursor:'pointer', textAlign:'left', width:'100%' }}>
                <Icon size={11} color={fg}/>
                <span style={{ fontSize:11.5, fontWeight:600, color:fg }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actionable Insights */}
      <div style={card()}>
        <div style={{ padding:'13px 16px', borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:T.text }}>Actionable Insights</div>
        </div>
        <div style={{ padding:'14px 16px' }}>
          {/* Simple bar chart */}
          <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:60, marginBottom:10 }}>
            {[45,72,38,81,55,29,63].map((v,i)=>(
              <div key={i} style={{ flex:1, borderRadius:'3px 3px 0 0',
                background: i===3?T.blue:`rgba(59,130,246,${0.15+i*0.03})`,
                height:`${(v/90)*100}%`, transition:'height 0.3s' }}/>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {[
              `${highRisk.length} members haven't been in 14+ days`,
              "Engaged members refer at 3× the rate",
              "New members respond best in days 3–7",
            ].map((s,i)=>(
              <div key={i} style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
                <span style={{ color:T.textMut, fontSize:11, marginTop:1 }}>·</span>
                <span style={{ fontSize:11, color:T.textSec, lineHeight:1.5 }}>{s}</span>
              </div>
            ))}
          </div>
          <button style={{ marginTop:10, fontSize:11, color:T.blue, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, padding:0 }}>
            Review Detailed Insights <ArrowRight size={10}/>
          </button>
        </div>
      </div>

      {/* Member Preview */}
      {highRisk.length > 0 && (
        <div style={{ ...card(), border:`1px solid ${T.redBd}` }}>
          <div style={{ padding:'13px 16px', borderBottom:`1px solid ${T.border}` }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.text }}>Member Preview</div>
          </div>
          <div style={{ padding:'14px 16px' }}>
            {highRisk.slice(0,2).map((m,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10,
                padding:'9px 0', borderBottom:i<highRisk.slice(0,2).length-1?`1px solid ${T.border}`:'none' }}>
                <Av m={m} size={30}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{m.name}</div>
                  <div style={{ fontSize:10.5, color:T.red, marginTop:2 }}>{m.daysSince}d absent · {m.churn}% churn risk</div>
                </div>
                <button onClick={()=>onMessage(m)} style={{ padding:'5px 10px', borderRadius:7, background:T.redDim,
                  border:`1px solid ${T.redBd}`, color:T.red, fontSize:10, fontWeight:600, cursor:'pointer' }}>
                  Message
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop-off patterns */}
      <div style={card()}>
        <div style={{ padding:'13px 16px', borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:T.text }}>Drop-off Patterns</div>
        </div>
        <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
          {dropoffs.map(({label,pct,color},i)=>(
            <div key={i}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:11, color:T.textSec }}>{label}</span>
                <span style={{ fontSize:11, fontWeight:700, color }}>{pct}%</span>
              </div>
              <Bar value={pct} color={color}/>
            </div>
          ))}
        </div>
      </div>

      {/* Add Member CTA */}
      <button onClick={onAddMember}
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          padding:'12px', borderRadius:10, background:T.blue, color:'#fff', border:'none',
          fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:`0 4px 20px rgba(59,130,246,0.3)` }}>
        <Plus size={14}/> Add Member
      </button>
    </div>
  );
}

/* ── Message Toast ──────────────────────────────────────────── */
function MsgToast({ member, onClose }) {
  const [sent, setSent] = useState(false);
  const [body, setBody] = useState(member?`Hey ${member.name.split(' ')[0]}, we've missed seeing you at the gym. Your progress is waiting — come back!`:'');
  if (!member) return null;
  return (
    <div style={{ position:'fixed', bottom:100, right:24, width:340, background:T.surface,
      border:`1px solid ${T.borderM}`, borderRadius:14, boxShadow:'0 8px 40px rgba(0,0,0,0.4)',
      zIndex:300, overflow:'hidden' }}>
      <div style={{ padding:'11px 14px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <Bell size={12} color={T.textMut}/>
          <span style={{ fontSize:11.5, fontWeight:600, color:T.text }}>Push notification → {member.name.split(' ')[0]}</span>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}><X size={13} color={T.textMut}/></button>
      </div>
      <div style={{ padding:'12px 14px' }}>
        <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3}
          style={{ width:'100%', background:T.surfaceH, border:`1px solid ${T.border}`, borderRadius:8,
            padding:'9px 11px', fontSize:11.5, color:T.text, resize:'none', outline:'none', boxSizing:'border-box', lineHeight:1.5 }}/>
        <div style={{ fontSize:10.5, color:T.textMut, marginTop:4 }}>{member.retChance}% predicted return rate</div>
        <button onClick={()=>{setSent(true);setTimeout(onClose,1600);}}
          style={{ marginTop:8, width:'100%', padding:'9px', borderRadius:8, border:'none',
            background:sent?T.greenDim:T.blue, color:sent?T.green:'#fff', fontSize:12, fontWeight:600,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          {sent?<><Check size={12}/>Sent!</>:<><Send size={12}/>Send to {member.name.split(' ')[0]}</>}
        </button>
      </div>
    </div>
  );
}

/* ── Root ───────────────────────────────────────────────────── */
export default function MembersPageAI() {
  const members = MOCK_MEMBERS;
  const [filter,        setFilter]  = useState('all');
  const [search,        setSearch]  = useState('');
  const [sort,          setSort]    = useState('churnDesc');
  const [selectedRows,  setSelRows] = useState(new Set());
  const [selectedId,    setSelId]   = useState(null);
  const [msgTarget,     setMsgTgt]  = useState(null);

  const counts = useMemo(()=>({
    all:      members.length,
    atRisk:   members.filter(m=>m.churn>=60).length,
    dropping: members.filter(m=>m.pv30>0&&m.v30<=m.pv30*0.5).length,
    new:      members.filter(m=>m.jDays<=14).length,
    active:   members.filter(m=>m.streak>=5).length,
    inactive: members.filter(m=>m.daysSince>=14).length,
  }),[members]);

  const atRisk = members.filter(m=>m.churn>=60);
  const atRiskVal = atRisk.reduce((s,m)=>s+m.val,0);

  const toggleRow = useCallback(id=>setSelRows(p=>{const s=new Set(p);s.has(id)?s.delete(id):s.add(id);return s;}),[]);
  const toggleAll = useCallback(rows=>{if(selectedRows.size===rows.length)setSelRows(new Set());else setSelRows(new Set(rows.map(m=>m.id)));},[ selectedRows]);

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, display:'flex', flexDirection:'column',
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>

      <PageHeader atRisk={atRisk.length} search={search} setSearch={setSearch} onAddMember={()=>{}}/>

      <AlertBanner atRisk={atRisk.length} totalVal={atRiskVal}/>
      <JourneyStrip members={members}/>
      <FilterTabs filter={filter} setFilter={setFilter} counts={counts}/>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, padding:'16px 24px 40px', alignItems:'start' }}>

        {/* Main table card */}
        <div style={{ ...card(), overflow:'hidden' }}>
          {/* Table top bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Users size={14} color={T.blue}/>
              <span style={{ fontSize:12.5, fontWeight:700, color:T.text }}>All Members</span>
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:T.blueDim, color:T.blue, fontWeight:700 }}>{members.length}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:T.textMut }}>Sort:</span>
              <select value={sort} onChange={e=>setSort(e.target.value)}
                style={{ padding:'4px 8px', background:T.surfaceH, border:`1px solid ${T.border}`,
                  borderRadius:7, color:T.textSec, fontSize:11, outline:'none' }}>
                <option value="churnDesc">Highest Risk</option>
                <option value="lastVisit">Recently Active</option>
                <option value="value">Highest Value</option>
                <option value="name">Name A–Z</option>
              </select>
              <button style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
                background:T.blue, border:'none', borderRadius:8,
                color:'#fff', fontSize:11.5, fontWeight:600, cursor:'pointer' }}>
                <Plus size={11}/> Add Member
              </button>
            </div>
          </div>

          <MembersTable
            members={members} filter={filter} search={search} sort={sort} setSort={setSort}
            selectedRows={selectedRows} toggleRow={toggleRow} toggleAll={toggleAll}
            onMessage={m=>setMsgTgt(m)} onSelect={m=>setSelId(p=>p===m.id?null:m.id)} selectedId={selectedId}
          />

          {/* Bulk bar */}
          {selectedRows.size>0&&(
            <div style={{ padding:'10px 20px', borderTop:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:8, background:T.surfaceH }}>
              <span style={{ fontSize:11.5, color:T.textSec }}>{selectedRows.size} selected</span>
              <button onClick={()=>{ const sel=members.filter(m=>selectedRows.has(m.id)); if(sel.length) setMsgTgt(sel[0]); }}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7,
                  background:T.blue, border:'none', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                <Send size={10}/> Message {selectedRows.size}
              </button>
              <button onClick={()=>setSelRows(new Set())}
                style={{ fontSize:11, color:T.textMut, background:'none', border:'none', cursor:'pointer' }}>Clear</button>
            </div>
          )}

          {/* Pagination */}
          <div style={{ padding:'10px 20px', borderTop:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:4 }}>
              {[ChevronLeft,ChevronRight].map((Icon,i)=>(
                <button key={i} style={{ width:26, height:26, borderRadius:7, background:T.surfaceH,
                  border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', opacity:0.5 }}>
                  <Icon size={12} color={T.textSec}/>
                </button>
              ))}
              <button style={{ width:26, height:26, borderRadius:7, background:T.blueDim,
                border:`1px solid ${T.blueBd}`, display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', fontSize:11, fontWeight:700, color:T.blue }}>1</button>
            </div>
            <span style={{ fontSize:10.5, color:T.textMut }}>{members.length} members · page 1 of 1</span>
          </div>
        </div>

        {/* Right panel */}
        <RightPanel members={members} onMessage={setMsgTgt} onAddMember={()=>{}}/>
      </div>

      <MsgToast member={msgTarget} onClose={()=>setMsgTgt(null)}/>
    </div>
  );
}