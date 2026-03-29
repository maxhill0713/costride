import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Calendar, Dumbbell, AlertTriangle, AlertCircle,
  CheckCircle, XCircle, TrendingDown, TrendingUp, Minus,
  ChevronRight, ChevronDown, ChevronUp, Activity, BarChart2,
  User, Phone, Mail, MapPin, ArrowUpRight, Target, Check,
  BookOpen, RefreshCw, Edit2,
} from 'lucide-react';

/* ─── Tokens ─────────────────────────────────────────────────── */
const BG      = '#080c14';
const SURFACE = '#0d1120';
const CARD    = '#111827';
const BORDER  = '1px solid rgba(255,255,255,0.06)';
const BORDER2 = '1px solid rgba(255,255,255,0.09)';
const BLUE    = '#2563eb';
const BLUE_LT = '#60a5fa';
const TEXT    = '#f1f5f9';
const SUB     = 'rgba(255,255,255,0.45)';
const MUTE    = 'rgba(255,255,255,0.22)';
const LABEL   = 'rgba(255,255,255,0.28)';
const GREEN   = '#22c55e';
const AMBER   = '#f59e0b';
const RED     = '#ef4444';

/* ─── Mock data ─────────────────────────────────────────────── */
const CLIENT = {
  name: 'Sarah Mitchell',
  avatar_url: null,
  hero_url: null,
  email: 'sarah.mitchell@email.com',
  phone: '+44 7700 900 142',
  location: 'Manchester, UK',
  joined: 'Jan 2024',
  goal: 'Weight Loss & Strength',
  tags: ['Premium', 'PT Client'],
  retention_status: 'at_risk',
  trend: 'declining',
  last_visit: '6 days ago',
  visits_per_week: 1.2,
  completion_pct: 34,
  next_session: null,
  total_sessions: 47,
  no_show_rate: 18,
  streak: 0,
};

const INSIGHTS = [
  { id: 1, severity: 'high',   title: 'No visit in 6 days',            body: 'Average cadence was 3×/week.',                action: 'Book session',   key: 'book' },
  { id: 2, severity: 'high',   title: 'Missed last 2 sessions',        body: 'No-showed Mon 22nd and Wed 24th.',             action: 'Send message',   key: 'message' },
  { id: 3, severity: 'medium', title: 'Workout completion below 40%',  body: 'Only 34% of assigned workouts completed.',     action: 'Assign workout', key: 'assign' },
  { id: 4, severity: 'medium', title: 'No sessions booked this week',  body: 'Client has no upcoming sessions.',             action: 'Book session',   key: 'book' },
];

const TIMELINE = [
  { id: 1, type: 'no_show',  label: 'No-show',           sub: 'Wed 9:00 AM session',     time: '2 days ago' },
  { id: 2, type: 'no_show',  label: 'No-show',           sub: 'Mon 7:00 AM session',     time: '4 days ago' },
  { id: 3, type: 'message',  label: 'Message received',  sub: '"Running a bit behind…"', time: '5 days ago' },
  { id: 4, type: 'workout',  label: 'Workout completed', sub: 'Upper Body Strength B',   time: '6 days ago' },
  { id: 5, type: 'attended', label: 'Session attended',  sub: 'Fri 6:00 AM — 55 min',   time: '8 days ago' },
  { id: 6, type: 'attended', label: 'Session attended',  sub: 'Wed 9:00 AM — 60 min',   time: '11 days ago' },
  { id: 7, type: 'attended', label: 'Session attended',  sub: 'Mon 7:00 AM — 60 min',   time: '14 days ago' },
];

const PAST_SESSIONS = [
  { date: 'Mon 22 Apr', time: '7:00 AM',  status: 'no_show',   duration: null },
  { date: 'Wed 17 Apr', time: '9:00 AM',  status: 'no_show',   duration: null },
  { date: 'Fri 12 Apr', time: '6:00 AM',  status: 'attended',  duration: '55 min' },
  { date: 'Wed 10 Apr', time: '9:00 AM',  status: 'attended',  duration: '60 min' },
  { date: 'Mon 8 Apr',  time: '7:00 AM',  status: 'attended',  duration: '60 min' },
  { date: 'Fri 5 Apr',  time: '6:00 AM',  status: 'cancelled', duration: null },
  { date: 'Wed 3 Apr',  time: '9:00 AM',  status: 'attended',  duration: '50 min' },
];

