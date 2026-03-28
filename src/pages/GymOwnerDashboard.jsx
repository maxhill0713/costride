import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { subDays, startOfDay, format } from 'date-fns';
import {
  LayoutDashboard, Users, BarChart2, Calendar, Dumbbell,
  Settings, BookOpen, MessageSquare, Star, ChevronDown,
  Building2, Clock, Zap, RefreshCw,
} from 'lucide-react';

import ProfileDropdown from '@/components/dashboard/ProfileDropdown';

const TabOverview       = lazy(() => import('@/components/dashboard/TabOverview'));
const TabMembers        = lazy(() => import('@/components/dashboard/TabMembers'));
const TabCoachOverview  = lazy(() => import('@/components/dashboard/TabCoachOverview'));
const TabCoachMembers   = lazy(() => import('@/components/dashboard/TabCoachMembers'));
const TabCoachAnalytics = lazy(() => import('@/components/dashboard/TabCoachAnalytics'));
const TabCoachSchedule  = lazy(() => import('@/components/dashboard/TabCoachSchedule'));
const TabCoachBookings  = lazy(() => import('@/components/dashboard/TabCoachBookings'));
const TabCoachContent   = lazy(() => import('@/components/dashboard/TabCoachContent'));
const TabCoachProfile   = lazy(() => import('@/components/dashboard/TabCoachProfile'));
const TabAnalytics      = lazy(() => import('@/components/dashboard/TabAnalytics'));
const TabContent        = lazy(() => import('@/components/dashboard/TabContent'));
const TabGym            = lazy(() => import('@/components/dashboard/TabGym'));
const TabRewards        = lazy(() => import('@/components/dashboard/TabRewards'));
const TabEngagement     = lazy(() => import('@/components/dashboard/TabEngagement'));

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG = '#060d18';
const SURFACE = '#0c1422';
const BORDER = 'rgba(255,255,255,0.07)';

function TabLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(167,139,250,0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────
const GYM_OWNER_TABS = [
  { id: 'overview',    label: 'Overview',    icon: LayoutDashboard, roles: ['gym_owner'] },
  { id: 'members',     label: 'Members',     icon: Users,           roles: ['gym_owner'] },
  { id: 'analytics',   label: 'Analytics',   icon: BarChart2,       roles: ['gym_owner'] },
  { id: 'content',     label: 'Content',     icon: MessageSquare,   roles: ['gym_owner'] },
  { id: 'gym',         label: 'Gym',         icon: Building2,       roles: ['gym_owner'] },
  { id: 'rewards',     label: 'Rewards',     icon: Star,            roles: ['gym_owner'] },
  { id: 'engagement',  label: 'Automations', icon: Zap,             roles: ['gym_owner'] },
];

const COACH_TABS = [
  { id: 'overview',    label: 'Overview',    icon: LayoutDashboard, roles: ['coach'] },
  { id: 'schedule',    label: 'Schedule',    icon: Calendar,        roles: ['coach'] },
  { id: 'bookings',    label: 'Bookings',    icon: Clock,           roles: ['coach'] },
  { id: 'members',     label: 'Clients',     coachLabel: 'Clients', icon: Users,    roles: ['coach'] },
  { id: 'analytics',   label: 'Analytics',   icon: BarChart2,       roles: ['coach'] },
  { id: 'content',     label: 'Content',     icon: BookOpen,        roles: ['coach'] },
  { id: 'profile',     label: 'Profile',     icon: Star,            roles: ['coach'] },
];

export default function GymOwnerDashboard() {
  const now = useMemo(() => new Date(), []);
  const [tab, setTab] = useState('overview');

  // Member table state (lifted so it persists across tab switches)
  const [memberFilter,   setMemberFilter]   = useState('all');
  const [memberSearch,   setMemberSearch]   = useState('');
  const [memberSort,     setMemberSort]     = useState('recentlyActive');
  const [memberPage,     setMemberPage]     = useState(1);
  const [memberPageSize] = useState(25);
  const [selectedRows,   setSelectedRows]   = useState(new Set());

  // ── Current user ──────────────────────────────────────────────────────────
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const isCoach    = currentUser?.account_type === 'coach';
  const isGymOwner = currentUser?.account_type === 'gym_owner';

  const navTabs = isCoach ? COACH_TABS : GYM_OWNER_TABS;

  // ── Gym data ──────────────────────────────────────────────────────────────
  const { data: allGyms = [] } = useQuery({
    queryKey: ['ownerGyms', currentUser?.id],
    queryFn: () => base44.entities.Gym.filter({ admin_id: currentUser.id }),
    enabled: !!currentUser?.id && isGymOwner,
    staleTime: 5 * 60 * 1000,
  });

  const { data: coachRecord } = useQuery({
    queryKey: ['coachRecord', currentUser?.email],
    queryFn: () => base44.entities.Coach.filter({ user_email: currentUser.email }).then(r => r[0] || null),
    enabled: !!currentUser?.email && isCoach,
    staleTime: 5 * 60 * 1000,
  });

  const [selectedGymId, setSelectedGymId] = useState(null);

  const selectedGym = useMemo(() => {
    if (isCoach && coachRecord) {
      return { id: coachRecord.gym_id, name: coachRecord.gym_name };
    }
    if (allGyms.length > 0) {
      return selectedGymId ? allGyms.find(g => g.id === selectedGymId) || allGyms[0] : allGyms[0];
    }
    return null;
  }, [allGyms, selectedGymId, coachRecord, isCoach]);

  const gymId = selectedGym?.id;

  // ── Core data queries ─────────────────────────────────────────────────────
  const { data: allMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', gymId],
    queryFn: () => base44.entities.GymMembership.filter({ gym_id: gymId, status: 'active' }),
    enabled: !!gymId,
    staleTime: 3 * 60 * 1000,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns90', gymId],
    queryFn: () => base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 5000),
    enabled: !!gymId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: allClasses = [] } = useQuery({
    queryKey: ['gymClasses', gymId],
    queryFn: () => base44.entities.GymClass.filter({ gym_id: gymId }),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['gymEvents', gymId],
    queryFn: () => base44.entities.Event.filter({ gym_id: gymId }, '-event_date', 50),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['gymPosts', gymId],
    queryFn: () => base44.entities.Post.filter({ gym_id: gymId }, '-created_date', 100),
    enabled: !!gymId,
    staleTime: 3 * 60 * 1000,
  });

  const { data: polls = [] } = useQuery({
    queryKey: ['gymPolls', gymId],
    queryFn: () => base44.entities.Poll ? base44.entities.Poll.filter({ gym_id: gymId }) : Promise.resolve([]),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['gymCoaches', gymId],
    queryFn: () => base44.entities.Coach.filter({ gym_id: gymId }),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['gymRewards', gymId],
    queryFn: () => base44.entities.Reward.filter({ gym_id: gymId }),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['gymChallenges', gymId],
    queryFn: () => base44.entities.Challenge.filter({ gym_id: gymId }),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Avatar map ────────────────────────────────────────────────────────────
  const avatarMap = useMemo(() => {
    const map = {};
    allMemberships.forEach(m => { if (m.avatar_url) map[m.user_id] = m.avatar_url; });
    return map;
  }, [allMemberships]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const ci30 = useMemo(() => checkIns.filter(c => (now - new Date(c.check_in_date)) < 30 * 86400000), [checkIns, now]);
  const ci7  = useMemo(() => checkIns.filter(c => (now - new Date(c.check_in_date)) < 7  * 86400000), [checkIns, now]);
  const ci7p = useMemo(() => checkIns.filter(c => { const ms = now - new Date(c.check_in_date); return ms >= 7 * 86400000 && ms < 14 * 86400000; }), [checkIns, now]);

  const ci30Count = ci30.length;
  const ci7Count  = ci7.length;
  const ci7pCount = ci7p.length;

  const weeklyTrend  = ci7pCount > 0 ? Math.round(((ci7Count - ci7pCount) / ci7pCount) * 100) : 0;

  const ci30Prev = useMemo(() => checkIns.filter(c => { const ms = now - new Date(c.check_in_date); return ms >= 30 * 86400000 && ms < 60 * 86400000; }).length, [checkIns, now]);
  const monthlyTrend = ci30Prev > 0 ? Math.round(((ci30Count - ci30Prev) / ci30Prev) * 100) : 0;

  const totalMembers = allMemberships.length;

  const activeThisMonth = useMemo(() => new Set(ci30.map(c => c.user_id)).size, [ci30]);
  const atRisk = useMemo(() => allMemberships.filter(m => {
    const last = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
    return !last || (now - new Date(last.check_in_date)) > 14 * 86400000;
  }).length, [allMemberships, checkIns, now]);

  const returningCount = useMemo(() => {
    const ids = new Set(ci30.map(c => c.user_id));
    return [...ids].filter(uid => checkIns.some(c => c.user_id === uid && (now - new Date(c.check_in_date)) >= 30 * 86400000)).length;
  }, [ci30, checkIns, now]);

  const newMembersThis30 = useMemo(() => allMemberships.filter(m => m.join_date && (now - new Date(m.join_date)) < 30 * 86400000).length, [allMemberships, now]);

  const weeklyChart = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const wEnd   = new Date(now - i * 7 * 86400000);
    const wStart = new Date(+wEnd - 7 * 86400000);
    return { label: `W${8 - i}`, value: checkIns.filter(c => new Date(c.check_in_date) >= wStart && new Date(c.check_in_date) < wEnd).length };
  }).reverse(), [checkIns, now]);

  const monthlyChart = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const mEnd   = new Date(now); mEnd.setMonth(mEnd.getMonth() - i);
    const mStart = new Date(mEnd); mStart.setMonth(mStart.getMonth() - 1);
    return { label: mStart.toLocaleString('default', { month: 'short' }), value: checkIns.filter(c => new Date(c.check_in_date) >= mStart && new Date(c.check_in_date) < mEnd).length };
  }).reverse(), [checkIns, now]);

  const engagementSegmentsCoach = useMemo(() => {
    const superActive = allMemberships.filter(m => ci30.filter(c => c.user_id === m.user_id).length >= 12).length;
    const active      = allMemberships.filter(m => { const v = ci30.filter(c => c.user_id === m.user_id).length; return v >= 4 && v < 12; }).length;
    const casual      = allMemberships.filter(m => { const v = ci30.filter(c => c.user_id === m.user_id).length; return v >= 1 && v < 4; }).length;
    const inactive    = allMemberships.filter(m => ci30.filter(c => c.user_id === m.user_id).length === 0).length;
    const engRate     = totalMembers > 0 ? Math.round(((superActive + active) / totalMembers) * 100) : 0;
    return { superActive, active, casual, inactive, engRate };
  }, [allMemberships, ci30, totalMembers]);

  const peakHours = useMemo(() => {
    const counts = {};
    checkIns.forEach(c => {
      const h = new Date(c.check_in_date).getHours();
      const label = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
      counts[label] = (counts[label] || 0) + 1;
    });
    const max = Math.max(...Object.values(counts), 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, count]) => ({ label, count, pct: Math.round((count / max) * 100) }));
  }, [checkIns]);

  const busiestDays = useMemo(() => {
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = DAYS.map(name => ({ name, count: 0 }));
    checkIns.forEach(c => { counts[new Date(c.check_in_date).getDay()].count++; });
    return counts.sort((a, b) => b.count - a.count);
  }, [checkIns]);

  // ── Coach-specific ────────────────────────────────────────────────────────
  const myClasses = useMemo(() => {
    if (!isCoach || !coachRecord) return [];
    return allClasses.filter(c => c.instructor === coachRecord.name || c.instructor === currentUser?.full_name);
  }, [allClasses, isCoach, coachRecord, currentUser]);

  const weekSpark = useMemo(() => Array.from({ length: 7 }, (_, i) =>
    ci7.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now, 6 - i)).getTime()).length
  ), [ci7, now]);

  // ── Modal handler (stub — tabs handle their own modals) ───────────────────
  const openModal = (type, data) => {
    console.log('openModal', type, data);
  };

  // ── Tab title ─────────────────────────────────────────────────────────────
  const tabTitle = {
    members:    isCoach ? 'Clients' : 'Members',
    content:    'Content',
    analytics:  'Analytics',
    gym:        'Settings',
    schedule:   'Schedule',
    bookings:   'Bookings',
    engagement: 'Automations',
    overview:   selectedGym?.name || 'Overview',
    profile:    'My Profile',
  }[tab] || selectedGym?.name || 'Dashboard';

  // ── Common props for coach tabs ───────────────────────────────────────────
  const coachCommonProps = {
    selectedGym,
    currentUser,
    allMemberships,
    checkIns,
    ci30,
    avatarMap,
    myClasses,
    events,
    posts,
    polls,
    challenges,
    coaches,
    openModal,
    now,
    gymId,
    ci30Count,
    ci7Count,
    ci7pCount,
    totalMembers,
    weeklyTrendCoach:  weeklyTrend,
    monthlyTrendCoach: monthlyTrend,
    returningCount,
    newMembersThis30,
    weeklyChart,
    monthlyChart,
    weekSpark,
    engagementSegmentsCoach,
    peakHours,
    busiestDays,
    activeThisMonth,
    atRisk,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#f0f4f8', fontFamily: 'DM Sans, system-ui, sans-serif' }}>

      {/* ── Top bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: `${SURFACE}f8`, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16, height: 56 }}>

          {/* Logo / gym selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 style={{ width: 14, height: 14, color: '#a78bfa' }}/>
            </div>
            {allGyms.length > 1 ? (
              <select
                value={selectedGym?.id || ''}
                onChange={e => setSelectedGymId(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#f0f4f8', fontSize: 14, fontWeight: 800, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
              >
                {allGyms.map(g => <option key={g.id} value={g.id} style={{ background: '#0c1422' }}>{g.name}</option>)}
              </select>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f4f8' }}>{selectedGym?.name || 'Dashboard'}</span>
            )}
          </div>

          {/* Tab nav */}
          <nav style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto' }}>
            {navTabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
                  color: tab === t.id ? '#a78bfa' : '#64748b',
                  background: tab === t.id ? 'rgba(167,139,250,0.12)' : 'transparent',
                  whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                <t.icon style={{ width: 13, height: 13 }}/>{t.coachLabel || t.label}
              </button>
            ))}
          </nav>

          {/* Profile dropdown */}
          <div style={{ flexShrink: 0 }}>
            <ProfileDropdown currentUser={currentUser} coaches={coaches} selectedGym={selectedGym} onSelectCoach={() => {}}/>
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 80px' }}>
        <Suspense fallback={<TabLoader />}>

          {/* GYM OWNER TABS */}
          {!isCoach && tab === 'overview'   && <TabOverview   selectedGym={selectedGym} allMemberships={allMemberships} checkIns={checkIns} ci30={ci30} events={events} posts={posts} coaches={coaches} challenges={challenges} rewards={rewards} avatarMap={avatarMap} openModal={openModal} now={now} gymId={gymId} ci30Count={ci30Count} ci7Count={ci7Count} ci7pCount={ci7pCount} totalMembers={totalMembers} weeklyTrend={weeklyTrend} monthlyTrend={monthlyTrend} weeklyChart={weeklyChart} monthlyChart={monthlyChart} atRisk={atRisk} activeThisMonth={activeThisMonth} returningCount={returningCount} newMembersThis30={newMembersThis30} peakHours={peakHours} busiestDays={busiestDays} engagementSegmentsCoach={engagementSegmentsCoach}/>}
          {!isCoach && tab === 'members'    && <TabMembers    selectedGym={selectedGym} allMemberships={allMemberships} checkIns={checkIns} ci30={ci30} avatarMap={avatarMap} openModal={openModal} now={now} gymId={gymId} memberFilter={memberFilter} setMemberFilter={setMemberFilter} memberSearch={memberSearch} setMemberSearch={setMemberSearch} memberSort={memberSort} setMemberSort={setMemberSort} memberPage={memberPage} setMemberPage={setMemberPage} memberPageSize={memberPageSize} selectedRows={selectedRows} setSelectedRows={setSelectedRows} atRisk={atRisk} atRiskMembersList={[]} totalMembers={totalMembers} posts={posts}/>}
          {!isCoach && tab === 'analytics'  && <TabAnalytics  selectedGym={selectedGym} allMemberships={allMemberships} checkIns={checkIns} ci30={ci30} events={events} coaches={coaches} challenges={challenges} avatarMap={avatarMap} openModal={openModal} now={now} gymId={gymId} ci30Count={ci30Count} ci7Count={ci7Count} ci7pCount={ci7pCount} totalMembers={totalMembers} weeklyTrend={weeklyTrend} monthlyTrend={monthlyTrend} weeklyChart={weeklyChart} monthlyChart={monthlyChart} atRisk={atRisk} activeThisMonth={activeThisMonth} returningCount={returningCount} newMembersThis30={newMembersThis30} peakHours={peakHours} busiestDays={busiestDays} engagementSegmentsCoach={engagementSegmentsCoach}/>}
          {!isCoach && tab === 'content'    && <TabContent    selectedGym={selectedGym} events={events} posts={posts} polls={polls} classes={allClasses} coaches={coaches} challenges={challenges} avatarMap={avatarMap} checkIns={checkIns} ci30={ci30} openModal={openModal} now={now} gymId={gymId} allMemberships={allMemberships}/>}
          {!isCoach && tab === 'gym'        && <TabGym        selectedGym={selectedGym} allMemberships={allMemberships} coaches={coaches} classes={allClasses} rewards={rewards} events={events} checkIns={checkIns} openModal={openModal} now={now} gymId={gymId}/>}
          {!isCoach && tab === 'rewards'    && <TabRewards    selectedGym={selectedGym} rewards={rewards} allMemberships={allMemberships} openModal={openModal} now={now} gymId={gymId}/>}
          {!isCoach && tab === 'engagement' && <TabEngagement selectedGym={selectedGym} allMemberships={allMemberships} checkIns={checkIns} openModal={openModal} now={now} gymId={gymId}/>}

          {/* COACH TABS */}
          {isCoach && tab === 'overview'   && <TabCoachOverview  {...coachCommonProps} shoutouts={[]} recaps={[]}/>}
          {isCoach && tab === 'schedule'   && <TabCoachSchedule  {...coachCommonProps} coachRecord={coachRecord}/>}
          {isCoach && tab === 'bookings'   && <TabCoachBookings  />}
          {isCoach && tab === 'members'    && <TabCoachMembers   {...coachCommonProps}/>}
          {isCoach && tab === 'analytics'  && <TabCoachAnalytics {...coachCommonProps} memberships={allMemberships} payments={[]} membershipEvents={[]} leads={[]} goals={[]} ptSlots={[]} bookings={[]}/>}
          {isCoach && tab === 'content'    && <TabCoachContent   allMemberships={allMemberships} events={events} posts={posts} polls={polls} classes={allClasses} recaps={[]} shoutouts={[]} checkIns={checkIns} ci30={ci30} avatarMap={avatarMap} openModal={openModal} now={now}/>}
          {isCoach && tab === 'profile'    && <TabCoachProfile   selectedGym={selectedGym} currentUser={currentUser}/>}

        </Suspense>
      </div>
    </div>
  );
}