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
    <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
      <style>{`@keyframes _tab-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: '_tab-spin 0.7s linear infinite' }} />
    </div>);
}

const D = {
  bgBase: '#080e18',
  bgSidebar: '#070c16',
  bgSurface: '#0c1422',
  bgHover: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.07)',
  borderHi: 'rgba(255,255,255,0.12)',
  divider: 'rgba(255,255,255,0.05)',
  blue: '#3b82f6',
  blueDim: 'rgba(59,130,246,0.10)',
  blueBrd: 'rgba(59,130,246,0.22)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.08)',
  redBrd: 'rgba(239,68,68,0.22)',
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.08)',
  amberBrd: 'rgba(245,158,11,0.22)',
  green: '#10b981',
  greenDim: 'rgba(16,185,129,0.08)',
  greenBrd: 'rgba(16,185,129,0.20)',
  t1: '#f1f5f9',
  t2: '#94a3b8',
  t3: '#475569',
  t4: '#2d3f55'
};

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


function injectDashCSS() {
  if (typeof document === 'undefined' || document.getElementById('dash-root-css')) return;
  const el = document.createElement('style');
  el.id = 'dash-root-css';
  el.textContent = DASH_CSS_TEXT;
  document.head.appendChild(el);
}

const DASH_CSS_TEXT = `
  .dash-root, .dash-root * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; box-sizing: border-box; }
  .dash-root {
    --bg:       #080e18;
    --sidebar:  #070c16;
    --surface:  #0c1422;
    --border:   rgba(255,255,255,0.07);
    --border-hi:rgba(255,255,255,0.12);
    --blue:     #3b82f6;
    --text1:    #f1f5f9;
    --text2:    #94a3b8;
    --text3:    #475569;
    --red:      #ef4444;
    --amber:    #f59e0b;
    --green:    #10b981;
  }

  .dash-root ::-webkit-scrollbar { width: 3px; height: 3px; }
  .dash-root ::-webkit-scrollbar-track { background: transparent; }
  .dash-root ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }

  .dash-root .nav-item {
    display: flex; align-items: center; width: 100%;
    border: none; background: transparent; cursor: pointer;
    border-left: 2px solid transparent;
    border-radius: 0 8px 8px 0;
    color: #475569;
    font-size: 13px; font-weight: 500;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .dash-root .nav-item:hover {
    background: rgba(255,255,255,0.03);
    color: #94a3b8;
  }
  .dash-root .nav-item.active {
    background: rgba(59,130,246,0.08);
    color: #3b82f6;
    border-left-color: #3b82f6;
    font-weight: 700;
  }

  .dash-root .stat-card {
    background: #0c1422;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 20px 20px;
    position: relative; overflow: hidden;
    transition: border-color 0.15s;
  }
  .dash-root .stat-card:hover { border-color: rgba(255,255,255,0.12); }
  .dash-root .stat-num {
    font-size: 32px; font-weight: 800;
    letter-spacing: -0.04em; line-height: 1;
    color: #f1f5f9; margin: 8px 0 5px;
  }
  .dash-root .stat-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.10em; color: #475569;
  }
  .dash-root .stat-sub {
    font-size: 11px; color: #475569;
    display: flex; align-items: center; gap: 5px;
  }

  .dash-root .member-row { transition: background 0.10s; cursor: pointer; }
  .dash-root .member-row:hover { background: rgba(255,255,255,0.02); }

  .dash-root .priority-row {
    border-left: 2px solid transparent;
    border-radius: 0 8px 8px 0;
    transition: background 0.12s, border-color 0.12s;
  }
  .dash-root .priority-row:hover {
    background: rgba(255,255,255,0.025);
    border-left-color: rgba(239,68,68,0.4);
  }

  .dash-root .filter-tab {
    color: #475569; border-radius: 7px; border: 1px solid transparent;
    transition: all 0.12s; cursor: pointer; background: none;
    font-family: inherit;
  }
  .dash-root .filter-tab:hover { color: #94a3b8; background: rgba(255,255,255,0.03); }
  .dash-root .filter-tab.active {
    color: #3b82f6;
    background: rgba(59,130,246,0.08);
    border-color: rgba(59,130,246,0.20);
  }

  @keyframes dashFadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: none; }
  }
  .dash-root .fade-up { animation: dashFadeUp 0.28s ease both; }

  .dash-root .pill         { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 5px; font-size: 10.5px; font-weight: 700; white-space: nowrap; border: 1px solid; }
  .dash-root .pill-blue    { color: #3b82f6;  background: rgba(59,130,246,0.10);  border-color: rgba(59,130,246,0.22);  }
  .dash-root .pill-green   { color: #10b981; background: rgba(16,185,129,0.08);  border-color: rgba(16,185,129,0.20);  }
  .dash-root .pill-red     { color: #ef4444;   background: rgba(239,68,68,0.08);   border-color: rgba(239,68,68,0.22);   }
  .dash-root .pill-amber   { color: #f59e0b; background: rgba(245,158,11,0.08);  border-color: rgba(245,158,11,0.22);  }
  .dash-root .pill-neutral { color: #475569;   background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.07); }
`;
injectDashCSS();

const Spark = ({ data = [], color = D.blue, height = 32 }) => {
  if (!data.length) return null;
  const w = 100,h = height;
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
    </svg>);
};

const Delta = ({ val }) => {
  const up = val > 0;
  const flat = val === 0;
  const color = flat ? D.t3 : up ? D.green : D.red;
  const bg = flat ? 'rgba(255,255,255,0.05)' : up ? D.greenDim : D.redDim;
  const brd = flat ? D.border : up ? D.greenBrd : D.redBrd;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      fontSize: 10, fontWeight: 700, padding: '2px 6px',
      borderRadius: 5, background: bg, color,
      border: `1px solid ${brd}`
    }}>
      {flat ? '—' : up ? '+' : ''}{val}%
    </span>);
};

function KpiCard({ icon: Icon, label, value, sub, subColor, valueColor, footerBar, footerColor, trend }) {
  const valColor = valueColor || D.t1;
  const barColor = footerColor || D.blue;
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="stat-label">{label}</span>
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon style={{ width: 12, height: 12, color: D.t3 }} />
        </div>
      </div>
      <div className="stat-num" style={{ color: valColor }}>{value}</div>
      <div className="stat-sub" style={{ color: subColor || D.t3 }}>
        <span>{sub}</span>
        {trend != null && <Delta val={trend} />}
      </div>
      {footerBar != null &&
      <div style={{ marginTop: 10, height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
          height: '100%', width: `${Math.min(100, footerBar)}%`,
          background: barColor, borderRadius: 99, transition: 'width 0.7s ease'
        }} />
        </div>
      }
    </div>);
}

function CoachKpiCard({ icon: Icon, label, value, sub, subColor, valueColor, footerBar, trend }) {
  return <KpiCard icon={Icon} label={label} value={value} sub={sub} subColor={subColor} valueColor={valueColor} footerBar={footerBar} trend={trend} />;
}

function DashCard({ children, style = {}, accentColor, title, action, onAction }) {
  return (
    <div style={{ background: D.bgSurface, border: `1px solid ${D.border}`, borderRadius: 12, position: 'relative', overflow: 'hidden', ...style }}>
      {accentColor &&
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, ${accentColor}50 0%, ${accentColor}18 60%, transparent 100%)`, pointerEvents: 'none' }} />
      }
      {title &&
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: D.t1 }}>{title}</span>
          {onAction &&
        <button onClick={onAction} style={{ fontSize: 11, fontWeight: 600, color: D.blue, background: D.blueDim, border: `1px solid ${D.blueBrd}`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {action || 'View all'}
            </button>
        }
        </div>
      }
      {children}
    </div>);
}

