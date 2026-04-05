import React, { useMemo, useState, useRef, useEffect } from "react";
import { format, subDays, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import {
  Trophy, BarChart2, Calendar, ChevronRight, TrendingUp, TrendingDown,
  Heart, MessageCircle, MoreHorizontal, Trash2, CheckCircle, Plus,
  Users, Flame, HelpCircle, ChevronLeft, List, Zap, Send, Star,
  ArrowUpRight, Activity, Clock,
} from "lucide-react";

/* ── Design tokens — TabEngagement system ───────────────────────── */
const T = {
  bg:         "#08090e",
  surface:    "#0f1016",
  surfaceEl:  "#14151d",
  surfaceHov: "#191a24",
  border:     "#1e2030",
  borderEl:   "#262840",
  divider:    "#141520",
  t1: "#ededf0", t2: "#9191a4", t3: "#525266", t4: "#2e2e42",
  accent:     "#4c6ef5",
  accentDim:  "#1a2048",
  accentBrd:  "#263070",
  red:        "#c0392b",
  redDim:     "#160f0d",
  redBrd:     "#2e1614",
  amber:      "#b07b30",
  amberDim:   "#161008",
  amberBrd:   "#2a2010",
  green:      "#2d8a62",
  greenDim:   "#091912",
  greenBrd:   "#132e20",
  r:   "8px",
  rsm: "6px",
  sh:  "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.025)",
};

/* ── Mock data ──────────────────────────────────────────────────── */
const NOW = new Date();

const MOCK_POSTS = [
  { id:"p1", author_name:"Apex Fitness", title:"Monday Morning Motivation 💪", content:"Every rep counts. Every session matters. Show up today and show up tomorrow.", likes:["m1","m2","m3","m4","m5"], comments:[{user_id:"m1"},{user_id:"m2"}], created_date: subDays(NOW,1).toISOString() },
  { id:"p2", author_name:"Apex Fitness", title:"Member Spotlight — Priya Sharma", content:"Priya has hit 50 visits this month. An absolute machine. Drop a 🔥 below!", likes:["m1","m3","m6"], comments:[{user_id:"m4"},{user_id:"m5"},{user_id:"m6"}], created_date: subDays(NOW,2).toISOString() },
  { id:"p3", author_name:"Apex Fitness", title:"New class: Saturday Strength", content:"Starting this Saturday at 9am — 45 minutes, all levels welcome.", likes:["m2","m5"], comments:[], created_date: subDays(NOW,4).toISOString() },
];

const MOCK_EVENTS = [
  { id:"e1", title:"Summer Shred Challenge — Kickoff", description:"Weigh-in, team assignment, and kick-off workout.", event_date: new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()+3).toISOString() },
  { id:"e2", title:"Community Social — Rooftop BBQ", description:"Bring a friend. Food, drinks, and good company.", event_date: new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()+12).toISOString() },
];

const MOCK_CHALLENGES = [
  { id:"c1", title:"30-Day Consistency Challenge", status:"active", start_date: subDays(NOW,10).toISOString(), end_date: new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()+20).toISOString(), participants:["m1","m2","m3","m4","m5","m6","m7"] },
  { id:"c2", title:"1000 Push-Up Weekend", status:"active", start_date: subDays(NOW,1).toISOString(), end_date: new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()+2).toISOString(), participants:["m1","m3","m5"] },
];

const MOCK_POLLS = [
  { id:"pl1", title:"What time works best for an early morning class?", voters:["m1","m2","m3","m4"], created_date: subDays(NOW,3).toISOString() },
];

const MOCK_CLASSES = [
  { id:"cl1", name:"HIIT Blast", instructor:"Coach Dan", duration_minutes:45, created_date: subDays(NOW,5).toISOString() },
  { id:"cl2", name:"Yoga Flow", instructor:"Coach Maya", duration_minutes:60, created_date: subDays(NOW,7).toISOString() },
];

const MOCK_MEMBERSHIPS = Array.from({ length: 14 }, (_, i) => ({ id:`m${i+1}` }));

