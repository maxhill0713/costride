import React, { useState, useEffect, useRef } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Trophy, TrendingUp, MessageCircle, Heart, BadgeCheck, Gift, ChevronLeft, ChevronRight, Calendar, Plus, Edit, GraduationCap, Clock, Target, Award, Crown, Dumbbell, Flame, CheckCircle, Trash2, Home, Mail, Copy, Zap, Activity, Timer, ChevronDown, ChevronUp, UserPlus, BarChart2 } from 'lucide-react';
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
import CoachProfileModal from '../components/gym/CoachProfileModal';
import ClassDetailModal from '../components/gym/ClassDetailModal';
import UpgradeMembershipModal from '../components/membership/UpgradeMembershipModal';
import JoinGymModal from '../components/membership/JoinGymModal';
import ChallengeProgressCard from '../components/challenges/ChallengeProgressCard';
import WeeklyEventCard from '../components/feed/WeeklyEventCard';
import SystemChallengeCard from '../components/challenges/SystemChallengeCard';
import AppChallengeCard from '../components/challenges/AppChallengeCard';
import GymChallengeCard from '../components/challenges/GymChallengeCard';
import MiniLeaderboard from '../components/challenges/MiniLeaderboard';
import CreateChallengeModal from '../components/challenges/CreateChallengeModal';
import MemberSpotlight from '../components/gym/MemberSpotlight';
import PullToRefresh from '../components/PullToRefresh';
import PollCard from '../components/polls/PollCard';
import BusyTimesChart from '../components/gym/BusyTimesChart';
import UpcomingEvents from '../components/home/UpcomingEvents';
import GymCommunitySkeleton from '../components/gym/GymCommunitySkeleton';
import InlineLeaderboard from '../components/gym/InlineLeaderboard';
import { motion, AnimatePresence } from 'framer-motion';

const pageSlideVariants = {
  hidden: { x: '100%', opacity: 1 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 380, damping: 36, mass: 1 } },
  exit: { x: '100%', opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 } }
};

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';

const CARD_STYLE = {
  background: CARD_BG,
  border: CARD_BORDER,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)'
};

const DIALOG_ANIM = `
  @keyframes gcDialogIn {
    0%   { transform: translate(-50%, calc(-50% + 22px)) scale(0.93); opacity: 0; }
    65%  { transform: translate(-50%, calc(-50% - 3px))  scale(1.01); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.0);               opacity: 1; }
  }
  @keyframes gcDialogOut {
    0%   { transform: translate(-50%, -50%) scale(1.0);  opacity: 1; }
    100% { transform: translate(-50%, calc(-50% + 16px)) scale(0.93); opacity: 0; }
  }
  @keyframes gcItemIn {
    0%   { transform: translateY(10px); opacity: 0; }
    65%  { transform: translateY(-2px); opacity: 1; }
    100% { transform: translateY(0);    opacity: 1; }
  }
  [role="dialog"][data-state="open"] {
    animation: gcDialogIn 280ms cubic-bezier(0.25,0.46,0.45,0.94) forwards !important;
  }
  [role="dialog"][data-state="closed"] {
    animation: gcDialogOut 200ms cubic-bezier(0.4,0,1,1) forwards !important;
  }
  .gc-item-in {
    opacity: 0;
    animation: gcItemIn 340ms cubic-bezier(0.22,1,0.36,1) forwards;
  }
`;

const LBOARD_ANIM = `
@keyframes lb-slide-up {
  from { opacity:0; transform:translateX(100%); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes lb-card-in {
  from { opacity:0; transform:translateY(28px) scale(0.9) rotateX(8deg); }
  to   { opacity:1; transform:translateY(0) scale(1) rotateX(0deg); }
}
@keyframes lb-row-in {
  from { opacity:0; transform:translateX(-14px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes lb-flame {
  0%,100% { transform:scale(1) rotate(-4deg) translateY(0); filter:brightness(1); }
  33%     { transform:scale(1.3) rotate(4deg) translateY(-2px); filter:brightness(1.3); }
  66%     { transform:scale(0.9) rotate(-2deg) translateY(1px); filter:brightness(0.9); }
}
@keyframes lb-gold-pulse {
  0%,100% { box-shadow:0 0 0 2px rgba(255,196,0,0.5),0 0 20px rgba(255,196,0,0.25); }
  50%     { box-shadow:0 0 0 4px rgba(255,196,0,0.8),0 0 40px rgba(255,196,0,0.5); }
}
@keyframes lb-silver-pulse {
  0%,100% { box-shadow:0 0 0 2px rgba(192,212,232,0.4),0 0 16px rgba(192,212,232,0.18); }
  50%     { box-shadow:0 0 0 3px rgba(192,212,232,0.65),0 0 28px rgba(192,212,232,0.32); }
}
@keyframes lb-bronze-pulse {
  0%,100% { box-shadow:0 0 0 2px rgba(210,120,50,0.42),0 0 16px rgba(210,120,50,0.18); }
  50%     { box-shadow:0 0 0 3px rgba(210,120,50,0.68),0 0 28px rgba(210,120,50,0.32); }
}
@keyframes lb-shimmer {
  0%   { transform:translateX(-100%); }
  100% { transform:translateX(400%); }
}
@keyframes lb-count-up {
  from { opacity:0; transform:translateY(6px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes lb-orb-drift {
  0%,100% { transform:translate(0,0) scale(1); opacity:0.6; }
  33%     { transform:translate(20px,-15px) scale(1.1); opacity:0.8; }
  66%     { transform:translate(-10px,10px) scale(0.95); opacity:0.5; }
}
@keyframes lb-scan-line {
  0%   { top:0%; opacity:0.4; }
  100% { top:100%; opacity:0; }
}
@keyframes lb-badge-pop {
  0%   { transform:scale(0) rotate(-20deg); opacity:0; }
  60%  { transform:scale(1.15) rotate(5deg); opacity:1; }
  100% { transform:scale(1) rotate(0deg); opacity:1; }
}
`;

const MEDALS = [
{ rank: 1, color: '#FFD700', colorRgb: '255,215,0', cardBorder: 'rgba(255,215,0,0.55)', cardBorderDim: 'rgba(255,215,0,0.15)', glow: 'rgba(255,215,0,0.3)', glowStrong: 'rgba(255,215,0,0.6)', bg: 'linear-gradient(160deg,rgba(60,42,0,0.95) 0%,rgba(28,18,0,0.98) 100%)', avatarRing: 'conic-gradient(#FFD700,#FFA500,#FFD700,#FFF0A0,#FFD700)', badgeBg: 'linear-gradient(145deg,#FFE566,#CC8800)', badgeText: 'rgba(80,40,0,0.9)', pulse: 'lb-gold-pulse', shine: 'rgba(255,225,80,0.22)', insetGlow: 'rgba(255,215,0,0.14)', label: '👑', tierLabel: 'CHAMPION', tierColor: '#FFD700', heightExtra: 20 },
{ rank: 2, color: '#C8D8EC', colorRgb: '200,216,236', cardBorder: 'rgba(180,205,230,0.48)', cardBorderDim: 'rgba(180,205,230,0.12)', glow: 'rgba(180,205,230,0.2)', glowStrong: 'rgba(180,205,230,0.45)', bg: 'linear-gradient(160deg,rgba(16,28,52,0.95) 0%,rgba(6,12,28,0.98) 100%)', avatarRing: 'conic-gradient(#C8D8EC,#8AACCF,#C8D8EC,#E8F0FA,#C8D8EC)', badgeBg: 'linear-gradient(145deg,#D4E4F4,#6A96BC)', badgeText: 'rgba(10,30,60,0.85)', pulse: 'lb-silver-pulse', shine: 'rgba(200,220,240,0.14)', insetGlow: 'rgba(180,205,230,0.09)', label: '🥈', tierLabel: 'ELITE', tierColor: '#C8D8EC', heightExtra: 6 },
{ rank: 3, color: '#E8904A', colorRgb: '232,144,74', cardBorder: 'rgba(215,128,58,0.5)', cardBorderDim: 'rgba(215,128,58,0.14)', glow: 'rgba(215,128,58,0.22)', glowStrong: 'rgba(215,128,58,0.45)', bg: 'linear-gradient(160deg,rgba(48,22,6,0.95) 0%,rgba(20,8,2,0.98) 100%)', avatarRing: 'conic-gradient(#E8904A,#A05820,#E8904A,#F4C090,#E8904A)', badgeBg: 'linear-gradient(145deg,#E8904A,#8C4818)', badgeText: 'rgba(50,15,0,0.85)', pulse: 'lb-bronze-pulse', shine: 'rgba(218,140,72,0.15)', insetGlow: 'rgba(215,128,58,0.1)', label: '🥉', tierLabel: 'PRO', tierColor: '#E8904A', heightExtra: 0 }];

const NAV_ROW = [
{ rankOpacity: 1, nameOpacity: 0.92, barOpacity: 0.55, pillOpacity: 0.9 },
{ rankOpacity: 0.88, nameOpacity: 0.82, barOpacity: 0.48, pillOpacity: 0.8 },
{ rankOpacity: 0.76, nameOpacity: 0.72, barOpacity: 0.40, pillOpacity: 0.7 },
{ rankOpacity: 0.65, nameOpacity: 0.62, barOpacity: 0.34, pillOpacity: 0.6 },
{ rankOpacity: 0.55, nameOpacity: 0.52, barOpacity: 0.28, pillOpacity: 0.52 },
{ rankOpacity: 0.46, nameOpacity: 0.44, barOpacity: 0.22, pillOpacity: 0.44 },
{ rankOpacity: 0.38, nameOpacity: 0.36, barOpacity: 0.18, pillOpacity: 0.38 }];

