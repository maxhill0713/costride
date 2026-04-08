import React, { useState, useMemo, useRef, useEffect } from 'react';

// Module-level set — tracks which tabs have animated this session
const animatedTabs = new Set();

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Plus, Target, CheckCircle, BarChart3, ClipboardList,
  ChevronRight, ChevronDown, Trophy, TrendingUp, Flame,
  CalendarDays, User, Send, X, BadgeCheck, Utensils,
  Droplets, Zap, ScanBarcode,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import ExerciseInsights from '../components/profile/ExerciseInsights';
import WorkoutSplitHeatmap from '../components/profile/WorkoutSplitHeatmap';
import ProgressiveOverloadTracker from '../components/profile/ProgressiveOverloadTracker';
import WeeklyVolumeChart from '../components/profile/WeeklyVolumeChart';
import BarcodeScannerModal from '../components/nutrition/BarcodeScannerModal';

// ─── Shared styles ────────────────────────────────────────────────────────────
const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const btnNewGoal =
  'bg-slate-900/80 border border-slate-500/50 text-slate-400 font-bold rounded-full px-4 py-2 flex items-center gap-1.5 justify-center shadow-[0_5px_0_0_#172033,0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu';

const sectionTitle = {
  fontSize: 24, fontWeight: 700, color: '#e2e8f0',
  letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2,
};

// ─────────────────────────────────────────────────────────────────────────────
// NUTRITION TAB
// ─────────────────────────────────────────────────────────────────────────────

const NUTRITION_BASE = {
  calories: { target: 2400, consumed: 1620 },
  protein:  { target: 180,  consumed: 112  },
  carbs:    { target: 260,  consumed: 198  },
  fats:     { target: 70,   consumed: 41   },
  water:    { glasses: 5, target: 8 },
  streak:   4,
  weekDays: [true, true, false, true, true, false, false],
};

const MEAL_PRESETS = {
  Breakfast: [
    { name: 'Oat porridge + berries', cal: 340, protein: 12, carbs: 56, fat: 6  },
    { name: 'Greek yoghurt',           cal: 150, protein: 17, carbs: 9,  fat: 4  },
    { name: 'Eggs (3 large)',          cal: 210, protein: 18, carbs: 1,  fat: 15 },
    { name: 'Banana',                  cal: 90,  protein: 1,  carbs: 23, fat: 0  },
  ],
  Lunch: [
    { name: 'Chicken & rice bowl', cal: 490, protein: 42, carbs: 58, fat: 8  },
    { name: 'Salmon fillet',        cal: 280, protein: 34, carbs: 0,  fat: 16 },
    { name: 'Rice (200g)',          cal: 260, protein: 5,  carbs: 56, fat: 1  },
  ],
  Dinner: [
    { name: 'Chicken breast',  cal: 310, protein: 45, carbs: 0,  fat: 12 },
    { name: 'Pasta bolognese', cal: 520, protein: 28, carbs: 62, fat: 14 },
    { name: 'Steak + veg',     cal: 480, protein: 50, carbs: 12, fat: 22 },
  ],
  Snacks: [
    { name: 'Protein bar',     cal: 210, protein: 20, carbs: 22, fat: 7  },
    { name: 'Rice cakes x3',   cal: 90,  protein: 2,  carbs: 20, fat: 1  },
    { name: 'Handful almonds', cal: 175, protein: 6,  carbs: 6,  fat: 15 },
  ],
};

const QUICK_ADD_OPTIONS = [
  { key: 'shake',  label: 'Protein shake', sub: '30g protein · 180 kcal', cal: 180, protein: 30, carbs: 6,  fat: 3  },
  { key: 'cal500', label: '500 calories',  sub: 'Quick energy boost',     cal: 500, protein: 20, carbs: 60, fat: 18 },
];

const MEAL_ICONS = { Breakfast: '☀', Lunch: '⛅', Dinner: '◑', Snacks: '◇' };

// Nutrition card style — matches CARD from analytics tab
const nutCard = {
  ...CARD,
  borderRadius: 16,
  padding: '18px',
  marginBottom: 12,
};

const nutLabel = {
  fontSize: 11,
  color: 'rgba(148,163,184,0.7)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 12,
  display: 'block',
  fontWeight: 600,
};

function CalorieRing({ consumed, target }) {
  const pct  = Math.min(Math.round((consumed / target) * 100), 100);
  const r    = 38;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
  const fill = arc * (pct / 100);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <svg width={96} height={96} style={{ display: 'block' }}>
        <circle cx={48} cy={48} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={7}
          strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round"
          transform="rotate(135 48 48)" />
        <circle cx={48} cy={48} r={r} fill="none"
          stroke="#38bdf8" strokeWidth={7}
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          transform="rotate(135 48 48)"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)', filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.5))' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 20, fontWeight: 600, lineHeight: 1, color: '#e2e8f0' }}>{pct}%</span>
        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>of goal</span>
      </div>
    </div>
  );
}

function MacroBar({ label, current, target, color }) {
  const pct = Math.min(Math.round((current / target) * 100), 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.8)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0' }}>
          {current}g{' '}
          <span style={{ color: 'rgba(148,163,184,0.5)', fontWeight: 400 }}>/ {target}g</span>
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, width: `${pct}%`, background: color,
          transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
          boxShadow: `0 0 8px ${color}55`,
        }} />
      </div>
    </div>
  );
}

function InsightBanner({ text, onDismiss }) {
  return (
    <div style={{
      background: 'rgba(56,189,248,0.08)',
      border: '1px solid rgba(56,189,248,0.2)',
      borderRadius: 10, padding: '10px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      marginBottom: 16,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', flexShrink: 0, marginTop: 5 }} />
      <p style={{ flex: 1, fontSize: 13, color: '#7dd3fc', lineHeight: 1.5, margin: 0 }}>{text}</p>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#38bdf8', fontSize: 18, lineHeight: 1, opacity: 0.5, flexShrink: 0 }}>×</button>
    </div>
  );
}

