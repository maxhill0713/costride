import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function GymPostCard({ post }) {
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
        </div>

        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {post.exercise && post.weight && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200">
            <p className="text-sm font-semibold text-blue-900">
              {post.exercise.replace('_', ' ')} • {post.weight} lbs
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}