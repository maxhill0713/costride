import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MobileSelect } from '@/components/ui/mobile-select';
import { Dumbbell, Upload, Video } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

export default function LogLiftModal({ open, onClose, onSuccess, gym, currentUser }) {
  const [formData, setFormData] = useState({
    exercise: 'bench_press',
    weight_lbs: '',
    reps: 1,
    notes: '',
    video_url: ''
  });
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    },
    onSuccess: (url) => {
      setFormData({ ...formData, video_url: url });
      setUploading(false);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.weight_lbs) return;
    
    const liftData = {
      ...formData,
      weight_lbs: parseFloat(formData.weight_lbs),
      reps: parseInt(formData.reps) || 1,
      member_id: currentUser.id,
      member_name: currentUser.full_name,
      gym_id: gym?.id,
      lift_date: new Date().toISOString().split('T')[0],
      is_pr: false
    };

    // Sync to Supabase before calling onSuccess
    await base44.functions.invoke('saveSupabaseLift', liftData);
    
    onSuccess(liftData);

    setFormData({
      exercise: 'bench_press',
      weight_lbs: '',
      reps: 1,
      notes: '',
      video_url: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-blue-500" />
            Log Your Lift
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Weight (lbs) *</Label>
              <Input
                type="number"
                value={formData.weight_lbs}
                onChange={(e) => setFormData({ ...formData, weight_lbs: e.target.value })}
                placeholder="225"
                className="rounded-2xl"
              />
            </div>

            <div>
              <Label>Reps</Label>
              <Input
                type="number"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                placeholder="1"
                className="rounded-2xl"
              />
            </div>
          </div>

          <div>
            <Label>Video Proof (Optional)</Label>
            <div className="mt-2">
              {formData.video_url ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-200 rounded-2xl">
                    <Video className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Video uploaded!</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, video_url: '' })}
                    className="w-full rounded-2xl"
                  >
                    Remove Video
                  </Button>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">
                      {uploading ? 'Uploading...' : 'Click to upload video'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Show off your PR!</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How did it feel?"
              className="rounded-2xl"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!formData.weight_lbs || uploading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl"
            >
              Log Lift
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="rounded-2xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}