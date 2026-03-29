import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Calendar, Dumbbell, AlertTriangle, AlertCircle,
  CheckCircle, XCircle, TrendingDown, TrendingUp, Minus,
  ChevronRight, ChevronDown, ChevronUp, Activity, BarChart2,
  User, Phone, Mail, MapPin, ArrowUpRight, Target, Check,
  BookOpen, RefreshCw, Edit2,
  Star, Plus, X, GraduationCap, Award,
  Loader2, Eye, Camera, Save, Clock,
  Trophy, Shield, BadgeCheck, ScanFace, ClipboardCheck,
  AlertCircle as AlertCircleIcon, Package, Image, Trash2, Info, Languages,
} from 'lucide-react';
import { toast } from 'sonner';
import CoachProfileModal from '@/components/gym/CoachProfileModal';

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
export default function ClientProfile({ client: cl = CLIENT, onMessage, onBook, onAssign, selectedGym, currentUser }) {
  const [tlExpanded, setTlExpanded]   = useState(false);
  const [expandWork, setExpandWork]   = useState(null);
  const [toastMsg, setToastMsg]       = useState(null);
  const [editorOpen, setEditorOpen]   = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [draft, setDraft]             = useState(null);
  const [dirty, setDirty]             = useState(false);
  const [uploading, setUploading]     = useState(false);
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['myCoachProfile'] }); toast.success('Profile saved ✓'); setDirty(false); },
    onError: () => toast.error('Failed to save'),
  });
  const createMutation = useMutation({
    mutationFn: data => base44.entities.Coach.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['myCoachProfile'] }); toast.success('Profile created ✓'); setDirty(false); },
    onError: () => toast.error('Failed to create profile'),
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

  const openEditor = () => {
    if (!draft && coach) setDraft({ ...coach });
    setEditorOpen(true);
  };

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

     


      {/* ── HERO ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        {/* Banner */}
        <div style={{ height: 100, position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#0d1828 0%,#060a14 100%)' }}>
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
      <div style={{ paddingTop: 54, paddingBottom: 20, textAlign: 'center' }}>
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
          <button className="cp-btn" onClick={openEditor}
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

      {/* ── COACH PROFILE EDITOR OVERLAY ──────────────────────── */}
      {editorOpen && draft && (
        <ProfileEditorOverlay
          selectedGym={selectedGym}
          currentUser={currentUser}
          onClose={() => setEditorOpen(false)}
          draft={draft}
          dirty={dirty}
          setDirty={setDirty}
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

/* ─── Coach Profile Editor Overlay (from old TabCoachProfile) ── */
const BLUE_ED   = '#2563eb';
const BLUE_LT_ED = '#60a5fa';
const BG_ED     = '#060810';
const SURFACE_ED = '#0c1128';
const MUTE_ED   = 'rgba(255,255,255,0.25)';
const SUB_ED    = 'rgba(255,255,255,0.45)';
const LABEL_ED  = 'rgba(255,255,255,0.28)';

const SPECIALTIES_OPTIONS = ['Strength Training','Weight Loss','Muscle Gain','Cardio','HIIT','Yoga','Boxing','Rehabilitation','Nutrition','Powerlifting','CrossFit','Flexibility','Sports Performance','Senior Fitness','Pre/Post Natal','Body Recomposition','Mobility','Mindfulness'];
const CERT_SUGGESTIONS    = ['NASM CPT','ACE CPT','ISSA CPT','REPS Level 3','CrossFit L1','Precision Nutrition L1','Precision Nutrition L2','First Aid / CPR','Sports Massage','Kettlebell Specialist','FMS Specialist','ISSA Strength & Conditioning'];
const LANGUAGES_OPTIONS   = ['English','Spanish','French','German','Portuguese','Mandarin','Arabic','Hindi'];
const DAYS_ED      = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const TIME_SLOTS_ED = ['6:00 AM','7:00 AM','7:30 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM'];
const iniEd = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const ED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap');
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes cpm-pulse{0%,100%{opacity:1}50%{opacity:.35}}
.tcp-root{font-family:'Figtree',system-ui,sans-serif;color:#f0f4f8}
.tcp-btn{border:none;outline:none;cursor:pointer;transition:all .15s}
.tcp-btn:active{transform:scale(0.95)!important}
.tcp-input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:10px;padding:10px 13px;font-size:13px;color:#f0f4f8;outline:none;font-family:inherit;width:100%;box-sizing:border-box;transition:border-color .15s}
.tcp-input:focus{border-color:#2563eb88}
.tcp-input::placeholder{color:rgba(255,255,255,0.25)}
.tcp-textarea{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:10px;padding:10px 13px;font-size:13px;color:#f0f4f8;outline:none;font-family:inherit;width:100%;box-sizing:border-box;resize:none;transition:border-color .15s;line-height:1.65}
.tcp-textarea:focus{border-color:#2563eb88}
.avatar-wrap:hover .avatar-overlay{opacity:1!important}
.tcp-toggle{transition:background .2s}
`;

function EdSLabel({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, color: LABEL_ED, textTransform: 'uppercase', letterSpacing: '.13em' }}>{children}</span>
      {hint && <span title={hint} style={{ cursor: 'help' }}><Info style={{ width: 11, height: 11, color: MUTE_ED }} /></span>}
    </div>
  );
}

function EdField({ label, value, onChange, multiline, type = 'text', placeholder, hint, rows = 3 }) {
  return (
    <div>
      <EdSLabel hint={hint}>{label}</EdSLabel>
      {multiline
        ? <textarea className="tcp-textarea" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
        : <input className="tcp-input" type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      }
    </div>
  );
}

function EdToggle({ label, sub, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: SUB_ED, marginTop: 2 }}>{sub}</div>}
      </div>
      <div onClick={() => onChange(!value)} className="tcp-toggle"
        style={{ width: 44, height: 26, borderRadius: 13, background: value ? BLUE_ED : 'rgba(255,255,255,0.12)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .22s cubic-bezier(0.34,1.4,0.64,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  );
}

function EdTagPicker({ label, items = [], suggestions = [], onAdd, onRemove, color = '#a78bfa', hint }) {
  const [adding, setAdding] = useState(false);
  const [val, setVal] = useState('');
  const add = v => { const t = v.trim(); if (t && !items.includes(t)) onAdd(t); setVal(''); setAdding(false); };
  const remaining = suggestions.filter(s => !items.includes(s));
  return (
    <div>
      <EdSLabel hint={hint}>{label}</EdSLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map(item => (
          <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: `${color}14`, border: `1px solid ${color}30`, color }}>
            {item}
            <button onClick={() => onRemove(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color, opacity: 0.6, lineHeight: 1, display: 'flex' }}><X style={{ width: 10, height: 10 }} /></button>
          </span>
        ))}
        {adding ? (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(val); if (e.key === 'Escape') { setAdding(false); setVal(''); } }} autoFocus placeholder="Type & Enter"
              style={{ fontSize: 12, background: 'rgba(255,255,255,0.06)', border: `1px solid ${color}40`, borderRadius: 99, padding: '5px 12px', color: '#f0f4f8', outline: 'none', width: 130, fontFamily: 'inherit' }} />
            <button onClick={() => add(val)} className="tcp-btn" style={{ fontSize: 11, fontWeight: 800, color, background: `${color}14`, border: `1px solid ${color}28`, borderRadius: 99, padding: '5px 12px' }}>Add</button>
            <button onClick={() => setAdding(false)} className="tcp-btn" style={{ fontSize: 11, color: MUTE_ED, background: 'none', border: 'none', padding: '5px 6px' }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="tcp-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', color: MUTE_ED }}>
            <Plus style={{ width: 10, height: 10 }} /> Add
          </button>
        )}
      </div>
      {adding && remaining.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 9 }}>
          {remaining.slice(0, 10).map(s => (
            <button key={s} onClick={() => add(s)} className="tcp-btn" style={{ fontSize: 11, fontWeight: 600, color: SUB_ED, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '4px 10px' }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function EdSectionCard({ title, icon: Icon, iconColor = BLUE_LT_ED, children }) {
  return (
    <div style={{ borderRadius: 16, background: SURFACE_ED, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${iconColor}18`, border: `1px solid ${iconColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 14, height: 14, color: iconColor }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{title}</span>
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
        style={{ padding: '0 14px', borderRadius: 10, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>+ Add</button>
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
        <div style={{ fontSize: 9.5, fontWeight: 700, color: MUTE_ED, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Date</div>
        <input className="tcp-input" value={date} onChange={e => setDate(e.target.value)} placeholder="e.g. Tomorrow" style={{ padding: '8px 10px', fontSize: 12 }} />
      </div>
      <div style={{ flex: 2 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: MUTE_ED, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Time</div>
        <select value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#f0f4f8', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}>
          {TIME_SLOTS_ED.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: MUTE_ED, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Spots</div>
        <input className="tcp-input" type="number" value={spots} onChange={e => setSpots(e.target.value)} style={{ padding: '8px 10px', fontSize: 12 }} />
      </div>
      <button onClick={() => { if (date) { onAdd({ date, time, spots: parseInt(spots) || 1, day: '' }); setDate(''); setSpots('5'); } }} className="tcp-btn"
        style={{ height: 36, padding: '0 14px', borderRadius: 10, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', color: BLUE_LT_ED, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>+ Add</button>
    </div>
  );
}

function ProfileEditorOverlay({ selectedGym, currentUser, onClose, draft, dirty, setDirty, handleSave, handleDiscard, uploading, heroUploading, handleAvatarUpload, handleHeroUpload, updateMutation, createMutation, showPreviewModal, setShowPreviewModal, sectionRefs, patch }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: BG_ED, overflowY: 'auto', fontFamily: 'Figtree,system-ui,sans-serif' }}>
      <style>{ED_CSS}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: BG_ED, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 0', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} className="tcp-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: MUTE_ED, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '8px 14px' }}>
            <X style={{ width: 13, height: 13 }} /> Close
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            {draft?.avatar_url
              ? <img src={draft.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(59,130,246,0.4)' }} />
              : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(37,99,235,0.6),rgba(37,99,235,0.3))', border: '1.5px solid rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: BLUE_LT_ED }}>{iniEd(draft?.name)}</div>
            }
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{draft?.name || 'Coach Profile'}</div>
              <div style={{ fontSize: 11, color: SUB_ED }}>{selectedGym?.name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {dirty && <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24' }} /> Unsaved</span>}
            {dirty && <button onClick={handleDiscard} className="tcp-btn" style={{ fontSize: 12, fontWeight: 700, color: MUTE_ED, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '8px 14px' }}>Discard</button>}
            <button onClick={() => setShowPreviewModal(true)} className="tcp-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: BLUE_LT_ED, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 10, padding: '8px 14px' }}>
              <Eye style={{ width: 13, height: 13 }} /> Preview
            </button>
            <button onClick={handleSave} disabled={!dirty || updateMutation.isPending || createMutation.isPending} className="tcp-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#fff', background: dirty ? `linear-gradient(135deg,${BLUE_ED},#1d4ed8)` : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: '8px 18px', opacity: dirty ? 1 : 0.4, boxShadow: dirty ? '0 4px 16px rgba(37,99,235,0.4)' : 'none', cursor: dirty ? 'pointer' : 'default' }}>
              {(updateMutation.isPending || createMutation.isPending) ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 13, height: 13 }} />}
              Save Changes
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
          <div className="tcp-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <EdSectionCard title="Identity" icon={Camera} iconColor="#38bdf8">
              <div>
                <EdSLabel>Hero / Cover Photo</EdSLabel>
                <div style={{ position: 'relative', height: 120, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', cursor: 'pointer' }}>
                  {draft.image_url && <img src={draft.image_url} alt="hero" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />}
                  <label style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: draft.image_url ? 'rgba(0,0,0,0.45)' : 'transparent' }}>
                    {heroUploading ? <Loader2 style={{ width: 22, height: 22, color: '#fff', animation: 'spin 1s linear infinite' }} /> : <><Image style={{ width: 20, height: 20, color: '#fff', opacity: 0.7 }} /><span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{draft.image_url ? 'Change photo' : 'Upload cover photo'}</span></>}
                    <input type="file" accept="image/*" onChange={handleHeroUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ flexShrink: 0, position: 'relative' }}>
                  <label className="avatar-wrap" style={{ cursor: 'pointer', display: 'block' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,rgba(37,99,235,0.7),rgba(37,99,235,0.4))', border: '2.5px solid rgba(59,130,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: BLUE_LT_ED, position: 'relative' }}>
                      {draft.avatar_url ? <img src={draft.avatar_url} alt={draft.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniEd(draft.name)}
                      <div className="avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .15s' }}>
                        {uploading ? <Loader2 style={{ width: 18, height: 18, color: '#fff', animation: 'spin 1s linear infinite' }} /> : <Camera style={{ width: 18, height: 18, color: '#fff' }} />}
                      </div>
                    </div>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                  </label>
                  <div style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: '#22c55e', border: '2px solid #060810' }} />
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
              <EdTagPicker label="Languages" items={draft.languages || []} suggestions={LANGUAGES_OPTIONS} color="#34d399"
                onAdd={v => patch('languages', [...(draft.languages || []), v])}
                onRemove={v => patch('languages', (draft.languages || []).filter(l => l !== v))} />
            </EdSectionCard>

            <EdSectionCard title="Bio & Philosophy" icon={Edit2} iconColor="#818cf8">
              <EdField label="Bio" value={draft.bio} onChange={v => patch('bio', v)} multiline rows={3} placeholder="Tell members who you are and what you do…" />
              <EdField label="Training Philosophy" value={draft.philosophy} onChange={v => patch('philosophy', v)} multiline rows={4} placeholder="Describe your coaching philosophy…" />
              <EdTagPicker label="Specialties" items={draft.specialties || []} suggestions={SPECIALTIES_OPTIONS} color="#a78bfa"
                onAdd={v => patch('specialties', [...(draft.specialties || []), v])}
                onRemove={v => patch('specialties', (draft.specialties || []).filter(s => s !== v))} />
            </EdSectionCard>

            <EdSectionCard title="Credentials & Certifications" icon={Award} iconColor="#fbbf24">
              <EdTagPicker label="Certifications" items={draft.certifications || []} suggestions={CERT_SUGGESTIONS} color="#38bdf8"
                onAdd={v => patch('certifications', [...(draft.certifications || []), v])}
                onRemove={v => patch('certifications', (draft.certifications || []).filter(c => c !== v))} />
              <div>
                <EdSLabel hint="Trophy items shown on your about tab">Client Achievements</EdSLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {(draft.achievements || []).map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <Trophy style={{ width: 13, height: 13, color: '#fbbf24', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{a}</span>
                      <button onClick={() => patch('achievements', (draft.achievements || []).filter((_, j) => j !== i))} className="tcp-btn" style={{ color: MUTE_ED, background: 'none', border: 'none', padding: 2 }}><X style={{ width: 13, height: 13 }} /></button>
                    </div>
                  ))}
                  <AchievementAdder onAdd={v => patch('achievements', [...(draft.achievements || []), v])} />
                </div>
              </div>
            </EdSectionCard>

            <EdSectionCard title="Trust & Verification" icon={BadgeCheck} iconColor="#34d399">
              <div>
                <EdSLabel>Verification Status</EdSLabel>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ key: 'id', icon: ScanFace, label: 'ID Verified' }, { key: 'certifications', icon: BadgeCheck, label: 'Certs Verified' }, { key: 'background', icon: ClipboardCheck, label: 'Background Checked' }].map(({ key, icon: Ic, label }) => {
                    const on = (draft.verification || {})[key];
                    return (
                      <button key={key} onClick={() => patch('verification', { ...(draft.verification || {}), [key]: !on })} className="tcp-btn"
                        style={{ flex: 1, padding: '10px 6px', borderRadius: 12, background: on ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <Ic style={{ width: 16, height: 16, color: on ? '#34d399' : MUTE_ED }} />
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: on ? '#34d399' : MUTE_ED, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: on ? '#34d399' : MUTE_ED, opacity: 0.7 }}>{on ? '✓ Active' : '✗ Off'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </EdSectionCard>

            <EdSectionCard title="Availability" icon={Calendar} iconColor="#38bdf8">
              <div>
                <EdSLabel hint="Show members when you're available each week">Weekly Schedule</EdSLabel>
                <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {DAYS_ED.map((day, di) => {
                    const existing = draft.weekly_schedule || [];
                    const entry = existing.find(d => d.day === day) || { day, slots: [] };
                    const slots = entry.slots || [];
                    const toggle = slot => {
                      const newSlots = slots.includes(slot) ? slots.filter(s => s !== slot) : [...slots, slot];
                      patch('weekly_schedule', [...existing.filter(d => d.day !== day), { day, slots: newSlots }]);
                    };
                    return (
                      <div key={day} style={{ padding: '10px 14px', borderBottom: di < DAYS_ED.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: slots.length ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 32, fontSize: 10, fontWeight: 800, color: slots.length ? BLUE_LT_ED : MUTE_ED, letterSpacing: '.08em', flexShrink: 0 }}>{day}</span>
                          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', flex: 1 }}>
                            {TIME_SLOTS_ED.map(slot => (
                              <button key={slot} onClick={() => toggle(slot)} className="tcp-btn"
                                style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 99, border: `1px solid ${slots.includes(slot) ? 'rgba(37,99,235,0.5)' : 'rgba(255,255,255,0.08)'}`, background: slots.includes(slot) ? 'rgba(37,99,235,0.18)' : 'rgba(255,255,255,0.03)', color: slots.includes(slot) ? BLUE_LT_ED : MUTE_ED }}>
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                        {slots.length === 0 && <span style={{ fontSize: 10, color: MUTE_ED, fontStyle: 'italic', paddingLeft: 42 }}>Rest day</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <EdSLabel>Next Available Slots</EdSLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {(draft.availability_slots || []).map((sl, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <Clock style={{ width: 13, height: 13, color: '#38bdf8', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', flex: 1 }}>{sl.date} · {sl.time}</span>
                      <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>{sl.spots} spots</span>
                      <button onClick={() => patch('availability_slots', (draft.availability_slots || []).filter((_, j) => j !== i))} className="tcp-btn" style={{ color: MUTE_ED, background: 'none', border: 'none', padding: 2 }}><X style={{ width: 13, height: 13 }} /></button>
                    </div>
                  ))}
                  <SlotAdder onAdd={sl => patch('availability_slots', [...(draft.availability_slots || []), sl])} />
                </div>
              </div>
            </EdSectionCard>

            <EdSectionCard title="Session Packages" icon={Package} iconColor="#fbbf24">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(draft.packages || []).map((pkg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 14, background: pkg.popular ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${pkg.popular ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '60px 80px 1fr auto', gap: 8, flex: 1, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: MUTE_ED, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Sessions</div>
                        <input className="tcp-input" type="number" value={pkg.sessions} onChange={e => { const p = [...draft.packages]; p[i] = { ...p[i], sessions: parseInt(e.target.value) || 1 }; patch('packages', p); }} style={{ padding: '6px 9px', fontSize: 13 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: MUTE_ED, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Price £</div>
                        <input className="tcp-input" type="number" value={pkg.price} onChange={e => { const p = [...draft.packages]; p[i] = { ...p[i], price: parseInt(e.target.value) || 0 }; patch('packages', p); }} style={{ padding: '6px 9px', fontSize: 13 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: MUTE_ED, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Discount</div>
                        <input className="tcp-input" value={pkg.discount || ''} onChange={e => { const p = [...draft.packages]; p[i] = { ...p[i], discount: e.target.value }; patch('packages', p); }} placeholder="e.g. Save 10%" style={{ padding: '6px 9px', fontSize: 13 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: MUTE_ED, textTransform: 'uppercase', letterSpacing: '.08em' }}>Popular</div>
                        <div onClick={() => { const p = draft.packages.map((x, j) => ({ ...x, popular: j === i ? !x.popular : false })); patch('packages', p); }}
                          className="tcp-toggle" style={{ width: 36, height: 20, borderRadius: 10, background: pkg.popular ? BLUE_ED : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }}>
                          <div style={{ position: 'absolute', top: 2, left: pkg.popular ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => patch('packages', (draft.packages || []).filter((_, j) => j !== i))} className="tcp-btn" style={{ color: MUTE_ED, background: 'none', border: 'none', padding: 4, flexShrink: 0 }}><Trash2 style={{ width: 14, height: 14 }} /></button>
                  </div>
                ))}
                <button onClick={() => patch('packages', [...(draft.packages || []), { sessions: 5, price: 400, popular: false, discount: '' }])} className="tcp-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', color: MUTE_ED, fontSize: 12, fontWeight: 700 }}>
                  <Plus style={{ width: 13, height: 13 }} /> Add Package
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <EdField label="Single Session Price (£)" value={draft.price_per_session?.toString()} onChange={v => patch('price_per_session', parseInt(v) || null)} type="number" placeholder="85" />
                <EdField label="Sessions Completed" value={draft.sessions_completed?.toString()} onChange={v => patch('sessions_completed', parseInt(v) || 0)} type="number" placeholder="3200" />
              </div>
            </EdSectionCard>

            <EdSectionCard title="Settings & Visibility" icon={Shield} iconColor="#c084fc">
              <EdToggle label="Offer Free Consultation" sub="Show a 'Free Consult' CTA button on your profile" value={!!draft.free_consultation} onChange={v => patch('free_consultation', v)} />
              <EdToggle label="Show Coach Match Score" sub="Display personalised % match badge on your card" value={!!draft.match_score} onChange={v => { if (!v) patch('match_score', null); }} />
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <AlertCircleIcon style={{ width: 14, height: 14, color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', marginBottom: 3 }}>Booking Policy</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Cancellation and refund policies are set by the gym owner. Contact <span style={{ color: BLUE_LT_ED }}>{selectedGym?.name}</span> to update these.</div>
                </div>
              </div>
            </EdSectionCard>

            <div style={{ height: 40 }} />
          </div>

          {/* Live preview sidebar */}
          <div style={{ position: 'sticky', top: 80, borderRadius: 14, background: SURFACE_ED, border: '1px solid rgba(255,255,255,0.07)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: LABEL_ED, textTransform: 'uppercase', letterSpacing: '.13em' }}>Profile Preview</div>
            <div style={{ fontSize: 12, color: SUB_ED, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>{draft.name || 'Your Name'}</div>
              <div style={{ color: BLUE_LT_ED, fontSize: 11, marginBottom: 8 }}>{draft.title || 'Personal Coach'}</div>
              {draft.bio && <div style={{ fontSize: 11, color: SUB_ED, marginBottom: 8 }}>{draft.bio.slice(0, 100)}{draft.bio.length > 100 ? '…' : ''}</div>}
              {(draft.specialties || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {draft.specialties.slice(0, 4).map((s, i) => (
                    <span key={i} style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: i === 0 ? BLUE_ED : 'rgba(255,255,255,0.05)', color: i === 0 ? '#fff' : SUB_ED }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowPreviewModal(true)} className="tcp-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: BLUE_LT_ED, fontSize: 12, fontWeight: 700 }}>
              <Eye style={{ width: 12, height: 12 }} /> View Full Preview
            </button>
          </div>
        </div>
      </div>
      <CoachProfileModal coach={draft} open={showPreviewModal} onClose={() => setShowPreviewModal(false)} />
    </div>
  );
}