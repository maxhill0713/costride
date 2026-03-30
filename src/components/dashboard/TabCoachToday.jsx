import React, { useState, useMemo } from "react";
import { format, differenceInDays } from "date-fns";

// ─── CSS ──────────────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("td-css")) {
  const s = document.createElement("style");
  s.id = "td-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .td-root { font-family: 'DM Sans', -apple-system, sans-serif; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
    @keyframes slideDown { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:none } }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    .fade-up { animation: fadeUp .3s ease both; }
    .live-pulse { animation: pulse 2s ease-in-out infinite; }
    .row-hover { transition: background .12s; }
    .row-hover:hover { background: rgba(255,255,255,0.025) !important; }
    .btn-base { font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; outline: none; transition: all .12s; }
    .btn-base:hover { filter: brightness(1.1); }
    .btn-base:active { filter: brightness(.95); transform: scale(.98); }
    .expand-body { animation: slideDown .18s ease both; }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }
  `;
  document.head.appendChild(s);
}

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  bg:       "#080f1a",
  surface:  "#0c1520",
  card:     "#0e1a28",
  inset:    "#091320",
  border:   "rgba(255,255,255,0.07)",
  borderMd: "rgba(255,255,255,0.11)",
  t1: "#dde6f0",
  t2: "#7a8fa8",
  t3: "#3d5068",
  t4: "#1e3048",
  blue:    "#3d82f4",
  blueDim: "rgba(61,130,244,0.12)",
  blueStr: "rgba(61,130,244,0.22)",
  amber:   "#e8962a",
  amberDim:"rgba(232,150,42,0.10)",
  amberStr:"rgba(232,150,42,0.22)",
  red:     "#e05252",
  redDim:  "rgba(224,82,82,0.10)",
  green:   "#21a36f",
  greenDim:"rgba(33,163,111,0.10)",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Spark({ data = [], color = C.blue, h = 26, w = 64 }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = data[data.length - 1];
  const lx = w;
  const ly = h - (last / max) * (h - 4) - 2;
  return (
    <svg width={w} height={h} style={{ overflow: "visible", flexShrink: 0, opacity: .75 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.2}
        strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lx} cy={ly} r={2} fill={color}/>
    </svg>
  );
}

function StatPill({ label, value, color = C.t3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function CapBar({ pct, color = C.blue }) {
  return (
    <div style={{ height: 2, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden", width: 72 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }}/>
    </div>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function AvatarInitials({ name, size = 30, level, src = null }) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const c = level === "high" ? C.red : level === "med" ? C.amber : C.t3;
  const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `${c}14`, border: `1px solid ${c}30`,
      fontSize: size * .33, fontWeight: 800, color: c, letterSpacing: "-.01em",
      overflow: "hidden",
    }}>
      {src && !imgFailed
        ? <img src={src} alt={name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgFailed(true)} />
        : initials}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: "hidden", ...style,
    }}>{children}</div>
  );
}

function CardHeader({ title, tag, action, onAction }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: C.t1,
        textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
      {tag && <span style={{ fontSize: 9, fontWeight: 800, color: C.amber,
        background: C.amberDim, border: `1px solid ${C.amberStr}`,
        borderRadius: 99, padding: "2px 8px", textTransform: "uppercase",
        letterSpacing: ".05em" }}>{tag}</span>}
      {action && (
        <button className="btn-base" onClick={onAction} style={{
          fontSize: 10, fontWeight: 700, color: C.blue,
          background: C.blueDim, border: `1px solid ${C.blueStr}`,
          borderRadius: 6, padding: "4px 10px",
        }}>{action}</button>
      )}
    </div>
  );
}

// ─── KPI STRIP (real data) ─────────────────────────────────────────────────────
function KpiStrip({ todayCI, fillRate, atRisk, sessionCount, sessionsLive, sessionsDone }) {
  const kpis = [
    {
      label: "Today's Check-ins",
      value: String(todayCI),
      sub: todayCI > 0 ? `Active today` : "No check-ins yet",
      subOk: todayCI > 0 ? true : null,
      spark: [0, 0, 0, 0, 0, 0, todayCI].map(v => v),
    },
    {
      label: "Fill Rate",
      value: `${fillRate}%`,
      sub: `Across ${sessionCount} sessions`,
      subOk: fillRate >= 60 ? true : fillRate < 40 ? false : null,
      spark: [50, 55, 58, 60, 62, 65, fillRate],
    },
    {
      label: "At-Risk Clients",
      value: String(atRisk),
      sub: atRisk > 0 ? "Needs attention" : "All clients active",
      subOk: atRisk > 0 ? false : true,
      spark: [0, 0, 0, 0, 0, 0, atRisk],
    },
    {
      label: "Sessions Today",
      value: String(sessionCount),
      sub: `${sessionsDone} done · ${sessionsLive} live`,
      subOk: null,
      spark: [0, 0, 0, 0, 0, 0, sessionCount],
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
      {kpis.map((k, i) => {
        const valColor = i === 2 && atRisk > 0 ? C.red : C.t1;
        const subColor = k.subOk === true ? C.green : k.subOk === false ? C.red : C.t3;
        return (
          <div key={i} className="fade-up" style={{ animationDelay: `${i * .05}s`,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.t3,
              textTransform: "uppercase", letterSpacing: ".07em" }}>{k.label}</span>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: valColor,
                letterSpacing: "-.045em", lineHeight: 1 }}>{k.value}</span>
              <Spark data={k.spark} color={i === 2 && atRisk > 0 ? C.red : C.blue} h={28} w={60}/>
            </div>
            <span style={{ fontSize: 10, color: subColor, fontWeight: 500 }}>{k.sub}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── SESSION ROW (real data) ───────────────────────────────────────────────────
function SessionRow({ s, expanded, onToggle, now }) {
  const pct = s.cap > 0 ? Math.round((s.booked / s.cap) * 100) : 0;
  const isLive = s.status === "live";
  const isDone = s.status === "done";

  const statusColor = isLive ? C.green : isDone ? C.t4 : C.blue;
  const statusLabel = isLive ? "Live" : isDone ? "Done" : "Upcoming";

  return (
    <div>
      <div className="row-hover" onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 20px", cursor: "pointer",
        borderBottom: `1px solid ${C.border}`, background: "transparent",
        opacity: isDone ? .65 : 1,
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <div className={isLive ? "live-pulse" : ""} style={{
            width: 7, height: 7, borderRadius: "50%", background: statusColor,
          }}/>
        </div>

        <span style={{ fontSize: 11, fontWeight: 700, color: isDone ? C.t3 : C.t2,
          width: 62, flexShrink: 0, letterSpacing: "-.01em" }}>{s.time}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isDone ? C.t2 : C.t1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase",
              color: statusColor, background: `${statusColor}14`,
              border: `1px solid ${statusColor}28`, borderRadius: 99, padding: "1px 7px",
            }}>{statusLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CapBar pct={pct} color={isDone ? C.t4 : C.blue}/>
            <span style={{ fontSize: 10, color: C.t3 }}>
              <span style={{ color: isDone ? C.t3 : C.t2, fontWeight: 600 }}>{s.booked}</span>/{s.cap} · {s.duration}
            </span>
          </div>
        </div>

        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={C.t4} strokeWidth={2.5}
          style={{ flexShrink: 0, transform: expanded ? "rotate(90deg)" : "none", transition: "transform .2s" }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

      {expanded && (
        <div className="expand-body" style={{
          padding: "14px 20px 16px", background: C.inset,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
            {[
              { l: "Booked", v: s.booked, c: C.blue },
              { l: "Capacity", v: s.cap, c: C.t2 },
              { l: "Open", v: Math.max(0, s.cap - s.booked), c: C.t2 },
            ].map((stat, j) => (
              <div key={j} style={{
                padding: "10px 12px", borderRadius: 8, textAlign: "center",
                background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: stat.c, letterSpacing: "-.04em" }}>{stat.v}</div>
                <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 3 }}>{stat.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 7-DAY SPARK (real check-in data) ─────────────────────────────────────────
function WeekPulse({ checkIns, now }) {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const vals = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dayOffset = 6 - i; // 0=today, 6=6 days ago
      const target = new Date(now);
      target.setDate(target.getDate() - dayOffset);
      return checkIns.filter(c => {
        const d = new Date(c.check_in_date);
        return d.getFullYear() === target.getFullYear() &&
               d.getMonth() === target.getMonth() &&
               d.getDate() === target.getDate();
      }).length;
    });
  }, [checkIns, now]);

  const maxPulse = Math.max(...vals, 1);
  const totalWeek = vals.reduce((a,b) => a+b, 0);
  const avg = (totalWeek / 7).toFixed(1);

  // Day labels: Mon through Sun but shifted so today is last
  const todayDow = (now.getDay() + 6) % 7; // 0=Mon
  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    return days[(todayDow - 6 + i + 7) % 7];
  });

  return (
    <Card>
      <CardHeader title="Check-in Activity"/>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 52, marginBottom: 10 }}>
          {vals.map((v, i) => {
            const h = Math.max(3, (v / maxPulse) * 48);
            const isToday = i === 6;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 5 }}>
                <div style={{ width: "100%", height: h, borderRadius: 3,
                  background: isToday ? C.blue : "rgba(61,130,244,0.22)",
                  transition: "height .5s ease" }}/>
                <span style={{ fontSize: 8, color: isToday ? C.blue : C.t4,
                  fontWeight: isToday ? 800 : 500 }}>{dayLabels[i]}</span>
              </div>
            );
          })}
        </div>
        <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between" }}>
          <StatPill label="Today" value={vals[6]} color={C.t1}/>
          <StatPill label="Daily avg" value={avg} color={C.t2}/>
          <StatPill label="This week" value={totalWeek} color={C.t2}/>
        </div>
      </div>
    </Card>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function TodayDashboard({ allMemberships = [], checkIns = [], myClasses = [], currentUser, openModal, setTab, now = new Date() }) {
  const [expanded, setExpanded] = useState(null);
  const toggle = id => setExpanded(p => p === id ? null : id);

  // ── Derive today's sessions from myClasses ────────────────────────────────
  const sessions = useMemo(() => {
    const nowHour = now.getHours() + now.getMinutes() / 60;
    return myClasses.map((cls, i) => {
      // Parse schedule time if available
      const schedStr = typeof cls.schedule === "string" ? cls.schedule :
        (Array.isArray(cls.schedule) && cls.schedule[0]?.time ? cls.schedule[0].time : "");
      let timeHour = null;
      const m = schedStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
      if (m) {
        timeHour = parseInt(m[1]);
        if (m[3]?.toLowerCase() === "pm" && timeHour !== 12) timeHour += 12;
        if (m[3]?.toLowerCase() === "am" && timeHour === 12) timeHour = 0;
        if (m[2]) timeHour += parseInt(m[2]) / 60;
      }

      const cap = cls.max_capacity || cls.capacity || 20;
      const bookings = (cls.bookings || []).length;
      const durationMin = cls.duration_minutes || cls.duration || 60;

      let status = "upcoming";
      if (timeHour !== null) {
        if (nowHour > timeHour + durationMin / 60) status = "done";
        else if (nowHour >= timeHour && nowHour <= timeHour + durationMin / 60) status = "live";
      }

      const displayTime = schedStr || "—";

      return {
        id: cls.id || `cls-${i}`,
        name: cls.name,
        time: displayTime,
        booked: bookings,
        cap,
        duration: `${durationMin}m`,
        status,
      };
    }).sort((a, b) => {
      const parseH = s => { const m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i); if (!m) return 99; let h = parseInt(m[1]); if (m[3]?.toLowerCase() === "pm" && h !== 12) h += 12; return h + (m[2] ? parseInt(m[2]) / 60 : 0); };
      return parseH(a.time) - parseH(b.time);
    });
  }, [myClasses, now]);

  // ── Derive KPIs from real data ────────────────────────────────────────────
  const todayCI = useMemo(() => checkIns.filter(c => {
    const d = new Date(c.check_in_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length, [checkIns, now]);

  const totalBooked = sessions.reduce((a, s) => a + s.booked, 0);
  const totalCap    = sessions.reduce((a, s) => a + s.cap, 0);
  const fillRate    = totalCap > 0 ? Math.round((totalBooked / totalCap) * 100) : 0;
  const sessionsLive= sessions.filter(s => s.status === "live").length;
  const sessionsDone= sessions.filter(s => s.status === "done").length;
  const liveSession = sessions.find(s => s.status === "live");

  // ── At-risk: members with no check-in in 14+ days ─────────────────────────
  const atRiskMembers = useMemo(() => {
    return allMemberships.map(m => {
      const lastCI = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      const daysAgo = lastCI ? differenceInDays(now, new Date(lastCI.check_in_date)) : 999;
      return { ...m, daysAgo };
    }).filter(m => m.daysAgo >= 14)
      .sort((a, b) => b.daysAgo - a.daysAgo)
      .slice(0, 5)
      .map(m => ({
        id: m.user_id,
        name: m.user_name || "Client",
        days: m.daysAgo,
        reason: m.daysAgo >= 999 ? "Never checked in" : `No visit in ${m.daysAgo} days`,
        level: m.daysAgo >= 21 ? "high" : "med",
        avatar: m.avatar_url || m.user_avatar || m.profile_picture || null,
      }));
  }, [allMemberships, checkIns, now]);

  return (
    <div className="td-root" style={{
      background: C.bg, minHeight: "100vh", padding: "16px 24px 24px",
      display: "flex", flexDirection: "column", gap: 18,
    }}>

      {/* ── HEADER ── */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {liveSession && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px",
            background: C.greenDim, border: `1px solid rgba(33,163,111,0.22)`,
            borderRadius: 8 }}>
            <div className="live-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>{liveSession.name} is live</span>
          </div>
        )}
      </div>

      {/* ── KPI STRIP ── */}
      <KpiStrip
        todayCI={todayCI}
        fillRate={fillRate}
        atRisk={atRiskMembers.length}
        sessionCount={sessions.length}
        sessionsLive={sessionsLive}
        sessionsDone={sessionsDone}
      />

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, alignItems: "start" }}>

        {/* ── SESSIONS ── */}
        <Card>
          <CardHeader title="Today's Sessions" action="+ Add Session" onAction={() => openModal?.("classes")}/>

          {sessions.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: C.t2, fontWeight: 600, margin: "0 0 6px" }}>No classes today</p>
              <p style={{ fontSize: 11, color: C.t3, margin: "0 0 16px" }}>Add your first class to start tracking attendance.</p>
              <button className="btn-base" onClick={() => openModal?.("classes")} style={{
                fontSize: 11, fontWeight: 700, color: C.blue, background: C.blueDim,
                border: `1px solid ${C.blueStr}`, borderRadius: 8, padding: "7px 14px",
              }}>+ Add Session</button>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div style={{ display: "grid", gridTemplateColumns: "20px 62px 1fr auto",
                gap: 14, padding: "8px 20px",
                borderBottom: `1px solid ${C.border}` }}>
                {["", "Time", "Session", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 9, fontWeight: 700, color: C.t4,
                    textTransform: "uppercase", letterSpacing: ".07em" }}>{h}</span>
                ))}
              </div>

              {sessions.map(s => (
                <SessionRow key={s.id} s={s} expanded={expanded === s.id} onToggle={() => toggle(s.id)} now={now}/>
              ))}

              {/* Footer summary */}
              <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 24 }}>
                {[
                  { label: "Total booked",   value: totalBooked },
                  { label: "Total capacity", value: totalCap },
                  { label: "Overall fill",   value: `${fillRate}%` },
                ].map((stat, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.t1, letterSpacing: "-.03em" }}>{stat.value}</span>
                    <span style={{ fontSize: 10, color: C.t3 }}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* At-Risk Clients */}
          <Card>
            <CardHeader
              title="At-Risk Clients"
              tag={atRiskMembers.length > 0 ? `${atRiskMembers.length} pending` : undefined}
              action={atRiskMembers.length > 0 ? "View all" : undefined}
              onAction={() => setTab?.("members")}
            />
            {atRiskMembers.length === 0 ? (
              <div style={{ padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>✓ All clients active</div>
                <div style={{ fontSize: 10, color: C.t3, marginTop: 4 }}>No one inactive for 14+ days</div>
              </div>
            ) : (
              <div style={{ padding: "6px 0" }}>
                {atRiskMembers.map((m, i) => (
                  <div key={m.id || i} className="row-hover" style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px", cursor: "pointer",
                    borderLeft: `2px solid ${m.level === "high" ? C.red : C.amber}`,
                  }}>
                    <AvatarInitials name={m.name} size={28} level={m.level} src={m.avatar}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.t1,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        marginBottom: 2 }}>{m.name}</div>
                      <div style={{ fontSize: 9, color: C.t3 }}>{m.reason}</div>
                    </div>
                    <button className="btn-base" onClick={() => openModal?.("message")} style={{
                      fontSize: 9, fontWeight: 700, color: C.amber,
                      background: C.amberDim, border: `1px solid ${C.amberStr}`,
                      borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap",
                    }}>Message →</button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 7-Day Check-in Activity */}
          <WeekPulse checkIns={checkIns} now={now} />

          {/* Quick Actions */}
          <Card>
            <CardHeader title="Quick Actions"/>
            <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
              {[
                { label: "Scan check-in",  sub: "Open QR scanner",    fn: () => openModal?.("qrScanner") },
                { label: "Send message",   sub: "Broadcast or 1:1",   fn: () => openModal?.("post") },
                { label: "Manage classes", sub: "Edit your timetable", fn: () => openModal?.("classes") },
                { label: "View members",   sub: "Client overview",     fn: () => setTab?.("members") },
              ].map(({ label, sub, fn }, i) => (
                <button key={i} className="btn-base row-hover" onClick={fn} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                  borderRadius: 8, background: "transparent",
                  border: `1px solid transparent`, textAlign: "left", width: "100%",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{label}</div>
                    <div style={{ fontSize: 9, color: C.t3, marginTop: 1 }}>{sub}</div>
                  </div>
                  <span style={{ fontSize: 10, color: C.blue, fontWeight: 700 }}>→</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}