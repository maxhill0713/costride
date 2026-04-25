import React, { useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '../components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users } from 'lucide-react';
import NotificationBanner from '../components/NotificationBanner';
import { AnimatePresence, motion } from 'framer-motion';
import FriendsIcon from '../components/FriendsIcon';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import PostCard from '../components/feed/PostCard';
import FeedPollCard from '../components/feed/FeedPollCard';
import TodayWorkout from '../components/profile/TodayWorkout';
import StreakVariantPicker from '../components/StreakVariantPicker';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import QuoteCarousel from '../components/home/QuoteCarousel';
import StreakFreezeAnimation from '../components/home/StreakFreezeAnimation';
import StreakLossAnimation from '../components/home/StreakLossAnimation';
import WorkoutSummaryModal from '../components/home/WorkoutSummaryModal';
import StreakCelebration from '../components/home/StreakCelebration';
import ChallengeCompletionCelebration, { getUnseenCompletions } from '../components/home/ChallengeCompletionCelebration';
import FriendsSection from '../components/home/FriendsSection';
import { useState } from 'react';
import { isToday, differenceInDays, startOfWeek, startOfDay } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import LocationBasedCheckInButton from '../components/gym/LocationBasedCheckInButton';
import { getSwappedRestDay, getRestSwap, getCreditRestDay, getRestDayOverride } from '../lib/weekSwaps.js';

const sanitiseUsernameQuery = (v) =>
  v.replace(/[^a-zA-Z0-9_.\- ]/g, '').slice(0, 30);

const MONTHLY_CHALLENGES_LOOKUP = {
  discipline_builder: {
    title: 'Discipline Builder',
    description: 'Log 15 workouts this month',
    target_value: 15,
    reward: '💪 Discipline Builder Badge',
    rewardType: 'badge',
    rewardValue: 'discipline_builder',
    emoji: '📅',
  },
  witness_my_gains: {
    title: 'Witness My Gains',
    description: 'Share 4 of your workouts with your community',
    target_value: 4,
    reward: '1 x Spartan Streak Icon Design',
    rewardType: 'streak_icon',
    rewardValue: 'spartan',
    emoji: '⚔️',
  },
  weekend_warrior: {
    title: 'Weekend Warrior',
    description: 'Log your workout on Saturday or Sunday 5 times!',
    target_value: 5,
    reward: '1 x Streak Freeze',
    rewardType: 'freezes',
    rewardValue: 1,
    emoji: '🏋️',
  },
};

const POSE_1_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png';
const POSE_2_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/8d4e06e17_Pose2_V21.png';
const SPARTAN_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/a72ee034d_spartan.png';
const BEACH_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/9766d8d41_BEACH.png';

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

function ArrowButton({ direction, disabled, onPress }) {
  const [pressed, setPressed] = useState(false);
  const facePoints = direction === 'left' ? '8,1 1,6.5 8,12' : '1,1 8,6.5 1,12';
  const shadowPoints = direction === 'left' ? '9,2 2,7.5 9,13' : '0,2 7,7.5 0,13';
  const highlightPoints = direction === 'left' ? '8,1 1,6.5' : '1,1 8,6.5';
  const shadowEdgePoints = direction === 'left' ? '1,6.5 8,12' : '8,6.5 1,12';
  return (
    <button
      onPointerDown={() => { if (!disabled) setPressed(true); }}
      onPointerUp={() => { if (!disabled && pressed) { setPressed(false); onPress(); } }}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        width: 20, height: 52, background: 'none', border: 'none', padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', outline: 'none',
        opacity: disabled ? 0 : pressed ? 0.4 : 1,
        transition: 'opacity 0.1s ease',
        pointerEvents: disabled ? 'none' : 'auto',
      }}>
      <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
        <polygon points={shadowPoints} fill="rgba(0,0,0,0.4)" transform="translate(0.6,1.4)" />
        <polygon points={facePoints} fill="#64748b" />
        <polyline points={highlightPoints} stroke="rgba(148,163,184,0.5)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <polyline points={shadowEdgePoints} stroke="rgba(0,0,0,0.35)" strokeWidth="1" strokeLinecap="round" fill="none" />
      </svg>
    </button>
  );
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
  const [optimisticCheckedIn, setOptimisticCheckedIn] = useState(false);
  const [checkedInGymId, setCheckedInGymId] = useState(null);
  const [checkedInGymName, setCheckedInGymName] = useState(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showChallengesCelebration, setShowChallengesCelebration] = useState(false);
  const [showShareWorkout, setShowShareWorkout] = useState(false);
  const [showDaysCelebration, setShowDaysCelebration] = useState(false);
  const [showFreezeAnimation, setShowFreezeAnimation] = useState(false);
  const [freezeAnimationData, setFreezeAnimationData] = useState({ freezesLostCount: 0, finalFreezeCount: 0 });
  const [postRemovedNotif, setPostRemovedNotif] = useState(null);
  const [dismissedPostRemovedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('dismissedPostRemovedNotifs') || '[]')); }
    catch { return new Set(); }
  });
  const [showStreakLossAnimation, setShowStreakLossAnimation] = useState(false);
  const [streakLossAnimationData, setStreakLossAnimationData] = useState({ previousStreak: 0 });
  const [celebrationStreakNum, setCelebrationStreakNum] = useState(0);
  const [celebrationChallenges, setCelebrationChallenges] = useState([]);
  const [celebrationExercises, setCelebrationExercises] = useState([]);
  const [celebrationWorkoutName, setCelebrationWorkoutName] = useState('');
  const [celebrationPreviousExercises, setCelebrationPreviousExercises] = useState([]);
  const [celebrationDurationMinutes, setCelebrationDurationMinutes] = useState(0);
  const [challengeCompletionVariant, setChallengeCompletionVariant] = useState(null);
  const [justLoggedDay, setJustLoggedDay] = useState(null);
  const [activeCircleDay, setActiveCircleDay] = useState(null);
  const [bubblePos, setBubblePos] = useState(null);
  const [summaryLog, setSummaryLog] = useState(null);
  const [viewWorkoutDay, setViewWorkoutDay] = useState(null);
  const [pressedDay, setPressedDay] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [slideDirection, setSlideDirection] = useState(0);
  const [, forceUpdateSwaps] = useState(0);
  const celebTimers = useRef([]);

  // ── Swipe state for the weekly circles ────────────────────────────────────
  const swipeStartXRef = useRef(null);
  const swipeStartYRef = useRef(null);
  // Live drag offset applied directly to the circles container (no state — uses ref + DOM for perf)
  const circlesInnerRef = useRef(null);
  const swipeDragXRef = useRef(0);
  const isSwipingRef = useRef(false);
  // We still keep a small state flag so the pointerUp handler can read it reliably
  const [swipeCommitted, setSwipeCommitted] = useState(false);
  // ─────────────────────────────────────────────────────────────────────────

  const [headerState, setHeaderState] = useState('top');
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Width of the circles row — measured on mount / resize
  const circlesContainerRef = useRef(null);
  const circlesRowWidthRef = useRef(280); // sensible default

  useEffect(() => {
    const measure = () => {
      if (circlesContainerRef.current) {
        circlesRowWidthRef.current = circlesContainerRef.current.offsetWidth;
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const anyCelebrationActive = showStreakCelebration || showChallengesCelebration || showShareWorkout || showDaysCelebration || showFreezeAnimation || showStreakLossAnimation || !!challengeCompletionVariant;
  useEffect(() => {
    if (anyCelebrationActive) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [anyCelebrationActive]);

  useEffect(() => {
  const handler = () => {
    if (celebrationChallenges.length > 0) {
      setShowChallengesCelebration(true);
    } else {
      setShowShareWorkout(true);
    }
    setShowStreakCelebration(false);
  };
  document.addEventListener('streakCelebrationContinue', handler);
  return () => document.removeEventListener('streakCelebrationContinue', handler);
}, [celebrationChallenges]);

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
    const handleSwapChanged = () => forceUpdateSwaps(n => n + 1);
    window.addEventListener('weekSwapChanged', handleSwapChanged);
    return () => window.removeEventListener('weekSwapChanged', handleSwapChanged);
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
      queryClient.invalidateQueries({ queryKey: ['posts'] }),
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
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    injectStreakStyles();
    if (!currentUser) return;
    const checkMissedWorkouts = async () => {
      try {
        const result = await base44.functions.invoke('checkMissedWorkoutsAndConsumeFreezes', {
          restSwap: getRestSwap(),
          creditRestDay: getCreditRestDay(),
          restDayOverride: (() => {
            try {
              const stored = localStorage.getItem('workoutOverrideDay');
              const storedDate = localStorage.getItem('workoutOverrideDayDate');
              const todayStr = new Date().toISOString().split('T')[0];
              if (stored && storedDate === todayStr) return parseInt(stored);
              return null;
            } catch { return null; }
          })(),
        });
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
          setStreakLossAnimationData({ previousStreak: result.data.previousStreak });
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

  useEffect(() => {
    if (!notifications.length) return;
    const unread = notifications.find(n => n.type === 'post_removed' && !n.read && !dismissedPostRemovedIds.has(n.id));
    if (unread && !postRemovedNotif) {
      setPostRemovedNotif(unread);
    }
  }, [notifications]);

  const dismissPostRemovedNotif = async () => {
    if (!postRemovedNotif) return;
    dismissedPostRemovedIds.add(postRemovedNotif.id);
    localStorage.setItem('dismissedPostRemovedNotifs', JSON.stringify([...dismissedPostRemovedIds]));
    try { await base44.entities.Notification.update(postRemovedNotif.id, { read: true }); } catch {}
    setPostRemovedNotif(null);
  };

  const { data: friends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser?.id, status: 'accepted' }, '-created_date', 200),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const friendIdList = useMemo(() => friends.map((f) => f.friend_id), [friends]);

  const { data: allPosts = [] } = useQuery({
    queryKey: ['friendPosts', currentUser?.id, friendIdList.join(','), primaryGymIdForQuery],
    queryFn: () =>
      base44.functions.invoke('getSocialFeedPosts', {
        friendIds: friendIdList,
        primaryGymId: primaryGymIdForQuery || null,
        limit: 200,
      }).then(res => res.data?.posts || []),
    enabled: !!currentUser,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: gymPolls = [] } = useQuery({
    queryKey: ['gymPolls', primaryGymIdForQuery],
    queryFn: () =>
      base44.functions.invoke('getSocialFeedPosts', {
        friendIds: [],
        primaryGymId: primaryGymIdForQuery,
        limit: 1,
        fetchPolls: true,
      }).then(res => res.data?.polls || []),
    enabled: !!primaryGymIdForQuery,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: friendRequests = [] } = useQuery({
    queryKey: ['friendRequests', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ friend_id: currentUser?.id, status: 'pending' }, '-created_date', 50),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: sentFriendRequests = [] } = useQuery({
    queryKey: ['sentFriendRequests', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser?.id, status: 'pending' }, '-created_date', 50),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const allFriendAndRequestIds = useMemo(() => {
    const ids = new Set([...friends.map(f => f.friend_id), ...friendRequests.map(r => r.user_id), ...sentFriendRequests.map(r => r.friend_id)]);
    return Array.from(ids);
  }, [friends, friendRequests, sentFriendRequests]);

  const { data: friendUsersList = [] } = useQuery({
    queryKey: ['friendUsersList', allFriendAndRequestIds.join(',')],
    queryFn: () => allFriendAndRequestIds.length > 0
      ? base44.functions.invoke('getFriendUsers', { userIds: allFriendAndRequestIds }).then(r => r.data?.users || [])
      : Promise.resolve([]),
    enabled: allFriendAndRequestIds.length > 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['userSearch', debouncedFriendSearch],
    queryFn: () => base44.functions.invoke('searchUsers', { query: debouncedFriendSearch }).then(r => r.data?.users || []),
    enabled: debouncedFriendSearch.trim().length >= 2,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });

  const { data: recentLifts = [] } = useQuery({
    queryKey: ['recentLifts', friendIdList.join(',')],
    queryFn: () => friendIdList.length > 0
      ? base44.entities.Lift.filter({ member_id: { $in: friendIdList }, is_pr: true }, '-created_date', 50)
      : Promise.resolve([]),
    enabled: friendIdList.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Reset optimistic flag once the real query catches up (or on a new day)
  useEffect(() => {
    if (optimisticCheckedIn && userCheckIns.some(c => c.check_in_date?.startsWith(todayStr))) {
      setOptimisticCheckedIn(false);
    }
  }, [allCheckIns, todayStr]);

  const todayCheckInsForQuery = useMemo(
    () => allCheckIns.filter(c => c.check_in_date?.startsWith(todayStr) && c.gym_id === primaryGymIdForQuery),
    [allCheckIns, todayStr, primaryGymIdForQuery]
  );
  const checkInUsers = useMemo(() => {
    const seen = new Set();
    return allCheckIns
      .filter(c => c.check_in_date?.startsWith(todayStr) && c.gym_id === primaryGymIdForQuery)
      .filter(c => { if (seen.has(c.user_id)) return false; seen.add(c.user_id); return true; })
      .map(c => ({ user_id: c.user_id, display_name: c.user_name, username: c.user_name, avatar_url: null }));
  }, [allCheckIns, todayStr, primaryGymIdForQuery]);

  const checkInUserIds = useMemo(() => checkInUsers.map(u => u.user_id), [checkInUsers]);
  const { data: checkInAvatars = {} } = useQuery({
    queryKey: ['checkInAvatars', checkInUserIds.join(',')],
    queryFn: async () => {
      if (checkInUserIds.length === 0) return {};
      const res = await base44.functions.invoke('getUserAvatars', { userIds: checkInUserIds });
      return res.data?.avatars || {};
    },
    enabled: checkInUserIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
  const enrichedCheckInUsers = useMemo(() => checkInUsers.map(u => ({
    ...u,
    avatar_url: checkInAvatars[u.user_id]?.avatar_url || null,
    display_name: checkInAvatars[u.user_id]?.full_name || u.display_name,
  })), [checkInUsers, checkInAvatars]);

  const acceptFriendMutation = useMutation({
    mutationFn: async (userId) => {
      const req = friendRequests.find(r => r.user_id === userId);
      if (req) await base44.entities.Friend.update(req.id, { status: 'accepted' });
      await base44.entities.Friend.create({ user_id: currentUser.id, friend_id: userId, user_name: currentUser.full_name, friend_name: req?.user_name || '', status: 'accepted' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] })
      .then(() => queryClient.invalidateQueries({ queryKey: ['friendRequests'] })),
  });

  const rejectFriendMutation = useMutation({
    mutationFn: async (userId) => {
      const req = friendRequests.find(r => r.user_id === userId);
      if (req) await base44.entities.Friend.delete(req.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friendRequests'] }),
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendId) => {
      const f1 = friends.find(f => f.friend_id === friendId);
      if (f1) await base44.entities.Friend.delete(f1.id);
      const f2 = await base44.entities.Friend.filter({ user_id: friendId, friend_id: currentUser.id, status: 'accepted' });
      if (f2.length) await base44.entities.Friend.delete(f2[0].id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  });

  const cancelFriendMutation = useMutation({
    mutationFn: async (friendId) => {
      const req = sentFriendRequests.find(r => r.friend_id === friendId);
      if (req) await base44.entities.Friend.delete(req.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sentFriendRequests'] }),
  });

  const addFriendMutation = useMutation({
    mutationFn: async (user) => {
      await base44.entities.Friend.create({ user_id: currentUser.id, friend_id: user.id, user_name: currentUser.full_name, friend_name: user.full_name || user.display_name, friend_avatar: user.avatar_url || null, status: 'pending' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sentFriendRequests'] }),
  });

  useEffect(() => {
    if (currentUser && !currentUser.onboarding_completed && !currentUser.deleted_at) {
      navigate(createPageUrl('Onboarding'), { replace: true });
    }
  }, [currentUser?.onboarding_completed, currentUser?.deleted_at, navigate]);

  const { data: allRecentCheckIns = [] } = useQuery({
    queryKey: ['friendCheckIns', friendIdList.join(',')],
    queryFn: () => base44.functions.invoke('getFriendCheckIns', { friendIds: friendIdList, sinceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }).then(r => r.data?.checkIns || []),
    enabled: !!currentUser?.id && friendIdList.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: userChallengeParticipants = [] } = useQuery({
    queryKey: ['userChallengeParticipants', currentUser?.id],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ user_id: currentUser?.id }, '-created_date', 50),
    enabled: !!currentUser?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: activeAppChallenges = [] } = useQuery({
    queryKey: ['activeAppChallenges'],
    queryFn: () => base44.entities.Challenge.filter({ is_app_challenge: true, status: 'active' }),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // ── Show challenge completion celebration once, 1 s after load ───────────
  // Only fire if the user has ACTUALLY completed a challenge that grants this variant
  // (cross-reference with their ChallengeParticipant records to prevent false positives)
  // NOTE: must be placed AFTER userChallengeParticipants and activeAppChallenges are declared
  useEffect(() => {
    if (!currentUser?.unlocked_streak_variants?.length) return;
    if (!userChallengeParticipants.length) return;
    const unseen = getUnseenCompletions(currentUser.unlocked_streak_variants);
    if (unseen.length === 0) return;
    const completedChallengeIds = new Set(
      userChallengeParticipants.filter(p => p.completed).map(p => p.challenge_id)
    );
    if (completedChallengeIds.size === 0) return;
    const VARIANT_TO_TITLE = {
      beach:   'discipline builder',
      spartan: 'witness my gains',
      mermaid: 'discipline builder',
      pirate:  'witness my gains',
    };
    const confirmedUnseen = unseen.filter(variant => {
      const targetTitle = VARIANT_TO_TITLE[variant];
      if (!targetTitle) return false;
      return activeAppChallenges.some(ch =>
        completedChallengeIds.has(ch.id) &&
        (ch.title || '').toLowerCase().includes(targetTitle)
      );
    });
    if (confirmedUnseen.length === 0) return;
    const t = setTimeout(() => setChallengeCompletionVariant(confirmedUnseen[0]), 1000);
    return () => clearTimeout(t);
  }, [currentUser?.id, currentUser?.unlocked_streak_variants?.join(','), userChallengeParticipants, activeAppChallenges]);

  const { data: weeklyWorkoutLogs = [] } = useQuery({
    queryKey: ['weeklyWorkoutLogs', currentUser?.id, weekOffset],
    queryFn: () => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    base.setDate(base.getDate() + weekOffset * 7);
    const pad = n => String(n).padStart(2, '0');
    const monday = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`;
    const sun = new Date(base);
    sun.setDate(base.getDate() + 6);
    const sundayStr = `${sun.getFullYear()}-${pad(sun.getMonth()+1)}-${pad(sun.getDate())}`;
    return base44.entities.WorkoutLog.filter({
      user_id: currentUser?.id,
      completed_date: { $gte: monday, $lte: sundayStr },
      });
    },
    enabled: !!currentUser?.id,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const memberGym = memberGymData || null;
  const userCheckIns = useMemo(
    () => allCheckIns.filter((c) => c.user_id === currentUser?.id),
    [allCheckIns, currentUser?.id]
  );
  const lastCheckIn = userCheckIns.length > 0 ? userCheckIns[0].check_in_date : null;
  const daysSinceCheckIn = lastCheckIn ? differenceInDays(new Date(), new Date(lastCheckIn)) : null;

  const userStreak = currentUser?.current_streak || 0;
  const streakVariant = currentUser?.streak_variant || 'default';
  const todayDowAdjusted = (() => { const d = new Date().getDay(); return d === 0 ? 7 : d; })();

  const effectiveToday = (() => {
    const now = new Date();
    if (now.getHours() < 3) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
  })();

  const workoutLoggedToday = weeklyWorkoutLogs.some(log => log.completed_date === effectiveToday) || justLoggedDay === todayDowAdjusted;
  // A day is a rest day if: not in training_days, OR it was swapped away (fromDay), UNLESS it was swapped to (toDay).
  // Also a rest day if the user used their credit-rest token on today.
  const restSwapForToday = getRestSwap();
  const todaySwappedToRest = restSwapForToday && restSwapForToday.fromDay === todayDowAdjusted;
  const todaySwappedToTraining = restSwapForToday && restSwapForToday.toDay === todayDowAdjusted;
  const todayCreditRest = getCreditRestDay() === todayDowAdjusted;
  const todayIsRestDay = todayCreditRest
    ? true
    : todaySwappedToRest
      ? true
      : todaySwappedToTraining
        ? false
        : !(currentUser?.training_days || []).includes(todayDowAdjusted);
  const showCheckInButton = !todayIsRestDay || workoutOverrideDay !== null;

  const friendPosts = useMemo(() => allPosts.filter((post) =>
    friendIdList.includes(post.member_id) &&
    !post.is_system_generated &&
    !post.content?.includes('well done') &&
    !post.content?.includes('workout finished')
  ), [allPosts, friendIdList]);

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

  const friendsWithActivity = useMemo(() => friends.map(friend => {
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
  }), [friends, allRecentCheckIns]);

  const socialFeedPosts = useMemo(() => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return allPosts.filter(post =>
      (post.content || post.image_url || post.video_url || post.workout_name) &&
      !post.gym_join &&
      new Date(post.created_date) >= threeDaysAgo
    );
  }, [allPosts, currentUser?.id]);

  // Merge posts and polls into a single chronological feed
  const socialFeedItems = useMemo(() => {
    const livePolls = gymPolls.filter(p => !p.end_date || new Date(p.end_date) >= new Date());
    const pollItems = livePolls.map(p => ({ type: 'poll', id: `poll-${p.id}`, date: new Date(p.created_date || 0), data: p }));
    const postItems = socialFeedPosts.map(p => ({ type: 'post', id: `post-${p.id}`, date: new Date(p.created_date || 0), data: p }));
    return [...pollItems, ...postItems].sort((a, b) => b.date - a.date);
  }, [socialFeedPosts, gymPolls]);

  const activityFeed = useMemo(() => {
    const activities = [];
    const exerciseNames = { bench_press: 'Bench Press', squat: 'Squat', deadlift: 'Deadlift', overhead_press: 'Overhead Press', barbell_row: 'Barbell Row', power_clean: 'Power Clean' };
    const friendPRs = recentLifts.filter(l => l.is_pr && friendIdList.includes(l.member_id));
    friendPRs.forEach(lift => {
      const friend = friends.find(f => f.friend_id === lift.member_id);
      if (differenceInDays(new Date(), new Date(lift.created_date)) <= 7) {
        activities.push({
          id: `pr-${lift.id}`, type: 'pr', friendId: lift.member_id,
          friendName: friend?.friend_name || lift.member_name, friendAvatar: friend?.friend_avatar,
          message: `just hit a new PR — ${lift.weight_lbs}lbs ${exerciseNames[lift.exercise] || lift.exercise}`,
          timestamp: new Date(lift.created_date),
        });
      }
    });
    friendsWithActivity.forEach((friend, idx) => {
      const streak = friend.activity?.streak || 0;
      if (streak > 0 && friend.activity?.daysSinceCheckIn === 0) {
        const rank = idx + 1;
        if (rank <= 3) {
          activities.push({
            id: `leaderboard-${friend.friend_id}`, type: 'leaderboard_rank',
            friendId: friend.friend_id, friendName: friend.friend_name, friendAvatar: friend.friend_avatar,
            rank, message: rank === 1 ? `just took #1 on the weekly consistency leaderboard 👑` : `is sitting at #${rank} on the consistency leaderboard`,
            timestamp: new Date(Date.now() - rank * 60000),
          });
        } else if (streak >= 7 && streak % 7 === 0) {
          activities.push({
            id: `streak-${friend.friend_id}`, type: 'streak',
            friendId: friend.friend_id, friendName: friend.friend_name, friendAvatar: friend.friend_avatar,
            streakCount: streak, message: `just hit a ${streak}-day streak! 🔥`,
            timestamp: new Date(Date.now() - 120000),
          });
        }
      }
    });
    notifications.forEach(n => {
      const text = (n.message || n.title || '').toLowerCase();
      if (differenceInDays(new Date(), new Date(n.created_date)) <= 7 && !text.includes('accepted') && !text.includes('friend request') && !text.includes('official') && !text.includes('gym request')) {
        activities.push({ id: `notif-${n.id}`, type: 'notification', message: n.message || n.title, timestamp: new Date(n.created_date) });
      }
    });
    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }, [recentLifts, friendsWithActivity, friends, friendIdList, notifications]);

  const activityCards = useMemo(() => {
    const cards = [];
    const lastCI = userCheckIns[0];
    const daysSince = lastCI ? differenceInDays(new Date(), new Date(lastCI.check_in_date)) : null;
    if (daysSince && daysSince >= 3) cards.push({ id: 'nudge-checkin', type: 'nudge', title: 'Time to Check In', message: `You haven't checked in in ${daysSince} days. Let's get back on track! 💪`, emoji: '⏰' });
    friendsWithActivity.forEach(friend => {
      if (friend.activity.daysSinceCheckIn >= 7) cards.push({ id: `inactive-${friend.friend_id}`, type: 'friend-inactive', title: `${friend.friend_name} Needs a Nudge`, message: `${friend.friend_name} hasn't checked in for ${friend.activity.daysSinceCheckIn} days.`, emoji: '👋' });
    });
    return cards;
  }, [userCheckIns, friendsWithActivity]);

  const filteredActivityCards = useMemo(
    () => activityCards.filter(c => !dismissedCardIds.has(c.id)),
    [activityCards, dismissedCardIds]
  );
  const filteredSearchResults = useMemo(
    () => searchResults.filter(u => !friendIdList.includes(u.id)),
    [searchResults, friendIdList]
  );

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-700/60 animate-pulse" />
            <div className="w-8 h-5 rounded bg-slate-700/60 animate-pulse" />
          </div>
          <div className="w-32 h-5 rounded bg-slate-700/60 animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-slate-700/60 animate-pulse" />
        </div>
        <div className="max-w-4xl mx-auto px-4 space-y-4 pb-4">
          <div className="rounded-2xl bg-slate-800/60 animate-pulse h-40" />
          <div className="flex gap-3 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-slate-700/60 animate-pulse" />
                <div className="w-10 h-2.5 rounded bg-slate-700/60 animate-pulse" />
              </div>
            ))}
          </div>
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

  const dismissCard = (id) => {
    const updated = new Set(dismissedCardIds).add(id);
    setDismissedCardIds(updated);
    localStorage.setItem('friendsFeedDismissedCards', JSON.stringify(Array.from(updated)));
  };

  const handleWorkoutLogged = async (challengesData = [], exercises = [], workoutName = '', previousExercises = []) => {
    const todayDow = new Date().getDay();
    const todayAdjusted = todayDow === 0 ? 7 : todayDow;
    setJustLoggedDay(todayAdjusted);
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
    await queryClient.invalidateQueries({ queryKey: ['userChallengeParticipants', currentUser?.id] });
    const freshUser = queryClient.getQueryData(['currentUser']);
    const newStreak = freshUser?.current_streak || userStreak + 1;
    setCelebrationStreakNum(newStreak);

    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const monthlyProgress = freshUser?.monthly_challenge_progress || {};
    const isCurrentMonth = monthlyProgress.month === currentMonth;

    const realChallenges = activeAppChallenges.map(ch => {
      const lookup = MONTHLY_CHALLENGES_LOOKUP[ch.id];
      const targetValue = lookup?.target_value || ch.target_value || 30;
      const rawProgress = isCurrentMonth ? (monthlyProgress[ch.id] || 0) : 0;
      // Cap progress at target — never exceed it
      const currentProgress = Math.min(rawProgress, targetValue);
      const previousProgress = Math.max(0, currentProgress - 1);
      return {
        ...ch,
        title:          lookup?.title         || ch.title,
        description:    lookup?.description   || ch.description,
        target_value:   targetValue,
        reward:         lookup?.reward        || ch.reward,
        rewardType:     lookup?.rewardType,
        rewardValue:    lookup?.rewardValue,
        emoji:          lookup?.emoji         || '🏋️',
        previous_value: previousProgress,
        new_value:      currentProgress,
      };
    // Only show challenges that: have progress AND were not already completed before this workout
    }).filter(ch => ch.new_value > 0 && ch.previous_value < ch.target_value);

    const finalChallenges = realChallenges.length > 0 ? realChallenges : challengesData;
    setCelebrationChallenges(finalChallenges);
    setCelebrationExercises(exercises);
    setCelebrationWorkoutName(workoutName);
    setCelebrationPreviousExercises(previousExercises);
    setCelebrationDurationMinutes(durationMins > 0 ? durationMins : 0);

    setShowStreakCelebration(true);
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
    marginTop: 4, width: '100%', padding: '7px 0', borderRadius: 9,
    background: 'linear-gradient(to bottom, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)',
    border: 'none', borderBottom: '3px solid #1e40af',
    color: '#ffffff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
    letterSpacing: '0.03em', textAlign: 'center',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
    transition: 'transform 0.1s ease', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  };

  const viewWorkoutBtnStyle = {
    marginTop: 10, width: '100%', padding: '8px 0', borderRadius: 9,
    background: 'linear-gradient(to bottom, #1e2430 0%, #141820 60%, #0d1017 100%)',
    border: '1px solid rgba(255,255,255,0.10)', borderBottom: '3px solid rgba(0,0,0,0.5)',
    color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
    letterSpacing: '0.04em', textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
    transition: 'transform 0.08s ease, box-shadow 0.08s ease',
    WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  };

  const modalPanelClass = "w-full max-w-sm bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white p-6 max-h-[80vh] overflow-y-auto";

  const HeaderContent = ({ compact = false }) => (
    <div className={`max-w-4xl mx-auto flex items-center justify-center relative px-4 ${compact ? 'py-0' : ''}`}>
      <button
        onClick={() => setShowStreakVariants(true)}
        className="flex items-center hover:opacity-80 transition-opacity absolute left-0 top-1/2 -translate-y-1/2 p-2 -ml-2" style={{ marginTop: '2px' }}>
        <img
          src={streakVariant === 'spartan' ? SPARTAN_ICON_URL : streakVariant === 'beach' ? BEACH_ICON_URL : POSE_1_URL}
          alt="streak"
          className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} animate-[breathe_3s_ease-in-out_infinite]`}
          style={{ objectFit: 'contain', opacity: 1 }} />
        <span
          className={`font-black ${compact ? 'text-lg -ml-1.5 mt-2' : 'text-xl -ml-2 mt-3'} select-none`}
          style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(0,0,0,0.9)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {userStreak}
        </span>
      </button>
      <h1 className={`${compact ? 'text-lg' : 'text-xl'} font-black bg-gradient-to-r from-blue-600 to-blue-300 bg-clip-text text-transparent tracking-tight`}>
        CoStride
      </h1>
      <button
        onClick={() => { setShowFriendsModal(true); setFriendsModalViewed(true); }}
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

  // ── Swipe handlers for the weekly circles ─────────────────────────────────
  //
  // Strategy: track drag with a ref (no re-render during drag), apply the
  // offset directly to the DOM element for maximum smoothness, then on
  // release either commit the week change or spring back.
  //
  // THRESHOLD: 50 % of the circles row width (measured on mount).
  //

  const applyDragOffset = (dx) => {
    if (circlesInnerRef.current) {
      circlesInnerRef.current.style.transform = `translateX(${dx}px)`;
      circlesInnerRef.current.style.transition = 'none';
    }
  };

  const springBack = () => {
    if (circlesInnerRef.current) {
      circlesInnerRef.current.style.transition = 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)';
      circlesInnerRef.current.style.transform = 'translateX(0)';
    }
  };

  const handleCircleSwipeTouchStart = (e) => {
    swipeStartXRef.current = e.touches[0].clientX;
    swipeStartYRef.current = e.touches[0].clientY;
    swipeDragXRef.current = 0;
    isSwipingRef.current = false;
    // Kill any in-progress spring so drag takes over instantly
    if (circlesInnerRef.current) {
      circlesInnerRef.current.style.transition = 'none';
    }
  };

  const handleCircleSwipeTouchMove = (e) => {
    if (swipeStartXRef.current === null) return;
    const dx = e.touches[0].clientX - swipeStartXRef.current;
    const dy = Math.abs(e.touches[0].clientY - (swipeStartYRef.current ?? 0));

    // Don't hijack vertical scrolls
    if (!isSwipingRef.current && Math.abs(dx) < dy) return;

    if (Math.abs(dx) > 6) {
      isSwipingRef.current = true;

      // Rubber-band at the edges
      const atLeft  = weekOffset <= -1;
      const atRight = weekOffset >= 1;
      let clamped = dx;
      if (atLeft  && dx > 0) clamped = dx * 0.2;
      if (atRight && dx < 0) clamped = dx * 0.2;

      swipeDragXRef.current = clamped;
      applyDragOffset(clamped);
      e.preventDefault(); // stop page scroll while swiping horizontally
    }
  };

  const handleCircleSwipeTouchEnd = () => {
    if (!isSwipingRef.current) {
      swipeStartXRef.current = null;
      swipeStartYRef.current = null;
      return;
    }

    const dx = swipeDragXRef.current;
    // Threshold = 50 % of the measured circles row width
    const threshold = circlesRowWidthRef.current * 0.5;

    if (dx < -threshold && weekOffset < 1) {
      // Swiped left far enough → advance to next week
      setSlideDirection(1);
      setWeekOffset(w => w + 1);
      setActiveCircleDay(null);
      setBubblePos(null);
    } else if (dx > threshold && weekOffset > -1) {
      // Swiped right far enough → go to previous week
      setSlideDirection(-1);
      setWeekOffset(w => w - 1);
      setActiveCircleDay(null);
      setBubblePos(null);
    } else {
      // Didn't reach threshold — spring back to current position
      springBack();
    }

    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
    swipeDragXRef.current = 0;
    isSwipingRef.current = false;
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <PullToRefresh onRefresh={triggerRefresh}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)' }} />
        <div
          className="fixed top-0 left-0 right-0 z-50"
          style={{
            opacity: headerState === 'hidden' ? 0 : 1,
            transform: headerState === 'hidden' ? 'translateY(-6px)' : 'translateY(0)',
            pointerEvents: headerState === 'hidden' ? 'none' : 'auto',
            background: headerState === 'top' ? 'linear-gradient(to bottom, rgba(30,41,59,0.4), transparent)' : 'rgba(15, 23, 42, 0.88)',
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
        <div className="px-4 py-2.5 opacity-0 pointer-events-none" aria-hidden="true">
          <HeaderContent compact={true} />
        </div>

        <div className={`max-w-4xl mx-auto px-4 py-2 pb-32 ${daysSinceCheckIn === 0 ? 'space-y-2' : 'space-y-3'}`}>

          {/* ── Enable Notifications Banner ─────────────────────────────── */}
          <NotificationBanner />

          {memberGym && (
            <>
              {showCheckInButton && !optimisticCheckedIn && !userCheckIns.some((c) => isToday(new Date(c.check_in_date))) && (
                <LocationBasedCheckInButton
                  gyms={allMemberGyms}
                  onCheckInSuccess={(gym) => {
                    setOptimisticCheckedIn(true);
                    setWorkoutStartTime(Date.now());
                    if (gym) {
                      setCheckedInGymId(gym.id);
                      setCheckedInGymName(gym.name);
                    }
                  }}
                  gymMemberships={gymMemberships} />
              )}
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex items-center -space-x-2">
                  {(() => {
                    const friendCheckInUsers = enrichedCheckInUsers.filter((u) => friendIdList.includes(u.user_id));
                    const displayedUsers = friendCheckInUsers.slice(0, 5);
                    const remainingCount = Math.max(0, friendCheckInUsers.length - 5);
                    return (
                      <>
                        {displayedUsers.map((u) => (
                          <div key={u.user_id} className="relative group">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.display_name || u.username} className="w-8 h-8 rounded-full object-cover border-2 border-green-700" loading="lazy" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold border-2 border-green-700">
                                {(u.display_name || u.username || 'U')[0]}
                              </div>
                            )}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {u.display_name || u.username}
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
                <TodayWorkout currentUser={currentUser} workoutStartTime={workoutStartTime} onWorkoutStart={() => setWorkoutStartTime(Date.now())} onWorkoutLogged={handleWorkoutLogged} onOverrideDayChange={(day) => { setWorkoutOverrideDay(day); forceUpdateSwaps(n => n + 1); }} checkedInToday={optimisticCheckedIn || userCheckIns.some((c) => isToday(new Date(c.check_in_date)))} todayCheckInTime={(() => { const ci = userCheckIns.find(c => isToday(new Date(c.check_in_date))); return ci ? new Date(ci.check_in_date).getTime() : (optimisticCheckedIn ? Date.now() : null); })()} />
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

          {memberGym?.id && (
            <div className="mt-4 active:scale-[0.97] active:translate-y-0.5 transition-transform duration-100" style={{ WebkitTapHighlightColor: 'transparent' }}>
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
                      <p className="text-white font-semibold text-base tracking-tight">Your Community</p>
                      <p className="text-slate-300 text-sm mt-1 font-medium">{memberGym.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-medium">{getCommunityText()}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center -space-x-2">
                          {enrichedCheckInUsers.slice(0, 2).map((u) => (
                            <div key={u.user_id} className="relative">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt={u.display_name || u.username} className="w-6 h-6 rounded-full object-cover border-2 border-slate-700" loading="lazy" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-[9px] font-bold border-2 border-slate-700">
                                  {(u.display_name || u.username || 'U')[0]}
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

          {memberGym?.id && (() => {
            const currentTrainingDays = (currentUser?.training_days || []).filter((d) => d >= 1 && d <= 7);

            // Persist training days snapshot at the start of each week in localStorage.
            // This ensures past day circles never change colour when the user switches splits.
            const weekKey = (() => {
              const mon = startOfWeek(new Date(), { weekStartsOn: 1 });
              return mon.toISOString().split('T')[0];
            })();
            const snapshotKey = `trainingDaysSnapshot_${weekKey}`;
            const baseTrainingDays = (() => {
              try {
                const stored = localStorage.getItem(snapshotKey);
                if (stored) return JSON.parse(stored);
                // First time this week — save current split as the snapshot
                localStorage.setItem(snapshotKey, JSON.stringify(currentTrainingDays));
                return currentTrainingDays;
              } catch {
                return currentTrainingDays;
              }
            })();

            const swappedRestDay = weekOffset === 0 ? getSwappedRestDay() : null;
            const restSwap = weekOffset === 0 ? getRestSwap() : null;
            const creditRestDay = weekOffset === 0 ? getCreditRestDay() : null;

            let trainingDays = swappedRestDay && !baseTrainingDays.includes(swappedRestDay)
              ? [...baseTrainingDays, swappedRestDay]
              : baseTrainingDays;

            if (restSwap) {
              trainingDays = trainingDays.filter(d => d !== restSwap.fromDay);
              if (!trainingDays.includes(restSwap.toDay)) {
                trainingDays = [...trainingDays, restSwap.toDay];
              }
            }

            // If user used credit-rest on a training day, remove it so the circle shows green (rest)
            if (creditRestDay) {
              trainingDays = trainingDays.filter(d => d !== creditRestDay);
            }

            // If user overrode a rest day to a workout, add it to trainingDays so the circle shows as a workout day
            const restDayOverride = weekOffset === 0 ? getRestDayOverride() : null;
            if (restDayOverride && !trainingDays.includes(restDayOverride)) {
              trainingDays = [...trainingDays, restDayOverride];
            }
            if (trainingDays.length === 0) return null;
            const mondayBase = startOfWeek(new Date(), { weekStartsOn: 1 });
            mondayBase.setDate(mondayBase.getDate() + weekOffset * 7);
            const logsByDay = {};
            weeklyWorkoutLogs.forEach((l) => {
              const dateStr = (l.completed_date || '').split('T')[0];
              const parts = dateStr.split('-').map(Number);
              const d = (parts.length === 3 && parts[0])
                ? new Date(parts[0], parts[1] - 1, parts[2]).getDay()
                : new Date(l.completed_date).getDay();
              const dayNum = d === 0 ? 7 : d;
              if (!logsByDay[dayNum]) logsByDay[dayNum] = l;
            });
            const loggedDays = new Set(Object.keys(logsByDay).map(Number));
            const allDays = [1, 2, 3, 4, 5, 6, 7];
            const todayDow = new Date().getDay();
            const todayDay = todayDow === 0 ? 7 : todayDow;
            const isFutureWeek = weekOffset > 0;

            return (
              // ── SWIPEABLE WEEKLY CIRCLES CONTAINER ──────────────────────
              <div
                ref={circlesContainerRef}
                style={{ margin: '0 -16px', position: 'relative', width: 'calc(100% + 32px)', height: 108, zIndex: activeCircleDay !== null ? 201 : 'auto' }}
                onTouchStart={handleCircleSwipeTouchStart}
                onTouchMove={handleCircleSwipeTouchMove}
                onTouchEnd={handleCircleSwipeTouchEnd}
              >
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
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <ArrowButton direction="left" disabled={weekOffset <= -1} onPress={() => { setSlideDirection(-1); setWeekOffset(w => w - 1); setActiveCircleDay(null); setBubblePos(null); }} />
                </div>
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <ArrowButton direction="right" disabled={weekOffset >= 1} onPress={() => { setSlideDirection(1); setWeekOffset(w => w + 1); setActiveCircleDay(null); setBubblePos(null); }} />
                </div>

                {/* Overflow container — clips the sliding weeks */}
                <div style={{ overflowX: 'hidden', overflowY: 'visible', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AnimatePresence mode="popLayout" initial={false} custom={slideDirection}>
                    <motion.div
                      key={weekOffset}
                      custom={slideDirection}
                      variants={{
                        enter: (dir) => ({ x: dir < 0 ? '-100%' : '100%', opacity: 1 }),
                        center: { x: 0, opacity: 1 },
                        exit:  (dir) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 1 }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
                      // The inner ref is what we translate during a live drag.
                      // We wrap in an extra div so Framer Motion's own transform
                      // (for enter/exit) and our drag transform don't clash.
                      style={{
                        display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
                        justifyContent: 'center', gap: 8, overflow: 'visible',
                        position: 'relative', width: '100%',
                        paddingTop: 14, paddingBottom: 14,
                        willChange: 'transform',
                      }}
                    >
                      {/* ── Live-drag wrapper — this is what moves with your finger ── */}
                      <div
                        ref={circlesInnerRef}
                        style={{
                          display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
                          justifyContent: 'center', gap: 8, overflow: 'visible',
                          width: '100%', willChange: 'transform',
                        }}
                      >
                      {allDays.map((day, i) => {
                        const isDayInFuture = weekOffset === 0 && day > todayDay;
                        const done = !isDayInFuture && loggedDays.has(day);
                        const isTodayCircle = day === todayDay && weekOffset === 0;
                        const joinDate = currentUser?.created_date || currentUser?.created_at || null;
                        const mondayThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
                        const joinedThisWeek = joinDate && new Date(joinDate) >= mondayThisWeek;
                        const joinDayNum = joinedThisWeek ? (() => { const d = new Date(joinDate).getDay(); return d === 0 ? 7 : d; })() : null;
                        const isPast = isFutureWeek ? false : weekOffset < 0 ? true : day < todayDay;
                        const isPreJoin = joinDayNum !== null && day < joinDayNum && weekOffset === 0;
                        // For past days, use the BASE training days (ignoring current-week swaps)
                        // so that switching splits today doesn't retroactively change past day colours.
                        const isInSplitForDay = isPast
                          ? baseTrainingDays.includes(day)
                          : trainingDays.includes(day);
                        const isInCurrentSplit = isInSplitForDay;
                        // Today showing as a rest-day-override (user switched a rest day to workout) should
                        // show grey (planned) not red (missed) — treat it like a future training day
                        const isTodayRestDayOverride = isTodayCircle && restDayOverride === day;
                        const isRestDay = done ? false : !isInCurrentSplit;
                        const isMissed = !isRestDay && !done && !isTodayRestDayOverride && isPast && !isTodayCircle;
                        // Past rest days always show filled green; today's rest day shows filled green too.
                        // Future rest days show grey outline (not yet happened).
                        const isPastOrTodayRestDay = isRestDay && (isPast || isTodayCircle);
                        const size = isTodayCircle ? 49 : 40;
                        const verticalOffset = Math.round(Math.sin(i / (allDays.length - 1) * Math.PI * 2) * 11);
                        const workoutLog = logsByDay[day];
                        const showViewWorkout = !done && isInCurrentSplit && !isMissed && (isFutureWeek || day > todayDay || isTodayCircle);
                        const hasBubbleBtn = (done && !isRestDay && workoutLog) || showViewWorkout;

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
                          if (isRestDay || done || isPreJoin) return 'none';
                          if (weekOffset !== 0) return 'none';
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
                                // Don't open bubble if we're mid-swipe
                                if (isSwipingRef.current) return;
                                setPressedDay(day);
                                const rect = e.currentTarget.getBoundingClientRect();
                                setBubblePos({
                                  buttonCenterX: rect.left + rect.width / 2,
                                  buttonBottom: rect.bottom,
                                  day, workoutLog: workoutLog || null, done, isRestDay, isMissed,
                                  isPastOrTodayRestDay, isTodayCircle, showViewWorkout, hasBubbleBtn,
                                  popupLabel: (() => {
                                  if (isRestDay) return 'Rest Day';
                                  if (isMissed) return 'No Workout';
                                  if (done && workoutLog) return workoutLog.workout_name || workoutLog.title || workoutLog.workout_type || workoutLog.name || workoutLog.split_name || 'Workout';
                                  if (done) return 'Workout';
                                  // For rest-day overrides, look up the source workout day key
                                  if (isTodayRestDayOverride) {
                                    try {
                                      const srcDay = localStorage.getItem('workoutOverrideSourceDay');
                                      if (srcDay) {
                                        const srcKey = parseInt(srcDay);
                                        const w = currentUser?.custom_workout_types?.[srcKey];
                                        if (w?.name) return w.name;
                                        const savedSplits = currentUser?.saved_splits || [];
                                        const activeSplitId = currentUser?.active_split_id;
                                        const activeSplit = savedSplits.find((s) => s.id === activeSplitId) || savedSplits[0];
                                        const sw = activeSplit?.workouts?.[srcKey] || activeSplit?.workouts?.[String(srcKey)];
                                        if (sw?.name) return sw.name;
                                      }
                                    } catch {}
                                  }
                                  const customTypes = currentUser?.custom_workout_types;
                                  const restSwapForLabel = restSwap;
                                  const lookupDay = (restSwapForLabel && restSwapForLabel.toDay === day) ? restSwapForLabel.fromDay : day;
                                  const splitDay = customTypes ? Array.isArray(customTypes) ? customTypes.find((s) => s.day === lookupDay || s.day_of_week === lookupDay) : customTypes[lookupDay] : null;
                                  return splitDay?.name || splitDay?.title || splitDay?.workout_type || 'Training Day';
                                  })(),
                                  dateLabel: done && workoutLog?.completed_date
                                    ? new Date(workoutLog.completed_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
                                    : (() => {
                                        const sd = new Date(mondayBase);
                                        sd.setDate(mondayBase.getDate() + (day - 1));
                                        return sd.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
                                      })(),
                                  solidColor: isPastOrTodayRestDay ? '#16a34a' : isRestDay ? '#1e2535' : done ? '#3b82f6' : isMissed ? '#dc2626' : isTodayCircle ? '#263244' : '#1e2535',
                                });
                              }}
                              onPointerUp={() => {
                                if (isSwipingRef.current) { setPressedDay(null); return; }
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
                                WebkitTapHighlightColor: 'transparent', userSelect: 'none', touchAction: 'manipulation',
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
                            <AnimatePresence></AnimatePresence>
                          </div>
                        );
                      })}
                      </div>{/* end live-drag wrapper */}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              // ── END SWIPEABLE CONTAINER ──────────────────────────────────
            );
          })()}

          {activeCircleDay !== null && bubblePos && (() => {
            const ARROW_H = 7, ARROW_W = 13, RADIUS = 14, BUBBLE_W = 274;
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
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        const wl = bubblePos.workoutLog;
                        setActiveCircleDay(null); setBubblePos(null);
                        setSummaryLog(wl);
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
                        setActiveCircleDay(null); setBubblePos(null);
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

          {socialFeedItems.length > 0 && (
            <div className="space-y-3 mt-4">
              {socialFeedItems.map((item) =>
                item.type === 'poll' ? (
                  <FeedPollCard key={item.id} poll={item.data} currentUser={currentUser} />
                ) : (
                  <PostCard key={item.id} post={item.data} fullWidth={true} currentUser={currentUser} isOwnProfile={item.data.member_id === currentUser?.id} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => queryClient.invalidateQueries({ queryKey: ['posts'] })} friends={friends} sentFriendRequests={sentFriendRequests} onAddFriend={(user) => addFriendMutation.mutate(user)} friendIdList={friendIdList} />
                )
              )}
            </div>
          )}

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

      <StreakFreezeAnimation
        isOpen={showFreezeAnimation}
        freezesLostCount={freezeAnimationData.freezesLostCount}
        finalFreezeCount={freezeAnimationData.finalFreezeCount}
        onComplete={() => setShowFreezeAnimation(false)}
      />

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
        gymId={checkedInGymId || primaryGymIdForQuery}
        gymName={checkedInGymName || memberGym?.name || null}
        showDaysCelebration={showDaysCelebration}
        weeklyWorkoutLogs={weeklyWorkoutLogs}
        todayDowAdjusted={todayDowAdjusted}
        setShowShareWorkout={setShowShareWorkout}
        setShowDaysCelebration={setShowDaysCelebration}
        setJustLoggedDay={setJustLoggedDay}
        onChallengesContinue={() => { setShowChallengesCelebration(false); setShowShareWorkout(true); }}
      />

      <StreakVariantPicker isOpen={showStreakVariants} onClose={() => setShowStreakVariants(false)} onSelect={handleStreakVariantSelect} selectedVariant={streakVariant} streakFreezes={currentUser?.streak_freezes || 0} unlockedVariants={currentUser?.unlocked_streak_variants || []} />
      <JoinWithCodeModal open={showJoinModal} onClose={() => setShowJoinModal(false)} currentUser={currentUser} gymCount={gymMemberships.length} />

      {challengeCompletionVariant && (
        <ChallengeCompletionCelebration
          variantId={challengeCompletionVariant}
          onDismiss={() => setChallengeCompletionVariant(null)}
        />
      )}
      <CreateSplitModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} currentUser={currentUser} />

      <FriendsSection
        showFriendsModal={showFriendsModal}
        setShowFriendsModal={(val) => { setShowFriendsModal(val); if (val) setFriendsModalViewed(true); }}
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

      <WorkoutSummaryModal summaryLog={summaryLog} onClose={() => setSummaryLog(null)} currentStreak={currentUser?.current_streak} />

      {postRemovedNotif && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4"
          style={{ background: 'rgba(2,4,10,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-xs rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(16,19,40,0.98) 0%, rgba(6,8,18,1) 100%)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.25)' }}>
                <span style={{ fontSize: 26 }}>🚫</span>
              </div>
              <h3 className="text-white font-black text-lg mb-1" style={{ letterSpacing: '-0.02em' }}>Post Removed</h3>
              <p className="text-sm leading-relaxed mt-2 mb-6" style={{ color: 'rgba(138,138,148,0.9)' }}>
                {postRemovedNotif.message}
              </p>
              <button
                onClick={dismissPostRemovedNotif}
                className="w-full py-3.5 rounded-2xl font-black text-white text-sm active:scale-95 active:translate-y-[2px] transition-all duration-100"
                style={{
                  background: 'linear-gradient(to bottom, #ff6b85 0%, #ff4d6d 40%, #e03055 100%)',
                  border: 'none',
                  borderBottom: '3px solid #9b1f3a',
                  boxShadow: '0 3px 0 #9b1f3a, 0 6px 20px rgba(255,77,109,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                  letterSpacing: '-0.01em',
                }}>
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {viewWorkoutDay !== null && (() => {
          const restSwapData = getRestSwap();
          let effectiveViewDay = (restSwapData && viewWorkoutDay === restSwapData.toDay)
            ? restSwapData.fromDay
            : viewWorkoutDay;

          // If this is a rest-day-override for today, use the source workout day key
          const todayDowNow = new Date().getDay();
          const todayNumNow = todayDowNow === 0 ? 7 : todayDowNow;
          const restDayOverrideForView = weekOffset === 0 ? getRestDayOverride() : null;
          if (viewWorkoutDay === todayNumNow && restDayOverrideForView === todayNumNow) {
            try {
              const srcDay = localStorage.getItem('workoutOverrideSourceDay');
              if (srcDay) effectiveViewDay = parseInt(srcDay);
            } catch {}
          }

          // Look up workout from custom_workout_types or saved_splits
          const lookupWorkoutForView = (key) => {
            const w = currentUser?.custom_workout_types?.[key];
            if (w && (w.exercises || []).length > 0) return w;
            const savedSplits = currentUser?.saved_splits || [];
            const activeSplitId = currentUser?.active_split_id;
            const activeSplit = savedSplits.find((s) => s.id === activeSplitId) || savedSplits[0];
            const sw = activeSplit?.workouts?.[key] || activeSplit?.workouts?.[String(key)];
            if (sw && (sw.exercises || []).length > 0) return sw;
            for (const split of savedSplits) {
              const fw = split.workouts?.[key] || split.workouts?.[String(key)];
              if (fw && (fw.exercises || []).length > 0) return fw;
            }
            return null;
          };
          const workout = lookupWorkoutForView(effectiveViewDay);
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
                  const groups = [];
                  const nameToGroupIdx = {};
                  exercises.forEach((ex, index) => {
                    const key = (ex.exercise || ex.name || '').trim().toLowerCase();
                    if (!key) { groups.push({ key: `__empty_${index}`, name: ex.exercise || ex.name || '', items: [{ ex, index }] }); return; }
                    if (nameToGroupIdx[key] === undefined) { nameToGroupIdx[key] = groups.length; groups.push({ key, name: ex.exercise || ex.name, items: [{ ex, index }] }); }
                    else { groups[nameToGroupIdx[key]].items.push({ ex, index }); }
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
                          const sorted = [...group.items].sort((a, b) => (parseFloat(b.ex.weight_kg ?? b.ex.weight_lbs ?? b.ex.weight) || 0) - (parseFloat(a.ex.weight_kg ?? a.ex.weight_lbs ?? a.ex.weight) || 0));
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
                                      {setIdx === 0 ? <div className="text-sm font-bold text-white leading-tight">{group.name}</div> : <div />}
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