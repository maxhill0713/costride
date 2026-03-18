import React from 'react';
import { Trophy, Flame, TrendingUp, CheckCircle, ChevronRight } from 'lucide-react';

const LBOARD_ANIM = `
@keyframes lb-slide-up {
  from { opacity:0; transform:translateY(100%); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes lb-card-in {
  from { opacity:0; transform:translateY(28px) scale(0.9) rotateX(8deg); }
  to   { opacity:1; transform:translateY(0) scale(1) rotateX(0deg); }
}
@keyframes lb-row-in {
  from { opacity:0; transform:translateX(-14px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes lb-flame {
  0%,100% { transform:scale(1) rotate(-4deg) translateY(0); filter:brightness(1); }
  33%     { transform:scale(1.3) rotate(4deg) translateY(-2px); filter:brightness(1.3); }
  66%     { transform:scale(0.9) rotate(-2deg) translateY(1px); filter:brightness(0.9); }
}
@keyframes lb-gold-pulse {
  0%,100% { box-shadow:0 0 0 2px rgba(255,196,0,0.5),0 0 20px rgba(255,196,0,0.25); }
  50%     { box-shadow:0 0 0 4px rgba(255,196,0,0.8),0 0 40px rgba(255,196,0,0.5); }
}
@keyframes lb-silver-pulse {
  0%,100% { box-shadow:0 0 0 2px rgba(192,212,232,0.4),0 0 16px rgba(192,212,232,0.18); }
  50%     { box-shadow:0 0 0 3px rgba(192,212,232,0.65),0 0 28px rgba(192,212,232,0.32); }
}
@keyframes lb-bronze-pulse {
  0%,100% { box-shadow:0 0 0 2px rgba(210,120,50,0.42),0 0 16px rgba(210,120,50,0.18); }
  50%     { box-shadow:0 0 0 3px rgba(210,120,50,0.68),0 0 28px rgba(210,120,50,0.32); }
}
@keyframes lb-shimmer {
  0%   { transform:translateX(-100%); }
  100% { transform:translateX(400%); }
}
@keyframes lb-count-up {
  from { opacity:0; transform:translateY(6px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes lb-orb-drift {
  0%,100% { transform:translate(0,0) scale(1); opacity:0.6; }
  33%     { transform:translate(20px,-15px) scale(1.1); opacity:0.8; }
  66%     { transform:translate(-10px,10px) scale(0.95); opacity:0.5; }
}
@keyframes lb-scan-line {
  0%   { top:0%; opacity:0.4; }
  100% { top:100%; opacity:0; }
}
@keyframes lb-badge-pop {
  0%   { transform:scale(0) rotate(-20deg); opacity:0; }
  60%  { transform:scale(1.15) rotate(5deg); opacity:1; }
  100% { transform:scale(1) rotate(0deg); opacity:1; }
}
`;

const MEDALS = [
  { rank:1, color:'#FFD700', colorRgb:'255,215,0', cardBorder:'rgba(255,215,0,0.55)', cardBorderDim:'rgba(255,215,0,0.15)', glow:'rgba(255,215,0,0.3)', glowStrong:'rgba(255,215,0,0.6)', bg:'linear-gradient(160deg,rgba(60,42,0,0.95) 0%,rgba(28,18,0,0.98) 100%)', avatarRing:'conic-gradient(#FFD700,#FFA500,#FFD700,#FFF0A0,#FFD700)', badgeBg:'linear-gradient(145deg,#FFE566,#CC8800)', badgeText:'rgba(80,40,0,0.9)', pulse:'lb-gold-pulse', shine:'rgba(255,225,80,0.22)', insetGlow:'rgba(255,215,0,0.14)', label:'👑', tierLabel:'CHAMPION', tierColor:'#FFD700', heightExtra:20 },
  { rank:2, color:'#C8D8EC', colorRgb:'200,216,236', cardBorder:'rgba(180,205,230,0.48)', cardBorderDim:'rgba(180,205,230,0.12)', glow:'rgba(180,205,230,0.2)', glowStrong:'rgba(180,205,230,0.45)', bg:'linear-gradient(160deg,rgba(16,28,52,0.95) 0%,rgba(6,12,28,0.98) 100%)', avatarRing:'conic-gradient(#C8D8EC,#8AACCF,#C8D8EC,#E8F0FA,#C8D8EC)', badgeBg:'linear-gradient(145deg,#D4E4F4,#6A96BC)', badgeText:'rgba(10,30,60,0.85)', pulse:'lb-silver-pulse', shine:'rgba(200,220,240,0.14)', insetGlow:'rgba(180,205,230,0.09)', label:'🥈', tierLabel:'ELITE', tierColor:'#C8D8EC', heightExtra:6 },
  { rank:3, color:'#E8904A', colorRgb:'232,144,74', cardBorder:'rgba(215,128,58,0.5)', cardBorderDim:'rgba(215,128,58,0.14)', glow:'rgba(215,128,58,0.22)', glowStrong:'rgba(215,128,58,0.45)', bg:'linear-gradient(160deg,rgba(48,22,6,0.95) 0%,rgba(20,8,2,0.98) 100%)', avatarRing:'conic-gradient(#E8904A,#A05820,#E8904A,#F4C090,#E8904A)', badgeBg:'linear-gradient(145deg,#E8904A,#8C4818)', badgeText:'rgba(50,15,0,0.85)', pulse:'lb-bronze-pulse', shine:'rgba(218,140,72,0.15)', insetGlow:'rgba(215,128,58,0.1)', label:'🥉', tierLabel:'PRO', tierColor:'#E8904A', heightExtra:0 },
];

