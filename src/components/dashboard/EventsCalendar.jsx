import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export default function EventsCalendar({ events, classes = [], onDeleteEvent, onAddEvent, onAddClass, onEventEdited, onDeleteClass }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
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

  const eventsByDay = {};
  events.forEach(ev => {
    if (!ev.event_date) return;
    const d = new Date(ev.event_date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(ev);
  });

  // Build classes by day — respects one-off vs weekly
  const classesByDay = {};
  const daysInView = new Date(viewYear, viewMonth + 1, 0).getDate();
  (classes || []).forEach(cls => {
    (cls.schedule || []).forEach(s => {
      // Skip entries with no date
      if (!s.date) return;
      // Normalise: strip any time component so key is always YYYY-MM-DD
      const dateKey = s.date.length > 10 ? s.date.slice(0, 10) : s.date;
      if (s.weekly === true) {
        // Weekly repeating: show on matching weekday ON OR AFTER the start date
        const startDate = new Date(dateKey + 'T00:00:00');
        const targetDow = DAY_NAME_TO_DOW[s.day];
        if (targetDow === undefined) return;
        for (let d = 1; d <= daysInView; d++) {
          const cellDate = new Date(viewYear, viewMonth, d);
          if (cellDate.getDay() === targetDow && cellDate >= startDate) {
            const key = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            if (!classesByDay[key]) classesByDay[key] = [];
            classesByDay[key].push({ ...cls, _scheduleTime: s.time });
          }
        }
      } else {
        // One-off: show only on the specific date
        if (!classesByDay[dateKey]) classesByDay[dateKey] = [];
        classesByDay[dateKey].push({ ...cls, _scheduleTime: s.time });
      }
    });
  });

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
      events: eventsByDay[key] || [],
      classes: isOtherMonth ? [] : (classesByDay[key] || []),
      isToday: key === todayKey,
      isOtherMonth,
    });
  }

  const totalEvents = events.filter(ev => {
    if (!ev.event_date) return false;
    const d = new Date(ev.event_date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  }).length;

  // Count classes visible in this month's view
  const totalClasses = Object.values(classesByDay).flat().length;

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
        .cal-cell:hover { background: rgba(77,127,255,0.04) !important; }
        .cal-event-pill { transition: background 0.12s, border-color 0.12s; white-space: normal !important; word-break: break-word; }
        .cal-event-pill:hover { background: rgba(77,127,255,0.22) !important; border-color: rgba(77,127,255,0.5) !important; }
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
            return (
              <div key={cell.key} className="cal-cell"
                style={{ padding: "8px 7px 8px", borderRight: isLastCol ? "none" : `1px solid ${C.brd}`, borderBottom: isLastRow ? "none" : `1px solid ${C.brd}`, background: cell.isToday ? "rgba(77,127,255,0.06)" : cell.isOtherMonth ? "rgba(255,255,255,0.012)" : "transparent", transition: "background 0.12s", minHeight: 100, boxSizing: "border-box", opacity: cell.isOtherMonth ? 0.45 : 1 }}>
                <div style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: cell.isToday ? C.cyan : "transparent", marginBottom: 5, fontSize: 11.5, fontWeight: cell.isToday ? 800 : cell.isOtherMonth ? 400 : 500, color: cell.isToday ? "#fff" : cell.isOtherMonth ? C.t3 : C.t2, lineHeight: 1, flexShrink: 0 }}>
                  {cell.dayNum}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {cell.events.slice(0, 3).map(ev => (
                    <button key={ev.id} className="cal-event-pill"
                      onClick={() => !cell.isOtherMonth && setSelectedEvent(ev)}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "3px 6px", borderRadius: 5, background: cell.isOtherMonth ? "rgba(77,127,255,0.06)" : C.cyanDim, border: `1px solid ${cell.isOtherMonth ? "rgba(77,127,255,0.12)" : C.cyanBrd}`, cursor: cell.isOtherMonth ? "default" : "pointer", fontFamily: FONT, overflow: "hidden", whiteSpace: "normal", wordBreak: "break-word", fontSize: 10.5, fontWeight: 600, color: cell.isOtherMonth ? "rgba(77,127,255,0.5)" : C.cyan, lineHeight: 1.35, boxSizing: "border-box" }}>
                      {ev.title}
                    </button>
                  ))}
                  {(cell.classes || []).slice(0, 2).map((cls, ci) => (
                    <button key={`cls-${cls.id}-${ci}`}
                      onClick={() => setSelectedClass(cls)}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "3px 6px", borderRadius: 5, background: "rgba(168,85,247,0.14)", border: "1px solid rgba(168,85,247,0.32)", cursor: "pointer", fontFamily: FONT, overflow: "hidden", whiteSpace: "normal", wordBreak: "break-word", fontSize: 10.5, fontWeight: 600, color: "#a855f7", lineHeight: 1.35, boxSizing: "border-box", transition: "background 0.12s, border-color 0.12s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(168,85,247,0.25)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.55)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(168,85,247,0.14)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.32)"; }}>
                      {cls.name}{cls._scheduleTime ? ` · ${cls._scheduleTime}` : ''}
                    </button>
                  ))}
                  {(cell.events.length + (cell.classes || []).length) > 5 && (
                    <div style={{ fontSize: 10, color: C.t3, fontWeight: 600, paddingLeft: 6, marginTop: 1 }}>+{cell.events.length + (cell.classes || []).length - 5} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, paddingLeft: 2, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: C.cyanDim, border: `1px solid ${C.cyanBrd}` }} />
          <span style={{ fontSize: 10.5, color: C.t3 }}>Event — click for details</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(168,85,247,0.14)", border: "1px solid rgba(168,85,247,0.32)" }} />
          <span style={{ fontSize: 10.5, color: C.t3 }}>Class — click for details</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.cyan }} />
          <span style={{ fontSize: 10.5, color: C.t3 }}>Today</span>
        </div>
      </div>

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