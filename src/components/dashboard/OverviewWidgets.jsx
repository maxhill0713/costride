import React from 'react';

// ─── Gym Culture Radar ────────────────────────────────────────────────────────
export const CultureRadar = ({ checkIns = [], allMemberships = [], challenges = [], posts = [], polls = [], now = new Date() }) => {
  const scores = React.useMemo(() => {
    const total  = allMemberships.length || 1;
    const ci30   = checkIns.filter(c => now - new Date(c.check_in_date) < 30 * 86400000);
    const active = new Set(ci30.map(c => c.user_id));
    const consistency  = Math.min(100, Math.round((active.size / total) * 100));
    const community    = Math.min(100, Math.round((posts.length / Math.max(total,1)) * 300));
    const chalPart     = challenges.reduce((s,c) => s + (c.participants?.length||0), 0);
    const motivation   = Math.min(100, Math.round((chalPart / Math.max(total,1)) * 150));
    const voteCount    = polls.reduce((s,p) => s + (p.voters?.length||0), 0);
    const social       = Math.min(100, Math.round((voteCount / Math.max(total,1)) * 200 + polls.length * 8));
    const ci7          = checkIns.filter(c => now - new Date(c.check_in_date) < 7 * 86400000).length;
    const ci7prev      = checkIns.filter(c => { const age = now - new Date(c.check_in_date); return age >= 7*86400000 && age < 14*86400000; }).length;
    const energy       = Math.min(100, Math.max(20, ci7prev > 0 ? Math.round((ci7/ci7prev)*60) : ci7>0?70:30));
    return { consistency, community, motivation, social, energy };
  }, [checkIns, allMemberships, challenges, posts, polls, now]);

  const dims = [
    { key:'consistency', label:'Consistency', color:'#0ea5e9' },
    { key:'community',   label:'Community',   color:'#10b981' },
    { key:'motivation',  label:'Motivation',  color:'#f59e0b' },
    { key:'social',      label:'Social',      color:'#a78bfa' },
    { key:'energy',      label:'Energy',      color:'#f87171' },
  ];
  const cx=88, cy=88, maxR=68, n=dims.length;
  const toXY  = (i,pct) => { const a=(i/n)*Math.PI*2-Math.PI/2, r=(pct/100)*maxR; return {x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)}; };
  const lblXY = (i)     => { const a=(i/n)*Math.PI*2-Math.PI/2, r=maxR+19;        return {x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)}; };
  const webPts = dims.map((d,i) => toXY(i, scores[d.key]));
  const webPath = webPts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
  const overall = Math.round(Object.values(scores).reduce((a,b)=>a+b,0) / dims.length);

  return (
    <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:18 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
        <div>
          <div style={{ fontSize:13,fontWeight:800,color:'var(--text1)',letterSpacing:'-0.01em' }}>Gym Culture Radar</div>
          <div style={{ fontSize:10,color:'var(--text3)',marginTop:1 }}>Community health · 5 dimensions</div>
        </div>
        <div style={{ fontSize:18,fontWeight:900,color:overall>=70?'#10b981':overall>=45?'#f59e0b':'#f87171',letterSpacing:'-0.03em' }}>
          {overall}<span style={{ fontSize:10,fontWeight:600,color:'var(--text3)',marginLeft:2 }}>/100</span>
        </div>
      </div>
      <div style={{ display:'flex',justifyContent:'center' }}>
        <svg width={176} height={176} style={{ overflow:'visible' }}>
          {[25,50,75,100].map(ring =>
            dims.map((_,i) => toXY(i,ring)).map((pt,i,pts) => i<pts.length-1 ? (
              <line key={`r${ring}-${i}`} x1={pt.x} y1={pt.y} x2={pts[(i+1)%pts.length].x} y2={pts[(i+1)%pts.length].y} stroke="rgba(255,255,255,0.06)" strokeWidth={0.8}/>
            ) : null)
          )}
          {dims.map((_,i) => { const end=toXY(i,100); return <line key={`ax${i}`} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.08)" strokeWidth={0.8}/>; })}
          <path d={webPath} fill="rgba(14,165,233,0.1)" stroke="rgba(14,165,233,0.55)" strokeWidth={1.5}/>
          {webPts.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={dims[i].color}/>)}
          {dims.map((d,i) => { const {x,y}=lblXY(i); return <text key={d.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={d.color} fontSize={9} fontWeight={700} style={{fontFamily:'Outfit,sans-serif'}}>{d.label}</text>; })}
        </svg>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:6,marginTop:4 }}>
        {dims.map(d => (
          <div key={d.key}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
              <span style={{ fontSize:10,fontWeight:600,color:'var(--text2)' }}>{d.label}</span>
              <span style={{ fontSize:10,fontWeight:800,color:d.color }}>{scores[d.key]}</span>
            </div>
            <div style={{ height:3,borderRadius:99,background:'rgba(255,255,255,0.06)' }}>
              <div style={{ height:'100%',width:`${scores[d.key]}%`,borderRadius:99,background:d.color,opacity:0.8,transition:'width 1s cubic-bezier(0.22,1,0.36,1)' }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Streak Celebrations ──────────────────────────────────────────────────────
export const StreakCelebrations = ({ checkIns = [], openModal, now = new Date() }) => {
  const milestones = React.useMemo(() => {
    const acc = {}, userIdMap = {};
    checkIns.forEach(c => {
      if (!acc[c.user_name]) acc[c.user_name] = new Set();
      acc[c.user_name].add(new Date(c.check_in_date).toISOString().split('T')[0]);
      if (c.user_id) userIdMap[c.user_name] = c.user_id;
    });
    const MILESTONES = [5,10,15,20,30,50,100];
    const results = [];
    Object.entries(acc).forEach(([name,days]) => {
      const count = days.size;
      MILESTONES.forEach(m => { if (count >= m && count < m + 3) results.push({ name, count, milestone: m, user_id: userIdMap[name] }); });
    });
    return results.slice(0, 4);
  }, [checkIns]);

  const icons = { 5:'🔥',10:'💪',15:'⚡',20:'🏆',30:'👑',50:'🌟',100:'🎯' };
  if (milestones.length === 0) return null;

  return (
    <div style={{ background:'var(--card)',border:'1px solid rgba(245,158,11,0.15)',borderRadius:16,padding:18 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
        <div>
          <div style={{ fontSize:13,fontWeight:800,color:'var(--text1)',letterSpacing:'-0.01em' }}>🎉 Milestone Moments</div>
          <div style={{ fontSize:10,color:'var(--text3)',marginTop:1 }}>Members worth celebrating</div>
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {milestones.map((m,i) => (
          <div key={i} style={{ padding:'10px 12px',borderRadius:10,background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.15)',display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:32,height:32,borderRadius:10,background:'rgba(245,158,11,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>
              {icons[m.milestone]||'🎯'}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:700,color:'var(--text1)' }}>
                {m.name.split(' ')[0]} hit a <span style={{ color:'#fbbf24' }}>{m.milestone}-day streak!</span>
              </div>
              <div style={{ fontSize:10,color:'var(--text3)',marginTop:1 }}>{m.count} total visits · Celebrate in the community</div>
            </div>
            <button onClick={() => openModal('post')} style={{ padding:'5px 10px',borderRadius:8,background:'rgba(245,158,11,0.15)',color:'#fbbf24',border:'1px solid rgba(245,158,11,0.3)',fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0,whiteSpace:'nowrap' }}>
              Post 🎉
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Gym Setup Checklist ──────────────────────────────────────────────────────
export const GymSetupChecklist = ({ selectedGym, classes = [], coaches = [], openModal }) => {
  const items = [
    { done:(selectedGym?.equipment?.length||0)>0,  icon:'🏋️', label:'Add your equipment',     sub:'Attracts members searching by kit',         action:'Add',    fn:()=>openModal('equipment') },
    { done:(selectedGym?.amenities?.length||0)>0,  icon:'⭐',  label:'List your amenities',    sub:'Showers, parking — boosts your listing',    action:'Add',    fn:()=>openModal('amenities') },
    { done:classes.length>0,                       icon:'📅',  label:'Create a class schedule', sub:'Members can book directly in-app',          action:'Add',    fn:()=>openModal('classes') },
    { done:coaches.length>0,                       icon:'👥',  label:'Add your coaches',        sub:'Builds trust with prospective members',      action:'Add',    fn:()=>openModal('coaches') },
    { done:(selectedGym?.gallery?.length||0)>=3,   icon:'📸',  label:'Upload 3+ gym photos',   sub:'3× more profile views with photos',         action:'Upload', fn:()=>openModal('photos') },
  ];
  const done      = items.filter(i => i.done).length;
  const pct       = Math.round((done / items.length) * 100);
  const remaining = items.filter(i => !i.done);
  if (remaining.length === 0) return null;

  return (
    <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:18 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
        <div>
          <div style={{ fontSize:13,fontWeight:800,color:'var(--text1)',letterSpacing:'-0.01em' }}>Gym Profile</div>
          <div style={{ fontSize:10,color:'var(--text3)',marginTop:1 }}>{done}/{items.length} complete · make your gym stand out</div>
        </div>
        <div style={{ fontSize:15,fontWeight:900,color:pct===100?'#10b981':pct>=60?'#f59e0b':'#f87171',letterSpacing:'-0.02em' }}>{pct}%</div>
      </div>
      <div style={{ height:4,borderRadius:99,background:'rgba(255,255,255,0.07)',marginBottom:14,overflow:'hidden' }}>
        <div style={{ height:'100%',width:`${pct}%`,borderRadius:99,background:'linear-gradient(90deg,#0ea5e9,#10b981)',transition:'width 1s cubic-bezier(0.22,1,0.36,1)' }}/>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        {remaining.slice(0,3).map((item,i) => (
          <div key={i} onClick={item.fn} style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:10,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',cursor:'pointer',transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}>
            <span style={{ fontSize:18,flexShrink:0 }}>{item.icon}</span>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:700,color:'var(--text1)' }}>{item.label}</div>
              <div style={{ fontSize:10,color:'var(--text3)',marginTop:1 }}>{item.sub}</div>
            </div>
            <button style={{ padding:'4px 10px',borderRadius:7,background:'rgba(14,165,233,0.12)',color:'#38bdf8',border:'1px solid rgba(14,165,233,0.25)',fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0 }}>
              {item.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Smart Action Nudges ──────────────────────────────────────────────────────
export const SmartNudges = ({ atRisk, challenges, polls, monthChangePct, openModal, setTab, checkIns, allMemberships, now }) => {
  const nudges = React.useMemo(() => {
    const list = [];
    if (atRisk > 0) list.push({ icon:'💬', title:`${atRisk} members haven't visited`, sub:'Send a personalised re-engagement message', color:'#f87171', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.2)', cta:'Message them', fn:()=>openModal('post') });
    if (!challenges.some(c=>c.status==='active')) list.push({ icon:'🏆', title:'Launch a community challenge', sub:'Active challenges boost check-ins by ~40%', color:'#fbbf24', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)', cta:'Create challenge', fn:()=>openModal('challenge') });
    if (polls.length === 0) list.push({ icon:'📊', title:'Ask your members a question', sub:'Polls drive engagement and show you care', color:'#a78bfa', bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.2)', cta:'Create poll', fn:()=>openModal('poll') });
    const classGoers = new Set(checkIns.filter(c=>now-new Date(c.check_in_date)<7*86400000).map(c=>c.user_id));
    const notThisWeek = allMemberships.filter(m=>!classGoers.has(m.user_id));
    if (notThisWeek.length > 0) list.push({ icon:'📅', title:`Invite ${Math.min(notThisWeek.length,12)} members to a class`, sub:"Haven't been in this week — a nudge helps", color:'#34d399', bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.2)', cta:'Post invite', fn:()=>openModal('post') });
    if (monthChangePct < -10) list.push({ icon:'⚠️', title:`Attendance down ${Math.abs(monthChangePct)}% this month`, sub:'A 7-day challenge can reverse the trend', color:'#f59e0b', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)', cta:'Fix it', fn:()=>openModal('challenge') });
    return list.slice(0, 4);
  }, [atRisk, challenges, polls, monthChangePct, checkIns, allMemberships, now]);

  if (nudges.length === 0) return null;

  return (
    <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:18 }}>
      <div style={{ fontSize:13,fontWeight:800,color:'var(--text1)',marginBottom:12,letterSpacing:'-0.01em' }}>Action Items</div>
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {nudges.map((n,i) => (
          <div key={i} onClick={n.fn} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,background:n.bg,border:`1px solid ${n.border}`,cursor:'pointer',transition:'filter 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.12)'}
            onMouseLeave={e=>e.currentTarget.style.filter=''}>
            <span style={{ fontSize:18,flexShrink:0 }}>{n.icon}</span>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:11,fontWeight:700,color:'var(--text1)',lineHeight:1.3 }}>{n.title}</div>
              <div style={{ fontSize:10,color:'var(--text3)',marginTop:2 }}>{n.sub}</div>
            </div>
            <span style={{ fontSize:10,fontWeight:700,color:n.color,whiteSpace:'nowrap',flexShrink:0 }}>{n.cta} →</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Community Health Score ───────────────────────────────────────────────────
export const CommunityHealthScore = ({ checkIns = [], challenges = [], posts = [], allMemberships = [], now = new Date() }) => {
  const scores = React.useMemo(() => {
    const total = allMemberships.length || 1;

    // Check-in frequency: active members (checked in last 30d) / total
    const ci30 = checkIns.filter(c => now - new Date(c.check_in_date) < 30 * 86400000);
    const activeMembers = new Set(ci30.map(c => c.user_id)).size;
    const checkInScore = Math.min(100, Math.round((activeMembers / total) * 100));

    // Challenge participation: participants across active challenges / total
    const activeChallenges = challenges.filter(c => c.status === 'active');
    const chalParticipants = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);
    const challengeScore = Math.min(100, Math.round((chalParticipants / Math.max(activeChallenges.length * total, 1)) * 100));

    // Post engagement: total reactions + comments across posts this month
    const recentPosts = posts.filter(p => now - new Date(p.created_date) < 30 * 86400000);
    const totalEngagements = recentPosts.reduce((s, p) => {
      return s + Object.keys(p.reactions || {}).length + (p.comments?.length || 0);
    }, 0);
    const postScore = Math.min(100, Math.round((totalEngagements / Math.max(total, 1)) * 80));

    // Streaks: members with streak ≥ 3 days
    const streakMembers = allMemberships.filter(m => (m.current_streak || 0) >= 3).length;
    // Approximate using check-in density — members with 3+ check-ins in last 7d
    const ci7ByUser = {};
    checkIns.filter(c => now - new Date(c.check_in_date) < 7 * 86400000).forEach(c => {
      ci7ByUser[c.user_id] = (ci7ByUser[c.user_id] || 0) + 1;
    });
    const streakCount = Object.values(ci7ByUser).filter(v => v >= 3).length;
    const streakScore = Math.min(100, Math.round((streakCount / total) * 100));

    const overall = Math.round((checkInScore + challengeScore + postScore + streakScore) / 4);
    return { checkInScore, challengeScore, postScore, streakScore, overall };
  }, [checkIns, challenges, posts, allMemberships, now]);

  const metrics = [
    { label: 'Check-in Frequency', value: scores.checkInScore, color: '#38bdf8', icon: '📅' },
    { label: 'Challenge Participation', value: scores.challengeScore, color: '#f59e0b', icon: '🏆' },
    { label: 'Post Engagement', value: scores.postScore, color: '#a78bfa', icon: '💬' },
    { label: 'Streaks', value: scores.streakScore, color: '#34d399', icon: '🔥' },
  ];

  const overallColor = scores.overall >= 70 ? '#10b981' : scores.overall >= 40 ? '#f59e0b' : '#f87171';
  const grade = scores.overall >= 85 ? 'Excellent' : scores.overall >= 70 ? 'Good' : scores.overall >= 50 ? 'Fair' : 'Needs Work';

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: `linear-gradient(90deg, transparent, ${overallColor}50, transparent)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Community Health</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>4 key engagement signals</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: overallColor, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {scores.overall}<span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginLeft: 2 }}>/100</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: overallColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{grade}</div>
        </div>
      </div>

      {/* Overall bar */}
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${scores.overall}%`, borderRadius: 99, background: `linear-gradient(90deg, ${overallColor}, ${overallColor}bb)`, transition: 'width 1s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>

      {/* Individual metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {metrics.map(m => (
          <div key={m.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>{m.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{m.label}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: m.color }}>{m.value}</span>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ height: '100%', width: `${m.value}%`, borderRadius: 99, background: m.color, opacity: 0.85, transition: 'width 1s cubic-bezier(0.22,1,0.36,1)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Invite to Classes card ───────────────────────────────────────────────────
export const InviteToClasses = ({ classes = [], openModal }) => (
  <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:20 }}>
    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
      <span style={{ fontSize:14,fontWeight:700,color:'var(--text1)' }}>Invite to Classes</span>
      <button onClick={() => openModal('classes')} style={{ fontSize:11,fontWeight:600,color:'var(--cyan)',background:'none',border:'none',cursor:'pointer' }}>Manage →</button>
    </div>
    <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
      {classes.length === 0
        ? <div style={{ padding:'20px',textAlign:'center',fontSize:12,color:'var(--text3)' }}>Add classes to invite members</div>
        : classes.slice(0,3).map((cls,i) => (
          <div key={cls.id||i} style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width:32,height:32,borderRadius:9,background:'rgba(14,165,233,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              📅
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:700,color:'var(--text1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{cls.name}</div>
              <div style={{ fontSize:10,color:'var(--text3)',marginTop:1 }}>{cls.schedule?.[0]?.day || 'See schedule'}</div>
            </div>
            <button onClick={() => openModal('post')} style={{ padding:'4px 9px',borderRadius:7,background:'rgba(14,165,233,0.12)',color:'#38bdf8',border:'1px solid rgba(14,165,233,0.25)',fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0 }}>
              Invite
            </button>
          </div>
        ))
      }
    </div>
  </div>
);