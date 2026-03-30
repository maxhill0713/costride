/**
 * ClientProfile — Redesigned to match TabOverview / GymOwnerDashboard design system
 *
 * TOKEN ALIGNMENT (identical to TabOverview):
 *   bg          #080e18     surface    #0c1422    surfaceEl   #101929
 *   border      rgba(255,255,255,0.07)             borderEl   rgba(255,255,255,0.12)
 *   divider     rgba(255,255,255,0.04)
 *   t1          #f1f5f9     t2         #94a3b8    t3          #475569    t4  #2d3f55
 *   accent      #3b82f6     accentSub  rgba(59,130,246,0.10)
 *   success     #10b981     danger     #ef4444    warn        #f59e0b
 *   CARD_RADIUS 14          CARD_SHADOW inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.4)
 *
 * VISUAL HIERARCHY RULES (same as Overview):
 *   - Left-border Signal = only color on alert rows
 *   - Value text = t1 unless threshold crossed
 *   - Icon containers = always surfaceEl / neutral; glyph carries semantic color
 *   - Uppercase label: 10.5px, weight 700, letterSpacing .13em
 *   - No per-element color tinting on cards — color lives in value / badge only
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Calendar, Dumbbell, AlertTriangle, AlertCircle,
  CheckCircle, XCircle, TrendingDown, TrendingUp, Minus,
  ChevronRight, ChevronDown, ChevronUp, Activity, BarChart2,
  User, Phone, Mail, MapPin, ArrowUpRight, Target, Check,
  BookOpen, RefreshCw, Edit2, Star, Plus, X, GraduationCap, Award,
  Loader2, Eye, Camera, Save, Clock, Trophy, Shield, BadgeCheck,
  ScanFace, ClipboardCheck, AlertCircle as AlertCircleIcon,
  Package, Image, Trash2, Info, Languages,
} from 'lucide-react';
import { toast } from 'sonner';
import CoachProfileModal from '@/components/gym/CoachProfileModal';

// ─── Design tokens (aligned 1:1 with TabOverview) ────────────────────────────
const C = {
  bg:         '#080e18',
  surface:    '#0c1422',
  surfaceEl:  '#101929',
  border:     'rgba(255,255,255,0.07)',
  borderEl:   'rgba(255,255,255,0.12)',
  divider:    'rgba(255,255,255,0.04)',
  t1:         '#f1f5f9',
  t2:         '#94a3b8',
  t3:         '#475569',
  t4:         '#2d3f55',
  accent:     '#3b82f6',
  accentSub:  'rgba(59,130,246,0.10)',
  accentBrd:  'rgba(59,130,246,0.25)',
  success:    '#10b981',
  successSub: 'rgba(16,185,129,0.09)',
  successBrd: 'rgba(16,185,129,0.22)',
  danger:     '#ef4444',
  dangerSub:  'rgba(239,68,68,0.08)',
  dangerBrd:  'rgba(239,68,68,0.22)',
  warn:       '#f59e0b',
  warnSub:    'rgba(245,158,11,0.09)',
  warnBrd:    'rgba(245,158,11,0.22)',
  purple:     '#8b5cf6',
  purpleSub:  'rgba(139,92,246,0.10)',
  purpleBrd:  'rgba(139,92,246,0.25)',
};
const CARD_SHADOW  = 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.4)';
const CARD_RADIUS  = 14;

// ─── Empty client defaults (no hardcoded mock data) ───────────────────────────
const EMPTY_CLIENT = {
  name: '', avatar_url: null, hero_url: null,
  email: '', phone: '', location: '', joined: '',
  goal: '', tags: [], retention_status: 'healthy', trend: 'stable',
  last_visit: '—', visits_per_week: 0, completion_pct: 0,
  next_session: null, total_sessions: 0, no_show_rate: 0, streak: 0,
};

const STATUS_MAP = {
  healthy:         { label: 'Healthy',         color: C.success },
  needs_attention: { label: 'Needs Attention', color: C.warn   },
  at_risk:         { label: 'At Risk',         color: C.danger },
};
const TREND_MAP = {
  improving: { label: 'Improving', icon: TrendingUp,  color: C.success },
  stable:    { label: 'Stable',    icon: Minus,        color: C.warn   },
  declining: { label: 'Declining', icon: TrendingDown, color: C.danger },
};
const S_STATUS = {
  attended:  { label: 'Attended',  color: C.success },
  no_show:   { label: 'No-show',   color: C.danger  },
  cancelled: { label: 'Cancelled', color: C.warn    },
};
const TL_COLOR = {
  no_show: C.danger, message: C.accent,
  workout: C.t4,     attended: C.success,
};

const ini = n => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap');
@keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes fade-up { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin    { to{transform:rotate(360deg)} }
* { box-sizing:border-box; }
.cp  { font-family:'Figtree',system-ui,sans-serif; color:${C.t1}; }
.cp-btn { border:none; outline:none; cursor:pointer; font-family:inherit; transition:opacity .15s,transform .15s; }
.cp-btn:hover  { opacity:.82; }
.cp-btn:active { transform:scale(.96); }
.cp-hover { transition:background .12s; border-radius:10px; }
.cp-hover:hover { background:rgba(255,255,255,0.025)!important; }
.cp-in { animation:fade-up .3s ease both; }
.tcp-btn { border:none; outline:none; cursor:pointer; transition:all .15s; }
.tcp-btn:active { transform:scale(0.95)!important; }
.tcp-input { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:10px 13px; font-size:13px; color:#f1f5f9; outline:none; font-family:inherit; width:100%; box-sizing:border-box; transition:border-color .15s; }
.tcp-input:focus { border-color:${C.accentBrd}; }
.tcp-input::placeholder { color:${C.t4}; }
.tcp-textarea { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:10px 13px; font-size:13px; color:#f1f5f9; outline:none; font-family:inherit; width:100%; box-sizing:border-box; resize:none; transition:border-color .15s; line-height:1.65; }
.tcp-textarea:focus { border-color:${C.accentBrd}; }
.tcp-toggle { transition:background .2s; }
.avatar-wrap:hover .avatar-overlay { opacity:1!important; }
`;

// ─── Shared atoms ─────────────────────────────────────────────────────────────

/** Uppercase section label — matches Overview's 10.5px / .13em pattern */
function SLabel({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em' }}>{children}</span>
      {hint && <span title={hint} style={{ cursor: 'help' }}><Info style={{ width: 10, height: 10, color: C.t4 }} /></span>}
    </div>
  );
}

