import React from 'react';

// ─── Habit Formation Tracker ──────────────────────────────────────────────────
export const HabitTracker = ({ checkIns = [], allMemberships = [], now = new Date() }) => {
  const memberHabits = React.useMemo(() => {
    return allMemberships.slice(0, 8).map((m) => {
      const name = m.user_name || 'Member';
      const weekCounts = Array.from({ length: 4 }, (_, wi) => {
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - (wi + 1) * 7);
        const weekEnd   = new Date(now); weekEnd.setDate(now.getDate() - wi * 7);
        return checkIns.filter(c => c.user_id === m.user_id && new Date(c.check_in_date) >= weekStart && new Date(c.check_in_date) < weekEnd).length;
      }).reverse();
      const avg   = weekCounts.reduce((a, b) => a + b, 0) / 4;
      const trend = weekCounts[3] - weekCounts[0];
      return { name, weekCounts, avg: Math.round(avg * 10) / 10, trend, user_id: m.user_id };
    }).sort((a, b) => b.avg - a.avg);
  }, [checkIns, allMemberships, now]);

  const getCell = (v) => {
    if (!v) return 'rgba(255,255,255,0.05)';
    if (v <= 1) return 'rgba(14,165,233,0.2)';
    if (v <= 2) return 'rgba(14,165,233,0.45)';
    if (v <= 3) return 'rgba(14,165,233,0.7)';
    return 'rgba(14,165,233,0.95)';
  };

  return (
    <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:18 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
        <div>
          <div style={{ fontSize:13,fontWeight:800,color:'var(--text1)',letterSpacing:'-0.01em' }}>Habit Formation</div>
          <div style={{ fontSize:10,color:'var(--text3)',marginTop:1 }}>Weekly check-in frequency per member</div>
        </div>
        <div style={{ display:'flex',gap:4,alignItems:'center' }}>
          {[0.2,0.55,0.9].map((o,i) => <div key={i} style={{ width:8,height:8,borderRadius:2,background:`rgba(14,165,233,${o})` }}/>)}
          <span style={{ fontSize:9,color:'var(--text3)',marginLeft:2 }}>Low → High</span>
        </div>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'86px 1fr',gap:6,marginBottom:5 }}>
        <div/>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:3 }}>
          {['3w ago','2w ago','Last w','This w'].map((l,i) => (
            <div key={l} style={{ fontSize:9,color:i===3?'#38bdf8':'var(--text3)',textAlign:'center',fontWeight:i===3?700:600 }}>{l}</div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
        {memberHabits.length === 0
          ? <div style={{ padding:12,textAlign:'center',fontSize:12,color:'var(--text3)' }}>No member data yet</div>
          : memberHabits.map((m, i) => (
            <div key={m.user_id||i} style={{ display:'grid',gridTemplateColumns:'86px 1fr',gap:6,alignItems:'center' }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,minWidth:0 }}>
                <div style={{ width:22,height:22,borderRadius:'50%',background:m.trend>0?'rgba(16,185,129,0.18)':m.trend<0?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:900,color:m.trend>0?'#34d399':m.trend<0?'#f87171':'var(--text3)',flexShrink:0 }}>
                  {m.trend > 0 ? '↑' : m.trend < 0 ? '↓' : '→'}
                </div>
                <span style={{ fontSize:11,fontWeight:600,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{m.name.split(' ')[0]}</span>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:3 }}>
                {m.weekCounts.map((v, wi) => (
                  <div key={wi} title={`${v} check-in${v!==1?'s':''}`} style={{ height:16,borderRadius:3,background:getCell(v),display:'flex',alignItems:'center',justifyContent:'center' }}>
                    {v > 0 && <span style={{ fontSize:8,fontWeight:800,color:v>=3?'#fff':'rgba(255,255,255,0.6)' }}>{v}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))
        }
      </div>
      <div style={{ marginTop:12,paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between' }}>
        <span style={{ fontSize:10,color:'var(--text3)' }}>{memberHabits.filter(m=>m.avg>=3).length} members training 3×/week+</span>
        <span style={{ fontSize:10,color:'var(--text3)',fontWeight:600 }}>4-week window</span>
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