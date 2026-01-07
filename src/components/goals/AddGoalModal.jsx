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
    target_value: '',
    current_value: 0,
    unit: 'lbs',
    exercise: '',
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
      target_value: '',
      current_value: 0,
      unit: 'lbs',
      exercise: '',
      deadline: '',
      reminder_enabled: true,
      status: 'active'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-500" />
            Set New Goal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Goal Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Bench Press 300 lbs"
              required
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Why this goal matters to you..."
              className="rounded-2xl"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Value *</Label>
              <Input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                placeholder="300"
                required
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="reps">reps</SelectItem>
                  <SelectItem value="workouts">workouts</SelectItem>
                  <SelectItem value="days">days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Exercise (Optional)</Label>
            <Select value={formData.exercise} onValueChange={(value) => setFormData({ ...formData, exercise: value })}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bench_press">Bench Press</SelectItem>
                <SelectItem value="squat">Squat</SelectItem>
                <SelectItem value="deadlift">Deadlift</SelectItem>
                <SelectItem value="overhead_press">Overhead Press</SelectItem>
                <SelectItem value="barbell_row">Barbell Row</SelectItem>
                <SelectItem value="power_clean">Power Clean</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Deadline</Label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="rounded-2xl"
            />
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border-2 border-blue-200">
            <Checkbox
              id="reminder"
              checked={formData.reminder_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
              className="border-blue-400"
            />
            <Label htmlFor="reminder" className="text-blue-900 font-semibold cursor-pointer">
              Send me weekly reminders
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold h-12 rounded-2xl"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Goal'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}