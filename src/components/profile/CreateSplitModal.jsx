import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dumbbell, Calendar, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function CreateSplitModal({ isOpen, onClose, currentUser }) {
  const [selectedSplit, setSelectedSplit] = useState(currentUser?.workout_split || '');
  const [weeklyGoal, setWeeklyGoal] = useState(currentUser?.weekly_goal || 3);
  const [selectedDays, setSelectedDays] = useState(currentUser?.training_days || [1, 3, 5]); // Default Mon, Wed, Fri
  const [customSplitName, setCustomSplitName] = useState(currentUser?.custom_split_name || '');
  const [customWorkoutTypes, setCustomWorkoutTypes] = useState(currentUser?.custom_workout_types || {});
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
      recommended: 6,
      defaultDays: [1, 2, 4, 5, 6, 7]
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
      data.custom_workout_types = customWorkoutTypes;
    }
    
    updateSplitMutation.mutate(data);
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
      // Remove workout type for this day
      const newTypes = { ...customWorkoutTypes };
      delete newTypes[day];
      setCustomWorkoutTypes(newTypes);
    } else {
      setSelectedDays([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  const workoutColorOptions = [
    { name: 'Purple', gradient: 'from-purple-500 to-purple-600', value: 'purple' },
    { name: 'Blue', gradient: 'from-blue-500 to-blue-600', value: 'blue' },
    { name: 'Green', gradient: 'from-green-500 to-green-600', value: 'green' },
    { name: 'Red', gradient: 'from-red-500 to-red-600', value: 'red' },
    { name: 'Orange', gradient: 'from-orange-500 to-orange-600', value: 'orange' },
    { name: 'Pink', gradient: 'from-pink-500 to-pink-600', value: 'pink' },
    { name: 'Yellow', gradient: 'from-yellow-500 to-yellow-600', value: 'yellow' },
    { name: 'Cyan', gradient: 'from-cyan-500 to-cyan-600', value: 'cyan' },
  ];

  const updateWorkoutType = (day, field, value) => {
    setCustomWorkoutTypes(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50 shadow-2xl">
        <DialogHeader>
          <div className="text-center space-y-1.5 pb-3 border-b border-slate-700/50">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black text-white">
              Choose Your Training Split
            </DialogTitle>
            <p className="text-slate-400 text-xs">
              Select a program that matches your goals
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Split Options */}
          <div className="grid gap-2">
            {splits.map((split) => (
              <div
                key={split.id}
                onClick={() => {
                  setSelectedSplit(split.id);
                  setWeeklyGoal(split.recommended);
                  setSelectedDays(split.defaultDays);
                }}
                className={`
                  p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98]
                  ${selectedSplit === split.id 
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-indigo-500/20 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20' 
                    : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white mb-0.5">{split.name}</h3>
                    <p className="text-xs text-slate-400">{split.description}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/60 text-[10px] font-bold text-slate-200 border border-slate-600/40">
                    <Calendar className="w-3 h-3" />
                    {split.recommended}x
                  </div>
                </div>

                {/* Schedule Preview */}
                <div className="flex gap-1.5">
                  {split.schedule.map((day, i) => (
                    <div
                      key={i}
                      className={`
                        flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white
                        bg-gradient-to-br ${split.gradient} shadow-sm
                        ${selectedSplit === split.id ? 'shadow-md' : 'opacity-60'}
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
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <Label className="text-white flex items-center gap-1.5 mb-2 text-sm font-bold">
                  <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Dumbbell className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  Name Your Split
                </Label>
                <input
                  type="text"
                  value={customSplitName}
                  onChange={(e) => setCustomSplitName(e.target.value)}
                  placeholder="e.g., Upper/Lower 2x"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {/* Customize Each Training Day */}
              {selectedDays.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  <Label className="text-white flex items-center gap-1.5 mb-2 text-sm font-bold">
                    <div className="w-6 h-6 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
                      <Target className="w-3.5 h-3.5 text-fuchsia-400" />
                    </div>
                    Customize Days
                  </Label>
                  <div className="space-y-2.5">
                    {selectedDays.map((day) => {
                      const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day - 1];
                      const workoutType = customWorkoutTypes[day] || { name: '', color: 'purple' };
                      
                      return (
                        <div key={day} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-slate-700/40 flex items-center justify-center border border-slate-600/40 flex-shrink-0">
                              <span className="text-[10px] font-bold text-white">{dayName}</span>
                            </div>
                            <input
                              type="text"
                              value={workoutType.name || ''}
                              onChange={(e) => updateWorkoutType(day, 'name', e.target.value)}
                              placeholder="e.g., Upper, Push"
                              className="flex-1 px-2.5 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex gap-1.5 pl-11">
                            {workoutColorOptions.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() => updateWorkoutType(day, 'color', color.value)}
                                className={`
                                  w-7 h-7 rounded-lg bg-gradient-to-br ${color.gradient} transition-all flex-shrink-0
                                  ${workoutType.color === color.value 
                                    ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-800' 
                                    : 'opacity-40 active:scale-95'
                                  }
                                `}
                              />
                            ))}
                          </div>
                          
                          {/* Exercise Details */}
                          <div className="pl-11 mt-2 space-y-1.5">
                            <div className="grid grid-cols-3 gap-1.5">
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Exercise</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Sets x Reps</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Weight</div>
                            </div>
                            {(workoutType.exercises || [{ exercise: '', setsReps: '', weight: '' }]).map((ex, exIndex) => (
                              <div key={exIndex} className="grid grid-cols-3 gap-1.5">
                                <input
                                  type="text"
                                  value={ex.exercise || ''}
                                  onChange={(e) => {
                                    const exercises = workoutType.exercises || [{ exercise: '', setsReps: '', weight: '' }];
                                    exercises[exIndex] = { ...exercises[exIndex], exercise: e.target.value };
                                    updateWorkoutType(day, 'exercises', exercises);
                                  }}
                                  placeholder="e.g., Bench"
                                  className="px-2 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-[10px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                                <input
                                  type="text"
                                  value={ex.setsReps || ''}
                                  onChange={(e) => {
                                    const exercises = workoutType.exercises || [{ exercise: '', setsReps: '', weight: '' }];
                                    exercises[exIndex] = { ...exercises[exIndex], setsReps: e.target.value };
                                    updateWorkoutType(day, 'exercises', exercises);
                                  }}
                                  placeholder="e.g., 3x10"
                                  className="px-2 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-[10px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                                <input
                                  type="text"
                                  value={ex.weight || ''}
                                  onChange={(e) => {
                                    const exercises = workoutType.exercises || [{ exercise: '', setsReps: '', weight: '' }];
                                    exercises[exIndex] = { ...exercises[exIndex], weight: e.target.value };
                                    updateWorkoutType(day, 'exercises', exercises);
                                  }}
                                  placeholder="e.g., 60kg"
                                  className="px-2 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-[10px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const exercises = workoutType.exercises || [];
                                updateWorkoutType(day, 'exercises', [...exercises, { exercise: '', setsReps: '', weight: '' }]);
                              }}
                              className="text-[10px] text-violet-400 hover:text-violet-300 font-medium"
                            >
                              + Add Exercise
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weekly Goal */}
          {selectedSplit && (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              <Label className="text-white flex items-center gap-1.5 mb-2 text-sm font-bold">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                Weekly Goal
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 w-14 text-center">
                  {weeklyGoal}x
                </div>
              </div>
            </div>
          )}

          {/* Training Days Selection */}
          {selectedSplit && (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              <Label className="text-white flex items-center gap-1.5 mb-2 text-sm font-bold">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                </div>
                Training Days
              </Label>
              <div className="grid grid-cols-7 gap-1.5">
                {dayNames.map((day, index) => {
                  const dayNumber = index + 1;
                  const isSelected = selectedDays.includes(dayNumber);
                  return (
                    <button
                      key={dayNumber}
                      type="button"
                      onClick={() => toggleDay(dayNumber)}
                      className={`
                        p-2 rounded-lg border-2 transition-all font-bold text-[10px] flex flex-col items-center gap-0.5 active:scale-95
                        ${isSelected 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400/50 text-white shadow-md' 
                          : 'bg-slate-700/40 border-slate-600/40 text-slate-400'
                        }
                      `}
                    >
                      <span>{day}</span>
                      {!isSelected && <span className="text-[8px] opacity-60">Rest</span>}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                {selectedDays.length} {selectedDays.length === 1 ? 'day' : 'days'} • {7 - selectedDays.length} rest
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={onClose}
              className="flex-1 h-10 bg-slate-800/60 border-2 border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600 rounded-lg font-bold transition-all text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedSplit || (selectedSplit === 'custom' && !customSplitName.trim()) || updateSplitMutation.isPending}
              className="flex-1 h-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 rounded-lg font-bold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {updateSplitMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}