import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Send, MoreHorizontal, Trash2, Star, Plus, Clock, Dumbbell, Zap, ChevronDown, ChevronUp, Loader2, Flag, ChevronRight, Check } from 'lucide-react';
import { format } from 'date-fns';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STREAK_ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';

// ── Reactions Modal — standalone component rendered outside any overflow:hidden parent ──
// backdrop uses top:-100px to bleed above the safe-area/status-bar and eliminate the gap
function ReactionsModal({ open, onClose, reactions, reactedUsers }) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '-100px',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10005,
          background: 'rgba(2,6,23,0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />
      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10006] bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-lg font-semibold leading-none tracking-tight text-white">Reactions</h3>
        </div>
        <div className="overflow-y-auto max-h-80 px-3 pb-4">
          {reactedUsers.map((user) => {
            const variant = reactions[user.id];
            return (
              <div key={user.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 40, height: 40, marginLeft: -4 }}>
                  {variant === 'sunglasses'
                    ? <div className="relative w-full h-full flex items-center justify-center">
                        <img src={STREAK_ICON_URL} alt="streak" className="w-full h-full" style={{ objectFit: 'contain' }} />
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64">
                          <circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                          <circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                          <line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" />
                        </svg>
                      </div>
                    : <img src={STREAK_ICON_URL} alt="streak" className="w-full h-full" style={{ objectFit: 'contain' }} />}
                </div>
                <span className="text-sm text-slate-200 font-semibold">{user.full_name || user.username || 'Unknown'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Shared confirm dialog ────────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, title, description, confirmLabel, confirmClass, onConfirm, isPending }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[10003] bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10004] bg-slate-900/80 backdrop-blur-md border border-slate-700/30 rounded-3xl shadow-2xl shadow-black/40 text-white p-6">
        <h3 className="text-xl font-black text-white mb-2">{title}</h3>
        <p className="text-slate-300 text-sm mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-200 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border border-slate-500/40 shadow-[0_3px_0_0_#1e293b,0_6px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu disabled:opacity-50 ${confirmClass}`}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Report categories ────────────────────────────────────────────────────────
const REPORT_CATEGORIES = [
  { id: 'dislike', label: "I just don't like it", definition: "This post isn't for you — it might be annoying, uninteresting, or just not your thing. You won't see more like it." },
  { id: 'violence', label: 'Violence or abuse', definition: "Content that depicts, promotes, or glorifies physical violence, self-harm, abuse, or threatening behaviour toward people or animals." },
  { id: 'hate', label: 'Hate and harassment', definition: "Content that targets someone based on race, ethnicity, religion, gender, sexual orientation, disability, or similar characteristics, or that is intended to bully or harass an individual." },
  { id: 'sexual', label: 'Sexual content', definition: "Explicit or suggestive sexual content, nudity, or content that sexualises individuals without consent." },
  { id: 'false_info', label: 'False information', definition: "Content that spreads demonstrably false or misleading information that could deceive others or cause real-world harm." },
  { id: 'other', label: 'Other', definition: "Something else not covered above. Please submit and our team will review the post." },
];

// ── Report Modal ─────────────────────────────────────────────────────────────
function ReportModal({ open, onClose, postId }) {
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const handleClose = () => { setSelected(null); setExpanded(null); onClose(); };

  const handleSubmit = () => {
    const category = REPORT_CATEGORIES.find(c => c.id === selected);
    console.log('Report submitted:', { postId, category: category?.label });
    handleClose();
    toast.success('Report submitted. Thank you.');
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[10005] bg-slate-950/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10006] bg-slate-900/90 backdrop-blur-xl border border-slate-700/40 rounded-3xl shadow-2xl shadow-black/60 text-white overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-xl font-black text-white tracking-tight text-center">Report</h3>
          <p className="text-slate-400 text-xs mt-1 font-medium text-center">Your report is anonymous</p>
        </div>
        <div className="px-3 pb-2 space-y-1.5 max-h-[60vh] overflow-y-auto">
          {REPORT_CATEGORIES.map((cat) => {
            const isSelected = selected === cat.id;
            const isExpanded = expanded === cat.id;
            const handleRowPress = () => { setSelected(isSelected ? null : cat.id); setExpanded(isExpanded ? null : cat.id); };
            return (
              <div key={cat.id} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isSelected ? 'border-blue-500/60 bg-blue-500/10' : 'border-slate-700/40 bg-slate-800/50'}`}>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span className={`flex-1 text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>{cat.label}</span>
                  <button onClick={handleRowPress} className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all duration-150 ${isSelected ? 'bg-blue-500 border-blue-500 shadow-sm shadow-blue-500/40' : 'border-slate-600 bg-slate-700/50 hover:border-slate-400'}`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }} className="overflow-hidden">
                      <div className="px-4 pb-3 pt-0"><p className="text-xs text-slate-400 leading-relaxed">{cat.definition}</p></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-3">
          <AnimatePresence>
            {selected && (
              <motion.button key="submit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }} onClick={handleSubmit}
                className="w-full py-3 rounded-2xl font-black text-sm text-white bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 shadow-[0_3px_0_0_#1d4ed8,0_6px_20px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                Submit Report
              </motion.button>
            )}
          </AnimatePresence>
          {!selected && <button onClick={handleClose} className="w-full py-2.5 rounded-2xl font-bold text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>}
        </div>
      </div>
    </>
  );
}

// ── Exercise row ─────────────────────────────────────────────────────────────
function ExerciseRow({ ex, idx }) {
  const exName = ex.name || ex.exercise_name || ex.exercise || ex.title || ex.label || ex.movement || '';
  const displayName = exName ? exName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : `Exercise ${idx + 1}`;
  const sets = ex.sets || ex.set_count || ex.setsReps?.split('x')?.[0] || '-';
  const reps = ex.reps || ex.rep_count || ex.setsReps?.split('x')?.[1] || '-';
  const weight = ex.weight ?? ex.weight_kg ?? ex.weight_lbs ?? '-';
  return (
    <div className="bg-white/5 py-1 pl-1.5 rounded-lg border border-white/10 grid gap-0.5 items-center" style={{ gridTemplateColumns: '1fr 28px 10px 28px auto' }}>
      <div className="text-[11px] font-bold text-white leading-tight ml-0.5 truncate">{displayName}</div>
      <div className="bg-white/10 text-slate-300 text-[11px] font-semibold text-center rounded-md flex items-center justify-center ml-0.5 py-0.5" style={{ width: 28 }}>{sets}</div>
      <div className="text-slate-400 text-[10px] font-bold flex items-center justify-center">×</div>
      <div className="bg-white/10 text-slate-300 text-[11px] font-semibold text-center rounded-md flex items-center justify-center py-0.5" style={{ width: 28 }}>{reps}</div>
      <div className="ml-1.5 pr-2">
        <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white py-0.5 px-1 text-[11px] font-black text-center rounded-xl shadow-sm shadow-blue-900/20 min-w-[42px]">
          {weight}<span className="text-[9px] font-bold">kg</span>
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
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [exercisesExpanded, setExercisesExpanded] = useState(false);
  const [slide, setSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = React.useRef(null);
  const touchStartY = React.useRef(null);
  const touchCurrentX = React.useRef(null);
  const swipePanelRef = React.useRef(null);
  const queryClient = useQueryClient();
  const contentRef = React.useRef(null);

  const PREVIEW_COUNT = 8;

  useEffect(() => {
    const el = swipePanelRef.current;
    if (!el) return;
    const onMove = (e) => {
      if (touchStartX.current === null) return;
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
      const dy = Math.abs(e.touches[0].clientY - (touchStartY.current || 0));
      if (dx > dy && dx > 5) e.preventDefault();
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  });

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
    mutationFn: () => base44.entities.Post.update(post.id, { is_hidden: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['friendPosts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      if (post.gym_id) queryClient.invalidateQueries({ queryKey: ['posts', post.gym_id] });
      toast.success('Post removed');
      if (onDelete) onDelete(post.id);
    },
    onError: () => toast.error('Failed to remove post')
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
      toast.error(error.message === 'You can only have 3 favourite posts' ? 'You can only have 3 favourite posts' : 'Failed to update post');
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

  // ── Shared 3-dot menu renderer ───────────────────────────────────────────
  const renderMenu = (extraMenuItems = null) => (
    <div className="relative flex items-center gap-2">
      {!isOwner ? null : post.is_favourite && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
      <button onClick={() => setShowMenu(!showMenu)} className="text-slate-400 hover:text-slate-200 p-1 transition-colors">
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700/50 rounded-lg shadow-[0_3px_0_0_#1e293b,0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] z-20 overflow-hidden min-w-[140px]">
            {isOwner ? (
              <>
                {extraMenuItems}
                <button onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }} disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-slate-700 text-sm font-semibold transition-colors disabled:opacity-50">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            ) : (
              <button onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-orange-400 hover:text-orange-300 hover:bg-slate-700 text-sm font-semibold transition-colors">
                <Flag className="w-4 h-4" /> Report
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  // ── Gym join post ────────────────────────────────────────────────────────
  if (isGymJoinPost) {
    return (
      <Link to={createPageUrl('UserProfile') + `?id=${post.member_id}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/15 to-cyan-500/10 backdrop-blur-xl border border-blue-500/30 rounded-lg p-2.5 hover:border-blue-400/50 transition-all cursor-pointer h-16 flex items-center gap-2.5 shadow-lg shadow-black/20 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
            {post.member_avatar ? <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-white">{post.member_name?.charAt(0)?.toUpperCase()}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-xs truncate">{post.member_name}</p>
            <p className="text-[11px] text-blue-300 truncate">{post.content}</p>
          </div>
        </motion.div>
      </Link>
    );
  }

  // ── WORKOUT POST ──────────────────────────────────────────────────────────
  if (isWorkoutPost) {
    const exercises = post.workout_exercises || [];
    const hasPhoto = !!post.image_url;
    const SUMMARY_WIDTH = '92%';
    const PANEL_HEIGHT = 'min(78vw, 346px)';

    const userComment = (() => {
      if (!post.content) return null;
      const lines = post.content.split('\n');
      const kept = lines.filter(l => {
        const t = l.trim();
        if (!t) return false;
        if (t.length <= 3 && t.codePointAt(0) > 255) return false;
        if (t.includes('Just finished')) return false;
        if (/[0-9]+\s*[xX]\s*[0-9]+/.test(t)) return false;
        if (/[0-9]+(kg|lbs)/i.test(t)) return false;
        return true;
      });
      return kept.join('\n').trim() || null;
    })();

    const handleWorkoutShare = async () => {
      const text = [
        `💪 ${post.workout_name}`,
        post.workout_duration ? `⏱ ${post.workout_duration}` : null,
        exercises.length > 0 ? `🏋️ ${exercises.length} exercises` : null,
        post.workout_volume ? `⚡ ${post.workout_volume}` : null,
        userComment ? `\n"${userComment}"` : null,
        `\n— shared from my workout app`,
      ].filter(Boolean).join('\n');
      if (navigator.share) { try { await navigator.share({ title: post.workout_name || 'My Workout', text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
      try { await navigator.clipboard.writeText(text); toast.success('Workout copied to clipboard!'); } catch { toast.error('Could not share'); }
    };

    const exerciseSummaryJSX = (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="px-2 pt-2 pb-1 flex-1 min-h-0 flex flex-col">
          <div className="grid gap-0.5 mb-1 items-end px-1 flex-shrink-0" style={{ gridTemplateColumns: '1fr 28px 10px 28px auto' }}>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center" style={{ marginLeft: -20 }}>Sets</div>
            <div />
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center" style={{ marginLeft: -22 }}>Reps</div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest" style={{ paddingLeft: 6 }}>Weight</div>
          </div>
          <div className="space-y-1 flex-1 overflow-hidden">
            {(exercisesExpanded ? exercises : exercises.slice(0, PREVIEW_COUNT)).map((ex, idx) => <ExerciseRow key={idx} ex={ex} idx={idx} />)}
          </div>
          {exercises.length > PREVIEW_COUNT && (
            <button onClick={() => setExercisesExpanded(v => !v)} className="mt-1 w-full flex items-center justify-center gap-1 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
              {exercisesExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> +{exercises.length - PREVIEW_COUNT} more</>}
            </button>
          )}
        </div>
      </div>
    );

    return (
      <>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 overflow-hidden shadow-2xl shadow-black/40 rounded-2xl -mx-2 relative"
          style={{ background: 'linear-gradient(135deg, rgba(14,17,36,0.96) 0%, rgba(5,7,16,0.99) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

          <div className="absolute inset-x-0 top-0 h-px pointer-events-none z-10" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
          <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ background: 'radial-gradient(ellipse at 25% 35%, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />

          <div className="relative z-10 px-4 pt-3.5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <Link to={createPageUrl('UserProfile') + `?id=${post.member_id}`} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {post.member_avatar ? <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-white">{post.member_name?.charAt(0)?.toUpperCase() || '?'}</span>}
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{post.member_name}</p>
                  <p className="text-[11px] text-white/70 font-medium">{format(new Date(post.created_date), 'MMM d · h:mm a')}</p>
                </div>
              </Link>
              {renderMenu(
                isOwner ? (
                  <button onClick={() => { setShowFavouriteConfirm(true); setShowMenu(false); }} disabled={updatePostMutation.isPending}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-amber-400 hover:text-amber-300 hover:bg-slate-700 text-sm font-semibold transition-colors disabled:opacity-50">
                    <Star className={`w-4 h-4 ${post.is_favourite ? 'fill-amber-400' : ''}`} />
                    {post.is_favourite ? 'Unfavourite' : 'Favourite'}
                  </button>
                ) : null
              )}
            </div>
            <p className="text-lg font-black text-white tracking-tight leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>{post.workout_name}</p>
            <div className="flex items-center">
              <div className="flex flex-col items-center flex-1">
                <span className="text-sm font-black text-white leading-tight">{exercises.length > 0 ? exercises.length : '—'}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Exercises</span>
              </div>
              <div className="w-px self-stretch bg-white/10" />
              <div className="flex flex-col items-center flex-1">
                <span className="text-sm font-black text-white leading-tight">{post.workout_duration || '—'}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Duration</span>
              </div>
              <div className="w-px self-stretch bg-white/10" />
              <div className="flex flex-col items-center flex-1">
                <span className="text-sm font-black text-white leading-tight">{post.workout_volume || '—'}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Volume</span>
              </div>
            </div>
            {userComment && <p className="mt-2.5 text-sm text-slate-300 leading-relaxed">{userComment}</p>}
          </div>

          {hasPhoto ? (
            <div ref={swipePanelRef} className="relative overflow-hidden" style={{ height: PANEL_HEIGHT }}
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; touchCurrentX.current = e.touches[0].clientX; setIsDragging(false); setDragOffset(0); }}
              onTouchMove={(e) => { if (touchStartX.current === null) return; const dx = e.touches[0].clientX - touchStartX.current; const dy = Math.abs(e.touches[0].clientY - (touchStartY.current || 0)); if (Math.abs(dx) > dy) { setIsDragging(true); touchCurrentX.current = e.touches[0].clientX; const rawOffset = dx; const maxDrag = slide === 0 ? 0 : window.innerWidth * 0.92; const minDrag = slide === 0 ? -window.innerWidth * 0.92 : 0; setDragOffset(Math.max(minDrag, Math.min(maxDrag, rawOffset))); } }}
              onTouchEnd={(e) => { if (touchStartX.current === null) return; const dx = e.changedTouches[0].clientX - touchStartX.current; const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY.current || 0)); if (Math.abs(dx) > 40 && Math.abs(dx) > dy) { setSlide(dx < 0 ? 1 : 0); } touchStartX.current = null; touchStartY.current = null; touchCurrentX.current = null; setIsDragging(false); setDragOffset(0); }}>
              {/* Single track slides both panels together — no overlap ever */}
              <div style={{
                position: 'absolute', top: 0, height: '100%',
                left: 0, width: '200%',
                transform: isDragging
                  ? `translateX(calc(${slide === 0 ? '0%' : '-46%'} + ${dragOffset * 0.5}px))`
                  : slide === 0 ? 'translateX(0%)' : 'translateX(-46%)',
                transition: isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                willChange: 'transform',
              }}>
                {/* Photo — 2.5% of track = 5% of card margin each side, 45% of track = 90% of card wide → centred */}
                <div style={{ position: 'absolute', top: 0, height: '100%', left: '2.5%', width: '45%', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={post.image_url} alt="workout" style={{ position: 'absolute', left: 0, right: 0, width: '100%', height: '130%', top: '-15%', objectFit: 'cover', objectPosition: 'center center' }} />
                </div>
                {/* Summary — starts at 48.5% of track (= just after photo right edge + 1% gap), same width */}
                <div style={{ position: 'absolute', top: 0, height: '100%', left: '48.5%', width: '45%', overflow: 'hidden' }}>
                  {exerciseSummaryJSX}
                </div>
              </div>
            </div>
          ) : (
            exercises.length > 0 && <div style={{ width: SUMMARY_WIDTH }}>{exerciseSummaryJSX}</div>
          )}

          <div className="relative z-10 flex items-center justify-between px-3 py-1" style={{ minHeight: 44 }}>
            <div className="flex items-center gap-1">
              {currentUser && (
                <motion.button onClick={() => reactMutation.mutate(!hasReacted)} disabled={reactMutation.isPending} className="flex items-center gap-1 flex-shrink-0" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                  {userStreakVariant === 'sunglasses'
                    ? <div className="relative w-11 h-11 flex items-center justify-center"><img src={STREAK_ICON_URL} alt="streak" className={`w-11 h-11 ${hasReacted ? '' : 'opacity-40'}`} style={{ objectFit: 'contain' }} /><svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64"><circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" /></svg></div>
                    : <img src={STREAK_ICON_URL} alt="streak" className={`w-11 h-11 ${hasReacted ? '' : 'opacity-40'}`} style={{ objectFit: 'contain' }} />}
                </motion.button>
              )}
              <motion.button onClick={handleWorkoutShare} className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
            {Object.keys(post.reactions || {}).length > 0 && (
              <button onClick={() => setShowReactionsModal(true)} className="flex items-center hover:opacity-80 transition-opacity">
                <div className="flex items-center" style={{ gap: 0 }}>
                  {Object.entries(post.reactions || {}).slice(0, 3).map(([uid, variant], i) => (
                    <div key={uid} className="relative w-6 h-6" style={{ marginLeft: i === 0 ? 0 : '-6px', zIndex: 3 - i }}>
                      {variant === 'sunglasses'
                        ? <div className="relative w-full h-full flex items-center justify-center"><img src={STREAK_ICON_URL} alt="streak" className="w-6 h-6" style={{ objectFit: 'contain' }} /><svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64"><circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" /></svg></div>
                        : <img src={STREAK_ICON_URL} alt="streak" className="w-20 h-20 -mt-6" style={{ objectFit: 'contain' }} />}
                    </div>
                  ))}
                  {Object.keys(post.reactions || {}).length > 3 && <div className="flex items-center gap-0.5 ml-1"><Plus className="w-3 h-3 text-slate-300" /><span className="text-xs font-bold text-slate-300">{Object.keys(post.reactions || {}).length - 3}</span></div>}
                </div>
              </button>
            )}
          </div>
        </motion.div>

        <ReactionsModal open={showReactionsModal} onClose={() => setShowReactionsModal(false)} reactions={post.reactions || {}} reactedUsers={reactedUsers} />
        <ConfirmDialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Post?" description="This action cannot be undone." confirmLabel="Delete"
          confirmClass="bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_3px_0_0_#7f1d1d,0_6px_16px_rgba(200,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
          onConfirm={() => { deleteMutation.mutate(); setShowDeleteConfirm(false); }} isPending={deleteMutation.isPending} />
        <ConfirmDialog open={showFavouriteConfirm} onClose={() => setShowFavouriteConfirm(false)}
          title={post.is_favourite ? 'Remove from Favourites?' : 'Add to Favourites?'}
          description={post.is_favourite ? 'This post will no longer appear as your favourite on your profile.' : 'This post will appear as your favourite on your profile for others to see.'}
          confirmLabel={post.is_favourite ? 'Remove' : 'Add to Favourites'}
          confirmClass="bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 shadow-[0_3px_0_0_#92400e,0_6px_16px_rgba(180,100,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]"
          onConfirm={() => { updatePostMutation.mutate({ id: post.id, data: { is_favourite: !post.is_favourite } }); setShowFavouriteConfirm(false); }} isPending={updatePostMutation.isPending} />
        <ReportModal open={showReportModal} onClose={() => setShowReportModal(false)} postId={post.id} />
      </>
    );
  }

  // ── STANDARD POST ─────────────────────────────────────────────────────────
  const totalReactions = Object.keys(post.reactions || {}).length;

  const handleShare = async () => {
    const text = [post.content || '', `\n— shared from my workout app`].filter(Boolean).join('\n');
    if (navigator.share) { try { await navigator.share({ title: 'Post', text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); toast.success('Copied to clipboard!'); } catch { toast.error('Could not share'); }
  };

  const standardOwnerExtras = (
    <button onClick={() => { setShowFavouriteConfirm(true); setShowMenu(false); }} disabled={updatePostMutation.isPending}
      className="flex items-center gap-2 w-full px-4 py-2.5 text-amber-400 hover:text-amber-300 hover:bg-slate-700 text-sm font-semibold transition-colors disabled:opacity-50">
      <Star className={`w-4 h-4 ${post.is_favourite ? 'fill-amber-400' : ''}`} />
      {post.is_favourite ? 'Unfavourite' : 'Favourite'}
    </button>
  );

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="mb-4 overflow-hidden shadow-2xl shadow-black/40 rounded-2xl -mx-2 relative"
        style={{ background: 'linear-gradient(135deg, rgba(14,17,36,0.96) 0%, rgba(5,7,16,0.99) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

        <div className="absolute inset-x-0 top-0 h-px pointer-events-none z-10" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ background: 'radial-gradient(ellipse at 25% 35%, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />

        <div className="relative z-10 px-4 pt-3.5 pb-3">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('UserProfile') + `?id=${post.member_id}`} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center flex-shrink-0">
                {post.member_avatar ? <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-white">{post.member_name?.charAt(0)?.toUpperCase() || '?'}</span>}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{post.member_name}</p>
                <p className="text-[11px] text-white/70 font-medium">{format(new Date(post.created_date), 'MMM d · h:mm a')}</p>
              </div>
            </Link>
            {isOwner ? renderMenu(standardOwnerExtras) : renderMenu(null)}
          </div>
          {post.content && (
            <div className="mt-3">
              <p className="text-sm text-slate-300 leading-relaxed">
                {post.content.length > 120 && !showFullContent
                  ? <>{post.content.substring(0, 120)}...{' '}<button onClick={() => setShowFullContent(true)} className="text-blue-400 hover:text-blue-300 font-semibold">more</button></>
                  : post.content}
              </p>
              {post.weight && <span className="block mt-1 text-blue-400 font-semibold text-sm">💪 {post.weight} lbs</span>}
            </div>
          )}
        </div>

        {hasMedia && (
          <div className="relative w-full overflow-hidden">
            {post.video_url
              ? <video src={post.video_url} className="w-full object-cover" style={{ maxHeight: '400px' }} controls playsInline preload="metadata" />
              : <img src={post.image_url} alt="Post" className="w-full object-cover" style={{ maxHeight: '400px' }} />}
          </div>
        )}

        {isNudgePost && isOwner && (
          <div className="px-4 pt-2">
            <button onClick={() => nudgeMutation.mutate()} disabled={nudgeMutation.isPending}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
              {nudgeMutation.isPending ? 'Nudging...' : 'Nudge'}
            </button>
          </div>
        )}

        <div className="relative z-10 flex items-center justify-between px-3 py-1" style={{ minHeight: 44 }}>
          <div className="flex items-center gap-1">
            {currentUser && (
              <motion.button onClick={() => reactMutation.mutate(!hasReacted)} disabled={reactMutation.isPending} className="flex items-center gap-1 flex-shrink-0" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                {userStreakVariant === 'sunglasses'
                  ? <div className="relative w-11 h-11 flex items-center justify-center"><img src={STREAK_ICON_URL} alt="streak" className={`w-11 h-11 ${hasReacted ? '' : 'opacity-40'}`} style={{ objectFit: 'contain' }} /><svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64"><circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" /></svg></div>
                  : <img src={STREAK_ICON_URL} alt="streak" className={`w-11 h-11 ${hasReacted ? '' : 'opacity-40'}`} style={{ objectFit: 'contain' }} />}
              </motion.button>
            )}
            <motion.button onClick={handleShare} className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
          {totalReactions > 0 && (
            <button onClick={() => setShowReactionsModal(true)} className="flex items-center hover:opacity-80 transition-opacity">
              <div className="flex items-center" style={{ gap: 0 }}>
                {Object.entries(post.reactions || {}).slice(0, 3).map(([uid, variant], i) => (
                  <div key={uid} className="relative w-6 h-6" style={{ marginLeft: i === 0 ? 0 : '-6px', zIndex: 3 - i }}>
                    {variant === 'sunglasses'
                      ? <div className="relative w-full h-full flex items-center justify-center"><img src={STREAK_ICON_URL} alt="streak" className="w-6 h-6" style={{ objectFit: 'contain' }} /><svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64"><circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" /></svg></div>
                      : <img src={STREAK_ICON_URL} alt="streak" className="w-20 h-20 -mt-6" style={{ objectFit: 'contain' }} />}
                  </div>
                ))}
                {totalReactions > 3 && <div className="flex items-center gap-0.5 ml-1"><Plus className="w-3 h-3 text-slate-300" /><span className="text-xs font-bold text-slate-300">{totalReactions - 3}</span></div>}
              </div>
            </button>
          )}
        </div>

        <CommentModal open={showComments} onClose={() => setShowComments(false)} post={post} onAddComment={(commentText) => onComment(post.id, commentText)} />
        <ShareModal open={showShare} onClose={() => setShowShare(false)} post={post} />
      </motion.div>

      <ReactionsModal open={showReactionsModal} onClose={() => setShowReactionsModal(false)} reactions={post.reactions || {}} reactedUsers={reactedUsers} />
      <ConfirmDialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Post?" description="Are you sure you want to delete your post? This action cannot be undone." confirmLabel="Delete"
        confirmClass="bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_3px_0_0_#7f1d1d,0_6px_16px_rgba(200,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
        onConfirm={() => { deleteMutation.mutate(); setShowDeleteConfirm(false); }} isPending={deleteMutation.isPending} />
      <ConfirmDialog open={showFavouriteConfirm} onClose={() => setShowFavouriteConfirm(false)}
        title={post.is_favourite ? 'Remove from Favourites?' : 'Add to Favourites?'}
        description={post.is_favourite ? 'This post will no longer appear as your favourite on your profile.' : 'This post will appear as your favourite on your profile for others to see.'}
        confirmLabel={post.is_favourite ? 'Remove' : 'Add to Favourites'}
        confirmClass="bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 shadow-[0_3px_0_0_#92400e,0_6px_16px_rgba(180,100,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]"
        onConfirm={() => { updatePostMutation.mutate({ id: post.id, data: { is_favourite: !post.is_favourite } }); setShowFavouriteConfirm(false); }} isPending={updatePostMutation.isPending} />
      <ReportModal open={showReportModal} onClose={() => setShowReportModal(false)} postId={post.id} />
    </>
  );
}