import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { base44 } from '@/api/base44Client'
import { ChevronDown, ChevronRight, Trophy, Users2, TrendingUp, CheckCircle } from 'lucide-react'

/* ───────────────── CONFIG ───────────────── */

const LIFTS = [
  { id: 'all',      label: 'All Lifts',      short: 'All',   emoji: '⚡', color: '#38bdf8', colorRgb: '56,189,248',  keywords: [] },
  { id: 'squat',    label: 'Squat',          short: 'Squat', emoji: '🦵', color: '#f59e0b', colorRgb: '245,158,11',  keywords: ['squat','back squat','front squat'] },
  { id: 'bench',    label: 'Bench Press',    short: 'Bench', emoji: '💪', color: '#0ea5e9', colorRgb: '14,165,233',  keywords: ['bench','bench press','chest press'] },
  { id: 'deadlift', label: 'Deadlift',       short: 'Dead',  emoji: '🏋️', color: '#f43f5e', colorRgb: '244,63,94',   keywords: ['deadlift','dead lift'] },
  { id: 'ohp',      label: 'Overhead Press', short: 'OHP',   emoji: '☝️', color: '#10b981', colorRgb: '16,185,129',  keywords: ['overhead press','ohp','shoulder press','military press'] },
  { id: 'row',      label: 'Barbell Row',    short: 'Row',   emoji: '🔁', color: '#a78bfa', colorRgb: '167,139,250', keywords: ['barbell row','bent over row','row'] },
]

