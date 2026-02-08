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

  const handleReact = () => {
    setReacted(!reacted);
    onLike(post.id, !reacted);
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
      className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden"
    >
      {/* Header - Profile Picture Only */}
      <div className="absolute top-3 left-3 z-10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
          {post.member_avatar ? (
            <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-white">
              {post.member_name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Delete Menu */}
      {isOwner && (
        <div className="absolute top-3 right-3 z-20">
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-600 hover:text-gray-800 bg-white rounded-full p-2 shadow-lg"
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
        </div>
      )}

      {/* Video or Image - Full Size */}
      <div className="relative w-full aspect-square bg-gray-100">
        {post.video_url ? (
          <video 
            src={post.video_url} 
            className="w-full h-full object-cover"
            controls
            playsInline
            preload="metadata"
          />
        ) : post.image_url ? (
          <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
        ) : null}
      </div>

      {/* Thin Action Bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={handleReact} className="hover:scale-110 transition-transform active:scale-95 flex items-center gap-1">
            {reacted ? (
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
            ) : (
              <>
                <div className="w-5 h-5 border-2 border-gray-900 rounded-full relative flex items-center justify-center">
                  <Flame className="w-3 h-3 text-gray-900" />
                </div>
                <span className="text-gray-900 font-semibold">+</span>
              </>
            )}
          </button>
          <span className="text-xs text-gray-600 font-medium">{(post.likes || 0) + (reacted ? 1 : 0)}</span>
        </div>

        <button onClick={() => setShowComments(true)} className="hover:scale-110 transition-transform active:scale-95">
          <MessageCircle className="w-5 h-5 text-gray-900" />
        </button>

        <button onClick={() => setShowShare(true)} className="hover:scale-110 transition-transform active:scale-95">
          <Send className="w-5 h-5 text-gray-900" />
        </button>

        <button onClick={handleSave} className="ml-auto hover:scale-110 transition-transform active:scale-95">
          <Bookmark className={`w-5 h-5 ${saved ? 'fill-gray-900 text-gray-900' : 'text-gray-900'}`} />
        </button>
      </div>

      {/* Caption Section - Below Image */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="text-xs mb-2">
          <span className="font-semibold text-gray-900">{post.member_name}</span>
          {post.exercise && (
            <span className="text-gray-600 ml-2 capitalize">({post.exercise.replace(/_/g, ' ')})</span>
          )}
        </div>
        <p className="text-sm text-gray-900 leading-snug">{post.content}</p>
        {post.weight && (
          <span className="block mt-1 text-blue-600 font-semibold text-sm">
            💪 {post.weight} lbs
          </span>
        )}
        {post.comments && post.comments.length > 0 && (
          <button 
            onClick={() => setShowComments(true)}
            className="text-xs text-gray-500 mt-1 hover:text-gray-700"
          >
            View {post.comments.length} comments
          </button>
        )}
        <p className="text-xs text-gray-400 mt-1 uppercase">
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