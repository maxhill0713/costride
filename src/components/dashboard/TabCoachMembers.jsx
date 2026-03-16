import React, { useState } from 'react';
import { subDays, startOfDay, isWithinInterval } from 'date-fns';
import { format } from 'date-fns';
import { Users, Activity, AlertCircle, Flame, MessageCircle, ChevronRight, Trophy } from 'lucide-react';
import { CoachKpiCard, CoachCard, MiniAvatar } from './CoachHelpers';

const STATUS_CFG = {
  active:   { color: '#34d399', label: 'Active',   bg: 'rgba(52,211,153,0.1)'  },
  regular:  { color: '#38bdf8', label: 'Regular',  bg: 'rgba(56,189,248,0.1)'  },
  at_risk:  { color: '#f87171', label: 'At Risk',  bg: 'rgba(248,113,113,0.1)' },
  inactive: { color: '#64748b', label: 'Inactive', bg: 'rgba(100,116,139,0.1)' },
};

export default function TabCoachMembers({ allMemberships, checkIns, ci30, avatarMap, openModal, now }) {
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [sort, setSort]         = useState('recentlyActive');
  const [expanded, setExpanded] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [lbMetric, setLbMetric] = useState('streak');
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('coachMemberNotes') || '{}'); } catch { return {}; }
  });

  const saveNote = (uid, val) => {
    const updated = { ...notes, [uid]: val };
    setNotes(updated);
    try { localStorage.setItem('coachMemberNotes', JSON.stringify(updated)); } catch {}
  };

  const memberLastCI = {};
  checkIns.forEach(c => { if (!memberLastCI[c.user_id] || new Date(c.check_in_date) > new Date(memberLastCI[c.user_id])) memberLastCI[c.user_id] = c.check_in_date; });

  const enriched = allMemberships.map(m => {
    const last    = memberLastCI[m.user_id];
    const daysAgo = last ? Math.floor((now - new Date(last)) / 86400000) : null;
    const visits  = ci30.filter(c => c.user_id === m.user_id).length;
    const visitsPrev = checkIns.filter(c => c.user_id === m.user_id && isWithinInterval(new Date(c.check_in_date), { start: subDays(now,60), end: subDays(now,30) })).length;
    const trend   = visitsPrev > 0 ? Math.round(((visits - visitsPrev) / visitsPrev) * 100) : 0;

    const ciDays = new Set(checkIns.filter(c => c.user_id === m.user_id).map(c => startOfDay(new Date(c.check_in_date)).getTime()));
    let streak = 0;
    for (let i = 0; i <= 60; i++) {
      if (ciDays.has(startOfDay(subDays(now, i)).getTime())) streak++;
      else break;
    }

    const status = !last ? 'inactive' : daysAgo >= 14 ? 'at_risk' : daysAgo <= 2 ? 'active' : 'regular';

    const spark = Array.from({ length: 14 }, (_, i) =>
      checkIns.filter(c => c.user_id === m.user_id && startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now,13-i)).getTime()).length
    );

    const totalVisits   = checkIns.filter(c => c.user_id === m.user_id).length;
    const nextMilestone = [5,10,25,50,100,200,500].find(n => n > totalVisits);

    return { ...m, last, daysAgo, visits, visitsPrev, trend, streak, status, spark, totalVisits, nextMilestone };
  });

  const counts = {
    all:      enriched.length,
    active:   enriched.filter(m => m.status === 'active' || m.status === 'regular').length,
    at_risk:  enriched.filter(m => m.status === 'at_risk').length,
    inactive: enriched.filter(m => m.status === 'inactive').length,
  };

  const filtered = enriched
    .filter(m => {
      const matchSearch = !search || (m.user_name || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || (filter === 'active' ? (m.status === 'active' || m.status === 'regular') : m.status === filter);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sort === 'recentlyActive') { if (!a.last && !b.last) return 0; if (!a.last) return 1; if (!b.last) return -1; return new Date(b.last) - new Date(a.last); }
      if (sort === 'mostVisits')  return b.visits - a.visits;
      if (sort === 'atRisk') { const order = { at_risk: 0, inactive: 1, regular: 2, active: 3 }; return (order[a.status] ?? 4) - (order[b.status] ?? 4); }
      if (sort === 'streak') return b.streak - a.streak;
      return 0;
    });

  const lbData = [...enriched].sort((a,b) => {
    if (lbMetric === 'streak')  return b.streak - a.streak;
    if (lbMetric === 'monthly') return b.visits - a.visits;
    if (lbMetric === 'alltime') return b.totalVisits - a.totalVisits;
    return 0;
  }).slice(0, 10);

  const ci7 = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,7), end: now }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <CoachKpiCard icon={Users}       label="My Members"       value={allMemberships.length}                                    sub="assigned to you"    accentColor="#0ea5e9"/>
        <CoachKpiCard icon={Activity}    label="Active This Week" value={new Set(ci7.map(c=>c.user_id)).size}                      sub="checked in"         accentColor="#10b981" footerBar={allMemberships.length > 0 ? (new Set(ci7.map(c=>c.user_id)).size / allMemberships.length)*100 : 0}/>
        <CoachKpiCard icon={AlertCircle} label="At Risk"          value={enriched.filter(m=>m.status==='at_risk').length}          sub="14+ days absent"    accentColor="#ef4444" subColor={enriched.filter(m=>m.status==='at_risk').length > 0 ? '#f87171' : '#34d399'}/>
        <CoachKpiCard icon={Flame}       label="Avg Streak"       value={enriched.length > 0 ? Math.round(enriched.reduce((s,m)=>s+m.streak,0)/enriched.length) : 0} sub="days consecutive" accentColor="#f59e0b"/>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 3, padding: '3px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {[{id:'list',label:'👤 List'},{id:'leaderboard',label:'🏆 Board'}].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)} style={{ padding: '5px 12px', borderRadius: 8, border: viewMode===v.id ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent', background: viewMode===v.id ? '#0c1a2e' : 'transparent', color: viewMode===v.id ? '#a78bfa' : '#3a5070', fontSize: 11, fontWeight: viewMode===v.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {v.label}
            </button>
          ))}
        </div>

        {viewMode === 'list' && <>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            style={{ flex: 1, minWidth: 160, padding: '9px 14px', borderRadius: 10, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f4f8', fontSize: 12, outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 3, padding: '3px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            {[{id:'all',label:'All'},{id:'active',label:'Active'},{id:'at_risk',label:'At Risk'},{id:'inactive',label:'Inactive'}].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '5px 10px', borderRadius: 8, border: filter===f.id ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent', background: filter===f.id ? '#0c1a2e' : 'transparent', color: filter===f.id ? '#f0f4f8' : '#3a5070', fontSize: 11, fontWeight: filter===f.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {f.label}{f.id!=='all' && counts[f.id] > 0 && <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 800, color: filter===f.id ? '#a78bfa' : '#3a5070' }}>{counts[f.id]}</span>}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '7px 10px', borderRadius: 9, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <option value="recentlyActive">Recently Active</option>
            <option value="mostVisits">Most Visits</option>
            <option value="atRisk">At Risk First</option>
            <option value="streak">Longest Streak</option>
          </select>
        </>}

        {viewMode === 'leaderboard' && (
          <div style={{ display: 'flex', gap: 3, padding: '3px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            {[{id:'streak',label:'🔥 Streak'},{id:'monthly',label:'📅 This Month'},{id:'alltime',label:'⭐ All Time'}].map(m => (
              <button key={m.id} onClick={() => setLbMetric(m.id)} style={{ padding: '5px 11px', borderRadius: 8, border: lbMetric===m.id ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent', background: lbMetric===m.id ? 'rgba(251,191,36,0.1)' : 'transparent', color: lbMetric===m.id ? '#fbbf24' : '#3a5070', fontSize: 11, fontWeight: lbMetric===m.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard view */}
      {viewMode === 'leaderboard' && (
        <CoachCard accent="#fbbf24" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '4px 0' }}>
            {lbData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#3a5070' }}>
                <Trophy style={{ width: 24, height: 24, opacity: 0.3, margin: '0 auto 8px' }}/>
                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No data yet</p>
              </div>
            ) : lbData.map((m, i) => {
              const sc  = STATUS_CFG[m.status] || STATUS_CFG.regular;
              const val = lbMetric === 'streak' ? `${m.streak}d 🔥` : lbMetric === 'monthly' ? `${m.visits} visits` : `${m.totalVisits} total`;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`;
              const barMax = lbData[0] ? (lbMetric === 'streak' ? lbData[0].streak : lbMetric === 'monthly' ? lbData[0].visits : lbData[0].totalVisits) : 1;
              const barVal = lbMetric === 'streak' ? m.streak : lbMetric === 'monthly' ? m.visits : m.totalVisits;
              return (
                <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < lbData.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i < 3 ? `rgba(251,191,36,${0.03 - i*0.01})` : 'transparent' }}>
                  <div style={{ width: 24, textAlign: 'center', fontSize: i < 3 ? 16 : 11, fontWeight: i < 3 ? 900 : 700, color: '#64748b', flexShrink: 0 }}>{medal}</div>
                  <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={32} color={sc.color}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                    <div style={{ marginTop: 4, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', maxWidth: 160 }}>
                      <div style={{ height: '100%', width: `${barMax > 0 ? (barVal/barMax)*100 : 0}%`, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', borderRadius: 99 }}/>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', borderRadius: 7, padding: '3px 10px', flexShrink: 0 }}>{val}</span>
                </div>
              );
            })}
          </div>
        </CoachCard>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <CoachCard style={{ overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#3a5070' }}>
              <Users style={{ width: 24, height: 24, opacity: 0.3, margin: '0 auto 8px' }}/>
              <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No members found</p>
            </div>
          ) : filtered.map((m, i) => {
            const sc     = STATUS_CFG[m.status] || STATUS_CFG.regular;
            const pct    = Math.min(100, (m.visits / 20) * 100);
            const isExp  = expanded === (m.user_id || i);
            const sparkMax = Math.max(...m.spark, 1);

            return (
              <div key={m.user_id || i}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.12s', background: isExp ? 'rgba(167,139,250,0.04)' : 'transparent' }}
                  onClick={() => setExpanded(isExp ? null : (m.user_id || i))}
                  onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = 'transparent'; }}>

                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={36} color="#a78bfa"/>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: sc.color, border: '2px solid #0c1a2e' }}/>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: sc.color, background: sc.bg, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>{sc.label}</span>
                      {m.streak >= 3 && <span style={{ fontSize: 9, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>🔥 {m.streak}d</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 10, color: '#64748b' }}>{m.visits} visits this month</span>
                      {m.daysAgo !== null && <span style={{ fontSize: 10, color: '#3a5070' }}>Last: {m.daysAgo === 0 ? 'today' : `${m.daysAgo}d ago`}</span>}
                      {m.trend !== 0 && <span style={{ fontSize: 10, color: m.trend > 0 ? '#34d399' : '#f87171' }}>{m.trend > 0 ? `↑${m.trend}%` : `↓${Math.abs(m.trend)}%`}</span>}
                    </div>
                  </div>

                  <div style={{ width: 52, flexShrink: 0 }}>
                    <svg viewBox="0 0 52 20" style={{ width: 52, height: 20 }}>
                      {m.spark.map((v, si) => {
                        const x = (si / (m.spark.length - 1)) * 48 + 2;
                        const y = 18 - (v / sparkMax) * 14;
                        return <circle key={si} cx={x} cy={y} r={1.5} fill={v > 0 ? sc.color : 'rgba(255,255,255,0.1)'}/>;
                      })}
                    </svg>
                  </div>

                  <div style={{ flexShrink: 0, width: 56 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', textAlign: 'right', marginBottom: 3 }}>{m.visits}<span style={{ fontSize: 9, color: '#3a5070', fontWeight: 400 }}>/mo</span></div>
                    <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${sc.color},${sc.color}88)`, borderRadius: 99 }}/>
                    </div>
                  </div>

                  <button onClick={e => { e.stopPropagation(); openModal('post'); }} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)', color: '#38bdf8', cursor: 'pointer', flexShrink: 0 }}>
                    <MessageCircle style={{ width: 11, height: 11 }}/>
                  </button>

                  <ChevronRight style={{ width: 13, height: 13, color: '#3a5070', flexShrink: 0, transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}/>
                </div>

                {/* Expanded detail */}
                {isExp && (
                  <div style={{ padding: '14px 16px 16px', background: 'rgba(167,139,250,0.03)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                      {[
                        { label: 'Total Visits',   value: m.totalVisits,  color: '#a78bfa' },
                        { label: 'This Month',     value: m.visits,       color: '#38bdf8' },
                        { label: 'Streak',         value: `${m.streak}d`, color: '#f59e0b' },
                        { label: 'Next Milestone', value: m.nextMilestone ? `${m.nextMilestone}` : '—', color: '#34d399' },
                      ].map((s, si) => (
                        <div key={si} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                          <div style={{ fontSize: 15, fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                          <div style={{ fontSize: 9, color: '#3a5070', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Last 14 Days</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {m.spark.map((v, si) => (
                          <div key={si} title={format(subDays(now,13-si),'MMM d')} style={{ flex: 1, aspectRatio: '1', borderRadius: 5, background: v > 0 ? `${sc.color}cc` : 'rgba(255,255,255,0.05)', border: `1px solid ${v > 0 ? sc.color+'40' : 'rgba(255,255,255,0.06)'}`, maxWidth: 20 }}/>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        Coach Note
                        {notes[m.user_id] && <span style={{ fontSize: 9, color: '#34d399', fontWeight: 600 }}>✓ saved</span>}
                      </div>
                      <textarea
                        placeholder={`Add a note about ${m.user_name || 'this member'}…`}
                        value={notes[m.user_id] || ''}
                        onChange={e => saveNote(m.user_id, e.target.value)}
                        style={{ width: '100%', minHeight: 64, padding: '9px 11px', borderRadius: 9, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CoachCard>
      )}
    </div>
  );
}