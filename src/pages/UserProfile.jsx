import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, Calendar, Flame, TrendingUp, Building2, Target, Trophy, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, startOfDay } from 'date-fns';
import PostCard from '../components/feed/PostCard';
import StreakIcon from '../components/StreakIcon';

export default function UserProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');

  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: ['profileUser', userId],
    queryFn: () => base44.entities.User.filter({ id: userId }).then(r => r[0]),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', userId],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: userId }, '-check_in_date', 200),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', userId],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: userId, status: 'active' }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => base44.entities.Post.filter({ member_id: userId }, '-created_date', 30),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: primaryGym } = useQuery({
    queryKey: ['primaryGym', profileUser?.primary_gym_id],
    queryFn: () => base44.entities.Gym.filter({ id: profileUser.primary_gym_id }).then(r => r[0]),
    enabled: !!profileUser?.primary_gym_id,
    staleTime: 10 * 60 * 1000,
  });

  const calculateStreak = (cis) => {
    if (!cis.length) return 0;
    const today = startOfDay(new Date());
    const lastDate = startOfDay(new Date(cis[0].check_in_date));
    if (differenceInDays(today, lastDate) > 1) return 0;
    let streak = 1;
    for (let i = 0; i < cis.length - 1; i++) {
      const curr = startOfDay(new Date(cis[i].check_in_date));
      const next = startOfDay(new Date(cis[i + 1].check_in_date));
      const diff = differenceInDays(curr, next);
      if (diff === 1 || diff === 2) streak++;
      else break;
    }
    return streak;
  };

  const streak = profileUser?.current_streak ?? calculateStreak(checkIns);
  const longestStreak = profileUser?.longest_streak ?? 0;
  const displayName = profileUser?.username || profileUser?.full_name || 'User';

  const visiblePosts = userPosts.filter(p => (p.content || p.image_url || p.video_url) && !p.content?.includes('Well done, workout') && p.gym_join !== true);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading profile...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center flex-col gap-4">
        <div className="text-slate-400 text-sm">Profile not found.</div>
        <Link to={createPageUrl('Friends')} className="text-blue-400 text-sm underline">Go back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3">
        <div className="max-w-2xl mx-auto relative flex items-center justify-center">
          <Link to={createPageUrl('Friends')} className="absolute left-0">
            <button className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-base font-semibold text-slate-100">{displayName}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Profile Card */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl shadow-black/20">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0 ring-4 ring-slate-700/50">
              {profileUser.avatar_url ? (
                <img src={profileUser.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">{displayName?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{displayName}</h2>
              {profileUser.bio && (
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{profileUser.bio}</p>
              )}
              {primaryGym && (
                <Link to={createPageUrl('GymCommunity') + `?id=${primaryGym.id}`}>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">
                      {primaryGym.name}
                    </Badge>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-slate-900/70 to-slate-950/70 border border-white/10 p-4 rounded-2xl shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 mb-1">
              <StreakIcon className="w-5 h-5 text-orange-400" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Current Streak</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-white">{streak}</span>
              <span className="text-sm text-orange-300">days</span>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900/70 to-slate-950/70 border border-white/10 p-4 rounded-2xl shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-red-400" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Best Streak</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-white">{longestStreak}</span>
              <span className="text-sm text-red-300">days</span>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900/70 to-slate-950/70 border border-white/10 p-4 rounded-2xl shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Check-ins</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-white">{checkIns.length}</span>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900/70 to-slate-950/70 border border-white/10 p-4 rounded-2xl shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Gyms</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-white">{gymMemberships.length}</span>
            </div>
          </Card>
        </div>

        {/* Posts */}
        {visiblePosts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Posts</h3>
            {visiblePosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                fullWidth={true}
                currentUser={currentUser}
                onLike={() => {}}
                onComment={() => {}}
                onSave={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}

        {visiblePosts.length === 0 && (
          <Card className="bg-slate-800/40 border border-slate-600/40 p-8 text-center rounded-2xl">
            <p className="text-slate-400 text-sm">No posts yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}