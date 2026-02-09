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
      className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden relative"
    >
      {/* Header - Profile Picture Only */}
      <div className="absolute top-3 left-3 z-10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
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

      {/* Caption Section - Thin Block */}
      <div className="px-4 py-1 text-sm text-gray-900">
        <p className="leading-snug">{post.content}</p>
        {post.weight && (
          <span className="block mt-1 text-blue-600 font-semibold">
            💪 {post.weight} lbs
          </span>
        )}
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