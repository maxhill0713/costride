/**
 * TabEngagement — Forge Fitness design system
 * Mobile-first responsive: adapts on ≤768px, desktop layout unchanged.
 * No sidebar / topbar — those are injected by the shell.
 *
 * Cyan color updated to match ContentPage blue: #4d7fff
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Zap, UserPlus, Trophy, Flame, CheckCircle, Plus, Trash2,
  ChevronRight, AlertTriangle, Star, Gift, Clock, Send, X,
  Edit3, ToggleRight, ToggleLeft, ArrowUpRight, TrendingUp,
  MessageCircle, ChevronDown, Bell, RefreshCw, DollarSign, Activity,
} from "lucide-react";

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:       "#000000",
  card:     "#141416",
  card2:    "#0f0f12",
  inset:    "#0a0a0c",
  brd:      "#222226",
  brd2:     "#2a2a30",
  t1:       "#ffffff",
  t2:       "#8a8a94",
  t3:       "#444450",
  cyan:     "#4d7fff",
  cyanDim:  "rgba(77,127,255,0.12)",
  cyanBrd:  "rgba(77,127,255,0.28)",
  red:      "#ff4d6d",
  redDim:   "rgba(255,77,109,0.15)",
  amber:    "#f59e0b",
  amberDim: "rgba(245,158,11,0.15)",
  green:    "#22c55e",
  greenDim: "rgba(34,197,94,0.10)",
  greenBrd: "rgba(34,197,94,0.22)",
};

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

const cardStyle = {
  background: C.card,
  border: `1px solid ${C.brd}`,
  borderRadius: 12,
  overflow: "hidden",
};

/* ─── TRIGGER CATALOGUE ──────────────────────────────────────── */
const TRIGGERS = [
  { id:"inactive_7",   Icon:Clock,         cat:"Retention",  label:"Inactive 7 days",    desc:"No visit for 7 days"             },
  { id:"inactive_14",  Icon:AlertTriangle, cat:"Retention",  label:"Inactive 14 days",   desc:"No visit for 14 days"            },
  { id:"inactive_30",  Icon:AlertTriangle, cat:"Retention",  label:"Inactive 30 days",   desc:"No visit for 30 days"            },
  { id:"freq_drop",    Icon:TrendingUp,    cat:"Retention",  label:"Frequency drop",     desc:"Visits 50% less than usual"      },
  { id:"new_member",   Icon:UserPlus,      cat:"Onboarding", label:"New member joined",  desc:"Member joins for the first time" },
  { id:"first_return", Icon:CheckCircle,   cat:"Onboarding", label:"First return visit", desc:"Member returns for 2nd visit"    },
  { id:"streak_7",     Icon:Flame,         cat:"Milestones", label:"7-day streak",       desc:"7 consecutive days"              },
  { id:"streak_30",    Icon:Flame,         cat:"Milestones", label:"30-day streak",      desc:"30 consecutive days"             },
  { id:"visits_10",    Icon:Star,          cat:"Milestones", label:"10th visit",         desc:"Member's 10th check-in"          },
  { id:"visits_50",    Icon:Trophy,        cat:"Milestones", label:"50th visit",         desc:"Member's 50th check-in"          },
  { id:"visits_100",   Icon:Trophy,        cat:"Milestones", label:"100th visit",        desc:"Member's 100th check-in"         },
  { id:"birthday",     Icon:Gift,          cat:"Engagement", label:"Birthday",           desc:"It's a member's birthday"        },
];

const TEMPLATES = {
  inactive_7:   (g,n) => `Hey ${n}, we've missed you at ${g} this week. Your progress is waiting — come back and keep the momentum going.`,
  inactive_14:  (g,n) => `${n}, it's been a couple of weeks since we've seen you at ${g}. No judgement — just checking in.`,
  inactive_30:  (g,n) => `Hi ${n}, it's been a while. The doors at ${g} are always open whenever you're ready.`,
  new_member:   (g,n) => `Welcome to ${g}, ${n}. We're glad you're here. Ask any coach for help — we want you to love it here.`,
  first_return: (g,n) => `Great to see you back, ${n}. Coming back is the hardest part — you're building a real habit now.`,
  streak_7:     (g,n) => `${n}, 7 days straight at ${g}. That's a genuine streak. Keep going.`,
  streak_30:    (g,n) => `${n}, 30 days at ${g}. You've shown incredible consistency. You're an inspiration.`,
  visits_10:    (g,n) => `10 visits, ${n}. You've officially made ${g} part of your routine.`,
  visits_50:    (g,n) => `50 visits, ${n}. You're one of ${g}'s most dedicated members.`,
  visits_100:   (g,n) => `100 visits, ${n}. You're an absolute legend at ${g}.`,
  freq_drop:    (g,n) => `Hey ${n}, we noticed you've been a bit quieter at ${g} this month. Everything okay?`,
  birthday:     (g,n) => `Happy Birthday, ${n}. From everyone at ${g} — we hope you have an amazing day.`,
};

/* ─── REAL DATA HELPERS ──────────────────────────────────────── */
function timeAgoLabel(ms) {
  const s = (Date.now() - ms) / 1000;
  if (s < 60)   return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return "Yesterday";
}

function computeRuleStats(triggerId, checkIns, allMemberships, gymId) {
  const now = Date.now();
  const MS_DAY = 86400000;
  const estMemberValue = 60; // £ per month per member

  // Build last-checkin map per user
  const lastCiByUser = {};
  (checkIns || []).forEach(c => {
    if (c.gym_id !== gymId) return;
    const t = new Date(c.check_in_date || c.created_date).getTime();
    if (!lastCiByUser[c.user_id] || t > lastCiByUser[c.user_id]) lastCiByUser[c.user_id] = t;
  });

  // Build all checkins per user (sorted asc)
  const cisByUser = {};
  (checkIns || []).forEach(c => {
    if (c.gym_id !== gymId) return;
    if (!cisByUser[c.user_id]) cisByUser[c.user_id] = [];
    cisByUser[c.user_id].push(new Date(c.check_in_date || c.created_date).getTime());
  });
  Object.values(cisByUser).forEach(arr => arr.sort((a, b) => a - b));

  // Join dates
  const joinMap = {};
  (allMemberships || []).forEach(m => {
    if (m.join_date) joinMap[m.user_id] = new Date(m.join_date).getTime();
  });

  let sent = 0, returned = 0;

  if (triggerId === "inactive_14" || triggerId === "inactive_7" || triggerId === "inactive_30") {
    const days = triggerId === "inactive_7" ? 7 : triggerId === "inactive_14" ? 14 : 30;
    const threshold = days * MS_DAY;
    const windowEnd = now - threshold;
    (allMemberships || []).forEach(m => {
      const last = lastCiByUser[m.user_id];
      if (!last) return;
      // "sent" = member was inactive for `days` at some point in last 90 days
      if (last < now - threshold && last > now - (threshold + 90 * MS_DAY)) {
        sent++;
        // "returned" = they have a check-in AFTER the inactivity
        const cis = cisByUser[m.user_id] || [];
        if (cis.some(t => t > last + threshold)) returned++;
      }
    });
  } else if (triggerId === "new_member") {
    // Count members who joined in last 90 days
    const cutoff = now - 90 * MS_DAY;
    (allMemberships || []).forEach(m => {
      const jt = joinMap[m.user_id];
      if (jt && jt > cutoff) {
        sent++;
        const cis = cisByUser[m.user_id] || [];
        if (cis.some(t => t > jt + MS_DAY)) returned++;
      }
    });
  } else if (triggerId === "visits_10" || triggerId === "visits_50" || triggerId === "visits_100") {
    const target = triggerId === "visits_10" ? 10 : triggerId === "visits_50" ? 50 : 100;
    (allMemberships || []).forEach(m => {
      const cis = cisByUser[m.user_id] || [];
      if (cis.length >= target) { sent++; if (cis.length > target) returned++; }
    });
  } else if (triggerId === "streak_7" || triggerId === "streak_30") {
    const days = triggerId === "streak_7" ? 7 : 30;
    (allMemberships || []).forEach(m => {
      const cis = cisByUser[m.user_id] || [];
      if (cis.length >= days) { sent++; if (cis.length > days) returned++; }
    });
  } else if (triggerId === "first_return") {
    (allMemberships || []).forEach(m => {
      const cis = cisByUser[m.user_id] || [];
      if (cis.length >= 2) { sent++; returned++; }
      else if (cis.length === 1) sent++;
    });
  }

  const rate = sent > 0 ? Math.round((returned / sent) * 100) : 0;
  const saved = returned * estMemberValue;
  return { sent, returned, rate, saved };
}

