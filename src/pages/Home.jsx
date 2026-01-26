import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Users, Trophy, TrendingUp, Flame, Calendar, ChevronRight, MapPin, Clock, CheckCircle, AlertCircle, Target, X, Crown, Bell } from 'lucide-react';
import CheckInButton from '../components/gym/CheckInButton';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import WeeklyChallengeCard from '../components/challenges/WeeklyChallengeCard';
import { useState } from 'react';
import { format, isToday, differenceInDays, startOfDay, startOfWeek } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Home() {
  const navigate = useNavigate();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
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

  const memberGym = gymMemberships.length > 0 
    ? allGyms.find(g => g.id === gymMemberships[0].gym_id) 
    : null;

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (currentUser && !currentUser.onboarding_completed) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [currentUser, navigate]);

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list('-check_in_date'),
    refetchInterval: 30000 // Refetch every 30 seconds
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

  // Filter user's check-ins
  const userCheckIns = allCheckIns.filter(c => c.user_id === currentUser?.id);

  // Today's check-ins (all users)
  const todayCheckIns = allCheckIns.filter(c => isToday(new Date(c.check_in_date)));

  // Active challenges
  const activeChallenges = challenges.filter(c => c.status === 'active').slice(0, 3);

  // Recent lifts today
  const todayLifts = lifts.filter(l => isToday(new Date(l.created_date))).slice(0, 5);

  // Calculate user streak from check-ins
  const calculateStreak = (checkIns) => {
    if (checkIns.length === 0) return 0;
    
    let streak = 1;
    const today = startOfDay(new Date());
    
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
        if (daysSinceReminder < 2) return; // Don't spam reminders
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

  // Calculate weekly progress
  const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const weeklyCheckIns = userCheckIns.filter(c => new Date(c.check_in_date) >= startOfThisWeek);
  const weeklyTarget = 3; // Target: 3 gym visits per week
  
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-blue-700/40 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-2">
                    Welcome back{currentUser ? `, ${currentUser.full_name?.split(' ')[0]}` : ''}! 👋
                  </h1>
                  {daysSinceCheckIn !== null && daysSinceCheckIn > 0 && (
                    <p className="text-slate-400 text-xs md:text-sm">
                      Not checked in for {daysSinceCheckIn} {daysSinceCheckIn === 1 ? 'day' : 'days'}
                    </p>
                  )}
              </div>
              {currentUser?.account_type === 'gym_owner' && (
                <Link to={createPageUrl('GymOwnerDashboard')}>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 backdrop-blur-sm">
                    <Trophy className="w-4 h-4 mr-2" />
                    Admin View
                  </Button>
                </Link>
              )}
            </div>

            {daysSinceCheckIn === 0 ? (
               <Badge className="w-fit bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm px-6 py-3 shadow-lg animate-pulse">
                 <CheckCircle className="w-5 h-5 mr-2" />
                 Checked In ✓
               </Badge>
             ) : memberGym ? (
               <Button 
                 onClick={() => setShowCheckIn(true)}
                 className={`w-fit text-white border-0 shadow-lg px-6 py-3 text-base ${
                   daysSinceCheckIn === null || daysSinceCheckIn === 0
                     ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                     : daysSinceCheckIn >= 3
                     ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                     : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                 }`}
               >
                 <CheckCircle className="w-5 h-5 mr-2" />
                 Check In Now
               </Button>
             ) : null}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-600/30 p-4 text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">{userStreak}</div>
            <div className="text-xs text-slate-400 mt-1">Day Streak</div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-600/30 p-4 text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{userCheckIns.length}</div>
            <div className="text-xs text-slate-400 mt-1">Total Visits</div>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-600/30 p-4 text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">{weeklyCheckIns.length}</div>
            <div className="text-xs text-slate-400 mt-1">This Week</div>
          </Card>
        </div>

        {/* Top 3 Leaderboard Badge */}
        {(() => {
          const weeklyCheckInsAll = allCheckIns.filter(c => new Date(c.check_in_date) >= startOfThisWeek);
          const userCheckInCounts = {};
          weeklyCheckInsAll.forEach(c => {
            userCheckInCounts[c.user_id] = (userCheckInCounts[c.user_id] || 0) + 1;
          });
          const sortedUsers = Object.entries(userCheckInCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([userId], index) => ({ userId, rank: index + 1 }));
          
          const userRank = sortedUsers.find(u => u.userId === currentUser?.id);
          
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
          }
          return null;
        })()}



        {/* Progress Tracker */}
        <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-600/40 p-6 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOnTrack ? 'bg-green-500/20 text-green-400' : isAlmostOnTrack ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
              {isOnTrack ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-100 mb-4">
                {isOnTrack ? 'On Track' : isAlmostOnTrack ? 'Almost On Track' : 'Needs Attention'}
              </h3>
              <div className="space-y-3">
                <div>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-sm text-slate-300">Weekly Gym Visits</span>
                       <span className="text-sm font-semibold text-slate-200">{weeklyCheckIns.length} / {weeklyTarget}</span>
                    </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${weeklyCheckIns.length >= weeklyTarget ? 'bg-green-500' : 'bg-amber-500'} transition-all duration-500`}
                      style={{ width: `${Math.min((weeklyCheckIns.length / weeklyTarget) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                {goals.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-sm text-slate-300">Goals Progress</span>
                       <span className="text-sm font-semibold text-slate-200">{progressPercentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${goalsOnTrack >= goals.length * 0.5 ? 'bg-green-500' : 'bg-amber-500'} transition-all duration-500`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Card 
            onClick={() => setShowJoinModal(true)}
            className="p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 hover:bg-slate-800/70 hover:border-slate-500/50 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-sm text-slate-100">Join with Code</h3>
            </div>
            <p className="text-xs text-slate-400 ml-13">Enter your gym's code</p>
          </Card>
          <Link to={createPageUrl('Gyms')}>
            <Card className="p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 hover:bg-slate-800/70 hover:border-slate-500/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100">View Gyms</h3>
              </div>
              <p className="text-xs text-slate-400 ml-13">Explore communities</p>
            </Card>
          </Link>
        </div>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <Card className="bg-slate-800/40 backdrop-blur-sm border border-blue-700/40 rounded-2xl p-4">
            <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4 text-blue-400" />
              Recent Notifications
            </h3>
            <div className="space-y-2">
              {notifications.slice(0, 3).map(notif => (
                <div key={notif.id} className={`p-3 rounded-lg text-sm ${notif.read ? 'bg-slate-900/40' : 'bg-slate-900/60 border-l-2 border-blue-500'}`}>
                  <div className="text-slate-200">{notif.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{notif.message}</div>
                </div>
              ))}
            </div>
          </Card>
        )}





        {/* Today's Activity */}
        {todayLifts.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-purple-400" />
                Today's Lifts
              </h2>
              <Link to={createPageUrl('Leaderboard')}>
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {todayLifts.map((lift) => (
                <div key={lift.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-700/60 via-purple-900/40 to-pink-900/40 rounded-2xl border border-slate-600/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100 text-sm">{lift.member_name}</p>
                      <p className="text-xs text-slate-300 capitalize">{lift.exercise?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{lift.weight_lbs}</p>
                    <p className="text-xs text-slate-500">lbs {lift.reps && `× ${lift.reps}`}</p>
                    {lift.is_pr && (
                      <Badge className="bg-red-500 text-white text-xs mt-1">PR! 🔥</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Premium Upgrade Card */}
        <Card className="p-6 bg-gradient-to-br from-slate-800/80 via-purple-900/40 to-slate-900/80 backdrop-blur-sm border border-purple-600/40 text-white relative overflow-hidden">
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
                  <Badge className="bg-amber-500 text-amber-950 font-bold text-[10px] px-2 py-0.5 animate-pulse">
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
    </div>
  );
}