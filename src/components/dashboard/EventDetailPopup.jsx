import { useState, useEffect } from "react";
import { Calendar, Clock, Users, Pencil, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const C = {
  bg: "#000000", card: "#141416", card2: "#1a1a1f", brd: "#222226",
  t1: "#ffffff", t2: "#8a8a94", t3: "#444450",
  cyan: "#4d7fff", cyanDim: "rgba(77,127,255,0.12)", cyanBrd: "rgba(77,127,255,0.28)",
  red: "#ff4d6d", redDim: "rgba(255,77,109,0.15)",
};
const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";

function RemoveEventModal({ event, onConfirm, onClose }) {
  const [removing, setRemoving] = useState(false);
  const handleConfirm = async () => { setRemoving(true); try { await onConfirm(event.id); } finally { setRemoving(false); } };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: `1px solid rgba(255,77,109,0.25)`, borderRadius: 14, padding: "20px 24px", width: 380, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.t1 }}>Remove Event</div>
            <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}><span style={{ color: C.t1, fontWeight: 600 }}>{event.title}</span></div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 6, flexShrink: 0, marginLeft: 12 }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            <X size={15} />
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.55 }}>
          This will permanently remove the event. <span style={{ color: C.red, fontWeight: 600 }}>This cannot be undone.</span>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
          <button onClick={handleConfirm} disabled={removing}
            style={{ padding: "8px 18px", borderRadius: 8, background: C.red, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: removing ? "not-allowed" : "pointer", opacity: removing ? 0.7 : 1, fontFamily: FONT }}>
            {removing ? "Removing…" : "Remove Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditEventModal({ event, onClose, onSave }) {
  const toLocalDatetime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [eventDate, setEventDate] = useState(toLocalDatetime(event?.event_date));
  const [imageUrl, setImageUrl] = useState(event?.image_url || "");
  const [saving, setSaving] = useState(false);

  const isDirty = title !== (event?.title || "") || description !== (event?.description || "") ||
    eventDate !== toLocalDatetime(event?.event_date) || imageUrl !== (event?.image_url || "");
  const canSave = isDirty && title.trim() && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await base44.entities.Event.update(event.id, {
        title: title.trim(), description: description.trim() || null,
        event_date: eventDate ? new Date(eventDate).toISOString() : event.event_date,
        image_url: imageUrl || null,
      });
      onSave?.(); onClose();
    } finally { setSaving(false); }
  };

  const formatPreview = (dtStr) => {
    if (!dtStr) return null;
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) +
      " at " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 16, padding: "22px 24px 20px", width: 520, maxWidth: "94vw", maxHeight: "90vh", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={13} color={C.cyan} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.t1 }}>Edit Event</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            <X size={15} />
          </button>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>Event Title <span style={{ color: C.red }}>*</span></div>
          <input value={title} onChange={e => setTitle(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9, background: C.card2, border: `1px solid ${C.brd}`, color: C.t1, fontSize: 13, fontFamily: FONT, outline: "none" }}
            onFocus={e => e.target.style.borderColor = C.cyanBrd} onBlur={e => e.target.style.borderColor = C.brd} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>Description</div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9, background: C.card2, border: `1px solid ${C.brd}`, color: C.t1, fontSize: 13, fontFamily: FONT, lineHeight: 1.65, resize: "vertical", outline: "none" }}
            onFocus={e => e.target.style.borderColor = C.cyanBrd} onBlur={e => e.target.style.borderColor = C.brd} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>Date & Time</div>
          <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9, background: C.card2, border: `1px solid ${C.brd}`, color: C.t1, fontSize: 13, fontFamily: FONT, outline: "none", colorScheme: "dark" }}
            onFocus={e => e.target.style.borderColor = C.cyanBrd} onBlur={e => e.target.style.borderColor = C.brd} />
          {eventDate && formatPreview(eventDate) && (
            <div style={{ fontSize: 10, color: C.cyan, fontWeight: 600, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={9} color={C.cyan} />{formatPreview(eventDate)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
          <button onClick={handleSave} disabled={!canSave}
            style={{ padding: "8px 20px", borderRadius: 8, background: canSave ? C.cyan : C.brd, border: "none", color: canSave ? "#fff" : C.t3, fontSize: 12, fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed", fontFamily: FONT, opacity: canSave ? 1 : 0.5 }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventAttendeesModal({ event, onClose }) {
   const [search, setSearch] = useState("");
   const [resolvedUsers, setResolvedUsers] = useState([]);
   const [loading, setLoading] = useState(true);

   const joinedUserIds = event.attendee_ids || [];

  useEffect(() => {
    if (joinedUserIds.length === 0) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("getUserAvatars", { userIds: joinedUserIds });
        setResolvedUsers(joinedUserIds.map(id => ({
          id,
          name: res.data?.avatars?.[id]?.full_name || "Member",
          avatar: res.data?.avatars?.[id]?.avatar_url || null,
        })));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = resolvedUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
  const ini = (n = "") => (n || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: "20px 20px 16px", width: 380, maxWidth: "92vw", display: "flex", flexDirection: "column", gap: 14, maxHeight: "75vh" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: "-0.02em" }}>
            {event.attendees || 0} Attending
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
            <div style={{ textAlign: "center", padding: "24px 0", color: C.t3, fontSize: 12 }}>
              {resolvedUsers.length === 0 ? "No attendee details available" : "No members found"}
            </div>
          ) : filtered.map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = C.card2}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: C.brd, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.t1 }}>
                {u.avatar ? <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ini(u.name)}
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EventDetailPopup({ event, onClose, onDelete, onEditSaved }) {
   const [modal, setModal] = useState(null);
   const [attendeeAvatars, setAttendeeAvatars] = useState([]);
   const [liveAttendees, setLiveAttendees] = useState(event.attendees || 0);

   const joinedUserIds = event.attendee_ids || [];

  useEffect(() => {
    base44.entities.Event.filter({ id: event.id }).then(res => {
      if (res?.[0]?.attendees !== undefined) setLiveAttendees(res[0].attendees);
    }).catch(() => {});
  }, [event.id]);

  useEffect(() => {
    if (joinedUserIds.length === 0) return;
    base44.functions.invoke("getUserAvatars", { userIds: joinedUserIds.slice(0, 5) }).then(res => {
      setAttendeeAvatars(joinedUserIds.slice(0, 5).map(id => ({
        id,
        avatar: res.data?.avatars?.[id]?.avatar_url || null,
        name: res.data?.avatars?.[id]?.full_name || "Member",
      })));
    }).catch(() => {});
  }, [joinedUserIds.join(",")]);

  const eventDate = event.event_date ? new Date(event.event_date) : null;
   const dateLabel = eventDate ? eventDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null;
   const startTime = eventDate ? eventDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null;
   const timeLabel = startTime && event.end_time ? `${startTime}–${event.end_time}` : startTime;
  const ini = (n = "") => (n || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const extraCount = Math.max(0, liveAttendees - attendeeAvatars.length);

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 16, width: 440, maxWidth: "92vw", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, rgba(77,127,255,0.14) 0%, rgba(77,127,255,0.04) 100%)", borderBottom: `1px solid ${C.brd}`, padding: "18px 20px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Calendar size={16} color={C.cyan} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.t1, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{event.title}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.cyan, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>Event</div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.t3, display: "flex", alignItems: "center", padding: 4, flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = C.t1}
                onMouseLeave={e => e.currentTarget.style.color = C.t3}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {dateLabel && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Calendar size={12} color={C.t3} />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>{dateLabel}</div>
                  {timeLabel && <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>{timeLabel}</div>}
                </div>
              </div>
            )}

            {/* Attendees — clickable row with overlapping avatars */}
            <button
              onClick={() => setModal("attendees")}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", width: "100%" }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Users size={12} color={C.t3} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>{liveAttendees} attending</span>
                {attendeeAvatars.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {attendeeAvatars.map((u, i) => (
                        <div key={u.id} style={{ width: 29, height: 29, borderRadius: "50%", border: `2px solid ${C.card}`, overflow: "hidden", background: C.brd, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: C.t1, marginLeft: i === 0 ? 0 : -9, zIndex: attendeeAvatars.length - i, flexShrink: 0 }}>
                          {u.avatar ? <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ini(u.name)}
                        </div>
                      ))}
                    </div>
                    {extraCount > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.t2 }}>+{extraCount}</span>
                    )}
                  </div>
                )}
              </div>
            </button>

            {event.description && (
              <div style={{ padding: "11px 13px", borderRadius: 9, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 }}>Description</div>
                <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.6 }}>{event.description}</div>
              </div>
            )}
            {event.image_url && (
              <div style={{ borderRadius: 9, overflow: "hidden", border: `1px solid ${C.brd}` }}>
                <img src={event.image_url} alt={event.title} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "12px 20px 16px", borderTop: `1px solid ${C.brd}`, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setModal("edit")}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; e.currentTarget.style.background = C.cyanDim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
              <Pencil size={12} color="currentColor" /> Edit Event
            </button>
            <button onClick={() => setModal("remove")}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,77,109,0.35)"; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
              <Trash2 size={12} color="currentColor" /> Remove Event
            </button>
          </div>
        </div>
      </div>

      {modal === "remove" && <RemoveEventModal event={event} onConfirm={async (id) => { await onDelete?.(id); setModal(null); onClose(); }} onClose={() => setModal(null)} />}
      {modal === "edit" && <EditEventModal event={event} onClose={() => setModal(null)} onSave={() => { setModal(null); onEditSaved?.(); onClose(); }} />}
      {modal === "attendees" && <EventAttendeesModal event={{ ...event, attendees: liveAttendees }} onClose={() => setModal(null)} />}
    </>
  );
}