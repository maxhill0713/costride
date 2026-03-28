import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  subDays, startOfDay, isWithinInterval, format, differenceInDays,
  isSameDay, parseISO, isValid,
} from 'date-fns';
import {
  Users, Activity, AlertCircle, Flame, MessageCircle, ChevronRight,
  Search, Download, Plus, Check, X, Trophy, UserPlus, List,
  LayoutGrid, Heart, Dumbbell, ClipboardList, Calendar, Star,
  TrendingUp, TrendingDown, Minus, Shield, Zap, BarChart2,
  Gift, CreditCard, Package, Share2, Clock,
  Ban, Filter, ChevronDown, Send, Layers,
  Target, Award, Eye, AlertTriangle, CheckCircle,
  UserCheck, RotateCcw, Lightbulb,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { CoachKpiCard, CoachCard, MiniAvatar } from './CoachHelpers';
import { ClientAdvancedProfile, ClassPerformanceWidget } from './ClientAdvancedProfile';

// ─── Inject styles ─────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('cm-styles')) {
  const s = document.createElement('style');
  s.id = 'cm-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&family=JetBrains+Mono:wght@400;500;700;800&display=swap');
    @keyframes cm-fadeUp   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes cm-slideIn  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
    @keyframes cm-countUp  { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
    @keyframes cm-pulse    { 0%,100%{opacity:1} 50%{opacity:0.55} }
    .cm-fade-up   { animation: cm-fadeUp  0.3s ease both; }
    .cm-slide-in  { animation: cm-slideIn 0.25s ease both; }
    .cm-count-up  { animation: cm-countUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
    .cm-pulse     { animation: cm-pulse 2.5s ease-in-out infinite; }
    .cm-row:hover { background: rgba(255,255,255,0.022) !important; }
    .cm-btn:hover { filter: brightness(1.18); }
    .cm-card-hover:hover { transform: translateY(-1px); border-color: var(--hover-border) !important; }
  `;
  document.head.appendChild(s);
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  bg:     '#060c16', surface:'#0b1220', card:'#0e1826',
  border: 'rgba(255,255,255,0.065)', borderHi:'rgba(255,255,255,0.10)',
  t1:'#f0f4ff', t2:'#8fa0bc', t3:'#4a5e7a', t4:'#253045',
  red:'#f04f4f', amber:'#f5a623', green:'#00c87a',
  blue:'#4a9eff', purple:'#9b7df8', cyan:'#00d4f0', pink:'#f472b6',
};

// ─── Existing constants ────────────────────────────────────────────────────────
const STATUS_PRIORITY = { vip:0, active:1, regular:2, at_risk:3, inactive:4 };
const STATUS_CFG = {
  vip:      { color:'#fbbf24', label:'VIP',     bg:'rgba(251,191,36,0.1)'  },
  active:   { color:'#34d399', label:'Active',  bg:'rgba(52,211,153,0.1)'  },
  regular:  { color:'#38bdf8', label:'Regular', bg:'rgba(56,189,248,0.1)'  },
  at_risk:  { color:'#f87171', label:'At Risk', bg:'rgba(248,113,113,0.1)' },
  inactive: { color:'#64748b', label:'Lapsed',  bg:'rgba(100,116,139,0.1)' },
};
const PRESET_TAGS      = ['VIP','Beginner','Advanced','Injury','Nutrition Goal','Competition Prep','Post-Rehab','Online Client','Weight Loss','Muscle Gain','Athlete','Senior'];
const FITNESS_LEVELS   = ['Beginner','Intermediate','Advanced','Elite'];
const MEDALS           = ['🥇','🥈','🥉'];
const ONBOARDING_STEPS = [
  { id:'parq',          label:'PAR-Q Form Signed',     icon:'📋' },
  { id:'goals_set',     label:'Goals Set',              icon:'🎯' },
  { id:'first_session', label:'First Session Booked',   icon:'📅' },
  { id:'tour',          label:'Gym Tour Completed',     icon:'🏋️' },
  { id:'app_setup',     label:'Member App Set Up',      icon:'📱' },
  { id:'payment',       label:'Payment Method Added',   icon:'💳' },
  { id:'photo',         label:'Progress Photo Taken',   icon:'📸' },
];

// ─── Retention score ───────────────────────────────────────────────────────────
function calcRetentionScore(userId, checkIns, now) {
  const uci   = checkIns.filter(c => c.user_id === userId);
  const ms    = d => now - new Date(d.check_in_date);
  const recent7  = uci.filter(c => ms(c) < 7  * 864e5).length;
  const recent30 = uci.filter(c => ms(c) < 30 * 864e5).length;
  const prev30   = uci.filter(c => ms(c) >= 30 * 864e5 && ms(c) < 60 * 864e5).length;
  const sorted   = [...uci].sort((a,b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const last     = sorted[0];
  const daysAgo  = last ? Math.floor(ms(last) / 864e5) : 999;
  const total    = uci.length;

  let score = 100;
  if      (daysAgo >= 999) score -= 60;
  else if (daysAgo > 21)   score -= 45;
  else if (daysAgo > 14)   score -= 30;
  else if (daysAgo > 7)    score -= 15;
  else if (daysAgo > 3)    score -= 5;
  if      (recent30 === 0) score -= 25;
  else if (recent30 <= 2)  score -= 15;
  else if (recent30 <= 4)  score -= 5;
  if (recent7 >= 2) score += 5;
  score = Math.max(0, Math.min(100, score));

  const trend  = prev30 > 0
    ? (recent30 > prev30*1.1 ? 'improving' : recent30 < prev30*0.7 ? 'declining' : 'stable')
    : (recent30 >= 2 ? 'improving' : 'stable');
  const status = score >= 65 ? 'safe' : score >= 35 ? 'at_risk' : 'high_risk';
  const color  = status === 'safe' ? D.green : status === 'at_risk' ? D.amber : D.red;
  const label  = status === 'safe' ? 'Safe' : status === 'at_risk' ? 'At Risk' : 'High Risk';
  const tier   = status === 'safe' ? 'healthy' : status === 'at_risk' ? 'needs_attention' : 'at_risk';

  // 30-day spark (daily)
  const spark30 = Array.from({length:30}, (_,i) => {
    const s = new Date(now - (29-i)*864e5); s.setHours(0,0,0,0);
    const e = new Date(s); e.setHours(23,59,59,999);
    return uci.filter(c => { const d = new Date(c.check_in_date); return d>=s && d<=e; }).length;
  });
  // 14-day spark
  const spark14 = spark30.slice(16);

  return { score, status, trend, color, label, tier, daysAgo, recent7, recent30, prev30, total, spark14, spark30 };
}

// ─── Retention ring SVG ────────────────────────────────────────────────────────
function RetentionRing({ rs, size=46 }) {
  const r    = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (rs.score / 100) * circ;
  const TIcon = rs.trend === 'improving' ? TrendingUp : rs.trend === 'declining' ? TrendingDown : Minus;
  const tc    = rs.trend === 'improving' ? D.green : rs.trend === 'declining' ? D.red : D.t3;
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,flexShrink:0}}>
      <div style={{position:'relative',width:size,height:size}}>
        <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3.5}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={rs.color} strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray={`${fill} ${circ}`}
            style={{transition:'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)'}}
          />
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:size<42?9:11,fontWeight:800,color:rs.color,fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{rs.score}</span>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:2}}>
        <TIcon style={{width:8,height:8,color:tc}}/>
        <span style={{fontSize:7,color:tc,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>{rs.trend.slice(0,3)}</span>
      </div>
    </div>
  );
}

// ─── Sparkline bars ────────────────────────────────────────────────────────────
function SparkBars({ data, color, height=14, width=52 }) {
  const max = Math.max(...data, 1);
  const bw  = (width / data.length) - 1.5;
  return (
    <svg width={width} height={height} style={{flexShrink:0,display:'block'}}>
      {data.map((v,i) => {
        const h = Math.max(2,(v/max)*height);
        return <rect key={i} x={i*(bw+1.5)} y={height-h} width={bw} height={h} rx={1.5}
          fill={v>0?color:'rgba(255,255,255,0.07)'} opacity={v>0?0.85:1}/>;
      })}
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function exportCSV(clients) {
  const rows = [
    ['Name','Status','Monthly Visits','Total Visits','Streak','No-Shows','Last Visit','Join Date'],
    ...clients.map(c=>[c.user_name||'Unknown',STATUS_CFG[c.status]?.label||c.status,c.visits,c.totalVisits,c.streak,c.noShows||0,c.last?format(new Date(c.last),'yyyy-MM-dd'):'Never',c.join_date||c.created_date||'']),
  ];
  const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  const a = document.createElement('a'); a.href=url; a.download='clients.csv'; a.click();
  URL.revokeObjectURL(url);
}

function getBirthdayStatus(dob, now) {
  if (!dob) return null;
  try {
    const d = parseISO(dob); if (!isValid(d)) return null;
    const ty   = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    const diff = differenceInDays(ty, startOfDay(now));
    if (diff >= 0 && diff <= 7)  return {label: diff===0?'🎂 Today!':`🎂 in ${diff}d`, color:'#f472b6', urgent:diff<=2};
    if (diff < 0  && diff >= -3) return {label:'🎂 Just passed', color:'#94a3b8', urgent:false};
    return null;
  } catch { return null; }
}

function calcNoShowRate(bookings=[], checkIns=[], userId) {
  const ub = bookings.filter(b=>b.user_id===userId&&b.status==='booked');
  if (!ub.length) return 0;
  const attended = ub.filter(b=>checkIns.some(c=>c.user_id===userId&&isSameDay(new Date(c.check_in_date),new Date(b.date)))).length;
  return Math.round(((ub.length-attended)/ub.length)*100);
}

// ─── Shared primitives ─────────────────────────────────────────────────────────
function Btn({ label, icon:Icon, color=D.blue, onClick, sm, full }) {
  return (
    <button className="cm-btn" onClick={onClick}
      style={{display:'flex',alignItems:'center',gap:sm?3:4,padding:sm?'4px 8px':'5px 11px',borderRadius:7,background:`${color}0e`,border:`1px solid ${color}22`,color,fontSize:sm?10:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif",transition:'filter 0.15s',width:full?'100%':undefined,justifyContent:full?'center':undefined}}>
      {Icon&&<Icon style={{width:sm?9:10,height:sm?9:10}}/>}{label}
    </button>
  );
}

function NoShowBadge({ rate }) {
  if (!rate) return null;
  const color = rate>=40?'#f87171':rate>=20?'#fbbf24':'#94a3b8';
  return <span style={{fontSize:8,fontWeight:700,color,background:`${color}10`,border:`1px solid ${color}30`,borderRadius:4,padding:'1px 5px',flexShrink:0}}>{rate}% no-show</span>;
}

function EngagementBar({ visits, trend, streak, color }) {
  const pct = Math.min(100,(visits/20)*100);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4,width:64,flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:11,fontWeight:800,color,fontFamily:"'JetBrains Mono',monospace"}}>{visits}<span style={{fontSize:9,color:D.t4,fontWeight:400}}>/mo</span></span>
        {trend>0&&<TrendingUp style={{width:9,height:9,color:D.green}}/>}
        {trend<0&&<TrendingDown style={{width:9,height:9,color:D.red}}/>}
        {trend===0&&<Minus style={{width:9,height:9,color:D.t3}}/>}
      </div>
      <div style={{height:4,borderRadius:99,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${color},${color}88)`,borderRadius:99}}/>
      </div>
      {streak>=3&&<span style={{fontSize:9,color:D.amber,fontWeight:700}}>🔥{streak}d</span>}
    </div>
  );
}

