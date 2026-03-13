import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { base44 } from '@/api/base44Client'
import { ChevronDown, ChevronRight, Trophy, Users2 } from 'lucide-react'

/* ───────────────── LIFTS CONFIG ───────────────── */

const LIFTS = [
  { id: 'all', label: 'All Lifts', short: 'All', emoji: '⚡', color: '#38bdf8', glow: 'rgba(56,189,248,0.3)', keywords: [] },
  { id: 'squat', label: 'Squat', short: 'Squat', emoji: '🦵', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', keywords: ['squat','back squat','front squat'] },
  { id: 'bench', label: 'Bench Press', short: 'Bench', emoji: '💪', color: '#0ea5e9', glow: 'rgba(14,165,233,0.3)', keywords: ['bench','bench press'] },
  { id: 'deadlift', label: 'Deadlift', short: 'Dead', emoji: '🏋️', color: '#f43f5e', glow: 'rgba(244,63,94,0.3)', keywords: ['deadlift'] },
  { id: 'ohp', label: 'Overhead Press', short: 'OHP', emoji: '☝️', color: '#10b981', glow: 'rgba(16,185,129,0.3)', keywords: ['overhead press','ohp'] },
]

const TIME_FILTERS = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
]

/* ───────────────── HELPERS ───────────────── */

function matchLift(name=''){
  const lower = name.toLowerCase()
  for (const lift of LIFTS.filter(l => l.id !== 'all')){
    if (lift.keywords.some(k => lower.includes(k))) return lift.id
  }
  return null
}

function filterByTime(sets, filter){
  const now = Date.now()

  if(filter === 'week')
    return sets.filter(s => now - new Date(s.logged_date || s.created_date) < 7*86400000)

  if(filter === 'month')
    return sets.filter(s => now - new Date(s.logged_date || s.created_date) < 30*86400000)

  return sets
}

function buildLeaderboard(sets, liftId){

  const best = {}

  sets.forEach(s => {

    const lId = matchLift(s.exercise_name || '')
    if(!lId) return
    if(liftId !== 'all' && lId !== liftId) return

    const weight = parseFloat(s.weight || 0)
    if(!weight) return

    const uid = s.user_id

    if(!best[uid] || weight > best[uid].weight){
      best[uid] = {
        user_id: uid,
        user_name: s.user_name || 'Athlete',
        weight,
        unit: s.unit || 'kg'
      }
    }

  })

  return Object.values(best).sort((a,b)=>b.weight-a.weight)
}

/* ───────────────── DROPDOWN ───────────────── */

