import React, { useState, useRef, useCallback } from 'react';
import {
  X, Plus, Trash2, Edit2, Clock, MapPin, Users, Dumbbell,
  ChevronDown, Upload, CheckCircle, Zap, Calendar, AlignLeft,
  ChevronLeft,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  blue:    '#0ea5e9', green:  '#10b981', red:    '#ef4444',
  amber:   '#f59e0b', purple: '#8b5cf6',
  text1:   '#f0f4f8', text2:  '#94a3b8', text3:  '#475569',
  border:  'rgba(255,255,255,0.07)', borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1120', card2:  '#0d1630', divider: 'rgba(255,255,255,0.05)',
  bg:      '#060c18',
};

function Shimmer({ color = T.purple }) {
  return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}35,transparent)`, pointerEvents: 'none' }} />;
}

// ── Class type catalogue ──────────────────────────────────────────────────────
const CLASS_TYPES = [
  { value: 'hiit',     label: 'HIIT',     emoji: '⚡', color: '#f87171' },
  { value: 'yoga',     label: 'Yoga',     emoji: '🧘', color: T.green   },
  { value: 'strength', label: 'Strength', emoji: '🏋️', color: T.purple  },
  { value: 'cardio',   label: 'Cardio',   emoji: '🏃', color: '#fb7185' },
  { value: 'spin',     label: 'Spin',     emoji: '🚴', color: T.blue    },
  { value: 'boxing',   label: 'Boxing',   emoji: '🥊', color: T.amber   },
  { value: 'pilates',  label: 'Pilates',  emoji: '🌸', color: '#c084fc' },
  { value: 'other',    label: 'Other',    emoji: '🎯', color: T.blue    },
];

const DIFFICULTIES = [
  { value: 'beginner',     label: 'Beginner',     color: T.green  },
  { value: 'intermediate', label: 'Intermediate', color: T.amber  },
  { value: 'advanced',     label: 'Advanced',     color: T.red    },
  { value: 'all_levels',   label: 'All Levels',   color: T.purple },
];

const DAYS       = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_SHORT = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri', Saturday:'Sat', Sunday:'Sun' };

const EMPTY_FORM = {
  name: '', description: '', instructor: '', class_type: 'other',
  duration_minutes: 45, difficulty: 'all_levels',
  max_capacity: 20, location: '', schedule: [], image_url: '',
};

function typeFor(val) { return CLASS_TYPES.find(t => t.value === val) || CLASS_TYPES[CLASS_TYPES.length - 1]; }
function diffFor(val) { return DIFFICULTIES.find(d => d.value === val) || DIFFICULTIES[3]; }

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

// ── Shared input components ───────────────────────────────────────────────────
const baseInput = {
  width: '100%', boxSizing: 'border-box', padding: '10px 13px',
  borderRadius: 10, background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: T.text1, fontSize: 13, fontWeight: 500, outline: 'none',
  fontFamily: "'DM Sans', system-ui, sans-serif", transition: 'border-color 0.15s, background 0.15s',
  colorScheme: 'dark',
};

function FieldLabel({ children, required }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}{required && <span style={{ color: T.red }}>*</span>}
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      {children}
      {hint && <div style={{ fontSize: 10, color: T.text3, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = 'text', disabled, icon: Icon, accentColor = T.purple, min }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Icon style={{ width: 13, height: 13, color: focus ? accentColor : T.text3, transition: 'color 0.15s' }} /></div>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} min={min}
        onFocus={e => { setFocus(true); e.target.style.borderColor = `${accentColor}45`; e.target.style.background = `${accentColor}06`; }}
        onBlur={e  => { setFocus(false); e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
        style={{ ...baseInput, paddingLeft: Icon ? 34 : 13, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'text' }} />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, accentColor = T.purple }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={e => { e.target.style.borderColor = `${accentColor}45`; e.target.style.background = `${accentColor}06`; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
      style={{ ...baseInput, resize: 'none', lineHeight: 1.65 }} />
  );
}

// ── Type picker grid ──────────────────────────────────────────────────────────
function TypePicker({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
      {CLASS_TYPES.map(t => {
        const active = value === t.value;
        return (
          <button key={t.value} onClick={() => onChange(t.value)}
            style={{ padding: '11px 6px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${active ? t.color + '35' : T.border}`, background: active ? `${t.color}12` : T.divider, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: 'all 0.15s', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{t.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 800 : 500, color: active ? t.color : T.text3, letterSpacing: '0.04em', transition: 'color 0.15s' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Difficulty picker ─────────────────────────────────────────────────────────
function DifficultyPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {DIFFICULTIES.map(d => {
        const active = value === d.value;
        return (
          <button key={d.value} onClick={() => onChange(d.value)}
            style={{ flex: 1, padding: '8px 4px', borderRadius: 9, cursor: 'pointer', border: `1px solid ${active ? d.color + '40' : T.border}`, background: active ? `${d.color}14` : T.divider, fontSize: 11, fontWeight: active ? 800 : 500, color: active ? d.color : T.text3, transition: 'all 0.15s', fontFamily: 'inherit' }}>
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Schedule builder ──────────────────────────────────────────────────────────
function ScheduleBuilder({ schedule, onChange }) {
  const [day, setDay]   = useState('');
  const [time, setTime] = useState('');

  const add = () => {
    if (!day || !time) return;
    onChange([...schedule, { day, time }]);
    setDay(''); setTime('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Day select */}
        <div style={{ flex: 1, position: 'relative' }}>
          <select value={day} onChange={e => setDay(e.target.value)}
            onFocus={e => { e.target.style.borderColor = `${T.purple}45`; }}
            onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            style={{ ...baseInput, appearance: 'none', paddingRight: 32, paddingLeft: 13 }}>
            <option value="" style={{ background: '#0d1120' }}>Day</option>
            {DAYS.map(d => <option key={d} value={d} style={{ background: '#0d1120' }}>{d}</option>)}
          </select>
          <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: T.text3, pointerEvents: 'none' }} />
        </div>
        {/* Time */}
        <input type="time" value={time} onChange={e => setTime(e.target.value)}
          onFocus={e => { e.target.style.borderColor = `${T.purple}45`; }}
          onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          style={{ ...baseInput, width: 126, flexShrink: 0 }} />
        {/* Add */}
        <button onClick={add} disabled={!day || !time}
          style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: day && time ? `${T.purple}14` : T.divider, border: `1px solid ${day && time ? T.purple + '35' : T.border}`, cursor: day && time ? 'pointer' : 'default', transition: 'all 0.15s' }}>
          <Plus style={{ width: 14, height: 14, color: day && time ? T.purple : T.text3 }} />
        </button>
      </div>

      {schedule.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {schedule.map((slot, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 8, background: `${T.purple}10`, border: `1px solid ${T.purple}25` }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: T.purple }}>{DAYS_SHORT[slot.day] || slot.day}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.text2 }}>{formatTime(slot.time)}</span>
              <button onClick={() => onChange(schedule.filter((_, idx) => idx !== i))}
                style={{ width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${T.red}10`, border: `1px solid ${T.red}20`, cursor: 'pointer', padding: 0 }}>
                <X style={{ width: 9, height: 9, color: T.red }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Image uploader ────────────────────────────────────────────────────────────
function ImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef();

  const uploadMutation = useMutation({
    mutationFn: async (file) => { const r = await base44.integrations.Core.UploadFile({ file }); return r.file_url; },
    onSuccess:  (url) => { onChange(url); setUploading(false); },
    onError:    ()    => setUploading(false),
  });

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  if (value) {
    return (
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
        <img src={value} alt="Class" style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block', border: `1px solid ${T.border}`, borderRadius: 10 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 50%)', borderRadius: 10, pointerEvents: 'none' }} />
        <button onClick={() => onChange('')}
          style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', border: `1px solid ${T.borderM}`, cursor: 'pointer', backdropFilter: 'blur(6px)' }}>
          <X style={{ width: 11, height: 11, color: '#fff' }} />
        </button>
        <div style={{ position: 'absolute', bottom: 8, left: 12, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Image attached ✓</div>
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
      onClick={() => fileRef.current?.click()}
      style={{ padding: '20px 16px', borderRadius: 10, border: `2px dashed ${dragOver ? T.purple + '55' : T.border}`, background: dragOver ? `${T.purple}06` : 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${T.purple}10`, border: `1px solid ${T.purple}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {uploading
          ? <div style={{ width: 14, height: 14, border: `2px solid ${T.purple}30`, borderTop: `2px solid ${T.purple}`, borderRadius: '50%', animation: 'mc-spin 0.8s linear infinite' }} />
          : <Upload style={{ width: 14, height: 14, color: T.purple }} />
        }
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.text2, textAlign: 'center' }}>{uploading ? 'Uploading…' : 'Drop image or click to browse'}</div>
        <div style={{ fontSize: 10, color: T.text3, textAlign: 'center', marginTop: 2 }}>PNG, JPG up to 10MB</div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />
    </div>
  );
}

// ── Form preview panel ────────────────────────────────────────────────────────
function ClassPreview({ form }) {
  const type = typeFor(form.class_type);
  const diff = diffFor(form.difficulty);
  const hasContent = form.name || form.instructor;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: type.color, boxShadow: `0 0 6px ${type.color}` }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
      </div>

      {/* Class card */}
      <div style={{ borderRadius: 12, background: T.card2, border: `1px solid ${type.color}20`, overflow: 'hidden', position: 'relative' }}>
        <Shimmer color={type.color} />
        {/* Top colour bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg,${type.color},${type.color}50)` }} />

        {/* Image or placeholder */}
        {form.image_url ? (
          <div style={{ height: 120, overflow: 'hidden', position: 'relative' }}>
            <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 30%,rgba(13,22,48,0.85) 100%)' }} />
          </div>
        ) : (
          <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${type.color}07` }}>
            <span style={{ fontSize: 36 }}>{type.emoji}</span>
          </div>
        )}

        <div style={{ padding: '14px 16px 16px' }}>
          {!hasContent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 12, color: T.text3, fontWeight: 500 }}>Fill in details to see preview</div>
            </div>
          ) : (
            <>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: type.color, background: `${type.color}14`, border: `1px solid ${type.color}28`, borderRadius: 5, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {type.emoji} {type.label}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: diff.color, background: `${diff.color}12`, border: `1px solid ${diff.color}25`, borderRadius: 5, padding: '2px 7px' }}>
                  {diff.label}
                </span>
              </div>

              {/* Name */}
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text1, letterSpacing: '-0.025em', marginBottom: form.instructor ? 5 : 10 }}>
                {form.name || 'Class Name'}
              </div>

              {/* Instructor */}
              {form.instructor && (
                <div style={{ fontSize: 11, color: T.text3, marginBottom: 10 }}>with {form.instructor}</div>
              )}

              {/* Description */}
              {form.description && (
                <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {form.description}
                </div>
              )}

              {/* Meta row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: form.schedule?.length ? 10 : 0 }}>
                {form.duration_minutes > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 10, height: 10, color: T.text3 }} />
                    <span style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>{form.duration_minutes}min</span>
                  </div>
                )}
                {form.max_capacity > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users style={{ width: 10, height: 10, color: T.text3 }} />
                    <span style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>{form.max_capacity} max</span>
                  </div>
                )}
                {form.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin style={{ width: 10, height: 10, color: T.text3 }} />
                    <span style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>{form.location}</span>
                  </div>
                )}
              </div>

              {/* Schedule chips */}
              {form.schedule?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {form.schedule.map((s, i) => (
                    <span key={i} style={{ fontSize: 10, fontWeight: 700, color: T.purple, background: `${T.purple}10`, border: `1px solid ${T.purple}25`, borderRadius: 6, padding: '2px 8px' }}>
                      {DAYS_SHORT[s.day]} {formatTime(s.time)}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Class row in list ─────────────────────────────────────────────────────────
function ClassRow({ gymClass, onEdit, onDelete }) {
  const type = typeFor(gymClass.class_type);
  const diff = diffFor(gymClass.difficulty);

  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, overflow: 'hidden', position: 'relative', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = `${type.color}30`}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
      <Shimmer color={type.color} />
      <div style={{ height: 2, background: `linear-gradient(90deg,${type.color},${type.color}40)` }} />
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Type icon */}
        <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: `${type.color}14`, border: `1px solid ${type.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {type.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: type.color, background: `${type.color}12`, border: `1px solid ${type.color}25`, borderRadius: 5, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{type.label}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: diff.color, background: `${diff.color}10`, border: `1px solid ${diff.color}22`, borderRadius: 5, padding: '1px 6px' }}>{diff.label}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.text1, letterSpacing: '-0.02em', marginBottom: 3 }}>{gymClass.name}</div>
          {gymClass.instructor && <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, fontWeight: 500 }}>with {gymClass.instructor}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {gymClass.duration_minutes && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: T.text3, fontWeight: 500 }}><Clock style={{ width: 9, height: 9 }} />{gymClass.duration_minutes}min</span>
            )}
            {gymClass.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: T.text3, fontWeight: 500 }}><MapPin style={{ width: 9, height: 9 }} />{gymClass.location}</span>
            )}
            {gymClass.max_capacity && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: T.text3, fontWeight: 500 }}><Users style={{ width: 9, height: 9 }} />{gymClass.max_capacity} max</span>
            )}
          </div>
          {gymClass.schedule?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
              {gymClass.schedule.map((s, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: T.purple, background: `${T.purple}10`, border: `1px solid ${T.purple}22`, borderRadius: 6, padding: '2px 7px' }}>
                  {DAYS_SHORT[s.day] || s.day} {formatTime(s.time)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(gymClass)}
            style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${T.blue}0a`, border: `1px solid ${T.blue}20`, cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${T.blue}18`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${T.blue}0a`; }}>
            <Edit2 style={{ width: 12, height: 12, color: T.blue }} />
          </button>
          <button onClick={() => { if (window.confirm('Delete this class?')) onDelete(gymClass.id); }}
            style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${T.red}08`, border: `1px solid ${T.red}18`, cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${T.red}18`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${T.red}08`; }}>
            <Trash2 style={{ width: 12, height: 12, color: T.red }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ManageClassesModal({ open, onClose, classes = [], onCreateClass, onDeleteClass, onUpdateClass, gym, isLoading }) {
  const [view,         setView]         = useState('list'); // 'list' | 'form'
  const [editingClass, setEditingClass] = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const openCreate = () => { setForm(EMPTY_FORM); setEditingClass(null); setView('form'); };
  const openEdit   = (c) => {
    setForm({ name: c.name||'', description: c.description||'', instructor: c.instructor||'', class_type: c.class_type||'other', duration_minutes: c.duration_minutes||45, difficulty: c.difficulty||'all_levels', max_capacity: c.max_capacity||20, location: c.location||'', schedule: c.schedule||[], image_url: c.image_url||'' });
    setEditingClass(c);
    setView('form');
  };
  const cancel = () => { setView('list'); setEditingClass(null); setForm(EMPTY_FORM); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingClass) onUpdateClass?.(editingClass.id, form);
    else               onCreateClass?.({ ...form, gym_id: gym?.id, gym_name: gym?.name });
    cancel();
  };

  const canSave   = form.name.trim().length > 0 && !isLoading;
  const activeType = typeFor(form.class_type);

  if (!open) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');
        @keyframes mc-overlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mc-modal   { from { opacity: 0; transform: scale(0.97) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes mc-spin    { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .mc-save:not(:disabled):hover { opacity: 0.9; transform: translateY(-1px); }
        .mc-save:not(:disabled):active { transform: translateY(0); }
        .mc-cancel:hover { background: rgba(255,255,255,0.08) !important; color: #f0f4f8 !important; }
        .mc-add:hover { background: rgba(139,92,246,0.2) !important; border-color: rgba(139,92,246,0.45) !important; }
        .mc-body::-webkit-scrollbar { width: 3px } .mc-body::-webkit-scrollbar-track { background: transparent } .mc-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px }
      `}</style>

      {/* Overlay */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,5,20,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'mc-overlay 0.18s ease', fontFamily: "'DM Sans', system-ui, sans-serif" }}
        onClick={e => e.target === e.currentTarget && onClose()}>

        {/* Modal — widens to two-column in form view */}
        <div style={{ width: '100%', maxWidth: view === 'form' ? 860 : 520, maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#07101f', border: `1px solid ${T.borderM}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.04) inset', animation: 'mc-modal 0.22s cubic-bezier(0.34,1.4,0.64,1)', transition: 'max-width 0.25s ease' }}>

          {/* ── Header ── */}
          <div style={{ flexShrink: 0, padding: '18px 24px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
            <Shimmer color={view === 'form' ? activeType.color : T.purple} />
            <div style={{ position: 'absolute', top: -40, left: -20, width: 160, height: 90, borderRadius: '50%', background: view === 'form' ? activeType.color : T.purple, opacity: 0.04, filter: 'blur(40px)', pointerEvents: 'none', transition: 'background 0.3s' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Back button in form view */}
              {view === 'form' && (
                <button onClick={cancel}
                  style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, cursor: 'pointer', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  <ChevronLeft style={{ width: 14, height: 14, color: T.text2 }} />
                </button>
              )}
              <div style={{ width: 38, height: 38, borderRadius: 11, background: view === 'form' ? `${activeType.color}14` : `${T.purple}14`, border: `1px solid ${view === 'form' ? activeType.color + '28' : T.purple + '28'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: view === 'form' ? 18 : 'inherit', transition: 'all 0.2s' }}>
                {view === 'form'
                  ? <span>{activeType.emoji}</span>
                  : <Dumbbell style={{ width: 17, height: 17, color: T.purple }} />
                }
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text1, letterSpacing: '-0.025em', transition: 'color 0.2s' }}>
                  {view === 'list' ? 'Manage Classes' : editingClass ? 'Edit Class' : 'New Class'}
                </div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 1, fontWeight: 500 }}>
                  {view === 'list' ? `${classes.length} class${classes.length !== 1 ? 'es' : ''} · ${gym?.name}` : 'Fill in the details below'}
                </div>
              </div>
            </div>

            <button onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all 0.15s', color: T.text3 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = T.text1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = T.text3; }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <div className="mc-body" style={{ flex: 1, overflowY: 'auto', padding: '18px 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Add button */}
              <button className="mc-add" onClick={openCreate}
                style={{ width: '100%', padding: '13px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${T.purple}30`, background: `${T.purple}0e`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: T.purple, fontSize: 13, fontWeight: 800, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: `${T.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus style={{ width: 12, height: 12, color: T.purple }} />
                </div>
                Add New Class
              </button>

              {/* Empty state */}
              {classes.length === 0 ? (
                <div style={{ padding: '44px 20px', textAlign: 'center', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: `2px dashed ${T.border}` }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🏋️</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.text2, marginBottom: 5 }}>No classes yet</div>
                  <div style={{ fontSize: 12, color: T.text3 }}>Click "Add New Class" to create your first session</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {classes.map(c => (
                    <ClassRow key={c.id} gymClass={c} onEdit={openEdit} onDelete={onDeleteClass} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FORM VIEW — two columns ── */}
          {view === 'form' && (
            <>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', minHeight: 0, overflow: 'hidden' }}>
                {/* Left — fields */}
                <div className="mc-body" style={{ padding: '20px 24px', borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>

                  {/* Class type */}
                  <Field label="Class type">
                    <TypePicker value={form.class_type} onChange={v => set('class_type', v)} />
                  </Field>

                  {/* Name */}
                  <Field label="Class name" required>
                    <Inp value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. HIIT Bootcamp" icon={Zap} accentColor={activeType.color} />
                  </Field>

                  {/* Description */}
                  <Field label="Description">
                    <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What members can expect…" rows={3} accentColor={activeType.color} />
                  </Field>

                  {/* Instructor + Location */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Instructor">
                      <Inp value={form.instructor} onChange={e => set('instructor', e.target.value)} placeholder="Coach name" accentColor={activeType.color} />
                    </Field>
                    <Field label="Location">
                      <Inp value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Studio A" icon={MapPin} accentColor={activeType.color} />
                    </Field>
                  </div>

                  {/* Duration + Capacity */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Duration (min)">
                      <Inp type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', parseInt(e.target.value) || 0)} icon={Clock} accentColor={activeType.color} min="1" />
                    </Field>
                    <Field label="Max capacity">
                      <Inp type="number" value={form.max_capacity} onChange={e => set('max_capacity', parseInt(e.target.value) || 0)} icon={Users} accentColor={activeType.color} min="1" />
                    </Field>
                  </div>

                  {/* Difficulty */}
                  <Field label="Difficulty">
                    <DifficultyPicker value={form.difficulty} onChange={v => set('difficulty', v)} />
                  </Field>

                  {/* Schedule */}
                  <Field label="Schedule" hint="Add recurring time slots for this class">
                    <ScheduleBuilder schedule={form.schedule} onChange={v => set('schedule', v)} />
                  </Field>

                  {/* Image */}
                  <Field label="Class image" hint="Optional — shown on the class card">
                    <ImageUploader value={form.image_url} onChange={v => set('image_url', v)} />
                  </Field>
                </div>

                {/* Right — preview */}
                <div style={{ padding: '20px 18px', background: T.bg, overflowY: 'auto' }}>
                  <ClassPreview form={form} />
                </div>
              </div>

              {/* Footer */}
              <div style={{ flexShrink: 0, padding: '14px 24px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, background: '#07101f' }}>
                {/* Status */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
                  {canSave ? (
                    <>
                      <CheckCircle style={{ width: 12, height: 12, color: T.green, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: T.text3 }}>
                        {form.name}
                        {form.instructor ? ` · ${form.instructor}` : ''}
                        {form.schedule?.length ? ` · ${form.schedule.length} slot${form.schedule.length !== 1 ? 's' : ''}` : ''}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, color: T.text3 }}>Add a class name to continue</span>
                  )}
                </div>
                <button className="mc-cancel" onClick={cancel}
                  style={{ padding: '10px 20px', borderRadius: 10, background: T.divider, color: T.text2, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  Cancel
                </button>
                <button className="mc-save" onClick={handleSave} disabled={!canSave}
                  style={{ padding: '10px 24px', borderRadius: 10, background: canSave ? `linear-gradient(135deg,${activeType.color},${activeType.color}cc)` : 'rgba(255,255,255,0.06)', color: canSave ? '#fff' : T.text3, border: 'none', fontSize: 12, fontWeight: 800, cursor: canSave ? 'pointer' : 'default', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s', letterSpacing: '-0.01em', boxShadow: canSave ? `0 4px 16px ${activeType.color}35` : 'none', minWidth: 150, justifyContent: 'center' }}>
                  {isLoading
                    ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'mc-spin 0.7s linear infinite' }} />{editingClass ? 'Saving…' : 'Creating…'}</>
                    : <>{activeType.emoji} {editingClass ? 'Save Changes' : 'Create Class'}</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
