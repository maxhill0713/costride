import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Target, Calendar, TrendingUp, CheckCircle2, Trash2, Bell, BellOff, Plus, Minus, Edit3, Zap, Flame, Trophy, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import confetti from 'canvas-confetti';

export default function GoalCard({ goal, onUpdate, onDelete, onToggleReminder }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(goal.current_value);
  
  const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
  const isCompleted = goal.status === 'completed' || progress >= 100;
  
  const daysRemaining = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const isUrgent = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0;

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
    const newProgress = (newValue / goal.target_value) * 100;
    const updatedMilestones = goal.milestones?.map(m => ({
      ...m,
      reached: newValue >= m.value
    })) || [];
    
    // Celebration for milestones
    if (newProgress >= 100 && progress < 100) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else if (newProgress >= 75 && progress < 75) {
      confetti({ particleCount: 50, spread: 50 });
    }
    
    onUpdate(goal, newValue, goal.status, updatedMilestones);
    setIsEditing(false);
  };
  
  const handleQuickSetPercent = (percent) => {
    const newValue = (percent / 100) * goal.target_value;
    const updatedMilestones = goal.milestones?.map(m => ({
      ...m,
      reached: newValue >= m.value
    })) || [];
    onUpdate(goal, newValue, goal.status, updatedMilestones);
  };
  
  const getMotivationalMessage = () => {
    if (progress >= 100) return { icon: '🎉', message: 'Goal achieved!', color: 'text-green-400' };
    if (progress >= 75) return { icon: '🔥', message: 'Almost there!', color: 'text-orange-400' };
    if (progress >= 50) return { icon: '💪', message: 'Halfway done!', color: 'text-yellow-400' };
    if (progress >= 25) return { icon: '⚡', message: 'Great start!', color: 'text-blue-400' };
    return { icon: '🎯', message: 'Let\'s go!', color: 'text-slate-400' };
  };
  
  const motivational = getMotivationalMessage();
  
  const getGoalIcon = () => {
    if (goal.goal_type === 'consistency') return Flame;
    if (goal.goal_type === 'frequency') return Zap;
    return Trophy;
  };
  
  const GoalIcon = getGoalIcon();

  return (
    <Card className={`p-5 rounded-2xl backdrop-blur-md border overflow-hidden ${
      isCompleted 
        ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/30 border-green-500/40 shadow-lg shadow-green-500/20' 
        : 'bg-gradient-to-br from-slate-800/80 to-slate-900/70 border-slate-600/50'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isCompleted ? 'bg-green-500/20' : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
          }`}>
            <GoalIcon className={`w-6 h-6 ${isCompleted ? 'text-green-400' : 'text-blue-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-black text-lg truncate ${isCompleted ? 'text-green-300' : 'text-white'}`}>
                {goal.title}
              </h3>
              {isCompleted && (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              )}
            </div>
            {goal.description && (
              <p className="text-sm text-slate-400 line-clamp-2">{goal.description}</p>
            )}
            {goal.exercise && (
              <Badge className="capitalize text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40 mt-2">{goal.exercise.replace('_', ' ')}</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleReminder(goal)}
            className={`rounded-lg ${goal.reminder_enabled ? 'text-blue-400 hover:bg-blue-500/20' : 'text-slate-500 hover:bg-slate-700/50'}`}
          >
            {goal.reminder_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(goal.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-3">
        <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/50">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase block mb-1">Progress</span>
              <span className="text-white font-bold text-xl">
                {getGoalDisplay()}
              </span>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-black ${motivational.color}`}>
                {Math.round(progress)}%
              </div>
              <span className="text-xs text-slate-500">complete</span>
            </div>
          </div>
          
          {/* Enhanced Progress Bar with Milestones */}
          <div className="relative">
            <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Milestone markers */}
            {[25, 50, 75].map(milestone => (
              <div
                key={milestone}
                className="absolute top-0 bottom-0 w-0.5 bg-slate-600"
                style={{ left: `${milestone}%` }}
              >
                <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-5 rounded-full ${
                  progress >= milestone ? 'bg-cyan-400' : 'bg-slate-600'
                }`} />
              </div>
            ))}
          </div>
          
          {/* Motivational Message */}
          {!isCompleted && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-lg">{motivational.icon}</span>
              <span className={`text-sm font-semibold ${motivational.color}`}>{motivational.message}</span>
            </div>
          )}
        </div>

        {/* Deadline Info */}
        {goal.deadline && (
          <div className={`flex items-center justify-between p-3 rounded-xl border ${
            isOverdue 
              ? 'bg-red-900/20 border-red-600/40' 
              : isUrgent 
                ? 'bg-orange-900/20 border-orange-600/40' 
                : 'bg-slate-800/40 border-slate-700/50'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-slate-400'}`} />
              <span className="text-sm text-slate-300">
                {format(new Date(goal.deadline), 'MMM d, yyyy')}
              </span>
            </div>
            {daysRemaining !== null && (
              <Badge className={`text-xs ${
                isOverdue 
                  ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                  : isUrgent 
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' 
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}>
                {isOverdue ? 'Overdue' : `${daysRemaining}d left`}
              </Badge>
            )}
          </div>
        )}

        {!isCompleted && (
          <div className="space-y-2">
            {/* Auto-updated goals (consistency/frequency) - no manual controls */}
            {(goal.goal_type === 'consistency' || goal.goal_type === 'frequency') ? (
              <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  Auto-tracked from check-ins
                </p>
              </div>
            ) : (
              /* Manual update for numerical goals */
              isEditing ? (
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-3">
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Set Value</label>
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
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold"
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
                </div>
              ) : (
                <>
                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleQuickUpdate(increment)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold shadow-lg"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add {increment} {goal.unit || ''}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="rounded-xl border-slate-600 text-slate-300 hover:bg-slate-700/50 px-3"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )
            )}
            
            {progress >= 100 && (
              <Button
                size="sm"
                onClick={() => {
                  confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
                  const updatedMilestones = goal.milestones?.map(m => ({ ...m, reached: true })) || [];
                  onUpdate(goal, goal.current_value, 'completed', updatedMilestones);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg font-bold text-sm h-11"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Mark Complete 🎉
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}