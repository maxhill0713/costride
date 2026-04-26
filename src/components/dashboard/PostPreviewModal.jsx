/**
 * PostPreviewModal — shows a community feed post in a centred overlay
 * styled to match the member social feed (PostCard) look.
 */
import { useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { ReactionsModal } from "./TabContent";

const STREAK_ICON_URL = "https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png";
const SPARTAN_ICON_URL = "https://media.base44.com/images/public/694b637358644e1c22c8ec6b/a72ee034d_spartan.png";
const BEACH_ICON_URL   = "https://media.base44.com/images/public/694b637358644e1c22c8ec6b/9766d8d41_BEACH.png";

function getStreakIconUrl(variant) {
  if (variant === "spartan") return SPARTAN_ICON_URL;
  if (variant === "beach")   return BEACH_ICON_URL;
  return STREAK_ICON_URL;
}

const POST_TYPE_CONFIG = {
  update:           { label: "Announcement",     color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.25)"  },
  achievement:      { label: "Achievement",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)"  },
  event:            { label: "Event",            color: "#22c55e", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.25)"   },
  offer:            { label: "Special Offer",    color: "#ff4d6d", bg: "rgba(255,77,109,0.12)",  border: "rgba(255,77,109,0.25)"  },
  tip:              { label: "Fitness Tip",      color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)" },
  member_spotlight: { label: "Member Spotlight", color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.25)"  },
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  let d = new Date(dateStr);
  if (!dateStr.endsWith("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) d = new Date(dateStr + "Z");
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return "Just now";
  const mins = diffMs / 60000;
  const hours = mins / 60;
  const days = hours / 24;
  if (mins < 2) return "Just now";
  if (mins < 60) return `${Math.floor(mins)} min ago`;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (days < 7) return `${Math.floor(days)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function PostPreviewModal({ post, gym, avatarMap = {}, nameMap = {}, onClose }) {
  const [showReactions, setShowReactions] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  if (!post) return null;

  const isGymPost = !!post.post_type;

  const displayName = isGymPost
    ? (gym?.name || post.member_name || "Gym")
    : (nameMap[post.member_id] || (post.member_name && !post.member_name.includes("@") ? post.member_name : null) ||
       (post.member_name?.includes("@") ? post.member_name.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Member"));

  const avatar = isGymPost
    ? (gym?.logo_url || gym?.image_url || post.member_avatar || null)
    : (avatarMap[post.member_id] || post.member_avatar || null);

  const initials = (displayName || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const palette = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#4d7fff", "#10b981"];
  const avatarBg = palette[(displayName?.charCodeAt(0) || 0) % palette.length];

  const postTypeConfig = post.post_type ? POST_TYPE_CONFIG[post.post_type] : null;
  const reactionEntries = Object.entries(post.reactions || {});
  const reactionCount = reactionEntries.length;

  return (
    <>
      <div
        onClick={e => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(2,6,23,0.78)", backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%", maxWidth: 480, maxHeight: "90vh",
            display: "flex", flexDirection: "column",
            borderRadius: 24, overflow: "hidden",
            background: "linear-gradient(135deg, rgba(16,19,40,0.97) 0%, rgba(6,8,18,0.99) 100%)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04) inset",
            animation: "postPreviewIn 0.22s cubic-bezier(0.34,1.4,0.64,1)",
            position: "relative",
          }}
        >
          <style>{`@keyframes postPreviewIn { from { opacity:0; transform:scale(0.95) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>

          {/* Top shimmer line */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.12) 50%, transparent 90%)", flexShrink: 0 }} />
          {/* Inner glow */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 24, background: "radial-gradient(ellipse at 25% 35%, rgba(99,102,241,0.1) 0%, transparent 60%)" }} />

          {/* Header */}
          <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                background: avatarBg, overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800, color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.12)",
              }}>
                {avatar
                  ? <img src={avatar} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : initials}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{displayName}</span>
                  {postTypeConfig && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                      background: postTypeConfig.bg, border: `1px solid ${postTypeConfig.border}`,
                      color: postTypeConfig.color, textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>{postTypeConfig.label}</span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2, fontWeight: 500 }}>
                  {formatTimeAgo(post.created_date)}
                </p>
              </div>
            </div>

            {/* Close — no circle */}
            <button
              onClick={onClose}
              style={{
                flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "none", border: "none",
                cursor: "pointer", color: "rgba(255,255,255,0.5)", transition: "color 0.15s",
                padding: 4,
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body — scrollable */}
          <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1, paddingBottom: reactionCount > 0 ? 60 : 0 }}>
            {/* Caption */}
            {post.content && (
              <div style={{ padding: "0 16px 14px", fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.65, fontWeight: 400 }}>
                {post.content}
              </div>
            )}

            {/* Image with swipe arrow for workout posts */}
            {post.image_url && (
              <div style={{ width: "100%", maxHeight: 400, overflow: "hidden", position: "relative" }}>
                <img
                  src={post.image_url}
                  alt="Post"
                  style={{ width: "100%", objectFit: "cover", display: "block", maxHeight: 400 }}
                />
                {/* Arrow to swipe to summary (for workout posts) */}
                {(post.workout_name || post.workout_exercises) && (
                  <button
                    onClick={() => setShowSummary(true)}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      width: 40, height: 40, borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", backdropFilter: "blur(6px)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                    }}
                  >
                    <ChevronRight size={20} color="#fff" />
                  </button>
                )}
              </div>
            )}

            {/* Video */}
            {post.video_url && !post.image_url && (
              <div style={{ width: "100%" }}>
                <video src={post.video_url} controls playsInline style={{ width: "100%", display: "block" }} />
              </div>
            )}



            {/* Workout Summary (swipe view) */}
            {showSummary && (post.workout_name || post.workout_exercises) && (
              <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <button
                  onClick={() => setShowSummary(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
                    background: "none", border: "none", color: "rgba(255,255,255,0.6)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                >
                  ← Back to post
                </button>
                {post.workout_name && (
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
                    {post.workout_name}
                  </div>
                )}
                {post.workout_exercises && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                    {Array.isArray(post.workout_exercises) ? post.workout_exercises.map((ex, i) => (
                      <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < post.workout_exercises.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                        <div style={{ fontWeight: 600, color: "#fff", marginBottom: 2 }}>{ex.name}</div>
                        {ex.sets && <div>Sets: {ex.sets}</div>}
                        {ex.reps && <div>Reps: {ex.reps}</div>}
                        {ex.weight && <div>Weight: {ex.weight}</div>}
                      </div>
                    )) : <p>{post.workout_exercises}</p>}
                  </div>
                )}
                {post.workout_duration && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    Duration: {post.workout_duration}
                  </div>
                )}
                {post.workout_volume && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    Volume: {post.workout_volume}
                  </div>
                )}
              </div>
            )}

            {/* Comments preview */}
            {(post.comments || []).length > 0 && (
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Comments
                </div>
                {(post.comments || []).slice(0, 3).map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: palette[(c.user?.charCodeAt(0) || i) % palette.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                      {(c.user || "?")[0]?.toUpperCase()}
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "6px 10px", flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{c.user}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{c.text}</div>
                    </div>
                  </div>
                ))}
                {(post.comments || []).length > 3 && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", paddingLeft: 34, fontWeight: 500 }}>
                    +{post.comments.length - 3} more comment{post.comments.length - 3 !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reactions — bottom right */}
          {reactionCount > 0 && (
            <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 2 }}>
              <button
                onClick={() => setShowReactions(true)}
                style={{ display: "flex", alignItems: "center", gap: 0, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {reactionEntries.slice(0, 4).map(([uid, variant], i) => (
                  <div key={uid} style={{ width: 38, height: 38, marginLeft: i > 0 ? -12 : 0, zIndex: 4 - i, position: "relative", flexShrink: 0 }}>
                    {variant === "sunglasses" ? (
                      <div style={{ position: "relative", width: "100%", height: "100%" }}>
                        <img src={STREAK_ICON_URL} alt="reaction" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 64 64">
                          <circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5"/>
                          <circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5"/>
                          <line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5"/>
                        </svg>
                      </div>
                    ) : (
                      <img src={getStreakIconUrl(variant)} alt="reaction" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    )}
                  </div>
                ))}
                {reactionCount > 4 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginLeft: 6 }}>+{reactionCount - 4}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {showReactions && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10001 }}>
          <ReactionsModal reactions={post.reactions || {}} onClose={() => setShowReactions(false)} />
        </div>
      )}
    </>
  );
}