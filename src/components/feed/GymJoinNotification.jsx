import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Building2 } from 'lucide-react';

export default function GymJoinNotification({ post }) {
  return (
    <div className="mb-2">
      <Link 
        to={createPageUrl('UserProfile') + `?id=${post.member_id}`}
        className="inline-block max-w-[120px]"
      >
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-500/30 rounded-lg p-1 hover:border-blue-400/50 transition-all cursor-pointer">
          {/* Header */}
          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
              {post.member_avatar ? (
                <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-[10px] font-bold text-white">
                  {post.member_name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-[10px] truncate">{post.member_name}</p>
              <p className="text-[8px] text-blue-300 leading-none">joined gym</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex items-center gap-1 p-1 bg-blue-500/10 rounded border border-blue-500/20">
            <Building2 className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
            <p className="text-[8px] text-slate-200 line-clamp-2">{post.content}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}