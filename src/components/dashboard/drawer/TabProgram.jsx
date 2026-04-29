import React, { useState } from 'react';
import { Dumbbell, Plus, X, Utensils, Calendar, ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react';
import { C, FONT, Card, SectionLabel, ProgressBar } from './DrawerShared';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const INIT_WORKOUT = {
  Mon: { label: 'Upper Strength', exercises: [
    { name: 'Bench Press', sets: 4, reps: '8', weight: '47.5kg' },
    { name: 'DB Row', sets: 4, reps: '10', weight: '22kg' },
    { name: 'Shoulder Press', sets: 3, reps: '10', weight: '20kg' },
  ]},
  Wed: { label: 'Lower Strength', exercises: [
    { name: 'Squat', sets: 4, reps: '6', weight: '60kg' },
    { name: 'Romanian DL', sets: 3, reps: '10', weight: '50kg' },
    { name: 'Leg Press', sets: 3, reps: '12', weight: '100kg' },
  ]},
  Fri: { label: 'Full Body HIIT', exercises: [
    { name: 'Burpees', sets: 4, reps: '15', weight: 'BW' },
    { name: 'KB Swings', sets: 4, reps: '20', weight: '16kg' },
    { name: 'Box Jumps', sets: 3, reps: '10', weight: 'BW' },
  ]},
};

const NUTRITION_PLAN = {
  calories: 1720,
  protein: 140,
  carbs: 200,
  fat: 60,
  meals: [
    { name: 'Breakfast', items: 'Oats (80g) · Whey protein (1 scoop) · Banana' },
    { name: 'Lunch',     items: 'Chicken breast (180g) · Brown rice (150g) · Mixed veg' },
    { name: 'Snack',     items: 'Greek yogurt (200g) · Berries · Almonds (20g)' },
    { name: 'Dinner',    items: 'Salmon (180g) · Sweet potato (200g) · Broccoli' },
  ],
};

function ExRow({ ex, onDelete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, background: C.card2, border: `1px solid ${C.brd}`, marginBottom: 6 }}>
      <Dumbbell style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: C.t1 }}>{ex.name}</span>
      <span style={{ fontSize: 11, color: C.t3, padding: '2px 7px', borderRadius: 5, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan, fontWeight: 700, whiteSpace: 'nowrap' }}>{ex.sets}×{ex.reps}</span>
      <span style={{ fontSize: 11, color: C.t3, minWidth: 40, textAlign: 'right' }}>{ex.weight}</span>
      {onDelete && <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X style={{ width: 11, height: 11, color: C.t3 }} /></button>}
    </div>
  );
}