const CLASS_TYPE_CONFIG = {
  hiit: { label: 'HIIT', emoji: '⚡', color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  yoga: { label: 'Yoga', emoji: '🧘', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  strength: { label: 'Strength', emoji: '🏋️', color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
  cardio: { label: 'Cardio', emoji: '🏃', color: '#fb7185', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.25)' },
  spin: { label: 'Spin', emoji: '🚴', color: '#38bdf8', bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.25)' },
  boxing: { label: 'Boxing', emoji: '🥊', color: '#fb923c', bg: 'rgba(234,88,12,0.12)', border: 'rgba(234,88,12,0.25)' },
  pilates: { label: 'Pilates', emoji: '🌸', color: '#c084fc', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)' },
  default: { label: 'Class', emoji: '🎯', color: '#38bdf8', bg: 'rgba(14,165,233,0.10)', border: 'rgba(14,165,233,0.2)' }
};
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Full day names mapping
const DAY_FULL_NAMES = {
  'Mon': 'Monday',
  'Tue': 'Tuesday',
  'Wed': 'Wednesday',
  'Thu': 'Thursday',
  'Fri': 'Friday',
  'Sat': 'Saturday',
  'Sun': 'Sunday'
};

function getClassType(c) {
  const n = (c.name || c.title || '').toLowerCase();
  if (n.includes('hiit') || n.includes('interval')) return 'hiit';
  if (n.includes('yoga') || n.includes('zen')) return 'yoga';
  if (n.includes('strength') || n.includes('weight') || n.includes('lift') || n.includes('power')) return 'strength';
  if (n.includes('cardio') || n.includes('aerobic') || n.includes('zumba')) return 'cardio';
  if (n.includes('spin') || n.includes('cycle') || n.includes('bike')) return 'spin';
  if (n.includes('box') || n.includes('mma') || n.includes('kickbox')) return 'boxing';
  if (n.includes('pilates') || n.includes('barre')) return 'pilates';
  return 'default';
}

function getScheduleDays(c) {
  const schedule = c.schedule;
  if (!schedule) return [];
  if (Array.isArray(schedule)) {
    return DAYS_SHORT.filter((d) => schedule.some((s) => (s.day || '').toLowerCase().includes(d.toLowerCase())));
  }
  if (typeof schedule === 'string') {
    return DAYS_SHORT.filter((d) => schedule.toLowerCase().includes(d.toLowerCase()));
  }
  return [];
}

const AV_COLORS = [
{ bg: '#1a2a4a', color: '#93c5fd' },
{ bg: '#2a1a3a', color: '#c4b5fd' },
{ bg: '#1a2e20', color: '#86efac' },
{ bg: '#2e1a1a', color: '#fca5a5' },
{ bg: '#1a2535', color: '#7dd3fc' },
{ bg: '#422006', color: '#fb923c' },
{ bg: '#1e2a30', color: '#67e8f9' },
{ bg: '#2a1a28', color: '#f0abfc' }];

const colorForUser = (userId) =>
AV_COLORS[(userId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];

function ActiveNowStrip({ checkIns, memberAvatarMap }) {
  const getTimestamp = (c) => {
    const candidates = [c.created_date, c.created_at, c.timestamp, c.check_in_time, c.checkin_time, c.date_created, c.check_in_date];
    let best = null;
    for (const v of candidates) {
      if (!v) continue;
      const d = new Date(v);
      if (!isNaN(d.getTime()) && (best === null || d > best)) best = d;
    }
    return best;
  };
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const seen = new Set();
  const recent = checkIns.
  filter((c) => {const ts = getTimestamp(c);return ts && ts >= twoHoursAgo;}).
  filter((c) => {if (seen.has(c.user_id)) return false;seen.add(c.user_id);return true;}).
  slice(0, 12);
  if (recent.length === 0) return null;
  const ini = (n = '') => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ ...CARD_STYLE, borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
        <span style={{ position: 'relative', width: 8, height: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: 'rgba(34,197,94,0.25)', animation: 'an-ping 1.5s ease-in-out infinite' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.9)', flexShrink: 0 }} />
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
          {recent.length} Active Now
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'hidden' }}>
        {recent.slice(0, 8).map((c, i) => {
          const col = AV_COLORS[i % AV_COLORS.length];
          const avatar = memberAvatarMap[c.user_id];
          return (
            <div key={c.user_id || i} title={c.user_name}
            style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: col.bg, border: '2px solid rgba(6,8,18,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: col.color,
              overflow: 'hidden', marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              {avatar ?
              <img src={avatar} alt={c.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
              ini(c.user_name)}
            </div>);
        })}
        {recent.length > 8 &&
        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(6,8,18,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.5)',
          marginLeft: -8, zIndex: 0 }}>
            +{recent.length - 8}
          </div>
        }
      </div>
    </div>);
}

const ACTIVITY_CSS = `
@keyframes an-ping   { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.8);opacity:0} }
@keyframes af-in     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes af-like   { 0%{transform:scale(1)} 40%{transform:scale(1.35)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
@keyframes af-pr-glow{ 0%,100%{text-shadow:0 0 8px rgba(234,179,8,0.6)} 50%{text-shadow:0 0 18px rgba(234,179,8,1)} }
`;
function injectActivityCSS() {
  if (!document.getElementById('af-css')) {
    const s = document.createElement('style');s.id = 'af-css';s.textContent = ACTIVITY_CSS;
    document.head.appendChild(s);
  }
}

const FEED_TYPES = {
  checkin: { icon: MapPin, iconColor: '#60a5fa', iconBg: 'rgba(37,99,235,0.14)', iconBorder: 'rgba(37,99,235,0.22)', verb: 'checked in' },
  lift_pr: { icon: Trophy, iconColor: '#eab308', iconBg: 'rgba(234,179,8,0.14)', iconBorder: 'rgba(234,179,8,0.25)', verb: 'hit a new PR 🔥' },
  lift: { icon: Dumbbell, iconColor: '#a78bfa', iconBg: 'rgba(168,85,247,0.12)', iconBorder: 'rgba(168,85,247,0.22)', verb: 'logged a workout' },
  challenge: { icon: Trophy, iconColor: '#f97316', iconBg: 'rgba(249,115,22,0.14)', iconBorder: 'rgba(249,115,22,0.25)', verb: 'joined a challenge 🏆' },
  milestone: { icon: Award, iconColor: '#fbbf24', iconBg: 'rgba(251,191,36,0.14)', iconBorder: 'rgba(251,191,36,0.25)', verb: 'hit a milestone 🎉' },
  post: { icon: MessageCircle, iconColor: '#34d399', iconBg: 'rgba(16,185,129,0.12)', iconBorder: 'rgba(16,185,129,0.22)', verb: 'has posted' }
};

function FeedCard({ item, memberAvatarMap, liked, onLike, index }) {
  useEffect(() => {injectActivityCSS();}, []);
  const [postExpanded, setPostExpanded] = React.useState(false);
  const col = colorForUser(item.userId);
  const avatar = item.gymAvatar !== undefined ? item.gymAvatar : memberAvatarMap[item.userId];
  const ini = (n = '') => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const type = item.type === 'checkin' ? FEED_TYPES.checkin :
  item.type === 'challenge' ? FEED_TYPES.challenge :
  item.type === 'milestone' ? FEED_TYPES.milestone :
  item.type === 'post' ? FEED_TYPES.post :
  item.data?.is_personal_record || item.data?.is_pr ? FEED_TYPES.lift_pr :
  FEED_TYPES.lift;

  const isPR = item.type === 'lift' && (item.data?.is_personal_record || item.data?.is_pr);
  const TypeIcon = type.icon;

  const timeAgo = (d) => {
    if (!d) return '';
    let date = new Date(d);
    if (typeof d === 'string' && !d.endsWith('Z') && !d.match(/[+-]\d{2}:\d{2}$/)) {
      date = new Date(d + 'Z');
    }
    const s = (Date.now() - date) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.045)', animation: `af-in 0.3s ease ${index * 0.04}s both` }}>
      <div style={{ display: 'flex', gap: 12, padding: '13px 14px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
            background: col.bg, border: `2px solid ${isPR ? 'rgba(234,179,8,0.5)' : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: col.color,
            boxShadow: isPR ? '0 0 12px rgba(234,179,8,0.35)' : '0 2px 8px rgba(0,0,0,0.35)' }}>
            {avatar ?
            <img src={avatar} alt={item.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
            ini(item.userName)}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, color: 'rgba(226,232,240,0.9)', lineHeight: 1.4, marginBottom: 3 }}>
            <span style={{ fontWeight: 800, color: '#fff' }}>{item.userName}</span>
            {' '}
            <span style={{ color: isPR ? '#fbbf24' : item.type === 'challenge' ? '#fb923c' : item.type === 'milestone' ? '#fbbf24' : item.type === 'post' ? '#34d399' : 'rgba(226,232,240,0.7)',
              animation: isPR ? 'af-pr-glow 2s ease-in-out infinite' : 'none' }}>
              {type.verb}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {item.type === 'checkin' &&
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>At the gym</span>
            }
            {(item.type === 'lift' || item.type === 'lift_pr') &&
            <>
                <span style={{ fontSize: 11, fontWeight: 700,
                color: isPR ? 'rgba(251,191,36,0.9)' : 'rgba(167,139,250,0.9)',
                background: isPR ? 'rgba(234,179,8,0.1)' : 'rgba(168,85,247,0.1)',
                border: `1px solid ${isPR ? 'rgba(234,179,8,0.2)' : 'rgba(168,85,247,0.2)'}`,
                borderRadius: 99, padding: '2px 8px' }}>
                  {item.data?.workout_type || item.data?.exercise || 'Workout'}
                </span>
                {item.data?.duration_minutes &&
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                    {item.data.duration_minutes} min
                  </span>
              }
                {item.data?.weight_lbs &&
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
                    {item.data.weight_lbs} lbs
                  </span>
              }
              </>
            }
            {item.type === 'challenge' && item.data?.title &&
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(249,115,22,0.9)',
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
              borderRadius: 99, padding: '2px 8px' }}>
                {item.data.title}
              </span>
            }
            {item.type === 'milestone' && item.data?.title &&
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(251,191,36,0.9)',
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: 99, padding: '2px 8px' }}>
                {item.data.title}
              </span>
            }
            {item.type === 'post' && !postExpanded &&
            <button onClick={() => setPostExpanded(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(52,211,153,0.75)',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 99, padding: '2px 9px', cursor: 'pointer' }}>
                Show post <ChevronDown style={{ width: 10, height: 10 }} />
              </button>
            }
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          justifyContent: 'space-between', flexShrink: 0, minWidth: 40, gap: 4 }}>
          <span style={{ fontSize: 10.5, color: 'rgba(148,163,184,0.45)', fontWeight: 600 }}>
            {timeAgo(item.date)}
          </span>
          {item.type === 'post' && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.65)' }}>
              {Object.keys(item.data?.reactions || {}).length} Reacts
            </span>
          )}
        </div>
      </div>
      {item.type === 'post' && postExpanded &&
      <div style={{ margin: '0 14px 12px', padding: '10px 12px',
        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(52,211,153,0.15)',
        borderRadius: 10 }}>
          <p style={{ fontSize: 12.5, color: 'rgba(226,232,240,0.8)', lineHeight: 1.55, margin: '0 0 8px' }}>
            {item.data?.content}
          </p>
          {item.data?.image_url &&
        <img src={item.data.image_url} alt="post" style={{ width: '100%', borderRadius: 8, marginBottom: 6, maxHeight: 200, objectFit: 'cover' }} />
        }
          <button onClick={() => setPostExpanded(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(148,163,184,0.5)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <ChevronUp style={{ width: 10, height: 10 }} /> Collapse
          </button>
        </div>
      }
    </div>);
}

function ActivityStats() {return null;}

function GymActivityFeed({ checkIns, memberAvatarMap, memberNameMap = {}, workoutLogs = [], challengeParticipants = [], challenges = [], achievements = [], posts = [] }) {
  const [likedIds, setLikedIds] = React.useState(new Set());

  const toggleLike = (id) => setLikedIds((prev) => {
    const next = new Set(prev);next.has(id) ? next.delete(id) : next.add(id);return next;
  });

  const items = React.useMemo(() => {
    const all = [];
    const resolveName = (userId, fallback) => memberNameMap[userId] || fallback || 'Member';
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const seenCI = new Set();
    checkIns.forEach((c) => {
      const key = `${c.user_id}-${(c.check_in_date || '').slice(0, 10)}`;
      if (seenCI.has(key)) return;
      seenCI.add(key);
      all.push({ type: 'checkin', id: `ci-${c.id}`, userId: c.user_id, userName: resolveName(c.user_id, c.user_name), date: c.check_in_date, data: c });
    });
    workoutLogs.forEach((w) => {
      all.push({ type: 'lift', id: `wl-${w.id}`, userId: w.user_id, userName: resolveName(w.user_id, w.user_name), date: w.created_date || w.completed_date, data: w });
    });
    const challengeMap = {};
    challenges.forEach((c) => {challengeMap[c.id] = c;});
    challengeParticipants.forEach((p) => {
      const ch = challengeMap[p.challenge_id];
      all.push({ type: 'challenge', id: `cp-${p.id}`, userId: p.user_id, userName: resolveName(p.user_id, p.user_name), date: p.joined_date || p.created_date, data: ch || { title: p.challenge_title || 'a challenge' } });
    });
    achievements.forEach((a) => {
      all.push({ type: 'milestone', id: `ach-${a.id}`, userId: a.user_id, userName: resolveName(a.user_id, a.user_name), date: a.created_date, data: a });
    });
    posts.filter((p) => !p.is_hidden).forEach((p) => {
    const isGymPost = !!p.post_type;
    const postUserName = isGymPost ? (p.gym_name || p.member_name || 'Gym') : resolveName(p.member_id, p.member_name);
    const postUserId = isGymPost ? `gym_post_${p.gym_id || p.member_id}` : p.member_id;
    const feedItem = { type: 'post', id: `post-${p.id}`, userId: postUserId, userName: postUserName, isGymPost, date: p.created_date, data: p };
    if (isGymPost) feedItem.gymAvatar = p.member_avatar || null;
    all.push(feedItem);
    });
    return all.
    filter((item) => item.date && new Date(item.date) >= sevenDaysAgo).
    sort((a, b) => new Date(b.date) - new Date(a.date)).
    slice(0, 60);
  }, [checkIns, workoutLogs, challengeParticipants, challenges, achievements, posts]);

  if (items.length === 0) return null;

  return (
    <div style={{ ...CARD_STYLE, borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ padding: '13px 14px 11px', borderBottom: '1px solid rgba(255,255,255,0.055)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>Gym Activity Feed</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.28)' }}>{items.length} activities in the last week</span>
      </div>
      <div style={{ maxHeight: 400, overflowY: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {items.map((item, index) =>
        <FeedCard key={item.id} item={item} memberAvatarMap={memberAvatarMap} liked={likedIds.has(item.id)} onLike={toggleLike} index={index} />
        )}
      </div>
    </div>);
}

function ClassCard({ gymClass, isOwner, onDelete, onBook, booked }) {return null;}
function TodayStrip({ classes, bookedIds, onBook }) {return null;}

const CLASS_IMAGES = {
  hiit: 'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=800&q=80',
  yoga: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  cardio: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  spin: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80',
  pilates: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'
};

const CLASS_CSS = `
@keyframes cl-shimmer{0%{transform:translateX(-100%);opacity:0}20%{opacity:1}80%{opacity:1}100%{transform:translateX(220%);opacity:0}}
@keyframes cl-bar    {from{width:0}}
@keyframes cl-hot    {0%,100%{opacity:.8}50%{opacity:1}}
@keyframes cl-in     {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
`;
function injectClassCSS() {
  if (!document.getElementById('cl-css')) {const s = document.createElement('style');s.id = 'cl-css';s.textContent = CLASS_CSS;document.head.appendChild(s);}
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];

function getMockTime(gymClass, index) {
  let s = '';
  if (Array.isArray(gymClass.schedule)) {
    s = gymClass.schedule[0]?.time || '';
  } else {
    s = gymClass.schedule || '';
  }
  s = String(s);
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) return m[0];
  const times = ['06:00', '07:30', '09:00', '10:30', '12:00', '13:30', '16:00', '17:30', '18:00', '19:30', '20:00'];
  return times[index % times.length];
}
function getTimeSlot(t) {
  const h = parseInt((t || '12').split(':')[0]);
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

// Helper to compute finish time string like "21:00-22:00 (1 hour)"
function getTimeRange(startTime, durationMinutes) {
  if (!startTime) return null;
  const m = startTime.match(/(\d{1,2}):(\d{2})/);
  if (!m) return startTime;
  const startH = parseInt(m[1]);
  const startM = parseInt(m[2]);
  const totalMins = startH * 60 + startM + (durationMinutes || 60);
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const endStr = `${pad(endH)}:${pad(endM)}`;
  const durationLabel = durationMinutes
    ? durationMinutes % 60 === 0
      ? `${durationMinutes / 60} hour${durationMinutes / 60 !== 1 ? 's' : ''}`
      : `${durationMinutes} min`
    : '1 hour';
  return `${startTime}-${endStr} (${durationLabel})`;
}

function btn3D(active, activeProps, inactiveProps) {
  return {
    style: active ? activeProps : inactiveProps,
    onMouseDown: (e) => {
      e.currentTarget.style.transform = 'translateY(3px)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderBottom = '1px solid rgba(0,0,0,0.4)';
    },
    onMouseUp: (e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '';e.currentTarget.style.borderBottom = '';},
    onMouseLeave: (e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '';e.currentTarget.style.borderBottom = '';},
    onTouchStart: (e) => {
      e.currentTarget.style.transform = 'translateY(3px)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderBottom = '1px solid rgba(0,0,0,0.4)';
    },
    onTouchEnd: (e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '';e.currentTarget.style.borderBottom = '';}
  };
}

// ─── ClassDateHeader ─────────────────────────────────────────────────────────
function ClassDateHeader({ activeDay, setActiveDay, activeSlot, setActiveSlot }) {
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const jsDay = d.getDay();
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
    return {
      offset: i,
      dayIdx,
      label: DAY_LABELS[dayIdx],
      num: d.getDate(),
      isToday: i === 0,
      date: d,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Day selector */}
      <div style={{ display: 'flex', gap: 5 }}>
        {days.map((d) => {
          const active = activeDay === d.offset;
          const b = btn3D(
            active,
            {
              flex: 1,
              padding: '7px 2px',
              borderRadius: 13, cursor: 'pointer',
              background: 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)',
              border: '1px solid transparent',
              borderBottom: '3px solid #1a3fa8',
              boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 6px 20px rgba(37,99,235,0.35)',
              color: '#fff',
              transition: 'transform 0.08s ease, box-shadow 0.08s ease, border-bottom 0.08s ease',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              minWidth: 0,
            },
            {
              flex: 1,
              padding: '7px 2px',
              borderRadius: 13, cursor: 'pointer',
              background: d.isToday ? 'rgba(37,99,235,0.12)' : 'rgba(20,28,60,0.8)',
              border: `1px solid ${d.isToday ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.09)'}`,
              borderBottom: '3px solid rgba(0,0,0,0.5)',
              boxShadow: '0 2px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
              color: d.isToday ? 'rgba(147,197,253,0.9)' : 'rgba(255,255,255,0.45)',
              transition: 'transform 0.08s ease, box-shadow 0.08s ease, border-bottom 0.08s ease',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              minWidth: 0,
            }
          );
          return (
            <button key={d.offset} onClick={() => setActiveDay(d.offset)} {...b}>
              <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
                color: active ? 'rgba(255,255,255,0.7)' : d.isToday ? 'rgba(147,197,253,0.75)' : 'rgba(255,255,255,0.35)' }}>
                {d.label}
              </span>
              <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {d.num}
              </span>
              {d.isToday && !active &&
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 5px rgba(96,165,250,0.8)' }} />
              }
            </button>);
        })}
      </div>

      {/* Time-slot filters — FIX: use React state only, no inline style mutation */}
      <div style={{ display: 'flex', gap: 8 }}>
        {TIME_SLOTS.map((slot) => {
          const active = activeSlot === slot;
          return (
            <button
              key={slot}
              onClick={() => setActiveSlot(active ? null : slot)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 99,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: active ? 800 : 700,
                background: active
                  ? 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)'
                  : 'rgba(20,28,60,0.8)',
                border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                borderBottom: active ? '3px solid #1a3fa8' : '3px solid rgba(0,0,0,0.5)',
                boxShadow: active
                  ? '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                  : '0 2px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                transition: 'background 0.12s ease, color 0.12s ease, border 0.12s ease, box-shadow 0.12s ease',
              }}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>);
}

