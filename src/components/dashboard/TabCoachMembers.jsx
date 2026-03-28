import { useState } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0d14;
    --surface: #0f1320;
    --card: #141927;
    --card-hover: #181f30;
    --border: rgba(255,255,255,0.07);
    --border-active: rgba(59,130,246,0.4);
    --text1: #f0f4ff;
    --text2: #8b93a8;
    --text3: #555f78;
    --blue: #3b82f6;
    --blue-dim: rgba(59,130,246,0.12);
    --blue-mid: rgba(59,130,246,0.25);
    --green: #22c55e;
    --green-dim: rgba(34,197,94,0.1);
    --amber: #f59e0b;
    --amber-dim: rgba(245,158,11,0.1);
    --red: #ef4444;
    --red-dim: rgba(239,68,68,0.1);
    --radius: 10px;
    --radius-sm: 6px;
    --font: 'Outfit', sans-serif;
    --panel-w: 400px;
    --sidebar-w: 220px;
    --transition: 0.18s ease;
  }

  body { font-family: var(--font); background: var(--bg); color: var(--text1); font-size: 14px; min-height: 100vh; }

  /* Layout */
  .layout { display: flex; height: 100vh; overflow: hidden; }

  /* Sidebar */
  .sidebar {
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    padding: 20px 0;
  }
  .sidebar-gym {
    display: flex; align-items: center; gap: 10px;
    padding: 0 18px 20px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 8px;
  }
  .gym-avatar {
    width: 36px; height: 36px; border-radius: 8px;
    background: var(--blue-dim); border: 1px solid var(--border-active);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 15px; color: var(--blue); flex-shrink: 0;
  }
  .gym-name { font-weight: 600; font-size: 14px; color: var(--text1); line-height: 1.2; }
  .gym-role { font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; }

  .nav-label { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; padding: 12px 18px 6px; font-weight: 600; }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 18px; cursor: pointer; color: var(--text2);
    font-size: 13.5px; font-weight: 500; transition: var(--transition);
    border-left: 2px solid transparent; margin: 1px 0;
  }
  .nav-item:hover { color: var(--text1); background: rgba(255,255,255,0.03); }
  .nav-item.active { color: var(--text1); border-left-color: var(--blue); background: var(--blue-dim); }
  .nav-icon { width: 16px; height: 16px; opacity: 0.7; flex-shrink: 0; }
  .nav-item.active .nav-icon { opacity: 1; }

  .sidebar-footer {
    margin-top: auto; padding: 12px 18px 0;
    border-top: 1px solid var(--border);
  }
  .sidebar-link {
    display: flex; align-items: center; gap: 8px; padding: 7px 0;
    font-size: 12px; color: var(--text3); cursor: pointer;
    transition: var(--transition);
  }
  .sidebar-link:hover { color: var(--text2); }
  .logout { color: #ef4444 !important; }
  .logout:hover { color: #f87171 !important; }

  /* Main */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  /* Header */
  .header {
    padding: 18px 28px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface); flex-shrink: 0;
  }
  .header-left h1 { font-size: 18px; font-weight: 700; color: var(--text1); }
  .header-left p { font-size: 12px; color: var(--text3); margin-top: 2px; }
  .header-actions { display: flex; align-items: center; gap: 8px; }
  .btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: var(--radius-sm);
    font-family: var(--font); font-size: 13px; font-weight: 500;
    cursor: pointer; border: none; transition: var(--transition);
  }
  .btn-ghost {
    background: transparent; color: var(--text2);
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.04); color: var(--text1); }
  .btn-primary { background: var(--blue); color: #fff; }
  .btn-primary:hover { background: #2563eb; }
  .avatar-btn {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--blue-dim); border: 1px solid var(--border-active);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: var(--blue); cursor: pointer;
  }

  /* Content area */
  .content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

  /* Stats Row */
  .stats-row {
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: 1px; background: var(--border);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .stat-card {
    background: var(--card); padding: 20px 22px;
    display: flex; flex-direction: column; gap: 6px;
    transition: var(--transition);
  }
  .stat-card:hover { background: var(--card-hover); }
  .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text3); font-weight: 600; }
  .stat-value { font-size: 26px; font-weight: 700; color: var(--text1); line-height: 1; }
  .stat-sub { font-size: 11px; color: var(--text3); }
  .stat-accent-green { color: var(--green) !important; }
  .stat-accent-red { color: var(--red) !important; }
  .stat-accent-amber { color: var(--amber) !important; }

  /* Filter bar */
  .filter-bar {
    padding: 14px 28px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 6px;
    background: var(--surface); flex-shrink: 0; overflow-x: auto;
  }
  .filter-tab {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 20px;
    font-size: 12.5px; font-weight: 500; cursor: pointer;
    border: 1px solid var(--border); color: var(--text2);
    transition: var(--transition); white-space: nowrap;
    background: transparent;
  }
  .filter-tab:hover { color: var(--text1); border-color: rgba(255,255,255,0.15); }
  .filter-tab.active { color: var(--text1); background: var(--blue-dim); border-color: var(--border-active); }
  .filter-tab .badge {
    font-size: 10px; padding: 1px 5px; border-radius: 10px;
    font-weight: 600; background: rgba(255,255,255,0.08);
  }
  .filter-tab.danger .badge { background: var(--red-dim); color: var(--red); }
  .filter-tab.warning .badge { background: var(--amber-dim); color: var(--amber); }
  .filter-tab.active .badge { background: var(--blue-mid); color: var(--blue); }
  .filter-divider { width: 1px; height: 16px; background: var(--border); margin: 0 4px; flex-shrink: 0; }

  /* Toolbar */
  .toolbar {
    padding: 12px 28px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
    background: var(--card); flex-shrink: 0;
  }
  .search-wrap {
    flex: 1; position: relative; max-width: 420px;
  }
  .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text3); width: 14px; height: 14px; }
  .search-input {
    width: 100%; padding: 7px 12px 7px 34px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: var(--text1);
    font-family: var(--font); font-size: 13px;
    transition: var(--transition); outline: none;
  }
  .search-input::placeholder { color: var(--text3); }
  .search-input:focus { border-color: var(--border-active); background: var(--card); }
  .sort-select {
    padding: 7px 10px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius-sm);
    color: var(--text2); font-family: var(--font); font-size: 12.5px;
    cursor: pointer; outline: none;
  }
  .toolbar-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
  .icon-btn {
    width: 30px; height: 30px; border-radius: var(--radius-sm);
    background: var(--surface); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text2); transition: var(--transition);
  }
  .icon-btn:hover { color: var(--text1); border-color: rgba(255,255,255,0.15); }
  .icon-btn.active { background: var(--blue-dim); border-color: var(--border-active); color: var(--blue); }

  /* List + Panel wrapper */
  .list-panel-wrap { flex: 1; display: flex; overflow: hidden; }

  /* Client list */
  .client-list { flex: 1; overflow-y: auto; padding: 0; }
  .client-list::-webkit-scrollbar { width: 4px; }
  .client-list::-webkit-scrollbar-track { background: transparent; }
  .client-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .group-header {
    padding: 10px 28px 6px;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.09em; color: var(--text3);
    display: flex; align-items: center; gap: 8px;
    position: sticky; top: 0; background: var(--bg); z-index: 2;
  }
  .group-header::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .client-row {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 28px; cursor: pointer;
    border-bottom: 1px solid var(--border);
    transition: var(--transition); position: relative;
    background: transparent;
  }
  .client-row:hover { background: rgba(255,255,255,0.02); }
  .client-row.selected { background: var(--blue-dim); border-left: 2px solid var(--blue); }
  .client-row.at-risk { border-left: 2px solid var(--red); }
  .client-row.needs-attention { border-left: 2px solid var(--amber); }
  .client-row.healthy { border-left: 2px solid transparent; }
  .client-row.at-risk.selected, .client-row.needs-attention.selected { border-left-color: var(--blue); }

  /* Avatar */
  .client-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 14px; flex-shrink: 0;
    position: relative;
  }
  .avatar-ring { position: absolute; inset: -2px; border-radius: 50%; border: 2px solid transparent; }
  .status-ring-red { border-color: var(--red); }
  .status-ring-amber { border-color: var(--amber); }
  .status-ring-green { border-color: transparent; }

  /* Client info */
  .client-info { flex: 1; min-width: 0; }
  .client-name-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
  .client-name { font-weight: 600; font-size: 13.5px; color: var(--text1); }
  .tag {
    font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .tag-regular { background: rgba(255,255,255,0.07); color: var(--text3); }
  .tag-new { background: var(--blue-dim); color: var(--blue); }
  .tag-vip { background: rgba(234,179,8,0.12); color: #eab308; }
  .tag-lapsed { background: var(--red-dim); color: var(--red); }

  .client-meta { display: flex; align-items: center; gap: 16px; margin-top: 4px; flex-wrap: wrap; }
  .meta-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text2); }
  .meta-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .meta-dot-green { background: var(--green); }
  .meta-dot-amber { background: var(--amber); }
  .meta-dot-red { background: var(--red); }
  .meta-dot-gray { background: var(--text3); }

  .trend-up { color: var(--green); display: flex; align-items: center; gap: 2px; }
  .trend-down { color: var(--red); display: flex; align-items: center; gap: 2px; }
  .trend-flat { color: var(--text3); display: flex; align-items: center; gap: 2px; }

  .flag-chip {
    font-size: 10.5px; font-weight: 500; padding: 2px 7px; border-radius: 4px;
    display: inline-flex; align-items: center; gap: 3px;
  }
  .flag-red { background: var(--red-dim); color: var(--red); }
  .flag-amber { background: var(--amber-dim); color: var(--amber); }
  .flag-gray { background: rgba(255,255,255,0.05); color: var(--text3); }

  /* Row right */
  .row-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .score-badge {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; flex-shrink: 0;
  }
  .score-red { background: var(--red-dim); color: var(--red); border: 1px solid rgba(239,68,68,0.2); }
  .score-amber { background: var(--amber-dim); color: var(--amber); border: 1px solid rgba(245,158,11,0.2); }
  .score-green { background: var(--green-dim); color: var(--green); border: 1px solid rgba(34,197,94,0.2); }

  .row-action {
    width: 28px; height: 28px; border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--border); background: transparent;
    color: var(--text3); cursor: pointer; transition: var(--transition);
  }
  .row-action:hover { color: var(--text1); border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); }
  .row-chevron { color: var(--text3); transition: var(--transition); }
  .client-row:hover .row-chevron { color: var(--text2); }

  /* ── DETAIL PANEL ── */
  .detail-panel {
    width: var(--panel-w);
    background: var(--surface);
    border-left: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow: hidden; flex-shrink: 0;
    animation: slideIn 0.22s ease;
  }
  @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

  .panel-header {
    padding: 18px 20px 16px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .panel-header-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .panel-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 16px; flex-shrink: 0;
  }
  .panel-name { font-size: 15px; font-weight: 700; color: var(--text1); }
  .panel-sub { font-size: 12px; color: var(--text3); margin-top: 2px; }
  .panel-close {
    margin-left: auto; width: 26px; height: 26px; border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text3); border: 1px solid var(--border);
    transition: var(--transition);
  }
  .panel-close:hover { color: var(--text1); }

  .quick-actions { display: flex; gap: 8px; }
  .qa-btn {
    flex: 1; padding: 7px 10px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: var(--text2);
    font-family: var(--font); font-size: 12px; font-weight: 500;
    cursor: pointer; transition: var(--transition);
    display: flex; align-items: center; justify-content: center; gap: 5px;
  }
  .qa-btn:hover { background: var(--card-hover); color: var(--text1); border-color: rgba(255,255,255,0.14); }
  .qa-btn.primary { background: var(--blue-dim); border-color: var(--border-active); color: var(--blue); }
  .qa-btn.primary:hover { background: var(--blue-mid); }

  /* Panel body */
  .panel-body { flex: 1; overflow-y: auto; padding: 16px 20px 20px; }
  .panel-body::-webkit-scrollbar { width: 3px; }
  .panel-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .panel-section { margin-bottom: 22px; }
  .panel-section-title {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.09em; color: var(--text3); margin-bottom: 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .panel-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  /* Metrics grid */
  .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .metric-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 12px 14px;
  }
  .metric-card-label { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
  .metric-card-value { font-size: 20px; font-weight: 700; color: var(--text1); margin-top: 4px; line-height: 1; }
  .metric-card-sub { font-size: 11px; color: var(--text3); margin-top: 3px; }

  /* Insights */
  .insight-item {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 11px 13px; margin-bottom: 7px;
    border-left: 3px solid transparent;
  }
  .insight-item.critical { border-left-color: var(--red); }
  .insight-item.warning { border-left-color: var(--amber); }
  .insight-item.info { border-left-color: var(--blue); }

  .insight-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .insight-title { font-size: 12.5px; font-weight: 600; color: var(--text1); }
  .insight-body { font-size: 11.5px; color: var(--text2); margin-top: 3px; line-height: 1.5; }
  .insight-action {
    margin-top: 8px; font-size: 11.5px; color: var(--blue); cursor: pointer;
    display: inline-flex; align-items: center; gap: 4px; font-weight: 500;
  }
  .insight-action:hover { text-decoration: underline; }

  /* Timeline */
  .timeline-item {
    display: flex; gap: 12px; padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }
  .timeline-item:last-child { border-bottom: none; }
  .timeline-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px;
  }
  .tl-visit { background: var(--green); }
  .tl-miss { background: var(--red); }
  .tl-msg { background: var(--blue); }
  .tl-workout { background: var(--amber); }
  .timeline-content { flex: 1; }
  .tl-title { font-size: 12.5px; color: var(--text1); font-weight: 500; }
  .tl-time { font-size: 11px; color: var(--text3); margin-top: 1px; }

  /* Retention score bar */
  .score-bar-wrap { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px 16px; }
  .score-bar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .score-bar-label { font-size: 12px; font-weight: 500; color: var(--text2); }
  .score-bar-value { font-size: 22px; font-weight: 700; }
  .score-bar-track { height: 5px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .score-bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }

  /* Empty panel */
  .empty-panel {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px;
    color: var(--text3); padding: 40px 30px; text-align: center;
  }
  .empty-icon { font-size: 28px; opacity: 0.4; }
  .empty-title { font-size: 14px; font-weight: 600; color: var(--text2); }
  .empty-sub { font-size: 12px; line-height: 1.6; }

  /* Responsive scroll fix */
  @media (max-width: 900px) { .detail-panel { width: 320px; } }
