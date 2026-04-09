import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Flame, ChevronRight, Droplets, Zap, ScanBarcode, X,
  Search, Clock, Star, BookMarked, ChevronDown, ChevronUp,
  Plus, Minus, Check, Pencil, BarChart2, Target,
  TrendingUp, Loader2, AlertCircle, Users, Calendar,
} from 'lucide-react';

// ─── CSS injected once ────────────────────────────────────────────────────────
const CSS = `
@keyframes nt-shimmer {
  0%   { transform: translateX(-100%); opacity: 0; }
  15%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { transform: translateX(220%); opacity: 0; }
}
@keyframes nt-bar {
  from { width: 0; }
}
@keyframes nt-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes nt-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes nt-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.9; }
}
@keyframes nt-ring-in {
  from { stroke-dasharray: 0 999; }
}
`;
function injectCSS() {
  if (!document.getElementById('nt-css')) {
    const s = document.createElement('style');
    s.id = 'nt-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}

// ─── Design tokens (matching ClassDetailModal) ────────────────────────────────
const CARD_BG     = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';
const SHEET_BG    = 'linear-gradient(160deg, #0c1128 0%, #060810 100%)';

const C = {
  blue:    { color: '#38bdf8', rgb: '56,189,248',   bg: 'rgba(14,165,233,0.12)',  border: 'rgba(14,165,233,0.25)', glow: 'rgba(14,165,233,0.3)'  },
  green:   { color: '#34d399', rgb: '52,211,153',   bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', glow: 'rgba(16,185,129,0.3)' },
  amber:   { color: '#fbbf24', rgb: '251,191,36',   bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)', glow: 'rgba(251,191,36,0.25)' },
  red:     { color: '#f87171', rgb: '248,113,113',  bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  glow: 'rgba(239,68,68,0.3)'  },
  purple:  { color: '#c084fc', rgb: '192,132,252',  bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)', glow: 'rgba(168,85,247,0.3)' },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const FOOD_DB = [
  { id: 'f001', name: 'Chicken Breast (grilled)', brand: 'Generic',           cal: 165, protein: 31, carbs: 0,  fat: 3.6, serving: '100g',     servingG: 100 },
  { id: 'f002', name: 'Salmon Fillet',            brand: 'Generic',           cal: 208, protein: 20, carbs: 0,  fat: 13,  serving: '100g',     servingG: 100 },
  { id: 'f003', name: 'Greek Yoghurt (0% fat)',   brand: 'Fage',              cal: 57,  protein: 10, carbs: 3.6,fat: 0.2, serving: '100g',     servingG: 100 },
  { id: 'f004', name: 'Eggs (large)',             brand: 'Generic',           cal: 78,  protein: 6,  carbs: 0.6,fat: 5,   serving: '1 egg',    servingG: 60  },
  { id: 'f005', name: 'Whey Protein Powder',      brand: 'Optimum Nutrition', cal: 120, protein: 24, carbs: 3,  fat: 1.5, serving: '1 scoop',  servingG: 30  },
  { id: 'f006', name: 'Tuna (canned in water)',   brand: 'John West',         cal: 109, protein: 25, carbs: 0,  fat: 1,   serving: '100g',     servingG: 100 },
  { id: 'f008', name: 'Oats (rolled)',            brand: 'Quaker',            cal: 389, protein: 17, carbs: 66, fat: 7,   serving: '100g',     servingG: 100 },
  { id: 'f009', name: 'Brown Rice (cooked)',      brand: 'Generic',           cal: 111, protein: 2.6,carbs: 23, fat: 0.9, serving: '100g',     servingG: 100 },
  { id: 'f012', name: 'Banana',                  brand: 'Generic',           cal: 89,  protein: 1.1,carbs: 23, fat: 0.3, serving: '1 medium', servingG: 118 },
  { id: 'f015', name: 'Protein Bar',             brand: 'Grenade',           cal: 207, protein: 21, carbs: 20, fat: 7,   serving: '1 bar',    servingG: 60  },
  { id: 'f018', name: 'Peanut Butter',           brand: 'Meridian',          cal: 598, protein: 25, carbs: 13, fat: 51,  serving: '2 tbsp',   servingG: 32  },
  { id: 'f019', name: 'Blueberries',             brand: 'Generic',           cal: 57,  protein: 0.7,carbs: 14, fat: 0.3, serving: '100g',     servingG: 100 },
];

const RECENT_IDS   = ['f001', 'f008', 'f005', 'f015', 'f009', 'f012'];
const FREQUENT_IDS = ['f001', 'f005', 'f008', 'f004', 'f018'];
const SAVED_MEALS  = [
  { id: 'sm1', name: 'High-protein breakfast', items: [{ ...FOOD_DB.find(f=>f.id==='f004'), qty:3 }, { ...FOOD_DB.find(f=>f.id==='f003'), qty:1 }] },
  { id: 'sm2', name: 'Bulk lunch',             items: [{ ...FOOD_DB.find(f=>f.id==='f001'), qty:2 }, { ...FOOD_DB.find(f=>f.id==='f009'), qty:2 }] },
];
const BARCODE_MOCK = [
  { id:'b001', name:'Quaker Oats (instant)', brand:'Quaker',  cal:150, protein:5,  carbs:27, fat:2.5, serving:'1 packet', servingG:43 },
  { id:'b002', name:'Grenade Carb Killa',    brand:'Grenade', cal:219, protein:21, carbs:22, fat:7,   serving:'1 bar',    servingG:63 },
];

const TARGETS = { calories:2400, protein:180, carbs:260, fats:70, water:8 };
const EMPTY_MEALS = { Breakfast:[], Lunch:[], Dinner:[], Snacks:[] };
const MEAL_ICONS  = { Breakfast:'☀', Lunch:'⛅', Dinner:'◑', Snacks:'◇' };

let _logId = 100;
const newId = () => `l${++_logId}`;

const macrosFromItem = (item) => ({
  cal:     Math.round(item.cal     * item.qty),
  protein: Math.round(item.protein * item.qty),
  carbs:   Math.round(item.carbs   * item.qty),
  fat:     Math.round(item.fat     * item.qty),
});

const sumMeals = (meals) => {
  let cal=0, protein=0, carbs=0, fat=0;
  Object.values(meals).flat().forEach(item => {
    const m = macrosFromItem(item);
    cal+=m.cal; protein+=m.protein; carbs+=m.carbs; fat+=m.fat;
  });
  return { cal, protein, carbs, fat };
};

const useDebounce = (val, ms) => {
  const [d, setD] = useState(val);
  useEffect(() => { const t = setTimeout(()=>setD(val),ms); return ()=>clearTimeout(t); }, [val, ms]);
  return d;
};

// ─── Micro atoms ─────────────────────────────────────────────────────────────
function SectionHead({ children }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.28)',
      letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, c, subColor }) {
  return (
    <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16,
      padding: '14px 10px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <Icon style={{ width: 17, height: 17, color: c.color, margin: '0 auto 7px',
        filter: `drop-shadow(0 0 5px ${c.color}55)`, display:'block' }} />
      <div style={{ fontSize: 13, fontWeight: 900, color: subColor || '#fff',
        letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', fontWeight: 700,
        marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

function AddButton({ section, onClick }) {
  return (
    <button onClick={() => onClick(section)}
      style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:800,
        color: C.blue.color, background: C.blue.bg, border:`1px solid ${C.blue.border}`,
        borderRadius:10, padding:'6px 11px', cursor:'pointer', letterSpacing:'0.02em',
        boxShadow:`0 0 14px rgba(56,189,248,0.12)`, transition:'all 0.15s' }}>
      <Plus style={{ width:11, height:11 }} />Add
    </button>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
function CalorieRing({ consumed, target }) {
  const pct  = Math.min(consumed / target, 1);
  const over = consumed > target;
  const r = 42, circ = 2 * Math.PI * r, arc = circ * 0.78;
  const fill = arc * pct;
  const col = over ? C.red.color : C.blue.color;
  return (
    <div style={{ position:'relative', width:104, height:104, flexShrink:0 }}>
      <svg width={104} height={104}>
        <circle cx={52} cy={52} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth={7.5}
          strokeDasharray={`${arc} ${circ-arc}`} strokeLinecap="round"
          transform="rotate(141 52 52)" />
        <circle cx={52} cy={52} r={r} fill="none"
          stroke={col} strokeWidth={7.5}
          strokeDasharray={`${fill} ${circ-fill}`} strokeLinecap="round"
          transform="rotate(141 52 52)"
          style={{ filter:`drop-shadow(0 0 8px ${col}88)`, transition:'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.03em' }}>
          {Math.round(pct*100)}%
        </span>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>of goal</span>
      </div>
    </div>
  );
}

// ─── Macro progress bar ───────────────────────────────────────────────────────
function MacroBar({ label, current, target, c }) {
  const pct  = Math.min((current/target)*100, 100);
  const over = current > target;
  const col  = over ? C.red.color : c.color;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.45)' }}>{label}</span>
        <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
          <span style={{ fontSize:13, fontWeight:800, color: over ? C.red.color : '#fff' }}>{current}g</span>
          <span style={{ fontSize:10.5, color:'rgba(255,255,255,0.25)' }}>/ {target}g</span>
        </div>
      </div>
      <div style={{ height:5, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden', position:'relative' }}>
        <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:col,
          animation:'nt-bar 1.1s cubic-bezier(0.16,1,0.3,1) both',
          boxShadow:`0 0 8px ${col}66` }} />
        <div style={{ position:'absolute', inset:0, overflow:'hidden', borderRadius:99, pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:0, bottom:0, width:'50%',
            background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)',
            animation:'nt-shimmer 3.6s cubic-bezier(0.4,0,0.6,1) infinite' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Macro chip row ───────────────────────────────────────────────────────────
function MacroChips({ protein, carbs, fat, small }) {
  const items = [
    { l:'P', v:protein, c:C.blue   },
    { l:'C', v:carbs,   c:C.green  },
    { l:'F', v:fat,     c:C.amber  },
  ];
  return (
    <div style={{ display:'flex', gap:small?4:6, flexWrap:'wrap' }}>
      {items.map(({ l, v, c }) => (
        <div key={l} style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:6,
          padding: small ? '2px 7px' : '3px 9px',
          display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:small?9.5:10.5, fontWeight:900, color:c.color, letterSpacing:'0.04em' }}>{l}</span>
          <span style={{ fontSize:small?10:11, color:'#fff', fontWeight:700 }}>{v}g</span>
        </div>
      ))}
    </div>
  );
}

// ─── Water tracker ────────────────────────────────────────────────────────────
function WaterTracker({ glasses, target, onAdd }) {
  return (
    <div>
      <SectionHead>Hydration</SectionHead>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
        {Array.from({ length: target }).map((_, i) => (
          <div key={i} onClick={i===glasses ? onAdd : undefined}
            style={{ width:18, height:23, borderRadius:5,
              background: i<glasses ? C.blue.color : 'rgba(255,255,255,0.05)',
              border: i<glasses ? 'none' : '1px solid rgba(255,255,255,0.09)',
              cursor: i===glasses ? 'pointer' : 'default',
              transition:'all 0.25s',
              boxShadow: i<glasses ? `0 0 8px ${C.blue.color}66` : 'none' }} />
        ))}
      </div>
      <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', margin:0 }}>
        <span style={{ fontWeight:800, color:'#fff' }}>{glasses}</span>
        <span style={{ color:'rgba(255,255,255,0.25)' }}> / {target} glasses</span>
      </p>
    </div>
  );
}

// ─── Week dots ────────────────────────────────────────────────────────────────
function WeekDots({ days }) {
  const labels  = ['M','T','W','T','F','S','S'];
  const onTrack = days.filter(Boolean).length;
  return (
    <>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        {days.map((on, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, flex:1 }}>
            <div style={{ width:30, height:30, borderRadius:'50%',
              background: on ? C.blue.bg : 'rgba(255,255,255,0.04)',
              border: on ? `1px solid ${C.blue.border}` : '1px solid rgba(255,255,255,0.08)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: on ? `0 0 12px rgba(56,189,248,0.28)` : 'none',
              transition:'all 0.3s' }}>
              {on && <Check style={{ width:11, height:11, color:C.blue.color }} strokeWidth={3} />}
            </div>
            <span style={{ fontSize:10, color: on ? C.blue.color : 'rgba(255,255,255,0.25)',
              fontWeight: on ? 800 : 500 }}>{labels[i]}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.4)', margin:0 }}>
        <span style={{ fontWeight:800, color:'#fff' }}>{onTrack}/7 days</span> on track this week
      </p>
    </>
  );
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
function BottomSheet({ onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex',
      flexDirection:'column', justifyContent:'flex-end' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(2,4,10,0.87)',
        backdropFilter:'blur(10px)' }} onClick={onClose} />
      <div style={{ position:'relative', background:SHEET_BG,
        border:'1px solid rgba(255,255,255,0.09)', borderBottom:'none',
        borderRadius:'26px 26px 0 0', padding:'10px 18px 42px',
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 -16px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', justifyContent:'center', paddingBottom:16 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:'rgba(255,255,255,0.14)' }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, loading }) {
  return (
    <div style={{ position:'relative' }}>
      <Search style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
        pointerEvents:'none', width:15, height:15, color:'rgba(255,255,255,0.3)' }} />
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder="Search foods…" autoFocus
        style={{ width:'100%', height:44, borderRadius:14,
          background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
          color:'#fff', fontSize:14, fontFamily:'inherit',
          paddingLeft:38, paddingRight: value ? 36 : 14,
          outline:'none', boxSizing:'border-box', caretColor:C.blue.color }} />
      {value && !loading && (
        <button onClick={()=>onChange('')} style={{ position:'absolute', right:10, top:'50%',
          transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer',
          padding:2, color:'rgba(255,255,255,0.3)', display:'flex' }}>
          <X style={{ width:14, height:14 }} />
        </button>
      )}
      {loading && (
        <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
          animation:'nt-spin 0.8s linear infinite', display:'flex' }}>
          <Loader2 style={{ width:14, height:14, color:C.blue.color }} />
        </div>
      )}
    </div>
  );
}