function PremiumClassCard({ gymClass, isOwner, onDelete, onBook, booked, onClick, timeStr, index }) {
  useEffect(() => {injectClassCSS();}, []);
  const [pressed, setPressed] = useState(false);

  const typeKey = getClassType(gymClass);
  const cfg = CLASS_TYPE_CONFIG[typeKey];
  // Reduced image height by 40% (was 185, now 111)
  const IMAGE_HEIGHT = 111;
  const img = gymClass.image_url || CLASS_IMAGES[typeKey] || CLASS_IMAGES.default;
  const cap = gymClass.capacity || gymClass.max_participants || null;
  const enr = gymClass.enrolled || gymClass.participants_count || 0;
  const left = cap ? cap - enr : null;
  const full = left !== null && left <= 0;
  const pct = cap ? Math.min(100, Math.round(enr / cap * 100)) : null;
  const hot = left !== null && left <= 5 && !full;
  const isPrem = !!(gymClass.price_drop_in || gymClass.price_member || gymClass.is_premium);
  const ini = (n = '') => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const diff = gymClass.difficulty ?
  gymClass.difficulty.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) :
  null;

  const coachName = gymClass.instructor || gymClass.coach_name;
  const coachAvatar = gymClass.coach_avatar || gymClass.instructor_avatar || null;
  const timeRange = getTimeRange(timeStr, gymClass.duration_minutes);

  return (
    <div
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
        background: CARD_BG,
        border: `1px solid ${booked ? cfg.border : CARD_BORDER}`,
        borderBottom: booked ?
        `3px solid ${cfg.color}66` :
        '3px solid rgba(0,0,0,0.55)',
        boxShadow: booked ?
        `0 0 0 1px ${cfg.border}, 0 3px 0 rgba(0,0,0,0.4), 0 12px 36px rgba(0,0,0,0.6)` :
        '0 3px 0 rgba(0,0,0,0.45), 0 8px 28px rgba(0,0,0,0.5)',
        transform: pressed ? 'scale(0.965) translateY(3px)' : 'scale(1)',
        transition: 'transform 0.1s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.1s ease',
        animation: `cl-in 0.32s ease ${index * 0.055}s both`,
        display: 'flex', flexDirection: 'column',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)'
      }}>

      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.09) 50%,transparent 90%)', flexShrink: 0 }} />
      <div style={{ height: 3, background: `linear-gradient(90deg,${cfg.color}cc,${cfg.color}44)`, flexShrink: 0 }} />

      {/* Image area — reduced height, coach avatar top-left, no "Class" badge, no shimmer overlay */}
      <div style={{ position: 'relative', height: IMAGE_HEIGHT, overflow: 'hidden', flexShrink: 0 }}>
        <img src={img} alt={gymClass.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover',
          transform: pressed ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)',
          filter: full ? 'brightness(0.65) saturate(0.5)' : 'none' }} />

        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.12) 35%,rgba(8,10,22,0.97) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 75% 15%,rgba(${cfg.color.slice(1).match(/../g).map((h) => parseInt(h, 16)).join(',')},0.18) 0%,transparent 60%)` }} />

        {/* COACH AVATAR — top left */}
        {coachName &&
        <div style={{
          position: 'absolute', top: 8, left: 8,
          width: 32, height: 32, borderRadius: '50%',
          background: `linear-gradient(135deg,${cfg.color}44,${cfg.color}1a)`,
          border: `2px solid ${cfg.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 900, color: cfg.color,
          overflow: 'hidden',
          boxShadow: `0 2px 8px rgba(0,0,0,0.5)` }}>
          {coachAvatar
            ? <img src={coachAvatar} alt={coachName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : ini(coachName)
          }
        </div>
        }

        {isPrem &&
        <div style={{ position: 'absolute', top: 8, left: coachName ? 46 : 8,
          fontSize: 8, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#fbbf24', background: 'rgba(0,0,0,0.65)',
          border: '1px solid rgba(251,191,36,0.4)', borderRadius: 20, padding: '2px 8px' }}>
            ★ PREMIUM
          </div>
        }

        <div style={{ position: 'absolute', top: 8, right: isOwner ? 42 : 8, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          {booked && <span style={{ fontSize: 9, fontWeight: 900, color: '#34d399', background: 'rgba(0,0,0,0.68)', border: '1px solid rgba(52,211,153,0.45)', borderRadius: 20, padding: '3px 8px' }}>✓ Booked</span>}
          {full && !booked && <span style={{ fontSize: 9, fontWeight: 900, color: '#f87171', background: 'rgba(0,0,0,0.68)', border: '1px solid rgba(248,113,113,0.45)', borderRadius: 20, padding: '3px 8px' }}>Full</span>}
          {hot && !full && <span style={{ fontSize: 9, fontWeight: 900, color: '#fbbf24', background: 'rgba(0,0,0,0.68)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 20, padding: '3px 8px', animation: 'cl-hot 1.8s ease-in-out infinite' }}>🔥 {left} left</span>}
        </div>

        {isOwner &&
        <button onClick={(e) => {e.stopPropagation();onDelete && onDelete(gymClass.id);}}
        style={{ position: 'absolute', top: 9, right: 9, width: 28, height: 28, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.75)', border: 'none', cursor: 'pointer', zIndex: 5 }}>
            <Trash2 style={{ width: 12, height: 12, color: '#fff' }} />
          </button>
        }

        {/* Class name + coach name at bottom of image */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 10px 9px' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.18, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
            {gymClass.name || gymClass.title}
          </div>
          {coachName &&
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 1, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              with {coachName}
            </div>
          }
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '8px 10px 0', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {/* Time range */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 6px', alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#60a5fa' }}>
            {timeRange || timeStr}
          </span>
          {diff && <><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>·</span><span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{diff}</span></>}
        </div>

        {left !== null &&
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${cap ? Math.min(100, Math.round(enr / cap * 100)) : 0}%`, background: full ? '#f87171' : hot ? 'linear-gradient(90deg,#d97706,#fbbf24)' : `linear-gradient(90deg,${cfg.color}88,${cfg.color})`, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: full ? '#f87171' : hot ? '#fbbf24' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {full ? '🔴 Full' : hot ? `🔥 ${left} left` : `${left} spots`}
            </span>
          </div>
        }

        {pct !== null &&
        <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`,
            background: full ? '#f87171' : pct > 65 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : `linear-gradient(90deg,${cfg.color}88,${cfg.color})`,
            animation: 'cl-bar 1s cubic-bezier(0.16,1,0.3,1) both' }} />
          </div>
        }

        {/* Day pills REMOVED */}
      </div>

      {!isOwner &&
      <div style={{ padding: '8px 10px 10px' }}>
          <button
          onClick={(e) => {e.stopPropagation();if (!full || booked) onBook && onBook(gymClass.id);}}
          disabled={full && !booked}
          onMouseDown={(e) => {if (full && !booked) return;e.currentTarget.style.transform = 'translateY(3px)';e.currentTarget.style.boxShadow = 'none';e.currentTarget.style.borderBottom = '1px solid rgba(0,0,0,0.4)';}}
          onMouseUp={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '';e.currentTarget.style.borderBottom = '';}}
          onMouseLeave={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '';e.currentTarget.style.borderBottom = '';}}
          onTouchStart={(e) => {if (full && !booked) return;e.currentTarget.style.transform = 'translateY(3px)';e.currentTarget.style.boxShadow = 'none';e.currentTarget.style.borderBottom = '1px solid rgba(0,0,0,0.4)';}}
          onTouchEnd={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '';e.currentTarget.style.borderBottom = '';}}
          style={{
            width: '100%', padding: '10px', borderRadius: 13,
            fontSize: 12, fontWeight: 900, letterSpacing: '-0.01em',
            cursor: full && !booked ? 'default' : 'pointer', border: 'none',
            position: 'relative', overflow: 'hidden',
            ...(booked ? {
              background: 'rgba(16,185,129,0.18)',
              borderBottom: '3px solid rgba(5,150,105,0.5)',
              boxShadow: '0 2px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
              color: '#34d399',
              outline: '1px solid rgba(52,211,153,0.28)'
            } : full ? {
              background: 'rgba(255,255,255,0.05)',
              borderBottom: '3px solid rgba(0,0,0,0.5)',
              boxShadow: '0 2px 0 rgba(0,0,0,0.35)',
              color: 'rgba(255,255,255,0.22)'
            } : {
              background: 'linear-gradient(to bottom,#3b82f6,#2563eb,#1d4ed8)',
              borderBottom: '3px solid #1a3fa8',
              // Glow removed — no boxShadow on the book button
              boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              color: '#fff'
            }),
            transition: 'transform 0.08s ease,box-shadow 0.08s ease,border-bottom 0.08s ease'
          }}>
            {/* Shimmer on book button REMOVED */}
            <span style={{ position: 'relative', zIndex: 1 }}>
              {booked ? '✓ Booked' : full ? 'Join Waitlist' : left !== null ? `Book · ${left} left` : 'Book Spot'}
            </span>
          </button>
        </div>
      }
      {isOwner && <div style={{ height: 10 }} />}
    </div>);
}

