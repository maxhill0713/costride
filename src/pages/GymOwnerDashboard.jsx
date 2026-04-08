import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  TrendingDown, Users, Trophy, AlertCircle, BarChart2,
  Eye, Menu, LayoutDashboard, FileText, BarChart3, Settings,
  LogOut, ChevronDown, AlertTriangle, QrCode, MessageSquarePlus,
  Plus, Dumbbell, Clock, Crown, Trash2, X, Download, Send,
  Sun, Zap, TrendingUp, Activity, Calendar, CheckCircle,
  MessageCircle, Star, UserCheck, Flame, ChevronRight, Pencil, Gift } from
'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ProfileDropdown from '../components/dashboard/ProfileDropdown';
import MemberChatPanel from '../components/dashboard/MemberChatPanel';
import ManageRewardsModal from '../components/gym/ManageRewardsModal';
import ManageClassesModal from '../components/gym/ManageClassesModal';
import ManageCoachesModal from '../components/gym/ManageCoachesModal';
import ManageGymPhotosModal from '../components/gym/ManageGymPhotosModal';
import EditGymPhotoModal from '../components/gym/EditGymPhotoModal';
import ManageMembersModal from '../components/gym/ManageMembersModal';
import CreateGymOwnerPostModal from '../components/gym/CreateGymOwnerPostModal';
import ManageEquipmentModal from '../components/gym/ManageEquipmentModal';
import ManageAmenitiesModal from '../components/gym/ManageAmenitiesModal';
import EditBasicInfoModal from '../components/gym/EditBasicInfoModal';
import CreateEventModal from '../components/events/CreateEventModal';
import CreateChallengeModal from '../components/challenges/CreateChallengeModal';
import QRScanner from '../components/gym/QRScanner';
import CreatePollModal from '../components/polls/CreatePollModal';
import GymJoinPoster from '../components/dashboard/GymJoinPoster';
import EditGymLogoModal from '../components/gym/EditGymLogoModal';
import EditPricingModal from '../components/gym/EditPricingModal';
import QRCode from 'react-qr-code';

import { lazy, Suspense } from 'react';

const TabOverview = lazy(() => import('../components/dashboard/TabOverview'));
const TabMembersComponent = lazy(() => import('../components/dashboard/TabMembers'));
const TabContentComponent = lazy(() => import('../components/dashboard/TabContent'));
const TabAnalyticsComponent = lazy(() => import('../components/dashboard/TabAnalytics'));
const TabGym = lazy(() => import('../components/dashboard/TabGym'));
const TabCoachSchedule = lazy(() => import('../components/dashboard/TabCoachSchedule'));
const TabCoachMembers = lazy(() => import('../components/dashboard/TabCoachMembers'));
const TabCoachContent = lazy(() => import('../components/dashboard/TabCoachContent'));
const TabCoachAnalytics = lazy(() => import('../components/dashboard/TabCoachAnalytics'));
const TabCoachProfile = lazy(() => import('../components/dashboard/TabCoachProfile'));
const TabEngagement = lazy(() => import('../components/dashboard/TabEngagement'));
const TabRewards = lazy(() => import('../components/dashboard/TabRewards'));
const TabCoachToday = lazy(() => import('../components/dashboard/TabCoachToday'));

function TabLoader() {
  return (
    <div className="flex justify-center p-10">
      <style>{`@keyframes _tab-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: '_tab-spin 0.7s linear infinite' }} />
    </div>
  );
}

/* ─── Hex values for SVG / data-driven color needs ─────────────── */
const HEX = { blue: '#3b82f6', red: '#ef4444', amber: '#f59e0b', green: '#10b981' };

const ALL_NAV = [
{ id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['gym_owner'] },
{ id: 'today', label: 'Today', icon: Sun, roles: ['coach'] },
{ id: 'members', label: 'Members', coachLabel: 'Clients', icon: Users, roles: ['gym_owner', 'coach'] },
{ id: 'schedule', label: 'Schedule', icon: Calendar, roles: ['coach'] },
{ id: 'content', label: 'Content', icon: FileText, roles: ['gym_owner', 'coach'] },
{ id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['gym_owner'] },
{ id: 'profile', label: 'Profile', icon: Crown, roles: ['coach'] },
{ id: 'engagement', label: 'Automations', icon: Zap, roles: ['gym_owner'] },
{ id: 'gym', label: 'Settings', icon: Settings, roles: ['gym_owner'] }];

/* ─── Sparkline ─────────────────────────────────────────────────── */
const Spark = ({ data = [], color = HEX.blue, height = 32 }) => {
  if (!data.length) return null;
  const w = 100, h = height;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = i / (data.length - 1) * w;
    const y = h - v / max * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `${pts} ${w},${h} 0,${h}`;
  const id = `sp-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block', marginTop: 8 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={area} fill={`url(#${id})`} />
    </svg>
  );
};

/* ─── Delta badge ───────────────────────────────────────────────── */
const Delta = ({ val }) => {
  const up = val > 0, flat = val === 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] border',
      flat ? 'text-slate-600 bg-white/[0.05] border-white/[0.04]'
           : up ? 'text-emerald-500 bg-emerald-500/[0.08] border-emerald-500/[0.20]'
                : 'text-red-500 bg-red-500/[0.08] border-red-500/[0.22]'
    )}>
      {flat ? '—' : up ? '+' : ''}{val}%
    </span>
  );
};

