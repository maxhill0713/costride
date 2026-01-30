import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Flame, CheckCircle, Trophy, TrendingUp, UserPlus, ArrowLeft, Search, UserMinus, X } from 'lucide-react';
import { formatDistanceToNow, differenceInDays, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function Friends() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
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

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: showAddModal
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list('-check_in_date')
  });

  const addFriendMutation = useMutation({
    mutationFn: async (friendUser) => {
      await base44.entities.Friend.create({
        user_id: currentUser.id,
        friend_id: friendUser.id,
        friend_name: friendUser.full_name,
        friend_avatar: friendUser.avatar_url,
        status: 'accepted'
      });
      await base44.entities.Friend.create({
        user_id: friendUser.id,
        friend_id: currentUser.id,
        friend_name: currentUser.full_name,
        friend_avatar: currentUser.avatar_url,
        status: 'accepted'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['friends']);
      toast.success('Friend added!');
      setShowAddModal(false);
      setSearchQuery('');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-800/40 to-transparent backdrop-blur-sm border-b border-slate-700/50 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link to={createPageUrl('Home')}>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold tracking-tight text-slate-100">
              Friends
            </h1>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Friends Activity */}
        <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Friends ({friends.length})
          </h2>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            size="sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Friend
          </Button>
        </div>

          {friends.length === 0 ? (
            <Card className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
              <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-200 mb-2">No Friends Yet</h3>
              <p className="text-sm text-slate-400 mb-4">
                Add friends to see their activity and stay motivated together
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {friendsWithActivity.map(friend => {
                const { activity } = friend;
                const isYourTurn = activity.daysSinceCheckIn === 0 && userCheckIns.length > 0 && differenceInDays(new Date(), new Date(userCheckIns[0].check_in_date)) > 0;
                
                return (
                  <Card 
                    key={friend.id} 
                    className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:border-blue-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden">
                          {friend.friend_avatar ? (
                            <img src={friend.friend_avatar} alt={friend.friend_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-semibold text-white">
                              {friend.friend_name?.charAt(0)?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-sm truncate">{friend.friend_name}</h4>
                          
                          {/* Activity Messages */}
                          {activity.daysSinceCheckIn === 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/40 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Checked in today
                              </Badge>
                              {isYourTurn && (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">
                                  Your turn! 🔥
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {activity.daysSinceCheckIn > 0 && activity.daysSinceCheckIn <= 2 && (
                            <p className="text-xs text-slate-400 mt-1">
                              Last check-in {formatDistanceToNow(new Date(activity.lastCheckIn.check_in_date), { addSuffix: true })}
                            </p>
                          )}
                          
                          {activity.daysSinceCheckIn > 2 && (
                            <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/40 text-xs mt-1">
                              Inactive for {activity.daysSinceCheckIn} days
                            </Badge>
                          )}
                          
                          {activity.streak >= 7 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Flame className="w-3 h-3 text-orange-400" />
                              <span className="text-xs text-orange-300 font-semibold">
                                {activity.streak} day streak!
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-slate-300">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-semibold">{activity.totalCheckIns}</span>
                          </div>
                          <p className="text-xs text-slate-400">check-ins</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFriendMutation.mutate(friend.friend_id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Friend Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6">
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