// ─── Food list item ───────────────────────────────────────────────────────────
function FoodListItem({ food, onSelect }) {
  return (
    <button onClick={()=>onSelect(food)}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:12,
        padding:'11px 0', background:'none', border:'none',
        borderTop:'1px solid rgba(255,255,255,0.05)',
        cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13.5, fontWeight:700, color:'#fff', margin:'0 0 2px',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{food.name}</p>
        <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.3)', margin:0 }}>
          {food.brand} · {food.serving}
        </p>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <p style={{ fontSize:14, fontWeight:900, color:'#fff', margin:'0 0 2px',
          letterSpacing:'-0.02em' }}>{food.cal}</p>
        <p style={{ fontSize:10.5, color:'rgba(255,255,255,0.25)', margin:0 }}>kcal</p>
      </div>
      <ChevronRight style={{ width:14, height:14, color:'rgba(255,255,255,0.2)', flexShrink:0 }} />
    </button>
  );
}

// ─── Food detail sheet ────────────────────────────────────────────────────────
function FoodDetailSheet({ food, section, onConfirm, onClose }) {
  const [qty, setQty] = useState(1);
  const cal     = Math.round(food.cal     * qty);
  const protein = Math.round(food.protein * qty);
  const carbs   = Math.round(food.carbs   * qty);
  const fat     = Math.round(food.fat     * qty);

  const qtyBtn = {
    width:38, height:38, borderRadius:12, background:'rgba(255,255,255,0.06)',
    border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
  };

  return (
    <BottomSheet onClose={onClose}>
      <p style={{ fontSize:10, color:'rgba(255,255,255,0.25)', margin:'0 0 4px',
        textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:800 }}>{food.brand}</p>
      <h3 style={{ fontSize:20, fontWeight:900, color:'#fff', margin:'0 0 20px',
        lineHeight:1.2, letterSpacing:'-0.02em' }}>{food.name}</h3>

      <div style={{ textAlign:'center', background:'rgba(255,255,255,0.03)',
        border:CARD_BORDER, borderRadius:18, padding:'22px 16px', marginBottom:18 }}>
        <p style={{ fontSize:48, fontWeight:900, color:'#fff', letterSpacing:'-0.04em',
          lineHeight:1, margin:'0 0 4px' }}>{cal}</p>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.3)', margin:'0 0 16px' }}>kcal</p>
        <MacroChips protein={protein} carbs={carbs} fat={fat} />
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:16, padding:'0 2px' }}>
        <div>
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.25)', margin:'0 0 2px',
            textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:800 }}>Serving</p>
          <p style={{ fontSize:14, color:'#fff', fontWeight:700, margin:0 }}>{food.serving}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:0 }}>
          <button onClick={()=>setQty(q=>Math.max(0.5,+(q-0.5).toFixed(1)))} style={qtyBtn}>
            <Minus style={{ width:14, height:14, color:'#fff' }} />
          </button>
          <div style={{ width:52, textAlign:'center', fontSize:20, fontWeight:900, color:'#fff' }}>{qty}</div>
          <button onClick={()=>setQty(q=>+(q+0.5).toFixed(1))} style={qtyBtn}>
            <Plus style={{ width:14, height:14, color:'#fff' }} />
          </button>
        </div>
      </div>

      <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:14,
        border:CARD_BORDER, marginBottom:22, overflow:'hidden' }}>
        {[
          { label:'Protein',       value:protein, c:C.blue  },
          { label:'Carbohydrates', value:carbs,   c:C.green },
          { label:'Fat',           value:fat,     c:C.amber },
        ].map(({ label, value, c }, i, arr) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', padding:'12px 15px',
            borderBottom: i<arr.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:c.color,
                boxShadow:`0 0 7px ${c.color}` }} />
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>{label}</span>
            </div>
            <span style={{ fontSize:14, fontWeight:800, color:'#fff' }}>{value}g</span>
          </div>
        ))}
      </div>

      <BigCTA label={`Add to ${section}`} onClick={()=>onConfirm({ section, food, qty })} />
    </BottomSheet>
  );
}

