import React, { useState, useRef } from 'react';
import { Flame, ChevronRight, Droplets, Zap, ScanBarcode, X } from 'lucide-react';
import BarcodeScannerModal from '../nutrition/BarcodeScannerModal';

const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const nutCard = { ...CARD, borderRadius: 16, padding: '18px', marginBottom: 12 };
const nutLabel = {
  fontSize: 11, color: 'rgba(148,163,184,0.7)', letterSpacing: '0.06em',
  textTransform: 'uppercase', marginBottom: 12, display: 'block', fontWeight: 600,
};

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
    { name: 'Oat porridge + berries', cal: 340, protein: 12, carbs: 56, fat: 6 },
    { name: 'Greek yoghurt',           cal: 150, protein: 17, carbs: 9,  fat: 4 },
    { name: 'Eggs (3 large)',          cal: 210, protein: 18, carbs: 1,  fat: 15 },
    { name: 'Banana',                  cal: 90,  protein: 1,  carbs: 23, fat: 0 },
  ],
  Lunch: [
    { name: 'Chicken & rice bowl', cal: 490, protein: 42, carbs: 58, fat: 8 },
    { name: 'Salmon fillet',        cal: 280, protein: 34, carbs: 0,  fat: 16 },
    { name: 'Rice (200g)',          cal: 260, protein: 5,  carbs: 56, fat: 1 },
  ],
  Dinner: [
    { name: 'Chicken breast',  cal: 310, protein: 45, carbs: 0,  fat: 12 },
    { name: 'Pasta bolognese', cal: 520, protein: 28, carbs: 62, fat: 14 },
    { name: 'Steak + veg',     cal: 480, protein: 50, carbs: 12, fat: 22 },
  ],
  Snacks: [
    { name: 'Protein bar',     cal: 210, protein: 20, carbs: 22, fat: 7 },
    { name: 'Rice cakes x3',   cal: 90,  protein: 2,  carbs: 20, fat: 1 },
    { name: 'Handful almonds', cal: 175, protein: 6,  carbs: 6,  fat: 15 },
  ],
};

const QUICK_ADD_OPTIONS = [
  { key: 'shake',  label: 'Protein shake', sub: '30g protein · 180 kcal', cal: 180, protein: 30, carbs: 6,  fat: 3 },
  { key: 'cal500', label: '500 calories',  sub: 'Quick energy boost',     cal: 500, protein: 20, carbs: 60, fat: 18 },
];

const MEAL_ICONS = { Breakfast: '☀', Lunch: '⛅', Dinner: '◑', Snacks: '◇' };

function CalorieRing({ consumed, target }) {
  const pct  = Math.min(Math.round((consumed / target) * 100), 100);
  const r    = 38;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
  const fill = arc * (pct / 100);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <svg width={96} height={96} style={{ display: 'block' }}>
        <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7}
          strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round" transform="rotate(135 48 48)" />
        <circle cx={48} cy={48} r={r} fill="none" stroke="#38bdf8" strokeWidth={7}
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round" transform="rotate(135 48 48)"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)', filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.5))' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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
          {current}g <span style={{ color: 'rgba(148,163,184,0.5)', fontWeight: 400 }}>/ {target}g</span>
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: color, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)', boxShadow: `0 0 8px ${color}55` }} />
      </div>
    </div>
  );
}

