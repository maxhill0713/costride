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
      <DialogContent className="bg-white text-gray-900 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-orange-500" />
            Log New Lift
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Member *</Label>
            <Select value={formData.member_id} onValueChange={handleMemberChange}>
              <SelectTrigger className="bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl h-12">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200">
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.nickname || member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Exercise *</Label>
            <Select
              value={formData.exercise}
              onValueChange={(value) => setFormData({ ...formData, exercise: value })}
            >
              <SelectTrigger className="bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200">
                {exercises.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id}>{ex.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Weight (lbs) *</Label>
              <Input
                type="number"
                value={formData.weight_lbs}
                onChange={(e) => setFormData({ ...formData, weight_lbs: e.target.value })}
                placeholder="225"
                required
                min="1"
                className="bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Reps</Label>
              <Input
                type="number"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                min="1"
                className="bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl h-12"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50 border-2 border-orange-200">
            <Checkbox
              id="is_pr"
              checked={formData.is_pr}
              onCheckedChange={(checked) => setFormData({ ...formData, is_pr: checked })}
              className="border-orange-400 data-[state=checked]:bg-orange-500"
            />
            <Label htmlFor="is_pr" className="text-orange-600 font-semibold flex items-center gap-2 cursor-pointer">
              <Flame className="w-5 h-5" />
              This is a Personal Record!
            </Label>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Felt strong today..."
              className="bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none rounded-2xl"
              rows={2}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !formData.member_id || !formData.weight_lbs}
            className="w-full bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white font-bold h-14 rounded-2xl shadow-md text-base"
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