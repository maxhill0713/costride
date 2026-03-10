import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LeaderboardSection from '@/components/dashboard/LeaderboardSection';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Trophy, Calendar, Star, Target, Activity,
  Plus, Image as ImageIcon, Dumbbell, CheckCircle, Download, Pencil,
  X, Crown, Trash2, Clock, Gift, Zap, BarChart2, Shield,
  Eye, Menu, LayoutDashboard, FileText, BarChart3, Settings,
  LogOut, ChevronDown, AlertTriangle, QrCode, MessageSquarePlus,
  DollarSign, UserPlus, ChevronRight, Megaphone, Pin, Flame
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
  { id:'overview',  label:'Overview',    icon:LayoutDashboard },
  { id:'members',   label:'Members',     icon:Users },
  { id:'content',   label:'Content',     icon:FileText },
  { id:'analytics', label:'Analytics',   icon:BarChart3 },
  { id:'gym',       label:'Gym Settings',icon:Settings },
];

// ─── KPI Card — premium with per-metric colour atmosphere + left accent bar ──
const KpiCard = ({ icon:Icon, iconColor, iconRgb='59,130,246', label, value, sub, trend }) => {
  const [hov,setHov]=React.useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        position:'relative',overflow:'hidden',borderRadius:20,
        background:'linear-gradient(145deg,#0d1e35 0%,#060d1f 100%)',
        border:`1px solid ${hov?`rgba(${iconRgb},0.25)`:'rgba(255,255,255,0.07)'}`,
        boxShadow:hov?`0 12px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(${iconRgb},0.12)`:'0 8px 32px rgba(0,0,0,0.45)',
        transition:'border-color 0.2s,box-shadow 0.2s,transform 0.2s',
        transform:hov?'translateY(-2px)':'translateY(0)',
      }}>
      {/* atmosphere orbs */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',borderRadius:20}}>
        <div style={{position:'absolute',top:-40,left:-30,width:180,height:180,borderRadius:'50%',background:`radial-gradient(circle,rgba(${iconRgb},0.14) 0%,transparent 70%)`}}/>
        <div style={{position:'absolute',bottom:-50,right:-30,width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.06) 0%,transparent 70%)'}}/>
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'22px 22px'}}/>
      </div>
      {/* shimmer */}
      <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:`linear-gradient(90deg,transparent,rgba(${iconRgb},0.45),transparent)`,pointerEvents:'none'}}/>
      {/* left accent */}
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:`linear-gradient(180deg,rgba(${iconRgb},0.75) 0%,transparent 100%)`}}/>
      <div style={{position:'relative',padding:'18px 20px 16px 22px'}}>
      {/* Row 1: icon + label + trend */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:34,height:34,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`rgba(${iconRgb},0.14)`,border:`1px solid rgba(${iconRgb},0.25)`,boxShadow:'0 4px 12px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.08)',flexShrink:0}}>
            <Icon style={{width:16,height:16,color:iconColor}}/>
          </div>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(148,163,184,0.65)'}}>{label}</div>
        </div>
        </div>
        {/* Row 2: big value + trend inline */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
        <div style={{fontSize:34,fontWeight:900,color:'#fff',letterSpacing:'-0.04em',lineHeight:1}}>{value}</div>
        {trend!==undefined&&(
          <span style={{display:'flex',alignItems:'center',gap:3,fontSize:12,fontWeight:800,padding:'3px 8px',borderRadius:99,background:trend>=0?'rgba(16,185,129,0.12)':'rgba(248,113,113,0.12)',color:trend>=0?'#34d399':'#f87171',border:`1px solid ${trend>=0?'rgba(16,185,129,0.25)':'rgba(248,113,113,0.25)'}`}}>
            {trend>=0?<TrendingUp style={{width:10,height:10}}/>:<TrendingDown style={{width:10,height:10}}/>}{Math.abs(trend)}%
          </span>
        )}
      </div>
      {/* Row 3: sub */}
      {sub&&<div style={{fontSize:11,color:'rgba(100,130,170,0.7)',fontWeight:500}}>{sub}</div>}
      </div>
    </div>
  );
};

// ─── Panel ────────────────────────────────────────────────────────────────────
const Panel = ({ children, className='' }) => (
  <div className={`relative overflow-hidden rounded-2xl ${className}`}
    style={{
      background:'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
      border:'1px solid rgba(255,255,255,0.07)',
      backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)',
      boxShadow:'0 4px 24px rgba(0,0,0,0.4)',
    }}>
    <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
      style={{background:'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.1) 50%,transparent 90%)'}}/>
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

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const DT = ({ active, payload, label }) => {
  if(!active||!payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-2xl text-xs" style={{background:'#02040a',border:`1px solid ${BORDER.active}`}}>
      <p className="mb-1" style={{color:'#6b87b8'}}>{label}</p>
      {payload.map((p,i)=><p key={i} className="font-bold" style={{color:p.color}}>{p.value} {p.name}</p>)}
    </div>
  );
};

// ─── Tag ─────────────────────────────────────────────────────────────────────
const Tag = ({ children, color='blue' }) => {
  const m={blue:['rgba(59,130,246,0.15)','#93c5fd','rgba(59,130,246,0.25)'],green:['rgba(16,185,129,0.15)','#6ee7b7','rgba(16,185,129,0.25)'],orange:['rgba(249,115,22,0.15)','#fdba74','rgba(249,115,22,0.25)'],red:['rgba(239,68,68,0.15)','#fca5a5','rgba(239,68,68,0.25)'],purple:['rgba(139,92,246,0.15)','#c4b5fd','rgba(139,92,246,0.25)']};
  const [bg,text,border]=m[color]||m.blue;
  return <span className="text-xs px-2 py-0.5 rounded-md font-bold" style={{background:bg,color:text,border:`1px solid ${border}`}}>{children}</span>;
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const Empty = ({ icon:Icon, label }) => (
  <div className="py-10 text-center">
    <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{background:'rgba(59,130,246,0.07)',border:'1px solid rgba(59,130,246,0.14)'}}>
      <Icon className="w-5 h-5" style={{color:'rgba(59,130,246,0.4)'}}/>
    </div>
    <p className="text-xs" style={{color:'#3d5a8a'}}>{label}</p>
  </div>
);

// ─── Alert Card — left accent bar style ──────────────────────────────────────
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

