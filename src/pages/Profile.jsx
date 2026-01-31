import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Settings, TrendingUp, Award, Calendar, Dumbbell, Target, Share2, MapPin, Edit2, Save, X, Plus, Bell, BellOff, Moon, Sun, Lock, Globe, Ruler, Flame, Trophy, AlertCircle, Building2, CheckCircle, LogOut, Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import ConsistencyJourney from '../components/profile/ConsistencyJourney';
import CheckInHeatmap from '../components/profile/CheckInHeatmap';
import WorkoutSplitHeatmap from '../components/profile/WorkoutSplitHeatmap';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import WorkoutProgressTracker from '../components/profile/WorkoutProgressTracker';


export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ bio: '', gym_location: '', avatar_url: '' });
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showEditHero, setShowEditHero] = useState(false);
  const [showEditAvatar, setShowEditAvatar] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [activeTab, setActiveTab] = useState('progress');
  const [heatmapFilter, setHeatmapFilter] = useState('month');
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

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser
  });

  const { data: allGyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list()
  });

  const { data: allChallenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.list()
  });



  const memberLifts = lifts.filter(l => l.member_name === currentUser?.full_name);
  const userCheckIns = checkIns.filter(c => c.user_id === currentUser?.id);

  // Get gyms user is a member of
  const memberGymIds = gymMemberships.map(m => m.gym_id);
  const memberGyms = allGyms.filter(g => memberGymIds.includes(g.id));

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

  const updateHeroMutation = useMutation({
    mutationFn: (hero_image_url) => base44.auth.updateMe({ hero_image_url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowEditHero(false);
    }
  });

  const updateAvatarMutation = useMutation({
    mutationFn: (avatar_url) => base44.auth.updateMe({ avatar_url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowEditAvatar(false);
    }
  });

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



  const completedChallenges = allChallenges.filter(c => 
    c.status === 'completed' && 
    c.participants?.includes(currentUser?.id)
  ).length;

  const stats = {
    totalLifts: memberLifts.length,
    personalRecords: memberLifts.filter(l => l.is_pr).length,
    totalWeight: memberLifts.reduce((sum, l) => sum + (l.weight_lbs * (l.reps || 1)), 0),
    bestLift: Math.max(...memberLifts.map(l => l.weight_lbs), 0),
    weekStreak: currentStreak,
    challengesCompleted: completedChallenges
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
      {/* Header Section */}
      <div className="relative pt-10 pb-8 px-4 md:px-6 border-b border-slate-700/50 overflow-hidden">
        {/* Hero Background */}
        {currentUser.hero_image_url && (
          <>
            <div className="absolute inset-0 z-0">
              <img src={currentUser.hero_image_url} alt="" className="w-full h-full object-cover opacity-50" />
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-800/40 via-slate-900/60 to-slate-900" />
          </>
        )}
        {!currentUser.hero_image_url && (
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-800/40 to-transparent" />
        )}
        
        {/* Edit Hero Button */}
        <button
          onClick={() => setShowEditHero(true)}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-600/50 flex items-center justify-center hover:bg-slate-700/80 transition-all"
        >
          <Camera className="w-4 h-4 text-slate-300" />
        </button>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-slate-700/50">
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                ) : (
                   <span className="text-3xl font-semibold text-white tracking-tight">
                     {currentUser.full_name?.charAt(0)?.toUpperCase()}
                   </span>
                 )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <h1 className="text-2xl md:text-3xl font-medium tracking-[-0.02em] text-white leading-tight">{currentUser.full_name}</h1>
                  <StatusBadge checkIns={userCheckIns} streak={currentStreak} size="lg" />
                </div>
                {/* Equipped Badges */}
                {currentUser?.equipped_badges?.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    {currentUser.equipped_badges.map((badgeId) => {
                      const badge = streakMilestones.find(m => `${m.days}_day_streak` === badgeId) || 
                                   [
                                     { id: '10_visits', icon: '🎯', color: 'from-blue-400 to-blue-600' },
                                     { id: '50_visits', icon: '🔥', color: 'from-orange-400 to-red-500' },
                                     { id: '100_visits', icon: '🏆', color: 'from-yellow-400 to-orange-500' },
                                     { id: '7_day_streak', icon: '⚡', color: 'from-green-400 to-emerald-500' },
                                     { id: '30_day_streak', icon: '🔥', color: 'from-red-400 to-pink-500' },
                                     { id: '90_day_streak', icon: '👑', color: 'from-purple-400 to-pink-500' },
                                     { id: '1_year', icon: '📅', color: 'from-indigo-400 to-blue-500' },
                                     { id: 'community_leader', icon: '👥', color: 'from-cyan-400 to-blue-500' }
                                   ].find(b => b.id === badgeId);
                      if (!badge) return null;
                      return (
                        <div 
                          key={badgeId}
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg ring-2 ring-slate-600/40`}
                          title={badge.name || badgeId}
                        >
                          <span className="text-base">{badge.icon}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {!isEditing ? (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl"
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
                  className="text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-xl"
                  onClick={handleSave}
                >
                  <Save className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>

          {/* Bio & Location */}
          {isEditing ? (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block tracking-[-0.01em]">Bio</label>
                <Textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="bg-slate-800/60 border border-slate-600/40 rounded-xl text-white placeholder:text-slate-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block tracking-[-0.01em]">Gym Location</label>
                <Input
                  value={editData.gym_location}
                  onChange={(e) => setEditData({ ...editData, gym_location: e.target.value })}
                  placeholder="e.g. Iron Paradise, Manchester"
                  className="bg-slate-800/60 border border-slate-600/40 rounded-xl text-white placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block tracking-[-0.01em]">Profile Photo</label>
                <div className="flex gap-2">
                  <Input
                    value={editData.avatar_url}
                    onChange={(e) => setEditData({ ...editData, avatar_url: e.target.value })}
                    placeholder="https://..."
                    className="bg-slate-800/60 border border-slate-600/40 rounded-xl text-white placeholder:text-slate-500"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowEditAvatar(true)}
                    className="bg-slate-700/60 hover:bg-slate-600/70 text-white border border-slate-600/40 backdrop-blur-sm rounded-xl px-4"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {currentUser.bio && (
                <p className="text-slate-300 text-sm leading-relaxed font-normal max-w-2xl tracking-[-0.01em]">{currentUser.bio}</p>
              )}
              {currentUser.gym_location && (
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-normal tracking-[-0.01em]">{currentUser.gym_location}</span>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-700/50 my-6" />

          {/* Tabs Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full bg-slate-800/50 p-1 rounded-xl gap-1 mb-4">
              <TabsTrigger value="progress" className="flex-1 rounded-lg font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-xs text-slate-400 px-2 py-2">
                Progress
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex-1 rounded-lg font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-xs text-slate-400 px-2 py-2">
                Goals
              </TabsTrigger>
              <TabsTrigger value="badges" className="flex-1 rounded-lg font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-xs text-slate-400 px-2 py-2">
                Badges
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 rounded-lg font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-xs text-slate-400 px-2 py-2">
                <Settings className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="progress" className="space-y-4 mt-0">
              {/* Streak Cards */}
              <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-orange-600/15 to-orange-500/5 backdrop-blur-sm border border-orange-500/40 p-5 shadow-md overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Flame className="w-6 h-6 text-orange-400 flex-shrink-0" />
                <div className="min-w-0">
                    <p className="text-xs font-medium text-orange-300 truncate">Current Streak</p>
                    <p className="text-3xl font-black bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent drop-shadow-lg">{currentStreak}</p>
                    <p className="text-xs text-orange-300 truncate">days</p>
                  </div>
              </div>
              {currentUser?.streak_freezes_available > 0 && (
                <div className="text-center px-1 flex-shrink-0">
                  <span className="text-lg">❄️</span>
                  <p className="text-xs text-slate-400 font-bold">{currentUser.streak_freezes_available}</p>
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
              <div className="flex items-center justify-between text-xs text-orange-400 mb-1 gap-2">
                <span className="truncate">Next: {nextMilestone.name}</span>
                <span className="flex-shrink-0">{currentStreak}/{nextMilestone.days}</span>
              </div>
              <Progress value={streakProgress} className="h-2 bg-slate-600" />
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-6 h-6 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-purple-300 truncate">Best Streak</p>
                <p className="text-3xl font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-lg">{longestStreak}</p>
                <p className="text-xs text-purple-300 truncate">days ever</p>
              </div>
            </div>
            {currentStreak > 0 && longestStreak > currentStreak && (
              <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 overflow-hidden">
                <p className="text-xs font-bold text-slate-300 line-clamp-1">💎 Keep going to beat your record!</p>
              </div>
            )}
            {currentStreak === longestStreak && currentStreak > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 overflow-hidden">
                <p className="text-xs font-bold text-slate-300 line-clamp-1">🔥 New personal record!</p>
              </div>
            )}
          </Card>
        </div>

        {/* Consistency Journey */}
        <ConsistencyJourney totalCheckIns={userCheckIns.length} />

{/* Protection & Risk Info */}
{currentStreak > 0 && (
  <Card className="p-5 bg-gradient-to-br from-red-600/15 to-red-500/5 backdrop-blur-sm border border-red-500/40 shadow-md">
            <h3 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              What Happens If You Stop?
            </h3>
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <p className="text-xs text-slate-400 mb-1">Grace Period</p>
                <p className="text-sm text-slate-200">You have a 2-day grace period. Miss 3 days and your {currentStreak}-day streak resets to 0.</p>
              </div>
              {currentUser?.streak_freezes_available > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                   <p className="text-xs text-slate-400 mb-1">❄️ Protection Available</p>
                  <p className="text-sm text-slate-200">You have {currentUser.streak_freezes_available} streak freeze{currentUser.streak_freezes_available > 1 ? 's' : ''} to protect your progress if life gets busy.</p>
                </div>
              )}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <p className="text-xs text-slate-400 mb-1">⚠️ What You'll Lose</p>
                <p className="text-sm text-slate-200">Your {currentStreak}-day streak and progress toward "{nextMilestone.name}" will be lost. You'll start from day 1.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Milestone Badges */}
        {earnedBadges.length > 0 && (
          <Card className="p-5 bg-gradient-to-br from-yellow-600/15 to-yellow-500/5 backdrop-blur-sm border border-yellow-500/40 shadow-md overflow-hidden">
            <h3 className="font-semibold text-yellow-300 mb-3 flex items-center gap-2">
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

              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-gradient-to-br from-amber-600/40 to-amber-500/20 backdrop-blur-sm border border-amber-500/50 p-4 text-center shadow-md">
                  <div className="text-3xl font-black bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent mb-1 drop-shadow-lg">{stats.challengesCompleted}</div>
                  <div className="text-[10px] text-amber-100 font-bold uppercase tracking-widest">Challenges Completed</div>
                </Card>
                <Card className="bg-gradient-to-br from-purple-600/40 to-purple-500/20 backdrop-blur-sm border border-purple-500/50 p-4 text-center shadow-md">
                  <div className="text-3xl font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-1 drop-shadow-lg">{stats.personalRecords}</div>
                  <div className="text-[10px] text-purple-100 font-bold uppercase tracking-widest">PRs</div>
                </Card>
                <Card className="bg-gradient-to-br from-teal-600/40 to-teal-500/20 backdrop-blur-sm border border-teal-500/50 p-4 text-center shadow-md">
                  <div className="text-3xl font-black bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent mb-1 drop-shadow-lg">{stats.weekStreak}</div>
                  <div className="text-[10px] text-teal-100 font-bold uppercase tracking-widest">Day Streak</div>
                </Card>
              </div>

                {/* Workout Split Heatmap */}
              <Card className="bg-slate-900/70 border border-indigo-500/30 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Your Split Progress</h3>
                </div>

                <button
                  onClick={() => setShowSplitModal(true)}
                  className="w-full mb-3 p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 transition-all text-xs font-medium flex items-center justify-center gap-2"
                >
                  <Calendar className="w-3 h-3" />
                  Edit Your Split
                </button>

                <WorkoutSplitHeatmap 
                  checkIns={userCheckIns}
                  workoutSplit={currentUser?.workout_split}
                  weeklyGoal={currentUser?.weekly_goal}
                  trainingDays={currentUser?.training_days}
                  customWorkoutTypes={currentUser?.custom_workout_types || {}}
                />
              </Card>

              {/* Workout Progress Tracker */}
              <WorkoutProgressTracker currentUser={currentUser} />

              {/* Gym Memberships - Compact */}
              {memberGyms.length > 0 && (
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
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

            <TabsContent value="badges">
              <BadgesDisplay user={currentUser} checkIns={userCheckIns} />
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
            {/* Progress Tracker */}
            {(() => {
              const startOfThisWeek = new Date();
              startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay() + 1);
              startOfThisWeek.setHours(0, 0, 0, 0);
              
              const weeklyCheckIns = userCheckIns.filter(c => new Date(c.check_in_date) >= startOfThisWeek);
              const weeklyTarget = currentUser?.weekly_goal || 3;
              
              const goalsOnTrack = goals.filter(g => {
                const progress = (g.current_value / g.target_value) * 100;
                const daysUntilDeadline = g.deadline ? Math.floor((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                
                if (!daysUntilDeadline || daysUntilDeadline < 0) return progress >= 80;
                
                const totalDuration = g.deadline ? Math.floor((new Date(g.deadline) - new Date(g.created_date || new Date())) / (1000 * 60 * 60 * 24)) : 30;
                const daysPassed = totalDuration - daysUntilDeadline;
                const expectedProgress = (daysPassed / totalDuration) * 100;
                
                return progress >= expectedProgress * 0.8;
              }).length;
              
              const weeklyComplete = weeklyCheckIns.length >= weeklyTarget;
              const goalsComplete = goals.length === 0 || goalsOnTrack >= goals.length * 0.5;
              const completedCount = (weeklyComplete ? 1 : 0) + (goalsComplete ? 1 : 0);
              const totalCount = goals.length > 0 ? 2 : 1;
              
              const isOnTrack = completedCount === totalCount;
              const isAlmostOnTrack = !isOnTrack && completedCount === totalCount - 1;
              const progressPercentage = goals.length > 0 ? Math.round((goalsOnTrack / goals.length) * 100) : (weeklyCheckIns.length / weeklyTarget) * 100;

              return (
                <Card className={`bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 ${
                  isOnTrack ? 'ring-1 ring-green-500/30' : isAlmostOnTrack ? 'ring-1 ring-amber-500/30' : 'ring-1 ring-red-500/30'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isOnTrack ? 'bg-green-500/20 text-green-400' : isAlmostOnTrack ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {isOnTrack ? <CheckCircle className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-sm font-bold ${
                        isOnTrack ? 'text-green-300' : isAlmostOnTrack ? 'text-amber-300' : 'text-red-300'
                      }`}>
                        {isOnTrack ? 'On Track' : isAlmostOnTrack ? 'Almost There' : 'Needs Attention'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {isOnTrack ? 'Keep it up!' : isAlmostOnTrack ? 'One more push' : 'Time to refocus'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-300 font-medium">Weekly Visits</span>
                        <span className="text-xs font-bold text-slate-200">{weeklyCheckIns.length}/{weeklyTarget}</span>
                      </div>
                      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${weeklyCheckIns.length >= weeklyTarget ? 'bg-green-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min((weeklyCheckIns.length / weeklyTarget) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    {goals.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-slate-300 font-medium">Goals Progress</span>
                          <span className="text-xs font-bold text-slate-200">{progressPercentage}%</span>
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${goalsOnTrack >= goals.length * 0.5 ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })()}

            {/* Goals Header */}
            <div className="bg-gradient-to-br from-slate-800/80 via-blue-900/40 to-slate-900/80 backdrop-blur-md border border-blue-500/30 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">My Goals</h3>
                    <p className="text-xs text-slate-400">Track your fitness milestones</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAddGoal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">New Goal</span>
                  <span className="md:hidden">Add</span>
                </Button>
              </div>

              {/* Goals Overview Stats */}
              {goals.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-blue-400">{goals.filter(g => g.status === 'active').length}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Active</div>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-green-400">{goals.filter(g => g.status === 'completed').length}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Completed</div>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-purple-400">
                      {goals.filter(g => g.status === 'active').length > 0 
                        ? Math.round(goals.filter(g => g.status === 'active').reduce((sum, g) => sum + ((g.current_value / g.target_value) * 100), 0) / goals.filter(g => g.status === 'active').length)
                        : 0}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Avg Progress</div>
                  </div>
                </div>
              )}
            </div>

            {activeGoals.length === 0 ? (
              <Card className="bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 backdrop-blur-sm border-2 border-dashed border-slate-600/50 p-10 text-center rounded-2xl">
                <div className="max-w-sm mx-auto">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center">
                    <Target className="w-10 h-10 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">No Active Goals</h4>
                  <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                    Set your first goal and start tracking your fitness journey. Whether it's lifting heavier, working out more often, or building consistency.
                  </p>
                  <Button
                    onClick={() => setShowAddGoal(true)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl shadow-lg font-semibold"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onUpdate={handleUpdateGoal}
                    onDelete={(id) => deleteGoalMutation.mutate(id)}
                    onToggleReminder={handleToggleReminder}
                  />
                ))}
              </div>
            )}

            {/* Completed Goals Section */}
            {goals.filter(g => g.status === 'completed').length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Completed Goals ({goals.filter(g => g.status === 'completed').length})
                </h4>
                <div className="space-y-2">
                  {goals.filter(g => g.status === 'completed').slice(0, 3).map(goal => (
                    <Card key={goal.id} className="bg-slate-800/40 border border-green-500/30 p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-white text-sm truncate">{goal.title}</h5>
                          <p className="text-xs text-slate-400">
                            {goal.target_value} {goal.unit} achieved
                          </p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-300 border border-green-500/40 text-xs">
                          ✓ Done
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
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
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    {currentUser.notifications_enabled ? (
                      <Bell className="w-5 h-5 text-slate-400" />
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

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                   <div className="flex items-center gap-3">
                     {currentUser.email_notifications ? (
                       <Bell className="w-5 h-5 text-slate-400" />
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

            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
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

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Ruler className="w-5 h-5 text-slate-400" />
                    <div>
                      <Label className="text-sm font-bold text-slate-100">Unit System</Label>
                      <p className="text-xs text-slate-400">Choose your preferred measurement units</p>
                    </div>
                    </div>
                    <Select 
                    value={currentUser.units || 'imperial'} 
                    onValueChange={(value) => updateSettingsMutation.mutate({ units: value })}
                    >
                    <SelectTrigger className="rounded-2xl border border-white/20 bg-white/5 text-slate-100">
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

            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Account Details</h3>
                  <p className="text-sm text-slate-300">Manage your email and password</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                   <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Email Address</Label>
                  <Input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="bg-white/5 border border-white/10 text-slate-100 rounded-xl"
                  />
                  <p className="text-xs text-slate-400 mt-1">Contact support to change your email</p>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Password</Label>
                  <Input
                    type="password"
                    value="••••••••"
                    disabled
                    className="bg-white/5 border border-white/10 text-slate-100 rounded-xl"
                  />
                  <p className="text-xs text-slate-400 mt-1">Contact support to reset your password</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Privacy</h3>
                  <p className="text-sm text-slate-300">Control your profile visibility</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                 <div className="flex items-center gap-3">
                   {currentUser.public_profile ? (
                     <Globe className="w-5 h-5 text-slate-400" />
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

            <Card className="bg-gradient-to-br from-red-600/15 to-red-500/5 backdrop-blur-sm border border-red-500/40 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Account & Session</h3>
                  <p className="text-sm text-slate-300">Manage your login session</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl font-semibold h-10 flex items-center gap-2"
                  onClick={() => {
                    if (confirm('Are you sure you want to logout?')) {
                      base44.auth.logout();
                    }
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
                <p className="text-xs text-slate-400 text-center">You will be logged out from all sessions</p>
              </div>
            </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AddGoalModal
        open={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onSave={(data) => createGoalMutation.mutate(data)}
        currentUser={currentUser}
        isLoading={createGoalMutation.isPending}
      />

      <EditHeroImageModal
        open={showEditHero}
        onClose={() => setShowEditHero(false)}
        currentImageUrl={currentUser?.hero_image_url}
        onSave={(hero_image_url) => updateHeroMutation.mutate(hero_image_url)}
        isLoading={updateHeroMutation.isPending}
      />

      <EditHeroImageModal
        open={showEditAvatar}
        onClose={() => setShowEditAvatar(false)}
        currentImageUrl={currentUser?.avatar_url}
        onSave={(avatar_url) => updateAvatarMutation.mutate(avatar_url)}
        isLoading={updateAvatarMutation.isPending}
      />

      <CreateSplitModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        currentUser={currentUser}
      />
    </div>
  );
}