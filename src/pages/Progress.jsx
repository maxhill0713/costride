import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';

// Module-level set — tracks which tabs have animated this session
const animatedTabs = new Set();
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Target, CheckCircle, BarChart3, ClipboardList, ChevronRight, ChevronDown, Trophy, TrendingUp, Flame, CalendarDays, User, Send, X, BadgeCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import ExerciseInsights from '../components/profile/ExerciseInsights';
import WorkoutSplitHeatmap from '../components/profile/WorkoutSplitHeatmap';
import ProgressiveOverloadTracker from '../components/profile/ProgressiveOverloadTracker';
import WeeklyVolumeChart from '../components/profile/WeeklyVolumeChart';

// ─── Shared styles ────────────────────────────────────────────────────────────
const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const btnNewGoal = "bg-slate-900/80 border border-slate-500/50 text-slate-400 font-bold rounded-full px-4 py-2 flex items-center gap-1.5 justify-center shadow-[0_5px_0_0_#172033,0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";
const sectionTitle = { fontSize: 24, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2 };

// ─── Community card config (copied verbatim from Community.jsx) ───────────────
const LIFTS = [
  { id: 'bench',    label: 'Bench Press',    color: '#38bdf8', colorRgb: '56,189,248',   keywords: ['bench','bench press','chest press'] },
  { id: 'squat',    label: 'Squat',          color: '#f59e0b', colorRgb: '245,158,11',   keywords: ['squat','back squat','front squat'] },
  { id: 'deadlift', label: 'Deadlift',       color: '#f43f5e', colorRgb: '244,63,94',    keywords: ['deadlift','dead lift'] },
  { id: 'ohp',      label: 'Overhead Press', color: '#10b981', colorRgb: '16,185,129',   keywords: ['overhead press','ohp','shoulder press','military press'] },
  { id: 'row',      label: 'Barbell Row',    color: '#a78bfa', colorRgb: '167,139,250',  keywords: ['barbell row','bent over row','row'] },
  { id: 'all',      label: 'All Lifts',      color: '#e2e8f0', colorRgb: '226,232,240',  keywords: [] },
];

const TIME_FILTERS = [
  { id: 'week',  label: 'Week'  },
  { id: 'month', label: 'Month' },
  { id: 'all',   label: 'All'   },
];

const MEDALS = [
  { rank:1, color:'#FFD700', colorRgb:'255,215,0',   bg:'linear-gradient(160deg,rgba(60,42,0,0.95),rgba(28,18,0,0.98))',  border:'rgba(255,215,0,0.55)',  pulse:'gold-pulse',   tier:'CHAMP', avatarRing:'conic-gradient(#FFD700,#FFA500,#FFD700,#FFF0A0,#FFD700)', badgeBg:'linear-gradient(145deg,#FFE566,#CC8800)', glow:'rgba(255,215,0,0.3)',   glowStrong:'rgba(255,215,0,0.6)',   heightExtra:20 },
  { rank:2, color:'#C8D8EC', colorRgb:'200,216,236', bg:'linear-gradient(160deg,rgba(16,28,52,0.95),rgba(6,12,28,0.98))', border:'rgba(180,205,230,0.48)', pulse:'silver-pulse', tier:'ELITE', avatarRing:'conic-gradient(#C8D8EC,#8AACCF,#C8D8EC,#E8F0FA,#C8D8EC)', badgeBg:'linear-gradient(145deg,#D4E4F4,#6A96BC)', glow:'rgba(180,205,230,0.2)', glowStrong:'rgba(180,205,230,0.45)', heightExtra:6  },
  { rank:3, color:'#E8904A', colorRgb:'232,144,74',  bg:'linear-gradient(160deg,rgba(48,22,6,0.95),rgba(20,8,2,0.98))',  border:'rgba(215,128,58,0.5)',  pulse:'bronze-pulse', tier:'PRO',   avatarRing:'conic-gradient(#E8904A,#A05820,#E8904A,#F4C090,#E8904A)', badgeBg:'linear-gradient(145deg,#E8904A,#8C4818)', glow:'rgba(215,128,58,0.22)',glowStrong:'rgba(215,128,58,0.45)', heightExtra:0  },
];

const COMMUNITY_CSS = `
@keyframes lb-slide-up { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
@keyframes lb-card-in  { from{opacity:0;transform:translateY(28px) scale(0.9) rotateX(8deg)} to{opacity:1;transform:translateY(0) scale(1) rotateX(0)} }
@keyframes lb-row-in   { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
@keyframes lb-shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
@keyframes lb-count-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes gold-pulse   { 0%,100%{box-shadow:0 0 0 2px rgba(255,196,0,0.5),0 0 20px rgba(255,196,0,0.25)} 50%{box-shadow:0 0 0 4px rgba(255,196,0,0.8),0 0 40px rgba(255,196,0,0.5)} }
@keyframes silver-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(192,212,232,0.4),0 0 16px rgba(192,212,232,0.18)} 50%{box-shadow:0 0 0 3px rgba(192,212,232,0.65),0 0 28px rgba(192,212,232,0.32)} }
@keyframes bronze-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(210,120,50,0.42),0 0 16px rgba(210,120,50,0.18)} 50%{box-shadow:0 0 0 3px rgba(210,120,50,0.68),0 0 28px rgba(210,120,50,0.32)} }
@keyframes lb-badge-pop { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.15) rotate(5deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
@keyframes arc-draw     { from{stroke-dashoffset:var(--full)} to{stroke-dashoffset:var(--offset)} }
@keyframes num-pop      { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }
@keyframes dd-open      { from{opacity:0;transform:translateY(-6px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes orb-drift    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,-8px) scale(1.08)} }
`;

function matchLift(name = '') {
  const lower = name.toLowerCase();
  for (const lift of LIFTS.filter(l => l.id !== 'all')) {
    if (lift.keywords.some(k => lower.includes(k))) return lift.id;
  }
  return null;
}

function filterByTime(sets, filter) {
  const now = Date.now();
  if (filter === 'week')  return sets.filter(s => now - new Date(s.logged_date || s.created_date || 0) < 7 * 86400000);
  if (filter === 'month') return sets.filter(s => now - new Date(s.logged_date || s.created_date || 0) < 30 * 86400000);
  return sets;
}

