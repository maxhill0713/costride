import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calendar, Trash2, Plus, Clock, Edit, X, Check, MapPin, Users, Dumbbell, ChevronDown, ImageIcon, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_SHORT = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri', Saturday:'Sat', Sunday:'Sun' };

const CLASS_TYPES = [
  { value:'hiit',     label:'HIIT',     emoji:'⚡' },
  { value:'yoga',     label:'Yoga',     emoji:'🧘' },
  { value:'strength', label:'Strength', emoji:'🏋️' },
  { value:'cardio',   label:'Cardio',   emoji:'🏃' },
  { value:'spin',     label:'Spin',     emoji:'🚴' },
  { value:'boxing',   label:'Boxing',   emoji:'🥊' },
  { value:'pilates',  label:'Pilates',  emoji:'🌸' },
  { value:'other',    label:'Other',    emoji:'🎯' },
];

const TYPE_CFG = {
  hiit:     { color:'#f87171', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.25)'   },
  yoga:     { color:'#34d399', bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.25)'  },
  strength: { color:'#818cf8', bg:'rgba(99,102,241,0.12)',  border:'rgba(99,102,241,0.25)'  },
  cardio:   { color:'#fb7185', bg:'rgba(244,63,94,0.12)',   border:'rgba(244,63,94,0.25)'   },
  spin:     { color:'#38bdf8', bg:'rgba(14,165,233,0.12)',  border:'rgba(14,165,233,0.25)'  },
  boxing:   { color:'#fb923c', bg:'rgba(234,88,12,0.12)',   border:'rgba(234,88,12,0.25)'   },
  pilates:  { color:'#c084fc', bg:'rgba(168,85,247,0.12)',  border:'rgba(168,85,247,0.25)'  },
  other:    { color:'#38bdf8', bg:'rgba(14,165,233,0.10)',  border:'rgba(14,165,233,0.2)'   },
};

const DIFFICULTIES = [
  { value:'beginner',     label:'Beginner',     color:'#34d399' },
  { value:'intermediate', label:'Intermediate', color:'#fbbf24' },
  { value:'advanced',     label:'Advanced',     color:'#f87171' },
  { value:'all_levels',   label:'All Levels',   color:'#818cf8' },
];

const EMPTY_FORM = {
  name: '', description: '', instructor: '', class_type: 'other',
  duration_minutes: 45, difficulty: 'all_levels',
  max_capacity: 20, location: '', schedule: [],
};

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 12,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none',
  boxSizing: 'border-box',
};

const inputFocusStyle = { border: '1px solid rgba(139,92,246,0.5)', background: 'rgba(139,92,246,0.08)' };

function StyledInput({ value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}), transition: 'all 0.15s' }}
    />
  );
}

function StyledTextarea({ value, onChange, placeholder, rows = 3 }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}), transition: 'all 0.15s', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
    />
  );
}