// ─── 3D Action Button — Duolingo-style matching rest of CoStride ──────────────
const ActionBtn = ({ icon:Icon, label, sub, color, rgb, floor, onClick }) => {
  const [pressed,setPressed]=React.useState(false);
  return (
    <button onClick={onClick}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)}
      onMouseLeave={()=>setPressed(false)} onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{
        display:'flex',flexDirection:'column',alignItems:'flex-start',
        gap:10,padding:'16px 16px 14px',borderRadius:16,
        background:`linear-gradient(145deg,rgba(${rgb},0.14),rgba(${rgb},0.07))`,
        border:`1px solid rgba(${rgb},0.3)`,
        borderBottom:pressed?`1px solid rgba(${rgb},0.15)`:`4px solid ${floor}`,
        boxShadow:pressed?'0 1px 4px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.05)':`0 6px 20px rgba(0,0,0,0.3),0 0 0 1px rgba(${rgb},0.08),inset 0 1px 0 rgba(255,255,255,0.08)`,
        transform:pressed?'translateY(3px) scale(0.99)':'translateY(0) scale(1)',
        transition:'transform 0.1s,box-shadow 0.1s,border-bottom 0.1s',
        cursor:'pointer',width:'100%',textAlign:'left',position:'relative',overflow:'hidden',
      }}>
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

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
export default function GymOwnerDashboard() {
  const [tab,setTab]=useState('overview');
  const [ciChartRange,setCiChartRange]=useState('7d');
  const [collapsed,setCollapsed]=useState(false);
  const [selectedGym,setSelectedGym]=useState(null);
  const [gymOpen,setGymOpen]=useState(false);
  const [announcement,setAnnouncement]=useState('');
  const [announcementSaving,setAnnouncementSaving]=useState(false);
  const [modal,setModal]=useState(null);
  const openModal=(n)=>setModal(n);
  const closeModal=()=>setModal(null);

  const queryClient=useQueryClient();
  const navigate=useNavigate();

  const {data:currentUser}=useQuery({queryKey:['currentUser'],queryFn:()=>base44.auth.me(),staleTime:5*60*1000});
  React.useEffect(()=>{if(currentUser&&!currentUser.onboarding_completed)navigate(createPageUrl('Onboarding'));},[currentUser,navigate]);

  const {data:gyms=[],error:gymsError}=useQuery({queryKey:['ownerGyms',currentUser?.email],queryFn:()=>base44.entities.Gym.filter({owner_email:currentUser.email}),enabled:!!currentUser?.email,retry:3,staleTime:5*60*1000});
  const myGyms=gyms.filter(g=>g.owner_email===currentUser?.email);
  const approvedGyms=myGyms.filter(g=>g.status==='approved');
  const pendingGyms=myGyms.filter(g=>g.status==='pending');

  React.useEffect(()=>{if(approvedGyms.length>0&&!selectedGym)setSelectedGym(approvedGyms[0]);},[approvedGyms,selectedGym]);
  React.useEffect(()=>{const iv=setInterval(()=>queryClient.invalidateQueries({queryKey:['ownerGyms']}),10000);return()=>clearInterval(iv);},[queryClient]);

  const qo={staleTime:3*60*1000,placeholderData:p=>p};
  const on=!!selectedGym;
  const {data:allMemberships=[]}=useQuery({queryKey:['memberships',selectedGym?.id],queryFn:()=>base44.entities.GymMembership.filter({gym_id:selectedGym.id,status:'active'}),enabled:on&&!!currentUser,...qo});
  const {data:checkIns=[]}=useQuery({queryKey:['checkIns',selectedGym?.id],queryFn:()=>base44.entities.CheckIn.filter({gym_id:selectedGym.id},'-check_in_date',2000),enabled:on,...qo});
  const {data:lifts=[]}=useQuery({queryKey:['lifts',selectedGym?.id],queryFn:()=>base44.entities.Lift.filter({gym_id:selectedGym.id},'-lift_date',200),enabled:on,...qo});
  const {data:rewards=[]}=useQuery({queryKey:['rewards',selectedGym?.id],queryFn:()=>base44.entities.Reward.filter({gym_id:selectedGym.id}),enabled:on,...qo});
  const {data:classes=[]}=useQuery({queryKey:['classes',selectedGym?.id],queryFn:()=>base44.entities.GymClass.filter({gym_id:selectedGym.id}),enabled:on,...qo});
  const {data:coaches=[]}=useQuery({queryKey:['coaches',selectedGym?.id],queryFn:()=>base44.entities.Coach.filter({gym_id:selectedGym.id}),enabled:on,...qo});
  const {data:events=[]}=useQuery({queryKey:['events',selectedGym?.id],queryFn:()=>base44.entities.Event.filter({gym_id:selectedGym.id},'-event_date'),enabled:on,...qo});
  const {data:posts=[]}=useQuery({queryKey:['posts',selectedGym?.id],queryFn:()=>base44.entities.Post.filter({member_id:selectedGym.id},'-created_date',20),enabled:on,...qo});
  const {data:challenges=[]}=useQuery({queryKey:['challenges',selectedGym?.id],queryFn:()=>base44.entities.Challenge.filter({gym_id:selectedGym.id},'-created_date'),enabled:on,...qo});
  const {data:polls=[]}=useQuery({queryKey:['polls',selectedGym?.id],queryFn:()=>base44.entities.Poll.filter({gym_id:selectedGym.id,status:'active'},'-created_date'),enabled:on,...qo});

  const inv=(...keys)=>keys.forEach(k=>queryClient.invalidateQueries({queryKey:[k,selectedGym?.id]}));
  const invGyms=()=>queryClient.invalidateQueries({queryKey:['gyms']});

  const createRewardM=useMutation({mutationFn:d=>base44.entities.Reward.create(d),onSuccess:()=>inv('rewards')});
  const deleteRewardM=useMutation({mutationFn:id=>base44.entities.Reward.delete(id),onSuccess:()=>inv('rewards')});
  const createClassM=useMutation({mutationFn:d=>base44.entities.GymClass.create(d),onSuccess:()=>inv('classes')});
  const deleteClassM=useMutation({mutationFn:id=>base44.entities.GymClass.delete(id),onSuccess:()=>inv('classes')});
  const updateClassM=useMutation({mutationFn:({id,data})=>base44.entities.GymClass.update(id,data),onSuccess:()=>inv('classes')});
  const createCoachM=useMutation({mutationFn:d=>base44.entities.Coach.create(d),onSuccess:()=>inv('coaches')});
  const deleteCoachM=useMutation({mutationFn:id=>base44.entities.Coach.delete(id),onSuccess:()=>inv('coaches')});
  const updateGalleryM=useMutation({mutationFn:g=>base44.entities.Gym.update(selectedGym.id,{gallery:g}),onSuccess:()=>{invGyms();closeModal();}});
  const updateGymM=useMutation({mutationFn:d=>base44.entities.Gym.update(selectedGym.id,d),onSuccess:()=>{invGyms();closeModal();}});
  const createEventM=useMutation({mutationFn:d=>base44.entities.Event.create({...d,gym_id:selectedGym.id,gym_name:selectedGym.name,attendees:0}),onSuccess:()=>{inv('events');closeModal();}});
  const createChallengeM=useMutation({mutationFn:d=>base44.entities.Challenge.create({...d,gym_id:selectedGym.id,gym_name:selectedGym.name,participants:[],status:'upcoming'}),onSuccess:()=>{inv('challenges');closeModal();}});
  const banMemberM=useMutation({mutationFn:uid=>base44.entities.Gym.update(selectedGym.id,{banned_members:[...(selectedGym?.banned_members||[]),uid]}),onSuccess:invGyms});
  const unbanMemberM=useMutation({mutationFn:uid=>base44.entities.Gym.update(selectedGym.id,{banned_members:(selectedGym?.banned_members||[]).filter(id=>id!==uid)}),onSuccess:invGyms});
  const deleteGymM=useMutation({mutationFn:()=>base44.entities.Gym.delete(selectedGym.id),onSuccess:()=>{invGyms();closeModal();window.location.href=createPageUrl('Gyms');}});
  const deleteAccountM=useMutation({mutationFn:()=>base44.functions.invoke('deleteUserAccount'),onSuccess:()=>{closeModal();base44.auth.logout();}});
  const createPollM=useMutation({mutationFn:d=>base44.entities.Poll.create({...d,gym_id:selectedGym.id,gym_name:selectedGym.name,created_by:currentUser.id,voters:[]}),onSuccess:()=>{inv('polls');closeModal();}});

  // Avatar map: user_id → avatar_url (from memberships)
  const memberAvatarMap = useMemo(()=>{
    const map={};
    allMemberships.forEach(m=>{ if(m.user_id&&m.avatar_url) map[m.user_id]=m.avatar_url; });
    return map;
  },[allMemberships]);

  const Avatar=({userId,name,size=8})=>{
    const src=memberAvatarMap[userId];
    const cls=`w-${size} h-${size} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-black`;
    const style={background:'linear-gradient(135deg,#3b82f6,#06b6d4)',fontSize:size<=7?10:12};
    if(src) return <img src={src} alt={name} className={cls} style={{objectFit:'cover'}}/>;
    return <div className={cls} style={style}>{name?.charAt(0)?.toUpperCase()}</div>;
  };

  // ── Splashes ───────────────────────────────────────────────────────────────
  const Splash=({children})=>(<div className="min-h-screen flex items-center justify-center p-4" style={{background:BG.page}}><Panel className="max-w-md w-full text-center">{children}</Panel></div>);
  if(gymsError)return <Splash><div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)'}}><X className="w-7 h-7 text-red-400"/></div><h2 className="text-xl font-black text-white mb-2">Error</h2><p className="text-sm mb-6" style={{color:'#6b87b8'}}>{gymsError.message}</p><Button onClick={()=>window.location.reload()} className="bg-blue-600 hover:bg-blue-500 text-white">Retry</Button></Splash>;
  if(approvedGyms.length===0&&pendingGyms.length>0)return <Splash><div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{background:'rgba(234,179,8,0.1)',border:'1px solid rgba(234,179,8,0.25)'}}><Clock className="w-7 h-7 text-yellow-400"/></div><h2 className="text-xl font-black text-white mb-2">Pending Approval</h2><p className="text-sm mb-6" style={{color:'#6b87b8'}}>Your gym <span className="text-yellow-400 font-bold">{pendingGyms[0].name}</span> is under review.</p><Link to={createPageUrl('Home')}><Button style={{background:'rgba(13,35,96,0.6)',color:'#93b4e8'}}>Back to Home</Button></Link></Splash>;
  if(myGyms.length===0)return <Splash><div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.25)'}}><Dumbbell className="w-7 h-7 text-blue-400"/></div><h2 className="text-xl font-black text-white mb-2">No Gyms</h2><p className="text-sm mb-6" style={{color:'#6b87b8'}}>Register your gym to get started.</p><Link to={createPageUrl('GymSignup')}><Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">Register Your Gym</Button></Link></Splash>;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const now=new Date();
  const ci7=checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:subDays(now,7),end:now}));
  const ci30=checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:subDays(now,30),end:now}));
  const ciPrev30=checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:subDays(now,60),end:subDays(now,30)}));
  const todayCI=checkIns.filter(c=>startOfDay(new Date(c.check_in_date)).getTime()===startOfDay(now).getTime()).length;
  const totalMembers=allMemberships.length;
  const activeThisWeek=new Set(ci7.map(c=>c.user_id)).size;
  const activeLastWeek=new Set(checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:subDays(now,14),end:subDays(now,7)})).map(c=>c.user_id)).size;
  const weeklyChangePct=activeLastWeek>0?Math.round(((activeThisWeek-activeLastWeek)/activeLastWeek)*100):0;
  const activeThisMonth=new Set(ci30.map(c=>c.user_id)).size;
  const retentionRate=totalMembers>0?Math.round((activeThisMonth/totalMembers)*100):0;
  const monthCiPer=(()=>{const acc={};ci30.forEach(c=>{acc[c.user_id]=(acc[c.user_id]||0)+1;});return Object.values(acc);})();
  const memberLastCheckIn={};
  checkIns.forEach(c=>{if(!memberLastCheckIn[c.user_id]||new Date(c.check_in_date)>new Date(memberLastCheckIn[c.user_id]))memberLastCheckIn[c.user_id]=c.check_in_date;});
  const atRisk=allMemberships.filter(m=>{const last=memberLastCheckIn[m.user_id];if(!last)return true;return Math.floor((now-new Date(last))/86400000)>=14;}).length;
  const monthChangePct=ciPrev30.length>0?Math.round(((ci30.length-ciPrev30.length)/ciPrev30.length)*100):0;
  const newSignUps=allMemberships.filter(m=>isWithinInterval(new Date(m.join_date||m.created_date||now),{start:subDays(now,30),end:now})).length;
  const newSignUpsPrev=allMemberships.filter(m=>isWithinInterval(new Date(m.join_date||m.created_date||now),{start:subDays(now,60),end:subDays(now,30)})).length;
  const newSignUpsPct=newSignUpsPrev>0?Math.round(((newSignUps-newSignUpsPrev)/newSignUpsPrev)*100):0;
  const membershipPrice=parseFloat(selectedGym?.price)||0;
  const revenueDisplay=membershipPrice>0?`£${(allMemberships.length*membershipPrice).toLocaleString()}`:'—';
  const savedAnnouncements=selectedGym?.announcements||[];

  const saveAnnouncement=async()=>{if(!announcement.trim()||announcementSaving)return;setAnnouncementSaving(true);const updated=[{text:announcement.trim(),date:new Date().toISOString()},...savedAnnouncements].slice(0,10);await base44.entities.Gym.update(selectedGym.id,{announcements:updated});invGyms();setAnnouncement('');setAnnouncementSaving(false);};

  // Leaderboard data
  const checkInLeaderboard = Object.values(
    ci7.reduce((acc,c)=>{const id=c.user_id;if(!acc[id])acc[id]={userId:id,userName:c.user_name,count:0};acc[id].count++;return acc;},{})
  ).sort((a,b)=>b.count-a.count).slice(0,10);

  const calcStreak=(userId)=>{const uci=checkIns.filter(c=>c.user_id===userId).sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date));if(!uci.length)return 0;let s=1,cur=new Date(uci[0].check_in_date);cur.setHours(0,0,0,0);for(let i=1;i<uci.length;i++){const d=new Date(uci[i].check_in_date);d.setHours(0,0,0,0);const diff=Math.floor((cur-d)/86400000);if(diff===1){s++;cur=d;}else if(diff>1)break;}return s;};
  const streakLeaderboard = Object.values(ci7.reduce((acc,c)=>{const id=c.user_id;if(!acc[id])acc[id]={userId:id,userName:c.user_name};return acc;},{})).map(m=>({...m,streak:calcStreak(m.userId)})).sort((a,b)=>b.streak-a.streak).slice(0,10);
  const progressLeaderboard = [];

  const ciByDay=Array.from({length:7},(_,i)=>{const d=subDays(now,6-i);return{day:format(d,'EEE'),value:checkIns.filter(c=>startOfDay(new Date(c.check_in_date)).getTime()===startOfDay(d).getTime()).length};});
  const ciByDay30=Array.from({length:30},(_,i)=>{const d=subDays(now,29-i);return{day:format(d,'d MMM'),value:checkIns.filter(c=>startOfDay(new Date(c.check_in_date)).getTime()===startOfDay(d).getTime()).length};});
  const weekTrend=Array.from({length:12},(_,i)=>{const s=subDays(now,(11-i)*7),e=subDays(now,(10-i)*7);return{label:format(s,'MMM d'),value:checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).length};});
  const monthGrowth=Array.from({length:6},(_,i)=>{const e=subDays(now,i*30),s=subDays(e,30);return{label:format(e,'MMM'),value:new Set(checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).map(c=>c.user_id)).size};}).reverse();

  const dlQR=(id)=>{const svg=document.getElementById(id)?.querySelector('svg');if(!svg)return;const d=new XMLSerializer().serializeToString(svg);const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');const img=new Image();img.onload=()=>{canvas.width=img.width;canvas.height=img.height;ctx.drawImage(img,0,0);const a=document.createElement('a');a.download=`${selectedGym?.name}-QR.png`;a.href=canvas.toDataURL('image/png');a.click();};img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(d)));};

  // ══════════════════════════════════════════════════════════════════════════
  // OVERVIEW
  // ══════════════════════════════════════════════════════════════════════════
  const TabOverview=()=>(
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Dumbbell}   iconColor="#60a5fa" iconRgb="96,165,250"   label="Today's Check-ins"    value={todayCI}        sub="members in today" trend={(()=>{const yest=checkIns.filter(c=>startOfDay(new Date(c.check_in_date)).getTime()===startOfDay(subDays(now,1)).getTime()).length;return yest>0?Math.round(((todayCI-yest)/yest)*100):undefined;})()}/>
        <KpiCard icon={Users}      iconColor="#34d399" iconRgb="52,211,153"   label="Active This Week"     value={activeThisWeek} sub={`of ${totalMembers} members`} trend={weeklyChangePct}/>
        <KpiCard icon={Activity}   iconColor="#a78bfa" iconRgb="167,139,250"  label="Monthly Check-ins"    value={ci30.length}    sub={`${monthChangePct>=0?"+":""}${monthChangePct}% vs last month`} trend={monthChangePct}/>
        <KpiCard icon={UserPlus}   iconColor="#34d399" iconRgb="52,211,153"   label="New Sign-ups"         value={newSignUps}     sub="joined last 30 days" trend={newSignUpsPct}/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Check-ins — {ciChartRange==='7d'?'Last 7 Days':'Last 30 Days'}</h3>
              <p className="text-xs mt-0.5" style={{color:'#4a6492'}}>Daily attendance</p>
            </div>
            <div className="flex rounded-lg overflow-hidden border" style={{borderColor:'rgba(59,130,246,0.2)'}}>
              {[['7d','Last 7 Days'],['30d','Last 30 Days']].map(([val,lbl])=>(
                <button key={val} onClick={()=>setCiChartRange(val)}
                  className="px-3 py-1.5 text-xs font-bold transition-all"
                  style={{background:ciChartRange===val?'rgba(59,130,246,0.25)':'rgba(13,35,96,0.3)',color:ciChartRange===val?'#93c5fd':'#4a6492',border:'none',cursor:'pointer'}}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ciChartRange==='7d'?ciByDay:ciByDay30} barSize={ciChartRange==='7d'?34:16}>
              <defs><linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/><stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" vertical={false}/>
              <XAxis dataKey="day" tick={{fill:"#6b87b8",fontSize:11}} axisLine={false} tickLine={false} interval={ciChartRange==='30d'?3:0}/>
              <YAxis tick={{fill:"#6b87b8",fontSize:11}} axisLine={false} tickLine={false} width={24}/>
              <Tooltip content={<DT/>} cursor={{fill:"rgba(59,130,246,0.06)"}}/>
              <Bar dataKey="value" fill="url(#barFill)" radius={[6,6,0,0]} name="Check-ins"/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <PH title="Alerts & Actions"/>
          <div className="space-y-3">
            {atRisk>0
              ?<AlertCard icon={AlertTriangle} iconColor="#fb923c" iconRgb="249,115,22" title={`${atRisk} members at risk`} message="No check-in for 14+ days" action={()=>setTab("members")} actionLabel="View in Members"/>
              :<AlertCard icon={CheckCircle} iconColor="#34d399" iconRgb="52,211,153" title="No at-risk members" message="All members are staying active"/>}
            {!challenges.some(c=>c.status==="active")&&(
              <AlertCard icon={Trophy} iconColor="#60a5fa" iconRgb="96,165,250" title="No active challenges" message="Challenges boost retention significantly" action={()=>openModal("challenge")} actionLabel="Create one"/>
            )}
            {polls.length===0&&(
              <AlertCard icon={BarChart2} iconColor="#a78bfa" iconRgb="167,139,250" title="No active polls" message="Engage members with a quick poll" action={()=>openModal("poll")} actionLabel="Create one"/>
            )}
          </div>
        </Panel>
      </div>

      <Panel>
        <PH title="Recent Activity" subtitle="Latest check-ins"/>
        <div className="divide-y" style={{borderColor:'rgba(59,130,246,0.07)'}}>
          {ci7.slice(0,10).map((c,i)=>(
            <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar userId={c.user_id} name={c.user_name}/>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{c.user_name}</p><p className="text-xs" style={{color:'#3d5a8a'}}>checked in</p></div>
              <p className="text-xs flex-shrink-0" style={{color:'#3d5a8a'}}>{format(new Date(c.check_in_date),'MMM d, h:mma')}</p>
            </div>
          ))}
          {ci7.length===0&&<Empty icon={Activity} label="No check-ins in the last 7 days"/>}
        </div>
      </Panel>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MEMBERS
  // ══════════════════════════════════════════════════════════════════════════
  const TabMembers=()=>(
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Users}    iconColor="#60a5fa" iconRgb="96,165,250"  label="Total Members"    value={totalMembers}        sub="active memberships" trend={newSignUpsPct}/>
        <KpiCard icon={Zap}      iconColor="#34d399" iconRgb="52,211,153"  label="Active This Week" value={activeThisWeek}      trend={weeklyChangePct} sub="visited gym"/>
        <KpiCard icon={Activity} iconColor="#a78bfa" iconRgb="167,139,250" label="Retention Rate"   value={`${retentionRate}%`} sub="active last 30d" trend={(()=>{const prevActive=new Set(ciPrev30.map(c=>c.user_id)).size;const prevTotal=totalMembers>0?totalMembers:1;const prevRate=Math.round((prevActive/prevTotal)*100);return prevRate>0?retentionRate-prevRate:undefined;})()}/>
        <KpiCard icon={Trophy}   iconColor="#fbbf24" iconRgb="251,191,36"  label="PRs Logged"       value={lifts.filter(l=>l.is_pr).length} sub="personal records" trend={(()=>{const prev=lifts.filter(l=>l.is_pr&&isWithinInterval(new Date(l.lift_date||l.created_date||now),{start:subDays(now,60),end:subDays(now,30)})).length;const cur=lifts.filter(l=>l.is_pr&&isWithinInterval(new Date(l.lift_date||l.created_date||now),{start:subDays(now,30),end:now})).length;return prev>0?Math.round(((cur-prev)/prev)*100):undefined;})()}/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Engagement Tiers" subtitle="Based on last 30 days"/>
          <div className="grid grid-cols-2 gap-3">
            {[
              {label:'Super Active',sub:'15+ visits/mo',val:monthCiPer.filter(v=>v>=15).length,c:'#34d399',rgb:'52,211,153',e:'🔥'},
              {label:'Active',sub:'8–14 visits/mo',val:monthCiPer.filter(v=>v>=8&&v<15).length,c:'#60a5fa',rgb:'96,165,250',e:'💪'},
              {label:'Casual',sub:'1–7 visits/mo',val:monthCiPer.filter(v=>v>=1&&v<8).length,c:'#fbbf24',rgb:'251,191,36',e:'🚶'},
              {label:'At Risk',sub:'14d+ inactive',val:atRisk,c:'#f87171',rgb:'248,113,113',e:'⚠️'},
            ].map((t,i)=>(
              <div key={i} className="p-4 rounded-xl relative overflow-hidden" style={{background:`rgba(${t.rgb},0.07)`,border:`1px solid rgba(${t.rgb},0.2)`}}>
                <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:`linear-gradient(90deg,transparent,rgba(${t.rgb},0.4),transparent)`}}/>
                <p className="text-xl mb-2">{t.e}</p>
                <p className="text-3xl font-black mb-0.5" style={{color:t.c,letterSpacing:'-0.04em'}}>{t.val}</p>
                <p className="text-sm font-bold text-white">{t.label}</p>
                <p className="text-xs mt-0.5" style={{color:'#6b87b8'}}>{t.sub}</p>
              </div>
            ))}
          </div>
        </Panel>
        <div style={{maxHeight:420,overflow:'hidden',borderRadius:16}}>
          <LeaderboardSection checkInLeaderboard={checkInLeaderboard} streakLeaderboard={streakLeaderboard} progressLeaderboard={progressLeaderboard}/>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Busiest Days of the Week" subtitle="All-time check-in distribution"/>
          <div className="space-y-2.5">
            {(()=>{const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];const acc={};checkIns.forEach(c=>{const d=new Date(c.check_in_date).getDay();acc[d]=(acc[d]||0)+1;});const max=Math.max(...Object.values(acc),1);return days.map((name,idx)=>({name,count:acc[idx]||0})).sort((a,b)=>b.count-a.count).map(({name,count},rank)=>(
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs font-bold w-5 text-right flex-shrink-0" style={{color:'#3d5a8a'}}>#{rank+1}</span>
                <span className="text-sm text-white w-24 flex-shrink-0">{name}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(13,35,96,0.5)'}}>
                  <div className="h-full rounded-full" style={{background:'linear-gradient(90deg,#3b82f6,#22d3ee)',width:`${(count/max)*100}%`,boxShadow:'0 0 8px rgba(59,130,246,0.4)'}}/>
                </div>
                <span className="text-sm font-bold text-white w-7 text-right">{count}</span>
              </div>
            ));})()}
          </div>
        </Panel>
        <Panel>
          <PH title="Rewards Program" badge={rewards.length} action={()=>openModal("rewards")} actionLabel="Manage"/>
          {rewards.length>0?(
            <div className="space-y-2">
              {rewards.slice(0,6).map(r=>(
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl" style={{background:BG.subcard,border:`1px solid ${BORDER.subtle}`}}>
                  <span className="text-2xl flex-shrink-0">{r.icon||'🎁'}</span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">{r.title}</p><p className="text-xs" style={{color:'#6b87b8'}}>{r.claimed_by?.length||0} claimed · {r.value}</p></div>
                  <Tag color={r.active?'green':'blue'}>{r.active?'Active':'Off'}</Tag>
                </div>
              ))}
            </div>
          ):<Empty icon={Gift} label="No rewards yet — create some to boost retention"/>}
        </Panel>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ══════════════════════════════════════════════════════════════════════════
  const TabContent=()=>(
    <div className="space-y-5">
      <Panel>
        <PH title="Create Content" subtitle="Publish to your gym community"/>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionBtn icon={MessageSquarePlus} label="New Post"      sub="Share with members"   color="#60a5fa" rgb="96,165,250"   floor="#1e3a8a" onClick={()=>openModal("post")}/>
          <ActionBtn icon={Calendar}          label="New Event"     sub={`${events.filter(e=>new Date(e.event_date)>=now).length} upcoming`} color="#34d399" rgb="52,211,153" floor="#064e3b" onClick={()=>openModal("event")}/>
          <ActionBtn icon={Trophy}            label="New Challenge" sub={`${challenges.filter(c=>c.status==="active").length} active`} color="#fb923c" rgb="251,146,60" floor="#7c2d12" onClick={()=>openModal("challenge")}/>
          <ActionBtn icon={BarChart2}         label="New Poll"      sub={`${polls.length} active`} color="#a78bfa" rgb="167,139,250" floor="#4c1d95" onClick={()=>openModal("poll")}/>
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Recent Posts" badge={posts.length} action={()=>openModal("post")} actionLabel="New Post"/>
          {posts.length>0?(
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {posts.slice(0,10).map(p=>(
                <div key={p.id} className="p-3 rounded-xl" style={{background:BG.subcard,border:`1px solid ${BORDER.subtle}`}}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <Avatar userId={p.member_id} name={p.member_name} size={7}/>
                    <p className="text-sm font-semibold text-white flex-1">{p.member_name}</p>
                    <p className="text-xs" style={{color:'#3d5a8a'}}>{format(new Date(p.created_date),'MMM d')}</p>
                  </div>
                  <p className="text-xs line-clamp-2 mb-2" style={{color:'#6b87b8'}}>{p.content}</p>
                  <div className="flex gap-4 text-xs" style={{color:'#3d5a8a'}}><span>❤️ {p.likes||0}</span><span>💬 {p.comments?.length||0}</span></div>
                </div>
              ))}
            </div>
          ):<Empty icon={FileText} label="No posts yet — share an update with your members"/>}
        </Panel>
        <Panel>
          <PH title="Upcoming Events" badge={events.filter(e=>new Date(e.event_date)>=now).length} action={()=>openModal("event")} actionLabel="New Event"/>
          {events.filter(e=>new Date(e.event_date)>=now).length>0?(
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {events.filter(e=>new Date(e.event_date)>=now).map(ev=>(
                <div key={ev.id} className="p-3 rounded-xl" style={{background:BG.subcard,border:`1px solid ${BORDER.subtle}`}}>
                  {ev.image_url&&<img src={ev.image_url} alt={ev.title} className="w-full h-20 object-cover rounded-lg mb-2"/>}
                  <p className="text-sm font-bold text-white mb-1 truncate">{ev.title}</p>
                  <p className="text-xs line-clamp-2 mb-2" style={{color:'#6b87b8'}}>{ev.description}</p>
                  <div className="flex gap-3 text-xs" style={{color:'#3d5a8a'}}><span>📅 {format(new Date(ev.event_date),'MMM d, h:mma')}</span><span>👥 {ev.attendees||0}</span></div>
                </div>
              ))}
            </div>
          ):<Empty icon={Calendar} label="No upcoming events"/>}
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Active Challenges" badge={challenges.filter(c=>c.status==="active").length} action={()=>openModal("challenge")} actionLabel="New"/>
          {challenges.filter(c=>c.status==="active").length>0?(
            <div className="space-y-2">
              {challenges.filter(c=>c.status==="active").map(ch=>(
                <div key={ch.id} className="p-3.5 rounded-xl" style={{background:'rgba(249,115,22,0.06)',border:'1px solid rgba(249,115,22,0.18)'}}>
                  <div className="flex items-start justify-between gap-2 mb-1.5"><p className="text-sm font-bold text-white">🏆 {ch.title}</p><Tag color="orange">{ch.type?.replace('_',' ')}</Tag></div>
                  <p className="text-xs mb-2 line-clamp-1" style={{color:'#6b87b8'}}>{ch.description}</p>
                  <div className="flex gap-4 text-xs" style={{color:'#3d5a8a'}}><span>👥 {ch.participants?.length||0} joined</span><span>📅 {format(new Date(ch.start_date),'MMM d')} – {format(new Date(ch.end_date),'MMM d')}</span></div>
                </div>
              ))}
            </div>
          ):<Empty icon={Trophy} label="No active challenges"/>}
        </Panel>
        <Panel>
          <PH title="Active Polls" badge={polls.length} action={()=>openModal("poll")} actionLabel="New Poll"/>
          {polls.length>0?(
            <div className="space-y-2">
              {polls.map(poll=>(
                <div key={poll.id} className="p-3.5 rounded-xl" style={{background:'rgba(139,92,246,0.06)',border:'1px solid rgba(139,92,246,0.18)'}}>
                  <p className="text-sm font-bold text-white mb-1 truncate">{poll.title}</p>
                  <p className="text-xs mb-2 line-clamp-1" style={{color:'#6b87b8'}}>{poll.description}</p>
                  <div className="flex items-center gap-3 text-xs" style={{color:'#3d5a8a'}}><span>📊 {poll.voters?.length||0} votes</span><Tag color="purple">{poll.status}</Tag></div>
                </div>
              ))}
            </div>
          ):<Empty icon={BarChart2} label="No active polls"/>}
        </Panel>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ══════════════════════════════════════════════════════════════════════════
  const TabAnalytics=()=>{
    const dailyAvg=Math.round(ci30.length/30);
    const avgVisits=totalMembers>0?(ci30.length/totalMembers).toFixed(1):'—';
    const returnRate=checkIns.length>0?Math.round((checkIns.filter(c=>!c.first_visit).length/checkIns.length)*100):0;
    const peakHours=(()=>{const acc={};checkIns.forEach(c=>{const h=new Date(c.check_in_date).getHours();acc[h]=(acc[h]||0)+1;});const max=Math.max(...Object.values(acc),1);return Object.entries(acc).sort(([,a],[,b])=>b-a).slice(0,8).map(([hour,count])=>{const h=parseInt(hour);return{label:h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`,count,pct:(count/max)*100};});})();
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={Activity}   iconColor="#60a5fa" iconRgb="96,165,250"  label="Daily Avg Check-ins" value={dailyAvg}    sub="last 30 days"/>
          <KpiCard icon={TrendingUp} iconColor={monthChangePct>=0?'#34d399':'#f87171'} iconRgb={monthChangePct>=0?'52,211,153':'248,113,113'} label="Monthly Change" value={`${monthChangePct>=0?'+':''}${monthChangePct}%`} sub="vs previous 30 days"/>
          <KpiCard icon={Users}      iconColor="#a78bfa" iconRgb="167,139,250" label="Avg Visits / Member" value={avgVisits}   sub="per member (30d)"/>
          <KpiCard icon={Zap}        iconColor="#fbbf24" iconRgb="251,191,36"  label="Return Rate"         value={`${returnRate}%`} sub="repeat check-ins"/>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Panel>
            <PH title="Weekly Check-in Trend" subtitle="Last 12 weeks"/>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={weekTrend} margin={{top:8,right:8,left:-10,bottom:0}}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="label" tick={{fill:'#4a6492',fontSize:10}} axisLine={false} tickLine={false} interval={2}/>
                <YAxis tick={{fill:'#4a6492',fontSize:10}} axisLine={false} tickLine={false} width={28}/>
                <Tooltip content={<DT/>}/>
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#g1)" dot={false} activeDot={{r:5,fill:'#3b82f6',stroke:'#fff',strokeWidth:2}} name="Check-ins"/>
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
          <Panel>
            <PH title="Active Members Growth" subtitle="Last 6 months"/>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={monthGrowth} margin={{top:8,right:8,left:-10,bottom:0}}>
                <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.35}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="label" tick={{fill:'#4a6492',fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#4a6492',fontSize:11}} axisLine={false} tickLine={false} width={28}/>
                <Tooltip content={<DT/>}/>
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fill="url(#g2)" dot={false} activeDot={{r:5,fill:'#10b981',stroke:'#fff',strokeWidth:2}} name="Members"/>
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Panel>
            <PH title="Peak Hours" subtitle="Most popular visit times"/>
            <div className="space-y-3 mt-1">
              {peakHours.length===0?<Empty icon={Clock} label="Not enough check-in data yet"/>:peakHours.map(({label,count,pct},i)=>(
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs font-mono w-10 flex-shrink-0 text-right" style={{color:'#4a6492'}}>{label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:'rgba(13,35,96,0.5)'}}>
                    <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:i===0?'linear-gradient(90deg,#8b5cf6,#ec4899)':i<3?'linear-gradient(90deg,#6366f1,#a78bfa)':'linear-gradient(90deg,#3b82f6,#6366f1)',boxShadow:i===0?'0 0 8px rgba(139,92,246,0.5)':undefined}}/>
                  </div>
                  <span className="text-xs font-bold w-10 text-right flex-shrink-0" style={{color:i===0?'#c4b5fd':'#6b87b8'}}>{count}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <PH title="Rewards Redeemed" subtitle="Top claims by reward"/>
            {rewards.filter(r=>(r.claimed_by?.length||0)>0).length>0?(
              <ResponsiveContainer width="100%" height={230}>
                <BarChart barSize={28} data={rewards.filter(r=>(r.claimed_by?.length||0)>0).sort((a,b)=>(b.claimed_by?.length||0)-(a.claimed_by?.length||0)).slice(0,5).map(r=>({label:r.title.length>14?r.title.slice(0,14)+'…':r.title,value:r.claimed_by?.length||0}))} margin={{top:8,right:8,left:-10,bottom:0}}>
                  <defs><linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={1}/><stop offset="100%" stopColor="#7c3aed" stopOpacity={0.7}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="label" tick={{fill:'#4a6492',fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:'#4a6492',fontSize:10}} axisLine={false} tickLine={false} width={28}/>
                  <Tooltip content={<DT/>} cursor={{fill:'rgba(139,92,246,0.06)'}}/>
                  <Bar dataKey="value" fill="url(#g3)" radius={[6,6,0,0]} name="Claims"/>
                </BarChart>
              </ResponsiveContainer>
            ):<Empty icon={Gift} label="No rewards claimed yet"/>}
          </Panel>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // GYM SETTINGS
  // ══════════════════════════════════════════════════════════════════════════
  const TabGym=()=>(
    <div className="space-y-5">
      <Panel>
        <PH title="Gym Information" subtitle={selectedGym?.name} action={()=>openModal("editInfo")} actionLabel="Edit"/>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[{l:'Gym Name',v:selectedGym?.name},{l:'Type',v:selectedGym?.type},{l:'City',v:selectedGym?.city},{l:'Price',v:`£${selectedGym?.price}/mo`},{l:'Address',v:selectedGym?.address},{l:'Postcode',v:selectedGym?.postcode}].map((f,i)=>(
            <div key={i} className="p-3 rounded-xl border" style={{background:BG.subcard,borderColor:BORDER.subtle}}>
              <p className="text-xs uppercase tracking-wide mb-1" style={{color:'#3d5a8a'}}>{f.l}</p>
              <p className="text-sm font-semibold text-white truncate">{f.v||'—'}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PH title="Manage Gym" subtitle="Update facilities, staff and settings"/>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionBtn icon={Calendar} label="Classes"   sub={`${classes.length} total`}               color="#34d399" rgb="52,211,153"   floor="#064e3b" onClick={()=>openModal("classes")}/>
          <ActionBtn icon={Users}    label="Coaches"   sub={`${coaches.length} total`}               color="#60a5fa" rgb="96,165,250"   floor="#1e3a8a" onClick={()=>openModal("coaches")}/>
          <ActionBtn icon={Dumbbell} label="Equipment" sub={`${selectedGym?.equipment?.length||0} items`}  color="#a78bfa" rgb="167,139,250" floor="#4c1d95" onClick={()=>openModal("equipment")}/>
          <ActionBtn icon={Star}     label="Amenities" sub={`${selectedGym?.amenities?.length||0} listed`} color="#fbbf24" rgb="251,191,36"  floor="#78350f" onClick={()=>openModal("amenities")}/>
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <PH title="Amenities" badge={selectedGym?.amenities?.length||0} action={()=>openModal("amenities")} actionLabel="Edit"/>
          <div className="flex flex-wrap gap-1.5">
            {selectedGym?.amenities?.map((a,i)=><Tag key={i} color="blue">{a}</Tag>)}
            {!selectedGym?.amenities?.length&&<p className="text-sm" style={{color:'#3d5a8a'}}>No amenities listed</p>}
          </div>
        </Panel>
        <Panel>
          <PH title="Equipment" badge={selectedGym?.equipment?.length||0} action={()=>openModal("equipment")} actionLabel="Edit"/>
          <div className="flex flex-wrap gap-1.5">
            {selectedGym?.equipment?.slice(0,18).map((e,i)=><Tag key={i} color="purple">{e}</Tag>)}
            {selectedGym?.equipment?.length>18&&<Tag color="blue">+{selectedGym.equipment.length-18} more</Tag>}
            {!selectedGym?.equipment?.length&&<p className="text-sm" style={{color:'#3d5a8a'}}>No equipment listed</p>}
          </div>
        </Panel>
      </div>

      <Panel>
        <PH title="Photo Gallery" badge={selectedGym?.gallery?.length||0} action={()=>openModal("photos")} actionLabel="Manage Photos"/>
        {selectedGym?.gallery?.length>0?(
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {selectedGym.gallery.map((url,i)=><img key={i} src={url} alt="" className="w-full h-16 object-cover rounded-lg border" style={{borderColor:BORDER.subtle}}/>)}
          </div>
        ):(
          <div className="flex items-center gap-4 p-4 rounded-xl border" style={{background:BG.subcard,borderColor:BORDER.subtle}}>
            <ImageIcon className="w-6 h-6 flex-shrink-0" style={{color:'#3d5a8a'}}/>
            <p className="text-sm" style={{color:'#6b87b8'}}>No photos yet. Add photos to attract more members.</p>
            <button onClick={()=>openModal("photos")} className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0" style={{background:'rgba(59,130,246,0.15)',color:'#93c5fd',border:'1px solid rgba(59,130,246,0.3)'}}>Add Photos</button>
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
          {title:'Delete Gym',    desc:'Permanently delete this gym and all its data.',  label:'Delete Gym',    fn:()=>openModal("deleteGym")},
          {title:'Delete Account',desc:'Permanently delete your account and all gyms.',   label:'Delete Account',fn:()=>openModal("deleteAccount")},
        ].map((d,i)=>(
          <div key={i} className="p-5 rounded-2xl" style={{background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.18)'}}>
            <div className="flex items-center gap-2 mb-2"><Trash2 className="w-4 h-4 text-red-400"/><h4 className="font-bold text-white text-sm">{d.title}</h4></div>
            <p className="text-xs mb-4" style={{color:'#6b87b8'}}>{d.desc}</p>
            <button onClick={d.fn} className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110" style={{background:'rgba(239,68,68,0.12)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.3)'}}>{d.label}</button>
          </div>
        ))}
      </div>
    </div>
  );

  const TABS={overview:<TabOverview/>,members:<TabMembers/>,content:<TabContent/>,analytics:<TabAnalytics/>,gym:<TabGym/>};

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{background:BG.page,fontFamily:"'DM Sans','Inter',sans-serif"}}>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{background:BG.sidebar,backdropFilter:'blur(16px)',borderColor:BORDER.active,paddingBottom:'env(safe-area-inset-bottom)'}}>
        <div className="flex items-center justify-around" style={{height:'64px'}}>
          {NAV.map(item=>{const active=tab===item.id;return(
            <button key={item.id} onClick={()=>setTab(item.id)} className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-all active:scale-90" style={{color:active?'#60a5fa':'#4a6492',background:'none',border:'none',cursor:'pointer'}}>
              {active&&<div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{background:'#60a5fa'}}/>}
              <item.icon className="w-6 h-6 flex-shrink-0" strokeWidth={active?2.5:2}/>
              <span className="text-[10px] font-bold leading-none">{item.label==='Gym Settings'?'Settings':item.label}</span>
            </button>
          );})}
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col h-full flex-shrink-0 transition-all duration-300 overflow-hidden"
        style={{width:collapsed?64:224,background:BG.sidebar,backdropFilter:'blur(20px)',borderRight:`1px solid ${BORDER.active}`}}>
        <div className="px-4 py-5 border-b flex-shrink-0" style={{borderColor:BORDER.panel}}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0" style={{background:'linear-gradient(135deg,#3b82f6,#06b6d4)',boxShadow:'0 4px 14px rgba(59,130,246,0.3)'}}><Dumbbell className="w-4 h-4 text-white"/></div>
            {!collapsed&&<div className="min-w-0 flex-1"><p className="text-sm font-black text-white truncate leading-tight">{selectedGym?.name||'Dashboard'}</p><p className="text-xs" style={{color:'#3d5a8a'}}>Gym Owner</p></div>}
          </div>
          {!collapsed&&approvedGyms.length>1&&(
            <div className="mt-3 relative">
              <button onClick={()=>setGymOpen(o=>!o)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold" style={{background:BG.subcard,color:'#93b4e8',border:`1px solid ${BORDER.subtle}`}}>
                <span className="truncate">{selectedGym?.name}</span><ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${gymOpen?'rotate-180':''}`}/>
              </button>
              {gymOpen&&(
                <div className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl z-20" style={{background:'rgba(6,13,46,0.98)',border:`1px solid ${BORDER.active}`}}>
                  {approvedGyms.map(g=><button key={g.id} onClick={()=>{setSelectedGym(g);setGymOpen(false);}} className="w-full text-left px-3 py-2.5 text-xs font-semibold" style={{color:selectedGym?.id===g.id?'#60a5fa':'#93b4e8',background:selectedGym?.id===g.id?'rgba(59,130,246,0.1)':'transparent',border:'none',cursor:'pointer'}}>{g.name}</button>)}
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item=>{const active=tab===item.id;return(
            <button key={item.id} onClick={()=>setTab(item.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{background:active?'rgba(59,130,246,0.18)':'transparent',color:active?'#fff':'#6b87b8',border:active?`1px solid ${BORDER.active}`:'1px solid transparent',cursor:'pointer'}}>
              <item.icon className="w-4 h-4 flex-shrink-0" style={{color:active?'#60a5fa':'inherit'}}/>
              {!collapsed&&<span className="flex-1 text-left">{item.label}</span>}
              {!collapsed&&active&&<div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:'#60a5fa'}}/>}
            </button>
          );})}
        </nav>

        {!collapsed&&(
          <div className="px-2.5 pb-2.5 flex-shrink-0">
            <Link to={createPageUrl('Plus')}>
              <div className="p-3 rounded-xl cursor-pointer" style={{background:'linear-gradient(135deg,rgba(139,92,246,0.18),rgba(236,72,153,0.12))',border:'1px solid rgba(139,92,246,0.28)'}}>
                <div className="flex items-center gap-2 mb-0.5"><Crown className="w-3.5 h-3.5 text-purple-400"/><span className="text-xs font-black text-white">Retention Pro</span></div>
                <p className="text-xs" style={{color:'#9b7de0'}}>From £49.99/mo</p>
              </div>
            </Link>
          </div>
        )}

        <div className="px-2.5 pb-4 pt-2 border-t space-y-0.5 flex-shrink-0" style={{borderColor:BORDER.panel}}>
          <Link to={createPageUrl('GymCommunity')+'?id='+selectedGym?.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold" style={{color:'#6b87b8',textDecoration:'none'}}>
            <Eye className="w-4 h-4 flex-shrink-0"/>{!collapsed&&'View Gym Page'}
          </Link>
          <Link to={createPageUrl('Home')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold" style={{color:'#6b87b8',textDecoration:'none'}}>
            <Users className="w-4 h-4 flex-shrink-0"/>{!collapsed&&'Member View'}
          </Link>
          <button onClick={()=>base44.auth.logout()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold" style={{color:'#f87171',background:'none',border:'none',cursor:'pointer'}}>
            <LogOut className="w-4 h-4 flex-shrink-0"/>{!collapsed&&'Log Out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0 border-b"
          style={{background:BG.header,backdropFilter:'blur(20px)',borderColor:BORDER.active}}>
          <div className="flex items-center gap-3">
            <button onClick={()=>setCollapsed(o=>!o)} className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center"
              style={{background:BG.subcard,color:'#94a3b8',border:`1px solid ${BORDER.subtle}`,cursor:'pointer'}}>
              <Menu className="w-4 h-4"/>
            </button>
            <div>
              <h1 className="text-sm md:text-base font-black text-white leading-tight">{selectedGym?.name||'Dashboard'}</h1>
              <p className="text-xs hidden md:block" style={{color:'#3d5a8a'}}>{format(now,'EEEE, d MMMM yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {atRisk>0&&<button onClick={()=>setTab('members')} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(249,115,22,0.1)',color:'#fb923c',border:'1px solid rgba(249,115,22,0.25)',cursor:'pointer'}}><AlertTriangle className="w-3.5 h-3.5"/><span className="hidden sm:inline">{atRisk} at risk</span><span className="sm:hidden">{atRisk}</span></button>}
            <button onClick={()=>openModal('qrScanner')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(16,185,129,0.1)',color:'#34d399',border:'1px solid rgba(16,185,129,0.25)',cursor:'pointer'}}><QrCode className="w-3.5 h-3.5"/><span className="hidden sm:inline">Scan QR</span></button>
            <button onClick={()=>openModal('post')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(59,130,246,0.15)',color:'#93c5fd',border:`1px solid ${BORDER.active}`,cursor:'pointer'}}><Pencil className="w-3.5 h-3.5"/><span className="hidden sm:inline">New Post</span></button>
            {selectedGym?.join_code
              ?<button onClick={()=>openModal('qrCode')} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest" style={{background:BG.subcard,color:'#93b4e8',border:`1px solid ${BORDER.subtle}`,cursor:'pointer'}}>{selectedGym.join_code}</button>
              :<button onClick={async()=>{try{const r=await base44.functions.invoke('generateGymJoinCode',{gym_id:selectedGym.id});if(r.data?.success)invGyms();}catch{}}} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(16,185,129,0.1)',color:'#34d399',border:'1px solid rgba(16,185,129,0.25)',cursor:'pointer'}}><Plus className="w-3.5 h-3.5"/>Generate Code</button>}
            {selectedGym?.verified&&<div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(59,130,246,0.1)',color:'#93c5fd',border:`1px solid ${BORDER.active}`}}><Shield className="w-3.5 h-3.5"/>Verified</div>}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 pb-24 md:pb-6">
          <div className="max-w-[1400px] mx-auto">{TABS[tab]||TABS.overview}</div>
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
        <AlertDialogContent style={{background:'rgba(6,13,46,0.98)',borderColor:'rgba(239,68,68,0.3)'}} className="max-w-md">
          <AlertDialogHeader><AlertDialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400"/>Delete Gym Permanently?</AlertDialogTitle><AlertDialogDescription className="text-sm" style={{color:'#6b87b8'}}>Deletes <span className="font-bold text-white">{selectedGym?.name}</span> and all its data. <span className="text-red-400 font-semibold">Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel style={{background:BG.subcard,color:'#93b4e8',borderColor:BORDER.subtle}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteGymM.mutate()} disabled={deleteGymM.isPending} className="bg-red-600 hover:bg-red-700 text-white">{deleteGymM.isPending?'Deleting…':'Delete Permanently'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={modal==='deleteAccount'} onOpenChange={v=>!v&&closeModal()}>
        <AlertDialogContent style={{background:'rgba(6,13,46,0.98)',borderColor:'rgba(239,68,68,0.3)'}} className="max-w-md">
          <AlertDialogHeader><AlertDialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400"/>Delete Account?</AlertDialogTitle><AlertDialogDescription className="text-sm" style={{color:'#6b87b8'}}>Deletes your account and all data. <span className="text-red-400 font-semibold">Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel style={{background:BG.subcard,color:'#93b4e8',borderColor:BORDER.subtle}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteAccountM.mutate()} disabled={deleteAccountM.isPending} className="bg-red-700 hover:bg-red-800 text-white">{deleteAccountM.isPending?'Deleting…':'Delete Account'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {modal==='qrCode'&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(2,4,10,0.9)',backdropFilter:'blur(8px)'}}>
          <div className="rounded-3xl p-8 max-w-sm w-full shadow-2xl" style={{background:'rgba(6,13,46,0.98)',border:`1px solid ${BORDER.active}`}}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-black text-white">Gym Join QR Code</h3><button onClick={closeModal} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:BG.subcard,color:'#94a3b8',border:`1px solid ${BORDER.subtle}`,cursor:'pointer'}}><X className="w-4 h-4"/></button></div>
            <div id="qr-fullscreen" className="flex justify-center p-6 rounded-2xl bg-white mb-5"><QRCode value={`${window.location.origin}${createPageUrl('Gyms')}?joinCode=${selectedGym?.join_code}`} size={260} level="H"/></div>
            <p className="text-center text-sm mb-5" style={{color:'#6b87b8'}}>Join code: <span className="font-black text-white tracking-widest">{selectedGym?.join_code}</span></p>
            <div className="space-y-2.5">
              <button onClick={()=>dlQR('qr-fullscreen')} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white" style={{background:'linear-gradient(135deg,#10b981,#0d9488)',border:'none',cursor:'pointer'}}><Download className="w-4 h-4"/>Download QR Code</button>
              <button onClick={closeModal} className="w-full py-3 rounded-xl font-semibold text-sm border" style={{background:BG.subcard,color:'#93b4e8',borderColor:BORDER.subtle,cursor:'pointer'}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}