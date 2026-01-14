import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Upload, X, Sparkles, Tag, Link2, Calendar, Users } from 'lucide-react';

export default function CreateGymOwnerPostModal({ open, onClose, gym, onSuccess }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [postType, setPostType] = useState('update');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [mentionUsers, setMentionUsers] = useState([]);
  const [callToAction, setCallToAction] = useState({ enabled: false, text: '', link: '' });

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

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
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
      comments: [],
      post_type: postType,
      tags,
      is_pinned: isPinned,
      scheduled_date: scheduledDate || null,
      mentioned_users: mentionUsers,
      call_to_action: callToAction.enabled ? { text: callToAction.text, link: callToAction.link } : null
    });

    onSuccess?.();
    setContent('');
    setImageUrl('');
    setPostType('update');
    setTags([]);
    setIsPinned(false);
    setScheduledDate('');
    setMentionUsers([]);
    setCallToAction({ enabled: false, text: '', link: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Create Gym Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Post Type */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4" />
              Post Type
            </Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update">📢 Update/Announcement</SelectItem>
                <SelectItem value="achievement">🏆 Achievement/Success</SelectItem>
                <SelectItem value="event">📅 Event Promotion</SelectItem>
                <SelectItem value="offer">🎁 Special Offer</SelectItem>
                <SelectItem value="tip">💡 Fitness Tip</SelectItem>
                <SelectItem value="member_spotlight">⭐ Member Spotlight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Post Content */}
          <div>
            <Label>Post Content *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`${
                postType === 'achievement' ? 'Share a gym achievement or milestone...' :
                postType === 'event' ? 'Tell members about an upcoming event...' :
                postType === 'offer' ? 'Announce a special offer or promotion...' :
                postType === 'tip' ? 'Share a helpful fitness tip...' :
                postType === 'member_spotlight' ? 'Highlight an amazing member...' :
                'Share an update, announcement, or achievement...'
              }`}
              rows={6}
              className="mt-2 rounded-2xl"
            />
            <p className="text-xs text-gray-500 mt-1">{content.length} characters</p>
          </div>

          {/* Tags */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag (e.g., nutrition, workout, event)"
                className="rounded-2xl"
              />
              <Button type="button" onClick={addTag} variant="outline" className="rounded-2xl">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="pr-1 text-sm">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Upload className="w-4 h-4" />
              Image (Optional)
            </Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="rounded-2xl"
            />
            {uploading && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading image...
              </div>
            )}
            {imageUrl && !uploading && (
              <div className="mt-3 relative">
                <img src={imageUrl} alt="Preview" className="w-full max-h-64 object-cover rounded-2xl" />
                <Button
                  type="button"
                  onClick={() => setImageUrl('')}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                id="cta"
                checked={callToAction.enabled}
                onCheckedChange={(checked) => setCallToAction({ ...callToAction, enabled: checked })}
              />
              <Label htmlFor="cta" className="font-bold cursor-pointer flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Add Call-to-Action Button
              </Label>
            </div>
            {callToAction.enabled && (
              <div className="grid grid-cols-2 gap-3 ml-6">
                <Input
                  value={callToAction.text}
                  onChange={(e) => setCallToAction({ ...callToAction, text: e.target.value })}
                  placeholder="Button text (e.g., Book Now)"
                  className="rounded-2xl"
                />
                <Input
                  value={callToAction.link}
                  onChange={(e) => setCallToAction({ ...callToAction, link: e.target.value })}
                  placeholder="Link URL"
                  className="rounded-2xl"
                />
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-200">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="pinned"
                  checked={isPinned}
                  onCheckedChange={setIsPinned}
                />
                <Label htmlFor="pinned" className="font-bold cursor-pointer">
                  📌 Pin to Top
                </Label>
              </div>
              <p className="text-xs text-gray-600 mt-1 ml-6">Keep this post at the top of the feed</p>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Schedule Post (Optional)
              </Label>
              <Input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="rounded-2xl"
              />
            </div>
          </div>

          {/* Preview */}
          {content && (
            <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
              <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Preview
              </h4>
              <div className="bg-white p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {gym.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{gym.name}</p>
                    <p className="text-xs text-gray-500">Just now • {postType.replace('_', ' ')}</p>
                  </div>
                </div>
                <p className="text-gray-900 whitespace-pre-wrap mb-2">{content}</p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tags.map((tag, idx) => (
                      <span key={idx} className="text-xs text-blue-600">#{tag}</span>
                    ))}
                  </div>
                )}
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="w-full rounded-xl mb-2" />
                )}
                {callToAction.enabled && callToAction.text && (
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mt-3">
                    {callToAction.text}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="rounded-2xl">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!content.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl"
            >
              {scheduledDate ? '📅 Schedule Post' : '✨ Publish Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}