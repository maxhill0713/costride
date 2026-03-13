import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Users, Trophy, Plus, X, Check, Zap, Star, Crown, Flame, Medal } from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────────────────────
const LIFTS = [
  { id: 'overall',  label: 'Overall',  emoji: '⚡', color: '#38bdf8' },
  { id: 'squat',    label: 'Squat',    emoji: '🦵', color: '#f59e0b' },
  { id: 'bench',    label: 'Bench',    emoji: '💪', color: '#0ea5e9' },
  { id: 'deadlift', label: 'Deadlift', emoji: '🏋️', color: '#ef4444' },
  { id: 'ohp',      label: 'OHP',      emoji: '☝️', color: '#10b981' },
  { id: 'row',      label: 'Row',      emoji: '🔁', color: '#a78bfa' },
];

const RANK_GRADIENTS = [
  'linear-gradient(135deg,#f59e0b 0%,#fbbf24 100%)',
  'linear-gradient(135deg,#94a3b8 0%,#cbd5e1 100%)',
  'linear-gradient(135deg,#b45309 0%,#d97706 100%)',
];
const RANK_ICONS = ['🥇','🥈','🥉'];

function getPercentile(rank, total) {
  if (!rank || total < 2) return null;
  return Math.round(((total - rank) / (total - 1)) * 100);
}

function getBadges(myLifts, allLifts, userId) {
  const badges = [];
  LIFTS.filter(l => l.id !== 'overall').forEach(l => {
    const best = {};
    allLifts.filter(r => r.lift_type === l.id).forEach(r => {
      if (!best[r.user_id] || r.weight > best[r.user_id].weight) best[r.user_id] = r;
    });
    const sorted = Object.values(best).sort((a,b) => b.weight - a.weight);
    const rank   = sorted.findIndex(r => r.user_id === userId) + 1;
    const pct    = getPercentile(rank, sorted.length);
    if (pct !== null) {
      if (pct >= 90) badges.push({ label: `Top 10% ${l.label}`, color: '#f59e0b', icon: '🏆', lift: l });
      else if (pct >= 75) badges.push({ label: `Top 25% ${l.label}`, color: '#10b981', icon: '⭐', lift: l });
      else if (pct >= 50) badges.push({ label: `Top 50% ${l.label}`, color: '#0ea5e9', icon: '💪', lift: l });
      if (rank === 1) badges.push({ label: `#1 ${l.label}`, color: '#f59e0b', icon: '👑', lift: l });
    }
  });
  return [...new Map(badges.map(b => [b.label, b])).values()].slice(0, 6);
}

