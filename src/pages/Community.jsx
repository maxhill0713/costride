import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Plus, X, Check } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const LIFTS = [
  { id: 'squat',    label: 'Back Squat',     emoji: '🦵', color: '#f59e0b' },
  { id: 'bench',    label: 'Bench Press',    emoji: '💪', color: '#0ea5e9' },
  { id: 'deadlift', label: 'Deadlift',       emoji: '🏋️', color: '#ef4444' },
  { id: 'ohp',      label: 'Overhead Press', emoji: '☝️', color: '#10b981' },
  { id: 'row',      label: 'Barbell Row',    emoji: '🔁', color: '#a78bfa' },
];

const RANK_ICONS = ['🥇', '🥈', '🥉'];
const RANK_BG    = [
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#94a3b8,#64748b)',
  'linear-gradient(135deg,#b45309,#92400e)',
];

// ── Log Lift Modal ─────────────────────────────────────────────────────────────
function LogLiftModal({ onClose, onSave, existingLifts = {} }) {
  const [lift,   setLift]   = useState(LIFTS[0].id);
  const [weight, setWeight] = useState('');
  const [unit,   setUnit]   = useState('kg');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!weight || isNaN(weight) || Number(weight) <= 0) return;
    setSaving(true);
    await onSave({ lift, weight: Number(weight), unit });
    setSaving(false);
    onClose();
  };

  const liftMeta   = LIFTS.find(l => l.id === lift);
  const existingPR = existingLifts[lift];
  const isNewPR    = weight && Number(weight) > (existingPR || 0);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 480, background: 'linear-gradient(160deg,#0f172a,#020714)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Log a Lift</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* Lift picker */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Exercise</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {LIFTS.map(l => (
              <button key={l.id} onClick={() => setLift(l.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: lift === l.id ? `${l.color}1a` : 'rgba(255,255,255,0.03)',
                outline: `1px solid ${lift === l.id ? `${l.color}55` : 'rgba(255,255,255,0.07)'}`,
              }}>
                <span style={{ fontSize: 17 }}>{l.emoji}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: lift === l.id ? '#fff' : '#94a3b8', textAlign: 'left' }}>{l.label}</span>
                {existingLifts[l.id] && (
                  <span style={{ fontSize: 10, color: '#334155', fontWeight: 600 }}>PR {existingLifts[l.id]}{unit}</span>
                )}
                {lift === l.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Weight input */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Weight</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0"
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px 16px', fontSize: 22, fontWeight: 900, color: '#fff', outline: 'none', textAlign: 'center', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              {['kg', 'lbs'].map(u => (
                <button key={u} onClick={() => setUnit(u)} style={{
                  padding: '0 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  background: unit === u ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.03)',
                  color: unit === u ? '#38bdf8' : '#475569',
                }}>{u}</button>
              ))}
            </div>
          </div>
          {isNewPR && existingPR && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>
              🎉 New PR! +{(Number(weight) - existingPR).toFixed(1)}{unit} over your current best
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={!weight || saving} style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          cursor: weight ? 'pointer' : 'not-allowed',
          background: weight ? `linear-gradient(135deg,${liftMeta.color},${liftMeta.color}cc)` : 'rgba(255,255,255,0.05)',
          color: weight ? '#fff' : '#334155', fontSize: 14, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: weight ? `0 4px 20px ${liftMeta.color}40` : 'none', transition: 'all 0.2s',
        }}>
          {saving ? 'Saving…' : <><Check style={{ width: 15, height: 15 }} /> Save Lift</>}
        </button>
      </div>
    </div>
  );
}

