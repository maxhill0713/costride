import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
TrendingDown, Users, Trophy, AlertCircle, BarChart2,
Eye, Menu, LayoutDashboard, FileText, BarChart3, Settings,
LogOut, ChevronDown, AlertTriangle, QrCode, MessageSquarePlus,
Plus, Dumbbell, Clock, Crown, Trash2, X, Download, Send, Bell,
Sun
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, subDays, startOfDay, isWithinInterval } from 'date-fns';
import ManageRewardsModal    from '../components/gym/ManageRewardsModal';
import ManageClassesModal    from '../components/gym/ManageClassesModal';
import ManageCoachesModal    from '../components/gym/ManageCoachesModal';
import ManageGymPhotosModal  from '../components/gym/ManageGymPhotosModal';
import EditGymPhotoModal     from '../components/gym/EditGymPhotoModal';
import ManageMembersModal    from '../components/gym/ManageMembersModal';
import CreateGymOwnerPostModal from '../components/gym/CreateGymOwnerPostModal';
import ManageEquipmentModal  from '../components/gym/ManageEquipmentModal';
import ManageAmenitiesModal  from '../components/gym/ManageAmenitiesModal';
import EditBasicInfoModal    from '../components/gym/EditBasicInfoModal';
import CreateEventModal      from '../components/events/CreateEventModal';
import CreateChallengeModal  from '../components/challenges/CreateChallengeModal';
import QRScanner             from '../components/gym/QRScanner';
import CreatePollModal       from '../components/polls/CreatePollModal';
import GymJoinPoster         from '../components/dashboard/GymJoinPoster';
import QRCode                from 'react-qr-code';
import { DASH_STYLE } from '../components/dashboard/DashboardPrimitives';
import TabOverview   from '../components/dashboard/TabOverview';
import TabMembersComponent from '../components/dashboard/TabMembers';
import TabContentComponent from '../components/dashboard/TabContent';
import TabAnalyticsComponent from '../components/dashboard/TabAnalytics';
import TabGym        from '../components/dashboard/TabGym';

const NAV = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'members',   label: 'Members',   icon: Users },
  { id: 'content',   label: 'Content',   icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'gym',       label: 'Settings',  icon: Settings },
];

// Overrides: make all cards/panels use frosted glass so the gradient bleeds through
const GRADIENT_OVERRIDE = `
  .dash-root {
    --bg:      #060c18;
    --sidebar: #0a1628;
    --card:    #0f1e32;
    --card2:   #0d1b2e;
    --border:  rgba(255,255,255,0.10);
    --text1:   #f0f4f8;
    --text2:   #94a3b8;
    --text3:   #64748b;
    --cyan:    #38bdf8;
    --green:   #34d399;
    --red:     #f87171;
  }

  /* ── Card top-edge accent ── */
  .dash-root .card-hover {
    position: relative !important;
    overflow: hidden !important;
  }
  .dash-root .card-hover::after {
    content: '';
    position: absolute;
    top: 0; left: 14px; right: 14px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(56,189,248,0.28), transparent);
    pointer-events: none;
    border-radius: 0;
  }

  /* ── Nav items ── */
  .dash-root .nav-item {
    border-left: 3px solid transparent !important;
    border-radius: 0 9px 9px 0 !important;
    padding-left: 9px !important;
    transition: all 0.14s ease !important;
  }
  .dash-root .nav-item:not(.active) {
    color: #8b9eb8 !important;
  }
  .dash-root .nav-item:not(.active):hover {
    color: #c2d4e8 !important;
    background: rgba(255,255,255,0.05) !important;
    border-left-color: rgba(56,189,248,0.2) !important;
  }
  .dash-root .nav-item.active {
    background: rgba(56,189,248,0.1) !important;
    color: #38bdf8 !important;
    border-left-color: #38bdf8 !important;
    font-weight: 700 !important;
  }

  /* ── Quick action buttons ── */
  .dash-root .qa-btn {
    border-left: 2px solid transparent !important;
    transition: all 0.14s ease !important;
  }
  .dash-root .qa-btn:hover {
    background: rgba(255,255,255,0.07) !important;
    border-left-color: rgba(56,189,248,0.45) !important;
    transform: translateX(2px);
  }

  /* ── Priority rows ── */
  .dash-root .priority-row {
    border-left: 2px solid transparent !important;
    border-radius: 10px !important;
    transition: all 0.14s ease !important;
  }
  .dash-root .priority-row:hover {
    background: rgba(255,255,255,0.04) !important;
    border-left-color: rgba(56,189,248,0.35) !important;
  }

  /* ── Filter tabs ── */
  .dash-root .filter-tab {
    color: #8b9eb8 !important;
    transition: all 0.14s ease !important;
  }
  .dash-root .filter-tab:hover {
    color: #c2d4e8 !important;
  }
  .dash-root .filter-tab.active {
    color: #38bdf8 !important;
    background: rgba(56,189,248,0.1) !important;
    border-color: rgba(56,189,248,0.25) !important;
  }

  /* ── Member rows ── */
  .dash-root .member-row {
    transition: background 0.12s ease !important;
  }
  .dash-root .member-row:hover {
    background: rgba(255,255,255,0.03) !important;
    cursor: pointer;
  }

  /* ── Scrollbar ── */
  .dash-root ::-webkit-scrollbar { width: 5px; height: 5px; }
  .dash-root ::-webkit-scrollbar-track { background: transparent; }
  .dash-root ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
  .dash-root ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
`;

