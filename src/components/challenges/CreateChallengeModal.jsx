/**
 * CreateChallengeModal — Content Hub design system
 * Blue #60a5fa · DM Sans · #0d0d11 / #17171c / #1f1f26
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  X, Trophy, Users, Flame, Calendar, Gift,
  ChevronDown, CheckCircle, Zap, Target,
  Shield, Eye, BarChart2, Clock, ChevronLeft,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:        '#0d0d11',
  surface:   '#17171c',
  card:      '#1f1f26',
  inset:     '#13131a',
  brd:       '#252530',
  brd2:      '#2e2e3a',
  brdHover:  '#3a3a48',
  t1:        '#ffffff',
  t2:        '#9898a6',
  t3:        '#525260',
  blue:      '#60a5fa', blueDim:   'rgba(96,165,250,0.07)',  blueBrd:   'rgba(96,165,250,0.18)',
  red:    '#ff4d6d', redDim:    'rgba(255,77,109,0.08)',  redBrd:    'rgba(255,77,109,0.20)',
  amber:  '#f59e0b', amberDim:  'rgba(245,158,11,0.08)', amberBrd:  'rgba(245,158,11,0.20)',
  green:  '#22c55e', greenDim:  'rgba(34,197,94,0.08)',  greenBrd:  'rgba(34,197,94,0.20)',
  purple: '#a78bfa', purpleDim: 'rgba(167,139,250,0.08)',purpleBrd: 'rgba(167,139,250,0.20)',
};
const FONT = "'DM Sans','Inter',system-ui,sans-serif";
const MONO = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };

/* ─── DATA ───────────────────────────────────────────────────── */
const CATEGORIES = [
  { value: 'lifting',    label: 'Lifting',    color: C.purple, dim: C.purpleDim, border: C.purpleBrd, desc: 'Track weight lifted' },
  { value: 'attendance', label: 'Attendance', color: C.blue,   dim: C.blueDim,   border: C.blueBrd,   desc: 'Most check-ins wins' },
  { value: 'streak',     label: 'Streak',     color: C.amber,  dim: C.amberDim,  border: C.amberBrd,  desc: 'Longest consecutive days' },
  { value: 'cardio',     label: 'Cardio',     color: C.green,  dim: C.greenDim,  border: C.greenBrd,  desc: 'Distance or time tracked' },
];

const TYPES = [
  { value: 'individual', label: 'Individual', Icon: Target,  desc: 'Each member competes solo' },
  { value: 'team',       label: 'Team',       Icon: Users,   desc: 'Divided into competing teams' },
  { value: 'gym_vs_gym', label: 'Gym vs Gym', Icon: Shield,  desc: 'Two gyms go head to head' },
  { value: 'community',  label: 'Community',  Icon: Flame,   desc: 'Everyone works toward one goal' },
];

const EXERCISES = [
  'Bench Press','Squat','Deadlift','Overhead Press','Barbell Row',
  'Power Clean','Snatch','Front Squat','Romanian Deadlift','Pull-up',
];

const GOAL_TYPES = [
  { value: 'total_weight', label: 'Total Weight Lifted' },
  { value: 'total_reps',   label: 'Total Reps' },
  { value: 'max_weight',   label: 'Max Weight (1RM)' },
];

const catFor = val => CATEGORIES.find(c => c.value === val) || CATEGORIES[0];

const DEFAULT_FORM = {
  title: '', description: '', type: 'individual', category: 'lifting',
  gym_id: '', gym_name: '', competing_gym_id: '', competing_gym_name: '',
  exercise: 'Bench Press', goal_type: 'total_weight', target_value: 0,
  start_date: new Date().toISOString().split('T')[0], end_date: '',
  status: 'upcoming', reward: '', auto_start: true, send_reminders: true,
};

