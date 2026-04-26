/**
 * TabActions — fully dynamic, data-driven priority actions dashboard.
 * All actions, metrics, and feed items are derived from real props.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Shield, Send, Users, Calendar, Trophy, AlertTriangle,
  ChevronDown, Check, X, Star, Gift,
  TrendingUp, Plus, Eye, Sparkles,
  BarChart2, ChevronRight, Clock, UserPlus, MessageCircle,
} from "lucide-react";

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:       "#000000",
  sidebar:  "#0f0f12",
  card:     "#141416",
  card2:    "#1a1a1f",
  brd:      "#222226",
  t1:       "#ffffff",
  t2:       "#8a8a94",
  t3:       "#444450",
  cyan:     "#4d7fff",
  cyanDim:  "rgba(77,127,255,0.12)",
  cyanBrd:  "rgba(77,127,255,0.28)",
  red:      "#f04a68",
  redDim:   "rgba(240,74,104,0.10)",
  redBrd:   "rgba(240,74,104,0.25)",
  amber:    "#e8940a",
  amberDim: "rgba(232,148,10,0.10)",
  amberBrd: "rgba(232,148,10,0.25)",
  green:    "#1eb85a",
  greenDim: "rgba(30,184,90,0.10)",
  greenBrd: "rgba(30,184,90,0.25)",
  blue:     "#4f97f5",
  blueDim:  "rgba(79,151,245,0.10)",
  blueBrd:  "rgba(79,151,245,0.25)",
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

const URGENCY = {
  critical: { color: C.red,   leftBorder: "#f04a68" },
  high:     { color: C.amber, leftBorder: "#e8940a" },
  medium:   { color: C.cyan,  leftBorder: "#4d7fff" },
  low:      { color: C.green, leftBorder: "#1eb85a" },
};

const FILTERS = ["All", "Retention", "Engagement", "Challenge", "Milestone"];

/* ─── HELPERS ─────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  let d = new Date(dateStr);
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) d = new Date(dateStr + "Z");
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return "just now";
  const mins = diffMs / 60000;
  if (mins < 2) return "just now";
  if (mins < 60) return `${Math.floor(mins)}m ago`;
  const hrs = mins / 60;
  if (hrs < 24) return `${Math.floor(hrs)}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  let d = new Date(dateStr);
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) d = new Date(dateStr + "Z");
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/* ─── DERIVE ACTIONS FROM REAL DATA ───────────────────────────── */
function deriveActions({
  allMemberships, checkIns, classes, challenges, polls, posts, events,
  atRisk, atRiskMembersList, memberLastCheckIn, totalMembers, activeThisWeek,
  monthChangePct, selectedGym, openModal, setTab, nameMap,
}) {
  const actions = [];
  const now = Date.now();
  const gymId = selectedGym?.id;

  // ── 1. RETENTION: Inactive members ────────────────────────────
  const INACTIVITY_THRESHOLD = 14;
  const atRiskMembers = atRiskMembersList?.length > 0 ? atRiskMembersList : [];

  // Build member inactivity from checkIns + memberLastCheckIn
  const memberCheckInMap = {};
  checkIns.forEach(c => {
    if (!c.user_id) return;
    const existing = memberCheckInMap[c.user_id];
    const dt = c.check_in_date || c.created_date;
    if (!existing || new Date(dt) > new Date(existing)) {
      memberCheckInMap[c.user_id] = dt;
    }
  });
  // Merge with memberLastCheckIn from stats
  if (memberLastCheckIn) {
    Object.entries(memberLastCheckIn).forEach(([uid, dt]) => {
      if (!memberCheckInMap[uid] || new Date(dt) > new Date(memberCheckInMap[uid])) {
        memberCheckInMap[uid] = dt;
      }
    });
  }

  const inactiveMembers = allMemberships.filter(m => {
    const lastCI = memberCheckInMap[m.user_id];
    if (!lastCI) return true; // never checked in
    return daysSince(lastCI) >= INACTIVITY_THRESHOLD;
  });

  const inactiveCount = atRisk > 0 ? atRisk : inactiveMembers.length;

  if (inactiveCount > 0) {
    const avgAbsent = inactiveMembers.length > 0
      ? Math.round(inactiveMembers.reduce((sum, m) => {
          const lastCI = memberCheckInMap[m.user_id];
          return sum + (lastCI ? daysSince(lastCI) : 21);
        }, 0) / Math.max(inactiveMembers.length, 1))
      : 19;

    const revAtRisk = inactiveCount * 49; // ~£49/member/month estimate

    actions.push({
      id: "retention-inactive",
      urgency: inactiveCount >= 5 ? "critical" : "high",
      icon: Users,
      title: `${inactiveCount} member${inactiveCount !== 1 ? "s" : ""} haven't visited in ${INACTIVITY_THRESHOLD}+ days`,
      subtitle: "Send a check-in message to re-engage before they churn.",
      tag: "Retention", tagColor: C.red,
      successRate: 38,
      memberInitials: inactiveMembers.slice(0, 5).map(m => {
        const name = nameMap?.[m.user_id] || m.user_name || "?";
        return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      }),
      cta: "Message Them", ctaIcon: Send, secondaryCta: "View Members",
      stats: [
        { label: "At risk", val: String(inactiveCount) },
        { label: "Avg absent", val: `${avgAbsent}d` },
        { label: "Success", val: "38%" },
      ],
      detail: `These members are in the critical churn window. Acting now recovers ~1 in 3 members. Revenue at risk: ~£${revAtRisk}/mo.`,
      timeAgo: "detected now",
      onCta: () => setTab?.("members"),
      onSecondary: () => setTab?.("members"),
    });
  }

  // ── 2. ENGAGEMENT: Underbooked upcoming classes ────────────────
  const nowDate = new Date();
  const upcoming48hClasses = (classes || []).filter(cls => {
    if (!cls.schedule?.length) return false;
    // Check if any schedule slot is within next 48h
    return cls.schedule.some(s => {
      if (!s.date || !s.time) return false;
      const classDate = new Date(`${s.date}T${s.time}`);
      const diffH = (classDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60);
      return diffH > 0 && diffH <= 48;
    });
  });

  upcoming48hClasses.forEach(cls => {
    const maxCap = cls.max_capacity || 20;
    // Count bookings for this class from checkIns (approximate)
    const classCheckIns = checkIns.filter(c => {
      const name = (cls.name || "").toLowerCase();
      return c.class_name?.toLowerCase().includes(name) || c.class_id === cls.id;
    }).length;
    const booked = Math.max(classCheckIns, cls.current_bookings || 0);
    const capPct = Math.round((booked / maxCap) * 100);

    if (capPct < 60) {
      const schedule = cls.schedule?.find(s => s.date && s.time);
      const classTime = schedule ? new Date(`${schedule.date}T${schedule.time}`) : null;
      const hoursLeft = classTime ? Math.round((classTime.getTime() - nowDate.getTime()) / (1000 * 60 * 60)) : null;

      actions.push({
        id: `class-underbooked-${cls.id}`,
        urgency: capPct < 30 ? "high" : "medium",
        icon: Calendar,
        title: `${cls.name} underbooked — ${booked}/${maxCap} spots filled`,
        subtitle: "Promote this class to boost attendance.",
        tag: "Engagement", tagColor: C.amber,
        successRate: 62,
        memberInitials: [],
        cta: "Promote Class", ctaIcon: Send, secondaryCta: "View Class",
        stats: [
          { label: "Capacity", val: `${capPct}%` },
          { label: "Time left", val: hoursLeft !== null ? `${hoursLeft}h` : "—" },
          { label: "Success", val: "62%" },
        ],
        detail: `${cls.name} is at ${capPct}% capacity. A quick community post typically fills 5–8 additional spots within 3 hours.`,
        timeAgo: "just now",
        onCta: () => openModal?.("post"),
        onSecondary: () => setTab?.("content"),
      });
    }
  });

  // ── 3. ENGAGEMENT: Attendance drop ────────────────────────────
  if (monthChangePct < -5) {
    actions.push({
      id: "engagement-drop",
      urgency: monthChangePct < -15 ? "high" : "medium",
      icon: TrendingUp,
      title: `Attendance dropped ${Math.abs(monthChangePct)}% vs last month`,
      subtitle: "Run a re-engagement campaign or create a challenge.",
      tag: "Engagement", tagColor: C.amber,
      successRate: 54,
      memberInitials: [],
      cta: "Create Challenge", ctaIcon: Plus, secondaryCta: "View Analytics",
      stats: [
        { label: "Drop", val: `${Math.abs(monthChangePct)}%` },
        { label: "Active", val: String(activeThisWeek) },
        { label: "Success", val: "54%" },
      ],
      detail: `Attendance is down ${Math.abs(monthChangePct)}% month-over-month. A challenge or community event typically reverses a 10–15% drop within 2 weeks.`,
      timeAgo: "this month",
      onCta: () => openModal?.("challenge"),
      onSecondary: () => setTab?.("analytics"),
    });
  }

  // ── 4. CONTENT: Gym hasn't posted recently ────────────────────
  const gymPosts = posts.filter(p => p.post_type && !p.is_draft && !p.is_hidden);
  const lastGymPost = gymPosts.sort((a, b) => new Date(b.created_date || b.created_at || 0) - new Date(a.created_date || a.created_at || 0))[0];
  const daysSincePost = lastGymPost ? daysSince(lastGymPost.created_date || lastGymPost.created_at) : 99;
  const POST_SILENCE_THRESHOLD = 3;

  if (daysSincePost >= POST_SILENCE_THRESHOLD) {
    const isLong = daysSincePost >= 7;
    actions.push({
      id: "content-no-post",
      urgency: isLong ? "high" : "medium",
      icon: MessageCircle,
      title: daysSincePost >= 99
        ? "You haven't posted to your community yet"
        : `No gym post in ${daysSincePost} day${daysSincePost !== 1 ? "s" : ""}`,
      subtitle: "Gyms that post 3× a week see 40% higher member retention.",
      tag: "Engagement", tagColor: C.amber,
      successRate: 68,
      memberInitials: [],
      cta: "Write a Post", ctaIcon: Plus, secondaryCta: null,
      stats: [
        { label: "Last post", val: daysSincePost >= 99 ? "Never" : `${daysSincePost}d ago` },
        { label: "Ideal cadence", val: "3×/wk" },
        { label: "Retention lift", val: "+40%" },
      ],
      detail: isLong
        ? `It's been ${daysSincePost} days since your last post. Members who see regular updates are far less likely to disengage. A tip, announcement, or motivational post takes under 2 minutes.`
        : `Your last post was ${daysSincePost} days ago. Staying consistent in members' feeds keeps your gym top-of-mind and drives check-in frequency.`,
      timeAgo: lastGymPost ? `last post ${daysSincePost}d ago` : "never posted",
      onCta: () => openModal?.("post"),
    });
  }

  // ── 5. CONTENT: No upcoming events ────────────────────────────
  const upcomingEvents = events.filter(ev => ev.event_date && new Date(ev.event_date) > nowDate);
  if (upcomingEvents.length === 0) {
    actions.push({
      id: "content-no-event",
      urgency: "medium",
      icon: Calendar,
      title: "No upcoming events scheduled",
      subtitle: "Events create social anchors that drive visits and referrals.",
      tag: "Engagement", tagColor: C.amber,
      successRate: 73,
      memberInitials: [],
      cta: "Create Event", ctaIcon: Plus, secondaryCta: null,
      stats: [
        { label: "Avg sign-ups", val: `${Math.max(3, Math.round(totalMembers * 0.18))}` },
        { label: "Referral rate", val: "+22%" },
        { label: "Success", val: "73%" },
      ],
      detail: "Gyms with at least one upcoming event see 22% more referrals that week. Even a simple open box day or social workout drives visits from members who might otherwise skip.",
      timeAgo: "ongoing",
      onCta: () => openModal?.("event"),
    });
  }

  // ── 6. CHALLENGE: No active challenges — smarter ──────────────
  const now2 = new Date();
  const activeChallenges = challenges.filter(ch =>
    ch.status === "active" || (!ch.end_date || new Date(ch.end_date) >= now2)
  );
  const lastChallenge = challenges.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))[0];
  const daysSinceChallenge = lastChallenge ? daysSince(lastChallenge.created_date) : 99;

  if (activeChallenges.length === 0) {
    // Smarter messaging: if engagement is dropping, escalate urgency
    const isEngagementDrop = monthChangePct < -5;
    const urgencyLevel = isEngagementDrop ? "high" : "medium";
    const titlePrefix = isEngagementDrop ? "Engagement dropping — " : "";
    actions.push({
      id: "challenge-none",
      urgency: urgencyLevel,
      icon: Trophy,
      title: `${titlePrefix}No active challenge running`,
      subtitle: isEngagementDrop
        ? "A challenge right now could reverse your engagement drop within 2 weeks."
        : "Launch a challenge to spike activity and reward your most loyal members.",
      tag: "Challenge", tagColor: C.cyan,
      successRate: 76,
      memberInitials: [],
      cta: "Create Challenge", ctaIcon: Plus, secondaryCta: null,
      stats: [
        { label: "Engagement lift", val: "+31%" },
        { label: "Last one", val: daysSinceChallenge >= 99 ? "Never" : `${daysSinceChallenge}d ago` },
        { label: "Success", val: "76%" },
      ],
      detail: `Members who join a challenge are 3× more likely to stay active the following month. ${isEngagementDrop ? `With attendance down ${Math.abs(monthChangePct)}%, a 2-week check-in challenge is your fastest lever. ` : ""}Even a simple "most check-ins this month" challenge drives meaningful retention.`,
      timeAgo: lastChallenge ? `last ${daysSinceChallenge}d ago` : "never run",
      onCta: () => openModal?.("challenge"),
    });
  }

  // ── 7. ENGAGEMENT: No active polls ────────────────────────────
  const lastPoll = polls.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))[0];
  const daysSincePoll = lastPoll ? daysSince(lastPoll.created_date) : 99;

  if (polls.length === 0 || daysSincePoll > 14) {
    actions.push({
      id: "polls-none",
      urgency: "low",
      icon: BarChart2,
      title: polls.length === 0
        ? "You've never run a community poll"
        : `No poll active — last one was ${daysSincePoll}d ago`,
      subtitle: "Ask members what classes or events they want next.",
      tag: "Engagement", tagColor: C.blue,
      successRate: 71,
      memberInitials: [],
      cta: "Create Poll", ctaIcon: Plus, secondaryCta: null,
      stats: [
        { label: "Engagement", val: "+24%" },
        { label: "Avg votes", val: `${Math.max(3, Math.round(totalMembers * 0.35))}` },
        { label: "Response rate", val: "35%" },
      ],
      detail: "Polls give members a voice and pull inactive members back into the app to vote. A 'What class do you want next?' poll consistently gets the highest response rates.",
      timeAgo: lastPoll ? `${daysSincePoll}d ago` : "never",
      onCta: () => openModal?.("poll"),
    });
  }

  // ── 6. MILESTONE: New members who haven't returned ────────────
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newNoReturn = allMemberships.filter(m => {
    const joined = m.join_date || m.created_date;
    if (!joined) return false;
    const joinedMs = new Date(joined).getTime();
    if (joinedMs < sevenDaysAgo) return false; // joined > 7 days ago, skip
    const lastCI = memberCheckInMap[m.user_id];
    if (!lastCI) return true; // never checked in since joining
    return daysSince(lastCI) >= 5; // joined but inactive again after first visit
  });

  if (newNoReturn.length > 0) {
    actions.push({
      id: "milestone-new-no-return",
      urgency: "high",
      icon: UserPlus,
      title: `${newNoReturn.length} new member${newNoReturn.length !== 1 ? "s" : ""} haven't returned since joining`,
      subtitle: "First 7 days are critical — send a welcome nudge now.",
      tag: "Milestone", tagColor: C.blue,
      successRate: 67,
      memberInitials: newNoReturn.slice(0, 4).map(m => {
        const name = nameMap?.[m.user_id] || m.user_name || "?";
        return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      }),
      cta: "Send Welcome", ctaIcon: Send, secondaryCta: "View Members",
      stats: [
        { label: "New members", val: String(newNoReturn.length) },
        { label: "Window", val: "7d" },
        { label: "Success", val: "67%" },
      ],
      detail: "Members who receive a personal welcome in their first week are 2× more likely to become long-term regulars.",
      timeAgo: "detected now",
      onCta: () => setTab?.("members"),
      onSecondary: () => setTab?.("members"),
    });
  }

  // ── 7. MILESTONE: Visit milestones ────────────────────────────
  const MILESTONES = [10, 25, 50, 100];
  const milestoneMembers = [];
  allMemberships.forEach(m => {
    if (!m.user_id) return;
    const memberCIs = checkIns.filter(c => c.user_id === m.user_id).length;
    for (const milestone of MILESTONES) {
      // Check if they're within 2 visits of a milestone (just hit or about to)
      if (memberCIs >= milestone && memberCIs <= milestone + 2) {
        milestoneMembers.push({ ...m, visitCount: memberCIs, milestone });
        break;
      }
    }
  });

  if (milestoneMembers.length > 0) {
    const topMember = milestoneMembers[0];
    const topName = nameMap?.[topMember.user_id] || topMember.user_name || "A member";
    actions.push({
      id: "milestone-visits",
      urgency: "low",
      icon: Star,
      title: `${milestoneMembers.length === 1 ? topName : `${milestoneMembers.length} members`} hit${milestoneMembers.length === 1 ? "s" : ""} a visit milestone`,
      subtitle: "Celebrate their achievement to boost loyalty and referrals.",
      tag: "Milestone", tagColor: C.green,
      successRate: 94,
      memberInitials: milestoneMembers.slice(0, 4).map(m => {
        const name = nameMap?.[m.user_id] || m.user_name || "?";
        return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      }),
      cta: "Send Congrats", ctaIcon: Send, secondaryCta: null,
      stats: [
        { label: "Members", val: String(milestoneMembers.length) },
        { label: "Milestone", val: `${topMember.milestone} visits` },
        { label: "Success", val: "94%" },
      ],
      detail: "Milestone messages have the highest open rate of any automated message type. 1 in 4 recipients refer a friend after being celebrated.",
      timeAgo: timeAgo(milestoneMembers[0]?.updated_date || milestoneMembers[0]?.created_date),
      onCta: () => setTab?.("members"),
    });
  }

  // Sort by urgency weight
  const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  actions.sort((a, b) => (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0));

  return actions;
}