const TIME_FILTERS = [
  { id: 'week',  label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all',   label: 'All Time' },
]

const MEDALS = [
  { rank:1, color:'#FFD700', colorRgb:'255,215,0',   bg:'linear-gradient(160deg,rgba(60,42,0,0.95),rgba(28,18,0,0.98))',   border:'rgba(255,215,0,0.55)',  pulse:'gold-pulse',   label:'👑', tier:'CHAMPION', avatarRing:'conic-gradient(#FFD700,#FFA500,#FFD700,#FFF0A0,#FFD700)', badgeBg:'linear-gradient(145deg,#FFE566,#CC8800)', glow:'rgba(255,215,0,0.3)', glowStrong:'rgba(255,215,0,0.6)', heightExtra:20 },
  { rank:2, color:'#C8D8EC', colorRgb:'200,216,236', bg:'linear-gradient(160deg,rgba(16,28,52,0.95),rgba(6,12,28,0.98))',  border:'rgba(180,205,230,0.48)', pulse:'silver-pulse', label:'🥈', tier:'ELITE',    avatarRing:'conic-gradient(#C8D8EC,#8AACCF,#C8D8EC,#E8F0FA,#C8D8EC)', badgeBg:'linear-gradient(145deg,#D4E4F4,#6A96BC)', glow:'rgba(180,205,230,0.2)', glowStrong:'rgba(180,205,230,0.45)', heightExtra:6 },
  { rank:3, color:'#E8904A', colorRgb:'232,144,74',  bg:'linear-gradient(160deg,rgba(48,22,6,0.95),rgba(20,8,2,0.98))',   border:'rgba(215,128,58,0.5)',  pulse:'bronze-pulse', label:'🥉', tier:'PRO',      avatarRing:'conic-gradient(#E8904A,#A05820,#E8904A,#F4C090,#E8904A)', badgeBg:'linear-gradient(145deg,#E8904A,#8C4818)', glow:'rgba(215,128,58,0.22)', glowStrong:'rgba(215,128,58,0.45)', heightExtra:0 },
]

const LBOARD_CSS = `
@keyframes lb-slide-up { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
@keyframes lb-card-in  { from{opacity:0;transform:translateY(28px) scale(0.9) rotateX(8deg)} to{opacity:1;transform:translateY(0) scale(1) rotateX(0)} }
@keyframes lb-row-in   { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
@keyframes lb-flame    { 0%,100%{transform:scale(1) rotate(-4deg) translateY(0);filter:brightness(1)} 33%{transform:scale(1.3) rotate(4deg) translateY(-2px);filter:brightness(1.3)} 66%{transform:scale(0.9) rotate(-2deg) translateY(1px);filter:brightness(0.9)} }
@keyframes lb-shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
@keyframes lb-count-up { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes gold-pulse   { 0%,100%{box-shadow:0 0 0 2px rgba(255,196,0,0.5),0 0 20px rgba(255,196,0,0.25)} 50%{box-shadow:0 0 0 4px rgba(255,196,0,0.8),0 0 40px rgba(255,196,0,0.5)} }
@keyframes silver-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(192,212,232,0.4),0 0 16px rgba(192,212,232,0.18)} 50%{box-shadow:0 0 0 3px rgba(192,212,232,0.65),0 0 28px rgba(192,212,232,0.32)} }
@keyframes bronze-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(210,120,50,0.42),0 0 16px rgba(210,120,50,0.18)} 50%{box-shadow:0 0 0 3px rgba(210,120,50,0.68),0 0 28px rgba(210,120,50,0.32)} }
@keyframes lb-badge-pop { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.15) rotate(5deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
`

const NAV_ROW = [
  { rankO:1.0, nameO:0.92, barO:0.55, pillO:0.9  },
  { rankO:0.88,nameO:0.82, barO:0.48, pillO:0.8  },
  { rankO:0.76,nameO:0.72, barO:0.40, pillO:0.7  },
  { rankO:0.65,nameO:0.62, barO:0.34, pillO:0.6  },
  { rankO:0.55,nameO:0.52, barO:0.28, pillO:0.52 },
  { rankO:0.46,nameO:0.44, barO:0.22, pillO:0.44 },
  { rankO:0.38,nameO:0.36, barO:0.18, pillO:0.38 },
]

/* ───────────────── HELPERS ───────────────── */

function matchLift(name=''){
  const lower = name.toLowerCase()
  for (const lift of LIFTS.filter(l=>l.id!=='all')){
    if (lift.keywords.some(k=>lower.includes(k))) return lift.id
  }
  return null
}

function filterByTime(sets, filter){
  const now = Date.now()
  if (filter==='week')  return sets.filter(s=>now-new Date(s.logged_date||s.created_date||0)<7*86400000)
  if (filter==='month') return sets.filter(s=>now-new Date(s.logged_date||s.created_date||0)<30*86400000)
  return sets
}

// Flatten WorkoutLog exercises into flat set records
function flattenWorkoutLogs(logs, userMap={}){
  const flat = []
  logs.forEach(log=>{
    const userName = userMap[log.user_id] || log.created_by?.split('@')[0] || 'Athlete'
    ;(log.exercises||[]).forEach(ex=>{
      const w = parseFloat(ex.weight||0)
      if (!w) return
      flat.push({
        user_id:     log.user_id,
        user_name:   userName,
        exercise_name: ex.exercise||'',
        weight:      w,
        unit:        'kg',
        logged_date: log.completed_date||log.created_date,
      })
    })
  })
  return flat
}

function buildLeaderboard(sets, liftId){
  const best = {}
  const history = {}
  sets.forEach(s=>{
    const lId = matchLift(s.exercise_name||'')
    if (!lId) return
    if (liftId!=='all' && lId!==liftId) return
    const w = s.weight
    if (!w) return
    const uid = s.user_id
    if (!best[uid]||w>best[uid].weight){
      best[uid] = { user_id:uid, user_name:s.user_name||'Athlete', weight:w, unit:s.unit||'kg' }
    }
    if (!history[uid]) history[uid]=[]
    history[uid].push({ weight:w, date:s.logged_date, unit:s.unit||'kg' })
  })
  Object.keys(best).forEach(uid=>{
    best[uid].history=(history[uid]||[]).sort((a,b)=>new Date(a.date)-new Date(b.date))
  })
  return Object.values(best).sort((a,b)=>b.weight-a.weight)
}

const initials = n=>(n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

/* ───────────────── DROPDOWN ───────────────── */

function Dropdown({options,value,onChange}){
  const [open,setOpen]=useState(false)
  const ref=useRef()
  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)}
    document.addEventListener('mousedown',fn)
    return()=>document.removeEventListener('mousedown',fn)
  },[])
  const selected=options.find(o=>o.id===value)
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        padding:'9px 14px',borderRadius:12,border:'none',
        background:'rgba(15,30,60,0.9)',outline:'1px solid rgba(255,255,255,0.1)',
        color:'#e2e8f0',fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:6,cursor:'pointer'
      }}>
        {selected?.emoji && <span>{selected.emoji}</span>}
        {selected?.label}
        <ChevronDown size={12}/>
      </button>
      {open&&(
        <div style={{
          position:'absolute',top:'110%',right:0,minWidth:170,borderRadius:14,overflow:'hidden',
          background:'#0d1e3d',border:'1px solid rgba(255,255,255,0.1)',zIndex:50,
          boxShadow:'0 16px 48px rgba(0,0,0,0.6)',
        }}>
          {options.map(o=>(
            <button key={o.id} onClick={()=>{onChange(o.id);setOpen(false)}} style={{
              width:'100%',padding:'12px 16px',border:'none',cursor:'pointer',textAlign:'left',
              background:value===o.id?'rgba(56,189,248,0.1)':'transparent',
              color:value===o.id?'#38bdf8':'#94a3b8',fontWeight:value===o.id?700:500,fontSize:13,
            }}>
              {o.emoji&&<span style={{marginRight:8}}>{o.emoji}</span>}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───────────────── LEADERBOARD PANEL ───────────────── */

function LiftLeaderboard({ leaderboard, liftMeta, currentUserId, open, onOpen, onClose }){
  const podium = leaderboard.slice(0,3)
  const restList = leaderboard.slice(3,10)
  const maxVal = leaderboard.length>0 ? Math.max(...leaderboard.map(e=>e.weight),1) : 1

  const fmt = v => `${v}kg`

  if (!open) return (
    <>
      <style>{LBOARD_CSS}</style>
      <button
        onClick={onOpen}
        className="w-full text-left relative overflow-hidden rounded-2xl"
        style={{
          background:'linear-gradient(135deg,rgba(14,22,48,0.92),rgba(6,10,26,0.97))',
          border:'1px solid rgba(255,215,0,0.18)',
          backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
          boxShadow:'0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,overflow:'hidden',pointerEvents:'none',borderRadius:'inherit'}}>
          <div style={{position:'absolute',top:0,bottom:0,width:'30%',background:'linear-gradient(90deg,transparent,rgba(255,215,0,0.04),transparent)',animation:'lb-shimmer 3.5s ease-in-out infinite'}}/>
        </div>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent 0%,rgba(255,215,0,0.6) 30%,rgba(255,215,0,0.9) 50%,rgba(255,215,0,0.6) 70%,transparent 100%)'}}/>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:'linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,180,0,0.08))',border:'1px solid rgba(255,215,0,0.25)'}}>
            <Trophy style={{width:20,height:20,color:'#FFD700',filter:'drop-shadow(0 0 6px rgba(255,215,0,0.5))'}}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p style={{fontSize:15,fontWeight:900,color:'#fff',letterSpacing:'-0.02em',lineHeight:1}}>{liftMeta.label} Leaderboard</p>
              {leaderboard.length>0&&<span style={{fontSize:9,fontWeight:900,letterSpacing:'0.1em',color:'rgba(255,215,0,0.7)',background:'rgba(255,215,0,0.1)',border:'1px solid rgba(255,215,0,0.2)',padding:'2px 6px',borderRadius:4,textTransform:'uppercase'}}>LIVE</span>}
            </div>
            <p style={{fontSize:11,marginTop:3,fontWeight:600,color:'rgba(255,255,255,0.35)'}}>
              {leaderboard.length>0?`${leaderboard.length} athletes ranked`:'No lifts logged yet'}
            </p>
          </div>
          {podium.length>0&&(
            <div style={{display:'flex',alignItems:'center',marginRight:4}}>
              {podium.map((m,i)=>(
                <div key={i} style={{width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,background:MEDALS[i].bg,border:`2px solid ${MEDALS[i].color}`,color:MEDALS[i].color,marginLeft:i===0?0:-10,zIndex:3-i,boxShadow:`0 0 12px ${MEDALS[i].glow}`,flexShrink:0}}>
                  {initials(m.user_name)}
                </div>
              ))}
            </div>
          )}
          <div style={{width:30,height:30,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',flexShrink:0}}>
            <ChevronRight style={{width:15,height:15,color:'rgba(255,255,255,0.4)'}}/>
          </div>
        </div>
      </button>
    </>
  )

  return (
    <>
      <style>{LBOARD_CSS}</style>
      <div style={{
        position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:9999,
        display:'flex',flexDirection:'column',
        background:'linear-gradient(175deg,#020918 0%,#050e28 35%,#030c22 65%,#010510 100%)',
        animation:'lb-slide-up 0.42s cubic-bezier(0.16,1,0.3,1) both',
        overflow:'hidden',
      }}>
        <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'radial-gradient(rgba(255,255,255,0.015) 1px,transparent 1px)',backgroundSize:'24px 24px',opacity:0.8}}/>

        {/* Header */}
        <div style={{flexShrink:0,padding:'18px 16px 12px',borderBottom:'1px solid rgba(255,255,255,0.05)',position:'relative',zIndex:2}}>
          <button onClick={onClose} style={{position:'absolute',top:14,left:16,width:36,height:36,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(30,40,80,0.9)',border:'1px solid rgba(255,255,255,0.15)',borderBottom:'3px solid rgba(0,0,0,0.55)',boxShadow:'0 2px 0 rgba(0,0,0,0.4)',cursor:'pointer'}}>
            <ChevronRight style={{width:17,height:17,color:'rgba(255,255,255,0.7)',transform:'rotate(180deg)'}}/>
          </button>
          <div style={{textAlign:'center',marginBottom:10}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,marginBottom:3}}>
              <Trophy style={{width:14,height:14,color:'#FFD700',filter:'drop-shadow(0 0 8px rgba(255,215,0,0.7))'}}/>
              <span style={{fontSize:10,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.28em',color:'rgba(255,215,0,0.65)'}}>Strength Rankings</span>
            </div>
            <h2 style={{fontSize:26,fontWeight:900,color:'#fff',margin:0,letterSpacing:'-0.04em',lineHeight:1}}>{liftMeta.label}</h2>
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',position:'relative',zIndex:2}}>
          {leaderboard.length===0 ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:280,gap:16}}>
              <div style={{width:60,height:60,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <Trophy style={{width:26,height:26,color:'rgba(255,255,255,0.1)'}}/>
              </div>
              <div style={{textAlign:'center'}}>
                <p style={{fontSize:15,fontWeight:800,color:'rgba(255,255,255,0.25)',margin:'0 0 4px'}}>No Rankings Yet</p>
                <p style={{fontSize:12,color:'rgba(255,255,255,0.12)',margin:0}}>Log a {liftMeta.label} to appear here</p>
              </div>
            </div>
          ) : (<>
            {/* Podium top 3 */}
            <div style={{padding:'8px 16px 10px',display:'flex',alignItems:'flex-end',justifyContent:'center',gap:6,perspective:800}}>
              {[{data:podium[1],mIdx:1},{data:podium[0],mIdx:0},{data:podium[2],mIdx:2}]
                .filter(p=>p.data)
                .map(({data,mIdx},colIdx)=>{
                  const M=MEDALS[mIdx]
                  const isFirst=mIdx===0
                  const cardW=isFirst?116:94
                  const avatarSz=isFirst?50:38
                  const isMe=data.user_id===currentUserId
                  return (
                    <div key={mIdx} style={{
                      width:cardW,borderRadius:18,overflow:'hidden',position:'relative',
                      background:M.bg,border:`1.5px solid ${M.border}`,
                      backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',
                      boxShadow:`0 16px 48px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.08)`,
                      animation:`lb-card-in 0.5s cubic-bezier(0.34,1.3,0.64,1) ${colIdx*0.08}s both`,
                      marginBottom:M.heightExtra,transformOrigin:'bottom center',
                    }}>
                      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent 0%,${M.color} 40%,${M.glowStrong} 50%,${M.color} 60%,transparent 100%)`,zIndex:3}}/>
                      <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
                        <div style={{position:'absolute',top:0,bottom:0,width:'25%',background:`linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)`,animation:`lb-shimmer 4s ease-in-out infinite`,animationDelay:`${mIdx*0.8}s`}}/>
                      </div>
                      <div style={{position:'absolute',top:0,left:0,width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',background:M.badgeBg,borderRadius:'0 0 9px 0',zIndex:4}}>
                        <span style={{fontSize:10,fontWeight:900,color:'rgba(0,0,0,0.7)'}}>{mIdx+1}</span>
                      </div>
                      {isFirst&&<div style={{position:'absolute',top:5,right:7,fontSize:14,animation:'lb-flame 1.6s ease-in-out infinite',pointerEvents:'none',zIndex:4}}>🔥</div>}
                      <div style={{display:'flex',justifyContent:'center',paddingTop:isFirst?16:13,paddingBottom:3,position:'relative',zIndex:2}}>
                        <span style={{fontSize:6,fontWeight:900,letterSpacing:'0.2em',color:M.color,opacity:0.7,textTransform:'uppercase',background:`rgba(${M.colorRgb},0.1)`,border:`1px solid rgba(${M.colorRgb},0.2)`,padding:'1px 6px',borderRadius:99}}>{M.tier}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'center',paddingBottom:4,position:'relative',zIndex:2}}>
                        <div style={{position:'relative'}}>
                          <div style={{width:avatarSz+6,height:avatarSz+6,borderRadius:'50%',background:M.avatarRing,animation:`${M.pulse} 2.5s ease-in-out infinite`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <div style={{width:avatarSz,height:avatarSz,borderRadius:'50%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:M.color,background:M.bg,border:'2px solid rgba(0,0,0,0.3)',fontSize:isFirst?17:12}}>
                              {initials(data.user_name)}
                            </div>
                          </div>
                          <div style={{position:'absolute',bottom:-2,right:-2,width:17,height:17,borderRadius:'50%',background:'rgba(6,10,24,0.9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,boxShadow:`0 0 0 2px ${M.color}`,animation:'lb-badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both',zIndex:5}}>{M.label}</div>
                        </div>
                      </div>
                      <p style={{color:isMe?'#38bdf8':'#fff',fontWeight:900,textAlign:'center',fontSize:isFirst?11:9,lineHeight:1.2,padding:'0 6px 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',position:'relative',zIndex:2}}>
                        {isMe?'You':data.user_name||'—'}
                      </p>
                      <div style={{textAlign:'center',padding:`2px 8px ${isFirst?13:9}px`,position:'relative',zIndex:2}}>
                        <p style={{fontSize:isFirst?20:15,fontWeight:900,color:M.color,lineHeight:1,textShadow:`0 0 24px ${M.glowStrong}`,letterSpacing:'-0.03em',animation:'lb-count-up 0.5s ease 0.2s both'}}>{fmt(data.weight)}</p>
                        <p style={{fontSize:6,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.16em',color:`rgba(${M.colorRgb},0.45)`,marginTop:1}}>personal best</p>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Rows 4-10 */}
            {restList.length>0&&(
              <div style={{display:'flex',flexDirection:'column',gap:4,padding:'4px 12px 20px'}}>
                {restList.map((entry,i)=>{
                  const globalRank=i+4
                  const pct=Math.max(4,Math.round((entry.weight/maxVal)*100))
                  const R=NAV_ROW[i]||NAV_ROW[NAV_ROW.length-1]
                  const isMe=entry.user_id===currentUserId
                  return (
                    <div key={entry.user_id||i} style={{
                      borderRadius:14,padding:'10px 12px',display:'flex',alignItems:'center',gap:10,
                      animation:`lb-row-in 0.28s ease ${(i+3)*0.04}s both`,
                      position:'relative',overflow:'hidden',
                      background: isMe?'rgba(56,189,248,0.08)':'linear-gradient(135deg,rgba(15,24,58,0.82),rgba(8,14,36,0.92))',
                      border:`1px solid ${isMe?'rgba(56,189,248,0.3)':'rgba(255,255,255,0.06)'}`,
                      borderLeft:`3px solid ${isMe?'#38bdf8':'rgba(255,255,255,0.06)'}`,
                      boxShadow:'0 2px 12px rgba(0,0,0,0.35)',
                    }}>
                      <div style={{width:28,height:28,borderRadius:9,flexShrink:0,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,color:`rgba(255,255,255,${R.rankO*0.7})`}}>{globalRank}</div>
                      <div style={{width:36,height:36,borderRadius:'50%',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,background:isMe?'rgba(56,189,248,0.2)':'rgba(255,255,255,0.06)',border:`2px solid ${isMe?'#38bdf8':'rgba(255,255,255,0.1)'}`,color:isMe?'#38bdf8':'rgba(255,255,255,0.6)'}}>
                        {initials(entry.user_name)}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:13,fontWeight:700,color:isMe?'#fff':`rgba(255,255,255,${R.nameO})`,margin:'0 0 5px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {isMe?'You':entry.user_name||'—'}
                        </p>
                        <div style={{height:2,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:99,width:`${pct}%`,background:`rgba(${liftMeta.colorRgb},${R.barO})`,transition:'width 0.6s ease'}}/>
                        </div>
                      </div>
                      <div style={{flexShrink:0,padding:'4px 10px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',fontSize:13,fontWeight:800,color:`rgba(255,255,255,${R.pillO*0.9})`}}>{fmt(entry.weight)}</div>
                    </div>
                  )
                })}
              </div>
            )}

            <p style={{textAlign:'center',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.18em',color:'rgba(255,255,255,0.08)',paddingBottom:10}}>
              Ranked by personal best · Updates in real-time
            </p>
          </>)}
        </div>
      </div>
    </>
  )
}

/* ───────────────── MAIN ───────────────── */

export default function Community(){
  const [activeLift, setActiveLift] = useState('bench')
  const [timeFilter, setTimeFilter] = useState('week')
  const [lbOpen,     setLbOpen]     = useState(false)

  const {data:currentUser} = useQuery({
    queryKey:['currentUser'],
    queryFn:()=>base44.auth.me(),
    staleTime:5*60*1000,
  })

  const {data:gymMemberships=[]} = useQuery({
    queryKey:['gymMemberships',currentUser?.id],
    queryFn:()=>base44.entities.GymMembership.filter({user_id:currentUser.id,status:'active'}),
    enabled:!!currentUser,
    staleTime:5*60*1000,
  })

  const {data:workoutLogs=[], isLoading} = useQuery({
    queryKey:['communityWorkoutLogs'],
    queryFn:()=>base44.entities.WorkoutLog.list(),
    staleTime:3*60*1000,
  })

  const {data:users=[]} = useQuery({
    queryKey:['allUsers'],
    queryFn:()=>base44.entities.User.list(),
    staleTime:10*60*1000,
  })

  const userMap = useMemo(()=>{
    const m={}
    users.forEach(u=>{m[u.id]=u.full_name||u.email?.split('@')[0]||'Athlete'})
    if (currentUser) m[currentUser.id]=currentUser.full_name||currentUser.email?.split('@')[0]||'You'
    return m
  },[users,currentUser])

  const allSets      = useMemo(()=>flattenWorkoutLogs(workoutLogs,userMap),[workoutLogs,userMap])
  const filteredSets = useMemo(()=>filterByTime(allSets,timeFilter),[allSets,timeFilter])
  const leaderboard  = useMemo(()=>buildLeaderboard(filteredSets,activeLift),[filteredSets,activeLift])

  const myEntry = leaderboard.find(l=>l.user_id===currentUser?.id)
  const myRank  = myEntry ? leaderboard.indexOf(myEntry)+1 : null
  const myPct   = myRank&&leaderboard.length>1 ? Math.round(((leaderboard.length-myRank)/(leaderboard.length-1))*100) : null

  const allTimeBest = useMemo(()=>{
    return allSets.filter(s=>s.user_id===currentUser?.id&&(activeLift==='all'?!!matchLift(s.exercise_name||''):matchLift(s.exercise_name||'')===activeLift))
      .reduce((b,s)=>Math.max(b,s.weight||0),0)
  },[allSets,currentUser?.id,activeLift])

  const todayLifters = useMemo(()=>new Set(allSets.filter(s=>Date.now()-new Date(s.logged_date||0)<86400000).map(s=>s.user_id)).size,[allSets])

  const gymName  = gymMemberships[0]?.gym_name||'Community'
  const liftMeta = LIFTS.find(l=>l.id===activeLift)||LIFTS[0]
  const pctColor = myPct>=90?'#f59e0b':myPct>=75?'#10b981':'#38bdf8'

  return (
    <>
      <style>{LBOARD_CSS}</style>
      <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#06090f 0%,#0b1a35 45%,#06090f 100%)',fontFamily:"'Outfit',system-ui,sans-serif",color:'#e2e8f0'}}>
        <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 32px'}}>

          {/* HEADER */}
          <div style={{padding:'24px 20px 18px',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
            <div>
              <h1 style={{fontSize:28,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',margin:0,lineHeight:1}}>Community Lifts</h1>
              <p style={{fontSize:13,color:'#475569',margin:'5px 0 0',fontWeight:600}}>{gymName}</p>
            </div>
            <div style={{display:'flex',gap:8,marginTop:4}}>
              <Dropdown options={LIFTS} value={activeLift} onChange={v=>{setActiveLift(v);setLbOpen(false)}}/>
              <Dropdown options={TIME_FILTERS} value={timeFilter} onChange={setTimeFilter}/>
            </div>
          </div>

          <div style={{padding:'0 14px',display:'flex',flexDirection:'column',gap:12}}>

            {/* PERSONAL CARD */}
            <div style={{borderRadius:20,overflow:'hidden',background:'linear-gradient(135deg,rgba(15,30,65,0.95),rgba(8,16,31,0.98))',border:`1px solid rgba(${liftMeta.colorRgb},0.25)`,boxShadow:'0 4px 32px rgba(0,0,0,0.4)'}}>
              <div style={{padding:'20px 20px 18px'}}>
                {myEntry ? (
                  <>
                    <div style={{fontSize:12,fontWeight:700,color:'#64748b',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>{liftMeta.emoji} {liftMeta.label}</div>
                    <div style={{fontSize:52,fontWeight:900,color:'#fff',letterSpacing:'-0.04em',lineHeight:1,marginBottom:10}}>
                      {myEntry.weight}<span style={{fontSize:22,fontWeight:700,color:'#64748b',marginLeft:4}}>kg</span>
                    </div>
                    {myPct!==null&&(
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                        <Trophy style={{width:14,height:14,color:pctColor}}/>
                        <span style={{fontSize:14,fontWeight:800,color:'#fff'}}>Top {100-myPct}% in {gymName}</span>
                      </div>
                    )}
                    {myRank&&<div style={{fontSize:13,color:'#64748b',fontWeight:600,marginBottom:14}}>Rank #{myRank} of {leaderboard.length}</div>}
                    {allTimeBest>0&&(
                      <div style={{borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:14}}>
                        <span style={{fontSize:13,color:'#64748b',fontWeight:600}}>All-time PB </span>
                        <span style={{fontSize:13,color:'#e2e8f0',fontWeight:800}}>{allTimeBest} kg</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{padding:'8px 0',textAlign:'center'}}>
                    <div style={{fontSize:36,marginBottom:8}}>{liftMeta.emoji}</div>
                    <div style={{fontSize:14,fontWeight:800,color:'#e2e8f0',marginBottom:4}}>No {liftMeta.label} logged yet</div>
                    <div style={{fontSize:12,color:'#334155'}}>Log a {liftMeta.label} workout to appear here</div>
                  </div>
                )}
              </div>
            </div>

            {/* LEADERBOARD (collapsible) */}
            {isLoading ? (
              <div style={{borderRadius:20,padding:28,textAlign:'center',color:'#334155',fontSize:13,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)'}}>Loading leaderboard…</div>
            ) : (
              <LiftLeaderboard
                leaderboard={leaderboard}
                liftMeta={liftMeta}
                currentUserId={currentUser?.id}
                open={lbOpen}
                onOpen={()=>setLbOpen(true)}
                onClose={()=>setLbOpen(false)}
              />
            )}

            {/* COMMUNITY STATS */}
            <div style={{borderRadius:20,padding:'18px 20px',background:'linear-gradient(135deg,rgba(15,30,65,0.95),rgba(8,16,31,0.98))',border:'1px solid rgba(255,255,255,0.07)',boxShadow:'0 4px 32px rgba(0,0,0,0.4)'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:16}}>
                <Users2 size={14} style={{color:'#64748b'}}/>
                <span style={{fontSize:14,fontWeight:800,color:'#fff'}}>Community Activity</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1px 1fr',gap:0,alignItems:'center'}}>
                <div>
                  <div style={{fontSize:30,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',lineHeight:1}}>{todayLifters}</div>
                  <div style={{fontSize:12,color:'#475569',marginTop:4,fontWeight:600}}>lifters today</div>
                </div>
                <div style={{width:1,height:40,background:'rgba(255,255,255,0.08)'}}/>
                <div style={{paddingLeft:20}}>
                  <div style={{fontSize:30,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',lineHeight:1}}>{leaderboard.length}</div>
                  <div style={{fontSize:12,color:'#475569',marginTop:4,fontWeight:600}}>on leaderboard</div>
                </div>
              </div>
            </div>

            {/* CYCLE LIFT BUTTON */}
            <button
              onClick={()=>{
                const idx=LIFTS.findIndex(l=>l.id===activeLift)
                setActiveLift(LIFTS[(idx+1)%LIFTS.length].id)
                setLbOpen(false)
              }}
              style={{
                width:'100%',padding:'16px',borderRadius:20,border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',
                background:'linear-gradient(135deg,rgba(15,30,65,0.95),rgba(8,16,31,0.98))',
                color:'#e2e8f0',fontSize:15,fontWeight:800,
                display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                boxShadow:'0 4px 32px rgba(0,0,0,0.4)',
              }}
            >
              Compare Other Lifts <ChevronRight style={{width:16,height:16,color:'#64748b'}}/>
            </button>

          </div>
        </div>
      </div>
    </>
  )
}