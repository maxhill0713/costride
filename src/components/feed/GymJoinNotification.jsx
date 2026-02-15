import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Building2 } from 'lucide-react';

export default function GymJoinNotification({ post }) {
  return (
    <div className="flex justify-center mb-4 w-full">
      <Link 
        to={createPageUrl('UserProfile') + `?id=${post.member_id}`}
        className="w-1/4 max-w-xs"
      >
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4 hover:border-blue-400/50 transition-all cursor-pointer">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
              {post.member_avatar ? (
                <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {post.member_name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">{post.member_name}</p>
              <p className="text-xs text-blue-300">joined a gym</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <p className="text-xs text-slate-200">{post.content}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}