import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Edit, Loader2, Trash2, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const REACTIONS = ['💪', '🔥', '👏', '💯', '⚡'];

export default function GymPostCard({ post, gym, onDelete = null, isOwner = false }) {
  const queryClient = useQueryClient();
  const [showReactions, setShowReactions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImageUrl, setEditImageUrl] = useState(post.image_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
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

  React.useEffect(() => {
    if (userReaction) {
      setIsLiked(true);
    }
  }, [userReaction]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    reactionMutation.mutate({ postId: post.id, emoji: '❤️' });
  };

  const handleShare = async (method) => {
    const shareUrl = window.location.href;
    const shareText = `Check out this post from ${post.member_name} at ${gym?.name || 'the gym'}!`;
    
    switch(method) {
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
    }
    setShowShareMenu(false);
  };

  return (
    <Card className="bg-black border-0 overflow-hidden shadow-lg w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-0.5">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              {post.member_avatar ? (
                <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white">
                  {post.member_name?.charAt(0)?.toUpperCase() || 'G'}
                </span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{post.member_name}</h3>
            <p className="text-[11px] text-slate-400">
              {format(new Date(post.created_date), 'MMM d')}
            </p>
          </div>
        </div>
        {isGymOwner && (
          <button 
            onClick={() => setShowEditModal(true)}
            className="text-white hover:text-slate-300 p-2"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Media */}
      {(post.video_url || post.image_url) && (
        <div className="w-full bg-black overflow-hidden">
          {post.video_url ? (
            <video 
              src={post.video_url} 
              controls 
              className="w-full h-auto aspect-square object-cover"
            />
          ) : post.image_url ? (
            <img 
              src={post.image_url} 
              alt="Post" 
              className="w-full h-auto aspect-square object-cover"
            />
          ) : null}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 px-3 py-2">
        {currentUser && (
          <>
            <button
              onClick={handleLike}
              className="transition-transform active:scale-90"
            >
              <Heart 
                className={`w-7 h-7 ${isLiked || userReaction ? 'fill-red-500 text-red-500' : 'text-white'} transition-colors`}
              />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="transition-transform active:scale-90"
              >
                <Share2 className="w-6 h-6 text-white" />
              </button>

              {/* Share Menu */}
              {showShareMenu && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700 z-50 min-w-[160px]">
                  <button
                    onClick={() => handleShare('copy')}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Share to WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Share to Twitter
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Share to Facebook
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Likes Count */}
      {totalReactions > 0 && (
        <div className="px-3 pb-1">
          <p className="text-sm font-semibold text-white">
            {totalReactions} {totalReactions === 1 ? 'like' : 'likes'}
          </p>
        </div>
      )}

      {/* Caption */}
      <div className="px-3 pb-3">
        <p className="text-sm text-white leading-relaxed">
          <span className="font-semibold mr-1">{post.member_name}</span>
          {post.content}
        </p>
        
        {post.exercise && post.weight && (
          <p className="text-xs text-slate-400 mt-1.5">
            {post.exercise.replace('_', ' ')} • {post.weight} lbs
          </p>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Post</DialogTitle>
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
                className="flex-1 rounded-2xl border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => updatePostMutation.mutate()}
                disabled={updatePostMutation.isPending || !editContent.trim()}
                className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-2xl"
              >
                {updatePostMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
              {isGymOwner && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Delete this post?')) {
                      deletePostMutation.mutate();
                      setShowEditModal(false);
                    }
                  }}
                  disabled={deletePostMutation.isPending}
                  className="rounded-2xl border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}