import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Send, MoreHorizontal, Trash2, Star, Plus, Clock, Dumbbell, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const STREAK_ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';
import { format } from 'date-fns';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// ── Exercise row — matches View Summary modal style ──────────────────────────
function ExerciseRow({ ex, idx }) {
  const exName = ex.name || ex.exercise || ex.title || `Exercise ${idx + 1}`;
  const sets = ex.sets || ex.setsReps?.split('x')?.[0] || '-';
  const reps = ex.reps || ex.setsReps?.split('x')?.[1] || '-';
  const weight = ex.weight ?? ex.weight_kg ?? '-';

  return (
    <div className="bg-white/5 pt-2 pb-2 pl-2 rounded-xl border border-white/10 grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 items-center">
      <div className="text-sm font-bold text-white leading-tight ml-1 truncate">{exName}</div>
      <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center ml-1" style={{ width: 36 }}>
        {sets}
      </div>
      <div className="text-slate-400 text-xs font-bold flex items-center justify-center">×</div>
      <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: 36 }}>
        {reps}
      </div>
      <div className="ml-3 pr-3">
        <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white pb-1 pl-1 pt-1 text-sm font-black text-center rounded-2xl shadow-md shadow-blue-900/20 min-w-[55px]">
          {weight}<span className="text-[10px] font-bold">kg</span>
        </div>
      </div>
    </div>
  );
}

