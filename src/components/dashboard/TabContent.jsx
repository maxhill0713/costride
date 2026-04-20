import { useState, useEffect, useRef } from "react";
import {
  ChevronDown, Plus, Flame, Facebook, Instagram,
  ChevronRight, Check, X, MoreHorizontal, Calendar, Trophy, BarChart2, FileText,
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
  cyan:     "#4d7fff",
  cyanDim:  "rgba(77,127,255,0.12)",
  cyanBrd:  "rgba(77,127,255,0.28)",
  red:      "#ff4d6d",
  redDim:   "rgba(255,77,109,0.15)",
  green:    "#22c55e",
  greenDim: "rgba(34,197,94,0.12)",
};
const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";

/* ─── HELPERS ────────────────────────────────────────────────── */
function recentPostCount(posts, days = 3) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return posts.filter(p => {
    const d = p.created_date || p.created_at || p.date;
    return d ? new Date(d).getTime() >= cutoff : true;
  }).length;
}

/* ─── TAB CONFIG ─────────────────────────────────────────────── */
const VISIBLE_TABS = ["Community Feed", "Events", "Challenges", "Polls", "Drafts", "Scheduled"];

// Each tab's header button; null = no button shown for that tab
const TAB_ACTION = {
  "Community Feed": { label: "New Post",     modal: "post"      },
  "Events":         { label: "Add Event",    modal: "event"     },
  "Challenges":     { label: "New Challenge",modal: "challenge" },
  "Polls":          { label: "New Poll",     modal: "poll"      },
  "Drafts":         null,
  "Scheduled":      null,
};

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

function Checkbox({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{ width: 14, height: 14, borderRadius: 3, cursor: "pointer", flexShrink: 0, background: checked ? C.cyan : "transparent", border: `1.5px solid ${checked ? C.cyan : C.t3}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: checked ? `0 0 4px rgba(77,127,255,0.2)` : "none" }}>
      {checked && <Check size={8} color="#fff" strokeWidth={3} />}
    </div>
  );
}

function DeleteBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: C.redDim, border: `1px solid rgba(255,77,109,0.3)`, borderRadius: 6, padding: "4px 10px", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT, flexShrink: 0, minHeight: 36 }}>
      Delete
    </button>
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
    /* 252 → 302px (+20%); sidebar is on the right edge so it expands leftward */
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
export default function ContentPage({ events = [], challenges = [], polls = [], posts = [], openModal, onDeleteEvent, onDeleteChallenge, onDeletePost }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("Community Feed");
  const [showMenu, setShowMenu] = useState(false);

  // Mobile FAB menu items
  const createItems = [
    { label: "📝 New Post",      action: () => { openModal?.("post");      setShowMenu(false); setTab("Community Feed"); } },
    { label: "📅 New Event",     action: () => { openModal?.("event");     setShowMenu(false); setTab("Events");         } },
    { label: "🏆 New Challenge", action: () => { openModal?.("challenge"); setShowMenu(false); setTab("Challenges");     } },
    { label: "📊 New Poll",      action: () => { openModal?.("poll");      setShowMenu(false); setTab("Polls");          } },
  ];

  // The header-area button for the active tab
  const tabAction = TAB_ACTION[tab];

  // "xx posts in the last 3 days" count
  const recent3 = recentPostCount(posts, 3);

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, background: C.bg, color: C.t1, fontFamily: FONT, fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: "antialiased" }}>

      {/* ── MAIN SCROLL ── */}
      <div style={{ flex: 1, overflowY: "auto", minWidth: 0, ...(isMobile ? { paddingBottom: 80 } : {}) }}>

        {/* HEADER */}
        <div style={{ padding: isMobile ? "10px 12px 0" : "12px 16px 0" }}>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                Content <span style={{ color: C.cyan }}>Hub</span>
              </h1>

              {/* Contextual action button — changes with the active tab */}
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
                {recent3} post{recent3 !== 1 ? "s" : ""} in the last 3 days
              </div>
              {posts.length === 0
                ? <EmptyState label="posts" onAdd={() => openModal?.("post")} />
                : posts.map(p => (
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