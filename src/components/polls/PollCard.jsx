// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Add these two components to GymCommunity.jsx
//           Place them just BEFORE the `export default function GymCommunity()`
//           line (after the existing RippleButton component).
// ─────────────────────────────────────────────────────────────────────────────

// ── Active Now Strip ──────────────────────────────────────────────────────────
function ActiveNowStrip({ checkIns, memberAvatarMap }) {
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentCheckIns = checkIns
    .filter(c => new Date(c.check_in_date) >= fifteenMinsAgo)
    .reduce((acc, c) => {
      if (!acc.find(a => a.user_id === c.user_id)) acc.push(c);
      return acc;
    }, [])
    .slice(0, 10);

  if (recentCheckIns.length === 0) return null;

  const initials = (name = '') => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const AV_COLORS = [
    { bg: '#1a2a4a', color: '#93c5fd' },
    { bg: '#2a1a3a', color: '#c4b5fd' },
    { bg: '#1a2e20', color: '#86efac' },
    { bg: '#2e1a1a', color: '#fca5a5' },
    { bg: '#1a2535', color: '#7dd3fc' },
    { bg: '#2a2a1a', color: '#fde68a' },
    { bg: '#1e2a30', color: '#67e8f9' },
    { bg: '#2a1a28', color: '#f0abfc' },
  ];

  return (
    <div className="rounded-2xl p-4" style={CARD_STYLE}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px rgba(34,197,94,0.8)', flexShrink: 0 }} />
        <h3 className="text-[13px] font-black text-white">Active Now</h3>
        <span className="text-[11px] font-bold ml-auto" style={{ color: 'rgba(148,163,184,0.5)' }}>{recentCheckIns.length} members</span>
      </div>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {recentCheckIns.map((c, i) => {
          const col = AV_COLORS[i % AV_COLORS.length];
          const avatar = memberAvatarMap[c.user_id];
          return (
            <div key={c.user_id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{ position: 'relative', width: 42, height: 42, borderRadius: '50%', background: col.bg, border: '2px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: col.color, overflow: 'hidden', flexShrink: 0 }}>
                {avatar
                  ? <img src={avatar} alt={c.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(c.user_name)}
                <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid #0d1232' }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9.5, textAlign: 'center', maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(c.user_name || 'Member').split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Gym Activity Feed ─────────────────────────────────────────────────────────
function GymActivityFeed({ checkIns, lifts, memberAvatarMap }) {
  const [likedIds, setLikedIds] = React.useState(new Set());

  const toggleLike = (id) => setLikedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const initials = (name = '') => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const AV_COLORS = [
    { bg: '#1a2a4a', color: '#93c5fd' },
    { bg: '#2a1a3a', color: '#c4b5fd' },
    { bg: '#1a2e20', color: '#86efac' },
    { bg: '#2e1a1a', color: '#fca5a5' },
    { bg: '#1a2535', color: '#7dd3fc' },
    { bg: '#422006', color: '#fb923c' },
    { bg: '#1e2a30', color: '#67e8f9' },
    { bg: '#2a1a28', color: '#f0abfc' },
  ];

  const colorForUser = (userId) =>
    AV_COLORS[(userId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];

  // Build unified feed from checkIns + lifts, newest first
  const feedItems = React.useMemo(() => {
    const items = [];
    checkIns.slice(0, 20).forEach(c =>
      items.push({ type: 'checkin', id: `ci-${c.id}`, userId: c.user_id, userName: c.user_name, date: c.check_in_date, data: c })
    );
    lifts.slice(0, 10).forEach(l =>
      items.push({ type: 'lift', id: `lf-${l.id}`, userId: l.member_id, userName: l.member_name, date: l.lift_date, data: l })
    );
    return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
  }, [checkIns, lifts]);

  if (feedItems.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Activity style={{ width: 13, height: 13, color: '#818cf8' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>Gym Activity Feed</span>
      </div>

      {/* Feed items */}
      <div>
        {feedItems.map((item, index) => {
          const avatar = memberAvatarMap[item.userId];
          const col = colorForUser(item.userId);
          const liked = likedIds.has(item.id);
          const fakeLikes = ((item.userId || '').charCodeAt(0) % 18) + 2;

          let icon, headline, sub;

          if (item.type === 'checkin') {
            icon = (
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin style={{ width: 14, height: 14, color: '#60a5fa' }} />
              </div>
            );
            headline = <><span style={{ color: '#fff', fontWeight: 700 }}>{item.userName}</span>{' checked in'}</>;
            sub = item.data.notes || 'At the gym';
          } else {
            const isNewPR = item.data.is_personal_record || item.data.is_pr;
            icon = (
              <div style={{ width: 32, height: 32, borderRadius: 9, background: isNewPR ? 'rgba(234,179,8,0.12)' : 'rgba(168,85,247,0.12)', border: `1px solid ${isNewPR ? 'rgba(234,179,8,0.22)' : 'rgba(168,85,247,0.22)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isNewPR
                  ? <Trophy style={{ width: 14, height: 14, color: '#eab308' }} />
                  : <Dumbbell style={{ width: 14, height: 14, color: '#a78bfa' }} />}
              </div>
            );
            headline = isNewPR
              ? <><span style={{ color: '#fff', fontWeight: 700 }}>{item.userName}</span>{' hit a new PR 🔥'}</>
              : <><span style={{ color: '#fff', fontWeight: 700 }}>{item.userName}</span>{' logged a lift'}</>;
            sub = `${item.data.exercise || 'Exercise'}: ${item.data.weight_lbs || item.data.weight || '—'} lbs`;
          }

          return (
            <div
              key={item.id}
              style={{ padding: '11px 13px', borderBottom: index < feedItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: 'transparent', transition: 'background 0.15s' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Avatar */}
                <div style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', background: col.bg, border: '1.5px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: col.color, overflow: 'hidden', flexShrink: 0 }}>
                  {avatar
                    ? <img src={avatar} alt={item.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials(item.userName)}
                </div>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'rgba(226,232,240,0.8)', lineHeight: 1.4 }}>{headline}</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>{sub}</div>
                </div>
                {/* Icon + time */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  {icon}
                  <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.35)', fontWeight: 500 }}>{timeAgo(item.date)}</span>
                </div>
              </div>
              {/* Like / comment row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 9, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button
                  onClick={() => toggleLike(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, color: liked ? '#f472b6' : 'rgba(148,163,184,0.4)', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
                >
                  <Heart style={{ width: 13, height: 13, fill: liked ? '#f472b6' : 'none', transition: 'fill 0.15s' }} />
                  {fakeLikes + (liked ? 1 : 0)}
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(148,163,184,0.4)', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <MessageCircle style={{ width: 13, height: 13 }} />
                  {Math.floor(fakeLikes / 4)}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Inside the Activity TabsContent, add these two lines
//           RIGHT BEFORE the existing {/* Busy times */} comment:
//
//   {/* Active Now */}
//   <ActiveNowStrip checkIns={checkIns} memberAvatarMap={memberAvatarMap} />
//   {/* Activity Feed */}
//   <GymActivityFeed checkIns={checkIns} lifts={lifts} memberAvatarMap={memberAvatarMap} />
//
// The Activity TabsContent block should look like this after the edit:
// ─────────────────────────────────────────────────────────────────────────────

/*
  <TabsContent value="activity" className="space-y-3 mt-0 w-full" asChild>
    <motion.div ...>

      ← ADD HERE →
      {/* Active Now */}
      <ActiveNowStrip checkIns={checkIns} memberAvatarMap={memberAvatarMap} />
      {/* Activity Feed */}
      <GymActivityFeed checkIns={checkIns} lifts={lifts} memberAvatarMap={memberAvatarMap} />

      {/* Busy times */}           ← existing content starts here
      <BusyTimesChart ... />
      ...
    </motion.div>
  </TabsContent>
*/
