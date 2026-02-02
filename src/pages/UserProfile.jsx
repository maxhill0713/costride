import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Award, TrendingUp, Calendar, Dumbbell, ChevronLeft, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function UserProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: viewingUser, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.id === userId);
    },
    enabled: !!userId
  });

  const { data: lifts = [] } = useQuery({
    queryKey: ['userLifts', userId],
    queryFn: async () => {
      const allLifts = await base44.entities.Lift.list('-created_date');
      return allLifts.filter(l => l.member_id === userId);
    },
    enabled: !!userId
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['userCheckIns', userId],
    queryFn: async () => {
      const allCheckIns = await base44.entities.CheckIn.list('-check_in_date');
      return allCheckIns.filter(c => c.user_id === userId);
    },
    enabled: !!userId
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['userGoals', userId],
    queryFn: async () => {
      const allGoals = await base44.entities.Goal.list();
      return allGoals.filter(g => g.user_id === userId);
    },
    enabled: !!userId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!viewingUser) {
    // Don't show error UI, just redirect
    if (!isLoading) {
      window.location.href = createPageUrl('Home');
    }
    return null;
  }

  const isOwnProfile = currentUser?.id === userId;

  // Calculate stats
  const totalLifts = lifts.length;
  const personalRecords = lifts.filter(l => l.is_pr).length;
  const totalWeight = lifts.reduce((sum, lift) => sum + (lift.weight_lbs || 0) * (lift.reps || 1), 0);
  const bestLift = lifts.length > 0 ? Math.max(...lifts.map(l => l.weight_lbs || 0)) : 0;

  // Streak milestones
  const streakMilestones = [
    { days: 7, name: '7 Day Warrior', icon: '🔥', color: 'from-orange-400 to-red-500' },
    { days: 30, name: 'Monthly Master', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { days: 50, name: 'Unstoppable', icon: '💪', color: 'from-purple-400 to-pink-500' },
    { days: 100, name: 'Century Champion', icon: '👑', color: 'from-blue-400 to-cyan-500' },
    { days: 365, name: 'Year Legend', icon: '🏆', color: 'from-green-400 to-emerald-500' }
  ];

  const currentStreak = viewingUser.current_streak || 0;
  const longestStreak = viewingUser.longest_streak || 0;
  const nextMilestone = streakMilestones.find(m => m.days > currentStreak) || streakMilestones[streakMilestones.length - 1];
  const streakProgress = (currentStreak / nextMilestone.days) * 100;

  // Progress chart data
  const progressData = lifts
    .filter(l => l.exercise === 'bench_press')
    .slice(0, 10)
    .reverse()
    .map((lift, idx) => ({
      session: idx + 1,
      weight: lift.weight_lbs
    }));

  const earnedBadges = streakMilestones.filter(m => longestStreak >= m.days);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-cyan-500 px-4 py-8 relative">
        <Link to={createPageUrl('Friends')} className="absolute top-2 left-2 z-10">
          <Button variant="ghost" size="icon" className="bg-white/20 backdrop-blur hover:bg-white/30 text-white rounded-full w-8 h-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden border-4 border-white/30">
              {viewingUser.avatar_url ? (
                <img src={viewingUser.avatar_url} alt={viewingUser.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-white">
                  {viewingUser.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white mb-1">{viewingUser.full_name}</h1>
              {viewingUser.bio && <p className="text-white/90 mb-2">{viewingUser.bio}</p>}
              {viewingUser.location && (
                <p className="text-white/80 text-sm">{viewingUser.location}</p>
              )}
              <div className="flex gap-2 mt-2">
                {isOwnProfile ? (
                  <Link to={createPageUrl('Profile')}>
                    <Button size="sm" className="bg-white/20 backdrop-blur hover:bg-white/30 text-white rounded-2xl">
                      Edit Profile
                    </Button>
                  </Link>
                ) : (
                  <Link to={`${createPageUrl('Messages')}?userId=${userId}`}>
                    <Button size="sm" className="bg-white/20 backdrop-blur hover:bg-white/30 text-white rounded-2xl">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* Streak Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-700">Current Streak</p>
                <p className="text-3xl font-black text-orange-900">{currentStreak}</p>
                <p className="text-xs text-orange-600">days</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-orange-700 mb-1">
                <span>Next: {nextMilestone.name}</span>
                <span>{currentStreak}/{nextMilestone.days}</span>
              </div>
              <Progress value={streakProgress} className="h-2 bg-orange-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-700">Longest Streak</p>
                <p className="text-3xl font-black text-purple-900">{longestStreak}</p>
                <p className="text-xs text-purple-600">days ever</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Milestone Badges */}
        {earnedBadges.length > 0 && (
          <Card className="p-6 mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Streak Milestones Achieved
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {earnedBadges.map((badge) => (
                <div key={badge.days} className={`p-4 rounded-2xl bg-gradient-to-br ${badge.color} text-white text-center`}>
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <p className="font-bold text-sm">{badge.name}</p>
                  <p className="text-xs opacity-90">{badge.days} days</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <Card className="p-4 text-center">
            <Dumbbell className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-black text-gray-900">{totalLifts}</p>
            <p className="text-xs text-gray-600">Total Lifts</p>
          </Card>
          <Card className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-black text-gray-900">{personalRecords}</p>
            <p className="text-xs text-gray-600">PRs</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-black text-gray-900">{totalWeight.toLocaleString()}</p>
            <p className="text-xs text-gray-600">Total lbs</p>
          </Card>
          <Card className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-black text-gray-900">{bestLift}</p>
            <p className="text-xs text-gray-600">Max Lift</p>
          </Card>
        </div>

        {/* Progress Chart */}
        {progressData.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Bench Press Progress</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="session" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Goals */}
        {goals.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-600" />
              Active Goals
            </h3>
            <div className="space-y-3">
              {goals.filter(g => g.status === 'active').slice(0, 3).map((goal) => {
                const progress = (goal.current_value / goal.target_value) * 100;
                return (
                  <div key={goal.id} className="p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{goal.title}</h4>
                      <Badge>{goal.unit}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>{goal.current_value} / {goal.target_value}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Recent Check-ins
          </h3>
          {checkIns.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent check-ins</p>
          ) : (
            <div className="space-y-2">
              {checkIns.slice(0, 5).map((checkIn) => (
                <div key={checkIn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-medium text-gray-900">{checkIn.gym_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(checkIn.check_in_date).toLocaleDateString()}
                    </p>
                  </div>
                  {checkIn.first_visit && (
                    <Badge className="bg-green-500">First Visit!</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}