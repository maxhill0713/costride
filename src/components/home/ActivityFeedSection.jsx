import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import PostCard from '../feed/PostCard';
import { createPageUrl } from '../../utils';
import { Trophy, Flame, Dumbbell, TrendingUp, Crown, Star, ChevronRight, X, Award, Zap } from 'lucide-react';

const POSTS_PER_PAGE = 4;

// ── Activity event card ───────────────────────────────────────────────────────
function ActivityEventCard({ activity }) {
  const [pressed, setPressed] = useState(false);

  const getConfig = () => {
    switch (activity.type) {
      case 'pr':
        return {
          gradient: 'from-yellow-500/20 to-orange-500/10',
          border: 'border-yellow-500/30',
          accent: '#f59e0b',
          glowColor: 'rgba(245,158,11,0.3)',
          icon: <Trophy className="w-4 h-4" style={{ color: '#f59e0b' }} />,
          badge: <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>PR</span>,
        };
      case 'leaderboard_rank':
        return {
          gradient: 'from-purple-500/20 to-indigo-500/10',
          border: 'border-purple-500/30',
          accent: '#a855f7',
          glowColor: 'rgba(168,85,247,0.3)',
          icon: <Crown className="w-4 h-4" style={{ color: '#a855f7' }} />,
          badge: <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>#{activity.rank}</span>,
        };
      case 'streak':
        return {
          gradient: 'from-orange-500/20 to-red-500/10',
          border: 'border-orange-500/30',
          accent: '#f97316',
          glowColor: 'rgba(249,115,22,0.3)',
          icon: <Flame className="w-4 h-4" style={{ color: '#f97316' }} />,
          badge: <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}>{activity.streakCount}🔥</span>,
        };
      case 'notification':
        return {
          gradient: 'from-blue-500/15 to-slate-900/10',
          border: 'border-blue-500/20',
          accent: '#60a5fa',
          glowColor: 'rgba(96,165,250,0.2)',
          icon: <Zap className="w-4 h-4" style={{ color: '#60a5fa' }} />,
          badge: null,
        };
      default:
        return {
          gradient: 'from-slate-800/60 to-slate-900/40',
          border: 'border-slate-700/30',
          accent: '#94a3b8',
          glowColor: 'rgba(148,163,184,0.15)',
          icon: <Star className="w-4 h-4 text-slate-400" />,
          badge: null,
        };
    }
  };

  const cfg = getConfig();

  if (activity.type === 'notification') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl p-3 bg-gradient-to-r ${cfg.gradient} border ${cfg.border}`}
        style={{ backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          {cfg.icon}
          <p className="text-xs text-slate-300 leading-snug flex-1">{activity.message}</p>
          <span className="text-[10px] text-slate-500 flex-shrink-0">{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to={activity.friendId ? createPageUrl('UserProfile') + `?id=${activity.friendId}` : '#'}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          display: 'block',
          borderRadius: 14,
          background: `linear-gradient(135deg, rgba(16,19,40,0.95) 0%, rgba(6,8,18,0.98) 100%)`,
          border: `1px solid ${pressed ? cfg.accent + '55' : 'rgba(255,255,255,0.07)'}`,
          boxShadow: pressed ? `0 0 18px ${cfg.glowColor}` : '0 2px 12px rgba(0,0,0,0.3)',
          transform: pressed ? 'scale(0.977) translateY(2px)' : 'scale(1)',
          transition: pressed ? 'transform 0.06s ease, box-shadow 0.06s ease, border-color 0.06s ease' : 'transform 0.22s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.22s ease, border-color 0.22s ease',
          overflow: 'hidden',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}>
        {/* Top shimmer */}
        <div style={{ position: 'absolute', insetInline: 0, top: 0, height: 1, background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.08) 50%, transparent 90%)', pointerEvents: 'none' }} />
        {/* Glow blob */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 20% 40%, ${cfg.glowColor} 0%, transparent 60%)`, opacity: 0.6, pointerEvents: 'none' }} />
        <div className="relative flex items-center gap-3 px-4 py-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {activity.friendAvatar ? (
              <img src={activity.friendAvatar} alt={activity.friendName} className="w-11 h-11 rounded-full object-cover" style={{ border: `2px solid ${cfg.accent}55` }} decoding="async" />
            ) : (
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-base" style={{ background: `linear-gradient(135deg, ${cfg.accent}33, ${cfg.accent}11)`, border: `2px solid ${cfg.accent}44`, color: cfg.accent }}>
                {activity.friendName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            {/* Type icon badge on avatar */}
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#0a0e1a', border: `1.5px solid ${cfg.accent}55` }}>
              <div className="scale-75">{cfg.icon}</div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-white leading-tight">{activity.friendName}</span>
              {cfg.badge}
            </div>
            <p className="text-xs text-slate-400 leading-tight mt-0.5 truncate">{activity.message}</p>
            <span className="text-[10px] text-slate-600 mt-0.5 block">{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
          </div>

          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: cfg.accent + '80' }} />
        </div>
      </Link>
    </motion.div>
  );
}

