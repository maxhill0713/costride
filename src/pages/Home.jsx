import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Users, Trophy, TrendingUp, Flame, Calendar, ChevronRight, MapPin, Clock, CheckCircle, AlertCircle, Target, X, Crown } from 'lucide-react';
import CheckInButton from '../components/gym/CheckInButton';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
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

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts'],
    queryFn: () => base44.entities.Lift.list('-created_date')
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser?.id, status: 'active' }),
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-100 mb-2">
                Welcome back{currentUser ? `, ${currentUser.full_name?.split(' ')[0]}` : ''}! 👋
              </h1>
              <p className="text-slate-400 text-sm">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-2">
              {daysSinceCheckIn === 0 ? (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm px-4 py-2 shadow-lg animate-pulse">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Checked In ✓
                </Badge>
              ) : (
                <Button 
                  onClick={() => setShowCheckIn(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check In
                </Button>
              )}
              {currentUser?.account_type === 'gym_owner' && (
                <Link to={createPageUrl('GymOwnerDashboard')}>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 backdrop-blur-sm">
                    <Trophy className="w-4 h-4 mr-2" />
                    Admin View
                  </Button>
                </Link>
              )}
            </div>
          </div>


        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Streak Status - One Line */}
        <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-cyan-600/30 p-4 shadow-lg">
          <p className="text-center text-lg font-bold">
            {userStreak > 0 && daysSinceCheckIn === 0 ? (
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                🔥 {userStreak}-day streak active
              </span>
            ) : userStreak > 0 && daysSinceCheckIn === 1 ? (
              <span className="bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent">
                ⚠️ Check in today to keep your streak
              </span>
            ) : currentUser?.streak_freeze_active ? (
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Streak frozen today ❄️
              </span>
            ) : (
              <span className="bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent">
                Start your streak today 💪
              </span>
            )}
          </p>
        </Card>

        {/* Progress Tracker */}
        <Card className={`${isOnTrack ? 'bg-gradient-to-br from-slate-700/70 to-slate-800/70 border border-green-500/40' : isAlmostOnTrack ? 'bg-gradient-to-br from-slate-700/70 to-slate-800/70 border border-amber-500/40' : 'bg-gradient-to-br from-slate-700/70 to-slate-800/70 border border-amber-500/40'} p-5 shadow-lg backdrop-blur-sm`}>
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${isOnTrack ? 'bg-green-600/60' : isAlmostOnTrack ? 'bg-amber-600/60' : 'bg-amber-600/60'} border ${isOnTrack ? 'border-green-500/50' : 'border-amber-500/50'}`}>
              {isOnTrack ? <CheckCircle className="w-8 h-8 text-green-300" /> : <AlertCircle className="w-8 h-8 text-amber-300" />}
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-black mb-2 ${isOnTrack ? 'text-green-300' : isAlmostOnTrack ? 'text-amber-300' : 'text-amber-300'}`}>
                {isOnTrack ? `🎉 You're On Track!` : isAlmostOnTrack ? `💪 You're Almost On Track` : `⚠️ You're Falling Behind`}
              </h3>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${isOnTrack ? 'text-green-300' : isAlmostOnTrack ? 'text-amber-300' : 'text-amber-300'}`}>
                      Weekly Gym Visits: {weeklyCheckIns.length}/{weeklyTarget}
                    </span>
                    <span className={`text-xs font-bold ${weeklyCheckIns.length >= weeklyTarget ? 'text-green-400' : 'text-amber-400'}`}>
                      {weeklyCheckIns.length >= weeklyTarget ? `✓ Complete` : 'Incomplete'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50">
                    <div 
                      className={`h-full ${weeklyCheckIns.length >= weeklyTarget ? 'bg-green-600' : 'bg-amber-600'} transition-all duration-500`}
                      style={{ width: `${Math.min((weeklyCheckIns.length / weeklyTarget) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                {goals.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${isOnTrack ? 'text-green-300' : isAlmostOnTrack ? 'text-amber-300' : 'text-amber-300'}`}>
                        Goals Progress: {goalsOnTrack}/{goals.length} on track
                      </span>
                      <span className={`text-xs font-bold ${goalsOnTrack >= goals.length * 0.5 ? 'text-green-400' : 'text-amber-400'}`}>
                        {progressPercentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50">
                      <div 
                        className={`h-full ${goalsOnTrack >= goals.length * 0.5 ? 'bg-green-600' : 'bg-amber-600'} transition-all duration-500`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <p className={`text-sm mt-3 ${isOnTrack ? 'text-green-300' : isAlmostOnTrack ? 'text-amber-300' : 'text-amber-300'}`}>
                {isOnTrack 
                  ? `Keep up the great work! You're crushing your fitness goals 💪` 
                  : isAlmostOnTrack
                  ? `You're so close! Complete one more to get fully on track 🔥`
                  : `Don't give up! Get back on track by checking in at a gym today 🔥`}
              </p>
              {!isOnTrack && (
                <Link to={createPageUrl('Gyms')} className="mt-3 inline-block">
                  <Button className="bg-amber-600/80 hover:bg-amber-600 text-white border border-amber-500/50 rounded-2xl">
                    <Target className="w-4 h-4 mr-2" />
                    Check In Now
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>

        {/* Check-in Reminder */}
        {daysSinceCheckIn !== null && daysSinceCheckIn > 0 && (
          <Card className="bg-gradient-to-br from-slate-700/70 to-slate-800/70 border border-red-500/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600/60 border border-red-500/50 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-red-300" />
                </div>
                <div>
                  <h3 className="font-bold text-red-300">
                    {daysSinceCheckIn === 1 ? "Haven't seen you today!" : `${daysSinceCheckIn} days since last check-in`}
                  </h3>
                  <p className="text-sm text-red-300/80">Keep your streak alive! 🔥</p>
                </div>
              </div>
              <Link to={createPageUrl('Gyms')}>
                <Button className="bg-red-600/80 hover:bg-red-600 border border-red-500/50 text-white rounded-2xl">
                  Check In Now
                </Button>
              </Link>
            </div>
          </Card>
        )}



        {/* Who Checked In Today */}
        <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" />
              Who's Training Today
            </h2>
            <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/50 font-bold">
              {todayCheckIns.length} {todayCheckIns.length === 1 ? 'person' : 'people'}
            </Badge>
          </div>
          {todayCheckIns.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                <p className="text-slate-300">No check-ins yet today</p>
                <p className="text-sm text-slate-400 mt-1">Be the first to check in!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayCheckIns.slice(0, 10).map((checkIn) => (
                <div key={checkIn.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-700/60 to-slate-800/60 rounded-2xl border border-slate-600/30">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <span className="text-white font-bold text-sm">
                      {checkIn.user_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-100">{checkIn.user_name}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin className="w-3 h-3" />
                      <span>{checkIn.gym_name}</span>
                      {checkIn.first_visit && (
                        <Badge className="bg-green-100 text-green-700 text-xs">First Visit 🎉</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(checkIn.check_in_date), 'h:mm a')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Today's Activity */}
        {todayLifts.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent flex items-center gap-2">
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
                      <p className="font-bold text-slate-100">{lift.member_name}</p>
                      <p className="text-sm text-slate-300 capitalize">{lift.exercise?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{lift.weight_lbs}</p>
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
        <Link to={createPageUrl('Premium')}>
          <Card className="p-5 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 border-0 text-white hover:shadow-2xl hover:shadow-purple-500/50 transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-white/20 text-white border-0 font-bold px-3 py-1">
                  <Trophy className="w-3 h-3 mr-1" />
                  LIMITED OFFER
                </Badge>
                <Crown className="w-8 h-8" />
              </div>
              <h3 className="font-black text-2xl mb-2">Go Premium for £4.99/mo</h3>
              <p className="text-white/90 text-sm mb-4">
                Unlock exclusive badges, advanced analytics, and priority features
              </p>
              <Button className="bg-white text-purple-600 hover:bg-white/90 font-bold rounded-xl">
                Upgrade Now
              </Button>
            </div>
          </Card>
        </Link>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            onClick={() => setShowJoinModal(true)}
            className="p-6 bg-gradient-to-br from-green-500 to-emerald-500 border-0 text-white hover:shadow-xl hover:shadow-green-500/30 transition-all cursor-pointer"
          >
            <CheckCircle className="w-10 h-10 mb-3" />
            <h3 className="font-black text-lg mb-1">Join with Code</h3>
            <p className="text-sm text-white/90">Instant gym access</p>
          </Card>
          <Link to={createPageUrl('Gyms')}>
            <Card className="p-6 bg-gradient-to-br from-cyan-500 to-blue-500 border-0 text-white hover:shadow-xl hover:shadow-cyan-500/30 transition-all cursor-pointer">
              <Trophy className="w-10 h-10 mb-3" />
              <h3 className="font-black text-lg mb-1">View Gyms</h3>
              <p className="text-sm text-white/90">Explore communities</p>
            </Card>
          </Link>
        </div>

        {/* Check-in Modal */}
        {showCheckIn && memberGym && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-gray-900">Quick Check-In</h2>
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