import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Trophy, Flame, CheckCircle, MapPin } from 'lucide-react';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import { Progress } from '@/components/ui/progress';

export default function Groups() {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser?.id }, '-created_date'),
    enabled: !!currentUser
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['allCheckIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date'),
    enabled: !!currentUser
  });

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts', currentUser?.id],
    queryFn: () => base44.entities.Lift.filter({ member_id: currentUser.id }, '-lift_date'),
    enabled: !!currentUser
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements', currentUser?.id],
    queryFn: () => base44.entities.Achievement.filter({ user_id: currentUser.id }),
    enabled: !!currentUser
  });

  const createGoalMutation = useMutation({
    mutationFn: (goalData) => base44.entities.Goal.create({
      ...goalData,
      user_id: currentUser.id,
      user_name: currentUser.full_name
    }),
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
    mutationFn: (goalId) => base44.entities.Goal.delete(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  // Calculate current streak
  const calculateStreak = () => {
    if (checkIns.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < checkIns.length; i++) {
      const checkInDate = new Date(checkIns[i].check_in_date);
      checkInDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - checkInDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff === streak + 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();
  const totalCheckIns = checkIns.length;
  const totalLifts = lifts.length;
  const totalAchievements = achievements.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 pb-24">
      <div className="max-w-7xl mx-auto p-6 pt-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tight">Your Progress</h1>
          <p className="text-gray-600 text-lg">Track your fitness journey with precision and clarity</p>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Check-ins</span>
            </div>
            <div className="text-4xl font-black text-gray-900">{totalCheckIns}</div>
            <p className="text-xs text-gray-500 mt-2">Total gym visits</p>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Streak</span>
            </div>
            <div className="text-4xl font-black text-gray-900">{currentStreak}</div>
            <p className="text-xs text-gray-500 mt-2">Consecutive days</p>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Lifts</span>
            </div>
            <div className="text-4xl font-black text-gray-900">{totalLifts}</div>
            <p className="text-xs text-gray-500 mt-2">Workouts logged</p>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Achievements</span>
            </div>
            <div className="text-4xl font-black text-gray-900">{totalAchievements}</div>
            <p className="text-xs text-gray-500 mt-2">Milestones reached</p>
          </Card>
        </div>

        {/* Goals Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              Your Goals
            </h2>
            <Button
              onClick={() => setShowAddGoal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-6 py-6 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">Add Goal</span>
            </Button>
          </div>

          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                Active Goals
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {activeGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onUpdate={(data) => updateGoalMutation.mutate({ id: goal.id, data })}
                    onDelete={() => deleteGoalMutation.mutate(goal.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                Completed Goals
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {completedGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onUpdate={(data) => updateGoalMutation.mutate({ id: goal.id, data })}
                    onDelete={() => deleteGoalMutation.mutate(goal.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Goals State */}
          {activeGoals.length === 0 && completedGoals.length === 0 && (
            <Card className="p-16 text-center bg-white border-0 shadow-lg">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No goals yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Set your first goal and start tracking your progress with precision and clarity!</p>
              <Button
                onClick={() => setShowAddGoal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="font-semibold">Add Your First Goal</span>
              </Button>
            </Card>
          )}
        </div>

        <AddGoalModal
          open={showAddGoal}
          onClose={() => setShowAddGoal(false)}
          onSave={(data) => createGoalMutation.mutate(data)}
          isLoading={createGoalMutation.isPending}
        />
      </div>
    </div>
  );
}