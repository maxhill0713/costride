import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Settings, TrendingUp, Award, Calendar, Dumbbell, Target, Share2, MapPin, Edit2, Save, X, Plus, Flame, Trophy, AlertCircle, Building2, CheckCircle, Camera, FileText, BarChart3, Image as ImageIcon, Video, Upload, Zap, Snowflake, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
import ProfilePictureModal from '../components/profile/ProfilePictureModal';
import PostCard from '../components/feed/PostCard';
import ExerciseInsights from '../components/profile/ExerciseInsights';


export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ bio: '', gym_location: '', avatar_url: '' });
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showEditHero, setShowEditHero] = useState(false);
  const [showEditAvatar, setShowEditAvatar] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [heatmapFilter, setHeatmapFilter] = useState('month');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postVideo, setPostVideo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [gridView, setGridView] = useState(false);
  const [selectedGridPost, setSelectedGridPost] = useState(null);
  const [allowGymRepost, setAllowGymRepost] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', currentUser?.id],
    queryFn: () => base44.entities.Post.filter({ member_id: currentUser.id }, '-created_date', 50),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev
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
    queryKey: ['lifts', currentUser?.id],
    queryFn: () => base44.entities.Lift.filter({ member_id: currentUser.id }, '-created_date', 100),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date', 200),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const memberGymIds = gymMemberships.map(m => m.gym_id);

  const { data: memberGymsData = [] } = useQuery({
    queryKey: ['memberGyms', currentUser?.id],
    queryFn: async () => {
      if (memberGymIds.length === 0) return [];
      const results = await Promise.all(
        memberGymIds.map(id => base44.entities.Gym.filter({ id }).then(r => r[0]).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: !!currentUser && gymMemberships.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const { data: allChallenges = [] } = useQuery({
    queryKey: ['completedChallenges'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'completed' }, '-created_date', 50),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });



  const displayName = currentUser?.username || currentUser?.full_name;
  const memberLifts = lifts;
  const userCheckIns = checkIns;

  const memberGyms = memberGymsData;
  const primaryGymId = currentUser?.primary_gym_id;
  const primaryGym = memberGymsData.find(g => g.id === primaryGymId);

  React.useEffect(() => {
    if (currentUser) {
      setEditData({
        bio: currentUser.bio || '',
        gym_location: currentUser.gym_location || '',
        avatar_url: currentUser.avatar_url || ''
      });
    }
  }, [currentUser]);

  const handleSave = () => {
    // Optimistic update — instant UI
    queryClient.setQueryData(['currentUser'], (old) => old ? { ...old, ...editData } : old);
    setIsEditing(false);
    base44.auth.updateMe(editData);
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
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['goals', currentUser?.id] });
      const previous = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => [
        ...old,
        { id: `temp-${Date.now()}`, ...data, status: 'active', current_value: 0 }
      ]);
      return { previous };
    },
    onError: (err, data, context) => {
      queryClient.setQueryData(['goals', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowAddGoal(false);
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      
      // Snapshot previous value
      const previousGoals = queryClient.getQueryData(['goals', currentUser?.id]);
      
      // Optimistically update
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) =>
        old.map(goal => goal.id === id ? { ...goal, ...data } : goal)
      );
      
      return { previousGoals };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['goals', currentUser?.id], context.previousGoals);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['goals', currentUser?.id] });
      const previous = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) =>
        old.filter(g => g.id !== id)
      );
      return { previous };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['goals', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const handleFileUpload = async (file, type) => {
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'image') {
        setPostImage(file_url);
      } else {
        setPostVideo(file_url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createPost', {
      content: data.content,
      image_url: data.image_url || null,
      video_url: data.video_url || null,
      allow_gym_repost: data.allow_gym_repost || false
    }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['userPosts', currentUser?.id] });
      const previous = queryClient.getQueryData(['userPosts', currentUser?.id]);
      queryClient.setQueryData(['userPosts', currentUser?.id], (old = []) => [
        { id: `temp-${Date.now()}`, member_id: currentUser?.id, member_name: currentUser?.full_name, member_avatar: currentUser?.avatar_url, content: data.content, image_url: data.image_url || null, video_url: data.video_url || null, likes: 0, comments: [], created_date: new Date().toISOString() },
        ...old
      ]);
      setShowCreatePost(false);
      setPostContent('');
      setPostImage('');
      setPostVideo('');
      setAllowGymRepost(false);
      return { previous };
    },
    onError: (err, data, context) => {
      queryClient.setQueryData(['userPosts', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
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
      <div className="relative pt-6 pb-3 px-4 md:px-6 border-b border-slate-700/50 overflow-hidden bg-gradient-to-b from-slate-800/40 to-transparent">
        {/* Hero Background - Only if custom image is set */}
        {currentUser.hero_image_url && (
          <>
            <div className="absolute inset-0 z-0">
              <img src={currentUser.hero_image_url} alt="" className="w-full h-full object-cover opacity-50" />
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-800/40 via-slate-900/60 to-slate-900" />
            
            {/* Streak Freezes Badge */}
            <div className="absolute bottom-14 right-4 z-10 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-cyan-500/40 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
              <Snowflake className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-cyan-300">{currentUser?.streak_freezes || 2}</span>
            </div>
          </>
        )}
        
        {/* Top Right Icons */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <Link to={createPageUrl('Settings')} className="p-2 -m-2">
            <Settings className="w-6 h-6 text-slate-300 hover:text-white transition-colors" />
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-5 flex-1">
              <button 
                onClick={() => setShowProfilePicture(true)}
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-slate-700/50 cursor-pointer hover:ring-blue-500/50 transition-all active:scale-95"
              >
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                   <span className="text-3xl font-semibold text-white tracking-tight">
                     {displayName?.charAt(0)?.toUpperCase()}
                   </span>
                 )}
              </button>
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-2">
                   <h1 className="text-xl md:text-2xl font-medium tracking-[-0.02em] text-white leading-tight">{displayName}</h1>
                   <StatusBadge checkIns={userCheckIns} streak={currentStreak} size="sm" />
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
          </div>

          {/* Bio & Location */}
          {isEditing ? (
            <div className="space-y-3 mt-4">
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

              {/* Home Gym */}
              {primaryGym && (
                <Link to={createPageUrl('GymCommunity') + `?id=${primaryGym.id}`}>
                  <div className="flex items-center gap-2 flex-wrap cursor-pointer hover:opacity-80 transition-opacity mt-3">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <Badge 
                      className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs"
                    >
                      {primaryGym.name}
                    </Badge>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Section */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-3 pb-6">
        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full bg-slate-900/70 backdrop-blur-xl border border-slate-700/30 p-1 rounded-xl gap-1 mb-4">
              <TabsTrigger value="stats" className="flex-1 rounded-lg font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-xs text-slate-400 px-2 py-2">
                Insights
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex-1 rounded-lg font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-xs text-slate-400 px-2 py-2">
                Progress
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex-1 rounded-lg font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-xs text-slate-400 px-2 py-2">
                Goals
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex-1 rounded-lg font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-xs text-slate-400 px-2 py-2">
                Posts
              </TabsTrigger>
            </TabsList>


            <TabsContent value="progress" className="space-y-4 mt-0">
        {/* Milestone Badges */}
        {earnedBadges.length > 0 && (
          <Card className="p-5 bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 overflow-hidden">
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



                {/* Workout Split Heatmap */}
              {currentUser?.workout_split ? (
                <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/20">
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
              ) : null}

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

            <TabsContent value="stats" className="space-y-4">
              {/* Exercise Insights */}
              <ExerciseInsights 
                workoutLogs={workoutLogs}
                workoutSplit={currentUser?.custom_workout_types}
                trainingDays={currentUser?.training_days}
              />

              {/* Key Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Card className="group relative bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-3 rounded-xl hover:border-blue-400/30 transition-all cursor-pointer overflow-hidden shadow-2xl shadow-black/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Check-ins</span>
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Calendar className="w-4 h-4 text-blue-400 relative group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <div className="text-2xl font-bold text-white">{userCheckIns.length}</div>
                      {userCheckIns.length >= 10 && <span className="text-xs text-blue-400 animate-pulse">🎯</span>}
                    </div>
                  </div>
                </Card>

                <Card className="group relative bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-3 rounded-xl hover:border-orange-400/30 transition-all cursor-pointer overflow-hidden shadow-2xl shadow-black/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Best Streak</span>
                      <div className="relative">
                        <div className="absolute inset-0 bg-orange-500/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Flame className="w-4 h-4 text-orange-400 relative group-hover:scale-125 transition-all duration-300 drop-shadow-lg group-hover:drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <div className="text-2xl font-bold text-white">{longestStreak}</div>
                      <span className="text-xs text-orange-300">days</span>
                    </div>
                  </div>
                </Card>

                <Card className="group relative bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-3 rounded-xl hover:border-purple-400/30 transition-all cursor-pointer overflow-hidden shadow-2xl shadow-black/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Top Percentile</span>
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-500/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        <TrendingUp className="w-4 h-4 text-purple-400 relative group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300 drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <div className="text-2xl font-bold text-white">
                        {userCheckIns.length >= 100 ? '1%' : userCheckIns.length >= 50 ? '5%' : userCheckIns.length >= 25 ? '10%' : userCheckIns.length >= 10 ? '25%' : '50%'}
                      </div>
                      {userCheckIns.length >= 50 && <span className="text-xs text-purple-400 animate-pulse">🌟</span>}
                    </div>
                  </div>
                </Card>

                <Card className="group relative bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-3 rounded-xl hover:border-green-400/30 transition-all cursor-pointer overflow-hidden shadow-2xl shadow-black/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Weight Up</span>
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Zap className="w-4 h-4 text-green-400 relative group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                       <div className="text-2xl font-bold text-white">
                         {(() => {
                           const sortedLogs = [...workoutLogs].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

                           if (sortedLogs.length < 2) return 0;

                           const firstLog = sortedLogs[0];
                           const latestLog = sortedLogs[sortedLogs.length - 1];

                           const firstWeight = firstLog.sets?.reduce((sum, set) => sum + (parseFloat(set.weight) || 0), 0) || 0;
                           const latestWeight = latestLog.sets?.reduce((sum, set) => sum + (parseFloat(set.weight) || 0), 0) || 0;

                           const increase = latestWeight - firstWeight;
                           return Math.round(increase);
                         })()}
                       </div>
                       <span className="text-xs text-green-300">kg</span>
                     </div>
                  </div>
                </Card>
              </div>



              {/* Badges Section */}
              <BadgesDisplay user={currentUser} checkIns={userCheckIns} />
            </TabsContent>

            <TabsContent value="posts" className="space-y-4">
                {/* Create Post Button & Grid Toggle */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowCreatePost(true)}
                    className="flex-1 bg-gradient-to-br from-blue-900/70 to-blue-950/70 backdrop-blur-xl border border-blue-500/30 hover:border-blue-400/50 hover:bg-gradient-to-br hover:from-blue-800/80 hover:to-blue-900/80 text-blue-100 rounded-xl shadow-xl shadow-blue-950/40 font-semibold transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                  <Button
                    onClick={() => setGridView(!gridView)}
                    className="bg-black hover:bg-slate-900 text-white rounded-xl border border-slate-700/50"
                    title={gridView ? "List view" : "Grid view"}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      {gridView ? (
                        // List icon
                        <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                      ) : (
                        // Grid icon
                        <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                      )}
                    </svg>
                  </Button>
                </div>

               {userPosts.filter(post => (post.content || post.image_url || post.video_url) && !post.content?.includes("Well done, workout")).length === 0 ? (
                <Card className="bg-slate-800/40 border border-slate-600/40 p-10 text-center rounded-2xl">
                  <div className="max-w-sm mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-2xl flex items-center justify-center">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">No Posts Yet</h4>
                    <p className="text-slate-400 text-sm">
                      Share your fitness journey with friends or your gym community!
                    </p>
                  </div>
                </Card>
              ) : (
                <div className={gridView ? "grid grid-cols-3 gap-2" : "w-full"}>
                  {userPosts.filter(post => (post.content || post.image_url || post.video_url) && !post.content?.includes("Well done, workout") && post.gym_join !== true).sort((a, b) => {
                    if (a.is_favourite === b.is_favourite) return 0;
                    return a.is_favourite ? -1 : 1;
                  }).map((post) => {
                    if (gridView) {
                      return (
                        <div key={post.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700/50 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedGridPost(post)}>
                          {post.video_url ? (
                            <video src={post.video_url} className="w-full h-full object-cover" />
                          ) : post.image_url ? (
                            <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-slate-500" />
                            </div>
                          )}
                          {post.is_favourite && (
                            <div className="absolute top-2 right-2">
                              <Star className="w-5 h-5 fill-amber-400 text-amber-400 drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return (
                       <PostCard 
                          key={post.id} 
                          post={post}
                          fullWidth={true}
                          isOwnProfile={true}
                          currentUser={currentUser}
                          onLike={() => {}}
                          onComment={() => {}}
                          onSave={() => {}}
                          onDelete={() => queryClient.invalidateQueries({ queryKey: ['userPosts'] })}
                        />
                      );
                    }
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
            {/* Goals Header */}
            <div className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/20">
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
              <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border-2 border-dashed border-white/10 p-10 text-center rounded-2xl shadow-2xl shadow-black/20">
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
        </Tabs>
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

      <ProfilePictureModal
        isOpen={showProfilePicture}
        onClose={() => setShowProfilePicture(false)}
        imageUrl={currentUser?.avatar_url}
        userName={displayName}
      />

      {/* Grid Post Modal */}
      {selectedGridPost && gridView && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-y-auto" onClick={() => setSelectedGridPost(null)}>
          <div onClick={(e) => e.stopPropagation()} className="relative w-full">
            <PostCard 
              post={selectedGridPost}
              fullWidth={false}
              onLike={() => {}}
              onComment={() => {}}
              onSave={() => {}}
              onDelete={() => {
                queryClient.invalidateQueries({ queryKey: ['userPosts'] });
                setSelectedGridPost(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Create Post</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowCreatePost(false);
                  setPostContent('');
                  setPostImage('');
                  setPostVideo('');
                  setAllowGymRepost(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="bg-slate-800/60 border border-slate-600/40 rounded-xl text-white placeholder:text-slate-500 min-h-[120px]"
              />

              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Add Image</label>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-slate-600/40 text-slate-300 hover:bg-slate-700/50"
                      onClick={(e) => e.currentTarget.previousElementSibling?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </label>
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="border-slate-600/40 text-slate-300 hover:bg-slate-700/50"
                      onClick={(e) => e.currentTarget.previousElementSibling?.click()}
                      disabled={uploading}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </label>
                </div>
                {postImage && (
                  <Input
                    value={postImage}
                    onChange={(e) => setPostImage(e.target.value)}
                    placeholder="Or paste image URL..."
                    className="bg-slate-800/60 border border-slate-600/40 rounded-xl text-white placeholder:text-slate-500 mt-2 text-xs"
                  />
                )}
              </div>

              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Add Video</label>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-slate-600/40 text-slate-300 hover:bg-slate-700/50"
                      onClick={(e) => e.currentTarget.previousElementSibling?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Video'}
                    </Button>
                  </label>
                  <label>
                    <input
                      type="file"
                      accept="video/*"
                      capture="environment"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="border-slate-600/40 text-slate-300 hover:bg-slate-700/50"
                      onClick={(e) => e.currentTarget.previousElementSibling?.click()}
                      disabled={uploading}
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                  </label>
                </div>
                {postVideo && (
                  <Input
                    value={postVideo}
                    onChange={(e) => setPostVideo(e.target.value)}
                    placeholder="Or paste video URL..."
                    className="bg-slate-800/60 border border-slate-600/40 rounded-xl text-white placeholder:text-slate-500 mt-2 text-xs"
                  />
                )}
              </div>

              {postImage && (
                <div className="rounded-xl overflow-hidden border border-slate-600/40">
                  <img src={postImage} alt="Preview" className="w-full h-48 object-cover" />
                </div>
              )}

              {postVideo && (
                <div className="rounded-xl overflow-hidden border border-slate-600/40">
                  <video src={postVideo} controls className="w-full h-64 bg-black" />
                </div>
              )}

              <div className="flex flex-col gap-2 p-3 bg-slate-800/40 border border-slate-600/40 rounded-xl">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="gym-repost"
                    checked={allowGymRepost}
                    onChange={(e) => setAllowGymRepost(e.target.checked)}
                    className="w-4 h-4 cursor-pointer mt-0.5 flex-shrink-0"
                  />
                  <label htmlFor="gym-repost" className="flex-1 cursor-pointer">
                    <p className="text-sm font-medium text-white mb-1">Allow gym community sharing</p>
                    <p className="text-xs text-slate-400">Gym admins can see and repost this to your gym's community feed</p>
                  </label>
                </div>
              </div>

              <Button
                onClick={() => createPostMutation.mutate({ content: postContent, image_url: postImage, video_url: postVideo, allow_gym_repost: allowGymRepost })}
                disabled={!postContent.trim() || createPostMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl shadow-lg font-semibold disabled:opacity-50"
              >
                {createPostMutation.isPending ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}