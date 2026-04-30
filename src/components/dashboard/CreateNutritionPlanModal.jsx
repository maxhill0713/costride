/**
 * CreateNutritionPlanModal — modal form for creating a new nutrition plan
 * Matches the coach dashboard dark design system.
 */
import React, { useState } from 'react';
import { X, Plus, Trash2, Utensils } from 'lucide-react';

const C = {
  bg: '#000000', card: '#141416', card2: '#1a1a1f', brd: '#222226',
  t1: '#ffffff', t2: '#8a8a94', t3: '#444450',
  cyan: '#4d7fff', cyanD: 'rgba(77,127,255,0.12)', cyanB: 'rgba(77,127,255,0.28)',
  red: '#ff4d6d', redB: 'rgba(255,77,109,0.28)',
  green: '#22c55e', amber: '#f59e0b', blue: '#3b82f6',
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";
const GRAD = { background: '#2563eb', border: 'none', color: '#fff' };

const GOALS = ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Performance', 'Cutting', 'Bulking'];
const GOAL_COLORS = {
  'Weight Loss': C.red, 'Muscle Gain': C.cyan, 'Maintenance': C.green,
  'Performance': C.amber, 'Cutting': C.red, 'Bulking': C.blue,
};

const inp = {
  width: '100%', boxSizing: 'border-box', padding: '10px 13px', borderRadius: 9,
  background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.brd}`,
  color: C.t1, fontSize: 13, fontFamily: FONT, outline: 'none', transition: 'border-color .15s',
};

export default function CreateNutritionPlanModal({ open, onClose, onSave, isLoading }) {
  const [form, setForm] = useState({
    name: '', goal: 'Maintenance', description: '',
    calories: '', protein: '', carbs: '', fat: '',
    meals_per_day: '', meals: [],
  });
  const [mealInput, setMealInput] = useState('');

  if (!open) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addMeal = () => {
    const name = mealInput.trim();
    if (!name) return;
    setForm(f => ({ ...f, meals: [...f.meals, { id: Math.random().toString(36).slice(2), name }] }));
    setMealInput('');
  };

  const removeMeal = (id) => setForm(f => ({ ...f, meals: f.meals.filter(m => m.id !== id) }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      calories: form.calories ? parseInt(form.calories) : undefined,
      protein:  form.protein  ? parseInt(form.protein)  : undefined,
      carbs:    form.carbs    ? parseInt(form.carbs)    : undefined,
      fat:      form.fat      ? parseInt(form.fat)      : undefined,
      meals_per_day: form.meals_per_day ? parseInt(form.meals_per_day) : form.meals.length || undefined,
      meal_count: form.meals.length || undefined,
    });
    setForm({ name: '', goal: 'Maintenance', description: '', calories: '', protein: '', carbs: '', fat: '', meals_per_day: '', meals: [] });
    setMealInput('');
  };

  const goalColor = GOAL_COLORS[form.goal] || C.t1;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', borderRadius: 16, background: C.card, border: `1px solid ${C.brd}`, boxShadow: '0 32px 80px rgba(0,0,0,0.75)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(34,197,94,0.12)', border: `1px solid rgba(34,197,94,0.28)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils style={{ width: 16, height: 16, color: C.green }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.t1, letterSpacing: '-0.02em' }}>Create Nutrition Plan</div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Set macros, meals and goals</div>
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
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Fat Loss Phase 1" style={inp}
              onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
          </div>

          {/* Goal + Meals/day */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Goal</div>
              <select value={form.goal} onChange={e => set('goal', e.target.value)}
                style={{ ...inp, appearance: 'none', cursor: 'pointer', color: goalColor }}
                onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd}>
                {GOALS.map(g => <option key={g} value={g} style={{ background: C.card2, color: GOAL_COLORS[g] || C.t1 }}>{g}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Meals/Day</div>
              <input type="number" min="1" max="10" value={form.meals_per_day} onChange={e => set('meals_per_day', e.target.value)} placeholder="e.g. 5" style={inp}
                onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Description</div>
            <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief overview of this nutrition plan…" style={inp}
              onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
          </div>

          {/* Macros */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Daily Macros</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[
                { key: 'calories', label: 'Calories', placeholder: 'kcal', color: C.amber },
                { key: 'protein',  label: 'Protein',  placeholder: 'g',    color: C.cyan  },
                { key: 'carbs',    label: 'Carbs',    placeholder: 'g',    color: C.green },
                { key: 'fat',      label: 'Fat',      placeholder: 'g',    color: C.red   },
              ].map(m => (
                <div key={m.key}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{m.label}</div>
                  <input type="number" min="0" value={form[m.key]} onChange={e => set(m.key, e.target.value)} placeholder={m.placeholder}
                    style={{ ...inp, fontSize: 12, padding: '8px 10px' }}
                    onFocus={e => e.target.style.borderColor = m.color + '80'} onBlur={e => e.target.style.borderColor = C.brd} />
                </div>
              ))}
            </div>
            {/* Live macro bar */}
            {(parseInt(form.protein) || parseInt(form.carbs) || parseInt(form.fat)) ? (() => {
              const p = parseInt(form.protein) || 0, c2 = parseInt(form.carbs) || 0, f = parseInt(form.fat) || 0;
              const total = p + c2 + f || 1;
              return (
                <div style={{ marginTop: 10, height: 5, borderRadius: 99, overflow: 'hidden', display: 'flex', gap: 1 }}>
                  <div style={{ flex: p, background: C.cyan, opacity: .8, minWidth: p > 0 ? 3 : 0 }} />
                  <div style={{ flex: c2, background: C.green, opacity: .8, minWidth: c2 > 0 ? 3 : 0 }} />
                  <div style={{ flex: f, background: C.red, opacity: .8, minWidth: f > 0 ? 3 : 0 }} />
                </div>
              );
            })() : null}
          </div>

          {/* Meals list */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Meal Names ({form.meals.length})</div>
            {form.meals.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {form.meals.map(m => (
                  <span key={m.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.brd}`, fontSize: 12, color: C.t2 }}>
                    {m.name}
                    <button onClick={() => removeMeal(m.id)} style={{ background: 'none', border: 'none', color: C.t3, cursor: 'pointer', display: 'flex', padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = C.red} onMouseLeave={e => e.currentTarget.style.color = C.t3}>
                      <X style={{ width: 10, height: 10 }} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={mealInput} onChange={e => setMealInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMeal()} placeholder="e.g. Breakfast, Pre-workout, Lunch…" style={{ ...inp, flex: 1 }}
                onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
              <button onClick={addMeal} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, flexShrink: 0, ...GRAD }}>
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