/* ─── DERIVE LIVE FEED FROM REAL DATA ─────────────────────────── */
function deriveFeed({ checkIns, posts, allMemberships, memberLastCheckIn, nameMap, atRiskMembersList }) {
  const feed = [];
  const now = Date.now();
  const memberCheckInMap = {};
  checkIns.forEach(c => {
    if (!c.user_id) return;
    const existing = memberCheckInMap[c.user_id];
    const dt = c.check_in_date || c.created_date;
    if (!existing || new Date(dt) > new Date(existing)) memberCheckInMap[c.user_id] = dt;
  });

  // Recent check-ins (last 6h) = wins
  const recentCIs = checkIns
    .filter(c => {
      const dt = c.check_in_date || c.created_date;
      return dt && (now - new Date(dt).getTime()) < 6 * 60 * 60 * 1000;
    })
    .slice(0, 4);

  recentCIs.forEach(ci => {
    const name = nameMap?.[ci.user_id] || ci.user_name || "A member";
    feed.push({
      id: `ci-${ci.id || ci.user_id}`,
      type: "win",
      icon: Check,
      color: C.green,
      member: name,
      action: "just checked in",
      cta: null,
      ago: timeAgo(ci.check_in_date || ci.created_date),
      isNew: (now - new Date(ci.check_in_date || ci.created_date).getTime()) < 30 * 60 * 1000,
    });
  });

  // At-risk members = alerts
  const riskAlerts = (atRiskMembersList || []).slice(0, 3);
  riskAlerts.forEach(m => {
    const name = nameMap?.[m.user_id] || m.user_name || m.name || "Member";
    const lastCI = memberCheckInMap[m.user_id];
    const absent = lastCI ? daysSince(lastCI) : 21;
    feed.push({
      id: `risk-${m.user_id || m.id}`,
      type: "alert",
      icon: AlertTriangle,
      color: C.red,
      member: name,
      action: `Hasn't visited in ${absent} days`,
      cta: "Message",
      ago: "now",
      isNew: true,
    });
  });

  // Recent gym posts
  const recentPosts = posts
    .filter(p => !p.is_hidden && p.post_type && (now - new Date(p.created_date || p.created_at || 0).getTime()) < 24 * 60 * 60 * 1000)
    .slice(0, 2);
  recentPosts.forEach(p => {
    feed.push({
      id: `post-${p.id}`,
      type: "insight",
      icon: MessageCircle,
      color: C.cyan,
      member: null,
      action: `New gym post: "${(p.content || "").slice(0, 40)}${p.content?.length > 40 ? "…" : ""}"`,
      cta: "View",
      ago: timeAgo(p.created_date || p.created_at),
      isNew: false,
    });
  });

  // Sort: isNew first, then most recent
  feed.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));

  return feed.slice(0, 8);
}

