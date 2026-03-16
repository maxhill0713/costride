import React, { useState, useMemo } from 'react';
import { subDays, startOfDay, isWithinInterval, format } from 'date-fns';
import {
  Users, Activity, AlertCircle, Flame, MessageCircle, ChevronRight, Search,
  Download, Plus, Check, X, Trophy, UserPlus, List, LayoutGrid,
} from 'lucide-react';
import { CoachKpiCard, CoachCard, MiniAvatar } from './CoachHelpers';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_PRIORITY = { vip: 0, active: 1, regular: 2, at_risk: 3, inactive: 4 };
const STATUS_CFG = {
  vip:      { color: '#fbbf24', label: 'VIP',      bg: 'rgba(251,191,36,0.1)'  },
  active:   { color: '#34d399', label: 'Active',   bg: 'rgba(52,211,153,0.1)'  },
  regular:  { color: '#38bdf8', label: 'Regular',  bg: 'rgba(56,189,248,0.1)'  },
  at_risk:  { color: '#f87171', label: 'At Risk',  bg: 'rgba(248,113,113,0.1)' },
  inactive: { color: '#64748b', label: 'Lapsed',   bg: 'rgba(100,116,139,0.1)' },
};
const PRESET_TAGS = ['VIP', 'Beginner', 'Advanced', 'Injury', 'Nutrition Goal', 'Competition Prep', 'Post-Rehab', 'Online Client'];
const MEDALS = ['🥇', '🥈', '🥉'];

// ── CSV export ────────────────────────────────────────────────────────────────
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
  const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const url  = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a    = document.createElement('a');
  a.href = url; a.download = 'clients.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── Client card (grid view) ───────────────────────────────────────────────────
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

