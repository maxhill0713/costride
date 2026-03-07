import React, { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import CheckInButton from '../components/gym/CheckInButton';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import WeeklyChallengeCard from '../components/challenges/WeeklyChallengeCard';
import TodayWorkout from '../components/profile/TodayWorkout';
import StreakVariantPicker from '../components/StreakVariantPicker';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import PostCard from '../components/feed/PostCard';
import QuoteCarousel from '../components/home/QuoteCarousel';
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
`;

function injectStreakStyles() {
  if (document.getElementById('streak-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'streak-keyframes';
  style.textContent = STREAK_KEYFRAMES;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// STREAK ANIMATION HELPERS (outside component — no hook rules apply)
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
    // Remove inline opacity so the keyframe can control it
    p2.style.removeProperty('opacity');
    p2.style.opacity = '1';
    // Reset animation completely before applying
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
  const [celebrationStreakNum, setCelebrationStreakNum] = useState(0);
  const [celebrationChallenges, setCelebrationChallenges] = useState([]);
  const audioCtxRef = useRef(null);
  const celebTimers = useRef([]);

  // Inject keyframes once on mount
  useEffect(() => { injectStreakStyles(); }, []);

  // Clean up timers on unmount
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.onboarding_completed === false && !currentUser.account_type) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [currentUser?.onboarding_completed, currentUser?.account_type, navigate]);

  const memberGym = memberGymData || null;
  const userCheckIns = allCheckIns.filter((c) => c.user_id === currentUser?.id);
  const lastCheckIn = userCheckIns.length > 0 ? userCheckIns[0].check_in_date : null;
  const daysSinceCheckIn = lastCheckIn ? differenceInDays(new Date(), new Date(lastCheckIn)) : null;
  const friendIds = friendIdList;

  // Run animation whenever streak celebration mounts
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

  if (userLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  const friendPosts = allPosts.filter((post) =>
    friendIds.includes(post.member_id) &&
    !post.is_system_generated &&
    !post.content?.includes('well done') &&
    !post.content?.includes('workout finished')
  );

  const todayCheckIns = todayCheckInsForQuery;

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

  const featuredChallenge = selectFeaturedChallenge();
  const activeChallenges = challenges.filter((c) => c.status === 'active').slice(0, 3);
  const todayLifts = lifts.filter((l) => isToday(new Date(l.created_date))).slice(0, 5);

  const calculateStreak = (checkIns) => {
    if (checkIns.length === 0) return 0;
    const today = startOfDay(new Date());
    const lastCheckInDate = startOfDay(new Date(checkIns[0].check_in_date));
    const daysSinceLastCheckIn = differenceInDays(today, lastCheckInDate);
    if (daysSinceLastCheckIn > 1) return 0;
    let streak = 1;
    for (let i = 0; i < checkIns.length - 1; i++) {
      const current = startOfDay(new Date(checkIns[i].check_in_date));
      const next = startOfDay(new Date(checkIns[i + 1].check_in_date));
      const daysDiff = differenceInDays(current, next);
      if (daysDiff === 1 || daysDiff === 2) { streak++; } else { break; }
    }
    return streak;
  };

  const userStreak = calculateStreak(userCheckIns);
  const streakVariant = currentUser?.streak_variant || 'default';


  // Stage 1: new streak animation (3.5s) → Stage 2: fullscreen challenges (4s)
  const handleWorkoutLogged = async (challengesData = []) => {
    setWorkoutStartTime(null);
    await queryClient.invalidateQueries({ queryKey: ['checkIns', currentUser?.id] });

    // AudioContext MUST be created inside a user gesture handler
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();

    const newStreak = userStreak + 1;
    setCelebrationStreakNum(newStreak);
    setCelebrationChallenges(challengesData);

    // Stage 1 — new streak animation for 3.5s
    setShowStreakCelebration(true);
    setTimeout(() => {
      setShowStreakCelebration(false);
      // Stage 2 — fullscreen challenges (only if user has challenges)
      if (challengesData.length > 0) {
        setShowChallengesCelebration(true);
        setTimeout(() => setShowChallengesCelebration(false), 4000);
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
    const messages = [
      `Join ${todayCheckIns.length} other${todayCheckIns.length === 1 ? '' : 's'} training today`,
      `${todayCheckIns.length} members crushing it right now`,
      `See who's at the gym today—${todayCheckIns.length} members active`,
      `${todayCheckIns.length} gym warriors training today`,
      `Join ${todayCheckIns.length} member${todayCheckIns.length === 1 ? '' : 's'} on the floor`
    ];
    return todayCheckIns.length > 0 ? messages[dayOfMonth % messages.length] : 'Members training together daily';
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
            <p className="text-center text-xs text-slate-400 font-medium">
              {weeklyComplete
                ? `🎯 Weekly goal crushed! ${weeklyCheckIns.length}/${weeklyTarget} workouts done`
                : `${weeklyTarget - weeklyCheckIns.length} workout${weeklyTarget - weeklyCheckIns.length === 1 ? '' : 's'} away from your weekly goal`
              }
            </p>

            {!userCheckIns.some((c) => isToday(new Date(c.check_in_date))) &&
              <CheckInButton
                gym={memberGym}
                onCheckInSuccess={() => setWorkoutStartTime(Date.now())} />
            }

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center -space-x-2">
                {(() => {
                  const friendCheckInUsers = checkInUsers.filter((u) => friendIds.includes(u.id));
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
            <Link to={createPageUrl('GymCommunity') + `?id=${memberGym.id}`} className="block">
              <Card className="rounded-xl text-card-foreground bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 hover:border-blue-500/30 transition-all duration-100 cursor-pointer shadow-2xl shadow-black/20 relative h-40 overflow-hidden group active:scale-95 active:translate-y-[3px] animate-[breathe_7s_ease-in-out_infinite]">
                {memberGym?.image_url
                  ? <img src={memberGym.image_url} alt={memberGym.name} className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:opacity-100 transition-opacity" loading="eager" fetchpriority="high" />
                  : <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 opacity-60 group-hover:opacity-70 transition-opacity" />
                }
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />
                <div className="relative p-6 h-full flex flex-col justify-between animate-[breathe_12s_ease-in-out_infinite] active:scale-95 active:translate-y-[3px] transition-all duration-100 cursor-pointer">
                  <div>
                    <p className="text-white font-semibold text-base tracking-tight">Your Community</p>
                    <p className="text-slate-300 text-sm mt-1 font-medium">{memberGym.name}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">{getCommunityText()}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-2">
                        {(checkInUsers.length > 0 ? checkInUsers : [
                          { id: 'demo1', full_name: 'Alex Johnson', avatar_url: null },
                          { id: 'demo2', full_name: 'Sam Wilson', avatar_url: null }
                        ]).slice(0, 2).map((user) =>
                          <div key={user.id} className="relative group">
                            {user.avatar_url
                              ? <img src={user.avatar_url} alt={user.full_name} className="w-6 h-6 rounded-full object-cover border-2 border-slate-700" />
                              : <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-[9px] font-bold border-2 border-slate-700">
                                  {user.full_name?.[0] || 'U'}
                                </div>
                            }
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          }

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

      {/* ─────────────────────────────────────────────
          STAGE 1 — New streak animation (3.5s)
          ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showStreakCelebration &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">

            {/* Icon + Number side by side, centred */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 }}>

              {/* Icon stage — pose 1 and pose 2 stacked */}
              <div
                id="streak-anim-stage"
                style={{
                  position: 'relative',
                  width: 180,
                  height: 180,
                  filter: 'drop-shadow(0 0 28px rgba(249,115,22,0.7))',
                  opacity: 0,
                  willChange: 'transform, opacity, filter'
                }}>
                <img
                  id="streak-anim-p1"
                  src={POSE_1_URL}
                  alt="streak pose 1"
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'contain', opacity: 1
                  }}
                />
                <img
                  id="streak-anim-p2"
                  src={POSE_2_URL}
                  alt="streak pose 2"
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'contain',
                    opacity: 0,
                    willChange: 'transform, opacity'
                  }}
                />
              </div>

              {/* Number — to the right of the icon */}
              <div
                id="streak-anim-num"
                style={{
                  fontSize: 120, fontWeight: 900, color: '#fff',
                  textShadow: '0 4px 12px rgba(0,0,0,0.8)',
                  letterSpacing: '-0.04em', lineHeight: 1,
                  opacity: 0, transform: 'scale(0.5)'
                }}>
                {celebrationStreakNum - 1}
              </div>

              {/* Hidden label element kept so JS can still reference it without erroring */}
              <div id="streak-anim-lbl" style={{ display: 'none' }} />

            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* ─────────────────────────────────────────────
          STAGE 2 — Fullscreen challenges (4s)
          ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showChallengesCelebration && celebrationChallenges.length > 0 &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-sm space-y-8">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-black text-white text-center tracking-tight">
                Challenge Progress
              </motion.p>
              <div className="space-y-6">
                {celebrationChallenges.map((challenge, idx) =>
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.15 }}
                    className="space-y-3">
                    <p className="text-base font-bold text-slate-200 truncate">{challenge.title}</p>
                    <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ delay: 0.5 + idx * 0.15, duration: 1.4, ease: 'easeOut' }} />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>

      <StreakVariantPicker
        isOpen={showStreakVariants}
        onClose={() => setShowStreakVariants(false)}
        onSelect={handleStreakVariantSelect}
        selectedVariant={streakVariant}
        streakFreezes={currentUser?.streak_freezes || 0} />

      <JoinWithCodeModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        currentUser={currentUser} />

      <CreateSplitModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        currentUser={currentUser} />

    </PullToRefresh>
  );
}