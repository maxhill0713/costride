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
    updateSplitMutation.mutate({
      workout_split: selectedSplit,
      weekly_goal: weeklyGoal,
      training_days: selectedDays
    });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-indigo-400" />
            Choose Your Training Split
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Split Options */}
          <div className="grid gap-4">
            {splits.map((split) => (
              <div
                key={split.id}
                onClick={() => {
                  setSelectedSplit(split.id);
                  setWeeklyGoal(split.recommended);
                  setSelectedDays(split.defaultDays);
                }}
                className={`
                  p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${selectedSplit === split.id 
                    ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/50' 
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{split.name}</h3>
                    <p className="text-sm text-slate-400">{split.description}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-700/50 text-xs text-slate-300">
                    <Calendar className="w-3 h-3" />
                    {split.recommended}x/week
                  </div>
                </div>

                {/* Schedule Preview */}
                <div className="flex gap-1">
                  {split.schedule.map((day, i) => (
                    <div
                      key={i}
                      className={`
                        flex-1 h-8 rounded flex items-center justify-center text-[10px] font-bold text-white
                        bg-gradient-to-br ${split.gradient} opacity-80
                      `}
                    >
                      {day.slice(0, 1)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Weekly Goal */}
          {selectedSplit && (
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <Label className="text-white flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-emerald-400" />
                Weekly Training Goal
              </Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="text-2xl font-bold text-indigo-400 w-16 text-center">
                  {weeklyGoal}x
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                How many times per week do you plan to train?
              </p>
            </div>
          )}

          {/* Training Days Selection */}
          {selectedSplit && (
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <Label className="text-white flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-400" />
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
                        p-3 rounded-lg border-2 transition-all font-semibold text-sm flex flex-col items-center gap-1
                        ${isSelected 
                          ? 'bg-indigo-500 border-indigo-400 text-white' 
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:border-amber-400'
                        }
                      `}
                    >
                      <span>{day}</span>
                      {!isSelected && <span className="text-[9px] opacity-70">Rest</span>}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {selectedDays.length} {selectedDays.length === 1 ? 'day' : 'days'} selected
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedSplit || updateSplitMutation.isPending}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {updateSplitMutation.isPending ? 'Saving...' : 'Save Split'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}