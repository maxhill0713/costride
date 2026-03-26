import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import PostCard from '../feed/PostCard';
import { createPageUrl } from '../../utils';

function ActivityFeedSection({
  friends,
  filteredActivityCards,
  activityFeed,
  socialFeedPosts,
  visiblePostCount,
  feedBottomRef,
  isLoadingMorePosts,
  currentUser,
  queryClient,
  dismissCard,
}) {
  if (friends.length === 0) return null;

  return (
    <div className="space-y-3 mt-12">
      {filteredActivityCards.length > 0 && (
        <div className="space-y-3">
          {filteredActivityCards.map(card => (
            <div key={card.id} style={{ background:'#1e293b', border:'1.5px solid #334155', borderBottom:'4px solid #0f172a', borderRadius:16 }} className="relative overflow-hidden">
              <button onClick={() => dismissCard(card.id)} className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all text-[10px] font-bold z-10">✕</button>
              <div className="px-4 py-4 flex items-center gap-4">
                <span className="text-3xl select-none flex-shrink-0">{card.emoji}</span>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-extrabold text-white text-[14px] leading-tight">{card.title}</p>
                  <p className="text-[12px] text-slate-400 mt-1 font-medium">{card.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activityFeed.length > 0 && (
        <div className="space-y-3">
          {activityFeed.map(activity =>
            activity.type === 'notification' ? (
              <Card key={activity.id} className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 overflow-hidden rounded-xl shadow-2xl shadow-black/20">
                <div className="p-3"><p className="text-xs text-white leading-tight">{activity.message}</p></div>
              </Card>
            ) : (
              <Card key={activity.id} className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 overflow-hidden rounded-xl shadow-2xl shadow-black/20">
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <Link to={createPageUrl('UserProfile') + `?id=${activity.friendId}`} className="flex-shrink-0">
                      {activity.friendAvatar
                        ? <img src={activity.friendAvatar} alt={activity.friendName} className="w-10 h-10 rounded-full object-cover" />
                        : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center"><span className="text-white font-bold text-sm">{activity.friendName?.charAt(0)?.toUpperCase()||'U'}</span></div>}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white leading-tight"><span className="font-semibold">{activity.friendName}</span> <span className="text-slate-300">{activity.message}</span>{activity.emoji && <span className="ml-1">{activity.emoji}</span>}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500">{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
                        {activity.type === 'pr' && <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] px-1.5 py-0">🏆 PR</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          )}
        </div>
      )}

      {socialFeedPosts.length > 0 && (
        <div className="space-y-3">
          {socialFeedPosts.slice(0, visiblePostCount).map(post => (
            <PostCard key={post.id} post={post} fullWidth={true} currentUser={currentUser} isOwnProfile={post.member_id === currentUser?.id} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => queryClient.invalidateQueries({ queryKey: ['posts'] })} />
          ))}
        </div>
      )}

      {/* Sentinel — always rendered so the observer stays attached */}
      <div ref={feedBottomRef} className="flex justify-center py-3">
        {visiblePostCount < socialFeedPosts.length && (
          <div style={{
            width: 30, height: 30,
            borderRadius: '50%',
            border: '2.5px solid rgba(148,163,184,0.2)',
            borderTop: '2.5px solid #60a5fa',
            animation: 'spin 0.7s linear infinite',
          }} />
        )}
      </div>
    </div>
  );
}

export default React.memo(ActivityFeedSection);