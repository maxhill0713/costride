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
import BadgesModal from '../components/profile/BadgesModal';
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
  const [editData, setEditData] = useState({ gym_location: '', avatar_url: '' });
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showEditHero, setShowEditHero] = useState(false);
  const [showEditAvatar, setShowEditAvatar] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [heatmapFilter, setHeatmapFilter] = useState('month');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postVideo, setPostVideo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [gridView, setGridView] = useState(true);
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
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date', 200),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const memberGymIds = gymMemberships.map((m) => m.gym_id);

  const { data: memberGymsData = [] } = useQuery({
    queryKey: ['memberGyms', currentUser?.id],
    queryFn: async () => {
      if (memberGymIds.length === 0) return [];
      const results = await Promise.all(
        memberGymIds.map((id) => base44.entities.Gym.filter({ id }).then((r) => r[0]).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: !!currentUser && gymMemberships.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const { data: allChallenges = [] } = useQuery({
    queryKey: ['completedChallenges'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'completed' }, '-created_date', 50),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const displayName = currentUser?.username || currentUser?.full_name;
  const memberLifts = lifts;
  const userCheckIns = checkIns;
  const memberGyms = memberGymsData;
  const primaryGymId = currentUser?.primary_gym_id;
  const primaryGym = memberGymsData.find((g) => g.id === primaryGymId);

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
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previousGoals = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) =>
        old.map((goal) => goal.id === id ? { ...goal, ...data } : goal)
      );
      return { previousGoals };
    },
    onError: (err, variables, context) => {
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
        old.filter((g) => g.id !== id)
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
    const updateData = { current_value: newValue, status: status || goal.status };
    if (milestones) { updateData.milestones = milestones; }
    updateGoalMutation.mutate({ id: goal.id, data: updateData });
  };

  const handleToggleReminder = (goal) => {
    updateGoalMutation.mutate({ id: goal.id, data: { reminder_enabled: !goal.reminder_enabled } });
  };

  const activeGoals = goals.filter((g) => g.status === 'active');
  const currentStreak = currentUser?.current_streak || 0;
  const longestStreak = currentUser?.longest_streak || 0;
  const lastCheckIn = currentUser?.last_check_in_date;
  const daysSinceCheckIn = lastCheckIn ? Math.floor((new Date() - new Date(lastCheckIn)) / (1000 * 60 * 60 * 24)) : null;

  const streakMilestones = [
    { days: 7, name: '7 Day Warrior', icon: '🔥', color: 'from-orange-400 to-red-500' },
    { days: 30, name: 'Monthly Master', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { days: 50, name: 'Unstoppable', icon: '💪', color: 'from-purple-400 to-pink-500' },
    { days: 100, name: 'Century Champion', icon: '👑', color: 'from-blue-400 to-cyan-500' },
    { days: 365, name: 'Year Legend', icon: '🏆', color: 'from-green-400 to-emerald-500' }
  ];

  const nextMilestone = streakMilestones.find((m) => m.days > currentStreak) || streakMilestones[streakMilestones.length - 1];
  const streakProgress = currentStreak / nextMilestone.days * 100;
  const earnedBadges = streakMilestones.filter((m) => longestStreak >= m.days);
  const completedChallenges = allChallenges.filter((c) => c.status === 'completed' && c.participants?.includes(currentUser?.id)).length;

  const stats = {
    totalLifts: memberLifts.length,
    personalRecords: memberLifts.filter((l) => l.is_pr).length,
    totalWeight: memberLifts.reduce((sum, l) => sum + l.weight_lbs * (l.reps || 1), 0),
    bestLift: Math.max(...memberLifts.map((l) => l.weight_lbs), 0),
    weekStreak: currentStreak,
    challengesCompleted: completedChallenges
  };

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
    return memberLifts
      .filter((l) => l.exercise === 'bench_press')
      .slice(0, 10)
      .reverse()
      .map((l, i) => ({ session: `S${i + 1}`, weight: l.weight_lbs }));
  };

  if (!currentUser) return null;

  const tabTriggerClass = "flex-1 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900/80 backdrop-blur-md text-slate-400 font-bold rounded-full px-2 py-1.5 flex items-center justify-center border border-slate-500/50 shadow-[0_3px_0_0_#172033,0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_0_20px_rgba(255,255,255,0.03)] data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:via-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* ── BANNER ── */}
        <div className="relative w-full overflow-hidden border-b border-slate-700/50">
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-800/60 to-slate-950">
            {currentUser.hero_image_url &&
              <>
                <img src={currentUser.hero_image_url} alt="" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-slate-900/50 to-slate-950/80" />
              </>
            }
          </div>
          <div className="absolute top-3 right-4 z-30">
            <Link to={createPageUrl('Settings')} className="p-2 -m-2">
              <Settings className="lucide lucide-settings w-6 h-6 text-slate-300 hover:text-white transition-colors -translate-y-5" />
            </Link>
          </div>
          <div className="relative z-10 pt-3 pb-0 px-4 max-w-4xl mx-auto">
            <div className="flex items-start gap-6 mb-5">
              <button
                onClick={() => setShowProfilePicture(true)}
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-slate-700/50 cursor-pointer hover:ring-blue-500/50 transition-all active:scale-95 flex-shrink-0">
                {currentUser.avatar_url ?
                  <img src={currentUser.avatar_url} alt={displayName} className="w-full h-full object-cover" /> :
                  <span className="text-3xl font-semibold text-white tracking-tight">{displayName?.charAt(0)?.toUpperCase()}</span>
                }
              </button>
              <div className="pt-1 flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <h1 className="text-xl md:text-2xl font-medium tracking-[-0.02em] text-white leading-tight">{displayName}</h1>
                  <StatusBadge checkIns={userCheckIns} streak={currentStreak} size="sm" />
                </div>
                <button onClick={() => setShowBadgesModal(true)} className="flex items-center gap-2 mt-1 hover:opacity-80 transition-opacity">
                  {currentUser?.equipped_badges?.length > 0 ?
                    currentUser.equipped_badges.map((badgeId) => {
                      const badge = streakMilestones.find((m) => `${m.days}_day_streak` === badgeId) ||
                        [
                          { id: '10_visits', icon: '🎯', color: 'from-blue-400 to-blue-600' },
                          { id: '50_visits', icon: '🔥', color: 'from-orange-400 to-red-500' },
                          { id: '100_visits', icon: '🏆', color: 'from-yellow-400 to-orange-500' },
                          { id: '7_day_streak', icon: '⚡', color: 'from-green-400 to-emerald-500' },
                          { id: '30_day_streak', icon: '🔥', color: 'from-red-400 to-pink-500' },
                          { id: '90_day_streak', icon: '👑', color: 'from-purple-400 to-pink-500' },
                          { id: '1_year', icon: '📅', color: 'from-indigo-400 to-blue-500' },
                          { id: 'community_leader', icon: '👥', color: 'from-cyan-400 to-blue-500' }
                        ].find((b) => b.id === badgeId);
                      if (!badge) return null;
                      return (
                        <div key={badgeId} className={`w-9 h-9 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg ring-2 ring-slate-600/40 cursor-pointer hover:scale-110 transition-transform`} title={badge.name || badgeId}>
                          <span className="text-base">{badge.icon}</span>
                        </div>
                      );
                    }) :
                    [0, 1, 2].map((i) =>
                      <div key={`empty-${i}`} className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg ring-2 ring-slate-600/40 cursor-pointer hover:ring-blue-400/50 transition-all opacity-60 hover:opacity-80">
                        <span className="text-base">✨</span>
                      </div>
                    )
                  }
                </button>
              </div>
            </div>
            {isEditing ?
              <div className="space-y-3 mb-1">
                <div>
                  <label className="text-slate-300 text-sm font-medium mb-2 block tracking-[-0.01em]">Gym Location</label>
                  <Input value={editData.gym_location} onChange={(e) => setEditData({ ...editData, gym_location: e.target.value })} placeholder="e.g. Iron Paradise, Manchester" className="bg-slate-800/60 border border-slate-600/40 rounded-xl text-white placeholder:text-slate-500" />
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium mb-2 block tracking-[-0.01em]">Profile Photo</label>
                  <div className="flex gap-2">
                    <Input value={editData.avatar_url} onChange={(e) => setEditData({ ...editData, avatar_url: e.target.value })} placeholder="https://..." className="bg-slate-800/60 border border-slate-600/40 rounded-xl text-white placeholder:text-slate-500" />
                    <Button type="button" onClick={() => setShowEditAvatar(true)} className="bg-slate-700/60 hover:bg-slate-600/70 text-white border border-slate-600/40 backdrop-blur-sm rounded-xl px-4">
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div> :
              <div className="space-y-1 mb-1">
                {currentUser.gym_location &&
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-normal tracking-[-0.01em]">{currentUser.gym_location}</span>
                  </div>
                }
                {primaryGym &&
                  <Link to={createPageUrl('GymCommunity') + `?id=${primaryGym.id}`}>
                    <div className="flex items-center gap-2 flex-wrap cursor-pointer hover:opacity-80 transition-opacity mt-1">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">{primaryGym.name}</Badge>
                    </div>
                  </Link>
                }
              </div>
            }
          </div>
        </div>
        {/* ── END BANNER ── */}

        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-3 pb-6">
          <TabsContent value="posts" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => setShowCreatePost(true)} className="[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-9 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 backdrop-blur-md text-white font-bold rounded-full px-4 py-2 flex items-center gap-2 justify-center border border-slate-500/50 shadow-[0_3px_0_0_#0369a1,0_8px_20px_rgba(6,100,200,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.05)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu flex-1">
                <Plus className="w-4 h-4 mr-2" />Create Post
              </Button>
              {currentUser?.workout_split &&
                <button onClick={() => setShowSplitModal(true)} className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-b from-cyan-400 via-cyan-500 to-blue-600 backdrop-blur-md text-white font-bold rounded-full px-3 py-1.5 flex items-center gap-2 justify-center border border-transparent shadow-[0_3px_0_0_#0369a1,0_8px_20px_rgba(6,100,200,0.4),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.05)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu">
                  <Calendar className="w-3 h-3" />Edit Split
                </button>
              }
              <Button onClick={() => setGridView(!gridView)} className="[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-9 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 backdrop-blur-md text-white font-bold rounded-full px-3 py-1.5 flex items-center gap-2 justify-center border border-slate-500/50 shadow-[0_3px_0_0_#0369a1,0_8px_20px_rgba(6,100,200,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.05)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu" title={gridView ? "List view" : "Grid view"}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  {gridView ? <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" /> : <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />}
                </svg>
              </Button>
            </div>
            {userPosts.filter((post) => (post.content || post.image_url || post.video_url) && !post.content?.includes("Well done, workout")).length === 0 ?
              <Card className="bg-slate-800/40 border border-slate-600/40 p-10 text-center rounded-2xl">
                <div className="max-w-sm mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-2xl flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">No Posts Yet</h4>
                  <p className="text-slate-400 text-sm">Share your fitness journey with friends or your gym community!</p>
                </div>
              </Card> :
              <div className={gridView ? "grid grid-cols-3 gap-2" : "w-full"}>
                {userPosts.filter((post) => (post.image_url || post.video_url) && !post.content?.includes("Well done, workout") && post.gym_join !== true).sort((a, b) => {
                  if (a.is_favourite === b.is_favourite) return 0;
                  return a.is_favourite ? -1 : 1;
                }).map((post) => {
                  if (gridView) {
                    return (
                      <div key={post.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700/50 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedGridPost(post)}>
                        {post.video_url ? <video src={post.video_url} className="w-full h-full object-cover" /> :
                          post.image_url ? <img src={post.image_url} alt="Post" className="w-full h-full object-cover" /> :
                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center"><FileText className="w-8 h-8 text-slate-500" /></div>
                        }
                        {post.is_favourite && <div className="absolute top-2 right-2"><Star className="w-5 h-5 fill-amber-400 text-amber-400 drop-shadow-lg" /></div>}
                      </div>
                    );
                  } else {
                    return <PostCard key={post.id} post={post} fullWidth={true} isOwnProfile={true} currentUser={currentUser} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => queryClient.invalidateQueries({ queryKey: ['userPosts'] })} />;
                  }
                })}
              </div>
            }
          </TabsContent>

        </div>
      </Tabs>

      {/* Modals */}
      <EditHeroImageModal open={showEditHero} onClose={() => setShowEditHero(false)} currentImageUrl={currentUser?.hero_image_url} onSave={(hero_image_url) => updateHeroMutation.mutate(hero_image_url)} isLoading={updateHeroMutation.isPending} />
      <EditHeroImageModal open={showEditAvatar} onClose={() => setShowEditAvatar(false)} currentImageUrl={currentUser?.avatar_url} onSave={(avatar_url) => updateAvatarMutation.mutate(avatar_url)} isLoading={updateAvatarMutation.isPending} />
      <CreateSplitModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} currentUser={currentUser} />
      <BadgesModal isOpen={showBadgesModal} onClose={() => setShowBadgesModal(false)} user={currentUser} checkIns={userCheckIns} />
      <ProfilePictureModal isOpen={showProfilePicture} onClose={() => setShowProfilePicture(false)} imageUrl={currentUser?.avatar_url} userName={displayName}>
        <div className="space-y-4">
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
                      return Math.round(latestWeight - firstWeight);
                    })()}
                  </div>
                  <span className="text-xs text-green-300">kg</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </ProfilePictureModal>

      {selectedGridPost && gridView &&
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto" onClick={() => setSelectedGridPost(null)}>
          <div onClick={(e) => e.stopPropagation()} className="relative w-full">
            <PostCard post={selectedGridPost} fullWidth={false} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => { queryClient.invalidateQueries({ queryKey: ['userPosts'] }); setSelectedGridPost(null); }} />
          </div>
        </div>
      }

      {showCreatePost &&
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Create Post</h3>
              <Button variant="ghost" size="icon" onClick={() => { setShowCreatePost(false); setPostContent(''); setPostImage(''); setPostVideo(''); setAllowGymRepost(false); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <Textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="What's on your mind?" className="bg-slate-800/60 border border-slate-600/40 rounded-xl text-white placeholder:text-slate-500 min-h-[120px]" />
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Add Image</label>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} className="hidden" />
                    <Button type="button" variant="outline" className="w-full border-slate-600/40 text-slate-300 hover:bg-slate-700/50" onClick={(e) => e.currentTarget.previousElementSibling?.click()} disabled={uploading}>
                      <Upload className="w-4 h-4 mr-2" />{uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </label>
                  <label>
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} className="hidden" />
                    <Button type="button" variant="outline" size="icon" className="border-slate-600/40 text-slate-300 hover:bg-slate-700/50" onClick={(e) => e.currentTarget.previousElementSibling?.click()} disabled={uploading}>
                      <Camera className="w-4 h-4" />
                    </Button>
                  </label>
                </div>
                {postImage && <Input value={postImage} onChange={(e) => setPostImage(e.target.value)} placeholder="Or paste image URL..." className="bg-slate-800/60 border border-slate-600/40 rounded-xl text-white placeholder:text-slate-500 mt-2 text-xs" />}
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Add Video</label>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')} className="hidden" />
                    <Button type="button" variant="outline" className="w-full border-slate-600/40 text-slate-300 hover:bg-slate-700/50" onClick={(e) => e.currentTarget.previousElementSibling?.click()} disabled={uploading}>
                      <Upload className="w-4 h-4 mr-2" />{uploading ? 'Uploading...' : 'Upload Video'}
                    </Button>
                  </label>
                  <label>
                    <input type="file" accept="video/*" capture="environment" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')} className="hidden" />
                    <Button type="button" variant="outline" size="icon" className="border-slate-600/40 text-slate-300 hover:bg-slate-700/50" onClick={(e) => e.currentTarget.previousElementSibling?.click()} disabled={uploading}>
                      <Video className="w-4 h-4" />
                    </Button>
                  </label>
                </div>
                {postVideo && <Input value={postVideo} onChange={(e) => setPostVideo(e.target.value)} placeholder="Or paste video URL..." className="bg-slate-800/60 border border-slate-600/40 rounded-xl text-white placeholder:text-slate-500 mt-2 text-xs" />}
              </div>
              {postImage && <div className="rounded-xl overflow-hidden border border-slate-600/40"><img src={postImage} alt="Preview" className="w-full h-48 object-cover" /></div>}
              {postVideo && <div className="rounded-xl overflow-hidden border border-slate-600/40"><video src={postVideo} controls className="w-full h-64 bg-black" /></div>}
              <div className="flex flex-col gap-2 p-3 bg-slate-800/40 border border-slate-600/40 rounded-xl">
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="gym-repost" checked={allowGymRepost} onChange={(e) => setAllowGymRepost(e.target.checked)} className="w-4 h-4 cursor-pointer mt-0.5 flex-shrink-0" />
                  <label htmlFor="gym-repost" className="flex-1 cursor-pointer">
                    <p className="text-sm font-medium text-white mb-1">Allow gym community sharing</p>
                    <p className="text-xs text-slate-400">Gym admins can see and repost this to your gym's community feed</p>
                  </label>
                </div>
              </div>
              <Button onClick={() => createPostMutation.mutate({ content: postContent, image_url: postImage, video_url: postVideo, allow_gym_repost: allowGymRepost })} disabled={!postContent.trim() || createPostMutation.isPending} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl shadow-lg font-semibold disabled:opacity-50">
                {createPostMutation.isPending ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </Card>
        </div>
      }
    </div>
  );
}