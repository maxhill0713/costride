import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, Flame, Calendar, Trophy, MapPin, Building2, UserPlus, UserMinus, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PostCard from '../components/feed/PostCard';
import { differenceInDays, startOfDay } from 'date-fns';

export default function UserProfile() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: profileUsers = [] } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => base44.entities.User.filter({ id: userId }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const profileUser = profileUsers[0];

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', userId],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: userId }, '-check_in_date', 100),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => base44.entities.Post.filter({ member_id: userId }, '-created_date', 20),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', userId],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: userId, status: 'active' }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser.id, status: 'accepted' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  const isFriend = friends.some(f => f.friend_id === userId);

  const addFriendMutation = useMutation({
    mutationFn: () => base44.functions.invoke('manageFriendship', { friendId: userId, action: 'add' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['friends']);
      toast.success('Friend request sent!');
    }
  });

  const removeFriendMutation = useMutation({
    mutationFn: () => base44.functions.invoke('manageFriendship', { friendId: userId, action: 'remove' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['friends']);
      toast.success('Friend removed');
    }
  });

  const calculateStreak = (checkInsData) => {
    if (!checkInsData || checkInsData.length === 0) return 0;
    const today = startOfDay(new Date());
    const lastCheckInDate = startOfDay(new Date(checkInsData[0].check_in_date));
    const daysSince = differenceInDays(today, lastCheckInDate);
    if (daysSince > 1) return 0;
    let streak = 1;
    for (let i = 0; i < checkInsData.length - 1; i++) {
      const current = startOfDay(new Date(checkInsData[i].check_in_date));
      const next = startOfDay(new Date(checkInsData[i + 1].check_in_date));
      const diff = differenceInDays(current, next);
      if (diff === 1 || diff === 2) streak++;
      else break;
    }
    return streak;
  };

  const streak = calculateStreak(checkIns);
  const longestStreak = profileUser?.longest_streak || 0;
  const displayName = profileUser?.username || profileUser?.full_name;
  const isOwnProfile = currentUser?.id === userId;

  const primaryGymId = profileUser?.primary_gym_id || (gymMemberships.length > 0 ? gymMemberships[0].gym_id : null);
  const primaryMembership = gymMemberships.find(m => m.gym_id === primaryGymId) || gymMemberships[0];

  const visiblePosts = userPosts.filter(p => (p.content || p.image_url || p.video_url) && !p.content?.includes('Well done, workout') && !p.gym_join);

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">No user specified.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-slate-800/60 to-transparent backdrop-blur-sm border-b border-slate-700/50 px-4 py-2.5">
        <div className="max-w-2xl mx-auto relative flex items-center justify-center">
          <button
            onClick={() => window.history.back()}
            className="absolute left-0 w-8 h-8 flex items-center justify-center text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-slate-100">Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Profile Card */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-blue-500/30">
                {profileUser?.avatar_url ? (
                  <img src={profileUser.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {displayName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">{displayName || 'Loading...'}</h2>
                {profileUser?.gym_location && (
                  <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{profileUser.gym_location}</span>
                  </div>
                )}
                {primaryMembership && (
                  <div className="flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3 text-blue-400" />
                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px]">
                      {primaryMembership.gym_name}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Friend Button */}
            {currentUser && !isOwnProfile && (
              <div className="flex-shrink-0">
                {isFriend ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFriendMutation.mutate()}
                    disabled={removeFriendMutation.isPending}
                    className="border-slate-600 text-slate-300 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300 text-xs"
                  >
                    <UserMinus className="w-3 h-3 mr-1" />
                    Friends
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => addFriendMutation.mutate()}
                    disabled={addFriendMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Add Friend
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-xl font-bold text-white">{streak}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Streak</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-white">{checkIns.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Check-ins</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-xl font-bold text-white">{longestStreak}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Best</div>
            </div>
          </div>
        </Card>

        {/* Posts */}
        {visiblePosts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide px-1">Posts</h3>
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

        {visiblePosts.length === 0 && profileUser && (
          <Card className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm">No posts yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}