export default function GymOwnerDashboard() {
  const [tab, setTab]               = useState('overview');
  const [collapsed, setCollapsed]   = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const [gymOpen, setGymOpen]       = useState(false);
  const [modal, setModal]           = useState(null);
  const [showPoster, setShowPoster] = useState(false);
  const [chartRange, setChartRange] = useState(7);
  const [leaderboardView, setLeaderboardView] = useState('checkins');
  const [memberFilter, setMemberFilter] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSort, setMemberSort]     = useState('recentlyActive');
  const [memberPage, setMemberPage]     = useState(1);
  const [memberPageSize]                = useState(10);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const openModal  = (name) => setModal(name);
  const closeModal = ()     => setModal(null);
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000 });
  useEffect(() => { if (currentUser && !currentUser.onboarding_completed) navigate(createPageUrl('Onboarding')); }, [currentUser, navigate]);

  const { data: gyms = [], error: gymsError } = useQuery({
    queryKey: ['ownerGyms', currentUser?.email],
    queryFn:  () => base44.entities.Gym.filter({ owner_email: currentUser.email }),
    enabled: !!currentUser?.email, retry: 3, staleTime: 5 * 60 * 1000,
  });

  const myGyms       = gyms.filter(g => g.owner_email === currentUser?.email);
  const approvedGyms = myGyms.filter(g => g.status === 'approved');
  const pendingGyms  = myGyms.filter(g => g.status === 'pending');
  useEffect(() => { if (approvedGyms.length > 0 && !selectedGym) setSelectedGym(approvedGyms[0]); }, [approvedGyms, selectedGym]);
  useEffect(() => { const iv = setInterval(() => queryClient.invalidateQueries({ queryKey: ['ownerGyms'] }), 10000); return () => clearInterval(iv); }, [queryClient]);

  const qo = { staleTime: 3 * 60 * 1000, placeholderData: p => p };
  const on  = !!selectedGym;
  const { data: allMemberships = [] } = useQuery({ queryKey: ['memberships', selectedGym?.id], queryFn: () => base44.entities.GymMembership.filter({ gym_id: selectedGym.id, status: 'active' }), enabled: on && !!currentUser, ...qo });
  const { data: checkIns   = [] }     = useQuery({ queryKey: ['checkIns',   selectedGym?.id], queryFn: () => base44.entities.CheckIn.filter({ gym_id: selectedGym.id }, '-check_in_date', 2000), enabled: on, ...qo });
  const { data: rewards    = [] }     = useQuery({ queryKey: ['rewards',    selectedGym?.id], queryFn: () => base44.entities.Reward.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: classes    = [] }     = useQuery({ queryKey: ['classes',    selectedGym?.id], queryFn: () => base44.entities.GymClass.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: coaches    = [] }     = useQuery({ queryKey: ['coaches',    selectedGym?.id], queryFn: () => base44.entities.Coach.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: events     = [] }     = useQuery({ queryKey: ['events',     selectedGym?.id], queryFn: () => base44.entities.Event.filter({ gym_id: selectedGym.id }, '-event_date'), enabled: on, ...qo });
  const { data: posts      = [] }     = useQuery({ queryKey: ['posts',      selectedGym?.id], queryFn: () => base44.entities.Post.filter({ member_id: selectedGym.id }, '-created_date', 20), enabled: on, ...qo });
  const { data: challenges = [] }     = useQuery({ queryKey: ['challenges', selectedGym?.id], queryFn: () => base44.entities.Challenge.filter({ gym_id: selectedGym.id }, '-created_date'), enabled: on, ...qo });
  const { data: polls      = [] }     = useQuery({ queryKey: ['polls',      selectedGym?.id], queryFn: () => base44.entities.Poll.filter({ gym_id: selectedGym.id, status: 'active' }, '-created_date'), enabled: on, ...qo });

  const inv     = (...keys) => keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k, selectedGym?.id] }));
  const invGyms = () => queryClient.invalidateQueries({ queryKey: ['gyms'] });

  const createRewardM    = useMutation({ mutationFn: d  => base44.entities.Reward.create(d),     onSuccess: () => inv('rewards') });
  const deleteRewardM    = useMutation({ mutationFn: id => base44.entities.Reward.delete(id),    onSuccess: () => inv('rewards') });
  const createClassM     = useMutation({ mutationFn: d  => base44.entities.GymClass.create(d),   onSuccess: () => inv('classes') });
  const deleteClassM     = useMutation({ mutationFn: id => base44.entities.GymClass.delete(id),  onSuccess: () => inv('classes') });
  const updateClassM     = useMutation({ mutationFn: ({id,data}) => base44.entities.GymClass.update(id, data), onSuccess: () => inv('classes') });
  const createCoachM     = useMutation({ mutationFn: d  => base44.entities.Coach.create(d),      onSuccess: () => inv('coaches') });
  const deleteCoachM     = useMutation({ mutationFn: id => base44.entities.Coach.delete(id),     onSuccess: () => inv('coaches') });
  const updateGalleryM   = useMutation({ mutationFn: g  => base44.entities.Gym.update(selectedGym.id, { gallery: g }), onSuccess: () => { invGyms(); closeModal(); } });
  const updateGymM       = useMutation({ mutationFn: d  => base44.entities.Gym.update(selectedGym.id, d), onSuccess: () => { invGyms(); closeModal(); } });
  const createEventM     = useMutation({ mutationFn: d  => base44.entities.Event.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, attendees: 0 }), onSuccess: () => { inv('events'); closeModal(); } });
  const createChallengeM = useMutation({ mutationFn: d  => base44.entities.Challenge.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, participants: [], status: 'upcoming' }), onSuccess: () => { inv('challenges'); closeModal(); } });
  const banMemberM       = useMutation({ mutationFn: uid => base44.entities.Gym.update(selectedGym.id, { banned_members: [...(selectedGym?.banned_members||[]), uid] }), onSuccess: invGyms });
  const unbanMemberM     = useMutation({ mutationFn: uid => base44.entities.Gym.update(selectedGym.id, { banned_members: (selectedGym?.banned_members||[]).filter(id=>id!==uid) }), onSuccess: invGyms });
  const deleteGymM       = useMutation({ mutationFn: () => base44.entities.Gym.delete(selectedGym.id), onSuccess: () => { invGyms(); closeModal(); window.location.href = createPageUrl('Gyms'); } });
  const deleteAccountM   = useMutation({ mutationFn: () => base44.functions.invoke('deleteUserAccount'), onSuccess: () => { closeModal(); base44.auth.logout(); } });
  const createPollM      = useMutation({ mutationFn: d  => base44.entities.Poll.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, created_by: currentUser.id, voters: [] }), onSuccess: () => { inv('polls'); closeModal(); } });
  const deletePostM      = useMutation({ mutationFn: id => base44.entities.Post.delete(id),      onSuccess: () => inv('posts') });
  const deleteEventM     = useMutation({ mutationFn: id => base44.entities.Event.delete(id),     onSuccess: () => inv('events') });
  const deleteChallengeM = useMutation({ mutationFn: id => base44.entities.Challenge.delete(id), onSuccess: () => inv('challenges') });
  const deletePollM      = useMutation({ mutationFn: id => base44.entities.Poll.delete(id),      onSuccess: () => inv('polls') });

  const memberUserIds = useMemo(() => { const s = new Set(); checkIns.forEach(c => { if (c.user_id) s.add(c.user_id); }); allMemberships.forEach(m => { if (m.user_id) s.add(m.user_id); }); return [...s].slice(0, 100); }, [checkIns, allMemberships]);
  const { data: memberUsers = [] } = useQuery({ queryKey: ['memberUsers', selectedGym?.id, memberUserIds.length], queryFn: async () => { if (!memberUserIds.length) return []; const r = await Promise.allSettled(memberUserIds.map(uid => base44.entities.User.filter({ id: uid }).then(x => x?.[0] || null))); return r.filter(x => x.status === 'fulfilled' && x.value).map(x => x.value); }, enabled: memberUserIds.length > 0 && on, staleTime: 10 * 60 * 1000 });
  const avatarMap = useMemo(() => { const m = {}; memberUsers.forEach(u => { if (u?.id) { const av = u.avatar_url || u.profile_picture || u.photo_url || null; if (av) m[u.id] = av; } }); return m; }, [memberUsers]);

  const now = new Date();

  const ci7              = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,7),  end: now }));
  const ci30             = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,30), end: now }));
  const ciPrev30         = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,60), end: subDays(now,30) }));
  const todayCI          = checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(now).getTime()).length;
  const yesterdayCI      = checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now,1)).getTime()).length;
  const todayVsYest      = yesterdayCI > 0 ? Math.round(((todayCI - yesterdayCI) / yesterdayCI) * 100) : 0;
  const totalMembers     = allMemberships.length;
  const activeThisWeek   = new Set(ci7.map(c => c.user_id)).size;
  const activeLastWeek   = new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,14), end: subDays(now,7) })).map(c => c.user_id)).size;
  const weeklyChangePct  = activeLastWeek > 0 ? Math.round(((activeThisWeek - activeLastWeek) / activeLastWeek) * 100) : 0;
  const activeThisMonth  = new Set(ci30.map(c => c.user_id)).size;
  const retentionRate    = totalMembers > 0 ? Math.round((activeThisMonth / totalMembers) * 100) : 0;
  const monthCiPer       = (() => { const acc={}; ci30.forEach(c=>{acc[c.user_id]=(acc[c.user_id]||0)+1;}); return Object.values(acc); })();
  const memberLastCheckIn = {};
  checkIns.forEach(c => { if (!memberLastCheckIn[c.user_id] || new Date(c.check_in_date) > new Date(memberLastCheckIn[c.user_id])) memberLastCheckIn[c.user_id] = c.check_in_date; });
  const atRiskMembersList = allMemberships.filter(m => { const last = memberLastCheckIn[m.user_id]; if (!last) return true; return Math.floor((now - new Date(last)) / 86400000) >= 14; });
  const atRisk           = atRiskMembersList.length;
  const monthChangePct   = ciPrev30.length > 0 ? Math.round(((ci30.length - ciPrev30.length) / ciPrev30.length) * 100) : 0;
  const newSignUps       = allMemberships.filter(m => isWithinInterval(new Date(m.join_date || m.created_date || now), { start: subDays(now,30), end: now })).length;
  const newSignUpsPrev   = allMemberships.filter(m => isWithinInterval(new Date(m.join_date || m.created_date || now), { start: subDays(now,60), end: subDays(now,30) })).length;
  const cancelledEst     = Math.max(0, newSignUpsPrev - newSignUps);
  const sparkData        = Array.from({length:7},(_,i)=>checkIns.filter(c=>startOfDay(new Date(c.check_in_date)).getTime()===startOfDay(subDays(now,6-i)).getTime()).length);
  const monthGrowthData  = Array.from({length:6},(_,i)=>{ const e=subDays(now,i*30), s=subDays(e,30); return { label: format(e,'MMM'), value: new Set(checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).map(c=>c.user_id)).size }; }).reverse();
  const hourAcc = {};
  checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); hourAcc[h] = (hourAcc[h]||0)+1; });
  const peakEntry    = Object.entries(hourAcc).sort(([,a],[,b])=>b-a)[0];
  const peakLabel    = peakEntry ? (() => { const h = parseInt(peakEntry[0]); return h < 12 ? `${h || 12}AM` : `${h===12?12:h-12}PM`; })() : null;
  const peakEndLabel = peakEntry ? (() => { const h = parseInt(peakEntry[0]) + 1; return h < 12 ? `${h}AM` : `${h===12?12:h-12}PM`; })() : null;
  const satCI    = checkIns.filter(c => new Date(c.check_in_date).getDay() === 6);
  const otherCI  = checkIns.filter(c => new Date(c.check_in_date).getDay() !== 6);
  const satAvg   = satCI.length / Math.max(Math.ceil(checkIns.length / 7), 1);
  const otherAvg = otherCI.length / Math.max(Math.ceil(checkIns.length / 7) * 6, 1);
  const satVsAvg = otherAvg > 0 ? Math.round(((satAvg - otherAvg) / otherAvg) * 100) : 0;
  const chartDays = useMemo(() => {
    const days = chartRange <= 7 ? 7 : chartRange <= 30 ? 30 : 90;
    return Array.from({length: days}, (_, i) => {
      const d = subDays(now, days - 1 - i);
      return { day: format(d, days <= 7 ? 'EEE' : 'MMM d'), value: checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(d).getTime()).length };
    });
  }, [chartRange, checkIns]);
  const streaks = useMemo(() => {
    const acc = {};
    checkIns.forEach(c => { acc[c.user_name] = (acc[c.user_name] || new Set()); acc[c.user_name].add(startOfDay(new Date(c.check_in_date)).getTime()); });
    return Object.entries(acc).map(([name, days]) => ({ name, streak: days.size })).sort((a,b)=>b.streak-a.streak).slice(0,5);
  }, [checkIns]);
  const recentActivity = useMemo(() => {
    return [...checkIns].slice(0, 8).map(c => ({ name: c.user_name || 'Member', user_id: c.user_id, action: 'checked in', time: c.check_in_date, color: '#10b981' }));
  }, [checkIns]);
  const priorities = [
    atRisk > 0        && { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: `${atRisk} Members Inactive`, action: 'Send Message', fn: () => setTab('members') },
    !challenges.some(c=>c.status==='active') && { icon: Trophy, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'No Active Challenges', action: 'Create One', fn: () => openModal('challenge') },
    polls.length===0  && { icon: BarChart2, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'No Active Polls', action: 'Create Poll', fn: () => openModal('poll') },
    monthChangePct < 0 && { icon: TrendingDown, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Attendance Down', action: 'View Insight', fn: () => setTab('analytics') },
  ].filter(Boolean).slice(0, 4);

  const Splash = ({ children }) => (
    <div className="dash-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060c18' }}>
      <div style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}>{children}</div>
    </div>
  );

  if (gymsError) return <Splash><X style={{width:28,height:28,color:'#ef4444',margin:'0 auto 12px'}}/><h2 style={{color:'#f1f5f9',fontWeight:800,marginBottom:8}}>Error</h2><p style={{color:'#94a3b8',fontSize:13,marginBottom:20}}>{gymsError.message}</p><button onClick={()=>window.location.reload()} style={{background:'#3b82f6',color:'#fff',border:'none',borderRadius:10,padding:'9px 20px',fontWeight:700,cursor:'pointer'}}>Retry</button></Splash>;
  if (approvedGyms.length===0 && pendingGyms.length>0) return <Splash><Clock style={{width:28,height:28,color:'#f59e0b',margin:'0 auto 12px'}}/><h2 style={{color:'#f1f5f9',fontWeight:800,marginBottom:8}}>Pending Approval</h2><p style={{color:'#94a3b8',fontSize:13,marginBottom:20}}>Your gym <strong style={{color:'#fbbf24'}}>{pendingGyms[0].name}</strong> is under review.</p><Link to={createPageUrl('Home')}><button style={{background:'rgba(255,255,255,0.08)',color:'#f1f5f9',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 20px',fontWeight:700,cursor:'pointer'}}>Back to Home</button></Link></Splash>;
  if (myGyms.length===0) return <Splash><Dumbbell style={{width:28,height:28,color:'#38bdf8',margin:'0 auto 12px'}}/><h2 style={{color:'#f1f5f9',fontWeight:800,marginBottom:8}}>No Gyms</h2><p style={{color:'#94a3b8',fontSize:13,marginBottom:20}}>Register your gym to get started.</p><Link to={createPageUrl('GymSignup')}><button style={{background:'linear-gradient(135deg,#0ea5e9,#06b6d4)',color:'#fff',border:'none',borderRadius:10,padding:'9px 20px',fontWeight:700,cursor:'pointer'}}>Register Your Gym</button></Link></Splash>;

  const tabContent = {
    overview: <TabOverview todayCI={todayCI} yesterdayCI={yesterdayCI} todayVsYest={todayVsYest} activeThisWeek={activeThisWeek} totalMembers={totalMembers} retentionRate={retentionRate} newSignUps={newSignUps} monthChangePct={monthChangePct} ciPrev30={ciPrev30} atRisk={atRisk} sparkData={sparkData} monthGrowthData={monthGrowthData} cancelledEst={cancelledEst} peakLabel={peakLabel} peakEndLabel={peakEndLabel} peakEntry={peakEntry} satVsAvg={satVsAvg} monthCiPer={monthCiPer} checkIns={checkIns} allMemberships={allMemberships} challenges={challenges} posts={posts} polls={polls} classes={classes} coaches={coaches} streaks={streaks} recentActivity={recentActivity} chartDays={chartDays} chartRange={chartRange} setChartRange={setChartRange} avatarMap={avatarMap} priorities={priorities} selectedGym={selectedGym} now={now} openModal={openModal} setTab={setTab}/>,
    members:  <TabMembersComponent allMemberships={allMemberships} checkIns={checkIns} ci30={ci30} memberLastCheckIn={memberLastCheckIn} selectedGym={selectedGym} atRisk={atRisk} atRiskMembersList={atRiskMembersList} retentionRate={retentionRate} totalMembers={totalMembers} activeThisWeek={activeThisWeek} newSignUps={newSignUps} weeklyChangePct={weeklyChangePct} avatarMap={avatarMap} memberFilter={memberFilter} setMemberFilter={setMemberFilter} memberSearch={memberSearch} setMemberSearch={setMemberSearch} memberSort={memberSort} setMemberSort={setMemberSort} memberPage={memberPage} setMemberPage={setMemberPage} memberPageSize={memberPageSize} selectedRows={selectedRows} setSelectedRows={setSelectedRows} openModal={openModal} now={now}/>,
    content:  <TabContentComponent events={events} challenges={challenges} polls={polls} posts={posts} classes={classes} checkIns={checkIns} ci30={ci30} avatarMap={avatarMap} leaderboardView={leaderboardView} setLeaderboardView={setLeaderboardView} openModal={openModal} now={now} onDeletePost={id=>deletePostM.mutate(id)} onDeleteEvent={id=>deleteEventM.mutate(id)} onDeleteChallenge={id=>deleteChallengeM.mutate(id)} onDeleteClass={id=>deleteClassM.mutate(id)} onDeletePoll={id=>deletePollM.mutate(id)}/>,
    analytics:<TabAnalyticsComponent checkIns={checkIns} ci30={ci30} totalMembers={totalMembers} monthCiPer={monthCiPer} monthChangePct={monthChangePct} monthGrowthData={monthGrowthData} retentionRate={retentionRate} activeThisMonth={activeThisMonth} newSignUps={newSignUps} atRisk={atRisk} gymId={selectedGym?.id}/>,
    gym:      <TabGym selectedGym={selectedGym} classes={classes} coaches={coaches} openModal={openModal}/>,
  };

  return (
    <div
      className="dash-root"
      style={{
        display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative',
        // Professional deep navy
        background: '#060c18',
      }}
    >
      <style>{DASH_STYLE}</style>
      <style>{GRADIENT_OVERRIDE}</style>

      {/* ─── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 60 : 224, flexShrink: 0, height: '100%', overflow: 'hidden',
        background: '#0a1628',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Logo / gym name */}
        <div style={{ padding: collapsed ? '18px 0' : '18px 14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 18px rgba(14,165,233,0.35)' }}>
              <Dumbbell style={{ width: 16, height: 16, color: '#fff' }}/>
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>{selectedGym?.name || 'Dashboard'}</div>
                <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: 600, letterSpacing: '0.04em', marginTop: 1 }}>GYM OWNER</div>
              </div>
            )}
          </div>
          {!collapsed && approvedGyms.length > 1 && (
            <div style={{ position: 'relative', marginTop: 10 }}>
              <button onClick={() => setGymOpen(o=>!o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedGym?.name}</span>
                <ChevronDown style={{ width: 12, height: 12, flexShrink: 0, transform: gymOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
              </button>
              {gymOpen && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: '110%', borderRadius: 10, overflow: 'hidden', background: '#060c18', border: '1px solid rgba(56,189,248,0.2)', zIndex: 20, boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
                  {approvedGyms.map(g => <button key={g.id} onClick={() => { setSelectedGym(g); setGymOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 12, fontWeight: 600, background: selectedGym?.id===g.id?'rgba(56,189,248,0.1)':'transparent', color: selectedGym?.id===g.id?'#38bdf8':'#94a3b8', border: 'none', cursor: 'pointer' }}>{g.name}</button>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0 12px', overflowY: 'auto' }}>
          {!collapsed && <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 16px', marginBottom: 6 }}>Menu</div>}
          {NAV.map(item => {
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`nav-item ${active ? 'active' : ''}`}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: collapsed ? 0 : 10,
                  padding: collapsed ? '11px 0' : '9px 14px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  border: 'none', cursor: 'pointer', marginBottom: 1,
                  fontSize: 13,
                }}>
                <item.icon style={{ width: 16, height: 16, flexShrink: 0 }}/>
                {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
                {!collapsed && active && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8', flexShrink: 0 }}/>
                )}
              </button>
            );
          })}
        </nav>

        {/* Retention Pro upsell */}
        {!collapsed && (
          <div style={{ padding: '0 10px 10px', flexShrink: 0 }}>
            <Link to={createPageUrl('Plus')}>
              <div style={{ padding: '11px 13px', borderRadius: 11, background: 'linear-gradient(135deg,rgba(139,92,246,0.16),rgba(236,72,153,0.08))', border: '1px solid rgba(139,92,246,0.22)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.4),transparent)' }}/>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <Crown style={{ width: 12, height: 12, color: '#a78bfa' }}/>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>Retention Pro</span>
                </div>
                <div style={{ fontSize: 10, color: '#9b7de0', fontWeight: 600 }}>Unlock advanced analytics · From £49.99/mo</div>
              </div>
            </Link>
          </div>
        )}

        {/* Bottom utility links */}
        <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {!collapsed && (
            <div style={{ padding: '10px 10px 4px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, paddingLeft: 4 }}>Links</div>
              {[
                { icon: Eye,   label: 'View Gym Page', to: createPageUrl('GymCommunity')+'?id='+selectedGym?.id },
                { icon: Users, label: 'Member View',   to: createPageUrl('Home') },
              ].map((l,i) => (
                <Link key={i} to={l.to}>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', border: 'none', background: 'transparent', color: '#8b9eb8', fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 8, marginBottom: 1, transition: 'color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c2d4e8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8b9eb8'}>
                    <l.icon style={{ width: 14, height: 14, flexShrink: 0 }}/>
                    <span>{l.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          )}
          {collapsed && (
            <div style={{ padding: '8px 0' }}>
              {[
                { icon: Eye, to: createPageUrl('GymCommunity')+'?id='+selectedGym?.id },
                { icon: Users, to: createPageUrl('Home') },
              ].map((l,i) => (
                <Link key={i} to={l.to}>
                  <button style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '9px 0', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
                    <l.icon style={{ width: 15, height: 15 }}/>
                  </button>
                </Link>
              ))}
            </div>
          )}
          <div style={{ padding: collapsed ? '4px 0 14px' : '0 10px 14px' }}>
            <button onClick={() => base44.auth.logout()} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: collapsed ? '9px 0' : '7px 8px', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', background: 'transparent', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 8, transition: 'opacity 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <LogOut style={{ width: 14, height: 14, flexShrink: 0 }}/>
              {!collapsed && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* ─── HEADER ───────────────────────────────────────────────────── */}
        <header style={{
          height: 58, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
          background: '#0a1628',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
        }}>
          {/* subtle bottom gradient line */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.15) 30%, rgba(56,189,248,0.15) 70%, transparent 100%)', pointerEvents: 'none' }}/>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setCollapsed(o=>!o)} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8b9eb8', cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f0f4f8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#8b9eb8'; }}>
              <Menu style={{ width: 14, height: 14 }}/>
            </button>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {tab === 'members' ? 'Members' : tab === 'content' ? 'Content' : tab === 'analytics' ? 'Analytics' : tab === 'gym' ? 'Settings' : selectedGym?.name || 'Dashboard'}
              </div>
              <div style={{ fontSize: 11, color: '#4a6080', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                {tab === 'members'
                  ? <><span style={{ color: '#38bdf8', fontWeight: 700 }}>{allMemberships.length}</span><span> members · {selectedGym?.name}</span></>
                  : <>{format(now, 'EEEE, d MMMM yyyy')} <span style={{ color: '#334155' }}>·</span> <Sun style={{ width: 10, height: 10 }}/> <span>18°C</span></>
                }
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {selectedGym?.join_code && (
              <button onClick={() => setShowPoster(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.22)', color: '#34d399', fontSize: 11, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.02em' }}>
                <QrCode style={{ width: 12, height: 12 }}/>
                <span style={{ fontFamily: 'monospace', letterSpacing: '0.14em' }}>{selectedGym.join_code}</span>
                <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.65, letterSpacing: 0 }}>· Flyer</span>
              </button>
            )}
            {atRisk > 0 && (
              <button onClick={() => setTab('members')} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '5px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle style={{ width: 11, height: 11 }}/>{atRisk} at risk
              </button>
            )}
            <button onClick={() => openModal('qrScanner')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: 'rgba(56,189,248,0.09)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.16)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(56,189,248,0.09)'}>
              <QrCode style={{ width: 13, height: 13 }}/> Scan QR
            </button>
            <button onClick={() => openModal('post')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: 'rgba(255,255,255,0.06)', color: '#f0f4f8', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
              <Plus style={{ width: 13, height: 13 }}/> New Post
            </button>
            {/* Bell */}
            <Link to={createPageUrl('NotificationsHub')}>
              <button style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8b9eb8', cursor: 'pointer', position: 'relative', transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#f0f4f8'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#8b9eb8'; }}>
                <Bell style={{ width: 14, height: 14 }}/>
                {atRisk > 0 && <div style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #0a1628' }}/>}
              </button>
            </Link>
            {/* User */}
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 6px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', boxShadow: '0 0 10px rgba(14,165,233,0.3)' }}>
                {(currentUser?.full_name || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8' }}>{(currentUser?.full_name || currentUser?.email || 'User').split(' ')[0]}</span>
              <ChevronDown style={{ width: 11, height: 11, color: '#4a6080' }}/>
            </button>
          </div>
        </header>

        {/* Main — transparent so gradient shows through */}
        <main style={{ flex: 1, overflow: 'hidden', padding: '22px 22px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: tab === 'content' ? '100%' : 1600, overflowY: tab === 'content' ? 'hidden' : 'auto' }}>
            {tabContent[tab] || tabContent.overview}
          </div>
        </main>
      </div>

      {/* ─── MODALS ───────────────────────────────────────────────────────── */}
      <ManageRewardsModal    open={modal==='rewards'}    onClose={closeModal} rewards={rewards}   onCreateReward={d=>createRewardM.mutate(d)}  onDeleteReward={id=>deleteRewardM.mutate(id)} gym={selectedGym} isLoading={createRewardM.isPending}/>
      <ManageClassesModal    open={modal==='classes'}    onClose={closeModal} classes={classes}   onCreateClass={d=>createClassM.mutate(d)}    onUpdateClass={(id,data)=>updateClassM.mutate({id,data})} onDeleteClass={id=>deleteClassM.mutate(id)} gym={selectedGym} isLoading={createClassM.isPending||updateClassM.isPending}/>
      <ManageCoachesModal    open={modal==='coaches'}    onClose={closeModal} coaches={coaches}   onCreateCoach={d=>createCoachM.mutate(d)}    onDeleteCoach={id=>deleteCoachM.mutate(id)}  gym={selectedGym} isLoading={createCoachM.isPending}/>
      <EditGymPhotoModal     open={modal==='heroPhoto'}  onClose={closeModal} gym={selectedGym}   onSave={url=>updateGymM.mutate({image_url:url})} isLoading={updateGymM.isPending}/>
      <ManageGymPhotosModal  open={modal==='photos'}     onClose={closeModal} gallery={selectedGym?.gallery||[]} onSave={g=>updateGalleryM.mutate(g)} isLoading={updateGalleryM.isPending}/>
      <ManageMembersModal    open={modal==='members'}    onClose={closeModal} gym={selectedGym}   onBanMember={id=>banMemberM.mutate(id)}      onUnbanMember={id=>unbanMemberM.mutate(id)}/>
      <CreateGymOwnerPostModal open={modal==='post'}     onClose={closeModal} gym={selectedGym}   onSuccess={()=>inv('posts')}/>
      <CreateEventModal      open={modal==='event'}      onClose={closeModal} onSave={d=>createEventM.mutate(d)} gym={selectedGym} isLoading={createEventM.isPending}/>
      <CreateChallengeModal  open={modal==='challenge'}  onClose={closeModal} gyms={gyms}         onSave={d=>createChallengeM.mutate(d)}       isLoading={createChallengeM.isPending}/>
      <QRScanner             open={modal==='qrScanner'}  onClose={closeModal}/>
      <ManageEquipmentModal  open={modal==='equipment'}  onClose={closeModal} equipment={selectedGym?.equipment||[]} onSave={e=>updateGymM.mutate({equipment:e})} isLoading={updateGymM.isPending}/>
      <ManageAmenitiesModal  open={modal==='amenities'}  onClose={closeModal} amenities={selectedGym?.amenities||[]} onSave={a=>updateGymM.mutate({amenities:a})} isLoading={updateGymM.isPending}/>
      <EditBasicInfoModal    open={modal==='editInfo'}   onClose={closeModal} gym={selectedGym}   onSave={d=>updateGymM.mutate(d)} isLoading={updateGymM.isPending}/>
      <CreatePollModal       open={modal==='poll'}       onClose={closeModal} onSave={d=>createPollM.mutate(d)} isLoading={createPollM.isPending}/>
      <AlertDialog open={modal==='deleteGym'} onOpenChange={v=>!v&&closeModal()}>
        <AlertDialogContent style={{background:'rgba(2,6,23,0.95)',backdropFilter:'blur(16px)',border:'1px solid rgba(239,68,68,0.3)'}} className="max-w-md">
          <AlertDialogHeader><AlertDialogTitle style={{color:'#f1f5f9',display:'flex',alignItems:'center',gap:8}}><Trash2 style={{width:18,height:18,color:'#f87171'}}/>Delete Gym Permanently?</AlertDialogTitle><AlertDialogDescription style={{color:'#94a3b8',fontSize:13}}>Deletes <strong style={{color:'#f1f5f9'}}>{selectedGym?.name}</strong> and all its data. <span style={{color:'#f87171',fontWeight:600}}>Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel style={{background:'rgba(255,255,255,0.05)',color:'#f1f5f9',border:'1px solid rgba(255,255,255,0.1)'}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteGymM.mutate()} disabled={deleteGymM.isPending} style={{background:'#dc2626',color:'#fff'}}>{deleteGymM.isPending?'Deleting…':'Delete Permanently'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={modal==='deleteAccount'} onOpenChange={v=>!v&&closeModal()}>
        <AlertDialogContent style={{background:'rgba(2,6,23,0.95)',backdropFilter:'blur(16px)',border:'1px solid rgba(239,68,68,0.3)'}} className="max-w-md">
          <AlertDialogHeader><AlertDialogTitle style={{color:'#f1f5f9',display:'flex',alignItems:'center',gap:8}}><Trash2 style={{width:18,height:18,color:'#f87171'}}/>Delete Account?</AlertDialogTitle><AlertDialogDescription style={{color:'#94a3b8',fontSize:13}}>Deletes your account, all gyms, and personal data. <span style={{color:'#f87171',fontWeight:600}}>Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel style={{background:'rgba(255,255,255,0.05)',color:'#f1f5f9',border:'1px solid rgba(255,255,255,0.1)'}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteAccountM.mutate()} disabled={deleteAccountM.isPending} style={{background:'#dc2626',color:'#fff'}}>{deleteAccountM.isPending?'Deleting…':'Delete Account'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <GymJoinPoster gym={selectedGym} open={showPoster} onClose={() => setShowPoster(false)}/>
      {modal==='qrCode' && (
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(8px)'}}>
          <div style={{borderRadius:24,padding:36,maxWidth:360,width:'100%',background:'rgba(2,6,23,0.95)',backdropFilter:'blur(16px)',border:'1px solid rgba(56,189,248,0.25)',boxShadow:'0 24px 64px rgba(0,0,0,0.7)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
              <h3 style={{fontSize:16,fontWeight:800,color:'#f1f5f9'}}>Gym Join QR Code</h3>
              <button onClick={closeModal} style={{width:30,height:30,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer'}}><X style={{width:14,height:14}}/></button>
            </div>
            <div id="qr-fullscreen" style={{display:'flex',justifyContent:'center',padding:20,borderRadius:16,background:'#fff',marginBottom:16}}>
              <QRCode value={`${window.location.origin}${createPageUrl('Gyms')}?joinCode=${selectedGym?.join_code}`} size={220} level="H"/>
            </div>
            <p style={{textAlign:'center',fontSize:13,color:'#94a3b8',marginBottom:16}}>Join code: <strong style={{color:'#f1f5f9',letterSpacing:'0.15em'}}>{selectedGym?.join_code}</strong></p>
            <button onClick={()=>{const svg=document.getElementById('qr-fullscreen')?.querySelector('svg');if(!svg)return;const d=new XMLSerializer().serializeToString(svg);const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');const img=new Image();img.onload=()=>{canvas.width=img.width;canvas.height=img.height;ctx.drawImage(img,0,0);const a=document.createElement('a');a.download=`${selectedGym?.name}-QR.png`;a.href=canvas.toDataURL('image/png');a.click();};img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(d)));}}
              style={{width:'100%',padding:'11px',borderRadius:12,background:'linear-gradient(135deg,#10b981,#0d9488)',color:'#fff',border:'none',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,marginBottom:8}}>
              <Download style={{width:14,height:14}}/> Download QR Code
            </button>
            <button onClick={closeModal} style={{width:'100%',padding:'10px',borderRadius:12,background:'rgba(255,255,255,0.05)',color:'#94a3b8',border:'1px solid rgba(255,255,255,0.09)',fontSize:13,fontWeight:600,cursor:'pointer'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
