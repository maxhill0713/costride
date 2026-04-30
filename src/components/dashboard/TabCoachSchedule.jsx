/**
 * TabCoachSchedule — Session Performance Tool
 * Redesigned to match ContentPage design language.
 * Full-width layout · no sidebar · DM Sans · same C tokens.
 * Same logic, completely new visual system.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  format, subDays, addDays, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, differenceInMinutes,
} from 'date-fns';
import {
  QrCode, Dumbbell, Calendar, Bell, Clock, Check, ChevronDown,
  UserCheck, Users, AlertCircle, CheckCircle, RefreshCw, Pencil, Trash2,
  X, User, DollarSign, MapPin, ChevronLeft, ChevronRight,
  TrendingUp, Zap, BarChart2, Ban, AlertTriangle,
  Activity, Flame, ArrowRight, MessageCircle, UserX,
  ArrowUpRight, ArrowDownRight, Minus, Send, XCircle,
  Star, Plus, Search, MoreHorizontal, Sparkles, Lightbulb, Target,
  Megaphone, Layers, Radio, Filter,
} from 'lucide-react';

/* ─── TOKENS (same as ContentPage) ──────────────────────────── */
const C = {
  bg:     '#000000',
  sidebar:'#0f0f12',
  card:   '#141416',
  card2:  '#18181b',
  brd:    '#222226',
  brd2:   '#2a2a30',
  t1:     '#ffffff',
  t2:     '#8a8a94',
  t3:     '#444450',
  cyan:   '#4d7fff',
  cyanD:  'rgba(77,127,255,0.10)',
  cyanB:  'rgba(77,127,255,0.28)',
  red:    '#ff4d6d',
  redD:   'rgba(255,77,109,0.10)',
  redB:   'rgba(255,77,109,0.28)',
  amber:  '#f59e0b',
  amberD: 'rgba(245,158,11,0.10)',
  amberB: 'rgba(245,158,11,0.28)',
  green:  '#22c55e',
  greenD: 'rgba(34,197,94,0.10)',
  greenB: 'rgba(34,197,94,0.28)',
  blue:   '#3b82f6',
  blueD:  'rgba(59,130,246,0.10)',
  blueB:  'rgba(59,130,246,0.28)',
  violet: '#a78bfa',
  violetD:'rgba(167,139,250,0.10)',
  violetB:'rgba(167,139,250,0.28)',
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

/* ─── CSS ────────────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('tcs-css')) {
  const s = document.createElement('style');
  s.id = 'tcs-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
    .tcs * { box-sizing: border-box; }
    .tcs { font-family: 'DM Sans','Segoe UI',sans-serif; -webkit-font-smoothing: antialiased; }
    @keyframes tcsFadeUp  { from { opacity:0; transform:translateY(8px)  } to { opacity:1; transform:none } }
    @keyframes tcsFadeIn  { from { opacity:0 } to { opacity:1 } }
    @keyframes tcsSlideIn { from { transform:translateX(100%); opacity:0 } to { transform:none; opacity:1 } }
    @keyframes tcsSlideUp { from { transform:translateY(100%); opacity:0 } to { transform:none; opacity:1 } }
    @keyframes tcsPulse   { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }
    @keyframes tcsBarFill { from{width:0} to{width:var(--w)} }
    .tcs-fu   { animation: tcsFadeUp  .35s cubic-bezier(.16,1,.3,1) both; }
    .tcs-fi   { animation: tcsFadeIn  .25s ease both; }
    .tcs-si   { animation: tcsSlideIn .25s cubic-bezier(.16,1,.3,1) both; }
    .tcs-btn  { font-family:'DM Sans','Segoe UI',sans-serif; cursor:pointer; outline:none; border:none; transition:all .15s cubic-bezier(.16,1,.3,1); display:inline-flex; align-items:center; gap:6px; }
    .tcs-btn:hover  { opacity:.88; }
    .tcs-btn:active { transform:scale(.97); }
    .tcs-card { transition: border-color .15s, box-shadow .15s, transform .15s; }
    .tcs-card:hover { border-color: rgba(77,127,255,0.28) !important; box-shadow: 0 0 0 0 transparent, 0 4px 20px rgba(0,0,0,.3) !important; }
    .tcs-row  { transition: background .1s; cursor: pointer; }
    .tcs-row:hover { background: #1a1a1e !important; }
    .tcs-input {
      width:100%; background:rgba(255,255,255,.03); border:1px solid #222226;
      color:#fff; font-size:13px; font-family:'DM Sans','Segoe UI',sans-serif;
      outline:none; border-radius:8px; padding:10px 14px; transition:all .18s;
    }
    .tcs-input:focus { border-color:rgba(77,127,255,.4); background:rgba(77,127,255,.04); }
    .tcs-input::placeholder { color:#444450; }
    .tcs-scr::-webkit-scrollbar { width:3px; }
    .tcs-scr::-webkit-scrollbar-thumb { background:#222226; border-radius:3px; }
    .tcs-live { animation: tcsPulse 2s ease infinite; }
    .tcs-bar  { animation: tcsBarFill .7s cubic-bezier(.16,1,.3,1) both; animation-delay:.15s; }
    @media(max-width:900px) { .tcs-bottom-grid { grid-template-columns: 1fr !important; } }
  `;
  document.head.appendChild(s);
}

/* ─── CLASS TYPE REGISTRY ────────────────────────────────────── */
const CLASS_CFG = {
  hiit:       { color:'#f87171', label:'HIIT',       emoji:'🔥' },
  yoga:       { color:'#34d399', label:'Yoga',       emoji:'🧘' },
  spin:       { color:C.blue,    label:'Spin',       emoji:'🚴' },
  strength:   { color:'#fb923c', label:'Strength',   emoji:'💪' },
  pilates:    { color:C.violet,  label:'Pilates',    emoji:'🌸' },
  boxing:     { color:C.amber,   label:'Boxing',     emoji:'🥊' },
  crossfit:   { color:'#f97316', label:'CrossFit',   emoji:'⚡' },
  cardio:     { color:'#f472b6', label:'Cardio',     emoji:'❤️' },
  functional: { color:C.violet,  label:'Functional', emoji:'🎯' },
  pt:         { color:C.cyan,    label:'PT',         emoji:'👤' },
  default:    { color:C.cyan,    label:'Class',      emoji:'🏋️' },
};
function getTypeCfg(cls) {
  const n = (cls.name||cls.class_type||cls.type||'').toLowerCase();
  if (n.includes('personal') || n.includes('pt') || n.includes('appointment')) return { ...CLASS_CFG.pt, key:'pt' };
  for (const [k,v] of Object.entries(CLASS_CFG)) {
    if (k!=='default' && n.includes(k)) return { ...v, key:k };
  }
  return { ...CLASS_CFG.default, key:'default' };
}

/* ─── HELPERS ────────────────────────────────────────────────── */
const LATE_HRS = 24;
function getLateCancel(cls) {
  if (!Array.isArray(cls.late_cancels)) return [];
  return cls.late_cancels.filter(lc => {
    const ca=lc.cancelled_at?new Date(lc.cancelled_at):null, cl=cls.start_time?new Date(cls.start_time):null;
    return ca&&cl&&differenceInMinutes(cl,ca)<LATE_HRS*60;
  });
}
function fillColor(p) { return p>=80?C.green:p>=50?C.cyan:p>=30?C.amber:C.red; }
function fillLabel(p) { return p>=90?'At Capacity':p>=70?'Strong':p>=40?'Moderate':'Underbooked'; }
function calcRS(userId, checkIns, now) {
  const uci=checkIns.filter(c=>c.user_id===userId);
  const ms=d=>now-new Date(d.check_in_date);
  const r30=uci.filter(c=>ms(c)<30*864e5).length;
  const p30=uci.filter(c=>ms(c)>=30*864e5&&ms(c)<60*864e5).length;
  const sorted=[...uci].sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date));
  const daysAgo=sorted[0]?Math.floor(ms(sorted[0])/864e5):999;
  let score=100;
  if(daysAgo>=999)score-=60;else if(daysAgo>21)score-=45;else if(daysAgo>14)score-=30;else if(daysAgo>7)score-=15;
  if(r30===0)score-=25;else if(r30<=2)score-=15;
  score=Math.max(0,Math.min(100,score));
  const trend=p30>0?(r30>p30*1.1?'up':r30<p30*.7?'down':'flat'):(r30>=2?'up':'flat');
  const status=score>=65?'safe':score>=35?'at_risk':'high_risk';
  const color=status==='safe'?C.green:status==='at_risk'?C.amber:C.red;
  return{score,status,trend,color,daysAgo,recent30:r30,prev30:p30};
}

/* ─── SVG RING ───────────────────────────────────────────────── */
function FillRing({ value=0, size=60, stroke=4, color=C.cyan }) {
  const r=(size-stroke*2)/2, circ=2*Math.PI*r;
  const offset=circ-(Math.min(value,100)/100)*circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)',flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{transition:'stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)',filter:`drop-shadow(0 0 3px ${color}50)`}}/>
    </svg>
  );
}