/* ── Primitives ─────────────────────────────────────────────────── */
function Card({ children, style = {}, accent = false }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${accent ? T.accentBrd : T.border}`,
      borderLeft: accent ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
      borderRadius: T.r,
      boxShadow: T.sh,
      overflow: "hidden",
      ...style,
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
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "5px 10px", borderRadius: T.rsm, fontSize: 11, fontWeight: 500,
        cursor: "pointer", fontFamily: "inherit", border: "1px solid",
        background: danger && hov ? T.redDim : hov ? T.surfaceHov : T.surfaceEl,
        borderColor: danger && hov ? T.redBrd : hov ? T.borderEl : T.border,
        color: danger && hov ? T.red : T.t2,
        transition: "all .12s", ...style,
      }}>{children}</button>
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
      }}>{children}</button>
  );
}

function Pill({ children, color = T.accent, bg = T.accentDim, brd = T.accentBrd }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 500,
      color, background: bg, border: `1px solid ${brd}`,
    }}>{children}</span>
  );
}

function IconBox({ icon: Icon, color = T.t3, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: T.rsm, flexShrink: 0,
      background: T.surfaceEl, border: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={size * 0.4} color={color} />
    </div>
  );
}

function Av({ name = "", size = 28 }) {
  const letters = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const hue = (name.charCodeAt(0) || 72) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: T.rsm, flexShrink: 0,
      background: `hsl(${hue},25%,10%)`, border: `1px solid hsl(${hue},25%,18%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, color: `hsl(${hue},50%,55%)`,
    }}>{letters}</div>
  );
}

/* ── Delete button ──────────────────────────────────────────────── */
function DelBtn({ onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: `1px solid ${T.border}`, borderRadius: T.rsm,
          cursor: "pointer", transition: "all .1s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = T.borderEl}
        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
        <MoreHorizontal size={10} color={T.t3} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: 28, right: 0, zIndex: 9999,
          background: T.surfaceEl, border: `1px solid ${T.borderEl}`,
          borderRadius: T.r, boxShadow: "0 8px 28px rgba(0,0,0,.75)", minWidth: 110, overflow: "hidden",
        }}>
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); onDelete?.(); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 7,
              padding: "9px 13px", fontSize: 11, fontWeight: 600, color: T.red,
              background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.redDim}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <Trash2 size={10} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Tiny progress bar ──────────────────────────────────────────── */
function TinyBar({ pct, color }) {
  return (
    <div style={{ height: 2, borderRadius: 99, background: T.divider, flex: 1 }}>
      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: color, opacity: 0.8 }} />
    </div>
  );
}

