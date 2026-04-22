import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Flame, Check, Calendar, Trophy, BarChart2, FileText,
  MessageCircle, Trash2, Zap, RefreshCw, Pencil, X, Upload, Clock, Users,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const STREAK_ICON_URL = "https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png";
const SPARTAN_ICON_URL = "https://media.base44.com/images/public/694b637358644e1c22c8ec6b/a72ee034d_spartan.png";
const BEACH_ICON_URL = "https://media.base44.com/images/public/694b637358644e1c22c8ec6b/9766d8d41_BEACH.png";

function getStreakIconUrl(variant) {
  if (variant === "spartan") return SPARTAN_ICON_URL;
  if (variant === "beach") return BEACH_ICON_URL;
  return STREAK_ICON_URL;
}

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

/* ─── POST TYPE COLORS ───────────────────────────────────────── */
const POST_TYPE_STYLES = {
  update:           { label: "Announcement",     color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.28)"  },
  achievement:      { label: "Achievement",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.28)"  },
  event:            { label: "Event",            color: "#22c55e", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.28)"   },
  offer:            { label: "Special Offer",    color: "#ff4d6d", bg: "rgba(255,77,109,0.12)",  border: "rgba(255,77,109,0.28)"  },
  tip:              { label: "Fitness Tip",      color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.28)" },
  member_spotlight: { label: "Member Spotlight", color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.28)"  },
};

/* ─── TAB CONFIG ─────────────────────────────────────────────── */
const VISIBLE_TABS = ["Community Feed", "Events", "Challenges", "Polls", "Drafts", "Scheduled"];

const TAB_ACTION = {
  "Community Feed": { label: "New Post",        modal: "post"      },
  "Events":         { label: "Add Event",       modal: "event"     },
  "Challenges":     { label: "New Challenge",   modal: "challenge" },
  "Polls":          { label: "New Poll",        modal: "poll"      },
  "Drafts":         { label: "Create Draft",    modal: "post"      },
  "Scheduled":      { label: "Schedule Post",   modal: "post"      },
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
      await new Promise(r => setTimeout(r, 600));
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: "20px 24px 20px", width: 400, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: "-0.02em" }}>Message Member</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            <X size={15} />
          </button>
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