/* ─── AVATAR CLUSTER ─────────────────────────────────────────── */
function AvatarCluster({ members=[], avatarMap={}, max=4, size=22 }) {
  const shown=members.slice(0,max), extra=members.length-max;
  const colors=[C.cyan,C.violet,C.green,C.blue,C.amber];
  return (
    <div style={{display:'flex',alignItems:'center'}}>
      {shown.map((m,i)=>{
        const ini=(m.user_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
        const col=colors[i%colors.length];
        return (
          <div key={m.user_id||i} title={m.user_name} style={{width:size,height:size,borderRadius:'50%',border:`2px solid ${C.card}`,marginLeft:i===0?0:-size*.35,background:`${col}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.3,fontWeight:700,color:col,zIndex:shown.length-i,position:'relative',flexShrink:0}}>
            {avatarMap[m.user_id]?<img src={avatarMap[m.user_id]} alt={m.user_name} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>:ini}
          </div>
        );
      })}
      {extra>0&&<div style={{width:size,height:size,borderRadius:'50%',border:`2px solid ${C.card}`,marginLeft:-size*.35,background:'rgba(255,255,255,.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.28,fontWeight:700,color:C.t3,flexShrink:0}}>+{extra}</div>}
    </div>
  );
}

/* ─── PILL ───────────────────────────────────────────────────── */
function Pill({ children, color, bg, bdr, dot, small }) {
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:small?9:10,fontWeight:700,color:color||C.t2,background:bg||`${color||C.t2}0d`,border:`1px solid ${bdr||`${color||C.t2}20`}`,borderRadius:6,padding:small?'1px 6px':'2.5px 8px',letterSpacing:'.04em',textTransform:'uppercase',whiteSpace:'nowrap',lineHeight:'16px',fontFamily:FONT}}>
      {dot&&<span style={{width:5,height:5,borderRadius:'50%',background:color||C.t2,display:'inline-block',flexShrink:0}}/>}
      {children}
    </span>
  );
}

/* ─── STAT CHIP ──────────────────────────────────────────────── */
function StatChip({ icon:Ic, count, label, color }) {
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,color,background:`${color}0c`,border:`1px solid ${color}1c`,borderRadius:7,padding:'4px 9px'}}>
      {Ic&&<Ic style={{width:9,height:9}}/>}
      <span style={{fontWeight:700}}>{count}</span>
      <span style={{color:`${color}99`,fontWeight:500,fontSize:10}}>{label}</span>
    </span>
  );
}

/* ─── ICON BTN ───────────────────────────────────────────────── */
function IBtn({ icon:Ic, label, color, onClick, size='sm' }) {
  const p=size==='xs'?'4px 9px':'7px 13px', fs=size==='xs'?10:11;
  return (
    <button className="tcs-btn" onClick={onClick} style={{padding:p,borderRadius:8,background:`${color}0a`,border:`1px solid ${color}1c`,color,fontSize:fs,fontWeight:700,whiteSpace:'nowrap',transition:'all .13s'}}
      onMouseEnter={e=>{e.currentTarget.style.background=`${color}18`;e.currentTarget.style.borderColor=`${color}30`;}}
      onMouseLeave={e=>{e.currentTarget.style.background=`${color}0a`;e.currentTarget.style.borderColor=`${color}1c`;}}>
      {Ic&&<Ic style={{width:size==='xs'?10:11,height:size==='xs'?10:11}}/>}{label}
    </button>
  );
}

/* ─── CONFIRM DIALOG ─────────────────────────────────────────── */
function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel='Cancel Class', color=C.red }) {
  return (
    <div className="tcs-fi" style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.8)',backdropFilter:'blur(8px)'}}>
      <div className="tcs-fu" style={{background:C.card,border:`1px solid ${color}25`,borderRadius:16,padding:28,maxWidth:360,width:'90%',boxShadow:'0 24px 60px rgba(0,0,0,.6)'}}>
        <div style={{width:48,height:48,borderRadius:14,background:`${color}0d`,border:`1px solid ${color}25`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
          <AlertCircle style={{width:20,height:20,color}}/>
        </div>
        <p style={{fontSize:13,fontWeight:600,color:C.t1,textAlign:'center',margin:'0 0 20px',lineHeight:1.65,fontFamily:FONT}}>{message}</p>
        <div style={{display:'flex',gap:8}}>
          <button className="tcs-btn" onClick={onCancel} style={{flex:1,padding:10,borderRadius:9,background:'rgba(255,255,255,.04)',border:`1px solid ${C.brd}`,color:C.t2,fontSize:12,fontWeight:700}}>Go Back</button>
          <button className="tcs-btn" onClick={onConfirm} style={{flex:1,padding:10,borderRadius:9,background:`${color}12`,border:`1px solid ${color}28`,color,fontSize:12,fontWeight:700}}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── KPI CARD ───────────────────────────────────────────────── */
function KpiCard({ title, value, sub, color=C.cyan, icon:Ic, children, pulse, delay=0 }) {
  return (
    <div className="tcs-fu tcs-card" style={{padding:'18px 20px',borderRadius:14,background:C.card,border:`1px solid ${C.brd}`,position:'relative',overflow:'hidden',animationDelay:`${delay}s`,boxShadow:'0 2px 12px rgba(0,0,0,.2)'}}>
      <div style={{position:'absolute',top:0,left:16,right:16,height:1,background:`linear-gradient(90deg,transparent,${color}25,transparent)`}}/>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
        <span style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'.07em',textTransform:'uppercase'}}>{title}</span>
        {Ic&&<div style={{width:26,height:26,borderRadius:8,background:`${color}0d`,border:`1px solid ${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Ic style={{width:11,height:11,color}}/>
        </div>}
      </div>
      {children||(
        <>
          <div style={{fontSize:36,fontWeight:700,color,lineHeight:1,letterSpacing:'-0.04em',marginBottom:6}}>{value}</div>
          {sub&&<div style={{fontSize:11,color:C.t3,lineHeight:1.4}}>{sub}</div>}
        </>
      )}
      {pulse&&<div className="tcs-live" style={{position:'absolute',top:14,right:14,width:7,height:7,borderRadius:'50%',background:C.green}}/>}
    </div>
  );
}

/* ─── WEEK CELL ──────────────────────────────────────────────── */
function WeekCell({ date, isSelected, isToday, classCount, ciCount, onClick }) {
  return (
    <button className="tcs-btn" onClick={onClick} style={{
      flex:1, padding:'10px 4px 8px', borderRadius:10, textAlign:'center',
      background:isSelected?C.cyanD:isToday?'rgba(77,127,255,.04)':'transparent',
      border:isSelected?`1px solid ${C.cyanB}`:isToday?'1px solid rgba(77,127,255,.14)':`1px solid ${C.brd}`,
      transition:'all .13s', position:'relative',
    }}
      onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background='rgba(255,255,255,.03)';}}
      onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background=isToday?'rgba(77,127,255,.04)':'transparent';}}>
      <div style={{fontSize:9,fontWeight:700,color:isSelected?C.cyan:C.t3,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4}}>{format(date,'EEE')}</div>
      <div style={{fontSize:18,fontWeight:800,color:isSelected?C.cyan:isToday?C.t1:C.t2,lineHeight:1,marginBottom:6,letterSpacing:'-.03em'}}>{format(date,'d')}</div>
      {classCount>0&&<div style={{display:'flex',justifyContent:'center',gap:2,marginBottom:3}}>
        {Array.from({length:Math.min(classCount,3)},(_,j)=><div key={j} style={{width:4,height:4,borderRadius:'50%',background:isSelected?C.cyan:`${C.cyan}50`}}/>)}
      </div>}
      {ciCount>0&&<div style={{fontSize:9,fontWeight:600,color:isSelected?C.cyan:C.t3,background:isSelected?C.cyanD:'rgba(255,255,255,.04)',borderRadius:4,padding:'1px 4px',display:'inline-block'}}>{ciCount}</div>}
      {isToday&&!isSelected&&<div style={{position:'absolute',top:7,right:8,width:5,height:5,borderRadius:'50%',background:C.green,boxShadow:`0 0 5px ${C.green}80`}}/>}
    </button>
  );
}

/* ─── MONTH CELL ─────────────────────────────────────────────── */
function MonthCell({ date, isCurrentMonth, isSelected, isToday, classCount, ciCount, onClick }) {
  return (
    <div onClick={onClick} style={{padding:'7px 4px',borderRadius:8,cursor:'pointer',textAlign:'center',background:isSelected?C.cyanD:isToday?'rgba(77,127,255,.05)':'transparent',border:isSelected?`1px solid ${C.cyanB}`:isToday?'1px solid rgba(77,127,255,.14)':'1px solid transparent',opacity:isCurrentMonth?1:.2,transition:'all .1s'}}
      onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background='rgba(255,255,255,.03)';}}
      onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background=isToday?'rgba(77,127,255,.05)':'transparent';}}>
      <div style={{fontSize:12,fontWeight:isToday||isSelected?800:500,color:isSelected?C.cyan:isToday?C.t1:C.t2,lineHeight:1,marginBottom:3}}>{format(date,'d')}</div>
      {classCount>0&&<div style={{display:'flex',justifyContent:'center',gap:2,marginBottom:1}}>
        {Array.from({length:Math.min(classCount,3)},(_,j)=><div key={j} style={{width:3,height:3,borderRadius:'50%',background:isSelected?C.cyan:`${C.cyan}50`}}/>)}
      </div>}
      {ciCount>0&&<div style={{fontSize:8,fontWeight:700,color:isSelected?C.cyan:C.t3}}>{ciCount}</div>}
    </div>
  );
}

