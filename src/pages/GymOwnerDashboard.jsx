import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  TrendingDown, Users, Trophy, AlertCircle, BarChart2,
  Eye, Menu, LayoutDashboard, FileText, BarChart3, Settings,
  LogOut, ChevronDown, AlertTriangle, QrCode, MessageSquarePlus,
  Plus, Dumbbell, Clock, Crown, Trash2, X, Download, Send, Bell,
  Sun, Zap, TrendingUp, Activity, Calendar, CheckCircle,
  MessageCircle, Star, UserCheck, Flame, ChevronRight, Pencil
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
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
import EditGymLogoModal     from '../components/gym/EditGymLogoModal';
import EditPricingModal     from '../components/gym/EditPricingModal';
import QRCode                from 'react-qr-code';

import TabOverview   from '../components/dashboard/TabOverview';
import TabMembersComponent from '../components/dashboard/TabMembers';
import TabContentComponent from '../components/dashboard/TabContent';
import TabAnalyticsComponent from '../components/dashboard/TabAnalytics';
import TabGym        from '../components/dashboard/TabGym';
import TabCoachOverview  from '../components/dashboard/TabCoachOverview';
import TabCoachSchedule  from '../components/dashboard/TabCoachSchedule';
import TabCoachMembers   from '../components/dashboard/TabCoachMembers';
import TabCoachContent   from '../components/dashboard/TabCoachContent';
import TabCoachAnalytics from '../components/dashboard/TabCoachAnalytics';

// ── Nav filtered by role ──────────────────────────────────────────────────────
const ALL_NAV = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard, roles: ['gym_owner', 'coach'] },
  { id: 'schedule',  label: 'Schedule',  icon: Calendar,        roles: ['coach'] },
  { id: 'members',   label: 'Members',   coachLabel: 'Clients', icon: Users,           roles: ['gym_owner', 'coach'] },
  { id: 'content',   label: 'Content',   icon: FileText,        roles: ['gym_owner', 'coach'] },
  { id: 'analytics', label: 'Analytics', icon: BarChart3,       roles: ['gym_owner', 'coach'] },
  { id: 'gym',       label: 'Settings',  icon: Settings,        roles: ['gym_owner'] },
];

// ── Sparkline ─────────────────────────────────────────────────────────────────
const Spark = ({ data = [], color = '#38bdf8', height = 32 }) => {
  if (!data.length) return null;
  const w = 100, h = height;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `${pts} ${w},${h} 0,${h}`;
  const id = `sg-${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block', marginTop: 8 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={area} fill={`url(#${id})`} />
    </svg>
  );
};

// ── Delta badge ───────────────────────────────────────────────────────────────
const Delta = ({ val }) => {
  const up = val > 0, flat = val === 0;
  const color = flat ? '#64748b' : up ? '#34d399' : '#f87171';
  const bg    = flat ? 'rgba(100,116,139,0.1)' : up ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: bg, color }}>
      {flat ? '→' : up ? '↑' : '↓'} {Math.abs(val)}%
    </span>
  );
};

// ── Coach KPI card ────────────────────────────────────────────────────────────
function CoachKpiCard({ icon: Icon, label, value, sub, subColor = '#64748b', accentColor = '#a78bfa', footerBar, trend }) {
  return (
    <div style={{ borderRadius: 16, padding: '16px 18px', background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
      <div style={{ position: 'absolute', bottom: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: accentColor, opacity: 0.07, filter: 'blur(24px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: `linear-gradient(90deg,transparent,${accentColor}45,transparent)`, pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#3a5070', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: `${accentColor}18`, border: `1px solid ${accentColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 12, height: 12, color: accentColor }}/>
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: subColor, fontWeight: 600 }}>{sub}</span>
        {trend != null && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: trend > 0 ? 'rgba(52,211,153,0.1)' : trend < 0 ? 'rgba(248,113,113,0.1)' : 'rgba(100,116,139,0.1)', color: trend > 0 ? '#34d399' : trend < 0 ? '#f87171' : '#64748b' }}>
            {trend > 0 ? `↑${trend}%` : trend < 0 ? `↓${Math.abs(trend)}%` : '→'}
          </span>
        )}
      </div>
      {footerBar != null && (
        <div style={{ marginTop: 10, height: 3, borderRadius: 99, background: `${accentColor}18`, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, footerBar)}%`, background: `linear-gradient(90deg,${accentColor},${accentColor}cc)`, borderRadius: 99, transition: 'width 0.8s ease' }}/>
        </div>
      )}
    </div>
  );
}

