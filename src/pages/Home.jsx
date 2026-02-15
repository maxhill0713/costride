import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '../components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dumbbell, Trophy, TrendingUp, Flame, Calendar, ChevronRight, MapPin, Clock, CheckCircle, AlertCircle, Target, X, Crown, Bell, Heart, MessageCircle, Edit2, Info } from 'lucide-react';
import FriendsIcon from '../components/FriendsIcon';
import CheckInButton from '../components/gym/CheckInButton';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import WeeklyChallengeCard from '../components/challenges/WeeklyChallengeCard';
import TodayWorkout from '../components/profile/TodayWorkout';
import StreakVariantPicker from '../components/StreakVariantPicker';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import PostCard from '../components/feed/PostCard';
import { useState } from 'react';
import { format, isToday, differenceInDays, startOfDay, startOfWeek, formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showStreakVariants, setShowStreakVariants] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        console.error('Auth error:', error);
        return null;
      }
    }
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: allGyms = [], isLoading: gymsLoading } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list('-check_in_date'),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.list('-created_date'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: weeklyChallenges = [] } = useQuery({
    queryKey: ['weeklyChallenges'],
    queryFn: () => base44.entities.Challenge.filter({ 
      status: 'active'
    }, '-created_date', 3),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts'],
    queryFn: () => base44.entities.Lift.list('-created_date'),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser?.id }, '-created_date', 5),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 10000
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 50),
    enabled: !!currentUser && !!friends.length,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000
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
    gcTime: 10 * 60 * 1000
  });

  // Pre-calculate for check-in users query
  const todayCheckInsForQuery = allCheckIns.filter(c => isToday(new Date(c.check_in_date)));
  const checkInUserIdsForQuery = [...new Set(todayCheckInsForQuery.map(c => c.user_id))];

  const { data: checkInUsers = [] } = useQuery({
    queryKey: ['checkInUsers', checkInUserIdsForQuery.join(',')],
    queryFn: async () => {
      if (checkInUserIdsForQuery.length === 0) return [];
      try {
        const users = await Promise.all(
          checkInUserIdsForQuery.map(id => base44.entities.User.filter({ id }).then(results => results[0]))
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

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (currentUser && currentUser.onboarding_completed === false) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [currentUser?.onboarding_completed, navigate]);

  // Calculate these values before early return
  const primaryGymId = currentUser?.primary_gym_id || (gymMemberships.length > 0 ? gymMemberships[0].gym_id : null);
  const memberGym = primaryGymId 
    ? allGyms.find(g => g.id === primaryGymId) 
    : null;

  const userCheckIns = allCheckIns.filter(c => c.user_id === currentUser?.id);
  const lastCheckIn = userCheckIns.length > 0 ? userCheckIns[0].check_in_date : null;
  const daysSinceCheckIn = lastCheckIn ? differenceInDays(new Date(), new Date(lastCheckIn)) : null;

  // Create reminder notification if inactive for 3+ days
  useEffect(() => {
    const createReminderNotification = async () => {
      if (!currentUser || daysSinceCheckIn === null || daysSinceCheckIn < 3) return;

      // Check if we already sent a recent reminder
      const recentReminder = await base44.entities.Notification.filter({
        user_id: currentUser.id,
        type: 'reminder'
      }, '-created_date', 1);

      if (recentReminder.length > 0) {
        const daysSinceReminder = differenceInDays(new Date(), new Date(recentReminder[0].created_date));
        if (daysSinceReminder < 2) return;
      }

      await base44.entities.Notification.create({
        user_id: currentUser.id,
        type: 'reminder',
        title: 'Time for your next workout! 💪',
        message: `You haven't checked in for ${daysSinceCheckIn} days. Don't forget to check in today!`,
        icon: '⏰',
        action_url: createPageUrl('Gyms')
      });
    };

    createReminderNotification();
  }, [currentUser, daysSinceCheckIn]);

  if (userLoading || !currentUser || gymsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  const friendIds = friends.map(f => f.friend_id);
  const friendPosts = allPosts.filter(post => friendIds.includes(post.member_id));

  // Today's check-ins (all users)
  const todayCheckIns = todayCheckInsForQuery;

  // Get the challenge closest to completing (or random if all equal)
  const selectFeaturedChallenge = () => {
    const activeChallenges = weeklyChallenges.filter(c => c.status === 'active');
    if (activeChallenges.length === 0) return null;
    
    // Calculate progress for each challenge
    const withProgress = activeChallenges.map(c => {
      const participants = lifts.filter(l => c.participants?.includes(l.member_id) || false);
      const progress = c.target_value ? Math.min((participants.length / c.target_value) * 100, 100) : 0;
      return { ...c, progress };
    });
    
    // Return the one with highest progress
    return withProgress.sort((a, b) => b.progress - a.progress)[0];
  };

  const featuredChallenge = selectFeaturedChallenge();

  // Active challenges
  const activeChallenges = challenges.filter(c => c.status === 'active').slice(0, 3);

  // Recent lifts today
  const todayLifts = lifts.filter(l => isToday(new Date(l.created_date))).slice(0, 5);

  // Calculate user streak from check-ins
  const calculateStreak = (checkIns) => {
    if (checkIns.length === 0) return 0;
    
    const today = startOfDay(new Date());
    const lastCheckInDate = startOfDay(new Date(checkIns[0].check_in_date));
    const daysSinceLastCheckIn = differenceInDays(today, lastCheckInDate);
    
    // If last check-in was more than 1 day ago, streak is broken (reset to 0)
    if (daysSinceLastCheckIn > 1) {
      return 0;
    }
    
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
  const streakVariant = currentUser?.streak_variant || 'default';

  const handleStreakVariantSelect = async (variant) => {
    if (currentUser) {
      setShowStreakVariants(false);
      await base44.auth.updateMe({ streak_variant: variant });
      // Refetch current user to update UI with new streak variant
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  };

  // Calculate weekly progress
  const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const weeklyCheckIns = userCheckIns.filter(c => new Date(c.check_in_date) >= startOfThisWeek);
  const weeklyTarget = currentUser?.weekly_goal || 3; // Use user's routine goal or default to 3
  
  // Calculate goal progress
  const goalsOnTrack = goals.filter(g => {
    const progress = (g.current_value / g.target_value) * 100;
    const daysUntilDeadline = g.deadline ? differenceInDays(new Date(g.deadline), new Date()) : null;
    
    if (!daysUntilDeadline || daysUntilDeadline < 0) return progress >= 80;
    
    const totalDuration = g.deadline ? differenceInDays(new Date(g.deadline), new Date(g.created_date || new Date())) : 30;
    const daysPassed = totalDuration - daysUntilDeadline;
    const expectedProgress = (daysPassed / totalDuration) * 100;
    
    return progress >= expectedProgress * 0.8; // 80% of expected progress
  }).length;
  
  const weeklyComplete = weeklyCheckIns.length >= weeklyTarget;
  const goalsComplete = goals.length === 0 || goalsOnTrack >= goals.length * 0.5;
  const completedCount = (weeklyComplete ? 1 : 0) + (goalsComplete ? 1 : 0);
  const totalCount = goals.length > 0 ? 2 : 1;

  const isOnTrack = completedCount === totalCount;
  const isAlmostOnTrack = !isOnTrack && completedCount === totalCount - 1;
  const progressPercentage = goals.length > 0 ? Math.round((goalsOnTrack / goals.length) * 100) : (weeklyCheckIns.length / weeklyTarget) * 100;

  // Dynamic community card text that changes daily
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
    <PullToRefresh onRefresh={async () => {
      await queryClient.invalidateQueries();
    }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Header with Streak */}
        <div className="bg-gradient-to-b from-slate-800/40 to-transparent backdrop-blur-sm border-b border-slate-700/50 px-4 py-1.5">
          <div className="max-w-4xl mx-auto flex items-center justify-center relative px-4">
                <button 
                  onClick={() => setShowStreakVariants(true)}
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity absolute left-0"
                >
                  {streakVariant === 'sunglasses' ? (
                     <div className="relative w-8 h-8">
                       <Flame className="w-8 h-8 text-orange-500 fill-current" />
                       <svg 
                         className="absolute inset-0 w-full h-full pointer-events-none"
                         viewBox="0 0 64 64"
                       >
                         <circle cx="20" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black" />
                         <circle cx="44" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black" />
                         <line x1="26" y1="24" x2="38" y2="24" stroke="currentColor" strokeWidth="1.5" className="text-black" />
                       </svg>
                     </div>
                   ) : streakVariant === 'cowboy' ? (
                     <div className="relative w-8 h-8">
                       <Flame className="w-8 h-8 text-orange-500 fill-current" />
                       <svg 
                         className="absolute inset-0 w-full h-full pointer-events-none"
                         viewBox="0 0 64 64"
                       >
                         <path 
                           d="M 12 28 L 10 18 Q 10 8 32 5 Q 54 8 54 18 L 52 28" 
                           fill="currentColor" 
                           className="text-amber-800"
                         />
                         <ellipse cx="32" cy="28" rx="24" ry="6" fill="currentColor" className="text-amber-700" />
                         <rect x="14" y="26" width="36" height="1.5" fill="currentColor" className="text-amber-900" />
                       </svg>
                     </div>
                   ) : (
                     <Flame className="w-8 h-8 text-orange-500 fill-current" />
                   )}
                   <span className="text-white font-semibold text-xl tracking-tight">{userStreak}</span>
                </button>
                <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-blue-300 bg-clip-text text-transparent tracking-tight">
                  CoStride
                </h1>
                <Link to={createPageUrl('Friends')} onClick={async () => {
                  if (currentUser) {
                    await base44.auth.updateMe({ last_friends_view: new Date().toISOString() });
                  }
                }} className="absolute right-0">
                  <div className="relative">
                    <FriendsIcon className="w-7 h-7 text-cyan-400" />
                    {(friendPosts.length > 0 || notifications.length > 0) && (!currentUser?.last_friends_view || (friendPosts.length > 0 && new Date(friendPosts[0].created_date) > new Date(currentUser.last_friends_view)) || (notifications.length > 0 && new Date(notifications[0].created_date) > new Date(currentUser.last_friends_view))) && <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />}
                  </div>
                </Link>
              </div>
          </div>

        <div className="max-w-4xl mx-auto px-4 py-2 space-y-3">
          {/* Check-In Button - Full Width */}
          {memberGym && (
            <>
              {/* Motivational Text */}
              <p className="text-center text-xs text-slate-400 font-medium">
                {weeklyComplete 
                  ? `🎯 Weekly goal crushed! ${weeklyCheckIns.length}/${weeklyTarget} workouts done`
                  : `${weeklyTarget - weeklyCheckIns.length} workout${weeklyTarget - weeklyCheckIns.length === 1 ? '' : 's'} away from your weekly goal`
                }
              </p>

              {daysSinceCheckIn === 0 ? (
                <Button 
                  disabled
                  className="w-full text-white shadow-lg py-7 text-lg font-semibold rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 cursor-default tracking-tight"
                >
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Great Work—Checked In Today! Keep the Streak Alive 🔥
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowCheckIn(true)}
                  className="w-full text-white border-0 shadow-lg py-7 text-lg font-semibold rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 tracking-tight"
                >
                  Check In Now
                </Button>
              )}

              {/* Friends Avatars */}
               <div className="flex flex-col items-center justify-center gap-2">
                 <div className="flex items-center -space-x-2">
                   {(() => {
                     const friendCheckInUsers = checkInUsers.filter(u => friendIds.includes(u.id));
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






          {/* Gym Section with Workout */}
          {memberGym && (
            <div className="space-y-3">
              {/* Today's Workout */}
              {currentUser?.custom_workout_types ? (
                <TodayWorkout 
                  currentUser={currentUser}
                  workoutStartTime={workoutStartTime}
                  onWorkoutStart={() => setWorkoutStartTime(Date.now())}
                />
              ) : (
                <Card className="bg-gradient-to-br from-orange-500/10 via-slate-900/50 to-slate-950/50 backdrop-blur-2xl border border-orange-500/20 rounded-xl shadow-lg shadow-black/30 p-3 relative overflow-hidden">
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
                          className="flex-1 p-2 rounded-lg bg-gradient-to-r from-orange-500/80 to-orange-600/80 hover:from-orange-500 hover:to-orange-600 text-white transition-all text-xs font-semibold flex items-center justify-center gap-1 shadow-lg shadow-orange-500/20"
                        >
                          <Calendar className="w-3 h-3" />
                          Start Building
                        </button>
                        <button
                          onClick={() => navigate(createPageUrl('Activity'))}
                          className="flex-1 p-2 rounded-lg bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-500 hover:to-blue-600 text-white transition-all text-xs font-semibold flex items-center justify-center gap-1 shadow-lg shadow-blue-500/20"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Log Workout
                        </button>
                      </div>
                    </div>
                  </Card>
              )}
            </div>
          )}

          {/* Community Section */}
          {memberGym?.id && (
            <Link to={createPageUrl('GymCommunity') + `?id=${memberGym.id}`} className="block">
              <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 hover:border-blue-500/30 transition-all cursor-pointer shadow-2xl shadow-black/20 relative h-32 overflow-hidden group">
                {/* Gym Image Background */}
                {memberGym?.image_url ? (
                   <img src={memberGym.image_url} alt={memberGym.name} className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:opacity-100 transition-opacity" />
                 ) : (
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 opacity-60 group-hover:opacity-70 transition-opacity" />
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />

                <div className="relative p-4 h-full flex flex-col justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm tracking-tight">Your Gym Community</p>
                    <p className="text-slate-300 text-xs mt-0.5 font-medium">{memberGym.name}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">
                      {getCommunityText()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-2">
                        {(checkInUsers.length > 0 ? checkInUsers : [
                          { id: 'demo1', full_name: 'Alex Johnson', avatar_url: null },
                          { id: 'demo2', full_name: 'Sam Wilson', avatar_url: null }
                        ]).slice(0, 2).map((user) => (
                          <div key={user.id} className="relative group">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} className="w-6 h-6 rounded-full object-cover border-2 border-slate-700" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-[9px] font-bold border-2 border-slate-700">
                                {user.full_name?.[0] || 'U'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          )}



          {/* Weekly Challenges */}
          {featuredChallenge && (
            <Link to={createPageUrl('RedeemReward') + '?tab=challenges'} className="block">
              <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-[50px] border border-blue-500/40 hover:border-blue-400/50 transition-all cursor-pointer shadow-2xl shadow-black/20 rounded-2xl overflow-hidden group">
                <div className="relative p-4">
                  <div className="flex items-start justify-between gap-3 mb-4">
                     <div className="flex items-center gap-2">
                       <Trophy className="w-5 h-5 text-amber-400" />
                       <h3 className="text-base font-bold text-white tracking-tight">Compete & Crush It</h3>
                     </div>
                     <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                   </div>
                  <WeeklyChallengeCard challenge={featuredChallenge} currentUser={currentUser} />
                </div>
              </Card>
            </Link>
          )}

        {/* Join a Gym Prompt */}
        {gymMemberships.length === 0 && (
          <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 border-0 p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-white text-base mb-1 tracking-tight">Ready to Transform?</h3>
                <p className="text-blue-100 text-xs font-medium">Join a gym and build your winning streak today</p>
              </div>
              <Link to={createPageUrl('Gyms')}>
                <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                  Find Your Gym
                </Button>
              </Link>
            </div>
          </Card>
        )}
        </div>


      </div>

      {/* Streak Variant Picker */}
      <StreakVariantPicker 
        isOpen={showStreakVariants}
        onClose={() => setShowStreakVariants(false)}
        onSelect={handleStreakVariantSelect}
        selectedVariant={streakVariant}
      />

      {/* Check-in Modal */}
      {showCheckIn && memberGym && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Quick Check-In</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCheckIn(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <CheckInButton 
              gym={memberGym} 
              onCheckInSuccess={() => setWorkoutStartTime(Date.now())}
            />
          </div>
        </div>
      )}

      {/* Join with Code Modal */}
      <JoinWithCodeModal 
        open={showJoinModal} 
        onClose={() => setShowJoinModal(false)} 
        currentUser={currentUser}
      />

      {/* Create Split Modal */}
      <CreateSplitModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        currentUser={currentUser}
      />
    </PullToRefresh>
  );
}