function AddMealSheet({ section, onAdd, onClose }) {
  const presets = MEAL_PRESETS[section] || [];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(30,35,60,0.98) 0%, rgba(8,10,20,0.99) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px 20px 0 0', padding: '20px 16px 40px', maxHeight: '65vh', overflowY: 'auto',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ width: 32, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 14 }}>Add to {section}</p>
        {presets.map((m, i) => (
          <button key={i} onClick={() => { onAdd(m); onClose(); }} style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', textAlign: 'left', marginBottom: 8, fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}>
            <span style={{ fontSize: 13, color: '#e2e8f0' }}>{m.name}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{m.cal} kcal</div>
              <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>{m.protein}g protein</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function NutritionToast({ msg, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 10}px)`,
      opacity: visible ? 1 : 0, transition: 'all 0.25s ease',
      background: 'linear-gradient(135deg, rgba(30,35,60,0.98) 0%, rgba(8,10,20,0.99) 100%)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 99, padding: '8px 18px',
      fontSize: 13, color: '#e2e8f0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      whiteSpace: 'nowrap', zIndex: 300, pointerEvents: 'none',
    }}>
      {msg}
    </div>
  );
}

function NutMealSection({ section, items, onAdd, onDelete, divider }) {
  const sectionCals = items.reduce((s, m) => s + m.cal, 0);
  return (
    <>
      {divider && <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>{MEAL_ICONS[section]}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{section}</span>
            {sectionCals > 0 && <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{sectionCals} kcal</span>}
          </div>
          <button onClick={() => onAdd(section)} style={{
            fontSize: 12, color: '#38bdf8',
            background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
            borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}>+ Add</button>
        </div>
        {items.length === 0 ? (
          <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)', paddingBottom: 8 }}>No items logged</p>
        ) : items.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ flex: 1, fontSize: 13, color: '#e2e8f0' }}>{m.name}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{m.cal} kcal</div>
              <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{m.protein}g P · {m.carbs}g C · {m.fat}g F</div>
            </div>
            <button onClick={() => onDelete(section, i)} style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'background 0.15s',
            }}>
              <X size={12} color="#f87171" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function NutWaterTracker({ glasses, target, onAdd }) {
  return (
    <div>
      <span style={nutLabel}>Hydration</span>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {Array.from({ length: target }).map((_, i) => (
          <div key={i} onClick={i === glasses ? onAdd : undefined} style={{
            width: 18, height: 22, borderRadius: 4,
            background: i < glasses ? '#38bdf8' : 'rgba(255,255,255,0.06)',
            border: i < glasses ? 'none' : '1px solid rgba(255,255,255,0.1)',
            cursor: i === glasses ? 'pointer' : 'default',
            transition: 'background 0.2s',
            boxShadow: i < glasses ? '0 0 6px rgba(56,189,248,0.4)' : 'none',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', margin: 0 }}>{glasses} / {target} glasses</p>
    </div>
  );
}

function NutWeekDots({ days }) {
  const labels  = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const onTrack = days.filter(Boolean).length;
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {days.map((on, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: on ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
              border: on ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: on ? '0 0 10px rgba(56,189,248,0.25)' : 'none',
            }}>
              {on && (
                <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1.5,6 4.5,9 10.5,3" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 10, color: on ? '#38bdf8' : 'rgba(148,163,184,0.4)' }}>{labels[i]}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', margin: 0 }}>
        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{onTrack}/7 days</span> on track this week
      </p>
    </>
  );
}

function NutritionTab() {
  const [data, setData]           = useState(NUTRITION_BASE);
  const [meals, setMeals]         = useState({
    Breakfast: [{ name: 'Oat porridge + berries', cal: 340, protein: 12, carbs: 56, fat: 6 }],
    Lunch:     [{ name: 'Chicken & rice bowl',     cal: 490, protein: 42, carbs: 58, fat: 8 }],
    Dinner:    [],
    Snacks:    [{ name: 'Protein bar',              cal: 210, protein: 20, carbs: 22, fat: 7 }],
  });
  const [addingTo, setAddingTo]   = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [insight, setInsight]     = useState(true);
  const [toast, setToast]         = useState({ msg: '', visible: false });
  const toastTimer                = useRef(null);

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
  };

  const addToNutrition = ({ cal = 0, protein = 0, carbs = 0, fat = 0 }) =>
    setData(d => ({
      ...d,
      calories: { ...d.calories, consumed: d.calories.consumed + cal     },
      protein:  { ...d.protein,  consumed: d.protein.consumed  + protein },
      carbs:    { ...d.carbs,    consumed: d.carbs.consumed    + carbs   },
      fats:     { ...d.fats,     consumed: d.fats.consumed     + fat     },
    }));

  const removeFromNutrition = ({ cal = 0, protein = 0, carbs = 0, fat = 0 }) =>
    setData(d => ({
      ...d,
      calories: { ...d.calories, consumed: Math.max(0, d.calories.consumed - cal    ) },
      protein:  { ...d.protein,  consumed: Math.max(0, d.protein.consumed  - protein) },
      carbs:    { ...d.carbs,    consumed: Math.max(0, d.carbs.consumed    - carbs  ) },
      fats:     { ...d.fats,     consumed: Math.max(0, d.fats.consumed     - fat    ) },
    }));

  const handleQuickAdd = (opt) => { addToNutrition(opt); showToast(`${opt.label} added`); };

  const handleAddMeal = (section, meal) => {
    setMeals(m => ({ ...m, [section]: [...(m[section] || []), meal] }));
    addToNutrition(meal);
    showToast(`${meal.name} added`);
  };

  const handleDeleteMeal = (section, idx) => {
    const meal = meals[section][idx];
    setMeals(m => ({ ...m, [section]: m[section].filter((_, i) => i !== idx) }));
    removeFromNutrition(meal);
    showToast(`${meal.name} removed`);
  };

  const handleAddWater = () => {
    setData(d => ({ ...d, water: { ...d.water, glasses: Math.min(d.water.glasses + 1, d.water.target) } }));
    showToast('Water logged');
  };

  const proteinGap = data.protein.target - data.protein.consumed;
  const remaining  = data.calories.target - data.calories.consumed;
  const insightText = proteinGap > 0
    ? `Eat ${proteinGap}g more protein to hit your daily target.`
    : remaining > 0
    ? `${remaining} kcal left — add a meal to reach your goal.`
    : "You've nailed today's nutrition goals!";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 32 }}>

      {/* Hero — Daily Overview */}
      <div style={nutCard}>
        <span style={nutLabel}>Daily overview</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
          <CalorieRing consumed={data.calories.consumed} target={data.calories.target} />
          <div>
            <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', margin: '0 0 4px' }}>of {data.calories.target.toLocaleString()} kcal</p>
            <p style={{ fontSize: 28, fontWeight: 600, color: '#e2e8f0', lineHeight: 1, margin: '0 0 2px', letterSpacing: '-0.02em' }}>{data.calories.consumed.toLocaleString()}</p>
            <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)', margin: 0 }}>kcal consumed</p>
          </div>
        </div>
        {insight && <InsightBanner text={insightText} onDismiss={() => setInsight(false)} />}
        <MacroBar label="Protein"       current={data.protein.consumed} target={data.protein.target} color="#38bdf8"    />
        <MacroBar label="Carbohydrates" current={data.carbs.consumed}   target={data.carbs.target}   color="#22c55e"  />
        <MacroBar label="Fat"           current={data.fats.consumed}    target={data.fats.target}    color="#f59e0b"  />
      </div>

      {/* Add Food */}
      <div style={nutCard}>
        <span style={nutLabel}>Add food</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          {QUICK_ADD_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => handleQuickAdd(opt)} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: opt.key === 'shake' ? 'rgba(56,189,248,0.12)' : 'rgba(245,158,11,0.12)',
                border: opt.key === 'shake' ? '1px solid rgba(56,189,248,0.2)' : '1px solid rgba(245,158,11,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
              }}>
                {opt.key === 'shake'
                  ? <Droplets size={14} color="#38bdf8" />
                  : <Zap      size={14} color="#f59e0b" />}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: '0 0 2px' }}>{opt.label}</p>
              <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', margin: 0 }}>{opt.sub}</p>
            </button>
          ))}
        </div>
        <button onClick={() => setShowScanner(true)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '12px 14px', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ScanBarcode size={16} color="rgba(148,163,184,0.7)" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: '0 0 2px' }}>Scan barcode</p>
            <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', margin: 0 }}>Identify food instantly</p>
          </div>
          <ChevronRight size={14} color="rgba(148,163,184,0.4)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
        </button>
      </div>

      {/* Meal Log */}
      <div style={nutCard}>
        <span style={nutLabel}>Meal log</span>
        {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((section, i) => (
          <NutMealSection key={section} section={section} items={meals[section] || []} onAdd={setAddingTo} onDelete={handleDeleteMeal} divider={i > 0} />
        ))}
      </div>

      {/* Weekly Consistency */}
      <div style={nutCard}>
        <span style={nutLabel}>Weekly consistency</span>
        <NutWeekDots days={data.weekDays} />
      </div>

      {/* Hydration + Streak — matched to CARD style */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{
          ...CARD,
          borderRadius: 16,
          padding: 14,
        }}>
          <NutWaterTracker glasses={data.water.glasses} target={data.water.target} onAdd={handleAddWater} />
        </div>
        <div style={{
          ...CARD,
          borderRadius: 16,
          padding: 14,
        }}>
          <span style={nutLabel}>Streak</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Flame size={18} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' }} />
            <span style={{ fontSize: 28, fontWeight: 600, color: '#e2e8f0', lineHeight: 1, letterSpacing: '-0.02em' }}>{data.streak}</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', margin: 0 }}>days on track</p>
        </div>
      </div>

      {/* Current Goal */}
      <div style={nutCard}>
        <span style={nutLabel}>Current goal</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Goal',     value: 'Muscle gain'                               },
            { label: 'Calories', value: `${data.calories.target.toLocaleString()} kcal` },
            { label: 'Protein',  value: `${data.protein.target}g`                   },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {addingTo && (
        <AddMealSheet section={addingTo} onAdd={(m) => handleAddMeal(addingTo, m)} onClose={() => setAddingTo(null)} />
      )}
      {showScanner && (
        <BarcodeScannerModal
          onAdd={(section, meal) => { handleAddMeal(section, meal); }}
          onClose={() => setShowScanner(false)}
        />
      )}
      <NutritionToast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY / LEADERBOARD COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const LIFTS = [
  { id: 'bench',    label: 'Bench Press',    color: '#38bdf8', colorRgb: '56,189,248',   keywords: ['bench','bench press','chest press'] },
  { id: 'squat',    label: 'Squat',          color: '#f59e0b', colorRgb: '245,158,11',   keywords: ['squat','back squat','front squat'] },
  { id: 'deadlift', label: 'Deadlift',       color: '#f43f5e', colorRgb: '244,63,94',    keywords: ['deadlift','dead lift'] },
  { id: 'ohp',      label: 'Overhead Press', color: '#10b981', colorRgb: '16,185,129',   keywords: ['overhead press','ohp','shoulder press','military press'] },
  { id: 'row',      label: 'Barbell Row',    color: '#a78bfa', colorRgb: '167,139,250',  keywords: ['barbell row','bent over row','row'] },
  { id: 'all',      label: 'All Lifts',      color: '#e2e8f0', colorRgb: '226,232,240',  keywords: [] },
];

const TIME_FILTERS = [
  { id: 'week',  label: 'Week'  },
  { id: 'month', label: 'Month' },
  { id: 'all',   label: 'All'   },
];

const MEDALS = [
  { rank:1, color:'#FFD700', colorRgb:'255,215,0',   bg:'linear-gradient(160deg,rgba(60,42,0,0.95),rgba(28,18,0,0.98))',  border:'rgba(255,215,0,0.55)',  pulse:'gold-pulse',   tier:'CHAMP', avatarRing:'conic-gradient(#FFD700,#FFA500,#FFD700,#FFF0A0,#FFD700)', badgeBg:'linear-gradient(145deg,#FFE566,#CC8800)', glow:'rgba(255,215,0,0.3)',   glowStrong:'rgba(255,215,0,0.6)',   heightExtra:20 },
  { rank:2, color:'#C8D8EC', colorRgb:'200,216,236', bg:'linear-gradient(160deg,rgba(16,28,52,0.95),rgba(6,12,28,0.98))', border:'rgba(180,205,230,0.48)', pulse:'silver-pulse', tier:'ELITE', avatarRing:'conic-gradient(#C8D8EC,#8AACCF,#C8D8EC,#E8F0FA,#C8D8EC)', badgeBg:'linear-gradient(145deg,#D4E4F4,#6A96BC)', glow:'rgba(180,205,230,0.2)', glowStrong:'rgba(180,205,230,0.45)', heightExtra:6  },
  { rank:3, color:'#E8904A', colorRgb:'232,144,74',  bg:'linear-gradient(160deg,rgba(48,22,6,0.95),rgba(20,8,2,0.98))',  border:'rgba(215,128,58,0.5)',  pulse:'bronze-pulse', tier:'PRO',   avatarRing:'conic-gradient(#E8904A,#A05820,#E8904A,#F4C090,#E8904A)', badgeBg:'linear-gradient(145deg,#E8904A,#8C4818)', glow:'rgba(215,128,58,0.22)',glowStrong:'rgba(215,128,58,0.45)', heightExtra:0  },
];

const COMMUNITY_CSS = `
@keyframes lb-slide-up { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
@keyframes lb-card-in  { from{opacity:0;transform:translateY(28px) scale(0.9) rotateX(8deg)} to{opacity:1;transform:translateY(0) scale(1) rotateX(0)} }
@keyframes lb-row-in   { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
@keyframes lb-shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
@keyframes lb-count-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes gold-pulse   { 0%,100%{box-shadow:0 0 0 2px rgba(255,196,0,0.5),0 0 20px rgba(255,196,0,0.25)} 50%{box-shadow:0 0 0 4px rgba(255,196,0,0.8),0 0 40px rgba(255,196,0,0.5)} }
@keyframes silver-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(192,212,232,0.4),0 0 16px rgba(192,212,232,0.18)} 50%{box-shadow:0 0 0 3px rgba(192,212,232,0.65),0 0 28px rgba(192,212,232,0.32)} }
@keyframes bronze-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(210,120,50,0.42),0 0 16px rgba(210,120,50,0.18)} 50%{box-shadow:0 0 0 3px rgba(210,120,50,0.68),0 0 28px rgba(210,120,50,0.32)} }
@keyframes lb-badge-pop { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.15) rotate(5deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
@keyframes arc-draw     { from{stroke-dashoffset:var(--full)} to{stroke-dashoffset:var(--offset)} }
@keyframes num-pop      { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }
@keyframes dd-open      { from{opacity:0;transform:translateY(-6px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes orb-drift    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,-8px) scale(1.08)} }
`;

function matchLift(name = '') {
  const lower = name.toLowerCase();
  for (const lift of LIFTS.filter(l => l.id !== 'all')) {
    if (lift.keywords.some(k => lower.includes(k))) return lift.id;
  }
  return null;
}

function filterByTime(sets, filter) {
  const now = Date.now();
  if (filter === 'week')  return sets.filter(s => now - new Date(s.logged_date || s.created_date || 0) < 7 * 86400000);
  if (filter === 'month') return sets.filter(s => now - new Date(s.logged_date || s.created_date || 0) < 30 * 86400000);
  return sets;
}

function flattenWorkoutLogs(logs, userMap = {}) {
  const flat = [];
  logs.forEach(log => {
    const userName = userMap[log.user_id] || log.created_by?.split('@')[0] || 'Athlete';
    (log.exercises || []).forEach(ex => {
      const w = parseFloat(ex.weight || 0);
      if (!w) return;
      flat.push({ user_id: log.user_id, user_name: userName, exercise_name: ex.exercise || '', weight: w, unit: 'kg', logged_date: log.completed_date || log.created_date });
    });
  });
  return flat;
}

function buildLeaderboard(sets, liftId) {
  const best = {};
  sets.forEach(s => {
    const lId = matchLift(s.exercise_name || '');
    if (!lId) return;
    if (liftId !== 'all' && lId !== liftId) return;
    const w = s.weight;
    if (!w) return;
    const uid = s.user_id;
    if (!best[uid] || w > best[uid].weight) best[uid] = { user_id: uid, user_name: s.user_name || 'Athlete', weight: w, unit: 'kg' };
  });
  return Object.values(best).sort((a, b) => b.weight - a.weight);
}

const ini = n => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

function LiftDropdown({ value, onChange, liftMeta }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, border: 'none', cursor: 'pointer', background: `rgba(${liftMeta.colorRgb}, 0.08)`, outline: `1px solid rgba(${liftMeta.colorRgb}, 0.28)`, fontFamily: "'Outfit', system-ui, sans-serif", transition: 'all 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: liftMeta.color, boxShadow: `0 0 10px ${liftMeta.color}`, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>{liftMeta.label}</span>
        </div>
        <ChevronDown style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.35)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(160deg, rgba(10,18,44,0.99) 0%, rgba(5,8,22,1) 100%)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 24px 64px rgba(0,0,0,0.75)', zIndex: 100, animation: 'dd-open 0.18s cubic-bezier(0.34,1.3,0.64,1) both' }}>
          {LIFTS.map((lift, i) => {
            const active = lift.id === value;
            return (
              <button key={lift.id} onClick={() => { onChange(lift.id); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', border: 'none', cursor: 'pointer', background: active ? `rgba(${lift.colorRgb}, 0.09)` : 'transparent', borderBottom: i < LIFTS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', fontFamily: "'Outfit', system-ui, sans-serif", transition: 'background 0.12s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: active ? lift.color : 'rgba(255,255,255,0.12)', boxShadow: active ? `0 0 8px ${lift.color}` : 'none' }} />
                  <span style={{ fontSize: 13, fontWeight: active ? 800 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.38)', letterSpacing: '-0.01em' }}>{lift.label}</span>
                </div>
                {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: lift.color, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ArcRing({ pct, color, size = 118 }) {
  const R = (size - 16) / 2;
  const circ = 2 * Math.PI * R;
  const filled = circ * 0.75;
  const arc = filled * (1 - ((pct || 0) / 100));
  const id = `arc-${color.replace('#', '')}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(135deg)', flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round" />
      <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={`url(#${id})`} strokeWidth={8} strokeDasharray={`${filled - arc} ${circ - (filled - arc)}`} strokeLinecap="round"
        style={{ '--full': filled, '--offset': arc, animation: 'arc-draw 1.1s cubic-bezier(0.34,1.2,0.64,1) 0.2s both', filter: `drop-shadow(0 0 6px ${color}88)` }} />
    </svg>
  );
}

function FullLeaderboard({ leaderboard, liftMeta, currentUserId, onClose, userAvatarMap = {} }) {
  const podium   = leaderboard.slice(0, 3);
  const restList = leaderboard.slice(3, 10);
  const maxVal   = leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.weight), 1) : 1;
  return (
    <>
      <style>{COMMUNITY_CSS}</style>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg,#02040a 0%,#0d2360 50%,#02040a 100%)', animation: 'lb-slide-up 0.42s cubic-bezier(0.16,1,0.3,1) both', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,215,0,0.06) 0%,transparent 70%)', pointerEvents: 'none', animation: 'orb-drift 10s ease-in-out infinite' }} />
        <div style={{ flexShrink: 0, padding: '18px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 2 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, left: 16, width: 36, height: 36, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(30,40,80,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderBottom: '3px solid rgba(0,0,0,0.55)', cursor: 'pointer' }}>
            <ChevronRight style={{ width: 17, height: 17, color: 'rgba(255,255,255,0.7)', transform: 'rotate(180deg)' }} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Trophy style={{ width: 14, height: 14, color: '#FFD700', filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.7))' }} />
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.28em', color: 'rgba(255,215,0,0.65)' }}>Strength Rankings</span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.04em' }}>{liftMeta.label}</h2>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', zIndex: 2 }}>
          {leaderboard.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 12 }}>
              <Trophy style={{ width: 36, height: 36, color: 'rgba(255,255,255,0.08)' }} />
              <p style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.2)', margin: 0 }}>No Rankings Yet</p>
            </div>
          ) : (<>
            <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, perspective: 800 }}>
              {[{ data: podium[1], mIdx: 1 }, { data: podium[0], mIdx: 0 }, { data: podium[2], mIdx: 2 }]
                .filter(p => p.data)
                .map(({ data, mIdx }, colIdx) => {
                  const M = MEDALS[mIdx], isFirst = mIdx === 0, cardW = isFirst ? 116 : 94, avatarSz = isFirst ? 50 : 38;
                  const isMe = data.user_id === currentUserId;
                  return (
                    <div key={mIdx} style={{ width: cardW, borderRadius: 18, overflow: 'hidden', position: 'relative', background: M.bg, border: `1.5px solid ${M.border}`, backdropFilter: 'blur(40px)', boxShadow: `0 16px 48px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.08)`, animation: `lb-card-in 0.5s cubic-bezier(0.34,1.3,0.64,1) ${colIdx * 0.08}s both`, marginBottom: M.heightExtra }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${M.color},${M.glowStrong},${M.color},transparent)`, zIndex: 3 }} />
                      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, width: '25%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', animation: `lb-shimmer 4s ease-in-out infinite`, animationDelay: `${mIdx * 0.8}s` }} />
                      </div>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: M.badgeBg, borderRadius: '0 0 9px 0', zIndex: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,0.7)' }}>{M.rank}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: isFirst ? 16 : 13, paddingBottom: 3, zIndex: 2, position: 'relative' }}>
                        <span style={{ fontSize: 6, fontWeight: 900, letterSpacing: '0.2em', color: M.color, opacity: 0.7, textTransform: 'uppercase', background: `rgba(${M.colorRgb},0.1)`, border: `1px solid rgba(${M.colorRgb},0.2)`, padding: '1px 6px', borderRadius: 99 }}>{M.tier}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4, zIndex: 2, position: 'relative' }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: avatarSz + 6, height: avatarSz + 6, borderRadius: '50%', background: M.avatarRing, animation: `${M.pulse} 2.5s ease-in-out infinite`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: avatarSz, height: avatarSz, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: M.color, background: M.bg, border: '2px solid rgba(0,0,0,0.3)', fontSize: isFirst ? 17 : 12 }}>
                              {userAvatarMap[data.user_id] ? <img src={userAvatarMap[data.user_id]} alt={data.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                              <span style={{ display: userAvatarMap[data.user_id] ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: isFirst ? 17 : 12 }}>{ini(data.user_name)}</span>
                            </div>
                          </div>
                          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 17, height: 17, borderRadius: '50%', background: 'rgba(6,10,24,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: M.color, boxShadow: `0 0 0 2px ${M.color}`, animation: 'lb-badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both', zIndex: 5 }}>{M.rank}</div>
                        </div>
                      </div>
                      <p style={{ color: isMe ? '#38bdf8' : '#fff', fontWeight: 900, textAlign: 'center', fontSize: isFirst ? 11 : 9, lineHeight: 1.2, padding: '0 6px 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'relative', zIndex: 2 }}>{isMe ? 'You' : data.user_name || '—'}</p>
                      <div style={{ textAlign: 'center', padding: `2px 8px ${isFirst ? 13 : 9}px`, position: 'relative', zIndex: 2 }}>
                        <p style={{ fontSize: isFirst ? 20 : 15, fontWeight: 900, color: M.color, lineHeight: 1, textShadow: `0 0 24px ${M.glowStrong}`, letterSpacing: '-0.03em', animation: 'lb-count-up 0.5s ease 0.2s both' }}>{data.weight}kg</p>
                        <p style={{ fontSize: 6, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: `rgba(${M.colorRgb},0.45)`, marginTop: 1 }}>personal best</p>
                      </div>
                    </div>
                  );
                })}
            </div>
            {restList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 12px 20px' }}>
                {restList.map((entry, i) => {
                  const globalRank = i + 4, pct = Math.max(4, Math.round((entry.weight / maxVal) * 100));
                  const isMe = entry.user_id === currentUserId;
                  const opacities = [1, 0.88, 0.76, 0.65, 0.55, 0.46, 0.38];
                  const o = opacities[i] || 0.38;
                  return (
                    <div key={entry.user_id || i} style={{ borderRadius: 14, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, animation: `lb-row-in 0.28s ease ${(i + 3) * 0.04}s both`, background: isMe ? 'rgba(56,189,248,0.08)' : 'linear-gradient(135deg,rgba(15,24,58,0.82),rgba(8,14,36,0.92))', border: `1px solid ${isMe ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)'}`, borderLeft: `3px solid ${isMe ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`, boxShadow: '0 2px 12px rgba(0,0,0,0.35)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: `rgba(255,255,255,${o * 0.7})` }}>{globalRank}</div>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, background: isMe ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)', border: `2px solid ${isMe ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`, color: isMe ? '#38bdf8' : 'rgba(255,255,255,0.6)' }}>
                        {userAvatarMap[entry.user_id] ? <img src={userAvatarMap[entry.user_id]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                        <span style={{ display: userAvatarMap[entry.user_id] ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>{ini(entry.user_name)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: isMe ? '#fff' : `rgba(255,255,255,${o * 0.92})`, margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isMe ? 'You' : entry.user_name || '—'}</p>
                        <div style={{ height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: `rgba(${liftMeta.colorRgb},${o * 0.55})`, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 800, color: `rgba(255,255,255,${o * 0.9})` }}>{entry.weight}kg</div>
                    </div>
                  );
                })}
              </div>
            )}
            <p style={{ textAlign: 'center', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.08)', paddingBottom: 16 }}>Ranked by personal best · Real-time</p>
          </>)}
        </div>
      </div>
    </>
  );
}

