import React, { useState, useMemo } from "react";
import { differenceInDays, format, isToday, parseISO } from "date-fns";

// ─── INJECT STYLES ────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("tct-v2-css")) {
  const s = document.createElement("style");
  s.id = "tct-v2-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500;600;700&display=swap');

    .tct-root, .tct-root * { box-sizing: border-box; margin: 0; padding: 0; }
    .tct-root { font-family: 'Inter', -apple-system, sans-serif; }

    @keyframes tct-fadeUp   { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
    @keyframes tct-fadeIn   { from { opacity:0 } to { opacity:1 } }
    @keyframes tct-pulse    { 0%,100%{opacity:1} 50%{opacity:.35} }
    @keyframes tct-shimmer  { from{background-position:-200% 0} to{background-position:200% 0} }
    @keyframes tct-expand   { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
    @keyframes tct-scaleIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }

    .tct-fade-up   { animation: tct-fadeUp .32s cubic-bezier(.22,1,.36,1) both; }
    .tct-scale-in  { animation: tct-scaleIn .28s cubic-bezier(.22,1,.36,1) both; }
    .tct-expand    { animation: tct-expand .2s ease both; }
    .tct-pulse-dot { animation: tct-pulse 1.8s ease-in-out infinite; }

    .tct-row-hover { transition: background .1s ease; cursor: pointer; }
    .tct-row-hover:hover { background: rgba(255,255,255,0.022) !important; }

    .tct-btn { font-family: 'Inter', sans-serif; cursor: pointer; border: none; outline: none;
      transition: all .14s ease; display: inline-flex; align-items: center; justify-content: center; gap: 5px; }
    .tct-btn:hover { filter: brightness(1.12); }
    .tct-btn:active { transform: scale(.975); }

    .tct-tab { cursor: pointer; transition: all .14s; user-select: none; }

    .tct-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
    .tct-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .tct-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 4px; }

    .tct-mono { font-family: 'DM Mono', monospace; }
    .tct-syne { font-family: 'Syne', sans-serif; }

    .tct-card { transition: border-color .15s ease; }
    .tct-card:hover { border-color: rgba(255,255,255,0.11) !important; }

    .tct-progress-bar { transition: width .8s cubic-bezier(.22,1,.36,1); }

    @media (max-width: 900px) {
      .tct-main-grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(s);
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  // Surfaces
  bg:       "#07090e",
  s0:       "#0a0d14",
  s1:       "#0d1119",
  s2:       "#101520",
  s3:       "#131926",
  // Borders
  b0:       "rgba(255,255,255,0.05)",
  b1:       "rgba(255,255,255,0.08)",
  b2:       "rgba(255,255,255,0.13)",
  // Text
  t0:       "#eef2f7",
  t1:       "#c8d3e0",
  t2:       "#7e90a4",
  t3:       "#3d5068",
  t4:       "#1e2e3e",
  // Accents — deliberately restrained palette
  blue:     "#4a8df0",
  blueDim:  "rgba(74,141,240,0.10)",
  blueMid:  "rgba(74,141,240,0.18)",
  blueStr:  "rgba(74,141,240,0.30)",
  green:    "#1ea870",
  greenDim: "rgba(30,168,112,0.10)",
  greenStr: "rgba(30,168,112,0.25)",
  amber:    "#d68e28",
  amberDim: "rgba(214,142,40,0.10)",
  amberStr: "rgba(214,142,40,0.25)",
  red:      "#d95050",
  redDim:   "rgba(217,80,80,0.10)",
  redStr:   "rgba(217,80,80,0.25)",
};

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────

function Mono({ children, style }) {
  return <span className="tct-mono" style={{ ...style }}>{children}</span>;
}

function Label({ children, style }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: ".10em",
      textTransform: "uppercase", color: T.t3, ...style
    }}>{children}</span>
  );
}

function Divider({ vertical, style }) {
  return vertical
    ? <div style={{ width: 1, background: T.b0, alignSelf: "stretch", ...style }} />
    : <div style={{ height: 1, background: T.b0, ...style }} />;
}

