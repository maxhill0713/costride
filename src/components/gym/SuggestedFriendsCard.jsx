import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserPlus } from 'lucide-react';

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';
const CARD_STYLE = { background: CARD_BG, border: CARD_BORDER, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

const AV_COLORS = [
  { bg: '#1a2a4a', color: '#93c5fd' }, { bg: '#2a1a3a', color: '#c4b5fd' },
  { bg: '#1a2e20', color: '#86efac' }, { bg: '#2e1a1a', color: '#fca5a5' },
  { bg: '#1a2535', color: '#7dd3fc' },
];
const colorForUser = (userId) => AV_COLORS[(userId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];

export default function SuggestedFriendsCard({ checkIns, currentUser, memberAvatarMap }) {
  const [sentIds, setSentIds] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: myFriends = [] } = useQuery({
    queryKey: ['friends', currentUser?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: currentUser.id, status: 'accepted' }, '-created_date', 200),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000
  });

  const addFriendMutation = useMutation({
    mutationFn: (userId) => base44.functions.invoke('manageFriendship', { friendId: userId, action: 'add' }),
    onSuccess: (_, userId) => {
      setSentIds((prev) => new Set(prev).add(userId));
      queryClient.invalidateQueries({ queryKey: ['friends', currentUser?.id] });
    }
  });

  const suggestions = useMemo(() => {
    if (!currentUser) return [];
    const knownIds = new Set([currentUser.id, ...myFriends.map((f) => f.friend_id), ...myFriends.map((f) => f.user_id)]);
    const seen = new Set();
    return checkIns
      .filter((c) => c.user_id && c.user_name && !knownIds.has(c.user_id) && !seen.has(c.user_id) && seen.add(c.user_id))
      .slice(0, 5);
  }, [checkIns, currentUser, myFriends]);

  if (suggestions.length === 0) return null;

  const ini = (n = '') => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ ...CARD_STYLE, borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ padding: '13px 14px 11px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>People You May Know</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {suggestions.map((c, i) => {
          const col = colorForUser(c.user_id);
          const avatar = memberAvatarMap[c.user_id];
          const sent = sentIds.has(c.user_id);
          return (
            <div key={c.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.045)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: col.bg, border: '1.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: col.color, flexShrink: 0 }}>
                {avatar ? <img src={avatar} alt={c.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(c.user_name)}
              </div>
              <p style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.user_name}</p>
              {sent ? (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, flexShrink: 0, background: 'linear-gradient(to bottom, #1a1f35, #0f1220)', border: '1px solid rgba(99,102,241,0.3)', color: 'rgba(165,180,252,0.85)', letterSpacing: '0.04em' }}>Pending</span>
              ) : (
                <button
                  onClick={() => addFriendMutation.mutate(c.user_id)}
                  disabled={addFriendMutation.isPending}
                  style={{ flexShrink: 0, width: '2.1rem', height: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid rgba(147,197,253,0.4)', cursor: 'pointer', background: 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 40%, #2563eb 100%)', boxShadow: '0 3px 0 0 #1a3fa8, 0 5px 12px rgba(0,0,100,0.3), inset 0 1px 0 rgba(255,255,255,0.2)', transition: 'transform 0.1s ease, box-shadow 0.1s ease' }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, 0 5px 12px rgba(0,0,100,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, 0 5px 12px rgba(0,0,100,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
                  onTouchStart={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onTouchEnd={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, 0 5px 12px rgba(0,0,100,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
                >
                  <UserPlus style={{ width: 13, height: 13, color: '#fff' }} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}