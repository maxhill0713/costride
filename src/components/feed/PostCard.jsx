import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Send, MoreHorizontal, Trash2, Flame } from 'lucide-react';
import { format } from 'date-fns';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PostCard({ post, onLike, onComment, onSave, onDelete }) {
  const [reacted, setReacted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Post.delete(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted');
      if (onDelete) onDelete(post.id);
    },
    onError: () => {
      toast.error('Failed to delete post');
    }
  });

  const isOwner = currentUser?.id === post.member_id;

  const handleLike = () => {
    setLiked(!liked);
    onLike(post.id, !liked);
  };

  const handleSave = () => {
    setSaved(!saved);
    if (onSave) onSave(post.id, !saved);
  };

  const handleAddComment = (commentText) => {
    onComment(post.id, commentText);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg mb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center overflow-hidden">
            {post.member_avatar ? (
              <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">
                {post.member_name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{post.member_name}</p>
            {post.exercise && (
              <p className="text-xs text-gray-500 capitalize">{post.exercise.replace(/_/g, ' ')}</p>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-600 hover:text-gray-800 relative z-10"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <button
                  onClick={() => {
                    deleteMutation.mutate();
                    setShowMenu(false);
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video or Image */}
      {post.video_url ? (
        <div className="w-full aspect-square bg-black">
          <video 
            src={post.video_url} 
            className="w-full h-full object-cover"
            controls
            playsInline
            preload="metadata"
          />
        </div>
      ) : post.image_url ? (
        <div className="w-full aspect-square bg-gray-100">
          <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
        </div>
      ) : null}

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="hover:scale-110 transition-transform active:scale-95">
              <Heart className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
            </button>
            <button onClick={() => setShowComments(true)} className="hover:scale-110 transition-transform active:scale-95">
              <MessageCircle className="w-6 h-6 text-gray-900" />
            </button>
            <button onClick={() => setShowShare(true)} className="hover:scale-110 transition-transform active:scale-95">
              <Send className="w-6 h-6 text-gray-900" />
            </button>
          </div>
          <button onClick={handleSave} className="hover:scale-110 transition-transform active:scale-95">
            <Bookmark className={`w-6 h-6 ${saved ? 'fill-gray-900 text-gray-900' : 'text-gray-900'}`} />
          </button>
        </div>

        {/* Likes with Streak Icon */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            {liked && (
              currentUser?.streak_variant === 'sunglasses' ? (
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500 fill-current" />
                  <svg 
                    className="absolute w-4 h-2 pointer-events-none"
                    viewBox="0 0 64 32"
                    style={{ top: '0px' }}
                  >
                    <circle cx="16" cy="16" r="5" fill="none" stroke="currentColor" strokeWidth="1" className="text-black" />
                    <circle cx="48" cy="16" r="5" fill="none" stroke="currentColor" strokeWidth="1" className="text-black" />
                    <line x1="21" y1="16" x2="43" y2="16" stroke="currentColor" strokeWidth="1" className="text-black" />
                  </svg>
                </div>
              ) : (
                <Flame className="w-5 h-5 text-orange-500 fill-current" />
              )
            )}
          </div>
          <p className="font-semibold text-sm text-gray-900">
            {(post.likes || 0) + (liked ? 1 : 0)} {liked ? 'reactions' : 'likes'}
          </p>
        </div>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-semibold text-gray-900 mr-2">{post.member_name}</span>
          <span className="text-gray-900">{post.content}</span>
          {post.weight && (
            <span className="block mt-1 text-blue-600 font-semibold">
              💪 {post.weight} lbs
            </span>
          )}
        </div>

        {/* View Comments */}
        {post.comments && post.comments.length > 0 && (
          <button 
            onClick={() => setShowComments(true)}
            className="text-sm text-gray-500 mt-2 hover:text-gray-700"
          >
            View all {post.comments.length} comments
          </button>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-400 mt-2 uppercase">
          {format(new Date(post.created_date), 'MMM d, yyyy')}
        </p>
      </div>

      {/* Modals */}
      <CommentModal 
        open={showComments}
        onClose={() => setShowComments(false)}
        post={post}
        onAddComment={handleAddComment}
      />
      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        post={post}
      />
    </motion.div>
  );
}