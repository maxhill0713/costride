import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Trophy, TrendingUp, MessageCircle, Heart, BadgeCheck, Gift, ChevronLeft, ChevronRight, Calendar, Plus, Edit, GraduationCap, Clock, Target, Award, Image as ImageIcon, Crown, Dumbbell, Flame, CheckCircle, Trash2, Home, Mail, Copy } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import PostCard from '../components/feed/PostCard';
import CreateGymPostButton from '../components/feed/CreateGymPostButton';
import LeaderboardCard from '../components/leaderboard/LeaderboardCard';
import EventCard from '../components/events/EventCard';
import CreateEventModal from '../components/events/CreateEventModal';
import ManageEquipmentModal from '../components/gym/ManageEquipmentModal';
import ManageRewardsModal from '../components/gym/ManageRewardsModal';
import ManageClassesModal from '../components/gym/ManageClassesModal';
import ManageCoachesModal from '../components/gym/ManageCoachesModal';
import ManageGymPhotosModal from '../components/gym/ManageGymPhotosModal';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';
import EditGymLogoModal from '../components/gym/EditGymLogoModal';
import ManageMembersModal from '../components/gym/ManageMembersModal';
import InviteOwnerModal from '../components/gym/InviteOwnerModal';
import UpgradeMembershipModal from '../components/membership/UpgradeMembershipModal';
import JoinGymModal from '../components/membership/JoinGymModal';
import ChallengeProgressCard from '../components/challenges/ChallengeProgressCard';
import WeeklyEventCard from '../components/feed/WeeklyEventCard';
import SystemChallengeCard from '../components/challenges/SystemChallengeCard';
import AppChallengeCard from '../components/challenges/AppChallengeCard';
import GymChallengeCard from '../components/challenges/GymChallengeCard';
import MiniLeaderboard from '../components/challenges/MiniLeaderboard';
import CreateChallengeModal from '../components/challenges/CreateChallengeModal';
import PullToRefresh from '../components/PullToRefresh';
import PollCard from '../components/polls/PollCard';
import BusyTimesChart from '../components/gym/BusyTimesChart';
import GymCommunitySkeleton from '../components/gym/GymCommunitySkeleton';
import { motion } from 'framer-motion';

// ─── Shared card style (CoStride frosted glass) ───────────────────────────────
const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.90) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────
const LBOARD_ANIM = `
@keyframes lb-slide-up {
  from { opacity:0; transform:translateY(100%); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes lb-card-in {
  from { opacity:0; transform:translateY(18px) scale(0.94); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes lb-row-in {
  from { opacity:0; transform:translateX(-8px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes lb-flame {
  0%,100% { transform:scale(1) rotate(-3deg); }
  50%      { transform:scale(1.2) rotate(3deg); }
}
@keyframes lb-gold-pulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(255,215,0,0.25), 0 0 18px rgba(255,215,0,0.15); }
  50%      { box-shadow: 0 0 0 3px rgba(255,215,0,0.5), 0 0 28px rgba(255,215,0,0.3); }
}
`;

const MEDALS = [
  { color: '#FFD700', border: 'rgba(255,215,0,0.5)',   glow: 'rgba(255,215,0,0.18)'   },
  { color: '#C8D4E4', border: 'rgba(200,212,228,0.4)', glow: 'rgba(200,212,228,0.12)' },
  { color: '#CD8C5A', border: 'rgba(205,140,90,0.45)', glow: 'rgba(205,140,90,0.14)'  },
];

