import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus, Flame, Check, Calendar, Clock, Users, MapPin,
  ArrowUpRight, ArrowDownRight, ChevronDown, ChevronLeft, ChevronRight,
  Trophy, BarChart2, FileText, MessageCircle, Trash2, Zap, RefreshCw, Pencil, X, Upload, Search, RepeatIcon,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { base44 } from "@/api/base44Client";

const STREAK_ICON_URL = "https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png";
const SPARTAN_ICON_URL = "https://media.base44.com/images/public/694b637358644e1c22c8ec6b/a72ee034d_spartan.png";
const BEACH_ICON_URL   = "https://media.base44.com/images/public/694b637358644e1c22c8ec6b/9766d8d41_BEACH.png";

function getStreakIconUrl(variant) {
  if (variant === "spartan") return SPARTAN_ICON_URL;
  if (variant === "beach")   return BEACH_ICON_URL;
  return STREAK_ICON_URL;
}

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

const GRAD_BTN = {
  background: "#2563eb",
  border: "none",
  color: "#fff",
};

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

const POST_TYPE_STYLES = {
  update:           { label: "Announcement",     color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.28)"  },
  achievement:      { label: "Achievement",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.28)"  },
  event:            { label: "Event",            color: "#22c55e", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.28)"   },
  offer:            { label: "Special Offer",    color: "#ff4d6d", bg: "rgba(255,77,109,0.12)",  border: "rgba(255,77,109,0.28)"  },
  tip:              { label: "Fitness Tip",      color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.28)" },
  member_spotlight: { label: "Member Spotlight", color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.28)"  },
};

const VISIBLE_TABS = ["Events", "Community Feed", "Challenges", "Polls", "Drafts", "Scheduled"];

const TAB_ACTION = {
  "Community Feed": { label: "New Post",        modal: "post"      },
  "Events":         { label: "Add Event",       modal: "event"     },
  "Challenges":     { label: "New Challenge",   modal: "challenge" },
  "Polls":          { label: "New Poll",        modal: "poll"      },
};

const TAB_DISPLAY_LABEL = {
  "Events": "Classes & Events",
};

function DeleteBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: C.redDim, border: `1px solid rgba(255,77,109,0.3)`, borderRadius: 6, padding: "4px 10px", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT, flexShrink: 0, minHeight: 36 }}>
      Delete
    </button>
  );
}

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
                style={{ padding: "8px 18px", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: msg.trim() && !sending ? "pointer" : "not-allowed", opacity: msg.trim() && !sending ? 1 : 0.55, fontFamily: FONT, ...GRAD_BTN }}>
                {sending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReactionsModal({ reactions, onClose }) {
  const [search, setSearch] = useState("");
  const [resolvedUsers, setResolvedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const userIds = Object.keys(reactions || {}).filter(k => !k.startsWith("gym_"));
  const gymKeys = Object.keys(reactions || {}).filter(k => k.startsWith("gym_"));
  const total   = Object.keys(reactions || {}).length;

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
            name:   res.data?.avatars?.[id]?.full_name || "Member",
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

  const filtered = resolvedUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
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
          <input value={search} onChange={e => setSearch(e.target.value.slice(0, 30))} placeholder="Search by name…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.t1, fontSize: 13, fontFamily: FONT }} />
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

function RemovePostModal({ post, resolvedName, onConfirm, onClose }) {
  const [removing, setRemoving] = useState(false);
  const handleConfirm = async () => { setRemoving(true); try { await onConfirm(post.id); } finally { setRemoving(false); } };
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

import EventDetailPopup from "./EventDetailPopup";
import CreateClassModal from "./CreateClassModal";
import ClassDetailPopup from "./ClassDetailPopup";
import EventsCalendar from "./EventsCalendar";

function RemovePollModal({ poll, onConfirm, onClose }) {
  const [removing, setRemoving] = useState(false);
  const handleConfirm = async () => { setRemoving(true); try { await onConfirm(poll.id); } finally { setRemoving(false); } };
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

function RemoveChallengeModal({ challenge, onConfirm, onClose }) {
  const [removing, setRemoving] = useState(false);
  const handleConfirm = async () => { setRemoving(true); try { await onConfirm(challenge.id); } finally { setRemoving(false); } };
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
  const [saving,    setSaving]    = useState(false);
  const fileRef = useRef();

  const isDirty = content !== (post?.content || "") || imageUrl !== (post?.image_url || "") || postType !== (post?.post_type || "update");

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try { const r = await base44.integrations.Core.UploadFile({ file }); setImageUrl(r.file_url); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!isDirty || !content.trim()) return;
    setSaving(true);
    try {
      const gymFields = gym ? { member_name: gym.name, member_avatar: gym.logo_url || gym.image_url || post.member_avatar || null, gym_id: gym.id, gym_name: gym.name } : {};
      await base44.entities.Post.update(post.id, { content: content.trim(), image_url: imageUrl || null, post_type: postType, share_with_community: true, ...gymFields });
      onSave?.();
      onClose();
    } finally { setSaving(false); }
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
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={5}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9, background: C.card2, border: `1px solid ${C.brd}`, color: C.t1, fontSize: 13, fontFamily: FONT, lineHeight: 1.65, resize: "vertical", outline: "none" }}
            onFocus={e => e.target.style.borderColor = C.cyanBrd} onBlur={e => e.target.style.borderColor = C.brd} />
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
            style={{ padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: isDirty && content.trim() && !saving ? "pointer" : "not-allowed", opacity: isDirty && content.trim() ? 1 : 0.4, transition: "all 0.15s", ...(isDirty && content.trim() ? GRAD_BTN : { background: C.brd, border: "none", color: C.t3 }) }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RepeatEventPicker({ events, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = (events || []).filter(ev =>
    ev.title && ev.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#17171c", border: `1px solid #252530`, borderRadius: 14, width: 460, maxWidth: "92vw", maxHeight: "72vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.85)" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid #252530`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Repeat an Event</div>
            <div style={{ fontSize: 11, color: "#525260", marginTop: 2 }}>Select an existing event to pre-fill the form</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#525260", cursor: "pointer", display: "flex", alignItems: "center", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "#525260"}>
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: "12px 20px", borderBottom: `1px solid #252530`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#1f1f26", border: `1px solid #252530`, borderRadius: 9, padding: "8px 12px" }}>
            <Search size={13} color="#525260" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by event title…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 13, fontFamily: FONT }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#525260", cursor: "pointer", display: "flex", padding: 0 }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 12px 12px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#525260", fontSize: 12 }}>
              {search ? "No events match your search" : "No events created yet"}
            </div>
          ) : (
            filtered.map(ev => {
              const eventDate = ev.event_date ? new Date(ev.event_date) : null;
              const dateLabel = eventDate
                ? eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                : null;
              return (
                <button
                  key={ev.id}
                  onClick={() => onSelect(ev)}
                  style={{
                    width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 12px", borderRadius: 9, marginBottom: 4,
                    background: "transparent", border: `1px solid transparent`,
                    cursor: "pointer", fontFamily: FONT, transition: "all 0.14s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(77,127,255,0.08)"; e.currentTarget.style.borderColor = "rgba(77,127,255,0.22)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(77,127,255,0.12)", border: `1px solid rgba(77,127,255,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {ev.image_url
                      ? <img src={ev.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                      : <Calendar size={14} color="#4d7fff" />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                    {(dateLabel || ev.description) && (
                      <div style={{ fontSize: 11, color: "#525260", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {dateLabel && <span style={{ color: "#4d7fff", fontWeight: 600 }}>{dateLabel}</span>}
                        {dateLabel && ev.description && <span style={{ margin: "0 5px" }}>·</span>}
                        {ev.description && <span>{ev.description}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "#4d7fff", fontWeight: 700, flexShrink: 0, opacity: 0.7 }}>Use →</div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ── NOTIFICATION TICKER ─────────────────────────────────────────── */
function NotificationTicker({ posts, events, polls, checkIns, gymId }) {
  const WINDOW_MS = 2 * 60 * 60 * 1000;

  const notifications = useMemo(() => {
    const recentMs = Date.now() - WINDOW_MS;
    const isRecent = (dateStr) => {
      if (!dateStr) return false;
      let d = new Date(dateStr);
      if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        d = new Date(dateStr + "Z");
      }
      return d.getTime() > recentMs;
    };

    const notifs = [];

    const recentPosts = posts.filter(p =>
      !p.is_hidden && p.share_with_community && !p.post_type &&
      (!gymId || p.gym_id === gymId) && isRecent(p.created_date || p.created_at)
    );
    if (recentPosts.length === 1) notifs.push("1 member just posted to the community");
    else if (recentPosts.length > 1) notifs.push(`${recentPosts.length} members just posted to the community`);

    const recentGymPosts = posts.filter(p =>
      !p.is_hidden && p.post_type && (!gymId || p.gym_id === gymId) &&
      isRecent(p.created_date || p.created_at)
    );
    if (recentGymPosts.length === 1) notifs.push("1 new gym announcement just posted");
    else if (recentGymPosts.length > 1) notifs.push(`${recentGymPosts.length} new gym announcements just posted`);

    events.forEach(ev => {
      if (!ev.title) return;
      const count = (ev.participants || []).length;
      if (count > 0 && isRecent(ev.updated_date || ev.updated_at)) {
        const label = ev.title.length > 34 ? ev.title.slice(0, 32) + "…" : ev.title;
        notifs.push(`${count} member${count !== 1 ? "s" : ""} just joined ${label}`);
      }
    });

    polls.forEach(poll => {
      const q = poll.question || poll.title;
      if (!q) return;
      const count = (poll.voters || []).length;
      if (count > 0 && isRecent(poll.updated_date || poll.updated_at)) {
        const label = q.length > 34 ? q.slice(0, 32) + "…" : q;
        notifs.push(`${count} member${count !== 1 ? "s" : ""} just responded to the ${label.toLowerCase()} poll`);
      }
    });

    const recentCI = checkIns.filter(c =>
      (!gymId || c.gym_id === gymId) &&
      isRecent(c.check_in_date || c.created_date || c.created_at)
    );
    if (recentCI.length === 1) notifs.push("1 member just checked in");
    else if (recentCI.length > 1) notifs.push(`${recentCI.length} members just checked in`);

    return notifs;
  }, [posts, events, polls, checkIns, gymId]);

  const indexRef        = useRef(0);
  const [index,       setIndex]       = useState(0);
  const [prevIndex,   setPrevIndex]   = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (notifications.length <= 1) return;
    const SLIDE_MS = 800;
    const id = setInterval(() => {
      const prev = indexRef.current;
      const next = (prev + 1) % notifications.length;
      indexRef.current = next;
      setPrevIndex(prev);
      setIndex(next);
      setTransitioning(true);
      setTimeout(() => {
        setPrevIndex(null);
        setTransitioning(false);
      }, SLIDE_MS);
    }, 15000);
    return () => clearInterval(id);
  }, [notifications.length]);

  if (!notifications.length) return null;

  return (
    <>
      <style>{`
        @keyframes notifSlideOut {
          from { transform: translateX(0);     opacity: 1; }
          to   { transform: translateX(-110%); opacity: 0; }
        }
        @keyframes notifSlideInR {
          from { transform: translateX(110%);  opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
      <div style={{
        width: "100%", height: 37,
        background: "rgba(77,127,255,0.11)",
        border: "none",
        borderRadius: 4,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}>
        {/* Exiting notification — slides out to the left */}
        {transitioning && prevIndex !== null && (
          <span style={{
            position: "absolute", left: 0, right: 0,
            textAlign: "center",
            fontSize: 11.5, fontWeight: 600, color: "#93c5fd",
            fontFamily: FONT, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis",
            padding: "0 14px", boxSizing: "border-box",
            animation: "notifSlideOut 0.8s cubic-bezier(0.4,0,0.2,1) forwards",
          }}>
            {notifications[prevIndex]}
          </span>
        )}
        {/* Entering notification — slides in from the right */}
        <span
          key={index}
          style={{
            position: "absolute", left: 0, right: 0,
            textAlign: "center",
            fontSize: 11.5, fontWeight: 600, color: "#93c5fd",
            fontFamily: FONT, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis",
            padding: "0 14px", boxSizing: "border-box",
            animation: transitioning
              ? "notifSlideInR 0.8s cubic-bezier(0.4,0,0.2,1) forwards"
              : "none",
          }}
        >
          {notifications[index]}
        </span>
      </div>
    </>
  );
}

function QuickActions({ post, resolvedName, memberId, gym, currentUser, onDeletePost, isGymPost, onPostEdited, compact }) {
  const [modal, setModal] = useState(null);
  const gymReactionKey = gym?.id ? `gym_${gym.id}` : null;
  const [reacted,   setReacted]   = useState(() => !!(gymReactionKey && post.reactions?.[gymReactionKey]));
  const [reacting,  setReacting]  = useState(false);

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
    } catch { setReacted(!next); }
    finally { setReacting(false); }
  };

  const btnStyle = { display: "flex", alignItems: "center", gap: 5, width: "100%", padding: compact ? "4px 8px" : "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: compact ? 10.5 : 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s" };
  const iconSize = compact ? 11 : 13;
  const containerStyle = { width: compact ? 105 : 126, flexShrink: 0, borderLeft: `1px solid ${C.brd}`, padding: compact ? "10px 8px" : "12px 10px", display: "flex", flexDirection: "column", gap: compact ? 7 : 8, justifyContent: "flex-start" };

  return (
    <>
      <div style={containerStyle}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: C.t3, marginBottom: 2 }}>Quick Actions</div>
        {isGymPost ? (
          <>
            <button onClick={() => setModal("remove")}
              style={btnStyle}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,77,109,0.35)"; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
              <Trash2 size={iconSize} color="currentColor" style={{ flexShrink: 0 }} /><span>Remove</span>
            </button>
            <button onClick={() => setModal("edit")}
              style={btnStyle}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; e.currentTarget.style.background = C.cyanDim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
              <Pencil size={iconSize} color="currentColor" style={{ flexShrink: 0 }} /><span>Edit</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setModal("message")}
              style={btnStyle}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; e.currentTarget.style.background = C.cyanDim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
              <MessageCircle size={iconSize} color="currentColor" style={{ flexShrink: 0 }} /><span>Message</span>
            </button>
            <button onClick={() => setModal("remove")}
              style={btnStyle}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,77,109,0.35)"; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
              <Trash2 size={iconSize} color="currentColor" style={{ flexShrink: 0 }} /><span>Remove</span>
            </button>
            <button onClick={handleReact} disabled={reacting}
              style={{ ...btnStyle, background: reacted ? C.cyanDim : "rgba(255,255,255,0.03)", border: `1px solid ${reacted ? C.cyanBrd : C.brd}`, color: reacted ? C.cyan : C.t2, cursor: reacting ? "default" : "pointer", opacity: reacting ? 0.65 : 1 }}
              onMouseEnter={e => { if (!reacted) { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.cyan; e.currentTarget.style.background = C.cyanDim; } }}
              onMouseLeave={e => { if (!reacted) { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; } }}>
              <Zap size={iconSize} color="currentColor" style={{ flexShrink: 0 }} /><span>{reacted ? "Reacted ✓" : "React"}</span>
            </button>
          </>
        )}
      </div>
      {modal === "message" && <MessageMemberModal resolvedName={resolvedName} memberId={memberId} onClose={() => setModal(null)} />}
      {modal === "remove"  && <RemovePostModal post={post} resolvedName={resolvedName} onConfirm={async (id) => { await onDeletePost?.(id); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === "edit"    && <EditPostModal post={post} gym={gym} onClose={() => setModal(null)} onSave={onPostEdited} />}
    </>
  );
}

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
            {TAB_DISPLAY_LABEL[tab] || tab}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111c2a", border: `1px solid ${C.cyanBrd}`, borderRadius: 7, padding: "5px 10px", fontSize: 11.5, color: C.t1 }}>
      <div style={{ fontSize: 10, color: C.t3, marginBottom: 2 }}>{label}</div>
      <span style={{ color: C.cyan, fontWeight: 700 }}>{payload[0].value} interactions</span>
    </div>
  );
}

function buildDailyInteractionData(posts, polls, checkIns) {
  const days = [];
  const now = new Date();
  for (let d = 6; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);
    const dayStart = date.getTime();
    const dayEnd   = dayStart + 24 * 60 * 60 * 1000;
    const label = d === 0 ? "Today" : date.toLocaleDateString("en-GB", { weekday: "short" });
    const isInDay = (dateStr) => {
      if (!dateStr) return false;
      let dt = new Date(dateStr);
      if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) dt = new Date(dateStr + "Z");
      return dt.getTime() >= dayStart && dt.getTime() < dayEnd;
    };
    let count = 0;
    posts.forEach(p => {
      if (p.is_hidden) return;
      if (!p.share_with_community && !p.post_type) return;
      if (isInDay(p.created_date || p.created_at)) count += 1;
    });
    posts.forEach(p => {
      if (p.is_hidden) return;
      if (!p.share_with_community && !p.post_type) return;
      if (isInDay(p.updated_date || p.updated_at)) count += Object.keys(p.reactions || {}).length;
    });
    polls.forEach(p => {
      if (isInDay(p.updated_date || p.updated_at || p.created_date || p.created_at)) count += (p.voters || []).length;
    });
    checkIns.forEach(c => {
      if (isInDay(c.check_in_date || c.created_date || c.created_at)) count += 1;
    });
    days.push({ label, v: count });
  }
  return days;
}

function ActivityMeterDial({ pct }) {
  const R  = 62;
  const cx = 76, cy = 72;
  const clampedPct = Math.max(0, Math.min(100, pct));
  const angleRad = Math.PI - (clampedPct / 100) * Math.PI;
  const x = cx + R * Math.cos(angleRad);
  const y = cy - R * Math.sin(angleRad);
  const trackD = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  const fillD  = clampedPct === 0 ? "" : clampedPct >= 100 ? `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}` : `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
  const dialColor = clampedPct < 30 ? C.red : clampedPct < 60 ? C.amber : C.green;
  const dialLabel = clampedPct < 30 ? "Low" : clampedPct < 60 ? "Moderate" : clampedPct < 85 ? "Good" : "Excellent";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <svg width="152" height="90" viewBox="0 0 152 90" style={{ overflow: "visible" }}>
        <path d={trackD} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
        {fillD && <path d={fillD} fill="none" stroke={dialColor} strokeWidth="10" strokeLinecap="round" strokeOpacity="0.85" />}
        {clampedPct > 0 && <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r="6" fill={dialColor} />}
        <text x={cx} y={cy - 4}  textAnchor="middle" style={{ fontSize: 22, fontWeight: 800, fill: "#fff",     fontFamily: "'DM Sans', sans-serif" }}>{clampedPct}%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: dialColor, fontFamily: "'DM Sans', sans-serif" }}>{dialLabel}</text>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 2 }}>
        <span style={{ fontSize: 9, color: C.t3, fontWeight: 600 }}>0%</span>
        <span style={{ fontSize: 9, color: C.t3, fontWeight: 600 }}>100%</span>
      </div>
    </div>
  );
}

function RightSidebar({
  events, challenges, polls, posts, checkIns,
  feedPostsThisWeek, livePolls, communityInteractionsToday,
  onTabChange, memberCount = 0,
  liveChallengesCount, eventsThisWeek, gym, memberUserRecords = [],
}) {
  const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const allActiveUserIds = new Set();
  posts.forEach(p => {
    if (p.is_hidden) return;
    const d = new Date(p.created_date || p.created_at || 0).getTime();
    if (d >= weekCutoff && p.member_id) allActiveUserIds.add(p.member_id);
    Object.keys(p.reactions || {}).forEach(uid => { if (!uid.startsWith("gym_")) allActiveUserIds.add(uid); });
  });
  polls.forEach(p => { (p.voters || []).forEach(uid => allActiveUserIds.add(uid)); });
  checkIns.forEach(c => {
    const d = new Date(c.check_in_date || c.created_date || 0).getTime();
    if (d >= weekCutoff && c.user_id) allActiveUserIds.add(c.user_id);
  });

  const primaryGymUserIds = gym?.id
    ? new Set(memberUserRecords.filter(u => u.primary_gym_id === gym.id).map(u => u.id))
    : null;
  const activeUserIds = primaryGymUserIds
    ? new Set([...allActiveUserIds].filter(id => primaryGymUserIds.has(id)))
    : allActiveUserIds;
  const primaryMemberCount = primaryGymUserIds ? primaryGymUserIds.size : memberCount;

  const activityPct = primaryMemberCount > 0 ? Math.round((activeUserIds.size / primaryMemberCount) * 100) : 0;
  const chartData = buildDailyInteractionData(posts, polls, checkIns);

  const statCards = [
    { label: "Posts / week",    val: feedPostsThisWeek,  col: C.cyan, tab: "Community Feed" },
    { label: "Live polls",      val: livePolls,           col: C.cyan, tab: "Polls"          },
    { label: "Live Challenges", val: liveChallengesCount, col: C.cyan, tab: "Challenges"     },
    { label: "Events / week",   val: eventsThisWeek,      col: C.cyan, tab: "Events"         },
  ];

  return (
    <div style={{ width: 244, flexShrink: 0, background: C.sidebar, borderLeft: `1px solid ${C.brd}`, display: "flex", flexDirection: "column", fontFamily: FONT, alignSelf: "flex-start" }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Content Overview</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: C.brd, borderBottom: `1px solid ${C.brd}` }}>
        {statCards.map((s, i) => (
          <div key={i} onClick={() => s.tab && onTabChange?.(s.tab)}
            style={{ padding: "12px 14px", background: C.sidebar, cursor: "pointer", transition: "background 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.background = C.cyanDim}
            onMouseLeave={e => e.currentTarget.style.background = C.sidebar}>
            <div style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 16px 14px", borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Community Activity</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ fontSize: 38, fontWeight: 700, color: C.t1, letterSpacing: "-0.03em", lineHeight: 1 }}>{communityInteractionsToday}</div>
        </div>
        <div style={{ fontSize: 11, color: C.t3, marginTop: 5 }}>interactions today</div>
      </div>
      <div style={{ padding: "14px 16px 12px 4px", borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 12px 0 12px" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Interactions This Week</span>
          <span style={{ fontSize: 10, color: C.t3 }}>7d</span>
        </div>
        <ResponsiveContainer width="100%" height={108}>
          <AreaChart data={chartData} margin={{ top: 4, right: 22, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.cyan} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: C.t3, fontSize: 8.5, fontFamily: FONT }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} />
            <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2} fill="url(#ig)" dot={false}
              activeDot={{ r: 3, fill: C.cyan, strokeWidth: 2, stroke: C.card }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ padding: "14px 16px 20px", minHeight: 190 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Member Activity</span>
          <span style={{ fontSize: 10, color: C.t3 }}>7d</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <ActivityMeterDial pct={activityPct} />
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: C.t3 }}>
          {activeUserIds.size} of {primaryMemberCount > 0 ? primaryMemberCount : "—"} members active this week
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 0", gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: C.t2 }}>No {label} yet</div>
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

function FAB({ onClick }) {
  return (
    <button onClick={onClick} style={{ position: "fixed", bottom: 76, right: 18, zIndex: 190, width: 52, height: 52, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", ...GRAD_BTN, boxShadow: "0 4px 10px rgba(37,99,235,0.35)" }}>
      <Plus size={22} color="#fff" strokeWidth={2.5} />
    </button>
  );
}

function MemberStatusBadge({ memberId, checkIns = [] }) {
  if (!memberId) return null;
  const memberCheckIns = checkIns.filter(c => c.user_id === memberId);
  const total = memberCheckIns.length;
  const now   = Date.now();
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

function SortDropdown({ value, onChange, options: optionsProp }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = optionsProp || [
    { value: "planned", label: "Planned Release" },
    { value: "created", label: "Date Created"    },
  ];
  const current = options.find(o => o.value === value) || options[0];
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "rgba(255,255,255,0.04)", border: `1px solid ${open ? C.cyanBrd : C.brd}`, borderRadius: 7, color: open ? C.t1 : C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; } }}>
        <span>{current.label}</span>
        <ChevronDown size={12} color="currentColor" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 5px)", right: 0, zIndex: 200, background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 9, overflow: "hidden", minWidth: 148, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 13px", background: opt.value === value ? C.cyanDim : "transparent", border: "none", color: opt.value === value ? C.cyan : C.t2, fontSize: 12, fontWeight: opt.value === value ? 700 : 500, cursor: "pointer", fontFamily: FONT, transition: "background 0.12s, color 0.12s" }}
              onMouseEnter={e => { if (opt.value !== value) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = C.t1; } }}
              onMouseLeave={e => { if (opt.value !== value) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.t2; } }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function MonthDropdown({ viewYear, viewMonth, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const today = new Date();
  const options = [];
  for (let delta = -6; delta <= 6; delta++) {
    const d = new Date(today.getFullYear(), today.getMonth() + delta, 1);
    options.push({ year: d.getFullYear(), month: d.getMonth(), label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
  }

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (o) => o.year === viewYear && o.month === viewMonth;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: "-0.01em",
          userSelect: "none", background: "none", border: "none",
          cursor: "pointer", fontFamily: FONT,
          padding: "2px 4px", borderRadius: 6,
          transition: "color 0.12s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = C.cyan}
        onMouseLeave={e => e.currentTarget.style.color = C.t1}
      >
        {MONTH_NAMES[viewMonth]} {viewYear}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", zIndex: 300, background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden", minWidth: 160, boxShadow: "0 12px 32px rgba(0,0,0,0.65)", maxHeight: 280, overflowY: "auto" }}>
          {options.map((o, i) => (
            <button
              key={i}
              onClick={() => { onSelect(o.year, o.month); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "center", padding: "9px 16px", background: isActive(o) ? C.cyanDim : "transparent", border: "none", color: isActive(o) ? C.cyan : C.t2, fontSize: 12.5, fontWeight: isActive(o) ? 700 : 500, cursor: "pointer", fontFamily: FONT, transition: "background 0.12s, color 0.12s" }}
              onMouseEnter={e => { if (!isActive(o)) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = C.t1; } }}
              onMouseLeave={e => { if (!isActive(o)) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.t2; } }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EventsCalendar({ events, onDeleteEvent, onAddEvent, onEventEdited, onRepeatEvent }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [slideDir, setSlideDir]   = useState(null);
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef(null);

  const navigate = (delta) => {
    if (animating) return;
    setSlideDir(delta > 0 ? "left" : "right");
    setAnimating(true);
    timeoutRef.current = setTimeout(() => {
      setViewMonth(m => {
        let nm = m + delta;
        if (nm < 0)  { setViewYear(y => y - 1); return 11; }
        if (nm > 11) { setViewYear(y => y + 1); return 0; }
        return nm;
      });
      setSlideDir(null);
      setTimeout(() => setAnimating(false), 40);
    }, 220);
  };

  const handleMonthSelect = (year, month) => {
    setViewYear(year);
    setViewMonth(month);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const eventsByDay = {};
  events.forEach(ev => {
    if (!ev.event_date) return;
    const d = new Date(ev.event_date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(ev);
  });

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startDow     = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  const totalCells   = Math.ceil((startDow + daysInMonth) / 7) * 7;

  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - startDow;
    let cellYear = viewYear, cellMonth = viewMonth, cellDay;
    let isOtherMonth = false;

    if (dayOffset < 0) {
      isOtherMonth = true;
      cellDay = prevMonthDays + dayOffset + 1;
      cellMonth = viewMonth - 1;
      if (cellMonth < 0) { cellMonth = 11; cellYear = viewYear - 1; }
    } else if (dayOffset >= daysInMonth) {
      isOtherMonth = true;
      cellDay = dayOffset - daysInMonth + 1;
      cellMonth = viewMonth + 1;
      if (cellMonth > 11) { cellMonth = 0; cellYear = viewYear + 1; }
    } else {
      cellDay = dayOffset + 1;
    }

    const key = `${cellYear}-${String(cellMonth+1).padStart(2,"0")}-${String(cellDay).padStart(2,"0")}`;
    cells.push({
      dayNum: cellDay,
      key,
      events: eventsByDay[key] || [],
      isToday: key === todayKey,
      isOtherMonth,
    });
  }

  const totalEvents = events.filter(ev => {
    if (!ev.event_date) return false;
    const d = new Date(ev.event_date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  }).length;

  return (
    <>
      <style>{`
        @keyframes slideInFromRight  { from { opacity:0; transform:translateX(40px);  } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInFromLeft   { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideOutToLeft    { from { opacity:1; transform:translateX(0);  } to { opacity:0; transform:translateX(-40px); } }
        @keyframes slideOutToRight   { from { opacity:1; transform:translateX(0);  } to { opacity:0; transform:translateX(40px);  } }
        .cal-grid-wrap { overflow: hidden; position: relative; }
        .cal-grid-wrap.cal-slide-out-left  { animation: slideOutToLeft   0.22s ease forwards; }
        .cal-grid-wrap.cal-slide-out-right { animation: slideOutToRight  0.22s ease forwards; }
        .cal-grid-wrap.entering-left  { animation: slideInFromRight 0.22s ease forwards; }
        .cal-grid-wrap.entering-right { animation: slideInFromLeft  0.22s ease forwards; }
        .cal-cell:hover { background: rgba(77,127,255,0.04) !important; }
        .cal-event-pill { transition: background 0.12s, border-color 0.12s; white-space: normal !important; word-break: break-word; }
        .cal-event-pill:hover { background: rgba(77,127,255,0.22) !important; border-color: rgba(77,127,255,0.5) !important; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>
            {totalEvents} event{totalEvents !== 1 ? "s" : ""} planned this month
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <button
            onClick={() => navigate(-1)}
            disabled={animating}
            style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 6, cursor: animating ? "default" : "pointer", color: C.t2, transition: "color 0.12s" }}
            onMouseEnter={e => { e.currentTarget.style.color = C.t1; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.t2; }}>
            <ChevronLeft size={16} />
          </button>

          <MonthDropdown viewYear={viewYear} viewMonth={viewMonth} onSelect={handleMonthSelect} />

          <button
            onClick={() => navigate(1)}
            disabled={animating}
            style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 6, cursor: animating ? "default" : "pointer", color: C.t2, transition: "color 0.12s" }}
            onMouseEnter={e => { e.currentTarget.style.color = C.t1; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.t2; }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.brd}`, background: C.card }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${C.brd}` }}>
          {DAYS_OF_WEEK.map(d => (
            <div key={d} style={{ padding: "9px 0", textAlign: "center", fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{d}</div>
          ))}
        </div>

        <div
          className={`cal-grid-wrap${slideDir ? " " + (slideDir === "left" ? "cal-slide-out-left" : "cal-slide-out-right") : ""}`}
          key={`${viewYear}-${viewMonth}`}
          style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
        >
          {cells.map((cell, idx) => {
            const isLastRow = idx >= cells.length - 7;
            const isLastCol = (idx % 7) === 6;
            return (
              <div
                key={cell.key}
                className="cal-cell"
                style={{
                  padding: "8px 7px 8px",
                  borderRight: isLastCol ? "none" : `1px solid ${C.brd}`,
                  borderBottom: isLastRow ? "none" : `1px solid ${C.brd}`,
                  background: cell.isToday ? "rgba(77,127,255,0.06)" : cell.isOtherMonth ? "rgba(255,255,255,0.012)" : "transparent",
                  transition: "background 0.12s",
                  minHeight: 100,
                  boxSizing: "border-box",
                  opacity: cell.isOtherMonth ? 0.45 : 1,
                }}
              >
                <div style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: cell.isToday ? C.cyan : "transparent", marginBottom: 5, fontSize: 11.5, fontWeight: cell.isToday ? 800 : cell.isOtherMonth ? 400 : 500, color: cell.isToday ? "#fff" : cell.isOtherMonth ? C.t3 : C.t2, lineHeight: 1, flexShrink: 0 }}>
                  {cell.dayNum}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {cell.events.slice(0, 4).map(ev => (
                    <button
                      key={ev.id}
                      className="cal-event-pill"
                      onClick={() => !cell.isOtherMonth && setSelectedEvent(ev)}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "3px 6px", borderRadius: 5, background: cell.isOtherMonth ? "rgba(77,127,255,0.06)" : C.cyanDim, border: `1px solid ${cell.isOtherMonth ? "rgba(77,127,255,0.12)" : C.cyanBrd}`, cursor: cell.isOtherMonth ? "default" : "pointer", fontFamily: FONT, overflow: "hidden", whiteSpace: "normal", wordBreak: "break-word", fontSize: 10.5, fontWeight: 600, color: cell.isOtherMonth ? "rgba(77,127,255,0.5)" : C.cyan, lineHeight: 1.35, boxSizing: "border-box" }}>
                      {ev.title}
                    </button>
                  ))}
                  {cell.events.length > 4 && (
                    <div style={{ fontSize: 10, color: C.t3, fontWeight: 600, paddingLeft: 6, marginTop: 1 }}>+{cell.events.length - 4} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, paddingLeft: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: C.cyanDim, border: `1px solid ${C.cyanBrd}` }} />
          <span style={{ fontSize: 10.5, color: C.t3 }}>Scheduled event — click for details</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.cyan }} />
          <span style={{ fontSize: 10.5, color: C.t3 }}>Today</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(77,127,255,0.06)", border: "1px solid rgba(77,127,255,0.12)", opacity: 0.6 }} />
          <span style={{ fontSize: 10.5, color: C.t3 }}>Adjacent month (faded)</span>
        </div>
      </div>

      {selectedEvent && (
        <EventDetailPopup
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={async (id) => { await onDeleteEvent?.(id); setSelectedEvent(null); }}
          onEditSaved={() => { setSelectedEvent(null); onEventEdited?.(); }}
        />
      )}
    </>
  );
}

