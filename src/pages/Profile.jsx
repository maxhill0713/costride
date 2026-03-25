import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Settings, Dumbbell, MapPin, X, Plus, Building2, Camera, Image as ImageIcon, Video, Star, Send, Users } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import BadgesModal from '../components/profile/BadgesModal';
import StatusBadge from '../components/profile/StatusBadge';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import ProfilePictureModal from '../components/profile/ProfilePictureModal';
import PostCard from '../components/feed/PostCard';

// ─────────────────────────────────────────────────────────────────────────────
// Caption sanitisation
// Strips control characters and zero-width/invisible characters that can be
// used for obfuscation or injection tricks. Character limit enforced here too.
// ─────────────────────────────────────────────────────────────────────────────
const sanitiseCaption = (v) =>
  v
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // control characters
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')   // zero-width / soft hyphen
    .slice(0, 200);

// ─────────────────────────────────────────────────────────────────────────────
// File validation — MIME whitelist + magic byte checks
//
// file.type is trivially spoofable, so we also read the first 12 bytes of the
// actual file and compare against known file signatures. This stops someone
// renaming a .exe to .jpg and uploading it.
//
// NOTE: This is a client-side friction layer. Real virus scanning must happen
// server-side. This catches casual/accidental bad actors and provides a good
// UX error message before a wasted upload attempt.
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

// Each entry maps a MIME type to either a static byte prefix or a custom check
// function that receives the first 12 bytes as a Uint8Array.
const MAGIC_BYTE_RULES = [
  { mime: 'image/jpeg',      bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',       bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif',       bytes: [0x47, 0x49, 0x46] },
  {
    mime: 'image/webp',
    // RIFF????WEBP — bytes 8-11 are "WEBP"
    check: (arr) => arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50,
  },
  {
    mime: 'video/mp4',
    // ftyp box at offset 4
    check: (arr) => arr[4] === 0x66 && arr[5] === 0x74 && arr[6] === 0x79 && arr[7] === 0x70,
  },
  {
    mime: 'video/quicktime',
    check: (arr) => arr[4] === 0x66 && arr[5] === 0x74 && arr[6] === 0x79 && arr[7] === 0x70,
  },
  { mime: 'video/webm', bytes: [0x1A, 0x45, 0xDF, 0xA3] },
];

const matchesMagicBytes = (arr, rule) => {
  if (rule.check) return rule.check(arr);
  return rule.bytes.every((b, i) => arr[i] === b);
};

const validateFile = (file) =>
  new Promise((resolve, reject) => {
    // 1. MIME type must be in whitelist
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return reject(new Error('File type not allowed. Please upload an image or video.'));
    }

    // 2. Size limit — 50 MB for video, 10 MB for images
    const isVideo = file.type.startsWith('video/');
    const maxBytes = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return reject(new Error(`File too large. Max size is ${isVideo ? '50 MB' : '10 MB'}.`));
    }

    // 3. Magic bytes — read first 12 bytes only (fast, no full file read)
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target.result);
      const rule = MAGIC_BYTE_RULES.find((r) => r.mime === file.type);
      if (!rule || !matchesMagicBytes(arr, rule)) {
        return reject(new Error('File content does not match its declared type.'));
      }
      resolve(true);
    };
    reader.onerror = () => reject(new Error('Could not read file. Please try again.'));
    reader.readAsArrayBuffer(file.slice(0, 12));
  });