// ─── ClassesTabContent ────────────────────────────────────────────────────────
function ClassesTabContent({ classes, showOwnerControls, onManage, onDelete, currentUser, gymId }) {
  const today = new Date();
  const queryClient = useQueryClient();

  const [activeDay, setActiveDay] = useState(0);
  const [activeSlot, setActiveSlot] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // Derive booked state from live attendee_ids — persisted in the DB
  const isBooked = (gymClass) => (gymClass.attendee_ids || []).includes(currentUser?.id);

  const handleBook = async (classId) => {
    if (!currentUser?.id) return;
    const gymClass = classes.find(c => c.id === classId);
    if (!gymClass) return;
    const currentIds = gymClass.attendee_ids || [];
    const alreadyBooked = currentIds.includes(currentUser.id);
    const newIds = alreadyBooked
      ? currentIds.filter(id => id !== currentUser.id)
      : [...currentIds, currentUser.id];

    // Optimistically update the cache so UI reflects instantly
    const feedGymId = gymClass.gym_id || gymId;
    queryClient.setQueryData(['gymActivityFeed', feedGymId], (old) => {
      if (!old) return old;
      return {
        ...old,
        classes: (old.classes || []).map(c =>
          c.id === classId ? { ...c, attendee_ids: newIds } : c
        ),
      };
    });

    await base44.entities.GymClass.update(classId, { attendee_ids: newIds });
    queryClient.invalidateQueries({ queryKey: ['gymActivityFeed', feedGymId] });
  };

  const activeDate = new Date(today);
  activeDate.setDate(today.getDate() + activeDay);
  const jsDay = activeDate.getDay();
  const activeDayIdx = jsDay === 0 ? 6 : jsDay - 1;
  const activeDayName = DAY_LABELS[activeDayIdx];
  // Full day name for title
  const activeDayFullName = DAY_FULL_NAMES[activeDayName] || activeDayName;
  const isToday = activeDay === 0;

  const withTime = React.useMemo(() =>
  classes.map((c, i) => ({ ...c, _time: getMockTime(c, i), _slot: getTimeSlot(getMockTime(c, i)) })),
  [classes]
  );

  const filtered = React.useMemo(() => {
    let list = withTime.filter((c) => {
      const d = getScheduleDays(c);
      return d.length === 0 || d.includes(activeDayName);
    });
    if (activeSlot) list = list.filter((c) => c._slot === activeSlot);
    return list.sort((a, b) => a._time.localeCompare(b._time));
  }, [withTime, activeDayName, activeSlot]);

  if (classes.length === 0) return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div style={{ borderRadius: 22, padding: '56px 24px', textAlign: 'center',
        background: CARD_BG, border: `1px dashed ${CARD_BORDER}`, backdropFilter: 'blur(20px)' }}>
        <div style={{ fontSize: 36, marginBottom: 14 }}>🏋️</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>No classes scheduled</div>
        {showOwnerControls &&
        <button onClick={onManage} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 12,
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
          color: '#818cf8', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>+ Add Classes</button>
        }
      </div>
    </motion.div>);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
    style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header — full day name, no date subtitle, no session count */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {isToday ? "Today's Classes" : `${activeDayFullName}'s Classes`}
          </div>
        </div>
        {showOwnerControls &&
        <button onClick={onManage}
        onMouseDown={(e) => {e.currentTarget.style.transform = 'translateY(3px)';e.currentTarget.style.boxShadow = 'none';e.currentTarget.style.borderBottom = '1px solid rgba(0,0,0,0.4)';}}
        onMouseUp={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '';e.currentTarget.style.borderBottom = '';}}
        onMouseLeave={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '';e.currentTarget.style.borderBottom = '';}}
        onTouchStart={(e) => {e.currentTarget.style.transform = 'translateY(3px)';e.currentTarget.style.boxShadow = 'none';e.currentTarget.style.borderBottom = '1px solid rgba(0,0,0,0.4)';}}
        onTouchEnd={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '';e.currentTarget.style.borderBottom = '';}}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12,
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
          borderBottom: '3px solid rgba(55,48,163,0.6)',
          boxShadow: '0 2px 0 rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.1)',
          color: '#818cf8', fontSize: 12, fontWeight: 800, cursor: 'pointer', flexShrink: 0, marginTop: 4,
          transition: 'transform 0.08s ease,box-shadow 0.08s ease,border-bottom 0.08s ease' }}>
            <Plus style={{ width: 13, height: 13 }} />Manage
          </button>
        }
      </div>

      <ClassDateHeader
        activeDay={activeDay} setActiveDay={setActiveDay}
        activeSlot={activeSlot} setActiveSlot={setActiveSlot} />

      {/* Session count + tap to book line REMOVED */}

      {filtered.length > 0 ?
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {filtered.map((gymClass, i) =>
        <PremiumClassCard
          key={gymClass.id}
          gymClass={gymClass}
          isOwner={showOwnerControls}
          booked={isBooked(gymClass)}
          onBook={handleBook}
          onClick={() => setSelectedClass(gymClass)}
          onDelete={showOwnerControls ? (id) => {if (window.confirm('Delete?')) onDelete(id);} : null}
          timeStr={gymClass._time}
          index={i} />
        )}
        </div> :
      <div style={{ borderRadius: 18, padding: '36px 20px', textAlign: 'center',
        background: CARD_BG, border: `1px dashed ${CARD_BORDER}`, backdropFilter: 'blur(20px)' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
            No classes {activeSlot ? `this ${activeSlot.toLowerCase()}` : 'this day'}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {activeSlot &&
          <button onClick={() => setActiveSlot(null)}
          style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 10, padding: '7px 16px', cursor: 'pointer' }}>All times</button>
          }
          </div>
        </div>
      }

      <ClassDetailModal
        gymClass={selectedClass}
        open={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        booked={selectedClass ? isBooked(selectedClass) : false}
        onBook={handleBook}
        isOwner={showOwnerControls}
        currentUser={currentUser} />

    </motion.div>);
}