function buildActivityFeed(checkIns, allMemberships, gymId) {
  const now = Date.now();
  const MS_DAY = 86400000;
  const recent = (checkIns || [])
    .filter(c => c.gym_id === gymId)
    .sort((a, b) => new Date(b.check_in_date || b.created_date) - new Date(a.check_in_date || a.created_date))
    .slice(0, 15);

  const joinMap = {};
  (allMemberships || []).forEach(m => {
    if (m.join_date) joinMap[m.user_id] = new Date(m.join_date).getTime();
  });

  return recent.map((c, i) => {
    const ts = new Date(c.check_in_date || c.created_date).getTime();
    const jt = joinMap[c.user_id];
    const isNew = jt && (ts - jt) < MS_DAY * 2;
    const type = isNew ? "triggered" : "returned";
    const rule = isNew ? "New member joined" : "Member check-in";
    return {
      id: c.id || i,
      type,
      rule,
      member: c.user_name || "Member",
      ago: timeAgoLabel(ts),
      isNew: false,
    };
  });
}

function buildRecommendations(checkIns, allMemberships, gymId, existingTriggerIds) {
  const now = Date.now();
  const MS_DAY = 86400000;

  const joinMap = {};
  (allMemberships || []).forEach(m => {
    if (m.join_date) joinMap[m.user_id] = new Date(m.join_date).getTime();
  });

  const lastCiByUser = {};
  const ciCountByUser = {};
  (checkIns || []).forEach(c => {
    if (c.gym_id !== gymId) return;
    const t = new Date(c.check_in_date || c.created_date).getTime();
    if (!lastCiByUser[c.user_id] || t > lastCiByUser[c.user_id]) lastCiByUser[c.user_id] = t;
    ciCountByUser[c.user_id] = (ciCountByUser[c.user_id] || 0) + 1;
  });

  const recs = [];

  // New members inactive in first 2 weeks
  const newInactive = (allMemberships || []).filter(m => {
    const jt = joinMap[m.user_id];
    if (!jt || (now - jt) > 21 * MS_DAY || (now - jt) < 5 * MS_DAY) return false;
    const last = lastCiByUser[m.user_id];
    return !last || (now - last) > 7 * MS_DAY;
  });
  if (newInactive.length > 0 && !existingTriggerIds.includes("inactive_7")) {
    recs.push({
      id: "rec_new_inactive",
      title: `${newInactive.length} new member${newInactive.length !== 1 ? "s" : ""} haven't returned yet`,
      body: `${newInactive.length} member${newInactive.length !== 1 ? "s" : ""} joined in the last 3 weeks but haven't been back. A nudge on day 5 significantly improves week-1 retention.`,
      impact: "+20–30% week-1 retention",
      trigger_id: "inactive_7",
      urgency: "high",
      icon: AlertTriangle,
    });
  }

  // At-risk members inactive 14+ days
  const atRisk14 = (allMemberships || []).filter(m => {
    const last = lastCiByUser[m.user_id];
    return last && (now - last) > 14 * MS_DAY && (now - last) < 60 * MS_DAY;
  });
  if (atRisk14.length > 0 && !existingTriggerIds.includes("inactive_14")) {
    recs.push({
      id: "rec_at_risk",
      title: `${atRisk14.length} member${atRisk14.length !== 1 ? "s" : ""} inactive 14+ days`,
      body: `${atRisk14.length} member${atRisk14.length !== 1 ? "s" : ""} haven't visited in over 2 weeks. Automated re-engagement at this stage has the highest win-back rate.`,
      impact: "~30–40% re-engagement rate",
      trigger_id: "inactive_14",
      urgency: "high",
      icon: AlertTriangle,
    });
  }

  // Milestone members approaching 10th visit
  const near10 = (allMemberships || []).filter(m => {
    const count = ciCountByUser[m.user_id] || 0;
    return count >= 8 && count < 10;
  });
  if (near10.length > 0 && !existingTriggerIds.includes("visits_10")) {
    recs.push({
      id: "rec_milestone10",
      title: `${near10.length} member${near10.length !== 1 ? "s" : ""} near their 10th visit`,
      body: `${near10.length} member${near10.length !== 1 ? "s" : ""} are close to their 10th check-in. A celebratory message at this milestone dramatically boosts long-term retention.`,
      impact: "2× long-term retention",
      trigger_id: "visits_10",
      urgency: "medium",
      icon: Trophy,
    });
  }

  // Welcome message if not set up
  if (!existingTriggerIds.includes("new_member")) {
    const newLast30 = (allMemberships || []).filter(m => {
      const jt = joinMap[m.user_id];
      return jt && (now - jt) < 30 * MS_DAY;
    }).length;
    recs.push({
      id: "rec_welcome",
      title: "Add a day-1 welcome message",
      body: `${newLast30 > 0 ? `${newLast30} new member${newLast30 !== 1 ? "s" : ""} joined` : "New members"} in the last 30 days. A same-day welcome message is the single highest-ROI automation.`,
      impact: "+30% 2nd-visit rate",
      trigger_id: "new_member",
      urgency: "high",
      icon: UserPlus,
    });
  }

  return recs;
}

