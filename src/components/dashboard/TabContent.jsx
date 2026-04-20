import { useState, useEffect, useRef } from "react";
import {
  Plus, Flame, Check, Calendar, Trophy, BarChart2, FileText,
  MessageCircle, Trash2, Zap,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

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
  cyan:     "#4d7fff",
  cyanDim:  "rgba(77,127,255,0.12)",
  cyanBrd:  "rgba(77,127,255,0.28)",
  red:      "#ff4d6d",
  redDim:   "rgba(255,77,109,0.15)",
  green:    "#22c55e",
  greenDim: "rgba(34,197,94,0.12)",
  amber:    "#f59e0b",
  amberDim: "rgba(245,158,11,0.13)",
};
const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";

/* ─── HELPERS ────────────────────────────────────────────────── */
function recentPostCount(posts, days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return posts.filter(p => {
    const d = p.created_date || p.created_at || p.date;
    return d ? new Date(d).getTime() >= cutoff : true;
  }).length;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
    d = new Date(dateStr + "Z");
  }
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60)        return "just now";
  if (s < 3600)      return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)     return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ─── TAB CONFIG ─────────────────────────────────────────────── */
const VISIBLE_TABS = ["Community Feed", "Events", "Challenges", "Polls", "Drafts", "Scheduled"];

const TAB_ACTION = {
  "Community Feed": { label: "New Post",      modal: "post"      },
  "Events":         { label: "Add Event",     modal: "event"     },
  "Challenges":     { label: "New Challenge", modal: "challenge" },
  "Polls":          { label: "New Poll",      modal: "poll"      },
  "Drafts":         null,
  "Scheduled":      null,
};

/* ─── PRIMITIVES ─────────────────────────────────────────────── */
function DeleteBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: C.redDim, border: `1px solid rgba(255,77,109,0.3)`, borderRadius: 6, padding: "4px 10px", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT, flexShrink: 0, minHeight: 36 }}>
      Delete
    </button>
  );
}