// ── Class type picker ─────────────────────────────────────────────────────────
function TypePicker({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {CLASS_TYPES.map(t => {
        const cfg = TYPE_CFG[t.value];
        const active = value === t.value;
        return (
          <button key={t.value} onClick={() => onChange(t.value)} style={{
            padding: '10px 6px', borderRadius: 12, cursor: 'pointer', border: 'none',
            background: active ? cfg.bg : 'rgba(255,255,255,0.04)',
            outline: `1px solid ${active ? cfg.border : 'rgba(255,255,255,0.07)'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 20 }}>{t.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: active ? cfg.color : 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>{t.label}</span>
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
          <button key={d.value} onClick={() => onChange(d.value)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer', border: 'none',
            background: active ? `${d.color}18` : 'rgba(255,255,255,0.04)',
            outline: `1px solid ${active ? `${d.color}40` : 'rgba(255,255,255,0.07)'}`,
            fontSize: 11, fontWeight: 800,
            color: active ? d.color : 'rgba(255,255,255,0.3)',
            transition: 'all 0.15s',
          }}>{d.label}</button>
        );
      })}
    </div>
  );
}

// ── Schedule builder ──────────────────────────────────────────────────────────
function ScheduleBuilder({ schedule, onChange }) {
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [focusedDay, setFocusedDay] = useState(false);
  const [focusedTime, setFocusedTime] = useState(false);

  const add = () => {
    if (!day || !time) return;
    onChange([...schedule, { day, time }]);
    setDay(''); setTime('');
  };

  const remove = i => onChange(schedule.filter((_, idx) => idx !== i));

  const formatTime = t => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Add row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <select
            value={day}
            onChange={e => setDay(e.target.value)}
            onFocus={() => setFocusedDay(true)}
            onBlur={() => setFocusedDay(false)}
            style={{ ...inputStyle, ...(focusedDay ? inputFocusStyle : {}), transition: 'all 0.15s', appearance: 'none', paddingRight: 32 }}
          >
            <option value="" style={{ background: '#0d1120' }}>Day</option>
            {DAYS.map(d => <option key={d} value={d} style={{ background: '#0d1120' }}>{d}</option>)}
          </select>
          <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
        </div>
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          onFocus={() => setFocusedTime(true)}
          onBlur={() => setFocusedTime(false)}
          style={{ ...inputStyle, width: 130, ...(focusedTime ? inputFocusStyle : {}), transition: 'all 0.15s' }}
        />
        <button onClick={add} disabled={!day || !time} style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0, cursor: day && time ? 'pointer' : 'default',
          background: day && time ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${day && time ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Plus style={{ width: 16, height: 16, color: day && time ? '#a78bfa' : 'rgba(255,255,255,0.2)' }} />
        </button>
      </div>

      {/* Slots */}
      {schedule.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {schedule.map((slot, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa' }}>{DAYS_SHORT[slot.day] || slot.day}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{formatTime(slot.time)}</span>
              </div>
              <button onClick={() => remove(i)} style={{ width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                <X style={{ width: 11, height: 11, color: '#f87171' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Existing class row ────────────────────────────────────────────────────────
function ClassRow({ gymClass, onEdit, onDelete }) {
  const typeObj = CLASS_TYPES.find(t => t.value === gymClass.class_type) || CLASS_TYPES.find(t => t.value === 'other');
  const cfg = TYPE_CFG[gymClass.class_type] || TYPE_CFG.other;
  const diffObj = DIFFICULTIES.find(d => d.value === gymClass.difficulty);

  return (
    <div style={{
      borderRadius: 16, background: 'rgba(14,18,36,0.97)',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}55)` }} />
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {typeObj?.emoji || '🎯'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 4, padding: '2px 6px' }}>
              {typeObj?.label || 'Class'}
            </span>
            {diffObj && (
              <span style={{ fontSize: 9, fontWeight: 800, color: diffObj.color, background: `${diffObj.color}18`, border: `1px solid ${diffObj.color}35`, borderRadius: 4, padding: '2px 6px' }}>
                {diffObj.label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{gymClass.name}</div>
          {gymClass.instructor && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: 600 }}>{gymClass.instructor}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            {gymClass.duration_minutes && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                <Clock style={{ width: 10, height: 10 }} /> {gymClass.duration_minutes}min
              </span>
            )}
            {gymClass.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                <MapPin style={{ width: 10, height: 10 }} /> {gymClass.location}
              </span>
            )}
            {gymClass.max_capacity && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                <Users style={{ width: 10, height: 10 }} /> {gymClass.max_capacity} max
              </span>
            )}
          </div>
          {gymClass.schedule?.length > 0 && (
            <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
              {gymClass.schedule.map((s, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, padding: '2px 7px' }}>
                  {DAYS_SHORT[s.day] || s.day} {s.time ? `${(() => { const [h,m]=s.time.split(':'); const hr=parseInt(h); return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?'PM':'AM'}`; })()}` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(gymClass)} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer' }}>
            <Edit style={{ width: 13, height: 13, color: '#60a5fa' }} />
          </button>
          <button onClick={() => { if (window.confirm('Delete this class?')) onDelete(gymClass.id); }} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', cursor: 'pointer' }}>
            <Trash2 style={{ width: 13, height: 13, color: '#f87171' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function ManageClassesModal({ open, onClose, classes = [], onCreateClass, onDeleteClass, onUpdateClass, gym, isLoading }) {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const openCreate = () => { setForm(EMPTY_FORM); setEditingClass(null); setView('form'); };
  const openEdit = (c) => {
    setForm({
      name: c.name || '', description: c.description || '', instructor: c.instructor || '',
      class_type: c.class_type || 'other', duration_minutes: c.duration_minutes || 45,
      difficulty: c.difficulty || 'all_levels', max_capacity: c.max_capacity || 20,
      location: c.location || '', schedule: c.schedule || [],
    });
    setEditingClass(c);
    setView('form');
  };
  const cancel = () => { setView('list'); setEditingClass(null); setForm(EMPTY_FORM); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingClass) {
      onUpdateClass && onUpdateClass(editingClass.id, form);
    } else {
      onCreateClass && onCreateClass({ ...form, gym_id: gym?.id, gym_name: gym?.name });
    }
    cancel();
  };

  const cfg = TYPE_CFG[form.class_type] || TYPE_CFG.other;
  const typeObj = CLASS_TYPES.find(t => t.value === form.class_type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-lg w-full">
        <div style={{
          background: 'linear-gradient(160deg, #0d1120 0%, #080c1a 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
        }}>

          {/* ── Header ── */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {view === 'form' && (
                  <button onClick={cancel} style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                    <X style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.6)' }} />
                  </button>
                )}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {view === 'list' ? 'Manage Classes' : editingClass ? 'Edit Class' : 'New Class'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 3 }}>
                    {view === 'list' ? `${classes.length} class${classes.length !== 1 ? 'es' : ''}` : 'Fill in the details below'}
                  </div>
                </div>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                <X style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>

            {/* ─ LIST VIEW ─ */}
            {view === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Add button */}
                <button onClick={openCreate} style={{
                  width: '100%', padding: '13px', borderRadius: 16, cursor: 'pointer', border: 'none',
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))',
                  outline: '1px solid rgba(139,92,246,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  color: '#a78bfa', fontSize: 14, fontWeight: 800,
                }}>
                  <Plus style={{ width: 16, height: 16 }} /> Add New Class
                </button>

                {/* List */}
                {classes.length === 0 ? (
                  <div style={{ padding: '48px 20px', textAlign: 'center', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🏋️</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>No classes yet</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Tap "Add New Class" to get started</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {classes.map(c => (
                      <ClassRow key={c.id} gymClass={c} onEdit={openEdit} onDelete={onDeleteClass} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─ FORM VIEW ─ */}
            {view === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Preview strip */}
                <div style={{ borderRadius: 16, padding: '14px 14px 12px', background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 28 }}>{typeObj?.emoji || '🎯'}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{form.name || 'Class Name'}</div>
                    <div style={{ fontSize: 11, color: cfg.color, fontWeight: 700, marginTop: 2 }}>{typeObj?.label || 'Class'} {form.instructor ? `· ${form.instructor}` : ''}</div>
                  </div>
                </div>

                {/* Class type */}
                <Field label="Class Type">
                  <TypePicker value={form.class_type} onChange={v => set('class_type', v)} />
                </Field>

                {/* Name */}
                <Field label="Class Name *">
                  <StyledInput value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. HIIT Bootcamp" />
                </Field>

                {/* Description */}
                <Field label="Description">
                  <StyledTextarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What members can expect from this class..." rows={2} />
                </Field>

                {/* Instructor + Location */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Instructor *">
                    <StyledInput value={form.instructor} onChange={e => set('instructor', e.target.value)} placeholder="Coach name" />
                  </Field>
                  <Field label="Location">
                    <StyledInput value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Studio A" />
                  </Field>
                </div>

                {/* Duration + Capacity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Duration (minutes)">
                    <StyledInput type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', parseInt(e.target.value) || 0)} />
                  </Field>
                  <Field label="Max Capacity">
                    <StyledInput type="number" value={form.max_capacity} onChange={e => set('max_capacity', parseInt(e.target.value) || 0)} />
                  </Field>
                </div>

                {/* Difficulty */}
                <Field label="Difficulty">
                  <DifficultyPicker value={form.difficulty} onChange={v => set('difficulty', v)} />
                </Field>

                {/* Schedule */}
                <Field label="Schedule">
                  <ScheduleBuilder schedule={form.schedule} onChange={v => set('schedule', v)} />
                </Field>

                {/* Save + Cancel */}
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button
                    onClick={handleSave}
                    disabled={!form.name.trim() || !form.instructor.trim() || isLoading}
                    style={{
                      flex: 1, padding: '13px', borderRadius: 14, cursor: form.name && form.instructor && !isLoading ? 'pointer' : 'default',
                      border: 'none', fontSize: 14, fontWeight: 800,
                      background: form.name && form.instructor
                        ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                        : 'rgba(255,255,255,0.06)',
                      color: form.name && form.instructor ? '#fff' : 'rgba(255,255,255,0.2)',
                      boxShadow: form.name && form.instructor ? '0 4px 20px rgba(124,58,237,0.4)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                    {isLoading
                      ? (editingClass ? 'Saving...' : 'Creating...')
                      : (editingClass ? 'Save Changes' : 'Create Class')}
                  </button>
                  <button onClick={cancel} style={{ padding: '13px 20px', borderRadius: 14, cursor: 'pointer', border: 'none', fontSize: 14, fontWeight: 800, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', outline: '1px solid rgba(255,255,255,0.09)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}