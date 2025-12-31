import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function CommentModal({ open, onClose, post, onAddComment }) {
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onAddComment(comment);
      setComment('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-2xl max-h-[80vh] p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Comments</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="overflow-y-auto max-h-[50vh] px-4 py-2">
          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-4">
              {post.comments.map((comment, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">
                      {comment.user?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-gray-900">{comment.user}</span>{' '}
                      <span className="text-gray-700">{comment.text}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(comment.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No comments yet</p>
              <p className="text-sm mt-1">Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Add Comment */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 rounded-full border-2 border-gray-200 focus:border-purple-500"
            />
            <Button
              type="submit"
              disabled={!comment.trim()}
              className="rounded-full w-10 h-10 p-0 bg-purple-500 hover:bg-purple-600 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}