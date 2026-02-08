import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '../components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Users, Trophy, TrendingUp, Flame, Calendar, ChevronRight, MapPin, Clock, CheckCircle, AlertCircle, Target, X, Crown, Bell, Heart, MessageCircle } from 'lucide-react';
import CheckInButton from '../components/gym/CheckInButton';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import WeeklyChallengeCard from '../components/challenges/WeeklyChallengeCard';
import TodayWorkout from '../components/profile/TodayWorkout';
import { useState } from 'react';
import { format, isToday, differenceInDays, startOfDay, startOfWeek, formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
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
    enabled: !!currentUser
  });

  const { data: allGyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list()
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list('-check_in_date'),
    refetchInterval: 30000
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.list('-created_date')
  });

  const { data: weeklyChallenges = [] } = useQuery({
    queryKey: ['weeklyChallenges'],
    queryFn: () => base44.entities.Challenge.filter({ 
      category: 'weekly',
      is_app_challenge: true 
    }, '-created_date', 2)
  });

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts'],
    queryFn: () => base44.entities.Lift.list('-created_date')
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser?.id }, '-created_date', 5),
    enabled: !!currentUser
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 50),
    enabled: !!currentUser
  });

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (currentUser && currentUser.onboarding_completed === false) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [currentUser?.onboarding_completed, navigate]);

  // Calculate these values before early return
  const memberGym = gymMemberships.length > 0 
    ? allGyms.find(g => g.id === gymMemberships[0].gym_id) 
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

  if (userLoading) {
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
  const todayCheckIns = allCheckIns.filter(c => isToday(new Date(c.check_in_date)));

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

  return (
    <PullToRefresh onRefresh={async () => {
      await queryClient.invalidateQueries();
    }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Hero Header */}
      <div className="bg-gradient-to-b from-slate-800/40 to-transparent backdrop-blur-sm border-b border-slate-700/50 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-orange-400">{userStreak}</span>
                <div className="relative w-8 h-8">
                  <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
                  <Dumbbell className="w-5 h-5 text-slate-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg]" />
                </div>
              </div>
              <div className="flex-1 text-center px-4">
                <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                  CoStride
                </h1>
              </div>
              <Link to={createPageUrl('Friends')}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative rounded-xl transition-all duration-300 hover:scale-125 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl opacity-0 group-hover:opacity-100 blur-md transition-all duration-300 group-hover:blur-lg" />
                  <Users className="w-8 h-8 relative z-10 text-cyan-400 group-hover:text-cyan-300 transition-all duration-300" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-end">
              {currentUser?.account_type === 'gym_owner' && (
                <Link to={createPageUrl('GymOwnerDashboard')}>
                  <Button className="bg-slate-700/60 hover:bg-slate-600/70 text-white border border-slate-600/40 backdrop-blur-sm rounded-xl">
                    <Trophy className="w-4 h-4 mr-2" />
                    Admin View
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-5">
        {/* Check-In Button */}
        {memberGym && (
          <>
            {daysSinceCheckIn === 0 ? (
              <Badge className="w-full justify-center bg-gradient-to-r from-green-500 to-emerald-500 text-white text-base px-6 py-4 shadow-lg">
                <CheckCircle className="w-5 h-5 mr-2" />
                Checked In Today ✓
              </Badge>
            ) : (
              <Button 
                onClick={() => setShowCheckIn(true)}
                className={`w-full text-white border-0 shadow-lg py-6 text-lg font-bold rounded-xl ${
                  daysSinceCheckIn === null
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                    : daysSinceCheckIn >= 3
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                }`}
              >
                <CheckCircle className="w-6 h-6 mr-3" />
                Check In Now
              </Button>
            )}
            {daysSinceCheckIn !== null && daysSinceCheckIn > 0 && (
              <p className="text-slate-400 text-sm font-light text-center">
                Not checked in for {daysSinceCheckIn} {daysSinceCheckIn === 1 ? 'day' : 'days'}
              </p>
            )}

            {/* Community Info */}
            <Card className="bg-slate-900/70 backdrop-blur-sm border border-blue-500/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-slate-300 text-sm mb-1">
                    {todayCheckIns.filter(c => c.gym_id === memberGym.id).length} {todayCheckIns.filter(c => c.gym_id === memberGym.id).length === 1 ? 'member' : 'members'} checked in today
                  </p>
                  <p className="text-slate-400 text-xs">Join your gym community</p>
                </div>
                <Link to={createPageUrl('GymCommunity') + '?id=' + memberGym.id}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    <Users className="w-4 h-4 mr-2" />
                    Community
                  </Button>
                </Link>
              </div>
            </Card>
          </>
        )}







        {/* Today's Workout */}
        {currentUser?.workout_split && (
          <TodayWorkout currentUser={currentUser} />
        )}



        {/* Top 3 Leaderboard Badge */}
        {(() => {
          const weeklyCheckInsAll = allCheckIns.filter(c => new Date(c.check_in_date) >= startOfThisWeek);
          const userCheckInCounts = {};
          const userNames = {};
          
          weeklyCheckInsAll.forEach(c => {
            userCheckInCounts[c.user_id] = (userCheckInCounts[c.user_id] || 0) + 1;
            if (!userNames[c.user_id]) {
              userNames[c.user_id] = c.user_name;
            }
          });
          
          const sortedUsers = Object.entries(userCheckInCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([userId, count], index) => ({ 
              userId, 
              rank: index + 1, 
              count,
              name: userNames[userId] 
            }));
          
          const userRank = sortedUsers.find(u => u.userId === currentUser?.id);
          const top3 = sortedUsers.slice(0, 3);
          
          if (userRank && userRank.rank <= 3) {
            const positionText = userRank.rank === 1 ? 'number one' : userRank.rank === 2 ? 'number two' : 'number three';
            const gradientClass = userRank.rank === 1 
              ? 'from-amber-500 to-yellow-500' 
              : userRank.rank === 2 
              ? 'from-slate-400 to-slate-300' 
              : 'from-orange-600 to-amber-700';
            const iconEmoji = userRank.rank === 1 ? '🥇' : userRank.rank === 2 ? '🥈' : '🥉';

            return (
              <Card className={`bg-gradient-to-r ${gradientClass} border-0 p-5 text-center shadow-xl animate-pulse`}>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">{iconEmoji}</span>
                  <p className="text-white font-bold text-base">
                    {currentUser.full_name?.split(' ')[0]} is {positionText} this week!
                  </p>
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </Card>
            );
          } else if (top3.length > 0) {
            return (
              <Card className="bg-slate-900/70 backdrop-blur-sm border border-amber-500/30 p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 text-center flex items-center justify-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  This Week's Leaders
                </h3>
                <div className="space-y-2">
                  {top3.map((user, idx) => {
                    const emoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                    const textColor = idx === 0 ? 'text-amber-300' : idx === 1 ? 'text-slate-300' : 'text-orange-300';

                    return (
                      <div key={user.userId} className="flex items-center justify-between bg-slate-800/40 border border-slate-700/30 rounded-lg px-3 py-2 hover:bg-slate-800/60 transition-all">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{emoji}</span>
                          <span className={`font-semibold text-sm ${textColor}`}>
                            {user.name?.split(' ')[0] || 'User'}
                          </span>
                        </div>
                        <Badge className="bg-slate-700/30 text-slate-200 border-slate-600 text-xs">
                          {user.count} check-ins
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          }
          return null;
        })()}

        {/* Join a Gym Prompt - Show at top for new members */}
        {gymMemberships.length === 0 && (
          <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 backdrop-blur-sm border-0 p-6 rounded-2xl mb-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-white text-base mb-1">Get Started</h3>
                <p className="text-blue-100 text-sm">Join a gym to start tracking your workouts and connect with the community</p>
              </div>
              <Link to={createPageUrl('Gyms')}>
                <Button className="bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-semibold whitespace-nowrap">
                  Join Gym
                </Button>
              </Link>
            </div>
          </Card>
        )}



        {/* Weekly Challenges */}
        {weeklyChallenges.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-400" />
              Weekly Challenges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weeklyChallenges.map(challenge => (
                <WeeklyChallengeCard 
                  key={challenge.id} 
                  challenge={challenge} 
                  currentUser={currentUser}
                />
              ))}
            </div>
          </div>
        )}



        {/* Friends Feed */}
        {friendPosts.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Friends Activity
            </h2>
            <div className="space-y-2">
              {friendPosts.slice(0, 10).map(post => (
                <Card key={post.id} className="bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/50 transition-all cursor-pointer">
                  <div className="p-3 flex items-start gap-3">
                    {post.member_avatar ? (
                      <img src={post.member_avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{post.member_name?.[0] || 'U'}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="font-semibold text-white text-sm">{post.member_name}</div>
                          <div className="text-xs text-slate-400">{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</div>
                        </div>
                        {(post.image_url || post.video_url) && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                            {post.video_url ? (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">▶</span>
                              </div>
                            ) : (
                              <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-3 text-slate-400 text-xs mt-2">
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span>{post.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{post.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Section */}
         {notifications.length > 0 && (
           <Card className="bg-slate-900/70 backdrop-blur-sm border border-blue-500/30 p-4">
             <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2 text-sm">
               <Bell className="w-4 h-4 text-blue-400" />
               Recent Notifications
             </h3>
             <div className="space-y-2">
               {notifications.slice(0, 3).map(notif => (
                 <div key={notif.id} className={`p-3 rounded-lg text-sm border ${notif.read ? 'bg-slate-800/40 border-slate-700/30' : 'bg-slate-800/60 border-blue-500/30'}`}>
                   <div className="text-slate-200">{notif.title}</div>
                   <div className="text-xs text-slate-400 mt-1">{notif.message}</div>
                 </div>
               ))}
             </div>
           </Card>
         )}







        {/* Premium Upgrade Card */}
         <Card className="p-6 bg-slate-900/70 backdrop-blur-sm border border-purple-500/30 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full -mr-20 -mt-20 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full -ml-16 -mb-16 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Crown className="w-4 h-4" />
                  </div>
                  <Badge className="bg-purple-500/30 text-purple-200 border border-purple-500/50 font-bold text-xs">
                    PREMIUM
                  </Badge>
                  <Badge className="bg-amber-500 text-amber-950 font-bold text-xs px-2 py-0.5 animate-pulse">
                    COMING SOON
                  </Badge>
                </div>
              </div>
            </div>
            <h3 className="font-bold text-base mb-2">Unlock Exclusive Rewards</h3>
            <p className="text-slate-300 text-xs mb-4 leading-relaxed">
              Access to brand rewards
            </p>
            <div className="mb-5">
              <div className="text-2xl font-bold text-white">£4.99<span className="text-sm text-slate-400 font-semibold">/month</span></div>
            </div>
            <Button disabled className="w-full bg-gradient-to-r from-purple-600 to-pink-600 opacity-60 cursor-not-allowed text-white font-bold rounded-xl">
              Coming Soon
            </Button>
          </div>
        </Card>

      </div>

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
            <CheckInButton gym={memberGym} />
          </div>
        </div>
      )}

      {/* Join with Code Modal */}
      <JoinWithCodeModal 
        open={showJoinModal} 
        onClose={() => setShowJoinModal(false)} 
        currentUser={currentUser}
      />
      </div>
    </PullToRefresh>
  );
}