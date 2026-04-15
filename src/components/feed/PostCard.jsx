import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Send, MoreHorizontal, Trash2, Star, Plus, Clock, Dumbbell, Zap, ChevronDown, ChevronUp, Loader2, Flag, ChevronRight, Check, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';
import WorkoutShareModal from './WorkoutShareModal';
import PostShareModal from './PostShareModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STREAK_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png';

// ── Reactions Modal ───────────────────────────────────────────────────────────
function ReactionsModal({ open, onClose, reactions, reactedUsers, currentUserId, friends, sentFriendRequests, onAddFriend }) {
  const [search, setSearch] = useState('');
  const [localPendingIds, setLocalPendingIds] = useState(new Set());
  if (!open) return null;

  const friendIds = new Set((friends || []).map(f => f.friend_id));
  const sentIds = new Set((sentFriendRequests || []).map(r => r.friend_id));

  const sanitised = search.replace(/[^a-zA-Z0-9_.\ ]/g, '').slice(0, 30);
  const filtered = reactedUsers.filter(user => {
    const name = user.display_name || user.full_name || user.username || '';
    return name.toLowerCase().includes(sanitised.toLowerCase());
  });

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
          <h3 className="text-lg font-semibold leading-none tracking-tight text-white text-center">{Object.keys(reactions).length} Reactions</h3>
        </div>
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20">
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value.replace(/[^a-zA-Z0-9_.\ ]/g, '').slice(0, 30))}
              placeholder="Search by name..."
              maxLength={30}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              style={{ fontSize: '16px' }}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-300 text-sm"
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-80 px-3 pb-4">
          {filtered.length === 0
            ? <p className="text-center text-slate-400 text-sm py-6">No reactions found</p>
            : filtered.map((user) => {
              const variant = reactions[user.id];
              const displayName = user.display_name || user.full_name || user.username || 'Unknown';
              const isSelf = user.id === currentUserId;
              const isFriend = friendIds.has(user.id);
              const isPending = sentIds.has(user.id) || localPendingIds.has(user.id);
              return (
                <div key={user.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, marginLeft: -2 }}>
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
                  <span className="text-sm text-slate-200 font-semibold flex-1 min-w-0 truncate">{displayName}</span>
                  {!isSelf && (
                    isFriend ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ background: 'linear-gradient(to bottom, #1a1f35, #0f1220)', border: '1px solid rgba(99,102,241,0.3)', color: 'rgba(165,180,252,0.85)', letterSpacing: '0.04em' }}>
                        Friends
                      </span>
                    ) : isPending ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ background: 'linear-gradient(to bottom, #1a1f35, #0f1220)', border: '1px solid rgba(99,102,241,0.3)', color: 'rgba(165,180,252,0.85)', letterSpacing: '0.04em' }}>
                        Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (onAddFriend) onAddFriend(user);
                          setLocalPendingIds(prev => new Set([...prev, user.id]));
                        }}
                        className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-lg active:translate-y-[2px] active:shadow-none transition-all duration-100"
                        style={{
                          background: 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 40%, #2563eb 100%)',
                          border: '1px solid rgba(147,197,253,0.4)',
                          boxShadow: '0 3px 0 0 #1a3fa8, 0 5px 12px rgba(0,0,100,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                        }}>
                        <UserPlus className="w-3.5 h-3.5 text-white" />
                      </button>
                    )
                  )}
                </div>
              );
            })
          }
        </div>
      </div>
    </>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
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

// ── Report categories ─────────────────────────────────────────────────────────
const REPORT_CATEGORIES = [
  { id: 'dislike', label: "I just don't like it", definition: "This post isn't for you — it might be annoying, uninteresting, or just not your thing. You won't see more like it." },
  { id: 'violence', label: 'Violence or abuse', definition: "Content that depicts, promotes, or glorifies physical violence, self-harm, abuse, or threatening behaviour toward people or animals." },
  { id: 'hate', label: 'Hate and harassment', definition: "Content that targets someone based on race, ethnicity, religion, gender, sexual orientation, disability, or similar characteristics, or that is intended to bully or harass an individual." },
  { id: 'sexual', label: 'Sexual content', definition: "Explicit or suggestive sexual content, nudity, or content that sexualises individuals without consent." },
  { id: 'false_info', label: 'False information', definition: "Content that spreads demonstrably false or misleading information that could deceive others or cause real-world harm." },
  { id: 'other', label: 'Other', definition: "Something else not covered above. Please submit and our team will review the post." },
];

