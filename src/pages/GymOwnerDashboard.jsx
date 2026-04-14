import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  TrendingDown, Users, Trophy, AlertCircle, BarChart2,
  Eye, Menu, LayoutDashboard, FileText, BarChart3, Settings,
  LogOut, ChevronDown, AlertTriangle, QrCode,
  Plus, Dumbbell, Clock, Crown, Trash2, X,
  Sun, Zap, Calendar,
  MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ProfileDropdown from '../components/dashboard/ProfileDropdown';
import MemberQuickModal from '../components/dashboard/MemberQuickModal';
import QRCode from 'react-qr-code';
import ManageClassesModal from '../components/gym/ManageClassesModal';
import CreateGymOwnerPostModal from '../components/gym/CreateGymOwnerPostModal';
import CreateEventModal from '../components/events/CreateEventModal';
import CreateChallengeModal from '../components/challenges/CreateChallengeModal';
import QRScanner from '../components/gym/QRScanner';
import CreatePollModal from '../components/polls/CreatePollModal';
import ManageRewardsModal from '../components/gym/ManageRewardsModal';
import ManageCoachesModal from '../components/gym/ManageCoachesModal';
import EditGymPhotoModal from '../components/gym/EditGymPhotoModal';
import ManageGymPhotosModal from '../components/gym/ManageGymPhotosModal';
import ManageMembersModal from '../components/gym/ManageMembersModal';
import ManageEquipmentModal from '../components/gym/ManageEquipmentModal';
import ManageAmenitiesModal from '../components/gym/ManageAmenitiesModal';
import EditBasicInfoModal from '../components/gym/EditBasicInfoModal';
import EditGymLogoModal from '../components/gym/EditGymLogoModal';
import EditPricingModal from '../components/gym/EditPricingModal';
import GymJoinPoster from '../components/dashboard/GymJoinPoster';
import MemberChatPanel from '../components/dashboard/MemberChatPanel';
import { lazy, Suspense } from 'react';
const TabOverview = lazy(() => import('../components/dashboard/TabOverview'));
const TabMembersComponent = lazy(() => import('../components/dashboard/TabMembers'));
const TabContentComponent = lazy(() => import('../components/dashboard/TabContent'));
const TabAnalyticsComponent = lazy(() => import('../components/dashboard/TabAnalytics'));
const TabGym = lazy(() => import('../components/dashboard/TabGym'));
const TabActions = lazy(() => import('../components/dashboard/TabActions'));
const TabCoachSchedule = lazy(() => import('../components/dashboard/TabCoachSchedule'));
const TabCoachMembers = lazy(() => import('../components/dashboard/TabCoachMembers'));
const TabCoachContent = lazy(() => import('../components/dashboard/TabCoachContent'));
const TabCoachAnalytics = lazy(() => import('../components/dashboard/TabCoachAnalytics'));
const TabCoachProfile = lazy(() => import('../components/dashboard/TabCoachProfile'));
const TabEngagement = lazy(() => import('../components/dashboard/TabEngagement'));
const TabRewards = lazy(() => import('../components/dashboard/TabRewards'));
const TabCoachToday = lazy(() => import('../components/dashboard/TabCoachToday'));

/* ─── Design Tokens — unified with Content & Overview pages ─── */
const T = {
  bg:        '#000000',
  sidebar:   '#0f0f12',
  card:      '#141416',
  card2:     '#1a1a1f',
  brd:       '#222226',
  brd2:      '#2a2a30',
  t1:        '#ffffff',
  t2:        '#8a8a94',
  t3:        '#444450',
  cyan:      '#4d7fff',
  cyanDim:   'rgba(77,127,255,0.12)',
  cyanBrd:   'rgba(77,127,255,0.28)',
  red:       '#ff4d6d',
  redDim:    'rgba(255,77,109,0.15)',
  amber:     '#f59e0b',
  amberDim:  'rgba(245,158,11,0.15)',
  green:     '#22c55e',
  greenDim:  'rgba(34,197,94,0.12)',
};

/* Keep hex values for SVG / data-driven color needs */
const HEX = { blue: T.cyan, red: T.red, amber: T.amber, green: T.green };

function TabLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 28, height: 28, border: `3px solid ${T.cyanDim}`, borderTopColor: T.cyan, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const ALL_NAV = [
  { id: 'overview',   label: 'Overview',     icon: LayoutDashboard, roles: ['gym_owner'] },
  { id: 'today',      label: 'Today',        icon: Sun,             roles: ['coach'] },
  { id: 'members',    label: 'Members', coachLabel: 'Clients', icon: Users, roles: ['gym_owner', 'coach'] },
  { id: 'schedule',   label: 'Schedule',     icon: Calendar,        roles: ['coach'] },
  { id: 'content',    label: 'Content',      icon: FileText,        roles: ['gym_owner', 'coach'] },
  { id: 'analytics',  label: 'Analytics',    icon: BarChart3,       roles: ['gym_owner'] },
  { id: 'profile',    label: 'Profile',      icon: Crown,           roles: ['coach'] },
  { id: 'engagement', label: 'Automations',  icon: Zap,             roles: ['gym_owner'] },
  { id: 'actions',    label: 'Actions',      icon: Settings,        roles: ['gym_owner'] },
];

