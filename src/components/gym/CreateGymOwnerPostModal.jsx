import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Upload } from 'lucide-react';

export default function CreateGymOwnerPostModal({ open, onClose, gym, onSuccess }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    },
    onSuccess: (url) => {
      setImageUrl(url);
      setUploading(false);
    }
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    await base44.entities.Post.create({
      member_id: gym.id,
      member_name: gym.name,
      member_avatar: gym.image_url,
      content,
      image_url: imageUrl,
      likes: 0,
      comments: []
    });

    onSuccess?.();
    setContent('');
    setImageUrl('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Gym Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Post Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an update, announcement, or achievement..."
              rows={6}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Image (Optional)</Label>
            <div className="mt-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </div>
              )}
              {imageUrl && !uploading && (
                <div className="mt-3">
                  <img src={imageUrl} alt="Preview" className="w-full max-h-64 object-cover rounded-xl" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!content.trim()}>
              Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}