function Avatar({ name, size = 28, src, riskLevel }) {
  const [err, setErr] = React.useState(false);
  const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const accent = riskLevel === "high" ? T.red : riskLevel === "med" ? T.amber : T.t3;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${accent}18`, border: `1.5px solid ${accent}28`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * .34, fontWeight: 700, color: accent,
      fontFamily: "Inter, sans-serif", overflow: "hidden",
    }}>
      {src && !err
        ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setErr(true)} />
        : initials}
    </div>
  );
}

function StatusDot({ status }) {
  const cfg = {
    live:     { bg: T.green,  pulse: true  },
    upcoming: { bg: T.blue,   pulse: false },
    done:     { bg: T.t4,     pulse: false },
  }[status] || { bg: T.t4, pulse: false };
  return (
    <div className={cfg.pulse ? "tct-pulse-dot" : ""}
      style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.bg, flexShrink: 0 }} />
  );
}

function Pill({ children, color = T.t2, bg = "rgba(255,255,255,0.05)", border, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 9, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase",
      color, background: bg, border: `1px solid ${border || "rgba(255,255,255,0.08)"}`,
      borderRadius: 4, padding: "2px 7px", whiteSpace: "nowrap", ...style,
    }}>{children}</span>
  );
}

function AdherenceBar({ pct, showLabel = true }) {
  const color = pct >= 75 ? T.green : pct >= 50 ? T.blue : pct >= 30 ? T.amber : T.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 3, background: T.b0, borderRadius: 99, overflow: "hidden" }}>
        <div className="tct-progress-bar" style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
      {showLabel && <Mono style={{ fontSize: 10, color, fontWeight: 500, width: 28, textAlign: "right" }}>{pct}%</Mono>}
    </div>
  );
}

// Mini sparkline
function Spark({ data = [], color = T.blue, h = 24, w = 52 }) {
  if (data.length < 2) return (
    <svg width={w} height={h}><line x1={0} y1={h/2} x2={w} y2={h/2} stroke={T.t4} strokeWidth={1} strokeDasharray="2 2"/></svg>
  );
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${((i/(data.length-1))*w).toFixed(1)},${(h - (v/max)*(h-4) - 2).toFixed(1)}`).join(" ");
  const last = data[data.length-1];
  const lx = w, ly = h - (last/max)*(h-4) - 2;
  return (
    <svg width={w} height={h} style={{ flexShrink: 0, overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" opacity={.8}/>
      <circle cx={lx} cy={ly} r={2.2} fill={color}/>
    </svg>
  );
}

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
function Card({ children, style, accent }) {
  return (
    <div className="tct-card" style={{
      background: T.s1, border: `1px solid ${T.b1}`,
      borderRadius: 10, overflow: "hidden",
      ...(accent ? { borderTop: `2px solid ${accent}` } : {}),
      ...style,
    }}>{children}</div>
  );
}

function CardHeader({ title, right, sub, border = true }) {
  return (
    <div style={{
      padding: "13px 18px",
      ...(border ? { borderBottom: `1px solid ${T.b0}` } : {}),
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.t1, letterSpacing: "-.01em" }}>{title}</div>
        {sub && <div style={{ fontSize: 10, color: T.t2, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── KPI CARDS ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, subOk, sparkData, sparkColor, delay = 0 }) {
  const subColor = subOk === true ? T.green : subOk === false ? T.red : T.t2;
  return (
    <div className="tct-card tct-fade-up" style={{
      animationDelay: `${delay}s`,
      background: T.s1, border: `1px solid ${T.b1}`, borderRadius: 10,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14,
    }}>
      <Label>{label}</Label>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <Mono style={{ fontSize: 34, fontWeight: 400, color: T.t0, letterSpacing: "-.05em", lineHeight: 1 }}>
          {value}
        </Mono>
        {sparkData && <Spark data={sparkData} color={sparkColor || T.blue} h={26} w={54}/>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%",
          background: subColor, opacity: .8, flexShrink: 0 }} />
        <span style={{ fontSize: 10, color: subColor, fontWeight: 500 }}>{sub}</span>
      </div>
    </div>
  );
}

// ─── SESSION TIMELINE ITEM ────────────────────────────────────────────────────
function SessionItem({ s, expanded, onToggle, isLast }) {
  const pct = s.cap > 0 ? Math.round((s.booked / s.cap) * 100) : 0;
  const statusCfg = {
    live:     { label: "Live",     color: T.green, bg: T.greenDim, brd: T.greenStr },
    upcoming: { label: "Upcoming", color: T.blue,  bg: T.blueDim,  brd: T.blueStr  },
    done:     { label: "Done",     color: T.t3,    bg: "rgba(255,255,255,0.03)", brd: T.b0 },
  }[s.status] || { label: "–", color: T.t3, bg: T.b0, brd: T.b0 };

  const isDone = s.status === "done";

  return (
    <div style={{ position: "relative" }}>
      {/* Timeline connector */}
      {!isLast && (
        <div style={{
          position: "absolute", left: 29, top: 52, bottom: 0, width: 1,
          background: isDone ? T.b0 : `linear-gradient(${T.b1}, transparent)`,
          zIndex: 0,
        }} />
      )}

      <div className="tct-row-hover tct-fade-up" onClick={onToggle} style={{
        display: "flex", alignItems: "flex-start", gap: 0,
        padding: "16px 20px", cursor: "pointer",
        opacity: isDone ? .6 : 1, position: "relative", zIndex: 1,
      }}>
        {/* Time + status column */}
        <div style={{ width: 72, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6, paddingTop: 1 }}>
          <Mono style={{ fontSize: 11, color: isDone ? T.t3 : T.t2, fontWeight: 400 }}>{s.time}</Mono>
          <StatusDot status={s.status} />
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: isDone ? T.t2 : T.t0, letterSpacing: "-.01em" }}>
              {s.name}
            </span>
            <Pill color={statusCfg.color} bg={statusCfg.bg} border={statusCfg.brd}>
              {s.status === "live" && <span className="tct-pulse-dot" style={{ width: 4, height: 4, borderRadius: "50%", background: T.green, display: "inline-block" }}/>}
              {statusCfg.label}
            </Pill>
            {s.coach && <Pill color={T.t3} bg="transparent" border={T.b0}>{s.coach}</Pill>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Fill bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, maxWidth: 200 }}>
              <div style={{ flex: 1, height: 2, background: T.b0, borderRadius: 99, overflow: "hidden" }}>
                <div className="tct-progress-bar" style={{
                  height: "100%", borderRadius: 99,
                  width: `${pct}%`,
                  background: isDone ? T.t4 : pct >= 80 ? T.green : pct >= 50 ? T.blue : T.amber,
                }}/>
              </div>
              <Mono style={{ fontSize: 10, color: T.t3, whiteSpace: "nowrap" }}>{s.booked}/{s.cap}</Mono>
            </div>
            <Mono style={{ fontSize: 10, color: T.t3 }}>{s.duration}</Mono>
          </div>
        </div>

        {/* Chevron */}
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.t4} strokeWidth={2}
          style={{ flexShrink: 0, marginTop: 3, transform: expanded ? "rotate(90deg)" : "none", transition: "transform .2s" }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="tct-expand" style={{
          padding: "0 20px 16px 92px",
          marginTop: -4,
        }}>
          <div style={{
            background: T.s2, border: `1px solid ${T.b0}`,
            borderRadius: 8, overflow: "hidden",
          }}>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
              {[
                { l: "Booked",   v: s.booked,                        dim: false },
                { l: "Capacity", v: s.cap,                           dim: true  },
                { l: "Open",     v: Math.max(0, s.cap - s.booked),   dim: true  },
                { l: "Fill",     v: `${pct}%`,                       dim: false },
              ].map((st, i) => (
                <div key={i} style={{
                  padding: "12px 14px",
                  borderRight: i < 3 ? `1px solid ${T.b0}` : "none",
                }}>
                  <Label style={{ marginBottom: 6, display: "block" }}>{st.l}</Label>
                  <Mono style={{ fontSize: 20, fontWeight: 400, color: st.dim ? T.t2 : T.t0 }}>{st.v}</Mono>
                </div>
              ))}
            </div>

            {/* Session notes placeholder */}
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.b0}` }}>
              <span style={{ fontSize: 10, color: T.t3 }}>
                {s.notes || "No session notes — tap to add details after the class."}
              </span>
            </div>
          </div>
        </div>
      )}

      {!isLast && <Divider />}
    </div>
  );
}

// ─── WEEK ACTIVITY CHART ──────────────────────────────────────────────────────
function WeekActivity({ checkIns, now }) {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const todayDow = (now.getDay() + 6) % 7;

  const vals = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const t = new Date(now);
    t.setDate(t.getDate() - (6 - i));
    return checkIns.filter(c => {
      const d = new Date(c.check_in_date || c.check_in_time);
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    }).length;
  }), [checkIns, now]);

  const dayLabels = Array.from({ length: 7 }, (_, i) => days[(todayDow - 6 + i + 7) % 7]);
  const max = Math.max(...vals, 1);
  const totalWeek = vals.reduce((a, b) => a + b, 0);
  const avg = totalWeek > 0 ? (totalWeek / 7).toFixed(1) : "0";
  const todayVal = vals[6];

  return (
    <Card>
      <CardHeader title="Weekly Activity"
        right={<Mono style={{ fontSize: 10, color: T.t2 }}>{totalWeek} this week</Mono>}
      />
      <div style={{ padding: "16px 18px 14px" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 56, marginBottom: 12 }}>
          {vals.map((v, i) => {
            const isT = i === 6;
            const h = Math.max(3, (v / max) * 52);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div title={`${v} check-ins`} style={{
                  width: "100%", height: h, borderRadius: "3px 3px 2px 2px",
                  background: isT ? T.blue : v === 0 ? T.b0 : `rgba(74,141,240,${0.15 + (v/max)*0.45})`,
                  transition: "height .6s cubic-bezier(.22,1,.36,1)",
                  cursor: "default",
                }}/>
                <Label style={{ color: isT ? T.blue : T.t4, fontWeight: isT ? 800 : 600 }}>{dayLabels[i]}</Label>
              </div>
            );
          })}
        </div>
        <Divider style={{ marginBottom: 12 }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {[
            { l: "Today",      v: String(todayVal), c: todayVal > 0 ? T.blue : T.t2 },
            { l: "Daily avg",  v: avg,              c: T.t1 },
            { l: "This week",  v: String(totalWeek),c: T.t1 },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Label>{s.l}</Label>
              <Mono style={{ fontSize: 16, fontWeight: 500, color: s.c }}>{s.v}</Mono>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── CLIENT ADHERENCE TABLE ────────────────────────────────────────────────────
function AdherencePanel({ allMemberships, checkIns, now, onMessage, onViewAll }) {
  const MAX_SHOWN = 6;
  const [show, setShow] = useState(false);

  const clients = useMemo(() => {
    return allMemberships.map(m => {
      const mCI = checkIns.filter(c => c.user_id === m.user_id);
      const last = mCI.sort((a, b) => new Date(b.check_in_date || b.check_in_time) - new Date(a.check_in_date || a.check_in_time))[0];
      const daysAgo = last ? differenceInDays(now, new Date(last.check_in_date || last.check_in_time)) : 999;
      // 30-day adherence: CI count in last 30 days / 12 expected sessions (~3x/week)
      const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
      const ci30 = mCI.filter(c => new Date(c.check_in_date || c.check_in_time) >= cutoff).length;
      const adherence = Math.min(100, Math.round((ci30 / 12) * 100));
      // Week streak
      const streak = mCI.filter(c => {
        const d = new Date(c.check_in_date || c.check_in_time);
        return differenceInDays(now, d) < 7;
      }).length;
      return {
        id: m.user_id, name: m.user_name || "Client",
        avatar: m.avatar_url || null, daysAgo,
        ci30, adherence, streak,
        status: daysAgo <= 3 ? "active" : daysAgo <= 13 ? "cooling" : "atrisk",
      };
    }).sort((a, b) => a.daysAgo - b.daysAgo);
  }, [allMemberships, checkIns, now]);

  const displayed = show ? clients : clients.slice(0, MAX_SHOWN);

  if (clients.length === 0) return null;

  const activeCount   = clients.filter(c => c.status === "active").length;
  const atRiskCount   = clients.filter(c => c.status === "atrisk").length;
  const avgAdherence  = clients.length ? Math.round(clients.reduce((s, c) => s + c.adherence, 0) / clients.length) : 0;

  return (
    <Card>
      <CardHeader
        title="Client Adherence"
        sub={`${clients.length} clients · 30-day window`}
        right={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {atRiskCount > 0 && (
              <Pill color={T.red} bg={T.redDim} border={T.redStr}>{atRiskCount} at risk</Pill>
            )}
            <Pill color={T.t2} bg="transparent" border={T.b1}>Avg {avgAdherence}%</Pill>
          </div>
        }
      />

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderBottom: `1px solid ${T.b0}` }}>
        {[
          { l: "Active",   v: activeCount,  c: T.green },
          { l: "Cooling",  v: clients.filter(c=>c.status==="cooling").length, c: T.amber },
          { l: "At Risk",  v: atRiskCount,  c: T.red },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "12px 18px", textAlign: "center",
            borderRight: i < 2 ? `1px solid ${T.b0}` : "none",
          }}>
            <Mono style={{ fontSize: 22, fontWeight: 400, color: s.c }}>{s.v}</Mono>
            <Label style={{ marginTop: 4, display: "block" }}>{s.l}</Label>
          </div>
        ))}
      </div>

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 70px 56px",
        gap: 0, padding: "8px 18px", borderBottom: `1px solid ${T.b0}` }}>
        {["Client", "Last CI", "30-Day", "Streak"].map((h, i) => (
          <Label key={i} style={{ textAlign: i > 0 ? "right" : "left" }}>{h}</Label>
        ))}
      </div>

      {/* Rows */}
      <div>
        {displayed.map((c, i) => {
          const statusColor = c.status === "active" ? T.green : c.status === "cooling" ? T.amber : T.red;
          const lastLabel = c.daysAgo === 999 ? "Never" : c.daysAgo === 0 ? "Today" : `${c.daysAgo}d ago`;
          return (
            <div key={c.id || i} className="tct-row-hover" style={{
              display: "grid", gridTemplateColumns: "1fr 60px 70px 56px",
              gap: 0, padding: "11px 18px", alignItems: "center",
              borderLeft: `2px solid ${statusColor}28`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <Avatar name={c.name} size={26} src={c.avatar} riskLevel={c.status === "atrisk" ? "high" : c.status === "cooling" ? "med" : null}/>
                <span style={{ fontSize: 12, fontWeight: 500, color: T.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              </div>
              <Mono style={{ fontSize: 10, color: c.daysAgo > 14 ? T.red : T.t2, textAlign: "right" }}>{lastLabel}</Mono>
              <div style={{ paddingLeft: 8 }}>
                <AdherenceBar pct={c.adherence} />
              </div>
              <Mono style={{ fontSize: 11, color: c.streak > 0 ? T.blue : T.t3, textAlign: "right", fontWeight: c.streak > 2 ? 600 : 400 }}>
                {c.streak > 0 ? `${c.streak}×` : "—"}
              </Mono>
            </div>
          );
        })}
      </div>

      {clients.length > MAX_SHOWN && (
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${T.b0}` }}>
          <button className="tct-btn" onClick={() => setShow(p => !p)} style={{
            fontSize: 10, fontWeight: 600, color: T.blue, background: "transparent",
            width: "100%", padding: "4px 0",
          }}>
            {show ? "Show less" : `Show ${clients.length - MAX_SHOWN} more`}
          </button>
        </div>
      )}
    </Card>
  );
}