const TEMPLATE_PACKS = [
  { id:"tp1", label:"Win back inactive members", desc:"14-day + 30-day re-engagement", icon:RefreshCw, triggers:["inactive_14","inactive_30"] },
  { id:"tp2", label:"Welcome new members",       desc:"Day-1 welcome + return nudge",  icon:UserPlus,  triggers:["new_member","inactive_7"]   },
  { id:"tp3", label:"Celebrate milestones",      desc:"10th, 50th, 100th visit",       icon:Trophy,    triggers:["visits_10","visits_50"]      },
  { id:"tp4", label:"Streak recognition",        desc:"7-day and 30-day streaks",      icon:Flame,     triggers:["streak_7","streak_30"]       },
];

/* ─── URGENCY MAP ────────────────────────────────────────────── */
const urgency = {
  high:   { border: C.red,   text: C.red   },
  medium: { border: C.amber, text: C.amber },
  low:    { border: C.t3,    text: C.t3    },
};

/* ─── ACTIVITY TYPE MAP ──────────────────────────────────────── */
const typeMap = {
  triggered: { color: C.cyan,  bg: C.cyanDim,                  brd: C.cyanBrd,  label: "Triggered",    Icon: Zap         },
  sent:      { color: C.t2,    bg: "rgba(255,255,255,0.03)",    brd: C.brd,      label: "Message sent", Icon: Send        },
  returned:  { color: C.green, bg: C.greenDim,                  brd: C.greenBrd, label: "Returned 🎉",  Icon: CheckCircle },
};

/* ─── COUNT-UP HOOK ──────────────────────────────────────────── */
function useCountUp(target, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const dur = 900; let start = null;
      const step = ts => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return val;
}

/* ─── PRIMITIVES ─────────────────────────────────────────────── */
function Pill({ label, color = C.cyan }) {
  return (
    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}40`, letterSpacing: "0.03em" }}>
      {label}
    </span>
  );
}

function IconBox({ Icon, color = C.t3, size = 14, boxSize = 30 }) {
  return (
    <div style={{ width: boxSize, height: boxSize, borderRadius: 9, flexShrink: 0, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={size} color={color} />
    </div>
  );
}

function Btn({ children, onClick, variant = "ghost", style: extraStyle = {} }) {
  const base = { display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: FONT, transition: "all 0.15s" };
  const variants = {
    primary:   { background: C.cyan,  color: "#fff", border: "none", boxShadow: "0 0 16px rgba(77,127,255,0.25)" },
    secondary: { background: "rgba(255,255,255,0.04)", color: C.t2, border: `1px solid ${C.brd}` },
    ghost:     { background: "rgba(255,255,255,0.03)", color: C.t3, border: `1px solid ${C.brd}` },
    danger:    { background: C.redDim, color: C.red, border: `1px solid rgba(255,77,109,0.3)` },
    active:    { background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBrd}` },
    green:     { background: C.greenDim, color: C.green, border: `1px solid ${C.greenBrd}` },
  };
  return <button onClick={onClick} style={{ ...base, ...variants[variant], ...extraStyle }}>{children}</button>;
}

function TinyBar({ pct, color = C.cyan }) {
  return (
    <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.04)", flex: 1 }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: color, opacity: 0.8 }} />
    </div>
  );
}

/* ─── STAT CARD ──────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, prefix = "", delay = 0, highlight = false, isMobile }) {
  const counted = useCountUp(typeof value === "number" ? value : 0, delay);
  const display = typeof value === "number" ? `${prefix}${counted.toLocaleString()}` : value;
  return (
    <div style={{ ...cardStyle, padding: isMobile ? "12px 14px" : "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: isMobile ? 8 : 10 }}>
        <IconBox Icon={Icon} color={highlight ? C.cyan : C.t3} boxSize={isMobile ? 26 : 30} size={isMobile ? 12 : 14} />
        <ArrowUpRight size={11} color={C.t3} />
      </div>
      <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4, color: highlight ? C.cyan : C.t1 }}>
        {display}
      </div>
      <div style={{ fontSize: isMobile ? 12 : 11, fontWeight: 500, color: C.t2 }}>{label}</div>
      <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ─── FLOW DIAGRAM ───────────────────────────────────────────── */
function FlowDiagram({ rule, trig }) {
  const delayLabel = rule.delay_hours === 0 ? "immediately" : rule.delay_hours === 1 ? "after 1 hour" : `after ${rule.delay_hours} hrs`;
  const rate = rule.stats?.rate ?? 0;
  const rateColor = rate >= 40 ? C.green : rate > 0 ? C.amber : C.t3;

  const Step = ({ Icon, label, sub, color = C.t3 }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <IconBox Icon={Icon} color={color} boxSize={26} size={10} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 500, color: C.t1, lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: 9, color: C.t3, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <Step Icon={trig?.Icon || Zap} label={trig?.label || "Trigger"} sub="trigger" />
      <ChevronRight size={10} color={C.t3} />
      <Step Icon={MessageCircle} label="Send message" sub={delayLabel} />
      <ChevronRight size={10} color={C.t3} />
      <Step Icon={rate > 0 ? CheckCircle : Activity} label={rate > 0 ? `${rule.stats.returned} returned` : "No data yet"} sub={rate > 0 ? `${rate}% return rate` : "watching..."} color={rateColor} />
    </div>
  );
}