// ─────────────────────────────────────────────────────────────────────────────

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
  const [shareWithCommunity, setShareWithCommunity] = useState(false);
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
      return base44.entities.Gym.filter({ id: { $in: memberGymIds } });
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentUser'] }); setShowEditHero(false); }
  });

  const updateAvatarMutation = useMutation({
    mutationFn: (avatar_url) => base44.auth.updateMe({ avatar_url }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentUser'] }); setShowEditAvatar(false); }
  });

  const closeCreatePost = () => {
    setShowCreatePost(false);
    setPostContent('');
    setPostImage('');
    setPostVideo('');
    setShareWithCommunity(false);
  };

  // ── File upload with client-side validation ────────────────────────────────
  const handleFileUpload = async (file, type) => {
    // Validate before touching the network
    try {
      await validateFile(file);
    } catch (err) {
      // toast is imported below — use it here if available, otherwise alert
      alert(err.message || 'Invalid file');
      return;
    }

    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'image') setPostImage(file_url);
      else setPostVideo(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createPost', {
      content: data.content,
      image_url: data.image_url || null,
      video_url: data.video_url || null,
      share_with_community: data.share_with_community || false,
    }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['userPosts', currentUser?.id] });
      const previous = queryClient.getQueryData(['userPosts', currentUser?.id]);
      queryClient.setQueryData(['userPosts', currentUser?.id], (old = []) => [
        {
          id: `temp-${Date.now()}`,
          member_id: currentUser?.id,
          member_name: currentUser?.full_name,
          member_avatar: currentUser?.avatar_url,
          content: data.content,
          image_url: data.image_url || null,
          video_url: data.video_url || null,
          likes: 0,
          comments: [],
          created_date: new Date().toISOString()
        },
        ...old
      ]);
      closeCreatePost();
      return { previous };
    },
    onError: (err, data, context) => { queryClient.setQueryData(['userPosts', currentUser?.id], context.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['userPosts'] }); }
  });

  if (!currentUser) return null;

  const displayName = currentUser?.display_name || currentUser?.username || currentUser?.full_name;
  const primaryGymId = currentUser?.primary_gym_id;
  const primaryGym = memberGymsData.find((g) => g.id === primaryGymId);
  const currentStreak = currentUser?.current_streak || 0;
  const filteredPosts = userPosts.filter((post) =>
    (post.image_url || post.video_url) &&
    !post.content?.includes('Well done, workout') &&
    post.gym_join !== true &&
    !post.is_hidden
  );
  const friendCount = friends.length;

  const badgeDefs = [
    { id: '10_visits', icon: '🎯', color: 'from-blue-400 to-blue-600' },
    { id: '50_visits', icon: '🔥', color: 'from-orange-400 to-red-500' },
    { id: '100_visits', icon: '🏆', color: 'from-yellow-400 to-orange-500' },
    { id: '7_day_streak', icon: '⚡', color: 'from-green-400 to-emerald-500' },
    { id: '30_day_streak', icon: '🔥', color: 'from-red-400 to-pink-500' },
    { id: '90_day_streak', icon: '👑', color: 'from-purple-400 to-pink-500' },
    { id: '1_year', icon: '📅', color: 'from-indigo-400 to-blue-500' },
    { id: 'community_leader', icon: '👥', color: 'from-cyan-400 to-blue-500' },
  ];

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
                {currentUser.avatar_url
                  ? <img src={currentUser.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  : <span className="text-xl font-black text-white">{displayName?.charAt(0)?.toUpperCase()}</span>}
              </div>
            </div>
          </button>

          <div className="flex flex-col gap-1 justify-center flex-1">
            {currentUser.username && (
              <p className="text-[12px] text-slate-400 font-semibold">@{currentUser.username}</p>
            )}
            <div className="flex justify-around items-center">
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
        </div>

        {/* Status + location + gym */}
        <div className="space-y-1">
          <StatusBadge checkIns={checkIns} streak={currentStreak} size="sm" />
          {currentUser.gym_location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="text-[11px] text-slate-400">{currentUser.gym_location}</span>
            </div>
          )}
          {primaryGym && (
            <Link to={createPageUrl('GymCommunity') + `?id=${primaryGym.id}`}>
              <div className="flex items-center gap-1.5 w-fit">
                <Building2 className="w-3 h-3 text-blue-400 flex-shrink-0" />
                <span className="text-[11px] text-blue-400 font-semibold">{primaryGym.name}</span>
              </div>
            </Link>
          )}
        </div>

        {/* Badges */}
        <button onClick={() => setShowBadgesModal(true)} className="flex items-center gap-1.5 active:scale-95 transition-transform">
          {currentUser?.equipped_badges?.length > 0 ? (
            <>
              {currentUser.equipped_badges.map((badgeId) => {
                const badge = badgeDefs.find((b) => b.id === badgeId);
                if (!badge) return null;
                return (
                  <div key={badgeId} className={`w-7 h-7 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center shadow ring-1 ring-black/30`}>
                    <span className="text-xs">{badge.icon}</span>
                  </div>
                );
              })}
              <span className="text-[10px] text-slate-600 ml-0.5">tap to edit</span>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg border border-dashed border-slate-600 flex items-center justify-center">
                <span className="text-slate-600 text-xs">+</span>
              </div>
              <span className="text-[10px] text-slate-600">tap to earn badges</span>
            </div>
          )}
        </button>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-slate-900/80 border border-slate-500/50 text-slate-400 font-bold rounded-full px-4 py-2 flex items-center gap-1.5 justify-center shadow-[0_5px_0_0_#172033,0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu flex-1">
            <Plus className="w-3.5 h-3.5" />New Post
          </button>
          <button
            onClick={() => setShowSplitModal(true)}
            className="bg-slate-900/80 border border-slate-500/50 text-slate-400 font-bold rounded-full px-4 py-2 flex items-center gap-1.5 justify-center shadow-[0_5px_0_0_#172033,0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu flex-1">
            <Dumbbell className="w-3.5 h-3.5" />
            {currentUser?.workout_split ? 'Edit Split' : 'Create Split'}
          </button>
        </div>
      </div>

      {/* ── POSTS GRID ── */}
      <div className="max-w-4xl mx-auto pb-32">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-slate-700/60 flex items-center justify-center mb-3">
              <Camera className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm font-black text-white mb-1">Share Photos</p>
            <p className="text-xs text-slate-500 mb-4">When you share photos, they'll appear here.</p>
            <button onClick={() => setShowCreatePost(true)} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
              Share your first photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-px">
            {filteredPosts
              .sort((a, b) => a.is_favourite === b.is_favourite ? 0 : a.is_favourite ? -1 : 1)
              .map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-square bg-slate-900 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedGridPost(post)}>
                  {post.video_url
                    ? <video src={post.video_url} className="w-full h-full object-cover" />
                    : <img src={post.image_url} alt="" className="w-full h-full object-cover" />}
                  {post.is_favourite && (
                    <div className="absolute top-1.5 right-1.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 drop-shadow" />
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <EditHeroImageModal open={showEditHero} onClose={() => setShowEditHero(false)} currentImageUrl={currentUser?.hero_image_url} onSave={(url) => updateHeroMutation.mutate(url)} isLoading={updateHeroMutation.isPending} />
      <EditHeroImageModal open={showEditAvatar} onClose={() => setShowEditAvatar(false)} currentImageUrl={currentUser?.avatar_url} onSave={(url) => updateAvatarMutation.mutate(url)} isLoading={updateAvatarMutation.isPending} />
      <CreateSplitModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} currentUser={currentUser} openToEdit={!!currentUser?.workout_split} />
      <BadgesModal isOpen={showBadgesModal} onClose={() => setShowBadgesModal(false)} user={currentUser} checkIns={checkIns} />
      <ProfilePictureModal isOpen={showProfilePicture} onClose={() => setShowProfilePicture(false)} imageUrl={currentUser?.avatar_url} userName={displayName} />

      {/* Grid lightbox */}
      {selectedGridPost && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedGridPost(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
            <PostCard
              post={selectedGridPost}
              fullWidth={false}
              onLike={() => {}} onComment={() => {}} onSave={() => {}}
              onDelete={() => { queryClient.invalidateQueries({ queryKey: ['userPosts'] }); setSelectedGridPost(null); }} />
          </div>
        </div>
      )}

      {/* ── CREATE POST BOTTOM SHEET ── */}
      {showCreatePost && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center px-5"
          onClick={closeCreatePost}>
          <div
            className="w-full max-w-sm flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}>

            {/* ── POST CARD ── */}
            <div
              className="w-full overflow-hidden shadow-2xl shadow-black/40 rounded-3xl relative"
              style={{
                background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}>

              {/* Top shine */}
              <div
                className="absolute inset-x-0 top-0 h-px pointer-events-none z-10"
                style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />

              <div className="px-4 pt-5 pb-5 space-y-3">

                {/* Caption
                    font-size is 16px to prevent iOS Safari auto-zooming on focus.
                    Any font-size below 16px triggers the zoom behaviour. */}
                <div className="relative">
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(sanitiseCaption(e.target.value))}
                    placeholder="Add a caption… (optional)"
                    rows={2}
                    maxLength={200}
                    style={{ fontSize: '16px' }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                  <span className={`absolute bottom-2 right-3 text-[10px] font-medium ${postContent.length >= 180 ? 'text-orange-400' : 'text-slate-600'}`}>
                    {postContent.length}/200
                  </span>
                </div>

                {/* Media area */}
                <div className="rounded-2xl overflow-hidden" style={{ height: 220 }}>
                  {uploading && (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.14)', borderRadius: 16 }}>
                      <span className="text-slate-400 text-sm font-medium animate-pulse">Uploading…</span>
                    </div>
                  )}
                  {!uploading && !postImage && !postVideo && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.14)', borderRadius: 16 }}>
                      <div className="flex gap-3">
                        <label className="cursor-pointer flex flex-col items-center gap-1.5">
                          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} className="hidden" />
                          <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center active:scale-90 transition-transform">
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">Photo</span>
                        </label>
                        <label className="cursor-pointer flex flex-col items-center gap-1.5">
                          <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')} className="hidden" />
                          <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center active:scale-90 transition-transform">
                            <Video className="w-5 h-5 text-slate-400" />
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">Video</span>
                        </label>
                        <label className="cursor-pointer flex flex-col items-center gap-1.5">
                          {/* Camera capture — images only, explicit MIME whitelist */}
                          <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} className="hidden" />
                          <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center active:scale-90 transition-transform">
                            <Camera className="w-5 h-5 text-slate-400" />
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">Camera</span>
                        </label>
                      </div>
                      <span className="text-[11px] text-slate-600 font-medium">Add a photo or video (optional)</span>
                    </div>
                  )}
                  {!uploading && postImage && (
                    <div className="relative w-full h-full">
                      <img src={postImage} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                      <button onClick={() => setPostImage('')} className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  )}
                  {!uploading && postVideo && (
                    <div className="relative w-full h-full">
                      <video src={postVideo} controls className="w-full h-full object-cover rounded-2xl bg-black" />
                      <button onClick={() => setPostVideo('')} className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Share with community toggle */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-[11px] text-slate-400 font-medium">Share with community</span>
                  </div>
                  <button
                    onClick={() => setShareWithCommunity(!shareWithCommunity)}
                    style={{ width: 40, height: 22, position: 'relative', borderRadius: 11, background: shareWithCommunity ? '#3b82f6' : 'rgba(100,116,139,0.4)', transition: 'background 0.2s ease', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    <div style={{
                      position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%',
                      background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      left: shareWithCommunity ? 20 : 2,
                      transition: 'left 0.2s ease',
                    }} />
                  </button>
                </div>

              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => createPostMutation.mutate({ content: postContent, image_url: postImage, video_url: postVideo, share_with_community: shareWithCommunity })}
                disabled={(!postImage && !postVideo && !postContent.trim()) || createPostMutation.isPending}
                className={`w-full font-black text-base rounded-2xl border border-transparent flex items-center justify-center transition-all duration-100 ${
                  (postImage || postVideo || postContent.trim()) && !createPostMutation.isPending
                    ? 'bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 text-white shadow-[0_4px_0_0_#1a3fa8,0_8px_20px_rgba(59,130,246,0.4)] active:shadow-none active:translate-y-[4px] active:scale-95'
                    : 'bg-slate-800/60 text-slate-600 cursor-not-allowed'
                }`}
                style={{ height: 52 }}>
                {createPostMutation.isPending ? 'Posting…' : 'Share Post'}
              </button>
              <button
                onClick={closeCreatePost}
                className="w-full font-semibold text-slate-400 hover:text-white text-base rounded-2xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center"
                style={{ height: 48 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}