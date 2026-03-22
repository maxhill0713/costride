import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, MapPin, Building2, Flame, Star } from 'lucide-react';
import PostCard from '../components/feed/PostCard';
import StatusBadge from '../components/profile/StatusBadge';
import ProfilePictureModal from '../components/profile/ProfilePictureModal';

export default function UserProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  const { data: profileUser, isLoading: loadingUser, isError } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      // Try direct filter first, fall back to service-role via backend function
      try {
        const results = await base44.entities.User.filter({ id: userId });
        if (results[0]) return results[0];
      } catch {}
      // Fallback: use the searchUsers function to get user data
      const res = await base44.functions.invoke('getUserById', { userId });
      return res.data?.user || null;
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

  const { data: friendsList = [] } = useQuery({
    queryKey: ['userFriends', userId],
    queryFn: () => base44.entities.Friend.filter({ user_id: userId, status: 'accepted' }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['userFavouritePosts', userId],
    queryFn: () => base44.entities.Post.filter({ member_id: userId }, '-created_date', 50),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000
  });

  const favouritePosts = posts.filter((p) => p.is_favourite && (p.image_url || p.video_url));

  const displayName = profileUser?.display_name || profileUser?.username || profileUser?.full_name || 'User';
  const streak = profileUser?.current_streak || 0;
  const longestStreak = profileUser?.longest_streak || 0;

  // Privacy: check if viewer is a friend of the profile owner
  const isOwnProfile = currentUser?.id === userId;
  const isProfilePrivate = profileUser?.public_profile === false;
  const isFriend = friendsList.some(f => f.friend_id === currentUser?.id || f.user_id === currentUser?.id);
  const isBlocked = isProfilePrivate && !isOwnProfile && !isFriend;

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
    { id: '365_days', icon: '🏆', color: 'from-green-400 to-emerald-500', days: 365 }
  ];

  if (!userId) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex items-center justify-center">
        <p className="text-white">No user specified.</p>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !profileUser) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex flex-col items-center justify-center gap-4">
        <p className="text-white text-lg">User not found.</p>
        <Link to={createPageUrl('Home')} className="text-blue-400 underline text-sm">Go back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">

      {/* ── TOP BAR ── */}
       <div className="max-w-4xl mx-auto px-4 pt-4 pb-3 flex items-center gap-3">
         <Link to={createPageUrl('Home')} className="active:scale-90 transition-transform">
           <ChevronLeft className="w-[22px] h-[22px] text-slate-400 hover:text-slate-200 transition-colors" />
         </Link>
         <h1 className="text-[17px] font-black text-white tracking-tight">{displayName}</h1>
       </div>

      {/* ── HERO ── */}
      <div className="max-w-4xl mx-auto px-4 space-y-3 pb-4">

        {/* Avatar + stats */}
        <div className="flex items-center gap-5">
          <div className="flex-shrink-0">
            <div
              className="w-[99px] h-[99px] rounded-full p-[2.5px] bg-gradient-to-tr from-blue-500 via-cyan-400 to-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.3)] cursor-pointer active:scale-95 transition-transform"
              onClick={() => profileUser.avatar_url && setShowAvatarModal(true)}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
                {profileUser.avatar_url
                  ? <img src={profileUser.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  : <span className="text-xl font-black text-white">{displayName?.charAt(0)?.toUpperCase()}</span>
                }
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 justify-center flex-1">
            {profileUser.username && (
              <p className="text-[12px] text-slate-400 font-semibold">@{profileUser.username}</p>
            )}
            <div className="flex justify-around items-center">
              <div className="text-center">
                <p className="text-[18px] font-black text-white leading-none">{favouritePosts.length}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-[18px] font-black text-white leading-none">{friendsList.length}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">Friends</p>
              </div>
              <div className="text-center">
                <p className="text-[18px] font-black text-white leading-none">{streak}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">Streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Private profile wall */}
        {isBlocked && (
          <div className="flex flex-col items-center justify-center py-12 text-center border-t border-slate-800/60 mt-2">
            <div className="w-14 h-14 rounded-full border-2 border-slate-700/60 flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-base font-black text-white mb-1">This account is private</p>
            <p className="text-sm text-slate-500">Follow this user to see their full profile.</p>
          </div>
        )}

        {/* Status + meta */}
        {!isBlocked && <div className="space-y-1">
          <StatusBadge checkIns={checkIns} streak={streak} size="sm" />
          {primaryMembership && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span className="text-[11px] text-blue-400 font-semibold">{primaryMembership.gym_name}</span>
            </div>
          )}
          {longestStreak > 0 && (
            <div className="flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-400">Best streak: <span className="text-orange-300 font-semibold">{longestStreak} days</span></span>
            </div>
          )}
        </div>}

        {/* Badges */}
        {!isBlocked && profileUser.equipped_badges?.length > 0 && (
          <div className="flex items-center gap-1.5">
            {profileUser.equipped_badges.map((badgeId) => {
              const badge = badgeDefs.find((b) => b.id === badgeId || `${b.days}_day_streak` === badgeId);
              if (!badge) return null;
              return (
                <div key={badgeId} className={`w-7 h-7 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center shadow ring-1 ring-black/30`}>
                  <span className="text-xs">{badge.icon}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── POSTS ── */}
      <div className="max-w-4xl mx-auto pb-32">
        {favouritePosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-slate-700/60 flex items-center justify-center mb-3">
              <Star className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm font-black text-white mb-1">No favourite posts yet</p>
            <p className="text-xs text-slate-500">Posts {displayName} marks as favourite will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-px">
            {favouritePosts.map((post) => (
              <div
                key={post.id}
                className="relative aspect-square bg-slate-900 cursor-pointer overflow-hidden"
                onClick={() => setSelectedPost(post)}
              >
                {post.video_url
                  ? <video src={post.video_url} className="w-full h-full object-cover" />
                  : <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                }
                <div className="absolute top-1.5 right-1.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 drop-shadow" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Avatar modal */}
      <ProfilePictureModal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} imageUrl={profileUser.avatar_url} userName={displayName} />

      {/* Post lightbox */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
            <PostCard
              post={selectedPost}
              fullWidth={false}
              currentUser={currentUser}
              onLike={() => {}}
              onComment={() => {}}
              onSave={() => {}}
              onDelete={() => setSelectedPost(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}