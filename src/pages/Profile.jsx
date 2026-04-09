import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Settings, Dumbbell, MapPin, X, Plus, Building2, Camera, Image as ImageIcon, Video, Star, Users } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import BadgesModal from '../components/profile/BadgesModal';
import StatusBadge from '../components/profile/StatusBadge';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import ProfilePictureModal from '../components/profile/ProfilePictureModal';
import PostCard from '../components/feed/PostCard';
import { motion, AnimatePresence } from 'framer-motion';
import FriendsSection from '../components/home/FriendsSection';

// ─────────────────────────────────────────────────────────────────────────────
// Caption sanitisation
// ─────────────────────────────────────────────────────────────────────────────
const sanitiseCaption = (v) =>
  v
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
    .slice(0, 200);

// ─────────────────────────────────────────────────────────────────────────────
// File validation
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
const MAGIC_BYTE_RULES = [
  { mime: 'image/jpeg',     bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',      bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif',      bytes: [0x47, 0x49, 0x46] },
  { mime: 'image/webp',     check: (arr) => arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50 },
  { mime: 'video/mp4',      check: (arr) => arr[4] === 0x66 && arr[5] === 0x74 && arr[6] === 0x79 && arr[7] === 0x70 },
  { mime: 'video/quicktime',check: (arr) => arr[4] === 0x66 && arr[5] === 0x74 && arr[6] === 0x79 && arr[7] === 0x70 },
  { mime: 'video/webm',     bytes: [0x1A, 0x45, 0xDF, 0xA3] },
];
const matchesMagicBytes = (arr, rule) => {
  if (rule.check) return rule.check(arr);
  return rule.bytes.every((b, i) => arr[i] === b);
};
const validateFile = (file) =>
  new Promise((resolve, reject) => {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return reject(new Error('File type not allowed. Please upload an image or video.'));
    }
    const isVideo = file.type.startsWith('video/');
    const maxBytes = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return reject(new Error(`File too large. Max size is ${isVideo ? '50 MB' : '10 MB'}.`));
    }
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
// Bottom-sheet animation variants — slides up from the bottom edge
// Overlay fades independently, identical pattern to CreateSplitModal
// ─────────────────────────────────────────────────────────────────────────────
const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