function Dropdown({options,value,onChange}){

  const [open,setOpen] = useState(false)
  const ref = useRef()

  useEffect(()=>{

    const fn = e => {
      if(ref.current && !ref.current.contains(e.target)) setOpen(false)
    }

    document.addEventListener('mousedown',fn)
    return ()=>document.removeEventListener('mousedown',fn)

  },[])

  const selected = options.find(o=>o.id===value)

  return (

    <div ref={ref} style={{position:'relative'}}>

      <button
        onClick={()=>setOpen(o=>!o)}
        style={{
          padding:'9px 14px',
          borderRadius:12,
          border:'none',
          background:'rgba(15,30,60,0.9)',
          outline:'1px solid rgba(255,255,255,0.1)',
          color:'#e2e8f0',
          fontWeight:700,
          fontSize:13,
          display:'flex',
          alignItems:'center',
          gap:6
        }}
      >
        {selected?.label}
        <ChevronDown size={12}/>
      </button>

      {open && (
        <div style={{
          position:'absolute',
          top:'110%',
          right:0,
          minWidth:170,
          borderRadius:14,
          overflow:'hidden',
          background:'#0d1e3d',
          border:'1px solid rgba(255,255,255,0.1)',
          zIndex:10
        }}>
          {options.map(o=>(
            <button
              key={o.id}
              onClick={()=>{onChange(o.id);setOpen(false)}}
              style={{
                width:'100%',
                padding:'12px 16px',
                border:'none',
                background:value===o.id?'rgba(56,189,248,0.1)':'transparent',
                color:value===o.id?'#38bdf8':'#94a3b8',
                textAlign:'left'
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

    </div>
  )
}

/* ───────────────── RANK BADGE ───────────────── */

function RankBadge({rank}){

  const medals=['🥇','🥈','🥉']

  if(rank<=3){
    return <span style={{fontSize:18}}>{medals[rank-1]}</span>
  }

  return <span style={{fontWeight:800,color:'#475569'}}>#{rank}</span>
}

/* ───────────────── MAIN COMPONENT ───────────────── */

export default function Community(){

  const [activeLift,setActiveLift]=useState('bench')
  const [timeFilter,setTimeFilter]=useState('week')

  const {data:currentUser}=useQuery({
    queryKey:['currentUser'],
    queryFn:()=>base44.auth.me()
  })

  const {data:allSets=[]}=useQuery({
    queryKey:['communitySets'],
    queryFn:()=>base44.entities.WorkoutSet.list()
  })

  const filteredSets = useMemo(
    ()=>filterByTime(allSets,timeFilter),
    [allSets,timeFilter]
  )

  const leaderboard = useMemo(
    ()=>buildLeaderboard(filteredSets,activeLift),
    [filteredSets,activeLift]
  )

  const liftMeta = LIFTS.find(l=>l.id===activeLift)

  const myEntry = leaderboard.find(l=>l.user_id===currentUser?.id)
  const myRank = myEntry ? leaderboard.indexOf(myEntry)+1 : null

  const todayLifters = useMemo(
    ()=>new Set(allSets.map(s=>s.user_id)).size,
    [allSets]
  )

  const avgWeight = useMemo(()=>{
    const ws = filteredSets.map(s=>parseFloat(s.weight||0)).filter(Boolean)
    return ws.length ? Math.round(ws.reduce((a,b)=>a+b)/ws.length) : 0
  },[filteredSets])

  const cycleLift = ()=>{
    const idx = LIFTS.findIndex(l=>l.id===activeLift)
    setActiveLift(LIFTS[(idx+1)%LIFTS.length].id)
  }

  /* ───────────────── UI ───────────────── */

  return (

  <div style={{
    minHeight:'100vh',
    background:'#07090f',
    color:'#e2e8f0',
    fontFamily:'Sora,system-ui'
  }}>

  <div style={{maxWidth:480,margin:'0 auto',paddingBottom:40}}>

  {/* HEADER */}

  <div style={{padding:'28px 20px',display:'flex',justifyContent:'space-between'}}>

    <div>
      <h1 style={{fontSize:30,fontWeight:900,margin:0}}>Community Lifts</h1>
    </div>

    <div style={{display:'flex',gap:8}}>
      <Dropdown options={LIFTS} value={activeLift} onChange={setActiveLift}/>
      <Dropdown options={TIME_FILTERS} value={timeFilter} onChange={setTimeFilter}/>
    </div>

  </div>

  <div style={{padding:'0 14px',display:'flex',flexDirection:'column',gap:14}}>

  {/* PERSONAL CARD */}

  <div style={{
    borderRadius:22,
    padding:24,
    background:'linear-gradient(150deg,#0b162e,#050a16)',
    border:'1px solid rgba(255,255,255,0.06)'
  }}>

  {myEntry ? (

  <>
  <div style={{fontSize:12,color:'#64748b',marginBottom:10}}>
    {liftMeta.label}
  </div>

  <div style={{fontSize:60,fontWeight:900,lineHeight:1}}>
    {myEntry.weight}
    <span style={{fontSize:20,color:'#475569'}}> {myEntry.unit}</span>
  </div>

  {myRank && (
  <div style={{marginTop:12,fontSize:14}}>
    Rank #{myRank}
  </div>
  )}

  </>

  ) : (

  <div style={{textAlign:'center'}}>
    <div style={{fontSize:36}}>{liftMeta.emoji}</div>
    <div>No {liftMeta.label} logged yet</div>
  </div>

  )}

  </div>

  {/* LEADERBOARD */}

  <div style={{
    borderRadius:22,
    background:'linear-gradient(150deg,#0b162e,#050a16)',
    border:'1px solid rgba(255,255,255,0.06)'
  }}>

  <div style={{
    padding:18,
    borderBottom:'1px solid rgba(255,255,255,0.05)',
    fontWeight:800
  }}>
    {liftMeta.label} Leaderboard
  </div>

  {leaderboard.slice(0,10).map((entry,i)=>{

  const rank=i+1
  const isMe=entry.user_id===currentUser?.id

  return (

  <div key={entry.user_id}
  style={{
    display:'flex',
    alignItems:'center',
    padding:'12px 18px',
    gap:12,
    background:isMe?'rgba(56,189,248,0.06)':'transparent'
  }}>

  <RankBadge rank={rank}/>

  <div style={{flex:1}}>
    {isMe ? 'You' : entry.user_name}
  </div>

  <div style={{fontWeight:900}}>
    {entry.weight} {entry.unit}
  </div>

  </div>

  )

  })}

  </div>

  {/* COMMUNITY STATS */}

  <div style={{
    borderRadius:22,
    padding:20,
    background:'linear-gradient(150deg,#0b162e,#050a16)',
    border:'1px solid rgba(255,255,255,0.06)'
  }}>

  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:16}}>
    <Users2 size={14}/>
    <span style={{fontWeight:800}}>Community Activity</span>
  </div>

  <div style={{display:'flex',justifyContent:'space-between'}}>

  <div>
    <div style={{fontSize:28,fontWeight:900}}>{todayLifters}</div>
    <div style={{fontSize:12,color:'#64748b'}}>lifters today</div>
  </div>

  <div>
    <div style={{fontSize:28,fontWeight:900}}>{avgWeight}</div>
    <div style={{fontSize:12,color:'#64748b'}}>avg weight</div>
  </div>

  </div>

  </div>

  {/* BUTTON */}

  <button
  onClick={cycleLift}
  style={{
    padding:18,
    borderRadius:22,
    border:'1px solid rgba(255,255,255,0.07)',
    background:'linear-gradient(150deg,#0b162e,#050a16)',
    color:'#94a3b8',
    fontWeight:800,
    display:'flex',
    justifyContent:'center',
    alignItems:'center',
    gap:8
  }}
  >
  Compare Other Lifts
  <ChevronRight size={16}/>
  </button>

  </div>

  </div>

  </div>

  )
}