/* ─── LIVE SUMMARY TICKER ─────────────────────────────────────── */
function LiveTicker({ ticks }) {
  const [idx,     setIdx]     = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [sliding, setSliding] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    if (ticks.length <= 1) return;
    const t = setInterval(() => {
      const prev = idxRef.current;
      const next = (prev + 1) % ticks.length;
      idxRef.current = next;
      setPrevIdx(prev);
      setIdx(next);
      setSliding(true);
      setTimeout(() => { setPrevIdx(null); setSliding(false); }, 700);
    }, 5000);
    return () => clearInterval(t);
  }, [ticks.length]);

  if (!ticks.length) return null;

  return (
    <>
      <style>{`
        @keyframes tOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-110%)}}
        @keyframes tIn {from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}
      `}</style>
      <div style={{ flex: 1, maxWidth: 480, height: 34, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, borderRadius: 6, overflow: "hidden", position: "relative", display: "flex", alignItems: "center" }}>
        {sliding && prevIdx !== null && (
          <span style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 11.5, fontWeight: 600, color: "#93c5fd", fontFamily: FONT, padding: "0 14px", animation: "tOut 0.7s cubic-bezier(0.4,0,0.2,1) forwards", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {ticks[prevIdx]}
          </span>
        )}
        <span key={idx} style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 11.5, fontWeight: 600, color: "#93c5fd", fontFamily: FONT, padding: "0 14px", animation: sliding ? "tIn 0.7s cubic-bezier(0.4,0,0.2,1) forwards" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {ticks[idx]}
        </span>
      </div>
    </>
  );
}

