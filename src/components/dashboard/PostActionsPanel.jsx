import { useState } from "react";
import { Send, X, MessageCircle, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const C = {
  bg:      "#000000",
  card:    "#141416",
  card2:   "#1a1a1f",
  brd:     "#222226",
  t1:      "#ffffff",
  t2:      "#8a8a94",
  t3:      "#444450",
  cyan:    "#4d7fff",
  cyanDim: "rgba(77,127,255,0.12)",
  cyanBrd: "rgba(77,127,255,0.28)",
  red:     "#ff4d6d",
  redDim:  "rgba(255,77,109,0.15)",
  green:   "#22c55e",
};
const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";

const REMOVAL_REASONS = ["Spam", "Inappropriate content", "Violence", "Harassment", "Misinformation"];

function timeAgo(dateStr) {
  if (!dateStr) return "recently";
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) return "recently";
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
    d = new Date(dateStr + "Z");
  }
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)} minute${Math.floor(s / 60) !== 1 ? "s" : ""} ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hour${Math.floor(s / 3600) !== 1 ? "s" : ""} ago`;
  return `${Math.floor(s / 86400)} day${Math.floor(s / 86400) !== 1 ? "s" : ""} ago`;
}

export default function PostActionsPanel({ post, resolvedName, onClose, onDeletePost, currentUser }) {
  const [messageText, setMessageText]         = useState("");
  const [sending, setSending]                 = useState(false);
  const [messageSent, setMessageSent]         = useState(false);
  const [showRemove, setShowRemove]           = useState(false);
  const [selectedReason, setSelectedReason]  = useState(null);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [removing, setRemoving]               = useState(false);

  const sendMessage = async () => {
    if (!messageText.trim() || sending) return;
    setSending(true);
    try {
      await base44.entities.Message.create({
        sender_id:     currentUser?.id,
        sender_name:   currentUser?.full_name || currentUser?.display_name || "Gym Owner",
        receiver_id:   post.member_id,
        receiver_name: resolvedName,
        content:       messageText.trim(),
        read:          false,
      });
      setMessageSent(true);
      setMessageText("");
    } catch (e) {
      console.error("Failed to send message", e);
    } finally {
      setSending(false);
    }
  };

  const confirmRemove = async () => {
    if (!selectedReason || removing) return;
    setRemoving(true);
    try {
      // Hide post from feed
      await base44.entities.Post.update(post.id, { is_hidden: true });

      // Create a notification for the member
      const postAge = timeAgo(post.created_date || post.created_at);
      await base44.entities.Notification.create({
        user_id: post.member_id,
        type:    "post_removed",
        title:   "Post Removed",
        message: `Your post ${postAge} has been removed for: ${selectedReason}`,
        read:    false,
        data:    { reason: selectedReason, post_id: post.id },
      });

      onDeletePost?.(post.id);
      onClose();
    } catch (e) {
      console.error("Failed to remove post", e);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1001,
        background: C.card,
        border: `1px solid ${C.brd}`,
        borderRadius: 16,
        width: 340,
        maxWidth: "calc(100vw - 32px)",
        fontFamily: FONT,
        boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px", borderBottom: `1px solid ${C.brd}` }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.t1, letterSpacing: "-0.02em" }}>Post Actions</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{resolvedName}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.brd}`, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={13} color={C.t2} />
          </button>
        </div>

        <div style={{ padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── MESSAGE MEMBER ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <MessageCircle size={13} color={C.cyan} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>Message Member</span>
            </div>
            {messageSent ? (
              <div style={{ fontSize: 12, color: C.green, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                ✓ Message sent to {resolvedName}
              </div>
            ) : (
              <>
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder={`Write a message to ${resolvedName}…`}
                  rows={3}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: C.card2, border: `1px solid ${messageText.trim() ? C.cyanBrd : C.brd}`,
                    borderRadius: 9, padding: "9px 11px",
                    color: C.t1, fontSize: 12.5, fontFamily: FONT,
                    resize: "none", outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => e.target.style.borderColor = C.cyanBrd}
                  onBlur={e => e.target.style.borderColor = messageText.trim() ? C.cyanBrd : C.brd}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || sending}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 0",
                    borderRadius: 9, border: "none",
                    background: messageText.trim() ? C.cyan : "rgba(77,127,255,0.2)",
                    color: messageText.trim() ? "#fff" : "rgba(77,127,255,0.4)",
                    fontSize: 12.5, fontWeight: 700, fontFamily: FONT,
                    cursor: messageText.trim() ? "pointer" : "default",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  <Send size={12} /> {sending ? "Sending…" : "Send Message"}
                </button>
              </>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: C.brd }} />

          {/* ── REMOVE POST ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <Trash2 size={13} color={C.red} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>Remove Post</span>
            </div>

            {!showRemove ? (
              <button
                onClick={() => setShowRemove(true)}
                style={{ width: "100%", padding: "9px 0", borderRadius: 9, background: C.redDim, border: `1px solid rgba(255,77,109,0.25)`, color: C.red, fontSize: 12.5, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}
              >
                Remove from Feed
              </button>
            ) : !showConfirm ? (
              <>
                <div style={{ fontSize: 11.5, color: C.t2, marginBottom: 8 }}>Select a reason:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {REMOVAL_REASONS.map(reason => (
                    <button
                      key={reason}
                      onClick={() => setSelectedReason(reason)}
                      style={{
                        padding: "8px 12px", borderRadius: 8, textAlign: "left",
                        background: selectedReason === reason ? C.redDim : C.card2,
                        border: `1px solid ${selectedReason === reason ? "rgba(255,77,109,0.35)" : C.brd}`,
                        color: selectedReason === reason ? C.red : C.t2,
                        fontSize: 12.5, fontWeight: selectedReason === reason ? 700 : 400,
                        fontFamily: FONT, cursor: "pointer",
                        transition: "all 0.1s",
                      }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => { setShowRemove(false); setSelectedReason(null); }}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: C.card2, border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!selectedReason}
                    onClick={() => selectedReason && setShowConfirm(true)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: selectedReason ? C.red : "rgba(255,77,109,0.2)", border: "none", color: selectedReason ? "#fff" : "rgba(255,77,109,0.35)", fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: selectedReason ? "pointer" : "default", transition: "background 0.15s" }}
                  >
                    Confirm
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: 12.5, color: C.t2, marginBottom: 12, lineHeight: 1.55 }}>
                  Remove this post and notify <span style={{ color: C.t1, fontWeight: 700 }}>{resolvedName}</span> for:{" "}
                  <span style={{ color: C.red, fontWeight: 700 }}>{selectedReason}</span>?
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setShowConfirm(false)}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: C.card2, border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRemove}
                    disabled={removing}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: C.red, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}
                  >
                    {removing ? "Removing…" : "Remove Post"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}