/**
 * TabEngagement — Rebuilt
 * "Your gym is running itself."
 *
 * Self-contained with mock data. To wire to your app:
 *   1. Replace MOCK_RULES with selectedGym?.automation_rules
 *   2. Swap persist() stub with your base44.entities.Gym.update(...)
 *   3. Replace T tokens with your C / dashboard-tokens import
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Zap, UserPlus, Trophy, Flame, CheckCircle, Plus, Trash2,
  ChevronRight, AlertTriangle, Star, Gift, Clock, Send, X,
  Edit3, ToggleRight, ToggleLeft, ArrowRight, TrendingUp,
  MessageCircle, ChevronDown, Bell,
  ArrowUpRight, RefreshCw, DollarSign, Activity,
} from "lucide-react";

/* ── Design tokens ──────────────────────────────────────────────── */
const T = {
  bg:          "#08090e",
  surface:     "#0f1016",
  surfaceEl:   "#14151d",
  surfaceHov:  "#191a24",
  border:      "#1e2030",
  borderEl:    "#262840",
  divider:     "#141520",
  t1: "#ededf0", t2: "#9191a4", t3: "#525266", t4: "#2e2e42",
  accent:      "#4c6ef5",
  accentDim:   "#1a2048",
  accentBrd:   "#263070",
  red:         "#c0392b",
  redDim:      "#160f0d",
  redBrd:      "#2e1614",
  amber:       "#b07b30",
  amberDim:    "#161008",
  amberBrd:    "#2a2010",
  green:       "#2d8a62",
  greenDim:    "#091912",
  greenBrd:    "#132e20",
  r: "8px", rsm: "6px",
  sh: "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.025)",
};

