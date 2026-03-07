import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '../components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, Trophy, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import FriendsIcon from '../components/FriendsIcon';
import CheckInButton from '../components/gym/CheckInButton';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import TodayWorkout from '../components/profile/TodayWorkout';
import StreakVariantPicker from '../components/StreakVariantPicker';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import QuoteCarousel from '../components/home/QuoteCarousel';
import { useState } from 'react';
import { format, isToday, differenceInDays, startOfDay, startOfWeek } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Home() {

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showStreakVariants, setShowStreakVariants] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [celebrationStreakNum, setCelebrationStreakNum] = useState(0);
  const [animatedNum, setAnimatedNum] = useState(0);
  const [celebrationChallenges, setCelebrationChallenges] = useState([]);

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
    enabled: !!currentUser
  });

  const primaryGymIdForQuery =
    currentUser?.primary_gym_id ||
    (gymMemberships.length > 0 ? gymMemberships[0]?.gym_id : null);

  const { data: memberGymData } = useQuery({
    queryKey: ['gym', primaryGymIdForQuery],
    queryFn: () =>
      base44.entities.Gym
        .filter({ id: primaryGymIdForQuery })
        .then((r) => r[0] || null),
    enabled: !!primaryGymIdForQuery
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () =>
      base44.entities.CheckIn.filter({ user_id: currentUser?.id }, '-check_in_date', 100),
    enabled: !!currentUser
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

      if (daysDiff === 1 || daysDiff === 2) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const userStreak = calculateStreak(userCheckIns);

  if (userLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(to_bottom_right,#02040a,#0f2a66,#02040a)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries(); }}>

      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0f2a66,#02040a)]">

        {/* Header */}

        <div className="bg-gradient-to-b from-slate-800/40 to-transparent backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-center relative px-4">

            {/* Streak */}

            <button
              onClick={() => setShowStreakVariants(true)}
              className="flex items-center hover:opacity-80 transition-opacity absolute left-0 top-1/2 -translate-y-1/2">

              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png"
                alt="streak"
                className="w-14 h-14 animate-[breathe_3s_ease-in-out_infinite]"
                style={{
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 1px rgba(255,150,0,0.3))'
                }}
              />

              <span
                className="font-black text-xl -ml-2 mt-3 select-none"
                style={{
                  color: '#ffffff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
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
              className="absolute right-0 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity p-2 -mr-2">

              <FriendsIcon className="w-7 h-7 text-cyan-400" />

            </Link>

          </div>
        </div>

        {/* Main content */}

        <div className="max-w-4xl mx-auto px-4 py-2 pb-32 space-y-3">

          {memberGym &&
            <>
              <CheckInButton
                gym={memberGym}
                onCheckInSuccess={() => setWorkoutStartTime(Date.now())}
              />

              <TodayWorkout
                currentUser={currentUser}
                workoutStartTime={workoutStartTime}
                onWorkoutStart={() => setWorkoutStartTime(Date.now())}
              />

              <Link
                to={createPageUrl('GymCommunity') + `?id=${memberGym.id}`}
                className="block">

                <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 hover:border-blue-500/30 transition-all duration-100 cursor-pointer shadow-2xl shadow-black/20 relative h-40 overflow-hidden group">

                  {memberGym?.image_url &&
                    <img
                      src={memberGym.image_url}
                      alt={memberGym.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-100"
                    />
                  }

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />

                  <div className="relative p-6 h-full flex flex-col justify-between">

                    <div>
                      <p className="text-white font-semibold text-base">Your Community</p>
                      <p className="text-slate-300 text-sm mt-1 font-medium">
                        {memberGym.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-end">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                  </div>

                </Card>

              </Link>

              <QuoteCarousel />

            </>
          }

        </div>
      </div>

      <StreakVariantPicker
        isOpen={showStreakVariants}
        onClose={() => setShowStreakVariants(false)}
      />

      <JoinWithCodeModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        currentUser={currentUser}
      />

      <CreateSplitModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        currentUser={currentUser}
      />

    </PullToRefresh>
  );
}