/** Card shell — identical border/shadow/radius to Overview cards */
function CardShell({ children, style = {}, leftAccent }) {
  return (
    <div style={{
      borderRadius: CARD_RADIUS, background: C.surface,
      border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW,
      overflow: 'hidden',
      ...(leftAccent ? { borderLeft: `3px solid ${leftAccent}` } : {}),
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Card header row — matches Overview SectionHeader */
function CardHeader({ label, sub, action, onAction, icon: Icon, iconColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${C.divider}` }}>
      {Icon && (
        <div style={{ width: 26, height: 26, borderRadius: 7, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 12, height: 12, color: iconColor || C.t3 }} />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.13em', textTransform: 'uppercase' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>{sub}</div>}
      </div>
      {action && onAction && (
        <button className="cp-btn" onClick={onAction}
          style={{ fontSize: 11, fontWeight: 600, color: C.accent, background: C.accentSub, border: `1px solid ${C.accentBrd}`, borderRadius: 8, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
          {action} <ChevronRight style={{ width: 10, height: 10 }} />
        </button>
      )}
    </div>
  );
}

/** Signal — 3px left border is the ONLY color; surface stays neutral */
function Signal({ color, icon: Icon, title, detail, action, onAction, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onAction} onMouseEnter={() => onAction && setHov(true)} onMouseLeave={() => onAction && setHov(false)}
      style={{
        padding: '10px 12px', borderRadius: 10,
        background: hov && onAction ? C.surfaceEl : C.surface,
        border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`,
        marginBottom: last ? 0 : 6,
        cursor: onAction ? 'pointer' : 'default', transition: 'background .15s',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Icon style={{ width: 12, height: 12, color, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, marginBottom: 2, lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</div>
        </div>
        {action && <span style={{ fontSize: 10, fontWeight: 600, color, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2, marginTop: 1, whiteSpace: 'nowrap' }}>{action} <ChevronRight style={{ width: 9, height: 9 }} /></span>}
      </div>
    </div>
  );
}

/** Stat row — matches Overview StatRow exactly */
function StatRow({ label, value, valueColor, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: last ? 'none' : `1px solid ${C.divider}` }}>
      <span style={{ fontSize: 11, color: C.t2 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor || C.t1 }}>{value}</span>
    </div>
  );
}

/** Progress bar — neutral fill, danger only below threshold */
function ProgressBar({ pct }) {
  const color = pct >= 70 ? C.success : pct >= 45 ? C.accent : C.danger;
  return (
    <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, transition: 'width 0.5s' }} />
    </div>
  );
}

/** Avatar */
function Avatar({ name, src, size = 36, color = C.accent }) {
  const initials = ini(name);
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `${color}18`, border: `1.5px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 700, color, flexShrink: 0, letterSpacing: '-.02em', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

/** Mini action button */
function ActionBtn({ icon: Ic, label, onClick, color, primary }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 20px', borderRadius: 10,
        fontSize: 12, fontWeight: 700,
        background: primary ? C.accent : hov ? C.surfaceEl : 'rgba(255,255,255,0.05)',
        border: primary ? 'none' : `1px solid ${hov ? C.borderEl : C.border}`,
        color: primary ? '#fff' : hov ? C.t1 : C.t2,
        boxShadow: primary ? '0 4px 18px rgba(59,130,246,0.3)' : 'none',
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
      }}>
      {Ic && <Ic style={{ width: 12, height: 12 }} />} {label}
    </button>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function Section({ label, icon: Icon, iconColor, children, action, onAction }) {
  return (
    <CardShell className="cp-in">
      <CardHeader label={label} icon={Icon} iconColor={iconColor} action={action} onAction={onAction} />
      <div style={{ padding: 18 }}>{children}</div>
    </CardShell>
  );
}

// ─── KPI stat card (matching Overview's KpiCard exactly) ─────────────────────
function KpiCard({ label, value, sub, subColor, warn, icon: Icon }) {
  return (
    <div style={{
      borderRadius: CARD_RADIUS, padding: '16px 18px',
      background: C.surface, border: `1px solid ${C.border}`,
      boxShadow: CARD_SHADOW,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.13em', textTransform: 'uppercase' }}>{label}</span>
        {Icon && (
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 11, height: 11, color: C.t3 }} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: warn ? C.danger : C.t1, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: sub ? 6 : 0 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: subColor || C.t3, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
}

// ─── Retention risk ring ──────────────────────────────────────────────────────
function RiskRing({ score }) {
  const color = score >= 70 ? C.danger : score >= 40 ? C.warn : C.success;
  const r = 34, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={80} height={80} viewBox="0 0 80 80" style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
      <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform="rotate(-90 40 40)" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill={color} fontSize={18} fontWeight={700} fontFamily="Figtree,inherit">{score}</text>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ClientProfile({ client: cl = EMPTY_CLIENT, onMessage, onBook, onAssign, selectedGym, currentUser, clientCheckIns = [], clientBookings = [], clientWorkouts = [] }) {
  const [tlExpanded, setTlExpanded] = useState(false);
  const [expandWork, setExpandWork] = useState(null);
  const [toastMsg,   setToastMsg]   = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const sectionRefs = useRef({});
  const queryClient = useQueryClient();

  const { data: coachRecords = [] } = useQuery({
    queryKey: ['myCoachProfile', currentUser?.email, selectedGym?.id],
    queryFn: async () => {
      let results = [];
      try { results = await base44.entities.Coach.filter({ user_email: currentUser.email, gym_id: selectedGym.id }); } catch {}
      if (!results.length) {
        try {
          const all = await base44.entities.Coach.filter({ gym_id: selectedGym.id });
          results = all.filter(c => c.user_email === currentUser?.email || c.user_id === currentUser?.id || c.name === currentUser?.full_name);
        } catch {}
      }
      return results;
    },
    enabled: !!currentUser?.email && !!selectedGym?.id,
    staleTime: 2 * 60 * 1000,
  });
  const coach = coachRecords[0] || null;

  useEffect(() => { if (coach && !dirty) setDraft({ ...coach }); }, [coach]);

  const updateMutation = useMutation({
    mutationFn: data => base44.entities.Coach.update(data.id, data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['myCoachProfile'] }); toast.success('Profile saved ✓'); setDirty(false); },
    onError:    () => toast.error('Failed to save'),
  });
  const createMutation = useMutation({
    mutationFn: data => base44.entities.Coach.create(data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['myCoachProfile'] }); toast.success('Profile created ✓'); setDirty(false); },
    onError:    () => toast.error('Failed to create profile'),
  });

  const patch = (field, value) => { setDraft(d => ({ ...d, [field]: value })); setDirty(true); };
  const handleSave = () => {
    if (draft?.id) updateMutation.mutate(draft);
    else createMutation.mutate({ ...draft, gym_id: selectedGym?.id, user_email: currentUser?.email, user_id: currentUser?.id, name: draft?.name || currentUser?.full_name });
  };
  const handleDiscard = () => { setDraft(coach ? { ...coach } : null); setDirty(false); };
  const handleAvatarUpload = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); const { file_url } = await base44.integrations.Core.UploadFile({ file }); patch('avatar_url', file_url); setUploading(false);
  };
  const handleHeroUpload = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setHeroUploading(true); const { file_url } = await base44.integrations.Core.UploadFile({ file }); patch('image_url', file_url); setHeroUploading(false);
  };
  const openEditor = () => { if (!draft && coach) setDraft({ ...coach }); setEditorOpen(true); };

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
  // Build timeline from real bookings
  const TIMELINE = useMemo(() => clientBookings.slice(0, 10).map((b, i) => {
    const type = b.status === 'attended' ? 'attended' : b.status === 'no_show' ? 'no_show' : b.status === 'cancelled' ? 'cancelled' : 'attended';
    const minsAgo = b.session_date ? Math.floor((Date.now() - new Date(b.session_date)) / 60000) : null;
    const timeStr = minsAgo === null ? 'Unknown' : minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago` : `${Math.floor(minsAgo / 1440)}d ago`;
    return { id: i, type, label: type === 'attended' ? 'Session attended' : type === 'no_show' ? 'No-show' : 'Session cancelled', sub: b.session_name || 'Session', time: timeStr };
  }), [clientBookings]);

  // Build insights from real data
  const INSIGHTS = useMemo(() => {
    const items = [];
    const now_ = Date.now();
    const lastCI = clientCheckIns.length > 0 ? clientCheckIns.sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0] : null;
    const daysAgo = lastCI ? Math.floor((now_ - new Date(lastCI.check_in_date)) / 86400000) : null;
    if (daysAgo !== null && daysAgo >= 7) items.push({ id: 1, severity: 'high', title: `No visit in ${daysAgo} days`, body: 'Member is inactive — a personal check-in is recommended.', action: 'Send message', key: 'message' });
    const noShows = clientBookings.filter(b => b.status === 'no_show').length;
    if (noShows >= 2) items.push({ id: 2, severity: 'high', title: `${noShows} no-shows`, body: 'Multiple missed sessions. Consider rescheduling or checking in.', action: 'Send message', key: 'message' });
    if (!cl.next_session) items.push({ id: 3, severity: 'medium', title: 'No upcoming sessions booked', body: 'Client has no scheduled sessions.', action: 'Book session', key: 'book' });
    return items;
  }, [clientCheckIns, clientBookings, cl]);

  // Past sessions from real bookings
  const PAST_SESSIONS = useMemo(() => clientBookings.slice(0, 7).map(b => ({
    date: b.session_date ? new Date(b.session_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '—',
    time: b.session_date ? new Date(b.session_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—',
    status: b.status === 'attended' ? 'attended' : b.status === 'no_show' ? 'no_show' : 'cancelled',
    duration: b.status === 'attended' ? '60 min' : null,
  })), [clientBookings]);

  // Weekly visits from check-ins (last 5 weeks)
  const WEEKLY = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const wEnd = new Date(Date.now() - i * 7 * 86400000);
    const wStart = new Date(+wEnd - 7 * 86400000);
    const count = clientCheckIns.filter(c => { const d = new Date(c.check_in_date); return d >= wStart && d < wEnd; }).length;
    return { week: `W${5 - i}`, v: count };
  }).reverse(), [clientCheckIns]);

  // Workouts from real assigned workout data
  const WORKOUTS = useMemo(() => clientWorkouts.map(w => {
    const ex = w.workout_data?.exercises || [];
    const pct = w.is_activated ? 100 : 0;
    return { name: w.workout_data?.name || 'Workout', completed: w.is_activated ? ex.length : 0, total: ex.length || 1, pct, last: w.assigned_date ? new Date(w.assigned_date).toLocaleDateString() : '—', flag: !w.is_activated };
  }), [clientWorkouts]);

  const tlShow = tlExpanded ? TIMELINE : TIMELINE.slice(0, 4);

  return (
    <div className="cp" style={{ background: C.bg, minHeight: '100vh' }}>
      <style>{CSS}</style>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: C.surface, border: `1px solid ${C.borderEl}`, borderRadius: 11, padding: '9px 18px', fontSize: 12, fontWeight: 700, color: C.t1, boxShadow: '0 8px 32px rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <Check style={{ width: 12, height: 12, color: C.success }} /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO BANNER ───────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <div style={{ height: 110, position: 'relative', overflow: 'hidden', background: C.surface }}>
          {cl.hero_url
            ? <img src={cl.hero_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }} />
            : (
              <div style={{ position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(ellipse at 25% 60%,rgba(59,130,246,0.08) 0%,transparent 60%),radial-gradient(ellipse at 78% 35%,rgba(139,92,246,0.06) 0%,transparent 55%)',
              }} />
            )
          }
          {/* grid texture */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${C.divider} 1px,transparent 1px),linear-gradient(90deg,${C.divider} 1px,transparent 1px)`, backgroundSize: '32px 32px' }} />
          {/* bottom fade */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${C.bg} 100%)` }} />
        </div>

        {/* Centered avatar — overlapping hero */}
        <div style={{ position: 'absolute', bottom: -48, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: `${C.accent}22`, border: `3px solid ${C.bg}`, outline: `1px solid ${C.borderEl}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, color: C.accent, overflow: 'hidden', boxShadow: '0 8px 36px rgba(0,0,0,0.65)', flexShrink: 0 }}>
            {cl.avatar_url
              ? <img src={cl.avatar_url} alt={cl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : ini(cl.name)
            }
          </div>
          {/* status dot */}
          <div style={{ position: 'absolute', bottom: 6, right: 6, width: 14, height: 14, borderRadius: '50%', background: st.color, border: `2.5px solid ${C.bg}`, animation: cl.retention_status === 'at_risk' ? 'blink 1.8s ease-in-out infinite' : 'none' }} />
        </div>
      </div>

      {/* ── IDENTITY ──────────────────────────────────────────── */}
      <div style={{ paddingTop: 58, paddingBottom: 22, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 5 }}>{cl.name}</div>
        <div style={{ fontSize: 13, color: C.t2, fontWeight: 500, marginBottom: 16 }}>{cl.goal}</div>

        {/* Status badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Retention status — left-border badge style */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, background: `${st.color}10`, border: `1px solid ${st.color}28`, fontSize: 12, fontWeight: 700, color: st.color }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.color, display: 'block', animation: cl.retention_status === 'at_risk' ? 'blink 1.8s ease-in-out infinite' : 'none' }} />
            {st.label}
          </span>
          {/* Trend */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, background: `${tr.color}10`, border: `1px solid ${tr.color}28`, fontSize: 12, fontWeight: 700, color: tr.color }}>
            <TrI style={{ width: 11, height: 11 }} /> {tr.label}
          </span>
          {/* Tags */}
          {cl.tags.map(t => (
            <span key={t} style={{ padding: '4px 11px', borderRadius: 99, background: C.accentSub, border: `1px solid ${C.accentBrd}`, fontSize: 11, fontWeight: 700, color: C.accent }}>{t}</span>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <ActionBtn icon={MessageSquare} label="Message Client" onClick={() => act('Message Client', 'message')} />
          <ActionBtn icon={Calendar}     label="Book Session"   onClick={() => act('Book Session', 'book')} primary />
          <ActionBtn icon={Dumbbell}     label="Assign Workout" onClick={() => act('Assign Workout', 'assign')} />
          <ActionBtn icon={Edit2}        label="Edit Profile"   onClick={openEditor} />
        </div>
      </div>

      {/* ── KPI CARDS ROW ─────────────────────────────────────── */}
      <div style={{ padding: '0 28px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard label="Last Visit"    value={cl.last_visit}                   warn={cl.retention_status === 'at_risk'} icon={Clock}    sub={cl.retention_status === 'at_risk' ? 'At risk threshold' : undefined} subColor={C.danger} />
          <KpiCard label="Visits / Week" value={`${cl.visits_per_week}×`}        warn={cl.visits_per_week < 2}            icon={Activity} sub="last 4 weeks" />
          <KpiCard label="Completion"    value={`${cl.completion_pct}%`}         warn={cl.completion_pct < 50}            icon={Dumbbell} sub="assigned workouts" />
          <KpiCard label="Next Session"  value={cl.next_session || 'Not booked'} warn={!cl.next_session}                  icon={Calendar} sub={!cl.next_session ? 'Needs booking' : undefined} subColor={C.danger} />
        </div>
      </div>

      {/* ── BODY GRID ─────────────────────────────────────────── */}
      <div style={{ padding: '0 28px 80px', display: 'grid', gridTemplateColumns: '1fr 276px', gap: 14, alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Critical Insights */}
          {INSIGHTS.length > 0 && (
            <CardShell className="cp-in" style={{ border: `1px solid ${C.dangerBrd}` }}>
              <CardHeader label="Critical Insights" icon={AlertTriangle} iconColor={C.danger}
                sub={`${INSIGHTS.length} active issues requiring attention`}
              />
              <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {INSIGHTS.map((ins, i) => (
                  <Signal
                    key={ins.id}
                    color={ins.severity === 'high' ? C.danger : C.warn}
                    icon={ins.severity === 'high' ? AlertTriangle : AlertCircle}
                    title={ins.title}
                    detail={ins.body}
                    action={ins.action}
                    onAction={() => act(ins.action, ins.key)}
                    last={i === INSIGHTS.length - 1}
                  />
                ))}
              </div>
            </CardShell>
          )}

          {/* Timeline */}
          <Section label="Engagement Timeline" icon={Activity}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tlShow.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: TL_COLOR[item.type] || C.t4, marginTop: 9, flexShrink: 0 }} />
                    {i < tlShow.length - 1 && <div style={{ width: 1, flex: 1, background: C.divider, minHeight: 16, margin: '3px 0' }} />}
                  </div>
                  <div className="cp-hover" style={{ flex: 1, padding: '7px 10px', marginBottom: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{item.label}</span>
                      <span style={{ fontSize: 11, color: C.t4, fontWeight: 500, marginLeft: 12, flexShrink: 0 }}>{item.time}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>{item.sub}</div>
                  </div>
                </div>
              ))}
              {TIMELINE.length > 4 && (
                <button className="cp-btn" onClick={() => setTlExpanded(e => !e)}
                  style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: C.t2, background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 9, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%' }}>
                  {tlExpanded
                    ? <><ChevronUp style={{ width: 12, height: 12 }} /> Show less</>
                    : <><ChevronDown style={{ width: 12, height: 12 }} /> {TIMELINE.length - 4} more events</>
                  }
                </button>
              )}
            </div>
          </Section>

          {/* Schedule & Attendance */}
          <Section label="Schedule & Attendance" icon={Calendar} action="Book Session" onAction={() => act('Book session', 'book')}>
            <SLabel>Upcoming</SLabel>
            {/* No upcoming — Signal style */}
            <div style={{ marginBottom: 20 }}>
              <Signal
                color={C.danger}
                icon={AlertCircle}
                title="No upcoming sessions booked"
                detail="Client has no scheduled sessions this week."
                action="Book Now"
                onAction={() => act('Book session', 'book')}
              />
            </div>

            <SLabel>Last 7 Sessions</SLabel>
            <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
              {PAST_SESSIONS.map((s, i) => {
                const color = s.status === 'attended' ? C.success : s.status === 'no_show' ? C.danger : C.warn;
                return (
                  <div key={i} title={`${s.date} — ${S_STATUS[s.status]?.label}`}
                    style={{ flex: 1, height: 28, borderRadius: 7, background: `${color}10`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
              {[{ color: C.success, label: 'Attended' }, { color: C.danger, label: 'No-show' }, { color: C.warn, label: 'Cancelled' }].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: 10, color: C.t3, fontWeight: 500 }}>{label}</span>
                </div>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: C.danger, fontWeight: 700 }}>No-show rate: {cl.no_show_rate}%</span>
            </div>

            <div style={{ height: 1, background: C.divider, margin: '4px 0 18px' }} />
            <SLabel>Past Sessions</SLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {PAST_SESSIONS.map((s, i) => (
                <div key={i} className="cp-hover" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.t1, flex: 1 }}>{s.date}</span>
                  <span style={{ fontSize: 11, color: C.t3 }}>{s.time}</span>
                  {s.duration && <span style={{ fontSize: 11, color: C.t4 }}>{s.duration}</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, color: S_STATUS[s.status]?.color, minWidth: 68, textAlign: 'right' }}>{S_STATUS[s.status]?.label}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Workout Engagement */}
          <Section label="Workout Engagement" icon={Dumbbell} action="Assign Workout" onAction={() => act('Assign workout', 'assign')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WORKOUTS.map((w, i) => (
                <CardShell key={i} style={{ border: `1px solid ${C.border}` }}>
                  <div className="cp-hover" onClick={() => setExpandWork(expandWork === i ? null : i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer', borderRadius: 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                      <ProgressBar pct={w.pct} />
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 14 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: w.pct < 45 ? C.danger : C.t1, letterSpacing: '-0.03em', lineHeight: 1 }}>{w.pct}%</div>
                      <div style={{ fontSize: 10, color: C.t3, marginTop: 3, fontWeight: 500 }}>{w.completed}/{w.total}</div>
                    </div>
                    {expandWork === i
                      ? <ChevronUp style={{ width: 12, height: 12, color: C.t4, flexShrink: 0 }} />
                      : <ChevronDown style={{ width: 12, height: 12, color: C.t4, flexShrink: 0 }} />
                    }
                  </div>
                  <AnimatePresence>
                    {expandWork === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                        style={{ overflow: 'hidden', borderTop: `1px solid ${C.divider}` }}>
                        <div style={{ padding: '11px 14px', display: 'flex', gap: 20, alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>Last activity</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>{w.last}</div>
                          </div>
                          {w.flag && (
                            <Signal color={C.danger} icon={AlertCircle} title="Low engagement" detail="Below expected completion rate" last />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardShell>
              ))}
            </div>
          </Section>

          {/* Consistency Trend */}
          <Section label="Consistency Trend" icon={BarChart2}>
            <SLabel>Weekly Visits — Last 5 Weeks</SLabel>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 66, marginBottom: 18 }}>
              {WEEKLY.map((w, i) => {
                const pct   = Math.max((w.v / 4) * 100, 4);
                const color = w.v === 0 ? C.danger : w.v < 2 ? C.warn : C.accent;
                const isLast = i === WEEKLY.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color, lineHeight: 1 }}>{w.v}</div>
                    <div style={{ width: '100%', borderRadius: 4, background: color, opacity: isLast ? 0.9 : 0.3, height: `${pct}%`, minHeight: 4 }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: C.t4 }}>{w.week}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Avg Freq',  value: `${cl.visits_per_week}×/wk`, warn: cl.visits_per_week < 2 },
                { label: 'Streak',    value: `${cl.streak} days`,          warn: cl.streak === 0 },
                { label: 'Trend',     value: cl.trend === 'improving' ? 'Improving' : cl.trend === 'declining' ? 'Declining' : 'Stable', warn: cl.trend === 'declining' },
              ].map(({ label, value, warn }) => (
                <div key={label} style={{ padding: '12px 13px', borderRadius: 11, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: warn ? C.danger : C.t1, letterSpacing: '-0.02em' }}>{value}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Interaction History */}
          <Section label="Interaction History" icon={MessageSquare} action="Send Message" onAction={() => act('Message', 'message')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Last Visit',        value: cl.last_visit || '—',                                                        sub: 'Most recent check-in',  warn: cl.retention_status === 'at_risk' },
                { label: 'Total Check-ins',   value: clientCheckIns.length,                                                        sub: 'All time',              warn: false },
                { label: 'Booked Sessions',   value: clientBookings.filter(b => b.status === 'confirmed').length,                   sub: 'Upcoming',              warn: false },
                { label: 'Completion',        value: `${cl.completion_pct}%`,                                                      sub: 'Assigned workouts',     warn: cl.completion_pct < 50 },
              ].map(({ label, value, sub, warn }) => (
                <div key={label} style={{ padding: '12px 13px', borderRadius: 11, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: warn ? C.danger : C.t1, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 3 }}>{value}</div>
                  <div style={{ fontSize: 11, color: C.t3, fontWeight: 500 }}>{sub}</div>
                </div>
              ))}
            </div>
            {cl.retention_status !== 'healthy' && (
              <Signal
                color={C.warn}
                icon={AlertCircle}
                title={cl.retention_status === 'at_risk' ? 'Client needs outreach' : 'Check in with this client'}
                detail="A proactive check-in could significantly help prevent churn."
                action="Send message"
                onAction={() => act('Message', 'message')}
                last
              />
            )}
          </Section>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 58 }}>

          {/* Client Info */}
          <CardShell>
            <CardHeader label="Client Info" icon={User} />
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { icon: Mail,   v: cl.email },
                { icon: Phone,  v: cl.phone },
                { icon: MapPin, v: cl.location },
                { icon: User,   v: `Since ${cl.joined}` },
                { icon: Target, v: cl.goal },
              ].map(({ icon: Ic, v }) => (
                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic style={{ width: 10, height: 10, color: C.t4 }} />
                  </div>
                  <span style={{ fontSize: 12, color: C.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                </div>
              ))}
            </div>
          </CardShell>

          {/* Snapshot */}
          <CardShell>
            <CardHeader label="Snapshot" icon={BarChart2} />
            <div style={{ padding: '4px 16px 12px' }}>
              <StatRow label="Total Sessions"  value={cl.total_sessions} />
              <StatRow label="No-show Rate"    value={`${cl.no_show_rate}%`}   valueColor={cl.no_show_rate > 15 ? C.danger : C.t1} />
              <StatRow label="Completion"      value={`${cl.completion_pct}%`} valueColor={cl.completion_pct < 50 ? C.danger : C.t1} />
              <StatRow label="Visits / Week"   value={`${cl.visits_per_week}×`} valueColor={cl.visits_per_week < 2 ? C.danger : C.t1} last />
            </div>
          </CardShell>

          {/* Retention Risk */}
          <CardShell style={{ border: `1px solid ${C.dangerBrd}` }}>
            <CardHeader label="Retention Risk" icon={AlertTriangle} iconColor={C.danger} />
            <div style={{ padding: '18px 16px' }}>
              {(() => {
                const riskScore = cl.retention_status === 'at_risk' ? 78 : cl.retention_status === 'needs_attention' ? 45 : 20;
                const riskLabel = riskScore >= 70 ? 'High Risk Score' : riskScore >= 40 ? 'Moderate Risk' : 'Low Risk';
                const riskColor = riskScore >= 70 ? C.danger : riskScore >= 40 ? C.warn : C.success;
                const riskFactors = [
                  cl.retention_status === 'at_risk' && { label: 'Attendance concern', sev: 'high' },
                  cl.completion_pct < 50 && { label: 'Low completion', sev: 'high' },
                  !cl.next_session && { label: 'No upcoming session', sev: 'med' },
                  cl.visits_per_week < 2 && { label: 'Low visit frequency', sev: 'med' },
                ].filter(Boolean);
                return (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <RiskRing score={riskScore} />
                      <div style={{ fontSize: 10, fontWeight: 700, color: riskColor, marginTop: 6, textTransform: 'uppercase', letterSpacing: '.07em' }}>{riskLabel}</div>
                    </div>
                    <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ height: '100%', width: `${riskScore}%`, borderRadius: 99, background: `linear-gradient(90deg,${C.warn},${C.danger})` }} />
                    </div>
                  </>
                );
              })()}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  cl.retention_status === 'at_risk' && { label: 'Attendance concern', sev: 'high' },
                  cl.completion_pct < 50 && { label: 'Low completion', sev: 'high' },
                  !cl.next_session && { label: 'No upcoming session', sev: 'med' },
                  cl.visits_per_week < 2 && { label: 'Low visit frequency', sev: 'med' },
                ].filter(Boolean).map(({ label, sev }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: C.t2 }}>{label}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      color: sev === 'high' ? C.danger : C.warn,
                      background: sev === 'high' ? C.dangerSub : C.warnSub,
                      border: `1px solid ${sev === 'high' ? C.dangerBrd : C.warnBrd}`,
                      borderRadius: 99, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '.07em',
                    }}>{sev}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardShell>

          {/* Quick Actions */}
          <CardShell>
            <CardHeader label="Quick Actions" icon={Zap} />
            <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { label: 'Send check-in message', key: 'message', icon: MessageSquare },
                { label: 'Book next session',      key: 'book',    icon: Calendar      },
                { label: 'Reassign workout',       key: 'assign',  icon: Dumbbell      },
              ].map(({ label, key, icon: Ic }) => {
                const [h, setH] = useState(false);
                return (
                  <button key={key} onClick={() => act(label, key)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, background: h ? C.surfaceEl : 'rgba(255,255,255,0.025)', border: `1px solid ${h ? C.borderEl : C.border}`, fontSize: 12, fontWeight: 600, color: h ? C.t1 : C.t2, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 7, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ic style={{ width: 11, height: 11, color: C.t3 }} />
                    </div>
                    {label}
                    <ChevronRight style={{ width: 10, height: 10, marginLeft: 'auto', color: C.t4 }} />
                  </button>
                );
              })}
            </div>
          </CardShell>
        </div>
      </div>

      {/* ── COACH PROFILE EDITOR OVERLAY ──────────────────────── */}
      {editorOpen && draft && (
        <ProfileEditorOverlay
          selectedGym={selectedGym}
          currentUser={currentUser}
          onClose={() => setEditorOpen(false)}
          draft={draft}
          dirty={dirty}
          handleSave={handleSave}
          handleDiscard={handleDiscard}
          uploading={uploading}
          heroUploading={heroUploading}
          handleAvatarUpload={handleAvatarUpload}
          handleHeroUpload={handleHeroUpload}
          updateMutation={updateMutation}
          createMutation={createMutation}
          showPreviewModal={showPreviewModal}
          setShowPreviewModal={setShowPreviewModal}
          sectionRefs={sectionRefs}
          patch={patch}
        />
      )}
      <CoachProfileModal coach={draft} open={showPreviewModal} onClose={() => setShowPreviewModal(false)} />
    </div>
  );
}

// ─── Missing Zap import shim (used in Quick Actions) ─────────────────────────
function Zap({ style }) { return <Activity style={style} />; }

// ─── Coach Profile Editor Overlay ─────────────────────────────────────────────
const SPECIALTIES_OPTIONS = ['Strength Training','Weight Loss','Muscle Gain','Cardio','HIIT','Yoga','Boxing','Rehabilitation','Nutrition','Powerlifting','CrossFit','Flexibility','Sports Performance','Senior Fitness','Pre/Post Natal','Body Recomposition','Mobility','Mindfulness'];
const CERT_SUGGESTIONS    = ['NASM CPT','ACE CPT','ISSA CPT','REPS Level 3','CrossFit L1','Precision Nutrition L1','Precision Nutrition L2','First Aid / CPR','Sports Massage','Kettlebell Specialist','FMS Specialist','ISSA Strength & Conditioning'];
const LANGUAGES_OPTIONS   = ['English','Spanish','French','German','Portuguese','Mandarin','Arabic','Hindi'];
const DAYS_ED      = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const TIME_SLOTS_ED = ['6:00 AM','7:00 AM','7:30 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM'];
const iniEd = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// Editor sub-atoms (token-aligned) ───────────────────────────────────────────
function EdLabel({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em' }}>{children}</span>
      {hint && <span title={hint} style={{ cursor: 'help' }}><Info style={{ width: 10, height: 10, color: C.t4 }} /></span>}
    </div>
  );
}

function EdField({ label, value, onChange, multiline, type = 'text', placeholder, hint, rows = 3 }) {
  return (
    <div>
      <EdLabel hint={hint}>{label}</EdLabel>
      {multiline
        ? <textarea className="tcp-textarea" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
        : <input className="tcp-input" type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      }
    </div>
  );
}

function EdToggle({ label, sub, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 12, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      <div onClick={() => onChange(!value)} className="tcp-toggle"
        style={{ width: 44, height: 26, borderRadius: 13, background: value ? C.accent : 'rgba(255,255,255,0.12)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .22s cubic-bezier(0.34,1.4,0.64,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  );
}

function EdTagPicker({ label, items = [], suggestions = [], onAdd, onRemove, color, hint }) {
  const [adding, setAdding] = useState(false);
  const [val, setVal] = useState('');
  const tc = color || C.purple;
  const add = v => { const t = v.trim(); if (t && !items.includes(t)) onAdd(t); setVal(''); setAdding(false); };
  const remaining = suggestions.filter(s => !items.includes(s));
  return (
    <div>
      <EdLabel hint={hint}>{label}</EdLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map(item => (
          <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: `${tc}12`, border: `1px solid ${tc}28`, color: tc }}>
            {item}
            <button onClick={() => onRemove(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: tc, opacity: 0.6, lineHeight: 1, display: 'flex' }}><X style={{ width: 10, height: 10 }} /></button>
          </span>
        ))}
        {adding ? (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(val); if (e.key === 'Escape') { setAdding(false); setVal(''); } }} autoFocus placeholder="Type & Enter"
              style={{ fontSize: 12, background: C.surfaceEl, border: `1px solid ${tc}35`, borderRadius: 99, padding: '5px 12px', color: C.t1, outline: 'none', width: 130, fontFamily: 'inherit' }} />
            <button onClick={() => add(val)} className="tcp-btn" style={{ fontSize: 11, fontWeight: 700, color: tc, background: `${tc}12`, border: `1px solid ${tc}25`, borderRadius: 99, padding: '5px 12px' }}>Add</button>
            <button onClick={() => setAdding(false)} className="tcp-btn" style={{ fontSize: 11, color: C.t3, background: 'none', border: 'none', padding: '5px 6px' }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="tcp-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: C.surfaceEl, border: `1px dashed ${C.border}`, color: C.t3 }}>
            <Plus style={{ width: 10, height: 10 }} /> Add
          </button>
        )}
      </div>
      {adding && remaining.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 9 }}>
          {remaining.slice(0, 10).map(s => (
            <button key={s} onClick={() => add(s)} className="tcp-btn" style={{ fontSize: 11, fontWeight: 500, color: C.t2, background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 99, padding: '4px 10px' }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function EdSectionCard({ title, icon: Icon, iconColor, children }) {
  return (
    <div style={{ borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${C.divider}` }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${iconColor || C.accent}14`, border: `1px solid ${iconColor || C.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 14, height: 14, color: iconColor || C.accent }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.t1, letterSpacing: '-0.01em' }}>{title}</span>
      </div>
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}

