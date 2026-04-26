import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import EventDetailPopup from "./EventDetailPopup";
import ClassDetailPopup from "./ClassDetailPopup";

const C = {
  bg: "#000000", card: "#141416", brd: "#222226", brd2: "#2a2a30",
  t1: "#ffffff", t2: "#8a8a94", t3: "#444450",
  cyan: "#4d7fff", cyanDim: "rgba(77,127,255,0.12)", cyanBrd: "rgba(77,127,255,0.28)",
};
const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAME_TO_DOW = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 };

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
      <button onClick={() => setOpen(o => !o)}
        style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: "-0.01em", userSelect: "none", background: "none", border: "none", cursor: "pointer", fontFamily: FONT, padding: "2px 4px", borderRadius: 6, transition: "color 0.12s" }}
        onMouseEnter={e => e.currentTarget.style.color = C.cyan}
        onMouseLeave={e => e.currentTarget.style.color = C.t1}>
        {MONTH_NAMES[viewMonth]} {viewYear}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", zIndex: 300, background: "#1a1a1f", border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden", minWidth: 160, boxShadow: "0 12px 32px rgba(0,0,0,0.65)", maxHeight: 280, overflowY: "auto" }}>
          {options.map((o, i) => (
            <button key={i} onClick={() => { onSelect(o.year, o.month); setOpen(false); }}
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

// ── Day detail modal — fixed-height scroll, 9–17 core always visible ─────────
function DayDetailModal({ cell, dateLabel, onClose, onSelectEvent, onSelectClass }) {
  const PX_PER_MIN = 0.84;  // 0.8 × 1.05 — 5% taller per hour
  const PADDING_MIN = 30;   // 30-min buffer around content
  const CORE_START  = 7 * 60;   // 07:00
  const CORE_END    = 20 * 60;  // 20:00
  // Fixed visible height = 13 hours of core × PX_PER_MIN
  const VISIBLE_H   = Math.round((CORE_END - CORE_START) * PX_PER_MIN) + 20;

  // Build items
  const items = [];
  (cell.events || []).forEach(ev => {
    const d = new Date(ev.event_date);
    const startMin = d.getHours() * 60 + d.getMinutes();
    const durationMin = ev.duration_minutes || 60;
    items.push({ type: "event", data: ev, startMin, durationMin, color: C.cyan });
  });
  (cell.classes || []).forEach(cls => {
    const t = cls._scheduleTime || "00:00";
    const [h, m] = t.split(":").map(Number);
    const startMin = (h || 0) * 60 + (m || 0);
    const durationMin = cls.duration_minutes || 60;
    const rawColor = (cls.color && cls.color.startsWith("#") && cls.color.length >= 7) ? cls.color : "#a855f7";
    items.push({ type: "class", data: cls, startMin, durationMin, color: rawColor });
  });
  items.sort((a, b) => a.startMin - b.startMin);

  // Window: always at least 09:00–17:00, expand to fit any items + padding
  const earliestStart = items.length > 0 ? Math.min(...items.map(i => i.startMin)) : CORE_START;
  const latestEnd     = items.length > 0 ? Math.max(...items.map(i => i.startMin + i.durationMin)) : CORE_END;
  const windowStart = Math.max(0,        Math.min(earliestStart - PADDING_MIN, CORE_START));
  const windowEnd   = Math.min(24 * 60,  Math.max(latestEnd + PADDING_MIN,    CORE_END));
  const TIMELINE_H  = Math.round((windowEnd - windowStart) * PX_PER_MIN);

  // Hour labels within window
  const hourLabels = [];
  for (let h = Math.floor(windowStart / 60); h <= Math.ceil(windowEnd / 60); h++) hourLabels.push(h);

  // Scroll to 9am (core top) on mount
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.round((CORE_START - windowStart) * PX_PER_MIN) - 10;
    }
  }, []);

  // Greedy column assignment for overlaps
  const columns = [];
  const itemsWithCol = items.map(item => {
    let col = 0;
    while (true) {
      const colItems = columns[col] || [];
      const overlaps = colItems.some(ci =>
        ci.startMin < item.startMin + item.durationMin && ci.startMin + ci.durationMin > item.startMin
      );
      if (!overlaps) {
        if (!columns[col]) columns[col] = [];
        columns[col].push(item);
        return { ...item, col };
      }
      col++;
    }
  });
  const numCols = Math.max(1, ...itemsWithCol.map(i => i.col + 1));

  const HOUR_LABEL_W = 40;
  const minToPx = (min) => Math.round((min - windowStart) * PX_PER_MIN);

  // 9–5 highlight band
  const coreTop    = minToPx(CORE_START);
  const coreBottom = minToPx(CORE_END);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#17171c", border: `1px solid ${C.brd}`, borderRadius: 14, width: 400, maxWidth: "94vw", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.8)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px", borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.t1, letterSpacing: "-0.01em" }}>{dateLabel}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", display: "flex", alignItems: "center", padding: 2 }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            <X size={15} />
          </button>
        </div>

        {/* Fixed-height scroll container — always shows the 9–5 band */}
        <div ref={scrollRef} style={{ height: VISIBLE_H, overflowY: "auto", padding: "0 10px 0 0" }}>
          <div style={{ position: "relative", height: TIMELINE_H, display: "flex" }}>

            {/* Hour labels */}
            <div style={{ width: HOUR_LABEL_W, flexShrink: 0, position: "relative" }}>
              {hourLabels.map(h => {
                const absMin = h * 60;
                if (absMin < windowStart || absMin > windowEnd) return null;
                return (
                  <div key={h} style={{
                    position: "absolute",
                    top: minToPx(absMin) - 7,
                    left: 0, width: HOUR_LABEL_W,
                    textAlign: "right", paddingRight: 8,
                    fontSize: 9.5, fontWeight: 600,
                    color: C.t3,
                    lineHeight: 1, userSelect: "none",
                  }}>
                    {String(h).padStart(2, "0")}:00
                  </div>
                );
              })}
            </div>

            {/* Grid area */}
            <div style={{ flex: 1, position: "relative", marginRight: 4 }}>



              {/* Hour lines */}
              {hourLabels.map(h => {
                const absMin = h * 60;
                if (absMin < windowStart || absMin > windowEnd) return null;
                return (
                  <div key={h} style={{
                    position: "absolute", top: minToPx(absMin),
                    left: 0, right: 0, height: 1,
                    background: "rgba(255,255,255,0.07)",
                  }} />
                );
              })}
              {/* Half-hour lines */}
              {hourLabels.map(h => {
                const absMin = h * 60 + 30;
                if (absMin <= windowStart || absMin >= windowEnd) return null;
                return (
                  <div key={`hh-${h}`} style={{
                    position: "absolute", top: minToPx(absMin),
                    left: 0, right: 0, height: 1,
                    background: "rgba(255,255,255,0.03)",
                  }} />
                );
              })}

              {/* Empty state hint */}
              {items.length === 0 && (
                <div style={{
                  position: "absolute",
                  top: coreTop + (coreBottom - coreTop) / 2 - 10,
                  left: 0, right: 0,
                  textAlign: "center",
                  fontSize: 11, color: C.t3, fontFamily: FONT,
                }}>No events scheduled</div>
              )}

              {/* Event / class blocks */}
              {itemsWithCol.map((item, i) => {
                const top = minToPx(item.startMin);
                const height = Math.max(18, Math.round(item.durationMin * PX_PER_MIN));
                const colW = 1 / numCols;
                const left = `${item.col * colW * 100}%`;
                const width = `calc(${colW * 100}% - 4px)`;
                const color = item.color;
                const bg = hexToRgba(color, 0.15);
                const brd = hexToRgba(color, 0.4);
                const label = item.type === "event" ? item.data.title : item.data.name;
                const sublabel = item.type === "class" ? (item.data.instructor || "") : "";
                const timeStr = `${String(Math.floor(item.startMin / 60)).padStart(2, "0")}:${String(item.startMin % 60).padStart(2, "0")}`;
                return (
                  <button key={i}
                    onClick={() => { onClose(); if (item.type === "event") onSelectEvent(item.data); else onSelectClass(item.data); }}
                    style={{
                      position: "absolute", top, left, width, height,
                      background: bg, border: `1px solid ${brd}`, borderLeft: `3px solid ${color}`,
                      borderRadius: 5, padding: "3px 6px", cursor: "pointer",
                      textAlign: "left", fontFamily: FONT, overflow: "hidden",
                      display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 1,
                      transition: "opacity 0.12s", boxSizing: "border-box",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    {/* Title row with time top-right */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2, flex: 1, minWidth: 0 }}>{label}</div>
                      {height > 20 && (
                        <div style={{ fontSize: 9.5, color: C.t1, fontWeight: 500, lineHeight: 1.2, whiteSpace: "nowrap", flexShrink: 0, opacity: 0.75 }}>
                          {timeStr}–{`${String(Math.floor((item.startMin + item.durationMin) / 60) % 24).padStart(2, "0")}:${String((item.startMin + item.durationMin) % 60).padStart(2, "0")}`}
                        </div>
                      )}
                    </div>
                    {height > 32 && sublabel && (
                      <div style={{ fontSize: 10.5, color: C.t1, fontWeight: 600, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Coach — {sublabel}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventsCalendar({ events, classes = [], onDeleteEvent, onAddEvent, onAddClass, onEventEdited, onDeleteClass }) {
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDayCell, setSelectedDayCell] = useState(null);
  const [slideDir, setSlideDir] = useState(null);
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

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  // ── Events by day ────────────────────────────────────────────────
  const eventsByDay = {};
  events.forEach(ev => {
    if (!ev.event_date) return;
    const d = new Date(ev.event_date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(ev);
  });

  // ── Classes by day ───────────────────────────────────────────────
  const daysInView = new Date(viewYear, viewMonth + 1, 0).getDate();
  const classesByDay = {};

  (classes || []).forEach(cls => {
    (cls.schedule || []).forEach(s => {
      if (s.date) {
        const dateKey = s.date.length > 10 ? s.date.slice(0, 10) : s.date;
        if (s.weekly) {
          const startDate = new Date(dateKey + "T00:00:00");
          const effectiveStart = startDate >= todayMidnight ? startDate : todayMidnight;
          const targetDow = DAY_NAME_TO_DOW[s.day];
          if (targetDow === undefined) return;
          for (let d = 1; d <= daysInView; d++) {
            const cellDate = new Date(viewYear, viewMonth, d);
            if (cellDate.getDay() === targetDow && cellDate >= effectiveStart) {
              const key = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              if (!classesByDay[key]) classesByDay[key] = [];
              classesByDay[key].push({ ...cls, _scheduleTime: s.time });
            }
          }
        } else {
          if (!classesByDay[dateKey]) classesByDay[dateKey] = [];
          classesByDay[dateKey].push({ ...cls, _scheduleTime: s.time });
        }
      } else if (s.day) {
        const targetDow = DAY_NAME_TO_DOW[s.day];
        if (targetDow === undefined) return;
        for (let d = 1; d <= daysInView; d++) {
          const cellDate = new Date(viewYear, viewMonth, d);
          if (cellDate.getDay() === targetDow) {
            const key = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            if (!classesByDay[key]) classesByDay[key] = [];
            classesByDay[key].push({ ...cls, _scheduleTime: s.time });
          }
        }
      }
    });
  });

  // ── Build calendar cells ─────────────────────────────────────────
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startDow = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
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
      dayNum: cellDay, key,
      cellYear, cellMonth, cellDay,
      events: eventsByDay[key] || [],
      classes: classesByDay[key] || [],
      isToday: key === todayKey,
      isOtherMonth,
    });
  }

  const totalEvents = events.filter(ev => {
    if (!ev.event_date) return false;
    const d = new Date(ev.event_date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  }).length;

  const totalClasses = Object.values(classesByDay).flat().length;

  // Pills: 5% shorter line-height (1.14 vs 1.2)
  const pillStyle = {
    display: "block", width: "100%", textAlign: "left",
    padding: "2px 5px", borderRadius: 4,
    cursor: "pointer", fontFamily: FONT,
    overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
    fontSize: 10, fontWeight: 600, lineHeight: "1.14",
    boxSizing: "border-box",
  };

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
        .cal-cell { cursor: pointer; }
        .cal-cell:hover { background: rgba(77,127,255,0.04) !important; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>
          {totalEvents} event{totalEvents !== 1 ? "s" : ""} · {totalClasses} class{totalClasses !== 1 ? "es" : ""} this month
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <button onClick={() => navigate(-1)} disabled={animating}
            style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 6, cursor: animating ? "default" : "pointer", color: C.t2, transition: "color 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1}
            onMouseLeave={e => e.currentTarget.style.color = C.t2}>
            <ChevronLeft size={16} />
          </button>
          <MonthDropdown viewYear={viewYear} viewMonth={viewMonth} onSelect={(y, m) => { setViewYear(y); setViewMonth(m); }} />
          <button onClick={() => navigate(1)} disabled={animating}
            style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 6, cursor: animating ? "default" : "pointer", color: C.t2, transition: "color 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1}
            onMouseLeave={e => e.currentTarget.style.color = C.t2}>
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
        <div className={`cal-grid-wrap${slideDir ? " " + (slideDir === "left" ? "cal-slide-out-left" : "cal-slide-out-right") : ""}`}
          key={`${viewYear}-${viewMonth}`}
          style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((cell, idx) => {
            const isLastRow = idx >= cells.length - 7;
            const isLastCol = (idx % 7) === 6;
            const hasItems = cell.events.length > 0 || (cell.classes || []).length > 0;
            return (
              <div key={cell.key} className="cal-cell"
                onClick={() => !cell.isOtherMonth && setSelectedDayCell(cell)}
                style={{
                  padding: "8px 7px 8px",
                  borderRight: isLastCol ? "none" : `1px solid ${C.brd}`,
                  borderBottom: isLastRow ? "none" : `1px solid ${C.brd}`,
                  background: cell.isToday ? "rgba(77,127,255,0.06)" : cell.isOtherMonth ? "rgba(255,255,255,0.012)" : "transparent",
                  transition: "background 0.12s",
                  // 10% taller: 96 → 106px
                  height: 106,
                  boxSizing: "border-box",
                  overflow: "hidden",
                  opacity: cell.isOtherMonth ? 0.4 : 1,
                }}>
                <div style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: cell.isToday ? C.cyan : "transparent", marginBottom: 3, fontSize: 11.5, fontWeight: cell.isToday ? 800 : cell.isOtherMonth ? 400 : 500, color: cell.isToday ? "#fff" : cell.isOtherMonth ? C.t3 : C.t2, lineHeight: 1, flexShrink: 0 }}>
                  {cell.dayNum}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Events — up to 4 total rows combined */}
                  {cell.events.slice(0, 4).map(ev => (
                    <div key={ev.id} style={{ ...pillStyle, background: cell.isOtherMonth ? "rgba(77,127,255,0.06)" : C.cyanDim, border: `1px solid ${cell.isOtherMonth ? "rgba(77,127,255,0.12)" : C.cyanBrd}`, color: cell.isOtherMonth ? "rgba(77,127,255,0.5)" : C.cyan }}>
                      {ev.title}
                    </div>
                  ))}
                  {/* Classes */}
                  {(cell.classes || []).slice(0, Math.max(0, 4 - cell.events.slice(0, 4).length)).map((cls, ci) => {
                    const rawColor = (cls.color && cls.color.startsWith("#") && cls.color.length >= 7) ? cls.color : "#a855f7";
                    const bgAlpha  = cell.isOtherMonth ? 0.06 : 0.15;
                    const brdAlpha = cell.isOtherMonth ? 0.15 : 0.4;
                    const txtColor = cell.isOtherMonth ? hexToRgba(rawColor, 0.45) : rawColor;
                    return (
                      <div key={`cls-${cls.id}-${ci}`} style={{ ...pillStyle, background: hexToRgba(rawColor, bgAlpha), border: `1px solid ${hexToRgba(rawColor, brdAlpha)}`, color: txtColor }}>
                        {cls.name}
                      </div>
                    );
                  })}
                  {/* Overflow indicator */}
                  {(cell.events.length + (cell.classes || []).length) > 4 && (
                    <div style={{ fontSize: 9.5, color: C.t3, fontWeight: 600, paddingLeft: 4, marginTop: 1 }}>+{cell.events.length + (cell.classes || []).length - 4} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail modal — 24h timeline */}
      {selectedDayCell && (
        <DayDetailModal
          cell={selectedDayCell}
          dateLabel={new Date(selectedDayCell.cellYear, selectedDayCell.cellMonth, selectedDayCell.cellDay).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          onClose={() => setSelectedDayCell(null)}
          onSelectEvent={ev => { setSelectedDayCell(null); setSelectedEvent(ev); }}
          onSelectClass={cls => { setSelectedDayCell(null); setSelectedClass(cls); }}
        />
      )}

      {selectedEvent && (
        <EventDetailPopup event={selectedEvent} onClose={() => setSelectedEvent(null)}
          onDelete={async (id) => { await onDeleteEvent?.(id); setSelectedEvent(null); }}
          onEditSaved={() => { setSelectedEvent(null); onEventEdited?.(); }} />
      )}
      {selectedClass && (
        <ClassDetailPopup gymClass={selectedClass} onClose={() => setSelectedClass(null)}
          onDelete={async (id) => { await onDeleteClass?.(id); setSelectedClass(null); }} />
      )}
    </>
  );
}