function LeaderboardSection({ view, setView, checkInLeaderboard, streakLeaderboard, progressLeaderboardWeek, progressLeaderboardMonth, progressLeaderboardAllTime }) {
  const [open, setOpen] = React.useState(false);
  const [timeframe, setTimeframe] = React.useState('week');

  const tabs = [
    { id: 'checkins', label: 'Check-ins', icon: CheckCircle, accent: '#10b981', accentRgb: '16,185,129', unit: 'check-ins' },
    { id: 'streaks',  label: 'Streaks',   icon: Flame,       accent: '#f97316', accentRgb: '249,115,22', unit: 'day streak' },
    { id: 'progress', label: 'Progress',  icon: TrendingUp,  accent: '#818cf8', accentRgb: '129,140,248', unit: 'kg gained'  },
  ];

  const current = tabs.find((t) => t.id === view);

  const getData = () => {
    if (view === 'checkins') return { list: checkInLeaderboard,  getVal: (m) => m.count,    fmt: (v) => `${v}`,    unit: 'check-ins'  };
    if (view === 'streaks')  return { list: streakLeaderboard,   getVal: (m) => m.streak,   fmt: (v) => `${v}d`,   unit: 'day streak' };
    const pl = timeframe === 'week' ? progressLeaderboardWeek : timeframe === 'month' ? progressLeaderboardMonth : progressLeaderboardAllTime;
    return { list: pl, getVal: (m) => m.increase, fmt: (v) => `+${v}kg`, unit: 'kg gained' };
  };

  const { list, getVal, fmt, unit } = getData();
  const maxVal   = list.length > 0 ? Math.max(...list.map(getVal), 1) : 1;
  const initials = (n) => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const podium   = list.slice(0, 3);
  const restList = list.slice(3, 10);

  const tfBtn = (active, colorClass) => {
    const configs = {
      week:  { from: '#a78bfa', via: '#8b5cf6', to: '#7c3aed', shadow: '#5b21b6', glow: 'rgba(120,40,220,0.4)' },
      month: { from: '#60a5fa', via: '#3b82f6', to: '#2563eb', shadow: '#1a3fa8', glow: 'rgba(0,0,100,0.5)' },
      all:   { from: '#fbbf24', via: '#f59e0b', to: '#d97706', shadow: '#b45309', glow: 'rgba(180,83,9,0.4)' },
    };
    const cfg = configs[colorClass] || configs.week;
    return {
      padding: '10px 14px', borderRadius: 14, fontSize: 11, fontWeight: 800, cursor: 'pointer',
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      background: active
        ? `linear-gradient(to bottom, ${cfg.from}, ${cfg.via}, ${cfg.to})`
        : 'rgba(15,20,40,0.8)',
      border: active ? '1px solid transparent' : '1px solid rgba(80,100,160,0.5)',
      borderBottom: active ? `5px solid ${cfg.shadow}` : '5px solid rgba(5,8,20,0.8)',
      color: active ? '#fff' : 'rgba(148,163,184,0.7)',
      boxShadow: active
        ? `0 5px 0 rgba(0,0,0,0.4),0 8px 20px ${cfg.glow},inset 0 1px 0 rgba(255,255,255,0.2),inset 0 0 20px rgba(255,255,255,0.05)`
        : '0 5px 0 rgba(5,8,20,0.8),0 8px 20px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.12)',
      transition: 'transform 0.1s ease,box-shadow 0.1s ease,border-bottom 0.1s ease',
      transform: 'translateY(0)',
    };
  };

  const tabBtn = (active, accentRgb, accent) => {
    const colorMap = {
      '16,185,129':  { from: '#34d399', via: '#10b981', to: '#059669', shadow: '#065f46', glow: 'rgba(16,185,129,0.4)' },
      '249,115,22':  { from: '#fb923c', via: '#f97316', to: '#ea580c', shadow: '#9a3412', glow: 'rgba(249,115,22,0.4)' },
      '129,140,248': { from: '#a5b4fc', via: '#818cf8', to: '#6366f1', shadow: '#3730a3', glow: 'rgba(99,102,241,0.4)' },
    };
    const cfg = colorMap[accentRgb] || { from: accent, via: accent, to: accent, shadow: 'rgba(0,0,0,0.5)', glow: `rgba(${accentRgb},0.3)` };
    return {
      flex: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
      padding: '10px 4px', borderRadius: 14, fontSize: 11, fontWeight: 800, cursor: 'pointer',
      background: active
        ? `linear-gradient(to bottom, ${cfg.from}, ${cfg.via}, ${cfg.to})`
        : 'rgba(15,20,40,0.8)',
      border: active ? '1px solid transparent' : '1px solid rgba(80,100,160,0.5)',
      borderBottom: active ? `5px solid ${cfg.shadow}` : '5px solid rgba(5,8,20,0.8)',
      color: active ? '#fff' : 'rgba(148,163,184,0.7)',
      boxShadow: active
        ? `0 5px 0 rgba(0,0,0,0.4),0 8px 20px ${cfg.glow},inset 0 1px 0 rgba(255,255,255,0.2),inset 0 0 20px rgba(255,255,255,0.05)`
        : '0 5px 0 rgba(5,8,20,0.8),0 8px 20px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.12)',
      transition: 'transform 0.1s ease,box-shadow 0.1s ease,border-bottom 0.1s ease',
    };
  };

  const press3d = {
    onMouseDown:  (e) => { e.currentTarget.style.transform = 'translateY(5px)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderBottom = '1px solid rgba(0,0,0,0.4)'; },
    onMouseUp:    (e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderBottom = ''; },
    onMouseLeave: (e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderBottom = ''; },
    onTouchStart: (e) => { e.currentTarget.style.transform = 'translateY(5px)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderBottom = '1px solid rgba(0,0,0,0.4)'; },
    onTouchEnd:   (e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderBottom = ''; },
  };

  const PODIUM_COLORS = [
    { rank: 1, color: '#FFD700', bg: 'rgba(255,215,0,0.08)',  border: 'rgba(255,215,0,0.3)',  ring: 'rgba(255,215,0,0.6)',  label: '👑', shadow: 'rgba(255,215,0,0.2)'  },
    { rank: 2, color: '#C8D8EC', bg: 'rgba(200,216,236,0.06)', border: 'rgba(200,216,236,0.25)', ring: 'rgba(200,216,236,0.5)', label: '🥈', shadow: 'rgba(200,216,236,0.15)' },
    { rank: 3, color: '#E8904A', bg: 'rgba(232,144,74,0.07)', border: 'rgba(232,144,74,0.28)',  ring: 'rgba(232,144,74,0.55)', label: '🥉', shadow: 'rgba(232,144,74,0.15)' },
  ];

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      style={{
        ...CARD_STYLE,
        width: '100%', textAlign: 'left', borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        cursor: 'pointer', overflow: 'hidden',
      }}
    >
      <div style={{ height: 2, background: `linear-gradient(90deg,transparent,rgba(${current.accentRgb},0.7),transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `rgba(${current.accentRgb},0.12)`,
          border: `1px solid rgba(${current.accentRgb},0.25)`,
        }}>
          <Trophy style={{ width: 18, height: 18, color: current.accent }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Community Leaderboard</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, margin: '2px 0 0' }}>
            {list.length > 0 ? `${list.length} athletes ranked` : 'No activity yet'}
          </p>
        </div>
        {podium.length > 0 &&
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 2 }}>
            {podium.map((m, i) => {
              const pc = PODIUM_COLORS[i];
              return (
                <div key={i} style={{
                  width: 30, height: 30, borderRadius: '50%', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900,
                  background: CARD_BG, border: `2px solid ${pc.ring}`,
                  color: pc.color, marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i, flexShrink: 0,
                  boxShadow: `0 0 8px ${pc.shadow}`,
                }}>
                  {m.userAvatar
                    ? <img src={m.userAvatar} alt={m.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials(m.userName)}
                </div>
              );
            })}
          </div>
        }
        <div style={{
          width: 28, height: 28, borderRadius: 9, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }} />
        </div>
      </div>
    </button>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)',
      animation: 'lb-slide-up 0.38s cubic-bezier(0.16,1,0.3,1) both',
      overflow: 'hidden', paddingTop: 'env(safe-area-inset-top)',
    }}>
      <style>{LBOARD_ANIM}</style>

      <div style={{
        flexShrink: 0, padding: '14px 16px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
      }}>
        <button
          onClick={() => setOpen(false)}
          {...press3d}
          style={{
            position: 'absolute', top: 12, left: 14,
            width: 36, height: 36, borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(30,40,80,0.9)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderBottom: '3px solid rgba(0,0,0,0.55)',
            boxShadow: '0 2px 0 rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.1)',
            transition: 'transform 0.08s ease,box-shadow 0.08s ease,border-bottom 0.08s ease',
          }}
        >
          <ChevronLeft style={{ width: 17, height: 17, color: 'rgba(255,255,255,0.7)' }} />
        </button>

        <div style={{ textAlign: 'center', paddingBottom: 12 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.04em' }}>
            Community Leaderboard
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[['week','This Week'],['month','Month'],['all','All Time']].map(([tf, label]) => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={tfBtn(timeframe === tf, tf)} {...press3d}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, paddingBottom: 12 }}>
          {tabs.map(({ id, label, icon: Icon, accent, accentRgb }) => (
            <button key={id} onClick={() => setView(id)}
              style={tabBtn(view === id, accentRgb, accent)} {...press3d}>
              <Icon style={{ width: 14, height: 14 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {list.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...CARD_STYLE, border: '1px solid rgba(255,255,255,0.07)' }}>
              <Trophy style={{ width: 24, height: 24, color: 'rgba(255,255,255,0.12)' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.25)', margin: 0 }}>No Rankings Yet</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.12)', margin: 0 }}>Start tracking to appear here</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, padding: '20px 16px 8px' }}>
              {[
                { data: podium[1], pcIdx: 1, order: 0, heightBoost: 0  },
                { data: podium[0], pcIdx: 0, order: 1, heightBoost: 24 },
                { data: podium[2], pcIdx: 2, order: 2, heightBoost: 0  },
              ].filter(p => p.data).map(({ data, pcIdx, order, heightBoost }) => {
                const pc   = PODIUM_COLORS[pcIdx];
                const isFirst = pcIdx === 0;
                const avatarSz = isFirst ? 52 : 40;
                return (
                  <div key={pcIdx} style={{
                    flex: isFirst ? '0 0 120px' : '0 0 96px',
                    borderRadius: 18, overflow: 'hidden',
                    ...CARD_STYLE,
                    border: `1px solid ${pc.border}`,
                    boxShadow: `0 0 0 1px ${pc.border}, 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`,
                    marginBottom: heightBoost,
                    animation: `lb-card-in 0.45s cubic-bezier(0.34,1.3,0.64,1) ${order * 0.07}s both`,
                  }}>
                    <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${pc.color}, transparent)` }} />
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: isFirst ? 14 : 10, paddingBottom: 2 }}>
                      <span style={{
                        fontSize: 8, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: pc.color, background: `rgba(${pc.color === '#FFD700' ? '255,215,0' : pc.color === '#C8D8EC' ? '200,216,236' : '232,144,74'},0.12)`,
                        border: `1px solid ${pc.border}`, borderRadius: 99, padding: '2px 7px',
                      }}>
                        #{pcIdx + 1}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 4px' }}>
                      <div style={{
                        width: avatarSz + 4, height: avatarSz + 4, borderRadius: '50%',
                        border: `2px solid ${pc.ring}`,
                        boxShadow: `0 0 12px ${pc.shadow}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', background: CARD_BG,
                        fontSize: isFirst ? 16 : 13, fontWeight: 900, color: pc.color,
                      }}>
                        {data.userAvatar
                          ? <img src={data.userAvatar} alt={data.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : initials(data.userName)}
                      </div>
                    </div>
                    <p style={{
                      color: '#fff', fontWeight: 900, textAlign: 'center',
                      fontSize: isFirst ? 11 : 9.5, lineHeight: 1.2,
                      padding: '0 8px 2px', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {data.userName || '—'}
                    </p>
                    <div style={{ textAlign: 'center', padding: `2px 8px ${isFirst ? 14 : 10}px` }}>
                      <p style={{ fontSize: isFirst ? 22 : 16, fontWeight: 900, color: pc.color, lineHeight: 1, letterSpacing: '-0.03em', margin: 0 }}>
                        {fmt(getVal(data))}
                      </p>
                      <p style={{ fontSize: 7, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>
                        {unit}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {restList.length > 0 &&
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 12px 20px' }}>
                {restList.map((m, i) => {
                  const globalRank = i + 4;
                  const opacity = Math.max(0.35, 1 - i * 0.1);
                  return (
                    <div key={m.userId || i} style={{
                      ...CARD_STYLE,
                      borderRadius: 14, padding: '10px 12px',
                      display: 'flex', alignItems: 'center', gap: 10,
                      animation: `lb-row-in 0.26s ease ${(i + 3) * 0.04}s both`,
                    }}>
                      <div style={{
                        width: 28, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 900, color: `rgba(255,255,255,${opacity * 0.6})`,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {globalRank}
                      </div>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 900,
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid rgba(255,255,255,${opacity * 0.1})`,
                        color: `rgba(255,255,255,${opacity * 0.6})`,
                      }}>
                        {m.userAvatar
                          ? <img src={m.userAvatar} alt={m.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : initials(m.userName)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13, fontWeight: 700, color: `rgba(255,255,255,${opacity * 0.92})`,
                          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {m.userName || '—'}
                        </p>
                      </div>
                      <div style={{
                        flexShrink: 0, padding: '4px 10px', borderRadius: 8,
                        background: `rgba(${current.accentRgb},0.1)`,
                        border: `1px solid rgba(${current.accentRgb},0.2)`,
                        fontSize: 13, fontWeight: 800,
                        color: `rgba(255,255,255,${opacity * 0.85})`,
                        letterSpacing: '-0.02em',
                      }}>
                        {fmt(getVal(m))}
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </>
        )}
      </div>
    </div>
  );
}