const WORKOUTS = [
  { name: 'Full Body Recomp – Week 4', completed: 2, total: 6, pct: 33, last: '3 days ago', flag: true },
  { name: 'Upper Body Strength B',     completed: 4, total: 5, pct: 80, last: '6 days ago', flag: false },
  { name: 'Lower Body Power A',        completed: 3, total: 5, pct: 60, last: '12 days ago', flag: false },
];

const WEEKLY = [
  { week: 'W1', v: 3 }, { week: 'W2', v: 3 },
  { week: 'W3', v: 2 }, { week: 'W4', v: 1 }, { week: 'W5', v: 0 },
];

const STATUS_MAP = {
  healthy:         { label: 'Healthy',        dot: GREEN, color: GREEN },
  needs_attention: { label: 'Needs Attention', dot: AMBER, color: AMBER },
  at_risk:         { label: 'At Risk',         dot: RED,   color: RED },
};
const TREND_MAP = {
  improving: { label: 'Improving', icon: TrendingUp,  color: GREEN },
  stable:    { label: 'Stable',    icon: Minus,        color: AMBER },
  declining: { label: 'Declining', icon: TrendingDown, color: RED },
};
const S_STATUS = {
  attended:  { label: 'Attended',  color: GREEN },
  no_show:   { label: 'No-show',   color: RED },
  cancelled: { label: 'Cancelled', color: AMBER },
};
const TL_DOT = {
  no_show: RED, message: BLUE_LT,
  workout: 'rgba(255,255,255,0.3)', attended: GREEN,
};

