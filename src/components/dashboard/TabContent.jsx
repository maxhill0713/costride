import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Image as ImageIcon, Trophy, BarChart2, MessageSquarePlus, Calendar, MessageCircle, ChevronRight } from 'lucide-react';
import { Card, SectionTitle, Empty, Avatar } from './DashboardPrimitives';
import PostCard from '../feed/PostCard';

export default function TabContent({
  events, challenges, polls, posts, checkIns, ci30, avatarMap,
  openModal, now, leaderboardView, setLeaderboardView,
}) {
  const upcomingEvents   = events.filter(e => new Date(e.event_date) >= now);
  const activeChallenges = challenges.filter(c => c.status === 'active');
  const totalChalPart    = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);

  const milestones = useMemo(() => {
    const acc = {}, userIdByName = {};
    checkIns.forEach(c => { if (!acc[c.user_name]) acc[c.user_name] = 0; acc[c.user_name]++; if (c.user_id) userIdByName[c.user_name] = c.user_id; });
    return Object.entries(acc)
      .map(([name, total]) => {
        const next = [10,25,50,100,200,500].find(n => n > total) || null;
        const recent = ci30.filter(c => c.user_name === name).length;
        return { name, total, next, toNext: next ? next - total : 0, recent, user_id: userIdByName[name] };
      })
      .filter(m => m.next && m.toNext <= 5)
      .sort((a, b) => a.toNext - b.toNext)
      .slice(0, 4);
  }, [checkIns, ci30]);

  const postGradients = [
    'linear-gradient(135deg,#1e3a5f,#0ea5e9)',
    'linear-gradient(135deg,#1a3a2e,#10b981)',
    'linear-gradient(135deg,#3a1e2e,#ec4899)',
    'linear-gradient(135deg,#2e1a3a,#8b5cf6)',
    'linear-gradient(135deg,#3a2e1a,#f59e0b)',
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>

      {/* ── LEFT: FEED ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Hero action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { icon: MessageSquarePlus, label: 'New Post',       sub: 'Share with members',           grad: 'linear-gradient(135deg,#0f2a4a 0%,#1a4a7a 50%,#0ea5e9 100%)', border: 'rgba(14,165,233,0.3)', iconBg: 'rgba(14,165,233,0.2)', iconColor: '#7dd3fc', fn: () => openModal('post') },
            { icon: Calendar,          label: 'New Event',      sub: `${upcomingEvents.length} upcoming`, grad: 'linear-gradient(135deg,#0a2e28 0%,#0d4a3a 50%,#059669 100%)', border: 'rgba(16,185,129,0.3)', iconBg: 'rgba(16,185,129,0.2)', iconColor: '#6ee7b7', fn: () => openModal('event') },
            { icon: Trophy,            label: 'New Challenge',  sub: `${activeChallenges.length} active`,  grad: 'linear-gradient(135deg,#3a1010 0%,#5a1a1a 50%,#dc2626 100%)', border: 'rgba(239,68,68,0.3)',  iconBg: 'rgba(239,68,68,0.2)',  iconColor: '#fca5a5', fn: () => openModal('challenge') },
            { icon: BarChart2,         label: 'New Poll',       sub: `${polls.length} active`,       grad: 'linear-gradient(135deg,#1e0a3a 0%,#2d1060 50%,#7c3aed 100%)', border: 'rgba(139,92,246,0.3)', iconBg: 'rgba(139,92,246,0.2)', iconColor: '#c4b5fd', fn: () => openModal('poll') },
          ].map(({ icon: Icon, label, sub, grad, border, iconBg, iconColor, fn }, i) => (
            <div key={i} onClick={fn}
              style={{ borderRadius: 16, padding: '20px 18px 18px', cursor: 'pointer', background: grad, border: `1px solid ${border}`, position: 'relative', overflow: 'hidden', transition: 'transform 0.18s, box-shadow 0.18s', minHeight: 110 }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 36px rgba(0,0,0,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: iconColor, opacity: 0.12, filter: 'blur(20px)' }}/>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon style={{ width: 17, height: 17, color: iconColor }}/>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4, letterSpacing: '-0.02em' }}>{label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Posts Feed */}
        <div style={{ maxWidth: '50%' }}>
          {posts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} fullWidth={true} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => {}}/>
              ))}
            </div>
          ) : (
            <Card style={{ padding: 20, textAlign: 'center' }}>
              <Empty icon={MessageSquarePlus} label="No posts yet"/>
            </Card>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 22 }}>
        {/* Recent Posts */}
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Recent Posts</div>
            <button onClick={() => openModal('post')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6, background: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.25)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              <Plus style={{ width: 10, height: 10 }}/>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '220px', overflowY: 'auto' }}>
            {posts.length > 0 ? posts.slice(0, 3).map((post) => (
              <div key={post.id} style={{ padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'background 0.15s', fontSize: 11, fontWeight: 600, color: 'var(--text2)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                {post.content?.split('\n')[0] || post.title || 'Post'}
              </div>
            )) : (
              <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>No posts yet</div>
            )}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Upcoming Events</div>
            <button onClick={() => openModal('event')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              <Plus style={{ width: 10, height: 10 }}/>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '220px', overflowY: 'auto' }}>
            {upcomingEvents.length > 0 ? upcomingEvents.slice(0, 3).map((ev) => {
              const evDate = new Date(ev.event_date);
              const diffDays = Math.floor((evDate - now) / 86400000);
              return (
                <div key={ev.id} style={{ padding: '8px', borderRadius: 8, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)', cursor: 'pointer', transition: 'background 0.15s', fontSize: 11, fontWeight: 600, color: 'var(--text2)', lineHeight: 1.4 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(16,185,129,0.04)'}>
                  <div style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{format(evDate, 'MMM d, h:mm a')}</div>
                </div>
              );
            }) : (
              <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>No events</div>
            )}
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12, letterSpacing: '-0.01em' }}>Content Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { count: upcomingEvents.length, label: 'Upcoming Events',        color: '#10b981' },
              { count: totalChalPart,          label: 'Challenge Participants', color: '#f59e0b' },
              { count: polls.length,           label: 'Active Polls',           color: '#8b5cf6' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity='0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                <span style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: '-0.04em', minWidth: 28 }}>{s.count}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{s.label}</span>
                <ChevronRight style={{ width: 13, height: 13, color: 'var(--text3)' }}/>
              </div>
            ))}
          </div>
        </Card>

        {/* Active Challenges */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Challenges</div>
            <button onClick={() => openModal('challenge')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              + Active
            </button>
          </div>
          {activeChallenges.length > 0 ? (
            activeChallenges.slice(0, 1).map(ch => {
              const start = new Date(ch.start_date), end = new Date(ch.end_date);
              const totalDays = Math.max(1, Math.floor((end - start) / 86400000));
              const elapsed  = Math.max(0, Math.floor((now - start) / 86400000));
              const remaining = Math.max(0, totalDays - elapsed);
              const pct = Math.min(100, Math.round((elapsed / totalDays) * 100));
              return (
                <div key={ch.id}>
                  <div style={{ margin: '0 12px', borderRadius: 12, overflow: 'hidden', height: 100, background: 'linear-gradient(135deg,#1a1033,#3b1a5e,#6d28d9)', position: 'relative', marginBottom: 10 }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trophy style={{ width: 32, height: 32, color: 'rgba(245,158,11,0.6)' }}/>
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px', background: 'linear-gradient(0deg,rgba(0,0,0,0.7),transparent)' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{ch.title}</div>
                    </div>
                  </div>
                  <div style={{ padding: '0 16px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>👥 {ch.participants?.length || 0} participants</span>
                      <span style={{ fontSize: 11, color: remaining <= 3 ? '#f87171' : 'var(--text3)' }}>{remaining} days remaining</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg,#7c3aed,#f59e0b)', transition: 'width 0.8s ease' }}/>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '0 16px 16px' }}>
              <Empty icon={Trophy} label="No active challenges"/>
              <button onClick={() => openModal('challenge')} style={{ width: '100%', marginTop: 8, padding: '9px', borderRadius: 9, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Create Challenge</button>
            </div>
          )}
        </Card>

        {/* Active Polls */}
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Active Polls</div>
            <button onClick={() => openModal('poll')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>+ New</button>
          </div>
          {polls.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {polls.slice(0, 4).map((poll) => {
                const votes = poll.voters?.length || 0;
                const maxVotes = Math.max(...polls.map(p => p.voters?.length || 0), 1);
                return (
                  <div key={poll.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{poll.title}</span>
                    <div style={{ width: 60, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ height: '100%', width: `${(votes / maxVotes) * 100}%`, borderRadius: 99, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', transition: 'width 0.6s ease' }}/>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text1)', width: 16, textAlign: 'right', flexShrink: 0 }}>{votes}</span>
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
          <Card style={{ padding: 16 }}>
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