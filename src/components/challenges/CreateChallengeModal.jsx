import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Loader2 } from 'lucide-react';

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
    auto_start: true,
    send_reminders: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    // Validate required fields
    if (!formData.title || !formData.end_date || !formData.goal_type) {
      console.log('Validation failed - missing:', { title: !formData.title, end_date: !formData.end_date, goal_type: !formData.goal_type });
      alert('Please fill in all required fields (Title and End Date required)');
      return;
    }
    
    if (formData.type === 'gym_vs_gym' && (!formData.gym_id || !formData.competing_gym_id)) {
      console.log('Gym vs gym validation failed');
      alert('Please select both gyms for Gym vs Gym challenges');
      return;
    }
    
    console.log('Calling onSave with:', formData);
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <Select value={formData.category} onValueChange={(value) => {
              const updates = { category: value };
              if (value === 'lifting') {
                updates.goal_type = 'total_weight';
              } else if (value === 'attendance') {
                updates.goal_type = 'most_check_ins';
              } else if (value === 'streak') {
                updates.goal_type = 'longest_streak';
              }
              setFormData({ ...formData, ...updates });
            }}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lifting">💪 Lifting (Weight/Reps)</SelectItem>
                <SelectItem value="attendance">📍 Attendance (Check-ins)</SelectItem>
                <SelectItem value="streak">🔥 Streak (Consecutive Days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Challenge Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="gym_vs_gym">Gym vs Gym</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.category === 'lifting' && (
              <div className="space-y-2">
                <Label>Exercise *</Label>
                <Select value={formData.exercise} onValueChange={(value) => setFormData({ ...formData, exercise: value })}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
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
            )}
          </div>

          {formData.type === 'gym_vs_gym' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Home Gym *</Label>
                <Select
                  value={formData.gym_id}
                  onValueChange={(value) => {
                    const gym = gyms.find(g => g.id === value);
                    setFormData({ ...formData, gym_id: value, gym_name: gym?.name || '' });
                  }}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Select gym" />
                  </SelectTrigger>
                  <SelectContent>
                    {gyms.map(gym => (
                      <SelectItem key={gym.id} value={gym.id}>{gym.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Competing Gym *</Label>
                <Select
                  value={formData.competing_gym_id}
                  onValueChange={(value) => {
                    const gym = gyms.find(g => g.id === value);
                    setFormData({ ...formData, competing_gym_id: value, competing_gym_name: gym?.name || '' });
                  }}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Select gym" />
                  </SelectTrigger>
                  <SelectContent>
                    {gyms.map(gym => (
                      <SelectItem key={gym.id} value={gym.id}>{gym.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Goal Type *</Label>
            <Select value={formData.goal_type} onValueChange={(value) => setFormData({ ...formData, goal_type: value })}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formData.category === 'lifting' && (
                  <>
                    <SelectItem value="total_weight">Total Weight Lifted</SelectItem>
                    <SelectItem value="total_reps">Total Reps</SelectItem>
                    <SelectItem value="max_weight">Max Weight</SelectItem>
                  </>
                )}
                {formData.category === 'attendance' && (
                  <SelectItem value="most_check_ins">Most Check-ins</SelectItem>
                )}
                {formData.category === 'streak' && (
                  <SelectItem value="longest_streak">Longest Streak</SelectItem>
                )}
                <SelectItem value="participation">Most Participants</SelectItem>
              </SelectContent>
            </Select>
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