/* ─── Sparkline ─────────────────────────────────────────────── */
const Spark = ({ data = [], color = T.cyan, height = 32 }) => {
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
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block', marginTop: 8 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={area} fill={`url(#${id})`} />
    </svg>
  );
};

/* ─── Delta badge ────────────────────────────────────────────── */
const Delta = ({ val }) => {
  const up = val > 0, flat = val === 0;
  const style = flat
    ? { color: T.t3, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.brd}` }
    : up
      ? { color: T.green, background: T.greenDim, border: '1px solid rgba(34,197,94,0.25)' }
      : { color: T.red, background: T.redDim, border: `1px solid rgba(255,77,109,0.25)` };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, ...style }}>
      {flat ? '—' : up ? '+' : ''}{val}%
    </span>
  );
};

/* ─── KPI card ───────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, subColor, valueColor, footerBar, footerColor, trend }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.brd2}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.brd}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: T.t3 }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 12, height: 12, color: T.t3 }} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, margin: '8px 0', color: valueColor || T.t1 }}>{value}</div>
      <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, color: subColor || T.t2 }}>
        <span>{sub}</span>
        {trend != null && <Delta val={trend} />}
      </div>
      {footerBar != null && (
        <div style={{ marginTop: 10, height: 2, borderRadius: 9, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 9, transition: 'width 0.7s ease-out', width: `${Math.min(100, footerBar)}%`, background: footerColor || T.cyan }} />
        </div>
      )}
    </div>
  );
}
function CoachKpiCard(props) { return <KpiCard {...props} />; }

/* ─── Generic card shell ─────────────────────────────────────── */
function DashCard({ children, className, accentColor, title, action, onAction, style }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 12, position: 'relative', overflow: 'hidden', ...style }}>
      {accentColor && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, pointerEvents: 'none', background: `linear-gradient(90deg, ${accentColor}50 0%, ${accentColor}18 60%, transparent 100%)` }} />
      )}
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>{title}</span>
          {onAction && (
            <button onClick={onAction} style={{ fontSize: 11, fontWeight: 600, color: T.cyan, background: T.cyanDim, border: `1px solid ${T.cyanBrd}`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>
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

/* ─── Mini avatar ────────────────────────────────────────────── */
function MiniAvatar({ name, src, size = 30 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.08)', border: `1px solid ${T.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: T.t2, overflow: 'hidden', fontSize: size * 0.36 }}>
      {src ? <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

const CLASS_TYPE_COLORS = { hiit: T.red, yoga: T.green, strength: T.cyan, spin: T.cyan, boxing: T.red, cardio: T.amber, pilates: T.green, default: T.cyan };
function classColor(cls) {
  const n = (cls?.class_type || cls?.name || '').toLowerCase();
  return CLASS_TYPE_COLORS[Object.keys(CLASS_TYPE_COLORS).find((k) => n.includes(k)) || 'default'];
}

/* ─── Mobile KPI strip ───────────────────────────────────────── */
function MobileKpiStrip({ tab, isCoach, stats, posts, events, challenges, polls, coaches, classes, myClasses, allMemberships }) {
  const { todayCI = 0, activeThisWeek = 0, atRisk = 0, totalMembers = 0, newSignUps = 0, retentionRate = 0, monthChangePct = 0, activeThisMonth = 0 } = stats;
  let items;
  if (tab === 'overview') {
    items = [
      { label: 'Today',   value: todayCI,         color: T.cyan },
      { label: 'Week',    value: activeThisWeek },
      { label: 'At Risk', value: atRisk,           color: atRisk > 0 ? T.red : null },
      { label: 'Members', value: totalMembers },
    ];
  } else if (tab === 'members') {
    items = [
      { label: 'Total',  value: totalMembers },
      { label: 'Active', value: activeThisWeek },
      { label: 'At Risk',value: atRisk,  color: atRisk > 0 ? T.red : null },
      { label: 'New',    value: newSignUps, color: newSignUps > 0 ? T.green : null },
    ];
  } else if (tab === 'content') {
    items = [
      { label: 'Posts',      value: posts.length },
      { label: 'Events',     value: events.length },
      { label: 'Challenges', value: challenges.length },
      { label: 'Polls',      value: polls.length },
    ];
  } else if (tab === 'analytics') {
    items = [
      { label: 'Retention', value: retentionRate + '%', color: retentionRate >= 70 ? T.green : retentionRate >= 40 ? T.amber : T.red },
      { label: '30-Day Δ',  value: (monthChangePct > 0 ? '+' : '') + monthChangePct + '%', color: monthChangePct > 0 ? T.green : monthChangePct < 0 ? T.red : null },
      { label: 'Active',    value: activeThisMonth },
      { label: 'At Risk',   value: atRisk, color: atRisk > 0 ? T.red : null },
    ];
  } else if (tab === 'engagement') {
    items = [
      { label: 'Members', value: totalMembers },
      { label: 'Active',  value: activeThisWeek },
      { label: 'At Risk', value: atRisk, color: atRisk > 0 ? T.red : null },
    ];
  } else if (tab === 'gym') {
    items = [
      { label: 'Coaches',  value: coaches.length },
      { label: 'Classes',  value: classes.length },
      { label: 'Members',  value: totalMembers },
    ];
  } else if ((tab === 'today' || tab === 'schedule') && isCoach) {
    items = [
      { label: 'Classes', value: myClasses.length },
      { label: 'Clients', value: allMemberships.length },
    ];
  } else { return null; }
  return (
    <>
      <style>{`
        .kpi-strip::-webkit-scrollbar { display: none; }
        .kpi-card { flex-shrink: 0; scroll-snap-align: start; }
      `}</style>
      <div className="kpi-strip" style={{ flexShrink: 0, display: 'flex', gap: 10, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', padding: '12px 16px', background: T.bg, borderBottom: `1px solid ${T.brd}`, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {items.map((item) => (
          <div key={item.label} className="kpi-card" style={{ background: T.card, border: `1px solid ${item.color ? item.color + '35' : T.brd}`, borderRadius: 14, padding: '12px 18px', minWidth: 92, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, color: item.color || T.t1 }}>{item.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: item.color ? item.color + 'bb' : T.t3 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Mobile FAB ─────────────────────────────────────────────── */
function MobileFAB({ openModal }) {
  const [open, setOpen] = useState(false);
  const items = [
    { emoji: '📝', label: 'Post',      modal: 'post'      },
    { emoji: '🏆', label: 'Challenge', modal: 'challenge' },
    { emoji: '📊', label: 'Poll',      modal: 'poll'      },
    { emoji: '📅', label: 'Event',     modal: 'event'     },
    { emoji: '⚙️', label: 'More',      modal: null        },
  ];
  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 198, background: 'rgba(0,0,0,0.45)' }} />}
      {open && (
        <div style={{ position: 'fixed', bottom: 'calc(134px + env(safe-area-inset-bottom))', right: 16, zIndex: 199, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          {items.map(item => (
            <button key={item.label} onClick={() => { setOpen(false); if (item.modal) openModal(item.modal); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 14, background: T.card, border: `1px solid ${T.brd2}`, color: T.t1, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.7)', WebkitTapHighlightColor: 'transparent', minHeight: 48, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 18 }}>{item.emoji}</span>{item.label}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} aria-label="Create"
        style={{ position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom))', right: 20, zIndex: 200, width: 52, height: 52, borderRadius: 26, background: T.cyan, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(77,127,255,0.35)', cursor: 'pointer', color: '#fff', transition: 'transform 0.18s', WebkitTapHighlightColor: 'transparent', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}>
        <Plus style={{ width: 22, height: 22, strokeWidth: 2.5 }} />
      </button>
    </>
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
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [selectedQuickMember, setSelectedQuickMember] = useState(null);
  const memberSearchRef = React.useRef(null);
  const openModal = useCallback((name) => { if (name === 'message') { setTab('members'); return; } setModal(name); }, []);
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
    if (!tabInitialised.current && currentUser) { setTab(isCoach ? 'today' : 'overview'); tabInitialised.current = true; }
  }, [currentUser, isCoach]);
  useEffect(() => {
    const h = () => base44.auth.logout();
    document.addEventListener('dash-logout', h);
    return () => document.removeEventListener('dash-logout', h);
  }, []);
  useEffect(() => {
    const h = (e) => {
      if (e.detail === 'addClient') { setTab('members'); setTimeout(() => window.dispatchEvent(new CustomEvent('coachOpenAddClient')), 100); }
      else if (e.detail === 'bookClient') { openModal('classes'); }
    };
    window.addEventListener('coachAction', h);
    return () => window.removeEventListener('coachAction', h);
  }, [openModal]);
  const handleRoleSelect = (roleId) => {
    if (roleId === 'gym_owner') { setSelectedCoachId(null); } else { setSelectedCoachId(roleId); }
    setTab(roleId === 'gym_owner' ? 'overview' : 'today');
  };
  const NAV = ALL_NAV.filter((item) => item.roles.includes(dashRole)).map((item) => ({ ...item, label: isCoach && item.coachLabel ? item.coachLabel : item.label }));
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
  useEffect(() => { if (approvedGyms.length > 0 && !selectedGym) setSelectedGym(approvedGyms[0]); }, [approvedGyms, selectedGym]);
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
  const inv = useCallback((...keys) => { keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k, selectedGym?.id] })); queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedGym?.id] }); }, [queryClient, selectedGym?.id]);
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
  const updateGalleryM = useMutation({ mutationFn: (g) => base44.entities.Gym.update(selectedGym.id, { gallery: g }), onSuccess: () => { invGyms(); closeModal(); }, onError: onErr });
  const updateGymM = useMutation({ mutationFn: (d) => base44.entities.Gym.update(selectedGym.id, d), onSuccess: () => { invGyms(); closeModal(); }, onError: onErr });
  const createEventM = useMutation({ mutationFn: (d) => base44.entities.Event.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, attendees: 0 }), onSuccess: () => { inv('events'); closeModal(); }, onError: onErr });
  const createChallengeM = useMutation({ mutationFn: (d) => base44.entities.Challenge.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, participants: [], status: 'upcoming' }), onSuccess: () => { inv('challenges'); closeModal(); }, onError: onErr });
  const banMemberM = useMutation({ mutationFn: (uid) => base44.functions.invoke('manageMember', { memberId: uid, gymId: selectedGym.id, action: 'ban' }), onSuccess: invGyms, onError: onErr });
  const unbanMemberM = useMutation({ mutationFn: (uid) => base44.functions.invoke('manageMember', { memberId: uid, gymId: selectedGym.id, action: 'unban' }), onSuccess: invGyms, onError: onErr });
  const deleteGymM = useMutation({ mutationFn: () => base44.functions.invoke('deleteGym', { gymId: selectedGym.id }), onSuccess: () => { invGyms(); closeModal(); window.location.href = createPageUrl('Gyms'); }, onError: onErr });
  const deleteAccountM = useMutation({ mutationFn: () => base44.functions.invoke('deleteUserAccount'), onSuccess: () => { closeModal(); base44.auth.logout(); }, onError: onErr });
  const createPollM = useMutation({ mutationFn: (d) => base44.entities.Poll.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, created_by: currentUser.id, voters: [] }), onSuccess: () => { inv('polls'); closeModal(); }, onError: onErr });
  const deletePostM = useMutation({ mutationFn: (id) => base44.entities.Post.delete(id), onSuccess: () => inv('posts'), onError: onErr });
  const deleteEventM = useMutation({ mutationFn: (id) => base44.entities.Event.delete(id), onSuccess: () => inv('events'), onError: onErr });
  const deleteChallengeM = useMutation({ mutationFn: (id) => base44.entities.Challenge.delete(id), onSuccess: () => inv('challenges'), onError: onErr });
  const deletePollM = useMutation({ mutationFn: (id) => base44.entities.Poll.delete(id), onSuccess: () => inv('polls'), onError: onErr });
  const now = new Date();
  const memberUserIds = useMemo(() => {
    const ids = new Set();
    (allMemberships || []).forEach((m) => { if (m.user_id) ids.add(m.user_id); });
    checkIns.forEach((c) => { if (c.user_id) ids.add(c.user_id); });
    recentActivity.forEach((a) => { if (a.user_id) ids.add(a.user_id); });
    return [...ids].slice(0, 100);
  }, [allMemberships, checkIns, recentActivity]);
  const { data: memberUserRecords = [] } = useQuery({
    queryKey: ['memberUserRecords', selectedGym?.id, memberUserIds.join(',')],
    queryFn: () => base44.entities.User.filter({ id: { $in: memberUserIds } }),
    enabled: !!selectedGym && memberUserIds.length > 0, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000
  });
  const memberAvatarMapResolved = useMemo(() => {
    const map = {};
    (allMemberships || []).forEach((m) => { if (m.user_id && m.avatar_url) map[m.user_id] = m.avatar_url; });
    memberUserRecords.forEach((u) => { if (u.id && u.avatar_url) map[u.id] = u.avatar_url; });
    if (currentUser?.id && currentUser.avatar_url) map[currentUser.id] = currentUser.avatar_url;
    return map;
  }, [allMemberships, memberUserRecords, currentUser]);
  const memberNameMap = useMemo(() => {
    const map = {};
    (allMemberships || []).forEach((m) => { if (m.user_id && m.user_name) map[m.user_id] = m.user_name; });
    checkIns.forEach((c) => { if (c.user_id && c.user_name) map[c.user_id] = c.user_name; });
    recentActivity.forEach((a) => { if (a.user_id && a.name) map[a.user_id] = a.name; });
    memberUserRecords.forEach((u) => { if (u.id) { const name = u.display_name || (u.username ? u.username : null) || u.full_name; if (name) map[u.id] = name; } });
    if (currentUser?.id) { const name = currentUser.display_name || currentUser.username || currentUser.full_name; if (name) map[currentUser.id] = name; }
    return map;
  }, [allMemberships, checkIns, recentActivity, memberUserRecords, currentUser]);
  const { todayCI = 0, yesterdayCI = 0, todayVsYest = 0, activeThisWeek = 0, weeklyChangePct = 0, activeThisMonth = 0, totalMembers = 0, retentionRate = 0, monthChangePct = 0, monthCiPer = [], newSignUps = 0, cancelledEst = 0, atRisk = 0, atRiskMembersData: atRiskMembersList = [], memberLastCheckIn = {}, sparkData7 = [], monthGrowthData = [], peakLabel = null, peakEndLabel = null, peakEntry = null, satVsAvg = 0, chartDays = [], streaks = [], avatarMap = {}, weekTrend = [], peakHours = [], busiestDays = [], returnRate = 0, dailyAvg = 0, engagementSegments = {}, retentionFunnel = [], dropOffBuckets = [], churnSignals = [], week1ReturnTrend = [], retentionBreakdown = {}, week1ReturnRate = {}, newNoReturnCount = 0, ci7Count = 0, ci7pCount = 0, weeklyTrendCoach = 0, monthlyTrendCoach = 0, returningCount = 0, newMembersThis30 = 0, weeklyChart = [], monthlyChart = [], engagementSegmentsCoach = {}, weekSpark = [] } = stats;
  const ci30 = [];
  const avatarMapFull = useMemo(() => ({ ...avatarMap, ...memberAvatarMapResolved }), [avatarMap, memberAvatarMapResolved]);
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
    if (bookedClientIds.size > 0) return allMemberships.filter(m => bookedClientIds.has(m.user_id));
    if (activeCoachRecord?.client_notes) { const ids = Object.keys(activeCoachRecord.client_notes); if (ids.length > 0) return allMemberships.filter(m => ids.includes(m.user_id)); }
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
    atRisk > 0 && { icon: AlertCircle, color: T.red, label: `${atRisk} members inactive 14+ days`, action: 'View members', fn: () => setTab('members') },
    !challenges.some((c) => c.status === 'active') && { icon: Trophy, color: T.amber, label: 'No active challenge running', action: 'Create one', fn: () => openModal('challenge') },
    polls.length === 0 && { icon: BarChart2, color: T.amber, label: 'No active polls', action: 'Create poll', fn: () => openModal('poll') },
    monthChangePct < 0 && { icon: TrendingDown, color: T.amber, label: 'Attendance down vs last month', action: 'View analytics', fn: () => setTab('analytics') }
  ].filter(Boolean).slice(0, 4);
  const tabPanels = NAV.map((item) => {
    let content = null;
    if (item.id === 'overview' && !isCoach) {
      content = <TabOverview todayCI={todayCI} yesterdayCI={yesterdayCI} todayVsYest={todayVsYest} activeThisWeek={activeThisWeek} totalMembers={totalMembers} retentionRate={retentionRate} newSignUps={newSignUps} monthChangePct={monthChangePct} ciPrev30={[]} atRisk={atRisk} sparkData={sparkData7} monthGrowthData={monthGrowthData} cancelledEst={cancelledEst} peakLabel={peakLabel} peakEndLabel={peakEndLabel} peakEntry={peakEntry} satVsAvg={satVsAvg} monthCiPer={monthCiPer} checkIns={checkIns} allMemberships={effectiveMemberships} challenges={challenges} posts={posts} polls={polls} classes={classes} coaches={coaches} streaks={streaks} recentActivity={recentActivity} chartDays={chartDays} chartRange={chartRange} setChartRange={setChartRange} avatarMap={memberAvatarMapResolved} nameMap={memberNameMap} priorities={priorities} selectedGym={selectedGym} now={now} openModal={openModal} setTab={setTab} Spark={Spark} Delta={Delta} retentionBreakdown={retentionBreakdown} week1ReturnRate={week1ReturnRate} newNoReturnCount={newNoReturnCount} atRiskMembers={atRiskMembersList} ownerName={currentUser?.full_name?.split(' ')[0] || 'there'} mrr={(totalMembers || 0) * 60} automationStats={{ messagesSent: 83, membersReengaged: 29, revenueRetained: 940, churnPrevented: 11, activeRules: 3 }} activityFeed={[{ userId: 'u1', name: 'James Okafor', type: 'returned', time: 'just now' }, { userId: 'u2', name: 'Sofia Reyes', type: 'inactive', time: 'just now' }, { userId: 'u3', name: 'Mei Zhang', type: 'message', time: 'just now' }]} />;
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
    } else if (item.id === 'actions') {
      content = <TabActions />;
    }
    return { id: item.id, content };
  }).filter((p) => p.content !== null);

  /* ── Splash screens ── */
  const Splash = ({ children }) => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
      <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 16, padding: '36px 24px', maxWidth: 380, width: '100%', textAlign: 'center' }}>{children}</div>
    </div>
  );
  if (gymsError) return (
    <Splash>
      <X style={{ width: 26, height: 26, color: T.red, margin: '0 auto 12px' }} />
      <h2 style={{ color: T.t1, fontWeight: 800, marginBottom: 8 }}>Connection Error</h2>
      <p style={{ color: T.t2, fontSize: 13, marginBottom: 20 }}>{gymsError.message}</p>
      <button onClick={() => window.location.reload()} style={{ background: T.cyan, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>Retry</button>
    </Splash>
  );
  if (approvedGyms.length === 0 && pendingGyms.length > 0) return (
    <Splash>
      <Clock style={{ width: 26, height: 26, color: T.amber, margin: '0 auto 12px' }} />
      <h2 style={{ color: T.t1, fontWeight: 800, marginBottom: 8 }}>Pending Approval</h2>
      <p style={{ color: T.t2, fontSize: 13, marginBottom: 20 }}>Your gym <strong style={{ color: T.t1 }}>{pendingGyms[0].name}</strong> is under review.</p>
      <Link to={createPageUrl('Home')}><button style={{ background: T.card2, color: T.t1, border: `1px solid ${T.brd}`, borderRadius: 9, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>Back to Home</button></Link>
    </Splash>
  );
  if (myGyms.length === 0 && !isCoach) return (
    <Splash>
      <Dumbbell style={{ width: 26, height: 26, color: T.cyan, margin: '0 auto 12px' }} />
      <h2 style={{ color: T.t1, fontWeight: 800, marginBottom: 8 }}>No Gyms Yet</h2>
      <p style={{ color: T.t2, fontSize: 13, marginBottom: 20 }}>Register your gym to get started.</p>
      <Link to={createPageUrl('GymSignup')}><button style={{ background: T.cyan, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>Register Your Gym</button></Link>
    </Splash>
  );

  /* ── Shared modals ── */
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
        <AlertDialogContent style={{ background: T.card, border: `1px solid rgba(255,77,109,0.25)`, maxWidth: 420 }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.t1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}>
              <Trash2 style={{ width: 16, height: 16, color: T.red }} /> Delete Gym Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.t2, fontSize: 13 }}>
              Deletes <strong style={{ color: T.t1 }}>{selectedGym?.name}</strong> and all its data. <span style={{ color: T.red, fontWeight: 700 }}>This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: T.card2, color: T.t1, border: `1px solid ${T.brd}` }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteGymM.mutate()} disabled={deleteGymM.isPending} style={{ background: T.red, color: '#fff', border: 'none' }}>
              {deleteGymM.isPending ? 'Deleting…' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={modal === 'deleteAccount'} onOpenChange={(v) => !v && closeModal()}>
        <AlertDialogContent style={{ background: T.card, border: `1px solid rgba(255,77,109,0.25)`, maxWidth: 420 }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.t1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}>
              <Trash2 style={{ width: 16, height: 16, color: T.red }} /> Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.t2, fontSize: 13 }}>
              Deletes your account and all personal data. <span style={{ color: T.red, fontWeight: 700 }}>This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: T.card2, color: T.t1, border: `1px solid ${T.brd}` }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAccountM.mutate()} disabled={deleteAccountM.isPending} style={{ background: T.red, color: '#fff', border: 'none' }}>
              {deleteAccountM.isPending ? 'Deleting…' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <GymJoinPoster gym={selectedGym} open={showPoster} onClose={() => setShowPoster(false)} />
      <MemberChatPanel open={showChat} onClose={() => setShowChat(false)} allMemberships={allMemberships} currentUser={currentUser} avatarMap={memberAvatarMapResolved} />
    </>
  );

  /* ════════════════════════════════════════════════════════════
     MOBILE
     ════════════════════════════════════════════════════════════ */
  if (isMobile) return (
    <div style={{ display: 'flex', flexDirection: 'column', background: T.bg, height: '100dvh', overflow: 'hidden' }}>
      <header style={{ flexShrink: 0, background: T.sidebar, borderBottom: `1px solid ${T.brd}`, height: 60, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent 0%, rgba(77,127,255,0.35) 40%, rgba(77,127,255,0.35) 60%, transparent 100%)`, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: T.card, border: `1.5px solid ${T.cyanBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {selectedGym?.logo_url || selectedGym?.image_url
              ? <img src={selectedGym.logo_url || selectedGym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Dumbbell style={{ width: 16, height: 16, color: T.cyan }} />
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
              {selectedGym?.name || 'Dashboard'}
            </div>
            <div style={{ marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.cyan }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.cyan, flexShrink: 0 }} />{roleLabel}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {atRisk > 0 && (
            <button onClick={() => setTab('members')} style={{ background: T.redDim, color: T.red, border: '1px solid rgba(255,77,109,0.35)', borderRadius: 20, fontSize: 11, fontWeight: 800, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, minHeight: 32, WebkitTapHighlightColor: 'transparent' }}>
              <AlertTriangle style={{ width: 10, height: 10 }} />{atRisk}
            </button>
          )}
          <button onClick={() => openModal('qrScanner')} style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.card, border: `1px solid ${T.brd}`, color: T.t2, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}>
            <QrCode style={{ width: 16, height: 16 }} />
          </button>
          <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: T.card2, border: `1px solid ${T.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: T.t1 }}>
            {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (currentUser?.full_name || currentUser?.email || '?').charAt(0).toUpperCase()}
          </div>
        </div>
      </header>
      <MobileKpiStrip tab={tab} isCoach={isCoach} stats={stats} posts={posts} events={events} challenges={challenges} polls={polls} coaches={coaches} classes={classes} myClasses={myClasses} allMemberships={effectiveMemberships} />
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '14px 16px 96px', WebkitOverflowScrolling: 'touch', minWidth: 0 }}>
        <Suspense fallback={<TabLoader />}>
          {tabPanels.map((p) => (
            <div key={p.id} style={{ display: p.id === tab ? 'block' : 'none', minWidth: 0 }}>{p.content}</div>
          ))}
        </Suspense>
      </main>
      <MobileFAB openModal={openModal} />
      <nav style={{ flexShrink: 0, background: T.sidebar, borderTop: `1px solid ${T.brd}`, paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 8, paddingRight: 8, paddingTop: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {NAV.map((item) => {
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 9, paddingBottom: 9, border: 'none', cursor: 'pointer', borderRadius: 12, background: active ? T.cyanDim : 'transparent', color: active ? T.cyan : T.t3, transition: 'background 0.15s, color 0.15s', minHeight: 52, WebkitTapHighlightColor: 'transparent', position: 'relative' }}>
                {active && <div style={{ position: 'absolute', top: 0, left: '30%', right: '30%', height: 2, borderRadius: '0 0 2px 2px', background: T.cyan }} />}
                <item.icon style={{ width: 19, height: 19, strokeWidth: active ? 2.2 : 1.8 }} />
                <span style={{ fontSize: 9.5, letterSpacing: '0.02em', fontWeight: active ? 700 : 500, lineHeight: 1 }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      {sharedModals}
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     DESKTOP
     ════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: T.bg }}>
      <aside style={{ flexShrink: 0, height: '100%', overflow: 'hidden', background: T.sidebar, borderRight: `1px solid ${T.brd}`, display: 'flex', flexDirection: 'column', width: collapsed ? 56 : 220, transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ borderBottom: `1px solid ${T.brd}`, flexShrink: 0, padding: collapsed ? '13px 0' : '13px 14px' }}>
          {collapsed ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => setCollapsed(false)} style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: T.t3, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = T.t1} onMouseLeave={e => e.currentTarget.style.color = T.t3}>
                <Menu style={{ width: 16, height: 16 }} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: T.card, border: `2px solid ${T.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {selectedGym?.logo_url || selectedGym?.image_url
                  ? <img src={selectedGym.logo_url || selectedGym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Dumbbell style={{ width: 14, height: 14, color: T.cyan }} />
                }
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>{selectedGym?.name || 'Dashboard'}</div>
                <div style={{ fontSize: 9, color: T.t3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{roleLabel}</div>
              </div>
              <button onClick={() => setCollapsed(true)} style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: T.t3, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = T.t1} onMouseLeave={e => e.currentTarget.style.color = T.t3}>
                <Menu style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}
          {!collapsed && approvedGyms.length > 1 && (
            <div style={{ position: 'relative', marginTop: 10 }}>
              <button onClick={() => setGymOpen((o) => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.brd}`, color: T.t2, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedGym?.name}</span>
                <ChevronDown style={{ width: 11, height: 11, flexShrink: 0, transform: gymOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }} />
              </button>
              {gymOpen && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)', borderRadius: 10, overflow: 'hidden', background: T.card2, border: `1px solid ${T.brd2}`, zIndex: 20, boxShadow: '0 12px 32px rgba(0,0,0,0.7)' }}>
                  {approvedGyms.map((g) => (
                    <button key={g.id} onClick={() => { setSelectedGym(g); setGymOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: selectedGym?.id === g.id ? T.cyanDim : 'transparent', color: selectedGym?.id === g.id ? T.cyan : T.t2 }}>
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {!collapsed && <div style={{ fontSize: 9, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.10em', padding: '4px 14px 6px' }}>Navigation</div>}
          {NAV.map((item) => {
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)} style={{ display: 'flex', alignItems: 'center', width: '100%', border: 'none', cursor: 'pointer', borderLeft: `2px solid ${active ? T.cyan : 'transparent'}`, borderRadius: '0 8px 8px 0', fontSize: 12.5, fontWeight: active ? 700 : 400, marginBottom: 1, gap: collapsed ? 0 : 9, padding: collapsed ? '10px 0' : '8px 14px', justifyContent: collapsed ? 'center' : 'flex-start', background: active ? T.cyanDim : 'transparent', color: active ? T.t1 : T.t2, transition: 'background 0.12s, color 0.12s, border-color 0.12s' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = T.t1; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.t2; } }}>
                <item.icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>
        {!collapsed && isGymOwner && (
          <div style={{ padding: '0 10px 10px', flexShrink: 0 }}>
            <Link to={createPageUrl('Plus')}>
              <div style={{ padding: '11px 13px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.brd}`, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.brd2} onMouseLeave={e => e.currentTarget.style.borderColor = T.brd}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                  <Crown style={{ width: 11, height: 11, color: T.t3 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.t2 }}>Retention Pro</span>
                </div>
                <div style={{ fontSize: 10, color: T.t3 }}>Advanced analytics · From £49.99/mo</div>
              </div>
            </Link>
          </div>
        )}
        <div style={{ flexShrink: 0, borderTop: `1px solid ${T.brd}` }}>
          {!collapsed && (
            <div style={{ padding: '10px 10px 4px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, paddingLeft: 4 }}>Links</div>
              {[
                { icon: Eye, label: 'View Gym Page', to: createPageUrl('GymCommunity') + '?id=' + selectedGym?.id },
                { icon: Users, label: 'Member View', to: createPageUrl('Home') }
              ].map((l, i) => (
                <Link key={i} to={l.to}>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', border: 'none', background: 'transparent', color: T.t3, fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 7, marginBottom: 1, transition: 'color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.color = T.t2} onMouseLeave={e => e.currentTarget.style.color = T.t3}>
                    <l.icon style={{ width: 12, height: 12 }} /><span>{l.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          )}
          {collapsed && (
            <div style={{ padding: '8px 0' }}>
              {[{ icon: Eye, to: createPageUrl('GymCommunity') + '?id=' + selectedGym?.id }, { icon: Users, to: createPageUrl('Home') }].map((l, i) => (
                <Link key={i} to={l.to}>
                  <button style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '9px 0', border: 'none', background: 'transparent', color: T.t3, cursor: 'pointer', transition: 'color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.color = T.t2} onMouseLeave={e => e.currentTarget.style.color = T.t3}>
                    <l.icon style={{ width: 13, height: 13 }} />
                  </button>
                </Link>
              ))}
            </div>
          )}
          <div style={{ padding: collapsed ? '4px 0 14px' : '0 10px 14px' }}>
            <button onClick={() => base44.auth.logout()} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent', color: T.red, fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 7, padding: collapsed ? '7px 0' : '7px 8px', justifyContent: collapsed ? 'center' : 'flex-start', opacity: 0.55, transition: 'opacity 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.55'}>
              <LogOut style={{ width: 13, height: 13 }} />
              {!collapsed && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <header style={{ height: 54, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: T.sidebar, borderBottom: `1px solid ${T.brd}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.t2, letterSpacing: '-0.01em' }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 11px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${memberSearchOpen ? T.cyanBrd : T.brd}`, transition: 'border-color 0.15s' }}>
                <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><circle cx="8" cy="8" r="6" stroke={T.t3} strokeWidth="2"/><path d="M13 13l4 4" stroke={T.t3} strokeWidth="2" strokeLinecap="round"/></svg>
                <input value={memberSearchQuery} onChange={e => { setMemberSearchQuery(e.target.value); setMemberSearchOpen(true); }} onFocus={() => setMemberSearchOpen(true)} onBlur={() => setTimeout(() => setMemberSearchOpen(false), 180)} placeholder="Search members..." style={{ width: 170, background: 'transparent', border: 'none', outline: 'none', color: T.t1, fontSize: 12 }} />
                {memberSearchQuery && (
                  <button onClick={() => { setMemberSearchQuery(''); setMemberSearchOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <X style={{ width: 10, height: 10, color: T.t3 }} />
                  </button>
                )}
              </div>
              {memberSearchOpen && memberSearchQuery.length >= 1 && (() => {
                const q = memberSearchQuery.toLowerCase();
                const results = effectiveMemberships.filter(m => (m.user_name || '').toLowerCase().includes(q) || (m.user_email || '').toLowerCase().includes(q)).slice(0, 8);
                return (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 240, background: T.card2, border: `1px solid ${T.brd2}`, borderRadius: 10, zIndex: 9990, overflow: 'hidden', boxShadow: '0 12px 36px rgba(0,0,0,0.7)' }}>
                    {results.length === 0 ? (
                      <div style={{ padding: '10px 14px', fontSize: 12, color: T.t3 }}>No members found</div>
                    ) : results.map(m => (
                      <button key={m.user_id} onMouseDown={() => { setSelectedQuickMember(m); setMemberSearchQuery(''); setMemberSearchOpen(false); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = T.cyanDim} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: T.card, border: `1px solid ${T.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: T.t1, overflow: 'hidden' }}>
                          {avatarMapFull[m.user_id] ? <img src={avatarMapFull[m.user_id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (m.user_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.t1 }}>{m.user_name || 'Member'}</div>
                          {m.user_email && <div style={{ fontSize: 10.5, color: T.t3 }}>{m.user_email}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isGymOwner && selectedGym?.join_code && (
              <button onClick={() => setShowPoster(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.brd}`, color: T.t2, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.brd2} onMouseLeave={e => e.currentTarget.style.borderColor = T.brd}>
                <QrCode style={{ width: 11, height: 11 }} />
                <span style={{ fontFamily: 'monospace', letterSpacing: '0.10em' }}>{selectedGym.join_code}</span>
              </button>
            )}
            {atRisk > 0 && (
              <button onClick={() => setTab('members')} style={{ background: T.redDim, color: T.red, border: '1px solid rgba(255,77,109,0.3)', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '5px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle style={{ width: 11, height: 11 }} />{atRisk} at risk
              </button>
            )}
            <button onClick={() => openModal('qrScanner')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: T.t2, border: `1px solid ${T.brd}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = T.t1; e.currentTarget.style.borderColor = T.brd2; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.t2; e.currentTarget.style.borderColor = T.brd; }}>
              <QrCode style={{ width: 12, height: 12 }} /> Scan QR
            </button>
            <button onClick={() => openModal('post')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: T.cyan, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <Plus style={{ width: 12, height: 12 }} /> New Post
            </button>
            <ProfileDropdown currentUser={currentUser} coaches={coaches} currentRole={selectedCoachId || (isCoach ? 'coach' : 'gym_owner')} onRoleSelect={handleRoleSelect} />
            <button onClick={() => setShowChat((o) => !o)} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${showChat ? T.cyanBrd : T.brd}`, background: showChat ? T.cyanDim : 'rgba(255,255,255,0.03)', color: showChat ? T.cyan : T.t3, cursor: 'pointer', transition: 'all 0.15s' }}>
              <MessageCircle style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </header>
        {selectedQuickMember && <MemberQuickModal member={selectedQuickMember} onClose={() => setSelectedQuickMember(null)} checkIns={checkIns} avatarMap={avatarMapFull} />}
        <main style={{ flex: 1, overflow: 'hidden', padding: '20px 22px 28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 1600, overflowY: 'auto' }}>
            {isGymOwner && selectedGym?.join_code && (
              <div onClick={() => setShowPoster(true)} style={{ marginBottom: 18, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', background: 'linear-gradient(135deg, #050c1a 0%, #071225 60%, #050810 100%)', border: '1px solid rgba(14,165,233,0.25)', position: 'relative', transition: 'border-color 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(14,165,233,0.55)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(14,165,233,0.25)'}>
                <div style={{ height: 3, background: 'linear-gradient(90deg,#0ea5e9,#06b6d4,#8b5cf6)', width: '100%' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 22px' }}>
                  <div style={{ background: '#fff', borderRadius: 10, padding: 8, flexShrink: 0, boxShadow: '0 0 0 1px rgba(14,165,233,0.3)' }}>
                    <QRCode value={`${window.location.origin}/Gyms?joinCode=${selectedGym.join_code}`} size={60} level="H" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 4 }}>Member Join Code</div>
                    <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '0.22em', color: '#fff', fontFamily: "'Courier New', monospace", lineHeight: 1 }}>{selectedGym.join_code}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>Scan the QR or enter this code in the CoStride app</div>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#38bdf8', fontSize: 12, fontWeight: 700 }}>
                      <QrCode style={{ width: 12, height: 12 }} /> View Flyer
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Print · Download · Share</div>
                  </div>
                </div>
              </div>
            )}
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
