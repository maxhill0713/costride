import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Send, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';

export default function PostCard({ post, onLike, onComment, onSave }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

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
        <button className="text-gray-600 hover:text-gray-800">
          <MoreHorizontal className="w-5 h-5" />
        </button>
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

        {/* Likes */}
        <p className="font-semibold text-sm text-gray-900 mb-2">
          {(post.likes || 0) + (liked ? 1 : 0)} likes
        </p>

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