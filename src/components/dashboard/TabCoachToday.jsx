import React, { useMemo, useState } from 'react';
import { format, isToday, subDays } from 'date-fns';
import {
  AlertCircle, MessageCircle, Calendar, Flame,
  TrendingDown, TrendingUp, CheckCircle, UserX,
  Plus, QrCode, AlertTriangle, Sun, Sunset,
  Dumbbell, RefreshCw, Minus, Trophy, Clock,
  Activity, RotateCcw, ChevronRight, Users,
  Zap, Star, ArrowRight, Phone, Bell, Target,
  BarChart2, Shield, Heart, Send,
} from 'lucide-react';

// ─── CSS ───────────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('today-v2-css')) {
  const s = document.createElement('style');
  s.id = 'today-v2-css';
  s.textContent = `
    @keyframes tv2FadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
    @keyframes tv2Pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
    @keyframes tv2CountUp { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
    .tv2-fade { animation: tv2FadeUp 0.3s ease both; }
    .tv2-count { animation: tv2CountUp 0.4s cubic-bezier(0.34,1.4,0.64,1) both; }
    .tv2-pulse { animation: tv2Pulse 2.5s ease-in-out infinite; }
    .tv2-row:hover { background: rgba(255,255,255,0.025) !important; }
    .tv2-btn { transition: all 0.15s; cursor: pointer; }
    .tv2-btn:hover { filter: brightness(1.18); transform: translateY(-1px); }
    .tv2-card { transition: border-color 0.2s; }
    .tv2-card:hover { border-color: rgba(255,255,255,0.12) !important; }
    .tv2-tab { transition: all 0.15s; cursor: pointer; }
    .tv2-tab:hover { color: #e2e8f0 !important; }
  `;
  document.head.appendChild(s);
}

// ─── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg:      '#070e1a',
  surface: '#0b1525',
  card:    '#0f1c30',
  cardHi:  '#111f35',
  border:  'rgba(255,255,255,0.07)',
  borderHi:'rgba(255,255,255,0.13)',
  divider: 'rgba(255,255,255,0.05)',
  blue:    '#3b82f6',
  blueDim: 'rgba(59,130,246,0.10)',
  blueBrd: 'rgba(59,130,246,0.22)',
  green:   '#10b981',
  greenDim:'rgba(16,185,129,0.09)',
  red:     '#ef4444',
  redDim:  'rgba(239,68,68,0.09)',
  amber:   '#f59e0b',
  amberDim:'rgba(245,158,11,0.09)',
  purple:  '#8b5cf6',
  purpleDim:'rgba(139,92,246,0.09)',
  cyan:    '#06b6d4',
  cyanDim: 'rgba(6,182,212,0.09)',
  t1: '#f1f5f9',
  t2: '#94a3b8',
  t3: '#475569',
  t4: '#2d3f55',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function calcRS(userId, checkIns, now) {
  const uci = checkIns.filter(c => c.user_id === userId);
  const ms  = d => now - new Date(d.check_in_date);
  const r7  = uci.filter(c => ms(c) < 7*864e5).length;
  const r30 = uci.filter(c => ms(c) < 30*864e5).length;
  const p30 = uci.filter(c => ms(c) >= 30*864e5 && ms(c) < 60*864e5).length;
  const sorted = [...uci].sort((a,b) => new Date(b.check_in_date)-new Date(a.check_in_date));
  const daysAgo = sorted[0] ? Math.floor(ms(sorted[0])/864e5) : 999;
  let score = 100;
  if      (daysAgo >= 999) score -= 60;
  else if (daysAgo > 21)   score -= 45;
  else if (daysAgo > 14)   score -= 30;
  else if (daysAgo > 7)    score -= 15;
  else if (daysAgo > 3)    score -= 5;
  if      (r30 === 0) score -= 25;
  else if (r30 <= 2)  score -= 15;
  else if (r30 <= 4)  score -= 5;
  if (r7 >= 2) score += 5;
  score = Math.max(0, Math.min(100, score));
  const trend  = p30 > 0 ? (r30 > p30*1.1 ? 'up' : r30 < p30*0.7 ? 'down' : 'flat') : (r30 >= 2 ? 'up' : 'flat');
  const status = score >= 65 ? 'safe' : score >= 35 ? 'risk' : 'danger';
  const color  = status==='safe' ? T.green : status==='risk' ? T.amber : T.red;
  const spark  = Array.from({length:7},(_,i) => {
    const s=new Date(now-(6-i)*864e5); s.setHours(0,0,0,0);
    const e=new Date(s); e.setHours(23,59,59,999);
    return uci.filter(c=>{const d=new Date(c.check_in_date);return d>=s&&d<=e;}).length;
  });
  return { score, status, trend, color, daysAgo, r30, p30, total: uci.length, spark };
}