function flattenWorkoutLogs(logs, userMap = {}) {
  const flat = [];
  logs.forEach(log => {
    const userName = userMap[log.user_id] || log.created_by?.split('@')[0] || 'Athlete';
    (log.exercises || []).forEach(ex => {
      const w = parseFloat(ex.weight || 0);
      if (!w) return;
      flat.push({ user_id: log.user_id, user_name: userName, exercise_name: ex.exercise || '', weight: w, unit: 'kg', logged_date: log.completed_date || log.created_date });
    });
  });
  return flat;
}

function buildLeaderboard(sets, liftId) {
  const best = {};
  sets.forEach(s => {
    const lId = matchLift(s.exercise_name || '');
    if (!lId) return;
    if (liftId !== 'all' && lId !== liftId) return;
    const w = s.weight;
    if (!w) return;
    const uid = s.user_id;
    if (!best[uid] || w > best[uid].weight) best[uid] = { user_id: uid, user_name: s.user_name || 'Athlete', weight: w, unit: 'kg' };
  });
  return Object.values(best).sort((a, b) => b.weight - a.weight);
}

const ini = n => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

function LiftDropdown({ value, onChange, liftMeta }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, border: 'none', cursor: 'pointer', background: `rgba(${liftMeta.colorRgb}, 0.08)`, outline: `1px solid rgba(${liftMeta.colorRgb}, 0.28)`, fontFamily: "'Outfit', system-ui, sans-serif", transition: 'all 0.2s ease', boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 20px rgba(${liftMeta.colorRgb},0.06)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: liftMeta.color, boxShadow: `0 0 10px ${liftMeta.color}`, flexShrink: 0, transition: 'background 0.3s ease, box-shadow 0.3s ease' }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>{liftMeta.label}</span>
        </div>
        <ChevronDown style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.35)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(160deg, rgba(10,18,44,0.99) 0%, rgba(5,8,22,1) 100%)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03)', zIndex: 100, animation: 'dd-open 0.18s cubic-bezier(0.34,1.3,0.64,1) both' }}>
          {LIFTS.map((lift, i) => {
            const active = lift.id === value;
            return (
              <button key={lift.id} onClick={() => { onChange(lift.id); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', border: 'none', cursor: 'pointer', background: active ? `rgba(${lift.colorRgb}, 0.09)` : 'transparent', borderBottom: i < LIFTS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', fontFamily: "'Outfit', system-ui, sans-serif", transition: 'background 0.12s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: active ? lift.color : 'rgba(255,255,255,0.12)', boxShadow: active ? `0 0 8px ${lift.color}` : 'none', transition: 'all 0.2s ease' }} />
                  <span style={{ fontSize: 13, fontWeight: active ? 800 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.38)', letterSpacing: '-0.01em', transition: 'color 0.15s ease' }}>{lift.label}</span>
                </div>
                {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: lift.color, boxShadow: `0 0 6px ${lift.color}`, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ArcRing({ pct, color, size = 118 }) {
  const R = (size - 16) / 2;
  const circ = 2 * Math.PI * R;
  const filled = circ * 0.75;
  const arc = filled * (1 - ((pct || 0) / 100));
  const id = `arc-${color.replace('#', '')}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(135deg)', flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round" />
      <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={`url(#${id})`} strokeWidth={8} strokeDasharray={`${filled - arc} ${circ - (filled - arc)}`} strokeLinecap="round"
        style={{ '--full': filled, '--offset': arc, animation: 'arc-draw 1.1s cubic-bezier(0.34,1.2,0.64,1) 0.2s both', filter: `drop-shadow(0 0 6px ${color}88)` }} />
    </svg>
  );
}

function FullLeaderboard({ leaderboard, liftMeta, currentUserId, onClose, userAvatarMap = {} }) {
  const podium   = leaderboard.slice(0, 3);
  const restList = leaderboard.slice(3, 10);
  const maxVal   = leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.weight), 1) : 1;
  return (
    <>
      <style>{COMMUNITY_CSS}</style>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg,#02040a 0%,#0d2360 50%,#02040a 100%)', animation: 'lb-slide-up 0.42s cubic-bezier(0.16,1,0.3,1) both', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,215,0,0.06) 0%,transparent 70%)', pointerEvents: 'none', animation: 'orb-drift 10s ease-in-out infinite' }} />
        <div style={{ flexShrink: 0, padding: '18px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 2 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, left: 16, width: 36, height: 36, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(30,40,80,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderBottom: '3px solid rgba(0,0,0,0.55)', cursor: 'pointer' }}>
            <ChevronRight style={{ width: 17, height: 17, color: 'rgba(255,255,255,0.7)', transform: 'rotate(180deg)' }} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Trophy style={{ width: 14, height: 14, color: '#FFD700', filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.7))' }} />
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.28em', color: 'rgba(255,215,0,0.65)' }}>Strength Rankings</span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.04em' }}>{liftMeta.label}</h2>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', zIndex: 2 }}>
          {leaderboard.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 12 }}>
              <Trophy style={{ width: 36, height: 36, color: 'rgba(255,255,255,0.08)' }} />
              <p style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.2)', margin: 0 }}>No Rankings Yet</p>
            </div>
          ) : (<>
            <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, perspective: 800 }}>
              {[{ data: podium[1], mIdx: 1 }, { data: podium[0], mIdx: 0 }, { data: podium[2], mIdx: 2 }]
                .filter(p => p.data)
                .map(({ data, mIdx }, colIdx) => {
                  const M = MEDALS[mIdx], isFirst = mIdx === 0, cardW = isFirst ? 116 : 94, avatarSz = isFirst ? 50 : 38;
                  const isMe = data.user_id === currentUserId;
                  return (
                    <div key={mIdx} style={{ width: cardW, borderRadius: 18, overflow: 'hidden', position: 'relative', background: M.bg, border: `1.5px solid ${M.border}`, backdropFilter: 'blur(40px)', boxShadow: `0 16px 48px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.08)`, animation: `lb-card-in 0.5s cubic-bezier(0.34,1.3,0.64,1) ${colIdx * 0.08}s both`, marginBottom: M.heightExtra }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${M.color},${M.glowStrong},${M.color},transparent)`, zIndex: 3 }} />
                      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, width: '25%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', animation: `lb-shimmer 4s ease-in-out infinite`, animationDelay: `${mIdx * 0.8}s` }} />
                      </div>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: M.badgeBg, borderRadius: '0 0 9px 0', zIndex: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,0.7)' }}>{M.rank}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: isFirst ? 16 : 13, paddingBottom: 3, zIndex: 2, position: 'relative' }}>
                        <span style={{ fontSize: 6, fontWeight: 900, letterSpacing: '0.2em', color: M.color, opacity: 0.7, textTransform: 'uppercase', background: `rgba(${M.colorRgb},0.1)`, border: `1px solid rgba(${M.colorRgb},0.2)`, padding: '1px 6px', borderRadius: 99 }}>{M.tier}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4, zIndex: 2, position: 'relative' }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: avatarSz + 6, height: avatarSz + 6, borderRadius: '50%', background: M.avatarRing, animation: `${M.pulse} 2.5s ease-in-out infinite`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: avatarSz, height: avatarSz, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: M.color, background: M.bg, border: '2px solid rgba(0,0,0,0.3)', fontSize: isFirst ? 17 : 12 }}>
                              {userAvatarMap[data.user_id] ? <img src={userAvatarMap[data.user_id]} alt={data.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                              <span style={{ display: userAvatarMap[data.user_id] ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: isFirst ? 17 : 12 }}>{ini(data.user_name)}</span>
                            </div>
                          </div>
                          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 17, height: 17, borderRadius: '50%', background: 'rgba(6,10,24,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: M.color, boxShadow: `0 0 0 2px ${M.color}`, animation: 'lb-badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both', zIndex: 5 }}>{M.rank}</div>
                        </div>
                      </div>
                      <p style={{ color: isMe ? '#38bdf8' : '#fff', fontWeight: 900, textAlign: 'center', fontSize: isFirst ? 11 : 9, lineHeight: 1.2, padding: '0 6px 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'relative', zIndex: 2 }}>{isMe ? 'You' : data.user_name || '—'}</p>
                      <div style={{ textAlign: 'center', padding: `2px 8px ${isFirst ? 13 : 9}px`, position: 'relative', zIndex: 2 }}>
                        <p style={{ fontSize: isFirst ? 20 : 15, fontWeight: 900, color: M.color, lineHeight: 1, textShadow: `0 0 24px ${M.glowStrong}`, letterSpacing: '-0.03em', animation: 'lb-count-up 0.5s ease 0.2s both' }}>{data.weight}kg</p>
                        <p style={{ fontSize: 6, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: `rgba(${M.colorRgb},0.45)`, marginTop: 1 }}>personal best</p>
                      </div>
                    </div>
                  );
                })}
            </div>
            {restList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 12px 20px' }}>
                {restList.map((entry, i) => {
                  const globalRank = i + 4, pct = Math.max(4, Math.round((entry.weight / maxVal) * 100));
                  const isMe = entry.user_id === currentUserId;
                  const opacities = [1, 0.88, 0.76, 0.65, 0.55, 0.46, 0.38];
                  const o = opacities[i] || 0.38;
                  return (
                    <div key={entry.user_id || i} style={{ borderRadius: 14, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, animation: `lb-row-in 0.28s ease ${(i + 3) * 0.04}s both`, background: isMe ? 'rgba(56,189,248,0.08)' : 'linear-gradient(135deg,rgba(15,24,58,0.82),rgba(8,14,36,0.92))', border: `1px solid ${isMe ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)'}`, borderLeft: `3px solid ${isMe ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`, boxShadow: '0 2px 12px rgba(0,0,0,0.35)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: `rgba(255,255,255,${o * 0.7})` }}>{globalRank}</div>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, background: isMe ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)', border: `2px solid ${isMe ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`, color: isMe ? '#38bdf8' : 'rgba(255,255,255,0.6)' }}>
                        {userAvatarMap[entry.user_id] ? <img src={userAvatarMap[entry.user_id]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                        <span style={{ display: userAvatarMap[entry.user_id] ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>{ini(entry.user_name)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: isMe ? '#fff' : `rgba(255,255,255,${o * 0.92})`, margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isMe ? 'You' : entry.user_name || '—'}</p>
                        <div style={{ height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: `rgba(${liftMeta.colorRgb},${o * 0.55})`, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 800, color: `rgba(255,255,255,${o * 0.9})` }}>{entry.weight}kg</div>
                    </div>
                  );
                })}
              </div>
            )}
            <p style={{ textAlign: 'center', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.08)', paddingBottom: 16 }}>Ranked by personal best · Real-time</p>
          </>)}
        </div>
      </div>
    </>
  );
}