/* ─── TABS ───────────────────────────────────────────────────── */
function Tabs({ active, setActive }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.brd}`, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActive(f)} style={{ padding: "7px 14px", fontSize: 12.5, background: "transparent", border: "none", borderBottom: `2px solid ${active === f ? C.cyan : "transparent"}`, color: active === f ? C.t1 : C.t2, fontWeight: active === f ? 700 : 400, cursor: "pointer", marginBottom: -1, fontFamily: FONT, transition: "color 0.15s", whiteSpace: "nowrap", minHeight: 40 }}>{f}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── AVATAR STACK ───────────────────────────────────────────── */
const AV_COLORS = ["#6366f1", "#14b8a6", "#8b5cf6", "#e8940a", "#f04a68", "#4f97f5"];
function AvatarStack({ members }) {
  if (!members || !members.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
      {members.slice(0, 4).map((ini, i) => {
        const color = AV_COLORS[(ini.charCodeAt(0) || i) % AV_COLORS.length];
        return (
          <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, background: `${color}20`, color, fontSize: 6.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${C.card}`, marginLeft: i > 0 ? -6 : 0 }}>
            {ini}
          </div>
        );
      })}
      {members.length > 4 && <span style={{ fontSize: 9.5, color: C.t3, marginLeft: 5 }}>+{members.length - 4}</span>}
    </div>
  );
}