/* ─── INLINE RULE EDITOR ─────────────────────────────────────── */
function RuleEditor({ rule, gymName, onSave, onCancel }) {
  const [msg, setMsg] = useState(rule.message || TEMPLATES[rule.trigger_id]?.(gymName, "{name}") || "");
  const [delay, setDelay] = useState(rule.delay_hours || 0);
  const DELAYS = [{ v:0,label:"Immediately" },{ v:1,label:"1 hour" },{ v:3,label:"3 hours" },{ v:6,label:"6 hours" },{ v:24,label:"24 hours" }];

  return (
    <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.brd}`, background: C.inset }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
        Message — use &#123;name&#125; for member's first name
      </div>
      <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3} style={{
        width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, borderRadius: 9,
        padding: "8px 10px", color: C.t1, fontSize: 12, lineHeight: 1.65, resize: "vertical", outline: "none",
        fontFamily: FONT, marginBottom: 12,
      }} />
      <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Send timing</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
        {DELAYS.map(d => (
          <button key={d.v} onClick={() => setDelay(d.v)} style={{
            padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: FONT,
            background: delay === d.v ? C.cyanDim : "rgba(255,255,255,0.03)",
            border: `1px solid ${delay === d.v ? C.cyanBrd : C.brd}`,
            color: delay === d.v ? C.cyan : C.t2,
          }}>{d.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <Btn variant="primary" onClick={() => onSave({ message: msg, delay_hours: delay })} extraStyle={{ flex: 1, justifyContent: "center" }}>
          <CheckCircle size={11} /> Save changes
        </Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RULE CARD — desktop (original) + mobile (compact / expandable)
═══════════════════════════════════════════════════════════════ */
function RuleCard({ rule, gymName, onToggle, onEdit, onDelete, isMobile }) {
  const [open, setOpen]       = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const trig = TRIGGERS.find(t => t.id === rule.trigger_id);
  if (!trig) return null;

  const handleTest = () => { setTestSent(true); setTimeout(() => setTestSent(false), 2500); };
  const rate = rule.stats?.rate ?? 0;

  /* ── MOBILE LAYOUT ────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div style={{
        ...cardStyle,
        borderLeft: `2px solid ${rule.enabled ? C.cyan : C.brd}`,
        opacity: rule.enabled ? 1 : 0.72,
        transition: "opacity 0.2s",
      }}>
        {/* Compact tappable header */}
        <div
          role="button"
          onClick={() => setOpen(v => !v)}
          style={{
            padding: "14px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 60,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <IconBox Icon={trig.Icon} color={rule.enabled ? C.cyan : C.t3} boxSize={34} size={14} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>{trig.label}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: C.t3, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, borderRadius: 4, padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{trig.cat}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {rule.enabled ? (
                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: C.green }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, display: "inline-block" }} />
                  live
                </span>
              ) : (
                <span style={{ fontSize: 11, color: C.t3 }}>paused</span>
              )}
              {rule.stats?.sent > 0 && (
                <span style={{ fontSize: 11, color: C.t3 }}>
                  {rule.stats.sent} sent · <span style={{ color: rate >= 30 ? C.cyan : C.t3 }}>{rate}% back</span>
                </span>
              )}
            </div>
          </div>
          <ChevronDown
            size={15}
            color={C.t3}
            style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.22s ease" }}
          />
        </div>

        {/* Expanded content */}
        {open && (
          <div style={{ borderTop: `1px solid ${C.brd}`, animation: "fadeIn 0.18s ease" }}>

            {/* Message preview */}
            <div style={{ padding: "14px 14px 12px", borderBottom: `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 7 }}>Message</div>
              <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.65 }}>
                {(rule.message || "").replace("{name}", "member")}
              </div>
            </div>

            {/* Flow diagram */}
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.brd}` }}>
              <FlowDiagram rule={rule} trig={trig} />
            </div>

            {/* Stats row */}
            {rule.stats?.sent > 0 && (
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.brd}`, display: "flex", gap: 20, alignItems: "flex-end" }}>
                {[
                  { label: "Sent",        val: rule.stats.sent,          hl: false },
                  { label: "Returned",    val: rule.stats.returned,      hl: false },
                  { label: "Return rate", val: `${rule.stats.rate}%`,    hl: rate >= 30 },
                  rule.stats.saved > 0 && { label: "Revenue saved", val: `$${rule.stats.saved}`, hl: true },
                ].filter(Boolean).map((s, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1, color: s.hl ? C.cyan : C.t1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: C.t3, marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
                <TinyBar pct={rate} color={rate >= 40 ? C.green : C.amber} />
              </div>
            )}

            {/* Action grid — 4 equal tap targets */}
            <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
              {[
                {
                  label: testSent ? "Sent!" : "Test",
                  Icon: testSent ? CheckCircle : Send,
                  onClick: handleTest,
                  color: testSent ? C.green : C.t2,
                  bg: testSent ? C.greenDim : "rgba(255,255,255,0.03)",
                  brd: testSent ? C.greenBrd : C.brd,
                },
                {
                  label: editOpen ? "Close" : "Edit",
                  Icon: Edit3,
                  onClick: () => setEditOpen(v => !v),
                  color: editOpen ? C.cyan : C.t2,
                  bg: editOpen ? C.cyanDim : "rgba(255,255,255,0.03)",
                  brd: editOpen ? C.cyanBrd : C.brd,
                },
                {
                  label: rule.enabled ? "Pause" : "Enable",
                  Icon: rule.enabled ? ToggleRight : ToggleLeft,
                  onClick: onToggle,
                  color: rule.enabled ? C.green : C.t3,
                  bg: rule.enabled ? C.greenDim : "rgba(255,255,255,0.03)",
                  brd: rule.enabled ? C.greenBrd : C.brd,
                },
                {
                  label: "Delete",
                  Icon: Trash2,
                  onClick: onDelete,
                  color: C.red,
                  bg: C.redDim,
                  brd: "rgba(255,77,109,0.3)",
                },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.onClick}
                  style={{
                    minHeight: 52,
                    borderRadius: 9,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    cursor: "pointer",
                    border: `1px solid ${btn.brd}`,
                    background: btn.bg,
                    color: btn.color,
                    fontFamily: FONT,
                    WebkitTapHighlightColor: "transparent",
                    transition: "opacity 0.12s",
                  }}
                >
                  <btn.Icon size={14} />
                  <span style={{ fontSize: 10, fontWeight: 600 }}>{btn.label}</span>
                </button>
              ))}
            </div>

            {/* Inline editor */}
            {editOpen && (
              <RuleEditor
                rule={rule}
                gymName={gymName}
                onSave={u => { onEdit(u); setEditOpen(false); }}
                onCancel={() => setEditOpen(false)}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── DESKTOP LAYOUT (original, unchanged) ─────────────────── */
  return (
    <div style={{
      ...cardStyle, borderLeft: `2px solid ${rule.enabled ? C.cyan : C.brd}`,
      opacity: rule.enabled ? 1 : 0.6, transition: "opacity 0.2s",
    }}>
      <div style={{ padding: "14px 14px 14px 12px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <IconBox Icon={trig.Icon} color={rule.enabled ? C.t2 : C.t3} boxSize={34} size={14} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: rule.enabled ? C.t1 : C.t2 }}>{trig.label}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: C.t3, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, borderRadius: 4, padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{trig.cat}</span>
            {rule.enabled && (
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, display: "inline-block" }} />
                <span style={{ fontSize: 9, color: C.green }}>live</span>
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.t3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 10, lineHeight: 1.5 }}>
            {(rule.message || "").replace("{name}", "member")}
          </div>
          <FlowDiagram rule={rule} trig={trig} />
          {rule.stats?.sent > 0 && (
            <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.brd}`, alignItems: "center" }}>
              {[
                { label: "Sent",         val: rule.stats.sent,          hl: false },
                { label: "Returned",     val: rule.stats.returned,      hl: false },
                { label: "Return rate",  val: `${rule.stats.rate}%`,    hl: rule.stats.rate >= 30 },
                rule.stats.saved > 0 && { label: "Revenue saved", val: `$${rule.stats.saved}`, hl: true },
              ].filter(Boolean).map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: s.hl ? C.cyan : C.t2 }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: C.t3, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
              {rate > 0 && <TinyBar pct={rate} color={rate >= 40 ? C.green : C.amber} />}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          {[
            {
              label: testSent ? <><CheckCircle size={9} /> Sent</> : <><Send size={9} /> Test</>,
              onClick: handleTest,
              variant: testSent ? "green" : "ghost",
              wide: true,
            },
            { label: <Edit3 size={10} />,    onClick: () => setOpen(v => !v), variant: open ? "active" : "ghost" },
            { label: rule.enabled ? <ToggleRight size={12} /> : <ToggleLeft size={12} />, onClick: onToggle, variant: rule.enabled ? "green" : "ghost" },
            { label: <Trash2 size={10} />,  onClick: onDelete, variant: "ghost", danger: true },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick} style={{
              height: 26, ...(btn.wide ? { padding: "0 8px" } : { width: 26 }),
              borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
              cursor: "pointer", fontSize: 9.5, fontWeight: 600, fontFamily: FONT,
              border: `1px solid ${btn.variant === "active" ? C.cyanBrd : btn.variant === "green" ? C.greenBrd : C.brd}`,
              background: btn.variant === "active" ? C.cyanDim : btn.variant === "green" ? C.greenDim : "rgba(255,255,255,0.03)",
              color: btn.variant === "active" ? C.cyan : btn.variant === "green" ? C.green : C.t3,
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { if (btn.danger) { e.currentTarget.style.background = C.redDim; e.currentTarget.style.borderColor = "rgba(255,77,109,0.3)"; e.currentTarget.style.color = C.red; }}}
              onMouseLeave={e => { if (btn.danger) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; }}}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
      {open && <RuleEditor rule={rule} gymName={gymName} onSave={u => { onEdit(u); setOpen(false); }} onCancel={() => setOpen(false)} />}
    </div>
  );
}

/* ─── AI RECOMMENDATIONS ─────────────────────────────────────── */
function Recommendations({ recs, existingIds, onAdd }) {
  const available = recs.filter(r => !existingIds.includes(r.trigger_id));
  if (!available.length) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: "uppercase", letterSpacing: "0.1em" }}>Suggested for your gym</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.cyan, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, padding: "1px 7px", borderRadius: 20 }}>AI</span>
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {available.map(rec => {
          const Icon = rec.icon;
          const u = urgency[rec.urgency];
          return (
            <div key={rec.id} style={{ ...cardStyle, minWidth: 240, flexShrink: 0, padding: "14px 16px", borderLeft: `2px solid ${u.border}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <IconBox Icon={Icon} color={u.text} boxSize={26} size={11} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: C.t1, lineHeight: 1.3 }}>{rec.title}</div>
              </div>
              <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5, marginBottom: 10 }}>{rec.body}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>{rec.impact}</span>
                <Btn variant="primary" onClick={() => onAdd(rec)}><Plus size={9} /> Create</Btn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── LIVE ACTIVITY FEED ─────────────────────────────────────── */