`;

// ─── DATA ───────────────────────────────────────────────────────────────────
const clients = [
  {
    id: 1,
    name: "Max Hill",
    initials: "MH",
    avatarColor: "#1e3a5f",
    tags: ["Regular"],
    status: "at-risk",
    score: 28,
    trend: "down",
    lastVisit: "8d ago",
    visitsPerWeek: 0.8,
    completionPct: 0,
    lastMessage: "12d ago",
    flags: ["no-visit", "declining", "low-workout"],
    insights: [
      { level: "critical", title: "No visit in 8 days", body: "Client's longest gap in 3 months. At serious risk of lapsing.", action: "Book a session now" },
      { level: "critical", title: "Workout completion dropped to 0%", body: "Last 3 assigned workouts not completed.", action: "Simplify current programme" },
      { level: "warning", title: "No message in 12 days", body: "Last interaction was 12 days ago — client may feel neglected.", action: "Send a check-in message" },
    ],
    timeline: [
      { type: "miss", label: "Missed session", time: "2 days ago" },
      { type: "miss", label: "Missed session", time: "5 days ago" },
      { type: "visit", label: "Gym visit", time: "8 days ago" },
      { type: "workout", label: "Workout not completed", time: "9 days ago" },
      { type: "msg", label: "Message sent by coach", time: "12 days ago" },
      { type: "visit", label: "Gym visit", time: "15 days ago" },
    ],
    metrics: { totalVisits: 6, streak: 0, bookedNext: false, avgPerMonth: 3 }
  },
  {
    id: 2,
    name: "Hddbdh Xhxhxg",
    initials: "HX",
    avatarColor: "#1e3f2a",
    tags: ["Regular", "New"],
    status: "needs-attention",
    score: 51,
    trend: "flat",
    lastVisit: "4d ago",
    visitsPerWeek: 1.0,
    completionPct: 40,
    lastMessage: "5d ago",
    flags: ["not-booked"],
    insights: [
      { level: "warning", title: "No session booked this week", body: "Client has not booked any upcoming sessions.", action: "Suggest available slots" },
      { level: "warning", title: "Visit frequency below target", body: "Currently averaging 1.0/wk vs 2.0/wk target.", action: "Review schedule barriers" },
    ],
    timeline: [
      { type: "visit", label: "Gym visit", time: "4 days ago" },
      { type: "workout", label: "Workout partially completed", time: "4 days ago" },
      { type: "msg", label: "Message received from client", time: "5 days ago" },
      { type: "visit", label: "Gym visit", time: "11 days ago" },
    ],
    metrics: { totalVisits: 8, streak: 1, bookedNext: false, avgPerMonth: 4 }
  },
  {
    id: 3,
    name: "Max Hill",
    initials: "MH",
    avatarColor: "#2a1e3f",
    tags: ["Regular", "New"],
    status: "needs-attention",
    score: 62,
    trend: "down",
    lastVisit: "4d ago",
    visitsPerWeek: 3.8,
    completionPct: 0,
    lastMessage: "3d ago",
    flags: ["low-workout"],
    insights: [
      { level: "warning", title: "Workouts not being completed", body: "High attendance but 0% workout completion this month.", action: "Check workout difficulty" },
      { level: "info", title: "Attendance is strong", body: "3.8 visits/wk is above average — capitalize on this.", action: "Assign progressive programme" },
    ],
    timeline: [
      { type: "visit", label: "Gym visit", time: "4 days ago" },
      { type: "workout", label: "Workout not completed", time: "4 days ago" },
      { type: "msg", label: "Message sent by coach", time: "3 days ago" },
      { type: "visit", label: "Gym visit", time: "5 days ago" },
      { type: "visit", label: "Gym visit", time: "6 days ago" },
    ],
    metrics: { totalVisits: 22, streak: 4, bookedNext: true, avgPerMonth: 16 }
  },
  {
    id: 4,
    name: "Matthew Mottershead",
    initials: "MM",
    avatarColor: "#1e2f3f",
    tags: ["Regular"],
    status: "healthy",
    score: 84,
    trend: "up",
    lastVisit: "3d ago",
    visitsPerWeek: 1.3,
    completionPct: 75,
    lastMessage: "2d ago",
    flags: [],
    insights: [
      { level: "info", title: "Consistent engagement", body: "Client has maintained steady visits and strong workout completion.", action: "Consider progression plan" },
    ],
    timeline: [
      { type: "visit", label: "Gym visit", time: "3 days ago" },
      { type: "workout", label: "Workout completed", time: "3 days ago" },
      { type: "msg", label: "Message sent by coach", time: "2 days ago" },
      { type: "msg", label: "Message received from client", time: "1 day ago" },
      { type: "visit", label: "Gym visit", time: "7 days ago" },
    ],
    metrics: { totalVisits: 18, streak: 3, bookedNext: true, avgPerMonth: 6 }
  },
];

const FILTERS = [
  { id: "all", label: "All Clients", count: 4 },
  { id: "at-risk", label: "At Risk", count: 1, danger: true },
  { id: "not-booked", label: "Not Booked", count: 2, warning: true },
  { id: "low-engagement", label: "Low Engagement", count: 2, warning: true },
  { id: "recently-inactive", label: "Recently Inactive", count: 1 },
  { id: "new", label: "New", count: 2 },
  { id: "vip", label: "VIP", count: 0 },
  { id: "healthy", label: "Active", count: 1 },
  { id: "lapsed", label: "Lapsed", count: 0 },
  { id: "birthdays", label: "Birthdays", count: 0 },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const colors = { "at-risk": "#ef4444", "needs-attention": "#f59e0b", healthy: "#22c55e" };
  return <span style={{ width: 7, height: 7, borderRadius: "50%", background: colors[status], display: "inline-block", flexShrink: 0 }} />;
}

function TrendIcon({ trend }) {
  if (trend === "up") return <span className="trend-up" style={{ fontSize: 11 }}>↑ Improving</span>;
  if (trend === "down") return <span className="trend-down" style={{ fontSize: 11 }}>↓ Declining</span>;
  return <span className="trend-flat" style={{ fontSize: 11 }}>— Stable</span>;
}

function ScoreBadge({ score, status }) {
  const cls = status === "at-risk" ? "score-red" : status === "needs-attention" ? "score-amber" : "score-green";
  return <div className={`score-badge ${cls}`}>{score}</div>;
}

function FlagChips({ flags }) {
  const map = {
    "no-visit": { label: "No visit this week", cls: "flag-red" },
    "declining": { label: "Declining", cls: "flag-amber" },
    "low-workout": { label: "Low workout", cls: "flag-amber" },
    "not-booked": { label: "Not booked", cls: "flag-gray" },
  };
  return (
    <span style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {flags.map(f => map[f] ? <span key={f} className={`flag-chip ${map[f].cls}`}>{map[f].label}</span> : null)}
    </span>
  );
}

function TlDot({ type }) {
  const cls = { visit: "tl-visit", miss: "tl-miss", msg: "tl-msg", workout: "tl-workout" };
  return <span className={`timeline-dot ${cls[type] || "tl-visit"}`} />;
}

function InsightLevelIcon({ level }) {
  if (level === "critical") return <span style={{ fontSize: 13, color: "var(--red)" }}>⚠</span>;
  if (level === "warning") return <span style={{ fontSize: 13, color: "var(--amber)" }}>◉</span>;
  return <span style={{ fontSize: 13, color: "var(--blue)" }}>ℹ</span>;
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ activePage }) {
  const nav = [
    { id: "today", label: "Today", icon: "◈" },
    { id: "clients", label: "Clients", icon: "⊡" },
    { id: "schedule", label: "Schedule", icon: "▦" },
    { id: "content", label: "Content", icon: "❑" },
    { id: "profile", label: "Profile", icon: "◎" },
  ];
  return (
    <div className="sidebar">
      <div className="sidebar-gym">
        <div className="gym-avatar">F</div>
        <div>
          <div className="gym-name">Foundry Gym</div>
          <div className="gym-role">Coach</div>
        </div>
      </div>
      <div className="nav-label">Navigation</div>
      {nav.map(n => (
        <div key={n.id} className={`nav-item ${activePage === n.id ? "active" : ""}`}>
          <span className="nav-icon">{n.icon}</span>
          {n.label}
        </div>
      ))}
      <div className="sidebar-footer">
        <div className="sidebar-link">⊞ View Gym Page</div>
        <div className="sidebar-link">⊟ Member View</div>
        <div className="sidebar-link logout">↩ Log Out</div>
      </div>
    </div>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({ client, onClose }) {
  if (!client) {
    return (
      <div className="detail-panel" style={{ width: "var(--panel-w)" }}>
        <div className="empty-panel">
          <div className="empty-icon">⊡</div>
          <div className="empty-title">No client selected</div>
          <div className="empty-sub">Click a client row to view their full profile, insights, and engagement history.</div>
        </div>
      </div>
    );
  }

  const scoreColor = client.status === "at-risk" ? "var(--red)" : client.status === "needs-attention" ? "var(--amber)" : "var(--green)";
  const barFill = `linear-gradient(90deg, ${scoreColor} 0%, ${scoreColor}88 100%)`;

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-top">
          <div className="panel-avatar" style={{ background: client.avatarColor }}>
            {client.initials}
          </div>
          <div>
            <div className="panel-name">{client.name}</div>
            <div className="panel-sub" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot status={client.status} />
              <span style={{ textTransform: "capitalize" }}>{client.status.replace("-", " ")}</span>
              <span style={{ color: "var(--text3)" }}>·</span>
              <TrendIcon trend={client.trend} />
            </div>
          </div>
          <div className="panel-close" onClick={onClose}>✕</div>
        </div>
        <div className="quick-actions">
          <button className="qa-btn primary">✉ Message</button>
          <button className="qa-btn">📅 Book</button>
          <button className="qa-btn">⊕ Assign</button>
        </div>
      </div>

      {/* Body */}
      <div className="panel-body">

        {/* Retention Score */}
        <div className="panel-section">
          <div className="panel-section-title">Retention Score</div>
          <div className="score-bar-wrap">
            <div className="score-bar-header">
              <div className="score-bar-label">Overall health score</div>
              <div className="score-bar-value" style={{ color: scoreColor }}>{client.score}</div>
            </div>
            <div className="score-bar-track">
              <div className="score-bar-fill" style={{ width: `${client.score}%`, background: barFill }} />
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="panel-section">
          <div className="panel-section-title">Key Metrics</div>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-card-label">Last Visit</div>
              <div className="metric-card-value" style={{ fontSize: 16 }}>{client.lastVisit}</div>
            </div>
            <div className="metric-card">
              <div className="metric-card-label">Visits / Week</div>
              <div className="metric-card-value">{client.visitsPerWeek}</div>
            </div>
            <div className="metric-card">
              <div className="metric-card-label">Completion</div>
              <div className="metric-card-value">{client.completionPct}%</div>
            </div>
            <div className="metric-card">
              <div className="metric-card-label">Streak</div>
              <div className="metric-card-value">{client.metrics.streak}<span style={{ fontSize: 13 }}> wks</span></div>
            </div>
            <div className="metric-card">
              <div className="metric-card-label">Last Message</div>
              <div className="metric-card-value" style={{ fontSize: 15 }}>{client.lastMessage}</div>
            </div>
            <div className="metric-card">
              <div className="metric-card-label">Next Session</div>
              <div className="metric-card-value" style={{ fontSize: 14, color: client.metrics.bookedNext ? "var(--green)" : "var(--red)" }}>
                {client.metrics.bookedNext ? "Booked" : "Not booked"}
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="panel-section">
          <div className="panel-section-title">Insights</div>
          {client.insights.map((ins, i) => (
            <div key={i} className={`insight-item ${ins.level}`}>
              <div className="insight-header">
                <div className="insight-title">{ins.title}</div>
                <InsightLevelIcon level={ins.level} />
              </div>
              <div className="insight-body">{ins.body}</div>
              <div className="insight-action">→ {ins.action}</div>
            </div>
          ))}
        </div>

        {/* Engagement Timeline */}
        <div className="panel-section">
          <div className="panel-section-title">Recent Activity</div>
          {client.timeline.map((tl, i) => (
            <div key={i} className="timeline-item">
              <TlDot type={tl.type} />
              <div className="timeline-content">
                <div className="tl-title">{tl.label}</div>
                <div className="tl-time">{tl.time}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ─── CLIENT ROW ───────────────────────────────────────────────────────────────
function ClientRow({ client, selected, onClick }) {
  const ringCls = client.status === "at-risk" ? "status-ring-red" : client.status === "needs-attention" ? "status-ring-amber" : "status-ring-green";
  return (
    <div
      className={`client-row ${client.status} ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="client-avatar" style={{ background: client.avatarColor }}>
        <div className={`avatar-ring ${ringCls}`} />
        {client.initials}
      </div>

      {/* Info */}
      <div className="client-info">
        <div className="client-name-row">
          <span className="client-name">{client.name}</span>
          {client.tags.map(t => (
            <span key={t} className={`tag tag-${t.toLowerCase()}`}>{t}</span>
          ))}
        </div>
        <div className="client-meta">
          <div className="meta-item">
            <span className={`meta-dot meta-dot-${client.status === "healthy" ? "green" : client.status === "needs-attention" ? "amber" : "red"}`} />
            <span>{client.lastVisit}</span>
          </div>
          <div className="meta-item">{client.visitsPerWeek}/wk avg</div>
          <div className="meta-item">{client.completionPct}% completion</div>
          <TrendIcon trend={client.trend} />
        </div>
        {client.flags.length > 0 && (
          <div style={{ marginTop: 5 }}>
            <FlagChips flags={client.flags} />
          </div>
        )}
      </div>

      {/* Right */}
      <div className="row-right">
        <ScoreBadge score={client.score} status={client.status} />
        <div className="row-action" title="Message">✉</div>
        <div className="row-action" title="Book">📅</div>
        <div className="row-chevron">›</div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("priority");

  const selectedClient = clients.find(c => c.id === selectedId) || null;

  const filterMap = {
    "all": () => true,
    "at-risk": c => c.status === "at-risk",
    "needs-attention": c => c.status === "needs-attention",
    "healthy": c => c.status === "healthy",
    "not-booked": c => !c.metrics.bookedNext,
    "low-engagement": c => c.completionPct < 50,
    "recently-inactive": c => parseInt(c.lastVisit) >= 7,
    "new": c => c.tags.includes("New"),
    "vip": c => c.tags.includes("VIP"),
    "lapsed": c => c.tags.includes("Lapsed"),
    "birthdays": () => false,
  };

  let filtered = clients.filter(filterMap[activeFilter] || (() => true));
  if (search) {
    filtered = filtered.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }

  // Priority order
  const priorityOrder = { "at-risk": 0, "needs-attention": 1, healthy: 2 };
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "priority") return priorityOrder[a.status] - priorityOrder[b.status];
    if (sort === "score-asc") return a.score - b.score;
    if (sort === "score-desc") return b.score - a.score;
    if (sort === "last-visit") return parseInt(a.lastVisit) - parseInt(b.lastVisit);
    return 0;
  });

  // Group by status for priority view
  const groups = sort === "priority"
    ? [
        { key: "at-risk", label: "⬤  At Risk", rows: sorted.filter(c => c.status === "at-risk") },
        { key: "needs-attention", label: "⬤  Needs Attention", rows: sorted.filter(c => c.status === "needs-attention") },
        { key: "healthy", label: "⬤  Healthy", rows: sorted.filter(c => c.status === "healthy") },
      ].filter(g => g.rows.length > 0)
    : [{ key: "all", label: null, rows: sorted }];

  const atRiskCount = clients.filter(c => c.status === "at-risk").length;
  const attentionCount = clients.filter(c => c.status === "needs-attention").length;
  const noShowRate = 0;

  return (
    <>
      <style>{css}</style>
      <div className="layout">
        <Sidebar activePage="clients" />

        <div className="main">
          {/* Header */}
          <div className="header">
            <div className="header-left">
              <h1>Clients</h1>
              <p>4 clients · Foundry Gym</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-ghost">⊞ Scan QR</button>
              <button className="btn btn-primary">+ New Client</button>
              <div className="avatar-btn">M</div>
              <div className="icon-btn">✉</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total Clients</div>
              <div className="stat-value">4</div>
              <div className="stat-sub">assigned to you</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active This Month</div>
              <div className="stat-value stat-accent-green">4</div>
              <div className="stat-sub">visited this month</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">At Risk</div>
              <div className="stat-value stat-accent-red">{atRiskCount}</div>
              <div className="stat-sub">need immediate action</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Needs Attention</div>
              <div className="stat-value stat-accent-amber">{attentionCount}</div>
              <div className="stat-sub">monitor closely</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg No-Show Rate</div>
              <div className="stat-value">{noShowRate}%</div>
              <div className="stat-sub">last 30 days</div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="filter-bar">
            {FILTERS.map((f, i) => (
              <>
                {i === 4 && <div key={`div-${i}`} className="filter-divider" />}
                <div
                  key={f.id}
                  className={`filter-tab ${activeFilter === f.id ? "active" : ""} ${f.danger ? "danger" : ""} ${f.warning ? "warning" : ""}`}
                  onClick={() => setActiveFilter(f.id)}
                >
                  {f.label}
                  {f.count > 0 && <span className="badge">{f.count}</span>}
                </div>
              </>
            ))}
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">⊙</span>
              <input
                className="search-input"
                placeholder="Search clients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="priority">Sort: Priority</option>
              <option value="score-asc">Sort: Score ↑</option>
              <option value="score-desc">Sort: Score ↓</option>
              <option value="last-visit">Sort: Last Visit</option>
            </select>
            <div className="toolbar-right">
              <div className="icon-btn active" title="List view">☰</div>
              <div className="icon-btn" title="Card view">⊞</div>
              <div className="icon-btn" title="Bulk">⊟ Bulk</div>
              <div className="icon-btn" title="Export">↓ Export</div>
            </div>
          </div>

          {/* List + panel */}
          <div className="list-panel-wrap">
            <div className="client-list">
              {groups.map(group => (
                <div key={group.key}>
                  {group.label && (
                    <div className="group-header" style={{
                      color: group.key === "at-risk" ? "var(--red)" : group.key === "needs-attention" ? "var(--amber)" : "var(--green)"
                    }}>
                      {group.label}
                    </div>
                  )}
                  {group.rows.map(client => (
                    <ClientRow
                      key={client.id}
                      client={client}
                      selected={selectedId === client.id}
                      onClick={() => setSelectedId(selectedId === client.id ? null : client.id)}
                    />
                  ))}
                </div>
              ))}
              {sorted.length === 0 && (
                <div style={{ padding: "40px 28px", color: "var(--text3)", textAlign: "center" }}>
                  No clients match the current filter.
                </div>
              )}
            </div>

            {/* Detail panel */}
            <DetailPanel client={selectedClient} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      </div>
    </>
  );
}
