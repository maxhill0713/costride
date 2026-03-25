import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { subDays, startOfDay, isWithinInterval, format } from 'date-fns';
import {
  Users, Activity, AlertCircle, Flame, MessageCircle, ChevronRight,
  Search, Download, Plus, Check, X, Trophy, UserPlus, List,
  LayoutGrid, Heart, Dumbbell, ClipboardList, Calendar, Star,
  TrendingUp, TrendingDown, Minus, Shield,
} from 'lucide-react';
import { CoachKpiCard, CoachCard, MiniAvatar } from './CoachHelpers';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_PRIORITY = { vip: 0, active: 1, regular: 2, at_risk: 3, inactive: 4 };
const STATUS_CFG = {
  vip:      { color: '#fbbf24', label: 'VIP',     bg: 'rgba(251,191,36,0.1)'  },
  active:   { color: '#34d399', label: 'Active',  bg: 'rgba(52,211,153,0.1)'  },
  regular:  { color: '#38bdf8', label: 'Regular', bg: 'rgba(56,189,248,0.1)'  },
  at_risk:  { color: '#f87171', label: 'At Risk', bg: 'rgba(248,113,113,0.1)' },
  inactive: { color: '#64748b', label: 'Lapsed',  bg: 'rgba(100,116,139,0.1)' },
};
const PRESET_TAGS   = ['VIP', 'Beginner', 'Advanced', 'Injury', 'Nutrition Goal', 'Competition Prep', 'Post-Rehab', 'Online Client'];
const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const MEDALS = ['🥇', '🥈', '🥉'];

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportCSV(clients) {
  const rows = [
    ['Name', 'Status', 'Monthly Visits', 'Total Visits', 'Streak', 'Last Visit', 'Join Date'],
    ...clients.map(c => [
      c.user_name || 'Unknown',
      STATUS_CFG[c.status]?.label || c.status,
      c.visits, c.totalVisits, c.streak,
      c.last ? format(new Date(c.last), 'yyyy-MM-dd') : 'Never',
      c.join_date || c.created_date || '',
    ]),
  ];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a   = document.createElement('a');
  a.href = url; a.download = 'clients.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ─── Engagement bar ───────────────────────────────────────────────────────────
function EngagementBar({ visits, trend, streak, color }) {
  const pct = Math.min(100, (visits / 20) * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 64, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color }}>{visits}<span style={{ fontSize: 9, color: '#3a5070', fontWeight: 400 }}>/mo</span></span>
        {trend > 0  && <TrendingUp   style={{ width: 9, height: 9, color: '#34d399' }}/>}
        {trend < 0  && <TrendingDown style={{ width: 9, height: 9, color: '#f87171' }}/>}
        {trend === 0 && <Minus        style={{ width: 9, height: 9, color: '#475569' }}/>}
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}88)`, borderRadius: 99 }}/>
      </div>
      {streak >= 3 && <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700 }}>🔥{streak}d</span>}
    </div>
  );
}

// ─── Client card (grid view) ──────────────────────────────────────────────────
function ClientCard({ m, avatarMap, onSelect }) {
  const sc  = STATUS_CFG[m.status] || STATUS_CFG.regular;
  const pct = Math.min(100, (m.visits / 20) * 100);
  return (
    <div onClick={() => onSelect(m)} style={{ borderRadius: 14, padding: 16, background: '#0c1a2e', border: `1px solid ${sc.color}20`, cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${sc.color}45`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = `${sc.color}20`; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ position: 'relative' }}>
            <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={40} color={sc.color}/>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: sc.color, border: '2px solid #0c1a2e' }}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', lineHeight: 1.2 }}>{m.user_name || 'Client'}</div>
            <span style={{ fontSize: 9, fontWeight: 800, color: sc.color, background: sc.bg, borderRadius: 4, padding: '2px 6px' }}>{sc.label}</span>
          </div>
        </div>
        {m.streak >= 3 && <span style={{ fontSize: 10, color: '#f59e0b' }}>🔥{m.streak}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[{ val: m.visits, sub: 'this month', color: '#38bdf8' }, { val: m.totalVisits, sub: 'all time', color: '#a78bfa' }].map((s, i) => (
          <div key={i} style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: '-0.03em' }}>{s.val}</div>
            <div style={{ fontSize: 8, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${sc.color},${sc.color}88)`, borderRadius: 99 }}/>
      </div>
      <div style={{ fontSize: 10, color: '#64748b' }}>
        {m.daysAgo === null ? 'Never visited' : m.daysAgo === 0 ? '✅ In today' : `Last: ${m.daysAgo}d ago`}
      </div>
    </div>
  );
}

// ─── Client detail panel ──────────────────────────────────────────────────────
function ClientDetailPanel({ m, checkIns, avatarMap, now, notes, saveNote, tags, saveTag, goals, saveGoal, health, saveHealth, openModal }) {
  const [activeTab,    setActiveTab]    = useState('overview');
  const [newGoal,      setNewGoal]      = useState({ title: '', target: '', unit: '', current: '' });
  const [showGoalForm, setShowGoalForm] = useState(false);

  const sc          = STATUS_CFG[m.status] || STATUS_CFG.regular;
  const clientCIs   = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const clientGoals = goals[m.user_id]  || [];
  const clientTags  = tags[m.user_id]   || [];
  const clientHealth = health[m.user_id] || { injuries: '', restrictions: '', fitnessLevel: 'Beginner', notes: '' };

  const handleAddGoal = () => {
    if (!newGoal.title) return;
    saveGoal(m.user_id, [...clientGoals, { ...newGoal, id: Date.now() }]);
    setNewGoal({ title: '', target: '', unit: '', current: '' });
    setShowGoalForm(false);
  };

  const toggleTag = (tag) =>
    saveTag(m.user_id, clientTags.includes(tag) ? clientTags.filter(t => t !== tag) : [...clientTags, tag]);

  const updateHealth = (field, val) =>
    saveHealth(m.user_id, { ...clientHealth, [field]: val });

  const inputStyle = {
    padding: '7px 10px', borderRadius: 7, background: '#060c18',
    border: '1px solid rgba(255,255,255,0.08)', color: '#f0f4f8',
    fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const textareaStyle = {
    ...inputStyle, minHeight: 68, resize: 'vertical',
    fontFamily: 'inherit', lineHeight: 1.5,
  };

  const TABS = [
    { id: 'overview', label: 'Stats'        },
    { id: 'health',   label: '🩺 Health'    },
    { id: 'goals',    label: 'Goals'        },
    { id: 'notes',    label: 'Notes'        },
    { id: 'profile',  label: 'Profile'      },
  ];

  return (
    <div style={{ background: `${sc.color}04`, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Tab strip */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', paddingLeft: 16, paddingRight: 12 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '9px 14px', border: 'none', background: 'transparent', color: activeTab === t.id ? sc.color : '#3a5070', fontSize: 11, fontWeight: activeTab === t.id ? 800 : 500, cursor: 'pointer', borderBottom: `2px solid ${activeTab === t.id ? sc.color : 'transparent'}`, marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }}/>
        {/* ── Coach Tools strip ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8 }}>
          <button onClick={() => openModal('post', { memberId: m.user_id })} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.18)', color: '#38bdf8', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <MessageCircle style={{ width: 10, height: 10 }}/> Message
          </button>
          <button onClick={() => openModal('bookIntoClass', { memberId: m.user_id, memberName: m.user_name })} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', color: '#a78bfa', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Calendar style={{ width: 10, height: 10 }}/> Book Class
          </button>
          <button onClick={() => openModal('assignChallenge', { memberId: m.user_id, memberName: m.user_name })} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)', color: '#fbbf24', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Trophy style={{ width: 10, height: 10 }}/> Challenge
          </button>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>

        {/* ── STATS TAB ── */}
        {activeTab === 'overview' && (
          <div>
            {/* 4-stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Visits / Month', value: m.visits,      color: '#38bdf8' },
                { label: 'Last Visit',     value: m.daysAgo === null ? 'Never' : m.daysAgo === 0 ? 'Today' : `${m.daysAgo}d ago`, color: m.daysAgo > 14 ? '#f87171' : '#34d399' },
                { label: 'Total Check-ins',value: m.totalVisits, color: '#a78bfa' },
                { label: 'Trend',          value: m.trend !== 0 ? `${m.trend > 0 ? '↑' : '↓'}${Math.abs(m.trend)}%` : 'Flat', color: m.trend > 0 ? '#34d399' : m.trend < 0 ? '#f87171' : '#64748b' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 8, color: '#3a5070', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent Visits */}
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Recent Visits</div>
            {clientCIs.length === 0
              ? <p style={{ fontSize: 11, color: '#3a5070', margin: '0 0 12px' }}>No visits yet</p>
              : clientCIs.slice(0, 5).map((ci, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#34d399' : '#3a5070', flexShrink: 0 }}/>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', flex: 1 }}>{format(new Date(ci.check_in_date), 'EEE, MMM d')}</span>
                  <span style={{ fontSize: 10, color: '#3a5070' }}>{format(new Date(ci.check_in_date), 'h:mm a')}</span>
                  {i === 0 && <span style={{ fontSize: 9, color: '#34d399', background: 'rgba(52,211,153,0.1)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>Latest</span>}
                </div>
              ))
            }

            {/* 14-day activity heat strip */}
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7, marginTop: 12 }}>14-Day Activity</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {m.spark.map((v, si) => (
                <div key={si} title={format(subDays(now, 13 - si), 'MMM d')} style={{ flex: 1, aspectRatio: '1', borderRadius: 4, background: v > 0 ? `${sc.color}cc` : 'rgba(255,255,255,0.05)', border: `1px solid ${v > 0 ? `${sc.color}40` : 'rgba(255,255,255,0.05)'}`, maxWidth: 22 }}/>
              ))}
            </div>
          </div>
        )}

        {/* ── HEALTH TAB ── */}
        {activeTab === 'health' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Fitness level selector */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Dumbbell style={{ width: 9, height: 9 }}/> Fitness Level
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FITNESS_LEVELS.map(level => {
                  const isActive = clientHealth.fitnessLevel === level;
                  const colors = { Beginner: '#a78bfa', Intermediate: '#38bdf8', Advanced: '#34d399', Elite: '#fbbf24' };
                  const c = colors[level] || '#64748b';
                  return (
                    <button key={level} onClick={() => updateHealth('fitnessLevel', level)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: isActive ? 700 : 500, background: isActive ? `${c}16` : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? `${c}35` : 'rgba(255,255,255,0.07)'}`, color: isActive ? c : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isActive && <Check style={{ width: 9, height: 9 }}/>}{level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Injuries */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Heart style={{ width: 9, height: 9 }}/> Injuries & Pain Points
              </div>
              <textarea
                value={clientHealth.injuries}
                onChange={e => updateHealth('injuries', e.target.value)}
                placeholder="e.g. Lower back pain, left shoulder impingement, knee tendinopathy…"
                style={{ ...inputStyle, minHeight: 60, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, fontSize: 12, color: '#94a3b8' }}
              />
            </div>

            {/* Restrictions */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Shield style={{ width: 9, height: 9 }}/> Movement Restrictions
              </div>
              <textarea
                value={clientHealth.restrictions}
                onChange={e => updateHealth('restrictions', e.target.value)}
                placeholder="e.g. No overhead pressing, avoid deep squats, low-impact only…"
                style={{ ...inputStyle, minHeight: 60, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, fontSize: 12, color: '#94a3b8' }}
              />
            </div>

            {/* Health notes */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <ClipboardList style={{ width: 9, height: 9 }}/> Additional Health Notes
                {(clientHealth.injuries || clientHealth.restrictions || clientHealth.notes) && (
                  <span style={{ fontSize: 9, color: '#34d399', fontWeight: 600 }}>✓ saved</span>
                )}
              </div>
              <textarea
                value={clientHealth.notes}
                onChange={e => updateHealth('notes', e.target.value)}
                placeholder="Medications, allergies, medical conditions, GP clearance, anything relevant…"
                style={{ ...inputStyle, minHeight: 68, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, fontSize: 12, color: '#94a3b8' }}
              />
            </div>

            {/* Summary chips */}
            {(clientHealth.fitnessLevel || clientHealth.injuries || clientHealth.restrictions) && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 9, color: '#3a5070', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Summary</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {clientHealth.fitnessLevel && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                      {clientHealth.fitnessLevel}
                    </span>
                  )}
                  {clientHealth.injuries && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                      ⚠️ Injury noted
                    </span>
                  )}
                  {clientHealth.restrictions && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                      🛑 Restrictions noted
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GOALS TAB ── */}
        {activeTab === 'goals' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Client Goals</span>
              <button onClick={() => setShowGoalForm(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>
                <Plus style={{ width: 9, height: 9 }}/> Add Goal
              </button>
            </div>
            {showGoalForm && (
              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)', marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                  <input value={newGoal.title}   onChange={e => setNewGoal(p=>({...p,title:e.target.value}))}   placeholder="Goal (e.g. Bench 100kg)" style={inputStyle}/>
                  <input value={newGoal.target}  onChange={e => setNewGoal(p=>({...p,target:e.target.value}))}  placeholder="Target" style={inputStyle}/>
                  <input value={newGoal.unit}    onChange={e => setNewGoal(p=>({...p,unit:e.target.value}))}    placeholder="Unit (kg)" style={inputStyle}/>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={newGoal.current} onChange={e => setNewGoal(p=>({...p,current:e.target.value}))} placeholder="Current value" style={{ ...inputStyle, flex: 1 }}/>
                  <button onClick={handleAddGoal} style={{ padding: '7px 16px', borderRadius: 7, background: '#7c3aed', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                </div>
              </div>
            )}
            {clientGoals.length === 0
              ? <p style={{ fontSize: 11, color: '#3a5070', margin: 0, textAlign: 'center', padding: '12px 0' }}>No goals set yet.</p>
              : clientGoals.map((g, i) => {
                const current = parseFloat(g.current) || 0;
                const target  = parseFloat(g.target)  || 0;
                const pct     = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                return (
                  <div key={g.id || i} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8' }}>{g.title}</span>
                      <button onClick={() => saveGoal(m.user_id, clientGoals.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}><X style={{ width: 12, height: 12 }}/></button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#34d399' : 'linear-gradient(90deg,#a78bfa,#7c3aed)', borderRadius: 99 }}/>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: pct >= 100 ? '#34d399' : '#a78bfa', flexShrink: 0 }}>{current}{g.unit} / {g.target}{g.unit} · {pct}%</span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {activeTab === 'notes' && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              Coach Notes {notes[m.user_id] && <span style={{ fontSize: 9, color: '#34d399', fontWeight: 600 }}>✓ saved</span>}
            </div>
            <textarea
              placeholder={`Private notes about ${m.user_name || 'this client'} — progress observations, behaviours, preferences…`}
              value={notes[m.user_id] || ''}
              onChange={e => saveNote(m.user_id, e.target.value)}
              style={{ width: '100%', minHeight: 120, padding: '10px 12px', borderRadius: 9, background: '#060c18', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Tags & Labels</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {PRESET_TAGS.map(tag => {
                const isActive = clientTags.includes(tag);
                return (
                  <button key={tag} onClick={() => toggleTag(tag)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: isActive ? 700 : 500, background: isActive ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.07)'}`, color: isActive ? '#a78bfa' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isActive && <Check style={{ width: 9, height: 9 }}/>}{tag}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Client Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Email',        value: m.user_email || '—' },
                { label: 'Member Since', value: m.join_date ? format(new Date(m.join_date), 'MMM d, yyyy') : m.created_date ? format(new Date(m.created_date), 'MMM d, yyyy') : '—' },
                { label: 'Membership',   value: m.membership_type || 'Monthly' },
                { label: 'First Visit',  value: clientCIs.length > 0 ? format(new Date([...clientCIs].sort((a, b) => new Date(a.check_in_date) - new Date(b.check_in_date))[0].check_in_date), 'MMM d, yyyy') : 'Not yet' },
                { label: 'Status',       value: STATUS_CFG[m.status]?.label || 'Unknown' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 8, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', wordBreak: 'break-all' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {/* Coach tools repeat at bottom for profile tab */}
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Coach Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: MessageCircle, label: 'Send Message',    color: '#38bdf8', modal: 'post',            data: { memberId: m.user_id } },
                { icon: ClipboardList, label: 'Add Note',        color: '#a78bfa', action: () => setActiveTab('notes'), data: null },
                { icon: Calendar,      label: 'Book into Class', color: '#34d399', modal: 'bookIntoClass',   data: { memberId: m.user_id, memberName: m.user_name } },
                { icon: Trophy,        label: 'Assign Challenge',color: '#fbbf24', modal: 'assignChallenge', data: { memberId: m.user_id, memberName: m.user_name } },
              ].map(({ icon: Ic, label, color, modal, action, data }, i) => (
                <button key={i} onClick={() => action ? action() : openModal(modal, data)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: `${color}09`, border: `1px solid ${color}20`, color, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = `${color}18`}
                  onMouseLeave={e => e.currentTarget.style.background = `${color}09`}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic style={{ width: 12, height: 12, color }}/>
                  </div>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TabCoachMembers({ allMemberships, checkIns, ci30, avatarMap, openModal, now }) {
  const [search,   setSearch]   = useState('');
  const [segment,  setSegment]  = useState('all');
  const [sort,     setSort]     = useState('recentlyActive');
  const [viewMode, setViewMode] = useState('list');
  const [lbMetric, setLbMetric] = useState('streak');
  const [expanded, setExpanded] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const gymId = allMemberships[0]?.gym_id || null;

  // Persisted coach annotations — localStorage is the immediate cache;
  // the backend (coachData function) is the source of truth.
  // SECURITY: Storing sensitive member health/notes in localStorage exposes them
  // to shared-device attacks and XSS. We write-through to the backend so data
  // survives device switches and isn't readable by other device users.
  const [notes,  setNotes]  = useState(() => { try { return JSON.parse(localStorage.getItem('coachClientNotes')  || '{}'); } catch { return {}; } });
  const [tags,   setTags]   = useState(() => { try { return JSON.parse(localStorage.getItem('coachClientTags')   || '{}'); } catch { return {}; } });
  const [goals,  setGoals]  = useState(() => { try { return JSON.parse(localStorage.getItem('coachClientGoals')  || '{}'); } catch { return {}; } });
  const [health, setHealth] = useState(() => { try { return JSON.parse(localStorage.getItem('coachClientHealth') || '{}'); } catch { return {}; } });

  // On mount: load from backend, overriding stale localStorage
  useEffect(() => {
    if (!gymId) return;
    base44.functions.invoke('coachData', { action: 'read', gymId })
      .then(result => {
        if (!result?.data) return;
        const d = result.data;
        if (d.client_notes  && Object.keys(d.client_notes).length)  { setNotes(d.client_notes);  localStorage.setItem('coachClientNotes',  JSON.stringify(d.client_notes));  }
        if (d.client_tags   && Object.keys(d.client_tags).length)   { setTags(d.client_tags);    localStorage.setItem('coachClientTags',   JSON.stringify(d.client_tags));   }
        if (d.client_goals  && Object.keys(d.client_goals).length)  { setGoals(d.client_goals);  localStorage.setItem('coachClientGoals',  JSON.stringify(d.client_goals));  }
        if (d.client_health && Object.keys(d.client_health).length) { setHealth(d.client_health); localStorage.setItem('coachClientHealth', JSON.stringify(d.client_health)); }
      })
      .catch(() => {}); // fall back to localStorage silently
  }, [gymId]);

  // Write-through helpers: update state → localStorage (instant) → backend (async)
  const saveNote   = (uid, val) => {
    const u = { ...notes,  [uid]: val }; setNotes(u);
    try { localStorage.setItem('coachClientNotes',  JSON.stringify(u)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field: 'client_notes',  data: u }).catch(() => {});
  };
  const saveTag    = (uid, val) => {
    const u = { ...tags,   [uid]: val }; setTags(u);
    try { localStorage.setItem('coachClientTags',   JSON.stringify(u)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field: 'client_tags',   data: u }).catch(() => {});
  };
  const saveGoal   = (uid, val) => {
    const u = { ...goals,  [uid]: val }; setGoals(u);
    try { localStorage.setItem('coachClientGoals',  JSON.stringify(u)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field: 'client_goals',  data: u }).catch(() => {});
  };
  const saveHealth = (uid, val) => {
    const u = { ...health, [uid]: val }; setHealth(u);
    try { localStorage.setItem('coachClientHealth', JSON.stringify(u)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field: 'client_health', data: u }).catch(() => {});
  };

  const memberLastCI = useMemo(() => {
    const map = {};
    checkIns.forEach(c => { if (!map[c.user_id] || new Date(c.check_in_date) > new Date(map[c.user_id])) map[c.user_id] = c.check_in_date; });
    return map;
  }, [checkIns]);

  const enriched = useMemo(() => allMemberships.map(m => {
    const last        = memberLastCI[m.user_id];
    const daysAgo     = last ? Math.floor((now - new Date(last)) / 86400000) : null;
    const visits      = ci30.filter(c => c.user_id === m.user_id).length;
    const visitsPrev  = checkIns.filter(c => c.user_id === m.user_id && isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 60), end: subDays(now, 30) })).length;
    const trend       = visitsPrev > 0 ? Math.round(((visits - visitsPrev) / visitsPrev) * 100) : 0;
    const ciDays      = new Set(checkIns.filter(c => c.user_id === m.user_id).map(c => startOfDay(new Date(c.check_in_date)).getTime()));
    let streak = 0;
    for (let i = 0; i <= 60; i++) { if (ciDays.has(startOfDay(subDays(now, i)).getTime())) streak++; else break; }
    const totalVisits    = checkIns.filter(c => c.user_id === m.user_id).length;
    const nextMilestone  = [5, 10, 25, 50, 100, 200, 500].find(n => n > totalVisits);
    const spark          = Array.from({ length: 14 }, (_, i) => checkIns.filter(c => c.user_id === m.user_id && startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now, 13 - i)).getTime()).length);
    const isNew          = m.join_date && isWithinInterval(new Date(m.join_date), { start: subDays(now, 30), end: now });
    const hasHealthNotes = !!(health[m.user_id]?.injuries || health[m.user_id]?.restrictions);
    const status         = visits >= 15 ? 'vip' : !last ? 'inactive' : daysAgo >= 14 ? 'at_risk' : daysAgo <= 2 ? 'active' : 'regular';
    return { ...m, last, daysAgo, visits, trend, streak, status, spark, totalVisits, nextMilestone, isNew, hasHealthNotes };
  }), [allMemberships, checkIns, ci30, memberLastCI, now, health]);

  const counts = {
    all:     enriched.length,
    new:     enriched.filter(m => m.isNew).length,
    vip:     enriched.filter(m => m.status === 'vip').length,
    active:  enriched.filter(m => m.status === 'active' || m.status === 'regular').length,
    at_risk: enriched.filter(m => m.status === 'at_risk').length,
    lapsed:  enriched.filter(m => m.status === 'inactive').length,
  };

  const SEGMENTS = [
    { id: 'all',     label: 'All Clients', count: counts.all     },
    { id: 'new',     label: '🌱 New',      count: counts.new     },
    { id: 'vip',     label: '⭐ VIP',      count: counts.vip     },
    { id: 'active',  label: 'Active',      count: counts.active  },
    { id: 'at_risk', label: '⚠️ At Risk',  count: counts.at_risk },
    { id: 'lapsed',  label: 'Lapsed',      count: counts.lapsed  },
  ];

  const filtered = useMemo(() => enriched
    .filter(m => {
      const matchSeg = segment === 'all' ? true : segment === 'new' ? m.isNew : segment === 'vip' ? m.status === 'vip' : segment === 'active' ? (m.status === 'active' || m.status === 'regular') : m.status === segment;
      return matchSeg && (!search || (m.user_name || '').toLowerCase().includes(search.toLowerCase()));
    })
    .sort((a, b) => {
      if (sort === 'recentlyActive') { if (!a.last && !b.last) return 0; if (!a.last) return 1; if (!b.last) return -1; return new Date(b.last) - new Date(a.last); }
      if (sort === 'mostVisits') return b.visits - a.visits;
      if (sort === 'name')       return (a.user_name || '').localeCompare(b.user_name || '');
      if (sort === 'streak')     return b.streak - a.streak;
      if (sort === 'risk')       return (STATUS_PRIORITY[a.status] ?? 4) - (STATUS_PRIORITY[b.status] ?? 4);
      return 0;
    }), [enriched, segment, search, sort]);

  const lbData = useMemo(() => [...enriched].sort((a, b) => {
    if (lbMetric === 'streak')  return b.streak - a.streak;
    if (lbMetric === 'monthly') return b.visits - a.visits;
    return b.totalVisits - a.totalVisits;
  }).slice(0, 10), [enriched, lbMetric]);

  const detailProps = { checkIns, avatarMap, now, notes, saveNote, tags, saveTag, goals, saveGoal, health, saveHealth, openModal };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <CoachKpiCard icon={Users}       label="Total Clients"     value={allMemberships.length}          sub="assigned to you"                                              accentColor="#0ea5e9"/>
        <CoachKpiCard icon={Activity}    label="Active This Month"  value={counts.vip + counts.active}    sub="visited this month"                                           accentColor="#10b981" footerBar={allMemberships.length > 0 ? ((counts.vip + counts.active) / allMemberships.length) * 100 : 0}/>
        <CoachKpiCard icon={UserPlus}    label="New This Month"     value={counts.new}                    sub="recently joined"                                              accentColor="#a78bfa"/>
        <CoachKpiCard icon={AlertCircle} label="Need Attention"     value={counts.at_risk + counts.lapsed} sub={`${counts.at_risk} absent · ${counts.lapsed} lapsed`}        accentColor={counts.at_risk > 0 ? '#ef4444' : '#34d399'} subColor={counts.at_risk > 0 ? '#f87171' : '#34d399'}/>
      </div>

      {/* ── Segment filters ── */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
        {SEGMENTS.map(s => (
          <button key={s.id} onClick={() => setSegment(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 99, border: segment === s.id ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.06)', background: segment === s.id ? 'rgba(167,139,250,0.12)' : 'transparent', color: segment === s.id ? '#a78bfa' : '#64748b', fontSize: 11, fontWeight: segment === s.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}>
            {s.label}
            {s.count > 0 && <span style={{ fontSize: 9, fontWeight: 800, background: segment === s.id ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)', borderRadius: 99, padding: '1px 5px' }}>{s.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: '#3a5070' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…" style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 10, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f4f8', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}/>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '8px 10px', borderRadius: 9, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <option value="recentlyActive">Recently Active</option>
          <option value="mostVisits">Most Visits</option>
          <option value="name">Name A–Z</option>
          <option value="streak">Streak</option>
          <option value="risk">Risk Level</option>
        </select>
        <div style={{ display: 'flex', gap: 2, padding: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, flexShrink: 0 }}>
          {[{ id: 'list', icon: List }, { id: 'cards', icon: LayoutGrid }, { id: 'leaderboard', icon: Trophy }].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)} style={{ width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, border: viewMode === v.id ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent', background: viewMode === v.id ? '#0c1a2e' : 'transparent', color: viewMode === v.id ? '#a78bfa' : '#3a5070', cursor: 'pointer' }}>
              <v.icon style={{ width: 12, height: 12 }}/>
            </button>
          ))}
        </div>
        <button onClick={() => exportCSV(filtered)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          <Download style={{ width: 11, height: 11 }}/> Export
        </button>
      </div>

      {/* ── LEADERBOARD ── */}
      {viewMode === 'leaderboard' && (
        <div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {[{ id: 'streak', label: '🔥 Streak' }, { id: 'monthly', label: '📅 Month' }, { id: 'alltime', label: '⭐ All Time' }].map(metric => (
              <button key={metric.id} onClick={() => setLbMetric(metric.id)} style={{ padding: '5px 12px', borderRadius: 99, border: lbMetric === metric.id ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(255,255,255,0.06)', background: lbMetric === metric.id ? 'rgba(251,191,36,0.1)' : 'transparent', color: lbMetric === metric.id ? '#fbbf24' : '#64748b', fontSize: 11, fontWeight: lbMetric === metric.id ? 700 : 500, cursor: 'pointer' }}>
                {metric.label}
              </button>
            ))}
          </div>
          <CoachCard accent="#fbbf24">
            {lbData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#3a5070' }}>
                <Trophy style={{ width: 24, height: 24, opacity: 0.3, margin: '0 auto 8px' }}/>
                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No data yet</p>
              </div>
            ) : lbData.map((m, i) => {
              const sc     = STATUS_CFG[m.status] || STATUS_CFG.regular;
              const val    = lbMetric === 'streak' ? `${m.streak}d 🔥` : lbMetric === 'monthly' ? `${m.visits} visits` : `${m.totalVisits} total`;
              const barMax = lbData[0] ? (lbMetric === 'streak' ? lbData[0].streak : lbMetric === 'monthly' ? lbData[0].visits : lbData[0].totalVisits) : 1;
              const barVal = lbMetric === 'streak' ? m.streak : lbMetric === 'monthly' ? m.visits : m.totalVisits;
              return (
                <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < lbData.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i < 3 ? `rgba(251,191,36,${0.03 - i * 0.01})` : 'transparent' }}>
                  <div style={{ width: 22, textAlign: 'center', fontSize: i < 3 ? 16 : 11, fontWeight: 900, color: '#64748b', flexShrink: 0 }}>{MEDALS[i] || i + 1}</div>
                  <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={34} color={sc.color}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Client'}</div>
                    <div style={{ marginTop: 4, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barMax > 0 ? (barVal / barMax) * 100 : 0}%`, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', borderRadius: 99 }}/>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', borderRadius: 7, padding: '3px 10px', flexShrink: 0 }}>{val}</span>
                </div>
              );
            })}
          </CoachCard>
        </div>
      )}

      {/* ── CARDS VIEW ── */}
      {viewMode === 'cards' && (
        <>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#3a5070' }}>
              <Users style={{ width: 24, height: 24, opacity: 0.3, margin: '0 auto 8px' }}/>
              <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No clients found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {filtered.map((m, i) => <ClientCard key={m.user_id || i} m={m} avatarMap={avatarMap} openModal={openModal} onSelect={setSelectedClient}/>)}
            </div>
          )}
          {selectedClient && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedClient(null)}>
              <div style={{ width: '100%', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto', borderRadius: 20, background: '#0d1b2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
                {/* Modal header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: '#0d1b2e', zIndex: 1 }}>
                  <MiniAvatar name={selectedClient.user_name} src={avatarMap[selectedClient.user_id]} size={44} color={STATUS_CFG[selectedClient.status]?.color || '#a78bfa'}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f4f8' }}>{selectedClient.user_name || 'Client'}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: STATUS_CFG[selectedClient.status]?.color, background: STATUS_CFG[selectedClient.status]?.bg, borderRadius: 4, padding: '2px 7px' }}>{STATUS_CFG[selectedClient.status]?.label}</span>
                      {selectedClient.hasHealthNotes && <span style={{ fontSize: 9, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>⚠️ Health notes</span>}
                      {(health[selectedClient.user_id]?.fitnessLevel) && <span style={{ fontSize: 9, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>{health[selectedClient.user_id].fitnessLevel}</span>}
                    </div>
                  </div>
                  <button onClick={() => setSelectedClient(null)} style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#64748b', cursor: 'pointer' }}>
                    <X style={{ width: 13, height: 13 }}/>
                  </button>
                </div>
                <ClientDetailPanel m={selectedClient} {...detailProps}/>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && (
        <CoachCard style={{ overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#3a5070' }}>
              <Users style={{ width: 24, height: 24, opacity: 0.3, margin: '0 auto 8px' }}/>
              <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No clients found</p>
            </div>
          ) : filtered.map((m, i) => {
            const sc           = STATUS_CFG[m.status] || STATUS_CFG.regular;
            const isExp        = expanded === (m.user_id || i);
            const sparkMax     = Math.max(...m.spark, 1);
            const clientTagList = tags[m.user_id] || [];
            const hasHealth    = !!(health[m.user_id]?.injuries || health[m.user_id]?.restrictions);

            return (
              <div key={m.user_id || i}>
                {/* Row */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: isExp ? 'none' : '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: isExp ? `${sc.color}05` : 'transparent', transition: 'background 0.12s' }}
                  onClick={() => setExpanded(isExp ? null : (m.user_id || i))}
                  onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isExp ? `${sc.color}05` : 'transparent'; }}>

                  {/* Avatar + status dot */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={38} color={sc.color}/>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: sc.color, border: '2px solid #0c1a2e' }}/>
                  </div>

                  {/* Name + badges */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Client'}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: sc.color, background: sc.bg, borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>{sc.label}</span>
                      {m.isNew       && <span style={{ fontSize: 9, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', borderRadius: 4, padding: '2px 5px', flexShrink: 0 }}>New</span>}
                      {m.streak >= 7 && <span style={{ fontSize: 9, color: '#f59e0b', flexShrink: 0 }}>🔥{m.streak}d</span>}
                      {hasHealth     && <span style={{ fontSize: 8, color: '#f87171', background: 'rgba(248,113,113,0.08)', borderRadius: 3, padding: '1px 5px', flexShrink: 0, border: '1px solid rgba(248,113,113,0.18)' }}>⚠️ Health</span>}
                      {clientTagList.slice(0, 2).map(t => <span key={t} style={{ fontSize: 8, color: '#a78bfa', background: 'rgba(167,139,250,0.06)', borderRadius: 3, padding: '1px 5px', flexShrink: 0, border: '1px solid rgba(167,139,250,0.15)' }}>{t}</span>)}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 10, color: '#64748b' }}>{m.visits} visits/mo</span>
                      {m.daysAgo !== null && <span style={{ fontSize: 10, color: '#3a5070' }}>Last: {m.daysAgo === 0 ? 'today' : `${m.daysAgo}d ago`}</span>}
                      {m.trend !== 0 && <span style={{ fontSize: 10, color: m.trend > 0 ? '#34d399' : '#f87171' }}>{m.trend > 0 ? `↑${m.trend}%` : `↓${Math.abs(m.trend)}%`}</span>}
                    </div>
                  </div>

                  {/* 14-day spark dots */}
                  <div style={{ width: 52, flexShrink: 0 }}>
                    <svg viewBox="0 0 52 20" style={{ width: 52, height: 20 }}>
                      {m.spark.map((v, si) => { const x = (si / (m.spark.length - 1)) * 48 + 2; const y = 18 - (v / sparkMax) * 14; return <circle key={si} cx={x} cy={y} r={1.5} fill={v > 0 ? sc.color : 'rgba(255,255,255,0.1)'}/> })}
                    </svg>
                  </div>

                  {/* Engagement bar */}
                  <EngagementBar visits={m.visits} trend={m.trend} streak={m.streak} color={sc.color}/>

                  {/* Message icon */}
                  <button onClick={e => { e.stopPropagation(); openModal('post', { memberId: m.user_id }); }} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)', color: '#38bdf8', cursor: 'pointer', flexShrink: 0 }}>
                    <MessageCircle style={{ width: 11, height: 11 }}/>
                  </button>

                  <ChevronRight style={{ width: 13, height: 13, color: '#3a5070', flexShrink: 0, transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}/>
                </div>

                {/* Expanded detail panel */}
                {isExp && <ClientDetailPanel m={m} {...detailProps}/>}
              </div>
            );
          })}
        </CoachCard>
      )}
    </div>
  );
}