/* ─── REACTIONS MODAL ───────────────────────────────────────── */
function ReactionsModal({ reactions, onClose }) {
  const [search, setSearch] = useState("");
  const [resolvedUsers, setResolvedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const userIds = Object.keys(reactions || {}).filter(k => !k.startsWith("gym_"));
  const gymKeys = Object.keys(reactions || {}).filter(k => k.startsWith("gym_"));
  const total = Object.keys(reactions || {}).length;

  useEffect(() => {
    if (total === 0) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const users = [];
      if (userIds.length > 0) {
        try {
          const res = await base44.functions.invoke("getUserAvatars", { userIds });
          userIds.forEach(id => users.push({
            id,
            name: res.data?.avatars?.[id]?.full_name || "Member",
            avatar: res.data?.avatars?.[id]?.avatar_url || null,
            variant: reactions[id],
          }));
        } catch {}
      }
      for (const key of gymKeys) {
        const gymId = key.replace("gym_", "");
        try {
          const gyms = await base44.entities.Gym.filter({ id: gymId });
          if (gyms[0]) users.push({ id: key, name: gyms[0].name, avatar: gyms[0].logo_url || gyms[0].image_url || null, variant: reactions[key], isGym: true });
        } catch {}
      }
      setResolvedUsers(users);
      setLoading(false);
    })();
  }, []);

  const filtered = resolvedUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const ini = (n = "") => (n || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: "20px 20px 16px", width: 380, maxWidth: "92vw", display: "flex", flexDirection: "column", gap: 14, maxHeight: "75vh" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: "-0.02em" }}>
            {total} Reaction{total !== 1 ? "s" : ""}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            <X size={15} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "7px 11px", flexShrink: 0 }}>
          <svg width="13" height="13" fill="none" stroke={C.t3} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value.slice(0, 30))}
            placeholder="Search by name…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.t1, fontSize: 13, fontFamily: FONT }}
          />
        </div>
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: C.t3, fontSize: 12 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: C.t3, fontSize: 12 }}>No reactions found</div>
          ) : filtered.map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 8, cursor: "default" }}
              onMouseEnter={e => e.currentTarget.style.background = C.card2}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: C.brd, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.t1, border: u.isGym ? "1.5px solid rgba(251,191,36,0.4)" : "none" }}>
                {u.avatar ? <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ini(u.name)}
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
              {u.variant === "sunglasses" ? (
                <div style={{ position: "relative", width: 32, height: 32, flexShrink: 0 }}>
                  <img src={STREAK_ICON_URL} alt="react" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 64 64">
                    <circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5"/>
                    <circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5"/>
                    <line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5"/>
                  </svg>
                </div>
              ) : (
                <img src={STREAK_ICON_URL} alt="react" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
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
      <div style={{ background: C.card, border: `1px solid rgba(255,77,109,0.25)`, borderRadius: 14, padding: "20px 24px 20px", width: 380, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.t1 }}>Remove Post</div>
            <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>Posted by <span style={{ color: C.t1, fontWeight: 600 }}>{resolvedName}</span></div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 6, flexShrink: 0, marginLeft: 12 }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            <X size={15} />
          </button>
        </div>
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

/* ─── REMOVE POLL MODAL ──────────────────────────────────────── */
function RemovePollModal({ poll, onConfirm, onClose }) {
  const [removing, setRemoving] = useState(false);
  const handleConfirm = async () => {
    setRemoving(true);
    try { await onConfirm(poll.id); } finally { setRemoving(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: `1px solid rgba(255,77,109,0.25)`, borderRadius: 14, padding: "24px 24px 20px", width: 380, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.t1 }}>Remove Poll</div>
        </div>
        <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.55 }}>
          This will permanently remove the poll. <span style={{ color: C.red, fontWeight: 600 }}>This cannot be undone.</span>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
          <button onClick={handleConfirm} disabled={removing}
            style={{ padding: "8px 18px", borderRadius: 8, background: C.red, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: removing ? "not-allowed" : "pointer", opacity: removing ? 0.7 : 1, fontFamily: FONT }}>
            {removing ? "Removing…" : "Remove Poll"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── REMOVE CHALLENGE MODAL ─────────────────────────────────── */
function RemoveChallengeModal({ challenge, onConfirm, onClose }) {
  const [removing, setRemoving] = useState(false);
  const handleConfirm = async () => {
    setRemoving(true);
    try { await onConfirm(challenge.id); } finally { setRemoving(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: `1px solid rgba(255,77,109,0.25)`, borderRadius: 14, padding: "24px 24px 20px", width: 380, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.t1 }}>Remove Challenge</div>
            <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{challenge.title}</div>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.55 }}>
          This will permanently remove the challenge. <span style={{ color: C.red, fontWeight: 600 }}>This cannot be undone.</span>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
          <button onClick={handleConfirm} disabled={removing}
            style={{ padding: "8px 18px", borderRadius: 8, background: C.red, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: removing ? "not-allowed" : "pointer", opacity: removing ? 0.7 : 1, fontFamily: FONT }}>
            {removing ? "Removing…" : "Remove Challenge"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── EDIT POST MODAL ─────────────────────────────────────────── */
const POST_TYPE_OPTIONS = [
  { value: "update",           label: "Announcement"     },
  { value: "achievement",      label: "Achievement"      },
  { value: "event",            label: "Event"            },
  { value: "offer",            label: "Special Offer"    },
  { value: "tip",              label: "Fitness Tip"      },
  { value: "member_spotlight", label: "Member Spotlight" },
];

function EditPostModal({ post, gym, onClose, onSave }) {
  const [content,  setContent]  = useState(post?.content || "");
  const [imageUrl, setImageUrl] = useState(post?.image_url || "");
  const [postType, setPostType] = useState(post?.post_type || "update");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const isDirty = content !== (post?.content || "") || imageUrl !== (post?.image_url || "") || postType !== (post?.post_type || "update");

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const r = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(r.file_url);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!isDirty || !content.trim()) return;
    setSaving(true);
    try {
      const gymFields = gym ? {
        member_name: gym.name,
        member_avatar: gym.logo_url || gym.image_url || post.member_avatar || null,
        gym_id: gym.id,
        gym_name: gym.name,
      } : {};
      await base44.entities.Post.update(post.id, {
        content: content.trim(),
        image_url: imageUrl || null,
        post_type: postType,
        share_with_community: true,
        ...gymFields,
      });
      onSave?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 16, padding: "22px 22px 18px", width: 480, maxWidth: "94vw", maxHeight: "90vh", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: "-0.02em" }}>Edit Post</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, display: "flex", alignItems: "center" }}><X size={16} /></button>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>Post Type</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {POST_TYPE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setPostType(opt.value)}
                style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                  background: postType === opt.value ? C.cyanDim : "transparent",
                  border: `1px solid ${postType === opt.value ? C.cyanBrd : C.brd}`,
                  color: postType === opt.value ? C.cyan : C.t2 }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>Content</div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9, background: C.card2, border: `1px solid ${C.brd}`, color: C.t1, fontSize: 13, fontFamily: FONT, lineHeight: 1.65, resize: "vertical", outline: "none" }}
            onFocus={e => e.target.style.borderColor = C.cyanBrd}
            onBlur={e => e.target.style.borderColor = C.brd}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>Image</div>
          {imageUrl ? (
            <div style={{ position: "relative", borderRadius: 9, overflow: "hidden", display: "inline-block", maxWidth: "100%" }}>
              <img src={imageUrl} alt="" style={{ maxHeight: 140, objectFit: "cover", display: "block", borderRadius: 9, border: `1px solid ${C.brd}` }} />
              <button onClick={() => setImageUrl("")} style={{ position: "absolute", top: 7, right: 7, width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.72)", border: "none", cursor: "pointer" }}>
                <X size={10} color="#fff" />
              </button>
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()}
              style={{ padding: "16px 12px", borderRadius: 9, border: `1.5px dashed ${C.brd}`, background: C.card2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
              <Upload size={13} color={C.t3} />
              <span style={{ fontSize: 12, color: C.t3 }}>{uploading ? "Uploading…" : "Click to upload image"}</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} style={{ display: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
          <button onClick={handleSave} disabled={!isDirty || !content.trim() || saving}
            style={{ padding: "8px 20px", borderRadius: 8, background: isDirty && content.trim() ? C.cyan : C.brd, border: "none", color: isDirty && content.trim() ? "#fff" : C.t3, fontSize: 12, fontWeight: 700, cursor: isDirty && content.trim() && !saving ? "pointer" : "not-allowed", fontFamily: FONT, transition: "all 0.15s" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── QUICK ACTIONS COLUMN ───────────────────────────────────── */
function QuickActions({ post, resolvedName, memberId, gym, currentUser, onDeletePost, isGymPost, onPostEdited }) {
  const [modal, setModal] = useState(null);
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
      <div style={{ width: "30%", flexShrink: 0, borderLeft: `1px solid ${C.brd}`, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, justifyContent: "flex-start" }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: C.t3, marginBottom: 2 }}>Quick Actions</div>

        {isGymPost ? (
          <>
            <button
              onClick={() => setModal("remove")}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,77,109,0.35)"; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
              <Trash2 size={13} color="currentColor" style={{ flexShrink: 0 }} />
              <span>Remove Post</span>
            </button>

            <button
              onClick={() => setModal("edit")}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; e.currentTarget.style.background = C.cyanDim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
              <Pencil size={13} color="currentColor" style={{ flexShrink: 0 }} />
              <span>Edit Post</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setModal("message")}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; e.currentTarget.style.background = C.cyanDim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
              <MessageCircle size={13} color="currentColor" style={{ flexShrink: 0 }} />
              <span>Message Member</span>
            </button>

            <button
              onClick={() => setModal("remove")}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,77,109,0.35)"; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
              <Trash2 size={13} color="currentColor" style={{ flexShrink: 0 }} />
              <span>Remove Post</span>
            </button>

            <button
              onClick={handleReact}
              disabled={reacting}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 8, background: reacted ? C.cyanDim : "rgba(255,255,255,0.03)", border: `1px solid ${reacted ? C.cyanBrd : C.brd}`, color: reacted ? C.cyan : C.t2, fontSize: 12, fontWeight: 600, cursor: reacting ? "default" : "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s", opacity: reacting ? 0.65 : 1 }}
              onMouseEnter={e => { if (!reacted) { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.cyan; e.currentTarget.style.background = C.cyanDim; } }}
              onMouseLeave={e => { if (!reacted) { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; } }}>
              <Zap size={13} color="currentColor" style={{ flexShrink: 0 }} />
              <span>{reacted ? "Reacted ✓" : "Send a Reaction"}</span>
            </button>
          </>
        )}
      </div>

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
      {modal === "edit" && (
        <EditPostModal
          post={post}
          gym={gym}
          onClose={() => setModal(null)}
          onSave={onPostEdited}
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

/* Build hourly interaction buckets for the last 7 days.
   An "interaction" = a reaction on a community post, counted at the post's created_date hour. */
function buildInteractionBuckets(posts) {
  const now = Date.now();
  const HOURS = 7 * 24; // 168 buckets
  const buckets = new Array(HOURS).fill(0);

  posts.forEach(p => {
    if (p.is_hidden || !p.share_with_community) return;
    const reactionCount = Object.keys(p.reactions || {}).length;
    if (reactionCount === 0) return;
    const dateStr = p.created_date || p.created_at;
    if (!dateStr) return;
    let d = new Date(dateStr);
    if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
      d = new Date(dateStr + "Z");
    }
    const hoursAgo = (now - d.getTime()) / (1000 * 60 * 60);
    const idx = HOURS - 1 - Math.floor(hoursAgo);
    if (idx >= 0 && idx < HOURS) buckets[idx] += reactionCount;
  });

  return buckets;
}

function InteractionSparkline({ posts }) {
  const buckets = buildInteractionBuckets(posts);
  const W = 262, H = 80;
  const PAD = { top: 6, right: 4, bottom: 18, left: 24 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const HOURS = buckets.length; // 168

  const maxVal = Math.max(...buckets, 1);

  // X position for bucket index
  const xOf = i => PAD.left + (i / (HOURS - 1)) * chartW;
  // Y position for value
  const yOf = v => PAD.top + chartH - (v / maxVal) * chartH;

  // Boundary between "older" and "last 24h" (last 24 buckets)
  const splitIdx = HOURS - 24;
  const splitX = xOf(splitIdx);

  // Build SVG path points for the whole line
  const pts = buckets.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`);
  const linePath = `M ${pts.join(" L ")}`;

  // Area fill for old section (left of split)
  const oldAreaPts = buckets.slice(0, splitIdx + 1).map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`);
  const oldArea = `M ${PAD.left},${PAD.top + chartH} L ${oldAreaPts.join(" L ")} L ${splitX.toFixed(1)},${PAD.top + chartH} Z`;

  // Area fill for last 24h section (right of split, shaded blue)
  const newAreaPts = buckets.slice(splitIdx).map((v, i) => `${xOf(splitIdx + i).toFixed(1)},${yOf(v).toFixed(1)}`);
  const newArea = `M ${splitX.toFixed(1)},${PAD.top + chartH} L ${newAreaPts.join(" L ")} L ${xOf(HOURS - 1).toFixed(1)},${PAD.top + chartH} Z`;

  // Day labels: show Mon/Tue/... at every 24th bucket
  const dayLabels = [];
  const now = new Date();
  for (let d = 6; d >= 0; d--) {
    const bucketIdx = HOURS - 1 - d * 24;
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    const label = d === 0 ? "Today" : date.toLocaleDateString("en-GB", { weekday: "short" });
    dayLabels.push({ x: xOf(bucketIdx), label, isToday: d === 0 });
  }

  // Y axis ticks
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <svg width={W} height={H} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="oldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(138,138,148,0.18)" />
          <stop offset="100%" stopColor="rgba(138,138,148,0)" />
        </linearGradient>
        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(77,127,255,0.35)" />
          <stop offset="100%" stopColor="rgba(77,127,255,0.03)" />
        </linearGradient>
      </defs>

      {/* Y axis ticks */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={yOf(v)} x2={PAD.left + chartW} y2={yOf(v)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x={PAD.left - 3} y={yOf(v) + 3.5} textAnchor="end"
            style={{ fontSize: 8, fill: "rgba(138,138,148,0.55)", fontFamily: FONT }}>{v}</text>
        </g>
      ))}

      {/* Vertical split line at -24h */}
      <line x1={splitX} y1={PAD.top} x2={splitX} y2={PAD.top + chartH}
        stroke="rgba(77,127,255,0.25)" strokeWidth="1" strokeDasharray="3 2" />

      {/* Old area fill */}
      <path d={oldArea} fill="url(#oldGrad)" />
      {/* New 24h area fill — blue */}
      <path d={newArea} fill="url(#blueGrad)" />

      {/* Old segment line — grey */}
      <polyline
        points={buckets.slice(0, splitIdx + 1).map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ")}
        fill="none" stroke="rgba(138,138,148,0.55)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* New 24h segment line — blue */}
      <polyline
        points={buckets.slice(splitIdx).map((v, i) => `${xOf(splitIdx + i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ")}
        fill="none" stroke="#4d7fff" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />

      {/* Day label ticks */}
      {dayLabels.map(({ x, label, isToday }) => (
        <g key={label}>
          <line x1={x} y1={PAD.top + chartH} x2={x} y2={PAD.top + chartH + 3}
            stroke="rgba(138,138,148,0.3)" strokeWidth="1" />
          <text x={x} y={H - 2} textAnchor="middle"
            style={{ fontSize: 8, fill: isToday ? "#4d7fff" : "rgba(138,138,148,0.55)", fontFamily: FONT, fontWeight: isToday ? 700 : 400 }}>
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function RightSidebar({ events, challenges, polls, posts, openModal, feedPostsThisWeek, livePolls, communityInteractionsToday, onTabChange }) {
  const totalContent = events.length + challenges.length + polls.length + posts.length;
  return (
    <div style={{
      width: 302,
      flexShrink: 0,
      borderLeft: `1px solid ${C.brd}`,
      padding: "16px 12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      alignSelf: "flex-start",
    }}>
      <div style={{
        background: C.sidebar,
        border: `1px solid ${C.brd}`,
        borderRadius: 12,
        padding: "14px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {/* What to Post Today */}
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

        {/* Community Interactions — expanded with sparkline chart */}
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: "12px 12px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            <Zap size={12} color="#34d399" />
            <span style={{ fontSize: 12, color: C.t2, flex: 1 }}>Community Interactions today</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.t1 }}>{communityInteractionsToday}</span>
          </div>
          <div style={{ fontSize: 9.5, color: C.t3, marginBottom: 8 }}>
            Last 7 days · hourly · <span style={{ color: "#4d7fff" }}>blue = last 24h</span>
          </div>
          <InteractionSparkline posts={posts} />
        </div>

        {/* Other Content Highlights */}
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 8 }}>Content Highlights</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "Posts this week",  count: feedPostsThisWeek,  Icon: FileText,  color: C.cyan,    tab: "Community Feed" },
              { label: "Live Polls",       count: livePolls,           Icon: BarChart2, color: "#8b5cf6", tab: "Polls"          },
              { label: "Challenges",       count: challenges.length,   Icon: Trophy,    color: "#ec4899", tab: "Challenges"     },
              { label: "Events",           count: events.length,       Icon: Calendar,  color: "#f59e0b", tab: "Events"         },
            ].map(({ label, count, Icon, color, tab }) => (
              <div
                key={label}
                onClick={() => tab && onTabChange?.(tab)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px",
                  background: C.card,
                  border: `1px solid ${C.brd}`,
                  borderRadius: 8,
                  cursor: tab ? "pointer" : "default",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  if (tab) {
                    e.currentTarget.style.borderColor = C.cyanBrd;
                    e.currentTarget.style.background = C.cyanDim;
                  }
                }}
                onMouseLeave={e => {
                  if (tab) {
                    e.currentTarget.style.borderColor = C.brd;
                    e.currentTarget.style.background = C.card;
                  }
                }}
              >
                <Icon size={13} color={color} />
                <span style={{ fontSize: 12, color: C.t2, flex: 1 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{count}</span>
                <svg width="10" height="10" fill="none" stroke={C.t3} strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
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

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function ContentPage({ events = [], challenges = [], polls = [], posts = [], checkIns = [], openModal, onDeleteEvent, onDeleteChallenge, onDeletePost, onDeletePoll, onUpdatePost, avatarMap = {}, nameMap = {}, currentUser = null, gym = null, memberCount = 0 }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("Community Feed");
  const [showMenu, setShowMenu] = useState(false);
  const [pollToRemove, setPollToRemove] = useState(null);
  const [challengeToRemove, setChallengeToRemove] = useState(null);
  const [rerunning, setRerunning] = useState(null);
  const [reactionsPost, setReactionsPost] = useState(null);

  const createItems = [
    { label: "📝 New Post",      action: () => { openModal?.("post");      setShowMenu(false); setTab("Community Feed"); } },
    { label: "📅 New Event",     action: () => { openModal?.("event");     setShowMenu(false); setTab("Events");         } },
    { label: "🏆 New Challenge", action: () => { openModal?.("challenge"); setShowMenu(false); setTab("Challenges");     } },
    { label: "📊 New Poll",      action: () => { openModal?.("poll");      setShowMenu(false); setTab("Polls");          } },
  ];

  const tabAction = TAB_ACTION[tab];

  const sevenDaysCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const gymId = gym?.id;

  const feedPosts = posts.filter(p => {
    if (p.is_hidden) return false;
    if (gymId && p.gym_id !== gymId) return false;
    if (p.post_type) return true;
    if (!p.share_with_community) return false;
    const d = p.created_date || p.created_at || p.date;
    return d ? new Date(d).getTime() >= sevenDaysCutoff : true;
  });

  const feedPostsThisWeek = feedPosts.length;
  const now = new Date();
  const livePolls = polls.filter(p => {
    if (p.end_date) return new Date(p.end_date) >= now;
    return true;
  }).length;
  const communityFeedPosts = posts.filter(p => {
    if (p.is_hidden) return false;
    if (!p.share_with_community) return false;
    if (gymId && p.gym_id !== gymId) return false;
    return true;
  });
  const communityInteractionsToday = communityFeedPosts.reduce((sum, p) => {
    const reactions = p.reactions || {};
    return sum + Object.keys(reactions).length;
  }, 0);

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, background: C.bg, color: C.t1, fontFamily: FONT, fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: "antialiased" }}>

      {/* ── MAIN SCROLL ── */}
      <div style={{ flex: 1, overflowY: "auto", minWidth: 0, ...(isMobile ? { paddingBottom: 80 } : {}) }}>

        {/* HEADER */}
        <div style={{ padding: isMobile ? "10px 12px 0" : "4px 8px 0" }}>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                Content <span style={{ color: C.cyan }}>Hub</span>
              </h1>
              {tabAction && (
                <button
                  onClick={() => openModal?.(tabAction.modal)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "9px 18px",
                    background: C.cyan, border: "none", borderRadius: 9,
                    fontSize: 12.5, fontWeight: 700, color: "#fff",
                    cursor: "pointer", fontFamily: FONT,
                    boxShadow: "0 0 10px rgba(77,127,255,0.22), 0 2px 8px rgba(77,127,255,0.12)",
                    transition: "opacity 0.15s",
                    marginTop: 12,
                    marginRight: 8,
                  }}
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
                {feedPosts.length} post{feedPosts.length !== 1 ? "s" : ""} shared with your community in the last 7 days
              </div>
              {feedPosts.length === 0
                ? <EmptyState label="posts" onAdd={() => openModal?.("post")} />
                : feedPosts.map(p => {
                  const isGymPost = !!p.post_type;
                  const resolvedName = isGymPost
                    ? (gym?.name || p.member_name || "Gym")
                    : (p.member_id && nameMap[p.member_id]) ||
                      (p.member_name && !p.member_name.includes("@") ? p.member_name : null) ||
                      (p.member_name && p.member_name.includes("@")
                        ? p.member_name.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase())
                        : "Member");
                  const avatar = isGymPost
                    ? (gym?.logo_url || gym?.image_url || p.member_avatar || null)
                    : (p.member_id && avatarMap[p.member_id]) || p.member_avatar || null;
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

                      {p.image_url ? (
                        <div style={{ width: 160, height: 160, flexShrink: 0, alignSelf: "center", margin: 8, borderRadius: 10, overflow: "hidden" }}>
                          <img src={p.image_url} alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", imageRendering: "high-quality" }} />
                        </div>
                      ) : (
                        <div style={{ width: 6, flexShrink: 0, background: C.cyanDim, borderRadius: "12px 0 0 12px" }} />
                      )}

                      <div style={{ flex: 1, minWidth: 0, padding: "11px 14px 11px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", overflow: "hidden" }}>
                            {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                          </div>
                          <div style={{ flex: 1 }}>
                            {isGymPost && p.post_type ? (
                              <>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, lineHeight: 1.2 }}>{resolvedName}</div>
                                  {(() => { const pt = POST_TYPE_STYLES[p.post_type] || POST_TYPE_STYLES.update; return (
                                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: "1px 7px", borderRadius: 5, background: pt.bg, border: `1px solid ${pt.border}`, color: pt.color, flexShrink: 0 }}>
                                    {pt.label}
                                  </span>); })()}
                                </div>
                                {postedAt && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{postedAt}</div>}
                              </>
                            ) : (
                              <>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, lineHeight: 1.2 }}>{resolvedName}</div>
                                  <MemberStatusBadge memberId={p.member_id} checkIns={checkIns} />
                                </div>
                                {postedAt && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{postedAt}</div>}
                              </>
                            )}
                          </div>
                        </div>

                        {p.content && (
                          <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {p.content}
                          </div>
                        )}

                        {reactionCount > 0 && (
                          <button onClick={() => setReactionsPost(p)} style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 0, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            {Object.entries(p.reactions || {}).slice(0, 5).map(([uid, variant], i) => (
                              <div key={uid} style={{ position: "relative", width: 31, height: 31, marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i, flexShrink: 0 }}>
                                {variant === "sunglasses" ? (
                                 <div style={{ position: "relative", width: "100%", height: "100%" }}>
                                   <img src={STREAK_ICON_URL} alt="react" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                   <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 64 64">
                                     <circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5"/>
                                     <circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5"/>
                                     <line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5"/>
                                   </svg>
                                 </div>
                                ) : (
                                 <img src={getStreakIconUrl(variant)} alt="react" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                )}
                              </div>
                            ))}
                            {reactionCount > 5 && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.t2, marginLeft: 5 }}>+{reactionCount - 5}</span>
                            )}
                          </button>
                        )}
                      </div>

                      <QuickActions
                        post={p}
                        resolvedName={resolvedName}
                        memberId={p.member_id}
                        gym={gym}
                        currentUser={currentUser}
                        onDeletePost={onDeletePost}
                        isGymPost={isGymPost}
                        onPostEdited={onUpdatePost}
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
          {tab === "Challenges" && (() => {
            const now = new Date();
            const liveChallenges = challenges.filter(ch => {
              if (!ch.end_date) return true;
              return new Date(ch.end_date) >= now;
            });
            const endedChallenges = challenges.filter(ch => {
              if (!ch.end_date) return false;
              return new Date(ch.end_date) < now;
            });

            const actionBtnStyle = () => ({
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`,
              color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
              flexShrink: 0, transition: "all 0.15s",
            });
            const actionBtnHoverRed = e => { e.currentTarget.style.borderColor = "rgba(255,77,109,0.35)"; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; };
            const actionBtnHoverBlue = e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.cyan; e.currentTarget.style.background = C.cyanDim; };
            const actionBtnLeave = e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; };

            const ChallengeCard = ({ ch, showRerun = false }) => (
              <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: isMobile ? "14px 16px" : "13px 16px", marginBottom: 8 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.boxShadow = `0 0 6px rgba(77,127,255,0.06)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 3 }}>{ch.title}</div>
                    {ch.description && <div style={{ fontSize: 11.5, color: C.t2 }}>{ch.description}</div>}
                    <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>{ch.start_date} → {ch.end_date}</div>
                    <div style={{ fontSize: 11.5, color: C.t2, marginTop: 4 }}>{(ch.participants || []).length} joined</div>
                  </div>
                  <button
                    onClick={() => setChallengeToRemove(ch)}
                    style={actionBtnStyle()}
                    onMouseEnter={actionBtnHoverRed}
                    onMouseLeave={actionBtnLeave}>
                    <Trash2 size={12} color="currentColor" />
                    <span>Remove</span>
                  </button>
                </div>
                {showRerun && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <button
                      disabled={rerunning === ch.id}
                      onClick={async () => {
                        if (!ch.start_date || !ch.end_date) return;
                        setRerunning(ch.id);
                        try {
                          const start = new Date(ch.start_date);
                          const end = new Date(ch.end_date);
                          const spanMs = end.getTime() - start.getTime();
                          const newStart = new Date();
                          const newEnd = new Date(newStart.getTime() + spanMs);
                          const fmt = d => d.toISOString().split("T")[0];
                          const { id: _id, created_date: _cd, updated_date: _ud, participants, winner_id, winner_name, ...rest } = ch;
                          await base44.entities.Challenge.create({
                            ...rest,
                            start_date: fmt(newStart),
                            end_date: fmt(newEnd),
                            status: "active",
                            participants: [],
                            winner_id: null,
                            winner_name: null,
                          });
                        } finally {
                          setRerunning(null);
                        }
                      }}
                      style={actionBtnStyle()}
                      onMouseEnter={actionBtnHoverBlue}
                      onMouseLeave={actionBtnLeave}>
                      <RefreshCw size={12} color="currentColor" />
                      <span>{rerunning === ch.id ? "Re-running…" : "Re-run Challenge"}</span>
                    </button>
                  </div>
                )}
              </div>
            );

            return (
              <>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.t2, marginBottom: 10 }}>
                  {liveChallenges.length} live challenge{liveChallenges.length !== 1 ? "s" : ""}
                </div>
                {liveChallenges.length === 0
                  ? <EmptyState label="live challenges" onAdd={() => openModal?.("challenge")} />
                  : liveChallenges.map(ch => <ChallengeCard key={ch.id} ch={ch} />)
                }
                {endedChallenges.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.t2, margin: "20px 0 10px", paddingTop: 12, borderTop: `1px solid ${C.brd}`, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Ended Challenges
                    </div>
                    {endedChallenges.map(ch => <ChallengeCard key={ch.id} ch={ch} showRerun />)}
                  </>
                )}
              </>
            );
          })()}

          {/* ── POLLS ── */}
          {/* CHANGE 2: Redesigned poll cards — 70% left (bars) / 30% right (stats + remove) */}
          {tab === "Polls" && (() => {
            const nowMs = Date.now();
            const livePolls2 = polls.filter(p => !p.end_date || new Date(p.end_date).getTime() >= nowMs);
            const endedPolls = polls.filter(p => p.end_date && new Date(p.end_date).getTime() < nowMs);

            const PollCard = ({ poll, showTimer }) => {
              const responseCount = (poll.voters || []).length;
              const communityPct = memberCount > 0 ? Math.round((responseCount / memberCount) * 100) : 0;
              const timeRemainingLabel = (() => {
                if (!poll.end_date) return null;
                const diffMs = new Date(poll.end_date).getTime() - nowMs;
                if (diffMs <= 0) return null;
                const diffHours = diffMs / (1000 * 60 * 60);
                if (diffHours < 24) return `${Math.round(diffHours)}h left`;
                return `${Math.round(diffMs / (1000 * 60 * 60 * 24))}d left`;
              })();
              const isUrgent = timeRemainingLabel && new Date(poll.end_date).getTime() - nowMs < 24 * 60 * 60 * 1000;

              const opts = (poll.options || []);
              const totalVotes = opts.reduce((sum, o) => sum + (typeof o === 'object' ? (o.votes || 0) : 0), 0);
              const winnerVotes = Math.max(...opts.map(o => typeof o === 'object' ? (o.votes || 0) : 0), 0);

              return (
                <div
                  style={{
                    background: C.card,
                    border: `1px solid ${C.brd}`,
                    borderRadius: 12,
                    marginBottom: 10,
                    overflow: "hidden",
                    display: "flex",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.boxShadow = `0 0 8px rgba(77,127,255,0.07)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* LEFT — question + option bars (~70%) */}
                  <div style={{ flex: "0 0 70%", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>

                    {/* Question row + optional timer badge */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.t1, flex: 1, lineHeight: 1.4 }}>
                        {poll.question || poll.title}
                      </span>
                      {showTimer && timeRemainingLabel && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "3px 8px", borderRadius: 6, flexShrink: 0,
                          background: isUrgent ? "rgba(255,77,109,0.12)" : "rgba(77,127,255,0.10)",
                          border: `1px solid ${isUrgent ? "rgba(255,77,109,0.3)" : "rgba(77,127,255,0.25)"}`,
                          color: isUrgent ? "#ff6b85" : C.cyan,
                          fontSize: 11, fontWeight: 700,
                        }}>
                          <Clock size={10} color="currentColor" />
                          <span>{timeRemainingLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* Option bars */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {opts.map((opt, i) => {
                        const optText  = typeof opt === 'object' ? (opt.text || opt.label || `Option ${i + 1}`) : opt;
                        const optVotes = typeof opt === 'object' ? (opt.votes || 0) : 0;
                        const pct      = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                        const isWinner = optVotes === winnerVotes && optVotes > 0;

                        return (
                          <div key={i}>
                            {/* Label + percentage */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, marginBottom: 5 }}>
                              <span style={{ color: C.t2 }}>{optText}</span>
                              <span style={{ fontWeight: 700, color: isWinner ? C.cyan : C.t3 }}>{pct}%</span>
                            </div>
                            {/* Bar track */}
                            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{
                                height: "100%",
                                width: `${pct}%`,
                                borderRadius: 3,
                                background: isWinner
                                  ? `linear-gradient(90deg, ${C.cyan}, rgba(77,127,255,0.55))`
                                  : "rgba(148,163,184,0.28)",
                                transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT — stats + remove button (~30%) */}
                  <div style={{
                    flex: "0 0 30%",
                    borderLeft: `1px solid ${C.brd}`,
                    padding: "14px 14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 10,
                  }}>
                    {/* Response count + community % */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={12} color={C.cyan} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>
                          {responseCount} Response{responseCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {memberCount > 0 && (
                        <span style={{ fontSize: 11, color: C.t2, paddingLeft: 18 }}>
                          {communityPct}% of community
                        </span>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => setPollToRemove(poll)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        width: "100%", padding: "7px 10px", borderRadius: 8,
                        background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`,
                        color: C.t2, fontSize: 11.5, fontWeight: 600,
                        cursor: "pointer", fontFamily: FONT,
                        textAlign: "left", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,77,109,0.35)"; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                    >
                      <Trash2 size={12} color="currentColor" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            };

            return (
              <>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.t2, marginBottom: 10 }}>
                  {livePolls2.length} Live Poll{livePolls2.length !== 1 ? "s" : ""}
                </div>
                {livePolls2.length === 0
                  ? null
                  : livePolls2.map(poll => <PollCard key={poll.id} poll={poll} showTimer />)
                }
                {endedPolls.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.t2, margin: "20px 0 10px", paddingTop: 12, borderTop: `1px solid ${C.brd}`, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {endedPolls.length} Ended Poll{endedPolls.length !== 1 ? "s" : ""}
                    </div>
                    {endedPolls.map(poll => <PollCard key={poll.id} poll={poll} showTimer={false} />)}
                  </>
                )}
              </>
            );
          })()}

          {tab === "Drafts"    && <EmptyState label="drafts"          onAdd={() => openModal?.("post")} />}
          {tab === "Scheduled" && <EmptyState label="scheduled posts" onAdd={() => openModal?.("post")} />}

        </div>
      </div>

      {/* RIGHT SIDEBAR — desktop only */}
      {/* CHANGE 1: Pass onTabChange={setTab} so highlights can switch tabs */}
      {!isMobile && (
        <RightSidebar
          events={events}
          challenges={challenges}
          polls={polls}
          posts={posts}
          openModal={openModal}
          feedPostsThisWeek={feedPostsThisWeek}
          livePolls={livePolls}
          communityInteractionsToday={communityInteractionsToday}
          onTabChange={setTab}
        />
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

      {/* REMOVE POLL MODAL */}
      {pollToRemove && (
        <RemovePollModal
          poll={pollToRemove}
          onConfirm={async (id) => { await onDeletePoll?.(id); setPollToRemove(null); }}
          onClose={() => setPollToRemove(null)}
        />
      )}

      {/* REMOVE CHALLENGE MODAL */}
      {challengeToRemove && (
        <RemoveChallengeModal
          challenge={challengeToRemove}
          onConfirm={async (id) => { await onDeleteChallenge?.(id); setChallengeToRemove(null); }}
          onClose={() => setChallengeToRemove(null)}
        />
      )}

      {/* REACTIONS MODAL */}
      {reactionsPost && (
        <ReactionsModal
          reactions={reactionsPost.reactions || {}}
          onClose={() => setReactionsPost(null)}
        />
      )}
    </div>
  );
}