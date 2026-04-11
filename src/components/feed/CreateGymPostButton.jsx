import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CreateGymPostButton({ gym, currentUser, onPostCreated }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be under 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.Post.create({
        member_id: currentUser.id,
        member_name: gym.name,
        member_avatar: gym.image_url || gym.logo_url || null,
        gym_id: gym.id,
        gym_name: gym.name,
        content,
        image_url: imageUrl || null,
        likes: 0,
        comments: [],
        reactions: {},
      });
      
      toast.success('Post created successfully');
      setContent('');
      setImageUrl('');
      setOpen(false);
      if (onPostCreated) onPostCreated();
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl h-auto py-3 flex-col gap-2 shadow-lg mb-4"
      >
        <Plus className="w-5 h-5" />
        <span className="font-bold">Create Post</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <DialogHeader>
            <DialogTitle>Create Gym Post</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share an update with your members..."
                className="rounded-2xl min-h-32"
              />
            </div>

            <div>
              <Label>Image (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="rounded-2xl"
                />
                {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
              </div>
              {imageUrl && (
                <div className="mt-2">
                  <img src={imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-2xl" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setContent('');
                  setImageUrl('');
                  setOpen(false);
                }}
                className="flex-1 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}