/* ── Metrics bar ────────────────────────────────────────────────── */
function MetricsBar({ allPosts, allMemberships, now }) {
  const weekPosts = allPosts.filter(p => new Date(p.created_date || 0) >= subDays(now, 7));
  const totalMem  = allMemberships.length;
  const totalInt  = allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0);
  const engRate   = totalMem > 0 ? Math.round((totalInt / totalMem) * 100) : 0;
  const activeMem = new Set([
    ...allPosts.flatMap(p => p.likes || []),
    ...allPosts.flatMap(p => (p.comments || []).map(c => c.user_id).filter(Boolean)),
  ]).size;
  const typeMap = {};
  allPosts.forEach(p => {
    const type = (p.image_url || p.media_url) ? "Photo" : p.poll_options ? "Poll" : "Text";
    typeMap[type] = (typeMap[type] || 0) + (p.likes?.length || 0) + (p.comments?.length || 0) * 2;
  });
  const bestType = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const wkColor  = weekPosts.length < 2 ? T.red : weekPosts.length < 4 ? T.amber : T.green;

  const metrics = [
    { Icon: Flame,    label: "Posts This Week",    val: String(weekPosts.length), sub: "3×/week = +40% retention",  dot: wkColor   },
    { Icon: BarChart2,label: "Engagement Rate",    val: `${engRate}%`,           sub: `${totalMem} members tracked`, dot: engRate > 0 ? T.green : T.t4 },
    { Icon: Users,    label: "Actively Engaging",  val: String(activeMem),       sub: "liked or commented recently", dot: activeMem > 0 ? T.green : T.t4 },
    { Icon: Trophy,   label: "Top Post Type",      val: bestType,                sub: "best for interactions",       dot: T.amber   },
  ];

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(4,1fr)",
      borderBottom: `1px solid ${T.border}`,
      background: T.surface,
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          padding: "16px 20px",
          borderRight: i < 3 ? `1px solid ${T.border}` : "none",
          transition: "background .12s",
          cursor: "default",
        }}
          onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
          onMouseLeave={e => e.currentTarget.style.background = T.surface}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <m.Icon size={11} color={T.t3} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: ".1em" }}>{m.label}</span>
            <div style={{ marginLeft: "auto" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: m.dot }} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.t1, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 5, fontVariantNumeric: "tabular-nums" }}>
            {m.val}
          </div>
          <div style={{ fontSize: 10, color: T.t3, lineHeight: 1.5 }}>{m.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Quick post ideas ───────────────────────────────────────────── */
const QUICK_IDEAS = [
  { Icon: Flame,   color: T.amber,  title: "Motivation Monday",          desc: "Drives comments & reactions",  cta: "Generate post",    modal: "post"      },
  { Icon: Users,   color: T.accent, title: "Member Spotlight",            desc: "Builds community loyalty",     cta: "Create spotlight", modal: "post"      },
  { Icon: Trophy,  color: T.green,  title: "Start a weekend challenge",   desc: "Increases visit frequency",   cta: "Start challenge",  modal: "challenge" },
];

function QuickIdeas({ openModal }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.t2, textTransform: "uppercase", letterSpacing: ".1em" }}>
          Quick post ideas
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
        {QUICK_IDEAS.map((c, i) => (
          <div
            key={i}
            onClick={() => openModal?.(c.modal)}
            style={{
              padding: "16px",
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: T.r, boxShadow: T.sh,
              cursor: "pointer", transition: "border-color .15s, transform .15s",
              display: "flex", flexDirection: "column", gap: 14, overflow: "hidden",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderEl; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;   e.currentTarget.style.transform = "none"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{
                width: 38, height: 38, borderRadius: T.rsm, flexShrink: 0,
                background: T.surfaceEl, border: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <c.Icon size={16} color={c.color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, lineHeight: 1.25, marginBottom: 3 }}>{c.title}</div>
                <div style={{ fontSize: 10, color: T.t3, lineHeight: 1.4 }}>{c.desc}</div>
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); openModal?.(c.modal); }}
              style={{
                width: "100%", padding: "7px 0",
                borderRadius: T.rsm, fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                background: T.accent, border: "none", color: "#fff",
                transition: "opacity .1s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              {c.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Feed cards ─────────────────────────────────────────────────── */
function FeedPostCard({ post, onDelete, isTop, totalMembers }) {
  const likes    = post.likes?.length    || 0;
  const comments = post.comments?.length || 0;
  const engRate  = totalMembers > 0 ? Math.round(((likes + comments) / totalMembers) * 100) : 0;
  const title    = post.title || (post.content || "").split("\n")[0] || "";
  const body     = post.title ? (post.content || "") : "";

  return (
    <Card accent={isTop}>
      {/* Header */}
      <div style={{ padding: "13px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Av name={post.author_name || "G"} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {post.author_name || "Gym Post"}
            </div>
            <div style={{ fontSize: 10, color: T.t3 }}>
              {post.created_date ? format(new Date(post.created_date), "MMM d") : ""}
            </div>
          </div>
          {isTop && (
            <Pill color={T.amber} bg={T.amberDim} brd={T.amberBrd}>
              <Star size={8} /> Top Post
            </Pill>
          )}
          <DelBtn onDelete={() => onDelete?.(post.id)} />
        </div>
      </div>

      {/* Content */}
      {title && (
        <div style={{ padding: "10px 14px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: T.t1, margin: "0 0 4px", lineHeight: 1.4 }}>{title}</p>
          {body && (
            <p style={{ fontSize: 11, color: T.t2, margin: 0, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{body}</p>
          )}
        </div>
      )}

      {/* Footer stats */}
      <div style={{ padding: "9px 14px 12px", display: "flex", alignItems: "center", gap: 12, borderTop: `1px solid ${T.divider}` }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: T.t3 }}>
          <Heart size={10} /> {likes}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: T.t3 }}>
          <MessageCircle size={10} /> {comments}
        </span>
        {engRate > 0 && (
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: T.green, background: T.greenDim, border: `1px solid ${T.greenBrd}`, borderRadius: 4, padding: "2px 7px" }}>
            {engRate}% engaged
          </span>
        )}
        {engRate > 0 && (
          <div style={{ width: 48 }}>
            <TinyBar pct={Math.min(engRate * 2, 100)} color={T.green} />
          </div>
        )}
      </div>
    </Card>
  );
}

function EventCard({ event, now, onDelete }) {
  const evDate = new Date(event.event_date);
  const diff   = Math.max(0, Math.floor((evDate - now) / 86400000));
  const urgency = diff <= 2;
  return (
    <Card>
      <div style={{ padding: "13px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: T.rsm, flexShrink: 0,
            background: T.surfaceEl, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Calendar size={14} color={T.t3} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <Pill>Event</Pill>
              <Pill
                color={urgency ? T.amber : T.t3}
                bg={urgency ? T.amberDim : T.surfaceEl}
                brd={urgency ? T.amberBrd : T.border}>
                {diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : `${diff}d away`}
              </Pill>
              <div style={{ marginLeft: "auto" }}><DelBtn onDelete={() => onDelete?.(event.id)} /></div>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.t1, margin: "0 0 4px" }}>{event.title}</p>
            {event.description && <p style={{ fontSize: 11, color: T.t2, margin: "0 0 6px", lineHeight: 1.5 }}>{event.description}</p>}
            <div style={{ fontSize: 10, color: T.t3 }}>{format(evDate, "MMM d, h:mm a")}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ChallengeCard({ challenge, now, onDelete }) {
  const start  = new Date(challenge.start_date), end = new Date(challenge.end_date);
  const totalD = Math.max(1, Math.floor((end - start) / 86400000));
  const elapsed= Math.max(0, Math.floor((now - start) / 86400000));
  const rem    = Math.max(0, totalD - elapsed);
  const pct    = Math.min(100, Math.round((elapsed / totalD) * 100));
  const parts  = challenge.participants?.length || 0;
  return (
    <Card>
      <div style={{ padding: "13px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: T.rsm, flexShrink: 0, background: T.surfaceEl, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trophy size={14} color={T.amber} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <Pill color={T.amber} bg={T.amberDim} brd={T.amberBrd}>Challenge</Pill>
              <Pill color={T.t3} bg={T.surfaceEl} brd={T.border}>{rem}d left</Pill>
              <div style={{ marginLeft: "auto" }}><DelBtn onDelete={() => onDelete?.(challenge.id)} /></div>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.t1, margin: "0 0 10px" }}>{challenge.title}</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: T.t3 }}>{parts} joined</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.accent }}>{pct}%</span>
            </div>
            <div style={{ height: 2, borderRadius: 99, background: T.divider }}>
              <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: T.accent, opacity: 0.8 }} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PollCard({ poll, onDelete, allMemberships }) {
  const votes = poll.voters?.length || 0;
  const total = allMemberships?.length || 0;
  const pct   = total > 0 ? Math.round((votes / total) * 100) : 0;
  return (
    <Card>
      <div style={{ padding: "13px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: T.rsm, flexShrink: 0, background: T.surfaceEl, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={14} color={T.t3} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <Pill>Poll</Pill>
              {pct > 0 && <Pill color={T.t3} bg={T.surfaceEl} brd={T.border}>{pct}% voted</Pill>}
              <div style={{ marginLeft: "auto" }}><DelBtn onDelete={() => onDelete?.(poll.id)} /></div>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.t1, margin: "0 0 10px" }}>{poll.title}</p>
            <div style={{ height: 2, borderRadius: 99, background: T.divider, marginBottom: 5 }}>
              <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: T.accent, opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: 10, color: T.t3 }}>{votes} vote{votes !== 1 ? "s" : ""}{total > 0 ? ` of ${total} members` : ""}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

const CLS_TYPES = { hiit:"HIIT", yoga:"Yoga", strength:"Strength", default:"Class" };
function getClsType(c) {
  const n = (c.class_type || c.name || "").toLowerCase();
  if (n.includes("hiit") || n.includes("interval")) return "hiit";
  if (n.includes("yoga") || n.includes("flow"))     return "yoga";
  if (n.includes("strength") || n.includes("lift")) return "strength";
  return "default";
}
function ClassCard({ gymClass, onDelete }) {
  const type = getClsType(gymClass);
  const typeColor = { hiit: T.red, yoga: T.green, strength: T.amber, default: T.accent }[type];
  return (
    <Card>
      <div style={{ padding: "13px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: T.rsm, flexShrink: 0, background: T.surfaceEl, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={14} color={typeColor} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <Pill color={typeColor} bg={T.surfaceEl} brd={T.border}>{CLS_TYPES[type]}</Pill>
              {gymClass.duration_minutes && (
                <Pill color={T.t3} bg={T.surfaceEl} brd={T.border}>
                  <Clock size={8} /> {gymClass.duration_minutes}m
                </Pill>
              )}
              <div style={{ marginLeft: "auto" }}><DelBtn onDelete={() => onDelete?.(gymClass.id)} /></div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {gymClass.name || gymClass.title}
            </div>
            {gymClass.instructor && (
              <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{gymClass.instructor}</div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── Empty state ────────────────────────────────────────────────── */
function EmptyState({ openModal, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", gap: 14, textAlign: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: T.r, background: T.surfaceEl, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Zap size={18} color={T.t4} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: T.t2, margin: "0 0 6px" }}>
          {label ? `No ${label} yet` : "Your feed is empty"}
        </p>
        <p style={{ fontSize: 11, color: T.t3, margin: 0, lineHeight: 1.6 }}>
          Create content to keep your members engaged and coming back.
        </p>
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center" }}>
        <PrimaryBtn onClick={() => openModal?.("post")}><Plus size={11} /> Create first post</PrimaryBtn>
        <GhostBtn onClick={() => openModal?.("challenge")}><Trophy size={11} /> Start a challenge</GhostBtn>
        <GhostBtn onClick={() => openModal?.("poll")}><HelpCircle size={11} /> Ask a question</GhostBtn>
      </div>
    </div>
  );
}

/* ── Calendar view ──────────────────────────────────────────────── */
function CalendarView({ allPosts, events, now, openModal }) {
  const [viewMonth, setViewMonth] = useState(now);
  const ms   = startOfMonth(viewMonth), me = endOfMonth(viewMonth);
  const days   = eachDayOfInterval({ start: ms, end: me });
  const blanks = Array(getDay(ms)).fill(null);
  const DOW    = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const postDates = new Set(allPosts.map(p => format(new Date(p.created_date || 0), "yyyy-MM-dd")));
  const evDates   = new Set(events.map(e => format(new Date(e.event_date || 0), "yyyy-MM-dd")));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => setViewMonth(subDays(ms, 1))} style={{ background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: T.rsm, padding: "4px 7px", cursor: "pointer", color: T.t2, display: "flex" }}>
          <ChevronLeft size={12} />
        </button>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.t1 }}>{format(viewMonth, "MMMM yyyy")}</span>
        <button onClick={() => setViewMonth(new Date(me.getTime() + 86400000))} style={{ background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: T.rsm, padding: "4px 7px", cursor: "pointer", color: T.t2, display: "flex" }}>
          <ChevronRight size={12} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {DOW.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 600, color: T.t4, padding: "2px 0", letterSpacing: ".06em" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const key     = format(day, "yyyy-MM-dd");
          const hasPost = postDates.has(key);
          const hasEv   = evDates.has(key);
          const today   = isToday(day);
          return (
            <div key={key} style={{
              height: 26, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, borderRadius: T.rsm, position: "relative",
              color: today ? "#fff" : T.t2, fontWeight: today ? 700 : 500,
              background: today ? T.accent : "transparent",
              cursor: "default", transition: "background .1s",
            }}
              onMouseEnter={e => { if (!today) e.currentTarget.style.background = T.surfaceEl; }}
              onMouseLeave={e => { if (!today) e.currentTarget.style.background = "transparent"; }}>
              {format(day, "d")}
              {(hasPost || hasEv) && !today && (
                <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 }}>
                  {hasPost && <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.accent }} />}
                  {hasEv   && <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.amber }} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, padding: 12, borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          <CheckCircle size={9} color={T.green} />
          <span style={{ fontSize: 10, color: T.t3 }}>Best engagement time: <span style={{ color: T.green, fontWeight: 600 }}>5–7 pm</span></span>
        </div>
        <div style={{ fontSize: 10, color: T.t4, lineHeight: 1.5 }}>Fill your calendar — consistent posting keeps members coming back.</div>
      </div>

      <PrimaryBtn onClick={() => openModal?.("post")} style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>
        <Plus size={11} /> Schedule a Post
      </PrimaryBtn>
    </div>
  );
}

/* ── Right panel: AI suggestions ────────────────────────────────── */
const AI_SUGGS = [
  { dot: T.accent, label: "Motivation Monday", sub: "Share a quote · drives comments", modal: "post" },
  { dot: T.green,  label: "Post a member spotlight", sub: "Feature a dedicated member", modal: "post" },
  { dot: T.amber,  label: "Start a weekend challenge", sub: "Increases visit frequency", modal: "challenge" },
];

function AISuggestions({ openModal }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.t2, textTransform: "uppercase", letterSpacing: ".1em" }}>
          What to post today
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: T.accent, background: T.accentDim, border: `1px solid ${T.accentBrd}`, padding: "1px 7px", borderRadius: 20 }}>AI</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {AI_SUGGS.map((s, i) => (
          <div
            key={i}
            onClick={() => openModal?.(s.modal)}
            style={{
              padding: "10px 12px", borderRadius: T.rsm,
              background: T.surfaceEl, border: `1px solid ${T.border}`,
              cursor: "pointer", transition: "all .1s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderEl; e.currentTarget.style.background = T.surfaceHov; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;   e.currentTarget.style.background = T.surfaceEl; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.t1 }}>{s.label}</span>
              <ChevronRight size={9} color={T.t4} style={{ marginLeft: "auto" }} />
            </div>
            <div style={{ fontSize: 10, color: T.t3, paddingLeft: 11 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Right panel: Engagement score ──────────────────────────────── */
function EngagementScore({ allPosts, polls, activeChallenges, now, openModal }) {
  const score = (s, e) =>
    allPosts.filter(x => { const d = new Date(x.created_date || 0); return d >= s && d < e; })
      .reduce((a, x) => a + (x.likes?.length || 0) + (x.comments?.length || 0), 0);
  const thisW = score(subDays(now, 7), now);
  const lastW = score(subDays(now, 14), subDays(now, 7));
  const chg   = lastW === 0 ? 0 : Math.round(((thisW - lastW) / lastW) * 100);
  const up    = chg >= 0;
  const likes    = allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0);
  const comments = allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0);
  const challP   = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);
  const pollV    = polls.reduce((s, p) => s + (p.voters?.length || 0), 0);
  const total    = likes + comments + challP + pollV;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.t2, textTransform: "uppercase", letterSpacing: ".1em" }}>Engagement score</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 3 }}>
        <span style={{ fontSize: 34, fontWeight: 700, color: T.t1, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{total}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: up ? T.green : T.red }}>
          {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {up ? "+" : ""}{chg}% this week
        </span>
      </div>
      <div style={{ fontSize: 10, color: T.t3, marginBottom: 14 }}>Total interactions</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {[
          { l: `${likes} likes`,    r: `${challP} challenge` },
          { l: `${comments} comments`, r: `${pollV} poll votes` },
        ].map((row, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "6px 0", borderBottom: `1px solid ${T.divider}` }}>
            <span style={{ color: T.t2, fontWeight: 500 }}>{row.l}</span>
            <span style={{ color: T.t3 }}>{row.r}</span>
          </div>
        ))}
      </div>

      <PrimaryBtn onClick={() => openModal?.("post")} style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
        <Plus size={11} /> Create content
      </PrimaryBtn>
    </div>
  );
}