export default function TabProgram({ client, onMessage }) {
  const [activeView, setActiveView] = useState('workout'); // workout | nutrition
  const [schedule, setSchedule] = useState(INIT_WORKOUT);
  const [openDay, setOpenDay] = useState('Mon');

  const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayLabels = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* View switcher */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[{ id: 'workout', label: 'Workout Plan', icon: Dumbbell }, { id: 'nutrition', label: 'Nutrition Plan', icon: Utensils }].map(v => {
          const Icon = v.icon;
          const on = activeView === v.id;
          return (
            <button key={v.id} onClick={() => setActiveView(v.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, background: on ? C.cyan : C.card, border: `1px solid ${on ? C.cyanB : C.brd}`, color: on ? '#fff' : C.t3, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, transition: 'all .15s' }}>
              <Icon style={{ width: 13, height: 13 }} />{v.label}
            </button>
          );
        })}
      </div>

      {activeView === 'workout' && (
        <>
          {/* Weekly schedule */}
          <Card>
            <SectionLabel>Weekly Schedule</SectionLabel>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {dayKeys.map(d => {
                const hasSession = !!schedule[d];
                return (
                  <button key={d} onClick={() => setOpenDay(d)}
                    style={{ flex: 1, padding: '8px 4px', borderRadius: 9, background: openDay === d ? C.cyan : hasSession ? C.cyanD : C.card2, border: `1px solid ${openDay === d ? C.cyanB : hasSession ? C.cyanB : C.brd}`, color: openDay === d ? '#fff' : hasSession ? C.cyan : C.t3, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, textAlign: 'center', transition: 'all .15s' }}>
                    {d}
                    <div style={{ marginTop: 4, fontSize: 9, opacity: 0.7 }}>{hasSession ? '●' : '·'}</div>
                  </button>
                );
              })}
            </div>

            {/* Day detail */}
            {schedule[openDay] ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 14 }}>{dayLabels[openDay]} — {schedule[openDay].label}</div>
                {schedule[openDay].exercises.map((ex, i) => (
                  <ExRow key={i} ex={ex} />
                ))}
                <button
                  onClick={() => {
                    const name = prompt('Exercise name:');
                    if (!name) return;
                    setSchedule(p => ({ ...p, [openDay]: { ...p[openDay], exercises: [...p[openDay].exercises, { name, sets: 3, reps: '10', weight: 'BW' }] } }));
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'transparent', border: `1px dashed ${C.brd2}`, color: C.t3, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                  <Plus style={{ width: 11, height: 11 }} /> Add exercise
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 12.5, color: C.t3, marginBottom: 14 }}>{dayLabels[openDay]} — Rest day</div>
                <button
                  onClick={() => setSchedule(p => ({ ...p, [openDay]: { label: 'New Session', exercises: [] } }))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                  <Plus style={{ width: 12, height: 12 }} /> Add Session
                </button>
              </div>
            )}
          </Card>

          {/* Current plan summary */}
          <Card>
            <SectionLabel>Plan Summary</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Sessions/wk', val: Object.keys(schedule).length },
                { label: 'Total exercises', val: Object.values(schedule).reduce((s, d) => s + d.exercises.length, 0) },
                { label: 'Programme week', val: '4 of 8' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: 10, background: C.card2, border: `1px solid ${C.brd}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: C.t3, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {activeView === 'nutrition' && (
        <>
          {/* Targets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Calories', val: `${NUTRITION_PLAN.calories}`, unit: 'kcal', col: C.amber },
              { label: 'Protein',  val: `${NUTRITION_PLAN.protein}g`,  unit: '/day', col: C.cyan },
              { label: 'Carbs',    val: `${NUTRITION_PLAN.carbs}g`,    unit: '/day', col: C.violet },
              { label: 'Fat',      val: `${NUTRITION_PLAN.fat}g`,      unit: '/day', col: C.green },
            ].map((m, i) => (
              <Card key={i} style={{ padding: '18px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: m.col, letterSpacing: '-0.04em', lineHeight: 1 }}>{m.val}</div>
                <div style={{ fontSize: 10, color: C.t3, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
                <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>{m.unit}</div>
              </Card>
            ))}
          </div>

          {/* Meal plan */}
          <Card>
            <SectionLabel>Meal Plan</SectionLabel>
            {NUTRITION_PLAN.meals.map((meal, i) => (
              <div key={i} style={{ paddingTop: 16, paddingBottom: 16, borderBottom: i < NUTRITION_PLAN.meals.length - 1 ? `1px solid ${C.brd}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{meal.name}</span>
                  <Utensils style={{ width: 12, height: 12, color: C.t3 }} />
                </div>
                <div style={{ fontSize: 12.5, color: C.t3, lineHeight: 1.6 }}>{meal.items}</div>
              </div>
            ))}
            <button onClick={() => onMessage({ ...client, _action: 'Update Nutrition' })}
              style={{ width: '100%', marginTop: 18, padding: '11px', borderRadius: 10, background: C.greenD, border: `1px solid ${C.greenB}`, color: C.green, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
              Update Nutrition Plan
            </button>
          </Card>
        </>
      )}
    </div>
  );
}