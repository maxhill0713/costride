import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import PostCard from '../feed/PostCard';
import { createPageUrl } from '../../utils';
import { Trophy, Dumbbell, TrendingUp, Star, ChevronRight, Zap } from 'lucide-react';

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

  if (friends.length === 0) return null;

  const hasContent = activityFeed.length > 0 || socialFeedPosts.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-3 mt-10">

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
          {activityFeed.length > 0 ? (
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