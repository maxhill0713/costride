import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, MapPin, Building2, Flame, Calendar, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PostCard from '../components/feed/PostCard';
import StatusBadge from '../components/profile/StatusBadge';

export default function UserProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  const [selectedPost, setSelectedPost] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  const { data: profileUser, isLoading: loadingUser, isError } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const results = await base44.entities.User.filter({ id: userId });
      return results[0] || null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['userCheckIns', userId],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: userId }, '-check_in_date', 200),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', userId],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: userId, status: 'active' }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000
  });

  const primaryGymId = profileUser?.primary_gym_id || (gymMemberships.length > 0 ? gymMemberships[0].gym_id : null);
  const primaryMembership = gymMemberships.find((m) => m.gym_id === primaryGymId) || gymMemberships[0];

  const { data: posts = [] } = useQuery({
    queryKey: ['userFavouritePosts', userId],
    queryFn: () => base44.entities.Post.filter({ member_id: userId }, '-created_date', 50),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000
  });

  const favouritePosts = posts.filter((p) => p.is_favourite && (p.image_url || p.video_url));

  const displayName = profileUser?.username || profileUser?.full_name || 'User';
  const streak = profileUser?.current_streak || 0;
  const longestStreak = profileUser?.longest_streak || 0;

  // Badge definitions
  const badgeDefs = [
  { id: '10_visits', icon: '🎯', color: 'from-blue-400 to-blue-600' },
  { id: '50_visits', icon: '🔥', color: 'from-orange-400 to-red-500' },
  { id: '100_visits', icon: '🏆', color: 'from-yellow-400 to-orange-500' },
  { id: '7_day_streak', icon: '⚡', color: 'from-green-400 to-emerald-500' },
  { id: '30_day_streak', icon: '🔥', color: 'from-red-400 to-pink-500' },
  { id: '90_day_streak', icon: '👑', color: 'from-purple-400 to-pink-500' },
  { id: '1_year', icon: '📅', color: 'from-indigo-400 to-blue-500' },
  { id: 'community_leader', icon: '👥', color: 'from-cyan-400 to-blue-500' },
  { id: '7_days', icon: '🔥', color: 'from-orange-400 to-red-500', days: 7 },
  { id: '30_days', icon: '⚡', color: 'from-yellow-400 to-orange-500', days: 30 },
  { id: '50_days', icon: '💪', color: 'from-purple-400 to-pink-500', days: 50 },
  { id: '100_days', icon: '👑', color: 'from-blue-400 to-cyan-500', days: 100 },
  { id: '365_days', icon: '🏆', color: 'from-green-400 to-emerald-500', days: 365 }];


  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <p className="text-white">No user specified.</p>
      </div>);

  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>);

  }

  if (isError || !profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center gap-4">
        <p className="text-white text-lg">User not found.</p>
        <Link to={createPageUrl('Friends')} className="text-blue-400 underline text-sm">Go back</Link>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-slate-800/60 to-transparent backdrop-blur-sm border-b border-slate-700/50 px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to={createPageUrl('Friends')}>
            <button className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-base font-semibold text-slate-100 truncate">{displayName}</h1>
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative pt-6 pb-4 px-4 overflow-hidden bg-gradient-to-b from-slate-800/40 to-transparent border-b border-slate-700/50">
        {profileUser.hero_image_url &&
        <>
            <div className="absolute inset-0 z-0">
              <img src={profileUser.hero_image_url} alt="" className="w-full h-full object-cover opacity-40" />
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-800/50 via-slate-900/60 to-slate-900" />
          </>
        }

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-start gap-5 mb-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-slate-700/50 flex-shrink-0">
              {profileUser.avatar_url ?
              <img src={profileUser.avatar_url} alt={displayName} className="w-full h-full object-cover" /> :

              <span className="text-3xl font-semibold text-white">{displayName?.charAt(0)?.toUpperCase()}</span>
              }
            </div>

            {/* Name & Badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">{displayName}</h2>
                <StatusBadge checkIns={checkIns} streak={streak} size="sm" />
              </div>

              {/* Equipped badges */}
              {profileUser.equipped_badges?.length > 0 &&
              <div className="flex items-center gap-2 mt-2">
                  {profileUser.equipped_badges.map((badgeId) => {
                  const badge = badgeDefs.find((b) => b.id === badgeId || `${b.days}_day_streak` === badgeId);
                  if (!badge) return null;
                  return (
                    <div
                      key={badgeId}
                      className={`w-8 h-8 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg ring-2 ring-slate-600/40`}>

                        <span className="text-sm">{badge.icon}</span>
                      </div>);

                })}
                </div>
              }
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-white">{streak}</span>
              <span className="text-xs text-slate-400">streak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">{checkIns.length}</span>
              <span className="text-xs text-slate-400">check-ins</span>
            </div>
            {longestStreak > 0 &&
            <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Best:</span>
                <span className="text-sm font-semibold text-orange-300">{longestStreak}d</span>
              </div>
            }
          </div>

          {/* Location & Gym */}
          <div className="mt-3 space-y-1.5">
            {profileUser.gym_location &&
            <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                
              </div>
            }
            {primaryMembership &&
            <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">
                  {primaryMembership.gym_name}
                </Badge>
              </div>
            }
          </div>
        </div>
      </div>

      {/* Favourite Posts */}
      <div className="max-w-2xl mx-auto px-4 py-4 pb-32">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          Favourite Posts
        </h3>

        {favouritePosts.length === 0 ?
        <Card className="bg-slate-800/40 border border-slate-600/40 p-10 text-center rounded-2xl">
            <Star className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No favourite posts yet.</p>
          </Card> :

        <>
            {/* Grid view */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {favouritePosts.map((post) =>
            <div
              key={post.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700/50 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedPost(post)}>

                  {post.video_url ?
              <video src={post.video_url} className="w-full h-full object-cover" /> :

              <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
              }
                  <div className="absolute top-1.5 right-1.5">
                    
                  </div>
                </div>
            )}
            </div>
          </>
        }
      </div>

      {/* Post Modal */}
      {selectedPost &&
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto"
        onClick={() => setSelectedPost(null)}>

          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg">
            <PostCard
            post={selectedPost}
            fullWidth={false}
            currentUser={currentUser}
            onLike={() => {}}
            onComment={() => {}}
            onSave={() => {}}
            onDelete={() => setSelectedPost(null)} />

          </div>
        </div>
      }
    </div>);

}