/* ── Trigger catalogue ──────────────────────────────────────────── */
const TRIGGERS = [
  { id:"inactive_7",  Icon:Clock,         cat:"Retention",  label:"Inactive 7 days",   desc:"No visit for 7 days"           },
  { id:"inactive_14", Icon:AlertTriangle, cat:"Retention",  label:"Inactive 14 days",  desc:"No visit for 14 days"          },
  { id:"inactive_30", Icon:AlertTriangle, cat:"Retention",  label:"Inactive 30 days",  desc:"No visit for 30 days"          },
  { id:"freq_drop",   Icon:TrendingUp,    cat:"Retention",  label:"Frequency drop",    desc:"Visits 50% less than usual"    },
  { id:"new_member",  Icon:UserPlus,      cat:"Onboarding", label:"New member joined", desc:"Member joins for the first time"},
  { id:"first_return",Icon:CheckCircle,   cat:"Onboarding", label:"First return visit", desc:"Member returns for 2nd visit" },
  { id:"streak_7",    Icon:Flame,         cat:"Milestones", label:"7-day streak",      desc:"7 consecutive days"            },
  { id:"streak_30",   Icon:Flame,         cat:"Milestones", label:"30-day streak",     desc:"30 consecutive days"           },
  { id:"visits_10",   Icon:Star,          cat:"Milestones", label:"10th visit",        desc:"Member's 10th check-in"        },
  { id:"visits_50",   Icon:Trophy,        cat:"Milestones", label:"50th visit",        desc:"Member's 50th check-in"        },
  { id:"visits_100",  Icon:Trophy,        cat:"Milestones", label:"100th visit",       desc:"Member's 100th check-in"       },
  { id:"birthday",    Icon:Gift,          cat:"Engagement", label:"Birthday",          desc:"It's a member's birthday"      },
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

/* ── Mock data ──────────────────────────────────────────────────── */
const MOCK_GYM = "Apex Fitness";

const MOCK_RULES = [
  { id:"r1", trigger_id:"inactive_14", message:TEMPLATES.inactive_14(MOCK_GYM,"{name}"), delay_hours:1,  enabled:true,  stats:{sent:24, returned:8,  rate:33, saved:480 }},
  { id:"r2", trigger_id:"new_member",  message:TEMPLATES.new_member(MOCK_GYM,"{name}"),  delay_hours:0,  enabled:true,  stats:{sent:31, returned:19, rate:61, saved:340 }},
  { id:"r3", trigger_id:"streak_7",    message:TEMPLATES.streak_7(MOCK_GYM,"{name}"),    delay_hours:0,  enabled:true,  stats:{sent:12, returned:0,  rate:0,  saved:0   }},
  { id:"r4", trigger_id:"inactive_30", message:TEMPLATES.inactive_30(MOCK_GYM,"{name}"), delay_hours:6,  enabled:false, stats:{sent:7,  returned:2,  rate:29, saved:120 }},
  { id:"r5", trigger_id:"visits_10",   message:TEMPLATES.visits_10(MOCK_GYM,"{name}"),   delay_hours:0,  enabled:false, stats:{sent:9,  returned:0,  rate:0,  saved:0   }},
];

const MOCK_ACTIVITY_SEED = [
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
  { type:"triggered", rule:"Inactive 14 days",  member:"Chris Park"    },
  { type:"returned",  rule:"New member joined",  member:"Sam Rivera"    },
  { type:"sent",      rule:"7-day streak",       member:"Mei Zhang"     },
  { type:"triggered", rule:"Inactive 7 days",    member:"Sofia Reyes"   },
  { type:"returned",  rule:"Inactive 14 days",   member:"James Okafor"  },
];

const RECOMMENDATIONS = [
  {
    id:"rec1",
    title:"Add a day-1 welcome message",
    body:"Members who receive a same-day welcome are 30% more likely to return in week 1.",
    impact:"+30% 2nd-visit rate",
    trigger_id:"new_member",
    urgency:"high",
    icon:UserPlus,
  },
  {
    id:"rec2",
    title:"Catch members going quiet in week 1",
    body:"3 members in their first 2 weeks haven't been back. A habit-nudge on day 5 helps.",
    impact:"+22% week-1 retention",
    trigger_id:"inactive_7",
    urgency:"medium",
    icon:AlertTriangle,
  },
  {
    id:"rec3",
    title:"Celebrate your milestone members",
    body:"2 members are approaching their 50th visit. Recognition converts to referrals.",
    impact:"3× referral rate",
    trigger_id:"visits_50",
    urgency:"low",
    icon:Trophy,
  },
];

const TEMPLATE_PACKS = [
  { id:"tp1", label:"Win back inactive members",  desc:"14-day + 30-day re-engagement", icon:RefreshCw, triggers:["inactive_14","inactive_30"] },
  { id:"tp2", label:"Welcome new members",         desc:"Day-1 welcome + return nudge",  icon:UserPlus,  triggers:["new_member","inactive_7"]   },
  { id:"tp3", label:"Celebrate milestones",        desc:"10th, 50th, 100th visit",       icon:Trophy,    triggers:["visits_10","visits_50"]      },
  { id:"tp4", label:"Streak recognition",          desc:"7-day and 30-day streaks",      icon:Flame,     triggers:["streak_7","streak_30"]       },
];

/* ── Helpers ────────────────────────────────────────────────────── */
function useCountUp(target, delay = 0) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      started.current = true;
      const duration = 900;
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(ease * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  return val;
}

function riskTk(pct) {
  if (pct >= 60) return { c: T.red,   d: T.redDim,   b: T.redBrd   };
  if (pct >= 30) return { c: T.amber, d: T.amberDim, b: T.amberBrd };
  return               { c: T.green, d: T.greenDim, b: T.greenBrd  };
}

/* ── Primitive components ───────────────────────────────────────── */
function TinyBar({ pct, color, height = 3 }) {
  return (
    <div style={{ height, borderRadius: 99, background: T.divider, flex: 1 }}>
      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: color, opacity: 0.75 }} />
    </div>
  );
}

function Pill({ children, color, bg, brd }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 500,
      color, background: bg, border: `1px solid ${brd}`,
    }}>{children}</span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: T.r, boxShadow: T.sh, overflow: "hidden", ...style,
    }}>{children}</div>
  );
}

function GhostBtn({ children, onClick, style = {}, danger = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "5px 10px", borderRadius: T.rsm, fontSize: 11, fontWeight: 500,
        cursor: "pointer", fontFamily: "inherit", border: "1px solid",
        background: danger && hov ? T.redDim : hov ? T.surfaceHov : T.surfaceEl,
        borderColor: danger && hov ? T.redBrd : hov ? T.borderEl : T.border,
        color: danger && hov ? T.red : T.t2,
        transition: "all .12s", ...style,
      }}
    >{children}</button>
  );
}

