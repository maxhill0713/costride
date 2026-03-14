import React, { useMemo, useState } from 'react';
import { format, subDays, isWithinInterval } from 'date-fns';
import {
  Plus, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Users, AlertTriangle, CreditCard, CheckCircle, TrendingUp,
  ArrowUpRight, UserPlus, QrCode, Trophy, Send, Bell, X, Check
} from 'lucide-react';
import { Card, Avatar, StatusChip, RiskBadge, HealthScore, Empty } from './DashboardPrimitives';
import { base44 } from '@/api/base44Client';
import LeaderboardSection from '../leaderboard/LeaderboardSection';

const PRESET_MESSAGES = [
  { id: 'miss',      emoji: '👋', label: 'We miss you',    body: (g, n) => `Hey ${n}! We haven't seen you at ${g} in a while. Come back and keep your progress going — your gym family misses you.` },
  { id: 'offer',     emoji: '🎁', label: 'Special offer',  body: (g, n) => `Good news ${n}! Come into ${g} this week and bring a guest for free. We'd love to see you back.` },
  { id: 'challenge', emoji: '🏆', label: 'New challenge',  body: (g, n) => `Hey ${n}, ${g} has a fresh challenge waiting for you. Join in and hit a new PB!` },
  { id: 'nudge',     emoji: '💪', label: 'Friendly nudge', body: (g, n) => `Just a friendly nudge ${n} — it's been a while! Your spot at ${g} is waiting.` },
];