/* ── Right panel ────────────────────────────────────────────────── */
function RightPanel({ allPosts, polls, challenges, events, activeChallenges, allMemberships, now, openModal }) {
  const [view, setView] = useState("feed");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toggle */}
      <div style={{ display: "inline-flex", gap: 2, background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: T.r, padding: 2 }}>
        {[{ id:"feed", Icon:Flame, label:"Feed" },{ id:"cal", Icon:Calendar, label:"Calendar" }].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "5px 11px", borderRadius: T.rsm, fontSize: 11, fontWeight: 600,
            cursor: "pointer", border: "none", fontFamily: "inherit", transition: "all .12s",
            background: view === tab.id ? T.accent : "transparent",
            color: view === tab.id ? "#fff" : T.t3,
          }}>
            <tab.Icon size={10} /> {tab.label}
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: T.divider }} />

      {view === "feed" ? (
        <>
          <AISuggestions openModal={openModal} />
          <div style={{ height: 1, background: T.divider }} />
          <EngagementScore allPosts={allPosts} polls={polls} activeChallenges={activeChallenges} now={now} openModal={openModal} />
        </>
      ) : (
        <CalendarView allPosts={allPosts} events={events} now={now} openModal={openModal} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function TabContent({
  events        = MOCK_EVENTS,
  challenges    = MOCK_CHALLENGES,
  polls         = MOCK_POLLS,
  posts         = MOCK_POSTS,
  userPosts     = [],
  openModal     = () => {},
  now           = NOW,
  allMemberships= MOCK_MEMBERSHIPS,
  classes       = MOCK_CLASSES,
  onDeletePost      = () => {},
  onDeleteEvent     = () => {},
  onDeleteChallenge = () => {},
  onDeleteClass     = () => {},
  onDeletePoll      = () => {},
  isCoach = false,
}) {
  const [activeFilter, setActiveFilter] = useState(isCoach ? "classes" : "gym");
  const [viewMode,     setViewMode]     = useState("feed");

  const allPosts         = [...(userPosts || []), ...(posts || [])].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const gymPosts         = allPosts.filter(p => !p.user_id || p.gym_id || p.member_id);
  const memberPosts      = allPosts.filter(p => p.user_id && !p.gym_id);
  const upcomingEvents   = events.filter(e => new Date(e.event_date) >= now);
  const activeChallenges = challenges.filter(c => c.status === "active");
  const totalMembers     = allMemberships.length;

  const postScores = useMemo(() => allPosts.map(p => ({ id: p.id, score: (p.likes?.length || 0) + (p.comments?.length || 0) * 2 })), [allPosts]);
  const maxScore   = Math.max(...postScores.map(p => p.score), 1);
  const topPostIds = new Set(postScores.filter(p => p.score >= maxScore * 0.7 && p.score > 0).map(p => p.id));

  const FILTERS = isCoach
    ? [{ id:"classes",label:"My Classes" },{ id:"gym",label:"Posts" },{ id:"challenges",label:"Challenges" },{ id:"polls",label:"Polls" },{ id:"events",label:"Events" }]
    : [{ id:"gym",label:"Feed" },{ id:"members",label:"Members" },{ id:"challenges",label:"Challenges" },{ id:"classes",label:"Classes" },{ id:"polls",label:"Polls" }];

  const feedItems = useMemo(() => {
    const fi = (() => {
      switch (activeFilter) {
        case "members":    return { posts:memberPosts, events:[], challenges:[], polls:[], classes:[] };
        case "gym":        return { posts:gymPosts, events:[], challenges:[], polls:[], classes:[] };
        case "challenges": return { posts:[], events:[], challenges:activeChallenges, polls:[], classes:[] };
        case "classes":    return { posts:[], events:[], challenges:[], polls:[], classes };
        case "polls":      return { posts:[], events:[], challenges:[], polls, classes:[] };
        case "events":     return { posts:[], events:upcomingEvents, challenges:[], polls:[], classes:[] };
        default:           return { posts:allPosts, events:upcomingEvents, challenges:activeChallenges, polls, classes };
      }
    })();
    return [
      ...fi.posts.map(p      => ({ type:"post",      data:p, date:new Date(p.created_date || 0) })),
      ...fi.events.map(e     => ({ type:"event",     data:e, date:new Date(e.event_date    || 0) })),
      ...fi.challenges.map(c => ({ type:"challenge", data:c, date:new Date(c.start_date    || 0) })),
      ...fi.polls.map(p      => ({ type:"poll",      data:p, date:new Date(p.created_date  || 0) })),
      ...fi.classes.map(c    => ({ type:"class",     data:c, date:new Date(c.created_date  || 0) })),
    ].sort((a, b) => b.date - a.date);
  }, [activeFilter, allPosts, gymPosts, memberPosts, upcomingEvents, activeChallenges, polls, classes]);

  const renderItem = (item, i) => {
    if (item.type === "post")      return <FeedPostCard  key={item.data.id||i} post={item.data}      onDelete={onDeletePost}      isTop={topPostIds.has(item.data.id)} totalMembers={totalMembers} />;
    if (item.type === "event")     return <EventCard     key={item.data.id||i} event={item.data}     onDelete={onDeleteEvent}     now={now} />;
    if (item.type === "challenge") return <ChallengeCard key={item.data.id||i} challenge={item.data} onDelete={onDeleteChallenge} now={now} />;
    if (item.type === "poll")      return <PollCard      key={item.data.id||i} poll={item.data}      onDelete={onDeletePoll}      allMemberships={allMemberships} />;
    if (item.type === "class")     return <ClassCard     key={item.data.id||i} gymClass={item.data}  onDelete={onDeleteClass} />;
    return null;
  };

  const currentLabel = FILTERS.find(f => f.id === activeFilter)?.label;

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      fontFamily: "'Geist','DM Sans','Helvetica Neue',Arial,sans-serif",
      color: T.t1, fontSize: 13, lineHeight: 1.5,
    }}>
      <style>{`
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
      `}</style>

      {/* Metrics bar */}
      <MetricsBar allPosts={allPosts} allMemberships={allMemberships} now={now} />

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", minHeight: "calc(100vh - 90px)" }}>

        {/* ── Center ── */}
        <div style={{ padding: "22px 24px 60px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: T.rsm, background: T.accentDim, border: `1px solid ${T.accentBrd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={13} color={T.accent} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: T.t1, margin: 0, letterSpacing: "-0.03em" }}>Member content</h2>
              </div>
              <p style={{ fontSize: 12, color: T.t3, margin: 0 }}>Keep your members engaged — posts, events, challenges, and polls all in one place.</p>
            </div>
            <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
              <PrimaryBtn onClick={() => openModal?.("post")}><Plus size={11} /> Create post</PrimaryBtn>
              <GhostBtn onClick={() => openModal?.("challenge")}><Trophy size={11} /> Challenge</GhostBtn>
              <GhostBtn onClick={() => openModal?.("poll")}><HelpCircle size={11} /> Poll</GhostBtn>
            </div>
          </div>

          {/* Quick post ideas */}
          <QuickIdeas openModal={openModal} />

          {/* Feed/Calendar toggle */}
          <div style={{ display: "inline-flex", gap: 2, background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: T.r, padding: 2, alignSelf: "flex-start" }}>
            {[{ id:"feed",Icon:List,label:"Feed" },{ id:"calendar",Icon:Calendar,label:"Calendar" }].map(tab => (
              <button key={tab.id} onClick={() => setViewMode(tab.id)} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "5px 11px", borderRadius: T.rsm, fontSize: 11, fontWeight: 600,
                cursor: "pointer", border: "none", fontFamily: "inherit", transition: "all .12s",
                background: viewMode === tab.id ? T.accent : "transparent",
                color: viewMode === tab.id ? "#fff" : T.t3,
              }}>
                <tab.Icon size={10} /> {tab.label}
              </button>
            ))}
          </div>

          {viewMode === "calendar" ? (
            <CalendarView allPosts={allPosts} events={events} now={now} openModal={openModal} />
          ) : (
            <>
              {/* Filter tabs */}
              <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${T.border}`, overflowX: "auto", marginTop: -6 }}>
                {FILTERS.map(f => (
                  <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{
                    padding: "8px 14px", fontSize: 12, fontFamily: "inherit", background: "none",
                    border: "none", borderBottom: `2px solid ${activeFilter === f.id ? T.accent : "transparent"}`,
                    cursor: "pointer", transition: "all .1s", color: activeFilter === f.id ? T.t1 : T.t3,
                    fontWeight: activeFilter === f.id ? 600 : 500, marginBottom: -1, whiteSpace: "nowrap",
                  }}>
                    {f.label}
                  </button>
                ))}
              </div>

              {feedItems.length > 0
                ? <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{feedItems.map(renderItem)}</div>
                : <EmptyState openModal={openModal} label={currentLabel !== "Feed" ? currentLabel : null} />}
            </>
          )}
        </div>

        {/* ── Right panel ── */}
        <div style={{
          padding: "18px 16px 40px", overflowY: "auto",
          borderLeft: `1px solid ${T.border}`, background: T.surface,
        }}>
          <RightPanel
            allPosts={allPosts} polls={polls} challenges={challenges}
            events={events} activeChallenges={activeChallenges}
            allMemberships={allMemberships} now={now} openModal={openModal}
          />
        </div>
      </div>
    </div>
  );
}
f