function SlidePanel({ open, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.38s cubic-bezier(0.34,1.4,0.64,1)' }}>
      <div style={{ overflow: 'hidden' }}>
        <div style={{ opacity: open ? 1 : 0, transform: open ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)', transition: open ? 'opacity 0.28s ease 0.08s, transform 0.38s cubic-bezier(0.34,1.4,0.64,1) 0.04s' : 'opacity 0.15s ease, transform 0.18s ease' }}>
          {children}
        </div>
      </div>
    </div>);
}

function SuggestedFriendsCard({ checkIns, currentUser, memberAvatarMap }) {
  const [sentIds, setSentIds] = React.useState(new Set());
  const queryClient = useQueryClient();

  const { data: myFriends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser.id, status: 'accepted' }, '-created_date', 200),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000
  });

  const addFriendMutation = useMutation({
    mutationFn: (userId) => base44.functions.invoke('manageFriendship', { friendId: userId, action: 'add' }),
    onSuccess: (_, userId) => {
      setSentIds((prev) => new Set(prev).add(userId));
      queryClient.invalidateQueries({ queryKey: ['friends', currentUser?.id] });
    }
  });

  const suggestions = React.useMemo(() => {
    if (!currentUser) return [];
    const knownIds = new Set([currentUser.id, ...myFriends.map((f) => f.friend_id), ...myFriends.map((f) => f.user_id)]);
    const seen = new Set();
    return checkIns.
    filter((c) => c.user_id && c.user_name && !knownIds.has(c.user_id) && !seen.has(c.user_id) && seen.add(c.user_id)).
    slice(0, 5);
  }, [checkIns, currentUser, myFriends]);

  if (suggestions.length === 0) return null;

  const ini = (n = '') => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ ...CARD_STYLE, borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ padding: '13px 14px 11px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>People You May Know</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {suggestions.map((c, i) => {
          const col = colorForUser(c.user_id);
          const avatar = memberAvatarMap[c.user_id];
          const sent = sentIds.has(c.user_id);
          return (
            <div key={c.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.045)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: col.bg, border: '1.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: col.color, flexShrink: 0 }}>
                {avatar ? <img src={avatar} alt={c.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(c.user_name)}
              </div>
              <p style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.user_name}</p>
              {sent ? (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, flexShrink: 0, background: 'linear-gradient(to bottom, #1a1f35, #0f1220)', border: '1px solid rgba(99,102,241,0.3)', color: 'rgba(165,180,252,0.85)', letterSpacing: '0.04em' }}>
                  Pending
                </span>
              ) : (
                <button
                  onClick={() => addFriendMutation.mutate(c.user_id)}
                  disabled={addFriendMutation.isPending}
                  style={{
                    flexShrink: 0, width: '2.1rem', height: '1.75rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 8, border: '1px solid rgba(147,197,253,0.4)', cursor: 'pointer',
                    background: 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 40%, #2563eb 100%)',
                    boxShadow: '0 3px 0 0 #1a3fa8, 0 5px 12px rgba(0,0,100,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                  }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, 0 5px 12px rgba(0,0,100,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, 0 5px 12px rgba(0,0,100,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
                  onTouchStart={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onTouchEnd={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, 0 5px 12px rgba(0,0,100,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
                >
                  <UserPlus style={{ width: 13, height: 13, color: '#fff' }} />
                </button>
              )}
            </div>);
        })}
      </div>
    </div>);
}

function RippleButton({ onClick, children, className, style }) {
  const [ripples, setRipples] = React.useState([]);
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left,y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((r) => r.id !== id)), 600);
    onClick && onClick(e);
  };
  return (
    <button onClick={handleClick} className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      {ripples.map(({ id, x, y }) =>
      <span key={id} style={{ position: 'absolute', left: x, top: y, width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.45)', transform: 'translate(-50%,-50%) scale(0)', animation: 'costride-ripple 0.55s ease-out forwards', pointerEvents: 'none' }} />
      )}
      {children}
      <style>{`@keyframes costride-ripple { to { transform: translate(-50%,-50%) scale(60); opacity: 0; } }`}</style>
    </button>);
}

