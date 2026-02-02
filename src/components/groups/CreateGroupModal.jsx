import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileSelect } from "@/components/ui/mobile-select";
import { Users, Loader2 } from 'lucide-react';

export default function CreateGroupModal({ open, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
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
            <Users className="w-6 h-6 text-blue-500" />
            Create Group
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Group Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Running Club"
              required
              className="bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Category *</Label>
            <MobileSelect
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              placeholder="Select category"
              triggerClassName="bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl h-12"
              options={[
                { value: 'running', label: 'Running' },
                { value: 'weightlifting', label: 'Weightlifting' },
                { value: 'yoga', label: 'Yoga' },
                { value: 'crossfit', label: 'CrossFit' },
                { value: 'cycling', label: 'Cycling' },
                { value: 'boxing', label: 'Boxing' },
                { value: 'general', label: 'General' }
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell others about your group..."
              className="bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Group Image URL</Label>
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
            disabled={isLoading || !formData.name}
            className="w-full bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white font-bold h-12 rounded-2xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Create Group</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}