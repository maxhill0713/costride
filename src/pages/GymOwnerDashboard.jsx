import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Trophy, Calendar, Star, Target, Activity,
  Plus, Edit, Image as ImageIcon, Dumbbell, CheckCircle, Download,
  X, Crown, Trash2, Clock, Gift, ChevronRight, Zap, BarChart2, Shield,
  Eye, Menu, LayoutDashboard, Flame, FileText, BarChart3, Settings,
  LogOut, ChevronDown, AlertTriangle, QrCode
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

// ─── Design tokens ────────────────────────────────────────────────────────────
const N = {
  950: '#060d1f',
  900: '#0a1628',
  850: '#0d1e35',
  800: '#112040',
  750: '#152649',
  700: '#1a2f57',
  600: '#213a6b',
  500: '#2a4a85',
};

const NAV_ITEMS = [
  { id: 'snapshot',   label: 'Overview',   icon: LayoutDashboard },
  { id: 'engagement', label: 'Engagement', icon: Flame },
  { id: 'content',    label: 'Content',    icon: FileText },
  { id: 'insights',   label: 'Insights',   icon: BarChart3 },
  { id: 'admin',      label: 'Settings',   icon: Settings },
];

// ─── Shared micro-components ──────────────────────────────────────────────────

const KpiCard = ({ icon: Icon, iconColor, label, value, sub, trend }) => (
  <div className="relative overflow-hidden rounded-xl p-5 border transition-all duration-200 hover:-translate-y-0.5"
    style={{ background: `linear-gradient(135deg, ${N[800]}, ${N[850]})`, borderColor: 'rgba(59,130,246,0.14)' }}>
    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.04]" style={{ background: iconColor }} />
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}28` }}>
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          style={{ background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)' }}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="text-3xl font-black text-white tracking-tight mb-1">{value}</div>
    <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#6b87b8' }}>{label}</div>
    {sub && <div className="text-xs" style={{ color: '#3d5a8a' }}>{sub}</div>}
  </div>
);

const Panel = ({ children, className = '' }) => (
  <div className={`rounded-2xl border p-6 ${className}`}
    style={{ background: `linear-gradient(145deg, ${N[800]}, ${N[850]})`, borderColor: 'rgba(59,130,246,0.12)' }}>
    {children}
  </div>
);

const PanelHeader = ({ title, subtitle, action, actionLabel, badge }) => (
  <div className="flex items-center justify-between mb-5">
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: '#4a6492' }}>{subtitle}</p>}
    </div>
    <div className="flex items-center gap-2">
      {badge !== undefined && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: N[700], color: '#6b87b8' }}>{badge}</span>}
      {action && (
        <button onClick={action} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:brightness-125"
          style={{ background: N[700], color: '#93b4e8', border: `1px solid ${N[600]}` }}>
          <Plus className="w-3.5 h-3.5" />{actionLabel || 'Add'}
        </button>
      )}
    </div>
  </div>
);

const DT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-2xl text-xs" style={{ background: N[900], border: `1px solid ${N[600]}` }}>
      <p className="mb-1" style={{ color: '#6b87b8' }}>{label}</p>
      {payload.map((p, i) => <p key={i} className="font-bold" style={{ color: p.color }}>{p.value} {p.name}</p>)}
    </div>
  );
};

const Tag = ({ children, color = 'blue' }) => {
  const m = { blue: ['rgba(59,130,246,0.15)', '#93c5fd', 'rgba(59,130,246,0.25)'], green: ['rgba(16,185,129,0.15)', '#6ee7b7', 'rgba(16,185,129,0.25)'], orange: ['rgba(249,115,22,0.15)', '#fdba74', 'rgba(249,115,22,0.25)'], red: ['rgba(239,68,68,0.15)', '#fca5a5', 'rgba(239,68,68,0.25)'], purple: ['rgba(139,92,246,0.15)', '#c4b5fd', 'rgba(139,92,246,0.25)'] };
  const [bg, text, border] = m[color] || m.blue;
  return <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: bg, color: text, border: `1px solid ${border}` }}>{children}</span>;
};

const HR = () => <div className="my-5" style={{ borderTop: `1px solid rgba(59,130,246,0.08)` }} />;

// ─── Root component ───────────────────────────────────────────────────────────

export default function GymOwnerDashboard() {
  const [activeTab, setActiveTab]   = useState('snapshot');
  const [collapsed, setCollapsed]   = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const [gymOpen, setGymOpen]       = useState(false);

  const [showManageRewards, setShowManageRewards]     = useState(false);
  const [showManageClasses, setShowManageClasses]     = useState(false);
  const [showManageCoaches, setShowManageCoaches]     = useState(false);
  const [showManagePhotos, setShowManagePhotos]       = useState(false);
  const [showManageMembers, setShowManageMembers]     = useState(false);
  const [showCreatePost, setShowCreatePost]           = useState(false);
  const [showCreateEvent, setShowCreateEvent]         = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showQRScanner, setShowQRScanner]             = useState(false);
  const [showQRModal, setShowQRModal]                 = useState(false);
  const [showManageEquipment, setShowManageEquipment] = useState(false);
  const [showManageAmenities, setShowManageAmenities] = useState(false);
  const [showEditBasicInfo, setShowEditBasicInfo]     = useState(false);
  const [showDeleteGym, setShowDeleteGym]             = useState(false);
  const [showCreatePoll, setShowCreatePoll]           = useState(false);
  const [showDeleteAccount, setShowDeleteAccount]     = useState(false);

  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000 });
  React.useEffect(() => { if (currentUser && !currentUser.onboarding_completed) navigate(createPageUrl('Onboarding')); }, [currentUser, navigate]);

  const { data: gyms = [], error: gymsError } = useQuery({
    queryKey: ['ownerGyms', currentUser?.email],
    queryFn: () => base44.entities.Gym.filter({ owner_email: currentUser.email }),
    enabled: !!currentUser?.email, retry: 3, staleTime: 5 * 60 * 1000,
  });

  const myGyms       = gyms.filter(g => g.owner_email === currentUser?.email);
  const approvedGyms = myGyms.filter(g => g.status === 'approved');
  const pendingGyms  = myGyms.filter(g => g.status === 'pending');

  React.useEffect(() => { if (approvedGyms.length > 0 && !selectedGym) setSelectedGym(approvedGyms[0]); }, [approvedGyms, selectedGym]);
  React.useEffect(() => { const iv = setInterval(() => queryClient.invalidateQueries({ queryKey: ['ownerGyms'] }), 10000); return () => clearInterval(iv); }, [queryClient]);

  const qOpts = { staleTime: 3 * 60 * 1000, placeholderData: p => p };
  const enabled = !!selectedGym;
  const { data: allMemberships = [] } = useQuery({ queryKey: ['memberships', selectedGym?.id], queryFn: () => base44.entities.GymMembership.filter({ gym_id: selectedGym.id, status: 'active' }), enabled: enabled && !!currentUser, ...qOpts });
  const { data: checkIns = [] }       = useQuery({ queryKey: ['checkIns',    selectedGym?.id], queryFn: () => base44.entities.CheckIn.filter({ gym_id: selectedGym.id }, '-check_in_date', 500), enabled, ...qOpts });
  const { data: lifts = [] }          = useQuery({ queryKey: ['lifts',       selectedGym?.id], queryFn: () => base44.entities.Lift.filter({ gym_id: selectedGym.id }, '-lift_date', 200),        enabled, ...qOpts });
  const { data: rewards = [] }        = useQuery({ queryKey: ['rewards',     selectedGym?.id], queryFn: () => base44.entities.Reward.filter({ gym_id: selectedGym.id }),                         enabled, ...qOpts });
  const { data: classes = [] }        = useQuery({ queryKey: ['classes',     selectedGym?.id], queryFn: () => base44.entities.GymClass.filter({ gym_id: selectedGym.id }),                       enabled, ...qOpts });
  const { data: coaches = [] }        = useQuery({ queryKey: ['coaches',     selectedGym?.id], queryFn: () => base44.entities.Coach.filter({ gym_id: selectedGym.id }),                          enabled, ...qOpts });
  const { data: events = [] }         = useQuery({ queryKey: ['events',      selectedGym?.id], queryFn: () => base44.entities.Event.filter({ gym_id: selectedGym.id }, '-event_date'),            enabled, ...qOpts });
  const { data: posts = [] }          = useQuery({ queryKey: ['posts',       selectedGym?.id], queryFn: () => base44.entities.Post.filter({ allow_gym_repost: true }, '-created_date', 20),       enabled, ...qOpts });
  const { data: challenges = [] }     = useQuery({ queryKey: ['challenges',  selectedGym?.id], queryFn: () => base44.entities.Challenge.filter({ gym_id: selectedGym.id }, '-created_date'),      enabled, ...qOpts });
  const { data: polls = [] }          = useQuery({ queryKey: ['polls',       selectedGym?.id], queryFn: () => base44.entities.Poll.filter({ gym_id: selectedGym.id, status: 'active' }, '-created_date'), enabled, ...qOpts });

  const inv = (...keys) => keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k, selectedGym?.id] }));
  const createRewardM    = useMutation({ mutationFn: d => base44.entities.Reward.create(d),    onSuccess: () => inv('rewards') });
  const deleteRewardM    = useMutation({ mutationFn: id => base44.entities.Reward.delete(id),  onSuccess: () => inv('rewards') });
  const createClassM     = useMutation({ mutationFn: d => base44.entities.GymClass.create(d),  onSuccess: () => inv('classes') });
  const deleteClassM     = useMutation({ mutationFn: id => base44.entities.GymClass.delete(id),onSuccess: () => inv('classes') });
  const updateClassM     = useMutation({ mutationFn: ({ id, data }) => base44.entities.GymClass.update(id, data), onSuccess: () => inv('classes') });
  const createCoachM     = useMutation({ mutationFn: d => base44.entities.Coach.create(d),     onSuccess: () => inv('coaches') });
  const deleteCoachM     = useMutation({ mutationFn: id => base44.entities.Coach.delete(id),   onSuccess: () => inv('coaches') });
  const updateGalleryM   = useMutation({ mutationFn: g => base44.entities.Gym.update(selectedGym.id, { gallery: g }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gyms'] }); setShowManagePhotos(false); } });
  const updateGymM       = useMutation({ mutationFn: d => base44.entities.Gym.update(selectedGym.id, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gyms'] }); setShowManageEquipment(false); setShowManageAmenities(false); setShowEditBasicInfo(false); } });
  const createEventM     = useMutation({ mutationFn: d => base44.entities.Event.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, attendees: 0 }), onSuccess: () => { inv('events'); setShowCreateEvent(false); } });
  const createChallengeM = useMutation({ mutationFn: d => base44.entities.Challenge.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, participants: [], status: 'upcoming' }), onSuccess: () => { inv('challenges'); setShowCreateChallenge(false); } });
  const banMemberM       = useMutation({ mutationFn: uid => base44.entities.Gym.update(selectedGym.id, { banned_members: [...(selectedGym?.banned_members || []), uid] }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gyms'] }) });
  const unbanMemberM     = useMutation({ mutationFn: uid => base44.entities.Gym.update(selectedGym.id, { banned_members: (selectedGym?.banned_members || []).filter(id => id !== uid) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gyms'] }) });
  const deleteGymM       = useMutation({ mutationFn: () => base44.entities.Gym.delete(selectedGym.id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gyms'] }); setShowDeleteGym(false); window.location.href = createPageUrl('Gyms'); } });
  const deleteAccountM   = useMutation({ mutationFn: () => base44.functions.invoke('deleteUserAccount'), onSuccess: () => { setShowDeleteAccount(false); base44.auth.logout(); } });
  const createPollM      = useMutation({ mutationFn: d => base44.entities.Poll.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, created_by: currentUser.id, voters: [] }), onSuccess: () => { inv('polls'); setShowCreatePoll(false); } });

  // ── Splash screens ────────────────────────────────────────────────────────
  const Splash = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: N[950] }}>
      <Panel className="max-w-md w-full text-center">{children}</Panel>
    </div>
  );

  if (gymsError) return <Splash><div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-5"><X className="w-7 h-7 text-red-400" /></div><h2 className="text-xl font-black text-white mb-2">Error</h2><p className="text-sm mb-6" style={{ color: '#6b87b8' }}>{gymsError.message}</p><Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-500 text-white">Retry</Button></Splash>;

  if (approvedGyms.length === 0 && pendingGyms.length > 0) return <Splash><div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center mx-auto mb-5"><Clock className="w-7 h-7 text-yellow-400" /></div><h2 className="text-xl font-black text-white mb-2">Pending Approval</h2><p className="text-sm mb-6" style={{ color: '#6b87b8' }}>Your gym <span className="text-yellow-400 font-bold">{pendingGyms[0].name}</span> is under review.</p><Link to={createPageUrl('Home')}><Button style={{ background: N[700], color: '#93b4e8' }}>Back to Home</Button></Link></Splash>;

  if (myGyms.length === 0) return <Splash><div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mx-auto mb-5"><Dumbbell className="w-7 h-7 text-blue-400" /></div><h2 className="text-xl font-black text-white mb-2">No Gyms</h2><p className="text-sm mb-6" style={{ color: '#6b87b8' }}>Register your gym to get started.</p><Link to={createPageUrl('GymSignup')}><Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">Register Your Gym</Button></Link></Splash>;

  // ── Stats ─────────────────────────────────────────────────────────────────
  const now             = new Date();
  const uniqueMembers   = new Set(checkIns.map(c => c.user_id)).size;
  const last7Days       = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 7), end: now })).length;
  const last30Days      = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 30), end: now })).length;
  const todayCI         = checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(now).getTime()).length;
  const activeThisWeek  = new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 7), end: now })).map(c => c.user_id)).size;
  const activeLastWeek  = new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 14), end: subDays(now, 7) })).map(c => c.user_id)).size;
  const weeklyChangePct = activeLastWeek > 0 ? Math.round(((activeThisWeek - activeLastWeek) / activeLastWeek) * 100) : 0;
  const retentionRate   = uniqueMembers > 0 ? Math.round((new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 30), end: now })).map(c => c.user_id)).size / uniqueMembers) * 100) : 0;
  const atRisk          = allMemberships.filter(m => { const mci = checkIns.filter(c => c.user_id === m.user_id); if (!mci.length) return false; const d = Math.floor((now - new Date(mci[0].check_in_date)) / 86400000); return d >= 7 && d <= 10; }).length;

  const ciByDay     = Array.from({ length: 7 }, (_, i) => { const d = subDays(now, 6 - i); return { day: format(d, 'EEE'), value: checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(d).getTime()).length }; });
  const weekTrend   = Array.from({ length: 12 }, (_, i) => { const s = subDays(now, (11 - i) * 7), e = subDays(now, (10 - i) * 7); return { label: format(s, 'MMM d'), value: checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: s, end: e })).length }; });
  const monthMembers = Array.from({ length: 6 }, (_, i) => { const e = subDays(now, i * 30), s = subDays(e, 30); return { label: format(e, 'MMM'), value: new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: s, end: e })).map(c => c.user_id)).size }; }).reverse();
  const monthCiPer  = (() => { const m = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 30), end: now })); const acc = {}; m.forEach(c => { acc[c.user_id] = (acc[c.user_id] || 0) + 1; }); return Object.values(acc); })();

  const dlQR = (id) => {
    const svg = document.getElementById(id)?.querySelector('svg'); if (!svg) return;
    const d = new XMLSerializer().serializeToString(svg); const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const img = new Image();
    img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0); const a = document.createElement('a'); a.download = `${selectedGym?.name}-QR.png`; a.href = canvas.toDataURL('image/png'); a.click(); };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(d)));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TAB RENDERERS
  // ─────────────────────────────────────────────────────────────────────────

  const Snapshot = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Dumbbell} iconColor="#60a5fa" label="Today's Check-ins" value={todayCI}         sub="members today" />
        <KpiCard icon={Users}    iconColor="#34d399" label="Active This Week"  value={activeThisWeek}  sub={`of ${uniqueMembers} total`} trend={weeklyChangePct} />
        <KpiCard icon={Activity} iconColor="#a78bfa" label="Check-ins (30d)"  value={last30Days}       sub={`${last7Days} this week`} />
        <KpiCard icon={Star}     iconColor="#fbbf24" label="Avg Rating"        value={selectedGym?.rating?.toFixed(1) ?? '—'} sub="out of 5.0" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel className="xl:col-span-2">
          <PanelHeader title="Check-ins — Last 7 Days" subtitle="Daily attendance" />
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={ciByDay} barSize={34}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#6b87b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b87b8', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<DT />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[5, 5, 0, 0]} name="Check-ins" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PanelHeader title="Action Items" />
          <div className="space-y-3">
            {atRisk > 0 ? (
              <div className="p-3.5 rounded-xl" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <div className="flex gap-3"><AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-white">{atRisk} members at risk</p><p className="text-xs mt-0.5" style={{ color: '#6b87b8' }}>No check-in 7–10 days</p><button onClick={() => setShowManageMembers(true)} className="mt-2 text-xs font-bold text-orange-400 hover:text-orange-300">View →</button></div></div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /><p className="text-sm font-semibold text-white">No at-risk members</p>
              </div>
            )}
            {posts.length < 3 && (
              <div className="p-3.5 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="flex gap-3"><FileText className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-white">Post gym updates</p><p className="text-xs mt-0.5" style={{ color: '#6b87b8' }}>Keep members engaged</p><button onClick={() => setShowCreatePost(true)} className="mt-2 text-xs font-bold text-blue-400 hover:text-blue-300">Create →</button></div></div>
              </div>
            )}
            {!challenges.some(c => c.status === 'active') && (
              <div className="p-3.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="flex gap-3"><Trophy className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-white">Create a challenge</p><p className="text-xs mt-0.5" style={{ color: '#6b87b8' }}>Boost engagement</p><button onClick={() => setShowCreateChallenge(true)} className="mt-2 text-xs font-bold text-emerald-400 hover:text-emerald-300">Create →</button></div></div>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Members',   val: uniqueMembers,               icon: Users,       color: '#60a5fa', action: () => setShowManageMembers(true) },
          { label: 'Classes',   val: classes.length,              icon: Calendar,    color: '#34d399', action: () => setShowManageClasses(true) },
          { label: 'Coaches',   val: coaches.length,              icon: Target,      color: '#fb923c', action: () => setShowManageCoaches(true) },
          { label: 'Rewards',   val: rewards.length,              icon: Gift,        color: '#a78bfa', action: () => setShowManageRewards(true) },
          { label: 'Polls',     val: polls.length,                icon: BarChart2,   color: '#38bdf8', action: () => setShowCreatePoll(true) },
          { label: 'Photos',    val: selectedGym?.gallery?.length || 0, icon: ImageIcon, color: '#f472b6', action: () => setShowManagePhotos(true) },
        ].map((b, i) => (
          <button key={i} onClick={b.action} className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:brightness-110 hover:-translate-y-0.5"
            style={{ background: N[800], border: `1px solid rgba(59,130,246,0.12)` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${b.color}18`, border: `1px solid ${b.color}28` }}>
              <b.icon className="w-4 h-4" style={{ color: b.color }} />
            </div>
            <span className="text-xs font-bold text-white">{b.label}</span>
            <span className="text-xs" style={{ color: '#3d5a8a' }}>{b.val}</span>
          </button>
        ))}
      </div>

      <Panel>
        <PanelHeader title="Recent Activity" subtitle="Last 7 days" />
        <div className="divide-y" style={{ borderColor: 'rgba(59,130,246,0.07)' }}>
          {checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 7), end: now })).slice(0, 12).map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{c.user_name?.charAt(0)?.toUpperCase()}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{c.user_name}</p><p className="text-xs" style={{ color: '#3d5a8a' }}>checked in</p></div>
              <p className="text-xs flex-shrink-0" style={{ color: '#3d5a8a' }}>{format(new Date(c.check_in_date), 'MMM d, h:mma')}</p>
            </div>
          ))}
          {!checkIns.some(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 7), end: now })) && (
            <div className="py-10 text-center"><Activity className="w-10 h-10 mx-auto mb-2" style={{ color: N[600] }} /><p className="text-sm" style={{ color: '#3d5a8a' }}>No activity in the last 7 days</p></div>
          )}
        </div>
      </Panel>
    </div>
  );

  const Engagement = () => {
    const activeM = new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 30), end: now })).map(c => c.user_id));
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard icon={Users}    iconColor="#60a5fa" label="Total Members"   value={uniqueMembers} />
          <KpiCard icon={Zap}      iconColor="#34d399" label="Active (7d)"     value={activeThisWeek} trend={weeklyChangePct} />
          <KpiCard icon={Activity} iconColor="#a78bfa" label="All Check-ins"   value={checkIns.length} />
          <KpiCard icon={Trophy}   iconColor="#fbbf24" label="PRs Logged"      value={lifts.filter(l => l.is_pr).length} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Panel>
            <PanelHeader title="Engagement Tiers" subtitle="Last 30 days" />
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Super Active', sub: '15+ visits/mo', val: monthCiPer.filter(v => v >= 15).length, c: '#34d399', bg: 'rgba(16,185,129,0.08)', b: 'rgba(16,185,129,0.2)', e: '🔥' },
                { label: 'Active',       sub: '8–14 visits/mo',val: monthCiPer.filter(v => v >= 8 && v < 15).length, c: '#60a5fa', bg: 'rgba(59,130,246,0.08)', b: 'rgba(59,130,246,0.2)', e: '💪' },
                { label: 'Casual',       sub: '1–7 visits/mo', val: monthCiPer.filter(v => v >= 1 && v < 8).length,  c: '#fbbf24', bg: 'rgba(251,191,36,0.08)', b: 'rgba(251,191,36,0.2)', e: '🚶' },
                { label: 'At Risk',      sub: '7–10d inactive', val: atRisk, c: '#f87171', bg: 'rgba(248,113,113,0.08)', b: 'rgba(248,113,113,0.2)', e: '⚠️' },
              ].map((t, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: t.bg, border: `1px solid ${t.b}` }}>
                  <p className="text-xl mb-2">{t.e}</p>
                  <p className="text-3xl font-black mb-0.5" style={{ color: t.c }}>{t.val}</p>
                  <p className="text-sm font-bold text-white">{t.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b87b8' }}>{t.sub}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Retention Summary" />
            <div className="space-y-2.5">
              {[
                { label: 'Active This Month', val: activeM.size, c: '#34d399', sub: `of ${uniqueMembers} total` },
                { label: 'Inactive 30+ Days', val: Math.max(0, uniqueMembers - activeM.size), c: '#fb923c', sub: 'consider reaching out' },
                { label: 'Retention Rate',    val: `${retentionRate}%`, c: '#60a5fa', sub: '30-day active rate' },
                { label: 'Monthly Avg Visits',val: uniqueMembers > 0 ? (last30Days / uniqueMembers).toFixed(1) : '—', c: '#a78bfa', sub: 'per member' },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: N[750], border: `1px solid rgba(59,130,246,0.1)` }}>
                  <div><p className="text-sm font-semibold text-white">{r.label}</p><p className="text-xs mt-0.5" style={{ color: '#3d5a8a' }}>{r.sub}</p></div>
                  <p className="text-2xl font-black" style={{ color: r.c }}>{r.val}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Panel>
            <PanelHeader title="Busiest Days" />
            <div className="space-y-2.5">
              {(() => {
                const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                const acc = {}; checkIns.forEach(c => { const d = new Date(c.check_in_date).getDay(); acc[d] = (acc[d]||0)+1; });
                const max = Math.max(...Object.values(acc), 1);
                return days.map((name, idx) => ({ name, count: acc[idx]||0 })).sort((a,b) => b.count-a.count).map(({name, count}, rank) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-5 text-right flex-shrink-0" style={{ color: '#3d5a8a' }}>#{rank+1}</span>
                    <span className="text-sm text-white w-24 flex-shrink-0">{name}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: N[700] }}>
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${(count/max)*100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-white w-8 text-right">{count}</span>
                  </div>
                ));
              })()}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Weekly Leaderboard" subtitle="Top members this week" />
            <div className="space-y-2">
              {Object.entries(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 7), end: now })).reduce((acc, c) => { acc[c.user_name]=(acc[c.user_name]||0)+1; return acc; }, {}))
                .sort(([,a],[,b]) => b-a).slice(0, 8).map(([name, count], idx) => (
                  <div key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={{ background: idx < 3 ? 'rgba(59,130,246,0.07)' : N[750], border: `1px solid ${idx < 3 ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.08)'}` }}>
                    <span className="text-base w-6 text-center flex-shrink-0">{['🥇','🥈','🥉'][idx] || <span className="text-xs" style={{ color: '#3d5a8a' }}>{idx+1}</span>}</span>
                    <span className="flex-1 text-sm font-semibold text-white truncate">{name}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: N[700], color: '#93b4e8' }}>{count} visits</span>
                  </div>
                ))}
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {[
            { label: 'New vs Returning', items: [{ l: 'First-Time', v: checkIns.filter(c=>c.first_visit).length, c:'#34d399'}, {l:'Returning', v:checkIns.filter(c=>!c.first_visit).length, c:'#60a5fa'}, {l:'Return Rate', v:`${checkIns.length>0?Math.round((checkIns.filter(c=>!c.first_visit).length/checkIns.length)*100):0}%`, c:'#a78bfa'}] },
          ].map((s,i) => (
            <Panel key={i} className="xl:col-span-1">
              <PanelHeader title={s.label} />
              <div className="grid grid-cols-3 gap-3">
                {s.items.map((item,j) => (
                  <div key={j} className="text-center p-3 rounded-xl" style={{ background: N[750], border: `1px solid rgba(59,130,246,0.1)` }}>
                    <p className="text-2xl font-black mb-1" style={{ color: item.c }}>{item.v}</p>
                    <p className="text-xs font-semibold text-white">{item.l}</p>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
          <Panel className="xl:col-span-2">
            <PanelHeader title="Visit Frequency" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'All-time Avg', val: uniqueMembers>0?(checkIns.length/uniqueMembers).toFixed(1):'—', sub:'visits / member', c:'#a78bfa' },
                { label: '30d Avg',      val: uniqueMembers>0?(last30Days/uniqueMembers).toFixed(1):'—',    sub:'visits / member', c:'#60a5fa' },
                { label: '7d Avg',       val: activeThisWeek>0?(last7Days/activeThisWeek).toFixed(1):'—',   sub:'visits / active',  c:'#34d399' },
              ].map((s,i) => (
                <div key={i} className="p-4 rounded-xl text-center" style={{ background: N[750], border: `1px solid rgba(59,130,246,0.1)` }}>
                  <p className="text-3xl font-black mb-1" style={{ color: s.c }}>{s.val}</p>
                  <p className="text-sm font-bold text-white">{s.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#3d5a8a' }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    );
  };

  const Content = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Create Event',     sub:`${events.length} total`,      icon:Calendar,  c:'#60a5fa', bg:'rgba(59,130,246,0.1)', b:'rgba(59,130,246,0.22)', onClick:() => setShowCreateEvent(true) },
          { label:'Create Challenge', sub:`${challenges.length} total`,  icon:Trophy,    c:'#fb923c', bg:'rgba(249,115,22,0.1)',  b:'rgba(249,115,22,0.22)',  onClick:() => setShowCreateChallenge(true) },
          { label:'Create Poll',      sub:`${polls.length} active`,      icon:BarChart2, c:'#a78bfa', bg:'rgba(139,92,246,0.1)', b:'rgba(139,92,246,0.22)', onClick:() => setShowCreatePoll(true) },
        ].map((b,i) => (
          <button key={i} onClick={b.onClick} className="flex items-center gap-4 p-5 rounded-2xl text-left transition-all hover:brightness-110 hover:-translate-y-0.5"
            style={{ background: b.bg, border: `1px solid ${b.b}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${b.c}22`, border: `1px solid ${b.c}30` }}>
              <b.icon className="w-5 h-5" style={{ color: b.c }} />
            </div>
            <div><p className="text-sm font-bold text-white">{b.label}</p><p className="text-xs mt-0.5" style={{ color: '#6b87b8' }}>{b.sub}</p></div>
          </button>
        ))}
      </div>

      <Panel>
        <PanelHeader title="Upcoming Events" badge={events.filter(e=>new Date(e.event_date)>=now).length} action={() => setShowCreateEvent(true)} actionLabel="New Event" />
        {events.filter(e=>new Date(e.event_date)>=now).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {events.filter(e=>new Date(e.event_date)>=now).slice(0,6).map(ev => (
              <div key={ev.id} className="p-4 rounded-xl transition-all hover:brightness-105" style={{ background:N[750], border:`1px solid rgba(59,130,246,0.12)` }}>
                {ev.image_url && <img src={ev.image_url} alt={ev.title} className="w-full h-28 object-cover rounded-lg mb-3" />}
                <p className="text-sm font-bold text-white mb-1 truncate">{ev.title}</p>
                <p className="text-xs mb-3 line-clamp-2" style={{ color:'#6b87b8' }}>{ev.description}</p>
                <div className="flex gap-3 text-xs" style={{ color:'#3d5a8a' }}><span>📅 {format(new Date(ev.event_date),'MMM d, h:mma')}</span><span>👥 {ev.attendees||0}</span></div>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-10"><Calendar className="w-10 h-10 mx-auto mb-2" style={{ color:N[600] }} /><p className="text-sm" style={{ color:'#3d5a8a' }}>No upcoming events</p></div>}
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PanelHeader title="Active Challenges" badge={challenges.filter(c=>c.status==='active').length} action={() => setShowCreateChallenge(true)} actionLabel="New" />
          {challenges.filter(c=>c.status==='active').length > 0 ? (
            <div className="space-y-3">
              {challenges.filter(c=>c.status==='active').map(ch => (
                <div key={ch.id} className="p-4 rounded-xl" style={{ background:'rgba(249,115,22,0.07)', border:'1px solid rgba(249,115,22,0.18)' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-white">🏆 {ch.title}</p>
                    <Tag color="orange">{ch.type?.replace('_',' ')}</Tag>
                  </div>
                  <p className="text-xs mb-2 line-clamp-1" style={{ color:'#6b87b8' }}>{ch.description}</p>
                  <div className="flex gap-4 text-xs" style={{ color:'#3d5a8a' }}><span>👥 {ch.participants?.length||0}</span><span>📅 {format(new Date(ch.start_date),'MMM d')} – {format(new Date(ch.end_date),'MMM d')}</span></div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8"><Trophy className="w-10 h-10 mx-auto mb-2" style={{ color:N[600] }} /><p className="text-sm" style={{ color:'#3d5a8a' }}>No active challenges</p></div>}
        </Panel>

        <Panel>
          <PanelHeader title="Active Polls" badge={polls.length} action={() => setShowCreatePoll(true)} actionLabel="New Poll" />
          {polls.length > 0 ? (
            <div className="space-y-3">
              {polls.slice(0,5).map(poll => (
                <div key={poll.id} className="p-4 rounded-xl" style={{ background:'rgba(139,92,246,0.07)', border:'1px solid rgba(139,92,246,0.18)' }}>
                  <p className="text-sm font-bold text-white mb-1 truncate">{poll.title}</p>
                  <p className="text-xs mb-2 line-clamp-1" style={{ color:'#6b87b8' }}>{poll.description}</p>
                  <div className="flex items-center gap-3 text-xs" style={{ color:'#3d5a8a' }}><span>📊 {poll.voters?.length||0} votes</span><Tag color="purple">{poll.status}</Tag></div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8"><BarChart2 className="w-10 h-10 mx-auto mb-2" style={{ color:N[600] }} /><p className="text-sm" style={{ color:'#3d5a8a' }}>No active polls</p></div>}
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PanelHeader title="Gym Feed" action={() => setShowCreatePost(true)} actionLabel="New Post" />
          {posts.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {posts.slice(0,8).map(post => (
                <div key={post.id} className="p-3.5 rounded-xl" style={{ background:N[750], border:`1px solid rgba(59,130,246,0.1)` }}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black">{post.member_name?.charAt(0)?.toUpperCase()}</div>
                    <p className="text-sm font-semibold text-white flex-1">{post.member_name}</p>
                    <p className="text-xs" style={{ color:'#3d5a8a' }}>{format(new Date(post.created_date),'MMM d')}</p>
                  </div>
                  <p className="text-xs line-clamp-2 mb-2" style={{ color:'#6b87b8' }}>{post.content}</p>
                  <div className="flex gap-4 text-xs" style={{ color:'#3d5a8a' }}><span>❤️ {post.likes||0}</span><span>💬 {post.comments?.length||0}</span></div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-10"><FileText className="w-10 h-10 mx-auto mb-2" style={{ color:N[600] }} /><p className="text-sm" style={{ color:'#3d5a8a' }}>No posts yet</p></div>}
        </Panel>

        <Panel>
          <PanelHeader title="Rewards Program" badge={rewards.length} action={() => setShowManageRewards(true)} actionLabel="Manage" />
          {rewards.length > 0 ? (
            <div className="space-y-3">
              {rewards.slice(0,6).map(reward => (
                <div key={reward.id} className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background:N[750], border:`1px solid rgba(59,130,246,0.1)` }}>
                  <span className="text-2xl flex-shrink-0">{reward.icon||'🎁'}</span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">{reward.title}</p><p className="text-xs" style={{ color:'#6b87b8' }}>{reward.claimed_by?.length||0} claimed · {reward.value}</p></div>
                  <Tag color={reward.active ? 'green' : 'blue'}>{reward.active ? 'Active' : 'Off'}</Tag>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-10"><Gift className="w-10 h-10 mx-auto mb-2" style={{ color:N[600] }} /><p className="text-sm" style={{ color:'#3d5a8a' }}>No rewards yet</p></div>}
        </Panel>
      </div>
    </div>
  );

  const Insights = () => {
    const prev30 = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,60), end: subDays(now,30) }));
    const chg = prev30.length > 0 ? (((last30Days - prev30.length) / prev30.length)*100).toFixed(0) : 0;
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard icon={Activity}   iconColor="#60a5fa" label="Last 7 Days"    value={last7Days}               sub="check-ins" />
          <KpiCard icon={BarChart3}  iconColor="#34d399" label="Last 30 Days"   value={last30Days}              sub="check-ins" />
          <KpiCard icon={Zap}        iconColor="#a78bfa" label="Daily Average"  value={Math.round(last30Days/30)} sub="per day" />
          <KpiCard icon={TrendingUp} iconColor={Number(chg)>=0?'#34d399':'#f87171'} label="vs Prev. Month" value={`${Number(chg)>=0?'+':''}${chg}%`} sub="30-day change" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Panel>
            <PanelHeader title="Weekly Check-in Trend" subtitle="Last 12 weeks" />
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weekTrend}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill:'#6b87b8', fontSize:10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fill:'#6b87b8', fontSize:10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<DT />} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#g1)" name="Check-ins" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel>
            <PanelHeader title="Active Members Growth" subtitle="Last 6 months" />
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthMembers}>
                <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill:'#6b87b8', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#6b87b8', fontSize:11 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<DT />} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#g2)" name="Members" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel>
            <PanelHeader title="Rewards Redeemed" subtitle="Top 5 most claimed" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart barSize={28} data={rewards.filter(r=>(r.claimed_by?.length||0)>0).sort((a,b)=>(b.claimed_by?.length||0)-(a.claimed_by?.length||0)).slice(0,5).map(r => ({ label: r.title.length>12?r.title.slice(0,12)+'…':r.title, value: r.claimed_by?.length||0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill:'#6b87b8', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#6b87b8', fontSize:10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<DT />} cursor={{ fill:'rgba(139,92,246,0.06)' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[5,5,0,0]} name="Claims" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel>
            <PanelHeader title="Peak Hours" subtitle="Most popular visit times" />
            <div className="space-y-2.5">
              {(() => {
                const acc = {}; checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); acc[h]=(acc[h]||0)+1; });
                const max = Math.max(...Object.values(acc),1);
                return Object.entries(acc).sort(([,a],[,b])=>b-a).slice(0,8).map(([hour,count],i) => {
                  const h = parseInt(hour); const label = h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`;
                  return (
                    <div key={hour} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-4 text-right flex-shrink-0" style={{ color:'#3d5a8a' }}>#{i+1}</span>
                      <span className="text-sm text-white w-12 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:N[700] }}>
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width:`${(count/max)*100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-white w-7 text-right">{count}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </Panel>
        </div>
      </div>
    );
  };

  const AdminPanel = () => (
    <div className="space-y-5">
      <Panel>
        <PanelHeader title="Gym Profile" subtitle={selectedGym?.name} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color:'#6b87b8' }}>Basic Information</p>
              <button onClick={() => setShowEditBasicInfo(true)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:brightness-125"
                style={{ background:N[700], color:'#93b4e8', border:`1px solid ${N[600]}` }}><Edit className="w-3 h-3" /> Edit</button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[{l:'Name',v:selectedGym?.name},{l:'Type',v:selectedGym?.type},{l:'City',v:selectedGym?.city},{l:'Price',v:`£${selectedGym?.price}/mo`},{l:'Address',v:selectedGym?.address},{l:'Postcode',v:selectedGym?.postcode}].map((f,i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background:N[750], border:`1px solid rgba(59,130,246,0.1)` }}>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color:'#3d5a8a' }}>{f.l}</p>
                  <p className="text-sm font-semibold text-white truncate">{f.v||'—'}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'#6b87b8' }}>Quick Manage</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { l:'Classes',   v:classes.length,                      i:Calendar,    c:'#34d399', fn:() => setShowManageClasses(true) },
                { l:'Coaches',   v:coaches.length,                      i:Target,      c:'#fb923c', fn:() => setShowManageCoaches(true) },
                { l:'Members',   v:uniqueMembers,                       i:Users,       c:'#60a5fa', fn:() => setShowManageMembers(true) },
                { l:'Rewards',   v:rewards.length,                      i:Gift,        c:'#a78bfa', fn:() => setShowManageRewards(true) },
                { l:'Amenities', v:selectedGym?.amenities?.length||0,   i:CheckCircle, c:'#38bdf8', fn:() => setShowManageAmenities(true) },
                { l:'Equipment', v:selectedGym?.equipment?.length||0,   i:Dumbbell,    c:'#f472b6', fn:() => setShowManageEquipment(true) },
              ].map((b,i) => (
                <button key={i} onClick={b.fn} className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:brightness-110"
                  style={{ background:N[750], border:`1px solid rgba(59,130,246,0.1)` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:`${b.c}18`, border:`1px solid ${b.c}28` }}>
                    <b.i className="w-4 h-4" style={{ color:b.c }} />
                  </div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white">{b.l}</p><p className="text-xs" style={{ color:'#3d5a8a' }}>{b.v}</p></div>
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'#3d5a8a' }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <HR />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
          {[
            { title:'Amenities', items:selectedGym?.amenities, color:'blue', fn:() => setShowManageAmenities(true) },
            { title:'Equipment', items:selectedGym?.equipment, color:'purple', fn:() => setShowManageEquipment(true), limit:12 },
          ].map((s,i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color:'#6b87b8' }}>{s.title}</p>
                <button onClick={s.fn} className="text-xs font-semibold transition-colors hover:text-white" style={{ color:'#60a5fa' }}>Edit</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(s.limit ? s.items?.slice(0,s.limit) : s.items)?.map((item,j) => <Tag key={j} color={s.color}>{item}</Tag>)}
                {s.limit && s.items?.length > s.limit && <Tag color="blue">+{s.items.length-s.limit} more</Tag>}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color:'#6b87b8' }}>Photo Gallery</p>
            <button onClick={() => setShowManagePhotos(true)} className="flex items-center gap-1 text-xs font-semibold transition-colors hover:text-white" style={{ color:'#60a5fa' }}>
              <ImageIcon className="w-3 h-3" /> Manage
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {selectedGym?.gallery?.slice(0,12).map((url,i) => <img key={i} src={url} alt="" className="w-full h-16 object-cover rounded-lg" style={{ border:`1px solid ${N[700]}` }} />)}
          </div>
          {!selectedGym?.gallery?.length && <p className="text-sm" style={{ color:'#3d5a8a' }}>No photos yet</p>}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Admin Info" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-4">
          {[{l:'Owner Email',v:selectedGym?.owner_email},{l:'Gym ID',v:selectedGym?.id,mono:true},{l:'Status',v:selectedGym?.verified?'✓ Verified':'Not Verified',c:selectedGym?.verified?'#34d399':'#f87171'}].map((f,i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background:N[750], border:`1px solid rgba(59,130,246,0.1)` }}>
              <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color:'#3d5a8a' }}>{f.l}</p>
              <p className={`text-sm font-semibold ${f.mono?'font-mono text-xs break-all':''}`} style={{ color:f.c||'white' }}>{f.v}</p>
            </div>
          ))}
        </div>
        <Link to={createPageUrl('GymCommunity')+'?id='+selectedGym?.id}>
          <button className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-125"
            style={{ background:N[700], color:'#93b4e8', border:`1px solid ${N[600]}` }}>
            View Public Gym Page →
          </button>
        </Link>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {[
          { title:'Delete Gym', desc:'Permanently delete this gym and all its data. This cannot be undone.', label:'Delete Gym', fn:() => setShowDeleteGym(true) },
          { title:'Delete Account', desc:'Permanently delete your account and all personal data. This cannot be undone.', label:'Delete Account', fn:() => setShowDeleteAccount(true) },
        ].map((d,i) => (
          <div key={i} className="p-5 rounded-2xl" style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.18)' }}>
            <div className="flex items-center gap-2 mb-2"><Trash2 className="w-4 h-4 text-red-400" /><h4 className="font-bold text-white text-sm">{d.title}</h4></div>
            <p className="text-xs mb-4" style={{ color:'#6b87b8' }}>{d.desc}</p>
            <button onClick={d.fn} className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{ background:'rgba(239,68,68,0.12)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.3)' }}>
              {d.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const tabContent = { snapshot: <Snapshot />, engagement: <Engagement />, content: <Content />, insights: <Insights />, admin: <AdminPanel /> };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: N[950], fontFamily:"'DM Sans','Inter',sans-serif" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="flex flex-col h-full flex-shrink-0 transition-all duration-300" style={{ width: collapsed ? 64 : 224, background: N[900], borderRight:`1px solid rgba(59,130,246,0.1)` }}>
        {/* Brand */}
        <div className="px-4 py-5 border-b" style={{ borderColor:'rgba(59,130,246,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Dumbbell className="w-4.5 h-4.5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-white truncate leading-tight">{selectedGym?.name || 'Dashboard'}</p>
                <p className="text-xs" style={{ color:'#3d5a8a' }}>Gym Owner</p>
              </div>
            )}
          </div>
          {/* Gym switcher */}
          {!collapsed && approvedGyms.length > 1 && (
            <div className="mt-3 relative">
              <button onClick={() => setGymOpen(o=>!o)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ background:N[800], color:'#93b4e8', border:`1px solid ${N[700]}` }}>
                <span className="truncate">{selectedGym?.name}</span>
                <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${gymOpen?'rotate-180':''}`} />
              </button>
              {gymOpen && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl z-20" style={{ background:N[800], border:`1px solid ${N[600]}` }}>
                  {approvedGyms.map(g => (
                    <button key={g.id} onClick={() => { setSelectedGym(g); setGymOpen(false); }}
                      className="w-full text-left px-3 py-2.5 text-xs font-semibold transition-all hover:brightness-125"
                      style={{ color:selectedGym?.id===g.id?'#60a5fa':'#93b4e8', background:selectedGym?.id===g.id?'rgba(59,130,246,0.1)':'transparent' }}>
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{ background: active ? 'rgba(59,130,246,0.12)' : 'transparent', color: active ? '#fff' : '#6b87b8', border: active ? '1px solid rgba(59,130,246,0.22)' : '1px solid transparent' }}>
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ color: active ? '#60a5fa' : 'inherit' }} />
                {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!collapsed && active && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Pro upgrade */}
        {!collapsed && (
          <div className="px-2.5 pb-2.5">
            <Link to={createPageUrl('Plus')}>
              <div className="p-3 rounded-xl cursor-pointer transition-all hover:brightness-110"
                style={{ background:'linear-gradient(135deg,rgba(139,92,246,0.18),rgba(236,72,153,0.12))', border:'1px solid rgba(139,92,246,0.28)' }}>
                <div className="flex items-center gap-2 mb-0.5"><Crown className="w-3.5 h-3.5 text-purple-400" /><span className="text-xs font-black text-white">Retention Pro</span></div>
                <p className="text-xs" style={{ color:'#9b7de0' }}>From £49.99/mo</p>
              </div>
            </Link>
          </div>
        )}

        {/* Bottom links */}
        <div className="px-2.5 pb-4 pt-2 border-t space-y-0.5" style={{ borderColor:'rgba(59,130,246,0.1)' }}>
          <Link to={createPageUrl('GymCommunity')+'?id='+selectedGym?.id}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:text-white"
            style={{ color:'#6b87b8', display:'flex' }}>
            <Eye className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'View Gym'}
          </Link>
          <Link to={createPageUrl('Home')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:text-white"
            style={{ color:'#6b87b8', display:'flex' }}>
            <Users className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'Member View'}
          </Link>
          <button onClick={() => base44.auth.logout()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-125"
            style={{ color:'#f87171' }}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'Log Out'}
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3.5 flex-shrink-0 border-b" style={{ background:N[900], borderColor:'rgba(59,130,246,0.1)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setCollapsed(o=>!o)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-125"
              style={{ background:N[800], color:'#6b87b8', border:`1px solid ${N[700]}` }}>
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-black text-white leading-tight">{NAV_ITEMS.find(n=>n.id===activeTab)?.label}</h1>
              <p className="text-xs" style={{ color:'#3d5a8a' }}>{format(now,'EEEE, d MMMM yyyy')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {atRisk > 0 && (
              <button onClick={() => setShowManageMembers(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:brightness-125"
                style={{ background:'rgba(249,115,22,0.1)', color:'#fb923c', border:'1px solid rgba(249,115,22,0.25)' }}>
                <AlertTriangle className="w-3.5 h-3.5" />{atRisk} at risk
              </button>
            )}
            <button onClick={() => setShowQRScanner(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:brightness-125"
              style={{ background:'rgba(16,185,129,0.1)', color:'#34d399', border:'1px solid rgba(16,185,129,0.25)' }}>
              <QrCode className="w-3.5 h-3.5" />Scan QR
            </button>
            {selectedGym?.join_code ? (
              <button onClick={() => setShowQRModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest transition-all hover:brightness-125"
                style={{ background:N[800], color:'#93b4e8', border:`1px solid ${N[700]}` }}>
                {selectedGym.join_code}
              </button>
            ) : (
              <button onClick={async () => { try { const r = await base44.functions.invoke('generateGymJoinCode',{gym_id:selectedGym.id}); if(r.data?.success) queryClient.invalidateQueries({queryKey:['gyms']}); } catch {} }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:brightness-125"
                style={{ background:'rgba(16,185,129,0.1)', color:'#34d399', border:'1px solid rgba(16,185,129,0.25)' }}>
                <Plus className="w-3.5 h-3.5" />Generate Code
              </button>
            )}
            {selectedGym?.verified && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                style={{ background:'rgba(59,130,246,0.1)', color:'#93c5fd', border:'1px solid rgba(59,130,246,0.25)' }}>
                <Shield className="w-3.5 h-3.5" />Verified
              </div>
            )}
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-6 py-6" style={{ background:N[950] }}>
          <div className="max-w-[1400px] mx-auto">
            {tabContent[activeTab] || tabContent.snapshot}
          </div>
        </main>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <ManageRewardsModal   open={showManageRewards}   onClose={() => setShowManageRewards(false)}   rewards={rewards}   onCreateReward={d=>createRewardM.mutate(d)}    onDeleteReward={id=>deleteRewardM.mutate(id)}                   gym={selectedGym} isLoading={createRewardM.isPending} />
      <ManageClassesModal   open={showManageClasses}   onClose={() => setShowManageClasses(false)}   classes={classes}   onCreateClass={d=>createClassM.mutate(d)}      onUpdateClass={(id,data)=>updateClassM.mutate({id,data})} onDeleteClass={id=>deleteClassM.mutate(id)} gym={selectedGym} isLoading={createClassM.isPending||updateClassM.isPending} />
      <ManageCoachesModal   open={showManageCoaches}   onClose={() => setShowManageCoaches(false)}   coaches={coaches}   onCreateCoach={d=>createCoachM.mutate(d)}      onDeleteCoach={id=>deleteCoachM.mutate(id)}                     gym={selectedGym} isLoading={createCoachM.isPending} />
      <ManageGymPhotosModal open={showManagePhotos}    onClose={() => setShowManagePhotos(false)}    gallery={selectedGym?.gallery||[]} onSave={g=>updateGalleryM.mutate(g)}                                                         isLoading={updateGalleryM.isPending} />
      <ManageMembersModal   open={showManageMembers}   onClose={() => setShowManageMembers(false)}   gym={selectedGym}   onBanMember={id=>banMemberM.mutate(id)}        onUnbanMember={id=>unbanMemberM.mutate(id)} />
      <CreateGymOwnerPostModal open={showCreatePost}   onClose={() => setShowCreatePost(false)}      gym={selectedGym}   onSuccess={() => queryClient.invalidateQueries({queryKey:['posts',selectedGym?.id]})} />
      <CreateEventModal     open={showCreateEvent}     onClose={() => setShowCreateEvent(false)}     onSave={d=>createEventM.mutate(d)}     gym={selectedGym} isLoading={createEventM.isPending} />
      <CreateChallengeModal open={showCreateChallenge} onClose={() => setShowCreateChallenge(false)} gyms={gyms}         onSave={d=>createChallengeM.mutate(d)}         isLoading={createChallengeM.isPending} />
      <QRScanner            open={showQRScanner}       onClose={() => setShowQRScanner(false)} />
      <ManageEquipmentModal open={showManageEquipment} onClose={() => setShowManageEquipment(false)} equipment={selectedGym?.equipment||[]} onSave={e=>updateGymM.mutate({equipment:e})}                                           isLoading={updateGymM.isPending} />
      <ManageAmenitiesModal open={showManageAmenities} onClose={() => setShowManageAmenities(false)} amenities={selectedGym?.amenities||[]} onSave={a=>updateGymM.mutate({amenities:a})}                                           isLoading={updateGymM.isPending} />
      <EditBasicInfoModal   open={showEditBasicInfo}   onClose={() => setShowEditBasicInfo(false)}   gym={selectedGym}   onSave={d=>updateGymM.mutate(d)}               isLoading={updateGymM.isPending} />
      <CreatePollModal      open={showCreatePoll}      onClose={() => setShowCreatePoll(false)}      onSave={d=>createPollM.mutate(d)}                                  isLoading={createPollM.isPending} />

      {/* Delete Gym */}
      <AlertDialog open={showDeleteGym} onOpenChange={setShowDeleteGym}>
        <AlertDialogContent style={{ background:N[900], borderColor:'rgba(239,68,68,0.3)' }} className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400" />Delete Gym Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm" style={{ color:'#6b87b8' }}>
              Deletes <span className="font-bold text-white">{selectedGym?.name}</span> and all check-ins, classes, rewards, and member data. <span className="text-red-400 font-semibold">Cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background:N[700], color:'#93b4e8', borderColor:N[600] }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteGymM.mutate()} disabled={deleteGymM.isPending} className="bg-red-600 hover:bg-red-700 text-white">{deleteGymM.isPending?'Deleting…':'Delete Permanently'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account */}
      <AlertDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <AlertDialogContent style={{ background:N[900], borderColor:'rgba(239,68,68,0.3)' }} className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400" />Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm" style={{ color:'#6b87b8' }}>
              Deletes your account, all gyms, and personal data. <span className="text-red-400 font-semibold">Cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background:N[700], color:'#93b4e8', borderColor:N[600] }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAccountM.mutate()} disabled={deleteAccountM.isPending} className="bg-red-700 hover:bg-red-800 text-white">{deleteAccountM.isPending?'Deleting…':'Delete Account'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(6,13,31,0.88)', backdropFilter:'blur(8px)' }}>
          <div className="rounded-3xl p-8 max-w-sm w-full shadow-2xl" style={{ background:N[900], border:`1px solid ${N[600]}` }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white">Gym Join QR Code</h3>
              <button onClick={() => setShowQRModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:brightness-125"
                style={{ background:N[800], color:'#6b87b8', border:`1px solid ${N[700]}` }}><X className="w-4 h-4" /></button>
            </div>
            <div id="qr-fullscreen" className="flex justify-center p-6 rounded-2xl bg-white mb-5">
              <QRCode value={`${window.location.origin}${createPageUrl('Gyms')}?joinCode=${selectedGym?.join_code}`} size={260} level="H" />
            </div>
            <p className="text-center text-sm mb-5" style={{ color:'#6b87b8' }}>Join code: <span className="font-black text-white tracking-widest">{selectedGym?.join_code}</span></p>
            <div className="space-y-2.5">
              <button onClick={() => dlQR('qr-fullscreen')} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:brightness-110"
                style={{ background:'linear-gradient(135deg,#10b981,#0d9488)' }}>
                <Download className="w-4 h-4" />Download QR Code
              </button>
              <button onClick={() => setShowQRModal(false)} className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-125"
                style={{ background:N[800], color:'#93b4e8', border:`1px solid ${N[700]}` }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
