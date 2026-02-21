import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileSelect } from "@/components/ui/mobile-select";
import { Trophy, Loader2, Gift } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateChallengeModal({ open, onClose, gyms, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'individual',
    category: 'lifting',
    gym_id: '',
    gym_name: '',
    competing_gym_id: '',
    competing_gym_name: '',
    exercise: 'bench_press',
    goal_type: 'total_weight',
    target_value: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'upcoming',
    prize_pool: '',
    entry_fee: 0,
    max_participants: 0,
    difficulty_level: 'intermediate',
    rules: '',
    rewards: { first: '', second: '', third: '' },
    reward: '',
    auto_start: true,
    send_reminders: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.end_date || !formData.goal_type) {
      toast.error('Please fill in Title and End Date');
      return;
    }
    
    if (formData.type === 'gym_vs_gym' && (!formData.gym_id || !formData.competing_gym_id)) {
      toast.error('Please select both gyms');
      return;
    }
    
    toast.loading('Creating challenge...');
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            Create Challenge
          </DialogTitle>
          <p className="text-slate-400 text-sm mt-1">Set up a new challenge for your gym members</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label className="text-white font-semibold text-sm">Challenge Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summer Squat Challenge"
              required
              className="bg-slate-700/50 border-2 border-slate-600 text-white placeholder-slate-400 rounded-xl h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white font-semibold text-sm">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Who can squat the most total weight this month?"
              className="bg-slate-700/50 border-2 border-slate-600 text-white placeholder-slate-400 rounded-xl resize-none focus:border-orange-500"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white font-semibold text-sm">Challenge Category *</Label>
            <MobileSelect 
              value={formData.category} 
              onValueChange={(value) => {
                const updates = { category: value };
                if (value === 'lifting') {
                  updates.goal_type = 'total_weight';
                } else if (value === 'attendance') {
                  updates.goal_type = 'most_check_ins';
                } else if (value === 'streak') {
                  updates.goal_type = 'longest_streak';
                }
                setFormData({ ...formData, ...updates });
              }}
              placeholder="Select category"
              triggerClassName="bg-slate-700/50 border-2 border-slate-600 text-white rounded-xl h-11"
              options={[
                { value: 'lifting', label: '💪 Lifting (Weight/Reps)' },
                { value: 'attendance', label: '📍 Attendance (Check-ins)' },
                { value: 'streak', label: '🔥 Streak (Consecutive Days)' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white font-semibold text-sm">Challenge Type *</Label>
              <MobileSelect 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                placeholder="Select type"
                triggerClassName="bg-slate-700/50 border-2 border-slate-600 text-white rounded-xl h-11"
                options={[
                  { value: 'individual', label: 'Individual' },
                  { value: 'team', label: 'Team' },
                  { value: 'gym_vs_gym', label: 'Gym vs Gym' },
                  { value: 'community', label: 'Community' }
                ]}
              />
            </div>

            {formData.category === 'lifting' && (
              <div className="space-y-2">
                <Label className="text-white font-semibold text-sm">Exercise *</Label>
                <MobileSelect 
                  value={formData.exercise} 
                  onValueChange={(value) => setFormData({ ...formData, exercise: value })}
                  placeholder="Select exercise"
                  triggerClassName="bg-slate-700/50 border-2 border-slate-600 text-white rounded-xl h-11"
                  options={[
                    { value: 'bench_press', label: 'Bench Press' },
                    { value: 'squat', label: 'Squat' },
                    { value: 'deadlift', label: 'Deadlift' },
                    { value: 'overhead_press', label: 'Overhead Press' },
                    { value: 'barbell_row', label: 'Barbell Row' },
                    { value: 'power_clean', label: 'Power Clean' }
                  ]}
                />
              </div>
            )}
          </div>

          {formData.type === 'gym_vs_gym' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white font-semibold text-sm">Home Gym *</Label>
                <MobileSelect
                  value={formData.gym_id}
                  onValueChange={(value) => {
                    const gym = gyms.find(g => g.id === value);
                    setFormData({ ...formData, gym_id: value, gym_name: gym?.name || '' });
                  }}
                  placeholder="Select gym"
                  triggerClassName="bg-slate-700/50 border-2 border-slate-600 text-white rounded-xl h-11"
                  options={gyms.map(gym => ({ value: gym.id, label: gym.name }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-semibold text-sm">Competing Gym *</Label>
                <MobileSelect
                  value={formData.competing_gym_id}
                  onValueChange={(value) => {
                    const gym = gyms.find(g => g.id === value);
                    setFormData({ ...formData, competing_gym_id: value, competing_gym_name: gym?.name || '' });
                  }}
                  placeholder="Select gym"
                  triggerClassName="bg-slate-700/50 border-2 border-slate-600 text-white rounded-xl h-11"
                  options={gyms.map(gym => ({ value: gym.id, label: gym.name }))}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-white font-semibold text-sm">Goal Type *</Label>
            <MobileSelect 
              value={formData.goal_type} 
              onValueChange={(value) => setFormData({ ...formData, goal_type: value })}
              placeholder="Select goal type"
              triggerClassName="bg-slate-700/50 border-2 border-slate-600 text-white rounded-xl h-11"
              options={[
                ...(formData.category === 'lifting' ? [
                  { value: 'total_weight', label: 'Total Weight Lifted' },
                  { value: 'total_reps', label: 'Total Reps' },
                  { value: 'max_weight', label: 'Max Weight' }
                ] : []),
                ...(formData.category === 'attendance' ? [
                  { value: 'most_check_ins', label: 'Most Check-ins' }
                ] : []),
                ...(formData.category === 'streak' ? [
                  { value: 'longest_streak', label: 'Longest Streak' }
                ] : []),
                { value: 'participation', label: 'Most Participants' }
              ]}
            />
          </div>

          {(formData.category === 'attendance' || formData.category === 'streak') && (
            <div className="space-y-2">
              <Label className="text-white font-semibold text-sm">Target {formData.category === 'attendance' ? 'Check-ins' : 'Streak (days)'}</Label>
              <Input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) || 0 })}
                placeholder={formData.category === 'attendance' ? '20' : '30'}
                className="bg-slate-700/50 border-2 border-slate-600 text-white placeholder-slate-400 rounded-xl h-11"
              />
              <p className="text-xs text-slate-400">Optional milestone goal for participants</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white font-semibold text-sm">Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="bg-slate-700/50 border-2 border-slate-600 text-white rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white font-semibold text-sm">End Date *</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="bg-slate-700/50 border-2 border-slate-600 text-white rounded-xl h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white font-semibold text-sm flex items-center gap-2">
              <Gift className="w-4 h-4 text-orange-400" />
              Reward (Optional)
            </Label>
            <Input
              value={formData.reward}
              onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
              placeholder="e.g., Free protein shake, £10 gift card, Free personal training session"
              className="bg-slate-700/50 border-2 border-slate-600 text-white placeholder-slate-400 rounded-xl h-11"
            />
            <p className="text-xs text-slate-400">Offer a reward for completing this challenge</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-white border border-slate-600 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Create Challenge'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}