import React, { useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '../components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import FriendsIcon from '../components/FriendsIcon';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import PostCard from '../components/feed/PostCard';
import TodayWorkout from '../components/profile/TodayWorkout';
import StreakVariantPicker from '../components/StreakVariantPicker';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import QuoteCarousel from '../components/home/QuoteCarousel';
import StreakFreezeAnimation from '../components/home/StreakFreezeAnimation';
import StreakLossAnimation from '../components/home/StreakLossAnimation';
import WorkoutSummaryModal from '../components/home/WorkoutSummaryModal';
import StreakCelebration from '../components/home/StreakCelebration';
import FriendsSection from '../components/home/FriendsSection';
import { useState } from 'react';
import { isToday, differenceInDays, startOfWeek, startOfDay } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const sanitiseUsernameQuery = (v) =>
  v
    .replace(/[^a-zA-Z0-9_.\- ]/g, '')
    .slice(0, 30);

const POSE_1_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png';
const POSE_2_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/8d4e06e17_Pose2_V21.png';
const SPARTAN_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/a72ee034d_spartan.png';
const BEACH_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/9766d8d41_BEACH.png';
const MOCK_MODE = false;

import LocationBasedCheckInButton from '../components/gym/LocationBasedCheckInButton';
import { getSwappedRestDay } from '../lib/weekSwaps.js';

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

// ── ArrowButton defined outside Home to avoid hook-count violations ──────────
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
      {isRestDay ? (
        isPastOrTodayRestDay ? (
          <svg width={isTodayCircle ? 32 : 26} height={isTodayCircle ? 32 : 26} viewBox="0 0 100 100" fill="none">
            <line x1="50" y1="95" x2="50" y2="30" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
            <path d="M50 8 C44 20 40 28 42 36 C45 40 55 40 58 36 C60 28 56 20 50 8Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
            <path d="M50 30 C42 22 32 18 22 22 C20 28 24 36 32 38 C40 40 48 36 50 30Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
            <path d="M50 30 C58 22 68 18 78 22 C80 28 76 36 68 38 C60 40 52 36 50 30Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
            <path d="M50 50 C40 42 28 40 16 46 C16 52 22 60 32 60 C42 60 50 54 50 50Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
            <path d="M50 50 C60 42 72 40 84 46 C84 52 78 60 68 60 C58 60 50 54 50 50Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
          </svg>
        ) : (
          <svg width={isTodayCircle ? 32 : 26} height={isTodayCircle ? 32 : 26} viewBox="0 0 100 100" fill="none">
            <line x1="50" y1="95" x2="50" y2="30" stroke="rgba(148,163,184,0.35)" strokeWidth="3" strokeLinecap="round" />
            <path d="M50 8 C44 20 40 28 42 36 C45 40 55 40 58 36 C60 28 56 20 50 8Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
            <path d="M50 30 C42 22 32 18 22 22 C20 28 24 36 32 38 C40 40 48 36 50 30Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
            <path d="M50 30 C58 22 68 18 78 22 C80 28 76 36 68 38 C60 40 52 36 50 30Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
            <path d="M50 50 C40 42 28 40 16 46 C16 52 22 60 32 60 C42 60 50 54 50 50Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
            <path d="M50 50 C60 42 72 40 84 46 C84 52 78 60 68 60 C58 60 50 54 50 50Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
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
    const celebT1 = setTimeout(() => {
      setShowStreakCelebration(false);
      if (challengesData.length > 0) {
        setShowChallengesCelebration(true);
        const celebT2 = setTimeout(() => { setShowChallengesCelebration(false); showShare(); }, 4000);
        celebTimers.current.push(celebT2);
      } else {
        showShare();
      }
    }, 3500);
    celebTimers.current.push(celebT1);
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
          src={streakVariant === 'spartan' ? SPARTAN_ICON_URL : streakVariant === 'beach' ? BEACH_ICON_URL : POSE_1_URL}
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
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)' }} />
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

          {/* ── Community card ── */}
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

          {/* ── Weekly workout circles with week navigation ── */}
          {memberGym?.id && (() => {
            const baseTrainingDays = (currentUser?.training_days || []).filter((d) => d >= 1 && d <= 7);
            // Apply week-level rest→training swap if applicable (current week only)
            const swappedRestDay = weekOffset === 0 ? getSwappedRestDay() : null;
            const trainingDays = swappedRestDay && !baseTrainingDays.includes(swappedRestDay)
              ? [...baseTrainingDays, swappedRestDay]
              : baseTrainingDays;
            if (trainingDays.length === 0) return null;
            const mondayBase = startOfWeek(new Date(), { weekStartsOn: 1 });
            mondayBase.setDate(mondayBase.getDate() + weekOffset * 7);
            const logsByDay = {};
            weeklyWorkoutLogs.forEach((l) => {
              const d = new Date(l.completed_date).getDay();
              const dayNum = d === 0 ? 7 : d;
              if (!logsByDay[dayNum]) logsByDay[dayNum] = l;
            });
            const loggedDays = new Set(Object.keys(logsByDay).map(Number));
            const allDays = [1, 2, 3, 4, 5, 6, 7];
            const todayDow = new Date().getDay();
            const todayDay = todayDow === 0 ? 7 : todayDow;
            const isFutureWeek = weekOffset > 0;

            return (
              <div style={{ margin: '0 -16px', position: 'relative', width: 'calc(100% + 32px)', height: 108, zIndex: activeCircleDay !== null ? 201 : 'auto' }}>
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

                {/* ── Left arrow ── */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10,
                }}>
                  <ArrowButton
                    direction="left"
                    disabled={weekOffset <= -1}
                    onPress={() => { setSlideDirection(-1); setWeekOffset(w => w - 1); setActiveCircleDay(null); setBubblePos(null); }}
                  />
                </div>

                {/* ── Right arrow ── */}
                <div style={{
                  position: 'absolute', right: 0, top: 0, bottom: 0,
                  width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10,
                }}>
                  <ArrowButton
                    direction="right"
                    disabled={weekOffset >= 1}
                    onPress={() => { setSlideDirection(1); setWeekOffset(w => w + 1); setActiveCircleDay(null); setBubblePos(null); }}
                  />
                </div>

                {/* ── Sliding dots track ── */}
                <div style={{ overflowX: 'hidden', overflowY: 'visible', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AnimatePresence mode="popLayout" initial={false} custom={slideDirection}>
                    <motion.div
                      key={weekOffset}
                      custom={slideDirection}
                      variants={{
                        enter: (dir) => ({ x: dir < 0 ? '-100%' : '100%', opacity: 1 }),
                        center: { x: 0, opacity: 1 },
                        exit: (dir) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 1 }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8, overflow: 'visible', position: 'relative', width: '100%', paddingTop: 14, paddingBottom: 14 }}>
                      {allDays.map((day, i) => {
                        const done = loggedDays.has(day);
                        const bounce = justLoggedDay === day && weekOffset === 0;
                        const isTodayCircle = day === todayDay && weekOffset === 0;
                        const joinDate = currentUser?.created_date || currentUser?.created_at || null;
                        const mondayThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
                        const joinedThisWeek = joinDate && new Date(joinDate) >= mondayThisWeek;
                        const joinDayNum = joinedThisWeek ? (() => { const d = new Date(joinDate).getDay(); return d === 0 ? 7 : d; })() : null;
                        const isPast = isFutureWeek ? false : weekOffset < 0 ? true : day < todayDay;
                        const isPreJoin = joinDayNum !== null && day < joinDayNum && weekOffset === 0;
                        const isInCurrentSplit = trainingDays.includes(day);
                        const isRestDay = done ? false : !isInCurrentSplit;
                        const isMissed = !isRestDay && !done && isPast && !isPreJoin && !isFutureWeek;
                        const isPastOrTodayRestDay = isRestDay && (isPast || isTodayCircle);
                        const size = isTodayCircle ? 49 : 40;
                        const verticalOffset = Math.round(Math.sin(i / (allDays.length - 1) * Math.PI * 2) * 11);
                        const workoutLog = logsByDay[day];
                        const showViewWorkout = !done && !isRestDay && !isMissed && (isFutureWeek || day > todayDay || isTodayCircle);
                        const hasBubbleBtn = (done && !isRestDay && workoutLog) || showViewWorkout;

                        const getBg = () => {
                          if (isPreJoin) return 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
                          if (isRestDay) {
                            if (isPastOrTodayRestDay) return 'linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)';
                            return 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
                          }
                          if (done) return 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)';
                          if (isMissed) return 'linear-gradient(to bottom, #f87171 0%, #ef4444 35%, #b91c1c 100%)';
                          return 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
                        };
                        const getBorder = () => {
                          if (isPreJoin) return '1px solid rgba(71,85,105,0.7)';
                          if (isRestDay) {
                            if (isPastOrTodayRestDay) return '1px solid rgba(74,222,128,0.5)';
                            return '1px solid rgba(71,85,105,0.7)';
                          }
                          if (done) return '1px solid rgba(147,197,253,0.5)';
                          if (isMissed) return '1px solid rgba(248,113,113,0.5)';
                          return '1px solid rgba(71,85,105,0.7)';
                        };
                        const getBoxShadow = () => {
                          if (isPreJoin) return '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.25), inset 0 0 10px rgba(255,255,255,0.02)';
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
                                  popupLabel: isPreJoin ? '' : (() => {
                                    if (isRestDay) return 'Rest Day';
                                    if (isMissed) return 'No Workout';
                                    if (done && workoutLog) return workoutLog.workout_name || workoutLog.title || workoutLog.workout_type || workoutLog.name || workoutLog.split_name || 'Workout';
                                    if (done) return 'Workout';
                                    const customTypes = currentUser?.custom_workout_types;
                                    const splitDay = customTypes ? Array.isArray(customTypes) ? customTypes.find((s) => s.day === day || s.day_of_week === day) : customTypes[day] : null;
                                    return splitDay?.name || splitDay?.title || splitDay?.workout_type || 'Training Day';
                                  })(),
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
                              }}
                              onPointerDown={(e) => {
                                setPressedDay(day);
                                const rect = e.currentTarget.getBoundingClientRect();
                                const dayDate = new Date(mondayBase);
                                dayDate.setDate(mondayBase.getDate() + (day - 1));
                                const dateStr = dayDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
                                let bubbleColor = 'rgba(71,85,105,0.85)';
                                if (isRestDay) bubbleColor = isPastOrTodayRestDay ? 'rgba(74,222,128,0.85)' : 'rgba(71,85,105,0.85)';
                                else if (done) bubbleColor = 'rgba(96,165,250,0.85)';
                                else if (isMissed) bubbleColor = 'rgba(248,113,113,0.85)';
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
                                  solidColor: bubbleColor,
                                  dateLabel: dateStr,
                                  popupLabel: isPreJoin ? '' : (() => {
                                    if (isRestDay) return 'Rest Day';
                                    if (isMissed) return 'No Workout';
                                    if (done && workoutLog) return workoutLog.workout_name || workoutLog.title || workoutLog.workout_type || workoutLog.name || workoutLog.split_name || 'Workout';
                                    if (done) return 'Workout';
                                    const customTypes = currentUser?.custom_workout_types;
                                    const splitDay = customTypes ? Array.isArray(customTypes) ? customTypes.find((s) => s.day === day || s.day_of_week === day) : customTypes[day] : null;
                                    return splitDay?.name || splitDay?.title || splitDay?.workout_type || 'Training Day';
                                  })(),
                                });
                              }}>
                              {isRestDay ? (
                            <AnimatePresence>
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>
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
          {socialFeedPosts.length > 0 && (
            <div className="space-y-3">
              {socialFeedPosts.map((post) => (
                <PostCard key={post.id} post={post} fullWidth={true} currentUser={currentUser} isOwnProfile={post.member_id === currentUser?.id} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => queryClient.invalidateQueries({ queryKey: ['posts'] })} />
              ))}
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
        gymId={primaryGymIdForQuery}
        showDaysCelebration={showDaysCelebration}
        weeklyWorkoutLogs={weeklyWorkoutLogs}
        todayDowAdjusted={todayDowAdjusted}
        setShowShareWorkout={setShowShareWorkout}
        setShowDaysCelebration={setShowDaysCelebration}
        setJustLoggedDay={setJustLoggedDay}
      />

      <StreakVariantPicker isOpen={showStreakVariants} onClose={() => setShowStreakVariants(false)} onSelect={handleStreakVariantSelect} selectedVariant={streakVariant} streakFreezes={currentUser?.streak_freezes || 0} unlockedVariants={currentUser?.unlocked_streak_variants || []} />
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