export default function GymCommunity() {
  const urlParams = new URLSearchParams(window.location.search);
  const gymId = urlParams.get('id');
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = 'gym-community-dialog-anim';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = DIALOG_ANIM;
      document.head.appendChild(tag);
    }
  }, []);

  useEffect(() => {window.scrollTo(0, 0);}, [gymId]);

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
  const [joinPanel, setJoinPanel] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinCodeError, setJoinCodeError] = useState('');
  const [joinCodeSuccess, setJoinCodeSuccess] = useState(false);
  const [primaryConfirmed, setPrimaryConfirmed] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [copiedCoachId, setCopiedCoachId] = useState(null);
  const [showInviteOwner, setShowInviteOwner] = useState(false);
  const [showInviteOwnerModal, setShowInviteOwnerModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 });
  const { data: gym, isLoading: gymLoading } = useQuery({ queryKey: ['gym', gymId], queryFn: () => base44.entities.Gym.filter({ id: gymId }).then((r) => r[0]), enabled: !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: members = [] } = useQuery({ queryKey: ['members', gymId], queryFn: () => base44.entities.GymMember.filter({ gym_id: gymId }, 'user_name', 200), enabled: !!gymId, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: coaches = [] } = useQuery({ queryKey: ['coaches', gymId], queryFn: () => base44.entities.Coach.filter({ gym_id: gymId }, 'name', 20), enabled: !!gymId, staleTime: 10 * 60 * 1000, gcTime: 20 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: gymActivityData = {} } = useQuery({
    queryKey: ['gymActivityFeed', gymId],
    queryFn: () => base44.functions.invoke('getGymActivityFeed', { gymId }).then((r) => r.data),
    enabled: !!gymId,
    staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev
  });
  const checkIns = gymActivityData.checkIns || [];
  const gymWorkoutLogsFromFeed = gymActivityData.workoutLogs || [];
  const gymAchievementsFromFeed = gymActivityData.achievements || [];
  const events = gymActivityData.events || [];
  const classes = gymActivityData.classes || [];
  const rewards = gymActivityData.rewards || [];
  const challenges = gymActivityData.challenges || [];
  const polls = gymActivityData.polls || [];
  const backendMemberAvatars = gymActivityData.memberAvatars || {};
  const backendMemberNames = gymActivityData.memberNames || {};
  const gymChallenges = challenges.filter((c) => c.status === 'active' || c.status === 'upcoming');
  const { data: allGyms = [] } = useQuery({ queryKey: ['gyms'], queryFn: () => base44.entities.Gym.filter({ status: 'approved' }, 'name', 50), enabled: showCreateChallenge, staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 });
  const { data: gymMembership } = useQuery({ queryKey: ['gymMembership', currentUser?.id, gymId], queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, gym_id: gymId, status: 'active' }).then((r) => r[0]), enabled: !!currentUser && !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: claimedBonuses = [] } = useQuery({ queryKey: ['claimedBonuses', currentUser?.id, gymId], queryFn: () => base44.entities.ClaimedBonus.filter({ user_id: currentUser.id, gym_id: gymId }, '-created_date', 100), enabled: !!currentUser && !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: challengeParticipants = [] } = useQuery({ queryKey: ['challengeParticipants', currentUser?.id], queryFn: () => base44.entities.ChallengeParticipant.filter({ user_id: currentUser.id }, '-created_date', 50), enabled: !!currentUser, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });
  const gymWorkoutLogs = gymWorkoutLogsFromFeed;
  const gymAchievements = gymAchievementsFromFeed;
  const { data: gymChallengeParticipants = [] } = useQuery({ queryKey: ['gymChallengeParticipants', gymId], queryFn: async () => {const ids = challenges.map((c) => c.id);if (!ids.length) return [];return base44.entities.ChallengeParticipant.filter({ challenge_id: ids[0] }, '-created_date', 100);}, enabled: !!gymId && activeTab === 'activity' && challenges.length > 0, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });
  const POSTS_PAGE_SIZE = 20;
  const [postsPage, setPostsPage] = React.useState(1);

  const gymPostsRaw = gymActivityData.posts || [];
  const gymPosts = gymPostsRaw.slice(0, postsPage * POSTS_PAGE_SIZE);
  const hasMorePosts = gymPostsRaw.length > postsPage * POSTS_PAGE_SIZE;

  const { data: leaderboards = {} } = useQuery({
    queryKey: ['leaderboards', gymId],
    queryFn: () => base44.functions.invoke('getGymLeaderboards', { gymId }).then((r) => r.data),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const memberAvatarMap = React.useMemo(() => {
    const map = { ...backendMemberAvatars };
    members.forEach((m) => {
      if (!m.user_id) return;
      const avatar = m.avatar_url || m.user_avatar || m.profile_picture || null;
      if (avatar && !map[m.user_id]) map[m.user_id] = avatar;
    });
    if (currentUser?.id) {
      const myAvatar = currentUser.avatar_url || currentUser.profile_picture || currentUser.photo_url || null;
      if (myAvatar) map[currentUser.id] = myAvatar;
    }
    return map;
  }, [backendMemberAvatars, members, currentUser]);

  const memberNameMap = React.useMemo(() => {
    const map = { ...backendMemberNames };
    if (currentUser?.id) {
      map[currentUser.id] = currentUser.display_name || currentUser.full_name || null;
    }
    return map;
  }, [backendMemberNames, currentUser]);

  useEffect(() => {
    if (!gymId || !currentUser?.id) return;
    try {
      const key = `recentlyViewedGyms_${currentUser.id}`;
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [gymId, ...prev.filter((id) => id !== gymId)].slice(0, 3);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}
  }, [gymId, currentUser?.id]);

  const createEventMutation = useMutation({ mutationFn: (eventData) => base44.entities.Event.create({ ...eventData, gym_id: gymId, gym_name: gym?.name, attendees: 0 }), onMutate: async (eventData) => {await queryClient.cancelQueries({ queryKey: ['events', gymId] });const previous = queryClient.getQueryData(['events', gymId]);queryClient.setQueryData(['events', gymId], (old = []) => [{ ...eventData, id: `temp-${Date.now()}`, gym_id: gymId, gym_name: gym?.name, attendees: 0 }, ...old]);return { previous };}, onError: (err, vars, context) => {queryClient.setQueryData(['events', gymId], context.previous);}, onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['events', gymId] });setShowCreateEvent(false);} });
  const rsvpMutation = useMutation({ mutationFn: ({ eventId, currentAttendees }) => base44.entities.Event.update(eventId, { attendees: currentAttendees + 1 }), onMutate: async ({ eventId, currentAttendees }) => {await queryClient.cancelQueries({ queryKey: ['events', gymId] });const previous = queryClient.getQueryData(['events', gymId]);queryClient.setQueryData(['events', gymId], (old = []) => old.map((e) => e.id === eventId ? { ...e, attendees: currentAttendees + 1 } : e));return { previous };}, onError: (err, vars, context) => {queryClient.setQueryData(['events', gymId], context.previous);}, onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['events', gymId] });} });
  const updateEquipmentMutation = useMutation({ mutationFn: (equipment) => base44.entities.Gym.update(gymId, { equipment }), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['gym', gymId] });setShowManageEquipment(false);} });
  const createRewardMutation = useMutation({ mutationFn: (rewardData) => base44.entities.Reward.create(rewardData), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['rewards', gymId] });} });
  const deleteRewardMutation = useMutation({ mutationFn: (rewardId) => base44.entities.Reward.delete(rewardId), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['rewards', gymId] });} });
  const createClassMutation = useMutation({ mutationFn: (classData) => base44.entities.GymClass.create(classData), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['classes', gymId] });} });
  const updateClassMutation = useMutation({ mutationFn: ({ classId, data }) => base44.entities.GymClass.update(classId, data), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['classes', gymId] });} });
  const deleteClassMutation = useMutation({ mutationFn: (classId) => base44.entities.GymClass.delete(classId), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['classes', gymId] });} });
  const createCoachMutation = useMutation({ mutationFn: (coachData) => base44.entities.Coach.create(coachData), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['coaches', gymId] });} });
  const deleteCoachMutation = useMutation({ mutationFn: (coachId) => base44.entities.Coach.delete(coachId), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['coaches', gymId] });} });
  const deleteChallengeMutation = useMutation({ mutationFn: (challengeId) => base44.entities.Challenge.delete(challengeId), onMutate: async (challengeId) => {await queryClient.cancelQueries({ queryKey: ['challenges', gymId] });const previous = queryClient.getQueryData(['challenges', gymId]);queryClient.setQueryData(['challenges', gymId], (old = []) => old.filter((c) => c.id !== challengeId));return { previous };}, onError: (err, vars, context) => {queryClient.setQueryData(['challenges', gymId], context.previous);}, onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['challenges', gymId] });} });
  const deleteEventMutation = useMutation({ mutationFn: (eventId) => base44.entities.Event.delete(eventId), onMutate: async (eventId) => {await queryClient.cancelQueries({ queryKey: ['events', gymId] });const previous = queryClient.getQueryData(['events', gymId]);queryClient.setQueryData(['events', gymId], (old = []) => old.filter((e) => e.id !== eventId));return { previous };}, onError: (err, vars, context) => {queryClient.setQueryData(['events', gymId], context.previous);}, onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['events', gymId] });} });
  const votePollMutation = useMutation({ mutationFn: async ({ pollId, optionId }) => {const poll = polls.find((p) => p.id === pollId);const updatedOptions = poll.options.map((opt) => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt);await base44.entities.Poll.update(pollId, { options: updatedOptions, voters: [...(poll.voters || []), currentUser.id] });}, onMutate: async ({ pollId, optionId }) => {await queryClient.cancelQueries({ queryKey: ['polls', gymId] });const previous = queryClient.getQueryData(['polls', gymId]);queryClient.setQueryData(['polls', gymId], (old = []) => old.map((p) => p.id === pollId ? { ...p, voters: [...(p.voters || []), currentUser.id], options: p.options.map((opt) => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt) } : p));return { previous };}, onError: (err, vars, context) => {queryClient.setQueryData(['polls', gymId], context.previous);}, onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['polls', gymId] });} });
  const updateCoachMutation = useMutation({ mutationFn: ({ coachId, data }) => base44.entities.Coach.update(coachId, data), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['coaches', gymId] });} });
  const createChallengeMutation = useMutation({ mutationFn: (challengeData) => base44.entities.Challenge.create({ ...challengeData, gym_id: gymId, gym_name: gym?.name }), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['challenges', gymId] });setShowCreateChallenge(false);} });
  const updateGalleryMutation = useMutation({ mutationFn: (gallery) => base44.entities.Gym.update(gymId, { gallery }), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['gym', gymId] });setShowManagePhotos(false);} });
  const updateHeroImageMutation = useMutation({ mutationFn: (image_url) => base44.entities.Gym.update(gymId, { image_url }), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['gym', gymId] });setShowEditHeroImage(false);} });
  const updateGymLogoMutation = useMutation({ mutationFn: (logo_url) => base44.entities.Gym.update(gymId, { logo_url }), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['gym', gymId] });setShowEditGymLogo(false);} });
  const banMemberMutation = useMutation({ mutationFn: (userId) => base44.entities.Gym.update(gymId, { banned_members: [...(gym?.banned_members || []), userId] }), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['gym', gymId] });} });
  const unbanMemberMutation = useMutation({ mutationFn: (userId) => base44.entities.Gym.update(gymId, { banned_members: (gym?.banned_members || []).filter((id) => id !== userId) }), onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['gym', gymId] });} });
  const joinGhostGymMutation = useMutation({ mutationFn: async () => {
      const currentMemberships = await base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' });
      if (currentMemberships.length >= 3) throw new Error('You can only be a member of up to 3 gyms. Please leave a gym before joining a new one.');
      await base44.entities.GymMembership.create({ user_id: currentUser.id, user_name: currentUser.full_name, user_email: currentUser.email, gym_id: gym.id, gym_name: gym.name, status: 'active', join_date: new Date().toISOString().split('T')[0], membership_type: 'lifetime' });if (!currentUser.primary_gym_id) {await base44.auth.updateMe({ primary_gym_id: gym.id });}}, onSuccess: () => {
      queryClient.setQueryData(['gymMemberships', currentUser?.id], (old = []) => [
        ...(old || []),
        { gym_id: gym.id, gym_name: gym.name, user_id: currentUser?.id, status: 'active' }
      ]);
      queryClient.invalidateQueries({ queryKey: ['gymMembership', currentUser?.id, gymId] });queryClient.invalidateQueries({ queryKey: ['gymMemberships', currentUser?.id] });queryClient.invalidateQueries({ queryKey: ['currentUser'] });} });
  const joinChallengeMutation = useMutation({ mutationFn: async (challenge) => {await base44.functions.invoke('joinChallenge', { challengeId: challenge.id });}, onMutate: async (challenge) => {await queryClient.cancelQueries({ queryKey: ['challengeParticipants', currentUser?.id] });const previous = queryClient.getQueryData(['challengeParticipants', currentUser?.id]);queryClient.setQueryData(['challengeParticipants', currentUser?.id], (old = []) => [...old, { id: `temp-${challenge.id}`, user_id: currentUser.id, challenge_id: challenge.id, challenge_title: challenge.title, progress: 0, completed: false }]);return { previous };}, onError: (err, challenge, context) => {queryClient.setQueryData(['challengeParticipants', currentUser?.id], context.previous);}, onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['challengeParticipants', currentUser?.id] });queryClient.invalidateQueries({ queryKey: ['challenges', gymId] });queryClient.invalidateQueries({ queryKey: ['challenges'] });queryClient.invalidateQueries({ queryKey: ['activeChallenges'] });base44.entities.Notification.create({ user_id: currentUser.id, type: 'challenge', title: '💪 Challenge Joined!', message: 'Good luck on your new challenge!', icon: '🎯' });} });

  const isGymOwner = currentUser && gym && currentUser.email === gym.owner_email && currentUser.account_type === 'gym_owner';
  const isGhostGym = gym && !gym.admin_id && !gym.owner_email;
  const currentCoach = currentUser && coaches.find((c) => c.user_email === currentUser.email);
  const isCoach = !!currentCoach;
  const showOwnerControls = isGymOwner && !viewAsMember;
  const isMember = !!gymMembership || isGymOwner;

  const enrichWithAvatars = (list) => list.map((m) => ({ ...m, userAvatar: memberAvatarMap[m.userId] || null }));
  const checkInLeaderboardWeek = enrichWithAvatars(leaderboards.checkInLeaderboardWeek || []);
  const checkInLeaderboardMonth = enrichWithAvatars(leaderboards.checkInLeaderboardMonth || []);
  const checkInLeaderboardAllTime = enrichWithAvatars(leaderboards.checkInLeaderboardAllTime || []);
  const streakLeaderboardWeek = enrichWithAvatars(leaderboards.streakLeaderboardWeek || []);
  const streakLeaderboardMonth = enrichWithAvatars(leaderboards.streakLeaderboardMonth || []);
  const streakLeaderboardAllTime = enrichWithAvatars(leaderboards.streakLeaderboardAllTime || []);
  const progressLeaderboardWeek = enrichWithAvatars(leaderboards.progressLeaderboardWeek || []);
  const progressLeaderboardMonth = enrichWithAvatars(leaderboards.progressLeaderboardMonth || []);
  const progressLeaderboardAllTime = enrichWithAvatars(leaderboards.progressLeaderboardAllTime || []);

  if (gymLoading && !gym) return null;

  if (!gymLoading && !gym) return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex items-center justify-center p-4">
      <div className="p-8 text-center rounded-2xl" style={CARD_STYLE}><p className="text-slate-400 mb-4">Gym not found</p><Link to={createPageUrl('Gyms')} className="text-blue-400 font-bold">Back to Gyms</Link></div>
    </div>);

  const tabTriggerClass = "whitespace-nowrap ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-slate-900/80 backdrop-blur-md text-slate-400 font-bold rounded-full px-2.5 py-1 flex items-center gap-1 justify-center border border-slate-600/40 shadow-[0_3px_0_0_#0d1220,inset_0_1px_0_rgba(255,255,255,0.08)] data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:via-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-[11.5px] transform-gpu";

  return (
    <PullToRefresh onRefresh={async () => {await queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey.some((k) => k === gymId) });}}>
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-x-hidden">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 z-0">
              {gym?.image_url ?
              <img src={gym.image_url} alt={gym?.name} className="w-full h-full object-cover" style={{ opacity: 0.55 }} loading="eager" fetchPriority="high" /> :
              <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }} />
              }
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,4,10,0.3) 0%, rgba(2,4,10,0.0) 40%, rgba(2,4,10,0.75) 100%)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(2,4,10,0.5) 0%, transparent 60%)' }} />
            </div>
            <div className="relative z-10 px-4 pt-3 pb-0" style={{ minHeight: '110px' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className={`font-black text-white drop-shadow-lg ${(gym?.name?.length || 0) > 28 ? 'text-base' : (gym?.name?.length || 0) > 18 ? 'text-lg' : 'text-xl'}`}>{gym?.name || ''}</h1>
                    {gym?.verified && <BadgeCheck className="w-4 h-4 text-blue-400 flex-shrink-0 drop-shadow" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-white/60 text-[11px] flex items-center gap-1"><MapPin className="w-3 h-3" />{gym?.city}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {gym && isGhostGym && isMember && !isGymOwner &&
                  <button onClick={() => setShowInviteOwnerModal(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-white bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 shadow-[0_2px_0_0_#5b21b6,0_4px_14px_rgba(120,40,220,0.35)] active:shadow-none active:translate-y-[2px] active:scale-95 transition-all duration-100" style={{ fontSize: '10.2px' }}>
                      <Crown className="w-3 h-3" />Make Official
                    </button>
                  }
                  {!isMember && !isGymOwner &&
                  <button onClick={() => joinGhostGymMutation.mutate()} disabled={joinGhostGymMutation.isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 shadow-[0_3px_0_0_#5b21b6,0_6px_20px_rgba(120,40,220,0.4)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                      {joinGhostGymMutation.isPending ? 'Joining...' : 'Join Gym'}
                    </button>
                  }
                  {showOwnerControls &&
                  <button onClick={() => setShowEditHeroImage(true)} className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-white/90 active:scale-95 transition-transform">
                      <Edit className="w-3 h-3 inline mr-1" />Edit Hero
                    </button>
                  }
                  {isGymOwner &&
                  <button onClick={() => setViewAsMember(!viewAsMember)} className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-white/90 active:scale-95 transition-transform">
                      {viewAsMember ? '👤 Member' : '👑 Owner'}
                    </button>
                  }
                  {isCoach && !isGymOwner &&
                  <div className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'rgba(59,130,246,0.7)' }}>🎓 Coach</div>
                  }
                </div>
              </div>
            </div>
            <div className="relative z-10 pt-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
               <TabsList className="flex bg-transparent py-2 h-auto gap-1.5" style={{ minWidth: '100%', paddingLeft: '12px', paddingRight: '12px' }}>
                 <div className="flex gap-1.5">
                <TabsTrigger value="home" className={tabTriggerClass}><Home className="w-3.5 h-3.5" /><span>Home</span></TabsTrigger>
                <TabsTrigger value="activity" className={tabTriggerClass}><Activity className="w-3.5 h-3.5" /><span>Activity</span></TabsTrigger>
                <TabsTrigger value="challenges" className={tabTriggerClass}><Trophy className="w-3.5 h-3.5" /><span>Challenges</span></TabsTrigger>
                <TabsTrigger value="classes" className={tabTriggerClass}><Dumbbell className="w-3.5 h-3.5" /><span>Classes</span></TabsTrigger>
                </div>
                </TabsList>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-3 md:px-4 pt-3 pb-28 space-y-3 w-full overflow-hidden">

            {/* ── HOME ── */}
            <TabsContent value="home" className="space-y-3 mt-0 w-full" asChild>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
                <BusyTimesChart checkIns={checkIns} gymId={gymId} />
                <UpcomingEvents gymMemberships={[{ gym_id: gymId, gym_name: gym?.name }]} currentUser={currentUser} isMember={isMember} />
                <InlineLeaderboard view={leaderboardView} setView={setLeaderboardView} checkInLeaderboardWeek={checkInLeaderboardWeek} checkInLeaderboardMonth={checkInLeaderboardMonth} checkInLeaderboardAllTime={checkInLeaderboardAllTime} streakLeaderboardWeek={streakLeaderboardWeek} streakLeaderboardMonth={streakLeaderboardMonth} streakLeaderboardAllTime={streakLeaderboardAllTime} progressLeaderboardWeek={progressLeaderboardWeek} progressLeaderboardMonth={progressLeaderboardMonth} progressLeaderboardAllTime={progressLeaderboardAllTime} />
                {coaches.length > 0 &&
                <div style={{ ...CARD_STYLE, borderRadius: 18, overflow: 'hidden' }}>
                    <div style={{ padding: '13px 14px 11px', borderBottom: '1px solid rgba(255,255,255,0.055)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>Featured Coaches</span>
                      </div>
                      {showOwnerControls &&
                    <button onClick={() => setShowManageCoaches(true)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 7, padding: '3px 9px', fontSize: 10, fontWeight: 700, color: '#60a5fa', cursor: 'pointer' }}>Edit</button>
                    }
                    </div>
                    <div style={{ display: 'flex', gap: 10, padding: '12px 14px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                      {coaches.map((coach) => {
                      const ci = (n = '') => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
                      return (
                        <div key={coach.id} onClick={() => setSelectedCoach(coach)} style={{ flexShrink: 0, width: 110, borderRadius: 16, background: CARD_BG, border: CARD_BORDER, backdropFilter: 'blur(20px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 10px 14px', gap: 6, position: 'relative', cursor: 'pointer' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.09) 50%,transparent 90%)' }} />
                            <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', flexShrink: 0, border: '3px solid #fbbf24', boxShadow: '0 0 12px rgba(59,130,246,0.3), 0 0 0 2px rgba(251,191,36,0.6)' }}>
                              {coach.avatar_url ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ci(coach.name)}
                            </div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{coach.name}</div>
                            {coach.specialties?.length > 0 &&
                          <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.55)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{coach.specialties.slice(0, 2).join(' · ')}</div>
                          }
                            {coach.rating &&
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Star style={{ width: 10, height: 10, fill: '#fbbf24', color: '#fbbf24' }} />
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{coach.rating}</span>
                              </div>
                          }
                          </div>);
                    })}
                    </div>
                  </div>
                }
              </motion.div>
            </TabsContent>

            {/* ── CHALLENGES ── */}
            <TabsContent value="challenges" className="space-y-3 mt-0 w-full" asChild>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
                {isGhostGym &&
                <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(219,39,119,0.12))', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <p className="text-sm font-bold text-white mb-0.5">This isn't an official community yet!</p>
                    <p className="text-xs text-slate-400 leading-relaxed">Get your gym involved to unlock full challenges, leaderboards & more. Use the "Make Official" button above to get started.</p>
                  </div>
                }
                {!isGhostGym && showOwnerControls &&
                <button onClick={() => setShowCreateChallenge(true)} className="w-full rounded-2xl py-4 flex flex-col items-center gap-2 text-white font-bold active:scale-[0.98] transition-transform" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.15))', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <Plus className="w-5 h-5" /><span className="text-sm">Create Gym Challenge</span>
                  </button>
                }
                {!isGhostGym && (() => {
                  if (gymChallenges.length === 0) {
                    return <div className="rounded-2xl p-10 text-center" style={CARD_STYLE}><Trophy className="w-10 h-10 mx-auto mb-3 text-slate-700" /><p className="text-white font-bold mb-1 text-sm">No Active Challenges</p><p className="text-xs text-slate-500">Check back soon for new challenges!</p></div>;
                  }

                  const activeChallenges = gymChallenges.filter((c) => challengeParticipants.some((p) => p.challenge_id === c.id));
                  const availableChallenges = gymChallenges.filter((c) => !challengeParticipants.some((p) => p.challenge_id === c.id));

                  const renderCard = (challenge) =>
                  <GymChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    isJoined={challengeParticipants.some((p) => p.challenge_id === challenge.id)}
                    onJoin={!showOwnerControls ? (c) => joinChallengeMutation.mutate(c) : null}
                    currentUser={currentUser}
                    disabled={showOwnerControls}
                    isOwner={showOwnerControls}
                    onDelete={showOwnerControls ? (id) => {if (window.confirm('Delete this challenge?')) deleteChallengeMutation.mutate(id);} : null}
                    gymImageUrl={gym?.image_url}
                    memberAvatarMap={memberAvatarMap}
                    memberNameMap={memberNameMap} />;

                  return (
                    <>
                      {activeChallenges.length > 0 &&
                      <div className="space-y-3">
                          <div className="flex items-center gap-2 px-1">
                            <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <CheckCircle style={{ width: 13, height: 13, color: '#34d399' }} />
                            </div>
                            <span className="text-xs font-black text-white uppercase tracking-widest">Active</span>
                          </div>
                          {activeChallenges.map(renderCard)}
                        </div>
                      }
                      {availableChallenges.length > 0 &&
                      <div className="space-y-3">
                          <div className="flex items-center gap-2 px-1">
                            <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Trophy style={{ width: 13, height: 13, color: '#fbbf24' }} />
                            </div>
                            <span className="text-xs font-black text-white uppercase tracking-widest">Available</span>
                          </div>
                          {availableChallenges.map(renderCard)}
                        </div>
                      }
                    </>);
                })()}
              </motion.div>
            </TabsContent>

            {/* ── CLASSES ── */}
            <TabsContent value="classes" className="space-y-3 mt-0 w-full">
              {isGhostGym &&
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(219,39,119,0.12))', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <p className="text-sm font-bold text-white mb-0.5">This isn't an official community yet!</p>
                  <p className="text-xs text-slate-400 leading-relaxed">Get your gym involved to unlock classes, coaches & more features. Use the "Make Official" button above to get started.</p>
                </div>
              }
              {!isGhostGym && <ClassesTabContent
                classes={classes}
                showOwnerControls={showOwnerControls}
                onManage={() => setShowManageClasses(true)}
                onDelete={(id) => deleteClassMutation.mutate(id)}
                currentUser={currentUser}
                gymId={gymId} />
              }
            </TabsContent>

            {/* ── ACTIVITY ── */}
            <TabsContent value="activity" className="space-y-3 mt-0 w-full" asChild>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
                <ActiveNowStrip checkIns={checkIns} memberAvatarMap={memberAvatarMap} />
                <GymActivityFeed
                  checkIns={checkIns}
                  memberAvatarMap={memberAvatarMap}
                  memberNameMap={memberNameMap}
                  workoutLogs={gymWorkoutLogs}
                  challengeParticipants={gymChallengeParticipants}
                  challenges={challenges}
                  achievements={gymAchievements}
                  posts={gymPosts} />
                {hasMorePosts &&
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <Button
                    variant="outline"
                    onClick={() => setPostsPage((p) => p + 1)}
                    style={{ borderRadius: 24, padding: '8px 28px', color: '#a0aec0', borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
                      Load more posts
                    </Button>
                  </div>
                }
                <SuggestedFriendsCard checkIns={checkIns} currentUser={currentUser} memberAvatarMap={memberAvatarMap} />

                {(() => {
                  const livePolls = polls.filter(p => {
                    if (!p.end_date) return true;
                    return new Date(p.end_date).getTime() + 24 * 60 * 60 * 1000 - 1 >= Date.now();
                  });
                  if (livePolls.length === 0) return null;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BarChart2 style={{ width: 13, height: 13, color: '#60a5fa' }} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>Live Polls</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{livePolls.length} active</span>
                      </div>
                      {livePolls.map(poll => (
                        <PollCard
                          key={poll.id}
                          poll={poll}
                          onVote={!showOwnerControls && !poll.voters?.includes(currentUser?.id) ? (optionId) => votePollMutation.mutate({ pollId: poll.id, optionId }) : null}
                          userVoted={poll.voters?.includes(currentUser?.id)}
                          isLoading={votePollMutation.isPending}
                          currentUser={currentUser}
                        />
                      ))}
                    </div>
                  );
                })()}
              </motion.div>
            </TabsContent>

          </div>
        </Tabs>

        <CreateEventModal open={showCreateEvent} onClose={() => setShowCreateEvent(false)} onSave={(data) => createEventMutation.mutate(data)} gym={gym} isLoading={createEventMutation.isPending} />
        <ManageEquipmentModal open={showManageEquipment} onClose={() => setShowManageEquipment(false)} equipment={gym?.equipment || []} onSave={(equipment) => updateEquipmentMutation.mutate(equipment)} isLoading={updateEquipmentMutation.isPending} />
        <ManageRewardsModal open={showManageRewards} onClose={() => setShowManageRewards(false)} rewards={rewards} onCreateReward={(data) => createRewardMutation.mutate(data)} onDeleteReward={(id) => deleteRewardMutation.mutate(id)} gym={gym} isLoading={createRewardMutation.isPending} />
        <ManageClassesModal open={showManageClasses} onClose={() => setShowManageClasses(false)} classes={classes} onCreateClass={(data) => createClassMutation.mutate(data)} onUpdateClass={(classId, data) => updateClassMutation.mutate({ classId, data })} onDeleteClass={(id) => deleteClassMutation.mutate(id)} gym={gym} isLoading={createClassMutation.isPending || updateClassMutation.isPending} />
        <ManageCoachesModal open={showManageCoaches} onClose={() => setShowManageCoaches(false)} coaches={coaches} onCreateCoach={(data) => createCoachMutation.mutate(data)} onDeleteCoach={(id) => deleteCoachMutation.mutate(id)} onUpdateCoach={(coachId, data) => updateCoachMutation.mutate({ coachId, data })} gym={gym} isLoading={createCoachMutation.isPending} />
        <ManageGymPhotosModal open={showManagePhotos} onClose={() => setShowManagePhotos(false)} gallery={gym?.gallery || []} onSave={(gallery) => updateGalleryMutation.mutate(gallery)} isLoading={updateGalleryMutation.isPending} />
        <EditHeroImageModal open={showEditHeroImage} onClose={() => setShowEditHeroImage(false)} currentImageUrl={gym?.image_url} onSave={(image_url) => updateHeroImageMutation.mutate(image_url)} isLoading={updateHeroImageMutation.isPending} />
        <EditGymLogoModal open={showEditGymLogo} onClose={() => setShowEditGymLogo(false)} currentLogoUrl={gym?.logo_url} onSave={(logo_url) => updateGymLogoMutation.mutate(logo_url)} isLoading={updateGymLogoMutation.isPending} />
        <ManageMembersModal open={showManageMembers} onClose={() => setShowManageMembers(false)} gym={gym} onBanMember={(userId) => banMemberMutation.mutate(userId)} onUnbanMember={(userId) => unbanMemberMutation.mutate(userId)} />
        <UpgradeMembershipModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentUser={currentUser} />
        <CreateChallengeModal open={showCreateChallenge} onClose={() => setShowCreateChallenge(false)} gyms={allGyms} onSave={(data) => createChallengeMutation.mutate(data)} isLoading={createChallengeMutation.isPending} />
        <InviteOwnerModal isOpen={showInviteOwnerModal} onClose={() => setShowInviteOwnerModal(false)} gym={gym} currentUser={currentUser} />
        <CoachProfileModal coach={selectedCoach} open={!!selectedCoach} onClose={() => setSelectedCoach(null)} gymClasses={classes} />
      </div>
    </PullToRefresh>);
}