import { useState, useRef, useCallback, useEffect } from "react";
import { Calendar, Clock, MapPin, Upload, X, Zap, Users, Search, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CE = {
  bg: '#0d0d11', surface: '#17171c', card: '#1f1f26', inset: '#13131a',
  brd: '#252530', brd2: '#2e2e3a', brdHover: '#3a3a48',
  t1: '#ffffff', t2: '#9898a6', t3: '#525260',
  blue: '#60a5fa', blueDim: 'rgba(96,165,250,0.07)', blueBrd: 'rgba(96,165,250,0.18)',
  red: '#ff4d6d', redDim: 'rgba(255,77,109,0.08)', redBrd: 'rgba(255,77,109,0.20)',
  green: '#22c55e', greenDim: 'rgba(34,197,94,0.08)', greenBrd: 'rgba(34,197,94,0.20)',
};
const CE_FONT = "'DM Sans','Inter',system-ui,sans-serif";

const ceBaseInp = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  borderRadius: 9, background: CE.card, border: `1px solid ${CE.brd}`,
  color: CE.t1, fontSize: 12.5, fontWeight: 500, outline: 'none',
  fontFamily: CE_FONT, transition: 'border-color 0.15s, background 0.15s',
  colorScheme: 'dark',
};

function CESLabel({ children, required }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: CE.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}{required && <span style={{ color: CE.red }}>*</span>}
    </div>
  );
}