function Avatar({ name, size=36, color=T.blue, src }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background: src ? 'transparent' : `${color}18`,
      border:`1.5px solid ${color}30`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:Math.round(size*0.38), fontWeight:800, color, overflow:'hidden',
    }}>
      {src ? <img src={src} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (name||'?').charAt(0).toUpperCase()}
    </div>
  );
}

function Pill({ label, color, bg }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:4,
      color: color || T.t2, background: bg || 'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
      textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap',
    }}>{label}</span>
  );
}

function MiniBtn({ label, icon:Icon, color=T.blue, onClick, full }) {
  return (
    <button className="tv2-btn" onClick={onClick} style={{
      display:'flex', alignItems:'center', justifyContent:'center', gap:4,
      padding:'5px 10px', borderRadius:6,
      background:`${color}10`, border:`1px solid ${color}22`, color,
      fontSize:11, fontWeight:600, whiteSpace:'nowrap',
      width: full ? '100%' : undefined,
      fontFamily:'inherit',
    }}>
      {Icon && <Icon style={{width:10,height:10}}/>}
      {label}
    </button>
  );
}

function Ring({ score, color, size=44 }) {
  const r    = (size-6)/2;
  const circ = 2*Math.PI*r;
  const fill = (score/100)*circ;
  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3.5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3.5}
          strokeLinecap="round" strokeDasharray={`${fill} ${circ}`}
          style={{transition:'stroke-dasharray 1s ease'}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontSize:10,fontWeight:900,color,lineHeight:1}}>{score}</span>
      </div>
    </div>
  );
}

function Sparkbar({ data, color, h=12, w=48 }) {
  const max = Math.max(...data,1);
  const bw  = (w/data.length)-1.5;
  return (
    <svg width={w} height={h} style={{flexShrink:0}}>
      {data.map((v,i)=>{
        const bh = Math.max(2,(v/max)*h);
        return <rect key={i} x={i*(bw+1.5)} y={h-bh} width={bw} height={bh} rx={1.5}
          fill={v>0?color:'rgba(255,255,255,0.06)'} opacity={v>0?0.85:1}/>;
      })}
    </svg>
  );
}

function Divider() {
  return <div style={{height:1,background:T.divider,margin:'0 0'}}/>;
}

