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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-6xl mx-auto p-4 pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900">Your Progress</h1>
          <p className="text-gray-600">Track your fitness journey</p>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-900 uppercase">Check-ins</span>
            </div>
            <div className="text-3xl font-black text-blue-900">{totalCheckIns}</div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold text-orange-900 uppercase">Streak</span>
            </div>
            <div className="text-3xl font-black text-orange-900">{currentStreak}</div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-900 uppercase">Lifts</span>
            </div>
            <div className="text-3xl font-black text-purple-900">{totalLifts}</div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-green-900 uppercase">Achievements</span>
            </div>
            <div className="text-3xl font-black text-green-900">{totalAchievements}</div>
          </Card>
        </div>

        {/* Goals Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-500" />
              Your Goals
            </h2>
            <Button
              onClick={() => setShowAddGoal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Goal
            </Button>
          </div>

          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Active Goals</h3>
              <div className="grid md:grid-cols-2 gap-4">
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
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-green-500" />
                Completed Goals
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
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
            <Card className="p-12 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No goals yet</p>
              <p className="text-sm text-gray-400 mb-4">Set your first goal and start tracking your progress!</p>
              <Button
                onClick={() => setShowAddGoal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Goal
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