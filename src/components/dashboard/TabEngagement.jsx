/**
 * TabEngagement — Rebuilt
 * "Your gym is running itself."
 *
 * Self-contained with mock data. To wire to your app:
 *   1. Replace MOCK_RULES with selectedGym?.automation_rules
 *   2. Swap persist() stub with your base44.entities.Gym.update(...)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Zap, UserPlus, Trophy, Flame, CheckCircle, Plus, Trash2,
  ChevronRight, AlertTriangle, Star, Gift, Clock, Send, X,
  Edit3, ToggleRight, ToggleLeft, ArrowRight, TrendingUp,
  MessageCircle, ChevronDown, Bell,
  ArrowUpRight, RefreshCw, DollarSign, Activity,
} from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { cn } from "@/lib/utils";

/* ── Layout constant ────────────────────────────────────────────── */
const CARD = 'bg-[#0a0f1e] border border-white/[0.04] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.012)] overflow-hidden';

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

/* ── Precomputed class helpers ───────────────────────────────────── */
const urgencyBorderCls = { high: 'border-l-red-500', medium: 'border-l-amber-400', low: 'border-l-[#4b5578]' };
const urgencyTextCls   = { high: 'text-red-500',     medium: 'text-amber-400',     low: 'text-[#4b5578]'     };

const typeConfig = {
  triggered: { textCls: 'text-blue-500',    bgCls: 'bg-blue-500/[0.10]',     brdCls: 'border-blue-500/[0.22]',    label: "Triggered",    Icon: Zap         },
  sent:      { textCls: 'text-[#8b95b3]',   bgCls: 'bg-[#0d1225]',           brdCls: 'border-white/[0.04]',       label: "Message sent", Icon: Send        },
  returned:  { textCls: 'text-emerald-500', bgCls: 'bg-emerald-500/[0.08]',  brdCls: 'border-emerald-500/[0.18]', label: "Returned 🎉",  Icon: CheckCircle },
};

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

