import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Trophy, TrendingUp, MessageCircle, Heart, BadgeCheck, Gift, ChevronLeft, ChevronRight, Calendar, Plus, Edit, GraduationCap, Clock, Target, Award, Image as ImageIcon, Crown, Dumbbell, Flame, CheckCircle, Trash2, Home, Mail, Copy, Zap, Activity, Timer, ChevronDown } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';

const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.90) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
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
  from { opacity:0; transform:translateY(100%); }
  to   { opacity:1; transform:translateY(0); }
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
  { rank:1,color:'#FFD700',colorRgb:'255,215,0',cardBorder:'rgba(255,215,0,0.55)',cardBorderDim:'rgba(255,215,0,0.15)',glow:'rgba(255,215,0,0.3)',glowStrong:'rgba(255,215,0,0.6)',bg:'linear-gradient(160deg,rgba(60,42,0,0.95) 0%,rgba(28,18,0,0.98) 100%)',avatarRing:'conic-gradient(#FFD700,#FFA500,#FFD700,#FFF0A0,#FFD700)',badgeBg:'linear-gradient(145deg,#FFE566,#CC8800)',badgeText:'rgba(80,40,0,0.9)',pulse:'lb-gold-pulse',shine:'rgba(255,225,80,0.22)',insetGlow:'rgba(255,215,0,0.14)',label:'👑',tierLabel:'CHAMPION',tierColor:'#FFD700',heightExtra:20 },
  { rank:2,color:'#C8D8EC',colorRgb:'200,216,236',cardBorder:'rgba(180,205,230,0.48)',cardBorderDim:'rgba(180,205,230,0.12)',glow:'rgba(180,205,230,0.2)',glowStrong:'rgba(180,205,230,0.45)',bg:'linear-gradient(160deg,rgba(16,28,52,0.95) 0%,rgba(6,12,28,0.98) 100%)',avatarRing:'conic-gradient(#C8D8EC,#8AACCF,#C8D8EC,#E8F0FA,#C8D8EC)',badgeBg:'linear-gradient(145deg,#D4E4F4,#6A96BC)',badgeText:'rgba(10,30,60,0.85)',pulse:'lb-silver-pulse',shine:'rgba(200,220,240,0.14)',insetGlow:'rgba(180,205,230,0.09)',label:'🥈',tierLabel:'ELITE',tierColor:'#C8D8EC',heightExtra:6 },
  { rank:3,color:'#E8904A',colorRgb:'232,144,74',cardBorder:'rgba(215,128,58,0.5)',cardBorderDim:'rgba(215,128,58,0.14)',glow:'rgba(215,128,58,0.22)',glowStrong:'rgba(215,128,58,0.45)',bg:'linear-gradient(160deg,rgba(48,22,6,0.95) 0%,rgba(20,8,2,0.98) 100%)',avatarRing:'conic-gradient(#E8904A,#A05820,#E8904A,#F4C090,#E8904A)',badgeBg:'linear-gradient(145deg,#E8904A,#8C4818)',badgeText:'rgba(50,15,0,0.85)',pulse:'lb-bronze-pulse',shine:'rgba(218,140,72,0.15)',insetGlow:'rgba(215,128,58,0.1)',label:'🥉',tierLabel:'PRO',tierColor:'#E8904A',heightExtra:0 },
];

const NAV_ROW = [
  { rankOpacity:1,nameOpacity:0.92,barOpacity:0.55,pillOpacity:0.9 },
  { rankOpacity:0.88,nameOpacity:0.82,barOpacity:0.48,pillOpacity:0.8 },
  { rankOpacity:0.76,nameOpacity:0.72,barOpacity:0.40,pillOpacity:0.7 },
  { rankOpacity:0.65,nameOpacity:0.62,barOpacity:0.34,pillOpacity:0.6 },
  { rankOpacity:0.55,nameOpacity:0.52,barOpacity:0.28,pillOpacity:0.52 },
  { rankOpacity:0.46,nameOpacity:0.44,barOpacity:0.22,pillOpacity:0.44 },
  { rankOpacity:0.38,nameOpacity:0.36,barOpacity:0.18,pillOpacity:0.38 },
];

// ── Class helpers ─────────────────────────────────────────────────────────────
const CLASS_TYPE_CONFIG = {
  hiit:     { label:'HIIT',     emoji:'⚡', color:'#f87171', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.25)'   },
  yoga:     { label:'Yoga',     emoji:'🧘', color:'#34d399', bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.25)'  },
  strength: { label:'Strength', emoji:'🏋️', color:'#818cf8', bg:'rgba(99,102,241,0.12)',  border:'rgba(99,102,241,0.25)'  },
  cardio:   { label:'Cardio',   emoji:'🏃', color:'#fb7185', bg:'rgba(244,63,94,0.12)',   border:'rgba(244,63,94,0.25)'   },
  spin:     { label:'Spin',     emoji:'🚴', color:'#38bdf8', bg:'rgba(14,165,233,0.12)',  border:'rgba(14,165,233,0.25)'  },
  boxing:   { label:'Boxing',   emoji:'🥊', color:'#fb923c', bg:'rgba(234,88,12,0.12)',   border:'rgba(234,88,12,0.25)'   },
  pilates:  { label:'Pilates',  emoji:'🌸', color:'#c084fc', bg:'rgba(168,85,247,0.12)',  border:'rgba(168,85,247,0.25)'  },
  default:  { label:'Class',    emoji:'🎯', color:'#38bdf8', bg:'rgba(14,165,233,0.10)',  border:'rgba(14,165,233,0.2)'   },
};
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

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
  const s = (c.schedule || '').toLowerCase();
  return DAYS_SHORT.filter(d => s.includes(d.toLowerCase()));
}

// ── Single class card ─────────────────────────────────────────────────────────
function ClassCard({ gymClass, isOwner, onDelete, onBook, booked }) {
  const cfg = CLASS_TYPE_CONFIG[getClassType(gymClass)];
  const scheduleDays = getScheduleDays(gymClass);
  const capacity = gymClass.capacity || gymClass.max_participants || null;
  const enrolled  = gymClass.enrolled || gymClass.participants_count || 0;
  const spotsLeft = capacity ? capacity - enrolled : null;
  const isFull    = spotsLeft !== null && spotsLeft <= 0;
  const fillPct   = capacity ? Math.min(100, Math.round((enrolled / capacity) * 100)) : null;
  const isPopular = fillPct !== null && fillPct >= 65;

  return (
    <div style={{
      borderRadius: 20,
      background: booked
        ? `linear-gradient(135deg, rgba(12,18,34,0.98), rgba(8,12,24,0.99))`
        : 'linear-gradient(135deg, rgba(14,18,36,0.97), rgba(8,12,24,0.99))',
      border: `1px solid ${booked ? cfg.border : 'rgba(255,255,255,0.08)'}`,
      overflow: 'hidden',
      boxShadow: booked
        ? `0 0 0 1px ${cfg.border}, 0 12px 40px rgba(0,0,0,0.5)`
        : '0 4px 20px rgba(0,0,0,0.35)',
    }}>
      {/* Coloured top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }} />

      <div style={{ padding: '16px 16px 0' }}>
        {/* Row 1: icon + name + delete */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 15, flexShrink: 0,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>{cfg.emoji}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 5, padding: '2px 7px' }}>{cfg.label}</span>
              {isPopular && !isFull && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fb923c', background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 5, padding: '2px 7px' }}>🔥 Popular</span>}
              {booked && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 5, padding: '2px 7px' }}>✓ Booked</span>}
              {isFull && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 5, padding: '2px 7px' }}>Full</span>}
            </div>

            {/* Title */}
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              {gymClass.name || gymClass.title}
            </div>
            {(gymClass.instructor || gymClass.coach_name) && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3, fontWeight: 600 }}>
                {gymClass.instructor || gymClass.coach_name}
              </div>
            )}
          </div>

          {isOwner && (
            <button onClick={() => onDelete && onDelete(gymClass.id)} style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', flexShrink: 0, cursor: 'pointer' }}>
              <Trash2 style={{ width: 13, height: 13, color: '#f87171' }} />
            </button>
          )}
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginTop: 14 }}>
          {gymClass.schedule && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock style={{ width: 12, height: 12, color: cfg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{gymClass.schedule}</span>
            </div>
          )}
          {gymClass.duration_minutes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Timer style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{gymClass.duration_minutes} min</span>
            </div>
          )}
          {gymClass.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gymClass.location}</span>
            </div>
          )}
          {capacity !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users style={{ width: 12, height: 12, color: isFull ? '#f87171' : spotsLeft <= 3 ? '#fbbf24' : 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: isFull ? '#f87171' : spotsLeft <= 3 ? '#fbbf24' : 'rgba(255,255,255,0.55)' }}>
                {isFull ? 'Class full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
              </span>
            </div>
          )}
        </div>

        {/* Spots bar */}
        {fillPct !== null && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{enrolled} / {capacity} spots filled</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: isFull ? '#f87171' : fillPct >= 65 ? '#fbbf24' : cfg.color }}>{fillPct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${fillPct}%`, borderRadius: 99, background: isFull ? '#ef4444' : fillPct >= 65 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : `linear-gradient(90deg,${cfg.color}aa,${cfg.color})`, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}

        {/* Day pills */}
        {scheduleDays.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
            {DAYS_SHORT.map(d => {
              const on = scheduleDays.includes(d);
              return <div key={d} style={{ flex: 1, textAlign: 'center', padding: '5px 0', borderRadius: 8, fontSize: 9, fontWeight: 900, background: on ? cfg.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? cfg.border : 'rgba(255,255,255,0.06)'}`, color: on ? cfg.color : 'rgba(255,255,255,0.18)' }}>{d}</div>;
            })}
          </div>
        )}

        {/* Description */}
        {gymClass.description && (
          <p style={{ margin: '12px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {gymClass.description}
          </p>
        )}
      </div>

      {/* Book button */}
      {!isOwner && (
        <div style={{ padding: '14px 16px 16px' }}>
          <button
            onClick={() => !isFull && onBook && onBook(gymClass.id)}
            disabled={isFull}
            style={{
              width: '100%', padding: '13px', borderRadius: 14,
              fontSize: 14, fontWeight: 800, cursor: isFull ? 'default' : 'pointer',
              border: 'none', letterSpacing: '-0.01em',
              background: booked
                ? 'rgba(16,185,129,0.12)'
                : isFull
                  ? 'rgba(255,255,255,0.04)'
                  : `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}14)`,
              color: booked ? '#34d399' : isFull ? 'rgba(255,255,255,0.2)' : cfg.color,
              outline: `1px solid ${booked ? 'rgba(16,185,129,0.3)' : isFull ? 'rgba(255,255,255,0.06)' : cfg.border}`,
              transition: 'all 0.18s',
            }}>
            {booked ? '✓ Booked — tap to cancel' : isFull ? 'Class Full' : 'Book Spot'}
          </button>
        </div>
      )}
      {isOwner && <div style={{ height: 16 }} />}
    </div>
  );
}

