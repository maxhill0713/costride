import React, { useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '../components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dumbbell, Trophy, TrendingUp, Calendar, ChevronRight, MapPin, Clock, CheckCircle, AlertCircle, Target, X, Crown, Bell, Heart, MessageCircle, Edit2, Info, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import StreakIcon from '../components/StreakIcon';
import FriendsIcon from '../components/FriendsIcon';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import WeeklyChallengeCard from '../components/challenges/WeeklyChallengeCard';
import TodayWorkout from '../components/profile/TodayWorkout';
import StreakVariantPicker from '../components/StreakVariantPicker';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import PostCard from '../components/feed/PostCard';
import QuoteCarousel from '../components/home/QuoteCarousel';
import ShareWorkoutScreen from '../components/profile/ShareWorkoutScreen';
import { useState } from 'react';
import { format, isToday, differenceInDays, startOfDay, startOfWeek, formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

// ─────────────────────────────────────────────
// STREAK ICON URLS
// ─────────────────────────────────────────────
const POSE_1_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';
const POSE_2_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/760358372_STREAKICON21.png';

// ─────────────────────────────────────────────
// CHECK-IN BUTTON STYLES — injected once
// ─────────────────────────────────────────────
const CHECK_IN_CSS = `
  @keyframes ci-ripple {
    0%   { transform: scale(0); opacity: 0.55; }
    100% { transform: scale(48); opacity: 0; }
  }
  @keyframes ci-tick-draw {
    from { stroke-dashoffset: 40; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes ci-tick-pop {
    0%   { transform: scale(0.4); opacity: 0; }
    60%  { transform: scale(1.18); opacity: 1; }
    80%  { transform: scale(0.94); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes ci-success-fade {
    0%   { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
  }
`;

function injectCheckInStyles() {
  if (document.getElementById('checkin-btn-styles')) return;
  const s = document.createElement('style');
  s.id = 'checkin-btn-styles';
  s.textContent = CHECK_IN_CSS;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────
// INLINE CHECK-IN BUTTON COMPONENT
// ─────────────────────────────────────────────
function CheckInButton({ gym, onCheckInSuccess }) {
  const queryClient = useQueryClient();
  const [pressed, setPressed]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [ripples, setRipples]   = useState([]);
  const btnRef                  = useRef(null);
  const rippleId                = useRef(0);

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.CheckIn.create({
        user_id:       me.id,
        user_name:     me.full_name,
        gym_id:        gym.id,
        gym_name:      gym.name,
        check_in_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkIns'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setSuccess(true);
      onCheckInSuccess?.();
    },
  });

  const spawnRipple = (e) => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width / 2) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY || rect.top + rect.height / 2) - rect.top;
    const id = ++rippleId.current;
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
  };

  const handlePress = (e) => {
    if (checkInMutation.isPending || success) return;
    setPressed(true);
    spawnRipple(e);
  };

  const handleRelease = () => {
    if (!pressed) return;
    setPressed(false);
    if (!checkInMutation.isPending && !success) {
      checkInMutation.mutate();
    }
  };

  const isLoading = checkInMutation.isPending;
  const isSuccess = success;

  return (
    <div style={{ position: 'relative' }}>
      {/* 3D floor */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 18,
        background: isSuccess ? '#15803d' : '#1a3fa8',
        transform: 'translateY(5px)',
      }} />
      {/* Button face */}
      <button
        ref={btnRef}
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onMouseLeave={() => { if (pressed) setPressed(false); }}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        disabled={isLoading || isSuccess}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '16px 24px',
          borderRadius: 18, border: 'none',
          cursor: isLoading || isSuccess ? 'default' : 'pointer',
          outline: 'none', overflow: 'hidden',
          WebkitTapHighlightColor: 'transparent', userSelect: 'none',
          transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.25s ease',
          transform: pressed ? 'translateY(5px)' : 'translateY(0)',
          boxShadow: pressed ? 'none'
            : isSuccess
              ? '0 5px 0 0 #15803d, 0 8px 24px rgba(22,163,74,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
              : '0 5px 0 0 #1a3fa8, 0 8px 28px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          background: isSuccess
            ? 'linear-gradient(to bottom, #4ade80, #22c55e 40%, #16a34a)'
            : isLoading
              ? 'linear-gradient(to bottom, #5b9ff5, #3b82f6 40%, #2563eb)'
              : 'linear-gradient(to bottom, #60a5fa, #3b82f6 40%, #2563eb)',
        }}>
        {ripples.map(r => (
          <span key={r.id} style={{
            position: 'absolute', left: r.x, top: r.y,
            width: 10, height: 10, borderRadius: '50%',
            background: 'rgba(255,255,255,0.35)', transform: 'scale(0)',
            animation: 'ci-ripple 0.65s ease-out forwards',
            pointerEvents: 'none', zIndex: 0, marginLeft: -5, marginTop: -5,
          }} />
        ))}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          {isSuccess ? (
            <>
              <div style={{ animation: 'ci-tick-pop 0.55s cubic-bezier(0.34,1.3,0.64,1) forwards' }}>
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="13" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                  <path d="M7.5 14.5l4.5 4.5 8.5-9.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="40" strokeDashoffset="40"
                    style={{ animation: 'ci-tick-draw 0.4s ease 0.1s forwards' }} />
                </svg>
              </div>
              <span style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em', animation: 'ci-success-fade 0.35s ease forwards' }}>
                Checked In!
              </span>
            </>
          ) : isLoading ? (
            <>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 17, fontWeight: 900, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>
                Checking In…
              </span>
            </>
          ) : (
            <span style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Check In
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// WEB AUDIO HELPERS
// ─────────────────────────────────────────────
function playTone(ctx, freq, startTime, duration, gainVal, type = 'sine') {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}
function soundBounceIn(ctx) {
  const now = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(680, now + 0.18);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.start(now); osc.stop(now + 0.3);
}
function soundNumPop(ctx) {
  const now = ctx.currentTime;
  playTone(ctx, 900,  now,        0.08, 0.18);
  playTone(ctx, 1100, now + 0.04, 0.07, 0.12);
}
function soundPoseSwap(ctx) {
  const now = ctx.currentTime;
  [[659, 0], [784, 0.10], [1047, 0.20]].forEach(([freq, t]) => {
    playTone(ctx, freq,       now + t, 0.25, 0.28);
    playTone(ctx, freq * 1.5, now + t, 0.18, 0.06);
  });
  playTone(ctx, 330, now, 0.4, 0.1);
}
function soundGlowPulse(ctx) {
  const now = ctx.currentTime;
  [523, 659, 784].forEach((freq, i) => {
    playTone(ctx, freq, now + i * 0.03, 0.5, 0.09);
  });
}
function soundTransition(ctx) {
  const now = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.3);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
  osc.start(now); osc.stop(now + 0.35);
}

// ─────────────────────────────────────────────
// CSS KEYFRAMES — injected once into the document
// ─────────────────────────────────────────────
const STREAK_KEYFRAMES = `
  @keyframes streakBounceIn {
    0%   { transform: scale(0.5) translateY(30px); opacity: 0; }
    60%  { transform: scale(1.08) translateY(-5px); opacity: 1; }
    80%  { transform: scale(0.97) translateY(2px); }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes streakNumPop {
    0%   { transform: scale(0.5); opacity: 0; }
    65%  { transform: scale(1.1); opacity: 1; }
    85%  { transform: scale(0.97); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes streakFadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes streakWindup {
    0%   { transform: scale(1) rotate(0deg); }
    40%  { transform: scale(0.93) rotate(-3deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes streakIconPop {
    0%   { transform: scale(0.6); opacity: 0; }
    55%  { transform: scale(1.1); opacity: 1; }
    72%  { transform: scale(0.97); }
    85%  { transform: scale(1.04); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes streakGlowPulse {
    0%,100% { filter: drop-shadow(0 0 18px rgba(249,115,22,0.5)); }
    50%      { filter: drop-shadow(0 0 42px rgba(249,115,22,0.9)); }
  }
  @keyframes streakParticleBurst {
    0%   { transform: translate(0,0) scale(1); opacity: 1; }
    100% { transform: translate(var(--tx),var(--ty)) scale(0); opacity: 0; }
  }
  @keyframes dayButtonBounce {
    0%   { transform: scale(1); }
    20%  { transform: scale(0.82); }
    50%  { transform: scale(1.28); }
    70%  { transform: scale(0.94); }
    85%  { transform: scale(1.07); }
    100% { transform: scale(1); }
  }
  @keyframes dayWiggle {
    0%, 60%, 100% { transform: rotate(0deg); }
    65%           { transform: rotate(-6deg); }
    75%           { transform: rotate(5deg); }
    85%           { transform: rotate(-3deg); }
    92%           { transform: rotate(2deg); }
  }
  @keyframes todayRingPulse {
    0%, 100% { transform: scale(1);    opacity: 0.55; }
    50%       { transform: scale(1.13); opacity: 0.2;  }
  }
`;
function injectStreakStyles() {
  if (document.getElementById('streak-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'streak-keyframes';
  style.textContent = STREAK_KEYFRAMES;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// STREAK ANIMATION HELPERS
// ─────────────────────────────────────────────
function trigAnim(el, name, dur, easing) {
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = `${name} ${dur}ms ${easing} forwards`;
}
function spawnParticles() {
  const cols = ['#f97316', '#fb923c', '#fbbf24', '#ef4444', '#ffffff', '#fdba74'];
  for (let i = 0; i < 18; i++) {
    const p   = document.createElement('div');
    const ang = (i / 18) * 360;
    const d   = 70 + Math.random() * 70;
    const tx  = Math.cos(ang * Math.PI / 180) * d;
    const ty  = Math.sin(ang * Math.PI / 180) * d;
    const sz  = 5 + Math.random() * 7;
    p.style.cssText = [
      'position:fixed', 'border-radius:50%', 'pointer-events:none', 'z-index:9999',
      `width:${sz}px`, `height:${sz}px`,
      `left:calc(50% - ${sz / 2}px)`, `top:36%`,
      `background:${cols[i % cols.length]}`,
      `--tx:${tx}px`, `--ty:${ty}px`,
      `animation:streakParticleBurst ${0.7 + Math.random() * 0.35}s ease-out forwards`,
      `animation-delay:${Math.random() * 0.05}s`
    ].join(';');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}
function runStreakAnimation(newStreak, audioCtxRef, celebTimers) {
  const stage = document.getElementById('streak-anim-stage');
  const p1    = document.getElementById('streak-anim-p1');
  const p2    = document.getElementById('streak-anim-p2');
  const num   = document.getElementById('streak-anim-num');
  const lbl   = document.getElementById('streak-anim-lbl');
  if (!stage || !p1 || !p2 || !num || !lbl) return;
  const actx = audioCtxRef.current;
  if (actx) soundBounceIn(actx);
  trigAnim(stage, 'streakBounceIn', 750, 'cubic-bezier(0.34,1.3,0.64,1)');
  const t1 = setTimeout(() => {
    if (actx) soundNumPop(actx);
    trigAnim(num, 'streakNumPop', 520, 'cubic-bezier(0.34,1.3,0.64,1)');
    trigAnim(lbl, 'streakFadeUp', 400, 'ease');
  }, 700);
  const t2 = setTimeout(() => {
    trigAnim(stage, 'streakWindup', 380, 'ease-in-out');
  }, 1600);
  const t3 = setTimeout(() => {
    if (actx) soundPoseSwap(actx);
    spawnParticles();
    p1.style.transition = 'opacity 0.15s ease';
    p1.style.opacity = '0';
    p2.style.removeProperty('opacity');
    p2.style.opacity = '1';
    p2.style.animation = 'none';
    void p2.offsetWidth;
    p2.style.animation = 'streakIconPop 600ms cubic-bezier(0.34,1.2,0.64,1) forwards';
    stage.style.animation = 'none';
    setTimeout(() => {
      if (actx) soundNumPop(actx);
      if (navigator.vibrate) navigator.vibrate([60, 80, 100]);
      num.textContent = String(newStreak);
      trigAnim(num, 'streakNumPop', 420, 'cubic-bezier(0.34,1.25,0.64,1)');
    }, 160);
  }, 1980);
  const t4 = setTimeout(() => {
    if (actx) soundGlowPulse(actx);
    stage.style.animation = 'none';
    void stage.offsetWidth;
    stage.style.animation = 'streakGlowPulse 1.2s ease-in-out 2 forwards';
  }, 2800);
  const t5 = setTimeout(() => {
    if (actx) soundTransition(actx);
  }, 3200);
  celebTimers.current = [t1, t2, t3, t4, t5];
}

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showStreakVariants, setShowStreakVariants] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showChallengesCelebration, setShowChallengesCelebration] = useState(false);
  const [showShareWorkout, setShowShareWorkout] = useState(false);
  const [celebrationStreakNum, setCelebrationStreakNum] = useState(0);
  const [celebrationChallenges, setCelebrationChallenges] = useState([]);
  const [celebrationExercises, setCelebrationExercises] = useState([]);
  const [celebrationWorkoutName, setCelebrationWorkoutName] = useState('');
  const [justLoggedDay, setJustLoggedDay] = useState(null);
  const [activeCircleDay, setActiveCircleDay] = useState(null);
  const [summaryLog, setSummaryLog] = useState(null);
  const audioCtxRef = useRef(null);
  const celebTimers = useRef([]);

  useEffect(() => {
    injectStreakStyles();
    injectCheckInStyles();
  }, []);

  useEffect(() => {
    return () => { celebTimers.current.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    if (activeCircleDay === null) return;
    const dismiss = (e) => {
      if (!e.target.closest('[data-circle-btn]')) setActiveCircleDay(null);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [activeCircleDay]);

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try { return await base44.auth.me(); }
      catch (error) { console.error('Auth error:', error); return null; }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev
  });
  const primaryGymIdForQuery = currentUser?.primary_gym_id || (gymMemberships.length > 0 ? gymMemberships[0]?.gym_id : null);
  const { data: memberGymData } = useQuery({
    queryKey: ['gym', primaryGymIdForQuery],
    queryFn: () => base44.entities.Gym.filter({ id: primaryGymIdForQuery }).then((r) => r[0] || null),
    enabled: !!primaryGymIdForQuery,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev
  });
  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser?.id }, '-check_in_date', 100),
    enabled: !!currentUser,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev
  });
  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'active' }, '-created_date', 10),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev
  });
  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts', currentUser?.id],
    queryFn: () => base44.entities.Lift.filter({ member_id: currentUser?.id }, '-created_date', 50),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev
  });
  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser?.id }, '-created_date', 5),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 10000,
    placeholderData: (prev) => prev
  });
  const { data: friends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev
  });
  const friendIdList = friends.map((f) => f.friend_id);
  const { data: allPosts = [] } = useQuery({
    queryKey: ['friendPosts', currentUser?.id],
    queryFn: () => base44.entities.Post.filter({ is_system_generated: false }, '-created_date', 30),
    enabled: !!currentUser && friends.length > 0,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev
  });
  const { data: recentChallengeActivity = [] } = useQuery({
    queryKey: ['recentChallengeActivity'],
    queryFn: async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return base44.entities.ChallengeParticipant.filter({
        created_date: { $gte: oneDayAgo.toISOString() }
      }, '-created_date', 5);
    },
    enabled: !!currentUser && !!challenges.length,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev
  });
  const todayCheckInsForQuery = allCheckIns.filter((c) => isToday(new Date(c.check_in_date)));
  const checkInUserIdsForQuery = [...new Set(todayCheckInsForQuery.map((c) => c.user_id))];
  const { data: checkInUsers = [] } = useQuery({
    queryKey: ['checkInUsers', checkInUserIdsForQuery.join(',')],
    queryFn: async () => {
      if (checkInUserIdsForQuery.length === 0) return [];
      try {
        const users = await Promise.all(
          checkInUserIdsForQuery.map((id) => base44.entities.User.filter({ id }).then((results) => results[0]))
        );
        return users.filter(Boolean);
      } catch (error) {
        console.error('Error fetching check-in users:', error);
        return [];
      }
    },
    enabled: checkInUserIdsForQuery.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });
  const { data: weeklyWorkoutLogs = [] } = useQuery({
    queryKey: ['weeklyWorkoutLogs', currentUser?.id],
    queryFn: async () => {
      const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
      const logs = await base44.entities.WorkoutLog.filter({ user_id: currentUser.id });
      return logs.filter((l) => new Date(l.completed_date) >= monday);
    },
    enabled: !!currentUser?.id,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  useEffect(() => {
    if (currentUser && currentUser.onboarding_completed === false && !currentUser.account_type) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [currentUser?.onboarding_completed, currentUser?.account_type, navigate]);
  useEffect(() => {
    if (!showStreakCelebration) return;
    const init = setTimeout(() => {
      runStreakAnimation(celebrationStreakNum, audioCtxRef, celebTimers);
    }, 50);
    return () => {
      clearTimeout(init);
      celebTimers.current.forEach(clearTimeout);
    };
  }, [showStreakCelebration]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  const memberGym = memberGymData || null;
  const userCheckIns = allCheckIns.filter((c) => c.user_id === currentUser?.id);
  const lastCheckIn = userCheckIns.length > 0 ? userCheckIns[0].check_in_date : null;
  const daysSinceCheckIn = lastCheckIn ? differenceInDays(new Date(), new Date(lastCheckIn)) : null;
  const friendPosts = allPosts.filter((post) =>
    friendIdList.includes(post.member_id) &&
    !post.is_system_generated &&
    !post.content?.includes('well done') &&
    !post.content?.includes('workout finished')
  );
  const selectFeaturedChallenge = () => {
    const activeChallenges = challenges.filter((c) => c.status === 'active');
    if (activeChallenges.length === 0) return null;
    const withProgress = activeChallenges.map((c) => {
      const participants = lifts.filter((l) => c.participants?.includes(l.member_id) || false);
      const progress = c.target_value ? Math.min(participants.length / c.target_value * 100, 100) : 0;
      return { ...c, progress };
    });
    return withProgress.sort((a, b) => b.progress - a.progress)[0];
  };
  const userStreak = currentUser?.current_streak || 0;
  const streakVariant = currentUser?.streak_variant || 'default';
  const handleWorkoutLogged = async (challengesData = [], exercises = [], workoutName = '') => {
    const todayDow = new Date().getDay();
    const todayAdjusted = todayDow === 0 ? 7 : todayDow;
    setJustLoggedDay(todayAdjusted);
    setWorkoutStartTime(null);
    await queryClient.invalidateQueries({ queryKey: ['checkIns', currentUser?.id] });
    await queryClient.invalidateQueries({ queryKey: ['weeklyWorkoutLogs', currentUser?.id] });
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const freshUser = queryClient.getQueryData(['currentUser']);
    const newStreak = freshUser?.current_streak || (userStreak + 1);
    setCelebrationStreakNum(newStreak);
    setCelebrationChallenges(challengesData);
    setCelebrationExercises(exercises);
    setCelebrationWorkoutName(workoutName);
    const showShare = () => { setShowShareWorkout(true); };
    setShowStreakCelebration(true);
    setTimeout(() => {
      setShowStreakCelebration(false);
      if (challengesData.length > 0) {
        setShowChallengesCelebration(true);
        setTimeout(() => { setShowChallengesCelebration(false); showShare(); }, 4000);
      } else {
        showShare();
      }
    }, 3500);
  };
  const handleStreakVariantSelect = (variant) => {
    if (currentUser) {
      setShowStreakVariants(false);
      queryClient.setQueryData(['currentUser'], (old) => old ? { ...old, streak_variant: variant } : old);
      base44.auth.updateMe({ streak_variant: variant });
    }
  };
  const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyCheckIns = userCheckIns.filter((c) => new Date(c.check_in_date) >= startOfThisWeek);
  const weeklyTarget = currentUser?.weekly_goal || 3;
  const goalsOnTrack = goals.filter((g) => {
    const progress = g.current_value / g.target_value * 100;
    const daysUntilDeadline = g.deadline ? differenceInDays(new Date(g.deadline), new Date()) : null;
    if (!daysUntilDeadline || daysUntilDeadline < 0) return progress >= 80;
    const totalDuration = g.deadline ? differenceInDays(new Date(g.deadline), new Date(g.created_date || new Date())) : 30;
    const daysPassed = totalDuration - daysUntilDeadline;
    const expectedProgress = daysPassed / totalDuration * 100;
    return progress >= expectedProgress * 0.8;
  }).length;
  const weeklyComplete = weeklyCheckIns.length >= weeklyTarget;
  const goalsComplete = goals.length === 0 || goalsOnTrack >= goals.length * 0.5;
  const completedCount = (weeklyComplete ? 1 : 0) + (goalsComplete ? 1 : 0);
  const totalCount = goals.length > 0 ? 2 : 1;
  const isOnTrack = completedCount === totalCount;
  const progressPercentage = goals.length > 0 ? Math.round(goalsOnTrack / goals.length * 100) : weeklyCheckIns.length / weeklyTarget * 100;
  const getCommunityText = () => {
    const dayOfMonth = new Date().getDate();
    const todayCount = todayCheckInsForQuery.length;
    const messages = [
      `Join ${todayCount} other${todayCount === 1 ? '' : 's'} training today`,
      `${todayCount} members crushing it right now`,
      `See who's at the gym today—${todayCount} members active`,
      `${todayCount} gym warriors training today`,
      `Join ${todayCount} member${todayCount === 1 ? '' : 's'} on the floor`
    ];
    return todayCount > 0 ? messages[dayOfMonth % messages.length] : 'Members training together daily';
  };

  return (
    <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries(); }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        {/* Header */}
        <div className="bg-gradient-to-b from-slate-800/40 to-transparent backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-center relative px-4">
            <button
              onClick={() => setShowStreakVariants(true)}
              className="flex items-center hover:opacity-80 transition-opacity absolute left-0 top-1/2 -translate-y-1/2">
              <img
                src={POSE_1_URL}
                alt="streak"
                className="w-14 h-14 animate-[breathe_3s_ease-in-out_infinite]"
                style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 1px rgba(255,150,0,0.3))' }}
              />
              <span
                className="font-black text-xl -ml-2 mt-3 select-none"
                style={{
                  color: '#ffffff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(0,0,0,0.9)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>
                {userStreak}
              </span>
            </button>
            <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-blue-300 bg-clip-text text-transparent tracking-tight">
              CoStride
            </h1>
            <Link
              to={createPageUrl('Friends')}
              onClick={() => {
                if (currentUser) {
                  base44.auth.updateMe({ last_friends_view: new Date().toISOString() });
                }
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity p-2 -mr-2">
              <div className="relative">
                <FriendsIcon className="w-7 h-7 text-cyan-400" />
                {(friendPosts.length > 0 || notifications.length > 0) &&
                  (!currentUser?.last_friends_view ||
                    (friendPosts.length > 0 && new Date(friendPosts[0].created_date) > new Date(currentUser.last_friends_view)) ||
                    (notifications.length > 0 && new Date(notifications[0].created_date) > new Date(currentUser.last_friends_view))) &&
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
                }
              </div>
            </Link>
          </div>
        </div>

        <div className={`max-w-4xl mx-auto px-4 py-2 pb-32 ${daysSinceCheckIn === 0 ? 'space-y-2' : 'space-y-3'}`}>
          {memberGym && <>
            {!userCheckIns.some((c) => isToday(new Date(c.check_in_date))) &&
              <CheckInButton
                gym={memberGym}
                onCheckInSuccess={() => setWorkoutStartTime(Date.now())} />
            }
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center -space-x-2">
                {(() => {
                  const friendCheckInUsers = checkInUsers.filter((u) => friendIdList.includes(u.id));
                  const displayedUsers = friendCheckInUsers.slice(0, 5);
                  const remainingCount = Math.max(0, friendCheckInUsers.length - 5);
                  return (
                    <>
                      {displayedUsers.map((user) =>
                        <div key={user.id} className="relative group">
                          {user.avatar_url
                            ? <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover border-2 border-green-700" />
                            : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold border-2 border-green-700">
                                {user.full_name?.[0] || 'U'}
                              </div>
                          }
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {user.full_name}
                          </span>
                        </div>
                      )}
                      {remainingCount > 0 &&
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-500">
                          +{remainingCount}
                        </div>
                      }
                    </>
                  );
                })()}
              </div>
            </div>
          </>}

          {memberGym &&
            <div className="space-y-3">
              {currentUser?.custom_workout_types
                ? <TodayWorkout
                    currentUser={currentUser}
                    workoutStartTime={workoutStartTime}
                    onWorkoutStart={() => setWorkoutStartTime(Date.now())}
                    onWorkoutLogged={handleWorkoutLogged} />
                : <Card className="bg-gradient-to-br from-orange-500/10 via-slate-900/50 to-slate-950/50 backdrop-blur-2xl border border-orange-500/20 rounded-xl shadow-lg shadow-black/30 p-3 relative overflow-hidden">
                    <div className="relative space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                          <Dumbbell className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-[11px] font-bold text-slate-100 tracking-tight uppercase">Create Workout Split</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowSplitModal(true)}
                          className="flex-1 p-2 rounded-lg bg-gradient-to-r from-orange-500/80 to-orange-600/80 hover:from-orange-500 hover:to-orange-600 text-white transition-all text-xs font-semibold flex items-center justify-center gap-1 shadow-lg shadow-orange-500/20">
                          <Calendar className="w-3 h-3" /> Start Building
                        </button>
                        <button
                          onClick={() => navigate(createPageUrl('Activity'))}
                          className="flex-1 p-2 rounded-lg bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-500 hover:to-blue-600 text-white transition-all text-xs font-semibold flex items-center justify-center gap-1 shadow-lg shadow-blue-500/20">
                          <TrendingUp className="w-3 h-3" /> Log Workout
                        </button>
                      </div>
                    </div>
                  </Card>
              }
            </div>
          }

          {memberGym?.id &&
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.9 }}
              whileTap={{ scale: 0.97, y: 2 }}
            >
              <Link to={createPageUrl('GymCommunity') + `?id=${memberGym.id}`} className="block">
                <Card className="rounded-xl text-card-foreground bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 hover:border-blue-500/30 transition-all duration-200 cursor-pointer shadow-2xl shadow-black/20 relative h-40 overflow-hidden group">
                  {memberGym?.image_url
                    ? <img src={memberGym.image_url} alt={memberGym.name} className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:opacity-100 transition-opacity" loading="eager" fetchpriority="high" />
                    : <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 opacity-60 group-hover:opacity-70 transition-opacity" />
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />
                  <div className="relative p-6 h-full flex flex-col justify-between">
                    <div>
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.08 }}
                        className="text-white font-semibold text-base tracking-tight">
                        Your Community
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.14 }}
                        className="text-slate-300 text-sm mt-1 font-medium">
                        {memberGym.name}
                      </motion.p>
                    </div>
                    <div className="flex items-center justify-between">
                      <motion.span
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.2 }}
                        className="text-xs text-slate-300 font-medium">
                        {getCommunityText()}
                      </motion.span>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.24 }}
                        className="flex items-center gap-2">
                        <div className="flex items-center -space-x-2">
                          {(checkInUsers.length > 0 ? checkInUsers : [
                            { id: 'demo1', full_name: 'Alex Johnson', avatar_url: null },
                            { id: 'demo2', full_name: 'Sam Wilson', avatar_url: null }
                          ]).slice(0, 2).map((user, idx) =>
                            <motion.div
                              key={user.id}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: 'spring', stiffness: 340, damping: 18, delay: 0.28 + idx * 0.07 }}
                              className="relative">
                              {user.avatar_url
                                ? <img src={user.avatar_url} alt={user.full_name} className="w-6 h-6 rounded-full object-cover border-2 border-slate-700" />
                                : <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-[9px] font-bold border-2 border-slate-700">
                                    {user.full_name?.[0] || 'U'}
                                  </div>
                              }
                            </motion.div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          }

          {/* ── Duolingo-style weekly workout circles ── */}
          {memberGym?.id && (() => {
            const trainingDays = (currentUser?.training_days || []).filter(d => d >= 1 && d <= 7);
            if (trainingDays.length === 0) return null;
            const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
            const logsByDay = {};
            weeklyWorkoutLogs.forEach((l) => {
              const d = new Date(l.completed_date).getDay();
              const dayNum = d === 0 ? 7 : d;
              if (!logsByDay[dayNum]) logsByDay[dayNum] = l;
            });
            const loggedDays = new Set(Object.keys(logsByDay).map(Number));
            const allDays = [1, 2, 3, 4, 5, 6, 7];
            const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const todayDow = new Date().getDay();
            const todayDay = todayDow === 0 ? 7 : todayDow;
            return (
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8, padding: '12px 0', height: 88, overflow: 'visible' }}>
                {allDays.map((day, i) => {
                  const done          = loggedDays.has(day);
                  const bounce        = justLoggedDay === day;
                  const isTodayCircle = day === todayDay;

                  // ── CIRCLE STATE RULES ──
                  // • Logged days                        → blue ✓
                  // • Past rest days                     → green leaf
                  // • Past missed training days          → red ✗
                  // • Days before user joined this week  → grey (shows planned workout on tap)
                  // • Today / future training days       → grey empty circle
                  //
                  // "Before join" days are treated like future days — the user simply
                  // wasn't on the app yet, so they can't have missed anything.

                  // Work out which day-of-week the user joined (1=Mon…7=Sun), if this week.
                  const joinDate = currentUser?.created_date || currentUser?.created_at || null;
                  const mondayThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
                  const joinedThisWeek = joinDate && new Date(joinDate) >= mondayThisWeek;
                  const joinDayNum = joinedThisWeek
                    ? (() => { const d = new Date(joinDate).getDay(); return d === 0 ? 7 : d; })()
                    : null; // null means joined before this week — all past days are fair game

                  const isPast   = day < todayDay;

                  // Days before the user joined this week: treat as "pre-join" (grey, no red)
                  const isPreJoin = joinDayNum !== null && day < joinDayNum;

                  const isInCurrentSplit = trainingDays.includes(day);
                  // Rest day = not in split. Logged days are never rest days.
                  const isRestDay = done ? false : !isInCurrentSplit;

                  // Only show red ✗ for past training days the user could actually have done
                  const isMissed = !isRestDay && !done && isPast && !isPreJoin;
                  const size          = isTodayCircle ? 49 : 40;
                  const verticalOffset = Math.round(Math.sin((i / (allDays.length - 1)) * Math.PI * 2) * 11);
                  const workoutLog    = logsByDay[day];
                  const getBg = () => {
                    if (isRestDay) {
                      return done
                        ? 'linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)'
                        : 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
                    }
                    if (done) return 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)';
                    if (isMissed) return 'linear-gradient(to bottom, #f87171 0%, #ef4444 35%, #b91c1c 100%)';
                    if (isTodayCircle) return 'linear-gradient(to bottom, #334155 0%, #1e293b 50%, #0f172a 100%)';
                    return 'linear-gradient(to bottom, #2d3748 0%, #1e293b 60%, #0f172a 100%)';
                  };
                  const getBorder = () => {
                    if (isRestDay) {
                      return done ? '1px solid rgba(74,222,128,0.5)' : '1px solid rgba(71,85,105,0.7)';
                    }
                    if (done) return '1px solid rgba(147,197,253,0.5)';
                    if (isMissed) return '1px solid rgba(248,113,113,0.5)';
                    if (isTodayCircle) return '1px solid rgba(100,116,139,0.7)';
                    return '1px solid rgba(71,85,105,0.5)';
                  };
                  const getBoxShadow = () => {
                    if (isRestDay && done)
                      return '0 3px 0 0 #15803d, 0 5px 12px rgba(0,80,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.15), inset 0 0 12px rgba(255,255,255,0.04)';
                    if (isRestDay)
                      return '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.25), inset 0 0 10px rgba(255,255,255,0.02)';
                    if (done)
                      return '0 4px 0 0 #1a3fa8, 0 7px 18px rgba(0,0,100,0.55), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 18px rgba(255,255,255,0.06)';
                    if (isMissed)
                      return '0 4px 0 0 #991b1b, 0 7px 18px rgba(180,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 18px rgba(255,255,255,0.06)';
                    if (isTodayCircle)
                      return '0 4px 0 0 #1a2332, 0 7px 16px rgba(30,40,60,0.6), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.3), inset 0 0 14px rgba(255,255,255,0.03)';
                    return '0 4px 0 0 #1a2030, 0 6px 14px rgba(20,30,50,0.55), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.28), inset 0 0 12px rgba(255,255,255,0.03)';
                  };
                  const getAnimation = () => {
                    if (bounce) return 'dayButtonBounce 0.65s cubic-bezier(0.34,1.6,0.64,1) forwards';
                    if (isRestDay || done || isPreJoin) return 'none';
                    return 'dayWiggle 2.4s ease-in-out infinite';
                  };
                  const getPopupLabel = () => {
                    if (isRestDay) return 'Rest Day';
                    if (isMissed) return 'No Workout';
                    // Always use the logged workout name for completed days.
                    if (done && workoutLog) {
                      return workoutLog.workout_name || workoutLog.title || workoutLog.workout_type || workoutLog.name || workoutLog.split_name || 'Workout';
                    }
                    if (done) return 'Workout';
                    // For unlogged days (future OR pre-join), show the planned workout name.
                    const customTypes = currentUser?.custom_workout_types;
                    const splitDay = customTypes
                      ? Array.isArray(customTypes)
                        ? customTypes.find((s) => s.day === day || s.day_of_week === day)
                        : customTypes[day]
                      : null;
                    return splitDay?.name || splitDay?.title || splitDay?.workout_type || DAY_LABELS[i];
                  };
                  return (
                    <div
                      key={day}
                      style={{
                        position: 'relative',
                        width: size,
                        height: size,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 11 + verticalOffset - (isTodayCircle ? 4 : 0),
                        overflow: 'visible',
                      }}>
                      {isTodayCircle && (
                        <div style={{
                          position: 'absolute',
                          width: size + 14,
                          height: size + 14,
                          borderRadius: '50%',
                          border: '3px solid rgba(148,163,184,0.45)',
                          background: 'rgba(148,163,184,0.08)',
                          animation: 'todayRingPulse 2s ease-in-out infinite',
                          pointerEvents: 'none',
                        }} />
                      )}
                      <button
                        data-circle-btn="true"
                        onClick={() => setActiveCircleDay(prev => prev === day ? null : day)}
                        style={{
                          width: size, height: size, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: getBg(), border: getBorder(), boxShadow: getBoxShadow(),
                          transition: 'background 0.4s ease, border 0.4s ease, box-shadow 0.4s ease, width 0.3s ease, height 0.3s ease, transform 0.1s ease',
                          animation: getAnimation(),
                          animationDelay: bounce ? '0s' : `${i * 0.18}s`,
                          willChange: 'transform', cursor: 'pointer', padding: 0, outline: 'none',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92) translateY(2px)'}
                        onMouseUp={e => e.currentTarget.style.transform = ''}
                        onMouseLeave={e => e.currentTarget.style.transform = ''}
                        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.92) translateY(2px)'}
                        onTouchEnd={e => e.currentTarget.style.transform = ''}
                      >
                        {isRestDay
                          ? done
                            ? <svg width={isTodayCircle ? 32 : 26} height={isTodayCircle ? 32 : 26} viewBox="0 0 100 100" fill="none">
                                <line x1="50" y1="95" x2="50" y2="30" stroke="#15803d" strokeWidth="3" strokeLinecap="round"/>
                                <path d="M50 8 C44 20 40 28 42 36 C45 40 55 40 58 36 C60 28 56 20 50 8Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
                                <path d="M50 30 C42 22 32 18 22 22 C20 28 24 36 32 38 C40 40 48 36 50 30Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
                                <path d="M50 30 C58 22 68 18 78 22 C80 28 76 36 68 38 C60 40 52 36 50 30Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
                                <path d="M50 50 C40 42 28 40 16 46 C16 52 22 60 32 60 C42 60 50 54 50 50Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
                                <path d="M50 50 C60 42 72 40 84 46 C84 52 78 60 68 60 C58 60 50 54 50 50Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
                                <line x1="50" y1="30" x2="36" y2="39" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round"/>
                                <line x1="50" y1="30" x2="64" y2="39" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round"/>
                                <line x1="50" y1="50" x2="32" y2="57" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round"/>
                                <line x1="50" y1="50" x2="68" y2="57" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round"/>
                              </svg>
                            : <svg width={isTodayCircle ? 32 : 26} height={isTodayCircle ? 32 : 26} viewBox="0 0 100 100" fill="none">
                                <line x1="50" y1="95" x2="50" y2="30" stroke="rgba(148,163,184,0.35)" strokeWidth="3" strokeLinecap="round"/>
                                <path d="M50 8 C44 20 40 28 42 36 C45 40 55 40 58 36 C60 28 56 20 50 8Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5"/>
                                <path d="M50 30 C42 22 32 18 22 22 C20 28 24 36 32 38 C40 40 48 36 50 30Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5"/>
                                <path d="M50 30 C58 22 68 18 78 22 C80 28 76 36 68 38 C60 40 52 36 50 30Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5"/>
                                <path d="M50 50 C40 42 28 40 16 46 C16 52 22 60 32 60 C42 60 50 54 50 50Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5"/>
                                <path d="M50 50 C60 42 72 40 84 46 C84 52 78 60 68 60 C58 60 50 54 50 50Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5"/>
                                <line x1="50" y1="30" x2="36" y2="39" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
                                <line x1="50" y1="30" x2="64" y2="39" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
                                <line x1="50" y1="50" x2="32" y2="57" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
                                <line x1="50" y1="50" x2="68" y2="57" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
                              </svg>
                          : done
                            ? <svg width={isTodayCircle ? 20 : 16} height={isTodayCircle ? 20 : 16} viewBox="0 0 20 20" fill="none">
                                <path d="M4 10.5l4.5 4.5 7.5-9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            : isMissed
                              ? <svg width={isTodayCircle ? 18 : 14} height={isTodayCircle ? 18 : 14} viewBox="0 0 20 20" fill="none">
                                  <path d="M5 5l10 10M15 5L5 15" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round"/>
                                </svg>
                              : <div style={{
                                  width: isTodayCircle ? 18 : 14, height: isTodayCircle ? 18 : 14,
                                  borderRadius: '50%',
                                  border: isTodayCircle ? '2px solid rgba(148,163,184,0.6)' : '2px solid rgba(100,116,139,0.35)',
                                  background: isTodayCircle ? 'rgba(255,255,255,0.05)' : 'transparent',
                                  boxShadow: isTodayCircle ? 'inset 0 1px 3px rgba(0,0,0,0.4)' : 'none',
                                }} />
                        }
                      </button>
                      <AnimatePresence>
                        {activeCircleDay === day && (() => {
                          const BUBBLE_W = 274;
                          const BUBBLE_H = done && !isRestDay ? 100 : 64;
                          const ARROW_H = 7;
                          const ARROW_W = 13;
                          const RADIUS = 14;
                          const SVG_H = BUBBLE_H + ARROW_H;
                          const SLOT = size + 8;
                          const circleCenterInRow = i * SLOT + size / 2;
                          const rowWidth = 7 * SLOT - 8;
                          const idealBubbleLeft = circleCenterInRow - BUBBLE_W / 2;
                          const clampedBubbleLeft = Math.max(0, Math.min(idealBubbleLeft, rowWidth - BUBBLE_W));
                          const bubbleOffsetFromCircle = clampedBubbleLeft - i * SLOT;
                          const arrowInBubble = circleCenterInRow - clampedBubbleLeft;
                          const arrowTip = Math.max(RADIUS + ARROW_W / 2 + 2, Math.min(arrowInBubble, BUBBLE_W - RADIUS - ARROW_W / 2 - 2));
                          const arrowL = arrowTip - ARROW_W / 2;
                          const arrowR = arrowTip + ARROW_W / 2;
                          const solidColor = isRestDay && done ? '#16a34a' : isRestDay ? '#1e2535' : done ? '#3b82f6' : isMissed ? '#dc2626' : isTodayCircle ? '#263244' : '#1e2535';
                          const path = [
                            `M ${RADIUS} ${ARROW_H}`, `L ${arrowL} ${ARROW_H}`, `L ${arrowTip} 0`,
                            `L ${arrowR} ${ARROW_H}`, `L ${BUBBLE_W - RADIUS} ${ARROW_H}`,
                            `Q ${BUBBLE_W} ${ARROW_H} ${BUBBLE_W} ${ARROW_H + RADIUS}`,
                            `L ${BUBBLE_W} ${SVG_H - RADIUS}`, `Q ${BUBBLE_W} ${SVG_H} ${BUBBLE_W - RADIUS} ${SVG_H}`,
                            `L ${RADIUS} ${SVG_H}`, `Q 0 ${SVG_H} 0 ${SVG_H - RADIUS}`,
                            `L 0 ${ARROW_H + RADIUS}`, `Q 0 ${ARROW_H} ${RADIUS} ${ARROW_H}`, `Z`
                          ].join(' ');
                          return (
                            <motion.div
                              initial={{ opacity: 0, scaleY: 0, scaleX: 0.75 }}
                              animate={{ opacity: 1, scaleY: 1, scaleX: 1 }}
                              exit={{ opacity: 0, scaleY: 0, scaleX: 0.75 }}
                              transition={{ duration: 0.32, ease: [0.34, 1.3, 0.64, 1] }}
                              style={{
                                position: 'absolute', top: size + 2, left: bubbleOffsetFromCircle,
                                width: BUBBLE_W, height: SVG_H, zIndex: 200, pointerEvents: 'auto',
                                transformOrigin: `${arrowTip}px top`,
                              }}>
                              <svg width={BUBBLE_W} height={SVG_H} style={{ position: 'absolute', top: 0, left: 0 }}>
                                <path d={path} fill={solidColor} />
                              </svg>
                              <div style={{
                                position: 'absolute', top: ARROW_H + 10, left: 14, right: 14, bottom: 10,
                                display: 'flex', flexDirection: 'column', gap: 2,
                              }}>
                                <span style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', letterSpacing: '0.01em', lineHeight: 1.2, textShadow: '0 1px 3px rgba(0,0,0,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {getPopupLabel()}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.03em', lineHeight: 1 }}>
                                  {done && workoutLog?.completed_date
                                    ? new Date(workoutLog.completed_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
                                    : (() => {
                                        const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
                                        const slotDate = new Date(monday);
                                        slotDate.setDate(monday.getDate() + (day - 1));
                                        return slotDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
                                      })()
                                  }
                                </span>
                                {done && !isRestDay && workoutLog && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setActiveCircleDay(null);
                                      try {
                                        const logs = await base44.entities.WorkoutLog.filter({ id: workoutLog.id });
                                        setSummaryLog(logs[0] || workoutLog);
                                      } catch { setSummaryLog(workoutLog); }
                                    }}
                                    onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
                                    onMouseUp={e => e.currentTarget.style.transform = ''}
                                    onMouseLeave={e => e.currentTarget.style.transform = ''}
                                    onTouchStart={e => e.currentTarget.style.transform = 'translateY(2px)'}
                                    onTouchEnd={e => e.currentTarget.style.transform = ''}
                                    style={{
                                      marginTop: 8, width: '100%', padding: '7px 0', borderRadius: 9,
                                      background: 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 40%, #2563eb 100%)',
                                      border: 'none', borderBottom: '3px solid #1d4ed8',
                                      color: '#ffffff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                                      letterSpacing: '0.03em', textAlign: 'center',
                                      boxShadow: '0 4px 12px rgba(37,99,235,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
                                      transition: 'transform 0.1s ease', WebkitTapHighlightColor: 'transparent',
                                    }}>
                                    View Summary
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {memberGym?.id && <QuoteCarousel />}
          {gymMemberships.length === 0 && currentUser?.account_type !== 'gym_owner' &&
            <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 border-0 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-white text-base mb-1 tracking-tight">Ready to Transform?</h3>
                  <p className="text-blue-100 text-xs font-medium">Join a gym and build your winning streak today</p>
                </div>
                <Link to={createPageUrl('Gyms')}>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">Find Your Gym</Button>
                </Link>
              </div>
            </Card>
          }
        </div>
      </div>

      {/* STAGE 1 — Streak animation */}
      <AnimatePresence>
        {showStreakCelebration &&
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <div id="streak-anim-stage" style={{ position: 'relative', width: 180, height: 180, filter: 'drop-shadow(0 0 28px rgba(249,115,22,0.7))', opacity: 0, willChange: 'transform, opacity, filter' }}>
                <img id="streak-anim-p1" src={POSE_1_URL} alt="streak pose 1" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 1 }} />
                <img id="streak-anim-p2" src={POSE_2_URL} alt="streak pose 2" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 0, willChange: 'transform, opacity' }} />
              </div>
              <div id="streak-anim-num" style={{ fontSize: 120, fontWeight: 900, color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.8)', letterSpacing: '-0.04em', lineHeight: 1, opacity: 0, transform: 'scale(0.5)' }}>
                {celebrationStreakNum - 1}
              </div>
              <div id="streak-anim-lbl" style={{ display: 'none' }} />
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* STAGE 2 — Challenges */}
      <AnimatePresence>
        {showChallengesCelebration && celebrationChallenges.length > 0 &&
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }} className="w-full max-w-sm space-y-8">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-2xl font-black text-white text-center tracking-tight">
                Challenge Progress
              </motion.p>
              <div className="space-y-6">
                {celebrationChallenges.map((challenge, idx) =>
                  <motion.div key={challenge.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + idx * 0.15 }} className="space-y-3">
                    <p className="text-base font-bold text-slate-200 truncate">{challenge.title}</p>
                    <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                        initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ delay: 0.5 + idx * 0.15, duration: 1.4, ease: 'easeOut' }} />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>

      {/* STAGE 3 — Share Workout */}
      <AnimatePresence>
        {showShareWorkout && (
          <ShareWorkoutScreen
            workoutName={celebrationWorkoutName}
            exercises={celebrationExercises}
            currentUser={currentUser}
            onContinue={() => {
              setShowShareWorkout(false);
              setTimeout(() => setJustLoggedDay(null), 1500);
            }}
          />
        )}
      </AnimatePresence>

      <StreakVariantPicker isOpen={showStreakVariants} onClose={() => setShowStreakVariants(false)} onSelect={handleStreakVariantSelect} selectedVariant={streakVariant} streakFreezes={currentUser?.streak_freezes || 0} />
      <JoinWithCodeModal open={showJoinModal} onClose={() => setShowJoinModal(false)} currentUser={currentUser} />
      <CreateSplitModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} currentUser={currentUser} />

      {/* Workout Summary Modal */}
      <AnimatePresence>
        {summaryLog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSummaryLog(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 32px 0' }}>
            <motion.div
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'linear-gradient(to bottom, #1e293b, #0f172a)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 20, padding: '24px 20px', width: 'calc(100% - 32px)', maxWidth: 480, maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
                    {summaryLog.workout_name || summaryLog.title || summaryLog.workout_type || 'Workout'}
                  </p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0', fontWeight: 500 }}>
                    {summaryLog.completed_date ? new Date(summaryLog.completed_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                  </p>
                </div>
                <button onClick={() => setSummaryLog(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', fontSize: 18, fontWeight: 700 }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Duration', value: summaryLog.duration_minutes ? `${summaryLog.duration_minutes}m` : '—' },
                  { label: 'Exercises', value: summaryLog.exercises?.length || summaryLog.exercise_count || '—' },
                  { label: 'Volume', value: summaryLog.total_volume ? `${summaryLog.total_volume}kg` : '—' },
                ].map(stat => (
                  <div key={stat.label} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#93c5fd', margin: 0 }}>{stat.value}</p>
                    <p style={{ fontSize: 10, color: '#64748b', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
              {summaryLog.exercises?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Exercises</p>
                  {summaryLog.exercises.map((ex, idx) => {
                    const exName = ex.name || ex.exercise_name || ex.title || `Exercise ${idx + 1}`;
                    const setsArr = Array.isArray(ex.sets) ? ex.sets : null;
                    const flatDetail = !setsArr && (ex.sets || ex.reps || ex.weight_kg || ex.weight)
                      ? [ex.sets && `${ex.sets} sets`, ex.reps && `${ex.reps} reps`, (ex.weight_kg || ex.weight) && `${ex.weight_kg || ex.weight}kg`].filter(Boolean).join(' · ')
                      : null;
                    return (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{exName}</p>
                        {setsArr && setsArr.length > 0 && (
                          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {setsArr.map((s, si) => (
                              <p key={si} style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 500 }}>
                                Set {si + 1}: {[s.reps && `${s.reps} reps`, (s.weight_kg || s.weight) && `${s.weight_kg || s.weight}kg`, s.duration_seconds && `${s.duration_seconds}s`].filter(Boolean).join(' · ')}
                              </p>
                            ))}
                          </div>
                        )}
                        {flatDetail && <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0', fontWeight: 500 }}>{flatDetail}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
              {summaryLog.notes && (
                <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Notes</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{summaryLog.notes}</p>
                </div>
              )}
              {!summaryLog.exercises?.length && !summaryLog.notes && !summaryLog.duration_minutes && (
                <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 8 }}>No additional details recorded for this workout.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PullToRefresh>
  );
}