function PrimaryBtn({ children, onClick, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "6px 12px", borderRadius: T.rsm, fontSize: 11, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit", border: "1px solid transparent",
        background: T.accent, color: "#fff", opacity: hov ? 0.88 : 1,
        transition: "opacity .12s", ...style,
      }}
    >{children}</button>
  );
}

/* ── Animated stat card ─────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, prefix = "", delay = 0, highlight = false }) {
  const counted = useCountUp(typeof value === "number" ? value : 0, delay);
  const display = typeof value === "number" ? `${prefix}${counted.toLocaleString()}` : value;
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: T.rsm, flexShrink: 0,
          background: T.surfaceEl, border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={14} color={highlight ? T.accent : T.t3} />
        </div>
        <ArrowUpRight size={11} color={T.t4} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: highlight ? T.accent : T.t1, marginBottom: 5, fontVariantNumeric: "tabular-nums" }}>
        {display}
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: T.t2 }}>{label}</div>
      <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{sub}</div>
    </Card>
  );
}

/* ── Flow diagram ── compact horizontal ─────────────────────────── */
function FlowDiagram({ rule, trig }) {
  const Icon = trig?.Icon || Zap;
  const delayLabel = rule.delay_hours === 0 ? "immediately" : rule.delay_hours === 1 ? "after 1 hour" : `after ${rule.delay_hours} hours`;
  const returnRate = rule.stats?.rate ?? 0;
  const tk = riskTk(returnRate >= 40 ? 0 : returnRate >= 20 ? 40 : 80);

  const Step = ({ icon: StepIcon, label, sub, color }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 28, height: 28, borderRadius: T.rsm, flexShrink: 0,
        background: T.surfaceEl, border: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <StepIcon size={11} color={color || T.t3} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 500, color: T.t1, lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: 9, color: T.t3, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );

  const Arrow = () => (
    <ChevronRight size={10} color={T.t4} style={{ flexShrink: 0, marginTop: 2 }} />
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <Step icon={Icon}          label={trig?.label || "Trigger"} sub="trigger" />
      <Arrow />
      <Step icon={MessageCircle} label="Send message" sub={delayLabel} />
      <Arrow />
      <Step
        icon={returnRate > 0 ? CheckCircle : Activity}
        label={returnRate > 0 ? `${rule.stats.returned} returned` : "No data yet"}
        sub={returnRate > 0 ? `${returnRate}% return rate` : "watching..."}
        color={returnRate >= 40 ? T.green : returnRate > 0 ? T.amber : T.t3}
      />
    </div>
  );
}

