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
    onMutate: async ({ postId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts']);
      
      queryClient.setQueryData(['posts'], (old = []) => 
        old.map(p => {
          if (p.id === postId) {
            const reactions = { ...(p.reactions || {}) };
            const userId = currentUser?.id;
            if (reactions[userId] === emoji) {
              delete reactions[userId];
            } else {
              reactions[userId] = emoji;
            }
            return { ...p, reactions };
          }
          return p;
        })
      );
      
      setShowReactions(false);
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['posts'], context.previousPosts);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
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
    <Card className="bg-slate-800/60 backdrop-blur-sm border-2 border-slate-700/50 overflow-hidden hover:shadow-lg transition-all rounded-2xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 md:w-12 h-10 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden">
            {post.member_avatar ? (
              <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm md:text-base font-bold text-white">
                {post.member_name?.charAt(0)?.toUpperCase() || 'G'}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm md:text-base font-semibold text-slate-100">{post.member_name}</h3>
            <p className="text-xs md:text-sm text-slate-400">
              {format(new Date(post.created_date), 'MMM d')}
            </p>
          </div>
        </div>
        {isGymOwner && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEditModal(true)}
              className="text-slate-400 hover:text-slate-200 h-8 w-8 md:h-10 md:w-10"
            >
              <Edit className="w-4 h-4 md:w-5 md:h-5" />
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
              className="text-red-400 hover:text-red-300 min-h-[44px] min-w-[44px] h-auto w-auto p-2"
            >
              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Media */}
      {(post.video_url || post.image_url) && (
        <div className="w-full bg-slate-900/50 overflow-hidden">
          {post.video_url ? (
            <video 
              src={post.video_url} 
              controls 
              className="w-full h-auto max-h-[300px] md:max-h-[400px] object-cover"
            />
          ) : post.image_url ? (
            <img 
              src={post.image_url} 
              alt="Post" 
              className="w-full h-auto max-h-[300px] md:max-h-[400px] object-cover"
            />
          ) : null}
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 md:px-6 pt-3 md:pt-4">
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={`text-2xl md:text-3xl transition-transform active:scale-90 ${userReaction ? '' : 'grayscale-[50%]'}`}
            >
              {userReaction || '❤️'}
            </button>

            {/* Reaction picker */}
            {showReactions && (
              <div className="absolute bottom-full left-0 mb-2 p-2 md:p-3 bg-slate-700 rounded-xl shadow-2xl border border-slate-600 flex gap-2 md:gap-3 z-10">
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => reactionMutation.mutate({ postId: post.id, emoji })}
                    className="text-2xl md:text-3xl hover:scale-125 transition-transform active:scale-110"
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

      {/* Likes Count */}
      {totalReactions > 0 && (
        <div className="px-4 md:px-6 py-2">
          <p className="text-sm md:text-base font-semibold text-slate-100">
            {totalReactions} {totalReactions === 1 ? 'like' : 'likes'}
          </p>
        </div>
      )}

      {/* Caption */}
      <div className="px-4 md:px-6 pb-3 md:pb-4">
        <p className="text-sm md:text-base text-slate-200 leading-relaxed">
          <span className="font-semibold mr-1">{post.member_name}</span>
          {post.content}
        </p>
        
        {post.exercise && post.weight && (
          <p className="text-sm md:text-base text-slate-400 mt-2">
            {post.exercise.replace('_', ' ')} • {post.weight} lbs
          </p>
        )}
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