import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Target, Calendar, TrendingUp, CheckCircle2, Trash2, Bell, BellOff, Plus, Minus, Edit3 } from 'lucide-react';
import { format } from 'date-fns';

export default function GoalCard({ goal, onUpdate, onDelete, onToggleReminder }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(goal.current_value);
  
  const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
  const isCompleted = goal.status === 'completed' || progress >= 100;

  const getGoalDisplay = () => {
    if (goal.goal_type === 'frequency') {
      return `${goal.current_value} / ${goal.target_value} times ${goal.frequency_period}`;
    } else if (goal.goal_type === 'consistency') {
      return `${goal.current_value} / ${goal.target_value} day streak`;
    } else {
      return `${goal.current_value} / ${goal.target_value} ${goal.unit}`;
    }
  };

  const getIncrementAmount = () => {
    if (goal.goal_type === 'consistency' || goal.goal_type === 'frequency') {
      return 1;
    }
    // For numerical goals, smart increment based on unit
    if (goal.unit === 'lbs' || goal.unit === 'kg') {
      return goal.target_value > 100 ? 5 : 2.5;
    }
    return 1;
  };

  const increment = getIncrementAmount();

  const handleQuickUpdate = (change) => {
    const newValue = Math.max(0, goal.current_value + change);
    const updatedMilestones = goal.milestones?.map(m => ({
      ...m,
      reached: newValue >= m.value
    })) || [];
    onUpdate(goal, newValue, goal.status, updatedMilestones);
  };

  const handleManualUpdate = () => {
    const newValue = parseFloat(editValue);
    const updatedMilestones = goal.milestones?.map(m => ({
      ...m,
      reached: newValue >= m.value
    })) || [];
    onUpdate(goal, newValue, goal.status, updatedMilestones);
    setIsEditing(false);
  };

  return (
    <Card className={`p-5 rounded-2xl backdrop-blur-md border ${
      isCompleted 
        ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/30 border-green-500/40' 
        : 'bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-600/40'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`font-bold text-lg ${isCompleted ? 'text-green-300' : 'text-white'}`}>
              {goal.title}
            </h3>
            {isCompleted && (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            )}
          </div>
          {goal.description && (
            <p className="text-sm text-slate-300 mb-2">{goal.description}</p>
          )}
          {goal.exercise && (
            <Badge className="capitalize text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40">{goal.exercise.replace('_', ' ')}</Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleReminder(goal)}
            className={goal.reminder_enabled ? 'text-blue-400 hover:bg-blue-500/20' : 'text-slate-500 hover:bg-slate-700/50'}
          >
            {goal.reminder_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(goal.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-200 font-medium">
              {getGoalDisplay()}
            </span>
            <span className="text-slate-400 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {goal.deadline && (
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Calendar className="w-4 h-4" />
            <span>Deadline: {format(new Date(goal.deadline), 'MMM d, yyyy')}</span>
          </div>
        )}

        {!isCompleted && (
          <div className="space-y-2">
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="rounded-xl bg-slate-700/50 border-slate-600/50 text-white"
                  step={increment}
                />
                <Button
                  size="sm"
                  onClick={handleManualUpdate}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditValue(goal.current_value);
                  }}
                  className="rounded-xl border-slate-600 text-slate-300 hover:bg-slate-700/50"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickUpdate(-increment)}
                    className="rounded-xl border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleQuickUpdate(increment)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add {increment} {goal.unit || ''}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="rounded-xl border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
                {progress >= 100 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const updatedMilestones = goal.milestones?.map(m => ({ ...m, reached: true })) || [];
                      onUpdate(goal, goal.current_value, 'completed', updatedMilestones);
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Mark Complete
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}