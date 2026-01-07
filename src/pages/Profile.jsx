import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, TrendingUp, Award, Calendar, Dumbbell, Target, Share2, MapPin, Edit2, Save, X, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ bio: '', gym_location: '', avatar_url: '' });
  const [showAddGoal, setShowAddGoal] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts'],
    queryFn: () => base44.entities.Lift.list('-created_date')
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser.id }),
    enabled: !!currentUser
  });

  const memberLifts = lifts.filter(l => l.member_name === currentUser?.full_name);

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

  const stats = {
    totalLifts: memberLifts.length,
    personalRecords: memberLifts.filter(l => l.is_pr).length,
    totalWeight: memberLifts.reduce((sum, l) => sum + (l.weight_lbs * (l.reps || 1)), 0),
    bestLift: Math.max(...memberLifts.map(l => l.weight_lbs), 0),
    weekStreak: 5
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 px-4 pt-8 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg">
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-purple-500">
                    {currentUser.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-black">{currentUser.full_name}</h1>
                <p className="text-purple-100 text-sm">{currentUser.email}</p>
              </div>
            </div>
            {!isEditing ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-5 h-5" />
              </Button>
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

      {/* Stats Cards */}
      <div className="max-w-2xl mx-auto px-4 -mt-16 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white border-2 border-gray-100 p-4 text-center shadow-md">
            <div className="text-2xl font-black text-gray-900">{stats.totalLifts}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">Workouts</div>
          </Card>
          <Card className="bg-white border-2 border-gray-100 p-4 text-center shadow-md">
            <div className="text-2xl font-black text-orange-500">{stats.personalRecords}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">PRs</div>
          </Card>
          <Card className="bg-white border-2 border-gray-100 p-4 text-center shadow-md">
            <div className="text-2xl font-black text-purple-500">{stats.weekStreak}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">Day Streak</div>
          </Card>
        </div>

        {/* Share Weekly Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Weekly Summary</h3>
              <p className="text-sm text-gray-600">
                {stats.totalLifts} workouts • {stats.personalRecords} PRs • {stats.weekStreak} day streak
              </p>
            </div>
            <Button 
              onClick={() => {
                const summary = `💪 My Week in Fitness:\n✅ ${stats.totalLifts} workouts completed\n🔥 ${stats.personalRecords} personal records\n⚡ ${stats.weekStreak} day streak\n🏋️ ${stats.totalWeight.toLocaleString()} lbs total lifted`;
                navigator.clipboard.writeText(summary);
                alert('Weekly summary copied to clipboard!');
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border-2 border-gray-100 p-1 rounded-2xl">
            <TabsTrigger value="progress" className="rounded-xl font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Progress
            </TabsTrigger>
            <TabsTrigger value="achievements" className="rounded-xl font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <Card className="bg-white border-2 border-gray-100 p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
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
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  My Goals
                </h3>
                <Button
                  onClick={() => setShowAddGoal(true)}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Goal
                </Button>
              </div>

              {activeGoals.length === 0 ? (
                <Card className="p-8 text-center border-2 border-dashed border-gray-200">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 mb-2">No goals set yet</p>
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

          <TabsContent value="achievements" className="space-y-4">
            {[
              { icon: Award, title: '100 Workouts', desc: 'Completed 100 training sessions', color: 'from-yellow-400 to-orange-500', unlocked: true },
              { icon: TrendingUp, title: 'PR Crusher', desc: 'Set 10 personal records', color: 'from-red-400 to-pink-500', unlocked: true },
              { icon: Dumbbell, title: 'Iron Warrior', desc: 'Lift 100,000 lbs total', color: 'from-purple-400 to-purple-600', unlocked: false },
              { icon: Calendar, title: '30 Day Streak', desc: 'Train for 30 consecutive days', color: 'from-blue-400 to-cyan-500', unlocked: false }
            ].map((achievement, idx) => (
              <Card key={idx} className={`bg-white border-2 border-gray-100 p-5 ${achievement.unlocked ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center shadow-md`}>
                    <achievement.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{achievement.title}</h4>
                    <p className="text-sm text-gray-500">{achievement.desc}</p>
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
              <Card key={lift.id} className="bg-white border-2 border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 capitalize">{lift.exercise?.replace(/_/g, ' ')}</h4>
                      <p className="text-sm text-gray-500">{new Date(lift.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xl font-black text-gray-900">{lift.weight_lbs}</div>
                      <div className="text-xs text-gray-500">lbs {lift.reps && `× ${lift.reps}`}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        const summary = `💪 Just completed ${lift.exercise.replace(/_/g, ' ')} - ${lift.weight_lbs} lbs${lift.reps ? ` × ${lift.reps} reps` : ''}! ${lift.is_pr ? '🔥 NEW PR!' : ''}`;
                        navigator.clipboard.writeText(summary);
                        alert('Workout summary copied! Share it with your friends.');
                      }}
                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
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