// ── Member Spotlight card ─────────────────────────────────────────────────────
function MemberSpotlightCard({ friend, rank }) {
  const [pressed, setPressed] = useState(false);
  const streak = friend.activity?.streak || 0;
  const checkIns = friend.activity?.totalCheckIns || 0;

  const medals = ['🥇', '🥈', '🥉'];
  const medal = medals[rank] || null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: rank * 0.07, duration: 0.3, ease: [0.34, 1.2, 0.64, 1] }}>
      <Link
        to={createPageUrl('UserProfile') + `?id=${friend.friend_id}`}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        className="block"
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(20,24,48,0.95) 0%, rgba(8,10,22,0.98) 100%)',
          border: rank === 0 ? '1px solid rgba(250,204,21,0.35)' : '1px solid rgba(255,255,255,0.07)',
          boxShadow: rank === 0 ? '0 0 20px rgba(250,204,21,0.12), 0 4px 16px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.3)',
          transform: pressed ? 'scale(0.973) translateY(2px)' : 'scale(1)',
          transition: pressed ? 'transform 0.06s ease' : 'transform 0.25s cubic-bezier(0.34,1.3,0.64,1)',
          overflow: 'hidden',
          padding: '12px 14px',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}>
        {rank === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 30%, rgba(250,204,21,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        )}
        <div className="relative flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {friend.friend_avatar ? (
              <img src={friend.friend_avatar} alt={friend.friend_name} className="w-12 h-12 rounded-full object-cover" style={{ border: rank === 0 ? '2px solid rgba(250,204,21,0.5)' : '2px solid rgba(255,255,255,0.1)' }} decoding="async" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-white font-black text-base" style={{ border: rank === 0 ? '2px solid rgba(250,204,21,0.5)' : '2px solid rgba(255,255,255,0.1)' }}>
                {friend.friend_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            {medal && (
              <div className="absolute -bottom-1 -right-1 text-base leading-none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
                {medal}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate">{friend.friend_name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {streak > 0 && (
                <span className="text-[10px] font-bold text-orange-400 flex items-center gap-0.5">
                  <Flame className="w-3 h-3" />{streak} day streak
                </span>
              )}
              {checkIns > 0 && (
                <span className="text-[10px] font-bold text-blue-400">{checkIns} check-ins</span>
              )}
            </div>
          </div>
          {rank === 0 && <Crown className="w-5 h-5 flex-shrink-0" style={{ color: '#fbbf24' }} />}
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function ActivityFeedSection({
  friends,
  filteredActivityCards,
  activityFeed,
  socialFeedPosts,
  currentUser,
  queryClient,
  dismissCard,
  friendsWithActivity = [],
}) {
  const [visiblePostCount, setVisiblePostCount] = useState(POSTS_PER_PAGE);
  const [spotlightCollapsed, setSpotlightCollapsed] = useState(false);
  const feedBottomRef = useRef(null);

  useEffect(() => {
    setVisiblePostCount(POSTS_PER_PAGE);
  }, [socialFeedPosts.length]);

  useEffect(() => {
    const el = feedBottomRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && visiblePostCount < socialFeedPosts.length) {
            setVisiblePostCount((prev) => prev + POSTS_PER_PAGE);
          }
        });
      },
      { rootMargin: '500px', threshold: [0, 0.5] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visiblePostCount, socialFeedPosts.length]);

  // Build spotlight: top 3 friends by streak + check-ins
  const spotlightFriends = useMemo(() => {
    return [...friendsWithActivity]
      .filter(f => (f.activity?.streak || 0) > 0 || (f.activity?.totalCheckIns || 0) > 0)
      .sort((a, b) => {
        const scoreA = (a.activity?.streak || 0) * 3 + (a.activity?.totalCheckIns || 0);
        const scoreB = (b.activity?.streak || 0) * 3 + (b.activity?.totalCheckIns || 0);
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }, [friendsWithActivity]);

  if (friends.length === 0) return null;

  const hasContent = activityFeed.length > 0 || socialFeedPosts.length > 0 || spotlightFriends.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-3 mt-10">

      {/* ── Member Spotlight ── */}
      {spotlightFriends.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setSpotlightCollapsed(v => !v)}
            className="w-full flex items-center justify-between px-1 active:opacity-70 transition-opacity"
            style={{ WebkitTapHighlightColor: 'transparent' }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(250,204,21,0.2), rgba(251,146,60,0.1))', border: '1px solid rgba(250,204,21,0.25)' }}>
                <Award className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-widest">Member Spotlight</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">{spotlightCollapsed ? 'show' : 'hide'}</span>
          </button>

          <AnimatePresence initial={false}>
            {!spotlightCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ overflow: 'hidden' }}>
                <div className="grid grid-cols-1 gap-2">
                  {spotlightFriends.map((friend, i) => (
                    <MemberSpotlightCard key={friend.friend_id} friend={friend} rank={i} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Activity Events (PRs, leaderboard, streaks, notifications) ── */}
      {activityFeed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(59,130,246,0.1))', border: '1px solid rgba(99,102,241,0.25)' }}>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
            </div>
            <span className="text-xs font-black text-white uppercase tracking-widest">Activity</span>
          </div>
          {activityFeed.map((activity) => (
            <ActivityEventCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {/* ── Social Feed ── */}
      {socialFeedPosts.length > 0 && (
        <div className="space-y-3">
          {activityFeed.length > 0 || spotlightFriends.length > 0 ? (
            <div className="flex items-center gap-2 px-1 mt-1">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(59,130,246,0.1))', border: '1px solid rgba(20,184,166,0.25)' }}>
                <Dumbbell className="w-3.5 h-3.5" style={{ color: '#2dd4bf' }} />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-widest">Feed</span>
            </div>
          ) : null}
          {socialFeedPosts.slice(0, visiblePostCount).map((post) => (
            <PostCard key={post.id} post={post} fullWidth={true} currentUser={currentUser} isOwnProfile={post.member_id === currentUser?.id} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => queryClient.invalidateQueries({ queryKey: ['posts'] })} />
          ))}
          <div ref={feedBottomRef} style={{ minHeight: '16px' }} className="flex justify-center py-3">
            {visiblePostCount < socialFeedPosts.length && (
              <div style={{
                width: 30, height: 30,
                borderRadius: '50%',
                border: '2.5px solid rgba(148,163,184,0.2)',
                borderTop: '2.5px solid #60a5fa',
                animation: 'spin 0.7s linear infinite'
              }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(ActivityFeedSection);