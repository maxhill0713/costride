import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Archive, Image } from 'lucide-react';
import SettingsSubPageShell from '../components/settings/SettingsSubPageShell';
import PostCard from '../components/feed/PostCard';

export default function PostArchive() {
  const [selectedPost, setSelectedPost] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['archivePosts', currentUser?.id],
    queryFn: () => base44.entities.Post.filter({ member_id: currentUser.id }, '-created_date', 50),
    enabled: !!currentUser?.id,
    staleTime: 2 * 60 * 1000,
  });

  return (
    <SettingsSubPageShell
      title="Archive"
      rightContent={<span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{posts.length} posts</span>}
    >
      {/* Info Banner */}
      <div style={{ marginBottom: 0 }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Archive style={{ width: 15, height: 15, color: '#60a5fa', flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            All posts you've ever made, including ones removed from your profile.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 520, margin: '0 auto', paddingBottom: 80 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(96,165,250,0.3)', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(71,85,105,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Image style={{ width: 24, height: 24, color: '#334155' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>No posts yet</p>
            <p style={{ fontSize: 12, color: '#475569' }}>Posts you make will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                style={{ position: 'relative', aspectRatio: '1', background: '#0f172a', cursor: 'pointer', overflow: 'hidden' }}
              >
                {post.image_url || post.video_url ? (
                  post.video_url
                    ? <video src={post.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <img src={post.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(30,35,60,0.8), rgba(8,10,20,0.9))' }}>
                    <p style={{ fontSize: 11, color: '#475569', textAlign: 'center', padding: '0 8px', lineHeight: 1.4 }}>{(post.content || '').slice(0, 60)}{post.content?.length > 60 ? '…' : ''}</p>
                  </div>
                )}
                {post.is_hidden && (
                  <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '2px 6px' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8' }}>Hidden</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post lightbox */}
      {selectedPost && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setSelectedPost(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480 }}>
            <PostCard
              post={selectedPost}
              fullWidth={false}
              currentUser={currentUser}
              onLike={() => {}}
              onComment={() => {}}
              onSave={() => {}}
              onDelete={() => setSelectedPost(null)}
            />
          </div>
        </div>
      )}
    </SettingsSubPageShell>
  );
}