function AchievementAdder({ onAdd }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ display: 'flex', gap: 7 }}>
      <input className="tcp-input" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal(''); } }} placeholder="e.g. Helped 120+ clients lose 10 kg+" style={{ flex: 1 }} />
      <button onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }} className="tcp-btn"
        style={{ padding: '0 14px', borderRadius: 10, background: C.warnSub, border: `1px solid ${C.warnBrd}`, color: C.warn, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>+ Add</button>
    </div>
  );
}

function SlotAdder({ onAdd }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('7:00 AM');
  const [spots, setSpots] = useState('5');
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
      <div style={{ flex: 2 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Date</div>
        <input className="tcp-input" value={date} onChange={e => setDate(e.target.value)} placeholder="e.g. Tomorrow" style={{ padding: '8px 10px', fontSize: 12 }} />
      </div>
      <div style={{ flex: 2 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Time</div>
        <select value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, background: C.surfaceEl, border: `1px solid ${C.border}`, color: C.t1, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}>
          {TIME_SLOTS_ED.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Spots</div>
        <input className="tcp-input" type="number" value={spots} onChange={e => setSpots(e.target.value)} style={{ padding: '8px 10px', fontSize: 12 }} />
      </div>
      <button onClick={() => { if (date) { onAdd({ date, time, spots: parseInt(spots) || 1, day: '' }); setDate(''); setSpots('5'); } }} className="tcp-btn"
        style={{ height: 36, padding: '0 14px', borderRadius: 10, background: C.accentSub, border: `1px solid ${C.accentBrd}`, color: C.accent, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>+ Add</button>
    </div>
  );
}

function ProfileEditorOverlay({ selectedGym, currentUser, onClose, draft, dirty, handleSave, handleDiscard, uploading, heroUploading, handleAvatarUpload, handleHeroUpload, updateMutation, createMutation, showPreviewModal, setShowPreviewModal, sectionRefs, patch }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: C.bg, overflowY: 'auto', fontFamily: 'Figtree,system-ui,sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '14px 0', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} className="tcp-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: C.t2, background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px' }}>
            <X style={{ width: 13, height: 13 }} /> Close
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            {draft?.avatar_url
              ? <img src={draft.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${C.accentBrd}` }} />
              : <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.accentSub, border: `1.5px solid ${C.accentBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.accent }}>{iniEd(draft?.name)}</div>
            }
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em' }}>{draft?.name || 'Coach Profile'}</div>
              <div style={{ fontSize: 11, color: C.t3 }}>{selectedGym?.name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {dirty && <span style={{ fontSize: 11, fontWeight: 700, color: C.warn, display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: C.warn }} /> Unsaved</span>}
            {dirty && <button onClick={handleDiscard} className="tcp-btn" style={{ fontSize: 12, fontWeight: 600, color: C.t2, background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px' }}>Discard</button>}
            <button onClick={() => setShowPreviewModal(true)} className="tcp-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: C.accent, background: C.accentSub, border: `1px solid ${C.accentBrd}`, borderRadius: 10, padding: '8px 14px' }}>
              <Eye style={{ width: 13, height: 13 }} /> Preview
            </button>
            <button onClick={handleSave} disabled={!dirty || updateMutation.isPending || createMutation.isPending} className="tcp-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#fff', background: dirty ? C.accent : C.surfaceEl, border: dirty ? 'none' : `1px solid ${C.border}`, borderRadius: 10, padding: '8px 18px', opacity: dirty ? 1 : 0.4, boxShadow: dirty ? '0 4px 16px rgba(59,130,246,0.35)' : 'none', cursor: dirty ? 'pointer' : 'default' }}>
              {(updateMutation.isPending || createMutation.isPending) ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 13, height: 13 }} />}
              Save Changes
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: C.t1 }}>

            {/* Identity */}
            <EdSectionCard title="Identity" icon={Camera} iconColor={C.accent}>
              {/* Hero upload */}
              <div>
                <EdLabel>Hero / Cover Photo</EdLabel>
                <div style={{ position: 'relative', height: 120, borderRadius: 12, overflow: 'hidden', background: C.surfaceEl, border: `1px dashed ${C.border}`, cursor: 'pointer' }}>
                  {draft.image_url && <img src={draft.image_url} alt="hero" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />}
                  <label style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: draft.image_url ? 'rgba(0,0,0,0.45)' : 'transparent' }}>
                    {heroUploading
                      ? <Loader2 style={{ width: 22, height: 22, color: C.t1, animation: 'spin 1s linear infinite' }} />
                      : <><Image style={{ width: 20, height: 20, color: C.t3 }} /><span style={{ fontSize: 11, fontWeight: 600, color: C.t3 }}>{draft.image_url ? 'Change photo' : 'Upload cover photo'}</span></>
                    }
                    <input type="file" accept="image/*" onChange={handleHeroUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
              {/* Avatar + name */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ flexShrink: 0, position: 'relative' }}>
                  <label className="avatar-wrap" style={{ cursor: 'pointer', display: 'block' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: C.accentSub, border: `2.5px solid ${C.accentBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: C.accent, position: 'relative' }}>
                      {draft.avatar_url ? <img src={draft.avatar_url} alt={draft.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniEd(draft.name)}
                      <div className="avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .15s' }}>
                        {uploading ? <Loader2 style={{ width: 18, height: 18, color: '#fff', animation: 'spin 1s linear infinite' }} /> : <Camera style={{ width: 18, height: 18, color: '#fff' }} />}
                      </div>
                    </div>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                  </label>
                  <div style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: C.success, border: `2px solid ${C.bg}` }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <EdField label="Display Name" value={draft.name} onChange={v => patch('name', v)} placeholder="Your full name" />
                  <EdField label="Professional Title" value={draft.title} onChange={v => patch('title', v)} placeholder="e.g. Elite Performance Coach" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <EdField label="Location" value={draft.location} onChange={v => patch('location', v)} placeholder="City, Country" />
                <EdField label="Member Since" value={draft.member_since} onChange={v => patch('member_since', v)} placeholder="2020" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <EdField label="Years Experience" value={draft.experience_years?.toString()} onChange={v => patch('experience_years', parseInt(v) || 0)} type="number" placeholder="e.g. 11" />
                <EdField label="Total Clients" value={draft.total_clients?.toString()} onChange={v => patch('total_clients', parseInt(v) || 0)} type="number" placeholder="e.g. 840" />
                <EdField label="Rating (out of 5)" value={draft.rating?.toString()} onChange={v => patch('rating', parseFloat(v) || null)} type="number" placeholder="e.g. 4.9" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <EdField label="Next Available" value={draft.next_available} onChange={v => patch('next_available', v)} placeholder="Tomorrow · 7:00 AM" />
                <EdField label="Response Time" value={draft.response_time} onChange={v => patch('response_time', v)} placeholder="< 1 hr" />
              </div>
              <EdTagPicker label="Languages" items={draft.languages || []} suggestions={LANGUAGES_OPTIONS} color={C.success}
                onAdd={v => patch('languages', [...(draft.languages || []), v])}
                onRemove={v => patch('languages', (draft.languages || []).filter(l => l !== v))} />
            </EdSectionCard>

            {/* Bio */}
            <EdSectionCard title="Bio & Philosophy" icon={Edit2} iconColor={C.purple}>
              <EdField label="Bio" value={draft.bio} onChange={v => patch('bio', v)} multiline rows={3} placeholder="Tell members who you are and what you do…" />
              <EdField label="Training Philosophy" value={draft.philosophy} onChange={v => patch('philosophy', v)} multiline rows={4} placeholder="Describe your coaching philosophy…" />
              <EdTagPicker label="Specialties" items={draft.specialties || []} suggestions={SPECIALTIES_OPTIONS} color={C.purple}
                onAdd={v => patch('specialties', [...(draft.specialties || []), v])}
                onRemove={v => patch('specialties', (draft.specialties || []).filter(s => s !== v))} />
            </EdSectionCard>

            {/* Credentials */}
            <EdSectionCard title="Credentials & Certifications" icon={Award} iconColor={C.warn}>
              <EdTagPicker label="Certifications" items={draft.certifications || []} suggestions={CERT_SUGGESTIONS} color={C.accent}
                onAdd={v => patch('certifications', [...(draft.certifications || []), v])}
                onRemove={v => patch('certifications', (draft.certifications || []).filter(c => c !== v))} />
              <div>
                <EdLabel hint="Trophy items shown on your about tab">Client Achievements</EdLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {(draft.achievements || []).map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderRadius: 11, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
                      <Trophy style={{ width: 13, height: 13, color: C.warn, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: C.t2 }}>{a}</span>
                      <button onClick={() => patch('achievements', (draft.achievements || []).filter((_, j) => j !== i))} className="tcp-btn" style={{ color: C.t4, background: 'none', border: 'none', padding: 2 }}><X style={{ width: 13, height: 13 }} /></button>
                    </div>
                  ))}
                  <AchievementAdder onAdd={v => patch('achievements', [...(draft.achievements || []), v])} />
                </div>
              </div>
            </EdSectionCard>

            {/* Trust */}
            <EdSectionCard title="Trust & Verification" icon={BadgeCheck} iconColor={C.success}>
              <div>
                <EdLabel>Verification Status</EdLabel>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { key: 'id',           icon: ScanFace,       label: 'ID Verified' },
                    { key: 'certifications', icon: BadgeCheck,   label: 'Certs Verified' },
                    { key: 'background',   icon: ClipboardCheck, label: 'Background Checked' },
                  ].map(({ key, icon: Ic, label }) => {
                    const on = (draft.verification || {})[key];
                    return (
                      <button key={key} onClick={() => patch('verification', { ...(draft.verification || {}), [key]: !on })} className="tcp-btn"
                        style={{ flex: 1, padding: '10px 6px', borderRadius: 12, background: on ? C.successSub : C.surfaceEl, border: `1px solid ${on ? C.successBrd : C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <Ic style={{ width: 16, height: 16, color: on ? C.success : C.t4 }} />
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: on ? C.success : C.t4, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: on ? C.success : C.t4, opacity: 0.7 }}>{on ? '✓ Active' : '✗ Off'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </EdSectionCard>

            {/* Availability */}
            <EdSectionCard title="Availability" icon={Calendar} iconColor={C.accent}>
              <div>
                <EdLabel hint="Show members when you're available each week">Weekly Schedule</EdLabel>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                  {DAYS_ED.map((day, di) => {
                    const existing = draft.weekly_schedule || [];
                    const entry = existing.find(d => d.day === day) || { day, slots: [] };
                    const slots = entry.slots || [];
                    const toggle = slot => {
                      const newSlots = slots.includes(slot) ? slots.filter(s => s !== slot) : [...slots, slot];
                      patch('weekly_schedule', [...existing.filter(d => d.day !== day), { day, slots: newSlots }]);
                    };
                    return (
                      <div key={day} style={{ padding: '10px 14px', borderBottom: di < DAYS_ED.length - 1 ? `1px solid ${C.divider}` : 'none', background: slots.length ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 32, fontSize: 10, fontWeight: 700, color: slots.length ? C.accent : C.t4, letterSpacing: '.08em', flexShrink: 0 }}>{day}</span>
                          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', flex: 1 }}>
                            {TIME_SLOTS_ED.map(slot => (
                              <button key={slot} onClick={() => toggle(slot)} className="tcp-btn"
                                style={{ flexShrink: 0, fontSize: 10, fontWeight: 600, padding: '4px 9px', borderRadius: 99, border: `1px solid ${slots.includes(slot) ? C.accentBrd : C.border}`, background: slots.includes(slot) ? C.accentSub : C.surfaceEl, color: slots.includes(slot) ? C.accent : C.t4 }}>
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                        {slots.length === 0 && <span style={{ fontSize: 10, color: C.t4, fontStyle: 'italic', paddingLeft: 42 }}>Rest day</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <EdLabel>Next Available Slots</EdLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {(draft.availability_slots || []).map((sl, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderRadius: 11, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
                      <Clock style={{ width: 13, height: 13, color: C.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, flex: 1 }}>{sl.date} · {sl.time}</span>
                      <span style={{ fontSize: 11, color: C.success, fontWeight: 700 }}>{sl.spots} spots</span>
                      <button onClick={() => patch('availability_slots', (draft.availability_slots || []).filter((_, j) => j !== i))} className="tcp-btn" style={{ color: C.t4, background: 'none', border: 'none', padding: 2 }}><X style={{ width: 13, height: 13 }} /></button>
                    </div>
                  ))}
                  <SlotAdder onAdd={sl => patch('availability_slots', [...(draft.availability_slots || []), sl])} />
                </div>
              </div>
            </EdSectionCard>

            {/* Packages */}
            <EdSectionCard title="Session Packages" icon={Package} iconColor={C.warn}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(draft.packages || []).map((pkg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 13, background: pkg.popular ? C.accentSub : C.surfaceEl, border: `1px solid ${pkg.popular ? C.accentBrd : C.border}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '60px 80px 1fr auto', gap: 8, flex: 1, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Sessions</div>
                        <input className="tcp-input" type="number" value={pkg.sessions} onChange={e => { const p = [...draft.packages]; p[i] = { ...p[i], sessions: parseInt(e.target.value) || 1 }; patch('packages', p); }} style={{ padding: '6px 9px', fontSize: 13 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Price £</div>
                        <input className="tcp-input" type="number" value={pkg.price} onChange={e => { const p = [...draft.packages]; p[i] = { ...p[i], price: parseInt(e.target.value) || 0 }; patch('packages', p); }} style={{ padding: '6px 9px', fontSize: 13 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Discount</div>
                        <input className="tcp-input" value={pkg.discount || ''} onChange={e => { const p = [...draft.packages]; p[i] = { ...p[i], discount: e.target.value }; patch('packages', p); }} placeholder="e.g. Save 10%" style={{ padding: '6px 9px', fontSize: 13 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.08em' }}>Popular</div>
                        <div onClick={() => { const p = draft.packages.map((x, j) => ({ ...x, popular: j === i ? !x.popular : false })); patch('packages', p); }}
                          className="tcp-toggle" style={{ width: 36, height: 20, borderRadius: 10, background: pkg.popular ? C.accent : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }}>
                          <div style={{ position: 'absolute', top: 2, left: pkg.popular ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => patch('packages', (draft.packages || []).filter((_, j) => j !== i))} className="tcp-btn" style={{ color: C.t4, background: 'none', border: 'none', padding: 4, flexShrink: 0 }}><Trash2 style={{ width: 14, height: 14 }} /></button>
                  </div>
                ))}
                <button onClick={() => patch('packages', [...(draft.packages || []), { sessions: 5, price: 400, popular: false, discount: '' }])} className="tcp-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', borderRadius: 12, border: `1px dashed ${C.border}`, background: C.surfaceEl, color: C.t3, fontSize: 12, fontWeight: 600 }}>
                  <Plus style={{ width: 13, height: 13 }} /> Add Package
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <EdField label="Single Session Price (£)" value={draft.price_per_session?.toString()} onChange={v => patch('price_per_session', parseInt(v) || null)} type="number" placeholder="85" />
                <EdField label="Sessions Completed" value={draft.sessions_completed?.toString()} onChange={v => patch('sessions_completed', parseInt(v) || 0)} type="number" placeholder="3200" />
              </div>
            </EdSectionCard>

            {/* Settings */}
            <EdSectionCard title="Settings & Visibility" icon={Shield} iconColor={C.purple}>
              <EdToggle label="Offer Free Consultation" sub="Show a 'Free Consult' CTA button on your profile" value={!!draft.free_consultation} onChange={v => patch('free_consultation', v)} />
              <EdToggle label="Show Coach Match Score" sub="Display personalised % match badge on your card" value={!!draft.match_score} onChange={v => { if (!v) patch('match_score', null); }} />
              <div style={{ padding: '12px 14px', borderRadius: 12, background: C.warnSub, border: `1px solid ${C.warnBrd}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <AlertCircleIcon style={{ width: 14, height: 14, color: C.warn, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.warn, marginBottom: 3 }}>Booking Policy</div>
                  <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.6 }}>Cancellation and refund policies are set by the gym owner. Contact <span style={{ color: C.accent }}>{selectedGym?.name}</span> to update these.</div>
                </div>
              </div>
            </EdSectionCard>

            <div style={{ height: 40 }} />
          </div>

          {/* Live preview sidebar */}
          <div style={{ position: 'sticky', top: 80, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em' }}>Profile Preview</div>
            <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: C.t1, marginBottom: 4, fontSize: 14 }}>{draft.name || 'Your Name'}</div>
              <div style={{ color: C.accent, fontSize: 11, marginBottom: 8 }}>{draft.title || 'Personal Coach'}</div>
              {draft.bio && <div style={{ fontSize: 11, color: C.t3, marginBottom: 8 }}>{draft.bio.slice(0, 100)}{draft.bio.length > 100 ? '…' : ''}</div>}
              {(draft.specialties || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {draft.specialties.slice(0, 4).map((s, i) => (
                    <span key={i} style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: i === 0 ? C.accent : C.surfaceEl, border: `1px solid ${i === 0 ? C.accentBrd : C.border}`, color: i === 0 ? '#fff' : C.t3 }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowPreviewModal(true)} className="tcp-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, background: C.surfaceEl, border: `1px solid ${C.border}`, color: C.accent, fontSize: 12, fontWeight: 600 }}>
              <Eye style={{ width: 12, height: 12 }} /> View Full Preview
            </button>
          </div>
        </div>
      </div>
      <CoachProfileModal coach={draft} open={showPreviewModal} onClose={() => setShowPreviewModal(false)} />
    </div>
  );
}