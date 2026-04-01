import React, { useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '../components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import FriendsIcon from '../components/FriendsIcon';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import TodayWorkout from '../components/profile/TodayWorkout';
import StreakVariantPicker from '../components/StreakVariantPicker';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import QuoteCarousel from '../components/home/QuoteCarousel';
import StreakFreezeAnimation from '../components/home/StreakFreezeAnimation';
import StreakLossAnimation from '../components/home/StreakLossAnimation';
import WorkoutSummaryModal from '../components/home/WorkoutSummaryModal';
import StreakCelebration from '../components/home/StreakCelebration';
import FriendsSection from '../components/home/FriendsSection';
import ActivityFeedSection from '../components/home/ActivityFeedSection';
import { useState } from 'react';
import { isToday, differenceInDays, startOfWeek, startOfDay } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
// ─────────────────────────────────────────────────────────────────────────────
// Username / search query sanitisation
// ─────────────────────────────────────────────────────────────────────────────
const sanitiseUsernameQuery = (v) =>
  v
    .replace(/[^a-zA-Z0-9_.\- ]/g, '')
    .slice(0, 30);
// ─────────────────────────────────────────────────────────────────────────────
const POSE_1_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png';
const POSE_2_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/8d4e06e17_Pose2_V21.png';
// ── MOCK MODE: set to true to force all training day buttons to appear blue for screenshots ──
const MOCK_MODE = false;
import LocationBasedCheckInButton from '../components/gym/LocationBasedCheckInButton';
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
  if (actx) soundBounceIn(actx);
  trigAnim(stage, 'streakBounceIn', 600, 'cubic-bezier(0.34,1.5,0.64,1)');
  const t1 = setTimeout(() => {
    if (actx) soundNumPop(actx);
    trigAnim(num, 'streakNumPop', 420, 'cubic-bezier(0.34,1.6,0.64,1)');
  }, 500);
  const t2 = setTimeout(() => {
    stage.style.opacity = '1';
    trigAnim(stage, 'streakWindup', 280, 'ease-in-out');
  }, 1300);
  const t3 = setTimeout(() => {
    if (actx) soundPoseSwap(actx);
    p1.style.display = 'none';
    p2.style.display = 'block';
    p2.style.opacity = '1';
    void p2.offsetWidth;
    p2.style.animation = 'streakIconPop 480ms cubic-bezier(0.34,1.8,0.64,1) forwards';
    if (actx) soundNumPop(actx);
    if (navigator.vibrate) navigator.vibrate([40, 60, 80]);
    num.textContent = String(newStreak);
    trigAnim(num, 'streakNumPop', 380, 'cubic-bezier(0.34,1.8,0.64,1)');
  }, 1580);
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
  // ── Pending request 3-dots menu ──────────────────────────────────────────
  const [pendingMenuOpen, setPendingMenuOpen] = useState(null);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [debouncedFriendSearch, setDebouncedFriendSearch] = useState('');
  const [friendsListSearchQuery, setFriendsListSearchQuery] = useState('');
  const [dismissedCardIds, setDismissedCardIds] = useState(() => {
    try { const s = localStorage.getItem('friendsFeedDismissedCards'); return new Set(s ? JSON.parse(s) : []); }
    catch { return new Set(); }
  });
  const [friendsModalViewed, setFriendsModalViewed] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [workoutOverrideDay, setWorkoutOverrideDay] = useState(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showChallengesCelebration, setShowChallengesCelebration] = useState(false);
  const [showShareWorkout, setShowShareWorkout] = useState(false);
  const [showDaysCelebration, setShowDaysCelebration] = useState(false);
  const [showFreezeAnimation, setShowFreezeAnimation] = useState(false);
  const [freezeAnimationData, setFreezeAnimationData] = useState({ freezesLostCount: 0, finalFreezeCount: 0 });
  const [showStreakLossAnimation, setShowStreakLossAnimation] = useState(false);
  const [streakLossAnimationData, setStreakLossAnimationData] = useState({ previousStreak: 0 });
  const [celebrationStreakNum, setCelebrationStreakNum] = useState(0);
  const [celebrationChallenges, setCelebrationChallenges] = useState([]);
  const [celebrationExercises, setCelebrationExercises] = useState([]);
  const [celebrationWorkoutName, setCelebrationWorkoutName] = useState('');
  const [celebrationPreviousExercises, setCelebrationPreviousExercises] = useState([]);
  const [celebrationDurationMinutes, setCelebrationDurationMinutes] = useState(0);
  const [justLoggedDay, setJustLoggedDay] = useState(null);
  const [activeCircleDay, setActiveCircleDay] = useState(null);
  const [bubblePos, setBubblePos] = useState(null);
  const [summaryLog, setSummaryLog] = useState(null);
  const [viewWorkoutDay, setViewWorkoutDay] = useState(null);
  const [pressedDay, setPressedDay] = useState(null);
  const audioCtxRef = useRef(null);
  const celebTimers = useRef([]);
  // ── Header scroll behaviour ──────────────────────────────────────────────
  const [headerState, setHeaderState] = useState('top');
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const prev = lastScrollY.current;
        if (currentY <= 10) {
          setHeaderState('top');
        } else if (currentY > prev) {
          setHeaderState('hidden');
        } else {
          setHeaderState('visible');
        }
        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#020817';
    document.documentElement.style.backgroundColor = '#020817';
    return () => {
      document.body.style.backgroundColor = prev;
      document.documentElement.style.backgroundColor = '';
    };
  }, []);
  const triggerRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['currentUser'] }),
      queryClient.invalidateQueries({ queryKey: ['checkIns'] }),
      queryClient.invalidateQueries({ queryKey: ['friendPosts'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['friends'] }),
      queryClient.invalidateQueries({ queryKey: ['weeklyWorkoutLogs'] }),
    ]);
  };
  useEffect(() => {
    const onHomeButtonClick = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerRefresh();
    };
    window.addEventListener('homeButtonClicked', onHomeButtonClick);
    return () => window.removeEventListener('homeButtonClicked', onHomeButtonClick);
  }, [queryClient]);
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try { return await base44.auth.me(); }
      catch (error) { console.error('Auth error:', error); return null; }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  useEffect(() => {
    injectStreakStyles();
    if (!currentUser) return;
    const todayDow = new Date().getDay();
    const todayAdjustedDay = todayDow === 0 ? 7 : todayDow;
    // Don't show freeze/streak loss popups on rest days — rest days have no impact on streak
    const trainingDaysForCheck = currentUser?.training_days || [];
    const isTodayRestDay = trainingDaysForCheck.length > 0 && !trainingDaysForCheck.includes(todayAdjustedDay);
    if (isTodayRestDay) return;

    const checkMissedWorkouts = async () => {
      try {
        const result = await base44.functions.invoke('checkMissedWorkoutsAndConsumeFreezes', {});
        if (result.data?.shouldShowAnimation) {
          setFreezeAnimationData({
            freezesLostCount: result.data.freezesLostCount,
            finalFreezeCount: result.data.currentFreezes,
          });
          setShowFreezeAnimation(true);
        }
      } catch (error) {
        console.error('Error checking missed workouts:', error);
      }
    };
    const checkStreakLoss = async () => {
      try {
        const result = await base44.functions.invoke('checkStreakLoss', {});
        if (result.data?.shouldShowAnimation) {
          setStreakLossAnimationData({
            previousStreak: result.data.previousStreak,
          });
          setShowStreakLossAnimation(true);
        }
      } catch (error) {
        console.error('Error checking streak loss:', error);
      }
    };
    checkMissedWorkouts();
    checkStreakLoss();
  }, [currentUser?.id]);
  useEffect(() => {
    return () => { celebTimers.current.forEach(clearTimeout); };
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFriendSearch(sanitiseUsernameQuery(friendSearchQuery)), 300);
    return () => clearTimeout(t);
  }, [friendSearchQuery]);
  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const primaryGymIdForQuery = currentUser?.primary_gym_id || (gymMemberships.length > 0 ? gymMemberships[0]?.gym_id : null);
  const { data: allMemberGyms = [] } = useQuery({
    queryKey: ['memberGyms', gymMemberships.map(m => m.gym_id).join(',')],
    queryFn: () => {
      const gymIds = gymMemberships.map(m => m.gym_id);
      return gymIds.length > 0 ? base44.entities.Gym.filter({ id: { $in: gymIds } }) : Promise.resolve([]);
    },
    enabled: gymMemberships.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const memberGymData = allMemberGyms.find(g => g.id === primaryGymIdForQuery) || allMemberGyms[0] || null;
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
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
  });
  const { data: friends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser?.id, status: 'accepted' }, '-created_date', 200),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const friendIdList = friends.map((f) => f.friend_id);
  const { data: allPosts = [] } = useQuery({
    queryKey: ['friendPosts', currentUser?.id, friendIdList.join(',')],
    queryFn: () => {
      const authorIds = [...friendIdList, currentUser?.id].filter(Boolean);
      return base44.entities.Post.filter(
        { member_id: { $in: authorIds }, is_system_generated: false },
        '-created_date',
        200
      );
    },
    enabled: !!currentUser && friendIdList.length > 0,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const { data: friendRequests = [] } = useQuery({
    queryKey: ['friendRequests', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ friend_id: currentUser?.id, status: 'pending' }, '-created_date', 50),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const { data: sentFriendRequests = [] } = useQuery({
    queryKey: ['sentFriendRequests', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser?.id, status: 'pending' }, '-created_date', 50),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const POSTS_PER_PAGE = 4;
  const knownUserIds = [...friends.map(f => f.friend_id), ...friendRequests.map(r => r.user_id), ...sentFriendRequests.map(r => r.friend_id)];
  const { data: friendUsersList = [] } = useQuery({
    queryKey: ['friendUsers', knownUserIds.join(',')],
    queryFn: () => base44.entities.User.filter({ id: { $in: knownUserIds } }),
    enabled: knownUserIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: allRecentCheckIns = [] } = useQuery({
    queryKey: ['checkIns', 'friendFeed', friendIdList.join(',')],
    queryFn: () => friendIdList.length === 0 ? [] : base44.entities.CheckIn.filter(
      { user_id: { $in: friendIdList }, check_in_date: { $gte: thirtyDaysAgo } },
      '-check_in_date',
      200
    ),
    enabled: !!currentUser && friendIdList.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: prev => prev,
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
    queryKey: ['searchUsers', debouncedFriendSearch],
    queryFn: () => base44.functions.invoke('searchUsers', { query: debouncedFriendSearch.trim(), searchBy: 'username', limit: 5 }).then(res => res.data.users || []),
    enabled: debouncedFriendSearch.trim().length >= 2,
    staleTime: 30000,
  });
  const addFriendMutation = useMutation({
    mutationFn: (friendUser) => base44.functions.invoke('manageFriendship', { friendId: friendUser.id, action: 'add' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['sentFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      setFriendSearchQuery('');
    },
  });
  const acceptFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', { friendId, action: 'accept' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['friends', currentUser?.id] });
    },
  });
  const rejectFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', { friendId, action: 'reject' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friendRequests', currentUser?.id] }),
  });
  const removeFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', { friendId, action: 'remove' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends', currentUser?.id] }),
  });
  const cancelFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', { friendId, action: 'remove' }),
    onMutate: (friendId) => { queryClient.setQueryData(['sentFriendRequests', currentUser?.id], (old = []) => old.filter(r => r.friend_id !== friendId)); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['sentFriendRequests', currentUser?.id] }); },
  });
  const todayCheckInsForQuery = allCheckIns.filter((c) => isToday(new Date(c.check_in_date)));
  const checkInUserIdsForQuery = [...new Set(todayCheckInsForQuery.map((c) => c.user_id))];
  const { data: checkInUsers = [] } = useQuery({
    queryKey: ['checkInUsers', checkInUserIdsForQuery.join(',')],
    queryFn: () => base44.entities.User.filter({ id: { $in: checkInUserIdsForQuery } }),
    enabled: checkInUserIdsForQuery.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
  const { data: weeklyWorkoutLogs = [] } = useQuery({
    queryKey: ['weeklyWorkoutLogs', currentUser?.id],
    queryFn: () => {
      const monday = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];
      return base44.entities.WorkoutLog.filter(
        { user_id: currentUser?.id, completed_date: { $gte: monday } }
      );
    },
    enabled: !!currentUser?.id,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  useEffect(() => {
    if (currentUser && !currentUser.onboarding_completed) {
      navigate(createPageUrl('Onboarding'), { replace: true });
    }
  }, [currentUser?.onboarding_completed, navigate]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        {/* Header skeleton */}
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-700/60 animate-pulse" />
            <div className="w-8 h-5 rounded bg-slate-700/60 animate-pulse" />
          </div>
          <div className="w-32 h-5 rounded bg-slate-700/60 animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-slate-700/60 animate-pulse" />
        </div>
        <div className="max-w-4xl mx-auto px-4 space-y-4 pb-4">
          {/* Check-in card skeleton */}
          <div className="rounded-2xl bg-slate-800/60 animate-pulse h-40" />
          {/* Friends row skeleton */}
          <div className="flex gap-3 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-slate-700/60 animate-pulse" />
                <div className="w-10 h-2.5 rounded bg-slate-700/60 animate-pulse" />
              </div>
            ))}
          </div>
          {/* Feed card skeletons */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-slate-800/60 p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-700/60" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 rounded bg-slate-700/60 w-1/3" />
                  <div className="h-2.5 rounded bg-slate-700/60 w-1/5" />
                </div>
              </div>
              <div className="h-3 rounded bg-slate-700/60 w-5/6" />
              <div className="h-3 rounded bg-slate-700/60 w-2/3" />
            </div>
          ))}
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
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const socialFeedPosts = allPosts.filter(post =>
    (friendIdList.includes(post.member_id) || post.member_id === currentUser?.id) &&
    (post.content || post.image_url || post.video_url || post.workout_name) &&
    !post.gym_join &&
    !post.is_hidden &&
    new Date(post.created_date) >= threeDaysAgo
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
    // Calculate duration: prefer workoutStartTime (timer), fallback to today's check-in time
    const nowMs = Date.now();
    let durationMins = 0;
    if (workoutStartTime) {
      durationMins = Math.round((nowMs - workoutStartTime) / 60000);
    } else {
      const todayCI = allCheckIns.find(c => c.user_id === currentUser?.id && isToday(new Date(c.check_in_date)));
      if (todayCI) {
        durationMins = Math.round((nowMs - new Date(todayCI.check_in_date).getTime()) / 60000);
      }
    }
    setWorkoutStartTime(null);
    await queryClient.invalidateQueries({ queryKey: ['checkIns', currentUser?.id] });
    await queryClient.invalidateQueries({ queryKey: ['weeklyWorkoutLogs', currentUser?.id] });
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const freshUser = queryClient.getQueryData(['currentUser']);
    const newStreak = freshUser?.current_streak || userStreak + 1;
    setCelebrationStreakNum(newStreak);
    setCelebrationChallenges(challengesData);
    setCelebrationExercises(exercises);
    setCelebrationWorkoutName(workoutName);
    setCelebrationPreviousExercises(previousExercises);
    setCelebrationDurationMinutes(durationMins > 0 ? durationMins : 0);
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
        onClick={() => {
          setShowFriendsModal(true);
          setFriendsModalViewed(true);
        }}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 -mr-2 text-white/70 hover:text-white active:scale-90 active:opacity-60 transition-all duration-100 transform-gpu">
        <Users className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
        {!friendsModalViewed && (friendRequests.length > 0 || sentFriendRequests.some(r => {
          const friend = friendUsersList.find(u => u.id === r.friend_id);
          return friend && friends.some(f => f.friend_id === r.friend_id);
        })) && (
          <div className="absolute top-0 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
        )}
      </button>
    </div>
  );
  return (
    <PullToRefresh onRefresh={triggerRefresh}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        {/* ── Fixed header ── */}
        <div
          className="fixed top-0 left-0 right-0 z-50"
          style={{
            opacity: headerState === 'hidden' ? 0 : 1,
            transform: headerState === 'hidden' ? 'translateY(-6px)' : 'translateY(0)',
            pointerEvents: headerState === 'hidden' ? 'none' : 'auto',
            background: headerState === 'top'
              ? 'linear-gradient(to bottom, rgba(30,41,59,0.4), transparent)'
              : 'rgba(15, 23, 42, 0.88)',
            backdropFilter: headerState === 'top' ? 'none' : 'blur(16px)',
            WebkitBackdropFilter: headerState === 'top' ? 'none' : 'blur(16px)',
            borderBottom: headerState === 'top' ? 'none' : '1px solid rgba(255,255,255,0.07)',
            paddingTop: 'env(safe-area-inset-top)',
            transition: 'opacity 250ms ease, transform 250ms ease, background 200ms ease, backdrop-filter 200ms ease, border-color 200ms ease',
          }}>
          <div className="px-4 py-2.5">
            <HeaderContent compact={true} />
          </div>
        </div>
        {/* Ghost spacer */}
        <div className="px-4 py-2.5 opacity-0 pointer-events-none" aria-hidden="true">
          <HeaderContent compact={true} />
        </div>
        <div className={`max-w-4xl mx-auto px-4 py-2 pb-32 ${daysSinceCheckIn === 0 ? 'space-y-2' : 'space-y-3'}`}>
          {memberGym && (
            <>
              {showCheckInButton && !userCheckIns.some((c) => isToday(new Date(c.check_in_date))) && (
                <LocationBasedCheckInButton
                  gyms={allMemberGyms}
                  onCheckInSuccess={() => setWorkoutStartTime(Date.now())}
                  gymMemberships={gymMemberships} />
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
                              <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover border-2 border-green-700" loading="lazy" />
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
                <TodayWorkout currentUser={currentUser} workoutStartTime={workoutStartTime} onWorkoutStart={() => setWorkoutStartTime(Date.now())} onWorkoutLogged={handleWorkoutLogged} onOverrideDayChange={setWorkoutOverrideDay} checkedInToday={userCheckIns.some((c) => isToday(new Date(c.check_in_date)))} />
              ) : (
                <Card className="rounded-xl p-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                  <div className="relative space-y-2">
                    <h3 className="text-[11px] font-bold text-slate-100 tracking-tight uppercase">Create Workout Split</h3>
                    <button
                      onClick={() => setShowSplitModal(true)}
                      className="w-full p-2 rounded-lg bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-semibold text-xs flex items-center justify-center border border-transparent shadow-[0_3px_0_0_#1e40af,0_8px_20px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                      Start Building
                    </button>
                  </div>
                </Card>
              )}
            </div>
          )}
          {/* ── Community card — static, no entrance animations ── */}
          {memberGym?.id && (
            <div
              className="active:scale-[0.97] active:translate-y-0.5 transition-transform duration-100"
              style={{ WebkitTapHighlightColor: 'transparent' }}>
              <Link to={createPageUrl('GymCommunity') + `?id=${memberGym.id}`} className="block">
                <Card className="rounded-xl text-card-foreground cursor-pointer relative h-40 overflow-hidden group" style={{ background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                  {memberGym?.image_url ? (
                    <img src={memberGym.image_url} alt={memberGym.name} className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:opacity-100 transition-opacity" loading="eager" fetchpriority="high" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 opacity-60 group-hover:opacity-70 transition-opacity" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />
                  <div className="relative p-6 h-full flex flex-col justify-between">
                    <div>
                      <p className="text-white font-semibold text-base tracking-tight">
                        Your Community
                      </p>
                      <p className="text-slate-300 text-sm mt-1 font-medium">
                        {memberGym.name}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-medium">
                        {getCommunityText()}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center -space-x-2">
                          {checkInUsers.slice(0, 2).map((user) => (
                            <div key={user.id} className="relative">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name} className="w-6 h-6 rounded-full object-cover border-2 border-slate-700" loading="lazy" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-[9px] font-bold border-2 border-slate-700">
                                  {user.full_name?.[0] || 'U'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
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
                  const done = loggedDays.has(day) || (MOCK_MODE && trainingDays.includes(day));
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
          <ActivityFeedSection
            friends={friends}
            filteredActivityCards={filteredActivityCards}
            activityFeed={activityFeed}
            socialFeedPosts={socialFeedPosts}
            currentUser={currentUser}
            queryClient={queryClient}
            dismissCard={dismissCard}
          />
          {gymMemberships.length === 0 && currentUser?.account_type !== 'gym_owner' && primaryGymIdForQuery === null && (
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
      {/* Streak Freeze Animation */}
      <StreakFreezeAnimation
        isOpen={showFreezeAnimation}
        freezesLostCount={freezeAnimationData.freezesLostCount}
        finalFreezeCount={freezeAnimationData.finalFreezeCount}
        onComplete={() => setShowFreezeAnimation(false)}
      />
      {/* Streak Loss Animation */}
      <StreakLossAnimation
        isOpen={showStreakLossAnimation}
        previousStreak={streakLossAnimationData.previousStreak}
        onComplete={() => setShowStreakLossAnimation(false)}
      />
      <StreakCelebration
        showStreakCelebration={showStreakCelebration}
        celebrationStreakNum={celebrationStreakNum}
        showChallengesCelebration={showChallengesCelebration}
        celebrationChallenges={celebrationChallenges}
        showShareWorkout={showShareWorkout}
        celebrationWorkoutName={celebrationWorkoutName}
        celebrationExercises={celebrationExercises}
        celebrationPreviousExercises={celebrationPreviousExercises}
        celebrationDurationMinutes={celebrationDurationMinutes}
        currentUser={currentUser}
        showDaysCelebration={showDaysCelebration}
        weeklyWorkoutLogs={weeklyWorkoutLogs}
        todayDowAdjusted={todayDowAdjusted}
        setShowShareWorkout={setShowShareWorkout}
        setShowDaysCelebration={setShowDaysCelebration}
        setJustLoggedDay={setJustLoggedDay}
      />
      <StreakVariantPicker isOpen={showStreakVariants} onClose={() => setShowStreakVariants(false)} onSelect={handleStreakVariantSelect} selectedVariant={streakVariant} streakFreezes={currentUser?.streak_freezes || 0} />
      <JoinWithCodeModal open={showJoinModal} onClose={() => setShowJoinModal(false)} currentUser={currentUser} gymCount={gymMemberships.length} />
      <CreateSplitModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} currentUser={currentUser} />
      <FriendsSection
        showFriendsModal={showFriendsModal}
        setShowFriendsModal={(val) => {
          setShowFriendsModal(val);
          if (val) setFriendsModalViewed(true);
        }}
        showAddFriendModal={showAddFriendModal}
        setShowAddFriendModal={setShowAddFriendModal}
        confirmRemoveFriend={confirmRemoveFriend}
        setConfirmRemoveFriend={setConfirmRemoveFriend}
        friendMenuOpen={friendMenuOpen}
        setFriendMenuOpen={setFriendMenuOpen}
        pendingMenuOpen={pendingMenuOpen}
        setPendingMenuOpen={setPendingMenuOpen}
        friendSearchQuery={friendSearchQuery}
        setFriendSearchQuery={setFriendSearchQuery}
        friendsListSearchQuery={friendsListSearchQuery}
        setFriendsListSearchQuery={setFriendsListSearchQuery}
        sentFriendRequests={sentFriendRequests}
        friendUsersList={friendUsersList}
        friendRequests={friendRequests}
        friends={friends}
        friendsWithActivity={friendsWithActivity}
        filteredSearchResults={filteredSearchResults}
        acceptFriendMutation={acceptFriendMutation}
        rejectFriendMutation={rejectFriendMutation}
        removeFriendMutation={removeFriendMutation}
        cancelFriendMutation={cancelFriendMutation}
        addFriendMutation={addFriendMutation}
      />
      {/* ── Workout Summary Modal ── */}
      <WorkoutSummaryModal summaryLog={summaryLog} onClose={() => setSummaryLog(null)} />
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
                {exercises.length > 0 ? (() => {
                  // Group exercises by name — same logic as TodayWorkout
                  const groups = [];
                  const nameToGroupIdx = {};
                  exercises.forEach((ex, index) => {
                    const key = (ex.exercise || ex.name || '').trim().toLowerCase();
                    if (!key) {
                      groups.push({ key: `__empty_${index}`, name: ex.exercise || ex.name || '', items: [{ ex, index }] });
                      return;
                    }
                    if (nameToGroupIdx[key] === undefined) {
                      nameToGroupIdx[key] = groups.length;
                      groups.push({ key, name: ex.exercise || ex.name, items: [{ ex, index }] });
                    } else {
                      groups[nameToGroupIdx[key]].items.push({ ex, index });
                    }
                  });

                  return (
                    <div className="space-y-2">
                      <div className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 mb-1.5 items-end px-2 -mx-2">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-4">Sets</div>
                        <div />
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-5">Reps</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2.5">Weight</div>
                      </div>
                      <div className="space-y-2 -mx-2">
                        {groups.map((group) => {
                          const isGrouped = group.items.length > 1;

                          if (!isGrouped) {
                            const { ex, index } = group.items[0];
                            const exName = ex.exercise || ex.name || ex.title || `Exercise ${index + 1}`;
                            const setsRepsStr = String(ex.setsReps || ex.sets_reps || ex.set_reps || '');
                            const srParts = /[xX]/.test(setsRepsStr) ? setsRepsStr.split(/[xX]/).map(s => s.trim()) : [];
                            const rawSets = ex.sets ?? ex.set_count ?? ex.num_sets;
                            const sets = (rawSets !== undefined && rawSets !== null && String(rawSets) !== '') ? String(rawSets) : srParts[0] || '-';
                            const rawReps = ex.reps ?? ex.rep_count ?? ex.num_reps;
                            const reps = (rawReps !== undefined && rawReps !== null && String(rawReps) !== '') ? String(rawReps) : srParts[1] || '-';
                            const rawWeight = ex.weight_kg ?? ex.weight_lbs ?? ex.weight;
                            const weight = (rawWeight !== undefined && rawWeight !== null && String(rawWeight) !== '') ? String(rawWeight) : '-';
                            return (
                              <div key={group.key} className="bg-white/5 pt-2 pb-2 pl-2 rounded-xl border border-white/10 grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 items-center">
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
                          }

                          // Grouped (multi-set) — sort heaviest first = Set 1
                          const sorted = [...group.items].sort(
                            (a, b) => (parseFloat(b.ex.weight_kg ?? b.ex.weight_lbs ?? b.ex.weight) || 0) - (parseFloat(a.ex.weight_kg ?? a.ex.weight_lbs ?? a.ex.weight) || 0)
                          );
                          return (
                            <div key={group.key} className="bg-white/5 pt-2 pb-2 pl-2 rounded-xl border border-white/10">
                              {sorted.map(({ ex, index }, setIdx) => {
                                const setLabel = `Set ${setIdx + 1}`;
                                const rawReps = ex.reps ?? ex.rep_count ?? ex.num_reps;
                                const setsRepsStr = String(ex.setsReps || '');
                                const srParts = /[xX]/.test(setsRepsStr) ? setsRepsStr.split(/[xX]/).map(s => s.trim()) : [];
                                const reps = (rawReps !== undefined && rawReps !== null && String(rawReps) !== '') ? String(rawReps) : srParts[1] || '-';
                                const rawWeight = ex.weight_kg ?? ex.weight_lbs ?? ex.weight;
                                const weight = (rawWeight !== undefined && rawWeight !== null && String(rawWeight) !== '') ? String(rawWeight) : '-';
                                return (
                                  <div key={index} className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 items-center pr-2 mb-1">
                                    <div className="ml-1">
                                      {setIdx === 0
                                        ? <div className="text-sm font-bold text-white leading-tight">{group.name}</div>
                                        : <div />}
                                    </div>
                                    <div className="bg-white/10 text-slate-300 py-1 text-[11px] font-bold text-center rounded-lg flex items-center justify-center ml-3" style={{ width: '36px' }}>{setLabel}</div>
                                    <div className="text-slate-400 text-xs font-bold flex items-center justify-center ml-4">×</div>
                                    <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center ml-2" style={{ width: '36px' }}>{reps}</div>
                                    <div className="ml-3 pr-1">
                                      <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white pb-1 pl-1 pt-1 text-sm font-black text-center rounded-2xl shadow-md shadow-blue-900/20 min-w-[55px]">
                                        {weight}<span className="text-[10px] font-bold">kg</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })() : (
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