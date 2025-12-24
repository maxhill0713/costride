import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dumbbell, Loader2, Flame } from 'lucide-react';

const exercises = [
  { id: 'bench_press', label: 'Bench Press' },
  { id: 'squat', label: 'Squat' },
  { id: 'deadlift', label: 'Deadlift' },
  { id: 'overhead_press', label: 'Overhead Press' },
  { id: 'barbell_row', label: 'Barbell Row' },
  { id: 'power_clean', label: 'Power Clean' },
];

export default function LogLiftModal({ open, onClose, onSave, members, isLoading }) {
  const [formData, setFormData] = useState({
    member_id: '',
    member_name: '',
    exercise: 'bench_press',
    weight_lbs: '',
    reps: 1,
    is_pr: false,
    lift_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleMemberChange = (memberId) => {
    const member = members.find(m => m.id === memberId);
    setFormData({
      ...formData,
      member_id: memberId,
      member_name: member?.nickname || member?.name || ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      weight_lbs: parseFloat(formData.weight_lbs),
      reps: parseInt(formData.reps)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-orange-400" />
            Log New Lift
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Member *</Label>
            <Select value={formData.member_id} onValueChange={handleMemberChange}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.nickname || member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Exercise *</Label>
            <Select
              value={formData.exercise}
              onValueChange={(value) => setFormData({ ...formData, exercise: value })}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {exercises.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id}>{ex.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Weight (lbs) *</Label>
              <Input
                type="number"
                value={formData.weight_lbs}
                onChange={(e) => setFormData({ ...formData, weight_lbs: e.target.value })}
                placeholder="225"
                required
                min="1"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Reps</Label>
              <Input
                type="number"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                min="1"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Checkbox
              id="is_pr"
              checked={formData.is_pr}
              onCheckedChange={(checked) => setFormData({ ...formData, is_pr: checked })}
              className="border-orange-400 data-[state=checked]:bg-orange-500"
            />
            <Label htmlFor="is_pr" className="text-orange-400 flex items-center gap-2 cursor-pointer">
              <Flame className="w-4 h-4" />
              This is a Personal Record!
            </Label>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Felt strong today..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
              rows={2}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !formData.member_id || !formData.weight_lbs}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold h-12"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Dumbbell className="w-5 h-5 mr-2" />
                Log Lift
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}