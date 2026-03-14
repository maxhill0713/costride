import React, { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Plus, Trophy, BarChart2, MessageSquarePlus, Calendar, ChevronRight, TrendingUp, Zap, Heart, MessageCircle, Bookmark, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import { Card, Empty, Avatar } from './DashboardPrimitives';

// ── Compact post card ─────────────────────────────────────────────────────────
function CompactPost({ post, index }) {
  const [expanded, setExpanded] = useState(false);
  const likes    = post.likes?.length || 0;
  const comments = post.comments?.length || 0;
  const hasImage = post.image_url || post.media_url;
  const preview  = post.content?.split('\n')[0] || post.title || 'Post';
  const isLong   = preview.length > 80;

  return (
    <div
      style={{
        borderRadius: 12,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Image strip */}
      {hasImage && (
        <div style={{ height: 120, overflow: 'hidden', position: 'relative' }}>
          <img
            src={post.image_url || post.media_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => e.currentTarget.parentElement.style.display = 'none'}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 60%)' }}/>
        </div>
      )}

      <div style={{ padding: '12px 14px' }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Avatar name={post.author_name || post.gym_name || '?'} size={24}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', flex: 1 }}>
            {post.author_name || post.gym_name || 'Gym Post'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>
            {post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}
          </span>
        </div>

        {/* Content */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text1)',
            lineHeight: 1.55,
            margin: 0,
            marginBottom: 10,
            display: expanded ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
            overflow: expanded ? 'visible' : 'hidden',
          }}
        >
          {post.content || post.title || ''}
        </p>

        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10 }}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: likes > 0 ? '#f87171' : 'var(--text3)' }}>
            <Heart style={{ width: 11, height: 11 }}/> {likes}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: comments > 0 ? '#38bdf8' : 'var(--text3)' }}>
            <MessageCircle style={{ width: 11, height: 11 }}/> {comments}
          </div>
          {post.post_type && (
            <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: 'rgba(255,255,255,0.05)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {post.post_type}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TabContent({
  events, challenges, polls, posts, userPosts = [], checkIns, ci30, avatarMap,
  openModal, now, leaderboardView, setLeaderboardView, allMemberships = [],
}) {
  const allPosts = [...(userPosts || []), ...(posts || [])].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const upcomingEvents   = events.filter(e => new Date(e.event_date) >= now);
  const activeChallenges = challenges.filter(c => c.status === 'active');
  const totalChalPart    = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);

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

  const topPost = useMemo(() => {
    if (!allPosts.length) return null;
    return [...allPosts].sort((a, b) =>
      ((b.likes?.length || 0) + (b.comments?.length || 0)) -
      ((a.likes?.length || 0) + (a.comments?.length || 0))
    )[0];
  }, [allPosts]);

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { icon: MessageSquarePlus, label: 'New Post',      sub: 'Share with members',                grad: 'linear-gradient(135deg,#0f2a4a 0%,#1a4a7a 50%,#0ea5e9 100%)', border: 'rgba(14,165,233,0.3)',  iconBg: 'rgba(14,165,233,0.2)',  iconColor: '#7dd3fc', fn: () => openModal('post') },
              { icon: Calendar,          label: 'New Event',     sub: `${upcomingEvents.length} upcoming`, grad: 'linear-gradient(135deg,#0a2e28 0%,#0d4a3a 50%,#059669 100%)', border: 'rgba(16,185,129,0.3)',  iconBg: 'rgba(16,185,129,0.2)',  iconColor: '#6ee7b7', fn: () => openModal('event') },
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

        {/* Feed header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)' }}>Feed</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '1px 7px' }}>{allPosts.length}</span>
          </div>
          <button
            onClick={() => openModal('post')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.25)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            <Plus style={{ width: 11, height: 11 }}/> New Post
          </button>
        </div>

        {/* Posts feed — only this scrolls */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: 2 }}>
          {allPosts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 24 }}>
              {allPosts.map((post, i) => (
                <CompactPost key={post.id || i} post={post} index={i}/>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquarePlus style={{ width: 20, height: 20, color: 'rgba(14,165,233,0.4)' }}/>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, margin: 0 }}>No posts yet</p>
              <button onClick={() => openModal('post')} style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
                Create first post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 260, paddingBottom: 24 }}>

        {/* Engagement Score */}
        <Card style={{ padding: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Engagement Score</div>
            <Zap style={{ width: 13, height: 13, color: '#fbbf24' }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.04em', lineHeight: 1 }}>{engagementScore}</span>
            <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, paddingBottom: 3 }}>interactions</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { label: 'Likes',     val: allPosts.reduce((s, p) => s + (p.likes?.length || 0), 0),    color: '#f87171' },
              { label: 'Comments',  val: allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0), color: '#38bdf8' },
              { label: 'Votes',     val: polls.reduce((s, p) => s + (p.voters?.length || 0), 0),      color: '#a78bfa' },
              { label: 'Challenge', val: totalChalPart,                                                color: '#fbbf24' },
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: s.color }}>
                {s.val} {s.label}
              </div>
            ))}
          </div>
        </Card>

        {/* Posting Cadence */}
        <Card style={{ padding: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Posting Cadence</div>
            <TrendingUp style={{ width: 13, height: 13, color: '#38bdf8' }}/>
          </div>
          <div style={{ display: 'flex', gap: 3, height: 36, alignItems: 'flex-end' }}>
            {cadenceData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', height: d.count === 0 ? 3 : Math.max(5, (d.count / cadenceMax) * 28), borderRadius: 3, background: d.count === 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(180deg,#38bdf8,#0ea5e9)', transition: 'height 0.4s ease' }}/>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
            {cadenceData.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: 'var(--text3)' }}>{d.label}</div>
            ))}
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>
            {cadenceData.filter(d => d.count > 0).length} active days this week
          </div>
        </Card>

        {/* Content Mix */}
        {contentMix && (
          <Card style={{ padding: 14, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', marginBottom: 10 }}>Content Mix</div>
            <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 8 }}>
              {contentMix.filter(c => c.pct > 0).map((c, i) => (
                <div key={i} style={{ width: `${c.pct}%`, background: c.color, transition: 'width 0.6s ease' }}/>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {contentMix.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0 }}/>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{c.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text1)' }}>{c.count}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', width: 26, textAlign: 'right' }}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Top Post */}
        {topPost && (
          <Card style={{ padding: 14, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Top Post</div>
              <Heart style={{ width: 12, height: 12, color: '#f87171' }}/>
            </div>
            <div style={{ padding: 9, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 7 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {topPost.content?.split('\n')[0] || topPost.title || 'Post'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#f87171' }}>
                <Heart style={{ width: 10, height: 10 }}/> {topPost.likes?.length || 0}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#38bdf8' }}>
                <MessageCircle style={{ width: 10, height: 10 }}/> {topPost.comments?.length || 0}
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3)' }}>
                {topPost.created_date ? format(new Date(topPost.created_date), 'MMM d') : ''}
              </div>
            </div>
          </Card>
        )}

        {/* Poll Participation */}
        {pollParticipationRate !== null && (
          <Card style={{ padding: 14, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Poll Participation</div>
              <BarChart2 style={{ width: 13, height: 13, color: '#a78bfa' }}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginBottom: 7 }}>
              <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: pollParticipationRate >= 50 ? '#34d399' : pollParticipationRate >= 25 ? '#fbbf24' : '#f87171' }}>
                {pollParticipationRate}%
              </span>
              <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, paddingBottom: 2 }}>of members voting</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pollParticipationRate}%`, borderRadius: 99, background: pollParticipationRate >= 50 ? 'linear-gradient(90deg,#10b981,#34d399)' : pollParticipationRate >= 25 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)', transition: 'width 0.8s ease' }}/>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 5, fontWeight: 500 }}>
              {pollParticipationRate < 25 ? 'Low — try shorter, punchier polls' : pollParticipationRate < 50 ? 'Decent — pin polls to your feed' : 'Great engagement on polls!'}
            </p>
          </Card>
        )}

        {/* Unreached Members */}
        {unreachedMembers.length > 0 && (
          <Card style={{ padding: 14, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Not Reached</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, padding: '1px 5px' }}>{unreachedMembers.length}</div>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 8, fontWeight: 500, lineHeight: 1.4 }}>
              No check-ins, votes or challenge joins in 30 days.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {unreachedMembers.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Avatar name={m.user_name || '?'} size={24} src={avatarMap[m.user_id] || null}/>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</span>
                  <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>
                    Reach
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Posts */}
        <Card style={{ padding: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Recent Posts</div>
            <button onClick={() => openModal('post')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 6, background: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.25)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              <Plus style={{ width: 9, height: 9 }}/>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {posts.length > 0 ? posts.slice(0, 3).map((post) => (
              <div key={post.id}
                style={{ padding: '7px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'background 0.15s', fontSize: 11, fontWeight: 600, color: 'var(--text2)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                {post.content?.split('\n')[0] || post.title || 'Post'}
              </div>
            )) : (
              <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '10px 0' }}>No posts yet</div>
            )}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card style={{ padding: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Upcoming Events</div>
            <button onClick={() => openModal('event')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              <Plus style={{ width: 9, height: 9 }}/>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {upcomingEvents.length > 0 ? upcomingEvents.slice(0, 3).map((ev) => {
              const evDate   = new Date(ev.event_date);
              const diffDays = Math.floor((evDate - now) / 86400000);
              return (
                <div key={ev.id}
                  style={{ padding: '7px 8px', borderRadius: 7, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.04)'}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>{format(evDate, 'MMM d, h:mm a')}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: diffDays <= 2 ? '#f87171' : '#34d399', background: diffDays <= 2 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', borderRadius: 4, padding: '1px 5px' }}>
                      {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${diffDays}d`}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '10px 0' }}>No events</div>
            )}
          </div>
        </Card>

        {/* Content Stats */}
        <Card style={{ padding: 14, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', marginBottom: 10, letterSpacing: '-0.01em' }}>Content Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { count: upcomingEvents.length, label: 'Upcoming Events',        color: '#10b981' },
              { count: totalChalPart,          label: 'Challenge Participants', color: '#f59e0b' },
              { count: polls.length,           label: 'Active Polls',           color: '#8b5cf6' },
            ].map((s, i) => (
              <div key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <span style={{ fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: '-0.04em', minWidth: 24 }}>{s.count}</span>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{s.label}</span>
                <ChevronRight style={{ width: 12, height: 12, color: 'var(--text3)' }}/>
              </div>
            ))}
          </div>
        </Card>

        {/* Active Challenges */}
        <Card style={{ padding: 0, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 8px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Challenges</div>
            <button onClick={() => openModal('challenge')} style={{ padding: '3px 9px', borderRadius: 6, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              + Active
            </button>
          </div>
          {activeChallenges.length > 0 ? activeChallenges.slice(0, 1).map(ch => {
            const start     = new Date(ch.start_date), end = new Date(ch.end_date);
            const totalDays = Math.max(1, Math.floor((end - start) / 86400000));
            const elapsed   = Math.max(0, Math.floor((now - start) / 86400000));
            const remaining = Math.max(0, totalDays - elapsed);
            const pct       = Math.min(100, Math.round((elapsed / totalDays) * 100));
            return (
              <div key={ch.id}>
                <div style={{ margin: '0 10px', borderRadius: 10, overflow: 'hidden', height: 80, background: 'linear-gradient(135deg,#1a1033,#3b1a5e,#6d28d9)', position: 'relative', marginBottom: 8 }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trophy style={{ width: 26, height: 26, color: 'rgba(245,158,11,0.5)' }}/>
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', background: 'linear-gradient(0deg,rgba(0,0,0,0.7),transparent)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{ch.title}</div>
                  </div>
                </div>
                <div style={{ padding: '0 14px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>👥 {ch.participants?.length || 0}</span>
                    <span style={{ fontSize: 10, color: remaining <= 3 ? '#f87171' : 'var(--text3)' }}>{remaining}d left</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg,#7c3aed,#f59e0b)', transition: 'width 0.8s ease' }}/>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div style={{ padding: '0 14px 12px' }}>
              <Empty icon={Trophy} label="No active challenges"/>
              <button onClick={() => openModal('challenge')} style={{ width: '100%', marginTop: 6, padding: '8px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Create Challenge</button>
            </div>
          )}
        </Card>

        {/* Active Polls */}
        <Card style={{ padding: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Active Polls</div>
            <button onClick={() => openModal('poll')} style={{ padding: '3px 9px', borderRadius: 6, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>+ New</button>
          </div>
          {polls.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {polls.slice(0, 4).map((poll) => {
                const votes    = poll.voters?.length || 0;
                const maxVotes = Math.max(...polls.map(p => p.voters?.length || 0), 1);
                return (
                  <div key={poll.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{poll.title}</span>
                    <div style={{ width: 50, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ height: '100%', width: `${(votes / maxVotes) * 100}%`, borderRadius: 99, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', transition: 'width 0.6s ease' }}/>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text1)', width: 14, textAlign: 'right', flexShrink: 0 }}>{votes}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty icon={BarChart2} label="No active polls"/>
          )}
        </Card>

        {/* Milestones */}
        {milestones.length > 0 && (
          <Card style={{ padding: 14, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', marginBottom: 10, letterSpacing: '-0.01em' }}>Member Milestones</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {milestones.map((m, i) => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < milestones.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <Avatar name={m.name} size={28} src={avatarMap[m.user_id] || null}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{m.toNext === 1 ? '1 visit to go!' : `${m.toNext} visits to go`}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b' }}>{m.total}</div>
                    <div style={{ fontSize: 9, color: 'var(--text3)' }}>→ {m.next}</div>
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