function ActivityFeed({ events, isMobile }) {
  const feedRef    = useRef(null);
  const prevLen    = useRef(events.length);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (events.length > prevLen.current && feedRef.current) feedRef.current.scrollTop = 0;
    prevLen.current = events.length;
  }, [events.length]);

  const displayed = isMobile && !showAll ? events.slice(0, 5) : events;

  return (
    <div style={cardStyle}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Live activity</span>
        </div>
        <span style={{ fontSize: 10, color: C.t3 }}>{events.length} events</span>
      </div>
      <div ref={feedRef} style={{ maxHeight: isMobile ? "none" : 520, overflowY: isMobile ? "visible" : "auto" }}>
        {displayed.map((ev, i) => {
          const cfg = typeMap[ev.type] || typeMap.sent;
          const Ic = cfg.Icon;
          return (
            <div key={ev.id} style={{
              padding: isMobile ? "11px 14px" : "9px 14px",
              borderBottom: i < displayed.length - 1 ? `1px solid ${C.brd}` : "none",
              background: ev.isNew ? C.cyanDim : "transparent",
              animation: ev.isNew ? "slideDown 0.3s ease" : "none",
            }}>
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <div style={{ width: isMobile ? 26 : 22, height: isMobile ? 26 : 22, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, background: cfg.bg, border: `1px solid ${cfg.brd}` }}>
                  <Ic size={isMobile ? 11 : 9} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? 13 : 11, color: C.t1, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600 }}>{ev.member}</span>
                    <span style={{ color: C.t3 }}>
                      {ev.type === "returned" ? " returned after automation" : ev.type === "triggered" ? ` — ${ev.rule} triggered` : " — message sent"}
                    </span>
                  </div>
                  <div style={{ fontSize: isMobile ? 11 : 9, color: C.t3, marginTop: 2 }}>{ev.ago}</div>
                </div>
                {ev.type === "returned" && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.green, background: C.greenDim, border: `1px solid ${C.greenBrd}`, borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>win</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {isMobile && events.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            width: "100%", padding: "12px", background: "transparent",
            border: "none", borderTop: `1px solid ${C.brd}`,
            color: C.t3, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
          }}
        >
          {showAll ? "Show less" : `Show ${events.length - 5} more events`}
        </button>
      )}
    </div>
  );
}

