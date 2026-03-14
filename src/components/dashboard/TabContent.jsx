import React, { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Plus, Trophy, BarChart2, MessageSquarePlus, Calendar, ChevronRight, TrendingUp, Zap, Heart, MessageCircle, Dumbbell } from 'lucide-react';
import { Card, Empty, Avatar } from './DashboardPrimitives';

// ── Feed post card ────────────────────────────────────────────────────────────
function FeedCard({ post }) {
  const likes    = post.likes?.length || 0;
  const comments = post.comments?.length || 0;
  const hasImage = post.image_url || post.media_url;
  const content  = post.content || post.title || '';

  return (
    <div style={{ borderRadius: 12, background: 'var(--card2)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={post.author_name || post.gym_name || 'G'} size={30}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.author_name || post.gym_name || 'GymPost'}
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
          {post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}
        </span>
        <ChevronRight style={{ width: 13, height: 13, color: 'var(--text3)', flexShrink: 0 }}/>
      </div>
      {content && (
        <div style={{ padding: '0 14px 10px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', margin: 0, lineHeight: 1.4 }}>
            {post.title || content.split('\n')[0]}
          </p>
          {post.title && content !== post.title && (
            <p style={{ fontSize: 12, color: 'var(--text2)', margin: '4px 0 0', lineHeight: 1.5 }}>{content}</p>
          )}
        </div>
      )}
      {hasImage && (
        <div style={{ overflow: 'hidden' }}>
          <img
            src={post.image_url || post.media_url}
            alt=""
            style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
            onError={e => e.currentTarget.parentElement.style.display = 'none'}
          />
        </div>
      )}
      <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: likes > 0 ? '#f87171' : 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Heart style={{ width: 14, height: 14 }}/> {likes}
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: comments > 0 ? '#38bdf8' : 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <MessageCircle style={{ width: 14, height: 14 }}/> {comments}
        </button>
      </div>
    </div>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────
function EventCard({ event, now }) {
  const evDate   = new Date(event.event_date);
  const diffDays = Math.floor((evDate - now) / 86400000);
  return (
    <div style={{ borderRadius: 12, background: 'var(--card2)', border: '1px solid rgba(16,185,129,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar style={{ width: 14, height: 14, color: '#34d399' }}/>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 5, padding: '1px 7px' }}>Event</span>
          <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: diffDays <= 2 ? '#f87171' : '#34d399', background: diffDays <= 2 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', borderRadius: 4, padding: '2px 6px' }}>
            {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${diffDays}d`}
          </span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', margin: '0 0 4px' }}>{event.title}</p>
        {event.description && (
          <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 8px', lineHeight: 1.4 }}>{event.description}</p>
        )}
        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{format(evDate, 'MMM d, h:mm a')}</div>
      </div>
    </div>
  );
}

// ── Challenge card ────────────────────────────────────────────────────────────
function ChallengeCard({ challenge, now }) {
  const start     = new Date(challenge.start_date), end = new Date(challenge.end_date);
  const totalDays = Math.max(1, Math.floor((end - start) / 86400000));
  const elapsed   = Math.max(0, Math.floor((now - start) / 86400000));
  const remaining = Math.max(0, totalDays - elapsed);
  const pct       = Math.min(100, Math.round((elapsed / totalDays) * 100));
  return (
    <div style={{ borderRadius: 12, background: 'var(--card2)', border: '1px solid rgba(245,158,11,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 90, background: 'linear-gradient(135deg,#1a1033,#3b1a5e,#6d28d9)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Trophy style={{ width: 30, height: 30, color: 'rgba(245,158,11,0.6)' }}/>
        <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 4, padding: '2px 7px' }}>Challenge</span>
        <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, color: remaining <= 3 ? '#f87171' : 'var(--text3)', background: 'rgba(0,0,0,0.35)', borderRadius: 4, padding: '2px 7px' }}>{remaining}d left</span>
      </div>
      <div style={{ padding: '10px 14px 12px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', margin: '0 0 6px' }}>{challenge.title}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>👥 {challenge.participants?.length || 0} joined</span>
        </div>
        <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg,#7c3aed,#f59e0b)', transition: 'width 0.8s ease' }}/>
        </div>
      </div>
    </div>
  );
}

// ── Class card ────────────────────────────────────────────────────────────────
function ClassCard({ gymClass }) {
  return (
    <div style={{ borderRadius: 12, background: 'var(--card2)', border: '1px solid rgba(14,165,233,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Dumbbell style={{ width: 14, height: 14, color: '#38bdf8' }}/>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 5, padding: '1px 7px' }}>Class</span>
          {gymClass.schedule && (
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3)' }}>{gymClass.schedule}</span>
          )}
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', margin: '0 0 4px' }}>{gymClass.name || gymClass.title}</p>
        {gymClass.coach_name && (
          <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>with {gymClass.coach_name}</p>
        )}
        {gymClass.description && (
          <p style={{ fontSize: 12, color: 'var(--text2)', margin: '6px 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{gymClass.description}</p>
        )}
      </div>
    </div>
  );
}

// ── Poll card ─────────────────────────────────────────────────────────────────
function PollCard({ poll }) {
  const votes = poll.voters?.length || 0;
  return (
    <div style={{ borderRadius: 12, background: 'var(--card2)', border: '1px solid rgba(139,92,246,0.15)', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <BarChart2 style={{ width: 13, height: 13, color: '#a78bfa' }}/>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 5, padding: '1px 7px' }}>Poll</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', margin: '0 0 8px' }}>{poll.title}</p>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{votes} {votes === 1 ? 'vote' : 'votes'}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TabContent({
  events, challenges, polls, posts, userPosts = [], checkIns, ci30, avatarMap,
  openModal, now, leaderboardView, setLeaderboardView, allMemberships = [], classes = [],
}) {
  const [activeFilter, setActiveFilter] = useState('gym');

  const allPosts        = [...(userPosts || []), ...(posts || [])].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const gymPosts        = allPosts.filter(p => !p.user_id || p.gym_id || p.member_id);
  const memberPosts     = allPosts.filter(p => p.user_id && !p.gym_id);
  const upcomingEvents  = events.filter(e => new Date(e.event_date) >= now);
  const activeChallenges = challenges.filter(c => c.status === 'active');
  const totalChalPart   = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);

  const FILTERS = [
    { id: 'members',    label: 'Member Posts' },
    { id: 'gym',        label: 'Gym Posts' },
    { id: 'challenges', label: 'Challenges' },
    { id: 'classes',    label: 'Classes' },
    { id: 'polls',      label: 'Polls' },
  ];

  const feedItems = useMemo(() => {
    switch (activeFilter) {
      case 'members':    return { posts: memberPosts,     events: [], challenges: [], polls: [], classes: [] };
      case 'gym':        return { posts: gymPosts,        events: [], challenges: [], polls: [], classes: [] };
      case 'challenges': return { posts: [],              events: [], challenges: activeChallenges, polls: [], classes: [] };
      case 'classes':    return { posts: [],              events: [], challenges: [], polls: [], classes: classes };
      case 'polls':      return { posts: [],              events: [], challenges: [], polls: polls, classes: [] };
      default:           return { posts: allPosts,        events: upcomingEvents, challenges: activeChallenges, polls: polls, classes: classes };
    }
  }, [activeFilter, allPosts, gymPosts, memberPosts, upcomingEvents, activeChallenges, polls, classes]);

  const flatFeedItems = useMemo(() => {
    const items = [
      ...feedItems.posts.map(p => ({ type: 'post',      data: p, date: new Date(p.created_date || 0) })),
      ...feedItems.events.map(e => ({ type: 'event',     data: e, date: new Date(e.event_date || 0) })),
      ...feedItems.challenges.map(c => ({ type: 'challenge', data: c, date: new Date(c.start_date || 0) })),
      ...feedItems.polls.map(p => ({ type: 'poll',      data: p, date: new Date(p.created_date || 0) })),
      ...feedItems.classes.map(c => ({ type: 'class',     data: c, date: new Date(c.created_date || 0) })),
    ];
    return items.sort((a, b) => b.date - a.date);
  }, [feedItems]);

  const col1 = flatFeedItems.filter((_, i) => i % 2 === 0);
  const col2 = flatFeedItems.filter((_, i) => i % 2 === 1);

  const renderItem = (item, i) => {
    if (item.type === 'post')      return <FeedCard      key={item.data.id || i} post={item.data}/>;
    if (item.type === 'event')     return <EventCard     key={item.data.id || i} event={item.data} now={now}/>;
    if (item.type === 'challenge') return <ChallengeCard key={item.data.id || i} challenge={item.data} now={now}/>;
    if (item.type === 'poll')      return <PollCard      key={item.data.id || i} poll={item.data}/>;
    if (item.type === 'class')     return <ClassCard     key={item.data.id || i} gymClass={item.data}/>;
    return null;
  };

  const milestones = useMemo(() => {
    const acc = {}, userIdByName = {};
    checkIns.forEach(c => {
      if (!acc[c.user_name]) acc[c.user_name] = 0;
      acc[c.user_name]++;
      if (c.user_id) userIdByName[c.user_name] = c.user_id;
    });
    return Object.entries(acc)
      .map(([name, total]) => {
        const next   = [10, 25, 50, 100, 200, 500].find(n => n > total) || null;
        const recent = ci30.filter(c => c.user_name === name).length;
        return { name, total, next, toNext: next ? next - total : 0, recent, user_id: userIdByName[name] };
      })
      .filter(m => m.next && m.toNext <= 5)
      .sort((a, b) => a.toNext - b.toNext)
      .slice(0, 4);
  }, [checkIns, ci30]);

  const engagementScore = useMemo(() => {
    const postEng  = allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0);
    const pollEng  = polls.reduce((s, p) => s + (p.voters?.length || 0), 0);
    const chalEng  = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);
    const eventEng = events.reduce((s, e) => s + (e.attendees || 0), 0);
    return postEng + pollEng + chalEng + eventEng;
  }, [allPosts, polls, activeChallenges, events]);

  const contentMix = useMemo(() => {
    const total = allPosts.length + events.length + polls.length + challenges.length;
    if (!total) return null;
    return [
      { label: 'Posts',      count: allPosts.length,   color: '#38bdf8', pct: Math.round((allPosts.length / total) * 100) },
      { label: 'Events',     count: events.length,     color: '#34d399', pct: Math.round((events.length / total) * 100) },
      { label: 'Polls',      count: polls.length,      color: '#a78bfa', pct: Math.round((polls.length / total) * 100) },
      { label: 'Challenges', count: challenges.length, color: '#fbbf24', pct: Math.round((challenges.length / total) * 100) },
    ];
  }, [allPosts, events, polls, challenges]);

  const cadenceData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day   = subDays(now, 6 - i);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end   = new Date(start.getTime() + 86400000);
      const count = allPosts.filter(p => { const d = new Date(p.created_date); return d >= start && d < end; }).length;
      return { label: format(day, 'EEE'), count };
    });
  }, [allPosts, now]);
  const cadenceMax = Math.max(...cadenceData.map(d => d.count), 1);

  const pollParticipationRate = useMemo(() => {
    if (!polls.length || !allMemberships.length) return null;
    const totalVotes  = polls.reduce((s, p) => s + (p.voters?.length || 0), 0);
    const maxPossible = polls.length * allMemberships.length;
    return Math.round((totalVotes / maxPossible) * 100);
  }, [polls, allMemberships]);

  const unreachedMembers = useMemo(() => {
    const recentCheckerIds = new Set(ci30.map(c => c.user_id));
    const challengeIds     = new Set(activeChallenges.flatMap(c => c.participants || []));
    const pollVoterIds     = new Set(polls.flatMap(p => p.voters || []));
    return allMemberships.filter(m =>
      !recentCheckerIds.has(m.user_id) &&
      !challengeIds.has(m.user_id) &&
      !pollVoterIds.has(m.user_id)
    ).slice(0, 4);
  }, [allMemberships, ci30, activeChallenges, polls]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) clamp(260px,22%,320px)', gap: 16, height: '100%', maxWidth: '100%' }}>

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minHeight: 0 }}>

        {/* Action cards */}
        <div style={{ flexShrink: 0, paddingBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {[
              { icon: MessageSquarePlus, label: 'New Post',      sub: 'Share with members',                grad: 'linear-gradient(135deg,#0f2a4a 0%,#1a4a7a 50%,#0ea5e9 100%)', border: 'rgba(14,165,233,0.3)',  iconBg: 'rgba(14,165,233,0.2)',  iconColor: '#7dd3fc', fn: () => openModal('post') },
              { icon: Calendar,          label: 'New Event',     sub: `${upcomingEvents.length} upcoming`, grad: 'linear-gradient(135deg,#0a2e28 0%,#0d4a3a 50%,#059669 100%)', border: 'rgba(16,185,129,0.3)',  iconBg: 'rgba(16,185,129,0.2)',  iconColor: '#6ee7b7', fn: () => openModal('event') },
              { icon: Dumbbell,          label: 'Classes',       sub: `${classes.length} total`,           grad: 'linear-gradient(135deg,#0a2038 0%,#0d3060 50%,#0ea5e9 100%)', border: 'rgba(14,165,233,0.3)',  iconBg: 'rgba(14,165,233,0.2)',  iconColor: '#67e8f9', fn: () => openModal('classes') },
              { icon: Trophy,            label: 'New Challenge', sub: `${activeChallenges.length} active`, grad: 'linear-gradient(135deg,#3a1010 0%,#5a1a1a 50%,#dc2626 100%)', border: 'rgba(239,68,68,0.3)',   iconBg: 'rgba(239,68,68,0.2)',   iconColor: '#fca5a5', fn: () => openModal('challenge') },
              { icon: BarChart2,         label: 'New Poll',      sub: `${polls.length} active`,           grad: 'linear-gradient(135deg,#1e0a3a 0%,#2d1060 50%,#7c3aed 100%)', border: 'rgba(139,92,246,0.3)', iconBg: 'rgba(139,92,246,0.2)', iconColor: '#c4b5fd', fn: () => openModal('poll') },
            ].map(({ icon: Icon, label, sub, grad, border, iconBg, iconColor, fn }, i) => (
              <div key={i} onClick={fn}
                style={{ borderRadius: 14, padding: '16px 14px', cursor: 'pointer', background: grad, border: `1px solid ${border}`, position: 'relative', overflow: 'hidden', transition: 'transform 0.18s, box-shadow 0.18s', minHeight: 96 }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ position: 'absolute', bottom: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: iconColor, opacity: 0.12, filter: 'blur(16px)' }}/>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon style={{ width: 15, height: 15, color: iconColor }}/>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2, letterSpacing: '-0.02em' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feed header + filter tabs */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', marginBottom: 12, gap: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', padding: '7px 16px 7px 2px', marginBottom: -1 }}>Feed</span>
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                style={{
                  padding: '7px 16px', fontSize: 12,
                  fontWeight: activeFilter === f.id ? 700 : 500,
                  color: activeFilter === f.id ? 'var(--text1)' : 'var(--text3)',
                  background: 'none', border: 'none',
                  borderBottom: activeFilter === f.id ? '2px solid #a78bfa' : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1, whiteSpace: 'nowrap',
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Two-column feed — scrolls vertically only */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
          {flatFeedItems.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start', paddingBottom: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col1.map((item, i) => renderItem(item, i))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col2.map((item, i) => renderItem(item, i))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50%', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquarePlus style={{ width: 20, height: 20, color: 'rgba(14,165,233,0.4)' }}/>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, margin: 0 }}>Nothing here yet</p>
              <button onClick={() => openModal('post')} style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
                Create first post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280 }}>

        {/* Engagement Score */}
        <Card style={{ padding: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Engagement Score</div>
            <Zap style={{ width: 14, height: 14, color: '#fbbf24' }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.04em', lineHeight: 1 }}>{engagementScore}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, paddingBottom: 4 }}>total interactions</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Likes',        val: allPosts.reduce((s, p) => s + (p.likes?.length || 0), 0),    color: '#f87171' },
              { label: 'Comments',     val: allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0), color: '#38bdf8' },
              { label: 'Poll votes',   val: polls.reduce((s, p) => s + (p.voters?.length || 0), 0),      color: '#a78bfa' },
              { label: 'In challenge', val: totalChalPart,                                                 color: '#fbbf24' },
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: s.color }}>
                {s.val} {s.label}
              </div>
            ))}
          </div>
        </Card>

        {/* Posting Cadence */}
        <Card style={{ padding: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Posting Cadence</div>
            <TrendingUp style={{ width: 14, height: 14, color: '#38bdf8' }}/>
          </div>
          <div style={{ display: 'flex', gap: 4, height: 40, alignItems: 'flex-end' }}>
            {cadenceData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: d.count === 0 ? 3 : Math.max(6, (d.count / cadenceMax) * 32), borderRadius: 3, background: d.count === 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(180deg,#38bdf8,#0ea5e9)', transition: 'height 0.4s ease' }}/>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {cadenceData.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: 'var(--text3)' }}>{d.label}</div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>
            {cadenceData.filter(d => d.count > 0).length} active days this week
          </div>
        </Card>

        {/* Content Mix */}
        {contentMix && (
          <Card style={{ padding: 16, flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', marginBottom: 10 }}>Content Mix</div>
            <div style={{ display: 'flex', height: 7, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 10 }}>
              {contentMix.filter(c => c.pct > 0).map((c, i) => (
                <div key={i} style={{ width: `${c.pct}%`, background: c.color, borderRadius: 99, transition: 'width 0.6s ease' }}/>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {contentMix.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0 }}/>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{c.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text1)' }}>{c.count}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', width: 28, textAlign: 'right' }}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Poll Participation Rate */}
        {pollParticipationRate !== null && (
          <Card style={{ padding: 16, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Poll Participation</div>
              <BarChart2 style={{ width: 14, height: 14, color: '#a78bfa' }}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: pollParticipationRate >= 50 ? '#34d399' : pollParticipationRate >= 25 ? '#fbbf24' : '#f87171', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {pollParticipationRate}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, paddingBottom: 3 }}>of members voting</span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pollParticipationRate}%`, borderRadius: 99, background: pollParticipationRate >= 50 ? 'linear-gradient(90deg,#10b981,#34d399)' : pollParticipationRate >= 25 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)', transition: 'width 0.8s ease' }}/>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6, fontWeight: 500 }}>
              {pollParticipationRate < 25 ? 'Low — try shorter, punchier polls' : pollParticipationRate < 50 ? 'Decent — pin polls to your feed' : 'Great engagement on polls!'}
            </p>
          </Card>
        )}

        {/* Unreached Members */}
        {unreachedMembers.length > 0 && (
          <Card style={{ padding: 16, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Not Reached</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '2px 6px' }}>{unreachedMembers.length}</div>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 10, fontWeight: 500, lineHeight: 1.4 }}>
              Members with no check-ins, poll votes, or challenge joins in 30 days.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {unreachedMembers.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={m.user_name || m.user_id || '?'} size={26} src={avatarMap[m.user_id] || null}/>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</span>
                  <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}>Reach</button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Posts */}
        <Card style={{ padding: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Recent Posts</div>
            <button onClick={() => openModal('post')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6, background: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.25)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              <Plus style={{ width: 10, height: 10 }}/>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {posts.length > 0 ? posts.slice(0, 3).map((post) => (
              <div key={post.id}
                style={{ padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'background 0.15s', fontSize: 11, fontWeight: 600, color: 'var(--text2)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                {post.content?.split('\n')[0] || post.title || 'Post'}
              </div>
            )) : (
              <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>No posts yet</div>
            )}
          </div>
        </Card>

        {/* Content Stats */}
        <Card style={{ padding: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12, letterSpacing: '-0.01em' }}>Content Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { count: upcomingEvents.length, label: 'Upcoming Events',        color: '#10b981' },
              { count: totalChalPart,          label: 'Challenge Participants', color: '#f59e0b' },
              { count: polls.length,           label: 'Active Polls',           color: '#8b5cf6' },
            ].map((s, i) => (
              <div key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <span style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: '-0.04em', minWidth: 28 }}>{s.count}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{s.label}</span>
                <ChevronRight style={{ width: 13, height: 13, color: 'var(--text3)' }}/>
              </div>
            ))}
          </div>
        </Card>

        {/* Milestones */}
        {milestones.length > 0 && (
          <Card style={{ padding: 16, flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12, letterSpacing: '-0.01em' }}>Upcoming Member Milestones</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {milestones.map((m, i) => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < milestones.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <Avatar name={m.name} size={34} src={avatarMap[m.user_id] || null}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{m.toNext === 1 ? '1 visit to go!' : `${m.toNext} visits to go`}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>{m.total} visits</div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>→ {m.next} visits</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
