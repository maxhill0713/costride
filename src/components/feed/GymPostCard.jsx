import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Edit, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const REACTIONS = ['💪', '🔥', '👏', '💯', '⚡'];

export default function GymPostCard({ post, gym, onDelete = null, isOwner = false }) {
  const queryClient = useQueryClient();
  const [showReactions, setShowReactions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImageUrl, setEditImageUrl] = useState(post.image_url || '');
  const [isUploading, setIsUploading] = useState(false);
  
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const reactionMutation = useMutation({
    mutationFn: ({ postId, emoji }) => {
      const reactions = post.reactions || {};
      const userId = currentUser?.id;
      
      if (reactions[userId] === emoji) {
        delete reactions[userId];
      } else {
        reactions[userId] = emoji;
      }
      
      return base44.entities.Post.update(postId, { reactions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setShowReactions(false);
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: () => base44.entities.Post.update(post.id, {
      content: editContent,
      image_url: editImageUrl || null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setShowEditModal(false);
      toast.success('Post updated successfully');
    },
    onError: () => {
      toast.error('Failed to update post');
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: () => base44.entities.Post.delete(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete post');
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditImageUrl(file_url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const isGymOwner = currentUser && gym && currentUser.email === gym.owner_email;

  const reactions = post.reactions || {};
  const userReaction = currentUser ? reactions[currentUser.id] : null;
  const reactionCounts = Object.values(reactions).reduce((acc, emoji) => {
    acc[emoji] = (acc[emoji] || 0) + 1;
    return acc;
  }, {});
  const totalReactions = Object.keys(reactions).length;
  return (
    <Card className="bg-white/95 backdrop-blur-sm border-2 border-gray-100 overflow-hidden hover:shadow-lg transition-all rounded-3xl">
      {/* Media */}
      {(post.video_url || post.image_url) && (
        <div className="w-full bg-gray-100">
          {post.video_url ? (
            <video 
              src={post.video_url} 
              controls 
              className="w-full max-h-[600px] object-contain"
            />
          ) : post.image_url ? (
            <img 
              src={post.image_url} 
              alt="Post" 
              className="w-full object-contain"
            />
          ) : null}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden">
            {post.member_avatar ? (
              <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-white">
                {post.member_name?.charAt(0)?.toUpperCase() || 'G'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">{post.member_name}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(post.created_date), 'MMM d, yyyy')}
            </p>
          </div>
          {isGymOwner && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEditModal(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.confirm('Delete this post?')) {
                    deletePostMutation.mutate();
                  }
                }}
                disabled={deletePostMutation.isPending}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {post.exercise && post.weight && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200">
            <p className="text-sm font-semibold text-blue-900">
              {post.exercise.replace('_', ' ')} • {post.weight} lbs
            </p>
          </div>
        )}

        {/* Reactions Section */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          {/* Display reaction counts */}
          {totalReactions > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <div key={emoji} className="px-2 py-1 bg-gray-50 rounded-full border border-gray-200 text-sm flex items-center gap-1">
                  <span>{emoji}</span>
                  <span className="text-xs font-semibold text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reaction button */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className={`w-full py-2 rounded-xl font-semibold text-sm transition-all ${
                  userReaction 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {userReaction ? `${userReaction} Reacted` : '👍 React'}
              </button>

              {/* Reaction picker */}
              {showReactions && (
                <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 flex justify-around z-10">
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => reactionMutation.mutate({ postId: post.id, emoji })}
                      className="text-3xl hover:scale-125 transition-transform active:scale-110"
                      disabled={reactionMutation.isPending}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Content</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
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
              {editImageUrl && (
                <div className="mt-2">
                  <img src={editImageUrl} alt="Preview" className="w-full h-40 object-cover rounded-2xl" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => updatePostMutation.mutate()}
                disabled={updatePostMutation.isPending || !editContent.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl"
              >
                {updatePostMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}