// ─── AT-RISK PANEL ────────────────────────────────────────────────────────────
function AtRiskPanel({ atRiskMembers, onMessage, onViewAll }) {
  if (atRiskMembers.length === 0) {
    return (
      <Card>
        <CardHeader title="At-Risk Clients" />
        <div style={{ padding: "24px 18px", textAlign: "center" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: T.greenDim,
            border: `1px solid ${T.greenStr}`, display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 10px",
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, marginBottom: 4 }}>All clients on track</div>
          <div style={{ fontSize: 10, color: T.t3 }}>No one inactive for 14+ days</div>
        </div>
      </Card>
    );
  }
  return (
    <Card accent={T.red}>
      <CardHeader
        title="At-Risk Clients"
        right={
          <div style={{ display: "flex", gap: 6 }}>
            <Pill color={T.red} bg={T.redDim} border={T.redStr}>{atRiskMembers.length}</Pill>
            <button className="tct-btn" onClick={onViewAll} style={{
              fontSize: 9, fontWeight: 700, color: T.t2, background: "transparent",
              border: `1px solid ${T.b1}`, borderRadius: 5, padding: "3px 8px",
            }}>View all →</button>
          </div>
        }
      />
      <div>
        {atRiskMembers.map((m, i) => (
          <div key={m.id || i} className="tct-row-hover" style={{
            display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
            borderLeft: `2px solid ${m.level === "high" ? T.red : T.amber}`,
            borderBottom: i < atRiskMembers.length - 1 ? `1px solid ${T.b0}` : "none",
          }}>
            <Avatar name={m.name} size={28} src={m.avatar} riskLevel={m.level} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
              <div style={{ fontSize: 9, color: m.level === "high" ? T.red : T.amber, marginTop: 2 }}>
                {m.reason}
              </div>
            </div>
            <button className="tct-btn" onClick={() => onMessage?.(m)} style={{
              fontSize: 9, fontWeight: 700, color: T.amber,
              background: T.amberDim, border: `1px solid ${T.amberStr}`,
              borderRadius: 5, padding: "4px 9px", whiteSpace: "nowrap",
            }}>Message</button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────
function QuickActions({ openModal, setTab }) {
  const actions = [
    { icon: "qr",      label: "Scan Check-in",    sub: "Open QR scanner",      fn: () => openModal?.("qrScanner") },
    { icon: "plus",    label: "Add Session",       sub: "Create a class",       fn: () => openModal?.("classes")   },
    { icon: "msg",     label: "Broadcast Message", sub: "Post to all clients",  fn: () => openModal?.("post")      },
    { icon: "members", label: "View All Clients",  sub: "Full client roster",   fn: () => setTab?.("members")      },
    { icon: "chart",   label: "Analytics",         sub: "Performance metrics",  fn: () => setTab?.("analytics")    },
  ];
  const icons = {
    qr: (
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/>
        <rect x={14} y={14} width={7} height={7}/><rect x={3} y={14} width={4} height={4}/>
      </svg>
    ),
    plus: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>,
    msg: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    members: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    chart: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1={18} y1={20} x2={18} y2={10}/><line x1={12} y1={20} x2={12} y2={4}/><line x1={6} y1={20} x2={6} y2={14}/></svg>,
  };
  return (
    <Card>
      <CardHeader title="Quick Actions" border={false}/>
      <div style={{ padding: "0 10px 10px" }}>
        {actions.map(({ icon, label, sub, fn }, i) => (
          <button key={i} className="tct-btn tct-row-hover" onClick={fn} style={{
            width: "100%", padding: "9px 10px", borderRadius: 7,
            background: "transparent", border: `1px solid transparent`,
            justifyContent: "flex-start", gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: T.s2,
              border: `1px solid ${T.b1}`, display: "flex", alignItems: "center",
              justifyContent: "center", color: T.t2, flexShrink: 0,
            }}>
              {icons[icon]}
            </div>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t1 }}>{label}</div>
              <div style={{ fontSize: 9, color: T.t3, marginTop: 1 }}>{sub}</div>
            </div>
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={T.t4} strokeWidth={2.5}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─── GOAL TRACKER ─────────────────────────────────────────────────────────────
function DailyGoalTracker({ sessions, todayCI, allMemberships }) {
  const goals = useMemo(() => [
    {
      label: "Check-ins today",
      current: todayCI,
      target: Math.max(10, Math.round(allMemberships.length * 0.2)),
      color: T.blue,
    },
    {
      label: "Sessions filled",
      current: sessions.filter(s => s.booked > 0).length,
      target: Math.max(1, sessions.length),
      color: T.green,
    },
  ], [sessions, todayCI, allMemberships]);

  return (
    <Card>
      <CardHeader title="Today's Goals" />
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        {goals.map((g, i) => {
          const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: T.t1, fontWeight: 500 }}>{g.label}</span>
                <Mono style={{ fontSize: 10, color: T.t2 }}>{g.current} / {g.target}</Mono>
              </div>
              <div style={{ height: 4, background: T.b0, borderRadius: 99, overflow: "hidden" }}>
                <div className="tct-progress-bar" style={{
                  height: "100%", width: `${pct}%`,
                  background: g.color, borderRadius: 99,
                }}/>
              </div>
              <div style={{ marginTop: 4, fontSize: 9, color: pct >= 100 ? T.green : T.t3 }}>
                {pct >= 100 ? "✓ Goal reached" : `${pct}% to goal`}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function TabCoachToday({
  allMemberships = [],
  checkIns = [],
  myClasses = [],
  currentUser,
  openModal,
  setTab,
  now = new Date(),
}) {
  const [expandedId, setExpandedId] = useState(null);
  const toggle = id => setExpandedId(p => p === id ? null : id);

  // ── Derive sessions from myClasses ───────────────────────────────────────
  const sessions = useMemo(() => {
    const nowDecimal = now.getHours() + now.getMinutes() / 60;
    return myClasses.map((cls, i) => {
      const schedStr = typeof cls.schedule === "string" ? cls.schedule
        : (Array.isArray(cls.schedule) && cls.schedule[0]?.time ? cls.schedule[0].time : "");
      let timeHour = null;
      const m = schedStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
      if (m) {
        timeHour = parseInt(m[1]);
        if (m[3]?.toLowerCase() === "pm" && timeHour !== 12) timeHour += 12;
        if (m[3]?.toLowerCase() === "am" && timeHour === 12) timeHour = 0;
        if (m[2]) timeHour += parseInt(m[2]) / 60;
      }
      const cap = cls.max_capacity || cls.capacity || 20;
      const booked = (cls.bookings || []).length;
      const durMin = cls.duration_minutes || cls.duration || 60;
      let status = "upcoming";
      if (timeHour !== null) {
        if (nowDecimal > timeHour + durMin / 60) status = "done";
        else if (nowDecimal >= timeHour) status = "live";
      }
      return {
        id: cls.id || `cls-${i}`,
        name: cls.name || "Unnamed Class",
        time: schedStr || "—",
        booked, cap,
        duration: `${durMin}m`,
        status,
        coach: cls.instructor || cls.coach_name || null,
        notes: cls.notes || null,
        _sortKey: timeHour ?? 99,
      };
    }).sort((a, b) => a._sortKey - b._sortKey);
  }, [myClasses, now]);

  // ── KPI derivations ───────────────────────────────────────────────────────
  const todayCI = useMemo(() => checkIns.filter(c => {
    const d = new Date(c.check_in_date || c.check_in_time);
    return d.getFullYear() === now.getFullYear()
      && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate();
  }).length, [checkIns, now]);

  const totalBooked   = sessions.reduce((a, s) => a + s.booked, 0);
  const totalCap      = sessions.reduce((a, s) => a + s.cap, 0);
  const fillRate      = totalCap > 0 ? Math.round((totalBooked / totalCap) * 100) : 0;
  const sessionsLive  = sessions.filter(s => s.status === "live").length;
  const sessionsDone  = sessions.filter(s => s.status === "done").length;
  const liveSession   = sessions.find(s => s.status === "live");

  // ── At-risk clients ───────────────────────────────────────────────────────
  const atRiskMembers = useMemo(() => allMemberships.map(m => {
    const mCI = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) =>
      new Date(b.check_in_date || b.check_in_time) - new Date(a.check_in_date || a.check_in_time));
    const last = mCI[0];
    const daysAgo = last ? differenceInDays(now, new Date(last.check_in_date || last.check_in_time)) : 999;
    return { ...m, daysAgo };
  }).filter(m => m.daysAgo >= 14).sort((a, b) => b.daysAgo - a.daysAgo).slice(0, 5).map(m => ({
    id: m.user_id, name: m.user_name || "Client", days: m.daysAgo,
    reason: m.daysAgo >= 999 ? "Never checked in" : `${m.daysAgo} days inactive`,
    level: m.daysAgo >= 21 ? "high" : "med",
    avatar: m.avatar_url || null,
  })), [allMemberships, checkIns, now]);

  // ── Spark histories (7-day rolling counts) ────────────────────────────────
  const ciSpark = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const t = new Date(now); t.setDate(t.getDate() - (6 - i));
    return checkIns.filter(c => {
      const d = new Date(c.check_in_date || c.check_in_time);
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    }).length;
  }), [checkIns, now]);

  const greeting = (() => {
    const h = now.getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();
  const firstName = currentUser?.display_name?.split(" ")[0] || currentUser?.full_name?.split(" ")[0] || "Coach";
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="tct-root tct-scrollbar" style={{
      background: T.bg, minHeight: "100%",
      padding: "0 0 40px",
      display: "flex", flexDirection: "column", gap: 0,
    }}>

      {/* ── PAGE HEADER ── */}
      <div className="tct-fade-up" style={{ padding: "24px 0 20px", borderBottom: `1px solid ${T.b0}`, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: T.t2, marginBottom: 4 }}>
              {dateStr}
            </div>
            <h1 className="tct-syne" style={{ fontSize: 22, fontWeight: 700, color: T.t0,
              letterSpacing: "-.03em", lineHeight: 1 }}>
              {greeting}, {firstName}
            </h1>
          </div>

          {/* Live badge */}
          {liveSession ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
              background: T.greenDim, border: `1px solid ${T.greenStr}`, borderRadius: 8,
            }}>
              <div className="tct-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }}/>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.green }}>{liveSession.name} · Live now</span>
            </div>
          ) : sessions.length > 0 && sessionsLive === 0 ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
              background: T.s2, border: `1px solid ${T.b1}`, borderRadius: 8,
            }}>
              <StatusDot status="upcoming"/>
              <span style={{ fontSize: 11, color: T.t2 }}>
                {sessionsDone === sessions.length
                  ? "All sessions complete"
                  : `Next: ${sessions.find(s => s.status === "upcoming")?.time || "—"}`}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        <KpiCard
          label="Check-ins Today"
          value={String(todayCI)}
          sub={todayCI > 0 ? `${todayCI} member${todayCI !== 1 ? "s" : ""} attended` : "No check-ins yet"}
          subOk={todayCI > 0 ? true : null}
          sparkData={ciSpark}
          sparkColor={T.blue}
          delay={0}
        />
        <KpiCard
          label="Fill Rate"
          value={`${fillRate}%`}
          sub={`${totalBooked} booked across ${sessions.length} session${sessions.length !== 1 ? "s" : ""}`}
          subOk={fillRate >= 60 ? true : fillRate > 0 && fillRate < 40 ? false : null}
          sparkData={[50, 55, 58, 62, 65, fillRate > 0 ? fillRate - 5 : 0, fillRate]}
          sparkColor={fillRate >= 60 ? T.green : T.amber}
          delay={.05}
        />
        <KpiCard
          label="At-Risk Clients"
          value={String(atRiskMembers.length)}
          sub={atRiskMembers.length > 0 ? `${atRiskMembers.length} need${atRiskMembers.length === 1 ? "s" : ""} attention` : "All clients active"}
          subOk={atRiskMembers.length > 0 ? false : true}
          sparkData={[0, 0, 0, 0, 0, 0, atRiskMembers.length]}
          sparkColor={atRiskMembers.length > 0 ? T.red : T.green}
          delay={.10}
        />
        <KpiCard
          label="Sessions Today"
          value={String(sessions.length)}
          sub={`${sessionsDone} done · ${sessionsLive} live · ${sessions.length - sessionsDone - sessionsLive} upcoming`}
          subOk={null}
          sparkData={[0, 0, 0, 0, 0, 0, sessions.length]}
          sparkColor={T.blue}
          delay={.15}
        />
      </div>

      {/* ── MAIN GRID ── */}
      <div className="tct-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 14, alignItems: "start" }}>

        {/* LEFT: Sessions + Adherence */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* SESSION TIMELINE */}
          <Card className="tct-fade-up" style={{ animationDelay: ".18s" }}>
            <CardHeader
              title="Today's Sessions"
              sub={sessions.length > 0 ? `${sessions.length} scheduled · ${fillRate}% fill rate` : "No sessions scheduled"}
              right={
                <button className="tct-btn" onClick={() => openModal?.("classes")} style={{
                  fontSize: 10, fontWeight: 700, color: T.blue,
                  background: T.blueDim, border: `1px solid ${T.blueStr}`,
                  borderRadius: 6, padding: "5px 11px",
                }}>
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/>
                  </svg>
                  Add Session
                </button>
              }
            />

            {sessions.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: T.s2,
                  border: `1px solid ${T.b1}`, display: "flex", alignItems: "center",
                  justifyContent: "center", margin: "0 auto 12px", color: T.t3,
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/>
                    <line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/>
                  </svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, marginBottom: 6 }}>No sessions today</div>
                <div style={{ fontSize: 11, color: T.t3, marginBottom: 16, lineHeight: 1.5 }}>
                  Add classes to track attendance, fill rates, and client engagement.
                </div>
                <button className="tct-btn" onClick={() => openModal?.("classes")} style={{
                  fontSize: 11, fontWeight: 700, color: T.blue, background: T.blueDim,
                  border: `1px solid ${T.blueStr}`, borderRadius: 7, padding: "8px 16px",
                }}>Add First Session</button>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div style={{
                  display: "grid", gridTemplateColumns: "72px 1fr 14px",
                  padding: "8px 20px", borderBottom: `1px solid ${T.b0}`, gap: 0,
                }}>
                  <Label>Time</Label>
                  <Label>Session</Label>
                  <span/>
                </div>
                {sessions.map((s, i) => (
                  <SessionItem
                    key={s.id} s={s}
                    expanded={expandedId === s.id}
                    onToggle={() => toggle(s.id)}
                    isLast={i === sessions.length - 1}
                  />
                ))}
                {/* Summary footer */}
                <div style={{
                  padding: "12px 20px", borderTop: `1px solid ${T.b0}`,
                  display: "flex", gap: 24, alignItems: "center",
                }}>
                  {[
                    { l: "Total booked",   v: String(totalBooked) },
                    { l: "Total capacity", v: String(totalCap) },
                    { l: "Overall fill",   v: `${fillRate}%` },
                    { l: "Sessions done",  v: `${sessionsDone} / ${sessions.length}` },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                      <Mono style={{ fontSize: 14, fontWeight: 500, color: T.t1, letterSpacing: "-.03em" }}>{s.v}</Mono>
                      <Label>{s.l}</Label>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* CLIENT ADHERENCE */}
          {allMemberships.length > 0 && (
            <AdherencePanel
              allMemberships={allMemberships}
              checkIns={checkIns}
              now={now}
              onMessage={(m) => openModal?.("message")}
              onViewAll={() => setTab?.("members")}
            />
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Daily Goals */}
          <DailyGoalTracker sessions={sessions} todayCI={todayCI} allMemberships={allMemberships} />

          {/* At-Risk */}
          <AtRiskPanel
            atRiskMembers={atRiskMembers}
            onMessage={(m) => openModal?.("message")}
            onViewAll={() => setTab?.("members")}
          />

          {/* Week Activity */}
          <WeekActivity checkIns={checkIns} now={now} />

          {/* Quick Actions */}
          <QuickActions openModal={openModal} setTab={setTab} />
        </div>
      </div>
    </div>
  );
}
