import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Settings, Dumbbell, MapPin, X, Plus, Building2, Camera, Image as ImageIcon, Video, Star, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import BadgesModal from '../components/profile/BadgesModal';
import StatusBadge from '../components/profile/StatusBadge';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import ProfilePictureModal from '../components/profile/ProfilePictureModal';
import PostCard from '../components/feed/PostCard';

export default function Profile() {
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showEditHero, setShowEditHero] = useState(false);
  const [showEditAvatar, setShowEditAvatar] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postVideo, setPostVideo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedGridPost, setSelectedGridPost] = useState(null);
  const [allowGymRepost, setAllowGymRepost] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', currentUser?.id],
    queryFn: () => base44.entities.Post.filter({ member_id: currentUser.id }, '-created_date', 50),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date', 200),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const memberGymIds = gymMemberships.map((m) => m.gym_id);

  const { data: memberGymsData = [] } = useQuery({
    queryKey: ['memberGyms', currentUser?.id],
    queryFn: async () => {
      if (memberGymIds.length === 0) return [];
      const results = await Promise.all(
        memberGymIds.map((id) => base44.entities.Gym.filter({ id }).then((r) => r[0]).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: !!currentUser && gymMemberships.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser.id, status: 'accepted' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  useEffect(() => {
    if (currentUser?.dark_mode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [currentUser?.dark_mode]);

  const updateHeroMutation = useMutation({
    mutationFn: (hero_image_url) => base44.auth.updateMe({ hero_image_url }),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['currentUser'] });setShowEditHero(false);}
  });

  const updateAvatarMutation = useMutation({
    mutationFn: (avatar_url) => base44.auth.updateMe({ avatar_url }),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['currentUser'] });setShowEditAvatar(false);}
  });

  const closeCreatePost = () => {
    setShowCreatePost(false);
    setPostContent('');
    setPostImage('');
    setPostVideo('');
    setAllowGymRepost(false);
  };

  const handleFileUpload = async (file, type) => {
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'image') setPostImage(file_url);else
      setPostVideo(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createPost', {
      content: data.content,
      image_url: data.image_url || null,
      video_url: data.video_url || null,
      allow_gym_repost: data.allow_gym_repost || false
    }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['userPosts', currentUser?.id] });
      const previous = queryClient.getQueryData(['userPosts', currentUser?.id]);
      queryClient.setQueryData(['userPosts', currentUser?.id], (old = []) => [
      { id: `temp-${Date.now()}`, member_id: currentUser?.id, member_name: currentUser?.full_name, member_avatar: currentUser?.avatar_url, content: data.content, image_url: data.image_url || null, video_url: data.video_url || null, likes: 0, comments: [], created_date: new Date().toISOString() },
      ...old]
      );
      closeCreatePost();
      return { previous };
    },
    onError: (err, data, context) => {queryClient.setQueryData(['userPosts', currentUser?.id], context.previous);},
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['userPosts'] });}
  });

  if (!currentUser) return null;

  const displayName = currentUser?.username || currentUser?.full_name;
  const primaryGymId = currentUser?.primary_gym_id;
  const primaryGym = memberGymsData.find((g) => g.id === primaryGymId);
  const currentStreak = currentUser?.current_streak || 0;
  const filteredPosts = userPosts.filter((post) => (post.image_url || post.video_url) && !post.content?.includes("Well done, workout") && post.gym_join !== true && !post.is_hidden);
  const friendCount = friends.length;
  const canPost = !!(postContent.trim() || postImage || postVideo);

  const badgeDefs = [
  { id: '10_visits', icon: '🎯', color: 'from-blue-400 to-blue-600' },
  { id: '50_visits', icon: '🔥', color: 'from-orange-400 to-red-500' },
  { id: '100_visits', icon: '🏆', color: 'from-yellow-400 to-orange-500' },
  { id: '7_day_streak', icon: '⚡', color: 'from-green-400 to-emerald-500' },
  { id: '30_day_streak', icon: '🔥', color: 'from-red-400 to-pink-500' },
  { id: '90_day_streak', icon: '👑', color: 'from-purple-400 to-pink-500' },
  { id: '1_year', icon: '📅', color: 'from-indigo-400 to-blue-500' },
  { id: 'community_leader', icon: '👥', color: 'from-cyan-400 to-blue-500' }];


  const actionBtn = "bg-slate-800/70 border border-slate-600/50 text-slate-200 font-bold rounded-full px-4 py-2 flex items-center gap-1.5 justify-center shadow-[0_3px_0_0_#0f172a,inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu flex-1";

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">

      {/* ── TOP BAR ── */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-[17px] font-black text-white tracking-tight">{displayName}</h1>
        <Link to={createPageUrl('Settings')} className="active:scale-90 transition-transform">
          <Settings className="w-[22px] h-[22px] text-slate-400 hover:text-slate-200 transition-colors" />
        </Link>
      </div>

      {/* ── HERO ── */}
      <div className="max-w-4xl mx-auto px-4 space-y-3 pb-4">

        {/* Avatar + stats */}
        <div className="flex items-center gap-5">
          <button onClick={() => setShowProfilePicture(true)} className="flex-shrink-0 active:scale-95 transition-transform">
            <div className="w-[99px] h-[99px] rounded-full p-[2.5px] bg-gradient-to-tr from-blue-500 via-cyan-400 to-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.3)]">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
                {currentUser.avatar_url ?
                <img src={currentUser.avatar_url} alt={displayName} className="w-full h-full object-cover" /> :
                <span className="text-xl font-black text-white">{displayName?.charAt(0)?.toUpperCase()}</span>
                }
              </div>
            </div>
          </button>

          <div className="flex flex-1 justify-around items-center">
            <div className="text-center">
              <p className="text-[18px] font-black text-white leading-none">{filteredPosts.length}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-[18px] font-black text-white leading-none">{friendCount}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">Friends</p>
            </div>
            <div className="text-center">
              <p className="text-[18px] font-black text-white leading-none">{currentStreak}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">Streak</p>
            </div>
          </div>
        </div>

        {/* Status + location + gym */}
        <div className="space-y-1">
          <StatusBadge checkIns={checkIns} streak={currentStreak} size="sm" />
          {currentUser.gym_location &&
          <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="text-[11px] text-slate-400">{currentUser.gym_location}</span>
            </div>
          }
          {primaryGym &&
          <Link to={createPageUrl('GymCommunity') + `?id=${primaryGym.id}`}>
              <div className="flex items-center gap-1.5 w-fit">
                <Building2 className="w-3 h-3 text-blue-400 flex-shrink-0" />
                <span className="text-[11px] text-blue-400 font-semibold">{primaryGym.name}</span>
              </div>
            </Link>
          }
        </div>

        {/* Badges */}
        {currentUser?.equipped_badges?.length > 0 &&
        <button onClick={() => setShowBadgesModal(true)} className="flex items-center gap-1.5 active:scale-95 transition-transform">
            {currentUser.equipped_badges.map((badgeId) => {
            const badge = badgeDefs.find((b) => b.id === badgeId);
            if (!badge) return null;
            return (
              <div key={badgeId} className={`w-7 h-7 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center shadow ring-1 ring-black/30`}>
                  <span className="text-xs">{badge.icon}</span>
                </div>);

          })}
            <span className="text-[10px] text-slate-600 ml-0.5">tap to edit</span>
          </button>
        }

        {/* Action buttons */}
        <div className="flex gap-2">
          <button onClick={() => setShowCreatePost(true)} className="bg-slate-900/80 border border-slate-500/50 text-slate-400 font-bold rounded-full px-4 py-2 flex items-center gap-1.5 justify-center shadow-[0_5px_0_0_#172033,0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu flex-1">
            <Plus className="w-3.5 h-3.5" />New Post
          </button>
          <button onClick={() => setShowSplitModal(true)} className="bg-slate-900/80 border border-slate-500/50 text-slate-400 font-bold rounded-full px-4 py-2 flex items-center gap-1.5 justify-center shadow-[0_5px_0_0_#172033,0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu flex-1">
            <Dumbbell className="w-3.5 h-3.5" />
            {currentUser?.workout_split ? 'Edit Split' : 'Create Split'}
          </button>

        </div>
      </div>

      {/* ── POSTS (grid, directly below action buttons) ── */}
      <div className="max-w-4xl mx-auto pb-32">
        {filteredPosts.length === 0 ?
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-slate-700/60 flex items-center justify-center mb-3">
              <Camera className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm font-black text-white mb-1">Share Photos</p>
            <p className="text-xs text-slate-500 mb-4">When you share photos, they'll appear here.</p>
            <button onClick={() => setShowCreatePost(true)} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
              Share your first photo
            </button>
          </div> :

        <div className="grid grid-cols-3 gap-px">
            {filteredPosts.
          sort((a, b) => a.is_favourite === b.is_favourite ? 0 : a.is_favourite ? -1 : 1).
          map((post) =>
          <div
            key={post.id}
            className="relative aspect-square bg-slate-900 cursor-pointer overflow-hidden"
            onClick={() => setSelectedGridPost(post)}>

                  {post.video_url ?
            <video src={post.video_url} className="w-full h-full object-cover" /> :
            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
            }
                  {post.is_favourite &&
            <div className="absolute top-1.5 right-1.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 drop-shadow" />
                    </div>
            }
                </div>
          )}
          </div>
        }
      </div>

      {/* ── MODALS ── */}
      <EditHeroImageModal open={showEditHero} onClose={() => setShowEditHero(false)} currentImageUrl={currentUser?.hero_image_url} onSave={(url) => updateHeroMutation.mutate(url)} isLoading={updateHeroMutation.isPending} />
      <EditHeroImageModal open={showEditAvatar} onClose={() => setShowEditAvatar(false)} currentImageUrl={currentUser?.avatar_url} onSave={(url) => updateAvatarMutation.mutate(url)} isLoading={updateAvatarMutation.isPending} />
      <CreateSplitModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} currentUser={currentUser} openToEdit={!!currentUser?.workout_split} />
      <BadgesModal isOpen={showBadgesModal} onClose={() => setShowBadgesModal(false)} user={currentUser} checkIns={checkIns} />
      <ProfilePictureModal isOpen={showProfilePicture} onClose={() => setShowProfilePicture(false)} imageUrl={currentUser?.avatar_url} userName={displayName} />

      {/* Grid lightbox */}
      {selectedGridPost &&
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedGridPost(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
            <PostCard post={selectedGridPost} fullWidth={false} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => {queryClient.invalidateQueries({ queryKey: ['userPosts'] });setSelectedGridPost(null);}} />
          </div>
        </div>
      }

      {/* ── CREATE POST BOTTOM SHEET ── */}
      {showCreatePost &&
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center"
        onClick={closeCreatePost}>

          <div
          className="w-full max-w-2xl bg-[#0d1220] border-t border-slate-700/50 rounded-t-3xl"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
          onClick={(e) => e.stopPropagation()}>

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 rounded-full bg-slate-700/80" />
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[15px] font-black text-white">New Post</span>
              <button onClick={closeCreatePost} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 active:scale-90 transition-transform">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Composer */}
            <div className="px-5 pb-2">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex-shrink-0 flex items-center justify-center">
                  {currentUser.avatar_url ?
                <img src={currentUser.avatar_url} className="w-full h-full object-cover" alt="" /> :
                <span className="text-sm font-black text-white">{displayName?.charAt(0)}</span>
                }
                </div>
                <div className="flex-1 min-h-[90px]">
                  <Textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's your workout win today?"
                  className="bg-transparent border-none text-white placeholder:text-slate-600 p-0 focus-visible:ring-0 resize-none text-[16px] leading-relaxed w-full min-h-[90px]"
                  autoFocus />

                </div>
              </div>

              {/* Media preview */}
              {(postImage || postVideo || uploading) &&
            <div className="mt-3 ml-[52px]">
                  {uploading && <p className="text-xs text-slate-500 animate-pulse py-2">Uploading…</p>}
                  {postImage &&
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/50">
                      <img src={postImage} alt="Preview" className="w-full max-h-52 object-cover" />
                      <button onClick={() => setPostImage('')} className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
              }
                  {postVideo &&
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/50">
                      <video src={postVideo} controls className="w-full max-h-52 bg-black" />
                      <button onClick={() => setPostVideo('')} className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
              }
                </div>
            }
            </div>

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-5 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} className="hidden" />
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700/50 flex items-center justify-center active:scale-90 transition-transform hover:border-slate-500/80">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')} className="hidden" />
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700/50 flex items-center justify-center active:scale-90 transition-transform hover:border-slate-500/80">
                    <Video className="w-5 h-5 text-slate-400" />
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} className="hidden" />
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700/50 flex items-center justify-center active:scale-90 transition-transform hover:border-slate-500/80">
                    <Camera className="w-5 h-5 text-slate-400" />
                  </div>
                </label>
                <button
                onClick={() => setAllowGymRepost(!allowGymRepost)}
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center active:scale-90 transition-all ${
                allowGymRepost ?
                'bg-blue-600/25 border-blue-500/50 text-blue-400' :
                'bg-slate-800 border-slate-700/50 text-slate-500'}`
                }
                title="Allow gym to share">

                  <Building2 className="w-5 h-5" />
                </button>
              </div>

              <button
              onClick={() => createPostMutation.mutate({ content: postContent, image_url: postImage, video_url: postVideo, allow_gym_repost: allowGymRepost })}
              disabled={!canPost || createPostMutation.isPending}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-[14px] transition-all duration-150 transform-gpu ${
              canPost && !createPostMutation.isPending ?
              'bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35)] active:shadow-none active:translate-y-[3px] active:scale-95' :
              'bg-slate-800 text-slate-600 cursor-not-allowed'}`
              }>

                {createPostMutation.isPending ?
              <span className="animate-pulse">Posting…</span> :
              <><Send className="w-4 h-4" />Post</>
              }
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}