function ReportModal({ open, onClose, postId }) {
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const handleClose = () => { setSelected(null); setExpanded(null); onClose(); };
  const handleSubmit = () => { handleClose(); toast.success('Report submitted. Thank you.'); };

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

// ── Exercise row ──────────────────────────────────────────────────────────────
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

// ── Smart date formatter ──────────────────────────────────────────────────────
function formatPostDate(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;

  // Handles future timestamps (e.g. timezone offset making post appear ahead of now)
  if (diffMs < 0) return 'Just now';

  const diffMins = diffMs / (1000 * 60);
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffMins < 5) return 'Just now';

  if (diffMins < 60) {
    const m = Math.floor(diffMins);
    return m === 1 ? '1 minute ago' : `${m} minutes ago`;
  }

  if (diffHours < 24) {
    const h = Math.floor(diffHours);
    return h === 1 ? '1 hour ago' : `${h} hours ago`;
  }

  if (diffDays < 3) {
    const d = Math.floor(diffDays);
    return d === 1 ? '1 day ago' : `${d} days ago`;
  }

  const day = date.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31 ? 'st'
    : day === 2 || day === 22 ? 'nd'
    : day === 3 || day === 23 ? 'rd'
    : 'th';
  const month = date.toLocaleDateString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
}

function PostMeta({ post, gymName }) {
  const timeStr = formatPostDate(post.created_date);
  if (gymName) {
    return (
      <p className="text-[11px] text-white/70 font-medium leading-tight">
        {gymName}
        <span className="mx-1 opacity-40">·</span>
        {timeStr}
      </p>
    );
  }
  return <p className="text-[11px] text-white/70 font-medium">{timeStr}</p>;
}

// ── Caption with Instagram-style fade + more/less ─────────────────────────────
function ExpandableCaption({ text, className = '' }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setNeedsTruncation(el.scrollHeight > el.clientHeight + 2);
  }, [text]);

  if (!text) return null;

  return (
    <div ref={containerRef} className={`relative mt-3 ${className}`}>
      {!expanded ? (
        <div className="relative">
          <p
            ref={textRef}
            className="text-sm text-slate-300 leading-relaxed"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              paddingRight: needsTruncation ? '42px' : '0',
            }}
          >
            {text}
          </p>
          {needsTruncation && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(to right, transparent 0%, rgba(10,12,28,0.92) 22%)',
                paddingLeft: '14px',
                paddingRight: '2px',
              }}
            >
              <button
                onClick={() => setExpanded(true)}
                className="text-sm font-semibold text-slate-300 transition-colors whitespace-nowrap flex-shrink-0"
                style={{ lineHeight: 'inherit' }}
              >
                more
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-300 leading-relaxed">
          {text}
          {' '}
          <button
            onClick={() => setExpanded(false)}
            className="text-sm font-semibold text-slate-300 transition-colors"
          >
            less
          </button>
        </p>
      )}
    </div>
  );
}