/* ─── SESSION CARD ───────────────────────────────────────────── */
function SessionCard({ cls, onOpen, isSelected, openModal, avatarMap={} }) {
  const tc=cls.typeCfg, c=tc.color;
  const booked=cls.booked.length||cls.attended.length;
  const fc=fillColor(cls.fill), fl=fillLabel(cls.fill);
  const noShows=Math.max(0,cls.booked.length-cls.attended.length);
  return (
    <div className="tcs-card" onClick={onOpen} style={{
      borderRadius:14, overflow:'hidden', background:C.card,
      border:`1px solid ${isSelected?C.cyanB:cls.isCancelled?C.redB:C.brd}`,
      opacity:cls.isCancelled?.6:1, cursor:'pointer',
      boxShadow:isSelected?`0 0 0 1px ${C.cyanD}, 0 4px 20px rgba(0,0,0,.2)`:'0 2px 8px rgba(0,0,0,.15)',
    }}>
      <div style={{display:'flex'}}>
        {/* Left accent rail */}
        <div style={{width:3,flexShrink:0,background:cls.isCancelled?C.red:c,minHeight:'100%'}}/>
        <div style={{flex:1,padding:'16px 18px'}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
            {/* Icon */}
            <div style={{width:44,height:44,borderRadius:12,flexShrink:0,background:`${c}12`,border:`1px solid ${c}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
              {tc.emoji}
            </div>
            <div style={{flex:1,minWidth:0}}>
              {/* Name + chips */}
              <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap',marginBottom:7}}>
                <span style={{fontSize:15,fontWeight:800,color:cls.isCancelled?C.t3:C.t1,letterSpacing:'-.025em'}}>{cls.name}</span>
                <Pill color={c} dot small>{tc.label}</Pill>
                {cls.isCancelled&&<Pill color={C.red} dot small>Cancelled</Pill>}
                <Pill color={fc} dot small>{fl}</Pill>
              </div>
              {/* Time + meta */}
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,flexWrap:'wrap'}}>
                {cls.scheduleStr&&(
                  <div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:7,background:`${c}0c`,border:`1px solid ${c}18`}}>
                    <Clock style={{width:10,height:10,color:c}}/>
                    <span style={{fontSize:11,fontWeight:600,color:c}}>{cls.scheduleStr}</span>
                  </div>
                )}
                {cls.duration_minutes&&<span style={{fontSize:11,color:C.t3}}>{cls.duration_minutes} min</span>}
                {cls.room&&<span style={{fontSize:11,color:C.t3,display:'flex',alignItems:'center',gap:3}}><MapPin style={{width:9,height:9}}/>{cls.room}</span>}
              </div>
              {/* Capacity bar */}
              {!cls.isCancelled&&(
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <AvatarCluster members={cls.booked} avatarMap={avatarMap} max={4} size={20}/>
                      <span style={{fontSize:12,fontWeight:700,color:fc}}>{booked}<span style={{color:C.t3,fontWeight:400}}> / {cls.capacity}</span></span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <FillRing value={cls.fill} size={36} stroke={3} color={fc}/>
                      <span style={{fontSize:13,fontWeight:700,color:fc}}>{cls.fill}%</span>
                    </div>
                  </div>
                  <div style={{height:4,borderRadius:99,background:'rgba(255,255,255,.05)',overflow:'hidden'}}>
                    <div className="tcs-bar" style={{height:'100%',borderRadius:99,'--w':`${cls.fill}%`,width:`${cls.fill}%`,background:`linear-gradient(90deg,${fc},${fc}88)`,boxShadow:`0 0 6px ${fc}40`}}/>
                  </div>
                </div>
              )}
              {/* Stat chips */}
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {cls.attended.length>0&&<StatChip icon={Check} count={cls.attended.length} label="present" color={C.green}/>}
                {noShows>0&&<StatChip icon={UserX} count={noShows} label="no-show" color={C.red}/>}
                {cls.waitlist.length>0&&<StatChip icon={Clock} count={cls.waitlist.length} label="waitlist" color={C.amber}/>}
                {cls.revenue>0&&<StatChip icon={DollarSign} count={`£${cls.revenue}`} label="" color={C.green}/>}
              </div>
            </div>
            {/* CTA */}
            <div style={{display:'flex',flexDirection:'column',gap:5,flexShrink:0}}>
              <button className="tcs-btn" onClick={e=>{e.stopPropagation();onOpen();}} style={{padding:'8px 14px',borderRadius:9,background:C.green,color:'#fff',fontSize:11,fontWeight:700,boxShadow:`0 2px 8px ${C.green}30`,gap:5}}>
                <QrCode style={{width:11,height:11}}/> Check-In
              </button>
              <button className="tcs-btn" onClick={e=>{e.stopPropagation();openModal('post',{classId:cls.id});}} style={{padding:'6px 10px',borderRadius:8,background:C.cyanD,border:`1px solid ${C.cyanB}`,color:C.cyan,fontSize:10,fontWeight:700,gap:4}}>
                <Megaphone style={{width:9,height:9}}/> Promote
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SESSION DETAIL PANEL ───────────────────────────────────── */
function SessionDetailPanel({ cls, allMemberships, checkIns, avatarMap, attendance, onToggle, onMarkAll, onClearAll, onSaveNote, onSaveAnnounce, notes, classAnnounce, selDateStr, now, openModal, onClose, onCancelClass, onReinstateClass }) {
  const [tab,setTab]=useState('roster');
  const [q,setQ]=useState('');
  const c=cls.typeCfg.color;
  const key=`${cls.id}-${selDateStr}`;
  const manualIds=attendance[key]||[];
  const checkedIds=cls.attended.map(ci=>ci.user_id);
  const totalPresent=[...new Set([...manualIds,...checkedIds])].length;
  const noShowList=cls.booked.filter(b=>!checkedIds.includes(b.user_id)&&!manualIds.includes(b.user_id));
  const roster=allMemberships.filter(m=>!q||(m.user_name||'').toLowerCase().includes(q.toLowerCase()));
  const fc=fillColor(cls.fill);
  const TABS=[{id:'roster',label:'Roster',count:cls.booked.length||cls.attended.length},{id:'checkin',label:'Check-In',count:totalPresent},{id:'waitlist',label:'Waitlist',count:cls.waitlist.length},{id:'notes',label:'Notes',count:null}];
  return (
    <div className="tcs-si" onClick={e=>e.stopPropagation()} style={{position:'fixed',top:0,right:0,bottom:0,width:440,zIndex:9000,background:C.sidebar,borderLeft:`1px solid ${C.brd2}`,display:'flex',flexDirection:'column',boxShadow:`-20px 0 60px rgba(0,0,0,.6),inset 1px 0 0 rgba(255,255,255,.04)`}}>
      {/* Top accent */}
      <div style={{height:3,background:cls.isCancelled?C.red:c,flexShrink:0}}/>
      {/* Header */}
      <div style={{padding:'18px 22px 14px',borderBottom:`1px solid ${C.brd}`,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:48,height:48,borderRadius:14,background:`${c}12`,border:`1px solid ${c}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{cls.typeCfg.emoji}</div>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:C.t1,letterSpacing:'-.03em'}}>{cls.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:7,marginTop:3,flexWrap:'wrap'}}>
                {cls.scheduleStr&&<span style={{fontSize:11,fontWeight:600,color:c}}>{cls.scheduleStr}</span>}
                {cls.duration_minutes&&<span style={{fontSize:11,color:C.t3}}>· {cls.duration_minutes}min</span>}
                {cls.room&&<span style={{fontSize:11,color:C.t3,display:'flex',alignItems:'center',gap:3}}><MapPin style={{width:9,height:9}}/>{cls.room}</span>}
              </div>
            </div>
          </div>
          <button className="tcs-btn" onClick={onClose} style={{width:30,height:30,borderRadius:9,background:'rgba(255,255,255,.04)',border:`1px solid ${C.brd}`,color:C.t3}}>
            <X style={{width:12,height:12}}/>
          </button>
        </div>
        {/* Capacity */}
        <div style={{padding:'12px 14px',borderRadius:11,background:'rgba(255,255,255,.025)',border:`1px solid ${C.brd}`,marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <AvatarCluster members={cls.booked} avatarMap={avatarMap||{}} max={5} size={22}/>
              <span style={{fontSize:13,fontWeight:700,color:fc}}>{cls.booked.length||cls.attended.length}<span style={{color:C.t3,fontWeight:400}}> / {cls.capacity}</span></span>
            </div>
            <span style={{fontSize:13,fontWeight:700,color:fc}}>{cls.fill}%</span>
          </div>
          <div style={{height:4,borderRadius:99,background:'rgba(255,255,255,.05)',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${cls.fill}%`,background:`linear-gradient(90deg,${fc},${fc}88)`,borderRadius:99,transition:'width .5s'}}/>
          </div>
        </div>
        {/* Status chips */}
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          <StatChip icon={Check} count={totalPresent} label="present" color={C.green}/>
          {noShowList.length>0&&<StatChip icon={UserX} count={noShowList.length} label="no-show" color={C.red}/>}
          {cls.waitlist.length>0&&<StatChip icon={Clock} count={cls.waitlist.length} label="waiting" color={C.amber}/>}
          {cls.lateCancels.length>0&&<StatChip icon={AlertTriangle} count={cls.lateCancels.length} label="late cancel" color={C.amber}/>}
          {cls.isCancelled&&<Pill color={C.red} dot small>Cancelled</Pill>}
        </div>
      </div>
      {/* Tabs */}
      <div style={{display:'flex',padding:'0 14px',borderBottom:`1px solid ${C.brd}`,flexShrink:0,gap:2}}>
        {TABS.map(t=>(
          <button key={t.id} className="tcs-btn" onClick={()=>setTab(t.id)} style={{flex:1,padding:'10px 4px',background:'none',borderBottom:`2px solid ${tab===t.id?c:'transparent'}`,color:tab===t.id?c:C.t3,fontSize:11,fontWeight:tab===t.id?700:500,marginBottom:-1,gap:4,transition:'all .12s'}}>
            {t.label}
            {t.count!==null&&t.count>0&&<span style={{fontSize:9,fontWeight:700,color:tab===t.id?c:C.t3,background:tab===t.id?`${c}15`:'rgba(255,255,255,.05)',borderRadius:99,padding:'1px 5px'}}>{t.count}</span>}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="tcs-scr" style={{flex:1,overflowY:'auto',padding:'14px 18px'}}>
        {/* ROSTER */}
        {tab==='roster'&&(
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {noShowList.length>0&&(
              <div style={{padding:'13px 15px',borderRadius:12,background:C.redD,border:`1px solid ${C.redB}`,borderLeft:`3px solid ${C.red}`,marginBottom:4}}>
                <div style={{fontSize:11,fontWeight:700,color:C.red,marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
                  <UserX style={{width:11,height:11}}/> {noShowList.length} No-Show{noShowList.length!==1?'s':''}
                </div>
                {noShowList.map((m,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:i<noShowList.length-1?8:0}}>
                    <div style={{width:28,height:28,borderRadius:9,background:`${C.red}15`,border:`1px solid ${C.red}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:C.red,flexShrink:0}}>
                      {(m.user_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <span style={{fontSize:12,color:C.t1,fontWeight:600,flex:1}}>{m.user_name}</span>
                    <IBtn icon={MessageCircle} label="Msg" color={C.cyan} onClick={()=>openModal('post',{memberId:m.user_id})} size="xs"/>
                    <IBtn icon={Calendar} label="Rebook" color={C.amber} onClick={()=>openModal('bookIntoClass',{memberId:m.user_id})} size="xs"/>
                  </div>
                ))}
              </div>
            )}
            {(cls.booked.length>0?cls.booked:cls.regulars||[]).map((m,j)=>{
              const isIn=checkedIds.includes(m.user_id)||manualIds.includes(m.user_id);
              const isCxl=(cls.late_cancels||[]).some(lc=>lc.user_id===m.user_id);
              const rs=calcRS(m.user_id,checkIns,now);
              return (
                <div key={m.user_id||j} style={{padding:'12px 14px',borderRadius:12,background:isIn?C.greenD:isCxl?C.redD:'rgba(255,255,255,.02)',border:`1px solid ${isIn?C.greenB:isCxl?C.redB:C.brd}`,transition:'all .12s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:9}}>
                    <div style={{width:34,height:34,borderRadius:11,background:`${isIn?C.green:C.cyan}12`,border:`1px solid ${isIn?C.green:C.cyan}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:isIn?C.green:C.cyan,flexShrink:0}}>
                      {(m.user_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:C.t1,letterSpacing:'-.01em'}}>{m.user_name||'Member'}</div>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
                        {rs.daysAgo<999&&<span style={{fontSize:10,color:rs.daysAgo>14?C.red:rs.daysAgo>7?C.amber:C.t3}}>Last: {rs.daysAgo===0?'Today':`${rs.daysAgo}d ago`}</span>}
                        <span style={{fontSize:9,fontWeight:700,color:rs.trend==='up'?C.green:rs.trend==='down'?C.red:C.t3,display:'flex',alignItems:'center',gap:2}}>
                          {rs.trend==='up'&&<ArrowUpRight style={{width:9,height:9}}/>}
                          {rs.trend==='down'&&<ArrowDownRight style={{width:9,height:9}}/>}
                          {rs.trend==='up'?'↑':rs.trend==='down'?'↓':'—'}
                        </span>
                      </div>
                    </div>
                    <Pill color={isIn?C.green:isCxl?C.red:C.t2} small>{isIn?'✓ Present':isCxl?'Cancelled':'Booked'}</Pill>
                  </div>
                  <div style={{display:'flex',gap:5,marginTop:9}}>
                    <IBtn icon={MessageCircle} label="Message" color={C.cyan} onClick={()=>openModal('post',{memberId:m.user_id})} size="xs"/>
                    <IBtn icon={Calendar} label="Rebook" color={C.amber} onClick={()=>openModal('bookIntoClass',{memberId:m.user_id})} size="xs"/>
                  </div>
                </div>
              );
            })}
            {cls.booked.length===0&&(!cls.regulars||cls.regulars.length===0)&&(
              <div style={{textAlign:'center',padding:'40px 0',color:C.t3,fontSize:13}}>
                <Users style={{width:22,height:22,margin:'0 auto 10px',opacity:.3}}/>No bookings yet
              </div>
            )}
          </div>
        )}
        {/* CHECK-IN */}
        {tab==='checkin'&&(
          <div>
            <div style={{display:'flex',gap:6,marginBottom:12}}>
              <div style={{flex:1,position:'relative'}}>
                <Search style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',width:12,height:12,color:C.t3}}/>
                <input className="tcs-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search members…" style={{paddingLeft:32,fontSize:12}}/>
              </div>
              <IBtn icon={CheckCircle} label="All" color={C.green} onClick={()=>onMarkAll(key)} size="xs"/>
              <IBtn icon={X} label="Clear" color={C.red} onClick={()=>onClearAll(key)} size="xs"/>
            </div>
            <div style={{borderRadius:12,border:`1px solid ${C.brd}`,overflow:'hidden',background:'rgba(255,255,255,.01)'}}>
              {roster.map((m,mi)=>{
                const isManual=manualIds.includes(m.user_id);
                const isQR=checkedIds.includes(m.user_id);
                const present=isManual||isQR;
                return (
                  <div key={m.user_id||mi} className="tcs-row" onClick={()=>!isQR&&onToggle(key,m.user_id)} style={{display:'flex',alignItems:'center',gap:9,padding:'10px 13px',borderBottom:mi<roster.length-1?`1px solid ${C.brd}`:'none',cursor:isQR?'default':'pointer',background:present?C.greenD:'transparent',transition:'background .1s'}}>
                    <div style={{width:18,height:18,borderRadius:5,flexShrink:0,border:`1.5px solid ${present?C.green:'rgba(255,255,255,.1)'}`,background:present?C.green:'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .1s',boxShadow:present?`0 0 5px ${C.green}40`:'none'}}>
                      {present&&<Check style={{width:10,height:10,color:'#fff'}}/>}
                    </div>
                    <div style={{width:28,height:28,borderRadius:9,background:`${present?C.green:C.cyan}12`,border:`1px solid ${present?C.green:C.cyan}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:present?C.green:C.cyan,flexShrink:0}}>
                      {(m.user_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <span style={{flex:1,fontSize:12,fontWeight:500,color:present?C.t1:C.t2}}>{m.user_name||'Member'}</span>
                    {isQR&&<Pill color={C.green} small>QR ✓</Pill>}
                    {isManual&&!isQR&&<Pill color={C.violet} small>Manual</Pill>}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:11,color:C.t3,whiteSpace:'nowrap'}}>{totalPresent} / {roster.length}</span>
              <div style={{flex:1,height:3,borderRadius:99,background:'rgba(255,255,255,.04)',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${roster.length>0?(totalPresent/roster.length)*100:0}%`,background:`linear-gradient(90deg,${C.green},${C.cyan})`,borderRadius:99,transition:'width .4s'}}/>
              </div>
            </div>
          </div>
        )}
        {/* WAITLIST */}
        {tab==='waitlist'&&(
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {cls.waitlist.length===0?(
              <div style={{padding:'12px 14px',borderRadius:11,background:C.greenD,border:`1px solid ${C.greenB}`,display:'flex',alignItems:'center',gap:7}}>
                <CheckCircle style={{width:12,height:12,color:C.green}}/>
                <span style={{fontSize:12,color:C.green,fontWeight:600}}>No one on the waitlist</span>
              </div>
            ):cls.waitlist.map((w,j)=>(
              <div key={w.user_id||j} style={{padding:'13px 15px',borderRadius:12,background:'rgba(255,255,255,.02)',border:`1px solid ${C.brd}`,borderLeft:`3px solid ${C.amber}`}}>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:9}}>
                  <div style={{width:24,height:24,borderRadius:7,background:C.amberD,border:`1px solid ${C.amberB}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:C.amber,flexShrink:0}}>{j+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.t1}}>{w.user_name||'Member'}</div>
                    {w.wait_since&&<div style={{fontSize:10,color:C.t3,marginTop:1}}>Since {format(new Date(w.wait_since),'MMM d, h:mm a')}</div>}
                  </div>
                </div>
                <div style={{display:'flex',gap:5}}>
                  <IBtn icon={ArrowUpRight} label="Promote" color={C.green} onClick={()=>openModal('promoteWaitlist',w)} size="xs"/>
                  <IBtn icon={Bell} label="Notify" color={C.cyan} onClick={()=>openModal('post',{memberId:w.user_id})} size="xs"/>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* NOTES */}
        {tab==='notes'&&(
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:C.t3,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:9,display:'flex',alignItems:'center',gap:5}}>
                <Megaphone style={{width:10,height:10,color:C.cyan}}/> Class Announcement
              </div>
              <textarea className="tcs-input" value={classAnnounce[key]||''} onChange={e=>onSaveAnnounce(key,e.target.value)} placeholder="Visible to all members before this class…" style={{minHeight:70,resize:'vertical',lineHeight:1.65}}/>
              <button className="tcs-btn" onClick={()=>openModal('post',{classId:cls.id,announcement:classAnnounce[key]})} style={{marginTop:7,padding:'8px 14px',borderRadius:9,background:C.cyan,color:'#fff',fontSize:11,fontWeight:700,gap:5,boxShadow:`0 2px 8px ${C.cyan}30`}}>
                <Send style={{width:10,height:10}}/> Push to Members
              </button>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:C.t3,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:9,display:'flex',alignItems:'center',gap:5}}>
                <Pencil style={{width:10,height:10,color:C.violet}}/> Coach Notes (Private)
              </div>
              <textarea className="tcs-input" value={notes[key]||''} onChange={e=>onSaveNote(key,e.target.value)} placeholder="Cues, modifications, energy notes, what worked…" style={{minHeight:70,resize:'vertical',lineHeight:1.65}}/>
            </div>
          </div>
        )}
      </div>
      {/* Footer */}
      <div style={{padding:'12px 18px',borderTop:`1px solid ${C.brd}`,display:'flex',gap:6,flexWrap:'wrap',flexShrink:0}}>
        <IBtn icon={QrCode} label="Scan QR" color={C.green} onClick={()=>openModal('qrScanner',cls)}/>
        <IBtn icon={Bell} label="Remind All" color={C.cyan} onClick={()=>openModal('post',{classId:cls.id})}/>
        <IBtn icon={Pencil} label="Edit" color={C.t2} onClick={()=>openModal('editClass',cls)}/>
        {cls.isCancelled
          ?<IBtn icon={RefreshCw} label="Reinstate" color={C.green} onClick={()=>{onReinstateClass(cls);onClose();}}/>
          :<IBtn icon={XCircle} label="Cancel Class" color={C.red} onClick={()=>openModal('confirmCancel',cls)}/>
        }
      </div>
    </div>
  );
}