// ── Inline push panel shown when a member row is expanded ─────────────────────
function MemberPushPanel({ member, gymName, gymId, onClose }) {
  const [selectedPreset, setSelectedPreset] = useState('miss');
  const [customMsg, setCustomMsg] = useState('');
  const [mode, setMode] = useState('preset');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const message = mode === 'preset'
    ? PRESET_MESSAGES.find(p => p.id === selectedPreset)?.body(gymName, member.name.split(' ')[0]) || ''
    : customMsg;

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await base44.functions.invoke('sendPushNotification', {
        gym_id: gymId,
        gym_name: gymName,
        target: 'specific',
        message: message.trim(),
        member_ids: [member.user_id],
      });
      setSent(true);
      setTimeout(() => { setSent(false); onClose(); }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      margin: '0 0 2px 0',
      padding: '14px 16px',
      background: 'rgba(0,212,255,0.04)',
      borderBottom: '1px solid rgba(0,212,255,0.12)',
      borderLeft: '3px solid rgba(0,212,255,0.4)',
      animation: 'fade-in-up 0.2s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Bell style={{ width: 12, height: 12, color: 'var(--cyan)' }}/>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)' }}>Push notification → {member.name.split(' ')[0]}</span>
        </div>
        <button onClick={onClose} style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer' }}>
          <X style={{ width: 11, height: 11, color: 'var(--text3)' }}/>
        </button>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
        {[{ id: 'preset', label: 'Preset' }, { id: 'custom', label: 'Custom' }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '4px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: mode === m.id ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${mode === m.id ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: mode === m.id ? 'var(--cyan)' : 'var(--text3)',
          }}>{m.label}</button>
        ))}
      </div>

      {mode === 'preset' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 10 }}>
          {PRESET_MESSAGES.map(p => (
            <button key={p.id} onClick={() => setSelectedPreset(p.id)} style={{
              padding: '7px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
              background: selectedPreset === p.id ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selectedPreset === p.id ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.12s',
            }}>
              <span style={{ fontSize: 13 }}>{p.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: selectedPreset === p.id ? 'var(--cyan)' : 'var(--text2)' }}>{p.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <textarea
          value={customMsg}
          onChange={e => setCustomMsg(e.target.value)}
          placeholder={`Write a message to ${member.name.split(' ')[0]}…`}
          rows={2}
          style={{
            width: '100%', boxSizing: 'border-box', marginBottom: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 8, padding: '8px 10px', fontSize: 11, color: 'var(--text1)',
            resize: 'none', outline: 'none', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.35)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
        />
      )}

      {/* Preview */}
      {message && (
        <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' }}>
          "{message}"
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={!message.trim() || sending || sent}
        style={{
          width: '100%', padding: '8px', borderRadius: 8, border: 'none', cursor: message.trim() && !sending && !sent ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontSize: 12, fontWeight: 800, transition: 'all 0.15s',
          background: sent ? 'rgba(16,185,129,0.15)' : message.trim() ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
          color: sent ? '#34d399' : message.trim() ? 'var(--cyan)' : 'var(--text3)',
          outline: `1px solid ${sent ? 'rgba(16,185,129,0.3)' : message.trim() ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
        }}>
        {sent ? <><Check style={{ width: 12, height: 12 }}/> Sent!</> : sending ? 'Sending…' : <><Send style={{ width: 12, height: 12 }}/> Send to {member.name.split(' ')[0]}</>}
      </button>
    </div>
  );
}

export default function TabMembers({
  allMemberships, checkIns, ci30, memberLastCheckIn, selectedGym,
  atRisk, atRiskMembersList, retentionRate, totalMembers, activeThisWeek, newSignUps, weeklyChangePct,
  avatarMap,
  memberFilter, setMemberFilter, memberSearch, setMemberSearch, memberSort, setMemberSort,
  memberPage, setMemberPage, memberPageSize, selectedRows, setSelectedRows,
  openModal, now,
}) {
  const [expandedMember, setExpandedMember] = useState(null);

  const gymName = selectedGym?.name || 'Your Gym';

  const memberRows = useMemo(() => allMemberships.map(m => {
    const userCheckIns = checkIns.filter(c => c.user_id === m.user_id);
    const visits30 = ci30.filter(c => c.user_id === m.user_id).length;
    const lastVisit = memberLastCheckIn[m.user_id];
    const daysSince = lastVisit ? Math.floor((now - new Date(lastVisit)) / 86400000) : 999;
    const isBanned = (selectedGym?.banned_members || []).includes(m.user_id);
    const name = userCheckIns[0]?.user_name || m.user_name || 'Member';
    let tier = 'New';
    if (visits30 >= 15) tier = 'Super Active'; else if (visits30 >= 8) tier = 'Active'; else if (visits30 >= 1) tier = 'Casual';
    let risk = 'Low';
    if (daysSince >= 21) risk = 'High'; else if (daysSince >= 14) risk = 'Medium';
    let statusTag = tier === 'Super Active' || tier === 'Active' ? 'Engaged' : tier === 'New' ? 'New' : 'Casual';
    if (daysSince >= 14) statusTag = 'At Risk';
    if (isBanned) statusTag = 'Banned';
    let lastVisitDisplay = 'Never';
    if (lastVisit) {
      if (daysSince === 0) lastVisitDisplay = 'Today';
      else if (daysSince === 1) lastVisitDisplay = '1 day ago';
      else if (daysSince < 7) lastVisitDisplay = `${daysSince} days ago`;
      else if (daysSince < 14) lastVisitDisplay = '1 week ago';
      else if (daysSince < 30) lastVisitDisplay = `${Math.floor(daysSince / 7)} weeks ago`;
      else lastVisitDisplay = format(new Date(lastVisit), 'd MMM');
    }
    const plan = m.plan || m.membership_type || m.type || 'Standard';
    return { ...m, name, visits30, visitsTotal: userCheckIns.length, lastVisit, daysSince, tier, risk, statusTag, lastVisitDisplay, plan, isBanned, avatar_url: avatarMap[m.user_id] || null };
  }), [allMemberships, checkIns, ci30, memberLastCheckIn, selectedGym?.banned_members, avatarMap]);

  const filtered = useMemo(() => memberRows.filter(m => {
    if (memberFilter === 'active')   return m.daysSince < 7;
    if (memberFilter === 'inactive') return m.daysSince >= 14;
    if (memberFilter === 'atRisk')   return m.risk !== 'Low';
    if (memberFilter === 'new')      return isWithinInterval(new Date(m.join_date || m.created_date || now), { start: subDays(now, 30), end: now });
    return true;
  }).filter(m => !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase())), [memberRows, memberFilter, memberSearch]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (memberSort === 'recentlyActive') return a.daysSince - b.daysSince;
    if (memberSort === 'mostVisits')     return b.visits30 - a.visits30;
    if (memberSort === 'newest')         return new Date(b.join_date || b.created_date || 0) - new Date(a.join_date || a.created_date || 0);
    if (memberSort === 'highRisk')       { const r = { High: 0, Medium: 1, Low: 2 }; return r[a.risk] - r[b.risk]; }
    if (memberSort === 'name')           return a.name.localeCompare(b.name);
    return 0;
  }), [filtered, memberSort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / memberPageSize));
  const paginated  = sorted.slice((memberPage - 1) * memberPageSize, memberPage * memberPageSize);
  const gymHealthScore = Math.min(100, Math.max(0, Math.round(retentionRate * 0.6 + (100 - Math.min(100, (atRisk / Math.max(totalMembers, 1)) * 100)) * 0.4)));

  const filterCounts = {
    all:      memberRows.length,
    active:   memberRows.filter(m => m.daysSince < 7).length,
    inactive: memberRows.filter(m => m.daysSince >= 14).length,
    atRisk:   memberRows.filter(m => m.risk !== 'Low').length,
    new:      memberRows.filter(m => isWithinInterval(new Date(m.join_date || m.created_date || now), { start: subDays(now, 30), end: now })).length,
  };

  const toggleRow          = (id) => { const s = new Set(selectedRows); s.has(id) ? s.delete(id) : s.add(id); setSelectedRows(s); };
  const toggleAll          = () => { if (selectedRows.size === paginated.length) setSelectedRows(new Set()); else setSelectedRows(new Set(paginated.map(m => m.id))); };
  const handleFilterChange = (f) => { setMemberFilter(f); setMemberPage(1); };
  const handleSearch       = (v) => { setMemberSearch(v); setMemberPage(1); };

  const weekAgoLB = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyCI = checkIns.filter(c => new Date(c.check_in_date) >= weekAgoLB);
  const checkInLeaderboard = Object.values(
    weeklyCI.reduce((acc, c) => {
      const id = c.user_id;
      if (!acc[id]) acc[id] = { userId: id, userName: c.user_name, userAvatar: avatarMap[id] || null, count: 0 };
      acc[id].count++;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count).slice(0, 10);

  const streakLeaderboard = Object.values(
    checkIns.reduce((acc, c) => { const id = c.user_id; if (!acc[id]) acc[id] = { userId: id, userName: c.user_name, userAvatar: avatarMap[id] || null }; return acc; }, {})
  ).map(item => {
    const uci = checkIns.filter(c => c.user_id === item.userId).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
    let streak = uci.length > 0 ? 1 : 0;
    let cur = uci.length > 0 ? new Date(uci[0].check_in_date) : null;
    if (cur) { cur.setHours(0,0,0,0); for (let i = 1; i < uci.length; i++) { const d = new Date(uci[i].check_in_date); d.setHours(0,0,0,0); const diff = Math.floor((cur - d) / 86400000); if (diff === 1) { streak++; cur = d; } else if (diff > 1) break; } }
    return { ...item, streak };
  }).sort((a, b) => b.streak - a.streak).slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 268px', gap: 16, alignItems: 'start' }}>

        {/* ── Members Table ── */}
        <Card style={{ overflow: 'hidden' }}>
          {/* Filter bar */}
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => openModal('members')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'linear-gradient(135deg,rgba(14,165,233,0.9),rgba(6,182,212,0.85))', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              <Plus style={{ width: 13, height: 13 }}/> Add Member
            </button>
            <div style={{ display: 'flex', gap: 2 }}>
              {[
                { id: 'all',      label: 'All Members', count: filterCounts.all },
                { id: 'active',   label: 'Active',       count: filterCounts.active },
                { id: 'inactive', label: 'Inactive',     count: filterCounts.inactive },
                { id: 'atRisk',   label: 'At Risk',      count: filterCounts.atRisk, danger: true },
                { id: 'new',      label: 'New',          count: filterCounts.new },
              ].map(f => (
                <button key={f.id} className={`filter-tab ${memberFilter === f.id ? (f.danger ? 'active-red' : 'active') : ''}`} onClick={() => handleFilterChange(f.id)}>
                  {f.label}
                  {f.danger && f.count > 0 && (
                    <span style={{ marginLeft: 4, background: '#ef4444', color: '#fff', borderRadius: 99, padding: '0 5px', fontSize: 9, fontWeight: 800 }}>{f.count}</span>
                  )}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }}/>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: 'var(--text3)' }}/>
              <input className="search-input" placeholder="Search members…" value={memberSearch} onChange={e => handleSearch(e.target.value)}/>
            </div>
          </div>

          {/* Sort row */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Engaged','Active','At Risk','New','Beginner'].map(tag => (
                <button key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text3)', cursor: 'pointer' }}>
                  {tag} <ChevronDown style={{ width: 9, height: 9 }}/>
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }}/>
            {/* Hint */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <Bell style={{ width: 10, height: 10, color: 'var(--cyan)' }}/>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)' }}>Click a member to notify</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Sort by</span>
            <select className="sort-select" value={memberSort} onChange={e => setMemberSort(e.target.value)}>
              <option value="recentlyActive">Recently Active</option>
              <option value="mostVisits">Most Visits</option>
              <option value="newest">Newest First</option>
              <option value="highRisk">High Risk First</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          {/* Table header */}
          <div className="member-row" style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', borderRadius: 0, cursor: 'default' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input type="checkbox" checked={paginated.length > 0 && selectedRows.size === paginated.length} onChange={toggleAll} style={{ width: 14, height: 14, accentColor: '#0ea5e9', cursor: 'pointer' }}/>
            </div>
            {[{ label: 'Member', icon: ChevronUp }, { label: 'Status' }, { label: 'Last Visit', icon: ChevronUp }, { label: 'Membership' }, { label: 'Risk Level' }].map((col, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.label}</span>
                {col.icon && <col.icon style={{ width: 9, height: 9, color: 'var(--text3)' }}/>}
              </div>
            ))}
          </div>

          {/* Table body */}
          <div style={{ minHeight: 300 }}>
            {paginated.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Empty icon={Users} label={memberSearch ? 'No members match your search' : 'No members in this filter'}/>
              </div>
            ) : (
              paginated.map((m, idx) => {
                const isExpanded = expandedMember === m.id;
                return (
                  <div key={m.id || idx}>
                    {/* Member row */}
                    <div
                      className={`member-row ${isExpanded ? 'member-row-selected' : ''}`}
                      style={{
                        borderBottom: !isExpanded && idx < paginated.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        borderRadius: 0,
                        borderLeft: isExpanded ? '3px solid rgba(0,212,255,0.4)' : '3px solid transparent',
                        transition: 'border-color 0.15s',
                      }}
                      onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { e.stopPropagation(); toggleRow(m.id); }}>
                        <input type="checkbox" checked={selectedRows.has(m.id)} onChange={() => toggleRow(m.id)} style={{ width: 14, height: 14, accentColor: '#0ea5e9', cursor: 'pointer' }}/>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ position: 'relative' }}>
                          <Avatar name={m.name} size={34} src={m.avatar_url || m.member_avatar}/>
                          {m.daysSince >= 14 && (
                            <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: '#ef4444', border: '2px solid var(--card)' }}/>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isExpanded ? 'var(--cyan)' : 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>{m.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
                            {isExpanded
                              ? <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>Click to collapse</span>
                              : m.visits30 > 0
                                ? <span style={{ color: m.tier === 'Super Active' ? '#34d399' : m.tier === 'Active' ? '#38bdf8' : 'var(--text3)' }}>{m.tier}</span>
                                : 'Click to send notification'
                            }
                          </div>
                        </div>
                      </div>
                      <div><StatusChip status={m.statusTag}/></div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: m.daysSince === 0 ? '#34d399' : m.daysSince <= 3 ? 'var(--text1)' : m.daysSince >= 14 ? '#f87171' : 'var(--text2)' }}>
                          {m.visits30 > 0 ? <><span style={{ fontWeight: 800 }}>{m.visits30}</span> <span style={{ fontWeight: 500, fontSize: 11, color: 'var(--text3)' }}>visits</span></> : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{m.lastVisitDisplay}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.plan}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
                          {m.join_date ? `Joined ${format(new Date(m.join_date), 'MMM d, yyyy')}` : m.created_date ? `Joined ${format(new Date(m.created_date), 'MMM d, yyyy')}` : 'Active member'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RiskBadge risk={m.risk}/>
                        <div style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isExpanded ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isExpanded ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.15s', flexShrink: 0 }}>
                          <Bell style={{ width: 11, height: 11, color: isExpanded ? 'var(--cyan)' : 'var(--text3)' }}/>
                        </div>
                      </div>
                    </div>

                    {/* Inline push panel */}
                    {isExpanded && (
                      <MemberPushPanel
                        member={m}
                        gymName={gymName}
                        gymId={selectedGym?.id}
                        onClose={() => setExpandedMember(null)}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" style={{ width: 13, height: 13, accentColor: '#0ea5e9', cursor: 'pointer' }}/>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>+ {sorted.length} of {totalMembers}</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="page-btn" disabled={memberPage <= 1} onClick={() => setMemberPage(p => Math.max(1, p - 1))}>
                <ChevronLeft style={{ width: 12, height: 12 }}/>
              </button>
              <button className="page-btn" disabled={memberPage >= totalPages} onClick={() => setMemberPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight style={{ width: 12, height: 12 }}/>
              </button>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page = i + 1;
                if (totalPages > 5) {
                  if (memberPage <= 3) page = i + 1;
                  else if (memberPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = memberPage - 2 + i;
                }
                return <button key={page} className={`page-btn ${memberPage === page ? 'active' : ''}`} onClick={() => setMemberPage(page)}>{page}</button>;
              })}
            </div>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Display</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{memberPageSize}</span>
              <ChevronDown style={{ width: 10, height: 10, color: 'var(--text3)' }}/>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>of {sorted.length}</span>
          </div>
        </Card>

        {/* ── Right Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Alerts */}
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12, letterSpacing: '-0.01em' }}>Alerts & Actions</div>
            {atRisk > 0 && (
              <div className="alert-card" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <AlertTriangle style={{ width: 11, height: 11, color: '#f87171' }}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{atRisk} Members At Risk</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Haven't visited in 10+ days</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleFilterChange('atRisk')} style={{ flex: 1, padding: '6px 0', borderRadius: 7, background: 'rgba(255,255,255,0.06)', color: 'var(--text1)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>View List</button>
                  <button onClick={() => openModal('post')} style={{ flex: 1, padding: '6px 0', borderRadius: 7, background: 'rgba(239,68,68,0.18)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Send Message</button>
                </div>
              </div>
            )}
            {memberRows.filter(m => m.risk === 'High').length > 0 && (
              <div className="alert-card" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(245,158,11,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <CreditCard style={{ width: 11, height: 11, color: '#fbbf24' }}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{memberRows.filter(m => m.risk === 'High').length} High-Risk Members</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                      {memberRows.filter(m => m.risk === 'High').slice(0, 2).map(m => m.name).join(', ')} · 21+ days inactive
                    </div>
                  </div>
                </div>
                <button onClick={() => { handleFilterChange('atRisk'); setMemberSort('highRisk'); }} style={{ width: '100%', padding: '6px 0', borderRadius: 7, background: 'rgba(245,158,11,0.16)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Resolve</button>
              </div>
            )}
            {atRisk === 0 && memberRows.filter(m => m.risk === 'High').length === 0 && (
              <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle style={{ width: 13, height: 13, color: '#10b981' }}/>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>All members are active!</span>
              </div>
            )}
          </Card>

          {/* Growth Insights */}
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12, letterSpacing: '-0.01em' }}>Growth Insights</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <TrendingUp style={{ width: 12, height: 12, color: '#34d399' }}/>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em' }}>{retentionRate}%</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>Retention</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowUpRight style={{ width: 10, height: 10, color: '#34d399' }}/>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{weeklyChangePct >= 0 ? '+' : ''}{weeklyChangePct}% improvement</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { label: 'Active', val: activeThisWeek, color: '#0ea5e9' },
                      { label: 'New',    val: newSignUps,     color: '#10b981' },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', marginTop: 1 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <HealthScore score={gymHealthScore} label="Gym Health" sub={gymHealthScore >= 75 ? 'Great progress!' : gymHealthScore >= 50 ? 'Keep going!' : 'Needs work'}/>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 10, letterSpacing: '-0.01em' }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { icon: UserPlus, label: 'Add Member',       color: '#0ea5e9', fn: () => openModal('members') },
                { icon: QrCode,   label: 'Scan Check in',    color: '#10b981', fn: () => openModal('qrScanner') },
                { icon: Trophy,   label: 'Create Challenge', color: '#f59e0b', fn: () => openModal('challenge') },
                { icon: Send,     label: 'Send Message',     color: '#a78bfa', fn: () => openModal('post') },
              ].map(({ icon: Icon, label, color, fn }, i) => (
                <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.15s', fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>
                  <Plus style={{ width: 10, height: 10, color, flexShrink: 0 }}/>
                  {label}
                </button>
              ))}
            </div>
          </Card>

          <LeaderboardSection
            checkInLeaderboard={checkInLeaderboard}
            streakLeaderboard={streakLeaderboard}
            progressLeaderboard={[]}
          />
        </div>
      </div>
    </div>
  );
}
