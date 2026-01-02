import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Loader2 } from 'lucide-react';

export default function CreateEventModal({ open, onClose, onSave, gym, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    image_url: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white text-gray-900 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            Create Event
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Event Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summer Fitness Challenge"
              required
              className="bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Join us for an exciting fitness challenge..."
              className="bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Date & Time *</Label>
            <Input
              type="datetime-local"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              required
              className="bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Event Image URL</Label>
            <Input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl h-12"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !formData.title || !formData.event_date}
            className="w-full bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white font-bold h-12 rounded-2xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Create Event</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}