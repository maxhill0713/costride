import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Flame, ChevronRight, Droplets, Zap, ScanBarcode, X,
  Search, Clock, Star, BookMarked, ChevronDown, ChevronUp,
  Plus, Minus, Check, ArrowLeft, Pencil, BarChart2, Target,
  TrendingUp, Loader2, AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS  (extend your existing palette)
───────────────────────────────────────────────────────────── */
const T = {
  bg:          'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  bgSolid:     'linear-gradient(135deg, rgba(30,35,60,0.98) 0%, rgba(8,10,20,0.99) 100%)',
  border:      '1px solid rgba(255,255,255,0.07)',
  borderMd:    '1px solid rgba(255,255,255,0.10)',
  borderHi:    '1px solid rgba(255,255,255,0.14)',
  blur:        'blur(16px)',
  blurHi:      'blur(24px)',
  rad:         16,
  radSm:       10,
  radXs:       8,
  text:        '#e2e8f0',
  textMuted:   'rgba(148,163,184,0.7)',
  textFaint:   'rgba(148,163,184,0.4)',
  blue:        '#38bdf8',
  blueDim:     'rgba(56,189,248,0.12)',
  blueBorder:  'rgba(56,189,248,0.22)',
  green:       '#22c55e',
  amber:       '#f59e0b',
  red:         '#f87171',
  redDim:      'rgba(239,68,68,0.10)',
  redBorder:   'rgba(239,68,68,0.20)',
  purple:      '#a78bfa',
  purpleDim:   'rgba(167,139,250,0.12)',
  purpleBorder:'rgba(167,139,250,0.22)',
};

/* ─────────────────────────────────────────────────────────────
   MOCK FOOD DATABASE
───────────────────────────────────────────────────────────── */
const FOOD_DB = [
  // Proteins
  { id: 'f001', name: 'Chicken Breast (grilled)',  brand: 'Generic',       cal: 165,  protein: 31, carbs: 0,  fat: 3.6, serving: '100g',  servingG: 100  },
  { id: 'f002', name: 'Salmon Fillet',             brand: 'Generic',       cal: 208,  protein: 20, carbs: 0,  fat: 13,  serving: '100g',  servingG: 100  },
  { id: 'f003', name: 'Greek Yoghurt (0% fat)',    brand: 'Fage',          cal: 57,   protein: 10, carbs: 3.6,fat: 0.2, serving: '100g',  servingG: 100  },
  { id: 'f004', name: 'Eggs (large)',              brand: 'Generic',       cal: 78,   protein: 6,  carbs: 0.6,fat: 5,   serving: '1 egg', servingG: 60   },
  { id: 'f005', name: 'Whey Protein Powder',       brand: 'Optimum Nutrition', cal: 120, protein: 24, carbs: 3, fat: 1.5, serving: '1 scoop', servingG: 30 },
  { id: 'f006', name: 'Tuna (canned in water)',    brand: 'John West',     cal: 109,  protein: 25, carbs: 0,  fat: 1,   serving: '100g',  servingG: 100  },
  { id: 'f007', name: 'Cottage Cheese',            brand: 'Generic',       cal: 98,   protein: 11, carbs: 3.4,fat: 4.3, serving: '100g',  servingG: 100  },
  // Carbs
  { id: 'f008', name: 'Oats (rolled)',             brand: 'Quaker',        cal: 389,  protein: 17, carbs: 66, fat: 7,   serving: '100g',  servingG: 100  },
  { id: 'f009', name: 'Brown Rice (cooked)',       brand: 'Generic',       cal: 111,  protein: 2.6,carbs: 23, fat: 0.9, serving: '100g',  servingG: 100  },
  { id: 'f010', name: 'Wholemeal Bread',           brand: 'Hovis',         cal: 217,  protein: 8.7,carbs: 39, fat: 2.7, serving: '2 slices', servingG: 70 },
  { id: 'f011', name: 'Sweet Potato (baked)',      brand: 'Generic',       cal: 90,   protein: 2,  carbs: 21, fat: 0.1, serving: '100g',  servingG: 100  },
  { id: 'f012', name: 'Banana',                   brand: 'Generic',       cal: 89,   protein: 1.1,carbs: 23, fat: 0.3, serving: '1 medium', servingG: 118},
  { id: 'f013', name: 'Pasta (cooked)',            brand: 'Generic',       cal: 131,  protein: 5,  carbs: 25, fat: 1.1, serving: '100g',  servingG: 100  },
  // Snacks / other
  { id: 'f014', name: 'Almonds (raw)',             brand: 'Generic',       cal: 579,  protein: 21, carbs: 22, fat: 50,  serving: '30g',   servingG: 30   },
  { id: 'f015', name: 'Protein Bar',               brand: 'Grenade',       cal: 207,  protein: 21, carbs: 20, fat: 7,   serving: '1 bar', servingG: 60   },
  { id: 'f016', name: 'Avocado',                  brand: 'Generic',       cal: 160,  protein: 2,  carbs: 9,  fat: 15,  serving: '½ avocado', servingG: 75},
  { id: 'f017', name: 'Milk (semi-skimmed)',       brand: 'Generic',       cal: 50,   protein: 3.4,carbs: 4.8,fat: 1.8, serving: '100ml', servingG: 100  },
  { id: 'f018', name: 'Peanut Butter',             brand: 'Meridian',      cal: 598,  protein: 25, carbs: 13, fat: 51,  serving: '2 tbsp',servingG: 32   },
  { id: 'f019', name: 'Blueberries',              brand: 'Generic',       cal: 57,   protein: 0.7,carbs: 14, fat: 0.3, serving: '100g',  servingG: 100  },
  { id: 'f020', name: 'Mixed Salad Leaves',        brand: 'Generic',       cal: 17,   protein: 1.3,carbs: 2,  fat: 0.2, serving: '100g',  servingG: 100  },
];

const RECENT_IDS    = ['f001', 'f008', 'f005', 'f015', 'f009', 'f012'];
const FREQUENT_IDS  = ['f001', 'f005', 'f008', 'f004', 'f018'];

