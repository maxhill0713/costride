import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Building2 } from 'lucide-react';

export default function GymJoinNotification({ post }) {
  return (
    <div className="mb-4">
      <Link 
        to={createPageUrl('UserProfile') + `?id=${post.member_id}`}
        className="inline-block"
      >
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-500/30 rounded-xl p-2 hover:border-blue-400/50 transition-all cursor-pointer">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
              {post.member_avatar ? (
                <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-xs font-bold text-white">
                  {post.member_name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-xs">{post.member_name}</p>
              <p className="text-[10px] text-blue-300">joined a gym</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex items-center gap-1.5 p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Building2 className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <p className="text-[10px] text-slate-200">{post.content}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}