export { CreateEventModal } from "./CreateEventModal";

/* ─── ROOT ───────────────────────────────────────────────────────── */
export default function ContentPage({
  events = [], challenges = [], polls = [], posts = [], checkIns = [], classes = [],
  openModal, onDeleteEvent, onDeleteChallenge, onDeletePost, onDeletePoll, onUpdatePost, onUpdateEvent, onDeleteClass, onCreateClass,
  avatarMap = {}, nameMap = {}, currentUser = null, gym = null, memberCount = 0, memberUserRecords = [],
}) {
  const isMobile = useIsMobile();
  const [tab,              setTab]              = useState("Events");
  const [showMenu,         setShowMenu]         = useState(false);
  const [pollToRemove,     setPollToRemove]     = useState(null);
  const [challengeToRemove,setChallengeToRemove]= useState(null);
  const [rerunning,        setRerunning]        = useState(null);
  const [reactionsPost,    setReactionsPost]    = useState(null);
  const [publishingDraftId, setPublishingDraftId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [scheduledSort, setScheduledSort] = useState("planned");
  const [pollSort, setPollSort] = useState("created");
  const [feedFilter, setFeedFilter] = useState("all");
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [creatingClass, setCreatingClass] = useState(false);

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
  const livePolls = polls.filter(p => !p.end_date || new Date(p.end_date) >= now).length;
  const liveChallengesCount = challenges.filter(ch => !ch.end_date || new Date(ch.end_date) >= now).length;
  const eventsThisWeek = events.filter(ev => {
    if (!ev.event_date) return false;
    return new Date(ev.event_date).getTime() >= sevenDaysCutoff;
  }).length;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    let d = new Date(dateStr);
    if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) d = new Date(dateStr + "Z");
    return d.getTime() >= todayStartMs;
  };

  const memberPostsToday = posts.filter(p =>
    !p.is_hidden && !p.post_type && p.share_with_community &&
    (!gymId || p.gym_id === gymId) && isToday(p.created_date || p.created_at)
  ).length;
  const pollVotesToday = polls.filter(p =>
    (!gymId || p.gym_id === gymId) && isToday(p.updated_date || p.updated_at || p.created_date || p.created_at)
  ).reduce((sum, p) => sum + (p.voters || []).length, 0);
  const reactionsToday = posts.filter(p =>
    !p.is_hidden && (!gymId || p.gym_id === gymId) &&
    (p.share_with_community || p.post_type) &&
    isToday(p.updated_date || p.updated_at || p.created_date || p.created_at)
  ).reduce((sum, p) => sum + Object.keys(p.reactions || {}).length, 0);
  const checkInsToday = checkIns.filter(c =>
    (!gymId || c.gym_id === gymId) && isToday(c.check_in_date || c.created_date || c.created_at)
  ).length;
  const communityInteractionsToday = memberPostsToday + reactionsToday + pollVotesToday + checkInsToday;

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, background: C.bg, color: C.t1, fontFamily: FONT, fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: "antialiased" }}>

      <div style={{ flex: 1, overflowY: "auto", minWidth: 0, ...(isMobile ? { paddingBottom: 80 } : {}) }}>

        {!isMobile && (
          <div style={{ padding: "4px 16px 0 4px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.2, flexShrink: 0 }}>
              Content <span style={{ color: C.cyan }}>Hub</span>
            </h1>
            {/* Ticker sits absolutely centred — button stays pinned right whether or not it renders */}
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", width: "clamp(300px, 52%, 780px)", pointerEvents: "none" }}>
              <div style={{ pointerEvents: "auto" }}>
                <NotificationTicker
                  posts={posts} events={events} polls={polls} checkIns={checkIns} gymId={gymId}
                />
              </div>
            </div>
            <button
              onClick={() => tabAction && openModal?.(tabAction.modal)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, transition: "opacity 0.15s", visibility: tabAction ? "visible" : "hidden", pointerEvents: tabAction ? "auto" : "none", flexShrink: 0, ...GRAD_BTN }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <Plus size={12} /> {tabAction?.label ?? "Action"}
            </button>
          </div>
        )}

        <div style={{ padding: isMobile ? "0 12px" : "0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Tabs active={tab} setActive={setTab} isMobile={isMobile} />
            </div>
            {!isMobile && tab === "Events" && (
              <button onClick={() => setShowCreateClass(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT, background: "#7c3aed", border: "none", color: "#fff", flexShrink: 0, marginLeft: 10, marginBottom: 1 }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                <Plus size={11} /> Add Class
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: isMobile ? "8px 12px 24px" : "0 16px 32px 4px" }}>

          {/* ── COMMUNITY FEED ── */}
          {tab === "Community Feed" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: 2 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>
                  {feedFilter === "members"
                    ? `${feedPosts.filter(p => !p.post_type).length} member${feedPosts.filter(p => !p.post_type).length !== 1 ? "s" : ""} posted with your community in the last 7 days`
                    : feedFilter === "gym"
                    ? `You've made ${feedPosts.filter(p => !!p.post_type).length} gym post${feedPosts.filter(p => !!p.post_type).length !== 1 ? "s" : ""} in the last 7 days`
                    : `${feedPosts.length} post${feedPosts.length !== 1 ? "s" : ""} shared with your community in the last 7 days`
                  }
                </div>
                <SortDropdown
                  value={feedFilter}
                  onChange={setFeedFilter}
                  options={[
                    { value: "all",     label: "All Posts"     },
                    { value: "members", label: "Members Only"  },
                    { value: "gym",     label: "Gym Only"      },
                  ]}
                />
              </div>
              {(() => {
                const visiblePosts = feedPosts.filter(p => {
                  if (feedFilter === "members") return !p.post_type;
                  if (feedFilter === "gym")     return !!p.post_type;
                  return true;
                });
                return visiblePosts.length === 0
                  ? <EmptyState label="posts" />
                  : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {visiblePosts.map(p => {
                    const isGymPost   = !!p.post_type;
                    const resolvedName = isGymPost
                      ? (gym?.name || p.member_name || "Gym")
                      : (p.member_id && nameMap[p.member_id]) ||
                        (p.member_name && !p.member_name.includes("@") ? p.member_name : null) ||
                        (p.member_name && p.member_name.includes("@")
                          ? p.member_name.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase())
                          : "Member");
                    const avatar   = isGymPost ? (gym?.logo_url || gym?.image_url || p.member_avatar || null) : (p.member_id && avatarMap[p.member_id]) || p.member_avatar || null;
                    const palette  = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#4d7fff","#10b981"];
                    const avatarBg = palette[(resolvedName.charCodeAt(0) || 0) % palette.length];
                    const initials = resolvedName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
                    const postedAt = timeAgo(p.created_date || p.created_at);
                    const reactionCount = Object.keys(p.reactions || {}).length;
                    return (
                      <div key={p.id}
                        style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, height: 138, display: "flex", overflow: "hidden", position: "relative" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.boxShadow = `0 0 8px rgba(77,127,255,0.07)`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.boxShadow = "none"; }}>
                        {p.image_url ? (
                          <div style={{ width: 128, height: 128, flexShrink: 0, alignSelf: "center", margin: 5, borderRadius: 8, overflow: "hidden" }}>
                            <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </div>
                        ) : null}
                        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                          <div style={{ flex: 1, minWidth: 0, padding: "10px 10px 10px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                              <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", overflow: "hidden" }}>
                                {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, lineHeight: 1.2 }}>{resolvedName}</div>
                                  {isGymPost && p.post_type
                                    ? (() => { const pt = POST_TYPE_STYLES[p.post_type] || POST_TYPE_STYLES.update; return (<span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: pt.bg, border: `1px solid ${pt.border}`, color: pt.color, flexShrink: 0 }}>{pt.label}</span>); })()
                                    : <MemberStatusBadge memberId={p.member_id} checkIns={checkIns} />
                                  }
                                </div>
                                {postedAt && <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>{postedAt}</div>}
                              </div>
                            </div>
                            {p.content && (
                              <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {p.content}
                              </div>
                            )}
                            {reactionCount > 0 && (
                            /* ── REACTION ICONS: 10% smaller (40px) with tighter overlap (-18px) ── */
                            <button onClick={() => setReactionsPost(p)} style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 0, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                              {Object.entries(p.reactions || {}).slice(0, 3).map(([uid, variant], i) => (
                                <div key={uid} style={{ position: "relative", width: 40, height: 40, marginLeft: i === 0 ? 0 : -18, zIndex: 3 - i, flexShrink: 0 }}>
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
                              {reactionCount > 3 && <span style={{ fontSize: 10, fontWeight: 700, color: C.t2, marginLeft: 4 }}>+{reactionCount - 3}</span>}
                            </button>
                            )}
                          </div>
                          <QuickActions post={p} resolvedName={resolvedName} memberId={p.member_id} gym={gym} currentUser={currentUser} onDeletePost={onDeletePost} isGymPost={isGymPost} onPostEdited={onUpdatePost} compact />
                        </div>
                      </div>
                    );
                  })}
                  </div>
                );
              })()}
            </>
          )}

          {/* ── EVENTS ── */}
          {tab === "Events" && (
            <EventsCalendar
              events={events}
              classes={classes}
              onDeleteEvent={onDeleteEvent}
              onAddEvent={() => openModal?.("event")}
              onAddClass={() => setShowCreateClass(true)}
              onEventEdited={onUpdateEvent}
              onDeleteClass={onDeleteClass}
            />
          )}

          {/* ── CHALLENGES ── */}
          {tab === "Challenges" && (() => {
            const nowDate = new Date();
            const liveChallenges  = challenges.filter(ch => !ch.end_date || new Date(ch.end_date) >= nowDate);
            const endedChallenges = challenges.filter(ch =>  ch.end_date && new Date(ch.end_date) <  nowDate);
            const actionBtnStyle = () => ({ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, flexShrink: 0, transition: "all 0.15s" });
            const actionBtnHoverRed  = e => { e.currentTarget.style.borderColor = "rgba(255,77,109,0.35)"; e.currentTarget.style.color = C.red;  e.currentTarget.style.background = C.redDim;  };
            const actionBtnHoverBlue = e => { e.currentTarget.style.borderColor = C.cyanBrd;                e.currentTarget.style.color = C.cyan; e.currentTarget.style.background = C.cyanDim; };
            const actionBtnLeave     = e => { e.currentTarget.style.borderColor = C.brd;                    e.currentTarget.style.color = C.t2;   e.currentTarget.style.background = "rgba(255,255,255,0.03)"; };
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
                  <button onClick={() => setChallengeToRemove(ch)} style={actionBtnStyle()} onMouseEnter={actionBtnHoverRed} onMouseLeave={actionBtnLeave}>
                    <Trash2 size={12} color="currentColor" /><span>Remove</span>
                  </button>
                </div>
                {showRerun && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <button disabled={rerunning === ch.id}
                      onClick={async () => {
                        if (!ch.start_date || !ch.end_date) return;
                        setRerunning(ch.id);
                        try {
                          const start  = new Date(ch.start_date);
                          const end    = new Date(ch.end_date);
                          const spanMs = end.getTime() - start.getTime();
                          const newStart = new Date();
                          const newEnd   = new Date(newStart.getTime() + spanMs);
                          const fmt = d => d.toISOString().split("T")[0];
                          const { id: _id, created_date: _cd, updated_date: _ud, participants, winner_id, winner_name, ...rest } = ch;
                          await base44.entities.Challenge.create({ ...rest, start_date: fmt(newStart), end_date: fmt(newEnd), status: "active", participants: [], winner_id: null, winner_name: null });
                        } finally { setRerunning(null); }
                      }}
                      style={actionBtnStyle()} onMouseEnter={actionBtnHoverBlue} onMouseLeave={actionBtnLeave}>
                      <RefreshCw size={12} color="currentColor" />
                      <span>{rerunning === ch.id ? "Re-running…" : "Re-run Challenge"}</span>
                    </button>
                  </div>
                )}
              </div>
            );
            return (
              <>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.t2, marginBottom: 10, marginTop: 2 }}>
                  {liveChallenges.length} live challenge{liveChallenges.length !== 1 ? "s" : ""}
                </div>
                {liveChallenges.length === 0 ? <EmptyState label="live challenges" /> : liveChallenges.map(ch => <ChallengeCard key={ch.id} ch={ch} />)}
                {endedChallenges.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.t2, margin: "20px 0 10px", paddingTop: 12, borderTop: `1px solid ${C.brd}`, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ended Challenges</div>
                    {endedChallenges.map(ch => <ChallengeCard key={ch.id} ch={ch} showRerun />)}
                  </>
                )}
              </>
            );
          })()}

          {/* ── POLLS ── */}
          {tab === "Polls" && (() => {
            const nowMs    = Date.now();
            const pollEndMs = p => p.end_date ? new Date(p.end_date).getTime() + 24 * 60 * 60 * 1000 - 1 : Infinity;
            const livePolls2Raw  = polls.filter(p => pollEndMs(p) >= nowMs);
            const livePolls2 = [...livePolls2Raw].sort((a, b) => {
              if (pollSort === "created") {
                return new Date(a.created_date || a.created_at || 0) - new Date(b.created_date || b.created_at || 0);
              }
              const aMs = a.end_date ? pollEndMs(a) : Infinity;
              const bMs = b.end_date ? pollEndMs(b) : Infinity;
              return aMs - bMs;
            });
            const endedPolls = [...polls.filter(p => p.end_date && pollEndMs(p) < nowMs)]
              .sort((a, b) => pollEndMs(b) - pollEndMs(a));
            const sectionHeadingStyle = { fontSize: 12, fontWeight: 500, color: C.t2, marginBottom: 10 };
            const PollCard = ({ poll, showTimer }) => {
              const responseCount  = (poll.voters || []).length;
              const communityPct   = memberCount > 0 ? Math.round((responseCount / memberCount) * 100) : 0;
              const endMs = poll.end_date ? new Date(poll.end_date).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
              const timeRemainingLabel = (() => {
                if (!endMs) return null;
                const diffMs = endMs - nowMs;
                if (diffMs <= 0) return null;
                const diffHours = diffMs / (1000 * 60 * 60);
                if (diffHours < 24) return `${Math.round(diffHours)}h left`;
                return `${Math.round(diffMs / (1000 * 60 * 60 * 24))}d left`;
              })();
              const isUrgent = timeRemainingLabel && endMs - nowMs < 24 * 60 * 60 * 1000;
              const opts        = poll.options || [];
              const totalVotes  = opts.reduce((sum, o) => sum + (typeof o === "object" ? (o.votes || 0) : 0), 0);
              const winnerVotes = Math.max(...opts.map(o => typeof o === "object" ? (o.votes || 0) : 0), 0);
              return (
                <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, overflow: "hidden", display: "flex", transition: "border-color 0.15s, box-shadow 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.boxShadow = `0 0 8px rgba(77,127,255,0.07)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ flex: "0 0 70%", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.t1, lineHeight: 1.4, flex: 1 }}>{poll.question || poll.title}</span>
                      {showTimer && timeRemainingLabel && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, padding: "3px 8px", borderRadius: 6, background: isUrgent ? "rgba(255,77,109,0.12)" : "rgba(77,127,255,0.10)", border: `1px solid ${isUrgent ? "rgba(255,77,109,0.3)" : "rgba(77,127,255,0.25)"}`, color: isUrgent ? "#ff6b85" : C.cyan, fontSize: 11, fontWeight: 700 }}>
                          <Clock size={10} color="currentColor" /><span>{timeRemainingLabel}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {opts.map((opt, i) => {
                        const optText  = typeof opt === "object" ? (opt.text || opt.label || `Option ${i + 1}`) : opt;
                        const optVotes = typeof opt === "object" ? (opt.votes || 0) : 0;
                        const pct      = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                        const isWinner = optVotes === winnerVotes && optVotes > 0;
                        const barWidth = pct > 0 ? Math.max(pct, 3) : 3;
                        return (
                          <div key={i} style={{ position: "relative", borderRadius: 9, overflow: "hidden" }}>
                            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${barWidth}%`, background: isWinner ? "rgba(37,99,235,0.45)" : "rgba(148,163,184,0.22)", borderRadius: 9, transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
                            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px" }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: isWinner ? "#93c5fd" : "rgba(255,255,255,0.8)" }}>{optText}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 8, flexShrink: 0, color: isWinner ? "#60a5fa" : "rgba(255,255,255,0.35)" }}>{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ flex: "0 0 30%", borderLeft: `1px solid ${C.brd}`, padding: "14px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={12} color={C.cyan} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{responseCount} Response{responseCount !== 1 ? "s" : ""}</span>
                      </div>
                      {memberCount > 0 && <span style={{ fontSize: 11, color: C.t2, paddingLeft: 18 }}>{communityPct}% of community</span>}
                    </div>
                    <button onClick={() => setPollToRemove(poll)}
                      style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "7px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,77,109,0.35)"; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                      <Trash2 size={12} color="currentColor" /><span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            };
            return (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: 2 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>{livePolls2.length} Live Poll{livePolls2.length !== 1 ? "s" : ""}</div>
                  <SortDropdown
                    value={pollSort}
                    onChange={setPollSort}
                    options={[
                      { value: "created", label: "Date Created" },
                      { value: "time_left", label: "Time Left" },
                    ]}
                  />
                </div>
                {livePolls2.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 10 }}>
                    {livePolls2.map(poll => <PollCard key={poll.id} poll={poll} showTimer />)}
                  </div>
                ) : <EmptyState label="live polls" />}
                <div style={{ ...sectionHeadingStyle, marginTop: 20, paddingTop: 12, borderTop: `1px solid ${C.brd}` }}>
                  {endedPolls.length} Ended Poll{endedPolls.length !== 1 ? "s" : ""}
                </div>
                {endedPolls.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                    {endedPolls.map(poll => <PollCard key={poll.id} poll={poll} showTimer={false} />)}
                  </div>
                )}
              </>
            );
          })()}

          {/* ── DRAFTS ── */}
          {tab === "Drafts" && (() => {
            const drafts = posts.filter(p => p.is_draft && (!gymId || p.gym_id === gymId));
            const handlePublishDraft = async (post) => {
              setPublishingDraftId(post.id);
              try {
                await base44.entities.Post.update(post.id, { is_draft: false, is_hidden: false, share_with_community: true, scheduled_date: null });
                onUpdatePost?.();
              } finally { setPublishingDraftId(null); }
            };
            const gymAvatar = gym?.logo_url || gym?.image_url || null;
            const gymName = gym?.name || "Gym";
            if (drafts.length === 0) return <EmptyState label="drafts" />;
            return (
              <>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.t2, marginBottom: 10 }}>{drafts.length} draft{drafts.length !== 1 ? "s" : ""}</div>
                {/* ── 2-per-row grid, matching Community Feed layout ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {drafts.map(p => {
                    const pt = POST_TYPE_STYLES[p.post_type] || POST_TYPE_STYLES.update;
                    const isGymPost = !!p.post_type;
                    const displayName = isGymPost ? gymName : (p.member_name || gymName);
                    const displayAvatar = isGymPost ? gymAvatar : (avatarMap[p.member_id] || p.member_avatar || gymAvatar);
                    const palette = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#4d7fff","#10b981"];
                    const avatarBg = palette[(displayName.charCodeAt(0) || 0) % palette.length];
                    return (
                      <div key={p.id} style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, height: 138, display: "flex", overflow: "hidden", transition: "border-color 0.15s, box-shadow 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.boxShadow = `0 0 8px rgba(77,127,255,0.07)`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.boxShadow = "none"; }}>
                        {p.image_url ? (
                          <div style={{ width: 128, height: 128, flexShrink: 0, alignSelf: "center", margin: 5, borderRadius: 8, overflow: "hidden" }}>
                            <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </div>
                        ) : null}
                        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                          <div style={{ flex: 1, minWidth: 0, padding: "10px 10px 10px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                              <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", overflow: "hidden" }}>
                                {displayAvatar ? <img src={displayAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?"}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, lineHeight: 1.2 }}>{displayName}</div>
                                  {p.post_type && (<span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: pt.bg, border: `1px solid ${pt.border}`, color: pt.color, flexShrink: 0 }}>{pt.label}</span>)}
                                  <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)", color: C.amber, flexShrink: 0 }}>Draft</span>
                                </div>
                                <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>Saved {timeAgo(p.created_date)}</div>
                              </div>
                            </div>
                            {p.content && (
                              <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {p.content}
                              </div>
                            )}
                          </div>
                          {/* Quick Actions panel — same compact style as Community Feed */}
                          <div style={{ width: 116, flexShrink: 0, borderLeft: `1px solid ${C.brd}`, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 7, justifyContent: "flex-start" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: C.t3, marginBottom: 2 }}>Quick Actions</div>
                            <button onClick={() => handlePublishDraft(p)} disabled={publishingDraftId === p.id}
                              style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", padding: "4px 8px", borderRadius: 8, fontSize: 10.5, fontWeight: 700, cursor: publishingDraftId === p.id ? "default" : "pointer", fontFamily: FONT, opacity: publishingDraftId === p.id ? 0.6 : 1, transition: "opacity 0.15s", ...(publishingDraftId === p.id ? { background: C.brd, border: "none", color: C.t3 } : GRAD_BTN) }}>
                              <Plus size={11} color="#fff" style={{ flexShrink: 0 }} /><span>{publishingDraftId === p.id ? "Posting…" : "Post Now"}</span>
                            </button>
                            <button onClick={() => setEditingPost(p)}
                              style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", padding: "4px 8px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; e.currentTarget.style.background = C.cyanDim; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                              <Pencil size={11} color="currentColor" style={{ flexShrink: 0 }} /><span>Edit</span>
                            </button>
                            {onDeletePost && (
                              <button onClick={() => onDeletePost(p.id)}
                                style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", padding: "4px 8px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,77,109,0.35)"; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                                <Trash2 size={11} color="currentColor" style={{ flexShrink: 0 }} /><span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}

          {/* ── SCHEDULED ── */}
          {tab === "Scheduled" && (() => {
            const nowMs = Date.now();
            const scheduledRaw = posts.filter(p =>
              p.scheduled_date && !p.is_draft && (!gymId || p.gym_id === gymId) &&
              new Date(p.scheduled_date).getTime() > nowMs
            );
            const scheduled = [...scheduledRaw].sort((a, b) => {
              if (scheduledSort === "planned") return new Date(a.scheduled_date) - new Date(b.scheduled_date);
              const aDate = new Date(a.created_date || a.created_at || 0);
              const bDate = new Date(b.created_date || b.created_at || 0);
              return bDate - aDate;
            });
            const gymAvatar = gym?.logo_url || gym?.image_url || null;
            const gymName = gym?.name || "Gym";
            if (scheduled.length === 0) return <EmptyState label="scheduled posts" />;
            return (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>{scheduled.length} scheduled post{scheduled.length !== 1 ? "s" : ""}</div>
                  <SortDropdown value={scheduledSort} onChange={setScheduledSort} />
                </div>
                {/* ── 2-per-row grid, matching Community Feed layout ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {scheduled.map(p => {
                    const pt = POST_TYPE_STYLES[p.post_type] || POST_TYPE_STYLES.update;
                    const isGymPost = !!p.post_type;
                    const displayName = isGymPost ? gymName : (p.member_name || gymName);
                    const displayAvatar = isGymPost ? gymAvatar : (avatarMap[p.member_id] || p.member_avatar || gymAvatar);
                    const palette = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#4d7fff","#10b981"];
                    const avatarBg = palette[(displayName.charCodeAt(0) || 0) % palette.length];
                    const schedDate = new Date(p.scheduled_date);
                    const schedLabel = schedDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + " at " + schedDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                    const diffMs = schedDate.getTime() - nowMs;
                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    const timeUntil = diffDays <= 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays}d`;
                    return (
                      <div key={p.id} style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, height: 138, display: "flex", overflow: "hidden", transition: "border-color 0.15s, box-shadow 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.boxShadow = `0 0 8px rgba(77,127,255,0.07)`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.boxShadow = "none"; }}>
                        {p.image_url ? (
                          <div style={{ width: 128, height: 128, flexShrink: 0, alignSelf: "center", margin: 5, borderRadius: 8, overflow: "hidden" }}>
                            <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </div>
                        ) : null}
                        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                          <div style={{ flex: 1, minWidth: 0, padding: "10px 10px 10px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                              <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", overflow: "hidden" }}>
                                {displayAvatar ? <img src={displayAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?"}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, lineHeight: 1.2 }}>{displayName}</div>
                                  {p.post_type && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: pt.bg, border: `1px solid ${pt.border}`, color: pt.color, flexShrink: 0 }}>{pt.label}</span>}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                                  <Clock size={10} color={C.cyan} />
                                  <span style={{ fontSize: 10, color: C.cyan, fontWeight: 700 }}>{schedLabel}</span>
                                </div>
                                <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{timeUntil}</div>
                              </div>
                            </div>
                            {p.content && (
                              <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {p.content}
                              </div>
                            )}
                          </div>
                          {/* Quick Actions panel — same compact style as Community Feed */}
                          <div style={{ width: 105, flexShrink: 0, borderLeft: `1px solid ${C.brd}`, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 7, justifyContent: "flex-start" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: C.t3, marginBottom: 2 }}>Quick Actions</div>
                            <button onClick={() => setEditingPost(p)}
                              style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", padding: "4px 8px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; e.currentTarget.style.background = C.cyanDim; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                              <Pencil size={11} color="currentColor" style={{ flexShrink: 0 }} /><span>Edit</span>
                            </button>
                            {onDeletePost && (
                              <button onClick={() => onDeletePost(p.id)}
                                style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", padding: "4px 8px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "all 0.15s" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,77,109,0.35)"; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                                <Trash2 size={11} color="currentColor" style={{ flexShrink: 0 }} /><span>Cancel</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}

        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      {!isMobile && (
        <RightSidebar
          events={events} challenges={challenges} polls={polls} posts={posts} checkIns={checkIns}
          feedPostsThisWeek={feedPostsThisWeek} livePolls={livePolls}
          communityInteractionsToday={communityInteractionsToday}
          onTabChange={setTab} memberCount={memberCount}
          liveChallengesCount={liveChallengesCount} eventsThisWeek={eventsThisWeek}
          gym={gym} memberUserRecords={memberUserRecords}
        />
      )}

      {/* MOBILE FAB */}
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

      {pollToRemove && <RemovePollModal poll={pollToRemove} onConfirm={async (id) => { await onDeletePoll?.(id); setPollToRemove(null); }} onClose={() => setPollToRemove(null)} />}
      {challengeToRemove && <RemoveChallengeModal challenge={challengeToRemove} onConfirm={async (id) => { await onDeleteChallenge?.(id); setChallengeToRemove(null); }} onClose={() => setChallengeToRemove(null)} />}
      {reactionsPost && <ReactionsModal reactions={reactionsPost.reactions || {}} onClose={() => setReactionsPost(null)} />}
      {editingPost && <EditPostModal post={editingPost} gym={gym} onClose={() => setEditingPost(null)} onSave={() => { setEditingPost(null); onUpdatePost?.(); }} />}
      <CreateClassModal open={showCreateClass} onClose={() => setShowCreateClass(false)} gym={gym} isLoading={creatingClass}
        onSave={async (data) => { setCreatingClass(true); try { await onCreateClass?.(data); setShowCreateClass(false); } finally { setCreatingClass(false); } }} />
    </div>
  );
}