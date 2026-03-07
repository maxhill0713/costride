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
  LogOut, ChevronDown, AlertTriangle, QrCode, MessageSquarePlus, Flame
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

// ── Exact navy palette from screenshot ────────────────────────────────────
// Background: deep navy #0b1120, cards: #111d3a, sidebar: #0d1630
const N = {
  950: '#080e1e',   // deepest navy — page bg edges
  900: '#0b1120',   // main page background
  850: '#0d1630',   // sidebar bg
  800: '#111d3a',   // card background — matches screenshot exactly
  750: '#162040',   // card hover / slightly lighter card
  700: '#1a2650',   // inner row bg
  600: '#1f2d5c',   // border colour
  500: '#253568',
};

// Background system matching the screenshot's exact look
const BG = {
  // Page: radial glow from bottom-center like the screenshot, deep navy
  page: 'radial-gradient(ellipse 120% 80% at 50% 110%, #0e1d45 0%, #0b1120 55%, #080e1e 100%)',
  // Main scrollable area — same deep navy
  main: '#0b1120',
  // Sidebar — slightly darker, flat
  sidebar: '#0d1630',
  // Header — matches sidebar
  header: '#0d1630',
  // Cards — solid opaque navy like screenshot cards (Today's Workout, quote card)
  card: '#111d3a',
  cardBorder: 'rgba(255,255,255,0.07)',
  // Inner row items inside cards
  row: '#0d1932',
  rowBorder: 'rgba(255,255,255,0.05)',
};

const A = {
  blue:   { c:'#60a5fa', glow:'rgba(96,165,250,0.15)',   bg:'rgba(59,130,246,0.12)',  border:'rgba(59,130,246,0.28)'  },
  green:  { c:'#34d399', glow:'rgba(52,211,153,0.15)',   bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.28)'  },
  orange: { c:'#fb923c', glow:'rgba(251,146,60,0.15)',   bg:'rgba(249,115,22,0.12)',  border:'rgba(249,115,22,0.28)'  },
  purple: { c:'#a78bfa', glow:'rgba(167,139,250,0.15)',  bg:'rgba(139,92,246,0.12)',  border:'rgba(139,92,246,0.28)'  },
  yellow: { c:'#fbbf24', glow:'rgba(251,191,36,0.15)',   bg:'rgba(251,191,36,0.12)',  border:'rgba(251,191,36,0.28)'  },
  red:    { c:'#f87171', glow:'rgba(248,113,113,0.15)',  bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.28)'   },
  cyan:   { c:'#22d3ee', glow:'rgba(34,211,238,0.15)',   bg:'rgba(6,182,212,0.12)',   border:'rgba(6,182,212,0.28)'   },
};

const NAV = [
  { id:'overview',  label:'Overview',  icon:LayoutDashboard },
  { id:'members',   label:'Members',   icon:Users },
  { id:'content',   label:'Content',   icon:FileText },
  { id:'analytics', label:'Analytics', icon:BarChart3 },
  { id:'gym',       label:'Settings',  icon:Settings },
];

// ── Stat card — solid navy card with coloured top bar ─────────────────────
const StatCard = ({ icon:Icon, ak='blue', label, value, sub, trend }) => {
  const a = A[ak];
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 border group cursor-default transition-all duration-300 hover:-translate-y-0.5"
      style={{ background: BG.card, borderColor: BG.cardBorder, boxShadow:'0 2px 12px rgba(0,0,0,0.4)' }}>
      {/* Coloured top bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background:`linear-gradient(90deg,${a.c},${a.c}55,transparent)` }} />
      {/* Subtle glow blob */}
      <div className="absolute -top-6 -left-3 w-24 h-24 rounded-full opacity-10 blur-2xl" style={{ background:a.c }} />
      {/* Watermark icon */}
      <div className="absolute -bottom-2 -right-2 opacity-[0.05]">
        <Icon className="w-20 h-20" style={{ color:a.c }} />
      </div>
      <div className="relative flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background:a.bg, border:`1px solid ${a.border}` }}>
          <Icon className="w-5 h-5" style={{ color:a.c }} />
        </div>
        {trend !== undefined && (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg"
            style={{ background:trend>=0?'rgba(52,211,153,0.1)':'rgba(248,113,113,0.1)', color:trend>=0?'#34d399':'#f87171', border:`1px solid ${trend>=0?'rgba(52,211,153,0.2)':'rgba(248,113,113,0.2)'}` }}>
            {trend>=0?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="relative">
        <div className="text-3xl font-black tracking-tight mb-1" style={{ color:a.c }}>{value}</div>
        <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{color:'rgba(255,255,255,0.45)'}}>{label}</div>
        {sub && <div className="text-xs" style={{ color:'rgba(255,255,255,0.25)' }}>{sub}</div>}
      </div>
    </div>
  );
};

// ── Panel — solid navy card matching screenshot ────────────────────────────
const Panel = ({ children, className='' }) => (
  <div className={`rounded-2xl border ${className}`}
    style={{ background: BG.card, borderColor: BG.cardBorder, boxShadow:'0 2px 16px rgba(0,0,0,0.35)' }}>
    {children}
  </div>
);

const PB = ({ children, className='' }) => (
  <div className={`p-4 md:p-5 ${className}`}>{children}</div>
);

const PH = ({ title, subtitle, action, actionLabel, badge, ak, icon:Icon }) => {
  const accentColor = ak ? A[ak].c : '#60a5fa';
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {Icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background:`${accentColor}18`, border:`1px solid ${accentColor}28` }}>
            <Icon className="w-3.5 h-3.5" style={{ color:accentColor }} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {badge !== undefined && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)' }}>{badge}</span>
        )}
        {action && (
          <button onClick={action}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:brightness-110"
            style={{ background:'rgba(59,130,246,0.14)', color:'#93c5fd', border:'1px solid rgba(59,130,246,0.25)' }}>
            <Plus className="w-3 h-3"/>{actionLabel||'Add'}
          </button>
        )}
      </div>
    </div>
  );
};

const DT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-2xl text-xs border" style={{ background:N[850], borderColor:'rgba(255,255,255,0.1)' }}>
      <p className="mb-1" style={{ color:'rgba(255,255,255,0.4)' }}>{label}</p>
      {payload.map((p,i) => <p key={i} className="font-bold" style={{ color:p.color }}>{p.value} {p.name}</p>)}
    </div>
  );
};

const Tag = ({ children, color='blue' }) => {
  const m = {
    blue:  ['rgba(59,130,246,0.14)','#93c5fd','rgba(59,130,246,0.25)'],
    green: ['rgba(16,185,129,0.14)','#6ee7b7','rgba(16,185,129,0.25)'],
    orange:['rgba(249,115,22,0.14)','#fdba74','rgba(249,115,22,0.25)'],
    red:   ['rgba(239,68,68,0.14)', '#fca5a5','rgba(239,68,68,0.25)'],
    purple:['rgba(139,92,246,0.14)','#c4b5fd','rgba(139,92,246,0.25)'],
  };
  const [bg,text,border] = m[color]||m.blue;
  return <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background:bg, color:text, border:`1px solid ${border}` }}>{children}</span>;
};

const Empty = ({ icon:Icon, label, action, actionLabel }) => (
  <div className="py-10 text-center">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background:BG.row, border:`1px solid ${BG.rowBorder}` }}>
      <Icon className="w-4 h-4" style={{ color:'rgba(255,255,255,0.2)' }} />
    </div>
    <p className="text-sm" style={{ color:'rgba(255,255,255,0.3)' }}>{label}</p>
    {action && <button onClick={action} className="mt-3 text-xs font-bold px-4 py-2 rounded-lg" style={{ background:'rgba(59,130,246,0.14)', color:'#93c5fd', border:'1px solid rgba(59,130,246,0.25)' }}>{actionLabel}</button>}
  </div>
);

