import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Settings, TrendingUp, Calendar, Dumbbell, Target, MapPin, X, Plus, Flame, Building2, Camera, FileText, BarChart3, Image as ImageIcon, Video, Zap, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import BadgesModal from '../components/profile/BadgesModal';
import StatusBadge from '../components/profile/StatusBadge';
import WorkoutSplitHeatmap from '../components/profile/WorkoutSplitHeatmap';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';
import CreateSplitModal from '../components/profile/CreateSplitModal';
import WorkoutProgressTracker from '../components/profile/WorkoutProgressTracker';
import ProfilePictureModal from '../components/profile/ProfilePictureModal';
import PostCard from '../components/feed/PostCard';
import ExerciseInsights from '../components/profile/ExerciseInsights';

export default function Profile() {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showEditHero, setShowEditHero] = useState(false);
  const [showEditAvatar, setShowEditAvatar] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
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
  const userCheckIns = checkIns;
  const primaryGymId = currentUser?.primary_gym_id;
  const primaryGym = memberGymsData.find((g) => g.id === primaryGymId);
  const currentStreak = currentUser?.current_streak || 0;
  const longestStreak = currentUser?.longest_streak || 0;
  const activeGoals = goals.filter((g) => g.status === 'active');
  const filteredPosts = userPosts.filter((post) => (post.image_url || post.video_url) && !post.content?.includes("Well done, workout") && post.gym_join !== true);

  const streakMilestones = [
    { days: 7, name: '7 Day Warrior', icon: '🔥', color: 'from-orange-400 to-red-500' },
    { days: 30, name: 'Monthly Master', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { days: 50, name: 'Unstoppable', icon: '💪', color: 'from-purple-400 to-pink-500' },
    { days: 100, name: 'Century Champion', icon: '👑', color: 'from-blue-400 to-cyan-500' },
    { days: 365, name: 'Year Legend', icon: '🏆', color: 'from-green-400 to-emerald-500' }
  ];

  const updateHeroMutation = useMutation({
    mutationFn: (hero_image_url) => base44.auth.updateMe({ hero_image_url }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentUser'] }); setShowEditHero(false); }
  });

  const updateAvatarMutation = useMutation({
    mutationFn: (avatar_url) => base44.auth.updateMe({ avatar_url }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentUser'] }); setShowEditAvatar(false); }
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['goals', currentUser?.id] });
      const previous = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => [...old, { id: `temp-${Date.now()}`, ...data, status: 'active', current_value: 0 }]);
      return { previous };
    },
    onError: (err, data, context) => { queryClient.setQueryData(['goals', currentUser?.id], context.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); setShowAddGoal(false); }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previousGoals = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => old.map((goal) => goal.id === id ? { ...goal, ...data } : goal));
      return { previousGoals };
    },
    onError: (err, variables, context) => { queryClient.setQueryData(['goals', currentUser?.id], context.previousGoals); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['goals', currentUser?.id] });
      const previous = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => old.filter((g) => g.id !== id));
      return { previous };
    },
    onError: (err, id, context) => { queryClient.setQueryData(['goals', currentUser?.id], context.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); }
  });

  const handleFileUpload = async (file, type) => {
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'image') setPostImage(file_url);
      else setPostVideo(file_url);
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
      setShowCreatePost(false); setPostContent(''); setPostImage(''); setPostVideo(''); setAllowGymRepost(false);
      return { previous };
    },
    onError: (err, data, context) => { queryClient.setQueryData(['userPosts', currentUser?.id], context.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['userPosts'] }); }
  });

  const handleUpdateGoal = (goal, newValue, status, milestones) => {
    const updateData = { current_value: newValue, status: status || goal.status };
    if (milestones) updateData.milestones = milestones;
    updateGoalMutation.mutate({ id: goal.id, data: updateData });
  };

  const handleToggleReminder = (goal) => {
    updateGoalMutation.mutate({ id: goal.id, data: { reminder_enabled: !goal.reminder_enabled } });
  };

  if (!currentUser) return null;

  const btnClass = "bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 text-white font-bold rounded-full px-4 py-1.5 flex items-center gap-1.5 justify-center border border-transparent shadow-[0_3px_0_0_#0369a1,0_6px_16px_rgba(6,100,200,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";
  const btnSecondaryClass = "bg-slate-800/70 border border-slate-600/50 text-slate-200 font-bold rounded-full px-4 py-1.5 flex items-center gap-1.5 justify-center shadow-[0_3px_0_0_#0f172a,inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";
  const tabTriggerClass = "flex-1 py-3 text-xs font-bold text-slate-500 border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white transition-all duration-150 rounded-none bg-transparent";

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">

      {/* ── TOP BAR: username + settings ── */}
      <div className="max-w-4xl mx-auto px-4 pt-5 flex items-center justify-between">
        <h1 className="text-xl font-black text-white tracking-tight">{displayName}</h1>
        <Link
          to={createPageUrl('Settings')}
          className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/60 transition-colors active:scale-95"
        >
          <Settings className="w-5 h-5 text-slate-300" />
        </Link>
      </div>

      {/* ── PROFILE HEADER ── */}
      <div className="max-w-4xl mx-auto px-4 pt-5 pb-4">

        {/* Row 1: avatar + stats */}
        <div className="flex items-center gap-5 mb-5">
          {/* Avatar with gradient ring */}
          <button onClick={() => setShowProfilePicture(true)} className="relative flex-shrink-0 active:scale-95 transition-transform">
            <div className="w-[82px] h-[82px] rounded-full p-[2.5px] bg-gradient-to-tr from-blue-500 via-cyan-400 to-indigo-500 shadow-lg shadow-blue-900/40">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
                {currentUser.avatar_url
                  ? <img src={currentUser.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  : <span className="text-2xl font-black text-white">{displayName?.charAt(0)?.toUpperCase()}</span>
                }
              </div>
            </div>
          </button>

          {/* Stats: Posts · Streak */}
          <div className="flex flex-1 justify-around text-center">
            <div>
              <p className="text-[22px] font-black text-white leading-tight">{filteredPosts.length}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Posts</p>
            </div>
            <div>
              <p className="text-[22px] font-black text-white leading-tight">{currentStreak}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Streak 🔥</p>
            </div>
            <div>
              <p className="text-[22px] font-black text-white leading-tight">{longestStreak}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Best Streak</p>
            </div>
          </div>
        </div>

        {/* Row 2: bio + location + gym */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <StatusBadge checkIns={userCheckIns} streak={currentStreak} size="sm" />
          </div>
          {currentUser.bio && (
            <p className="text-sm text-slate-200 leading-snug">{currentUser.bio}</p>
          )}
          {currentUser.gym_location && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs">{currentUser.gym_location}</span>
            </div>
          )}
          {primaryGym && (
            <Link to={createPageUrl('GymCommunity') + `?id=${primaryGym.id}`}>
              <div className="flex items-center gap-1.5 mt-0.5 w-fit">
                <Building2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="text-xs text-blue-400 font-semibold">{primaryGym.name}</span>
              </div>
            </Link>
          )}
        </div>

        {/* Row 3: badges */}
        {currentUser?.equipped_badges?.length > 0 && (
          <button onClick={() => setShowBadgesModal(true)} className="flex items-center gap-2 mb-4 active:scale-95 transition-transform">
            {currentUser.equipped_badges.map((badgeId) => {
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
                <div key={badgeId} className={`w-8 h-8 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-md ring-1 ring-black/30`}>
                  <span className="text-sm">{badge.icon}</span>
                </div>
              );
            })}
            <span className="text-[11px] text-slate-500 ml-0.5">tap to edit</span>
          </button>
        )}

        {/* Row 4: action buttons — + post and Edit Split */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreatePost(true)}
            className={btnClass + " flex-1"}
          >
            <Plus className="w-3.5 h-3.5" />New Post
          </button>
          <button
            onClick={() => setShowSplitModal(true)}
            className={btnSecondaryClass + " flex-1"}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            {currentUser?.workout_split ? 'Edit Split' : 'Create Split'}
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="max-w-4xl mx-auto border-b border-slate-700/50">
          <TabsList className="w-full flex bg-transparent p-0 gap-0 h-auto rounded-none">
            {/* Posts */}
            <TabsTrigger value="posts" className={tabTriggerClass}>
              <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
              </svg>
            </TabsTrigger>
            {/* Analytics */}
            <TabsTrigger value="insights" className={tabTriggerClass}>
              <BarChart3 className="w-[18px] h-[18px]" />
            </TabsTrigger>
            {/* Goals */}
            <TabsTrigger value="goals" className={tabTriggerClass}>
              <Target className="w-[18px] h-[18px]" />
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="max-w-4xl mx-auto pb-32">

          {/* ── POSTS TAB ── */}
          <TabsContent value="posts" className="mt-0">
            {/* view toggle */}
            <div className="flex justify-end px-3 pt-2 pb-0.5">
              <button onClick={() => setGridView(!gridView)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                {gridView
                  ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" /></svg>
                  : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" /></svg>
                }
              </button>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center mb-4">
                  <Camera className="w-7 h-7 text-slate-500" />
                </div>
                <p className="text-base font-black text-white mb-1">Share Photos</p>
                <p className="text-sm text-slate-400 mb-4">When you share photos, they'll appear here.</p>
                <button onClick={() => setShowCreatePost(true)} className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
                  Share your first photo
                </button>
              </div>
            ) : gridView ? (
              <div className="grid grid-cols-3 gap-px bg-slate-800/20">
                {filteredPosts.sort((a, b) => (a.is_favourite === b.is_favourite ? 0 : a.is_favourite ? -1 : 1)).map((post) => (
                  <div
                    key={post.id}
                    className="relative aspect-square bg-slate-900 cursor-pointer overflow-hidden"
                    onClick={() => setSelectedGridPost(post)}
                  >
                    {post.video_url
                      ? <video src={post.video_url} className="w-full h-full object-cover" />
                      : <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    }
                    {post.is_favourite && (
                      <div className="absolute top-1.5 right-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 drop-shadow" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 pt-3 space-y-4">
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} fullWidth={true} isOwnProfile={true} currentUser={currentUser} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => queryClient.invalidateQueries({ queryKey: ['userPosts'] })} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── INSIGHTS TAB ── */}
          <TabsContent value="insights" className="px-4 pt-4 space-y-4">
            <ExerciseInsights workoutLogs={workoutLogs} workoutSplit={currentUser?.custom_workout_types} trainingDays={currentUser?.training_days} />
          </TabsContent>

          {/* ── GOALS TAB ── */}
          <TabsContent value="goals" className="px-4 pt-4 space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowAddGoal(true)} className={btnClass}>
                <Plus className="w-3.5 h-3.5" />New Goal
              </button>
            </div>
            {activeGoals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center mb-4">
                  <Target className="w-7 h-7 text-slate-500" />
                </div>
                <p className="text-base font-black text-white mb-1">No Goals Yet</p>
                <p className="text-sm text-slate-400 mb-4">Set your first fitness goal and start tracking progress.</p>
                <button onClick={() => setShowAddGoal(true)} className={btnClass}>
                  <Plus className="w-3.5 h-3.5" />Create a Goal
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdateGoal} onDelete={(id) => deleteGoalMutation.mutate(id)} onToggleReminder={handleToggleReminder} />
                ))}
              </div>
            )}
          </TabsContent>

        </div>
      </Tabs>

      {/* ── MODALS ── */}
      <EditHeroImageModal open={showEditHero} onClose={() => setShowEditHero(false)} currentImageUrl={currentUser?.hero_image_url} onSave={(url) => updateHeroMutation.mutate(url)} isLoading={updateHeroMutation.isPending} />
      <EditHeroImageModal open={showEditAvatar} onClose={() => setShowEditAvatar(false)} currentImageUrl={currentUser?.avatar_url} onSave={(url) => updateAvatarMutation.mutate(url)} isLoading={updateAvatarMutation.isPending} />
      <CreateSplitModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} currentUser={currentUser} />
      <BadgesModal isOpen={showBadgesModal} onClose={() => setShowBadgesModal(false)} user={currentUser} checkIns={userCheckIns} />
      <ProfilePictureModal isOpen={showProfilePicture} onClose={() => setShowProfilePicture(false)} imageUrl={currentUser?.avatar_url} userName={displayName}>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Streak', value: currentStreak, suffix: ' days', icon: Flame, color: 'text-orange-400' },
            { label: 'Best', value: longestStreak, suffix: ' days', icon: '🏆', color: '' },
            { label: 'Goals', value: goals.filter(g => g.status === 'completed').length, suffix: '', icon: Target, color: 'text-green-400' },
          ].map(({ label, value, suffix, icon: Icon, color }) => (
            <Card key={label} className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-xl text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
              <p className="text-xl font-black text-white">{value}<span className="text-xs text-slate-400 font-normal">{suffix}</span></p>
            </Card>
          ))}
        </div>
      </ProfilePictureModal>

      {/* Grid post lightbox */}
      {selectedGridPost && gridView && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedGridPost(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
            <PostCard post={selectedGridPost} fullWidth={false} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => { queryClient.invalidateQueries({ queryKey: ['userPosts'] }); setSelectedGridPost(null); }} />
          </div>
        </div>
      )}

      {/* Create post sheet */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <Card className="bg-slate-900 border border-slate-700/60 rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white">New Post</h3>
              <button onClick={() => { setShowCreatePost(false); setPostContent(''); setPostImage(''); setPostVideo(''); setAllowGymRepost(false); }} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-700 flex-shrink-0 flex items-center justify-center">
                  {currentUser.avatar_url
                    ? <img src={currentUser.avatar_url} className="w-full h-full object-cover" />
                    : <span className="text-sm font-black text-white">{displayName?.charAt(0)}</span>
                  }
                </div>
                <Textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Share your workout..." className="bg-transparent border-none text-white placeholder:text-slate-500 min-h-[80px] p-0 focus-visible:ring-0 resize-none text-sm flex-1" />
              </div>
              {postImage && <div className="rounded-xl overflow-hidden border border-slate-700/50"><img src={postImage} alt="Preview" className="w-full max-h-48 object-cover" /></div>}
              {postVideo && <div className="rounded-xl overflow-hidden border border-slate-700/50"><video src={postVideo} controls className="w-full max-h-48 bg-black" /></div>}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-700/40">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} className="hidden" />
                  <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/60 transition-colors">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')} className="hidden" />
                  <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/60 transition-colors">
                    <Video className="w-4 h-4 text-slate-400" />
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} className="hidden" />
                  <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/60 transition-colors">
                    <Camera className="w-4 h-4 text-slate-400" />
                  </div>
                </label>
                <div className="flex items-center gap-1.5 ml-1">
                  <input type="checkbox" id="gym-repost" checked={allowGymRepost} onChange={(e) => setAllowGymRepost(e.target.checked)} className="w-3.5 h-3.5 cursor-pointer" />
                  <label htmlFor="gym-repost" className="text-[11px] text-slate-400 cursor-pointer">Allow gym share</label>
                </div>
                <button
                  onClick={() => createPostMutation.mutate({ content: postContent, image_url: postImage, video_url: postVideo, allow_gym_repost: allowGymRepost })}
                  disabled={!postContent.trim() || createPostMutation.isPending}
                  className={btnClass + " ml-auto disabled:opacity-40"}
                >
                  {createPostMutation.isPending ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <AddGoalModal open={showAddGoal} onClose={() => setShowAddGoal(false)} onSave={(data) => createGoalMutation.mutate(data)} currentUser={currentUser} isLoading={createGoalMutation.isPending} />
    </div>
  );
}
