import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Upload, Plus, X, GraduationCap, Briefcase, Award, Users,
  Edit2, Check, Loader2, Eye, Camera, Save, ChevronRight,
  Clock, MapPin, Languages, Zap, Trophy, Shield, Tag,
  MessageSquare, BadgeCheck, ScanFace, ClipboardCheck,
  ArrowUpRight, Sparkles, AlertCircle, Package, Calendar,
  Image, Trash2, ToggleLeft, ToggleRight, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import CoachProfileModal from '@/components/CoachProfileModal';

/* ─── Design tokens (match CoachProfileModal exactly) ───────── */
const BG       = '#060810';
const SURFACE  = '#0c1128';
const CARD     = 'linear-gradient(135deg,rgba(30,35,60,0.82) 0%,rgba(8,10,20,0.96) 100%)';
const BORDER   = '1px solid rgba(255,255,255,0.07)';
const BLUE     = '#2563eb';
const BLUE_LT  = '#60a5fa';
const SUB      = 'rgba(255,255,255,0.45)';
const MUTE     = 'rgba(255,255,255,0.25)';
const LABEL    = 'rgba(255,255,255,0.28)';

const SPECIALTIES_OPTIONS = [
  'Strength Training','Weight Loss','Muscle Gain','Cardio','HIIT','Yoga',
  'Boxing','Rehabilitation','Nutrition','Powerlifting','CrossFit',
  'Flexibility','Sports Performance','Senior Fitness','Pre/Post Natal',
  'Body Recomposition','Mobility','Mindfulness',
];
const CERT_SUGGESTIONS = [
  'NASM CPT','ACE CPT','ISSA CPT','REPS Level 3','CrossFit L1',
  'Precision Nutrition L1','Precision Nutrition L2','First Aid / CPR',
  'Sports Massage','Kettlebell Specialist','FMS Specialist',
  'ISSA Strength & Conditioning',
];
const LANGUAGES_OPTIONS = ['English','Spanish','French','German','Portuguese','Mandarin','Arabic','Hindi'];
const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const TIME_SLOTS = ['6:00 AM','7:00 AM','7:30 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM'];

