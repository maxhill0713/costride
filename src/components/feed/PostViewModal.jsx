import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Heart, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function PostViewModal({ post, open, onClose, friendName, friendAvatar, friendId }) {
  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <Link 
            to={createPageUrl('UserProfile') + `?id=${friendId}`}
            className="flex items-center gap-3"
          >
            {friendAvatar ? (
              <img src={friendAvatar} alt={friendName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">{friendName?.charAt(0)?.toUpperCase()}</span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{friendName}</p>
              <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>

          {/* Media */}
          {post.video_url ? (
            <video src={post.video_url} controls className="w-full rounded-xl bg-slate-900" />
          ) : post.image_url ? (
            <img src={post.image_url} alt="" className="w-full rounded-xl object-cover" />
          ) : null}

          {/* Engagement */}
          <div className="flex items-center gap-6 pt-2 border-t">
            <div className="flex items-center gap-2 text-gray-600">
              <Heart className="w-5 h-5" />
              <span className="font-semibold">{post.likes || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">{post.comments?.length || 0}</span>
            </div>
          </div>

          {/* Comments */}
          {post.comments && post.comments.length > 0 && (
            <div className="space-y-3 pt-2 border-t">
              <p className="font-semibold text-gray-900 text-sm">Comments</p>
              {post.comments.map((comment, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{comment.user?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm"><span className="font-semibold text-gray-900">{comment.user}</span> {comment.text}</p>
                    <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}