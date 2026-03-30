import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Flame, CheckCircle, Trophy, TrendingUp, UserPlus, Search, UserMinus, X, ChevronDown, ChevronLeft, MoreHorizontal } from 'lucide-react';
import StreakIcon from '../components/StreakIcon';
import { formatDistanceToNow, differenceInDays, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import PostCard from '../components/feed/PostCard';

export default function Friends() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  const [dismissedCardIds, setDismissedCardIds] = useState(() => {
    try {
      const stored = localStorage.getItem('friendsFeedDismissedCards');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({
      user_id: currentUser?.id,
      status: 'accepted'
    }),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const { data: friendRequests = [] } = useQuery({
    queryKey: ['friendRequests', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({
      friend_id: currentUser?.id,
      status: 'pending'
    }),
    enabled: !!currentUser?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const knownUserIds = [
    ...friends.map((f) => f.friend_id),
    ...friendRequests.map((r) => r.user_id)
  ];

  const { data: allUsers = [] } = useQuery({
    queryKey: ['friendUsers', knownUserIds.join(',')],
    queryFn: async () => {
      if (knownUserIds.length === 0) return [];
      return base44.entities.User.filter({ id: { $in: knownUserIds } });
    },
    enabled: knownUserIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const sevenDaysAgoCheckIn = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const friendIdsForFeed = friends.map(f => f.friend_id).filter(Boolean);
  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkIns', 'friendFeed', friendIdsForFeed.join(',')],
    queryFn: () => friendIdsForFeed.length === 0 ? [] : base44.entities.CheckIn.filter(
      { user_id: { $in: friendIdsForFeed }, check_in_date: { $gte: sevenDaysAgoCheckIn } },
      '-check_in_date',
      100
    ),
    enabled: !!currentUser && friendIdsForFeed.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: currentUserCheckIns = [] } = useQuery({
    queryKey: ['userCheckIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser?.id }, '-check_in_date', 100),
    enabled: !!currentUser?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser?.id }, '-created_date', 20),
    enabled: !!currentUser?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const friendIds = friends.map((f) => f.friend_id);

  const { data: allPosts = [] } = useQuery({
    queryKey: ['friendPosts', currentUser?.id, friendIdsForFeed.join(',')],
    queryFn: () => {
      const authorIds = [...friendIdsForFeed, currentUser?.id].filter(Boolean);
      return base44.entities.Post.filter(
        { member_id: { $in: authorIds }, is_system_generated: false },
        '-created_date',
        30
      );
    },
    enabled: !!currentUser && friendIdsForFeed.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const sevenDaysAgoLifts = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: allLifts = [] } = useQuery({
    queryKey: ['recentLifts', 'friends'],
    queryFn: () => base44.entities.Lift.filter({ is_pr: true, created_date: { $gte: sevenDaysAgoLifts } }, '-created_date', 50),
    enabled: !!currentUser && friends.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const [pendingOutgoing, setPendingOutgoing] = useState([]); // [{id, full_name, username, avatar_url}]
  const [openPendingMenuId, setOpenPendingMenuId] = useState(null);

  useEffect(() => {
    if (!openPendingMenuId) return;
    const handler = () => setOpenPendingMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openPendingMenuId]);

  const cancelFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', {
      friendId,
      action: 'remove'
    }),
    onSuccess: (_, friendId) => {
      setPendingOutgoing(prev => prev.filter(p => p.id !== friendId));
      setOpenPendingMenuId(null);
      toast.success('Friend request cancelled');
    },
    onError: () => toast.error('Failed to cancel request')
  });

  const addFriendMutation = useMutation({
    mutationFn: (friendUser) => base44.functions.invoke('manageFriendship', {
      friendId: friendUser.id,
      action: 'add'
    }),
    onSuccess: (_, friendUser) => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['friends', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['friendUsers'] });
      // Add to local pending list so it appears in friends modal immediately
      setPendingOutgoing(prev => [...prev.filter(p => p.id !== friendUser.id), friendUser]);
      toast.success('Friend request sent!');
      setShowAddModal(false);
      setShowFriendsModal(true);
      setSearchQuery('');
    },
    onError: () => {
      toast.error('Failed to send friend request');
    }
  });

  const acceptFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', {
      friendId,
      action: 'accept'
    }),
    onMutate: async (friendId) => {
      await queryClient.cancelQueries({ queryKey: ['friendRequests', currentUser?.id] });
      const previous = queryClient.getQueryData(['friendRequests', currentUser?.id]);
      queryClient.setQueryData(['friendRequests', currentUser?.id], (old = []) =>
        old.filter((r) => r.user_id !== friendId)
      );
      return { previous };
    },
    onError: (err, friendId, context) => {
      queryClient.setQueryData(['friendRequests', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['friends', currentUser?.id] });
      toast.success('Friend request accepted!');
    }
  });

  const rejectFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', {
      friendId,
      action: 'reject'
    }),
    onMutate: async (friendId) => {
      await queryClient.cancelQueries({ queryKey: ['friendRequests', currentUser?.id] });
      const previous = queryClient.getQueryData(['friendRequests', currentUser?.id]);
      queryClient.setQueryData(['friendRequests', currentUser?.id], (old = []) =>
        old.filter((r) => r.user_id !== friendId)
      );
      return { previous };
    },
    onError: (err, friendId, context) => {
      queryClient.setQueryData(['friendRequests', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', currentUser?.id] });
      toast.success('Friend request declined');
    }
  });

  const removeFriendMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('manageFriendship', {
      friendId,
      action: 'remove'
    }),
    onMutate: async (friendId) => {
      await queryClient.cancelQueries({ queryKey: ['friends', currentUser?.id] });
      const previous = queryClient.getQueryData(['friends', currentUser?.id]);
      queryClient.setQueryData(['friends', currentUser?.id], (old = []) =>
        old.filter((f) => f.friend_id !== friendId)
      );
      return { previous };
    },
    onError: (err, friendId, context) => {
      queryClient.setQueryData(['friends', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', currentUser?.id] });
      toast.success('Friend removed');
    }
  });

  const calculateStreak = (checkIns) => {
    if (checkIns.length === 0) return 0;

    const today = startOfDay(new Date());
    const lastCheckInDate = startOfDay(new Date(checkIns[0].check_in_date));
    const daysSinceLastCheckIn = differenceInDays(today, lastCheckInDate);

    if (daysSinceLastCheckIn > 1) return 0;

    let streak = 1;

    for (let i = 0; i < checkIns.length - 1; i++) {
      const current = startOfDay(new Date(checkIns[i].check_in_date));
      const next = startOfDay(new Date(checkIns[i + 1].check_in_date));
      const daysDiff = differenceInDays(current, next);

      if (daysDiff === 1 || daysDiff === 2) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const { data: searchResults = [] } = useQuery({
    queryKey: ['searchUsers', searchQuery],
    queryFn: () => base44.functions.invoke('searchUsers', { query: searchQuery, limit: 5 }).then((res) => res.data.users || []),
    enabled: searchQuery.length >= 2,
    staleTime: 30000
  });

  const outgoingPendingIds = pendingOutgoing.map(p => p.id);
  const filteredSearchResults = searchResults.filter(
    (user) => !friendIds.includes(user.id) && !outgoingPendingIds.includes(user.id)
  );

  const getFriendActivity = (friendId) => {
    const friendCheckIns = allCheckIns.filter((c) => c.user_id === friendId);
    const friendStreak = calculateStreak(friendCheckIns);
    const lastCheckIn = friendCheckIns.length > 0 ? friendCheckIns[0] : null;
    const daysSinceCheckIn = lastCheckIn ? differenceInDays(new Date(), new Date(lastCheckIn.check_in_date)) : null;

    return {
      checkIns: friendCheckIns,
      streak: friendStreak,
      lastCheckIn,
      daysSinceCheckIn,
      totalCheckIns: friendCheckIns.length
    };
  };

  const friendsWithActivity = friends.map((friend) => ({
    ...friend,
    activity: getFriendActivity(friend.friend_id)
  })).sort((a, b) => {
    if (a.activity.daysSinceCheckIn === 0 && b.activity.daysSinceCheckIn !== 0) return -1;
    if (a.activity.daysSinceCheckIn !== 0 && b.activity.daysSinceCheckIn === 0) return 1;
    return (b.activity.streak || 0) - (a.activity.streak || 0);
  });

  // ── CHANGED: also include current user's own posts in the feed ──
  const friendPosts = allPosts.filter((post) =>
    (friendIds.includes(post.member_id) || post.member_id === currentUser?.id) && (
      post.content || post.image_url || post.video_url || post.workout_name) &&
    !post.gym_join
  );

  const createActivityFeed = () => {
    const activities = [];

    const recentCheckIns = allCheckIns.filter((checkIn) => {
      const daysSince = differenceInDays(new Date(), new Date(checkIn.check_in_date));
      return daysSince <= 7 && friendIds.includes(checkIn.user_id);
    });



    const friendPRs = allLifts.filter((lift) =>
      lift.is_pr && friendIds.includes(lift.member_id)
    );

    friendPRs.forEach((lift) => {
      const friend = friends.find((f) => f.friend_id === lift.member_id);
      const daysSince = differenceInDays(new Date(), new Date(lift.created_date));

      if (daysSince <= 7) {
        const exerciseNames = {
          bench_press: 'Bench Press',
          squat: 'Squat',
          deadlift: 'Deadlift',
          overhead_press: 'Overhead Press',
          barbell_row: 'Barbell Row',
          power_clean: 'Power Clean'
        };

        activities.push({
          id: `pr-${lift.id}`,
          type: 'pr',
          friendId: lift.member_id,
          friendName: friend?.friend_name || lift.member_name,
          friendAvatar: friend?.friend_avatar,
          message: `hit a new PR: ${lift.weight_lbs}lbs ${exerciseNames[lift.exercise] || lift.exercise}`,
          timestamp: new Date(lift.created_date),
          emoji: '🏆',
          weight: lift.weight_lbs,
          exercise: lift.exercise
        });
      }
    });

    notifications.forEach((notification) => {
      const daysSince = differenceInDays(new Date(), new Date(notification.created_date));
      const text = (notification.message || notification.title || '').toLowerCase();
      const isFriendRequestNotif = text.includes('accepted') || text.includes('friend request');
      const isGymRequestNotif = text.includes('official') || text.includes('gym request');
      if (daysSince <= 7 && !isFriendRequestNotif && !isGymRequestNotif) {
        activities.push({
          id: `notification-${notification.id}`,
          type: 'notification',
          message: notification.message || notification.title,
          timestamp: new Date(notification.created_date)
        });
      }
    });

    return activities.sort((a, b) => b.timestamp - a.timestamp);
  };

  const activityFeed = useMemo(() => createActivityFeed(), [allCheckIns, allLifts, notifications, friends, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateActivityCards = () => {
    const cards = [];

    const lastCheckIn = currentUserCheckIns.length > 0 ? currentUserCheckIns[0] : null;
    const daysSinceLastCheckIn = lastCheckIn ? differenceInDays(new Date(), new Date(lastCheckIn.check_in_date)) : null;

    if (daysSinceLastCheckIn && daysSinceLastCheckIn >= 3) {
      cards.push({
        id: 'nudge-checkin',
        type: 'nudge',
        title: 'Time to Check In',
        message: `You haven't checked in in ${daysSinceLastCheckIn} days. Let's get back on track! 💪`,
        emoji: '⏰',
        color: 'from-orange-500 to-red-500',
        borderColor: 'border-orange-500/30'
      });
    }



    friendsWithActivity.forEach((friend) => {
      if (friend.activity.daysSinceCheckIn >= 7) {
        cards.push({
          id: `inactive-${friend.friend_id}`,
          type: 'friend-inactive',
          title: `${friend.friend_name} Needs a Nudge`,
          message: `${friend.friend_name} hasn't checked in for ${friend.activity.daysSinceCheckIn} days. Send them some motivation! 👋`,
          emoji: '👋',
          color: 'from-slate-500 to-slate-600',
          borderColor: 'border-slate-500/30'
        });
      }
    });

    if (lastCheckIn && daysSinceLastCheckIn === 1) {
      cards.push({
        id: 'streak-danger',
        type: 'streak-warning',
        title: 'Your Streak is at Risk!',
        message: 'You have until midnight to check in and keep your streak alive! ⚠️',
        emoji: '⚠️',
        color: 'from-red-600 to-orange-600',
        borderColor: 'border-red-500/30'
      });
    }

    return cards;
  };

  const activityCards = generateActivityCards();

  const filteredActivityFeed = activityFeed;
  const filteredActivityCards = activityCards.filter((card) => !dismissedCardIds.has(card.id));

  const getCardAccentConfig = (card) => {
    const configs = {
      'nudge':           { bg: '#1e293b', border: '#334155', bottomBorder: '#0f172a', icon: '⏰', dot: '#f97316' },
      'friend-milestone':{ bg: '#1e293b', border: '#334155', bottomBorder: '#0f172a', icon: card.emoji || '🔥', dot: '#facc15' },
      'friend-inactive': { bg: '#1e293b', border: '#334155', bottomBorder: '#0f172a', icon: '👋',  dot: '#94a3b8' },
      'streak-warning':  { bg: '#2d1515', border: '#7f1d1d', bottomBorder: '#450a0a', icon: '⚠️', dot: '#ef4444' },
    };
    return configs[card.type] || configs['nudge'];
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex flex-col">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-slate-800/40 to-transparent backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
        <div className="max-w-6xl mx-auto relative flex items-center justify-center">
          <Link to={createPageUrl('Home')} className="absolute left-0">
            <button className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-base font-semibold tracking-tight text-slate-100 whitespace-nowrap">
            Friend Activity
          </h1>
          <button
            onClick={() => setShowFriendsModal(true)}
            className="absolute right-0 inline-flex items-center gap-3 whitespace-nowrap px-3 py-2 rounded-lg bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white font-bold border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu"
          >
            <span className="text-[11px] font-semibold">{friends.length}</span>
            <span className="text-[11px] font-medium">Friends</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-6">

        {/* Activity Nudge Cards */}
        {filteredActivityCards.length > 0 && (
          <div className="space-y-3 mb-6">
            {filteredActivityCards.map((card) => {
              const cfg = getCardAccentConfig(card);
              return (
                <div
                  key={card.id}
                  data-activity-id={card.id}
                  style={{
                    background: cfg.bg,
                    border: `1.5px solid ${cfg.border}`,
                    borderBottom: `4px solid ${cfg.bottomBorder}`,
                    borderRadius: '16px',
                  }}
                  className="relative overflow-hidden"
                >
                  <button
                    onClick={() => {
                      const updated = new Set(dismissedCardIds).add(card.id);
                      setDismissedCardIds(updated);
                      localStorage.setItem('friendsFeedDismissedCards', JSON.stringify(Array.from(updated)));
                    }}
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all duration-150 z-10 text-[10px] font-bold"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>

                  <div className="px-4 py-4 flex items-center gap-4">
                    <span className="text-3xl select-none flex-shrink-0 leading-none">{cfg.icon}</span>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-extrabold text-white text-[14px] leading-tight tracking-tight">
                        {card.title}
                      </p>
                      <p className="text-[12px] text-slate-400 mt-1 leading-snug font-medium">
                        {card.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Activity Feed */}
        {filteredActivityFeed.length > 0 && (
          <div className="space-y-3">
            {filteredActivityFeed.map((activity) =>
              activity.type === 'notification' ? (
                <Card
                  key={activity.id}
                  data-activity-id={activity.id}
                  className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 overflow-hidden rounded-xl shadow-2xl shadow-black/20"
                >
                  <div className="p-3">
                    <p className="text-xs text-white leading-tight">
                      {activity.message}
                    </p>
                  </div>
                </Card>
              ) : (
                <Card
                  key={activity.id}
                  data-activity-id={activity.id}
                  className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 overflow-hidden hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 rounded-xl shadow-2xl shadow-black/20"
                >
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      <Link
                        to={createPageUrl('UserProfile') + `?id=${activity.friendId}`}
                        className="flex-shrink-0"
                      >
                        {activity.friendAvatar ? (
                          <img
                            src={activity.friendAvatar}
                            alt={activity.friendName}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30 hover:ring-blue-500 transition-all"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center ring-2 ring-blue-500/30 hover:ring-blue-500 transition-all">
                            <span className="text-white font-bold text-sm">
                              {activity.friendName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white leading-tight">
                          <span className="font-semibold">{activity.friendName}</span>
                          {' '}
                          <span className="text-slate-300">{activity.message}</span>
                          {activity.emoji && <span className="ml-1">{activity.emoji}</span>}
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500">
                            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                          </span>

                          {activity.type === 'milestone' && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-1.5 py-0">
                              🔥 {activity.milestone} days
                            </Badge>
                          )}

                          {activity.type === 'pr' && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] px-1.5 py-0">
                              🏆 PR
                            </Badge>
                          )}

                          {activity.type === 'checkin' && activity.gymName && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] px-1.5 py-0">
                              {activity.gymName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            )}
          </div>
        )}

        {/* Friend Posts (including your own) */}
        {friendPosts.length > 0 && (
          <div className="space-y-3 mt-0">
            {friendPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                fullWidth={true}
                currentUser={currentUser}
                isOwnProfile={post.member_id === currentUser?.id}
                onLike={() => {}}
                onComment={() => {}}
                onSave={() => {}}
                onDelete={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
              />
            ))}
          </div>
        )}

        {/* Friends Modal */}
        {showFriendsModal && (
          <>
            <div
              className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setShowFriendsModal(false)}
            />
            <div className="fixed left-1/2 -translate-x-1/2 top-12 w-11/12 max-w-2xl h-1/2 z-[9999] flex flex-col bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white">
              <div className="px-3 py-1 flex items-center gap-1">
                <div className="relative flex-1 w-70">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    placeholder="Search by username..."
                    value={friendsSearchQuery}
                    onChange={(e) => setFriendsSearchQuery(e.target.value)}
                    className="relative top-0.5 shadow-sm focus-visible:ring-1 focus-visible:ring-ring flex w-full px-3 py-1 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 pl-8 bg-white/10 border border-white/20 hover:border-white/40 focus-visible:outline-none focus-visible:border-blue-400 focus-visible:bg-white/15 text-white placeholder:text-slate-300 rounded-xl text-sm h-9 transition-all duration-200"
                  />
                </div>
                <Button
                  onClick={() => {
                    setShowAddModal(true);
                    setShowFriendsModal(false);
                  }}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold transition-all duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent rounded-lg h-8 w-8 p-0 flex-shrink-0 shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                {/* Outgoing pending requests at top */}
                {pendingOutgoing.map((pending) => (
                  <div key={`pending-${pending.id}`}
                    className="p-3 rounded-xl flex items-center gap-3 relative bg-slate-700/40 hover:bg-slate-700/60 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600/40 to-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-blue-500/30">
                      {pending.avatar_url
                        ? <img src={pending.avatar_url} alt={pending.full_name} className="w-full h-full object-cover" loading="lazy" />
                        : <span className="text-xs font-bold text-blue-300">{pending.full_name?.charAt(0)?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0 ml-1">
                      <p className="font-semibold text-white text-sm truncate">{pending.full_name}</p>
                      {pending.username && <p className="text-[10px] text-slate-400">@{pending.username}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                      <span
                        style={{
                          background: 'rgba(59,130,246,0.15)',
                          border: '1px solid rgba(59,130,246,0.3)',
                        }}
                        className="text-[10px] font-bold text-blue-300 px-2.5 py-1.5 rounded-lg"
                      >Pending</span>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenPendingMenuId(openPendingMenuId === pending.id ? null : pending.id);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-all duration-150"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openPendingMenuId === pending.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(10,15,30,1) 100%)',
                              border: '1px solid rgba(71,85,105,0.5)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                            }}
                            className="absolute right-0 top-8 z-50 rounded-xl overflow-hidden min-w-[110px]"
                          >
                            <button
                              onClick={() => cancelFriendMutation.mutate(pending.id)}
                              disabled={cancelFriendMutation.isPending}
                              className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-all duration-150 text-xs font-semibold disabled:opacity-50"
                            >
                              <UserMinus className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Incoming friend requests */}
                {friendRequests
                  .filter((req) => {
                    const displayName = req.user_name || req.friend_name || '';
                    return displayName.toLowerCase().includes(friendsSearchQuery.toLowerCase());
                  })
                  .map((request) => {
                    const displayName = request.user_name || request.friend_name || 'Unknown';
                    const avatarUrl = request.user_avatar;
                    return (
                      <div
                        key={request.id}
                        className="p-3 rounded-xl flex items-center justify-between gap-3 border"
                        style={{
                          background: 'linear-gradient(135deg, rgba(30,58,138,0.35) 0%, rgba(16,19,40,0.9) 100%)',
                          border: '1px solid rgba(59,130,246,0.3)',
                          borderBottom: '3px solid rgba(29,78,216,0.5)',
                          boxShadow: '0 2px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-blue-500/40">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <span className="text-sm font-bold text-white">{displayName?.charAt(0)?.toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm truncate leading-tight">{displayName}</p>
                            <p className="text-[11px] text-blue-300 font-medium mt-0.5">Wants to be your friend</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => acceptFriendMutation.mutate(request.user_id)}
                            disabled={acceptFriendMutation.isPending}
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white disabled:opacity-50 transition-all duration-100 transform-gpu active:translate-y-[3px] active:shadow-none"
                            style={{
                              background: 'linear-gradient(to bottom, #22c55e, #16a34a, #15803d)',
                              border: '1px solid transparent',
                              borderBottom: '3px solid #14532d',
                              boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(34,197,94,0.3)',
                            }}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => rejectFriendMutation.mutate(request.user_id)}
                            disabled={rejectFriendMutation.isPending}
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white disabled:opacity-50 transition-all duration-100 transform-gpu active:translate-y-[3px] active:shadow-none"
                            style={{
                              background: 'linear-gradient(to bottom, #ef4444, #dc2626, #b91c1c)',
                              border: '1px solid transparent',
                              borderBottom: '3px solid #7f1d1d',
                              boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(239,68,68,0.3)',
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {friends.length === 0 && friendRequests.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">No friends yet</p>
                ) : (
                  friendsWithActivity
                    .filter((friend) => {
                      const friendUser = allUsers.find((u) => u.id === friend.friend_id);
                      const displayName = friendUser?.full_name || friend.friend_name;
                      return displayName.toLowerCase().includes(friendsSearchQuery.toLowerCase());
                    })
                    .map((friend) => {
                      const { activity } = friend;
                      const friendUser = allUsers.find((u) => u.id === friend.friend_id);
                      const currentName = friendUser?.full_name || friend.friend_name;
                      return (
                        <div
                          key={friend.id}
                          className="p-2 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 transition-colors flex items-start justify-between gap-2"
                        >
                          <Link
                            to={createPageUrl('UserProfile') + `?id=${friend.friend_id}`}
                            className="flex items-center gap-2 flex-1 min-w-0"
                            onClick={() => setShowFriendsModal(false)}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {(() => {
                                const fu = allUsers.find((u) => u.id === friend.friend_id);
                                return fu?.avatar_url ? (
                                  <img src={fu.avatar_url} alt={currentName} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <span className="text-xs font-semibold text-white">
                                    {currentName?.charAt(0)?.toUpperCase()}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-xs truncate">{currentName}</p>
                            </div>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFriendMutation.mutate(friend.friend_id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-7 w-7 flex-shrink-0"
                          >
                            <UserMinus className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </>
        )}

        {/* Add Friend Modal */}
        {showAddModal && (
          <>
            <div
              className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => {
                setShowAddModal(false);
                setSearchQuery('');
              }}
            />
            <Card className="fixed left-1/2 -translate-x-1/2 top-12 w-11/12 max-w-2xl h-1/2 z-[9999] flex flex-col bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white overflow-hidden">
              <div className="px-3 py-1 flex items-center gap-1">
                <div className="relative flex-1 w-70">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-[calc(50%-2.5px)] w-3.5 h-3.5 text-slate-400" />
                  <Input
                    placeholder="Search by @username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="relative top-1 shadow-sm focus-visible:ring-1 focus-visible:ring-ring flex w-full px-3 py-1 pl-8 bg-white/10 border border-white/20 hover:border-white/40 focus-visible:outline-none focus-visible:border-blue-400 focus-visible:bg-white/15 text-white placeholder:text-slate-300 rounded-xl text-base md:text-sm h-9 transition-all duration-200"
                  />
                </div>
                <button
                   onClick={() => {
                     setShowAddModal(false);
                     setSearchQuery('');
                   }}
                   className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors flex-shrink-0"
                 >
                   <ChevronDown className="w-5 h-5 -rotate-90" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                {searchQuery.length >= 2 && (
                  filteredSearchResults.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-8">No users found</p>
                  ) : (
                    filteredSearchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover rounded-lg" loading="lazy" />
                            ) : (
                              <span className="text-sm font-semibold text-white">
                                {user.full_name?.charAt(0)?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">{user.full_name}</div>
                            {user.username && (
                              <div className="text-xs text-slate-400">@{user.username}</div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => addFriendMutation.mutate(user)}
                          disabled={addFriendMutation.isPending}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-semibold border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu disabled:opacity-50 text-sm"
                        >
                          <UserPlus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    ))
                  )
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}