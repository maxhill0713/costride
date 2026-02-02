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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-orange-500" />
            Create Challenge
          </DialogTitle>
          <DialogDescription>Set up a new challenge for your gym members</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Challenge Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summer Squat Challenge"
              required
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Who can squat the most total weight this month?"
              className="rounded-2xl"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Challenge Category *</Label>
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
              triggerClassName="rounded-2xl"
              options={[
                { value: 'lifting', label: '💪 Lifting (Weight/Reps)' },
                { value: 'attendance', label: '📍 Attendance (Check-ins)' },
                { value: 'streak', label: '🔥 Streak (Consecutive Days)' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Challenge Type *</Label>
              <MobileSelect 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                placeholder="Select type"
                triggerClassName="rounded-2xl"
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
                <Label>Exercise *</Label>
                <MobileSelect 
                  value={formData.exercise} 
                  onValueChange={(value) => setFormData({ ...formData, exercise: value })}
                  placeholder="Select exercise"
                  triggerClassName="rounded-2xl"
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
                <Label>Home Gym *</Label>
                <MobileSelect
                  value={formData.gym_id}
                  onValueChange={(value) => {
                    const gym = gyms.find(g => g.id === value);
                    setFormData({ ...formData, gym_id: value, gym_name: gym?.name || '' });
                  }}
                  placeholder="Select gym"
                  triggerClassName="rounded-2xl"
                  options={gyms.map(gym => ({ value: gym.id, label: gym.name }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Competing Gym *</Label>
                <MobileSelect
                  value={formData.competing_gym_id}
                  onValueChange={(value) => {
                    const gym = gyms.find(g => g.id === value);
                    setFormData({ ...formData, competing_gym_id: value, competing_gym_name: gym?.name || '' });
                  }}
                  placeholder="Select gym"
                  triggerClassName="rounded-2xl"
                  options={gyms.map(gym => ({ value: gym.id, label: gym.name }))}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Goal Type *</Label>
            <MobileSelect 
              value={formData.goal_type} 
              onValueChange={(value) => setFormData({ ...formData, goal_type: value })}
              placeholder="Select goal type"
              triggerClassName="rounded-2xl"
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
              <Label>Target {formData.category === 'attendance' ? 'Check-ins' : 'Streak (days)'}</Label>
              <Input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) || 0 })}
                placeholder={formData.category === 'attendance' ? '20' : '30'}
                className="rounded-2xl"
              />
              <p className="text-xs text-gray-500">Optional milestone goal for participants</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-orange-500" />
              Reward (Optional)
            </Label>
            <Input
              value={formData.reward}
              onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
              placeholder="e.g., Free protein shake, £10 gift card, Free personal training session"
              className="rounded-2xl"
            />
            <p className="text-xs text-gray-500">Offer a reward for completing this challenge</p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold h-12 rounded-2xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Challenge'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}