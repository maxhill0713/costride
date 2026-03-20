import React, { useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '../components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, TrendingUp, Calendar, ChevronRight, UserPlus, Users, Search, MoreVertical, X, CheckCircle, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import FriendsIcon from '../components/FriendsIcon';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import TodayWorkout from '../components/profile/TodayWorkout';
import StreakVariantPicker from '../components/StreakVariantPicker';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import QuoteCarousel from '../components/home/QuoteCarousel';
import ShareWorkoutScreen from '../components/profile/ShareWorkoutScreen';
import PostCard from '../components/feed/PostCard';
import WorkoutDaysCelebration from '../components/home/WorkoutDaysCelebration';
import { useState } from 'react';
import { isToday, differenceInDays, startOfWeek, startOfDay, formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const POSE_1_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';
const POSE_2_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/d3b5d0add_STREAKICON29.png';

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

function CheckInButton({ gym, onCheckInSuccess }) {
  const queryClient = useQueryClient();
  const [pressed, setPressed] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ripples, setRipples] = useState([]);
  const btnRef = useRef(null);
  const rippleId = useRef(0);

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.CheckIn.create({
        user_id: me.id,
        user_name: me.full_name,
        gym_id: gym.id,
        gym_name: gym.name,
        check_in_date: new Date().toISOString(),
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
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
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
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 18,
        background: isSuccess ? '#15803d' : '#1a3fa8',
        transform: 'translateY(5px)',
      }} />
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
          boxShadow: pressed ? 'none' :
            isSuccess ?
            '0 5px 0 0 #15803d, 0 8px 24px rgba(22,163,74,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' :
            '0 5px 0 0 #1a3fa8, 0 8px 28px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          background: isSuccess ?
            'linear-gradient(to bottom, #4ade80, #22c55e 40%, #16a34a)' :
            isLoading ?
            'linear-gradient(to bottom, #5b9ff5, #3b82f6 40%, #2563eb)' :
            'linear-gradient(to bottom, #60a5fa, #3b82f6 40%, #2563eb)',
        }}>
        {ripples.map((r) => (
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

function playTone(ctx, freq, startTime, duration, gainVal, type = 'sine') {
  const osc = ctx.createOscillator();
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
  const osc = ctx.createOscillator();
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
  playTone(ctx, 900, now, 0.08, 0.18);
  playTone(ctx, 1100, now + 0.04, 0.07, 0.12);
}
function soundPoseSwap(ctx) {
  const now = ctx.currentTime;
  [[659, 0], [784, 0.10], [1047, 0.20]].forEach(([freq, t]) => {
    playTone(ctx, freq, now + t, 0.25, 0.28);
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
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.3);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
  osc.start(now); osc.stop(now + 0.35);
}

const STREAK_KEYFRAMES = `
  @keyframes streakBounceIn {
    0%   { transform: scale(0.4) translateY(40px); opacity: 0; }
    55%  { transform: scale(1.12) translateY(-8px); opacity: 1; }
    75%  { transform: scale(0.95) translateY(2px); }
    88%  { transform: scale(1.04) translateY(0); }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes streakNumPop {
    0%   { transform: scale(0.3); opacity: 0; }
    55%  { transform: scale(1.18); opacity: 1; }
    75%  { transform: scale(0.93); }
    88%  { transform: scale(1.06); }
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
    0%   { transform: scale(0.3); }
    50%  { transform: scale(1.22); }
    68%  { transform: scale(0.92); }
    82%  { transform: scale(1.08); }
    92%  { transform: scale(0.97); }
    100% { transform: scale(1); }
  }
  @keyframes streakGlowPulse {
    0%,100% { filter: drop-shadow(0 0 18px rgba(249,115,22,0.6)); }
    50%      { filter: drop-shadow(0 0 44px rgba(249,115,22,1)); }
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

function trigAnim(el, name, dur, easing) {
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = `${name} ${dur}ms ${easing} forwards`;
}
function spawnParticles() {
  const cols = ['#f97316', '#fb923c', '#fbbf24', '#ef4444', '#ffffff', '#fdba74'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    const ang = i / 18 * 360;
    const d = 70 + Math.random() * 70;
    const tx = Math.cos(ang * Math.PI / 180) * d;
    const ty = Math.sin(ang * Math.PI / 180) * d;
    const sz = 5 + Math.random() * 7;
    p.style.cssText = [
      'position:fixed', 'border-radius:50%', 'pointer-events:none', 'z-index:9999',
      `width:${sz}px`, `height:${sz}px`,
      `left:calc(50% - ${sz / 2}px)`, `top:36%`,
      `background:${cols[i % cols.length]}`,
      `--tx:${tx}px`, `--ty:${ty}px`,
      `animation:streakParticleBurst ${0.7 + Math.random() * 0.35}s ease-out forwards`,
      `animation-delay:${Math.random() * 0.05}s`,
    ].join(';');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}
function runStreakAnimation(newStreak, audioCtxRef, celebTimers) {
  const stage = document.getElementById('streak-anim-stage');
  const p1 = document.getElementById('streak-anim-p1');
  const p2 = document.getElementById('streak-anim-p2');
  const num = document.getElementById('streak-anim-num');
  const lbl = document.getElementById('streak-anim-lbl');
  if (!stage || !p1 || !p2 || !num || !lbl) return;
  const actx = audioCtxRef.current;

  // ── Stage bounces in with a snappy Duolingo-style overshoot ──────────────
  if (actx) soundBounceIn(actx);
  trigAnim(stage, 'streakBounceIn', 600, 'cubic-bezier(0.34,1.5,0.64,1)');

  // ── Number pops in below icon shortly after ───────────────────────────────
  const t1 = setTimeout(() => {
    if (actx) soundNumPop(actx);
    trigAnim(num, 'streakNumPop', 420, 'cubic-bezier(0.34,1.6,0.64,1)');
  }, 500);

  // ── Quick wind-up before pose swap ────────────────────────────────────────
  const t2 = setTimeout(() => {
    stage.style.opacity = '1';
    trigAnim(stage, 'streakWindup', 280, 'ease-in-out');
  }, 1300);

  // ── Pose swap with hard rubber-band + immediate number update ────────────
  const t3 = setTimeout(() => {
    if (actx) soundPoseSwap(actx);
    p1.style.display = 'none';
    p2.style.display = 'block';
    p2.style.opacity = '1';
    void p2.offsetWidth;
    // Harder overshoot — Duolingo-style thunk
    p2.style.animation = 'streakIconPop 480ms cubic-bezier(0.34,1.8,0.64,1) forwards';
    // Number updates immediately on the thunk
    if (actx) soundNumPop(actx);
    if (navigator.vibrate) navigator.vibrate([40, 60, 80]);
    num.textContent = String(newStreak);
    trigAnim(num, 'streakNumPop', 380, 'cubic-bezier(0.34,1.8,0.64,1)');
  }, 1580);

  // ── Transition out sound ──────────────────────────────────────────────────
  const t4 = setTimeout(() => {
    if (actx) soundTransition(actx);
  }, 2800);

  celebTimers.current = [t1, t2, t3, t4];
}

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showStreakVariants, setShowStreakVariants] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [confirmRemoveFriend, setConfirmRemoveFriend] = useState(null);
  const [friendMenuOpen, setFriendMenuOpen] = useState(null);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendsListSearchQuery, setFriendsListSearchQuery] = useState('');
  const [dismissedCardIds, setDismissedCardIds] = useState(() => {
    try { const s = localStorage.getItem('friendsFeedDismissedCards'); return new Set(s ? JSON.parse(s) : []); }
    catch { return new Set(); }
  });
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [workoutOverrideDay, setWorkoutOverrideDay] = useState(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showChallengesCelebration, setShowChallengesCelebration] = useState(false);
  const [showShareWorkout, setShowShareWorkout] = useState(false);
  const [showDaysCelebration, setShowDaysCelebration] = useState(false); // ← Stage 4
  const [celebrationStreakNum, setCelebrationStreakNum] = useState(0);
  const [celebrationChallenges, setCelebrationChallenges] = useState([]);
  const [celebrationExercises, setCelebrationExercises] = useState([]);
  const [celebrationWorkoutName, setCelebrationWorkoutName] = useState('');
  const [celebrationPreviousExercises, setCelebrationPreviousExercises] = useState([]);
  const [justLoggedDay, setJustLoggedDay] = useState(null);
  const [activeCircleDay, setActiveCircleDay] = useState(null);
  const [bubblePos, setBubblePos] = useState(null);
  const [summaryLog, setSummaryLog] = useState(null);
  const [viewWorkoutDay, setViewWorkoutDay] = useState(null);
  const [pressedDay, setPressedDay] = useState(null);
  const audioCtxRef = useRef(null);
  const celebTimers = useRef([]);

  const [stickyHeaderVisible, setStickyHeaderVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const spacer = document.getElementById('home-header-spacer');
      const spacerH = spacer ? spacer.offsetHeight : 52;
      const atTop = currentY <= 4;

      setIsAtTop(atTop);

      if (atTop) {
        // Always show at top
        setStickyHeaderVisible(true);
      } else if (currentY <= spacerH) {
        // In the ghost spacer zone — keep visible
        setStickyHeaderVisible(true);
      } else {
        const delta = lastScrollY.current - currentY;
        if (delta > 0) {
          // Scrolling up — show
          setStickyHeaderVisible(true);
        } else if (delta < -6) {
          // Scrolling down past threshold — hide
          setStickyHeaderVisible(false);
        }
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    injectStreakStyles();
    injectCheckInStyles();
  }, []);

  useEffect(() => {
    return () => { celebTimers.current.forEach(clearTimeout); };
  }, []);

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try { return await base44.auth.me(); }
      catch (error) { console.error('Auth error:', error); return null; }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const primaryGymIdForQuery = currentUser?.primary_gym_id || (gymMemberships.length > 0 ? gymMemberships[0]?.gym_id : null);
  const { data: memberGymData } = useQuery({
    queryKey: ['gym', primaryGymIdForQuery],
    queryFn: () => base44.entities.Gym.filter({ id: primaryGymIdForQuery }).then((r) => r[0] || null),
    enabled: !!primaryGymIdForQuery,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser?.id }, '-check_in_date', 100),
    enabled: !!currentUser,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser?.id }, '-created_date', 5),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 10000,
    placeholderData: (prev) => prev,
  });
  const { data: friends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const friendIdList = friends.map((f) => f.friend_id);
  const { data: allPosts = [] } = useQuery({
    queryKey: ['friendPosts', currentUser?.id],
    queryFn: () => base44.entities.Post.filter({ is_system_generated: false }, '-created_date', 30),
    enabled: !!currentUser && friends.length > 0,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const { data: friendRequests = [] } = useQuery({
    queryKey: ['friendRequests', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ friend_id: currentUser.id, status: 'pending' }),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const knownUserIds = [...friends.map(f => f.friend_id), ...friendRequests.map(r => r.user_id)];
  const { data: friendUsersList = [] } = useQuery({
    queryKey: ['friendUsers', knownUserIds.join(',')],
    queryFn: async () => {
      if (knownUserIds.length === 0) return [];
      const results = await Promise.all(knownUserIds.map(id => base44.entities.User.filter({ id }).then(r => r[0]).catch(() => null)));
      return results.filter(Boolean);
    },
    enabled: (showFriendsModal || showAddFriendModal) && knownUserIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: allRecentCheckIns = [] } = useQuery({
    queryKey: ['checkIns', 'recent90'],
    queryFn: () => base44.entities.CheckIn.filter({ check_in_date: { $gte: ninetyDaysAgo } }, '-check_in_date', 1000),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const sevenDaysAgoLifts = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentLifts = [] } = useQuery({
    queryKey: ['recentLifts', 'friends'],
    queryFn: () => base44.entities.Lift.filter({ is_pr: true, created_date: { $gte: sevenDaysAgoLifts } }, '-created_date', 50),
    enabled: !!currentUser && friends.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['searchUsers', friendSearchQuery],
    queryFn: () => base44.functions.invoke('searchUsers', { query: friendSearchQuery, searchBy: 'username', limit: 5 }).then(res => res.data.users || []),
    enabled: friendSearchQuery.length >= 2,
    staleTime: 30000,
  });

  const addFriendMutation = useMutation({
    mutationFn: (friendUser) => base44.functions.invoke('manageFriendship', { friendId: friendUser.id, action: 'add' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['friends'] }); setShowAddFriendModal(false); setFriendSearchQuery(''); },
  });
  const acceptFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', { friendId, action: 'accept' }),
    onSuccess: () => { queryClient.invalidateQueries(['friendRequests']); queryClient.invalidateQueries(['friends']); },
  });
  const rejectFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', { friendId, action: 'reject' }),
    onSuccess: () => queryClient.invalidateQueries(['friendRequests']),
  });
  const removeFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', { friendId, action: 'remove' }),
    onSuccess: () => queryClient.invalidateQueries(['friends']),
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
    gcTime: 5 * 60 * 1000,
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
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollY = 0;
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
    !post.is_hidden &&
    !post.content?.includes('well done') &&
    !post.content?.includes('workout finished')
  );
  const userStreak = currentUser?.current_streak || 0;
  const streakVariant = currentUser?.streak_variant || 'default';

  const effectiveToday = (() => {
    const now = new Date();
    if (now.getHours() < 3) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
  })();
  const todayDowAdjusted = (() => { const d = new Date().getDay(); return d === 0 ? 7 : d; })();
  const workoutLoggedToday = weeklyWorkoutLogs.some(log => log.completed_date === effectiveToday) || justLoggedDay === todayDowAdjusted;

  const todayIsRestDay = !(currentUser?.training_days || []).includes(todayDowAdjusted);
  const showCheckInButton = !todayIsRestDay || workoutOverrideDay !== null;

  const calculateFriendStreak = (checkIns) => {
    if (checkIns.length === 0) return 0;
    const today = startOfDay(new Date());
    const lastCI = startOfDay(new Date(checkIns[0].check_in_date));
    if (differenceInDays(today, lastCI) > 1) return 0;
    let streak = 1;
    for (let i = 0; i < checkIns.length - 1; i++) {
      const cur = startOfDay(new Date(checkIns[i].check_in_date));
      const nxt = startOfDay(new Date(checkIns[i + 1].check_in_date));
      const diff = differenceInDays(cur, nxt);
      if (diff === 1 || diff === 2) streak++; else break;
    }
    return streak;
  };

  const friendsWithActivity = friends.map(friend => {
    const friendCheckIns = allRecentCheckIns.filter(c => c.user_id === friend.friend_id);
    const lastCI = friendCheckIns.length > 0 ? friendCheckIns[0] : null;
    return {
      ...friend,
      activity: {
        checkIns: friendCheckIns,
        streak: calculateFriendStreak(friendCheckIns),
        lastCheckIn: lastCI,
        daysSinceCheckIn: lastCI ? differenceInDays(new Date(), new Date(lastCI.check_in_date)) : null,
        totalCheckIns: friendCheckIns.length,
      }
    };
  }).sort((a, b) => {
    if (a.activity.daysSinceCheckIn === 0 && b.activity.daysSinceCheckIn !== 0) return -1;
    if (a.activity.daysSinceCheckIn !== 0 && b.activity.daysSinceCheckIn === 0) return 1;
    return (b.activity.streak || 0) - (a.activity.streak || 0);
  });

  const socialFeedPosts = allPosts.filter(post =>
    (friendIdList.includes(post.member_id) || post.member_id === currentUser?.id) &&
    (post.content || post.image_url || post.video_url || post.workout_name) &&
    !post.gym_join &&
    !post.is_hidden
  );

  const activityFeed = (() => {
    const activities = [];
    const friendPRs = recentLifts.filter(l => l.is_pr && friendIdList.includes(l.member_id));
    const exerciseNames = { bench_press:'Bench Press', squat:'Squat', deadlift:'Deadlift', overhead_press:'Overhead Press', barbell_row:'Barbell Row', power_clean:'Power Clean' };
    friendPRs.forEach(lift => {
      const friend = friends.find(f => f.friend_id === lift.member_id);
      if (differenceInDays(new Date(), new Date(lift.created_date)) <= 7) {
        activities.push({ id:`pr-${lift.id}`, type:'pr', friendId:lift.member_id, friendName:friend?.friend_name||lift.member_name, friendAvatar:friend?.friend_avatar, message:`hit a new PR: ${lift.weight_lbs}lbs ${exerciseNames[lift.exercise]||lift.exercise}`, timestamp:new Date(lift.created_date), emoji:'🏆' });
      }
    });
    notifications.forEach(n => {
      const text = (n.message||n.title||'').toLowerCase();
      if (differenceInDays(new Date(), new Date(n.created_date)) <= 7 && !text.includes('accepted') && !text.includes('friend request') && !text.includes('official') && !text.includes('gym request')) {
        activities.push({ id:`notif-${n.id}`, type:'notification', message:n.message||n.title, timestamp:new Date(n.created_date) });
      }
    });
    return activities.sort((a,b) => b.timestamp - a.timestamp);
  })();

  const activityCards = (() => {
    const cards = [];
    const lastCI = allCheckIns.filter(c => c.user_id === currentUser?.id)[0];
    const daysSince = lastCI ? differenceInDays(new Date(), new Date(lastCI.check_in_date)) : null;
    if (daysSince && daysSince >= 3) cards.push({ id:'nudge-checkin', type:'nudge', title:'Time to Check In', message:`You haven't checked in in ${daysSince} days. Let's get back on track! 💪`, emoji:'⏰' });
    friendsWithActivity.forEach(friend => {
      if (friend.activity.daysSinceCheckIn >= 7) cards.push({ id:`inactive-${friend.friend_id}`, type:'friend-inactive', title:`${friend.friend_name} Needs a Nudge`, message:`${friend.friend_name} hasn't checked in for ${friend.activity.daysSinceCheckIn} days.`, emoji:'👋' });
    });
    if (lastCI && daysSince === 1) cards.push({ id:'streak-danger', type:'streak-warning', title:'Your Streak is at Risk!', message:'You have until midnight to check in and keep your streak alive! ⚠️', emoji:'⚠️' });
    return cards;
  })();

  const filteredActivityCards = activityCards.filter(c => !dismissedCardIds.has(c.id));
  const filteredSearchResults = searchResults.filter(u => !friendIdList.includes(u.id));

  const dismissCard = (id) => {
    const updated = new Set(dismissedCardIds).add(id);
    setDismissedCardIds(updated);
    localStorage.setItem('friendsFeedDismissedCards', JSON.stringify(Array.from(updated)));
  };

  const handleWorkoutLogged = async (challengesData = [], exercises = [], workoutName = '', previousExercises = []) => {
    const todayDow = new Date().getDay();
    const todayAdjusted = todayDow === 0 ? 7 : todayDow;
    setJustLoggedDay(todayAdjusted);
    setWorkoutStartTime(null);
    await queryClient.invalidateQueries({ queryKey: ['checkIns', currentUser?.id] });
    await queryClient.invalidateQueries({ queryKey: ['weeklyWorkoutLogs', currentUser?.id] });
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const freshUser = queryClient.getQueryData(['currentUser']);
    const newStreak = freshUser?.current_streak || userStreak + 1;
    setCelebrationStreakNum(newStreak);
    setCelebrationChallenges(challengesData);
    setCelebrationExercises(exercises);
    setCelebrationWorkoutName(workoutName);
    setCelebrationPreviousExercises(previousExercises);
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

  const getCommunityText = () => {
    const dayOfMonth = new Date().getDate();
    const todayCount = todayCheckInsForQuery.length;
    const messages = [
      `Join ${todayCount} other${todayCount === 1 ? '' : 's'} training today`,
      `${todayCount} members crushing it right now`,
      `See who's at the gym today—${todayCount} members active`,
      `${todayCount} gym warriors training today`,
      `Join ${todayCount} member${todayCount === 1 ? '' : 's'} on the floor`,
    ];
    return todayCount > 0 ? messages[dayOfMonth % messages.length] : 'Members training together daily';
  };

  const viewSummaryBtnStyle = {
    marginTop: 4, width: '100%',
    padding: '7px 0',
    borderRadius: 9,
    background: 'linear-gradient(to bottom, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)',
    border: 'none', borderBottom: '3px solid #1e40af',
    color: '#ffffff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
    letterSpacing: '0.03em', textAlign: 'center',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
    transition: 'transform 0.1s ease', WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };
  const viewWorkoutBtnStyle = {
    marginTop: 10, width: '100%',
    padding: '8px 0',
    borderRadius: 9,
    background: 'linear-gradient(to bottom, #1e2430 0%, #141820 60%, #0d1017 100%)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderBottom: '3px solid rgba(0,0,0,0.5)',
    color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
    letterSpacing: '0.04em', textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
    transition: 'transform 0.08s ease, box-shadow 0.08s ease',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };
  const modalPanelClass = "w-full max-w-sm bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white p-6 max-h-[80vh] overflow-y-auto";

  const HeaderContent = ({ compact = false }) => (
    <div className={`max-w-4xl mx-auto flex items-center justify-center relative px-4 ${compact ? 'py-0' : ''}`}>
      <button
        onClick={() => setShowStreakVariants(true)}
        className="flex items-center hover:opacity-80 transition-opacity absolute left-0 top-1/2 -translate-y-1/2 p-2 -ml-2" style={{ marginTop: '2px' }}>
        <img
          src={POSE_1_URL}
          alt="streak"
          className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} animate-[breathe_3s_ease-in-out_infinite]`}
          style={{ objectFit: 'contain', opacity: 1 }} />
        <span
          className={`font-black ${compact ? 'text-lg -ml-1.5 mt-2' : 'text-xl -ml-2 mt-3'} select-none`}
          style={{
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(0,0,0,0.9)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
          {userStreak}
        </span>
      </button>
      <h1 className={`${compact ? 'text-lg' : 'text-xl'} font-black bg-gradient-to-r from-blue-600 to-blue-300 bg-clip-text text-transparent tracking-tight`}>
        CoStride
      </h1>
      <button
        onClick={() => setShowFriendsModal(true)}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 -mr-2 text-white/70 hover:text-white active:scale-90 active:opacity-60 transition-all duration-100 transform-gpu">
        <Users className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
      </button>
    </div>
  );

  return (
    <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries(); }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">

        <div
          className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out"
          style={{
            transform: stickyHeaderVisible ? 'translateY(0)' : 'translateY(-110%)',
            background: isAtTop
              ? 'linear-gradient(to bottom, rgba(30,41,59,0.4), transparent)'
              : 'rgba(15, 23, 42, 0.85)',
            backdropFilter: isAtTop ? 'none' : 'blur(16px)',
            WebkitBackdropFilter: isAtTop ? 'none' : 'blur(16px)',
            borderBottom: isAtTop ? 'none' : '1px solid rgba(255,255,255,0.07)',
            paddingTop: 'env(safe-area-inset-top)',
            transition: 'transform 300ms ease-out, background 200ms ease, border-color 200ms ease',
          }}>
          <div className="px-4 py-2.5">
            <HeaderContent compact={true} />
          </div>
        </div>

        {/* Ghost spacer — same height as the fixed header so content starts below it */}
        <div id="home-header-spacer" className="px-4 py-2.5 opacity-0 pointer-events-none" aria-hidden="true">
          <HeaderContent compact={true} />
        </div>

        <div className={`max-w-4xl mx-auto px-4 py-2 pb-32 ${daysSinceCheckIn === 0 ? 'space-y-2' : 'space-y-3'}`}>
          {memberGym && (
            <>
              {showCheckInButton && !userCheckIns.some((c) => isToday(new Date(c.check_in_date))) && (
                <CheckInButton
                  gym={memberGym}
                  onCheckInSuccess={() => setWorkoutStartTime(Date.now())} />
              )}
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex items-center -space-x-2">
                  {(() => {
                    const friendCheckInUsers = checkInUsers.filter((u) => friendIdList.includes(u.id));
                    const displayedUsers = friendCheckInUsers.slice(0, 5);
                    const remainingCount = Math.max(0, friendCheckInUsers.length - 5);
                    return (
                      <>
                        {displayedUsers.map((user) => (
                          <div key={user.id} className="relative group">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover border-2 border-green-700" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold border-2 border-green-700">
                                {user.full_name?.[0] || 'U'}
                              </div>
                            )}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {user.full_name}
                            </span>
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-500">
                            +{remainingCount}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}

          {memberGym && (
            <div className="space-y-3">
              {currentUser?.custom_workout_types ? (
                <TodayWorkout
                  currentUser={currentUser}
                  workoutStartTime={workoutStartTime}
                  onWorkoutStart={() => setWorkoutStartTime(Date.now())}
                  onWorkoutLogged={handleWorkoutLogged}
                  onOverrideDayChange={setWorkoutOverrideDay} />
              ) : (
                <Card className="rounded-xl p-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                  <div className="relative space-y-2">
                    <h3 className="text-[11px] font-bold text-slate-100 tracking-tight uppercase">Create Workout Split</h3>
                    <button
                      onClick={() => setShowSplitModal(true)}
                      className="w-full p-2 rounded-lg bg-gradient-to-b from-orange-500 via-orange-600 to-orange-700 text-white font-semibold text-xs flex items-center justify-center border border-transparent shadow-[0_3px_0_0_#92400e,0_8px_20px_rgba(200,100,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                      Start Building
                    </button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {memberGym?.id && (
            <motion.div whileTap={{ scale: 0.97, y: 2 }}>
              <Link to={createPageUrl('GymCommunity') + `?id=${memberGym.id}`} className="block">
                <Card className="rounded-xl text-card-foreground transition-all duration-200 cursor-pointer relative h-40 overflow-hidden group" style={{ background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                  {memberGym?.image_url ? (
                    <img src={memberGym.image_url} alt={memberGym.name} className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:opacity-100 transition-opacity" loading="eager" fetchpriority="high" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 opacity-60 group-hover:opacity-70 transition-opacity" />
                  )}
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
                            { id: 'demo2', full_name: 'Sam Wilson', avatar_url: null },
                          ]).slice(0, 2).map((user, idx) => (
                            <motion.div
                              key={user.id}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: 'spring', stiffness: 340, damping: 18, delay: 0.28 + idx * 0.07 }}
                              className="relative">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name} className="w-6 h-6 rounded-full object-cover border-2 border-slate-700" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-[9px] font-bold border-2 border-slate-700">
                                  {user.full_name?.[0] || 'U'}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )}

          {/* ── Weekly workout circles ── */}
          {memberGym?.id && (() => {
            const trainingDays = (currentUser?.training_days || []).filter((d) => d >= 1 && d <= 7);
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
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8, padding: '12px 0', height: 88, overflow: 'visible', zIndex: activeCircleDay !== null ? 201 : 'auto' }}>
                {activeCircleDay !== null && (
                  <div
                    onPointerDown={(e) => {
                      if (e.target.closest('[data-bubble]') || e.target.closest('[data-circle-btn]')) return;
                      setActiveCircleDay(null);
                      setBubblePos(null);
                    }}
                    style={{ position: 'fixed', inset: 0, zIndex: 198 }}
                  />
                )}
                {allDays.map((day, i) => {
                  const done = loggedDays.has(day);
                  const bounce = justLoggedDay === day;
                  const isTodayCircle = day === todayDay;
                  const joinDate = currentUser?.created_date || currentUser?.created_at || null;
                  const mondayThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
                  const joinedThisWeek = joinDate && new Date(joinDate) >= mondayThisWeek;
                  const joinDayNum = joinedThisWeek ? (() => { const d = new Date(joinDate).getDay(); return d === 0 ? 7 : d; })() : null;
                  const isPast = day < todayDay;
                  const isPreJoin = joinDayNum !== null && day < joinDayNum;
                  const isInCurrentSplit = trainingDays.includes(day);
                  const isRestDay = done ? false : !isInCurrentSplit;
                  const isMissed = !isRestDay && !done && isPast && !isPreJoin;
                  const isPastOrTodayRestDay = isRestDay && (isPast || isTodayCircle);
                  const size = isTodayCircle ? 49 : 40;
                  const verticalOffset = Math.round(Math.sin(i / (allDays.length - 1) * Math.PI * 2) * 11);
                  const workoutLog = logsByDay[day];
                  const showViewWorkout = !done && !isRestDay && !isMissed && (day > todayDay || isTodayCircle);
                  const hasBubbleBtn = done && !isRestDay && workoutLog || showViewWorkout;

                  const getBg = () => {
                    if (isRestDay) {
                      if (isPastOrTodayRestDay) return 'linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)';
                      return 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
                    }
                    if (done) return 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)';
                    if (isMissed) return 'linear-gradient(to bottom, #f87171 0%, #ef4444 35%, #b91c1c 100%)';
                    return 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
                  };
                  const getBorder = () => {
                    if (isRestDay) {
                      if (isPastOrTodayRestDay) return '1px solid rgba(74,222,128,0.5)';
                      return '1px solid rgba(71,85,105,0.7)';
                    }
                    if (done) return '1px solid rgba(147,197,253,0.5)';
                    if (isMissed) return '1px solid rgba(248,113,113,0.5)';
                    return '1px solid rgba(71,85,105,0.7)';
                  };
                  const getBoxShadow = () => {
                    if (isRestDay) {
                      if (isPastOrTodayRestDay) return '0 3px 0 0 #15803d, 0 5px 12px rgba(0,80,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.15), inset 0 0 12px rgba(255,255,255,0.04)';
                      return '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.25), inset 0 0 10px rgba(255,255,255,0.02)';
                    }
                    if (done) return '0 4px 0 0 #1a3fa8, 0 7px 18px rgba(0,0,100,0.55), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 18px rgba(255,255,255,0.06)';
                    if (isMissed) return '0 4px 0 0 #991b1b, 0 7px 18px rgba(180,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 18px rgba(255,255,255,0.06)';
                    return '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.25), inset 0 0 10px rgba(255,255,255,0.02)';
                  };
                  const getAnimation = () => {
                    if (bounce) return 'dayButtonBounce 0.65s cubic-bezier(0.34,1.6,0.64,1) 0s 1 normal forwards';
                    if (isRestDay || done || isPreJoin) return 'none';
                    return `dayWiggle 2.4s ease-in-out ${i * 0.18}s infinite`;
                  };
                  return (
                    <div key={day} style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 11 + verticalOffset - (isTodayCircle ? 4 : 0), overflow: 'visible', zIndex: 1 }}>
                      {isTodayCircle && (
                        <div style={{ position: 'absolute', width: size + 14, height: size + 14, borderRadius: '50%', border: '3px solid rgba(148,163,184,0.45)', background: 'rgba(148,163,184,0.08)', animation: 'todayRingPulse 2s ease-in-out infinite', pointerEvents: 'none' }} />
                      )}
                      <button
                        data-circle-btn="true"
                        onPointerDown={(e) => {
                          setPressedDay(day);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setBubblePos({
                            buttonCenterX: rect.left + rect.width / 2,
                            buttonBottom: rect.bottom,
                            day,
                            workoutLog: workoutLog || null,
                            done,
                            isRestDay,
                            isMissed,
                            isPastOrTodayRestDay,
                            isTodayCircle,
                            showViewWorkout,
                            hasBubbleBtn,
                            popupLabel: (() => {
                              if (isRestDay) return 'Rest Day';
                              if (isMissed) return 'No Workout';
                              if (done && workoutLog) return workoutLog.workout_name || workoutLog.title || workoutLog.workout_type || workoutLog.name || workoutLog.split_name || 'Workout';
                              if (done) return 'Workout';
                              const customTypes = currentUser?.custom_workout_types;
                              const splitDay = customTypes ? Array.isArray(customTypes) ? customTypes.find((s) => s.day === day || s.day_of_week === day) : customTypes[day] : null;
                              return splitDay?.name || splitDay?.title || splitDay?.workout_type || DAY_LABELS[i];
                            })(),
                            dateLabel: done && workoutLog?.completed_date
                              ? new Date(workoutLog.completed_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
                              : (() => { const mon = startOfWeek(new Date(), { weekStartsOn: 1 }); const sd = new Date(mon); sd.setDate(mon.getDate() + (day - 1)); return sd.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); })(),
                            solidColor: isPastOrTodayRestDay ? '#16a34a' : isRestDay ? '#1e2535' : done ? '#3b82f6' : isMissed ? '#dc2626' : isTodayCircle ? '#263244' : '#1e2535',
                          });
                        }}
                        onPointerUp={() => {
                          if (pressedDay === day) {
                            setActiveCircleDay((prev) => {
                              if (prev === day) { setBubblePos(null); return null; }
                              return day;
                            });
                          }
                          setPressedDay(null);
                        }}
                        onPointerLeave={() => setPressedDay(null)}
                        onPointerCancel={() => setPressedDay(null)}
                        style={{
                          width: size, height: size, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: getBg(), border: getBorder(), boxShadow: getBoxShadow(),
                          transition: 'opacity 0.1s ease, background 0.4s ease, border 0.4s ease, box-shadow 0.4s ease',
                          animation: pressedDay === day ? 'none' : getAnimation(),
                          opacity: pressedDay === day ? 0.65 : 1,
                          transform: pressedDay === day ? 'scale(0.82) translateY(3px)' : 'none',
                          willChange: 'opacity', cursor: 'pointer', padding: 0, outline: 'none',
                          WebkitTapHighlightColor: 'transparent', userSelect: 'none',
                          touchAction: 'manipulation',
                        }}>
                        {isRestDay ? (
                          isPastOrTodayRestDay ? (
                            <svg width={isTodayCircle ? 32 : 26} height={isTodayCircle ? 32 : 26} viewBox="0 0 100 100" fill="none">
                              <line x1="50" y1="95" x2="50" y2="30" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
                              <path d="M50 8 C44 20 40 28 42 36 C45 40 55 40 58 36 C60 28 56 20 50 8Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                              <path d="M50 30 C42 22 32 18 22 22 C20 28 24 36 32 38 C40 40 48 36 50 30Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                              <path d="M50 30 C58 22 68 18 78 22 C80 28 76 36 68 38 C60 40 52 36 50 30Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                              <path d="M50 50 C40 42 28 40 16 46 C16 52 22 60 32 60 C42 60 50 54 50 50Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                              <path d="M50 50 C60 42 72 40 84 46 C84 52 78 60 68 60 C58 60 50 54 50 50Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                              <line x1="50" y1="30" x2="36" y2="39" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
                              <line x1="50" y1="30" x2="64" y2="39" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
                              <line x1="50" y1="50" x2="32" y2="57" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
                              <line x1="50" y1="50" x2="68" y2="57" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <svg width={isTodayCircle ? 32 : 26} height={isTodayCircle ? 32 : 26} viewBox="0 0 100 100" fill="none">
                              <line x1="50" y1="95" x2="50" y2="30" stroke="rgba(148,163,184,0.35)" strokeWidth="3" strokeLinecap="round" />
                              <path d="M50 8 C44 20 40 28 42 36 C45 40 55 40 58 36 C60 28 56 20 50 8Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                              <path d="M50 30 C42 22 32 18 22 22 C20 28 24 36 32 38 C40 40 48 36 50 30Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                              <path d="M50 30 C58 22 68 18 78 22 C80 28 76 36 68 38 C60 40 52 36 50 30Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                              <path d="M50 50 C40 42 28 40 16 46 C16 52 22 60 32 60 C42 60 50 54 50 50Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                              <path d="M50 50 C60 42 72 40 84 46 C84 52 78 60 68 60 C58 60 50 54 50 50Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                              <line x1="50" y1="30" x2="36" y2="39" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" strokeLinecap="round" />
                              <line x1="50" y1="30" x2="64" y2="39" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" strokeLinecap="round" />
                              <line x1="50" y1="50" x2="32" y2="57" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" strokeLinecap="round" />
                              <line x1="50" y1="50" x2="68" y2="57" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                          )
                        ) : done ? (
                          <svg width={isTodayCircle ? 20 : 16} height={isTodayCircle ? 20 : 16} viewBox="0 0 20 20" fill="none">
                            <path d="M4 10.5l4.5 4.5 7.5-9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : isMissed ? (
                          <svg width={isTodayCircle ? 18 : 14} height={isTodayCircle ? 18 : 14} viewBox="0 0 20 20" fill="none">
                            <path d="M5 5l10 10M15 5L5 15" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <div style={{ width: isTodayCircle ? 18 : 14, height: isTodayCircle ? 18 : 14, borderRadius: '50%', border: isTodayCircle ? '2px solid rgba(148,163,184,0.6)' : '2px solid rgba(100,116,139,0.35)', background: isTodayCircle ? 'rgba(255,255,255,0.05)' : 'transparent', boxShadow: isTodayCircle ? 'inset 0 1px 3px rgba(0,0,0,0.4)' : 'none' }} />
                        )}
                      </button>
                      <AnimatePresence>
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ── Fixed bubble ── */}
          {activeCircleDay !== null && bubblePos && (() => {
            const ARROW_H = 7;
            const ARROW_W = 13;
            const RADIUS = 14;
            const BUBBLE_W = 274;
            const BUBBLE_H = bubblePos.hasBubbleBtn ? 118 : 78;
            const SVG_H = BUBBLE_H + ARROW_H;

            const screenW = window.innerWidth;
            const rawLeft = bubblePos.buttonCenterX - BUBBLE_W / 2;
            const clampedLeft = Math.max(8, Math.min(rawLeft, screenW - BUBBLE_W - 8));
            const arrowTip = Math.max(RADIUS + ARROW_W / 2 + 2, Math.min(bubblePos.buttonCenterX - clampedLeft, BUBBLE_W - RADIUS - ARROW_W / 2 - 2));
            const arrowL = arrowTip - ARROW_W / 2;
            const arrowR = arrowTip + ARROW_W / 2;
            const bubbleTop = bubblePos.buttonBottom + 4;

            const path = [
              `M ${RADIUS} ${ARROW_H}`, `L ${arrowL} ${ARROW_H}`, `L ${arrowTip} 0`,
              `L ${arrowR} ${ARROW_H}`, `L ${BUBBLE_W - RADIUS} ${ARROW_H}`,
              `Q ${BUBBLE_W} ${ARROW_H} ${BUBBLE_W} ${ARROW_H + RADIUS}`,
              `L ${BUBBLE_W} ${SVG_H - RADIUS}`, `Q ${BUBBLE_W} ${SVG_H} ${BUBBLE_W - RADIUS} ${SVG_H}`,
              `L ${RADIUS} ${SVG_H}`, `Q 0 ${SVG_H} 0 ${SVG_H - RADIUS}`,
              `L 0 ${ARROW_H + RADIUS}`, `Q 0 ${ARROW_H} ${RADIUS} ${ARROW_H}`, `Z`,
            ].join(' ');

            return (
              <motion.div
                key={bubblePos.day}
                initial={{ opacity: 0, scaleY: 0, scaleX: 0.75 }}
                animate={{ opacity: 1, scaleY: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleY: 0, scaleX: 0.75 }}
                transition={{ duration: 0.32, ease: [0.34, 1.3, 0.64, 1] }}
                style={{ position: 'fixed', top: bubbleTop, left: clampedLeft, width: BUBBLE_W, height: SVG_H, zIndex: 9999, pointerEvents: 'auto', transformOrigin: `${arrowTip}px top` }}>
                <svg width={BUBBLE_W} height={SVG_H} style={{ position: 'absolute', top: 0, left: 0 }}>
                  <path d={path} fill={bubblePos.solidColor} />
                </svg>
                <div style={{ position: 'absolute', top: ARROW_H + 8, left: 14, right: 14, bottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 19.3, fontWeight: 800, color: '#ffffff', letterSpacing: '0.01em', lineHeight: 1.25, textShadow: '0 1px 3px rgba(0,0,0,0.35)', whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'ellipsis', textAlign: 'center', width: '100%', display: 'block', flexShrink: 0 }}>
                    {bubblePos.popupLabel}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.03em', lineHeight: 1, textAlign: 'center', marginTop: 5 }}>
                    {bubblePos.dateLabel}
                  </span>
                  {bubblePos.done && !bubblePos.isRestDay && bubblePos.workoutLog && (
                    <button
                      onPointerDown={async (e) => {
                        e.stopPropagation();
                        const wl = bubblePos.workoutLog;
                        setActiveCircleDay(null);
                        setBubblePos(null);
                        try {
                          const logs = await base44.entities.WorkoutLog.filter({ id: wl.id });
                          setSummaryLog(logs[0] || wl);
                        } catch { setSummaryLog(wl); }
                      }}
                      style={{ ...viewSummaryBtnStyle, marginTop: 10 }}>
                      View Summary
                    </button>
                  )}
                  {bubblePos.showViewWorkout && (
                    <button
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        const d = bubblePos.day;
                        setActiveCircleDay(null);
                        setBubblePos(null);
                        setViewWorkoutDay(d);
                      }}
                      style={viewWorkoutBtnStyle}>
                      View Workout
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })()}

          {memberGym?.id && <QuoteCarousel />}

          {/* ── Social Feed ── */}
          {friends.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pt-1">
                <FriendsIcon className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-black text-white tracking-tight">Social Feed</h2>
              </div>

              {filteredActivityCards.length > 0 && (
                <div className="space-y-3">
                  {filteredActivityCards.map(card => (
                    <div key={card.id} style={{ background:'#1e293b', border:'1.5px solid #334155', borderBottom:'4px solid #0f172a', borderRadius:16 }} className="relative overflow-hidden">
                      <button onClick={() => dismissCard(card.id)} className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all text-[10px] font-bold z-10">✕</button>
                      <div className="px-4 py-4 flex items-center gap-4">
                        <span className="text-3xl select-none flex-shrink-0">{card.emoji}</span>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-extrabold text-white text-[14px] leading-tight">{card.title}</p>
                          <p className="text-[12px] text-slate-400 mt-1 font-medium">{card.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activityFeed.length > 0 && (
                <div className="space-y-3">
                  {activityFeed.map(activity =>
                    activity.type === 'notification' ? (
                      <Card key={activity.id} className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 overflow-hidden rounded-xl shadow-2xl shadow-black/20">
                        <div className="p-3"><p className="text-xs text-white leading-tight">{activity.message}</p></div>
                      </Card>
                    ) : (
                      <Card key={activity.id} className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 overflow-hidden rounded-xl shadow-2xl shadow-black/20">
                        <div className="p-3">
                          <div className="flex items-center gap-3">
                            <Link to={createPageUrl('UserProfile') + `?id=${activity.friendId}`} className="flex-shrink-0">
                              {activity.friendAvatar
                                ? <img src={activity.friendAvatar} alt={activity.friendName} className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30" />
                                : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center ring-2 ring-blue-500/30"><span className="text-white font-bold text-sm">{activity.friendName?.charAt(0)?.toUpperCase()||'U'}</span></div>}
                            </Link>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white leading-tight"><span className="font-semibold">{activity.friendName}</span> <span className="text-slate-300">{activity.message}</span>{activity.emoji && <span className="ml-1">{activity.emoji}</span>}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500">{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
                                {activity.type === 'pr' && <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] px-1.5 py-0">🏆 PR</Badge>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  )}
                </div>
              )}

              {socialFeedPosts.length > 0 && (
                <div className="space-y-3">
                  {socialFeedPosts.map(post => (
                    <PostCard key={post.id} post={post} fullWidth={true} currentUser={currentUser} isOwnProfile={post.member_id === currentUser?.id} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => queryClient.invalidateQueries({ queryKey: ['posts'] })} />
                  ))}
                </div>
              )}
            </div>
          )}

          {gymMemberships.length === 0 && currentUser?.account_type !== 'gym_owner' && (
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
          )}
        </div>
      </div>

      {/* STAGE 1 — Streak animation */}
      <AnimatePresence>
        {showStreakCelebration && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div id="streak-anim-stage" style={{ position: 'relative', width: 180, height: 180, opacity: 0, willChange: 'transform, opacity' }}>
                <img id="streak-anim-p1" src={POSE_1_URL} alt="streak pose 1" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                <img id="streak-anim-p2" src={POSE_2_URL} alt="streak pose 2" onError={(e) => { console.error('p2 image failed:', e.target.src); }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'none' }} />
              </div>
              <div id="streak-anim-num" style={{ fontSize: 96, fontWeight: 900, color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.8)', letterSpacing: '-0.04em', lineHeight: 1, opacity: 0, transform: 'scale(0.5)' }}>
                {celebrationStreakNum - 1}
              </div>
              <div id="streak-anim-lbl" style={{ display: 'none' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE 2 — Challenges */}
      <AnimatePresence>
        {showChallengesCelebration && celebrationChallenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center px-4">

            <div className="w-full max-w-sm space-y-3">
              {celebrationChallenges.map((challenge, idx) => {
                const prevPct = Math.min(100, Math.round((challenge.previous_value / challenge.target_value) * 100));
                const newPct = Math.min(100, Math.round((challenge.new_value / challenge.target_value) * 100));
                const isComplete = newPct >= 100;
                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + idx * 0.1, duration: 0.3 }}
                    className="rounded-2xl overflow-hidden relative"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16,19,40,0.96) 0%, rgba(6,8,18,0.99) 100%)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                    }}>
                    {/* Top shine */}
                    <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.08) 50%, transparent 90%)' }} />

                    <div className="relative p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                          <img
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/5a4c7be8b_Untitleddesign-7.jpg"
                            alt="Challenge"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-black text-white leading-tight truncate">{challenge.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{challenge.description}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-slate-400">{challenge.new_value} / {challenge.target_value}</span>
                          <span className="text-[11px] font-bold" style={{ color: isComplete ? '#34d399' : '#64748b' }}>
                            {isComplete ? '✓ Complete' : `${newPct}%`}
                          </span>
                        </div>
                        <div className="h-4 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <motion.div
                            initial={{ width: `${prevPct}%` }}
                            animate={{ width: `${newPct}%` }}
                            transition={{ delay: 0.4 + idx * 0.1, duration: 1.2, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: isComplete ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #38bdf8, #60a5fa)' }}
                          />
                        </div>
                      </div>

                      {/* Reward row */}
                      <div className="flex items-center gap-3 rounded-xl px-3 py-2"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span style={{ fontSize: 20 }}>{challenge.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Reward</p>
                          <p className="text-[13px] font-black text-white truncate">{challenge.reward}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE 3 — Share Workout */}
      <AnimatePresence>
        {showShareWorkout && (
          <ShareWorkoutScreen
            workoutName={celebrationWorkoutName}
            exercises={celebrationExercises}
            previousExercises={celebrationPreviousExercises}
            currentUser={currentUser}
            onContinue={() => {
              setShowShareWorkout(false);
              // Short pause then show Stage 4
              setTimeout(() => setShowDaysCelebration(true), 200);
            }} />
        )}
      </AnimatePresence>

      {/* STAGE 4 — Day circles celebration */}
      <AnimatePresence>
        {showDaysCelebration && (
          <WorkoutDaysCelebration
            currentUser={currentUser}
            weeklyWorkoutLogs={weeklyWorkoutLogs}
            todayDow={todayDowAdjusted}
            onDismiss={() => {
              setShowDaysCelebration(false);
              setTimeout(() => setJustLoggedDay(null), 400);
            }}
          />
        )}
      </AnimatePresence>

      <StreakVariantPicker isOpen={showStreakVariants} onClose={() => setShowStreakVariants(false)} onSelect={handleStreakVariantSelect} selectedVariant={streakVariant} streakFreezes={currentUser?.streak_freezes || 0} />
      <JoinWithCodeModal open={showJoinModal} onClose={() => setShowJoinModal(false)} currentUser={currentUser} gymCount={gymMemberships.length} />
      <CreateSplitModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} currentUser={currentUser} />

      {/* ── Friends Modal ── */}
      {showFriendsModal && (
        <>
          <div className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowFriendsModal(false)} />
          <div className="fixed left-1/2 -translate-x-1/2 top-12 w-11/12 max-w-2xl h-1/2 z-[9999] flex flex-col bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white">
            <div className="px-3 py-1 flex items-center gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input placeholder="Search friends..." value={friendsListSearchQuery} onChange={e => setFriendsListSearchQuery(e.target.value)}
                  className="pl-8 bg-white/10 border border-white/20 hover:border-white/40 focus-visible:outline-none focus-visible:border-blue-400 text-white placeholder:text-slate-300 rounded-xl text-sm h-9" />
              </div>
              <Button onClick={() => { setShowAddFriendModal(true); setShowFriendsModal(false); }}
                className="bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white border-transparent h-8 w-8 p-0 flex-shrink-0 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px]">
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {friendRequests.filter(req => { const u = friendUsersList.find(u => u.id === req.user_id); return (u?.full_name||req.user_name||'').toLowerCase().includes(friendsListSearchQuery.toLowerCase()); }).map(request => {
                const u = friendUsersList.find(u => u.id === request.user_id);
                const name = u?.full_name || request.user_name || request.friend_name;
                return (
                  <div key={request.id} className="p-2 rounded-lg bg-blue-700/40 border border-blue-500/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {u?.avatar_url ? <img src={u.avatar_url} alt={name} className="w-full h-full object-cover" /> : <span className="text-xs font-semibold text-white">{name?.charAt(0)?.toUpperCase()}</span>}
                      </div>
                      <div><p className="font-semibold text-white text-xs truncate">{name}</p><Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] mt-1">Request pending</Badge></div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="icon" onClick={() => acceptFriendMutation.mutate(request.user_id)} className="bg-green-600 hover:bg-green-700 text-white h-7 w-7"><CheckCircle className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => rejectFriendMutation.mutate(request.user_id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-7 w-7"><X className="w-3 h-3" /></Button>
                    </div>
                  </div>
                );
              })}
              {friends.length === 0 && friendRequests.length === 0
                ? <p className="text-center text-slate-400 text-sm py-8">No friends yet</p>
                : friendsWithActivity.filter(friend => { const u = friendUsersList.find(u => u.id === friend.friend_id); return (u?.full_name||friend.friend_name||'').toLowerCase().includes(friendsListSearchQuery.toLowerCase()); }).map(friend => {
                    const u = friendUsersList.find(u => u.id === friend.friend_id);
                    const name = u?.full_name || friend.friend_name;
                    return (
                      <div key={friend.id} className="p-2 rounded-lg bg-slate-700/40 flex items-center justify-between gap-2 relative">
                        <Link to={createPageUrl('UserProfile') + `?id=${friend.friend_id}`} className="flex items-center gap-2 flex-1 min-w-0" onClick={() => setShowFriendsModal(false)}>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {u?.avatar_url ? <img src={u.avatar_url} alt={name} className="w-full h-full object-cover" /> : <span className="text-xs font-semibold text-white">{name?.charAt(0)?.toUpperCase()}</span>}
                          </div>
                          <p className="font-semibold text-white text-xs truncate">{name}</p>
                        </Link>
                        <div className="relative flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); setFriendMenuOpen(friendMenuOpen === friend.id ? null : friend.id); }} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-600/60 active:scale-90 transition-all duration-100">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {friendMenuOpen === friend.id && (
                            <>
                              <div className="fixed inset-0 z-[10001]" onClick={() => setFriendMenuOpen(null)} />
                              <div className="absolute right-0 top-8 z-[10002] bg-slate-800 border border-slate-700/50 rounded-lg shadow-[0_3px_0_0_#1e293b,0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden min-w-[110px]">
                                <button onClick={(e) => { e.stopPropagation(); setFriendMenuOpen(null); const u2 = friendUsersList.find(u => u.id === friend.friend_id); setConfirmRemoveFriend({ id: friend.friend_id, name: u2?.full_name || friend.friend_name }); }} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors">
                                  Remove
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </>
      )}

      {/* ── Add Friend Modal ── */}
      {showAddFriendModal && (
        <>
          <div className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-sm" onClick={() => { setShowAddFriendModal(false); setFriendSearchQuery(''); }} />
          <Card className="fixed left-1/2 -translate-x-1/2 top-12 w-11/12 max-w-2xl h-1/2 z-[9999] flex flex-col bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white overflow-hidden">
            <div className="px-3 py-1 flex items-center gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-[calc(50%-2.5px)] w-3.5 h-3.5 text-slate-400" />
                <Input placeholder="Search by username..." value={friendSearchQuery} onChange={e => setFriendSearchQuery(e.target.value)}
                  className="pl-8 bg-white/10 border border-white/20 text-white placeholder:text-slate-300 rounded-xl text-sm h-9" />
              </div>
              <button onClick={() => { setShowAddFriendModal(false); setShowFriendsModal(true); setFriendSearchQuery(''); }} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white active:scale-90 active:opacity-60 transition-all duration-100 transform-gpu flex-shrink-0">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {friendSearchQuery.length >= 2 && (
                filteredSearchResults.length === 0
                  ? <p className="text-center text-slate-400 text-sm py-8">No users found</p>
                  : filteredSearchResults.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover rounded-lg" /> : <span className="text-sm font-semibold text-white">{user.full_name?.charAt(0)?.toUpperCase()}</span>}
                          </div>
                          <div><div className="font-semibold text-white text-sm">{user.full_name}</div><div className="text-xs text-slate-400">{user.username ? `@${user.username}` : ''}</div></div>
                        </div>
                        <Button size="sm" onClick={() => addFriendMutation.mutate(user)} disabled={addFriendMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
              )}
            </div>
          </Card>
        </>
      )}

      {/* ── Confirm Remove Friend ── */}
      {confirmRemoveFriend && (
        <>
          <div className="fixed inset-0 z-[10003] bg-slate-950/60 backdrop-blur-sm" onClick={() => setConfirmRemoveFriend(null)} />
          <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10004] bg-slate-900/80 backdrop-blur-md border border-slate-700/30 rounded-3xl shadow-2xl shadow-black/40 text-white p-6">
            <h3 className="text-xl font-black text-white mb-2">Remove {confirmRemoveFriend.name}?</h3>
            <p className="text-slate-300 text-sm mb-6">Are you sure you want to remove them as a friend? You'll no longer see each other's activity.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemoveFriend(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-200 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border border-slate-500/40 shadow-[0_3px_0_0_#1e293b,0_6px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                Cancel
              </button>
              <button
                onClick={() => { removeFriendMutation.mutate(confirmRemoveFriend.id); setConfirmRemoveFriend(null); }}
                disabled={removeFriendMutation.isPending}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_3px_0_0_#7f1d1d,0_6px_16px_rgba(200,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu disabled:opacity-50">
                {removeFriendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Remove'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Workout Summary Modal ── */}
      <AnimatePresence>
        {summaryLog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSummaryLog(null)}
            className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
              onClick={(e) => e.stopPropagation()}
              className={modalPanelClass}>
              <div className="mb-5 text-center">
                <h3 className="text-2xl font-black text-white mb-1">{summaryLog.workout_name || summaryLog.title || summaryLog.workout_type || 'Workout'}</h3>
                <p className="text-sm text-slate-400 font-medium">
                  {summaryLog.completed_date ? new Date(summaryLog.completed_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) : ''}
                </p>
              </div>
              {summaryLog.check_in_time && summaryLog.completed_date && (
                <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                  <p className="text-xs text-orange-300/80 font-bold uppercase tracking-wide mb-1">Total Time at Gym</p>
                  <p className="text-xl font-black text-orange-300">
                    {(() => {
                      const checkIn = new Date(summaryLog.check_in_time);
                      const checkOut = new Date(summaryLog.completed_date);
                      const diffMs = checkOut - checkIn;
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                    })()}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: 'Duration', value: summaryLog.duration_minutes ? `${summaryLog.duration_minutes}m` : '—' },
                  { label: 'Exercises', value: summaryLog.exercises?.length || summaryLog.exercise_count || '—' },
                  { label: 'Volume', value: summaryLog.total_volume ? `${summaryLog.total_volume}kg` : '—' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                    <p className="text-sm font-black text-blue-300">{stat.value}</p>
                    <p className="text-xs text-slate-500 font-bold mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
              {summaryLog.exercises?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Exercises</p>
                  <div className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 mb-1.5 items-end px-2 -mx-2">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-7">Sets</div>
                    <div />
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-9">Reps</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2.5">Weight</div>
                  </div>
                  <div className="space-y-2 -mx-2">
                    {summaryLog.exercises.map((ex, idx) => {
                      const exName = ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`;
                      // Parse setsReps string as universal fallback
                      const setsRepsStr = String(ex.setsReps || ex.sets_reps || ex.set_reps || '');
                      const srParts = /[xX]/.test(setsRepsStr) ? setsRepsStr.split(/[xX]/).map(s => s.trim()) : [];
                      // Sets
                      const rawSets = ex.sets ?? ex.set_count ?? ex.num_sets;
                      const sets = (rawSets !== undefined && rawSets !== null && String(rawSets) !== '')
                        ? String(rawSets)
                        : ex.logged_sets?.length ? String(ex.logged_sets.length)
                        : ex.sets_data?.length ? String(ex.sets_data.length)
                        : srParts[0] || '-';
                      // Reps
                      const rawReps = ex.reps ?? ex.rep_count ?? ex.num_reps;
                      const reps = (rawReps !== undefined && rawReps !== null && String(rawReps) !== '')
                        ? String(rawReps)
                        : ex.logged_sets?.[0]?.reps ? String(ex.logged_sets[0].reps)
                        : ex.sets_data?.[0]?.reps ? String(ex.sets_data[0].reps)
                        : srParts[1] || '-';
                      // Weight
                      const rawWeight = ex.weight_kg ?? ex.weight_lbs ?? ex.weight ?? ex.logged_sets?.[0]?.weight ?? ex.sets_data?.[0]?.weight;
                      const weight = (rawWeight !== undefined && rawWeight !== null && String(rawWeight) !== '') ? String(rawWeight) : '-';
                      return (
                        <div key={idx} className="bg-white/5 pt-2 pb-2 pl-2 rounded-xl border border-white/10 grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 items-center">
                          <div className="text-sm font-bold text-white leading-tight ml-1">{exName}</div>
                          <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center ml-1" style={{ width: '36px' }}>{sets}</div>
                          <div className="text-slate-400 text-xs font-bold flex items-center justify-center">×</div>
                          <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>{reps}</div>
                          <div className="ml-3 pr-3">
                            <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white pb-1 pl-1 pt-1 text-sm font-black text-center rounded-2xl shadow-md shadow-blue-900/20 min-w-[55px]">
                              {weight}<span className="text-[10px] font-bold">kg</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {summaryLog.notes && (
                <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Notes</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{summaryLog.notes}</p>
                </div>
              )}
              {!summaryLog.exercises?.length && !summaryLog.notes && (
                <p className="text-xs text-slate-500 text-center mt-4">No additional details recorded.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── View Workout Modal ── */}
      <AnimatePresence>
        {viewWorkoutDay !== null && (() => {
          const workout = currentUser?.custom_workout_types?.[viewWorkoutDay];
          if (!workout) return null;
          const workoutName = workout.name || 'Training Day';
          const exercises = workout.exercises || [];
          const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
          const slotDate = new Date(monday);
          slotDate.setDate(monday.getDate() + (viewWorkoutDay - 1));
          const formattedDate = slotDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setViewWorkoutDay(null)}
              className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
                onClick={(e) => e.stopPropagation()}
                className={modalPanelClass}>
                <div className="mb-5 text-center">
                  <h3 className="text-2xl font-black text-white mb-2">{workoutName}</h3>
                  <p className="text-sm text-slate-400 font-medium mt-2">{formattedDate}</p>
                </div>
                {exercises.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 mb-1.5 items-end px-2 -mx-2">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-4">Sets</div>
                      <div />
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-5">Reps</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2.5">Weight</div>
                    </div>
                    <div className="space-y-2 -mx-2">
                      {exercises.map((ex, idx) => {
                        const exName = ex.exercise || ex.name || ex.title || `Exercise ${idx + 1}`;
                        const setsRepsStr2 = String(ex.setsReps || ex.sets_reps || ex.set_reps || '');
                        const srParts2 = /[xX]/.test(setsRepsStr2) ? setsRepsStr2.split(/[xX]/).map(s => s.trim()) : [];
                        const rawSets2 = ex.sets ?? ex.set_count ?? ex.num_sets;
                        const sets = (rawSets2 !== undefined && rawSets2 !== null && String(rawSets2) !== '') ? String(rawSets2) : srParts2[0] || '-';
                        const rawReps2 = ex.reps ?? ex.rep_count ?? ex.num_reps;
                        const reps = (rawReps2 !== undefined && rawReps2 !== null && String(rawReps2) !== '') ? String(rawReps2) : srParts2[1] || '-';
                        const rawWeight2 = ex.weight_kg ?? ex.weight_lbs ?? ex.weight;
                        const weight = (rawWeight2 !== undefined && rawWeight2 !== null && String(rawWeight2) !== '') ? String(rawWeight2) : '-';
                        return (
                          <div key={idx} className="bg-white/5 pt-2 pb-2 pl-2 rounded-xl border border-white/10 grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 items-center">
                            <div className="text-sm font-bold text-white leading-tight ml-1">{exName}</div>
                            <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center ml-3" style={{ width: '36px' }}>{sets}</div>
                            <div className="text-slate-400 text-xs font-bold flex items-center justify-center ml-4">×</div>
                            <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center ml-2" style={{ width: '36px' }}>{reps}</div>
                            <div className="ml-3 pr-3">
                              <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white pb-1 pl-1 pt-1 text-sm font-black text-center rounded-2xl shadow-md shadow-blue-900/20 min-w-[55px]">
                                {weight}<span className="text-[10px] font-bold">kg</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center mt-4">No exercises configured for this day.</p>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </PullToRefresh>
  );
}