/* ── Inline rule editor ─────────────────────────────────────────── */
function RuleEditor({ rule, gymName, onSave, onCancel }) {
  const [msg, setMsg] = useState(rule.message || TEMPLATES[rule.trigger_id]?.(gymName, "{name}") || "");
  const [delay, setDelay] = useState(rule.delay_hours || 0);
  const DELAYS = [{ v:0,label:"Immediately" },{ v:1,label:"1 hour" },{ v:3,label:"3 hours" },{ v:6,label:"6 hours" },{ v:24,label:"24 hours" }];

  return (
    <div style={{ padding: "14px 18px 16px", borderTop: `1px solid ${T.border}`, background: T.bg }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>
        Message — use {"{name}"} for member's first name
      </div>
      <textarea
        value={msg} onChange={e => setMsg(e.target.value)} rows={3}
        style={{
          width: "100%", boxSizing: "border-box",
          background: T.surfaceEl, border: `1px solid ${T.border}`,
          borderRadius: T.rsm, padding: "8px 10px",
          color: T.t1, fontSize: 12, lineHeight: 1.65,
          resize: "vertical", outline: "none", fontFamily: "inherit", marginBottom: 12,
        }}
        onFocus={e => e.target.style.borderColor = T.borderEl}
        onBlur={e => e.target.style.borderColor = T.border}
      />
      <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Send timing</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
        {DELAYS.map(d => (
          <button key={d.v} onClick={() => setDelay(d.v)} style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
            background: delay === d.v ? T.accentDim : T.surfaceEl,
            color: delay === d.v ? T.accent : T.t3,
            border: `1px solid ${delay === d.v ? T.accentBrd : T.border}`,
            transition: "all .12s",
          }}>{d.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <PrimaryBtn onClick={() => onSave({ message: msg, delay_hours: delay })} style={{ flex: 1, justifyContent: "center" }}>
          <CheckCircle size={11} /> Save changes
        </PrimaryBtn>
        <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
      </div>
    </div>
  );
}

/* ── Rule card ──────────────────────────────────────────────────── */
function RuleCard({ rule, gymName, onToggle, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const trig = TRIGGERS.find(t => t.id === rule.trigger_id);
  if (!trig) return null;

  const handleTest = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  const returnRate = rule.stats?.rate ?? 0;
  const tk = returnRate >= 40 ? { c: T.green, d: T.greenDim, b: T.greenBrd } : returnRate >= 20 ? { c: T.amber, d: T.amberDim, b: T.amberBrd } : { c: T.t3, d: T.surfaceEl, b: T.border };

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${rule.enabled ? T.border : T.divider}`,
      borderLeft: rule.enabled ? `2px solid ${T.accent}` : `2px solid ${T.border}`,
      borderRadius: T.r,
      boxShadow: T.sh,
      overflow: "hidden",
      opacity: rule.enabled ? 1 : 0.6,
      transition: "opacity .15s",
    }}>
      {/* Main row */}
      <div style={{ padding: "14px 16px 14px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Icon */}
        <div style={{
          width: 34, height: 34, borderRadius: T.rsm, flexShrink: 0,
          background: T.surfaceEl, border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
        }}>
          <trig.Icon size={14} color={rule.enabled ? T.t2 : T.t3} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: rule.enabled ? T.t1 : T.t2 }}>{trig.label}</span>
            <span style={{
              fontSize: 9, fontWeight: 600, color: T.t3, background: T.surfaceEl,
              border: `1px solid ${T.border}`, borderRadius: 4, padding: "1px 6px",
              textTransform: "uppercase", letterSpacing: ".07em",
            }}>{trig.cat}</span>
            {rule.enabled && (
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 9, color: T.green }}>live</span>
              </span>
            )}
          </div>

          {/* Message preview */}
          <div style={{ fontSize: 11, color: T.t3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 10, lineHeight: 1.5 }}>
            {(rule.message || "").replace("{name}", "member")}
          </div>

          {/* Flow diagram */}
          <FlowDiagram rule={rule} trig={trig} />

          {/* Stats row */}
          {(rule.stats?.sent > 0) && (
            <div style={{ display: "flex", gap: 14, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.divider}` }}>
              {[
                { label: "Sent", val: rule.stats.sent },
                { label: "Returned", val: rule.stats.returned },
                { label: "Return rate", val: `${rule.stats.rate}%`, highlight: rule.stats.rate >= 30 },
                rule.stats.saved > 0 && { label: "Revenue saved", val: `$${rule.stats.saved}`, highlight: true },
              ].filter(Boolean).map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: s.highlight ? T.t1 : T.t2, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {s.val}
                  </div>
                  <div style={{ fontSize: 9, color: T.t3, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
              {rule.stats.rate > 0 && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", marginLeft: 4 }}>
                  <TinyBar pct={rule.stats.rate} color={rule.stats.rate >= 40 ? T.green : T.amber} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <button onClick={handleTest} style={{
            height: 26, padding: "0 8px", borderRadius: 5, fontSize: 9.5, fontWeight: 600,
            background: testSent ? T.greenDim : T.surfaceEl,
            border: `1px solid ${testSent ? T.greenBrd : T.border}`,
            color: testSent ? T.green : T.t3,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 3, transition: "all .15s",
          }}>
            {testSent ? <><CheckCircle size={9} /> Sent</> : <><Send size={9} /> Test</>}
          </button>
          <button onClick={() => setOpen(v => !v)} style={{
            height: 26, width: 26, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
            background: open ? T.accentDim : T.surfaceEl,
            border: `1px solid ${open ? T.accentBrd : T.border}`,
            color: open ? T.accent : T.t3, cursor: "pointer", transition: "all .15s",
          }}>
            <Edit3 size={10} />
          </button>
          <button onClick={onToggle} style={{
            height: 26, width: 26, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
            background: rule.enabled ? T.greenDim : T.surfaceEl,
            border: `1px solid ${rule.enabled ? T.greenBrd : T.border}`,
            color: rule.enabled ? T.green : T.t3, cursor: "pointer", transition: "all .15s",
          }}>
            {rule.enabled ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
          </button>
          <button
            onClick={onDelete}
            onMouseEnter={e => { e.currentTarget.style.background = T.redDim; e.currentTarget.style.borderColor = T.redBrd; e.currentTarget.style.color = T.red; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.surfaceEl; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.t3; }}
            style={{
              height: 26, width: 26, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
              background: T.surfaceEl, border: `1px solid ${T.border}`,
              color: T.t3, cursor: "pointer", transition: "all .12s",
            }}>
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Inline editor */}
      {open && (
        <RuleEditor
          rule={rule} gymName={gymName}
          onSave={u => { onEdit(u); setOpen(false); }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/* ── AI recommendations ─────────────────────────────────────────── */
function Recommendations({ recs, existingIds, onAdd }) {
  const available = recs.filter(r => !existingIds.includes(r.trigger_id));
  if (!available.length) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.t2, textTransform: "uppercase", letterSpacing: ".1em" }}>
          Suggested for your gym
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, color: T.accent,
          background: T.accentDim, border: `1px solid ${T.accentBrd}`,
          padding: "1px 7px", borderRadius: 20,
        }}>AI</span>
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {available.map(rec => {
          const Icon = rec.icon;
          const urgencyColor = rec.urgency === "high" ? T.red : rec.urgency === "medium" ? T.amber : T.t3;
          return (
            <div key={rec.id} style={{
              minWidth: 240, flexShrink: 0,
              padding: "14px 16px",
              background: T.surface, border: `1px solid ${T.border}`,
              borderLeft: `2px solid ${urgencyColor}`,
              borderRadius: T.r, boxShadow: T.sh,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: T.surfaceEl, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={11} color={urgencyColor} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, lineHeight: 1.3 }}>{rec.title}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.5, marginBottom: 10 }}>{rec.body}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: T.green, fontWeight: 600 }}>{rec.impact}</span>
                <PrimaryBtn onClick={() => onAdd(rec)} style={{ fontSize: 10, padding: "4px 10px" }}>
                  <Plus size={9} /> Create
                </PrimaryBtn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Live activity feed ─────────────────────────────────────────── */
function ActivityFeed({ events }) {
  const feedRef = useRef(null);
  const prevLen = useRef(events.length);

  useEffect(() => {
    if (events.length > prevLen.current && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
    prevLen.current = events.length;
  }, [events.length]);

  const typeConfig = {
    triggered: { color: T.accent, label: "Triggered",  bg: T.accentDim, brd: T.accentBrd, Icon: Zap         },
    sent:      { color: T.t2,     label: "Message sent", bg: T.surfaceEl, brd: T.border,   Icon: Send        },
    returned:  { color: T.green,  label: "Returned 🎉", bg: T.greenDim,  brd: T.greenBrd,  Icon: CheckCircle },
  };

  return (
    <Card>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "pulse 2s ease-in-out infinite", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>Live activity</span>
        </div>
        <span style={{ fontSize: 10, color: T.t3 }}>{events.length} events</span>
      </div>
      <div ref={feedRef} style={{ maxHeight: 520, overflowY: "auto", padding: "6px 0" }}>
        {events.map((ev, i) => {
          const cfg = typeConfig[ev.type] || typeConfig.sent;
          const Ic = cfg.Icon;
          return (
            <div key={ev.id} style={{
              padding: "9px 14px",
              borderBottom: i < events.length - 1 ? `1px solid ${T.divider}` : "none",
              animation: ev.isNew ? "slideDown 0.3s ease" : "none",
              background: ev.isNew ? `${T.accent}06` : "transparent",
            }}>
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: cfg.bg, border: `1px solid ${cfg.brd}`,
                  display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
                }}>
                  <Ic size={9} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: T.t1, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600 }}>{ev.member}</span>
                    <span style={{ color: T.t3 }}>
                      {ev.type === "returned" ? " returned after automation" :
                       ev.type === "triggered" ? ` — ${ev.rule} triggered` :
                       ` — message sent`}
                    </span>
                  </div>
                  <div style={{ fontSize: 9, color: T.t3, marginTop: 2 }}>{ev.ago}</div>
                </div>
                {ev.type === "returned" && (
                  <span style={{ fontSize: 9, fontWeight: 600, color: T.green, background: T.greenDim, border: `1px solid ${T.greenBrd}`, borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>
                    win
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Template packs ─────────────────────────────────────────────── */
function TemplatePacks({ existingIds, onAddPack }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.t2, textTransform: "uppercase", letterSpacing: ".1em" }}>Quick-start templates</span>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {TEMPLATE_PACKS.map(tp => {
          const Icon = tp.icon;
          const allAdded = tp.triggers.every(id => existingIds.includes(id));
          return (
            <div key={tp.id} style={{
              minWidth: 200, flexShrink: 0,
              padding: "13px 15px",
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: T.r, boxShadow: T.sh,
              opacity: allAdded ? 0.5 : 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <Icon size={12} color={T.t3} />
                <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{tp.label}</span>
              </div>
              <div style={{ fontSize: 10, color: T.t3, marginBottom: 10, lineHeight: 1.5 }}>{tp.desc}</div>
              <GhostBtn onClick={() => !allAdded && onAddPack(tp)} style={{ fontSize: 10, padding: "3px 9px", width: "100%", justifyContent: "center", opacity: allAdded ? 0.5 : 1 }}>
                {allAdded ? "Already added" : <><Plus size={9} /> Add pack</>}
              </GhostBtn>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Add rule panel ─────────────────────────────────────────────── */
function AddRulePanel({ gymName, existingIds, onAdd, onClose }) {
  const [cat, setCat]       = useState("All");
  const [selected, setSelT] = useState(null);
  const [msg, setMsg]       = useState("");
  const [delay, setDelay]   = useState(0);
  const CATS = ["All", "Retention", "Onboarding", "Milestones", "Engagement"];
  const DELAYS = [{ v:0,label:"Immediately" },{ v:1,label:"1 hr" },{ v:3,label:"3 hrs" },{ v:6,label:"6 hrs" },{ v:24,label:"24 hrs" }];
  const available = TRIGGERS.filter(t => (cat === "All" || t.cat === cat) && !existingIds.includes(t.id));

  const pick = t => { setSelT(t); setMsg(TEMPLATES[t.id]?.(gymName, "{name}") || ""); };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>New automation rule</div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>Choose a trigger, write a message, set timing.</div>
        </div>
        <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, background: T.surfaceEl, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.t3 }}>
          <X size={11} />
        </button>
      </div>
      <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 18 }}>
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                background: cat === c ? T.accentDim : T.surfaceEl,
                color: cat === c ? T.accent : T.t3,
                border: `1px solid ${cat === c ? T.accentBrd : T.border}`,
              }}>{c}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {available.map(t => {
              const Icon = t.Icon;
              const isSel = selected?.id === t.id;
              return (
                <button key={t.id} onClick={() => pick(t)} style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "9px 11px",
                  borderRadius: T.rsm, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  background: isSel ? T.accentDim : T.surfaceEl,
                  border: `1px solid ${isSel ? T.accentBrd : T.border}`,
                  transition: "all .12s",
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: isSel ? T.accentDim : T.surfaceEl, border: `1px solid ${isSel ? T.accentBrd : T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={11} color={isSel ? T.accent : T.t3} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isSel ? T.t1 : T.t2 }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: T.t3 }}>{t.desc}</div>
                  </div>
                  {isSel && <ChevronRight size={11} color={T.accent} />}
                </button>
              );
            })}
            {available.length === 0 && (
              <div style={{ padding: "20px", textAlign: "center", color: T.t3, fontSize: 12 }}>All triggers in this category are active.</div>
            )}
          </div>
        </div>
        {selected && (
          <div>
            <div style={{ padding: "10px 12px", borderRadius: T.rsm, background: T.accentDim, border: `1px solid ${T.accentBrd}`, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <selected.Icon size={12} color={T.accent} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{selected.label}</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Message</div>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4}
              style={{ width: "100%", boxSizing: "border-box", background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: T.rsm, padding: "8px 10px", color: T.t1, fontSize: 11, lineHeight: 1.65, resize: "vertical", outline: "none", fontFamily: "inherit", marginBottom: 12 }}
              onFocus={e => e.target.style.borderColor = T.borderEl}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Send timing</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
              {DELAYS.map(d => (
                <button key={d.v} onClick={() => setDelay(d.v)} style={{
                  padding: "4px 9px", borderRadius: 5, fontSize: 10, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                  background: delay === d.v ? T.accentDim : T.surfaceEl,
                  color: delay === d.v ? T.accent : T.t3,
                  border: `1px solid ${delay === d.v ? T.accentBrd : T.border}`,
                }}>{d.label}</button>
              ))}
            </div>
            <PrimaryBtn
              onClick={() => { if (msg.trim()) { onAdd({ trigger_id: selected.id, message: msg.trim(), delay_hours: delay, enabled: true, stats: { sent: 0, returned: 0, rate: 0, saved: 0 } }); onClose(); }}}
              style={{ width: "100%", justifyContent: "center", opacity: msg.trim() ? 1 : 0.5 }}
            >
              <Plus size={11} /> Add rule
            </PrimaryBtn>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function TabEngagement({ selectedGym, atRisk = 4, totalMembers = 8 }) {
  const gymName = selectedGym?.name || MOCK_GYM;

  const [rules, setRules]   = useState(MOCK_RULES);
  const [showAdd, setShowAdd] = useState(false);
  const [activity, setActivity] = useState(MOCK_ACTIVITY_SEED);
  const liveIdx = useRef(0);

  /* Stub — replace with base44.entities.Gym.update(...) */
  const persist = useCallback(async (updated) => {
    console.log("[TabEngagement] persist:", updated);
  }, []);

  const addRule    = useCallback(r => { const u = [...rules, { ...r, id: `r_${Date.now()}` }]; setRules(u); persist(u); }, [rules, persist]);
  const toggleRule = useCallback(id => { const u = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r); setRules(u); persist(u); }, [rules, persist]);
  const editRule   = useCallback((id, upd) => { const u = rules.map(r => r.id === id ? { ...r, ...upd } : r); setRules(u); persist(u); }, [rules, persist]);
  const deleteRule = useCallback(id => { const u = rules.filter(r => r.id !== id); setRules(u); persist(u); }, [rules, persist]);

  /* Simulate live feed */
  useEffect(() => {
    const timer = setInterval(() => {
      if (liveIdx.current >= LIVE_EVENTS.length) return;
      const ev = LIVE_EVENTS[liveIdx.current];
      liveIdx.current++;
      const newEv = { ...ev, id: Date.now(), ago: "just now", isNew: true };
      setActivity(prev => [newEv, ...prev.slice(0, 14)]);
      setTimeout(() => {
        setActivity(prev => prev.map(e => e.id === newEv.id ? { ...e, isNew: false } : e));
      }, 1200);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const enabled = rules.filter(r => r.enabled);
  const paused  = rules.filter(r => !r.enabled);
  const existingIds = rules.map(r => r.trigger_id);

  const totalSent     = rules.reduce((s, r) => s + (r.stats?.sent ?? 0), 0);
  const totalReturned = rules.reduce((s, r) => s + (r.stats?.returned ?? 0), 0);
  const totalSaved    = rules.reduce((s, r) => s + (r.stats?.saved ?? 0), 0);
  const churnPrevented = Math.floor(totalReturned * 0.4);

  const addFromRec = useCallback(rec => {
    const trig = TRIGGERS.find(t => t.id === rec.trigger_id);
    if (!trig) return;
    addRule({
      trigger_id: rec.trigger_id,
      message: TEMPLATES[rec.trigger_id]?.(gymName, "{name}") || "",
      delay_hours: 0,
      enabled: true,
      stats: { sent: 0, returned: 0, rate: 0, saved: 0 },
    });
  }, [addRule, gymName]);

  const addPack = useCallback(pack => {
    pack.triggers
      .filter(id => !existingIds.includes(id))
      .forEach(id => {
        addRule({
          trigger_id: id,
          message: TEMPLATES[id]?.(gymName, "{name}") || "",
          delay_hours: id.startsWith("inactive") ? 1 : 0,
          enabled: true,
          stats: { sent: 0, returned: 0, rate: 0, saved: 0 },
        });
      });
  }, [addRule, existingIds, gymName]);

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      fontFamily: "'Geist', 'DM Sans', 'Helvetica Neue', Arial, sans-serif",
      color: T.t1, fontSize: 13, lineHeight: 1.5,
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
      `}</style>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 24px 60px" }}>

        {/* ── Page header ─────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22, gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: T.rsm, background: T.accentDim, border: `1px solid ${T.accentBrd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={13} color={T.accent} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: T.t1, margin: 0, letterSpacing: "-0.03em" }}>Automated engagement</h2>
              <span style={{
                fontSize: 10, fontWeight: 600, color: T.green,
                background: T.greenDim, border: `1px solid ${T.greenBrd}`,
                padding: "2px 8px", borderRadius: 20,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, animation: "pulse 2s ease-in-out infinite", display: "inline-block" }} />
                {enabled.length} running
              </span>
            </div>
            <p style={{ fontSize: 12, color: T.t3, margin: 0, lineHeight: 1.6 }}>
              Your gym is running itself. Messages go out automatically — no manual work required.
            </p>
          </div>
          <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
            <GhostBtn onClick={() => setShowAdd(v => !v)}>
              {showAdd ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Add rule</>}
            </GhostBtn>
          </div>
        </div>

        {/* ── SECTION 1: Performance summary ─────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
          <StatCard icon={Send}        label="Messages sent"      sub="automatically this month" value={totalSent}      delay={0}   />
          <StatCard icon={Activity}    label="Members re-engaged" sub="returned after a message"  value={totalReturned}  delay={120} />
          <StatCard icon={DollarSign}  label="Revenue retained"   sub="from re-engaged members"  value={totalSaved}     delay={240} prefix="$" highlight />
          <StatCard icon={Bell}        label="Churn prevented"    sub="estimated cancellations"   value={churnPrevented} delay={360} />
        </div>

        {/* ── SECTION 2: AI recommendations ──────────────────────── */}
        <Recommendations recs={RECOMMENDATIONS} existingIds={existingIds} onAdd={addFromRec} />

        {/* ── Add rule panel ──────────────────────────────────────── */}
        {showAdd && (
          <AddRulePanel gymName={gymName} existingIds={existingIds} onAdd={addRule} onClose={() => setShowAdd(false)} />
        )}

        {/* ── SECTIONS 3 + 4: Rules + Live feed ──────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 284px", gap: 14, alignItems: "start" }}>

          {/* Left — rules list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Active rules */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.t2, textTransform: "uppercase", letterSpacing: ".1em" }}>Active automations</span>
                <span style={{ fontSize: 11, color: T.t3 }}>{enabled.length} of {rules.length}</span>
              </div>
              {enabled.length === 0 ? (
                <Card style={{ padding: "36px 24px", textAlign: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: T.r, background: T.surfaceEl, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                    <Zap size={16} color={T.t4} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.t2, marginBottom: 4 }}>No active automations</div>
                  <div style={{ fontSize: 11, color: T.t3, marginBottom: 14 }}>Add your first rule to start running on autopilot.</div>
                  <GhostBtn onClick={() => setShowAdd(true)} style={{ margin: "0 auto" }}>
                    <Plus size={11} /> Add rule
                  </GhostBtn>
                </Card>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {enabled.map(rule => (
                    <RuleCard key={rule.id} rule={rule} gymName={gymName}
                      onToggle={() => toggleRule(rule.id)}
                      onEdit={u => editRule(rule.id, u)}
                      onDelete={() => deleteRule(rule.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Paused rules */}
            {paused.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: ".1em" }}>Paused</span>
                  <span style={{ fontSize: 9, color: T.t4 }}>{paused.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {paused.map(rule => (
                    <RuleCard key={rule.id} rule={rule} gymName={gymName}
                      onToggle={() => toggleRule(rule.id)}
                      onEdit={u => editRule(rule.id, u)}
                      onDelete={() => deleteRule(rule.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 5: Templates */}
            <div style={{ borderTop: `1px solid ${T.divider}`, paddingTop: 18 }}>
              <TemplatePacks existingIds={existingIds} onAddPack={addPack} />
            </div>
          </div>

          {/* Right — live feed */}
          <div style={{ position: "sticky", top: 24 }}>
            <ActivityFeed events={activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
f