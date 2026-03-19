import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
 X, Trophy, Users, Flame, Calendar, Gift,
 ChevronDown, CheckCircle, Zap, Target, Dumbbell,
 BarChart2, Shield, Eye,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

// Design tokens 
const T = {
 blue: '#0ea5e9', green: '#10b981', red: '#ef4444',
 amber: '#f59e0b', purple: '#8b5cf6',
 text1: '#f0f4f8', text2: '#94a3b8', text3: '#475569',
 border: 'rgba(255,255,255,0.07)', borderM: 'rgba(255,255,255,0.11)',
 card: '#0b1120', card2: '#0d1630', divider: 'rgba(255,255,255,0.05)',
 bg: '#060c18',
};

function Shimmer({ color = T.amber }) {
 return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}35,transparent)`, pointerEvents: 'none' }} />;
}

// Challenge catalogue 
const CATEGORIES = [
 { value: 'lifting', label: 'Lifting', color: T.purple, desc: 'Track weight lifted' },
 { value: 'attendance', label: 'Attendance', color: T.blue, desc: 'Most check-ins wins' },
 { value: 'streak', label: 'Streak', color: T.amber, desc: 'Longest consecutive days' },
 { value: 'cardio', label: 'Cardio', color: T.green, desc: 'Distance or time tracked' },
];

const TYPES = [
 { value: 'individual', label: 'Individual', icon: Target, desc: 'Each member competes solo' },
 { value: 'team', label: 'Team', icon: Users, desc: 'Divided into competing teams' },
 { value: 'gym_vs_gym', label: 'Gym vs Gym', icon: Shield, desc: 'Two gyms go head to head' },
 { value: 'community', label: 'Community', icon: Flame, desc: 'Everyone works toward one goal' },
];

const EXERCISES = [
 'Bench Press','Squat','Deadlift','Overhead Press','Barbell Row',
 'Power Clean','Snatch','Front Squat','Romanian Deadlift','Pull-up',
];

const GOAL_TYPES = [
 { value: 'total_weight', label: 'Total Weight Lifted' },
 { value: 'total_reps', label: 'Total Reps' },
 { value: 'max_weight', label: 'Max Weight (1RM)' },
];

function categoryFor(val) { return CATEGORIES.find(c => c.value === val) || CATEGORIES[0]; }
function typeFor(val) { return TYPES.find(t => t.value === val) || TYPES[0]; }

// Shared input components 
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

function Inp({ value, onChange, placeholder, type = 'text', icon: Icon, accentColor = T.amber, min }) {
 const [focus, setFocus] = useState(false);
 return (
 <div style={{ position: 'relative' }}>
 {Icon && <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Icon style={{ width: 12, height: 12, color: focus ? accentColor : T.text3, transition: 'color 0.15s' }} /></div>}
 <input type={type} value={value} onChange={onChange} placeholder={placeholder} min={min}
 onFocus={e => { setFocus(true); e.target.style.borderColor = `${accentColor}45`; e.target.style.background = `${accentColor}06`; }}
 onBlur={e => { setFocus(false); e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
 style={{ ...baseInput, paddingLeft: Icon ? 33 : 13 }} />
 </div>
 );
}

function Textarea({ value, onChange, placeholder, rows = 3, accentColor = T.amber }) {
 return (
 <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
 onFocus={e => { e.target.style.borderColor = `${accentColor}45`; e.target.style.background = `${accentColor}06`; }}
 onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
 style={{ ...baseInput, resize: 'none', lineHeight: 1.65 }} />
 );
}

function Select({ value, onChange, children, accentColor = T.amber }) {
 return (
 <div style={{ position: 'relative' }}>
 <select value={value} onChange={onChange}
 onFocus={e => { e.target.style.borderColor = `${accentColor}45`; e.target.style.background = `${accentColor}06`; }}
 onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
 style={{ ...baseInput, appearance: 'none', paddingRight: 34, cursor: 'pointer' }}>
 {children}
 </select>
 <ChevronDown style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: T.text3, pointerEvents: 'none' }} />
 </div>
 );
}

// Category picker 
function CategoryPicker({ value, onChange }) {
 return (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
 {CATEGORIES.map(cat => {
 const active = value === cat.value;
 return (
 <button key={cat.value} onClick={() => onChange(cat.value)} type="button"
 style={{ padding: '11px 6px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${active ? cat.color + '35' : T.border}`, background: active ? `${cat.color}12` : T.divider, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: 'all 0.15s', fontFamily: 'inherit' }}>
  <span style={{ fontSize: 10, fontWeight: active ? 800 : 500, color: active ? cat.color : T.text3, transition: 'color 0.15s' }}>{cat.label}</span>
 </button>
 );
 })}
 </div>
 );
}