const CoachCard = DashCard;

function MiniAvatar({ name, src, size = 30 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: src ? 'transparent' : 'rgba(255,255,255,0.08)', border: `1.5px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: D.t2, overflow: 'hidden' }}>
      {src ? <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (name || '?').charAt(0).toUpperCase()}
    </div>);
}

const CLASS_TYPE_COLORS = { hiit: D.red, yoga: D.green, strength: D.blue, spin: D.blue, boxing: D.red, cardio: D.amber, pilates: D.green, default: D.blue };
function classColor(cls) {
  const n = (cls?.class_type || cls?.name || '').toLowerCase();
  return CLASS_TYPE_COLORS[Object.keys(CLASS_TYPE_COLORS).find((k) => n.includes(k)) || 'default'];
}

function MobileKpiStrip({ tab, isCoach, stats, posts, events, challenges, polls, coaches, classes, myClasses, allMemberships }) {
  const { todayCI = 0, activeThisWeek = 0, atRisk = 0, totalMembers = 0, newSignUps = 0, retentionRate = 0, monthChangePct = 0, activeThisMonth = 0 } = stats;
  let items;
  if (tab === 'overview') {
    items = [{ label: 'TODAY', value: todayCI, color: D.blue }, { label: 'WEEK', value: activeThisWeek, color: null }, { label: 'AT RISK', value: atRisk, color: atRisk > 0 ? D.red : null }, { label: 'MEMBERS', value: totalMembers, color: null }];
  } else if (tab === 'members') {
    items = [{ label: 'TOTAL', value: totalMembers, color: null }, { label: 'ACTIVE', value: activeThisWeek, color: null }, { label: 'AT RISK', value: atRisk, color: atRisk > 0 ? D.red : null }, { label: 'NEW', value: newSignUps, color: newSignUps > 0 ? D.green : null }];
  } else if (tab === 'content') {
    items = [{ label: 'POSTS', value: posts.length, color: null }, { label: 'EVENTS', value: events.length, color: null }, { label: 'CHALLENGES', value: challenges.length, color: null }, { label: 'POLLS', value: polls.length, color: null }];
  } else if (tab === 'analytics') {
    items = [{ label: 'RETENTION', value: retentionRate + '%', color: retentionRate >= 70 ? D.green : retentionRate >= 40 ? D.amber : D.red }, { label: '30-DAY Δ', value: (monthChangePct > 0 ? '+' : '') + monthChangePct + '%', color: monthChangePct > 0 ? D.green : monthChangePct < 0 ? D.red : null }, { label: 'ACTIVE', value: activeThisMonth, color: null }, { label: 'AT RISK', value: atRisk, color: atRisk > 0 ? D.red : null }];
  } else if (tab === 'engagement') {
    items = [{ label: 'MEMBERS', value: totalMembers, color: null }, { label: 'ACTIVE', value: activeThisWeek, color: null }, { label: 'AT RISK', value: atRisk, color: atRisk > 0 ? D.red : null }];
  } else if (tab === 'gym') {
    items = [{ label: 'COACHES', value: coaches.length, color: null }, { label: 'CLASSES', value: classes.length, color: null }, { label: 'MEMBERS', value: totalMembers, color: null }];
  } else if ((tab === 'today' || tab === 'schedule') && isCoach) {
    items = [{ label: 'CLASSES', value: myClasses.length, color: null }, { label: 'CLIENTS', value: allMemberships.length, color: null }];
  } else {
    return null;
  }
  return (
    <div style={{ flexShrink: 0, background: D.bgSurface, borderBottom: `1px solid ${D.border}`, display: 'flex' }}>
      {items.map((item, i) =>
      <React.Fragment key={item.label}>
          {i > 0 && <div style={{ width: 1, background: D.divider, alignSelf: 'stretch', margin: '7px 0' }} />}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '9px 2px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: item.color || D.t1 }}>{item.value}</div>
            <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: D.t4, marginTop: 3 }}>{item.label}</div>
          </div>
        </React.Fragment>
      )}
    </div>);
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
  const avatarMapFull = useMemo(() => avatarMap, [stats]);

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
    // Include members who have a booking with this coach
    const bookedClientIds = new Set(coachBookings.map(b => b.client_id).filter(Boolean));
    if (bookedClientIds.size > 0) {
      return allMemberships.filter(m => bookedClientIds.has(m.user_id));
    }
    // Fallback: filter by client_notes if available
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
  atRisk > 0 && { icon: AlertCircle, color: D.red, label: `${atRisk} members inactive 14+ days`, action: 'View members', fn: () => setTab('members') },
  !challenges.some((c) => c.status === 'active') && { icon: Trophy, color: D.amber, label: 'No active challenge running', action: 'Create one', fn: () => openModal('challenge') },
  polls.length === 0 && { icon: BarChart2, color: D.amber, label: 'No active polls', action: 'Create poll', fn: () => openModal('poll') },
  monthChangePct < 0 && { icon: TrendingDown, color: D.amber, label: 'Attendance down vs last month', action: 'View analytics', fn: () => setTab('analytics') }].
  filter(Boolean).slice(0, 4);

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

  const Splash = ({ children }) =>
  <div className="dash-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bgBase }}>
      <div style={{ background: D.bgSurface, border: `1px solid ${D.border}`, borderRadius: 16, padding: 36, maxWidth: 380, width: '100%', textAlign: 'center' }}>
        {children}
      </div>
    </div>;

  if (gymsError) return (
    <Splash>
      <X style={{ width: 26, height: 26, color: D.red, margin: '0 auto 12px' }} />
      <h2 style={{ color: D.t1, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Connection Error</h2>
      <p style={{ color: D.t3, fontSize: 13, marginBottom: 20 }}>{gymsError.message}</p>
      <button onClick={() => window.location.reload()} style={{ background: D.blue, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
    </Splash>);

  if (approvedGyms.length === 0 && pendingGyms.length > 0) return (
    <Splash>
      <Clock style={{ width: 26, height: 26, color: D.amber, margin: '0 auto 12px' }} />
      <h2 style={{ color: D.t1, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Pending Approval</h2>
      <p style={{ color: D.t3, fontSize: 13, marginBottom: 20 }}>Your gym <strong style={{ color: D.t1 }}>{pendingGyms[0].name}</strong> is under review. We'll notify you once it's approved.</p>
      <Link to={createPageUrl('Home')}><button style={{ background: 'rgba(255,255,255,0.06)', color: D.t1, border: `1px solid ${D.border}`, borderRadius: 9, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Back to Home</button></Link>
    </Splash>);

  if (myGyms.length === 0 && !isCoach) return (
    <Splash>
      <Dumbbell style={{ width: 26, height: 26, color: D.blue, margin: '0 auto 12px' }} />
      <h2 style={{ color: D.t1, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>No Gyms Yet</h2>
      <p style={{ color: D.t3, fontSize: 13, marginBottom: 20 }}>Register your gym to get started with the dashboard.</p>
      <Link to={createPageUrl('GymSignup')}><button style={{ background: D.blue, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Register Your Gym</button></Link>
    </Splash>);

  const sharedModals =
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
        <AlertDialogContent style={{ background: D.bgSurface, backdropFilter: 'blur(20px)', border: `1px solid ${D.redBrd}` }} className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: D.t1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}>
              <Trash2 style={{ width: 16, height: 16, color: D.red }} /> Delete Gym Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: D.t3, fontSize: 13 }}>
              Deletes <strong style={{ color: D.t1 }}>{selectedGym?.name}</strong> and all its data. <span style={{ color: D.red, fontWeight: 700 }}>This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: 'rgba(255,255,255,0.05)', color: D.t1, border: `1px solid ${D.border}` }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteGymM.mutate()} disabled={deleteGymM.isPending} style={{ background: D.red, color: '#fff', border: 'none' }}>
              {deleteGymM.isPending ? 'Deleting…' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={modal === 'deleteAccount'} onOpenChange={(v) => !v && closeModal()}>
        <AlertDialogContent style={{ background: D.bgSurface, backdropFilter: 'blur(20px)', border: `1px solid ${D.redBrd}` }} className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: D.t1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}>
              <Trash2 style={{ width: 16, height: 16, color: D.red }} /> Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: D.t3, fontSize: 13 }}>
              Deletes your account, all gyms, and personal data. <span style={{ color: D.red, fontWeight: 700 }}>This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: 'rgba(255,255,255,0.05)', color: D.t1, border: `1px solid ${D.border}` }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAccountM.mutate()} disabled={deleteAccountM.isPending} style={{ background: D.red, color: '#fff', border: 'none' }}>
              {deleteAccountM.isPending ? 'Deleting…' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GymJoinPoster gym={selectedGym} open={showPoster} onClose={() => setShowPoster(false)} />
      <MemberChatPanel open={showChat} onClose={() => setShowChat(false)} allMemberships={allMemberships} currentUser={currentUser} avatarMap={memberAvatarMapResolved} />
    </>;

  // ── MOBILE ────────────────────────────────────────────────────────────────
  if (isMobile) return (
    <div className="dash-root" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: D.bgBase, overflow: 'hidden' }}>
      <header style={{ flexShrink: 0, background: D.bgSidebar, borderBottom: `1px solid ${D.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: D.bgSurface, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell style={{ width: 14, height: 14, color: D.blue }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: D.t1, letterSpacing: '-0.02em', lineHeight: 1 }}>{selectedGym?.name || 'Dashboard'}</div>
            <div style={{ fontSize: 9, color: D.t3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>{roleLabel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {atRisk > 0 &&
          <button onClick={() => setTab('members')} style={{ background: D.redDim, color: D.red, border: `1px solid ${D.redBrd}`, borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '4px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              <AlertTriangle style={{ width: 9, height: 9 }} />{atRisk}
            </button>
          }
          <button onClick={() => openModal('qrScanner')} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`, color: D.t3, cursor: 'pointer' }}>
            <QrCode style={{ width: 14, height: 14 }} />
          </button>
          <button onClick={() => openModal('post')} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.blue, border: 'none', color: '#fff', cursor: 'pointer' }}>
            <Plus style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </header>

      <MobileKpiStrip tab={tab} isCoach={isCoach} stats={stats} posts={posts} events={events} challenges={challenges} polls={polls} coaches={coaches} classes={classes} myClasses={myClasses} allMemberships={effectiveMemberships} />

      <main style={{ flex: 1, overflow: 'auto', padding: '12px 12px 80px', WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
        <div style={{ maxWidth: '100%' }}>
          <Suspense fallback={<TabLoader />}>
            {tabPanels.map((p) =>
            <div key={p.id} style={{ display: p.id === tab ? 'block' : 'none' }}>{p.content}</div>
            )}
          </Suspense>
        </div>
      </main>

      <nav style={{ flexShrink: 0, background: D.bgSidebar, borderTop: `1px solid ${D.border}`, display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map((item) => {
          const active = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '11px 4px 9px', border: 'none', background: active ? 'rgba(59,130,246,0.06)' : 'transparent', cursor: 'pointer', color: active ? D.blue : D.t4, transition: 'color 0.15s, background 0.15s', fontFamily: 'inherit', position: 'relative' }}>
              {active && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, background: D.blue, borderRadius: '0 0 2px 2px' }} />}
              <item.icon style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, letterSpacing: '0.03em' }}>{item.label}</span>
            </button>);
        })}
      </nav>
      {sharedModals}
    </div>);

  // ── DESKTOP ───────────────────────────────────────────────────────────────
  return (
    <div className="dash-root" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: D.bgBase }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: collapsed ? 56 : 220, flexShrink: 0, height: '100%', overflow: 'hidden',
        background: D.bgSidebar, borderRight: `1px solid ${D.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)'
      }}>

        <div style={{ padding: collapsed ? '13px 0' : '13px 14px', borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
          {collapsed ?
          <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
              onClick={() => setCollapsed(false)}
              style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: D.t3, cursor: 'pointer', transition: 'color 0.12s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = D.t1}
              onMouseLeave={(e) => e.currentTarget.style.color = D.t3}>
                <Menu style={{ width: 16, height: 16 }} />
              </button>
            </div> :
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: D.bgSurface, border: `2px solid ${D.blue}`, boxShadow: '0 0 8px rgba(59,130,246,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {selectedGym?.logo_url || selectedGym?.image_url ?
              <img src={selectedGym.logo_url || selectedGym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
              <Dumbbell style={{ width: 14, height: 14, color: D.blue }} />
              }
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: D.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
                  {selectedGym?.name || 'Dashboard'}
                </div>
                <div style={{ fontSize: 9, color: D.t3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>
                  {roleLabel}
                </div>
              </div>
              <button
              onClick={() => setCollapsed(true)}
              style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: D.t3, cursor: 'pointer', transition: 'color 0.12s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = D.t1}
              onMouseLeave={(e) => e.currentTarget.style.color = D.t3}>
                <Menu style={{ width: 14, height: 14 }} />
              </button>
            </div>
          }

          {!collapsed && approvedGyms.length > 1 &&
          <div style={{ position: 'relative', marginTop: 10 }}>
              <button onClick={() => setGymOpen((o) => !o)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}`, color: D.t2, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedGym?.name}</span>
                <ChevronDown style={{ width: 11, height: 11, flexShrink: 0, transform: gymOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }} />
              </button>
              {gymOpen &&
            <div style={{ position: 'absolute', left: 0, right: 0, top: '110%', borderRadius: 10, overflow: 'hidden', background: '#060c18', border: `1px solid ${D.borderHi}`, zIndex: 20, boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
                  {approvedGyms.map((g) =>
              <button key={g.id} onClick={() => {setSelectedGym(g);setGymOpen(false);}}
              style={{ width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 12, fontWeight: 600, background: selectedGym?.id === g.id ? D.blueDim : 'transparent', color: selectedGym?.id === g.id ? D.blue : D.t2, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {g.name}
                    </button>
              )}
                </div>
            }
            </div>
          }
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {!collapsed &&
          <div style={{ fontSize: 9, fontWeight: 700, color: D.t4, letterSpacing: '0.10em', textTransform: 'uppercase', padding: '0 16px', marginBottom: 4 }}>
              Navigation
            </div>
          }
          {NAV.map((item) => {
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
              className={`nav-item ${active ? 'active' : ''}`}
              style={{ gap: collapsed ? 0 : 9, padding: collapsed ? '10px 0' : '8px 14px', justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: 1 }}>
                <item.icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
              </button>);
          })}
        </nav>

        {/* Upgrade prompt */}
        {!collapsed && isGymOwner &&
        <div style={{ padding: '0 10px 10px', flexShrink: 0 }}>
            <Link to={createPageUrl('Plus')}>
              <div style={{ padding: '11px 13px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}`, cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = D.borderHi}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = D.border}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                  <Crown style={{ width: 11, height: 11, color: D.t3 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: D.t2 }}>Retention Pro</span>
                </div>
                <div style={{ fontSize: 10, color: D.t4 }}>Advanced analytics · From £49.99/mo</div>
              </div>
            </Link>
          </div>
        }

        {/* Footer */}
        <div style={{ flexShrink: 0, borderTop: `1px solid ${D.border}` }}>
          {!collapsed &&
          <div style={{ padding: '10px 10px 4px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: D.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, paddingLeft: 4 }}>Links</div>
              {[
            { icon: Eye, label: 'View Gym Page', to: createPageUrl('GymCommunity') + '?id=' + selectedGym?.id },
            { icon: Users, label: 'Member View', to: createPageUrl('Home') }].
            map((l, i) =>
            <Link key={i} to={l.to}>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', border: 'none', background: 'transparent', color: D.t4, fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 7, marginBottom: 1, transition: 'color 0.12s', fontFamily: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.color = D.t2}
              onMouseLeave={(e) => e.currentTarget.style.color = D.t4}>
                    <l.icon style={{ width: 12, height: 12 }} /><span>{l.label}</span>
                  </button>
                </Link>
            )}
            </div>
          }
          {collapsed &&
          <div style={{ padding: '8px 0' }}>
              {[
            { icon: Eye, to: createPageUrl('GymCommunity') + '?id=' + selectedGym?.id },
            { icon: Users, to: createPageUrl('Home') }].
            map((l, i) =>
            <Link key={i} to={l.to}>
                  <button style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '9px 0', border: 'none', background: 'transparent', color: D.t4, cursor: 'pointer', transition: 'color 0.12s', fontFamily: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.color = D.t2}
              onMouseLeave={(e) => e.currentTarget.style.color = D.t4}>
                    <l.icon style={{ width: 13, height: 13 }} />
                  </button>
                </Link>
            )}
            </div>
          }
          <div style={{ padding: collapsed ? '4px 0 14px' : '0 10px 14px' }}>
            <button onClick={() => base44.auth.logout()}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '9px 0' : '7px 8px', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', background: 'transparent', color: D.red, fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 7, opacity: 0.6, transition: 'opacity 0.12s', fontFamily: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}>
              <LogOut style={{ width: 13, height: 13 }} />
              {!collapsed && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* ── TOP BAR — date on the left, actions on the right ── */}
        <header style={{ height: 54, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: D.bgSidebar, borderBottom: `1px solid ${D.border}` }}>

          {/* LEFT: live date, shown on every tab */}
          <div style={{ fontSize: 13, fontWeight: 600, color: D.t2, letterSpacing: '-0.01em' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>

          {/* RIGHT: action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isGymOwner && selectedGym?.join_code &&
            <button onClick={() => setShowPoster(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}`, color: D.t2, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'border-color 0.12s', fontFamily: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = D.borderHi}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = D.border}>
                <QrCode style={{ width: 11, height: 11 }} />
                <span style={{ fontFamily: 'monospace', letterSpacing: '0.10em' }}>{selectedGym.join_code}</span>
              </button>
            }

            {atRisk > 0 &&
            <button onClick={() => setTab('members')}
            style={{ background: D.redDim, color: D.red, border: `1px solid ${D.redBrd}`, borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '5px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                <AlertTriangle style={{ width: 11, height: 11 }} />{atRisk} at risk
              </button>
            }

            <button onClick={() => openModal('qrScanner')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: D.t2, border: `1px solid ${D.border}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit' }}
            onMouseEnter={(e) => {e.currentTarget.style.color = D.t1;e.currentTarget.style.borderColor = D.borderHi;}}
            onMouseLeave={(e) => {e.currentTarget.style.color = D.t2;e.currentTarget.style.borderColor = D.border;}}>
              <QrCode style={{ width: 12, height: 12 }} /> Scan QR
            </button>

            <button onClick={() => openModal('post')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: D.blue, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.12s', fontFamily: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
              <Plus style={{ width: 12, height: 12 }} /> New Post
            </button>

            <ProfileDropdown currentUser={currentUser} coaches={coaches} currentRole={selectedCoachId || (isCoach ? 'coach' : 'gym_owner')} onRoleSelect={handleRoleSelect} />

            <button
              onClick={() => setShowChat((o) => !o)}
              style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: showChat ? D.blueDim : 'rgba(255,255,255,0.03)', border: `1px solid ${showChat ? D.blueBrd : D.border}`, color: showChat ? D.blue : D.t3, cursor: 'pointer', position: 'relative', transition: 'all 0.12s', fontFamily: 'inherit' }}
              onMouseEnter={(e) => {if (!showChat) {e.currentTarget.style.color = D.t1;e.currentTarget.style.borderColor = D.borderHi;}}}
              onMouseLeave={(e) => {if (!showChat) {e.currentTarget.style.color = D.t3;e.currentTarget.style.borderColor = D.border;}}}>
              <MessageCircle style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'hidden', padding: '20px 22px 28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 1600, overflowY: 'auto', paddingRight: 2 }}>
            <Suspense fallback={<TabLoader />}>
              {tabPanels.map((p) =>
              <div key={p.id} style={{ display: p.id === tab ? 'block' : 'none' }}>{p.content}</div>
              )}
            </Suspense>
          </div>
        </main>
      </div>

      {sharedModals}
    </div>);
}