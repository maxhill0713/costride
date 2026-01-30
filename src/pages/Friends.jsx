import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Flame, CheckCircle, Trophy, TrendingUp, UserPlus, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow, differenceInDays, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Friends() {
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

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list('-check_in_date')
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

  const userCheckIns = allCheckIns.filter(c => c.user_id === currentUser?.id);
  const userStreak = calculateStreak(userCheckIns);

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
        {/* Your Stats */}
        <Card className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-3">Your Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-slate-300">Streak</span>
              </div>
              <div className="text-2xl font-bold text-orange-300">{userStreak}</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-xs text-slate-300">Check-ins</span>
              </div>
              <div className="text-2xl font-bold text-green-300">{userCheckIns.length}</div>
            </div>
          </div>
        </Card>

        {/* Friends Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Friend Activity
            </h2>
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

                      <div className="text-right">
                        <div className="flex items-center gap-1 text-slate-300">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-semibold">{activity.totalCheckIns}</span>
                        </div>
                        <p className="text-xs text-slate-400">check-ins</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}