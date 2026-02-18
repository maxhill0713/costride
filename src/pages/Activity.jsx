import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, Heart, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Activity() {
  const [activeTab, setActiveTab] = useState('reactions');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['userPosts', currentUser?.id],
    queryFn: () => base44.entities.Post.filter({ member_id: currentUser?.id }, '-created_date', 50),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const reactedPosts = posts.filter(post => 
    post.reactions && Object.keys(post.reactions).length > 0
  );

  const pagesVisited = [
    { name: 'Home', path: 'Home', icon: '🏠' },
    { name: 'Gyms', path: 'Gyms', icon: '🏋️' },
    { name: 'Profile', path: 'Profile', icon: '👤' },
    { name: 'Leaderboard', path: 'Leaderboard', icon: '🏆' },
    { name: 'Rewards', path: 'RedeemReward', icon: '🎁' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('ProfileSettings')}>
            <div className="flex items-center justify-center w-10 h-10">
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-white">Activity</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('reactions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'reactions'
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <Heart className="w-4 h-4" />
            Reacted Posts
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'pages'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            Pages Visited
          </button>
        </div>

        {/* Reacted Posts */}
        {activeTab === 'reactions' && (
          <div className="space-y-4">
            {reactedPosts.length > 0 ? (
              reactedPosts.map(post => (
                <Card key={post.id} className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20 hover:border-white/20 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-lg">
                      {post.reactions && Object.keys(post.reactions)[0] || '❤️'}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-100 font-medium line-clamp-2">{post.content}</p>
                      <p className="text-slate-400 text-sm mt-1">
                        {Object.keys(post.reactions || {}).length} reaction{Object.keys(post.reactions || {}).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20 text-center">
                <Heart className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-slate-400">No reacted posts yet</p>
              </Card>
            )}
          </div>
        )}

        {/* Pages Visited */}
        {activeTab === 'pages' && (
          <div className="grid gap-3">
            {pagesVisited.map(page => (
              <Link key={page.path} to={createPageUrl(page.path)}>
                <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20 hover:border-white/20 transition-all cursor-pointer hover:scale-102">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{page.icon}</span>
                    <span className="text-slate-100 font-medium">{page.name}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}