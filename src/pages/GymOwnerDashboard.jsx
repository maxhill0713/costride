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
  DollarSign, UserPlus, ChevronRight, Megaphone, Pin,
  MapPin as MapPin2, Tag as Tag2, Send, Bell, BellRing, Sparkles, Check
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
const BG = {
  page:    'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)',
  sidebar: 'linear-gradient(180deg, #0a1a4a 0%, #060d2e 100%)',
  header:  'linear-gradient(90deg, #0a1a4a 0%, #060d2e 100%)',
  subcard: 'rgba(13,35,96,0.25)',
};
const BORDER = {
  subtle: 'rgba(255,255,255,0.06)',
  panel:  'rgba(59,130,246,0.14)',
  active: 'rgba(59,130,246,0.3)',
};

const NAV = [
  { id: 'overview',    label: 'Overview',    icon: LayoutDashboard },
  { id: 'members',     label: 'Members',     icon: Users },
  { id: 'content',     label: 'Content',     icon: FileText },
  { id: 'analytics',   label: 'Analytics',   icon: BarChart3 },
  { id: 'gym',         label: 'Gym Settings',icon: Settings },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon:Icon, iconColor, iconRgb='59,130,246', label, value, sub, trend }) => {
  const [hov,setHov]=React.useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:'relative',overflow:'hidden',borderRadius:20,background:'linear-gradient(145deg,#0d1e35 0%,#060d1f 100%)',border:`1px solid ${hov?`rgba(${iconRgb},0.25)`:'rgba(255,255,255,0.07)'}`,boxShadow:hov?`0 12px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(${iconRgb},0.12)`:'0 8px 32px rgba(0,0,0,0.45)',transition:'border-color 0.2s,box-shadow 0.2s,transform 0.2s',transform:hov?'translateY(-2px)':'translateY(0)'}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',borderRadius:20}}>
        <div style={{position:'absolute',top:-40,left:-30,width:180,height:180,borderRadius:'50%',background:`radial-gradient(circle,rgba(${iconRgb},0.14) 0%,transparent 70%)`}}/>
        <div style={{position:'absolute',bottom:-50,right:-30,width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.06) 0%,transparent 70%)'}}/>
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'22px 22px'}}/>
      </div>
      <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:`linear-gradient(90deg,transparent,rgba(${iconRgb},0.45),transparent)`,pointerEvents:'none'}}/>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:`linear-gradient(180deg,rgba(${iconRgb},0.75) 0%,transparent 100%)`}}/>
      <div style={{position:'relative',padding:'20px 20px 18px 22px'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
          <div style={{width:42,height:42,borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',background:`rgba(${iconRgb},0.14)`,border:`1px solid rgba(${iconRgb},0.25)`,boxShadow:'0 4px 12px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.08)',flexShrink:0}}>
            <Icon style={{width:19,height:19,color:iconColor}}/>
          </div>
          {trend!==undefined&&(
            <span style={{display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:800,padding:'4px 9px',borderRadius:99,background:trend>=0?'rgba(16,185,129,0.12)':'rgba(248,113,113,0.12)',color:trend>=0?'#34d399':'#f87171',border:`1px solid ${trend>=0?'rgba(16,185,129,0.25)':'rgba(248,113,113,0.25)'}`}}>
              {trend>=0?<TrendingUp style={{width:10,height:10}}/>:<TrendingDown style={{width:10,height:10}}/>}{Math.abs(trend)}%
            </span>
          )}
        </div>
        <div style={{fontSize:32,fontWeight:900,color:'#fff',letterSpacing:'-0.04em',lineHeight:1,marginBottom:6}}>{value}</div>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(148,163,184,0.6)',marginBottom:4}}>{label}</div>
        {sub&&<div style={{fontSize:11,color:'rgba(100,130,170,0.7)',fontWeight:500}}>{sub}</div>}
      </div>
    </div>
  );
};

// ─── Panel ────────────────────────────────────────────────────────────────────
const Panel = ({ children, className='' }) => (
  <div className={`relative overflow-hidden rounded-2xl ${className}`}
    style={{background:'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',border:'1px solid rgba(255,255,255,0.07)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',boxShadow:'0 4px 24px rgba(0,0,0,0.4)'}}>
    <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{background:'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.1) 50%,transparent 90%)'}}/>
    <div className="relative p-5">{children}</div>
  </div>
);

// ─── Panel Header ─────────────────────────────────────────────────────────────
const PH = ({ title, subtitle, action, actionLabel, badge }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {subtitle&&<p className="text-xs mt-0.5" style={{color:'#4a6492'}}>{subtitle}</p>}
    </div>
    <div className="flex items-center gap-2">
      {badge!==undefined&&<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:BG.subcard,color:'#94a3b8',border:`1px solid ${BORDER.subtle}`}}>{badge}</span>}
      {action&&(
        <button onClick={action} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:brightness-125"
          style={{background:BG.subcard,color:'#93c5fd',border:`1px solid ${BORDER.subtle}`}}>
          <Plus className="w-3.5 h-3.5"/>{actionLabel||'Add'}
        </button>
      )}
    </div>
  </div>
);

const DT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-2xl text-xs" style={{ background: '#02040a', border: `1px solid ${BORDER.active}` }}>
      <p className="mb-1" style={{ color: '#6b87b8' }}>{label}</p>
      {payload.map((p, i) => <p key={i} className="font-bold" style={{ color: p.color }}>{p.value} {p.name}</p>)}
    </div>
  );
};