// ─── Big CTA button (matching ClassDetailModal) ───────────────────────────────
function BigCTA({ label, onClick, disabled, variant = 'primary' }) {
  const isBooked = variant === 'booked';
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width:'100%', padding:'16px', borderRadius:18,
        fontSize:15, fontWeight:900, cursor: disabled ? 'default' : 'pointer',
        border:'none', letterSpacing:'-0.01em',
        position:'relative', overflow:'hidden',
        background: disabled
          ? 'rgba(255,255,255,0.05)'
          : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        color: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
        boxShadow: disabled ? 'none'
          : '0 6px 28px rgba(37,99,235,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
        transition:'all 0.2s cubic-bezier(0.34,1.5,0.64,1)' }}>
      {!disabled && (
        <div style={{ position:'absolute', inset:0, overflow:'hidden',
          borderRadius:'inherit', pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:0, bottom:0, width:'40%',
            background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)',
            animation:'nt-shimmer 4s cubic-bezier(0.4,0,0.6,1) infinite 1.5s' }} />
        </div>
      )}
      <span style={{ position:'relative', zIndex:1 }}>{label}</span>
    </button>
  );
}

// ─── Add food sheet ───────────────────────────────────────────────────────────
function AddFoodSheet({ section, onAdd, onClose }) {
  const [query, setQuery]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [tab, setTab]           = useState('search');
  const [quickCal, setQuickCal] = useState('');
  const [quickMode, setQuickMode] = useState(false);

  const dq = useDebounce(query, 240);
  useEffect(() => {
    if (!dq) { setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(()=>setLoading(false), 380);
    return ()=>clearTimeout(t);
  }, [dq]);

  const results = useMemo(() => {
    if (!dq) return [];
    const q = dq.toLowerCase();
    return FOOD_DB.filter(f=>f.name.toLowerCase().includes(q)||f.brand.toLowerCase().includes(q)).slice(0,10);
  }, [dq]);

  const recentFoods   = RECENT_IDS.map(id=>FOOD_DB.find(f=>f.id===id)).filter(Boolean);
  const frequentFoods = FREQUENT_IDS.map(id=>FOOD_DB.find(f=>f.id===id)).filter(Boolean);

  const handleConfirm = ({ section:sec, food, qty }) => { onAdd(sec, food, qty); onClose(); };

  const handleQuick = () => {
    const cal = parseInt(quickCal,10);
    if (!cal||cal<1) return;
    onAdd(section, { id:`q${Date.now()}`, name:`Quick add · ${cal} kcal`, brand:'Manual',
      cal, protein:0, carbs:0, fat:0, serving:'1 entry', servingG:1 }, 1);
    onClose();
  };

  if (selected) return <FoodDetailSheet food={selected} section={section} onConfirm={handleConfirm} onClose={()=>setSelected(null)} />;

  const TABS = [
    { key:'search', label:'Search' },
    { key:'saved',  label:'Saved Meals' },
  ];

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>{MEAL_ICONS[section]}</span>
          <span style={{ fontSize:18, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>
            Add to {section}
          </span>
        </div>
        <button onClick={()=>setQuickMode(m=>!m)} style={{
          background: quickMode ? C.blue.bg : 'rgba(255,255,255,0.05)',
          border: quickMode ? `1px solid ${C.blue.border}` : '1px solid rgba(255,255,255,0.1)',
          borderRadius:10, padding:'6px 11px', cursor:'pointer', fontFamily:'inherit',
          fontSize:11, fontWeight:800, color: quickMode ? C.blue.color : 'rgba(255,255,255,0.4)',
          display:'flex', alignItems:'center', gap:5, letterSpacing:'0.02em' }}>
          <Zap style={{ width:11, height:11 }} />Quick add
        </button>
      </div>

      {quickMode && (
        <div style={{ background:C.blue.bg, border:`1px solid ${C.blue.border}`,
          borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
          <p style={{ fontSize:12, color:C.blue.color, margin:'0 0 10px', fontWeight:700 }}>
            Enter calories directly
          </p>
          <div style={{ display:'flex', gap:8 }}>
            <input type="number" placeholder="e.g. 350" value={quickCal}
              onChange={e=>setQuickCal(e.target.value)}
              style={{ flex:1, height:44, borderRadius:12, background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontSize:15,
                fontFamily:'inherit', paddingLeft:14, outline:'none',
                caretColor:C.blue.color }} />
            <button onClick={handleQuick}
              style={{ width:52, height:44, borderRadius:12, background:C.blue.color,
                border:'none', cursor:'pointer', display:'flex', alignItems:'center',
                justifyContent:'center' }}>
              <Check style={{ width:18, height:18, color:'#000' }} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ padding:'10px 16px', fontSize:12, fontWeight:800,
              textTransform:'capitalize', letterSpacing:'0.02em', cursor:'pointer',
              background:'none', border:'none',
              borderBottom:`2px solid ${tab===t.key ? C.blue.color : 'transparent'}`,
              color: tab===t.key ? C.blue.color : 'rgba(255,255,255,0.32)',
              transition:'all 0.2s', marginBottom:-1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <>
          <div style={{ marginBottom:16 }}>
            <SearchBar value={query} onChange={setQuery} loading={loading} />
          </div>
          {dq && !loading && results.length===0 && (
            <div style={{ textAlign:'center', padding:'28px 16px' }}>
              <AlertCircle style={{ width:22, height:22, color:'rgba(255,255,255,0.2)', margin:'0 auto 8px', display:'block' }} />
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.3)', margin:0 }}>No results found</p>
            </div>
          )}
          {results.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <SectionHead>{results.length} result{results.length!==1?'s':''}</SectionHead>
              {results.map(f=><FoodListItem key={f.id} food={f} onSelect={setSelected} />)}
            </div>
          )}
          {!dq && (
            <>
              <FoodGroup label="Recent"   icon={<Clock style={{width:12,height:12,color:'rgba(255,255,255,0.25)'}} />} foods={recentFoods}   onSelect={setSelected} />
              <FoodGroup label="Frequent" icon={<Star style={{width:12,height:12,color:'rgba(255,255,255,0.25)'}} />} foods={frequentFoods} onSelect={setSelected} />
            </>
          )}
        </>
      )}

      {tab === 'saved' && (
        <div>
          {SAVED_MEALS.map(meal => (
            <SavedMealRow key={meal.id} meal={meal} section={section}
              onAdd={onAdd} onClose={onClose} />
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

function FoodGroup({ label, icon, foods, onSelect }) {
  if (!foods.length) return null;
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
        {icon}
        <p style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontWeight:800,
          letterSpacing:'0.1em', textTransform:'uppercase', margin:0 }}>{label}</p>
      </div>
      {foods.map(f=><FoodListItem key={f.id} food={f} onSelect={onSelect} />)}
    </div>
  );
}

function SavedMealRow({ meal, section, onAdd, onClose }) {
  const totalCal = meal.items.reduce((s,i)=>s+Math.round(i.cal*i.qty),0);
  const totalP   = meal.items.reduce((s,i)=>s+Math.round(i.protein*i.qty),0);
  return (
    <button onClick={()=>{ meal.items.forEach(i=>onAdd(section,i,i.qty)); onClose(); }}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:12,
        padding:'13px 14px', borderRadius:14, marginBottom:8,
        background:'rgba(255,255,255,0.04)', border:CARD_BORDER,
        cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
      <div style={{ width:36, height:36, borderRadius:11, background:C.purple.bg,
        border:`1px solid ${C.purple.border}`, display:'flex', alignItems:'center',
        justifyContent:'center', flexShrink:0 }}>
        <BookMarked style={{ width:15, height:15, color:C.purple.color }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13.5, fontWeight:700, color:'#fff', margin:'0 0 3px' }}>{meal.name}</p>
        <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.3)', margin:0 }}>
          {meal.items.length} foods · {totalP}g protein
        </p>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <p style={{ fontSize:15, fontWeight:900, color:'#fff', margin:'0 0 1px',
          letterSpacing:'-0.02em' }}>{totalCal}</p>
        <p style={{ fontSize:10.5, color:'rgba(255,255,255,0.25)', margin:0 }}>kcal</p>
      </div>
    </button>
  );
}

// ─── Barcode scanner (real camera + Open Food Facts API) ─────────────────────
function BarcodeModal({ onAdd, onClose }) {
  const [phase, setPhase]   = useState('scanner'); // scanner | loading | found | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [sec, setSec]  = useState('Snacks');
  const [qty, setQty]  = useState(1);
  const scannerRef     = useRef(null);
  const activeRef      = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode('nt-qr-scanner');
        scannerRef.current = scanner;
        activeRef.current  = true;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 140 } },
          (barcode) => {
            if (!activeRef.current || cancelled) return;
            activeRef.current = false;
            scanner.stop();
            fetchFood(barcode);
          },
          () => {}
        );
      } catch {
        if (!cancelled) { setPhase('error'); setErrorMsg('Camera not available. Check permissions.'); }
      }
    };
    init();
    return () => {
      cancelled = true;
      if (scannerRef.current && activeRef.current) {
        scannerRef.current.stop().catch(()=>{});
        activeRef.current = false;
      }
    };
  }, []);

  const fetchFood = async (barcode) => {
    setPhase('loading');
    try {
      const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
        headers: { 'User-Agent': 'CoStrideApp - Web - Version 1.0' },
      });
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const n = data.product.nutriments || {};
        setResult({
          id:       `bc-${barcode}`,
          name:     data.product.product_name || 'Unknown Product',
          brand:    data.product.brands || '',
          cal:      Math.round(n['energy-kcal_100g'] || 0),
          protein:  parseFloat((n.proteins_100g    || 0).toFixed(1)),
          carbs:    parseFloat((n.carbohydrates_100g || 0).toFixed(1)),
          fat:      parseFloat((n.fat_100g          || 0).toFixed(1)),
          serving:  '100g',
          servingG: 100,
        });
        setPhase('found');
      } else {
        setPhase('error'); setErrorMsg('Food not found in database.');
      }
    } catch {
      setPhase('error'); setErrorMsg('Failed to fetch food data. Try again.');
    }
  };

  const retry = async () => {
    setPhase('scanner'); setResult(null); setErrorMsg('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('nt-qr-scanner');
      scannerRef.current = scanner; activeRef.current = true;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 140 } },
        (barcode) => { if (!activeRef.current) return; activeRef.current=false; scanner.stop(); fetchFood(barcode); },
        ()=>{}
      );
    } catch { setPhase('error'); setErrorMsg('Camera not available.'); }
  };

  const cal = result ? Math.round(result.cal * qty) : 0;
  const qtyBtn = {
    width:38, height:38, borderRadius:12, background:'rgba(255,255,255,0.06)',
    border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
  };

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <ScanBarcode style={{ width:18, height:18, color:C.blue.color }} />
        <p style={{ fontSize:17, fontWeight:900, color:'#fff', margin:0, letterSpacing:'-0.02em' }}>
          Barcode Scanner
        </p>
      </div>

      {/* Camera viewport */}
      <div style={{ borderRadius:18, overflow:'hidden', position:'relative',
        marginBottom:20, height:200, background:'rgba(0,0,0,0.7)',
        border:`1px solid ${C.blue.border}` }}>

        {/* html5-qrcode mounts here — always rendered so scanner can attach */}
        <div id="nt-qr-scanner" style={{ width:'100%', height:'100%',
          display: phase==='scanner' ? 'block' : 'none' }} />

        {/* Corner markers overlay */}
        {[0,1,2,3].map(i => {
          const t=i<2, l=i%2===0;
          return <div key={i} style={{ position:'absolute', pointerEvents:'none',
            top:t?14:undefined, bottom:!t?14:undefined,
            left:l?14:undefined, right:!l?14:undefined,
            width:24, height:24,
            borderTop:    t  ? `2.5px solid ${C.blue.color}` : 'none',
            borderBottom: !t ? `2.5px solid ${C.blue.color}` : 'none',
            borderLeft:   l  ? `2.5px solid ${C.blue.color}` : 'none',
            borderRight:  !l ? `2.5px solid ${C.blue.color}` : 'none',
          }} />;
        })}

        {phase === 'scanner' && (
          <p style={{ position:'absolute', bottom:12, left:0, right:0, textAlign:'center',
            fontSize:12, color:'rgba(255,255,255,0.5)', margin:0, fontWeight:600,
            pointerEvents:'none' }}>
            Point camera at barcode
          </p>
        )}

        {phase === 'loading' && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:12 }}>
            <div style={{ animation:'nt-spin 1s linear infinite', display:'inline-block' }}>
              <Loader2 style={{ width:28, height:28, color:C.blue.color }} />
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>Looking up food data…</p>
          </div>
        )}

        {phase === 'found' && result && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:8 }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:C.green.bg,
              border:`1px solid ${C.green.border}`, display:'flex', alignItems:'center',
              justifyContent:'center' }}>
              <Check style={{ width:20, height:20, color:C.green.color }} strokeWidth={3} />
            </div>
            <p style={{ fontSize:13, fontWeight:800, color:'#fff', margin:0 }}>{result.name}</p>
            {result.brand && <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.35)', margin:0 }}>{result.brand}</p>}
          </div>
        )}

        {phase === 'error' && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:C.red.bg,
              border:`1px solid ${C.red.border}`, display:'flex', alignItems:'center',
              justifyContent:'center' }}>
              <AlertCircle style={{ width:20, height:20, color:C.red.color }} />
            </div>
            <p style={{ fontSize:12, color:C.red.color, margin:0, textAlign:'center',
              padding:'0 16px' }}>{errorMsg}</p>
            <button onClick={retry}
              style={{ fontSize:12, fontWeight:800, color:C.blue.color, background:C.blue.bg,
                border:`1px solid ${C.blue.border}`, borderRadius:10, padding:'7px 16px',
                cursor:'pointer', letterSpacing:'0.02em' }}>
              Try Again
            </button>
          </div>
        )}
      </div>

      {phase === 'found' && result && (
        <>
          <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:14,
            border:CARD_BORDER, padding:'13px 15px', marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:10 }}>
              <div>
                <p style={{ fontSize:14, fontWeight:800, color:'#fff', margin:'0 0 2px' }}>{result.name}</p>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', margin:0 }}>per 100g · ×{qty}</p>
              </div>
              <p style={{ fontSize:24, fontWeight:900, color:'#fff', margin:0, letterSpacing:'-0.03em' }}>
                {cal} <span style={{ fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.3)' }}>kcal</span>
              </p>
            </div>
            <MacroChips protein={Math.round(result.protein*qty)}
              carbs={Math.round(result.carbs*qty)} fat={Math.round(result.fat*qty)} small />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
            <div>
              <SectionHead>Servings</SectionHead>
              <div style={{ display:'flex', alignItems:'center' }}>
                <button onClick={()=>setQty(q=>Math.max(0.5,+(q-0.5).toFixed(1)))} style={qtyBtn}>
                  <Minus style={{width:13,height:13,color:'#fff'}} />
                </button>
                <div style={{flex:1,textAlign:'center',fontSize:18,fontWeight:900,color:'#fff'}}>{qty}</div>
                <button onClick={()=>setQty(q=>+(q+0.5).toFixed(1))} style={qtyBtn}>
                  <Plus style={{width:13,height:13,color:'#fff'}} />
                </button>
              </div>
            </div>
            <div>
              <SectionHead>Meal</SectionHead>
              <select value={sec} onChange={e=>setSec(e.target.value)}
                style={{ width:'100%', height:38, borderRadius:12,
                  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                  color:'#fff', fontSize:13, fontFamily:'inherit', paddingLeft:10, outline:'none' }}>
                {['Breakfast','Lunch','Dinner','Snacks'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <BigCTA label={`Add to ${sec}`} onClick={()=>{ onAdd(sec, result, qty); onClose(); }} />
        </>
      )}
    </BottomSheet>
  );
}

