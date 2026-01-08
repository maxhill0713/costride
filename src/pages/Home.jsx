import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Users, Trophy, TrendingUp, Flame, Calendar, ChevronRight, MapPin, Clock } from 'lucide-react';
import { format, isToday, differenceInDays, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Home() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list('-check_in_date')
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

  // Today's check-ins
  const todayCheckIns = checkIns.filter(c => isToday(new Date(c.check_in_date)));

  // Active challenges
  const activeChallenges = challenges.filter(c => c.status === 'active').slice(0, 3);

  // Recent lifts today
  const todayLifts = lifts.filter(l => isToday(new Date(l.created_date))).slice(0, 5);

  // User streak
  const userStreak = currentUser?.current_streak || 0;
  const lastCheckIn = currentUser?.last_check_in;
  const daysSinceCheckIn = lastCheckIn ? differenceInDays(new Date(), new Date(lastCheckIn)) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 px-4 py-8 shadow-xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                Welcome back{currentUser ? `, ${currentUser.full_name?.split(' ')[0]}` : ''}! 👋
              </h1>
              <p className="text-white/90 text-sm">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-white/95 backdrop-blur-sm p-4 text-center">
              <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-black text-gray-900">{userStreak}</div>
              <div className="text-xs text-gray-600 font-medium">Day Streak</div>
            </Card>
            <Card className="bg-white/95 backdrop-blur-sm p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-black text-gray-900">{todayCheckIns.length}</div>
              <div className="text-xs text-gray-600 font-medium">Checked In</div>
            </Card>
            <Card className="bg-white/95 backdrop-blur-sm p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-black text-gray-900">{activeChallenges.length}</div>
              <div className="text-xs text-gray-600 font-medium">Active</div>
            </Card>
            <Card className="bg-white/95 backdrop-blur-sm p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-black text-gray-900">{goals.length}</div>
              <div className="text-xs text-gray-600 font-medium">Goals</div>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Check-in Reminder */}
        {daysSinceCheckIn !== null && daysSinceCheckIn > 0 && (
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900">
                    {daysSinceCheckIn === 1 ? 'Haven\'t seen you today!' : `${daysSinceCheckIn} days since last check-in`}
                  </h3>
                  <p className="text-sm text-orange-700">Keep your streak alive! 🔥</p>
                </div>
              </div>
              <Link to={createPageUrl('Gyms')}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl">
                  Check In Now
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <Card className="bg-white border-2 border-gray-100 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-orange-500" />
                Active Challenges
              </h2>
              <Link to={createPageUrl('Challenges')}>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {activeChallenges.map((challenge) => (
                <Link key={challenge.id} to={createPageUrl('Challenges')}>
                  <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{challenge.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge className="capitalize">{challenge.type.replace('_', ' ')}</Badge>
                          <span>•</span>
                          <span>{challenge.participants?.length || 0} participants</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Who Checked In Today */}
        <Card className="bg-white border-2 border-gray-100 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              Who's Training Today
            </h2>
            <Badge className="bg-blue-100 text-blue-700 font-bold">
              {todayCheckIns.length} {todayCheckIns.length === 1 ? 'person' : 'people'}
            </Badge>
          </div>
          {todayCheckIns.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No check-ins yet today</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to check in!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayCheckIns.slice(0, 10).map((checkIn) => (
                <div key={checkIn.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {checkIn.user_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{checkIn.user_name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span>{checkIn.gym_name}</span>
                      {checkIn.first_visit && (
                        <Badge className="bg-green-100 text-green-700 text-xs">First Visit 🎉</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
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
          <Card className="bg-white border-2 border-gray-100 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-purple-500" />
                Today's Lifts
              </h2>
              <Link to={createPageUrl('Leaderboard')}>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {todayLifts.map((lift) => (
                <div key={lift.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-2xl border-2 border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{lift.member_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{lift.exercise?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-purple-700">{lift.weight_lbs}</p>
                    <p className="text-xs text-gray-500">lbs {lift.reps && `× ${lift.reps}`}</p>
                    {lift.is_pr && (
                      <Badge className="bg-red-500 text-white text-xs mt-1">PR! 🔥</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('Challenges')}>
            <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-500 border-0 text-white hover:shadow-xl transition-all cursor-pointer">
              <Trophy className="w-10 h-10 mb-3" />
              <h3 className="font-black text-lg mb-1">Join Challenge</h3>
              <p className="text-sm text-white/90">Compete with others</p>
            </Card>
          </Link>
          <Link to={createPageUrl('Gyms')}>
            <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 border-0 text-white hover:shadow-xl transition-all cursor-pointer">
              <Dumbbell className="w-10 h-10 mb-3" />
              <h3 className="font-black text-lg mb-1">Find Gyms</h3>
              <p className="text-sm text-white/90">Explore nearby</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}