const SAVED_MEALS = [
  {
    id: 'sm1', name: 'High-protein breakfast',
    items: [
      { ...FOOD_DB.find(f => f.id === 'f004'), qty: 3 },
      { ...FOOD_DB.find(f => f.id === 'f003'), qty: 1 },
    ],
  },
  {
    id: 'sm2', name: 'Bulk lunch',
    items: [
      { ...FOOD_DB.find(f => f.id === 'f001'), qty: 2 },
      { ...FOOD_DB.find(f => f.id === 'f009'), qty: 2 },
    ],
  },
];

const BARCODE_MOCK_RESULTS = [
  { id: 'b001', name: 'Quaker Oats (instant)',    brand: 'Quaker',   cal: 150, protein: 5,  carbs: 27, fat: 2.5, serving: '1 packet', servingG: 43 },
  { id: 'b002', name: 'Grenade Carb Killa Bar',   brand: 'Grenade',  cal: 219, protein: 21, carbs: 22, fat: 7,   serving: '1 bar',    servingG: 63 },
  { id: 'b003', name: 'Müller Light Yoghurt',     brand: 'Müller',   cal: 98,  protein: 5,  carbs: 14, fat: 1.9, serving: '1 pot',    servingG: 175},
];

const DEFAULT_TARGETS = {
  calories: 2400,
  protein:  180,
  carbs:    260,
  fats:     70,
};

const EMPTY_MEALS = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };

const todayStr = () => new Date().toISOString().split('T')[0];

const MEAL_ICONS = { Breakfast: '☀', Lunch: '⛅', Dinner: '◑', Snacks: '◇' };
const MACRO_COLORS = { protein: T.blue, carbs: T.green, fat: T.amber };

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
let logIdCounter = 100;
const newLogId  = () => `l${++logIdCounter}`;

const macrosFromLog = (item) => ({
  cal:     Math.round((item.cal     / item.servingG) * (item.servingG * item.qty)),
  protein: Math.round((item.protein / item.servingG) * (item.servingG * item.qty)),
  carbs:   Math.round((item.carbs   / item.servingG) * (item.servingG * item.qty)),
  fat:     Math.round((item.fat     / item.servingG) * (item.servingG * item.qty)),
});

const sumMeals = (meals) => {
  let cal = 0, protein = 0, carbs = 0, fat = 0;
  Object.values(meals).flat().forEach(item => {
    const m = macrosFromLog(item);
    cal += m.cal; protein += m.protein; carbs += m.carbs; fat += m.fat;
  });
  return { cal, protein, carbs, fat };
};

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

/* ─────────────────────────────────────────────────────────────
   MICRO UI ATOMS
───────────────────────────────────────────────────────────── */
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: T.bg, border: T.border, backdropFilter: T.blur,
    WebkitBackdropFilter: T.blur, borderRadius: T.rad, padding: 18,
    marginBottom: 12, cursor: onClick ? 'pointer' : undefined,
    transition: 'border 0.2s', ...style,
  }}>
    {children}
  </div>
);

const SectionLabel = ({ children, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
    <span style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
      {children}
    </span>
    {action}
  </div>
);

const Divider = () => (
  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
);

const IconBox = ({ color, dimColor, borderColor, size = 32, children }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
    background: dimColor, border: `1px solid ${borderColor}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {children}
  </div>
);

const Pill = ({ children, color, dim, border, onClick, style }) => (
  <button onClick={onClick} style={{
    background: dim, border: `1px solid ${border}`, color,
    borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600,
    cursor: onClick ? 'pointer' : 'default', fontFamily: 'inherit',
    transition: 'background 0.15s', ...style,
  }}>
    {children}
  </button>
);

/* ─────────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────────── */
function Toast({ msg, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 10}px)`,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.22s ease, transform 0.22s ease',
      background: T.bgSolid, border: T.borderMd,
      borderRadius: 99, padding: '9px 20px', fontSize: 13,
      color: T.text, boxShadow: '0 6px 28px rgba(0,0,0,0.55)',
      whiteSpace: 'nowrap', zIndex: 500, pointerEvents: 'none',
    }}>
      {msg}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   INSIGHT BANNER
───────────────────────────────────────────────────────────── */
function InsightBanner({ text, onDismiss }) {
  return (
    <div style={{
      background: T.blueDim, border: `1px solid ${T.blueBorder}`,
      borderRadius: T.radSm, padding: '11px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18,
    }}>
      <TrendingUp size={14} color={T.blue} style={{ flexShrink: 0, marginTop: 2 }} />
      <p style={{ flex: 1, fontSize: 13, color: '#7dd3fc', lineHeight: 1.55, margin: 0 }}>{text}</p>
      <button onClick={onDismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 0, color: T.blue, fontSize: 17, lineHeight: 1,
        opacity: 0.55, flexShrink: 0, fontFamily: 'inherit',
      }}>×</button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CALORIE RING
───────────────────────────────────────────────────────────── */
function CalorieRing({ consumed, target }) {
  const pct  = Math.min(Math.round((consumed / target) * 100), 100);
  const over = consumed > target;
  const r    = 42;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.78;
  const fill = arc * Math.min(pct / 100, 1);
  const strokeColor = over ? T.red : T.blue;
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: 104, height: 104 }}>
      <svg width={104} height={104} style={{ display: 'block' }}>
        <circle cx={52} cy={52} r={r} fill="none" stroke="rgba(255,255,255,0.05)"
          strokeWidth={7.5} strokeDasharray={`${arc} ${circ - arc}`}
          strokeLinecap="round" transform="rotate(141 52 52)" />
        <circle cx={52} cy={52} r={r} fill="none" stroke={strokeColor}
          strokeWidth={7.5} strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round" transform="rotate(141 52 52)"
          style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 7px ${strokeColor}88)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: T.text, letterSpacing: '-0.03em' }}>{pct}%</span>
        <span style={{ fontSize: 10.5, color: T.textFaint, marginTop: 3 }}>of goal</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MACRO BAR
