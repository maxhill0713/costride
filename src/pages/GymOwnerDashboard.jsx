import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Trophy, Calendar, Star, Target, Activity,
  Plus, Image as ImageIcon, Dumbbell, CheckCircle, Download, Pencil,
  X, Crown, Trash2, Clock, Gift, Zap, BarChart2, Shield,
  Eye, Menu, LayoutDashboard, FileText, BarChart3, Settings,
  LogOut, ChevronDown, AlertTriangle, QrCode, MessageSquarePlus,
  DollarSign, UserPlus, Megaphone, Pin
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

// ── Design tokens ─────────────────────────────────────────────────────────────
const N = {
  950: '#060d1f', 900: '#0a1628', 850: '#0d1e35', 800: '#112040',
  750: '#152649', 700: '#1a2f57', 600: '#213a6b', 500: '#2a4a85',
};

const NAV = [
  { id: 'overview',    label: 'Overview',    icon: LayoutDashboard },
  { id: 'members',     label: 'Members',     icon: Users },
  { id: 'content',     label: 'Content',     icon: FileText },
  { id: 'analytics',   label: 'Analytics',   icon: BarChart3 },
  { id: 'gym',         label: 'Gym Settings',icon: Settings },
];

// ── Shared components ─────────────────────────────────────────────────────────