function PostCard({ post, onLike, onComment, onSave, onDelete, fullWidth = false, isOwnProfile = false, currentUser: currentUserProp, friends = [], sentFriendRequests = [], onAddFriend }) {
  const [reacted, setReacted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showWorkoutShare, setShowWorkoutShare] = useState(false);
  const [showPostShare, setShowPostShare] = useState(false);
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
  const reactMutationLockRef = React.useRef(false);
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
    enabled: !!currentUser?.id && isOwnProfile,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: postGym } = useQuery({
    queryKey: ['postGym', post.gym_id],
    queryFn: () => base44.entities.Gym.filter({ id: post.gym_id }).then(r => r[0] || null),
    enabled: !!post.gym_id,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const { data: fallbackGym } = useQuery({
    queryKey: ['postGymFromCheckIn', post.member_id, post.created_date],
    queryFn: async () => {
      const checkIns = await base44.entities.CheckIn.filter(
        { user_id: post.member_id },
        '-check_in_date',
        5
      );
      if (!checkIns.length) return null;
      const postTime = new Date(post.created_date).getTime();
      const closest = checkIns.find(ci => {
        const ciTime = new Date(ci.check_in_date).getTime();
        return Math.abs(postTime - ciTime) < 12 * 60 * 60 * 1000;
      }) || checkIns[0];
      if (!closest?.gym_id) return null;
      return base44.entities.Gym.filter({ id: closest.gym_id }).then(r => r[0] || null);
    },
    enabled: !post.gym_id && !!post.workout_name && !!post.member_id,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const gymName = postGym?.name || fallbackGym?.name || null;

  const reactedUserIds = useMemo(() => Object.keys(post.reactions || {}), [post.reactions]);
  const { data: reactedUsers = [] } = useQuery({
    queryKey: ['reactedUsers', reactedUserIds.join(',')],
    queryFn: async () => {
      if (reactedUserIds.length === 0) return [];
      const res = await base44.functions.invoke('getUserAvatars', { userIds: reactedUserIds });
      return reactedUserIds.map(id => ({
        id,
        display_name: res.data.avatars[id]?.full_name || 'Unknown',
        full_name: res.data.avatars[id]?.full_name || 'Unknown',
        avatar_url: res.data.avatars[id]?.avatar_url
      }));
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

  const { data: postAuthor } = useQuery({
    queryKey: ['postAuthor', post.member_id],
    queryFn: () => base44.functions.invoke('getFriendUsers', { userIds: [post.member_id] }).then(r => r.data?.users?.[0] || null),
    enabled: !!post.member_id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const resolvedMemberName = postAuthor?.display_name || postAuthor?.full_name || post.member_name;

  const isOwner = currentUser?.id === post.member_id;
  const isNudgePost = post.exercise === 'workout_completion_nudge';
  const isGymJoinPost = post.gym_join === true;
  const isWorkoutPost = !!post.workout_name;
  const hasMedia = !!(post.video_url || post.image_url);

  const userStreakVariant = useMemo(() => currentUser?.streak_variant || 'default', [currentUser?.streak_variant]);
  const [localReacted, setLocalReacted] = useState(() => !!(post.reactions && currentUser?.id && post.reactions[currentUser?.id]));
  const [localReactions, setLocalReactions] = useState(() => ({ ...(post.reactions || {}) }));
  const prevReactionsRef = React.useRef(post.reactions);
  useEffect(() => {
    if (post.reactions !== prevReactionsRef.current) {
      prevReactionsRef.current = post.reactions;
      setLocalReacted(!!(post.reactions && currentUser?.id && post.reactions[currentUser?.id]));
      setLocalReactions({ ...(post.reactions || {}) });
    }
  }, [post.reactions, currentUser?.id]);
  const hasReacted = localReacted;

  const reactMutation = useMutation({
    mutationFn: async (isReacting) => {
      return base44.functions.invoke('postInteraction', {
        postId: post.id,
        action: isReacting ? 'react' : 'unreact',
        reactionVariant: userStreakVariant,
      });
    },
    onMutate: async (isReacting) => {
      reactMutationLockRef.current = true;
      setLocalReacted(isReacting);
      setLocalReactions(prev => {
        const updated = { ...prev };
        if (isReacting) updated[currentUser?.id] = userStreakVariant;
        else if (currentUser?.id) delete updated[currentUser.id];
        return updated;
      });
      const applyUpdate = (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((p) => {
          if (p.id !== post.id) return p;
          const updatedReactions = { ...(p.reactions || {}) };
          if (isReacting) updatedReactions[currentUser?.id] = userStreakVariant;
          else if (currentUser?.id) delete updatedReactions[currentUser.id];
          return { ...p, reactions: updatedReactions };
        });
      };
      await queryClient.cancelQueries({ queryKey: ['friendPosts'] });
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['userPosts'] });
      const snapshots = queryClient.getQueryCache().getAll().map(({ queryKey, state }) => ({ queryKey, data: state.data }));
      queryClient.getQueryCache().getAll().forEach(({ queryKey, state }) => {
        if (Array.isArray(state.data)) {
          queryClient.setQueryData(queryKey, applyUpdate(state.data));
        }
      });
      return { snapshots };
    },
    onError: (err, isReacting, context) => {
      setLocalReacted(!isReacting);
      setLocalReactions({ ...(post.reactions || {}) });
      context?.snapshots?.forEach(({ queryKey, data }) => queryClient.setQueryData(queryKey, data));
      toast.error('Failed to react to post');
      reactMutationLockRef.current = false;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      reactMutationLockRef.current = false;
    }
  });

  const nudgeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) return 0;
      const friends = await base44.entities.Friend.filter({ user_id: currentUser.id, status: 'accepted' });
      const todayDate = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      let nudgedCount = 0;
      for (const friend of friends) {
        const friendUser = await base44.entities.User.filter({ id: friend.friend_id });
        if (!friendUser.length) continue;
        const friendData = friendUser[0];
        const trainingDays = friendData.training_days || [];
        const isRestDay = !trainingDays.includes(adjustedDay);
        const hasNoExercises = !friendData.custom_workout_types?.[adjustedDay]?.exercises?.length;
        if (isRestDay || hasNoExercises) continue;
        const friendWorkouts = await base44.entities.WorkoutLog.filter({ user_id: friend.friend_id, completed_date: todayDate });
        if (friendWorkouts.length === 0) nudgedCount++;
      }
      return nudgedCount;
    },
    onSuccess: (count) => {
      toast.success(count > 0 ? `Nudged ${count} friend${count !== 1 ? 's' : ''}!` : 'All friends already worked out today!');
    },
    onError: () => toast.error('Failed to nudge friends')
  });

  // ── 3-dot menu ────────────────────────────────────────────────────────────
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

  // ── Gym join post ─────────────────────────────────────────────────────────
  if (isGymJoinPost) {
    return (
      <Link to={createPageUrl('UserProfile') + `?id=${post.member_id}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/15 to-cyan-500/10 backdrop-blur-xl border border-blue-500/30 rounded-lg p-2.5 hover:border-blue-400/50 transition-all cursor-pointer h-16 flex items-center gap-2.5 shadow-lg shadow-black/20 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
            {post.member_avatar ? <img src={post.member_avatar} alt={resolvedMemberName} className="w-full h-full object-cover" decoding="async" /> : <span className="text-xs font-bold text-white">{resolvedMemberName?.charAt(0)?.toUpperCase()}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-xs truncate">{resolvedMemberName}</p>
            <p className="text-[11px] text-blue-300 truncate">{post.content}</p>
          </div>
        </motion.div>
      </Link>
    );
  }

  // ── WORKOUT POST ──────────────────────────────────────────────────────────
  if (isWorkoutPost) {
    const exercises = (post.workout_exercises || []).filter(Boolean);
    const hasPhoto = !!post.image_url;
    const SUMMARY_WIDTH = '92%';
    const PANEL_HEIGHT = 'min(85.8vw, 380px)';

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
            {(exercisesExpanded ? exercises : exercises.slice(0, PREVIEW_COUNT)).filter(Boolean).map((ex, idx) => <ExerciseRow key={idx} ex={ex} idx={idx} />)}
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
          className="mb-1 overflow-hidden shadow-2xl shadow-black/40 rounded-2xl -mx-2 relative"
          style={{ background: 'linear-gradient(135deg, rgba(16,19,40,0.96) 0%, rgba(6,8,18,0.99) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

          <div className="absolute inset-x-0 top-0 h-px pointer-events-none z-10" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
          <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ background: 'radial-gradient(ellipse at 25% 35%, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />

          <div className="relative z-10 px-4 pt-3.5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <Link to={createPageUrl('UserProfile') + `?id=${post.member_id}`} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {post.member_avatar ? <img src={post.member_avatar} alt={resolvedMemberName} className="w-full h-full object-cover" decoding="async" /> : <span className="text-sm font-bold text-white">{resolvedMemberName?.charAt(0)?.toUpperCase() || '?'}</span>}
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{resolvedMemberName}</p>
                  <PostMeta post={post} gymName={gymName} />
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
            {userComment && <ExpandableCaption text={userComment} />}
          </div>

          {hasPhoto ? (
            <div ref={swipePanelRef} className="relative overflow-hidden" style={{ height: PANEL_HEIGHT }}
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; touchCurrentX.current = e.touches[0].clientX; setIsDragging(false); setDragOffset(0); }}
              onTouchMove={(e) => { if (touchStartX.current === null) return; const dx = e.touches[0].clientX - touchStartX.current; const dy = Math.abs(e.touches[0].clientY - (touchStartY.current || 0)); if (Math.abs(dx) > dy) { setIsDragging(true); touchCurrentX.current = e.touches[0].clientX; const rawOffset = dx; const maxDrag = slide === 0 ? 0 : window.innerWidth * 0.92; const minDrag = slide === 0 ? -window.innerWidth * 0.92 : 0; setDragOffset(Math.max(minDrag, Math.min(maxDrag, rawOffset))); } }}
              onTouchEnd={(e) => { if (touchStartX.current === null) return; const dx = e.changedTouches[0].clientX - touchStartX.current; const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY.current || 0)); if (Math.abs(dx) > 40 && Math.abs(dx) > dy) { setSlide(dx < 0 ? 1 : 0); } touchStartX.current = null; touchStartY.current = null; touchCurrentX.current = null; setIsDragging(false); setDragOffset(0); }}>
              <div style={{
                position: 'absolute', top: 0, height: '100%',
                left: 0, width: '200%',
                transform: isDragging
                  ? `translateX(calc(${slide === 0 ? '0%' : '-46%'} + ${dragOffset * 0.5}px))`
                  : slide === 0 ? 'translateX(0%)' : 'translateX(-46%)',
                transition: isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                willChange: 'transform',
              }}>
                <div style={{ position: 'absolute', top: 0, height: '100%', left: '2.5%', width: '45%', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={post.image_url} alt="workout" loading="lazy" decoding="async" style={{ position: 'absolute', left: 0, right: 0, width: '100%', height: '130%', top: '-15%', objectFit: 'cover', objectPosition: 'center center' }} />
                </div>
                <div style={{ position: 'absolute', top: 0, height: '100%', left: '48.5%', width: '45%', overflow: 'hidden' }}>
                  {exerciseSummaryJSX}
                </div>
              </div>
            </div>
          ) : (
            exercises.length > 0 && <div style={{ width: SUMMARY_WIDTH }}>{exerciseSummaryJSX}</div>
          )}

          {/* Action bar */}
          <div className="relative z-10 flex items-center justify-between px-3 py-1" style={{ minHeight: 44 }}>
            <div className="flex items-center gap-1">
              {currentUser && (
                <motion.button onClick={() => { if (!reactMutationLockRef.current) reactMutation.mutate(!hasReacted); }} disabled={reactMutation.isPending} className="flex items-center gap-1 flex-shrink-0" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                  {userStreakVariant === 'sunglasses'
                    ? <div className="relative w-11 h-11 flex items-center justify-center"><img src={STREAK_ICON_URL} alt="streak" className={`w-11 h-11 ${hasReacted ? '' : 'opacity-40'}`} style={{ objectFit: 'contain' }} /><svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64"><circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" /></svg></div>
                    : <img src={STREAK_ICON_URL} alt="streak" className={`w-11 h-11 ${hasReacted ? '' : 'opacity-40'}`} style={{ objectFit: 'contain' }} />}
                </motion.button>
              )}
              {isOwner && (
                <motion.button onClick={(e) => { e.stopPropagation(); setShowWorkoutShare(true); }} className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
                  <Send className="w-5 h-5" />
                </motion.button>
              )}
            </div>
            {Object.keys(localReactions).length > 0 && (
              <button onClick={() => setShowReactionsModal(true)} className="flex items-center hover:opacity-80 transition-opacity mr-2">
                <div className="flex items-center" style={{ gap: 0 }}>
                  {Object.entries(localReactions).slice(0, 3).map(([uid, variant], i) => (
                    <div key={uid} className="relative w-6 h-6" style={{ marginLeft: i === 0 ? 0 : '-6px', zIndex: 3 - i }}>
                      {variant === 'sunglasses'
                        ? <div className="relative w-full h-full flex items-center justify-center"><img src={STREAK_ICON_URL} alt="streak" className="w-6 h-6" style={{ objectFit: 'contain' }} /><svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64"><circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" /></svg></div>
                        : <img src={STREAK_ICON_URL} alt="streak" className="w-20 h-20 -mt-6" style={{ objectFit: 'contain' }} />}
                    </div>
                  ))}
                  {Object.keys(localReactions).length > 3 && <div className="flex items-center gap-0.5 ml-1"><Plus className="w-3 h-3 text-slate-300" /><span className="text-xs font-bold text-slate-300">{Object.keys(localReactions).length - 3}</span></div>}
                </div>
              </button>
            )}
          </div>
        </motion.div>

        <ReactionsModal open={showReactionsModal} onClose={() => setShowReactionsModal(false)} reactions={post.reactions || {}} reactedUsers={reactedUsers} currentUserId={currentUser?.id} friends={friends} sentFriendRequests={sentFriendRequests} onAddFriend={onAddFriend} />
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
        {typeof document !== 'undefined' && ReactDOM.createPortal(
          <WorkoutShareModal open={showWorkoutShare} onClose={() => setShowWorkoutShare(false)} post={post} gymName={gymName} />,
          document.body
        )}
      </>
    );
  }

  // ── STANDARD POST ─────────────────────────────────────────────────────────
  const totalReactions = Object.keys(localReactions).length;

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
        className="mb-1 overflow-hidden shadow-2xl shadow-black/40 rounded-2xl -mx-2 relative"
        style={{ background: 'linear-gradient(135deg, rgba(16,19,40,0.96) 0%, rgba(6,8,18,0.99) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

        <div className="absolute inset-x-0 top-0 h-px pointer-events-none z-10" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ background: 'radial-gradient(ellipse at 25% 35%, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />

        <div className="relative z-10 px-4 pt-3.5 pb-3">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('UserProfile') + `?id=${post.member_id}`} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center flex-shrink-0">
                {post.member_avatar ? <img src={post.member_avatar} alt={resolvedMemberName} className="w-full h-full object-cover" decoding="async" /> : <span className="text-sm font-bold text-white">{resolvedMemberName?.charAt(0)?.toUpperCase() || '?'}</span>}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{resolvedMemberName}</p>
                <PostMeta post={post} gymName={gymName} />
              </div>
            </Link>
            {isOwner ? renderMenu(standardOwnerExtras) : renderMenu(null)}
          </div>
          {post.content && <ExpandableCaption text={post.content} />}
          {post.weight && <span className="block mt-1 text-blue-400 font-semibold text-sm">💪 {post.weight} lbs</span>}
        </div>

        {hasMedia && (
          <div className="relative w-full overflow-hidden" style={{ height: 'min(100vw, 451px)' }}>
            {post.video_url
              ? <video src={post.video_url} className="w-full h-full object-cover" controls playsInline preload="metadata" />
              : <img src={post.image_url} alt="Post" className="w-full h-full object-cover" loading="lazy" decoding="async" style={{ objectPosition: 'center center' }} />}
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

        {/* Action bar */}
        <div className="relative z-10 flex items-center justify-between px-3 py-1" style={{ minHeight: 44 }}>
          <div className="flex items-center gap-1">
            {currentUser && (
              <motion.button onClick={() => { if (!reactMutationLockRef.current) reactMutation.mutate(!hasReacted); }} disabled={reactMutation.isPending} className="flex items-center gap-1 flex-shrink-0" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                {userStreakVariant === 'sunglasses'
                  ? <div className="relative w-11 h-11 flex items-center justify-center"><img src={STREAK_ICON_URL} alt="streak" className={`w-11 h-11 ${hasReacted ? '' : 'opacity-40'}`} style={{ objectFit: 'contain' }} /><svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64"><circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" /><line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" /></svg></div>
                  : <img src={STREAK_ICON_URL} alt="streak" className={`w-11 h-11 ${hasReacted ? '' : 'opacity-40'}`} style={{ objectFit: 'contain' }} />}
              </motion.button>
            )}
            {isOwner && (
              <motion.button onClick={(e) => { e.stopPropagation(); setShowPostShare(true); }} className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
                <Send className="w-5 h-5" />
              </motion.button>
            )}
          </div>
          {totalReactions > 0 && (
            <button onClick={() => setShowReactionsModal(true)} className="flex items-center hover:opacity-80 transition-opacity mr-2">
              <div className="flex items-center" style={{ gap: 0 }}>
                {Object.entries(localReactions).slice(0, 3).map(([uid, variant], i) => (
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

        {typeof document !== 'undefined' && ReactDOM.createPortal(
          <>
            <CommentModal open={showComments} onClose={() => setShowComments(false)} post={post} onAddComment={(commentText) => onComment(post.id, commentText)} />
            <ShareModal open={showShare} onClose={() => setShowShare(false)} post={post} />
            <WorkoutShareModal open={showWorkoutShare} onClose={() => setShowWorkoutShare(false)} post={post} gymName={gymName} />
            <PostShareModal open={showPostShare} onClose={() => setShowPostShare(false)} post={post} />
          </>,
          document.body
        )}
      </motion.div>

      <ReactionsModal open={showReactionsModal} onClose={() => setShowReactionsModal(false)} reactions={post.reactions || {}} reactedUsers={reactedUsers} currentUserId={currentUser?.id} friends={friends} sentFriendRequests={sentFriendRequests} onAddFriend={onAddFriend} />
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

export default React.memo(PostCard);