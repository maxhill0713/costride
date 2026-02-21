import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Loader2, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateEventModal({ open, onClose, onSave, gym, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    image_url: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date) {
      toast.error('Please fill in title and date');
      return;
    }
    onSave(formData);
    setFormData({ title: '', description: '', event_date: '', image_url: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            Create Event
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label className="text-white font-semibold text-sm">Event Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Summer Fitness Challenge"
              required
              className="bg-slate-700/50 border-2 border-slate-600 text-white placeholder-slate-400 rounded-xl h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white font-semibold text-sm">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell members what to expect..."
              className="bg-slate-700/50 border-2 border-slate-600 text-white placeholder-slate-400 rounded-xl resize-none focus:border-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white font-semibold text-sm flex items-center gap-1">
                <Clock className="w-4 h-4 text-blue-400" />
                Date & Time *
              </Label>
              <Input
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
                className="bg-slate-700/50 border-2 border-slate-600 text-white rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white font-semibold text-sm flex items-center gap-1">
                <MapPin className="w-4 h-4 text-green-400" />
                Location
              </Label>
              <Input
                value={gym?.name || ''}
                disabled
                className="bg-slate-700/50 border-2 border-slate-600 text-slate-300 rounded-xl h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white font-semibold text-sm">Event Image URL</Label>
            <Input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="bg-slate-700/50 border-2 border-slate-600 text-white placeholder-slate-400 rounded-xl h-11"
            />
            <p className="text-xs text-slate-400">Optional: Add a banner image for your event</p>
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
              disabled={isLoading || !formData.title || !formData.event_date}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Create Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}