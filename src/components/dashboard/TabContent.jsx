import { useState, useEffect, useRef } from "react";
import {
ChevronDown, Plus, Flame, Facebook, Instagram, Heart, MessageCircle,
ChevronRight, Check, AlertTriangle, X, MoreHorizontal,
} from "lucide-react";
/* ─── MOBILE HOOK ────────────────────────────────────────────── */
function useIsMobile(breakpoint = 768) {
const [isMobile, setIsMobile] = useState(
typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
return isMobile;
}
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
  cyan:     "#4d7fff",          // blue-500
  cyanDim:  "rgba(77,127,255,0.12)",
  cyanBrd:  "rgba(77,127,255,0.28)",
  red:      "#ff4d6d",
  redDim:   "rgba(255,77,109,0.15)",
  green:    "#22c55e",
  greenDim: "rgba(34,197,94,0.12)",};
const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";
/* ─── PRIMITIVES ─────────────────────────────────────────────── */
function Avatar({ name = "", size = 28 }) {
const palette = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#ef4444","#4d7fff","#10b981"];
const bg = palette[(name.charCodeAt(0) || 0) % palette.length];
const letters = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: bg, border: `1.5px solid ${C.card}`, color: "#fff", fontSize: size * 0.36, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {letters}
    </div>
  );
}
function PlatformPill({ type }) {
const map = {
    instagram: { bg: "rgba(168,85,247,0.12)", brd: "rgba(168,85,247,0.3)", Icon: Instagram, color: "#a855f7" },
    facebook:  { bg: "rgba(77,127,255,0.12)",  brd: "rgba(77,127,255,0.3)",  Icon: Facebook,  color: "#60a5fa" },
  };
const s = map[type]; if (!s) return null;
return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: s.bg, border: `1px solid ${s.brd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <s.Icon size={11} color={s.color} />
    </div>
  );
}
function AiBadge() {
return <span style={{ padding: "2px 6px", borderRadius: 4, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, fontSize: 9.5, fontWeight: 800, color: C.cyan, letterSpacing: "0.05em" }}>AI</span>;
}
function ScheduledBadge() {
return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: C.greenDim, border: "1px solid rgba(34,197,94,0.25)", fontSize: 11, fontWeight: 700, color: C.green }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />Scheduled
    </span>
  );
}
function Checkbox({ checked, onChange }) {
return (
    <div onClick={onChange} style={{ width: 14, height: 14, borderRadius: 3, cursor: "pointer", flexShrink: 0, background: checked ? C.cyan : "transparent", border: `1.5px solid ${checked ? C.cyan : C.t3}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: checked ? `0 0 4px rgba(77,127,255,0.2)` : "none" }}>
      {checked && <Check size={8} color="#fff" strokeWidth={3} />}
    </div>
  );
}
function DeleteBtn({ onClick }) {
return <button onClick={onClick} style={{ background: C.redDim, border: `1px solid rgba(255,77,109,0.3)`, borderRadius: 6, padding: "4px 10px", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT, flexShrink: 0, minHeight: 36 }}>Delete</button>;
}
/* ─── ALERT BANNER ───────────────────────────────────────────── */
function AlertBanner({ onDismiss, isMobile }) {
return (
    <div style={{ background: C.card2, border: `1px solid rgba(255,77,109,0.25)`, borderRadius: 10, padding: isMobile ? "12px 14px" : "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
      <AlertTriangle size={13} color={C.red} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>Attention Required: Critical Churn Interventions</span>
      <div style={{ flex: 1 }} />
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", minWidth: 32, minHeight: 32, alignItems: "center", justifyContent: "center" }}>
        <X size={12} color={C.t3} />
      </button>
    </div>
  );
}
/* ─── JOURNEY CARD ───────────────────────────────────────────── */
function JourneyCard() {
return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: "11px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, whiteSpace: "nowrap" }}>Content Success Journey</span>
        <div style={{ flex: 1, position: "relative", height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "66%", background: C.cyan, borderRadius: 3, boxShadow: `` }} />
        </div>
        <span style={{ fontSize: 11, color: C.cyan, fontWeight: 600, whiteSpace: "nowrap", textShadow: "none" }}>66%</span>
      </div>
      <div style={{ display: "flex", gap: 0, marginTop: 9 }}>
        {[
          { label: "Step 1: Connect Facebook",         done: true  },
          { label: "Step 2: Schedule your first Poll", done: true  },
          { label: "Step 3: Review Insights",          done: false },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 5, paddingRight: i < 2 ? 8 : 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.done ? C.cyan : C.t3, flexShrink: 0, boxShadow: s.done ? `0 0 3px rgba(77,127,255,0.2)` : "none" }} />
            <span style={{ fontSize: 10.5, color: s.done ? C.cyan : C.t2, fontWeight: s.done ? 600 : 400 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
/* ─── TABS ───────────────────────────────────────────────────── */
const VISIBLE_TABS = ["Drafts", "Scheduled", "Events", "Challenges", "Polls", "Posts"];
function Tabs({ active, setActive, isMobile }) {
const ref = useRef(null);
  useEffect(() => {
if (isMobile && ref.current) {
const el = ref.current.querySelector("[data-active='true']");
if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [active, isMobile]);
return (
    <div style={{ borderBottom: `1px solid ${C.brd}`, marginBottom: isMobile ? 0 : 14, ...(isMobile ? { position: "sticky", top: 0, zIndex: 90, background: C.bg } : {}) }}>
      <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 2, ...(isMobile ? { overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" } : {}) }}>
        {VISIBLE_TABS.map(tab => (
          <button key={tab} data-active={active === tab} onClick={() => setActive(tab)} style={{ padding: isMobile ? "10px 16px" : "7px 14px", fontSize: 12.5, background: "transparent", border: "none", borderBottom: `2px solid ${active === tab ? C.cyan : "transparent"}`, color: active === tab ? C.t1 : C.t2, fontWeight: active === tab ? 700 : 400, cursor: "pointer", marginBottom: -1, fontFamily: FONT, transition: "color 0.15s", whiteSpace: "nowrap", flexShrink: 0, minHeight: 44, textShadow: "none" }}>
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
/* ─── DRAFT CARDS ────────────────────────────────────────────── */
const DRAFTS = [
  { id: "d1", author: "AI Gym",  title: "AI Draft: Motivation Monday", sub: "Ready to crush your goals with...", platforms: ["instagram", "facebook"], aiGen: true  },
  { id: "d2", author: "Priya S", title: "Draft: New Class Poll",        sub: "What class should we add next?...", platforms: ["instagram"],            aiGen: false },
];
function DraftCard({ d, isMobile }) {
return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden" }} onMouseEnter={e => e.currentTarget.style.borderColor = C.cyanBrd} onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}>
      <div style={{ padding: isMobile ? "14px 16px 12px" : "12px 14px 10px", display: "flex", alignItems: "flex-start", gap: 9 }}>
        <Avatar name={d.author} size={isMobile ? 34 : 30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? 13.5 : 12.5, fontWeight: 600, color: C.t1, lineHeight: 1.3 }}>{d.title}</div>
          <div style={{ fontSize: isMobile ? 12 : 11, color: C.t2, marginTop: 2 }}>{d.sub}</div>
        </div>
      </div>
      <div style={{ padding: isMobile ? "10px 16px 14px" : "9px 14px 12px", display: "flex", alignItems: "center", gap: 6, borderTop: `1px solid ${C.brd}` }}>
        <div style={{ display: "flex", gap: 4 }}>{d.platforms.map(p => <PlatformPill key={p} type={p} />)}</div>
        {d.aiGen && <AiBadge />}
        <div style={{ flex: 1 }} />
        <button style={{ padding: isMobile ? "8px 14px" : "6px 13px", borderRadius: 7, fontSize: 11.5, fontWeight: 700, background: C.cyan, color: "#fff", border: "none", cursor: "pointer", fontFamily: FONT, minHeight: 44, boxShadow: "0 2px 6px rgba(77,127,255,0.2)" }}>
Review &amp; Schedule
        </button>
      </div>
    </div>
  );
}
/* ─── CONTENT TABLE (desktop) ────────────────────────────────── */
const TABLE_ROWS = [
  { id: "r1", typeAvatar: "MG", typeLabel: "Motivation Monday AI", platforms: ["instagram", "facebook"], aiGen: true,  date: "Apr 13, 9:00 AM", engBar: 70 },
  { id: "r2", typeAvatar: "NP", typeLabel: "Draft: New Class Poll", platforms: ["instagram"],            aiGen: false, date: "Apr 13, 9:00 AM", engBar: 0  },
  { id: "r3", typeAvatar: "MG", typeLabel: "Motivation Monday AI", platforms: ["instagram", "facebook"], aiGen: true,  date: "Apr 13, 9:00 AM", engBar: 50 },
  { id: "r4", typeAvatar: "PS", typeLabel: "Priya Sharma",          platforms: ["instagram", "facebook"], aiGen: true,  date: "Apr 13, 9:00 AM", engBar: 30 },
];
const COL = "28px 2fr 90px 110px 130px 100px 130px";
function TableHeader() {
return (
    <div style={{ display: "grid", gridTemplateColumns: COL, gap: 6, padding: "7px 12px", background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${C.brd}` }}>
      {["", "TYPE", "CHANNEL", "STATUS", "PUBLISH DATE", "ENGAGEMENT", "ACTION"].map((c, i) => (
        <div key={i} style={{ fontSize: 9.5, fontWeight: 600, color: C.t3, letterSpacing: "0.08em", textTransform: "uppercase" }}>{c}</div>
      ))}
    </div>
  );
}
function TableRow({ row, checked, onToggle, last }) {
return (
    <div style={{ display: "grid", gridTemplateColumns: COL, gap: 6, padding: "9px 12px", alignItems: "center", cursor: "pointer", background: checked ? C.cyanDim : "transparent", borderBottom: last ? "none" : `1px solid ${C.brd}`, boxShadow: checked ? `inset 0 0 20px rgba(77,127,255,0.06)` : "none" }}
      onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
      onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}
      onClick={onToggle}>
      <div style={{ display: "flex", justifyContent: "center" }}><Checkbox checked={checked} onChange={onToggle} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Avatar name={row.typeAvatar} size={24} />
        <span style={{ fontSize: 12, fontWeight: 500, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.typeLabel}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>{row.platforms.map(p => <PlatformPill key={p} type={p} />)}{row.aiGen && <AiBadge />}</div>
      <div><ScheduledBadge /></div>
      <div style={{ fontSize: 11.5, color: C.t2 }}>{row.date}</div>
      <div>
        <span style={{ fontSize: 11.5, color: C.t3 }}>N/A</span>
        {row.engBar > 0 && <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 5, width: 60 }}><div style={{ width: `${row.engBar}%`, height: "100%", background: C.cyan, borderRadius: 2, boxShadow: `` }} /></div>}
      </div>
      <div onClick={e => e.stopPropagation()}>
        <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 500, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, color: C.t2, cursor: "pointer", fontFamily: FONT }}>
Review, Edit <ChevronDown size={9} />
        </button>
      </div>
    </div>
  );
}
function ScheduledRow({ row, last }) {
const [checked, setChecked] = useState(false);
return <TableRow row={row} checked={checked} onToggle={() => setChecked(p => !p)} last={last} />;
}
function ScheduledTable() {
return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden" }}>
      <TableHeader />
      {TABLE_ROWS.map((row, i) => (
        <ScheduledRow key={row.id} row={row} last={i === TABLE_ROWS.length - 1} />
      ))}
    </div>
  );
}
function ContentTable() {
const [checked, setChecked] = useState(new Set());
const toggle = id => setChecked(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden" }}>
      <TableHeader />
      {TABLE_ROWS.map((row, i) => <TableRow key={row.id} row={row} checked={checked.has(row.id)} onToggle={() => toggle(row.id)} last={i === TABLE_ROWS.length - 1} />)}
    </div>
  );
}
/* ─── MOBILE CONTENT CARD ────────────────────────────────────── */
function MobileContentCard({ row }) {
const [checked, setChecked] = useState(false);
return (
    <div onClick={() => setChecked(p => !p)} style={{ background: checked ? C.cyanDim : C.card, border: `1px solid ${checked ? C.cyanBrd : C.brd}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8, cursor: "pointer", transition: "border-color 0.15s, background 0.15s", boxShadow: checked ? `0 0 6px rgba(77,127,255,0.08)` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Avatar name={row.typeAvatar} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.typeLabel}</div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{row.date}</div>
        </div>
        <Checkbox checked={checked} onChange={() => setChecked(p => !p)} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        {row.platforms.map(p => <PlatformPill key={p} type={p} />)}
        {row.aiGen && <AiBadge />}
        <div style={{ marginLeft: "auto" }}><ScheduledBadge /></div>
      </div>
      {row.engBar > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.t3, marginBottom: 4 }}>
            <span>Engagement</span><span style={{ color: C.cyan, textShadow: "none" }}>{row.engBar}%</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${row.engBar}%`, height: "100%", background: C.cyan, borderRadius: 2, boxShadow: `` }} />
          </div>
        </div>
      )}
      <div onClick={e => e.stopPropagation()}>
        <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "11px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, color: C.t2, cursor: "pointer", fontFamily: FONT, minHeight: 44 }}>
Review &amp; Edit <ChevronDown size={11} />
        </button>
      </div>
    </div>
  );
}
/* ─── FEED ROW ───────────────────────────────────────────────── */
function FeedRow({ isMobile }) {
return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, marginTop: 10 }}>
      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${C.brd}` }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>Community Feed</span>
      </div>
      <div style={{ padding: isMobile ? "14px" : "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <Checkbox checked={false} onChange={() => {}} />
        <Avatar name="Jamie" size={26} />
        <span style={{ fontSize: 12, color: C.t2, flex: 1 }}>
          <span style={{ color: C.t1, fontWeight: 600 }}>Crushed my personal best on deadlifts!</span>
          <span style={{ color: C.t3, fontSize: 11 }}> · 15 likes</span>
        </span>
        <div style={{ minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <MoreHorizontal size={14} color={C.t3} />
        </div>
      </div>
    </div>
  );
}
/* ─── RIGHT SIDEBAR (desktop) ────────────────────────────────── */
const BAR_DATA = [{ h: 60 }, { h: 85 }, { h: 35 }, { h: 60 }, { h: 28 }, { h: 22 }, { h: 18 }];
const QUICK_IDEAS = ["Generate AI Motivation Monday", "Post Member Spotlight", "Create Weekend Challenge Poll"];
function RightSidebar() {
return (
    <div style={{ width: 252, flexShrink: 0, background: C.sidebar, borderLeft: `1px solid ${C.brd}`, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 2 }}>What to Post Today?</div>
        <div style={{ fontSize: 10.5, color: C.t2, marginBottom: 9 }}>Guided ideas for today</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {QUICK_IDEAS.map((q, i) => (
            <button key={i} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, textAlign: "left", background: C.card, border: `1px solid ${C.brd}`, color: C.t2, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: FONT }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; e.currentTarget.style.boxShadow = ``; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.boxShadow = "none"; }}>
              {q}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 1, background: C.brd }} />
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 10 }}>Actionable Insights</div>
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 70, marginBottom: 3 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", marginRight: 4 }}>
            {["12k", "8k", "4k", "0"].map(l => <div key={l} style={{ fontSize: 8.5, color: C.t3, lineHeight: 1 }}>{l}</div>)}
          </div>
          {BAR_DATA.map((b, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
              <div style={{
                width: "100%", height: `${b.h}%`,
                background: i < 2
                  ? C.cyan
                  : i < 4
                    ? "rgba(77,127,255,0.45)"
                    : "rgba(77,127,255,0.2)",
                borderRadius: "2px 2px 0 0",
                boxShadow: i < 2 ? `` : i < 4 ? `` : "none"
              }} />
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: C.brd, marginBottom: 10, marginLeft: 24 }} />
        <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.6, marginBottom: 8 }}>
Polls have <span style={{ color: C.t1, fontWeight: 600 }}>2× more engagement</span> than text posts.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <span style={{ fontSize: 11.5, color: C.cyan, fontWeight: 600, textShadow: "none" }}>Review Detailed Insights</span>
          <ChevronRight size={11} color={C.cyan} />
        </div>
      </div>
      <div style={{ height: 1, background: C.brd }} />
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 10 }}>Content Feed Preview</div>
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar name="Sarah" size={26} />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Sarah</span>
          </div>
          <div style={{ padding: "0 12px 8px", fontSize: 11.5, color: C.t2, lineHeight: 1.55 }}>
Finally nailed that pose! <span style={{ color: C.cyan }}>@forgefitness</span> <span style={{ color: C.cyan }}>#yogagoals</span>
          </div>
          <div style={{ margin: "0 12px 10px", borderRadius: 8, height: 90, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <ellipse cx="24" cy="10" rx="5" ry="5" fill={C.t3} />
              <line x1="24" y1="15" x2="24" y2="32" stroke={C.t3} strokeWidth="3" strokeLinecap="round" />
              <line x1="24" y1="20" x2="10" y2="28" stroke={C.t3} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="20" x2="38" y2="14" stroke={C.t3} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="32" x2="16" y2="42" stroke={C.t3} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="32" x2="32" y2="42" stroke={C.t3} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ padding: "8px 12px 10px", borderTop: `1px solid ${C.brd}`, display: "flex", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.t2 }}><Heart size={12} color={C.red} /> 18</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.t2 }}><MessageCircle size={12} color={C.cyan} /> 4</div>
          </div>
        </div>
        <button style={{ width: "100%", marginTop: 9, padding: "9px", borderRadius: 8, background: C.cyan, color: "#fff", border: "none", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 2px 6px rgba(77,127,255,0.2)" }}>
          <Plus size={13} /> Add Member
        </button>
      </div>
    </div>
  );
}
/* ─── MOBILE CONTEXTUAL CARDS ────────────────────────────────── */
function MobileQuickIdeas() {
return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 2 }}>What to Post Today?</div>
      <div style={{ fontSize: 11, color: C.t2, marginBottom: 10 }}>Guided ideas for today</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {QUICK_IDEAS.map((q, i) => (
          <button key={i} style={{ width: "100%", padding: "12px 14px", borderRadius: 8, textAlign: "left", background: C.card2, border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: FONT, minHeight: 44 }}>{q}</button>
        ))}
      </div>
    </div>
  );
}
function MobileInsights() {
return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Actionable Insights</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <span style={{ fontSize: 11.5, color: C.cyan, fontWeight: 600, textShadow: "none" }}>View all</span>
          <ChevronRight size={11} color={C.cyan} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 52, marginBottom: 8 }}>
        {BAR_DATA.map((b, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
            <div style={{
              width: "100%", height: `${b.h}%`,
              background: i < 2
                ? C.cyan
                : i < 4 ? "rgba(77,127,255,0.45)" : "rgba(77,127,255,0.2)",
              borderRadius: "2px 2px 0 0",
              boxShadow: i < 2 ? `` : "none"
            }} />
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: C.brd, marginBottom: 8 }} />
      <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.6 }}>
Polls have <span style={{ color: C.t1, fontWeight: 600 }}>2× more engagement</span> than text posts.
      </div>
    </div>
  );
}
/* ─── EMPTY STATE ────────────────────────────────────────────── */
function EmptyState({ label, onAdd }) {
return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 0", gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `` }}>
        <Flame size={20} color={C.cyan} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: C.t2 }}>No {label} yet</div>
      <button onClick={onAdd} style={{ padding: "7px 16px", borderRadius: 8, background: C.cyan, color: "#fff", border: "none", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 6, minHeight: 44, boxShadow: "0 2px 6px rgba(77,127,255,0.2)" }}>
        <Plus size={12} /> Create
      </button>
    </div>
  );
}
function SectionHeader({ count, label, onAdd, btnLabel, isMobile }) {
return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>{count} {label}</div>
      {!isMobile && (
        <button onClick={onAdd} style={{ padding: "6px 14px", borderRadius: 7, background: C.cyan, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 5, minHeight: 44, boxShadow: "0 2px 6px rgba(77,127,255,0.2)" }}>
          <Plus size={11} /> {btnLabel}
        </button>
      )}
    </div>
  );
}
function ListCard({ children, isMobile }) {
return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: isMobile ? "14px 16px" : "13px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.boxShadow = `0 0 6px rgba(77,127,255,0.06)`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.boxShadow = "none"; }}>
      {children}
    </div>
  );
}
/* ─── FAB (mobile only) ──────────────────────────────────────── */
function FAB({ onClick }) {
return (
    <button onClick={onClick} style={{ position: "fixed", bottom: 76, right: 18, zIndex: 190, width: 52, height: 52, borderRadius: "50%", background: C.cyan, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(77,127,255,0.25)" }}>
      <Plus size={22} color="#fff" strokeWidth={2.5} />
    </button>
  );
}
/* ─── ROOT ───────────────────────────────────────────────────── */
export default function ContentPage({ events = [], challenges = [], polls = [], posts = [], openModal, onDeleteEvent, onDeleteChallenge, onDeletePost }) {
const isMobile = useIsMobile();
const [tab, setTab]   = useState("Drafts");
const [alert, setAlert] = useState(true);
const [showMenu, setShowMenu] = useState(false);
const createItems = [
    { label: "📝 New Post",      action: () => { openModal?.("post");      setShowMenu(false); setTab("Posts");      } },
    { label: "📅 New Event",     action: () => { openModal?.("event");     setShowMenu(false); setTab("Events");     } },
    { label: "🏆 New Challenge", action: () => { openModal?.("challenge"); setShowMenu(false); setTab("Challenges"); } },
    { label: "📊 New Poll",      action: () => { openModal?.("poll");      setShowMenu(false); setTab("Polls");      } },
  ];
return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, background: C.bg, color: C.t1, fontFamily: FONT, fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: "antialiased" }}>
      {/* ── MAIN SCROLL ── */}
      <div style={{ flex: 1, overflowY: "auto", minWidth: 0, ...(isMobile ? { paddingBottom: 80 } : {}) }}>
        {/* Header section */}
        <div style={{ padding: isMobile ? "14px 14px 0" : "16px 20px 0" }}>
          {/* Desktop page title + Create button */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <h1 style={{ fontSize: 19, fontWeight: 700, color: C.t1, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
Content Center <span style={{ color: C.t3, fontWeight: 300 }}>/</span> <span style={{ color: C.cyan, textShadow: "none" }}>Hub</span>
                </h1>
                <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>Manage posts, events, challenges and polls</div>
              </div>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowMenu(o => !o)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: C.cyan, border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: FONT, boxShadow: "0 2px 8px rgba(77,127,255,0.2)" }}>
Create New <ChevronDown size={11} />
                </button>
                {showMenu && (
                  <>
                    <div onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                    <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 100, background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden", minWidth: 175, boxShadow: "0 12px 36px rgba(0,0,0,0.7)" }}>
                      {createItems.map(item => (
                        <button key={item.label} onClick={item.action} style={{ width: "100%", display: "block", padding: "9px 16px", background: "transparent", border: "none", color: C.t1, fontSize: 12.5, fontWeight: 500, cursor: "pointer", textAlign: "left", fontFamily: FONT }}
                          onMouseEnter={e => e.currentTarget.style.background = C.cyanDim}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {alert && <AlertBanner onDismiss={() => setAlert(false)} isMobile={isMobile} />}
          {isMobile && (<><MobileQuickIdeas /><MobileInsights /></>)}
          <JourneyCard />
        </div>
        {/* Sticky tabs */}
        <div style={{ padding: isMobile ? "0 14px" : "0 20px" }}>
          <Tabs active={tab} setActive={setTab} isMobile={isMobile} />
        </div>
        {/* Tab panels */}
        <div style={{ padding: isMobile ? "10px 14px 24px" : "0 20px 40px" }}>
          {tab === "Drafts" && (
            <>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: C.t2, marginBottom: 9, marginTop: isMobile ? 2 : 0 }}>Draft Content</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {DRAFTS.map(d => <DraftCard key={d.id} d={d} isMobile={isMobile} />)}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 9 }}>All Content (Drafts &amp; Scheduled)</div>
              {isMobile ? TABLE_ROWS.map(row => <MobileContentCard key={row.id} row={row} />) : <ContentTable />}
              <FeedRow isMobile={isMobile} />
            </>
          )}
          {tab === "Scheduled" && (
            isMobile
              ? <div style={{ paddingTop: 10 }}>{TABLE_ROWS.map(row => <MobileContentCard key={row.id} row={row} />)}</div>
              : <ScheduledTable />
          )}
          {tab === "Events" && (
            <>
              <SectionHeader count={events.length} label="Events" onAdd={() => openModal?.("event")} btnLabel="Add Event" isMobile={isMobile} />
              {events.length === 0 ? <EmptyState label="events" onAdd={() => openModal?.("event")} /> :
                events.map(ev => (
                  <ListCard key={ev.id} isMobile={isMobile}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{ev.title}</div>
                      {ev.description && <div style={{ fontSize: 11.5, color: C.t2, marginTop: 3 }}>{ev.description}</div>}
                      {ev.event_date && <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{new Date(ev.event_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.t2 }}>{ev.attendees || 0} attending</div>
                    {onDeleteEvent && <DeleteBtn onClick={() => onDeleteEvent(ev.id)} />}
                  </ListCard>
                ))
              }
            </>
          )}
          {tab === "Challenges" && (
            <>
              <SectionHeader count={challenges.length} label="Challenges" onAdd={() => openModal?.("challenge")} btnLabel="New Challenge" isMobile={isMobile} />
              {challenges.length === 0 ? <EmptyState label="challenges" onAdd={() => openModal?.("challenge")} /> :
                challenges.map(ch => (
                  <ListCard key={ch.id} isMobile={isMobile}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{ch.title}</div>
                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: ch.status === "active" ? C.cyanDim : "rgba(255,255,255,0.06)", color: ch.status === "active" ? C.cyan : C.t2, border: `1px solid ${ch.status === "active" ? C.cyanBrd : C.brd}` }}>{ch.status}</span>
                      </div>
                      {ch.description && <div style={{ fontSize: 11.5, color: C.t2 }}>{ch.description}</div>}
                      <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>{ch.start_date} → {ch.end_date}</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: C.t2 }}>{(ch.participants || []).length} joined</div>
                    {onDeleteChallenge && <DeleteBtn onClick={() => onDeleteChallenge(ch.id)} />}
                  </ListCard>
                ))
              }
            </>
          )}
          {tab === "Polls" && (
            <>
              <SectionHeader count={polls.length} label="Polls" onAdd={() => openModal?.("poll")} btnLabel="New Poll" isMobile={isMobile} />
              {polls.length === 0 ? <EmptyState label="polls" onAdd={() => openModal?.("poll")} /> :
                polls.map(poll => (
                  <div key={poll.id} style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: isMobile ? "14px 16px" : "13px 16px", marginBottom: 8 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.boxShadow = `0 0 6px rgba(77,127,255,0.06)`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{poll.question || poll.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: C.t2 }}>{(poll.voters || []).length} votes</span>
                        {onDeleteChallenge && <DeleteBtn onClick={() => onDeleteChallenge(poll.id)} />}
                      </div>
                    </div>
                    {(poll.options || []).map((opt, i) => {
const optText  = typeof opt === "object" ? (opt.text || opt.label || String(i + 1)) : opt;
const optVotes = typeof opt === "object" ? (opt.votes || 0) : ((poll.votes || {})[opt] || 0);
const total    = Math.max((poll.voters || []).length, 1);
const pct      = Math.round(optVotes / total * 100);
return (
                        <div key={i} style={{ marginBottom: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.t2, marginBottom: 3 }}>
                            <span>{optText}</span><span style={{ color: C.cyan, textShadow: "none" }}>{pct}%</span>
                          </div>
                          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: C.cyan, borderRadius: 2, boxShadow: `` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              }
            </>
          )}
          {tab === "Posts" && (
            <>
              <SectionHeader count={posts.length} label="Posts" onAdd={() => openModal?.("post")} btnLabel="New Post" isMobile={isMobile} />
              {posts.length === 0 ? <EmptyState label="posts" onAdd={() => openModal?.("post")} /> :
                posts.map(p => (
                  <ListCard key={p.id} isMobile={isMobile}>
                    {p.image_url && <img src={p.image_url} alt="" style={{ width: 52, height: 52, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>{p.member_name}</div>
                      <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.content}</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.t3 }}>{Object.keys(p.reactions || {}).length} reactions</div>
                    {onDeletePost && <DeleteBtn onClick={() => onDeletePost(p.id)} />}
                  </ListCard>
                ))
              }
            </>
          )}
        </div>
      </div>
      {/* Right sidebar — desktop only */}
      {!isMobile && <RightSidebar />}
      {/* Mobile FAB + menu */}
      {isMobile && (
        <>
          <FAB onClick={() => setShowMenu(o => !o)} />
          {showMenu && (
            <>
              <div onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 188 }} />
              <div style={{ position: "fixed", bottom: 136, right: 16, zIndex: 189, background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, overflow: "hidden", minWidth: 195, boxShadow: "0 -4px 40px rgba(0,0,0,0.8)" }}>
                {createItems.map(item => (
                  <button key={item.label} onClick={item.action} style={{ width: "100%", display: "block", padding: "14px 18px", background: "transparent", border: "none", borderBottom: `1px solid ${C.brd}`, color: C.t1, fontSize: 13.5, fontWeight: 500, cursor: "pointer", textAlign: "left", fontFamily: FONT, minHeight: 52 }}>
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
