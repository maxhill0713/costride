import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dumbbell, Calendar, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function CreateSplitModal({ isOpen, onClose, currentUser }) {
  const [selectedSplit, setSelectedSplit] = useState(currentUser?.workout_split || '');
  const [weeklyGoal, setWeeklyGoal] = useState(currentUser?.weekly_goal || 3);
  const [selectedDays, setSelectedDays] = useState(currentUser?.training_days || [1, 3, 5]); // Default Mon, Wed, Fri
  const [customSplitName, setCustomSplitName] = useState(currentUser?.custom_split_name || '');
  const queryClient = useQueryClient();

  const updateSplitMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Workout split updated!');
      onClose();
    }
  });

  const splits = [
    {
      id: 'custom',
      name: 'Custom Split',
      description: 'Create your own personalized training schedule',
      schedule: ['Custom', 'Custom', 'Custom', 'Custom', 'Custom', 'Custom', 'Rest'],
      gradient: 'from-violet-500 via-fuchsia-500 to-pink-500',
      recommended: 4,
      defaultDays: [1, 2, 4, 5]
    },
    {
      id: 'ppl',
      name: 'Push/Pull/Legs',
      description: 'Push, Pull, Legs - Classic 6-day split',
      schedule: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'],
      gradient: 'from-red-500 via-blue-500 to-green-500',
      recommended: 6,
      defaultDays: [1, 2, 3, 4, 5, 6] // Mon-Sat
    },
    {
      id: 'upper_lower',
      name: 'Upper/Lower',
      description: 'Alternate between upper and lower body',
      schedule: ['Upper', 'Lower', 'Rest', 'Upper', 'Lower', 'Rest', 'Rest'],
      gradient: 'from-purple-500 to-orange-500',
      recommended: 4,
      defaultDays: [1, 2, 4, 5] // Mon, Tue, Thu, Fri
    },
    {
      id: 'full_body',
      name: 'Full Body',
      description: 'Train everything each session',
      schedule: ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Rest'],
      gradient: 'from-cyan-500 to-blue-500',
      recommended: 3,
      defaultDays: [1, 3, 5] // Mon, Wed, Fri
    },
    {
      id: 'bro_split',
      name: 'Bro Split',
      description: 'One muscle group per day',
      schedule: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Rest', 'Rest'],
      gradient: 'from-pink-500 via-yellow-500 to-green-500',
      recommended: 5,
      defaultDays: [1, 2, 3, 4, 5] // Mon-Fri
    }
  ];

  const handleSave = () => {
    const data = {
      workout_split: selectedSplit,
      weekly_goal: weeklyGoal,
      training_days: selectedDays
    };
    
    if (selectedSplit === 'custom') {
      data.custom_split_name = customSplitName || 'Custom Split';
    }
    
    updateSplitMutation.mutate(data);
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50 shadow-2xl">
        <DialogHeader>
          <div className="text-center space-y-2 pb-4 border-b border-slate-700/50">
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <DialogTitle className="text-3xl font-black text-white">
              Choose Your Training Split
            </DialogTitle>
            <p className="text-slate-400 text-sm">
              Select a program that matches your goals and schedule
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Split Options */}
          <div className="grid gap-3">
            {splits.map((split) => (
              <div
                key={split.id}
                onClick={() => {
                  setSelectedSplit(split.id);
                  setWeeklyGoal(split.recommended);
                  setSelectedDays(split.defaultDays);
                }}
                className={`
                  p-5 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]
                  ${selectedSplit === split.id 
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-indigo-500/20 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20' 
                    : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1.5">{split.name}</h3>
                    <p className="text-sm text-slate-400">{split.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/60 text-xs font-bold text-slate-200 border border-slate-600/40">
                    <Calendar className="w-3.5 h-3.5" />
                    {split.recommended}x/week
                  </div>
                </div>

                {/* Schedule Preview */}
                <div className="flex gap-2">
                  {split.schedule.map((day, i) => (
                    <div
                      key={i}
                      className={`
                        flex-1 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white
                        bg-gradient-to-br ${split.gradient} shadow-md
                        ${selectedSplit === split.id ? 'shadow-lg' : 'opacity-70'}
                      `}
                    >
                      {day.slice(0, 1)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Split Name */}
          {selectedSplit === 'custom' && (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-lg">
              <Label className="text-white flex items-center gap-2 mb-4 text-base font-bold">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-violet-400" />
                </div>
                Name Your Split
              </Label>
              <input
                type="text"
                value={customSplitName}
                onChange={(e) => setCustomSplitName(e.target.value)}
                placeholder="e.g., Upper/Lower 2x, My Custom Routine"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-3">
                Give your custom split a name to easily identify it
              </p>
            </div>
          )}

          {/* Weekly Goal */}
          {selectedSplit && (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-lg">
              <Label className="text-white flex items-center gap-2 mb-4 text-base font-bold">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                Weekly Training Goal
              </Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                  className="flex-1 h-3 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 w-20 text-center">
                  {weeklyGoal}x
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                How many times per week do you plan to train?
              </p>
            </div>
          )}

          {/* Training Days Selection */}
          {selectedSplit && (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-lg">
              <Label className="text-white flex items-center gap-2 mb-4 text-base font-bold">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                Select Your Training Days
              </Label>
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day, index) => {
                  const dayNumber = index + 1;
                  const isSelected = selectedDays.includes(dayNumber);
                  return (
                    <button
                      key={dayNumber}
                      type="button"
                      onClick={() => toggleDay(dayNumber)}
                      className={`
                        p-3 rounded-xl border-2 transition-all font-bold text-sm flex flex-col items-center gap-1 hover:scale-105 active:scale-95
                        ${isSelected 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400/50 text-white shadow-lg shadow-indigo-500/30' 
                          : 'bg-slate-700/40 border-slate-600/40 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                        }
                      `}
                    >
                      <span>{day}</span>
                      {!isSelected && <span className="text-[9px] opacity-60">Rest</span>}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-3 font-medium">
                {selectedDays.length} {selectedDays.length === 1 ? 'day' : 'days'} selected • {7 - selectedDays.length} rest {7 - selectedDays.length === 1 ? 'day' : 'days'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              className="flex-1 h-12 bg-slate-800/60 border-2 border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600 rounded-xl font-bold transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedSplit || (selectedSplit === 'custom' && !customSplitName.trim()) || updateSplitMutation.isPending}
              className="flex-1 h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateSplitMutation.isPending ? 'Saving...' : 'Save Split'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}