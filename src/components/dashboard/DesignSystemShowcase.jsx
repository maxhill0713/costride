import { useState, useMemo, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════════
   DESIGN SYSTEM TOKENS
══════════════════════════════════════════════════════════════════ */
const DS = {
  bg:            '#06090f',
  surface:       '#0b1018',
  surfaceRaised: '#0f1520',
  surfaceOverlay:'#131a28',
  border:        'rgba(255,255,255,0.06)',
  borderMid:     'rgba(255,255,255,0.10)',
  borderHi:      'rgba(255,255,255,0.16)',
  divider:       'rgba(255,255,255,0.04)',
  t0: '#f8fafc', t1: '#e2e8f0', t2: '#94a3b8',
  t3: '#64748b', t4: '#334155',
  accent:    '#3b82f6',
  accentDim: 'rgba(59,130,246,0.10)',
  accentMid: 'rgba(59,130,246,0.18)',
  accentBrd: 'rgba(59,130,246,0.28)',
  danger:    '#ef4444',
  dangerDim: 'rgba(239,68,68,0.08)',
  dangerBrd: 'rgba(239,68,68,0.24)',
  success:   '#10b981',
  successDim:'rgba(16,185,129,0.08)',
  successBrd:'rgba(16,185,129,0.24)',
  warn:      '#f59e0b',
  warnDim:   'rgba(245,158,11,0.08)',
  warnBrd:   'rgba(245,158,11,0.24)',
  community:    '#818cf8',
  communityDim: 'rgba(129,140,248,0.10)',
  communityBrd: 'rgba(129,140,248,0.24)',
  r1:6,r2:8,r3:12,r4:16,
  shadowCard:   '0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)',
  shadowRaised: '0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
  shadowOverlay:'0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
  shadowInset:  'inset 0 1px 0 rgba(255,255,255,0.03)',
  fontSans: "'Satoshi',system-ui,sans-serif",
  fontMono: "'JetBrains Mono','SF Mono',monospace",
};

/* ── Icons (inline SVG for zero deps) ─────────────────────────── */
const icons = {
  activity: (s=14,c=DS.t3) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  users: (s=14,c=DS.t3) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  zap: (s=14,c=DS.t3) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  trending: (s=14,c=DS.t3) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendDown: (s=10,c=DS.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  arrowUp: (s=10,c=DS.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
  check: (s=12,c=DS.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  alert: (s=12,c=DS.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  chevron: (s=10,c=DS.t3) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  trophy: (s=14,c=DS.warn) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  heart: (s=12,c=DS.danger) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  msg: (s=12,c=DS.success) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  sparkle: (s=14,c=DS.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
  clock: (s=10,c=DS.t4) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  flame: (s=9,c=DS.warn) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
};

/* ── Sparkline ────────────────────────────────────────────────── */
function Spark({data=[],w=68,h=28,color=DS.accent}){
  if(data.length<2) return <div style={{width:w,height:h}}/>;
  const mx=Math.max(...data,1),mn=Math.min(...data,0),rng=mx-mn||1;
  const pts=data.map((v,i)=>{
    const x=(i/(data.length-1))*w, y=h-((v-mn)/rng)*(h-6)-3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const f=pts.split(' ')[0], l=pts.split(' ').slice(-1)[0];
  const area=`${f.split(',')[0]},${h} ${pts} ${l.split(',')[0]},${h}`;
  const id=`sp-${color.replace('#','')}`;
  return(
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block',flexShrink:0}}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={area} fill={`url(#${id})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Ring Chart ────────────────────────────────────────────────── */
function RingChart({pct,size=44,stroke=3.5,color=DS.accent}){
  const r=(size-stroke*2)/2, circ=2*Math.PI*r, dash=(pct/100)*circ;
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={DS.divider} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round" style={{transition:'stroke-dasharray .8s ease'}}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" style={{fontSize:size*.24,fontWeight:700,fill:DS.t1,fontFamily:DS.fontMono}}>{pct}%</text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
══════════════════════════════════════════════════════════════════ */
function Card({children,padding,accent,onClick,style={}}){
  const[hov,setHov]=useState(false);
  return(
    <div onClick={onClick}
      onMouseEnter={()=>onClick&&setHov(true)} onMouseLeave={()=>onClick&&setHov(false)}
      style={{background:DS.surface,border:`1px solid ${hov?DS.borderMid:DS.border}`,borderRadius:DS.r4,boxShadow:`${DS.shadowInset}, ${hov?DS.shadowRaised:DS.shadowCard}`,overflow:'hidden',position:'relative',cursor:onClick?'pointer':'default',transition:'all .15s',padding:padding??undefined,...style}}>
      {accent&&<div style={{position:'absolute',top:0,left:0,right:0,height:1.5,background:`linear-gradient(90deg,${accent}50 0%,${accent}14 60%,transparent)`,pointerEvents:'none'}}/>}
      {children}
    </div>
  );
}

function Badge({label,color,variant='filled'}){
  return(
    <span style={{display:'inline-flex',alignItems:'center',fontSize:9.5,fontWeight:700,padding:'2px 7px',borderRadius:5,color,background:variant==='filled'?`${color}10`:'transparent',border:`1px solid ${color}22`,whiteSpace:'nowrap',fontFamily:DS.fontSans,letterSpacing:'.02em'}}>
      {label}
    </span>
  );
}

function StatNudge({color=DS.accent,icon,stat,detail,action}){
  return(
    <div style={{marginTop:12,display:'flex',alignItems:'flex-start',gap:9,padding:'9px 12px',borderRadius:DS.r2,background:DS.surfaceRaised,border:`1px solid ${DS.border}`,borderLeft:`2px solid ${color}`}}>
      {icon}
      <div style={{flex:1,minWidth:0}}>
        <span style={{fontSize:11,fontWeight:700,color:DS.t1}}>{stat} </span>
        <span style={{fontSize:11,fontWeight:500,color:DS.t3,lineHeight:1.5}}>{detail}</span>
      </div>
      {action&&<span style={{flexShrink:0,fontSize:10,fontWeight:700,color,display:'flex',alignItems:'center',gap:2}}>{action} {icons.chevron(9,color)}</span>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   KPI CARD
══════════════════════════════════════════════════════════════════ */
function KpiCard({label,value,suffix,sub,trend,sparkData,ringPct,ringColor,icon,valueColor}){
  const trendColor=trend==='up'?DS.success:trend==='down'?DS.danger:DS.t3;
  const TrendIcon=trend==='up'?()=>icons.arrowUp(10,DS.success):trend==='down'?()=>icons.trendDown(10,DS.danger):()=>null;
  return(
    <Card padding="16px 18px">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <span style={{fontSize:10,fontWeight:700,color:DS.t3,letterSpacing:'.08em',textTransform:'uppercase'}}>{label}</span>
        {icon}
      </div>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:10}}>
        <div>
          <div style={{display:'flex',alignItems:'baseline',gap:4}}>
            <span style={{fontSize:30,fontWeight:800,color:valueColor||DS.t0,lineHeight:1,letterSpacing:'-.04em',fontVariantNumeric:'tabular-nums'}}>{value}</span>
            {suffix&&<span style={{fontSize:12,fontWeight:500,color:DS.t3}}>{suffix}</span>}
          </div>
          {sub&&(
            <div style={{display:'flex',alignItems:'center',gap:4,marginTop:6}}>
              <TrendIcon/>
              <span style={{fontSize:11,fontWeight:600,color:trendColor,lineHeight:1.3}}>{sub}</span>
            </div>
          )}
        </div>
        {ringPct!=null&&ringPct>5&&ringPct<98
          ?<RingChart pct={ringPct} color={ringColor||DS.accent}/>
          :sparkData&&sparkData.some(v=>v>0)?<Spark data={sparkData}/>:null}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIGNAL ROW
══════════════════════════════════════════════════════════════════ */
function Signal({color,icon,title,detail,action,last}){
  const[hov,setHov]=useState(false);
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{padding:'10px 12px',borderRadius:DS.r2,background:hov?DS.surfaceRaised:DS.surface,border:`1px solid ${DS.border}`,borderLeft:`3px solid ${color}`,marginBottom:last?0:6,cursor:'pointer',transition:'all .15s',boxShadow:DS.shadowCard}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
        {icon}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,color:DS.t1,lineHeight:1.3,marginBottom:2}}>{title}</div>
          <div style={{fontSize:11,fontWeight:500,color:DS.t3,lineHeight:1.45}}>{detail}</div>
        </div>
        {action&&<span style={{fontSize:10,fontWeight:700,color,flexShrink:0,display:'flex',alignItems:'center',gap:2,marginTop:1}}>{action} {icons.chevron(9,color)}</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CHECK-IN CHART
══════════════════════════════════════════════════════════════════ */
function CheckInChart({data,range,setRange}){
  const max=Math.max(...data.map(d=>d.v),1);
  const avg=(data.reduce((a,d)=>a+d.v,0)/data.length).toFixed(1);
  const todayLabel=data[data.length-1]?.d;
  return(
    <Card padding="20px 20px 16px">
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:18}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:DS.t3,letterSpacing:'.08em',textTransform:'uppercase'}}>CHECK-IN ACTIVITY</div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginTop:4}}>
            <span style={{fontSize:11,color:DS.t3}}>Daily avg <span style={{fontWeight:700,color:DS.t2,fontFamily:DS.fontMono}}>{avg}</span></span>
            <div style={{width:3,height:3,borderRadius:'50%',background:DS.t4}}/>
            <span style={{fontSize:11,color:DS.t3}}>Today <span style={{fontWeight:700,color:DS.accent,fontFamily:DS.fontMono}}>{data[data.length-1]?.v||0}</span></span>
          </div>
        </div>
        <div style={{display:'flex',gap:2,padding:2,background:DS.surfaceRaised,borderRadius:DS.r2,border:`1px solid ${DS.border}`}}>
          {[{l:'7D',v:7},{l:'30D',v:30}].map(o=>(
            <button key={o.v} onClick={()=>setRange(o.v)} style={{fontSize:10,fontWeight:range===o.v?700:500,padding:'4px 12px',borderRadius:DS.r1,cursor:'pointer',fontFamily:DS.fontSans,transition:'all .14s',background:range===o.v?DS.accentDim:'transparent',color:range===o.v?DS.accent:DS.t3,border:`1px solid ${range===o.v?DS.accentBrd:'transparent'}`}}>{o.l}</button>
          ))}
        </div>
      </div>
      <div style={{display:'flex',alignItems:'flex-end',gap:range<=7?6:2,height:120,marginBottom:6,position:'relative'}}>
        {parseFloat(avg)>0&&<div style={{position:'absolute',left:0,right:0,bottom:`${(parseFloat(avg)/max)*100}%`,height:1,borderTop:`1px dashed ${DS.t4}`,zIndex:1}}/>}
        {data.map((d,i)=>{
          const isToday=d.d===todayLabel;
          const h=max>0?(d.v/max)*100:0;
          return(
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div style={{width:'100%',maxWidth:range<=7?22:10,height:`${Math.max(h,2)}%`,minHeight:2,borderRadius:'3px 3px 0 0',background:DS.accent,opacity:isToday?0.9:0.25,transition:'height .3s ease'}}/>
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',gap:range<=7?6:2}}>
        {data.map((d,i)=>(
          <div key={i} style={{flex:1,textAlign:'center',fontSize:9,fontWeight:600,color:DS.t4,fontFamily:DS.fontMono}}>{d.d}</div>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:14,marginTop:10,paddingTop:10,borderTop:`1px solid ${DS.divider}`}}>
        {[{op:.9,l:'Today'},{op:.25,l:'Past'}].map((l,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:10,height:10,borderRadius:2,background:DS.accent,opacity:l.op}}/>
            <span style={{fontSize:10,color:DS.t4}}>{l.l}</span>
          </div>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <div style={{width:14,height:0,borderTop:`1.5px dashed ${DS.t4}`}}/>
          <span style={{fontSize:10,color:DS.t4}}>Avg</span>
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MEMBER GROWTH CARD
══════════════════════════════════════════════════════════════════ */
function GrowthCard({newSignUps=8,cancelled=2,retention=78}){
  const net=newSignUps-cancelled;
  const data=[{m:'Oct',v:4},{m:'Nov',v:6},{m:'Dec',v:5},{m:'Jan',v:7},{m:'Feb',v:newSignUps}];
  const max=Math.max(...data.map(d=>d.v),1);
  return(
    <Card padding="20px">
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:DS.t3,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:4}}>MEMBER GROWTH</div>
          <div style={{display:'flex',alignItems:'baseline',gap:6}}>
            <span style={{fontSize:26,fontWeight:800,color:DS.t0,letterSpacing:'-.04em',fontVariantNumeric:'tabular-nums'}}>+{newSignUps}</span>
            <span style={{fontSize:12,color:DS.t3}}>this month</span>
          </div>
        </div>
        <div style={{display:'flex',gap:6}}>
          <Badge label={`${retention}% retained`} color={retention>=70?DS.success:DS.danger}/>
          {cancelled>0&&<Badge label={`${cancelled} left`} color={DS.danger}/>}
        </div>
      </div>
      <div style={{display:'flex',alignItems:'flex-end',gap:8,height:64,marginBottom:4}}>
        {data.map((d,i)=>(
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <div style={{width:'100%',maxWidth:20,height:`${(d.v/max)*100}%`,minHeight:3,borderRadius:'3px 3px 0 0',background:DS.accent,opacity:.7,transition:'height .3s ease'}}/>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {data.map((d,i)=><div key={i} style={{flex:1,textAlign:'center',fontSize:9,fontWeight:600,color:DS.t4}}>{d.m}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',paddingTop:12,borderTop:`1px solid ${DS.divider}`}}>
        {[{l:'New',v:newSignUps,c:DS.t1},{l:'Cancelled',v:cancelled,c:cancelled>0?DS.danger:DS.t4},{l:'Net',v:`${net>=0?'+':''}${net}`,c:net<0?DS.danger:DS.t1}].map((s,i)=>(
          <div key={i} style={{textAlign:'center',padding:'0 8px',borderRight:i<2?`1px solid ${DS.divider}`:'none'}}>
            <div style={{fontSize:18,fontWeight:800,color:s.c,letterSpacing:'-.03em',fontVariantNumeric:'tabular-nums'}}>{s.v}</div>
            <div style={{fontSize:9,fontWeight:700,color:DS.t4,marginTop:3,textTransform:'uppercase',letterSpacing:'.05em'}}>{s.l}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ENGAGEMENT SPLIT
══════════════════════════════════════════════════════════════════ */
function EngagementSplit(){
  const rows=[
    {l:'Super active',s:'12+ visits/mo',v:12,dot:DS.success},
    {l:'Active',s:'4–11 visits',v:28,dot:DS.t2},
    {l:'Occasional',s:'1–3 visits',v:15,dot:DS.t3},
    {l:'At risk',s:'14+ days away',v:3,dot:DS.danger},
  ];
  const total=rows.reduce((a,r)=>a+r.v,0);
  return(
    <Card padding="20px">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <span style={{fontSize:10,fontWeight:700,color:DS.t3,letterSpacing:'.08em',textTransform:'uppercase'}}>ENGAGEMENT SPLIT</span>
        <span style={{fontSize:11,fontWeight:600,color:DS.t3,display:'flex',alignItems:'center',gap:3,cursor:'pointer'}}>Members {icons.chevron(10,DS.t3)}</span>
      </div>
      {rows.map((r,i)=>{
        const pct=total>0?Math.round((r.v/total)*100):0;
        return(
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<rows.length-1?`1px solid ${DS.divider}`:'none'}}>
            <div style={{width:5,height:5,borderRadius:'50%',background:r.v>0?r.dot:DS.t4,flexShrink:0}}/>
            <span style={{fontSize:12,fontWeight:600,color:r.v>0?DS.t1:DS.t3,flex:1}}>{r.l}</span>
            <span style={{fontSize:11,color:DS.t3,marginRight:8}}>{r.s}</span>
            <span style={{fontSize:13,fontWeight:800,color:r.v>0?r.dot:DS.t4,minWidth:20,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{r.v}</span>
            <span style={{fontSize:10,color:DS.t4,minWidth:28,textAlign:'right',fontFamily:DS.fontMono}}>{pct}%</span>
          </div>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ACTION ITEMS PANEL
══════════════════════════════════════════════════════════════════ */
function ActionItems(){
  const signals=[
    {p:1,color:DS.danger,icon:icons.users(12,DS.danger),title:"3 new members haven't returned",detail:'Joined 1–2 weeks ago, no second visit. Week-1 follow-up has highest retention impact.',action:'Follow up'},
    {p:2,color:DS.warn,icon:icons.alert(12,DS.warn),title:'2 members inactive 14+ days',detail:'3% of your gym. Direct outreach is the most effective re-engagement method.',action:'View & message'},
    {p:3,color:DS.warn,icon:icons.trophy(12,DS.warn),title:'No active challenge',detail:'Members with an active goal tend to visit more consistently.',action:'Create one'},
  ];
  return(
    <Card padding="20px">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
        <span style={{fontSize:10,fontWeight:700,color:DS.t3,letterSpacing:'.08em',textTransform:'uppercase'}}>ACTION ITEMS</span>
        <Badge label={`${signals.length} pending`} color={DS.danger}/>
      </div>
      <div style={{fontSize:11,color:DS.t4,marginBottom:14}}>Sorted by urgency</div>
      <div style={{display:'flex',flexDirection:'column'}}>
        {signals.map((s,i)=>(
          <Signal key={i} color={s.color} icon={s.icon} title={s.title} detail={s.detail} action={s.action} last={i===signals.length-1}/>
        ))}
      </div>
      <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${DS.divider}`}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {icons.check(10,DS.success)}
          <span style={{fontSize:11,fontWeight:600,color:DS.success}}>Active challenge running</span>
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   QUICK ACTIONS GRID
══════════════════════════════════════════════════════════════════ */
function QuickActionBtn({l,icon}){
  const[hov,setHov]=useState(false);
  return(
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:DS.r2,background:hov?DS.surfaceRaised:'rgba(255,255,255,0.02)',border:`1px solid ${hov?DS.borderMid:DS.border}`,cursor:'pointer',transition:'all .14s',fontFamily:DS.fontSans}}>
      {icon}
      <span style={{fontSize:11,fontWeight:700,color:hov?DS.t1:DS.t2,transition:'color .14s'}}>{l}</span>
    </button>
  );
}

function QuickActions(){
  const actions=[
    {l:'Add Member',icon:icons.users(13,DS.success)},
    {l:'Scan Check-in',icon:icons.activity(13,DS.accent)},
    {l:'New Challenge',icon:icons.trophy(13,DS.warn)},
    {l:'Post Update',icon:icons.msg(13,DS.accent)},
  ];
  return(
    <Card padding="20px">
      <div style={{fontSize:10,fontWeight:700,color:DS.t3,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:14}}>QUICK ACTIONS</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
        {actions.map((a,i)=>(
          <QuickActionBtn key={i} {...a}/>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RETENTION BREAKDOWN
══════════════════════════════════════════════════════════════════ */
function RetentionBreakdown(){
  const rows=[
    {l:'New — went quiet',s:'Joined < 2 wks',v:3,c:DS.danger},
    {l:'Early drop-off',s:'Weeks 2–4',v:1,c:DS.warn},
    {l:'Month 2–3 slip',s:'Common churn window',v:2,c:DS.warn},
    {l:'Long inactive',s:'21+ days absent',v:1,c:DS.t3},
  ];
  return(
    <Card padding="20px">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:DS.t3,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:2}}>DROP-OFF RISK</div>
          <div style={{fontSize:11,color:DS.t4}}>Where members go quiet</div>
        </div>
      </div>
      {rows.map((r,i)=>(
        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<rows.length-1?`1px solid ${DS.divider}`:'none'}}>
          <div>
            <span style={{fontSize:12,fontWeight:600,color:r.v>0?DS.t1:DS.t3}}>{r.l}</span>
            <span style={{fontSize:10,color:DS.t4,marginLeft:7}}>{r.s}</span>
          </div>
          <span style={{fontSize:13,fontWeight:800,color:r.v>0?r.c:DS.t4,fontVariantNumeric:'tabular-nums'}}>{r.v}</span>
        </div>
      ))}
      {rows[0].v>0&&(
        <StatNudge color={DS.danger} icon={icons.alert(11,DS.danger)}
          stat={`${rows[0].v} new members went quiet.`}
          detail="Week 1 is critical — members who don't return are far less likely to become regulars."
          action="Follow up"/>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COMMUNITY FEED CARD
══════════════════════════════════════════════════════════════════ */
function FeedCard({author,time,title,body,likes,comments,img,isTop}){
  const[liked,setLiked]=useState(false);
  return(
    <Card accent={isTop?DS.success:null}>
      {isTop&&<div style={{position:'absolute',top:10,left:10,zIndex:2}}><Badge label="Top post" color={DS.success}/></div>}
      <div style={{padding:'12px 14px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:`${DS.community}18`,border:`1px solid ${DS.communityBrd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:DS.community}}>{author[0]}</div>
          <span style={{flex:1,fontSize:12,fontWeight:700,color:DS.t2}}>{author}</span>
          <span style={{fontSize:10,color:DS.t4}}>{time}</span>
        </div>
      </div>
      <div style={{padding:'10px 14px 12px'}}>
        <p style={{fontSize:14,fontWeight:800,color:DS.t0,margin:0,lineHeight:1.4}}>{title}</p>
        {body&&<p style={{fontSize:12,fontWeight:500,color:DS.t2,margin:'5px 0 0',lineHeight:1.5}}>{body}</p>}
      </div>
      {img&&(
        <div style={{overflow:'hidden',margin:'0 14px 12px',borderRadius:DS.r2,height:100,background:DS.surfaceRaised,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{fontSize:40,opacity:.3}}>📸</div>
        </div>
      )}
      <div style={{padding:'8px 14px 12px',display:'flex',alignItems:'center',gap:10,borderTop:`1px solid ${DS.divider}`}}>
        <button onClick={()=>setLiked(!liked)} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700,color:liked?DS.danger:DS.t3,background:'none',border:'none',cursor:'pointer',fontFamily:DS.fontSans,padding:0,transition:'color .15s'}}>
          {icons.heart(11,liked?DS.danger:DS.t3)} {likes+(liked?1:0)}
        </button>
        <span style={{display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700,color:comments>0?DS.success:DS.t3}}>
          {icons.msg(11,comments>0?DS.success:DS.t3)} {comments}
        </span>
        {(likes+comments)>5&&(
          <span style={{marginLeft:'auto',fontSize:10,fontWeight:700,color:DS.success,background:DS.surfaceRaised,border:`1px solid ${DS.borderMid}`,borderRadius:5,padding:'2px 6px'}}>
            {Math.round(((likes+comments)/58)*100)}% engaged
          </span>
        )}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CHALLENGE CARD
══════════════════════════════════════════════════════════════════ */
function ChallengeCard({title,participants,daysLeft,pct}){
  return(
    <Card accent={DS.accent}>
      <div style={{padding:'12px 14px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
          <div style={{width:26,height:26,borderRadius:7,background:DS.surfaceRaised,border:`1px solid ${DS.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}>{icons.trophy(12,DS.warn)}</div>
          <Badge label="Challenge" color={DS.accent}/>
          <Badge label={`${daysLeft}d left`} color={daysLeft<=3?DS.danger:DS.t3}/>
        </div>
        <p style={{fontSize:13,fontWeight:800,color:DS.t0,margin:'0 0 10px',lineHeight:1.3}}>{title}</p>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
          <span style={{fontSize:11,color:DS.t3}}>{participants} joined</span>
          <span style={{fontSize:11,fontWeight:800,color:pct>=75?DS.warn:DS.accent,fontVariantNumeric:'tabular-nums'}}>{pct}% complete</span>
        </div>
        <div style={{height:3,borderRadius:99,background:DS.divider,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,borderRadius:99,background:pct>=75?DS.warn:DS.accent,transition:'width .8s ease'}}/>
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CONTENT SUGGESTIONS
══════════════════════════════════════════════════════════════════ */
function ContentSuggestionItem({c,icon,l,a}){
  const[hov,setHov]=useState(false);
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:DS.r2,background:hov?'rgba(255,255,255,0.03)':DS.surfaceRaised,border:`1px solid ${DS.border}`,borderLeft:`3px solid ${c}`,cursor:'pointer',transition:'all .15s'}}>
      {icon}
      <span style={{flex:1,fontSize:11,fontWeight:600,color:DS.t2,lineHeight:1.4}}>{l}</span>
      <span style={{fontSize:10,fontWeight:700,color:c,flexShrink:0,display:'flex',alignItems:'center',gap:2}}>{a} {icons.chevron(9,c)}</span>
    </div>
  );
}

function ContentSuggestions(){
  const items=[
    {c:DS.accent,icon:icons.msg(12,DS.accent),l:'No post in 3 days — engagement drops after 48h',a:'Post now'},
    {c:DS.warn,icon:icons.trophy(12,DS.warn),l:'No active challenge — challenges drive consistent attendance',a:'Start one'},
    {c:DS.success,icon:icons.activity(12,DS.success),l:'Best engagement day: Thursday — post before 6pm',a:'Schedule'},
  ];
  return(
    <Card padding="18px">
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
        {icons.sparkle(14,DS.accent)}
        <span style={{fontSize:10,fontWeight:700,color:DS.t3,letterSpacing:'.08em',textTransform:'uppercase'}}>CONTENT SUGGESTIONS</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {items.map((s,i)=>(
          <ContentSuggestionItem key={i} {...s}/>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ENGAGEMENT TREND
══════════════════════════════════════════════════════════════════ */
function EngagementTrend(){
  return(
    <Card padding="18px">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
        <span style={{fontSize:10,fontWeight:700,color:DS.t3,letterSpacing:'.08em',textTransform:'uppercase'}}>ENGAGEMENT TREND</span>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          {icons.arrowUp(11,DS.success)}
          <span style={{fontSize:13,fontWeight:800,color:DS.success,fontVariantNumeric:'tabular-nums'}}>+24%</span>
        </div>
      </div>
      <div style={{fontSize:11,color:DS.t4,marginBottom:14}}>Week over week</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {[{l:'This week',v:47,c:DS.success},{l:'Last week',v:38,c:DS.t3}].map((s,i)=>(
          <div key={i} style={{padding:'10px 12px',borderRadius:DS.r2,background:DS.surfaceRaised,border:`1px solid ${DS.border}`,textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:800,color:s.c,fontVariantNumeric:'tabular-nums'}}>{s.v}</div>
            <div style={{fontSize:9,fontWeight:700,color:DS.t4,marginTop:3,textTransform:'uppercase',letterSpacing:'.05em'}}>{s.l}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ACTIVITY FEED
══════════════════════════════════════════════════════════════════ */
function ActivityFeed(){
  const items=[
    {name:'Sarah M.',action:'checked in',time:'12m ago'},
    {name:'James R.',action:'joined a challenge',time:'1h ago'},
    {name:'Maria L.',action:'completed 50th visit',time:'2h ago'},
    {name:'Tom K.',action:'posted in community',time:'3h ago'},
  ];
  return(
    <Card padding="20px">
      <div style={{fontSize:10,fontWeight:700,color:DS.t3,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:16}}>RECENT ACTIVITY</div>
      {items.map((a,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<items.length-1?`1px solid ${DS.divider}`:'none'}}>
          <div style={{width:26,height:26,borderRadius:8,background:DS.surfaceRaised,border:`1px solid ${DS.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:DS.t2,flexShrink:0}}>{a.name[0]}</div>
          <div style={{flex:1,minWidth:0}}>
            <span style={{fontSize:12,color:DS.t1,lineHeight:1.4}}>
              <span style={{fontWeight:700}}>{a.name}</span>
              <span style={{fontWeight:500,color:DS.t2}}> {a.action}</span>
            </span>
          </div>
          <span style={{fontSize:10,color:DS.t4,flexShrink:0,fontFamily:DS.fontMono}}>{a.time}</span>
        </div>
      ))}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN SHOWCASE — Tab navigation + pages
══════════════════════════════════════════════════════════════════ */
export default function DesignSystemShowcase(){
  const[tab,setTab]=useState('overview');
  const[chartRange,setChartRange]=useState(7);
  const sparkData=[3,5,8,4,7,12,9];
  const chartData=useMemo(()=>{
    if(chartRange<=7) return['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i)=>({d,v:[3,5,8,4,7,12,9][i]}));
    return Array.from({length:30},(_,i)=>({d:String(i+1),v:Math.floor(Math.random()*12)+1}));
  },[chartRange]);

  const TABS=[
    {id:'overview',label:'Overview',mode:'professional'},
    {id:'analytics',label:'Analytics',mode:'professional'},
    {id:'members',label:'Members',mode:'professional'},
    {id:'content',label:'Content',mode:'community'},
    {id:'engagement',label:'Engagement',mode:'professional'},
    {id:'gym',label:'Gym Settings',mode:'professional'},
  ];

  const activeTab=TABS.find(t=>t.id===tab);
  const isCommunity=activeTab?.mode==='community';

  return(
    <div style={{background:DS.bg,minHeight:'100vh',fontFamily:DS.fontSans,WebkitFontSmoothing:'antialiased',color:DS.t1}}>

      {/* ── Top nav ─────────────────────────────────────────────── */}
      <div style={{borderBottom:`1px solid ${DS.border}`,background:DS.surface,position:'sticky',top:0,zIndex:100,backdropFilter:'blur(16px)'}}>
        <div style={{maxWidth:1320,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',gap:32,height:52}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            <div style={{width:24,height:24,borderRadius:6,background:`linear-gradient(135deg,${DS.accent},${DS.community})`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {icons.zap(12,'#fff')}
            </div>
            <span style={{fontSize:15,fontWeight:900,color:DS.t0,letterSpacing:'-.03em'}}>CoStride</span>
            <Badge label="Pro" color={DS.accent} variant="filled"/>
          </div>

          <div style={{display:'flex',gap:2,flex:1}}>
            {TABS.map(t=>{
              const active=tab===t.id;
              const isCom=t.mode==='community';
              return(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'14px 16px',fontSize:12,fontWeight:active?700:500,color:active?(isCom?DS.community:DS.t0):DS.t3,background:'none',border:'none',borderBottom:`2px solid ${active?(isCom?DS.community:DS.accent):'transparent'}`,cursor:'pointer',fontFamily:DS.fontSans,transition:'all .15s',marginBottom:-1,whiteSpace:'nowrap'}}>
                  {t.label}
                  {isCom&&<span style={{display:'inline-block',width:4,height:4,borderRadius:'50%',background:DS.community,marginLeft:5,verticalAlign:'middle',opacity:active?1:.4}}/>}
                </button>
              );
            })}
          </div>

          <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
            <div style={{width:4,height:4,borderRadius:'50%',background:DS.success}}/>
            <span style={{fontSize:10,color:DS.t4,fontFamily:DS.fontMono}}>Live</span>
          </div>
        </div>
      </div>

      {/* ── Page content ─────────────────────────────────────────── */}
      <div style={{maxWidth:1320,margin:'0 auto',padding:'24px 24px 64px'}}>

        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:isCommunity?DS.community:DS.accent}}/>
          <span style={{fontSize:10,fontWeight:700,color:DS.t4,letterSpacing:'.1em',textTransform:'uppercase'}}>
            {isCommunity?'Community Mode':'Professional Mode'}
          </span>
          <div style={{flex:1,height:1,background:DS.divider}}/>
          <span style={{fontSize:10,color:DS.t4,fontFamily:DS.fontMono}}>{icons.clock(9,DS.t4)} Updated just now</span>
        </div>

        {/* ═══ OVERVIEW PAGE ═══ */}
        {tab==='overview'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 292px',gap:20,alignItems:'start'}}>
            <div style={{display:'flex',flexDirection:'column',gap:20}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                <KpiCard label="Today's Check-ins" value="12" sub="↑ 33% vs yesterday" trend="up" sparkData={sparkData} icon={icons.activity(13,DS.t4)}/>
                <KpiCard label="Active Members" value="45" suffix="/ 58" sub="78% retention" trend="up" ringPct={78} ringColor={DS.success} icon={icons.users(13,DS.t4)}/>
                <KpiCard label="In Gym Now" value="4" sub="Members in last 2h" trend="up" sparkData={sparkData} icon={icons.users(13,DS.t4)}/>
                <KpiCard label="At-Risk Members" value="3" sub="5% of gym inactive" trend="down" valueColor={DS.danger} sparkData={sparkData} icon={icons.zap(13,DS.t4)}/>
              </div>
              <CheckInChart data={chartData} range={chartRange} setRange={setChartRange}/>
              <GrowthCard/>
              <EngagementSplit/>
              <ActivityFeed/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <ActionItems/>
              <QuickActions/>
              <RetentionBreakdown/>
            </div>
          </div>
        )}

        {/* ═══ CONTENT PAGE (Community Mode) ═══ */}
        {tab==='content'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:20,alignItems:'start'}}>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{display:'flex',gap:10}}>
                <button style={{display:'flex',alignItems:'center',gap:10,padding:'14px 22px',borderRadius:DS.r4,background:DS.community,color:'#fff',border:'none',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:DS.fontSans,boxShadow:`0 0 0 1px ${DS.communityBrd}, 0 4px 14px rgba(129,140,248,0.2)`,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(255,255,255,0.12),transparent)',pointerEvents:'none'}}/>
                  <div style={{width:28,height:28,borderRadius:8,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}>+</div>
                  <div><div>New Post</div><div style={{fontSize:11,fontWeight:500,opacity:.7,marginTop:1}}>Share with members</div></div>
                </button>
                <div style={{flex:1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {[{l:'New Challenge',s:'0 active'},{l:'New Event',s:'2 upcoming'},{l:'New Poll',s:'1 active'}].map((a,i)=>(
                    <Card key={i} padding="10px 12px" onClick={()=>{}}>
                      <div style={{fontSize:11,fontWeight:700,color:DS.t1}}>{a.l}</div>
                      <div style={{fontSize:9,color:DS.t4,fontWeight:500,marginTop:4}}>{a.s}</div>
                    </Card>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <FeedCard author="Iron Fitness" time="2h ago" title="New PR challenge starts Monday!" body="Beat your personal record in any compound lift. Prizes for the top 3." likes={12} comments={5} isTop/>
                <ChallengeCard title="February Consistency Challenge" participants={14} daysLeft={8} pct={65}/>
                <FeedCard author="Coach Mike" time="1d ago" title="Morning yoga is back on Wednesdays" body="6:30am start. Bring your own mat. Open to all levels." likes={8} comments={3}/>
                <FeedCard author="Iron Fitness" time="3d ago" title="Weekend warrior results 💪" likes={6} comments={2} img/>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <ContentSuggestions/>
              <EngagementTrend/>
              <Card padding="18px">
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  {icons.clock(10,DS.accent)}
                  <span style={{fontSize:10,fontWeight:700,color:DS.t3,letterSpacing:'.08em',textTransform:'uppercase'}}>BEST TIME TO POST</span>
                </div>
                <div style={{padding:'9px 11px',borderRadius:DS.r2,marginBottom:8,background:DS.surfaceRaised,border:`1px solid ${DS.border}`,borderLeft:`3px solid ${DS.success}`,display:'flex',alignItems:'center',gap:9}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:DS.success}}/>
                  <span style={{fontSize:11,fontWeight:600,color:DS.t2,lineHeight:1.4}}><span style={{fontWeight:700,color:DS.t1}}>Thursday</span> is your best engagement day</span>
                </div>
                <div style={{padding:'9px 11px',borderRadius:DS.r2,background:DS.surfaceRaised,border:`1px solid ${DS.border}`}}>
                  <span style={{fontSize:11,color:DS.t3,lineHeight:1.4}}>Evening 6–8pm is peak engagement for gym communities</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ═══ ANALYTICS PAGE ═══ */}
        {tab==='analytics'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:20,alignItems:'start'}}>
            <div style={{display:'flex',flexDirection:'column',gap:20}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                <KpiCard label="Daily Avg" value="8.2" suffix="check-ins/day" sub="+12% vs last month" trend="up" sparkData={sparkData} icon={icons.activity(13,DS.t4)}/>
                <KpiCard label="Monthly Change" value="+12%" sub="Growing" trend="up" valueColor={DS.success} icon={icons.trending(13,DS.t4)}/>
                <KpiCard label="Avg / Member" value="4.3" suffix="visits/mo" icon={icons.users(13,DS.t4)}/>
                <KpiCard label="Return Rate" value="72%" sub="Strong loyalty" valueColor={DS.success} icon={icons.zap(13,DS.t4)}/>
              </div>
              <Card padding="20px">
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:14}}>
                  {icons.sparkle(12,DS.t3)}
                  <span style={{fontSize:12,fontWeight:700,color:DS.t2}}>Smart Insights</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {[
                    {type:'success',l:'Retention strong at 78%',d:"You're in the top 20% — keep your engagement rhythm."},
                    {type:'danger',l:'Weekend attendance <15%',d:'A Saturday challenge or event could drive more footfall.'},
                    {type:'info',l:'Visit frequency is stable',d:'Maintain your posting cadence to sustain this level.'},
                  ].map((s,i)=>(
                    <div key={i} style={{padding:'9px 12px',borderRadius:DS.r2,background:DS.surfaceRaised,border:`1px solid ${DS.border}`,borderLeft:`2px solid ${s.type==='danger'?DS.danger:s.type==='success'?DS.success:DS.t4}`}}>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:2}}>
                        {s.type==='success'?icons.check(11,DS.success):s.type==='danger'?icons.alert(11,DS.danger):icons.activity(11,DS.t3)}
                        <span style={{fontSize:11,fontWeight:700,color:s.type==='info'?DS.t2:DS.t1}}>{s.l}</span>
                      </div>
                      <div style={{fontSize:10,color:DS.t3,paddingLeft:18,lineHeight:1.55}}>{s.d}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card padding="20px">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:DS.t2}}>Weekly Check-in Trend</div>
                    <div style={{fontSize:11,color:DS.t4,marginTop:2}}>12-week rolling view</div>
                  </div>
                  <Badge label="284 total" color={DS.accent}/>
                </div>
                <div style={{height:100}}>
                  <Spark data={[18,22,25,20,28,31,24,27,32,35,30,33]} w={700} h={100}/>
                </div>
              </Card>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <Card padding="20px">
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:DS.t2}}>Week-1 Return</div>
                    <div style={{fontSize:11,color:DS.t4,marginTop:2}}>New member cohort</div>
                  </div>
                  <span style={{fontSize:20,fontWeight:800,color:DS.success,fontVariantNumeric:'tabular-nums'}}>67%</span>
                </div>
                <Spark data={[45,52,58,61,55,63,67]} w={240} h={40} color={DS.accent}/>
                <div style={{marginTop:8}}>
                  <span style={{fontSize:10,fontWeight:600,color:DS.success}}>↑ Strong week-1 return rate</span>
                </div>
              </Card>
              <Card padding="20px">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:DS.t2}}>Churn Risk</div>
                    <div style={{fontSize:11,color:DS.t4,marginTop:2}}>By recency & frequency</div>
                  </div>
                  <Badge label="3 flagged" color={DS.danger}/>
                </div>
                {[{n:'Sarah M.',d:'18d',s:92},{n:'James R.',d:'15d',s:78},{n:'Tom K.',d:'14d',s:65}].map((m,i)=>(
                  <div key={i} style={{padding:'9px 0',borderBottom:i<2?`1px solid ${DS.divider}`:'none',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:11,fontWeight:700,color:DS.t1}}>{m.n}</span>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:10,color:DS.t4,fontFamily:DS.fontMono}}>{m.d} ago</span>
                      <span style={{fontSize:13,fontWeight:800,color:m.s>=50?DS.danger:DS.t2,fontVariantNumeric:'tabular-nums'}}>{m.s}</span>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        )}

        {/* ═══ PLACEHOLDER PAGES ═══ */}
        {['members','engagement','gym'].includes(tab)&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 20px',gap:16}}>
            <div style={{width:56,height:56,borderRadius:DS.r4,background:DS.surfaceRaised,border:`1px solid ${DS.borderMid}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {tab==='members'?icons.users(24,DS.t3):tab==='engagement'?icons.zap(24,DS.t3):icons.activity(24,DS.t3)}
            </div>
            <div style={{fontSize:16,fontWeight:800,color:DS.t1,letterSpacing:'-.02em'}}>{activeTab?.label}</div>
            <div style={{fontSize:13,color:DS.t3,maxWidth:400,textAlign:'center',lineHeight:1.6}}>
              This page uses the same design system with {isCommunity?'Community':'Professional'} mode tokens.
            </div>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <Badge label="Consistent tokens" color={DS.accent}/>
              <Badge label="Shared primitives" color={DS.success}/>
              <Badge label="Tabular numbers" color={DS.warn}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}