// ── Today's quick-book strip ──────────────────────────────────────────────────
function TodayStrip({ classes, bookedIds, onBook }) {
  const todayName = DAYS_SHORT[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const todayClasses = classes.filter(c => {
    const days = getScheduleDays(c);
    return days.length === 0 || days.includes(todayName);
  }).slice(0, 6);

  if (todayClasses.length === 0) return null;

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
        Today's Classes
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
        {todayClasses.map(c => {
          const cfg = CLASS_TYPE_CONFIG[getClassType(c)];
          const booked = bookedIds.has(c.id);
          const capacity = c.capacity || c.max_participants || null;
          const enrolled  = c.enrolled || c.participants_count || 0;
          const spotsLeft = capacity ? capacity - enrolled : null;
          const isFull    = spotsLeft !== null && spotsLeft <= 0;
          return (
            <div key={c.id} style={{
              flexShrink: 0, width: 150,
              borderRadius: 16,
              background: booked ? cfg.bg : 'rgba(14,18,36,0.97)',
              border: `1px solid ${booked ? cfg.border : 'rgba(255,255,255,0.09)'}`,
              padding: '12px 12px 10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{cfg.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 2 }}>{c.name || c.title}</div>
              {(c.instructor || c.coach_name) && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>{c.instructor || c.coach_name}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                {c.schedule && <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color }}>{c.schedule}</span>}
                {c.location && <><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>•</span><span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.location}</span></>}
              </div>
              {spotsLeft !== null && !isFull && spotsLeft <= 5 && (
                <div style={{ fontSize: 9, fontWeight: 800, color: spotsLeft <= 2 ? '#f87171' : '#fbbf24', marginBottom: 6 }}>
                  {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left
                </div>
              )}
              <button
                onClick={() => !isFull && onBook(c.id)}
                disabled={isFull}
                style={{
                  width: '100%', padding: '7px', borderRadius: 9, fontSize: 11, fontWeight: 800, cursor: isFull ? 'default' : 'pointer', border: 'none',
                  background: booked ? 'rgba(16,185,129,0.2)' : isFull ? 'rgba(255,255,255,0.04)' : cfg.bg,
                  color: booked ? '#34d399' : isFull ? 'rgba(255,255,255,0.2)' : cfg.color,
                  outline: `1px solid ${booked ? 'rgba(16,185,129,0.3)' : isFull ? 'rgba(255,255,255,0.06)' : cfg.border}`,
                }}>
                {booked ? '✓ Booked' : isFull ? 'Full' : 'Book Spot'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Classes tab ───────────────────────────────────────────────────────────────
function ClassesTabContent({ classes, showOwnerControls, onManage, onDelete }) {
  const [activeType, setActiveType] = useState('all');
  const [activeDay,  setActiveDay]  = useState('all');
  const [bookedIds,  setBookedIds]  = useState(new Set());

  const allTypes = React.useMemo(() => {
    const seen = new Set();
    classes.forEach(c => seen.add(getClassType(c)));
    return [...seen];
  }, [classes]);

  const filtered = React.useMemo(() => classes.filter(c => {
    if (activeType !== 'all' && getClassType(c) !== activeType) return false;
    if (activeDay !== 'all') {
      const days = getScheduleDays(c);
      if (days.length > 0 && !days.includes(activeDay)) return false;
    }
    return true;
  }), [classes, activeType, activeDay]);

  const handleBook = id => setBookedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }} style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* ── Page header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.04em', lineHeight:1 }}>Classes</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', fontWeight:600, marginTop:4 }}>Find and book upcoming gym classes</div>
        </div>
        {showOwnerControls && (
          <button onClick={onManage} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:12, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#818cf8', fontSize:13, fontWeight:800, cursor:'pointer' }}>
            <Plus style={{ width:14, height:14 }} /> Manage
          </button>
        )}
      </div>

      {classes.length === 0 ? (
        /* ── Empty state ── */
        <div style={{ borderRadius:22, padding:'56px 24px', textAlign:'center', background:'rgba(12,16,32,0.8)', border:'1px dashed rgba(255,255,255,0.08)' }}>
          <div style={{ width:64, height:64, borderRadius:20, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28 }}>🏋️</div>
          <div style={{ fontSize:16, fontWeight:900, color:'rgba(255,255,255,0.4)', marginBottom:8 }}>No classes scheduled</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.22)', lineHeight:1.5 }}>Check another day or ask your<br/>gym to add classes.</div>
          {showOwnerControls && (
            <button onClick={onManage} style={{ marginTop:20, padding:'10px 24px', borderRadius:12, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#818cf8', fontSize:13, fontWeight:800, cursor:'pointer' }}>
              + Add Classes
            </button>
          )}
        </div>
      ) : (<>

        {/* ── Today strip ── */}
        <TodayStrip classes={classes} bookedIds={bookedIds} onBook={handleBook} />

        {/* ── Divider ── */}
        <div style={{ height:1, background:'rgba(255,255,255,0.06)', borderRadius:99 }} />

        {/* ── Type filter ── */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none', paddingBottom:2 }}>
          {[{ id:'all', label:'All Classes', emoji:'🗂️', color:'rgba(255,255,255,0.75)', bg:'rgba(255,255,255,0.1)', border:'rgba(255,255,255,0.18)' },
            ...allTypes.map(t => ({ id:t, ...CLASS_TYPE_CONFIG[t] }))
          ].map(f => {
            const active = activeType === f.id;
            return (
              <button key={f.id} onClick={() => setActiveType(f.id)} style={{
                flexShrink:0, display:'flex', alignItems:'center', gap:6,
                padding:'8px 15px', borderRadius:99, fontSize:13, fontWeight:800, cursor:'pointer',
                background:active ? f.bg : 'rgba(255,255,255,0.04)',
                border:`1px solid ${active ? f.border : 'rgba(255,255,255,0.07)'}`,
                color:active ? f.color : 'rgba(255,255,255,0.35)',
                transition:'all 0.15s',
                boxShadow: active ? `0 2px 12px ${f.bg}` : 'none',
              }}>
                <span style={{ fontSize:14 }}>{f.emoji}</span>
                {f.label}
                {active && f.id !== 'all' && (
                  <span style={{ background:'rgba(0,0,0,0.25)', borderRadius:99, padding:'1px 6px', fontSize:10, fontWeight:900 }}>
                    {classes.filter(c => getClassType(c) === f.id).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Day selector ── */}
        <div style={{ borderRadius:16, background:'rgba(12,16,32,0.8)', border:'1px solid rgba(255,255,255,0.07)', padding:'4px', display:'flex', gap:2 }}>
          {['All', ...DAYS_SHORT].map(d => {
            const val = d === 'All' ? 'all' : d;
            const active = activeDay === val;
            return (
              <button key={d} onClick={() => setActiveDay(active && val !== 'all' ? 'all' : val)} style={{
                flex:1, padding:'9px 0', borderRadius:12, fontSize:11, fontWeight:900,
                cursor:'pointer', border:'none',
                background:active ? 'rgba(255,255,255,0.12)' : 'transparent',
                color:active ? '#fff' : 'rgba(255,255,255,0.3)',
                transition:'all 0.15s',
                textAlign:'center',
                boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
              }}>{d}</button>
            );
          })}
        </div>

        {/* ── Results count ── */}
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.06em' }}>
          {filtered.length} class{filtered.length !== 1 ? 'es' : ''} {activeDay !== 'all' ? `on ${activeDay}` : 'available'}
        </div>

        {/* ── Class cards ── */}
        {filtered.length === 0 ? (
          <div style={{ borderRadius:18, padding:'36px 20px', textAlign:'center', background:'rgba(12,16,32,0.7)', border:'1px dashed rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>📭</div>
            <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,0.3)', marginBottom:6 }}>No classes scheduled for {activeDay === 'all' ? 'this filter' : activeDay}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.18)', lineHeight:1.5 }}>Check another day or ask your gym to add classes.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(gymClass => (
              <ClassCard
                key={gymClass.id}
                gymClass={gymClass}
                isOwner={showOwnerControls}
                booked={bookedIds.has(gymClass.id)}
                onBook={handleBook}
                onDelete={showOwnerControls ? id => { if(window.confirm('Delete this class?')) onDelete(id); } : null}
              />
            ))}
          </div>
        )}
      </>)}
    </motion.div>
  );
}

function LeaderboardSection({ view, setView, checkInLeaderboard, streakLeaderboard, progressLeaderboardWeek, progressLeaderboardMonth, progressLeaderboardAllTime }) {
  const [open, setOpen] = React.useState(false);
  const [timeframe, setTimeframe] = React.useState('week');
  const tabs = [
    { id:'checkins', label:'Check-ins', icon:CheckCircle, accent:'#10b981', accentRgb:'16,185,129', unit:'check-ins' },
    { id:'streaks',  label:'Streaks',   icon:Flame,       accent:'#f97316', accentRgb:'249,115,22',  unit:'day streak' },
    { id:'progress', label:'Progress',  icon:TrendingUp,  accent:'#818cf8', accentRgb:'129,140,248', unit:'kg gained' },
  ];
  const current = tabs.find(t => t.id === view);
  const getData = () => {
    if (view==='checkins') return { list:checkInLeaderboard, getVal:m=>m.count, fmt:v=>`${v}`, unit:'check-ins' };
    if (view==='streaks')  return { list:streakLeaderboard, getVal:m=>m.streak, fmt:v=>`${v}d`, unit:'day streak' };
    const progressList = timeframe==='week' ? progressLeaderboardWeek : timeframe==='month' ? progressLeaderboardMonth : progressLeaderboardAllTime;
    return { list:progressList, getVal:m=>m.increase, fmt:v=>`+${v}kg`, unit:'kg gained' };
  };
  const { list, getVal, fmt, unit } = getData();
  const maxVal = list.length > 0 ? Math.max(...list.map(getVal), 1) : 1;
  const initials = n => (n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const podium = list.slice(0,3);
  const restList = list.slice(3,10);

  if (!open) return (
    <>
      <style>{LBOARD_ANIM}</style>
      <button onClick={() => setOpen(true)} className="w-full text-left relative overflow-hidden rounded-2xl active:scale-[0.982] transition-all duration-150"
        style={{ background:'linear-gradient(135deg,rgba(14,22,48,0.92) 0%,rgba(6,10,26,0.97) 100%)', border:'1px solid rgba(255,215,0,0.18)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', boxShadow:'0 8px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(255,215,0,0.06),inset 0 1px 0 rgba(255,255,255,0.06)' }}>
        <div style={{ position:'absolute',top:0,left:0,right:0,bottom:0,overflow:'hidden',pointerEvents:'none',borderRadius:'inherit' }}>
          <div style={{ position:'absolute',top:0,bottom:0,width:'30%',background:'linear-gradient(90deg,transparent,rgba(255,215,0,0.04),transparent)',animation:'lb-shimmer 3.5s ease-in-out infinite' }}/>
        </div>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent 0%,rgba(255,215,0,0.6) 30%,rgba(255,215,0,0.9) 50%,rgba(255,215,0,0.6) 70%,transparent 100%)',borderRadius:'inherit' }}/>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div style={{ width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:'linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,180,0,0.08))',border:'1px solid rgba(255,215,0,0.25)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.1)' }}>
            <Trophy style={{ width:20,height:20,color:'#FFD700',filter:'drop-shadow(0 0 6px rgba(255,215,0,0.5))' }}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p style={{ fontSize:15,fontWeight:900,color:'#fff',letterSpacing:'-0.02em',lineHeight:1 }}>Community Leaderboard</p>
              {list.length>0 && <span style={{ fontSize:9,fontWeight:900,letterSpacing:'0.1em',color:'rgba(255,215,0,0.7)',background:'rgba(255,215,0,0.1)',border:'1px solid rgba(255,215,0,0.2)',padding:'2px 6px',borderRadius:4,textTransform:'uppercase' }}>LIVE</span>}
            </div>
            <p style={{ fontSize:11,marginTop:3,fontWeight:600,color:'rgba(255,255,255,0.35)' }}>
              {list.length>0 ? `${list.length} athletes ranked this week` : 'No activity this week'}
            </p>
          </div>
          {podium.length>0 && (
            <div style={{ display:'flex',alignItems:'center',marginRight:4 }}>
              {podium.map((m,i) => (
                <div key={i} style={{ width:32,height:32,borderRadius:'50%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,background:MEDALS[i].bg,border:`2px solid ${MEDALS[i].color}`,color:MEDALS[i].color,marginLeft:i===0?0:-10,zIndex:3-i,boxShadow:`0 0 12px ${MEDALS[i].glow},0 2px 8px rgba(0,0,0,0.4)`,flexShrink:0 }}>
                  {m.userAvatar ? <img src={m.userAvatar} alt={m.userName} style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='flex';}} /> : null}
                  <span style={{ display:m.userAvatar?'none':'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900 }}>{initials(m.userName)}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ width:30,height:30,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',flexShrink:0 }}>
            <ChevronRight style={{ width:15,height:15,color:'rgba(255,255,255,0.4)' }}/>
          </div>
        </div>
      </button>
    </>
  );

  return (
    <>
      <style>{LBOARD_ANIM}</style>
      <div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:9999,display:'flex',flexDirection:'column',background:'linear-gradient(135deg,#02040a 0%,#0d2360 50%,#02040a 100%)',animation:'lb-slide-up 0.42s cubic-bezier(0.16,1,0.3,1) both',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'radial-gradient(rgba(255,255,255,0.015) 1px,transparent 1px)',backgroundSize:'24px 24px',opacity:0.8 }}/>
        <div style={{ position:'absolute',top:'8%',left:'15%',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,215,0,0.07) 0%,transparent 70%)',pointerEvents:'none',animation:'lb-orb-drift 12s ease-in-out infinite' }}/>
        <div style={{ position:'absolute',top:'40%',right:'5%',width:200,height:200,borderRadius:'50%',background:`radial-gradient(circle,rgba(${current.accentRgb},0.06) 0%,transparent 70%)`,pointerEvents:'none',animation:'lb-orb-drift 9s ease-in-out infinite 3s' }}/>
        <div style={{ position:'absolute',left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,rgba(${current.accentRgb},0.15),transparent)`,pointerEvents:'none',animation:'lb-scan-line 8s linear infinite',zIndex:1 }}/>
        <div style={{ flexShrink:0,paddingTop:18,paddingLeft:16,paddingRight:16,paddingBottom:12,borderBottom:'1px solid rgba(255,255,255,0.05)',position:'relative',zIndex:2 }}>
          <button onClick={() => setOpen(false)}
            onMouseDown={e=>{const b=e.currentTarget;b.style.transform='translateY(3px)';b.style.boxShadow='none';b.style.borderBottom='1px solid rgba(0,0,0,0.4)';}}
            onMouseUp={e=>{const b=e.currentTarget;b.style.transform='';b.style.boxShadow='';b.style.borderBottom='';}}
            onMouseLeave={e=>{const b=e.currentTarget;b.style.transform='';b.style.boxShadow='';b.style.borderBottom='';}}
            onTouchStart={e=>{const b=e.currentTarget;b.style.transform='translateY(3px)';b.style.boxShadow='none';b.style.borderBottom='1px solid rgba(0,0,0,0.4)';}}
            onTouchEnd={e=>{const b=e.currentTarget;b.style.transform='';b.style.boxShadow='';b.style.borderBottom='';}}
            style={{ position:'absolute',top:14,left:16,width:36,height:36,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(30,40,80,0.9)',border:'1px solid rgba(255,255,255,0.15)',borderBottom:'3px solid rgba(0,0,0,0.55)',boxShadow:'0 2px 0 rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.12)',transition:'transform 0.08s ease,box-shadow 0.08s ease,border-bottom 0.08s ease' }}>
            <ChevronRight style={{ width:17,height:17,color:'rgba(255,255,255,0.7)',transform:'rotate(180deg)' }}/>
          </button>
          <div style={{ textAlign:'center',marginBottom:10 }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:3 }}>
              <Trophy style={{ width:14,height:14,color:'#FFD700',filter:'drop-shadow(0 0 8px rgba(255,215,0,0.7))' }}/>
              <span style={{ fontSize:10,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.28em',color:'rgba(255,215,0,0.65)' }}>Community Rankings</span>
            </div>
            <h2 style={{ fontSize:26,fontWeight:900,color:'#fff',margin:0,letterSpacing:'-0.04em',lineHeight:1 }}>Leaderboard</h2>
          </div>
          <div style={{ display:'flex',justifyContent:'center',gap:6,marginBottom:10 }}>
            {[['week','This Week'],['month','Month'],['all','All Time']].map(([tf,label]) => {
              const active = timeframe===tf;
              return (
                <button key={tf} onClick={() => setTimeframe(tf)}
                  onMouseDown={e=>{const b=e.currentTarget;b.style.transform='translateY(3px)';b.style.boxShadow='none';b.style.borderBottom=`1px solid rgba(0,0,0,0.4)`;}}
                  onMouseUp={e=>{const b=e.currentTarget;b.style.transform='';b.style.boxShadow='';b.style.borderBottom='';}}
                  onMouseLeave={e=>{const b=e.currentTarget;b.style.transform='';b.style.boxShadow='';b.style.borderBottom='';}}
                  onTouchStart={e=>{const b=e.currentTarget;b.style.transform='translateY(3px)';b.style.boxShadow='none';b.style.borderBottom=`1px solid rgba(0,0,0,0.4)`;}}
                  onTouchEnd={e=>{const b=e.currentTarget;b.style.transform='';b.style.boxShadow='';b.style.borderBottom='';}}
                  style={{ padding:'5px 14px',borderRadius:99,fontSize:11,fontWeight:800,background:active?`rgba(${current.accentRgb},0.18)`:'rgba(20,28,60,0.8)',border:`1px solid ${active?`rgba(${current.accentRgb},0.5)`:'rgba(255,255,255,0.1)'}`,borderBottom:active?`3px solid rgba(${current.accentRgb},0.6)`:'3px solid rgba(0,0,0,0.5)',color:active?current.accent:'rgba(255,255,255,0.35)',boxShadow:active?`0 2px 0 rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.15),0 0 12px rgba(${current.accentRgb},0.2)`:'0 2px 0 rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.08)',transition:'transform 0.08s ease,box-shadow 0.08s ease,border-bottom 0.08s ease' }}>{label}</button>
              );
            })}
          </div>
          <div style={{ display:'flex',gap:6,padding:4 }}>
            {tabs.map(({id,label,icon:Icon,accent,accentRgb}) => {
              const active = view===id;
              return (
                <button key={id} onClick={() => setView(id)}
                  onMouseDown={e=>{const b=e.currentTarget;b.style.transform='translateY(3px)';b.style.boxShadow='none';b.style.borderBottom='1px solid rgba(0,0,0,0.4)';}}
                  onMouseUp={e=>{const b=e.currentTarget;b.style.transform='';b.style.boxShadow='';b.style.borderBottom='';}}
                  onMouseLeave={e=>{const b=e.currentTarget;b.style.transform='';b.style.boxShadow='';b.style.borderBottom='';}}
                  onTouchStart={e=>{const b=e.currentTarget;b.style.transform='translateY(3px)';b.style.boxShadow='none';b.style.borderBottom='1px solid rgba(0,0,0,0.4)';}}
                  onTouchEnd={e=>{const b=e.currentTarget;b.style.transform='';b.style.boxShadow='';b.style.borderBottom='';}}
                  style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'8px 4px',borderRadius:12,fontSize:11,fontWeight:800,background:active?`rgba(${accentRgb},0.2)`:'rgba(20,28,60,0.75)',border:`1px solid ${active?`rgba(${accentRgb},0.5)`:'rgba(255,255,255,0.09)'}`,borderBottom:active?`3px solid rgba(${accentRgb},0.55)`:'3px solid rgba(0,0,0,0.5)',color:active?accent:'rgba(255,255,255,0.3)',boxShadow:active?`0 2px 0 rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.18),0 0 14px rgba(${accentRgb},0.18)`:'0 2px 0 rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.06)',transition:'transform 0.08s ease,box-shadow 0.08s ease,border-bottom 0.08s ease' }}>
                  <Icon style={{ width:12,height:12 }}/>{label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',position:'relative',zIndex:2 }}>
          {list.length===0 ? (
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:280,gap:16 }}>
              <div style={{ width:60,height:60,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)' }}>
                <Trophy style={{ width:26,height:26,color:'rgba(255,255,255,0.1)' }}/>
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:15,fontWeight:800,color:'rgba(255,255,255,0.25)',margin:'0 0 4px' }}>No Rankings Yet</p>
                <p style={{ fontSize:12,color:'rgba(255,255,255,0.12)',margin:0 }}>Start tracking to appear here</p>
              </div>
            </div>
          ) : (<>
            <div style={{ padding:'8px 16px 10px',display:'flex',alignItems:'flex-end',justifyContent:'center',gap:6,perspective:800 }}>
              {[{data:podium[1],mIdx:1},{data:podium[0],mIdx:0},{data:podium[2],mIdx:2}]
                .filter(p => p.data)
                .map(({data,mIdx},colIdx) => {
                  const M = MEDALS[mIdx];
                  const isFirst = mIdx===0;
                  const cardW = isFirst ? 116 : 94;
                  const avatarSz = isFirst ? 50 : 38;
                  return (
                    <div key={mIdx} style={{ width:cardW,borderRadius:18,overflow:'hidden',position:'relative',background:M.bg,border:`1.5px solid ${M.cardBorder}`,backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',boxShadow:`0 16px 48px rgba(0,0,0,0.7),0 0 0 1px ${M.cardBorderDim},inset 0 1px 0 ${M.shine}`,animation:`lb-card-in 0.5s cubic-bezier(0.34,1.3,0.64,1) ${colIdx*0.08}s both`,marginBottom:M.heightExtra,transformOrigin:'bottom center' }}>
                      <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent 0%,${M.color} 40%,${M.glowStrong} 50%,${M.color} 60%,transparent 100%)`,zIndex:3 }}/>
                      <div style={{ position:'absolute',inset:0,pointerEvents:'none',background:`radial-gradient(ellipse at 50% 0%,${M.insetGlow} 0%,transparent 55%)` }}/>
                      <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none' }}>
                        <div style={{ position:'absolute',top:0,bottom:0,width:'25%',background:`linear-gradient(90deg,transparent,${M.shine},transparent)`,animation:'lb-shimmer 4s ease-in-out infinite',animationDelay:`${mIdx*0.8}s` }}/>
                      </div>
                      <div style={{ position:'absolute',top:0,left:0,width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',background:M.badgeBg,borderRadius:'0 0 9px 0',zIndex:4,boxShadow:'inset 0 1px 0 rgba(255,255,255,0.3)' }}>
                        <span style={{ fontSize:10,fontWeight:900,color:M.badgeText }}>{mIdx+1}</span>
                      </div>
                      {isFirst && (<div style={{ position:'absolute',top:5,right:7,fontSize:14,animation:'lb-flame 1.6s ease-in-out infinite',pointerEvents:'none',zIndex:4,filter:'drop-shadow(0 0 6px rgba(255,150,0,0.7))' }}>🔥</div>)}
                      <div style={{ display:'flex',justifyContent:'center',paddingTop:isFirst?16:13,paddingBottom:3,position:'relative',zIndex:2 }}>
                        <span style={{ fontSize:6,fontWeight:900,letterSpacing:'0.2em',color:M.tierColor,opacity:0.7,textTransform:'uppercase',background:`rgba(${M.colorRgb},0.1)`,border:`1px solid rgba(${M.colorRgb},0.2)`,padding:'1px 6px',borderRadius:99 }}>{M.tierLabel}</span>
                      </div>
                      <div style={{ display:'flex',justifyContent:'center',paddingBottom:4,position:'relative',zIndex:2 }}>
                        <div style={{ position:'relative' }}>
                          <div style={{ width:avatarSz+6,height:avatarSz+6,borderRadius:'50%',background:M.avatarRing,animation:`${M.pulse} 2.5s ease-in-out infinite`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                            <div style={{ width:avatarSz,height:avatarSz,borderRadius:'50%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:M.color,background:M.bg,border:'2px solid rgba(0,0,0,0.3)' }}>
                              {data.userAvatar ? <img src={data.userAvatar} alt={data.userName} style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='flex';}} /> : null}
                              <span style={{ display:data.userAvatar?'none':'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:isFirst?17:12,color:M.color }}>{initials(data.userName)}</span>
                            </div>
                          </div>
                          <div style={{ position:'absolute',bottom:-2,right:-2,width:17,height:17,borderRadius:'50%',background:'rgba(6,10,24,0.9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,boxShadow:`0 0 0 2px ${M.color}`,animation:'lb-badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both',zIndex:5 }}>{M.label}</div>
                        </div>
                      </div>
                      <p style={{ color:'#fff',fontWeight:900,textAlign:'center',fontSize:isFirst?11:9,lineHeight:1.2,padding:'0 6px 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textShadow:`0 0 16px ${M.glow}`,position:'relative',zIndex:2 }}>{data.userName||'—'}</p>
                      <div style={{ textAlign:'center',padding:`2px 8px ${isFirst?13:9}px`,position:'relative',zIndex:2 }}>
                        <p style={{ fontSize:isFirst?20:15,fontWeight:900,color:M.color,lineHeight:1,textShadow:`0 0 24px ${M.glowStrong}`,letterSpacing:'-0.03em',animation:'lb-count-up 0.5s ease 0.2s both' }}>{fmt(getVal(data))}</p>
                        <p style={{ fontSize:6,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.16em',color:`rgba(${M.colorRgb},0.45)`,marginTop:1 }}>{unit}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
            {restList.length > 0 && (
              <div style={{ display:'flex',flexDirection:'column',gap:4,padding:'4px 12px 20px' }}>
                {restList.map((m,i) => {
                  const globalRank = i+4;
                  const pct = Math.max(4, Math.round((getVal(m)/maxVal)*100));
                  const R = NAV_ROW[i] || NAV_ROW[NAV_ROW.length-1];
                  return (
                    <div key={m.userId||i} style={{ borderRadius:14,padding:'10px 12px',display:'flex',alignItems:'center',gap:10,animation:`lb-row-in 0.28s ease ${(i+3)*0.04}s both`,position:'relative',overflow:'hidden',background:'linear-gradient(135deg,rgba(15,24,58,0.82) 0%,rgba(8,14,36,0.92) 100%)',border:'1px solid rgba(255,255,255,0.06)',borderTop:'1px solid rgba(255,255,255,0.09)',boxShadow:'0 2px 12px rgba(0,0,0,0.35)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)' }}>
                      <div style={{ position:'absolute',left:0,top:'18%',bottom:'18%',width:2,borderRadius:99,background:`rgba(${current.accentRgb},${R.rankOpacity*0.35})`,pointerEvents:'none' }}/>
                      <div style={{ width:28,height:28,borderRadius:9,flexShrink:0,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,color:`rgba(255,255,255,${R.rankOpacity*0.7})`,letterSpacing:'-0.02em' }}>{globalRank}</div>
                      <div style={{ width:36,height:36,borderRadius:'50%',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,background:'rgba(255,255,255,0.06)',border:`1px solid rgba(255,255,255,${R.rankOpacity*0.12})` }}>
                        {m.userAvatar ? <img src={m.userAvatar} alt={m.userName} style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='flex';}} /> : null}
                        <span style={{ display:m.userAvatar?'none':'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,color:`rgba(255,255,255,${R.rankOpacity*0.6})` }}>{initials(m.userName)}</span>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <p style={{ fontSize:13,fontWeight:700,color:`rgba(255,255,255,${R.nameOpacity})`,margin:'0 0 5px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:'-0.01em' }}>{m.userName||'—'}</p>
                        <div style={{ height:2,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                          <div style={{ height:'100%',borderRadius:99,width:`${pct}%`,background:`rgba(${current.accentRgb},${R.barOpacity})`,transition:'width 0.6s ease' }}/>
                        </div>
                      </div>
                      <div style={{ flexShrink:0,padding:'4px 10px',borderRadius:8,background:'rgba(255,255,255,0.05)',border:`1px solid rgba(255,255,255,${R.pillOpacity*0.1})`,fontSize:13,fontWeight:800,color:`rgba(255,255,255,${R.pillOpacity*0.9})`,letterSpacing:'-0.02em' }}>{fmt(getVal(m))}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <p style={{ textAlign:'center',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.18em',color:'rgba(255,255,255,0.08)',paddingBottom:10 }}>Ranked by {unit} · Updates in real-time</p>
          </>)}
        </div>
      </div>
    </>
  );
}

function SlidePanel({ open, children }) {
  return (
    <div style={{ display:'grid', gridTemplateRows:open?'1fr':'0fr', transition:'grid-template-rows 0.38s cubic-bezier(0.34,1.4,0.64,1)' }}>
      <div style={{ overflow:'hidden' }}>
        <div style={{ opacity:open?1:0, transform:open?'translateY(0) scale(1)':'translateY(-12px) scale(0.97)', transition:open?'opacity 0.28s ease 0.08s, transform 0.38s cubic-bezier(0.34,1.4,0.64,1) 0.04s':'opacity 0.15s ease, transform 0.18s ease' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function RippleButton({ onClick, children, className, style }) {
  const [ripples, setRipples] = React.useState([]);
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(r => r.id !== id)), 600);
    onClick && onClick(e);
  };
  return (
    <button onClick={handleClick} className={className} style={{ ...style, position:'relative', overflow:'hidden' }}>
      {ripples.map(({ id, x, y }) => (
        <span key={id} style={{ position:'absolute',left:x,top:y,width:4,height:4,borderRadius:'50%',background:'rgba(255,255,255,0.45)',transform:'translate(-50%,-50%) scale(0)',animation:'costride-ripple 0.55s ease-out forwards',pointerEvents:'none' }} />
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

  useEffect(() => {
    const id = 'gym-community-dialog-anim';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = DIALOG_ANIM;
      document.head.appendChild(tag);
    }
  }, []);
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

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5*60*1000, gcTime: 10*60*1000 });
  const { data: gym, isLoading: gymLoading } = useQuery({ queryKey: ['gym', gymId], queryFn: () => base44.entities.Gym.filter({ id: gymId }).then(r => r[0]), enabled: !!gymId, staleTime: 5*60*1000, gcTime: 15*60*1000, placeholderData: prev => prev });
  const { data: members = [] } = useQuery({ queryKey: ['members', gymId], queryFn: () => base44.entities.GymMember.filter({ gym_id: gymId }, 'user_name', 200), enabled: !!gymId, staleTime: 2*60*1000, gcTime: 10*60*1000, placeholderData: prev => prev });
  const { data: coaches = [] } = useQuery({ queryKey: ['coaches', gymId], queryFn: () => base44.entities.Coach.filter({ gym_id: gymId }), enabled: !!gymId, staleTime: 10*60*1000, gcTime: 20*60*1000, placeholderData: prev => prev });
  const { data: checkIns = [] } = useQuery({ queryKey: ['checkIns', gymId], queryFn: () => base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 200), enabled: !!gymId, staleTime: 2*60*1000, gcTime: 10*60*1000, placeholderData: prev => prev });
  const { data: lifts = [] } = useQuery({ queryKey: ['lifts', gymId], queryFn: () => base44.entities.Lift.filter({ gym_id: gymId }, '-lift_date', 100), enabled: !!gymId, staleTime: 5*60*1000, gcTime: 15*60*1000, placeholderData: prev => prev });
  const { data: events = [] } = useQuery({ queryKey: ['events', gymId], queryFn: () => base44.entities.Event.filter({ gym_id: gymId }, '-event_date'), enabled: !!gymId, staleTime: 5*60*1000, gcTime: 15*60*1000, placeholderData: prev => prev });
  const { data: classes = [] } = useQuery({ queryKey: ['classes', gymId], queryFn: () => base44.entities.GymClass.filter({ gym_id: gymId }), enabled: !!gymId, staleTime: 10*60*1000, gcTime: 20*60*1000, placeholderData: prev => prev });
  const { data: rewards = [] } = useQuery({ queryKey: ['rewards', gymId], queryFn: () => base44.entities.Reward.filter({ gym_id: gymId }), enabled: !!gymId, staleTime: 5*60*1000, gcTime: 15*60*1000, placeholderData: prev => prev });
  const { data: challenges = [] } = useQuery({ queryKey: ['challenges', gymId], queryFn: () => base44.entities.Challenge.filter({ gym_id: gymId, is_app_challenge: false }), enabled: !!gymId, staleTime: 5*60*1000, gcTime: 15*60*1000, placeholderData: prev => prev });
  const { data: polls = [] } = useQuery({ queryKey: ['polls', gymId], queryFn: () => base44.entities.Poll.filter({ gym_id: gymId, status: 'active' }, '-created_date'), enabled: !!gymId, staleTime: 2*60*1000, gcTime: 10*60*1000, placeholderData: prev => prev });
  const gymChallenges = challenges.filter(c => c.status === 'active' || c.status === 'upcoming');
  const { data: allGyms = [] } = useQuery({ queryKey: ['gyms'], queryFn: () => base44.entities.Gym.filter({ status: 'approved' }, 'name', 50), enabled: showCreateChallenge, staleTime: 10*60*1000, gcTime: 30*60*1000 });
  const { data: gymMembership } = useQuery({ queryKey: ['gymMembership', currentUser?.id, gymId], queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, gym_id: gymId, status: 'active' }).then(r => r[0]), enabled: !!currentUser && !!gymId, staleTime: 5*60*1000, gcTime: 15*60*1000, placeholderData: prev => prev });
  const { data: claimedBonuses = [] } = useQuery({ queryKey: ['claimedBonuses', currentUser?.id, gymId], queryFn: () => base44.entities.ClaimedBonus.filter({ user_id: currentUser.id, gym_id: gymId }), enabled: !!currentUser && !!gymId, staleTime: 5*60*1000, gcTime: 15*60*1000, placeholderData: prev => prev });
  const { data: challengeParticipants = [] } = useQuery({ queryKey: ['challengeParticipants', currentUser?.id], queryFn: () => base44.entities.ChallengeParticipant.filter({ user_id: currentUser.id }), enabled: !!currentUser, staleTime: 2*60*1000, gcTime: 10*60*1000, placeholderData: prev => prev });

  const leaderboardUserIds = React.useMemo(() => {
    const seen = new Set();
    checkIns.forEach(c => { if (c.user_id) seen.add(c.user_id); });
    return [...seen].slice(0, 50);
  }, [checkIns]);

  const { data: leaderboardUsers = [] } = useQuery({
    queryKey: ['leaderboardUsers', gymId, leaderboardUserIds.length],
    queryFn: async () => {
      if (leaderboardUserIds.length === 0) return [];
      const results = await Promise.allSettled(leaderboardUserIds.map(uid => base44.entities.User.filter({ id: uid }).then(r => (r && r[0]) ? r[0] : null)));
      return results.filter(r => r.status === 'fulfilled' && r.value != null).map(r => r.value);
    },
    enabled: leaderboardUserIds.length > 0,
    staleTime: 10*60*1000,
    gcTime: 20*60*1000,
  });

  const memberAvatarMap = React.useMemo(() => {
    const map = {};
    members.forEach(m => { if (!m.user_id) return; const avatar = m.avatar_url || m.user_avatar || m.profile_picture || null; if (avatar) map[m.user_id] = avatar; });
    leaderboardUsers.forEach(u => { if (!u?.id) return; const avatar = u.avatar_url || u.profile_picture || u.photo_url || null; if (avatar) map[u.id] = avatar; });
    if (currentUser?.id) { const myAvatar = currentUser.avatar_url || currentUser.profile_picture || currentUser.photo_url || null; if (myAvatar) map[currentUser.id] = myAvatar; }
    return map;
  }, [members, leaderboardUsers, currentUser]);

  const createEventMutation = useMutation({ mutationFn: eventData => base44.entities.Event.create({ ...eventData, gym_id: gymId, gym_name: gym?.name, attendees: 0 }), onMutate: async eventData => { await queryClient.cancelQueries({ queryKey: ['events', gymId] }); const previous = queryClient.getQueryData(['events', gymId]); queryClient.setQueryData(['events', gymId], (old=[]) => [{ ...eventData, id:`temp-${Date.now()}`, gym_id:gymId, gym_name:gym?.name, attendees:0 }, ...old]); return { previous }; }, onError: (err, vars, context) => { queryClient.setQueryData(['events', gymId], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events', gymId] }); setShowCreateEvent(false); } });
  const rsvpMutation = useMutation({ mutationFn: ({ eventId, currentAttendees }) => base44.entities.Event.update(eventId, { attendees: currentAttendees + 1 }), onMutate: async ({ eventId, currentAttendees }) => { await queryClient.cancelQueries({ queryKey: ['events', gymId] }); const previous = queryClient.getQueryData(['events', gymId]); queryClient.setQueryData(['events', gymId], (old=[]) => old.map(e => e.id === eventId ? { ...e, attendees: currentAttendees + 1 } : e)); return { previous }; }, onError: (err, vars, context) => { queryClient.setQueryData(['events', gymId], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events', gymId] }); } });
  const updateEquipmentMutation = useMutation({ mutationFn: equipment => base44.entities.Gym.update(gymId, { equipment }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); setShowManageEquipment(false); } });
  const createRewardMutation = useMutation({ mutationFn: rewardData => base44.entities.Reward.create(rewardData), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rewards', gymId] }); } });
  const deleteRewardMutation = useMutation({ mutationFn: rewardId => base44.entities.Reward.delete(rewardId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rewards', gymId] }); } });
  const createClassMutation = useMutation({ mutationFn: classData => base44.entities.GymClass.create(classData), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes', gymId] }); } });
  const deleteClassMutation = useMutation({ mutationFn: classId => base44.entities.GymClass.delete(classId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes', gymId] }); } });
  const createCoachMutation = useMutation({ mutationFn: coachData => base44.entities.Coach.create(coachData), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coaches', gymId] }); } });
  const deleteCoachMutation = useMutation({ mutationFn: coachId => base44.entities.Coach.delete(coachId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coaches', gymId] }); } });
  const deleteChallengeMutation = useMutation({ mutationFn: challengeId => base44.entities.Challenge.delete(challengeId), onMutate: async challengeId => { await queryClient.cancelQueries({ queryKey: ['challenges', gymId] }); const previous = queryClient.getQueryData(['challenges', gymId]); queryClient.setQueryData(['challenges', gymId], (old=[]) => old.filter(c => c.id !== challengeId)); return { previous }; }, onError: (err, vars, context) => { queryClient.setQueryData(['challenges', gymId], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challenges', gymId] }); } });
  const deleteEventMutation = useMutation({ mutationFn: eventId => base44.entities.Event.delete(eventId), onMutate: async eventId => { await queryClient.cancelQueries({ queryKey: ['events', gymId] }); const previous = queryClient.getQueryData(['events', gymId]); queryClient.setQueryData(['events', gymId], (old=[]) => old.filter(e => e.id !== eventId)); return { previous }; }, onError: (err, vars, context) => { queryClient.setQueryData(['events', gymId], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events', gymId] }); } });
  const votePollMutation = useMutation({ mutationFn: async ({ pollId, optionId }) => { const poll = polls.find(p => p.id === pollId); const updatedOptions = poll.options.map(opt => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt); await base44.entities.Poll.update(pollId, { options: updatedOptions, voters: [...(poll.voters || []), currentUser.id] }); }, onMutate: async ({ pollId, optionId }) => { await queryClient.cancelQueries({ queryKey: ['polls', gymId] }); const previous = queryClient.getQueryData(['polls', gymId]); queryClient.setQueryData(['polls', gymId], (old=[]) => old.map(p => p.id === pollId ? { ...p, voters: [...(p.voters || []), currentUser.id], options: p.options.map(opt => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt) } : p)); return { previous }; }, onError: (err, vars, context) => { queryClient.setQueryData(['polls', gymId], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['polls', gymId] }); } });
  const updateCoachMutation = useMutation({ mutationFn: ({ coachId, data }) => base44.entities.Coach.update(coachId, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coaches', gymId] }); } });
  const createChallengeMutation = useMutation({ mutationFn: challengeData => base44.entities.Challenge.create({ ...challengeData, gym_id: gymId, gym_name: gym?.name }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challenges', gymId] }); setShowCreateChallenge(false); } });
  const updateGalleryMutation = useMutation({ mutationFn: gallery => base44.entities.Gym.update(gymId, { gallery }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); setShowManagePhotos(false); } });
  const updateHeroImageMutation = useMutation({ mutationFn: image_url => base44.entities.Gym.update(gymId, { image_url }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); setShowEditHeroImage(false); } });
  const updateGymLogoMutation = useMutation({ mutationFn: logo_url => base44.entities.Gym.update(gymId, { logo_url }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); setShowEditGymLogo(false); } });
  const banMemberMutation = useMutation({ mutationFn: userId => base44.entities.Gym.update(gymId, { banned_members: [...(gym?.banned_members || []), userId] }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); } });
  const unbanMemberMutation = useMutation({ mutationFn: userId => base44.entities.Gym.update(gymId, { banned_members: (gym?.banned_members || []).filter(id => id !== userId) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); } });
  const joinGhostGymMutation = useMutation({ mutationFn: async () => { await base44.entities.GymMembership.create({ user_id: currentUser.id, user_name: currentUser.full_name, user_email: currentUser.email, gym_id: gym.id, gym_name: gym.name, status: 'active', join_date: new Date().toISOString().split('T')[0], membership_type: 'lifetime' }); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gymMembership', currentUser?.id, gymId] }); queryClient.invalidateQueries({ queryKey: ['gymMemberships', currentUser?.id] }); window.location.href = createPageUrl('Home'); } });
  const joinChallengeMutation = useMutation({ mutationFn: async challenge => { const currentParticipants = challenge.participants || []; await base44.entities.Challenge.update(challenge.id, { participants: [...currentParticipants, currentUser.id] }); await base44.entities.ChallengeParticipant.create({ user_id: currentUser.id, user_name: currentUser.full_name, challenge_id: challenge.id, challenge_title: challenge.title, progress: 0, completed: false }); }, onMutate: async challenge => { await queryClient.cancelQueries({ queryKey: ['challengeParticipants', currentUser?.id] }); const previous = queryClient.getQueryData(['challengeParticipants', currentUser?.id]); queryClient.setQueryData(['challengeParticipants', currentUser?.id], (old=[]) => [...old, { id:`temp-${challenge.id}`, user_id:currentUser.id, challenge_id:challenge.id, challenge_title:challenge.title, progress:0, completed:false }]); return { previous }; }, onError: (err, challenge, context) => { queryClient.setQueryData(['challengeParticipants', currentUser?.id], context.previous); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challengeParticipants', currentUser?.id] }); queryClient.invalidateQueries({ queryKey: ['challenges', gymId] }); queryClient.invalidateQueries({ queryKey: ['challenges'] }); queryClient.invalidateQueries({ queryKey: ['activeChallenges'] }); base44.entities.Notification.create({ user_id: currentUser.id, type: 'challenge', title: '💪 Challenge Joined!', message: 'Good luck on your new challenge!', icon: '🎯' }); } });

  const isGymOwner = currentUser && gym && currentUser.email === gym.owner_email && currentUser.account_type === 'gym_owner';
  const isGhostGym = gym && !gym.admin_id && !gym.owner_email;
  const currentCoach = currentUser && coaches.find(c => c.user_email === currentUser.email);
  const isCoach = !!currentCoach;
  const showOwnerControls = isGymOwner && !viewAsMember;
  const isMember = !!gymMembership || isGymOwner;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);
  const weeklyCheckIns = checkIns.filter(c => new Date(c.check_in_date) >= weekAgo);
  const upcomingEvents = events.filter(e => { const d = new Date(e.event_date); return d >= now && d <= new Date(now.getTime() + 7*86400000); }).slice(0, 2);

  const checkInLeaderboard = Object.values(
    weeklyCheckIns.reduce((acc, c) => {
      const id = c.user_id;
      if (!acc[id]) acc[id] = { userId:id, userName:c.user_name, userAvatar:memberAvatarMap[id]||null, count:0 };
      acc[id].count++;
      return acc;
    }, {})
  ).sort((a,b) => b.count-a.count).slice(0,10);

  const calcUserStreak = (userId) => {
    const uci = checkIns.filter(c => c.user_id === userId).sort((a,b) => new Date(b.check_in_date)-new Date(a.check_in_date));
    if (!uci.length) return 0;
    let streak = 1, cur = new Date(uci[0].check_in_date); cur.setHours(0,0,0,0);
    for (let i=1;i<uci.length;i++) { const d=new Date(uci[i].check_in_date); d.setHours(0,0,0,0); const diff=Math.floor((cur-d)/86400000); if (diff===1){streak++;cur=d;}else if(diff>1)break; }
    return streak;
  };

  const streakLeaderboard = Object.values(
    checkIns.reduce((acc,c) => { const id=c.user_id; if (!acc[id]) acc[id]={userId:id,userName:c.user_name,userAvatar:memberAvatarMap[id]||null}; return acc; }, {})
  ).map(item => ({ ...item, streak:calcUserStreak(item.userId) })).sort((a,b) => b.streak-a.streak).slice(0,10);

  const calculateProgressLeaderboard = (timeFilterDays) => {
    const cutoffDate = timeFilterDays===null ? new Date(0) : new Date(now.getTime()-timeFilterDays*86400000);
    const userMaxWeights = {};
    lifts.forEach(lift => {
      const liftDate = new Date(lift.lift_date);
      if (liftDate >= cutoffDate) {
        const key = `${lift.member_id}-${lift.exercise}`;
        if (!userMaxWeights[key]) userMaxWeights[key]={ userId:lift.member_id, userName:lift.member_name, userAvatar:memberAvatarMap[lift.member_id]||null, exercise:lift.exercise, maxWeight:lift.weight_lbs, prevMax:0 };
        if (lift.weight_lbs > userMaxWeights[key].maxWeight) { userMaxWeights[key].prevMax=userMaxWeights[key].maxWeight; userMaxWeights[key].maxWeight=lift.weight_lbs; }
      }
    });
    return Object.values(userMaxWeights)
      .map(item => ({ userId:item.userId, userName:item.userName, userAvatar:item.userAvatar||null, increase:item.maxWeight-item.prevMax }))
      .filter(item => item.increase > 0)
      .reduce((acc,item) => { const ex=acc.find(a=>a.userId===item.userId); if(ex) ex.increase+=item.increase; else acc.push(item); return acc; }, [])
      .sort((a,b) => b.increase-a.increase).slice(0,10);
  };

  const progressLeaderboardWeek = calculateProgressLeaderboard(7);
  const progressLeaderboardMonth = calculateProgressLeaderboard(30);
  const progressLeaderboardAllTime = calculateProgressLeaderboard(null);

  if (gymLoading && !gym) return <GymCommunitySkeleton />;
  if (!gymLoading && !gym) return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex items-center justify-center p-4">
      <div className="p-8 text-center rounded-2xl" style={CARD_STYLE}><p className="text-slate-400 mb-4">Gym not found</p><Link to={createPageUrl('Gyms')} className="text-blue-400 font-bold">Back to Gyms</Link></div>
    </div>
  );

  const tabTriggerClass = "whitespace-nowrap ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-slate-900/80 backdrop-blur-md text-slate-400 font-bold rounded-full px-3 py-1.5 flex items-center gap-1.5 justify-center border border-slate-600/40 shadow-[0_3px_0_0_#0d1220,inset_0_1px_0_rgba(255,255,255,0.08)] data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:via-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";

  return (
    <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries(); }}>
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-x-hidden">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 z-0">
              {gym.image_url
                ? <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover" style={{ opacity:0.55 }} loading="eager" fetchPriority="high" />
                : <div className="w-full h-full" style={{ background:'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }} />
              }
              <div className="absolute inset-0" style={{ background:'linear-gradient(to bottom, rgba(2,4,10,0.3) 0%, rgba(2,4,10,0.0) 40%, rgba(2,4,10,0.75) 100%)' }} />
              <div className="absolute inset-0" style={{ background:'linear-gradient(to right, rgba(2,4,10,0.5) 0%, transparent 60%)' }} />
            </div>
            <div className="relative z-10 px-4 pt-4 pb-0" style={{ minHeight:'140px' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className={`font-black text-white drop-shadow-lg ${gym.name.length>28?'text-base':gym.name.length>18?'text-lg':'text-xl'}`}>{gym.name}</h1>
                    {gym.verified && <BadgeCheck className="w-4 h-4 text-blue-400 flex-shrink-0 drop-shadow" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-white/60 text-[11px] flex items-center gap-1"><MapPin className="w-3 h-3" />{gym.city}</p>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)' }}>
                      <Users className="w-3 h-3 text-white/70" />
                      <span className="text-[11px] font-bold text-white">{gym?.members_count||0} members</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {isGhostGym && !isGymOwner && (
                    <button onClick={() => setShowInviteOwnerModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 shadow-[0_3px_0_0_#5b21b6,0_6px_20px_rgba(120,40,220,0.4)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100">
                      <Crown className="w-3.5 h-3.5" />Make Official
                    </button>
                  )}
                  {showOwnerControls && (
                    <button onClick={() => setShowEditHeroImage(true)} className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-white/90 active:scale-95 transition-transform">
                      <Edit className="w-3 h-3 inline mr-1" />Edit Hero
                    </button>
                  )}
                  {isGymOwner && (
                    <button onClick={() => setViewAsMember(!viewAsMember)} className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-white/90 active:scale-95 transition-transform">
                      {viewAsMember ? '👤 Member' : '👑 Owner'}
                    </button>
                  )}
                  {isCoach && !isGymOwner && (
                    <div className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background:'rgba(59,130,246,0.7)' }}>🎓 Coach</div>
                  )}
                </div>
              </div>
            </div>
            <div className="relative z-10 pt-2" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)', overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
              <TabsList className="flex justify-start bg-transparent px-3 py-2 h-auto gap-1.5" style={{ width:'max-content', minWidth:'100%' }}>
                <TabsTrigger value="home"       className={tabTriggerClass}><Home     className="w-3.5 h-3.5" /><span>Home</span></TabsTrigger>
                <TabsTrigger value="challenges" className={tabTriggerClass}><Trophy   className="w-3.5 h-3.5" /><span>Challenges</span></TabsTrigger>
                <TabsTrigger value="classes"    className={tabTriggerClass}><Dumbbell className="w-3.5 h-3.5" /><span>Classes</span></TabsTrigger>
                <TabsTrigger value="events"     className={tabTriggerClass}><Calendar className="w-3.5 h-3.5" /><span>Events</span></TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-3 md:px-4 pt-3 pb-28 space-y-3 w-full overflow-hidden">

            {/* ── HOME ── */}
            <TabsContent value="home" className="space-y-3 mt-0 w-full" asChild>
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }} className="space-y-3">
                {isGhostGym && !isMember && !showOwnerControls && (
                  <div className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ background:'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(219,39,119,0.15))', border:'1px solid rgba(139,92,246,0.35)' }}>
                    <div><p className="text-sm font-bold text-white mb-0.5">Unlock rewards & challenges</p><p className="text-xs text-slate-400">Join this gym community</p></div>
                    <button onClick={() => joinGhostGymMutation.mutate()} disabled={joinGhostGymMutation.isPending} className="px-4 py-2 rounded-full text-xs font-bold text-white flex-shrink-0 active:scale-95 transition-transform" style={{ background:'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                      {joinGhostGymMutation.isPending ? 'Joining...' : 'Join Gym'}
                    </button>
                  </div>
                )}
                {!isMember && !isGhostGym && !showOwnerControls && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <RippleButton onClick={() => { setJoinPanel(p => p==='code'?null:'code'); setJoinCodeError(''); setJoinCodeSuccess(false); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black transition-all duration-150 active:scale-95"
                        style={{ background:joinPanel==='code'?'linear-gradient(135deg,#1d4ed8,#1e40af)':'linear-gradient(135deg,rgba(29,78,216,0.25),rgba(30,64,175,0.15))', border:`1px solid ${joinPanel==='code'?'rgba(59,130,246,0.6)':'rgba(59,130,246,0.3)'}`, boxShadow:joinPanel==='code'?'0 4px 0 0 #1e3a8a, 0 8px 24px rgba(59,130,246,0.3)':'0 2px 0 0 rgba(0,0,0,0.4)', color:joinPanel==='code'?'#fff':'rgba(147,197,253,0.9)', transform:joinPanel==='code'?'translateY(2px)':'translateY(0)' }}>
                        <span style={{ fontSize:16 }}>🔑</span><span>Join with Code</span>
                        <span style={{ display:'inline-block', transform:joinPanel==='code'?'rotate(180deg)':'rotate(0deg)', transition:'transform 0.3s cubic-bezier(0.34,1.4,0.64,1)', fontSize:11, opacity:0.7 }}>▼</span>
                      </RippleButton>
                      <RippleButton onClick={() => { setJoinPanel(p => p==='primary'?null:'primary'); setPrimaryConfirmed(false); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black transition-all duration-150 active:scale-95"
                        style={{ background:joinPanel==='primary'?'linear-gradient(135deg,#b45309,#92400e)':'linear-gradient(135deg,rgba(180,83,9,0.25),rgba(146,64,14,0.15))', border:`1px solid ${joinPanel==='primary'?'rgba(251,191,36,0.55)':'rgba(251,191,36,0.25)'}`, boxShadow:joinPanel==='primary'?'0 4px 0 0 #78350f, 0 8px 24px rgba(251,191,36,0.25)':'0 2px 0 0 rgba(0,0,0,0.4)', color:joinPanel==='primary'?'#fff':'rgba(253,230,138,0.9)', transform:joinPanel==='primary'?'translateY(2px)':'translateY(0)' }}>
                        <span style={{ fontSize:16 }}>⭐</span><span>Set Primary</span>
                        <span style={{ display:'inline-block', transform:joinPanel==='primary'?'rotate(180deg)':'rotate(0deg)', transition:'transform 0.3s cubic-bezier(0.34,1.4,0.64,1)', fontSize:11, opacity:0.7 }}>▼</span>
                      </RippleButton>
                    </div>
                    <SlidePanel open={joinPanel==='code'}>
                      <div className="rounded-2xl p-4 mt-1" style={{ background:'linear-gradient(135deg,rgba(17,34,80,0.95),rgba(10,20,50,0.98))', border:'1px solid rgba(59,130,246,0.25)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
                        <p className="text-[13px] font-black text-white mb-1">Enter your gym invite code</p>
                        <p className="text-[11px] mb-3" style={{ color:'rgba(148,163,184,0.7)' }}>Ask your gym owner or a member for the code</p>
                        {joinCodeSuccess ? (
                          <div className="flex flex-col items-center py-4 gap-2">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl" style={{ background:'rgba(16,185,129,0.15)', border:'2px solid rgba(16,185,129,0.4)' }}>✓</div>
                            <p className="text-sm font-black text-emerald-400">You're in!</p>
                            <p className="text-xs text-slate-400">Welcome to {gym?.name}</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-2">
                              <input value={joinCode} onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinCodeError(''); }} placeholder="e.g. GYM-XK29" maxLength={10}
                                className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold text-white placeholder-slate-600 outline-none"
                                style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${joinCodeError?'rgba(239,68,68,0.6)':'rgba(59,130,246,0.25)'}`, letterSpacing:'0.08em' }} />
                              <button onClick={() => { if (!joinCode.trim()) { setJoinCodeError('Please enter a code'); return; } setJoinCodeSuccess(true); }}
                                className="px-4 py-2.5 rounded-xl text-sm font-black text-white active:scale-95 transition-transform"
                                style={{ background:'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow:'0 3px 0 0 #1e3a8a' }}>Join</button>
                            </div>
                            {joinCodeError && <p className="text-[11px] text-red-400 mt-1.5 font-semibold">{joinCodeError}</p>}
                          </>
                        )}
                      </div>
                    </SlidePanel>
                    <SlidePanel open={joinPanel==='primary'}>
                      <div className="rounded-2xl p-4 mt-1" style={{ background:'linear-gradient(135deg,rgba(40,24,8,0.95),rgba(25,15,5,0.98))', border:'1px solid rgba(251,191,36,0.2)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
                        {primaryConfirmed ? (
                          <div className="flex flex-col items-center py-4 gap-2">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl" style={{ background:'rgba(251,191,36,0.15)', border:'2px solid rgba(251,191,36,0.4)' }}>⭐</div>
                            <p className="text-sm font-black text-yellow-400">{gym?.name} is now your primary gym!</p>
                            <p className="text-xs text-slate-400">Your stats and check-ins will be tracked here</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.25)' }}>🏋️</div>
                              <div>
                                <p className="text-[13px] font-black text-white leading-tight">Set as your home gym</p>
                                <p className="text-[11px] mt-0.5" style={{ color:'rgba(148,163,184,0.65)' }}>Your check-ins, leaderboard rank &amp; streak will be tracked at {gym?.name}</p>
                              </div>
                            </div>
                            <button onClick={() => setPrimaryConfirmed(true)} className="w-full py-3 rounded-xl text-sm font-black text-white active:scale-95 transition-transform" style={{ background:'linear-gradient(135deg,#d97706,#b45309)', boxShadow:'0 3px 0 0 #78350f, 0 6px 20px rgba(217,119,6,0.3)' }}>
                              ⭐ Confirm — Set {gym?.name} as Primary
                            </button>
                          </>
                        )}
                      </div>
                    </SlidePanel>
                  </div>
                )}
                {polls.length > 0 && (
                  <div className="space-y-3">
                    {polls.map(poll => (
                      <PollCard key={poll.id} poll={poll} onVote={!showOwnerControls && !poll.voters?.includes(currentUser?.id) ? optionId => votePollMutation.mutate({ pollId:poll.id, optionId }) : null} userVoted={poll.voters?.includes(currentUser?.id)} isLoading={votePollMutation.isPending} />
                    ))}
                  </div>
                )}
                <BusyTimesChart checkIns={checkIns} gymId={gymId} />
                <LeaderboardSection view={leaderboardView} setView={setLeaderboardView} checkInLeaderboard={checkInLeaderboard} streakLeaderboard={streakLeaderboard} progressLeaderboardWeek={progressLeaderboardWeek} progressLeaderboardMonth={progressLeaderboardMonth} progressLeaderboardAllTime={progressLeaderboardAllTime} />
                {upcomingEvents.length > 0 && (
                  <div className="rounded-2xl p-4" style={CARD_STYLE}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'rgba(251,146,60,0.15)' }}><Calendar className="w-3.5 h-3.5 text-orange-400" /></div>
                      <h3 className="text-[13px] font-black text-white">This Week</h3>
                    </div>
                    <div className="space-y-2">
                      {upcomingEvents.map(event => (
                        <WeeklyEventCard key={event.id} event={event} onRSVP={!showOwnerControls ? eventId => { const e=events.find(e=>e.id===eventId); rsvpMutation.mutate({ eventId, currentAttendees:e.attendees||0 }); } : null} disabled={showOwnerControls} />
                      ))}
                    </div>
                  </div>
                )}
                {gymChallenges.length > 0 && (
                  <div className="rounded-2xl p-4" style={CARD_STYLE}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'rgba(167,139,250,0.15)' }}><Trophy className="w-3.5 h-3.5 text-purple-400" /></div>
                      <h3 className="text-[13px] font-black text-white">New Challenges</h3>
                    </div>
                    <div className="space-y-2">
                      {gymChallenges.slice(0,1).map(challenge => (
                        <GymChallengeCard key={challenge.id} challenge={challenge} isJoined={challengeParticipants.some(p=>p.challenge_id===challenge.id)} onJoin={!showOwnerControls ? c => joinChallengeMutation.mutate(c) : null} currentUser={currentUser} disabled={showOwnerControls} isOwner={showOwnerControls} onDelete={null} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* ── CHALLENGES ── */}
            <TabsContent value="challenges" className="space-y-3 mt-0 w-full" asChild>
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }} className="space-y-3">
                {showOwnerControls && (
                  <button onClick={() => setShowCreateChallenge(true)} className="w-full rounded-2xl py-4 flex flex-col items-center gap-2 text-white font-bold active:scale-[0.98] transition-transform" style={{ background:'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.15))', border:'1px solid rgba(59,130,246,0.3)' }}>
                    <Plus className="w-5 h-5" /><span className="text-sm">Create Gym Challenge</span>
                  </button>
                )}
                {gymChallenges.length > 0
                  ? gymChallenges.map(challenge => (<GymChallengeCard key={challenge.id} challenge={challenge} isJoined={challengeParticipants.some(p=>p.challenge_id===challenge.id)} onJoin={!showOwnerControls ? c => joinChallengeMutation.mutate(c) : null} currentUser={currentUser} disabled={showOwnerControls} isOwner={showOwnerControls} onDelete={showOwnerControls ? id => { if(window.confirm('Delete this challenge?')) deleteChallengeMutation.mutate(id); } : null} />))
                  : (<div className="rounded-2xl p-10 text-center" style={CARD_STYLE}><Trophy className="w-10 h-10 mx-auto mb-3 text-slate-700" /><p className="text-white font-bold mb-1 text-sm">No Active Challenges</p><p className="text-xs text-slate-500">Check back soon for new challenges!</p></div>)
                }
              </motion.div>
            </TabsContent>

            {/* ── CLASSES (new) ── */}
            <TabsContent value="classes" className="space-y-3 mt-0 w-full">
              <ClassesTabContent
                classes={classes}
                showOwnerControls={showOwnerControls}
                onManage={() => setShowManageClasses(true)}
                onDelete={id => deleteClassMutation.mutate(id)}
              />
            </TabsContent>

            {/* ── EVENTS ── */}
            <TabsContent value="events" className="space-y-3 mt-0 w-full" asChild>
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }} className="space-y-3">
                <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'rgba(251,146,60,0.15)' }}><Calendar className="w-3.5 h-3.5 text-orange-400" /></div><h3 className="text-[13px] font-black text-white">Upcoming Events</h3></div>
                    {showOwnerControls && <button onClick={() => setShowCreateEvent(true)} className="text-[11px] font-bold text-blue-400 px-3 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-transform" style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)' }}><Plus className="w-3 h-3" />Create</button>}
                  </div>
                  <div className="px-3 pb-4">
                    {events.filter(e => new Date(e.event_date) >= now).length === 0
                      ? <div className="py-6 text-center border-2 border-dashed rounded-2xl" style={{ borderColor:'rgba(255,255,255,0.06)' }}><Calendar className="w-7 h-7 mx-auto mb-1 text-slate-700" /><p className="text-slate-600 text-xs">No upcoming events</p></div>
                      : <div className="space-y-2">{events.filter(e => new Date(e.event_date) >= now).slice(0,5).map(event => (<EventCard key={event.id} event={event} onRSVP={eventId => { const e=events.find(e=>e.id===eventId); rsvpMutation.mutate({ eventId, currentAttendees:e.attendees||0 }); }} isOwner={showOwnerControls} onDelete={showOwnerControls ? eventId => { if(window.confirm('Delete?')) deleteEventMutation.mutate(eventId); } : null} />))}</div>
                    }
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'rgba(96,165,250,0.15)' }}><GraduationCap className="w-3.5 h-3.5 text-blue-400" /></div><h3 className="text-[13px] font-black text-white">Coaches</h3></div>
                    {showOwnerControls && <button onClick={() => setShowManageCoaches(true)} className="text-[11px] font-bold text-blue-400 px-3 py-1 rounded-full active:scale-95 transition-transform" style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)' }}>Manage</button>}
                  </div>
                  <div className="px-3 pb-4">
                    {coaches.length === 0
                      ? <div className="py-6 text-center border-2 border-dashed rounded-2xl" style={{ borderColor:'rgba(255,255,255,0.06)' }}><GraduationCap className="w-7 h-7 mx-auto mb-1 text-slate-700" /><p className="text-slate-600 text-xs">No coaches listed</p></div>
                      : <div className="space-y-2">{coaches.slice(0,5).map(coach => {
                          const handleCopyEmail = () => { navigator.clipboard.writeText(coach.user_email); setCopiedCoachId(coach.id); setTimeout(() => setCopiedCoachId(null), 2000); };
                          return (
                            <div key={coach.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background:'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
                                {coach.avatar_url ? <img src={coach.avatar_url} alt={coach.name} className="w-full h-full object-cover" /> : <span className="text-base font-black text-white">{coach.name.charAt(0)}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <h4 className="font-bold text-white text-[13px] truncate">{coach.name}</h4>
                                  {coach.rating && <div className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" /><span className="text-[10px] font-bold text-slate-300">{coach.rating}</span></div>}
                                </div>
                                {coach.specialties?.length > 0 && (<div className="flex flex-wrap gap-1">{coach.specialties.slice(0,2).map((s,i) => <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-blue-300" style={{ background:'rgba(59,130,246,0.12)' }}>{s}</span>)}</div>)}
                              </div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform" style={{ background:'rgba(59,130,246,0.1)' }}><Mail className="w-3.5 h-3.5 text-blue-400" /></button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3 bg-slate-800 border-slate-700">
                                  <div className="flex items-center gap-2">
                                    <a href={`mailto:${coach.user_email}`} className="text-blue-400 text-xs font-medium break-all flex-1">{coach.user_email}</a>
                                    <button onClick={handleCopyEmail} className="w-7 h-7 flex items-center justify-center hover:bg-slate-700 rounded transition-colors"><Copy className={`w-3.5 h-3.5 ${copiedCoachId===coach.id?'text-green-400':'text-slate-400'}`} /></button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          );
                        })}</div>
                    }
                  </div>
                </div>
              </motion.div>
            </TabsContent>

          </div>
        </Tabs>

        <CreateEventModal open={showCreateEvent} onClose={() => setShowCreateEvent(false)} onSave={data => createEventMutation.mutate(data)} gym={gym} isLoading={createEventMutation.isPending} />
        <ManageEquipmentModal open={showManageEquipment} onClose={() => setShowManageEquipment(false)} equipment={gym?.equipment||[]} onSave={equipment => updateEquipmentMutation.mutate(equipment)} isLoading={updateEquipmentMutation.isPending} />
        <ManageRewardsModal open={showManageRewards} onClose={() => setShowManageRewards(false)} rewards={rewards} onCreateReward={data => createRewardMutation.mutate(data)} onDeleteReward={id => deleteRewardMutation.mutate(id)} gym={gym} isLoading={createRewardMutation.isPending} />
        <ManageClassesModal open={showManageClasses} onClose={() => setShowManageClasses(false)} classes={classes} onCreateClass={data => createClassMutation.mutate(data)} onDeleteClass={id => deleteClassMutation.mutate(id)} gym={gym} isLoading={createClassMutation.isPending} />
        <ManageCoachesModal open={showManageCoaches} onClose={() => setShowManageCoaches(false)} coaches={coaches} onCreateCoach={data => createCoachMutation.mutate(data)} onDeleteCoach={id => deleteCoachMutation.mutate(id)} onUpdateCoach={(coachId,data) => updateCoachMutation.mutate({ coachId, data })} gym={gym} isLoading={createCoachMutation.isPending} />
        <ManageGymPhotosModal open={showManagePhotos} onClose={() => setShowManagePhotos(false)} gallery={gym?.gallery||[]} onSave={gallery => updateGalleryMutation.mutate(gallery)} isLoading={updateGalleryMutation.isPending} />
        <EditHeroImageModal open={showEditHeroImage} onClose={() => setShowEditHeroImage(false)} currentImageUrl={gym?.image_url} onSave={image_url => updateHeroImageMutation.mutate(image_url)} isLoading={updateHeroImageMutation.isPending} />
        <EditGymLogoModal open={showEditGymLogo} onClose={() => setShowEditGymLogo(false)} currentLogoUrl={gym?.logo_url} onSave={logo_url => updateGymLogoMutation.mutate(logo_url)} isLoading={updateGymLogoMutation.isPending} />
        <ManageMembersModal open={showManageMembers} onClose={() => setShowManageMembers(false)} gym={gym} onBanMember={userId => banMemberMutation.mutate(userId)} onUnbanMember={userId => unbanMemberMutation.mutate(userId)} />
        <UpgradeMembershipModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentUser={currentUser} />
        <CreateChallengeModal open={showCreateChallenge} onClose={() => setShowCreateChallenge(false)} gyms={allGyms} onSave={data => createChallengeMutation.mutate(data)} isLoading={createChallengeMutation.isPending} />
        <InviteOwnerModal isOpen={showInviteOwnerModal} onClose={() => setShowInviteOwnerModal(false)} gym={gym} currentUser={currentUser} />
      </div>
    </PullToRefresh>
  );
}