const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap');
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes cpm-shimmer{0%{transform:translateX(-100%);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(220%);opacity:0}}
@keyframes cpm-pulse{0%,100%{opacity:1}50%{opacity:.35}}
.tcp-root{font-family:'Figtree',system-ui,sans-serif;color:#f0f4f8}
.tcp-card{background:${CARD};border:${BORDER};border-radius:16px}
.tcp-btn{border:none;outline:none;cursor:pointer;transition:all .15s}
.tcp-btn:active{transform:scale(0.95)!important}
.tcp-input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:10px;padding:10px 13px;font-size:13px;color:#f0f4f8;outline:none;font-family:inherit;width:100%;box-sizing:border-box;transition:border-color .15s}
.tcp-input:focus{border-color:${BLUE}88}
.tcp-input::placeholder{color:${MUTE}}
.tcp-textarea{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:10px;padding:10px 13px;font-size:13px;color:#f0f4f8;outline:none;font-family:inherit;width:100%;box-sizing:border-box;resize:none;transition:border-color .15s;line-height:1.65}
.tcp-textarea:focus{border-color:${BLUE}88}
.tcp-row:hover{background:rgba(255,255,255,0.03)!important}
.avatar-wrap:hover .avatar-overlay{opacity:1!important}
.tcp-section{display:flex;flex-direction:column;gap:14px}
.tcp-toggle{transition:background .2s}
`;

/* ─── Atoms ─────────────────────────────────────────────────── */
function SLabel({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, color: LABEL, textTransform: 'uppercase', letterSpacing: '.13em' }}>{children}</span>
      {hint && <span title={hint} style={{ cursor: 'help' }}><Info style={{ width: 11, height: 11, color: MUTE }} /></span>}
    </div>
  );
}

function Field({ label, value, onChange, multiline, type = 'text', placeholder, hint, rows = 3 }) {
  return (
    <div>
      <SLabel hint={hint}>{label}</SLabel>
      {multiline
        ? <textarea className="tcp-textarea" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
        : <input className="tcp-input" type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      }
    </div>
  );
}

function Toggle({ label, sub, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: SUB, marginTop: 2 }}>{sub}</div>}
      </div>
      <div onClick={() => onChange(!value)} className="tcp-toggle"
        style={{ width: 44, height: 26, borderRadius: 13, background: value ? BLUE : 'rgba(255,255,255,0.12)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .22s cubic-bezier(0.34,1.4,0.64,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  );
}

function TagPicker({ label, items = [], suggestions = [], onAdd, onRemove, color = '#a78bfa', hint }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const add = val => { const v = val.trim(); if (v && !items.includes(v)) onAdd(v); setDraft(''); setAdding(false); };
  const remaining = suggestions.filter(s => !items.includes(s));
  return (
    <div>
      <SLabel hint={hint}>{label}</SLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map(item => (
          <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: `${color}14`, border: `1px solid ${color}30`, color }}>
            {item}
            <button onClick={() => onRemove(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color, opacity: 0.6, lineHeight: 1, display: 'flex' }}>
              <X style={{ width: 10, height: 10 }} />
            </button>
          </span>
        ))}
        {adding ? (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(draft); if (e.key === 'Escape') { setAdding(false); setDraft(''); } }} autoFocus placeholder="Type & Enter"
              style={{ fontSize: 12, background: 'rgba(255,255,255,0.06)', border: `1px solid ${color}40`, borderRadius: 99, padding: '5px 12px', color: '#f0f4f8', outline: 'none', width: 130, fontFamily: 'inherit' }} />
            <button onClick={() => add(draft)} className="tcp-btn" style={{ fontSize: 11, fontWeight: 800, color, background: `${color}14`, border: `1px solid ${color}28`, borderRadius: 99, padding: '5px 12px' }}>Add</button>
            <button onClick={() => setAdding(false)} className="tcp-btn" style={{ fontSize: 11, color: MUTE, background: 'none', border: 'none', padding: '5px 6px' }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="tcp-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', color: MUTE }}>
            <Plus style={{ width: 10, height: 10 }} /> Add
          </button>
        )}
      </div>
      {adding && remaining.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 9 }}>
          {remaining.slice(0, 10).map(s => (
            <button key={s} onClick={() => add(s)} className="tcp-btn" style={{ fontSize: 11, fontWeight: 600, color: SUB, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '4px 10px' }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconColor = BLUE_LT, children }) {
  return (
    <div style={{ borderRadius: 16, background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${iconColor}18`, border: `1px solid ${iconColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 14, height: 14, color: iconColor }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{title}</span>
      </div>
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

function SaveBar({ dirty, saving, onSave, onDiscard }) {
  return (
    <AnimatePresence>
      {dirty && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9000, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 16, background: 'rgba(12,17,40,0.98)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(24px)', boxShadow: '0 8px 40px rgba(0,0,0,0.7)', whiteSpace: 'nowrap' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: SUB }}>Unsaved changes</span>
          <button onClick={onDiscard} className="tcp-btn" style={{ fontSize: 12, fontWeight: 700, color: MUTE, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '7px 14px' }}>Discard</button>
          <button onClick={onSave} className="tcp-btn" style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: `linear-gradient(135deg,${BLUE},#1d4ed8)`, border: 'none', borderRadius: 10, padding: '7px 18px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(37,99,235,0.45)' }}>
            {saving ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 13, height: 13 }} />}
            Save Changes
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Live Preview (mirrors CoachProfileModal hero card) ────── */
function LivePreview({ draft, onOpenModal }) {
  const avgRating = draft.rating;
  return (
    <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: LABEL, textTransform: 'uppercase', letterSpacing: '.13em' }}>Live Preview</span>
        {onOpenModal && (
          <button onClick={onOpenModal} className="tcp-btn" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: BLUE_LT, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 99, padding: '5px 12px' }}>
            <Eye style={{ width: 11, height: 11 }} /> Full Profile
          </button>
        )}
      </div>

      {/* Mirror of CoachProfileModal hero */}
      <div style={{ borderRadius: 20, background: 'linear-gradient(160deg,#0c1128 0%,#060810 100%)', border: '1px solid rgba(255,255,255,0.09)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#2563eb 35%,rgba(59,130,246,0.9) 50%,#2563eb 65%,transparent)' }} />

        {/* Hero image */}
        <div style={{ position: 'relative', height: 130, overflow: 'hidden' }}>
          <img src={draft.image_url || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80'} alt="hero" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.1),rgba(6,8,18,0.95))' }} />

          {/* Badges */}
          <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', gap: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase', color: '#34d399', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 20, padding: '2px 8px' }}>✓ Verified</span>
            <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#38bdf8', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 20, padding: '2px 8px' }}>🟢 Available</span>
            {draft.match_score && <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#c084fc', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(192,132,252,0.3)', borderRadius: 20, padding: '2px 8px' }}>✦ {draft.match_score}% Match</span>}
          </div>
        </div>

        {/* Identity */}
        <div style={{ padding: '14px 14px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(59,130,246,0.5)', boxShadow: '0 0 0 2px rgba(37,99,235,0.2)', background: 'linear-gradient(135deg,rgba(37,99,235,0.55),rgba(37,99,235,0.22))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: BLUE_LT }}>
                {draft.avatar_url ? <img src={draft.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} /> : ini(draft.name)}
              </div>
              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid #060810' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{draft.name || 'Your Name'}</div>
              <div style={{ fontSize: 11, color: BLUE_LT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 3, marginBottom: 4 }}>{draft.title || 'Personal Coach'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {avgRating && <>
                  <div style={{ display: 'flex', gap: 1 }}>{[1,2,3,4,5].map(s => <Star key={s} style={{ width: 9, height: 9, fill: s <= Math.round(avgRating) ? '#fbbf24' : 'rgba(255,255,255,0.15)', color: s <= Math.round(avgRating) ? '#fbbf24' : 'rgba(255,255,255,0.15)' }} />)}</div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24' }}>{avgRating}</span>
                </>}
                <span style={{ fontSize: 10, color: MUTE }}>({draft.review_count || 0} reviews)</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
            {[
              { val: draft.experience_years ? `${draft.experience_years}yrs` : '—', label: 'Experience' },
              { val: draft.total_clients || '—', label: 'Clients' },
              { val: draft.sessions_completed ? `${(draft.sessions_completed / 1000).toFixed(1)}k` : '—', label: 'Sessions' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '9px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: MUTE, textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Availability */}
          {draft.next_available && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 11, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'cpm-pulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>{draft.next_available}</span>
              </div>
              {draft.price_per_session && <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>£{draft.price_per_session}<span style={{ fontSize: 10, color: MUTE, fontWeight: 500 }}>/session</span></span>}
            </div>
          )}

          {/* Specialty pills */}
          {(draft.specialties || []).length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
              {(draft.specialties || []).slice(0, 4).map((s, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: '4px 11px', borderRadius: 99, background: i === 0 ? BLUE : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? BLUE : 'rgba(255,255,255,0.09)'}`, color: i === 0 ? '#fff' : SUB }}>{s}</span>
              ))}
              {(draft.specialties || []).length > 4 && <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 11px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: MUTE }}>+{draft.specialties.length - 4} more</span>}
            </div>
          )}

          {/* Bio preview */}
          {draft.bio && <p style={{ fontSize: 12, color: 'rgba(226,232,240,0.6)', lineHeight: 1.65, margin: '0 0 10px' }}>{draft.bio.slice(0, 120)}{draft.bio.length > 120 ? '…' : ''}</p>}
        </div>

        {/* Packages preview */}
        {(draft.packages || []).length > 0 && (
          <div style={{ padding: '0 14px 10px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: LABEL, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 6 }}>Packages</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {draft.packages.map((p, i) => (
                <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 11, border: `1.5px solid ${p.popular ? BLUE : 'rgba(255,255,255,0.09)'}`, background: p.popular ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)', textAlign: 'center', position: 'relative' }}>
                  {p.popular && <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)', fontSize: 7, fontWeight: 900, color: '#fbbf24', background: 'rgba(251,191,36,0.18)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 99, padding: '1px 6px', whiteSpace: 'nowrap', letterSpacing: '.06em', textTransform: 'uppercase' }}>Popular</div>}
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{p.sessions}×</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>£{p.price}</div>
                  {p.discount && <div style={{ fontSize: 8.5, fontWeight: 800, color: '#34d399' }}>{p.discount}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA strip */}
        <div style={{ padding: '10px 14px 14px', display: 'flex', gap: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare style={{ width: 16, height: 16, color: SUB }} />
          </div>
          {draft.free_consultation && (
            <div style={{ flex: 1, height: 44, borderRadius: 13, border: '1px solid rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Calendar style={{ width: 13, height: 13, color: '#34d399' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#34d399' }}>Free Consult</span>
            </div>
          )}
          <div style={{ flex: 2, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${BLUE},#1d4ed8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>Book Now</span>
            <ChevronRight style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.7)' }} />
          </div>
        </div>
      </div>

      {/* Permissions panel */}
      <div style={{ borderRadius: 14, background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', padding: '13px 15px' }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: LABEL, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>Your Permissions</div>
        {[
          { label: 'Post on gym feed',   k: 'can_post' },
          { label: 'Manage events',      k: 'can_manage_events' },
          { label: 'Manage classes',     k: 'can_manage_classes' },
        ].map(({ label, k }) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 12, color: SUB }}>{label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: draft[k] ? '#34d399' : '#f87171' }}>{draft[k] ? '✓ Yes' : '✗ No'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function TabCoachProfile({ selectedGym, currentUser }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activeSection, setActiveSection] = useState('identity');
  const sectionRefs = useRef({});

  // ── Query: try multiple field names the Coach entity might use ──
  const { data: coachRecords = [], isLoading } = useQuery({
    queryKey: ['myCoachProfile', currentUser?.email, selectedGym?.id],
    queryFn: async () => {
      // Try user_email first, fall back to email, then fetch all by gym and match client-side
      let results = [];
      try { results = await base44.entities.Coach.filter({ user_email: currentUser.email, gym_id: selectedGym.id }); } catch {}
      if (!results.length) {
        try { results = await base44.entities.Coach.filter({ email: currentUser.email, gym_id: selectedGym.id }); } catch {}
      }
      if (!results.length) {
        try { results = await base44.entities.Coach.filter({ user_id: currentUser.id, gym_id: selectedGym.id }); } catch {}
      }
      if (!results.length) {
        // Last resort: get all coaches for this gym and find a name/email match
        try {
          const all = await base44.entities.Coach.filter({ gym_id: selectedGym.id });
          results = all.filter(c =>
            c.user_email === currentUser.email ||
            c.email === currentUser.email ||
            c.user_id === currentUser.id ||
            c.name === currentUser.full_name
          );
        } catch {}
      }
      return results;
    },
    enabled: !!currentUser?.email && !!selectedGym?.id,
    staleTime: 2 * 60 * 1000,
  });

  const coach = coachRecords[0] || null;

  useEffect(() => {
    if (coach && !dirty) setDraft({ ...coach });
  }, [coach]);

  // ── Create mutation (for when no coach record exists yet) ──
  const createMutation = useMutation({
    mutationFn: data => base44.entities.Coach.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCoachProfile', currentUser?.email, selectedGym?.id] });
      queryClient.invalidateQueries({ queryKey: ['coaches', selectedGym?.id] });
      toast.success('Profile created! Fill in your details below ✓');
      setDirty(false);
    },
    onError: () => toast.error('Failed to create profile — check your permissions'),
  });

  const updateMutation = useMutation({
    mutationFn: data => base44.entities.Coach.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCoachProfile', currentUser?.email, selectedGym?.id] });
      queryClient.invalidateQueries({ queryKey: ['coaches', selectedGym?.id] });
      toast.success('Profile saved ✓');
      setDirty(false);
    },
    onError: () => toast.error('Failed to save — try again'),
  });

  const patch = (field, value) => {
    setDraft(d => ({ ...d, [field]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    if (draft?.id) {
      updateMutation.mutate(draft);
    } else {
      // No id yet — create the record
      createMutation.mutate({
        ...draft,
        gym_id: selectedGym.id,
        user_email: currentUser.email,
        user_id: currentUser.id,
        name: draft.name || currentUser.full_name || currentUser.email,
      });
    }
  };
  const handleDiscard = () => { setDraft(coach ? { ...coach } : null); setDirty(false); };

  const handleAvatarUpload = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    patch('avatar_url', file_url); setUploading(false);
  };
  const handleHeroUpload = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setHeroUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    patch('image_url', file_url); setHeroUploading(false);
  };

  const scrollTo = id => sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const NAV_ITEMS = [
    { id: 'identity',      label: 'Identity',       icon: Camera },
    { id: 'bio',           label: 'Bio & Philosophy',icon: Edit2 },
    { id: 'credentials',   label: 'Credentials',    icon: Award },
    { id: 'trust',         label: 'Trust Signals',  icon: BadgeCheck },
    { id: 'schedule',      label: 'Availability',   icon: Calendar },
    { id: 'packages',      label: 'Packages',       icon: Package },
    { id: 'settings',      label: 'Settings',       icon: Shield },
  ];

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, fontFamily: 'Figtree,system-ui,sans-serif' }}>
      <Loader2 style={{ width: 28, height: 28, color: BLUE_LT, animation: 'spin 1s linear infinite' }} />
    </div>
  );

  // No coach record yet — show Create Profile onboarding
  if (!isLoading && !coach && !draft) {
    const creating = createMutation.isPending;
    return (
      <div className="tcp-root" style={{ fontFamily: "Figtree,system-ui,sans-serif", minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{CSS}</style>
        <div style={{ maxWidth: 480, width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ borderRadius: 20, background: "linear-gradient(135deg,rgba(37,99,235,0.12),rgba(99,102,241,0.08))", border: "1px solid rgba(37,99,235,0.25)", padding: "32px 28px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,rgba(37,99,235,0.3),rgba(99,102,241,0.2))", border: "1px solid rgba(37,99,235,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <GraduationCap style={{ width: 28, height: 28, color: BLUE_LT }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginBottom: 8 }}>Set up your coach profile</div>
            <div style={{ fontSize: 13, color: SUB, lineHeight: 1.65, marginBottom: 24 }}>
              Create your public profile at <span style={{ color: BLUE_LT, fontWeight: 700 }}>{selectedGym?.name}</span>. Members will see your bio, classes, certifications, and booking options.
            </div>
            <button
              onClick={() => createMutation.mutate({
                gym_id: selectedGym.id,
                user_email: currentUser.email,
                user_id: currentUser.id,
                name: currentUser.full_name || currentUser.email?.split("@")[0] || "Coach",
                title: "Personal Coach",
                specialties: [],
                certifications: [],
                languages: ["English"],
                packages: [
                  { sessions: 1, price: 60, label: "Single", popular: false, discount: null },
                  { sessions: 5, price: 270, label: "5 Pack", popular: true, discount: "Save 10%" },
                  { sessions: 10, price: 510, label: "10 Pack", popular: false, discount: "Save 15%" },
                ],
                verification: { id: false, certifications: false, background: false },
                free_consultation: false,
              })}
              className="tcp-btn"
              disabled={creating}
              style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", fontSize: 15, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: "0 6px 24px rgba(37,99,235,0.4)", cursor: creating ? "default" : "pointer", opacity: creating ? 0.7 : 1 }}>
              {creating ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Creating profile…</> : <><GraduationCap style={{ width: 16, height: 16 }} /> Create My Coach Profile</>}
            </button>
          </div>
          <div style={{ borderRadius: 16, background: SURFACE, border: "1px solid rgba(255,255,255,0.07)", padding: "18px 20px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: LABEL, textTransform: "uppercase", letterSpacing: ".13em", marginBottom: 12 }}>What you get</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {[
                { icon: Eye,           color: "#38bdf8", label: "Public profile card",   sub: "Visible to all members browsing coaches" },
                { icon: Calendar,      color: "#34d399", label: "Booking system",         sub: "Let members book sessions from your card" },
                { icon: Award,         color: "#fbbf24", label: "Credentials display",    sub: "Showcase certifications and achievements" },
                { icon: Package,       color: "#c084fc", label: "Session packages",       sub: "Sell single sessions or bundles" },
                { icon: MessageSquare, color: BLUE_LT,   label: "Direct messaging",        sub: "Members can message you from your profile" },
              ].map(({ icon: Ic, color, label, sub }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: color+"14", border: "1px solid "+color+"28", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Ic style={{ width: 14, height: 14, color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff" }}>{label}</div>
                    <div style={{ fontSize: 11, color: MUTE, marginTop: 1 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
            <span style={{ color: "#fbbf24", fontWeight: 700 }}>Note:</span> If you already have a coach profile and it is not showing, your gym owner may need to re-link your account. Logged in as: <span style={{ color: BLUE_LT }}>{currentUser?.email}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tcp-root" style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: '100vh' }}>
      <style>{CSS}</style>

      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', marginBottom: 4 }}>Coach Profile</div>
        <div style={{ fontSize: 13, color: SUB }}>Manage how you appear to members at <span style={{ color: BLUE_LT, fontWeight: 700 }}>{selectedGym?.name}</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* ── Sidebar nav ─────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => scrollTo(id)} className="tcp-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 11, background: activeSection === id ? 'rgba(37,99,235,0.12)' : 'transparent', border: `1px solid ${activeSection === id ? 'rgba(37,99,235,0.3)' : 'transparent'}`, color: activeSection === id ? BLUE_LT : SUB, fontSize: 12.5, fontWeight: 700, textAlign: 'left', width: '100%' }}>
              <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Edit columns ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* IDENTITY */}
          <div ref={el => sectionRefs.current['identity'] = el}>
            <SectionCard title="Identity" icon={Camera} iconColor="#38bdf8">
              {/* Hero image upload */}
              <div>
                <SLabel>Hero / Cover Photo</SLabel>
                <div style={{ position: 'relative', height: 120, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', cursor: 'pointer' }}>
                  {draft.image_url && <img src={draft.image_url} alt="hero" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />}
                  <label style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: draft.image_url ? 'rgba(0,0,0,0.45)' : 'transparent', transition: 'background .15s' }}>
                    {heroUploading ? <Loader2 style={{ width: 22, height: 22, color: '#fff', animation: 'spin 1s linear infinite' }} /> : <><Image style={{ width: 20, height: 20, color: '#fff', opacity: 0.7 }} /><span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{draft.image_url ? 'Change photo' : 'Upload cover photo'}</span></>}
                    <input type="file" accept="image/*" onChange={handleHeroUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* Avatar + name row */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ flexShrink: 0, position: 'relative' }}>
                  <label className="avatar-wrap" style={{ cursor: 'pointer', display: 'block' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,rgba(37,99,235,0.7),rgba(37,99,235,0.4))', border: '2.5px solid rgba(59,130,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: BLUE_LT, position: 'relative' }}>
                      {draft.avatar_url ? <img src={draft.avatar_url} alt={draft.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} /> : ini(draft.name)}
                      <div className="avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .15s' }}>
                        {uploading ? <Loader2 style={{ width: 18, height: 18, color: '#fff', animation: 'spin 1s linear infinite' }} /> : <Camera style={{ width: 18, height: 18, color: '#fff' }} />}
                      </div>
                    </div>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                  </label>
                  <div style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: '#22c55e', border: '2px solid #060810', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Field label="Display Name" value={draft.name} onChange={v => patch('name', v)} placeholder="Your full name" />
                  <Field label="Professional Title" value={draft.title} onChange={v => patch('title', v)} placeholder="e.g. Elite Performance Coach" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Location" value={draft.location} onChange={v => patch('location', v)} placeholder="City, Country" />
                <Field label="Member Since" value={draft.member_since} onChange={v => patch('member_since', v)} placeholder="2020" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <Field label="Years Experience" value={draft.experience_years?.toString()} onChange={v => patch('experience_years', parseInt(v) || 0)} type="number" placeholder="e.g. 11" />
                <Field label="Total Clients" value={draft.total_clients?.toString()} onChange={v => patch('total_clients', parseInt(v) || 0)} type="number" placeholder="e.g. 840" />
                <Field label="Rating (out of 5)" value={draft.rating?.toString()} onChange={v => patch('rating', parseFloat(v) || null)} type="number" placeholder="e.g. 4.9" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Next Available" value={draft.next_available} onChange={v => patch('next_available', v)} placeholder="Tomorrow · 7:00 AM" />
                <Field label="Response Time" value={draft.response_time} onChange={v => patch('response_time', v)} placeholder="< 1 hr" />
              </div>
              <TagPicker label="Languages" items={draft.languages || []} suggestions={LANGUAGES_OPTIONS} color="#34d399"
                onAdd={v => patch('languages', [...(draft.languages || []), v])}
                onRemove={v => patch('languages', (draft.languages || []).filter(l => l !== v))} />
            </SectionCard>
          </div>

          {/* BIO & PHILOSOPHY */}
          <div ref={el => sectionRefs.current['bio'] = el}>
            <SectionCard title="Bio & Philosophy" icon={Edit2} iconColor="#818cf8">
              <Field label="Bio" value={draft.bio} onChange={v => patch('bio', v)} multiline rows={3} placeholder="Tell members who you are and what you do…" hint="Shown on your public profile — keep it punchy and personal." />
              <Field label="My Approach / Training Philosophy" value={draft.philosophy} onChange={v => patch('philosophy', v)} multiline rows={4} placeholder="Describe your coaching philosophy and methodology…" hint="Shown as an italicised quote block on your profile." />
              <TagPicker label="Specialties" items={draft.specialties || []} suggestions={SPECIALTIES_OPTIONS} color="#a78bfa" hint="Displayed as pills on your hero card"
                onAdd={v => patch('specialties', [...(draft.specialties || []), v])}
                onRemove={v => patch('specialties', (draft.specialties || []).filter(s => s !== v))} />
            </SectionCard>
          </div>

          {/* CREDENTIALS */}
          <div ref={el => sectionRefs.current['credentials'] = el}>
            <SectionCard title="Credentials & Certifications" icon={Award} iconColor="#fbbf24">
              <TagPicker label="Certifications" items={draft.certifications || []} suggestions={CERT_SUGGESTIONS} color="#38bdf8"
                onAdd={v => patch('certifications', [...(draft.certifications || []), v])}
                onRemove={v => patch('certifications', (draft.certifications || []).filter(c => c !== v))} />
              <div>
                <SLabel hint="Trophy items shown on your about tab">Client Achievements</SLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {(draft.achievements || []).map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <Trophy style={{ width: 13, height: 13, color: '#fbbf24', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{a}</span>
                      <button onClick={() => patch('achievements', (draft.achievements || []).filter((_, j) => j !== i))} className="tcp-btn" style={{ color: MUTE, background: 'none', border: 'none', padding: 2 }}><X style={{ width: 13, height: 13 }} /></button>
                    </div>
                  ))}
                  <AchievementAdder onAdd={v => patch('achievements', [...(draft.achievements || []), v])} />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* TRUST SIGNALS */}
          <div ref={el => sectionRefs.current['trust'] = el}>
            <SectionCard title="Trust & Verification" icon={BadgeCheck} iconColor="#34d399">
              <div>
                <SLabel>Verification Status</SLabel>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { key: 'id', icon: ScanFace, label: 'ID Verified' },
                    { key: 'certifications', icon: BadgeCheck, label: 'Certs Verified' },
                    { key: 'background', icon: ClipboardCheck, label: 'Background Checked' },
                  ].map(({ key, icon: Ic, label }) => {
                    const ver = draft.verification || {};
                    const on = ver[key];
                    return (
                      <button key={key} onClick={() => patch('verification', { ...(draft.verification || {}), [key]: !on })} className="tcp-btn"
                        style={{ flex: 1, padding: '10px 6px', borderRadius: 12, background: on ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <Ic style={{ width: 16, height: 16, color: on ? '#34d399' : MUTE }} />
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: on ? '#34d399' : MUTE, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: on ? '#34d399' : MUTE, opacity: 0.7 }}>{on ? '✓ Active' : '✗ Off'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <SLabel hint="Displayed on about tab as a match percentage ring">Coach Match Score</SLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min={0} max={100} value={draft.match_score || 0} onChange={e => patch('match_score', parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: '#c084fc' }} />
                  <div style={{ minWidth: 46, textAlign: 'right', fontSize: 15, fontWeight: 900, color: '#c084fc', letterSpacing: '-0.02em' }}>{draft.match_score || 0}%</div>
                </div>
              </div>
              <div>
                <SLabel hint="Before / after transformation photos from real clients">Before & After Transformations</SLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(draft.transformations || []).map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
                          <img src={t.before} alt="before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ width: 32, height: 32, borderRadius: 7, overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
                          <img src={t.after} alt="after" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.caption}</div>
                        <div style={{ fontSize: 11, color: MUTE }}>{t.name}</div>
                      </div>
                      <button onClick={() => patch('transformations', (draft.transformations || []).filter((_, j) => j !== i))} className="tcp-btn" style={{ color: MUTE, background: 'none', border: 'none', padding: 2 }}><Trash2 style={{ width: 13, height: 13 }} /></button>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: MUTE, padding: '8px 0' }}>
                    <Info style={{ width: 11, height: 11, display: 'inline', marginRight: 4 }} />
                    Add transformation images via your media library or ask your admin.
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* AVAILABILITY / SCHEDULE */}
          <div ref={el => sectionRefs.current['schedule'] = el}>
            <SectionCard title="Availability" icon={Calendar} iconColor="#38bdf8">
              <div>
                <SLabel hint="Show members when you're available each week">Weekly Schedule</SLabel>
                <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {DAYS.map((day, di) => {
                    const existing = (draft.weekly_schedule || []);
                    const entry = existing.find(d => d.day === day) || { day, slots: [] };
                    const slots = entry.slots || [];
                    const toggle = (slot) => {
                      const newSlots = slots.includes(slot) ? slots.filter(s => s !== slot) : [...slots, slot];
                      const updated = existing.filter(d => d.day !== day);
                      patch('weekly_schedule', [...updated, { day, slots: newSlots }]);
                    };
                    return (
                      <div key={day} style={{ padding: '10px 14px', borderBottom: di < DAYS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: slots.length ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: slots.length ? 8 : 0 }}>
                          <span style={{ width: 32, fontSize: 10, fontWeight: 800, color: slots.length ? BLUE_LT : MUTE, letterSpacing: '.08em', flexShrink: 0 }}>{day}</span>
                          <div className="cpm-hscroll" style={{ display: 'flex', gap: 5, overflowX: 'auto', flex: 1 }}>
                            {TIME_SLOTS.map(slot => (
                              <button key={slot} onClick={() => toggle(slot)} className="tcp-btn"
                                style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 99, border: `1px solid ${slots.includes(slot) ? 'rgba(37,99,235,0.5)' : 'rgba(255,255,255,0.08)'}`, background: slots.includes(slot) ? 'rgba(37,99,235,0.18)' : 'rgba(255,255,255,0.03)', color: slots.includes(slot) ? BLUE_LT : MUTE }}>
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                        {slots.length === 0 && <span style={{ fontSize: 10, color: MUTE, fontStyle: 'italic', paddingLeft: 42 }}>Rest day</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <SLabel hint="Quick-pick slots shown in the footer of your profile">Next Available Slots (preview)</SLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {(draft.availability_slots || []).map((sl, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <Clock style={{ width: 13, height: 13, color: '#38bdf8', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', flex: 1 }}>{sl.date} · {sl.time}</span>
                      <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>{sl.spots} spots</span>
                      <button onClick={() => patch('availability_slots', (draft.availability_slots || []).filter((_, j) => j !== i))} className="tcp-btn" style={{ color: MUTE, background: 'none', border: 'none', padding: 2 }}><X style={{ width: 13, height: 13 }} /></button>
                    </div>
                  ))}
                  <SlotAdder onAdd={sl => patch('availability_slots', [...(draft.availability_slots || []), sl])} />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* PACKAGES */}
          <div ref={el => sectionRefs.current['packages'] = el}>
            <SectionCard title="Session Packages" icon={Package} iconColor="#fbbf24">
              <SLabel hint="Packages displayed in the booking footer of your profile card">Configure packages to drive multi-session bookings</SLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(draft.packages || []).map((pkg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 14, background: pkg.popular ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${pkg.popular ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '60px 80px 1fr auto', gap: 8, flex: 1, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: MUTE, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Sessions</div>
                        <input className="tcp-input" type="number" value={pkg.sessions} onChange={e => { const p = [...draft.packages]; p[i] = { ...p[i], sessions: parseInt(e.target.value) || 1 }; patch('packages', p); }} style={{ padding: '6px 9px', fontSize: 13 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: MUTE, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Price £</div>
                        <input className="tcp-input" type="number" value={pkg.price} onChange={e => { const p = [...draft.packages]; p[i] = { ...p[i], price: parseInt(e.target.value) || 0 }; patch('packages', p); }} style={{ padding: '6px 9px', fontSize: 13 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: MUTE, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Discount label</div>
                        <input className="tcp-input" value={pkg.discount || ''} onChange={e => { const p = [...draft.packages]; p[i] = { ...p[i], discount: e.target.value }; patch('packages', p); }} placeholder="e.g. Save 10%" style={{ padding: '6px 9px', fontSize: 13 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: MUTE, textTransform: 'uppercase', letterSpacing: '.08em' }}>Popular</div>
                        <div onClick={() => { const p = draft.packages.map((x, j) => ({ ...x, popular: j === i ? !x.popular : false })); patch('packages', p); }}
                          className="tcp-toggle" style={{ width: 36, height: 20, borderRadius: 10, background: pkg.popular ? BLUE : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }}>
                          <div style={{ position: 'absolute', top: 2, left: pkg.popular ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => patch('packages', (draft.packages || []).filter((_, j) => j !== i))} className="tcp-btn" style={{ color: MUTE, background: 'none', border: 'none', padding: 4, flexShrink: 0 }}><Trash2 style={{ width: 14, height: 14 }} /></button>
                  </div>
                ))}
                <button onClick={() => patch('packages', [...(draft.packages || []), { sessions: 5, price: 400, label: '5 Pack', popular: false, discount: '' }])} className="tcp-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', color: MUTE, fontSize: 12, fontWeight: 700 }}>
                  <Plus style={{ width: 13, height: 13 }} /> Add Package
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Single Session Price (£)" value={draft.price_per_session?.toString()} onChange={v => patch('price_per_session', parseInt(v) || null)} type="number" placeholder="85" />
                <Field label="Sessions Completed" value={draft.sessions_completed?.toString()} onChange={v => patch('sessions_completed', parseInt(v) || 0)} type="number" placeholder="3200" />
              </div>
            </SectionCard>
          </div>

          {/* SETTINGS */}
          <div ref={el => sectionRefs.current['settings'] = el}>
            <SectionCard title="Settings & Visibility" icon={Shield} iconColor="#c084fc">
              <Toggle label="Offer Free Consultation" sub="Show a 'Free Consult' CTA button on your profile" value={!!draft.free_consultation} onChange={v => patch('free_consultation', v)} />
              <Toggle label="Show Availability Calendar" sub="Let members see your next available time slots" value={!!(draft.availability_slots?.length)} onChange={v => { if (!v) patch('availability_slots', []); }} />
              <Toggle label="Show Coach Match Score" sub="Display personalised % match badge on your card" value={!!draft.match_score} onChange={v => { if (!v) patch('match_score', null); }} />
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <AlertCircle style={{ width: 14, height: 14, color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', marginBottom: 3 }}>Booking Policy</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Cancellation and refund policies are set by the gym owner. Contact <span style={{ color: BLUE_LT }}>{selectedGym?.name}</span> to update these.</div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* bottom padding */}
          <div style={{ height: 80 }} />
        </div>

        {/* ── Live preview ──────────────────────────────── */}
        <LivePreview draft={draft} onOpenModal={() => setShowPreviewModal(true)} />
      </div>

      {/* ── Floating save bar ───────────────────────────── */}
      <SaveBar dirty={dirty} saving={updateMutation.isPending} onSave={handleSave} onDiscard={handleDiscard} />

      {/* ── Full profile preview modal ───────────────────── */}
      <CoachProfileModal
        coach={draft}
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </div>
  );
}

/* ─── Mini input helpers ────────────────────────────────── */
function AchievementAdder({ onAdd }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ display: 'flex', gap: 7 }}>
      <input className="tcp-input" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal(''); } }} placeholder="e.g. Helped 120+ clients lose 10 kg+" style={{ flex: 1 }} />
      <button onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }} className="tcp-btn"
        style={{ padding: '0 14px', borderRadius: 10, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
        + Add
      </button>
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
        <div style={{ fontSize: 9.5, fontWeight: 700, color: MUTE, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Date</div>
        <input className="tcp-input" value={date} onChange={e => setDate(e.target.value)} placeholder="e.g. Tomorrow" style={{ padding: '8px 10px', fontSize: 12 }} />
      </div>
      <div style={{ flex: 2 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: MUTE, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Time</div>
        <select value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#f0f4f8', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}>
          {['6:00 AM','7:00 AM','7:30 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: MUTE, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Spots</div>
        <input className="tcp-input" type="number" value={spots} onChange={e => setSpots(e.target.value)} style={{ padding: '8px 10px', fontSize: 12 }} />
      </div>
      <button onClick={() => { if (date) { onAdd({ date, time, spots: parseInt(spots) || 1, day: '' }); setDate(''); setSpots('5'); } }} className="tcp-btn"
        style={{ height: 36, padding: '0 14px', borderRadius: 10, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', color: BLUE_LT, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
        + Add
      </button>
    </div>
  );
}