/* ─── TEMPLATE PACKS ─────────────────────────────────────────── */
function TemplatePacks({ existingIds, onAddPack }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Quick-start templates</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {TEMPLATE_PACKS.map(tp => {
          const Icon = tp.icon;
          const allAdded = tp.triggers.every(id => existingIds.includes(id));
          return (
            <div key={tp.id} style={{ ...cardStyle, minWidth: 195, flexShrink: 0, padding: "13px 14px", opacity: allAdded ? 0.5 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <Icon size={12} color={C.t3} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{tp.label}</span>
              </div>
              <div style={{ fontSize: 10, color: C.t3, marginBottom: 10, lineHeight: 1.5 }}>{tp.desc}</div>
              <Btn variant="ghost" onClick={() => !allAdded && onAddPack(tp)} style={{ width: "100%", justifyContent: "center" }}>
                {allAdded ? "Already added" : <><Plus size={9} /> Add pack</>}
              </Btn>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADD RULE PANEL — desktop (original, inline)
═══════════════════════════════════════════════════════════════ */
function AddRulePanel({ gymName, existingIds, onAdd, onClose }) {
  const [cat, setCat]      = useState("All");
  const [selected, setSel] = useState(null);
  const [msg, setMsg]      = useState("");
  const [delay, setDelay]  = useState(0);
  const CATS   = ["All", "Retention", "Onboarding", "Milestones", "Engagement"];
  const DELAYS = [{ v:0,label:"Immediately" },{ v:1,label:"1 hr" },{ v:3,label:"3 hrs" },{ v:6,label:"6 hrs" },{ v:24,label:"24 hrs" }];
  const available = TRIGGERS.filter(t => (cat === "All" || t.cat === cat) && !existingIds.includes(t.id));
  const pick = t => { setSel(t); setMsg(TEMPLATES[t.id]?.(gymName, "{name}") || ""); };

  return (
    <div style={{ ...cardStyle, marginBottom: 14 }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>New automation rule</div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Choose a trigger, write a message, set timing.</div>
        </div>
        <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.t3 }}>
          <X size={11} />
        </button>
      </div>
      <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 18 }}>
        <div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                background: cat === c ? C.cyanDim : "rgba(255,255,255,0.03)",
                border: `1px solid ${cat === c ? C.cyanBrd : C.brd}`,
                color: cat === c ? C.cyan : C.t2,
              }}>{c}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {available.map(t => {
              const isSel = selected?.id === t.id;
              return (
                <button key={t.id} onClick={() => pick(t)} style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 10,
                  cursor: "pointer", textAlign: "left", fontFamily: FONT,
                  background: isSel ? C.cyanDim : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isSel ? C.cyanBrd : C.brd}`,
                }}>
                  <IconBox Icon={t.Icon} color={isSel ? C.cyan : C.t3} boxSize={26} size={11} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isSel ? C.t1 : C.t2 }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: C.t3 }}>{t.desc}</div>
                  </div>
                  {isSel && <ChevronRight size={11} color={C.cyan} />}
                </button>
              );
            })}
            {available.length === 0 && <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: C.t3 }}>All triggers in this category are active.</div>}
          </div>
        </div>
        {selected && (
          <div>
            <div style={{ padding: "8px 12px", borderRadius: 9, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <selected.Icon size={12} color={C.cyan} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{selected.label}</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Message</div>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} style={{
              width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, borderRadius: 9,
              padding: "8px 10px", color: C.t1, fontSize: 11.5, lineHeight: 1.65, resize: "vertical", outline: "none", fontFamily: FONT, marginBottom: 12,
            }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Send timing</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
              {DELAYS.map(d => (
                <button key={d.v} onClick={() => setDelay(d.v)} style={{
                  padding: "4px 9px", borderRadius: 6, fontSize: 10.5, fontWeight: 500, cursor: "pointer", fontFamily: FONT,
                  background: delay === d.v ? C.cyanDim : "rgba(255,255,255,0.03)",
                  border: `1px solid ${delay === d.v ? C.cyanBrd : C.brd}`,
                  color: delay === d.v ? C.cyan : C.t2,
                }}>{d.label}</button>
              ))}
            </div>
            <Btn variant="primary" onClick={() => { if (msg.trim()) { onAdd({ trigger_id: selected.id, message: msg.trim(), delay_hours: delay, enabled: true, stats: { sent:0,returned:0,rate:0,saved:0 } }); onClose(); }}} style={{ width: "100%", justifyContent: "center", opacity: msg.trim() ? 1 : 0.5 }}>
              <Plus size={11} /> Add rule
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE ADD RULE DRAWER — step-based full-screen drawer
═══════════════════════════════════════════════════════════════ */
function MobileAddDrawer({ gymName, existingIds, onAdd, onClose }) {
  const [step, setStep]    = useState(1);
  const [cat, setCat]      = useState("All");
  const [selected, setSel] = useState(null);
  const [msg, setMsg]      = useState("");
  const [delay, setDelay]  = useState(0);

  const CATS   = ["All", "Retention", "Onboarding", "Milestones", "Engagement"];
  const DELAYS = [
    { v:0,  label:"Immediately",  desc:"Message goes out right away"    },
    { v:1,  label:"After 1 hour", desc:"Brief delay before sending"     },
    { v:3,  label:"After 3 hours",desc:"A few hours window"             },
    { v:6,  label:"After 6 hours",desc:"Half-day delay"                 },
    { v:24, label:"After 24 hrs", desc:"Next-day send"                  },
  ];
  const available = TRIGGERS.filter(t => (cat === "All" || t.cat === cat) && !existingIds.includes(t.id));

  const pick = t => { setSel(t); setMsg(TEMPLATES[t.id]?.(gymName, "{name}") || ""); };

  const canAdvance = step === 1 ? !!selected : step === 2 ? msg.trim().length > 0 : true;

  const handleAdd = () => {
    if (!selected || !msg.trim()) return;
    onAdd({ trigger_id: selected.id, message: msg.trim(), delay_hours: delay, enabled: true, stats: { sent:0,returned:0,rate:0,saved:0 } });
  };

  const STEP_LABELS = ["Select trigger", "Write message", "Choose timing"];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.72)",
      display: "flex", flexDirection: "column", justifyContent: "flex-end",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{ position: "absolute", inset: 0 }} onClick={onClose} />

      <div style={{
        position: "relative",
        background: C.card,
        borderRadius: "20px 20px 0 0",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        animation: "slideUp 0.28s cubic-bezier(0.32,0.72,0,1)",
        boxShadow: "0 -20px 60px rgba(0,0,0,0.6)",
      }}>

        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.brd2 }} />
        </div>

        <div style={{ padding: "10px 18px 14px", borderBottom: `1px solid ${C.brd}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.t1 }}>New automation</div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.t2 }}>
              <X size={14} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, flex: s < 3 ? 1 : "none" }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700,
                  background: step > s ? C.cyan : step === s ? C.cyanDim : "rgba(255,255,255,0.04)",
                  border: `1px solid ${step >= s ? C.cyanBrd : C.brd}`,
                  color: step > s ? "#fff" : step === s ? C.cyan : C.t3,
                  transition: "all 0.2s",
                }}>
                  {step > s ? <CheckCircle size={10} /> : s}
                </div>
                <span style={{ fontSize: 11, fontWeight: step === s ? 600 : 400, color: step === s ? C.t1 : C.t3, display: step < 3 ? "block" : "none" }}>
                  {STEP_LABELS[s - 1]}
                </span>
                {s < 3 && <div style={{ flex: 1, height: 1, background: step > s ? C.cyanBrd : C.brd, transition: "background 0.2s" }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 4px", WebkitOverflowScrolling: "touch" }}>

          {step === 1 && (
            <div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => setCat(c)} style={{
                    padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                    background: cat === c ? C.cyanDim : "rgba(255,255,255,0.03)",
                    border: `1px solid ${cat === c ? C.cyanBrd : C.brd}`,
                    color: cat === c ? C.cyan : C.t2,
                  }}>{c}</button>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {available.map(t => {
                  const isSel = selected?.id === t.id;
                  return (
                    <button key={t.id} onClick={() => pick(t)} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 12,
                      cursor: "pointer", textAlign: "left", fontFamily: FONT, minHeight: 60,
                      background: isSel ? C.cyanDim : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isSel ? C.cyanBrd : C.brd}`,
                      transition: "background 0.15s, border-color 0.15s",
                      WebkitTapHighlightColor: "transparent",
                    }}>
                      <IconBox Icon={t.Icon} color={isSel ? C.cyan : C.t3} boxSize={34} size={14} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: isSel ? C.t1 : C.t2, marginBottom: 2 }}>{t.label}</div>
                        <div style={{ fontSize: 12, color: C.t3 }}>{t.desc}</div>
                      </div>
                      {isSel && (
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <CheckCircle size={11} color="#fff" />
                        </div>
                      )}
                    </button>
                  );
                })}
                {available.length === 0 && (
                  <div style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: C.t3 }}>
                    All triggers in this category are active.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && selected && (
            <div>
              <div style={{ padding: "10px 13px", borderRadius: 10, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, marginBottom: 18, display: "flex", alignItems: "center", gap: 9 }}>
                <selected.Icon size={14} color={C.cyan} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{selected.label}</div>
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>{selected.desc}</div>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>
                Message — use &#123;name&#125; for member's first name
              </div>
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value)}
                rows={5}
                placeholder="Write your message here..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${msg.trim() ? C.cyanBrd : C.brd}`,
                  borderRadius: 12, padding: "12px 14px", color: C.t1,
                  fontSize: 14, lineHeight: 1.65, resize: "vertical", outline: "none",
                  fontFamily: FONT, transition: "border-color 0.2s",
                }}
                autoFocus
              />
              <div style={{ fontSize: 11, color: C.t3, marginTop: 6 }}>
                {msg.trim().length > 0 ? `${msg.length} characters` : "Preview: uses member's first name automatically"}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, marginBottom: 18 }}>
                When should we send this message after the trigger fires?
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DELAYS.map(d => (
                  <button key={d.v} onClick={() => setDelay(d.v)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px", borderRadius: 12, cursor: "pointer", fontFamily: FONT,
                    minHeight: 58, textAlign: "left",
                    background: delay === d.v ? C.cyanDim : "rgba(255,255,255,0.03)",
                    border: `1px solid ${delay === d.v ? C.cyanBrd : C.brd}`,
                    transition: "background 0.15s, border-color 0.15s",
                    WebkitTapHighlightColor: "transparent",
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: delay === d.v ? C.t1 : C.t2, marginBottom: 2 }}>{d.label}</div>
                      <div style={{ fontSize: 11, color: C.t3 }}>{d.desc}</div>
                    </div>
                    {delay === d.v && (
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckCircle size={11} color="#fff" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.brd}`, background: C.card, display: "flex", gap: 10 }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} style={{
              height: 50, padding: "0 20px", borderRadius: 12, cursor: "pointer", fontFamily: FONT,
              background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`,
              color: C.t2, fontSize: 14, fontWeight: 600,
            }}>Back</button>
          ) : (
            <button onClick={onClose} style={{
              height: 50, padding: "0 20px", borderRadius: 12, cursor: "pointer", fontFamily: FONT,
              background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`,
              color: C.t2, fontSize: 14, fontWeight: 600,
            }}>Cancel</button>
          )}
          {step < 3 ? (
            <button
              onClick={() => canAdvance && setStep(s => s + 1)}
              style={{
                flex: 1, height: 50, borderRadius: 12, cursor: canAdvance ? "pointer" : "default",
                background: canAdvance ? C.cyan : "rgba(77,127,255,0.15)",
                border: "none", color: canAdvance ? "#fff" : "rgba(77,127,255,0.4)",
                fontSize: 15, fontWeight: 700, fontFamily: FONT,
                boxShadow: canAdvance ? "0 0 20px rgba(77,127,255,0.3)" : "none",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleAdd}
              style={{
                flex: 1, height: 50, borderRadius: 12, cursor: "pointer",
                background: C.cyan, border: "none",
                color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: FONT,
                boxShadow: "0 0 20px rgba(77,127,255,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Plus size={16} /> Add rule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function TabEngagement({ selectedGym, allMemberships = [], checkIns = [], totalMembers = 0 }) {
  const gymName = selectedGym?.name || "Your Gym";
  const gymId   = selectedGym?.id;

  // ── Seed initial rules with real computed stats ──────────────
  const initialRules = useMemo(() => {
    if (!gymId) return [];
    const defaultTriggers = ["inactive_14", "new_member", "streak_7"];
    return defaultTriggers.map((tid, i) => {
      const stats = computeRuleStats(tid, checkIns, allMemberships, gymId);
      return {
        id: `default_${tid}`,
        trigger_id: tid,
        message: TEMPLATES[tid]?.(gymName, "{name}") || "",
        delay_hours: tid === "inactive_14" ? 1 : 0,
        enabled: true,
        stats,
      };
    });
  }, [gymId, gymName]); // only recompute when gym changes

  const [rules, setRules]       = useState([]);
  const [showAdd, setShowAdd]   = useState(false);
  const [activity, setActivity] = useState([]);

  // Initialise rules with real data once gym loads
  useEffect(() => {
    if (gymId && rules.length === 0) setRules(initialRules);
  }, [gymId, initialRules]);

  // Build real activity feed from check-ins
  useEffect(() => {
    if (gymId) setActivity(buildActivityFeed(checkIns, allMemberships, gymId));
  }, [checkIns, allMemberships, gymId]);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const addRule    = useCallback(r => setRules(prev => [...prev, { ...r, id: `r_${Date.now()}` }]), []);
  const toggleRule = useCallback(id => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)), []);
  const editRule   = useCallback((id, upd) => setRules(prev => prev.map(r => r.id === id ? { ...r, ...upd } : r)), []);
  const deleteRule = useCallback(id => setRules(prev => prev.filter(r => r.id !== id)), []);

  const enabled     = rules.filter(r => r.enabled);
  const paused      = rules.filter(r => !r.enabled);
  const existingIds = rules.map(r => r.trigger_id);

  // Real KPI totals derived from rule stats (computed from real data)
  const totalSent  = rules.reduce((s, r) => s + (r.stats?.sent ?? 0), 0);
  const totalRet   = rules.reduce((s, r) => s + (r.stats?.returned ?? 0), 0);
  const totalSaved = rules.reduce((s, r) => s + (r.stats?.saved ?? 0), 0);

  // Churn prevented: members who were at-risk (14+ days inactive) but returned
  const churnPrev = useMemo(() => {
    if (!gymId) return 0;
    const now = Date.now();
    const MS_DAY = 86400000;
    const lastCiByUser = {};
    (checkIns || []).forEach(c => {
      if (c.gym_id !== gymId) return;
      const t = new Date(c.check_in_date || c.created_date).getTime();
      if (!lastCiByUser[c.user_id]) lastCiByUser[c.user_id] = [];
      lastCiByUser[c.user_id].push(t);
    });
    let count = 0;
    Object.values(lastCiByUser).forEach(cis => {
      const sorted = [...cis].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i] - sorted[i - 1];
        if (gap > 14 * MS_DAY) { count++; break; }
      }
    });
    return count;
  }, [checkIns, gymId]);

  // Dynamic recommendations from real data
  const recommendations = useMemo(
    () => buildRecommendations(checkIns, allMemberships, gymId, existingIds),
    [checkIns, allMemberships, gymId, existingIds.join(",")]
  );

  const addFromRec = useCallback(rec => {
    addRule({ trigger_id: rec.trigger_id, message: TEMPLATES[rec.trigger_id]?.(gymName, "{name}") || "", delay_hours: 0, enabled: true, stats: computeRuleStats(rec.trigger_id, checkIns, allMemberships, gymId) });
  }, [addRule, gymName, checkIns, allMemberships, gymId]);

  const addPack = useCallback(pack => {
    pack.triggers.filter(id => !existingIds.includes(id)).forEach(id => {
      addRule({ trigger_id: id, message: TEMPLATES[id]?.(gymName, "{name}") || "", delay_hours: id.startsWith("inactive") ? 1 : 0, enabled: true, stats: computeRuleStats(id, checkIns, allMemberships, gymId) });
    });
  }, [addRule, existingIds, gymName, checkIns, allMemberships, gymId]);

  const hPad = isMobile ? "12px 16px" : "16px 20px";

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100%", color: C.t1, fontSize: 13, lineHeight: 1.5 }}>
      <style>{`
        @keyframes slideDown  { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp    { from { opacity:0; transform:translateY(60px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn     { from { opacity:0 } to { opacity:1 } }
      `}</style>

      {isMobile && showAdd && (
        <MobileAddDrawer
          gymName={gymName}
          existingIds={existingIds}
          onAdd={r => { addRule(r); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: isMobile ? "14px 0 80px" : "16px 20px 60px" }}>

        {/* ── Page header ─────────────────────────────────────── */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "flex-start",
          justifyContent: "space-between",
          marginBottom: isMobile ? 18 : 16,
          gap: 12,
          padding: isMobile ? hPad : 0,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={13} color={C.cyan} />
              </div>
              <h2 style={{ fontSize: isMobile ? 18 : 19, fontWeight: 700, color: C.t1, margin: 0, letterSpacing: "-0.02em" }}>Automated engagement</h2>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenDim, border: `1px solid ${C.greenBrd}`, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, display: "inline-block" }} />
                {enabled.length} running
              </span>
            </div>
            <p style={{ fontSize: isMobile ? 13 : 12, color: C.t2, margin: 0, lineHeight: 1.6 }}>
              Your gym is running itself. Messages go out automatically — no manual work required.
            </p>
          </div>

          {!isMobile && (
            <Btn variant={showAdd ? "ghost" : "primary"} onClick={() => setShowAdd(v => !v)}>
              {showAdd ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Add rule</>}
            </Btn>
          )}
        </div>

        {/* ── KPI row ─────────────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)",
          gap: isMobile ? 8 : 10,
          marginBottom: isMobile ? 18 : 14,
          padding: isMobile ? "0 16px" : 0,
        }}>
          <StatCard icon={Send}       label="Messages sent"      sub="automatically this month" value={totalSent}  delay={0}   isMobile={isMobile} />
          <StatCard icon={Activity}   label="Re-engaged"         sub="returned after a message"  value={totalRet}  delay={120} isMobile={isMobile} />
          <StatCard icon={DollarSign} label="Revenue retained"   sub="from re-engaged members"  value={totalSaved} delay={240} prefix="$" highlight isMobile={isMobile} />
          <StatCard icon={Bell}       label="Churn prevented"    sub="estimated cancellations"   value={churnPrev} delay={360} isMobile={isMobile} />
        </div>

        {/* ── AI recs ─────────────────────────────────────────── */}
        <div style={{ padding: isMobile ? "0 16px" : 0, marginBottom: isMobile ? 20 : 0 }}>
          <Recommendations recs={recommendations} existingIds={existingIds} onAdd={addFromRec} />
        </div>

        {/* ── Desktop: inline add panel ───────────────────────── */}
        {!isMobile && showAdd && (
          <AddRulePanel gymName={gymName} existingIds={existingIds} onAdd={r => { addRule(r); setShowAdd(false); }} onClose={() => setShowAdd(false)} />
        )}

        {/* ── Main content area ───────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 280px",
          gap: 14,
          alignItems: "start",
          padding: isMobile ? "0 16px" : 0,
        }}>
          {/* Rules column */}
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 20 : 14 }}>

            {/* Active automations */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 12 : 10 }}>
                <span style={{ fontSize: isMobile ? 12 : 11, fontWeight: 600, color: C.t2, textTransform: "uppercase", letterSpacing: "0.1em" }}>Active automations</span>
                <span style={{ fontSize: 11, color: C.t3 }}>{enabled.length} of {rules.length}</span>
              </div>
              {enabled.length === 0 ? (
                <div style={{ ...cardStyle, padding: "36px 24px", textAlign: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                    <Zap size={16} color={C.cyan} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 4 }}>No active automations</div>
                  <div style={{ fontSize: 11, color: C.t3, marginBottom: 14 }}>Add your first rule to start running on autopilot.</div>
                  <Btn variant="primary" onClick={() => setShowAdd(true)}><Plus size={11} /> Add rule</Btn>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 8 : 8 }}>
                  {enabled.map(rule => (
                    <RuleCard key={rule.id} rule={rule} gymName={gymName} isMobile={isMobile}
                      onToggle={() => toggleRule(rule.id)}
                      onEdit={u => editRule(rule.id, u)}
                      onDelete={() => deleteRule(rule.id)} />
                  ))}
                </div>
              )}
            </div>

            {/* Paused rules */}
            {paused.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: isMobile ? 12 : 10 }}>
                  <span style={{ fontSize: isMobile ? 12 : 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em" }}>Paused</span>
                  <span style={{ fontSize: 9, color: C.t3 }}>{paused.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {paused.map(rule => (
                    <RuleCard key={rule.id} rule={rule} gymName={gymName} isMobile={isMobile}
                      onToggle={() => toggleRule(rule.id)}
                      onEdit={u => editRule(rule.id, u)}
                      onDelete={() => deleteRule(rule.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Template packs */}
            <div style={{ borderTop: `1px solid ${C.brd}`, paddingTop: isMobile ? 20 : 18 }}>
              <TemplatePacks existingIds={existingIds} onAddPack={addPack} />
            </div>

            {/* Activity feed — mobile only */}
            {isMobile && (
              <div style={{ borderTop: `1px solid ${C.brd}`, paddingTop: 20 }}>
                <ActivityFeed events={activity} isMobile={isMobile} />
              </div>
            )}
          </div>

          {/* Activity feed — desktop only */}
          {!isMobile && (
            <div style={{ position: "sticky", top: 16 }}>
              <ActivityFeed events={activity} isMobile={false} />
            </div>
          )}
        </div>

        {/* ── Mobile sticky Add Rule FAB ───────────────────────── */}
        {isMobile && (
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            padding: "12px 16px",
            background: `linear-gradient(to top, ${C.bg} 70%, transparent)`,
            zIndex: 50,
          }}>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                width: "100%", height: 52, borderRadius: 14,
                background: C.cyan, border: "none",
                color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: FONT,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 0 30px rgba(77,127,255,0.4), 0 4px 20px rgba(0,0,0,0.5)",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <Plus size={18} /> Add automation rule
            </button>
          </div>
        )}

      </div>
    </div>
  );
}