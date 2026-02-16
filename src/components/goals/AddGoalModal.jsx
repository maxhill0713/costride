import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileSelect } from "@/components/ui/mobile-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AddGoalModal({ open, onClose, onSave, currentUser, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_type: 'numerical',
    target_value: '',
    current_value: 0,
    unit: 'lbs',
    exercise: '',
    frequency_period: 'weekly',
    deadline: '',
    reminder_enabled: true,
    status: 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const goalData = {
      ...formData,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      target_value: parseFloat(formData.target_value),
      current_value: parseFloat(formData.current_value)
    };
    
    // Sync to Supabase
    base44.functions.invoke('saveSupabaseGoal', goalData);
    
    onSave(goalData);
    setFormData({
      title: '',
      description: '',
      goal_type: 'numerical',
      target_value: '',
      current_value: 0,
      unit: 'lbs',
      exercise: '',
      frequency_period: 'weekly',
      deadline: '',
      reminder_enabled: true,
      status: 'active'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm md:max-w-md w-full mx-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-2 border-blue-500/30">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg md:text-2xl font-black flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-5 md:w-6 h-5 md:h-6 text-white" />
            </div>
            Set New Goal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-xs md:text-sm font-bold text-slate-300">Goal Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Bench Press 300 lbs"
              required
              className="rounded-xl md:rounded-2xl text-sm bg-slate-800/60 border-slate-600/40 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-xs md:text-sm font-bold text-slate-300">Goal Type *</Label>
            <MobileSelect 
              value={formData.goal_type} 
              onValueChange={(value) => setFormData({ ...formData, goal_type: value, unit: value === 'numerical' ? 'lbs' : 'workouts' })}
              placeholder="Select goal type"
              triggerClassName="rounded-xl md:rounded-2xl text-sm bg-slate-800/60 border-slate-600/40 text-white"
              className="bg-slate-800 border-slate-600 text-white"
              options={[
                { value: 'numerical', label: 'Numerical (e.g., lift 300 lbs)', className: 'text-white font-semibold' },
                { value: 'frequency', label: 'Frequency (e.g., 6 workouts per week)', className: 'text-white font-semibold' },
                { value: 'consistency', label: 'Consistency (e.g., 30 day streak)', className: 'text-white font-semibold' }
              ]}
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-xs md:text-sm font-bold text-slate-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Why this goal matters to you..."
              className="rounded-xl md:rounded-2xl text-sm bg-slate-800/60 border-slate-600/40 text-white placeholder:text-slate-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-xs md:text-sm font-bold text-slate-300">
                {formData.goal_type === 'numerical' && 'Target *'}
                {formData.goal_type === 'frequency' && 'Times *'}
                {formData.goal_type === 'consistency' && 'Days *'}
              </Label>
              <Input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                placeholder={formData.goal_type === 'numerical' ? '300' : formData.goal_type === 'frequency' ? '6' : '30'}
                required
                className="rounded-xl md:rounded-2xl text-sm bg-slate-800/60 border-slate-600/40 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-xs md:text-sm font-bold text-slate-300">
                {formData.goal_type === 'numerical' ? 'Unit *' : 'Period *'}
              </Label>
              {formData.goal_type === 'numerical' ? (
                <MobileSelect 
                  value={formData.unit} 
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  placeholder="Unit"
                  triggerClassName="rounded-xl md:rounded-2xl text-sm bg-slate-800/60 border-slate-600/40 text-white"
                  className="bg-slate-800 border-slate-600 text-white"
                  options={[
                    { value: 'lbs', label: 'lbs', className: 'text-white font-semibold' },
                    { value: 'kg', label: 'kg', className: 'text-white font-semibold' },
                    { value: 'reps', label: 'reps', className: 'text-white font-semibold' }
                  ]}
                />
              ) : (
                <MobileSelect 
                  value={formData.frequency_period} 
                  onValueChange={(value) => setFormData({ ...formData, frequency_period: value })}
                  placeholder="Period"
                  triggerClassName="rounded-xl md:rounded-2xl text-sm bg-slate-800/60 border-slate-600/40 text-white"
                  className="bg-slate-800 border-slate-600 text-white"
                  options={[
                    { value: 'daily', label: 'Daily', className: 'text-white font-semibold' },
                    { value: 'weekly', label: 'Weekly', className: 'text-white font-semibold' },
                    { value: 'monthly', label: 'Monthly', className: 'text-white font-semibold' }
                  ]}
                />
              )}
            </div>
          </div>

          {formData.goal_type === 'numerical' && (
            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-xs md:text-sm font-bold text-slate-300">Exercise (Optional)</Label>
              <MobileSelect 
                value={formData.exercise} 
                onValueChange={(value) => setFormData({ ...formData, exercise: value })}
                placeholder="Select exercise"
                triggerClassName="rounded-xl md:rounded-2xl text-sm bg-slate-800/60 border-slate-600/40 text-white"
                className="bg-slate-800 border-slate-600 text-white"
                options={[
                  { value: 'bench_press', label: 'Bench Press', className: 'text-white font-semibold' },
                  { value: 'squat', label: 'Squat', className: 'text-white font-semibold' },
                  { value: 'deadlift', label: 'Deadlift', className: 'text-white font-semibold' },
                  { value: 'overhead_press', label: 'Overhead Press', className: 'text-white font-semibold' },
                  { value: 'barbell_row', label: 'Barbell Row', className: 'text-white font-semibold' },
                  { value: 'power_clean', label: 'Power Clean', className: 'text-white font-semibold' }
                ]}
              />
            </div>
          )}

          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-xs md:text-sm font-bold text-slate-300">Deadline</Label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="rounded-xl md:rounded-2xl text-sm bg-slate-800/60 border-slate-600/40 text-white"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-900/30 border border-blue-600/40">
            <Checkbox
              id="reminder"
              checked={formData.reminder_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
              className="border-blue-400 data-[state=checked]:bg-blue-500"
            />
            <Label htmlFor="reminder" className="text-xs md:text-sm text-blue-200 font-semibold cursor-pointer">
              Weekly reminders
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold h-10 md:h-12 rounded-xl md:rounded-2xl text-sm md:text-base shadow-lg"
          >
            {isLoading ? <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin" /> : 'Create Goal'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}