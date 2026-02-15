import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Award, TrendingUp, Calendar, Dumbbell, ChevronLeft, MessageCircle, MapPin, Building2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatusBadge from '../components/profile/StatusBadge';
import ProfilePictureModal from '../components/profile/ProfilePictureModal';
import PostCard from '../components/feed/PostCard';

export default function UserProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [showProfilePicture, setShowProfilePicture] = useState(false);

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

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['userGymMemberships', userId],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: userId, status: 'active' }),
    enabled: !!userId
  });

  const { data: allGyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list()
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: async () => {
      const allPosts = await base44.entities.Post.list('-created_date');
      return allPosts.filter(p => p.member_id === userId);
    },
    enabled: !!userId
  });

  const { data: friendshipStatus } = useQuery({
    queryKey: ['friendship', currentUser?.id, userId],
    queryFn: async () => {
      if (!currentUser?.id || !userId) return null;
      const friendships = await base44.entities.Friend.filter({ user_id: currentUser.id, friend_id: userId });
      return friendships.length > 0 ? friendships[0] : null;
    },
    enabled: !!currentUser?.id && !!userId
  });

  // Only show primary gym for other users
  const primaryGymId = viewingUser?.primary_gym_id;
  const primaryGym = allGyms.find(g => g.id === primaryGymId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
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
  const isPrivate = viewingUser?.is_private && !isOwnProfile;
  const isFriend = friendshipStatus?.status === 'accepted';
  const shouldHideContent = isPrivate && !isFriend;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pb-8">
      {/* Header with Hero Banner */}
      <div className="relative pt-6 pb-4 px-4 md:px-6 border-b border-slate-700/50 overflow-hidden bg-gradient-to-b from-slate-800/40 to-transparent">
        {/* Hero Background */}
        {viewingUser.hero_image_url ? (
          <>
            <div className="absolute inset-0 z-0">
              <img src={viewingUser.hero_image_url} alt="" className="w-full h-full object-cover opacity-50" />
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-800/40 via-slate-900/60 to-slate-900" />
          </>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600/30 to-cyan-500/20" />
        )}

        {/* Back Button */}
        <Link to={createPageUrl('Friends')} className="absolute top-3 left-3 z-20">
          <button className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors">
            <ChevronLeft className="w-7 h-7" />
          </button>
        </Link>

        {/* Streak Display - Top Right */}
        <div className="absolute top-4 right-8 z-20 flex items-center gap-1">
          {viewingUser?.streak_variant === 'sunglasses' ? (
            <div className="relative w-6 h-6">
              <Flame className="w-6 h-6 text-orange-500 fill-current" />
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 64 64"
              >
                <circle cx="20" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black" />
                <circle cx="44" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black" />
                <line x1="26" y1="24" x2="38" y2="24" stroke="currentColor" strokeWidth="1.5" className="text-black" />
              </svg>
            </div>
          ) : viewingUser?.streak_variant === 'cowboy' ? (
            <div className="relative w-6 h-6">
              <Flame className="w-6 h-6 text-orange-500 fill-current" />
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
            <Flame className="w-6 h-6 text-orange-500 fill-current" />
          )}
          <span className="font-semibold text-white text-lg tracking-tight">{currentStreak}</span>
        </div>

        <div className="max-w-4xl mx-auto relative z-10 pt-8">
          <div className="flex items-start gap-5">
            <button 
              onClick={() => setShowProfilePicture(true)}
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-slate-700/50 cursor-pointer hover:ring-blue-500/50 transition-all active:scale-95"
            >
              {viewingUser.avatar_url ? (
                <img src={viewingUser.avatar_url} alt={viewingUser.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-semibold text-white tracking-tight">
                  {viewingUser.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </button>
            <div className="flex-1">
               <div className="flex flex-col gap-2 mb-2">
                  <h1 className="text-xl md:text-2xl font-medium tracking-[-0.02em] text-white leading-tight">{viewingUser.full_name}</h1>
                  <div className="flex items-center flex-wrap gap-2">
                    <StatusBadge checkIns={checkIns} streak={currentStreak} size="sm" />
                  </div>
                </div>
              
              {/* Equipped Badges */}
              {viewingUser?.equipped_badges?.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {viewingUser.equipped_badges.map((badgeId) => {
                    const badge = streakMilestones.find(m => `${m.days}_day_streak` === badgeId) || 
                                 [
                                   { id: '10_visits', icon: '🎯', color: 'from-blue-400 to-blue-600' },
                                   { id: '50_visits', icon: '🔥', color: 'from-orange-400 to-red-500' },
                                   { id: '100_visits', icon: '🏆', color: 'from-yellow-400 to-orange-500' },
                                   { id: '7_day_streak', icon: '⚡', color: 'from-green-400 to-emerald-500' },
                                   { id: '30_day_streak', icon: '🔥', color: 'from-red-400 to-pink-500' },
                                   { id: '90_day_streak', icon: '👑', color: 'from-purple-400 to-pink-500' },
                                   { id: '1_year', icon: '📅', color: 'from-indigo-400 to-blue-500' },
                                   { id: 'community_leader', icon: '👥', color: 'from-cyan-400 to-blue-500' }
                                 ].find(b => b.id === badgeId);
                    if (!badge) return null;
                    return (
                      <div 
                        key={badgeId}
                        className={`w-8 h-8 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg ring-2 ring-slate-600/40`}
                        title={badge.name || badgeId}
                      >
                        <span className="text-sm">{badge.icon}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {viewingUser.bio && (
            <p className="text-slate-300 text-sm leading-relaxed mt-4 max-w-xl">{viewingUser.bio}</p>
          )}

          {/* Home Gym */}
           {primaryGym && !isOwnProfile && (
             <Link to={createPageUrl('GymCommunity') + `?id=${primaryGym.id}`}>
               <div className="flex items-center gap-2 mt-3 flex-wrap cursor-pointer hover:opacity-80 transition-opacity">
                 <Building2 className="w-4 h-4 text-blue-400" />
                 <Badge 
                   className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs"
                 >
                   {primaryGym.name}
                 </Badge>
               </div>
             </Link>
           )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {shouldHideContent ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <p className="text-slate-400 text-lg font-medium">Private Account</p>
            </div>
          </div>
        ) : (
        <>
        {/* Streak Stats - Only show on own profile */}
        {isOwnProfile && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-4 bg-slate-900/70 backdrop-blur-sm border border-orange-500/40 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-6 h-6 text-orange-400" />
              <div>
                <p className="text-xs font-medium text-orange-300">Current Streak</p>
                <p className="text-2xl font-black text-white">{currentStreak}</p>
                <p className="text-xs text-orange-400">days</p>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-orange-300 mb-1">
                <span>Next: {nextMilestone.name}</span>
                <span>{currentStreak}/{nextMilestone.days}</span>
              </div>
              <Progress value={streakProgress} className="h-1.5 bg-slate-700" />
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/70 backdrop-blur-sm border border-purple-500/40 rounded-xl">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-xs font-medium text-purple-300">Longest Streak</p>
                <p className="text-2xl font-black text-white">{longestStreak}</p>
                <p className="text-xs text-purple-400">days ever</p>
              </div>
            </div>
          </Card>
        </div>
        )}

        {/* Milestone Badges */}
        {earnedBadges.length > 0 && (
          <Card className="p-4 mb-4 bg-gradient-to-br from-yellow-600/15 to-yellow-500/5 backdrop-blur-sm border border-yellow-500/40 rounded-xl">
            <h3 className="font-semibold text-yellow-300 mb-3 flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-yellow-400" />
              Milestones Unlocked
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {earnedBadges.map((badge) => (
                <div key={badge.days} className={`p-3 rounded-xl bg-gradient-to-br ${badge.color} text-white text-center`}>
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <p className="font-bold text-xs">{badge.name}</p>
                  <p className="text-xs opacity-90">{badge.days}d</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Card className="p-3 text-center bg-slate-900/70 backdrop-blur-sm border border-blue-500/40 rounded-xl">
            <Dumbbell className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <p className="text-xl font-black text-white">{totalLifts}</p>
            <p className="text-xs text-slate-400">Lifts</p>
          </Card>
          <Card className="p-3 text-center bg-slate-900/70 backdrop-blur-sm border border-orange-500/40 rounded-xl">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-orange-400" />
            <p className="text-xl font-black text-white">{personalRecords}</p>
            <p className="text-xs text-slate-400">PRs</p>
          </Card>
          <Card className="p-3 text-center bg-slate-900/70 backdrop-blur-sm border border-green-500/40 rounded-xl">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-400" />
            <p className="text-xl font-black text-white">{totalWeight.toLocaleString()}</p>
            <p className="text-xs text-slate-400">lbs</p>
          </Card>
          <Card className="p-3 text-center bg-slate-900/70 backdrop-blur-sm border border-purple-500/40 rounded-xl">
            <Award className="w-5 h-5 mx-auto mb-1 text-purple-400" />
            <p className="text-xl font-black text-white">{bestLift}</p>
            <p className="text-xs text-slate-400">Max</p>
          </Card>
        </div>

        {/* Progress Chart */}
        {progressData.length > 0 && (
          <Card className="p-4 mb-4 bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-xl">
            <h3 className="font-semibold text-white mb-3 text-sm">Bench Press Progress</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="session" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Favourite Posts */}
        {userPosts.filter(p => p.is_favourite).length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-amber-400" />
              Favourite Posts
            </h3>
            <div className="space-y-3">
              {userPosts.filter(p => p.is_favourite).map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post}
                  onLike={() => {}}
                  onComment={() => {}}
                  onSave={() => {}}
                  onDelete={() => queryClient.invalidateQueries({ queryKey: ['userPosts'] })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Goals */}
         {goals.length > 0 && (
          <Card className="p-4 mb-4 bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-xl">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-blue-400" />
              Active Goals
            </h3>
            <div className="space-y-2">
              {goals.filter(g => g.status === 'active').slice(0, 3).map((goal) => {
                const progress = (goal.current_value / goal.target_value) * 100;
                return (
                  <div key={goal.id} className="p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-white text-sm">{goal.title}</h4>
                      <Badge className="bg-slate-700 text-slate-300 text-xs">{goal.unit}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>{goal.current_value} / {goal.target_value}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5 bg-slate-700" />
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="p-4 bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-xl">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-blue-400" />
            Recent Check-ins
          </h3>
          {checkIns.length === 0 ? (
            <p className="text-slate-500 text-center py-6 text-sm">No recent check-ins</p>
          ) : (
            <div className="space-y-2">
              {checkIns.slice(0, 5).map((checkIn) => (
                <div key={checkIn.id} className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="font-medium text-white text-sm">{checkIn.gym_name}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(checkIn.check_in_date).toLocaleDateString()}
                    </p>
                  </div>
                  {checkIn.first_visit && (
                    <Badge className="bg-green-500/20 text-green-300 border border-green-500/40 text-xs">First Visit!</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
        </>
        )}
        </div>

      <ProfilePictureModal
        isOpen={showProfilePicture}
        onClose={() => setShowProfilePicture(false)}
        imageUrl={viewingUser?.avatar_url}
        userName={viewingUser?.full_name}
      />
    </div>
  );
}