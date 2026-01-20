import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, TrendingUp, Award, Calendar, Dumbbell, Target, Share2, MapPin, Edit2, Save, X, Plus, Bell, BellOff, Moon, Sun, Lock, Globe, Ruler, Flame, Trophy, AlertCircle, Gift, Building2, CheckCircle, Tag } from 'lucide-react';
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
import ConsistencyJourney from '../components/profile/ConsistencyJourney';
import ClaimedRewardCard from '../components/rewards/ClaimedRewardCard';
import { useTranslation } from 'react-i18next';


export default function Profile() {
  const { t } = useTranslation();
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
    { days: 7, name: t('profile.badges.warrior7'), icon: '🔥', color: 'from-orange-400 to-red-500' },
    { days: 30, name: t('profile.badges.master30'), icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { days: 50, name: t('profile.badges.unstoppable'), icon: '💪', color: 'from-purple-400 to-pink-500' },
    { days: 100, name: t('profile.badges.champion100'), icon: '👑', color: 'from-blue-400 to-cyan-500' },
    { days: 365, name: t('profile.badges.legend365'), icon: '🏆', color: 'from-green-400 to-emerald-500' }
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

    if (workouts < 5) return { title: t('profile.identity.beginner'), subtitle: t('profile.identity.beginnerSub'), next: t('profile.identity.beginnerNext'), color: 'from-gray-400 to-gray-500' };
    if (workouts < 20) return { title: t('profile.identity.novice'), subtitle: t('profile.identity.noviceSub'), next: t('profile.identity.noviceNext'), color: 'from-blue-400 to-blue-500' };
    if (workouts < 50) return { title: t('profile.identity.committed'), subtitle: t('profile.identity.committedSub'), next: t('profile.identity.committedNext'), color: 'from-purple-400 to-purple-500' };
    if (streak < 30) return { title: t('profile.identity.dedicated'), subtitle: t('profile.identity.dedicatedSub'), next: t('profile.identity.dedicatedNext'), color: 'from-orange-400 to-orange-500' };
    if (prs < 10) return { title: t('profile.identity.elite'), subtitle: t('profile.identity.eliteSub'), next: t('profile.identity.eliteNext'), color: 'from-cyan-400 to-cyan-500' };
    return { title: t('profile.identity.champion'), subtitle: t('profile.identity.championSub'), next: t('profile.identity.championNext'), color: 'from-yellow-400 to-yellow-500' };
  };

  const identityStatus = getIdentityStatus();

  // Risk Assessment
  const getStreakRisk = () => {
    if (!lastCheckIn) return null;
    if (daysSinceCheckIn === 0) return { level: 'safe', message: t('profile.streakRisk.safe'), color: 'text-green-400' };
    if (daysSinceCheckIn === 1) return { level: 'safe', message: t('profile.streakRisk.safe1day'), color: 'text-green-400' };
    if (daysSinceCheckIn === 2) return { level: 'warning', message: t('profile.streakRisk.warning'), color: 'text-yellow-400' };
    if (daysSinceCheckIn === 3) return { level: 'danger', message: t('profile.streakRisk.danger'), color: 'text-orange-400' };
    return { level: 'lost', message: t('profile.streakRisk.lost'), color: 'text-red-400' };
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
        <p className="text-gray-500">{t('profile.loading')}</p>
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
                <label className="text-white text-sm font-medium mb-1 block">{t('profile.bio')}</label>
                <Textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder={t('profile.bioPlaceholder')}
                  className="bg-white/90 border-0 rounded-2xl text-gray-900"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-1 block">{t('profile.gymLocation')}</label>
                <Input
                  value={editData.gym_location}
                  onChange={(e) => setEditData({ ...editData, gym_location: e.target.value })}
                  placeholder={t('profile.gymLocationPlaceholder')}
                  className="bg-white/90 border-0 rounded-2xl text-gray-900"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-1 block">{t('profile.profilePhoto')}</label>
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
                <h3 className="font-black text-lg mb-1">{t('profile.weMissYou')} 🔥</h3>
                <p className="text-white/90 text-sm">
                  {t('profile.daysSince', { days: daysSinceCheckIn, streak: currentStreak })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
      <div className="max-w-2xl mx-auto px-4 -mt-16 mb-6">
        {/* Identity Card */}
        <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-cyan-600/30 p-5 mb-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-cyan-300 font-bold uppercase tracking-wide mb-1">{t('profile.yourIdentity')}</p>
              <h3 className={`text-2xl font-black bg-gradient-to-r ${identityStatus.color} bg-clip-text text-transparent`}>
                {identityStatus.title}
              </h3>
              <p className="text-sm text-slate-400 mt-1">{identityStatus.subtitle}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl mb-2">🏆</div>
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-2xl p-3 border border-cyan-600/20">
            <p className="text-xs text-cyan-300 font-bold mb-1">{t('profile.whatYoureBecoming')}</p>
            <p className="text-sm text-slate-200">{identityStatus.next}</p>
          </div>
        </Card>

        {/* Streak Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-cyan-600/30 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Flame className="w-8 h-8 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-cyan-300">{t('profile.currentStreak')}</p>
                  <p className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{currentStreak}</p>
                  <p className="text-xs text-cyan-300">{t('profile.days')}</p>
                </div>
              </div>
              {currentUser?.streak_freezes_available > 0 && (
                <div className="text-center px-2">
                  <span className="text-xl">❄️</span>
                  <p className="text-xs text-cyan-300 font-bold">{currentUser.streak_freezes_available}</p>
                </div>
              )}
            </div>
            {streakRisk && (
              <div className={`mt-2 px-3 py-1.5 rounded-lg ${
                streakRisk.level === 'safe' ? 'bg-green-900/30 border border-green-600/30' :
                streakRisk.level === 'warning' ? 'bg-yellow-900/30 border border-yellow-600/30' :
                streakRisk.level === 'danger' ? 'bg-orange-900/30 border border-orange-600/30' :
                'bg-red-900/30 border border-red-600/30'
              }`}>
                <p className={`text-xs font-bold ${streakRisk.color}`}>{streakRisk.message}</p>
              </div>
            )}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-cyan-300 mb-1">
                <span>{t('profile.next')}: {nextMilestone.name}</span>
                <span>{currentStreak}/{nextMilestone.days}</span>
              </div>
              <Progress value={streakProgress} className="h-2 bg-slate-600" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-purple-600/30 p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-purple-300">{t('profile.bestStreak')}</p>
                <p className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{longestStreak}</p>
                <p className="text-xs text-purple-300">{t('profile.daysEver')}</p>
              </div>
            </div>
            {currentStreak > 0 && longestStreak > currentStreak && (
              <div className="bg-purple-900/30 border border-purple-600/30 rounded-lg px-3 py-1.5">
                <p className="text-xs font-bold text-purple-300">💎 {t('profile.keepGoing')}</p>
              </div>
            )}
            {currentStreak === longestStreak && currentStreak > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg px-3 py-1.5">
                <p className="text-xs font-bold text-yellow-300">🔥 {t('profile.newRecord')}</p>
              </div>
            )}
          </Card>
        </div>



        {/* Protection & Risk Info */}
        {currentStreak > 0 && (
          <Card className="p-5 mb-4 bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-cyan-600/30 shadow-lg">
            <h3 className="font-semibold bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-cyan-400" />
              {t('profile.whatHappens')}
            </h3>
            <div className="space-y-3">
              <div className="bg-slate-700/50 rounded-2xl p-3">
                <p className="text-xs text-slate-400 mb-1">{t('profile.gracePeriod')}</p>
                <p className="text-sm text-slate-200">{t('profile.gracePeriodDesc', { streak: currentStreak })}</p>
              </div>
              {currentUser?.streak_freezes_available > 0 && (
                <div className="bg-cyan-900/30 border border-cyan-600/30 rounded-2xl p-3">
                  <p className="text-xs text-cyan-300 mb-1">{t('profile.protection')}</p>
                  <p className="text-sm text-slate-200">{t('profile.protectionDesc', { count: currentUser.streak_freezes_available, plural: currentUser.streak_freezes_available > 1 ? 's' : '' })}</p>
                </div>
              )}
              <div className="bg-orange-900/30 border border-orange-600/30 rounded-2xl p-3">
                <p className="text-xs text-orange-300 mb-1">{t('profile.whatYouLose')}</p>
                <p className="text-sm text-slate-200">{t('profile.whatYouLoseDesc', { streak: currentStreak, milestone: nextMilestone.name })}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Milestone Badges */}
        {earnedBadges.length > 0 && (
          <Card className="p-5 mb-4 bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-yellow-600/30 shadow-lg">
            <h3 className="font-semibold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              {t('profile.milestonesUnlocked')}
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
            <div className="text-xs text-cyan-300 font-bold mt-2 uppercase tracking-wide">{t('profile.workouts')}</div>
          </Card>
          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-5 text-center shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-3xl font-black bg-gradient-to-br from-orange-400 to-red-400 bg-clip-text text-transparent">{stats.personalRecords}</div>
            <div className="text-xs text-orange-300 font-bold mt-2 uppercase tracking-wide">{t('profile.prs')}</div>
          </Card>
          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-5 text-center shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-3xl font-black bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.weekStreak}</div>
            <div className="text-xs text-purple-300 font-bold mt-2 uppercase tracking-wide">{t('profile.dayStreak')}</div>
          </Card>
        </div>


      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full mb-6 bg-gradient-to-br from-slate-700/90 to-slate-800/90 backdrop-blur-sm border border-blue-600/30 p-1.5 rounded-2xl shadow-sm overflow-x-auto gap-1">
            <TabsTrigger value="progress" className="flex-shrink-0 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs md:text-sm whitespace-nowrap text-slate-400 px-3 py-2">
              {t('profile.progress')}
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex-shrink-0 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs md:text-sm whitespace-nowrap text-slate-400 px-3 py-2">
              {t('profile.goals')}
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex-shrink-0 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs md:text-sm whitespace-nowrap text-slate-400 px-3 py-2">
              {t('profile.rewards')}
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex-shrink-0 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs md:text-sm whitespace-nowrap text-slate-400 px-3 py-2">
              {t('profile.badges')}
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex-shrink-0 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs md:text-sm whitespace-nowrap text-slate-400 px-3 py-2">
              {t('profile.achievements')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-shrink-0 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs md:text-sm whitespace-nowrap text-slate-400 px-3 py-2">
              <Settings className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">{t('profile.settings')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <ConsistencyJourney totalCheckIns={userCheckIns.length} />

            {/* Progress Stats */}
            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-5 shadow-lg">
              <h3 className="font-semibold text-white mb-4">{t('profile.yourProgress')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-300 uppercase">{t('profile.checkIns')}</span>
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{userCheckIns.length}</div>
                </div>
                <div className="bg-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-orange-300 uppercase">{t('profile.currentStreak')}</span>
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">{currentStreak}</div>
                </div>
                <div className="bg-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-300 uppercase">{t('profile.workouts')}</span>
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.totalLifts}</div>
                </div>
                <div className="bg-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-300 uppercase">{t('profile.prs')}</span>
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
                  <span className="text-xs font-bold text-slate-300">{t('profile.memberAt', { count: memberGyms.length, plural: memberGyms.length > 1 ? 's' : '' })}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* In-Gym Rewards */}
              <Card 
                className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 backdrop-blur-sm border border-purple-600/40 p-6 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                onClick={() => window.location.hash = '#/GymRewards'}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">In-Gym Rewards</h3>
                    <p className="text-sm text-slate-300 mb-3">Free day passes and gym offers</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="px-3 py-1 bg-purple-500/30 text-purple-200 text-sm font-bold rounded-full">
                        {claimedRewards.length} Claimed
                      </span>
                      <span className="px-3 py-1 bg-green-500/30 text-green-200 text-sm font-bold rounded-full">
                        {unclaimedRewards.length} Available
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Brand Rewards */}
              <Card 
                className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-cyan-600/40 p-6 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                onClick={() => window.location.hash = '#/BrandDiscounts'}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Tag className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Brand Rewards</h3>
                    <p className="text-sm text-slate-300 mb-3">Discount codes & gift cards</p>
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl">
                      View Codes
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-purple-600/40 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{t('profile.yourRewards')}</h3>
                  <p className="text-sm text-slate-300">{t('profile.claimRewards')}</p>
                </div>
              </div>

              {availableRewards.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="w-16 h-16 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-300 mb-2">{t('profile.noRewards')}</p>
                  <p className="text-sm text-slate-400">{t('profile.joinGym')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Claimed Rewards */}
                  {claimedRewards.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-green-300 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {t('profile.claimedRewards')} ({claimedRewards.length})
                      </h4>
                      <div className="grid gap-4">
                        {claimedRewards.map((reward) => {
                          const claimedBonus = claimedBonuses.find(cb => 
                            cb.gym_id === reward.gym_id && 
                            cb.offer_details === reward.title
                          );
                          const gym = allGyms.find(g => g.id === reward.gym_id);
                          
                          return claimedBonus ? (
                            <ClaimedRewardCard
                              key={reward.id}
                              claimedBonus={claimedBonus}
                              reward={reward}
                              gym={gym}
                            />
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Available Rewards */}
                  {unclaimedRewards.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        {t('profile.availableRewards')} ({unclaimedRewards.length})
                      </h4>
                      <div className="grid gap-4">
                        {unclaimedRewards.map((reward) => {
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
                                return true;
                              default:
                                return false;
                            }
                          })();

                          return (
                            <Card key={reward.id} className={`p-5 border-2 transition-all ${
                              meetsRequirement 
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
                                    
                                    {!meetsRequirement ? (
                                      <span className="text-xs text-gray-500 font-medium">
                                        {t('profile.locked')}
                                      </span>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => claimRewardMutation.mutate({
                                          reward,
                                          userId: currentUser.id
                                        })}
                                        disabled={claimRewardMutation.isPending}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl"
                                      >
                                        {t('profile.claimNow')}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Stats */}
            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-5 shadow-lg">
              <h4 className="font-semibold text-white mb-4">{t('profile.yourProgress')}</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{t('profile.totalCheckIns')}</span>
                  <span className="font-bold text-slate-100">{userCheckInCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{t('profile.currentStreakDays')}</span>
                  <span className="font-bold text-slate-100">{currentStreak} {t('profile.days')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{t('profile.gymsJoined')}</span>
                  <span className="font-bold text-slate-100">{gymMemberships.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{t('profile.rewardsClaimed')}</span>
                  <span className="font-bold text-slate-100">
                    {allRewards.filter(r => r.claimed_by?.includes(currentUser?.id)).length}
                  </span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <BadgesDisplay user={currentUser} checkIns={userCheckIns} />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {[
              { icon: Award, title: t('profile.achievements.workouts100'), desc: t('profile.achievements.workouts100Desc'), color: 'from-yellow-400 to-orange-500', unlocked: true },
              { icon: TrendingUp, title: t('profile.achievements.prCrusher'), desc: t('profile.achievements.prCrusherDesc'), color: 'from-red-400 to-pink-500', unlocked: true },
              { icon: Dumbbell, title: t('profile.achievements.ironWarrior'), desc: t('profile.achievements.ironWarriorDesc'), color: 'from-purple-400 to-purple-600', unlocked: false },
              { icon: Calendar, title: t('profile.achievements.streak30'), desc: t('profile.achievements.streak30Desc'), color: 'from-blue-400 to-cyan-500', unlocked: false }
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

          <TabsContent value="goals" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                {t('profile.myGoals')}
              </h3>
              <Button
                onClick={() => setShowAddGoal(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl shadow-lg"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('profile.addGoal')}
              </Button>
            </div>

            {activeGoals.length === 0 ? (
              <Card className="p-8 text-center border-2 border-dashed border-slate-600/50 bg-gradient-to-br from-slate-700/50 to-slate-800/50">
                <Target className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-300 mb-2">{t('profile.noGoals')}</p>
                <Button
                  onClick={() => setShowAddGoal(true)}
                  variant="outline"
                  size="sm"
                >
                  {t('profile.setFirstGoal')}
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
                  <h3 className="text-lg font-semibold text-white">{t('profile.notifications')}</h3>
                  <p className="text-sm text-slate-300">{t('profile.notificationDesc')}</p>
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
                      <Label className="text-sm font-bold text-slate-100">{t('profile.pushNotifications')}</Label>
                      <p className="text-xs text-slate-400">{t('profile.pushDesc')}</p>
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
                      <Label className="text-sm font-bold text-slate-100">{t('profile.emailNotifications')}</Label>
                      <p className="text-xs text-slate-400">{t('profile.emailDesc')}</p>
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
                  <h3 className="text-lg font-semibold text-white">{t('profile.appearance')}</h3>
                  <p className="text-sm text-slate-300">{t('profile.appearanceDesc')}</p>
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
                      <Label className="text-sm font-bold text-slate-100">{t('profile.darkMode')}</Label>
                      <p className="text-xs text-slate-400">{t('profile.darkModeDesc')}</p>
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
                      <Label className="text-sm font-bold text-slate-100">{t('profile.unitSystem')}</Label>
                      <p className="text-xs text-slate-400">{t('profile.unitSystemDesc')}</p>
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
                      <SelectItem value="imperial">{t('profile.imperial')}</SelectItem>
                      <SelectItem value="metric">{t('profile.metric')}</SelectItem>
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
                  <h3 className="text-lg font-semibold text-white">{t('profile.accountDetails')}</h3>
                  <p className="text-sm text-slate-300">{t('profile.accountDesc')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-700/50 rounded-2xl">
                  <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t('profile.emailAddress')}</Label>
                  <Input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="bg-slate-800/50 border-slate-600 text-slate-100 rounded-xl"
                  />
                  <p className="text-xs text-slate-400 mt-1">{t('profile.contactSupport')}</p>
                </div>

                <div className="p-4 bg-slate-700/50 rounded-2xl">
                  <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t('profile.password')}</Label>
                  <Input
                    type="password"
                    value="••••••••"
                    disabled
                    className="bg-slate-800/50 border-slate-600 text-slate-100 rounded-xl"
                  />
                  <p className="text-xs text-slate-400 mt-1">{t('profile.resetPassword')}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('profile.privacy')}</h3>
                  <p className="text-sm text-slate-300">{t('profile.privacyDesc')}</p>
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
                    <Label className="text-sm font-bold text-slate-100">{t('profile.publicProfile')}</Label>
                    <p className="text-xs text-slate-400">{t('profile.publicProfileDesc')}</p>
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
                  <h3 className="text-base font-bold text-red-900">{t('profile.dangerZone')}</h3>
                  <p className="text-sm text-red-700">{t('profile.irreversibleActions')}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-2 border-red-300 text-red-700 hover:bg-red-50 rounded-2xl font-semibold"
                onClick={() => {
                  if (confirm(t('profile.logoutConfirm'))) {
                    base44.auth.logout();
                  }
                }}
              >
                {t('profile.logout')}
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