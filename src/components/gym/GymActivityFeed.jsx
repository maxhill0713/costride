import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Trophy, Dumbbell, MessageCircle, Award, ChevronDown, ChevronUp } from 'lucide-react';

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';
const CARD_STYLE = { background: CARD_BG, border: CARD_BORDER, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

const AV_COLORS = [
  { bg: '#1a2a4a', color: '#93c5fd' }, { bg: '#2a1a3a', color: '#c4b5fd' },
  { bg: '#1a2e20', color: '#86efac' }, { bg: '#2e1a1a', color: '#fca5a5' },
  { bg: '#1a2535', color: '#7dd3fc' }, { bg: '#422006', color: '#fb923c' },
  { bg: '#1e2a30', color: '#67e8f9' }, { bg: '#2a1a28', color: '#f0abfc' }
];
const colorForUser = (userId) => AV_COLORS[(userId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];

const CSS = `
@keyframes af-in  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes af-pr-glow{ 0%,100%{text-shadow:0 0 8px rgba(234,179,8,0.6)} 50%{text-shadow:0 0 18px rgba(234,179,8,1)} }
`;

const FEED_TYPES = {
  checkin:   { icon: MapPin,        iconColor: '#60a5fa', verb: 'checked in' },
  lift_pr:   { icon: Trophy,        iconColor: '#eab308', verb: 'hit a new PR 🔥' },
  lift:      { icon: Dumbbell,      iconColor: '#a78bfa', verb: 'logged a workout' },
  challenge: { icon: Trophy,        iconColor: '#f97316', verb: 'joined a challenge 🏆' },
  milestone: { icon: Award,         iconColor: '#fbbf24', verb: 'hit a milestone 🎉' },
  post:      { icon: MessageCircle, iconColor: '#34d399', verb: 'has posted' },
};

function FeedCard({ item, memberAvatarMap, index }) {
  const [postExpanded, setPostExpanded] = useState(false);
  const col = colorForUser(item.userId);
  const avatar = item.gymAvatar !== undefined ? item.gymAvatar : memberAvatarMap[item.userId];
  const ini = (n = '') => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const type = item.type === 'checkin' ? FEED_TYPES.checkin :
    item.type === 'challenge' ? FEED_TYPES.challenge :
    item.type === 'milestone' ? FEED_TYPES.milestone :
    item.type === 'post' ? FEED_TYPES.post :
    item.data?.is_personal_record || item.data?.is_pr ? FEED_TYPES.lift_pr :
    FEED_TYPES.lift;

  const isPR = item.type === 'lift' && (item.data?.is_personal_record || item.data?.is_pr);

  const timeAgo = (d) => {
    if (!d) return '';
    let date = new Date(d);
    if (typeof d === 'string' && !d.endsWith('Z') && !d.match(/[+-]\d{2}:\d{2}$/)) date = new Date(d + 'Z');
    const s = (Date.now() - date) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.045)', animation: `af-in 0.3s ease ${index * 0.04}s both` }}>
      <div style={{ display: 'flex', gap: 12, padding: '13px 14px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: col.bg, border: `2px solid ${isPR ? 'rgba(234,179,8,0.5)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: col.color, boxShadow: isPR ? '0 0 12px rgba(234,179,8,0.35)' : '0 2px 8px rgba(0,0,0,0.35)' }}>
            {avatar ? <img src={avatar} alt={item.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(item.userName)}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, color: 'rgba(226,232,240,0.9)', lineHeight: 1.4, marginBottom: 3 }}>
            <span style={{ fontWeight: 800, color: '#fff' }}>{item.userName}</span>{' '}
            <span style={{ color: isPR ? '#fbbf24' : item.type === 'challenge' ? '#fb923c' : item.type === 'milestone' ? '#fbbf24' : item.type === 'post' ? '#34d399' : 'rgba(226,232,240,0.7)', animation: isPR ? 'af-pr-glow 2s ease-in-out infinite' : 'none' }}>
              {type.verb}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {item.type === 'checkin' && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>At the gym</span>}
            {(item.type === 'lift' || item.type === 'lift_pr') && <>
              <span style={{ fontSize: 11, fontWeight: 700, color: isPR ? 'rgba(251,191,36,0.9)' : 'rgba(167,139,250,0.9)', background: isPR ? 'rgba(234,179,8,0.1)' : 'rgba(168,85,247,0.1)', border: `1px solid ${isPR ? 'rgba(234,179,8,0.2)' : 'rgba(168,85,247,0.2)'}`, borderRadius: 99, padding: '2px 8px' }}>
                {item.data?.workout_type || item.data?.exercise || 'Workout'}
              </span>
              {item.data?.duration_minutes && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{item.data.duration_minutes} min</span>}
              {item.data?.weight_lbs && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{item.data.weight_lbs} lbs</span>}
            </>}
            {item.type === 'challenge' && item.data?.title && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(249,115,22,0.9)', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 99, padding: '2px 8px' }}>{item.data.title}</span>}
            {item.type === 'milestone' && item.data?.title && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(251,191,36,0.9)', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 99, padding: '2px 8px' }}>{item.data.title}</span>}
            {item.type === 'post' && !postExpanded && <button onClick={() => setPostExpanded(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(52,211,153,0.75)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 99, padding: '2px 9px', cursor: 'pointer' }}>Show post <ChevronDown style={{ width: 10, height: 10 }} /></button>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, minWidth: 40, gap: 4 }}>
          <span style={{ fontSize: 10.5, color: 'rgba(148,163,184,0.45)', fontWeight: 600 }}>{timeAgo(item.date)}</span>
          {item.type === 'post' && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.65)' }}>{Object.keys(item.data?.reactions || {}).length} Reacts</span>}
        </div>
      </div>
      {item.type === 'post' && postExpanded &&
      <div style={{ margin: '0 14px 12px', padding: '10px 12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 10 }}>
        <p style={{ fontSize: 12.5, color: 'rgba(226,232,240,0.8)', lineHeight: 1.55, margin: '0 0 8px' }}>{item.data?.content}</p>
        {item.data?.image_url && <img src={item.data.image_url} alt="post" style={{ width: '100%', borderRadius: 8, marginBottom: 6, maxHeight: 200, objectFit: 'cover' }} />}
        <button onClick={() => setPostExpanded(false)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(148,163,184,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <ChevronUp style={{ width: 10, height: 10 }} /> Collapse
        </button>
      </div>}
    </div>
  );
}

export default function GymActivityFeed({ checkIns, memberAvatarMap, memberNameMap = {}, workoutLogs = [], challengeParticipants = [], challenges = [], achievements = [], posts = [] }) {
  useEffect(() => {
    if (!document.getElementById('af-css')) {
      const s = document.createElement('style'); s.id = 'af-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  const items = useMemo(() => {
    const all = [];
    const resolveName = (userId, fallback) => memberNameMap[userId] || fallback || 'Member';
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const seenCI = new Set();

    checkIns.forEach((c) => {
      const key = `${c.user_id}-${(c.check_in_date || '').slice(0, 10)}`;
      if (seenCI.has(key)) return;
      seenCI.add(key);
      all.push({ type: 'checkin', id: `ci-${c.id}`, userId: c.user_id, userName: resolveName(c.user_id, c.user_name), date: c.check_in_date, data: c });
    });
    workoutLogs.forEach((w) => {
      all.push({ type: 'lift', id: `wl-${w.id}`, userId: w.user_id, userName: resolveName(w.user_id, w.user_name), date: w.created_date || w.completed_date, data: w });
    });
    const challengeMap = {};
    challenges.forEach((c) => { challengeMap[c.id] = c; });
    challengeParticipants.forEach((p) => {
      const ch = challengeMap[p.challenge_id];
      all.push({ type: 'challenge', id: `cp-${p.id}`, userId: p.user_id, userName: resolveName(p.user_id, p.user_name), date: p.joined_date || p.created_date, data: ch || { title: p.challenge_title || 'a challenge' } });
    });
    achievements.forEach((a) => {
      all.push({ type: 'milestone', id: `ach-${a.id}`, userId: a.user_id, userName: resolveName(a.user_id, a.user_name), date: a.created_date, data: a });
    });
    posts.filter((p) => !p.is_hidden).forEach((p) => {
      const isGymPost = !!p.post_type;
      const postUserName = isGymPost ? (p.gym_name || p.member_name || 'Gym') : resolveName(p.member_id, p.member_name);
      const postUserId = isGymPost ? `gym_post_${p.gym_id || p.member_id}` : p.member_id;
      const feedItem = { type: 'post', id: `post-${p.id}`, userId: postUserId, userName: postUserName, isGymPost, date: p.created_date, data: p };
      if (isGymPost) feedItem.gymAvatar = p.member_avatar || null;
      all.push(feedItem);
    });

    return all
      .filter((item) => item.date && new Date(item.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 60);
  }, [checkIns, workoutLogs, challengeParticipants, challenges, achievements, posts]);

  if (items.length === 0) return null;

  return (
    <div style={{ ...CARD_STYLE, borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ padding: '13px 14px 11px', borderBottom: '1px solid rgba(255,255,255,0.055)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>Gym Activity Feed</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.28)' }}>{items.length} activities in the last week</span>
      </div>
      <div style={{ maxHeight: 400, overflowY: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {items.map((item, index) => <FeedCard key={item.id} item={item} memberAvatarMap={memberAvatarMap} index={index} />)}
      </div>
    </div>
  );
}