export default function PostCard({ post, onLike, onComment, onSave, onDelete, fullWidth = false, isOwnProfile = false, currentUser: currentUserProp }) {
  const [reacted, setReacted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFavouriteConfirm, setShowFavouriteConfirm] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [exercisesExpanded, setExercisesExpanded] = useState(false);
  const queryClient = useQueryClient();
  const contentRef = React.useRef(null);
  const PREVIEW_COUNT = 3;

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    initialData: currentUserProp,
    enabled: !currentUserProp,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', currentUser?.id],
    queryFn: () => base44.entities.Post.filter({ member_id: currentUser.id }, '-created_date', 20),
    enabled: !!currentUser && isOwnProfile,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const reactedUserIds = useMemo(() => Object.keys(post.reactions || {}), [post.reactions]);
  const { data: reactedUsers = [] } = useQuery({
    queryKey: ['reactedUsers', reactedUserIds.join(',')],
    queryFn: async () => {
      if (reactedUserIds.length === 0) return [];
      return Promise.all(reactedUserIds.map((id) => base44.entities.User.filter({ id }).then((r) => r[0]))).then((r) => r.filter(Boolean));
    },
    enabled: showReactionsModal && reactedUserIds.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Post.delete(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted');
      if (onDelete) onDelete(post.id);
    },
    onError: () => toast.error('Failed to delete post')
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (data.is_favourite && !post.is_favourite) {
        const favouriteCount = userPosts.filter((p) => p.is_favourite).length;
        if (favouriteCount >= 3) throw new Error('You can only have 3 favourite posts');
      }
      return base44.entities.Post.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      toast.success(post.is_favourite ? 'Removed from favourites' : 'Added to favourites');
    },
    onError: (error) => {
      toast.error(error.message === 'You can only have 3 favourite posts'
        ? 'You can only have 3 favourite posts'
        : 'Failed to update post');
    }
  });

  const isOwner = currentUser?.id === post.member_id;
  const isNudgePost = post.exercise === 'workout_completion_nudge';
  const isGymJoinPost = post.gym_join === true;
  const isWorkoutPost = !!post.workout_name;
  const hasMedia = !!(post.video_url || post.image_url);

  const userStreakVariant = useMemo(() => currentUser?.streak_variant || 'default', [currentUser?.streak_variant]);
  const hasReacted = useMemo(() => post.reactions && post.reactions[currentUser?.id], [post.reactions, currentUser?.id]);

  const reactMutation = useMutation({
    mutationFn: async (isReacting) => {
      const updatedReactions = { ...post.reactions };
      if (isReacting) updatedReactions[currentUser.id] = userStreakVariant;
      else delete updatedReactions[currentUser.id];
      await base44.entities.Post.update(post.id, { reactions: updatedReactions });
    },
    onMutate: async (isReacting) => {
      const updatePost = (old = []) => old.map((p) => {
        if (p.id !== post.id) return p;
        const updatedReactions = { ...p.reactions };
        if (isReacting) updatedReactions[currentUser.id] = userStreakVariant;
        else delete updatedReactions[currentUser.id];
        return { ...p, reactions: updatedReactions };
      });
      const queries = [['posts'], ['friendPosts', currentUser?.id], ['userPosts', currentUser?.id]];
      if (post.gym_id) queries.push(['posts', post.gym_id]);
      const snapshots = queries.map((key) => ({ key, data: queryClient.getQueryData(key) }));
      queries.forEach((key) => queryClient.setQueryData(key, updatePost));
      return { snapshots };
    },
    onError: (err, isReacting, context) => {
      context?.snapshots?.forEach(({ key, data }) => queryClient.setQueryData(key, data));
      toast.error('Failed to react to post');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (post.gym_id) queryClient.invalidateQueries({ queryKey: ['posts', post.gym_id] });
    }
  });

  const nudgeMutation = useMutation({
    mutationFn: async () => {
      const friends = await base44.entities.Friend.filter({ user_id: currentUser.id, status: 'accepted' });
      const todayDate = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      for (const friend of friends) {
        const friendUser = await base44.entities.User.filter({ id: friend.friend_id });
        if (!friendUser.length) continue;
        const friendData = friendUser[0];
        const trainingDays = friendData.training_days || [];
        const isRestDay = !trainingDays.includes(adjustedDay);
        const hasNoExercises = !friendData.custom_workout_types?.[adjustedDay]?.exercises?.length;
        if (isRestDay || hasNoExercises) continue;
        const friendWorkouts = await base44.entities.WorkoutLog.filter({ user_id: friend.friend_id, completed_date: todayDate });
        if (friendWorkouts.length === 0) {
          await base44.entities.Post.create({
            member_id: friend.friend_id,
            member_name: friendData.full_name || friendData.username || 'User',
            member_avatar: friendData.avatar_url || '',
            content: `${currentUser.full_name || currentUser.username || 'User'} wants you to stop being lazy and get in the gym!`,
            likes: 0, comments: [], reactions: {}
          });
        }
      }
    },
    onSuccess: () => { toast.success('Friends nudged!'); queryClient.invalidateQueries(['posts']); },
    onError: () => toast.error('Failed to nudge friends')
  });

  useEffect(() => {
    if (contentRef.current && showFullContent) setContentHeight(contentRef.current.offsetHeight);
  }, [showFullContent]);

  // ── Gym join post ────────────────────────────────────────────────────────
  if (isGymJoinPost) {
    return (
      <Link to={createPageUrl('UserProfile') + `?id=${post.member_id}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/15 to-cyan-500/10 backdrop-blur-xl border border-blue-500/30 rounded-lg p-2.5 hover:border-blue-400/50 transition-all cursor-pointer h-16 flex items-center gap-2.5 shadow-lg shadow-black/20 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
            {post.member_avatar
              ? <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" />
              : <span className="text-xs font-bold text-white">{post.member_name?.charAt(0)?.toUpperCase()}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-xs truncate">{post.member_name}</p>
            <p className="text-[11px] text-blue-300 truncate">{post.content}</p>
          </div>
        </motion.div>
      </Link>
    );
  }

  // ── WORKOUT POST — Strava-style with swipeable photo/summary ───────────────
  if (isWorkoutPost) {
    const exercises = post.workout_exercises || [];
    const userComment = post.content?.trim() || null;
    const totalReactions = Object.keys(post.reactions || {}).length;
    const hasPhoto = !!post.image_url;
    const PANEL_HEIGHT = 'min(72vw, 320px)';

    // Swipe state — only relevant when there's a photo
    const touchStartX = React.useRef(null);
    const [slide, setSlide] = React.useState(0); // 0 = photo, 1 = summary

    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
      if (touchStartX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (dx < -40) setSlide(1);
      else if (dx > 40) setSlide(0);
      touchStartX.current = null;
    };

    // Reusable streak icon button
    const StreakBtn = () => (
      currentUser && !isOwnProfile ? (
        <motion.button
          onClick={() => reactMutation.mutate(!hasReacted)}
          disabled={reactMutation.isPending}
          className="flex items-center gap-1 flex-shrink-0"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}>
          {userStreakVariant === 'sunglasses'
            ? <div className="relative w-11 h-11 flex items-center justify-center">
                <img src={STREAK_ICON_URL} alt="streak" className={`w-11 h-11 ${hasReacted ? '' : 'opacity-40'}`} style={{ objectFit: 'contain' }} />
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64">
                  <circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                  <circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                  <line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" />
                </svg>
              </div>
            : <img src={STREAK_ICON_URL} alt="streak" className={`w-11 h-11 ${hasReacted ? '' : 'opacity-40'}`} style={{ objectFit: 'contain' }} />}
        </motion.button>
      ) : null
    );

    // Reaction count cluster
    const ReactionCount = () => totalReactions > 0 ? (
      <button onClick={() => setShowReactionsModal(true)} className="flex items-center hover:opacity-80 transition-opacity">
        <div className="flex items-center" style={{ gap: 0 }}>
          {Object.entries(post.reactions || {}).slice(0, 3).map(([userId, variant], i) =>
            <div key={userId} className="relative w-6 h-6" style={{ marginLeft: i === 0 ? 0 : '-6px', zIndex: 3 - i }}>
              {variant === 'sunglasses'
                ? <div className="relative w-full h-full flex items-center justify-center">
                    <img src={STREAK_ICON_URL} alt="streak" className="w-6 h-6" style={{ objectFit: 'contain' }} />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64">
                      <circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                      <circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                      <line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" />
                    </svg>
                  </div>
                : <img src={STREAK_ICON_URL} alt="streak" className="w-20 h-20 -mt-6" style={{ objectFit: 'contain' }} />}
            </div>
          )}
          {totalReactions > 3 && <div className="flex items-center gap-0.5 ml-1"><Plus className="w-3 h-3 text-slate-300" /><span className="text-xs font-bold text-slate-300">{totalReactions - 3}</span></div>}
        </div>
      </button>
    ) : null;

    // Exercise summary panel content
    const ExerciseSummaryPanel = ({ scrollable = false }) => (
      <div
        className={`w-full h-full flex flex-col ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}
        style={{ background: 'linear-gradient(160deg, rgba(10,16,35,0.98) 0%, rgba(8,12,26,0.99) 100%)' }}>
        <div className="px-3 pt-3 pb-2 flex-1 min-h-0 flex flex-col">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 mb-1.5 items-end px-2 -mx-2 flex-shrink-0">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-7">Sets</div>
            <div />
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-9">Reps</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2.5">Weight</div>
          </div>
          <div className="space-y-2 -mx-2 flex-1 min-h-0 overflow-y-auto">
            {(exercisesExpanded ? exercises : exercises.slice(0, PREVIEW_COUNT)).map((ex, idx) => (
              <ExerciseRow key={idx} ex={ex} idx={idx} />
            ))}
          </div>
          {exercises.length > PREVIEW_COUNT && (
            <button
              onClick={() => setExercisesExpanded(v => !v)}
              className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
              {exercisesExpanded
                ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                : <><ChevronDown className="w-3.5 h-3.5" /> +{exercises.length - PREVIEW_COUNT} more</>}
            </button>
          )}
        </div>
      </div>
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 overflow-hidden shadow-2xl shadow-black/20 rounded-xl -mx-2"
        style={{
          background: 'linear-gradient(160deg, rgba(15,23,42,0.97) 0%, rgba(10,15,30,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>

        {/* ── TOP BAR ── */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(20,30,55,0.95) 0%, rgba(14,20,40,0.92) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
          className="px-4 pt-3.5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <Link to={createPageUrl('UserProfile') + `?id=${post.member_id}`} className="flex items-center gap-2.5">
              <div className="flex-shrink-0 rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)' }}>
                <div className="w-9 h-9 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center">
                  {post.member_avatar
                    ? <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" />
                    : <span className="text-sm font-bold text-white">{post.member_name?.charAt(0)?.toUpperCase() || '?'}</span>}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{post.member_name}</p>
                <p className="text-[11px] text-slate-500 font-medium">{format(new Date(post.created_date), 'MMM d · h:mm a')}</p>
              </div>
            </Link>
            {isOwner && (
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="text-slate-600 hover:text-slate-300 p-1 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 bg-slate-800/80 border border-slate-700/40 rounded-lg shadow-lg z-20 backdrop-blur-sm">
                      <button onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:bg-red-500/20 text-sm font-medium">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <p className="text-lg font-black text-white tracking-tight leading-tight mb-2.5" style={{ letterSpacing: '-0.02em' }}>
            {post.workout_name}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {post.workout_duration && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Clock className="w-3 h-3 text-blue-400" /><span className="text-[11px] font-bold text-blue-300">{post.workout_duration}</span>
              </div>
            )}
            {exercises.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.2)' }}>
                <Dumbbell className="w-3 h-3 text-orange-400" /><span className="text-[11px] font-bold text-orange-300">{exercises.length} exercises</span>
              </div>
            )}
            {post.workout_volume && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(250,204,21,0.10)', border: '1px solid rgba(250,204,21,0.18)' }}>
                <Zap className="w-3 h-3 text-yellow-400" /><span className="text-[11px] font-bold text-yellow-300">{post.workout_volume}</span>
              </div>
            )}
          </div>
          {userComment && <p className="mt-2.5 text-sm text-slate-300 leading-relaxed italic">"{userComment}"</p>}
        </div>

        {/* ── SWIPEABLE PANEL: photo ↔ summary (only when photo exists) ── */}
        {hasPhoto ? (
          <div
            className="relative overflow-hidden"
            style={{ height: PANEL_HEIGHT }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}>

            {/* Sliding track — two panels side by side */}
            <div
              className="flex h-full"
              style={{
                width: '200%',
                transform: `translateX(${slide === 0 ? '0%' : '-50%'})`,
                transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
              }}>

              {/* Panel 0 — Photo */}
              <div className="relative flex-shrink-0" style={{ width: '50%', height: '100%' }}>
                <img
                  src={post.image_url}
                  alt="workout"
                  style={{
                    position: 'absolute', left: 0, right: 0,
                    width: '100%', height: '143%', top: '-21.5%',
                    objectFit: 'cover', objectPosition: 'center center',
                  }}
                />
                <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: 32, background: 'linear-gradient(to bottom, rgba(14,20,40,0.55), transparent)' }} />
                <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: 32, background: 'linear-gradient(to top, rgba(10,15,30,0.6), transparent)' }} />
                {/* Swipe hint arrow */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-60">
                  <ChevronDown className="w-4 h-4 text-white -rotate-90" />
                </div>
              </div>

              {/* Panel 1 — Exercise summary */}
              <div className="flex-shrink-0 overflow-hidden" style={{ width: '50%', height: '100%' }}>
                <ExerciseSummaryPanel />
              </div>
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              <div className={`rounded-full transition-all duration-300 ${slide === 0 ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
              <div className={`rounded-full transition-all duration-300 ${slide === 1 ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
            </div>
          </div>
        ) : (
          /* No photo — show exercise summary directly */
          exercises.length > 0 && (
            <div style={{ background: 'linear-gradient(160deg, rgba(10,16,35,0.98) 0%, rgba(8,12,26,0.99) 100%)' }}
              className="px-3 pt-3 pb-2">
              <div className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 mb-1.5 items-end px-2 -mx-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-7">Sets</div>
                <div />
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-9">Reps</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2.5">Weight</div>
              </div>
              <div className="space-y-2 -mx-2">
                {(exercisesExpanded ? exercises : exercises.slice(0, PREVIEW_COUNT)).map((ex, idx) => (
                  <ExerciseRow key={idx} ex={ex} idx={idx} />
                ))}
              </div>
              {exercises.length > PREVIEW_COUNT && (
                <button
                  onClick={() => setExercisesExpanded(v => !v)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors">
                  {exercisesExpanded
                    ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                    : <><ChevronDown className="w-3.5 h-3.5" /> +{exercises.length - PREVIEW_COUNT} more exercises</>}
                </button>
              )}
            </div>
          )
        )}

        {/* ── BOTTOM BAR — reaction button + reaction count ── */}
        <div
          className="flex items-center justify-between px-3 py-1"
          style={{
            background: 'linear-gradient(180deg, rgba(14,20,40,0.95) 0%, rgba(10,15,28,0.98) 100%)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            minHeight: 44,
          }}>
          <StreakBtn />
          <ReactionCount />
        </div>

        {/* Delete confirmation */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Post?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300">This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-center">
              <AlertDialogCancel className="bg-slate-800/60 border border-slate-600/40 text-slate-200 hover:bg-slate-700/60">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { deleteMutation.mutate(); setShowDeleteConfirm(false); }}
                disabled={deleteMutation.isPending}
                className="bg-red-600/80 hover:bg-red-700/80 border border-red-500/30 text-white disabled:opacity-50">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    );
  }

  // ── STANDARD POST (completely unchanged) ────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 overflow-hidden overflow-x-hidden relative shadow-2xl shadow-black/20 mb-4 ${
        hasMedia ? '' : 'min-h-[120px]'
      } ${
        fullWidth ? 'w-screen ml-[-50vw] left-[50%] rounded-none' : 'rounded-xl'
      }`}>

      {/* Header */}
      <Link to={createPageUrl('UserProfile') + `?id=${post.member_id}`} className="absolute top-3 left-3 z-50 cursor-pointer flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
          {post.member_avatar
            ? <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" />
            : <span className="text-sm font-bold text-white">{post.member_name?.charAt(0)?.toUpperCase()}</span>}
        </div>
        <span className="text-sm font-semibold text-white">{post.member_name}</span>
      </Link>

      {/* Delete Menu */}
      {isOwner &&
        <div className="absolute top-3 right-3 z-20">
          <div className="relative flex items-center gap-2">
            {post.is_favourite && <Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
            <button onClick={() => setShowMenu(!showMenu)} className="text-slate-300 hover:text-white">
              <MoreHorizontal className="w-6 h-6" />
            </button>
            {showMenu &&
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 bg-slate-800/80 border border-slate-700/40 rounded-lg shadow-lg z-20 backdrop-blur-sm">
                  <button
                    onClick={() => { setShowFavouriteConfirm(true); setShowMenu(false); }}
                    disabled={updatePostMutation.isPending}
                    className="flex items-center gap-2 w-full px-4 py-2 text-amber-400 hover:bg-amber-500/20 text-sm font-medium disabled:opacity-50">
                    <Star className={`w-4 h-4 ${post.is_favourite ? 'fill-amber-400' : ''}`} />
                    {post.is_favourite ? 'Unfavourite' : 'Favourite'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:bg-red-500/20 text-sm font-medium disabled:opacity-50">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </>
            }
          </div>
        </div>
      }

      {/* Media */}
      {hasMedia &&
        <div className="relative w-screen aspect-square bg-slate-800 ml-[-50vw] left-[50%] isolate" onClick={() => showFullContent && setShowFullContent(false)}>
          {post.video_url
            ? <video src={post.video_url} className="w-full h-full object-cover" controls playsInline preload="metadata" />
            : <img src={post.image_url} alt="Post" className="w-full h-full object-cover cursor-pointer" />}
        </div>
      }

      {/* Caption */}
      <div className={`${hasMedia ? 'absolute left-0 right-0 bottom-0' : 'relative mt-14'} px-4 z-10 transition-all duration-300 ${showFullContent ? 'py-4' : 'py-2.5'}`}>
        <div ref={contentRef} className="flex-1" style={showFullContent ? { maxWidth: '360px' } : {}}>
          <p className={`leading-relaxed text-slate-200 ${showFullContent ? 'text-sm whitespace-normal break-words' : 'text-sm leading-snug'}`}>
            {post.content && post.content.length > 30 && !showFullContent
              ? <>{post.content.substring(0, 30)}...{' '}<button onClick={() => setShowFullContent(true)} className="text-blue-400 hover:text-blue-300 font-semibold">more</button></>
              : post.content}
          </p>
          {post.weight && <span className="block mt-1 text-blue-400 font-semibold">💪 {post.weight} lbs</span>}
        </div>

        {/* Reactions display */}
        {Object.keys(post.reactions || {}).length > 0 && (() => {
          const reactionEntries = Object.entries(post.reactions || {});
          const visibleReactions = reactionEntries.slice(0, 3);
          const overflow = reactionEntries.length - visibleReactions.length;
          return (
            <button onClick={() => setShowReactionsModal(true)} className="absolute bottom-3 right-4 flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
              <div className="flex items-center" style={{ gap: 0 }}>
                {visibleReactions.map(([userId, variant], i) =>
                  <div key={userId} className="relative w-6 h-6" style={{ marginLeft: i === 0 ? 0 : '-6px', zIndex: visibleReactions.length - i }}>
                    {variant === 'sunglasses'
                      ? <div className="relative w-full h-full flex items-center justify-center">
                          <img src={STREAK_ICON_URL} alt="streak" className="w-6 h-6" style={{ objectFit: 'contain' }} />
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64">
                            <circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                            <circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                            <line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" />
                          </svg>
                        </div>
                      : <img src={STREAK_ICON_URL} alt="streak" className="w-20 h-20 -mt-6" style={{ objectFit: 'contain' }} />}
                  </div>
                )}
                {overflow > 0 && <div className="flex items-center gap-0.5 ml-1" style={{ zIndex: 0 }}><Plus className="w-3 h-3 text-slate-300" /><span className="text-xs font-bold text-slate-300">{overflow}</span></div>}
              </div>
            </button>
          );
        })()}

        {isNudgePost && isOwner &&
          <button onClick={() => nudgeMutation.mutate()} disabled={nudgeMutation.isPending} className="mt-2 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
            {nudgeMutation.isPending ? 'Nudging...' : 'Nudge'}
          </button>
        }

        {/* Reaction button */}
        {!isOwnProfile &&
          <motion.button
            onClick={() => reactMutation.mutate(!hasReacted)}
            disabled={reactMutation.isPending}
            style={showFullContent ? { bottom: `${contentHeight + 16}px` } : { bottom: '2.1rem' }}
            className="absolute left-4 transition-all flex items-center gap-1"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}>
            {userStreakVariant === 'sunglasses'
              ? <div className="relative w-12 h-12 flex items-center justify-center">
                  <img src={STREAK_ICON_URL} alt="streak" className={`w-12 h-12 ${hasReacted ? '' : 'opacity-40'}`} style={{ objectFit: 'contain' }} />
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64">
                    <circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                    <circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                    <line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" />
                  </svg>
                </div>
              : <img src={STREAK_ICON_URL} alt="streak" className={`w-12 h-12 ${hasReacted ? '' : 'opacity-40'}`} style={{ objectFit: 'contain' }} />}
          </motion.button>
        }
      </div>

      {/* Modals */}
      <CommentModal open={showComments} onClose={() => setShowComments(false)} post={post} onAddComment={(commentText) => onComment(post.id, commentText)} />
      <ShareModal open={showShare} onClose={() => setShowShare(false)} post={post} />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Post?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">Are you sure you want to delete your post? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-center">
            <AlertDialogCancel className="bg-slate-800/60 border border-slate-600/40 text-slate-200 hover:bg-slate-700/60">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteMutation.mutate(); setShowDeleteConfirm(false); }} disabled={deleteMutation.isPending} className="bg-red-600/80 hover:bg-red-700/80 border border-red-500/30 text-white disabled:opacity-50">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showFavouriteConfirm} onOpenChange={setShowFavouriteConfirm}>
        <AlertDialogContent className="bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{post.is_favourite ? 'Remove from Favourites?' : 'Add to Favourites?'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              {post.is_favourite ? 'This post will no longer appear as your favourite on your profile.' : 'This post will appear as your favourite on your profile for others to see.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-center">
            <AlertDialogCancel className="bg-slate-800/60 border border-slate-600/40 text-slate-200 hover:bg-slate-700/60">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { updatePostMutation.mutate({ id: post.id, data: { is_favourite: !post.is_favourite } }); setShowFavouriteConfirm(false); }} disabled={updatePostMutation.isPending} className="bg-amber-600/80 hover:bg-amber-700/80 border border-amber-500/30 text-white disabled:opacity-50">
              {updatePostMutation.isPending ? 'Loading...' : post.is_favourite ? 'Remove' : 'Add to Favourites'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showReactionsModal} onOpenChange={setShowReactionsModal}>
        <DialogContent className="max-w-lg fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 p-20 duration-200 sm:rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/20">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold leading-none tracking-tight text-white -mt-16">Reactions</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto max-h-80">
            {reactedUsers.map((user) => {
              const variant = post.reactions[user.id];
              return (
                <div key={user.id} className="flex items-center gap-10 p-4 rounded-lg hover:bg-slate-800/50 transition-colors -mt-3">
                  <div className="relative w-6 h-6 flex-shrink-0 flex items-center justify-center">
                    {variant === 'sunglasses'
                      ? <div className="relative w-full h-full flex items-center justify-center">
                          <img src={STREAK_ICON_URL} alt="streak" className="w-6 h-6" style={{ objectFit: 'contain' }} />
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64">
                            <circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                            <circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                            <line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" />
                          </svg>
                        </div>
                      : <img src={STREAK_ICON_URL} alt="streak" className="w-20 h-20" style={{ objectFit: 'contain' }} />}
                  </div>
                  <span className="text-sm text-slate-200 font-large">{user.full_name || user.username || 'Unknown'}</span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}