// ── Client detail panel ───────────────────────────────────────────────────────
function ClientDetailPanel({ m, checkIns, avatarMap, now, notes, saveNote, tags, saveTag, goals, saveGoal, openModal }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [newGoal, setNewGoal]     = useState({ title: '', target: '', unit: '', current: '' });
  const [showGoalForm, setShowGoalForm] = useState(false);

  const sc           = STATUS_CFG[m.status] || STATUS_CFG.regular;
  const clientCIs    = checkIns.filter(c => c.user_id === m.user_id).sort((a,b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const clientGoals  = goals[m.user_id] || [];
  const clientTags   = tags[m.user_id]  || [];

  const handleAddGoal = () => {
    if (!newGoal.title) return;
    const updated = [...clientGoals, { ...newGoal, id: Date.now() }];
    saveGoal(m.user_id, updated);
    setNewGoal({ title: '', target: '', unit: '', current: '' });
    setShowGoalForm(false);
  };
  const toggleTag = (tag) => {
    saveTag(m.user_id, clientTags.includes(tag) ? clientTags.filter(t => t !== tag) : [...clientTags, tag]);
  };

  const inputStyle = { padding: '7px 10px', borderRadius: 7, background: '#060c18', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f4f8', fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '0 16px 16px', background: `${sc.color}04`, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 14, overflowX: 'auto' }}>
        {[['overview','Overview'],['goals','Goals'],['notes','Notes'],['profile','Profile']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '8px 14px', border: 'none', background: 'transparent', color: activeTab===id ? sc.color : '#3a5070', fontSize: 11, fontWeight: activeTab===id ? 800 : 500, cursor: 'pointer', borderBottom: `2px solid ${activeTab===id ? sc.color : 'transparent'}`, marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }}/>
        <button onClick={() => openModal('post')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', color: '#38bdf8', fontSize: 10, fontWeight: 700, cursor: 'pointer', alignSelf: 'center', flexShrink: 0 }}>
          <MessageCircle style={{ width: 10, height: 10 }}/> Message
        </button>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Total', value: m.totalVisits, color: '#a78bfa' },
              { label: 'Month',  value: m.visits,     color: '#38bdf8' },
              { label: 'Streak', value: `${m.streak}d`, color: '#f59e0b' },
              { label: 'Trend',  value: m.trend !== 0 ? `${m.trend > 0 ? '↑' : '↓'}${Math.abs(m.trend)}%` : '→', color: m.trend > 0 ? '#34d399' : m.trend < 0 ? '#f87171' : '#64748b' },
            ].map((s, i) => (
              <div key={i} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: 8, color: '#3a5070', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Recent Visits</div>
          {clientCIs.length === 0
            ? <p style={{ fontSize: 11, color: '#3a5070', margin: 0 }}>No visits recorded yet</p>
            : clientCIs.slice(0, 5).map((ci, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#34d399' : '#3a5070', flexShrink: 0 }}/>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', flex: 1 }}>{format(new Date(ci.check_in_date), 'EEE, MMM d')}</span>
                <span style={{ fontSize: 10, color: '#3a5070' }}>{format(new Date(ci.check_in_date), 'h:mm a')}</span>
                {i === 0 && <span style={{ fontSize: 9, color: '#34d399', background: 'rgba(52,211,153,0.1)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>Latest</span>}
              </div>
            ))
          }
          <div style={{ marginTop: 12, fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>14-Day Activity</div>
          <div style={{ display: 'flex', gap: 3 }}>
            {m.spark.map((v, si) => (
              <div key={si} title={format(subDays(now,13-si),'MMM d')} style={{ flex: 1, aspectRatio: '1', borderRadius: 4, background: v > 0 ? `${sc.color}cc` : 'rgba(255,255,255,0.05)', border: `1px solid ${v > 0 ? sc.color+'40' : 'rgba(255,255,255,0.05)'}`, maxWidth: 22 }}/>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
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
                <input value={newGoal.title}   onChange={e => setNewGoal(p=>({...p,title:e.target.value}))}   placeholder="Goal title (e.g. Bench 100kg)" style={inputStyle}/>
                <input value={newGoal.target}  onChange={e => setNewGoal(p=>({...p,target:e.target.value}))}  placeholder="Target" style={inputStyle}/>
                <input value={newGoal.unit}    onChange={e => setNewGoal(p=>({...p,unit:e.target.value}))}    placeholder="Unit" style={inputStyle}/>
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
                <div key={g.id||i} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8' }}>{g.title}</span>
                    <button onClick={() => saveGoal(m.user_id, clientGoals.filter((_,j) => j!==i))} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}><X style={{ width: 12, height: 12 }}/></button>
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

      {/* Notes */}
      {activeTab === 'notes' && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            Coach Notes {notes[m.user_id] && <span style={{ fontSize: 9, color: '#34d399', fontWeight: 600 }}>✓ saved</span>}
          </div>
          <textarea
            placeholder={`Private notes about ${m.user_name||'this client'} — injuries, preferences, progress observations…`}
            value={notes[m.user_id] || ''}
            onChange={e => saveNote(m.user_id, e.target.value)}
            style={{ width: '100%', minHeight: 110, padding: '10px 12px', borderRadius: 9, background: '#060c18', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
        </div>
      )}

      {/* Profile */}
      {activeTab === 'profile' && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Tags & Labels</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Member Since', value: m.join_date ? format(new Date(m.join_date),'MMM d, yyyy') : m.created_date ? format(new Date(m.created_date),'MMM d, yyyy') : '—' },
              { label: 'Membership',   value: m.membership_type || 'Monthly' },
              { label: 'First Visit',  value: clientCIs.length > 0 ? format(new Date([...clientCIs].sort((a,b) => new Date(a.check_in_date)-new Date(b.check_in_date))[0].check_in_date),'MMM d, yyyy') : 'Not yet' },
              { label: 'Status',       value: STATUS_CFG[m.status]?.label || 'Unknown' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 8, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TabCoachMembers({ allMemberships, checkIns, ci30, avatarMap, openModal, now }) {
  const [search, setSearch]     = useState('');
  const [segment, setSegment]   = useState('all');
  const [sort, setSort]         = useState('recentlyActive');
  const [viewMode, setViewMode] = useState('list');
  const [lbMetric, setLbMetric] = useState('streak');
  const [expanded, setExpanded] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const [notes, setNotes] = useState(() => { try { return JSON.parse(localStorage.getItem('coachClientNotes') || '{}'); } catch { return {}; } });
  const [tags,  setTags]  = useState(() => { try { return JSON.parse(localStorage.getItem('coachClientTags')  || '{}'); } catch { return {}; } });
  const [goals, setGoals] = useState(() => { try { return JSON.parse(localStorage.getItem('coachClientGoals') || '{}'); } catch { return {}; } });

  const saveNote = (uid, val) => { const u = {...notes, [uid]: val}; setNotes(u); try { localStorage.setItem('coachClientNotes', JSON.stringify(u)); } catch {} };
  const saveTag  = (uid, val) => { const u = {...tags,  [uid]: val}; setTags(u);  try { localStorage.setItem('coachClientTags',  JSON.stringify(u)); } catch {} };
  const saveGoal = (uid, val) => { const u = {...goals, [uid]: val}; setGoals(u); try { localStorage.setItem('coachClientGoals', JSON.stringify(u)); } catch {} };

  const memberLastCI = useMemo(() => {
    const map = {};
    checkIns.forEach(c => { if (!map[c.user_id] || new Date(c.check_in_date) > new Date(map[c.user_id])) map[c.user_id] = c.check_in_date; });
    return map;
  }, [checkIns]);

  const enriched = useMemo(() => allMemberships.map(m => {
    const last       = memberLastCI[m.user_id];
    const daysAgo    = last ? Math.floor((now - new Date(last)) / 86400000) : null;
    const visits     = ci30.filter(c => c.user_id === m.user_id).length;
    const visitsPrev = checkIns.filter(c => c.user_id === m.user_id && isWithinInterval(new Date(c.check_in_date), { start: subDays(now,60), end: subDays(now,30) })).length;
    const trend      = visitsPrev > 0 ? Math.round(((visits - visitsPrev) / visitsPrev) * 100) : 0;
    const ciDays     = new Set(checkIns.filter(c => c.user_id === m.user_id).map(c => startOfDay(new Date(c.check_in_date)).getTime()));
    let streak = 0;
    for (let i = 0; i <= 60; i++) { if (ciDays.has(startOfDay(subDays(now,i)).getTime())) streak++; else break; }
    const totalVisits   = checkIns.filter(c => c.user_id === m.user_id).length;
    const nextMilestone = [5,10,25,50,100,200,500].find(n => n > totalVisits);
    const spark         = Array.from({length:14}, (_,i) => checkIns.filter(c => c.user_id === m.user_id && startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now,13-i)).getTime()).length);
    const isNew         = m.join_date && isWithinInterval(new Date(m.join_date), { start: subDays(now,30), end: now });
    const status        = visits >= 15 ? 'vip' : !last ? 'inactive' : daysAgo >= 14 ? 'at_risk' : daysAgo <= 2 ? 'active' : 'regular';
    return { ...m, last, daysAgo, visits, trend, streak, status, spark, totalVisits, nextMilestone, isNew };
  }), [allMemberships, checkIns, ci30, memberLastCI, now]);

  const ci7 = useMemo(() => checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,7), end: now })), [checkIns, now]);

  const counts = {
    all:     enriched.length,
    new:     enriched.filter(m => m.isNew).length,
    vip:     enriched.filter(m => m.status === 'vip').length,
    active:  enriched.filter(m => m.status === 'active' || m.status === 'regular').length,
    at_risk: enriched.filter(m => m.status === 'at_risk').length,
    lapsed:  enriched.filter(m => m.status === 'inactive').length,
  };

  const SEGMENTS = [
    { id:'all',     label:'All Clients',  count: counts.all     },
    { id:'new',     label:'🌱 New',       count: counts.new     },
    { id:'vip',     label:'⭐ VIP',       count: counts.vip     },
    { id:'active',  label:'Active',       count: counts.active  },
    { id:'at_risk', label:'⚠️ At Risk',   count: counts.at_risk },
    { id:'lapsed',  label:'Lapsed',       count: counts.lapsed  },
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
      if (sort === 'risk')       return (STATUS_PRIORITY[a.status]??4) - (STATUS_PRIORITY[b.status]??4);
      return 0;
    }), [enriched, segment, search, sort]);

  const lbData = useMemo(() => [...enriched].sort((a,b) => {
    if (lbMetric === 'streak')  return b.streak - a.streak;
    if (lbMetric === 'monthly') return b.visits - a.visits;
    return b.totalVisits - a.totalVisits;
  }).slice(0, 10), [enriched, lbMetric]);

  const avgStreak = enriched.length > 0 ? Math.round(enriched.reduce((s,m) => s+m.streak, 0) / enriched.length) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <CoachKpiCard icon={Users}       label="Total Clients"    value={allMemberships.length}     sub="assigned to you"                                          accentColor="#0ea5e9"/>
        <CoachKpiCard icon={Activity}    label="Active This Month" value={counts.vip + counts.active} sub="visited this month"                                     accentColor="#10b981" footerBar={allMemberships.length > 0 ? ((counts.vip+counts.active)/allMemberships.length)*100 : 0}/>
        <CoachKpiCard icon={UserPlus}    label="New This Month"    value={counts.new}                sub="recently joined"                                          accentColor="#a78bfa"/>
        <CoachKpiCard icon={AlertCircle} label="Need Attention"   value={counts.at_risk + counts.lapsed} sub={`${counts.at_risk} absent · ${counts.lapsed} lapsed`} accentColor={counts.at_risk > 0 ? '#ef4444' : '#34d399'} subColor={counts.at_risk > 0 ? '#f87171' : '#34d399'}/>
      </div>

      {/* Segment tabs */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
        {SEGMENTS.map(s => (
          <button key={s.id} onClick={() => setSegment(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 99, border: segment===s.id ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.06)', background: segment===s.id ? 'rgba(167,139,250,0.12)' : 'transparent', color: segment===s.id ? '#a78bfa' : '#64748b', fontSize: 11, fontWeight: segment===s.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}>
            {s.label}
            {s.count > 0 && <span style={{ fontSize: 9, fontWeight: 800, background: segment===s.id ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)', borderRadius: 99, padding: '1px 5px' }}>{s.count}</span>}
          </button>
        ))}
      </div>

      {/* Controls */}
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
        {/* View mode */}
        <div style={{ display: 'flex', gap: 2, padding: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, flexShrink: 0 }}>
          {[{ id:'list', icon: List }, { id:'cards', icon: LayoutGrid }, { id:'leaderboard', icon: Trophy }].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)} style={{ width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, border: viewMode===v.id ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent', background: viewMode===v.id ? '#0c1a2e' : 'transparent', color: viewMode===v.id ? '#a78bfa' : '#3a5070', cursor: 'pointer' }}>
              <v.icon style={{ width: 12, height: 12 }}/>
            </button>
          ))}
        </div>
        <button onClick={() => exportCSV(filtered)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          <Download style={{ width: 11, height: 11 }}/> Export CSV
        </button>
      </div>

      {/* ── LEADERBOARD ── */}
      {viewMode === 'leaderboard' && (
        <div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {[{ id:'streak', label:'🔥 Streak' }, { id:'monthly', label:'📅 Month' }, { id:'alltime', label:'⭐ All Time' }].map(m => (
              <button key={m.id} onClick={() => setLbMetric(m.id)} style={{ padding: '5px 12px', borderRadius: 99, border: lbMetric===m.id ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(255,255,255,0.06)', background: lbMetric===m.id ? 'rgba(251,191,36,0.1)' : 'transparent', color: lbMetric===m.id ? '#fbbf24' : '#64748b', fontSize: 11, fontWeight: lbMetric===m.id ? 700 : 500, cursor: 'pointer' }}>
                {m.label}
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
                <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < lbData.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i < 3 ? `rgba(251,191,36,${0.03-i*0.01})` : 'transparent' }}>
                  <div style={{ width: 22, textAlign: 'center', fontSize: i < 3 ? 16 : 11, fontWeight: 900, color: '#64748b', flexShrink: 0 }}>{MEDALS[i] || i+1}</div>
                  <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={34} color={sc.color}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Client'}</div>
                    <div style={{ marginTop: 4, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barMax > 0 ? (barVal/barMax)*100 : 0}%`, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', borderRadius: 99 }}/>
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
              {filtered.map((m, i) => <ClientCard key={m.user_id||i} m={m} avatarMap={avatarMap} openModal={openModal} onSelect={setSelectedClient}/>)}
            </div>
          )}
          {selectedClient && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedClient(null)}>
              <div style={{ width: '100%', maxWidth: 520, maxHeight: '82vh', overflowY: 'auto', borderRadius: 20, background: '#0d1b2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <MiniAvatar name={selectedClient.user_name} src={avatarMap[selectedClient.user_id]} size={44} color={STATUS_CFG[selectedClient.status]?.color || '#a78bfa'}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f4f8' }}>{selectedClient.user_name || 'Client'}</div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: STATUS_CFG[selectedClient.status]?.color, background: STATUS_CFG[selectedClient.status]?.bg, borderRadius: 4, padding: '2px 7px' }}>{STATUS_CFG[selectedClient.status]?.label}</span>
                  </div>
                  <button onClick={() => setSelectedClient(null)} style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#64748b', cursor: 'pointer' }}>
                    <X style={{ width: 13, height: 13 }}/>
                  </button>
                </div>
                <ClientDetailPanel m={selectedClient} checkIns={checkIns} avatarMap={avatarMap} now={now} notes={notes} saveNote={saveNote} tags={tags} saveTag={saveTag} goals={goals} saveGoal={saveGoal} openModal={openModal}/>
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
            const sc      = STATUS_CFG[m.status] || STATUS_CFG.regular;
            const pct     = Math.min(100, (m.visits / 20) * 100);
            const isExp   = expanded === (m.user_id || i);
            const sparkMax = Math.max(...m.spark, 1);
            const clientTagList = tags[m.user_id] || [];

            return (
              <div key={m.user_id || i}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: isExp ? 'none' : '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: isExp ? `${sc.color}05` : 'transparent', transition: 'background 0.12s' }}
                  onClick={() => setExpanded(isExp ? null : (m.user_id || i))}
                  onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isExp ? `${sc.color}05` : 'transparent'; }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={38} color={sc.color}/>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: sc.color, border: '2px solid #0c1a2e' }}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Client'}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: sc.color, background: sc.bg, borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>{sc.label}</span>
                      {m.isNew   && <span style={{ fontSize: 9, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', borderRadius: 4, padding: '2px 5px', flexShrink: 0 }}>New</span>}
                      {m.streak >= 7 && <span style={{ fontSize: 9, color: '#f59e0b', flexShrink: 0 }}>🔥{m.streak}d</span>}
                      {clientTagList.slice(0,2).map(t => <span key={t} style={{ fontSize: 8, color: '#a78bfa', background: 'rgba(167,139,250,0.06)', borderRadius: 3, padding: '1px 5px', flexShrink: 0, border: '1px solid rgba(167,139,250,0.15)' }}>{t}</span>)}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 10, color: '#64748b' }}>{m.visits} visits/mo</span>
                      {m.daysAgo !== null && <span style={{ fontSize: 10, color: '#3a5070' }}>Last: {m.daysAgo === 0 ? 'today' : `${m.daysAgo}d ago`}</span>}
                      {m.trend !== 0 && <span style={{ fontSize: 10, color: m.trend > 0 ? '#34d399' : '#f87171' }}>{m.trend > 0 ? `↑${m.trend}%` : `↓${Math.abs(m.trend)}%`}</span>}
                    </div>
                  </div>
                  <div style={{ width: 52, flexShrink: 0 }}>
                    <svg viewBox="0 0 52 20" style={{ width: 52, height: 20 }}>
                      {m.spark.map((v, si) => { const x=(si/(m.spark.length-1))*48+2; const y=18-(v/sparkMax)*14; return <circle key={si} cx={x} cy={y} r={1.5} fill={v>0?sc.color:'rgba(255,255,255,0.1)'}/>; })}
                    </svg>
                  </div>
                  <div style={{ flexShrink: 0, width: 52 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', textAlign: 'right', marginBottom: 3 }}>{m.visits}<span style={{ fontSize: 9, color: '#3a5070', fontWeight: 400 }}>/mo</span></div>
                    <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${sc.color},${sc.color}88)`, borderRadius: 99 }}/>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); openModal('post'); }} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)', color: '#38bdf8', cursor: 'pointer', flexShrink: 0 }}>
                    <MessageCircle style={{ width: 11, height: 11 }}/>
                  </button>
                  <ChevronRight style={{ width: 13, height: 13, color: '#3a5070', flexShrink: 0, transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}/>
                </div>
                {isExp && (
                  <ClientDetailPanel m={m} checkIns={checkIns} avatarMap={avatarMap} now={now} notes={notes} saveNote={saveNote} tags={tags} saveTag={saveTag} goals={goals} saveGoal={saveGoal} openModal={openModal}/>
                )}
              </div>
            );
          })}
        </CoachCard>
      )}
    </div>
  );
}