// ── Coach card shell ──────────────────────────────────────────────────────────
function CoachCard({ children, style = {}, accent, title, action, onAction }) {
  return (
    <div style={{ background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, position: 'relative', overflow: 'hidden', ...style }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: `linear-gradient(90deg,transparent,${accent}35,transparent)`, pointerEvents: 'none' }}/>}
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>{title}</span>
          {onAction && <button onClick={onAction} style={{ fontSize: 11, fontWeight: 700, color: accent || '#a78bfa', background: `${accent || '#a78bfa'}12`, border: `1px solid ${accent || '#a78bfa'}25`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>{action || 'View all'}</button>}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Class type helper ─────────────────────────────────────────────────────────
const CLASS_TYPE_COLORS = { hiit: '#f87171', yoga: '#34d399', strength: '#818cf8', spin: '#38bdf8', boxing: '#fb923c', cardio: '#fb7185', pilates: '#c084fc', default: '#a78bfa' };
function classColor(cls) {
  const n = (cls?.class_type || cls?.name || '').toLowerCase();
  return CLASS_TYPE_COLORS[Object.keys(CLASS_TYPE_COLORS).find(k => n.includes(k)) || 'default'];
}

// ── Mini avatar ───────────────────────────────────────────────────────────────
function MiniAvatar({ name, src, size = 30, color = '#a78bfa' }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: src ? 'transparent' : `linear-gradient(135deg,${color}80,${color}40)`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color, flexShrink: 0, overflow: 'hidden' }}>
      {src ? <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

// ── Coach tabs live in separate files (see components/dashboard/TabCoach*.jsx) ─
//   TabCoachOverview → components/dashboard/TabCoachOverview.jsx
//   TabCoachSchedule → components/dashboard/TabCoachSchedule.jsx
//   TabCoachMembers  → components/dashboard/TabCoachMembers.jsx

// ── GRADIENT OVERRIDE ─────────────────────────────────────────────────────────
// ── GRADIENT OVERRIDE ─────────────────────────────────────────────────────────
const GRADIENT_OVERRIDE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;0,9..40,900&family=DM+Mono:wght@400;500&display=swap');
  .dash-root, .dash-root * { font-family: 'DM Sans', system-ui, sans-serif !important; }
  .dash-root code, .dash-root .mono { font-family: 'DM Mono', monospace !important; }
  .dash-root {
    --bg: #060c18; --sidebar: #0a1628; --card: #0c1a2e; --card2: #0d1b2e;
    --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.12);
    --text1: #f0f4f8; --text2: #8ba0b8; --text3: #3a5070;
    --cyan: #38bdf8; --green: #34d399; --red: #f87171; --purple: #a78bfa; --amber: #fbbf24;
  }
  .dash-root .card-hover { position: relative !important; overflow: hidden !important; transition: border-color 0.2s ease, transform 0.2s ease !important; }
  .dash-root .card-hover:hover { border-color: rgba(56,189,248,0.18) !important; transform: translateY(-1px) !important; }
  .dash-root .card-hover::before { content: ''; position: absolute; top: 0; left: 16px; right: 16px; height: 1px; background: linear-gradient(90deg, transparent, rgba(56,189,248,0.22), transparent); pointer-events: none; }
  .dash-root .stat-card { position: relative; overflow: hidden; border-radius: 14px !important; padding: 16px 18px !important; background: #0c1a2e !important; border: 1px solid rgba(255,255,255,0.07) !important; transition: border-color 0.2s ease, transform 0.15s ease !important; cursor: default; }
  .dash-root .stat-card:hover { border-color: rgba(56,189,248,0.2) !important; transform: translateY(-2px) !important; }
  .dash-root .stat-card::before { content: ''; position: absolute; top: 0; left: 16px; right: 16px; height: 1px; background: linear-gradient(90deg, transparent, rgba(56,189,248,0.28), transparent); pointer-events: none; }
  .dash-root .stat-num { font-size: 30px !important; font-weight: 900 !important; letter-spacing: -0.04em !important; line-height: 1 !important; color: #f0f4f8 !important; margin: 6px 0 3px !important; }
  .dash-root .stat-label { font-size: 9px !important; font-weight: 800 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; color: var(--text3) !important; display: flex !important; align-items: center !important; justify-content: space-between !important; }
  .dash-root .stat-icon { width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .dash-root .stat-sub { font-size: 11px !important; color: var(--text3) !important; display: flex !important; align-items: center !important; gap: 5px !important; }
  .dash-root .nav-item { border-left: 3px solid transparent !important; border-radius: 0 10px 10px 0 !important; padding-left: 9px !important; transition: all 0.14s ease !important; }
  .dash-root .nav-item:not(.active) { color: #5a7a96 !important; }
  .dash-root .nav-item:not(.active):hover { color: #c2d4e8 !important; background: rgba(255,255,255,0.04) !important; border-left-color: rgba(56,189,248,0.2) !important; }
  .dash-root .nav-item.active { background: rgba(56,189,248,0.08) !important; color: #38bdf8 !important; border-left-color: #38bdf8 !important; font-weight: 800 !important; }
  .dash-root .qa-btn { border-left: 2px solid transparent !important; transition: all 0.14s ease !important; }
  .dash-root .qa-btn:hover { background: rgba(255,255,255,0.06) !important; border-left-color: rgba(56,189,248,0.45) !important; transform: translateX(2px); }
  .dash-root .priority-row { border-left: 2px solid transparent !important; border-radius: 10px !important; transition: all 0.14s ease !important; }
  .dash-root .priority-row:hover { background: rgba(255,255,255,0.03) !important; border-left-color: rgba(56,189,248,0.35) !important; }
  .dash-root .filter-tab { color: #5a7a96 !important; transition: all 0.14s ease !important; }
  .dash-root .filter-tab:hover { color: #c2d4e8 !important; }
  .dash-root .filter-tab.active { color: #38bdf8 !important; background: rgba(56,189,248,0.1) !important; border-color: rgba(56,189,248,0.25) !important; }
  .dash-root .member-row { transition: background 0.12s ease !important; }
  .dash-root .member-row:hover { background: rgba(255,255,255,0.025) !important; cursor: pointer; }
  .dash-root .panel-glow::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(56,189,248,0.3), transparent); pointer-events: none; }
  .dash-root ::-webkit-scrollbar { width: 4px; height: 4px; }
  .dash-root ::-webkit-scrollbar-track { background: transparent; }
  .dash-root ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
  .dash-root ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
  .dash-root .pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .dash-root .pill-cyan  { background: rgba(56,189,248,0.1);  color: #38bdf8; }
  .dash-root .pill-green { background: rgba(52,211,153,0.1);  color: #34d399; }
  .dash-root .pill-red   { background: rgba(248,113,113,0.1); color: #f87171; }
  .dash-root .pill-amber { background: rgba(251,191,36,0.1);  color: #fbbf24; }
  @keyframes dashFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .dash-root .fade-up { animation: dashFadeUp 0.35s ease both; }
`;

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function GymOwnerDashboard() {
  const [tab, setTab]               = useState('overview');
  const [collapsed, setCollapsed]   = useState(false);
  const [isMobile, setIsMobile]     = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  const [selectedGym, setSelectedGym] = useState(null);
  const [gymOpen, setGymOpen]       = useState(false);
  const [modal, setModal]           = useState(null);
  const [showPoster, setShowPoster] = useState(false);
  const [chartRange, setChartRange] = useState(7);
  const [leaderboardView, setLeaderboardView] = useState('checkins');
  const [atRiskDays, setAtRiskDays] = useState(14);
  const [memberFilter, setMemberFilter] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSort, setMemberSort]     = useState('recentlyActive');
  const [memberPage, setMemberPage]     = useState(1);
  const [memberPageSize]                = useState(10);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const openModal  = (name) => {
    if (name === 'message') { setTab('members'); return; }
    setModal(name);
  };
  const closeModal = ()     => setModal(null);
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000 });
  useEffect(() => { if (currentUser && !currentUser.onboarding_completed) navigate(createPageUrl('Onboarding')); }, [currentUser, navigate]);

  const [roleOverride, setRoleOverride] = useState(() => localStorage.getItem('dashRoleOverride') || null);
  const toggleRole = () => {
    const next = roleOverride === 'coach' ? 'gym_owner' : roleOverride === 'gym_owner' ? null : 'coach';
    if (next) localStorage.setItem('dashRoleOverride', next); else localStorage.removeItem('dashRoleOverride');
    setRoleOverride(next);
  };
  const effectiveAccountType = roleOverride || currentUser?.account_type;
  const isCoach    = effectiveAccountType === 'coach';
  const isGymOwner = effectiveAccountType === 'gym_owner';
  const dashRole   = isCoach ? 'coach' : 'gym_owner';
  const roleLabel  = isCoach ? 'Coach' : 'Gym Owner';
  const NAV        = ALL_NAV.filter(item => item.roles.includes(dashRole)).map(item => ({
    ...item,
    label: isCoach && item.coachLabel ? item.coachLabel : item.label,
  }));

  const { data: gyms = [], error: gymsError } = useQuery({
    queryKey: ['ownerGyms', currentUser?.email],
    queryFn:  async () => {
      if (isCoach) {
        const coachRecords = await base44.entities.Coach.filter({ user_email: currentUser.email });
        if (!coachRecords.length) return [];
        const gymIds = [...new Set(coachRecords.map(c => c.gym_id))];
        const results = await Promise.allSettled(gymIds.map(id => base44.entities.Gym.filter({ id })));
        return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
      }
      return base44.entities.Gym.filter({ owner_email: currentUser.email });
    },
    enabled: !!currentUser?.email, retry: 3, staleTime: 5 * 60 * 1000,
  });

  const myGyms       = isCoach ? gyms : gyms.filter(g => g.owner_email === currentUser?.email);
  const approvedGyms = myGyms.filter(g => g.status === 'approved');
  const pendingGyms  = isCoach ? [] : myGyms.filter(g => g.status === 'pending');
  useEffect(() => { if (approvedGyms.length > 0 && !selectedGym) setSelectedGym(approvedGyms[0]); }, [approvedGyms, selectedGym]);
  useEffect(() => { const iv = setInterval(() => queryClient.invalidateQueries({ queryKey: ['ownerGyms'] }), 10000); return () => clearInterval(iv); }, [queryClient]);

  const qo = { staleTime: 3 * 60 * 1000, placeholderData: p => p };
  const on  = !!selectedGym;
  const { data: rewards    = [] }     = useQuery({ queryKey: ['rewards',    selectedGym?.id], queryFn: () => base44.entities.Reward.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: classes    = [] }     = useQuery({ queryKey: ['classes',    selectedGym?.id], queryFn: () => base44.entities.GymClass.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: coaches    = [] }     = useQuery({ queryKey: ['coaches',    selectedGym?.id], queryFn: () => base44.entities.Coach.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: events     = [] }     = useQuery({ queryKey: ['events',     selectedGym?.id], queryFn: () => base44.entities.Event.filter({ gym_id: selectedGym.id }, '-event_date'), enabled: on, ...qo });
  const { data: posts      = [] }     = useQuery({ queryKey: ['posts',      selectedGym?.id], queryFn: () => base44.entities.Post.filter({ member_id: selectedGym.id }, '-created_date', 20), enabled: on, ...qo });
  const { data: challenges = [] }     = useQuery({ queryKey: ['challenges', selectedGym?.id], queryFn: () => base44.entities.Challenge.filter({ gym_id: selectedGym.id }, '-created_date'), enabled: on, ...qo });
  const { data: polls      = [] }     = useQuery({ queryKey: ['polls',      selectedGym?.id], queryFn: () => base44.entities.Poll.filter({ gym_id: selectedGym.id, status: 'active' }, '-created_date'), enabled: on, ...qo });

  const { data: stats = {} } = useQuery({
    queryKey: ['dashboardStats', selectedGym?.id, atRiskDays, chartRange],
    queryFn: () => base44.functions.invoke('getDashboardStats', { gymId: selectedGym.id, atRiskDays, chartRange }).then(r => r.data),
    enabled: on,
    staleTime: 3 * 60 * 1000,
    placeholderData: p => p,
  });

  const checkIns        = stats.recentCheckIns || [];
  const allMemberships  = stats.membersWithActivity || [];

  const inv     = (...keys) => { keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k, selectedGym?.id] })); queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedGym?.id] }); };
  const invGyms = () => queryClient.invalidateQueries({ queryKey: ['gyms'] });

  const createRewardM    = useMutation({ mutationFn: d  => base44.entities.Reward.create(d),     onSuccess: () => inv('rewards') });
  const deleteRewardM    = useMutation({ mutationFn: id => base44.entities.Reward.delete(id),    onSuccess: () => inv('rewards') });
  const createClassM     = useMutation({ mutationFn: d  => base44.entities.GymClass.create(d),   onSuccess: () => inv('classes') });
  const deleteClassM     = useMutation({ mutationFn: id => base44.entities.GymClass.delete(id),  onSuccess: () => inv('classes') });
  const updateClassM     = useMutation({ mutationFn: ({id,data}) => base44.entities.GymClass.update(id, data), onSuccess: () => inv('classes') });
  const createCoachM     = useMutation({ mutationFn: d  => base44.entities.Coach.create(d),      onSuccess: () => inv('coaches') });
  const deleteCoachM     = useMutation({ mutationFn: id => base44.entities.Coach.delete(id),     onSuccess: () => inv('coaches') });
  const updateCoachM     = useMutation({ mutationFn: ({id,data}) => base44.entities.Coach.update(id, data), onSuccess: () => inv('coaches') });
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

  const now = new Date();

  // All computed stats from backend
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
    satVsAvg = 0, chartDays = [], streaks = [], recentActivity = [],
    avatarMap = {},
    // Analytics pre-computed
    weekTrend = [], peakHours = [], busiestDays = [],
    returnRate = 0, dailyAvg = 0, engagementSegments = {},
    retentionFunnel = [], dropOffBuckets = [], churnSignals = [], week1ReturnTrend = [],
    // Overview pre-computed
    retentionBreakdown = {}, week1ReturnRate = {}, newNoReturnCount = 0,
  } = stats;

  const ci30 = [];  // not needed on frontend anymore
  const avatarMapFull = useMemo(() => avatarMap, [stats]);

  // Classes this coach teaches
  const myClasses = useMemo(() => {
    if (!isCoach || !currentUser) return classes;
    return classes.filter(c =>
      c.instructor === currentUser.full_name ||
      c.instructor === currentUser.email ||
      c.coach_name === currentUser.full_name ||
      c.coach_email === currentUser.email ||
      c.coach_id === currentUser.id
    );
  }, [classes, currentUser, isCoach]);

  // Coach-scoped memberships/checkins (light filter on already-lean data)
  const coachMemberships = allMemberships;
  const coachCheckIns    = checkIns;
  const coachCi30        = [];
  const coachPosts       = isCoach ? posts.filter(p => p.author_id === currentUser?.id || p.created_by === currentUser?.id || !p.author_id) : posts;
  const coachEvents      = isCoach ? events.filter(e => e.created_by === currentUser?.id || e.coach_id === currentUser?.id || !e.created_by) : events;
  const coachChallenges  = isCoach ? challenges.filter(c => c.created_by === currentUser?.id || c.coach_id === currentUser?.id || !c.created_by) : challenges;
  const coachPolls       = isCoach ? polls.filter(p => p.created_by === currentUser?.id || !p.created_by) : polls;

  const priorities = [
    atRisk > 0         && { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: `${atRisk} Members Inactive`, action: 'Send Message', fn: () => setTab('members') },
    !challenges.some(c => c.status === 'active') && { icon: Trophy, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'No Active Challenges', action: 'Create One', fn: () => openModal('challenge') },
    polls.length === 0 && { icon: BarChart2, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'No Active Polls', action: 'Create Poll', fn: () => openModal('poll') },
    monthChangePct < 0 && { icon: TrendingDown, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Attendance Down', action: 'View Insight', fn: () => setTab('analytics') },
  ].filter(Boolean).slice(0, 4);

  // ── Tab content — coach gets scoped data, owner gets full data ───────────
  const tabContent = {
    overview: isCoach
      ? <TabCoachOverview
          myClasses={myClasses}
          checkIns={coachCheckIns}
          allMemberships={coachMemberships}
          avatarMap={avatarMapFull}
          openModal={openModal}
          now={now}
          selectedGym={selectedGym}
          posts={coachPosts}
          events={coachEvents}
          challenges={coachChallenges}
        />
      : <TabOverview
          todayCI={todayCI} yesterdayCI={yesterdayCI} todayVsYest={todayVsYest}
          activeThisWeek={activeThisWeek} totalMembers={totalMembers} retentionRate={retentionRate}
          newSignUps={newSignUps} monthChangePct={monthChangePct} ciPrev30={[]}
          atRisk={atRisk} sparkData={sparkData7} monthGrowthData={monthGrowthData}
          cancelledEst={cancelledEst} peakLabel={peakLabel} peakEndLabel={peakEndLabel}
          peakEntry={peakEntry} satVsAvg={satVsAvg} monthCiPer={monthCiPer}
          checkIns={checkIns} allMemberships={allMemberships} challenges={challenges}
          posts={posts} polls={polls} classes={classes} coaches={coaches}
          streaks={streaks} recentActivity={recentActivity} chartDays={chartDays}
          chartRange={chartRange} setChartRange={setChartRange} avatarMap={avatarMapFull}
          priorities={priorities} selectedGym={selectedGym} now={now}
          openModal={openModal} setTab={setTab} Spark={Spark} Delta={Delta}
        />,
    schedule: isCoach
      ? <TabCoachSchedule
          myClasses={myClasses}
          checkIns={coachCheckIns}
          events={coachEvents}
          challenges={coachChallenges}
          allMemberships={coachMemberships}
          avatarMap={avatarMapFull}
          openModal={openModal}
          now={now}
        />
      : null,
    members: isCoach
      ? <TabCoachMembers
          allMemberships={coachMemberships}
          checkIns={coachCheckIns}
          ci30={coachCi30}
          avatarMap={avatarMapFull}
          openModal={openModal}
          now={now}
        />

      : <TabMembersComponent
          allMemberships={allMemberships} checkIns={checkIns} ci30={ci30}
          memberLastCheckIn={memberLastCheckIn} selectedGym={selectedGym}
          atRisk={atRisk} atRiskMembersList={atRiskMembersList}
          retentionRate={retentionRate} totalMembers={totalMembers}
          activeThisWeek={activeThisWeek} newSignUps={newSignUps}
          weeklyChangePct={weeklyChangePct} avatarMap={avatarMapFull}
          memberFilter={memberFilter} setMemberFilter={setMemberFilter}
          memberSearch={memberSearch} setMemberSearch={setMemberSearch}
          memberSort={memberSort} setMemberSort={setMemberSort}
          memberPage={memberPage} setMemberPage={setMemberPage}
          memberPageSize={memberPageSize} selectedRows={selectedRows}
          setSelectedRows={setSelectedRows} openModal={openModal} now={now}
          Spark={Spark} Delta={Delta}
        />,
    content: isCoach
      ? <TabCoachContent
          events={coachEvents}
          challenges={coachChallenges}
          polls={coachPolls}
          posts={coachPosts}
          classes={myClasses}
          checkIns={coachCheckIns}
          ci30={coachCi30}
          avatarMap={avatarMapFull}
          allMemberships={coachMemberships}
          openModal={openModal}
          now={now}
          onDeletePost={id=>deletePostM.mutate(id)}
          onDeleteEvent={id=>deleteEventM.mutate(id)}
          onDeleteChallenge={id=>deleteChallengeM.mutate(id)}
          onDeleteClass={id=>deleteClassM.mutate(id)}
          onDeletePoll={id=>deletePollM.mutate(id)}
        />
      : <TabContentComponent
          events={events}
          challenges={challenges}
          polls={polls}
          posts={posts}
          classes={classes}
          checkIns={checkIns}
          ci30={ci30}
          avatarMap={avatarMapFull}
          currentUser={currentUser}
          leaderboardView={leaderboardView}
          setLeaderboardView={setLeaderboardView}
          openModal={openModal}
          now={now}
          onDeletePost={id=>deletePostM.mutate(id)}
          onDeleteEvent={id=>deleteEventM.mutate(id)}
          onDeleteChallenge={id=>deleteChallengeM.mutate(id)}
          onDeleteClass={id=>deleteClassM.mutate(id)}
          onDeletePoll={id=>deletePollM.mutate(id)}
        />,
    analytics: isCoach
      ? <TabCoachAnalytics
          checkIns={coachCheckIns}
          ci30={coachCi30}
          totalMembers={coachMemberships.length}
          myClasses={myClasses}
          monthChangePct={monthChangePct}
          retentionRate={retentionRate}
          activeThisMonth={new Set(coachCi30.map(c => c.user_id)).size}
          atRisk={atRisk}
          gymId={selectedGym?.id}
        />
      : <TabAnalyticsComponent
          checkIns={checkIns}
          ci30={ci30}
          totalMembers={totalMembers}
          monthCiPer={monthCiPer}
          monthChangePct={monthChangePct}
          monthGrowthData={monthGrowthData}
          retentionRate={retentionRate}
          activeThisMonth={activeThisMonth}
          newSignUps={newSignUps}
          atRisk={atRisk}
          gymId={selectedGym?.id}
          allMemberships={allMemberships}
          classes={classes}
          coaches={coaches}
          avatarMap={avatarMapFull}
          sparkData={sparkData7}
          Spark={Spark}
          Delta={Delta}
          weekTrend={weekTrend}
          peakHours={peakHours}
          busiestDays={busiestDays}
          returnRate={returnRate}
          dailyAvg={dailyAvg}
          engagementSegments={engagementSegments}
          retentionFunnel={retentionFunnel}
          dropOffBuckets={dropOffBuckets}
          churnSignals={churnSignals}
          week1ReturnTrend={week1ReturnTrend}
        />,
    gym: <TabGym selectedGym={selectedGym} classes={classes} coaches={coaches} openModal={openModal} checkIns={checkIns} allMemberships={allMemberships} atRisk={atRisk} retentionRate={retentionRate}/>,
  };

  // ── Splash screens ────────────────────────────────────────────────────────
  const Splash = ({ children }) => (
    <div className="dash-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060c18' }}>
      <div style={{ background: 'rgba(12,26,46,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}>{children}</div>
    </div>
  );
  if (gymsError) return <Splash><X style={{width:28,height:28,color:'#ef4444',margin:'0 auto 12px'}}/><h2 style={{color:'#f1f5f9',fontWeight:900,marginBottom:8}}>Error</h2><p style={{color:'#5a7a96',fontSize:13,marginBottom:20}}>{gymsError.message}</p><button onClick={()=>window.location.reload()} style={{background:'#3b82f6',color:'#fff',border:'none',borderRadius:10,padding:'9px 20px',fontWeight:700,cursor:'pointer'}}>Retry</button></Splash>;
  if (approvedGyms.length===0 && pendingGyms.length>0) return <Splash><Clock style={{width:28,height:28,color:'#f59e0b',margin:'0 auto 12px'}}/><h2 style={{color:'#f1f5f9',fontWeight:900,marginBottom:8}}>Pending Approval</h2><p style={{color:'#5a7a96',fontSize:13,marginBottom:20}}>Your gym <strong style={{color:'#fbbf24'}}>{pendingGyms[0].name}</strong> is under review.</p><Link to={createPageUrl('Home')}><button style={{background:'rgba(255,255,255,0.07)',color:'#f1f5f9',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 20px',fontWeight:700,cursor:'pointer'}}>Back to Home</button></Link></Splash>;
  if (myGyms.length===0 && !isCoach) return <Splash><Dumbbell style={{width:28,height:28,color:'#38bdf8',margin:'0 auto 12px'}}/><h2 style={{color:'#f1f5f9',fontWeight:900,marginBottom:8}}>No Gyms</h2><p style={{color:'#5a7a96',fontSize:13,marginBottom:20}}>Register your gym to get started.</p><Link to={createPageUrl('GymSignup')}><button style={{background:'linear-gradient(135deg,#0ea5e9,#06b6d4)',color:'#fff',border:'none',borderRadius:10,padding:'9px 20px',fontWeight:700,cursor:'pointer'}}>Register Your Gym</button></Link></Splash>;

  // ── SHARED MODALS ────────────────────────────────────────────────────────
  const sharedModals = (
    <>
      <ManageClassesModal    open={modal==='classes'}    onClose={closeModal} classes={classes}   onCreateClass={d=>createClassM.mutate(d)}    onUpdateClass={(id,data)=>updateClassM.mutate({id,data})} onDeleteClass={id=>deleteClassM.mutate(id)} gym={selectedGym} isLoading={createClassM.isPending||updateClassM.isPending}/>
      <CreateGymOwnerPostModal open={modal==='post'}     onClose={closeModal} gym={selectedGym}   onSuccess={()=>inv('posts')}/>
      <CreateEventModal      open={modal==='event'}      onClose={closeModal} onSave={d=>createEventM.mutate(d)} gym={selectedGym} isLoading={createEventM.isPending}/>
      <CreateChallengeModal  open={modal==='challenge'}  onClose={closeModal} gyms={gyms}         onSave={d=>createChallengeM.mutate(d)}       isLoading={createChallengeM.isPending}/>
      <QRScanner             open={modal==='qrScanner'}  onClose={closeModal}/>
      <CreatePollModal       open={modal==='poll'}       onClose={closeModal} onSave={d=>createPollM.mutate(d)} isLoading={createPollM.isPending}/>
      {/* Owner-only modals — no isGymOwner guard; open props control visibility */}
      <ManageRewardsModal    open={modal==='rewards'}    onClose={closeModal} rewards={rewards}   onCreateReward={d=>createRewardM.mutate(d)}  onDeleteReward={id=>deleteRewardM.mutate(id)} gym={selectedGym} isLoading={createRewardM.isPending}/>
      <ManageCoachesModal    open={modal==='coaches'}    onClose={closeModal} coaches={coaches}   onCreateCoach={d=>createCoachM.mutate(d)}    onDeleteCoach={id=>deleteCoachM.mutate(id)}  onUpdateCoach={(id,data)=>updateCoachM.mutate({id,data})} gym={selectedGym} isLoading={createCoachM.isPending} allMemberships={allMemberships} classes={classes}/>
      <EditGymPhotoModal     open={modal==='heroPhoto'}  onClose={closeModal} gym={selectedGym}   onSave={url=>updateGymM.mutate({image_url:url})} isLoading={updateGymM.isPending}/>
      <ManageGymPhotosModal  open={modal==='photos'}     onClose={closeModal} gallery={selectedGym?.gallery||[]} onSave={g=>updateGalleryM.mutate(g)} isLoading={updateGalleryM.isPending}/>
      <ManageMembersModal    open={modal==='members'}    onClose={closeModal} gym={selectedGym}   onBanMember={id=>banMemberM.mutate(id)}      onUnbanMember={id=>unbanMemberM.mutate(id)}/>
      <ManageEquipmentModal  open={modal==='equipment'}  onClose={closeModal} equipment={selectedGym?.equipment||[]} onSave={e=>updateGymM.mutate({equipment:e})} isLoading={updateGymM.isPending}/>
      <ManageAmenitiesModal  open={modal==='amenities'}  onClose={closeModal} amenities={selectedGym?.amenities||[]} onSave={a=>updateGymM.mutate({amenities:a})} isLoading={updateGymM.isPending}/>
      <EditBasicInfoModal    open={modal==='editInfo'}   onClose={closeModal} gym={selectedGym}   onSave={d=>updateGymM.mutate(d)} isLoading={updateGymM.isPending}/>
      <EditGymLogoModal      open={modal==='logo'}       onClose={closeModal} currentLogoUrl={selectedGym?.logo_url} onSave={url=>updateGymM.mutate({logo_url:url})} isLoading={updateGymM.isPending}/>
      <EditPricingModal      open={modal==='pricing'}    onClose={closeModal} gym={selectedGym}   onSave={d=>updateGymM.mutate(d)} isLoading={updateGymM.isPending}/>
      <AlertDialog open={modal==='deleteGym'} onOpenChange={v=>!v&&closeModal()}>
        <AlertDialogContent style={{background:'rgba(4,10,22,0.96)',backdropFilter:'blur(20px)',border:'1px solid rgba(239,68,68,0.25)'}} className="max-w-md">
          <AlertDialogHeader><AlertDialogTitle style={{color:'#f1f5f9',display:'flex',alignItems:'center',gap:8}}><Trash2 style={{width:17,height:17,color:'#f87171'}}/>Delete Gym Permanently?</AlertDialogTitle><AlertDialogDescription style={{color:'#5a7a96',fontSize:13}}>Deletes <strong style={{color:'#f1f5f9'}}>{selectedGym?.name}</strong> and all its data. <span style={{color:'#f87171',fontWeight:700}}>Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel style={{background:'rgba(255,255,255,0.05)',color:'#f1f5f9',border:'1px solid rgba(255,255,255,0.09)'}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteGymM.mutate()} disabled={deleteGymM.isPending} style={{background:'#dc2626',color:'#fff'}}>{deleteGymM.isPending?'Deleting…':'Delete Permanently'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={modal==='deleteAccount'} onOpenChange={v=>!v&&closeModal()}>
        <AlertDialogContent style={{background:'rgba(4,10,22,0.96)',backdropFilter:'blur(20px)',border:'1px solid rgba(239,68,68,0.25)'}} className="max-w-md">
          <AlertDialogHeader><AlertDialogTitle style={{color:'#f1f5f9',display:'flex',alignItems:'center',gap:8}}><Trash2 style={{width:17,height:17,color:'#f87171'}}/>Delete Account?</AlertDialogTitle><AlertDialogDescription style={{color:'#5a7a96',fontSize:13}}>Deletes your account, all gyms, and personal data. <span style={{color:'#f87171',fontWeight:700}}>Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel style={{background:'rgba(255,255,255,0.05)',color:'#f1f5f9',border:'1px solid rgba(255,255,255,0.09)'}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteAccountM.mutate()} disabled={deleteAccountM.isPending} style={{background:'#dc2626',color:'#fff'}}>{deleteAccountM.isPending?'Deleting…':'Delete Account'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <GymJoinPoster gym={selectedGym} open={showPoster} onClose={() => setShowPoster(false)}/>
    </>
  );

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  if (isMobile) return (
    <div className="dash-root" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#060c18', overflow: 'hidden' }}>
      <style>{GRADIENT_OVERRIDE}</style>
      <header style={{ flexShrink: 0, background: '#080f1e', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: isCoach ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isCoach ? <Star style={{ width: 14, height: 14, color: '#fff' }}/> : <Dumbbell style={{ width: 14, height: 14, color: '#fff' }}/>}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.02em', lineHeight: 1 }}>{selectedGym?.name || 'Dashboard'}</div>
            <div style={{ fontSize: 9, color: isCoach ? '#a78bfa' : '#38bdf8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>{roleLabel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={toggleRole} style={{ background: isCoach ? 'rgba(167,139,250,0.1)' : 'rgba(56,189,248,0.08)', border: `1px solid ${isCoach ? 'rgba(167,139,250,0.25)' : 'rgba(56,189,248,0.2)'}`, color: isCoach ? '#a78bfa' : '#38bdf8', borderRadius: 8, fontSize: 10, fontWeight: 800, padding: '4px 8px', cursor: 'pointer' }}>
            {isCoach ? '🎓' : '🏢'}
          </button>
          {atRisk > 0 && (
            <button onClick={() => setTab('members')} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '4px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              <AlertTriangle style={{ width: 9, height: 9 }}/>{atRisk}
            </button>
          )}
          <button onClick={() => openModal('qrScanner')} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.16)', color: '#38bdf8', cursor: 'pointer' }}>
            <QrCode style={{ width: 14, height: 14 }}/>
          </button>
          <button onClick={() => openModal('post')} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#f0f4f8', cursor: 'pointer' }}>
            <Plus style={{ width: 14, height: 14 }}/>
          </button>
        </div>
      </header>
      <main style={{ flex: 1, overflow: 'auto', padding: '14px 12px 8px', WebkitOverflowScrolling: 'touch' }}>
        {tabContent[tab] || tabContent.overview}
      </main>
      <nav style={{ flexShrink: 0, background: '#080f1e', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map(item => {
          const active = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', color: active ? (isCoach ? '#a78bfa' : '#38bdf8') : '#3a5070', transition: 'color 0.12s' }}>
              <item.icon style={{ width: 18, height: 18 }}/>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em' }}>{item.label}</span>
              {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isCoach ? '#a78bfa' : '#38bdf8', boxShadow: `0 0 6px ${isCoach ? '#a78bfa' : '#38bdf8'}` }}/>}
            </button>
          );
        })}
      </nav>
      {sharedModals}
    </div>
  );

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────
  const accentColor = isCoach ? '#a78bfa' : '#38bdf8';

  return (
    <div className="dash-root" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#060c18' }}>
      <style>{GRADIENT_OVERRIDE}</style>

      {/* ─── SIDEBAR ── */}
      <aside style={{ width: collapsed ? 60 : 224, flexShrink: 0, height: '100%', overflow: 'hidden', background: '#080f1e', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ padding: collapsed ? '18px 0' : '18px 14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: isCoach ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${isCoach ? 'rgba(167,139,250,0.3)' : 'rgba(14,165,233,0.3)'}` }}>
              {isCoach ? <Star style={{ width: 16, height: 16, color: '#fff' }}/> : <Dumbbell style={{ width: 16, height: 16, color: '#fff' }}/>}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.03em' }}>{selectedGym?.name || 'Dashboard'}</div>
                <div style={{ fontSize: 9, color: accentColor, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>{roleLabel}</div>
              </div>
            )}
          </div>
          {!collapsed && approvedGyms.length > 1 && (
            <div style={{ position: 'relative', marginTop: 10 }}>
              <button onClick={() => setGymOpen(o=>!o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#8ba0b8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedGym?.name}</span>
                <ChevronDown style={{ width: 12, height: 12, flexShrink: 0, transform: gymOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
              </button>
              {gymOpen && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: '110%', borderRadius: 10, overflow: 'hidden', background: '#060c18', border: `1px solid ${accentColor}33`, zIndex: 20, boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                  {approvedGyms.map(g => <button key={g.id} onClick={() => { setSelectedGym(g); setGymOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 12, fontWeight: 700, background: selectedGym?.id===g.id?`${accentColor}12`:'transparent', color: selectedGym?.id===g.id?accentColor:'#8ba0b8', border: 'none', cursor: 'pointer' }}>{g.name}</button>)}
                </div>
              )}
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {!collapsed && <div style={{ fontSize: 9, fontWeight: 800, color: '#1e3550', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 16px', marginBottom: 6 }}>Menu</div>}
          {NAV.map(item => {
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`nav-item ${active ? 'active' : ''}`}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, padding: collapsed ? '11px 0' : '9px 14px', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', cursor: 'pointer', marginBottom: 1, fontSize: 13, background: 'transparent',
                  ...(active ? { background: `${accentColor}12 !important`, color: `${accentColor} !important`, borderLeftColor: `${accentColor} !important` } : {}) }}>
                <item.icon style={{ width: 15, height: 15, flexShrink: 0 }}/>
                {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
                {!collapsed && active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, boxShadow: `0 0 8px ${accentColor}`, flexShrink: 0 }}/>}
              </button>
            );
          })}
        </nav>

        {!collapsed && isGymOwner && (
          <div style={{ padding: '0 10px 10px', flexShrink: 0 }}>
            <Link to={createPageUrl('Plus')}>
              <div style={{ padding: '12px 13px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(139,92,246,0.14),rgba(236,72,153,0.07))', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.35),transparent)' }}/>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}><Crown style={{ width: 12, height: 12, color: '#a78bfa' }}/><span style={{ fontSize: 12, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.02em' }}>Retention Pro</span></div>
                <div style={{ fontSize: 10, color: '#7c5db8', fontWeight: 600 }}>Advanced analytics · From £49.99/mo</div>
              </div>
            </Link>
          </div>
        )}

        {!collapsed && isCoach && (
          <div style={{ padding: '0 10px 10px', flexShrink: 0 }}>
            <div style={{ padding: '11px 13px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(167,139,250,0.1),rgba(124,58,237,0.06))', border: '1px solid rgba(167,139,250,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}><Star style={{ width: 11, height: 11, color: '#a78bfa' }}/><span style={{ fontSize: 11, fontWeight: 800, color: '#f0f4f8' }}>Coach View</span></div>
              <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>Viewing {selectedGym?.name}</div>
            </div>
          </div>
        )}

        <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!collapsed && (
            <div style={{ padding: '10px 10px 4px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#1e3550', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, paddingLeft: 4 }}>Links</div>
              {[
                { icon: Eye,   label: 'View Gym Page', to: createPageUrl('GymCommunity')+'?id='+selectedGym?.id },
                { icon: Users, label: 'Member View',   to: createPageUrl('Home') },
              ].map((l, i) => (
                <Link key={i} to={l.to}>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', border: 'none', background: 'transparent', color: '#3a5070', fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 8, marginBottom: 1, transition: 'color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#8ba0b8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#3a5070'}>
                    <l.icon style={{ width: 13, height: 13 }}/><span>{l.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          )}
          {collapsed && (
            <div style={{ padding: '8px 0' }}>
              {[{ icon: Eye, to: createPageUrl('GymCommunity')+'?id='+selectedGym?.id }, { icon: Users, to: createPageUrl('Home') }].map((l, i) => (
                <Link key={i} to={l.to}><button style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '9px 0', border: 'none', background: 'transparent', color: '#3a5070', cursor: 'pointer' }}><l.icon style={{ width: 14, height: 14 }}/></button></Link>
              ))}
            </div>
          )}
          <div style={{ padding: collapsed ? '4px 0 14px' : '0 10px 14px' }}>
            <button onClick={() => base44.auth.logout()} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: collapsed ? '9px 0' : '7px 8px', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', background: 'transparent', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 8, opacity: 0.7, transition: 'opacity 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
              <LogOut style={{ width: 13, height: 13 }}/>{!collapsed && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <header style={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', background: '#080f1e', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent 0%,${accentColor}18 30%,${accentColor}18 70%,transparent 100%)`, pointerEvents: 'none' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setCollapsed(o=>!o)} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#5a7a96', cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#f0f4f8'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#5a7a96'; }}>
              <Menu style={{ width: 14, height: 14 }}/>
            </button>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {{ members: isCoach ? 'Clients' : 'Members', content:'Content', analytics:'Analytics', gym:'Settings', schedule:'Schedule' }[tab] || selectedGym?.name || 'Dashboard'}
              </div>
              <div style={{ fontSize: 11, color: '#1e3a54', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                {tab === 'members'
                  ? <><span style={{ color: accentColor, fontWeight: 800 }}>{isCoach ? coachMemberships.length : allMemberships.length}</span><span> {isCoach ? 'clients' : 'members'} · {selectedGym?.name}</span></>
                  : <><span>{format(now, 'EEEE, d MMMM yyyy')}</span><span style={{ color: '#112030' }}>·</span><Sun style={{ width: 10, height: 10 }}/><span>18°C</span></>
                }
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isGymOwner && selectedGym?.join_code && (
              <button onClick={() => setShowPoster(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 8, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', color: '#34d399', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                <QrCode style={{ width: 11, height: 11 }}/><span style={{ fontFamily: 'DM Mono,monospace', letterSpacing: '0.12em' }}>{selectedGym.join_code}</span><span style={{ fontSize: 9, opacity: 0.55 }}>· Flyer</span>
              </button>
            )}
            {atRisk > 0 && (
              <button onClick={() => setTab('members')} style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '5px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle style={{ width: 11, height: 11 }}/>{atRisk} at risk
              </button>
            )}
            <button onClick={() => openModal('qrScanner')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}28`, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background=`${accentColor}20`}
              onMouseLeave={e => e.currentTarget.style.background=`${accentColor}12`}>
              <QrCode style={{ width: 13, height: 13 }}/> Scan QR
            </button>
            <button onClick={() => openModal('post')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', color: '#f0f4f8', border: '1px solid rgba(255,255,255,0.09)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.09)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
              <Plus style={{ width: 13, height: 13 }}/> New Post
            </button>
            {/* Role toggle */}
            <button onClick={toggleRole} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: isCoach ? 'rgba(167,139,250,0.1)' : 'rgba(56,189,248,0.08)', border: `1px solid ${isCoach ? 'rgba(167,139,250,0.25)' : 'rgba(56,189,248,0.2)'}`, color: isCoach ? '#a78bfa' : '#38bdf8', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
              {isCoach ? '🎓 Coach' : '🏢 Owner'} <span style={{ opacity: 0.5, fontSize: 9 }}>preview</span>
            </button>
            <Link to={createPageUrl('NotificationsHub')}>
              <button style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#5a7a96', cursor: 'pointer', position: 'relative', transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#f0f4f8'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#5a7a96'; }}>
                <Bell style={{ width: 13, height: 13 }}/>
                {atRisk > 0 && <div style={{ position: 'absolute', top: 8, right: 8, width: 5, height: 5, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #080f1e' }}/>}
              </button>
            </Link>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 9px 4px 5px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: isCoach ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>
                {(currentUser?.full_name || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#c2d4e8' }}>{(currentUser?.full_name || currentUser?.email || 'User').split(' ')[0]}</span>
              <ChevronDown style={{ width: 10, height: 10, color: '#3a5070' }}/>
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'hidden', padding: '20px 22px 28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 1600, overflowY: 'auto' }}>
            {tabContent[tab] || tabContent.overview}
          </div>
        </main>
      </div>

      {sharedModals}
    </div>
  );
}