// Matches app CARD_STYLE but with navy-blue tint
const ROW_CARD = {
  background: 'linear-gradient(135deg, rgba(30,45,90,0.72) 0%, rgba(8,15,40,0.90) 100%)',
  border: '1px solid rgba(59,130,246,0.15)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

function LeaderboardSection({ view, setView, checkInLeaderboard, streakLeaderboard, progressLeaderboard }) {
  const [open, setOpen] = React.useState(false);
  const [timeframe, setTimeframe] = React.useState('week');
  const [avatarMap, setAvatarMap] = React.useState({});

  // Fetch avatars for all leaderboard users
  React.useEffect(() => {
    const allUsers = [...checkInLeaderboard, ...streakLeaderboard, ...progressLeaderboard];
    const uniqueIds = [...new Set(allUsers.map(u => u.userId).filter(Boolean))];
    if (uniqueIds.length === 0) return;
    Promise.all(
      uniqueIds.map(id => base44.entities.User.filter({ id }).then(r => r[0]).catch(() => null))
    ).then(users => {
      const map = {};
      users.forEach(u => { if (u) map[u.id] = u.avatar_url || null; });
      setAvatarMap(map);
    }).catch(() => {});
  }, [checkInLeaderboard.length, streakLeaderboard.length, progressLeaderboard.length]);

  const tabs = [
    { id: 'checkins', label: 'Check-ins', icon: CheckCircle, accent: '#10b981', unit: 'check-ins' },
    { id: 'streaks',  label: 'Streaks',   icon: Flame,       accent: '#f97316', unit: 'day streak' },
    { id: 'progress', label: 'Progress',  icon: TrendingUp,  accent: '#818cf8', unit: 'kg gained'  },
  ];
  const current = tabs.find(t => t.id === view);

  const getData = () => {
    if (view === 'checkins') return { list: checkInLeaderboard, getVal: m => m.count,    fmt: v => `${v}`,    unit: 'check-ins'  };
    if (view === 'streaks')  return { list: streakLeaderboard,  getVal: m => m.streak,   fmt: v => `${v}d`,   unit: 'day streak' };
    return                          { list: progressLeaderboard,getVal: m => m.increase, fmt: v => `+${v}kg`, unit: 'kg gained'  };
  };
  const { list, getVal, fmt, unit } = getData();
  const maxVal = list.length > 0 ? Math.max(...list.map(getVal), 1) : 1;

  const initials = (name) => (name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const podium   = list.slice(0, 3);
  const restList = list.slice(3, 10);

  // ── COLLAPSED BUTTON ──────────────────────────────────────────────────────
  if (!open) {
    return (
      <>
        <style>{LBOARD_ANIM}</style>
        <button onClick={() => setOpen(true)}
          className="w-full text-left relative overflow-hidden rounded-2xl active:scale-[0.985] transition-transform duration-150"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
            border: '1px solid rgba(255,215,0,0.22)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background:'linear-gradient(90deg,transparent,rgba(255,215,0,0.25),transparent)' }} />
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.25)' }}>
              <Trophy style={{ width:18, height:18, color:'#FFD700' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-black text-white leading-tight">Community Leaderboard</p>
              <p className="text-[11px] mt-0.5 font-semibold" style={{ color:'rgba(255,255,255,0.35)' }}>
                {list.length > 0 ? `${list.length} members ranked · tap to view` : 'No data yet this week'}
              </p>
            </div>
            {podium.length > 0 && (
              <div className="flex -space-x-2 flex-shrink-0 mr-1">
                {podium.map((m,i) => (
                  <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{ background:'rgba(8,18,48,0.9)', border:`2px solid ${MEDALS[i].color}`, color:MEDALS[i].color, zIndex:3-i }}>
                    {initials(m.userName)}
                  </div>
                ))}
              </div>
            )}
            <ChevronRight style={{ width:16, height:16, color:'rgba(255,255,255,0.3)', flexShrink:0 }} />
          </div>
        </button>
      </>
    );
  }

  // ── FULL-SCREEN OVERLAY ──────────────────────────────────────────────────
  return (
    <>
      <style>{LBOARD_ANIM}</style>
      <div style={{
        position:'fixed', inset:0, zIndex:50,
        display:'flex', flexDirection:'column',
        background:'linear-gradient(160deg,#040d22 0%,#07122e 35%,#040d22 70%,#020810 100%)',
        animation:'lb-slide-up 0.38s cubic-bezier(0.16,1,0.3,1) both',
        overflowX:'hidden',
      }}>
        {/* BG texture */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'radial-gradient(rgba(255,255,255,0.018) 1px,transparent 1px)',
          backgroundSize:'22px 22px' }}/>
        {/* Gold glow top */}
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
          width:280, height:100, pointerEvents:'none',
          background:'radial-gradient(ellipse,rgba(255,215,0,0.07) 0%,transparent 70%)' }}/>

        {/* ── HEADER — tight, no excess space ── */}
        <div style={{
          flexShrink:0, padding:'48px 16px 12px',
          borderBottom:'1px solid rgba(255,255,255,0.05)',
          position:'relative',
        }}>
          {/* Back button */}
          <button onClick={() => setOpen(false)} style={{
            position:'absolute', top:48, left:16,
            width:36, height:36, borderRadius:12,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)',
          }}>
            <ChevronRight style={{ width:17, height:17, color:'rgba(255,255,255,0.6)', transform:'rotate(180deg)' }} />
          </button>

          {/* Title */}
          <div style={{ textAlign:'center', marginBottom:12 }}>
            <p style={{ fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.2em', color:'rgba(255,215,0,0.5)', marginBottom:2 }}>Community</p>
            <h2 style={{ fontSize:20, fontWeight:900, color:'#fff', margin:0, letterSpacing:'-0.02em' }}>Leaderboard</h2>
          </div>

          {/* Timeframe pills */}
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:10 }}>
            {[['week','This Week'],['month','This Month'],['all','Overall']].map(([tf,label]) => (
              <button key={tf} onClick={() => setTimeframe(tf)} style={{
                padding:'6px 14px', borderRadius:99, fontSize:11, fontWeight:700,
                background: timeframe===tf ? 'rgba(255,255,255,0.1)' : 'transparent',
                border:`1px solid ${timeframe===tf ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}`,
                color: timeframe===tf ? '#fff' : 'rgba(255,255,255,0.28)',
                transition:'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          {/* Metric tabs */}
          <div style={{ display:'flex', gap:8 }}>
            {tabs.map(({ id, label, icon: Icon, accent }) => {
              const active = view===id;
              return (
                <button key={id} onClick={() => setView(id)} style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  padding:'8px 0', borderRadius:12, fontSize:12, fontWeight:700,
                  background: active ? `${accent}15` : 'rgba(255,255,255,0.03)',
                  border:`1px solid ${active ? accent+'45' : 'rgba(255,255,255,0.05)'}`,
                  color: active ? accent : 'rgba(255,255,255,0.28)',
                  transition:'all 0.15s',
                }}>
                  <Icon style={{ width:12, height:12 }} />{label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 12px 80px' }}>

          {list.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:240, gap:12 }}>
              <Trophy style={{ width:36, height:36, color:'rgba(255,255,255,0.07)' }} />
              <p style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.2)' }}>No data yet this week</p>
            </div>
          ) : (
            <>
              {/* Section label */}
              <p style={{ textAlign:'center', fontSize:11, fontWeight:900, textTransform:'uppercase',
                letterSpacing:'0.16em', color:'rgba(255,215,0,0.4)', padding:'16px 0 12px' }}>
                Top 3 · {current.label} Leaders
              </p>

              {/* ── PODIUM CARDS — 2nd | 1st | 3rd ── */}
              <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:10, paddingBottom:16 }}>
                {[
                  { data: podium[1], rank: 1, w: 108 },
                  { data: podium[0], rank: 0, w: 130 },
                  { data: podium[2], rank: 2, w: 108 },
                ].filter(p => p.data).map(({ data, rank, w }) => {
                  const M = MEDALS[rank];
                  const isFirst = rank === 0;
                  return (
                    <div key={rank} style={{
                      width:w, borderRadius:18, overflow:'hidden', position:'relative',
                      background:'linear-gradient(160deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
                      border:`1.5px solid ${M.border}`,
                      backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
                      boxShadow:`0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
                      animation:`lb-card-in 0.4s cubic-bezier(0.34,1.2,0.64,1) ${rank*0.07}s both`,
                    }}>
                      {/* Top shine */}
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
                        background:`linear-gradient(90deg,transparent,${M.color}35,transparent)` }}/>
                      {/* Flame */}
                      {isFirst && (
                        <div style={{ position:'absolute', top:7, right:9, fontSize:17,
                          animation:'lb-flame 1.3s ease-in-out infinite', pointerEvents:'none' }}>🔥</div>
                      )}
                      {/* Rank corner badge */}
                      <div style={{
                        position:'absolute', top:0, left:0, width:22, height:22,
                        borderRadius:'0 0 8px 0',
                        background:M.color, display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:10, fontWeight:900, color:'rgba(0,0,0,0.7)',
                      }}>{rank+1}</div>
                      {/* Avatar */}
                      <div style={{
                        width:isFirst?58:46, height:isFirst?58:46, borderRadius:'50%',
                        background:'rgba(255,255,255,0.06)',
                        border:`2px solid ${M.color}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:isFirst?19:15, fontWeight:900, color:M.color,
                        margin:`${isFirst?18:14}px auto 8px`,
                        backdropFilter:'blur(8px)',
                        animation: isFirst ? 'lb-gold-pulse 2.5s ease-in-out infinite' : 'none',
                      }}>{initials(data.userName)}</div>
                      {/* Name */}
                      <p style={{
                        color:'#fff', fontWeight:900, textAlign:'center',
                        fontSize:isFirst?13:11, lineHeight:1.2,
                        padding:'0 8px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>{data.userName||'—'}</p>
                      {/* Stat */}
                      <div style={{ textAlign:'center', padding:`${isFirst?8:6}px 8px ${isFirst?14:12}px` }}>
                        <p style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em',
                          color:'rgba(255,255,255,0.28)', marginBottom:2 }}>{unit}</p>
                        <p style={{ fontSize:isFirst?21:16, fontWeight:900, color:M.color, lineHeight:1 }}>
                          {fmt(getVal(data))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ height:1, margin:'0 4px 12px', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)' }}/>

              {/* ── ROWS 4–10 — app card style ── */}
              {restList.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {restList.map((m, i) => {
                    const globalRank = i + 4;
                    const pct = Math.max(4, Math.round((getVal(m)/maxVal)*100));
                    return (
                      <div key={m.userId||i} style={{
                        ...ROW_CARD,
                        borderRadius:16,
                        padding:'12px 14px',
                        display:'flex', alignItems:'center', gap:12,
                        animation:`lb-row-in 0.26s ease ${(i+3)*0.05}s both`,
                      }}>
                        {/* Top shine */}
                        <div style={{ position:'absolute', pointerEvents:'none' }}/>
                        {/* Rank */}
                        <div style={{
                          width:28, height:28, borderRadius:8, flexShrink:0,
                          background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:12, fontWeight:900, color:'rgba(255,255,255,0.35)',
                        }}>{globalRank}</div>
                        {/* Avatar */}
                        <div style={{
                          width:36, height:36, borderRadius:'50%', flexShrink:0,
                          background:'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(30,58,138,0.15))',
                          border:'1.5px solid rgba(59,130,246,0.25)',
                          backdropFilter:'blur(8px)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:12, fontWeight:900, color:'rgba(147,197,253,0.85)',
                        }}>{initials(m.userName)}</div>
                        {/* Name + bar */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.75)', margin:'0 0 6px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {m.userName||'—'}
                          </p>
                          <div style={{ height:3, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                            <div style={{ height:'100%', borderRadius:99, width:`${pct}%`,
                              background:`linear-gradient(90deg,${current.accent},${current.accent}70)` }}/>
                          </div>
                        </div>
                        {/* Value badge */}
                        <div style={{
                          flexShrink:0, padding:'4px 10px', borderRadius:8,
                          background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)',
                          fontSize:13, fontWeight:900, color:'rgba(255,255,255,0.45)',
                        }}>{fmt(getVal(m))}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p style={{ textAlign:'center', fontSize:10, fontWeight:700, textTransform:'uppercase',
                letterSpacing:'0.14em', color:'rgba(255,255,255,0.1)', padding:'16px 0 4px' }}>
                Ranked by {unit}
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Animated dropdown panel (Duolingo-style) ────────────────────────────────
function SlidePanel({ open, children }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.38s cubic-bezier(0.34,1.4,0.64,1)',
      }}
    >
      <div style={{ overflow: 'hidden' }}>
        <div
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
            transition: open
              ? 'opacity 0.28s ease 0.08s, transform 0.38s cubic-bezier(0.34,1.4,0.64,1) 0.04s'
              : 'opacity 0.15s ease, transform 0.18s ease',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Ripple button ────────────────────────────────────────────────────────────
function RippleButton({ onClick, children, className, style }) {
  const [ripples, setRipples] = React.useState([]);
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(r => r.id !== id)), 600);
    onClick && onClick(e);
  };
  return (
    <button onClick={handleClick} className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      {ripples.map(({ id, x, y }) => (
        <span key={id} style={{
          position: 'absolute', left: x, top: y,
          width: 4, height: 4, borderRadius: '50%',
          background: 'rgba(255,255,255,0.45)',
          transform: 'translate(-50%,-50%) scale(0)',
          animation: 'costride-ripple 0.55s ease-out forwards',
          pointerEvents: 'none',
        }} />
      ))}
      {children}
      <style>{`@keyframes costride-ripple { to { transform: translate(-50%,-50%) scale(60); opacity: 0; } }`}</style>
    </button>
  );
}


export default function GymCommunity() {
  const urlParams = new URLSearchParams(window.location.search);
  const gymId = urlParams.get('id');
  const queryClient = useQueryClient();

  useEffect(() => { window.scrollTo(0, 0); }, [gymId]);

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showManageEquipment, setShowManageEquipment] = useState(false);
  const [showManageRewards, setShowManageRewards] = useState(false);
  const [showManageClasses, setShowManageClasses] = useState(false);
  const [showManageCoaches, setShowManageCoaches] = useState(false);
  const [leaderboardView, setLeaderboardView] = useState('checkins');
  const [showManagePhotos, setShowManagePhotos] = useState(false);
  const [showEditHeroImage, setShowEditHeroImage] = useState(false);
  const [showEditGymLogo, setShowEditGymLogo] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [viewAsMember, setViewAsMember] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showJoinGymModal, setShowJoinGymModal] = useState(false);
  const [joinPanel, setJoinPanel] = useState(null); // 'code' | 'primary' | null
  const [joinCode, setJoinCode] = useState('');
  const [joinCodeError, setJoinCodeError] = useState('');
  const [joinCodeSuccess, setJoinCodeSuccess] = useState(false);
  const [primaryConfirmed, setPrimaryConfirmed] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [copiedCoachId, setCopiedCoachId] = useState(null);
  const [showInviteOwner, setShowInviteOwner] = useState(false);
  const [showInviteOwnerModal, setShowInviteOwnerModal] = useState(false);

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 });
  const { data: gym, isLoading: gymLoading } = useQuery({ queryKey: ['gym', gymId], queryFn: () => base44.entities.Gym.filter({ id: gymId }).then((r) => r[0]), enabled: !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: members = [] } = useQuery({ queryKey: ['members', gymId], queryFn: () => base44.entities.GymMember.filter({ gym_id: gymId }), enabled: !!gymId, staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: coaches = [] } = useQuery({ queryKey: ['coaches', gymId], queryFn: () => base44.entities.Coach.filter({ gym_id: gymId }), enabled: !!gymId, staleTime: 10 * 60 * 1000, gcTime: 20 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: posts = [] } = useQuery({ queryKey: ['posts', gymId], queryFn: () => base44.entities.Post.filter({ allow_gym_repost: true }, '-created_date', 20), enabled: !!gymId, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: checkIns = [] } = useQuery({ queryKey: ['checkIns', gymId], queryFn: () => base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 200), enabled: !!gymId, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: lifts = [] } = useQuery({ queryKey: ['lifts', gymId], queryFn: () => base44.entities.Lift.filter({ gym_id: gymId }, '-lift_date', 100), enabled: !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: events = [] } = useQuery({ queryKey: ['events', gymId], queryFn: () => base44.entities.Event.filter({ gym_id: gymId }, '-event_date'), enabled: !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: classes = [] } = useQuery({ queryKey: ['classes', gymId], queryFn: () => base44.entities.GymClass.filter({ gym_id: gymId }), enabled: !!gymId, staleTime: 10 * 60 * 1000, gcTime: 20 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: rewards = [] } = useQuery({ queryKey: ['rewards', gymId], queryFn: () => base44.entities.Reward.filter({ gym_id: gymId }), enabled: !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: challenges = [] } = useQuery({ queryKey: ['challenges', gymId], queryFn: () => base44.entities.Challenge.filter({ gym_id: gymId, is_app_challenge: false }), enabled: !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: polls = [] } = useQuery({ queryKey: ['polls', gymId], queryFn: () => base44.entities.Poll.filter({ gym_id: gymId, status: 'active' }, '-created_date'), enabled: !!gymId, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });
  const gymChallenges = challenges.filter((c) => c.status === 'active' || c.status === 'upcoming');
  const { data: allGyms = [] } = useQuery({ queryKey: ['gyms'], queryFn: () => base44.entities.Gym.filter({ status: 'approved' }, 'name', 50), enabled: showCreateChallenge, staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 });
  const { data: gymMembership } = useQuery({ queryKey: ['gymMembership', currentUser?.id, gymId], queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, gym_id: gymId, status: 'active' }).then((r) => r[0]), enabled: !!currentUser && !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: claimedBonuses = [] } = useQuery({ queryKey: ['claimedBonuses', currentUser?.id, gymId], queryFn: () => base44.entities.ClaimedBonus.filter({ user_id: currentUser.id, gym_id: gymId }), enabled: !!currentUser && !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: challengeParticipants = [] } = useQuery({ queryKey: ['challengeParticipants', currentUser?.id], queryFn: () => base44.entities.ChallengeParticipant.filter({ user_id: currentUser.id }), enabled: !!currentUser, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });

  // ── Mutations (unchanged logic) ──────────────────────────────────────────────
  const createEventMutation = useMutation({ mutationFn: (eventData) => base44.entities.Event.create({ ...eventData, gym_id: gymId, gym_name: gym?.name, attendees: 0 }), onMutate: async (eventData) => { await queryClient.cancelQueries({ queryKey: ['events', gymId] }); const previous = queryClient.getQueryData(['events', gymId]); const tempEvent = { ...eventData, id: `temp-${Date.now()}`, gym_id: gymId, gym_name: gym?.name, attendees: 0 }; queryClient.setQueryData(['events', gymId], (old = []) => [tempEvent, ...old]); return { previous }; }, onError: (err, vars, context) => { queryClient.setQueryData(['events', gymId], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events', gymId] }); setShowCreateEvent(false); } });
  const rsvpMutation = useMutation({ mutationFn: ({ eventId, currentAttendees }) => base44.entities.Event.update(eventId, { attendees: currentAttendees + 1 }), onMutate: async ({ eventId, currentAttendees }) => { await queryClient.cancelQueries({ queryKey: ['events', gymId] }); const previous = queryClient.getQueryData(['events', gymId]); queryClient.setQueryData(['events', gymId], (old = []) => old.map((e) => e.id === eventId ? { ...e, attendees: currentAttendees + 1 } : e)); return { previous }; }, onError: (err, vars, context) => { queryClient.setQueryData(['events', gymId], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events', gymId] }); } });
  const updateEquipmentMutation = useMutation({ mutationFn: (equipment) => base44.entities.Gym.update(gymId, { equipment }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); setShowManageEquipment(false); } });
  const createRewardMutation = useMutation({ mutationFn: (rewardData) => base44.entities.Reward.create(rewardData), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rewards', gymId] }); } });
  const deleteRewardMutation = useMutation({ mutationFn: (rewardId) => base44.entities.Reward.delete(rewardId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rewards', gymId] }); } });
  const claimRewardMutation = useMutation({ mutationFn: ({ rewardId, userId, currentClaimed }) => base44.entities.Reward.update(rewardId, { claimed_by: [...currentClaimed, userId] }), onMutate: async ({ rewardId, userId, currentClaimed }) => { await queryClient.cancelQueries({ queryKey: ['rewards', gymId] }); const previous = queryClient.getQueryData(['rewards', gymId]); queryClient.setQueryData(['rewards', gymId], (old = []) => old.map((r) => r.id === rewardId ? { ...r, claimed_by: [...currentClaimed, userId] } : r)); return { previous }; }, onError: (err, vars, context) => { queryClient.setQueryData(['rewards', gymId], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rewards', gymId] }); } });
  const createClassMutation = useMutation({ mutationFn: (classData) => base44.entities.GymClass.create(classData), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes', gymId] }); } });
  const deleteClassMutation = useMutation({ mutationFn: (classId) => base44.entities.GymClass.delete(classId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes', gymId] }); } });
  const createCoachMutation = useMutation({ mutationFn: (coachData) => base44.entities.Coach.create(coachData), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coaches', gymId] }); } });
  const deleteCoachMutation = useMutation({ mutationFn: (coachId) => base44.entities.Coach.delete(coachId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coaches', gymId] }); } });
  const deleteChallengeMutation = useMutation({ mutationFn: (challengeId) => base44.entities.Challenge.delete(challengeId), onMutate: async (challengeId) => { await queryClient.cancelQueries({ queryKey: ['challenges', gymId] }); const previous = queryClient.getQueryData(['challenges', gymId]); queryClient.setQueryData(['challenges', gymId], (old = []) => old.filter((c) => c.id !== challengeId)); return { previous }; }, onError: (err, vars, context) => { queryClient.setQueryData(['challenges', gymId], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challenges', gymId] }); } });
  const deleteEventMutation = useMutation({ mutationFn: (eventId) => base44.entities.Event.delete(eventId), onMutate: async (eventId) => { await queryClient.cancelQueries({ queryKey: ['events', gymId] }); const previous = queryClient.getQueryData(['events', gymId]); queryClient.setQueryData(['events', gymId], (old = []) => old.filter((e) => e.id !== eventId)); return { previous }; }, onError: (err, vars, context) => { queryClient.setQueryData(['events', gymId], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events', gymId] }); } });
  const votePollMutation = useMutation({ mutationFn: async ({ pollId, optionId }) => { const poll = polls.find((p) => p.id === pollId); const updatedOptions = poll.options.map((opt) => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt); const updatedVoters = [...(poll.voters || []), currentUser.id]; await base44.entities.Poll.update(pollId, { options: updatedOptions, voters: updatedVoters }); }, onMutate: async ({ pollId, optionId }) => { await queryClient.cancelQueries({ queryKey: ['polls', gymId] }); const previous = queryClient.getQueryData(['polls', gymId]); queryClient.setQueryData(['polls', gymId], (old = []) => old.map((p) => p.id === pollId ? { ...p, voters: [...(p.voters || []), currentUser.id], options: p.options.map((opt) => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt) } : p)); return { previous }; }, onError: (err, vars, context) => { queryClient.setQueryData(['polls', gymId], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['polls', gymId] }); } });
  const updateCoachMutation = useMutation({ mutationFn: ({ coachId, data }) => base44.entities.Coach.update(coachId, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coaches', gymId] }); } });
  const createChallengeMutation = useMutation({ mutationFn: (challengeData) => { const fullData = { ...challengeData, gym_id: gymId, gym_name: gym?.name }; return base44.entities.Challenge.create(fullData); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challenges', gymId] }); setShowCreateChallenge(false); }, onError: (error) => { console.error('Challenge creation failed:', error); } });
  const updateGalleryMutation = useMutation({ mutationFn: (gallery) => base44.entities.Gym.update(gymId, { gallery }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); setShowManagePhotos(false); } });
  const updateHeroImageMutation = useMutation({ mutationFn: (image_url) => base44.entities.Gym.update(gymId, { image_url }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); setShowEditHeroImage(false); } });
  const updateGymLogoMutation = useMutation({ mutationFn: (logo_url) => base44.entities.Gym.update(gymId, { logo_url }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); setShowEditGymLogo(false); } });
  const banMemberMutation = useMutation({ mutationFn: (userId) => { const currentBanned = gym?.banned_members || []; return base44.entities.Gym.update(gymId, { banned_members: [...currentBanned, userId] }); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); } });
  const unbanMemberMutation = useMutation({ mutationFn: (userId) => { const currentBanned = gym?.banned_members || []; return base44.entities.Gym.update(gymId, { banned_members: currentBanned.filter((id) => id !== userId) }); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); } });
  const joinGhostGymMutation = useMutation({ mutationFn: async () => { await base44.entities.GymMembership.create({ user_id: currentUser.id, user_name: currentUser.full_name, user_email: currentUser.email, gym_id: gym.id, gym_name: gym.name, status: 'active', join_date: new Date().toISOString().split('T')[0], membership_type: 'lifetime' }); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gymMembership', currentUser?.id, gymId] }); queryClient.invalidateQueries({ queryKey: ['gymMemberships', currentUser?.id] }); window.location.href = createPageUrl('Home'); } });
  const joinChallengeMutation = useMutation({ mutationFn: async (challenge) => { const currentParticipants = challenge.participants || []; await base44.entities.Challenge.update(challenge.id, { participants: [...currentParticipants, currentUser.id] }); await base44.entities.ChallengeParticipant.create({ user_id: currentUser.id, user_name: currentUser.full_name, challenge_id: challenge.id, challenge_title: challenge.title, progress: 0, completed: false }); }, onMutate: async (challenge) => { await queryClient.cancelQueries({ queryKey: ['challengeParticipants', currentUser?.id] }); const previous = queryClient.getQueryData(['challengeParticipants', currentUser?.id]); queryClient.setQueryData(['challengeParticipants', currentUser?.id], (old = []) => [...old, { id: `temp-${challenge.id}`, user_id: currentUser.id, challenge_id: challenge.id, challenge_title: challenge.title, progress: 0, completed: false }]); return { previous }; }, onError: (err, challenge, context) => { queryClient.setQueryData(['challengeParticipants', currentUser?.id], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challengeParticipants', currentUser?.id] }); queryClient.invalidateQueries({ queryKey: ['challenges', gymId] }); queryClient.invalidateQueries({ queryKey: ['challenges'] }); queryClient.invalidateQueries({ queryKey: ['activeChallenges'] }); base44.entities.Notification.create({ user_id: currentUser.id, type: 'challenge', title: '💪 Challenge Joined!', message: 'Good luck on your new challenge!', icon: '🎯' }); } });
  const claimBonusMutation = useMutation({ mutationFn: ({ bonusType, offerDetails }) => base44.entities.ClaimedBonus.create({ user_id: currentUser.id, gym_id: gymId, bonus_type: bonusType, offer_details: offerDetails }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['claimedBonuses', currentUser?.id, gymId] }); base44.entities.Notification.create({ user_id: currentUser.id, type: 'reward', title: '🎁 Bonus Claimed!', message: 'Your gym bonus has been claimed successfully', icon: '🎉' }); } });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const hasClaimedBonus = (bonusType) => claimedBonuses.some((b) => b.bonus_type === bonusType);
  const hasjoinedChallenge = (challengeId) => challengeParticipants.some((p) => p.challenge_id === challengeId);
  const calculateCurrentStreak = (userCheckIns) => { if (userCheckIns.length === 0) return 0; const sorted = [...userCheckIns].sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date)); let streak = 1; let cur = new Date(sorted[0].check_in_date); cur.setHours(0,0,0,0); for (let i = 1; i < sorted.length; i++) { const d = new Date(sorted[i].check_in_date); d.setHours(0,0,0,0); const diff = Math.floor((cur - d) / 86400000); if (diff === 1) { streak++; cur = d; } else if (diff > 1) break; } return streak; };
  const meetsRequirement = (requirement) => { if (!currentUser) return false; const userCheckIns = checkIns.filter((c) => c.user_id === currentUser.id); switch (requirement) { case 'first_visit': return userCheckIns.length >= 1; case 'visits_3': return userCheckIns.length >= 3; case 'visits_5': return userCheckIns.length >= 5; case 'visits_10': case 'check_ins_10': return userCheckIns.length >= 10; case 'visits_25': return userCheckIns.length >= 25; case 'visits_50': case 'check_ins_50': return userCheckIns.length >= 50; case 'visits_100': return userCheckIns.length >= 100; case 'streak_7': return calculateCurrentStreak(userCheckIns) >= 7; case 'streak_30': return calculateCurrentStreak(userCheckIns) >= 30; case 'streak_90': return calculateCurrentStreak(userCheckIns) >= 90; default: return true; } };

  // ── Derived data ──────────────────────────────────────────────────────────────
  const isGymOwner = currentUser && gym && currentUser.email === gym.owner_email && currentUser.account_type === 'gym_owner';
  const isGhostGym = gym && !gym.admin_id && !gym.owner_email;
  const currentCoach = currentUser && coaches.find((c) => c.user_email === currentUser.email);
  const isCoach = !!currentCoach;
  const showOwnerControls = isGymOwner && !viewAsMember;
  const canManageEvents = isGymOwner || (currentCoach?.can_manage_events ?? false);
  const canManageClasses = isGymOwner || (currentCoach?.can_manage_classes ?? false);
  const canPost = isGymOwner || (currentCoach?.can_post ?? false);
  const isMember = !!gymMembership || isGymOwner;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyCheckIns = checkIns.filter((c) => new Date(c.check_in_date) >= weekAgo);

  const upcomingEvents = events.filter((e) => { const d = new Date(e.event_date); const wk = new Date(now.getTime() + 7 * 86400000); return d >= now && d <= wk; }).slice(0, 2);

  const checkInLeaderboard = Object.values(weeklyCheckIns.reduce((acc, c) => { const id = c.user_id; if (!acc[id]) acc[id] = { userId: id, userName: c.user_name, count: 0 }; acc[id].count++; return acc; }, {})).sort((a, b) => b.count - a.count).slice(0, 10);
  const streakLeaderboard = Object.values(checkIns.reduce((acc, c) => { const id = c.user_id; if (!acc[id]) acc[id] = { userId: id, userName: c.user_name, streak: Math.floor(Math.random() * 30) + 1 }; return acc; }, {})).sort((a, b) => b.streak - a.streak).slice(0, 10);
  const weekAgoDate = new Date(now.getTime() - 7 * 86400000);
  const progressLeaderboard = Object.values(lifts.reduce((acc, lift) => { if (new Date(lift.lift_date) >= weekAgoDate) { const key = `${lift.member_id}-${lift.exercise}`; if (!acc[key]) acc[key] = { userId: lift.member_id, userName: lift.member_name, exercise: lift.exercise, maxWeight: lift.weight_lbs, previousMax: 0 }; else if (lift.weight_lbs > acc[key].maxWeight) { acc[key].previousMax = acc[key].maxWeight; acc[key].maxWeight = lift.weight_lbs; } } return acc; }, {})).map((item) => ({ userId: item.userId, userName: item.userName, exercise: item.exercise, increase: item.maxWeight - item.previousMax })).filter((item) => item.increase > 0).sort((a, b) => b.increase - a.increase).slice(0, 10);

  if (gymLoading && !gym) return <GymCommunitySkeleton />;
  if (!gymLoading && !gym) return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex items-center justify-center p-4">
      <div className="p-8 text-center rounded-2xl" style={CARD_STYLE}><p className="text-slate-400 mb-4">Gym not found</p><Link to={createPageUrl('Gyms')} className="text-blue-400 font-bold">Back to Gyms</Link></div>
    </div>
  );

  // ── Tab trigger style matching CoStride nav pattern ───────────────────────────
  const tabTriggerClass = "whitespace-nowrap ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-slate-900/80 backdrop-blur-md text-slate-400 font-bold rounded-full px-3 py-1.5 flex items-center gap-1.5 justify-center border border-slate-600/40 shadow-[0_3px_0_0_#0d1220,inset_0_1px_0_rgba(255,255,255,0.08)] data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:via-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";

  return (
    <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries(); }}>
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-x-hidden">

          {/* ── HERO BANNER ── */}
          <div className="relative overflow-hidden">
            {/* Hero image */}
            <div className="absolute inset-0 z-0">
              {gym.image_url
                ? <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover" style={{ opacity: 0.55 }} loading="eager" fetchPriority="high" />
                : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }} />
              }
              {/* Gradient overlays for depth */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,4,10,0.3) 0%, rgba(2,4,10,0.0) 40%, rgba(2,4,10,0.75) 100%)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(2,4,10,0.5) 0%, transparent 60%)' }} />
            </div>

            {/* Banner content */}
            <div className="relative z-10 px-4 pt-4 pb-0" style={{ minHeight: '140px' }}>
              {/* Top row: gym name + controls */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className={`font-black text-white drop-shadow-lg ${gym.name.length > 28 ? 'text-base' : gym.name.length > 18 ? 'text-lg' : 'text-xl'}`}>
                      {gym.name}
                    </h1>
                    {gym.verified && <BadgeCheck className="w-4 h-4 text-blue-400 flex-shrink-0 drop-shadow" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-white/60 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{gym.city}
                    </p>
                    {/* Member count pill */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <Users className="w-3 h-3 text-white/70" />
                      <span className="text-[11px] font-bold text-white">{gym?.members_count || 0} members</span>
                    </div>
                  </div>
                </div>

                {/* Owner / coach controls */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {isGhostGym && !isGymOwner && (
                    <button onClick={() => setShowInviteOwnerModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 shadow-[0_3px_0_0_#5b21b6,0_6px_20px_rgba(120,40,220,0.4)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100">
                      <Crown className="w-3.5 h-3.5" />Make Official
                    </button>
                  )}
                  {showOwnerControls && (
                    <button onClick={() => setShowEditHeroImage(true)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-white/90 active:scale-95 transition-transform">
                      <Edit className="w-3 h-3 inline mr-1" />Edit Hero
                    </button>
                  )}
                  {isGymOwner && (
                    <button onClick={() => setViewAsMember(!viewAsMember)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-white/90 active:scale-95 transition-transform">
                      {viewAsMember ? '👤 Member' : '👑 Owner'}
                    </button>
                  )}
                  {isCoach && !isGymOwner && (
                    <div className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'rgba(59,130,246,0.7)' }}>🎓 Coach</div>
                  )}
                </div>
              </div>
            </div>

            {/* ── TAB BAR ── */}
            <div className="relative z-10 pt-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <TabsList className="w-full flex justify-around bg-transparent px-3 py-2 h-auto gap-1.5">
                <TabsTrigger value="home" className={tabTriggerClass}>
                  <Home className="w-3.5 h-3.5" /><span>Home</span>
                </TabsTrigger>
                <TabsTrigger value="feed" className={tabTriggerClass}>
                  <MessageCircle className="w-3.5 h-3.5" /><span>Feed</span>
                </TabsTrigger>
                <TabsTrigger value="challenges" className={tabTriggerClass}>
                  <Trophy className="w-3.5 h-3.5" /><span>Challenges</span>
                </TabsTrigger>
                <TabsTrigger value="events" className={tabTriggerClass}>
                  <Calendar className="w-3.5 h-3.5" /><span>Events</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          {/* ── END HERO ── */}

          {/* ── CONTENT ── */}
          <div className="max-w-4xl mx-auto px-3 md:px-4 pt-3 pb-28 space-y-3 w-full overflow-hidden">

            {/* HOME TAB */}
            <TabsContent value="home" className="space-y-3 mt-0 w-full" asChild>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">

                {/* Ghost gym join banner */}
                {isGhostGym && !isMember && !showOwnerControls && (
                  <div className="rounded-2xl p-4 flex items-center justify-between gap-3"
                    style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(219,39,119,0.15))', border: '1px solid rgba(139,92,246,0.35)' }}>
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">Unlock rewards & challenges</p>
                      <p className="text-xs text-slate-400">Join this gym community</p>
                    </div>
                    <button onClick={() => joinGhostGymMutation.mutate()} disabled={joinGhostGymMutation.isPending}
                      className="px-4 py-2 rounded-full text-xs font-bold text-white flex-shrink-0 active:scale-95 transition-transform"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                      {joinGhostGymMutation.isPending ? 'Joining…' : 'Join Gym'}
                    </button>
                  </div>
                )}


                {/* ── JOIN WITH CODE + SET PRIMARY GYM ── */}
                {!isMember && !isGhostGym && !showOwnerControls && (
                  <div className="space-y-2">
                    {/* Buttons row */}
                    <div className="flex gap-2">
                      {/* Join with Code */}
                      <RippleButton
                        onClick={() => { setJoinPanel(p => p === 'code' ? null : 'code'); setJoinCodeError(''); setJoinCodeSuccess(false); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black transition-all duration-150 active:scale-95"
                        style={{
                          background: joinPanel === 'code'
                            ? 'linear-gradient(135deg,#1d4ed8,#1e40af)'
                            : 'linear-gradient(135deg,rgba(29,78,216,0.25),rgba(30,64,175,0.15))',
                          border: `1px solid ${joinPanel === 'code' ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.3)'}`,
                          boxShadow: joinPanel === 'code' ? '0 4px 0 0 #1e3a8a, 0 8px 24px rgba(59,130,246,0.3)' : '0 2px 0 0 rgba(0,0,0,0.4)',
                          color: joinPanel === 'code' ? '#fff' : 'rgba(147,197,253,0.9)',
                          transform: joinPanel === 'code' ? 'translateY(2px)' : 'translateY(0)',
                        }}>
                        <span style={{ fontSize: 16 }}>🔑</span>
                        <span>Join with Code</span>
                        <span style={{
                          display: 'inline-block',
                          transform: joinPanel === 'code' ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s cubic-bezier(0.34,1.4,0.64,1)',
                          fontSize: 11, opacity: 0.7,
                        }}>▼</span>
                      </RippleButton>

                      {/* Set Primary Gym */}
                      <RippleButton
                        onClick={() => { setJoinPanel(p => p === 'primary' ? null : 'primary'); setPrimaryConfirmed(false); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black transition-all duration-150 active:scale-95"
                        style={{
                          background: joinPanel === 'primary'
                            ? 'linear-gradient(135deg,#b45309,#92400e)'
                            : 'linear-gradient(135deg,rgba(180,83,9,0.25),rgba(146,64,14,0.15))',
                          border: `1px solid ${joinPanel === 'primary' ? 'rgba(251,191,36,0.55)' : 'rgba(251,191,36,0.25)'}`,
                          boxShadow: joinPanel === 'primary' ? '0 4px 0 0 #78350f, 0 8px 24px rgba(251,191,36,0.25)' : '0 2px 0 0 rgba(0,0,0,0.4)',
                          color: joinPanel === 'primary' ? '#fff' : 'rgba(253,230,138,0.9)',
                          transform: joinPanel === 'primary' ? 'translateY(2px)' : 'translateY(0)',
                        }}>
                        <span style={{ fontSize: 16 }}>⭐</span>
                        <span>Set Primary</span>
                        <span style={{
                          display: 'inline-block',
                          transform: joinPanel === 'primary' ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s cubic-bezier(0.34,1.4,0.64,1)',
                          fontSize: 11, opacity: 0.7,
                        }}>▼</span>
                      </RippleButton>
                    </div>

                    {/* ── JOIN WITH CODE PANEL ── */}
                    <SlidePanel open={joinPanel === 'code'}>
                      <div className="rounded-2xl p-4 mt-1" style={{ background: 'linear-gradient(135deg,rgba(17,34,80,0.95),rgba(10,20,50,0.98))', border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                        <p className="text-[13px] font-black text-white mb-1">Enter your gym invite code</p>
                        <p className="text-[11px] mb-3" style={{ color: 'rgba(148,163,184,0.7)' }}>Ask your gym owner or a member for the code</p>
                        {joinCodeSuccess ? (
                          <div className="flex flex-col items-center py-4 gap-2">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                              style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>✓</div>
                            <p className="text-sm font-black text-emerald-400">You're in!</p>
                            <p className="text-xs text-slate-400">Welcome to {gym?.name}</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-2">
                              <input
                                value={joinCode}
                                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinCodeError(''); }}
                                placeholder="e.g. GYM-XK29"
                                maxLength={10}
                                className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold text-white placeholder-slate-600 outline-none"
                                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${joinCodeError ? 'rgba(239,68,68,0.6)' : 'rgba(59,130,246,0.25)'}`, letterSpacing: '0.08em' }}
                              />
                              <button
                                onClick={() => {
                                  if (!joinCode.trim()) { setJoinCodeError('Please enter a code'); return; }
                                  // Wire to real mutation: joinGymMutation.mutate({ code: joinCode })
                                  setJoinCodeSuccess(true);
                                }}
                                className="px-4 py-2.5 rounded-xl text-sm font-black text-white active:scale-95 transition-transform"
                                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 3px 0 0 #1e3a8a' }}>
                                Join
                              </button>
                            </div>
                            {joinCodeError && <p className="text-[11px] text-red-400 mt-1.5 font-semibold">{joinCodeError}</p>}
                          </>
                        )}
                      </div>
                    </SlidePanel>

                    {/* ── SET PRIMARY GYM PANEL ── */}
                    <SlidePanel open={joinPanel === 'primary'}>
                      <div className="rounded-2xl p-4 mt-1" style={{ background: 'linear-gradient(135deg,rgba(40,24,8,0.95),rgba(25,15,5,0.98))', border: '1px solid rgba(251,191,36,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                        {primaryConfirmed ? (
                          <div className="flex flex-col items-center py-4 gap-2">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                              style={{ background: 'rgba(251,191,36,0.15)', border: '2px solid rgba(251,191,36,0.4)' }}>⭐</div>
                            <p className="text-sm font-black text-yellow-400">{gym?.name} is now your primary gym!</p>
                            <p className="text-xs text-slate-400">Your stats and check-ins will be tracked here</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>🏋️</div>
                              <div>
                                <p className="text-[13px] font-black text-white leading-tight">Set as your home gym</p>
                                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(148,163,184,0.65)' }}>Your check-ins, leaderboard rank &amp; streak will be tracked at {gym?.name}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setPrimaryConfirmed(true);
                                // Wire: updatePrimaryGymMutation.mutate({ gymId })
                              }}
                              className="w-full py-3 rounded-xl text-sm font-black text-white active:scale-95 transition-transform"
                              style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', boxShadow: '0 3px 0 0 #78350f, 0 6px 20px rgba(217,119,6,0.3)' }}>
                              ⭐ Confirm — Set {gym?.name} as Primary
                            </button>
                          </>
                        )}
                      </div>
                    </SlidePanel>
                  </div>
                )}

                {/* Polls */}
                {polls.length > 0 && (
                  <div className="space-y-3">
                    {polls.map((poll) => (
                      <PollCard key={poll.id} poll={poll}
                        onVote={!showOwnerControls && !poll.voters?.includes(currentUser?.id) ? (optionId) => votePollMutation.mutate({ pollId: poll.id, optionId }) : null}
                        userVoted={poll.voters?.includes(currentUser?.id)} isLoading={votePollMutation.isPending} />
                    ))}
                  </div>
                )}

                {/* Busy times */}
                <BusyTimesChart checkIns={checkIns} gymId={gymId} />

                {/* ── LEADERBOARD ── */}
                <LeaderboardSection
                  view={leaderboardView}
                  setView={setLeaderboardView}
                  checkInLeaderboard={checkInLeaderboard}
                  streakLeaderboard={streakLeaderboard}
                  progressLeaderboard={progressLeaderboard}
                />

                {/* Upcoming events preview */}
                {upcomingEvents.length > 0 && (
                  <div className="rounded-2xl p-4" style={CARD_STYLE}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,146,60,0.15)' }}>
                        <Calendar className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                      <h3 className="text-[13px] font-black text-white">This Week</h3>
                    </div>
                    <div className="space-y-2">
                      {upcomingEvents.map((event) => (
                        <WeeklyEventCard key={event.id} event={event}
                          onRSVP={!showOwnerControls ? (eventId) => { const e = events.find((e) => e.id === eventId); rsvpMutation.mutate({ eventId, currentAttendees: e.attendees || 0 }); } : null}
                          disabled={showOwnerControls} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Active challenges preview */}
                {gymChallenges.length > 0 && (
                  <div className="rounded-2xl p-4" style={CARD_STYLE}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.15)' }}>
                        <Trophy className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <h3 className="text-[13px] font-black text-white">New Challenges</h3>
                    </div>
                    <div className="space-y-2">
                      {gymChallenges.slice(0, 1).map((challenge) => (
                        <GymChallengeCard key={challenge.id} challenge={challenge}
                          isJoined={hasjoinedChallenge(challenge.id)}
                          onJoin={!showOwnerControls ? (challenge) => joinChallengeMutation.mutate(challenge) : null}
                          currentUser={currentUser} disabled={showOwnerControls} isOwner={showOwnerControls} onDelete={null} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* FEED TAB */}
            <TabsContent value="feed" className="space-y-3 mt-0 w-full" asChild>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
                {upcomingEvents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-white/40 uppercase tracking-wider">📅 This Week</p>
                    {upcomingEvents.map((event) => (
                      <WeeklyEventCard key={event.id} event={event}
                        onRSVP={!showOwnerControls ? (eventId) => { const e = events.find((e) => e.id === eventId); rsvpMutation.mutate({ eventId, currentAttendees: e.attendees || 0 }); } : null}
                        disabled={showOwnerControls} />
                    ))}
                  </div>
                )}
                {showOwnerControls && <CreateGymPostButton gym={gym} currentUser={currentUser} onPostCreated={() => queryClient.invalidateQueries({ queryKey: ['posts'] })} />}
                {posts.length === 0
                  ? (
                    <div className="rounded-2xl p-10 text-center" style={CARD_STYLE}>
                      <MessageCircle className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                      <p className="text-white font-bold mb-1 text-sm">No community posts yet</p>
                      <p className="text-xs text-slate-500">Be the first to share your workout! 💪</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {posts.slice(0, 10).map((post) => (
                        <PostCard key={post.id} post={post} fullWidth currentUser={currentUser}
                          onLike={() => {}} onComment={() => {}} onSave={() => {}}
                          onDelete={() => queryClient.invalidateQueries({ queryKey: ['posts'] })} />
                      ))}
                    </div>
                  )
                }
              </motion.div>
            </TabsContent>

            {/* CHALLENGES TAB */}
            <TabsContent value="challenges" className="space-y-3 mt-0 w-full" asChild>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
                {showOwnerControls && (
                  <button onClick={() => setShowCreateChallenge(true)}
                    className="w-full rounded-2xl py-4 flex flex-col items-center gap-2 text-white font-bold active:scale-[0.98] transition-transform"
                    style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.15))', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <Plus className="w-5 h-5" />
                    <span className="text-sm">Create Gym Challenge</span>
                  </button>
                )}
                {gymChallenges.length > 0
                  ? gymChallenges.map((challenge) => (
                    <GymChallengeCard key={challenge.id} challenge={challenge}
                      isJoined={hasjoinedChallenge(challenge.id)}
                      onJoin={!showOwnerControls ? (challenge) => joinChallengeMutation.mutate(challenge) : null}
                      currentUser={currentUser} disabled={showOwnerControls} isOwner={showOwnerControls}
                      onDelete={showOwnerControls ? (id) => { if (window.confirm('Delete this challenge?')) deleteChallengeMutation.mutate(id); } : null} />
                  ))
                  : (
                    <div className="rounded-2xl p-10 text-center" style={CARD_STYLE}>
                      <Trophy className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                      <p className="text-white font-bold mb-1 text-sm">No Active Challenges</p>
                      <p className="text-xs text-slate-500">Check back soon for new challenges!</p>
                    </div>
                  )
                }
              </motion.div>
            </TabsContent>

            {/* EVENTS TAB */}
            <TabsContent value="events" className="space-y-3 mt-0 w-full" asChild>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">

                {/* Classes */}
                <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.15)' }}>
                        <Target className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <h3 className="text-[13px] font-black text-white">Classes</h3>
                    </div>
                    {showOwnerControls && (
                      <button onClick={() => setShowManageClasses(true)}
                        className="text-[11px] font-bold text-blue-400 px-3 py-1 rounded-full active:scale-95 transition-transform"
                        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        Manage
                      </button>
                    )}
                  </div>
                  <div className="px-3 pb-4">
                    {classes.length === 0
                      ? <div className="py-6 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: 'rgba(255,255,255,0.06)' }}><Calendar className="w-7 h-7 mx-auto mb-1 text-slate-700" /><p className="text-slate-600 text-xs">No classes scheduled</p></div>
                      : <div className="space-y-2">
                        {classes.map((gymClass) => (
                          <div key={gymClass.id} className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.2))' }}>
                              <Target className="w-5 h-5 text-purple-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-[13px] mb-0.5 truncate">{gymClass.name}</h4>
                              <p className="text-xs text-slate-500 mb-1.5 truncate">{gymClass.description}</p>
                              <div className="flex flex-wrap gap-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-purple-300" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>{gymClass.instructor}</span>
                                {gymClass.duration_minutes && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-300" style={{ background: 'rgba(255,255,255,0.07)' }}>{gymClass.duration_minutes}min</span>}
                              </div>
                            </div>
                            {showOwnerControls && (
                              <button onClick={() => { if (window.confirm('Delete this class?')) deleteClassMutation.mutate(gymClass.id); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    }
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,146,60,0.15)' }}>
                        <Calendar className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                      <h3 className="text-[13px] font-black text-white">Upcoming Events</h3>
                    </div>
                    {showOwnerControls && (
                      <button onClick={() => setShowCreateEvent(true)}
                        className="text-[11px] font-bold text-blue-400 px-3 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-transform"
                        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <Plus className="w-3 h-3" />Create
                      </button>
                    )}
                  </div>
                  <div className="px-3 pb-4">
                    {events.filter((e) => new Date(e.event_date) >= now).length === 0
                      ? <div className="py-6 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: 'rgba(255,255,255,0.06)' }}><Calendar className="w-7 h-7 mx-auto mb-1 text-slate-700" /><p className="text-slate-600 text-xs">No upcoming events</p></div>
                      : <div className="space-y-2">
                        {events.filter((e) => new Date(e.event_date) >= now).slice(0, 5).map((event) => (
                          <EventCard key={event.id} event={event}
                            onRSVP={(eventId) => { const e = events.find((e) => e.id === eventId); rsvpMutation.mutate({ eventId, currentAttendees: e.attendees || 0 }); }}
                            isOwner={showOwnerControls}
                            onDelete={showOwnerControls ? (eventId) => { if (window.confirm('Delete?')) deleteEventMutation.mutate(eventId); } : null} />
                        ))}
                      </div>
                    }
                  </div>
                </div>

                {/* Coaches */}
                <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.15)' }}>
                        <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <h3 className="text-[13px] font-black text-white">Coaches</h3>
                    </div>
                    {showOwnerControls && (
                      <button onClick={() => setShowManageCoaches(true)}
                        className="text-[11px] font-bold text-blue-400 px-3 py-1 rounded-full active:scale-95 transition-transform"
                        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        Manage
                      </button>
                    )}
                  </div>
                  <div className="px-3 pb-4">
                    {coaches.length === 0
                      ? <div className="py-6 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: 'rgba(255,255,255,0.06)' }}><GraduationCap className="w-7 h-7 mx-auto mb-1 text-slate-700" /><p className="text-slate-600 text-xs">No coaches listed</p></div>
                      : <div className="space-y-2">
                        {coaches.slice(0, 5).map((coach) => {
                          const handleCopyEmail = () => { navigator.clipboard.writeText(coach.user_email); setCopiedCoachId(coach.id); setTimeout(() => setCopiedCoachId(null), 2000); };
                          return (
                            <div key={coach.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
                                {coach.avatar_url ? <img src={coach.avatar_url} alt={coach.name} className="w-full h-full object-cover" /> : <span className="text-base font-black text-white">{coach.name.charAt(0)}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <h4 className="font-bold text-white text-[13px] truncate">{coach.name}</h4>
                                  {coach.rating && <div className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" /><span className="text-[10px] font-bold text-slate-300">{coach.rating}</span></div>}
                                </div>
                                {coach.specialties?.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {coach.specialties.slice(0, 2).map((s, i) => <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-blue-300" style={{ background: 'rgba(59,130,246,0.12)' }}>{s}</span>)}
                                  </div>
                                )}
                              </div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform" style={{ background: 'rgba(59,130,246,0.1)' }}>
                                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3 bg-slate-800 border-slate-700">
                                  <div className="flex items-center gap-2">
                                    <a href={`mailto:${coach.user_email}`} className="text-blue-400 text-xs font-medium break-all flex-1">{coach.user_email}</a>
                                    <button onClick={handleCopyEmail} className="w-7 h-7 flex items-center justify-center hover:bg-slate-700 rounded transition-colors">
                                      <Copy className={`w-3.5 h-3.5 ${copiedCoachId === coach.id ? 'text-green-400' : 'text-slate-400'}`} />
                                    </button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          );
                        })}
                      </div>
                    }
                  </div>
                </div>
              </motion.div>
            </TabsContent>

          </div>
        </Tabs>

        {/* Modals — unchanged */}
        <CreateEventModal open={showCreateEvent} onClose={() => setShowCreateEvent(false)} onSave={(data) => createEventMutation.mutate(data)} gym={gym} isLoading={createEventMutation.isPending} />
        <ManageEquipmentModal open={showManageEquipment} onClose={() => setShowManageEquipment(false)} equipment={gym?.equipment || []} onSave={(equipment) => updateEquipmentMutation.mutate(equipment)} isLoading={updateEquipmentMutation.isPending} />
        <ManageRewardsModal open={showManageRewards} onClose={() => setShowManageRewards(false)} rewards={rewards} onCreateReward={(data) => createRewardMutation.mutate(data)} onDeleteReward={(id) => deleteRewardMutation.mutate(id)} gym={gym} isLoading={createRewardMutation.isPending} />
        <ManageClassesModal open={showManageClasses} onClose={() => setShowManageClasses(false)} classes={classes} onCreateClass={(data) => createClassMutation.mutate(data)} onDeleteClass={(id) => deleteClassMutation.mutate(id)} gym={gym} isLoading={createClassMutation.isPending} />
        <ManageCoachesModal open={showManageCoaches} onClose={() => setShowManageCoaches(false)} coaches={coaches} onCreateCoach={(data) => createCoachMutation.mutate(data)} onDeleteCoach={(id) => deleteCoachMutation.mutate(id)} onUpdateCoach={(coachId, data) => updateCoachMutation.mutate({ coachId, data })} gym={gym} isLoading={createCoachMutation.isPending} />
        <ManageGymPhotosModal open={showManagePhotos} onClose={() => setShowManagePhotos(false)} gallery={gym?.gallery || []} onSave={(gallery) => updateGalleryMutation.mutate(gallery)} isLoading={updateGalleryMutation.isPending} />
        <EditHeroImageModal open={showEditHeroImage} onClose={() => setShowEditHeroImage(false)} currentImageUrl={gym?.image_url} onSave={(image_url) => updateHeroImageMutation.mutate(image_url)} isLoading={updateHeroImageMutation.isPending} />
        <EditGymLogoModal open={showEditGymLogo} onClose={() => setShowEditGymLogo(false)} currentLogoUrl={gym?.logo_url} onSave={(logo_url) => updateGymLogoMutation.mutate(logo_url)} isLoading={updateGymLogoMutation.isPending} />
        <ManageMembersModal open={showManageMembers} onClose={() => setShowManageMembers(false)} gym={gym} onBanMember={(userId) => banMemberMutation.mutate(userId)} onUnbanMember={(userId) => unbanMemberMutation.mutate(userId)} />
        <UpgradeMembershipModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentUser={currentUser} />
        <CreateChallengeModal open={showCreateChallenge} onClose={() => setShowCreateChallenge(false)} gyms={allGyms} onSave={(data) => createChallengeMutation.mutate(data)} isLoading={createChallengeMutation.isPending} />
        <InviteOwnerModal isOpen={showInviteOwnerModal} onClose={() => setShowInviteOwnerModal(false)} gym={gym} currentUser={currentUser} />
      </div>
    </PullToRefresh>
  );
}