// Type selector (radio-style) 
function TypePicker({ value, onChange }) {
 return (
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
 {TYPES.map(t => {
 const active = value === t.value;
 const Icon = t.icon;
 return (
 <button key={t.value} onClick={() => onChange(t.value)} type="button"
 style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${active ? T.amber + '35' : T.border}`, background: active ? `${T.amber}10` : T.divider, display: 'flex', alignItems: 'center', gap: 9, transition: 'all 0.15s', fontFamily: 'inherit', textAlign: 'left' }}>
 <div style={{ width: 26, height: 26, borderRadius: 7, background: active ? `${T.amber}18` : 'rgba(255,255,255,0.06)', border: `1px solid ${active ? T.amber + '30' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
 <Icon style={{ width: 12, height: 12, color: active ? T.amber : T.text3, transition: 'color 0.15s' }} />
 </div>
 <div>
 <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? T.text1 : T.text2, transition: 'color 0.15s' }}>{t.label}</div>
 <div style={{ fontSize: 9, color: T.text3, marginTop: 1 }}>{t.desc}</div>
 </div>
 </button>
 );
 })}
 </div>
 );
}

// Live challenge card preview 
function ChallengePreview({ form, gyms }) {
 const cat = categoryFor(form.category);
 const typ = typeFor(form.type);
 const TypeIcon = typ.icon;
 const hasContent = form.title || form.start_date;

 const durationDays = useMemo(() => {
 if (!form.start_date || !form.end_date) return null;
 try { return differenceInDays(parseISO(form.end_date), parseISO(form.start_date)); }
 catch { return null; }
 }, [form.start_date, form.end_date]);

 return (
 <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
 {/* Preview label */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
 <div style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, boxShadow: `0 0 6px ${cat.color}` }} />
 <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
 </div>

 {/* Challenge card */}
 <div style={{ borderRadius: 12, background: T.card2, border: `1px solid ${cat.color}22`, overflow: 'hidden', position: 'relative' }}>
 <Shimmer color={cat.color} />
 <div style={{ height: 3, background: `linear-gradient(90deg,${cat.color},${cat.color}50)` }} />

 <div style={{ padding: '16px 16px 14px' }}>
 {!hasContent ? (
 <div style={{ textAlign: 'center', padding: '24px 0' }}>
  <div style={{ fontSize: 12, color: T.text3, fontWeight: 500, marginTop: 8 }}>Fill in details to preview</div>
 </div>
 ) : (
 <>
 {/* Header badges */}
 <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
 <span style={{ fontSize: 9, fontWeight: 800, color: cat.color, background: `${cat.color}14`, border: `1px solid ${cat.color}28`, borderRadius: 5, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
  {cat.label}
 </span>
 <span style={{ fontSize: 9, fontWeight: 700, color: T.amber, background: `${T.amber}10`, border: `1px solid ${T.amber}22`, borderRadius: 5, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 3 }}>
 <TypeIcon style={{ width: 8, height: 8 }} /> {typ.label}
 </span>
 {form.status === 'active' && <span style={{ fontSize: 9, fontWeight: 700, color: T.green, background: `${T.green}10`, border: `1px solid ${T.green}22`, borderRadius: 5, padding: '2px 7px' }}> Live</span>}
 </div>

 {/* Title */}
 <div style={{ fontSize: 16, fontWeight: 800, color: T.text1, letterSpacing: '-0.025em', marginBottom: form.description ? 8 : 12, lineHeight: 1.25 }}>
 {form.title || 'Challenge Title'}
 </div>

 {/* Description */}
 {form.description && (
 <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
 {form.description}
 </div>
 )}

 {/* Goal detail */}
 {form.category === 'lifting' && form.exercise && (
 <div style={{ padding: '8px 11px', borderRadius: 8, background: `${cat.color}08`, border: `1px solid ${cat.color}18`, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
 <Dumbbell style={{ width: 11, height: 11, color: cat.color, flexShrink: 0 }} />
 <span style={{ fontSize: 11, color: T.text2, fontWeight: 500 }}>
 {form.exercise.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
 {form.goal_type ? ` · ${GOAL_TYPES.find(g => g.value === form.goal_type)?.label}` : ''}
 </span>
 </div>
 )}
 {(form.category === 'attendance' || form.category === 'streak') && form.target_value > 0 && (
 <div style={{ padding: '8px 11px', borderRadius: 8, background: `${cat.color}08`, border: `1px solid ${cat.color}18`, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
 <Target style={{ width: 11, height: 11, color: cat.color, flexShrink: 0 }} />
 <span style={{ fontSize: 11, color: T.text2 }}>
 Target: <strong style={{ color: cat.color }}>{form.target_value}</strong> {form.category === 'streak' ? 'consecutive days' : 'check-ins'}
 </span>
 </div>
 )}

 {/* Date range */}
 {(form.start_date || form.end_date) && (
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: form.reward ? 10 : 0, padding: '8px 11px', borderRadius: 8, background: T.divider, border: `1px solid ${T.border}` }}>
 <Calendar style={{ width: 10, height: 10, color: T.text3, flexShrink: 0 }} />
 <span style={{ fontSize: 11, color: T.text2, fontWeight: 500 }}>
 {form.start_date ? format(parseISO(form.start_date), 'MMM d') : '?'}
 {' → '}
 {form.end_date ? format(parseISO(form.end_date), 'MMM d, yyyy') : '?'}
 </span>
 {durationDays != null && durationDays > 0 && (
 <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: T.text3 }}>{durationDays}d</span>
 )}
 </div>
 )}

 {/* Reward */}
 {form.reward && (
 <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', borderRadius: 8, background: `${T.amber}08`, border: `1px solid ${T.amber}18` }}>
 <Gift style={{ width: 11, height: 11, color: T.amber, flexShrink: 0 }} />
 <span style={{ fontSize: 11, color: T.text2 }}>{form.reward}</span>
 </div>
 )}

 {/* Participants placeholder */}
 <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <span style={{ fontSize: 11, color: T.text3 }}>0 participants</span>
 <span style={{ fontSize: 10, fontWeight: 700, color: T.amber, background: `${T.amber}10`, border: `1px solid ${T.amber}22`, borderRadius: 6, padding: '2px 8px' }}>Upcoming</span>
 </div>
 </>
 )}
 </div>
 </div>

 {/* Gym vs Gym matchup strip */}
 {form.type === 'gym_vs_gym' && form.gym_id && form.competing_gym_id && (
 <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: T.card2, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
 <span style={{ fontSize: 11, fontWeight: 700, color: T.text1 }}>{gyms.find(g => g.id === form.gym_id)?.name || 'Home Gym'}</span>
 <span style={{ fontSize: 13, fontWeight: 800, color: T.amber }}>VS</span>
 <span style={{ fontSize: 11, fontWeight: 700, color: T.text1 }}>{gyms.find(g => g.id === form.competing_gym_id)?.name || 'Away Gym'}</span>
 </div>
 )}
 </div>
 );
}

// 
const DEFAULT_FORM = {
 title: '', description: '', type: 'individual', category: 'lifting',
 gym_id: '', gym_name: '', competing_gym_id: '', competing_gym_name: '',
 exercise: 'Bench Press', goal_type: 'total_weight', target_value: 0,
 start_date: new Date().toISOString().split('T')[0], end_date: '',
 status: 'upcoming', reward: '', auto_start: true, send_reminders: true,
};

export default function CreateChallengeModal({ open, onClose, gyms = [], onSave, isLoading }) {
 const [form, setForm] = useState(DEFAULT_FORM);
 const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

 const cat = categoryFor(form.category);
 const canSave = form.title.trim() && form.end_date && !isLoading;

 const handleCategoryChange = (val) => {
 const updates = { category: val };
 if (val === 'lifting') updates.goal_type = 'total_weight';
 if (val === 'attendance') updates.goal_type = 'most_check_ins';
 if (val === 'streak') updates.goal_type = 'longest_streak';
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

 if (!open) return null;

 return (
 <>
 <style>{`
 @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');
 @keyframes ch-overlay { from { opacity: 0 } to { opacity: 1 } }
 @keyframes ch-modal { from { opacity: 0; transform: scale(0.97) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
 @keyframes ch-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
 .ch-body::-webkit-scrollbar { width: 3px } .ch-body::-webkit-scrollbar-track { background: transparent } .ch-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px }
 .ch-save:not(:disabled):hover { opacity: 0.9; transform: translateY(-1px); }
 .ch-save:not(:disabled):active { transform: translateY(0); }
 .ch-cancel:hover { background: rgba(255,255,255,0.08) !important; color: #f0f4f8 !important; }
 `}</style>

 {/* Overlay */}
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,5,20,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'ch-overlay 0.18s ease', fontFamily: "'DM Sans', system-ui, sans-serif" }}
 onClick={e => e.target === e.currentTarget && handleClose()}>

 {/* Modal */}
 <div style={{ width: '100%', maxWidth: 860, maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#07101f', border: `1px solid ${T.borderM}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.04) inset', animation: 'ch-modal 0.22s cubic-bezier(0.34,1.4,0.64,1)' }}>

 {/* Header */}
 <div style={{ flexShrink: 0, padding: '18px 24px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
 <Shimmer color={cat.color} />
 <div style={{ position: 'absolute', top: -40, left: -20, width: 180, height: 100, borderRadius: '50%', background: cat.color, opacity: 0.04, filter: 'blur(40px)', pointerEvents: 'none', transition: 'background 0.3s' }} />
 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
 <div style={{ width: 38, height: 38, borderRadius: 11, background: `${cat.color}14`, border: `1px solid ${cat.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, transition: 'all 0.2s' }}>
 
 </div>
 <div>
 <div style={{ fontSize: 16, fontWeight: 800, color: T.text1, letterSpacing: '-0.025em' }}>Create Challenge</div>
 <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>Set up a competition for your members</div>
 </div>
 </div>
 <button onClick={handleClose}
 style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all 0.15s', color: T.text3 }}
 onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = T.text1; }}
 onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = T.text3; }}>
 <X style={{ width: 14, height: 14 }} />
 </button>
 </div>

 {/* Body — two columns */}
 <form onSubmit={handleSubmit} style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 0, overflow: 'hidden' }}>

 {/* Left — form */}
 <div className="ch-body" style={{ padding: '20px 24px', borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>

 {/* Category */}
 <Field label="Category">
 <CategoryPicker value={form.category} onChange={handleCategoryChange} />
 </Field>

 {/* Title */}
 <Field label="Challenge title" required>
 <Inp value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Squat Showdown" icon={Trophy} accentColor={cat.color} />
 </Field>

 {/* Description */}
 <Field label="Description">
 <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the rules, what counts, and who can enter…" rows={3} accentColor={cat.color} />
 </Field>

 {/* Competition type */}
 <Field label="Competition type">
 <TypePicker value={form.type} onChange={v => set('type', v)} />
 </Field>

 {/* Gym vs Gym selectors */}
 {form.type === 'gym_vs_gym' && (
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 <Field label="Home gym" required>
 <Select value={form.gym_id} onChange={e => { const g = gyms.find(x => x.id === e.target.value); set('gym_id', e.target.value); set('gym_name', g?.name || ''); }} accentColor={cat.color}>
 <option value="" style={{ background: '#0d1120' }}>Select gym</option>
 {gyms.map(g => <option key={g.id} value={g.id} style={{ background: '#0d1120' }}>{g.name}</option>)}
 </Select>
 </Field>
 <Field label="vs. gym" required>
 <Select value={form.competing_gym_id} onChange={e => { const g = gyms.find(x => x.id === e.target.value); set('competing_gym_id', e.target.value); set('competing_gym_name', g?.name || ''); }} accentColor={cat.color}>
 <option value="" style={{ background: '#0d1120' }}>Select gym</option>
 {gyms.map(g => <option key={g.id} value={g.id} style={{ background: '#0d1120' }}>{g.name}</option>)}
 </Select>
 </Field>
 </div>
 )}

 {/* Lifting-specific options */}
 {form.category === 'lifting' && (
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 <Field label="Exercise">
 <Select value={form.exercise} onChange={e => set('exercise', e.target.value)} accentColor={cat.color}>
 {EXERCISES.map(ex => <option key={ex} value={ex} style={{ background: '#0d1120' }}>{ex}</option>)}
 </Select>
 </Field>
 <Field label="Goal type">
 <Select value={form.goal_type} onChange={e => set('goal_type', e.target.value)} accentColor={cat.color}>
 {GOAL_TYPES.map(g => <option key={g.value} value={g.value} style={{ background: '#0d1120' }}>{g.label}</option>)}
 </Select>
 </Field>
 </div>
 )}

 {/* Attendance / streak target */}
 {(form.category === 'attendance' || form.category === 'streak') && (
 <Field label={form.category === 'streak' ? 'Streak target (days)' : 'Check-in target'}
 hint={form.category === 'streak' ? 'Members aim to hit this consecutive streak' : 'Number of check-ins to win or qualify'}>
 <Inp type="number" value={form.target_value} onChange={e => set('target_value', parseInt(e.target.value) || 0)} placeholder={form.category === 'streak' ? '30' : '20'} icon={Target} accentColor={cat.color} min="1" />
 </Field>
 )}

 {/* Date range */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 <Field label="Start date" required>
 <Inp type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} icon={Calendar} accentColor={cat.color} />
 </Field>
 <Field label="End date" required>
 <Inp type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} icon={Calendar} accentColor={cat.color} />
 </Field>
 </div>

 {/* Reward */}
 <Field label="Reward" hint="Optional — shown to members as the prize for winning">
 <Inp value={form.reward} onChange={e => set('reward', e.target.value)} placeholder="e.g. Free protein shake, £10 gift card" icon={Gift} accentColor={cat.color} />
 </Field>

 {/* Toggles */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
 {[
 { key: 'auto_start', label: 'Auto-start', sub: 'Begins on start date automatically' },
 { key: 'send_reminders', label: 'Send reminders',sub: 'Notify participants weekly' },
 ].map(toggle => (
 <div key={toggle.key} onClick={() => set(toggle.key, !form[toggle.key])}
 style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: form[toggle.key] ? `${cat.color}08` : T.divider, border: `1px solid ${form[toggle.key] ? cat.color + '22' : T.border}`, cursor: 'pointer', transition: 'all 0.15s' }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: form[toggle.key] ? T.text1 : T.text2 }}>{toggle.label}</div>
 <div style={{ fontSize: 9, color: T.text3, marginTop: 1 }}>{toggle.sub}</div>
 </div>
 <div style={{ flexShrink: 0, width: 36, height: 20, borderRadius: 99, background: form[toggle.key] ? cat.color : 'rgba(255,255,255,0.1)', transition: 'background 0.2s', position: 'relative' }}>
 <div style={{ position: 'absolute', top: 2, left: form[toggle.key] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Right — live preview */}
 <div style={{ padding: '20px 18px', background: T.bg, overflowY: 'auto' }}>
 <ChallengePreview form={form} gyms={gyms} />
 </div>
 </form>

 {/* Footer */}
 <div style={{ flexShrink: 0, padding: '14px 24px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, background: '#07101f' }}>
 <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
 {canSave ? (
 <>
 <CheckCircle style={{ width: 12, height: 12, color: T.green, flexShrink: 0 }} />
 <span style={{ fontSize: 11, color: T.text3 }}>
 {form.title}
 {form.end_date ? ` · ends ${format(parseISO(form.end_date), 'MMM d')}` : ''}
 {form.reward ? ` · ${form.reward}` : ''}
 </span>
 </>
 ) : (
 <span style={{ fontSize: 11, color: T.text3 }}>
 {!form.title.trim() ? 'Add a challenge title to continue' : 'Set an end date to continue'}
 </span>
 )}
 </div>
 <button className="ch-cancel" onClick={handleClose}
 style={{ padding: '10px 20px', borderRadius: 10, background: T.divider, color: T.text2, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
 Cancel
 </button>
 <button className="ch-save" type="submit" onClick={handleSubmit} disabled={!canSave}
 style={{ padding: '10px 24px', borderRadius: 10, background: canSave ? `linear-gradient(135deg,${cat.color},${cat.color}cc)` : 'rgba(255,255,255,0.06)', color: canSave ? '#fff' : T.text3, border: 'none', fontSize: 12, fontWeight: 800, cursor: canSave ? 'pointer' : 'default', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s', letterSpacing: '-0.01em', boxShadow: canSave ? `0 4px 16px ${cat.color}35` : 'none', minWidth: 160, justifyContent: 'center' }}>
 {isLoading
 ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'ch-spin 0.7s linear infinite' }} /> Creating…</>
 : <>Create Challenge</>
 }
 </button>
 </div>
 </div>
 </div>
 </>
 );
}