function CommunityLiftCard({ currentUser }) {
  const [activeLift, setActiveLift] = useState('bench');
  const [timeFilter, setTimeFilter] = useState('week');
  const [lbOpen, setLbOpen] = useState(false);

  const { data: gymMemberships = [] } = useQuery({ queryKey: ['gymMemberships', currentUser?.id], queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }), enabled: !!currentUser?.id, staleTime: 5 * 60 * 1000 });
  const gymId = gymMemberships[0]?.gym_id;

  const { data: workoutLogs = [], isLoading } = useQuery({ queryKey: ['communityWorkoutLogs', gymId], queryFn: () => base44.entities.WorkoutLog.filter({ gym_id: gymId }, '-completed_date', 500), enabled: !!gymId, staleTime: 3 * 60 * 1000, placeholderData: p => p });
  const { data: gymMembersForNames = [] } = useQuery({ queryKey: ['gymMembersForNames', gymId], queryFn: () => base44.entities.GymMember.filter({ gym_id: gymId }, 'user_name', 200), enabled: !!gymId, staleTime: 10 * 60 * 1000, placeholderData: p => p });

  const userMap = useMemo(() => {
    const m = {};
    gymMembersForNames.forEach(u => { const uid = u.user_id || u.id; if (uid) m[uid] = u.user_name || u.full_name || u.email?.split('@')[0] || 'Athlete'; });
    if (currentUser) m[currentUser.id] = currentUser.full_name || currentUser.email?.split('@')[0] || 'You';
    return m;
  }, [gymMembersForNames, currentUser]);

  const userAvatarMap = useMemo(() => {
    const m = {};
    gymMembersForNames.forEach(u => { const uid = u.user_id || u.id; const avatar = u.avatar_url || u.user_avatar || u.profile_picture || null; if (uid && avatar) m[uid] = avatar; });
    const myAvatar = currentUser?.avatar_url || currentUser?.profile_picture || currentUser?.photo_url || null;
    if (currentUser?.id && myAvatar) m[currentUser.id] = myAvatar;
    return m;
  }, [gymMembersForNames, currentUser]);

  const allSets      = useMemo(() => flattenWorkoutLogs(workoutLogs, userMap), [workoutLogs, userMap]);
  const filteredSets = useMemo(() => filterByTime(allSets, timeFilter), [allSets, timeFilter]);
  const leaderboard  = useMemo(() => buildLeaderboard(filteredSets, activeLift), [filteredSets, activeLift]);

  const myEntry = leaderboard.find(l => l.user_id === currentUser?.id);
  const myRank  = myEntry ? leaderboard.indexOf(myEntry) + 1 : null;
  const myPct   = myRank && leaderboard.length > 1 ? Math.round(((leaderboard.length - myRank) / (leaderboard.length - 1)) * 100) : null;

  const allTimeBest = useMemo(() => (
    allSets.filter(s => s.user_id === currentUser?.id && (activeLift === 'all' ? !!matchLift(s.exercise_name || '') : matchLift(s.exercise_name || '') === activeLift))
      .reduce((b, s) => Math.max(b, s.weight || 0), 0)
  ), [allSets, currentUser?.id, activeLift]);

  const todayLifters = useMemo(() => new Set(allSets.filter(s => Date.now() - new Date(s.logged_date || 0) < 86400000).map(s => s.user_id)).size, [allSets]);
  const gymName  = gymMemberships[0]?.gym_name || 'Community';
  const liftMeta = LIFTS.find(l => l.id === activeLift) || LIFTS[0];

  if (lbOpen) return <FullLeaderboard leaderboard={leaderboard} liftMeta={liftMeta} currentUserId={currentUser?.id} onClose={() => setLbOpen(false)} userAvatarMap={userAvatarMap} />;

  return (
    <>
      <style>{COMMUNITY_CSS}</style>
      <div style={{ marginBottom: 12 }}>
        <h2 style={sectionTitle}>Community Lift Rankings</h2>
        <p style={{ fontSize: 22, color: '#475569', margin: '3px 0 0', fontWeight: 500 }}>{gymName}</p>
      </div>
      <div style={{ borderRadius: 28, background: 'linear-gradient(160deg,rgba(12,20,48,0.96) 0%,rgba(6,10,26,0.99) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(${liftMeta.colorRgb},0.08), inset 0 1px 0 rgba(255,255,255,0.06)`, position: 'relative', overflow: 'visible', transition: 'box-shadow 0.4s ease', fontFamily: "'Outfit', system-ui, sans-serif" }}>
        <div style={{ height: 3, borderRadius: '28px 28px 0 0', background: `linear-gradient(90deg,transparent 0%,rgba(${liftMeta.colorRgb},0.5) 20%,${liftMeta.color} 50%,rgba(${liftMeta.colorRgb},0.5) 80%,transparent 100%)`, transition: 'background 0.4s ease' }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 300, height: 180, borderRadius: '50%', background: `radial-gradient(ellipse,rgba(${liftMeta.colorRgb},0.07) 0%,transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ padding: '18px 18px 0', position: 'relative', zIndex: 10 }}>
          <LiftDropdown value={activeLift} onChange={v => { setActiveLift(v); setLbOpen(false); }} liftMeta={liftMeta} />
        </div>
        <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <ArcRing pct={myPct ?? 0} color={liftMeta.color} size={118} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: myEntry ? 26 : 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, animation: 'num-pop 0.5s cubic-bezier(0.34,1.3,0.64,1) 0.1s both' }}>{myEntry ? myEntry.weight : '—'}</span>
              {myEntry && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)' }}>kg PB</span>}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {myEntry ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{myPct !== null ? `Top ${100 - myPct}%` : 'Ranked'}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 600 }}>in {gymName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: liftMeta.color, boxShadow: `0 0 8px ${liftMeta.color}` }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', fontWeight: 600 }}>#{myRank} of {leaderboard.length} athletes</span>
                </div>
                {allTimeBest > 0 && allTimeBest !== myEntry.weight && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <TrendingUp style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.28)' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', fontWeight: 700 }}>All-time PB: {allTimeBest}kg</span>
                  </div>
                )}
              </>
            ) : (
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.38)', margin: '0 0 4px' }}>No {liftMeta.label} logged</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', margin: 0, fontWeight: 600 }}>Log a lift to appear on the board</p>
              </div>
            )}
          </div>
        </div>
        <div style={{ margin: '18px 18px 0', height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy style={{ width: 13, height: 13, color: '#FFD700' }} />
              <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Top Lifters</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '2px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {TIME_FILTERS.map(tf => (
                <button key={tf.id} onClick={() => setTimeFilter(tf.id)} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 800, background: timeFilter === tf.id ? `rgba(${liftMeta.colorRgb},0.15)` : 'transparent', color: timeFilter === tf.id ? liftMeta.color : 'rgba(255,255,255,0.22)', outline: timeFilter === tf.id ? `1px solid rgba(${liftMeta.colorRgb},0.3)` : 'none', fontFamily: "'Outfit',system-ui,sans-serif", transition: 'all 0.15s ease' }}>{tf.label}</button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(255,255,255,0.14)', fontSize: 12, fontWeight: 600 }}>Loading…</div>
          ) : leaderboard.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(255,255,255,0.14)', fontSize: 12, fontWeight: 600 }}>No lifts logged in this period</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {leaderboard.slice(0, 5).map((entry, i) => {
                const M = i < 3 ? MEDALS[i] : null;
                const isMe = entry.user_id === currentUser?.id;
                const maxW = leaderboard[0].weight;
                const pct  = Math.max(6, Math.round((entry.weight / maxW) * 100));
                return (
                  <div key={entry.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 14, background: isMe ? `rgba(${liftMeta.colorRgb},0.07)` : i === 0 ? 'rgba(255,215,0,0.04)' : 'rgba(255,255,255,0.025)', border: `1px solid ${isMe ? `rgba(${liftMeta.colorRgb},0.2)` : 'rgba(255,255,255,0.04)'}`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: M ? `rgba(${M.colorRgb},0.04)` : `rgba(${liftMeta.colorRgb},0.04)`, borderRadius: '14px 0 0 14px', pointerEvents: 'none', transition: 'width 0.6s ease' }} />
                    <div style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, background: M ? M.badgeBg : 'rgba(255,255,255,0.05)', color: M ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.22)', position: 'relative', zIndex: 1 }}>{i + 1}</div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, background: isMe ? `rgba(${liftMeta.colorRgb},0.2)` : M ? M.bg : 'rgba(255,255,255,0.06)', border: `1.5px solid ${isMe ? liftMeta.color : M ? M.color : 'rgba(255,255,255,0.08)'}`, color: isMe ? liftMeta.color : M ? M.color : 'rgba(255,255,255,0.45)', position: 'relative', zIndex: 1 }}>
                      {userAvatarMap[entry.user_id] ? <img src={userAvatarMap[entry.user_id]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                      <span style={{ display: userAvatarMap[entry.user_id] ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11 }}>{ini(entry.user_name)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: isMe ? 800 : 600, color: isMe ? '#fff' : M ? M.color : 'rgba(255,255,255,0.6)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isMe ? 'You' : entry.user_name || '—'}</p>
                    </div>
                    <div style={{ flexShrink: 0, fontSize: 13, fontWeight: 900, color: isMe ? liftMeta.color : M ? M.color : 'rgba(255,255,255,0.4)', position: 'relative', zIndex: 1, letterSpacing: '-0.02em' }}>{entry.weight}kg</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ margin: '16px 18px 0', height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ margin: '0 16px', padding: '14px 4px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `rgba(${liftMeta.colorRgb},0.1)`, flexShrink: 0 }}>
              <Flame style={{ width: 14, height: 14, color: liftMeta.color }} />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1, letterSpacing: '-0.03em' }}>{todayLifters}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', margin: '2px 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active today</p>
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,215,0,0.09)', flexShrink: 0 }}>
              <Trophy style={{ width: 14, height: 14, color: '#FFD700' }} />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1, letterSpacing: '-0.03em' }}>{leaderboard.length}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', margin: '2px 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>On board</p>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 16px 18px' }}>
          <button onClick={() => setLbOpen(true)} style={{ width: '100%', padding: '14px 20px', borderRadius: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(135deg,rgba(${liftMeta.colorRgb},0.13),rgba(${liftMeta.colorRgb},0.05))`, outline: `1px solid rgba(${liftMeta.colorRgb},0.22)`, boxShadow: `0 4px 20px rgba(${liftMeta.colorRgb},0.08),inset 0 1px 0 rgba(255,255,255,0.05)`, fontFamily: "'Outfit',system-ui,sans-serif", transition: 'transform 0.1s ease' }}
            onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'} onMouseUp={e => e.currentTarget.style.transform = ''} onMouseLeave={e => e.currentTarget.style.transform = ''} onTouchStart={e => e.currentTarget.style.transform = 'translateY(2px)'} onTouchEnd={e => e.currentTarget.style.transform = ''}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `rgba(${liftMeta.colorRgb},0.14)`, border: `1px solid rgba(${liftMeta.colorRgb},0.22)` }}>
                <Trophy style={{ width: 15, height: 15, color: liftMeta.color }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1 }}>Full Leaderboard</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: '3px 0 0', fontWeight: 600 }}>{leaderboard.length} athletes ranked</p>
              </div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: liftMeta.color, opacity: 0.6 }} />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────────