───────────────────────────────────────────────────────────── */
function MacroBar({ label, current, target, color }) {
  const pct  = Math.min((current / target) * 100, 100);
  const over = current > target;
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, color: T.textMuted, fontWeight: 500 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: over ? T.red : T.text }}>{current}g</span>
          <span style={{ fontSize: 11, color: T.textFaint }}>/ {target}g</span>
        </div>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, width: `${pct}%`,
          background: over ? T.red : color,
          transition: 'width 0.9s cubic-bezier(.4,0,.2,1)',
          boxShadow: `0 0 8px ${over ? T.red : color}66`,
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MACRO CHIP ROW
───────────────────────────────────────────────────────────── */
function MacroChips({ protein, carbs, fat, small }) {
  const items = [
    { label: 'P', value: protein, color: T.blue,  dim: T.blueDim,   border: T.blueBorder   },
    { label: 'C', value: carbs,   color: T.green,  dim: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
    { label: 'F', value: fat,     color: T.amber,  dim: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  ];
  return (
    <div style={{ display: 'flex', gap: small ? 5 : 6, flexWrap: 'wrap' }}>
      {items.map(({ label, value, color, dim, border }) => (
        <div key={label} style={{
          background: dim, border: `1px solid ${border}`, borderRadius: 6,
          padding: small ? '2px 7px' : '3px 9px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ fontSize: small ? 10 : 10.5, fontWeight: 700, color, letterSpacing: '0.04em' }}>{label}</span>
          <span style={{ fontSize: small ? 10 : 11, color: T.text, fontWeight: 500 }}>{value}g</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   WATER TRACKER
───────────────────────────────────────────────────────────── */
function WaterTracker({ glasses, target, onAdd }) {
  return (
    <div>
      <SectionLabel>Hydration</SectionLabel>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
        {Array.from({ length: target }).map((_, i) => (
          <div key={i} onClick={i === glasses ? onAdd : undefined} style={{
            width: 19, height: 24, borderRadius: 5,
            background: i < glasses ? T.blue : 'rgba(255,255,255,0.05)',
            border: i < glasses ? 'none' : '1px solid rgba(255,255,255,0.09)',
            cursor: i === glasses ? 'pointer' : 'default',
            transition: 'background 0.25s',
            boxShadow: i < glasses ? `0 0 7px ${T.blue}66` : 'none',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
        <span style={{ fontWeight: 700, color: T.text }}>{glasses}</span>
        <span style={{ color: T.textFaint }}> / {target} glasses</span>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   WEEK DOTS
───────────────────────────────────────────────────────────── */
function WeekDots({ days }) {
  const labels  = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const onTrack = days.filter(Boolean).length;
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {days.map((on, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: on ? 'rgba(56,189,248,0.14)' : 'rgba(255,255,255,0.04)',
              border: on ? `1px solid ${T.blueBorder}` : '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: on ? `0 0 12px rgba(56,189,248,0.28)` : 'none',
              transition: 'all 0.3s',
            }}>
              {on && <Check size={11} color={T.blue} strokeWidth={2.5} />}
            </div>
            <span style={{ fontSize: 10, color: on ? T.blue : T.textFaint, fontWeight: on ? 600 : 400 }}>{labels[i]}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: T.textMuted, margin: 0 }}>
        <span style={{ fontWeight: 700, color: T.text }}>{onTrack}/7 days</span> on track this week
      </p>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   FOOD DETAIL SHEET  (serving qty editor + macros)
───────────────────────────────────────────────────────────── */
function FoodDetailSheet({ food, section, onConfirm, onClose }) {
  const [qty, setQty] = useState(1);
  const cal     = Math.round(food.cal     * qty);
  const protein = Math.round(food.protein * qty);
  const carbs   = Math.round(food.carbs   * qty);
  const fat     = Math.round(food.fat     * qty);

  return (
    <BottomSheet onClose={onClose}>
      <p style={{ fontSize: 11, color: T.textFaint, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{food.brand}</p>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 18px', lineHeight: 1.3 }}>{food.name}</h3>

      {/* Big calorie display */}
      <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: T.rad, padding: '20px 16px', marginBottom: 18, border: T.border }}>
        <p style={{ fontSize: 42, fontWeight: 700, color: T.text, letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 4px' }}>{cal}</p>
        <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 14px' }}>kcal</p>
        <MacroChips protein={protein} carbs={carbs} fat={fat} />
      </div>

      {/* Serving info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 2px' }}>
        <div>
          <p style={{ fontSize: 11, color: T.textFaint, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Serving size</p>
          <p style={{ fontSize: 14, color: T.text, fontWeight: 600, margin: 0 }}>{food.serving}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <button onClick={() => setQty(q => Math.max(0.5, +(q - 0.5).toFixed(1)))} style={qtyBtnStyle}>
            <Minus size={14} color={T.text} />
          </button>
          <div style={{ width: 52, textAlign: 'center', fontSize: 18, fontWeight: 700, color: T.text }}>{qty}</div>
          <button onClick={() => setQty(q => +(q + 0.5).toFixed(1))} style={qtyBtnStyle}>
            <Plus size={14} color={T.text} />
          </button>
        </div>
      </div>

      {/* Per-macro rows */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: T.radSm, border: T.border, marginBottom: 20, overflow: 'hidden' }}>
        {[
          { label: 'Protein',       value: protein, unit: 'g', color: T.blue   },
          { label: 'Carbohydrates', value: carbs,   unit: 'g', color: T.green  },
          { label: 'Fat',           value: fat,     unit: 'g', color: T.amber  },
        ].map(({ label, value, unit, color }, i, arr) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '11px 14px',
            borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
              <span style={{ fontSize: 13, color: T.textMuted }}>{label}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{value}{unit}</span>
          </div>
        ))}
      </div>

      <button onClick={() => onConfirm({ section, food, qty })} style={primaryBtnStyle}>
        <Plus size={15} color="#000" strokeWidth={2.5} />
        Add to {section}
      </button>
    </BottomSheet>
  );
}
const qtyBtnStyle = {
  width: 36, height: 36, borderRadius: T.radXs, background: 'rgba(255,255,255,0.06)',
  border: T.border, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s',
};
const primaryBtnStyle = {
  width: '100%', height: 48, borderRadius: T.radSm,
  background: T.blue, border: 'none', color: '#000', fontSize: 14,
  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  transition: 'opacity 0.15s',
};

/* ─────────────────────────────────────────────────────────────
   BOTTOM SHEET WRAPPER
───────────────────────────────────────────────────────────── */
function BottomSheet({ onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} onClick={onClose} />
      <div style={{
        position: 'relative',
        background: T.bgSolid, border: T.borderMd,
        borderRadius: '22px 22px 0 0', padding: '18px 18px 42px',
        maxHeight: '90vh', overflowY: 'auto',
        backdropFilter: T.blurHi, WebkitBackdropFilter: T.blurHi,
      }}>
        <div style={{ width: 34, height: 3.5, borderRadius: 99, background: 'rgba(255,255,255,0.14)', margin: '0 auto 20px' }} />
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SEARCH BAR
───────────────────────────────────────────────────────────── */
function SearchBar({ value, onChange, loading }) {
  return (
    <div style={{ position: 'relative' }}>
      <Search size={15} color={T.textMuted} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search foods…"
        autoFocus
        style={{
          width: '100%', height: 42, borderRadius: T.radSm,
          background: 'rgba(255,255,255,0.06)', border: T.borderMd,
          color: T.text, fontSize: 14, fontFamily: 'inherit',
          paddingLeft: 38, paddingRight: value ? 36 : 14,
          outline: 'none', boxSizing: 'border-box',
          caretColor: T.blue,
        }}
      />
      {value && !loading && (
        <button onClick={() => onChange('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: T.textMuted }}>
          <X size={14} />
        </button>
      )}
      {loading && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', animation: 'spin 0.8s linear infinite' }}>
          <Loader2 size={14} color={T.blue} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FOOD LIST ITEM
───────────────────────────────────────────────────────────── */
function FoodListItem({ food, onSelect, showBrand = true }) {
  return (
    <button onClick={() => onSelect(food)} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 0', borderTop: '1px solid rgba(255,255,255,0.05)',
      background: 'none', border: 'none', cursor: 'pointer',
      borderTop: '1px solid rgba(255,255,255,0.05)', fontFamily: 'inherit',
      textAlign: 'left', transition: 'opacity 0.15s',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: T.text, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{food.name}</p>
        {showBrand && <p style={{ fontSize: 11.5, color: T.textFaint, margin: 0 }}>{food.brand} · {food.serving}</p>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 2px', letterSpacing: '-0.02em' }}>{food.cal}</p>
        <p style={{ fontSize: 10.5, color: T.textFaint, margin: 0 }}>kcal</p>
      </div>
      <ChevronRight size={14} color={T.textFaint} />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   ADD FOOD SHEET  (search + recents + frequent + saved meals)
───────────────────────────────────────────────────────────── */
function AddFoodSheet({ section, onAdd, onClose }) {
  const [query, setQuery]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const [tab, setTab]             = useState('search');  // 'search' | 'saved'
  const [quickCal, setQuickCal]   = useState('');
  const [quickMode, setQuickMode] = useState(false);

  const debouncedQuery = useDebounce(query, 240);

  // Simulate async search
  useEffect(() => {
    if (!debouncedQuery) { setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 380);
    return () => clearTimeout(t);
  }, [debouncedQuery]);

  const results = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return FOOD_DB.filter(f => f.name.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q)).slice(0, 10);
  }, [debouncedQuery]);

  const recentFoods   = RECENT_IDS.map(id => FOOD_DB.find(f => f.id === id)).filter(Boolean);
  const frequentFoods = FREQUENT_IDS.map(id => FOOD_DB.find(f => f.id === id)).filter(Boolean);

  const handleSelect = (food) => setSelected(food);
  const handleConfirm = ({ section: sec, food, qty }) => {
    onAdd(sec, food, qty);
    onClose();
  };

  const handleQuickAdd = () => {
    const cal = parseInt(quickCal, 10);
    if (!cal || cal < 1) return;
    const syntheticFood = { id: `q${Date.now()}`, name: `Quick add · ${cal} kcal`, brand: 'Manual', cal, protein: 0, carbs: 0, fat: 0, serving: '1 entry', servingG: 1 };
    onAdd(section, syntheticFood, 1);
    onClose();
  };

  if (selected) {
    return <FoodDetailSheet food={selected} section={section} onConfirm={handleConfirm} onClose={() => setSelected(null)} />;
  }

  return (
    <BottomSheet onClose={onClose}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <span style={{ fontSize: 16 }}>{MEAL_ICONS[section]}</span>
          <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Add to {section}</p>
        </div>
        <button onClick={() => setQuickMode(m => !m)} style={{
          background: quickMode ? T.blueDim : 'rgba(255,255,255,0.05)',
          border: quickMode ? `1px solid ${T.blueBorder}` : T.border,
          borderRadius: T.radXs, padding: '5px 10px', cursor: 'pointer',
          fontSize: 12, color: quickMode ? T.blue : T.textMuted, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Zap size={12} color={quickMode ? T.blue : T.textMuted} />
          Quick add
        </button>
      </div>

      {/* Quick add calories panel */}
      {quickMode && (
        <div style={{ background: T.blueDim, border: `1px solid ${T.blueBorder}`, borderRadius: T.radSm, padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 10px' }}>Enter calories to add directly</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number" placeholder="e.g. 350"
              value={quickCal} onChange={e => setQuickCal(e.target.value)}
              style={{
                flex: 1, height: 40, borderRadius: T.radXs,
                background: 'rgba(255,255,255,0.06)', border: T.borderMd,
                color: T.text, fontSize: 15, fontFamily: 'inherit',
                paddingLeft: 12, outline: 'none', caretColor: T.blue,
              }}
            />
            <button onClick={handleQuickAdd} style={{ ...primaryBtnStyle, width: 60, height: 40 }}>
              <Check size={16} color="#000" />
            </button>
          </div>
        </div>
      )}

      {/* Tab row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          { key: 'search', label: 'Search', icon: <Search size={12} /> },
          { key: 'saved',  label: 'Saved meals', icon: <BookMarked size={12} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, height: 36, borderRadius: T.radXs,
            background: tab === t.key ? T.blueDim : 'rgba(255,255,255,0.04)',
            border: tab === t.key ? `1px solid ${T.blueBorder}` : T.border,
            color: tab === t.key ? T.blue : T.textMuted,
            fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s',
          }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── SEARCH TAB ── */}
      {tab === 'search' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <SearchBar value={query} onChange={setQuery} loading={loading} />
          </div>

          {/* Results */}
          {debouncedQuery && !loading && results.length === 0 && (
            <EmptyState icon={<AlertCircle size={22} color={T.textFaint} />} title="No results found" sub={`Try searching for something else.`} />
          )}
          {results.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: T.textFaint, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map(food => <FoodListItem key={food.id} food={food} onSelect={handleSelect} />)}
            </div>
          )}

          {/* Recents + frequent (shown when not searching) */}
          {!debouncedQuery && (
            <>
              <FoodGroup label="Recent" icon={<Clock size={12} color={T.textFaint} />} foods={recentFoods} onSelect={handleSelect} />
              <FoodGroup label="Frequent" icon={<Star size={12} color={T.textFaint} />} foods={frequentFoods} onSelect={handleSelect} />
            </>
          )}
        </>
      )}

      {/* ── SAVED MEALS TAB ── */}
      {tab === 'saved' && (
        <div>
          {SAVED_MEALS.length === 0 ? (
            <EmptyState icon={<BookMarked size={22} color={T.textFaint} />} title="No saved meals" sub="Save a meal to reuse it quickly." />
          ) : SAVED_MEALS.map(meal => (
            <SavedMealRow key={meal.id} meal={meal} section={section} onAdd={onAdd} onClose={onClose} />
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

function FoodGroup({ label, icon, foods, onSelect }) {
  if (!foods.length) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        {icon}
        <p style={{ fontSize: 11, color: T.textFaint, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>{label}</p>
      </div>
      {foods.map(food => <FoodListItem key={food.id} food={food} onSelect={onSelect} />)}
    </div>
  );
}

function SavedMealRow({ meal, section, onAdd, onClose }) {
  const totalCal     = meal.items.reduce((s, i) => s + Math.round(i.cal * i.qty), 0);
  const totalProtein = meal.items.reduce((s, i) => s + Math.round(i.protein * i.qty), 0);
  return (
    <button onClick={() => { meal.items.forEach(i => onAdd(section, i, i.qty)); onClose(); }} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 14px', borderRadius: T.radSm, marginBottom: 8,
      background: 'rgba(255,255,255,0.04)', border: T.border,
      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s',
    }}>
      <IconBox dimColor={T.purpleDim} borderColor={T.purpleBorder} size={34}>
        <BookMarked size={15} color={T.purple} />
      </IconBox>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: T.text, margin: '0 0 3px' }}>{meal.name}</p>
        <p style={{ fontSize: 11.5, color: T.textFaint, margin: 0 }}>{meal.items.length} foods · {totalProtein}g protein</p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 1px', letterSpacing: '-0.02em' }}>{totalCal}</p>
        <p style={{ fontSize: 10.5, color: T.textFaint, margin: 0 }}>kcal</p>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────── */
function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 16px' }}>
      <div style={{ marginBottom: 10, opacity: 0.5 }}>{icon}</div>
      <p style={{ fontSize: 14, fontWeight: 600, color: T.textMuted, margin: '0 0 4px' }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: T.textFaint, margin: 0 }}>{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BARCODE SCANNER MODAL
───────────────────────────────────────────────────────────── */
function BarcodeScannerModal({ onAdd, onClose }) {
  const [phase, setPhase] = useState('scanning'); // 'scanning' | 'found' | 'error'
  const [result, setResult] = useState(null);
  const [section, setSection] = useState('Snacks');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      const mock = BARCODE_MOCK_RESULTS[Math.floor(Math.random() * BARCODE_MOCK_RESULTS.length)];
      setResult(mock);
      setPhase('found');
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  const cal = result ? Math.round(result.cal * qty) : 0;

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <ScanBarcode size={18} color={T.blue} />
        <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Barcode Scanner</p>
      </div>

      {/* Scanner viewport */}
      <div style={{
        borderRadius: T.rad, overflow: 'hidden',
        position: 'relative', marginBottom: 20, height: 160,
        background: 'rgba(0,0,0,0.5)', border: `1px solid rgba(56,189,248,0.2)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Fake viewfinder */}
        <div style={{ position: 'absolute', inset: 16, border: `1.5px solid ${T.blueBorder}`, borderRadius: 8, pointerEvents: 'none' }} />
        {[0, 1, 2, 3].map(i => {
          const top  = i < 2;
          const left = i % 2 === 0;
          return (
            <div key={i} style={{
              position: 'absolute',
              top:    top  ? 16 : undefined, bottom: !top  ? 16 : undefined,
              left:   left ? 16 : undefined, right:  !left ? 16 : undefined,
              width: 20, height: 20,
              borderTop:    top  ? `2.5px solid ${T.blue}` : 'none',
              borderBottom: !top ? `2.5px solid ${T.blue}` : 'none',
              borderLeft:   left ? `2.5px solid ${T.blue}` : 'none',
              borderRight:  !left ? `2.5px solid ${T.blue}` : 'none',
            }} />
          );
        })}

        {phase === 'scanning' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ animation: 'spin 1s linear infinite', marginBottom: 10, display: 'inline-block' }}>
              <Loader2 size={24} color={T.blue} />
            </div>
            <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Scanning barcode…</p>
          </div>
        )}

        {phase === 'found' && result && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(56,189,248,0.15)', border: `1px solid ${T.blueBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <Check size={18} color={T.blue} strokeWidth={2.5} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>{result.name}</p>
            <p style={{ fontSize: 12, color: T.textFaint, margin: 0 }}>{result.brand}</p>
          </div>
        )}
      </div>

      {phase === 'found' && result && (
        <>
          {/* Macro summary */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: T.radSm, border: T.border, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>{result.name}</p>
                <p style={{ fontSize: 12, color: T.textFaint, margin: 0 }}>{result.serving}</p>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.03em', margin: 0 }}>{cal} <span style={{ fontSize: 12, fontWeight: 400, color: T.textFaint }}>kcal</span></p>
            </div>
            <MacroChips
              protein={Math.round(result.protein * qty)}
              carbs={Math.round(result.carbs * qty)}
              fat={Math.round(result.fat * qty)}
              small
            />
          </div>

          {/* Qty + section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, margin: '0 0 6px' }}>Quantity</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <button onClick={() => setQty(q => Math.max(0.5, +(q - 0.5).toFixed(1)))} style={qtyBtnStyle}><Minus size={13} color={T.text} /></button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, color: T.text }}>{qty}</div>
                <button onClick={() => setQty(q => +(q + 0.5).toFixed(1))} style={qtyBtnStyle}><Plus size={13} color={T.text} /></button>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, margin: '0 0 6px' }}>Meal</p>
              <select value={section} onChange={e => setSection(e.target.value)} style={{
                width: '100%', height: 36, borderRadius: T.radXs,
                background: 'rgba(255,255,255,0.06)', border: T.borderMd,
                color: T.text, fontSize: 13, fontFamily: 'inherit', paddingLeft: 10, outline: 'none',
              }}>
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button onClick={() => { onAdd(section, result, qty); onClose(); }} style={primaryBtnStyle}>
            <Plus size={15} color="#000" strokeWidth={2.5} />
            Add to {section}
          </button>
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </BottomSheet>
  );
}

/* ─────────────────────────────────────────────────────────────
   MEAL SECTION
───────────────────────────────────────────────────────────── */
function MealSection({ section, items, onAdd, onDelete, divider }) {
  const [collapsed, setCollapsed] = useState(false);
  const sectionCal     = items.reduce((s, m) => s + macrosFromLog(m).cal, 0);
  const sectionProtein = items.reduce((s, m) => s + macrosFromLog(m).protein, 0);

  return (
    <>
      {divider && <Divider />}
      <div>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0 0' }}>
          <button onClick={() => setCollapsed(c => !c)} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'none',
            border: 'none', cursor: 'pointer', padding: 0,
          }}>
            <span style={{ fontSize: 15 }}>{MEAL_ICONS[section]}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{section}</span>
            {sectionCal > 0 && (
              <span style={{ fontSize: 12, color: T.textFaint, fontWeight: 500 }}>{sectionCal} kcal</span>
            )}
            {collapsed
              ? <ChevronDown size={14} color={T.textFaint} />
              : <ChevronUp size={14} color={T.textFaint} />
            }
          </button>
          <button onClick={() => onAdd(section)} style={{
            fontSize: 12, color: T.blue, background: T.blueDim,
            border: `1px solid ${T.blueBorder}`, borderRadius: T.radXs,
            padding: '5px 11px', cursor: 'pointer', fontFamily: 'inherit',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, transition: 'background 0.15s',
          }}>
            <Plus size={12} color={T.blue} strokeWidth={2.5} />Add
          </button>
        </div>

        {/* Items */}
        {!collapsed && (
          <div style={{ paddingBottom: 10, paddingTop: 4 }}>
            {items.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
                <p style={{ fontSize: 12, color: T.textFaint, margin: 0, flexShrink: 0 }}>Nothing logged yet</p>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
              </div>
            ) : items.map((m, i) => {
              const mc = macrosFromLog(m);
              return (
                <div key={m.logId} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, color: T.text, margin: '0 0 4px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11.5, color: T.textFaint }}>{m.qty > 1 ? `${m.qty}×` : ''} {m.serving}</span>
                      <MacroChips protein={mc.protein} carbs={mc.carbs} fat={mc.fat} small />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 1px', letterSpacing: '-0.02em' }}>{mc.cal}</p>
                    <p style={{ fontSize: 10, color: T.textFaint, margin: 0 }}>kcal</p>
                  </div>
                  <button onClick={() => onDelete(section, i)} style={{
                    width: 28, height: 28, borderRadius: T.radXs,
                    background: T.redDim, border: `1px solid ${T.redBorder}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background 0.15s',
                  }}>
                    <X size={12} color={T.red} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUMMARY STAT GRID
───────────────────────────────────────────────────────────── */
function StatGrid({ consumed, nutrition }) {
  const remaining = Math.max(nutrition.calories.target - consumed.cal, 0);
  const burned    = 480; // mocked
  const net       = consumed.cal - burned;
  const stats = [
    { label: 'Goal',      value: nutrition.calories.target.toLocaleString(), unit: 'kcal', icon: <Target size={13} color={T.blue} />,  dim: T.blueDim,   border: T.blueBorder   },
    { label: 'Consumed',  value: consumed.cal.toLocaleString(),              unit: 'kcal', icon: <BarChart2 size={13} color={T.green} />, dim: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
    { label: 'Remaining', value: remaining.toLocaleString(),                 unit: 'kcal', icon: <TrendingUp size={13} color={T.amber} />, dim: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
      {stats.map(({ label, value, unit, icon, dim, border }) => (
        <div key={label} style={{ background: dim, border: `1px solid ${border}`, borderRadius: T.radSm, padding: '12px 10px', textAlign: 'center' }}>
          <div style={{ marginBottom: 6, opacity: 0.85 }}>{icon}</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: '0 0 2px', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
          <p style={{ fontSize: 10, color: T.textFaint, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN NUTRITION TAB
───────────────────────────────────────────────────────────── */
export default function NutritionTab() {
  const queryClient = useQueryClient();
  const [addingTo, setAddingTo]       = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [insight, setInsight]         = useState(true);
  const [toast, setToast]             = useState({ msg: '', visible: false });
  const toastTimer                    = useRef(null);
  const saveTimer                     = useRef(null);

  // ── Current user ──────────────────────────────────────────
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  // ── Today's log ───────────────────────────────────────────
  const today = todayStr();
  const { data: todayLog, isLoading } = useQuery({
    queryKey: ['nutritionLog', currentUser?.id, today],
    queryFn: () => base44.entities.NutritionLog.filter({ user_id: currentUser.id, log_date: today }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!currentUser?.id,
    staleTime: 60 * 1000,
  });

  // ── Last 7 days logs (for weekly consistency) ─────────────
  const { data: weekLogs = [] } = useQuery({
    queryKey: ['nutritionWeek', currentUser?.id],
    queryFn: async () => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });
      return base44.entities.NutritionLog.filter({ user_id: currentUser.id }, '-log_date', 7);
    },
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
  });

  // ── Targets: from existing log or user profile or defaults ─
  const targets = useMemo(() => ({
    calories: todayLog?.calorie_target || currentUser?.calorie_target || DEFAULT_TARGETS.calories,
    protein:  todayLog?.protein_target || currentUser?.protein_target || DEFAULT_TARGETS.protein,
    carbs:    todayLog?.carbs_target   || currentUser?.carbs_target   || DEFAULT_TARGETS.carbs,
    fats:     todayLog?.fats_target    || currentUser?.fats_target    || DEFAULT_TARGETS.fats,
    waterTarget: 8,
    nutritionGoal: todayLog?.nutrition_goal || currentUser?.nutrition_goal || 'muscle_gain',
  }), [todayLog, currentUser]);

  // ── Local state seeded from DB ────────────────────────────
  const [meals, setMeals]         = useState(EMPTY_MEALS);
  const [waterGlasses, setWater]  = useState(0);
  const [logId, setLogId]         = useState(null);

  // Seed state from DB once loaded
  useEffect(() => {
    if (todayLog) {
      setMeals(todayLog.meals || EMPTY_MEALS);
      setWater(todayLog.water_glasses || 0);
      setLogId(todayLog.id || null);
    } else if (todayLog === null && !isLoading) {
      // No log yet — start fresh
      setMeals(EMPTY_MEALS);
      setWater(0);
      setLogId(null);
    }
  }, [todayLog, isLoading]);

  // ── Save mutation ─────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async ({ meals, waterGlasses }) => {
      const payload = {
        user_id: currentUser.id,
        log_date: today,
        meals,
        water_glasses: waterGlasses,
        calorie_target: targets.calories,
        protein_target: targets.protein,
        carbs_target:   targets.carbs,
        fats_target:    targets.fats,
        nutrition_goal: targets.nutritionGoal,
      };
      if (logId) {
        return base44.entities.NutritionLog.update(logId, payload);
      } else {
        const created = await base44.entities.NutritionLog.create(payload);
        setLogId(created.id);
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionLog', currentUser?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['nutritionWeek', currentUser?.id] });
    },
  });

  // Debounced auto-save whenever meals or water change
  const scheduleAutoSave = useCallback((meals, water) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (currentUser?.id) saveMutation.mutate({ meals, waterGlasses: water });
    }, 800);
  }, [currentUser?.id]);

  // ── Derived consumed totals ───────────────────────────────
  const consumed = useMemo(() => sumMeals(meals), [meals]);

  // ── Weekly dots: did user log anything each day ───────────
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      return weekLogs.some(l => l.log_date === ds);
    });
  }, [weekLogs]);

  // ── Streak: consecutive logged days up to today ───────────
  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (weekLogs.some(l => l.log_date === ds)) count++;
      else break;
    }
    return count;
  }, [weekLogs]);

  const showToast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  }, []);

  const handleAddFood = useCallback((section, food, qty) => {
    setMeals(m => {
      const updated = { ...m, [section]: [...(m[section] || []), { ...food, qty, logId: newLogId() }] };
      scheduleAutoSave(updated, waterGlasses);
      return updated;
    });
    showToast(`✓ ${food.name} added to ${section}`);
  }, [showToast, scheduleAutoSave, waterGlasses]);

  const handleDeleteFood = useCallback((section, idx) => {
    const name = meals[section][idx]?.name ?? 'Item';
    setMeals(m => {
      const updated = { ...m, [section]: m[section].filter((_, i) => i !== idx) };
      scheduleAutoSave(updated, waterGlasses);
      return updated;
    });
    showToast(`Removed ${name}`);
  }, [meals, showToast, scheduleAutoSave, waterGlasses]);

  const handleAddWater = useCallback(() => {
    setWater(w => {
      const next = Math.min(w + 1, targets.waterTarget);
      scheduleAutoSave(meals, next);
      return next;
    });
    showToast('💧 Water logged');
  }, [showToast, scheduleAutoSave, meals, targets.waterTarget]);

  // ── Insight text ──────────────────────────────────────────
  const proteinGap  = targets.protein  - consumed.protein;
  const calorieGap  = targets.calories - consumed.cal;
  const insightText = consumed.cal >= targets.calories
    ? "🎯 You've hit your calorie goal for today — great work!"
    : proteinGap > 0
    ? `💪 You need ${proteinGap}g more protein to hit your daily target.`
    : `${calorieGap} kcal remaining — keep it up!`;

  const nutrition = {
    calories: { target: targets.calories },
    protein:  { target: targets.protein  },
    carbs:    { target: targets.carbs    },
    fats:     { target: targets.fats     },
    water:    { glasses: waterGlasses, target: targets.waterTarget },
    streak,
    weekDays,
    nutritionGoal: targets.nutritionGoal,
  };

  if (isLoading && !todayLog) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: i === 1 ? 220 : 140, borderRadius: T.rad, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  const goalLabel = {
    muscle_gain: 'Muscle Gain', fat_loss: 'Fat Loss',
    maintenance: 'Maintenance', performance: 'Performance',
  }[nutrition.nutritionGoal] || 'Muscle Gain';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 40 }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        input::placeholder { color: rgba(148,163,184,0.38); }
        select option { background: #1a1e38; color: #e2e8f0; }
      `}</style>

      {/* ── DAILY OVERVIEW ── */}
      <Card>
        <SectionLabel>Daily Overview</SectionLabel>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          <CalorieRing consumed={consumed.cal} target={nutrition.calories.target} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: T.textFaint, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Calories consumed</p>
            <p style={{ fontSize: 34, fontWeight: 700, color: T.text, lineHeight: 1, margin: '0 0 2px', letterSpacing: '-0.04em' }}>
              {consumed.cal.toLocaleString()}
              <span style={{ fontSize: 14, fontWeight: 400, color: T.textFaint, letterSpacing: 0 }}> kcal</span>
            </p>
            <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>of {nutrition.calories.target.toLocaleString()} kcal goal</p>
          </div>
        </div>

        {insight && <InsightBanner text={insightText} onDismiss={() => setInsight(false)} />}

        <StatGrid consumed={consumed} nutrition={nutrition} />

        <MacroBar label="Protein"       current={consumed.protein} target={nutrition.protein.target} color={MACRO_COLORS.protein} />
        <MacroBar label="Carbohydrates" current={consumed.carbs}   target={nutrition.carbs.target}    color={MACRO_COLORS.carbs}   />
        <MacroBar label="Fat"           current={consumed.fat}     target={nutrition.fats.target}      color={MACRO_COLORS.fat}     />
      </Card>

      {/* ── ADD FOOD ── */}
      <Card>
        <SectionLabel>Add Food</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          {[
            { key: 'shake',  label: 'Protein Shake', sub: '30g protein · 180 kcal', icon: <Droplets size={15} color={T.blue} />,  dim: T.blueDim,   border: T.blueBorder   },
            { key: 'energy', label: '500 kcal Boost', sub: 'Quick energy entry',     icon: <Zap size={15} color={T.amber} />, dim: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
          ].map(opt => (
            <button key={opt.key} onClick={() => {
              const food = opt.key === 'shake'
                ? { id: 'qs', name: 'Protein Shake', brand: 'Manual', cal: 180, protein: 30, carbs: 6, fat: 3, serving: '1 shake', servingG: 1 }
                : { id: 'qe', name: '500 kcal boost', brand: 'Manual', cal: 500, protein: 20, carbs: 60, fat: 18, serving: '1 entry', servingG: 1 };
              handleAddFood('Snacks', food, 1); 
            }} style={{
              background: 'rgba(255,255,255,0.04)', border: T.border,
              borderRadius: T.radSm, padding: '13px 13px', cursor: 'pointer',
              textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: opt.dim, border: `1px solid ${opt.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>
                {opt.icon}
              </div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: T.text, margin: '0 0 3px' }}>{opt.label}</p>
              <p style={{ fontSize: 11.5, color: T.textFaint, margin: 0 }}>{opt.sub}</p>
            </button>
          ))}
        </div>
        <button onClick={() => setShowScanner(true)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 13,
          background: 'rgba(255,255,255,0.04)', border: T.border,
          borderRadius: T.radSm, padding: '13px 14px', cursor: 'pointer',
          fontFamily: 'inherit', transition: 'background 0.15s',
        }}>
          <IconBox dimColor="rgba(255,255,255,0.06)" borderColor="rgba(255,255,255,0.1)" size={34}>
            <ScanBarcode size={16} color={T.textMuted} />
          </IconBox>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>Scan Barcode</p>
            <p style={{ fontSize: 12, color: T.textFaint, margin: 0 }}>Identify packaged food instantly</p>
          </div>
          <ChevronRight size={14} color={T.textFaint} />
        </button>
      </Card>

      {/* ── MEAL LOG ── */}
      <Card>
        <SectionLabel>Meal Log</SectionLabel>
        {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((section, i) => (
          <MealSection
            key={section} section={section}
            items={meals[section] || []}
            onAdd={setAddingTo}
            onDelete={handleDeleteFood}
            divider={i > 0}
          />
        ))}
      </Card>

      {/* ── WEEKLY CONSISTENCY ── */}
      <Card>
        <SectionLabel>Weekly Consistency</SectionLabel>
        <WeekDots days={nutrition.weekDays} />
      </Card>

      {/* ── WATER + STREAK ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <Card style={{ marginBottom: 0, padding: 16 }}>
          <WaterTracker glasses={nutrition.water.glasses} target={nutrition.water.target} onAdd={handleAddWater} />
        </Card>
        <Card style={{ marginBottom: 0, padding: 16 }}>
          <SectionLabel>Streak</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
            <Flame size={22} color={T.amber} style={{ filter: `drop-shadow(0 0 8px ${T.amber}88)` }} />
            <span style={{ fontSize: 34, fontWeight: 700, color: T.text, lineHeight: 1, letterSpacing: '-0.04em' }}>{nutrition.streak}</span>
          </div>
          <p style={{ fontSize: 12, color: T.textFaint, margin: 0 }}>days on track</p>
        </Card>
      </div>

      {/* ── CURRENT GOAL ── */}
      <Card>
        <SectionLabel>
          Current Goal
          <button style={{
            background: 'rgba(255,255,255,0.05)', border: T.border,
            borderRadius: T.radXs, padding: '4px 10px', fontSize: 12,
            color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Pencil size={11} color={T.textMuted} />Edit
          </button>
        </SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Goal',     value: goalLabel,                                   color: T.purple, dim: T.purpleDim, border: T.purpleBorder },
            { label: 'Calories', value: `${nutrition.calories.target.toLocaleString()} kcal`, color: T.blue,   dim: T.blueDim,   border: T.blueBorder   },
            { label: 'Protein',  value: `${nutrition.protein.target}g`,             color: T.green,  dim: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
          ].map(({ label, value, color, dim, border }) => (
            <div key={label} style={{ background: dim, border: `1px solid ${border}`, borderRadius: T.radSm, padding: '12px 10px', textAlign: 'center' }}>
              <p style={{ fontSize: 10, color, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px', fontWeight: 700 }}>{label}</p>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.2 }}>{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── MODALS ── */}
      {addingTo && (
        <AddFoodSheet section={addingTo} onAdd={handleAddFood} onClose={() => setAddingTo(null)} />
      )}
      {showScanner && (
        <BarcodeScannerModal onAdd={handleAddFood} onClose={() => setShowScanner(false)} />
      )}
      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}