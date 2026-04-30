/**
 * CreateWorkoutPlanModal — modal form for creating a new workout plan
 * Matches the coach dashboard dark design system.
 */
import React, { useState } from 'react';
import { X, Plus, Trash2, Dumbbell } from 'lucide-react';

const C = {
  bg: '#000000', card: '#141416', card2: '#1a1a1f', brd: '#222226', brd2: '#2a2a30',
  t1: '#ffffff', t2: '#8a8a94', t3: '#444450',
  cyan: '#4d7fff', cyanD: 'rgba(77,127,255,0.12)', cyanB: 'rgba(77,127,255,0.28)',
  red: '#ff4d6d', redD: 'rgba(255,77,109,0.12)', redB: 'rgba(255,77,109,0.28)',
  green: '#22c55e',
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";
const GRAD = { background: '#2563eb', border: 'none', color: '#fff' };

const WORKOUT_TYPES = ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Circuit', 'Sport-Specific'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const DIFF_COLORS = {
  Beginner: C.green, Intermediate: '#f59e0b', Advanced: C.red, Elite: '#7c3aed',
};

const inp = {
  width: '100%', boxSizing: 'border-box', padding: '10px 13px', borderRadius: 9,
  background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.brd}`,
  color: C.t1, fontSize: 13, fontFamily: FONT, outline: 'none', transition: 'border-color .15s',
};

function uid() { return Math.random().toString(36).slice(2, 9); }

export default function CreateWorkoutPlanModal({ open, onClose, onSave, isLoading }) {
  const [form, setForm] = useState({
    name: '', type: 'Strength', difficulty: 'Intermediate',
    duration_weeks: '', description: '', exercises: [],
  });
  const [exInput, setExInput] = useState('');

  if (!open) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addExercise = () => {
    const name = exInput.trim();
    if (!name) return;
    setForm(f => ({ ...f, exercises: [...f.exercises, { id: uid(), name, sets: '', reps: '' }] }));
    setExInput('');
  };

  const updateEx = (id, field, val) => setForm(f => ({
    ...f,
    exercises: f.exercises.map(e => e.id === id ? { ...e, [field]: val } : e),
  }));

  const removeEx = (id) => setForm(f => ({ ...f, exercises: f.exercises.filter(e => e.id !== id) }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      duration_weeks: form.duration_weeks ? parseInt(form.duration_weeks) : undefined,
      exercise_count: form.exercises.length,
    });
    setForm({ name: '', type: 'Strength', difficulty: 'Intermediate', duration_weeks: '', description: '', exercises: [] });
    setExInput('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', borderRadius: 16, background: C.card, border: `1px solid ${C.brd}`, boxShadow: '0 32px 80px rgba(0,0,0,0.75)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: C.cyanD, border: `1px solid ${C.cyanB}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Dumbbell style={{ width: 16, height: 16, color: C.cyan }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.t1, letterSpacing: '-0.02em' }}>Create Workout Plan</div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Build and save to your library</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: `1px solid ${C.brd}`, color: C.t3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Name */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Plan Name *</div>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. 8-Week Strength Builder" style={inp}
              onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
          </div>

          {/* Type + Difficulty */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Type</div>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                style={{ ...inp, appearance: 'none', cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd}>
                {WORKOUT_TYPES.map(t => <option key={t} value={t} style={{ background: C.card2 }}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Difficulty</div>
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}
                style={{ ...inp, appearance: 'none', cursor: 'pointer', color: DIFF_COLORS[form.difficulty] || C.t1 }}
                onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd}>
                {DIFFICULTIES.map(d => <option key={d} value={d} style={{ background: C.card2, color: DIFF_COLORS[d] }}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Duration + Description */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Duration (weeks)</div>
              <input type="number" min="1" max="52" value={form.duration_weeks} onChange={e => set('duration_weeks', e.target.value)} placeholder="e.g. 8" style={inp}
                onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Description</div>
              <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief overview of this plan…" style={inp}
                onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </div>
          </div>

          {/* Exercises */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Exercises ({form.exercises.length})</div>
            {form.exercises.map(ex => (
              <div key={ex.id} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <input value={ex.name} onChange={e => updateEx(ex.id, 'name', e.target.value)} placeholder="Exercise name" style={{ ...inp, flex: 1 }}
                  onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
                <input value={ex.sets} onChange={e => updateEx(ex.id, 'sets', e.target.value)} placeholder="Sets" style={{ ...inp, width: 60 }}
                  onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
                <span style={{ fontSize: 11, color: C.t3, fontWeight: 700, flexShrink: 0 }}>×</span>
                <input value={ex.reps} onChange={e => updateEx(ex.id, 'reps', e.target.value)} placeholder="Reps" style={{ ...inp, width: 70 }}
                  onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
                <button onClick={() => removeEx(ex.id)} style={{ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: `1px solid ${C.brd}`, color: C.t3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.redB; e.currentTarget.style.color = C.red; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; }}>
                  <Trash2 style={{ width: 11, height: 11 }} />
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={exInput} onChange={e => setExInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExercise()} placeholder="Add exercise name and press Enter" style={{ ...inp, flex: 1 }}
                onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
              <button onClick={addExercise} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, flexShrink: 0, ...GRAD }}>
                <Plus style={{ width: 11, height: 11 }} /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px 20px', borderTop: `1px solid ${C.brd}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 9, background: 'transparent', border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={handleSave} disabled={!form.name.trim() || isLoading}
            style={{ padding: '10px 22px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: form.name.trim() && !isLoading ? 'pointer' : 'not-allowed', fontFamily: FONT, opacity: form.name.trim() && !isLoading ? 1 : 0.45, ...GRAD }}>
            {isLoading ? 'Saving…' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}