/* ─── MOBILE HOOK ────────────────────────────────────────────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

/* ─── SHARED INPUT STYLE ─────────────────────────────────────── */
const baseInp = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`,
  color: C.t1, fontSize: 12.5, fontWeight: 500, outline: 'none',
  fontFamily: FONT, transition: 'border-color 0.15s, background 0.15s', colorScheme: 'dark',
};

/* ─── SHARED PRIMITIVES ──────────────────────────────────────── */
function SL({ children, required, hint }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}{required && <span style={{ color: C.red }}>*</span>}
      </div>
      {hint && <div style={{ fontSize: 10, color: C.t3, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      {label && <SL required={required} hint={hint}>{label}</SL>}
      {children}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = 'text', Icon, accentColor = C.blue, min }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && (
        <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon size={12} color={focus ? accentColor : C.t3} style={{ transition: 'color 0.15s' }} />
        </div>
      )}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} min={min}
        onFocus={e => { setFocus(true); e.target.style.borderColor = `${accentColor}38`; e.target.style.background = C.inset; }}
        onBlur={e =>  { setFocus(false); e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
        style={{ ...baseInp, paddingLeft: Icon ? 32 : 12 }}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, accentColor = C.blue }) {
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={e => { e.target.style.borderColor = `${accentColor}38`; e.target.style.background = C.inset; }}
      onBlur={e =>  { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
      style={{ ...baseInp, resize: 'none', lineHeight: 1.7, padding: '11px 13px' }}
    />
  );
}

function Sel({ value, onChange, children, accentColor = C.blue }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value} onChange={onChange}
        onFocus={e => { e.target.style.borderColor = `${accentColor}38`; e.target.style.background = C.inset; }}
        onBlur={e =>  { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
        style={{ ...baseInp, appearance: 'none', paddingRight: 34, cursor: 'pointer' }}
      >
        {children}
      </select>
      <ChevronDown size={12} color={C.t3} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  );
}

/* ─── DESKTOP: CATEGORY TABS ─────────────────────────────────── */
function CategoryTabs({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.brd}`, marginLeft: -2 }}>
      {CATEGORIES.map(cat => {
        const active = value === cat.value;
        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            type="button"
            style={{
              padding: '8px 14px', background: 'none', border: 'none',
              borderBottom: active ? `2px solid ${cat.color}` : '2px solid transparent',
              color: active ? C.t1 : C.t2, fontSize: 12.5,
              fontWeight: active ? 700 : 500, cursor: 'pointer',
              fontFamily: FONT, whiteSpace: 'nowrap',
              transition: 'color 0.15s, border-color 0.15s',
              marginBottom: -1,
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.t1; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.t2; }}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── DESKTOP: TYPE PICKER ───────────────────────────────────── */
function TypePicker({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
      {TYPES.map(t => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            type="button"
            style={{
              padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
              border: `1px solid ${active ? C.blueBrd : C.brd}`,
              background: active ? C.blueDim : C.card,
              display: 'flex', alignItems: 'center', gap: 9,
              transition: 'all 0.15s', fontFamily: FONT, textAlign: 'left',
            }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 7, background: active ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? C.blueBrd : C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <t.Icon size={11} color={active ? C.blue : C.t3} style={{ transition: 'color 0.15s' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? C.t1 : C.t2 }}>{t.label}</div>
              <div style={{ fontSize: 9.5, color: C.t3, marginTop: 1 }}>{t.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── SHARED: TOGGLE ─────────────────────────────────────────── */
function Toggle({ checked, onChange, label, sub, color = C.blue }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, cursor: 'pointer', background: checked ? `${color}09` : C.card, border: `1px solid ${checked ? color + '28' : C.brd}`, transition: 'all 0.18s' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: checked ? C.t1 : C.t2 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0, width: 38, height: 21, borderRadius: 99, background: checked ? color : C.brd2, transition: 'background 0.2s', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 2.5, left: checked ? 19 : 2.5, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.6)' }} />
      </div>
    </div>
  );
}

/* ─── SHARED: CHALLENGE PREVIEW CARD ────────────────────────── */
function ChallengePreview({ form, gyms }) {
  const cat = catFor(form.category);
  const targetValue = form.target_value || 50;

  const durationDays = useMemo(() => {
    if (!form.start_date || !form.end_date) return null;
    try { return differenceInDays(parseISO(form.end_date), parseISO(form.start_date)); }
    catch { return null; }
  }, [form.start_date, form.end_date]);

  const hasContent = !!form.title;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Eye size={11} color={C.t3} />
        <span style={{ fontSize: 9.5, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
      </div>
      <div style={{ borderRadius: 12, overflow: 'hidden', background: C.card, border: `1px solid ${C.brd}` }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}44, transparent)`, transition: 'background 0.3s' }} />
        {!hasContent ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <Trophy size={22} color={`${cat.color}35`} style={{ margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: 11.5, color: C.t3, fontWeight: 500 }}>Fill in details to preview your challenge</div>
          </div>
        ) : (
          <div style={{ padding: '14px 15px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ flex: 1, paddingRight: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 5, background: cat.dim, border: `1px solid ${cat.border}`, fontSize: 9, fontWeight: 700, color: cat.color, marginBottom: 6 }}>
                  {cat.label}
                </span>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, lineHeight: 1.35 }}>{form.title}</div>
                {form.description && (
                  <div style={{ fontSize: 11, color: C.t2, marginTop: 4, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{form.description}</div>
                )}
              </div>
              <div style={{ width: 46, height: 46, borderRadius: 11, background: `linear-gradient(135deg,${cat.color},${cat.color}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${cat.color}40` }}>
                <Trophy size={22} color="#fff" />
              </div>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: C.brd, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ width: '0%', height: '100%', background: cat.color, borderRadius: 99 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 9.5, color: C.t3 }}>0 joined</span>
              <span style={{ fontSize: 9.5, color: C.t3 }}>Goal: {targetValue}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, background: C.surface, border: `1px solid ${cat.border}`, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: cat.dim, border: `1px solid ${cat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Gift size={14} color={cat.color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Challenge Reward</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: cat.color }}>{form.reward || 'Challenge Badge'}</div>
              </div>
            </div>
            {(form.start_date || form.end_date) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, background: C.surface, border: `1px solid ${C.brd}`, marginBottom: 10 }}>
                <Calendar size={10} color={C.t3} />
                <span style={{ fontSize: 10.5, color: C.t2 }}>
                  {form.start_date ? format(parseISO(form.start_date), 'MMM d') : '?'} → {form.end_date ? format(parseISO(form.end_date), 'MMM d') : '?'}
                </span>
                {durationDays != null && durationDays > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: 9.5, color: C.t3, fontWeight: 700, ...MONO }}>{durationDays}d</span>
                )}
              </div>
            )}
            {form.type === 'gym_vs_gym' && form.gym_id && form.competing_gym_id && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 9, background: C.surface, border: `1px solid ${C.brd}`, marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: C.t1 }}>{gyms.find(g => g.id === form.gym_id)?.name || 'Home Gym'}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: cat.color }}>VS</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: C.t1 }}>{gyms.find(g => g.id === form.competing_gym_id)?.name || 'Away Gym'}</span>
              </div>
            )}
            <div style={{ padding: '0 0 14px' }}>
              <div style={{ width: '100%', padding: '10px', borderRadius: 8, background: C.blue, color: '#fff', fontWeight: 700, fontSize: 13, textAlign: 'center', boxShadow: `0 4px 16px ${C.blue}35` }}>
                Join Challenge
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MOBILE-ONLY COMPONENTS
══════════════════════════════════════════════════════════════ */
function MobileTypePicker({ value, onChange, accentColor }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {TYPES.map(t => {
        const active = value === t.value;
        return (
          <button key={t.value} onClick={() => onChange(t.value)} type="button"
            style={{ padding: '14px 12px', borderRadius: 12, cursor: 'pointer', border: `1.5px solid ${active ? accentColor + '40' : C.brd}`, background: active ? `${accentColor}09` : C.card, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, transition: 'all 0.15s', fontFamily: FONT, textAlign: 'left', minHeight: 80 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: active ? `${accentColor}18` : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? accentColor + '38' : C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <t.Icon size={14} color={active ? accentColor : C.t3} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: active ? 700 : 600, color: active ? C.t1 : C.t2, marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontSize: 10.5, color: C.t3, lineHeight: 1.4 }}>{t.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MobileField({ label, required, hint, children }) {
  return (
    <div>
      {label && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em', display: 'flex', alignItems: 'center', gap: 4 }}>
            {label}{required && <span style={{ color: C.red }}>*</span>}
          </div>
          {hint && <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{hint}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function MobileInp({ value, onChange, placeholder, type = 'text', Icon, accentColor = C.blue, min }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && (
        <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon size={15} color={focus ? accentColor : C.t3} />
        </div>
      )}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} min={min}
        onFocus={e => { setFocus(true); e.target.style.borderColor = `${accentColor}40`; e.target.style.background = C.inset; }}
        onBlur={e =>  { setFocus(false); e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
        style={{ ...baseInp, paddingLeft: Icon ? 40 : 14, paddingTop: 13, paddingBottom: 13, fontSize: 14, borderRadius: 12, colorScheme: 'dark' }} />
    </div>
  );
}

function MobileTextarea({ value, onChange, placeholder, rows = 3, accentColor = C.blue }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={e => { e.target.style.borderColor = `${accentColor}40`; e.target.style.background = C.inset; }}
      onBlur={e =>  { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
      style={{ ...baseInp, resize: 'none', lineHeight: 1.7, padding: '13px 14px', fontSize: 14, borderRadius: 12 }} />
  );
}

function MobileSel({ value, onChange, children, accentColor = C.blue }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={onChange}
        onFocus={e => { e.target.style.borderColor = `${accentColor}40`; e.target.style.background = C.inset; }}
        onBlur={e =>  { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
        style={{ ...baseInp, appearance: 'none', paddingRight: 40, paddingTop: 13, paddingBottom: 13, fontSize: 14, borderRadius: 12, cursor: 'pointer' }}>
        {children}
      </select>
      <ChevronDown size={14} color={C.t3} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  );
}

function MobileToggle({ checked, onChange, label, sub, color = C.blue }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderRadius: 12, cursor: 'pointer', background: checked ? `${color}09` : C.card, border: `1.5px solid ${checked ? color + '30' : C.brd}`, transition: 'all 0.18s' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: checked ? C.t1 : C.t2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: C.t3, marginTop: 3 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0, width: 46, height: 26, borderRadius: 99, background: checked ? color : C.brd2, transition: 'background 0.2s', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.6)' }} />
      </div>
    </div>
  );
}

/* ── MOBILE: PREVIEW BOTTOM SHEET ────────────────────────────── */
function MobilePreviewSheet({ open, onClose, form, gyms }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(id);
    } else { setVisible(false); }
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 700, fontFamily: FONT }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: C.surface, borderRadius: '22px 22px 0 0', border: `1px solid ${C.brd}`, borderBottom: 'none', maxHeight: '88vh', display: 'flex', flexDirection: 'column', transform: `translateY(${visible ? '0' : '100%'})`, transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)' }}>
        <div style={{ padding: '14px 0 6px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.brd2 }} />
        </div>
        <div style={{ padding: '0 16px 10px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.t1 }}>Challenge Preview</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: C.card, border: `1px solid ${C.brd}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} color={C.t3} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <ChallengePreview form={form} gyms={gyms} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MOBILE MODAL
══════════════════════════════════════════════════════════════ */
function MobileCreateChallengeModal({ open, onClose, gyms = [], onSave, isLoading }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [previewOpen, setPreviewOpen] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cat     = catFor(form.category);
  const canSave = form.title.trim() && form.end_date && !isLoading;

  const handleCategoryChange = (val) => {
    const updates = { category: val };
    if (val === 'lifting')    updates.goal_type = 'total_weight';
    if (val === 'attendance') updates.goal_type = 'most_check_ins';
    if (val === 'streak')     updates.goal_type = 'longest_streak';
    setForm(f => ({ ...f, ...updates }));
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.end_date) { toast?.error('Please fill in title and end date'); return; }
    if (form.type === 'gym_vs_gym' && (!form.gym_id || !form.competing_gym_id)) { toast?.error('Please select both gyms'); return; }
    onSave(form);
    setForm(DEFAULT_FORM);
  };

  const handleClose = () => { setForm(DEFAULT_FORM); onClose(); };

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(id);
    } else { setVisible(false); }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes ch-spin { to { transform: rotate(360deg) } }
        .ch-mobile-scroll::-webkit-scrollbar { display: none }
        .ch-cats-scroll::-webkit-scrollbar { display: none }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column', transform: `translateY(${visible ? '0' : '100%'})`, transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)' }}>

        {/* ── HEADER ── */}
        <div style={{ flexShrink: 0, background: C.surface, borderBottom: `1px solid ${C.brd}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 12px' }}>
            <button onClick={handleClose} style={{ width: 38, height: 38, borderRadius: 10, background: C.card, border: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <ChevronLeft size={18} color={C.t2} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em' }}>
                Create <span style={{ color: cat.color }}>Challenge</span>
              </div>
            </div>
            <button onClick={() => setPreviewOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 9, background: C.blueDim, border: `1px solid ${C.blueBrd}`, color: C.blue, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
              <Eye size={13} /> Preview
            </button>
          </div>

          {/* Category chips */}
          <div className="ch-cats-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 14px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {CATEGORIES.map(c => {
              const active = form.category === c.value;
              return (
                <button key={c.value} onClick={() => handleCategoryChange(c.value)} type="button"
                  style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 24, background: active ? c.dim : C.card, border: `1.5px solid ${active ? c.border : C.brd}`, color: active ? c.color : C.t2, fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SCROLLABLE FORM ── */}
        <div className="ch-mobile-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          <MobileField label="Challenge Title" required>
            <MobileInp value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Squat Showdown" Icon={Trophy} accentColor={cat.color} />
          </MobileField>

          <MobileField label="Description">
            <MobileTextarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the rules, what counts, and who can enter…" rows={3} accentColor={cat.color} />
          </MobileField>

          <MobileField label="Competition Type">
            <MobileTypePicker value={form.type} onChange={v => set('type', v)} accentColor={cat.color} />
          </MobileField>

          {form.type === 'gym_vs_gym' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MobileField label="Home Gym" required>
                <MobileSel value={form.gym_id} onChange={e => { const g = gyms.find(x => x.id === e.target.value); set('gym_id', e.target.value); set('gym_name', g?.name || ''); }} accentColor={cat.color}>
                  <option value="" style={{ background: C.card }}>Select gym</option>
                  {gyms.map(g => <option key={g.id} value={g.id} style={{ background: C.card }}>{g.name}</option>)}
                </MobileSel>
              </MobileField>
              <MobileField label="vs. Gym" required>
                <MobileSel value={form.competing_gym_id} onChange={e => { const g = gyms.find(x => x.id === e.target.value); set('competing_gym_id', e.target.value); set('competing_gym_name', g?.name || ''); }} accentColor={cat.color}>
                  <option value="" style={{ background: C.card }}>Select gym</option>
                  {gyms.map(g => <option key={g.id} value={g.id} style={{ background: C.card }}>{g.name}</option>)}
                </MobileSel>
              </MobileField>
            </div>
          )}

          {form.category === 'lifting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MobileField label="Exercise">
                <MobileSel value={form.exercise} onChange={e => set('exercise', e.target.value)} accentColor={cat.color}>
                  {EXERCISES.map(ex => <option key={ex} value={ex} style={{ background: C.card }}>{ex}</option>)}
                </MobileSel>
              </MobileField>
              <MobileField label="Goal Type">
                <MobileSel value={form.goal_type} onChange={e => set('goal_type', e.target.value)} accentColor={cat.color}>
                  {GOAL_TYPES.map(g => <option key={g.value} value={g.value} style={{ background: C.card }}>{g.label}</option>)}
                </MobileSel>
              </MobileField>
            </div>
          )}

          {(form.category === 'attendance' || form.category === 'streak') && (
            <MobileField label={form.category === 'streak' ? 'Streak Target (days)' : 'Check-in Target'} hint={form.category === 'streak' ? 'Members aim to hit this consecutive streak' : 'Number of check-ins to win or qualify'}>
              <MobileInp type="number" value={form.target_value} onChange={e => set('target_value', parseInt(e.target.value) || 0)} placeholder={form.category === 'streak' ? '30' : '20'} Icon={Target} accentColor={cat.color} min="1" />
            </MobileField>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <MobileField label="Start Date" required>
              <MobileInp type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} Icon={Calendar} accentColor={cat.color} />
            </MobileField>
            <MobileField label="End Date" required>
              <MobileInp type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} Icon={Calendar} accentColor={cat.color} />
            </MobileField>
          </div>

          <MobileField label="Reward" hint="Optional — shown to members as the prize for winning">
            <MobileInp value={form.reward} onChange={e => set('reward', e.target.value)} placeholder="e.g. Free protein shake, £10 gift card" Icon={Gift} accentColor={cat.color} />
          </MobileField>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <MobileToggle checked={form.auto_start}     onChange={v => set('auto_start', v)}     color={cat.color} label="Auto-start"     sub="Begins on start date automatically" />
            <MobileToggle checked={form.send_reminders} onChange={v => set('send_reminders', v)} color={cat.color} label="Send reminders" sub="Notify participants weekly" />
          </div>

          <div style={{ height: 8 }} />
        </div>

        {/* ── STICKY FOOTER ── */}
        <div style={{ flexShrink: 0, padding: '14px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${C.brd}`, background: C.surface, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {canSave ? (
              <>
                <CheckCircle size={13} color={C.green} />
                <span style={{ fontSize: 12, color: C.t3, ...MONO }}>
                  {form.title}{form.end_date ? ` · ends ${format(parseISO(form.end_date), 'MMM d')}` : ''}{form.reward ? ` · ${form.reward}` : ''}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: C.t3 }}>
                {!form.title.trim() ? 'Add a challenge title to continue' : 'Set an end date to continue'}
              </span>
            )}
          </div>
          <button onClick={handleSubmit} disabled={!canSave} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', fontFamily: FONT, fontSize: 15, fontWeight: 800, background: canSave ? C.blue : C.brd2, color: canSave ? '#fff' : C.t3, cursor: canSave ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: canSave ? `0 0 28px ${C.blue}40` : 'none', opacity: canSave ? 1 : 0.45, transition: 'all 0.2s' }}>
            {isLoading
              ? <><div style={{ width: 14, height: 14, border: '2.5px solid rgba(255,255,255,0.25)', borderTop: '2.5px solid #fff', borderRadius: '50%', animation: 'ch-spin 0.7s linear infinite' }} /> Creating…</>
              : <><Zap size={16} /> Create Challenge</>}
          </button>
        </div>
      </div>

      <MobilePreviewSheet open={previewOpen} onClose={() => setPreviewOpen(false)} form={form} gyms={gyms} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   DESKTOP MODAL
══════════════════════════════════════════════════════════════ */
function DesktopCreateChallengeModal({ open, onClose, gyms = [], onSave, isLoading }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cat     = catFor(form.category);
  const canSave = form.title.trim() && form.end_date && !isLoading;

  const handleCategoryChange = (val) => {
    const updates = { category: val };
    if (val === 'lifting')    updates.goal_type = 'total_weight';
    if (val === 'attendance') updates.goal_type = 'most_check_ins';
    if (val === 'streak')     updates.goal_type = 'longest_streak';
    setForm(f => ({ ...f, ...updates }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!form.title.trim() || !form.end_date) { toast?.error('Please fill in title and end date'); return; }
    if (form.type === 'gym_vs_gym' && (!form.gym_id || !form.competing_gym_id)) { toast?.error('Please select both gyms'); return; }
    onSave(form);
    setForm(DEFAULT_FORM);
  };

  const handleClose = () => { setForm(DEFAULT_FORM); onClose(); };

  return (
    <>
      <style>{`
        @keyframes ch-spin { to { transform: rotate(360deg) } }
        @keyframes ch-fade  { from{opacity:0} to{opacity:1} }
        @keyframes ch-in    { from{opacity:0;transform:scale(0.975) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .ch-scroll::-webkit-scrollbar        { width: 3px }
        .ch-scroll::-webkit-scrollbar-track  { background: transparent }
        .ch-scroll::-webkit-scrollbar-thumb  { background: ${C.brd2}; border-radius: 2px }
        .ch-cancel { padding:9px 18px; border-radius:8px; background:transparent; border:1px solid ${C.brd}; color:${C.t2}; font-size:12.5px; font-weight:600; cursor:pointer; font-family:${FONT}; transition:all 0.15s; }
        .ch-cancel:hover { border-color:${C.brdHover}; color:${C.t1}; background:${C.card}; }
      `}</style>

      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={e => e.target === e.currentTarget && handleClose()}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT }}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 16, scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.975 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 1 }}
              style={{ width: '100%', maxWidth: 920, maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: C.bg, border: `1px solid ${C.brd}`, borderRadius: 14, overflow: 'hidden', boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(96,165,250,0.04)`, WebkitFontSmoothing: 'antialiased' }}
            >
              {/* HEADER */}
              <div style={{ flexShrink: 0, padding: '0 20px', background: C.surface, borderBottom: `1px solid ${C.brd}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: cat.dim, border: `1px solid ${cat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                      <Trophy size={14} color={cat.color} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                      Create Challenge
                    </div>
                  </div>
                  <button onClick={handleClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: C.t3, transition: 'color 0.15s', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.t1; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.t3; }}>
                    <X size={16} />
                  </button>
                </div>
                <div style={{ marginTop: 8, marginLeft: -2 }}>
                  <CategoryTabs value={form.category} onChange={handleCategoryChange} />
                </div>
              </div>

              {/* BODY */}
              <form onSubmit={handleSubmit} style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 0, overflow: 'hidden' }}>
                <div className="ch-scroll" style={{ padding: '18px 20px', borderRight: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto', background: C.bg }}>
                  <Field label="Challenge Title" required>
                    <Inp value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Squat Showdown" Icon={Trophy} accentColor={cat.color} />
                  </Field>
                  <Field label="Description">
                    <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the rules, what counts, and who can enter…" rows={3} accentColor={cat.color} />
                  </Field>
                  <Field label="Competition Type">
                    <TypePicker value={form.type} onChange={v => set('type', v)} />
                  </Field>
                  {form.type === 'gym_vs_gym' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Home Gym" required>
                        <Sel value={form.gym_id} onChange={e => { const g = gyms.find(x => x.id === e.target.value); set('gym_id', e.target.value); set('gym_name', g?.name || ''); }} accentColor={cat.color}>
                          <option value="" style={{ background: C.card }}>Select gym</option>
                          {gyms.map(g => <option key={g.id} value={g.id} style={{ background: C.card }}>{g.name}</option>)}
                        </Sel>
                      </Field>
                      <Field label="vs. Gym" required>
                        <Sel value={form.competing_gym_id} onChange={e => { const g = gyms.find(x => x.id === e.target.value); set('competing_gym_id', e.target.value); set('competing_gym_name', g?.name || ''); }} accentColor={cat.color}>
                          <option value="" style={{ background: C.card }}>Select gym</option>
                          {gyms.map(g => <option key={g.id} value={g.id} style={{ background: C.card }}>{g.name}</option>)}
                        </Sel>
                      </Field>
                    </div>
                  )}
                  {form.category === 'lifting' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Exercise">
                        <Sel value={form.exercise} onChange={e => set('exercise', e.target.value)} accentColor={cat.color}>
                          {EXERCISES.map(ex => <option key={ex} value={ex} style={{ background: C.card }}>{ex}</option>)}
                        </Sel>
                      </Field>
                      <Field label="Goal Type">
                        <Sel value={form.goal_type} onChange={e => set('goal_type', e.target.value)} accentColor={cat.color}>
                          {GOAL_TYPES.map(g => <option key={g.value} value={g.value} style={{ background: C.card }}>{g.label}</option>)}
                        </Sel>
                      </Field>
                    </div>
                  )}
                  {(form.category === 'attendance' || form.category === 'streak') && (
                    <Field label={form.category === 'streak' ? 'Streak Target (days)' : 'Check-in Target'} hint={form.category === 'streak' ? 'Members aim to hit this consecutive streak' : 'Number of check-ins to win or qualify'}>
                      <Inp type="number" value={form.target_value} onChange={e => set('target_value', parseInt(e.target.value) || 0)} placeholder={form.category === 'streak' ? '30' : '20'} Icon={Target} accentColor={cat.color} min="1" />
                    </Field>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Start Date" required>
                      <Inp type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} Icon={Calendar} accentColor={cat.color} />
                    </Field>
                    <Field label="End Date" required>
                      <Inp type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} Icon={Calendar} accentColor={cat.color} />
                    </Field>
                  </div>
                  <Field label="Reward" hint="Optional — shown to members as the prize for winning">
                    <Inp value={form.reward} onChange={e => set('reward', e.target.value)} placeholder="e.g. Free protein shake, £10 gift card" Icon={Gift} accentColor={cat.color} />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Toggle checked={form.auto_start}     onChange={v => set('auto_start', v)}     color={cat.color} label="Auto-start"     sub="Begins on start date automatically" />
                    <Toggle checked={form.send_reminders} onChange={v => set('send_reminders', v)} color={cat.color} label="Send reminders" sub="Notify participants weekly" />
                  </div>
                </div>
                <div className="ch-scroll" style={{ padding: '18px 16px', background: C.surface, overflowY: 'auto', borderLeft: `1px solid ${C.brd}` }}>
                  <ChallengePreview form={form} gyms={gyms} />
                </div>
              </form>

              {/* FOOTER */}
              <div style={{ flexShrink: 0, padding: '12px 20px', borderTop: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', gap: 10, background: C.surface }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {canSave ? (
                    <>
                      <CheckCircle size={11} color={C.green} />
                      <span style={{ fontSize: 10.5, color: C.t3, ...MONO }}>
                        {form.title}{form.end_date ? ` · ends ${format(parseISO(form.end_date), 'MMM d')}` : ''}{form.reward ? ` · ${form.reward}` : ''}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 10.5, color: C.t3 }}>
                      {!form.title.trim() ? 'Add a challenge title to continue' : 'Set an end date to continue'}
                    </span>
                  )}
                </div>
                <button className="ch-cancel" onClick={handleClose} type="button">Cancel</button>
                <button type="submit" onClick={handleSubmit} disabled={!canSave}
                  style={{ padding: '9px 22px', borderRadius: 8, border: 'none', fontFamily: FONT, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', background: canSave ? C.blue : C.brd2, color: canSave ? '#fff' : C.t3, cursor: canSave ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'opacity 0.15s, box-shadow 0.15s', boxShadow: canSave ? `0 0 24px ${C.blue}40` : 'none', opacity: canSave ? 1 : 0.4, minWidth: 165, justifyContent: 'center' }}
                  onMouseEnter={e => { if (canSave) e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { if (canSave) e.currentTarget.style.opacity = '1'; }}
                >
                  {isLoading
                    ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'ch-spin 0.7s linear infinite' }} /> Creating…</>
                    : <><Zap size={13} /> Create Challenge</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT EXPORT — branches on isMobile
══════════════════════════════════════════════════════════════ */
export default function CreateChallengeModal({ open, onClose, gyms = [], onSave, isLoading }) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <MobileCreateChallengeModal open={open} onClose={onClose} gyms={gyms} onSave={onSave} isLoading={isLoading} />;
  }
  return <DesktopCreateChallengeModal open={open} onClose={onClose} gyms={gyms} onSave={onSave} isLoading={isLoading} />;
}