import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Trophy, Calendar, Star, Target, Activity,
  Plus, Image as ImageIcon, Dumbbell, CheckCircle, Download, Pencil,
  X, Crown, Trash2, Clock, Gift, Zap, BarChart2, Shield,
  Eye, Menu, LayoutDashboard, FileText, BarChart3, Settings,
  LogOut, ChevronDown, AlertTriangle, QrCode, MessageSquarePlus,
  DollarSign, UserPlus, ChevronRight, Pin, MapPin as MapPin2,
  Tag as Tag2, Send, Bell, BellRing, Sparkles, Check, Flame,
  ArrowUpRight, ArrowRight, MoreHorizontal, Sun, CloudSun,
  CreditCard, AlertCircle, Milestone, TrendingDown as TrendDown,
  CalendarPlus, UserCheck, MessageCircle, RefreshCw, Layers
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, subDays, startOfDay, isWithinInterval } from 'date-fns';
import ManageRewardsModal from '../components/gym/ManageRewardsModal';
import ManageClassesModal from '../components/gym/ManageClassesModal';
import ManageCoachesModal from '../components/gym/ManageCoachesModal';
import ManageGymPhotosModal from '../components/gym/ManageGymPhotosModal';
import ManageMembersModal from '../components/gym/ManageMembersModal';
import CreateGymOwnerPostModal from '../components/gym/CreateGymOwnerPostModal';
import ManageEquipmentModal from '../components/gym/ManageEquipmentModal';
import ManageAmenitiesModal from '../components/gym/ManageAmenitiesModal';
import EditBasicInfoModal from '../components/gym/EditBasicInfoModal';
import CreateEventModal from '../components/events/CreateEventModal';
import CreateChallengeModal from '../components/challenges/CreateChallengeModal';
import QRScanner from '../components/gym/QRScanner';
import CreatePollModal from '../components/polls/CreatePollModal';
import QRCode from 'react-qr-code';

// ─── Injected global styles ──────────────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  :root {
    --bg:      #0a0e1a;
    --sidebar: #0d1121;
    --card:    #111827;
    --card2:   #161d2e;
    --border:  rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.12);
    --cyan:    #00d4ff;
    --cyan2:   #0ea5e9;
    --green:   #10b981;
    --orange:  #f59e0b;
    --red:     #ef4444;
    --purple:  #8b5cf6;
    --text1:   #f1f5f9;
    --text2:   #94a3b8;
    --text3:   #475569;
  }
  .dash-root { font-family: 'Outfit', sans-serif !important; }
  .dash-root * { font-family: 'Outfit', sans-serif !important; }

  /* Scrollbar */
  .dash-root ::-webkit-scrollbar { width: 4px; height: 4px; }
  .dash-root ::-webkit-scrollbar-track { background: transparent; }
  .dash-root ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse-ring {
    0%   { transform: scale(0.95); opacity: 0.7; }
    50%  { transform: scale(1.02); opacity: 1; }
    100% { transform: scale(0.95); opacity: 0.7; }
  }
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes number-pop {
    0%   { transform: scale(0.92); opacity: 0; }
    60%  { transform: scale(1.04); }
    100% { transform: scale(1); opacity: 1; }
  }
  .anim-fade-up { animation: fade-in-up 0.4s cubic-bezier(0.22,1,0.36,1) both; }
  .anim-pop     { animation: number-pop 0.5s cubic-bezier(0.22,1,0.36,1) both; }

  /* Hover helpers */
  .card-hover { transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
  .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.5) !important; }

  /* Nav active */
  .nav-item { transition: background 0.15s, color 0.15s; border-radius: 10px; }
  .nav-item:hover { background: rgba(255,255,255,0.05); }
  .nav-item.active { background: rgba(0,212,255,0.1); color: var(--cyan) !important; }
  .nav-item.active svg { color: var(--cyan) !important; }

  /* Pill button */
  .pill-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 99px; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all 0.15s; border: 1px solid transparent;
  }
  .pill-btn:hover { filter: brightness(1.15); }
  .pill-btn.primary {
    background: rgba(0,212,255,0.15); color: var(--cyan);
    border-color: rgba(0,212,255,0.3);
  }
  .pill-btn.ghost {
    background: rgba(255,255,255,0.07); color: var(--text1);
    border-color: rgba(255,255,255,0.1);
  }

  /* Chart tooltip */
  .custom-tooltip {
    background: rgba(10,14,26,0.97); border: 1px solid rgba(0,212,255,0.3);
    border-radius: 10px; padding: 9px 13px; font-size: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }

  /* Heatmap cell */
  .hm-cell { border-radius: 3px; transition: transform 0.1s; }
  .hm-cell:hover { transform: scale(1.3); z-index: 10; position: relative; }

  /* Priority row */
  .priority-row {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 10px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    transition: background 0.15s;
    cursor: pointer;
  }
  .priority-row:hover { background: rgba(255,255,255,0.06); }

  /* Quick action btn */
  .qa-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 14px; border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    cursor: pointer; transition: all 0.15s; text-align: left;
    width: 100%;
  }
  .qa-btn:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.13);
    transform: translateY(-1px);
  }
  .qa-btn:active { transform: translateY(0); }

  /* Circular progress */
  .ring-svg { transform: rotate(-90deg); }
  .ring-track { fill: none; stroke: rgba(255,255,255,0.07); }
  .ring-progress { fill: none; stroke-linecap: round; transition: stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1); }

  /* Area chart gradient dot */
  .recharts-dot { r: 4 !important; }
`;

// ─── Design tokens ───────────────────────────────────────────────────────────
const NAV = [
  { id: 'overview',   label: 'Overview',      icon: LayoutDashboard },
  { id: 'members',    label: 'Members',        icon: Users },
  { id: 'content',    label: 'Content',        icon: FileText },
  { id: 'analytics',  label: 'Analytics',      icon: BarChart3 },
  { id: 'growth',     label: 'Growth',         icon: TrendingUp },
  { id: 'gym',        label: 'Settings',       icon: Settings },
];

// ─── Micro components ────────────────────────────────────────────────────────
const Card = ({ children, style = {}, className = '', onClick }) => (
  <div className={`card-hover ${className}`} onClick={onClick}
    style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ children, action, actionLabel }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>{children}</p>
    {action && (
      <button onClick={action} style={{ fontSize: 11, fontWeight: 600, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
        {actionLabel || 'View all'} <ChevronRight style={{ width: 11, height: 11 }} />
      </button>
    )}
  </div>
);

const Tag = ({ children, color = 'blue' }) => {
  const m = { blue: ['rgba(14,165,233,0.15)', '#38bdf8'], green: ['rgba(16,185,129,0.15)', '#34d399'], orange: ['rgba(245,158,11,0.15)', '#fbbf24'], red: ['rgba(239,68,68,0.15)', '#f87171'], purple: ['rgba(139,92,246,0.15)', '#a78bfa'] };
  const [bg, text] = m[color] || m.blue;
  return <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: bg, color: text }}>{children}</span>;
};

const Empty = ({ icon: Icon, label }) => (
  <div style={{ padding: '28px 16px', textAlign: 'center' }}>
    <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.14)', margin: '0 auto 10px' }}>
      <Icon style={{ width: 18, height: 18, color: 'rgba(14,165,233,0.4)' }} />
    </div>
    <p style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{label}</p>
  </div>
);

// ─── Circular progress ring ──────────────────────────────────────────────────
const RingChart = ({ pct = 70, size = 64, stroke = 5, color = '#0ea5e9' }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} className="ring-svg">
      <circle className="ring-track" cx={size/2} cy={size/2} r={r} strokeWidth={stroke}/>
      <circle className="ring-progress" cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
        stroke={color} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={0}/>
    </svg>
  );
};

// ─── Sparkline ───────────────────────────────────────────────────────────────
const Sparkline = ({ data, color = '#10b981', height = 36 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`spk-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#spk-${color.replace('#','')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
};