// ─── The full community card, self-contained ─────────────────────────────────
function CommunityLiftCard({ currentUser }) {
  const [activeLift, setActiveLift] = useState('bench');
  const [timeFilter, setTimeFilter] = useState('week');
  const [lbOpen, setLbOpen] = useState(false);

  const { data: gymMemberships = [] } = useQuery({ queryKey: ['gymMemberships', currentUser?.id], queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }), enabled: !!currentUser?.id, staleTime: 5 * 60 * 1000 });

  const gymId = gymMemberships[0]?.gym_id;

  const { data: workoutLogs = [], isLoading } = useQuery({
    queryKey: ['communityWorkoutLogs', gymId],
    queryFn: () => base44.entities.WorkoutLog.filter({ gym_id: gymId }, '-completed_date', 500),
    enabled: !!gymId,
    staleTime: 3 * 60 * 1000,
    placeholderData: p => p,
  });

  const { data: gymMembersForNames = [] } = useQuery({
    queryKey: ['gymMembersForNames', gymId],
    queryFn: () => base44.entities.GymMember.filter({ gym_id: gymId }, 'user_name', 200),
    enabled: !!gymId,
    staleTime: 10 * 60 * 1000,
    placeholderData: p => p,
  });

  const userMap = useMemo(() => {
    const m = {};
    gymMembersForNames.forEach(u => {
      const uid = u.user_id || u.id;
      if (uid) m[uid] = u.user_name || u.full_name || u.email?.split('@')[0] || 'Athlete';
    });
    if (currentUser) m[currentUser.id] = currentUser.full_name || currentUser.email?.split('@')[0] || 'You';
    return m;
  }, [gymMembersForNames, currentUser]);

  const userAvatarMap = useMemo(() => {
    const m = {};
    gymMembersForNames.forEach(u => {
      const uid = u.user_id || u.id;
      const avatar = u.avatar_url || u.user_avatar || u.profile_picture || null;
      if (uid && avatar) m[uid] = avatar;
    });
    const myAvatar = currentUser?.avatar_url || currentUser?.profile_picture || currentUser?.photo_url || null;
    if (currentUser?.id && myAvatar) m[currentUser.id] = myAvatar;
    return m;
  }, [gymMembersForNames, currentUser]);

  const allSets      = useMemo(() => flattenWorkoutLogs(workoutLogs, userMap), [workoutLogs, userMap]);
  const filteredSets = useMemo(() => filterByTime(allSets, timeFilter), [allSets, timeFilter]);
  const leaderboard  = useMemo(() => buildLeaderboard(filteredSets, activeLift), [filteredSets, activeLift]);

  const myEntry = leaderboard.find(l => l.user_id === currentUser?.id);
  const myRank  = myEntry ? leaderboard.indexOf(myEntry) + 1 : null;
  const myPct   = myRank && leaderboard.length > 1 ? Math.round(((leaderboard.length - myRank) / (leaderboard.length - 1)) * 100) : null;

  const allTimeBest = useMemo(() => (
    allSets.filter(s => s.user_id === currentUser?.id && (activeLift === 'all' ? !!matchLift(s.exercise_name || '') : matchLift(s.exercise_name || '') === activeLift))
      .reduce((b, s) => Math.max(b, s.weight || 0), 0)
  ), [allSets, currentUser?.id, activeLift]);

  const todayLifters = useMemo(() => new Set(allSets.filter(s => Date.now() - new Date(s.logged_date || 0) < 86400000).map(s => s.user_id)).size, [allSets]);

  const gymName  = gymMemberships[0]?.gym_name || 'Community';
  const liftMeta = LIFTS.find(l => l.id === activeLift) || LIFTS[0];

  if (lbOpen) return (
    <FullLeaderboard
      leaderboard={leaderboard}
      liftMeta={liftMeta}
      currentUserId={currentUser?.id}
      onClose={() => setLbOpen(false)}
      userAvatarMap={userAvatarMap}
    />
  );

  return (
    <>
      <style>{COMMUNITY_CSS}</style>

      {/* Section header */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={sectionTitle}>Community Lift Rankings</h2>
        <p style={{ fontSize: 22, color: '#475569', margin: '3px 0 0', fontWeight: 500 }}>{gymName}</p>
      </div>

      {/* The card — identical to Community.jsx */}
      <div style={{
        borderRadius: 28,
        background: 'linear-gradient(160deg,rgba(12,20,48,0.96) 0%,rgba(6,10,26,0.99) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(${liftMeta.colorRgb},0.08), inset 0 1px 0 rgba(255,255,255,0.06)`,
        position: 'relative',
        overflow: 'visible',
        transition: 'box-shadow 0.4s ease',
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}>
        {/* Accent bar */}
        <div style={{ height: 3, borderRadius: '28px 28px 0 0', background: `linear-gradient(90deg,transparent 0%,rgba(${liftMeta.colorRgb},0.5) 20%,${liftMeta.color} 50%,rgba(${liftMeta.colorRgb},0.5) 80%,transparent 100%)`, transition: 'background 0.4s ease' }} />

        {/* Background glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 300, height: 180, borderRadius: '50%', background: `radial-gradient(ellipse,rgba(${liftMeta.colorRgb},0.07) 0%,transparent 70%)`, pointerEvents: 'none', transition: 'background 0.4s ease' }} />

        {/* 1. Lift Dropdown */}
        <div style={{ padding: '18px 18px 0', position: 'relative', zIndex: 10 }}>
          <LiftDropdown value={activeLift} onChange={v => { setActiveLift(v); setLbOpen(false); }} liftMeta={liftMeta} />
        </div>

        {/* 2. Hero PB */}
        <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <ArcRing pct={myPct ?? 0} color={liftMeta.color} size={118} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: myEntry ? 26 : 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, animation: 'num-pop 0.5s cubic-bezier(0.34,1.3,0.64,1) 0.1s both' }}>
                {myEntry ? myEntry.weight : '—'}
              </span>
              {myEntry && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)' }}>kg PB</span>}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {myEntry ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{myPct !== null ? `Top ${100 - myPct}%` : 'Ranked'}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 600 }}>in {gymName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: liftMeta.color, boxShadow: `0 0 8px ${liftMeta.color}` }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', fontWeight: 600 }}>#{myRank} of {leaderboard.length} athletes</span>
                </div>
                {allTimeBest > 0 && allTimeBest !== myEntry.weight && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <TrendingUp style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.28)' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', fontWeight: 700 }}>All-time PB: {allTimeBest}kg</span>
                  </div>
                )}
              </>
            ) : (
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.38)', margin: '0 0 4px' }}>No {liftMeta.label} logged</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', margin: 0, fontWeight: 600 }}>Log a lift to appear on the board</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ margin: '18px 18px 0', height: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* 3. Mini leaderboard */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy style={{ width: 13, height: 13, color: '#FFD700' }} />
              <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Top Lifters</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '2px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {TIME_FILTERS.map(tf => (
                <button key={tf.id} onClick={() => setTimeFilter(tf.id)} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 800, background: timeFilter === tf.id ? `rgba(${liftMeta.colorRgb},0.15)` : 'transparent', color: timeFilter === tf.id ? liftMeta.color : 'rgba(255,255,255,0.22)', outline: timeFilter === tf.id ? `1px solid rgba(${liftMeta.colorRgb},0.3)` : 'none', fontFamily: "'Outfit',system-ui,sans-serif", transition: 'all 0.15s ease' }}>{tf.label}</button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(255,255,255,0.14)', fontSize: 12, fontWeight: 600 }}>Loading…</div>
          ) : leaderboard.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(255,255,255,0.14)', fontSize: 12, fontWeight: 600 }}>No lifts logged in this period</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {leaderboard.slice(0, 5).map((entry, i) => {
                const M = i < 3 ? MEDALS[i] : null;
                const isMe = entry.user_id === currentUser?.id;
                const maxW = leaderboard[0].weight;
                const pct  = Math.max(6, Math.round((entry.weight / maxW) * 100));
                return (
                  <div key={entry.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 14, background: isMe ? `rgba(${liftMeta.colorRgb},0.07)` : i === 0 ? 'rgba(255,215,0,0.04)' : 'rgba(255,255,255,0.025)', border: `1px solid ${isMe ? `rgba(${liftMeta.colorRgb},0.2)` : 'rgba(255,255,255,0.04)'}`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: M ? `rgba(${M.colorRgb},0.04)` : `rgba(${liftMeta.colorRgb},0.04)`, borderRadius: '14px 0 0 14px', pointerEvents: 'none', transition: 'width 0.6s ease' }} />
                    <div style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, background: M ? M.badgeBg : 'rgba(255,255,255,0.05)', color: M ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.22)', position: 'relative', zIndex: 1 }}>{i + 1}</div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, background: isMe ? `rgba(${liftMeta.colorRgb},0.2)` : M ? M.bg : 'rgba(255,255,255,0.06)', border: `1.5px solid ${isMe ? liftMeta.color : M ? M.color : 'rgba(255,255,255,0.08)'}`, color: isMe ? liftMeta.color : M ? M.color : 'rgba(255,255,255,0.45)', position: 'relative', zIndex: 1 }}>
                      {userAvatarMap[entry.user_id] ? <img src={userAvatarMap[entry.user_id]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                      <span style={{ display: userAvatarMap[entry.user_id] ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11 }}>{ini(entry.user_name)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: isMe ? 800 : 600, color: isMe ? '#fff' : M ? M.color : 'rgba(255,255,255,0.6)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isMe ? 'You' : entry.user_name || '—'}</p>
                    </div>
                    <div style={{ flexShrink: 0, fontSize: 13, fontWeight: 900, color: isMe ? liftMeta.color : M ? M.color : 'rgba(255,255,255,0.4)', position: 'relative', zIndex: 1, letterSpacing: '-0.02em' }}>{entry.weight}kg</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ margin: '16px 18px 0', height: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* 4. Stats */}
        <div style={{ margin: '0 16px', padding: '14px 4px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `rgba(${liftMeta.colorRgb},0.1)`, flexShrink: 0 }}>
              <Flame style={{ width: 14, height: 14, color: liftMeta.color }} />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1, letterSpacing: '-0.03em' }}>{todayLifters}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', margin: '2px 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active today</p>
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,215,0,0.09)', flexShrink: 0 }}>
              <Trophy style={{ width: 14, height: 14, color: '#FFD700' }} />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1, letterSpacing: '-0.03em' }}>{leaderboard.length}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', margin: '2px 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>On board</p>
            </div>
          </div>
        </div>

        {/* 5. CTA */}
        <div style={{ padding: '0 16px 18px' }}>
          <button
            onClick={() => setLbOpen(true)}
            style={{ width: '100%', padding: '14px 20px', borderRadius: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(135deg,rgba(${liftMeta.colorRgb},0.13),rgba(${liftMeta.colorRgb},0.05))`, outline: `1px solid rgba(${liftMeta.colorRgb},0.22)`, boxShadow: `0 4px 20px rgba(${liftMeta.colorRgb},0.08),inset 0 1px 0 rgba(255,255,255,0.05)`, fontFamily: "'Outfit',system-ui,sans-serif", transition: 'transform 0.1s ease' }}
            onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
            onMouseUp={e => e.currentTarget.style.transform = ''}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
            onTouchStart={e => e.currentTarget.style.transform = 'translateY(2px)'}
            onTouchEnd={e => e.currentTarget.style.transform = ''}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `rgba(${liftMeta.colorRgb},0.14)`, border: `1px solid rgba(${liftMeta.colorRgb},0.22)` }}>
                <Trophy style={{ width: 15, height: 15, color: liftMeta.color }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1 }}>Full Leaderboard</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: '3px 0 0', fontWeight: 600 }}>{leaderboard.length} athletes ranked</p>
              </div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: liftMeta.color, opacity: 0.6 }} />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────────
function AnalyticsTab({ currentUser, workoutLogs, checkIns, animateCharts }) {
  return (
    <div className="space-y-6">
      <div style={{ ...CARD, borderRadius: 16, padding: '16px 16px' }}>
        <ProgressiveOverloadTracker currentUser={currentUser} animate={animateCharts} />
      </div>
      <div style={{ ...CARD, borderRadius: 16, padding: '16px 16px' }}>
        <WeeklyVolumeChart currentUser={currentUser} animate={animateCharts} />
      </div>
      {currentUser?.workout_split && (
        <WorkoutSplitHeatmap
          checkIns={checkIns}
          workoutSplit={currentUser?.workout_split}
          weeklyGoal={currentUser?.weekly_goal}
          trainingDays={currentUser?.training_days}
          customWorkoutTypes={currentUser?.custom_workout_types || {}}
          joinDate={currentUser?.created_date}
        />
      )}
      <ExerciseInsights
        workoutLogs={workoutLogs}
        workoutSplit={currentUser?.custom_workout_types}
        trainingDays={currentUser?.training_days}
      />
    </div>
  );
}

// ─── Completed Goals (collapsible) ───────────────────────────────────────────
function CompletedGoals({ goals }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full group mb-3"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1, textAlign: 'left' }}>
          Completed ({goals.length})
        </span>
        <ChevronDown
          className="w-4 h-4 text-slate-500 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        />
      </button>

      {/* Cards — only when open */}
      {open && (
        <div className="space-y-2">
          {goals.map((goal) => (
            <div
              key={goal.id}
              style={{
                background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: 16,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                  {goal.title}
                </p>
                {goal.target_value && (
                  <p style={{ fontSize: 11, fontWeight: 500, color: '#475569', margin: '2px 0 0' }}>
                    {goal.target_value}{goal.unit ? ` ${goal.unit}` : ''}
                  </p>
                )}
              </div>

              {/* Badge */}
              <div style={{
                padding: '3px 10px', borderRadius: 99,
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                fontSize: 10, fontWeight: 700,
                color: '#4ade80',
                flexShrink: 0,
                letterSpacing: '0.04em',
              }}>
                Done
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Goals tab ────────────────────────────────────────────────────────────────
function GoalsTab({ currentUser, showAddGoal, setShowAddGoal }) {
  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser?.id, staleTime: 5 * 60 * 1000, placeholderData: (prev) => prev,
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['goals', currentUser?.id] });
      const previous = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => [...old, { id: `temp-${Date.now()}`, ...data, status: 'active', current_value: 0 }]);
      return { previous };
    },
    onError: (err, data, ctx) => { queryClient.setQueryData(['goals', currentUser?.id], ctx.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals', currentUser?.id] }); setShowAddGoal(false); },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const prev = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => old.map((g) => g.id === id ? { ...g, ...data } : g));
      return { prev };
    },
    onError: (err, v, ctx) => { queryClient.setQueryData(['goals', currentUser?.id], ctx.prev); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals', currentUser?.id] }); },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['goals', currentUser?.id] });
      const previous = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => old.filter((g) => g.id !== id));
      return { previous };
    },
    onError: (err, id, ctx) => { queryClient.setQueryData(['goals', currentUser?.id], ctx.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals', currentUser?.id] }); },
  });

  const activeGoals    = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  return (
    <div className="space-y-4">
      {activeGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-slate-700/60 flex items-center justify-center mb-4">
            <Target className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-base font-bold text-white mb-1">No Goals Yet</p>
          <p className="text-sm text-slate-500 mb-5">Set your first fitness goal and start tracking.</p>
          <button onClick={() => setShowAddGoal(true)} className={btnNewGoal}>
            <Plus className="w-3.5 h-3.5" />Create a Goal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal}
              onUpdate={(g, v, s, m) => { const d = { current_value: v, status: s || g.status }; if (m) d.milestones = m; updateGoalMutation.mutate({ id: g.id, data: d }); }}
              onDelete={(id) => deleteGoalMutation.mutate(id)}
              onToggleReminder={(g) => updateGoalMutation.mutate({ id: g.id, data: { reminder_enabled: !g.reminder_enabled } })}
            />
          ))}
        </div>
      )}

      {completedGoals.length > 0 && (
        <CompletedGoals goals={completedGoals} />
      )}

      <AddGoalModal
        open={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onSave={(data) => createGoalMutation.mutate(data)}
        currentUser={currentUser}
        isLoading={createGoalMutation.isPending}
      />
    </div>
  );
}

// ─── Coach Messages section ───────────────────────────────────────────────────
function CoachMessages({ currentUser }) {
  const [openThread, setOpenThread] = useState(null); // sender_id of open chat
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  // Fetch ALL messages involving the current user (both sent and received)
  const { data: received = [], isLoading } = useQuery({
    queryKey: ['coachMessages', currentUser?.id],
    queryFn: () => base44.entities.Message.filter({ receiver_id: currentUser.id }, 'created_date', 200),
    enabled: !!currentUser,
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
  });

  const { data: sent = [] } = useQuery({
    queryKey: ['coachMessagesSent', currentUser?.id],
    queryFn: () => base44.entities.Message.filter({ sender_id: currentUser.id }, 'created_date', 200),
    enabled: !!currentUser,
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
  });

  const sendReply = useMutation({
    mutationFn: content => base44.entities.Message.create({
      sender_id:     currentUser.id,
      sender_name:   currentUser.full_name || currentUser.email,
      sender_avatar: currentUser.avatar_url || null,
      receiver_id:   openThread,
      receiver_name: threads.find(t => t.sender_id === openThread)?.name || 'Coach',
      content,
      read: false,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coachMessages', currentUser?.id] });
      qc.invalidateQueries({ queryKey: ['coachMessagesSent', currentUser?.id] });
      // Also invalidate owner's dashboard messages
      qc.invalidateQueries({ queryKey: ['dashMessages'] });
      setReplyText('');
    },
  });

  // Build threads: group by the "other person" (coach/owner side)
  const threads = useMemo(() => {
    const map = {};
    // Messages received from coaches
    received.forEach(msg => {
      const otherId = msg.sender_id;
      if (!map[otherId]) map[otherId] = { sender_id: otherId, name: msg.sender_name || 'Coach', avatar: msg.sender_avatar || null, messages: [] };
      map[otherId].messages.push(msg);
    });
    // My replies back to coaches (keyed by receiver = the coach)
    sent.forEach(msg => {
      const otherId = msg.receiver_id;
      if (map[otherId]) map[otherId].messages.push(msg);
      // Only add thread if we already received from them (don't create threads for unrelated sent msgs)
    });
    Object.values(map).forEach(t => {
      // deduplicate by id, sort oldest→newest
      const seen = new Set();
      t.messages = t.messages.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
      t.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    });
    return Object.values(map).sort((a, b) => {
      const la = a.messages[a.messages.length - 1]?.created_date || 0;
      const lb = b.messages[b.messages.length - 1]?.created_date || 0;
      return new Date(lb) - new Date(la);
    });
  }, [received, sent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [openThread, received, sent]);

  const activeThread = threads.find(t => t.sender_id === openThread);

  const fmtTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' });
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // ── Open chat view ──
  if (activeThread) {
    const handleSend = () => {
      if (!replyText.trim()) return;
      sendReply.mutate(replyText.trim());
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '72vh', background: 'linear-gradient(135deg, rgba(10,14,30,0.98) 0%, rgba(5,8,20,1) 100%)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        {/* Chat header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: 'rgba(255,255,255,0.02)' }}>
          <button onClick={() => setOpenThread(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}>
            <ChevronRight style={{ width: 20, height: 20, transform: 'rotate(180deg)' }} />
          </button>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid #3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeThread.avatar ? 'transparent' : 'rgba(59,130,246,0.15)', fontSize: 15, fontWeight: 800, color: '#3b82f6' }}>
              {activeThread.avatar ? <img src={activeThread.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (activeThread.name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#10b981', border: '2px solid #080e18' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{activeThread.name}</p>
            <p style={{ fontSize: 11, color: '#475569', margin: '1px 0 0' }}>Coach · Tap to reply</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeThread.messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUser?.id;
            const prevMsg = activeThread.messages[i - 1];
            const showAvatar = !isMe && (i === 0 || prevMsg?.sender_id !== msg.sender_id);
            return (
              <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                {/* Coach avatar - left side */}
                {!isMe && (
                  <div style={{ width: 28, flexShrink: 0 }}>
                    {showAvatar && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: '2px solid #3b82f6', boxShadow: '0 0 8px rgba(59,130,246,0.5)', background: activeThread.avatar ? 'transparent' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#3b82f6' }}>
                        {activeThread.avatar ? <img src={activeThread.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (activeThread.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {showAvatar && <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, paddingLeft: 4 }}>{activeThread.name}</span>}
                  <div style={{ padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? '#3b82f6' : 'rgba(255,255,255,0.08)', border: isMe ? 'none' : '1px solid rgba(255,255,255,0.06)', fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>
                    {msg.content}
                  </div>
                  <span style={{ fontSize: 10, color: '#334155', paddingLeft: 4, paddingRight: 4 }}>{fmtTime(msg.created_date)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply input */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0, background: 'rgba(255,255,255,0.01)' }}>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Reply to ${activeThread.name}…`}
            rows={1}
            style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 96, overflowY: 'auto' }}
            onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sendReply.isPending}
            style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: replyText.trim() ? '#3b82f6' : 'rgba(255,255,255,0.06)', border: 'none', cursor: replyText.trim() ? 'pointer' : 'default', transition: 'background 0.15s', flexShrink: 0, boxShadow: replyText.trim() ? '0 0 12px rgba(59,130,246,0.4)' : 'none' }}
          >
            <Send style={{ width: 16, height: 16, color: replyText.trim() ? '#fff' : '#334155' }} />
          </button>
        </div>
      </div>
    );
  }

  // ── Thread list (WhatsApp style) ──
  if (isLoading) return (
    <div className="space-y-2">
      {[1,2,3].map(i => <div key={i} style={{ height: 72, borderRadius: 16, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  );

  if (threads.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <User style={{ width: 26, height: 26, color: '#a78bfa' }} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>No messages yet</p>
      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, maxWidth: 240, margin: 0 }}>
        When a coach or gym owner messages you, it will appear here.
      </p>
    </div>
  );

  return (
    <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(10,14,30,0.97) 0%, rgba(5,8,20,1) 100%)' }}>
      {threads.map((thread, idx) => {
        const lastMsg = thread.messages[thread.messages.length - 1];
        return (
          <button
            key={thread.sender_id}
            onClick={() => setOpenThread(thread.sender_id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', border: 'none', cursor: 'pointer',
              background: 'transparent', fontFamily: 'inherit', textAlign: 'left',
              borderBottom: idx < threads.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Avatar with blue glow */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid #3b82f6',
                boxShadow: '0 0 12px rgba(59,130,246,0.55)',
                background: thread.avatar ? 'transparent' : 'rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: '#3b82f6',
              }}>
                {thread.avatar
                  ? <img src={thread.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (thread.name || '?').charAt(0).toUpperCase()
                }
              </div>
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thread.name}</span>
                <span style={{ fontSize: 11, color: '#334155', flexShrink: 0, marginLeft: 8 }}>{fmtTime(lastMsg?.created_date)}</span>
              </div>
              <span style={{ fontSize: 13, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {lastMsg?.content || ''}
              </span>
            </div>

            <ChevronRight style={{ width: 16, height: 16, color: '#2d3f55', flexShrink: 0 }} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Coach invite banner ──────────────────────────────────────────────────────
function CoachInviteBanner({ invite, onAccept, onDecline, accepting, declining }) {
  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30,58,138,0.45) 0%, rgba(16,19,40,0.95) 100%)',
      border: '1px solid rgba(59,130,246,0.35)',
      borderBottom: '3px solid rgba(29,78,216,0.55)',
      borderRadius: 18,
      padding: '16px 16px',
      boxShadow: '0 2px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Coach avatar */}
        <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          background: invite.coach_avatar ? 'transparent' : 'rgba(59,130,246,0.15)',
          border: '2px solid rgba(59,130,246,0.5)', boxShadow: '0 0 14px rgba(59,130,246,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 800, color: '#3b82f6' }}>
          {invite.coach_avatar
            ? <img src={invite.coach_avatar} alt={invite.coach_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : ini(invite.coach_name)
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 3, letterSpacing: '-0.01em' }}>
            {invite.coach_name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa' }}>Coach</span>
            <BadgeCheck style={{ width: 13, height: 13, color: '#22c55e' }} />
          </div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
            Wants you as a personal training client
            {invite.coach_gym_name ? ` · ${invite.coach_gym_name}` : ''}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={onAccept}
            disabled={accepting || declining}
            style={{
              width: 42, height: 42, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(to bottom, #22c55e, #16a34a, #15803d)',
              border: '1px solid transparent', borderBottom: '3px solid #14532d',
              boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(34,197,94,0.3)',
              cursor: 'pointer', transition: 'all 0.1s',
              opacity: accepting || declining ? 0.6 : 1,
            }}
          >
            <CheckCircle style={{ width: 18, height: 18, color: '#fff' }} />
          </button>
          <button
            onClick={onDecline}
            disabled={accepting || declining}
            style={{
              width: 42, height: 42, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(to bottom, #ef4444, #dc2626, #b91c1c)',
              border: '1px solid transparent', borderBottom: '3px solid #7f1d1d',
              boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(239,68,68,0.3)',
              cursor: 'pointer', transition: 'all 0.1s',
              opacity: accepting || declining ? 0.6 : 1,
            }}
          >
            <X style={{ width: 18, height: 18, color: '#fff' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Accepted coach box ───────────────────────────────────────────────────────
function MyCoachBox({ invite }) {
  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(10,14,30,0.97) 0%, rgba(5,8,20,1) 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20, padding: '18px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {/* Top-left: coach name + "Coach" label + tick */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          background: invite.coach_avatar ? 'transparent' : 'rgba(59,130,246,0.15)',
          border: '2px solid rgba(59,130,246,0.5)', boxShadow: '0 0 12px rgba(59,130,246,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: '#3b82f6' }}>
          {invite.coach_avatar
            ? <img src={invite.coach_avatar} alt={invite.coach_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : ini(invite.coach_name)
          }
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>{invite.coach_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa' }}>Coach</span>
            <BadgeCheck style={{ width: 13, height: 13, color: '#22c55e' }} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

      {/* Placeholder content */}
      <div style={{ fontSize: 12, color: '#334155', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
        Your coach will add workouts &amp; programmes here soon.
      </div>
    </div>
  );
}

// ─── Trainer tab ─────────────────────────────────────────────────────────────
function TrainerTab({ currentUser }) {
  const [activeSection, setActiveSection] = useState('coaches');
  const queryClient = useQueryClient();

  const btnBase = "px-2 py-1.5 rounded-2xl font-bold text-sm transition-all duration-100 flex flex-col items-center gap-1 backdrop-blur-md border active:shadow-none active:translate-y-[5px] active:scale-95 transform-gpu flex-1";
  const btnInactive = "bg-slate-900/80 text-slate-400 border-slate-500/50 shadow-[0_5px_0_0_#172033,0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]";

  // Fetch current user directly in this tab so it's not dependent on prop timing
  const { data: me } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });
  const user = me || currentUser;

  // Fetch pending coach invites for this member
  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['coachInvitesPending', user?.id],
    queryFn: () => base44.entities.CoachInvite.filter({ member_id: user.id, status: 'pending' }, '-created_date', 20),
    enabled: !!user?.id,
    staleTime: 0,
    refetchInterval: 15 * 1000,
  });

  // Fetch accepted coach invites (my coaches)
  const { data: acceptedInvites = [] } = useQuery({
    queryKey: ['coachInvitesAccepted', user?.id],
    queryFn: () => base44.entities.CoachInvite.filter({ member_id: user.id, status: 'accepted' }, '-created_date', 10),
    enabled: !!user?.id,
    staleTime: 0,
    refetchInterval: 30 * 1000,
  });

  const [processingId, setProcessingId] = useState(null);

  const handleAccept = async (invite) => {
    setProcessingId(invite.id);
    await base44.entities.CoachInvite.update(invite.id, { status: 'accepted' });
    queryClient.invalidateQueries({ queryKey: ['coachInvitesPending'] });
    queryClient.invalidateQueries({ queryKey: ['coachInvitesAccepted'] });
    setProcessingId(null);
  };

  const handleDecline = async (invite) => {
    setProcessingId(invite.id);
    await base44.entities.CoachInvite.update(invite.id, { status: 'declined' });
    queryClient.invalidateQueries({ queryKey: ['coachInvitesPending'] });
    setProcessingId(null);
  };

  return (
    <div className="space-y-5">

      {/* ── Tab buttons ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveSection('classes')}
          className={`${btnBase} ${
            activeSection === 'classes'
              ? 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white border-transparent shadow-[0_5px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)]'
              : btnInactive
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Classes
        </button>
        <button
          onClick={() => setActiveSection('coaches')}
          className={`${btnBase} ${
            activeSection === 'coaches'
              ? 'bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 text-white border-transparent shadow-[0_5px_0_0_#5b21b6,0_8px_20px_rgba(120,40,220,0.4),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.05)]'
              : btnInactive
          }`}
        >
          <User className="w-4 h-4" />
          Coaches
        </button>
      </div>

      {activeSection === 'classes' && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <p style={{ fontSize: 14, fontWeight: 500, color: '#475569', lineHeight: 1.6, maxWidth: 260, margin: 0 }}>
            Join classes at your gym to chat with other members and stay connected with your training community.
          </p>
        </div>
      )}

      {activeSection === 'coaches' && (
        <div className="space-y-4">
          {/* ── Pending coach invites ── */}
          {pendingInvites.length > 0 && (
            <div className="space-y-3">
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                Coach Requests
              </p>
              {pendingInvites.map(invite => (
                <CoachInviteBanner
                  key={invite.id}
                  invite={invite}
                  accepting={processingId === invite.id}
                  declining={processingId === invite.id}
                  onAccept={() => handleAccept(invite)}
                  onDecline={() => handleDecline(invite)}
                />
              ))}
            </div>
          )}

          {/* ── My Personal Trainer ── */}
          {acceptedInvites.length > 0 && (
            <div className="space-y-3">
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                Personal Trainer
              </p>
              {acceptedInvites.map(invite => (
                <MyCoachBox key={invite.id} invite={invite} />
              ))}
            </div>
          )}

          {/* ── Messages (replaces "No messages yet" when no invites) ── */}
          <CoachMessages currentUser={user} />
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Progress() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: currentUser.id }, '-created_date', 500),
    enabled: !!currentUser, staleTime: 5 * 60 * 1000, placeholderData: (prev) => prev,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date', 200),
    enabled: !!currentUser, staleTime: 2 * 60 * 1000, placeholderData: (prev) => prev,
  });

  const [showAddGoal, setShowAddGoal] = useState(false);
  // Trigger chart animation once per session when analytics tab is first seen
  const [analyticsAnimKey, setAnalyticsAnimKey] = useState(0);
  useEffect(() => {
    if (!animatedTabs.has('analytics') && currentUser) {
      animatedTabs.add('analytics');
      setAnalyticsAnimKey(k => k + 1);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
        {/* Tab bar skeleton */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 pt-6 pb-4">
          <div className="max-w-4xl mx-auto flex justify-between gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-1 h-8 rounded bg-slate-700/60 animate-pulse" />
            ))}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="max-w-4xl mx-auto px-3 py-5 space-y-4">
          <div className="h-32 rounded-2xl bg-slate-800/60 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-800/60 animate-pulse" />
            ))}
          </div>
          <div className="h-48 rounded-2xl bg-slate-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <Tabs defaultValue="analytics" className="w-full">

        {/* ── Header ── */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 md:px-4 pt-6 pb-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center h-18">
              <TabsList className="flex justify-between w-full bg-transparent p-0 h-10 gap-0 border-0">
                <TabsTrigger value="analytics" className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 mb-[-2px] transition-colors bg-transparent text-base justify-center">
                  <BarChart3 className="w-5 h-5 mr-2" />Analytics
                </TabsTrigger>
                <TabsTrigger value="goals" className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 mb-[-2px] transition-colors bg-transparent text-base justify-center">
                  <Target className="w-5 h-5 mr-2" />Targets
                </TabsTrigger>
                <TabsTrigger value="rank" className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 mb-[-2px] transition-colors bg-transparent text-base justify-center">
                  <ClipboardList className="w-5 h-5 mr-2" />Trainer
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        {/* ── Analytics ── */}
        <TabsContent value="analytics" className="mt-0 px-3 md:px-4 py-5">
          <div className="max-w-4xl mx-auto">
            <AnalyticsTab currentUser={currentUser} workoutLogs={workoutLogs} checkIns={checkIns} animateCharts={analyticsAnimKey} />
          </div>
        </TabsContent>

        {/* ── Targets ── */}
        <TabsContent value="goals" className="mt-0 px-3 md:px-4 py-5">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Personal Goals */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 style={sectionTitle}>Personal Goals</h2>
                <button onClick={() => setShowAddGoal(true)} className={btnNewGoal}>
                  <Plus className="w-3.5 h-3.5" />New Goal
                </button>
              </div>
              <GoalsTab currentUser={currentUser} showAddGoal={showAddGoal} setShowAddGoal={setShowAddGoal} />
            </div>

            {/* Community Lift Rankings — exact same card as Community page */}
            <CommunityLiftCard currentUser={currentUser} />

          </div>
        </TabsContent>

        {/* ── Trainer ── */}
        <TabsContent value="rank" className="mt-0 px-3 md:px-4 py-5">
          <div className="max-w-4xl mx-auto">
            <TrainerTab currentUser={currentUser} />
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}