/* ─── MESSAGE MEMBER MODAL ───────────────────────────────────── */
function MessageMemberModal({ resolvedName, memberId, onClose }) {
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      // Placeholder — wire to your messaging API
      await new Promise(r => setTimeout(r, 600));
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: "24px 24px 20px", width: 400, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: "-0.02em" }}>Message Member</div>
            <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>Sending to <span style={{ color: C.t1, fontWeight: 600 }}>{resolvedName}</span></div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        {sent ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: C.green, fontSize: 13, fontWeight: 600 }}>
            ✓ Message sent to {resolvedName}
          </div>
        ) : (
          <>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder={`Write a message to ${resolvedName}…`}
              rows={4}
              style={{ width: "100%", background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "10px 12px", color: C.t1, fontSize: 13, fontFamily: FONT, resize: "vertical", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = C.cyanBrd}
              onBlur={e => e.target.style.borderColor = C.brd}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
              <button onClick={handleSend} disabled={!msg.trim() || sending}
                style={{ padding: "8px 18px", borderRadius: 8, background: C.cyan, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: msg.trim() && !sending ? "pointer" : "not-allowed", opacity: msg.trim() && !sending ? 1 : 0.55, fontFamily: FONT }}>
                {sending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── REMOVE POST MODAL ──────────────────────────────────────── */
function RemovePostModal({ post, resolvedName, onConfirm, onClose }) {
  const [removing, setRemoving] = useState(false);
  const handleConfirm = async () => {
    setRemoving(true);
    try { await onConfirm(post.id); } finally { setRemoving(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: `1px solid rgba(255,77,109,0.25)`, borderRadius: 14, padding: "24px 24px 20px", width: 380, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.redDim, border: `1px solid rgba(255,77,109,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trash2 size={16} color={C.red} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.t1 }}>Remove Post</div>
            <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>Posted by <span style={{ color: C.t1, fontWeight: 600 }}>{resolvedName}</span></div>
          </div>
        </div>
        {post.content && (
          <div style={{ background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: C.t2, lineHeight: 1.5, maxHeight: 80, overflow: "hidden", textOverflow: "ellipsis" }}>
            {post.content}
          </div>
        )}
        <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.55 }}>
          This will permanently remove the post from the community feed. <span style={{ color: C.red, fontWeight: 600 }}>This cannot be undone.</span>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
          <button onClick={handleConfirm} disabled={removing}
            style={{ padding: "8px 18px", borderRadius: 8, background: C.red, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: removing ? "not-allowed" : "pointer", opacity: removing ? 0.7 : 1, fontFamily: FONT }}>
            {removing ? "Removing…" : "Remove Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── QUICK ACTIONS COLUMN ───────────────────────────────────── */
function QuickActions({ post, resolvedName, memberId, gym, currentUser, onDeletePost }) {
  const [modal, setModal] = useState(null); // "message" | "remove"
  const gymReactionKey = gym?.id ? `gym_${gym.id}` : null;
  const [reacted, setReacted] = useState(() => !!(gymReactionKey && post.reactions?.[gymReactionKey]));
  const [reacting, setReacting] = useState(false);

  const handleReact = async (e) => {
    e.stopPropagation();
    if (reacting || !gymReactionKey) return;
    setReacting(true);
    const next = !reacted;
    setReacted(next);
    try {
      const updated = { ...(post.reactions || {}) };
      if (next) updated[gymReactionKey] = "gym";
      else delete updated[gymReactionKey];
      await base44.entities.Post.update(post.id, { reactions: updated });
    } catch {
      setReacted(!next);
    } finally {
      setReacting(false);
    }
  };

  return (
    <>
      {/* Vertical divider + actions column */}
      <div style={{ width: "30%", flexShrink: 0, borderLeft: `1px solid ${C.brd}`, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, justifyContent: "flex-start" }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: C.t3, marginBottom: 2 }}>Quick Actions</div>

        {/* Message Member */}
        <button
          onClick={() => setModal("message")}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; e.currentTarget.style.background = C.cyanDim; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
          <MessageCircle size={13} color="currentColor" style={{ flexShrink: 0 }} />
          <span>Message Member</span>
        </button>

        {/* Remove Post */}
        <button
          onClick={() => setModal("remove")}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,77,109,0.35)"; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
          <Trash2 size={13} color="currentColor" style={{ flexShrink: 0 }} />
          <span>Remove Post</span>
        </button>

        {/* Send a Reaction */}
        <button
          onClick={handleReact}
          disabled={reacting}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 8, background: reacted ? C.cyanDim : "rgba(255,255,255,0.03)", border: `1px solid ${reacted ? C.cyanBrd : C.brd}`, color: reacted ? C.cyan : C.t2, fontSize: 12, fontWeight: 600, cursor: reacting ? "default" : "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s", opacity: reacting ? 0.65 : 1 }}
          onMouseEnter={e => { if (!reacted) { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.cyan; e.currentTarget.style.background = C.cyanDim; } }}
          onMouseLeave={e => { if (!reacted) { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; } }}>
          <Zap size={13} color="currentColor" style={{ flexShrink: 0 }} />
          <span>{reacted ? "Reacted ✓" : "Send a Reaction"}</span>
        </button>
      </div>

      {/* Modals */}
      {modal === "message" && (
        <MessageMemberModal
          resolvedName={resolvedName}
          memberId={memberId}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "remove" && (
        <RemovePostModal
          post={post}
          resolvedName={resolvedName}
          onConfirm={async (id) => { await onDeletePost?.(id); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

/* ─── TABS ───────────────────────────────────────────────────── */
function Tabs({ active, setActive, isMobile }) {
  const ref = useRef(null);
  useEffect(() => {
    if (isMobile && ref.current) {
      const el = ref.current.querySelector("[data-active='true']");
      if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [active, isMobile]);
  return (
    <div style={{ borderBottom: `1px solid ${C.brd}`, marginBottom: isMobile ? 0 : 10, ...(isMobile ? { position: "sticky", top: 0, zIndex: 90, background: C.bg } : {}) }}>
      <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 2, ...(isMobile ? { overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" } : {}) }}>
        {VISIBLE_TABS.map(tab => (
          <button key={tab} data-active={active === tab} onClick={() => setActive(tab)}
            style={{ padding: isMobile ? "10px 16px" : "7px 14px", fontSize: 12.5, background: "transparent", border: "none", borderBottom: `2px solid ${active === tab ? C.cyan : "transparent"}`, color: active === tab ? C.t1 : C.t2, fontWeight: active === tab ? 700 : 400, cursor: "pointer", marginBottom: -1, fontFamily: FONT, transition: "color 0.15s", whiteSpace: "nowrap", flexShrink: 0, minHeight: 44, textShadow: "none" }}>
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── RIGHT SIDEBAR ──────────────────────────────────────────── */
const QUICK_IDEAS = ["Generate AI Motivation Monday", "Post Member Spotlight", "Create Weekend Challenge Poll"];

function RightSidebar({ events, challenges, polls, posts, openModal }) {
  const totalContent = events.length + challenges.length + polls.length + posts.length;
  return (
    <div style={{ width: 302, flexShrink: 0, background: C.sidebar, borderLeft: `1px solid ${C.brd}`, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 2 }}>What to Post Today?</div>
        <div style={{ fontSize: 10.5, color: C.t2, marginBottom: 9 }}>Guided ideas for today</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {QUICK_IDEAS.map((q, i) => (
            <button key={i} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, textAlign: "left", background: C.card, border: `1px solid ${C.brd}`, color: C.t2, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: FONT }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; }}>
              {q}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 1, background: C.brd }} />
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 10 }}>Content Overview</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Events",     count: events.length,     Icon: Calendar,  color: "#f59e0b" },
            { label: "Challenges", count: challenges.length, Icon: Trophy,    color: "#ec4899" },
            { label: "Polls",      count: polls.length,      Icon: BarChart2, color: "#8b5cf6" },
            { label: "Posts",      count: posts.length,      Icon: FileText,  color: C.cyan    },
          ].map(({ label, count, Icon, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: C.card, border: `1px solid ${C.brd}`, borderRadius: 8 }}>
              <Icon size={13} color={color} />
              <span style={{ fontSize: 12, color: C.t2, flex: 1 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{count}</span>
            </div>
          ))}
        </div>
        {totalContent === 0 && (
          <div style={{ marginTop: 10, fontSize: 11.5, color: C.t3, lineHeight: 1.55 }}>
            No content yet. Create your first event, challenge, poll or post to get started.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────────── */
function EmptyState({ label, onAdd, noAction }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 0", gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Flame size={20} color={C.cyan} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: C.t2 }}>No {label} yet</div>
      {!noAction && onAdd && (
        <button onClick={onAdd} style={{ padding: "7px 16px", borderRadius: 8, background: C.cyan, color: "#fff", border: "none", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 6, minHeight: 44, boxShadow: "0 0 10px rgba(77,127,255,0.22), 0 2px 6px rgba(77,127,255,0.12)" }}>
          <Plus size={12} /> Create
        </button>
      )}
    </div>
  );
}

/* ─── LIST CARD ──────────────────────────────────────────────── */
function ListCard({ children, isMobile }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: isMobile ? "14px 16px" : "13px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.boxShadow = `0 0 6px rgba(77,127,255,0.06)`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.boxShadow = "none"; }}>
      {children}
    </div>
  );
}

/* ─── MOBILE FAB ─────────────────────────────────────────────── */
function FAB({ onClick }) {
  return (
    <button onClick={onClick} style={{ position: "fixed", bottom: 76, right: 18, zIndex: 190, width: 52, height: 52, borderRadius: "50%", background: C.cyan, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 14px rgba(77,127,255,0.28), 0 4px 10px rgba(77,127,255,0.16)" }}>
      <Plus size={22} color="#fff" strokeWidth={2.5} />
    </button>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
/* ─── MEMBER STATUS BADGE ────────────────────────────────────── */
function MemberStatusBadge({ memberId, checkIns = [] }) {
  if (!memberId) return null;
  const memberCheckIns = checkIns.filter(c => c.user_id === memberId);
  const total = memberCheckIns.length;
  const now = Date.now();
  const lastCI = memberCheckIns[0]?.check_in_date ? new Date(memberCheckIns[0].check_in_date).getTime() : null;
  const daysSinceLast = lastCI ? Math.floor((now - lastCI) / (1000 * 60 * 60 * 24)) : null;
  const last30 = memberCheckIns.filter(c => {
    const d = c.check_in_date ? new Date(c.check_in_date).getTime() : 0;
    return d >= now - 30 * 24 * 60 * 60 * 1000;
  }).length;

  let label, bg, color, border;
  if (total <= 3 || daysSinceLast === null) {
    label = "New"; bg = "rgba(99,102,241,0.14)"; color = "#a5b4fc"; border = "rgba(99,102,241,0.3)";
  } else if (daysSinceLast > 21) {
    label = "Dropping Off"; bg = "rgba(255,77,109,0.13)"; color = "#ff6b85"; border = "rgba(255,77,109,0.3)";
  } else if (last30 >= 10) {
    label = "Engaged"; bg = "rgba(34,197,94,0.12)"; color = "#4ade80"; border = "rgba(34,197,94,0.28)";
  } else {
    label = "Consistent"; bg = "rgba(77,127,255,0.13)"; color = "#93c5fd"; border = "rgba(77,127,255,0.3)";
  }

  return (
    <span style={{ padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: bg, color, border: `1px solid ${border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
      {label}
    </span>
  );
}

export default function ContentPage({ events = [], challenges = [], polls = [], posts = [], checkIns = [], openModal, onDeleteEvent, onDeleteChallenge, onDeletePost, avatarMap = {}, nameMap = {}, currentUser = null, gym = null }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("Community Feed");
  const [showMenu, setShowMenu] = useState(false);

  const createItems = [
    { label: "📝 New Post",      action: () => { openModal?.("post");      setShowMenu(false); setTab("Community Feed"); } },
    { label: "📅 New Event",     action: () => { openModal?.("event");     setShowMenu(false); setTab("Events");         } },
    { label: "🏆 New Challenge", action: () => { openModal?.("challenge"); setShowMenu(false); setTab("Challenges");     } },
    { label: "📊 New Poll",      action: () => { openModal?.("poll");      setShowMenu(false); setTab("Polls");          } },
  ];

  const tabAction = TAB_ACTION[tab];
  const recent7 = recentPostCount(posts, 7);

  const sevenDaysCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const feedPosts = posts.filter(p => {
    const d = p.created_date || p.created_at || p.date;
    return d ? new Date(d).getTime() >= sevenDaysCutoff : true;
  });

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, background: C.bg, color: C.t1, fontFamily: FONT, fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: "antialiased" }}>

      {/* ── MAIN SCROLL ── */}
      <div style={{ flex: 1, overflowY: "auto", minWidth: 0, ...(isMobile ? { paddingBottom: 80 } : {}) }}>

        {/* HEADER */}
        <div style={{ padding: isMobile ? "10px 12px 0" : "4px 8px 0" }}>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                Content <span style={{ color: C.cyan }}>Hub</span>
              </h1>
              {tabAction && (
                <button
                  onClick={() => openModal?.(tabAction.modal)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: C.cyan, border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: FONT, boxShadow: "0 0 10px rgba(77,127,255,0.22), 0 2px 8px rgba(77,127,255,0.12)", transition: "opacity 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                  <Plus size={12} /> {tabAction.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* TABS */}
        <div style={{ padding: isMobile ? "0 12px" : "0 16px" }}>
          <Tabs active={tab} setActive={setTab} isMobile={isMobile} />
        </div>

        {/* TAB PANELS */}
        <div style={{ padding: isMobile ? "8px 12px 24px" : "0 16px 32px" }}>

          {/* ── COMMUNITY FEED ── */}
          {tab === "Community Feed" && (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.t2, marginBottom: 10 }}>
                {recent7} post{recent7 !== 1 ? "s" : ""} in the last 7 days
              </div>
              {feedPosts.length === 0
                ? <EmptyState label="posts" onAdd={() => openModal?.("post")} />
                : feedPosts.map(p => {
                  const resolvedName =
                    (p.member_id && nameMap[p.member_id]) ||
                    (p.member_name && !p.member_name.includes("@") ? p.member_name : null) ||
                    (p.member_name && p.member_name.includes("@")
                      ? p.member_name.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase())
                      : "Member");
                  const avatar = (p.member_id && avatarMap[p.member_id]) || p.member_avatar || null;
                  const palette = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#4d7fff","#10b981"];
                  const avatarBg = palette[(resolvedName.charCodeAt(0) || 0) % palette.length];
                  const initials = resolvedName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
                  const postedAt = timeAgo(p.created_date || p.created_at);
                  const reactionCount = Object.keys(p.reactions || {}).length;

                  return (
                    <div key={p.id}
                      style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, marginBottom: 10, minHeight: 140, display: "flex", overflow: "hidden", position: "relative" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.boxShadow = `0 0 8px rgba(77,127,255,0.07)`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.boxShadow = "none"; }}>

                      {/* Left: image — higher resolution */}
                      {p.image_url ? (
                        <div style={{ width: 160, height: 160, flexShrink: 0, alignSelf: "center", margin: 8, borderRadius: 10, overflow: "hidden" }}>
                          <img src={p.image_url} alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", imageRendering: "high-quality" }} />
                        </div>
                      ) : (
                        <div style={{ width: 6, flexShrink: 0, background: C.cyanDim, borderRadius: "12px 0 0 12px" }} />
                      )}

                      {/* Centre: post content (~70% of remaining space) */}
                      <div style={{ flex: 1, minWidth: 0, padding: "11px 14px 11px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                        {/* Author + Status */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", overflow: "hidden" }}>
                            {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, lineHeight: 1.2 }}>{resolvedName}</div>
                              <MemberStatusBadge memberId={p.member_id} checkIns={checkIns} />
                            </div>
                            {postedAt && <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>{postedAt}</div>}
                          </div>
                        </div>

                        {/* Content */}
                        {p.content && (
                          <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {p.content}
                          </div>
                        )}

                        {/* Footer */}
                        <div style={{ marginTop: "auto" }}>
                          <span style={{ fontSize: 11, color: C.t3 }}>
                            {reactionCount > 0 ? `${reactionCount} reaction${reactionCount !== 1 ? "s" : ""}` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Right: Quick Actions (~30%) */}
                      <QuickActions
                        post={p}
                        resolvedName={resolvedName}
                        memberId={p.member_id}
                        gym={gym}
                        currentUser={currentUser}
                        onDeletePost={onDeletePost}
                      />
                    </div>
                  );
                })
              }
            </>
          )}

          {/* ── EVENTS ── */}
          {tab === "Events" && (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.t2, marginBottom: 10 }}>
                {events.length} event{events.length !== 1 ? "s" : ""}
              </div>
              {events.length === 0
                ? <EmptyState label="events" onAdd={() => openModal?.("event")} />
                : events.map(ev => (
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

          {/* ── CHALLENGES ── */}
          {tab === "Challenges" && (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.t2, marginBottom: 10 }}>
                {challenges.length} challenge{challenges.length !== 1 ? "s" : ""}
              </div>
              {challenges.length === 0
                ? <EmptyState label="challenges" onAdd={() => openModal?.("challenge")} />
                : challenges.map(ch => (
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

          {/* ── POLLS ── */}
          {tab === "Polls" && (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.t2, marginBottom: 10 }}>
                {polls.length} poll{polls.length !== 1 ? "s" : ""}
              </div>
              {polls.length === 0
                ? <EmptyState label="polls" onAdd={() => openModal?.("poll")} />
                : polls.map(poll => (
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
                            <div style={{ width: `${pct}%`, height: "100%", background: C.cyan, borderRadius: 2 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              }
            </>
          )}

          {tab === "Drafts"    && <EmptyState label="drafts"          noAction />}
          {tab === "Scheduled" && <EmptyState label="scheduled posts" noAction />}

        </div>
      </div>

      {/* RIGHT SIDEBAR — desktop only */}
      {!isMobile && (
        <RightSidebar events={events} challenges={challenges} polls={polls} posts={posts} openModal={openModal} />
      )}

      {/* MOBILE FAB + MENU */}
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