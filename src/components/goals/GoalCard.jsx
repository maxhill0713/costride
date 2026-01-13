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
    onUpdate(goal, newValue);
  };

  const handleManualUpdate = () => {
    onUpdate(goal, parseFloat(editValue));
    setIsEditing(false);
  };

  return (
    <Card className={`p-5 border-2 ${isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`font-bold text-lg ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
              {goal.title}
            </h3>
            {isCompleted && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
          </div>
          {goal.description && (
            <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
          )}
          {goal.exercise && (
            <Badge className="capitalize text-xs">{goal.exercise.replace('_', ' ')}</Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleReminder(goal)}
            className={goal.reminder_enabled ? 'text-blue-500' : 'text-gray-400'}
          >
            {goal.reminder_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(goal.id)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-700 font-medium">
              {getGoalDisplay()}
            </span>
            <span className="text-gray-500 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-400 to-purple-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {goal.deadline && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
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
                  className="rounded-xl"
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
                  className="rounded-xl"
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
                    className="rounded-xl"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleQuickUpdate(increment)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add {increment} {goal.unit || ''}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="rounded-xl"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
                {progress >= 100 && (
                  <Button
                    size="sm"
                    onClick={() => onUpdate(goal, goal.current_value, 'completed')}
                    className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl"
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