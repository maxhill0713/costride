import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, TrendingUp, CheckCircle2, Trash2, Bell, BellOff } from 'lucide-react';
import { format } from 'date-fns';

export default function GoalCard({ goal, onUpdate, onDelete, onToggleReminder }) {
  const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
  const isCompleted = goal.status === 'completed' || progress >= 100;

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
              {goal.current_value} / {goal.target_value} {goal.unit}
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
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdate(goal, goal.current_value + 1)}
              className="flex-1 rounded-xl"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Update Progress
            </Button>
            {progress >= 100 && (
              <Button
                size="sm"
                onClick={() => onUpdate(goal, goal.current_value, 'completed')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl"
              >
                Mark Complete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}