// ── Leaderboard Row ────────────────────────────────────────────────────────────
function LeaderRow({ entry, rank, isMe, color }) {
  const top3 = rank <= 3;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12,
      background: isMe ? `${color}12` : top3 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isMe ? `${color}45` : top3 ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)'}`,
    }}>
      {/* Rank */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: top3 ? RANK_BG[rank - 1] : 'rgba(255,255,255,0.05)',
        fontSize: top3 ? 14 : 11, fontWeight: 800, color: top3 ? '#fff' : '#475569',
      }}>
        {top3 ? RANK_ICONS[rank - 1] : rank}
      </div>
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isMe ? `${color}30` : 'rgba(255,255,255,0.07)',
        fontSize: 11, fontWeight: 800, color: isMe ? color : '#94a3b8',
        border: isMe ? `2px solid ${color}` : '2px solid transparent',
      }}>
        {(entry.user_name || 'M')[0].toUpperCase()}
      </div>
      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: isMe ? 800 : 600, color: isMe ? '#fff' : '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.user_name || 'Athlete'}
          {isMe && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 900, color, background: `${color}20`, border: `1px solid ${color}40`, borderRadius: 99, padding: '1px 6px', verticalAlign: 'middle' }}>YOU</span>}
        </div>
      </div>
      {/* Weight */}
      <div style={{ fontSize: 17, fontWeight: 900, color: top3 || isMe ? '#fff' : '#94a3b8', letterSpacing: '-0.02em', flexShrink: 0 }}>
        {entry.weight}<span style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginLeft: 2 }}>{entry.unit || 'kg'}</span>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Community() {
  const [activeLift, setActiveLift] = useState('squat');
  const [showModal,  setShowModal]  = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn:  () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allLifts = [], isLoading } = useQuery({
    queryKey: ['communityLifts'],
    queryFn:  () => base44.entities.LiftRecord.list(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: myLifts = [] } = useQuery({
    queryKey: ['myLifts', currentUser?.id],
    queryFn:  () => base44.entities.LiftRecord.filter({ user_id: currentUser.id }),
    enabled:  !!currentUser,
    staleTime: 2 * 60 * 1000,
  });

  const saveLift = useMutation({
    mutationFn: async ({ lift, weight, unit }) => {
      const existing = myLifts.find(l => l.lift_type === lift);
      if (existing) {
        if (weight > existing.weight)
          return base44.entities.LiftRecord.update(existing.id, { weight, unit, updated_date: new Date().toISOString() });
      } else {
        return base44.entities.LiftRecord.create({
          user_id:     currentUser.id,
          user_name:   currentUser.full_name || currentUser.email?.split('@')[0] || 'You',
          lift_type:   lift,
          weight, unit,
          logged_date: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityLifts']);
      queryClient.invalidateQueries(['myLifts', currentUser?.id]);
    },
  });

  // Best per user for active lift
  const leaderboard = useMemo(() => {
    const best = {};
    allLifts.filter(l => l.lift_type === activeLift).forEach(r => {
      if (!best[r.user_id] || r.weight > best[r.user_id].weight) best[r.user_id] = r;
    });
    return Object.values(best).sort((a, b) => b.weight - a.weight);
  }, [allLifts, activeLift]);

  const myRecord  = myLifts.find(l => l.lift_type === activeLift);
  const myRank    = myRecord ? leaderboard.findIndex(l => l.user_id === currentUser?.id) + 1 : null;
  const myPct     = myRank && leaderboard.length > 1 ? Math.round(((leaderboard.length - myRank) / (leaderboard.length - 1)) * 100) : null;
  const liftMeta  = LIFTS.find(l => l.id === activeLift);
  const existingLifts = useMemo(() => { const m = {}; myLifts.forEach(l => { m[l.lift_type] = l.weight; }); return m; }, [myLifts]);

  // Percentile label
  const pctColor = myPct >= 90 ? '#f59e0b' : myPct >= 75 ? '#10b981' : myPct >= 50 ? '#0ea5e9' : '#64748b';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right,#02040a,#0d2360,#02040a)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>Community</h1>
            <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>See how your lifts stack up</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: '#fff', fontSize: 13, fontWeight: 800,
            boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
          }}>
            <Plus style={{ width: 14, height: 14 }} /> Log Lift
          </button>
        </div>

        {/* My PR banner */}
        {myRecord && (
          <div style={{
            padding: '14px 16px', borderRadius: 16, marginBottom: 20,
            background: `linear-gradient(135deg,${liftMeta.color}18,${liftMeta.color}08)`,
            border: `1px solid ${liftMeta.color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>{liftMeta.emoji}</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Your PR</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  {myRecord.weight}<span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginLeft: 3 }}>{myRecord.unit || 'kg'}</span>
                </div>
              </div>
            </div>
            {myRank && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Rank</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: liftMeta.color, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  #{myRank} <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>/ {leaderboard.length}</span>
                </div>
                {myPct !== null && (
                  <div style={{ marginTop: 4, fontSize: 10, fontWeight: 800, color: pctColor, background: `${pctColor}18`, border: `1px solid ${pctColor}30`, borderRadius: 99, padding: '2px 8px', display: 'inline-block' }}>
                    Top {100 - myPct}%
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lift tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
          {LIFTS.map(l => (
            <button key={l.id} onClick={() => setActiveLift(l.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
              background: activeLift === l.id ? `${l.color}20` : 'rgba(255,255,255,0.04)',
              outline: `1px solid ${activeLift === l.id ? `${l.color}55` : 'rgba(255,255,255,0.07)'}`,
              color: activeLift === l.id ? l.color : '#475569', fontSize: 12, fontWeight: 700,
            }}>
              <span style={{ fontSize: 13 }}>{l.emoji}</span> {l.label}
            </button>
          ))}
        </div>

        {/* Leaderboard card */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy style={{ width: 13, height: 13, color: '#f59e0b' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{liftMeta.label} Leaderboard</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#475569' }}>{leaderboard.length} athletes</span>
          </div>
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {isLoading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 13 }}>Loading…</div>
            ) : leaderboard.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{liftMeta.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>No lifts logged yet</div>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>Be the first to set a {liftMeta.label} PR!</div>
                <button onClick={() => setShowModal(true)} style={{ padding: '9px 20px', borderRadius: 10, background: `${liftMeta.color}20`, border: `1px solid ${liftMeta.color}44`, color: liftMeta.color, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Log your lift →
                </button>
              </div>
            ) : (
              leaderboard.map((entry, i) => (
                <LeaderRow key={entry.user_id || i} entry={entry} rank={i + 1} isMe={entry.user_id === currentUser?.id} color={liftMeta.color} />
              ))
            )}
          </div>
        </div>

        {/* My PRs grid */}
        {myLifts.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your PRs</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {LIFTS.map(l => {
                const rec  = myLifts.find(r => r.lift_type === l.id);
                const best = {};
                allLifts.filter(r => r.lift_type === l.id).forEach(r => { if (!best[r.user_id] || r.weight > best[r.user_id].weight) best[r.user_id] = r; });
                const sorted = Object.values(best).sort((a, b) => b.weight - a.weight);
                const rank   = rec ? sorted.findIndex(r => r.user_id === currentUser?.id) + 1 : null;
                return (
                  <button key={l.id} onClick={() => setActiveLift(l.id)} style={{
                    padding: '12px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left', border: 'none', transition: 'all 0.15s',
                    background: activeLift === l.id ? `${l.color}18` : 'rgba(255,255,255,0.03)',
                    outline: `1px solid ${activeLift === l.id ? `${l.color}45` : 'rgba(255,255,255,0.07)'}`,
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 5 }}>{l.emoji}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{l.label}</div>
                    {rec ? (
                      <>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                          {rec.weight}<span style={{ fontSize: 11, color: '#475569', marginLeft: 2 }}>{rec.unit || 'kg'}</span>
                        </div>
                        {rank && <div style={{ fontSize: 10, color: l.color, fontWeight: 700, marginTop: 2 }}>#{rank} of {sorted.length}</div>}
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>—</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <LogLiftModal
          onClose={() => setShowModal(false)}
          onSave={saveLift.mutateAsync}
          existingLifts={existingLifts}
        />
      )}
    </div>
  );
}