/* ─── KPI card ──────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, subColor, valueColor, footerBar, footerColor, trend }) {
  return (
    <div className="bg-[#0a0f1e] border border-white/[0.04] rounded-2xl p-5 relative overflow-hidden hover:border-white/[0.07] hover:shadow-[0_4px_24px_rgba(0,0,0,0.15)] transition-[border-color,box-shadow] duration-200">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.10em] text-slate-600">{label}</span>
        <div className="w-[26px] h-[26px] rounded-[7px] shrink-0 bg-white/[0.04] border border-white/[0.04] flex items-center justify-center">
          <Icon className="w-3 h-3 text-slate-600" />
        </div>
      </div>
      <div className={cn('text-[32px] font-extrabold tracking-[-0.04em] leading-none my-2', valueColor || 'text-slate-100')}>{value}</div>
      <div className={cn('text-[11px] flex items-center gap-1.5', subColor || 'text-slate-600')}>
        <span>{sub}</span>
        {trend != null && <Delta val={trend} />}
      </div>
      {footerBar != null && (
        <div className="mt-2.5 h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${Math.min(100, footerBar)}%`, background: footerColor || HEX.blue }} />
        </div>
      )}
    </div>
  );
}

function CoachKpiCard({ icon: Icon, label, value, sub, subColor, valueColor, footerBar, trend }) {
  return <KpiCard icon={Icon} label={label} value={value} sub={sub} subColor={subColor} valueColor={valueColor} footerBar={footerBar} trend={trend} />;
}

/* ─── Generic card shell ────────────────────────────────────────── */
function DashCard({ children, className, accentColor, title, action, onAction }) {
  return (
    <div className={cn('bg-[#0a0f1e] border border-white/[0.04] rounded-xl relative overflow-hidden', className)}>
      {accentColor && (
        <div className="absolute top-0 left-0 right-0 h-[1.5px] pointer-events-none"
          style={{ background: `linear-gradient(90deg, ${accentColor}50 0%, ${accentColor}18 60%, transparent 100%)` }} />
      )}
      {title && (
        <div className="flex items-center justify-between px-4 pt-3.5">
          <span className="text-[13px] font-bold text-slate-100">{title}</span>
          {onAction && (
            <button onClick={onAction} className="text-[11px] font-semibold text-blue-500 bg-blue-500/10 border border-blue-500/[0.22] rounded-[7px] px-2.5 py-1 cursor-pointer">
              {action || 'View all'}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

const CoachCard = DashCard;

/* ─── Mini avatar ───────────────────────────────────────────────── */
function MiniAvatar({ name, src, size = 30 }) {
  return (
    <div
      className="rounded-full shrink-0 bg-white/[0.08] border border-white/[0.04] flex items-center justify-center font-bold text-slate-400 overflow-hidden"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {src ? <img src={src} className="w-full h-full object-cover" alt="" /> : (name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

const CLASS_TYPE_COLORS = { hiit: HEX.red, yoga: HEX.green, strength: HEX.blue, spin: HEX.blue, boxing: HEX.red, cardio: HEX.amber, pilates: HEX.green, default: HEX.blue };
function classColor(cls) {
  const n = (cls?.class_type || cls?.name || '').toLowerCase();
  return CLASS_TYPE_COLORS[Object.keys(CLASS_TYPE_COLORS).find((k) => n.includes(k)) || 'default'];
}

/* ─── Mobile KPI strip ──────────────────────────────────────────── */
function MobileKpiStrip({ tab, isCoach, stats, posts, events, challenges, polls, coaches, classes, myClasses, allMemberships }) {
  const { todayCI = 0, activeThisWeek = 0, atRisk = 0, totalMembers = 0, newSignUps = 0, retentionRate = 0, monthChangePct = 0, activeThisMonth = 0 } = stats;
  let items;
  if (tab === 'overview') {
    items = [{ label: 'TODAY', value: todayCI, color: HEX.blue }, { label: 'WEEK', value: activeThisWeek, color: null }, { label: 'AT RISK', value: atRisk, color: atRisk > 0 ? HEX.red : null }, { label: 'MEMBERS', value: totalMembers, color: null }];
  } else if (tab === 'members') {
    items = [{ label: 'TOTAL', value: totalMembers, color: null }, { label: 'ACTIVE', value: activeThisWeek, color: null }, { label: 'AT RISK', value: atRisk, color: atRisk > 0 ? HEX.red : null }, { label: 'NEW', value: newSignUps, color: newSignUps > 0 ? HEX.green : null }];
  } else if (tab === 'content') {
    items = [{ label: 'POSTS', value: posts.length, color: null }, { label: 'EVENTS', value: events.length, color: null }, { label: 'CHALLENGES', value: challenges.length, color: null }, { label: 'POLLS', value: polls.length, color: null }];
  } else if (tab === 'analytics') {
    items = [{ label: 'RETENTION', value: retentionRate + '%', color: retentionRate >= 70 ? HEX.green : retentionRate >= 40 ? HEX.amber : HEX.red }, { label: '30-DAY Δ', value: (monthChangePct > 0 ? '+' : '') + monthChangePct + '%', color: monthChangePct > 0 ? HEX.green : monthChangePct < 0 ? HEX.red : null }, { label: 'ACTIVE', value: activeThisMonth, color: null }, { label: 'AT RISK', value: atRisk, color: atRisk > 0 ? HEX.red : null }];
  } else if (tab === 'engagement') {
    items = [{ label: 'MEMBERS', value: totalMembers, color: null }, { label: 'ACTIVE', value: activeThisWeek, color: null }, { label: 'AT RISK', value: atRisk, color: atRisk > 0 ? HEX.red : null }];
  } else if (tab === 'gym') {
    items = [{ label: 'COACHES', value: coaches.length, color: null }, { label: 'CLASSES', value: classes.length, color: null }, { label: 'MEMBERS', value: totalMembers, color: null }];
  } else if ((tab === 'today' || tab === 'schedule') && isCoach) {
    items = [{ label: 'CLASSES', value: myClasses.length, color: null }, { label: 'CLIENTS', value: allMemberships.length, color: null }];
  } else {
    return null;
  }
  return (
    <div className="shrink-0 bg-[#0a0f1e] border-b border-white/[0.04] flex">
      {items.map((item, i) =>
        <React.Fragment key={item.label}>
          {i > 0 && <div className="w-px bg-white/[0.05] self-stretch my-[7px]" />}
          <div className="flex-1 flex flex-col items-center justify-center py-[9px] px-0.5">
            <div className="text-[18px] font-extrabold tracking-[-0.04em] leading-none" style={{ color: item.color || '#f1f5f9' }}>{item.value}</div>
            <div className="text-[8px] font-bold uppercase tracking-[0.10em] text-[#2d3f55] mt-[3px]">{item.label}</div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

export default function GymOwnerDashboard() {
  const [tab, setTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const [selectedGym, setSelectedGym] = useState(null);
  const [gymOpen, setGymOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [showPoster, setShowPoster] = useState(false);
  const [chartRange, setChartRange] = useState(7);
  const [leaderboardView, setLeaderboardView] = useState('checkins');
  const [atRiskDays, setAtRiskDays] = useState(14);
  const [memberFilter, setMemberFilter] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSort, setMemberSort] = useState('recentlyActive');
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showChat, setShowChat] = useState(false);

  const openModal = useCallback((name) => {if (name === 'message') {setTab('members');return;}setModal(name);}, []);
  const closeModal = useCallback(() => setModal(null), []);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000 });
  const [selectedCoachId, setSelectedCoachId] = useState(null);

  const effectiveAccountType = selectedCoachId ? 'coach' : currentUser?.account_type;
  const isCoach = effectiveAccountType === 'coach';
  const isGymOwner = effectiveAccountType === 'gym_owner';
  const dashRole = isCoach ? 'coach' : 'gym_owner';
  const roleLabel = isCoach ? 'Coach' : 'Gym Owner';

  const tabInitialised = React.useRef(false);
  useEffect(() => {
    if (!tabInitialised.current && currentUser) {
      setTab(isCoach ? 'today' : 'overview');
      tabInitialised.current = true;
    }
  }, [currentUser, isCoach]);

  useEffect(() => {
    const h = () => base44.auth.logout();
    document.addEventListener('dash-logout', h);
    return () => document.removeEventListener('dash-logout', h);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (e.detail === 'addClient') {
        setTab('members');
        setTimeout(() => window.dispatchEvent(new CustomEvent('coachOpenAddClient')), 100);
      } else if (e.detail === 'bookClient') {
        openModal('classes');
      }
    };
    window.addEventListener('coachAction', h);
    return () => window.removeEventListener('coachAction', h);
  }, [openModal]);

  const handleRoleSelect = (roleId) => {
    if (roleId === 'gym_owner') {setSelectedCoachId(null);} else {setSelectedCoachId(roleId);}
    setTab(roleId === 'gym_owner' ? 'overview' : 'today');
  };

  const NAV = ALL_NAV.filter((item) => item.roles.includes(dashRole)).map((item) => ({
    ...item, label: isCoach && item.coachLabel ? item.coachLabel : item.label
  }));

  const { data: gyms = [], error: gymsError } = useQuery({
    queryKey: ['ownerGyms', currentUser?.email],
    queryFn: async () => {
      if (isCoach) {
        const coachRecords = await base44.entities.Coach.filter({ user_email: currentUser.email });
        if (!coachRecords.length) return [];
        const gymIds = [...new Set(coachRecords.map((c) => c.gym_id))];
        return base44.entities.Gym.filter({ id: { $in: gymIds } });
      }
      return base44.entities.Gym.filter({ owner_email: currentUser.email });
    },
    enabled: !!currentUser?.email, retry: 3, staleTime: 60 * 1000, refetchInterval: 60 * 1000, refetchIntervalInBackground: false
  });

  const myGyms = isCoach ? gyms : gyms.filter((g) => g.owner_email === currentUser?.email);
  const approvedGyms = myGyms.filter((g) => g.status === 'approved');
  const pendingGyms = isCoach ? [] : myGyms.filter((g) => g.status === 'pending');

  useEffect(() => {if (approvedGyms.length > 0 && !selectedGym) setSelectedGym(approvedGyms[0]);}, [approvedGyms, selectedGym]);

  const qo = { staleTime: 3 * 60 * 1000, placeholderData: (p) => p };
  const on = !!selectedGym;

  const { data: rewards = [] } = useQuery({ queryKey: ['rewards', selectedGym?.id], queryFn: () => base44.entities.Reward.filter({ gym_id: selectedGym.id }, 'title', 50), enabled: on, ...qo });
  const { data: classes = [] } = useQuery({ queryKey: ['classes', selectedGym?.id], queryFn: () => base44.entities.GymClass.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: coaches = [] } = useQuery({ queryKey: ['coaches', selectedGym?.id], queryFn: () => base44.entities.Coach.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: events = [] } = useQuery({ queryKey: ['events', selectedGym?.id], queryFn: () => base44.entities.Event.filter({ gym_id: selectedGym.id }, '-event_date', 50), enabled: on, ...qo });
  const { data: posts = [] } = useQuery({ queryKey: ['posts', selectedGym?.id], queryFn: () => base44.entities.Post.filter({ gym_id: selectedGym.id }, '-created_date', 20), enabled: on, ...qo });
  const { data: challenges = [] } = useQuery({ queryKey: ['challenges', selectedGym?.id], queryFn: () => base44.entities.Challenge.filter({ gym_id: selectedGym.id }, '-created_date', 50), enabled: on, ...qo });
  const { data: polls = [] } = useQuery({ queryKey: ['polls', selectedGym?.id], queryFn: () => base44.entities.Poll.filter({ gym_id: selectedGym.id, status: 'active' }, '-created_date'), enabled: on, ...qo });

  const { data: coachBookings = [] } = useQuery({ queryKey: ['coachBookings', selectedGym?.id], queryFn: () => base44.entities.Booking.filter({ gym_id: selectedGym.id }, '-session_date', 300), enabled: on && isCoach, staleTime: 2 * 60 * 1000 });
  const { data: coachAssignedWorkouts = [] } = useQuery({
    queryKey: ['coachAssignedWorkouts', selectedGym?.id, selectedCoachId],
    queryFn: async () => {
      const coachList = await base44.entities.Coach.filter({ gym_id: selectedGym.id });
      const me = coachList.find((c) => selectedCoachId ? c.id === selectedCoachId : c.user_email === currentUser?.email);
      if (!me) return [];
      return base44.entities.AssignedWorkout.filter({ coach_id: me.id }, '-assigned_date', 300);
    },
    enabled: on && isCoach, staleTime: 2 * 60 * 1000
  });

  const { data: stats = {} } = useQuery({
    queryKey: ['dashboardStats', selectedGym?.id, atRiskDays, chartRange],
    queryFn: () => base44.functions.invoke('getDashboardStats', { gymId: selectedGym.id, atRiskDays, chartRange }).then((r) => r.data),
    enabled: on, staleTime: 3 * 60 * 1000, placeholderData: (p) => p
  });

  const checkIns = stats.recentCheckIns || [];
  const recentActivity = stats.recentActivity || [];
  const allMemberships = stats.membersWithActivity || [];
  const effectiveMemberships = allMemberships;

  const inv = useCallback((...keys) => {keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k, selectedGym?.id] }));queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedGym?.id] });}, [queryClient, selectedGym?.id]);
  const invGyms = useCallback(() => queryClient.invalidateQueries({ queryKey: ['gyms'] }), [queryClient]);
  const onErr = useCallback((e) => toast.error(e?.message || 'Something went wrong'), []);

  const createRewardM = useMutation({ mutationFn: (d) => base44.entities.Reward.create(d), onSuccess: () => inv('rewards'), onError: onErr });
  const deleteRewardM = useMutation({ mutationFn: (id) => base44.entities.Reward.delete(id), onSuccess: () => inv('rewards'), onError: onErr });
  const createClassM = useMutation({ mutationFn: (d) => base44.entities.GymClass.create(d), onSuccess: () => inv('classes'), onError: onErr });
  const deleteClassM = useMutation({ mutationFn: (id) => base44.entities.GymClass.delete(id), onSuccess: () => inv('classes'), onError: onErr });
  const updateClassM = useMutation({ mutationFn: ({ id, data }) => base44.entities.GymClass.update(id, data), onSuccess: () => inv('classes'), onError: onErr });
  const createCoachM = useMutation({ mutationFn: (d) => base44.entities.Coach.create(d), onSuccess: () => inv('coaches'), onError: onErr });
  const deleteCoachM = useMutation({ mutationFn: (id) => base44.entities.Coach.delete(id), onSuccess: () => inv('coaches'), onError: onErr });
  const updateCoachM = useMutation({ mutationFn: ({ id, data }) => base44.entities.Coach.update(id, data), onSuccess: () => inv('coaches'), onError: onErr });
  const updateGalleryM = useMutation({ mutationFn: (g) => base44.entities.Gym.update(selectedGym.id, { gallery: g }), onSuccess: () => {invGyms();closeModal();}, onError: onErr });
  const updateGymM = useMutation({ mutationFn: (d) => base44.entities.Gym.update(selectedGym.id, d), onSuccess: () => {invGyms();closeModal();}, onError: onErr });
  const createEventM = useMutation({ mutationFn: (d) => base44.entities.Event.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, attendees: 0 }), onSuccess: () => {inv('events');closeModal();}, onError: onErr });
  const createChallengeM = useMutation({ mutationFn: (d) => base44.entities.Challenge.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, participants: [], status: 'upcoming' }), onSuccess: () => {inv('challenges');closeModal();}, onError: onErr });
  const banMemberM = useMutation({ mutationFn: (uid) => base44.functions.invoke('manageMember', { memberId: uid, gymId: selectedGym.id, action: 'ban' }), onSuccess: invGyms, onError: onErr });
  const unbanMemberM = useMutation({ mutationFn: (uid) => base44.functions.invoke('manageMember', { memberId: uid, gymId: selectedGym.id, action: 'unban' }), onSuccess: invGyms, onError: onErr });
  const deleteGymM = useMutation({ mutationFn: () => base44.functions.invoke('deleteGym', { gymId: selectedGym.id }), onSuccess: () => {invGyms();closeModal();window.location.href = createPageUrl('Gyms');}, onError: onErr });
  const deleteAccountM = useMutation({ mutationFn: () => base44.functions.invoke('deleteUserAccount'), onSuccess: () => {closeModal();base44.auth.logout();}, onError: onErr });
  const createPollM = useMutation({ mutationFn: (d) => base44.entities.Poll.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, created_by: currentUser.id, voters: [] }), onSuccess: () => {inv('polls');closeModal();}, onError: onErr });
  const deletePostM = useMutation({ mutationFn: (id) => base44.entities.Post.delete(id), onSuccess: () => inv('posts'), onError: onErr });
  const deleteEventM = useMutation({ mutationFn: (id) => base44.entities.Event.delete(id), onSuccess: () => inv('events'), onError: onErr });
  const deleteChallengeM = useMutation({ mutationFn: (id) => base44.entities.Challenge.delete(id), onSuccess: () => inv('challenges'), onError: onErr });
  const deletePollM = useMutation({ mutationFn: (id) => base44.entities.Poll.delete(id), onSuccess: () => inv('polls'), onError: onErr });

  const now = new Date();

  const memberUserIds = useMemo(() => {
    const ids = new Set();
    (allMemberships || []).forEach((m) => {if (m.user_id) ids.add(m.user_id);});
    checkIns.forEach((c) => {if (c.user_id) ids.add(c.user_id);});
    recentActivity.forEach((a) => {if (a.user_id) ids.add(a.user_id);});
    return [...ids].slice(0, 100);
  }, [allMemberships, checkIns, recentActivity]);

  const { data: memberUserRecords = [] } = useQuery({
    queryKey: ['memberUserRecords', selectedGym?.id, memberUserIds.join(',')],
    queryFn: () => base44.entities.User.filter({ id: { $in: memberUserIds } }),
    enabled: !!selectedGym && memberUserIds.length > 0,
    staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000
  });

  const memberAvatarMapResolved = useMemo(() => {
    const map = {};
    (allMemberships || []).forEach((m) => {if (m.user_id && m.avatar_url) map[m.user_id] = m.avatar_url;});
    memberUserRecords.forEach((u) => {if (u.id && u.avatar_url) map[u.id] = u.avatar_url;});
    if (currentUser?.id && currentUser.avatar_url) map[currentUser.id] = currentUser.avatar_url;
    return map;
  }, [allMemberships, memberUserRecords, currentUser]);

  const memberNameMap = useMemo(() => {
    const map = {};
    (allMemberships || []).forEach((m) => {if (m.user_id && m.user_name) map[m.user_id] = m.user_name;});
    checkIns.forEach((c) => {if (c.user_id && c.user_name) map[c.user_id] = c.user_name;});
    recentActivity.forEach((a) => {if (a.user_id && a.name) map[a.user_id] = a.name;});
    memberUserRecords.forEach((u) => {if (u.id) {const name = u.display_name || (u.username ? u.username : null) || u.full_name;if (name) map[u.id] = name;}});
    if (currentUser?.id) {const name = currentUser.display_name || currentUser.username || currentUser.full_name;if (name) map[currentUser.id] = name;}
    return map;
  }, [allMemberships, checkIns, recentActivity, memberUserRecords, currentUser]);

  const {
    todayCI = 0, yesterdayCI = 0, todayVsYest = 0,
    activeThisWeek = 0, weeklyChangePct = 0,
    activeThisMonth = 0, totalMembers = 0, retentionRate = 0,
    monthChangePct = 0, monthCiPer = [],
    newSignUps = 0, cancelledEst = 0,
    atRisk = 0, atRiskMembersData: atRiskMembersList = [],
    memberLastCheckIn = {},
    sparkData7 = [], monthGrowthData = [],
    peakLabel = null, peakEndLabel = null, peakEntry = null,
    satVsAvg = 0, chartDays = [], streaks = [],
    avatarMap = {},
    weekTrend = [], peakHours = [], busiestDays = [],
    returnRate = 0, dailyAvg = 0, engagementSegments = {},
    retentionFunnel = [], dropOffBuckets = [], churnSignals = [], week1ReturnTrend = [],
    retentionBreakdown = {}, week1ReturnRate = {}, newNoReturnCount = 0,
    ci7Count = 0, ci7pCount = 0, weeklyTrendCoach = 0, monthlyTrendCoach = 0,
    returningCount = 0, newMembersThis30 = 0,
    weeklyChart = [], monthlyChart = [],
    engagementSegmentsCoach = {}, weekSpark = []
  } = stats;

  const ci30 = [];
  const avatarMapFull = useMemo(() => {
    return { ...avatarMap, ...memberAvatarMapResolved };
  }, [avatarMap, memberAvatarMapResolved]);

  const activeCoachRecord = useMemo(() => {
    if (!isCoach) return null;
    if (selectedCoachId) return coaches.find((c) => c.id === selectedCoachId) || null;
    return coaches.find((c) => c.user_email === currentUser?.email) || null;
  }, [isCoach, selectedCoachId, coaches, currentUser]);

  const myClasses = useMemo(() => {
    if (!isCoach) return classes;
    if (activeCoachRecord) return classes.filter((c) => c.coach_id === activeCoachRecord.id || c.instructor === activeCoachRecord.name || c.coach_name === activeCoachRecord.name || c.coach_email === activeCoachRecord.user_email);
    return classes.filter((c) => c.instructor === currentUser?.full_name || c.instructor === currentUser?.email || c.coach_name === currentUser?.full_name || c.coach_email === currentUser?.email || c.coach_id === currentUser?.id);
  }, [classes, currentUser, isCoach, activeCoachRecord]);

  const coachMemberships = useMemo(() => {
    if (!isCoach) return allMemberships;
    const bookedClientIds = new Set(coachBookings.map(b => b.client_id).filter(Boolean));
    if (bookedClientIds.size > 0) {
      return allMemberships.filter(m => bookedClientIds.has(m.user_id));
    }
    if (activeCoachRecord?.client_notes) {
      const ids = Object.keys(activeCoachRecord.client_notes);
      if (ids.length > 0) return allMemberships.filter(m => ids.includes(m.user_id));
    }
    return allMemberships;
  }, [isCoach, activeCoachRecord, allMemberships, coachBookings]);

  const coachCheckIns = useMemo(() => {
    if (!isCoach || !activeCoachRecord) return checkIns;
    const clientIds = activeCoachRecord.client_notes ? Object.keys(activeCoachRecord.client_notes) : null;
    if (clientIds && clientIds.length > 0) return checkIns.filter((c) => clientIds.includes(c.user_id));
    return checkIns;
  }, [isCoach, activeCoachRecord, checkIns]);

  const coachCi30 = [];
  const coachUserId = activeCoachRecord ? activeCoachRecord.id : currentUser?.id;
  const coachPosts = isCoach ? posts.filter((p) => p.author_id === coachUserId || p.created_by === coachUserId || !p.author_id) : posts;
  const coachEvents = isCoach ? events.filter((e) => e.created_by === coachUserId || e.coach_id === coachUserId || !e.created_by) : events;
  const coachChallenges = isCoach ? challenges.filter((c) => c.created_by === coachUserId || c.coach_id === coachUserId || !c.created_by) : challenges;
  const coachPolls = isCoach ? polls.filter((p) => p.created_by === coachUserId || !p.created_by) : polls;

  const priorities = [
    atRisk > 0 && { icon: AlertCircle, color: HEX.red, label: `${atRisk} members inactive 14+ days`, action: 'View members', fn: () => setTab('members') },
    !challenges.some((c) => c.status === 'active') && { icon: Trophy, color: HEX.amber, label: 'No active challenge running', action: 'Create one', fn: () => openModal('challenge') },
    polls.length === 0 && { icon: BarChart2, color: HEX.amber, label: 'No active polls', action: 'Create poll', fn: () => openModal('poll') },
    monthChangePct < 0 && { icon: TrendingDown, color: HEX.amber, label: 'Attendance down vs last month', action: 'View analytics', fn: () => setTab('analytics') }]
    .filter(Boolean).slice(0, 4);

  const tabPanels = NAV.map((item) => {
    let content = null;
    if (item.id === 'overview' && !isCoach) {
      content = <TabOverview todayCI={todayCI} yesterdayCI={yesterdayCI} todayVsYest={todayVsYest} activeThisWeek={activeThisWeek} totalMembers={totalMembers} retentionRate={retentionRate} newSignUps={newSignUps} monthChangePct={monthChangePct} ciPrev30={[]} atRisk={atRisk} sparkData={sparkData7} monthGrowthData={monthGrowthData} cancelledEst={cancelledEst} peakLabel={peakLabel} peakEndLabel={peakEndLabel} peakEntry={peakEntry} satVsAvg={satVsAvg} monthCiPer={monthCiPer} checkIns={checkIns} allMemberships={effectiveMemberships} challenges={challenges} posts={posts} polls={polls} classes={classes} coaches={coaches} streaks={streaks} recentActivity={recentActivity} chartDays={chartDays} chartRange={chartRange} setChartRange={setChartRange} avatarMap={memberAvatarMapResolved} nameMap={memberNameMap} priorities={priorities} selectedGym={selectedGym} now={now} openModal={openModal} setTab={setTab} Spark={Spark} Delta={Delta} retentionBreakdown={retentionBreakdown} week1ReturnRate={week1ReturnRate} newNoReturnCount={newNoReturnCount} />;
    } else if (item.id === 'today' && isCoach) {
      content = <TabCoachToday allMemberships={coachMemberships} checkIns={coachCheckIns} myClasses={myClasses} currentUser={currentUser} openModal={openModal} setTab={setTab} now={now} />;
    } else if (item.id === 'schedule' && isCoach) {
      content = <TabCoachSchedule myClasses={myClasses} checkIns={coachCheckIns} events={coachEvents} challenges={coachChallenges} allMemberships={coachMemberships} avatarMap={avatarMapFull} openModal={openModal} now={now} />;
    } else if (item.id === 'members') {
      content = isCoach ?
        <TabCoachMembers openModal={openModal} coach={activeCoachRecord} bookings={coachBookings} checkIns={coachCheckIns} avatarMap={avatarMapFull} now={now} /> :
        <TabMembersComponent allMemberships={effectiveMemberships} checkIns={checkIns} ci30={ci30} memberLastCheckIn={memberLastCheckIn} selectedGym={selectedGym} atRisk={atRisk} atRiskMembersList={atRiskMembersList} retentionRate={retentionRate} totalMembers={totalMembers} activeThisWeek={activeThisWeek} newSignUps={newSignUps} weeklyChangePct={weeklyChangePct} avatarMap={avatarMapFull} memberFilter={memberFilter} setMemberFilter={setMemberFilter} memberSearch={memberSearch} setMemberSearch={setMemberSearch} memberSort={memberSort} setMemberSort={setMemberSort} memberPage={memberPage} setMemberPage={setMemberPage} memberPageSize={memberPageSize} selectedRows={selectedRows} setSelectedRows={setSelectedRows} openModal={openModal} now={now} Spark={Spark} Delta={Delta} />;
    } else if (item.id === 'content') {
      content = isCoach ?
        <TabCoachContent bookings={coachBookings} assignedWorkouts={coachAssignedWorkouts} events={coachEvents} challenges={coachChallenges} polls={coachPolls} posts={coachPosts} classes={myClasses} checkIns={coachCheckIns} ci30={coachCi30} avatarMap={avatarMapFull} allMemberships={coachMemberships} openModal={openModal} now={now} onDeletePost={(id) => deletePostM.mutate(id)} onDeleteEvent={(id) => deleteEventM.mutate(id)} onDeleteChallenge={(id) => deleteChallengeM.mutate(id)} onDeleteClass={(id) => deleteClassM.mutate(id)} onDeletePoll={(id) => deletePollM.mutate(id)} /> :
        <TabContentComponent events={events} challenges={challenges} polls={polls} posts={posts} classes={classes} checkIns={checkIns} ci30={ci30} avatarMap={avatarMapFull} currentUser={currentUser} leaderboardView={leaderboardView} setLeaderboardView={setLeaderboardView} openModal={openModal} now={now} onDeletePost={(id) => deletePostM.mutate(id)} onDeleteEvent={(id) => deleteEventM.mutate(id)} onDeleteChallenge={(id) => deleteChallengeM.mutate(id)} onDeleteClass={(id) => deleteClassM.mutate(id)} onDeletePoll={(id) => deletePollM.mutate(id)} />;
    } else if (item.id === 'analytics') {
      content = isCoach ?
        <TabCoachAnalytics ci30Count={allMemberships.reduce((s, m) => s + (m.ci30Count || 0), 0)} totalMembers={coachMemberships.length} myClasses={myClasses} monthChangePct={monthChangePct} retentionRate={retentionRate} activeThisMonth={activeThisMonth} atRisk={atRisk} gymId={selectedGym?.id} ci7Count={ci7Count} ci7pCount={ci7pCount} weeklyTrendCoach={weeklyTrendCoach} monthlyTrendCoach={monthlyTrendCoach} returningCount={returningCount} newMembersThis30={newMembersThis30} weeklyChart={weeklyChart} monthlyChart={monthlyChart} engagementSegmentsCoach={engagementSegmentsCoach} weekSpark={weekSpark} peakHours={peakHours} busiestDays={busiestDays} memberships={coachMemberships} checkIns={coachCheckIns} now={now} /> :
        <TabAnalyticsComponent checkIns={checkIns} ci30={ci30} totalMembers={totalMembers} monthCiPer={monthCiPer} monthChangePct={monthChangePct} monthGrowthData={monthGrowthData} retentionRate={retentionRate} activeThisMonth={activeThisMonth} newSignUps={newSignUps} atRisk={atRisk} gymId={selectedGym?.id} allMemberships={allMemberships} classes={classes} coaches={coaches} avatarMap={avatarMapFull} sparkData={sparkData7} Spark={Spark} Delta={Delta} weekTrend={weekTrend} peakHours={peakHours} busiestDays={busiestDays} returnRate={returnRate} dailyAvg={dailyAvg} engagementSegments={engagementSegments} retentionFunnel={retentionFunnel} dropOffBuckets={dropOffBuckets} churnSignals={churnSignals} week1ReturnTrend={week1ReturnTrend} />;
    } else if (item.id === 'profile' && isCoach) {
      content = <TabCoachProfile selectedGym={selectedGym} currentUser={currentUser} />;
    } else if (item.id === 'engagement') {
      content = <TabEngagement selectedGym={selectedGym} allMemberships={effectiveMemberships} atRisk={atRisk} totalMembers={totalMembers} />;
    } else if (item.id === 'gym') {
      content = <TabGym selectedGym={selectedGym} classes={classes} coaches={coaches} openModal={openModal} checkIns={checkIns} allMemberships={allMemberships} atRisk={atRisk} retentionRate={retentionRate} rewards={rewards} onCreateReward={(d) => createRewardM.mutate(d)} onDeleteReward={(id) => deleteRewardM.mutate(id)} isLoading={createRewardM.isPending} />;
    }
    return { id: item.id, content };
  }).filter((p) => p.content !== null);

  /* ── Splash screen (loading / error states) ── */
  const Splash = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center bg-[#050810]">
      <div className="bg-[#0a0f1e] border border-white/[0.04] rounded-2xl p-9 max-w-[380px] w-full text-center">
        {children}
      </div>
    </div>
  );

  if (gymsError) return (
    <Splash>
      <X className="w-[26px] h-[26px] text-red-500 mx-auto mb-3" />
      <h2 className="text-slate-100 font-extrabold mb-2 tracking-[-0.03em]">Connection Error</h2>
      <p className="text-slate-600 text-[13px] mb-5">{gymsError.message}</p>
      <button onClick={() => window.location.reload()} className="bg-blue-500 text-white border-none rounded-[9px] px-5 py-2.5 font-bold cursor-pointer">Retry</button>
    </Splash>
  );

  if (approvedGyms.length === 0 && pendingGyms.length > 0) return (
    <Splash>
      <Clock className="w-[26px] h-[26px] text-amber-500 mx-auto mb-3" />
      <h2 className="text-slate-100 font-extrabold mb-2 tracking-[-0.03em]">Pending Approval</h2>
      <p className="text-slate-600 text-[13px] mb-5">Your gym <strong className="text-slate-100">{pendingGyms[0].name}</strong> is under review. We'll notify you once it's approved.</p>
      <Link to={createPageUrl('Home')}><button className="bg-white/[0.06] text-slate-100 border border-white/[0.04] rounded-[9px] px-5 py-2.5 font-bold cursor-pointer">Back to Home</button></Link>
    </Splash>
  );

  if (myGyms.length === 0 && !isCoach) return (
    <Splash>
      <Dumbbell className="w-[26px] h-[26px] text-blue-500 mx-auto mb-3" />
      <h2 className="text-slate-100 font-extrabold mb-2 tracking-[-0.03em]">No Gyms Yet</h2>
      <p className="text-slate-600 text-[13px] mb-5">Register your gym to get started with the dashboard.</p>
      <Link to={createPageUrl('GymSignup')}><button className="bg-blue-500 text-white border-none rounded-[9px] px-5 py-2.5 font-bold cursor-pointer">Register Your Gym</button></Link>
    </Splash>
  );

  const sharedModals = (
    <>
      <ManageClassesModal open={modal === 'classes'} onClose={closeModal} classes={classes} onCreateClass={(d) => createClassM.mutate(d)} onUpdateClass={(id, data) => updateClassM.mutate({ id, data })} onDeleteClass={(id) => deleteClassM.mutate(id)} gym={selectedGym} isLoading={createClassM.isPending || updateClassM.isPending} />
      <CreateGymOwnerPostModal open={modal === 'post'} onClose={closeModal} gym={selectedGym} onSuccess={() => inv('posts')} />
      <CreateEventModal open={modal === 'event'} onClose={closeModal} onSave={(d) => createEventM.mutate(d)} gym={selectedGym} isLoading={createEventM.isPending} />
      <CreateChallengeModal open={modal === 'challenge'} onClose={closeModal} gyms={gyms} onSave={(d) => createChallengeM.mutate(d)} isLoading={createChallengeM.isPending} />
      <QRScanner open={modal === 'qrScanner'} onClose={closeModal} />
      <CreatePollModal open={modal === 'poll'} onClose={closeModal} onSave={(d) => createPollM.mutate(d)} isLoading={createPollM.isPending} />
      <ManageRewardsModal open={modal === 'rewards'} onClose={closeModal} rewards={rewards} onCreateReward={(d) => createRewardM.mutate(d)} onDeleteReward={(id) => deleteRewardM.mutate(id)} gym={selectedGym} isLoading={createRewardM.isPending} />
      <ManageCoachesModal open={modal === 'coaches'} onClose={closeModal} coaches={coaches} onCreateCoach={(d) => createCoachM.mutate(d)} onDeleteCoach={(id) => deleteCoachM.mutate(id)} onUpdateCoach={(id, data) => updateCoachM.mutate({ id, data })} gym={selectedGym} isLoading={createCoachM.isPending} allMemberships={allMemberships} classes={classes} />
      <EditGymPhotoModal open={modal === 'heroPhoto'} onClose={closeModal} gym={selectedGym} onSave={(url) => updateGymM.mutate({ image_url: url })} isLoading={updateGymM.isPending} />
      <ManageGymPhotosModal open={modal === 'photos'} onClose={closeModal} gallery={selectedGym?.gallery || []} onSave={(g) => updateGalleryM.mutate(g)} isLoading={updateGalleryM.isPending} />
      <ManageMembersModal open={modal === 'members'} onClose={closeModal} gym={selectedGym} onBanMember={(id) => banMemberM.mutate(id)} onUnbanMember={(id) => unbanMemberM.mutate(id)} />
      <ManageEquipmentModal open={modal === 'equipment'} onClose={closeModal} equipment={selectedGym?.equipment || []} onSave={(e) => updateGymM.mutate({ equipment: e })} isLoading={updateGymM.isPending} />
      <ManageAmenitiesModal open={modal === 'amenities'} onClose={closeModal} amenities={selectedGym?.amenities || []} onSave={(a) => updateGymM.mutate({ amenities: a })} isLoading={updateGymM.isPending} />
      <EditBasicInfoModal open={modal === 'editInfo'} onClose={closeModal} gym={selectedGym} onSave={(d) => updateGymM.mutate(d)} isLoading={updateGymM.isPending} />
      <EditGymLogoModal open={modal === 'logo'} onClose={closeModal} currentLogoUrl={selectedGym?.logo_url} onSave={(url) => updateGymM.mutate({ logo_url: url })} isLoading={updateGymM.isPending} />
      <EditPricingModal open={modal === 'pricing'} onClose={closeModal} gym={selectedGym} onSave={(d) => updateGymM.mutate(d)} isLoading={updateGymM.isPending} />

      <AlertDialog open={modal === 'deleteGym'} onOpenChange={(v) => !v && closeModal()}>
        <AlertDialogContent className="bg-[#0a0f1e] backdrop-blur-xl border border-red-500/[0.22] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100 flex items-center gap-2 text-[15px] font-extrabold">
              <Trash2 className="w-4 h-4 text-red-500" /> Delete Gym Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-[13px]">
              Deletes <strong className="text-slate-100">{selectedGym?.name}</strong> and all its data. <span className="text-red-500 font-bold">This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.05] text-slate-100 border border-white/[0.04]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteGymM.mutate()} disabled={deleteGymM.isPending} className="bg-red-500 text-white border-none">
              {deleteGymM.isPending ? 'Deleting…' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={modal === 'deleteAccount'} onOpenChange={(v) => !v && closeModal()}>
        <AlertDialogContent className="bg-[#0a0f1e] backdrop-blur-xl border border-red-500/[0.22] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100 flex items-center gap-2 text-[15px] font-extrabold">
              <Trash2 className="w-4 h-4 text-red-500" /> Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-[13px]">
              Deletes your account, all gyms, and personal data. <span className="text-red-500 font-bold">This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.05] text-slate-100 border border-white/[0.04]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAccountM.mutate()} disabled={deleteAccountM.isPending} className="bg-red-500 text-white border-none">
              {deleteAccountM.isPending ? 'Deleting…' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GymJoinPoster gym={selectedGym} open={showPoster} onClose={() => setShowPoster(false)} />
      <MemberChatPanel open={showChat} onClose={() => setShowChat(false)} allMemberships={allMemberships} currentUser={currentUser} avatarMap={memberAvatarMapResolved} />
    </>
  );

  // ── MOBILE ────────────────────────────────────────────────────────────────
  if (isMobile) return (
    <div className="flex flex-col bg-[#050810] overflow-hidden" style={{ height: '100dvh' }}>
      <header className="shrink-0 bg-[#050810] border-b border-white/[0.04] px-3.5 py-[10px] flex items-center justify-between">
        <div className="flex items-center gap-[9px]">
          <div className="w-[30px] h-[30px] rounded-lg bg-[#0a0f1e] border border-white/[0.04] flex items-center justify-center">
            <Dumbbell className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-slate-100 tracking-[-0.02em] leading-none">{selectedGym?.name || 'Dashboard'}</div>
            <div className="text-[9px] text-slate-600 font-semibold uppercase tracking-[0.08em] mt-0.5">{roleLabel}</div>
          </div>
        </div>
        <div className="flex gap-1.5 items-center">
          {atRisk > 0 && (
            <button onClick={() => setTab('members')} className="bg-red-500/[0.08] text-red-500 border border-red-500/[0.22] rounded-full text-[10px] font-bold py-1 px-[9px] cursor-pointer flex items-center gap-[3px]">
              <AlertTriangle className="w-[9px] h-[9px]" />{atRisk}
            </button>
          )}
          <button onClick={() => openModal('qrScanner')} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/[0.04] text-slate-600 cursor-pointer">
            <QrCode className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => openModal('post')} className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500 border-none text-white cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <MobileKpiStrip tab={tab} isCoach={isCoach} stats={stats} posts={posts} events={events} challenges={challenges} polls={polls} coaches={coaches} classes={classes} myClasses={myClasses} allMemberships={effectiveMemberships} />

      <main className="flex-1 overflow-auto px-3 pt-3 pb-20" style={{ WebkitOverflowScrolling: 'touch' }}>
        <Suspense fallback={<TabLoader />}>
          {tabPanels.map((p) => (
            <div key={p.id} style={{ display: p.id === tab ? 'block' : 'none' }}>{p.content}</div>
          ))}
        </Suspense>
      </main>

      <nav className="shrink-0 bg-[#050810] border-t border-white/[0.04] flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map((item) => {
          const active = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-[3px] pt-[11px] pb-[9px] border-none cursor-pointer relative transition-[color,background] duration-150',
                active ? 'bg-blue-500/[0.06] text-blue-500' : 'bg-transparent text-[#2d3f55]'
              )}>
              {active && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-blue-500 rounded-b-[2px]" />}
              <item.icon className="w-[18px] h-[18px]" />
              <span className={cn('text-[9px] tracking-[0.03em]', active ? 'font-bold' : 'font-medium')}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      {sharedModals}
    </div>
  );

  // ── DESKTOP ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#050810]">

      {/* ── SIDEBAR ── */}
      <aside
        className="shrink-0 h-full overflow-hidden bg-[#050810] border-r border-white/[0.04] flex flex-col transition-[width] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ width: collapsed ? 56 : 220 }}
      >
        {/* Gym header */}
        <div className={cn('border-b border-white/[0.04] shrink-0', collapsed ? 'py-[13px] px-0' : 'py-[13px] px-3.5')}>
          {collapsed ? (
            <div className="flex justify-center">
              <button onClick={() => setCollapsed(false)}
                className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center bg-transparent border-none text-slate-600 cursor-pointer hover:text-slate-100 transition-colors duration-[120ms]">
                <Menu className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-[10px]">
              <div className="w-[34px] h-[34px] rounded-full shrink-0 bg-[#0a0f1e] border-2 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.45)] flex items-center justify-center overflow-hidden">
                {selectedGym?.logo_url || selectedGym?.image_url
                  ? <img src={selectedGym.logo_url || selectedGym.image_url} alt="" className="w-full h-full object-cover" />
                  : <Dumbbell className="w-3.5 h-3.5 text-blue-500" />
                }
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-slate-100 overflow-hidden text-ellipsis whitespace-nowrap tracking-[-0.02em]">
                  {selectedGym?.name || 'Dashboard'}
                </div>
                <div className="text-[9px] text-slate-600 font-semibold uppercase tracking-[0.08em] mt-0.5">
                  {roleLabel}
                </div>
              </div>
              <button onClick={() => setCollapsed(true)}
                className="shrink-0 w-[26px] h-[26px] rounded-[6px] flex items-center justify-center bg-transparent border-none text-slate-600 cursor-pointer hover:text-slate-100 transition-colors duration-[120ms]">
                <Menu className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Gym switcher */}
          {!collapsed && approvedGyms.length > 1 && (
            <div className="relative mt-2.5">
              <button onClick={() => setGymOpen((o) => !o)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-slate-400 text-[11px] font-semibold cursor-pointer">
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">{selectedGym?.name}</span>
                <ChevronDown className={cn('w-[11px] h-[11px] shrink-0 transition-transform duration-[180ms]', gymOpen && 'rotate-180')} />
              </button>
              {gymOpen && (
                <div className="absolute left-0 right-0 top-[110%] rounded-[10px] overflow-hidden bg-[#060c18] border border-white/[0.07] z-20 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
                  {approvedGyms.map((g) => (
                    <button key={g.id} onClick={() => { setSelectedGym(g); setGymOpen(false); }}
                      className={cn('w-full text-left px-3 py-[9px] text-[12px] font-semibold border-none cursor-pointer', selectedGym?.id === g.id ? 'bg-blue-500/10 text-blue-500' : 'bg-transparent text-slate-400')}>
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {!collapsed && (
            <div className="text-[9px] font-bold text-[#2d3f55] uppercase tracking-[0.10em] px-4 mb-1">Navigation</div>
          )}
          {NAV.map((item) => {
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={cn(
                  'flex items-center w-full border-none cursor-pointer border-l-2 rounded-r-[8px] text-[13px] font-medium mb-px',
                  'transition-[background,color,border-color] duration-[120ms]',
                  active
                    ? 'bg-blue-500/[0.08] text-blue-500 border-l-blue-500 font-bold'
                    : 'bg-transparent text-slate-600 border-l-transparent hover:bg-white/[0.03] hover:text-slate-400'
                )}
                style={{ gap: collapsed ? 0 : 9, padding: collapsed ? '10px 0' : '8px 14px', justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Upgrade prompt */}
        {!collapsed && isGymOwner && (
          <div className="px-2.5 pb-2.5 shrink-0">
            <Link to={createPageUrl('Plus')}>
              <div className="px-[13px] py-[11px] rounded-[10px] bg-white/[0.03] border border-white/[0.04] cursor-pointer hover:border-white/[0.07] transition-colors duration-150">
                <div className="flex items-center gap-[7px] mb-0.5">
                  <Crown className="w-[11px] h-[11px] text-slate-600" />
                  <span className="text-[11px] font-bold text-slate-400">Retention Pro</span>
                </div>
                <div className="text-[10px] text-[#2d3f55]">Advanced analytics · From £49.99/mo</div>
              </div>
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.04]">
          {!collapsed && (
            <div className="px-2.5 pt-2.5 pb-1">
              <div className="text-[9px] font-bold text-[#2d3f55] uppercase tracking-[0.08em] mb-1 pl-1">Links</div>
              {[
                { icon: Eye, label: 'View Gym Page', to: createPageUrl('GymCommunity') + '?id=' + selectedGym?.id },
                { icon: Users, label: 'Member View', to: createPageUrl('Home') }
              ].map((l, i) => (
                <Link key={i} to={l.to}>
                  <button className="w-full flex items-center gap-2 px-2 py-[7px] border-none bg-transparent text-[#2d3f55] text-[12px] font-medium cursor-pointer rounded-[7px] mb-px hover:text-slate-400 transition-colors duration-[120ms]">
                    <l.icon className="w-3 h-3" /><span>{l.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          )}
          {collapsed && (
            <div className="py-2">
              {[
                { icon: Eye, to: createPageUrl('GymCommunity') + '?id=' + selectedGym?.id },
                { icon: Users, to: createPageUrl('Home') }
              ].map((l, i) => (
                <Link key={i} to={l.to}>
                  <button className="w-full flex justify-center py-[9px] border-none bg-transparent text-[#2d3f55] cursor-pointer hover:text-slate-400 transition-colors duration-[120ms]">
                    <l.icon className="w-[13px] h-[13px]" />
                  </button>
                </Link>
              ))}
            </div>
          )}
          <div className={cn('pb-[14px]', collapsed ? 'px-0 pt-1' : 'px-2.5 pt-0')}>
            <button onClick={() => base44.auth.logout()}
              className={cn(
                'w-full flex items-center gap-2 border-none bg-transparent text-red-500 text-[12px] font-semibold cursor-pointer rounded-[7px] opacity-60 hover:opacity-100 transition-opacity duration-[120ms]',
                collapsed ? 'justify-center py-[9px] px-0' : 'justify-start py-[7px] px-2'
              )}>
              <LogOut className="w-[13px] h-[13px]" />
              {!collapsed && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOP BAR ── */}
        <header className="h-[54px] shrink-0 flex items-center justify-between px-5 bg-[#050810] border-b border-white/[0.04]">
          <div className="text-[13px] font-semibold text-slate-400 tracking-[-0.01em]">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>

          <div className="flex items-center gap-1.5">
            {isGymOwner && selectedGym?.join_code && (
              <button onClick={() => setShowPoster(true)}
                className="flex items-center gap-1.5 px-[11px] py-[5px] rounded-[7px] bg-white/[0.03] border border-white/[0.04] text-slate-400 text-[11px] font-semibold cursor-pointer hover:border-white/[0.07] transition-colors">
                <QrCode className="w-[11px] h-[11px]" />
                <span className="font-mono tracking-[0.10em]">{selectedGym.join_code}</span>
              </button>
            )}

            {atRisk > 0 && (
              <button onClick={() => setTab('members')}
                className="bg-red-500/[0.08] text-red-500 border border-red-500/[0.22] rounded-full text-[11px] font-bold py-[5px] px-[11px] cursor-pointer flex items-center gap-1">
                <AlertTriangle className="w-[11px] h-[11px]" />{atRisk} at risk
              </button>
            )}

            <button onClick={() => openModal('qrScanner')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-400 border border-white/[0.04] text-[12px] font-semibold cursor-pointer hover:text-slate-100 hover:border-white/[0.07] transition-all">
              <QrCode className="w-3 h-3" /> Scan QR
            </button>

            <button onClick={() => openModal('post')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white border-none text-[12px] font-bold cursor-pointer hover:opacity-90 transition-opacity">
              <Plus className="w-3 h-3" /> New Post
            </button>

            <ProfileDropdown currentUser={currentUser} coaches={coaches} currentRole={selectedCoachId || (isCoach ? 'coach' : 'gym_owner')} onRoleSelect={handleRoleSelect} />

            <button onClick={() => setShowChat((o) => !o)}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center border cursor-pointer transition-all',
                showChat
                  ? 'bg-blue-500/10 border-blue-500/[0.22] text-blue-500'
                  : 'bg-white/[0.03] border-white/[0.04] text-slate-600 hover:text-slate-100 hover:border-white/[0.07]'
              )}>
              <MessageCircle className="w-[13px] h-[13px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden px-[22px] pt-5 pb-7 flex flex-col">
          <div className="flex-1 min-h-0 w-full max-w-[1600px] overflow-y-auto pr-0.5">
            <Suspense fallback={<TabLoader />}>
              {tabPanels.map((p) => (
                <div key={p.id} style={{ display: p.id === tab ? 'block' : 'none' }}>{p.content}</div>
              ))}
            </Suspense>
          </div>
        </main>
      </div>

      {sharedModals}
    </div>
  );
}