// ─── Custom tooltip for area chart ──────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ color: 'var(--text2)', marginBottom: 4, fontSize: 11 }}>{label}</p>
      <p style={{ color: 'var(--cyan)', fontWeight: 700 }}>{payload[0].value} check-ins</p>
    </div>
  );
};

// ─── Attendance Heatmap ──────────────────────────────────────────────────────
const AttendanceHeatmap = ({ checkIns }) => {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const slots = ['6AM','12PM','6PM','9PM'];
  const slotHours = [[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22]];

  const grid = useMemo(() => {
    const acc = {};
    checkIns.forEach(c => {
      const d = new Date(c.check_in_date);
      const dow = (d.getDay() + 6) % 7; // Mon=0
      const h = d.getHours();
      const slot = slotHours.findIndex(s => s.includes(h));
      if (slot === -1) return;
      const key = `${dow}-${slot}`;
      acc[key] = (acc[key] || 0) + 1;
    });
    return acc;
  }, [checkIns]);

  const max = Math.max(...Object.values(grid), 1);

  const getColor = (v) => {
    if (!v) return 'rgba(255,255,255,0.04)';
    const t = v / max;
    if (t < 0.2) return 'rgba(6,182,212,0.18)';
    if (t < 0.4) return 'rgba(6,182,212,0.35)';
    if (t < 0.6) return 'rgba(6,182,212,0.55)';
    if (t < 0.8) return 'rgba(6,182,212,0.75)';
    return 'rgba(6,182,212,0.95)';
  };

  return (
    <div>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
        <div/>
        {days.map(d => <div key={d} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' }}>{d}</div>)}
      </div>
      {/* Rows */}
      {slots.map((slot, si) => (
        <div key={slot} style={{ display: 'grid', gridTemplateColumns: '36px repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>{slot}</div>
          {days.map((_, di) => {
            const v = grid[`${di}-${si}`] || 0;
            return (
              <div key={di} className="hm-cell"
                title={`${days[di]} ${slot}: ${v} check-ins`}
                style={{ height: 20, borderRadius: 4, background: getColor(v) }}/>
            );
          })}
        </div>
      ))}
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>Low</span>
        {[0.04, 0.2, 0.4, 0.6, 0.8, 1.0].map((t, i) => (
          <div key={i} style={{ width: 14, height: 8, borderRadius: 2, background: i === 0 ? 'rgba(255,255,255,0.04)' : `rgba(6,182,212,${t * 0.9 + 0.05})` }}/>
        ))}
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>High</span>
      </div>
    </div>
  );
};

// ─── Root ────────────────────────────────────────────────────────────────────
export default function GymOwnerDashboard() {
  const [tab, setTab]             = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const [gymOpen, setGymOpen]     = useState(false);
  const [modal, setModal]         = useState(null);
  const [chartRange, setChartRange] = useState(7);
  const [notifMsg, setNotifMsg]   = useState('');
  const [notifTarget, setNotifTarget] = useState('atRisk');
  const [notifSending, setNotifSending] = useState(false);
  const [notifSent, setNotifSent] = useState(null);
  const [notifTemplate, setNotifTemplate] = useState(null);
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
  const { data: lifts      = [] }     = useQuery({ queryKey: ['lifts',      selectedGym?.id], queryFn: () => base44.entities.Lift.filter({ gym_id: selectedGym.id }, '-lift_date', 200), enabled: on, ...qo });
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

  // Push notifications
  const NOTIF_TEMPLATES = [
    { label: 'We miss you! 💪',    body: `Hey! We haven't seen you at ${selectedGym?.name||'the gym'} in a while.` },
    { label: 'Special offer 🎁',   body: `Great news from ${selectedGym?.name||'us'}! Come in this week for a free guest pass.` },
    { label: 'New class alert 📣', body: `A new class has been added at ${selectedGym?.name||'the gym'}!` },
    { label: 'Challenge starts 🏆',body: `A new fitness challenge is kicking off at ${selectedGym?.name||'the gym'}!` },
    { label: 'Check-in nudge 🔔',  body: `Just a friendly nudge from ${selectedGym?.name||'your gym'} — it's been a while!` },
  ];

  const sendNotification = async () => {
    if (!notifMsg.trim() || notifSending) return;
    setNotifSending(true);
    try {
      const targetMembers = notifTarget === 'atRisk'
        ? allMemberships.filter(m => { const last = memberLastCheckIn[m.user_id]; return !last || Math.floor((now - new Date(last)) / 86400000) >= 14; })
        : allMemberships;
      const memberIds = targetMembers.map(m => m.user_id);
      await base44.functions.invoke('sendPushNotification', { gym_id: selectedGym.id, gym_name: selectedGym.name, target: notifTarget, message: notifMsg.trim(), member_ids: memberIds });
      setNotifSent({ count: memberIds.length, target: notifTarget });
      setNotifMsg(''); setNotifTemplate(null);
      setTimeout(() => setNotifSent(null), 5000);
    } catch(e) { console.error(e); }
    setNotifSending(false);
  };

  // ── Must be before early returns (hooks must be called unconditionally) ──
  const now = new Date();

  const chartDays = useMemo(() => {
    const days = chartRange <= 7 ? 7 : chartRange <= 30 ? 30 : 90;
    return Array.from({length: days}, (_, i) => {
      const d = subDays(now, days - 1 - i);
      return {
        day: format(d, days <= 7 ? 'EEE' : 'MMM d'),
        value: checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(d).getTime()).length
      };
    });
  }, [chartRange, checkIns]);

  const streaks = useMemo(() => {
    const acc = {};
    checkIns.forEach(c => { acc[c.user_name] = (acc[c.user_name] || new Set()); acc[c.user_name].add(startOfDay(new Date(c.check_in_date)).getTime()); });
    return Object.entries(acc).map(([name, days]) => ({ name, streak: days.size })).sort((a,b)=>b.streak-a.streak).slice(0,5);
  }, [checkIns]);

  const recentActivity = useMemo(() => {
    return [...checkIns].slice(0, 8).map(c => ({
      name: c.user_name || 'Member',
      action: 'checked in',
      time: c.check_in_date,
      color: '#10b981',
    }));
  }, [checkIns]);

  // Splash
  const Splash = ({ children }) => (
    <div className="dash-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}>{children}</div>
    </div>
  );
  if (gymsError) return <Splash><X style={{width:28,height:28,color:'#ef4444',margin:'0 auto 12px'}}/><h2 style={{color:'var(--text1)',fontWeight:800,marginBottom:8}}>Error</h2><p style={{color:'var(--text2)',fontSize:13,marginBottom:20}}>{gymsError.message}</p><button onClick={()=>window.location.reload()} style={{background:'#3b82f6',color:'#fff',border:'none',borderRadius:10,padding:'9px 20px',fontWeight:700,cursor:'pointer'}}>Retry</button></Splash>;
  if (approvedGyms.length===0 && pendingGyms.length>0) return <Splash><Clock style={{width:28,height:28,color:'#f59e0b',margin:'0 auto 12px'}}/><h2 style={{color:'var(--text1)',fontWeight:800,marginBottom:8}}>Pending Approval</h2><p style={{color:'var(--text2)',fontSize:13,marginBottom:20}}>Your gym <strong style={{color:'#fbbf24'}}>{pendingGyms[0].name}</strong> is under review.</p><Link to={createPageUrl('Home')}><button style={{background:'rgba(255,255,255,0.08)',color:'var(--text1)',border:'1px solid var(--border)',borderRadius:10,padding:'9px 20px',fontWeight:700,cursor:'pointer'}}>Back to Home</button></Link></Splash>;
  if (myGyms.length===0) return <Splash><Dumbbell style={{width:28,height:28,color:'var(--cyan)',margin:'0 auto 12px'}}/><h2 style={{color:'var(--text1)',fontWeight:800,marginBottom:8}}>No Gyms</h2><p style={{color:'var(--text2)',fontSize:13,marginBottom:20}}>Register your gym to get started.</p><Link to={createPageUrl('GymSignup')}><button style={{background:'linear-gradient(135deg,#0ea5e9,#06b6d4)',color:'#fff',border:'none',borderRadius:10,padding:'9px 20px',fontWeight:700,cursor:'pointer'}}>Register Your Gym</button></Link></Splash>;

  // ── Stats ─────────────────────────────────────────────────────────────────
  const now              = new Date();
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
  const atRisk           = allMemberships.filter(m => { const last = memberLastCheckIn[m.user_id]; if (!last) return true; return Math.floor((now - new Date(last)) / 86400000) >= 14; }).length;
  const monthChangePct   = ciPrev30.length > 0 ? Math.round(((ci30.length - ciPrev30.length) / ciPrev30.length) * 100) : 0;
  const newSignUps       = allMemberships.filter(m => isWithinInterval(new Date(m.join_date || m.created_date || now), { start: subDays(now,30), end: now })).length;
  const newSignUpsPrev   = allMemberships.filter(m => isWithinInterval(new Date(m.join_date || m.created_date || now), { start: subDays(now,60), end: subDays(now,30) })).length;
  const cancelledEst     = Math.max(0, newSignUpsPrev - newSignUps);

  // Chart data
  const chartDays = useMemo(() => {
    const days = chartRange <= 7 ? 7 : chartRange <= 30 ? 30 : 90;
    return Array.from({length: days}, (_, i) => {
      const d = subDays(now, days - 1 - i);
      return {
        day: format(d, days <= 7 ? 'EEE' : days <= 30 ? 'MMM d' : 'MMM d'),
        value: checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(d).getTime()).length
      };
    });
  }, [chartRange, checkIns]);

  const sparkData = Array.from({length:7},(_,i)=>checkIns.filter(c=>startOfDay(new Date(c.check_in_date)).getTime()===startOfDay(subDays(now,6-i)).getTime()).length);

  const monthGrowthData = Array.from({length:6},(_,i)=>{
    const e=subDays(now,i*30), s=subDays(e,30);
    return { label: format(e,'MMM'), value: new Set(checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).map(c=>c.user_id)).size };
  }).reverse();

  // Top streaks (simulate from check-in frequency)
  const streaks = useMemo(() => {
    const acc = {};
    checkIns.forEach(c => { acc[c.user_name] = (acc[c.user_name] || new Set()); acc[c.user_name].add(startOfDay(new Date(c.check_in_date)).getTime()); });
    return Object.entries(acc).map(([name, days]) => ({ name, streak: days.size })).sort((a,b)=>b.streak-a.streak).slice(0,5);
  }, [checkIns]);

  // Recent activity
  const recentActivity = useMemo(() => {
    return [...checkIns].slice(0, 8).map(c => ({
      name: c.user_name || 'Member',
      action: 'checked in',
      time: c.check_in_date,
      color: '#10b981',
    }));
  }, [checkIns]);

  // Insights
  const hourAcc = {};
  checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); hourAcc[h] = (hourAcc[h]||0)+1; });
  const peakEntry = Object.entries(hourAcc).sort(([,a],[,b])=>b-a)[0];
  const peakLabel = peakEntry ? (() => { const h = parseInt(peakEntry[0]); return h < 12 ? `${h || 12}${h < 12 ? 'AM':'PM'}` : `${h===12?12:h-12}PM`; })() : null;
  const peakEndLabel = peakEntry ? (() => { const h = parseInt(peakEntry[0]) + 1; return h < 12 ? `${h}AM` : `${h===12?12:h-12}PM`; })() : null;

  // Saturday attendance vs average
  const satCI = checkIns.filter(c => new Date(c.check_in_date).getDay() === 6);
  const otherCI = checkIns.filter(c => new Date(c.check_in_date).getDay() !== 6);
  const satAvg = satCI.length / Math.max(Math.ceil(checkIns.length / 7), 1);
  const otherAvg = otherCI.length / Math.max(Math.ceil(checkIns.length / 7) * 6, 1);
  const satVsAvg = otherAvg > 0 ? Math.round(((satAvg - otherAvg) / otherAvg) * 100) : 0;

  // Priorities
  const priorities = [
    atRisk > 0        && { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: `${atRisk} Members Inactive`, action: 'Send Message', fn: () => setTab('members') },
    !challenges.some(c=>c.status==='active') && { icon: Trophy, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'No Active Challenges', action: 'Create One', fn: () => openModal('challenge') },
    polls.length===0  && { icon: BarChart2, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'No Active Polls', action: 'Create Poll', fn: () => openModal('poll') },
    monthChangePct < 0 && { icon: TrendingDown, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Attendance Down', action: 'View Insight', fn: () => setTab('analytics') },
  ].filter(Boolean).slice(0, 4);

  // ═══════════════════════════════════════════════════════════════════════════
  // OVERVIEW TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const TabOverview = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>
      {/* LEFT COLUMN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── KPI Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {/* Today's Check-ins */}
          <Card style={{ padding: '20px 20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Today's Check-ins</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text1)', lineHeight: 1, letterSpacing: '-0.04em' }} className="anim-pop">{todayCI}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  {todayVsYest >= 0
                    ? <><ArrowUpRight style={{width:13,height:13,color:'var(--green)'}}/><span style={{fontSize:12,fontWeight:700,color:'var(--green)'}}>{todayVsYest}% vs yesterday</span></>
                    : <><TrendingDown style={{width:13,height:13,color:'var(--red)'}}/><span style={{fontSize:12,fontWeight:700,color:'var(--red)'}}>{Math.abs(todayVsYest)}% vs yesterday</span></>
                  }
                </div>
              </div>
              <Sparkline data={sparkData} color="#10b981"/>
            </div>
            <div style={{ marginTop: 10, height: 2, borderRadius: 99, background: 'rgba(16,185,129,0.15)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100,(todayCI/Math.max(activeThisWeek/7,1))*100)}%`, background: 'linear-gradient(90deg,#10b981,#06b6d4)', borderRadius: 99 }}/>
            </div>
          </Card>

          {/* Active Members with ring */}
          <Card style={{ padding: '20px 20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Active Members</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text1)', lineHeight: 1, letterSpacing: '-0.04em' }} className="anim-pop">
                  {activeThisWeek}<span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text3)' }}> / {totalMembers}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <ArrowUpRight style={{width:13,height:13,color:'var(--cyan)'}}/>
                  <span style={{fontSize:12,fontWeight:700,color:'var(--cyan)'}}>{retentionRate}% engagement</span>
                </div>
              </div>
              <RingChart pct={retentionRate} size={56} stroke={5} color="#0ea5e9"/>
            </div>
          </Card>

          {/* Growth Insights (replaces revenue) */}
          <Card style={{ padding: '20px 20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Monthly Growth</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: newSignUps > 0 ? '#10b981' : 'var(--text1)', lineHeight: 1, letterSpacing: '-0.04em' }} className="anim-pop">{newSignUps > 0 ? '+' : ''}{newSignUps}</span>
                  <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>this month</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  {monthChangePct >= 0
                    ? <><ArrowUpRight style={{width:13,height:13,color:'var(--green)'}}/><span style={{fontSize:12,fontWeight:700,color:'var(--green)'}}>{monthChangePct}% vs last month</span></>
                    : <><TrendingDown style={{width:13,height:13,color:'var(--red)'}}/><span style={{fontSize:12,fontWeight:700,color:'var(--red)'}}>{Math.abs(monthChangePct)}% vs last month</span></>
                  }
                </div>
              </div>
              <Sparkline data={monthGrowthData.map(d=>d.value)} color="#10b981"/>
            </div>
          </Card>

          {/* At-Risk Members */}
          <Card style={{ padding: '20px 20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>At-Risk Members</div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 800, color: atRisk > 0 ? '#ef4444' : 'var(--text1)', lineHeight: 1, letterSpacing: '-0.04em' }} className="anim-pop">{atRisk}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
                <AlertTriangle style={{width:12,height:12,color:'#f59e0b'}}/>
                <span style={{fontSize:12,fontWeight:600,color:'var(--text2)'}}>{atRisk > 0 ? '14+ days' : 'All members'} inactive</span>
              </div>
            </div>
            <Sparkline data={[...sparkData].map((v,i,a)=>Math.max(0,a[a.length-1-i])).reverse()} color="#ef4444" height={32}/>
          </Card>
        </div>

        {/* ── Check-ins Over Time (smooth area) ── */}
        <Card style={{ padding: '20px 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Check-ins Over Time</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Daily attendance trend</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[7, 30, 90].map(r => (
                <button key={r} onClick={() => setChartRange(r)}
                  style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 99, cursor: 'pointer', transition: 'all 0.15s',
                    background: chartRange === r ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                    color: chartRange === r ? 'var(--cyan)' : 'var(--text3)',
                    border: `1px solid ${chartRange === r ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  {r === 7 ? '7D' : r === 30 ? '30D' : '90D'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={chartDays} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#0ea5e9" stopOpacity={0.4}/>
                  <stop offset="60%"  stopColor="#0ea5e9" stopOpacity={0.12}/>
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} interval={chartRange <= 7 ? 0 : chartRange <= 30 ? 5 : 14}/>
              <YAxis tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} width={26}/>
              <Tooltip content={<ChartTip/>} cursor={{ stroke: 'rgba(0,212,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}/>
              <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#ciGrad)"
                dot={false} activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* ── Heatmap + Member Growth ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Attendance Heatmap */}
          <Card style={{ padding: 20 }}>
            <SectionTitle>Attendance Heatmap</SectionTitle>
            <AttendanceHeatmap checkIns={checkIns}/>
          </Card>

          {/* Member Growth */}
          <Card style={{ padding: 20 }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', marginBottom: 2 }}>Member Growth</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#10b981', letterSpacing: '-0.04em' }}>+{newSignUps}</span>
                <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>this month</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={monthGrowthData} barSize={20} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Outfit' }} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? <div className="custom-tooltip"><p style={{color:'var(--text2)',marginBottom:2,fontSize:10}}>{label}</p><p style={{color:'var(--green)',fontWeight:700}}>{payload[0].value} active</p></div> : null} cursor={{ fill: 'rgba(255,255,255,0.04)' }}/>
                <Bar dataKey="value" fill="url(#barGrad)" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              {[
                { label: 'New Members', value: newSignUps, color: 'var(--text1)' },
                { label: 'Cancelled',   value: cancelledEst, color: '#ef4444' },
                { label: 'Retention',   value: `${retentionRate}%`, color: '#10b981', arrow: true },
              ].map((s,i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</span>
                    {s.arrow && <ArrowUpRight style={{width:12,height:12,color:'var(--green)'}}/>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Top Streaks + Recent Activity + Insights ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {/* Top Streaks */}
          <Card style={{ padding: 20 }}>
            <SectionTitle>Top Streaks</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {streaks.length === 0 && <Empty icon={Flame} label="No streaks yet"/>}
              {streaks.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${['#f59e0b','#94a3b8','#b45309'][i] || '#374151'}, ${['#ef4444','#64748b','#92400e'][i] || '#1f2937'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : <span style={{fontSize:11,color:'#fff',fontWeight:800}}>{i+1}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? '#f59e0b' : i === 1 ? '#10b981' : '#60a5fa' }}>{s.streak} day streak</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card style={{ padding: 20 }}>
            <SectionTitle>Recent Activity</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentActivity.length === 0 && <Empty icon={Activity} label="No activity yet"/>}
              {recentActivity.slice(0,5).map((a, i) => {
                const minsAgo = Math.floor((now - new Date(a.time)) / 60000);
                const timeStr = minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo/60)}h ago` : `${Math.floor(minsAgo/1440)}d ago`;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                      {(a.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text1)', lineHeight: 1.35 }}>
                        <span style={{ fontWeight: 700 }}>{a.name}</span>
                        <span style={{ color: 'var(--text3)' }}> {a.action}</span>
                        <span style={{ color: 'var(--text3)', fontSize: 10 }}> · {timeStr}</span>
                      </div>
                    </div>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flexShrink: 0 }}/>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Insights */}
          <Card style={{ padding: 20 }}>
            <SectionTitle action={() => setTab('analytics')} actionLabel="View all">Insights</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {peakLabel && (
                <div style={{ padding: '11px 13px', borderRadius: 12, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Zap style={{width:13,height:13,color:'#a78bfa'}}/>
                    <span style={{fontSize:12,fontWeight:700,color:'var(--text1)'}}>Peak: {peakLabel}–{peakEndLabel} today</span>
                  </div>
                  <span style={{fontSize:11,color:'var(--text3)'}}>Expect {Math.round((peakEntry?.[1]||0)*1.1)}+ visits</span>
                </div>
              )}
              {satVsAvg !== 0 && (
                <div style={{ padding: '11px 13px', borderRadius: 12, background: satVsAvg >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.1)', border: `1px solid ${satVsAvg >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Star style={{width:13,height:13,color:satVsAvg>=0?'#34d399':'#fbbf24'}}/>
                    <span style={{fontSize:12,fontWeight:700,color:'var(--text1)'}}>Sat attendance <span style={{color:satVsAvg>=0?'#34d399':'#f87171'}}>{satVsAvg >= 0 ? '+':''}{satVsAvg}%</span></span>
                  </div>
                  {satVsAvg < 0 && <button onClick={()=>openModal('challenge')} style={{fontSize:11,color:'#fbbf24',background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center',gap:3}}>→ Start challenge</button>}
                </div>
              )}
              {monthChangePct !== 0 && (
                <div style={{ padding: '11px 13px', borderRadius: 12, background: monthChangePct >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${monthChangePct >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp style={{width:13,height:13,color:monthChangePct>=0?'#34d399':'#f87171'}}/>
                    <span style={{fontSize:12,fontWeight:700,color:'var(--text1)'}}>Monthly check-ins <span style={{color:monthChangePct>=0?'#34d399':'#f87171'}}>{monthChangePct>=0?'+':''}{monthChangePct}%</span></span>
                  </div>
                </div>
              )}
              {peakLabel === null && satVsAvg === 0 && monthChangePct === 0 && (
                <Empty icon={Sparkles} label="Check back once members are active"/>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Today's Priorities */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Today's Priorities</span>
            <MoreHorizontal style={{ width: 16, height: 16, color: 'var(--text3)', cursor: 'pointer' }}/>
          </div>
          {priorities.length === 0 ? (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle style={{width:14,height:14,color:'#10b981'}}/>
                <span style={{fontSize:12,fontWeight:600,color:'#34d399'}}>All clear — great work!</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {priorities.map((p, i) => (
                <div key={i} className="priority-row" onClick={p.fn}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.bg, flexShrink: 0 }}>
                    <p.icon style={{ width: 14, height: 14, color: p.color }}/>
                  </div>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text1)', lineHeight: 1.3 }}>{p.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.color, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 2 }}>
                    → {p.action}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card style={{ padding: 18 }}>
          <SectionTitle>Quick Actions</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: UserPlus,          label: 'Add Member',       color: '#0ea5e9', fn: () => openModal('members') },
              { icon: QrCode,            label: 'Scan Check-in',    color: '#10b981', fn: () => openModal('qrScanner') },
              { icon: Trophy,            label: 'Create Challenge', color: '#f59e0b', fn: () => openModal('challenge') },
              { icon: MessageSquarePlus, label: 'Send Message',     color: '#a78bfa', fn: () => openModal('post') },
              { icon: Pencil,            label: 'Post Update',      color: '#38bdf8', fn: () => openModal('post') },
              { icon: Calendar,          label: 'Schedule Event',   color: '#34d399', fn: () => openModal('event') },
            ].map(({ icon: Icon, label, color, fn }, i) => (
              <button key={i} className="qa-btn" onClick={fn}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 14, height: 14, color }}/>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)' }}>{label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Engagement snapshot */}
        <Card style={{ padding: 18 }}>
          <SectionTitle action={() => setTab('members')} actionLabel="All">Engagement</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Super Active', sub: '12+ visits', val: monthCiPer.filter(v=>v>=12).length, color: '#10b981', pct: totalMembers > 0 ? (monthCiPer.filter(v=>v>=12).length / totalMembers) * 100 : 0 },
              { label: 'Active',       sub: '4–11 visits',val: monthCiPer.filter(v=>v>=4&&v<12).length, color: '#0ea5e9', pct: totalMembers > 0 ? (monthCiPer.filter(v=>v>=4&&v<12).length / totalMembers) * 100 : 0 },
              { label: 'At Risk',      sub: '14+ days away',val: atRisk, color: '#ef4444', pct: totalMembers > 0 ? (atRisk / totalMembers) * 100 : 0 },
            ].map((s,i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{s.label} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>{s.sub}</span></span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.val}</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 99, opacity: 0.75, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MEMBERS TAB
  // ══════════════════════════════════════════════════════════════════════════
  const TabMembers = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { icon: Users,    label: 'Total Members',   value: totalMembers,        color: '#0ea5e9', sub: 'active memberships' },
          { icon: Zap,      label: 'Active This Week', value: activeThisWeek,      color: '#10b981', sub: `${weeklyChangePct >= 0 ? '+' : ''}${weeklyChangePct}% vs last week`, trend: weeklyChangePct },
          { icon: Activity, label: 'Retention Rate',  value: `${retentionRate}%`, color: '#a78bfa', sub: 'active last 30 days' },
          { icon: Trophy,   label: 'PRs Logged',      value: lifts.filter(l=>l.is_pr).length, color: '#f59e0b', sub: 'personal records' },
        ].map((k, i) => (
          <Card key={i} style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${k.color}18`, border: `1px solid ${k.color}30` }}>
                <k.icon style={{ width: 17, height: 17, color: k.color }}/>
              </div>
              {k.trend !== undefined && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: k.trend >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: k.trend >= 0 ? '#34d399' : '#f87171' }}>
                  {k.trend >= 0 ? '+' : ''}{k.trend}%
                </span>
              )}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.04em', lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5, fontWeight: 500 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Engagement Tiers */}
        <Card style={{ padding: 20 }}>
          <SectionTitle>Engagement Tiers <span style={{fontSize:11,color:'var(--text3)',fontWeight:400}}>— last 30 days</span></SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Super Active', sub: '15+ visits', val: monthCiPer.filter(v=>v>=15).length, color: '#10b981', bg: 'rgba(16,185,129,0.08)', e: '🔥' },
              { label: 'Active',       sub: '8–14 visits',val: monthCiPer.filter(v=>v>=8&&v<15).length, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', e: '💪' },
              { label: 'Casual',       sub: '1–7 visits', val: monthCiPer.filter(v=>v>=1&&v<8).length,  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',e: '🚶' },
              { label: 'At Risk',      sub: '14d+ inactive',val: atRisk,                               color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  e: '⚠️' },
            ].map((t, i) => (
              <div key={i} style={{ padding: '14px', borderRadius: 12, background: t.bg, border: `1px solid ${t.color}25` }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{t.e}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: t.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 3 }}>{t.val}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{t.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{t.sub}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Leaderboard */}
        <Card style={{ padding: 20 }}>
          <SectionTitle action={() => openModal('members')} actionLabel="All Members">Weekly Leaderboard</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {Object.entries(ci7.reduce((acc,c)=>{acc[c.user_name]=(acc[c.user_name]||0)+1;return acc;},{})  )
              .sort(([,a],[,b])=>b-a).slice(0,7)
              .map(([name,count],idx) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: idx < 3 ? 'rgba(14,165,233,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${idx < 3 ? 'rgba(14,165,233,0.18)' : 'rgba(255,255,255,0.05)'}` }}>
                  <span style={{ fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0 }}>{['🥇','🥈','🥉'][idx] || idx+1}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)' }}>{count} visits</span>
                </div>
              ))}
            {ci7.length === 0 && <Empty icon={Users} label="No check-ins this week"/>}
          </div>
        </Card>
      </div>

      {/* Push Notifications */}
      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BellRing style={{ width: 15, height: 15, color: '#fbbf24' }}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Push Notifications</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Reach members directly on their phone</div>
          </div>
          {atRisk > 0 && <Tag color="red" style={{ marginLeft: 'auto' }}>⚠️ {atRisk} at risk</Tag>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            {/* Target */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[{ id:'atRisk', label:`At-Risk (${atRisk})`, color:'#ef4444' }, { id:'all', label:`All (${allMemberships.length})`, color:'#0ea5e9' }].map(t => (
                <button key={t.id} onClick={() => setNotifTarget(t.id)}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                    background: notifTarget === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)',
                    color: notifTarget === t.id ? t.color : 'var(--text3)',
                    border: `1px solid ${notifTarget === t.id ? t.color + '40' : 'rgba(255,255,255,0.07)'}` }}>
                  {t.label}
                </button>
              ))}
            </div>
            {/* Templates */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {NOTIF_TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => { setNotifTemplate(t.label); setNotifMsg(t.body); }}
                  style={{ padding: '4px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                    background: notifTemplate === t.label ? 'rgba(245,158,11,0.16)' : 'rgba(255,255,255,0.04)',
                    color: notifTemplate === t.label ? '#fbbf24' : 'var(--text3)',
                    border: `1px solid ${notifTemplate === t.label ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.07)'}` }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <textarea value={notifMsg} onChange={e => { setNotifMsg(e.target.value); setNotifTemplate(null); }}
                placeholder="Type a message to your members…" rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: `1px solid ${notifMsg ? 'rgba(14,165,233,0.35)' : 'rgba(255,255,255,0.08)'}`, color: 'var(--text1)', fontSize: 12, fontFamily: 'Outfit,sans-serif', resize: 'none', outline: 'none', transition: 'border-color 0.2s', lineHeight: 1.5, boxSizing: 'border-box' }}/>
              <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 9, color: notifMsg.length > 160 ? '#ef4444' : 'var(--text3)' }}>{notifMsg.length}/160</span>
            </div>
            {notifSent ? (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check style={{ width: 14, height: 14, color: '#34d399' }}/>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>Sent to {notifSent.count} members!</span>
              </div>
            ) : (
              <button onClick={sendNotification} disabled={!notifMsg.trim() || notifSending}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: notifMsg.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.2s',
                  background: notifMsg.trim() ? 'linear-gradient(135deg,rgba(14,165,233,0.9),rgba(6,182,212,0.9))' : 'rgba(255,255,255,0.04)',
                  color: notifMsg.trim() ? '#fff' : 'var(--text3)',
                  border: `1px solid ${notifMsg.trim() ? 'rgba(14,165,233,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: notifMsg.trim() ? '0 4px 16px rgba(14,165,233,0.22)' : 'none' }}>
                {notifSending ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/> Sending…</> : <><Send style={{ width: 13, height: 13 }}/> Send to {notifTarget === 'atRisk' ? `${atRisk} at-risk` : `all ${allMemberships.length}`} members</>}
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // CONTENT TAB
  // ══════════════════════════════════════════════════════════════════════════
  const TabContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { icon: MessageSquarePlus, label: 'New Post',       sub: 'Share with members', color: '#0ea5e9', fn: () => openModal('post') },
          { icon: Calendar,          label: 'New Event',      sub: `${events.filter(e=>new Date(e.event_date)>=now).length} upcoming`, color: '#10b981', fn: () => openModal('event') },
          { icon: Trophy,            label: 'New Challenge',  sub: `${challenges.filter(c=>c.status==='active').length} active`, color: '#f59e0b', fn: () => openModal('challenge') },
          { icon: BarChart2,         label: 'New Poll',       sub: `${polls.length} active`, color: '#a78bfa', fn: () => openModal('poll') },
        ].map(({ icon: Icon, label, sub, color, fn }, i) => (
          <Card key={i} style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={fn}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon style={{ width: 17, height: 17, color }}/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{sub}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle action={() => openModal('post')} actionLabel="New Post">Recent Posts</SectionTitle>
          {posts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {posts.slice(0,6).map(post => (
                <div key={post.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{post.member_name?.charAt(0)?.toUpperCase()}</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', flex: 1 }}>{post.member_name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>{format(new Date(post.created_date),'MMM d')}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 7, fontSize: 11, color: 'var(--text3)' }}><span>❤️ {post.likes||0}</span><span>💬 {post.comments?.length||0}</span></div>
                </div>
              ))}
            </div>
          ) : <Empty icon={FileText} label="No posts yet"/>}
        </Card>
        <Card style={{ padding: 20 }}>
          <SectionTitle action={() => openModal('event')} actionLabel="New Event">Upcoming Events</SectionTitle>
          {events.filter(e=>new Date(e.event_date)>=now).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.filter(e=>new Date(e.event_date)>=now).slice(0,5).map(ev => (
                <div key={ev.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.description}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text3)' }}><span>📅 {format(new Date(ev.event_date),'MMM d, h:mma')}</span><span>👥 {ev.attendees||0}</span></div>
                </div>
              ))}
            </div>
          ) : <Empty icon={Calendar} label="No upcoming events"/>}
        </Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle action={() => openModal('challenge')} actionLabel="New">Active Challenges</SectionTitle>
          {challenges.filter(c=>c.status==='active').length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {challenges.filter(c=>c.status==='active').map(ch => (
                <div key={ch.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>🏆 {ch.title}</span>
                    <Tag color="orange">{ch.type?.replace('_',' ')}</Tag>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>👥 {ch.participants?.length||0} joined · 📅 {format(new Date(ch.start_date),'MMM d')} – {format(new Date(ch.end_date),'MMM d')}</div>
                </div>
              ))}
            </div>
          ) : <Empty icon={Trophy} label="No active challenges"/>}
        </Card>
        <Card style={{ padding: 20 }}>
          <SectionTitle action={() => openModal('poll')} actionLabel="New Poll">Active Polls</SectionTitle>
          {polls.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {polls.map(poll => (
                <div key={poll.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{poll.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 11, color: 'var(--text3)' }}>📊 {poll.voters?.length||0} votes</span><Tag color="purple">{poll.status}</Tag></div>
                </div>
              ))}
            </div>
          ) : <Empty icon={BarChart2} label="No active polls"/>}
        </Card>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ANALYTICS TAB
  // ══════════════════════════════════════════════════════════════════════════
  const TabAnalytics = () => {
    const weekTrend = Array.from({length:12},(_,i)=>{const s=subDays(now,(11-i)*7),e=subDays(now,(10-i)*7);return{label:format(s,'MMM d'),value:checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).length};});
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { icon: Activity,   label: 'Daily Average',    value: Math.round(ci30.length/30),      color: '#0ea5e9', sub: 'check-ins / day (30d)' },
            { icon: TrendingUp, label: 'Monthly Change',   value: `${monthChangePct>=0?'+':''}${monthChangePct}%`, color: monthChangePct>=0?'#10b981':'#ef4444', sub: 'vs previous 30 days' },
            { icon: Users,      label: 'Avg Visits / Member', value: totalMembers>0?(ci30.length/totalMembers).toFixed(1):'—', color: '#a78bfa', sub: 'per member (30d)' },
            { icon: Zap,        label: 'Return Rate',      value: `${checkIns.length>0?Math.round((checkIns.filter(c=>!c.first_visit).length/checkIns.length)*100):0}%`, color: '#f59e0b', sub: 'of all check-ins' },
          ].map((k,i) => (
            <Card key={i} style={{ padding: '18px 20px' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${k.color}18`, border: `1px solid ${k.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <k.icon style={{ width: 16, height: 16, color: k.color }}/>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>{k.sub}</div>
            </Card>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <SectionTitle>Weekly Trend <span style={{fontSize:11,color:'var(--text3)',fontWeight:400}}>— 12 weeks</span></SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weekTrend} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <defs><linearGradient id="wtGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="label" tick={{fill:'#475569',fontSize:9,fontFamily:'Outfit'}} axisLine={false} tickLine={false} interval={2}/>
                <YAxis tick={{fill:'#475569',fontSize:9,fontFamily:'Outfit'}} axisLine={false} tickLine={false} width={24}/>
                <Tooltip content={<ChartTip/>} cursor={{stroke:'rgba(59,130,246,0.2)',strokeWidth:1,strokeDasharray:'4 4'}}/>
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#wtGrad)" dot={false} activeDot={{r:4,fill:'#3b82f6',stroke:'#fff',strokeWidth:2}}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ padding: 20 }}>
            <SectionTitle>Attendance Heatmap</SectionTitle>
            <AttendanceHeatmap checkIns={checkIns}/>
          </Card>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <SectionTitle>Peak Hours</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(() => {
                const acc = {}; checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); acc[h] = (acc[h]||0)+1; });
                const max = Math.max(...Object.values(acc),1);
                return Object.entries(acc).sort(([,a],[,b])=>b-a).slice(0,8).map(([hour,count],i) => {
                  const h = parseInt(hour); const label = h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`;
                  return (
                    <div key={hour} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', width: 18, textAlign: 'right', flexShrink: 0 }}>#{i+1}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)', width: 40, flexShrink: 0 }}>{label}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ height: '100%', width: `${(count/max)*100}%`, borderRadius: 99, background: 'linear-gradient(90deg,#8b5cf6,#ec4899)', transition: 'width 0.6s ease' }}/>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', width: 24, textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </Card>
          <Card style={{ padding: 20 }}>
            <SectionTitle>Busiest Days</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(() => {
                const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                const acc = {}; checkIns.forEach(c => { const d = new Date(c.check_in_date).getDay(); acc[d] = (acc[d]||0)+1; });
                const max = Math.max(...Object.values(acc),1);
                return days.map((name,idx)=>({name,count:acc[idx]||0})).sort((a,b)=>b.count-a.count).map(({name,count},rank) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', width: 18, textAlign: 'right', flexShrink: 0 }}>#{rank+1}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)', width: 32, flexShrink: 0 }}>{name}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ height: '100%', width: `${(count/max)*100}%`, borderRadius: 99, background: 'linear-gradient(90deg,#0ea5e9,#06b6d4)', transition: 'width 0.6s ease' }}/>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', width: 24, textAlign: 'right' }}>{count}</span>
                  </div>
                ));
              })()}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SETTINGS TAB (Gym)
  // ══════════════════════════════════════════════════════════════════════════
  const TabGym = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(14,165,233,0.3)' }}>
              <Dumbbell style={{ width: 24, height: 24, color: '#fff' }}/>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.03em' }}>{selectedGym?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{selectedGym?.type} · {selectedGym?.city}</div>
            </div>
          </div>
          <button onClick={() => openModal('editInfo')} style={{ padding: '8px 16px', borderRadius: 99, background: 'rgba(14,165,233,0.12)', color: 'var(--cyan)', border: '1px solid rgba(14,165,233,0.25)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit Info</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { l: 'Price',    v: selectedGym?.price ? `£${selectedGym.price}/mo` : 'Not set', c: '#f59e0b' },
            { l: 'Address',  v: selectedGym?.address, c: 'var(--text1)' },
            { l: 'Postcode', v: selectedGym?.postcode, c: 'var(--text1)' },
            { l: 'Status',   v: selectedGym?.verified ? '✓ Verified' : 'Pending', c: selectedGym?.verified ? '#10b981' : '#f59e0b' },
          ].map((f, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 4 }}>{f.l}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: f.c, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.v || '—'}</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { icon: Calendar, label: 'Classes',   sub: `${classes.length} total`,                    color: '#10b981', fn: () => openModal('classes') },
          { icon: Users,    label: 'Coaches',   sub: `${coaches.length} total`,                    color: '#0ea5e9', fn: () => openModal('coaches') },
          { icon: Dumbbell, label: 'Equipment', sub: `${selectedGym?.equipment?.length||0} items`,  color: '#a78bfa', fn: () => openModal('equipment') },
          { icon: Star,     label: 'Amenities', sub: `${selectedGym?.amenities?.length||0} listed`, color: '#f59e0b', fn: () => openModal('amenities') },
        ].map(({ icon: Icon, label, sub, color, fn }, i) => (
          <Card key={i} style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={fn}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon style={{ width: 17, height: 17, color }}/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle action={() => openModal('photos')} actionLabel="Manage">Photo Gallery</SectionTitle>
          {selectedGym?.gallery?.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
              {selectedGym.gallery.map((url, i) => <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' }}/>)}
            </div>
          ) : (
            <div onClick={() => openModal('photos')} style={{ padding: '24px', borderRadius: 12, border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>
              <ImageIcon style={{ width: 16, height: 16 }}/> Add Photos
            </div>
          )}
        </Card>
        <Card style={{ padding: 20 }}>
          <SectionTitle>Admin</SectionTitle>
          {[{l:'Owner Email',v:selectedGym?.owner_email},{l:'Gym ID',v:selectedGym?.id,mono:true},{l:'Status',v:selectedGym?.verified?'✓ Verified':'Not Verified',c:selectedGym?.verified?'#10b981':'#f87171'}].map((f,i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{f.l}</div>
              <div style={{ fontSize: f.mono ? 11 : 13, fontWeight: 600, color: f.c || 'var(--text1)', fontFamily: f.mono ? 'monospace' : 'Outfit', wordBreak: 'break-all' }}>{f.v || '—'}</div>
            </div>
          ))}
          <Link to={createPageUrl('GymCommunity')+'?id='+selectedGym?.id}>
            <button style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--text1)', border: '1px solid rgba(255,255,255,0.09)', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>View Public Gym Page →</button>
          </Link>
        </Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { title: 'Delete Gym',    desc: 'Permanently delete this gym and all its data.',  fn: () => openModal('deleteGym') },
          { title: 'Delete Account',desc: 'Permanently delete your account and all gyms.',   fn: () => openModal('deleteAccount') },
        ].map((d,i) => (
          <Card key={i} style={{ padding: 18, border: '1px solid rgba(239,68,68,0.16)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}><Trash2 style={{ width: 14, height: 14, color: '#f87171' }}/><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{d.title}</span></div>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.4 }}>{d.desc}</p>
            <button onClick={d.fn} style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
          </Card>
        ))}
      </div>
    </div>
  );

  const TABS = { overview: <TabOverview/>, members: <TabMembers/>, content: <TabContent/>, analytics: <TabAnalytics/>, growth: <TabAnalytics/>, gym: <TabGym/> };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="dash-root" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}>
      <style>{STYLE}</style>

      {/* ─── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 64 : 220, flexShrink: 0, height: '100%', overflow: 'hidden',
        background: 'var(--sidebar)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Gym header */}
        <div style={{ padding: collapsed ? '16px 0' : '18px 16px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(14,165,233,0.3)' }}>
              <Dumbbell style={{ width: 17, height: 17, color: '#fff' }}/>
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{selectedGym?.name || 'Dashboard'}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>Gym Owner</div>
              </div>
            )}
          </div>
          {!collapsed && approvedGyms.length > 1 && (
            <div style={{ position: 'relative', marginTop: 10 }}>
              <button onClick={() => setGymOpen(o=>!o)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedGym?.name}</span>
                <ChevronDown style={{ width: 12, height: 12, flexShrink: 0, transform: gymOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
              </button>
              {gymOpen && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: '110%', borderRadius: 10, overflow: 'hidden', background: '#080d1e', border: '1px solid rgba(0,212,255,0.25)', zIndex: 20 }}>
                  {approvedGyms.map(g => <button key={g.id} onClick={() => { setSelectedGym(g); setGymOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 12, fontWeight: 600, background: selectedGym?.id===g.id?'rgba(0,212,255,0.1)':'transparent', color: selectedGym?.id===g.id?'var(--cyan)':'var(--text2)', border: 'none', cursor: 'pointer' }}>{g.name}</button>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {NAV.map(item => {
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`nav-item ${active ? 'active' : ''}`}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px 0' : '9px 12px', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', background: 'transparent', color: active ? 'var(--cyan)' : 'var(--text3)', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', marginBottom: 2 }}>
                <item.icon style={{ width: 17, height: 17, flexShrink: 0 }}/>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && active && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)' }}/>}
              </button>
            );
          })}
        </nav>

        {/* Retention Pro promo */}
        {!collapsed && (
          <div style={{ padding: '0 8px 10px', flexShrink: 0 }}>
            <Link to={createPageUrl('Plus')}>
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(236,72,153,0.12))', border: '1px solid rgba(139,92,246,0.28)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Crown style={{ width: 13, height: 13, color: '#a78bfa' }}/>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)' }}>Retention Pro</span>
                </div>
                <div style={{ fontSize: 11, color: '#9b7de0' }}>From £49.99/mo</div>
              </div>
            </Link>
          </div>
        )}

        {/* Bottom links */}
        <div style={{ padding: '0 8px 14px', borderTop: '1px solid var(--border)', paddingTop: 10, flexShrink: 0 }}>
          {[
            { icon: Eye, label: 'View Gym Page', to: createPageUrl('GymCommunity')+'?id='+selectedGym?.id },
            { icon: Users, label: 'Member View', to: createPageUrl('Home') },
          ].map((l,i) => (
            <Link key={i} to={l.to}>
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '9px 0' : '8px 12px', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', background: 'transparent', color: 'var(--text3)', fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 8, marginBottom: 2, transition: 'color 0.15s' }}>
                <l.icon style={{ width: 15, height: 15, flexShrink: 0 }}/>
                {!collapsed && <span>{l.label}</span>}
              </button>
            </Link>
          ))}
          <button onClick={() => base44.auth.logout()}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '9px 0' : '8px 12px', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', background: 'transparent', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 8 }}>
            <LogOut style={{ width: 15, height: 15, flexShrink: 0 }}/>
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── MAIN ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 22px', background: 'var(--sidebar)', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setCollapsed(o=>!o)}
              style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text3)', cursor: 'pointer' }}>
              <Menu style={{ width: 15, height: 15 }}/>
            </button>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em', lineHeight: 1 }}>{selectedGym?.name || 'Dashboard'}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                {format(now, 'EEEE, d MMMM yyyy')}
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text3)' }}>
                  <Sun style={{ width: 11, height: 11 }}/>
                  <span>18°C</span>
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {atRisk > 0 && (
              <button onClick={() => setTab('members')} className="pill-btn" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlertTriangle style={{ width: 12, height: 12 }}/>{atRisk} at risk
              </button>
            )}
            <button onClick={() => openModal('qrScanner')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'rgba(0,212,255,0.12)', color: 'var(--cyan)', border: '1px solid rgba(0,212,255,0.28)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <QrCode style={{ width: 14, height: 14 }}/> Scan QR
            </button>
            <button onClick={() => openModal('post')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', color: 'var(--text1)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Plus style={{ width: 14, height: 14 }}/> New Post
            </button>
            {/* Notification bell */}
            <div style={{ position: 'relative' }}>
              <button style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text2)', cursor: 'pointer', position: 'relative' }}>
                <Bell style={{ width: 15, height: 15 }}/>
                {atRisk > 0 && <div style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1.5px solid var(--sidebar)' }}/>}
              </button>
            </div>
            {/* User avatar */}
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>
                {(currentUser?.full_name || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{(currentUser?.full_name || currentUser?.email || 'User').split(' ')[0]}</span>
              <ChevronDown style={{ width: 12, height: 12, color: 'var(--text3)' }}/>
            </button>
          </div>
        </header>

        {/* Main scroll area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '22px 22px 32px' }}>
          <div style={{ maxWidth: 1400 }}>
            {TABS[tab] || TABS.overview}
          </div>
        </main>
      </div>

      {/* ─── MODALS ──────────────────────────────────────────────────────── */}
      <ManageRewardsModal    open={modal==='rewards'}    onClose={closeModal} rewards={rewards}   onCreateReward={d=>createRewardM.mutate(d)}  onDeleteReward={id=>deleteRewardM.mutate(id)} gym={selectedGym} isLoading={createRewardM.isPending}/>
      <ManageClassesModal    open={modal==='classes'}    onClose={closeModal} classes={classes}   onCreateClass={d=>createClassM.mutate(d)}    onUpdateClass={(id,data)=>updateClassM.mutate({id,data})} onDeleteClass={id=>deleteClassM.mutate(id)} gym={selectedGym} isLoading={createClassM.isPending||updateClassM.isPending}/>
      <ManageCoachesModal    open={modal==='coaches'}    onClose={closeModal} coaches={coaches}   onCreateCoach={d=>createCoachM.mutate(d)}    onDeleteCoach={id=>deleteCoachM.mutate(id)}  gym={selectedGym} isLoading={createCoachM.isPending}/>
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
        <AlertDialogContent style={{background:'#0d1121',border:'1px solid rgba(239,68,68,0.3)'}} className="max-w-md">
          <AlertDialogHeader><AlertDialogTitle style={{color:'var(--text1)',display:'flex',alignItems:'center',gap:8}}><Trash2 style={{width:18,height:18,color:'#f87171'}}/>Delete Gym Permanently?</AlertDialogTitle><AlertDialogDescription style={{color:'var(--text2)',fontSize:13}}>Deletes <strong style={{color:'var(--text1)'}}>{selectedGym?.name}</strong> and all its data. <span style={{color:'#f87171',fontWeight:600}}>Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel style={{background:'rgba(255,255,255,0.05)',color:'var(--text1)',border:'1px solid rgba(255,255,255,0.1)'}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteGymM.mutate()} disabled={deleteGymM.isPending} style={{background:'#dc2626',color:'#fff'}}>{deleteGymM.isPending?'Deleting…':'Delete Permanently'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={modal==='deleteAccount'} onOpenChange={v=>!v&&closeModal()}>
        <AlertDialogContent style={{background:'#0d1121',border:'1px solid rgba(239,68,68,0.3)'}} className="max-w-md">
          <AlertDialogHeader><AlertDialogTitle style={{color:'var(--text1)',display:'flex',alignItems:'center',gap:8}}><Trash2 style={{width:18,height:18,color:'#f87171'}}/>Delete Account?</AlertDialogTitle><AlertDialogDescription style={{color:'var(--text2)',fontSize:13}}>Deletes your account, all gyms, and personal data. <span style={{color:'#f87171',fontWeight:600}}>Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel style={{background:'rgba(255,255,255,0.05)',color:'var(--text1)',border:'1px solid rgba(255,255,255,0.1)'}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteAccountM.mutate()} disabled={deleteAccountM.isPending} style={{background:'#dc2626',color:'#fff'}}>{deleteAccountM.isPending?'Deleting…':'Delete Account'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {modal==='qrCode' && (
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)'}}>
          <div style={{borderRadius:24,padding:36,maxWidth:360,width:'100%',background:'#0d1121',border:'1px solid rgba(0,212,255,0.3)',boxShadow:'0 24px 64px rgba(0,0,0,0.7)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
              <h3 style={{fontSize:16,fontWeight:800,color:'var(--text1)'}}>Gym Join QR Code</h3>
              <button onClick={closeModal} style={{width:30,height:30,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'var(--text2)',cursor:'pointer'}}><X style={{width:14,height:14}}/></button>
            </div>
            <div id="qr-fullscreen" style={{display:'flex',justifyContent:'center',padding:20,borderRadius:16,background:'#fff',marginBottom:16}}>
              <QRCode value={`${window.location.origin}${createPageUrl('Gyms')}?joinCode=${selectedGym?.join_code}`} size={220} level="H"/>
            </div>
            <p style={{textAlign:'center',fontSize:13,color:'var(--text2)',marginBottom:16}}>Join code: <strong style={{color:'var(--text1)',letterSpacing:'0.15em'}}>{selectedGym?.join_code}</strong></p>
            <button onClick={()=>{const svg=document.getElementById('qr-fullscreen')?.querySelector('svg');if(!svg)return;const d=new XMLSerializer().serializeToString(svg);const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');const img=new Image();img.onload=()=>{canvas.width=img.width;canvas.height=img.height;ctx.drawImage(img,0,0);const a=document.createElement('a');a.download=`${selectedGym?.name}-QR.png`;a.href=canvas.toDataURL('image/png');a.click();};img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(d)));}}
              style={{width:'100%',padding:'11px',borderRadius:12,background:'linear-gradient(135deg,#10b981,#0d9488)',color:'#fff',border:'none',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,marginBottom:8}}>
              <Download style={{width:14,height:14}}/> Download QR Code
            </button>
            <button onClick={closeModal} style={{width:'100%',padding:'10px',borderRadius:12,background:'rgba(255,255,255,0.05)',color:'var(--text2)',border:'1px solid rgba(255,255,255,0.09)',fontSize:13,fontWeight:600,cursor:'pointer'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}