function AnalyticsTab({ currentUser, workoutLogs, checkIns, animateCharts }) {
  return (
    <div className="space-y-6">
      <div style={{ ...CARD, borderRadius: 16, padding: '16px 16px' }}>
        <ProgressiveOverloadTracker currentUser={currentUser} animate={animateCharts} />
      </div>
      <div style={{ ...CARD, borderRadius: 16, padding: '16px 16px' }}>
        <WeeklyVolumeChart currentUser={currentUser} animate={animateCharts} />
      </div>
      {currentUser?.workout_split && (
        <WorkoutSplitHeatmap checkIns={checkIns} workoutSplit={currentUser?.workout_split} weeklyGoal={currentUser?.weekly_goal} trainingDays={currentUser?.training_days} customWorkoutTypes={currentUser?.custom_workout_types || {}} joinDate={currentUser?.created_date} />
      )}
      <ExerciseInsights workoutLogs={workoutLogs} workoutSplit={currentUser?.custom_workout_types} trainingDays={currentUser?.training_days} />
    </div>
  );
}

// ─── Completed Goals ──────────────────────────────────────────────────────────
function CompletedGoals({ goals }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 w-full group mb-3" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1, textAlign: 'left' }}>Completed ({goals.length})</span>
        <ChevronDown className="w-4 h-4 text-slate-500 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
      </button>
      {open && (
        <div className="space-y-2">
          {goals.map((goal) => (
            <div key={goal.id} style={{ background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{goal.title}</p>
                {goal.target_value && <p style={{ fontSize: 11, fontWeight: 500, color: '#475569', margin: '2px 0 0' }}>{goal.target_value}{goal.unit ? ` ${goal.unit}` : ''}</p>}
              </div>
              <div style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 10, fontWeight: 700, color: '#4ade80', flexShrink: 0, letterSpacing: '0.04em' }}>Done</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Goals tab ────────────────────────────────────────────────────────────────
function GoalsTab({ currentUser, showAddGoal, setShowAddGoal }) {
  const queryClient = useQueryClient();
  const { data: goals = [] } = useQuery({ queryKey: ['goals', currentUser?.id], queryFn: () => base44.entities.Goal.filter({ user_id: currentUser?.id }), enabled: !!currentUser?.id, staleTime: 5 * 60 * 1000, placeholderData: (prev) => prev });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['goals', currentUser?.id] });
      const previous = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => [...old, { id: `temp-${Date.now()}`, ...data, status: 'active', current_value: 0 }]);
      return { previous };
    },
    onError: (err, data, ctx) => { queryClient.setQueryData(['goals', currentUser?.id], ctx.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals', currentUser?.id] }); setShowAddGoal(false); },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const prev = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => old.map((g) => g.id === id ? { ...g, ...data } : g));
      return { prev };
    },
    onError: (err, v, ctx) => { queryClient.setQueryData(['goals', currentUser?.id], ctx.prev); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals', currentUser?.id] }); },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['goals', currentUser?.id] });
      const previous = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => old.filter((g) => g.id !== id));
      return { previous };
    },
    onError: (err, id, ctx) => { queryClient.setQueryData(['goals', currentUser?.id], ctx.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals', currentUser?.id] }); },
  });

  const activeGoals    = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  return (
    <div className="space-y-4">
      {activeGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-slate-700/60 flex items-center justify-center mb-4"><Target className="w-7 h-7 text-slate-600" /></div>
          <p className="text-base font-bold text-white mb-1">No Goals Yet</p>
          <p className="text-sm text-slate-500 mb-5">Set your first fitness goal and start tracking.</p>
          <button onClick={() => setShowAddGoal(true)} className={btnNewGoal}><Plus className="w-3.5 h-3.5" />Create a Goal</button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal}
              onUpdate={(g, v, s, m) => { const d = { current_value: v, status: s || g.status }; if (m) d.milestones = m; updateGoalMutation.mutate({ id: g.id, data: d }); }}
              onDelete={(id) => deleteGoalMutation.mutate(id)}
              onToggleReminder={(g) => updateGoalMutation.mutate({ id: g.id, data: { reminder_enabled: !g.reminder_enabled } })}
            />
          ))}
        </div>
      )}
      {completedGoals.length > 0 && <CompletedGoals goals={completedGoals} />}
      <AddGoalModal open={showAddGoal} onClose={() => setShowAddGoal(false)} onSave={(data) => createGoalMutation.mutate(data)} currentUser={currentUser} isLoading={createGoalMutation.isPending} />
    </div>
  );
}

