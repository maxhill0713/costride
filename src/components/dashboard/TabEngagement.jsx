/**
 * TabEngagement — Forge Fitness design system
 * No sidebar / topbar — those are injected by the shell.
 */

import { useState, useEffect, useRef, useCallback } from "react";
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
  cyan:     "#00e5c8",
  cyanDim:  "rgba(0,229,200,0.1)",
  cyanBrd:  "rgba(0,229,200,0.25)",
  red:      "#ff4d6d",
  redDim:   "rgba(255,77,109,0.15)",
  amber:    "#f59e0b",
  amberDim: "rgba(245,158,11,0.15)",
  green:    "#22c55e",
  greenDim: "rgba(34,197,94,0.10)",
  greenBrd: "rgba(34,197,94,0.22)",
};

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

/* ─── CARD STYLE ─────────────────────────────────────────────── */
const cardStyle = {
  background: C.card,
  border: `1px solid ${C.brd}`,
  borderRadius: 12,
  overflow: "hidden",
};

/* ─── TRIGGER CATALOGUE ──────────────────────────────────────── */
const TRIGGERS = [
  { id:"inactive_7",   Icon:Clock,         cat:"Retention",  label:"Inactive 7 days",    desc:"No visit for 7 days"            },
  { id:"inactive_14",  Icon:AlertTriangle, cat:"Retention",  label:"Inactive 14 days",   desc:"No visit for 14 days"           },
  { id:"inactive_30",  Icon:AlertTriangle, cat:"Retention",  label:"Inactive 30 days",   desc:"No visit for 30 days"           },
  { id:"freq_drop",    Icon:TrendingUp,    cat:"Retention",  label:"Frequency drop",     desc:"Visits 50% less than usual"     },
  { id:"new_member",   Icon:UserPlus,      cat:"Onboarding", label:"New member joined",  desc:"Member joins for the first time"},
  { id:"first_return", Icon:CheckCircle,   cat:"Onboarding", label:"First return visit", desc:"Member returns for 2nd visit"   },
  { id:"streak_7",     Icon:Flame,         cat:"Milestones", label:"7-day streak",       desc:"7 consecutive days"             },
  { id:"streak_30",    Icon:Flame,         cat:"Milestones", label:"30-day streak",      desc:"30 consecutive days"            },
  { id:"visits_10",    Icon:Star,          cat:"Milestones", label:"10th visit",         desc:"Member's 10th check-in"         },
  { id:"visits_50",    Icon:Trophy,        cat:"Milestones", label:"50th visit",         desc:"Member's 50th check-in"         },
  { id:"visits_100",   Icon:Trophy,        cat:"Milestones", label:"100th visit",        desc:"Member's 100th check-in"        },
  { id:"birthday",     Icon:Gift,          cat:"Engagement", label:"Birthday",           desc:"It's a member's birthday"       },
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

/* ─── MOCK DATA ──────────────────────────────────────────────── */
const MOCK_GYM = "Apex Fitness";

const MOCK_RULES = [
  { id:"r1", trigger_id:"inactive_14", message:TEMPLATES.inactive_14(MOCK_GYM,"{name}"), delay_hours:1,  enabled:true,  stats:{sent:24,returned:8, rate:33,saved:480} },
  { id:"r2", trigger_id:"new_member",  message:TEMPLATES.new_member(MOCK_GYM,"{name}"),  delay_hours:0,  enabled:true,  stats:{sent:31,returned:19,rate:61,saved:340} },
  { id:"r3", trigger_id:"streak_7",    message:TEMPLATES.streak_7(MOCK_GYM,"{name}"),    delay_hours:0,  enabled:true,  stats:{sent:12,returned:0, rate:0, saved:0  } },
  { id:"r4", trigger_id:"inactive_30", message:TEMPLATES.inactive_30(MOCK_GYM,"{name}"), delay_hours:6,  enabled:false, stats:{sent:7, returned:2, rate:29,saved:120} },
  { id:"r5", trigger_id:"visits_10",   message:TEMPLATES.visits_10(MOCK_GYM,"{name}"),   delay_hours:0,  enabled:false, stats:{sent:9, returned:0, rate:0, saved:0  } },
];

const MOCK_ACTIVITY = [
  { id:1,  type:"returned",  rule:"Inactive 14 days",  member:"Priya Sharma",    ago:"4 min ago",  isNew:true  },
  { id:2,  type:"triggered", rule:"7-day streak",       member:"Chloe Nakamura", ago:"11 min ago", isNew:false },
  { id:3,  type:"sent",      rule:"Inactive 14 days",   member:"Marcus Webb",    ago:"23 min ago", isNew:false },
  { id:4,  type:"triggered", rule:"New member joined",  member:"Sam Rivera",     ago:"1 hr ago",   isNew:false },
  { id:5,  type:"returned",  rule:"Inactive 30 days",   member:"Devon Osei",     ago:"1 hr ago",   isNew:false },
  { id:6,  type:"sent",      rule:"New member joined",  member:"Tyler Rhodes",   ago:"2 hrs ago",  isNew:false },
  { id:7,  type:"triggered", rule:"Inactive 7 days",    member:"Jamie Collins",  ago:"3 hrs ago",  isNew:false },
  { id:8,  type:"returned",  rule:"Inactive 14 days",   member:"Alex Turner",    ago:"Yesterday",  isNew:false },
  { id:9,  type:"triggered", rule:"Birthday",           member:"Jordan Kim",     ago:"Yesterday",  isNew:false },
  { id:10, type:"sent",      rule:"50th visit",         member:"Anya Petrov",    ago:"Yesterday",  isNew:false },
];

const LIVE_EVENTS = [
  { type:"triggered", rule:"Inactive 14 days",  member:"Chris Park"   },
  { type:"returned",  rule:"New member joined",  member:"Sam Rivera"   },
  { type:"sent",      rule:"7-day streak",       member:"Mei Zhang"    },
  { type:"triggered", rule:"Inactive 7 days",    member:"Sofia Reyes"  },
  { type:"returned",  rule:"Inactive 14 days",   member:"James Okafor" },
];

const RECOMMENDATIONS = [
  { id:"rec1", title:"Add a day-1 welcome message",      body:"Members who receive a same-day welcome are 30% more likely to return in week 1.", impact:"+30% 2nd-visit rate",   trigger_id:"new_member",  urgency:"high",   icon:UserPlus    },
  { id:"rec2", title:"Catch members going quiet in week 1", body:"3 members in their first 2 weeks haven't been back. A habit-nudge on day 5 helps.", impact:"+22% week-1 retention", trigger_id:"inactive_7",  urgency:"medium", icon:AlertTriangle },
  { id:"rec3", title:"Celebrate your milestone members",  body:"2 members are approaching their 50th visit. Recognition converts to referrals.",     impact:"3× referral rate",      trigger_id:"visits_50",   urgency:"low",    icon:Trophy      },
];

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
  triggered: { color: C.cyan,  bg: C.cyanDim,  brd: C.cyanBrd,            label: "Triggered",    Icon: Zap         },
  sent:      { color: C.t2,    bg: "rgba(255,255,255,0.03)", brd: C.brd,   label: "Message sent", Icon: Send        },
  returned:  { color: C.green, bg: C.greenDim, brd: C.greenBrd,            label: "Returned 🎉",  Icon: CheckCircle },
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
    primary:   { background: C.cyan,  color: "#000", border: "none", boxShadow: "0 0 16px rgba(0,229,200,0.25)" },
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
function StatCard({ icon: Icon, label, value, sub, prefix = "", delay = 0, highlight = false }) {
  const counted = useCountUp(typeof value === "number" ? value : 0, delay);
  const display = typeof value === "number" ? `${prefix}${counted.toLocaleString()}` : value;
  return (
    <div style={{ ...cardStyle, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <IconBox Icon={Icon} color={highlight ? C.cyan : C.t3} />
        <ArrowUpRight size={11} color={C.t3} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4, color: highlight ? C.cyan : C.t1 }}>
        {display}
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: C.t2 }}>{label}</div>
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

/* ─── RULE CARD ──────────────────────────────────────────────── */
function RuleCard({ rule, gymName, onToggle, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const trig = TRIGGERS.find(t => t.id === rule.trigger_id);
  if (!trig) return null;

  const handleTest = () => { setTestSent(true); setTimeout(() => setTestSent(false), 2500); };
  const rate = rule.stats?.rate ?? 0;

  return (
    <div style={{
      ...cardStyle, borderLeft: `2px solid ${rule.enabled ? C.cyan : C.brd}`,
      opacity: rule.enabled ? 1 : 0.6, transition: "opacity 0.2s",
    }}>
      <div style={{ padding: "14px 14px 14px 12px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Icon */}
        <IconBox Icon={trig.Icon} color={rule.enabled ? C.t2 : C.t3} boxSize={34} size={14} />

        {/* Content */}
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

        {/* Action column */}
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
                <Btn variant="primary" onClick={() => onAdd(rec)}>
                  <Plus size={9} /> Create
                </Btn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── LIVE ACTIVITY FEED ─────────────────────────────────────── */
function ActivityFeed({ events }) {
  const feedRef = useRef(null);
  const prevLen = useRef(events.length);
  useEffect(() => {
    if (events.length > prevLen.current && feedRef.current) feedRef.current.scrollTop = 0;
    prevLen.current = events.length;
  }, [events.length]);

  return (
    <div style={cardStyle}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Live activity</span>
        </div>
        <span style={{ fontSize: 10, color: C.t3 }}>{events.length} events</span>
      </div>
      <div ref={feedRef} style={{ maxHeight: 520, overflowY: "auto" }}>
        {events.map((ev, i) => {
          const cfg = typeMap[ev.type] || typeMap.sent;
          const Ic = cfg.Icon;
          return (
            <div key={ev.id} style={{
              padding: "9px 14px",
              borderBottom: i < events.length - 1 ? `1px solid ${C.brd}` : "none",
              background: ev.isNew ? C.cyanDim : "transparent",
              animation: ev.isNew ? "slideDown 0.3s ease" : "none",
            }}>
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, background: cfg.bg, border: `1px solid ${cfg.brd}` }}>
                  <Ic size={9} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: C.t1, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600 }}>{ev.member}</span>
                    <span style={{ color: C.t3 }}>
                      {ev.type === "returned" ? " returned after automation" : ev.type === "triggered" ? ` — ${ev.rule} triggered` : " — message sent"}
                    </span>
                  </div>
                  <div style={{ fontSize: 9, color: C.t3, marginTop: 2 }}>{ev.ago}</div>
                </div>
                {ev.type === "returned" && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.green, background: C.greenDim, border: `1px solid ${C.greenBrd}`, borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>win</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
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

/* ─── ADD RULE PANEL ─────────────────────────────────────────── */
function AddRulePanel({ gymName, existingIds, onAdd, onClose }) {
  const [cat, setCat]     = useState("All");
  const [selected, setSel] = useState(null);
  const [msg, setMsg]     = useState("");
  const [delay, setDelay] = useState(0);
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
        {/* Left: trigger list */}
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

        {/* Right: message editor */}
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

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function TabEngagement({ selectedGym }) {
  const gymName = selectedGym?.name || MOCK_GYM;

  const [rules, setRules]     = useState(MOCK_RULES);
  const [showAdd, setShowAdd] = useState(false);
  const [activity, setActivity] = useState(MOCK_ACTIVITY);
  const liveIdx = useRef(0);

  const persist = useCallback(async () => {}, []);

  const addRule    = useCallback(r => { const u = [...rules, { ...r, id: `r_${Date.now()}` }]; setRules(u); persist(u); }, [rules, persist]);
  const toggleRule = useCallback(id => { const u = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r); setRules(u); persist(u); }, [rules, persist]);
  const editRule   = useCallback((id, upd) => { const u = rules.map(r => r.id === id ? { ...r, ...upd } : r); setRules(u); persist(u); }, [rules, persist]);
  const deleteRule = useCallback(id => { const u = rules.filter(r => r.id !== id); setRules(u); persist(u); }, [rules, persist]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (liveIdx.current >= LIVE_EVENTS.length) return;
      const ev = { ...LIVE_EVENTS[liveIdx.current++], id: Date.now(), ago: "just now", isNew: true };
      setActivity(prev => [ev, ...prev.slice(0, 14)]);
      setTimeout(() => setActivity(prev => prev.map(e => e.id === ev.id ? { ...e, isNew: false } : e)), 1200);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const enabled      = rules.filter(r => r.enabled);
  const paused       = rules.filter(r => !r.enabled);
  const existingIds  = rules.map(r => r.trigger_id);
  const totalSent    = rules.reduce((s, r) => s + (r.stats?.sent ?? 0), 0);
  const totalRet     = rules.reduce((s, r) => s + (r.stats?.returned ?? 0), 0);
  const totalSaved   = rules.reduce((s, r) => s + (r.stats?.saved ?? 0), 0);
  const churnPrev    = Math.floor(totalRet * 0.4);

  const addFromRec = useCallback(rec => {
    addRule({ trigger_id: rec.trigger_id, message: TEMPLATES[rec.trigger_id]?.(gymName, "{name}") || "", delay_hours: 0, enabled: true, stats: { sent:0,returned:0,rate:0,saved:0 } });
  }, [addRule, gymName]);

  const addPack = useCallback(pack => {
    pack.triggers.filter(id => !existingIds.includes(id)).forEach(id => {
      addRule({ trigger_id: id, message: TEMPLATES[id]?.(gymName, "{name}") || "", delay_hours: id.startsWith("inactive") ? 1 : 0, enabled: true, stats: { sent:0,returned:0,rate:0,saved:0 } });
    });
  }, [addRule, existingIds, gymName]);

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100%", color: C.t1, fontSize: 13, lineHeight: 1.5 }}>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "16px 20px 60px" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={13} color={C.cyan} />
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: C.t1, margin: 0, letterSpacing: "-0.02em" }}>Automated engagement</h2>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenDim, border: `1px solid ${C.greenBrd}`, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, display: "inline-block" }} />
                {enabled.length} running
              </span>
            </div>
            <p style={{ fontSize: 12, color: C.t2, margin: 0, lineHeight: 1.6 }}>
              Your gym is running itself. Messages go out automatically — no manual work required.
            </p>
          </div>
          <Btn variant={showAdd ? "ghost" : "primary"} onClick={() => setShowAdd(v => !v)}>
            {showAdd ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Add rule</>}
          </Btn>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
          <StatCard icon={Send}       label="Messages sent"      sub="automatically this month" value={totalSent}  delay={0}   />
          <StatCard icon={Activity}   label="Members re-engaged" sub="returned after a message"  value={totalRet}  delay={120} />
          <StatCard icon={DollarSign} label="Revenue retained"   sub="from re-engaged members"  value={totalSaved} delay={240} prefix="$" highlight />
          <StatCard icon={Bell}       label="Churn prevented"    sub="estimated cancellations"   value={churnPrev} delay={360} />
        </div>

        {/* AI recs */}
        <Recommendations recs={RECOMMENDATIONS} existingIds={existingIds} onAdd={addFromRec} />

        {/* Add rule panel */}
        {showAdd && <AddRulePanel gymName={gymName} existingIds={existingIds} onAdd={r => { addRule(r); setShowAdd(false); }} onClose={() => setShowAdd(false)} />}

        {/* Rules + feed */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, alignItems: "start" }}>

          {/* Left: rules */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Active */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: "uppercase", letterSpacing: "0.1em" }}>Active automations</span>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {enabled.map(rule => (
                    <RuleCard key={rule.id} rule={rule} gymName={gymName}
                      onToggle={() => toggleRule(rule.id)}
                      onEdit={u => editRule(rule.id, u)}
                      onDelete={() => deleteRule(rule.id)} />
                  ))}
                </div>
              )}
            </div>

            {/* Paused */}
            {paused.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em" }}>Paused</span>
                  <span style={{ fontSize: 9, color: C.t3 }}>{paused.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {paused.map(rule => (
                    <RuleCard key={rule.id} rule={rule} gymName={gymName}
                      onToggle={() => toggleRule(rule.id)}
                      onEdit={u => editRule(rule.id, u)}
                      onDelete={() => deleteRule(rule.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Templates */}
            <div style={{ borderTop: `1px solid ${C.brd}`, paddingTop: 18 }}>
              <TemplatePacks existingIds={existingIds} onAddPack={addPack} />
            </div>
          </div>

          {/* Right: live feed */}
          <div style={{ position: "sticky", top: 16 }}>
            <ActivityFeed events={activity} />
          </div>
        </div>

      </div>
    </div>
  );
}
