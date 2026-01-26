import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, Loader2 } from 'lucide-react';

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
    onSave({
      ...formData,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      target_value: parseFloat(formData.target_value),
      current_value: parseFloat(formData.current_value)
    });
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
            <Select value={formData.goal_type} onValueChange={(value) => setFormData({ ...formData, goal_type: value, unit: value === 'numerical' ? 'lbs' : 'workouts' })}>
              <SelectTrigger className="rounded-xl md:rounded-2xl text-sm bg-slate-800/80 border-2 border-slate-500/60 text-white hover:border-blue-500/60 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-2 border-slate-600">
                <SelectItem value="numerical">Numerical (e.g., lift 300 lbs)</SelectItem>
                <SelectItem value="frequency">Frequency (e.g., 6 workouts per week)</SelectItem>
                <SelectItem value="consistency">Consistency (e.g., 30 day streak)</SelectItem>
              </SelectContent>
            </Select>
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
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger className="rounded-xl md:rounded-2xl text-sm bg-slate-800/80 border-2 border-slate-500/60 text-white hover:border-blue-500/60 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-2 border-slate-600">
                    <SelectItem value="lbs">lbs</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="reps">reps</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={formData.frequency_period} onValueChange={(value) => setFormData({ ...formData, frequency_period: value })}>
                  <SelectTrigger className="rounded-xl md:rounded-2xl text-sm bg-slate-800/80 border-2 border-slate-500/60 text-white hover:border-blue-500/60 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-2 border-slate-600">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {formData.goal_type === 'numerical' && (
            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-xs md:text-sm font-bold text-slate-300">Exercise (Optional)</Label>
              <Select value={formData.exercise} onValueChange={(value) => setFormData({ ...formData, exercise: value })}>
                <SelectTrigger className="rounded-xl md:rounded-2xl text-sm bg-slate-800/80 border-2 border-slate-500/60 text-white hover:border-blue-500/60 transition-colors">
                  <SelectValue placeholder="Select exercise" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-2 border-slate-600">
                  <SelectItem value="bench_press">Bench Press</SelectItem>
                  <SelectItem value="squat">Squat</SelectItem>
                  <SelectItem value="deadlift">Deadlift</SelectItem>
                  <SelectItem value="overhead_press">Overhead Press</SelectItem>
                  <SelectItem value="barbell_row">Barbell Row</SelectItem>
                  <SelectItem value="power_clean">Power Clean</SelectItem>
                </SelectContent>
              </Select>
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