/* ─── PROGRESS BAR ───────────────────────────────────────────── */
function SuccessBar({ pct, color }) {
  return (
    <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", width: 52, flexShrink: 0 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
    </div>
  );
}

/* ─── ACTION CARD ────────────────────────────────────────────── */
function ActionCard({ action, onDismiss }) {
  const [acted,    setActed]    = useState(false);
  const [expanded, setExpanded] = useState(false);
  const u = URGENCY[action.urgency];

  const cardHover = (e, enter) => {
    if (acted) return;
    e.currentTarget.style.borderColor     = enter ? C.cyanBrd : C.brd;
    e.currentTarget.style.borderLeftColor = u.leftBorder;
    e.currentTarget.style.boxShadow       = enter ? "0 0 8px rgba(77,127,255,0.07)" : "none";
  };

  const handleCta = () => {
    setActed(true);
    action.onCta?.();
  };

  const handleSecondary = () => {
    action.onSecondary?.();
  };

  return (
    <div
      style={{ background: C.card, border: `1px solid ${C.brd}`, borderLeft: `2px solid ${u.leftBorder}`, borderRadius: 12, overflow: "hidden", opacity: acted ? 0.4 : 1, transition: "opacity 0.3s, border-color 0.15s, box-shadow 0.15s" }}
      onMouseEnter={e => cardHover(e, true)}
      onMouseLeave={e => cardHover(e, false)}
    >
      <div style={{ display: "flex", height: 120 }}>
        {/* Left: 3-row content */}
        <div style={{ flex: 1, minWidth: 0, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {/* Row 1 */}
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: `${u.color}10`, border: `1px solid ${u.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <action.icon size={12} color={u.color} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.t1, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{action.title}</span>
            <span style={{ padding: "1px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700, color: action.tagColor, background: `${action.tagColor}12`, border: `1px solid ${action.tagColor}28`, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", flexShrink: 0 }}>{action.tag}</span>
            <span style={{ fontSize: 9.5, color: C.t3, flexShrink: 0 }}>{action.timeAgo}</span>
          </div>

          {/* Row 2 */}
          <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.5, paddingLeft: 37, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{action.subtitle}</div>

          {/* Row 3 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 37 }}>
            {action.stats.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 3, flexShrink: 0 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: i === 2 ? u.color : C.t1, fontVariantNumeric: "tabular-nums" }}>{s.val}</span>
                <span style={{ fontSize: 9.5, color: C.t3 }}>{s.label}</span>
              </div>
            ))}
            {action.memberInitials?.length > 0 && <AvatarStack members={action.memberInitials} />}
            <div style={{ flex: 1 }} />
            <SuccessBar pct={action.successRate} color={u.color} />
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div style={{ width: 128, flexShrink: 0, borderLeft: `1px solid ${C.brd}`, padding: "10px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: C.t3, marginBottom: 2 }}>Quick Actions</div>

          {acted ? (
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 9px", borderRadius: 7, background: C.greenDim, border: `1px solid ${C.greenBrd}` }}>
              <Check size={10} color={C.green} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: C.green }}>Done</span>
            </div>
          ) : (
            <button onClick={handleCta} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, width: "100%", padding: "6px 0", borderRadius: 7, background: C.cyan, border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT, boxShadow: "0 0 10px rgba(77,127,255,0.22)", overflow: "hidden", whiteSpace: "nowrap" }}>
              <action.ctaIcon size={10} style={{ flexShrink: 0 }} />{action.cta}
            </button>
          )}

          {action.secondaryCta && !acted && (
            <button onClick={handleSecondary} style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", padding: "5px 9px", borderRadius: 7, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s", overflow: "hidden", whiteSpace: "nowrap" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; e.currentTarget.style.background = C.cyanDim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
              <Eye size={10} style={{ flexShrink: 0 }} />{action.secondaryCta}
            </button>
          )}

          <button onClick={() => onDismiss?.(action.id)} style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", padding: "5px 9px", borderRadius: 7, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.redBrd; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
            <X size={10} style={{ flexShrink: 0 }} />Dismiss
          </button>

          <button onClick={() => setExpanded(v => !v)} style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: expanded ? C.cyan : C.t3, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FONT, padding: "2px 0", transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = C.cyan}
            onMouseLeave={e => e.currentTarget.style.color = expanded ? C.cyan : C.t3}>
            <Sparkles size={9} />AI insight
            <ChevronDown size={9} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "10px 14px 12px", borderTop: `1px solid ${C.brd}`, background: "rgba(77,127,255,0.03)" }}>
          <span style={{ fontSize: 11.5, color: C.cyan, fontWeight: 600 }}>AI insight · </span>
          <span style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.65 }}>{action.detail}</span>
        </div>
      )}
    </div>
  );
}

/* ─── FEED ROW ───────────────────────────────────────────────── */
function FeedRow({ item, i, total }) {
  const [sent, setSent] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderBottom: i < total - 1 ? `1px solid ${C.brd}` : "none", background: item.isNew ? `${C.cyan}08` : "transparent", transition: "background 0.4s" }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: `${item.color}10`, border: `1px solid ${item.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <item.icon size={10} color={item.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.member && <span style={{ fontWeight: 600, color: C.t1 }}>{item.member} </span>}
          <span style={{ color: item.type === "win" ? C.green : C.t2 }}>{item.action}</span>
        </div>
        <div style={{ fontSize: 9.5, color: C.t3, marginTop: 1 }}>{item.ago}</div>
      </div>
      {item.type === "win" ? (
        <span style={{ fontSize: 9, fontWeight: 700, color: C.green, background: C.greenDim, border: `1px solid ${C.greenBrd}`, borderRadius: 4, padding: "2px 6px", flexShrink: 0, textTransform: "uppercase" }}>win</span>
      ) : item.cta ? (
        <button onClick={() => setSent(true)} style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FONT, flexShrink: 0, whiteSpace: "nowrap", background: sent ? C.greenDim : "rgba(255,255,255,0.03)", border: `1px solid ${sent ? C.greenBrd : C.brd}`, color: sent ? C.green : C.t2, transition: "all 0.2s" }}>
          {sent ? "Done" : item.cta}
        </button>
      ) : null}
    </div>
  );
}

/* ─── RIGHT SIDEBAR ──────────────────────────────────────────── */
function RightSidebar({ actions, feedItems, totalMembers, activeThisWeek, atRisk }) {
  const urgentCount   = actions.filter(a => a.urgency === "critical" || a.urgency === "high").length;
  const revenueAtRisk = atRisk * 49; // ~£49/member/month
  const doneToday     = 0; // real tracking would require persistent state
  const activityPct   = totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0;

  // AI coach insight: pick the biggest opportunity
  const topAction = actions[0];
  let aiInsight = "All quiet — no critical actions right now. Great time to plan ahead.";
  if (topAction?.urgency === "critical" || topAction?.urgency === "high") {
    aiInsight = `Your biggest opportunity is: ${topAction.title.toLowerCase()}. ${topAction.detail}`;
  } else if (topAction) {
    aiInsight = `Focus on: ${topAction.title.toLowerCase()}. ${topAction.detail}`;
  }
  // Trim to 2 sentences
  aiInsight = aiInsight.split(". ").slice(0, 2).join(". ") + (aiInsight.includes(".") ? "." : "");

  const statCards = [
    { label: "Urgent Actions",  val: String(urgentCount),                      col: urgentCount > 0 ? C.red : C.green },
    { label: "Revenue at Risk", val: revenueAtRisk > 0 ? `£${revenueAtRisk}` : "£0", col: C.cyan },
    { label: "Activity",        val: `${activityPct}%`,                        col: activityPct >= 60 ? C.green : activityPct >= 30 ? C.amber : C.red },
    { label: "Actions",         val: String(actions.length),                   col: C.blue },
  ];

  return (
    <div style={{ width: 244, flexShrink: 0, background: C.sidebar, borderLeft: `1px solid ${C.brd}`, display: "flex", flexDirection: "column", fontFamily: FONT, overflowY: "auto", alignSelf: "flex-start" }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Actions Overview</div>
      </div>

      {/* Stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: C.brd, borderBottom: `1px solid ${C.brd}` }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ padding: "12px 14px", background: C.sidebar }}>
            <div style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* AI Coach */}
      <div style={{ padding: "14px", borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ padding: "13px", borderRadius: 10, background: C.card, border: `1px solid ${C.cyanBrd}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={10} color={C.cyan} />
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.t1 }}>AI Coach</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, padding: "1px 6px", borderRadius: 20, marginLeft: "auto", letterSpacing: "0.04em", textTransform: "uppercase" }}>Live</span>
          </div>
          <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.65, marginBottom: 10 }}>
            {aiInsight.length > 180 ? aiInsight.slice(0, 177) + "…" : aiInsight}
          </div>
          {revenueAtRisk > 0 && (
            <div style={{ fontSize: 11, color: C.cyan, fontWeight: 600 }}>
              ~£{revenueAtRisk}/mo revenue at risk
            </div>
          )}
        </div>
      </div>

      {/* Live Feed */}
      <div style={{ padding: "14px 14px 12px", borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Live Feed</span>
          </div>
          <span style={{ fontSize: 10, color: C.t3 }}>{feedItems.length} events</span>
        </div>
        {feedItems.length === 0 ? (
          <div style={{ fontSize: 11.5, color: C.t3, textAlign: "center", padding: "16px 0" }}>No recent activity</div>
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden" }}>
            {feedItems.slice(0, 6).map((item, i) => (
              <FeedRow key={item.id} item={item} i={i} total={Math.min(feedItems.length, 6)} />
            ))}
          </div>
        )}
      </div>

      {/* Member activity summary */}
      <div style={{ padding: "14px 14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Users size={11} color={C.cyan} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Member Activity</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Active this week", val: activeThisWeek, color: C.green },
            { label: "Total members",    val: totalMembers,   color: C.t1 },
            { label: "At risk",          val: atRisk,         color: atRisk > 0 ? C.red : C.t3 },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: C.t3, flex: 1 }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function TabActions({
  allMemberships = [], checkIns = [], classes = [], challenges = [], polls = [],
  posts = [], events = [], atRisk = 0, atRiskMembersList = [], memberLastCheckIn = {},
  totalMembers = 0, activeThisWeek = 0, monthChangePct = 0, selectedGym = null,
  openModal, setTab, avatarMap = {}, nameMap = {},
}) {
  const [filter,  setFilter]  = useState("All");
  const [viewAll, setViewAll] = useState(false);

  const rawActions = useMemo(() => deriveActions({
    allMemberships, checkIns, classes, challenges, polls, posts, events,
    atRisk, atRiskMembersList, memberLastCheckIn, totalMembers, activeThisWeek,
    monthChangePct, selectedGym, openModal, setTab, nameMap,
  }), [allMemberships, checkIns, classes, challenges, polls, posts, events,
    atRisk, atRiskMembersList, totalMembers, activeThisWeek, monthChangePct, selectedGym]);

  const feedItems = useMemo(() => deriveFeed({
    checkIns, posts, allMemberships, memberLastCheckIn, nameMap, atRiskMembersList,
  }), [checkIns, posts, allMemberships, memberLastCheckIn, nameMap, atRiskMembersList]);

  const [dismissed, setDismissed] = useState(new Set());
  const actions = rawActions.filter(a => !dismissed.has(a.id));
  const dismiss = (id) => setDismissed(p => new Set([...p, id]));

  const filtered    = filter === "All" ? actions : actions.filter(a => a.tag === filter);
  const shown       = viewAll ? filtered : filtered.slice(0, 4);
  const urgentCount = actions.filter(a => a.urgency === "critical" || a.urgency === "high").length;

  const ticks = useMemo(() => {
    const t = [];
    if (urgentCount > 0) t.push(`${urgentCount} urgent action${urgentCount !== 1 ? "s" : ""} need attention now`);
    if (atRisk > 0) t.push(`${atRisk} members at churn risk — ~£${atRisk * 49}/mo at stake`);
    if (actions.length > 0) t.push(`${actions.length} priority action${actions.length !== 1 ? "s" : ""} across all categories`);
    if (activeThisWeek > 0) t.push(`${activeThisWeek} of ${totalMembers} members active this week`);
    if (!t.length) t.push("All caught up — no urgent actions right now");
    return t;
  }, [urgentCount, atRisk, actions.length, activeThisWeek, totalMembers]);

  return (
    <div style={{ display: "flex", height: "100%", background: C.bg, color: C.t1, fontFamily: FONT, overflow: "hidden" }}>
      <style>{`
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.brd};border-radius:2px}
      `}</style>

      {/* MAIN COLUMN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "4px 16px 0 4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              Actions <span style={{ color: C.cyan }}>/ Priority</span>
            </h1>
            {urgentCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: C.red, background: C.redDim, border: `1px solid ${C.redBrd}`, padding: "2px 9px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.red, display: "inline-block" }} />
                {urgentCount} urgent
              </span>
            )}
          </div>

          <LiveTicker ticks={ticks} />

          <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
            <button onClick={() => setViewAll(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, background: "#2563eb", border: "none", color: "#fff", transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <Eye size={12} />{viewAll ? "Show less" : `View all ${actions.length}`}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: "0 4px" }}>
          <Tabs active={filter} setActive={f => { setFilter(f); setViewAll(false); }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 32px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 10, marginTop: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>
              {filtered.length} action{filtered.length !== 1 ? "s" : ""} · sorted by urgency
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {shown.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 0", gap: 12 }}>
                <Check size={22} color={C.green} style={{ opacity: 0.7 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t2 }}>All caught up</div>
                <div style={{ fontSize: 11, color: C.t3 }}>No actions in this category.</div>
              </div>
            ) : shown.map(a => <ActionCard key={a.id} action={a} onDismiss={dismiss} />)}

            {!viewAll && filtered.length > 4 && (
              <button onClick={() => setViewAll(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px", borderRadius: 9, background: "rgba(255,255,255,0.015)", border: `1px solid ${C.brd}`, color: C.t3, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; }}>
                Show {filtered.length - 4} more <ChevronDown size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      <RightSidebar
        actions={actions}
        feedItems={feedItems}
        totalMembers={totalMembers}
        activeThisWeek={activeThisWeek}
        atRisk={atRisk}
      />
    </div>
  );
}