const KpiCard = ({ icon: Icon, iconColor, label, value, sub, trend }) => (
  <div className="relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5"
    style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.06]" style={{ background: iconColor }} />
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}28` }}>
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      {trend !== undefined && (
        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
          style={{ background: trend >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)', color: trend >= 0 ? '#34d399' : '#f87171' }}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="text-3xl font-black text-white tracking-tight mb-1">{value}</div>
    <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>{label}</div>
    {sub && <div className="text-xs" style={{ color: '#64748b' }}>{sub}</div>}
  </div>
);

const Panel = ({ children, className = '' }) => (
  <div className={`rounded-2xl border p-6 ${className}`}
    style={{ background: 'linear-gradient(145deg,rgba(15,23,42,0.85),rgba(2,6,23,0.9))', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
    {children}
  </div>
);

const PH = ({ title, subtitle, action, actionLabel, badge }) => (
  <div className="flex items-center justify-between mb-5">
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{subtitle}</p>}
    </div>
    <div className="flex items-center gap-2">
      {badge !== undefined && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>{badge}</span>}
      {action && (
        <button onClick={action} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:brightness-125"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#93c5fd', border: '1px solid rgba(255,255,255,0.1)' }}>
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
  const m = {
    blue:   ['rgba(59,130,246,0.15)',  '#93c5fd',  'rgba(59,130,246,0.25)'],
    green:  ['rgba(16,185,129,0.15)',  '#6ee7b7',  'rgba(16,185,129,0.25)'],
    orange: ['rgba(249,115,22,0.15)',  '#fdba74',  'rgba(249,115,22,0.25)'],
    red:    ['rgba(239,68,68,0.15)',   '#fca5a5',  'rgba(239,68,68,0.25)'],
    purple: ['rgba(139,92,246,0.15)',  '#c4b5fd',  'rgba(139,92,246,0.25)'],
  };
  const [bg, text, border] = m[color] || m.blue;
  return <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: bg, color: text, border: `1px solid ${border}` }}>{children}</span>;
};


const Empty = ({ icon: Icon, label }) => (
  <div className="py-10 text-center">
    <Icon className="w-10 h-10 mx-auto mb-2" style={{ color: N[600] }} />
    <p className="text-sm" style={{ color: '#3d5a8a' }}>{label}</p>
  </div>
);

// ── Root ──────────────────────────────────────────────────────────────────────
export default function GymOwnerDashboard() {
  const [tab, setTab]             = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const [gymOpen, setGymOpen]     = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  // Modals
  const [modal, setModal] = useState(null); // single modal state string
  const openModal  = (name) => setModal(name);
  const closeModal = ()     => setModal(null);

  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000,
  });
  React.useEffect(() => {
    if (currentUser && !currentUser.onboarding_completed) navigate(createPageUrl('Onboarding'));
  }, [currentUser, navigate]);

  const { data: gyms = [], error: gymsError } = useQuery({
    queryKey: ['ownerGyms', currentUser?.email],
    queryFn:  () => base44.entities.Gym.filter({ owner_email: currentUser.email }),
    enabled: !!currentUser?.email, retry: 3, staleTime: 5 * 60 * 1000,
  });

  const myGyms       = gyms.filter(g => g.owner_email === currentUser?.email);
  const approvedGyms = myGyms.filter(g => g.status === 'approved');
  const pendingGyms  = myGyms.filter(g => g.status === 'pending');

  React.useEffect(() => {
    if (approvedGyms.length > 0 && !selectedGym) setSelectedGym(approvedGyms[0]);
  }, [approvedGyms, selectedGym]);

  React.useEffect(() => {
    const iv = setInterval(() => queryClient.invalidateQueries({ queryKey: ['ownerGyms'] }), 10000);
    return () => clearInterval(iv);
  }, [queryClient]);

  const qo = { staleTime: 3 * 60 * 1000, placeholderData: p => p };
  const on  = !!selectedGym;
  const { data: allMemberships = [] } = useQuery({ queryKey: ['memberships', selectedGym?.id], queryFn: () => base44.entities.GymMembership.filter({ gym_id: selectedGym.id, status: 'active' }), enabled: on && !!currentUser, ...qo });
  const { data: checkIns   = [] }     = useQuery({ queryKey: ['checkIns',   selectedGym?.id], queryFn: () => base44.entities.CheckIn.filter({ gym_id: selectedGym.id }, '-check_in_date', 2000), enabled: on, ...qo });
  const { data: lifts      = [] }     = useQuery({ queryKey: ['lifts',      selectedGym?.id], queryFn: () => base44.entities.Lift.filter({ gym_id: selectedGym.id }, '-lift_date', 200),          enabled: on, ...qo });
  const { data: rewards    = [] }     = useQuery({ queryKey: ['rewards',    selectedGym?.id], queryFn: () => base44.entities.Reward.filter({ gym_id: selectedGym.id }),                           enabled: on, ...qo });
  const { data: classes    = [] }     = useQuery({ queryKey: ['classes',    selectedGym?.id], queryFn: () => base44.entities.GymClass.filter({ gym_id: selectedGym.id }),                         enabled: on, ...qo });
  const { data: coaches    = [] }     = useQuery({ queryKey: ['coaches',    selectedGym?.id], queryFn: () => base44.entities.Coach.filter({ gym_id: selectedGym.id }),                            enabled: on, ...qo });
  const { data: events     = [] }     = useQuery({ queryKey: ['events',     selectedGym?.id], queryFn: () => base44.entities.Event.filter({ gym_id: selectedGym.id }, '-event_date'),              enabled: on, ...qo });
  const { data: posts      = [] }     = useQuery({ queryKey: ['posts',      selectedGym?.id], queryFn: () => base44.entities.Post.filter({ member_id: selectedGym.id }, '-created_date', 20),        enabled: on, ...qo });
  const { data: challenges = [] }     = useQuery({ queryKey: ['challenges', selectedGym?.id], queryFn: () => base44.entities.Challenge.filter({ gym_id: selectedGym.id }, '-created_date'),        enabled: on, ...qo });
  const { data: polls      = [] }     = useQuery({ queryKey: ['polls',      selectedGym?.id], queryFn: () => base44.entities.Poll.filter({ gym_id: selectedGym.id, status: 'active' }, '-created_date'), enabled: on, ...qo });

  const inv = (...keys) => keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k, selectedGym?.id] }));
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

  // ── Splash screens ────────────────────────────────────────────────────────
  const Splash = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: N[950] }}>
      <Panel className="max-w-md w-full text-center">{children}</Panel>
    </div>
  );
  if (gymsError)
    return <Splash><div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-5"><X className="w-7 h-7 text-red-400"/></div><h2 className="text-xl font-black text-white mb-2">Error</h2><p className="text-sm mb-6" style={{color:'#6b87b8'}}>{gymsError.message}</p><Button onClick={()=>window.location.reload()} className="bg-blue-600 hover:bg-blue-500 text-white">Retry</Button></Splash>;
  if (approvedGyms.length===0 && pendingGyms.length>0)
    return <Splash><div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center mx-auto mb-5"><Clock className="w-7 h-7 text-yellow-400"/></div><h2 className="text-xl font-black text-white mb-2">Pending Approval</h2><p className="text-sm mb-6" style={{color:'#6b87b8'}}>Your gym <span className="text-yellow-400 font-bold">{pendingGyms[0].name}</span> is under review.</p><Link to={createPageUrl('Home')}><Button style={{background:N[700],color:'#93b4e8'}}>Back to Home</Button></Link></Splash>;
  if (myGyms.length===0)
    return <Splash><div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mx-auto mb-5"><Dumbbell className="w-7 h-7 text-blue-400"/></div><h2 className="text-xl font-black text-white mb-2">No Gyms</h2><p className="text-sm mb-6" style={{color:'#6b87b8'}}>Register your gym to get started.</p><Link to={createPageUrl('GymSignup')}><Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">Register Your Gym</Button></Link></Splash>;

  // ── Computed stats (single source of truth) ───────────────────────────────
  const now              = new Date();
  const ci7              = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,7),  end: now }));
  const ci30             = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,30), end: now }));
  const ciPrev30         = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,60), end: subDays(now,30) }));
  const todayCI          = checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(now).getTime()).length;
  const totalMembers     = allMemberships.length;
  const activeThisWeek   = new Set(ci7.map(c => c.user_id)).size;
  const activeLastWeek   = new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,14), end: subDays(now,7) })).map(c => c.user_id)).size;
  const weeklyChangePct  = activeLastWeek > 0 ? Math.round(((activeThisWeek - activeLastWeek) / activeLastWeek) * 100) : 0;
  const activeThisMonth  = new Set(ci30.map(c => c.user_id)).size;
  const retentionRate    = totalMembers > 0 ? Math.round((activeThisMonth / totalMembers) * 100) : 0;
  const monthCiPer       = (() => { const acc={}; ci30.forEach(c=>{acc[c.user_id]=(acc[c.user_id]||0)+1;}); return Object.values(acc); })();
  // At-risk: members with no check-in in 14+ days (or never checked in)
  const memberLastCheckIn = {};
  checkIns.forEach(c => { if (!memberLastCheckIn[c.user_id] || new Date(c.check_in_date) > new Date(memberLastCheckIn[c.user_id])) memberLastCheckIn[c.user_id] = c.check_in_date; });
  const atRisk           = allMemberships.filter(m => { const last = memberLastCheckIn[m.user_id]; if (!last) return true; const d = Math.floor((now - new Date(last)) / 86400000); return d >= 14; }).length;
  const monthChangePct   = ciPrev30.length > 0 ? Math.round(((ci30.length-ciPrev30.length)/ciPrev30.length)*100) : 0;

  // New sign-ups this month (memberships created in last 30 days)
  const newSignUps = allMemberships.filter(m => isWithinInterval(new Date(m.join_date || m.created_date || now), { start: subDays(now,30), end: now })).length;
  const newSignUpsPrev = allMemberships.filter(m => isWithinInterval(new Date(m.join_date || m.created_date || now), { start: subDays(now,60), end: subDays(now,30) })).length;
  const newSignUpsPct = newSignUpsPrev > 0 ? Math.round(((newSignUps - newSignUpsPrev) / newSignUpsPrev) * 100) : 0;

  // Estimated monthly revenue from memberships
  const membershipPrice = parseFloat(selectedGym?.price) || 0;
  const estimatedRevenue = membershipPrice > 0 ? (allMemberships.length * membershipPrice).toFixed(0) : null;
  const revenueDisplay = estimatedRevenue ? `£${Number(estimatedRevenue).toLocaleString()}` : '—';

  // Load announcements from gym entity
  const savedAnnouncements = selectedGym?.announcements || [];

  const saveAnnouncement = async () => {
    if (!announcement.trim() || announcementSaving) return;
    setAnnouncementSaving(true);
    const updated = [{ text: announcement.trim(), date: new Date().toISOString() }, ...savedAnnouncements].slice(0, 10);
    await base44.entities.Gym.update(selectedGym.id, { announcements: updated });
    invGyms();
    setAnnouncement('');
    setAnnouncementSaving(false);
  };

  const deleteAnnouncement = async (idx) => {
    const updated = savedAnnouncements.filter((_, i) => i !== idx);
    await base44.entities.Gym.update(selectedGym.id, { announcements: updated });
    invGyms();
  };

  // Chart data
  const ciByDay   = Array.from({length:7},(_,i)=>{const d=subDays(now,6-i);return{day:format(d,'EEE'),value:checkIns.filter(c=>startOfDay(new Date(c.check_in_date)).getTime()===startOfDay(d).getTime()).length};});
  const weekTrend = Array.from({length:12},(_,i)=>{const s=subDays(now,(11-i)*7),e=subDays(now,(10-i)*7);return{label:format(s,'MMM d'),value:checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).length};});
  const monthGrowth = Array.from({length:6},(_,i)=>{const e=subDays(now,i*30),s=subDays(e,30);return{label:format(e,'MMM'),value:new Set(checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).map(c=>c.user_id)).size};}).reverse();

  const dlQR = (id) => {
    const svg = document.getElementById(id)?.querySelector('svg'); if(!svg) return;
    const d = new XMLSerializer().serializeToString(svg);
    const canvas=document.createElement('canvas'); const ctx=canvas.getContext('2d'); const img=new Image();
    img.onload=()=>{canvas.width=img.width;canvas.height=img.height;ctx.drawImage(img,0,0);const a=document.createElement('a');a.download=`${selectedGym?.name}-QR.png`;a.href=canvas.toDataURL('image/png');a.click();};
    img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(d)));
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: OVERVIEW — today's pulse at a glance + quick actions
  // ══════════════════════════════════════════════════════════════════════════
  const TabOverview = () => (
    <div className="space-y-5">

      {/* 6 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard icon={Dumbbell}     iconColor="#60a5fa" label="Today's Check-ins" value={todayCI}           sub="members in today" />
        <KpiCard icon={Users}        iconColor="#34d399" label="Active This Week"  value={activeThisWeek}    sub={`of ${totalMembers} members`} trend={weeklyChangePct} />
        <KpiCard icon={Activity}     iconColor="#a78bfa" label="Monthly Check-ins" value={ci30.length}       sub={`${monthChangePct>=0?'+':''}${monthChangePct}% vs last month`} trend={monthChangePct} />
        <KpiCard icon={UserPlus}     iconColor="#34d399" label="New Sign-ups"      value={newSignUps}        sub="joined last 30 days" trend={newSignUpsPct} />
        <KpiCard icon={DollarSign}   iconColor="#4ade80" label="Est. Monthly Revenue" value={revenueDisplay} sub={membershipPrice>0?`${allMemberships.length} members × £${membershipPrice}`:'Set price in Gym Settings'} />
        <KpiCard icon={Star}         iconColor="#fbbf24" label="Avg Rating"        value={selectedGym?.rating?.toFixed(1)?? '—'} sub="member rating" />
      </div>

      {/* Chart + Alerts side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel className="xl:col-span-2">
          <PH title="Check-ins — Last 7 Days" subtitle="Daily attendance" />
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={ciByDay} barSize={34}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false}/>
              <XAxis dataKey="day" tick={{fill:'#6b87b8',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#6b87b8',fontSize:11}} axisLine={false} tickLine={false} width={24}/>
              <Tooltip content={<DT/>} cursor={{fill:'rgba(59,130,246,0.06)'}}/>
              <Bar dataKey="value" fill="#3b82f6" radius={[5,5,0,0]} name="Check-ins"/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PH title="Alerts & Actions" />
          <div className="space-y-3">
            {atRisk > 0 ? (
              <div className="p-3.5 rounded-xl" style={{background:'rgba(249,115,22,0.08)',border:'1px solid rgba(249,115,22,0.2)'}}>
                <div className="flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-sm font-bold text-white">{atRisk} members at risk</p>
                    <p className="text-xs mt-0.5" style={{color:'#6b87b8'}}>No check-in for 7–10 days</p>
                    <button onClick={()=>setTab('members')} className="mt-2 text-xs font-bold text-orange-400 hover:text-orange-300">View in Members →</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl flex items-center gap-3" style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)'}}>
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0"/>
                <p className="text-sm font-semibold text-white">No at-risk members</p>
              </div>
            )}
            {!challenges.some(c=>c.status==='active') && (
              <div className="p-3.5 rounded-xl" style={{background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)'}}>
                <div className="flex gap-3">
                  <Trophy className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-sm font-bold text-white">No active challenges</p>
                    <p className="text-xs mt-0.5" style={{color:'#6b87b8'}}>Challenges boost retention</p>
                    <button onClick={()=>openModal('challenge')} className="mt-2 text-xs font-bold text-blue-400 hover:text-blue-300">Create one →</button>
                  </div>
                </div>
              </div>
            )}
            {polls.length===0 && (
              <div className="p-3.5 rounded-xl" style={{background:'rgba(139,92,246,0.08)',border:'1px solid rgba(139,92,246,0.2)'}}>
                <div className="flex gap-3">
                  <BarChart2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-sm font-bold text-white">No active polls</p>
                    <p className="text-xs mt-0.5" style={{color:'#6b87b8'}}>Engage members with a poll</p>
                    <button onClick={()=>openModal('poll')} className="mt-2 text-xs font-bold text-purple-400 hover:text-purple-300">Create one →</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Quick-post strip — most-used action front and centre */}
      <Panel>
        <PH title="Quick Actions" subtitle="Most common tasks in one tap" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'New Post',      sub: 'Share with members',     icon: MessageSquarePlus, color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  action: ()=>openModal('post') },
            { label: 'New Event',     sub: `${events.filter(e=>new Date(e.event_date)>=now).length} upcoming`, icon: Calendar, color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', action: ()=>openModal('event') },
            { label: 'New Challenge', sub: `${challenges.filter(c=>c.status==='active').length} active`, icon: Trophy, color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', action: ()=>openModal('challenge') },
            { label: 'New Poll',      sub: `${polls.length} active`,  icon: BarChart2,         color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', action: ()=>openModal('poll') },
          ].map((b,i)=>(
            <button key={i} onClick={b.action}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 p-4 rounded-xl text-center sm:text-left transition-all hover:brightness-125 hover:-translate-y-0.5 active:scale-95"
              style={{background:b.bg,border:`1px solid ${b.border}`}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${b.color}22`,border:`1px solid ${b.color}33`}}>
                <b.icon className="w-5 h-5" style={{color:b.color}}/>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-tight">{b.label}</p>
                <p className="text-xs mt-0.5 hidden sm:block" style={{color:'#6b87b8'}}>{b.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </Panel>

      {/* Recent activity */}
      <Panel>
        <PH title="Recent Activity" subtitle="Latest check-ins" />
        <div className="divide-y" style={{borderColor:'rgba(59,130,246,0.07)'}}>
          {ci7.slice(0,10).map((c,i)=>(
            <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                {c.user_name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{c.user_name}</p>
                <p className="text-xs" style={{color:'#3d5a8a'}}>checked in</p>
              </div>
              <p className="text-xs flex-shrink-0" style={{color:'#3d5a8a'}}>{format(new Date(c.check_in_date),'MMM d, h:mma')}</p>
            </div>
          ))}
          {ci7.length===0 && <Empty icon={Activity} label="No check-ins in the last 7 days"/>}
        </div>
      </Panel>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: MEMBERS — everything member-related in one place
  // ══════════════════════════════════════════════════════════════════════════
  const TabMembers = () => (
    <div className="space-y-5">

      {/* 4 member-focused KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Users}    iconColor="#60a5fa" label="Total Members"    value={totalMembers}    sub="active memberships" />
        <KpiCard icon={Zap}      iconColor="#34d399" label="Active This Week" value={activeThisWeek}   trend={weeklyChangePct} sub="visited gym" />
        <KpiCard icon={Activity} iconColor="#a78bfa" label="Retention Rate"   value={`${retentionRate}%`} sub="active last 30d" />
        <KpiCard icon={Trophy}   iconColor="#fbbf24" label="PRs Logged"       value={lifts.filter(l=>l.is_pr).length} sub="personal records" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Engagement tiers */}
        <Panel>
          <PH title="Engagement Tiers" subtitle="Based on last 30 days" />
          <div className="grid grid-cols-2 gap-3">
            {[
              {label:'Super Active', sub:'15+ visits/mo', val:monthCiPer.filter(v=>v>=15).length,          c:'#34d399', bg:'rgba(16,185,129,0.08)',  b:'rgba(16,185,129,0.2)',  e:'🔥'},
              {label:'Active',       sub:'8–14 visits/mo',val:monthCiPer.filter(v=>v>=8&&v<15).length,     c:'#60a5fa', bg:'rgba(59,130,246,0.08)',   b:'rgba(59,130,246,0.2)',  e:'💪'},
              {label:'Casual',       sub:'1–7 visits/mo', val:monthCiPer.filter(v=>v>=1&&v<8).length,      c:'#fbbf24', bg:'rgba(251,191,36,0.08)',   b:'rgba(251,191,36,0.2)',  e:'🚶'},
              {label:'At Risk',      sub:'7–10d inactive', val:atRisk,                                      c:'#f87171', bg:'rgba(248,113,113,0.08)', b:'rgba(248,113,113,0.2)', e:'⚠️'},
            ].map((t,i)=>(
              <div key={i} className="p-4 rounded-xl" style={{background:t.bg,border:`1px solid ${t.b}`}}>
                <p className="text-xl mb-2">{t.e}</p>
                <p className="text-3xl font-black mb-0.5" style={{color:t.c}}>{t.val}</p>
                <p className="text-sm font-bold text-white">{t.label}</p>
                <p className="text-xs mt-0.5" style={{color:'#6b87b8'}}>{t.sub}</p>
              </div>
            ))}
          </div>
        </Panel>

        {/* Leaderboard */}
        <Panel>
          <PH title="Weekly Leaderboard" subtitle="Most check-ins this week" action={()=>openModal('members')} actionLabel="All Members" />
          <div className="space-y-2">
            {Object.entries(ci7.reduce((acc,c)=>{acc[c.user_name]=(acc[c.user_name]||0)+1;return acc;},{}))
              .sort(([,a],[,b])=>b-a).slice(0,8)
              .map(([name,count],idx)=>(
                <div key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{background:idx<3?'rgba(59,130,246,0.07)':N[750],border:`1px solid ${idx<3?'rgba(59,130,246,0.18)':'rgba(59,130,246,0.08)'}`}}>
                  <span className="text-base w-6 text-center flex-shrink-0">{['🥇','🥈','🥉'][idx]||<span className="text-xs" style={{color:'#3d5a8a'}}>{idx+1}</span>}</span>
                  <span className="flex-1 text-sm font-semibold text-white truncate">{name}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{background:N[700],color:'#93b4e8'}}>{count} visits</span>
                </div>
              ))}
            {ci7.length===0 && <Empty icon={Users} label="No check-ins this week yet"/>}
          </div>
        </Panel>
      </div>

      {/* Busiest days + Rewards side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Busiest Days of the Week" subtitle="All-time check-in distribution" />
          <div className="space-y-2.5">
            {(()=>{
              const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
              const acc={}; checkIns.forEach(c=>{const d=new Date(c.check_in_date).getDay();acc[d]=(acc[d]||0)+1;});
              const max=Math.max(...Object.values(acc),1);
              return days.map((name,idx)=>({name,count:acc[idx]||0})).sort((a,b)=>b.count-a.count).map(({name,count},rank)=>(
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-5 text-right flex-shrink-0" style={{color:'#3d5a8a'}}>#{rank+1}</span>
                  <span className="text-sm text-white w-24 flex-shrink-0">{name}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:N[700]}}>
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{width:`${(count/max)*100}%`}}/>
                  </div>
                  <span className="text-sm font-bold text-white w-7 text-right">{count}</span>
                </div>
              ));
            })()}
          </div>
        </Panel>

        <Panel>
          <PH title="Rewards Program" badge={rewards.length} action={()=>openModal('rewards')} actionLabel="Manage" />
          {rewards.length > 0 ? (
            <div className="space-y-2.5">
              {rewards.slice(0,6).map(reward=>(
                <div key={reward.id} className="flex items-center gap-3 p-3.5 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <span className="text-2xl flex-shrink-0">{reward.icon||'🎁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{reward.title}</p>
                    <p className="text-xs" style={{color:'#6b87b8'}}>{reward.claimed_by?.length||0} claimed · {reward.value}</p>
                  </div>
                  <Tag color={reward.active?'green':'blue'}>{reward.active?'Active':'Off'}</Tag>
                </div>
              ))}
            </div>
          ) : <Empty icon={Gift} label="No rewards yet — create some to boost retention"/>}
        </Panel>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: CONTENT — posts, events, challenges, polls in one place
  // ══════════════════════════════════════════════════════════════════════════
  const TabContent = () => (
    <div className="space-y-5">

      {/* Create strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:'Post',      icon:MessageSquarePlus, c:'#60a5fa', bg:'rgba(59,130,246,0.12)', b:'rgba(59,130,246,0.25)', action:()=>openModal('post')},
          {label:'Event',     icon:Calendar,          c:'#34d399', bg:'rgba(16,185,129,0.12)', b:'rgba(16,185,129,0.25)', action:()=>openModal('event')},
          {label:'Challenge', icon:Trophy,            c:'#fb923c', bg:'rgba(249,115,22,0.12)',  b:'rgba(249,115,22,0.25)', action:()=>openModal('challenge')},
          {label:'Poll',      icon:BarChart2,         c:'#a78bfa', bg:'rgba(139,92,246,0.12)', b:'rgba(139,92,246,0.25)', action:()=>openModal('poll')},
        ].map((b,i)=>(
          <button key={i} onClick={b.action}
            className="flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-sm text-white transition-all hover:brightness-125 active:scale-95"
            style={{background:b.bg,border:`1px solid ${b.b}`}}>
            <b.icon className="w-5 h-5" style={{color:b.c}}/>
            New {b.label}
          </button>
        ))}
      </div>

      {/* Recent posts + Upcoming events */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Recent Posts" badge={posts.length} action={()=>openModal('post')} actionLabel="New Post"/>
          {posts.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {posts.slice(0,10).map(post=>(
                <div key={post.id} className="p-3.5 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                      {post.member_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-white flex-1">{post.member_name}</p>
                    <p className="text-xs" style={{color:'#3d5a8a'}}>{format(new Date(post.created_date),'MMM d')}</p>
                  </div>
                  <p className="text-xs line-clamp-2 mb-2" style={{color:'#6b87b8'}}>{post.content}</p>
                  <div className="flex gap-4 text-xs" style={{color:'#3d5a8a'}}>
                    <span>❤️ {post.likes||0}</span><span>💬 {post.comments?.length||0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty icon={FileText} label="No posts yet — share an update with your members"/>}
        </Panel>

        <Panel>
          <PH title="Upcoming Events" badge={events.filter(e=>new Date(e.event_date)>=now).length} action={()=>openModal('event')} actionLabel="New Event"/>
          {events.filter(e=>new Date(e.event_date)>=now).length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {events.filter(e=>new Date(e.event_date)>=now).map(ev=>(
                <div key={ev.id} className="p-4 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  {ev.image_url && <img src={ev.image_url} alt={ev.title} className="w-full h-24 object-cover rounded-lg mb-3"/>}
                  <p className="text-sm font-bold text-white mb-1 truncate">{ev.title}</p>
                  <p className="text-xs line-clamp-2 mb-2" style={{color:'#6b87b8'}}>{ev.description}</p>
                  <div className="flex gap-3 text-xs" style={{color:'#3d5a8a'}}>
                    <span>📅 {format(new Date(ev.event_date),'MMM d, h:mma')}</span>
                    <span>👥 {ev.attendees||0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty icon={Calendar} label="No upcoming events"/>}
        </Panel>
      </div>

      {/* Active challenges + Polls */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Challenges" badge={challenges.filter(c=>c.status==='active').length} action={()=>openModal('challenge')} actionLabel="New"/>
          {challenges.filter(c=>c.status==='active').length > 0 ? (
            <div className="space-y-3">
              {challenges.filter(c=>c.status==='active').map(ch=>(
                <div key={ch.id} className="p-4 rounded-xl" style={{background:'rgba(249,115,22,0.07)',border:'1px solid rgba(249,115,22,0.18)'}}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-white">🏆 {ch.title}</p>
                    <Tag color="orange">{ch.type?.replace('_',' ')}</Tag>
                  </div>
                  <p className="text-xs mb-2 line-clamp-1" style={{color:'#6b87b8'}}>{ch.description}</p>
                  <div className="flex gap-4 text-xs" style={{color:'#3d5a8a'}}>
                    <span>👥 {ch.participants?.length||0} joined</span>
                    <span>📅 {format(new Date(ch.start_date),'MMM d')} – {format(new Date(ch.end_date),'MMM d')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty icon={Trophy} label="No active challenges"/>}
        </Panel>

        <Panel>
          <PH title="Active Polls" badge={polls.length} action={()=>openModal('poll')} actionLabel="New Poll"/>
          {polls.length > 0 ? (
            <div className="space-y-3">
              {polls.map(poll=>(
                <div key={poll.id} className="p-4 rounded-xl" style={{background:'rgba(139,92,246,0.07)',border:'1px solid rgba(139,92,246,0.18)'}}>
                  <p className="text-sm font-bold text-white mb-1 truncate">{poll.title}</p>
                  <p className="text-xs mb-2 line-clamp-1" style={{color:'#6b87b8'}}>{poll.description}</p>
                  <div className="flex items-center gap-3 text-xs" style={{color:'#3d5a8a'}}>
                    <span>📊 {poll.voters?.length||0} votes</span>
                    <Tag color="purple">{poll.status}</Tag>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty icon={BarChart2} label="No active polls"/>}
        </Panel>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: ANALYTICS — charts and numbers only, no duplicate KPIs
  // ══════════════════════════════════════════════════════════════════════════
  const TabAnalytics = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Weekly Check-in Trend" subtitle="Last 12 weeks"/>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={weekTrend}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false}/>
              <XAxis dataKey="label" tick={{fill:'#6b87b8',fontSize:10}} axisLine={false} tickLine={false} interval={2}/>
              <YAxis tick={{fill:'#6b87b8',fontSize:10}} axisLine={false} tickLine={false} width={24}/>
              <Tooltip content={<DT/>}/>
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#g1)" name="Check-ins"/>
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PH title="Active Members Growth" subtitle="Last 6 months"/>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={monthGrowth}>
              <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false}/>
              <XAxis dataKey="label" tick={{fill:'#6b87b8',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#6b87b8',fontSize:11}} axisLine={false} tickLine={false} width={24}/>
              <Tooltip content={<DT/>}/>
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#g2)" name="Members"/>
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PH title="Rewards Redeemed" subtitle="Top 5 most claimed"/>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart barSize={28} data={rewards.filter(r=>(r.claimed_by?.length||0)>0).sort((a,b)=>(b.claimed_by?.length||0)-(a.claimed_by?.length||0)).slice(0,5).map(r=>({label:r.title.length>14?r.title.slice(0,14)+'…':r.title,value:r.claimed_by?.length||0}))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false}/>
              <XAxis dataKey="label" tick={{fill:'#6b87b8',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#6b87b8',fontSize:10}} axisLine={false} tickLine={false} width={24}/>
              <Tooltip content={<DT/>} cursor={{fill:'rgba(139,92,246,0.06)'}}/>
              <Bar dataKey="value" fill="#8b5cf6" radius={[5,5,0,0]} name="Claims"/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PH title="Peak Hours" subtitle="Most popular visit times"/>
          <div className="space-y-2.5">
            {(()=>{
              const acc={}; checkIns.forEach(c=>{const h=new Date(c.check_in_date).getHours();acc[h]=(acc[h]||0)+1;});
              const max=Math.max(...Object.values(acc),1);
              return Object.entries(acc).sort(([,a],[,b])=>b-a).slice(0,8).map(([hour,count],i)=>{
                const h=parseInt(hour); const label=h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`;
                return(
                  <div key={hour} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-4 text-right flex-shrink-0" style={{color:'#3d5a8a'}}>#{i+1}</span>
                    <span className="text-sm text-white w-12 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:N[700]}}>
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{width:`${(count/max)*100}%`}}/>
                    </div>
                    <span className="text-sm font-bold text-white w-7 text-right">{count}</span>
                  </div>
                );
              });
            })()}
          </div>
        </Panel>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Daily Average',   val:Math.round(ci30.length/30),  sub:'check-ins / day (30d)',  c:'#60a5fa'},
          {label:'Monthly Change',  val:`${monthChangePct>=0?'+':''}${monthChangePct}%`, sub:'vs previous 30 days', c:monthChangePct>=0?'#34d399':'#f87171'},
          {label:'Avg Visits/Member',val:totalMembers>0?(ci30.length/totalMembers).toFixed(1):'—', sub:'per member (30d)', c:'#a78bfa'},
          {label:'Return Rate',     val:`${checkIns.length>0?Math.round((checkIns.filter(c=>!c.first_visit).length/checkIns.length)*100):0}%`, sub:'of all check-ins', c:'#fbbf24'},
        ].map((s,i)=>(
          <div key={i} className="p-5 rounded-xl text-center" style={{background:`linear-gradient(135deg,${N[800]},${N[850]})`,border:'1px solid rgba(59,130,246,0.12)'}}>
            <p className="text-3xl font-black mb-1" style={{color:s.c}}>{s.val}</p>
            <p className="text-xs font-bold text-white">{s.label}</p>
            <p className="text-xs mt-0.5" style={{color:'#3d5a8a'}}>{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: GYM SETTINGS — all configuration in one place
  // ══════════════════════════════════════════════════════════════════════════
  const TabGym = () => (
    <div className="space-y-5">
      {/* Basic info */}
      <Panel>
        <PH title="Gym Information" subtitle={selectedGym?.name} action={()=>openModal('editInfo')} actionLabel="Edit"/>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            {l:'Gym Name',  v:selectedGym?.name},
            {l:'Type',      v:selectedGym?.type},
            {l:'City',      v:selectedGym?.city},
            {l:'Price',     v:`£${selectedGym?.price}/mo`},
            {l:'Address',   v:selectedGym?.address},
            {l:'Postcode',  v:selectedGym?.postcode},
          ].map((f,i)=>(
            <div key={i} className="p-3 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <p className="text-xs uppercase tracking-wide mb-1" style={{color:'#3d5a8a'}}>{f.l}</p>
              <p className="text-sm font-semibold text-white truncate">{f.v||'—'}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Staff & facilities — classes, coaches, equipment, amenities */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Classes" badge={classes.length} action={()=>openModal('classes')} actionLabel="Manage"/>
          {classes.length > 0 ? (
            <div className="space-y-2">
              {classes.slice(0,6).map(cls=>(
                <div key={cls.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(52,211,153,0.12)',border:'1px solid rgba(52,211,153,0.22)'}}>
                    <Calendar className="w-4 h-4 text-emerald-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{cls.name}</p>
                    <p className="text-xs" style={{color:'#3d5a8a'}}>{cls.schedule||cls.time||'—'}</p>
                  </div>
                </div>
              ))}
              {classes.length > 6 && <p className="text-xs text-center pt-1" style={{color:'#3d5a8a'}}>+{classes.length-6} more</p>}
            </div>
          ) : <Empty icon={Calendar} label="No classes yet"/>}
        </Panel>

        <Panel>
          <PH title="Coaches" badge={coaches.length} action={()=>openModal('coaches')} actionLabel="Manage"/>
          {coaches.length > 0 ? (
            <div className="space-y-2">
              {coaches.slice(0,6).map(coach=>(
                <div key={coach.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {coach.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{coach.name}</p>
                    <p className="text-xs truncate" style={{color:'#3d5a8a'}}>{coach.speciality||coach.bio||'Coach'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty icon={Target} label="No coaches added yet"/>}
        </Panel>

        <Panel>
          <PH title="Amenities" badge={selectedGym?.amenities?.length||0} action={()=>openModal('amenities')} actionLabel="Edit"/>
          <div className="flex flex-wrap gap-1.5">
            {selectedGym?.amenities?.map((a,i)=><Tag key={i} color="blue">{a}</Tag>)}
            {!selectedGym?.amenities?.length && <p className="text-sm" style={{color:'#3d5a8a'}}>No amenities listed</p>}
          </div>
        </Panel>

        <Panel>
          <PH title="Equipment" badge={selectedGym?.equipment?.length||0} action={()=>openModal('equipment')} actionLabel="Edit"/>
          <div className="flex flex-wrap gap-1.5">
            {selectedGym?.equipment?.slice(0,18).map((e,i)=><Tag key={i} color="purple">{e}</Tag>)}
            {selectedGym?.equipment?.length>18 && <Tag color="blue">+{selectedGym.equipment.length-18} more</Tag>}
            {!selectedGym?.equipment?.length && <p className="text-sm" style={{color:'#3d5a8a'}}>No equipment listed</p>}
          </div>
        </Panel>
      </div>

      {/* Photo gallery */}
      <Panel>
        <PH title="Photo Gallery" badge={selectedGym?.gallery?.length||0} action={()=>openModal('photos')} actionLabel="Manage Photos"/>
        {selectedGym?.gallery?.length > 0 ? (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {selectedGym.gallery.map((url,i)=>(
              <img key={i} src={url} alt="" className="w-full h-16 object-cover rounded-lg" style={{border:`1px solid ${N[700]}`}}/>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <ImageIcon className="w-6 h-6 flex-shrink-0" style={{color:'#3d5a8a'}}/>
            <p className="text-sm" style={{color:'#6b87b8'}}>No photos yet. Add photos to attract more members.</p>
            <button onClick={()=>openModal('photos')} className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{background:'rgba(59,130,246,0.15)',color:'#93c5fd',border:'1px solid rgba(59,130,246,0.3)'}}>
              Add Photos
            </button>
          </div>
        )}
      </Panel>

      {/* Admin info + links */}
      <Panel>
        <PH title="Admin"/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {[
            {l:'Owner Email', v:selectedGym?.owner_email},
            {l:'Gym ID',      v:selectedGym?.id, mono:true},
            {l:'Status',      v:selectedGym?.verified?'✓ Verified':'Not Verified', c:selectedGym?.verified?'#34d399':'#f87171'},
          ].map((f,i)=>(
            <div key={i} className="p-3.5 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <p className="text-xs uppercase tracking-wide mb-1.5" style={{color:'#3d5a8a'}}>{f.l}</p>
              <p className={`text-sm font-semibold ${f.mono?'font-mono text-xs break-all':''}`} style={{color:f.c||'white'}}>{f.v||'—'}</p>
            </div>
          ))}
        </div>
        <Link to={createPageUrl('GymCommunity')+'?id='+selectedGym?.id}>
          <button className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-125"
            style={{background:N[700],color:'#93b4e8',border:`1px solid ${N[600]}`}}>
            View Public Gym Page →
          </button>
        </Link>
      </Panel>

      {/* Danger zone */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[
          {title:'Delete Gym',    desc:'Permanently delete this gym and all its data.',       label:'Delete Gym',    fn:()=>openModal('deleteGym')},
          {title:'Delete Account',desc:'Permanently delete your account and all gyms.',        label:'Delete Account',fn:()=>openModal('deleteAccount')},
        ].map((d,i)=>(
          <div key={i} className="p-5 rounded-2xl" style={{background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.18)'}}>
            <div className="flex items-center gap-2 mb-2"><Trash2 className="w-4 h-4 text-red-400"/><h4 className="font-bold text-white text-sm">{d.title}</h4></div>
            <p className="text-xs mb-4" style={{color:'#6b87b8'}}>{d.desc}</p>
            <button onClick={d.fn} className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{background:'rgba(239,68,68,0.12)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.3)'}}>
              {d.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const TABS = { overview: <TabOverview/>, members: <TabMembers/>, content: <TabContent/>, analytics: <TabAnalytics/>, gym: <TabGym/> };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{background:'linear-gradient(to bottom right,#1e3058,#0f1f45,#0a1628)',fontFamily:"'DM Sans','Inter',sans-serif"}}>

      {/* Mobile bottom nav — iOS safe area aware */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{background:'rgba(2,6,23,0.97)',borderColor:'rgba(255,255,255,0.08)',paddingBottom:'env(safe-area-inset-bottom)'}}>
        <div className="flex items-center justify-around" style={{height:'64px'}}>
          {NAV.map(item=>{
            const active=tab===item.id;
            return(
              <button key={item.id} onClick={()=>setTab(item.id)}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-all active:scale-90"
                style={{color:active?'#60a5fa':'#4a6492'}}>
                {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-400"/>}
                <item.icon className="w-6 h-6 flex-shrink-0" strokeWidth={active?2.5:2}/>
                <span className="text-[10px] font-bold leading-none">{item.label==='Gym Settings'?'Settings':item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-full flex-shrink-0 transition-all duration-300 overflow-hidden"
        style={{width:collapsed?64:224,background:'rgba(2,6,23,0.97)',borderRight:'1px solid rgba(255,255,255,0.07)'}}>

        {/* Brand */}
        <div className="px-4 py-5 border-b flex-shrink-0" style={{borderColor:'rgba(59,130,246,0.1)'}}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Dumbbell className="w-4 h-4 text-white"/>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-white truncate leading-tight">{selectedGym?.name||'Dashboard'}</p>
                <p className="text-xs" style={{color:'#3d5a8a'}}>Gym Owner</p>
              </div>
            )}
          </div>

          {/* Gym switcher */}
          {!collapsed && approvedGyms.length > 1 && (
            <div className="mt-3 relative">
              <button onClick={()=>setGymOpen(o=>!o)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold"
                style={{background:'rgba(255,255,255,0.05)',color:'#93b4e8',border:'1px solid rgba(255,255,255,0.1)'}}>
                <span className="truncate">{selectedGym?.name}</span>
                <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${gymOpen?'rotate-180':''}`}/>
              </button>
              {gymOpen && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl z-20" style={{background:'rgba(15,23,42,0.98)',border:'1px solid rgba(255,255,255,0.1)'}}>
                  {approvedGyms.map(g=>(
                    <button key={g.id} onClick={()=>{setSelectedGym(g);setGymOpen(false);}}
                      className="w-full text-left px-3 py-2.5 text-xs font-semibold transition-all hover:brightness-125"
                      style={{color:selectedGym?.id===g.id?'#60a5fa':'#93b4e8',background:selectedGym?.id===g.id?'rgba(59,130,246,0.1)':'transparent'}}>
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item=>{
            const active=tab===item.id;
            return(
              <button key={item.id} onClick={()=>setTab(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{background:active?'rgba(59,130,246,0.12)':'transparent',color:active?'#fff':'#6b87b8',border:active?'1px solid rgba(59,130,246,0.22)':'1px solid transparent'}}>
                <item.icon className="w-4 h-4 flex-shrink-0" style={{color:active?'#60a5fa':'inherit'}}/>
                {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!collapsed && active && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"/>}
              </button>
            );
          })}
        </nav>

        {/* Pro badge */}
        {!collapsed && (
          <div className="px-2.5 pb-2.5 flex-shrink-0">
            <Link to={createPageUrl('Plus')}>
              <div className="p-3 rounded-xl cursor-pointer transition-all hover:brightness-110"
                style={{background:'linear-gradient(135deg,rgba(139,92,246,0.18),rgba(236,72,153,0.12))',border:'1px solid rgba(139,92,246,0.28)'}}>
                <div className="flex items-center gap-2 mb-0.5"><Crown className="w-3.5 h-3.5 text-purple-400"/><span className="text-xs font-black text-white">Retention Pro</span></div>
                <p className="text-xs" style={{color:'#9b7de0'}}>From £49.99/mo</p>
              </div>
            </Link>
          </div>
        )}

        {/* Footer links */}
        <div className="px-2.5 pb-4 pt-2 border-t space-y-0.5 flex-shrink-0" style={{borderColor:'rgba(59,130,246,0.1)'}}>
          <Link to={createPageUrl('GymCommunity')+'?id='+selectedGym?.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:text-white"
            style={{color:'#6b87b8'}}>
            <Eye className="w-4 h-4 flex-shrink-0"/>
            {!collapsed && 'View Gym Page'}
          </Link>
          <Link to={createPageUrl('Home')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:text-white"
            style={{color:'#6b87b8'}}>
            <Users className="w-4 h-4 flex-shrink-0"/>
            {!collapsed && 'Member View'}
          </Link>
          <button onClick={()=>base44.auth.logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold"
            style={{color:'#f87171'}}>
            <LogOut className="w-4 h-4 flex-shrink-0"/>
            {!collapsed && 'Log Out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-3.5 flex-shrink-0 border-b"
          style={{background:'rgba(2,6,23,0.97)',borderColor:'rgba(255,255,255,0.07)'}}>
          <div className="flex items-center gap-3">
            {/* Sidebar toggle — desktop only */}
            <button onClick={()=>setCollapsed(o=>!o)}
              className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center transition-all hover:brightness-125"
              style={{background:'rgba(255,255,255,0.06)',color:'#94a3b8',border:'1px solid rgba(255,255,255,0.1)'}}>
              <Menu className="w-4 h-4"/>
            </button>
            <div>
              <h1 className="text-sm md:text-base font-black text-white leading-tight">{selectedGym?.name || 'Dashboard'}</h1>
              <p className="text-xs hidden md:block" style={{color:'#3d5a8a'}}>{format(now,'EEEE, d MMMM yyyy')}</p>
              <p className="text-xs md:hidden" style={{color:'#4a6492'}}>{NAV.find(n=>n.id===tab)?.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* At risk — always show if any */}
            {atRisk > 0 && (
              <button onClick={()=>setTab('members')}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold"
                style={{background:'rgba(249,115,22,0.1)',color:'#fb923c',border:'1px solid rgba(249,115,22,0.25)'}}>
                <AlertTriangle className="w-3.5 h-3.5"/><span className="hidden sm:inline">{atRisk} at risk</span><span className="sm:hidden">{atRisk}</span>
              </button>
            )}
            {/* Scan QR — always useful on mobile */}
            <button onClick={()=>openModal('qrScanner')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold"
              style={{background:'rgba(16,185,129,0.1)',color:'#34d399',border:'1px solid rgba(16,185,129,0.25)'}}>
              <QrCode className="w-3.5 h-3.5"/><span className="hidden sm:inline">Scan QR</span>
            </button>
            {/* New Post — desktop only label */}
            <button onClick={()=>openModal('post')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold"
              style={{background:'rgba(59,130,246,0.15)',color:'#93c5fd',border:'1px solid rgba(59,130,246,0.3)'}}>
              <Pencil className="w-3.5 h-3.5"/><span className="hidden sm:inline">New Post</span>
            </button>
            {/* Join code — desktop only */}
            {selectedGym?.join_code ? (
              <button onClick={()=>openModal('qrCode')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest"
                style={{background:'rgba(255,255,255,0.06)',color:'#93b4e8',border:'1px solid rgba(255,255,255,0.1)'}}>
                {selectedGym.join_code}
              </button>
            ) : (
              <button onClick={async()=>{try{const r=await base44.functions.invoke('generateGymJoinCode',{gym_id:selectedGym.id});if(r.data?.success)invGyms();}catch{}}}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{background:'rgba(16,185,129,0.1)',color:'#34d399',border:'1px solid rgba(16,185,129,0.25)'}}>
                <Plus className="w-3.5 h-3.5"/>Generate Code
              </button>
            )}
            {selectedGym?.verified && (
              <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                style={{background:'rgba(59,130,246,0.1)',color:'#93c5fd',border:'1px solid rgba(59,130,246,0.25)'}}>
                <Shield className="w-3.5 h-3.5"/>Verified
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 pb-24 md:pb-6" style={{background:'transparent'}}>
          <div className="max-w-[1400px] mx-auto">
            {TABS[tab] || TABS.overview}
          </div>
        </main>
      </div>

      {/* ── All modals ───────────────────────────────────────────────────── */}
      <ManageRewardsModal    open={modal==='rewards'}    onClose={closeModal} rewards={rewards}   onCreateReward={d=>createRewardM.mutate(d)}  onDeleteReward={id=>deleteRewardM.mutate(id)} gym={selectedGym} isLoading={createRewardM.isPending}/>
      <ManageClassesModal    open={modal==='classes'}    onClose={closeModal} classes={classes}   onCreateClass={d=>createClassM.mutate(d)}    onUpdateClass={(id,data)=>updateClassM.mutate({id,data})} onDeleteClass={id=>deleteClassM.mutate(id)} gym={selectedGym} isLoading={createClassM.isPending||updateClassM.isPending}/>
      <ManageCoachesModal    open={modal==='coaches'}    onClose={closeModal} coaches={coaches}   onCreateCoach={d=>createCoachM.mutate(d)}    onDeleteCoach={id=>deleteCoachM.mutate(id)}  gym={selectedGym} isLoading={createCoachM.isPending}/>
      <ManageGymPhotosModal  open={modal==='photos'}     onClose={closeModal} gallery={selectedGym?.gallery||[]} onSave={g=>updateGalleryM.mutate(g)} isLoading={updateGalleryM.isPending}/>
      <ManageMembersModal    open={modal==='members'}    onClose={closeModal} gym={selectedGym}   onBanMember={id=>banMemberM.mutate(id)}      onUnbanMember={id=>unbanMemberM.mutate(id)}/>
      <CreateGymOwnerPostModal open={modal==='post'}     onClose={closeModal} gym={selectedGym}   onSuccess={()=>inv('posts')}/>
      <CreateEventModal      open={modal==='event'}      onClose={closeModal} onSave={d=>createEventM.mutate(d)}     gym={selectedGym} isLoading={createEventM.isPending}/>
      <CreateChallengeModal  open={modal==='challenge'}  onClose={closeModal} gyms={gyms}         onSave={d=>createChallengeM.mutate(d)}        isLoading={createChallengeM.isPending}/>
      <QRScanner             open={modal==='qrScanner'}  onClose={closeModal}/>
      <ManageEquipmentModal  open={modal==='equipment'}  onClose={closeModal} equipment={selectedGym?.equipment||[]} onSave={e=>updateGymM.mutate({equipment:e})} isLoading={updateGymM.isPending}/>
      <ManageAmenitiesModal  open={modal==='amenities'}  onClose={closeModal} amenities={selectedGym?.amenities||[]} onSave={a=>updateGymM.mutate({amenities:a})} isLoading={updateGymM.isPending}/>
      <EditBasicInfoModal    open={modal==='editInfo'}   onClose={closeModal} gym={selectedGym}   onSave={d=>updateGymM.mutate(d)} isLoading={updateGymM.isPending}/>
      <CreatePollModal       open={modal==='poll'}       onClose={closeModal} onSave={d=>createPollM.mutate(d)} isLoading={createPollM.isPending}/>

      {/* Delete Gym */}
      <AlertDialog open={modal==='deleteGym'} onOpenChange={v=>!v&&closeModal()}>
        <AlertDialogContent style={{background:'rgba(2,6,23,0.98)',borderColor:'rgba(239,68,68,0.3)'}} className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400"/>Delete Gym Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm" style={{color:'#6b87b8'}}>
              Deletes <span className="font-bold text-white">{selectedGym?.name}</span> and all check-ins, classes, rewards and member data. <span className="text-red-400 font-semibold">Cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{background:'rgba(255,255,255,0.06)',color:'#93b4e8',borderColor:'rgba(255,255,255,0.1)'}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={()=>deleteGymM.mutate()} disabled={deleteGymM.isPending} className="bg-red-600 hover:bg-red-700 text-white">{deleteGymM.isPending?'Deleting…':'Delete Permanently'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account */}
      <AlertDialog open={modal==='deleteAccount'} onOpenChange={v=>!v&&closeModal()}>
        <AlertDialogContent style={{background:'rgba(2,6,23,0.98)',borderColor:'rgba(239,68,68,0.3)'}} className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400"/>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm" style={{color:'#6b87b8'}}>
              Deletes your account, all gyms, and personal data. <span className="text-red-400 font-semibold">Cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{background:'rgba(255,255,255,0.06)',color:'#93b4e8',borderColor:'rgba(255,255,255,0.1)'}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={()=>deleteAccountM.mutate()} disabled={deleteAccountM.isPending} className="bg-red-700 hover:bg-red-800 text-white">{deleteAccountM.isPending?'Deleting…':'Delete Account'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Modal */}
      {modal==='qrCode' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(6,13,31,0.88)',backdropFilter:'blur(8px)'}}>
          <div className="rounded-3xl p-8 max-w-sm w-full shadow-2xl" style={{background:'rgba(15,23,42,0.98)',border:'1px solid rgba(255,255,255,0.1)'}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white">Gym Join QR Code</h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'rgba(255,255,255,0.06)',color:'#94a3b8',border:'1px solid rgba(255,255,255,0.1)'}}>
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div id="qr-fullscreen" className="flex justify-center p-6 rounded-2xl bg-white mb-5">
              <QRCode value={`${window.location.origin}${createPageUrl('Gyms')}?joinCode=${selectedGym?.join_code}`} size={260} level="H"/>
            </div>
            <p className="text-center text-sm mb-5" style={{color:'#6b87b8'}}>Join code: <span className="font-black text-white tracking-widest">{selectedGym?.join_code}</span></p>
            <div className="space-y-2.5">
              <button onClick={()=>dlQR('qr-fullscreen')} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white"
                style={{background:'linear-gradient(135deg,#10b981,#0d9488)'}}>
                <Download className="w-4 h-4"/>Download QR Code
              </button>
              <button onClick={closeModal} className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{background:'rgba(255,255,255,0.06)',color:'#93b4e8',border:'1px solid rgba(255,255,255,0.1)'}}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}