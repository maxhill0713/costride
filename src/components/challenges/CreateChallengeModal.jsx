import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Loader2 } from 'lucide-react';

export default function CreateChallengeModal({ open, onClose, gyms }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'individual',
    gym_id: '',
    gym_name: '',
    competing_gym_id: '',
    competing_gym_name: '',
    exercise: 'bench_press',
    goal_type: 'total_weight',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'upcoming'
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Challenge.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      onClose();
      setFormData({
        title: '',
        description: '',
        type: 'individual',
        gym_id: '',
        gym_name: '',
        competing_gym_id: '',
        competing_gym_name: '',
        exercise: 'bench_press',
        goal_type: 'total_weight',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'upcoming'
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-orange-500" />
            Create Challenge
          </DialogTitle>
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
                <SelectItem value="total_weight">Total Weight Lifted</SelectItem>
                <SelectItem value="total_reps">Total Reps</SelectItem>
                <SelectItem value="max_weight">Max Weight</SelectItem>
                <SelectItem value="participation">Most Participants</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                className="rounded-2xl"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold h-12 rounded-2xl"
          >
            {createMutation.isPending ? (
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