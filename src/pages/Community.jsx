import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronRight, Trophy, TrendingUp, Users, Flame } from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────────────────────
const LIFTS = [
  { id: 'all',      label: 'All Lifts',      emoji: '⚡', color: '#38bdf8',  keywords: [] },
  { id: 'squat',    label: 'Squat',          emoji: '🦵', color: '#f59e0b',  keywords: ['squat','back squat','front squat'] },
  { id: 'bench',    label: 'Bench Press',    emoji: '💪', color: '#0ea5e9',  keywords: ['bench','bench press','chest press'] },
  { id: 'deadlift', label: 'Deadlift',       emoji: '🏋️', color: '#ef4444', keywords: ['deadlift','dead lift'] },
  { id: 'ohp',      label: 'Overhead Press', emoji: '☝️', color: '#10b981', keywords: ['overhead press','ohp','shoulder press','military press'] },
  { id: 'row',      label: 'Barbell Row',    emoji: '🔁', color: '#a78bfa',  keywords: ['barbell row','bent over row','row'] },
];

const TIME_FILTERS = [
  { id: 'week',  label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all',   label: 'All Time' },
];

function matchLift(name = '') {
  const lower = name.toLowerCase().trim();
  for (const l of LIFTS.filter(l => l.id !== 'all')) {
    if (l.keywords.some(k => lower.includes(k))) return l.id;
  }
  return null;
}

// Flatten WorkoutLog records into individual exercise entries
function flattenWorkoutLogs(logs) {
  const flat = [];
  logs.forEach(log => {
    (log.exercises || []).forEach(ex => {
      const w = parseFloat(ex.weight || 0);
      if (!w) return;
      flat.push({
        user_id:   log.user_id,
        user_name: log.user_name || log.created_by || 'Athlete',
        exercise:  ex.exercise || '',
        weight:    w,
        unit:      'kg',
        logged_date: log.completed_date || log.created_date,
      });
    });
  });
  return flat;
}

function filterByTime(sets, timeId) {
  const now = Date.now();
  if (timeId === 'week')  return sets.filter(s => now - new Date(s.logged_date||0) < 7*86400000);
  if (timeId === 'month') return sets.filter(s => now - new Date(s.logged_date||0) < 30*86400000);
  return sets;
}

function buildLeaderboard(sets, liftId) {
  const best = {};
  sets.forEach(s => {
    const lId = matchLift(s.exercise || '');
    if (liftId !== 'all' && lId !== liftId) return;
    if (!lId) return;
    const w = s.weight;
    if (!w) return;
    const uid = s.user_id;
    if (!best[uid] || w > best[uid].weight) {
      best[uid] = { user_id: uid, user_name: s.user_name || 'Athlete', weight: w, unit: 'kg', history: [] };
    }
  });
  // Build history per user for the active lift
  const history = {};
  sets.forEach(s => {
    const lId = matchLift(s.exercise || '');
    if (liftId !== 'all' && lId !== liftId) return;
    if (!lId) return;
    const uid = s.user_id;
    if (!history[uid]) history[uid] = [];
    if (s.weight) history[uid].push({ weight: s.weight, date: s.logged_date, unit: 'kg' });
  });
  Object.keys(best).forEach(uid => { best[uid].history = (history[uid]||[]).sort((a,b) => new Date(a.date)-new Date(b.date)); });
  return Object.values(best).sort((a,b) => b.weight - a.weight);
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({ options, value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selected = options.find(o => o.id === value);
  return (
    <div ref={ref} style={{ position:'relative', userSelect:'none' }}>
      <button onClick={() => setOpen(o=>!o)} style={{
        display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:12,border:'none',cursor:'pointer',
        background:'rgba(255,255,255,0.07)',backdropFilter:'blur(8px)',
        color:'#e2e8f0',fontSize:13,fontWeight:700,
        outline:'1px solid rgba(255,255,255,0.1)',
      }}>
        {selected?.label || label} <ChevronDown style={{ width:13,height:13,color:'#64748b' }}/>
      </button>
      {open && (
        <div style={{
          position:'absolute',top:'calc(100% + 8px)',right:0,zIndex:50,minWidth:160,
          background:'linear-gradient(160deg,#0f1e3a,#08101f)',
          border:'1px solid rgba(56,189,248,0.2)',borderRadius:14,overflow:'hidden',
          boxShadow:'0 16px 48px rgba(0,0,0,0.6)',
        }}>
          {options.map((o,i) => (
            <button key={o.id} onClick={() => { onChange(o.id); setOpen(false); }} style={{
              display:'flex',alignItems:'center',justifyContent:'space-between',
              width:'100%',padding:'12px 16px',border:'none',cursor:'pointer',textAlign:'left',
              background: value===o.id ? 'rgba(56,189,248,0.12)' : i%2===0?'rgba(255,255,255,0.02)':'transparent',
              color: value===o.id ? '#38bdf8' : '#e2e8f0',
              fontSize:13,fontWeight:value===o.id?700:500,
              borderBottom: i<options.length-1?'1px solid rgba(255,255,255,0.05)':'none',
            }}>
              {o.emoji && <span style={{ marginRight:8 }}>{o.emoji}</span>}
              {o.label}
              {value===o.id && <span style={{ color:'#38bdf8',fontSize:15 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mini Line Chart (SVG) ─────────────────────────────────────────────────────
function ProgressChart({ history, color = '#38bdf8', liftLabel }) {
  if (!history || history.length < 2) return (
    <div style={{ padding:'20px',textAlign:'center',color:'#334155',fontSize:12 }}>Not enough data to show progress</div>
  );

  const W = 320, H = 90, PAD = { l:8, r:8, t:20, b:24 };
  const weights = history.map(h => h.weight);
  const min = Math.min(...weights) * 0.95;
  const max = Math.max(...weights) * 1.02;
  const toX = (i) => PAD.l + (i/(history.length-1))*(W-PAD.l-PAD.r);
  const toY = (w) => PAD.t + (1-(w-min)/(max-min))*(H-PAD.t-PAD.b);

  const pts = history.map((h,i) => ({ x:toX(i), y:toY(h.weight), ...h }));
  const pathD = pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const fmt = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
  };

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.5"/>
          <stop offset="100%" stopColor={color} stopOpacity="1"/>
        </linearGradient>
      </defs>
      {/* Grid line */}
      <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="rgba(255,255,255,0.06)" strokeWidth={1}/>
      {/* Line */}
      <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      {/* Points + labels */}
      {pts.map((p,i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={color} stroke="#0f1e3a" strokeWidth={2}/>
          {(i===0||i===pts.length-1||i===Math.floor(pts.length/2)) && (
            <text x={p.x} y={p.y-8} textAnchor="middle" fill="#fff" fontSize={9} fontWeight="800" fontFamily="Outfit,sans-serif">
              {p.weight}
            </text>
          )}
        </g>
      ))}
      {/* X axis labels */}
      {[0, pts.length-1].map(i => (
        <text key={i} x={pts[i].x} y={H-6} textAnchor={i===0?'start':'end'} fill="#334155" fontSize={9} fontFamily="Outfit,sans-serif">
          {i===pts.length-1 ? 'Today' : fmt(pts[i].date)}
        </text>
      ))}
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Community() {
  const [activeLift, setActiveLift] = useState('bench');
  const [timeFilter, setTimeFilter] = useState('week');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5*60*1000,
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status:'active' }),
    enabled: !!currentUser,
    staleTime: 5*60*1000,
  });

  const gymName = gymMemberships[0]?.gym_name || 'Your Gym';

  const { data: workoutLogs = [], isLoading } = useQuery({
    queryKey: ['communityWorkoutLogs'],
    queryFn: () => base44.entities.WorkoutLog.list(),
    staleTime: 3*60*1000,
  });

  const allSets = useMemo(() => flattenWorkoutLogs(workoutLogs), [workoutLogs]);
  const filteredSets = useMemo(() => filterByTime(allSets, timeFilter), [allSets, timeFilter]);
  const leaderboard  = useMemo(() => buildLeaderboard(filteredSets, activeLift), [filteredSets, activeLift]);

  const myEntry  = leaderboard.find(l => l.user_id === currentUser?.id);
  const myRank   = myEntry ? leaderboard.findIndex(l => l.user_id === currentUser?.id) + 1 : null;
  const myPct    = myRank && leaderboard.length > 1 ? Math.round(((leaderboard.length-myRank)/(leaderboard.length-1))*100) : null;

  // All-time personal best
  const myAllTimeBest = useMemo(() => {
    const mySets = allSets.filter(s => s.user_id === currentUser?.id);
    const liftSets = mySets.filter(s => activeLift==='all' ? matchLift(s.exercise_name||s.exercise||s.name||'') : matchLift(s.exercise_name||s.exercise||s.name||'')===activeLift);
    return liftSets.reduce((best,s) => Math.max(best, parseFloat(s.weight||0)), 0);
  }, [allSets, currentUser?.id, activeLift]);

  // Community activity stats
  const todayLifters = useMemo(() => {
    const today = new Set(allSets.filter(s => Date.now()-new Date(s.logged_date||s.created_date||0)<86400000).map(s=>s.user_id));
    return today.size;
  }, [allSets]);

  const avgWeight = useMemo(() => {
    const w = filteredSets.filter(s => activeLift==='all'?matchLift(s.exercise_name||''):matchLift(s.exercise_name||'')||activeLift===matchLift(s.exercise_name||'')).map(s=>parseFloat(s.weight||0)).filter(Boolean);
    return w.length ? Math.round(w.reduce((a,b)=>a+b,0)/w.length) : 0;
  }, [filteredSets, activeLift]);

  const topThisWeek = useMemo(() => {
    const w7 = filterByTime(allSets,'week').filter(s => activeLift==='all'?matchLift(s.exercise_name||''):matchLift(s.exercise_name||'')||activeLift===matchLift(s.exercise_name||'')).map(s=>parseFloat(s.weight||0));
    return w7.length ? Math.max(...w7) : 0;
  }, [allSets, activeLift]);

  const liftMeta = LIFTS.find(l => l.id === activeLift) || LIFTS[0];
  const pctColor = myPct>=90?'#f59e0b':myPct>=75?'#10b981':'#38bdf8';

  // My progress history for chart
  const myHistory = myEntry?.history || [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; }
      `}</style>

      <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#06090f 0%,#0b1a35 45%,#06090f 100%)', fontFamily:"'Outfit',system-ui,sans-serif", color:'#e2e8f0' }}>
        <div style={{ maxWidth:480, margin:'0 auto', padding:'0 0 32px' }}>

          {/* ── Header ── */}
          <div style={{ padding:'24px 20px 18px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <h1 style={{ fontSize:28,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',margin:0,lineHeight:1 }}>Community Lifts</h1>
              <p style={{ fontSize:13,color:'#475569',margin:'5px 0 0',fontWeight:600 }}>{gymName}</p>
            </div>
            <div style={{ display:'flex',gap:8,marginTop:4 }}>
              <Dropdown
                options={LIFTS}
                value={activeLift}
                onChange={setActiveLift}
              />
              <Dropdown
                options={TIME_FILTERS}
                value={timeFilter}
                onChange={setTimeFilter}
              />
            </div>
          </div>

          <div style={{ padding:'0 14px', display:'flex', flexDirection:'column', gap:12 }}>

            {/* ── Personal Performance Card ── */}
            <div style={{
              borderRadius:20,overflow:'hidden',
              background:'linear-gradient(135deg,rgba(15,30,65,0.95) 0%,rgba(8,16,31,0.98) 100%)',
              border:'1px solid rgba(56,189,248,0.2)',
              boxShadow:'0 4px 32px rgba(0,0,0,0.4)',
            }}>
              <div style={{ padding:'20px 20px 18px' }}>
                {myEntry ? (
                  <>
                    <div style={{ fontSize:13,fontWeight:700,color:'#64748b',marginBottom:6 }}>{liftMeta.label}</div>
                    <div style={{ fontSize:52,fontWeight:900,color:'#fff',letterSpacing:'-0.04em',lineHeight:1,marginBottom:10 }}>
                      {myEntry.weight} <span style={{ fontSize:22,fontWeight:700,color:'#64748b' }}>{myEntry.unit||'kg'}</span>
                    </div>
                    {myPct !== null && (
                      <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:4 }}>
                        <Trophy style={{ width:14,height:14,color:pctColor }}/>
                        <span style={{ fontSize:14,fontWeight:800,color:'#fff' }}>Top {100-myPct}% at {gymName}</span>
                      </div>
                    )}
                    {myRank && (
                      <div style={{ fontSize:13,color:'#64748b',fontWeight:600,marginBottom:14 }}>
                        Rank #{myRank} of {leaderboard.length}
                      </div>
                    )}
                    <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:14 }}>
                      <span style={{ fontSize:13,color:'#64748b',fontWeight:600 }}>PB </span>
                      <span style={{ fontSize:13,color:'#e2e8f0',fontWeight:800 }}>{myAllTimeBest} {myEntry.unit||'kg'}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ padding:'8px 0',textAlign:'center' }}>
                    <div style={{ fontSize:32,marginBottom:8 }}>{liftMeta.emoji}</div>
                    <div style={{ fontSize:14,fontWeight:800,color:'#e2e8f0',marginBottom:4 }}>No {liftMeta.label} data yet</div>
                    <div style={{ fontSize:12,color:'#334155' }}>Log a {liftMeta.label} workout to appear here</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Leaderboard Card ── */}
            <div style={{
              borderRadius:20,overflow:'hidden',
              background:'linear-gradient(135deg,rgba(15,30,65,0.95) 0%,rgba(8,16,31,0.98) 100%)',
              border:'1px solid rgba(255,255,255,0.08)',
              boxShadow:'0 4px 32px rgba(0,0,0,0.4)',
            }}>
              <div style={{ padding:'16px 18px 12px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <span style={{ fontSize:15,fontWeight:800,color:'#fff' }}>{liftMeta.label} Leaderboard</span>
                <span style={{ fontSize:11,color:'#334155',fontWeight:700 }}>{leaderboard.length} athletes</span>
              </div>

              {isLoading ? (
                <div style={{ padding:32,textAlign:'center',color:'#334155',fontSize:13 }}>Loading…</div>
              ) : leaderboard.length === 0 ? (
                <div style={{ padding:'28px 16px',textAlign:'center',color:'#334155',fontSize:13 }}>No data for this period</div>
              ) : (
                leaderboard.slice(0,10).map((entry,i) => {
                  const isMe = entry.user_id === currentUser?.id;
                  const rank = i+1;
                  // Week-over-week change
                  const prevWeek = useMemo ? null : null; // computed inline below
                  return (
                    <div key={entry.user_id||i} style={{
                      display:'flex',alignItems:'center',gap:12,padding:'13px 18px',
                      borderBottom: i<Math.min(leaderboard.length,10)-1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      background: isMe ? 'rgba(56,189,248,0.08)' : 'transparent',
                      borderLeft: isMe ? '3px solid #38bdf8' : '3px solid transparent',
                      transition:'background 0.15s',
                    }}>
                      {/* Rank */}
                      <div style={{ width:28,fontSize:13,fontWeight:900,color:rank===1?'#f59e0b':rank===2?'#94a3b8':rank===3?'#b45309':'#334155',flexShrink:0,textAlign:'center' }}>
                        {rank===1?'🔥':`#${rank}`}
                      </div>
                      {/* Avatar */}
                      <div style={{
                        width:36,height:36,borderRadius:'50%',flexShrink:0,
                        background: isMe ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.07)',
                        border:`2px solid ${isMe?'#38bdf8':'rgba(255,255,255,0.1)'}`,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:13,fontWeight:900,color:isMe?'#38bdf8':'#64748b',
                        overflow:'hidden',flexShrink:0,
                      }}>
                        {entry.avatar_url
                          ? <img src={entry.avatar_url} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                          : (entry.user_name||'A')[0].toUpperCase()
                        }
                      </div>
                      {/* Name */}
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:15,fontWeight:isMe?900:700,color:isMe?'#fff':'#e2e8f0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                          {isMe ? 'You' : entry.user_name}
                        </div>
                      </div>
                      {/* Weight + badge */}
                      <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
                        {isMe && entry.history?.length > 1 && (() => {
                          const prev = entry.history[entry.history.length-2]?.weight;
                          const curr = entry.weight;
                          const diff = curr - prev;
                          if (diff > 0) return (
                            <span style={{ fontSize:10,fontWeight:800,color:'#38bdf8',background:'rgba(56,189,248,0.12)',border:'1px solid rgba(56,189,248,0.25)',borderRadius:99,padding:'2px 7px',display:'flex',alignItems:'center',gap:3 }}>
                              +{diff} {entry.unit||'kg'}
                              <span style={{ color:'#64748b',fontWeight:500 }}>week</span>
                            </span>
                          );
                          return null;
                        })()}
                        <div style={{ fontSize:16,fontWeight:900,color:isMe?'#fff':rank<=3?'#e2e8f0':'#94a3b8',letterSpacing:'-0.02em' }}>
                          {entry.weight} <span style={{ fontSize:11,fontWeight:600,color:'#334155' }}>{entry.unit||'kg'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Community Activity Card ── */}
            <div style={{
              borderRadius:20,padding:'18px 20px',
              background:'linear-gradient(135deg,rgba(15,30,65,0.95) 0%,rgba(8,16,31,0.98) 100%)',
              border:'1px solid rgba(255,255,255,0.08)',
              boxShadow:'0 4px 32px rgba(0,0,0,0.4)',
            }}>
              <div style={{ fontSize:15,fontWeight:800,color:'#fff',marginBottom:14 }}>Community Activity</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1px 1fr 1px 1fr',gap:0,alignItems:'center' }}>
                {/* Lifters today */}
                <div style={{ paddingRight:16 }}>
                  <div style={{ fontSize:22,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',lineHeight:1 }}>
                    {todayLifters} <span style={{ fontSize:12,fontWeight:600,color:'#475569' }}>lifters today</span>
                  </div>
                  <div style={{ fontSize:12,color:'#475569',marginTop:4,fontWeight:600 }}>{avgWeight} {leaderboard[0]?.unit||'kg'}</div>
                </div>
                <div style={{ width:1,height:40,background:'rgba(255,255,255,0.08)' }}/>
                {/* Avg weight */}
                <div style={{ padding:'0 16px',textAlign:'center' }}>
                  <div style={{ fontSize:22,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',lineHeight:1 }}>
                    {avgWeight} <span style={{ fontSize:12,fontWeight:600,color:'#475569' }}>{leaderboard[0]?.unit||'kg'}</span>
                  </div>
                  <div style={{ fontSize:12,color:'#475569',marginTop:4,fontWeight:600 }}>avg {TIME_FILTERS.find(t=>t.id===timeFilter)?.label.toLowerCase()}</div>
                </div>
                <div style={{ width:1,height:40,background:'rgba(255,255,255,0.08)' }}/>
                {/* Top this week */}
                <div style={{ paddingLeft:16,textAlign:'right' }}>
                  <div style={{ fontSize:11,color:'#475569',fontWeight:700,marginBottom:2 }}>Top {liftMeta.label} This Week</div>
                  <div style={{ fontSize:20,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',lineHeight:1 }}>
                    {topThisWeek} <span style={{ fontSize:11,fontWeight:600,color:'#475569' }}>{leaderboard[0]?.unit||'kg'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Progress Chart Card ── */}
            {myHistory.length >= 2 && (
              <div style={{
                borderRadius:20,padding:'18px 20px',
                background:'linear-gradient(135deg,rgba(15,30,65,0.95) 0%,rgba(8,16,31,0.98) 100%)',
                border:'1px solid rgba(255,255,255,0.08)',
                boxShadow:'0 4px 32px rgba(0,0,0,0.4)',
              }}>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:15,fontWeight:800,color:'#fff' }}>Your {liftMeta.label} Progress</div>
                  {myHistory[0]?.date && (
                    <div style={{ fontSize:11,color:'#475569',fontWeight:600,marginTop:2 }}>
                      Since {new Date(myHistory[0].date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                    </div>
                  )}
                </div>
                <ProgressChart history={myHistory} color={liftMeta.color} liftLabel={liftMeta.label}/>
              </div>
            )}

            {/* ── Compare Other Lifts Button ── */}
            <button
              onClick={() => setActiveLift(prev => {
                const idx = LIFTS.findIndex(l => l.id === prev);
                return LIFTS[(idx+1) % LIFTS.length].id;
              })}
              style={{
                width:'100%',padding:'16px',borderRadius:20,border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',
                background:'linear-gradient(135deg,rgba(15,30,65,0.95) 0%,rgba(8,16,31,0.98) 100%)',
                color:'#e2e8f0',fontSize:15,fontWeight:800,letterSpacing:'-0.01em',
                display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                boxShadow:'0 4px 32px rgba(0,0,0,0.4)',
                transition:'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(56,189,248,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}
            >
              Compare Other Lifts <ChevronRight style={{ width:16,height:16,color:'#64748b' }}/>
            </button>

          </div>
        </div>
      </div>
    </>
  );
}