// ── ROOT ───────────────────────────────────────────────────────────────────
export default function GymOwnerDashboard() {
  const [tab, setTab]             = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const [gymOpen, setGymOpen]     = useState(false);
  const [modal, setModal]         = useState(null);

  const openModal  = n => setModal(n);
  const closeModal = () => setModal(null);
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data:currentUser } = useQuery({ queryKey:['currentUser'], queryFn:()=>base44.auth.me(), staleTime:5*60*1000 });
  React.useEffect(() => { if(currentUser && !currentUser.onboarding_completed) navigate(createPageUrl('Onboarding')); }, [currentUser,navigate]);

  const { data:gyms=[], error:gymsError } = useQuery({ queryKey:['ownerGyms',currentUser?.email], queryFn:()=>base44.entities.Gym.filter({owner_email:currentUser.email}), enabled:!!currentUser?.email, retry:3, staleTime:5*60*1000 });
  const myGyms       = gyms.filter(g=>g.owner_email===currentUser?.email);
  const approvedGyms = myGyms.filter(g=>g.status==='approved');
  const pendingGyms  = myGyms.filter(g=>g.status==='pending');

  React.useEffect(() => { if(approvedGyms.length>0&&!selectedGym) setSelectedGym(approvedGyms[0]); }, [approvedGyms,selectedGym]);
  React.useEffect(() => { const iv=setInterval(()=>queryClient.invalidateQueries({queryKey:['ownerGyms']}),10000); return ()=>clearInterval(iv); }, [queryClient]);

  const qo={staleTime:3*60*1000,placeholderData:p=>p}, on=!!selectedGym;
  const {data:allMemberships=[]} = useQuery({queryKey:['memberships',selectedGym?.id],queryFn:()=>base44.entities.GymMembership.filter({gym_id:selectedGym.id,status:'active'}),enabled:on&&!!currentUser,...qo});
  const {data:checkIns=[]}       = useQuery({queryKey:['checkIns',selectedGym?.id],   queryFn:()=>base44.entities.CheckIn.filter({gym_id:selectedGym.id},'-check_in_date',500),enabled:on,...qo});
  const {data:lifts=[]}          = useQuery({queryKey:['lifts',selectedGym?.id],       queryFn:()=>base44.entities.Lift.filter({gym_id:selectedGym.id},'-lift_date',200),enabled:on,...qo});
  const {data:rewards=[]}        = useQuery({queryKey:['rewards',selectedGym?.id],     queryFn:()=>base44.entities.Reward.filter({gym_id:selectedGym.id}),enabled:on,...qo});
  const {data:classes=[]}        = useQuery({queryKey:['classes',selectedGym?.id],     queryFn:()=>base44.entities.GymClass.filter({gym_id:selectedGym.id}),enabled:on,...qo});
  const {data:coaches=[]}        = useQuery({queryKey:['coaches',selectedGym?.id],     queryFn:()=>base44.entities.Coach.filter({gym_id:selectedGym.id}),enabled:on,...qo});
  const {data:events=[]}         = useQuery({queryKey:['events',selectedGym?.id],      queryFn:()=>base44.entities.Event.filter({gym_id:selectedGym.id},'-event_date'),enabled:on,...qo});
  const {data:posts=[]}          = useQuery({queryKey:['posts',selectedGym?.id],       queryFn:()=>base44.entities.Post.filter({allow_gym_repost:true},'-created_date',20),enabled:on,...qo});
  const {data:challenges=[]}     = useQuery({queryKey:['challenges',selectedGym?.id],  queryFn:()=>base44.entities.Challenge.filter({gym_id:selectedGym.id},'-created_date'),enabled:on,...qo});
  const {data:polls=[]}          = useQuery({queryKey:['polls',selectedGym?.id],       queryFn:()=>base44.entities.Poll.filter({gym_id:selectedGym.id,status:'active'},'-created_date'),enabled:on,...qo});

  const inv=(...keys)=>keys.forEach(k=>queryClient.invalidateQueries({queryKey:[k,selectedGym?.id]}));
  const invGyms=()=>queryClient.invalidateQueries({queryKey:['gyms']});

  const createRewardM    = useMutation({mutationFn:d=>base44.entities.Reward.create(d),onSuccess:()=>inv('rewards')});
  const deleteRewardM    = useMutation({mutationFn:id=>base44.entities.Reward.delete(id),onSuccess:()=>inv('rewards')});
  const createClassM     = useMutation({mutationFn:d=>base44.entities.GymClass.create(d),onSuccess:()=>inv('classes')});
  const deleteClassM     = useMutation({mutationFn:id=>base44.entities.GymClass.delete(id),onSuccess:()=>inv('classes')});
  const updateClassM     = useMutation({mutationFn:({id,data})=>base44.entities.GymClass.update(id,data),onSuccess:()=>inv('classes')});
  const createCoachM     = useMutation({mutationFn:d=>base44.entities.Coach.create(d),onSuccess:()=>inv('coaches')});
  const deleteCoachM     = useMutation({mutationFn:id=>base44.entities.Coach.delete(id),onSuccess:()=>inv('coaches')});
  const updateGalleryM   = useMutation({mutationFn:g=>base44.entities.Gym.update(selectedGym.id,{gallery:g}),onSuccess:()=>{invGyms();closeModal();}});
  const updateGymM       = useMutation({mutationFn:d=>base44.entities.Gym.update(selectedGym.id,d),onSuccess:()=>{invGyms();closeModal();}});
  const createEventM     = useMutation({mutationFn:d=>base44.entities.Event.create({...d,gym_id:selectedGym.id,gym_name:selectedGym.name,attendees:0}),onSuccess:()=>{inv('events');closeModal();}});
  const createChallengeM = useMutation({mutationFn:d=>base44.entities.Challenge.create({...d,gym_id:selectedGym.id,gym_name:selectedGym.name,participants:[],status:'upcoming'}),onSuccess:()=>{inv('challenges');closeModal();}});
  const banMemberM       = useMutation({mutationFn:uid=>base44.entities.Gym.update(selectedGym.id,{banned_members:[...(selectedGym?.banned_members||[]),uid]}),onSuccess:invGyms});
  const unbanMemberM     = useMutation({mutationFn:uid=>base44.entities.Gym.update(selectedGym.id,{banned_members:(selectedGym?.banned_members||[]).filter(id=>id!==uid)}),onSuccess:invGyms});
  const deleteGymM       = useMutation({mutationFn:()=>base44.entities.Gym.delete(selectedGym.id),onSuccess:()=>{invGyms();closeModal();window.location.href=createPageUrl('Gyms');}});
  const deleteAccountM   = useMutation({mutationFn:()=>base44.functions.invoke('deleteUserAccount'),onSuccess:()=>{closeModal();base44.auth.logout();}});
  const createPollM      = useMutation({mutationFn:d=>base44.entities.Poll.create({...d,gym_id:selectedGym.id,gym_name:selectedGym.name,created_by:currentUser.id,voters:[]}),onSuccess:()=>{inv('polls');closeModal();}});

  const Splash = ({children}) => (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: BG.page}}>
      <Panel className="max-w-md w-full"><PB className="text-center">{children}</PB></Panel>
    </div>
  );
  if(gymsError) return <Splash><div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-5"><X className="w-7 h-7 text-red-400"/></div><h2 className="text-xl font-black text-white mb-2">Error</h2><p className="text-sm mb-6" style={{color:'rgba(255,255,255,0.4)'}}>{gymsError.message}</p><Button onClick={()=>window.location.reload()} className="bg-blue-600 text-white">Retry</Button></Splash>;
  if(approvedGyms.length===0&&pendingGyms.length>0) return <Splash><div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center mx-auto mb-5"><Clock className="w-7 h-7 text-yellow-400"/></div><h2 className="text-xl font-black text-white mb-2">Pending Approval</h2><p className="text-sm mb-6" style={{color:'rgba(255,255,255,0.4)'}}>Your gym <span className="text-yellow-400 font-bold">{pendingGyms[0].name}</span> is under review.</p><Link to={createPageUrl('Home')}><Button style={{background:N[700],color:'rgba(255,255,255,0.7)'}}>Back to Home</Button></Link></Splash>;
  if(myGyms.length===0) return <Splash><div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mx-auto mb-5"><Dumbbell className="w-7 h-7 text-blue-400"/></div><h2 className="text-xl font-black text-white mb-2">No Gyms Yet</h2><p className="text-sm mb-6" style={{color:'rgba(255,255,255,0.4)'}}>Register your gym to get started.</p><Link to={createPageUrl('GymSignup')}><Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">Register Your Gym</Button></Link></Splash>;

  const now=new Date();
  const ci7    = checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:subDays(now,7),end:now}));
  const ci30   = checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:subDays(now,30),end:now}));
  const ciPrev = checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:subDays(now,60),end:subDays(now,30)}));
  const todayCI=checkIns.filter(c=>startOfDay(new Date(c.check_in_date)).getTime()===startOfDay(now).getTime()).length;
  const uniqueMembers=new Set(checkIns.map(c=>c.user_id)).size;
  const activeThisWeek=new Set(ci7.map(c=>c.user_id)).size;
  const activeLastWeek=new Set(checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:subDays(now,14),end:subDays(now,7)})).map(c=>c.user_id)).size;
  const weeklyChangePct=activeLastWeek>0?Math.round(((activeThisWeek-activeLastWeek)/activeLastWeek)*100):0;
  const activeThisMonth=new Set(ci30.map(c=>c.user_id)).size;
  const retentionRate=uniqueMembers>0?Math.round((activeThisMonth/uniqueMembers)*100):0;
  const monthCiPer=(() => { const acc={}; ci30.forEach(c=>{acc[c.user_id]=(acc[c.user_id]||0)+1;}); return Object.values(acc); })();
  const atRisk=allMemberships.filter(m=>{const last=checkIns.filter(c=>c.user_id===m.user_id)[0];if(!last)return false;const d=Math.floor((now-new Date(last.check_in_date))/86400000);return d>=7&&d<=10;}).length;
  const monthChangePct=ciPrev.length>0?Math.round(((ci30.length-ciPrev.length)/ciPrev.length)*100):0;
  const ciByDay=Array.from({length:7},(_,i)=>{const d=subDays(now,6-i);return{day:format(d,'EEE'),value:checkIns.filter(c=>startOfDay(new Date(c.check_in_date)).getTime()===startOfDay(d).getTime()).length};});
  const weekTrend=Array.from({length:12},(_,i)=>{const s=subDays(now,(11-i)*7),e=subDays(now,(10-i)*7);return{label:format(s,'MMM d'),value:checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).length};});
  const monthGrowth=Array.from({length:6},(_,i)=>{const e=subDays(now,i*30),s=subDays(e,30);return{label:format(e,'MMM'),value:new Set(checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).map(c=>c.user_id)).size};}).reverse();

  const dlQR=id=>{const svg=document.getElementById(id)?.querySelector('svg');if(!svg)return;const d=new XMLSerializer().serializeToString(svg);const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');const img=new Image();img.onload=()=>{canvas.width=img.width;canvas.height=img.height;ctx.drawImage(img,0,0);const a=document.createElement('a');a.download=`${selectedGym?.name}-QR.png`;a.href=canvas.toDataURL('image/png');a.click();};img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(d)));};
  const goTab=id=>{setTab(id);setSidebarOpen(false);};

  // ══════════════════════════════════════════════════════════════════
  // TABS
  // ══════════════════════════════════════════════════════════════════
  const TabOverview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Dumbbell}  ak="blue"   label="Today's Check-ins" value={todayCI}        sub="members in today" />
        <StatCard icon={Users}     ak="green"  label="Active This Week"  value={activeThisWeek} sub={`of ${uniqueMembers} members`} trend={weeklyChangePct} />
        <StatCard icon={Activity}  ak="purple" label="Monthly Check-ins" value={ci30.length}    sub="last 30 days" trend={monthChangePct} />
        <StatCard icon={Star}      ak="yellow" label="Avg Rating"        value={selectedGym?.rating?.toFixed(1)??'—'} sub="member rating" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <PH title="Check-ins — Last 7 Days" subtitle="Daily attendance" ak="blue" icon={Activity} />
          <PB>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ciByDay} barSize={30}>
                <defs><linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/><stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="day" tick={{fill:'rgba(255,255,255,0.3)',fontSize:11,fontWeight:600}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'rgba(255,255,255,0.3)',fontSize:11}} axisLine={false} tickLine={false} width={24} allowDecimals={false}/>
                <Tooltip content={<DT/>} cursor={{fill:'rgba(59,130,246,0.06)',radius:4}}/>
                <Bar dataKey="value" fill="url(#barBlue)" radius={[6,6,0,0]} name="Check-ins"/>
              </BarChart>
            </ResponsiveContainer>
          </PB>
        </Panel>
        <Panel>
          <PH title="Alerts & Actions" ak="orange" icon={AlertTriangle}/>
          <PB className="space-y-2.5">
            {atRisk>0 ? (
              <div className="p-3.5 rounded-xl" style={{background:'rgba(251,146,60,0.07)',border:'1px solid rgba(249,115,22,0.2)'}}>
                <div className="flex gap-2.5"><AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5"/>
                  <div><p className="text-sm font-bold text-white">{atRisk} members at risk</p><p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.35)'}}>No check-in 7–10 days</p><button onClick={()=>goTab('members')} className="mt-2 text-xs font-bold text-orange-400">View Members →</button></div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl flex items-center gap-2.5" style={{background:'rgba(52,211,153,0.07)',border:'1px solid rgba(16,185,129,0.2)'}}>
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0"/>
                <div><p className="text-sm font-bold text-white">All members active</p><p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.35)'}}>No at-risk members</p></div>
              </div>
            )}
            {!challenges.some(c=>c.status==='active') && (
              <div className="p-3.5 rounded-xl" style={{background:'rgba(96,165,250,0.07)',border:'1px solid rgba(59,130,246,0.2)'}}>
                <div className="flex gap-2.5"><Trophy className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5"/>
                  <div><p className="text-sm font-bold text-white">No active challenge</p><p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.35)'}}>Challenges boost retention</p><button onClick={()=>openModal('challenge')} className="mt-2 text-xs font-bold text-blue-400">Create one →</button></div>
                </div>
              </div>
            )}
            {polls.length===0 && (
              <div className="p-3.5 rounded-xl" style={{background:'rgba(167,139,250,0.07)',border:'1px solid rgba(139,92,246,0.2)'}}>
                <div className="flex gap-2.5"><BarChart2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5"/>
                  <div><p className="text-sm font-bold text-white">No active polls</p><p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.35)'}}>Engage members with a poll</p><button onClick={()=>openModal('poll')} className="mt-2 text-xs font-bold text-purple-400">Create one →</button></div>
                </div>
              </div>
            )}
          </PB>
        </Panel>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2.5 px-0.5" style={{color:'rgba(255,255,255,0.2)'}}>Quick Create</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {label:'New Post',ak:'blue',icon:MessageSquarePlus,action:()=>openModal('post'),sub:`Share update`},
            {label:'New Event',ak:'green',icon:Calendar,action:()=>openModal('event'),sub:`${events.filter(e=>new Date(e.event_date)>=now).length} upcoming`},
            {label:'New Challenge',ak:'orange',icon:Trophy,action:()=>openModal('challenge'),sub:`${challenges.filter(c=>c.status==='active').length} active`},
            {label:'New Poll',ak:'purple',icon:BarChart2,action:()=>openModal('poll'),sub:`${polls.length} active`},
          ].map((b,i)=>{
            const a=A[b.ak];
            return (
              <button key={i} onClick={b.action}
                className="relative overflow-hidden flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:-translate-y-0.5 active:scale-95"
                style={{background:BG.card,border:`1px solid rgba(255,255,255,0.07)`}}>
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{background:`linear-gradient(90deg,${a.c}88,transparent)`}}/>
                <div className="absolute -right-3 -bottom-3 opacity-[0.06]"><b.icon className="w-14 h-14" style={{color:a.c}}/></div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:a.bg,border:`1px solid ${a.border}`}}>
                  <b.icon className="w-4 h-4" style={{color:a.c}}/>
                </div>
                <div className="relative min-w-0">
                  <p className="text-sm font-bold text-white">{b.label}</p>
                  <p className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>{b.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <Panel>
        <PH title="Recent Activity" subtitle="Latest check-ins" ak="purple" icon={Activity}/>
        <PB>
          <div className="divide-y" style={{borderColor:'rgba(255,255,255,0.05)'}}>
            {ci7.length>0 ? ci7.slice(0,8).map((c,i)=>(
              <div key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{c.user_name?.charAt(0)?.toUpperCase()}</div>
                <p className="flex-1 text-sm font-semibold text-white truncate">{c.user_name}</p>
                <p className="text-xs flex-shrink-0" style={{color:'rgba(255,255,255,0.3)'}}>{format(new Date(c.check_in_date),'MMM d, h:mma')}</p>
              </div>
            )) : <Empty icon={Activity} label="No check-ins in the last 7 days"/>}
          </div>
        </PB>
      </Panel>
    </div>
  );

  const TabMembers = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users}    ak="blue"   label="Total Members"    value={uniqueMembers}      sub="all-time unique"/>
        <StatCard icon={Zap}      ak="green"  label="Active This Week" value={activeThisWeek}     trend={weeklyChangePct} sub="visited gym"/>
        <StatCard icon={Activity} ak="purple" label="Retention Rate"   value={`${retentionRate}%`} sub="active last 30d"/>
        <StatCard icon={Trophy}   ak="yellow" label="PRs Logged"       value={lifts.filter(l=>l.is_pr).length} sub="personal records"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Panel className="lg:col-span-2">
          <PH title="Engagement Tiers" subtitle="Last 30 days" ak="orange" icon={Flame}/>
          <PB>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {label:'Super Active',sub:'15+/mo',val:monthCiPer.filter(v=>v>=15).length,ak:'green',e:'🔥'},
                {label:'Active',sub:'8–14/mo',val:monthCiPer.filter(v=>v>=8&&v<15).length,ak:'blue',e:'💪'},
                {label:'Casual',sub:'1–7/mo',val:monthCiPer.filter(v=>v>=1&&v<8).length,ak:'yellow',e:'🚶'},
                {label:'At Risk',sub:'7–10d inactive',val:atRisk,ak:'red',e:'⚠️'},
              ].map((t,i)=>{
                const a=A[t.ak];
                return (
                  <div key={i} className="relative overflow-hidden p-3.5 rounded-xl border" style={{background:BG.row,borderColor:'rgba(255,255,255,0.06)'}}>
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{background:`linear-gradient(90deg,${a.c}88,transparent)`}}/>
                    <div className="text-xl mb-1.5">{t.e}</div>
                    <div className="text-3xl font-black mb-0.5" style={{color:a.c}}>{t.val}</div>
                    <div className="text-xs font-bold" style={{color:'rgba(255,255,255,0.7)'}}>{t.label}</div>
                    <div className="text-xs" style={{color:'rgba(255,255,255,0.25)'}}>{t.sub}</div>
                  </div>
                );
              })}
            </div>
          </PB>
        </Panel>
        <Panel className="lg:col-span-3">
          <PH title="Weekly Leaderboard" subtitle="Most check-ins this week" badge={ci7.length} action={()=>openModal('members')} actionLabel="All Members" ak="yellow" icon={Trophy}/>
          <PB>
            <div className="space-y-1.5">
              {Object.entries(ci7.reduce((acc,c)=>{acc[c.user_name]=(acc[c.user_name]||0)+1;return acc;},{}))
                .sort(([,a],[,b])=>b-a).slice(0,7)
                .map(([name,count],idx)=>{
                  const medals=['🥇','🥈','🥉'];
                  const isTop=idx<3;
                  return (
                    <div key={name} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border"
                      style={{background:isTop?'rgba(251,191,36,0.06)':BG.row,borderColor:isTop?'rgba(251,191,36,0.15)':'rgba(255,255,255,0.05)'}}>
                      <span className="text-base w-6 text-center flex-shrink-0">{medals[idx]||<span className="text-xs font-bold" style={{color:'rgba(255,255,255,0.3)'}}>{idx+1}</span>}</span>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{name?.charAt(0)?.toUpperCase()}</div>
                      <span className="flex-1 text-sm font-semibold text-white truncate">{name}</span>
                      <span className="text-sm font-black flex-shrink-0" style={{color:isTop?'#fbbf24':'rgba(255,255,255,0.4)'}}>{count} <span className="text-xs font-normal" style={{color:'rgba(255,255,255,0.2)'}}>visits</span></span>
                    </div>
                  );
                })}
              {ci7.length===0 && <Empty icon={Users} label="No check-ins this week yet"/>}
            </div>
          </PB>
        </Panel>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PH title="Busiest Days" subtitle="All-time distribution" ak="green" icon={Calendar}/>
          <PB>
            <div className="space-y-2.5">
              {(() => {
                const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                const acc={}; checkIns.forEach(c=>{const d=new Date(c.check_in_date).getDay();acc[d]=(acc[d]||0)+1;});
                const max=Math.max(...Object.values(acc),1);
                return days.map((name,idx)=>({name,count:acc[idx]||0})).sort((a,b)=>b.count-a.count).map(({name,count},rank)=>(
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-5 text-right flex-shrink-0" style={{color:'rgba(255,255,255,0.2)'}}>#{rank+1}</span>
                    <span className="text-sm text-white w-24 flex-shrink-0">{name}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                      <div className="h-full rounded-full" style={{width:`${(count/max)*100}%`,background:'linear-gradient(90deg,#3b82f6,#06b6d4)'}}/>
                    </div>
                    <span className="text-sm font-bold text-white w-7 text-right flex-shrink-0">{count}</span>
                  </div>
                ));
              })()}
            </div>
          </PB>
        </Panel>
        <Panel>
          <PH title="Rewards Program" badge={rewards.length} action={()=>openModal('rewards')} actionLabel="Manage" ak="purple" icon={Gift}/>
          <PB>
            {rewards.length>0 ? (
              <div className="space-y-2">
                {rewards.slice(0,6).map(r=>(
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{background:BG.row,borderColor:'rgba(255,255,255,0.05)'}}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{background:'rgba(167,139,250,0.1)',border:'1px solid rgba(139,92,246,0.2)'}}>{r.icon||'🎁'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{r.title}</p>
                      <p className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>{r.claimed_by?.length||0} claimed · {r.value}</p>
                    </div>
                    <Tag color={r.active?'green':'blue'}>{r.active?'Active':'Off'}</Tag>
                  </div>
                ))}
              </div>
            ) : <Empty icon={Gift} label="No rewards yet" action={()=>openModal('rewards')} actionLabel="Create Rewards"/>}
          </PB>
        </Panel>
      </div>
    </div>
  );

  const TabContent = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:'New Post',sub:'Share with members',ak:'blue',icon:MessageSquarePlus,action:()=>openModal('post')},
          {label:'New Event',sub:'Schedule an event',ak:'green',icon:Calendar,action:()=>openModal('event')},
          {label:'New Challenge',sub:'Boost engagement',ak:'orange',icon:Trophy,action:()=>openModal('challenge')},
          {label:'New Poll',sub:'Member feedback',ak:'purple',icon:BarChart2,action:()=>openModal('poll')},
        ].map((b,i)=>{
          const a=A[b.ak];
          return (
            <button key={i} onClick={b.action}
              className="relative overflow-hidden flex flex-col items-center justify-center gap-2.5 py-7 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95 border"
              style={{background:BG.card,borderColor:'rgba(255,255,255,0.07)'}}>
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{background:`linear-gradient(90deg,${a.c}88,transparent)`}}/>
              <div className="absolute -bottom-4 -right-4 opacity-[0.05]"><b.icon className="w-16 h-16" style={{color:a.c}}/></div>
              <div className="relative w-11 h-11 rounded-xl flex items-center justify-center" style={{background:a.bg,border:`1px solid ${a.border}`}}>
                <b.icon className="w-5 h-5" style={{color:a.c}}/>
              </div>
              <div className="relative text-center">
                <p className="text-sm font-bold text-white">{b.label}</p>
                <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.3)'}}>{b.sub}</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PH title="Recent Posts" badge={posts.length} action={()=>openModal('post')} actionLabel="New Post" ak="blue" icon={MessageSquarePlus}/>
          <PB>
            {posts.length>0 ? (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {posts.slice(0,10).map(post=>(
                  <div key={post.id} className="p-3 rounded-xl border" style={{background:BG.row,borderColor:'rgba(255,255,255,0.05)'}}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{post.member_name?.charAt(0)?.toUpperCase()}</div>
                      <p className="text-sm font-semibold text-white flex-1 truncate">{post.member_name}</p>
                      <p className="text-xs flex-shrink-0" style={{color:'rgba(255,255,255,0.25)'}}>{format(new Date(post.created_date),'MMM d')}</p>
                    </div>
                    <p className="text-xs line-clamp-2 mb-1.5" style={{color:'rgba(255,255,255,0.4)'}}>{post.content}</p>
                    <div className="flex gap-3 text-xs" style={{color:'rgba(255,255,255,0.25)'}}><span>❤️ {post.likes||0}</span><span>💬 {post.comments?.length||0}</span></div>
                  </div>
                ))}
              </div>
            ) : <Empty icon={FileText} label="No posts yet" action={()=>openModal('post')} actionLabel="Create First Post"/>}
          </PB>
        </Panel>
        <Panel>
          <PH title="Upcoming Events" badge={events.filter(e=>new Date(e.event_date)>=now).length} action={()=>openModal('event')} actionLabel="New Event" ak="green" icon={Calendar}/>
          <PB>
            {events.filter(e=>new Date(e.event_date)>=now).length>0 ? (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {events.filter(e=>new Date(e.event_date)>=now).map(ev=>(
                  <div key={ev.id} className="p-3 rounded-xl border" style={{background:BG.row,borderColor:'rgba(255,255,255,0.05)'}}>
                    {ev.image_url && <img src={ev.image_url} alt={ev.title} className="w-full h-20 object-cover rounded-lg mb-2.5"/>}
                    <p className="text-sm font-bold text-white mb-0.5 truncate">{ev.title}</p>
                    <p className="text-xs line-clamp-2 mb-1.5" style={{color:'rgba(255,255,255,0.4)'}}>{ev.description}</p>
                    <div className="flex gap-3 text-xs" style={{color:'rgba(255,255,255,0.3)'}}><span>📅 {format(new Date(ev.event_date),'MMM d, h:mma')}</span><span>👥 {ev.attendees||0}</span></div>
                  </div>
                ))}
              </div>
            ) : <Empty icon={Calendar} label="No upcoming events" action={()=>openModal('event')} actionLabel="Create Event"/>}
          </PB>
        </Panel>
        <Panel>
          <PH title="Active Challenges" badge={challenges.filter(c=>c.status==='active').length} action={()=>openModal('challenge')} actionLabel="New" ak="orange" icon={Trophy}/>
          <PB>
            {challenges.filter(c=>c.status==='active').length>0 ? (
              <div className="space-y-2.5">
                {challenges.filter(c=>c.status==='active').map(ch=>(
                  <div key={ch.id} className="p-3 rounded-xl border" style={{background:'rgba(249,115,22,0.05)',borderColor:'rgba(249,115,22,0.18)'}}>
                    <div className="flex items-start justify-between gap-2 mb-1"><p className="text-sm font-bold text-white flex-1 truncate">🏆 {ch.title}</p><Tag color="orange">{ch.type?.replace('_',' ')}</Tag></div>
                    <p className="text-xs mb-1.5 line-clamp-1" style={{color:'rgba(255,255,255,0.4)'}}>{ch.description}</p>
                    <div className="flex gap-3 text-xs" style={{color:'rgba(255,255,255,0.3)'}}><span>👥 {ch.participants?.length||0}</span><span>📅 {format(new Date(ch.start_date),'MMM d')} – {format(new Date(ch.end_date),'MMM d')}</span></div>
                  </div>
                ))}
              </div>
            ) : <Empty icon={Trophy} label="No active challenges" action={()=>openModal('challenge')} actionLabel="Create Challenge"/>}
          </PB>
        </Panel>
        <Panel>
          <PH title="Active Polls" badge={polls.length} action={()=>openModal('poll')} actionLabel="New Poll" ak="purple" icon={BarChart2}/>
          <PB>
            {polls.length>0 ? (
              <div className="space-y-2.5">
                {polls.map(poll=>(
                  <div key={poll.id} className="p-3 rounded-xl border" style={{background:'rgba(139,92,246,0.05)',borderColor:'rgba(139,92,246,0.18)'}}>
                    <p className="text-sm font-bold text-white mb-0.5 truncate">{poll.title}</p>
                    <p className="text-xs mb-1.5 line-clamp-1" style={{color:'rgba(255,255,255,0.4)'}}>{poll.description}</p>
                    <div className="flex items-center gap-2 text-xs" style={{color:'rgba(255,255,255,0.3)'}}><span>📊 {poll.voters?.length||0} votes</span><Tag color="purple">{poll.status}</Tag></div>
                  </div>
                ))}
              </div>
            ) : <Empty icon={BarChart2} label="No active polls" action={()=>openModal('poll')} actionLabel="Create Poll"/>}
          </PB>
        </Panel>
      </div>
    </div>
  );

  const TabAnalytics = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Activity}  ak="blue"   label="Daily Avg (30d)"  value={Math.round(ci30.length/30)} sub="check-ins/day"/>
        <StatCard icon={TrendingUp} ak={monthChangePct>=0?'green':'red'} label="Monthly Change" value={`${monthChangePct>=0?'+':''}${monthChangePct}%`} sub="vs prev 30 days"/>
        <StatCard icon={Users}     ak="purple" label="Visits/Member"    value={uniqueMembers>0?(ci30.length/uniqueMembers).toFixed(1):'—'} sub="per member (30d)"/>
        <StatCard icon={Star}      ak="yellow" label="Return Rate"      value={`${checkIns.length>0?Math.round((checkIns.filter(c=>!c.first_visit).length/checkIns.length)*100):0}%`} sub="of all visits"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PH title="Weekly Check-in Trend" subtitle="Last 12 weeks" ak="blue" icon={Activity}/>
          <PB>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weekTrend}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="label" tick={{fill:'rgba(255,255,255,0.3)',fontSize:10}} axisLine={false} tickLine={false} interval={2}/>
                <YAxis tick={{fill:'rgba(255,255,255,0.3)',fontSize:10}} axisLine={false} tickLine={false} width={24} allowDecimals={false}/>
                <Tooltip content={<DT/>}/>
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#g1)" name="Check-ins"/>
              </AreaChart>
            </ResponsiveContainer>
          </PB>
        </Panel>
        <Panel>
          <PH title="Active Members Growth" subtitle="Last 6 months" ak="green" icon={Users}/>
          <PB>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthGrowth}>
                <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="label" tick={{fill:'rgba(255,255,255,0.3)',fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'rgba(255,255,255,0.3)',fontSize:11}} axisLine={false} tickLine={false} width={24} allowDecimals={false}/>
                <Tooltip content={<DT/>}/>
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#g2)" name="Members"/>
              </AreaChart>
            </ResponsiveContainer>
          </PB>
        </Panel>
        <Panel>
          <PH title="Rewards Redeemed" subtitle="Top 5 most claimed" ak="purple" icon={Gift}/>
          <PB>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart barSize={26} data={rewards.filter(r=>(r.claimed_by?.length||0)>0).sort((a,b)=>(b.claimed_by?.length||0)-(a.claimed_by?.length||0)).slice(0,5).map(r=>({label:r.title.length>12?r.title.slice(0,12)+'…':r.title,value:r.claimed_by?.length||0}))}>
                <defs><linearGradient id="barPurp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/><stop offset="100%" stopColor="#6d28d9" stopOpacity={0.8}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="label" tick={{fill:'rgba(255,255,255,0.3)',fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'rgba(255,255,255,0.3)',fontSize:10}} axisLine={false} tickLine={false} width={24} allowDecimals={false}/>
                <Tooltip content={<DT/>} cursor={{fill:'rgba(139,92,246,0.06)'}}/>
                <Bar dataKey="value" fill="url(#barPurp)" radius={[5,5,0,0]} name="Claims"/>
              </BarChart>
            </ResponsiveContainer>
          </PB>
        </Panel>
        <Panel>
          <PH title="Peak Hours" subtitle="Most popular visit times" ak="orange" icon={Clock}/>
          <PB>
            <div className="space-y-2.5">
              {(() => {
                const acc={}; checkIns.forEach(c=>{const h=new Date(c.check_in_date).getHours();acc[h]=(acc[h]||0)+1;});
                const max=Math.max(...Object.values(acc),1);
                return Object.entries(acc).sort(([,a],[,b])=>b-a).slice(0,8).map(([hour,count],i)=>{
                  const h=parseInt(hour); const label=h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`;
                  return (
                    <div key={hour} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-5 text-right flex-shrink-0" style={{color:'rgba(255,255,255,0.2)'}}>#{i+1}</span>
                      <span className="text-sm text-white w-10 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                        <div className="h-full rounded-full" style={{width:`${(count/max)*100}%`,background:'linear-gradient(90deg,#8b5cf6,#ec4899)'}}/>
                      </div>
                      <span className="text-sm font-bold text-white w-7 text-right flex-shrink-0">{count}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </PB>
        </Panel>
      </div>
    </div>
  );

  const TabGym = () => (
    <div className="space-y-4">
      <Panel>
        <div className="p-4 md:p-5 flex items-start gap-4 border-b" style={{borderColor:'rgba(255,255,255,0.06)'}}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0"><Dumbbell className="w-7 h-7 text-white"/></div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-white mb-1.5">{selectedGym?.name||'—'}</h2>
            <div className="flex flex-wrap items-center gap-2">
              {selectedGym?.type && <Tag color="blue">{selectedGym.type}</Tag>}
              {selectedGym?.verified && <Tag color="green">✓ Verified</Tag>}
              {selectedGym?.city && <span className="text-sm" style={{color:'rgba(255,255,255,0.35)'}}>{selectedGym.city}</span>}
            </div>
          </div>
          <button onClick={()=>openModal('editInfo')} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl flex-shrink-0" style={{background:'rgba(59,130,246,0.14)',color:'#93c5fd',border:'1px solid rgba(59,130,246,0.25)'}}>
            <Pencil className="w-3 h-3"/>Edit
          </button>
        </div>
        <PB>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {[{icon:'💰',l:'Price',v:`£${selectedGym?.price||'—'}/mo`},{icon:'📍',l:'Address',v:selectedGym?.address},{icon:'🏷️',l:'Postcode',v:selectedGym?.postcode}].map((f,i)=>(
              <div key={i} className="p-3 rounded-xl border" style={{background:BG.row,borderColor:'rgba(255,255,255,0.05)'}}>
                <div className="flex items-center gap-1.5 mb-1"><span className="text-xs">{f.icon}</span><p className="text-xs uppercase tracking-wide font-semibold" style={{color:'rgba(255,255,255,0.3)'}}>{f.l}</p></div>
                <p className="text-sm font-semibold text-white truncate">{f.v||'—'}</p>
              </div>
            ))}
          </div>
        </PB>
      </Panel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PH title="Classes" badge={classes.length} action={()=>openModal('classes')} actionLabel="Manage" ak="green" icon={Calendar}/>
          <PB>
            {classes.length>0 ? (
              <div className="space-y-2">
                {classes.slice(0,6).map(cls=>(
                  <div key={cls.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border" style={{background:BG.row,borderColor:'rgba(255,255,255,0.05)'}}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.2)'}}><Calendar className="w-3.5 h-3.5 text-emerald-400"/></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{cls.name}</p><p className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>{cls.schedule||cls.time||'—'}</p></div>
                  </div>
                ))}
                {classes.length>6 && <p className="text-xs text-center pt-1" style={{color:'rgba(255,255,255,0.2)'}}>+{classes.length-6} more</p>}
              </div>
            ) : <Empty icon={Calendar} label="No classes yet" action={()=>openModal('classes')} actionLabel="Add Classes"/>}
          </PB>
        </Panel>
        <Panel>
          <PH title="Coaches" badge={coaches.length} action={()=>openModal('coaches')} actionLabel="Manage" ak="orange" icon={Users}/>
          <PB>
            {coaches.length>0 ? (
              <div className="space-y-2">
                {coaches.slice(0,6).map(coach=>(
                  <div key={coach.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border" style={{background:BG.row,borderColor:'rgba(255,255,255,0.05)'}}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{coach.name?.charAt(0)?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{coach.name}</p><p className="text-xs truncate" style={{color:'rgba(255,255,255,0.3)'}}>{coach.speciality||coach.bio||'Coach'}</p></div>
                  </div>
                ))}
              </div>
            ) : <Empty icon={Target} label="No coaches yet" action={()=>openModal('coaches')} actionLabel="Add Coach"/>}
          </PB>
        </Panel>
        <Panel>
          <PH title="Amenities" badge={selectedGym?.amenities?.length||0} action={()=>openModal('amenities')} actionLabel="Edit" ak="cyan" icon={CheckCircle}/>
          <PB>{selectedGym?.amenities?.length>0 ? <div className="flex flex-wrap gap-1.5">{selectedGym.amenities.map((a,i)=><Tag key={i} color="blue">{a}</Tag>)}</div> : <Empty icon={CheckCircle} label="No amenities listed" action={()=>openModal('amenities')} actionLabel="Add Amenities"/>}</PB>
        </Panel>
        <Panel>
          <PH title="Equipment" badge={selectedGym?.equipment?.length||0} action={()=>openModal('equipment')} actionLabel="Edit" ak="purple" icon={Dumbbell}/>
          <PB>
            {selectedGym?.equipment?.length>0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedGym.equipment.slice(0,16).map((e,i)=><Tag key={i} color="purple">{e}</Tag>)}
                {(selectedGym.equipment.length||0)>16 && <Tag color="blue">+{selectedGym.equipment.length-16} more</Tag>}
              </div>
            ) : <Empty icon={Dumbbell} label="No equipment listed" action={()=>openModal('equipment')} actionLabel="Add Equipment"/>}
          </PB>
        </Panel>
      </div>
      <Panel>
        <PH title="Photo Gallery" badge={selectedGym?.gallery?.length||0} action={()=>openModal('photos')} actionLabel="Manage Photos" ak="blue" icon={ImageIcon}/>
        <PB>
          {selectedGym?.gallery?.length>0 ? (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {selectedGym.gallery.map((url,i)=><img key={i} src={url} alt="" className="w-full h-16 object-cover rounded-xl cursor-pointer opacity-90 hover:opacity-100 transition-opacity" style={{border:'1px solid rgba(255,255,255,0.07)'}}/>)}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3.5 rounded-xl border" style={{background:BG.row,borderColor:'rgba(255,255,255,0.05)'}}>
              <ImageIcon className="w-5 h-5 flex-shrink-0" style={{color:'rgba(255,255,255,0.25)'}}/>
              <p className="text-sm flex-1" style={{color:'rgba(255,255,255,0.4)'}}>Add photos to showcase your gym.</p>
              <button onClick={()=>openModal('photos')} className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0" style={{background:'rgba(59,130,246,0.14)',color:'#93c5fd',border:'1px solid rgba(59,130,246,0.25)'}}>Add Photos</button>
            </div>
          )}
        </PB>
      </Panel>
      <Panel>
        <PH title="Admin" ak="blue" icon={Shield}/>
        <PB>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3">
            {[{l:'Owner Email',v:selectedGym?.owner_email},{l:'Gym ID',v:selectedGym?.id,mono:true},{l:'Status',v:selectedGym?.verified?'✓ Verified':'Not Verified',c:selectedGym?.verified?'#34d399':'#f87171'}].map((f,i)=>(
              <div key={i} className="p-3 rounded-xl border" style={{background:BG.row,borderColor:'rgba(255,255,255,0.05)'}}>
                <p className="text-xs uppercase tracking-wide mb-1 font-semibold" style={{color:'rgba(255,255,255,0.3)'}}>{f.l}</p>
                <p className={`text-sm font-semibold truncate ${f.mono?'font-mono text-xs break-all':''}`} style={{color:f.c||'white'}}>{f.v||'—'}</p>
              </div>
            ))}
          </div>
          <Link to={createPageUrl('GymCommunity')+'?id='+selectedGym?.id}>
            <button className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border" style={{background:BG.row,color:'rgba(255,255,255,0.5)',borderColor:'rgba(255,255,255,0.07)'}}>
              <Eye className="w-4 h-4"/>View Public Gym Page
            </button>
          </Link>
        </PB>
      </Panel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[{title:'Delete Gym',desc:'Permanently delete this gym and all its data.',label:'Delete Gym',fn:()=>openModal('deleteGym')},{title:'Delete Account',desc:'Permanently delete your account and all gyms.',label:'Delete Account',fn:()=>openModal('deleteAccount')}].map((d,i)=>(
          <div key={i} className="p-4 rounded-xl border" style={{background:'rgba(239,68,68,0.05)',borderColor:'rgba(239,68,68,0.18)'}}>
            <div className="flex items-center gap-2 mb-1.5"><Trash2 className="w-4 h-4 text-red-400"/><h4 className="font-bold text-white text-sm">{d.title}</h4></div>
            <p className="text-xs mb-3" style={{color:'rgba(255,255,255,0.35)'}}>{d.desc}</p>
            <button onClick={d.fn} className="w-full py-2 rounded-xl text-sm font-bold" style={{background:'rgba(239,68,68,0.1)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.25)'}}>{d.label}</button>
          </div>
        ))}
      </div>
    </div>
  );

  const TABS = { overview:<TabOverview/>, members:<TabMembers/>, content:<TabContent/>, analytics:<TabAnalytics/>, gym:<TabGym/> };

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const SidebarContent = ({forceExpanded=false}) => {
    const expanded = forceExpanded || !collapsed;
    return (
      <>
        <div className="px-3.5 py-4 border-b flex-shrink-0" style={{borderColor:'rgba(255,255,255,0.06)'}}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0"><Dumbbell className="w-4 h-4 text-white"/></div>
            {expanded && <div className="min-w-0 flex-1"><p className="text-sm font-black text-white truncate leading-tight">{selectedGym?.name||'Dashboard'}</p><p className="text-xs" style={{color:'rgba(255,255,255,0.25)'}}>Gym Owner</p></div>}
          </div>
          {expanded && approvedGyms.length>1 && (
            <div className="mt-3 relative">
              <button onClick={()=>setGymOpen(o=>!o)} className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold border" style={{background:BG.row,color:'rgba(255,255,255,0.5)',borderColor:'rgba(255,255,255,0.07)'}}>
                <span className="truncate">{selectedGym?.name}</span>
                <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${gymOpen?'rotate-180':''}`}/>
              </button>
              {gymOpen && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl z-20 border" style={{background:N[850],borderColor:'rgba(255,255,255,0.08)'}}>
                  {approvedGyms.map(g=>(
                    <button key={g.id} onClick={()=>{setSelectedGym(g);setGymOpen(false);}} className="w-full text-left px-3 py-2.5 text-xs font-semibold transition-all" style={{color:selectedGym?.id===g.id?'#60a5fa':'rgba(255,255,255,0.5)',background:selectedGym?.id===g.id?'rgba(59,130,246,0.1)':'transparent'}}>{g.name}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item=>{
            const active=tab===item.id;
            return (
              <button key={item.id} onClick={()=>goTab(item.id)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{background:active?'rgba(59,130,246,0.12)':'transparent',color:active?'#fff':'rgba(255,255,255,0.35)',border:active?'1px solid rgba(59,130,246,0.2)':'1px solid transparent'}}>
                <item.icon className="w-4 h-4 flex-shrink-0" style={{color:active?'#60a5fa':'inherit'}}/>
                {expanded && <span className="flex-1 text-left">{item.label}</span>}
                {expanded && active && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"/>}
              </button>
            );
          })}
        </nav>
        {expanded && (
          <div className="px-2 pb-2 flex-shrink-0">
            <Link to={createPageUrl('Plus')}>
              <div className="p-3 rounded-xl cursor-pointer border" style={{background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)'}}>
                <div className="flex items-center gap-2 mb-0.5"><Crown className="w-3 h-3 text-purple-400"/><span className="text-xs font-black text-white">Retention Pro</span></div>
                <p className="text-xs" style={{color:'rgba(167,139,250,0.7)'}}>From £49.99/mo</p>
              </div>
            </Link>
          </div>
        )}
        <div className="px-2 pb-3 pt-2 border-t space-y-0.5 flex-shrink-0" style={{borderColor:'rgba(255,255,255,0.06)'}}>
          <Link to={createPageUrl('GymCommunity')+'?id='+selectedGym?.id} className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-semibold hover:text-white transition-all" style={{color:'rgba(255,255,255,0.3)'}}>
            <Eye className="w-4 h-4 flex-shrink-0"/>{expanded&&'View Gym Page'}
          </Link>
          <Link to={createPageUrl('Home')} className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-semibold hover:text-white transition-all" style={{color:'rgba(255,255,255,0.3)'}}>
            <Users className="w-4 h-4 flex-shrink-0"/>{expanded&&'Member View'}
          </Link>
          <button onClick={()=>base44.auth.logout()} className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-semibold" style={{color:'#f87171'}}>
            <LogOut className="w-4 h-4 flex-shrink-0"/>{expanded&&'Log Out'}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{background: BG.page, fontFamily:"'DM Sans','Inter',sans-serif"}}>
      {sidebarOpen && <div className="fixed inset-0 z-40 md:hidden" style={{background:'rgba(5,8,20,0.85)',backdropFilter:'blur(4px)'}} onClick={()=>setSidebarOpen(false)}/>}

      {/* Mobile sidebar */}
      <div className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 md:hidden ${sidebarOpen?'translate-x-0':'-translate-x-full'}`}
        style={{width:240,background:BG.sidebar,borderRight:'1px solid rgba(255,255,255,0.06)'}}>
        <SidebarContent forceExpanded={true}/>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col h-full flex-shrink-0 transition-all duration-300 overflow-hidden"
        style={{width:collapsed?56:216,background:BG.sidebar,borderRight:'1px solid rgba(255,255,255,0.06)'}}>
        <SidebarContent/>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-5 py-3 flex-shrink-0 border-b"
          style={{background:BG.header,borderColor:'rgba(255,255,255,0.06)'}}>
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={()=>setSidebarOpen(o=>!o)} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 md:hidden border" style={{background:BG.row,color:'rgba(255,255,255,0.4)',borderColor:'rgba(255,255,255,0.07)'}}><Menu className="w-4 h-4"/></button>
            <button onClick={()=>setCollapsed(o=>!o)} className="w-8 h-8 rounded-lg items-center justify-center flex-shrink-0 hidden md:flex border" style={{background:BG.row,color:'rgba(255,255,255,0.4)',borderColor:'rgba(255,255,255,0.07)'}}><Menu className="w-4 h-4"/></button>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-black text-white leading-tight truncate">{NAV.find(n=>n.id===tab)?.label}</h1>
              <p className="text-xs hidden sm:block" style={{color:'rgba(255,255,255,0.25)'}}>{format(now,'EEE, d MMM yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {atRisk>0 && <button onClick={()=>goTab('members')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border" style={{background:'rgba(251,146,60,0.1)',color:'#fb923c',borderColor:'rgba(249,115,22,0.22)'}}><AlertTriangle className="w-3.5 h-3.5"/><span className="hidden sm:inline">{atRisk} at risk</span></button>}
            <button onClick={()=>openModal('post')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border" style={{background:'rgba(59,130,246,0.12)',color:'#93c5fd',borderColor:'rgba(59,130,246,0.22)'}}><Pencil className="w-3.5 h-3.5"/><span className="hidden sm:inline">New Post</span></button>
            <button onClick={()=>openModal('qrScanner')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border" style={{background:'rgba(16,185,129,0.1)',color:'#34d399',borderColor:'rgba(16,185,129,0.22)'}}><QrCode className="w-3.5 h-3.5"/><span className="hidden sm:inline">Scan QR</span></button>
            {selectedGym?.join_code
              ? <button onClick={()=>openModal('qrCode')} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-widest border" style={{background:BG.row,color:'rgba(255,255,255,0.5)',borderColor:'rgba(255,255,255,0.07)'}}>{selectedGym.join_code}</button>
              : <button onClick={async()=>{try{const r=await base44.functions.invoke('generateGymJoinCode',{gym_id:selectedGym.id});if(r.data?.success)invGyms();}catch{}}} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border" style={{background:'rgba(16,185,129,0.1)',color:'#34d399',borderColor:'rgba(16,185,129,0.22)'}}><Plus className="w-3.5 h-3.5"/>Generate Code</button>
            }
            {selectedGym?.verified && <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border" style={{background:'rgba(59,130,246,0.1)',color:'#93c5fd',borderColor:'rgba(59,130,246,0.2)'}}><Shield className="w-3 h-3"/>Verified</div>}
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-3 md:px-5 py-4 pb-24 md:pb-5" style={{background: BG.main}}>
          <div className="max-w-[1400px] mx-auto">{TABS[tab]||TABS.overview}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden border-t" style={{background:BG.sidebar,borderColor:'rgba(255,255,255,0.07)',paddingBottom:'env(safe-area-inset-bottom)'}}>
        {NAV.map(item=>{
          const active=tab===item.id;
          return (
            <button key={item.id} onClick={()=>goTab(item.id)} className="relative flex-1 flex flex-col items-center justify-center py-2.5 gap-1" style={{color:active?'#60a5fa':'rgba(255,255,255,0.25)'}}>
              <item.icon className="w-5 h-5"/>
              <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
              {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-blue-400"/>}
            </button>
          );
        })}
      </nav>

      <ManageRewardsModal open={modal==='rewards'} onClose={closeModal} rewards={rewards} onCreateReward={d=>createRewardM.mutate(d)} onDeleteReward={id=>deleteRewardM.mutate(id)} gym={selectedGym} isLoading={createRewardM.isPending}/>
      <ManageClassesModal open={modal==='classes'} onClose={closeModal} classes={classes} onCreateClass={d=>createClassM.mutate(d)} onUpdateClass={(id,data)=>updateClassM.mutate({id,data})} onDeleteClass={id=>deleteClassM.mutate(id)} gym={selectedGym} isLoading={createClassM.isPending||updateClassM.isPending}/>
      <ManageCoachesModal open={modal==='coaches'} onClose={closeModal} coaches={coaches} onCreateCoach={d=>createCoachM.mutate(d)} onDeleteCoach={id=>deleteCoachM.mutate(id)} gym={selectedGym} isLoading={createCoachM.isPending}/>
      <ManageGymPhotosModal open={modal==='photos'} onClose={closeModal} gallery={selectedGym?.gallery||[]} onSave={g=>updateGalleryM.mutate(g)} isLoading={updateGalleryM.isPending}/>
      <ManageMembersModal open={modal==='members'} onClose={closeModal} gym={selectedGym} onBanMember={id=>banMemberM.mutate(id)} onUnbanMember={id=>unbanMemberM.mutate(id)}/>
      <CreateGymOwnerPostModal open={modal==='post'} onClose={closeModal} gym={selectedGym} onSuccess={()=>inv('posts')}/>
      <CreateEventModal open={modal==='event'} onClose={closeModal} onSave={d=>createEventM.mutate(d)} gym={selectedGym} isLoading={createEventM.isPending}/>
      <CreateChallengeModal open={modal==='challenge'} onClose={closeModal} gyms={gyms} onSave={d=>createChallengeM.mutate(d)} isLoading={createChallengeM.isPending}/>
      <QRScanner open={modal==='qrScanner'} onClose={closeModal}/>
      <ManageEquipmentModal open={modal==='equipment'} onClose={closeModal} equipment={selectedGym?.equipment||[]} onSave={e=>updateGymM.mutate({equipment:e})} isLoading={updateGymM.isPending}/>
      <ManageAmenitiesModal open={modal==='amenities'} onClose={closeModal} amenities={selectedGym?.amenities||[]} onSave={a=>updateGymM.mutate({amenities:a})} isLoading={updateGymM.isPending}/>
      <EditBasicInfoModal open={modal==='editInfo'} onClose={closeModal} gym={selectedGym} onSave={d=>updateGymM.mutate(d)} isLoading={updateGymM.isPending}/>
      <CreatePollModal open={modal==='poll'} onClose={closeModal} onSave={d=>createPollM.mutate(d)} isLoading={createPollM.isPending}/>

      <AlertDialog open={modal==='deleteGym'} onOpenChange={v=>!v&&closeModal()}>
        <AlertDialogContent style={{background:N[850],borderColor:'rgba(239,68,68,0.25)'}} className="max-w-md mx-4">
          <AlertDialogHeader><AlertDialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400"/>Delete Gym?</AlertDialogTitle><AlertDialogDescription className="text-sm" style={{color:'rgba(255,255,255,0.45)'}}>Deletes <span className="font-bold text-white">{selectedGym?.name}</span> and all data. <span className="text-red-400 font-semibold">Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel style={{background:N[800],color:'rgba(255,255,255,0.5)',borderColor:'rgba(255,255,255,0.08)'}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteGymM.mutate()} disabled={deleteGymM.isPending} className="bg-red-600 hover:bg-red-700 text-white">{deleteGymM.isPending?'Deleting…':'Delete Permanently'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={modal==='deleteAccount'} onOpenChange={v=>!v&&closeModal()}>
        <AlertDialogContent style={{background:N[850],borderColor:'rgba(239,68,68,0.25)'}} className="max-w-md mx-4">
          <AlertDialogHeader><AlertDialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400"/>Delete Account?</AlertDialogTitle><AlertDialogDescription className="text-sm" style={{color:'rgba(255,255,255,0.45)'}}>Deletes your account and all gyms. <span className="text-red-400 font-semibold">Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel style={{background:N[800],color:'rgba(255,255,255,0.5)',borderColor:'rgba(255,255,255,0.08)'}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteAccountM.mutate()} disabled={deleteAccountM.isPending} className="bg-red-700 hover:bg-red-800 text-white">{deleteAccountM.isPending?'Deleting…':'Delete Account'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {modal==='qrCode' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{background:'rgba(5,8,20,0.92)',backdropFilter:'blur(8px)'}}>
          <div className="rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border" style={{background:N[850],borderColor:'rgba(255,255,255,0.08)'}}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-white">Gym Join QR</h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{background:BG.row,color:'rgba(255,255,255,0.4)',borderColor:'rgba(255,255,255,0.07)'}}><X className="w-4 h-4"/></button>
            </div>
            <div id="qr-fullscreen" className="flex justify-center p-5 rounded-2xl bg-white mb-4">
              <QRCode value={`${window.location.origin}${createPageUrl('Gyms')}?joinCode=${selectedGym?.join_code}`} size={220} level="H"/>
            </div>
            <p className="text-center text-sm mb-4" style={{color:'rgba(255,255,255,0.4)'}}>Join code: <span className="font-black text-white tracking-widest">{selectedGym?.join_code}</span></p>
            <div className="space-y-2">
              <button onClick={()=>dlQR('qr-fullscreen')} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white" style={{background:'linear-gradient(135deg,#10b981,#0d9488)'}}><Download className="w-4 h-4"/>Download QR Code</button>
              <button onClick={closeModal} className="w-full py-3 rounded-xl font-semibold text-sm border" style={{background:BG.row,color:'rgba(255,255,255,0.5)',borderColor:'rgba(255,255,255,0.07)'}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