function CEField({ label, required, hint, children }) {
  return (
    <div>
      {label && <CESLabel required={required}>{label}</CESLabel>}
      {children}
      {hint && <div style={{ fontSize: 10, color: CE.t3, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function CEInp({ value, onChange, placeholder, type = 'text', disabled, Icon, accentColor = CE.blue }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && (
        <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon size={12} color={focus ? accentColor : CE.t3} style={{ transition: 'color 0.15s' }} />
        </div>
      )}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        onFocus={e => { setFocus(true); e.target.style.borderColor = `${accentColor}38`; e.target.style.background = CE.inset; }}
        onBlur={e => { setFocus(false); e.target.style.borderColor = CE.brd; e.target.style.background = CE.card; }}
        style={{
          ...ceBaseInp,
          fontSize: 16,
          paddingLeft: Icon ? 32 : 12,
          opacity: disabled ? 0.45 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </div>
  );
}

function CETextarea({ value, onChange, placeholder, rows = 4, accentColor = CE.blue }) {
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={e => { e.target.style.borderColor = `${accentColor}38`; e.target.style.background = CE.inset; }}
      onBlur={e => { e.target.style.borderColor = CE.brd; e.target.style.background = CE.card; }}
      style={{ ...ceBaseInp, resize: 'none', lineHeight: 1.7, padding: '11px 13px', fontSize: 16 }}
    />
  );
}

function CEEventPreview({ form, gym }) {
  const hasContent = form.title || form.event_date;
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
      " at " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };
  const timeLabel = (() => {
    if (!form.event_date) return null;
    const d = new Date(form.event_date);
    if (isNaN(d.getTime())) return null;
    const start = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return form.end_time ? `${start}–${form.end_time}` : start;
  })();
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 9.5, fontWeight: 600, color: CE.t3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
      </div>
      <div style={{ borderRadius: 12, overflow: 'hidden', background: CE.card, border: `1px solid ${CE.brd}` }}>
        {form.image_url ? (
          <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
            <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(13,13,17,0.88) 100%)' }} />
          </div>
        ) : (
          <div style={{ height: 96, background: CE.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${CE.brd}` }}>
            <Calendar size={26} color={CE.t3} />
          </div>
        )}
        <div style={{ padding: '13px 15px 0' }}>
          {!hasContent ? (
            <div style={{ textAlign: 'center', padding: '16px 0 14px' }}>
              <div style={{ fontSize: 11.5, color: CE.t3, fontWeight: 500 }}>Fill in details to preview your event</div>
            </div>
          ) : (
            <>
              {form.event_date && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 5, background: CE.blueDim, border: `1px solid ${CE.blueBrd}`, marginBottom: 8 }}>
                  <Calendar size={9} color={CE.blue} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: CE.blue }}>{formatDate(form.event_date)}</span>
                  {timeLabel && <span style={{ fontSize: 9.5, fontWeight: 700, color: CE.blue }}>· {timeLabel}</span>}
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: CE.t1, letterSpacing: '-0.02em', marginBottom: form.description ? 7 : 12, lineHeight: 1.35 }}>
                {form.title || 'Event Title'}
              </div>
              {form.description && (
                <div style={{ fontSize: 11, color: CE.t2, lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {form.description}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 0 14px', borderTop: `1px solid ${CE.brd}` }}>
                <Users size={10} color={CE.t3} />
                <span style={{ fontSize: 10, color: CE.t3 }}>0 going</span>
              </div>
            </>
          )}
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
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#525260", cursor: "pointer", display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: "12px 20px", borderBottom: `1px solid #252530`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#1f1f26", border: `1px solid #252530`, borderRadius: 9, padding: "8px 12px" }}>
            <Search size={13} color="#525260" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by event title…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 13, fontFamily: CE_FONT }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#525260", cursor: "pointer", display: "flex", padding: 0 }}><X size={12} /></button>}
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 12px 12px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#525260", fontSize: 12 }}>
              {search ? "No events match your search" : "No events created yet"}
            </div>
          ) : filtered.map(ev => {
            const eventDate = ev.event_date ? new Date(ev.event_date) : null;
            const dateLabel = eventDate ? eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;
            return (
              <button key={ev.id} onClick={() => onSelect(ev)}
                style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 9, marginBottom: 4, background: "transparent", border: `1px solid transparent`, cursor: "pointer", fontFamily: CE_FONT, transition: "all 0.14s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(77,127,255,0.08)"; e.currentTarget.style.borderColor = "rgba(77,127,255,0.22)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(77,127,255,0.12)", border: `1px solid rgba(77,127,255,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {ev.image_url ? <img src={ev.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} /> : <Calendar size={14} color="#4d7fff" />}
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
          })}
        </div>
      </div>
    </div>
  );
}

export function CreateEventModal({ open, onClose, onSave, gym, isLoading, existingEvents = [] }) {
  const EMPTY = { title: '', description: '', event_date: '', end_time: '', image_url: '' };
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const fileRef = useRef();

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.title.trim() && form.event_date && !isLoading;

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const r = await base44.integrations.Core.UploadFile({ file });
      set('image_url', r.file_url);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    onSave(form);
    setForm(EMPTY);
  };

  const handleClose = () => {
    setForm(EMPTY);
    onClose();
  };

  const handleRepeatSelect = (ev) => {
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      event_date: '',
      end_time: ev.end_time || '',
      image_url: ev.image_url || '',
    });
    setShowRepeatPicker(false);
  };

  if (!open) return null;

  const formatPreview = (dtStr) => {
    if (!dtStr) return null;
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
      " at " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <style>{`
        @keyframes ce-fade { from{opacity:0} to{opacity:1} }
        @keyframes ce-in   { from{opacity:0;transform:scale(0.975) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes ce-up   { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ce-spin { to{transform:rotate(360deg)} }
        .ce-scroll::-webkit-scrollbar       { width:3px }
        .ce-scroll::-webkit-scrollbar-track { background:transparent }
        .ce-scroll::-webkit-scrollbar-thumb { background:${CE.brd2}; border-radius:2px }
        .ce-cancel {
          padding:9px 18px; border-radius:8px; background:transparent; border:1px solid ${CE.brd};
          color:${CE.t2}; font-size:12.5px; font-weight:600; cursor:pointer; font-family:${CE_FONT}; transition:all 0.15s;
        }
        .ce-cancel:hover { border-color:${CE.brdHover}; color:${CE.t1}; background:${CE.card}; }
      `}</style>

      <div
        onClick={e => e.target === e.currentTarget && handleClose()}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          padding: isMobile ? 0 : 20,
          animation: 'ce-fade 0.15s ease', fontFamily: CE_FONT,
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : 920,
          maxHeight: isMobile ? '96vh' : '92vh',
          height: isMobile ? '96vh' : 'auto',
          display: 'flex', flexDirection: 'column',
          background: CE.bg,
          border: isMobile ? 'none' : `1px solid ${CE.brd}`,
          borderRadius: isMobile ? '20px 20px 0 0' : 14,
          overflow: 'hidden',
          boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(96,165,250,0.04)`,
          animation: isMobile ? 'ce-up 0.3s cubic-bezier(0.32,0.72,0,1)' : 'ce-in 0.24s cubic-bezier(0.16,1,0.3,1)',
          WebkitFontSmoothing: 'antialiased',
        }}>

          {/* HEADER */}
          <div style={{
            flexShrink: 0,
            padding: isMobile ? '0 16px' : '16px 20px',
            background: CE.surface, borderBottom: `1px solid ${CE.brd}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {isMobile && (
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 2, background: CE.brd2 }} />
            )}

            {isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, background: CE.blueDim, border: `1px solid ${CE.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={13} color={CE.blue} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: CE.t1, letterSpacing: '-0.02em' }}>Create Event</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setShowPreview(v => !v)}
                    style={{ height: 30, padding: '0 10px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 5, background: showPreview ? CE.blueDim : 'transparent', border: `1px solid ${showPreview ? CE.blueBrd : CE.brd}`, cursor: 'pointer', color: showPreview ? CE.blue : CE.t3, fontSize: 11, fontWeight: 600, fontFamily: CE_FONT }}>
                    {showPreview ? 'Edit' : 'Preview'}
                  </button>
                  <button onClick={handleClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: CE.t3 }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: CE.blueDim, border: `1px solid ${CE.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={14} color={CE.blue} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: CE.t1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Create Event</div>
                </div>
                <button onClick={handleClose}
                  style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: CE.t3, flexShrink: 0, transition: 'color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = CE.t1; }}
                  onMouseLeave={e => { e.currentTarget.style.color = CE.t3; }}>
                  <X size={16} />
                </button>
              </>
            )}
          </div>

          {/* BODY */}
          <form onSubmit={handleSubmit} style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', minHeight: 0, overflow: 'hidden' }}>
            {(!isMobile || !showPreview) && (
              <div className="ce-scroll" style={{
                padding: isMobile ? '16px 16px' : '18px 20px',
                borderRight: isMobile ? 'none' : `1px solid ${CE.brd}`,
                display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 18,
                overflowY: 'auto', background: CE.bg,
                WebkitOverflowScrolling: 'touch',
              }}>
                <CEField label="Event Title" required>
                  <CEInp value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Fitness Challenge" Icon={Zap} accentColor={CE.blue} />
                </CEField>

                <CEField label="Description">
                  <CETextarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tell members what to expect, what to bring, and who it's for…" rows={isMobile ? 3 : 4} accentColor={CE.blue} />
                </CEField>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 14 : 12 }}>
                  <CEField label="Start Date & Time" required>
                    <CEInp type="datetime-local" value={form.event_date} onChange={e => set('event_date', e.target.value)} Icon={Calendar} accentColor={CE.blue} />
                    {form.event_date && formatPreview(form.event_date) && (
                      <div style={{ fontSize: 10, color: CE.blue, fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={9} color={CE.blue} />
                        {formatPreview(form.event_date)}
                      </div>
                    )}
                  </CEField>
                  <CEField label="Finish Time" hint="Optional end time (e.g. 18:00)">
                    <CEInp type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} Icon={Clock} accentColor={CE.blue} />
                  </CEField>
                </div>

                <CEField label="Location" hint="Set to your gym by default">
                  <CEInp value={gym?.name || ''} disabled Icon={MapPin} accentColor={CE.blue} />
                </CEField>

                <CEField label="Banner Image" hint="Recommended: 1200×630px · PNG or JPG">
                  {form.image_url ? (
                    <div style={{ position: 'relative', borderRadius: 9, overflow: 'hidden' }}>
                      <img src={form.image_url} alt="Banner" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', borderRadius: 9, border: `1px solid ${CE.brd}` }} onError={e => e.target.style.display = 'none'} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 55%)', borderRadius: 9, pointerEvents: 'none' }} />
                      <button type="button" onClick={() => set('image_url', '')} style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,13,17,0.82)', border: `1px solid ${CE.brd}`, cursor: 'pointer' }}>
                        <X size={10} color={CE.t1} />
                      </button>
                      <div style={{ position: 'absolute', bottom: 8, left: 11, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Banner attached ✓</div>
                    </div>
                  ) : (
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      style={{ padding: '20px 14px', borderRadius: 9, border: `1.5px dashed ${dragOver ? CE.blue + '60' : CE.brd2}`, background: dragOver ? CE.blueDim : CE.card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, cursor: 'pointer', transition: 'all 0.18s' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: CE.blueDim, border: `1px solid ${CE.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {uploading
                          ? <div style={{ width: 14, height: 14, border: `2px solid ${CE.blue}25`, borderTop: `2px solid ${CE.blue}`, borderRadius: '50%', animation: 'ce-spin 0.8s linear infinite' }} />
                          : <Upload size={14} color={CE.blue} />}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: CE.t2 }}>{uploading ? 'Uploading…' : 'Drop image or click to browse'}</div>
                        <div style={{ fontSize: 10, color: CE.t3, marginTop: 3 }}>PNG, JPG · up to 10 MB</div>
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />
                    </div>
                  )}
                </CEField>

                {isMobile && <div style={{ height: 8 }} />}
              </div>
            )}

            {(!isMobile || showPreview) && (
              <div className="ce-scroll" style={{ padding: isMobile ? '16px 16px' : '18px 16px', background: CE.surface, overflowY: 'auto', borderLeft: isMobile ? 'none' : `1px solid ${CE.brd}`, WebkitOverflowScrolling: 'touch' }}>
                <CEEventPreview form={form} gym={gym} />
              </div>
            )}
          </form>

          {/* FOOTER */}
          <div style={{
            flexShrink: 0,
            padding: isMobile ? '12px 16px' : '12px 20px',
            borderTop: `1px solid ${CE.brd}`,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? 8 : 10,
            background: CE.surface,
          }}>
            {!isMobile && (
              <div style={{ flex: 1 }}>
                <button type="button" onClick={() => setShowRepeatPicker(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${CE.brd}`, color: CE.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: CE_FONT, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = CE.blueBrd; e.currentTarget.style.color = CE.blue; e.currentTarget.style.background = CE.blueDim; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = CE.brd; e.currentTarget.style.color = CE.t2; e.currentTarget.style.background = 'transparent'; }}>
                  <RefreshCw size={12} color="currentColor" />
                  Repeat Event
                </button>
              </div>
            )}

            {isMobile && canSubmit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10.5, color: CE.t3 }}>
                  {form.title}{form.event_date ? ` · ${new Date(form.event_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ''}
                </span>
              </div>
            )}

            {isMobile ? (
              <>
                <button type="button" onClick={() => setShowRepeatPicker(true)}
                  style={{ width: '100%', height: 44, borderRadius: 10, border: `1px solid ${CE.brd}`, fontFamily: CE_FONT, fontSize: 13, fontWeight: 600, background: 'transparent', color: CE.t2, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, WebkitTapHighlightColor: 'transparent' }}>
                  <RefreshCw size={14} color="currentColor" /> Repeat Event
                </button>
                <button type="submit" onClick={handleSubmit} disabled={!canSubmit}
                  style={{ width: '100%', height: 50, borderRadius: 12, border: 'none', fontFamily: CE_FONT, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', background: canSubmit ? CE.blue : CE.brd2, color: canSubmit ? '#fff' : CE.t3, cursor: canSubmit ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: canSubmit ? `0 0 24px ${CE.blue}40` : 'none', opacity: canSubmit ? 1 : 0.4, WebkitTapHighlightColor: 'transparent' }}>
                  {isLoading
                    ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'ce-spin 0.7s linear infinite' }} /> Creating…</>
                    : <><Calendar size={15} /> Create Event</>}
                </button>
                <button type="button" onClick={handleClose} style={{ background: 'none', border: 'none', color: CE.t3, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: CE_FONT, padding: '6px 0', textAlign: 'center' }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button type="button" className="ce-cancel" onClick={handleClose}>Cancel</button>
                <button type="submit" onClick={handleSubmit} disabled={!canSubmit}
                  style={{ padding: '9px 22px', borderRadius: 8, border: 'none', fontFamily: CE_FONT, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', background: canSubmit ? CE.blue : CE.brd2, color: canSubmit ? '#fff' : CE.t3, cursor: canSubmit ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 7, boxShadow: canSubmit ? `0 0 24px ${CE.blue}40` : 'none', opacity: canSubmit ? 1 : 0.4, minWidth: 155, justifyContent: 'center', transition: 'opacity 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { if (canSubmit) e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { if (canSubmit) e.currentTarget.style.opacity = '1'; }}>
                  {isLoading
                    ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'ce-spin 0.7s linear infinite' }} /> Creating…</>
                    : <><Calendar size={13} /> Create Event</>}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showRepeatPicker && (
        <RepeatEventPicker
          events={existingEvents}
          onSelect={handleRepeatSelect}
          onClose={() => setShowRepeatPicker(false)}
        />
      )}
    </>
  );
}

export default CreateEventModal;