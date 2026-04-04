import React, { useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '../components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import FriendsIcon from '../components/FriendsIcon';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import TodayWorkout from '../components/profile/TodayWorkout';
import StreakVariantPicker from '../components/StreakVariantPicker';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import QuoteCarousel from '../components/home/QuoteCarousel';
import ShareWorkoutScreen from '../components/profile/ShareWorkoutScreen';
import { useState } from 'react';
import { isToday, differenceInDays, startOfWeek } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const POSE_1_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';
const POSE_2_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/760358372_STREAKICON21.png';

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
  // NEW: controls the View Workout modal
  const [viewWorkoutDay, setViewWorkoutDay] = useState(null);
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
      if (e.target.closest('[data-circle-btn]') || e.target.closest('[data-bubble]')) return;
      setActiveCircleDay(null);
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

  // View Summary button style — slightly darker blue, no glow
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

  // View Workout button style — matches inactive SplitCard aesthetic
  const viewWorkoutBtnStyle = {
    marginTop: 10, width: '100%',
    padding: '7px 0',
    borderRadius: 9,
    background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
    letterSpacing: '0.03em', textAlign: 'center',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    transition: 'transform 0.1s ease', WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
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
                          onClick={() => navigate(createPageUrl('Progress'))}
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

                  const joinDate = currentUser?.created_date || currentUser?.created_at || null;
                  const mondayThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
                  const joinedThisWeek = joinDate && new Date(joinDate) >= mondayThisWeek;
                  const joinDayNum = joinedThisWeek
                    ? (() => { const d = new Date(joinDate).getDay(); return d === 0 ? 7 : d; })()
                    : null;

                  const isPast   = day < todayDay;
                  const isPreJoin = joinDayNum !== null && day < joinDayNum;
                  const isInCurrentSplit = trainingDays.includes(day);
                  const isRestDay = done ? false : !isInCurrentSplit;
                  const isMissed = !isRestDay && !done && isPast && !isPreJoin;
                  const size          = isTodayCircle ? 49 : 40;
                  const verticalOffset = Math.round(Math.sin((i / (allDays.length - 1)) * Math.PI * 2) * 11);
                  const workoutLog    = logsByDay[day];

                  // Show "View Workout": future unlogged training days OR today if training day and not yet logged
                  const showViewWorkout = !done && !isRestDay && !isMissed && (day > todayDay || isTodayCircle);

                  // Bubble is taller when it has a button
                  const hasBubbleBtn = (done && !isRestDay && workoutLog) || showViewWorkout;
                  const BUBBLE_W = 274;
                  const BUBBLE_H = hasBubbleBtn ? 118 : 78;

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
                    if (done && workoutLog) {
                      return workoutLog.workout_name || workoutLog.title || workoutLog.workout_type || workoutLog.name || workoutLog.split_name || 'Workout';
                    }
                    if (done) return 'Workout';
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
                              data-bubble="true"
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
                                position: 'absolute', top: ARROW_H + 8, left: 14, right: 14, bottom: 8,
                                display: 'flex', flexDirection: 'column', gap: 6,
                              }}>
                                <span style={{
                                  fontSize: 19.3,
                                  fontWeight: 800,
                                  color: '#ffffff',
                                  letterSpacing: '0.01em',
                                  lineHeight: 1.25,
                                  textShadow: '0 1px 3px rgba(0,0,0,0.35)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'visible',
                                  textOverflow: 'ellipsis',
                                  textAlign: 'center',
                                  width: '100%',
                                  display: 'block',
                                  flexShrink: 0,
                                }}>
                                  {getPopupLabel()}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.03em', lineHeight: 1, textAlign: 'center', marginTop: 5 }}>
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

                                {/* View Summary — only for logged training days */}
                                {done && !isRestDay && workoutLog && (
                                  <button
                                    data-bubble="true"
                                    onPointerDown={e => e.stopPropagation()}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setActiveCircleDay(null);
                                      try {
                                        const logs = await base44.entities.WorkoutLog.filter({ id: workoutLog.id });
                                        setSummaryLog(logs[0] || workoutLog);
                                      } catch { setSummaryLog(workoutLog); }
                                    }}
                                    onMouseDown={e => { e.stopPropagation(); e.currentTarget.style.transform = 'translateY(2px)'; }}
                                    onMouseUp={e => { e.stopPropagation(); e.currentTarget.style.transform = ''; }}
                                    onMouseLeave={e => e.currentTarget.style.transform = ''}
                                    onTouchStart={e => { e.stopPropagation(); e.currentTarget.style.transform = 'translateY(2px)'; }}
                                    onTouchEnd={e => { e.stopPropagation(); e.currentTarget.style.transform = ''; }}
                                    style={{ ...viewSummaryBtnStyle, marginTop: 10 }}>
                                    View Summary
                                  </button>
                                )}

                                {/* View Workout — today (unlogged) + future training days */}
                                {showViewWorkout && (
                                  <button
                                    data-bubble="true"
                                    onPointerDown={e => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveCircleDay(null);
                                      setViewWorkoutDay(day);
                                    }}
                                    onMouseDown={e => { e.stopPropagation(); e.currentTarget.style.transform = 'translateY(2px)'; }}
                                    onMouseUp={e => { e.stopPropagation(); e.currentTarget.style.transform = ''; }}
                                    onMouseLeave={e => e.currentTarget.style.transform = ''}
                                    onTouchStart={e => { e.stopPropagation(); e.currentTarget.style.transform = 'translateY(2px)'; }}
                                    onTouchEnd={e => { e.stopPropagation(); e.currentTarget.style.transform = ''; }}
                                    style={{ ...viewWorkoutBtnStyle, marginTop: 10 }}>
                                    View Workout
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
            className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white/8 border border-white/15 rounded-2xl p-6 backdrop-blur-sm max-h-[80vh] overflow-y-auto">
              
              {/* Header */}
              <div className="mb-5">
                <h3 className="text-2xl font-black text-white mb-1">{summaryLog.workout_name || summaryLog.title || summaryLog.workout_type || 'Workout'}</h3>
                <p className="text-sm text-slate-400 font-medium">
                  {summaryLog.completed_date ? new Date(summaryLog.completed_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) : ''}
                </p>
              </div>

              {/* Time from check-in to log */}
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

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: 'Duration', value: summaryLog.duration_minutes ? `${summaryLog.duration_minutes}m` : '—' },
                  { label: 'Exercises', value: summaryLog.exercises?.length || summaryLog.exercise_count || '—' },
                  { label: 'Volume', value: summaryLog.total_volume ? `${summaryLog.total_volume}kg` : '—' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                    <p className="text-sm font-black text-blue-300">{stat.value}</p>
                    <p className="text-xs text-slate-500 font-bold mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Exercises */}
              {summaryLog.exercises?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Exercises</p>
                  <div className="space-y-2">
                    {summaryLog.exercises.map((ex, idx) => {
                      const exName = ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`;
                      const weight = ex.weight_kg || ex.weight;
                      const setsReps = ex.setsReps || (ex.sets && ex.reps ? `${ex.sets}x${ex.reps}` : null);
                      const detail = [setsReps, weight ? `${weight}kg` : null].filter(Boolean).join('  ·  ');
                      return (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-white/8 last:border-0">
                          <span className="text-white font-semibold text-sm">{exName}</span>
                          <span className="text-slate-300 text-xs font-medium">{detail || '—'}</span>
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

      {/* View Workout Modal — planned exercises for today (unlogged) and future training days */}
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
              className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-white/8 border border-white/15 rounded-2xl p-6 backdrop-blur-sm max-h-[80vh] overflow-y-auto">

                {/* Header */}
                <div className="mb-5">
                  <h3 className="text-2xl font-black text-white mb-2">{workoutName}</h3>
                  <p className="text-sm text-slate-400 font-medium mt-2">{formattedDate}</p>
                </div>

                {/* Exercises */}
                {exercises.length > 0 ? (
                  <div className="space-y-2">
                    {/* Column headers — matching TodayWorkout card */}
                    <div className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 mb-1.5 items-end px-2 -mx-2">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Sets</div>
                      <div />
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Reps</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2.5">Weight</div>
                    </div>
                    <div className="space-y-2 -mx-2">
                      {exercises.map((ex, idx) => {
                        const exName = ex.exercise || ex.name || ex.title || `Exercise ${idx + 1}`;
                        const sets = ex.sets || ex.setsReps?.split('x')?.[0] || '-';
                        const reps = ex.reps || ex.setsReps?.split('x')?.[1] || '-';
                        const weight = ex.weight || '-';
                        return (
                          <div key={idx} className="bg-white/5 pt-2 pb-2 pl-2 rounded-xl border border-white/10 grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 items-center">
                            <div className="text-sm font-bold text-white leading-tight ml-1">{exName}</div>
                            <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center ml-1" style={{ width: '36px' }}>
                              {sets}
                            </div>
                            <div className="text-slate-400 text-xs font-bold flex items-center justify-center">×</div>
                            <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                              {reps}
                            </div>
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
