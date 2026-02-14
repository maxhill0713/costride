import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Flame, CheckCircle, Trophy, TrendingUp, UserPlus, Search, UserMinus, X, ChevronDown, ChevronLeft } from 'lucide-react';
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
    queryFn: () => base44.auth.me()
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ 
      user_id: currentUser.id, 
      status: 'accepted' 
    }),
    enabled: !!currentUser
  });

  const { data: friendRequests = [] } = useQuery({
    queryKey: ['friendRequests', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ 
      friend_id: currentUser.id, 
      status: 'pending' 
    }),
    enabled: !!currentUser
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: showAddModal
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list('-check_in_date'),
    staleTime: 60000,
    cacheTime: 300000
  });

  const { data: currentUserCheckIns = [] } = useQuery({
    queryKey: ['userCheckIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date'),
    enabled: !!currentUser
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 50),
    enabled: !!currentUser && !!friends.length,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000
  });



  const { data: allLifts = [] } = useQuery({
    queryKey: ['lifts'],
    queryFn: () => base44.entities.Lift.list('-created_date', 100),
    enabled: !!currentUser,
    staleTime: 60000,
    cacheTime: 300000
  });

  const { data: allGymMembers = [] } = useQuery({
    queryKey: ['gymMembers'],
    queryFn: () => base44.entities.GymMember.list(),
    staleTime: 60000,
    cacheTime: 300000
  });

  const addFriendMutation = useMutation({
    mutationFn: async (friendUser) => {
      await base44.entities.Friend.create({
        user_id: currentUser.id,
        friend_id: friendUser.id,
        friend_name: friendUser.full_name,
        friend_avatar: friendUser.avatar_url,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['friends']);
      toast.success('Friend request sent!');
      setShowAddModal(false);
      setSearchQuery('');
    }
  });

  const acceptFriendMutation = useMutation({
    mutationFn: async (requestId, requesterData) => {
      const request = await base44.entities.Friend.update(requestId, { status: 'accepted' });
      await base44.entities.Friend.create({
        user_id: currentUser.id,
        friend_id: requesterData.user_id,
        friend_name: requesterData.user_name || requesterData.friend_name,
        friend_avatar: requesterData.friend_avatar,
        status: 'accepted'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['friendRequests']);
      queryClient.invalidateQueries(['friends']);
      toast.success('Friend request accepted!');
    }
  });

  const rejectFriendMutation = useMutation({
    mutationFn: async (requestId) => {
      await base44.entities.Friend.delete(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['friendRequests']);
      toast.success('Friend request declined');
    }
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendId) => {
      const friendships = await base44.entities.Friend.filter({
        user_id: currentUser.id,
        friend_id: friendId
      });
      if (friendships.length > 0) {
        await base44.entities.Friend.delete(friendships[0].id);
      }
      const reverseFriendships = await base44.entities.Friend.filter({
        user_id: friendId,
        friend_id: currentUser.id
      });
      if (reverseFriendships.length > 0) {
        await base44.entities.Friend.delete(reverseFriendships[0].id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['friends']);
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

  const friendIds = friends.map(f => f.friend_id);
  const searchResults = allUsers.filter(user => 
    user.id !== currentUser?.id &&
    !friendIds.includes(user.id) &&
    (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5);

  const getFriendActivity = (friendId) => {
    const friendCheckIns = allCheckIns.filter(c => c.user_id === friendId);
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

  const friendsWithActivity = friends.map(friend => ({
    ...friend,
    activity: getFriendActivity(friend.friend_id)
  })).sort((a, b) => {
    if (a.activity.daysSinceCheckIn === 0 && b.activity.daysSinceCheckIn !== 0) return -1;
    if (a.activity.daysSinceCheckIn !== 0 && b.activity.daysSinceCheckIn === 0) return 1;
    return (b.activity.streak || 0) - (a.activity.streak || 0);
  });

  // Only include actual user-created posts (with content, images, or videos)
  const friendPosts = allPosts.filter(post => 
    friendIds.includes(post.member_id) && 
    (post.content || post.image_url || post.video_url)
  );

  // Create unified activity feed
  const createActivityFeed = () => {
    const activities = [];

    // Add check-ins (last 7 days)
    const recentCheckIns = allCheckIns.filter(checkIn => {
      const daysSince = differenceInDays(new Date(), new Date(checkIn.check_in_date));
      return daysSince <= 7 && friendIds.includes(checkIn.user_id);
    });

    recentCheckIns.forEach(checkIn => {
      const friend = friends.find(f => f.friend_id === checkIn.user_id);
      const isToday = differenceInDays(new Date(), new Date(checkIn.check_in_date)) === 0;
      
      activities.push({
        id: `checkin-${checkIn.id}`,
        type: 'checkin',
        friendId: checkIn.user_id,
        friendName: friend?.friend_name || checkIn.user_name,
        friendAvatar: friend?.friend_avatar,
        message: isToday ? 'checked in today' : `checked in at ${checkIn.gym_name}`,
        timestamp: new Date(checkIn.check_in_date),
        emoji: '💪',
        gymName: checkIn.gym_name
      });
    });

    // Add streak milestones
    friendIds.forEach(friendId => {
      const friendCheckIns = allCheckIns.filter(c => c.user_id === friendId);
      const streak = calculateStreak(friendCheckIns);
      const friend = friends.find(f => f.friend_id === friendId);
      
      // Check if they recently hit a milestone (7, 14, 30, 50, 100 days)
      const milestones = [7, 14, 30, 50, 100];
      milestones.forEach(milestone => {
        if (streak >= milestone) {
          // Use the date when they hit this milestone (approximate)
          const milestoneDate = friendCheckIns[Math.min(milestone - 1, friendCheckIns.length - 1)]?.check_in_date;
          if (milestoneDate) {
            const daysSinceMilestone = differenceInDays(new Date(), new Date(milestoneDate));
            // Only show if milestone was hit in last 7 days
            if (daysSinceMilestone <= 7) {
              activities.push({
                id: `milestone-${friendId}-${milestone}`,
                type: 'milestone',
                friendId,
                friendName: friend?.friend_name,
                friendAvatar: friend?.friend_avatar,
                message: `reached a ${milestone}-day streak!`,
                timestamp: new Date(milestoneDate),
                emoji: milestone >= 50 ? '🔥' : milestone >= 30 ? '⚡' : '🎯',
                milestone
              });
            }
          }
        }
      });
    });

    // Add PR lifts
    const friendPRs = allLifts.filter(lift => 
      lift.is_pr && friendIds.includes(lift.member_id)
    );

    friendPRs.forEach(lift => {
      const friend = friends.find(f => f.friend_id === lift.member_id);
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

    // Add notifications
    notifications.forEach(notification => {
      const daysSince = differenceInDays(new Date(), new Date(notification.created_date));
      if (daysSince <= 7) {
        activities.push({
          id: `notification-${notification.id}`,
          type: 'notification',
          message: notification.message || notification.title,
          timestamp: new Date(notification.created_date)
        });
      }
    });



    // Sort by most recent first
    return activities.sort((a, b) => b.timestamp - a.timestamp);
  };

  const activityFeed = createActivityFeed();

  // Generate activity cards/nudges
  const generateActivityCards = () => {
    const cards = [];

    // Check if current user hasn't checked in recently
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

    // Friend milestones
    friendsWithActivity.forEach(friend => {
      if (friend.activity.streak === 7) {
        cards.push({
          id: `milestone-${friend.friend_id}-7`,
          type: 'friend-milestone',
          title: `${friend.friend_name} Hit a Streak!`,
          message: `${friend.friend_name} is on a 7-day check-in streak! 🔥`,
          emoji: '🔥',
          color: 'from-red-500 to-orange-500',
          borderColor: 'border-red-500/30'
        });
      } else if (friend.activity.streak === 14) {
        cards.push({
          id: `milestone-${friend.friend_id}-14`,
          type: 'friend-milestone',
          title: `${friend.friend_name} is On Fire!`,
          message: `${friend.friend_name} just hit a 14-day streak! ⚡`,
          emoji: '⚡',
          color: 'from-yellow-500 to-orange-500',
          borderColor: 'border-yellow-500/30'
        });
      } else if (friend.activity.streak === 30) {
        cards.push({
          id: `milestone-${friend.friend_id}-30`,
          type: 'friend-milestone',
          title: `${friend.friend_name} is a Beast!`,
          message: `${friend.friend_name} hit a 30-day streak! That's legendary! 🏆`,
          emoji: '🏆',
          color: 'from-purple-500 to-pink-500',
          borderColor: 'border-purple-500/30'
        });
      }
    });

    // Inactive friends warning
    friendsWithActivity.forEach(friend => {
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

    // Streak freeze warning
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

  // Filter out dismissed cards (keep activity feed items for 30 minutes)
  const isItemExpired = (timestamp) => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return new Date(timestamp) < thirtyMinutesAgo;
  };

  // Filter out dismissed cards, keep posts for 30 minutes
  const filteredActivityFeed = activityFeed.filter((item) => !isItemExpired(item.timestamp));
  const filteredActivityCards = activityCards.filter((card) => !dismissedCardIds.has(card.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-800/40 to-transparent backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
        <div className="max-w-6xl mx-auto relative flex items-center justify-center">
          <Link to={createPageUrl('Home')} className="absolute left-0">
            <button className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold tracking-tight text-slate-100 whitespace-nowrap">
            Friend Activity
          </h1>
          <button
            onClick={() => setShowFriendsModal(true)}
            className="absolute right-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 backdrop-blur-md border border-slate-600/40 hover:bg-slate-700/70 hover:border-slate-500/60 transition-all text-white shadow-lg shadow-black/30"
          >
            <span className="text-xs font-semibold">{friends.length}</span>
            <span className="text-xs font-medium">Friends</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
         {/* Activity Nudge Cards */}
         {filteredActivityCards.length > 0 && (
           <div className="space-y-3 mb-6">
             {filteredActivityCards.map(card => (
               <Card
                 key={card.id}
                 data-activity-id={card.id}
                 className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 overflow-hidden rounded-2xl hover:shadow-lg hover:shadow-blue-500/20 transition-all shadow-2xl shadow-black/20 relative"
               >
                  <button
                    onClick={() => {
                      const updated = new Set(dismissedCardIds).add(card.id);
                      setDismissedCardIds(updated);
                      localStorage.setItem('friendsFeedDismissedCards', JSON.stringify(Array.from(updated)));
                    }}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                 <div className="p-4">
                   <div className="flex items-start gap-3">
                     {/* Icon */}
                     <div className="flex-shrink-0 text-2xl mt-0.5">
                       {card.emoji}
                     </div>

                     {/* Content */}
                     <div className="flex-1 min-w-0">
                       <h3 className="font-bold text-white text-sm">{card.title}</h3>
                       <p className="text-xs text-white/90 mt-0.5 leading-snug">{card.message}</p>
                     </div>
                   </div>
                 </div>
               </Card>
             ))}
           </div>
         )}

         {/* Activity Feed */}
         {filteredActivityFeed.length > 0 && (
         <div className="space-y-3">
           {filteredActivityFeed.map(activity => (
             activity.type === 'notification' ? (
               // Simple notification layout - just text
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
                     {/* Profile Photo */}
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

                     {/* Activity Content */}
                     <div className="flex-1 min-w-0">
                       <p className="text-xs text-white leading-tight">
                         <span className="font-semibold">{activity.friendName}</span>
                         {' '}
                         <span className="text-slate-300">{activity.message}</span>
                         {activity.emoji && <span className="ml-1">{activity.emoji}</span>}
                       </p>

                       {/* Timestamp and badges inline */}
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] text-slate-500">
                           {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                         </span>

                         {/* Milestone Badge */}
                         {activity.type === 'milestone' && (
                           <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-1.5 py-0">
                             🔥 {activity.milestone} days
                           </Badge>
                         )}

                         {/* PR Badge */}
                         {activity.type === 'pr' && (
                           <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] px-1.5 py-0">
                             🏆 PR
                           </Badge>
                         )}

                         {/* Check-in Badge */}
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
           ))}
         </div>
         )}

         {/* Friend Posts */}
         {friendPosts.length > 0 && (
           <div className="space-y-3 mt-0">
             {friendPosts.map((post) => (
               <PostCard 
                 key={post.id} 
                 post={post}
                 fullWidth={true}
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
            <div className="fixed inset-0 z-[999]" onClick={() => setShowFriendsModal(false)} />
            <div className="fixed left-1/2 -translate-x-1/2 top-16 w-11/12 max-w-2xl h-1/2 bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-[9999] flex flex-col">
              <div className="px-3 py-2 border-b border-slate-700/50 flex items-center gap-2">
                <div className="relative flex-1 w-70">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    placeholder="Search friends..."
                    value={friendsSearchQuery}
                    onChange={(e) => setFriendsSearchQuery(e.target.value)}
                    className="pl-8 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 rounded-lg text-sm h-8"
                  />
                </div>
                <Button
                  onClick={() => {
                    setShowAddModal(true);
                    setShowFriendsModal(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 w-8 p-0 flex-shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                {/* Friend Requests */}
                {friendRequests.filter(req => {
                  const requesterUser = allUsers.find(u => u.id === req.user_id);
                  const displayName = requesterUser?.full_name || req.friend_name || req.user_name || '';
                  return displayName.toLowerCase().includes(friendsSearchQuery.toLowerCase());
                }).map(request => {
                  const requesterUser = allUsers.find(u => u.id === request.user_id);
                  const currentName = requesterUser?.full_name || request.friend_name || request.user_name;
                  return (
                  <div
                    key={request.id}
                    className="p-2 rounded-lg bg-blue-700/40 hover:bg-blue-700/60 transition-colors flex items-start justify-between gap-2 border border-blue-500/30"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {(() => {
                          const gymMember = allGymMembers.find(m => m.id === request.user_id);
                          return gymMember?.avatar_url ? (
                            <img src={gymMember.avatar_url} alt={currentName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold text-white">
                              {currentName?.charAt(0)?.toUpperCase()}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-xs truncate">{currentName}</p>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] mt-1">
                          Request pending
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        onClick={() => acceptFriendMutation.mutate(request.id, request)}
                        className="bg-green-600 hover:bg-green-700 text-white h-7 w-7"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => rejectFriendMutation.mutate(request.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-7 w-7"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  );
                })}

                {/* Friends List */}
                {friends.length === 0 && friendRequests.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">No friends yet</p>
                ) : (
                  friendsWithActivity.filter(friend => {
                    const friendUser = allUsers.find(u => u.id === friend.friend_id);
                    const displayName = friendUser?.full_name || friend.friend_name;
                    return displayName.toLowerCase().includes(friendsSearchQuery.toLowerCase());
                  }).map(friend => {
                    const { activity } = friend;
                    const friendUser = allUsers.find(u => u.id === friend.friend_id);
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
                              const gymMember = allGymMembers.find(m => m.id === friend.friend_id);
                              return gymMember?.avatar_url ? (
                                <img src={gymMember.avatar_url} alt={currentName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-semibold text-white">
                                  {currentName?.charAt(0)?.toUpperCase()}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-xs truncate">{currentName}</p>
                            {activity.daysSinceCheckIn === 0 && (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/40 text-[10px] mt-1">
                                Checked in
                              </Badge>
                            )}
                            {activity.streak >= 7 && (
                              <div className="flex items-center gap-0.5 mt-0.5">
                                <Flame className="w-2 h-2 text-orange-400" />
                                <span className="text-[10px] text-orange-300">{activity.streak}d</span>
                              </div>
                            )}
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Add Friend</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowAddModal(false);
                    setSearchQuery('');
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {searchQuery.length < 2 ? (
                  <p className="text-center text-slate-400 text-sm py-8">
                    Type at least 2 characters to search
                  </p>
                ) : searchResults.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">
                    No users found
                  </p>
                ) : (
                  searchResults.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-sm font-semibold text-white">
                              {user.full_name?.charAt(0)?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{user.full_name}</div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addFriendMutation.mutate(user)}
                        disabled={addFriendMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}