// ─── Coach Messages ───────────────────────────────────────────────────────────
function CoachMessages({ currentUser }) {
  const [openThread, setOpenThread] = useState(null);
  const [replyText, setReplyText]   = useState('');
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  const { data: received = [], isLoading } = useQuery({ queryKey: ['coachMessages', currentUser?.id], queryFn: () => base44.entities.Message.filter({ receiver_id: currentUser.id }, 'created_date', 200), enabled: !!currentUser, staleTime: 15 * 1000, refetchInterval: 15 * 1000 });
  const { data: sent = [] } = useQuery({ queryKey: ['coachMessagesSent', currentUser?.id], queryFn: () => base44.entities.Message.filter({ sender_id: currentUser.id }, 'created_date', 200), enabled: !!currentUser, staleTime: 15 * 1000, refetchInterval: 15 * 1000 });

  const sendReply = useMutation({
    mutationFn: content => base44.entities.Message.create({ sender_id: currentUser.id, sender_name: currentUser.full_name || currentUser.email, sender_avatar: currentUser.avatar_url || null, receiver_id: openThread, receiver_name: threads.find(t => t.sender_id === openThread)?.name || 'Coach', content, read: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coachMessages', currentUser?.id] }); qc.invalidateQueries({ queryKey: ['coachMessagesSent', currentUser?.id] }); qc.invalidateQueries({ queryKey: ['dashMessages'] }); setReplyText(''); },
  });

  const threads = useMemo(() => {
    const map = {};
    received.forEach(msg => { const otherId = msg.sender_id; if (!map[otherId]) map[otherId] = { sender_id: otherId, name: msg.sender_name || 'Coach', avatar: msg.sender_avatar || null, messages: [] }; map[otherId].messages.push(msg); });
    sent.forEach(msg => { const otherId = msg.receiver_id; if (map[otherId]) map[otherId].messages.push(msg); });
    Object.values(map).forEach(t => { const seen = new Set(); t.messages = t.messages.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; }); t.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)); });
    return Object.values(map).sort((a, b) => { const la = a.messages[a.messages.length - 1]?.created_date || 0; const lb = b.messages[b.messages.length - 1]?.created_date || 0; return new Date(lb) - new Date(la); });
  }, [received, sent]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [openThread, received, sent]);

  const activeThread = threads.find(t => t.sender_id === openThread);
  const fmtTime = (date) => { if (!date) return ''; const d = new Date(date); const now = new Date(); const diffDays = Math.floor((now - d) / 86400000); if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); if (diffDays === 1) return 'Yesterday'; if (diffDays < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' }); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };

  if (activeThread) {
    const handleSend = () => { if (!replyText.trim()) return; sendReply.mutate(replyText.trim()); };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '72vh', background: 'linear-gradient(135deg, rgba(10,14,30,0.98) 0%, rgba(5,8,20,1) 100%)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: 'rgba(255,255,255,0.02)' }}>
          <button onClick={() => setOpenThread(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}>
            <ChevronRight style={{ width: 20, height: 20, transform: 'rotate(180deg)' }} />
          </button>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid #3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeThread.avatar ? 'transparent' : 'rgba(59,130,246,0.15)', fontSize: 15, fontWeight: 800, color: '#3b82f6' }}>
              {activeThread.avatar ? <img src={activeThread.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (activeThread.name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#10b981', border: '2px solid #080e18' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{activeThread.name}</p>
            <p style={{ fontSize: 11, color: '#475569', margin: '1px 0 0' }}>Coach · Tap to reply</p>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeThread.messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUser?.id;
            const prevMsg = activeThread.messages[i - 1];
            const showAvatar = !isMe && (i === 0 || prevMsg?.sender_id !== msg.sender_id);
            return (
              <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                {!isMe && (
                  <div style={{ width: 28, flexShrink: 0 }}>
                    {showAvatar && <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: '2px solid #3b82f6', background: activeThread.avatar ? 'transparent' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#3b82f6' }}>{activeThread.avatar ? <img src={activeThread.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (activeThread.name || '?').charAt(0).toUpperCase()}</div>}
                  </div>
                )}
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {showAvatar && <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, paddingLeft: 4 }}>{activeThread.name}</span>}
                  <div style={{ padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? '#3b82f6' : 'rgba(255,255,255,0.08)', border: isMe ? 'none' : '1px solid rgba(255,255,255,0.06)', fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{msg.content}</div>
                  <span style={{ fontSize: 10, color: '#334155', paddingLeft: 4, paddingRight: 4 }}>{fmtTime(msg.created_date)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0, background: 'rgba(255,255,255,0.01)' }}>
          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={`Reply to ${activeThread.name}…`} rows={1} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 96, overflowY: 'auto' }} onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          <button onClick={handleSend} disabled={!replyText.trim() || sendReply.isPending} style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: replyText.trim() ? '#3b82f6' : 'rgba(255,255,255,0.06)', border: 'none', cursor: replyText.trim() ? 'pointer' : 'default', transition: 'background 0.15s', flexShrink: 0, boxShadow: replyText.trim() ? '0 0 12px rgba(59,130,246,0.4)' : 'none' }}>
            <Send style={{ width: 16, height: 16, color: replyText.trim() ? '#fff' : '#334155' }} />
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) return (
    <div className="space-y-2">
      {[1,2,3].map(i => <div key={i} style={{ height: 72, borderRadius: 16, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  );

  if (threads.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <User style={{ width: 26, height: 26, color: '#a78bfa' }} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>No messages yet</p>
      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, maxWidth: 240, margin: 0 }}>
        When a coach or gym owner messages you, it will appear here.
      </p>
    </div>
  );

  return (
    <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(10,14,30,0.97) 0%, rgba(5,8,20,1) 100%)' }}>
      {threads.map((thread, idx) => {
        const lastMsg = thread.messages[thread.messages.length - 1];
        return (
          <button key={thread.sender_id} onClick={() => setOpenThread(thread.sender_id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: 'inherit', textAlign: 'left', borderBottom: idx < threads.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.12s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2px solid #3b82f6', boxShadow: '0 0 12px rgba(59,130,246,0.55)', background: thread.avatar ? 'transparent' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#3b82f6' }}>
                {thread.avatar ? <img src={thread.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (thread.name || '?').charAt(0).toUpperCase()}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thread.name}</span>
                <span style={{ fontSize: 11, color: '#334155', flexShrink: 0, marginLeft: 8 }}>{fmtTime(lastMsg?.created_date)}</span>
              </div>
              <span style={{ fontSize: 13, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{lastMsg?.content || ''}</span>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: '#2d3f55', flexShrink: 0 }} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Coach invite banner ──────────────────────────────────────────────────────
function CoachInviteBanner({ invite, onAccept, onDecline, accepting, declining }) {
  const iniLocal = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.45) 0%, rgba(16,19,40,0.95) 100%)', border: '1px solid rgba(59,130,246,0.35)', borderBottom: '3px solid rgba(29,78,216,0.55)', borderRadius: 18, padding: '16px 16px', boxShadow: '0 2px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: invite.coach_avatar ? 'transparent' : 'rgba(59,130,246,0.15)', border: '2px solid rgba(59,130,246,0.5)', boxShadow: '0 0 14px rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#3b82f6' }}>
          {invite.coach_avatar ? <img src={invite.coach_avatar} alt={invite.coach_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniLocal(invite.coach_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 3, letterSpacing: '-0.01em' }}>{invite.coach_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa' }}>Coach</span>
            <BadgeCheck style={{ width: 13, height: 13, color: '#22c55e' }} />
          </div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
            Wants you as a personal training client{invite.coach_gym_name ? ` · ${invite.coach_gym_name}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={onAccept} disabled={accepting || declining} style={{ width: 42, height: 42, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #22c55e, #16a34a, #15803d)', border: '1px solid transparent', borderBottom: '3px solid #14532d', boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(34,197,94,0.3)', cursor: 'pointer', transition: 'all 0.1s', opacity: accepting || declining ? 0.6 : 1 }}>
            <CheckCircle style={{ width: 18, height: 18, color: '#fff' }} />
          </button>
          <button onClick={onDecline} disabled={accepting || declining} style={{ width: 42, height: 42, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #ef4444, #dc2626, #b91c1c)', border: '1px solid transparent', borderBottom: '3px solid #7f1d1d', boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(239,68,68,0.3)', cursor: 'pointer', transition: 'all 0.1s', opacity: accepting || declining ? 0.6 : 1 }}>
            <X style={{ width: 18, height: 18, color: '#fff' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Accepted coach box ───────────────────────────────────────────────────────
function MyCoachBox({ invite }) {
  const iniLocal = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(10,14,30,0.97) 0%, rgba(5,8,20,1) 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '18px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: invite.coach_avatar ? 'transparent' : 'rgba(59,130,246,0.15)', border: '2px solid rgba(59,130,246,0.5)', boxShadow: '0 0 12px rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#3b82f6' }}>
          {invite.coach_avatar ? <img src={invite.coach_avatar} alt={invite.coach_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniLocal(invite.coach_name)}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>{invite.coach_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa' }}>Coach</span>
            <BadgeCheck style={{ width: 13, height: 13, color: '#22c55e' }} />
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />
      <div style={{ fontSize: 12, color: '#334155', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
        Your coach will add workouts &amp; programmes here soon.
      </div>
    </div>
  );
}

// ─── Trainer tab ─────────────────────────────────────────────────────────────
function TrainerTab({ currentUser }) {
  const [activeSection, setActiveSection] = useState('coaches');
  const queryClient = useQueryClient();

  const btnBase = "px-2 py-1.5 rounded-2xl font-bold text-sm transition-all duration-100 flex flex-col items-center gap-1 backdrop-blur-md border active:shadow-none active:translate-y-[5px] active:scale-95 transform-gpu flex-1";
  const btnInactive = "bg-slate-900/80 text-slate-400 border-slate-500/50 shadow-[0_5px_0_0_#172033,0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]";

  const { data: me } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000 });
  const user = me || currentUser;

  const { data: pendingInvites = [] } = useQuery({ queryKey: ['coachInvitesPending', user?.id], queryFn: () => base44.entities.CoachInvite.filter({ member_id: user.id, status: 'pending' }, '-created_date', 20), enabled: !!user?.id, staleTime: 0, refetchInterval: 15 * 1000 });
  const { data: acceptedInvites = [] } = useQuery({ queryKey: ['coachInvitesAccepted', user?.id], queryFn: () => base44.entities.CoachInvite.filter({ member_id: user.id, status: 'accepted' }, '-created_date', 10), enabled: !!user?.id, staleTime: 0, refetchInterval: 30 * 1000 });

  const [processingId, setProcessingId] = useState(null);

  const handleAccept = async (invite) => {
    setProcessingId(invite.id);
    await base44.entities.CoachInvite.update(invite.id, { status: 'accepted' });
    queryClient.invalidateQueries({ queryKey: ['coachInvitesPending'] });
    queryClient.invalidateQueries({ queryKey: ['coachInvitesAccepted'] });
    setProcessingId(null);
  };

  const handleDecline = async (invite) => {
    setProcessingId(invite.id);
    await base44.entities.CoachInvite.update(invite.id, { status: 'declined' });
    queryClient.invalidateQueries({ queryKey: ['coachInvitesPending'] });
    setProcessingId(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setActiveSection('classes')} className={`${btnBase} ${activeSection === 'classes' ? 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white border-transparent shadow-[0_5px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)]' : btnInactive}`}>
          <CalendarDays className="w-4 h-4" />Classes
        </button>
        <button onClick={() => setActiveSection('coaches')} className={`${btnBase} ${activeSection === 'coaches' ? 'bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 text-white border-transparent shadow-[0_5px_0_0_#5b21b6,0_8px_20px_rgba(120,40,220,0.4),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.05)]' : btnInactive}`}>
          <User className="w-4 h-4" />Coaches
        </button>
      </div>

      {activeSection === 'classes' && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <p style={{ fontSize: 14, fontWeight: 500, color: '#475569', lineHeight: 1.6, maxWidth: 260, margin: 0 }}>
            Join classes at your gym to chat with other members and stay connected with your training community.
          </p>
        </div>
      )}

      {activeSection === 'coaches' && (
        <div className="space-y-4">
          {pendingInvites.length > 0 && (
            <div className="space-y-3">
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Coach Requests</p>
              {pendingInvites.map(invite => (
                <CoachInviteBanner key={invite.id} invite={invite} accepting={processingId === invite.id} declining={processingId === invite.id} onAccept={() => handleAccept(invite)} onDecline={() => handleDecline(invite)} />
              ))}
            </div>
          )}
          {acceptedInvites.length > 0 && (
            <div className="space-y-3">
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Personal Trainer</p>
              {acceptedInvites.map(invite => (
                <MyCoachBox key={invite.id} invite={invite} />
              ))}
            </div>
          )}
          <CoachMessages currentUser={user} />
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Progress() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: currentUser.id }, '-created_date', 500),
    enabled: !!currentUser, staleTime: 5 * 60 * 1000, placeholderData: (prev) => prev,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date', 200),
    enabled: !!currentUser, staleTime: 2 * 60 * 1000, placeholderData: (prev) => prev,
  });

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [analyticsAnimKey, setAnalyticsAnimKey] = useState(0);
  useEffect(() => {
    if (!animatedTabs.has('analytics') && currentUser) {
      animatedTabs.add('analytics');
      setAnalyticsAnimKey(k => k + 1);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 pb-4" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
          <div className="max-w-4xl mx-auto flex justify-between gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-1 h-8 rounded bg-slate-700/60 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-3 py-5 space-y-4">
          <div className="h-32 rounded-2xl bg-slate-800/60 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-800/60 animate-pulse" />
            ))}
          </div>
          <div className="h-48 rounded-2xl bg-slate-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <Tabs defaultValue="analytics" className="w-full">

        {/* ── Header ── */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 md:px-4 pb-4" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center h-18">
              <TabsList className="flex justify-between w-full bg-transparent p-0 h-10 gap-0 border-0">
                <TabsTrigger value="analytics" className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 mb-[-2px] transition-colors bg-transparent text-sm justify-center">
                  <BarChart3 className="w-4 h-4 mr-1.5" />Analytics
                </TabsTrigger>
                <TabsTrigger value="goals" className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 mb-[-2px] transition-colors bg-transparent text-sm justify-center">
                  <Target className="w-4 h-4 mr-1.5" />Targets
                </TabsTrigger>
                <TabsTrigger value="nutrition" className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 mb-[-2px] transition-colors bg-transparent text-sm justify-center">
                  <Utensils className="w-4 h-4 mr-1.5" />Nutrition
                </TabsTrigger>
                <TabsTrigger value="rank" className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 mb-[-2px] transition-colors bg-transparent text-sm justify-center">
                  <ClipboardList className="w-4 h-4 mr-1.5" />Trainer
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        {/* ── Analytics ── */}
        <TabsContent value="analytics" className="mt-0 px-3 md:px-4 py-5">
          <div className="max-w-4xl mx-auto">
            <AnalyticsTab currentUser={currentUser} workoutLogs={workoutLogs} checkIns={checkIns} animateCharts={analyticsAnimKey} />
          </div>
        </TabsContent>

        {/* ── Targets ── */}
        <TabsContent value="goals" className="mt-0 px-3 md:px-4 py-5">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 style={sectionTitle}>Personal Goals</h2>
                <button onClick={() => setShowAddGoal(true)} className={btnNewGoal}>
                  <Plus className="w-3.5 h-3.5" />New Goal
                </button>
              </div>
              <GoalsTab currentUser={currentUser} showAddGoal={showAddGoal} setShowAddGoal={setShowAddGoal} />
            </div>
            <CommunityLiftCard currentUser={currentUser} />
          </div>
        </TabsContent>

        {/* ── Nutrition ── */}
        <TabsContent value="nutrition" className="mt-0 px-3 md:px-4 py-5">
          <div className="max-w-4xl mx-auto">
            <NutritionTab />
          </div>
        </TabsContent>

        {/* ── Trainer ── */}
        <TabsContent value="rank" className="mt-0 px-3 md:px-4 py-5">
          <div className="max-w-4xl mx-auto">
            <TrainerTab currentUser={currentUser} />
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}