// ─── Meal section ─────────────────────────────────────────────────────────────
function MealSection({ section, items, onAdd, onDelete, divider }) {
  const [collapsed, setCollapsed] = useState(false);
  const sectionCal = items.reduce((s,m)=>s+macrosFromItem(m).cal,0);

  return (
    <>
      {divider && <div style={{height:1,background:'rgba(255,255,255,0.05)',margin:'4px 0'}} />}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'13px 0 0' }}>
          <button onClick={()=>setCollapsed(c=>!c)}
            style={{ display:'flex', alignItems:'center', gap:8, background:'none',
              border:'none', cursor:'pointer', padding:0 }}>
            <span style={{ fontSize:15 }}>{MEAL_ICONS[section]}</span>
            <span style={{ fontSize:14, fontWeight:800, color:'#fff' }}>{section}</span>
            {sectionCal > 0 && (
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontWeight:600 }}>
                {sectionCal} kcal
              </span>
            )}
            {collapsed
              ? <ChevronDown style={{width:13,height:13,color:'rgba(255,255,255,0.25)'}} />
              : <ChevronUp   style={{width:13,height:13,color:'rgba(255,255,255,0.25)'}} />}
          </button>
          <AddButton section={section} onClick={onAdd} />
        </div>

        {!collapsed && (
          <div style={{ paddingBottom:10, paddingTop:4 }}>
            {items.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 0' }}>
                <div style={{flex:1,height:1,background:'rgba(255,255,255,0.04)'}} />
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.2)', margin:0, flexShrink:0 }}>
                  Nothing logged yet
                </p>
                <div style={{flex:1,height:1,background:'rgba(255,255,255,0.04)'}} />
              </div>
            ) : items.map((m,i) => {
              const mc = macrosFromItem(m);
              return (
                <div key={m.logId} style={{ display:'flex', alignItems:'center', gap:10,
                  padding:'10px 0', borderTop:'1px solid rgba(255,255,255,0.05)',
                  animation:'nt-fade-up 0.22s ease both' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13.5, color:'#fff', margin:'0 0 4px', fontWeight:700,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.3)' }}>
                        {m.qty>1?`${m.qty}× `:''}{m.serving}
                      </span>
                      <MacroChips protein={mc.protein} carbs={mc.carbs} fat={mc.fat} small />
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontSize:14, fontWeight:900, color:'#fff', margin:'0 0 1px',
                      letterSpacing:'-0.02em' }}>{mc.cal}</p>
                    <p style={{ fontSize:10, color:'rgba(255,255,255,0.25)', margin:0 }}>kcal</p>
                  </div>
                  <button onClick={()=>onDelete(section,i)}
                    style={{ width:28, height:28, borderRadius:10,
                      background:C.red.bg, border:`1px solid ${C.red.border}`,
                      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                      flexShrink:0 }}>
                    <X style={{ width:12, height:12, color:C.red.color }} />
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

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, visible }) {
  return (
    <div style={{ position:'fixed', bottom:32, left:'50%',
      transform:`translateX(-50%) translateY(${visible?0:10}px)`,
      opacity: visible ? 1 : 0,
      transition:'opacity 0.22s ease, transform 0.22s ease',
      background:'linear-gradient(135deg, rgba(30,35,60,0.98) 0%, rgba(8,10,20,0.99) 100%)',
      border:'1px solid rgba(255,255,255,0.12)',
      borderRadius:14, padding:'11px 20px', fontSize:13, fontWeight:700,
      color:'#fff', boxShadow:'0 6px 28px rgba(0,0,0,0.55)',
      whiteSpace:'nowrap', zIndex:500, pointerEvents:'none' }}>
      {msg}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NutritionTab() {
  const [meals, setMeals]           = useState(EMPTY_MEALS);
  const [water, setWater]           = useState(3);
  const [addingTo, setAddingTo]     = useState(null);
  const [showScanner, setScanner]   = useState(false);
  const [insight, setInsight]       = useState(true);
  const [toast, setToast]           = useState({ msg:'', visible:false });
  const toastTimer                  = useRef(null);

  // Demo week dots: Mon-Thu logged, Fri=today=partial, Sat-Sun=false
  const weekDays = [true, true, true, true, false, false, false];
  const streak   = 4;

  useEffect(() => { injectCSS(); }, []);

  const consumed = useMemo(() => sumMeals(meals), [meals]);

  const showToast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, visible:true });
    toastTimer.current = setTimeout(()=>setToast(t=>({...t,visible:false})), 2200);
  }, []);

  const handleAddFood = useCallback((section, food, qty) => {
    setMeals(m => ({ ...m, [section]: [...(m[section]||[]), { ...food, qty, logId:newId() }] }));
    showToast(`✓ ${food.name} added to ${section}`);
  }, [showToast]);

  const handleDelete = useCallback((section, idx) => {
    const name = meals[section][idx]?.name ?? 'Item';
    setMeals(m => ({ ...m, [section]: m[section].filter((_,i)=>i!==idx) }));
    showToast(`Removed ${name}`);
  }, [meals, showToast]);

  const proteinGap  = TARGETS.protein  - consumed.protein;
  const calorieLeft = TARGETS.calories - consumed.cal;
  const insightText = consumed.cal >= TARGETS.calories
    ? '🎯 You\'ve hit your calorie goal for today — great work!'
    : proteinGap > 0
      ? `💪 You need ${proteinGap}g more protein to hit your daily target.`
      : `${calorieLeft} kcal remaining — keep it up!`;

  const pct = Math.round((consumed.cal / TARGETS.calories) * 100);

  return (
    <div style={{ display:'flex', flexDirection:'column', paddingBottom:100,
      background:'#060810', minHeight:'100vh', color:'#fff',
      fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

      {/* ── DAILY OVERVIEW CARD ── */}
      <div style={{ background:CARD_BG, border:CARD_BORDER, borderRadius:20,
        padding:'18px 18px', margin:'0 0 12px',
        boxShadow:'0 4px 32px rgba(0,0,0,0.4)' }}>
        <SectionHead>Daily Overview</SectionHead>

        <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:20 }}>
          <CalorieRing consumed={consumed.cal} target={TARGETS.calories} />
          <div style={{ flex:1 }}>
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.28)', margin:'0 0 2px',
              textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:800 }}>Consumed today</p>
            <p style={{ fontSize:38, fontWeight:900, color:'#fff', lineHeight:1,
              margin:'0 0 2px', letterSpacing:'-0.04em' }}>
              {consumed.cal.toLocaleString()}
              <span style={{ fontSize:15, fontWeight:500, color:'rgba(255,255,255,0.3)',
                letterSpacing:0 }}> kcal</span>
            </p>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>
              of {TARGETS.calories.toLocaleString()} kcal goal
            </p>
          </div>
        </div>

        {/* Insight banner */}
        {insight && (
          <div style={{ background:C.blue.bg, border:`1px solid ${C.blue.border}`,
            borderRadius:12, padding:'11px 14px',
            display:'flex', alignItems:'flex-start', gap:10, marginBottom:18 }}>
            <TrendingUp style={{ width:14, height:14, color:C.blue.color, flexShrink:0, marginTop:2 }} />
            <p style={{ flex:1, fontSize:12.5, color:'#7dd3fc', lineHeight:1.55, margin:0,
              fontWeight:600 }}>{insightText}</p>
            <button onClick={()=>setInsight(false)}
              style={{ background:'none', border:'none', cursor:'pointer',
                padding:0, color:C.blue.color, fontSize:18, lineHeight:1,
                opacity:0.5, flexShrink:0 }}>×</button>
          </div>
        )}

        {/* Stat grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18 }}>
          <StatCard icon={Target}   label="Goal"      value={`${TARGETS.calories.toLocaleString()}`} c={C.blue}  />
          <StatCard icon={BarChart2} label="Consumed" value={consumed.cal.toLocaleString()}          c={C.green} />
          <StatCard icon={Zap}       label="Remaining" value={Math.max(0,TARGETS.calories-consumed.cal).toLocaleString()} c={C.amber} />
        </div>

        <MacroBar label="Protein"       current={consumed.protein} target={TARGETS.protein} c={C.blue}  />
        <MacroBar label="Carbohydrates" current={consumed.carbs}   target={TARGETS.carbs}   c={C.green} />
        <MacroBar label="Fat"           current={consumed.fat}     target={TARGETS.fats}    c={C.amber} />
      </div>

      {/* ── QUICK ADD CARD ── */}
      <div style={{ background:CARD_BG, border:CARD_BORDER, borderRadius:20,
        padding:'18px 18px', marginBottom:12 }}>
        <SectionHead>Quick Add</SectionHead>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          {[
            { key:'shake',  label:'Protein Shake', sub:'30g protein · 180 kcal',
              icon:<Droplets style={{width:15,height:15,color:C.blue.color}} />, c:C.blue,
              food:{ id:'qs', name:'Protein Shake', brand:'Manual', cal:180, protein:30, carbs:6, fat:3, serving:'1 shake', servingG:1 } },
            { key:'energy', label:'500 kcal Boost', sub:'Quick energy entry',
              icon:<Zap style={{width:15,height:15,color:C.amber.color}} />, c:C.amber,
              food:{ id:'qe', name:'500 kcal boost', brand:'Manual', cal:500, protein:20, carbs:60, fat:18, serving:'1 entry', servingG:1 } },
          ].map(opt => (
            <button key={opt.key} onClick={()=>handleAddFood('Snacks',opt.food,1)}
              style={{ background:'rgba(255,255,255,0.03)', border:CARD_BORDER,
                borderRadius:14, padding:'14px 13px', cursor:'pointer',
                textAlign:'left', fontFamily:'inherit', transition:'all 0.15s' }}>
              <div style={{ width:34, height:34, borderRadius:11, background:opt.c.bg,
                border:`1px solid ${opt.c.border}`, display:'flex', alignItems:'center',
                justifyContent:'center', marginBottom:10,
                boxShadow:`0 0 12px ${opt.c.glow}` }}>
                {opt.icon}
              </div>
              <p style={{ fontSize:13.5, fontWeight:800, color:'#fff', margin:'0 0 3px',
                letterSpacing:'-0.01em' }}>{opt.label}</p>
              <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.3)', margin:0 }}>{opt.sub}</p>
            </button>
          ))}
        </div>
        <button onClick={()=>setScanner(true)}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:13,
            background:'rgba(255,255,255,0.03)', border:CARD_BORDER,
            borderRadius:14, padding:'13px 14px', cursor:'pointer', fontFamily:'inherit' }}>
          <div style={{ width:36, height:36, borderRadius:11,
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <ScanBarcode style={{ width:15, height:15, color:'rgba(255,255,255,0.4)' }} />
          </div>
          <div style={{ textAlign:'left', flex:1 }}>
            <p style={{ fontSize:13.5, fontWeight:800, color:'#fff', margin:'0 0 2px',
              letterSpacing:'-0.01em' }}>Scan Barcode</p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', margin:0 }}>
              Identify packaged food instantly
            </p>
          </div>
          <ChevronRight style={{ width:14, height:14, color:'rgba(255,255,255,0.2)' }} />
        </button>
      </div>

      {/* ── MEAL LOG CARD ── */}
      <div style={{ background:CARD_BG, border:CARD_BORDER, borderRadius:20,
        padding:'18px 18px', marginBottom:12 }}>
        <SectionHead>Meal Log</SectionHead>
        {['Breakfast','Lunch','Dinner','Snacks'].map((section,i) => (
          <MealSection key={section} section={section}
            items={meals[section]||[]}
            onAdd={setAddingTo}
            onDelete={handleDelete}
            divider={i>0} />
        ))}
      </div>

      {/* ── WEEKLY CONSISTENCY ── */}
      <div style={{ background:CARD_BG, border:CARD_BORDER, borderRadius:20,
        padding:'18px 18px', marginBottom:12 }}>
        <SectionHead>Weekly Consistency</SectionHead>
        <WeekDots days={weekDays} />
      </div>

      {/* ── WATER + STREAK GRID ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <div style={{ background:CARD_BG, border:CARD_BORDER, borderRadius:20, padding:'16px' }}>
          <WaterTracker glasses={water} target={TARGETS.water}
            onAdd={()=>{ setWater(w=>Math.min(w+1,TARGETS.water)); showToast('💧 Water logged'); }} />
        </div>
        <div style={{ background:CARD_BG, border:CARD_BORDER, borderRadius:20, padding:'16px' }}>
          <SectionHead>Streak</SectionHead>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, marginBottom:4 }}>
            <Flame style={{ width:22, height:22, color:C.amber.color,
              filter:`drop-shadow(0 0 8px ${C.amber.color}88)` }} />
            <span style={{ fontSize:38, fontWeight:900, color:'#fff', lineHeight:1,
              letterSpacing:'-0.04em' }}>{streak}</span>
          </div>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', margin:0 }}>days on track</p>
        </div>
      </div>

      {/* ── CURRENT GOAL CARD ── */}
      <div style={{ background:CARD_BG, border:CARD_BORDER, borderRadius:20,
        padding:'18px 18px', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:12 }}>
          <SectionHead>Current Goal</SectionHead>
          <button style={{ display:'flex', alignItems:'center', gap:5, fontSize:11,
            fontWeight:800, color:'rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.05)',
            border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, padding:'5px 11px',
            cursor:'pointer', letterSpacing:'0.02em' }}>
            <Pencil style={{width:11,height:11}} />Edit
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[
            { label:'Goal',     value:'Muscle Gain',                     c:C.purple },
            { label:'Calories', value:`${TARGETS.calories.toLocaleString()} kcal`, c:C.blue   },
            { label:'Protein',  value:`${TARGETS.protein}g`,             c:C.green  },
          ].map(({ label, value, c }) => (
            <div key={label} style={{ background:c.bg, border:`1px solid ${c.border}`,
              borderRadius:12, padding:'12px 10px', textAlign:'center' }}>
              <p style={{ fontSize:9.5, color:c.color, textTransform:'uppercase',
                letterSpacing:'0.1em', margin:'0 0 5px', fontWeight:900 }}>{label}</p>
              <p style={{ fontSize:13, fontWeight:800, color:'#fff', margin:0, lineHeight:1.2 }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FIXED BOTTOM CTA ── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100,
        padding:'12px 18px 34px',
        background:'linear-gradient(to top, #060810 55%, transparent)',
        borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <BigCTA label="Log Food" onClick={()=>setAddingTo('Snacks')} />
      </div>

      {/* ── Modals ── */}
      {addingTo  && <AddFoodSheet section={addingTo}  onAdd={handleAddFood} onClose={()=>setAddingTo(null)} />}
      {showScanner && <BarcodeModal onAdd={handleAddFood} onClose={()=>setScanner(false)} />}
      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}