/* ── Primitive components ───────────────────────────────────────── */
function TinyBar({ pct, colorCls }) {
  return (
    <div className="h-[3px] rounded-full bg-white/[0.03] flex-1">
      <div className={cn('h-full rounded-full opacity-75', colorCls)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Animated stat card ─────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, prefix = "", delay = 0, highlight = false }) {
  const counted = useCountUp(typeof value === "number" ? value : 0, delay);
  const display = typeof value === "number" ? `${prefix}${counted.toLocaleString()}` : value;
  return (
    <div className={cn(CARD, 'p-[18px_20px]')}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-[10px] shrink-0 bg-[#0d1225] border border-white/[0.04] flex items-center justify-center">
          <Icon size={14} className={highlight ? 'text-blue-500' : 'text-[#4b5578]'} />
        </div>
        <ArrowUpRight size={11} className="text-[#252d45]" />
      </div>
      <div className={cn('text-[28px] font-bold tracking-[-0.04em] leading-none mb-[5px] tabular-nums', highlight ? 'text-blue-500' : 'text-[#eef2ff]')}>
        {display}
      </div>
      <div className="text-[11px] font-medium text-[#8b95b3]">{label}</div>
      <div className="text-[10px] text-[#4b5578] mt-[2px]">{sub}</div>
    </div>
  );
}

/* ── Flow diagram ───────────────────────────────────────────────── */
function FlowDiagram({ rule, trig }) {
  const Icon = trig?.Icon || Zap;
  const delayLabel = rule.delay_hours === 0 ? "immediately" : rule.delay_hours === 1 ? "after 1 hour" : `after ${rule.delay_hours} hours`;
  const returnRate = rule.stats?.rate ?? 0;
  const returnRateCls = returnRate >= 40 ? 'text-emerald-500' : returnRate > 0 ? 'text-amber-400' : 'text-[#4b5578]';

  const Step = ({ icon: StepIcon, label, sub, iconCls }) => (
    <div className="flex items-center gap-[6px]">
      <div className="w-7 h-7 rounded-[10px] shrink-0 bg-[#0d1225] border border-white/[0.04] flex items-center justify-center">
        <StepIcon size={11} className={iconCls || 'text-[#4b5578]'} />
      </div>
      <div>
        <div className="text-[11px] font-medium text-[#eef2ff] leading-[1.2]">{label}</div>
        <div className="text-[9px] text-[#4b5578] mt-[1px]">{sub}</div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-[6px] flex-wrap">
      <Step icon={Icon}          label={trig?.label || "Trigger"} sub="trigger" />
      <ChevronRight size={10} className="text-[#252d45] shrink-0 mt-[2px]" />
      <Step icon={MessageCircle} label="Send message" sub={delayLabel} />
      <ChevronRight size={10} className="text-[#252d45] shrink-0 mt-[2px]" />
      <Step
        icon={returnRate > 0 ? CheckCircle : Activity}
        label={returnRate > 0 ? `${rule.stats.returned} returned` : "No data yet"}
        sub={returnRate > 0 ? `${returnRate}% return rate` : "watching..."}
        iconCls={returnRateCls}
      />
    </div>
  );
}

/* ── Inline rule editor ─────────────────────────────────────────── */
function RuleEditor({ rule, gymName, onSave, onCancel }) {
  const [msg, setMsg] = useState(rule.message || TEMPLATES[rule.trigger_id]?.(gymName, "{name}") || "");
  const [delay, setDelay] = useState(rule.delay_hours || 0);
  const DELAYS = [{ v:0,label:"Immediately" },{ v:1,label:"1 hour" },{ v:3,label:"3 hours" },{ v:6,label:"6 hours" },{ v:24,label:"24 hours" }];
  const delayCls = v => delay === v
    ? 'bg-blue-500/[0.10] text-blue-500 border-blue-500/[0.22]'
    : 'bg-[#0d1225] text-[#4b5578] border-white/[0.04]';

  return (
    <div className="px-[18px] py-4 border-t border-white/[0.04] bg-[#050810]">
      <div className="text-[10px] font-semibold text-[#4b5578] uppercase tracking-[0.1em] mb-[6px]">
        Message — use {"{name}"} for member's first name
      </div>
      <textarea
        value={msg} onChange={e => setMsg(e.target.value)} rows={3}
        className="w-full box-border bg-[#0d1225] border border-white/[0.04] rounded-[10px] px-[10px] py-2 text-[#eef2ff] text-xs leading-[1.65] resize-y outline-none font-inherit mb-3 focus:border-white/[0.07] transition-colors"
      />
      <div className="text-[10px] font-semibold text-[#4b5578] uppercase tracking-[0.1em] mb-2">Send timing</div>
      <div className="flex gap-[5px] flex-wrap mb-[14px]">
        {DELAYS.map(d => (
          <button key={d.v} onClick={() => setDelay(d.v)}
            className={cn('px-[10px] py-1 rounded-[6px] text-[11px] font-medium cursor-pointer border transition-all', delayCls(d.v))}>
            {d.label}
          </button>
        ))}
      </div>
      <div className="flex gap-[7px]">
        <AppButton variant="primary" size="sm" className="flex-1 justify-center" onClick={() => onSave({ message: msg, delay_hours: delay })}>
          <CheckCircle size={11} /> Save changes
        </AppButton>
        <AppButton variant="secondary" size="sm" onClick={onCancel}>Cancel</AppButton>
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
  const rateCls = returnRate >= 40
    ? { text: 'text-emerald-500', bg: 'bg-emerald-500/[0.08]', brd: 'border-emerald-500/[0.18]', bar: 'bg-emerald-500' }
    : returnRate >= 20
    ? { text: 'text-amber-400',   bg: 'bg-amber-400/[0.08]',   brd: 'border-amber-400/[0.18]',   bar: 'bg-amber-400'   }
    : { text: 'text-[#4b5578]',   bg: 'bg-[#0d1225]',           brd: 'border-white/[0.04]',        bar: 'bg-[#4b5578]'   };

  return (
    <div className={cn(
      'bg-[#0a0f1e] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.012)] overflow-hidden transition-opacity border border-l-2',
      rule.enabled ? 'border-white/[0.04] border-l-blue-500' : 'border-white/[0.03] border-l-white/[0.04] opacity-60',
    )}>
      {/* Main row */}
      <div className="p-[14px_16px_14px_14px] flex gap-3 items-start">
        {/* Icon */}
        <div className="w-[34px] h-[34px] rounded-[10px] shrink-0 bg-[#0d1225] border border-white/[0.04] flex items-center justify-center mt-[1px]">
          <trig.Icon size={14} className={rule.enabled ? 'text-[#8b95b3]' : 'text-[#4b5578]'} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[7px] mb-1">
            <span className={cn('text-[13px] font-semibold', rule.enabled ? 'text-[#eef2ff]' : 'text-[#8b95b3]')}>{trig.label}</span>
            <span className="text-[9px] font-semibold text-[#4b5578] bg-[#0d1225] border border-white/[0.04] rounded-[4px] px-[6px] py-[1px] uppercase tracking-[0.07em]">
              {trig.cat}
            </span>
            {rule.enabled && (
              <span className="ml-auto flex items-center gap-1">
                <span className="w-[5px] h-[5px] rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span className="text-[9px] text-emerald-500">live</span>
              </span>
            )}
          </div>

          <div className="text-[11px] text-[#4b5578] overflow-hidden text-ellipsis whitespace-nowrap mb-[10px] leading-[1.5]">
            {(rule.message || "").replace("{name}", "member")}
          </div>

          <FlowDiagram rule={rule} trig={trig} />

          {(rule.stats?.sent > 0) && (
            <div className="flex gap-[14px] mt-3 pt-[10px] border-t border-white/[0.03]">
              {[
                { label: "Sent",          val: rule.stats.sent,                            hl: false },
                { label: "Returned",      val: rule.stats.returned,                        hl: false },
                { label: "Return rate",   val: `${rule.stats.rate}%`,                      hl: rule.stats.rate >= 30 },
                rule.stats.saved > 0 && { label: "Revenue saved", val: `$${rule.stats.saved}`, hl: true },
              ].filter(Boolean).map((s, i) => (
                <div key={i}>
                  <div className={cn('text-[13px] font-bold leading-none tabular-nums', s.hl ? 'text-[#eef2ff]' : 'text-[#8b95b3]')}>{s.val}</div>
                  <div className="text-[9px] text-[#4b5578] mt-[2px]">{s.label}</div>
                </div>
              ))}
              {rule.stats.rate > 0 && (
                <div className="flex-1 flex items-center ml-1">
                  <TinyBar pct={rule.stats.rate} colorCls={rule.stats.rate >= 40 ? 'bg-emerald-500' : 'bg-amber-400'} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={handleTest} className={cn(
            'h-[26px] px-2 rounded-[5px] text-[9.5px] font-semibold cursor-pointer flex items-center gap-[3px] transition-all border',
            testSent ? 'bg-emerald-500/[0.08] border-emerald-500/[0.18] text-emerald-500' : 'bg-[#0d1225] border-white/[0.04] text-[#4b5578]',
          )}>
            {testSent ? <><CheckCircle size={9} /> Sent</> : <><Send size={9} /> Test</>}
          </button>
          <button onClick={() => setOpen(v => !v)} className={cn(
            'h-[26px] w-[26px] rounded-[5px] flex items-center justify-center cursor-pointer transition-all border',
            open ? 'bg-blue-500/[0.10] border-blue-500/[0.22] text-blue-500' : 'bg-[#0d1225] border-white/[0.04] text-[#4b5578]',
          )}>
            <Edit3 size={10} />
          </button>
          <button onClick={onToggle} className={cn(
            'h-[26px] w-[26px] rounded-[5px] flex items-center justify-center cursor-pointer transition-all border',
            rule.enabled ? 'bg-emerald-500/[0.08] border-emerald-500/[0.18] text-emerald-500' : 'bg-[#0d1225] border-white/[0.04] text-[#4b5578]',
          )}>
            {rule.enabled ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
          </button>
          <button onClick={onDelete} className="h-[26px] w-[26px] rounded-[5px] flex items-center justify-center cursor-pointer transition-all border bg-[#0d1225] border-white/[0.04] text-[#4b5578] hover:bg-red-500/[0.08] hover:border-red-500/[0.18] hover:text-red-500">
            <Trash2 size={10} />
          </button>
        </div>
      </div>

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
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-[10px]">
        <span className="text-[11px] font-semibold text-[#8b95b3] uppercase tracking-[0.1em]">Suggested for your gym</span>
        <span className="text-[10px] font-semibold text-blue-500 bg-blue-500/[0.10] border border-blue-500/[0.22] px-[7px] py-[1px] rounded-full">AI</span>
      </div>
      <div className="flex gap-[10px] overflow-x-auto pb-1 [scrollbar-width:thin]">
        {available.map(rec => {
          const Icon = rec.icon;
          return (
            <div key={rec.id} className={cn(
              CARD, 'min-w-[240px] shrink-0 p-[14px_16px] border-l-2',
              urgencyBorderCls[rec.urgency],
            )}>
              <div className="flex items-start gap-2 mb-2">
                <div className="w-[26px] h-[26px] rounded-[6px] shrink-0 bg-[#0d1225] border border-white/[0.04] flex items-center justify-center">
                  <Icon size={11} className={urgencyTextCls[rec.urgency]} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#eef2ff] leading-[1.3]">{rec.title}</div>
                </div>
              </div>
              <div className="text-[11px] text-[#4b5578] leading-[1.5] mb-[10px]">{rec.body}</div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-500 font-semibold">{rec.impact}</span>
                <AppButton variant="primary" size="sm" onClick={() => onAdd(rec)}>
                  <Plus size={9} /> Create
                </AppButton>
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

  return (
    <div className={CARD}>
      <div className="px-4 py-3 border-b border-white/[0.03] flex items-center justify-between">
        <div className="flex items-center gap-[7px]">
          <span className="w-[6px] h-[6px] rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span className="text-xs font-semibold text-[#eef2ff]">Live activity</span>
        </div>
        <span className="text-[10px] text-[#4b5578]">{events.length} events</span>
      </div>
      <div ref={feedRef} className="max-h-[520px] overflow-y-auto py-[6px] [scrollbar-width:thin]">
        {events.map((ev, i) => {
          const cfg = typeConfig[ev.type] || typeConfig.sent;
          const Ic = cfg.Icon;
          return (
            <div key={ev.id}
              className={cn('px-[14px] py-[9px]', i < events.length - 1 && 'border-b border-white/[0.03]', ev.isNew && 'bg-blue-500/[0.024]')}
              style={ev.isNew ? { animation: 'slideDown 0.3s ease' } : undefined}
            >
              <div className="flex gap-[9px] items-start">
                <div className={cn('w-[22px] h-[22px] rounded-[6px] shrink-0 flex items-center justify-center mt-[1px] border', cfg.bgCls, cfg.brdCls)}>
                  <Ic size={9} className={cfg.textCls} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[#eef2ff] leading-[1.4]">
                    <span className="font-semibold">{ev.member}</span>
                    <span className="text-[#4b5578]">
                      {ev.type === "returned" ? " returned after automation" :
                       ev.type === "triggered" ? ` — ${ev.rule} triggered` :
                       ` — message sent`}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#4b5578] mt-[2px]">{ev.ago}</div>
                </div>
                {ev.type === "returned" && (
                  <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/[0.08] border border-emerald-500/[0.18] rounded-[4px] px-[6px] py-[1px] shrink-0">
                    win
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Template packs ─────────────────────────────────────────────── */
function TemplatePacks({ existingIds, onAddPack }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-[10px]">
        <span className="text-[11px] font-semibold text-[#8b95b3] uppercase tracking-[0.1em]">Quick-start templates</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {TEMPLATE_PACKS.map(tp => {
          const Icon = tp.icon;
          const allAdded = tp.triggers.every(id => existingIds.includes(id));
          return (
            <div key={tp.id} className={cn(CARD, 'min-w-[200px] shrink-0 p-[13px_15px]', allAdded && 'opacity-50')}>
              <div className="flex items-center gap-[7px] mb-[6px]">
                <Icon size={12} className="text-[#4b5578]" />
                <span className="text-xs font-semibold text-[#eef2ff]">{tp.label}</span>
              </div>
              <div className="text-[10px] text-[#4b5578] mb-[10px] leading-[1.5]">{tp.desc}</div>
              <AppButton variant="secondary" size="sm" className="w-full justify-center" onClick={() => !allAdded && onAddPack(tp)}>
                {allAdded ? "Already added" : <><Plus size={9} /> Add pack</>}
              </AppButton>
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
  const catCls = c => cat === c
    ? 'bg-blue-500/[0.10] text-blue-500 border-blue-500/[0.22]'
    : 'bg-[#0d1225] text-[#4b5578] border-white/[0.04]';
  const delayCls = v => delay === v
    ? 'bg-blue-500/[0.10] text-blue-500 border-blue-500/[0.22]'
    : 'bg-[#0d1225] text-[#4b5578] border-white/[0.04]';

  const pick = t => { setSelT(t); setMsg(TEMPLATES[t.id]?.(gymName, "{name}") || ""); };

  return (
    <div className={cn(CARD, 'mb-4')}>
      <div className="px-[18px] py-[14px] border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <div className="text-[13px] font-bold text-[#eef2ff]">New automation rule</div>
          <div className="text-[11px] text-[#4b5578] mt-[2px]">Choose a trigger, write a message, set timing.</div>
        </div>
        <button onClick={onClose} className="w-[26px] h-[26px] rounded-[6px] bg-[#0d1225] border border-white/[0.04] flex items-center justify-center cursor-pointer text-[#4b5578] hover:text-[#8b95b3] transition-colors">
          <X size={11} />
        </button>
      </div>
      <div className={cn('p-[16px_18px]', selected ? 'grid grid-cols-1 md:grid-cols-2 gap-[18px]' : '')}>
        <div>
          <div className="flex gap-1 mb-3 flex-wrap">
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={cn('px-[10px] py-[3px] rounded-full text-[10px] font-semibold cursor-pointer border transition-all', catCls(c))}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-[5px]">
            {available.map(t => {
              const Icon = t.Icon;
              const isSel = selected?.id === t.id;
              return (
                <button key={t.id} onClick={() => pick(t)}
                  className={cn(
                    'flex items-center gap-[9px] px-[11px] py-[9px] rounded-[10px] cursor-pointer text-left transition-all border',
                    isSel ? 'bg-blue-500/[0.10] border-blue-500/[0.22]' : 'bg-[#0d1225] border-white/[0.04] hover:border-white/[0.07]',
                  )}>
                  <div className={cn('w-[26px] h-[26px] rounded-[6px] shrink-0 flex items-center justify-center border', isSel ? 'bg-blue-500/[0.10] border-blue-500/[0.22]' : 'bg-[#0d1225] border-white/[0.04]')}>
                    <Icon size={11} className={isSel ? 'text-blue-500' : 'text-[#4b5578]'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-xs font-semibold', isSel ? 'text-[#eef2ff]' : 'text-[#8b95b3]')}>{t.label}</div>
                    <div className="text-[10px] text-[#4b5578]">{t.desc}</div>
                  </div>
                  {isSel && <ChevronRight size={11} className="text-blue-500" />}
                </button>
              );
            })}
            {available.length === 0 && (
              <div className="py-5 text-center text-xs text-[#4b5578]">All triggers in this category are active.</div>
            )}
          </div>
        </div>
        {selected && (
          <div>
            <div className="px-3 py-[10px] rounded-[10px] bg-blue-500/[0.10] border border-blue-500/[0.22] mb-[14px] flex items-center gap-2">
              <selected.Icon size={12} className="text-blue-500" />
              <span className="text-xs font-semibold text-[#eef2ff]">{selected.label}</span>
            </div>
            <div className="text-[10px] font-semibold text-[#4b5578] uppercase tracking-[0.1em] mb-[6px]">Message</div>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4}
              className="w-full box-border bg-[#0d1225] border border-white/[0.04] rounded-[10px] px-[10px] py-2 text-[#eef2ff] text-[11px] leading-[1.65] resize-y outline-none font-inherit mb-3 focus:border-white/[0.07] transition-colors"
            />
            <div className="text-[10px] font-semibold text-[#4b5578] uppercase tracking-[0.1em] mb-[6px]">Send timing</div>
            <div className="flex gap-1 flex-wrap mb-[14px]">
              {DELAYS.map(d => (
                <button key={d.v} onClick={() => setDelay(d.v)}
                  className={cn('px-[9px] py-1 rounded-[5px] text-[10px] font-medium cursor-pointer border transition-all', delayCls(d.v))}>
                  {d.label}
                </button>
              ))}
            </div>
            <AppButton
              variant="primary" size="sm"
              className={cn('w-full justify-center', !msg.trim() && 'opacity-50')}
              onClick={() => { if (msg.trim()) { onAdd({ trigger_id: selected.id, message: msg.trim(), delay_hours: delay, enabled: true, stats: { sent: 0, returned: 0, rate: 0, saved: 0 } }); onClose(); }}}
            >
              <Plus size={11} /> Add rule
            </AppButton>
          </div>
        )}
      </div>
    </div>
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
    <div className="min-h-screen bg-[#050810] text-[#eef2ff] text-[13px] leading-[1.5]">
      {/* Minimal keyframes for live animations only */}
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="max-w-[1320px] mx-auto px-6 pt-6 pb-[60px]">

        {/* Page header */}
        <div className="flex items-start justify-between mb-[22px] gap-3">
          <div>
            <div className="flex items-center gap-[9px] mb-1">
              <div className="w-7 h-7 rounded-[10px] bg-blue-500/[0.10] border border-blue-500/[0.22] flex items-center justify-center">
                <Zap size={13} className="text-blue-500" />
              </div>
              <h2 className="text-[18px] font-bold text-[#eef2ff] m-0 tracking-[-0.03em]">Automated engagement</h2>
              <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/[0.08] border border-emerald-500/[0.18] px-2 py-[2px] rounded-full flex items-center gap-1">
                <span className="w-[5px] h-[5px] rounded-full bg-emerald-500 inline-block animate-pulse" />
                {enabled.length} running
              </span>
            </div>
            <p className="text-xs text-[#4b5578] m-0 leading-[1.6]">
              Your gym is running itself. Messages go out automatically — no manual work required.
            </p>
          </div>
          <div className="flex gap-[7px] shrink-0">
            <AppButton variant="secondary" size="sm" onClick={() => setShowAdd(v => !v)}>
              {showAdd ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Add rule</>}
            </AppButton>
          </div>
        </div>

        {/* Performance summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px] mb-4">
          <StatCard icon={Send}        label="Messages sent"      sub="automatically this month" value={totalSent}      delay={0}   />
          <StatCard icon={Activity}    label="Members re-engaged" sub="returned after a message"  value={totalReturned}  delay={120} />
          <StatCard icon={DollarSign}  label="Revenue retained"   sub="from re-engaged members"  value={totalSaved}     delay={240} prefix="$" highlight />
          <StatCard icon={Bell}        label="Churn prevented"    sub="estimated cancellations"   value={churnPrevented} delay={360} />
        </div>

        {/* AI recommendations */}
        <Recommendations recs={RECOMMENDATIONS} existingIds={existingIds} onAdd={addFromRec} />

        {/* Add rule panel */}
        {showAdd && (
          <AddRulePanel gymName={gymName} existingIds={existingIds} onAdd={addRule} onClose={() => setShowAdd(false)} />
        )}

        {/* Rules list + Live feed */}
        <div className="grid gap-[14px] items-start" style={{ gridTemplateColumns: '1fr 284px' }}>

          {/* Left — rules list */}
          <div className="flex flex-col gap-[14px]">

            {/* Active rules */}
            <div>
              <div className="flex items-center justify-between mb-[10px]">
                <span className="text-[11px] font-semibold text-[#8b95b3] uppercase tracking-[0.1em]">Active automations</span>
                <span className="text-[11px] text-[#4b5578]">{enabled.length} of {rules.length}</span>
              </div>
              {enabled.length === 0 ? (
                <div className={cn(CARD, 'p-[36px_24px] text-center')}>
                  <div className="w-9 h-9 rounded-2xl bg-[#0d1225] border border-white/[0.04] flex items-center justify-center mx-auto mb-[10px]">
                    <Zap size={16} className="text-[#252d45]" />
                  </div>
                  <div className="text-[13px] font-semibold text-[#8b95b3] mb-1">No active automations</div>
                  <div className="text-[11px] text-[#4b5578] mb-[14px]">Add your first rule to start running on autopilot.</div>
                  <AppButton variant="secondary" size="sm" onClick={() => setShowAdd(true)}>
                    <Plus size={11} /> Add rule
                  </AppButton>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
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
                <div className="flex items-center gap-[6px] mb-[10px]">
                  <span className="text-[10px] font-semibold text-[#4b5578] uppercase tracking-[0.1em]">Paused</span>
                  <span className="text-[9px] text-[#252d45]">{paused.length}</span>
                </div>
                <div className="flex flex-col gap-[7px]">
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

            {/* Templates */}
            <div className="border-t border-white/[0.03] pt-[18px]">
              <TemplatePacks existingIds={existingIds} onAddPack={addPack} />
            </div>
          </div>

          {/* Right — live feed */}
          <div className="sticky top-6">
            <ActivityFeed events={activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
