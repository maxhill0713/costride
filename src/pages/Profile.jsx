import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Settings, TrendingUp, Award, Calendar, Dumbbell, Target, Share2, MapPin, Edit2, Save, X, Plus, Bell, BellOff, Moon, Sun, Lock, Globe, Ruler, Flame, Trophy, AlertCircle, Gift, Building2, CheckCircle, Tag, Users, Crown, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClaimedRewardCard from '../components/rewards/ClaimedRewardCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Progress } from '@/components/ui/progress';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import BadgesDisplay from '../components/profile/BadgesDisplay';
import StatusBadge from '../components/profile/StatusBadge';
import ConsistencyJourney from '../components/profile/ConsistencyJourney';


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

  const { data: claimedBonuses = [] } = useQuery({
    queryKey: ['claimedBonuses', currentUser?.id],
    queryFn: () => base44.entities.ClaimedBonus.filter({ user_id: currentUser.id }),
    enabled: !!currentUser
  });

  const { data: allChallenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.list()
  });

  const claimRewardMutation = useMutation({
    mutationFn: async ({ reward, userId }) => {
      // Generate unique redemption code
      const redemptionCode = `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Create ClaimedBonus record
      await base44.entities.ClaimedBonus.create({
        user_id: userId,
        gym_id: reward.gym_id,
        bonus_type: reward.type === 'discount' ? 'gym_offer' : 'free_day_pass',
        offer_details: reward.title,
        redemption_code: redemptionCode,
        redeemed: false
      });
      
      // Update reward claimed_by list
      return base44.entities.Reward.update(reward.id, {
        claimed_by: [...(reward.claimed_by || []), userId]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['claimedBonuses'] });
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
  
  // Get claimed rewards with their bonus records
  const claimedRewards = availableRewards.filter(r => hasClaimedReward(r));
  const unclaimedRewards = availableRewards.filter(r => !hasClaimedReward(r));

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

  const handleUpdateGoal = (goal, newValue, status, milestones) => {
    const updateData = { 
      current_value: newValue, 
      status: status || goal.status 
    };
    if (milestones) {
      updateData.milestones = milestones;
    }
    updateGoalMutation.mutate({
      id: goal.id,
      data: updateData
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

  // Identity & Status Calculation
  const getIdentityStatus = () => {
    const workouts = stats.totalLifts;
    const prs = stats.personalRecords;
    const streak = currentStreak;

    if (workouts < 5) return { title: 'Beginner', subtitle: 'Just Starting Out', next: 'Complete 5 workouts to become a Novice', color: 'from-gray-400 to-gray-500' };
    if (workouts < 20) return { title: 'Novice Lifter', subtitle: 'Building Habits', next: 'Complete 20 workouts to become Committed', color: 'from-blue-400 to-blue-500' };
    if (workouts < 50) return { title: 'Committed Athlete', subtitle: 'Making Progress', next: 'Complete 50 workouts to become Dedicated', color: 'from-purple-400 to-purple-500' };
    if (streak < 30) return { title: 'Dedicated Athlete', subtitle: 'Showing Consistency', next: 'Reach 30-day streak to become Elite', color: 'from-orange-400 to-orange-500' };
    if (prs < 10) return { title: 'Elite Performer', subtitle: 'Breaking Barriers', next: 'Achieve 10 PRs to become a Champion', color: 'from-cyan-400 to-cyan-500' };
    return { title: 'Champion', subtitle: 'Peak Performance', next: 'Keep pushing your limits!', color: 'from-yellow-400 to-yellow-500' };
  };

  const identityStatus = getIdentityStatus();

  // Risk Assessment
  const getStreakRisk = () => {
    if (!lastCheckIn) return null;
    if (daysSinceCheckIn === 0) return { level: 'safe', message: '✅ Safe: Checked in today', color: 'text-green-400' };
    if (daysSinceCheckIn === 1) return { level: 'safe', message: '✅ Safe: 1 day since last check-in', color: 'text-green-400' };
    if (daysSinceCheckIn === 2) return { level: 'warning', message: '⚠️ Warning: Check in today to keep your streak!', color: 'text-yellow-400' };
    if (daysSinceCheckIn === 3) return { level: 'danger', message: '🔥 Danger: Streak expires tomorrow!', color: 'text-orange-400' };
    return { level: 'lost', message: '❌ Streak Lost: Time to start fresh!', color: 'text-red-400' };
  };

  const streakRisk = getStreakRisk();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-blue-700/40 px-4 pt-8 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-white/30">
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
                <label className="text-white text-sm font-medium mb-1 block">Profile Photo</label>
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
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 border-0 p-5 text-white shadow-2xl animate-pulse overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-lg mb-1 truncate">We Miss You! 🔥</h3>
                  <p className="text-white/90 text-sm line-clamp-2">
                    It's been {daysSinceCheckIn} days since your last check-in. Don't lose your {currentStreak}-day streak!
                  </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
      <div className="max-w-2xl mx-auto px-4 -mt-16 mb-6">
        {/* Identity Card */}
        <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 rounded-2xl shadow-xl mb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">Your Identity</p>
              <h3 className={`text-xl font-bold bg-gradient-to-r ${identityStatus.color} bg-clip-text text-transparent mb-2`}>
                {identityStatus.title}
              </h3>
              <p className="text-sm text-slate-300">{identityStatus.subtitle}</p>
              <div className="mt-3 pt-3 border-t border-slate-600/40">
                <p className="text-xs text-slate-400 mb-1">Next milestone</p>
                <p className="text-sm text-slate-200">{identityStatus.next}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Streak Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <Flame className="w-5 h-5 text-white" />
              </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-cyan-300 truncate">Current Streak</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{currentStreak}</p>
                    <p className="text-xs text-cyan-300 truncate">days</p>
                  </div>
              </div>
              {currentUser?.streak_freezes_available > 0 && (
                <div className="text-center px-1 flex-shrink-0">
                  <span className="text-lg">❄️</span>
                  <p className="text-xs text-cyan-300 font-bold">{currentUser.streak_freezes_available}</p>
                </div>
              )}
            </div>
            {streakRisk && (
              <div className={`mt-2 px-2 py-1.5 rounded-lg overflow-hidden ${
                streakRisk.level === 'safe' ? 'bg-green-900/30 border border-green-600/30' :
                streakRisk.level === 'warning' ? 'bg-yellow-900/30 border border-yellow-600/30' :
                streakRisk.level === 'danger' ? 'bg-orange-900/30 border border-orange-600/30' :
                'bg-red-900/30 border border-red-600/30'
              }`}>
                <p className={`text-xs font-bold ${streakRisk.color} line-clamp-2`}>{streakRisk.message}</p>
              </div>
            )}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-cyan-300 mb-1 gap-2">
                <span className="truncate">Next: {nextMilestone.name}</span>
                <span className="flex-shrink-0">{currentStreak}/{nextMilestone.days}</span>
              </div>
              <Progress value={streakProgress} className="h-2 bg-slate-600" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Best Streak</p>
                <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{longestStreak}</p>
                <p className="text-xs text-slate-400">days ever</p>
              </div>
            </div>
            {currentStreak > 0 && longestStreak > currentStreak && (
              <div className="bg-purple-900/30 border border-purple-600/30 rounded-lg px-2 py-1.5 overflow-hidden">
                <p className="text-xs font-bold text-purple-300 line-clamp-1">💎 Keep going to beat your record!</p>
              </div>
            )}
            {currentStreak === longestStreak && currentStreak > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg px-2 py-1.5 overflow-hidden">
                <p className="text-xs font-bold text-yellow-300 line-clamp-1">🔥 New personal record!</p>
              </div>
            )}
          </Card>
        </div>



        {/* Protection & Risk Info */}
        {currentStreak > 0 && (
          <Card className="p-5 mb-4 bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-cyan-600/30 shadow-lg">
            <h3 className="font-semibold bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-cyan-400" />
              What Happens If You Stop?
            </h3>
            <div className="space-y-3">
              <div className="bg-slate-700/50 rounded-2xl p-3">
                <p className="text-xs text-slate-400 mb-1">Grace Period</p>
                <p className="text-sm text-slate-200">You have a 2-day grace period. Miss 3 days and your {currentStreak}-day streak resets to 0.</p>
              </div>
              {currentUser?.streak_freezes_available > 0 && (
                <div className="bg-cyan-900/30 border border-cyan-600/30 rounded-2xl p-3">
                  <p className="text-xs text-cyan-300 mb-1">❄️ Protection Available</p>
                  <p className="text-sm text-slate-200">You have {currentUser.streak_freezes_available} streak freeze{currentUser.streak_freezes_available > 1 ? 's' : ''} to protect your progress if life gets busy.</p>
                </div>
              )}
              <div className="bg-orange-900/30 border border-orange-600/30 rounded-2xl p-3">
                <p className="text-xs text-orange-300 mb-1">⚠️ What You'll Lose</p>
                <p className="text-sm text-slate-200">Your {currentStreak}-day streak and progress toward "{nextMilestone.name}" will be lost. You'll start from day 1.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Milestone Badges */}
        {earnedBadges.length > 0 && (
          <Card className="p-5 mb-4 bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-yellow-600/30 shadow-lg overflow-hidden">
            <h3 className="font-semibold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <span className="truncate">Milestones Unlocked</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {earnedBadges.map((badge) => (
                <div key={badge.days} className={`p-3 rounded-2xl bg-gradient-to-br ${badge.color} text-white text-center overflow-hidden`}>
                  <div className="text-3xl mb-1">{badge.icon}</div>
                  <p className="font-bold text-xs truncate">{badge.name}</p>
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


      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full mb-6 bg-gradient-to-br from-slate-700/90 to-slate-800/90 backdrop-blur-sm border border-blue-600/30 p-1.5 rounded-2xl shadow-sm overflow-x-auto gap-1">
            <TabsTrigger value="progress" className="flex-1 min-w-fit rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs text-slate-400 px-2 py-2">
              Progress
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex-1 min-w-fit rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs text-slate-400 px-2 py-2">
              Goals
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex-1 min-w-fit rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs text-slate-400 px-2 py-2">
              Rewards
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex-1 min-w-fit rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs text-slate-400 px-2 py-2">
              Badges
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex-1 min-w-fit rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs text-slate-400 px-2 py-2">
              Challenges
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 min-w-fit rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs text-slate-400 px-2 py-2">
              <Settings className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <ConsistencyJourney totalCheckIns={userCheckIns.length} />

            {/* Progress Stats */}
            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-5 shadow-lg">
              <h3 className="font-semibold text-white mb-4">Your Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-300 uppercase">Check-Ins</span>
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{userCheckIns.length}</div>
                </div>
                <div className="bg-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-orange-300 uppercase">Current Streak</span>
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">{currentStreak}</div>
                </div>
                <div className="bg-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-300 uppercase">Workouts</span>
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.totalLifts}</div>
                </div>
                <div className="bg-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-300 uppercase">PRs</span>
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{stats.personalRecords}</div>
                </div>
              </div>
            </Card>

            {/* Gym Memberships - Compact */}
            {memberGyms.length > 0 && (
              <div className="bg-slate-700/30 rounded-2xl p-3 border border-slate-600/30">
                <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-300">Member at {memberGyms.length} gym{memberGyms.length > 1 ? 's' : ''}</span>
                  </div>
                <div className="flex flex-wrap gap-2">
                  {memberGyms.map((gym) => (
                    <span 
                      key={gym.id}
                      className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full font-medium"
                    >
                      {gym.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <Tabs defaultValue="gym" className="w-full">
              <TabsList className="w-full bg-gradient-to-br from-slate-700/90 to-slate-800/90 backdrop-blur-sm border border-blue-600/30">
                <TabsTrigger value="gym" className="flex-1">In-Gym Rewards</TabsTrigger>
                <TabsTrigger value="brand" className="flex-1">Brand Rewards</TabsTrigger>
              </TabsList>

              {/* In-Gym Rewards Tab */}
              <TabsContent value="gym" className="space-y-4 mt-4">
                <Link to={createPageUrl('GymRewards')}>
                  <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-500 border-0 text-white hover:shadow-xl hover:shadow-green-500/30 transition-all cursor-pointer">
                    <Trophy className="w-10 h-10 mb-3" />
                    <h3 className="font-black text-lg mb-1">In-Gym Rewards</h3>
                    <p className="text-sm text-white/90">Free day passes and exclusive gym offers</p>
                  </Card>
                </Link>
                </TabsContent>

                {/* Brand Rewards Tab */}
                <TabsContent value="brand" className="space-y-4 mt-4">
                <Link to={createPageUrl('BrandDiscounts')}>
                  <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 border-0 text-white hover:shadow-xl hover:shadow-purple-500/30 transition-all cursor-pointer">
                    <Gift className="w-10 h-10 mb-3" />
                    <h3 className="font-black text-lg mb-1">Brand Rewards</h3>
                    <p className="text-sm text-white/90">Discount codes and gift cards from top brands</p>
                  </Card>
                </Link>
                </TabsContent>
                </Tabs>
                </TabsContent>

          <TabsContent value="badges">
            <BadgesDisplay user={currentUser} checkIns={userCheckIns} />
          </TabsContent>

          <TabsContent value="challenges" className="space-y-4">
            {(() => {
              const appChallenges = allChallenges.filter(c => c.is_app_challenge === true && c.status === 'active');
              
              return appChallenges.length === 0 ? (
                <Card className="p-8 text-center border-2 border-dashed border-slate-600/50 bg-gradient-to-br from-slate-700/50 to-slate-800/50">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-300 mb-2">No active app challenges yet</p>
                  <p className="text-xs text-slate-400">Check back soon!</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {appChallenges.map((challenge) => (
                    <Card key={challenge.id} className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-white mb-1">{challenge.title}</h4>
                          <p className="text-sm text-slate-300 mb-2">{challenge.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-blue-500/40 text-blue-200 border-blue-500/50 text-xs">
                              {challenge.goal_type.replace(/_/g, ' ')}
                            </Badge>
                            {challenge.reward && (
                              <Badge className="bg-green-500/40 text-green-200 border-green-500/50 text-xs">
                                🎁 {challenge.reward}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs whitespace-nowrap">
                          {Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24))}d left
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-sm md:text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-4 md:w-5 h-4 md:h-5 text-blue-400" />
                <span className="hidden md:inline">My Goals</span>
                <span className="md:hidden">Goals</span>
              </h3>
              <Button
                onClick={() => setShowAddGoal(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl md:rounded-2xl shadow-lg text-xs md:text-sm px-2 md:px-4"
              >
                <Plus className="w-3 md:w-4 h-3 md:h-4 mr-0 md:mr-1" />
                <span className="hidden md:inline">Add Goal</span>
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
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
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
                  <h3 className="text-lg font-semibold text-white">Appearance</h3>
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
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Account Details</h3>
                  <p className="text-sm text-slate-300">Manage your email and password</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-700/50 rounded-2xl">
                  <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Email Address</Label>
                  <Input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="bg-slate-800/50 border-slate-600 text-slate-100 rounded-xl"
                  />
                  <p className="text-xs text-slate-400 mt-1">Contact support to change your email</p>
                </div>

                <div className="p-4 bg-slate-700/50 rounded-2xl">
                  <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Password</Label>
                  <Input
                    type="password"
                    value="••••••••"
                    disabled
                    className="bg-slate-800/50 border-slate-600 text-slate-100 rounded-xl"
                  />
                  <p className="text-xs text-slate-400 mt-1">Contact support to reset your password</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Privacy</h3>
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