// ─── NEW: Engagement Timeline (30-day) ────────────────────────────────────────
function EngagementTimeline({ checkIns, now, sc, m }) {
  const data = useMemo(() => {
    return Array.from({length:30},(_,i)=>{
      const day  = subDays(now,29-i);
      const ds   = startOfDay(day);
      const de   = new Date(ds); de.setHours(23,59,59,999);
      const vis  = checkIns.filter(c=>{ const d=new Date(c.check_in_date); return d>=ds&&d<=de; }).length;
      return { date:format(day,'d MMM'), visited:vis, missed: vis===0?1:0 };
    });
  },[checkIns,now]);

  const totalVisits  = data.reduce((a,d)=>a+d.visited,0);
  const totalMissed  = data.reduce((a,d)=>a+d.missed,0);
  const visitRate    = Math.round((totalVisits/(totalVisits+totalMissed))*100)||0;
  const longestGap   = useMemo(()=>{
    let max=0,cur=0;
    data.forEach(d=>{ if(d.missed){cur++;max=Math.max(max,cur);}else cur=0; });
    return max;
  },[data]);

  return (
    <div>
      {/* Summary pills */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        {[
          {label:'30-day visits', value:totalVisits,         color:sc.color},
          {label:'Days missed',   value:totalMissed,         color:totalMissed>20?D.red:D.t3},
          {label:'Visit rate',    value:`${visitRate}%`,     color:visitRate>=50?D.green:visitRate>=25?D.amber:D.red},
          {label:'Longest gap',   value:`${longestGap}d`,    color:longestGap>10?D.red:longestGap>5?D.amber:D.green},
        ].map((s,i)=>(
          <div key={i} style={{padding:'8px 12px',borderRadius:9,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.05)',flex:1,minWidth:72}}>
            <div style={{fontSize:16,fontWeight:900,color:s.color,fontFamily:"'JetBrains Mono',monospace",lineHeight:1,letterSpacing:'-0.02em'}}>{s.value}</div>
            <div style={{fontSize:8,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginTop:3}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>30-Day Activity</div>
        <div style={{height:64}}>
          <ResponsiveContainer width="100%" height={64}>
            <BarChart data={data} barSize={4} margin={{top:0,right:0,left:0,bottom:0}}>
              <XAxis dataKey="date" tick={{fill:'#253045',fontSize:7}} axisLine={false} tickLine={false} interval={4}/>
              <Tooltip
                contentStyle={{background:'rgba(6,12,24,0.97)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}
                formatter={(v,n)=>[v, n==='visited'?'Visited':'Missed']}
              />
              <Bar dataKey="visited" fill={sc.color} radius={[2,2,0,0]} opacity={0.85}/>
              <Bar dataKey="missed"  fill="rgba(255,255,255,0.05)" radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heat strip */}
      <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>Daily Heat Map</div>
      <div style={{display:'flex',gap:2.5,flexWrap:'nowrap',overflowX:'auto'}}>
        {data.map((d,i)=>(
          <div key={i} title={`${d.date}: ${d.visited>0?'Visited':'Not visited'}`}
            style={{width:16,height:16,borderRadius:4,flexShrink:0,background:d.visited>0?`${sc.color}cc`:'rgba(255,255,255,0.04)',border:`1px solid ${d.visited>0?`${sc.color}40`:'rgba(255,255,255,0.04)'}`}}
          />
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
        <span style={{fontSize:8,color:D.t4}}>30 days ago</span>
        <span style={{fontSize:8,color:D.t4}}>Today</span>
      </div>
    </div>
  );
}

// ─── NEW: Insights Panel ──────────────────────────────────────────────────────
function InsightsPanel({ m, checkIns, now, openModal, sc }) {
  const insights = useMemo(()=>{
    const uci    = checkIns.filter(c=>c.user_id===m.user_id);
    const ms     = d => now - new Date(d.check_in_date);
    const r7     = uci.filter(c=>ms(c)<7*864e5).length;
    const r14    = uci.filter(c=>ms(c)<14*864e5).length;
    const r30    = uci.filter(c=>ms(c)<30*864e5).length;
    const p30    = uci.filter(c=>ms(c)>=30*864e5&&ms(c)<60*864e5).length;
    const sorted = [...uci].sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date));
    const daysAgo = sorted[0] ? Math.floor(ms(sorted[0])/864e5) : 999;
    // Compute consecutive missed days from most recent workout
    let gapStreak = 0;
    for(let i=0;i<30;i++){
      const s=startOfDay(subDays(now,i)); const e=new Date(s); e.setHours(23,59,59,999);
      if(uci.some(c=>{const d=new Date(c.check_in_date);return d>=s&&d<=e;})) break;
      gapStreak++;
    }
    // Workouts completed (check-ins with exercise data)
    const workoutsLast14 = uci.filter(c=>ms(c)<14*864e5&&c.exercises?.length>0).length;
    const msgs = [];
    if (daysAgo>=999)    msgs.push({level:'critical',icon:AlertCircle,text:'Has never visited the gym',action:'Send a welcome message',actionType:'post',color:D.red});
    else if(daysAgo>21)  msgs.push({level:'critical',icon:AlertCircle,text:`Absent for ${daysAgo} days — high churn risk`,action:'Reach out now',actionType:'post',color:D.red});
    else if(daysAgo>14)  msgs.push({level:'warning', icon:AlertTriangle,text:`No visit in ${daysAgo} days — losing momentum`,action:'Book a session',actionType:'bookIntoClass',color:D.amber});
    else if(daysAgo>7)   msgs.push({level:'warning', icon:Clock,text:`Last visit was ${daysAgo} days ago`,action:'Send a check-in',actionType:'post',color:D.amber});
    if (r14===0&&p30>3)  msgs.push({level:'critical',icon:TrendingDown,text:'Missed last 2 weeks despite prior activity',action:'Assign a short workout',actionType:'assignWorkout',color:D.red});
    if (workoutsLast14===0&&r14>0) msgs.push({level:'warning',icon:Dumbbell,text:'No workout completed in 14 days',action:'Assign a workout plan',actionType:'assignWorkout',color:D.amber});
    if (p30>3&&r30<p30*0.5) {
      const drop=Math.round(((p30-r30)/p30)*100);
      msgs.push({level:'warning',icon:TrendingDown,text:`Attendance dropped ${drop}% vs last month (${p30}→${r30})`,action:'Book a session',actionType:'bookIntoClass',color:D.amber});
    }
    if (r7===0&&r30>=3)  msgs.push({level:'info',icon:Zap,text:"Hasn't booked this week despite being regular",action:'Book now',actionType:'bookIntoClass',color:D.blue});
    if (m.noShowRate>=30) msgs.push({level:'warning',icon:Ban,text:`${m.noShowRate}% no-show rate — commitment concern`,action:'Message to discuss',actionType:'post',color:D.amber});
    if (m.streak>=7)     msgs.push({level:'positive',icon:Flame,text:`🔥 ${m.streak}-day streak — keep the momentum!`,action:'Send encouragement',actionType:'post',color:D.green});
    if (r30>=12)         msgs.push({level:'positive',icon:CheckCircle,text:`${r30} visits this month — excellent engagement`,action:'Send praise',actionType:'post',color:D.green});
    // Milestone
    const MILESTONES=[5,10,25,50,100,200];
    const justHit=MILESTONES.find(ms=>m.totalVisits===ms);
    if(justHit) msgs.push({level:'positive',icon:Trophy,text:`🏆 Just hit ${justHit} total visits!`,action:'Celebrate with them',actionType:'post',color:D.purple});
    const nextMs=MILESTONES.find(ms=>m.totalVisits<ms);
    if(nextMs&&nextMs-m.totalVisits<=2) msgs.push({level:'info',icon:Target,text:`${nextMs-m.totalVisits} visit${nextMs-m.totalVisits>1?'s':''} away from ${nextMs}-visit milestone`,action:'Book to hit it',actionType:'bookIntoClass',color:D.cyan});
    return msgs.slice(0,6);
  },[m,checkIns,now]);

  if(!insights.length) return (
    <div style={{padding:'16px',textAlign:'center',color:D.t4}}>
      <CheckCircle style={{width:20,height:20,opacity:0.3,margin:'0 auto 8px',display:'block'}}/>
      <p style={{fontSize:12,fontWeight:600,margin:0}}>No critical insights right now</p>
    </div>
  );

  const levelBg = {critical:`${D.red}07`,warning:`${D.amber}07`,info:`${D.blue}07`,positive:`${D.green}07`};
  const levelBorder = {critical:`${D.red}22`,warning:`${D.amber}22`,info:`${D.blue}22`,positive:`${D.green}22`};

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {insights.map((ins,i)=>(
        <div key={i} style={{padding:'10px 13px',borderRadius:10,background:levelBg[ins.level]||D.card,border:`1px solid ${levelBorder[ins.level]||D.border}`,display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:28,height:28,borderRadius:8,background:`${ins.color}12`,border:`1px solid ${ins.color}28`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <ins.icon style={{width:12,height:12,color:ins.color}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:600,color:D.t1,lineHeight:1.4}}>{ins.text}</div>
          </div>
          <button className="cm-btn" onClick={()=>openModal(ins.actionType,{memberId:m.user_id,memberName:m.user_name})}
            style={{padding:'4px 10px',borderRadius:7,background:`${ins.color}0e`,border:`1px solid ${ins.color}22`,color:ins.color,fontSize:10,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>
            {ins.action}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── ClientCard (grid) ────────────────────────────────────────────────────────
function ClientCard({ m, avatarMap, onSelect, isSelected, onToggleSelect, bulkMode }) {
  const sc   = STATUS_CFG[m.status]||STATUS_CFG.regular;
  const pct  = Math.min(100,(m.visits/20)*100);
  const bday = getBirthdayStatus(m.date_of_birth,new Date());
  const rs   = m.rs;
  return (
    <div onClick={()=>bulkMode?onToggleSelect(m.user_id):onSelect(m)}
      className="cm-card-hover"
      style={{'--hover-border':`${sc.color}45`,borderRadius:14,padding:16,background:D.surface,border:`1px solid ${isSelected?sc.color:sc.color+'20'}`,cursor:'pointer',transition:'transform 0.15s, border-color 0.15s',position:'relative',outline:isSelected?`2px solid ${sc.color}40`:'none',fontFamily:"'DM Sans',sans-serif"}}>
      {bulkMode&&(
        <div style={{position:'absolute',top:10,right:10,width:18,height:18,borderRadius:5,border:`2px solid ${isSelected?sc.color:'rgba(255,255,255,0.2)'}`,background:isSelected?sc.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
          {isSelected&&<Check style={{width:10,height:10,color:'#000'}}/>}
        </div>
      )}
      {bday&&<div style={{position:'absolute',top:10,left:10,fontSize:9,fontWeight:800,color:bday.color,background:`${bday.color}15`,borderRadius:4,padding:'2px 5px'}}>{bday.label}</div>}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10,marginTop:bday?16:0}}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <div style={{position:'relative'}}>
            <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={40} color={sc.color}/>
            <div style={{position:'absolute',bottom:0,right:0,width:11,height:11,borderRadius:'50%',background:sc.color,border:'2px solid '+D.surface}}/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:D.t1,lineHeight:1.2}}>{m.user_name||'Client'}</div>
            <span style={{fontSize:9,fontWeight:800,color:sc.color,background:sc.bg,borderRadius:4,padding:'2px 6px'}}>{sc.label}</span>
          </div>
        </div>
        {rs&&<RetentionRing rs={rs} size={40}/>}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
        {[{val:m.visits,sub:'this month',color:D.blue},{val:m.totalVisits,sub:'all time',color:D.purple}].map((s,i)=>(
          <div key={i} style={{padding:8,borderRadius:8,background:'rgba(255,255,255,0.03)',textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:900,color:s.color,letterSpacing:'-0.03em',fontFamily:"'JetBrains Mono',monospace"}}>{s.val}</div>
            <div style={{fontSize:8,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em'}}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{height:4,borderRadius:99,background:'rgba(255,255,255,0.05)',overflow:'hidden',marginBottom:8}}>
        <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${sc.color},${sc.color}88)`,borderRadius:99}}/>
      </div>
      {rs&&<SparkBars data={rs.spark14} color={sc.color} height={12} width="100%"/>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
        <div style={{fontSize:10,color:D.t3}}>{m.daysAgo===null?'Never visited':m.daysAgo===0?'✅ Today':`Last: ${m.daysAgo}d ago`}</div>
        {m.noShowRate>0&&<NoShowBadge rate={m.noShowRate}/>}
      </div>
    </div>
  );
}

// ─── BulkActionBar ─────────────────────────────────────────────────────────────
function BulkActionBar({ selected, allFiltered, onSelectAll, onClear, onBulkMessage, onBulkExport }) {
  return (
    <div style={{position:'sticky',top:0,zIndex:100,padding:'10px 16px',background:'rgba(10,20,40,0.97)',backdropFilter:'blur(12px)',borderRadius:12,border:'1px solid rgba(155,125,248,0.3)',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:10,fontFamily:"'DM Sans',sans-serif"}}>
      <span style={{fontSize:12,fontWeight:800,color:D.purple}}>{selected.length} selected</span>
      <button onClick={onSelectAll} style={{fontSize:11,color:D.t3,background:'none',border:'none',cursor:'pointer',fontWeight:600}}>
        {selected.length===allFiltered.length?'Deselect all':`Select all (${allFiltered.length})`}
      </button>
      <div style={{flex:1}}/>
      <button onClick={onBulkMessage} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:8,background:`${D.blue}10`,border:`1px solid ${D.blue}22`,color:D.blue,fontSize:11,fontWeight:700,cursor:'pointer'}}>
        <Send style={{width:10,height:10}}/> Message All
      </button>
      <button onClick={onBulkExport} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:8,background:'rgba(100,116,139,0.1)',border:'1px solid rgba(100,116,139,0.2)',color:'#94a3b8',fontSize:11,fontWeight:700,cursor:'pointer'}}>
        <Download style={{width:10,height:10}}/> Export
      </button>
      <button onClick={onClear} style={{width:28,height:28,borderRadius:8,background:`${D.red}08`,border:`1px solid ${D.red}18`,color:D.red,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <X style={{width:12,height:12}}/>
      </button>
    </div>
  );
}

// ─── NEW: Retention View (priority tiers) ─────────────────────────────────────
function RetentionView({ enriched, avatarMap, onSelect, openModal, now }) {
  const tiers = useMemo(()=>{
    const at_risk=[],needs_attention=[],healthy=[];
    enriched.forEach(m=>{
      if     (m.rs.tier==='at_risk')          at_risk.push(m);
      else if(m.rs.tier==='needs_attention')   needs_attention.push(m);
      else                                     healthy.push(m);
    });
    at_risk.sort((a,b)=>a.rs.score-b.rs.score);
    needs_attention.sort((a,b)=>a.rs.score-b.rs.score);
    healthy.sort((a,b)=>b.rs.score-a.rs.score);
    return { at_risk, needs_attention, healthy };
  },[enriched]);

  const TierSection = ({clients, title, color, icon:Icon, emptyMsg, delay=0}) => {
    const [collapsed,setCollapsed]=useState(false);
    return (
      <div className="cm-fade-up" style={{animationDelay:`${delay}s`}}>
        {/* Tier header */}
        <button onClick={()=>setCollapsed(c=>!c)}
          style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,background:`${color}08`,border:`1px solid ${color}20`,cursor:'pointer',marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>
          <div style={{width:26,height:26,borderRadius:8,background:`${color}14`,border:`1px solid ${color}28`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <Icon style={{width:12,height:12,color}}/>
          </div>
          <span style={{fontSize:13,fontWeight:800,color:D.t1,letterSpacing:'-0.01em'}}>{title}</span>
          <span style={{fontSize:9,fontWeight:800,color,background:`${color}14`,border:`1px solid ${color}28`,borderRadius:99,padding:'2px 8px',fontFamily:"'JetBrains Mono',monospace"}}>{clients.length}</span>
          <div style={{flex:1}}/>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <span style={{fontSize:10,color:D.t4}}>Avg score: <span style={{fontWeight:700,color,fontFamily:"'JetBrains Mono',monospace"}}>{clients.length?Math.round(clients.reduce((a,c)=>a+c.rs.score,0)/clients.length):0}</span></span>
            <ChevronDown style={{width:12,height:12,color:D.t3,transform:collapsed?'rotate(0deg)':'rotate(180deg)',transition:'transform 0.2s'}}/>
          </div>
        </button>

        {!collapsed&&(
          clients.length===0 ? (
            <div style={{padding:'14px',textAlign:'center',color:D.t4,fontSize:11,fontWeight:600}}>{emptyMsg}</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {clients.map((m,i)=>{
                const sc=STATUS_CFG[m.status]||STATUS_CFG.regular;
                const bday=getBirthdayStatus(m.date_of_birth,new Date());
                return (
                  <div key={m.user_id||i} className="cm-fade-up"
                    style={{padding:'12px 14px',borderRadius:11,background:D.surface,border:`1px solid ${m.rs.color}1a`,borderLeft:`3px solid ${m.rs.color}`,cursor:'pointer',animationDelay:`${i*0.04+delay}s`,transition:'all 0.15s'}}
                    onClick={()=>onSelect(m)}
                    onMouseEnter={e=>e.currentTarget.style.background=D.card}
                    onMouseLeave={e=>e.currentTarget.style.background=D.surface}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:9}}>
                      {/* Avatar */}
                      <div style={{position:'relative',flexShrink:0}}>
                        <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={36} color={sc.color}/>
                        <div style={{position:'absolute',bottom:0,right:0,width:10,height:10,borderRadius:'50%',background:sc.color,border:'2px solid '+D.surface}}/>
                      </div>
                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2,flexWrap:'wrap'}}>
                          <span style={{fontSize:13,fontWeight:800,color:D.t1,letterSpacing:'-0.01em'}}>{m.user_name||'Client'}</span>
                          <span style={{fontSize:9,fontWeight:800,color:sc.color,background:sc.bg,borderRadius:4,padding:'2px 6px'}}>{sc.label}</span>
                          {m.isNew&&<span style={{fontSize:9,color:D.purple,background:`${D.purple}10`,borderRadius:4,padding:'2px 5px'}}>New</span>}
                          {bday&&<span style={{fontSize:9,color:bday.color,background:`${bday.color}12`,borderRadius:4,padding:'1px 5px'}}>{bday.label}</span>}
                          {m.noShowRate>=25&&<NoShowBadge rate={m.noShowRate}/>}
                        </div>
                        {/* Reason */}
                        <div style={{fontSize:10,color:D.t3,marginBottom:5}}>
                          {m.daysAgo>=999?'Has never visited':m.daysAgo>14?`No visit in ${m.daysAgo} days`:m.daysAgo>7?`Last seen ${m.daysAgo}d ago`:`${m.rs.recent30} visits this month`}
                          {m.rs.trend==='declining'&&<span style={{color:D.red,marginLeft:6,fontWeight:700}}>↓ declining</span>}
                          {m.rs.trend==='improving'&&<span style={{color:D.green,marginLeft:6,fontWeight:700}}>↑ improving</span>}
                        </div>
                        {/* Spark + stats */}
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <SparkBars data={m.rs.spark14} color={m.rs.color} height={12} width={52}/>
                          <span style={{fontSize:9,color:D.t4,fontFamily:"'JetBrains Mono',monospace"}}>{m.rs.recent30}/mo</span>
                          {m.streak>=3&&<span style={{fontSize:9,color:D.amber}}>🔥{m.streak}d</span>}
                        </div>
                      </div>
                      {/* Retention ring */}
                      <RetentionRing rs={m.rs} size={46}/>
                    </div>
                    {/* Quick actions */}
                    <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                      <Btn sm label="Message"    icon={MessageCircle} color={D.blue}   onClick={e=>{e.stopPropagation();openModal('post',{memberId:m.user_id})}}/>
                      <Btn sm label="Book"       icon={Calendar}      color={D.purple} onClick={e=>{e.stopPropagation();openModal('bookIntoClass',{memberId:m.user_id,memberName:m.user_name})}}/>
                      <Btn sm label="Workout"    icon={Dumbbell}      color={D.green}  onClick={e=>{e.stopPropagation();openModal('assignWorkout',{memberId:m.user_id,memberName:m.user_name})}}/>
                      {m.rs.tier!=='healthy'&&<Btn sm label="Reschedule" icon={RotateCcw} color={D.amber} onClick={e=>{e.stopPropagation();openModal('bookIntoClass',{memberId:m.user_id,memberName:m.user_name,reschedule:true})}}/>}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <TierSection clients={tiers.at_risk}          title="🔴 At Risk"         color={D.red}   icon={AlertCircle}  emptyMsg="No high-risk clients — excellent!" delay={0}/>
      <TierSection clients={tiers.needs_attention}  title="🟡 Needs Attention"  color={D.amber} icon={AlertTriangle} emptyMsg="No clients need attention right now" delay={0.05}/>
      <TierSection clients={tiers.healthy}          title="🟢 Healthy"          color={D.green} icon={CheckCircle}  emptyMsg="No active clients in this segment" delay={0.1}/>
    </div>
  );
}

// ─── Enhanced ClientDetailPanel ───────────────────────────────────────────────
function ClientDetailPanel({ m, checkIns, avatarMap, now, notes, saveNote, tags, saveTag, goals, saveGoal, health, saveHealth, packages, savePackage, onboarding, saveOnboarding, openModal }) {
  const [activeTab, setActiveTab] = useState('insights');
  const [newGoal,   setNewGoal]   = useState({title:'',target:'',unit:'',current:'',deadline:''});
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newPkg,    setNewPkg]    = useState({name:'',total:'',used:''});
  const [showPkgForm,  setShowPkgForm]  = useState(false);

  const sc = STATUS_CFG[m.status]||STATUS_CFG.regular;
  const clientCIs    = checkIns.filter(c=>c.user_id===m.user_id).sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date));
  const clientGoals  = goals[m.user_id]    ||[];
  const clientTags   = tags[m.user_id]     ||[];
  const clientHealth = health[m.user_id]   ||{injuries:'',restrictions:'',fitnessLevel:'Beginner',notes:''};
  const clientPkgs   = packages[m.user_id] ||[];
  const clientOnboard= onboarding[m.user_id]||{};
  const bday         = getBirthdayStatus(m.date_of_birth,now);

  const membershipExpiry = useMemo(()=>{
    if(!m.membership_expiry&&!m.renewal_date) return null;
    const expDate=m.membership_expiry||m.renewal_date;
    try{const d=new Date(expDate);const daysLeft=differenceInDays(d,now);return{date:d,daysLeft,urgent:daysLeft<=14};}
    catch{return null;}
  },[m,now]);

  const onboardPct = Math.round((ONBOARDING_STEPS.filter(s=>clientOnboard[s.id]).length/ONBOARDING_STEPS.length)*100);

  const handleAddGoal=()=>{
    if(!newGoal.title) return;
    saveGoal(m.user_id,[...clientGoals,{...newGoal,id:Date.now()}]);
    setNewGoal({title:'',target:'',unit:'',current:'',deadline:''});
    setShowGoalForm(false);
  };
  const handleAddPkg=()=>{
    if(!newPkg.name) return;
    savePackage(m.user_id,[...clientPkgs,{...newPkg,id:Date.now()}]);
    setNewPkg({name:'',total:'',used:''});
    setShowPkgForm(false);
  };
  const toggleTag   = tag=>saveTag(m.user_id,clientTags.includes(tag)?clientTags.filter(t=>t!==tag):[...clientTags,tag]);
  const updateHealth= (f,v)=>saveHealth(m.user_id,{...clientHealth,[f]:v});
  const toggleOnboard=id=>saveOnboarding(m.user_id,{...clientOnboard,[id]:!clientOnboard[id]});

  const inputStyle={padding:'7px 10px',borderRadius:7,background:'#060c18',border:'1px solid rgba(255,255,255,0.08)',color:D.t1,fontSize:11,outline:'none',width:'100%',boxSizing:'border-box',fontFamily:"'DM Sans',sans-serif"};

  const TABS=[
    {id:'insights',   label:'💡 Insights'},
    {id:'timeline',   label:'📊 Timeline'},
    {id:'advanced',   label:'⚡ Smart'},
    {id:'overview',   label:'Stats'},
    {id:'logs',       label:'📋 Logs'},
    {id:'progress',   label:'📈 Progress'},
    {id:'health',     label:'🩺 Health'},
    {id:'goals',      label:'🎯 Goals'},
    {id:'packages',   label:'📦 Sessions'},
    {id:'onboarding', label:'✅ Onboard'},
    {id:'payments',   label:'💳 Billing'},
    {id:'notes',      label:'Notes'},
    {id:'profile',    label:'Profile'},
  ];

  return (
    <div style={{background:`${sc.color}04`,borderBottom:'1px solid rgba(255,255,255,0.04)',fontFamily:"'DM Sans',sans-serif"}}>
      {/* Tab strip */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.06)',overflowX:'auto',paddingLeft:16}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{padding:'9px 13px',border:'none',background:'transparent',color:activeTab===t.id?sc.color:D.t3,fontSize:10.5,fontWeight:activeTab===t.id?800:500,cursor:'pointer',borderBottom:`2px solid ${activeTab===t.id?sc.color:'transparent'}`,marginBottom:-1,whiteSpace:'nowrap',flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>
            {t.label}
          </button>
        ))}
        <div style={{flex:1,minWidth:8}}/>
        <div style={{display:'flex',alignItems:'center',gap:5,padding:'0 8px',flexShrink:0}}>
          {[
            {label:'Message',   icon:MessageCircle, color:D.blue,   modal:'post',           data:{memberId:m.user_id}},
            {label:'Book',      icon:Calendar,      color:D.purple, modal:'bookIntoClass',   data:{memberId:m.user_id,memberName:m.user_name}},
            {label:'Challenge', icon:Trophy,        color:D.amber,  modal:'assignChallenge', data:{memberId:m.user_id,memberName:m.user_name}},
          ].map(({label,icon:Ic,color,modal,data})=>(
            <button key={label} onClick={()=>openModal(modal,data)}
              style={{display:'flex',alignItems:'center',gap:4,padding:'5px 9px',borderRadius:7,background:`${color}0d`,border:`1px solid ${color}25`,color,fontSize:10,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif"}}>
              <Ic style={{width:10,height:10}}/>{label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'14px 16px'}}>

        {/* ── INSIGHTS TAB (NEW) ── */}
        {activeTab==='insights'&&(
          <div>
            {/* Retention score hero */}
            <div style={{padding:'14px 16px',borderRadius:12,background:`${m.rs.color}07`,border:`1px solid ${m.rs.color}20`,marginBottom:14,display:'flex',alignItems:'center',gap:14}}>
              <RetentionRing rs={m.rs} size={60}/>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:15,fontWeight:900,color:D.t1,letterSpacing:'-0.02em'}}>Retention Score</span>
                  <span style={{fontSize:10,fontWeight:800,color:m.rs.color,background:`${m.rs.color}14`,border:`1px solid ${m.rs.color}28`,borderRadius:99,padding:'2px 8px'}}>{m.rs.label}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {[
                    {label:'This month',   value:`${m.rs.recent30} visits`, color:D.t2},
                    {label:'Last month',   value:`${m.rs.prev30} visits`,   color:m.rs.prev30>m.rs.recent30?D.red:D.t2},
                    {label:'Last 7 days',  value:`${m.rs.recent7} visits`,  color:m.rs.recent7>=2?D.green:D.t2},
                  ].map((s,i)=>(
                    <div key={i}>
                      <div style={{fontSize:12,fontWeight:800,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div>
                      <div style={{fontSize:8,color:D.t4,textTransform:'uppercase',letterSpacing:'0.06em',marginTop:1}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Membership expiry */}
            {membershipExpiry?.urgent&&(
              <div style={{padding:'10px 14px',borderRadius:10,background:`${D.red}06`,border:`1px solid ${D.red}20`,marginBottom:10,display:'flex',alignItems:'center',gap:10}}>
                <AlertCircle style={{width:14,height:14,color:D.red,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:800,color:D.red}}>Membership expiring in {membershipExpiry.daysLeft} days</div>
                  <div style={{fontSize:10,color:D.t3,marginTop:1}}>Expires {format(membershipExpiry.date,'MMM d, yyyy')}</div>
                </div>
                <button onClick={()=>openModal('post',{memberId:m.user_id,renewal:true})} style={{padding:'5px 10px',borderRadius:7,background:`${D.red}12`,border:`1px solid ${D.red}25`,color:D.red,fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>
                  Send reminder
                </button>
              </div>
            )}

            {/* Birthday */}
            {bday&&(
              <div style={{padding:'10px 14px',borderRadius:10,background:'rgba(244,114,182,0.06)',border:'1px solid rgba(244,114,182,0.2)',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>🎂</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:800,color:D.pink}}>Birthday {bday.label.replace('🎂 ','')}</div>
                  {m.date_of_birth&&<div style={{fontSize:10,color:D.t3}}>{format(parseISO(m.date_of_birth),'MMMM d')}</div>}
                </div>
                <button onClick={()=>openModal('post',{memberId:m.user_id,birthday:true})} style={{padding:'5px 10px',borderRadius:7,background:'rgba(244,114,182,0.12)',border:'1px solid rgba(244,114,182,0.25)',color:D.pink,fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>
                  Send wishes 🎉
                </button>
              </div>
            )}

            <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
              <Lightbulb style={{width:9,height:9}}/> Actionable Insights
            </div>
            <InsightsPanel m={m} checkIns={checkIns} now={now} openModal={openModal} sc={sc}/>

            {/* Onboarding nudge */}
            {m.isNew&&(
              <div style={{marginTop:12,padding:'10px 14px',borderRadius:10,background:`${D.purple}06`,border:`1px solid ${D.purple}18`}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
                  <span style={{fontSize:11,fontWeight:800,color:D.purple}}>🌱 Onboarding Progress</span>
                  <span style={{fontSize:11,fontWeight:900,color:onboardPct===100?D.green:D.purple}}>{onboardPct}%</span>
                </div>
                <div style={{height:4,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${onboardPct}%`,background:`linear-gradient(90deg,${D.purple},#7c3aed)`,borderRadius:99,transition:'width 0.6s ease'}}/>
                </div>
                <button onClick={()=>setActiveTab('onboarding')} style={{marginTop:8,fontSize:10,color:D.purple,background:'none',border:'none',cursor:'pointer',fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>View checklist →</button>
              </div>
            )}
          </div>
        )}

        {/* ── TIMELINE TAB (NEW) ── */}
        {activeTab==='timeline'&&(
          <EngagementTimeline checkIns={clientCIs} now={now} sc={sc} m={m}/>
        )}

        {/* ── ADVANCED TAB ── */}
        {activeTab==='advanced'&&(
          <div>
            {membershipExpiry?.urgent&&(
              <div style={{padding:'10px 14px',borderRadius:10,background:`${D.red}06`,border:`1px solid ${D.red}20`,marginBottom:12,display:'flex',alignItems:'center',gap:10}}>
                <AlertCircle style={{width:14,height:14,color:D.red,flexShrink:0}}/>
                <div><div style={{fontSize:11,fontWeight:800,color:D.red}}>Membership expiring in {membershipExpiry.daysLeft} days</div><div style={{fontSize:10,color:D.t3,marginTop:2}}>Expires {format(membershipExpiry.date,'MMM d, yyyy')}</div></div>
                <button onClick={()=>openModal('post',{memberId:m.user_id,renewal:true})} style={{marginLeft:'auto',padding:'5px 10px',borderRadius:7,background:`${D.red}12`,border:`1px solid ${D.red}25`,color:D.red,fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>Send reminder</button>
              </div>
            )}
            {bday&&(
              <div style={{padding:'10px 14px',borderRadius:10,background:'rgba(244,114,182,0.06)',border:'1px solid rgba(244,114,182,0.2)',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>🎂</span>
                <div><div style={{fontSize:11,fontWeight:800,color:D.pink}}>Birthday {bday.label.replace('🎂 ','')}</div>{m.date_of_birth&&<div style={{fontSize:10,color:D.t3}}>{format(parseISO(m.date_of_birth),'MMMM d')}</div>}</div>
                <button onClick={()=>openModal('post',{memberId:m.user_id,birthday:true})} style={{marginLeft:'auto',padding:'5px 10px',borderRadius:7,background:'rgba(244,114,182,0.12)',border:'1px solid rgba(244,114,182,0.25)',color:D.pink,fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>Send wishes 🎉</button>
              </div>
            )}
            {m.isNew&&(
              <div style={{padding:'10px 14px',borderRadius:10,background:`${D.purple}06`,border:`1px solid ${D.purple}18`,marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
                  <span style={{fontSize:11,fontWeight:800,color:D.purple}}>🌱 New Member Onboarding</span>
                  <span style={{fontSize:11,fontWeight:900,color:onboardPct===100?D.green:D.purple}}>{onboardPct}%</span>
                </div>
                <div style={{height:4,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${onboardPct}%`,background:`linear-gradient(90deg,${D.purple},#7c3aed)`,borderRadius:99,transition:'width 0.6s ease'}}/>
                </div>
                <button onClick={()=>setActiveTab('onboarding')} style={{marginTop:8,fontSize:10,color:D.purple,background:'none',border:'none',cursor:'pointer',fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>View checklist →</button>
              </div>
            )}
            <ClientAdvancedProfile client={m} checkIns={clientCIs} now={now}/>
            {m.noShowRate>=25&&(
              <div style={{marginTop:12,padding:'10px 14px',borderRadius:10,background:`${D.amber}06`,border:`1px solid ${D.amber}20`,display:'flex',alignItems:'center',gap:8}}>
                <Ban style={{width:13,height:13,color:D.amber,flexShrink:0}}/>
                <div style={{fontSize:10,color:D.t3}}><span style={{fontWeight:700,color:D.amber}}>{m.noShowRate}% no-show rate</span> — consider a follow-up conversation about commitment.</div>
              </div>
            )}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {activeTab==='overview'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16}}>
              {[
                {label:'Visits / Month',  value:m.visits,      color:D.blue},
                {label:'Last Visit',      value:m.daysAgo===null?'Never':m.daysAgo===0?'Today':`${m.daysAgo}d ago`, color:m.daysAgo>14?D.red:'#34d399'},
                {label:'Total Check-ins', value:m.totalVisits, color:D.purple},
                {label:'No-Show Rate',    value:`${m.noShowRate}%`, color:m.noShowRate>=30?D.red:m.noShowRate>=15?D.amber:'#34d399'},
              ].map((s,i)=>(
                <div key={i} style={{padding:'10px',borderRadius:10,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.05)',textAlign:'center'}}>
                  <div style={{fontSize:17,fontWeight:900,color:s.color,letterSpacing:'-0.03em',lineHeight:1,marginBottom:4,fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div>
                  <div style={{fontSize:8,color:D.t4,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}>{s.label}</div>
                </div>
              ))}
            </div>
            {membershipExpiry&&(
              <div style={{padding:'12px 14px',borderRadius:10,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.05)',marginBottom:12}}>
                <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Membership</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[{label:'Plan',value:m.membership_type||'Monthly'},{label:'Status',value:m.membership_status||'Active'},{label:'Expires',value:format(membershipExpiry.date,'MMM d, yyyy')}].map((item,i)=>(
                    <div key={i}><div style={{fontSize:8,color:D.t4,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>{item.label}</div><div style={{fontSize:11,fontWeight:700,color:membershipExpiry?.urgent&&item.label==='Expires'?D.red:D.t1}}>{item.value}</div></div>
                  ))}
                </div>
              </div>
            )}
            <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Recent Visits</div>
            {clientCIs.length===0
              ?<p style={{fontSize:11,color:D.t4,margin:'0 0 12px'}}>No visits yet</p>
              :clientCIs.slice(0,5).map((ci,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:i===0?'#34d399':D.t4,flexShrink:0}}/>
                  <span style={{fontSize:11,fontWeight:600,color:D.t2,flex:1}}>{format(new Date(ci.check_in_date),'EEE, MMM d')}</span>
                  <span style={{fontSize:10,color:D.t4}}>{format(new Date(ci.check_in_date),'h:mm a')}</span>
                  {i===0&&<span style={{fontSize:9,color:'#34d399',background:'rgba(52,211,153,0.1)',borderRadius:4,padding:'1px 6px',fontWeight:700}}>Latest</span>}
                </div>
              ))
            }
            <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:7,marginTop:12}}>14-Day Activity</div>
            <div style={{display:'flex',gap:3}}>
              {m.rs.spark14.map((v,si)=>(
                <div key={si} title={format(subDays(now,13-si),'MMM d')} style={{flex:1,aspectRatio:'1',borderRadius:4,background:v>0?`${sc.color}cc`:'rgba(255,255,255,0.05)',border:`1px solid ${v>0?`${sc.color}40`:'rgba(255,255,255,0.05)'}`,maxWidth:22}}/>
              ))}
            </div>
          </div>
        )}

        {/* ── LOGS TAB ── */}
        {activeTab==='logs'&&(
          <div>
            <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Training Session History</div>
            {clientCIs.length===0?(
              <p style={{fontSize:11,color:D.t4,margin:0,textAlign:'center',padding:'20px 0'}}>No sessions logged yet</p>
            ):clientCIs.slice(0,10).map((ci,i)=>(
              <div key={i} style={{padding:'10px 12px',borderRadius:10,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',marginBottom:7}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:ci.exercises?.length?8:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:i===0?'#34d399':D.t4,flexShrink:0}}/>
                    <span style={{fontSize:12,fontWeight:700,color:D.t1}}>{format(new Date(ci.check_in_date),'EEE, MMM d, yyyy')}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {i===0&&<span style={{fontSize:9,color:'#34d399',background:'rgba(52,211,153,0.1)',borderRadius:4,padding:'1px 6px',fontWeight:700}}>Latest</span>}
                    <span style={{fontSize:10,color:D.t4}}>{format(new Date(ci.check_in_date),'h:mm a')}</span>
                  </div>
                </div>
                {ci.exercises?.length>0&&(
                  <div style={{display:'flex',flexDirection:'column',gap:4,marginTop:6}}>
                    {ci.exercises.slice(0,4).map((ex,ei)=>(
                      <div key={ei} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:11,color:D.t2}}>
                        <span style={{display:'flex',alignItems:'center',gap:5}}><Dumbbell style={{width:9,height:9,color:D.t3}}/>{ex.exercise||ex.name}</span>
                        <span style={{color:D.t3,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{ex.sets&&ex.reps?`${ex.sets}×${ex.reps}`:ex.setsReps||''}{ex.weight?` @ ${ex.weight}kg`:''}</span>
                      </div>
                    ))}
                    {ci.exercises.length>4&&<span style={{fontSize:10,color:D.t4}}>+{ci.exercises.length-4} more exercises</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── PROGRESS TAB ── */}
        {activeTab==='progress'&&(()=>{
          const LIFT_EXERCISES=['bench press','squat','deadlift','overhead press','barbell row'];
          const liftHistory={};
          [...clientCIs].reverse().forEach(ci=>{
            (ci.exercises||[]).forEach(ex=>{
              const name=(ex.exercise||ex.name||'').toLowerCase();
              const match=LIFT_EXERCISES.find(l=>name.includes(l.split(' ')[0]));
              if(match&&ex.weight&&parseFloat(ex.weight)>0){
                if(!liftHistory[match])liftHistory[match]=[];
                liftHistory[match].push({date:format(new Date(ci.check_in_date),'MMM d'),weight:parseFloat(ex.weight)});
              }
            });
          });
          const lifts=Object.entries(liftHistory).filter(([,data])=>data.length>=2);
          const last30CIs=clientCIs.filter(ci=>new Date(ci.check_in_date)>=subDays(new Date(),30));
          return(
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{padding:'14px 16px',borderRadius:12,background:`${D.purple}05`,border:`1px solid ${D.purple}18`}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:7}}><BarChart2 style={{width:13,height:13,color:D.purple}}/><span style={{fontSize:12,fontWeight:800,color:D.t1}}>Session Compliance (30d)</span></div>
                  <span style={{fontSize:20,fontWeight:900,color:last30CIs.length>=12?D.green:last30CIs.length>=6?D.amber:D.red,letterSpacing:'-0.03em',fontFamily:"'JetBrains Mono',monospace"}}>{last30CIs.length}</span>
                </div>
                <div style={{height:6,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden',marginBottom:6}}>
                  <div style={{height:'100%',width:`${Math.min(100,(last30CIs.length/20)*100)}%`,background:last30CIs.length>=12?'linear-gradient(90deg,#34d399,#10b981)':last30CIs.length>=6?'linear-gradient(90deg,#fbbf24,#f59e0b)':'linear-gradient(90deg,#f87171,#ef4444)',borderRadius:99,transition:'width 0.8s ease'}}/>
                </div>
                <div style={{fontSize:10,color:D.t3}}>{last30CIs.length>=16?'🔥 Super Active':last30CIs.length>=8?'👍 Active — good consistency':last30CIs.length>=4?'⚠️ Moderate — encourage more':'🚨 Low — needs follow-up'}</div>
              </div>
              {lifts.length===0?(
                <div style={{textAlign:'center',padding:'20px 0',color:D.t4}}>
                  <TrendingUp style={{width:20,height:20,opacity:0.3,margin:'0 auto 8px'}}/>
                  <p style={{fontSize:12,fontWeight:600,margin:0}}>No lift data yet</p>
                </div>
              ):lifts.map(([liftName,data])=>{
                const pr=Math.max(...data.map(d=>d.weight));
                const gain=data[data.length-1].weight-data[0].weight;
                return(
                  <div key={liftName} style={{padding:'14px 16px',borderRadius:12,background:D.card,border:'1px solid rgba(255,255,255,0.07)'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                      <div><div style={{fontSize:12,fontWeight:800,color:D.t1,textTransform:'capitalize'}}>{liftName}</div><div style={{fontSize:9,color:D.t3,marginTop:2}}>{data.length} sessions · PR: {pr}kg</div></div>
                      <span style={{fontSize:11,fontWeight:700,color:gain>=0?D.green:D.red,background:gain>=0?`${D.green}10`:`${D.red}10`,borderRadius:6,padding:'2px 8px'}}>{gain>=0?'+':''}{gain.toFixed(1)}kg</span>
                    </div>
                    <ResponsiveContainer width="100%" height={80}>
                      <LineChart data={data} margin={{top:4,right:4,left:0,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                        <XAxis dataKey="date" tick={{fill:D.t4,fontSize:9}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:D.t4,fontSize:9}} axisLine={false} tickLine={false} width={28} domain={['auto','auto']}/>
                        <Tooltip contentStyle={{background:'rgba(6,12,24,0.97)',border:`1px solid ${D.purple}22`,borderRadius:8,fontSize:11}} formatter={v=>[`${v}kg`,'Weight']}/>
                        <Line type="monotone" dataKey="weight" stroke={D.purple} strokeWidth={2} dot={{fill:D.purple,r:3}} activeDot={{r:5}}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── HEALTH TAB ── */}
        {activeTab==='health'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8,display:'flex',alignItems:'center',gap:5}}><Dumbbell style={{width:9,height:9}}/> Fitness Level</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {FITNESS_LEVELS.map(level=>{
                  const isActive=clientHealth.fitnessLevel===level;
                  const colors={Beginner:D.purple,Intermediate:D.blue,Advanced:'#34d399',Elite:D.amber};
                  const c=colors[level]||D.t3;
                  return(<button key={level} onClick={()=>updateHealth('fitnessLevel',level)} style={{padding:'5px 12px',borderRadius:8,fontSize:11,fontWeight:isActive?700:500,background:isActive?`${c}16`:'rgba(255,255,255,0.03)',border:`1px solid ${isActive?`${c}35`:'rgba(255,255,255,0.07)'}`,color:isActive?c:D.t3,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontFamily:"'DM Sans',sans-serif"}}>
                    {isActive&&<Check style={{width:9,height:9}}/>}{level}
                  </button>);
                })}
              </div>
            </div>
            {[
              {field:'injuries',     label:'Injuries & Pain Points',   icon:Heart,         placeholder:'e.g. Lower back pain, left shoulder impingement…'},
              {field:'restrictions', label:'Movement Restrictions',    icon:Shield,        placeholder:'e.g. No overhead pressing, avoid deep squats…'},
              {field:'allergies',    label:'Allergies / Medical Info', icon:AlertCircle,   placeholder:'e.g. Asthma, Type 2 diabetes, blood pressure…'},
              {field:'notes',        label:'Additional Health Notes',  icon:ClipboardList, placeholder:'Medications, GP clearance, anything relevant…'},
            ].map(({field,label,icon:Ic,placeholder})=>(
              <div key={field}>
                <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6,display:'flex',alignItems:'center',gap:5}}><Ic style={{width:9,height:9}}/> {label}{clientHealth[field]&&<span style={{fontSize:9,color:'#34d399',fontWeight:600}}>✓ saved</span>}</div>
                <textarea value={clientHealth[field]||''} onChange={e=>updateHealth(field,e.target.value)} placeholder={placeholder} style={{...inputStyle,minHeight:60,resize:'vertical',lineHeight:1.5,fontSize:12,color:D.t2}}/>
              </div>
            ))}
          </div>
        )}

        {/* ── GOALS TAB ── */}
        {activeTab==='goals'&&(
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <span style={{fontSize:11,fontWeight:700,color:D.t2}}>Client Goals</span>
              <button onClick={()=>setShowGoalForm(s=>!s)} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,color:D.purple,background:`${D.purple}08`,border:`1px solid ${D.purple}20`,borderRadius:7,padding:'4px 10px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                <Plus style={{width:9,height:9}}/> Add Goal
              </button>
            </div>
            {showGoalForm&&(
              <div style={{padding:12,borderRadius:10,background:`${D.purple}05`,border:`1px solid ${D.purple}15`,marginBottom:12}}>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:6,marginBottom:6}}>
                  <input value={newGoal.title} onChange={e=>setNewGoal(p=>({...p,title:e.target.value}))} placeholder="Goal (e.g. Bench 100kg)" style={inputStyle}/>
                  <input value={newGoal.target} onChange={e=>setNewGoal(p=>({...p,target:e.target.value}))} placeholder="Target" style={inputStyle}/>
                  <input value={newGoal.unit} onChange={e=>setNewGoal(p=>({...p,unit:e.target.value}))} placeholder="Unit (kg)" style={inputStyle}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:6}}>
                  <input value={newGoal.current} onChange={e=>setNewGoal(p=>({...p,current:e.target.value}))} placeholder="Current value" style={inputStyle}/>
                  <input value={newGoal.deadline} onChange={e=>setNewGoal(p=>({...p,deadline:e.target.value}))} placeholder="Target date" type="date" style={{...inputStyle,colorScheme:'dark'}}/>
                  <button onClick={handleAddGoal} style={{padding:'7px 16px',borderRadius:7,background:'#7c3aed',border:'none',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Save</button>
                </div>
              </div>
            )}
            {clientGoals.length===0
              ?<p style={{fontSize:11,color:D.t4,margin:0,textAlign:'center',padding:'12px 0'}}>No goals set yet.</p>
              :clientGoals.map((g,i)=>{
                const current=parseFloat(g.current)||0,target=parseFloat(g.target)||0;
                const pct=target>0?Math.min(100,Math.round((current/target)*100)):0;
                const daysLeft=g.deadline?differenceInDays(new Date(g.deadline),now):null;
                return(
                  <div key={g.id||i} style={{padding:12,borderRadius:10,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.05)',marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                      <div><span style={{fontSize:12,fontWeight:700,color:D.t1}}>{g.title}</span>{daysLeft!==null&&<span style={{fontSize:9,color:daysLeft<14?D.red:D.t3,marginLeft:8}}>{daysLeft>0?`${daysLeft}d left`:daysLeft===0?'Due today':'Overdue'}</span>}</div>
                      <button onClick={()=>saveGoal(m.user_id,clientGoals.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:D.t3,cursor:'pointer',padding:0}}><X style={{width:12,height:12}}/></button>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,height:5,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:pct>=100?'#34d399':`linear-gradient(90deg,${D.purple},#7c3aed)`,borderRadius:99}}/></div>
                      <span style={{fontSize:10,fontWeight:700,color:pct>=100?'#34d399':D.purple,flexShrink:0,fontFamily:"'JetBrains Mono',monospace"}}>{current}{g.unit}/{g.target}{g.unit} · {pct}%</span>
                    </div>
                    {pct>=100&&<div style={{marginTop:6,fontSize:10,color:'#34d399',fontWeight:700}}>🎉 Goal achieved!</div>}
                  </div>
                );
              })
            }
          </div>
        )}

        {/* ── PACKAGES TAB ── */}
        {activeTab==='packages'&&(
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <span style={{fontSize:11,fontWeight:700,color:D.t2}}>PT Session Packages</span>
              <button onClick={()=>setShowPkgForm(s=>!s)} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,color:'#34d399',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:7,padding:'4px 10px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                <Plus style={{width:9,height:9}}/> Add Package
              </button>
            </div>
            {showPkgForm&&(
              <div style={{padding:12,borderRadius:10,background:'rgba(52,211,153,0.05)',border:'1px solid rgba(52,211,153,0.15)',marginBottom:12}}>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:6}}>
                  <input value={newPkg.name} onChange={e=>setNewPkg(p=>({...p,name:e.target.value}))} placeholder="Package name" style={inputStyle}/>
                  <input value={newPkg.total} onChange={e=>setNewPkg(p=>({...p,total:e.target.value}))} placeholder="Total" type="number" style={inputStyle}/>
                  <input value={newPkg.used} onChange={e=>setNewPkg(p=>({...p,used:e.target.value}))} placeholder="Used" type="number" style={inputStyle}/>
                  <button onClick={handleAddPkg} style={{padding:'7px 14px',borderRadius:7,background:'#059669',border:'none',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif"}}>Save</button>
                </div>
              </div>
            )}
            {clientPkgs.length===0?(
              <div style={{textAlign:'center',padding:'24px 0',color:D.t4}}><Package style={{width:24,height:24,opacity:0.3,margin:'0 auto 8px'}}/><p style={{fontSize:12,fontWeight:600,margin:0}}>No packages yet</p></div>
            ):clientPkgs.map((pkg,i)=>{
              const used=parseInt(pkg.used)||0,total=parseInt(pkg.total)||0;
              const rem=Math.max(0,total-used),pct=total>0?Math.min(100,Math.round((used/total)*100)):0;
              const low=rem<=2&&rem>0,done=rem===0;
              return(
                <div key={pkg.id||i} style={{padding:12,borderRadius:12,background:D.card,border:`1px solid ${done?'rgba(52,211,153,0.2)':low?'rgba(251,191,36,0.2)':'rgba(255,255,255,0.06)'}`,marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                    <div><div style={{fontSize:12,fontWeight:700,color:D.t1}}>{pkg.name}</div><div style={{fontSize:10,color:D.t3,marginTop:2}}>{used} used · <span style={{fontWeight:700,color:done?'#34d399':low?D.amber:D.blue}}>{rem} remaining</span></div></div>
                    <div style={{display:'flex',gap:5,alignItems:'flex-start'}}>
                      {low&&!done&&<span style={{fontSize:9,fontWeight:700,color:D.amber,background:`${D.amber}10`,borderRadius:4,padding:'2px 6px'}}>Low</span>}
                      {done&&<span style={{fontSize:9,fontWeight:700,color:'#34d399',background:'rgba(52,211,153,0.1)',borderRadius:4,padding:'2px 6px'}}>Complete ✓</span>}
                      <button onClick={()=>savePackage(m.user_id,clientPkgs.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:D.t3,cursor:'pointer',padding:0}}><X style={{width:11,height:11}}/></button>
                    </div>
                  </div>
                  <div style={{height:6,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:done?'linear-gradient(90deg,#34d399,#10b981)':low?`linear-gradient(90deg,${D.amber},#f59e0b)`:`linear-gradient(90deg,${D.blue},#0ea5e9)`,borderRadius:99,transition:'width 0.6s ease'}}/>
                  </div>
                  {low&&!done&&<button onClick={()=>openModal('post',{memberId:m.user_id,packageRenewal:true})} style={{marginTop:8,width:'100%',padding:'6px',borderRadius:7,background:`${D.amber}08`,border:`1px solid ${D.amber}20`,color:D.amber,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>💬 Remind about renewal</button>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ONBOARDING TAB ── */}
        {activeTab==='onboarding'&&(
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div><div style={{fontSize:12,fontWeight:800,color:D.t1}}>Onboarding Checklist</div><div style={{fontSize:10,color:D.t3,marginTop:2}}>{ONBOARDING_STEPS.filter(s=>clientOnboard[s.id]).length} of {ONBOARDING_STEPS.length} complete</div></div>
              <div style={{position:'relative',width:48,height:48}}>
                <svg viewBox="0 0 48 48" style={{width:48,height:48,transform:'rotate(-90deg)'}}>
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
                  <circle cx="24" cy="24" r="20" fill="none" stroke={onboardPct===100?'#34d399':D.purple} strokeWidth="4" strokeDasharray={`${(onboardPct/100)*125.7} 125.7`} strokeLinecap="round" style={{transition:'stroke-dasharray 0.6s ease'}}/>
                </svg>
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:onboardPct===100?'#34d399':D.purple,fontFamily:"'JetBrains Mono',monospace"}}>{onboardPct}%</div>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {ONBOARDING_STEPS.map(step=>{
                const done=!!clientOnboard[step.id];
                return(
                  <div key={step.id} onClick={()=>toggleOnboard(step.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:10,background:done?'rgba(52,211,153,0.05)':'rgba(255,255,255,0.025)',border:`1px solid ${done?'rgba(52,211,153,0.2)':'rgba(255,255,255,0.06)'}`,cursor:'pointer',transition:'all 0.15s'}}>
                    <div style={{width:22,height:22,borderRadius:7,border:`2px solid ${done?'#34d399':'rgba(255,255,255,0.15)'}`,background:done?'rgba(52,211,153,0.15)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {done&&<Check style={{width:12,height:12,color:'#34d399'}}/>}
                    </div>
                    <span style={{fontSize:12}}>{step.icon}</span>
                    <span style={{fontSize:12,fontWeight:done?700:500,color:done?D.t1:D.t2}}>{step.label}</span>
                    {done&&<Check style={{width:10,height:10,color:'#34d399',marginLeft:'auto'}}/>}
                  </div>
                );
              })}
            </div>
            {onboardPct===100&&(
              <div style={{marginTop:16,padding:'12px 14px',borderRadius:10,background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.25)',textAlign:'center'}}>
                <div style={{fontSize:20,marginBottom:4}}>🎉</div>
                <div style={{fontSize:12,fontWeight:800,color:'#34d399'}}>Onboarding complete!</div>
                <div style={{fontSize:10,color:D.t3,marginTop:4}}>{m.user_name} is fully set up and ready to go.</div>
              </div>
            )}
          </div>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab==='payments'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
              {[
                {label:'Membership',value:m.membership_type||'Monthly',color:D.blue},
                {label:'Status',value:m.membership_status||'Active',color:'#34d399'},
                {label:'Plan Price',value:m.membership_price?`£${m.membership_price}/mo`:'—',color:D.purple},
              ].map((s,i)=>(
                <div key={i} style={{padding:'10px',borderRadius:10,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.05)',textAlign:'center'}}>
                  <div style={{fontSize:13,fontWeight:900,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div>
                  <div style={{fontSize:8,color:D.t4,textTransform:'uppercase',letterSpacing:'0.06em',marginTop:3}}>{s.label}</div>
                </div>
              ))}
            </div>
            {membershipExpiry&&(
              <div style={{padding:'10px 14px',borderRadius:10,background:membershipExpiry.urgent?`${D.red}06`:'rgba(255,255,255,0.025)',border:`1px solid ${membershipExpiry.urgent?`${D.red}20`:'rgba(255,255,255,0.06)'}`,marginBottom:12,display:'flex',alignItems:'center',gap:10}}>
                <Calendar style={{width:13,height:13,color:membershipExpiry.urgent?D.red:D.t3,flexShrink:0}}/>
                <div><div style={{fontSize:11,fontWeight:700,color:membershipExpiry.urgent?D.red:D.t1}}>{membershipExpiry.daysLeft>0?`Expires in ${membershipExpiry.daysLeft} days`:membershipExpiry.daysLeft===0?'Expires today':'Expired'}</div><div style={{fontSize:10,color:D.t3}}>{format(membershipExpiry.date,'MMMM d, yyyy')}</div></div>
                {membershipExpiry.urgent&&<button onClick={()=>openModal('post',{memberId:m.user_id,renewal:true})} style={{marginLeft:'auto',padding:'5px 10px',borderRadius:7,background:`${D.red}12`,border:`1px solid ${D.red}25`,color:D.red,fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>Remind</button>}
              </div>
            )}
            <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Payment History</div>
            {m.payment_history?.length>0?m.payment_history.slice(0,8).map((p,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:9,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.05)',marginBottom:6}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:p.status==='paid'?'#34d399':p.status==='failed'?D.red:D.amber,flexShrink:0}}/>
                <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:D.t1}}>{p.description||'Membership payment'}</div><div style={{fontSize:10,color:D.t3}}>{p.date?format(new Date(p.date),'MMM d, yyyy'):'—'}</div></div>
                <span style={{fontSize:13,fontWeight:900,color:p.status==='paid'?'#34d399':p.status==='failed'?D.red:D.amber,fontFamily:"'JetBrains Mono',monospace"}}>{p.status==='failed'?'✗':''}£{p.amount||'—'}</span>
              </div>
            )):(
              <div style={{textAlign:'center',padding:'20px 0',color:D.t4}}><CreditCard style={{width:20,height:20,opacity:0.3,margin:'0 auto 8px'}}/><p style={{fontSize:12,fontWeight:600,margin:0}}>No payment data available</p></div>
            )}
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {activeTab==='notes'&&(
          <div>
            <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>Coach Notes {notes[m.user_id]&&<span style={{fontSize:9,color:'#34d399',fontWeight:600}}>✓ saved</span>}</div>
            <textarea placeholder={`Private notes about ${m.user_name||'this client'}…`} value={notes[m.user_id]||''} onChange={e=>saveNote(m.user_id,e.target.value)} style={{width:'100%',minHeight:120,padding:'10px 12px',borderRadius:9,background:'#060c18',border:'1px solid rgba(255,255,255,0.07)',color:D.t2,fontSize:12,resize:'vertical',outline:'none',boxSizing:'border-box',fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}/>
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab==='profile'&&(
          <div>
            <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Tags & Labels</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:18}}>
              {PRESET_TAGS.map(tag=>{
                const isActive=clientTags.includes(tag);
                return(<button key={tag} onClick={()=>toggleTag(tag)} style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:isActive?700:500,background:isActive?`${D.purple}15`:'rgba(255,255,255,0.03)',border:`1px solid ${isActive?`${D.purple}35`:'rgba(255,255,255,0.07)'}`,color:isActive?D.purple:D.t3,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontFamily:"'DM Sans',sans-serif"}}>
                  {isActive&&<Check style={{width:9,height:9}}/>}{tag}
                </button>);
              })}
            </div>
            <div style={{fontSize:9,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Client Info</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
              {[
                {label:'Email',        value:m.user_email||'—'},
                {label:'Member Since', value:m.join_date?format(new Date(m.join_date),'MMM d, yyyy'):m.created_date?format(new Date(m.created_date),'MMM d, yyyy'):'—'},
                {label:'Membership',   value:m.membership_type||'Monthly'},
                {label:'Birthday',     value:m.date_of_birth?format(parseISO(m.date_of_birth),'MMMM d'):'—'},
                {label:'Referred By',  value:m.referred_by||'—'},
                {label:'No-Show Rate', value:`${m.noShowRate}%`},
              ].map((item,i)=>(
                <div key={i} style={{padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.05)'}}>
                  <div style={{fontSize:8,color:D.t4,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:3}}>{item.label}</div>
                  <div style={{fontSize:12,fontWeight:700,color:D.t1,wordBreak:'break-all'}}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function TabCoachMembers({ allMemberships, checkIns, ci30, avatarMap, openModal, now }) {
  const [search,         setSearch]        = useState('');
  const [segment,        setSegment]       = useState('all');
  const [sort,           setSort]          = useState('recentlyActive');
  const [viewMode,       setViewMode]      = useState('retention');
  const [lbMetric,       setLbMetric]      = useState('streak');
  const [expanded,       setExpanded]      = useState(null);
  const [selectedClient, setSelectedClient]= useState(null);
  const [bulkMode,       setBulkMode]      = useState(false);
  const [selected,       setSelected]      = useState([]);
  const [tagFilter,      setTagFilter]     = useState(null);
  const [showTagMenu,    setShowTagMenu]   = useState(false);

  const gymId = allMemberships[0]?.gym_id||null;

  // ── Persisted annotations ──────────────────────────────────────────────────
  const [notes,      setNotes]      = useState(()=>{ try{return JSON.parse(localStorage.getItem('coachClientNotes')||'{}')}catch{return{}} });
  const [tags,       setTags]       = useState(()=>{ try{return JSON.parse(localStorage.getItem('coachClientTags')||'{}')}catch{return{}} });
  const [goals,      setGoals]      = useState(()=>{ try{return JSON.parse(localStorage.getItem('coachClientGoals')||'{}')}catch{return{}} });
  const [health,     setHealth]     = useState(()=>{ try{return JSON.parse(localStorage.getItem('coachClientHealth')||'{}')}catch{return{}} });
  const [packages,   setPackages]   = useState(()=>{ try{return JSON.parse(localStorage.getItem('coachClientPackages')||'{}')}catch{return{}} });
  const [onboarding, setOnboarding] = useState(()=>{ try{return JSON.parse(localStorage.getItem('coachClientOnboarding')||'{}')}catch{return{}} });

  useEffect(()=>{
    if(!gymId) return;
    base44.functions.invoke('coachData',{action:'read',gymId})
      .then(result=>{
        if(!result?.data) return;
        const d=result.data;
        [['client_notes',setNotes,'coachClientNotes'],['client_tags',setTags,'coachClientTags'],['client_goals',setGoals,'coachClientGoals'],['client_health',setHealth,'coachClientHealth'],['client_packages',setPackages,'coachClientPackages'],['client_onboarding',setOnboarding,'coachClientOnboarding']].forEach(([key,setter,lsKey])=>{
          if(d[key]&&Object.keys(d[key]).length){setter(d[key]);try{localStorage.setItem(lsKey,JSON.stringify(d[key]));}catch{}}
        });
      }).catch(()=>{});
  },[gymId]);

  const makeWriter=(stateKey,setter,lsKey,backendField)=>(uid,val)=>{
    const states={notes,tags,goals,health,packages,onboarding};
    const u={...states[stateKey],[uid]:val};
    setter(u);
    try{localStorage.setItem(lsKey,JSON.stringify(u));}catch{}
    if(gymId) base44.functions.invoke('coachData',{action:'write',gymId,field:backendField,data:u}).catch(()=>{});
  };
  const saveNote       = useCallback(makeWriter('notes',     setNotes,     'coachClientNotes',      'client_notes'),      [notes,gymId]);
  const saveTag        = useCallback(makeWriter('tags',      setTags,      'coachClientTags',       'client_tags'),       [tags,gymId]);
  const saveGoal       = useCallback(makeWriter('goals',     setGoals,     'coachClientGoals',      'client_goals'),      [goals,gymId]);
  const saveHealth     = useCallback(makeWriter('health',    setHealth,    'coachClientHealth',     'client_health'),     [health,gymId]);
  const savePackage    = useCallback(makeWriter('packages',  setPackages,  'coachClientPackages',   'client_packages'),   [packages,gymId]);
  const saveOnboarding = useCallback(makeWriter('onboarding',setOnboarding,'coachClientOnboarding', 'client_onboarding'),[onboarding,gymId]);

  // ── Enriched members ────────────────────────────────────────────────────────
  const memberLastCI = useMemo(()=>{
    const map={};
    checkIns.forEach(c=>{ if(!map[c.user_id]||new Date(c.check_in_date)>new Date(map[c.user_id])) map[c.user_id]=c.check_in_date; });
    return map;
  },[checkIns]);

  const enriched = useMemo(()=>allMemberships.map(m=>{
    const last       = memberLastCI[m.user_id];
    const daysAgo    = last?Math.floor((now-new Date(last))/864e5):null;
    const visits     = ci30.filter(c=>c.user_id===m.user_id).length;
    const visitsPrev = checkIns.filter(c=>c.user_id===m.user_id&&isWithinInterval(new Date(c.check_in_date),{start:subDays(now,60),end:subDays(now,30)})).length;
    const trend      = visitsPrev>0?Math.round(((visits-visitsPrev)/visitsPrev)*100):0;
    const ciDays     = new Set(checkIns.filter(c=>c.user_id===m.user_id).map(c=>startOfDay(new Date(c.check_in_date)).getTime()));
    let streak=0; for(let i=0;i<=60;i++){if(ciDays.has(startOfDay(subDays(now,i)).getTime()))streak++;else break;}
    const totalVisits  = checkIns.filter(c=>c.user_id===m.user_id).length;
    const isNew        = m.join_date&&isWithinInterval(new Date(m.join_date),{start:subDays(now,30),end:now});
    const hasHealthNotes=!!(health[m.user_id]?.injuries||health[m.user_id]?.restrictions);
    const status       = visits>=15?'vip':!last?'inactive':daysAgo>=14?'at_risk':daysAgo<=2?'active':'regular';
    const noShowRate   = calcNoShowRate(m.bookings,checkIns,m.user_id);
    const hasBirthday  = !!getBirthdayStatus(m.date_of_birth,now);
    const clientTagList= tags[m.user_id]||[];
    const rs           = calcRetentionScore(m.user_id,checkIns,now);
    return {...m,last,daysAgo,visits,trend,streak,status,totalVisits,isNew,hasHealthNotes,noShowRate,hasBirthday,clientTagList,rs};
  }),[allMemberships,checkIns,ci30,memberLastCI,now,health,tags]);

  // ── Segment counts ──────────────────────────────────────────────────────────
  const counts={
    all:enriched.length,
    new:enriched.filter(m=>m.isNew).length,
    vip:enriched.filter(m=>m.status==='vip').length,
    active:enriched.filter(m=>m.status==='active'||m.status==='regular').length,
    at_risk:enriched.filter(m=>m.status==='at_risk').length,
    lapsed:enriched.filter(m=>m.status==='inactive').length,
    birthdays:enriched.filter(m=>m.hasBirthday).length,
    no_shows:enriched.filter(m=>m.noShowRate>=25).length,
    high_risk:enriched.filter(m=>m.rs.status==='high_risk').length,
    retention_at_risk:enriched.filter(m=>m.rs.status==='at_risk').length,
    healthy:enriched.filter(m=>m.rs.status==='safe').length,
  };

  const SEGMENTS=[
    {id:'all',       label:'All Clients',  count:counts.all},
    {id:'new',       label:'🌱 New',        count:counts.new},
    {id:'vip',       label:'⭐ VIP',        count:counts.vip},
    {id:'active',    label:'Active',        count:counts.active},
    {id:'at_risk',   label:'⚠️ At Risk',    count:counts.at_risk},
    {id:'lapsed',    label:'Lapsed',        count:counts.lapsed},
    {id:'birthdays', label:'🎂 Birthdays',  count:counts.birthdays},
    {id:'no_shows',  label:'🚫 No-shows',   count:counts.no_shows},
  ];

  // ── Filter + sort ────────────────────────────────────────────────────────────
  const filtered = useMemo(()=>enriched
    .filter(m=>{
      const matchSeg  = segment==='all'?true:segment==='new'?m.isNew:segment==='vip'?m.status==='vip':segment==='active'?(m.status==='active'||m.status==='regular'):segment==='birthdays'?m.hasBirthday:segment==='no_shows'?m.noShowRate>=25:m.status===segment;
      const matchTag  = !tagFilter||(tags[m.user_id]||[]).includes(tagFilter);
      const matchSrch = !search||(m.user_name||'').toLowerCase().includes(search.toLowerCase());
      return matchSeg&&matchTag&&matchSrch;
    })
    .sort((a,b)=>{
      if(sort==='recentlyActive'){if(!a.last&&!b.last)return 0;if(!a.last)return 1;if(!b.last)return -1;return new Date(b.last)-new Date(a.last);}
      if(sort==='mostVisits') return b.visits-a.visits;
      if(sort==='name')       return (a.user_name||'').localeCompare(b.user_name||'');
      if(sort==='streak')     return b.streak-a.streak;
      if(sort==='risk')       return a.rs.score-b.rs.score;
      if(sort==='noShows')    return b.noShowRate-a.noShowRate;
      return 0;
    }),[enriched,segment,search,sort,tagFilter,tags]);

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  const lbData = useMemo(()=>[...enriched].sort((a,b)=>{
    if(lbMetric==='streak') return b.streak-a.streak;
    if(lbMetric==='monthly') return b.visits-a.visits;
    return b.totalVisits-a.totalVisits;
  }).slice(0,10),[enriched,lbMetric]);

  // ── Bulk ──────────────────────────────────────────────────────────────────────
  const toggleSelect = uid=>setSelected(s=>s.includes(uid)?s.filter(x=>x!==uid):[...s,uid]);
  const selectAll    = ()=>setSelected(selected.length===filtered.length?[]:filtered.map(m=>m.user_id));
  const clearBulk    = ()=>{setBulkMode(false);setSelected([]);};

  const avgNoShow    = enriched.length>0?Math.round(enriched.reduce((s,m)=>s+m.noShowRate,0)/enriched.length):0;
  const detailProps  = {checkIns,avatarMap,now,notes,saveNote,tags,saveTag,goals,saveGoal,health,saveHealth,packages,savePackage,onboarding,saveOnboarding,openModal};

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16,fontFamily:"'DM Sans',sans-serif"}}>

      {/* ── KPI Row ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
        <CoachKpiCard icon={Users}    label="Total Clients"     value={allMemberships.length}         sub="assigned to you"           accentColor={D.blue}/>
        <CoachKpiCard icon={Activity} label="Active This Month" value={counts.vip+counts.active}      sub="visited this month"        accentColor="#10b981" footerBar={allMemberships.length>0?((counts.vip+counts.active)/allMemberships.length)*100:0}/>
        <CoachKpiCard icon={UserPlus} label="New This Month"    value={counts.new}                    sub="recently joined"           accentColor={D.purple}/>
        <CoachKpiCard icon={Ban}      label="Avg No-Show Rate"  value={`${avgNoShow}%`}               sub={`${counts.no_shows} >25%`} accentColor={avgNoShow>=25?D.red:avgNoShow>=15?D.amber:'#34d399'}/>
        <CoachKpiCard icon={Gift}     label="Birthdays This Week" value={counts.birthdays}            sub="celebrate with them"       accentColor={D.pink}/>
      </div>

      {/* ── Retention score summary bar ── */}
      <div style={{padding:'12px 16px',borderRadius:12,background:D.surface,border:`1px solid ${D.border}`,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <div style={{fontSize:10,fontWeight:700,color:D.t4,textTransform:'uppercase',letterSpacing:'0.09em',flexShrink:0}}>Retention Health</div>
        <div style={{display:'flex',gap:12,flex:1,flexWrap:'wrap'}}>
          {[
            {label:'🔴 High Risk',    value:counts.high_risk,          color:D.red,   pct:allMemberships.length?Math.round((counts.high_risk/allMemberships.length)*100):0},
            {label:'🟡 At Risk',      value:counts.retention_at_risk,  color:D.amber, pct:allMemberships.length?Math.round((counts.retention_at_risk/allMemberships.length)*100):0},
            {label:'🟢 Healthy',      value:counts.healthy,            color:D.green, pct:allMemberships.length?Math.round((counts.healthy/allMemberships.length)*100):0},
          ].map((s,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:120}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:10,color:D.t2,fontWeight:600}}>{s.label}</span>
                  <span style={{fontSize:10,fontWeight:800,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{s.value} <span style={{fontSize:8,color:D.t4}}>({s.pct}%)</span></span>
                </div>
                <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${s.pct}%`,background:s.color,borderRadius:99,transition:'width 0.8s ease'}}/>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={()=>setViewMode('retention')} style={{padding:'6px 12px',borderRadius:8,background:viewMode==='retention'?`${D.blue}14`:'transparent',border:`1px solid ${viewMode==='retention'?`${D.blue}30`:D.border}`,color:viewMode==='retention'?D.blue:D.t3,fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>
          View by Risk
        </button>
      </div>

      {/* ── Segment pills ── */}
      <div style={{display:'flex',gap:4,overflowX:'auto',paddingBottom:2}}>
        {SEGMENTS.map(s=>(
          <button key={s.id} onClick={()=>setSegment(s.id)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:99,border:segment===s.id?`1px solid ${D.purple}40`:`1px solid ${D.border}`,background:segment===s.id?`${D.purple}12`:'transparent',color:segment===s.id?D.purple:D.t3,fontSize:11,fontWeight:segment===s.id?700:500,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,transition:'all 0.15s',fontFamily:"'DM Sans',sans-serif"}}>
            {s.label}
            {s.count>0&&<span style={{fontSize:9,fontWeight:800,background:segment===s.id?`${D.purple}20`:'rgba(255,255,255,0.06)',borderRadius:99,padding:'1px 5px',fontFamily:"'JetBrains Mono',monospace"}}>{s.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Controls ── */}
      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:1,minWidth:160}}>
          <Search style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:12,height:12,color:D.t4}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients…" style={{width:'100%',padding:'8px 12px 8px 30px',borderRadius:10,background:D.card,border:`1px solid ${D.border}`,color:D.t1,fontSize:12,outline:'none',boxSizing:'border-box',fontFamily:"'DM Sans',sans-serif"}}/>
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:'8px 10px',borderRadius:9,background:D.card,border:`1px solid ${D.border}`,color:D.t2,fontSize:11,outline:'none',cursor:'pointer',flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>
          <option value="recentlyActive">Recently Active</option>
          <option value="mostVisits">Most Visits</option>
          <option value="name">Name A–Z</option>
          <option value="streak">Streak</option>
          <option value="risk">Risk Score ↑</option>
          <option value="noShows">No-Show Rate</option>
        </select>
        {/* Tag filter */}
        <div style={{position:'relative',flexShrink:0}}>
          <button onClick={()=>setShowTagMenu(s=>!s)} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 12px',borderRadius:9,background:tagFilter?`${D.purple}12`:D.card,border:`1px solid ${tagFilter?`${D.purple}30`:D.border}`,color:tagFilter?D.purple:D.t2,fontSize:11,fontWeight:tagFilter?700:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            <Filter style={{width:11,height:11}}/>{tagFilter||'Tag filter'}<ChevronDown style={{width:10,height:10}}/>
          </button>
          {showTagMenu&&(
            <div style={{position:'absolute',top:'100%',left:0,marginTop:4,background:'#0d1b2e',border:`1px solid ${D.border}`,borderRadius:10,padding:8,zIndex:50,minWidth:180,boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
              <button onClick={()=>{setTagFilter(null);setShowTagMenu(false);}} style={{width:'100%',padding:'6px 10px',background:'none',border:'none',color:D.t3,fontSize:11,textAlign:'left',cursor:'pointer',borderRadius:6,fontFamily:"'DM Sans',sans-serif"}}>All tags</button>
              {PRESET_TAGS.map(t=>(
                <button key={t} onClick={()=>{setTagFilter(tagFilter===t?null:t);setShowTagMenu(false);}} style={{width:'100%',padding:'6px 10px',background:tagFilter===t?`${D.purple}10`:'none',border:'none',color:tagFilter===t?D.purple:D.t2,fontSize:11,textAlign:'left',cursor:'pointer',borderRadius:6,display:'flex',alignItems:'center',gap:6,fontFamily:"'DM Sans',sans-serif"}}>
                  {tagFilter===t&&<Check style={{width:9,height:9}}/>}{t}
                  <span style={{fontSize:9,color:D.t4,marginLeft:'auto'}}>{enriched.filter(m=>(tags[m.user_id]||[]).includes(t)).length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* View toggles */}
        <div style={{display:'flex',gap:2,padding:3,background:'rgba(255,255,255,0.02)',border:`1px solid ${D.border}`,borderRadius:9,flexShrink:0}}>
          {[
            {id:'retention',   label:'⚡',  title:'Retention View'},
            {id:'list',        icon:List,   title:'List View'},
            {id:'cards',       icon:LayoutGrid, title:'Cards View'},
            {id:'leaderboard', icon:Trophy, title:'Leaderboard'},
          ].map(v=>(
            <button key={v.id} onClick={()=>setViewMode(v.id)} title={v.title}
              style={{width:30,height:28,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:7,border:viewMode===v.id?`1px solid ${D.border}`:'1px solid transparent',background:viewMode===v.id?D.card:'transparent',color:viewMode===v.id?D.purple:D.t4,cursor:'pointer',fontSize:v.label?13:undefined}}>
              {v.label?v.label:<v.icon style={{width:12,height:12}}/>}
            </button>
          ))}
        </div>
        {/* Bulk */}
        <button onClick={()=>{setBulkMode(s=>!s);setSelected([]);}} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:9,background:bulkMode?`${D.purple}12`:'rgba(255,255,255,0.03)',border:`1px solid ${bulkMode?`${D.purple}30`:D.border}`,color:bulkMode?D.purple:D.t3,fontSize:11,fontWeight:bulkMode?700:500,cursor:'pointer',flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>
          <Layers style={{width:11,height:11}}/>{bulkMode?'Cancel':'Bulk'}
        </button>
        <button onClick={()=>exportCSV(filtered)} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:9,background:'rgba(255,255,255,0.03)',border:`1px solid ${D.border}`,color:D.t3,fontSize:11,fontWeight:600,cursor:'pointer',flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>
          <Download style={{width:11,height:11}}/> Export
        </button>
      </div>

      {/* ── Bulk bar ── */}
      {bulkMode&&selected.length>0&&(
        <BulkActionBar selected={selected} allFiltered={filtered} onSelectAll={selectAll} onClear={clearBulk}
          onBulkMessage={()=>openModal('bulkMessage',{memberIds:selected})}
          onBulkExport={()=>exportCSV(filtered.filter(m=>selected.includes(m.user_id)))}
        />
      )}

      {/* ── RETENTION VIEW (default) ── */}
      {viewMode==='retention'&&(
        <RetentionView enriched={filtered} avatarMap={avatarMap} onSelect={setSelectedClient} openModal={openModal} now={now}/>
      )}

      {/* ── LEADERBOARD ── */}
      {viewMode==='leaderboard'&&(
        <div>
          <div style={{display:'flex',gap:4,marginBottom:12}}>
            {[{id:'streak',label:'🔥 Streak'},{id:'monthly',label:'📅 Month'},{id:'alltime',label:'⭐ All Time'}].map(metric=>(
              <button key={metric.id} onClick={()=>setLbMetric(metric.id)} style={{padding:'5px 12px',borderRadius:99,border:lbMetric===metric.id?`1px solid ${D.amber}35`:`1px solid ${D.border}`,background:lbMetric===metric.id?`${D.amber}10`:'transparent',color:lbMetric===metric.id?D.amber:D.t3,fontSize:11,fontWeight:lbMetric===metric.id?700:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                {metric.label}
              </button>
            ))}
          </div>
          <CoachCard accent={D.amber}>
            {lbData.map((m,i)=>{
              const sc=STATUS_CFG[m.status]||STATUS_CFG.regular;
              const val=lbMetric==='streak'?`${m.streak}d 🔥`:lbMetric==='monthly'?`${m.visits} visits`:`${m.totalVisits} total`;
              const barMax=lbData[0]?(lbMetric==='streak'?lbData[0].streak:lbMetric==='monthly'?lbData[0].visits:lbData[0].totalVisits):1;
              const barVal=lbMetric==='streak'?m.streak:lbMetric==='monthly'?m.visits:m.totalVisits;
              return(
                <div key={m.user_id||i} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 16px',borderBottom:i<lbData.length-1?`1px solid ${D.border}`:'none',background:i<3?`rgba(251,191,36,${0.03-i*0.01})`:'transparent'}}>
                  <div style={{width:22,textAlign:'center',fontSize:i<3?16:11,fontWeight:900,color:D.t3,flexShrink:0}}>{MEDALS[i]||i+1}</div>
                  <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={34} color={sc.color}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:D.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.user_name||'Client'}</div>
                    <div style={{marginTop:4,height:3,borderRadius:99,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${barMax>0?(barVal/barMax)*100:0}%`,background:`linear-gradient(90deg,${D.amber},#f59e0b)`,borderRadius:99}}/>
                    </div>
                  </div>
                  <RetentionRing rs={m.rs} size={36}/>
                  <span style={{fontSize:13,fontWeight:900,color:D.amber,background:`${D.amber}10`,borderRadius:7,padding:'3px 10px',flexShrink:0,fontFamily:"'JetBrains Mono',monospace"}}>{val}</span>
                </div>
              );
            })}
          </CoachCard>
        </div>
      )}

      {/* ── CARDS VIEW ── */}
      {viewMode==='cards'&&(
        <>
          {filtered.length===0?(
            <div style={{textAlign:'center',padding:'36px 0',color:D.t4}}><Users style={{width:24,height:24,opacity:0.3,margin:'0 auto 8px'}}/><p style={{fontSize:12,fontWeight:600,margin:0}}>No clients found</p></div>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
              {filtered.map((m,i)=>(
                <ClientCard key={m.user_id||i} m={m} avatarMap={avatarMap} openModal={openModal} onSelect={setSelectedClient} isSelected={selected.includes(m.user_id)} onToggleSelect={toggleSelect} bulkMode={bulkMode}/>
              ))}
            </div>
          )}
          {selectedClient&&!bulkMode&&(
            <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setSelectedClient(null)}>
              <div style={{width:'100%',maxWidth:580,maxHeight:'88vh',overflowY:'auto',borderRadius:20,background:'#0d1b2e',border:`1px solid ${D.borderHi}`,boxShadow:'0 24px 64px rgba(0,0,0,0.65)'}} onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'18px 20px',borderBottom:`1px solid ${D.border}`,position:'sticky',top:0,background:'#0d1b2e',zIndex:1}}>
                  <MiniAvatar name={selectedClient.user_name} src={avatarMap[selectedClient.user_id]} size={44} color={STATUS_CFG[selectedClient.status]?.color||D.purple}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16,fontWeight:900,color:D.t1}}>{selectedClient.user_name||'Client'}</div>
                    <div style={{display:'flex',gap:6,alignItems:'center',marginTop:3,flexWrap:'wrap'}}>
                      <span style={{fontSize:10,fontWeight:800,color:STATUS_CFG[selectedClient.status]?.color,background:STATUS_CFG[selectedClient.status]?.bg,borderRadius:4,padding:'2px 7px'}}>{STATUS_CFG[selectedClient.status]?.label}</span>
                      {selectedClient.hasHealthNotes&&<span style={{fontSize:9,color:D.red,background:`${D.red}10`,border:`1px solid ${D.red}20`,borderRadius:4,padding:'1px 6px',fontWeight:700}}>⚠️ Health notes</span>}
                      {selectedClient.hasBirthday&&<span style={{fontSize:9,color:D.pink,background:`${D.pink}10`,border:`1px solid ${D.pink}20`,borderRadius:4,padding:'1px 6px',fontWeight:700}}>🎂 Birthday</span>}
                    </div>
                  </div>
                  <RetentionRing rs={selectedClient.rs} size={44}/>
                  <button onClick={()=>setSelectedClient(null)} style={{width:30,height:30,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:`1px solid ${D.border}`,color:D.t3,cursor:'pointer'}}>
                    <X style={{width:13,height:13}}/>
                  </button>
                </div>
                <ClientDetailPanel m={selectedClient} {...detailProps}/>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode==='list'&&(
        <CoachCard style={{overflow:'hidden'}}>
          {filtered.length===0?(
            <div style={{textAlign:'center',padding:'36px 0',color:D.t4}}><Users style={{width:24,height:24,opacity:0.3,margin:'0 auto 8px'}}/><p style={{fontSize:12,fontWeight:600,margin:0}}>No clients found</p></div>
          ):filtered.map((m,i)=>{
            const sc=STATUS_CFG[m.status]||STATUS_CFG.regular;
            const isExp=expanded===(m.user_id||i);
            const clientTagList=tags[m.user_id]||[];
            const hasHealth=!!(health[m.user_id]?.injuries||health[m.user_id]?.restrictions);
            const bday=getBirthdayStatus(m.date_of_birth,now);
            const isSelected=selected.includes(m.user_id);
            return(
              <div key={m.user_id||i}>
                <div className="cm-row"
                  style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:isExp?'none':`1px solid ${D.border}`,cursor:'pointer',background:isSelected?`${sc.color}08`:isExp?`${sc.color}05`:'transparent',transition:'background 0.12s',fontFamily:"'DM Sans',sans-serif"}}
                  onClick={()=>bulkMode?toggleSelect(m.user_id):setExpanded(isExp?null:(m.user_id||i))}>
                  {bulkMode&&(
                    <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${isSelected?sc.color:'rgba(255,255,255,0.2)'}`,background:isSelected?sc.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {isSelected&&<Check style={{width:10,height:10,color:'#000'}}/>}
                    </div>
                  )}
                  <div style={{position:'relative',flexShrink:0}}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={38} color={sc.color}/>
                    <div style={{position:'absolute',bottom:0,right:0,width:10,height:10,borderRadius:'50%',background:sc.color,border:'2px solid '+D.surface}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3,flexWrap:'wrap'}}>
                      <span style={{fontSize:13,fontWeight:700,color:D.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.user_name||'Client'}</span>
                      <span style={{fontSize:9,fontWeight:800,color:sc.color,background:sc.bg,borderRadius:4,padding:'2px 6px',flexShrink:0}}>{sc.label}</span>
                      {m.isNew&&<span style={{fontSize:9,color:D.purple,background:`${D.purple}10`,borderRadius:4,padding:'2px 5px',flexShrink:0}}>New</span>}
                      {m.streak>=7&&<span style={{fontSize:9,color:D.amber,flexShrink:0}}>🔥{m.streak}d</span>}
                      {hasHealth&&<span style={{fontSize:8,color:D.red,background:`${D.red}08`,borderRadius:3,padding:'1px 5px',flexShrink:0,border:`1px solid ${D.red}18`}}>⚠️ Health</span>}
                      {bday&&<span style={{fontSize:8,color:bday.color,background:`${bday.color}08`,borderRadius:3,padding:'1px 5px',flexShrink:0,border:`1px solid ${bday.color}18`}}>{bday.label}</span>}
                      {m.noShowRate>=25&&<NoShowBadge rate={m.noShowRate}/>}
                      {clientTagList.slice(0,1).map(t=><span key={t} style={{fontSize:8,color:D.purple,background:`${D.purple}06`,borderRadius:3,padding:'1px 5px',flexShrink:0,border:`1px solid ${D.purple}15`}}>{t}</span>)}
                    </div>
                    <div style={{display:'flex',gap:10,alignItems:'center'}}>
                      <span style={{fontSize:10,color:D.t3}}>{m.visits} visits/mo</span>
                      {m.daysAgo!==null&&<span style={{fontSize:10,color:D.t4}}>Last: {m.daysAgo===0?'today':`${m.daysAgo}d ago`}</span>}
                      {m.trend!==0&&<span style={{fontSize:10,color:m.trend>0?D.green:D.red}}>{m.trend>0?`↑${m.trend}%`:`↓${Math.abs(m.trend)}%`}</span>}
                    </div>
                  </div>
                  {/* Spark dots */}
                  <div style={{width:52,flexShrink:0}}>
                    <SparkBars data={m.rs.spark14} color={sc.color} height={14} width={52}/>
                  </div>
                  {/* Retention ring */}
                  <RetentionRing rs={m.rs} size={38}/>
                  {/* Engagement bar */}
                  <EngagementBar visits={m.visits} trend={m.trend} streak={m.streak} color={sc.color}/>
                  {/* Quick actions */}
                  {m.rs.status!=='safe'&&(
                    <button onClick={e=>{e.stopPropagation();openModal('post',{memberId:m.user_id,nudge:true});}} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:7,background:`${D.amber}08`,border:`1px solid ${D.amber}22`,color:D.amber,fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0,whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif"}}>
                      <Zap style={{width:9,height:9}}/> Nudge
                    </button>
                  )}
                  {bday?.urgent&&(
                    <button onClick={e=>{e.stopPropagation();openModal('post',{memberId:m.user_id,birthday:true});}} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:7,background:`${D.pink}08`,border:`1px solid ${D.pink}22`,color:D.pink,fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0,whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif"}}>
                      🎂 Wish
                    </button>
                  )}
                  {!bulkMode&&(
                    <button onClick={e=>{e.stopPropagation();openModal('post',{memberId:m.user_id});}} style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:`${D.blue}06`,border:`1px solid ${D.blue}12`,color:D.blue,cursor:'pointer',flexShrink:0}}>
                      <MessageCircle style={{width:11,height:11}}/>
                    </button>
                  )}
                  {!bulkMode&&<ChevronRight style={{width:13,height:13,color:D.t4,flexShrink:0,transform:isExp?'rotate(90deg)':'none',transition:'transform 0.2s'}}/>}
                </div>
                {isExp&&!bulkMode&&<ClientDetailPanel m={m} {...detailProps}/>}
              </div>
            );
          })}
        </CoachCard>
      )}

      {/* ── Retention view modal (when client selected from retention cards) ── */}
      {selectedClient&&viewMode==='retention'&&(
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setSelectedClient(null)}>
          <div style={{width:'100%',maxWidth:600,maxHeight:'90vh',overflowY:'auto',borderRadius:20,background:'#0d1b2e',border:`1px solid ${D.borderHi}`,boxShadow:'0 24px 64px rgba(0,0,0,0.65)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'18px 20px',borderBottom:`1px solid ${D.border}`,position:'sticky',top:0,background:'#0d1b2e',zIndex:1,fontFamily:"'DM Sans',sans-serif"}}>
              <MiniAvatar name={selectedClient.user_name} src={avatarMap[selectedClient.user_id]} size={46} color={STATUS_CFG[selectedClient.status]?.color||D.purple}/>
              <div style={{flex:1}}>
                <div style={{fontSize:17,fontWeight:900,color:D.t1,letterSpacing:'-0.02em'}}>{selectedClient.user_name||'Client'}</div>
                <div style={{display:'flex',gap:6,alignItems:'center',marginTop:3,flexWrap:'wrap'}}>
                  <span style={{fontSize:10,fontWeight:800,color:STATUS_CFG[selectedClient.status]?.color,background:STATUS_CFG[selectedClient.status]?.bg,borderRadius:4,padding:'2px 7px'}}>{STATUS_CFG[selectedClient.status]?.label}</span>
                  <span style={{fontSize:9,fontWeight:700,color:selectedClient.rs.color,background:`${selectedClient.rs.color}12`,border:`1px solid ${selectedClient.rs.color}28`,borderRadius:99,padding:'1px 7px'}}>{selectedClient.rs.label}</span>
                  {selectedClient.hasHealthNotes&&<span style={{fontSize:9,color:D.red,background:`${D.red}10`,border:`1px solid ${D.red}20`,borderRadius:4,padding:'1px 6px',fontWeight:700}}>⚠️ Health</span>}
                  {selectedClient.hasBirthday&&<span style={{fontSize:9,color:D.pink,background:`${D.pink}10`,border:`1px solid ${D.pink}20`,borderRadius:4,padding:'1px 6px',fontWeight:700}}>🎂 Birthday</span>}
                </div>
              </div>
              <RetentionRing rs={selectedClient.rs} size={52}/>
              <button onClick={()=>setSelectedClient(null)} style={{width:30,height:30,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:`1px solid ${D.border}`,color:D.t3,cursor:'pointer'}}>
                <X style={{width:13,height:13}}/>
              </button>
            </div>
            <ClientDetailPanel m={selectedClient} {...detailProps}/>
          </div>
        </div>
      )}
    </div>
  );
}