const NAV_ROW = [
  { rankOpacity:1,    nameOpacity:0.92, barOpacity:0.55, pillOpacity:0.9  },
  { rankOpacity:0.88, nameOpacity:0.82, barOpacity:0.48, pillOpacity:0.8  },
  { rankOpacity:0.76, nameOpacity:0.72, barOpacity:0.40, pillOpacity:0.7  },
  { rankOpacity:0.65, nameOpacity:0.62, barOpacity:0.34, pillOpacity:0.6  },
  { rankOpacity:0.55, nameOpacity:0.52, barOpacity:0.28, pillOpacity:0.52 },
  { rankOpacity:0.46, nameOpacity:0.44, barOpacity:0.22, pillOpacity:0.44 },
  { rankOpacity:0.38, nameOpacity:0.36, barOpacity:0.18, pillOpacity:0.38 },
];

export default function LeaderboardSection({ checkInLeaderboard, streakLeaderboard, progressLeaderboard }) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState('checkins');

  const tabs = [
    { id:'checkins', label:'Check-ins', icon:CheckCircle, accent:'#10b981', accentRgb:'16,185,129', unit:'check-ins' },
    { id:'streaks',  label:'Streaks',   icon:Flame,       accent:'#f97316', accentRgb:'249,115,22',  unit:'day streak' },
    { id:'progress', label:'Progress',  icon:TrendingUp,  accent:'#818cf8', accentRgb:'129,140,248', unit:'kg gained' },
  ];
  const current = tabs.find(t => t.id === view);
  const getData = () => {
    if (view==='checkins') return { list:checkInLeaderboard, getVal:m=>m.count,    fmt:v=>`${v}`,    unit:'check-ins'  };
    if (view==='streaks')  return { list:streakLeaderboard,  getVal:m=>m.streak,   fmt:v=>`${v}d`,   unit:'day streak' };
    return                        { list:progressLeaderboard,getVal:m=>m.increase, fmt:v=>`+${v}kg`, unit:'kg gained'  };
  };
  const { list, getVal, fmt, unit } = getData();
  const maxVal = list.length > 0 ? Math.max(...list.map(getVal), 1) : 1;
  const initials = n => (n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const podium = list.slice(0,3);
  const restList = list.slice(3,10);

  if (!open) return (
    <>
      <style>{LBOARD_ANIM}</style>
      <button onClick={() => setOpen(true)}
        style={{ display:'block', width:'100%', textAlign:'left', cursor:'pointer', position:'relative', overflow:'hidden', background:'#0b1120', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, transition:'border-color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.13)'}
        onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px' }}>
          <div style={{ width:40,height:40,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:'rgba(255,215,0,0.1)',border:'1px solid rgba(255,215,0,0.2)' }}>
            <Trophy style={{ width:18,height:18,color:'#FFD700' }}/>
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3 }}>
              <p style={{ fontSize:13,fontWeight:700,color:'#f0f4f8',letterSpacing:'-0.01em',lineHeight:1,margin:0 }}>Weekly Leaderboard</p>
              {list.length>0 && <span style={{ fontSize:9,fontWeight:800,letterSpacing:'0.1em',color:'rgba(255,215,0,0.7)',background:'rgba(255,215,0,0.1)',border:'1px solid rgba(255,215,0,0.2)',padding:'2px 6px',borderRadius:4,textTransform:'uppercase' }}>LIVE</span>}
            </div>
            <p style={{ fontSize:11,fontWeight:600,color:'#475569',margin:0 }}>
              {list.length>0 ? `${list.length} athletes ranked this week` : 'No activity this week'}
            </p>
          </div>
          {podium.length>0 && (
            <div style={{ display:'flex',alignItems:'center',marginRight:4 }}>
              {podium.map((m,i)=>(
                <div key={i} style={{ width:28,height:28,borderRadius:'50%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,background:MEDALS[i].bg,border:`2px solid ${MEDALS[i].color}`,color:MEDALS[i].color,marginLeft:i===0?0:-8,zIndex:3-i,flexShrink:0 }}>
                  <span style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900 }}>{initials(m.userName)}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ width:28,height:28,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',flexShrink:0 }}>
            <ChevronRight style={{ width:14,height:14,color:'rgba(255,255,255,0.3)' }}/>
          </div>
        </div>
      </button>
    </>
  );

  return (
    <>
      <style>{LBOARD_ANIM}</style>
      <div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:9999,display:'flex',flexDirection:'column',background:'linear-gradient(175deg,#020918 0%,#050e28 35%,#030c22 65%,#010510 100%)',animation:'lb-slide-up 0.42s cubic-bezier(0.16,1,0.3,1) both',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'radial-gradient(rgba(255,255,255,0.015) 1px,transparent 1px)',backgroundSize:'24px 24px',opacity:0.8 }}/>
        <div style={{ position:'absolute',top:'8%',left:'15%',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,215,0,0.07) 0%,transparent 70%)',pointerEvents:'none',animation:'lb-orb-drift 12s ease-in-out infinite' }}/>
        <div style={{ position:'absolute',top:'40%',right:'5%',width:200,height:200,borderRadius:'50%',background:`radial-gradient(circle,rgba(${current.accentRgb},0.06) 0%,transparent 70%)`,pointerEvents:'none',animation:'lb-orb-drift 9s ease-in-out infinite 3s' }}/>

        <div style={{ flexShrink:0,paddingTop:18,paddingLeft:16,paddingRight:16,paddingBottom:12,borderBottom:'1px solid rgba(255,255,255,0.05)',position:'relative',zIndex:2 }}>
          <button onClick={() => setOpen(false)}
            onMouseDown={e=>{e.currentTarget.style.transform='translateY(3px)';e.currentTarget.style.borderBottom='1px solid rgba(0,0,0,0.4)';}}
            onMouseUp={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderBottom='';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderBottom='';}}
            onTouchStart={e=>{e.currentTarget.style.transform='translateY(3px)';e.currentTarget.style.borderBottom='1px solid rgba(0,0,0,0.4)';}}
            onTouchEnd={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderBottom='';}}
            style={{ position:'absolute',top:14,left:16,width:36,height:36,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(30,40,80,0.9)',border:'1px solid rgba(255,255,255,0.15)',borderBottom:'3px solid rgba(0,0,0,0.55)',boxShadow:'0 2px 0 rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.12)',transition:'transform 0.08s ease,border-bottom 0.08s ease',cursor:'pointer' }}>
            <ChevronRight style={{ width:17,height:17,color:'rgba(255,255,255,0.7)',transform:'rotate(180deg)' }}/>
          </button>
          <div style={{ textAlign:'center',marginBottom:10 }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:3 }}>
              <Trophy style={{ width:14,height:14,color:'#FFD700',filter:'drop-shadow(0 0 8px rgba(255,215,0,0.7))' }}/>
              <span style={{ fontSize:10,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.28em',color:'rgba(255,215,0,0.65)' }}>Community Rankings</span>
            </div>
            <h2 style={{ fontSize:26,fontWeight:900,color:'#fff',margin:0,letterSpacing:'-0.04em',lineHeight:1 }}>Leaderboard</h2>
          </div>
          <div style={{ display:'flex',gap:6,padding:4 }}>
            {tabs.map(({id,label,icon:Icon,accent,accentRgb})=>{
              const active = view===id;
              return (
                <button key={id} onClick={() => setView(id)}
                  onMouseDown={e=>{e.currentTarget.style.transform='translateY(3px)';e.currentTarget.style.borderBottom='1px solid rgba(0,0,0,0.4)';}}
                  onMouseUp={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderBottom='';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderBottom='';}}
                  onTouchStart={e=>{e.currentTarget.style.transform='translateY(3px)';e.currentTarget.style.borderBottom='1px solid rgba(0,0,0,0.4)';}}
                  onTouchEnd={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderBottom='';}}
                  style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'8px 4px',borderRadius:12,fontSize:11,fontWeight:800,background:active?`rgba(${accentRgb},0.2)`:'rgba(20,28,60,0.75)',border:`1px solid ${active?`rgba(${accentRgb},0.5)`:'rgba(255,255,255,0.09)'}`,borderBottom:active?`3px solid rgba(${accentRgb},0.55)`:'3px solid rgba(0,0,0,0.5)',color:active?accent:'rgba(255,255,255,0.3)',boxShadow:active?`0 2px 0 rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.18),0 0 14px rgba(${accentRgb},0.18)`:'0 2px 0 rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.06)',transition:'transform 0.08s ease,border-bottom 0.08s ease',cursor:'pointer' }}>
                  <Icon style={{ width:12,height:12 }}/>{label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',position:'relative',zIndex:2 }}>
          {list.length===0 ? (
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:280,gap:16 }}>
              <div style={{ width:60,height:60,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)' }}>
                <Trophy style={{ width:26,height:26,color:'rgba(255,255,255,0.1)' }}/>
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:15,fontWeight:800,color:'rgba(255,255,255,0.25)',margin:'0 0 4px' }}>No Rankings Yet</p>
                <p style={{ fontSize:12,color:'rgba(255,255,255,0.12)',margin:0 }}>Check-ins will appear here</p>
              </div>
            </div>
          ) : (<>
            <div style={{ padding:'8px 16px 10px',display:'flex',alignItems:'flex-end',justifyContent:'center',gap:6,perspective:800 }}>
              {[{data:podium[1],mIdx:1},{data:podium[0],mIdx:0},{data:podium[2],mIdx:2}].filter(p=>p.data).map(({data,mIdx},colIdx)=>{
                const M=MEDALS[mIdx]; const isFirst=mIdx===0;
                const cardW=isFirst?116:94; const avatarSz=isFirst?50:38;
                return (
                  <div key={mIdx} style={{ width:cardW,borderRadius:18,overflow:'hidden',position:'relative',background:M.bg,border:`1.5px solid ${M.cardBorder}`,backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',boxShadow:`0 16px 48px rgba(0,0,0,0.7),0 0 0 1px ${M.cardBorderDim},inset 0 1px 0 ${M.shine}`,animation:`lb-card-in 0.5s cubic-bezier(0.34,1.3,0.64,1) ${colIdx*0.08}s both`,marginBottom:M.heightExtra,transformOrigin:'bottom center' }}>
                    <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent 0%,${M.color} 40%,${M.glowStrong} 50%,${M.color} 60%,transparent 100%)`,zIndex:3 }}/>
                    <div style={{ position:'absolute',inset:0,pointerEvents:'none',background:`radial-gradient(ellipse at 50% 0%,${M.insetGlow} 0%,transparent 55%)` }}/>
                    <div style={{ position:'absolute',top:0,left:0,width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',background:M.badgeBg,borderRadius:'0 0 9px 0',zIndex:4,boxShadow:'inset 0 1px 0 rgba(255,255,255,0.3)' }}>
                      <span style={{ fontSize:10,fontWeight:900,color:M.badgeText }}>{mIdx+1}</span>
                    </div>
                    {isFirst&&<div style={{ position:'absolute',top:5,right:7,fontSize:14,animation:'lb-flame 1.6s ease-in-out infinite',pointerEvents:'none',zIndex:4,filter:'drop-shadow(0 0 6px rgba(255,150,0,0.7))' }}>🔥</div>}
                    <div style={{ display:'flex',justifyContent:'center',paddingTop:isFirst?16:13,paddingBottom:3,position:'relative',zIndex:2 }}>
                      <span style={{ fontSize:6,fontWeight:900,letterSpacing:'0.2em',color:M.tierColor,opacity:0.7,textTransform:'uppercase',background:`rgba(${M.colorRgb},0.1)`,border:`1px solid rgba(${M.colorRgb},0.2)`,padding:'1px 6px',borderRadius:99 }}>{M.tierLabel}</span>
                    </div>
                    <div style={{ display:'flex',justifyContent:'center',paddingBottom:4,position:'relative',zIndex:2 }}>
                      <div style={{ position:'relative' }}>
                        <div style={{ width:avatarSz+6,height:avatarSz+6,borderRadius:'50%',background:M.avatarRing,animation:`${M.pulse} 2.5s ease-in-out infinite`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                          <div style={{ width:avatarSz,height:avatarSz,borderRadius:'50%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:M.color,background:M.bg,border:'2px solid rgba(0,0,0,0.3)' }}>
                            <span style={{ display:'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:isFirst?17:12,color:M.color }}>{(data.userName||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</span>
                          </div>
                        </div>
                        <div style={{ position:'absolute',bottom:-2,right:-2,width:17,height:17,borderRadius:'50%',background:'rgba(6,10,24,0.9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,boxShadow:`0 0 0 2px ${M.color}`,animation:'lb-badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both',zIndex:5 }}>{M.label}</div>
                      </div>
                    </div>
                    <p style={{ color:'#fff',fontWeight:900,textAlign:'center',fontSize:isFirst?11:9,lineHeight:1.2,padding:'0 6px 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textShadow:`0 0 16px ${M.glow}`,position:'relative',zIndex:2 }}>{data.userName||'—'}</p>
                    <div style={{ textAlign:'center',padding:`2px 8px ${isFirst?13:9}px`,position:'relative',zIndex:2 }}>
                      <p style={{ fontSize:isFirst?20:15,fontWeight:900,color:M.color,lineHeight:1,textShadow:`0 0 24px ${M.glowStrong}`,letterSpacing:'-0.03em',animation:'lb-count-up 0.5s ease 0.2s both' }}>{fmt(getVal(data))}</p>
                      <p style={{ fontSize:6,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.16em',color:`rgba(${M.colorRgb},0.45)`,marginTop:1 }}>{unit}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {restList.length>0&&(
              <div style={{ display:'flex',flexDirection:'column',gap:4,padding:'4px 12px 20px' }}>
                {restList.map((m,i)=>{
                  const globalRank=i+4; const pct=Math.max(4,Math.round((getVal(m)/maxVal)*100));
                  const R=NAV_ROW[i]||NAV_ROW[NAV_ROW.length-1];
                  return (
                    <div key={m.userId||i} style={{ borderRadius:14,padding:'10px 12px',display:'flex',alignItems:'center',gap:10,animation:`lb-row-in 0.28s ease ${(i+3)*0.04}s both`,position:'relative',overflow:'hidden',background:'linear-gradient(135deg,rgba(15,24,58,0.82) 0%,rgba(8,14,36,0.92) 100%)',border:'1px solid rgba(255,255,255,0.06)',borderTop:'1px solid rgba(255,255,255,0.09)',boxShadow:'0 2px 12px rgba(0,0,0,0.35)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)' }}>
                      <div style={{ position:'absolute',left:0,top:'18%',bottom:'18%',width:2,borderRadius:99,background:`rgba(${current.accentRgb},${R.rankOpacity*0.35})`,pointerEvents:'none' }}/>
                      <div style={{ width:28,height:28,borderRadius:9,flexShrink:0,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,color:`rgba(255,255,255,${R.rankOpacity*0.7})`,letterSpacing:'-0.02em' }}>{globalRank}</div>
                      <div style={{ width:36,height:36,borderRadius:'50%',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,background:'rgba(255,255,255,0.06)',border:`1px solid rgba(255,255,255,${R.rankOpacity*0.12})` }}>
                        <span style={{ display:'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,color:`rgba(255,255,255,${R.rankOpacity*0.6})` }}>{(m.userName||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</span>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <p style={{ fontSize:13,fontWeight:700,color:`rgba(255,255,255,${R.nameOpacity})`,margin:'0 0 5px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:'-0.01em' }}>{m.userName||'—'}</p>
                        <div style={{ height:2,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                          <div style={{ height:'100%',borderRadius:99,width:`${pct}%`,background:`rgba(${current.accentRgb},${R.barOpacity})`,transition:'width 0.6s ease' }}/>
                        </div>
                      </div>
                      <div style={{ flexShrink:0,padding:'4px 10px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:`1px solid rgba(255,255,255,${R.pillOpacity*0.1})`,fontSize:13,fontWeight:800,color:`rgba(255,255,255,${R.pillOpacity*0.9})`,letterSpacing:'-0.02em' }}>{fmt(getVal(m))}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <p style={{ textAlign:'center',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.18em',color:'rgba(255,255,255,0.08)',paddingBottom:10 }}>Ranked by {unit} · Updates in real-time</p>
          </>)}
        </div>
      </div>
    </>
  );
}