const ini = n => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap');
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.45} }
@keyframes fade-up { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
* { box-sizing:border-box; }
.cp { font-family:'Figtree',system-ui,sans-serif; color:${TEXT}; }
.cp-btn { border:none; outline:none; cursor:pointer; font-family:inherit; transition:opacity .15s,transform .15s; }
.cp-btn:hover { opacity:.82; }
.cp-btn:active { transform:scale(.96); }
.cp-hover { transition:background .12s; border-radius:10px; }
.cp-hover:hover { background:rgba(255,255,255,0.028)!important; }
.cp-card { background:${CARD}; border:${BORDER}; border-radius:14px; }
.cp-in { animation:fade-up .3s ease both; }
`;

/* ─── Atoms ──────────────────────────────────────────────────── */
const Lbl = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 800, color: LABEL, textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 10 }}>
    {children}
  </div>
);

const Hr = () => <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />;

function Section({ title, icon: Icon, children, action, onAction }) {
  return (
    <div className="cp-card cp-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: BORDER }}>
        <Icon style={{ width: 13, height: 13, color: MUTE }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: TEXT, flex: 1 }}>{title}</span>
        {action && (
          <button className="cp-btn" onClick={onAction}
            style={{ fontSize: 11, fontWeight: 700, color: BLUE_LT, background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.16)', borderRadius: 8, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
            {action} <ChevronRight style={{ width: 10, height: 10 }} />
          </button>
        )}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

function ProgressBar({ pct }) {
  const c = pct >= 70 ? 'rgba(255,255,255,0.38)' : pct >= 45 ? 'rgba(255,255,255,0.22)' : 'rgba(239,68,68,0.5)';
  return (
    <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: c }} />
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────── */
export default function ClientProfile({ client: cl = CLIENT, onMessage, onBook, onAssign, onEditProfile }) {
  const [tlExpanded, setTlExpanded]   = useState(false);
  const [expandWork, setExpandWork]   = useState(null);
  const [toastMsg, setToastMsg]       = useState(null);

  const st  = STATUS_MAP[cl.retention_status] || STATUS_MAP.healthy;
  const tr  = TREND_MAP[cl.trend] || TREND_MAP.stable;
  const TrI = tr.icon;

  const act = (label, key) => {
    if (key === 'message') onMessage?.();
    if (key === 'book')    onBook?.();
    if (key === 'assign')  onAssign?.();
    setToastMsg(label);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const tlShow = tlExpanded ? TIMELINE : TIMELINE.slice(0, 4);

  return (
    <div className="cp" style={{ background: BG, minHeight: '100vh' }}>
      <style>{CSS}</style>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: CARD, border: BORDER2, borderRadius: 11, padding: '9px 18px', fontSize: 12.5, fontWeight: 700, color: TEXT, boxShadow: '0 8px 32px rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <Check style={{ width: 12, height: 12, color: GREEN }} /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STICKY BAR ────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: `${BG}f2`, backdropFilter: 'blur(16px)', borderBottom: BORDER, padding: '9px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: BORDER2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: SUB, flexShrink: 0 }}>
          {ini(cl.name)}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{cl.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'block', animation: cl.retention_status === 'at_risk' ? 'blink 1.8s ease-in-out infinite' : 'none' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: st.color }}>{st.label}</span>
        </div>
        <div style={{ flex: 1 }} />
        {[
          { label: 'Message', key: 'message', icon: MessageSquare, primary: false },
          { label: 'Book Session', key: 'book', icon: Calendar, primary: true },
          { label: 'Assign Workout', key: 'assign', icon: Dumbbell, primary: false },
        ].map(({ label, key, icon: Ic, primary }) => (
          <button key={key} className="cp-btn" onClick={() => act(label, key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: primary ? BLUE : 'rgba(255,255,255,0.05)', border: primary ? 'none' : BORDER2, color: primary ? '#fff' : SUB, boxShadow: primary ? '0 2px 12px rgba(37,99,235,0.32)' : 'none' }}>
            <Ic style={{ width: 12, height: 12 }} /> {label}
          </button>
        ))}
        <button className="cp-btn" onClick={onEditProfile}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.05)', border: BORDER2, color: SUB }}>
          <Edit2 style={{ width: 12, height: 12 }} /> Edit Profile
        </button>
      </div>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        {/* Banner */}
        <div style={{ height: 190, position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#0d1828 0%,#060a14 100%)' }}>
          {cl.hero_url
            ? <img src={cl.hero_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
            : (
              <div style={{ position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(ellipse at 25% 60%,rgba(37,99,235,0.1) 0%,transparent 60%),radial-gradient(ellipse at 78% 35%,rgba(99,102,241,0.07) 0%,transparent 55%)',
              }} />
            )
          }
          {/* subtle grid texture */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        {/* Centered avatar — overlapping hero */}
        <div style={{ position: 'absolute', bottom: -46, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ width: 92, height: 92, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(37,99,235,0.6),rgba(37,99,235,0.25))', border: '3px solid #080c14', outline: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: BLUE_LT, overflow: 'hidden', boxShadow: '0 8px 36px rgba(0,0,0,0.65)' }}>
            {cl.avatar_url
              ? <img src={cl.avatar_url} alt={cl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : ini(cl.name)
            }
          </div>
        </div>
      </div>

      {/* ── IDENTITY ──────────────────────────────────────────── */}
      <div style={{ paddingTop: 60, paddingBottom: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 23, fontWeight: 900, color: TEXT, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 6 }}>{cl.name}</div>
        <div style={{ fontSize: 13, color: SUB, fontWeight: 500, marginBottom: 14 }}>{cl.goal}</div>

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: BORDER2, fontSize: 12, fontWeight: 700, color: st.color }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'block', animation: cl.retention_status === 'at_risk' ? 'blink 1.8s ease-in-out infinite' : 'none' }} />
            {st.label}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: BORDER2, fontSize: 12, fontWeight: 700, color: tr.color }}>
            <TrI style={{ width: 11, height: 11 }} /> {tr.label}
          </span>
          {cl.tags.map(t => (
            <span key={t} style={{ padding: '4px 11px', borderRadius: 99, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', fontSize: 11, fontWeight: 700, color: BLUE_LT }}>{t}</span>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {[
            { label: 'Message Client', key: 'message', icon: MessageSquare, primary: false },
            { label: 'Book Session',   key: 'book',    icon: Calendar,      primary: true },
            { label: 'Assign Workout', key: 'assign',  icon: Dumbbell,      primary: false },
          ].map(({ label, key, icon: Ic, primary }) => (
            <button key={key} className="cp-btn" onClick={() => act(label, key)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 11, fontSize: 13, fontWeight: 800, background: primary ? BLUE : 'rgba(255,255,255,0.05)', border: primary ? 'none' : BORDER2, color: primary ? '#fff' : SUB, boxShadow: primary ? '0 4px 18px rgba(37,99,235,0.36)' : 'none' }}>
              <Ic style={{ width: 13, height: 13 }} /> {label}
            </button>
          ))}
          <button className="cp-btn" onClick={onEditProfile}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 11, fontSize: 13, fontWeight: 800, background: 'rgba(255,255,255,0.05)', border: BORDER2, color: SUB }}>
            <Edit2 style={{ width: 13, height: 13 }} /> Edit Profile
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ────────────────────────────────────────── */}
      <div style={{ padding: '0 28px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Last Visit',    value: cl.last_visit,                   sub: null,           warn: cl.retention_status === 'at_risk' },
            { label: 'Visits / Week', value: `${cl.visits_per_week}×`,        sub: 'last 4 weeks', warn: cl.visits_per_week < 2 },
            { label: 'Completion',    value: `${cl.completion_pct}%`,         sub: 'workouts',     warn: cl.completion_pct < 50 },
            { label: 'Next Session',  value: cl.next_session || 'Not booked', sub: null,           warn: !cl.next_session },
          ].map(({ label, value, sub, warn }) => (
            <div key={label} style={{ background: CARD, border: warn ? '1px solid rgba(239,68,68,0.16)' : BORDER, borderRadius: 13, padding: '16px 18px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: LABEL, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: warn ? 'rgba(239,68,68,0.8)' : TEXT, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: sub ? 4 : 0 }}>{value}</div>
              {sub && <div style={{ fontSize: 11, color: MUTE, fontWeight: 600 }}>{sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY GRID ─────────────────────────────────────────── */}
      <div style={{ padding: '0 28px 80px', display: 'grid', gridTemplateColumns: '1fr 272px', gap: 14, alignItems: 'start' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Insights */}
          {INSIGHTS.length > 0 && (
            <div className="cp-card cp-in" style={{ border: '1px solid rgba(239,68,68,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: BORDER }}>
                <AlertTriangle style={{ width: 13, height: 13, color: 'rgba(239,68,68,0.6)' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: TEXT, flex: 1 }}>Critical Insights</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(239,68,68,0.75)', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.16)', borderRadius: 99, padding: '2px 10px' }}>{INSIGHTS.length} active</span>
              </div>
              <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {INSIGHTS.map(ins => (
                  <div key={ins.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 11, background: 'rgba(255,255,255,0.02)', border: BORDER }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: ins.severity === 'high' ? RED : AMBER }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{ins.title}</div>
                      <div style={{ fontSize: 11.5, color: SUB }}>{ins.body}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: ins.severity === 'high' ? 'rgba(239,68,68,0.65)' : 'rgba(245,158,11,0.65)', background: ins.severity === 'high' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${ins.severity === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}`, borderRadius: 99, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '.07em', flexShrink: 0 }}>{ins.severity}</span>
                    <button className="cp-btn" onClick={() => act(ins.action, ins.key)}
                      style={{ fontSize: 11, fontWeight: 700, color: BLUE_LT, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 8, padding: '5px 11px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {ins.action} <ArrowUpRight style={{ width: 10, height: 10 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <Section title="Engagement Timeline" icon={Activity}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tlShow.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: TL_DOT[item.type] || MUTE, marginTop: 9, flexShrink: 0 }} />
                    {i < tlShow.length - 1 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.05)', minHeight: 16, margin: '3px 0' }} />}
                  </div>
                  <div className="cp-hover" style={{ flex: 1, padding: '7px 10px', marginBottom: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: TEXT }}>{item.label}</span>
                      <span style={{ fontSize: 11, color: MUTE, fontWeight: 600, marginLeft: 12, flexShrink: 0 }}>{item.time}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: SUB, marginTop: 1 }}>{item.sub}</div>
                  </div>
                </div>
              ))}
              {TIMELINE.length > 4 && (
                <button className="cp-btn" onClick={() => setTlExpanded(e => !e)}
                  style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: SUB, background: 'rgba(255,255,255,0.03)', border: BORDER, borderRadius: 9, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%' }}>
                  {tlExpanded
                    ? <><ChevronUp style={{ width: 12, height: 12 }} /> Show less</>
                    : <><ChevronDown style={{ width: 12, height: 12 }} /> {TIMELINE.length - 4} more</>}
                </button>
              )}
            </div>
          </Section>

          {/* Schedule */}
          <Section title="Schedule & Attendance" icon={Calendar} action="Book Session" onAction={() => act('Book session', 'book')}>
            <Lbl>Upcoming</Lbl>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 11, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.13)', marginBottom: 20 }}>
              <AlertCircle style={{ width: 13, height: 13, color: 'rgba(239,68,68,0.6)', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: SUB, flex: 1 }}>No upcoming sessions booked</span>
              <button className="cp-btn" onClick={() => act('Book session', 'book')}
                style={{ fontSize: 11, fontWeight: 800, color: BLUE_LT, background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.16)', borderRadius: 8, padding: '5px 12px', whiteSpace: 'nowrap' }}>
                Book Now
              </button>
            </div>

            <Lbl>Last 7 Sessions</Lbl>
            <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
              {PAST_SESSIONS.map((s, i) => {
                const c2 = s.status === 'attended' ? GREEN : s.status === 'no_show' ? RED : AMBER;
                return (
                  <div key={i} title={`${s.date} — ${S_STATUS[s.status]?.label}`}
                    style={{ flex: 1, height: 28, borderRadius: 6, background: `${c2}12`, border: `1px solid ${c2}24`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: c2 }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
              {[{ color: GREEN, label: 'Attended' }, { color: RED, label: 'No-show' }, { color: AMBER, label: 'Cancelled' }].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: 10.5, color: MUTE, fontWeight: 600 }}>{label}</span>
                </div>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(239,68,68,0.65)', fontWeight: 700 }}>No-show rate: {CLIENT.no_show_rate}%</span>
            </div>

            <Hr />
            <div style={{ marginTop: 14 }}>
              <Lbl>Past Sessions</Lbl>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {PAST_SESSIONS.map((s, i) => (
                  <div key={i} className="cp-hover" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT, flex: 1 }}>{s.date}</span>
                    <span style={{ fontSize: 12, color: MUTE }}>{s.time}</span>
                    {s.duration && <span style={{ fontSize: 11.5, color: MUTE }}>{s.duration}</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, color: S_STATUS[s.status]?.color, minWidth: 68, textAlign: 'right' }}>{S_STATUS[s.status]?.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Workouts */}
          <Section title="Workout Engagement" icon={Dumbbell} action="Assign Workout" onAction={() => act('Assign workout', 'assign')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {WORKOUTS.map((w, i) => (
                <div key={i} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: BORDER, overflow: 'hidden' }}>
                  <div className="cp-hover" onClick={() => setExpandWork(expandWork === i ? null : i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer', borderRadius: 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                      <ProgressBar pct={w.pct} />
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 14 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: w.pct < 45 ? 'rgba(239,68,68,0.75)' : TEXT, letterSpacing: '-0.03em', lineHeight: 1 }}>{w.pct}%</div>
                      <div style={{ fontSize: 10.5, color: MUTE, marginTop: 3, fontWeight: 600 }}>{w.completed}/{w.total}</div>
                    </div>
                    {expandWork === i
                      ? <ChevronUp style={{ width: 12, height: 12, color: MUTE, flexShrink: 0 }} />
                      : <ChevronDown style={{ width: 12, height: 12, color: MUTE, flexShrink: 0 }} />}
                  </div>
                  <AnimatePresence>
                    {expandWork === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                        style={{ overflow: 'hidden', borderTop: BORDER }}>
                        <div style={{ padding: '11px 14px', display: 'flex', gap: 20, alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: LABEL, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>Last activity</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: SUB }}>{w.last}</div>
                          </div>
                          {w.flag && (
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.13)' }}>
                              <AlertCircle style={{ width: 11, height: 11, color: 'rgba(239,68,68,0.6)' }} />
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(239,68,68,0.65)' }}>Low engagement</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </Section>

          {/* Consistency */}
          <Section title="Consistency Trend" icon={BarChart2}>
            <Lbl>Weekly Visits — Last 5 Weeks</Lbl>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 62, marginBottom: 18 }}>
              {WEEKLY.map((w, i) => {
                const pct = Math.max((w.v / 4) * 100, 4);
                const col = w.v === 0 ? 'rgba(239,68,68,0.4)' : w.v < 2 ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.3)';
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: col, lineHeight: 1 }}>{w.v}</div>
                    <div style={{ width: '100%', borderRadius: 5, background: col, height: `${pct}%`, minHeight: 4 }} />
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: MUTE }}>{w.week}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Avg Freq',  value: '1.2×/wk', warn: true },
                { label: 'Streak',    value: '0 days',   warn: true },
                { label: 'Trend',     value: 'Declining',warn: true },
              ].map(({ label, value, warn }) => (
                <div key={label} style={{ padding: '11px 12px', borderRadius: 11, background: 'rgba(255,255,255,0.02)', border: BORDER }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: LABEL, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: warn ? 'rgba(239,68,68,0.75)' : TEXT, letterSpacing: '-0.02em' }}>{value}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Interaction */}
          <Section title="Interaction History" icon={MessageSquare} action="Send Message" onAction={() => act('Message', 'message')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Last Message',      value: '5 days ago', sub: '"Running a bit behind…"', warn: false },
                { label: 'Last Coach Action', value: '8 days ago', sub: 'Session booked',           warn: true },
                { label: 'Response Time',     value: 'Slow',       sub: 'Avg. 6 hrs to reply',      warn: true },
                { label: 'Interaction Score', value: '4 / 10',     sub: 'Low engagement',            warn: true },
              ].map(({ label, value, sub, warn }) => (
                <div key={label} style={{ padding: '12px 13px', borderRadius: 11, background: 'rgba(255,255,255,0.02)', border: BORDER }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: LABEL, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: warn ? 'rgba(239,68,68,0.72)' : TEXT, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 3 }}>{value}</div>
                  <div style={{ fontSize: 11, color: MUTE, fontWeight: 600 }}>{sub}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 11, background: 'rgba(255,255,255,0.02)', border: BORDER, fontSize: 12.5, color: SUB, lineHeight: 1.65 }}>
              No coach interaction in the last <span style={{ color: 'rgba(245,158,11,0.8)', fontWeight: 700 }}>8 days</span>. A proactive check-in could help prevent churn.
            </div>
          </Section>

        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 58 }}>

          {/* Info */}
          <div className="cp-card">
            <div style={{ padding: '13px 16px', borderBottom: BORDER }}><Lbl>Client Info</Lbl></div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { icon: Mail,   v: cl.email },
                { icon: Phone,  v: cl.phone },
                { icon: MapPin, v: cl.location },
                { icon: User,   v: `Since ${cl.joined}` },
                { icon: Target, v: cl.goal },
              ].map(({ icon: Ic, v }) => (
                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Ic style={{ width: 12, height: 12, color: MUTE, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: SUB, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Snapshot */}
          <div className="cp-card">
            <div style={{ padding: '13px 16px', borderBottom: BORDER }}><Lbl>Snapshot</Lbl></div>
            <div style={{ padding: '4px 16px 10px' }}>
              {[
                { label: 'Total Sessions',  value: CLIENT.total_sessions,       warn: false },
                { label: 'No-show Rate',    value: `${CLIENT.no_show_rate}%`,   warn: CLIENT.no_show_rate > 15 },
                { label: 'Completion',      value: `${CLIENT.completion_pct}%`, warn: CLIENT.completion_pct < 50 },
                { label: 'Visits / Week',   value: `${CLIENT.visits_per_week}×`,warn: CLIENT.visits_per_week < 2 },
              ].map(({ label, value, warn }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: BORDER }}>
                  <span style={{ fontSize: 12, color: SUB }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: warn ? 'rgba(239,68,68,0.75)' : TEXT }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Retention risk */}
          <div className="cp-card" style={{ border: '1px solid rgba(239,68,68,0.14)' }}>
            <div style={{ padding: '13px 16px', borderBottom: BORDER }}><Lbl>Retention Risk</Lbl></div>
            <div style={{ padding: '18px 16px' }}>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 46, fontWeight: 900, color: 'rgba(239,68,68,0.8)', letterSpacing: '-0.05em', lineHeight: 1 }}>78</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(239,68,68,0.55)', marginTop: 3 }}>High Risk Score</div>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', width: '78%', borderRadius: 99, background: 'linear-gradient(90deg,rgba(245,158,11,0.55),rgba(239,68,68,0.65))' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { label: 'Attendance drop',    sev: 'high' },
                  { label: 'Low completion',     sev: 'high' },
                  { label: 'No booking made',    sev: 'med' },
                  { label: 'Low engagement',     sev: 'med' },
                ].map(({ label, sev }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: SUB }}>{label}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: sev === 'high' ? 'rgba(239,68,68,0.65)' : 'rgba(245,158,11,0.65)', background: sev === 'high' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${sev === 'high' ? 'rgba(239,68,68,0.14)' : 'rgba(245,158,11,0.14)'}`, borderRadius: 99, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '.07em' }}>{sev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="cp-card">
            <div style={{ padding: '13px 16px', borderBottom: BORDER }}><Lbl>Quick Actions</Lbl></div>
            <div style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { label: 'Send check-in message', key: 'message', icon: MessageSquare },
                { label: 'Book next session',      key: 'book',    icon: Calendar },
                { label: 'Reassign workout',       key: 'assign',  icon: Dumbbell },
              ].map(({ label, key, icon: Ic }) => (
                <button key={key} className="cp-btn" onClick={() => act(label, key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: BORDER, fontSize: 12, fontWeight: 700, color: SUB, width: '100%', textAlign: 'left' }}>
                  <Ic style={{ width: 12, height: 12, flexShrink: 0 }} /> {label}
                  <ChevronRight style={{ width: 10, height: 10, marginLeft: 'auto', opacity: 0.35 }} />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}