// ─── Tag ─────────────────────────────────────────────────────────────────────
const Tag = ({ children, color='blue' }) => {
  const m={
    blue:  ['rgba(59,130,246,0.13)','#93c5fd','rgba(59,130,246,0.28)'],
    green: ['rgba(16,185,129,0.13)','#6ee7b7','rgba(16,185,129,0.28)'],
    orange:['rgba(249,115,22,0.13)','#fdba74','rgba(249,115,22,0.28)'],
    red:   ['rgba(239,68,68,0.13)', '#fca5a5','rgba(239,68,68,0.28)'],
    purple:['rgba(139,92,246,0.13)','#c4b5fd','rgba(139,92,246,0.28)'],
  };
  const [bg,text,border]=m[color]||m.blue;
  return (
    <span style={{display:'inline-flex',alignItems:'center',fontSize:11,fontWeight:800,padding:'3px 9px',borderRadius:99,background:bg,color:text,border:`1px solid ${border}`,letterSpacing:'0.01em'}}>{children}</span>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const Empty = ({ icon:Icon, label }) => (
  <div className="py-10 text-center">
    <div className="relative w-14 h-14 mx-auto mb-3">
      <div style={{position:'absolute',inset:-4,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%)'}}/>
      <div className="w-full h-full rounded-full flex items-center justify-center relative" style={{background:'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(8,14,36,0.8))',border:'1px solid rgba(59,130,246,0.18)',boxShadow:'0 0 20px rgba(59,130,246,0.08)'}}>
        <Icon style={{width:20,height:20,color:'rgba(59,130,246,0.45)'}}/>
      </div>
    </div>
    <p className="text-xs font-medium" style={{color:'rgba(75,107,168,0.7)'}}>{label}</p>
  </div>
);
// ─── Alert Card ───────────────────────────────────────────────────────────────
const AlertCard = ({ icon:Icon, iconColor, iconRgb, title, message, action, actionLabel }) => (
  <div style={{padding:'14px 16px',borderRadius:14,background:`rgba(${iconRgb},0.07)`,border:`1px solid rgba(${iconRgb},0.2)`,position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:`linear-gradient(180deg,rgba(${iconRgb},0.7),transparent)`}}/>
    <div className="flex gap-3" style={{paddingLeft:4}}>
      <div style={{width:32,height:32,borderRadius:10,background:`rgba(${iconRgb},0.14)`,border:`1px solid rgba(${iconRgb},0.25)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <Icon style={{width:15,height:15,color:iconColor}}/>
      </div>
      <div className="flex-1">
        <p style={{fontSize:13,fontWeight:800,color:'#fff',margin:'0 0 3px'}}>{title}</p>
        <p style={{fontSize:11,color:'rgba(107,135,184,0.75)',margin:0,lineHeight:1.4}}>{message}</p>
        {action&&<button onClick={action} style={{marginTop:8,fontSize:11,fontWeight:800,color:iconColor,background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center',gap:4}}>{actionLabel} <ChevronRight style={{width:11,height:11}}/></button>}
      </div>
    </div>
  </div>
);
// ─── Action Button ────────────────────────────────────────────────────────────
const ActionBtn = ({ icon:Icon, label, sub, color, rgb, floor, onClick }) => {
  const [pressed,setPressed]=React.useState(false);
  return (
    <button onClick={onClick}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)}
      onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:10,padding:'16px 16px 14px',borderRadius:16,background:`linear-gradient(145deg,rgba(${rgb},0.14),rgba(${rgb},0.07))`,border:`1px solid rgba(${rgb},0.3)`,borderBottom:pressed?`1px solid rgba(${rgb},0.15)`:`4px solid ${floor}`,boxShadow:pressed?'0 1px 4px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.05)':`0 6px 20px rgba(0,0,0,0.3),0 0 0 1px rgba(${rgb},0.08),inset 0 1px 0 rgba(255,255,255,0.08)`,transform:pressed?'translateY(3px) scale(0.99)':'translateY(0) scale(1)',transition:'transform 0.1s,box-shadow 0.1s,border-bottom 0.1s',cursor:'pointer',width:'100%',textAlign:'left',position:'relative',overflow:'hidden'}}>
      <div style={{width:38,height:38,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',background:`rgba(${rgb},0.18)`,border:`1px solid rgba(${rgb},0.3)`,boxShadow:`0 4px 12px rgba(0,0,0,0.2),0 0 8px rgba(${rgb},0.15)`}}>
        <Icon style={{width:18,height:18,color}}/>
      </div>
      <div>
        <div style={{fontSize:13,fontWeight:900,color:'#fff',letterSpacing:'-0.01em',marginBottom:2}}>{label}</div>
        {sub&&<div style={{fontSize:10,fontWeight:600,color:`rgba(${rgb},0.7)`}}>{sub}</div>}
      </div>
      <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:`linear-gradient(90deg,transparent,rgba(${rgb},0.4),transparent)`,pointerEvents:'none'}}/>
    </button>
  );
};

// ── Root ──────────────────────────────────────────────────────────────────────
export default function GymOwnerDashboard() {
  const [tab, setTab]             = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const [gymOpen, setGymOpen]     = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [chartRange, setChartRange] = useState(7);
  const [notifMsg, setNotifMsg]           = useState('');
  const [notifTarget, setNotifTarget]     = useState('atRisk');
  const [notifSending, setNotifSending]   = useState(false);
  const [notifSent, setNotifSent]         = useState(null); // { count, target }
  const [notifTemplate, setNotifTemplate] = useState(null);
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

  // ── Push notifications ───────────────────────────────────────────────────
  const NOTIF_TEMPLATES = [
    { label: 'We miss you! 💪',   body: `Hey! We haven't seen you at ${selectedGym?.name||'the gym'} in a while. Come back and keep your streak going — your goals are waiting!` },
    { label: 'Special offer 🎁',  body: `Great news from ${selectedGym?.name||'us'}! Come in this week and show this message at the desk for a free smoothie/guest pass. We want to see you back!` },
    { label: 'New class alert 📣', body: `A new class has been added at ${selectedGym?.name||'the gym'}! Check the schedule and book your spot — limited spaces available.` },
    { label: 'Challenge starts 🏆',body: `A new fitness challenge is kicking off at ${selectedGym?.name||'the gym'}! Join now, compete with fellow members and win rewards. Don't miss out!` },
    { label: 'Check-in nudge 🔔',  body: `Just a friendly nudge from ${selectedGym?.name||'your gym'} — it's been a while! Pop in this week, even for 20 minutes. Your body will thank you.` },
  ];

  const sendNotification = async () => {
    if (!notifMsg.trim() || notifSending) return;
    setNotifSending(true);
    try {
      const targetMembers = notifTarget === 'atRisk'
        ? allMemberships.filter(m => { const last = memberLastCheckIn[m.user_id]; return !last || Math.floor((now - new Date(last)) / 86400000) >= 14; })
        : allMemberships;
      const memberIds = targetMembers.map(m => m.user_id);
      await base44.functions.invoke('sendPushNotification', {
        gym_id: selectedGym.id,
        gym_name: selectedGym.name,
        target: notifTarget,
        message: notifMsg.trim(),
        member_ids: memberIds,
      });
      setNotifSent({ count: memberIds.length, target: notifTarget });
      setNotifMsg('');
      setNotifTemplate(null);
      setTimeout(() => setNotifSent(null), 5000);
    } catch(e) {
      console.error('Notification send failed:', e);
    }
    setNotifSending(false);
  };

  // ── Splash screens ────────────────────────────────────────────────────────
  const Splash = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BG.page }}>
      <Panel className="max-w-md w-full text-center">{children}</Panel>
    </div>
  );
  if (gymsError)
    return <Splash><div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-5"><X className="w-7 h-7 text-red-400"/></div><h2 className="text-xl font-black text-white mb-2">Error</h2><p className="text-sm mb-6" style={{color:'#6b87b8'}}>{gymsError.message}</p><Button onClick={()=>window.location.reload()} className="bg-blue-600 hover:bg-blue-500 text-white">Retry</Button></Splash>;
  if (approvedGyms.length===0 && pendingGyms.length>0)
    return <Splash><div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center mx-auto mb-5"><Clock className="w-7 h-7 text-yellow-400"/></div><h2 className="text-xl font-black text-white mb-2">Pending Approval</h2><p className="text-sm mb-6" style={{color:'#6b87b8'}}>Your gym <span className="text-yellow-400 font-bold">{pendingGyms[0].name}</span> is under review.</p><Link to={createPageUrl('Home')}><Button style={{background:'rgba(13,35,96,0.6)',color:'#93b4e8'}}>Back to Home</Button></Link></Splash>;
  if (myGyms.length===0)
    return <Splash><div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mx-auto mb-5"><Dumbbell className="w-7 h-7 text-blue-400"/></div><h2 className="text-xl font-black text-white mb-2">No Gyms</h2><p className="text-sm mb-6" style={{color:'#6b87b8'}}>Register your gym to get started.</p><Link to={createPageUrl('GymSignup')}><Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">Register Your Gym</Button></Link></Splash>;

  // ── Computed stats ────────────────────────────────────────────────────────
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
  const memberLastCheckIn = {};
  checkIns.forEach(c => { if (!memberLastCheckIn[c.user_id] || new Date(c.check_in_date) > new Date(memberLastCheckIn[c.user_id])) memberLastCheckIn[c.user_id] = c.check_in_date; });
  const atRisk           = allMemberships.filter(m => { const last = memberLastCheckIn[m.user_id]; if (!last) return true; const d = Math.floor((now - new Date(last)) / 86400000); return d >= 14; }).length;
  const monthChangePct   = ciPrev30.length > 0 ? Math.round(((ci30.length-ciPrev30.length)/ciPrev30.length)*100) : 0;
  const newSignUps       = allMemberships.filter(m => isWithinInterval(new Date(m.join_date || m.created_date || now), { start: subDays(now,30), end: now })).length;
  const newSignUpsPrev   = allMemberships.filter(m => isWithinInterval(new Date(m.join_date || m.created_date || now), { start: subDays(now,60), end: subDays(now,30) })).length;
  const newSignUpsPct    = newSignUpsPrev > 0 ? Math.round(((newSignUps - newSignUpsPrev) / newSignUpsPrev) * 100) : 0;
  const membershipPrice  = parseFloat(selectedGym?.price) || 0;
  const estimatedRevenue = membershipPrice > 0 ? (allMemberships.length * membershipPrice).toFixed(0) : null;
  const revenueDisplay   = estimatedRevenue ? `£${Number(estimatedRevenue).toLocaleString()}` : '—';
  const savedAnnouncements = selectedGym?.announcements || [];

  const saveAnnouncement = async () => {
    if (!announcement.trim() || announcementSaving) return;
    setAnnouncementSaving(true);
    const updated = [{ text: announcement.trim(), date: new Date().toISOString() }, ...savedAnnouncements].slice(0, 10);
    await base44.entities.Gym.update(selectedGym.id, { announcements: updated });
    invGyms(); setAnnouncement(''); setAnnouncementSaving(false);
  };
  const deleteAnnouncement = async (idx) => {
    const updated = savedAnnouncements.filter((_, i) => i !== idx);
    await base44.entities.Gym.update(selectedGym.id, { announcements: updated });
    invGyms();
  };

  const ciByDay    = Array.from({length:7},(_,i)=>{const d=subDays(now,6-i);return{day:format(d,'EEE'),value:checkIns.filter(c=>startOfDay(new Date(c.check_in_date)).getTime()===startOfDay(d).getTime()).length};});
  const weekTrend  = Array.from({length:12},(_,i)=>{const s=subDays(now,(11-i)*7),e=subDays(now,(10-i)*7);return{label:format(s,'MMM d'),value:checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).length};});
  const monthGrowth= Array.from({length:6},(_,i)=>{const e=subDays(now,i*30),s=subDays(e,30);return{label:format(e,'MMM'),value:new Set(checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).map(c=>c.user_id)).size};}).reverse();

  const dlQR = (id) => {
    const svg = document.getElementById(id)?.querySelector('svg'); if(!svg) return;
    const d = new XMLSerializer().serializeToString(svg);
    const canvas=document.createElement('canvas'); const ctx=canvas.getContext('2d'); const img=new Image();
    img.onload=()=>{canvas.width=img.width;canvas.height=img.height;ctx.drawImage(img,0,0);const a=document.createElement('a');a.download=`${selectedGym?.name}-QR.png`;a.href=canvas.toDataURL('image/png');a.click();};
    img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(d)));
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: OVERVIEW
  // ══════════════════════════════════════════════════════════════════════════
  const TabOverview = () => {
    // Chart data based on selected range
    const chartDays = React.useMemo(() => {
      if (chartRange === 7) return ciByDay;
      return Array.from({length: chartRange}, (_, i) => {
        const d = subDays(now, chartRange - 1 - i);
        return { day: format(d, chartRange <= 14 ? 'EEE' : 'MMM d'), value: checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(d).getTime()).length };
      });
    }, [chartRange, checkIns]);

    // Activity heatmap — 10 weeks × 7 days
    const heatRows = React.useMemo(() => Array.from({length:10}, (_, w) =>
      Array.from({length:7}, (_, d) => {
        const date = subDays(now, (9-w)*7 + (6-d));
        return { date, count: checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(date).getTime()).length };
      })
    ), [checkIns]);
    const maxH = Math.max(...heatRows.flat().map(c => c.count), 1);

    // Engagement counts
    const highlyActive     = monthCiPer.filter(v => v >= 12).length;
    const moderatelyActive = monthCiPer.filter(v => v >= 4 && v < 12).length;
    const inactiveMembers  = allMemberships.filter(m => { const l = memberLastCheckIn[m.user_id]; return !l || Math.floor((now - new Date(l)) / 86400000) >= 30; }).length;

    // Top members — most recently joined
    const topMems = [...allMemberships].sort((a,b) => new Date(b.join_date||b.created_date||0) - new Date(a.join_date||a.created_date||0)).slice(0,5);

    // Insights
    const hourAcc = {};
    checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); hourAcc[h] = (hourAcc[h]||0)+1; });
    const peakEntry = Object.entries(hourAcc).sort(([,a],[,b])=>b-a)[0];
    const peakLabel = peakEntry ? (() => { const h = parseInt(peakEntry[0]); return h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`; })() : null;
    const insightsList = [
      atRisk > 0 && { icon:AlertTriangle, color:'#fbbf24', rgb:'251,191,36', title:'Retention Warning', message:`${atRisk} member${atRisk>1?'s':''} inactive for 14+ days`, action:()=>setTab('members'), actionLabel:'Send a check-in message' },
      peakLabel   && { icon:Zap,          color:'#60a5fa', rgb:'96,165,250',  title:'Peak attendance',  message:`Busiest time: ${peakLabel} — schedule classes here` },
      !challenges.some(c=>c.status==='active') && { icon:Trophy, color:'#fb923c', rgb:'251,146,60', title:'Boost engagement', message:'Launch a challenge to increase visits', action:()=>openModal('challenge'), actionLabel:'Create a challenge' },
      monthChangePct >= 5 && { icon:TrendingUp, color:'#34d399', rgb:'52,211,153', title:'Strong growth', message:`Check-ins up ${monthChangePct}% this month` },
    ].filter(Boolean).slice(0,3);

    return (
      <>
      {/* ═══════════════════════════════ MOBILE LAYOUT ═══════════════════════════════ */}
      <div className="md:hidden space-y-3 pb-2">

        {/* Hero: Today's Check-ins */}
        <div style={{borderRadius:22,background:'linear-gradient(145deg,rgba(14,42,100,0.95),rgba(4,8,24,0.98))',border:'1px solid rgba(59,130,246,0.28)',padding:'24px 20px 20px',position:'relative',overflow:'hidden',boxShadow:'0 12px 40px rgba(0,0,0,0.6)'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(96,165,250,0.5),transparent)'}}/>
          <div style={{position:'absolute',top:-60,right:-40,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.13) 0%,transparent 70%)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:-40,left:-20,width:150,height:150,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
          <div className="flex items-start justify-between">
            <div>
              <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(96,165,250,0.65)',marginBottom:10}}>Today's Check-ins</p>
              <p style={{fontSize:72,fontWeight:900,color:'#fff',letterSpacing:'-0.05em',lineHeight:1,marginBottom:8}}>{todayCI}</p>
              <p style={{fontSize:12,color:'rgba(107,135,184,0.6)'}}>members visited today</p>
            </div>
            <div style={{width:48,height:48,borderRadius:15,background:'rgba(59,130,246,0.15)',border:'1px solid rgba(59,130,246,0.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 12px rgba(0,0,0,0.3)'}}>
              <Dumbbell style={{width:22,height:22,color:'#60a5fa'}}/>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4" style={{borderTop:'1px solid rgba(59,130,246,0.12)'}}>
            <div style={{flex:1}}>
              <p style={{fontSize:10,color:'rgba(107,135,184,0.5)',marginBottom:2}}>Active this week</p>
              <p style={{fontSize:18,fontWeight:900,color:'#34d399',letterSpacing:'-0.03em'}}>{activeThisWeek}<span style={{fontSize:12,color:'rgba(107,135,184,0.45)',fontWeight:600}}>/{totalMembers}</span></p>
            </div>
            <div style={{width:1,height:36,background:'rgba(59,130,246,0.15)'}}/>
            <div style={{flex:1}}>
              <p style={{fontSize:10,color:'rgba(107,135,184,0.5)',marginBottom:2}}>Engagement</p>
              <p style={{fontSize:18,fontWeight:900,color:'#a78bfa',letterSpacing:'-0.03em'}}>{retentionRate}%</p>
            </div>
            <div style={{width:1,height:36,background:'rgba(59,130,246,0.15)'}}/>
            <div style={{flex:1}}>
              <p style={{fontSize:10,color:'rgba(107,135,184,0.5)',marginBottom:2}}>At risk</p>
              <p style={{fontSize:18,fontWeight:900,color:atRisk>0?'#fb923c':'#34d399',letterSpacing:'-0.03em'}}>{atRisk}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)',marginBottom:8,paddingLeft:2}}>Quick Actions</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {icon:UserPlus,          label:'Add Member',    sub:'Manage members', color:'#60a5fa',rgb:'96,165,250',  floor:'rgba(14,40,120,0.8)', onClick:()=>openModal('members')},
              {icon:QrCode,            label:'Scan Check-In', sub:'QR scanner',     color:'#34d399',rgb:'52,211,153',  floor:'rgba(4,60,40,0.8)',   onClick:()=>openModal('qrScanner')},
              {icon:Trophy,            label:'Challenge',     sub:'Create one',     color:'#fb923c',rgb:'251,146,60',  floor:'rgba(80,20,4,0.8)',   onClick:()=>openModal('challenge')},
              {icon:MessageSquarePlus, label:'Post Update',   sub:'Share news',     color:'#a78bfa',rgb:'167,139,250', floor:'rgba(40,10,90,0.8)', onClick:()=>openModal('post')},
            ].map(({icon:Icon,label,sub,color,rgb,floor,onClick},i)=>(
              <button key={i} onClick={onClick} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 14px',borderRadius:16,background:`linear-gradient(145deg,rgba(${rgb},0.12),rgba(${rgb},0.05))`,border:`1px solid rgba(${rgb},0.28)`,borderBottom:`3px solid ${floor}`,cursor:'pointer',width:'100%',textAlign:'left',position:'relative',overflow:'hidden',transition:'transform 0.1s',WebkitTapHighlightColor:'transparent'}}
                onTouchStart={e=>e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}>
                <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:`linear-gradient(90deg,transparent,rgba(${rgb},0.4),transparent)`}}/>
                <div style={{width:36,height:36,borderRadius:11,background:`rgba(${rgb},0.18)`,border:`1px solid rgba(${rgb},0.3)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Icon style={{width:17,height:17,color}}/>
                </div>
                <div>
                  <p style={{fontSize:13,fontWeight:900,color:'#fff',letterSpacing:'-0.01em',marginBottom:1}}>{label}</p>
                  <p style={{fontSize:10,color:`rgba(${rgb},0.65)`,fontWeight:600}}>{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {(atRisk > 0 || !challenges.some(c=>c.status==='active')) && (
          <div>
            <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)',marginBottom:8,paddingLeft:2}}>Alerts</p>
            <div className="space-y-2">
              {atRisk>0&&<AlertCard icon={AlertTriangle} iconColor="#fb923c" iconRgb="249,115,22" title={`${atRisk} members at risk`} message="No check-in for 14+ days" action={()=>setTab('members')} actionLabel="View Members"/>}
              {!challenges.some(c=>c.status==='active')&&<AlertCard icon={Trophy} iconColor="#60a5fa" iconRgb="96,165,250" title="No active challenges" message="Challenges boost retention" action={()=>openModal('challenge')} actionLabel="Create one"/>}
              {polls.length===0&&<AlertCard icon={BarChart2} iconColor="#a78bfa" iconRgb="167,139,250" title="No active polls" message="Engage members with a poll" action={()=>openModal('poll')} actionLabel="Create one"/>}
            </div>
          </div>
        )}

        {/* Check-ins chart */}
        <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',backdropFilter:'blur(20px)',padding:'16px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:'0',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.1) 50%,transparent 90%)'}}/>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p style={{fontSize:13,fontWeight:800,color:'#fff'}}>Check-ins</p>
              <p style={{fontSize:11,color:'#4a6492'}}>Last 7 days</p>
            </div>
            <span style={{fontSize:13,fontWeight:900,color:monthChangePct>=0?'#34d399':'#f87171'}}>{monthChangePct>=0?'+':''}{monthChangePct}% this month</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={ciByDay} barSize={28}>
              <defs><linearGradient id="mBarFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/><stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" vertical={false}/>
              <XAxis dataKey="day" tick={{fill:'#6b87b8',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#6b87b8',fontSize:10}} axisLine={false} tickLine={false} width={20}/>
              <Tooltip content={<DT/>} cursor={{fill:'rgba(59,130,246,0.06)'}}/>
              <Bar dataKey="value" fill="url(#mBarFill)" radius={[5,5,0,0]} name="Check-ins"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement tiers */}
        <div>
          <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)',marginBottom:8,paddingLeft:2}}>Member Engagement</p>
          <div className="space-y-2">
            {[
              {label:'Highly Active',   count:monthCiPer.filter(v=>v>=12).length,     emoji:'🔥',color:'#34d399',rgb:'52,211,153',  sub:'12+ visits/month'},
              {label:'Moderately Active',count:monthCiPer.filter(v=>v>=4&&v<12).length,emoji:'💪',color:'#60a5fa',rgb:'96,165,250',  sub:'4–11 visits'},
              {label:'Inactive',        count:allMemberships.filter(m=>{const l=memberLastCheckIn[m.user_id];return !l||Math.floor((now-new Date(l))/86400000)>=30;}).length, emoji:'😴',color:'#f87171',rgb:'248,113,113',sub:'30+ days away'},
            ].map((tier,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:14,background:`rgba(${tier.rgb},0.07)`,border:`1px solid rgba(${tier.rgb},0.18)`,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:`linear-gradient(180deg,rgba(${tier.rgb},0.7),transparent)`}}/>
                <span style={{fontSize:20,flexShrink:0}}>{tier.emoji}</span>
                <div style={{flex:1}}>
                  <p style={{fontSize:12,fontWeight:700,color:'rgba(148,163,184,0.8)',marginBottom:1}}>{tier.label}</p>
                  <p style={{fontSize:10,color:'rgba(107,135,184,0.5)'}}>{tier.sub}</p>
                </div>
                <p style={{fontSize:28,fontWeight:900,color:tier.color,letterSpacing:'-0.04em',lineHeight:1}}>{tier.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        {insightsList.length > 0 && (
          <div>
            <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)',marginBottom:8,paddingLeft:2}}>Insights</p>
            <div className="space-y-2">
              {insightsList.map((ins,i)=>(
                <AlertCard key={i} icon={ins.icon} iconColor={ins.color} iconRgb={ins.rgb} title={ins.title} message={ins.message} action={ins.action} actionLabel={ins.actionLabel}/>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════ DESKTOP LAYOUT ═══════════════════════════════ */}
      <div className="hidden md:block">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_272px] gap-5 items-start">

        {/* ════ MAIN COLUMN ════ */}
        <div className="space-y-5">

          {/* ── 3 KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard icon={Dumbbell}      iconColor="#60a5fa" iconRgb="96,165,250"  label="Today's Check-ins" value={todayCI}     sub="members in today"/>
            <KpiCard icon={Users}         iconColor="#34d399" iconRgb="52,211,153"  label="Active Members"    value={`${activeThisWeek}/${totalMembers}`} sub={`${retentionRate}% engagement`} trend={weeklyChangePct}/>
            <KpiCard icon={AlertTriangle} iconColor="#fb923c" iconRgb="251,146,60"  label="At-Risk Members"   value={atRisk}     sub="No visits in 10+ days"/>
          </div>
          {/* ── Check-ins Over Time with range toggle ── */}
          <Panel>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Check-ins Over Time</h3>
                <p className="text-xs mt-0.5" style={{color:'#4a6492'}}>Daily attendance</p>
              </div>
              <div className="flex gap-1.5">
                {[7,30,90].map(r=>(
                  <button key={r} onClick={()=>setChartRange(r)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{background:chartRange===r?'rgba(59,130,246,0.22)':BG.subcard,color:chartRange===r?'#93c5fd':'#4a6492',border:`1px solid ${chartRange===r?BORDER.active:BORDER.subtle}`,cursor:'pointer'}}>
                    Last {r} Days
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartDays} barSize={chartRange<=7?32:chartRange<=30?12:5}>
                <defs><linearGradient id="barFillOv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/><stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" vertical={false}/>
                <XAxis dataKey="day" tick={{fill:'#6b87b8',fontSize:10}} axisLine={false} tickLine={false} interval={chartRange<=7?0:chartRange<=30?4:9}/>
                <YAxis tick={{fill:'#6b87b8',fontSize:11}} axisLine={false} tickLine={false} width={24}/>
                <Tooltip content={<DT/>} cursor={{fill:'rgba(59,130,246,0.06)'}}/>
                <Bar dataKey="value" fill="url(#barFillOv)" radius={[5,5,0,0]} name="Check-ins"/>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          {/* ── Growth | Member Engagement | Top Members ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Growth heatmap */}
            <Panel>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400"/>
                  <h3 className="text-sm font-bold text-white">Growth</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{background:BG.subcard,color:'#4a6492',border:`1px solid ${BORDER.subtle}`}}>Last 7 Days</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold" style={{color:'#6b87b8'}}>Net Member Growth</p>
                <span className="text-sm font-black" style={{color:'#34d399'}}>{newSignUps>0?'+':''}{newSignUps}</span>
              </div>
              {/* Heatmap grid */}
              <div style={{display:'grid',gridTemplateColumns:`repeat(${heatRows.length},1fr)`,gap:2,marginBottom:6}}>
                {heatRows.map((week,wi)=>(
                  <div key={wi} style={{display:'flex',flexDirection:'column',gap:2}}>
                    {week.map((day,di)=>{
                      const intensity = day.count/maxH;
                      return (
                        <div key={di} style={{width:'100%',aspectRatio:'1',borderRadius:2,background:day.count===0?'rgba(13,35,96,0.35)':`rgba(52,211,153,${0.12+intensity*0.72})`,border:'1px solid rgba(255,255,255,0.03)',transition:'background 0.2s'}} title={`${format(day.date,'MMM d')}: ${day.count} check-ins`}/>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                {['6AM','12PM','6PM'].map(l=><span key={l} style={{fontSize:9,color:'rgba(107,135,184,0.45)'}}>{l}</span>)}
              </div>
              {/* Mini stat */}
              <div className="mt-4 pt-3 border-t" style={{borderColor:BORDER.subtle}}>
                <div className="flex items-center justify-between">
                  <span style={{fontSize:11,color:'rgba(107,135,184,0.65)'}}>New sign-ups (30d)</span>
                  <span style={{fontSize:13,fontWeight:900,color:'#34d399'}}>+{newSignUps}</span>
                </div>
              </div>
            </Panel>

            {/* Member Engagement */}
            <Panel>
              <PH title="Member Engagement"/>
              <div className="space-y-2.5">
                {[
                  {label:'Highly Active Members',count:highlyActive,   icon:'🔥',color:'#34d399',rgb:'52,211,153'},
                  {label:'Moderately active',     count:moderatelyActive,icon:'💪',color:'#60a5fa',rgb:'96,165,250'},
                  {label:'Inactive Members',      count:inactiveMembers, icon:'😴',color:'#f87171',rgb:'248,113,113'},
                ].map((tier,i)=>(
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl relative overflow-hidden"
                    style={{background:`rgba(${tier.rgb},0.08)`,border:`1px solid rgba(${tier.rgb},0.2)`}}>
                    <div style={{position:'absolute',left:0,top:0,bottom:0,width:2,background:`linear-gradient(180deg,rgba(${tier.rgb},0.7),transparent)`}}/>
                    <div style={{width:34,height:34,borderRadius:10,background:`rgba(${tier.rgb},0.15)`,border:`1px solid rgba(${tier.rgb},0.28)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{tier.icon}</div>
                    <div className="flex-1 pl-1">
                      <p style={{fontSize:24,fontWeight:900,color:tier.color,lineHeight:1,letterSpacing:'-0.03em'}}>{tier.count}</p>
                      <p style={{fontSize:11,color:'rgba(148,163,184,0.6)',marginTop:2,lineHeight:1.3}}>{tier.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Top Members */}
            <Panel>
              <PH title="Top Members" subtitle="Recently joined"/>
              <div className="space-y-2">
                {topMems.length===0
                  ?<Empty icon={Users} label="No members yet"/>
                  :topMems.map((m,i)=>{
                    const joinDate = m.join_date||m.created_date;
                    const daysAgo  = joinDate ? Math.floor((now-new Date(joinDate))/86400000) : null;
                    const timeLabel= daysAgo===null?'':daysAgo===0?'today':daysAgo===1?'yesterday':`${daysAgo}d ago`;
                    const ciCount  = checkIns.filter(c=>c.user_id===m.user_id).length;
                    return (
                      <div key={m.id||i} className="flex items-center gap-2.5 p-2.5 rounded-xl relative overflow-hidden"
                        style={{background:'rgba(13,35,96,0.22)',border:'1px solid rgba(59,130,246,0.09)'}}>
                        <div style={{position:'absolute',left:0,top:0,bottom:0,width:2,background:'linear-gradient(180deg,rgba(96,165,250,0.4),transparent)'}}/>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 ml-1"
                          style={{background:'linear-gradient(135deg,#3b82f6,#06b6d4)',boxShadow:'0 0 8px rgba(59,130,246,0.3)'}}>{(m.user_name||'?').charAt(0).toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate leading-tight">{m.user_name||'Member'}</p>
                          <p className="text-xs" style={{color:'rgba(107,135,184,0.6)'}}>joined {timeLabel}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0"
                          style={{background:'rgba(59,130,246,0.1)',color:'#60a5fa',border:'1px solid rgba(59,130,246,0.18)'}}>{ciCount} visits</span>
                      </div>
                    );
                  })
                }
              </div>
            </Panel>
          </div>

          {/* ── Bottom stat cards: Highly Active | Member Engagement % ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-2xl p-5"
              style={{background:'linear-gradient(145deg,rgba(52,211,153,0.13),rgba(8,14,36,0.95))',border:'1px solid rgba(52,211,153,0.22)',boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
              <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:'linear-gradient(90deg,transparent,rgba(52,211,153,0.4),transparent)'}}/>
              <div style={{position:'absolute',top:-40,right:-20,width:130,height:130,borderRadius:'50%',background:'radial-gradient(circle,rgba(52,211,153,0.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
              <div className="flex items-center gap-2.5 mb-3">
                <div style={{width:36,height:36,borderRadius:11,background:'rgba(52,211,153,0.18)',border:'1px solid rgba(52,211,153,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🏅</div>
                <p style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.1em',color:'rgba(52,211,153,0.65)'}}>Highly Active</p>
              </div>
              <p style={{fontSize:44,fontWeight:900,color:'#34d399',letterSpacing:'-0.04em',lineHeight:1}}>{highlyActive}</p>
              <p style={{fontSize:11,color:'rgba(107,135,184,0.55)',marginTop:5}}>members — 12+ visits this month</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl p-5"
              style={{background:'linear-gradient(145deg,rgba(167,139,250,0.13),rgba(8,14,36,0.95))',border:'1px solid rgba(167,139,250,0.22)',boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
              <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:'linear-gradient(90deg,transparent,rgba(167,139,250,0.4),transparent)'}}/>
              <div style={{position:'absolute',top:-40,right:-20,width:130,height:130,borderRadius:'50%',background:'radial-gradient(circle,rgba(167,139,250,0.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
              <div className="flex items-center gap-2.5 mb-3">
                <div style={{width:36,height:36,borderRadius:11,background:'rgba(167,139,250,0.18)',border:'1px solid rgba(167,139,250,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>💜</div>
                <p style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.1em',color:'rgba(167,139,250,0.65)'}}>Member Engagement</p>
              </div>
              <p style={{fontSize:44,fontWeight:900,color:'#a78bfa',letterSpacing:'-0.04em',lineHeight:1}}>{totalMembers>0?Math.round((activeThisWeek/totalMembers)*100):0}%</p>
              <p style={{fontSize:11,color:'rgba(107,135,184,0.55)',marginTop:5}}>of members active this week</p>
            </div>
          </div>
        </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        <div className="space-y-4">

          {/* Alerts & Actions */}
          <Panel>
            <PH title="Alerts & Actions"/>
            <div className="space-y-3">
              {atRisk>0
                ?<AlertCard icon={AlertTriangle} iconColor="#fb923c" iconRgb="249,115,22" title={`${atRisk} members at risk`} message="No check-in for 14+ days" action={()=>setTab('members')} actionLabel="View in Members"/>
                :<AlertCard icon={CheckCircle}   iconColor="#34d399" iconRgb="52,211,153"  title="No at-risk members"       message="All members staying active"/>
              }
              {!challenges.some(c=>c.status==='active')&&(
                <AlertCard icon={Trophy}    iconColor="#60a5fa" iconRgb="96,165,250"  title="No active challenges" message="Challenges boost retention"     action={()=>openModal('challenge')} actionLabel="Create one"/>
              )}
              {polls.length===0&&(
                <AlertCard icon={BarChart2} iconColor="#a78bfa" iconRgb="167,139,250" title="No active polls"      message="Engage members with a poll"     action={()=>openModal('poll')}      actionLabel="Create one"/>
              )}
            </div>
          </Panel>

          {/* Quick Actions */}
          <Panel>
            <PH title="Quick Actions"/>
            <div className="grid grid-cols-2 gap-2">
              {[
                {icon:UserPlus,          label:'Add Member',       color:'#60a5fa',rgb:'96,165,250',  onClick:()=>openModal('members')},
                {icon:QrCode,            label:'Scan Check-In',    color:'#34d399',rgb:'52,211,153',  onClick:()=>openModal('qrScanner')},
                {icon:Trophy,            label:'Create Challenge', color:'#fb923c',rgb:'251,146,60',  onClick:()=>openModal('challenge')},
                {icon:MessageSquarePlus, label:'Send Message',     color:'#a78bfa',rgb:'167,139,250', onClick:()=>openModal('post')},
              ].map(({icon:Icon,label,color,rgb,onClick},i)=>(
                <button key={i} onClick={onClick}
                  className="flex flex-col items-start gap-2 p-3 rounded-xl transition-all hover:brightness-110 active:scale-95"
                  style={{background:`rgba(${rgb},0.09)`,border:`1px solid rgba(${rgb},0.22)`,cursor:'pointer',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:`linear-gradient(90deg,transparent,rgba(${rgb},0.35),transparent)`}}/>
                  <div style={{width:30,height:30,borderRadius:9,background:`rgba(${rgb},0.18)`,border:`1px solid rgba(${rgb},0.28)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Icon style={{width:14,height:14,color}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:800,color:'#fff',lineHeight:1.3}}>{label}</span>
                </button>
              ))}
            </div>
          </Panel>

          {/* Insights */}
          <Panel>
            <PH title="Insights"/>
            <div className="space-y-3">
              {insightsList.length===0
                ?<Empty icon={Zap} label="Check back once members are active"/>
                :insightsList.map((ins,i)=>(
                  <AlertCard key={i} icon={ins.icon} iconColor={ins.color} iconRgb={ins.rgb}
                    title={ins.title} message={ins.message} action={ins.action} actionLabel={ins.actionLabel}/>
                ))
              }
            </div>
          </Panel>
        </div>
      </div>
      </div>{/* end desktop wrapper */}
      </>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PUSH NOTIFICATION PANEL (shared, used in Members tab mobile + desktop)
  // ══════════════════════════════════════════════════════════════════════════
  const PushNotifPanel = ({ compact = false }) => {
    const atRiskCount = allMemberships.filter(m => {
      const last = memberLastCheckIn[m.user_id];
      return !last || Math.floor((now - new Date(last)) / 86400000) >= 14;
    }).length;

    const applyTemplate = (t) => {
      setNotifTemplate(t.label);
      setNotifMsg(t.body);
    };

    const containerStyle = compact
      ? { padding: '14px 16px 16px', borderRadius: 18, background: 'linear-gradient(145deg,rgba(18,28,72,0.95),rgba(6,8,22,0.98))', border: '1px solid rgba(251,191,36,0.22)', position: 'relative', overflow: 'hidden' }
      : {};

    const inner = (
      <div style={compact ? {} : {}}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <div style={{ width:34, height:34, borderRadius:11, background:'rgba(251,191,36,0.14)', border:'1px solid rgba(251,191,36,0.28)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <BellRing style={{ width:16, height:16, color:'#fbbf24' }}/>
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:900, color:'#fff', margin:0, lineHeight:1.2 }}>Push Notifications</p>
              <p style={{ fontSize:10, color:'rgba(107,135,184,0.6)', margin:0, marginTop:2 }}>Reach members directly on their phone</p>
            </div>
          </div>
          {atRiskCount > 0 && (
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:800, padding:'4px 9px', borderRadius:99, background:'rgba(248,113,113,0.12)', color:'#f87171', border:'1px solid rgba(248,113,113,0.25)', flexShrink:0 }}>
              ⚠️ {atRiskCount} at risk
            </span>
          )}
        </div>

        {/* One-tap auto-send at-risk */}
        {atRiskCount > 0 && (
          <button
            onClick={() => { setNotifTarget('atRisk'); setNotifMsg(NOTIF_TEMPLATES[4].body); }}
            style={{ width:'100%', padding:'12px 14px', borderRadius:14, background:'rgba(248,113,113,0.09)', border:'1px solid rgba(248,113,113,0.25)', display:'flex', alignItems:'center', gap:12, cursor:'pointer', marginBottom:12, textAlign:'left', position:'relative', overflow:'hidden', WebkitTapHighlightColor:'transparent' }}>
            <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:1, background:'linear-gradient(90deg,transparent,rgba(248,113,113,0.3),transparent)' }}/>
            <div style={{ width:36, height:36, borderRadius:11, background:'rgba(248,113,113,0.15)', border:'1px solid rgba(248,113,113,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Zap style={{ width:16, height:16, color:'#f87171' }}/>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:800, color:'#fff', margin:'0 0 2px' }}>Auto-notify at-risk members</p>
              <p style={{ fontSize:11, color:'rgba(248,113,113,0.65)', margin:0 }}>Loads a re-engagement message for {atRiskCount} member{atRiskCount!==1?'s':''}</p>
            </div>
            <Sparkles style={{ width:14, height:14, color:'#f87171', flexShrink:0 }}/>
          </button>
        )}

        {/* Target selector */}
        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
          {[
            { id:'atRisk', label:`At-Risk (${atRiskCount})`, rgb:'248,113,113', c:'#f87171' },
            { id:'all',    label:`All Members (${allMemberships.length})`, rgb:'96,165,250', c:'#60a5fa' },
          ].map(t => (
            <button key={t.id} onClick={() => setNotifTarget(t.id)}
              style={{ flex:1, padding:'8px 10px', borderRadius:10, background: notifTarget===t.id ? `rgba(${t.rgb},0.15)` : 'rgba(13,35,96,0.3)', border:`1px solid ${notifTarget===t.id?`rgba(${t.rgb},0.4)`:'rgba(255,255,255,0.06)'}`, color: notifTarget===t.id ? t.c : 'rgba(107,135,184,0.6)', fontSize:11, fontWeight:800, cursor:'pointer', transition:'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Template chips */}
        <div style={{ marginBottom:10 }}>
          <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgba(107,135,184,0.4)', marginBottom:7 }}>Quick Templates</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {NOTIF_TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => applyTemplate(t)}
                style={{ padding:'5px 10px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', background: notifTemplate===t.label ? 'rgba(251,191,36,0.18)' : 'rgba(13,35,96,0.4)', color: notifTemplate===t.label ? '#fbbf24' : 'rgba(107,135,184,0.7)', border:`1px solid ${notifTemplate===t.label?'rgba(251,191,36,0.35)':'rgba(255,255,255,0.06)'}`, transition:'all 0.15s', whiteSpace:'nowrap' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message textarea */}
        <div style={{ position:'relative', marginBottom:10 }}>
          <textarea
            value={notifMsg}
            onChange={e => { setNotifMsg(e.target.value); setNotifTemplate(null); }}
            placeholder="Type a personalised message to your members…"
            rows={3}
            style={{ width:'100%', padding:'12px 14px', borderRadius:12, background:'rgba(6,10,30,0.7)', border:`1px solid ${notifMsg ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.08)'}`, color:'#fff', fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none', transition:'border-color 0.2s', lineHeight:1.5, boxSizing:'border-box' }}
          />
          <p style={{ position:'absolute', bottom:10, right:12, fontSize:10, color: notifMsg.length > 160 ? '#f87171' : 'rgba(107,135,184,0.35)', margin:0 }}>{notifMsg.length}/160</p>
        </div>

        {/* Send button + success state */}
        {notifSent ? (
          <div style={{ width:'100%', padding:'12px 16px', borderRadius:12, background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.3)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(52,211,153,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Check style={{ width:14, height:14, color:'#34d399' }}/>
            </div>
            <p style={{ fontSize:13, fontWeight:700, color:'#34d399', margin:0 }}>
              Sent to {notifSent.count} {notifSent.target === 'atRisk' ? 'at-risk' : ''} member{notifSent.count!==1?'s':''}!
            </p>
          </div>
        ) : (
          <button
            onClick={sendNotification}
            disabled={!notifMsg.trim() || notifSending}
            style={{ width:'100%', padding:'12px 16px', borderRadius:12, background: notifMsg.trim() ? 'linear-gradient(135deg,rgba(59,130,246,0.9),rgba(37,99,235,0.9))' : 'rgba(13,35,96,0.4)', border:`1px solid ${notifMsg.trim()?'rgba(59,130,246,0.6)':'rgba(255,255,255,0.06)'}`, color: notifMsg.trim() ? '#fff' : 'rgba(107,135,184,0.35)', fontSize:13, fontWeight:800, cursor: notifMsg.trim() ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s', boxShadow: notifMsg.trim() ? '0 4px 16px rgba(59,130,246,0.25)' : 'none' }}>
            {notifSending
              ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> Sending…</>
              : <><Send style={{ width:14, height:14 }}/> Send to {notifTarget === 'atRisk' ? `${atRiskCount} at-risk` : `all ${allMemberships.length}`} members</>
            }
          </button>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

    if (compact) return (
      <div style={containerStyle}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.35),transparent)' }}/>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'linear-gradient(180deg,rgba(251,191,36,0.7),transparent)' }}/>
        <div style={{ paddingLeft:4 }}>{inner}</div>
      </div>
    );

    return (
      <div className="relative overflow-hidden rounded-2xl"
        style={{ background:'linear-gradient(135deg,rgba(30,35,60,0.82) 0%,rgba(8,10,20,0.96) 100%)', border:'1px solid rgba(251,191,36,0.18)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', boxShadow:'0 4px 24px rgba(0,0,0,0.4)' }}>
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background:'linear-gradient(90deg,transparent 10%,rgba(251,191,36,0.35) 50%,transparent 90%)' }}/>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'linear-gradient(180deg,rgba(251,191,36,0.7),transparent)' }}/>
        <div style={{ position:'absolute', top:-40, right:-30, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(251,191,36,0.06) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div className="relative p-5">{inner}</div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: MEMBERS
  // ══════════════════════════════════════════════════════════════════════════
  const TabMembers = () => (
    <>
    {/* ═══ MOBILE ═══ */}
    <div className="md:hidden space-y-3 pb-2">

      {/* Hero: Total Members */}
      <div style={{borderRadius:22,background:'linear-gradient(145deg,rgba(10,40,100,0.95),rgba(4,8,24,0.98))',border:'1px solid rgba(52,211,153,0.25)',padding:'22px 20px',position:'relative',overflow:'hidden',boxShadow:'0 12px 40px rgba(0,0,0,0.6)'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(52,211,153,0.45),transparent)'}}/>
        <div style={{position:'absolute',top:-50,right:-30,width:180,height:180,borderRadius:'50%',background:'radial-gradient(circle,rgba(52,211,153,0.1) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(52,211,153,0.6)',marginBottom:8}}>Total Members</p>
            <p style={{fontSize:68,fontWeight:900,color:'#fff',letterSpacing:'-0.05em',lineHeight:1}}>{totalMembers}</p>
            <p style={{fontSize:12,color:'rgba(107,135,184,0.6)',marginTop:6}}>active memberships</p>
          </div>
          <div style={{textAlign:'right'}}>
            <p style={{fontSize:10,color:'rgba(107,135,184,0.45)',marginBottom:4}}>This week</p>
            <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:13,fontWeight:800,padding:'5px 10px',borderRadius:99,background:weeklyChangePct>=0?'rgba(16,185,129,0.12)':'rgba(248,113,113,0.12)',color:weeklyChangePct>=0?'#34d399':'#f87171',border:`1px solid ${weeklyChangePct>=0?'rgba(16,185,129,0.25)':'rgba(248,113,113,0.25)'}`}}>
              {weeklyChangePct>=0?<TrendingUp style={{width:10,height:10}}/>:<TrendingDown style={{width:10,height:10}}/>}{Math.abs(weeklyChangePct)}%
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            {label:'Active',val:activeThisWeek,color:'#34d399',sub:'this week'},
            {label:'Retention',val:`${retentionRate}%`,color:'#a78bfa',sub:'30-day rate'},
            {label:'PRs Logged',val:lifts.filter(l=>l.is_pr).length,color:'#fbbf24',sub:'all time'},
          ].map((s,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:'10px 12px',border:'1px solid rgba(255,255,255,0.06)'}}>
              <p style={{fontSize:20,fontWeight:900,color:s.color,letterSpacing:'-0.03em',lineHeight:1,marginBottom:3}}>{s.val}</p>
              <p style={{fontSize:9,fontWeight:700,color:'rgba(148,163,184,0.5)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement tiers 2x2 */}
      <div>
        <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)',marginBottom:8,paddingLeft:2}}>Engagement Tiers — Last 30 days</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            {label:'Super Active',sub:'15+ visits/mo',val:monthCiPer.filter(v=>v>=15).length,c:'#34d399',bg:'rgba(16,185,129,0.09)',b:'rgba(16,185,129,0.22)',e:'🔥'},
            {label:'Active',      sub:'8–14 visits/mo',val:monthCiPer.filter(v=>v>=8&&v<15).length,c:'#60a5fa',bg:'rgba(59,130,246,0.09)',b:'rgba(59,130,246,0.22)',e:'💪'},
            {label:'Casual',      sub:'1–7 visits/mo', val:monthCiPer.filter(v=>v>=1&&v<8).length,c:'#fbbf24',bg:'rgba(251,191,36,0.09)',b:'rgba(251,191,36,0.22)',e:'🚶'},
            {label:'At Risk',     sub:'14d+ inactive',  val:atRisk,c:'#f87171',bg:'rgba(248,113,113,0.09)',b:'rgba(248,113,113,0.22)',e:'⚠️'},
          ].map((t,i)=>(
            <div key={i} style={{padding:'16px 14px',borderRadius:16,background:t.bg,border:`1px solid ${t.b}`,position:'relative',overflow:'hidden'}}>
              <p style={{fontSize:20,marginBottom:8}}>{t.e}</p>
              <p style={{fontSize:34,fontWeight:900,color:t.c,letterSpacing:'-0.04em',lineHeight:1,marginBottom:4}}>{t.val}</p>
              <p style={{fontSize:12,fontWeight:800,color:'#fff',marginBottom:2}}>{t.label}</p>
              <p style={{fontSize:10,color:'rgba(107,135,184,0.55)'}}>{t.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-2" style={{paddingLeft:2}}>
          <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)'}}>This Week's Leaderboard</p>
          <button onClick={()=>openModal('members')} style={{fontSize:11,fontWeight:700,color:'#60a5fa',background:'none',border:'none',cursor:'pointer',padding:0}}>All Members</button>
        </div>
        <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',backdropFilter:'blur(20px)',padding:'12px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.1) 50%,transparent 90%)'}}/>
          <div className="space-y-1.5">
            {Object.entries(ci7.reduce((acc,c)=>{acc[c.user_name]=(acc[c.user_name]||0)+1;return acc;},{}))
              .sort(([,a],[,b])=>b-a).slice(0,6)
              .map(([name,count],idx)=>(
                <div key={name} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,background:idx<3?'rgba(59,130,246,0.08)':'rgba(13,35,96,0.25)',border:`1px solid ${idx<3?'rgba(59,130,246,0.18)':'rgba(255,255,255,0.05)'}`}}>
                  <span style={{fontSize:16,width:22,textAlign:'center',flexShrink:0}}>{['🥇','🥈','🥉'][idx]||<span style={{fontSize:11,color:'#3d5a8a',fontWeight:800}}>{idx+1}</span>}</span>
                  <span style={{flex:1,fontSize:14,fontWeight:700,color:'#fff'}}>{name}</span>
                  <span style={{fontSize:12,fontWeight:800,padding:'3px 8px',borderRadius:8,background:'rgba(13,35,96,0.6)',color:'#93b4e8'}}>{count} visits</span>
                </div>
              ))}
            {ci7.length===0&&<Empty icon={Users} label="No check-ins this week yet"/>}
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div>
        <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)',marginBottom:8,paddingLeft:2}}>Push Notifications</p>
        <PushNotifPanel compact/>
      </div>

      {/* Rewards */}
      <div>
        <div className="flex items-center justify-between mb-2" style={{paddingLeft:2}}>
          <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)'}}>Rewards Program</p>
          <button onClick={()=>openModal('rewards')} style={{fontSize:11,fontWeight:700,color:'#60a5fa',background:'none',border:'none',cursor:'pointer',padding:0}}>Manage</button>
        </div>
        {rewards.length>0?(
          <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',backdropFilter:'blur(20px)',padding:'12px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.1) 50%,transparent 90%)'}}/>
            <div className="space-y-2">
              {rewards.slice(0,4).map(r=>(
                <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,background:'rgba(13,35,96,0.25)',border:'1px solid rgba(255,255,255,0.05)'}}>
                  <span style={{fontSize:22,flexShrink:0}}>{r.icon||'🎁'}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.title}</p>
                    <p style={{fontSize:10,color:'#4a6492'}}>{r.claimed_by?.length||0} claimed</p>
                  </div>
                  <Tag color={r.active?'green':'blue'}>{r.active?'Active':'Off'}</Tag>
                </div>
              ))}
            </div>
          </div>
        ):<div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',padding:'12px'}}><Empty icon={Gift} label="No rewards yet — create some to boost retention"/></div>}
      </div>
    </div>

    {/* ═══ DESKTOP ═══ */}
    <div className="hidden md:block">
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Users}    iconColor="#60a5fa" iconRgb="96,165,250"  label="Total Members"    value={totalMembers}        sub="active memberships"/>
        <KpiCard icon={Zap}      iconColor="#34d399" iconRgb="52,211,153"  label="Active This Week" value={activeThisWeek}      trend={weeklyChangePct} sub="visited gym"/>
        <KpiCard icon={Activity} iconColor="#a78bfa" iconRgb="167,139,250" label="Retention Rate"   value={`${retentionRate}%`} sub="active last 30d"/>
        <KpiCard icon={Trophy}   iconColor="#fbbf24" iconRgb="251,191,36"  label="PRs Logged"       value={lifts.filter(l=>l.is_pr).length} sub="personal records"/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Engagement Tiers" subtitle="Based on last 30 days" />
          <div className="grid grid-cols-2 gap-3">
            {[
              {label:'Super Active', sub:'15+ visits/mo', val:monthCiPer.filter(v=>v>=15).length,      c:'#34d399', bg:'rgba(16,185,129,0.08)',  b:'rgba(16,185,129,0.2)',  e:'🔥'},
              {label:'Active',       sub:'8–14 visits/mo',val:monthCiPer.filter(v=>v>=8&&v<15).length, c:'#60a5fa', bg:'rgba(59,130,246,0.08)',   b:'rgba(59,130,246,0.2)',  e:'💪'},
              {label:'Casual',       sub:'1–7 visits/mo', val:monthCiPer.filter(v=>v>=1&&v<8).length,  c:'#fbbf24', bg:'rgba(251,191,36,0.08)',   b:'rgba(251,191,36,0.2)',  e:'🚶'},
              {label:'At Risk',      sub:'14d+ inactive',  val:atRisk,                                  c:'#f87171', bg:'rgba(248,113,113,0.08)', b:'rgba(248,113,113,0.2)', e:'⚠️'},
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
        <Panel>
          <PH title="Weekly Leaderboard" subtitle="Most check-ins this week" action={()=>openModal('members')} actionLabel="All Members" />
          <div className="space-y-2">
            {Object.entries(ci7.reduce((acc,c)=>{acc[c.user_name]=(acc[c.user_name]||0)+1;return acc;},{}))
              .sort(([,a],[,b])=>b-a).slice(0,8)
              .map(([name,count],idx)=>(
                <div key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{background:idx<3?'rgba(59,130,246,0.08)':BG.subcard,border:`1px solid ${idx<3?'rgba(59,130,246,0.2)':BORDER.subtle}`}}>
                  <span className="text-base w-6 text-center flex-shrink-0">{['🥇','🥈','🥉'][idx]||<span className="text-xs" style={{color:'#3d5a8a'}}>{idx+1}</span>}</span>
                  <span className="flex-1 text-sm font-semibold text-white truncate">{name}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{background:'rgba(13,35,96,0.6)',color:'#93b4e8'}}>{count} visits</span>
                </div>
              ))}
            {ci7.length===0 && <Empty icon={Users} label="No check-ins this week yet"/>}
          </div>
        </Panel>
      </div>

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
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(13,35,96,0.5)'}}>
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{width:`${(count/max)*100}%`}}/>
                  </div>
                  <span className="text-sm font-bold text-white w-7 text-right">{count}</span>
                </div>
              ));
            })()}
          </div>
        </Panel>
        <PushNotifPanel/>
      </div>

    </div>
    </div>{/* end desktop */}
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: CONTENT
  // ══════════════════════════════════════════════════════════════════════════
  const TabContent = () => (
    <>
    {/* ═══ MOBILE ═══ */}
    <div className="md:hidden space-y-3 pb-2">

      {/* 4 big create buttons */}
      <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)',paddingLeft:2}}>Create Content</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          {icon:MessageSquarePlus,label:'New Post',     sub:'Share with members',         color:'#60a5fa',rgb:'96,165,250',  floor:'rgba(14,40,120,0.9)', onClick:()=>openModal('post')},
          {icon:Calendar,         label:'New Event',    sub:`${events.filter(e=>new Date(e.event_date)>=now).length} upcoming`, color:'#34d399',rgb:'52,211,153',floor:'rgba(4,60,40,0.9)',   onClick:()=>openModal('event')},
          {icon:Trophy,           label:'Challenge',    sub:`${challenges.filter(c=>c.status==='active').length} active`,       color:'#fb923c',rgb:'251,146,60',floor:'rgba(80,20,4,0.9)',   onClick:()=>openModal('challenge')},
          {icon:BarChart2,        label:'New Poll',     sub:`${polls.length} active`,     color:'#a78bfa',rgb:'167,139,250',floor:'rgba(40,10,90,0.9)', onClick:()=>openModal('poll')},
        ].map(({icon:Icon,label,sub,color,rgb,floor,onClick},i)=>(
          <button key={i} onClick={onClick} style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:10,padding:'18px 16px 16px',borderRadius:18,background:`linear-gradient(145deg,rgba(${rgb},0.14),rgba(${rgb},0.06))`,border:`1px solid rgba(${rgb},0.3)`,borderBottom:`4px solid ${floor}`,cursor:'pointer',width:'100%',textAlign:'left',position:'relative',overflow:'hidden',WebkitTapHighlightColor:'transparent'}}
            onTouchStart={e=>{e.currentTarget.style.transform='translateY(3px) scale(0.98)';e.currentTarget.style.borderBottomWidth='1px';}}
            onTouchEnd={e=>{e.currentTarget.style.transform='translateY(0) scale(1)';e.currentTarget.style.borderBottomWidth='4px';}}>
            <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:`linear-gradient(90deg,transparent,rgba(${rgb},0.4),transparent)`}}/>
            <div style={{width:40,height:40,borderRadius:13,background:`rgba(${rgb},0.18)`,border:`1px solid rgba(${rgb},0.3)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 4px 12px rgba(0,0,0,0.2),0 0 8px rgba(${rgb},0.15)`}}>
              <Icon style={{width:20,height:20,color}}/>
            </div>
            <div>
              <p style={{fontSize:14,fontWeight:900,color:'#fff',letterSpacing:'-0.01em',marginBottom:3}}>{label}</p>
              <p style={{fontSize:11,fontWeight:600,color:`rgba(${rgb},0.65)`}}>{sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Posts */}
      {posts.length>0&&(
        <div>
          <div className="flex items-center justify-between mb-2" style={{paddingLeft:2}}>
            <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)'}}>Recent Posts</p>
            <button onClick={()=>openModal('post')} style={{fontSize:11,fontWeight:700,color:'#60a5fa',background:'none',border:'none',cursor:'pointer',padding:0}}>+ New</button>
          </div>
          <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',padding:'12px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.1) 50%,transparent 90%)'}}/>
            <div className="space-y-2">
              {posts.slice(0,4).map(post=>(
                <div key={post.id} style={{padding:'11px 12px',borderRadius:12,background:'rgba(13,35,96,0.25)',border:'1px solid rgba(255,255,255,0.05)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <div style={{width:26,height:26,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:900,flexShrink:0}}>{post.member_name?.charAt(0)?.toUpperCase()}</div>
                    <p style={{fontSize:13,fontWeight:700,color:'#fff',flex:1}}>{post.member_name}</p>
                    <p style={{fontSize:11,color:'#3d5a8a'}}>{format(new Date(post.created_date),'MMM d')}</p>
                  </div>
                  <p style={{fontSize:12,color:'#6b87b8',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',marginBottom:6}}>{post.content}</p>
                  <div style={{display:'flex',gap:12,fontSize:11,color:'#3d5a8a'}}><span>❤️ {post.likes||0}</span><span>💬 {post.comments?.length||0}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {events.filter(e=>new Date(e.event_date)>=now).length>0&&(
        <div>
          <div className="flex items-center justify-between mb-2" style={{paddingLeft:2}}>
            <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)'}}>Upcoming Events</p>
            <button onClick={()=>openModal('event')} style={{fontSize:11,fontWeight:700,color:'#34d399',background:'none',border:'none',cursor:'pointer',padding:0}}>+ New</button>
          </div>
          <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',padding:'12px'}}>
            <div className="space-y-2">
              {events.filter(e=>new Date(e.event_date)>=now).slice(0,3).map(ev=>(
                <div key={ev.id} style={{padding:'11px 12px',borderRadius:12,background:'rgba(16,185,129,0.07)',border:'1px solid rgba(16,185,129,0.15)'}}>
                  <p style={{fontSize:13,fontWeight:800,color:'#fff',marginBottom:3}}>{ev.title}</p>
                  <p style={{fontSize:11,color:'#6b87b8',marginBottom:5,display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{ev.description}</p>
                  <div style={{display:'flex',gap:10,fontSize:11,color:'#3d5a8a'}}><span>📅 {format(new Date(ev.event_date),'MMM d, h:mma')}</span><span>👥 {ev.attendees||0}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Challenges */}
      {challenges.filter(c=>c.status==='active').length>0&&(
        <div>
          <div className="flex items-center justify-between mb-2" style={{paddingLeft:2}}>
            <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)'}}>Active Challenges</p>
            <button onClick={()=>openModal('challenge')} style={{fontSize:11,fontWeight:700,color:'#fb923c',background:'none',border:'none',cursor:'pointer',padding:0}}>+ New</button>
          </div>
          <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',padding:'12px'}}>
            {challenges.filter(c=>c.status==='active').slice(0,3).map(ch=>(
              <div key={ch.id} style={{padding:'11px 12px',borderRadius:12,background:'rgba(249,115,22,0.07)',border:'1px solid rgba(249,115,22,0.18)',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                  <p style={{fontSize:13,fontWeight:800,color:'#fff'}}>🏆 {ch.title}</p>
                  <Tag color="orange">{ch.type?.replace('_',' ')}</Tag>
                </div>
                <div style={{display:'flex',gap:10,fontSize:11,color:'#3d5a8a'}}><span>👥 {ch.participants?.length||0} joined</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Polls */}
      {polls.length>0&&(
        <div>
          <div className="flex items-center justify-between mb-2" style={{paddingLeft:2}}>
            <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)'}}>Active Polls</p>
            <button onClick={()=>openModal('poll')} style={{fontSize:11,fontWeight:700,color:'#a78bfa',background:'none',border:'none',cursor:'pointer',padding:0}}>+ New</button>
          </div>
          <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',padding:'12px'}}>
            {polls.slice(0,3).map(poll=>(
              <div key={poll.id} style={{padding:'11px 12px',borderRadius:12,background:'rgba(139,92,246,0.07)',border:'1px solid rgba(139,92,246,0.18)',marginBottom:8}}>
                <p style={{fontSize:13,fontWeight:800,color:'#fff',marginBottom:4}}>{poll.title}</p>
                <div style={{display:'flex',alignItems:'center',gap:8,fontSize:11,color:'#3d5a8a'}}><span>📊 {poll.voters?.length||0} votes</span><Tag color="purple">{poll.status}</Tag></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty states */}
      {posts.length===0&&events.length===0&&challenges.length===0&&polls.length===0&&(
        <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',padding:'20px'}}>
          <Empty icon={FileText} label="No content yet — use the buttons above to get started"/>
        </div>
      )}
    </div>

    {/* ═══ DESKTOP ═══ */}
    <div className="hidden md:block">
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ActionBtn icon={MessageSquarePlus} label="New Post"      sub="Share with members"   color="#60a5fa" rgb="96,165,250"   floor="#1e3a8a" onClick={()=>openModal('post')}/>
        <ActionBtn icon={Calendar}          label="New Event"     sub={`${events.filter(e=>new Date(e.event_date)>=now).length} upcoming`} color="#34d399" rgb="52,211,153" floor="#064e3b" onClick={()=>openModal('event')}/>
        <ActionBtn icon={Trophy}            label="New Challenge" sub={`${challenges.filter(c=>c.status==='active').length} active`} color="#fb923c" rgb="251,146,60" floor="#7c2d12" onClick={()=>openModal('challenge')}/>
        <ActionBtn icon={BarChart2}         label="New Poll"      sub={`${polls.length} active`} color="#a78bfa" rgb="167,139,250" floor="#4c1d95" onClick={()=>openModal('poll')}/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Recent Posts" badge={posts.length} action={()=>openModal('post')} actionLabel="New Post"/>
          {posts.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {posts.slice(0,10).map(post=>(
                <div key={post.id} className="p-3.5 rounded-xl" style={{background:BG.subcard,border:`1px solid ${BORDER.subtle}`}}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{post.member_name?.charAt(0)?.toUpperCase()}</div>
                    <p className="text-sm font-semibold text-white flex-1">{post.member_name}</p>
                    <p className="text-xs" style={{color:'#3d5a8a'}}>{format(new Date(post.created_date),'MMM d')}</p>
                  </div>
                  <p className="text-xs line-clamp-2 mb-2" style={{color:'#6b87b8'}}>{post.content}</p>
                  <div className="flex gap-4 text-xs" style={{color:'#3d5a8a'}}><span>❤️ {post.likes||0}</span><span>💬 {post.comments?.length||0}</span></div>
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
                <div key={ev.id} className="p-4 rounded-xl" style={{background:BG.subcard,border:`1px solid ${BORDER.subtle}`}}>
                  {ev.image_url && <img src={ev.image_url} alt={ev.title} className="w-full h-24 object-cover rounded-lg mb-3"/>}
                  <p className="text-sm font-bold text-white mb-1 truncate">{ev.title}</p>
                  <p className="text-xs line-clamp-2 mb-2" style={{color:'#6b87b8'}}>{ev.description}</p>
                  <div className="flex gap-3 text-xs" style={{color:'#3d5a8a'}}><span>📅 {format(new Date(ev.event_date),'MMM d, h:mma')}</span><span>👥 {ev.attendees||0}</span></div>
                </div>
              ))}
            </div>
          ) : <Empty icon={Calendar} label="No upcoming events"/>}
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Challenges" badge={challenges.filter(c=>c.status==='active').length} action={()=>openModal('challenge')} actionLabel="New"/>
          {challenges.filter(c=>c.status==='active').length > 0 ? (
            <div className="space-y-3">
              {challenges.filter(c=>c.status==='active').map(ch=>(
                <div key={ch.id} className="p-4 rounded-xl" style={{background:'rgba(249,115,22,0.07)',border:'1px solid rgba(249,115,22,0.18)'}}>
                  <div className="flex items-start justify-between gap-2 mb-2"><p className="text-sm font-bold text-white">🏆 {ch.title}</p><Tag color="orange">{ch.type?.replace('_',' ')}</Tag></div>
                  <p className="text-xs mb-2 line-clamp-1" style={{color:'#6b87b8'}}>{ch.description}</p>
                  <div className="flex gap-4 text-xs" style={{color:'#3d5a8a'}}><span>👥 {ch.participants?.length||0} joined</span><span>📅 {format(new Date(ch.start_date),'MMM d')} – {format(new Date(ch.end_date),'MMM d')}</span></div>
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
                  <div className="flex items-center gap-3 text-xs" style={{color:'#3d5a8a'}}><span>📊 {poll.voters?.length||0} votes</span><Tag color="purple">{poll.status}</Tag></div>
                </div>
              ))}
            </div>
          ) : <Empty icon={BarChart2} label="No active polls"/>}
        </Panel>
      </div>
    </div>
    </div>{/* end desktop */}
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: ANALYTICS
  // ══════════════════════════════════════════════════════════════════════════
  const TabAnalytics = () => (
    <>
    {/* ═══ MOBILE ═══ */}
    <div className="md:hidden space-y-3 pb-2">

      {/* 4 KPI stats in 2x2 grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          {icon:Activity,   color:'#60a5fa',rgb:'96,165,250',  label:'Daily Avg',      value:Math.round(ci30.length/30),sub:'check-ins / day'},
          {icon:TrendingUp, color:monthChangePct>=0?'#34d399':'#f87171',rgb:monthChangePct>=0?'52,211,153':'248,113,113',label:'Monthly Δ',value:`${monthChangePct>=0?'+':''}${monthChangePct}%`,sub:'vs prev 30 days'},
          {icon:Users,      color:'#a78bfa',rgb:'167,139,250', label:'Avg Visits',     value:totalMembers>0?(ci30.length/totalMembers).toFixed(1):'—',sub:'per member (30d)'},
          {icon:Zap,        color:'#fbbf24',rgb:'251,191,36',  label:'Return Rate',    value:`${checkIns.length>0?Math.round((checkIns.filter(c=>!c.first_visit).length/checkIns.length)*100):0}%`,sub:'of all check-ins'},
        ].map((s,i)=>(
          <div key={i} style={{borderRadius:18,background:'linear-gradient(145deg,#0d1e35,#060d1f)',border:`1px solid rgba(${s.rgb},0.2)`,padding:'16px 14px',position:'relative',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.4)'}}>
            <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:`linear-gradient(180deg,rgba(${s.rgb},0.75),transparent)`}}/>
            <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:`linear-gradient(90deg,transparent,rgba(${s.rgb},0.4),transparent)`}}/>
            <div style={{width:34,height:34,borderRadius:10,background:`rgba(${s.rgb},0.14)`,border:`1px solid rgba(${s.rgb},0.25)`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10}}>
              <s.icon style={{width:16,height:16,color:s.color}}/>
            </div>
            <p style={{fontSize:28,fontWeight:900,color:'#fff',letterSpacing:'-0.04em',lineHeight:1,marginBottom:5}}>{s.value}</p>
            <p style={{fontSize:9,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(148,163,184,0.55)',marginBottom:2}}>{s.label}</p>
            <p style={{fontSize:10,color:'rgba(107,135,184,0.5)'}}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Weekly trend chart */}
      <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',padding:'16px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.1) 50%,transparent 90%)'}}/>
        <p style={{fontSize:13,fontWeight:800,color:'#fff',marginBottom:3}}>Weekly Check-in Trend</p>
        <p style={{fontSize:11,color:'#4a6492',marginBottom:12}}>Last 12 weeks</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={weekTrend}>
            <defs><linearGradient id="mg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" vertical={false}/>
            <XAxis dataKey="label" tick={{fill:'#6b87b8',fontSize:9}} axisLine={false} tickLine={false} interval={3}/>
            <YAxis tick={{fill:'#6b87b8',fontSize:9}} axisLine={false} tickLine={false} width={20}/>
            <Tooltip content={<DT/>}/>
            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#mg1)" name="Check-ins"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly growth chart */}
      <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',padding:'16px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.1) 50%,transparent 90%)'}}/>
        <p style={{fontSize:13,fontWeight:800,color:'#fff',marginBottom:3}}>Active Members Growth</p>
        <p style={{fontSize:11,color:'#4a6492',marginBottom:12}}>Last 6 months</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={monthGrowth}>
            <defs><linearGradient id="mg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" vertical={false}/>
            <XAxis dataKey="label" tick={{fill:'#6b87b8',fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:'#6b87b8',fontSize:10}} axisLine={false} tickLine={false} width={20}/>
            <Tooltip content={<DT/>}/>
            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#mg2)" name="Members"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Peak hours */}
      <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',padding:'16px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.1) 50%,transparent 90%)'}}/>
        <p style={{fontSize:13,fontWeight:800,color:'#fff',marginBottom:3}}>Peak Visit Times</p>
        <p style={{fontSize:11,color:'#4a6492',marginBottom:12}}>Most popular hours</p>
        <div className="space-y-2">
          {(()=>{
            const acc={}; checkIns.forEach(c=>{const h=new Date(c.check_in_date).getHours();acc[h]=(acc[h]||0)+1;});
            const max=Math.max(...Object.values(acc),1);
            return Object.entries(acc).sort(([,a],[,b])=>b-a).slice(0,6).map(([hour,count],i)=>{
              const h=parseInt(hour);const label=h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`;
              return (
                <div key={hour} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,fontWeight:700,color:'#3d5a8a',width:14,textAlign:'right',flexShrink:0}}>#{i+1}</span>
                  <span style={{fontSize:13,color:'#fff',width:36,flexShrink:0}}>{label}</span>
                  <div style={{flex:1,height:6,borderRadius:99,overflow:'hidden',background:'rgba(13,35,96,0.5)'}}>
                    <div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,#8b5cf6,#ec4899)',width:`${(count/max)*100}%`}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:800,color:'#fff',width:24,textAlign:'right'}}>{count}</span>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>

    {/* ═══ DESKTOP ═══ */}
    <div className="hidden md:block">
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Weekly Check-in Trend" subtitle="Last 12 weeks"/>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={weekTrend}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" vertical={false}/>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" vertical={false}/>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" vertical={false}/>
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
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(13,35,96,0.5)'}}>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Activity}   iconColor="#60a5fa" iconRgb="96,165,250"  label="Daily Average"     value={Math.round(ci30.length/30)} sub="check-ins / day (30d)"/>
        <KpiCard icon={TrendingUp} iconColor={monthChangePct>=0?'#34d399':'#f87171'} iconRgb={monthChangePct>=0?'52,211,153':'248,113,113'} label="Monthly Change" value={`${monthChangePct>=0?'+':''}${monthChangePct}%`} sub="vs previous 30 days"/>
        <KpiCard icon={Users}      iconColor="#a78bfa" iconRgb="167,139,250" label="Avg Visits/Member" value={totalMembers>0?(ci30.length/totalMembers).toFixed(1):'—'} sub="per member (30d)"/>
        <KpiCard icon={Zap}        iconColor="#fbbf24" iconRgb="251,191,36"  label="Return Rate"       value={`${checkIns.length>0?Math.round((checkIns.filter(c=>!c.first_visit).length/checkIns.length)*100):0}%`} sub="of all check-ins"/>
      </div>
    </div>
    </div>{/* end desktop */}
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TAB: GYM SETTINGS
  // ══════════════════════════════════════════════════════════════════════════
  const TabGym = () => (
    <>
    {/* ═══ MOBILE ═══ */}
    <div className="md:hidden space-y-3 pb-2">

      {/* Gym identity hero card */}
      <div style={{borderRadius:22,background:'linear-gradient(145deg,rgba(10,30,90,0.95),rgba(4,8,24,0.98))',border:'1px solid rgba(59,130,246,0.22)',padding:'20px',position:'relative',overflow:'hidden',boxShadow:'0 12px 40px rgba(0,0,0,0.6)'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(96,165,250,0.4),transparent)'}}/>
        <div style={{position:'absolute',top:-50,right:-30,width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
          <div>
            <div style={{width:48,height:48,borderRadius:15,background:'linear-gradient(135deg,#3b82f6,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12,boxShadow:'0 4px 16px rgba(59,130,246,0.3)'}}>
              <Dumbbell style={{width:22,height:22,color:'#fff'}}/>
            </div>
            <p style={{fontSize:22,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',marginBottom:4}}>{selectedGym?.name}</p>
            <p style={{fontSize:12,color:'rgba(107,135,184,0.65)'}}>{selectedGym?.type} · {selectedGym?.city}</p>
          </div>
          <button onClick={()=>openModal('editInfo')} style={{padding:'8px 14px',borderRadius:10,background:'rgba(59,130,246,0.12)',color:'#93c5fd',border:'1px solid rgba(59,130,246,0.25)',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0}}>Edit</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            {l:'Monthly Price',v:selectedGym?.price?`£${selectedGym.price}/mo`:'Not set',c:'#fbbf24'},
            {l:'Address',v:selectedGym?.address,c:'#94a3b8'},
            {l:'Postcode',v:selectedGym?.postcode,c:'#94a3b8'},
            {l:'Status',v:selectedGym?.verified?'✓ Verified':'Pending',c:selectedGym?.verified?'#34d399':'#fbbf24'},
          ].map((f,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:'10px 12px',border:'1px solid rgba(255,255,255,0.05)'}}>
              <p style={{fontSize:9,fontWeight:700,color:'rgba(148,163,184,0.45)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>{f.l}</p>
              <p style={{fontSize:12,fontWeight:700,color:f.c,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.v||'—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Manage Gym 2x2 */}
      <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)',paddingLeft:2}}>Manage Gym</p>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          {icon:Calendar,label:'Classes',  sub:`${classes.length} total`,                  color:'#34d399',rgb:'52,211,153',  floor:'rgba(4,60,40,0.9)',  onClick:()=>openModal('classes')},
          {icon:Users,   label:'Coaches',  sub:`${coaches.length} total`,                  color:'#60a5fa',rgb:'96,165,250',  floor:'rgba(14,40,120,0.9)',onClick:()=>openModal('coaches')},
          {icon:Dumbbell,label:'Equipment',sub:`${selectedGym?.equipment?.length||0} items`,color:'#a78bfa',rgb:'167,139,250',floor:'rgba(40,10,90,0.9)', onClick:()=>openModal('equipment')},
          {icon:Star,    label:'Amenities',sub:`${selectedGym?.amenities?.length||0} listed`,color:'#fbbf24',rgb:'251,191,36',floor:'rgba(80,50,4,0.9)',  onClick:()=>openModal('amenities')},
        ].map(({icon:Icon,label,sub,color,rgb,floor,onClick},i)=>(
          <button key={i} onClick={onClick} style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:10,padding:'16px 14px',borderRadius:18,background:`linear-gradient(145deg,rgba(${rgb},0.12),rgba(${rgb},0.05))`,border:`1px solid rgba(${rgb},0.28)`,borderBottom:`4px solid ${floor}`,cursor:'pointer',width:'100%',textAlign:'left',position:'relative',overflow:'hidden',WebkitTapHighlightColor:'transparent'}}
            onTouchStart={e=>{e.currentTarget.style.transform='translateY(3px)';e.currentTarget.style.borderBottomWidth='1px';}}
            onTouchEnd={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderBottomWidth='4px';}}>
            <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:`linear-gradient(90deg,transparent,rgba(${rgb},0.4),transparent)`}}/>
            <div style={{width:38,height:38,borderRadius:12,background:`rgba(${rgb},0.18)`,border:`1px solid rgba(${rgb},0.3)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Icon style={{width:18,height:18,color}}/>
            </div>
            <div>
              <p style={{fontSize:14,fontWeight:900,color:'#fff',marginBottom:2}}>{label}</p>
              <p style={{fontSize:11,color:`rgba(${rgb},0.65)`,fontWeight:600}}>{sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Classes */}
      {classes.length>0&&(
        <div>
          <div className="flex items-center justify-between mb-2" style={{paddingLeft:2}}>
            <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)'}}>Classes</p>
            <button onClick={()=>openModal('classes')} style={{fontSize:11,fontWeight:700,color:'#34d399',background:'none',border:'none',cursor:'pointer',padding:0}}>Manage</button>
          </div>
          <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',padding:'12px'}}>
            {classes.slice(0,4).map(cls=>(
              <div key={cls.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,background:'rgba(13,35,96,0.25)',border:'1px solid rgba(255,255,255,0.05)',marginBottom:8}}>
                <div style={{width:32,height:32,borderRadius:10,background:'rgba(52,211,153,0.12)',border:'1px solid rgba(52,211,153,0.22)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Calendar style={{width:15,height:15,color:'#34d399'}}/></div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cls.name}</p>
                  <p style={{fontSize:11,color:'#3d5a8a'}}>{cls.schedule||cls.time||'—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coaches */}
      {coaches.length>0&&(
        <div>
          <div className="flex items-center justify-between mb-2" style={{paddingLeft:2}}>
            <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)'}}>Coaches</p>
            <button onClick={()=>openModal('coaches')} style={{fontSize:11,fontWeight:700,color:'#60a5fa',background:'none',border:'none',cursor:'pointer',padding:0}}>Manage</button>
          </div>
          <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',padding:'12px'}}>
            {coaches.slice(0,4).map(coach=>(
              <div key={coach.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,background:'rgba(13,35,96,0.25)',border:'1px solid rgba(255,255,255,0.05)',marginBottom:8}}>
                <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#f97316,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:900,flexShrink:0}}>{coach.name?.charAt(0)?.toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{coach.name}</p>
                  <p style={{fontSize:11,color:'#3d5a8a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{coach.speciality||coach.bio||'Coach'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Amenities + Equipment tags */}
      {(selectedGym?.amenities?.length>0||selectedGym?.equipment?.length>0)&&(
        <div>
          {selectedGym?.amenities?.length>0&&(
            <>
              <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)',paddingLeft:2,marginBottom:8}}>Amenities</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>{selectedGym.amenities.map((a,i)=><Tag key={i} color="blue">{a}</Tag>)}</div>
            </>
          )}
          {selectedGym?.equipment?.length>0&&(
            <>
              <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)',paddingLeft:2,marginBottom:8}}>Equipment</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{selectedGym.equipment.slice(0,12).map((e,i)=><Tag key={i} color="purple">{e}</Tag>)}{selectedGym.equipment.length>12&&<Tag color="blue">+{selectedGym.equipment.length-12} more</Tag>}</div>
            </>
          )}
        </div>
      )}

      {/* Photo gallery */}
      <div>
        <div className="flex items-center justify-between mb-2" style={{paddingLeft:2}}>
          <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)'}}>Photos</p>
          <button onClick={()=>openModal('photos')} style={{fontSize:11,fontWeight:700,color:'#60a5fa',background:'none',border:'none',cursor:'pointer',padding:0}}>Manage</button>
        </div>
        {selectedGym?.gallery?.length>0?(
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
            {selectedGym.gallery.slice(0,8).map((url,i)=><img key={i} src={url} alt="" style={{width:'100%',aspectRatio:'1',objectFit:'cover',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)'}}/>)}
          </div>
        ):(
          <button onClick={()=>openModal('photos')} style={{width:'100%',padding:'20px',borderRadius:16,background:'rgba(13,35,96,0.2)',border:'2px dashed rgba(59,130,246,0.2)',color:'#4a6492',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><ImageIcon style={{width:16,height:16}}/>Add Photos</button>
        )}
      </div>

      {/* Admin info */}
      <div style={{borderRadius:20,background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))',border:'1px solid rgba(255,255,255,0.07)',padding:'14px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.1) 50%,transparent 90%)'}}/>
        <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(107,135,184,0.45)',marginBottom:10}}>Admin</p>
        {[{l:'Owner',v:selectedGym?.owner_email},{l:'Gym ID',v:selectedGym?.id,mono:true}].map((f,i)=>(
          <div key={i} style={{marginBottom:8}}>
            <p style={{fontSize:10,color:'#3d5a8a',marginBottom:2}}>{f.l}</p>
            <p style={{fontSize:f.mono?10:12,fontWeight:600,color:'#94a3b8',fontFamily:f.mono?'monospace':'inherit',wordBreak:'break-all'}}>{f.v||'—'}</p>
          </div>
        ))}
        <Link to={createPageUrl('GymCommunity')+'?id='+selectedGym?.id}>
          <button style={{width:'100%',padding:'10px',borderRadius:10,background:'rgba(13,35,96,0.4)',color:'#93b4e8',border:'1px solid rgba(59,130,246,0.14)',fontSize:12,fontWeight:700,cursor:'pointer',marginTop:4}}>View Public Gym Page →</button>
        </Link>
      </div>

      {/* Danger zone */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          {title:'Delete Gym',label:'Delete',fn:()=>openModal('deleteGym')},
          {title:'Delete Account',label:'Delete',fn:()=>openModal('deleteAccount')},
        ].map((d,i)=>(
          <div key={i} style={{padding:'14px',borderRadius:16,background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.18)'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}><Trash2 style={{width:13,height:13,color:'#f87171'}}/><p style={{fontSize:12,fontWeight:800,color:'#fff'}}>{d.title}</p></div>
            <button onClick={d.fn} style={{width:'100%',padding:'8px',borderRadius:8,background:'rgba(239,68,68,0.12)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.3)',fontSize:11,fontWeight:800,cursor:'pointer'}}>{d.label}</button>
          </div>
        ))}
      </div>
    </div>

    {/* ═══ DESKTOP ═══ */}
    <div className="hidden md:block">
    <div className="space-y-5">
      <Panel>
        <PH title="Gym Information" subtitle={selectedGym?.name} action={()=>openModal('editInfo')} actionLabel="Edit"/>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            {l:'Gym Name',v:selectedGym?.name,icon:Dumbbell,rgb:'96,165,250',c:'#60a5fa'},
            {l:'Type',v:selectedGym?.type,icon:Tag2,rgb:'167,139,250',c:'#a78bfa'},
            {l:'City',v:selectedGym?.city,icon:MapPin2,rgb:'52,211,153',c:'#34d399'},
            {l:'Monthly Price',v:selectedGym?.price?`£${selectedGym.price}/mo`:'Not set',icon:DollarSign,rgb:'251,191,36',c:'#fbbf24'},
            {l:'Address',v:selectedGym?.address,icon:MapPin2,rgb:'96,165,250',c:'#60a5fa'},
            {l:'Postcode',v:selectedGym?.postcode,icon:Pin,rgb:'248,113,113',c:'#f87171'},
          ].map((f,i)=>(
            <div key={i} className="relative overflow-hidden p-3.5 rounded-xl" style={{background:`rgba(${f.rgb},0.06)`,border:`1px solid rgba(${f.rgb},0.18)`}}>
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:2,background:`linear-gradient(180deg,rgba(${f.rgb},0.6),transparent)`}}/>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{background:`rgba(${f.rgb},0.14)`,border:`1px solid rgba(${f.rgb},0.25)`}}>
                  <f.icon style={{width:11,height:11,color:f.c}}/>
                </div>
                <p className="text-xs uppercase tracking-wide font-bold" style={{color:`rgba(${f.rgb},0.55)`}}>{f.l}</p>
              </div>
              <p className="text-sm font-semibold text-white truncate pl-0.5">{f.v||'—'}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PH title="Manage Gym" subtitle="Update facilities, staff and settings"/>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionBtn icon={Calendar} label="Classes"   sub={`${classes.length} total`}                  color="#34d399" rgb="52,211,153"   floor="#064e3b" onClick={()=>openModal('classes')}/>
          <ActionBtn icon={Users}    label="Coaches"   sub={`${coaches.length} total`}                  color="#60a5fa" rgb="96,165,250"   floor="#1e3a8a" onClick={()=>openModal('coaches')}/>
          <ActionBtn icon={Dumbbell} label="Equipment" sub={`${selectedGym?.equipment?.length||0} items`}   color="#a78bfa" rgb="167,139,250" floor="#4c1d95" onClick={()=>openModal('equipment')}/>
          <ActionBtn icon={Star}     label="Amenities" sub={`${selectedGym?.amenities?.length||0} listed`}  color="#fbbf24" rgb="251,191,36"  floor="#78350f" onClick={()=>openModal('amenities')}/>
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Classes" badge={classes.length} action={()=>openModal('classes')} actionLabel="Manage"/>
          {classes.length > 0 ? (
            <div className="space-y-2">
              {classes.slice(0,6).map(cls=>(
                <div key={cls.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border" style={{background:BG.subcard,borderColor:BORDER.subtle}}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(52,211,153,0.12)',border:'1px solid rgba(52,211,153,0.22)'}}><Calendar className="w-4 h-4 text-emerald-400"/></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{cls.name}</p><p className="text-xs" style={{color:'#3d5a8a'}}>{cls.schedule||cls.time||'—'}</p></div>
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
                <div key={coach.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border" style={{background:BG.subcard,borderColor:BORDER.subtle}}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{coach.name?.charAt(0)?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{coach.name}</p><p className="text-xs truncate" style={{color:'#3d5a8a'}}>{coach.speciality||coach.bio||'Coach'}</p></div>
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

      <Panel>
        <PH title="Photo Gallery" badge={selectedGym?.gallery?.length||0} action={()=>openModal('photos')} actionLabel="Manage Photos"/>
        {selectedGym?.gallery?.length > 0 ? (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {selectedGym.gallery.map((url,i)=><img key={i} src={url} alt="" className="w-full h-16 object-cover rounded-lg border" style={{borderColor:BORDER.subtle}}/>)}
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 rounded-xl border" style={{background:BG.subcard,borderColor:BORDER.subtle}}>
            <ImageIcon className="w-6 h-6 flex-shrink-0" style={{color:'#3d5a8a'}}/>
            <p className="text-sm" style={{color:'#6b87b8'}}>No photos yet. Add photos to attract more members.</p>
            <button onClick={()=>openModal('photos')} className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0" style={{background:'rgba(59,130,246,0.15)',color:'#93c5fd',border:'1px solid rgba(59,130,246,0.3)'}}>Add Photos</button>
          </div>
        )}
      </Panel>

      <Panel>
        <PH title="Admin"/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {[{l:'Owner Email',v:selectedGym?.owner_email},{l:'Gym ID',v:selectedGym?.id,mono:true},{l:'Status',v:selectedGym?.verified?'✓ Verified':'Not Verified',c:selectedGym?.verified?'#34d399':'#f87171'}].map((f,i)=>(
            <div key={i} className="p-3.5 rounded-xl border" style={{background:BG.subcard,borderColor:BORDER.subtle}}>
              <p className="text-xs uppercase tracking-wide mb-1.5" style={{color:'#3d5a8a'}}>{f.l}</p>
              <p className={`text-sm font-semibold ${f.mono?'font-mono text-xs break-all':''}`} style={{color:f.c||'white'}}>{f.v||'—'}</p>
            </div>
          ))}
        </div>
        <Link to={createPageUrl('GymCommunity')+'?id='+selectedGym?.id}>
          <button className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-125 border" style={{background:BG.subcard,color:'#93b4e8',borderColor:BORDER.panel}}>View Public Gym Page →</button>
        </Link>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[
          {title:'Delete Gym',    desc:'Permanently delete this gym and all its data.',  label:'Delete Gym',    fn:()=>openModal('deleteGym')},
          {title:'Delete Account',desc:'Permanently delete your account and all gyms.',   label:'Delete Account',fn:()=>openModal('deleteAccount')},
        ].map((d,i)=>(
          <div key={i} className="p-5 rounded-2xl" style={{background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.18)'}}>
            <div className="flex items-center gap-2 mb-2"><Trash2 className="w-4 h-4 text-red-400"/><h4 className="font-bold text-white text-sm">{d.title}</h4></div>
            <p className="text-xs mb-4" style={{color:'#6b87b8'}}>{d.desc}</p>
            <button onClick={d.fn} className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110" style={{background:'rgba(239,68,68,0.12)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.3)'}}>{d.label}</button>
          </div>
        ))}
      </div>
    </div>
    </div>{/* end desktop */}
    </>
  );

  const TABS = { overview: <TabOverview/>, members: <TabMembers/>, content: <TabContent/>, analytics: <TabAnalytics/>, gym: <TabGym/> };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{background: BG.page, fontFamily:"'DM Sans','Inter',sans-serif"}}>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{background:BG.sidebar,backdropFilter:'blur(16px)',borderColor:BORDER.active,paddingBottom:'env(safe-area-inset-bottom)'}}>
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
        style={{width:collapsed?64:224, background:BG.sidebar, backdropFilter:'blur(20px)', borderRight:`1px solid ${BORDER.active}`}}>
        <div className="px-4 py-5 border-b flex-shrink-0" style={{borderColor:BORDER.panel}}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0"><Dumbbell className="w-4 h-4 text-white"/></div>
            {!collapsed && <div className="min-w-0 flex-1"><p className="text-sm font-black text-white truncate leading-tight">{selectedGym?.name||'Dashboard'}</p><p className="text-xs" style={{color:'#3d5a8a'}}>Gym Owner</p></div>}
          </div>
          {!collapsed && approvedGyms.length > 1 && (
            <div className="mt-3 relative">
              <button onClick={()=>setGymOpen(o=>!o)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold" style={{background:BG.subcard,color:'#93b4e8',border:`1px solid ${BORDER.subtle}`}}>
                <span className="truncate">{selectedGym?.name}</span><ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${gymOpen?'rotate-180':''}`}/>
              </button>
              {gymOpen && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl z-20" style={{background:'rgba(2,4,10,0.98)',border:`1px solid ${BORDER.active}`}}>
                  {approvedGyms.map(g=>(<button key={g.id} onClick={()=>{setSelectedGym(g);setGymOpen(false);}} className="w-full text-left px-3 py-2.5 text-xs font-semibold transition-all hover:brightness-125" style={{color:selectedGym?.id===g.id?'#60a5fa':'#93b4e8',background:selectedGym?.id===g.id?'rgba(59,130,246,0.1)':'transparent'}}>{g.name}</button>))}
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item=>{const active=tab===item.id;return(
            <button key={item.id} onClick={()=>setTab(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{background:active?'rgba(59,130,246,0.14)':'transparent',color:active?'#fff':'#6b87b8',border:active?`1px solid ${BORDER.active}`:'1px solid transparent'}}>
              <item.icon className="w-4 h-4 flex-shrink-0" style={{color:active?'#60a5fa':'inherit'}}/>
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {!collapsed && active && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"/>}
            </button>
          );})}
        </nav>

        {!collapsed && (
          <div className="px-2.5 pb-2.5 flex-shrink-0">
            <Link to={createPageUrl('Plus')}>
              <div className="p-3 rounded-xl cursor-pointer transition-all hover:brightness-110" style={{background:'linear-gradient(135deg,rgba(139,92,246,0.18),rgba(236,72,153,0.12))',border:'1px solid rgba(139,92,246,0.28)'}}>
                <div className="flex items-center gap-2 mb-0.5"><Crown className="w-3.5 h-3.5 text-purple-400"/><span className="text-xs font-black text-white">Retention Pro</span></div>
                <p className="text-xs" style={{color:'#9b7de0'}}>From £49.99/mo</p>
              </div>
            </Link>
          </div>
        )}

        <div className="px-2.5 pb-4 pt-2 border-t space-y-0.5 flex-shrink-0" style={{borderColor:BORDER.panel}}>
          <Link to={createPageUrl('GymCommunity')+'?id='+selectedGym?.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:text-white" style={{color:'#6b87b8'}}>
            <Eye className="w-4 h-4 flex-shrink-0"/>{!collapsed && 'View Gym Page'}
          </Link>
          <Link to={createPageUrl('Home')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:text-white" style={{color:'#6b87b8'}}>
            <Users className="w-4 h-4 flex-shrink-0"/>{!collapsed && 'Member View'}
          </Link>
          <button onClick={()=>base44.auth.logout()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold" style={{color:'#f87171'}}>
            <LogOut className="w-4 h-4 flex-shrink-0"/>{!collapsed && 'Log Out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-3.5 flex-shrink-0 border-b"
          style={{background:BG.header, backdropFilter:'blur(20px)', borderColor:BORDER.active}}>
          <div className="flex items-center gap-3">
            <button onClick={()=>setCollapsed(o=>!o)}
              className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center transition-all hover:brightness-125"
              style={{background:BG.subcard, color:'#94a3b8', border:`1px solid ${BORDER.subtle}`}}>
              <Menu className="w-4 h-4"/>
            </button>
            <div>
              <h1 className="text-sm md:text-base font-black text-white leading-tight">{selectedGym?.name || 'Dashboard'}</h1>
              <p className="text-xs hidden md:block" style={{color:'#3d5a8a'}}>{format(now,'EEEE, d MMMM yyyy')}</p>
              <p className="text-xs md:hidden" style={{color:'#4a6492'}}>{NAV.find(n=>n.id===tab)?.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {atRisk > 0 && (
              <button onClick={()=>setTab('members')} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(249,115,22,0.1)',color:'#fb923c',border:'1px solid rgba(249,115,22,0.25)'}}>
                <AlertTriangle className="w-3.5 h-3.5"/><span className="hidden sm:inline">{atRisk} at risk</span><span className="sm:hidden">{atRisk}</span>
              </button>
            )}
            <button onClick={()=>openModal('qrScanner')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(16,185,129,0.1)',color:'#34d399',border:'1px solid rgba(16,185,129,0.25)'}}>
              <QrCode className="w-3.5 h-3.5"/><span className="hidden sm:inline">Scan QR</span>
            </button>
            <button onClick={()=>openModal('post')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(59,130,246,0.15)',color:'#93c5fd',border:`1px solid ${BORDER.active}`}}>
              <Pencil className="w-3.5 h-3.5"/><span className="hidden sm:inline">New Post</span>
            </button>
            {selectedGym?.join_code ? (
              <button onClick={()=>openModal('qrCode')} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest" style={{background:BG.subcard,color:'#93b4e8',border:`1px solid ${BORDER.subtle}`}}>{selectedGym.join_code}</button>
            ) : (
              <button onClick={async()=>{try{const r=await base44.functions.invoke('generateGymJoinCode',{gym_id:selectedGym.id});if(r.data?.success)invGyms();}catch{}}} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(16,185,129,0.1)',color:'#34d399',border:'1px solid rgba(16,185,129,0.25)'}}>
                <Plus className="w-3.5 h-3.5"/>Generate Code
              </button>
            )}
            {selectedGym?.verified && (
              <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(59,130,246,0.1)',color:'#93c5fd',border:`1px solid ${BORDER.active}`}}>
                <Shield className="w-3.5 h-3.5"/>Verified
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 pb-24 md:pb-6" style={{background:'transparent'}}>
          <div className="max-w-[1400px] mx-auto">{TABS[tab] || TABS.overview}</div>
        </main>
      </div>

      {/* Modals */}
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
        <AlertDialogContent style={{background:'rgba(2,4,10,0.98)',borderColor:'rgba(239,68,68,0.3)'}} className="max-w-md">
          <AlertDialogHeader><AlertDialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400"/>Delete Gym Permanently?</AlertDialogTitle><AlertDialogDescription className="text-sm" style={{color:'#6b87b8'}}>Deletes <span className="font-bold text-white">{selectedGym?.name}</span> and all check-ins, classes, rewards and member data. <span className="text-red-400 font-semibold">Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel style={{background:BG.subcard,color:'#93b4e8',borderColor:BORDER.subtle}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteGymM.mutate()} disabled={deleteGymM.isPending} className="bg-red-600 hover:bg-red-700 text-white">{deleteGymM.isPending?'Deleting…':'Delete Permanently'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={modal==='deleteAccount'} onOpenChange={v=>!v&&closeModal()}>
        <AlertDialogContent style={{background:'rgba(2,4,10,0.98)',borderColor:'rgba(239,68,68,0.3)'}} className="max-w-md">
          <AlertDialogHeader><AlertDialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400"/>Delete Account?</AlertDialogTitle><AlertDialogDescription className="text-sm" style={{color:'#6b87b8'}}>Deletes your account, all gyms, and personal data. <span className="text-red-400 font-semibold">Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel style={{background:BG.subcard,color:'#93b4e8',borderColor:BORDER.subtle}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteAccountM.mutate()} disabled={deleteAccountM.isPending} className="bg-red-700 hover:bg-red-800 text-white">{deleteAccountM.isPending?'Deleting…':'Delete Account'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {modal==='qrCode' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(2,4,10,0.9)',backdropFilter:'blur(8px)'}}>
          <div className="rounded-3xl p-8 max-w-sm w-full shadow-2xl" style={{background:'rgba(2,4,10,0.98)',border:`1px solid ${BORDER.active}`}}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-black text-white">Gym Join QR Code</h3><button onClick={closeModal} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:BG.subcard,color:'#94a3b8',border:`1px solid ${BORDER.subtle}`}}><X className="w-4 h-4"/></button></div>
            <div id="qr-fullscreen" className="flex justify-center p-6 rounded-2xl bg-white mb-5"><QRCode value={`${window.location.origin}${createPageUrl('Gyms')}?joinCode=${selectedGym?.join_code}`} size={260} level="H"/></div>
            <p className="text-center text-sm mb-5" style={{color:'#6b87b8'}}>Join code: <span className="font-black text-white tracking-widest">{selectedGym?.join_code}</span></p>
            <div className="space-y-2.5">
              <button onClick={()=>dlQR('qr-fullscreen')} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white" style={{background:'linear-gradient(135deg,#10b981,#0d9488)'}}><Download className="w-4 h-4"/>Download QR Code</button>
              <button onClick={closeModal} className="w-full py-3 rounded-xl font-semibold text-sm border" style={{background:BG.subcard,color:'#93b4e8',borderColor:BORDER.subtle}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}