/* ─── OPTIMIZATION PANEL ─────────────────────────────────────── */
function OptimizationPanel({ classesWithData, checkIns, now }) {
  const items = useMemo(()=>{
    const out=[];
    const under=classesWithData.filter(c=>c.fill<40&&!c.isCancelled);
    if(under.length>0) out.push({icon:AlertTriangle,color:C.red,text:`${under.length} session${under.length>1?'s':''} underbooked — promote or reschedule`});
    const full=classesWithData.filter(c=>c.fill>=90&&!c.isCancelled);
    if(full.length>0) out.push({icon:TrendingUp,color:C.blue,text:`${full.length} session${full.length>1?'s':''} at capacity — consider adding a second slot`});
    const wl=classesWithData.filter(c=>c.waitlist.length>0);
    if(wl.length>0){const t=wl.reduce((s,c)=>s+c.waitlist.length,0);out.push({icon:Users,color:C.violet,text:`${t} member${t>1?'s':''} on waitlists — demand exceeds supply`});}
    out.push({icon:Lightbulb,color:C.amber,text:'Consistent schedules retain 2.8× more members long-term'});
    out.push({icon:Sparkles,color:C.cyan,text:'Pre-class reminders 2hr before reduce no-shows by up to 40%'});
    return out.slice(0,5);
  },[classesWithData]);
  return (
    <div className="tcs-card" style={{borderRadius:14,background:C.card,border:`1px solid ${C.brd}`,overflow:'hidden'}}>
      <div style={{padding:'14px 16px 10px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',gap:7}}>
        <Target style={{width:13,height:13,color:C.cyan}}/>
        <span style={{fontSize:13,fontWeight:700,color:C.t1}}>Optimisation</span>
      </div>
      <div style={{padding:'8px 12px 12px'}}>
        {items.map((s,i)=>{
          const Ic=s.icon;
          return (
            <div key={i} className="tcs-row" style={{display:'flex',alignItems:'flex-start',gap:9,padding:'9px 8px',borderRadius:9,background:'transparent'}}>
              <div style={{width:22,height:22,borderRadius:6,background:`${s.color}0d`,border:`1px solid ${s.color}1a`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Ic style={{width:10,height:10,color:s.color}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:5}}>
                  <span style={{fontSize:9,fontWeight:700,color:s.color,marginTop:1,flexShrink:0}}>{String(i+1).padStart(2,'0')}</span>
                  <span style={{fontSize:11,color:C.t2,lineHeight:1.6}}>{s.text}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── ACTION CENTRE ──────────────────────────────────────────── */
function ActionCentre({ allMemberships, checkIns, myClasses, now, openModal }) {
  const [section,setSection]=useState('issues');
  const noShows=useMemo(()=>myClasses.flatMap(cls=>{
    const booked=cls.bookings||[];
    const attended=checkIns.filter(c=>isSameDay(new Date(c.check_in_date),now));
    return booked.filter(b=>!attended.some(a=>a.user_id===b.user_id)).map(b=>({...b,className:cls.name}));
  }).slice(0,8),[myClasses,checkIns,now]);
  const fading=useMemo(()=>allMemberships.map(m=>{
    const rs=calcRS(m.user_id,checkIns,now);
    if(rs.status==='safe') return null;
    return{...m,rs,reason:rs.daysAgo>21?`No visit in ${rs.daysAgo} days`:'Low engagement'};
  }).filter(Boolean).sort((a,b)=>a.rs.score-b.rs.score).slice(0,5),[allMemberships,checkIns,now]);
  const TABS=[{id:'issues',label:'Issues',count:noShows.length,color:C.red},{id:'fading',label:'Fading',count:fading.length,color:C.amber}];
  return (
    <div className="tcs-card" style={{borderRadius:14,background:C.card,border:`1px solid ${C.brd}`,overflow:'hidden'}}>
      <div style={{padding:'14px 16px 10px',borderBottom:`1px solid ${C.brd}`}}>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
          <Zap style={{width:13,height:13,color:C.amber}}/>
          <span style={{fontSize:13,fontWeight:700,color:C.t1}}>Action Centre</span>
        </div>
        <div style={{display:'flex',gap:3,padding:3,background:'rgba(255,255,255,.025)',border:`1px solid ${C.brd}`,borderRadius:9}}>
          {TABS.map(s=>(
            <button key={s.id} className="tcs-btn" onClick={()=>setSection(s.id)} style={{flex:1,padding:'6px 8px',borderRadius:7,fontSize:10,fontWeight:700,background:section===s.id?`${s.color}0f`:'transparent',border:`1px solid ${section===s.id?`${s.color}20`:'transparent'}`,color:section===s.id?s.color:C.t3,transition:'all .12s',gap:4}}>
              {s.label}
              {s.count>0&&<span style={{fontSize:9,fontWeight:700,color:'#fff',background:s.color,borderRadius:99,padding:'1px 5px',boxShadow:`0 0 5px ${s.color}50`}}>{s.count}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="tcs-scr" style={{padding:'10px 12px 12px',maxHeight:260,overflowY:'auto'}}>
        {section==='issues'&&(
          noShows.length===0?(
            <div style={{padding:'11px 13px',borderRadius:10,background:C.greenD,border:`1px solid ${C.greenB}`,display:'flex',alignItems:'center',gap:7}}>
              <CheckCircle style={{width:12,height:12,color:C.green}}/>
              <span style={{fontSize:12,color:C.green,fontWeight:600}}>No issues today</span>
            </div>
          ):noShows.map((m,i)=>(
            <div key={i} style={{padding:'10px 12px',borderRadius:10,background:'rgba(255,255,255,.015)',border:`1px solid ${C.brd}`,borderLeft:`3px solid ${C.red}`,marginBottom:6}}>
              <div style={{fontSize:12,fontWeight:700,color:C.t1,marginBottom:1}}>{m.user_name||'Client'}</div>
              <div style={{fontSize:10,color:C.t3,marginBottom:7}}>No-show — {m.className}</div>
              <div style={{display:'flex',gap:5}}>
                <IBtn icon={MessageCircle} label="Message" color={C.cyan} onClick={()=>openModal('post',{memberId:m.user_id})} size="xs"/>
                <IBtn icon={Calendar} label="Rebook" color={C.amber} onClick={()=>openModal('bookIntoClass',{memberId:m.user_id})} size="xs"/>
              </div>
            </div>
          ))
        )}
        {section==='fading'&&(
          fading.length===0?(
            <div style={{padding:'11px 13px',borderRadius:10,background:C.greenD,border:`1px solid ${C.greenB}`,display:'flex',alignItems:'center',gap:7}}>
              <CheckCircle style={{width:12,height:12,color:C.green}}/>
              <span style={{fontSize:12,color:C.green,fontWeight:600}}>All members healthy</span>
            </div>
          ):fading.map((m,i)=>(
            <div key={i} style={{padding:'10px 12px',borderRadius:10,background:'rgba(255,255,255,.015)',border:`1px solid ${C.brd}`,borderLeft:`3px solid ${m.rs.color}`,marginBottom:6}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.t1}}>{m.user_name||'Client'}</div>
                  <div style={{fontSize:10,color:C.t3,marginTop:1}}>{m.reason}</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:16,fontWeight:700,color:m.rs.color,lineHeight:1}}>{m.rs.score}</div>
                  <div style={{fontSize:8,color:C.t3,textTransform:'uppercase',letterSpacing:'.05em'}}>score</div>
                </div>
              </div>
              <div style={{display:'flex',gap:5}}>
                <IBtn icon={MessageCircle} label="Message" color={C.cyan} onClick={()=>openModal('post',{memberId:m.user_id})} size="xs"/>
                <IBtn icon={Calendar} label="Book" color={C.amber} onClick={()=>openModal('bookIntoClass',{memberId:m.user_id})} size="xs"/>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── 30-DAY ACTIVITY SPARK ──────────────────────────────────── */
function ActivitySpark({ checkIns, now }) {
  const data=useMemo(()=>Array.from({length:30},(_,i)=>{
    const d=subDays(now,29-i);
    return{label:format(d,'MMM d'),count:checkIns.filter(c=>isSameDay(new Date(c.check_in_date),d)).length};
  }),[checkIns,now]);
  const maxV=Math.max(...data.map(d=>d.count),1);
  const total=data.reduce((s,d)=>s+d.count,0);
  const avg=(total/30).toFixed(1), peak=Math.max(...data.map(d=>d.count));
  return (
    <div className="tcs-card" style={{borderRadius:14,background:C.card,border:`1px solid ${C.brd}`,padding:'16px 18px'}}>
      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:14}}>
        <Activity style={{width:13,height:13,color:C.violet}}/>
        <span style={{fontSize:13,fontWeight:700,color:C.t1}}>30-Day Activity</span>
      </div>
      <div style={{display:'flex',alignItems:'flex-end',gap:2,height:48,marginBottom:7}}>
        {data.map((d,i)=>{
          const isRecent=i>=27;
          const h=d.count===0?2:Math.max(4,(d.count/maxV)*44);
          return <div key={i} title={`${d.label}: ${d.count}`} style={{flex:1,height:h,borderRadius:'3px 3px 1px 1px',background:isRecent?C.cyan:`${C.cyan}25`,transition:'height .4s cubic-bezier(.16,1,.3,1)',cursor:'default'}}/>;
        })}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
        <span style={{fontSize:9,color:C.t3}}>{format(subDays(now,29),'MMM d')}</span>
        <span style={{fontSize:9,color:C.cyan,fontWeight:700}}>Today</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>
        {[{label:'Total',value:total,color:C.cyan},{label:'Peak',value:peak,color:C.violet},{label:'Avg/Day',value:avg,color:C.green}].map((s,i)=>(
          <div key={i} style={{textAlign:'center',padding:'9px 4px',borderRadius:9,background:`${s.color}06`,border:`1px solid ${s.color}12`}}>
            <div style={{fontSize:17,fontWeight:700,color:s.color,lineHeight:1,marginBottom:3}}>{s.value}</div>
            <div style={{fontSize:9,color:C.t3,textTransform:'uppercase',letterSpacing:'.06em'}}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CLASS MIX PANEL ────────────────────────────────────────── */
function ClassMixPanel({ classesWithData, classTypes }) {
  if (classTypes.length===0) return null;
  return (
    <div className="tcs-card" style={{borderRadius:14,background:C.card,border:`1px solid ${C.brd}`,padding:'16px 18px'}}>
      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:14}}>
        <Layers style={{width:13,height:13,color:C.violet}}/>
        <span style={{fontSize:13,fontWeight:700,color:C.t1}}>Class Mix</span>
      </div>
      {classTypes.map((type,i,arr)=>{
        const cfg=CLASS_CFG[type]||CLASS_CFG.default;
        const typeCls=classesWithData.filter(c=>(c.name||'').toLowerCase().includes(type));
        const count=typeCls.length;
        const avgF=typeCls.length>0?Math.round(typeCls.reduce((s,c)=>s+c.fill,0)/typeCls.length):0;
        return (
          <div key={type} style={{marginBottom:i<arr.length-1?13:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:13}}>{cfg.emoji}</span>
                <span style={{fontSize:12,color:cfg.color,fontWeight:700}}>{cfg.label}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:10,color:C.t3}}>{count} class{count!==1?'es':''}</span>
                <span style={{fontSize:10,fontWeight:700,color:fillColor(avgF)}}>{avgF}%</span>
              </div>
            </div>
            <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,.04)',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${avgF}%`,background:cfg.color,borderRadius:99,transition:'width .6s cubic-bezier(.16,1,.3,1)',boxShadow:`0 0 5px ${cfg.color}40`}}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── QUICK ACTIONS ──────────────────────────────────────────── */
function QuickActions({ openModal }) {
  const actions=[
    {icon:QrCode,   label:'Scan Check-In',  sub:'Open QR scanner',    color:C.green, fn:()=>openModal('qrScanner')},
    {icon:Calendar, label:'Create Event',    sub:'Add to schedule',    color:C.cyan,  fn:()=>openModal('event')},
    {icon:Bell,     label:'Send Reminder',   sub:'Notify members',     color:C.blue,  fn:()=>openModal('post')},
    {icon:Dumbbell, label:'Manage Classes',  sub:'Edit class library',  color:C.violet,fn:()=>openModal('classes')},
  ];
  return (
    <div className="tcs-card" style={{borderRadius:14,background:C.card,border:`1px solid ${C.brd}`,padding:'16px 18px'}}>
      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
        <Zap style={{width:13,height:13,color:C.amber}}/>
        <span style={{fontSize:13,fontWeight:700,color:C.t1}}>Quick Actions</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:5}}>
        {actions.map(({icon:Ic,label,sub,color,fn},i)=>(
          <button key={i} className="tcs-btn" onClick={fn} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,width:'100%',background:'rgba(255,255,255,.02)',border:`1px solid ${C.brd}`,textAlign:'left',transition:'all .13s'}}
            onMouseEnter={e=>{e.currentTarget.style.background=`${color}07`;e.currentTarget.style.borderColor=`${color}18`;e.currentTarget.style.transform='translateX(2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.02)';e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.transform='none';}}>
            <div style={{width:32,height:32,borderRadius:9,background:`${color}0d`,border:`1px solid ${color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Ic style={{width:12,height:12,color}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:C.t1,letterSpacing:'-.01em'}}>{label}</div>
              <div style={{fontSize:10,color:C.t3,marginTop:1}}>{sub}</div>
            </div>
            <ArrowRight style={{width:11,height:11,color:C.t3,flexShrink:0}}/>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────────── */
function EmptyState({ openModal }) {
  return (
    <div className="tcs-fu" style={{padding:'56px 36px',textAlign:'center',borderRadius:14,background:C.card,border:`1px solid ${C.brd}`}}>
      <div style={{width:56,height:56,borderRadius:16,margin:'0 auto 20px',background:C.cyanD,border:`1px solid ${C.cyanB}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Calendar style={{width:24,height:24,color:C.cyan}}/>
      </div>
      <h3 style={{fontSize:22,fontWeight:800,color:C.t1,margin:'0 0 8px',letterSpacing:'-.04em',fontFamily:FONT}}>Build Your Schedule</h3>
      <p style={{fontSize:13,color:C.t3,margin:'0 auto 32px',maxWidth:420,lineHeight:1.7,fontFamily:FONT}}>
        Create your first class and start tracking attendance, fill rates, and member engagement — all in one place.
      </p>
      {[
        {t:'6:00 AM',type:'Morning HIIT',emoji:'🔥',color:'#f87171'},
        {t:'12:00 PM',type:'Lunchtime Yoga',emoji:'🧘',color:'#34d399'},
        {t:'5:30 PM',type:'Evening Strength',emoji:'💪',color:'#fb923c'},
      ].map((slot,i)=>(
        <div key={i} className="tcs-fu" style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',borderRadius:12,maxWidth:440,margin:'0 auto 10px',background:'rgba(255,255,255,.02)',border:`1px dashed ${C.brd}`,textAlign:'left',animationDelay:`${i*.1+.2}s`}}>
          <div style={{width:40,height:40,borderRadius:12,background:`${slot.color}10`,border:`1px solid ${slot.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{slot.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:600,color:slot.color}}>{slot.t}</div>
            <div style={{fontSize:12,color:C.t2,fontWeight:500,marginTop:2}}>{slot.type}</div>
          </div>
          <button className="tcs-btn" onClick={()=>openModal('classes')} style={{fontSize:11,fontWeight:700,color:C.cyan,background:C.cyanD,border:`1px solid ${C.cyanB}`,borderRadius:8,padding:'6px 12px'}}>+ Add</button>
        </div>
      ))}
      <button className="tcs-btn" onClick={()=>openModal('classes')} style={{marginTop:28,padding:'12px 26px',borderRadius:11,gap:7,background:C.cyan,color:'#fff',fontSize:13,fontWeight:700,boxShadow:`0 4px 16px ${C.cyan}30`}}>
        <Plus style={{width:13,height:13}}/> Create Your First Class
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export default function TabCoachSchedule({ myClasses=[], checkIns=[], events=[], allMemberships=[], avatarMap={}, openModal, now }) {
  const [calView,setCalView]=useState('week');
  const [selectedDate,setSelectedDate]=useState(now);
  const [monthDate,setMonthDate]=useState(now);
  const [detailCls,setDetailCls]=useState(null);
  const [typeFilter,setTypeFilter]=useState('all');
  const [confirmCancel,setConfirmCancel]=useState(null);

  // Persisted state
  const load=(k,fb)=>{try{return JSON.parse(localStorage.getItem(k)||fb)}catch{return JSON.parse(fb)}};
  const [attendance,setAttendance]=useState(()=>load('coachAttendance','{}'));
  const [notes,setNotes]=useState(()=>load('coachNotes','{}'));
  const [cancelledClasses,setCancelledClasses]=useState(()=>load('coachCancelled','[]'));
  const [classAnnounce,setClassAnnounce]=useState(()=>load('coachAnnounce','{}'));
  const persist=(k,d)=>{try{localStorage.setItem(k,JSON.stringify(d))}catch{}};
  const saveNote=(k,v)=>{const u={...notes,[k]:v};setNotes(u);persist('coachNotes',u);};
  const saveAnnounce=(k,v)=>{const u={...classAnnounce,[k]:v};setClassAnnounce(u);persist('coachAnnounce',u);};
  const toggleAttendance=(rk,uid)=>{const s=attendance[rk]||[];const u={...attendance,[rk]:s.includes(uid)?s.filter(id=>id!==uid):[...s,uid]};setAttendance(u);persist('coachAttendance',u);};
  const markAllPresent=(rk)=>{const u={...attendance,[rk]:allMemberships.map(m=>m.user_id)};setAttendance(u);persist('coachAttendance',u);};
  const clearAttendance=(rk)=>{const u={...attendance,[rk]:[]};setAttendance(u);persist('coachAttendance',u);};
  const cancelClass=(cls,ds)=>{const k=`${cls.id}-${ds}`;const u=[...cancelledClasses,k];setCancelledClasses(u);persist('coachCancelled',u);setConfirmCancel(null);setDetailCls(null);};
  const reinstateClass=(cls)=>{const k=`${cls.id}-${selDateStr}`;const u=cancelledClasses.filter(x=>x!==k);setCancelledClasses(u);persist('coachCancelled',u);};

  const selDateStr=format(selectedDate,'yyyy-MM-dd');
  const isToday=isSameDay(selectedDate,now);
  const weekStart=startOfWeek(selectedDate,{weekStartsOn:1});
  const week=Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const monthStart=startOfMonth(monthDate);
  const monthEnd=endOfMonth(monthDate);
  const gridStart=startOfWeek(monthStart,{weekStartsOn:1});
  const gridEnd=endOfWeek(monthEnd,{weekStartsOn:1});
  const monthDays=eachDayOfInterval({start:gridStart,end:gridEnd});
  const dayCIs=d=>checkIns.filter(c=>isSameDay(new Date(c.check_in_date),d));
  const selCIs=dayCIs(selectedDate);
  const weekCICounts=useMemo(()=>week.map(d=>dayCIs(d).length),[week,checkIns]);

  const navigate=dir=>{
    if(calView==='day') setSelectedDate(d=>dir>0?addDays(d,1):subDays(d,1));
    if(calView==='week') setSelectedDate(d=>dir>0?addDays(d,7):subDays(d,7));
    if(calView==='month') setMonthDate(d=>dir>0?addDays(startOfMonth(d),32):subDays(startOfMonth(d),1));
  };

  const appointments=useMemo(()=>myClasses.filter(c=>c.type==='personal_training'||c.is_appointment||c.type==='pt'),[myClasses]);
  const groupClasses=useMemo(()=>myClasses.filter(c=>!c.type||(c.type!=='personal_training'&&!c.is_appointment&&c.type!=='pt')),[myClasses]);

  const classesWithData=useMemo(()=>{
    let cls=groupClasses;
    if(typeFilter!=='all') cls=cls.filter(c=>(c.name||c.class_type||c.type||'').toLowerCase().includes(typeFilter));
    return cls.map(c=>{
      const typeCfg=getTypeCfg(c);
      const capacity=c.max_capacity||c.capacity||20;
      const booked=c.bookings||[];
      const waitlist=c.waitlist||[];
      const isCancelled=cancelledClasses.includes(`${c.id}-${selDateStr}`);
      const lateCancels=getLateCancel(c);
      const revenue=0; // simplified
      const _sched=typeof c.schedule==='string'?c.schedule:(Array.isArray(c.schedule)&&c.schedule[0]?.time?c.schedule[0].time:'');
      const attended=selCIs.filter(ci=>{
        if(!_sched) return false;
        const m=_sched.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
        if(!m) return false;
        let sh=parseInt(m[1]);
        if(m[2].toLowerCase()==='pm'&&sh!==12) sh+=12;
        const h=new Date(ci.check_in_date).getHours();
        return h===sh||h===sh+1;
      });
      const fill=booked.length>0?Math.min(100,Math.round((booked.length/capacity)*100)):Math.min(100,Math.round((attended.length/capacity)*100));
      const freq={};
      checkIns.forEach(ci=>{const h=new Date(ci.check_in_date).getHours();freq[ci.user_id]=(freq[ci.user_id]||0)+1;});
      const regulars=allMemberships.filter(m=>(freq[m.user_id]||0)>=2);
      return{...c,attended,capacity,booked,waitlist,regulars,fill,isCancelled,typeCfg,revenue,lateCancels,scheduleStr:_sched};
    });
  },[groupClasses,selCIs,checkIns,allMemberships,cancelledClasses,selDateStr,typeFilter]);

  const classTypes=useMemo(()=>{
    const types=new Set(groupClasses.map(c=>{
      const n=(c.name||c.class_type||c.type||'').toLowerCase();
      for(const k of Object.keys(CLASS_CFG)){if(n.includes(k)&&k!=='default') return k;}
      return null;
    }).filter(Boolean));
    return [...types];
  },[groupClasses]);

  const totalBooked=classesWithData.reduce((s,c)=>s+(c.booked.length||c.attended.length),0);
  const totalPresent=classesWithData.reduce((s,c)=>{const ids=[...new Set([...c.attended.map(ci=>ci.user_id),...(attendance[`${c.id}-${selDateStr}`]||[])])];return s+ids.length;},0);
  const totalNoShows=classesWithData.reduce((s,c)=>s+Math.max(0,c.booked.length-c.attended.length),0);
  const avgFill=classesWithData.length>0?Math.round(classesWithData.reduce((s,c)=>s+c.fill,0)/classesWithData.length):0;
  const totalLateCancels=classesWithData.reduce((s,c)=>s+c.lateCancels.length,0);

  // Week CI delta
  const thisWeekCI=checkIns.filter(c=>(now-new Date(c.check_in_date))<7*864e5).length;
  const lastWeekCI=checkIns.filter(c=>{const d=now-new Date(c.check_in_date);return d>=7*864e5&&d<14*864e5;}).length;
  const weekDelta=thisWeekCI-lastWeekCI;
  const weekTrend=weekDelta>2?'up':weekDelta<-2?'down':'flat';

  useEffect(()=>{
    if(detailCls){const updated=classesWithData.find(c=>c.id===detailCls.id);if(updated)setDetailCls(updated);}
  },[classesWithData]);

  const hasClasses=groupClasses.length>0;
  const fc=fillColor(avgFill);

  return (
    <div className="tcs" style={{background:C.bg,minHeight:'100%',color:C.t1,fontFamily:FONT,fontSize:13,lineHeight:1.5,WebkitFontSmoothing:'antialiased'}}>

      {/* Confirm dialog */}
      {confirmCancel&&(
        <ConfirmDialog
          message={`Cancel "${confirmCancel.name}" on ${format(selectedDate,'EEEE, MMM d')}?\nAll booked members must be notified manually.`}
          onConfirm={()=>cancelClass(confirmCancel,selDateStr)}
          onCancel={()=>setConfirmCancel(null)}
        />
      )}

      {/* Detail panel */}
      {detailCls&&(
        <>
          <div className="tcs-fi" style={{position:'fixed',inset:0,zIndex:8999,background:'rgba(0,0,0,.6)',backdropFilter:'blur(6px)'}} onClick={()=>setDetailCls(null)}/>
          <SessionDetailPanel
            cls={detailCls} allMemberships={allMemberships} checkIns={checkIns} avatarMap={avatarMap}
            attendance={attendance} onToggle={toggleAttendance} onMarkAll={markAllPresent} onClearAll={clearAttendance}
            onSaveNote={saveNote} onSaveAnnounce={saveAnnounce} notes={notes} classAnnounce={classAnnounce}
            selDateStr={selDateStr} now={now}
            openModal={(type,data)=>{if(type==='confirmCancel'){setConfirmCancel(data);return;}openModal(type,data);}}
            onClose={()=>setDetailCls(null)} onCancelClass={cls=>setConfirmCancel(cls)} onReinstateClass={reinstateClass}
          />
        </>
      )}

      <div style={{padding:'0 0 48px'}}>

        {/* ── HEADER ── */}
        <div className="tcs-fu" style={{padding:'14px 18px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${C.brd}`,position:'relative'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:3}}>
              <div style={{fontSize:18,fontWeight:700,color:C.t1,letterSpacing:'-0.02em'}}>
                Schedule <span style={{color:C.t3,fontWeight:300}}>/</span>{' '}
                <span style={{color:C.cyan}}>Performance</span>
              </div>
              {isToday&&(
                <div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:99,background:C.greenD,border:`1px solid ${C.greenB}`}}>
                  <span className="tcs-live" style={{width:6,height:6,borderRadius:'50%',background:C.green,display:'inline-block'}}/>
                  <span style={{fontSize:10,fontWeight:700,color:C.green,letterSpacing:'.04em'}}>LIVE</span>
                </div>
              )}
            </div>
            <div style={{fontSize:11,color:C.t3,display:'flex',alignItems:'center',gap:7}}>
              <span style={{color:C.cyan,fontWeight:600}}>{classesWithData.length}</span> sessions
              <span style={{color:C.t3}}>·</span>
              <span style={{color:C.green,fontWeight:600}}>{selCIs.length}</span> check-ins
              <span style={{color:C.t3}}>·</span>
              <span style={{color:C.t2,fontWeight:500}}>{format(selectedDate,'EEEE, MMMM d')}</span>
            </div>
          </div>
          <div style={{display:'flex',gap:7,flexShrink:0}}>
            <button className="tcs-btn" onClick={()=>openModal('qrScanner')} style={{padding:'8px 18px',borderRadius:9,background:C.green,color:'#fff',fontSize:12,fontWeight:700,gap:6,boxShadow:`0 2px 10px ${C.green}30`}}>
              <QrCode style={{width:13,height:13}}/> Check-In
            </button>
            <button className="tcs-btn" onClick={()=>openModal('classes')} style={{padding:'8px 18px',borderRadius:9,background:C.cyan,color:'#fff',fontSize:12,fontWeight:700,gap:6,boxShadow:`0 2px 10px ${C.cyan}28`}}>
              <Plus style={{width:13,height:13}}/> Add Class
            </button>
          </div>
        </div>

        {!hasClasses ? (
          <div style={{padding:'24px 18px'}}><EmptyState openModal={openModal}/></div>
        ):(
          <>
            {/* ── KPI STRIP ── */}
            <div className="tcs-fu" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,padding:'16px 18px 0',animationDelay:'.04s'}}>
              {/* Sessions */}
              <KpiCard title={isToday?'Today':format(selectedDate,'EEE, MMM d')} value={classesWithData.length} sub="sessions scheduled" color={C.cyan} icon={Calendar} pulse={isToday} delay={0}/>
              {/* Fill Rate */}
              <KpiCard title="Fill Rate" color={fc} icon={Activity} delay={.05}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{position:'relative',flexShrink:0}}>
                    <FillRing value={avgFill} size={56} stroke={4} color={fc}/>
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
                      <span style={{fontSize:13,fontWeight:700,color:fc,lineHeight:1}}>{avgFill}</span>
                      <span style={{fontSize:8,color:C.t3,fontWeight:600}}>%</span>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:C.t2,fontWeight:600,marginBottom:3}}>{fillLabel(avgFill)}</div>
                    <div style={{fontSize:10,color:C.t3}}>avg fill rate</div>
                  </div>
                </div>
              </KpiCard>
              {/* Checked In */}
              <KpiCard title="Checked In" color={C.green} icon={UserCheck} delay={.10}>
                <div style={{display:'flex',alignItems:'baseline',gap:5,marginBottom:7}}>
                  <span style={{fontSize:36,fontWeight:700,color:C.green,lineHeight:1,letterSpacing:'-0.04em'}}>{totalPresent}</span>
                  <span style={{fontSize:13,color:C.t3,fontWeight:500}}>/ {totalBooked}</span>
                </div>
                <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,.04)',overflow:'hidden'}}>
                  <div className="tcs-bar" style={{height:'100%',borderRadius:99,background:`linear-gradient(90deg,${C.green},${C.cyan})`,boxShadow:`0 0 5px ${C.green}40`,'--w':totalBooked>0?`${(totalPresent/totalBooked)*100}%`:'0%',width:totalBooked>0?`${(totalPresent/totalBooked)*100}%`:'0%'}}/>
                </div>
              </KpiCard>
              {/* No-Shows */}
              <KpiCard title="No-Shows" value={totalNoShows} color={totalNoShows>0?C.red:C.t3} icon={UserX} delay={.15} sub={totalLateCancels>0?`${totalLateCancels} late cancel${totalLateCancels>1?'s':''}`:totalNoShows===0?'Perfect attendance':'Need follow-up'}/>
              {/* vs Last Week */}
              <KpiCard title="vs Last Week" color={weekTrend==='up'?C.green:weekTrend==='down'?C.red:C.t3} icon={TrendingUp} delay={.20}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
                  {weekTrend==='up'&&<ArrowUpRight style={{width:18,height:18,color:C.green}}/>}
                  {weekTrend==='down'&&<ArrowDownRight style={{width:18,height:18,color:C.red}}/>}
                  {weekTrend==='flat'&&<Minus style={{width:18,height:18,color:C.t3}}/>}
                  <span style={{fontSize:36,fontWeight:700,lineHeight:1,letterSpacing:'-0.04em',color:weekTrend==='up'?C.green:weekTrend==='down'?C.red:C.t3}}>
                    {weekDelta>0?'+':''}{weekDelta}
                  </span>
                </div>
                <span style={{fontSize:11,color:C.t3}}>check-ins this week</span>
              </KpiCard>
            </div>

            {/* ── CALENDAR + SESSIONS ── */}
            <div style={{padding:'16px 18px 0'}}>

              {/* Calendar panel */}
              <div className="tcs-fu tcs-card" style={{borderRadius:14,background:C.card,border:`1px solid ${C.brd}`,padding:'18px 20px',marginBottom:16,animationDelay:'.08s'}}>
                {/* Nav */}
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:18,flexWrap:'wrap'}}>
                  {/* View toggle */}
                  <div style={{display:'flex',gap:2,padding:3,background:'rgba(255,255,255,.025)',border:`1px solid ${C.brd}`,borderRadius:10}}>
                    {[{id:'day',label:'Day'},{id:'week',label:'Week'},{id:'month',label:'Month'}].map(v=>(
                      <button key={v.id} className="tcs-btn" onClick={()=>setCalView(v.id)} style={{padding:'5px 14px',borderRadius:8,fontSize:11,border:`1px solid ${calView===v.id?C.cyanB:'transparent'}`,background:calView===v.id?C.cyanD:'transparent',color:calView===v.id?C.cyan:C.t3,fontWeight:calView===v.id?700:500}}>{v.label}</button>
                    ))}
                  </div>
                  <button className="tcs-btn" onClick={()=>navigate(-1)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,.03)',border:`1px solid ${C.brd}`,color:C.t3}}>
                    <ChevronLeft style={{width:13,height:13}}/>
                  </button>
                  <span style={{fontSize:14,fontWeight:800,color:C.t1,flex:1,letterSpacing:'-.03em'}}>
                    {calView==='month'?format(monthDate,'MMMM yyyy'):calView==='week'?`${format(week[0],'MMM d')} – ${format(week[6],'MMM d, yyyy')}`:format(selectedDate,'EEEE, MMMM d, yyyy')}
                  </span>
                  <button className="tcs-btn" onClick={()=>navigate(1)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,.03)',border:`1px solid ${C.brd}`,color:C.t3}}>
                    <ChevronRight style={{width:13,height:13}}/>
                  </button>
                  <button className="tcs-btn" onClick={()=>{setSelectedDate(now);setMonthDate(now);}} style={{padding:'6px 14px',borderRadius:8,fontSize:11,fontWeight:700,background:C.cyanD,border:`1px solid ${C.cyanB}`,color:C.cyan}}>Today</button>
                </div>
                {/* Week strip */}
                {(calView==='week'||calView==='day')&&(
                  <div style={{display:'flex',gap:5}}>
                    {week.map((d,i)=>(
                      <WeekCell key={i} date={d} isSelected={isSameDay(d,selectedDate)} isToday={isSameDay(d,now)}
                        classCount={groupClasses.length} ciCount={weekCICounts[i]}
                        onClick={()=>{setSelectedDate(d);setCalView('day');setDetailCls(null);}}/>
                    ))}
                  </div>
                )}
                {/* Month grid */}
                {calView==='month'&&(
                  <div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:5}}>
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>(
                        <div key={d} style={{textAlign:'center',fontSize:9,fontWeight:700,color:C.t3,textTransform:'uppercase',letterSpacing:'.07em',padding:'4px 0'}}>{d}</div>
                      ))}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
                      {monthDays.map((d,i)=>(
                        <MonthCell key={i} date={d} isCurrentMonth={isSameMonth(d,monthDate)} isSelected={isSameDay(d,selectedDate)} isToday={isSameDay(d,now)}
                          classCount={groupClasses.length} ciCount={dayCIs(d).length}
                          onClick={()=>{setSelectedDate(d);setCalView('day');setDetailCls(null);}}/>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sessions header + filter */}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
                  <div style={{width:3,height:16,borderRadius:99,background:`linear-gradient(180deg,${C.cyan},${C.violet})`}}/>
                  <span style={{fontSize:14,fontWeight:800,color:C.t1,letterSpacing:'-.03em'}}>
                    {isToday?"Today's Sessions":`${format(selectedDate,'EEE, MMM d')} Sessions`}
                  </span>
                  <span style={{fontSize:11,fontWeight:700,color:C.cyan,background:C.cyanD,border:`1px solid ${C.cyanB}`,borderRadius:6,padding:'2px 7px'}}>{classesWithData.length}</span>
                </div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  {['all',...classTypes].map(type=>{
                    const cfg=type==='all'?{color:C.cyan,label:'All',emoji:'📋'}:CLASS_CFG[type]||CLASS_CFG.default;
                    const active=typeFilter===type;
                    return (
                      <button key={type} className="tcs-btn" onClick={()=>setTypeFilter(type)} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 11px',borderRadius:99,fontSize:11,border:`1px solid ${active?`${cfg.color}28`:C.brd}`,background:active?`${cfg.color}0d`:'transparent',color:active?cfg.color:C.t3,fontWeight:active?700:500,whiteSpace:'nowrap'}}>
                        <span style={{fontSize:12}}>{cfg.emoji}</span>{cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session cards */}
              {classesWithData.length===0?(
                <div style={{padding:'40px 24px',textAlign:'center',borderRadius:14,background:C.card,border:`1px solid ${C.brd}`,marginBottom:16}}>
                  <Calendar style={{width:20,height:20,color:C.t3,margin:'0 auto 10px',opacity:.4}}/>
                  <p style={{fontSize:14,color:C.t2,fontWeight:700,margin:'0 0 5px',letterSpacing:'-.02em'}}>No sessions on this day</p>
                  <p style={{fontSize:12,color:C.t3,margin:'0 0 18px'}}>{typeFilter!=='all'?'Try clearing the type filter':'Select a different day or add a class'}</p>
                  <button className="tcs-btn" onClick={()=>openModal('classes')} style={{fontSize:12,fontWeight:700,color:C.cyan,background:C.cyanD,border:`1px solid ${C.cyanB}`,borderRadius:9,padding:'8px 18px',gap:5}}>
                    <Plus style={{width:11,height:11}}/> Add Class
                  </button>
                </div>
              ):(
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(480px,1fr))',gap:10,marginBottom:16}}>
                  {classesWithData.map((cls,idx)=>(
                    <div key={cls.id||idx} className="tcs-fu" style={{animationDelay:`${Math.min(idx*.06,.4)}s`}}>
                      <SessionCard cls={cls} onOpen={()=>setDetailCls(p=>p?.id===cls.id?null:cls)} isSelected={detailCls?.id===cls.id} openModal={openModal} avatarMap={avatarMap}/>
                    </div>
                  ))}
                </div>
              )}

              {/* PT / Appointments */}
              {appointments.length>0&&(
                <div className="tcs-fu" style={{animationDelay:'.3s',marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}>
                    <div style={{width:3,height:16,borderRadius:99,background:`linear-gradient(180deg,${C.blue},${C.cyan})`}}/>
                    <span style={{fontSize:14,fontWeight:800,color:C.t1,flex:1,letterSpacing:'-.03em'}}>PT / 1:1 Appointments</span>
                    <button className="tcs-btn" onClick={()=>openModal('bookAppointment')} style={{fontSize:11,fontWeight:700,color:C.blue,background:C.blueD,border:`1px solid ${C.blueB}`,borderRadius:8,padding:'5px 12px',gap:4}}>
                      <Plus style={{width:10,height:10}}/> Book
                    </button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10}}>
                    {appointments.map((apt,i)=>{
                      const m=allMemberships.find(x=>x.user_id===apt.client_id||x.user_id===apt.user_id);
                      const name=apt.client_name||m?.user_name||'Client';
                      const initials=name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
                      return (
                        <div key={apt.id||i} style={{padding:'14px 16px',borderRadius:12,background:C.card,border:`1px solid ${C.brd}`,borderLeft:`3px solid ${C.blue}`,display:'flex',alignItems:'center',gap:11}}>
                          <div style={{width:42,height:42,borderRadius:12,background:C.blueD,border:`1px solid ${C.blueB}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,color:C.blue,flexShrink:0}}>{initials}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:C.t1,letterSpacing:'-.02em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
                            <div style={{fontSize:11,color:C.blue,marginTop:3,fontWeight:600}}>{apt.schedule||apt.time||'TBD'}</div>
                          </div>
                          <IBtn icon={QrCode} label="Check In" color={C.green} onClick={()=>openModal('qrScanner')} size="xs"/>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── BOTTOM GRID ── */}
            <div className="tcs-bottom-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,padding:'0 18px'}}>
              <OptimizationPanel classesWithData={classesWithData} checkIns={checkIns} now={now}/>
              <ActionCentre allMemberships={allMemberships} checkIns={checkIns} myClasses={myClasses} now={now} openModal={openModal}/>
              <QuickActions openModal={openModal}/>
            </div>

            {/* ── ANALYTICS ROW ── */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,padding:'10px 18px 0'}}>
              <ActivitySpark checkIns={checkIns} now={now}/>
              {/* Day Summary */}
              <div className="tcs-card" style={{borderRadius:14,background:C.card,border:`1px solid ${C.brd}`,padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
                  <BarChart2 style={{width:13,height:13,color:C.blue}}/>
                  <span style={{fontSize:13,fontWeight:700,color:C.t1}}>Day Summary</span>
                </div>
                {[
                  {label:'Sessions',value:classesWithData.length,color:C.cyan},
                  {label:'Checked In',value:totalPresent,color:C.green},
                  {label:'Expected',value:totalBooked,color:C.t2},
                  {label:'No-Shows',value:totalNoShows,color:totalNoShows>0?C.red:C.t3},
                  {label:'Avg Fill',value:`${avgFill}%`,color:fillColor(avgFill)},
                  {label:'Late Cancels',value:totalLateCancels,color:totalLateCancels>0?C.amber:C.t3},
                  {label:'PT Sessions',value:appointments.length,color:C.blue},
                ].map((s,i,arr)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<arr.length-1?`1px solid ${C.brd}`:'none'}}>
                    <span style={{fontSize:11,color:C.t2,fontWeight:500}}>{s.label}</span>
                    <span style={{fontSize:14,fontWeight:700,color:s.color}}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {classTypes.length>0&&(
              <div style={{padding:'10px 18px 0'}}>
                <ClassMixPanel classesWithData={classesWithData} classTypes={classTypes}/>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}