const sheetVariants = {
  hidden: {
    y: '100%',
    opacity: 1,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 36,
      mass: 1,
    },
  },
  exit: {
    y: '100%',
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 40,
      mass: 0.9,
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────

export default function Profile() {
  const urlParams = new URLSearchParams(window.location.search);
  const [showSplitModal, setShowSplitModal] = useState(urlParams.get('editSplit') === 'true');
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
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [confirmRemoveFriend, setConfirmRemoveFriend] = useState(null);
  const [friendMenuOpen, setFriendMenuOpen] = useState(null);
  const [pendingMenuOpen, setPendingMenuOpen] = useState(null);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendsListSearchQuery, setFriendsListSearchQuery] = useState('');

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', currentUser?.id],
    queryFn: () => base44.entities.Post.filter({ member_id: currentUser?.id }, '-created_date', 50),
    enabled: !!currentUser?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser?.id }, '-check_in_date', 200),
    enabled: !!currentUser?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const memberGymIds = useMemo(() => gymMemberships.map((m) => m.gym_id), [gymMemberships]);
  const { data: memberGymsData = [] } = useQuery({
    queryKey: ['memberGyms', currentUser?.id],
    queryFn: async () => {
      if (memberGymIds.length === 0) return [];
      return base44.entities.Gym.filter({ id: { $in: memberGymIds } });
    },
    enabled: !!currentUser && gymMemberships.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const { data: friends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const { data: friendRequests = [] } = useQuery({
    queryKey: ['friendRequests', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ friend_id: currentUser?.id, status: 'pending' }, '-created_date', 50),
    enabled: !!currentUser?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const { data: sentFriendRequests = [] } = useQuery({
    queryKey: ['sentFriendRequests', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser?.id, status: 'pending' }, '-created_date', 50),
    enabled: !!currentUser?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const knownUserIds = useMemo(
    () => [...friends.map(f => f.friend_id), ...friendRequests.map(r => r.user_id), ...sentFriendRequests.map(r => r.friend_id)],
    [friends, friendRequests, sentFriendRequests]
  );
  const { data: friendUsersList = [] } = useQuery({
    queryKey: ['friendUsers', knownUserIds.join(',')],
    queryFn: () => base44.entities.User.filter({ id: { $in: knownUserIds } }),
    enabled: knownUserIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });
  const { data: allRecentCheckIns = [] } = useQuery({
    queryKey: ['checkIns', 'friendFeed', friends.map(f => f.friend_id).join(',')],
    queryFn: () => {
      const ids = friends.map(f => f.friend_id);
      if (ids.length === 0) return [];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      return base44.entities.CheckIn.filter({ user_id: { $in: ids }, check_in_date: { $gte: thirtyDaysAgo } }, '-check_in_date', 200);
    },
    enabled: !!currentUser?.id && friends.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const { data: searchResults = [] } = useQuery({
    queryKey: ['searchUsers', friendSearchQuery],
    queryFn: () => base44.functions.invoke('searchUsers', { query: friendSearchQuery.trim(), searchBy: 'username', limit: 5 }).then(res => res.data.users || []),
    enabled: friendSearchQuery.trim().length >= 2,
    staleTime: 30000,
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentUser'] }); setShowEditHero(false); },
  });
  const updateAvatarMutation = useMutation({
    mutationFn: (avatar_url) => base44.auth.updateMe({ avatar_url }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentUser'] }); setShowEditAvatar(false); },
  });

  const addFriendMutation = useMutation({
    mutationFn: (friendUser) => base44.functions.invoke('manageFriendship', { friendId: friendUser.id, action: 'add' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['friends'] }); queryClient.invalidateQueries({ queryKey: ['sentFriendRequests'] }); setFriendSearchQuery(''); },
  });
  const acceptFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', { friendId, action: 'accept' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['friendRequests', currentUser?.id] }); queryClient.invalidateQueries({ queryKey: ['friends', currentUser?.id] }); },
  });
  const rejectFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', { friendId, action: 'reject' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friendRequests', currentUser?.id] }),
  });
  const removeFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', { friendId, action: 'remove' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends', currentUser?.id] }),
  });
  const cancelFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', { friendId, action: 'remove' }),
    onMutate: (friendId) => { queryClient.setQueryData(['sentFriendRequests', currentUser?.id], (old = []) => old.filter(r => r.friend_id !== friendId)); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['sentFriendRequests', currentUser?.id] }); },
  });

  const closeCreatePost = () => {
    setShowCreatePost(false);
    setPostContent('');
    setPostImage('');
    setPostVideo('');
    setShareWithCommunity(false);
  };

  const handleFileUpload = async (file, type) => {
    try {
      await validateFile(file);
    } catch (err) {
      alert(err.message || 'Invalid file');
      return;
    }
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'image') setPostImage(file_url);
      else setPostVideo(file_url);
    } catch {
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
          created_date: new Date().toISOString(),
        },
        ...old,
      ]);
      closeCreatePost();
      return { previous };
    },
    onError: (err, data, context) => { queryClient.setQueryData(['userPosts', currentUser?.id], context.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['userPosts', currentUser?.id] }); },
  });

  if (!currentUser) {
    return (
<div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)' }} />
      {/* ── TOP BAR ── */}        <div className="max-w-4xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="w-28 h-4 rounded bg-slate-700/60 animate-pulse" />
          <div className="w-6 h-6 rounded bg-slate-700/60 animate-pulse" />
        </div>
        <div className="max-w-4xl mx-auto px-4 space-y-4 pb-4">
          <div className="flex items-center gap-5">
            <div className="w-[99px] h-[99px] rounded-full bg-slate-700/60 animate-pulse flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="w-24 h-3 rounded bg-slate-700/60 animate-pulse" />
              <div className="flex justify-around items-center mt-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-5 rounded bg-slate-700/60 animate-pulse" />
                    <div className="w-10 h-2.5 rounded bg-slate-700/60 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-32 h-5 rounded-full bg-slate-700/60 animate-pulse" />
            <div className="w-24 h-3 rounded bg-slate-700/60 animate-pulse" />
          </div>
          <div className="pt-2 grid grid-cols-3 gap-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-sm bg-slate-700/60 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayName = currentUser?.display_name || currentUser?.username || currentUser?.full_name;
  const primaryGymId = currentUser?.primary_gym_id;
  const primaryGym = memberGymsData.find((g) => g.id === primaryGymId);
  const currentStreak = currentUser?.current_streak || 0;
  const filteredPosts = useMemo(() => userPosts.filter((post) =>
    (post.image_url || post.video_url) &&
    !post.content?.includes('Well done, workout') &&
    post.gym_join !== true &&
    !post.is_hidden
  ), [userPosts]);
  const friendCount = friends.length;


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
        <div className="flex items-center gap-5">
          <button onClick={() => setShowProfilePicture(true)} className="flex-shrink-0 active:scale-95 transition-transform">
            <div className="w-[99px] h-[99px] rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
              {currentUser.avatar_url
                ? <img src={currentUser.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                : <span className="text-xl font-black text-white">{displayName?.charAt(0)?.toUpperCase()}</span>}
            </div>
          </button>
          <div className="flex flex-col gap-1 justify-center flex-1 -mt-2">
            {currentUser.username && (
              <p className="text-[12px] text-slate-400 font-semibold mb-3">@{currentUser.username}</p>
            )}
            <div className="flex justify-around items-center">
              <div className="text-center">
                <p className="text-[18px] font-black text-white leading-none">{filteredPosts.length}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">Posts</p>
              </div>
              <button onClick={() => setShowFriendsModal(true)} className="text-center active:scale-95 transition-transform">
                <p className="text-[18px] font-black text-white leading-none">{friendCount}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">Friends</p>
              </button>
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
          {(() => {
            const unlockedVariants = currentUser?.unlocked_streak_variants || [];
            const validEquipped = (currentUser?.equipped_badges || []).filter(id => unlockedVariants.includes(id));
            return validEquipped.length > 0 ? (
              <>
                {validEquipped.map((badgeId) => (
                  <div key={badgeId} className="w-7 h-7 rounded-lg flex items-center justify-center shadow ring-1 ring-black/30 overflow-hidden">
                    <img 
                      src={badgeId === 'spartan' ? 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/04f579c72_spartanbadge.png' : 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/9bf9eb25d_beachbadge.png'}
                      alt={badgeId}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <span className="text-[10px] text-slate-600 ml-0.5">tap to edit</span>
              </>
            ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg border border-dashed border-slate-600 flex items-center justify-center"></div>
              <span className="text-[10px] text-slate-600">tap to edit</span>
            </div>
            );
          })()}
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
                    : <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />}
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
      <CreateSplitModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} currentUser={currentUser} openToActiveSplit={urlParams.get('editSplit') === 'true'} />
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

      <FriendsSection
        showFriendsModal={showFriendsModal}
        setShowFriendsModal={setShowFriendsModal}
        showAddFriendModal={showAddFriendModal}
        setShowAddFriendModal={setShowAddFriendModal}
        confirmRemoveFriend={confirmRemoveFriend}
        setConfirmRemoveFriend={setConfirmRemoveFriend}
        friendMenuOpen={friendMenuOpen}
        setFriendMenuOpen={setFriendMenuOpen}
        pendingMenuOpen={pendingMenuOpen}
        setPendingMenuOpen={setPendingMenuOpen}
        friendSearchQuery={friendSearchQuery}
        setFriendSearchQuery={setFriendSearchQuery}
        friendsListSearchQuery={friendsListSearchQuery}
        setFriendsListSearchQuery={setFriendsListSearchQuery}
        sentFriendRequests={sentFriendRequests}
        friendUsersList={friendUsersList}
        friendRequests={friendRequests}
        friends={friends}
        friendsWithActivity={friends.map(f => {
          const fCheckIns = allRecentCheckIns.filter(c => c.user_id === f.friend_id);
          return { ...f, activity: { checkIns: fCheckIns, streak: 0, lastCheckIn: fCheckIns[0] || null, daysSinceCheckIn: null, totalCheckIns: fCheckIns.length } };
        })}
        filteredSearchResults={searchResults.filter(u => !friends.map(f => f.friend_id).includes(u.id))}
        acceptFriendMutation={acceptFriendMutation}
        rejectFriendMutation={rejectFriendMutation}
        removeFriendMutation={removeFriendMutation}
        cancelFriendMutation={cancelFriendMutation}
        addFriendMutation={addFriendMutation}
      />

      {/* ── CREATE POST BOTTOM SHEET — animated ── */}
      <AnimatePresence>
        {showCreatePost && (
          <>
            {/* Dim overlay: fades independently */}
            <motion.div
              key="create-post-overlay"
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeCreatePost}
            />

            {/* Sheet: springs up from the bottom */}
            <motion.div
              key="create-post-sheet"
              className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-5 pb-28 pt-4"
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
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
                  <div
                    className="absolute inset-x-0 top-0 h-px pointer-events-none z-10"
                    style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />

                  <div className="px-4 pt-5 pb-5 space-y-3">
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}