import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, MessageCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

function ChallengeItem({ challenge }) {
  const daysLeft = challenge.end_date
    ? Math.max(0, Math.floor((new Date(challenge.end_date) - new Date()) / 86400000))
    : null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', borderRadius: 14,
      background: 'rgba(167,139,250,0.07)',
      border: '1px solid rgba(167,139,250,0.2)',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Trophy style={{ width: 16, height: 16, color: '#a78bfa' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{challenge.title}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
          {challenge.status === 'active' ? '🔥 Active' : '⏳ Upcoming'}
          {daysLeft !== null && ` · ${daysLeft}d left`}
          {challenge.participants?.length > 0 && ` · ${challenge.participants.length} joined`}
        </p>
      </div>
    </div>
  );
}

function PostItem({ post }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', borderRadius: 14,
      background: 'rgba(14,165,233,0.06)',
      border: '1px solid rgba(14,165,233,0.18)',
    }}>
      {post.image_url ? (
        <img src={post.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageCircle style={{ width: 16, height: 16, color: '#38bdf8' }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {post.content?.split('\n')[0]?.slice(0, 60) || 'Gym update'}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
          📢 From your gym
          {post.likes > 0 && ` · ❤ ${post.likes}`}
        </p>
      </div>
    </div>
  );
}

export default function GymChallengesSection({ gymId }) {
  const { data: challenges = [] } = useQuery({
    queryKey: ['gymChallengesHome', gymId],
    queryFn: () => base44.entities.Challenge.filter({ gym_id: gymId, is_app_challenge: false }, '-created_date', 5),
    enabled: !!gymId,
    staleTime: 3 * 60 * 1000,
  });

  const { data: ownerPosts = [] } = useQuery({
    queryKey: ['gymOwnerPosts', gymId],
    queryFn: () => base44.entities.Post.filter({ member_id: gymId }, '-created_date', 3),
    enabled: !!gymId,
    staleTime: 2 * 60 * 1000,
  });

  const activeChallenges = challenges.filter(c => c.status === 'active' || c.status === 'upcoming').slice(0, 2);
  const recentPosts = ownerPosts.slice(0, 2);

  if (activeChallenges.length === 0 && recentPosts.length === 0) return null;

  return (
    <Link to={createPageUrl('GymCommunity') + `?id=${gymId}`} className="block">
      <div style={{
        borderRadius: 16, padding: '14px 14px 12px',
        background: 'linear-gradient(135deg, rgba(20,24,48,0.85) 0%, rgba(8,10,20,0.92) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy style={{ width: 12, height: 12, color: '#a78bfa' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>New Challenges</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
            View all <ChevronRight style={{ width: 12, height: 12 }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {activeChallenges.map(c => <ChallengeItem key={c.id} challenge={c} />)}
          {recentPosts.map(p => <PostItem key={p.id} post={p} />)}
        </div>
      </div>
    </Link>
  );
}