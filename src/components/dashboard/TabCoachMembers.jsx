import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { subDays, startOfDay, isWithinInterval, format, differenceInDays, addDays, isSameMonth, isSameDay, parseISO, isValid } from 'date-fns';
import {
  Users, Activity, AlertCircle, Flame, MessageCircle, ChevronRight,
  Search, Download, Plus, Check, X, Trophy, UserPlus, List,
  LayoutGrid, Heart, Dumbbell, ClipboardList, Calendar, Star,
  TrendingUp, TrendingDown, Minus, Shield, Zap, BarChart2,
  Gift, CreditCard, Package, CheckSquare, Share2, Clock,
  UserCheck, Ban, Filter, ChevronDown, Send, Layers,
  Eye, Edit3, MoreHorizontal, Bell, Target, Award,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { CoachKpiCard, CoachCard, MiniAvatar } from './CoachHelpers';
import { ClientAdvancedProfile, ClassPerformanceWidget } from './ClientAdvancedProfile';
// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_PRIORITY = { vip: 0, active: 1, regular: 2, at_risk: 3, inactive: 4 };
const STATUS_CFG = {
  vip:      { color: '#fbbf24', label: 'VIP',     bg: 'rgba(251,191,36,0.1)'  },
  active:   { color: '#34d399', label: 'Active',  bg: 'rgba(52,211,153,0.1)'  },
  regular:  { color: '#38bdf8', label: 'Regular', bg: 'rgba(56,189,248,0.1)'  },
  at_risk:  { color: '#f87171', label: 'At Risk', bg: 'rgba(248,113,113,0.1)' },
  inactive: { color: '#64748b', label: 'Lapsed',  bg: 'rgba(100,116,139,0.1)' },
};
const PRESET_TAGS      = ['VIP', 'Beginner', 'Advanced', 'Injury', 'Nutrition Goal', 'Competition Prep', 'Post-Rehab', 'Online Client', 'Weight Loss', 'Muscle Gain', 'Athlete', 'Senior'];
const FITNESS_LEVELS   = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const MEDALS           = ['🥇', '🥈', '🥉'];
const ONBOARDING_STEPS = [
  { id: 'parq',         label: 'PAR-Q Form Signed',        icon: '📋' },
  { id: 'goals_set',    label: 'Goals Set',                icon: '🎯' },
  { id: 'first_session',label: 'First Session Booked',     icon: '📅' },
  { id: 'tour',         label: 'Gym Tour Completed',       icon: '🏋️' },
  { id: 'app_setup',    label: 'Member App Set Up',        icon: '📱' },
  { id: 'payment',      label: 'Payment Method Added',     icon: '💳' },
  { id: 'photo',        label: 'Progress Photo Taken',     icon: '📸' },
];
// ─── CSV export ───────────────────────────────────────────────────────────────
function exportCSV(clients) {
  const rows = [
    ['Name', 'Status', 'Monthly Visits', 'Total Visits', 'Streak', 'No-Shows', 'Last Visit', 'Join Date'],
    ...clients.map(c => [
      c.user_name || 'Unknown',
      STATUS_CFG[c.status]?.label || c.status,
      c.visits, c.totalVisits, c.streak, c.noShows || 0,
      c.last ? format(new Date(c.last), 'yyyy-MM-dd') : 'Never',
      c.join_date || c.created_date || '',
    ]),
  ];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a   = document.createElement('a'); a.href = url; a.download = 'clients.csv'; a.click();
  URL.revokeObjectURL(url);
}
// ─── Birthday helpers ─────────────────────────────────────────────────────────
function getBirthdayStatus(dob, now) {
  if (!dob) return null;
  try {
    const d = parseISO(dob);
    if (!isValid(d)) return null;
    const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    const diff     = differenceInDays(thisYear, startOfDay(now));
    if (diff >= 0 && diff <= 7)  return { label: diff === 0 ? '🎂 Today!' : `🎂 in ${diff}d`, color: '#f472b6', urgent: diff <= 2 };
    if (diff < 0 && diff >= -3)  return { label: '🎂 Just passed', color: '#94a3b8', urgent: false };
    return null;
  } catch { return null; }
}
// ─── No-show rate ─────────────────────────────────────────────────────────────
function calcNoShowRate(bookings = [], checkIns = [], userId) {
  const userBookings = bookings.filter(b => b.user_id === userId && b.status === 'booked');
  if (userBookings.length === 0) return 0;
  const attended = userBookings.filter(b =>
    checkIns.some(c => c.user_id === userId && isSameDay(new Date(c.check_in_date), new Date(b.date)))
  ).length;
  return Math.round(((userBookings.length - attended) / userBookings.length) * 100);
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
// ─── No-show badge ────────────────────────────────────────────────────────────
function NoShowBadge({ rate }) {
  if (rate === 0) return null;
  const color = rate >= 40 ? '#f87171' : rate >= 20 ? '#fbbf24' : '#94a3b8';
  const bg    = rate >= 40 ? 'rgba(248,113,113,0.1)' : rate >= 20 ? 'rgba(251,191,36,0.1)' : 'rgba(148,163,184,0.08)';
  return (
    <span style={{ fontSize: 8, fontWeight: 700, color, background: bg, border: `1px solid ${color}30`, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
      {rate}% no-show
    </span>
  );
}
// ─── Client card (grid view) ──────────────────────────────────────────────────
function ClientCard({ m, avatarMap, onSelect, isSelected, onToggleSelect, bulkMode }) {
  const sc  = STATUS_CFG[m.status] || STATUS_CFG.regular;
  const pct = Math.min(100, (m.visits / 20) * 100);
  const bday = getBirthdayStatus(m.date_of_birth, new Date());
  return (
    <div
      onClick={() => bulkMode ? onToggleSelect(m.user_id) : onSelect(m)}
      style={{ borderRadius: 14, padding: 16, background: '#0c1a2e', border: `1px solid ${isSelected ? sc.color : sc.color + '20'}`, cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s', position: 'relative', outline: isSelected ? `2px solid ${sc.color}40` : 'none' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; if (!isSelected) e.currentTarget.style.borderColor = `${sc.color}45`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; if (!isSelected) e.currentTarget.style.borderColor = `${sc.color}20`; }}>
      {bulkMode && (
        <div style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 5, border: `2px solid ${isSelected ? sc.color : 'rgba(255,255,255,0.2)'}`, background: isSelected ? sc.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isSelected && <Check style={{ width: 10, height: 10, color: '#000' }}/>}
        </div>
      )}
      {bday && <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 9, fontWeight: 800, color: bday.color, background: `${bday.color}15`, borderRadius: 4, padding: '2px 5px' }}>{bday.label}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, marginTop: bday ? 16 : 0 }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: '#64748b' }}>
          {m.daysAgo === null ? 'Never visited' : m.daysAgo === 0 ? '✅ In today' : `Last: ${m.daysAgo}d ago`}
        </div>
        {m.noShowRate > 0 && <NoShowBadge rate={m.noShowRate}/>}
      </div>
    </div>
  );
}
// ─── Bulk action bar ──────────────────────────────────────────────────────────
function BulkActionBar({ selected, allFiltered, onSelectAll, onClear, onBulkMessage, onBulkExport }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, padding: '10px 16px', background: 'rgba(10,20,40,0.97)', backdropFilter: 'blur(12px)', borderRadius: 12, border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa' }}>{selected.length} selected</span>
      <button onClick={onSelectAll} style={{ fontSize: 11, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
        {selected.length === allFiltered.length ? 'Deselect all' : `Select all (${allFiltered.length})`}
      </button>
      <div style={{ flex: 1 }}/>
      <button onClick={onBulkMessage} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
        <Send style={{ width: 10, height: 10 }}/> Message All
      </button>
      <button onClick={onBulkExport} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', color: '#94a3b8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
        <Download style={{ width: 10, height: 10 }}/> Export
      </button>
      <button onClick={onClear} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X style={{ width: 12, height: 12 }}/>
      </button>
    </div>
  );
}
// ─── Client detail panel ──────────────────────────────────────────────────────
function ClientDetailPanel({ m, checkIns, avatarMap, now, notes, saveNote, tags, saveTag, goals, saveGoal, health, saveHealth, packages, savePackage, onboarding, saveOnboarding, openModal }) {
  const [activeTab,    setActiveTab]    = useState('advanced');
  const [newGoal,      setNewGoal]      = useState({ title: '', target: '', unit: '', current: '', deadline: '' });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newPkg,       setNewPkg]       = useState({ name: '', total: '', used: '' });
  const [showPkgForm,  setShowPkgForm]  = useState(false);
  const sc              = STATUS_CFG[m.status] || STATUS_CFG.regular;
  const clientCIs       = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const clientGoals     = goals[m.user_id]     || [];
  const clientTags      = tags[m.user_id]      || [];
  const clientHealth    = health[m.user_id]    || { injuries: '', restrictions: '', fitnessLevel: 'Beginner', notes: '' };
  const clientPkgs      = packages[m.user_id]  || [];
  const clientOnboard   = onboarding[m.user_id]|| {};
  const bday            = getBirthdayStatus(m.date_of_birth, now);
  // Membership expiry logic
  const membershipExpiry = useMemo(() => {
    if (!m.membership_expiry && !m.renewal_date) return null;
    const expDate = m.membership_expiry || m.renewal_date;
    try {
      const d = new Date(expDate);
      const daysLeft = differenceInDays(d, now);
      return { date: d, daysLeft, urgent: daysLeft <= 14 };
    } catch { return null; }
  }, [m, now]);
  const handleAddGoal = () => {
    if (!newGoal.title) return;
    saveGoal(m.user_id, [...clientGoals, { ...newGoal, id: Date.now() }]);
    setNewGoal({ title: '', target: '', unit: '', current: '', deadline: '' });
    setShowGoalForm(false);
  };
  const handleAddPkg = () => {
    if (!newPkg.name) return;
    savePackage(m.user_id, [...clientPkgs, { ...newPkg, id: Date.now() }]);
    setNewPkg({ name: '', total: '', used: '' });
    setShowPkgForm(false);
  };
  const toggleTag = (tag) =>
    saveTag(m.user_id, clientTags.includes(tag) ? clientTags.filter(t => t !== tag) : [...clientTags, tag]);
  const updateHealth = (field, val) =>
    saveHealth(m.user_id, { ...clientHealth, [field]: val });
  const toggleOnboard = (stepId) =>
    saveOnboarding(m.user_id, { ...clientOnboard, [stepId]: !clientOnboard[stepId] });
  const onboardPct = Math.round((ONBOARDING_STEPS.filter(s => clientOnboard[s.id]).length / ONBOARDING_STEPS.length) * 100);
  const inputStyle = {
    padding: '7px 10px', borderRadius: 7, background: '#060c18',
    border: '1px solid rgba(255,255,255,0.08)', color: '#f0f4f8',
    fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const TABS = [
    { id: 'advanced',  label: '⚡ Smart' },
    { id: 'overview',  label: 'Stats'    },
    { id: 'logs',      label: '📋 Logs'  },
    { id: 'progress',  label: '📈 Progress' },
    { id: 'health',    label: '🩺 Health' },
    { id: 'goals',     label: '🎯 Goals' },
    { id: 'packages',  label: '📦 Sessions' },
    { id: 'onboarding',label: '✅ Onboard' },
    { id: 'payments',  label: '💳 Billing' },
    { id: 'notes',     label: 'Notes'    },
    { id: 'profile',   label: 'Profile'  },
  ];
  return (
    <div style={{ background: `${sc.color}04`, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Tab strip */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', paddingLeft: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '9px 13px', border: 'none', background: 'transparent', color: activeTab === t.id ? sc.color : '#3a5070', fontSize: 10.5, fontWeight: activeTab === t.id ? 800 : 500, cursor: 'pointer', borderBottom: `2px solid ${activeTab === t.id ? sc.color : 'transparent'}`, marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1, minWidth: 8 }}/>
        {/* Coach tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 8px', flexShrink: 0 }}>
          {[
            { label: 'Message', icon: MessageCircle, color: '#38bdf8', modal: 'post', data: { memberId: m.user_id } },
            { label: 'Book',    icon: Calendar,      color: '#a78bfa', modal: 'bookIntoClass', data: { memberId: m.user_id, memberName: m.user_name } },
            { label: 'Challenge', icon: Trophy,      color: '#fbbf24', modal: 'assignChallenge', data: { memberId: m.user_id, memberName: m.user_name } },
          ].map(({ label, icon: Ic, color, modal, data }) => (
            <button key={label} onClick={() => openModal(modal, data)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 7, background: `${color}0d`, border: `1px solid ${color}25`, color, fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <Ic style={{ width: 10, height: 10 }}/>{label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        {/* ── ADVANCED TAB ── */}
        {activeTab === 'advanced' && (
          <div>
            {/* Membership expiry warning */}
            {membershipExpiry && membershipExpiry.urgent && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle style={{ width: 14, height: 14, color: '#f87171', flexShrink: 0 }}/>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#f87171' }}>Membership expiring in {membershipExpiry.daysLeft} days</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Expires {format(membershipExpiry.date, 'MMM d, yyyy')}</div>
                </div>
                <button onClick={() => openModal('post', { memberId: m.user_id, renewal: true })} style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 7, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  Send reminder
                </button>
              </div>
            )}
            {/* Birthday banner */}
            {bday && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🎂</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#f472b6' }}>Birthday {bday.label.replace('🎂 ', '')}</div>
                  {m.date_of_birth && <div style={{ fontSize: 10, color: '#94a3b8' }}>{format(parseISO(m.date_of_birth), 'MMMM d')}</div>}
                </div>
                <button onClick={() => openModal('post', { memberId: m.user_id, birthday: true })} style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 7, background: 'rgba(244,114,182,0.12)', border: '1px solid rgba(244,114,182,0.25)', color: '#f472b6', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  Send wishes 🎉
                </button>
              </div>
            )}
            {/* Onboarding progress if new */}
            {m.isNew && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa' }}>🌱 New Member Onboarding</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: onboardPct === 100 ? '#34d399' : '#a78bfa' }}>{onboardPct}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${onboardPct}%`, background: 'linear-gradient(90deg,#a78bfa,#7c3aed)', borderRadius: 99, transition: 'width 0.6s ease' }}/>
                </div>
                <button onClick={() => setActiveTab('onboarding')} style={{ marginTop: 8, fontSize: 10, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View checklist →</button>
              </div>
            )}
            <ClientAdvancedProfile client={m} checkIns={clientCIs} now={now} />
            {/* No-show alert */}
            {m.noShowRate >= 25 && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ban style={{ width: 13, height: 13, color: '#fbbf24', flexShrink: 0 }}/>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>
                  <span style={{ fontWeight: 700, color: '#fbbf24' }}>{m.noShowRate}% no-show rate</span> — consider a follow-up conversation about commitment.
                </div>
              </div>
            )}
            <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', marginBottom: 5 }}>💡 AI Insights</div>
              <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
                This member's pattern shows <span style={{ fontWeight: 600 }}>potential for growth</span> with targeted support.
                Focus on consistency and momentum building.
              </div>
            </div>
          </div>
        )}
        {/* ── STATS TAB ── */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Visits / Month', value: m.visits,      color: '#38bdf8' },
                { label: 'Last Visit',     value: m.daysAgo === null ? 'Never' : m.daysAgo === 0 ? 'Today' : `${m.daysAgo}d ago`, color: m.daysAgo > 14 ? '#f87171' : '#34d399' },
                { label: 'Total Check-ins',value: m.totalVisits, color: '#a78bfa' },
                { label: 'No-Show Rate',   value: `${m.noShowRate}%`, color: m.noShowRate >= 30 ? '#f87171' : m.noShowRate >= 15 ? '#fbbf24' : '#34d399' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 8, color: '#3a5070', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Membership status card */}
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Membership</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Plan', value: m.membership_type || 'Monthly' },
                  { label: 'Status', value: m.membership_status || 'Active' },
                  { label: 'Expires', value: membershipExpiry ? format(membershipExpiry.date, 'MMM d, yyyy') : 'Ongoing' },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 8, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: membershipExpiry?.urgent && item.label === 'Expires' ? '#f87171' : '#f0f4f8' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Referral info */}
            {m.referred_by && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 style={{ width: 12, height: 12, color: '#34d399', flexShrink: 0 }}/>
                <div>
                  <span style={{ fontSize: 10, color: '#64748b' }}>Referred by </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399' }}>{m.referred_by}</span>
                </div>
              </div>
            )}
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
            {/* 14-day heat strip */}
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7, marginTop: 12 }}>14-Day Activity</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {m.spark.map((v, si) => (
                <div key={si} title={format(subDays(now, 13 - si), 'MMM d')} style={{ flex: 1, aspectRatio: '1', borderRadius: 4, background: v > 0 ? `${sc.color}cc` : 'rgba(255,255,255,0.05)', border: `1px solid ${v > 0 ? `${sc.color}40` : 'rgba(255,255,255,0.05)'}`, maxWidth: 22 }}/>
              ))}
            </div>
          </div>
        )}
        {/* ── LOGS TAB ── */}
        {activeTab === 'logs' && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Training Session History</div>
            {clientCIs.length === 0 ? (
              <p style={{ fontSize: 11, color: '#3a5070', margin: 0, textAlign: 'center', padding: '20px 0' }}>No sessions logged yet</p>
            ) : clientCIs.slice(0, 10).map((ci, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: ci.exercises?.length ? 8 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#34d399' : '#3a5070', flexShrink: 0 }}/>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8' }}>{format(new Date(ci.check_in_date), 'EEE, MMM d, yyyy')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i === 0 && <span style={{ fontSize: 9, color: '#34d399', background: 'rgba(52,211,153,0.1)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>Latest</span>}
                    <span style={{ fontSize: 10, color: '#3a5070' }}>{format(new Date(ci.check_in_date), 'h:mm a')}</span>
                  </div>
                </div>
                {ci.exercises?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                    {ci.exercises.slice(0, 4).map((ex, ei) => (
                      <div key={ei} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Dumbbell style={{ width: 9, height: 9, color: '#475569' }}/>{ex.exercise || ex.name}
                        </span>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>
                          {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ex.setsReps || ''}
                          {ex.weight ? ` @ ${ex.weight}kg` : ''}
                        </span>
                      </div>
                    ))}
                    {ci.exercises.length > 4 && <span style={{ fontSize: 10, color: '#3a5070' }}>+{ci.exercises.length - 4} more exercises</span>}
                  </div>
                )}
                {!ci.exercises?.length && ci.workout_name && (
                  <div style={{ marginTop: 4, fontSize: 10, color: '#64748b' }}>📋 {ci.workout_name}</div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* ── PROGRESS TAB ── */}
        {activeTab === 'progress' && (() => {
          const LIFT_EXERCISES = ['bench press', 'squat', 'deadlift', 'overhead press', 'barbell row'];
          const liftHistory = {};
          [...clientCIs].reverse().forEach(ci => {
            (ci.exercises || []).forEach(ex => {
              const name  = (ex.exercise || ex.name || '').toLowerCase();
              const match = LIFT_EXERCISES.find(l => name.includes(l.split(' ')[0]));
              if (match && ex.weight && parseFloat(ex.weight) > 0) {
                if (!liftHistory[match]) liftHistory[match] = [];
                liftHistory[match].push({ date: format(new Date(ci.check_in_date), 'MMM d'), weight: parseFloat(ex.weight) });
              }
            });
          });
          const lifts       = Object.entries(liftHistory).filter(([, data]) => data.length >= 2);
          const last30CIs   = clientCIs.filter(ci => new Date(ci.check_in_date) >= subDays(new Date(), 30));
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <BarChart2 style={{ width: 13, height: 13, color: '#a78bfa' }}/>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>Session Compliance (30d)</span>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 900, color: last30CIs.length >= 12 ? '#34d399' : last30CIs.length >= 6 ? '#fbbf24' : '#f87171', letterSpacing: '-0.03em' }}>{last30CIs.length} sessions</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (last30CIs.length / 20) * 100)}%`, background: last30CIs.length >= 12 ? 'linear-gradient(90deg,#34d399,#10b981)' : last30CIs.length >= 6 ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#f87171,#ef4444)', borderRadius: 99, transition: 'width 0.8s ease' }}/>
                </div>
                <div style={{ fontSize: 10, color: '#64748b' }}>
                  {last30CIs.length >= 16 ? '🔥 Super Active' : last30CIs.length >= 8 ? '👍 Active — good consistency' : last30CIs.length >= 4 ? '⚠️ Moderate — encourage more' : '🚨 Low — needs follow-up'}
                </div>
              </div>
              {lifts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#3a5070' }}>
                  <TrendingUp style={{ width: 20, height: 20, opacity: 0.4, margin: '0 auto 8px' }}/>
                  <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No lift data yet</p>
                  <p style={{ fontSize: 10, margin: '4px 0 0' }}>Appears when sessions include exercises with weights</p>
                </div>
              ) : lifts.map(([liftName, data]) => {
                const pr   = Math.max(...data.map(d => d.weight));
                const gain = data[data.length - 1].weight - data[0].weight;
                return (
                  <div key={liftName} style={{ padding: '14px 16px', borderRadius: 12, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8', textTransform: 'capitalize' }}>{liftName}</div>
                        <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{data.length} sessions · PR: {pr}kg</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: gain >= 0 ? '#34d399' : '#f87171', background: gain >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', borderRadius: 6, padding: '2px 8px' }}>
                        {gain >= 0 ? '+' : ''}{gain.toFixed(1)}kg
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={80}>
                      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                        <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} width={28} domain={['auto', 'auto']}/>
                        <Tooltip contentStyle={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, fontSize: 11 }} formatter={v => [`${v}kg`, 'Weight']}/>
                        <Line type="monotone" dataKey="weight" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} activeDot={{ r: 5 }}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          );
        })()}
        {/* ── HEALTH TAB ── */}
        {activeTab === 'health' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Dumbbell style={{ width: 9, height: 9 }}/> Fitness Level
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FITNESS_LEVELS.map(level => {
                  const isActive = clientHealth.fitnessLevel === level;
                  const colors   = { Beginner: '#a78bfa', Intermediate: '#38bdf8', Advanced: '#34d399', Elite: '#fbbf24' };
                  const c        = colors[level] || '#64748b';
                  return (
                    <button key={level} onClick={() => updateHealth('fitnessLevel', level)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: isActive ? 700 : 500, background: isActive ? `${c}16` : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? `${c}35` : 'rgba(255,255,255,0.07)'}`, color: isActive ? c : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isActive && <Check style={{ width: 9, height: 9 }}/>}{level}
                    </button>
                  );
                })}
              </div>
            </div>
            {[
              { field: 'injuries',     label: 'Injuries & Pain Points',   icon: Heart,         placeholder: 'e.g. Lower back pain, left shoulder impingement…' },
              { field: 'restrictions', label: 'Movement Restrictions',    icon: Shield,        placeholder: 'e.g. No overhead pressing, avoid deep squats…'    },
              { field: 'allergies',    label: 'Allergies / Medical Info', icon: AlertCircle,   placeholder: 'e.g. Asthma, Type 2 diabetes, blood pressure…'     },
              { field: 'notes',        label: 'Additional Health Notes',  icon: ClipboardList, placeholder: 'Medications, GP clearance, anything relevant…'      },
            ].map(({ field, label, icon: Ic, placeholder }) => (
              <div key={field}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Ic style={{ width: 9, height: 9 }}/> {label}
                  {clientHealth[field] && <span style={{ fontSize: 9, color: '#34d399', fontWeight: 600 }}>✓ saved</span>}
                </div>
                <textarea
                  value={clientHealth[field] || ''}
                  onChange={e => updateHealth(field, e.target.value)}
                  placeholder={placeholder}
                  style={{ ...inputStyle, minHeight: 60, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, fontSize: 12, color: '#94a3b8' }}
                />
              </div>
            ))}
            {(clientHealth.fitnessLevel || clientHealth.injuries || clientHealth.restrictions) && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 9, color: '#3a5070', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Summary</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {clientHealth.fitnessLevel && <span style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 6, padding: '2px 8px' }}>{clientHealth.fitnessLevel}</span>}
                  {clientHealth.injuries     && <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '2px 8px' }}>⚠️ Injury noted</span>}
                  {clientHealth.restrictions && <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 6, padding: '2px 8px' }}>🛑 Restrictions</span>}
                  {clientHealth.allergies    && <span style={{ fontSize: 10, fontWeight: 700, color: '#f472b6', background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: 6, padding: '2px 8px' }}>💊 Medical info</span>}
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
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
                  <input value={newGoal.title}   onChange={e => setNewGoal(p=>({...p,title:e.target.value}))}   placeholder="Goal (e.g. Bench 100kg)" style={inputStyle}/>
                  <input value={newGoal.target}  onChange={e => setNewGoal(p=>({...p,target:e.target.value}))}  placeholder="Target" style={inputStyle}/>
                  <input value={newGoal.unit}    onChange={e => setNewGoal(p=>({...p,unit:e.target.value}))}    placeholder="Unit (kg)" style={inputStyle}/>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
                  <input value={newGoal.current}  onChange={e => setNewGoal(p=>({...p,current:e.target.value}))}  placeholder="Current value" style={inputStyle}/>
                  <input value={newGoal.deadline} onChange={e => setNewGoal(p=>({...p,deadline:e.target.value}))} placeholder="Target date" type="date" style={{ ...inputStyle, colorScheme: 'dark' }}/>
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
                const daysLeft = g.deadline ? differenceInDays(new Date(g.deadline), now) : null;
                return (
                  <div key={g.id || i} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8' }}>{g.title}</span>
                        {daysLeft !== null && (
                          <span style={{ fontSize: 9, color: daysLeft < 14 ? '#f87171' : '#64748b', marginLeft: 8 }}>
                            {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
                          </span>
                        )}
                      </div>
                      <button onClick={() => saveGoal(m.user_id, clientGoals.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
                        <X style={{ width: 12, height: 12 }}/>
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#34d399' : 'linear-gradient(90deg,#a78bfa,#7c3aed)', borderRadius: 99 }}/>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: pct >= 100 ? '#34d399' : '#a78bfa', flexShrink: 0 }}>
                        {current}{g.unit} / {g.target}{g.unit} · {pct}%
                      </span>
                    </div>
                    {pct >= 100 && <div style={{ marginTop: 6, fontSize: 10, color: '#34d399', fontWeight: 700 }}>🎉 Goal achieved!</div>}
                  </div>
                );
              })
            }
          </div>
        )}
        {/* ── PACKAGES / SESSIONS TAB ── */}
        {activeTab === 'packages' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>PT Session Packages</span>
              <button onClick={() => setShowPkgForm(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>
                <Plus style={{ width: 9, height: 9 }}/> Add Package
              </button>
            </div>
            {showPkgForm && (
              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6 }}>
                  <input value={newPkg.name}  onChange={e => setNewPkg(p=>({...p,name:e.target.value}))}  placeholder="Package name (e.g. 10 PT Sessions)" style={inputStyle}/>
                  <input value={newPkg.total} onChange={e => setNewPkg(p=>({...p,total:e.target.value}))} placeholder="Total" type="number" style={inputStyle}/>
                  <input value={newPkg.used}  onChange={e => setNewPkg(p=>({...p,used:e.target.value}))}  placeholder="Used" type="number" style={inputStyle}/>
                  <button onClick={handleAddPkg} style={{ padding: '7px 14px', borderRadius: 7, background: '#059669', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Save</button>
                </div>
              </div>
            )}
            {clientPkgs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#3a5070' }}>
                <Package style={{ width: 24, height: 24, opacity: 0.3, margin: '0 auto 8px' }}/>
                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No packages yet</p>
              </div>
            ) : clientPkgs.map((pkg, i) => {
              const used  = parseInt(pkg.used)  || 0;
              const total = parseInt(pkg.total) || 0;
              const rem   = Math.max(0, total - used);
              const pct   = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
              const low   = rem <= 2 && rem > 0;
              const done  = rem === 0;
              return (
                <div key={pkg.id || i} style={{ padding: 12, borderRadius: 12, background: '#0c1a2e', border: `1px solid ${done ? 'rgba(52,211,153,0.2)' : low ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)'}`, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8' }}>{pkg.name}</div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                        {used} used · <span style={{ fontWeight: 700, color: done ? '#34d399' : low ? '#fbbf24' : '#38bdf8' }}>{rem} remaining</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                      {low  && !done && <span style={{ fontSize: 9, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', borderRadius: 4, padding: '2px 6px' }}>Low</span>}
                      {done && <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', borderRadius: 4, padding: '2px 6px' }}>Complete ✓</span>}
                      <button onClick={() => savePackage(m.user_id, clientPkgs.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
                        <X style={{ width: 11, height: 11 }}/>
                      </button>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: done ? 'linear-gradient(90deg,#34d399,#10b981)' : low ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#38bdf8,#0ea5e9)', borderRadius: 99, transition: 'width 0.6s ease' }}/>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                    <span style={{ fontSize: 9, color: '#3a5070' }}>0</span>
                    <span style={{ fontSize: 9, color: '#3a5070', fontWeight: 600 }}>{pct}% used</span>
                    <span style={{ fontSize: 9, color: '#3a5070' }}>{total}</span>
                  </div>
                  {low && !done && (
                    <button onClick={() => openModal('post', { memberId: m.user_id, packageRenewal: true })} style={{ marginTop: 8, width: '100%', padding: '6px', borderRadius: 7, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                      💬 Remind about renewal
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* ── ONBOARDING TAB ── */}
        {activeTab === 'onboarding' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>Onboarding Checklist</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{ONBOARDING_STEPS.filter(s => clientOnboard[s.id]).length} of {ONBOARDING_STEPS.length} complete</div>
              </div>
              <div style={{ position: 'relative', width: 48, height: 48 }}>
                <svg viewBox="0 0 48 48" style={{ width: 48, height: 48, transform: 'rotate(-90deg)' }}>
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
                  <circle cx="24" cy="24" r="20" fill="none" stroke={onboardPct === 100 ? '#34d399' : '#a78bfa'} strokeWidth="4" strokeDasharray={`${(onboardPct / 100) * 125.7} 125.7`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }}/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: onboardPct === 100 ? '#34d399' : '#a78bfa' }}>{onboardPct}%</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ONBOARDING_STEPS.map(step => {
                const done = !!clientOnboard[step.id];
                return (
                  <div
                    key={step.id}
                    onClick={() => toggleOnboard(step.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: done ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.025)', border: `1px solid ${done ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${done ? '#34d399' : 'rgba(255,255,255,0.15)'}`, background: done ? 'rgba(52,211,153,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {done && <Check style={{ width: 12, height: 12, color: '#34d399' }}/>}
                    </div>
                    <span style={{ fontSize: 12 }}>{step.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: done ? 700 : 500, color: done ? '#f0f4f8' : '#94a3b8', textDecoration: done ? 'none' : 'none' }}>{step.label}</span>
                    {done && <Check style={{ width: 10, height: 10, color: '#34d399', marginLeft: 'auto' }}/>}
                  </div>
                );
              })}
            </div>
            {onboardPct === 100 && (
              <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>🎉</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#34d399' }}>Onboarding complete!</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{m.user_name} is fully set up and ready to go.</div>
              </div>
            )}
          </div>
        )}
        {/* ── PAYMENTS TAB ── */}
        {activeTab === 'payments' && (
          <div>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Membership', value: m.membership_type || 'Monthly', color: '#38bdf8' },
                { label: 'Status',     value: m.membership_status || 'Active', color: '#34d399' },
                { label: 'Plan Price', value: m.membership_price ? `£${m.membership_price}/mo` : '—', color: '#a78bfa' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 8, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Expiry */}
            {membershipExpiry && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: membershipExpiry.urgent ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.025)', border: `1px solid ${membershipExpiry.urgent ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)'}`, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar style={{ width: 13, height: 13, color: membershipExpiry.urgent ? '#f87171' : '#64748b', flexShrink: 0 }}/>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: membershipExpiry.urgent ? '#f87171' : '#f0f4f8' }}>
                    {membershipExpiry.daysLeft > 0 ? `Expires in ${membershipExpiry.daysLeft} days` : membershipExpiry.daysLeft === 0 ? 'Expires today' : 'Expired'}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{format(membershipExpiry.date, 'MMMM d, yyyy')}</div>
                </div>
                {membershipExpiry.urgent && (
                  <button onClick={() => openModal('post', { memberId: m.user_id, renewal: true })} style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 7, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                    Remind
                  </button>
                )}
              </div>
            )}
            {/* Payment history (from membership data) */}
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Payment History</div>
            {m.payment_history && m.payment_history.length > 0 ? (
              m.payment_history.slice(0, 8).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.status === 'paid' ? '#34d399' : p.status === 'failed' ? '#f87171' : '#fbbf24', flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8' }}>{p.description || 'Membership payment'}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{p.date ? format(new Date(p.date), 'MMM d, yyyy') : '—'}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: p.status === 'paid' ? '#34d399' : p.status === 'failed' ? '#f87171' : '#fbbf24' }}>
                    {p.status === 'failed' ? '✗' : ''}£{p.amount || '—'}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#3a5070' }}>
                <CreditCard style={{ width: 20, height: 20, opacity: 0.3, margin: '0 auto 8px' }}/>
                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No payment data available</p>
                <p style={{ fontSize: 10, margin: '4px 0 0' }}>Payments will appear here when connected via Stripe</p>
              </div>
            )}
            {/* Outstanding balance */}
            {m.outstanding_balance > 0 && (
              <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle style={{ width: 13, height: 13, color: '#f87171', flexShrink: 0 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#f87171' }}>Outstanding balance: £{m.outstanding_balance}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Action required</div>
                </div>
                <button onClick={() => openModal('post', { memberId: m.user_id, paymentReminder: true })} style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  Remind
                </button>
              </div>
            )}
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
                { label: 'Birthday',     value: m.date_of_birth ? format(parseISO(m.date_of_birth), 'MMMM d') : '—' },
                { label: 'Referred By',  value: m.referred_by || '—' },
                { label: 'No-Show Rate', value: `${m.noShowRate}%` },
              ].map((item, i) => (
                <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 8, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', wordBreak: 'break-all' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Coach Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: MessageCircle, label: 'Send Message',    color: '#38bdf8', modal: 'post',            data: { memberId: m.user_id } },
                { icon: ClipboardList, label: 'Add Note',        color: '#a78bfa', action: () => setActiveTab('notes') },
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
  const [search,        setSearch]        = useState('');
  const [segment,       setSegment]       = useState('all');
  const [sort,          setSort]          = useState('recentlyActive');
  const [viewMode,      setViewMode]      = useState('list');
  const [lbMetric,      setLbMetric]      = useState('streak');
  const [expanded,      setExpanded]      = useState(null);
  const [selectedClient,setSelectedClient]= useState(null);
  const [bulkMode,      setBulkMode]      = useState(false);
  const [selected,      setSelected]      = useState([]);
  const [tagFilter,     setTagFilter]     = useState(null);
  const [showTagMenu,   setShowTagMenu]   = useState(false);
  const gymId = allMemberships[0]?.gym_id || null;
  // ── Persisted annotations ─────────────────────────────────────────────────
  const [notes,     setNotes]     = useState(() => { try { return JSON.parse(localStorage.getItem('coachClientNotes')     || '{}'); } catch { return {}; } });
  const [tags,      setTags]      = useState(() => { try { return JSON.parse(localStorage.getItem('coachClientTags')      || '{}'); } catch { return {}; } });
  const [goals,     setGoals]     = useState(() => { try { return JSON.parse(localStorage.getItem('coachClientGoals')     || '{}'); } catch { return {}; } });
  const [health,    setHealth]    = useState(() => { try { return JSON.parse(localStorage.getItem('coachClientHealth')    || '{}'); } catch { return {}; } });
  const [packages,  setPackages]  = useState(() => { try { return JSON.parse(localStorage.getItem('coachClientPackages') || '{}'); } catch { return {}; } });
  const [onboarding,setOnboarding]= useState(() => { try { return JSON.parse(localStorage.getItem('coachClientOnboarding')|| '{}'); } catch { return {}; } });
  // Load from backend
  useEffect(() => {
    if (!gymId) return;
    base44.functions.invoke('coachData', { action: 'read', gymId })
      .then(result => {
        if (!result?.data) return;
        const d = result.data;
        const fields = [
          ['client_notes',      setNotes,      'coachClientNotes'     ],
          ['client_tags',       setTags,       'coachClientTags'      ],
          ['client_goals',      setGoals,      'coachClientGoals'     ],
          ['client_health',     setHealth,     'coachClientHealth'    ],
          ['client_packages',   setPackages,   'coachClientPackages'  ],
          ['client_onboarding', setOnboarding, 'coachClientOnboarding'],
        ];
        fields.forEach(([key, setter, lsKey]) => {
          if (d[key] && Object.keys(d[key]).length) {
            setter(d[key]);
            try { localStorage.setItem(lsKey, JSON.stringify(d[key])); } catch {}
          }
        });
      })
      .catch(() => {});
  }, [gymId]);
  // Write-through helpers
  const makeWriter = (stateKey, setter, lsKey, backendField) => (uid, val) => {
    const u = { ...{ notes, tags, goals, health, packages, onboarding }[stateKey], [uid]: val };
    setter(u);
    try { localStorage.setItem(lsKey, JSON.stringify(u)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field: backendField, data: u }).catch(() => {});
  };
  const saveNote      = useCallback(makeWriter('notes',     setNotes,     'coachClientNotes',      'client_notes'),      [notes,     gymId]);
  const saveTag       = useCallback(makeWriter('tags',      setTags,      'coachClientTags',       'client_tags'),       [tags,      gymId]);
  const saveGoal      = useCallback(makeWriter('goals',     setGoals,     'coachClientGoals',      'client_goals'),      [goals,     gymId]);
  const saveHealth    = useCallback(makeWriter('health',    setHealth,    'coachClientHealth',     'client_health'),     [health,    gymId]);
  const savePackage   = useCallback(makeWriter('packages',  setPackages,  'coachClientPackages',   'client_packages'),   [packages,  gymId]);
  const saveOnboarding= useCallback(makeWriter('onboarding',setOnboarding,'coachClientOnboarding', 'client_onboarding'),[onboarding,gymId]);
  // ── Enriched members ──────────────────────────────────────────────────────
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
    const noShowRate     = calcNoShowRate(m.bookings, checkIns, m.user_id);
    const hasBirthday    = !!getBirthdayStatus(m.date_of_birth, now);
    const clientTagList  = tags[m.user_id] || [];
    return { ...m, last, daysAgo, visits, trend, streak, status, spark, totalVisits, nextMilestone, isNew, hasHealthNotes, noShowRate, hasBirthday, clientTagList };
  }), [allMemberships, checkIns, ci30, memberLastCI, now, health, tags]);
  // ── Segment counts ────────────────────────────────────────────────────────
  const counts = {
    all:      enriched.length,
    new:      enriched.filter(m => m.isNew).length,
    vip:      enriched.filter(m => m.status === 'vip').length,
    active:   enriched.filter(m => m.status === 'active' || m.status === 'regular').length,
    at_risk:  enriched.filter(m => m.status === 'at_risk').length,
    lapsed:   enriched.filter(m => m.status === 'inactive').length,
    birthdays:enriched.filter(m => m.hasBirthday).length,
    no_shows: enriched.filter(m => m.noShowRate >= 25).length,
  };
  const SEGMENTS = [
    { id: 'all',      label: 'All Clients',  count: counts.all      },
    { id: 'new',      label: '🌱 New',        count: counts.new      },
    { id: 'vip',      label: '⭐ VIP',        count: counts.vip      },
    { id: 'active',   label: 'Active',        count: counts.active   },
    { id: 'at_risk',  label: '⚠️ At Risk',    count: counts.at_risk  },
    { id: 'lapsed',   label: 'Lapsed',        count: counts.lapsed   },
    { id: 'birthdays',label: '🎂 Birthdays',  count: counts.birthdays},
    { id: 'no_shows', label: '🚫 No-shows',   count: counts.no_shows },
  ];
  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => enriched
    .filter(m => {
      const matchSeg  = segment === 'all'      ? true
                      : segment === 'new'      ? m.isNew
                      : segment === 'vip'      ? m.status === 'vip'
                      : segment === 'active'   ? (m.status === 'active' || m.status === 'regular')
                      : segment === 'birthdays'? m.hasBirthday
                      : segment === 'no_shows' ? m.noShowRate >= 25
                      : m.status === segment;
      const matchTag  = !tagFilter || (tags[m.user_id] || []).includes(tagFilter);
      const matchSrch = !search || (m.user_name || '').toLowerCase().includes(search.toLowerCase());
      return matchSeg && matchTag && matchSrch;
    })
    .sort((a, b) => {
      if (sort === 'recentlyActive') { if (!a.last && !b.last) return 0; if (!a.last) return 1; if (!b.last) return -1; return new Date(b.last) - new Date(a.last); }
      if (sort === 'mostVisits') return b.visits - a.visits;
      if (sort === 'name')       return (a.user_name || '').localeCompare(b.user_name || '');
      if (sort === 'streak')     return b.streak - a.streak;
      if (sort === 'risk')       return (STATUS_PRIORITY[a.status] ?? 4) - (STATUS_PRIORITY[b.status] ?? 4);
      if (sort === 'noShows')    return b.noShowRate - a.noShowRate;
      return 0;
    }), [enriched, segment, search, sort, tagFilter, tags]);
  // ── Leaderboard data ──────────────────────────────────────────────────────
  const lbData = useMemo(() => [...enriched].sort((a, b) => {
    if (lbMetric === 'streak')  return b.streak - a.streak;
    if (lbMetric === 'monthly') return b.visits - a.visits;
    return b.totalVisits - a.totalVisits;
  }).slice(0, 10), [enriched, lbMetric]);
  // ── Bulk helpers ──────────────────────────────────────────────────────────
  const toggleSelect = (uid) => setSelected(s => s.includes(uid) ? s.filter(x => x !== uid) : [...s, uid]);
  const selectAll    = () => setSelected(selected.length === filtered.length ? [] : filtered.map(m => m.user_id));
  const clearBulk    = () => { setBulkMode(false); setSelected([]); };
  // ── Avg KPIs ──────────────────────────────────────────────────────────────
  const avgNoShow    = enriched.length > 0 ? Math.round(enriched.reduce((s, m) => s + m.noShowRate, 0) / enriched.length) : 0;
  const birthdayCount = counts.birthdays;
  const detailProps = { checkIns, avatarMap, now, notes, saveNote, tags, saveTag, goals, saveGoal, health, saveHealth, packages, savePackage, onboarding, saveOnboarding, openModal };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        <CoachKpiCard icon={Users}       label="Total Clients"     value={allMemberships.length}              sub="assigned to you"                                             accentColor="#0ea5e9"/>
        <CoachKpiCard icon={Activity}    label="Active This Month"  value={counts.vip + counts.active}        sub="visited this month"                                          accentColor="#10b981" footerBar={allMemberships.length > 0 ? ((counts.vip + counts.active) / allMemberships.length) * 100 : 0}/>
        <CoachKpiCard icon={UserPlus}    label="New This Month"     value={counts.new}                        sub="recently joined"                                             accentColor="#a78bfa"/>
        <CoachKpiCard icon={Ban}         label="Avg No-Show Rate"   value={`${avgNoShow}%`}                   sub={`${counts.no_shows} clients >25%`}                           accentColor={avgNoShow >= 25 ? '#ef4444' : avgNoShow >= 15 ? '#fbbf24' : '#34d399'}/>
        <CoachKpiCard icon={Gift}        label="Birthdays This Week" value={birthdayCount}                    sub="celebrate with them"                                         accentColor="#f472b6"/>
      </div>
      {/* ── Segment pills ── */}
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
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: '#3a5070' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…" style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 10, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f4f8', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}/>
        </div>
        {/* Sort */}
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '8px 10px', borderRadius: 9, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <option value="recentlyActive">Recently Active</option>
          <option value="mostVisits">Most Visits</option>
          <option value="name">Name A–Z</option>
          <option value="streak">Streak</option>
          <option value="risk">Risk Level</option>
          <option value="noShows">No-Show Rate</option>
        </select>
        {/* Tag filter */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowTagMenu(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 9, background: tagFilter ? 'rgba(167,139,250,0.12)' : '#0c1a2e', border: `1px solid ${tagFilter ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.07)'}`, color: tagFilter ? '#a78bfa' : '#94a3b8', fontSize: 11, fontWeight: tagFilter ? 700 : 500, cursor: 'pointer' }}>
            <Filter style={{ width: 11, height: 11 }}/>{tagFilter || 'Tag filter'}<ChevronDown style={{ width: 10, height: 10 }}/>
          </button>
          {showTagMenu && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#0d1b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 8, zIndex: 50, minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <button onClick={() => { setTagFilter(null); setShowTagMenu(false); }} style={{ width: '100%', padding: '6px 10px', background: 'none', border: 'none', color: '#64748b', fontSize: 11, textAlign: 'left', cursor: 'pointer', borderRadius: 6 }}>All tags</button>
              {PRESET_TAGS.map(t => (
                <button key={t} onClick={() => { setTagFilter(tagFilter === t ? null : t); setShowTagMenu(false); }} style={{ width: '100%', padding: '6px 10px', background: tagFilter === t ? 'rgba(167,139,250,0.1)' : 'none', border: 'none', color: tagFilter === t ? '#a78bfa' : '#94a3b8', fontSize: 11, textAlign: 'left', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {tagFilter === t && <Check style={{ width: 9, height: 9 }}/>}{t}
                  <span style={{ fontSize: 9, color: '#3a5070', marginLeft: 'auto' }}>
                    {enriched.filter(m => (tags[m.user_id] || []).includes(t)).length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* View toggles */}
        <div style={{ display: 'flex', gap: 2, padding: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, flexShrink: 0 }}>
          {[{ id: 'list', icon: List }, { id: 'cards', icon: LayoutGrid }, { id: 'leaderboard', icon: Trophy }].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)} style={{ width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, border: viewMode === v.id ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent', background: viewMode === v.id ? '#0c1a2e' : 'transparent', color: viewMode === v.id ? '#a78bfa' : '#3a5070', cursor: 'pointer' }}>
              <v.icon style={{ width: 12, height: 12 }}/>
            </button>
          ))}
        </div>
        {/* Bulk toggle */}
        <button onClick={() => { setBulkMode(s => !s); setSelected([]); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: bulkMode ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${bulkMode ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.07)'}`, color: bulkMode ? '#a78bfa' : '#64748b', fontSize: 11, fontWeight: bulkMode ? 700 : 500, cursor: 'pointer', flexShrink: 0 }}>
          <Layers style={{ width: 11, height: 11 }}/>{bulkMode ? 'Cancel' : 'Bulk'}
        </button>
        {/* Export */}
        <button onClick={() => exportCSV(filtered)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          <Download style={{ width: 11, height: 11 }}/> Export
        </button>
      </div>
      {/* ── Bulk action bar ── */}
      {bulkMode && selected.length > 0 && (
        <BulkActionBar
          selected={selected}
          allFiltered={filtered}
          onSelectAll={selectAll}
          onClear={clearBulk}
          onBulkMessage={() => openModal('bulkMessage', { memberIds: selected })}
          onBulkExport={() => exportCSV(filtered.filter(m => selected.includes(m.user_id)))}
        />
      )}
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
              {filtered.map((m, i) => (
                <ClientCard
                  key={m.user_id || i}
                  m={m}
                  avatarMap={avatarMap}
                  openModal={openModal}
                  onSelect={setSelectedClient}
                  isSelected={selected.includes(m.user_id)}
                  onToggleSelect={toggleSelect}
                  bulkMode={bulkMode}
                />
              ))}
            </div>
          )}
          {/* Cards modal */}
          {selectedClient && !bulkMode && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedClient(null)}>
              <div style={{ width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', borderRadius: 20, background: '#0d1b2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: '#0d1b2e', zIndex: 1 }}>
                  <MiniAvatar name={selectedClient.user_name} src={avatarMap[selectedClient.user_id]} size={44} color={STATUS_CFG[selectedClient.status]?.color || '#a78bfa'}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f4f8' }}>{selectedClient.user_name || 'Client'}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: STATUS_CFG[selectedClient.status]?.color, background: STATUS_CFG[selectedClient.status]?.bg, borderRadius: 4, padding: '2px 7px' }}>{STATUS_CFG[selectedClient.status]?.label}</span>
                      {selectedClient.hasHealthNotes && <span style={{ fontSize: 9, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>⚠️ Health notes</span>}
                      {selectedClient.hasBirthday && <span style={{ fontSize: 9, color: '#f472b6', background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>🎂 Birthday</span>}
                      {selectedClient.noShowRate >= 25 && <span style={{ fontSize: 9, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>{selectedClient.noShowRate}% no-show</span>}
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
            const bday         = getBirthdayStatus(m.date_of_birth, now);
            const isSelected   = selected.includes(m.user_id);
            return (
              <div key={m.user_id || i}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: isExp ? 'none' : '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: isSelected ? `${sc.color}08` : isExp ? `${sc.color}05` : 'transparent', transition: 'background 0.12s' }}
                  onClick={() => bulkMode ? toggleSelect(m.user_id) : setExpanded(isExp ? null : (m.user_id || i))}
                  onMouseEnter={e => { if (!isExp && !isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSelected ? `${sc.color}08` : isExp ? `${sc.color}05` : 'transparent'; }}>
                  {/* Bulk checkbox */}
                  {bulkMode && (
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isSelected ? sc.color : 'rgba(255,255,255,0.2)'}`, background: isSelected ? sc.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSelected && <Check style={{ width: 10, height: 10, color: '#000' }}/>}
                    </div>
                  )}
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
                      {bday          && <span style={{ fontSize: 8, color: '#f472b6', background: 'rgba(244,114,182,0.08)', borderRadius: 3, padding: '1px 5px', flexShrink: 0, border: '1px solid rgba(244,114,182,0.18)' }}>{bday.label}</span>}
                      {m.noShowRate >= 25 && <NoShowBadge rate={m.noShowRate}/>}
                      {clientTagList.slice(0, 1).map(t => <span key={t} style={{ fontSize: 8, color: '#a78bfa', background: 'rgba(167,139,250,0.06)', borderRadius: 3, padding: '1px 5px', flexShrink: 0, border: '1px solid rgba(167,139,250,0.15)' }}>{t}</span>)}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 10, color: '#64748b' }}>{m.visits} visits/mo</span>
                      {m.daysAgo !== null && <span style={{ fontSize: 10, color: '#3a5070' }}>Last: {m.daysAgo === 0 ? 'today' : `${m.daysAgo}d ago`}</span>}
                      {m.trend !== 0 && <span style={{ fontSize: 10, color: m.trend > 0 ? '#34d399' : '#f87171' }}>{m.trend > 0 ? `↑${m.trend}%` : `↓${Math.abs(m.trend)}%`}</span>}
                    </div>
                  </div>
                  {/* Spark dots */}
                  <div style={{ width: 52, flexShrink: 0 }}>
                    <svg viewBox="0 0 52 20" style={{ width: 52, height: 20 }}>
                      {m.spark.map((v, si) => { const x = (si / (m.spark.length - 1)) * 48 + 2; const y = 18 - (v / sparkMax) * 14; return <circle key={si} cx={x} cy={y} r={1.5} fill={v > 0 ? sc.color : 'rgba(255,255,255,0.1)'}/> })}
                    </svg>
                  </div>
                  {/* Engagement bar */}
                  <EngagementBar visits={m.visits} trend={m.trend} streak={m.streak} color={sc.color}/>
                  {/* At-risk nudge */}
                  {m.status === 'at_risk' && (
                    <button onClick={e => { e.stopPropagation(); openModal('post', { memberId: m.user_id, nudge: true }); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', color: '#fbbf24', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      <Zap style={{ width: 9, height: 9 }}/> Nudge
                    </button>
                  )}
                  {/* Birthday quick action */}
                  {bday?.urgent && (
                    <button onClick={e => { e.stopPropagation(); openModal('post', { memberId: m.user_id, birthday: true }); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.22)', color: '#f472b6', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      🎂 Wish
                    </button>
                  )}
                  {/* Message */}
                  {!bulkMode && (
                    <button onClick={e => { e.stopPropagation(); openModal('post', { memberId: m.user_id }); }} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)', color: '#38bdf8', cursor: 'pointer', flexShrink: 0 }}>
                      <MessageCircle style={{ width: 11, height: 11 }}/>
                    </button>
                  )}
                  {!bulkMode && <ChevronRight style={{ width: 13, height: 13, color: '#3a5070', flexShrink: 0, transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}/>}
                </div>
                {/* Expanded detail */}
                {isExp && !bulkMode && <ClientDetailPanel m={m} {...detailProps}/>}
              </div>
            );
          })}
        </CoachCard>
      )}
    </div>
  );
}