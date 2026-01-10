import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, TrendingUp, Award, Calendar, Dumbbell, Target, Share2, MapPin, Edit2, Save, X, Plus, Bell, BellOff, Moon, Sun, Lock, Globe, Ruler, Flame, Trophy, AlertCircle, Gift, Building2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Progress } from '@/components/ui/progress';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import BadgesDisplay from '../components/profile/BadgesDisplay';
import StatusBadge from '../components/profile/StatusBadge';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ bio: '', gym_location: '', avatar_url: '' });
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [activeTab, setActiveTab] = useState('progress');
  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation({
    mutationFn: (settings) => base44.auth.updateMe(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Apply dark mode to document
  useEffect(() => {
    if (currentUser?.dark_mode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [currentUser?.dark_mode]);

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts'],
    queryFn: () => base44.entities.Lift.list('-created_date')
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser.id }),
    enabled: !!currentUser
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list('-check_in_date')
  });

  const { data: allRewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.Reward.list()
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser
  });

  const { data: allGyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list()
  });

  const claimRewardMutation = useMutation({
    mutationFn: ({ rewardId, userId, currentClaimed }) => 
      base44.entities.Reward.update(rewardId, {
        claimed_by: [...currentClaimed, userId]
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    }
  });

  const memberLifts = lifts.filter(l => l.member_name === currentUser?.full_name);
  const userCheckIns = checkIns.filter(c => c.user_id === currentUser?.id);

  // Get gyms user is a member of
  const memberGymIds = gymMemberships.map(m => m.gym_id);
  const memberGyms = allGyms.filter(g => memberGymIds.includes(g.id));
  
  // Filter rewards for gyms user is a member of
  const availableRewards = allRewards.filter(r => 
    r.active && memberGymIds.includes(r.gym_id)
  );

  // User check-in count for reward eligibility
  const userCheckInCount = userCheckIns.length;
  const hasClaimedReward = (reward) => reward.claimed_by?.includes(currentUser?.id);

  React.useEffect(() => {
    if (currentUser) {
      setEditData({
        bio: currentUser.bio || '',
        gym_location: currentUser.gym_location || '',
        avatar_url: currentUser.avatar_url || ''
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    await base44.auth.updateMe(editData);
    setIsEditing(false);
  };

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowAddGoal(false);
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const handleUpdateGoal = (goal, newValue, status) => {
    updateGoalMutation.mutate({
      id: goal.id,
      data: { current_value: newValue, status: status || goal.status }
    });
  };

  const handleToggleReminder = (goal) => {
    updateGoalMutation.mutate({
      id: goal.id,
      data: { reminder_enabled: !goal.reminder_enabled }
    });
  };

  const activeGoals = goals.filter(g => g.status === 'active');

  const currentStreak = currentUser?.current_streak || 0;
  const longestStreak = currentUser?.longest_streak || 0;
  const lastCheckIn = currentUser?.last_check_in_date;
  const daysSinceCheckIn = lastCheckIn ? Math.floor((new Date() - new Date(lastCheckIn)) / (1000 * 60 * 60 * 24)) : null;

  // Streak milestones
  const streakMilestones = [
    { days: 7, name: '7 Day Warrior', icon: '🔥', color: 'from-orange-400 to-red-500' },
    { days: 30, name: 'Monthly Master', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { days: 50, name: 'Unstoppable', icon: '💪', color: 'from-purple-400 to-pink-500' },
    { days: 100, name: 'Century Champion', icon: '👑', color: 'from-blue-400 to-cyan-500' },
    { days: 365, name: 'Year Legend', icon: '🏆', color: 'from-green-400 to-emerald-500' }
  ];

  const nextMilestone = streakMilestones.find(m => m.days > currentStreak) || streakMilestones[streakMilestones.length - 1];
  const streakProgress = (currentStreak / nextMilestone.days) * 100;
  const earnedBadges = streakMilestones.filter(m => longestStreak >= m.days);

  const stats = {
    totalLifts: memberLifts.length,
    personalRecords: memberLifts.filter(l => l.is_pr).length,
    totalWeight: memberLifts.reduce((sum, l) => sum + (l.weight_lbs * (l.reps || 1)), 0),
    bestLift: Math.max(...memberLifts.map(l => l.weight_lbs), 0),
    weekStreak: currentStreak
  };

  const getProgressData = () => {
    const last30Days = memberLifts
      .filter(l => l.exercise === 'bench_press')
      .slice(0, 10)
      .reverse()
      .map((l, i) => ({
        session: `S${i + 1}`,
        weight: l.weight_lbs
      }));
    return last30Days;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 px-4 pt-8 pb-24 shadow-xl">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-white/30">
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    {currentUser.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-white drop-shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-black">{currentUser.full_name}</h1>
                  <StatusBadge checkIns={userCheckIns} streak={currentStreak} size="lg" />
                </div>
                <p className="text-white/90 text-sm mt-1">{currentUser.email}</p>
              </div>
            </div>
            {!isEditing ? (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 rounded-full"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 rounded-full"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={handleSave}
                >
                  <Save className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>

          {/* Bio & Location */}
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-white text-sm font-medium mb-1 block">Bio</label>
                <Textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="bg-white/90 border-0 rounded-2xl text-gray-900"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-1 block">Gym Location</label>
                <Input
                  value={editData.gym_location}
                  onChange={(e) => setEditData({ ...editData, gym_location: e.target.value })}
                  placeholder="e.g. Iron Paradise, Manchester"
                  className="bg-white/90 border-0 rounded-2xl text-gray-900"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-1 block">Profile Photo URL</label>
                <Input
                  value={editData.avatar_url}
                  onChange={(e) => setEditData({ ...editData, avatar_url: e.target.value })}
                  placeholder="https://..."
                  className="bg-white/90 border-0 rounded-2xl text-gray-900"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {currentUser.bio && (
                <p className="text-white/90 text-sm leading-relaxed">{currentUser.bio}</p>
              )}
              {currentUser.gym_location && (
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{currentUser.gym_location}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Re-engagement Banner */}
      {daysSinceCheckIn !== null && daysSinceCheckIn >= 3 && currentStreak > 0 && (
        <div className="max-w-2xl mx-auto px-4 -mt-20 mb-4">
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 border-0 p-5 text-white shadow-2xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg mb-1">We Miss You! 🔥</h3>
                <p className="text-white/90 text-sm">
                  It's been {daysSinceCheckIn} days since your last check-in. Don't lose your {currentStreak}-day streak!
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
      <div className="max-w-2xl mx-auto px-4 -mt-16 mb-6">
        {/* Streak Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-cyan-600/30 p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-8 h-8 text-cyan-400" />
              <div>
                <p className="text-sm font-medium text-cyan-300">Current Streak</p>
                <p className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{currentStreak}</p>
                <p className="text-xs text-cyan-300">days</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-cyan-300 mb-1">
                <span>Next: {nextMilestone.name}</span>
                <span>{currentStreak}/{nextMilestone.days}</span>
              </div>
              <Progress value={streakProgress} className="h-2 bg-slate-600" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-purple-600/30 p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-purple-300">Longest Streak</p>
                <p className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{longestStreak}</p>
                <p className="text-xs text-purple-300">days ever</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Milestone Badges */}
        {earnedBadges.length > 0 && (
          <Card className="p-5 mb-4 bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-yellow-600/30 shadow-lg">
            <h3 className="font-semibold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Streak Milestones
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {earnedBadges.map((badge) => (
                <div key={badge.days} className={`p-3 rounded-2xl bg-gradient-to-br ${badge.color} text-white text-center`}>
                  <div className="text-3xl mb-1">{badge.icon}</div>
                  <p className="font-bold text-xs">{badge.name}</p>
                  <p className="text-xs opacity-90">{badge.days}d</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-5 text-center shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-3xl font-black bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent">{stats.totalLifts}</div>
            <div className="text-xs text-cyan-300 font-bold mt-2 uppercase tracking-wide">Workouts</div>
          </Card>
          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-5 text-center shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-3xl font-black bg-gradient-to-br from-orange-400 to-red-400 bg-clip-text text-transparent">{stats.personalRecords}</div>
            <div className="text-xs text-orange-300 font-bold mt-2 uppercase tracking-wide">PRs</div>
          </Card>
          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-5 text-center shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-3xl font-black bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.weekStreak}</div>
            <div className="text-xs text-purple-300 font-bold mt-2 uppercase tracking-wide">Day Streak</div>
          </Card>
        </div>

        {/* Share Weekly Summary */}
        <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-blue-600/40 p-4 mt-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent mb-1">Weekly Summary</h3>
              <p className="text-sm text-slate-300">
                {stats.totalLifts} workouts • {stats.personalRecords} PRs • {stats.weekStreak} day streak
              </p>
            </div>
            <Button 
              onClick={() => {
                const summary = `💪 My Week in Fitness:\n✅ ${stats.totalLifts} workouts completed\n🔥 ${stats.personalRecords} personal records\n⚡ ${stats.weekStreak} day streak\n🏋️ ${stats.totalWeight.toLocaleString()} lbs total lifted`;
                navigator.clipboard.writeText(summary);
                alert('Weekly summary copied to clipboard!');
              }}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl shadow-lg"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </Card>

        {/* Gym Memberships */}
        {memberGyms.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-5 mt-4 shadow-lg">
            <h3 className="font-semibold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Your Gym Memberships
            </h3>
            <div className="grid gap-3">
              {memberGyms.map((gym) => {
                const membership = gymMemberships.find(m => m.gym_id === gym.id);
                return (
                  <div 
                    key={gym.id} 
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-700/60 to-slate-800/60 rounded-2xl border border-blue-600/30 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                  >
                    {gym.image_url ? (
                      <img 
                        src={gym.image_url} 
                        alt={gym.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Dumbbell className="w-8 h-8 text-white" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-100">{gym.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/50 rounded-full font-medium capitalize">
                          {gym.type}
                        </span>
                        <span className="text-xs text-slate-400">• {gym.city}</span>
                      </div>
                      {membership?.membership_type && (
                        <p className="text-xs text-slate-400 mt-1 capitalize">
                          {membership.membership_type} membership
                        </p>
                      )}
                    </div>
                    
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6 bg-gradient-to-br from-slate-700/90 to-slate-800/90 backdrop-blur-sm border border-blue-600/30 p-1.5 rounded-2xl shadow-sm overflow-x-auto">
            <TabsTrigger value="progress" className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs md:text-sm whitespace-nowrap text-slate-400">
              Progress
            </TabsTrigger>
            <TabsTrigger value="rewards" className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs md:text-sm whitespace-nowrap text-slate-400">
              Rewards
            </TabsTrigger>
            <TabsTrigger value="badges" className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs md:text-sm whitespace-nowrap text-slate-400">
              Badges
            </TabsTrigger>
            <TabsTrigger value="achievements" className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs md:text-sm whitespace-nowrap text-slate-400">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs md:text-sm whitespace-nowrap text-slate-400">
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs md:text-sm whitespace-nowrap text-slate-400">
              <Settings className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-5 shadow-lg">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Bench Press Progress
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={getProgressData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="session" stroke="#9CA3AF" style={{ fontSize: 12 }} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#A855F7" strokeWidth={3} dot={{ fill: '#A855F7', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  My Goals
                </h3>
                <Button
                  onClick={() => setShowAddGoal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Goal
                </Button>
              </div>

              {activeGoals.length === 0 ? (
                <Card className="p-8 text-center border-2 border-dashed border-slate-600/50 bg-gradient-to-br from-slate-700/50 to-slate-800/50">
                  <Target className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-300 mb-2">No goals set yet</p>
                  <Button
                    onClick={() => setShowAddGoal(true)}
                    variant="outline"
                    size="sm"
                  >
                    Set Your First Goal
                  </Button>
                </Card>
              ) : (
                activeGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onUpdate={handleUpdateGoal}
                    onDelete={(id) => deleteGoalMutation.mutate(id)}
                    onToggleReminder={handleToggleReminder}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-purple-600/40 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">Your Rewards</h3>
                  <p className="text-sm text-slate-300">Claim exclusive rewards from your gyms</p>
                </div>
              </div>

              {availableRewards.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="w-16 h-16 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-300 mb-2">No rewards available yet</p>
                  <p className="text-sm text-slate-400">Join a gym to unlock exclusive rewards!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {availableRewards.map((reward) => {
                    const hasClaimed = hasClaimedReward(reward);
                    const meetsRequirement = (() => {
                      switch (reward.requirement) {
                        case 'check_ins_10':
                          return userCheckInCount >= 10;
                        case 'check_ins_50':
                          return userCheckInCount >= 50;
                        case 'streak_30':
                          return currentStreak >= 30;
                        case 'none':
                          return true;
                        case 'points':
                          return true; // simplified
                        default:
                          return false;
                      }
                    })();

                    return (
                      <Card key={reward.id} className={`p-5 border-2 transition-all ${
                        hasClaimed 
                          ? 'bg-gray-50 border-gray-200' 
                          : meetsRequirement 
                            ? 'bg-white border-purple-200 hover:shadow-lg' 
                            : 'bg-white border-gray-200 opacity-60'
                      }`}>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">{reward.icon || '🎁'}</div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900">{reward.title}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{reward.gym_name}</p>
                              </div>
                              {reward.value && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                  {reward.value}
                                </span>
                              )}
                            </div>
                            
                            {reward.description && (
                              <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full capitalize">
                                  {reward.requirement.replace(/_/g, ' ')}
                                </span>
                                <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full capitalize">
                                  {reward.type.replace(/_/g, ' ')}
                                </span>
                              </div>
                              
                              {hasClaimed ? (
                                <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                                  ✓ Claimed
                                </span>
                              ) : !meetsRequirement ? (
                                <span className="text-xs text-gray-500 font-medium">
                                  🔒 Locked
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => claimRewardMutation.mutate({
                                    rewardId: reward.id,
                                    userId: currentUser.id,
                                    currentClaimed: reward.claimed_by || []
                                  })}
                                  disabled={claimRewardMutation.isPending}
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl"
                                >
                                  Claim Now
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Stats */}
            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-5 shadow-lg">
              <h4 className="font-semibold bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent mb-4">Your Progress</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Total Check-ins</span>
                  <span className="font-bold text-slate-100">{userCheckInCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Current Streak</span>
                  <span className="font-bold text-slate-100">{currentStreak} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Gyms Joined</span>
                  <span className="font-bold text-slate-100">{gymMemberships.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Rewards Claimed</span>
                  <span className="font-bold text-slate-100">
                    {allRewards.filter(r => r.claimed_by?.includes(currentUser?.id)).length}
                  </span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <BadgesDisplay user={currentUser} />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {[
              { icon: Award, title: '100 Workouts', desc: 'Completed 100 training sessions', color: 'from-yellow-400 to-orange-500', unlocked: true },
              { icon: TrendingUp, title: 'PR Crusher', desc: 'Set 10 personal records', color: 'from-red-400 to-pink-500', unlocked: true },
              { icon: Dumbbell, title: 'Iron Warrior', desc: 'Lift 100,000 lbs total', color: 'from-purple-400 to-purple-600', unlocked: false },
              { icon: Calendar, title: '30 Day Streak', desc: 'Train for 30 consecutive days', color: 'from-blue-400 to-cyan-500', unlocked: false }
            ].map((achievement, idx) => (
              <Card key={idx} className={`bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-5 shadow-lg ${achievement.unlocked ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center shadow-md`}>
                    <achievement.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-100">{achievement.title}</h4>
                    <p className="text-sm text-slate-400">{achievement.desc}</p>
                  </div>
                  {achievement.unlocked && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {memberLifts.slice(0, 10).map((lift) => (
              <Card key={lift.id} className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 capitalize">{lift.exercise?.replace(/_/g, ' ')}</h4>
                      <p className="text-sm text-slate-400">{new Date(lift.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xl font-black text-slate-100">{lift.weight_lbs}</div>
                      <div className="text-xs text-slate-400">lbs {lift.reps && `× ${lift.reps}`}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        const summary = `💪 Just completed ${lift.exercise.replace(/_/g, ' ')} - ${lift.weight_lbs} lbs${lift.reps ? ` × ${lift.reps} reps` : ''}! ${lift.is_pr ? '🔥 NEW PR!' : ''}`;
                        navigator.clipboard.writeText(summary);
                        alert('Workout summary copied! Share it with your friends.');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/50"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">Notifications</h3>
                  <p className="text-sm text-slate-300">Manage your notification preferences</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    {currentUser.notifications_enabled ? (
                      <Bell className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <BellOff className="w-5 h-5 text-slate-500" />
                    )}
                    <div>
                      <Label className="text-sm font-bold text-slate-100">Push Notifications</Label>
                      <p className="text-xs text-slate-400">Get notified about challenges and updates</p>
                    </div>
                  </div>
                  <Switch
                    checked={currentUser.notifications_enabled ?? true}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ notifications_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    {currentUser.email_notifications ? (
                      <Bell className="w-5 h-5 text-green-400" />
                    ) : (
                      <BellOff className="w-5 h-5 text-slate-500" />
                    )}
                    <div>
                      <Label className="text-sm font-bold text-slate-100">Email Notifications</Label>
                      <p className="text-xs text-slate-400">Receive email updates and summaries</p>
                    </div>
                  </div>
                  <Switch
                    checked={currentUser.email_notifications ?? true}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ email_notifications: checked })}
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  {currentUser.dark_mode ? (
                    <Moon className="w-6 h-6 text-white" />
                  ) : (
                    <Sun className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">Appearance</h3>
                  <p className="text-sm text-slate-300">Customize your app experience</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    {currentUser.dark_mode ? (
                      <Moon className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-orange-400" />
                    )}
                    <div>
                      <Label className="text-sm font-bold text-slate-100">Dark Mode</Label>
                      <p className="text-xs text-slate-400">Switch between light and dark theme</p>
                    </div>
                  </div>
                  <Switch
                    checked={currentUser.dark_mode ?? false}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ dark_mode: checked })}
                  />
                </div>

                <div className="p-4 bg-slate-700/50 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Ruler className="w-5 h-5 text-purple-400" />
                    <div>
                      <Label className="text-sm font-bold text-slate-100">Unit System</Label>
                      <p className="text-xs text-slate-400">Choose your preferred measurement units</p>
                    </div>
                  </div>
                  <Select 
                    value={currentUser.units || 'imperial'} 
                    onValueChange={(value) => updateSettingsMutation.mutate({ units: value })}
                  >
                    <SelectTrigger className="rounded-2xl border-2 border-slate-600 bg-slate-800/50 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imperial">Imperial (lbs, ft)</SelectItem>
                      <SelectItem value="metric">Metric (kg, m)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent">Privacy</h3>
                  <p className="text-sm text-slate-300">Control your profile visibility</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  {currentUser.public_profile ? (
                    <Globe className="w-5 h-5 text-green-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-500" />
                  )}
                  <div>
                    <Label className="text-sm font-bold text-slate-100">Public Profile</Label>
                    <p className="text-xs text-slate-400">Allow others to view your profile and stats</p>
                  </div>
                </div>
                <Switch
                  checked={currentUser.public_profile ?? true}
                  onCheckedChange={(checked) => updateSettingsMutation.mutate({ public_profile: checked })}
                />
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">!</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-900">Danger Zone</h3>
                  <p className="text-sm text-red-700">Irreversible actions</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-2 border-red-300 text-red-700 hover:bg-red-50 rounded-2xl font-semibold"
                onClick={() => {
                  if (confirm('Are you sure you want to logout?')) {
                    base44.auth.logout();
                  }
                }}
              >
                Logout
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddGoalModal
        open={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onSave={(data) => createGoalMutation.mutate(data)}
        currentUser={currentUser}
        isLoading={createGoalMutation.isPending}
      />
    </div>
  );
}