// ─── Log Lift Modal ───────────────────────────────────────────────────────────
function LogLiftModal({ onClose, onSave, existingLifts = {} }) {
  const [lift,   setLift]   = useState('bench');
  const [weight, setWeight] = useState('');
  const [unit,   setUnit]   = useState('kg');
  const [saving, setSaving] = useState(false);

  const liftMeta   = LIFTS.find(l => l.id === lift);
  const existingPR = existingLifts[lift];
  const isNewPR    = weight && Number(weight) > (existingPR || 0);

  const handleSave = async () => {
    if (!weight || isNaN(weight) || Number(weight) <= 0) return;
    setSaving(true);
    await onSave({ lift, weight: Number(weight), unit });
    setSaving(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,0.8)',backdropFilter:'blur(8px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width:'100%',maxWidth:480,background:'linear-gradient(170deg,#0f172a 0%,#020714 100%)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px 24px 0 0',padding:'28px 20px 44px',boxShadow:'0 -20px 60px rgba(0,0,0,0.6)' }}
      >
        {/* Handle bar */}
        <div style={{ width:40,height:4,borderRadius:99,background:'rgba(255,255,255,0.12)',margin:'0 auto 24px' }}/>

        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22 }}>
          <div>
            <div style={{ fontSize:20,fontWeight:900,color:'#fff',letterSpacing:'-0.03em' }}>Log a Lift</div>
            <div style={{ fontSize:12,color:'#475569',marginTop:2 }}>Only saves if it beats your PR</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:8,cursor:'pointer',color:'#64748b',display:'flex' }}>
            <X style={{ width:16,height:16 }}/>
          </button>
        </div>

        {/* Lift grid */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10 }}>Exercise</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
            {LIFTS.filter(l => l.id !== 'overall').map(l => (
              <button key={l.id} onClick={() => setLift(l.id)} style={{
                display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderRadius:12,cursor:'pointer',border:'none',transition:'all 0.15s',
                background: lift===l.id ? `${l.color}20` : 'rgba(255,255,255,0.03)',
                outline: `1px solid ${lift===l.id ? `${l.color}60` : 'rgba(255,255,255,0.07)'}`,
              }}>
                <span style={{ fontSize:16 }}>{l.emoji}</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:12,fontWeight:700,color:lift===l.id?'#fff':'#64748b' }}>{l.label}</div>
                  {existingLifts[l.id] && <div style={{ fontSize:9,color:'#334155',marginTop:1 }}>PR {existingLifts[l.id]}{unit}</div>}
                </div>
                {lift===l.id && <div style={{ marginLeft:'auto',width:6,height:6,borderRadius:'50%',background:l.color }}/>}
              </button>
            ))}
          </div>
        </div>

        {/* Weight */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10 }}>Weight</div>
          <div style={{ display:'flex',gap:8 }}>
            <input
              type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0"
              style={{ flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'14px',fontSize:28,fontWeight:900,color:'#fff',outline:'none',textAlign:'center',fontFamily:'inherit' }}
            />
            <div style={{ display:'flex',flexDirection:'column',borderRadius:12,overflow:'hidden',border:'1px solid rgba(255,255,255,0.1)' }}>
              {['kg','lbs'].map(u => (
                <button key={u} onClick={() => setUnit(u)} style={{
                  flex:1,padding:'0 16px',fontSize:12,fontWeight:700,cursor:'pointer',border:'none',transition:'all 0.15s',
                  background: unit===u ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.03)',
                  color: unit===u ? '#38bdf8' : '#334155',
                }}>{u}</button>
              ))}
            </div>
          </div>
          {isNewPR && existingPR && (
            <div style={{ marginTop:10,padding:'8px 12px',borderRadius:10,background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.25)',fontSize:12,color:'#f59e0b',fontWeight:700 }}>
              🎉 New PR! +{(Number(weight)-existingPR).toFixed(1)}{unit} over your current best
            </div>
          )}
          {isNewPR && !existingPR && (
            <div style={{ marginTop:10,padding:'8px 12px',borderRadius:10,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.25)',fontSize:12,color:'#10b981',fontWeight:700 }}>
              🔥 First logged {liftMeta?.label} — it's on the board!
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={!weight||saving} style={{
          width:'100%',padding:'15px',borderRadius:14,border:'none',cursor:weight?'pointer':'not-allowed',
          background: weight ? `linear-gradient(135deg,${liftMeta?.color},${liftMeta?.color}cc)` : 'rgba(255,255,255,0.05)',
          color: weight?'#fff':'#1e293b', fontSize:15,fontWeight:800,letterSpacing:'-0.01em',
          display:'flex',alignItems:'center',justifyContent:'center',gap:8,
          boxShadow: weight ? `0 6px 24px ${liftMeta?.color}45` : 'none',transition:'all 0.2s',
        }}>
          {saving ? 'Saving…' : <><Check style={{ width:16,height:16 }}/> Save Lift</>}
        </button>
      </div>
    </div>
  );
}

// ─── Leaderboard Row ──────────────────────────────────────────────────────────
function LeaderRow({ entry, rank, isMe, color, animDelay = 0 }) {
  const top3 = rank <= 3;
  return (
    <div style={{
      display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:14,
      background: isMe
        ? `linear-gradient(135deg,${color}18 0%,${color}08 100%)`
        : top3 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isMe ? `${color}50` : top3 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
      boxShadow: isMe ? `0 0 20px ${color}20, inset 0 0 0 1px ${color}30` : 'none',
      position:'relative', overflow:'hidden',
      animation: `fadeSlideIn 0.4s ease ${animDelay}s both`,
    }}>
      {/* Left glow for user row */}
      {isMe && <div style={{ position:'absolute',left:0,top:0,bottom:0,width:3,background:`linear-gradient(to bottom,${color},${color}88)`,borderRadius:'0 2px 2px 0' }}/>}

      {/* Rank badge */}
      <div style={{
        width:32,height:32,borderRadius:10,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
        background: top3 ? RANK_GRADIENTS[rank-1] : 'rgba(255,255,255,0.06)',
        fontSize: top3?15:11, fontWeight:900, color: top3?'#fff':'#334155',
        boxShadow: top3 ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
      }}>
        {top3 ? RANK_ICONS[rank-1] : `#${rank}`}
      </div>

      {/* Avatar */}
      <div style={{
        width:36,height:36,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
        background: isMe ? `linear-gradient(135deg,${color}50,${color}20)` : 'rgba(255,255,255,0.08)',
        fontSize:13,fontWeight:900,color: isMe?color:'#64748b',
        border:`2px solid ${isMe?color:'rgba(255,255,255,0.08)'}`,
        boxShadow: isMe ? `0 0 12px ${color}40` : 'none',
      }}>
        {(entry.user_name||'?')[0].toUpperCase()}
      </div>

      {/* Name + gym */}
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
          <span style={{ fontSize:14,fontWeight:isMe?900:700,color:isMe?'#fff':'#e2e8f0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
            {entry.user_name||'Athlete'}
          </span>
          {isMe && (
            <span style={{ fontSize:9,fontWeight:900,color:color,background:`${color}20`,border:`1px solid ${color}40`,borderRadius:99,padding:'1px 6px',flexShrink:0 }}>
              YOU ⭐
            </span>
          )}
          {rank===1 && !isMe && <span style={{ fontSize:11 }}>🔥</span>}
        </div>
        {entry.gym_name && (
          <div style={{ fontSize:10,color:'#334155',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{entry.gym_name}</div>
        )}
      </div>

      {/* Weight */}
      <div style={{ textAlign:'right',flexShrink:0 }}>
        <div style={{ fontSize:17,fontWeight:900,color:isMe?color:top3?'#fff':'#64748b',letterSpacing:'-0.02em',lineHeight:1 }}>
          {entry.weight}
          <span style={{ fontSize:11,fontWeight:600,color:'#334155',marginLeft:2 }}>{entry.unit||'kg'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Community() {
  const [activeLift, setActiveLift] = useState('overall');
  const [showModal,  setShowModal]  = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5*60*1000,
  });

  const { data: allLifts = [], isLoading } = useQuery({
    queryKey: ['communityLifts'],
    queryFn: () => base44.entities.LiftRecord.list(),
    staleTime: 2*60*1000,
  });

  const { data: myLifts = [] } = useQuery({
    queryKey: ['myLifts', currentUser?.id],
    queryFn: () => base44.entities.LiftRecord.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 2*60*1000,
  });

  const saveLift = useMutation({
    mutationFn: async ({ lift, weight, unit }) => {
      const existing = myLifts.find(l => l.lift_type === lift);
      if (existing) {
        if (weight > existing.weight)
          return base44.entities.LiftRecord.update(existing.id, { weight, unit, updated_date: new Date().toISOString() });
      } else {
        return base44.entities.LiftRecord.create({
          user_id: currentUser.id,
          user_name: currentUser.full_name || currentUser.email?.split('@')[0] || 'You',
          lift_type: lift, weight, unit,
          logged_date: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityLifts']);
      queryClient.invalidateQueries(['myLifts', currentUser?.id]);
    },
  });

  // Build leaderboard — for "overall" sum the best of all lifts per user
  const leaderboard = useMemo(() => {
    if (activeLift === 'overall') {
      const totals = {};
      LIFTS.filter(l => l.id !== 'overall').forEach(l => {
        const best = {};
        allLifts.filter(r => r.lift_type === l.id).forEach(r => {
          if (!best[r.user_id] || r.weight > best[r.user_id].weight) best[r.user_id] = r;
        });
        Object.values(best).forEach(r => {
          if (!totals[r.user_id]) totals[r.user_id] = { user_id:r.user_id, user_name:r.user_name, gym_name:r.gym_name, weight:0, unit:'kg' };
          totals[r.user_id].weight += r.weight;
        });
      });
      return Object.values(totals).sort((a,b) => b.weight - a.weight);
    }
    const best = {};
    allLifts.filter(r => r.lift_type === activeLift).forEach(r => {
      if (!best[r.user_id] || r.weight > best[r.user_id].weight) best[r.user_id] = r;
    });
    return Object.values(best).sort((a,b) => b.weight - a.weight);
  }, [allLifts, activeLift]);

  const myRank   = currentUser ? leaderboard.findIndex(l => l.user_id === currentUser.id) + 1 : null;
  const myEntry  = leaderboard.find(l => l.user_id === currentUser?.id);
  const myPct    = getPercentile(myRank||null, leaderboard.length);
  const liftMeta = LIFTS.find(l => l.id === activeLift);
  const myRecord = activeLift === 'overall' ? myEntry : myLifts.find(l => l.lift_type === activeLift);

  const existingLifts = useMemo(() => {
    const m = {}; myLifts.forEach(l => { m[l.lift_type] = l.weight; }); return m;
  }, [myLifts]);

  const badges = useMemo(() => currentUser ? getBadges(myLifts, allLifts, currentUser.id) : [], [myLifts, allLifts, currentUser]);

  const pctColor = myPct >= 90 ? '#f59e0b' : myPct >= 75 ? '#10b981' : myPct >= 50 ? '#0ea5e9' : '#64748b';
  const pctLabel = myPct >= 90 ? `Top ${100-myPct}%` : myPct >= 50 ? `Top ${100-myPct}%` : myRank ? `Rank #${myRank}` : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseGlow   { 0%,100% { box-shadow:0 0 20px rgba(56,189,248,0.3); } 50% { box-shadow:0 0 40px rgba(56,189,248,0.6); } }
        @keyframes shimmer     { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        .lift-tab::-webkit-scrollbar { display:none; }
      `}</style>

      <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#020714 0%,#041230 50%,#020714 100%)', fontFamily:"'Outfit',system-ui,sans-serif", color:'#e2e8f0' }}>
        <div style={{ maxWidth:480, margin:'0 auto', padding:'0 0 100px' }}>

          {/* ── Header ── */}
          <div style={{
            padding:'20px 20px 16px',
            background:'rgba(2,7,20,0.8)',
            backdropFilter:'blur(20px)',
            WebkitBackdropFilter:'blur(20px)',
            borderBottom:'1px solid rgba(56,189,248,0.1)',
            position:'sticky', top:0, zIndex:10,
          }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:34,height:34,borderRadius:10,background:'rgba(56,189,248,0.12)',border:'1px solid rgba(56,189,248,0.25)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Users style={{ width:16,height:16,color:'#38bdf8' }}/>
                </div>
                <div>
                  <div style={{
                    fontSize:20,fontWeight:900,letterSpacing:'-0.03em',lineHeight:1,
                    background:'linear-gradient(135deg,#e0f2fe 0%,#38bdf8 60%,#818cf8 100%)',
                    WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
                  }}>Community Lifts</div>
                  <div style={{ fontSize:11,color:'#334155',marginTop:1,fontWeight:600 }}>Compare your lifts with your gym</div>
                </div>
              </div>
              <button onClick={() => setShowModal(true)} style={{
                display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:12,border:'none',cursor:'pointer',
                background:'linear-gradient(135deg,#0ea5e9,#0284c7)',
                color:'#fff',fontSize:12,fontWeight:800,
                boxShadow:'0 4px 16px rgba(14,165,233,0.4)',
              }}>
                <Plus style={{ width:13,height:13 }}/> Log
              </button>
            </div>
          </div>

          <div style={{ padding:'20px 16px', display:'flex', flexDirection:'column', gap:18 }}>

            {/* ── Lift Selector Tabs ── */}
            <div className="lift-tab" style={{ display:'flex',gap:6,overflowX:'auto',paddingBottom:2 }}>
              {LIFTS.map(l => {
                const isActive = activeLift === l.id;
                return (
                  <button key={l.id} onClick={() => setActiveLift(l.id)} style={{
                    display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:99,border:'none',cursor:'pointer',flexShrink:0,transition:'all 0.2s',
                    background: isActive
                      ? 'linear-gradient(135deg,#0ea5e9,#0284c7)'
                      : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#fff' : '#475569',
                    fontSize:12,fontWeight:isActive?800:600,
                    outline: isActive ? 'none' : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: isActive ? '0 4px 14px rgba(14,165,233,0.4)' : 'none',
                  }}>
                    <span style={{ fontSize:13 }}>{l.emoji}</span> {l.label}
                  </button>
                );
              })}
            </div>

            {/* ── Personal Performance Card ── */}
            {myRecord ? (
              <div style={{
                borderRadius:20,overflow:'hidden',position:'relative',
                background:'linear-gradient(135deg,rgba(14,165,233,0.18) 0%,rgba(2,132,199,0.08) 50%,rgba(6,182,212,0.12) 100%)',
                border:'1px solid rgba(56,189,248,0.3)',
                boxShadow:'0 8px 40px rgba(14,165,233,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                animation:'pulseGlow 4s ease-in-out infinite',
              }}>
                {/* Decorative glow orb */}
                <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(14,165,233,0.12)',filter:'blur(40px)',pointerEvents:'none' }}/>

                <div style={{ padding:'20px 20px 18px', position:'relative' }}>
                  <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:11,fontWeight:700,color:'#38bdf8',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>
                        Your {liftMeta.label}
                      </div>
                      <div style={{ fontSize:46,fontWeight:900,color:'#fff',letterSpacing:'-0.04em',lineHeight:1 }}>
                        {myRecord.weight}
                        <span style={{ fontSize:18,fontWeight:700,color:'#38bdf8',marginLeft:5 }}>{myRecord.unit||'kg'}</span>
                      </div>
                      {myRank && myPct !== null && (
                        <div style={{ marginTop:10,display:'flex',alignItems:'center',gap:6 }}>
                          <div style={{
                            display:'inline-flex',alignItems:'center',gap:6,
                            padding:'6px 12px',borderRadius:99,
                            background:`${pctColor}20`,border:`1px solid ${pctColor}45`,
                          }}>
                            <Trophy style={{ width:12,height:12,color:pctColor }}/>
                            <span style={{ fontSize:12,fontWeight:800,color:pctColor }}>{pctLabel} at your gym</span>
                          </div>
                        </div>
                      )}
                      {myRank && myPct !== null && (
                        <div style={{ marginTop:8,fontSize:12,color:'#64748b',fontWeight:600 }}>
                          Stronger than <span style={{ color:'#e2e8f0',fontWeight:800 }}>{myPct}%</span> of your gym community
                        </div>
                      )}
                    </div>
                    <div style={{
                      width:52,height:52,borderRadius:16,flexShrink:0,
                      background:'linear-gradient(135deg,rgba(245,158,11,0.3),rgba(245,158,11,0.1))',
                      border:'1px solid rgba(245,158,11,0.4)',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,
                      boxShadow:'0 4px 16px rgba(245,158,11,0.3)',
                    }}>🏆</div>
                  </div>

                  {/* Mini stats */}
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,paddingTop:14,borderTop:'1px solid rgba(56,189,248,0.15)' }}>
                    {[
                      { label:'Personal Best', value:`${myRecord.weight} ${myRecord.unit||'kg'}` },
                      { label:'Gym Rank',       value: myRank ? `#${myRank} / ${leaderboard.length}` : '—' },
                    ].map((s,i) => (
                      <div key={i} style={{ background:'rgba(0,0,0,0.2)',borderRadius:12,padding:'10px 12px' }}>
                        <div style={{ fontSize:10,fontWeight:700,color:'#334155',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4 }}>{s.label}</div>
                        <div style={{ fontSize:16,fontWeight:900,color:'#fff',letterSpacing:'-0.02em' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                borderRadius:20,padding:'24px 20px',textAlign:'center',
                background:'rgba(255,255,255,0.02)',border:'1px dashed rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize:36,marginBottom:10 }}>{liftMeta.emoji}</div>
                <div style={{ fontSize:15,fontWeight:800,color:'#e2e8f0',marginBottom:6 }}>No {liftMeta.label} logged yet</div>
                <div style={{ fontSize:12,color:'#334155',marginBottom:16 }}>Log your lift to appear on the leaderboard</div>
                <button onClick={() => setShowModal(true)} style={{
                  padding:'10px 24px',borderRadius:12,border:'none',cursor:'pointer',
                  background:'linear-gradient(135deg,#0ea5e9,#0284c7)',
                  color:'#fff',fontSize:13,fontWeight:800,
                  boxShadow:'0 4px 16px rgba(14,165,233,0.35)',
                }}>
                  <Plus style={{ width:13,height:13,display:'inline',marginRight:6,verticalAlign:'middle' }}/>
                  Log {liftMeta.label}
                </button>
              </div>
            )}

            {/* ── Achievement Badges ── */}
            {badges.length > 0 && (
              <div>
                <div style={{ fontSize:11,fontWeight:800,color:'#334155',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10 }}>Your Achievements</div>
                <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                  {badges.map((b,i) => (
                    <div key={i} style={{
                      display:'flex',alignItems:'center',gap:6,padding:'7px 12px',borderRadius:99,
                      background:`${b.color}15`,border:`1px solid ${b.color}35`,
                      fontSize:12,fontWeight:700,color:b.color,
                    }}>
                      <span style={{ fontSize:14 }}>{b.icon}</span> {b.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Leaderboard ── */}
            <div style={{ borderRadius:20,overflow:'hidden',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)' }}>
              {/* Board header */}
              <div style={{
                padding:'14px 18px',
                background:'linear-gradient(135deg,rgba(14,165,233,0.1),rgba(6,182,212,0.05))',
                borderBottom:'1px solid rgba(255,255,255,0.07)',
                display:'flex',alignItems:'center',justifyContent:'space-between',
              }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <Trophy style={{ width:14,height:14,color:'#f59e0b' }}/>
                  <span style={{ fontSize:14,fontWeight:900,color:'#fff',letterSpacing:'-0.01em' }}>
                    {liftMeta.label} Leaderboard
                  </span>
                </div>
                <span style={{ fontSize:11,fontWeight:700,color:'#334155',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:99,padding:'3px 10px' }}>
                  {leaderboard.length} athletes
                </span>
              </div>

              <div style={{ padding:10,display:'flex',flexDirection:'column',gap:5 }}>
                {isLoading ? (
                  <div style={{ padding:40,textAlign:'center',color:'#334155',fontSize:13 }}>Loading leaderboard…</div>
                ) : leaderboard.length === 0 ? (
                  <div style={{ padding:'36px 16px',textAlign:'center' }}>
                    <div style={{ fontSize:36,marginBottom:10 }}>{liftMeta.emoji}</div>
                    <div style={{ fontSize:14,fontWeight:700,color:'#e2e8f0',marginBottom:6 }}>No entries yet</div>
                    <div style={{ fontSize:12,color:'#334155' }}>Be the first to set a {liftMeta.label} record!</div>
                  </div>
                ) : (
                  leaderboard.map((entry, i) => (
                    <LeaderRow
                      key={entry.user_id||i}
                      entry={entry}
                      rank={i+1}
                      isMe={entry.user_id === currentUser?.id}
                      color={liftMeta.color}
                      animDelay={i * 0.04}
                    />
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {showModal && (
          <LogLiftModal
            onClose={() => setShowModal(false)}
            onSave={saveLift.mutateAsync}
            existingLifts={existingLifts}
          />
        )}
      </div>
    </>
  );
}