function InsightBanner({ text, onDismiss }) {
  return (
    <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
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
      <div style={{ position: 'relative', background: 'linear-gradient(135deg, rgba(30,35,60,0.98) 0%, rgba(8,10,20,0.99) 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px 20px 0 0', padding: '20px 16px 40px', maxHeight: '65vh', overflowY: 'auto', backdropFilter: 'blur(20px)' }}>
        <div style={{ width: 32, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 14 }}>Add to {section}</p>
        {presets.map((m, i) => (
          <button key={i} onClick={() => { onAdd(m); onClose(); }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'left', marginBottom: 8, fontFamily: 'inherit', transition: 'background 0.15s' }}>
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
    <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : 10}px)`, opacity: visible ? 1 : 0, transition: 'all 0.25s ease', background: 'linear-gradient(135deg, rgba(30,35,60,0.98) 0%, rgba(8,10,20,0.99) 100%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 99, padding: '8px 18px', fontSize: 13, color: '#e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', zIndex: 300, pointerEvents: 'none' }}>
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
          <button onClick={() => onAdd(section)} style={{ fontSize: 12, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}>+ Add</button>
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
            <button onClick={() => onDelete(section, i)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
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
          <div key={i} onClick={i === glasses ? onAdd : undefined} style={{ width: 18, height: 22, borderRadius: 4, background: i < glasses ? '#38bdf8' : 'rgba(255,255,255,0.06)', border: i < glasses ? 'none' : '1px solid rgba(255,255,255,0.1)', cursor: i === glasses ? 'pointer' : 'default', transition: 'background 0.2s', boxShadow: i < glasses ? '0 0 6px rgba(56,189,248,0.4)' : 'none' }} />
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
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: on ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)', border: on ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: on ? '0 0 10px rgba(56,189,248,0.25)' : 'none' }}>
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

export default function NutritionTab() {
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
      calories: { ...d.calories, consumed: d.calories.consumed + cal },
      protein:  { ...d.protein,  consumed: d.protein.consumed  + protein },
      carbs:    { ...d.carbs,    consumed: d.carbs.consumed    + carbs },
      fats:     { ...d.fats,     consumed: d.fats.consumed     + fat },
    }));

  const removeFromNutrition = ({ cal = 0, protein = 0, carbs = 0, fat = 0 }) =>
    setData(d => ({
      ...d,
      calories: { ...d.calories, consumed: Math.max(0, d.calories.consumed - cal) },
      protein:  { ...d.protein,  consumed: Math.max(0, d.protein.consumed  - protein) },
      carbs:    { ...d.carbs,    consumed: Math.max(0, d.carbs.consumed    - carbs) },
      fats:     { ...d.fats,     consumed: Math.max(0, d.fats.consumed     - fat) },
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

  const proteinGap  = data.protein.target - data.protein.consumed;
  const remaining   = data.calories.target - data.calories.consumed;
  const insightText = proteinGap > 0
    ? `Eat ${proteinGap}g more protein to hit your daily target.`
    : remaining > 0
    ? `${remaining} kcal left — add a meal to reach your goal.`
    : "You've nailed today's nutrition goals!";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 32 }}>
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
        <MacroBar label="Protein"       current={data.protein.consumed} target={data.protein.target} color="#38bdf8" />
        <MacroBar label="Carbohydrates" current={data.carbs.consumed}   target={data.carbs.target}   color="#22c55e" />
        <MacroBar label="Fat"           current={data.fats.consumed}    target={data.fats.target}    color="#f59e0b" />
      </div>

      <div style={nutCard}>
        <span style={nutLabel}>Add food</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          {QUICK_ADD_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => handleQuickAdd(opt)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: opt.key === 'shake' ? 'rgba(56,189,248,0.12)' : 'rgba(245,158,11,0.12)', border: opt.key === 'shake' ? '1px solid rgba(56,189,248,0.2)' : '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                {opt.key === 'shake' ? <Droplets size={14} color="#38bdf8" /> : <Zap size={14} color="#f59e0b" />}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: '0 0 2px' }}>{opt.label}</p>
              <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', margin: 0 }}>{opt.sub}</p>
            </button>
          ))}
        </div>
        <button onClick={() => setShowScanner(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}>
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

      <div style={nutCard}>
        <span style={nutLabel}>Meal log</span>
        {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((section, i) => (
          <NutMealSection key={section} section={section} items={meals[section] || []} onAdd={setAddingTo} onDelete={handleDeleteMeal} divider={i > 0} />
        ))}
      </div>

      <div style={nutCard}>
        <span style={nutLabel}>Weekly consistency</span>
        <NutWeekDots days={data.weekDays} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{ ...CARD, borderRadius: 16, padding: 14 }}>
          <NutWaterTracker glasses={data.water.glasses} target={data.water.target} onAdd={handleAddWater} />
        </div>
        <div style={{ ...CARD, borderRadius: 16, padding: 14 }}>
          <span style={nutLabel}>Streak</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Flame size={18} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' }} />
            <span style={{ fontSize: 28, fontWeight: 600, color: '#e2e8f0', lineHeight: 1, letterSpacing: '-0.02em' }}>{data.streak}</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', margin: 0 }}>days on track</p>
        </div>
      </div>

      <div style={nutCard}>
        <span style={nutLabel}>Current goal</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Goal',     value: 'Muscle gain' },
            { label: 'Calories', value: `${data.calories.target.toLocaleString()} kcal` },
            { label: 'Protein',  value: `${data.protein.target}g` },
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
        <BarcodeScannerModal onAdd={(section, meal) => handleAddMeal(section, meal)} onClose={() => setShowScanner(false)} />
      )}
      <NutritionToast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}