// ─── KPI Strip ─────────────────────────────────────────────────────────────────
function KpiStrip({ todayCI, atRiskCount, attentionCount, noShows, totalMembers, healthPct, hc }) {
  const items = [
    { label:'Roster Health', value:healthPct+'%', sub: healthPct>=70?'On track':healthPct>=45?'Needs attention':'Critical' },
    { label:'Check-ins Today', value:todayCI, sub:'vs. yesterday' },
    { label:'At Risk', value:atRiskCount, sub:'need follow-up' },
    { label:'No-shows', value:noShows, sub:'this week' },
    { label:'Need Attention', value:attentionCount, sub:'missed this week' },
    { label:'Total Clients', value:totalMembers, sub:'active roster' },
  ];
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'repeat(6,1fr)',
      borderRadius:12, overflow:'hidden',
      border:`1px solid ${T.border}`,
      background:T.surface,
    }}>
      {items.map((item,i) => (
        <div key={i} style={{
          padding:'16px 14px',
          borderRight: i<items.length-1 ? `1px solid ${T.divider}` : 'none',
          display:'flex', flexDirection:'column', gap:4,
        }}>
          <div className="tv2-count" style={{
            fontSize:26, fontWeight:800, color:T.t1,
            letterSpacing:'-0.04em', lineHeight:1,
            animationDelay:`${i*0.05}s`,
          }}>{item.value}</div>
          <div style={{fontSize:10,fontWeight:700,color:T.t1,lineHeight:1.2}}>{item.label}</div>
          <div style={{fontSize:9,color:T.t3}}>{item.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────
function PageHeader({ currentUser, date }) {
  const hour = date.getHours();
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  const name = currentUser?.display_name?.split(' ')[0] || currentUser?.full_name?.split(' ')[0] || 'Coach';
  const GIcon = hour<17 ? Sun : Sunset;
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
          <GIcon style={{width:12,height:12,color:T.amber}}/>
          <span style={{fontSize:11,color:T.t3,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase'}}>
            {format(date,'EEEE, MMMM d, yyyy')}
          </span>
        </div>
        <h1 style={{fontSize:22,fontWeight:900,color:T.t1,letterSpacing:'-0.03em',margin:0}}>
          {greeting}, {name}
        </h1>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button className="tv2-btn" style={{
          display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,
          background:'rgba(255,255,255,0.04)',border:`1px solid rgba(255,255,255,0.09)`,color:T.t2,
          fontSize:12,fontWeight:700,fontFamily:'inherit',
        }}>
          <QrCode style={{width:13,height:13}}/> Scan Check-in
        </button>
        <button className="tv2-btn" style={{
          display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,
          background:'rgba(139,92,246,0.15)',border:'1px solid rgba(139,92,246,0.3)',color:'#a78bfa',
          fontSize:12,fontWeight:700,fontFamily:'inherit',
        }}>
          <Plus style={{width:13,height:13}}/> New Session
        </button>
      </div>
    </div>
  );
}

// ─── Schedule Timeline ─────────────────────────────────────────────────────────
function ScheduleTimeline({ classes, checkIns, openModal }) {
  const [expandedId, setExpandedId] = useState(null);
  const [sessionStatus, setSessionStatus] = useState({});

  const sessions = useMemo(() => {
    const now = new Date();
    return classes
      .map(cls => {
        const todayAttended = checkIns.filter(c => isToday(new Date(c.check_in_date))).length;
        const capacity = cls.max_capacity || 20;
        const booked   = cls.bookings?.length || Math.min(todayAttended, capacity);
        const status   = sessionStatus[cls.id] || (now.getHours() > 12 ? 'completed' : 'upcoming');
        const fillPct  = Math.round((booked/capacity)*100);
        return { ...cls, booked, capacity, todayAttended, status, fillPct };
      })
      .sort((a,b) => {
        const order = {live:0,upcoming:1,completed:2};
        return (order[a.status]??1) - (order[b.status]??1);
      });
  }, [classes, checkIns, sessionStatus]);

  const statusCfg = {
    live:      { color:T.green,  label:'Live',      dot:'●' },
    upcoming:  { color:T.blue,   label:'Upcoming',  dot:'○' },
    completed: { color:T.t3,     label:'Done',      dot:'✓' },
    cancelled: { color:T.red,    label:'Cancelled', dot:'✗' },
  };

  if (!sessions.length) return (
    <div style={{
      background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
      padding:'28px', textAlign:'center',
    }}>
      <Calendar style={{width:28,height:28,color:T.t4,margin:'0 auto 10px',display:'block'}}/>
      <div style={{fontSize:13,fontWeight:700,color:T.t2,marginBottom:6}}>No classes scheduled today</div>
      <div style={{fontSize:11,color:T.t3,marginBottom:14}}>Add a class to start tracking attendance</div>
      <MiniBtn label="Manage Classes" icon={Plus} color={T.blue} onClick={() => openModal('classes')}/>
    </div>
  );

  return (
    <div className="tv2-card" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'14px 18px',borderBottom:`1px solid ${T.divider}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <Calendar style={{width:14,height:14,color:T.blue}}/>
          <span style={{fontSize:13,fontWeight:800,color:T.t1}}>Today's Schedule</span>
          <span style={{fontSize:9,fontWeight:800,color:T.blue,background:T.blueDim,border:`1px solid ${T.blueBrd}`,borderRadius:99,padding:'2px 7px'}}>{sessions.length}</span>
        </div>
        <div style={{fontSize:11,color:T.t3}}>
          {sessions.reduce((a,c)=>a+c.booked,0)} bookings · {sessions.reduce((a,c)=>a+c.capacity,0)} capacity
        </div>
      </div>

      {/* Sessions list */}
      {sessions.map((cls, i) => {
        const sc = statusCfg[cls.status] || statusCfg.upcoming;
        const isExp = expandedId === cls.id;
        const fillColor = cls.fillPct>=85 ? T.green : cls.fillPct>=55 ? T.blue : T.amber;

        return (
          <div key={cls.id||i}>
            <div
              className="tv2-row"
              onClick={() => setExpandedId(isExp ? null : cls.id)}
              style={{
                padding:'14px 18px', cursor:'pointer',
                borderBottom: isExp ? `1px solid ${T.divider}` : (i<sessions.length-1 ? `1px solid ${T.divider}` : 'none'),
                background:'transparent',
              }}
            >
              {/* Time + class name */}
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                {/* Status indicator */}
                <div style={{
                  width:8,height:8,borderRadius:'50%',flexShrink:0,
                  background:sc.color, boxShadow: cls.status==='live' ? `0 0 0 3px ${sc.color}30` : 'none',
                }}/>

                {/* Main info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:800,color:T.t1,letterSpacing:'-0.01em'}}>{cls.name}</span>
                    {cls.instructor && <span style={{fontSize:10,color:T.t3}}>with {cls.instructor}</span>}
                    <Pill label={sc.label} color={sc.color}/>
                    {cls.difficulty && <Pill label={cls.difficulty} color={T.t3}/>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    {cls.schedule && (
                      <span style={{fontSize:10,color:T.t3,display:'flex',alignItems:'center',gap:3}}>
                        <Clock style={{width:9,height:9}}/>{cls.schedule}
                      </span>
                    )}
                    {cls.duration_minutes && (
                      <span style={{fontSize:10,color:T.t3}}>{cls.duration_minutes} min</span>
                    )}
                    {/* Fill bar */}
                    <div style={{display:'flex',alignItems:'center',gap:5,flex:1,maxWidth:120}}>
                      <div style={{flex:1,height:3,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${cls.fillPct}%`,background:fillColor,borderRadius:99,transition:'width 0.6s ease'}}/>
                      </div>
                      <span style={{fontSize:9,color:fillColor,fontWeight:700,whiteSpace:'nowrap'}}>
                        {cls.booked}/{cls.capacity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right actions */}
                <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                  <MiniBtn label="Check-in" icon={QrCode} color={T.green} onClick={() => openModal('qrScanner', cls)}/>
                  <MiniBtn label="Message" icon={MessageCircle} color={T.blue} onClick={() => openModal('post')}/>
                  <ChevronRight style={{width:12,height:12,color:T.t4,transform:isExp?'rotate(90deg)':'none',transition:'transform 0.2s'}}/>
                </div>
              </div>
            </div>

            {/* Expanded roster */}
            {isExp && (
              <div style={{padding:'12px 18px 14px',background:T.card,borderBottom:i<sessions.length-1?`1px solid ${T.divider}`:'none'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
                  {[
                    {label:'Booked',  value:cls.booked,   color:T.blue},
                    {label:'Attended',value:cls.todayAttended, color:T.green},
                    {label:'Open',    value:Math.max(0,cls.capacity-cls.booked), color:T.t3},
                  ].map((s,i)=>(
                    <div key={i} style={{padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.025)',border:`1px solid ${T.border}`,textAlign:'center'}}>
                      <div style={{fontSize:18,fontWeight:900,color:s.color,letterSpacing:'-0.03em'}}>{s.value}</div>
                      <div style={{fontSize:9,color:T.t3,textTransform:'uppercase',letterSpacing:'0.07em',marginTop:2}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  <MiniBtn label="Mark Confirmed" icon={CheckCircle} color={T.green}
                    onClick={() => setSessionStatus(p=>({...p,[cls.id]:'completed'}))}/>
                  <MiniBtn label="Mark No-show" icon={UserX} color={T.red}
                    onClick={() => setSessionStatus(p=>({...p,[cls.id]:'cancelled'}))}/>
                  <MiniBtn label="Send Reminder" icon={Bell} color={T.amber}
                    onClick={() => openModal('post')}/>
                  <MiniBtn label="Mark Live" icon={Zap} color={T.green}
                    onClick={() => setSessionStatus(p=>({...p,[cls.id]:'live'}))}/>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Priority Action Queue ──────────────────────────────────────────────────────
function PriorityQueue({ memberships, checkIns, now, openModal, setTab }) {
  const [activeSection, setActiveSection] = useState('urgent');

  const { urgent, followUp, opportunities } = useMemo(() => {
    const urgent = [], followUp = [], opportunities = [];

    memberships.forEach(m => {
      const rs    = calcRS(m.user_id, checkIns, now);
      const tw    = checkIns.filter(c=>c.user_id===m.user_id&&(now-new Date(c.check_in_date))<7*864e5).length;
      const r30   = rs.r30;
      const p30   = rs.p30;
      const uci   = checkIns.filter(c=>c.user_id===m.user_id);
      const total = uci.length;
      const sorted= [...uci].sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date));
      const daysAgo = sorted[0] ? Math.floor((now-new Date(sorted[0].check_in_date))/864e5) : 999;

      // URGENT
      if (rs.status==='danger')
        urgent.push({ ...m, rs, tag:'HIGH RISK', tagColor:T.red, reason: daysAgo>=999?'Never visited — reach out now':`No visit in ${daysAgo} days`, action:'Send Message', actionIcon:MessageCircle, actionFn:()=>openModal('post',{memberId:m.user_id}), score:rs.score });
      else if (tw===0 && r30>=4 && daysAgo>5)
        urgent.push({ ...m, rs, tag:'MISSING', tagColor:T.amber, reason:'Regular client — no session this week', action:'Book Now', actionIcon:Calendar, actionFn:()=>openModal('bookIntoClass',{memberId:m.user_id,memberName:m.user_name}), score:rs.score });

      // FOLLOW-UP
      else if (rs.status==='risk' && p30>3 && r30 < p30*0.6)
        followUp.push({ ...m, rs, tag:'DECLINING', tagColor:T.amber, reason:`Visits: ${r30} this mo vs ${p30} last`, action:'Assign Workout', actionIcon:Dumbbell, actionFn:()=>openModal('assignWorkout',{memberId:m.user_id,memberName:m.user_name}), score:rs.score });
      else if (tw===0 && r30>=2)
        followUp.push({ ...m, rs, tag:'QUIET', tagColor:T.t3, reason:'Active member, no check-in this week', action:'Check In', actionIcon:Send, actionFn:()=>openModal('post',{memberId:m.user_id}), score:rs.score });

      // OPPORTUNITIES
      else if (rs.status==='safe' && daysAgo>=1 && daysAgo<=3) {
        const next = [5,10,25,50,100].find(n=>n>total);
        if (next && next-total<=2)
          opportunities.push({ ...m, rs, tag:'MILESTONE', tagColor:T.purple, reason:`${next-total} visit${next-total>1?'s':''} from ${next}-visit milestone`, action:'Celebrate', actionIcon:Trophy, actionFn:()=>openModal('post',{memberId:m.user_id}), score:rs.score });
      }
    });

    urgent.sort((a,b)=>a.score-b.score);
    followUp.sort((a,b)=>a.score-b.score);
    return { urgent:urgent.slice(0,8), followUp:followUp.slice(0,8), opportunities:opportunities.slice(0,6) };
  }, [memberships, checkIns, now]);

  const tabs = [
    { key:'urgent',      label:'Urgent',      count:urgent.length,       color:urgent.length>0?T.red:T.t3 },
    { key:'followUp',    label:'Follow-up',   count:followUp.length,     color:followUp.length>0?T.amber:T.t3 },
    { key:'opportunities',label:'Wins',       count:opportunities.length,color:opportunities.length>0?T.purple:T.t3 },
  ];

  const activeItems = activeSection==='urgent' ? urgent : activeSection==='followUp' ? followUp : opportunities;

  return (
    <div className="tv2-card" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'14px 18px 0',borderBottom:`1px solid ${T.divider}`}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <Target style={{width:14,height:14,color:T.red}}/>
            <span style={{fontSize:13,fontWeight:800,color:T.t1}}>Action Queue</span>
          </div>
          <button className="tv2-btn" onClick={()=>setTab('members')} style={{
            display:'flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,
            color:T.blue,background:T.blueDim,border:`1px solid ${T.blueBrd}`,
            borderRadius:6,padding:'4px 9px',fontFamily:'inherit',
          }}>
            All clients <ArrowRight style={{width:9,height:9}}/>
          </button>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',gap:0}}>
          {tabs.map(t => (
            <button key={t.key} className="tv2-tab" onClick={()=>setActiveSection(t.key)}
              style={{
                padding:'8px 14px', border:'none', background:'transparent',
                color: activeSection===t.key ? t.color : T.t3,
                fontSize:11, fontWeight: activeSection===t.key ? 800 : 500,
                borderBottom: `2px solid ${activeSection===t.key ? t.color : 'transparent'}`,
                marginBottom:-1, display:'flex', alignItems:'center', gap:5,
                fontFamily:'inherit',
              }}>
              {t.label}
              {t.count>0 && (
                <span style={{fontSize:9,fontWeight:800,color:t.color,background:`${t.color}14`,border:`1px solid ${t.color}28`,borderRadius:99,padding:'1px 5px'}}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div style={{maxHeight:400,overflowY:'auto'}}>
        {activeItems.length===0 ? (
          <div style={{padding:'28px',textAlign:'center'}}>
            <CheckCircle style={{width:22,height:22,color:T.green,margin:'0 auto 8px',display:'block'}}/>
            <div style={{fontSize:12,fontWeight:700,color:T.t2,marginBottom:3}}>
              {activeSection==='urgent'?'No urgent actions':'Nothing here'}
            </div>
            <div style={{fontSize:10,color:T.t3}}>
              {activeSection==='urgent'?'All clients are engaging well 🎉':'Check back as patterns develop.'}
            </div>
          </div>
        ) : (
          activeItems.map((m,i) => (
            <div key={m.user_id||i} className="tv2-row" style={{
              padding:'12px 18px',
              borderBottom: i<activeItems.length-1 ? `1px solid ${T.divider}` : 'none',
              display:'flex', alignItems:'center', gap:12,
              background:'transparent',
            }}>
              {/* Avatar */}
              <Avatar name={m.user_name} size={36} color={m.rs.color}/>

              {/* Info */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:800,color:T.t1}}>{m.user_name||'Client'}</span>
                  <Pill label={m.tag} color={m.tagColor}/>
                </div>
                <div style={{fontSize:10,color:T.t3}}>{m.reason}</div>
              </div>

              {/* Retention ring */}
              <Ring score={m.rs.score} color={m.rs.color} size={38}/>

              {/* Action */}
              <MiniBtn label={m.action} icon={m.actionIcon} color={m.rs.color} onClick={m.actionFn}/>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Retention Radar ───────────────────────────────────────────────────────────
function RetentionRadar({ memberships, checkIns, now }) {
  const segments = useMemo(() => {
    let safe=0, risk=0, danger=0;
    memberships.forEach(m => {
      const rs = calcRS(m.user_id, checkIns, now);
      if (rs.status==='safe') safe++;
      else if (rs.status==='risk') risk++;
      else danger++;
    });
    const total = memberships.length || 1;
    const avg = Math.round((memberships.reduce((s,m)=>s+calcRS(m.user_id,checkIns,now).score,0))/Math.max(memberships.length,1));
    return { safe, risk, danger, total, avg, pctSafe:Math.round(safe/total*100) };
  }, [memberships, checkIns, now]);

  const avgColor = segments.avg>=65?T.green:segments.avg>=35?T.amber:T.red;

  return (
    <div className="tv2-card" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:'hidden'}}>
      <div style={{padding:'14px 18px',borderBottom:`1px solid ${T.divider}`,display:'flex',alignItems:'center',gap:8}}>
        <BarChart2 style={{width:14,height:14,color:T.blue}}/>
        <span style={{fontSize:13,fontWeight:800,color:T.t1}}>Roster Retention</span>
      </div>
      <div style={{padding:'16px 18px'}}>
        {/* Average score */}
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
          <Ring score={segments.avg} color={avgColor} size={56}/>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:T.t1}}>Avg Retention Score</div>
            <div style={{fontSize:10,color:T.t3,marginTop:2}}>{segments.pctSafe}% of clients on track</div>
            <div style={{display:'flex',gap:4,marginTop:5}}>
              {segments.avg>=65 ? <Pill label="Healthy" color={T.green}/> :
               segments.avg>=35 ? <Pill label="Needs Work" color={T.amber}/> :
               <Pill label="At Risk" color={T.red}/>}
            </div>
          </div>
        </div>

        {/* Breakdown bars */}
        {[
          {label:'Safe',    count:segments.safe,   color:T.green,  pct:Math.round(segments.safe/segments.total*100)},
          {label:'At Risk', count:segments.risk,   color:T.amber,  pct:Math.round(segments.risk/segments.total*100)},
          {label:'Danger',  count:segments.danger, color:T.red,    pct:Math.round(segments.danger/segments.total*100)},
        ].map((s,i)=>(
          <div key={i} style={{marginBottom:9}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:10,fontWeight:600,color:T.t2}}>{s.label}</span>
              <span style={{fontSize:10,color:T.t3}}>{s.count} clients · {s.pct}%</span>
            </div>
            <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${s.pct}%`,background:s.color,borderRadius:99,transition:'width 0.8s ease'}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Engagement Pulse ──────────────────────────────────────────────────────────
function EngagementPulse({ memberships, checkIns, now }) {
  const data = useMemo(() => {
    return Array.from({length:7},(_,i) => {
      const d = subDays(now, 6-i);
      d.setHours(0,0,0,0);
      const e = new Date(d); e.setHours(23,59,59,999);
      const count = checkIns.filter(c => { const dt=new Date(c.check_in_date); return dt>=d&&dt<=e; }).length;
      return { day:format(d,'EEE'), count, isToday: i===6 };
    });
  }, [memberships, checkIns, now]);

  const max = Math.max(...data.map(d=>d.count), 1);

  return (
    <div className="tv2-card" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:'hidden'}}>
      <div style={{padding:'14px 18px',borderBottom:`1px solid ${T.divider}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <Activity style={{width:14,height:14,color:T.cyan}}/>
          <span style={{fontSize:13,fontWeight:800,color:T.t1}}>7-Day Pulse</span>
        </div>
        <span style={{fontSize:10,color:T.t3}}>Check-ins per day</span>
      </div>
      <div style={{padding:'16px 18px'}}>
        <div style={{display:'flex',gap:6,alignItems:'flex-end',height:60}}>
          {data.map((d,i) => {
            const h = Math.max(4, (d.count/max)*52);
            return (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{
                  width:'100%', height:h,
                  background: d.isToday ? T.blue : d.count>0 ? `${T.blue}55` : 'rgba(255,255,255,0.05)',
                  borderRadius:4, transition:'height 0.6s ease',
                  boxShadow: d.isToday ? `0 0 8px ${T.blue}40` : 'none',
                }}/>
                <span style={{fontSize:8,color:d.isToday?T.blue:T.t4,fontWeight:d.isToday?800:400}}>{d.day}</span>
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:10,paddingTop:10,borderTop:`1px solid ${T.divider}`}}>
          <span style={{fontSize:10,color:T.t3}}>Total this week</span>
          <span style={{fontSize:12,fontWeight:800,color:T.cyan}}>{data.reduce((a,d)=>a+d.count,0)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Notable Clients ───────────────────────────────────────────────────────────
function NotableClients({ memberships, checkIns, now, openModal }) {
  const notable = useMemo(() => {
    return memberships.map(m => {
      const rs    = calcRS(m.user_id, checkIns, now);
      const uci   = checkIns.filter(c=>c.user_id===m.user_id);
      const total = uci.length;
      let badge=null, sub=null;

      // Checked in today
      if (uci.some(c=>isToday(new Date(c.check_in_date))))
        { badge='TODAY'; sub='Checked in ✓'; return {...m,rs,badge,sub,badgeColor:T.green,priority:0}; }
      // Just hit milestone
      const milestones=[5,10,25,50,100];
      const just=milestones.find(n=>total===n);
      if (just) { badge='MILESTONE'; sub=`Hit ${just} visits!`; return {...m,rs,badge,sub,badgeColor:T.purple,priority:1}; }
      // Streak active
      if (rs.r30>=8) { badge='STREAK'; sub=`${rs.r30} visits this month`; return {...m,rs,badge,sub,badgeColor:T.cyan,priority:2}; }

      return null;
    }).filter(Boolean).sort((a,b)=>a.priority-b.priority).slice(0,5);
  }, [memberships, checkIns, now]);

  if (!notable.length) return null;

  return (
    <div className="tv2-card" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:'hidden'}}>
      <div style={{padding:'14px 18px',borderBottom:`1px solid ${T.divider}`,display:'flex',alignItems:'center',gap:8}}>
        <Star style={{width:14,height:14,color:T.amber}}/>
        <span style={{fontSize:13,fontWeight:800,color:T.t1}}>Notable Today</span>
      </div>
      <div>
        {notable.map((m,i)=>(
          <div key={m.user_id||i} className="tv2-row" style={{
            padding:'11px 18px', display:'flex', alignItems:'center', gap:10,
            borderBottom: i<notable.length-1?`1px solid ${T.divider}`:'none',
            background:'transparent',
          }}>
            <Avatar name={m.user_name} size={32} color={m.badgeColor}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:800,color:T.t1}}>{m.user_name}</div>
              <div style={{fontSize:10,color:T.t3,marginTop:1}}>{m.sub}</div>
            </div>
            <Pill label={m.badge} color={m.badgeColor}/>
            <button className="tv2-btn" onClick={()=>openModal('post',{memberId:m.user_id})}
              style={{width:26,height:26,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',background:`${T.blue}10`,border:`1px solid ${T.blue}22`,color:T.blue}}>
              <MessageCircle style={{width:11,height:11}}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function TabCoachToday({ allMemberships=[], checkIns=[], myClasses=[], currentUser, openModal, setTab, now }) {
  const safeNow = now instanceof Date ? now : new Date();

  const todayCI = checkIns.filter(c => isToday(new Date(c.check_in_date))).length;

  const noShows = useMemo(() => myClasses.reduce((count, cls) => {
    const booked   = cls.bookings?.filter(b=>b.status==='booked').length || 0;
    const attended = checkIns.filter(c=>isToday(new Date(c.check_in_date))).length;
    return count + Math.max(0, booked - attended);
  }, 0), [myClasses, checkIns]);

  const attentionCount = useMemo(() =>
    allMemberships.filter(m => {
      const tw  = checkIns.filter(c=>c.user_id===m.user_id&&(safeNow-new Date(c.check_in_date))<7*864e5).length;
      const l30 = checkIns.filter(c=>c.user_id===m.user_id&&(safeNow-new Date(c.check_in_date))<30*864e5).length;
      return tw===0 && l30>=2;
    }).length,
  [allMemberships, checkIns, safeNow]);

  const { atRiskCount, healthPct, hc } = useMemo(() => {
    let danger=0, risk=0;
    allMemberships.forEach(m => {
      const rs = calcRS(m.user_id, checkIns, safeNow);
      if (rs.status==='danger') danger++;
      else if (rs.status==='risk') risk++;
    });
    const atRiskCount = danger + risk;
    const healthPct = allMemberships.length > 0
      ? Math.round(100 - (danger/allMemberships.length)*55 - (noShows>0?12:0) - (attentionCount/Math.max(allMemberships.length,1))*20)
      : 85;
    const hc = healthPct>=70?T.green:healthPct>=45?T.amber:T.red;
    return { atRiskCount, healthPct, hc };
  }, [allMemberships, checkIns, safeNow, noShows, attentionCount]);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'}}>

      {/* Header */}
      <PageHeader currentUser={currentUser} date={safeNow}/>

      {/* KPI Strip */}
      <KpiStrip
        todayCI={todayCI}
        atRiskCount={atRiskCount}
        attentionCount={attentionCount}
        noShows={noShows}
        totalMembers={allMemberships.length}
        healthPct={healthPct}
        hc={hc}
      />

      {/* Main grid */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16,alignItems:'start'}}>

        {/* Left column */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <ScheduleTimeline classes={myClasses} checkIns={checkIns} openModal={openModal}/>
          <PriorityQueue memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal} setTab={setTab}/>
        </div>

        {/* Right sidebar */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <RetentionRadar memberships={allMemberships} checkIns={checkIns} now={safeNow}/>
          <EngagementPulse memberships={allMemberships} checkIns={checkIns} now={safeNow}/>
          <NotableClients memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal}/>
        </div>
      </div>
    </div>
  );
}